/**
 * 统一的GPS+AI集成服务 - 核心服务层
 * 整合GPS定位、AI智能体和数据融合功能
 */

import { EventEmitter } from '../../utils/EventEmitter';
import { DataFusionEngine } from './DataFusionEngine';
import { useGPS } from '../../hooks/useGPS';
import { AIService } from '../ai/aiService';
import { EnhancedGPSService } from './EnhancedGPSService';
import { EnhancedAIService } from './EnhancedAIService';
import { IntelligentMapService } from '../map/IntelligentMapService';
import { VoiceNavigationService } from '../voice/VoiceNavigationService';
import type {
  UnifiedTrackingOptions,
  GPSData,
  AIContextData,
  FusedData,
  SmartRouteRecommendation,
  SafetyAlert,
  EmergencyResponse,
  SmartNavigationSession,
  NavigationGuidance,
  UnifiedServiceEvent,
  RouteData,
  GPSPosition,
  UserPreferences,
  EnvironmentalFactors
} from '../../types/unified';

export class UnifiedGPSAIService extends EventEmitter {
  private static instance: UnifiedGPSAIService | null = null;
  
  // 核心服务
  private fusionEngine: DataFusionEngine;
  private aiService: AIService;
  private enhancedGPSService: EnhancedGPSService;
  private enhancedAIService: EnhancedAIService;
  private mapService: IntelligentMapService;
  private voiceService: VoiceNavigationService;
  
  // 状态管理
  private isInitialized = false;
  private isTracking = false;
  private currentSession: SmartNavigationSession | null = null;
  private lastGPSData: GPSData | null = null;
  private lastAIContext: AIContextData | null = null;
  
  // 配置
  private trackingOptions: UnifiedTrackingOptions | null = null;
  private userPreferences: UserPreferences | null = null;
  
  // 性能监控
  private performanceMetrics = {
    trackingStartTime: 0,
    totalUpdates: 0,
    successfulFusions: 0,
    errors: 0,
    averageResponseTime: 0
  };

  private constructor() {
    super();
    
    // 初始化服务
    this.fusionEngine = new DataFusionEngine();
    this.aiService = new AIService();
    this.enhancedGPSService = new EnhancedGPSService();
    this.enhancedAIService = new EnhancedAIService();
    this.mapService = new IntelligentMapService();
    this.voiceService = new VoiceNavigationService();
    
    this.setupEventHandlers();
    
    console.log('🚀 统一GPS+AI服务实例已创建');
  }

  /**
   * 获取单例实例
   */
  static getInstance(): UnifiedGPSAIService {
    if (!UnifiedGPSAIService.instance) {
      UnifiedGPSAIService.instance = new UnifiedGPSAIService();
    }
    return UnifiedGPSAIService.instance;
  }

