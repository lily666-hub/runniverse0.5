import { supabase } from '../lib/supabase';
import { RealtimeLocation, LocationHistory, SafetyAssessment } from '../types';
import { aiService } from './ai/aiService';
import type { AIContext } from '../types/ai';
import type { GPSData, FusedData } from '../types/unified';

export class LocationService {
  private static instance: LocationService;
  private locationBuffer: LocationHistory[] = [];
  private batchSize = 10;
  private batchTimeout = 30000; // 30秒
  private batchTimer: NodeJS.Timeout | null = null;
  
  // AI集成相关
  private aiContextCache: Map<string, AIContext> = new Map();
  private locationAnalysisBuffer: RealtimeLocation[] = [];
  private readonly AI_ANALYSIS_INTERVAL = 30000; // 30秒分析一次
  private aiAnalysisTimer: NodeJS.Timeout | null = null;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * 保存单个位置记录
   */
  async saveLocation(location: RealtimeLocation, userId: string): Promise<void> {
    try {
      const locationData: Omit<LocationHistory, 'id'> = {
        user_id: userId,
        latitude: location.latitude,
        longitude: location.longitude,
        altitude: location.altitude,
        accuracy: location.accuracy,
        speed: location.speed,
        heading: location.heading,
        recorded_at: location.timestamp.toISOString(),
        battery_level: await this.getBatteryLevel(),
        network_type: this.getNetworkType()
      };

      const { error } = await supabase
        .from('location_history')
        .insert([locationData]);

      if (error) {
        console.error('保存位置失败:', error);
        throw error;
      }
    } catch (error) {
      console.error('位置保存服务错误:', error);
      throw error;
    }
  }

  /**
   * 批量保存位置记录（用于性能优化）
   */
  async batchSaveLocation(location: RealtimeLocation, userId: string): Promise<void> {
    const locationData: Omit<LocationHistory, 'id'> = {
      user_id: userId,
      latitude: location.latitude,
      longitude: location.longitude,
      altitude: location.altitude,
      accuracy: location.accuracy,
      speed: location.speed,
      heading: location.heading,
      recorded_at: location.timestamp.toISOString(),
      battery_level: await this.getBatteryLevel(),
      network_type: this.getNetworkType()
    };

    this.locationBuffer.push(locationData as LocationHistory);

    // 如果缓冲区达到批量大小，立即保存
    if (this.locationBuffer.length >= this.batchSize) {
      await this.flushLocationBuffer();
    } else {
      // 设置定时器，确保数据不会丢失
      this.resetBatchTimer();
    }
  }

  /**
   * 刷新位置缓冲区
   */
  private async flushLocationBuffer(): Promise<void> {
    if (this.locationBuffer.length === 0) return;

    try {
      const { error } = await supabase
        .from('location_history')
        .insert(this.locationBuffer);

      if (error) {
        console.error('批量保存位置失败:', error);
        throw error;
      }

      this.locationBuffer = [];
      this.clearBatchTimer();
    } catch (error) {
      console.error('批量位置保存服务错误:', error);
      throw error;
    }
  }

  /**
   * 重置批量定时器
   */
  private resetBatchTimer(): void {
    this.clearBatchTimer();
    this.batchTimer = setTimeout(() => {
      this.flushLocationBuffer();
    }, this.batchTimeout);
  }

