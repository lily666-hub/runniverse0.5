/**
 * 数据融合引擎 - 融合GPS和AI数据，提供智能分析和预测
 */

import { EventEmitter } from '../../utils/EventEmitter';
import type {
  GPSData,
  AIContextData,
  FusedData,
  FusionOptions,
  AIInsights,
  Predictions,
  SafetyAnalysis,
  RouteOptimization,
  PerformancePrediction
} from '../../types/unified';

export interface KalmanFilterState {
  x: number; // 位置
  v: number; // 速度
  P: number[][]; // 协方差矩阵
  Q: number; // 过程噪声
  R: number; // 测量噪声
}

export class KalmanFilter {
  private state: KalmanFilterState;

  constructor() {
    this.state = {
      x: 0,
      v: 0,
      P: [[1, 0], [0, 1]],
      Q: 0.1,
      R: 1
    };
  }

  predict(dt: number): void {
    // 预测步骤
    const F = [[1, dt], [0, 1]]; // 状态转移矩阵
    const newX = this.state.x + this.state.v * dt;
    const newV = this.state.v;
    
    this.state.x = newX;
    this.state.v = newV;
    
    // 更新协方差矩阵
    this.state.P[0][0] += this.state.Q;
    this.state.P[1][1] += this.state.Q;
  }

  update(measurement: number): void {
    // 更新步骤
    const K = this.state.P[0][0] / (this.state.P[0][0] + this.state.R); // 卡尔曼增益
    
    this.state.x = this.state.x + K * (measurement - this.state.x);
    this.state.P[0][0] = (1 - K) * this.state.P[0][0];
  }

  getFilteredValue(): number {
    return this.state.x;
  }
}

export class DataFusionEngine extends EventEmitter {
  private gpsBuffer: GPSData[] = [];
  private aiContextBuffer: AIContextData[] = [];
  private fusionConfig: Required<FusionOptions>;
  private kalmanFilterLat: KalmanFilter;
  private kalmanFilterLng: KalmanFilter;
  private isRunning = false;
  private fusionInterval: NodeJS.Timeout | null = null;
  private lastFusionTime = 0;
  private performanceMetrics = {
    fusionCount: 0,
    averageFusionTime: 0,
    totalFusionTime: 0,
    errorCount: 0
  };

  constructor(config?: Partial<FusionOptions>) {
    super();
    
    this.fusionConfig = {
      gpsWeight: 0.7,
      aiWeight: 0.3,
      confidenceThreshold: 0.6,
      updateFrequency: 1000,
      bufferSize: 10,
      ...config
    };

    this.kalmanFilterLat = new KalmanFilter();
    this.kalmanFilterLng = new KalmanFilter();
    
    console.log('🔧 数据融合引擎初始化完成', this.fusionConfig);
  }

  /**
   * 启动数据融合
   */
  start(): void {
    if (this.isRunning) {
      console.warn('⚠️ 数据融合引擎已在运行');
      return;
    }
    
    this.isRunning = true;
    this.lastFusionTime = Date.now();
    
    // 启动定期融合
    this.fusionInterval = setInterval(() => {
      this.performFusion();
    }, this.fusionConfig.updateFrequency);
    
    console.log('✅ 数据融合引擎已启动');
    this.emit('fusionEngineStarted');
  }

  /**
   * 停止数据融合
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.fusionInterval) {
      clearInterval(this.fusionInterval);
      this.fusionInterval = null;
    }
    
    console.log('⏹️ 数据融合引擎已停止');
    this.emit('fusionEngineStopped');
  }

  /**
   * 更新GPS数据
   */
  updateGPSData(gpsData: GPSData): void {
    // 添加到缓冲区
    this.gpsBuffer.push(gpsData);
    
    // 保持缓冲区大小
    if (this.gpsBuffer.length > this.fusionConfig.bufferSize) {
      this.gpsBuffer.shift();
    }
    
    // 使用卡尔曼滤波器平滑GPS数据
    const dt = this.gpsBuffer.length > 1 
      ? (gpsData.timestamp - this.gpsBuffer[this.gpsBuffer.length - 2].timestamp) / 1000
      : 1;
    
    this.kalmanFilterLat.predict(dt);
    this.kalmanFilterLat.update(gpsData.latitude);
    
    this.kalmanFilterLng.predict(dt);
    this.kalmanFilterLng.update(gpsData.longitude);
    
    console.log('📍 GPS数据已更新:', {
      lat: gpsData.latitude,
      lng: gpsData.longitude,
      accuracy: gpsData.accuracy,
      bufferSize: this.gpsBuffer.length
    });
    
    this.emit('gpsDataUpdated', gpsData);
  }