  /**
   * 初始化服务
   */
  async initialize(options?: {
    userPreferences?: UserPreferences;
    mapContainer?: HTMLElement;
    voiceEnabled?: boolean;
  }): Promise<void> {
    if (this.isInitialized) {
      console.warn('⚠️ 统一服务已初始化');
      return;
    }

    try {
      console.log('🔧 开始初始化统一GPS+AI服务...');
      
      // 保存用户偏好
      if (options?.userPreferences) {
        this.userPreferences = options.userPreferences;
      }

      // AI服务已在构造函数中初始化，无需额外初始化
      console.log('✅ AI服务已就绪');

      // 初始化增强GPS服务
      await this.enhancedGPSService.initialize({
        enableHighAccuracy: true,
        enableAdaptiveFrequency: true,
        enableMemoryOptimization: true,
        enableKalmanFilter: true,
        enableOutlierDetection: true
      });
      console.log('✅ 增强GPS服务初始化完成');

      // 初始化增强AI服务
      await this.enhancedAIService.initialize({
        enableRealTimeAnalysis: true,
        enablePredictiveAnalysis: true,
        enableContextualAwareness: true,
        enablePerformanceOptimization: true
      });
      console.log('✅ 增强AI服务初始化完成');

      // 初始化地图服务
      if (options?.mapContainer) {
        await this.mapService.initialize(options.mapContainer);
        console.log('✅ 地图服务初始化完成');
      }

      // 配置语音服务
      if (options?.voiceEnabled) {
        this.voiceService.configure({
          enabled: true,
          language: 'zh-CN',
          rate: 1,
          pitch: 1,
          volume: 1,
          autoPlay: true,
          repeatInterval: 0
        });
        console.log('✅ 语音服务配置完成');
      }

      // 启动数据融合引擎
      this.fusionEngine.start();
      console.log('✅ 数据融合引擎启动完成');

      this.isInitialized = true;
      this.emit('serviceInitialized');
      
      console.log('🎉 统一GPS+AI服务初始化完成');
      
    } catch (error) {
      console.error('❌ 统一服务初始化失败:', error);
      this.emit('initializationError', error);
      throw error;
    }
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 数据融合引擎事件
    this.fusionEngine.on('fusedDataReady', (fusedData: FusedData) => {
      this.handleFusedData(fusedData);
    });

    this.fusionEngine.on('fusionError', (error: Error) => {
      console.error('❌ 数据融合错误:', error);
      this.performanceMetrics.errors++;
      this.emit('fusionError', error);
    });

    // AI服务事件 - AIService 不是 EventEmitter，移除事件监听
    // 改为通过轮询或回调方式处理 AI 上下文更新

    // 地图服务事件
    this.mapService.on('routePlanned', (route: RouteData) => {
      this.emit('routePlanned', route);
    });

    this.mapService.on('navigationStarted', () => {
      this.emit('navigationStarted');
    });

    // 语音服务事件
    this.voiceService.on('guidanceSpoken', (guidance: NavigationGuidance) => {
      this.emit('guidanceSpoken', guidance);
    });

    // 增强GPS服务事件
    this.enhancedGPSService.on('positionUpdate', (position: GPSData) => {
      this.handleEnhancedGPSUpdate(position);
    });

    this.enhancedGPSService.on('qualityChange', (quality: any) => {
      this.emit('gpsQualityChange', quality);
    });

    this.enhancedGPSService.on('performanceUpdate', (metrics: any) => {
      this.emit('gpsPerformanceUpdate', metrics);
    });

    // 增强AI服务事件
    this.enhancedAIService.on('analysisComplete', (analysis: any) => {
      this.handleEnhancedAIAnalysis(analysis);
    });

    this.enhancedAIService.on('predictionUpdate', (prediction: any) => {
      this.emit('aiPredictionUpdate', prediction);
    });

    this.enhancedAIService.on('performanceUpdate', (metrics: any) => {
      this.emit('aiPerformanceUpdate', metrics);
    });
  }

