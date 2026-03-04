/**
 * 增强的GPS服务 - 优化性能和集成能力
 * 提供高精度GPS追踪、智能缓存、自适应频率调整等功能
 */

import { EventEmitter } from '../../utils/EventEmitter';
import type { GPSData, GPSPosition } from '../../types/unified';

export interface EnhancedGPSOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  trackingInterval?: number;
  adaptiveFrequency?: boolean;
  memoryOptimization?: boolean;
  smartFiltering?: boolean;
  backgroundTracking?: boolean;
  powerOptimization?: boolean;
}

export interface GPSPerformanceMetrics {
  accuracy: number;
  updateFrequency: number;
  batteryUsage: number;
  signalStrength: 'excellent' | 'good' | 'medium' | 'fair' | 'poor';
  lastUpdateTime: number;
  totalUpdates: number;
  averageAccuracy: number;
  positionBuffer: number;
}

export interface GPSQualityAnalysis {
  signalQuality: 'excellent' | 'good' | 'medium' | 'fair' | 'poor' | 'unknown';
  accuracy: number;
  stability: number;
  reliability: number;
  recommendations: string[];
}

export class EnhancedGPSService extends EventEmitter {
  private static instance: EnhancedGPSService | null = null;
  
  private isInitialized = false;
  private isTracking = false;
  private watchId: number | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  
  private currentPosition: GPSData | null = null;
  private positionHistory: GPSData[] = [];
  private options: EnhancedGPSOptions;
  
  // 性能优化相关
  private performanceMetrics: GPSPerformanceMetrics;
  private positionBuffer: GPSData[] = [];
  private lastUpdateTime = 0;
  private adaptiveInterval = 1000;
  private qualityThreshold = 50; // 精度阈值（米）
  
  // 智能过滤相关
  private velocityFilter = new KalmanFilter();
  private positionFilter = new KalmanFilter();
  private outlierDetector = new OutlierDetector();
  
  private constructor(options: EnhancedGPSOptions = {}) {
    super();
    
    this.options = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0,
      trackingInterval: 1000,
      adaptiveFrequency: true,
      memoryOptimization: true,
      smartFiltering: true,
      backgroundTracking: false,
      powerOptimization: true,
      ...options
    };
    
    this.performanceMetrics = {
      accuracy: 0,
      updateFrequency: 0,
      batteryUsage: 0,
      signalStrength: 'unknown',
      lastUpdateTime: 0,
      totalUpdates: 0,
      averageAccuracy: 0,
      positionBuffer: 0
    };
    
