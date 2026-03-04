// 智能路线生成服务 - 集成KIMI AI和高德地图
import { LocationPoint, RoutePoint, RouteResult } from './amapService';
import { AmapService } from './amapService';
import { kimiService } from './ai/kimiService';
import { safetyAnalysisService } from './safetyAnalysisService';
import { 
  UserProfile, 
  RoutePreferences, 
  WaypointData, 
  IntelligentRouteResult,
  RouteGenerationConfig,
  RouteValidationResult,
  AIRouteRecommendation,
  SecurityAnalysis,
  EnhancedRouteResult,
  RouteMode,
  RiskLevel,
  TimeSlot
} from '../../../types/route';
import { 
  errorHandler, 
  validateLocation, 
  validateDistance, 
  validateWaypoints,
  handleAsyncError,
  ERROR_CODES
} from '../../../utils/errorHandler';
import { 
  performanceMonitor, 
  measureAsyncPerformance, 
  measureSyncPerformance 
} from '../../../utils/performanceMonitor';

// 类型定义已移至 ../../../types/route.ts

export class IntelligentRouteService {
  private amapService: AmapService;
  private kimiService: any;
  private safetyService: any;
  private config: RouteGenerationConfig;

  constructor(
    amapService?: AmapService,
    kimiServiceInstance?: any,
    safetyService?: any,
    config?: Partial<RouteGenerationConfig>
  ) {
    // 使用提供的服务或默认服务
    const defaultAmapConfig = {
      key: import.meta.env.VITE_AMAP_API_KEY || '',
      version: '2.0',
      plugins: ['AMap.Walking', 'AMap.PlaceSearch', 'AMap.Geolocation']
    };
    this.amapService = amapService || new AmapService(defaultAmapConfig);
    this.kimiService = kimiServiceInstance || kimiService;
    this.safetyService = safetyService || safetyAnalysisService;
    
    // 默认配置
    this.config = {
      maxIterations: 5,
      qualityThreshold: 70,
      distanceTolerancePercent: 15,
      enableAI: true,
      enableSecurityAnalysis: true,
      timeout: 30000,
      ...config
    };
  }

  /**
   * 验证输入参数
   */
  private validateInputs(
    userProfile: UserProfile,
    preferences: RoutePreferences,
    currentLocation: LocationPoint,
    availableWaypoints: WaypointData[]
  ): RouteValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证用户画像
    if (!userProfile) {
      errors.push('用户画像不能为空');
    } else {
      if (!userProfile.age || userProfile.age < 10 || userProfile.age > 100) {
        errors.push('用户年龄必须在10-100岁之间');
      }
      if (!userProfile.weight || userProfile.weight < 30 || userProfile.weight > 200) {
        errors.push('用户体重必须在30-200kg之间');
      }
      if (!userProfile.height || userProfile.height < 100 || userProfile.height > 250) {
        errors.push('用户身高必须在100-250cm之间');
      }
      if (!userProfile.fitnessLevel || !['beginner', 'intermediate', 'advanced'].includes(userProfile.fitnessLevel)) {
        errors.push('健身水平必须是 beginner、intermediate 或 advanced');
      }
      if (userProfile.runningExperience < 0 || userProfile.runningExperience > 600) {
        warnings.push('跑步经验超出常规范围（0-600个月）');
      }
    }

    // 验证路线偏好
    if (!preferences) {
      errors.push('路线偏好不能为空');
    } else {
      if (!preferences.distance || preferences.distance < 0.5 || preferences.distance > 50) {
        errors.push('目标距离必须在0.5-50公里之间');
      }
      if (!preferences.difficulty || !['easy', 'medium', 'hard'].includes(preferences.difficulty)) {
        errors.push('难度等级必须是 easy、medium 或 hard');
      }
      if (!preferences.scenery || !['park', 'urban', 'waterfront', 'mixed'].includes(preferences.scenery)) {
        errors.push('风景偏好必须是 park、urban、waterfront 或 mixed');
      }
      if (!preferences.timeOfDay || !['morning', 'afternoon', 'evening', 'night'].includes(preferences.timeOfDay)) {
        errors.push('跑步时间必须是 morning、afternoon、evening 或 night');
      }
    }

    // 验证当前位置
    if (!currentLocation) {
      errors.push('当前位置不能为空');
    } else {
      if (!this.isValidLatitude(currentLocation.lat)) {
        errors.push('纬度必须在-90到90度之间');
      }
      if (!this.isValidLongitude(currentLocation.lng)) {
        errors.push('经度必须在-180到180度之间');
      }
    }

    // 验证途径点
    if (!availableWaypoints || !Array.isArray(availableWaypoints)) {
      errors.push('途径点列表不能为空');
    } else {
      if (availableWaypoints.length === 0) {
        warnings.push('没有可用的途径点，将使用基础路线生成');
      } else if (availableWaypoints.length > 50) {
        warnings.push('途径点数量过多，可能影响性能');
      }

      availableWaypoints.forEach((waypoint, index) => {
        if (!waypoint.name || waypoint.name.trim().length === 0) {
          errors.push(`途径点${index + 1}的名称不能为空`);
        }
        if (!this.isValidLatitude(waypoint.lat)) {
          errors.push(`途径点${index + 1}的纬度无效`);
        }
        if (!this.isValidLongitude(waypoint.lng)) {
          errors.push(`途径点${index + 1}的经度无效`);
        }
        if (waypoint.safetyScore !== undefined && (waypoint.safetyScore < 0 || waypoint.safetyScore > 10)) {
          warnings.push(`途径点${index + 1}的安全评分应在0-10之间`);
        }
        if (waypoint.sceneryScore !== undefined && (waypoint.sceneryScore < 0 || waypoint.sceneryScore > 10)) {
          warnings.push(`途径点${index + 1}的风景评分应在0-10之间`);
        }
      });
    }

    // 如果有错误，抛出异常
    if (errors.length > 0) {
      throw errorHandler.createError(ERROR_CODES.INVALID_PARAMS, `输入验证失败: ${errors.join('; ')}`);
    }

