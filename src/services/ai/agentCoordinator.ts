import { AgentService } from './agentService';
import { AIService } from './aiService';

// 智能体协调器类型定义
export interface AgentCoordinationEvent {
  type: 'route_selected' | 'challenge_started' | 'safety_alert' | 'user_preference_updated';
  agentId: string;
  data: any;
  timestamp: Date;
  userId?: string;
}

export interface CrossAgentData {
  userProfile: any;
  currentRoute?: any;
  activeChallenge?: any;
  safetyStatus: any;
  preferences: any;
}

export interface AgentSyncState {
  routeAgent: {
    lastUpdate: Date;
    data: any;
  };
  challengeAgent: {
    lastUpdate: Date;
    data: any;
  };
  safetyAgent: {
    lastUpdate: Date;
    data: any;
  };
}

/**
 * 智能体协调器
 * 负责管理三个智能体间的数据共享、状态同步和协调工作
 */
export class AgentCoordinator {
  private agentService: AgentService;
  private aiService: AIService;
  private eventListeners: Map<string, Function[]> = new Map();
  private syncState: AgentSyncState;
  private crossAgentData: CrossAgentData;

  constructor() {
    this.agentService = new AgentService();
    this.aiService = new AIService();
    this.syncState = {
      routeAgent: { lastUpdate: new Date(), data: null },
      challengeAgent: { lastUpdate: new Date(), data: null },
      safetyAgent: { lastUpdate: new Date(), data: null }
    };
    this.crossAgentData = {
      userProfile: null,
      safetyStatus: { level: 'normal', alerts: [] },
      preferences: {}
    };
  }

  /**
   * 初始化协调器
   */
  async initialize(userId: string): Promise<void> {
    try {
      // 获取用户画像
      const userProfile = await this.agentService.getUserProfile(userId);
      this.crossAgentData.userProfile = userProfile;

      // 初始化各智能体的基础数据
      await this.syncAllAgents(userId);
    } catch (error) {
      console.error('Agent coordinator initialization failed:', error);
    }
  }