    this.setupPerformanceMonitoring();
  }
  
  static getInstance(options?: EnhancedGPSOptions): EnhancedGPSService {
    if (!EnhancedGPSService.instance) {
      EnhancedGPSService.instance = new EnhancedGPSService(options);
    }
    return EnhancedGPSService.instance;
  }
  
  /**
   * 初始化GPS服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('🛰️ 初始化增强GPS服务...');
    
    try {
      // 检查GPS支持
      if (!('geolocation' in navigator)) {
        throw new Error('设备不支持GPS定位');
      }
      
      // 检查权限
      await this.checkPermissions();
      
      // 初始化过滤器
      this.initializeFilters();
      
      // 设置自适应频率
      if (this.options.adaptiveFrequency) {
        this.setupAdaptiveFrequency();
      }
      
      // 设置内存优化
      if (this.options.memoryOptimization) {
        this.setupMemoryOptimization();
      }
      
      this.isInitialized = true;
      this.emit('initialized');
      
      console.log('✅ 增强GPS服务初始化完成');
    } catch (error) {
      console.error('❌ GPS服务初始化失败:', error);
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * 开始GPS追踪
   */
  async startTracking(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (this.isTracking) return;
    
    console.log('📍 开始GPS追踪...');
    
    try {
      // 获取初始位置
      await this.getCurrentPosition();
      
      // 开始持续追踪
      this.startContinuousTracking();
      
      this.isTracking = true;
      this.emit('trackingStarted');
      
      console.log('✅ GPS追踪已开始');
    } catch (error) {
      console.error('❌ GPS追踪启动失败:', error);
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * 停止GPS追踪
   */
  stopTracking(): void {
    if (!this.isTracking) return;
    
    console.log('📍 停止GPS追踪...');
    
    // 清理追踪
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isTracking = false;
    this.emit('trackingStopped');
    
    console.log('✅ GPS追踪已停止');
  }
  
  /**
   * 获取当前位置
   */
  async getCurrentPosition(): Promise<GPSData> {
    return new Promise((resolve, reject) => {
      const options: PositionOptions = {
        enableHighAccuracy: this.options.enableHighAccuracy,
        timeout: this.options.timeout,
        maximumAge: this.options.maximumAge
      };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const gpsData = this.convertToGPSData(position);
          this.handlePositionUpdate(gpsData);
          resolve(gpsData);
        },
        (error) => {
          console.error('GPS定位失败:', error);
          this.emit('error', error);
          reject(error);
        },
        options
      );
    });
  }
  
  /**
   * 获取位置历史
   */
  getPositionHistory(): GPSData[] {
    return [...this.positionHistory];
  }
  
  /**
   * 获取当前位置
   */
  getCurrentGPSData(): GPSData | null {
    return this.currentPosition;
  }
  
  /**
   * 获取性能指标
   */
  getPerformanceMetrics(): GPSPerformanceMetrics {
    return { ...this.performanceMetrics };
  }
  
  /**
   * 获取GPS质量分析
   */
  getQualityAnalysis(): GPSQualityAnalysis {
    const accuracy = this.currentPosition?.accuracy || 0;
    const signalQuality = this.getSignalQuality(accuracy);
    
    return {
      signalQuality,
      accuracy,
      stability: this.calculateStability(),
      reliability: this.calculateReliability(),
      recommendations: this.generateRecommendations(signalQuality, accuracy)
    };
  }
  
  /**
   * 清除位置历史
   */
  clearHistory(): void {
    this.positionHistory = [];
    this.positionBuffer = [];
    this.performanceMetrics.totalUpdates = 0;
    this.emit('historyCleared');
  }
  
  /**
   * 设置追踪选项
   */
  updateOptions(newOptions: Partial<EnhancedGPSOptions>): void {
    this.options = { ...this.options, ...newOptions };
    
    if (this.isTracking) {
      // 重启追踪以应用新选项
      this.stopTracking();
      setTimeout(() => this.startTracking(), 100);
    }
  }
  
  /**
   * 销毁服务
   */
  destroy(): void {
    this.stopTracking();
    this.removeAllListeners();
    this.positionHistory = [];
    this.positionBuffer = [];
    this.currentPosition = null;
    this.isInitialized = false;
    
    EnhancedGPSService.instance = null;
    console.log('🗑️ 增强GPS服务已销毁');
  }
  
  // ==================== 私有方法 ====================
  
  /**
   * 检查权限
   */
  private async checkPermissions(): Promise<void> {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        
        if (permission.state === 'denied') {
          throw new Error('GPS权限被拒绝');
        }
        
        console.log('GPS权限状态:', permission.state);
      } catch (error) {
        console.warn('无法检查GPS权限:', error);
      }
    }
  }
  
  /**
   * 初始化过滤器
   */
  private initializeFilters(): void {
    if (this.options.smartFiltering) {
      // 初始化卡尔曼滤波器
      this.velocityFilter.init(0, 1, 0.1, 1);
      this.positionFilter.init(0, 1, 0.1, 1);
      
      console.log('🔧 GPS智能过滤器已初始化');
    }
  }
  
  /**
   * 设置自适应频率
   */
  private setupAdaptiveFrequency(): void {
    // 根据设备性能和电池状态调整频率
    const updateFrequency = () => {
      const battery = (navigator as any).battery;
      const deviceMemory = (navigator as any).deviceMemory || 4;
      
      let baseInterval = this.options.trackingInterval || 1000;
      
      // 根据设备内存调整
      if (deviceMemory < 2) {
        baseInterval *= 2; // 低内存设备降低频率
      } else if (deviceMemory > 8) {
        baseInterval *= 0.8; // 高内存设备提高频率
      }
      
      // 根据电池状态调整
      if (battery && battery.level < 0.2) {
        baseInterval *= 1.5; // 低电量时降低频率
      }
      
      this.adaptiveInterval = Math.max(baseInterval, 500);
    };
    
    updateFrequency();
    
    // 定期更新频率
    setInterval(updateFrequency, 30000);
  }
  
  /**
   * 设置内存优化
   */
  private setupMemoryOptimization(): void {
    // 定期清理旧数据
    setInterval(() => {
      const maxHistorySize = 1000;
      const maxBufferSize = 100;
      
      if (this.positionHistory.length > maxHistorySize) {
        this.positionHistory = this.positionHistory.slice(-maxHistorySize);
      }
      
      if (this.positionBuffer.length > maxBufferSize) {
        this.positionBuffer = this.positionBuffer.slice(-maxBufferSize);
      }
      
      this.performanceMetrics.positionBuffer = this.positionBuffer.length;
    }, 60000); // 每分钟清理一次
  }
  
  /**
   * 设置性能监控
   */
  private setupPerformanceMonitoring(): void {
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 5000); // 每5秒更新一次性能指标
  }
  
  /**
   * 开始持续追踪
   */
  private startContinuousTracking(): void {
    const options: PositionOptions = {
      enableHighAccuracy: this.options.enableHighAccuracy,
      timeout: this.options.timeout,
      maximumAge: this.options.maximumAge
    };
    
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const gpsData = this.convertToGPSData(position);
        this.handlePositionUpdate(gpsData);
      },
      (error) => {
        console.error('GPS追踪错误:', error);
        this.emit('error', error);
      },
      options
    );
  }
  
  /**
   * 处理位置更新
   */
  private handlePositionUpdate(gpsData: GPSData): void {
    const now = Date.now();
    
    // 应用智能过滤
    if (this.options.smartFiltering) {
      gpsData = this.applySmartFiltering(gpsData);
    }
    
    // 检查数据质量
    if (!this.isValidPosition(gpsData)) {
      console.warn('GPS数据质量不佳，跳过更新');
      return;
    }
    
    // 更新当前位置
    this.currentPosition = gpsData;
    
    // 添加到历史记录
    this.positionHistory.push(gpsData);
    this.positionBuffer.push(gpsData);
    
    // 更新性能指标
    this.performanceMetrics.totalUpdates++;
    this.performanceMetrics.lastUpdateTime = now;
    this.performanceMetrics.accuracy = gpsData.accuracy;
    
    // 发出事件
    this.emit('positionUpdate', gpsData);
    
    this.lastUpdateTime = now;
  }
  
  /**
   * 应用智能过滤
   */
  private applySmartFiltering(gpsData: GPSData): GPSData {
    // 异常值检测
    if (this.outlierDetector.isOutlier(gpsData, this.positionHistory)) {
      console.warn('检测到GPS异常值，使用过滤后的数据');
      return this.outlierDetector.getFilteredPosition(gpsData, this.currentPosition);
    }
    
    // 卡尔曼滤波
    const filteredLat = this.positionFilter.update(gpsData.latitude);
    const filteredLng = this.positionFilter.update(gpsData.longitude);
    
    return {
      ...gpsData,
      latitude: filteredLat,
      longitude: filteredLng
    };
  }
  
  /**
   * 验证位置数据
   */
  private isValidPosition(gpsData: GPSData): boolean {
    // 检查基本有效性
    if (!gpsData.latitude || !gpsData.longitude) return false;
    if (Math.abs(gpsData.latitude) > 90 || Math.abs(gpsData.longitude) > 180) return false;
    
    // 检查精度
    if (gpsData.accuracy > this.qualityThreshold * 2) return false;
    
    // 检查时间间隔
    const timeDiff = gpsData.timestamp - this.lastUpdateTime;
    if (timeDiff < this.adaptiveInterval * 0.5) return false;
    
    return true;
  }
  
  /**
   * 转换为GPS数据格式
   */
  private convertToGPSData(position: GeolocationPosition): GPSData {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || undefined,
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined,
      timestamp: position.timestamp
    };
  }
  
  /**
   * 获取信号质量
   */
  private getSignalQuality(accuracy: number): 'excellent' | 'good' | 'medium' | 'fair' | 'poor' {
    if (accuracy <= 5) return 'excellent';
    if (accuracy <= 10) return 'good';
    if (accuracy <= 20) return 'medium';
    if (accuracy <= 50) return 'fair';
    return 'poor';
  }
  
  /**
   * 计算稳定性
   */
  private calculateStability(): number {
    if (this.positionHistory.length < 5) return 0;
    
    const recent = this.positionHistory.slice(-5);
    const accuracyVariance = this.calculateVariance(recent.map(p => p.accuracy));
    
    return Math.max(0, 100 - accuracyVariance);
  }
  
  /**
   * 计算可靠性
   */
  private calculateReliability(): number {
    const totalUpdates = this.performanceMetrics.totalUpdates;
    const expectedUpdates = (Date.now() - (this.positionHistory[0]?.timestamp || Date.now())) / this.adaptiveInterval;
    
    return Math.min(100, (totalUpdates / expectedUpdates) * 100);
  }
  
  /**
   * 生成建议
   */
  private generateRecommendations(signalQuality: string, accuracy: number): string[] {
    const recommendations: string[] = [];
    
    if (signalQuality === 'poor' || accuracy > 50) {
      recommendations.push('建议移动到开阔区域以获得更好的GPS信号');
      recommendations.push('确保设备GPS功能已启用');
    }
    
    if (this.performanceMetrics.batteryUsage > 80) {
      recommendations.push('考虑降低GPS更新频率以节省电量');
    }
    
    if (this.calculateStability() < 50) {
      recommendations.push('GPS信号不稳定，建议等待信号稳定后再开始追踪');
    }
    
    return recommendations;
  }
  
  /**
   * 计算方差
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return variance;
  }
  
  /**
   * 更新性能指标
   */
  private updatePerformanceMetrics(): void {
    if (this.positionHistory.length === 0) return;
    
    const recentPositions = this.positionHistory.slice(-10);
    const averageAccuracy = recentPositions.reduce((sum, pos) => sum + pos.accuracy, 0) / recentPositions.length;
    
    this.performanceMetrics.averageAccuracy = averageAccuracy;
    this.performanceMetrics.signalStrength = this.getSignalQuality(averageAccuracy);
    this.performanceMetrics.updateFrequency = this.adaptiveInterval;
    
    // 估算电池使用情况（简化版本）
    const updateRate = 1000 / this.adaptiveInterval;
    this.performanceMetrics.batteryUsage = Math.min(100, updateRate * 10);
  }
}