  /**
   * 更新AI上下文数据
   */
  updateAIContext(aiContext: AIContextData): void {
    // 添加到缓冲区
    this.aiContextBuffer.push(aiContext);
    
    // 保持缓冲区大小
    if (this.aiContextBuffer.length > this.fusionConfig.bufferSize) {
      this.aiContextBuffer.shift();
    }
    
    console.log('🤖 AI上下文已更新:', {
      activity: aiContext.currentActivity.activityType,
      intensity: aiContext.currentActivity.intensity,
      bufferSize: this.aiContextBuffer.length
    });
    
    this.emit('aiContextUpdated', aiContext);
  }

  /**
   * 执行数据融合
   */
  private async performFusion(): Promise<void> {
    if (this.gpsBuffer.length === 0 || this.aiContextBuffer.length === 0) {
      return;
    }

    const startTime = Date.now();
    
    try {
      // 获取最新数据
      const latestGPS = this.gpsBuffer[this.gpsBuffer.length - 1];
      const latestAI = this.aiContextBuffer[this.aiContextBuffer.length - 1];
      
      // 创建融合数据
      const fusedData = await this.createFusedData(latestGPS, latestAI);
      
      // 计算置信度
      const confidence = this.calculateConfidence(latestGPS, latestAI);
      
      if (confidence >= this.fusionConfig.confidenceThreshold) {
        fusedData.confidence = confidence;
        
        // 发出融合数据事件
        this.emit('fusedDataReady', fusedData);
        
        // 更新性能指标
        this.updatePerformanceMetrics(Date.now() - startTime);
        
        console.log('🔄 数据融合完成:', {
          confidence: confidence.toFixed(2),
          gpsAccuracy: latestGPS.accuracy,
          aiActivity: latestAI.currentActivity.activityType
        });
      } else {
        console.warn('⚠️ 融合数据置信度不足:', confidence.toFixed(2));
      }
      
    } catch (error) {
      console.error('❌ 数据融合失败:', error);
      this.performanceMetrics.errorCount++;
      this.emit('fusionError', error);
    }
  }

  /**
   * 创建融合数据
   */
  private async createFusedData(gpsData: GPSData, aiContext: AIContextData): Promise<FusedData> {
    // 使用卡尔曼滤波器获取平滑的GPS数据
    const smoothedGPS: GPSData = {
      ...gpsData,
      latitude: this.kalmanFilterLat.getFilteredValue(),
      longitude: this.kalmanFilterLng.getFilteredValue()
    };

    // 生成AI洞察
    const insights = await this.generateAIInsights(smoothedGPS, aiContext);
    
    // 生成预测
    const predictions = await this.generatePredictions(smoothedGPS, aiContext);
    
    // 生成推荐
    const recommendations = await this.generateRecommendations(smoothedGPS, aiContext, insights);

    return {
      gps: smoothedGPS,
      ai: aiContext,
      insights,
      predictions,
      recommendations,
      confidence: 0, // 将在外部计算
      timestamp: Date.now()
    };
  }

  /**
   * 生成AI洞察
   */
  private async generateAIInsights(gpsData: GPSData, aiContext: AIContextData): Promise<AIInsights> {
    // 路线优化分析
    const routeOptimization = await this.analyzeRouteOptimization(gpsData, aiContext);
    
    // 安全分析
    const safetyAnalysis = await this.analyzeSafety(gpsData, aiContext);
    
    // 性能预测
    const performancePrediction = await this.predictPerformance(gpsData, aiContext);
    
    // 生成推荐
    const recommendations = this.generateContextualRecommendations(gpsData, aiContext);
    
    // 生成警告
    const warnings = this.generateWarnings(gpsData, aiContext, safetyAnalysis);

    return {
      routeOptimization,
      safetyAnalysis,
      performancePrediction,
      recommendations,
      warnings
    };
  }

  /**
   * 分析路线优化
   */
  private async analyzeRouteOptimization(gpsData: GPSData, aiContext: AIContextData): Promise<RouteOptimization> {
    // 基于当前位置和用户偏好分析路线优化机会
    const suggestedAdjustments = [];
    const alternativeRoutes = [];
    const trafficAvoidance = {
      congestionAreas: [],
      alternativePaths: [],
      estimatedTimeSaving: 0
    };
    const scenicEnhancements = [];

    // 根据用户偏好和环境因素生成建议
    if (aiContext.userPreferences.preferParks) {
      scenicEnhancements.push({
        location: gpsData,
        type: 'park' as const,
        description: '附近有公园，可以考虑绕道经过',
        detourDistance: 200,
        detourTime: 120
      });
    }

    if (aiContext.environmentalFactors.trafficLevel === 'high') {
      suggestedAdjustments.push({
        type: 'detour' as const,
        description: '建议避开高流量区域',
        impact: 'positive' as const,
        distanceChange: 300,
        timeChange: -180
      });
    }

    return {
      suggestedAdjustments,
      alternativeRoutes,
      trafficAvoidance,
      scenicEnhancements
    };
  }

