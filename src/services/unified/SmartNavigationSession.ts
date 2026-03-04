/**
 * 智能导航会话管理器 - 实时导航和AI指导
 */

import { EventEmitter } from '../../utils/EventEmitter';
import type {
  SmartNavigationSession,
  RouteData,
  GPSData,
  NavigationGuidance,
  AIContextData,
  FusedData,
  SafetyAlert,
  ConversationMessage,
  RouteProgress
} from '../../types/unified';

export class SmartNavigationSessionManager extends EventEmitter {
  private session: SmartNavigationSession;
  private isActive = false;
  private guidanceHistory: NavigationGuidance[] = [];
  private conversationHistory: ConversationMessage[] = [];
  private lastLocationUpdate = 0;
  private routeCheckpoints: { distance: number; waypoint: number }[] = [];
  
  // 导航参数
  private readonly ARRIVAL_THRESHOLD = 50; // 到达阈值（米）
  private readonly GUIDANCE_DISTANCE = 100; // 提前指导距离（米）
  private readonly REROUTE_THRESHOLD = 100; // 重新规划阈值（米）

  constructor(route: RouteData, initialLocation: GPSData) {
    super();
    
    this.session = this.createSession(route, initialLocation);
    this.setupRouteCheckpoints();
    
    console.log('🧭 智能导航会话已创建:', this.session.id);
  }