// ==================== 辅助类 ====================

/**
 * 卡尔曼滤波器
 */
export class KalmanFilter {
  private x = 0; // 状态
  private P = 1; // 协方差
  private Q = 0.1; // 过程噪声
  private R = 1; // 测量噪声
  
  init(initialValue: number, initialCovariance: number, processNoise: number, measurementNoise: number): void {
    this.x = initialValue;
    this.P = initialCovariance;
    this.Q = processNoise;
    this.R = measurementNoise;
  }
  
  update(measurement: number): number {
    // 预测
    this.P += this.Q;
    
    // 更新
    const K = this.P / (this.P + this.R);
    this.x += K * (measurement - this.x);
    this.P *= (1 - K);
    
    return this.x;
  }
}

/**
 * 异常值检测器
 */
export class OutlierDetector {
  isOutlier(current: GPSData, history: GPSData[]): boolean {
    if (history.length < 3) return false;
    
    const recent = history.slice(-3);
    const avgLat = recent.reduce((sum, pos) => sum + pos.latitude, 0) / recent.length;
    const avgLng = recent.reduce((sum, pos) => sum + pos.longitude, 0) / recent.length;
    
    const distance = this.calculateDistance(current.latitude, current.longitude, avgLat, avgLng);
    
    // 如果距离超过100米且精度较差，认为是异常值
    return distance > 100 && current.accuracy > 50;
  }
  
  getFilteredPosition(current: GPSData, previous: GPSData | null): GPSData {
    if (!previous) return current;
    
    // 使用加权平均
    const weight = Math.min(1, 20 / current.accuracy); // 精度越高权重越大
    
    return {
      ...current,
      latitude: previous.latitude * (1 - weight) + current.latitude * weight,
      longitude: previous.longitude * (1 - weight) + current.longitude * weight
    };
  }
  
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}