  /**
   * 启动统一追踪
   */
  async startUnifiedTracking(options: UnifiedTrackingOptions): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('服务未初始化，请先调用 initialize()');
    }

    if (this.isTracking) {
      console.warn('⚠️ 统一追踪已在运行');
      return;
    }

    try {
      console.log('🎯 开始统一追踪...', options);
      
      this.trackingOptions = options;
      this.isTracking = true;
      this.performanceMetrics.trackingStartTime = Date.now();

      // 启动GPS追踪（使用React Hook的逻辑）
      await this.startGPSTracking(options.gpsOptions);

      // 启动AI上下文监控
      await this.startAIContextMonitoring(options.aiOptions);

      // 更新融合引擎配置
      if (options.fusionOptions) {
        this.fusionEngine.stop();
        this.fusionEngine = new DataFusionEngine(options.fusionOptions);
        this.fusionEngine.start();
      }

      this.emit('unifiedTrackingStarted');
      console.log('✅ 统一追踪已启动');
      
    } catch (error) {
      console.error('❌ 启动统一追踪失败:', error);
      this.isTracking = false;
      this.emit('trackingError', error);
      throw error;
    }
  }

  /**
   * 停止统一追踪
   */
  async stopUnifiedTracking(): Promise<void> {
    if (!this.isTracking) {
      console.warn('⚠️ 统一追踪未在运行');
      return;
    }

    try {
      console.log('⏹️ 停止统一追踪...');

      // 停止GPS追踪
      this.stopGPSTracking();

      // 停止AI上下文监控
      this.stopAIContextMonitoring();

      // 停止当前导航会话
      if (this.currentSession) {
        await this.stopSmartNavigation();
      }

      this.isTracking = false;
      this.trackingOptions = null;

      this.emit('unifiedTrackingStopped');
      console.log('✅ 统一追踪已停止');
      
    } catch (error) {
      console.error('❌ 停止统一追踪失败:', error);
      this.emit('trackingError', error);
      throw error;
    }
  }

  /**
   * 启动GPS追踪
   */
  private async startGPSTracking(options: any): Promise<void> {
    try {
      console.log('📍 启动增强GPS追踪...', options);
      
      // 启动增强GPS服务
      await this.enhancedGPSService.startTracking({
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 10000,
        maximumAge: options?.maximumAge ?? 60000,
        trackingInterval: options?.trackingInterval ?? 2000,
        enableAdaptiveFrequency: true,
        enableMemoryOptimization: true,
        enableKalmanFilter: true,
        enableOutlierDetection: true
      });
      
      console.log('✅ 增强GPS追踪已启动');
      
    } catch (error) {
      console.error('❌ 启动GPS追踪失败:', error);
      // 回退到模拟GPS更新
      this.simulateGPSUpdates();
    }
  }

  /**
   * 停止GPS追踪
   */
  private stopGPSTracking(): void {
    console.log('📍 停止GPS追踪...');
    this.enhancedGPSService.stopTracking();
    console.log('✅ GPS追踪已停止');
  }

  /**
   * 启动AI上下文监控
   */
  private async startAIContextMonitoring(options: any): Promise<void> {
    try {
      console.log('🤖 启动增强AI上下文监控...', options);
      
      // 启动增强AI服务的实时分析
      this.enhancedAIService.startRealTimeAnalysis({
        analysisInterval: options?.analysisInterval ?? 5000,
        enablePredictiveAnalysis: options?.enablePredictiveAnalysis ?? true,
        enableContextualAwareness: options?.enableContextualAwareness ?? true,
        enableSafetyMonitoring: options?.enableSafetyMonitoring ?? true
      });
      
      console.log('✅ 增强AI上下文监控已启动');
      
    } catch (error) {
      console.error('❌ 启动AI上下文监控失败:', error);
      // 回退到模拟AI上下文更新
      this.simulateAIContextUpdates();
    }
  }

  /**
   * 停止AI上下文监控
   */
  private stopAIContextMonitoring(): void {
    console.log('🤖 停止AI上下文监控...');
    this.enhancedAIService.stopRealTimeAnalysis();
    console.log('✅ AI上下文监控已停止');
  }

  /**
   * 获取智能路线推荐
   */
  async getSmartRouteRecommendation(
    startLocation: GPSPosition,
    endLocation: GPSPosition,
    preferences?: UserPreferences
  ): Promise<SmartRouteRecommendation> {
    if (!this.isInitialized) {
      throw new Error('服务未初始化');
    }

    try {
      console.log('🗺️ 获取智能路线推荐...', { startLocation, endLocation });

      // 使用地图服务规划基础路线
      const baseRoute = await this.mapService.planRoute([
        { lat: startLocation.latitude, lng: startLocation.longitude },
        { lat: endLocation.latitude, lng: endLocation.longitude }
      ]);

      // 使用AI服务分析路线
      const aiAnalysis = await this.aiService.analyzeRoute({
        route: baseRoute,
        userPreferences: preferences || this.userPreferences,
        currentContext: this.lastAIContext
      });

      // 创建智能推荐
      const smartRecommendation: SmartRouteRecommendation = {
        route: baseRoute,
        aiAnalysis: aiAnalysis,
        safetyScore: aiAnalysis.safetyAssessment?.overall || 75,
        personalizedScore: aiAnalysis.personalizedFit?.score || 80,
        reasons: [
          '基于您的偏好优化',
          '考虑了当前交通状况',
          '包含安全分析'
        ],
        alternatives: [],
        warnings: []
      };

      this.emit('routeRecommendationGenerated', smartRecommendation);
      return smartRecommendation;
      
    } catch (error) {
      console.error('❌ 获取智能路线推荐失败:', error);
      throw error;
    }
  }

  /**
   * 启动智能导航
   */
  async startSmartNavigation(route: RouteData): Promise<SmartNavigationSession> {
    if (!this.isInitialized) {
      throw new Error('服务未初始化');
    }

    try {
      console.log('🧭 启动智能导航...', route.name);

      // 创建导航会话
      const session: SmartNavigationSession = {
        id: `nav_${Date.now()}`,
        route,
        startTime: Date.now(),
        currentLocation: this.lastGPSData || {
          latitude: route.waypoints[0].lat,
          longitude: route.waypoints[0].lng,
          accuracy: 10,
          timestamp: Date.now()
        },
        progress: {
          distanceCovered: 0,
          distanceRemaining: route.distance,
          timeElapsed: 0,
          estimatedTimeRemaining: route.estimatedTime,
          currentWaypoint: 0,
          completionPercentage: 0
        },
        guidance: [],
        aiAssistant: {
          isActive: true,
          conversationHistory: [],
          currentContext: this.lastAIContext || {} as AIContextData,
          suggestions: [],
          voiceEnabled: true
        },
        safetyMonitoring: {
          isActive: true,
          currentRiskLevel: 'low',
          activeAlerts: [],
          emergencyContacts: [],
          lastSafetyCheck: Date.now()
        },
        isActive: true
      };

      this.currentSession = session;

      // 启动地图导航
      await this.mapService.startNavigation(route);

      // 启动语音导航
      if (session.aiAssistant.voiceEnabled) {
        await this.voiceService.startNavigation(route);
      }

      // 确保追踪已启动
      if (!this.isTracking) {
        await this.startUnifiedTracking({
          gpsOptions: {
            enableHighAccuracy: true,
            updateInterval: 1000
          },
          aiOptions: {
            contextAwareness: true,
            realtimeAnalysis: true,
            predictiveMode: true,
            safetyMonitoring: true,
            performanceTracking: true
          }
        });
      }

      this.emit('smartNavigationStarted', session);
      console.log('✅ 智能导航已启动');
      
      return session;
      
    } catch (error) {
      console.error('❌ 启动智能导航失败:', error);
      throw error;
    }
  }

  /**
   * 停止智能导航
   */
  async stopSmartNavigation(): Promise<void> {
    if (!this.currentSession) {
      console.warn('⚠️ 没有活动的导航会话');
      return;
    }

    try {
      console.log('⏹️ 停止智能导航...');

      // 停止地图导航
      await this.mapService.stopNavigation();

      // 停止语音导航
      await this.voiceService.stopNavigation();

      // 标记会话为非活动状态
      this.currentSession.isActive = false;
      
      const session = this.currentSession;
      this.currentSession = null;

      this.emit('smartNavigationStopped', session);
      console.log('✅ 智能导航已停止');
      
    } catch (error) {
      console.error('❌ 停止智能导航失败:', error);
      throw error;
    }
  }

  /**
   * 处理融合数据
   */
  private handleFusedData(fusedData: FusedData): void {
    this.performanceMetrics.successfulFusions++;
    this.performanceMetrics.totalUpdates++;

    // 更新当前位置
    this.lastGPSData = fusedData.gps;

    // 检查安全警报
    if (fusedData.insights.safetyAnalysis.riskLevel === 'high' || 
        fusedData.insights.safetyAnalysis.riskLevel === 'critical') {
      this.triggerSafetyAlert(fusedData);
    }

    // 更新导航会话
    if (this.currentSession && this.currentSession.isActive) {
      this.updateNavigationSession(fusedData);
    }

    // 发出统一数据更新事件
    this.emit('unifiedDataUpdate', fusedData);
  }

  /**
   * 处理AI上下文更新
   */
  private handleAIContextUpdate(context: AIContextData): void {
    this.lastAIContext = context;
    this.fusionEngine.updateAIContext(context);
    this.emit('aiContextUpdate', context);
  }

  /**
   * 处理安全警报
   */
  private handleSafetyAlert(alert: SafetyAlert): void {
    console.warn('🚨 安全警报:', alert);
    
    // 如果有活动会话，添加到会话警报中
    if (this.currentSession) {
      this.currentSession.safetyMonitoring.activeAlerts.push(alert);
      this.currentSession.safetyMonitoring.currentRiskLevel = alert.severity as any;
    }

    this.emit('safetyAlert', alert);
  }

  /**
   * 触发安全警报
   */
  private triggerSafetyAlert(fusedData: FusedData): void {
    const alert: SafetyAlert = {
      id: `alert_${Date.now()}`,
      type: 'safety',
      severity: fusedData.insights.safetyAnalysis.riskLevel as any,
      location: fusedData.gps,
      message: `检测到${fusedData.insights.safetyAnalysis.riskLevel}风险`,
      recommendations: fusedData.insights.recommendations,
      timestamp: Date.now()
    };

    this.handleSafetyAlert(alert);
  }

  /**
   * 更新导航会话
   */
  private updateNavigationSession(fusedData: FusedData): void {
    if (!this.currentSession) return;

    // 更新当前位置
    this.currentSession.currentLocation = fusedData.gps;

    // 更新进度（简化计算）
    const timeElapsed = Date.now() - this.currentSession.startTime;
    this.currentSession.progress.timeElapsed = timeElapsed;

    // 更新AI助手建议
    this.currentSession.aiAssistant.suggestions = fusedData.insights.recommendations;

    // 发出导航更新事件
    this.emit('navigationUpdate', this.currentSession);
  }

  /**
   * 模拟GPS更新（用于测试）
   */
  private simulateGPSUpdates(): void {
    let lat = 31.2304;
    let lng = 121.4737;
    
    const updateInterval = setInterval(() => {
      if (!this.isTracking) {
        clearInterval(updateInterval);
        return;
      }

      // 模拟位置变化
      lat += (Math.random() - 0.5) * 0.0001;
      lng += (Math.random() - 0.5) * 0.0001;

      const gpsData: GPSData = {
        latitude: lat,
        longitude: lng,
        accuracy: 5 + Math.random() * 10,
        speed: 2 + Math.random() * 3,
        heading: Math.random() * 360,
        timestamp: Date.now()
      };

      this.fusionEngine.updateGPSData(gpsData);
      this.emit('gpsUpdate', gpsData);
      
    }, 2000);
  }

  /**
   * 模拟AI上下文更新（用于测试）
   */
  private simulateAIContextUpdates(): void {
    const updateInterval = setInterval(() => {
      if (!this.isTracking) {
        clearInterval(updateInterval);
        return;
      }

      const aiContext: AIContextData = {
        userPreferences: this.userPreferences || {
          preferredDistance: 5000,
          preferredDifficulty: 'medium',
          avoidBusyRoads: true,
          preferParks: true,
          timeOfDay: 'morning',
          weatherPreference: ['sunny', 'cloudy'],
          safetyPriority: 'high'
        },
        environmentalFactors: {
          weather: {
            temperature: 20 + Math.random() * 10,
            humidity: 50 + Math.random() * 30,
            windSpeed: Math.random() * 10,
            precipitation: Math.random() * 5,
            condition: 'sunny',
            uvIndex: Math.floor(Math.random() * 10)
          },
          airQuality: {
            aqi: 50 + Math.random() * 100,
            pm25: Math.random() * 50,
            pm10: Math.random() * 100,
            o3: Math.random() * 200,
            no2: Math.random() * 100,
            so2: Math.random() * 50,
            co: Math.random() * 10
          },
          trafficLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
          crowdDensity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
          lightingCondition: 'bright',
          noiseLevel: 40 + Math.random() * 40
        },
        historicalData: {
          previousRoutes: [],
          performanceMetrics: {
            averageSpeed: 3.5,
            maxSpeed: 6.0,
            totalDistance: 50000,
            totalTime: 600000,
            caloriesBurned: 2500,
            elevationGain: 500
          },
          preferences: this.userPreferences || {} as UserPreferences,
          incidents: []
        },
        currentActivity: {
          activityType: 'running',
          intensity: 'medium',
          duration: 30 * 60 * 1000, // 30分钟
          startTime: Date.now() - 10 * 60 * 1000, // 10分钟前开始
          currentPhase: 'active'
        },
        timestamp: Date.now()
      };

      this.handleAIContextUpdate(aiContext);
      
    }, 5000);
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isTracking: this.isTracking,
      hasActiveSession: !!this.currentSession,
      sessionId: this.currentSession?.id,
      lastGPSUpdate: this.lastGPSData?.timestamp,
      lastAIUpdate: this.lastAIContext?.timestamp,
      performanceMetrics: this.performanceMetrics,
      fusionEngineStatus: this.fusionEngine.getStatus()
    };
  }

  /**
   * 获取当前会话
   */
  getCurrentSession(): SmartNavigationSession | null {
    return this.currentSession;
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      fusionEngine: this.fusionEngine.getPerformanceMetrics()
    };
  }

  /**
   * 处理增强GPS更新
   */
  private handleEnhancedGPSUpdate(position: GPSData): void {
    this.lastGPSData = position;
    
    // 更新增强AI服务的GPS数据
    this.enhancedAIService.updateGPSData(position);
    
    // 更新融合引擎
    this.fusionEngine.updateGPSData(position);
    
    // 发出GPS更新事件
    this.emit('enhancedGpsUpdate', position);
    
    console.log('📍 增强GPS数据已更新:', {
      lat: position.latitude.toFixed(6),
      lng: position.longitude.toFixed(6),
      accuracy: position.accuracy
    });
  }

  /**
   * 处理增强AI分析
   */
  private handleEnhancedAIAnalysis(analysis: any): void {
    // 更新融合引擎的AI数据
    if (analysis.context) {
      this.fusionEngine.updateAIContext(analysis.context);
    }
    
    // 发出AI分析事件
    this.emit('enhancedAiAnalysis', analysis);
    
    console.log('🤖 增强AI分析已完成:', {
      type: analysis.type,
      confidence: analysis.confidence,
      insights: analysis.insights?.length || 0
    });
  }

  /**
   * 获取增强GPS性能指标
   */
  getEnhancedGPSMetrics() {
    return this.enhancedGPSService.getPerformanceMetrics();
  }

  /**
   * 获取增强AI性能指标
   */
  getEnhancedAIMetrics() {
    return this.enhancedAIService.getPerformanceMetrics();
  }

  /**
   * 获取GPS质量分析
   */
  getGPSQualityAnalysis() {
    return this.enhancedGPSService.getQualityAnalysis();
  }

  /**
   * 获取AI分析历史
   */
  getAIAnalysisHistory() {
    return this.enhancedAIService.getAnalysisHistory();
  }

  /**
   * 更新增强GPS选项
   */
  updateEnhancedGPSOptions(options: any): void {
    this.enhancedGPSService.updateOptions(options);
  }

  /**
   * 更新增强AI选项
   */
  updateEnhancedAIOptions(options: any): void {
    this.enhancedAIService.updateOptions(options);
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    console.log('🗑️ 销毁统一GPS+AI服务...');
    
    // 停止追踪
    if (this.isTracking) {
      this.stopUnifiedTracking();
    }

    // 停止融合引擎
    this.fusionEngine.stop();

    // 销毁增强服务
    this.enhancedGPSService.destroy();
    this.enhancedAIService.destroy();

    // 清理状态
    this.isInitialized = false;
    this.currentSession = null;
    this.lastGPSData = null;
    this.lastAIContext = null;

    // 移除所有监听器
    this.removeAllListeners();

    console.log('✅ 统一GPS+AI服务已销毁');
  }
}

export default UnifiedGPSAIService;