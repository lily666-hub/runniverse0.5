/**
 * 智能路线生成服务
 * 基于用户偏好、AI推荐和地图数据生成个性化跑步路线
 */

import { KimiClient } from './ai/kimiClient';

// 用户画像接口
export interface UserProfile {
  age: number;
  weight: number;
  height: number;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  runningExperience: number; // 月数
  preferredDistance: number; // 公里
  healthConditions?: string[];
  goals?: string[];
}

// 路线偏好接口
export interface RoutePreferences {
  distance: number; // 目标距离（公里）
  difficulty: 'easy' | 'moderate' | 'hard' | 'extreme';
  scenery: 'urban' | 'park' | 'waterfront' | 'mountain' | 'mixed';
  avoidTraffic: boolean;
  preferSafety: boolean;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  surfaceType?: 'road' | 'trail' | 'track' | 'mixed';
}

// 位置点接口
export interface LocationPoint {
  lat: number;
  lng: number;
  address?: string;
}

// 途经点数据接口
export interface WaypointData {
  id: string;
  name: string;
  desc: string;
  lat: number;
  lng: number;
  type: 'park' | 'landmark' | 'scenic' | 'rest' | 'water' | 'shelter';
  elevation?: number;
  safetyScore?: number; // 1-10
  sceneryScore?: number; // 1-10
  trafficLevel?: number; // 1-10
  facilities?: string[];
}

// 智能路线结果接口
export interface IntelligentRouteResult {
  id: string;
  name: string;
  description: string;
  distance: number; // 米
  duration: number; // 分钟
  difficulty: string;
  elevationGain: number; // 米
  calories: number;
  path: LocationPoint[];
  waypoints: WaypointData[];
  aiRecommendation: string;
  personalizedTips: string[];
  safetyScore: number;
  sceneryScore: number;
  qualityScore: number;
  routeMode: 'loop' | 'out-and-back' | 'linear' | 'adaptive';
}

export class IntelligentRouteService {
  private kimiClient: KimiClient;

  constructor() {
    this.kimiClient = new KimiClient();
  }

  /**
   * 生成智能推荐路线
   */
  async generateIntelligentRoute(
    userProfile: UserProfile,
    preferences: RoutePreferences,
    currentLocation: LocationPoint,
    availableWaypoints: WaypointData[]
  ): Promise<IntelligentRouteResult> {
    try {
      console.log('开始生成智能路线...');
      console.log(`用户偏好: 距离${preferences.distance}km, 难度${preferences.difficulty}, 场景${preferences.scenery}`);

      // 1. 使用AI分析并推荐最佳路线
      const aiRecommendation = await this.getAIRouteRecommendation(
        userProfile,
        preferences,
        currentLocation,
        availableWaypoints
      );

      console.log(`AI推荐路线模式: ${aiRecommendation.routeMode || '自适应'}`);
      console.log(`AI估计距离: ${aiRecommendation.distanceEstimate || '未指定'}km`);

      // 2. 基于AI推荐选择最佳途径点
      const selectedWaypoints = this.selectOptimalWaypoints(
        aiRecommendation.waypoints,
        availableWaypoints,
        preferences
      );

      console.log(`选择了 ${selectedWaypoints.length} 个途径点`);

      // 3. 生成详细路线
      const routeResult = await this.generateDetailedRoute(
        currentLocation,
        selectedWaypoints,
        preferences
      );

      // 4. 计算个性化指标
      const personalizedMetrics = this.calculatePersonalizedMetrics(
        routeResult,
        userProfile,
        preferences
      );

      // 5. 最终质量检查
      const finalValidation = this.validateRouteQuality(routeResult, preferences.distance * 1000, preferences);
      
      const result: IntelligentRouteResult = {
        ...routeResult,
        aiRecommendation: aiRecommendation.explanation,
        personalizedTips: [
          ...aiRecommendation.tips,
          `路线质量评分: ${finalValidation.qualityScore}/100`,
          `距离精度: ${(100 - finalValidation.distanceError).toFixed(1)}%`
        ],
        waypoints: selectedWaypoints,
        ...personalizedMetrics
      };

      console.log(`智能路线生成完成！实际距离: ${(routeResult.distance/1000).toFixed(2)}km, 目标距离: ${preferences.distance}km`);
      
      return result;
    } catch (error) {
      console.error('智能路线生成失败:', error);
      console.log('降级到基础路线生成...');
      // 降级到基础路线生成
      return this.generateFallbackRoute(currentLocation, availableWaypoints, preferences);
    }
  }