    // 记录警告
    if (warnings.length > 0) {
      console.warn('输入验证警告:', warnings.join('; '));
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证纬度
   */
  private isValidLatitude(lat: number): boolean {
    return typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
  }

  /**
   * 验证经度
   */
  private isValidLongitude(lng: number): boolean {
    return typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180;
  }

  /**
   * 生成智能推荐路线 - 优化版本，支持精确距离控制、错误处理和性能监控
   */
  async generateIntelligentRoute(
    userProfile: UserProfile,
    preferences: RoutePreferences,
    currentLocation: LocationPoint,
    availableWaypoints: WaypointData[]
  ): Promise<IntelligentRouteResult> {
    return await measureAsyncPerformance(
      'intelligent_route_generation',
      async () => {
        // 输入验证
        this.validateInputs(userProfile, preferences, currentLocation, availableWaypoints);

        return await handleAsyncError(
          async () => {
            console.log('开始生成智能路线...');
            console.log(`用户偏好: 距离${preferences.distance}km, 难度${preferences.difficulty}, 场景${preferences.scenery}`);

            // 1. 使用AI分析并推荐最佳路线（包含距离约束）
            const aiRecommendation = await measureAsyncPerformance(
              'ai_route_recommendation',
              () => this.getAIRouteRecommendation(userProfile, preferences, currentLocation, availableWaypoints),
              { enableAI: this.config.enableAI }
            );

            console.log(`AI推荐路线模式: ${aiRecommendation.result.routeMode || '自适应'}`);
            console.log(`AI估计距离: ${aiRecommendation.result.distanceEstimate || '未指定'}km`);

            // 2. 基于AI推荐选择最佳途径点（基于距离和AI推荐）
            const selectedWaypoints = measureSyncPerformance(
              'waypoint_selection',
              () => this.selectOptimalWaypoints(
                aiRecommendation.result.waypoints,
                availableWaypoints,
                preferences
              ),
              { totalWaypoints: availableWaypoints.length }
            );

            console.log(`选择了 ${selectedWaypoints.result.length} 个途径点`);

            // 3. 生成详细路线（包含精确距离控制和质量验证）
            const routeResult = await measureAsyncPerformance(
              'detailed_route_generation',
              () => this.generateDetailedRoute(currentLocation, selectedWaypoints.result, preferences),
              { finalWaypoints: selectedWaypoints.result.length }
            );

            // 4. 计算个性化指标
            const personalizedMetrics = measureSyncPerformance(
              'personalized_metrics_calculation',
              () => this.calculatePersonalizedMetrics(routeResult.result, userProfile, preferences)
            );

            // 5. 最终质量检查
            const finalValidation = measureSyncPerformance(
              'route_quality_validation',
              () => this.validateRouteQuality(routeResult.result, preferences.distance * 1000, preferences)
            );
            
            const result: IntelligentRouteResult = {
              id: Date.now().toString(),
              name: `智能路线 ${new Date().toLocaleTimeString()}`,
              description: '基于您的偏好和当前位置智能生成的跑步路线',
              distance: routeResult.result.distance,
              duration: routeResult.result.duration,
              paths: routeResult.result.paths,
              elevationGain: Math.round(Math.random() * 100 + 50),
              calories: Math.round(routeResult.result.distance / 1000 * userProfile.weight * 0.75),
              path: routeResult.result.paths[0] || [],
              safetyScore: routeResult.result.safetyScore || 8,
              sceneryScore: Math.floor(Math.random() * 3) + 7,
              qualityScore: finalValidation.result.qualityScore || 85,
              aiRecommendation: aiRecommendation.result.explanation,
              personalizedTips: [
                ...aiRecommendation.result.tips,
                `路线质量评分: ${finalValidation.result.qualityScore}/100`,
                `距离精度: ${(100 - finalValidation.result.distanceError).toFixed(1)}%`
              ],
              waypoints: selectedWaypoints.result,
              ...personalizedMetrics.result
            };

            console.log(`智能路线生成完成！实际距离: ${(routeResult.result.distance/1000).toFixed(2)}km, 目标距离: ${preferences.distance}km`);
            
            return result;
          },
          ERROR_CODES.ROUTE_GENERATION_FAILED,
          '智能路线生成失败'
        );
      },
      {
        userProfile: userProfile.fitnessLevel,
        targetDistance: preferences.distance,
        waypointCount: availableWaypoints.length,
        enableAI: this.config.enableAI,
        enableSecurity: this.config.enableSecurityAnalysis
      }
    ).then(result => result.result).catch(async (error) => {
      console.error('智能路线生成失败:', error);
      console.log('降级到基础路线生成...');
      // 降级到基础路线生成
      const fallbackRoute = await this.generateOutAndBackRoute(currentLocation, availableWaypoints, preferences.distance * 1000, preferences);
      
      // 转换为 IntelligentRouteResult
      const fallbackMetrics = this.calculatePersonalizedMetrics(fallbackRoute, userProfile, preferences);
      
      return {
        id: Date.now().toString(),
        name: '基础往返路线',
        description: '由于AI服务不可用，已为您生成基础往返路线',
        distance: fallbackRoute.distance,
        duration: fallbackRoute.duration,
        paths: fallbackRoute.paths,
        elevationGain: Math.round(Math.random() * 50 + 25),
        calories: Math.round(fallbackRoute.distance / 1000 * userProfile.weight * 0.75),
        path: fallbackRoute.paths[0] || [],
        safetyScore: fallbackRoute.safetyScore || 7,
        sceneryScore: 6,
        qualityScore: 75,
        aiRecommendation: '由于AI服务不可用，已为您生成基础往返路线',
        personalizedTips: [
          '这是一条基础往返路线',
          '建议保持稳定配速',
          '注意安全，特别是返程时的路况'
        ],
        waypoints: availableWaypoints.slice(0, 3), // 使用前3个途径点
        ...fallbackMetrics
      };
    });
  }

  /**
   * 调用KIMI AI获取路线推荐
   */
  private async getAIRouteRecommendation(
    userProfile: UserProfile,
    preferences: RoutePreferences,
    currentLocation: LocationPoint,
    waypoints: WaypointData[]
  ): Promise<{
    waypoints: string[];
    explanation: string;
    tips: string[];
    routeMode?: string;
    distanceEstimate?: number;
  }> {
    const prompt = this.buildRouteRecommendationPrompt(
      userProfile,
      preferences,
      currentLocation,
      waypoints
    );

    try {
      // 使用 KimiService 调用 AI
      const aiResponse = await this.kimiService.generateResponse(prompt);

      // 解析AI响应
      return this.parseAIResponse(aiResponse);
    } catch (error) {
      console.error('KIMI AI调用失败:', error);
      throw error;
    }
  }

  /**
   * 构建路线推荐提示词
   */
  private buildRouteRecommendationPrompt(
    userProfile: UserProfile,
    preferences: RoutePreferences,
    currentLocation: LocationPoint,
    waypoints: WaypointData[]
  ): string {
    const targetDistanceM = preferences.distance * 1000;
    const minDistance = targetDistanceM * 0.9;
    const maxDistance = targetDistanceM * 1.1;
    
    return `
作为专业跑步教练和路线规划专家，请为用户推荐最适合的跑步路线。

**用户信息：**
- 年龄：${userProfile.age}岁
- 体重：${userProfile.weight}kg，身高：${userProfile.height}cm
- 健身水平：${this.translateFitnessLevel(userProfile.fitnessLevel)}
- 跑步经验：${userProfile.runningExperience}个月
- 偏好距离：${userProfile.preferredDistance}公里
${userProfile.healthConditions?.length ? `- 健康状况：${userProfile.healthConditions.join('、')}` : ''}

**路线偏好：**
- 目标距离：${preferences.distance}公里（严格要求：${(minDistance/1000).toFixed(1)}-${(maxDistance/1000).toFixed(1)}公里范围内）
- 难度要求：${this.translateDifficulty(preferences.difficulty)}
- 风景偏好：${this.translateScenery(preferences.scenery)}
- 避开交通：${preferences.avoidTraffic ? '是' : '否'}
- 优先安全：${preferences.preferSafety ? '是' : '否'}
- 跑步时间：${this.translateTimeOfDay(preferences.timeOfDay)}

**当前位置：** 纬度${currentLocation.lat}，经度${currentLocation.lng}

**可选途径点：**
${waypoints.map((wp, index) => 
  `${index + 1}. ${wp.name} (${wp.desc}) - 纬度${wp.lat}，经度${wp.lng}
     ${wp.elevation ? `海拔：${wp.elevation}m` : ''}
     ${wp.safetyScore ? `安全评分：${wp.safetyScore}/10` : ''}
     ${wp.sceneryScore ? `风景评分：${wp.sceneryScore}/10` : ''}
     ${wp.trafficLevel ? `交通繁忙度：${wp.trafficLevel}/10` : ''}`
).join('\n')}

**距离控制要求（重要）：**
- 必须严格控制路线总距离在${(minDistance/1000).toFixed(1)}-${(maxDistance/1000).toFixed(1)}公里范围内
- 可以选择以下路线模式之一：
  1. 环形路线：起点→途径点→回到起点
  2. 往返路线：起点→途径点→原路返回
  3. 线性路线：起点→多个途径点→终点
- 根据目标距离智能选择途径点数量和组合
- 优先考虑距离匹配度，其次考虑其他偏好

**请提供以下格式的推荐：**

ROUTE_MODE: [选择的路线模式：loop/out-and-back/linear]

WAYPOINTS: [选择的途径点名称，用逗号分隔，确保总距离符合要求]

DISTANCE_ESTIMATE: [预估总距离（公里），必须在目标范围内]

EXPLANATION: [详细解释路线选择理由，包括：
1. 为什么选择这种路线模式
2. 途径点选择的距离考虑
3. 如何确保距离符合要求
4. 考虑用户偏好的平衡]

TIPS: [给用户的个性化建议，包括：
1. 跑步节奏建议
2. 注意事项
3. 营养补充建议
4. 安全提醒
每条建议用"|"分隔]

**关键要求：**
1. 距离控制是第一优先级，必须在±10%范围内
2. 根据用户体能水平选择合适的路线复杂度
3. 平衡安全性、风景和距离要求
4. 提供实用的个性化跑步建议
5. 确保路线具有良好的跑步体验
`;
  }

  /**
   * 解析AI响应
   */
  private parseAIResponse(response: string): {
    waypoints: string[];
    explanation: string;
    tips: string[];
    routeMode?: string;
    distanceEstimate?: number;
  } {
    const routeModeMatch = response.match(/ROUTE_MODE:\s*(.+)/);
    const waypointsMatch = response.match(/WAYPOINTS:\s*(.+)/);
    const distanceMatch = response.match(/DISTANCE_ESTIMATE:\s*(.+)/);
    const explanationMatch = response.match(/EXPLANATION:\s*([\s\S]+?)(?=TIPS:|$)/);
    const tipsMatch = response.match(/TIPS:\s*([\s\S]+)/);

    const routeMode = routeModeMatch ? routeModeMatch[1].trim() : 'adaptive';
    
    const waypoints = waypointsMatch 
      ? waypointsMatch[1].split(',').map(w => w.trim())
      : [];

    const distanceEstimate = distanceMatch 
      ? parseFloat(distanceMatch[1].replace(/[^\d.]/g, ''))
      : 0;

    const explanation = explanationMatch 
      ? explanationMatch[1].trim()
      : '基于您的个人情况和距离要求，我为您推荐了这条经过精确计算的跑步路线。';

    const tips = tipsMatch 
      ? tipsMatch[1].split('|').map(t => t.trim()).filter(t => t)
      : ['保持适中的跑步节奏', '注意补充水分', '注意交通安全'];

    return { waypoints, explanation, tips, routeMode, distanceEstimate };
  }

  /**
   * 选择最优途径点
   */
  private selectOptimalWaypoints(
    aiSelectedNames: string[],
    availableWaypoints: WaypointData[],
    preferences: RoutePreferences
  ): WaypointData[] {
    const selected: WaypointData[] = [];

    // 首先添加AI推荐的点位
    for (const name of aiSelectedNames) {
      const waypoint = availableWaypoints.find(wp => 
        wp.name.includes(name) || name.includes(wp.name)
      );
      if (waypoint && !selected.includes(waypoint)) {
        selected.push(waypoint);
      }
    }

    // 如果AI推荐的点位不足，根据偏好补充
    if (selected.length < 3) {
      const remaining = availableWaypoints.filter(wp => !selected.includes(wp));
      
      // 根据偏好排序
      remaining.sort((a, b) => {
        let scoreA = 0, scoreB = 0;

        if (preferences.preferSafety) {
          scoreA += (a.safetyScore || 5) * 2;
          scoreB += (b.safetyScore || 5) * 2;
        }

        if (preferences.scenery !== 'urban') {
          scoreA += (a.sceneryScore || 5);
          scoreB += (b.sceneryScore || 5);
        }

        if (preferences.avoidTraffic) {
          scoreA -= (a.trafficLevel || 5);
          scoreB -= (b.trafficLevel || 5);
        }

        return scoreB - scoreA;
      });

      // 添加评分最高的点位
      const needed = Math.min(3 - selected.length, remaining.length);
      selected.push(...remaining.slice(0, needed));
    }

    return selected;
  }

  /**
   * 生成详细路线 - 支持精确距离控制
   */
  private async generateDetailedRoute(
    start: LocationPoint,
    waypoints: WaypointData[],
    preferences: RoutePreferences
  ): Promise<RouteResult> {
    const targetDistance = preferences.distance * 1000; // 转换为米
    
    console.log(`开始生成路线，目标距离: ${(targetDistance/1000).toFixed(1)}km`);
    
    // 尝试不同的路线生成策略
    let bestRoute = await this.generateOptimalRoute(start, waypoints, targetDistance, preferences);
    
    // 验证和优化路线质量
    const validation = this.validateRouteQuality(bestRoute, targetDistance, preferences);
    
    if (!validation.isValid) {
      console.log(`初始路线质量不达标，开始优化...`);
      console.log(`问题列表:`, validation.issues);
      
      // 使用智能优化算法
      bestRoute = await this.optimizeRoute(bestRoute, targetDistance, preferences);
      
      // 如果优化后仍不满足要求，尝试调整策略
      const finalValidation = this.validateRouteQuality(bestRoute, targetDistance, preferences);
      if (!finalValidation.isValid && finalValidation.distanceError > 10) {
        console.log(`优化后仍不满足要求，使用距离调整策略...`);
        bestRoute = await this.adjustRouteDistance(bestRoute, targetDistance, start, waypoints, preferences);
      }
    }

    // 最终验证
    const finalValidation = this.validateRouteQuality(bestRoute, targetDistance, preferences);
    console.log(`路线生成完成，最终质量评分: ${finalValidation.qualityScore}，距离偏差: ${finalValidation.distanceError.toFixed(1)}%`);

    return bestRoute;
  }

  /**
   * 生成最优路线
   */
  private async generateOptimalRoute(
    start: LocationPoint,
    waypoints: WaypointData[],
    targetDistance: number,
    preferences: RoutePreferences
  ): Promise<RouteResult> {
    // 根据目标距离选择合适的路线模式
    const routeMode = this.determineRouteMode(targetDistance, waypoints.length);
    
    switch (routeMode) {
      case 'loop':
        return this.generateLoopRoute(start, waypoints, targetDistance, preferences);
      case 'out-and-back':
        return this.generateOutAndBackRoute(start, waypoints, targetDistance, preferences);
      case 'linear':
        return this.generateLinearRoute(start, waypoints, targetDistance, preferences);
      default:
        return this.generateAdaptiveRoute(start, waypoints, targetDistance, preferences);
    }
  }

  /**
   * 确定路线模式
   */
  private determineRouteMode(targetDistance: number, waypointCount: number): string {
    if (targetDistance < 2000) return 'loop'; // 短距离优先环形
    if (targetDistance > 10000) return 'linear'; // 长距离线性路线
    if (waypointCount >= 4) return 'loop'; // 途径点多时环形
    return 'out-and-back'; // 默认往返
  }

  /**
   * 生成环形路线
   */
  private async generateLoopRoute(
    start: LocationPoint,
    waypoints: WaypointData[],
    targetDistance: number,
    preferences: RoutePreferences
  ): Promise<RouteResult> {
    // 选择最优途径点组合形成环路
    const selectedWaypoints = this.selectWaypointsForDistance(waypoints, targetDistance, 'loop');
    
    // 构建环形路径：起点 -> 途径点们 -> 回到起点
    const points = [
      { lng: start.lng, lat: start.lat },
      ...selectedWaypoints.map(wp => ({ lng: wp.lng, lat: wp.lat })),
      { lng: start.lng, lat: start.lat } // 回到起点
    ];

    const distance = this.calculatePathDistance(points);
    const duration = this.estimateDuration(distance, preferences);

    return {
      distance,
      duration,
      paths: [points],
      safetyScore: this.calculateAverageSafetyScore(selectedWaypoints)
    };
  }

  /**
   * 生成往返路线
   */
  private async generateOutAndBackRoute(
    start: LocationPoint,
    waypoints: WaypointData[],
    targetDistance: number,
    preferences: RoutePreferences
  ): Promise<RouteResult> {
    const halfDistance = targetDistance / 2;
    const selectedWaypoints = this.selectWaypointsForDistance(waypoints, halfDistance, 'linear');
    
    // 构建往返路径
    const outboundPoints = [
      { lng: start.lng, lat: start.lat },
      ...selectedWaypoints.map(wp => ({ lng: wp.lng, lat: wp.lat }))
    ];
    
    // 返程路径（反向）
    const returnPoints = [...outboundPoints].reverse();
    const allPoints = [...outboundPoints, ...returnPoints.slice(1)]; // 避免重复起点

    const distance = this.calculatePathDistance(allPoints);
    const duration = this.estimateDuration(distance, preferences);

    return {
      distance,
      duration,
      paths: [allPoints],
      safetyScore: this.calculateAverageSafetyScore(selectedWaypoints)
    };
  }

  /**
   * 生成线性路线
   */
  private async generateLinearRoute(
    start: LocationPoint,
    waypoints: WaypointData[],
    targetDistance: number,
    preferences: RoutePreferences
  ): Promise<RouteResult> {
    const selectedWaypoints = this.selectWaypointsForDistance(waypoints, targetDistance, 'linear');
    
    const points = [
      { lng: start.lng, lat: start.lat },
      ...selectedWaypoints.map(wp => ({ lng: wp.lng, lat: wp.lat }))
    ];

    const distance = this.calculatePathDistance(points);
    const duration = this.estimateDuration(distance, preferences);

    return {
      distance,
      duration,
      paths: [points],
      safetyScore: this.calculateAverageSafetyScore(selectedWaypoints)
    };
  }

  /**
   * 生成自适应路线
   */
  private async generateAdaptiveRoute(
    start: LocationPoint,
    waypoints: WaypointData[],
    targetDistance: number,
    preferences: RoutePreferences
  ): Promise<RouteResult> {
    // 智能选择最佳途径点组合
    const bestCombination = this.findBestWaypointCombination(start, waypoints, targetDistance, preferences);
    
    const points = [
      { lng: start.lng, lat: start.lat },
      ...bestCombination.map(wp => ({ lng: wp.lng, lat: wp.lat }))
    ];

    const distance = this.calculatePathDistance(points);
    const duration = this.estimateDuration(distance, preferences);

    return {
      distance,
      duration,
      paths: [points],
      safetyScore: this.calculateAverageSafetyScore(bestCombination)
    };
  }

  /**
   * 根据距离选择途径点
   */
  private selectWaypointsForDistance(
    waypoints: WaypointData[],
    targetDistance: number,
    mode: string
  ): WaypointData[] {
    const maxWaypoints = Math.min(waypoints.length, mode === 'loop' ? 4 : 6);
    let bestCombination: WaypointData[] = [];
    let bestScore = Infinity;

    // 尝试不同数量的途径点组合
    for (let count = 1; count <= maxWaypoints; count++) {
      const combinations = this.getCombinations(waypoints, count);
      
      for (const combination of combinations) {
        const estimatedDistance = this.estimateRouteDistance(combination, mode);
        const distanceError = Math.abs(estimatedDistance - targetDistance);
        
        if (distanceError < bestScore) {
          bestScore = distanceError;
          bestCombination = combination;
        }
      }
    }

    return bestCombination;
  }

  /**
   * 寻找最佳途径点组合
   */
  private findBestWaypointCombination(
    start: LocationPoint,
    waypoints: WaypointData[],
    targetDistance: number,
    preferences: RoutePreferences
  ): WaypointData[] {
    let bestCombination: WaypointData[] = [];
    let bestScore = Infinity;

    // 尝试不同的途径点组合
    const maxCombinations = Math.min(50, Math.pow(2, waypoints.length)); // 限制计算量
    
    for (let i = 1; i < maxCombinations; i++) {
      const combination: WaypointData[] = [];
      
      for (let j = 0; j < waypoints.length; j++) {
        if (i & (1 << j)) {
          combination.push(waypoints[j]);
        }
      }

      if (combination.length === 0 || combination.length > 6) continue;

      // 计算这个组合的评分
      const score = this.evaluateWaypointCombination(start, combination, targetDistance, preferences);
      
      if (score < bestScore) {
        bestScore = score;
        bestCombination = combination;
      }
    }

    return bestCombination.length > 0 ? bestCombination : waypoints.slice(0, 3);
  }

  /**
   * 评估途径点组合
   */
  private evaluateWaypointCombination(
    start: LocationPoint,
    waypoints: WaypointData[],
    targetDistance: number,
    preferences: RoutePreferences
  ): number {
    const points = [
      { lng: start.lng, lat: start.lat },
      ...waypoints.map(wp => ({ lng: wp.lng, lat: wp.lat }))
    ];

    const actualDistance = this.calculatePathDistance(points);
    const distanceError = Math.abs(actualDistance - targetDistance) / targetDistance;
    
    // 综合评分：距离误差 + 偏好匹配度
    let score = distanceError * 100; // 距离误差权重

    // 安全性评分
    if (preferences.preferSafety) {
      const avgSafety = this.calculateAverageSafetyScore(waypoints);
      score -= (avgSafety - 5) * 2; // 安全性加分
    }

    // 风景评分
    const avgScenery = waypoints.reduce((sum, wp) => sum + (wp.sceneryScore || 5), 0) / waypoints.length;
    score -= (avgScenery - 5) * 1; // 风景加分

    return score;
  }

  /**
   * 计算个性化指标
   */
  private calculatePersonalizedMetrics(
    route: RouteResult,
    userProfile: UserProfile,
    preferences: RoutePreferences
  ): {
    difficultyRating: number;
    difficulty: number;
    sceneryRating: number;
    estimatedCalories: number;
    weatherConsiderations?: string[];
  } {
    // 计算难度评级
    const difficultyRating = this.calculateDifficultyRating(route, userProfile, preferences);
    
    // 计算风景评级
    const sceneryRating = this.calculateSceneryRating(route, preferences);
    
    // 计算预估卡路里消耗
    const estimatedCalories = this.calculateEstimatedCalories(route, userProfile);
    
    // 天气考虑因素
    const weatherConsiderations = this.getWeatherConsiderations(preferences.timeOfDay);

    return {
      difficultyRating,
      difficulty: difficultyRating, // 添加 difficulty 属性，与 difficultyRating 相同
      sceneryRating,
      estimatedCalories,
      weatherConsiderations
    };
  }

  /**
   * 计算难度评级
   */
  private calculateDifficultyRating(
    route: RouteResult,
    userProfile: UserProfile,
    preferences: RoutePreferences
  ): number {
    let difficulty = 5; // 基础难度

    // 基于距离调整
    const distanceKm = route.distance / 1000;
    if (distanceKm > userProfile.preferredDistance * 1.2) {
      difficulty += 2;
    } else if (distanceKm < userProfile.preferredDistance * 0.8) {
      difficulty -= 1;
    }

    // 基于用户健身水平调整
    const fitnessAdjustment = {
      'beginner': 2,
      'intermediate': 0,
      'advanced': -2
    };
    difficulty += fitnessAdjustment[userProfile.fitnessLevel];

    // 基于偏好难度调整
    const difficultyAdjustment = {
      'easy': -2,
      'medium': 0,
      'hard': 2
    };
    difficulty += difficultyAdjustment[preferences.difficulty];

    return Math.max(1, Math.min(10, difficulty));
  }

  /**
   * 计算风景评级
   */
  private calculateSceneryRating(route: RouteResult, preferences: RoutePreferences): number {
    let sceneryRating = 5; // 基础评分

    // 基于风景偏好调整
    const sceneryBonus = {
      'park': 3,
      'waterfront': 2,
      'mixed': 1,
      'urban': 0
    };
    sceneryRating += sceneryBonus[preferences.scenery];

    return Math.max(1, Math.min(10, sceneryRating));
  }

  /**
   * 计算预估卡路里消耗
   */
  private calculateEstimatedCalories(route: RouteResult, userProfile: UserProfile): number {
    const distanceKm = route.distance / 1000;
    const durationHours = route.duration / 3600;
    
    // 基础代谢率计算（简化版）
    const bmr = userProfile.weight * 0.75; // 每小时每公斤体重消耗的卡路里
    
    // 跑步强度系数
    const intensityFactor = 8; // 跑步的MET值
    
    const calories = bmr * intensityFactor * durationHours;
    
    return Math.round(calories);
  }

  /**
   * 获取天气考虑因素
   */
  private getWeatherConsiderations(timeOfDay: string): string[] {
    const considerations: string[] = [];

    switch (timeOfDay) {
      case 'morning':
        considerations.push('早晨温度较低，注意保暖');
        considerations.push('空气质量通常较好');
        break;
      case 'afternoon':
        considerations.push('注意防晒和补水');
        considerations.push('避开最热时段');
        break;
      case 'evening':
        considerations.push('注意能见度，穿着反光服装');
        considerations.push('温度适宜，但要注意安全');
        break;
      case 'night':
        considerations.push('确保充足照明设备');
        considerations.push('选择安全路段，避免偏僻区域');
        break;
    }

    return considerations;
  }

  /**
   * 调整路线距离
   */
  private async adjustRouteDistance(
    route: RouteResult,
    targetDistance: number,
    start: LocationPoint,
    waypoints: WaypointData[],
    preferences: RoutePreferences
  ): Promise<RouteResult> {
    const currentDistance = route.distance;
    const distanceRatio = targetDistance / currentDistance;
    
    console.log(`调整路线距离，当前: ${(currentDistance/1000).toFixed(2)}km，目标: ${(targetDistance/1000).toFixed(2)}km，比例: ${distanceRatio.toFixed(2)}`);
    
    if (distanceRatio > 1.2) {
      // 需要显著增加距离，使用多段路线策略
      return this.generateMultiSegmentRoute(start, waypoints, targetDistance, preferences);
    } else if (distanceRatio < 0.8) {
      // 需要显著减少距离，使用直线优化策略
      return this.generateDirectRoute(start, waypoints, targetDistance, preferences);
    } else {
      // 微调距离
      return this.finetuneRouteDistance(route, targetDistance);
    }
  }

  /**
   * 生成多段路线（用于增加距离）
   */
  private async generateMultiSegmentRoute(
    start: LocationPoint,
    waypoints: WaypointData[],
    targetDistance: number,
    preferences: RoutePreferences
  ): Promise<RouteResult> {
    const segments: LocationPoint[] = [{ lng: start.lng, lat: start.lat }];
    let remainingDistance = targetDistance;
    
    // 选择最佳途径点组合
    const selectedWaypoints = this.selectWaypointsForDistance(waypoints, targetDistance, 'multi-segment');
    
    // 为每个途径点创建往返段
    for (const waypoint of selectedWaypoints) {
      if (remainingDistance <= 500) break; // 剩余距离太少时停止
      
      const segmentDistance = Math.min(remainingDistance / 2, 2000); // 每段最多2km
      
      // 添加去程点
      segments.push({ lng: waypoint.lng, lat: waypoint.lat });
      
      // 如果还有足够距离，添加返程点
      if (remainingDistance > segmentDistance) {
        segments.push({ lng: start.lng, lat: start.lat });
        remainingDistance -= segmentDistance * 2;
      } else {
        remainingDistance = 0;
      }
    }
    
    // 确保回到起点
    if (segments[segments.length - 1].lng !== start.lng || segments[segments.length - 1].lat !== start.lat) {
      segments.push({ lng: start.lng, lat: start.lat });
    }
    
    const distance = this.calculatePathDistance(segments);
    const duration = this.estimateDuration(distance, preferences);
    
    return {
      distance,
      duration,
      paths: [segments],
      safetyScore: this.calculateAverageSafetyScore(selectedWaypoints)
    };
  }

  /**
   * 生成直线路线（用于减少距离）
   */
  private async generateDirectRoute(
    start: LocationPoint,
    waypoints: WaypointData[],
    targetDistance: number,
    preferences: RoutePreferences
  ): Promise<RouteResult> {
    // 选择最近的1-2个途径点
    const sortedWaypoints = waypoints
      .map(wp => ({
        ...wp,
        distance: this.calculateDistance(start, wp)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2);
    
    const points = [
      { lng: start.lng, lat: start.lat },
      ...sortedWaypoints.map(wp => ({ lng: wp.lng, lat: wp.lat }))
    ];
    
    // 如果距离仍然不够，只保留最近的一个点
    let currentDistance = this.calculatePathDistance(points);
    if (currentDistance > targetDistance * 1.1 && points.length > 2) {
      points.splice(1, points.length - 2); // 只保留起点和最近的一个点
      currentDistance = this.calculatePathDistance(points);
    }
    
    const duration = this.estimateDuration(currentDistance, preferences);
    
    return {
      distance: currentDistance,
      duration,
      paths: [points],
      safetyScore: sortedWaypoints.length > 0 ? (sortedWaypoints[0].safetyScore || 7) : 7
    };
  }

  /**
   * 微调路线距离
   */
  private finetuneRouteDistance(route: RouteResult, targetDistance: number): RouteResult {
    const points = [...route.paths[0]];
    const currentDistance = route.distance;
    const distanceError = targetDistance - currentDistance;
    
    if (Math.abs(distanceError) < 100) {
      // 误差很小，不需要调整
      return route;
    }
    
    if (distanceError > 0 && points.length >= 2) {
      // 需要增加距离，在中间添加小的绕路
      const midIndex = Math.floor(points.length / 2);
      const detourPoint = this.generateDetourPoint(
        points[midIndex - 1],
        points[midIndex],
        Math.abs(distanceError)
      );
      points.splice(midIndex, 0, detourPoint);
    } else if (distanceError < 0 && points.length > 3) {
      // 需要减少距离，移除一个中间点
      const midIndex = Math.floor(points.length / 2);
      points.splice(midIndex, 1);
    }
    
    const newDistance = this.calculatePathDistance(points);
    
    return {
      ...route,
      distance: newDistance,
      paths: [points],
      duration: this.estimateDuration(newDistance, { difficulty: 'medium' } as RoutePreferences)
    };
  }

  /**
   * 集成安全监控分析
   */
  async integrateSecurityMonitoring(
    route: RouteResult,
    preferences: RoutePreferences,
    currentTime?: Date
  ): Promise<{
    enhancedRoute: RouteResult;
    securityAnalysis: {
      overallSafetyScore: number;
      riskHotspots: Array<{
        location: LocationPoint;
        riskLevel: 'low' | 'medium' | 'high';
        riskFactors: string[];
        description: string;
      }>;
      timeBasedRisks: Array<{
        timeSlot: string;
        riskLevel: number;
        recommendations: string[];
      }>;
      alternativeRoutes?: RouteResult[];
    };
  }> {
    const time = currentTime || new Date();
    const timeSlot = this.getTimeSlot(time);
    
    // 分析路线上每个点的安全性
    const pathPoints = route.paths[0];
    const riskHotspots = await this.analyzeRouteSecurityRisks(pathPoints, timeSlot);
    
    // 计算整体安全评分
    const overallSafetyScore = this.calculateRouteSafetyScore(pathPoints, riskHotspots, timeSlot);
    
    // 生成时间段风险分析
    const timeBasedRisks = this.analyzeTimeBasedRisks(pathPoints, preferences);
    
    // 如果安全评分过低，生成替代路线
    let alternativeRoutes: RouteResult[] | undefined;
    if (overallSafetyScore < 60) {
      console.log(`路线安全评分较低(${overallSafetyScore})，生成替代路线...`);
      alternativeRoutes = await this.generateSaferAlternativeRoutes(
        pathPoints[0],
        pathPoints[pathPoints.length - 1],
        preferences,
        riskHotspots
      );
    }
    
    // 增强路线信息
    const enhancedRoute: RouteResult = {
      ...route,
      safetyScore: overallSafetyScore
    };
    
    return {
      enhancedRoute,
      securityAnalysis: {
        overallSafetyScore,
        riskHotspots,
        timeBasedRisks,
        alternativeRoutes
      }
    };
  }

  /**
   * 分析路线安全风险
   */
  private async analyzeRouteSecurityRisks(
    pathPoints: LocationPoint[],
    timeSlot: string
  ): Promise<Array<{
    location: LocationPoint;
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    description: string;
  }>> {
    const riskHotspots = [];
    
    for (let i = 0; i < pathPoints.length; i++) {
      const point = pathPoints[i];
      const riskAnalysis = await this.analyzePointSecurity(point, timeSlot);
      
      if (riskAnalysis.riskLevel !== 'low') {
        riskHotspots.push({
          location: point,
          riskLevel: riskAnalysis.riskLevel,
          riskFactors: riskAnalysis.riskFactors,
          description: riskAnalysis.description
        });
      }
    }
    
    return riskHotspots;
  }

  /**
   * 分析单点安全性
   */
  private async analyzePointSecurity(
    point: LocationPoint,
    timeSlot: string
  ): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    description: string;
  }> {
    const riskFactors: string[] = [];
    let riskScore = 0;
    
    // 基于时间段的风险评估
    const timeRiskMap = {
      'early_morning': 30,
      'morning': 10,
      'late_morning': 15,
      'afternoon': 20,
      'evening': 40,
      'night': 70,
      'late_night': 90
    };
    
    const timeRisk = timeRiskMap[timeSlot as keyof typeof timeRiskMap] || 50;
    riskScore += timeRisk;
    
    if (timeRisk > 60) {
      riskFactors.push('高风险时段');
    }
    
    // 基于地理位置的风险评估（模拟）
    const locationRisk = this.getLocationRiskScore(point);
    riskScore += locationRisk;
    
    if (locationRisk > 40) {
      riskFactors.push('高风险区域');
    }
    
    // 基于周边环境的风险评估
    const environmentRisk = this.getEnvironmentRiskScore(point);
    riskScore += environmentRisk;
    
    if (environmentRisk > 30) {
      riskFactors.push('环境风险');
    }
    
    // 确定风险等级
    let riskLevel: 'low' | 'medium' | 'high';
    if (riskScore < 40) {
      riskLevel = 'low';
    } else if (riskScore < 70) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'high';
    }
    
    const description = this.generateRiskDescription(riskLevel, riskFactors);
    
    return {
      riskLevel,
      riskFactors,
      description
    };
  }

  /**
   * 获取位置风险评分
   */
  private getLocationRiskScore(point: LocationPoint): number {
    // 模拟基于历史数据的位置风险评分
    const lat = point.lat;
    const lng = point.lng;
    
    // 模拟一些高风险区域
    if (lat > 31.2 && lat < 31.25 && lng > 121.45 && lng < 121.5) {
      return 60; // 高风险区域
    } else if (lat > 31.15 && lat < 31.3 && lng > 121.4 && lng < 121.55) {
      return 30; // 中等风险区域
    }
    
    return 10; // 低风险区域
  }

  /**
   * 获取环境风险评分
   */
  private getEnvironmentRiskScore(point: LocationPoint): number {
    // 模拟环境风险评估
    // 实际实现中应该考虑：照明条件、人流密度、交通状况等
    return Math.random() * 40; // 0-40的随机风险评分
  }

  /**
   * 生成风险描述
   */
  private generateRiskDescription(riskLevel: string, riskFactors: string[]): string {
    const descriptions = {
      low: '该区域安全性较好，适合跑步',
      medium: `该区域存在一定风险：${riskFactors.join('、')}，建议谨慎通过`,
      high: `该区域风险较高：${riskFactors.join('、')}，建议避开或结伴通过`
    };
    
    return descriptions[riskLevel as keyof typeof descriptions] || '风险评估中';
  }

  /**
   * 计算路线安全评分
   */
  private calculateRouteSafetyScore(
    pathPoints: LocationPoint[],
    riskHotspots: Array<{ riskLevel: string }>,
    timeSlot: string
  ): number {
    let baseScore = 80; // 基础安全评分
    
    // 基于时间段调整
    const timeAdjustments = {
      'early_morning': -10,
      'morning': +10,
      'late_morning': +5,
      'afternoon': 0,
      'evening': -15,
      'night': -30,
      'late_night': -40
    };
    
    baseScore += timeAdjustments[timeSlot as keyof typeof timeAdjustments] || 0;
    
    // 基于风险热点扣分
    const highRiskCount = riskHotspots.filter(h => h.riskLevel === 'high').length;
    const mediumRiskCount = riskHotspots.filter(h => h.riskLevel === 'medium').length;
    
    baseScore -= highRiskCount * 15;
    baseScore -= mediumRiskCount * 8;
    
    // 基于路线长度调整（长路线风险相对较高）
    const routeLength = pathPoints.length;
    if (routeLength > 8) {
      baseScore -= 5;
    }
    
    return Math.max(0, Math.min(100, baseScore));
  }

  /**
   * 分析时间段风险
   */
  private analyzeTimeBasedRisks(
    pathPoints: LocationPoint[],
    preferences: RoutePreferences
  ): Array<{
    timeSlot: string;
    riskLevel: number;
    recommendations: string[];
  }> {
    const timeSlots = ['early_morning', 'morning', 'late_morning', 'afternoon', 'evening', 'night', 'late_night'];
    
    return timeSlots.map(slot => {
      const riskLevel = this.calculateTimeSlotRisk(slot, pathPoints);
      const recommendations = this.generateTimeSlotRecommendations(slot, riskLevel, preferences);
      
      return {
        timeSlot: slot,
        riskLevel,
        recommendations
      };
    });
  }

  /**
   * 计算时间段风险
   */
  private calculateTimeSlotRisk(timeSlot: string, pathPoints: LocationPoint[]): number {
    const baseRisks = {
      'early_morning': 40,
      'morning': 20,
      'late_morning': 25,
      'afternoon': 30,
      'evening': 50,
      'night': 75,
      'late_night': 90
    };
    
    let risk = baseRisks[timeSlot as keyof typeof baseRisks] || 50;
    
    // 基于路线特征调整风险
    if (pathPoints.length > 6) {
      risk += 10; // 复杂路线增加风险
    }
    
    return Math.min(100, risk);
  }

  /**
   * 生成时间段建议
   */
  private generateTimeSlotRecommendations(
    timeSlot: string,
    riskLevel: number,
    preferences: RoutePreferences
  ): string[] {
    const recommendations: string[] = [];
    
    if (riskLevel > 70) {
      recommendations.push('强烈建议避开此时段跑步');
      recommendations.push('如必须在此时段跑步，请结伴同行');
      recommendations.push('携带照明设备和紧急联系方式');
    } else if (riskLevel > 50) {
      recommendations.push('建议谨慎选择此时段跑步');
      recommendations.push('注意周围环境，保持警觉');
      recommendations.push('选择人流较多的路段');
    } else if (riskLevel > 30) {
      recommendations.push('此时段相对安全，但仍需注意');
      recommendations.push('保持正常的安全意识');
    } else {
      recommendations.push('此时段安全性较好，适合跑步');
    }
    
    // 基于用户偏好添加建议
    if (preferences.preferSafety) {
      recommendations.push('建议选择安全评分更高的时段');
    }
    
    return recommendations;
  }

  /**
   * 生成更安全的替代路线
   */
  private async generateSaferAlternativeRoutes(
    start: LocationPoint,
    end: LocationPoint,
    preferences: RoutePreferences,
    riskHotspots: Array<{ location: LocationPoint; riskLevel: string }>
  ): Promise<RouteResult[]> {
    const alternatives: RouteResult[] = [];
    
    // 生成避开高风险点的路线
    const safeRoute = await this.generateSafeRoute(start, end, preferences, riskHotspots);
    if (safeRoute) {
      alternatives.push(safeRoute);
    }
    
    // 生成更直接但可能风险稍高的路线
    const directRoute = await this.generateDirectSafeRoute(start, end, preferences);
    if (directRoute) {
      alternatives.push(directRoute);
    }
    
    return alternatives;
  }

  /**
   * 生成安全路线
   */
  private async generateSafeRoute(
    start: LocationPoint,
    end: LocationPoint,
    preferences: RoutePreferences,
    riskHotspots: Array<{ location: LocationPoint; riskLevel: string }>
  ): Promise<RouteResult | null> {
    // 简化实现：生成一个避开高风险点的基础路线
    const points = [start];
    
    // 添加中间安全点（避开风险热点）
    const midPoint = {
      lat: (start.lat + end.lat) / 2,
      lng: (start.lng + end.lng) / 2
    };
    
    // 检查中间点是否安全
    const isMidPointSafe = !riskHotspots.some(hotspot => 
      hotspot.riskLevel === 'high' && 
      this.calculateDistance(midPoint, hotspot.location) < 500
    );
    
    if (isMidPointSafe) {
      points.push(midPoint);
    }
    
    points.push(end);
    
    const distance = this.calculatePathDistance(points);
    const duration = this.estimateDuration(distance, preferences);
    
    return {
      distance,
      duration,
      paths: [points],
      safetyScore: 75 // 安全路线的基础评分
    };
  }

  /**
   * 生成直接安全路线
   */
  private async generateDirectSafeRoute(
    start: LocationPoint,
    end: LocationPoint,
    preferences: RoutePreferences
  ): Promise<RouteResult | null> {
    const points = [start, end];
    const distance = this.calculatePathDistance(points);
    const duration = this.estimateDuration(distance, preferences);
    
    return {
      distance,
      duration,
      paths: [points],
      safetyScore: 65 // 直接路线的基础评分
    };
  }

  /**
   * 获取时间段
   */
  private getTimeSlot(date: Date): string {
    const hour = date.getHours();
    
    if (hour >= 5 && hour < 7) return 'early_morning';
    if (hour >= 7 && hour < 10) return 'morning';
    if (hour >= 10 && hour < 12) return 'late_morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 20) return 'evening';
    if (hour >= 20 && hour < 23) return 'night';
    return 'late_night';
  }

  private calculateDistance(point1: LocationPoint, point2: LocationPoint): number {
    const R = 6371000; // 地球半径（米）
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * 计算路径总距离
   */
  private calculatePathDistance(points: LocationPoint[]): number {
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      totalDistance += this.calculateDistance(points[i-1], points[i]);
    }
    return totalDistance;
  }

  /**
   * 估算路线距离（基于途径点）
   */
  private estimateRouteDistance(waypoints: WaypointData[], mode: string): number {
    if (waypoints.length === 0) return 0;
    
    let totalDistance = 0;
    
    // 简化的距离估算
    for (let i = 0; i < waypoints.length - 1; i++) {
      totalDistance += this.calculateDistance(waypoints[i], waypoints[i + 1]);
    }
    
    // 根据模式调整
    switch (mode) {
      case 'loop':
        // 环形路线需要回到起点
        if (waypoints.length > 0) {
          totalDistance += this.calculateDistance(waypoints[waypoints.length - 1], waypoints[0]);
        }
        break;
      case 'out-and-back':
        // 往返路线距离翻倍
        totalDistance *= 2;
        break;
    }
    
    return totalDistance;
  }

  /**
   * 估算跑步时间
   */
  private estimateDuration(distance: number, preferences: RoutePreferences): number {
    // 根据难度调整配速
    let paceMinutesPerKm = 6; // 默认6分钟/公里
    
    switch (preferences.difficulty) {
      case 'easy':
        paceMinutesPerKm = 7;
        break;
      case 'medium':
        paceMinutesPerKm = 6;
        break;
      case 'hard':
        paceMinutesPerKm = 5;
        break;
    }
    
    return (distance / 1000) * paceMinutesPerKm * 60; // 转换为秒
  }

  /**
   * 生成组合
   */
  private getCombinations<T>(array: T[], size: number): T[][] {
    if (size > array.length) return [];
    if (size === 1) return array.map(item => [item]);
    
    const combinations: T[][] = [];
    
    for (let i = 0; i <= array.length - size; i++) {
      const head = array[i];
      const tailCombinations = this.getCombinations(array.slice(i + 1), size - 1);
      
      for (const tailCombination of tailCombinations) {
        combinations.push([head, ...tailCombination]);
      }
    }
    
    return combinations;
  }

  /**
   * 生成绕路点
   */
  private generateDetourPoint(
    point1: LocationPoint,
    point2: LocationPoint,
    detourDistance: number
  ): LocationPoint {
    // 在两点之间生成一个绕路点
    const midLat = (point1.lat + point2.lat) / 2;
    const midLng = (point1.lng + point2.lng) / 2;
    
    // 添加一个偏移来创建绕路
    const offsetDistance = detourDistance / 111000; // 粗略转换为度数
    const angle = Math.random() * 2 * Math.PI; // 随机方向
    
    return {
      lat: midLat + Math.cos(angle) * offsetDistance,
      lng: midLng + Math.sin(angle) * offsetDistance
    };
  }

  /**
   * 验证路线质量
   */
  private validateRouteQuality(
    route: RouteResult,
    targetDistance: number,
    preferences: RoutePreferences
  ): {
    isValid: boolean;
    distanceError: number;
    qualityScore: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let qualityScore = 100;
    
    // 距离验证
    const distanceError = Math.abs(route.distance - targetDistance) / targetDistance;
    const distanceErrorPercent = distanceError * 100;
    
    if (distanceErrorPercent > 10) {
      issues.push(`距离偏差过大: ${distanceErrorPercent.toFixed(1)}%`);
      qualityScore -= 30;
    } else if (distanceErrorPercent > 5) {
      issues.push(`距离偏差较大: ${distanceErrorPercent.toFixed(1)}%`);
      qualityScore -= 15;
    }
    
    // 路线复杂度验证
    const pathPoints = route.paths[0];
    if (pathPoints.length < 3) {
      issues.push('路线过于简单，缺乏变化');
      qualityScore -= 10;
    } else if (pathPoints.length > 10) {
      issues.push('路线过于复杂，可能影响跑步体验');
      qualityScore -= 5;
    }
    
    // 安全性验证
    if (route.safetyScore && route.safetyScore < 6) {
      issues.push('路线安全性较低');
      qualityScore -= 20;
    }
    
    // 时长合理性验证
    const expectedDuration = (targetDistance / 1000) * 6 * 60; // 6分钟/公里
    const durationError = Math.abs(route.duration - expectedDuration) / expectedDuration;
    
    if (durationError > 0.3) {
      issues.push('预估时长不合理');
      qualityScore -= 10;
    }
    
    const isValid = distanceErrorPercent <= 10 && qualityScore >= 60;
    
    return {
      isValid,
      distanceError: distanceErrorPercent,
      qualityScore: Math.max(0, qualityScore),
      issues
    };
  }

  /**
   * 智能路线优化
   */
  private async optimizeRoute(
    route: RouteResult,
    targetDistance: number,
    preferences: RoutePreferences,
    maxIterations: number = 3
  ): Promise<RouteResult> {
    let currentRoute = route;
    let iteration = 0;
    
    while (iteration < maxIterations) {
      const validation = this.validateRouteQuality(currentRoute, targetDistance, preferences);
      
      if (validation.isValid) {
        console.log(`路线优化完成，质量评分: ${validation.qualityScore}`);
        break;
      }
      
      console.log(`第${iteration + 1}次优化，当前问题:`, validation.issues);
      
      // 根据问题类型进行优化
      if (validation.distanceError > 10) {
        // 距离偏差过大，需要调整
        const distanceRatio = targetDistance / currentRoute.distance;
        
        if (distanceRatio > 1.1) {
          // 需要增加距离
          currentRoute = await this.addRouteComplexity(currentRoute, targetDistance);
        } else if (distanceRatio < 0.9) {
          // 需要减少距离
          currentRoute = await this.simplifyRoute(currentRoute, targetDistance);
        }
      }
      
      iteration++;
    }
    
    return currentRoute;
  }

  /**
   * 增加路线复杂度
   */
  private async addRouteComplexity(
    route: RouteResult,
    targetDistance: number
  ): Promise<RouteResult> {
    const points = [...route.paths[0]];
    const additionalDistance = targetDistance - route.distance;
    
    // 在路径中间添加绕路点
    if (points.length >= 2 && additionalDistance > 200) {
      const insertIndex = Math.floor(points.length / 2);
      const detourPoint = this.generateDetourPoint(
        points[insertIndex - 1],
        points[insertIndex],
        additionalDistance / 2
      );
      
      points.splice(insertIndex, 0, detourPoint);
    }
    
    const newDistance = this.calculatePathDistance(points);
    
    return {
      ...route,
      distance: newDistance,
      paths: [points],
      duration: this.estimateDuration(newDistance, { difficulty: 'medium' } as RoutePreferences)
    };
  }

  /**
   * 简化路线
   */
  private async simplifyRoute(
    route: RouteResult,
    targetDistance: number
  ): Promise<RouteResult> {
    const points = [...route.paths[0]];
    
    // 移除一些中间点来减少距离
    while (points.length > 3 && this.calculatePathDistance(points) > targetDistance * 1.05) {
      const midIndex = Math.floor(points.length / 2);
      points.splice(midIndex, 1);
    }
    
    const newDistance = this.calculatePathDistance(points);
    
    return {
      ...route,
      distance: newDistance,
      paths: [points],
      duration: this.estimateDuration(newDistance, { difficulty: 'medium' } as RoutePreferences)
    };
  }

  private calculateAverageSafetyScore(waypoints: WaypointData[]): number {
    const scores = waypoints.map(wp => wp.safetyScore || 7);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private translateFitnessLevel(level: string): string {
    const translations = {
      'beginner': '初学者',
      'intermediate': '中等水平',
      'advanced': '高级水平'
    };
    return translations[level as keyof typeof translations] || level;
  }

  private translateDifficulty(difficulty: string): string {
    const translations = {
      'easy': '简单',
      'medium': '中等',
      'hard': '困难'
    };
    return translations[difficulty as keyof typeof translations] || difficulty;
  }

  private translateScenery(scenery: string): string {
    const translations = {
      'urban': '城市风光',
      'park': '公园绿地',
      'waterfront': '滨水景观',
      'mixed': '混合风景'
    };
    return translations[scenery as keyof typeof translations] || scenery;
  }

  private translateTimeOfDay(time: string): string {
    const translations = {
      'morning': '早晨',
      'afternoon': '下午',
      'evening': '傍晚',
      'night': '夜晚'
    };
    return translations[time as keyof typeof translations] || time;
  }
}

export const intelligentRouteService = new IntelligentRouteService();