  /**
   * 注册事件监听器
   */
  addEventListener(eventType: string, callback: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(eventType: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 触发协调事件
   */
  async triggerEvent(event: AgentCoordinationEvent): Promise<void> {
    try {
      // 更新跨智能体数据
      await this.updateCrossAgentData(event);

      // 通知相关智能体
      await this.notifyAgents(event);

      // 触发事件监听器
      const listeners = this.eventListeners.get(event.type);
      if (listeners) {
        listeners.forEach(callback => callback(event));
      }
    } catch (error) {
      console.error('Event trigger failed:', error);
    }
  }

  /**
   * 更新跨智能体数据
   */
  private async updateCrossAgentData(event: AgentCoordinationEvent): Promise<void> {
    switch (event.type) {
      case 'route_selected':
        this.crossAgentData.currentRoute = event.data;
        this.syncState.routeAgent.lastUpdate = new Date();
        this.syncState.routeAgent.data = event.data;
        break;

      case 'challenge_started':
        this.crossAgentData.activeChallenge = event.data;
        this.syncState.challengeAgent.lastUpdate = new Date();
        this.syncState.challengeAgent.data = event.data;
        break;

      case 'safety_alert':
        this.crossAgentData.safetyStatus = {
          ...this.crossAgentData.safetyStatus,
          level: event.data.level,
          alerts: [...(this.crossAgentData.safetyStatus.alerts || []), event.data]
        };
        this.syncState.safetyAgent.lastUpdate = new Date();
        this.syncState.safetyAgent.data = event.data;
        break;

      case 'user_preference_updated':
        this.crossAgentData.preferences = {
          ...this.crossAgentData.preferences,
          ...event.data
        };
        break;
    }
  }

  /**
   * 通知相关智能体
   */
  private async notifyAgents(event: AgentCoordinationEvent): Promise<void> {
    const { type, data, userId } = event;
    const currentUserId = userId || 'default-user'; // 提供默认值

    switch (type) {
      case 'route_selected':
        // 通知挑战智能体更新相关挑战
        await this.updateChallengeBasedOnRoute(currentUserId, data);
        // 通知安全智能体评估路线安全性
        await this.updateSafetyBasedOnRoute(currentUserId, data);
        break;

      case 'challenge_started':
        // 通知路线智能体推荐适合的路线
        await this.updateRouteBasedOnChallenge(currentUserId, data);
        // 通知安全智能体关注挑战相关的安全事项
        await this.updateSafetyBasedOnChallenge(currentUserId, data);
        break;

      case 'safety_alert':
        // 通知路线智能体调整推荐
        await this.updateRouteBasedOnSafety(currentUserId, data);
        // 通知挑战智能体调整难度或暂停
        await this.updateChallengeBasedOnSafety(currentUserId, data);
        break;
    }
  }

  /**
   * 基于路线更新挑战推荐
   */
  private async updateChallengeBasedOnRoute(userId: string, routeData: any): Promise<void> {
    try {
      const recommendations = await this.agentService.generatePersonalizedRecommendations(
        userId,
        'challenge',
        { currentRoute: routeData }
      );
      
      // 触发挑战更新事件
      await this.triggerEvent({
        type: 'challenge_started',
        agentId: 'challenge-agent',
        data: { recommendations, triggeredBy: 'route_selection' },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to update challenge based on route:', error);
    }
  }

  /**
   * 基于路线更新安全评估
   */
  private async updateSafetyBasedOnRoute(userId: string, routeData: any): Promise<void> {
    try {
      const safetyAnalysis = await this.agentService.performRealTimeAnalysis(
        userId,
        'safety',
        { route: routeData, userProfile: this.crossAgentData.userProfile }
      );

      if (safetyAnalysis.riskLevel === 'high') {
        await this.triggerEvent({
          type: 'safety_alert',
          agentId: 'safety-agent',
          data: {
            level: 'high',
            message: '当前路线存在安全风险，建议选择其他路线',
            analysis: safetyAnalysis
          },
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to update safety based on route:', error);
    }
  }

  /**
   * 基于挑战更新路线推荐
   */
  private async updateRouteBasedOnChallenge(userId: string, challengeData: any): Promise<void> {
    try {
      const routeRecommendations = await this.agentService.generatePersonalizedRecommendations(
        userId,
        'route',
        { activeChallenge: challengeData }
      );

      // 更新路线智能体数据
      this.syncState.routeAgent.data = {
        ...this.syncState.routeAgent.data,
        challengeBasedRecommendations: routeRecommendations
      };
    } catch (error) {
      console.error('Failed to update route based on challenge:', error);
    }
  }

  /**
   * 基于挑战更新安全关注点
   */
  private async updateSafetyBasedOnChallenge(userId: string, challengeData: any): Promise<void> {
    try {
      const safetyFocus = await this.agentService.performRealTimeAnalysis(
        userId,
        'safety',
        { challenge: challengeData, userProfile: this.crossAgentData.userProfile }
      );

      // 更新安全智能体的关注点
      this.syncState.safetyAgent.data = {
        ...this.syncState.safetyAgent.data,
        challengeFocus: safetyFocus
      };
    } catch (error) {
      console.error('Failed to update safety based on challenge:', error);
    }
  }

  /**
   * 基于安全警报更新路线推荐
   */
  private async updateRouteBasedOnSafety(userId: string, safetyData: any): Promise<void> {
    try {
      if (safetyData.level === 'high') {
        const saferRoutes = await this.agentService.generatePersonalizedRecommendations(
          userId,
          'route',
          { safetyConstraints: safetyData }
        );

        this.syncState.routeAgent.data = {
          ...this.syncState.routeAgent.data,
          safetyBasedRecommendations: saferRoutes
        };
      }
    } catch (error) {
      console.error('Failed to update route based on safety:', error);
    }
  }

  /**
   * 基于安全警报更新挑战状态
   */
  private async updateChallengeBasedOnSafety(userId: string, safetyData: any): Promise<void> {
    try {
      if (safetyData.level === 'high') {
        // 暂停或调整当前挑战
        this.syncState.challengeAgent.data = {
          ...this.syncState.challengeAgent.data,
          safetyPause: true,
          pauseReason: safetyData.message
        };
      }
    } catch (error) {
      console.error('Failed to update challenge based on safety:', error);
    }
  }

  /**
   * 同步所有智能体数据
   */
  async syncAllAgents(userId: string): Promise<void> {
    try {
      // 获取最新的用户画像
      const userProfile = await this.agentService.getUserProfile(userId);
      this.crossAgentData.userProfile = userProfile;

      // 同步各智能体的状态
      await Promise.all([
        this.syncRouteAgent(userId),
        this.syncChallengeAgent(userId),
        this.syncSafetyAgent(userId)
      ]);
    } catch (error) {
      console.error('Failed to sync all agents:', error);
    }
  }

  /**
   * 同步路线智能体
   */
  private async syncRouteAgent(userId: string): Promise<void> {
    try {
      const recommendations = await this.agentService.generatePersonalizedRecommendations(
        userId,
        'route'
      );
      
      this.syncState.routeAgent = {
        lastUpdate: new Date(),
        data: { recommendations }
      };
    } catch (error) {
      console.error('Failed to sync route agent:', error);
    }
  }

  /**
   * 同步挑战智能体
   */
  private async syncChallengeAgent(userId: string): Promise<void> {
    try {
      const recommendations = await this.agentService.generatePersonalizedRecommendations(
        userId,
        'challenge'
      );
      
      this.syncState.challengeAgent = {
        lastUpdate: new Date(),
        data: { recommendations }
      };
    } catch (error) {
      console.error('Failed to sync challenge agent:', error);
    }
  }

  /**
   * 同步安全智能体
   */
  private async syncSafetyAgent(userId: string): Promise<void> {
    try {
      const analysis = await this.agentService.performRealTimeAnalysis(
        userId,
        'safety',
        { userProfile: this.crossAgentData.userProfile }
      );
      
      this.syncState.safetyAgent = {
        lastUpdate: new Date(),
        data: { analysis }
      };
    } catch (error) {
      console.error('Failed to sync safety agent:', error);
    }
  }

  /**
   * 获取跨智能体数据
   */
  getCrossAgentData(): CrossAgentData {
    return { ...this.crossAgentData };
  }

  /**
   * 获取智能体同步状态
   */
  getSyncState(): AgentSyncState {
    return { ...this.syncState };
  }

  /**
   * 获取特定智能体的数据
   */
  getAgentData(agentType: 'route' | 'challenge' | 'safety'): any {
    switch (agentType) {
      case 'route':
        return this.syncState.routeAgent.data;
      case 'challenge':
        return this.syncState.challengeAgent.data;
      case 'safety':
        return this.syncState.safetyAgent.data;
      default:
        return null;
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.eventListeners.clear();
  }
}

// 创建全局协调器实例
export const agentCoordinator = new AgentCoordinator();