  /**
   * 调用AI获取路线推荐
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
      const aiRequest = {
        message: prompt,
        conversationType: 'route_recommendation' as const,
        context: {
          userContext: {
            age: userProfile.age,
            runningExperience: userProfile.runningExperience?.toString() || '0',
            preferences: userProfile
          },
          locationData: {
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
            address: currentLocation.address
          },
          conversationId: `route_${Date.now()}`,
          createdAt: new Date()
        }
      };
      const response = await this.kimiClient.sendMessage(aiRequest);
      return this.parseAIResponse(response.message);
    } catch (error) {
      console.error('AI路线推荐失败:', error);
      // 返回默认推荐
      return {
        waypoints: waypoints.slice(0, 3).map(wp => wp.name),
        explanation: '基于您的个人情况和距离要求，我为您推荐了这条经过精确计算的跑步路线。',
        tips: ['保持适中的跑步节奏', '注意补充水分', '注意交通安全'],
        routeMode: 'loop',
        distanceEstimate: preferences.distance
      };
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

**请提供以下格式的推荐：**

ROUTE_MODE: [选择的路线模式：loop/out-and-back/linear]

WAYPOINTS: [选择的途径点名称，用逗号分隔，确保总距离符合要求]

DISTANCE_ESTIMATE: [预估总距离（公里），必须在目标范围内]

EXPLANATION: [详细解释路线选择理由]

TIPS: [给用户的个性化建议，每条建议用"|"分隔]
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

    const routeMode = routeModeMatch ? routeModeMatch[1].trim() : 'loop';
    
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

      // 添加最佳的剩余点位
      selected.push(...remaining.slice(0, 3 - selected.length));
    }

    return selected;
  }

  /**
   * 生成详细路线
   */
  private async generateDetailedRoute(
    startLocation: LocationPoint,
    waypoints: WaypointData[],
    preferences: RoutePreferences
  ): Promise<Omit<IntelligentRouteResult, 'aiRecommendation' | 'personalizedTips'>> {
    // 构建路径点
    const pathPoints: LocationPoint[] = [startLocation];
    
    // 添加途径点
    waypoints.forEach(wp => {
      pathPoints.push({ lat: wp.lat, lng: wp.lng, address: wp.name });
    });

    // 根据路线模式决定是否回到起点
    if (preferences.distance > 3) { // 大于3km的路线通常是环形
      pathPoints.push(startLocation);
    }

    // 计算距离和其他指标
    const distance = this.calculatePathDistance(pathPoints);
    const duration = this.estimateDuration(distance, preferences.difficulty);
    const elevationGain = this.calculateElevationGain(waypoints);
    const calories = this.calculateCalories(distance, duration);

    return {
      id: `route_${Date.now()}`,
      name: `智能推荐路线 - ${preferences.distance}km`,
      description: `基于AI分析的个性化${preferences.difficulty}难度跑步路线`,
      distance,
      duration,
      difficulty: preferences.difficulty,
      elevationGain,
      calories,
      path: pathPoints,
      waypoints,
      safetyScore: this.calculateSafetyScore(waypoints),
      sceneryScore: this.calculateSceneryScore(waypoints),
      qualityScore: 85, // 默认质量评分
      routeMode: distance > preferences.distance * 1000 * 0.8 ? 'loop' : 'out-and-back'
    };
  }

  /**
   * 计算个性化指标
   */
  private calculatePersonalizedMetrics(
    route: any,
    userProfile: UserProfile,
    preferences: RoutePreferences
  ) {
    // 根据用户画像调整指标
    const fitnessMultiplier = {
      'beginner': 0.8,
      'intermediate': 1.0,
      'advanced': 1.2,
      'professional': 1.4
    }[userProfile.fitnessLevel];

    return {
      calories: Math.round(route.calories * fitnessMultiplier),
      duration: Math.round(route.duration / fitnessMultiplier)
    };
  }