  /**
   * 清除批量定时器
   */
  private clearBatchTimer(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * 获取用户位置历史
   */
  async getLocationHistory(
    userId: string,
    limit: number = 100,
    startDate?: Date,
    endDate?: Date
  ): Promise<LocationHistory[]> {
    try {
      let query = supabase
        .from('location_history')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (startDate) {
        query = query.gte('recorded_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('recorded_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('获取位置历史失败:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('位置历史服务错误:', error);
      throw error;
    }
  }

  /**
   * 计算两点之间的距离（使用Haversine公式）
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // 地球半径（公里）
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 角度转弧度
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * 计算移动速度
   */
  calculateSpeed(
    location1: RealtimeLocation,
    location2: RealtimeLocation
  ): number {
    const distance = this.calculateDistance(
      location1.latitude,
      location1.longitude,
      location2.latitude,
      location2.longitude
    );
    const timeDiff = (location2.timestamp.getTime() - location1.timestamp.getTime()) / 1000; // 秒
    return distance / (timeDiff / 3600); // 公里/小时
  }

  /**
   * 检查位置是否在安全区域内
   */
  async isLocationSafe(latitude: number, longitude: number): Promise<boolean> {
    try {
      // 查询附近的安全评分
      const { data, error } = await supabase
        .from('route_safety_scores')
        .select('safety_score')
        .gte('latitude', latitude - 0.001) // 约100米范围
        .lte('latitude', latitude + 0.001)
        .gte('longitude', longitude - 0.001)
        .lte('longitude', longitude + 0.001)
        .order('safety_score', { ascending: false })
        .limit(1);

      if (error) {
        console.error('查询安全区域失败:', error);
        return false;
      }

      if (data && data.length > 0) {
        return data[0].safety_score >= 7.0; // 安全分数7分以上认为安全
      }

      return false; // 没有数据默认不安全
    } catch (error) {
      console.error('安全区域检查错误:', error);
      return false;
    }
  }

  /**
   * 获取当前时间段的安全评分
   */
  async getTimeSlotSafety(
    latitude: number,
    longitude: number,
    date: Date = new Date()
  ): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('get_time_slot_safety', {
          lat: latitude,
          lng: longitude,
          check_date: date.toISOString().split('T')[0]
        });

      if (error) {
        console.error('获取时间段安全评分失败:', error);
        return 5.0; // 默认中等安全
      }

      return data || 5.0;
    } catch (error) {
      console.error('时间段安全评分服务错误:', error);
      return 5.0;
    }
  }

  /**
   * 获取电池电量
   */
  private async getBatteryLevel(): Promise<number | null> {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        return Math.round(battery.level * 100);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取网络类型
   */
  private getNetworkType(): string | null {
    try {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      if (connection) {
        return connection.effectiveType || connection.type || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 清理旧的位置数据
   */
  async cleanupOldLocations(userId: string, daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { error } = await supabase
        .from('location_history')
        .delete()
        .eq('user_id', userId)
        .lt('recorded_at', cutoffDate.toISOString());

      if (error) {
        console.error('清理旧位置数据失败:', error);
        throw error;
      }
    } catch (error) {
      console.error('位置数据清理服务错误:', error);
      throw error;
    }
  }

  /**
   * 强制刷新缓冲区（在应用关闭前调用）
   */
  async forceFlush(): Promise<void> {
    await this.flushLocationBuffer();
  }

  // ==================== AI集成功能 ====================

  /**
   * 启动AI增强的位置追踪
   */
  async startAIEnhancedTracking(userId: string): Promise<void> {
    // 启动AI分析定时器
    this.aiAnalysisTimer = setInterval(() => {
      this.performAILocationAnalysis(userId);
    }, this.AI_ANALYSIS_INTERVAL);
  }

  /**
   * 停止AI增强的位置追踪
   */
  async stopAIEnhancedTracking(): Promise<void> {
    if (this.aiAnalysisTimer) {
      clearInterval(this.aiAnalysisTimer);
      this.aiAnalysisTimer = null;
    }
    this.locationAnalysisBuffer = [];
  }

  /**
   * 保存位置并进行AI分析
   */
  async saveLocationWithAIAnalysis(
    location: RealtimeLocation, 
    userId: string
  ): Promise<{
    saved: boolean;
    aiInsights?: string[];
    safetyAlerts?: any[];
  }> {
    try {
      // 保存位置数据
      await this.batchSaveLocation(location, userId);
      
      // 添加到AI分析缓冲区
      this.locationAnalysisBuffer.push(location);
      
      // 如果缓冲区达到一定大小，立即进行AI分析
      if (this.locationAnalysisBuffer.length >= 5) {
        const analysis = await this.performAILocationAnalysis(userId);
        return {
          saved: true,
          aiInsights: analysis.insights,
          safetyAlerts: analysis.alerts
        };
      }

      return { saved: true };
    } catch (error) {
      console.error('AI增强位置保存失败:', error);
      throw error;
    }
  }

  /**
   * 执行AI位置分析
   */
  private async performAILocationAnalysis(userId: string): Promise<{
    insights: string[];
    alerts: any[];
  }> {
    if (this.locationAnalysisBuffer.length === 0) {
      return { insights: [], alerts: [] };
    }

    try {
      const locations = [...this.locationAnalysisBuffer];
      this.locationAnalysisBuffer = []; // 清空缓冲区

      // 构建AI上下文
      const context = await this.buildLocationAIContext(locations, userId);
      
      // 发送到AI服务进行分析
      const response = await aiService.sendMessage(
        userId,
        this.generateLocationAnalysisPrompt(locations),
        undefined,
        context,
        'kimi',
        'safety'
      );

      // 解析AI响应
      const insights = this.extractInsightsFromResponse(response.response.message);
      const alerts = this.extractAlertsFromResponse(response.response);

      return { insights, alerts };
    } catch (error) {
      console.error('AI位置分析失败:', error);
      return { insights: [], alerts: [] };
    }
  }

  /**
   * 构建位置AI上下文
   */
  private async buildLocationAIContext(
    locations: RealtimeLocation[], 
    userId: string
  ): Promise<Partial<AIContext>> {
    const currentLocation = locations[locations.length - 1];
    const previousLocation = locations.length > 1 ? locations[locations.length - 2] : null;

    // 计算运动数据
    const totalDistance = this.calculateTotalDistance(locations);
    const averageSpeed = this.calculateAverageSpeed(locations);
    const currentSpeed = previousLocation ? 
      this.calculateSpeed(previousLocation, currentLocation) : 0;

    // 安全评估
    const safetyScore = await this.getTimeSlotSafety(
      currentLocation.latitude,
      currentLocation.longitude
    );

    return {
      locationData: {
        currentLocation: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          timestamp: currentLocation.timestamp
        },
        previousLocation: previousLocation ? {
          latitude: previousLocation.latitude,
          longitude: previousLocation.longitude,
          accuracy: previousLocation.accuracy,
          timestamp: previousLocation.timestamp
        } : undefined,
        movementData: {
          totalDistance,
          averageSpeed,
          currentSpeed,
          locationCount: locations.length
        }
      },
      safetyContext: {
        currentSafetyScore: safetyScore,
        timeOfDay: new Date().getHours(),
        isNightTime: this.isNightTime(),
        weatherConditions: 'unknown' // 可以集成天气API
      },
      userContext: {
        userId,
        activityType: 'running',
        sessionDuration: this.calculateSessionDuration(locations)
      }
    };
  }

  /**
   * 生成位置分析提示词
   */
  private generateLocationAnalysisPrompt(locations: RealtimeLocation[]): string {
    const currentLocation = locations[locations.length - 1];
    const totalDistance = this.calculateTotalDistance(locations);
    const averageSpeed = this.calculateAverageSpeed(locations);
    
    return `请分析我的跑步数据：
当前位置：${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}
总距离：${totalDistance.toFixed(2)}公里
平均速度：${averageSpeed.toFixed(1)}公里/小时
位置点数：${locations.length}
时间：${new Date().toLocaleString()}

请提供：
1. 跑步表现分析
2. 安全建议
3. 路线优化建议
4. 任何需要注意的安全警告`;
  }

  /**
   * 从AI响应中提取洞察
   */
  private extractInsightsFromResponse(message: string): string[] {
    const insights: string[] = [];
    
    // 简单的文本解析，实际可以更复杂
    const lines = message.split('\n');
    for (const line of lines) {
      if (line.includes('建议') || line.includes('分析') || line.includes('优化')) {
        insights.push(line.trim());
      }
    }
    
    return insights.slice(0, 3); // 最多返回3个洞察
  }

  /**
   * 从AI响应中提取警告
   */
  private extractAlertsFromResponse(response: any): any[] {
    const alerts: any[] = [];
    
    if (response.emergencyLevel === 'high' || response.emergencyLevel === 'critical') {
      alerts.push({
        type: 'safety',
        level: response.emergencyLevel,
        message: response.message,
        timestamp: new Date()
      });
    }
    
    return alerts;
  }

  /**
   * 计算总距离
   */
  private calculateTotalDistance(locations: RealtimeLocation[]): number {
    if (locations.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < locations.length; i++) {
      totalDistance += this.calculateDistance(
        locations[i-1].latitude,
        locations[i-1].longitude,
        locations[i].latitude,
        locations[i].longitude
      );
    }
    
    return totalDistance;
  }

  /**
   * 计算平均速度
   */
  private calculateAverageSpeed(locations: RealtimeLocation[]): number {
    if (locations.length < 2) return 0;
    
    const totalDistance = this.calculateTotalDistance(locations);
    const totalTime = (locations[locations.length - 1].timestamp.getTime() - 
                     locations[0].timestamp.getTime()) / 1000 / 3600; // 小时
    
    return totalTime > 0 ? totalDistance / totalTime : 0;
  }

  /**
   * 计算会话持续时间
   */
  private calculateSessionDuration(locations: RealtimeLocation[]): number {
    if (locations.length < 2) return 0;
    
    return (locations[locations.length - 1].timestamp.getTime() - 
            locations[0].timestamp.getTime()) / 1000; // 秒
  }

  /**
   * 判断是否为夜间
   */
  private isNightTime(): boolean {
    const hour = new Date().getHours();
    return hour < 6 || hour > 20;
  }

  /**
   * 转换为GPS数据格式
   */
  convertToGPSData(location: RealtimeLocation): GPSData {
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      altitude: location.altitude || 0,
      accuracy: location.accuracy,
      speed: location.speed || 0,
      heading: location.heading || 0,
      timestamp: location.timestamp,
      totalDistance: 0, // 需要外部计算
      isMoving: (location.speed || 0) > 0.5 // 0.5 km/h 阈值
    };
  }

  /**
   * 获取AI上下文缓存
   */
  getAIContext(userId: string): AIContext | undefined {
    return this.aiContextCache.get(userId);
  }

  /**
   * 设置AI上下文缓存
   */
  setAIContext(userId: string, context: AIContext): void {
    this.aiContextCache.set(userId, context);
  }

  /**
   * 清理AI上下文缓存
   */
  clearAIContext(userId: string): void {
    this.aiContextCache.delete(userId);
  }
}