  /**
   * 安全分析
   */
  private async analyzeSafety(gpsData: GPSData, aiContext: AIContextData): Promise<SafetyAnalysis> {
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const riskFactors = [];
    let safetyScore = 85; // 基础安全分数

    // 分析时间因素
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      riskLevel = 'medium';
      safetyScore -= 15;
      riskFactors.push({
        type: 'lighting' as const,
        severity: 'medium' as const,
        description: '夜间或早晨时段，光线不足',
        mitigation: ['携带照明设备', '选择光线充足的路线', '告知他人行程']
      });
    }

    // 分析环境因素
    if (aiContext.environmentalFactors.crowdDensity === 'low') {
      safetyScore -= 10;
      riskFactors.push({
        type: 'isolation' as const,
        severity: 'low' as const,
        description: '人流密度较低，相对孤立',
        mitigation: ['保持通讯畅通', '选择主要道路', '定期报告位置']
      });
    }

    // 分析天气因素
    if (aiContext.environmentalFactors.weather.precipitation > 5) {
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
      safetyScore -= 20;
      riskFactors.push({
        type: 'weather' as const,
        severity: 'medium' as const,
        description: '降雨天气，路面湿滑',
        mitigation: ['穿防滑鞋', '降低速度', '避免急转弯']
      });
    }

    const recommendations = [
      {
        type: 'equipment' as const,
        priority: 'medium' as const,
        description: '建议携带安全装备',
        action: '佩戴反光衣物和头灯'
      },
      {
        type: 'behavior' as const,
        priority: 'high' as const,
        description: '保持警觉',
        action: '注意周围环境，避免佩戴耳机'
      }
    ];