  /**
   * 验证路线质量
   */
  private validateRouteQuality(route: any, targetDistance: number, preferences: RoutePreferences) {
    const distanceError = Math.abs(route.distance - targetDistance) / targetDistance * 100;
    const qualityScore = Math.max(0, 100 - distanceError * 2);

    return {
      qualityScore: Math.round(qualityScore),
      distanceError: Math.round(distanceError)
    };
  }

  /**
   * 生成备用路线
   */
  private async generateFallbackRoute(
    currentLocation: LocationPoint,
    availableWaypoints: WaypointData[],
    preferences: RoutePreferences
  ): Promise<IntelligentRouteResult> {
    const selectedWaypoints = availableWaypoints.slice(0, 3);
    const route = await this.generateDetailedRoute(currentLocation, selectedWaypoints, preferences);

    return {
      ...route,
      aiRecommendation: '由于AI服务暂时不可用，为您生成了基础推荐路线。',
      personalizedTips: ['保持适中的跑步节奏', '注意补充水分', '注意交通安全'],
      waypoints: selectedWaypoints
    };
  }

  // 辅助方法
  private translateFitnessLevel(level: string): string {
    const translations = {
      'beginner': '初学者',
      'intermediate': '中级',
      'advanced': '高级',
      'professional': '专业'
    };
    return translations[level as keyof typeof translations] || level;
  }

  private translateDifficulty(difficulty: string): string {
    const translations = {
      'easy': '简单',
      'moderate': '中等',
      'hard': '困难',
      'extreme': '极限'
    };
    return translations[difficulty as keyof typeof translations] || difficulty;
  }

  private translateScenery(scenery: string): string {
    const translations = {
      'urban': '城市',
      'park': '公园',
      'waterfront': '滨水',
      'mountain': '山地',
      'mixed': '混合'
    };
    return translations[scenery as keyof typeof translations] || scenery;
  }

  private translateTimeOfDay(timeOfDay: string): string {
    const translations = {
      'morning': '早晨',
      'afternoon': '下午',
      'evening': '傍晚',
      'night': '夜晚'
    };
    return translations[timeOfDay as keyof typeof translations] || timeOfDay;
  }

  private calculatePathDistance(points: LocationPoint[]): number {
    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalDistance += this.getDistanceBetweenPoints(points[i], points[i + 1]);
    }
    return totalDistance;
  }

  private getDistanceBetweenPoints(point1: LocationPoint, point2: LocationPoint): number {
    const R = 6371000; // 地球半径（米）
    const lat1Rad = point1.lat * Math.PI / 180;
    const lat2Rad = point2.lat * Math.PI / 180;
    const deltaLatRad = (point2.lat - point1.lat) * Math.PI / 180;
    const deltaLngRad = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private estimateDuration(distance: number, difficulty: string): number {
    const baseSpeed = {
      'easy': 6, // km/h
      'moderate': 8,
      'hard': 10,
      'extreme': 12
    }[difficulty] || 8;

    return Math.round((distance / 1000) / baseSpeed * 60); // 分钟
  }

  private calculateElevationGain(waypoints: WaypointData[]): number {
    return waypoints.reduce((total, wp) => total + (wp.elevation || 0), 0);
  }

  private calculateCalories(distance: number, duration: number): number {
    // 简化的卡路里计算：每公里约消耗60卡路里
    return Math.round((distance / 1000) * 60);
  }

  private calculateSafetyScore(waypoints: WaypointData[]): number {
    if (waypoints.length === 0) return 7;
    const avgSafety = waypoints.reduce((sum, wp) => sum + (wp.safetyScore || 7), 0) / waypoints.length;
    return Math.round(avgSafety);
  }

  private calculateSceneryScore(waypoints: WaypointData[]): number {
    if (waypoints.length === 0) return 7;
    const avgScenery = waypoints.reduce((sum, wp) => sum + (wp.sceneryScore || 7), 0) / waypoints.length;
    return Math.round(avgScenery);
  }
}