  /**
   * 创建导航会话
   */
  private createSession(route: RouteData, initialLocation: GPSData): SmartNavigationSession {
    return {
      id: `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      route,
      startTime: Date.now(),
      currentLocation: initialLocation,
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
        currentContext: {} as AIContextData,
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
      isActive: false
    };
  }

  /**
   * 设置路线检查点
   */
  private setupRouteCheckpoints(): void {
    this.routeCheckpoints = [];
    let cumulativeDistance = 0;
    
    for (let i = 0; i < this.session.route.waypoints.length - 1; i++) {
      const waypoint1 = this.session.route.waypoints[i];
      const waypoint2 = this.session.route.waypoints[i + 1];
      
      const distance = this.calculateDistance(
        waypoint1.lat, waypoint1.lng,
        waypoint2.lat, waypoint2.lng
      );
      
      cumulativeDistance += distance;
      
      this.routeCheckpoints.push({
        distance: cumulativeDistance,
        waypoint: i + 1
      });
    }
    
    console.log('📍 路线检查点已设置:', this.routeCheckpoints.length);
  }

  /**
   * 启动导航会话
   */
  async start(): Promise<void> {
    if (this.isActive) {
      console.warn('⚠️ 导航会话已在运行');
      return;
    }

    try {
      this.isActive = true;
      this.session.isActive = true;
      this.session.startTime = Date.now();
      
      // 生成初始导航指导
      const initialGuidance = await this.generateInitialGuidance();
      this.session.guidance = [initialGuidance];
      
      // 启动AI助手
      await this.startAIAssistant();
      
      // 启动安全监控
      this.startSafetyMonitoring();
      
      this.emit('sessionStarted', this.session);
      console.log('✅ 智能导航会话已启动');
      
    } catch (error) {
      console.error('❌ 启动导航会话失败:', error);
      this.isActive = false;
      this.session.isActive = false;
      throw error;
    }
  }

  /**
   * 停止导航会话
   */
  async stop(): Promise<void> {
    if (!this.isActive) {
      console.warn('⚠️ 导航会话未在运行');
      return;
    }

    try {
      this.isActive = false;
      this.session.isActive = false;
      
      // 计算最终统计
      const finalStats = this.calculateFinalStats();
      
      this.emit('sessionStopped', {
        session: this.session,
        stats: finalStats
      });
      
      console.log('✅ 智能导航会话已停止');
      
    } catch (error) {
      console.error('❌ 停止导航会话失败:', error);
      throw error;
    }
  }

  /**
   * 更新位置
   */
  async updateLocation(gpsData: GPSData): Promise<void> {
    if (!this.isActive) return;

    const previousLocation = this.session.currentLocation;
    this.session.currentLocation = gpsData;
    this.lastLocationUpdate = Date.now();

    // 更新进度
    await this.updateProgress(previousLocation, gpsData);

    // 检查是否需要新的导航指导
    await this.checkForNewGuidance(gpsData);

    // 检查是否到达检查点
    await this.checkWaypointArrival(gpsData);

    // 检查是否偏离路线
    await this.checkRouteDeviation(gpsData);

    this.emit('locationUpdated', {
      session: this.session,
      previousLocation,
      currentLocation: gpsData
    });
  }

  /**
   * 更新进度
   */
  private async updateProgress(previousLocation: GPSData, currentLocation: GPSData): Promise<void> {
    // 计算移动距离
    const distanceMoved = this.calculateDistance(
      previousLocation.latitude, previousLocation.longitude,
      currentLocation.latitude, currentLocation.longitude
    );

    // 更新累计距离
    this.session.progress.distanceCovered += distanceMoved;
    this.session.progress.distanceRemaining = Math.max(
      0, 
      this.session.route.distance - this.session.progress.distanceCovered
    );

    // 更新时间
    this.session.progress.timeElapsed = Date.now() - this.session.startTime;

    // 计算完成百分比
    this.session.progress.completionPercentage = Math.min(
      100,
      (this.session.progress.distanceCovered / this.session.route.distance) * 100
    );

    // 估算剩余时间
    if (this.session.progress.distanceCovered > 0) {
      const averageSpeed = this.session.progress.distanceCovered / (this.session.progress.timeElapsed / 1000);
      this.session.progress.estimatedTimeRemaining = 
        this.session.progress.distanceRemaining / averageSpeed * 1000;
    }

    this.emit('progressUpdated', this.session.progress);
  }

  /**
   * 检查新的导航指导
   */
  private async checkForNewGuidance(gpsData: GPSData): Promise<void> {
    const currentWaypoint = this.session.route.waypoints[this.session.progress.currentWaypoint];
    if (!currentWaypoint) return;

    const distanceToWaypoint = this.calculateDistance(
      gpsData.latitude, gpsData.longitude,
      currentWaypoint.lat, currentWaypoint.lng
    );

    // 如果接近下一个路点，生成新的导航指导
    if (distanceToWaypoint <= this.GUIDANCE_DISTANCE) {
      const guidance = await this.generateNavigationGuidance(gpsData, currentWaypoint);
      
      if (guidance) {
        this.session.guidance.push(guidance);
        this.guidanceHistory.push(guidance);
        
        this.emit('newGuidance', guidance);
      }
    }
  }

  /**
   * 检查路点到达
   */
  private async checkWaypointArrival(gpsData: GPSData): Promise<void> {
    const currentWaypoint = this.session.route.waypoints[this.session.progress.currentWaypoint];
    if (!currentWaypoint) return;

    const distanceToWaypoint = this.calculateDistance(
      gpsData.latitude, gpsData.longitude,
      currentWaypoint.lat, currentWaypoint.lng
    );

    if (distanceToWaypoint <= this.ARRIVAL_THRESHOLD) {
      // 到达当前路点
      this.session.progress.currentWaypoint++;
      
      const arrivalEvent = {
        waypointIndex: this.session.progress.currentWaypoint - 1,
        waypoint: currentWaypoint,
        arrivalTime: Date.now(),
        location: gpsData
      };

      this.emit('waypointArrived', arrivalEvent);

      // 检查是否完成整个路线
      if (this.session.progress.currentWaypoint >= this.session.route.waypoints.length) {
        await this.handleRouteCompletion();
      } else {
        // 生成下一段的导航指导
        const nextGuidance = await this.generateNextSegmentGuidance();
        if (nextGuidance) {
          this.session.guidance.push(nextGuidance);
          this.emit('newGuidance', nextGuidance);
        }
      }
    }
  }

  /**
   * 检查路线偏离
   */
  private async checkRouteDeviation(gpsData: GPSData): Promise<void> {
    // 简化的路线偏离检测
    const currentWaypoint = this.session.route.waypoints[this.session.progress.currentWaypoint];
    if (!currentWaypoint) return;

    const distanceToRoute = this.calculateDistanceToRoute(gpsData);
    
    if (distanceToRoute > this.REROUTE_THRESHOLD) {
      const deviationEvent = {
        location: gpsData,
        distanceFromRoute: distanceToRoute,
        suggestedAction: 'reroute',
        timestamp: Date.now()
      };

      this.emit('routeDeviation', deviationEvent);
      
      // 可以在这里触发重新规划路线
      await this.handleRouteDeviation(gpsData);
    }
  }

  /**
   * 处理路线偏离
   */
  private async handleRouteDeviation(gpsData: GPSData): Promise<void> {
    console.log('🔄 检测到路线偏离，建议重新规划');
    
    // 生成重新规划建议
    const rerouteGuidance: NavigationGuidance = {
      instruction: '您已偏离原定路线',
      distance: 0,
      direction: 'straight',
      estimatedTime: 0,
      voicePrompt: '您已偏离原定路线，建议重新规划路线',
      priority: 'high'
    };

    this.session.guidance.push(rerouteGuidance);
    this.emit('newGuidance', rerouteGuidance);
  }

  /**
   * 处理路线完成
   */
  private async handleRouteCompletion(): Promise<void> {
    console.log('🎉 路线完成！');
    
    const completionEvent = {
      session: this.session,
      completionTime: Date.now(),
      totalTime: this.session.progress.timeElapsed,
      totalDistance: this.session.progress.distanceCovered,
      averageSpeed: this.session.progress.distanceCovered / (this.session.progress.timeElapsed / 1000)
    };

    this.emit('routeCompleted', completionEvent);
    
    // 自动停止会话
    await this.stop();
  }

  /**
   * 生成初始导航指导
   */
  private async generateInitialGuidance(): Promise<NavigationGuidance> {
    const firstWaypoint = this.session.route.waypoints[0];
    const secondWaypoint = this.session.route.waypoints[1];
    
    if (!secondWaypoint) {
      return {
        instruction: '开始您的跑步之旅',
        distance: 0,
        direction: 'straight',
        estimatedTime: 0,
        voicePrompt: '开始您的跑步之旅，祝您运动愉快',
        priority: 'medium'
      };
    }

    const distance = this.calculateDistance(
      firstWaypoint.lat, firstWaypoint.lng,
      secondWaypoint.lat, secondWaypoint.lng
    );

    const direction = this.calculateDirection(
      firstWaypoint.lat, firstWaypoint.lng,
      secondWaypoint.lat, secondWaypoint.lng
    );

    return {
      instruction: `前往 ${secondWaypoint.name}`,
      distance: Math.round(distance),
      direction,
      estimatedTime: Math.round(distance / 1.4), // 假设步行速度1.4m/s
      voicePrompt: `开始导航，前往${secondWaypoint.name}，距离约${Math.round(distance)}米`,
      landmark: secondWaypoint.desc,
      priority: 'high'
    };
  }

  /**
   * 生成导航指导
   */
  private async generateNavigationGuidance(
    currentLocation: GPSData, 
    targetWaypoint: any
  ): Promise<NavigationGuidance | null> {
    const distance = this.calculateDistance(
      currentLocation.latitude, currentLocation.longitude,
      targetWaypoint.lat, targetWaypoint.lng
    );

    if (distance > this.GUIDANCE_DISTANCE) {
      return null; // 距离太远，不需要指导
    }

    const direction = this.calculateDirection(
      currentLocation.latitude, currentLocation.longitude,
      targetWaypoint.lat, targetWaypoint.lng
    );

    const estimatedTime = Math.round(distance / 1.4); // 假设步行速度

    return {
      instruction: `继续前往 ${targetWaypoint.name}`,
      distance: Math.round(distance),
      direction,
      estimatedTime,
      voicePrompt: `继续前往${targetWaypoint.name}，还有${Math.round(distance)}米`,
      landmark: targetWaypoint.desc,
      priority: 'medium'
    };
  }

  /**
   * 生成下一段导航指导
   */
  private async generateNextSegmentGuidance(): Promise<NavigationGuidance | null> {
    const nextWaypoint = this.session.route.waypoints[this.session.progress.currentWaypoint];
    if (!nextWaypoint) return null;

    const distance = this.calculateDistance(
      this.session.currentLocation.latitude, this.session.currentLocation.longitude,
      nextWaypoint.lat, nextWaypoint.lng
    );

    const direction = this.calculateDirection(
      this.session.currentLocation.latitude, this.session.currentLocation.longitude,
      nextWaypoint.lat, nextWaypoint.lng
    );

    return {
      instruction: `前往下一个目标点：${nextWaypoint.name}`,
      distance: Math.round(distance),
      direction,
      estimatedTime: Math.round(distance / 1.4),
      voicePrompt: `很好！现在前往下一个目标点${nextWaypoint.name}，距离${Math.round(distance)}米`,
      landmark: nextWaypoint.desc,
      priority: 'high'
    };
  }

  /**
   * 启动AI助手
   */
  private async startAIAssistant(): Promise<void> {
    this.session.aiAssistant.isActive = true;
    
    // 添加欢迎消息
    const welcomeMessage: ConversationMessage = {
      id: `msg_${Date.now()}`,
      type: 'assistant',
      content: `您好！我是您的AI跑步助手。今天我们将一起完成"${this.session.route.name}"路线，全程约${(this.session.route.distance / 1000).toFixed(1)}公里。让我们开始这段美好的跑步之旅吧！`,
      timestamp: Date.now()
    };

    this.session.aiAssistant.conversationHistory.push(welcomeMessage);
    this.conversationHistory.push(welcomeMessage);
    
    this.emit('aiMessage', welcomeMessage);
  }

  /**
   * 启动安全监控
   */
  private startSafetyMonitoring(): void {
    this.session.safetyMonitoring.isActive = true;
    this.session.safetyMonitoring.lastSafetyCheck = Date.now();
    
    // 定期安全检查
    const safetyCheckInterval = setInterval(() => {
      if (!this.isActive) {
        clearInterval(safetyCheckInterval);
        return;
      }
      
      this.performSafetyCheck();
    }, 30000); // 每30秒检查一次
  }

  /**
   * 执行安全检查
   */
  private performSafetyCheck(): void {
    this.session.safetyMonitoring.lastSafetyCheck = Date.now();
    
    // 检查是否长时间没有位置更新
    const timeSinceLastUpdate = Date.now() - this.lastLocationUpdate;
    if (timeSinceLastUpdate > 60000) { // 超过1分钟没有更新
      const alert: SafetyAlert = {
        id: `safety_${Date.now()}`,
        type: 'medical',
        severity: 'medium',
        location: this.session.currentLocation,
        message: '长时间没有位置更新，请确认您的安全状况',
        recommendations: ['检查GPS信号', '确认设备正常', '如有紧急情况请求助'],
        timestamp: Date.now()
      };
      
      this.addSafetyAlert(alert);
    }
  }

  /**
   * 添加安全警报
   */
  addSafetyAlert(alert: SafetyAlert): void {
    this.session.safetyMonitoring.activeAlerts.push(alert);
    
    // 更新风险等级
    if (alert.severity === 'critical') {
      this.session.safetyMonitoring.currentRiskLevel = 'critical';
    } else if (alert.severity === 'high' && this.session.safetyMonitoring.currentRiskLevel !== 'critical') {
      this.session.safetyMonitoring.currentRiskLevel = 'high';
    } else if (alert.severity === 'medium' && this.session.safetyMonitoring.currentRiskLevel === 'low') {
      this.session.safetyMonitoring.currentRiskLevel = 'medium';
    }
    
    this.emit('safetyAlert', alert);
  }

  /**
   * 更新AI上下文
   */
  updateAIContext(context: AIContextData): void {
    this.session.aiAssistant.currentContext = context;
    
    // 基于上下文生成建议
    const suggestions = this.generateAISuggestions(context);
    this.session.aiAssistant.suggestions = suggestions;
    
    this.emit('aiContextUpdated', context);
  }

  /**
   * 生成AI建议
   */
  private generateAISuggestions(context: AIContextData): string[] {
    const suggestions = [];
    
    // 基于天气的建议
    if (context.environmentalFactors?.weather.temperature > 30) {
      suggestions.push('天气较热，建议适当放慢速度并多补充水分');
    }
    
    // 基于活动强度的建议
    if (context.currentActivity?.intensity === 'high') {
      suggestions.push('当前运动强度较高，注意监控心率和呼吸');
    }
    
    // 基于进度的建议
    if (this.session.progress.completionPercentage > 50) {
      suggestions.push('已完成一半路程，保持当前节奏！');
    }
    
    return suggestions;
  }

  /**
   * 处理用户消息
   */
  async handleUserMessage(message: string): Promise<ConversationMessage> {
    const userMessage: ConversationMessage = {
      id: `msg_${Date.now()}_user`,
      type: 'user',
      content: message,
      timestamp: Date.now()
    };

    this.session.aiAssistant.conversationHistory.push(userMessage);
    this.conversationHistory.push(userMessage);

    // 生成AI回复（简化版本）
    const aiResponse = await this.generateAIResponse(message);
    
    const assistantMessage: ConversationMessage = {
      id: `msg_${Date.now()}_assistant`,
      type: 'assistant',
      content: aiResponse,
      timestamp: Date.now()
    };

    this.session.aiAssistant.conversationHistory.push(assistantMessage);
    this.conversationHistory.push(assistantMessage);

    this.emit('conversationUpdate', {
      userMessage,
      assistantMessage
    });

    return assistantMessage;
  }

  /**
   * 生成AI回复
   */
  private async generateAIResponse(userMessage: string): Promise<string> {
    // 简化的AI回复逻辑
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('累') || lowerMessage.includes('疲劳')) {
      return '我理解您感到疲劳。建议您适当放慢速度，深呼吸，如果需要可以短暂休息。记住，安全第一！';
    }
    
    if (lowerMessage.includes('水') || lowerMessage.includes('渴')) {
      return '补充水分很重要！建议您找个安全的地方停下来喝水，特别是在炎热的天气里。';
    }
    
    if (lowerMessage.includes('路') || lowerMessage.includes('方向')) {
      const nextWaypoint = this.session.route.waypoints[this.session.progress.currentWaypoint];
      if (nextWaypoint) {
        return `您当前的目标是前往${nextWaypoint.name}。请按照导航指示继续前进。`;
      }
      return '请按照当前的导航指示继续前进，我会为您提供实时指导。';
    }
    
    return '我在这里为您提供支持！如果您有任何问题或需要帮助，随时告诉我。';
  }

  /**
   * 计算最终统计
   */
  private calculateFinalStats() {
    const totalTime = this.session.progress.timeElapsed;
    const totalDistance = this.session.progress.distanceCovered;
    const averageSpeed = totalDistance / (totalTime / 1000); // m/s
    
    return {
      totalTime,
      totalDistance,
      averageSpeed,
      completionPercentage: this.session.progress.completionPercentage,
      waypointsVisited: this.session.progress.currentWaypoint,
      guidanceCount: this.guidanceHistory.length,
      conversationCount: this.conversationHistory.length,
      safetyAlerts: this.session.safetyMonitoring.activeAlerts.length
    };
  }

  /**
   * 计算两点间距离（米）
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * 计算方向
   */
  private calculateDirection(lat1: number, lng1: number, lat2: number, lng2: number): 'straight' | 'left' | 'right' | 'u-turn' {
    const bearing = this.calculateBearing(lat1, lng1, lat2, lng2);
    
    // 简化的方向判断
    if (bearing >= -45 && bearing <= 45) return 'straight';
    if (bearing > 45 && bearing <= 135) return 'right';
    if (bearing > 135 || bearing <= -135) return 'u-turn';
    return 'left';
  }

  /**
   * 计算方位角
   */
  private calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);

    return (θ * 180 / Math.PI + 360) % 360;
  }

  /**
   * 计算到路线的距离
   */
  private calculateDistanceToRoute(gpsData: GPSData): number {
    // 简化实现：计算到当前目标路点的距离
    const currentWaypoint = this.session.route.waypoints[this.session.progress.currentWaypoint];
    if (!currentWaypoint) return 0;

    return this.calculateDistance(
      gpsData.latitude, gpsData.longitude,
      currentWaypoint.lat, currentWaypoint.lng
    );
  }

  /**
   * 获取会话状态
   */
  getSession(): SmartNavigationSession {
    return { ...this.session };
  }

  /**
   * 获取会话统计
   */
  getStats() {
    return {
      isActive: this.isActive,
      session: this.session,
      guidanceHistory: this.guidanceHistory,
      conversationHistory: this.conversationHistory,
      routeCheckpoints: this.routeCheckpoints
    };
  }
}

export default SmartNavigationSessionManager;