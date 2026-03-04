// 智能体服务层 - 支持个性化推荐、实时数据分析、上下文感知对话和跨智能体协调
import { AIService } from './aiService';
import type { 
  AIConversation, 
  AIMessage, 
  AIResponse, 
  AIContext,
  SafetyProfile 
} from '../../types/ai';

// 智能体类型定义
export type AgentType = 'route' | 'challenge' | 'safety';

// 个性化推荐接口
export interface PersonalizedRecommendation {
  id: string;
  type: 'route' | 'challenge' | 'safety';
  title: string;
  description: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  metadata: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

// 用户画像接口
export interface UserProfile {
  userId: string;
  demographics: {
    age?: number;
    gender?: 'male' | 'female' | 'other';
    location?: string;
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  };
  preferences: {
    preferredDistance?: number;
    preferredTerrain?: 'flat' | 'hilly' | 'mixed';
    preferredTime?: 'morning' | 'afternoon' | 'evening' | 'night';
    safetyPriority?: 'high' | 'medium' | 'low';
    challengeTypes?: string[];
    avoidAreas?: string[];
  };
  runningHistory: {
    totalDistance: number;
    totalRuns: number;
    averagePace: number;
    bestDistance: number;
    bestTime: number;
    recentActivities: Array<{
      date: Date;
      distance: number;
      duration: number;
      pace: number;
      route: string;
    }>;
  };
  achievements: {
    completedChallenges: number;
    badges: string[];
    personalRecords: Record<string, any>;
  };
  safetyProfile?: SafetyProfile;
  lastUpdated: Date;
}

// 实时数据分析结果
export interface RealTimeAnalysis {
  userId: string;
  analysisType: 'performance' | 'safety' | 'recommendation' | 'behavior';
  insights: Array<{
    category: string;
    insight: string;
    confidence: number;
    actionable: boolean;
    recommendation?: string;
  }>;
  trends: Array<{
    metric: string;
    direction: 'up' | 'down' | 'stable';
    change: number;
    period: string;
  }>;
  alerts: Array<{
    level: 'info' | 'warning' | 'critical';
    message: string;
    actionRequired: boolean;
  }>;
  riskLevel?: 'low' | 'medium' | 'high';
  generatedAt: Date;
}

// 跨智能体协调数据
export interface AgentCoordinationData {
  sharedContext: {
    userProfile: UserProfile;
    currentLocation?: {
      latitude: number;
      longitude: number;
      address: string;
    };
    currentActivity?: {
      type: 'running' | 'planning' | 'resting';
      startTime?: Date;
      duration?: number;
      metrics?: Record<string, any>;
    };
    recentInteractions: Array<{
      agentType: AgentType;
      timestamp: Date;
      topic: string;
      outcome: string;
    }>;
  };
  crossAgentInsights: Array<{
    sourceAgent: AgentType;
    targetAgent: AgentType;
    insight: string;
    relevance: number;
  }>;
  coordinatedRecommendations: PersonalizedRecommendation[];
}

export class AgentService {
  private aiService: AIService;
  private userProfiles: Map<string, UserProfile> = new Map();
  private coordinationData: Map<string, AgentCoordinationData> = new Map();

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * 获取或创建用户画像
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId)!;
    }

    // 从存储中加载或创建新的用户画像
    const profile = await this.loadUserProfile(userId);
    this.userProfiles.set(userId, profile);
    return profile;
  }

  /**
   * 更新用户画像
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const currentProfile = await this.getUserProfile(userId);
    const updatedProfile = {
      ...currentProfile,
      ...updates,
      lastUpdated: new Date(),
    };
    
    this.userProfiles.set(userId, updatedProfile);
    await this.saveUserProfile(userId, updatedProfile);
    
    // 更新跨智能体协调数据
    await this.updateCoordinationData(userId, updatedProfile);
    
    return updatedProfile;
  }

  /**
   * 生成个性化推荐
   */
  async generatePersonalizedRecommendations(
    userId: string,
    agentType: AgentType,
    context?: Partial<AIContext>
  ): Promise<PersonalizedRecommendation[]> {
    const userProfile = await this.getUserProfile(userId);
    const coordinationData = await this.getCoordinationData(userId);
    
    // 构建推荐上下文
    const recommendationContext = this.buildRecommendationContext(
      userProfile,
      coordinationData,
      agentType,
      context
    );

    // 根据智能体类型生成不同的推荐
    switch (agentType) {
      case 'route':
        return this.generateRouteRecommendations(userProfile, recommendationContext);
      case 'challenge':
        return this.generateChallengeRecommendations(userProfile, recommendationContext);
      case 'safety':
        return this.generateSafetyRecommendations(userProfile, recommendationContext);
      default:
        return [];
    }
  }

  /**
   * 执行实时数据分析
   */
  async performRealTimeAnalysis(
    userId: string,
    analysisType: RealTimeAnalysis['analysisType'],
    data?: Record<string, any>
  ): Promise<RealTimeAnalysis> {
    const userProfile = await this.getUserProfile(userId);
    const coordinationData = await this.getCoordinationData(userId);

    const analysis: RealTimeAnalysis = {
      userId,
      analysisType,
      insights: [],
      trends: [],
      alerts: [],
      generatedAt: new Date(),
    };

    // 根据分析类型执行不同的分析逻辑
    switch (analysisType) {
      case 'performance':
        analysis.insights = await this.analyzePerformance(userProfile, data);
        analysis.trends = await this.analyzePerformanceTrends(userProfile);
        break;
      case 'safety':
        analysis.insights = await this.analyzeSafety(userProfile, data);
        analysis.alerts = await this.generateSafetyAlerts(userProfile, data);
        break;
      case 'recommendation':
        analysis.insights = await this.analyzeRecommendationEffectiveness(userProfile, coordinationData);
        break;
      case 'behavior':
        analysis.insights = await this.analyzeBehaviorPatterns(userProfile);
        analysis.trends = await this.analyzeBehaviorTrends(userProfile);
        break;
    }

    return analysis;
  }

  /**
   * 处理跨智能体对话
   */
  async handleCrossAgentConversation(
    userId: string,
    sourceAgent: AgentType,
    targetAgent: AgentType,
    message: string,
    context?: Partial<AIContext>
  ): Promise<AIResponse> {
    const coordinationData = await this.getCoordinationData(userId);
    
    // 构建跨智能体上下文
    const crossAgentContext = this.buildCrossAgentContext(
      coordinationData,
      sourceAgent,
      targetAgent,
      context
    );

    // 记录跨智能体交互
    await this.recordCrossAgentInteraction(userId, sourceAgent, targetAgent, message);

    // 通过AI服务处理消息
    const response = await this.aiService.sendMessage(
      userId,
      message,
      undefined, // 使用默认对话
      crossAgentContext,
      'kimi',
      'general'
    );

    return response.response;
  }

  /**
   * 获取智能体协调数据
   */
  async getCoordinationData(userId: string): Promise<AgentCoordinationData> {
    if (this.coordinationData.has(userId)) {
      return this.coordinationData.get(userId)!;
    }

    const userProfile = await this.getUserProfile(userId);
    const coordinationData: AgentCoordinationData = {
      sharedContext: {
        userProfile,
        recentInteractions: [],
      },
      crossAgentInsights: [],
      coordinatedRecommendations: [],
    };

    this.coordinationData.set(userId, coordinationData);
    return coordinationData;
  }

  /**
   * 更新协调数据
   */
  private async updateCoordinationData(userId: string, userProfile: UserProfile): Promise<void> {
    const coordinationData = await this.getCoordinationData(userId);
    coordinationData.sharedContext.userProfile = userProfile;
    this.coordinationData.set(userId, coordinationData);
  }

  /**
   * 构建推荐上下文
   */
  private buildRecommendationContext(
    userProfile: UserProfile,
    coordinationData: AgentCoordinationData,
    agentType: AgentType,
    context?: Partial<AIContext>
  ): AIContext {
    return {
      conversationId: context?.conversationId || `recommendation-${agentType}-${Date.now()}`,
      locationData: context?.locationData || {},
      userContext: {
        userType: 'runner',
        demographics: userProfile.demographics,
        preferences: userProfile.preferences,
        runningHistory: userProfile.runningHistory,
        achievements: userProfile.achievements,
      },
      safetyContext: userProfile.safetyProfile ? {
        emergencyContacts: userProfile.safetyProfile.emergencyContacts || [],
      } : {},
      agentContext: {
        agentType,
        crossAgentInsights: coordinationData.crossAgentInsights.filter(
          insight => insight.targetAgent === agentType
        ),
        recentInteractions: coordinationData.sharedContext.recentInteractions,
      },
      createdAt: new Date(),
    };
  }

  /**
   * 生成路线推荐
   */
  private async generateRouteRecommendations(
    userProfile: UserProfile,
    context: AIContext
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];

    // 基于用户偏好的路线推荐
    if (userProfile.preferences.preferredDistance) {
      recommendations.push({
        id: `route_distance_${Date.now()}`,
        type: 'route',
        title: `${userProfile.preferences.preferredDistance}公里个性化路线`,
        description: '根据您的偏好距离定制的安全路线',
        confidence: 0.85,
        priority: 'high',
        metadata: {
          distance: userProfile.preferences.preferredDistance,
          terrain: userProfile.preferences.preferredTerrain,
          safetyLevel: userProfile.preferences.safetyPriority,
        },
        createdAt: new Date(),
      });
    }

    // 基于历史数据的挑战性路线
    if (userProfile.runningHistory.averagePace > 0) {
      recommendations.push({
        id: `route_challenge_${Date.now()}`,
        type: 'route',
        title: '进阶挑战路线',
        description: '基于您的跑步水平推荐的挑战性路线',
        confidence: 0.75,
        priority: 'medium',
        metadata: {
          targetPace: userProfile.runningHistory.averagePace * 0.95, // 提升5%
          difficulty: 'challenging',
        },
        createdAt: new Date(),
      });
    }

    return recommendations;
  }

  /**
   * 生成挑战推荐
   */
  private async generateChallengeRecommendations(
    userProfile: UserProfile,
    context: AIContext
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];

    // 基于经验水平的挑战推荐
    const experienceLevel = userProfile.demographics.experienceLevel || 'beginner';
    
    if (experienceLevel === 'beginner') {
      recommendations.push({
        id: `challenge_beginner_${Date.now()}`,
        type: 'challenge',
        title: '新手友好挑战',
        description: '适合初学者的渐进式挑战计划',
        confidence: 0.9,
        priority: 'high',
        metadata: {
          difficulty: 'easy',
          duration: '2周',
          targetDistance: 3,
        },
        createdAt: new Date(),
      });
    } else if (experienceLevel === 'intermediate') {
      recommendations.push({
        id: `challenge_intermediate_${Date.now()}`,
        type: 'challenge',
        title: '中级进阶挑战',
        description: '提升您跑步能力的中级挑战',
        confidence: 0.8,
        priority: 'high',
        metadata: {
          difficulty: 'medium',
          duration: '4周',
          targetDistance: 10,
        },
        createdAt: new Date(),
      });
    }

    return recommendations;
  }

  /**
   * 生成安全推荐
   */
  private async generateSafetyRecommendations(
    userProfile: UserProfile,
    context: AIContext
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];

    // 基于性别的安全推荐
    if (userProfile.demographics.gender === 'female') {
      recommendations.push({
        id: `safety_female_${Date.now()}`,
        type: 'safety',
        title: '女性跑步安全建议',
        description: '专为女性跑者定制的安全指南和建议',
        confidence: 0.95,
        priority: 'high',
        metadata: {
          category: 'gender_specific',
          features: ['安全路线', '紧急联系', '实时定位'],
        },
        createdAt: new Date(),
      });
    }

    // 基于时间偏好的安全推荐
    if (userProfile.preferences.preferredTime === 'night') {
      recommendations.push({
        id: `safety_night_${Date.now()}`,
        type: 'safety',
        title: '夜跑安全指南',
        description: '夜间跑步的安全注意事项和装备建议',
        confidence: 0.85,
        priority: 'high',
        metadata: {
          category: 'time_specific',
          equipment: ['反光装备', '照明设备', '安全哨'],
        },
        createdAt: new Date(),
      });
    }

    return recommendations;
  }

  /**
   * 分析性能数据
   */
  private async analyzePerformance(
    userProfile: UserProfile,
    data?: Record<string, any>
  ): Promise<RealTimeAnalysis['insights']> {
    const insights = [];

    // 分析跑步频率
    if (userProfile.runningHistory.totalRuns > 0) {
      const avgRunsPerWeek = userProfile.runningHistory.totalRuns / 4; // 假设4周数据
      if (avgRunsPerWeek < 2) {
        insights.push({
          category: 'frequency',
          insight: '您的跑步频率较低，建议增加到每周3-4次',
          confidence: 0.8,
          actionable: true,
          recommendation: '制定规律的跑步计划，从每周2-3次开始',
        });
      }
    }

    // 分析配速趋势
    if (userProfile.runningHistory.averagePace > 0) {
      insights.push({
        category: 'pace',
        insight: `您的平均配速为 ${userProfile.runningHistory.averagePace.toFixed(2)} 分钟/公里`,
        confidence: 0.9,
        actionable: true,
        recommendation: '通过间歇训练可以有效提升配速',
      });
    }

    return insights;
  }

  /**
   * 分析安全数据
   */
  private async analyzeSafety(
    userProfile: UserProfile,
    data?: Record<string, any>
  ): Promise<RealTimeAnalysis['insights']> {
    const insights = [];

    // 检查紧急联系人
    if (!userProfile.safetyProfile?.emergencyContacts?.length) {
      insights.push({
        category: 'emergency_contacts',
        insight: '您还没有设置紧急联系人',
        confidence: 1.0,
        actionable: true,
        recommendation: '建议添加至少2个紧急联系人以确保安全',
      });
    }

    // 分析跑步时间安全性
    if (userProfile.preferences.preferredTime === 'night') {
      insights.push({
        category: 'time_safety',
        insight: '夜间跑步需要特别注意安全',
        confidence: 0.9,
        actionable: true,
        recommendation: '建议携带照明设备和反光装备，选择光线充足的路线',
      });
    }

    return insights;
  }

  /**
   * 生成安全警报
   */
  private async generateSafetyAlerts(
    userProfile: UserProfile,
    data?: Record<string, any>
  ): Promise<RealTimeAnalysis['alerts']> {
    const alerts = [];

    // 检查当前时间是否为高风险时段
    const currentHour = new Date().getHours();
    if (currentHour < 6 || currentHour > 22) {
      alerts.push({
        level: 'warning' as const,
        message: '当前时段为夜间，请注意跑步安全',
        actionRequired: true,
      });
    }

    return alerts;
  }

  /**
   * 分析性能趋势
   */
  private async analyzePerformanceTrends(userProfile: UserProfile): Promise<RealTimeAnalysis['trends']> {
    const trends = [];

    // 分析距离趋势
    if (userProfile.runningHistory.recentActivities.length >= 2) {
      const recentDistances = userProfile.runningHistory.recentActivities
        .slice(-5)
        .map(activity => activity.distance);
      
      const avgRecent = recentDistances.reduce((a, b) => a + b, 0) / recentDistances.length;
      const avgPrevious = userProfile.runningHistory.totalDistance / userProfile.runningHistory.totalRuns;
      
      const change = ((avgRecent - avgPrevious) / avgPrevious) * 100;
      
      trends.push({
        metric: 'distance',
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
        change: Math.abs(change),
        period: '最近5次跑步',
      });
    }

    return trends;
  }

  /**
   * 分析行为模式
   */
  private async analyzeBehaviorPatterns(userProfile: UserProfile): Promise<RealTimeAnalysis['insights']> {
    const insights = [];

    // 分析跑步时间偏好
    if (userProfile.preferences.preferredTime) {
      insights.push({
        category: 'time_preference',
        insight: `您偏好${userProfile.preferences.preferredTime}跑步`,
        confidence: 0.8,
        actionable: false,
      });
    }

    return insights;
  }

  /**
   * 分析行为趋势
   */
  private async analyzeBehaviorTrends(userProfile: UserProfile): Promise<RealTimeAnalysis['trends']> {
    return []; // 实现具体的行为趋势分析逻辑
  }

  /**
   * 分析推荐效果
   */
  private async analyzeRecommendationEffectiveness(
    userProfile: UserProfile,
    coordinationData: AgentCoordinationData
  ): Promise<RealTimeAnalysis['insights']> {
    return []; // 实现推荐效果分析逻辑
  }

  /**
   * 构建跨智能体上下文
   */
  private buildCrossAgentContext(
    coordinationData: AgentCoordinationData,
    sourceAgent: AgentType,
    targetAgent: AgentType,
    context?: Partial<AIContext>
  ): AIContext {
    return {
      conversationId: context?.conversationId || `cross-agent-${sourceAgent}-${targetAgent}-${Date.now()}`,
      locationData: context?.locationData || {},
      userContext: context?.userContext || {},
      safetyContext: context?.safetyContext || {},
      agentContext: {
        sourceAgent,
        targetAgent,
        sharedContext: coordinationData.sharedContext,
        crossAgentInsights: coordinationData.crossAgentInsights,
      },
      createdAt: new Date(),
      ...context,
    };
  }

  /**
   * 记录跨智能体交互
   */
  private async recordCrossAgentInteraction(
    userId: string,
    sourceAgent: AgentType,
    targetAgent: AgentType,
    message: string
  ): Promise<void> {
    const coordinationData = await this.getCoordinationData(userId);
    
    coordinationData.sharedContext.recentInteractions.push({
      agentType: sourceAgent,
      timestamp: new Date(),
      topic: message.substring(0, 50), // 截取前50个字符作为主题
      outcome: 'pending', // 实际应用中应该记录交互结果
    });

    // 保持最近10次交互记录
    if (coordinationData.sharedContext.recentInteractions.length > 10) {
      coordinationData.sharedContext.recentInteractions = 
        coordinationData.sharedContext.recentInteractions.slice(-10);
    }

    this.coordinationData.set(userId, coordinationData);
  }

  /**
   * 加载用户画像
   */
  private async loadUserProfile(userId: string): Promise<UserProfile> {
    // 实际应用中应该从数据库加载
    // 这里返回默认的用户画像
    return {
      userId,
      demographics: {},
      preferences: {},
      runningHistory: {
        totalDistance: 0,
        totalRuns: 0,
        averagePace: 0,
        bestDistance: 0,
        bestTime: 0,
        recentActivities: [],
      },
      achievements: {
        completedChallenges: 0,
        badges: [],
        personalRecords: {},
      },
      lastUpdated: new Date(),
    };
  }

  /**
   * 保存用户画像
   */
  private async saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
    // 实际应用中应该保存到数据库
    console.log('保存用户画像:', userId, profile);
  }
}

export default AgentService;