    return {
      riskLevel,
      riskFactors,
      safetyScore,
      recommendations,
      emergencyContacts: [] // 从用户配置中获取
    };
  }

  /**
   * 性能预测
   */
  private async predictPerformance(gpsData: GPSData, aiContext: AIContextData): Promise<PerformancePrediction> {
    const activity = aiContext.currentActivity;
    const weather = aiContext.environmentalFactors.weather;
    
    // 基于活动强度和环境因素预测性能
    let estimatedTime = activity.duration;
    let estimatedCalories = 0;
    let difficultyScore = 50; // 基础难度分数
    let fatigueLevel = 30; // 基础疲劳水平
    let hydrationNeeds = 500; // 基础水分需求(ml)

    // 根据活动类型调整
    switch (activity.activityType) {
      case 'running':
        estimatedCalories = activity.duration * 0.15; // 每分钟约0.15卡路里/kg
        difficultyScore += 20;
        fatigueLevel += 25;
        hydrationNeeds += 200;
        break;
      case 'walking':
        estimatedCalories = activity.duration * 0.05;
        difficultyScore += 5;
        fatigueLevel += 10;
        hydrationNeeds += 100;
        break;
      case 'cycling':
        estimatedCalories = activity.duration * 0.12;
        difficultyScore += 15;
        fatigueLevel += 20;
        hydrationNeeds += 150;
        break;
    }

    // 根据强度调整
    switch (activity.intensity) {
      case 'high':
        estimatedCalories *= 1.5;
        difficultyScore += 30;
        fatigueLevel += 40;
        hydrationNeeds += 300;
        break;
      case 'medium':
        estimatedCalories *= 1.2;
        difficultyScore += 15;
        fatigueLevel += 20;
        hydrationNeeds += 150;
        break;
      case 'low':
        estimatedCalories *= 0.8;
        difficultyScore -= 10;
        fatigueLevel -= 10;
        hydrationNeeds -= 100;
        break;
    }

    // 根据天气调整
    if (weather.temperature > 30) {
      fatigueLevel += 20;
      hydrationNeeds += 400;
      difficultyScore += 15;
    } else if (weather.temperature < 5) {
      fatigueLevel += 10;
      difficultyScore += 10;
    }

    if (weather.humidity > 80) {
      fatigueLevel += 15;
      hydrationNeeds += 200;
    }

    const restRecommendations = [];
    if (fatigueLevel > 70) {
      restRecommendations.push({
        location: gpsData,
        type: 'rest' as const,
        urgency: 'high' as const,
        description: '建议休息以避免过度疲劳',
        estimatedDuration: 10
      });
    }

    if (hydrationNeeds > 800) {
      restRecommendations.push({
        location: gpsData,
        type: 'hydration' as const,
        urgency: 'medium' as const,
        description: '建议补充水分',
        estimatedDuration: 5
      });
    }

    return {
      estimatedTime,
      estimatedCalories,
      difficultyScore: Math.min(100, Math.max(0, difficultyScore)),
      fatigueLevel: Math.min(100, Math.max(0, fatigueLevel)),
      hydrationNeeds: Math.max(0, hydrationNeeds),
      restRecommendations
    };
  }

  /**
   * 生成预测
   */
  private async generatePredictions(gpsData: GPSData, aiContext: AIContextData): Promise<Predictions> {
    const routeCompletion = {
      estimatedCompletionTime: aiContext.currentActivity.duration,
      probabilityOfCompletion: 0.85,
      potentialChallenges: ['天气变化', '交通拥堵'],
      recommendedAdjustments: ['携带雨具', '选择替代路线']
    };

    const weatherChanges = [
      {
        timeframe: 30,
        condition: '多云',
        temperature: aiContext.environmentalFactors.weather.temperature + 2,
        precipitation: 0,
        impact: 'neutral' as const,
        recommendations: ['继续当前活动']
      }
    ];

    const trafficChanges = [
      {
        timeframe: 15,
        congestionLevel: 'medium' as const,
        affectedAreas: [gpsData],
        impact: 'moderate' as const,
        alternatives: ['选择支路', '调整时间']
      }
    ];

    const safetyRisks = [
      {
        timeframe: 60,
        riskType: 'weather' as const,
        probability: 0.2,
        severity: 'low' as const,
        preventiveMeasures: ['关注天气变化', '准备应急装备']
      }
    ];

    return {
      routeCompletion,
      weatherChanges,
      trafficChanges,
      safetyRisks
    };
  }

  /**
   * 生成上下文推荐
   */
  private generateContextualRecommendations(gpsData: GPSData, aiContext: AIContextData): string[] {
    const recommendations = [];
    
    // 基于活动类型的推荐
    if (aiContext.currentActivity.activityType === 'running') {
      recommendations.push('保持稳定的配速，注意呼吸节奏');
    }
    
    // 基于环境的推荐
    if (aiContext.environmentalFactors.weather.temperature > 25) {
      recommendations.push('天气较热，建议多补充水分');
    }
    
    if (aiContext.environmentalFactors.airQuality.aqi > 100) {
      recommendations.push('空气质量较差，建议缩短运动时间');
    }
    
    // 基于时间的推荐
    const hour = new Date().getHours();
    if (hour >= 18 && hour <= 20) {
      recommendations.push('黄昏时段，注意交通安全');
    }
    
    return recommendations;
  }

  /**
   * 生成警告
   */
  private generateWarnings(gpsData: GPSData, aiContext: AIContextData, safetyAnalysis: SafetyAnalysis): any[] {
    const warnings = [];
    
    if (safetyAnalysis.riskLevel === 'high' || safetyAnalysis.riskLevel === 'critical') {
      warnings.push({
        type: 'safety',
        severity: 'critical',
        message: '当前环境存在安全风险，建议谨慎行动',
        action: '考虑更改路线或推迟活动'
      });
    }
    
    if (aiContext.environmentalFactors.weather.precipitation > 10) {
      warnings.push({
        type: 'weather',
        severity: 'warning',
        message: '降雨量较大，路面湿滑',
        action: '降低速度，注意防滑'
      });
    }
    
    return warnings;
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(gpsData: GPSData, aiContext: AIContextData): number {
    let confidence = 0.5; // 基础置信度
    
    // GPS精度影响置信度
    if (gpsData.accuracy <= 5) {
      confidence += 0.3;
    } else if (gpsData.accuracy <= 10) {
      confidence += 0.2;
    } else if (gpsData.accuracy <= 20) {
      confidence += 0.1;
    }
    
    // 数据新鲜度影响置信度
    const dataAge = Date.now() - gpsData.timestamp;
    if (dataAge < 5000) { // 5秒内
      confidence += 0.2;
    } else if (dataAge < 15000) { // 15秒内
      confidence += 0.1;
    }
    
    // AI上下文完整性影响置信度
    if (aiContext.userPreferences && aiContext.environmentalFactors) {
      confidence += 0.1;
    }
    
    return Math.min(1.0, Math.max(0.0, confidence));
  }

  /**
   * 更新性能指标
   */
  private updatePerformanceMetrics(fusionTime: number): void {
    this.performanceMetrics.fusionCount++;
    this.performanceMetrics.totalFusionTime += fusionTime;
    this.performanceMetrics.averageFusionTime = 
      this.performanceMetrics.totalFusionTime / this.performanceMetrics.fusionCount;
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * 重置性能指标
   */
  resetPerformanceMetrics(): void {
    this.performanceMetrics = {
      fusionCount: 0,
      averageFusionTime: 0,
      totalFusionTime: 0,
      errorCount: 0
    };
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      gpsBufferSize: this.gpsBuffer.length,
      aiBufferSize: this.aiContextBuffer.length,
      config: this.fusionConfig,
      performance: this.performanceMetrics
    };
  }
}

export default DataFusionEngine;