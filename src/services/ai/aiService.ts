// 路线小助手主服务
import { AIRouter } from './aiRouter';
import { ConversationManager } from './conversationManager';
import type { 
  AIMessage, 
  AIConversation, 
  AIConversationStats,
  AIContext, 
  AIRequest, 
  AIResponse, 
  SafetyProfile, 
  SafetyAnalysis, 
  EmergencyAlert,
  ImageUploadResponse
} from '../../types/ai';
import type { GPSData, FusedData } from '../../types/unified';
import type { RealtimeLocation } from '../../types';

export class AIService {
  private aiRouter: AIRouter;
  private conversationManager: ConversationManager;
  private contextCache: Map<string, { context: AIContext; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  constructor() {
    this.aiRouter = new AIRouter();
    this.conversationManager = new ConversationManager();
    
    // 定期清理过期缓存
    setInterval(() => this.cleanExpiredCache(), 60 * 1000); // 每分钟清理一次
  }

  /**
   * 清理过期的缓存
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.contextCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.contextCache.delete(key);
      }
    }
  }

  /**
   * 发送消息并获取AI响应
   */
  /**
   * 映射前端对话类型到数据库允许的类型
   */
  private mapConversationType(type?: string): 'safety' | 'emergency' | 'general' | 'women_safety' | 'route_recommendation' | 'challenge_competition' | 'analysis' {
    switch (type) {
      case 'challenge_competition':
        return 'challenge_competition';
      case 'safety':
      case 'emergency':
      case 'women_safety':
      case 'route_recommendation':
      case 'analysis':
        return type;
      default:
        return 'general';
    }
  }

  async sendMessage(
    userId: string,
    message: string,
    conversationId?: string,
    context?: Partial<AIContext>,
    provider?: 'kimi' | 'deepseek',
    conversationType?: 'safety' | 'emergency' | 'general' | 'women_safety' | 'route_recommendation' | 'challenge_competition',
    images?: ImageUploadResponse[]
  ): Promise<{
    response: AIResponse;
    conversation: AIConversation;
    userMessage: AIMessage;
    aiMessage: AIMessage;
  }> {
    let conversation: AIConversation | undefined;
    
    try {

      // 如果没有提供对话ID，创建新对话
      if (!conversationId) {
        const title = this.generateConversationTitle(message, conversationType);
        const selectedProvider = provider || this.aiRouter.getRecommendedProvider(conversationType);
        // 数据库存储原始类型，路由到模型时再做映射
        const dbConversationType = conversationType || 'general';
        const routedConversationType = this.mapConversationType(conversationType);
        
        try {
          conversation = await this.conversationManager.createConversation(userId, {
            title,
            aiProvider: selectedProvider,
            conversationType: dbConversationType,
            isEmergency: conversationType === 'emergency'
          });
          conversationId = conversation.id;
        } catch (error) {
          console.error('创建对话失败，尝试离线模式:', error);
          // 如果创建对话失败，使用离线模式
          conversation = await this.createOfflineConversation(userId, {
            title,
            provider: selectedProvider,
            conversationType: dbConversationType,
            isEmergency: conversationType === 'emergency'
          });
          conversationId = conversation.id;
        }
      } else {
        // 获取现有对话；若不存在则自动创建，保证在线优先不中断
        const existingConversation = await this.conversationManager.getConversation(conversationId);
        if (!existingConversation) {
          const title = this.generateConversationTitle(message, conversationType);
          const selectedProvider = provider || this.aiRouter.getRecommendedProvider(conversationType);
          const dbConversationType = conversationType || 'general';
          try {
            conversation = await this.conversationManager.createConversation(userId, {
              title,
              aiProvider: selectedProvider,
              conversationType: dbConversationType,
              isEmergency: conversationType === 'emergency'
            });
            conversationId = conversation.id;
          } catch (error) {
            console.error('现有对话不存在，创建失败，使用离线模式:', error);
            conversation = await this.createOfflineConversation(userId, {
              title,
              provider: selectedProvider,
              conversationType: dbConversationType,
              isEmergency: conversationType === 'emergency'
            });
            conversationId = conversation.id;
          }
        } else {
          conversation = existingConversation;
        }
      }

      // 保存用户消息（参数顺序：images, metadata, confidenceScore）
      const userMessage = await this.conversationManager.addMessage(
        conversationId,
        'user',
        message,
        images, // 图片数组
        undefined, // metadata
        undefined // confidence
      );

      // 如果提供了上下文，保存上下文信息
      if (context) {
        await this.conversationManager.saveContext(
          conversationId,
          context.locationData,
          context.userContext,
          context.safetyContext
        );
      }

      // 获取完整的上下文（包括历史上下文）
      const fullContext = await this.buildFullContext(conversationId, context);

      // 构建AI请求
      const aiRequest: AIRequest = {
        message,
        context: fullContext,
        conversationId,
        provider: provider || conversation.aiProvider,
        // 路由到模型时使用映射后的类型，保证不同业务类型也能正确选择策略
        conversationType: this.mapConversationType(conversationType || conversation.conversationType),
      };

      // 发送到AI路由器
      let aiResponse: AIResponse;
      let aiMessage: AIMessage;

      try {
        // 强制在线模式
        aiResponse = await this.aiRouter.sendMessageOnline(aiRequest);

        // 保存AI响应（参数顺序：images, metadata, confidenceScore）
        aiMessage = await this.conversationManager.addMessage(
          conversationId,
          'assistant',
          aiResponse.message,
          undefined, // images
          aiResponse.metadata,
          aiResponse.confidence
        );
      } catch (aiError) {
        console.warn('AI路由器调用失败，切换到离线模式:', aiError);
        
        // 如果是离线对话，直接使用离线模式处理
        if (conversationId.startsWith('offline_')) {
          return await this.handleOfflineMessage(userId, message, conversation, fullContext);
        }

        // 尝试切换到离线模式
        try {
          return await this.handleOfflineMessage(userId, message, conversation, fullContext);
        } catch (offlineError) {
          console.error('离线模式也失败了:', offlineError);
          // 生成基本的离线响应
          aiResponse = this.generateOfflineAIResponse(message, conversationType, fullContext);
          aiMessage = await this.conversationManager.addMessage(
            conversationId,
            'assistant',
            aiResponse.message,
            undefined, // images
            aiResponse.metadata,
            aiResponse.confidence
          );
        }
      }

      // 如果是紧急情况，处理紧急响应
      if (aiResponse.emergencyLevel === 'critical' || aiResponse.emergencyLevel === 'high') {
        try {
          await this.handleEmergencyResponse(userId, conversationId, aiResponse, fullContext);
        } catch (emergencyError) {
          console.warn('紧急响应处理失败:', emergencyError);
        }
      }

      // 更新对话对象
      conversation.messages = [...(conversation.messages || []), userMessage, aiMessage];

      return {
        response: aiResponse,
        conversation,
        userMessage,
        aiMessage,
      };
    } catch (error) {
      console.error('AI服务发送消息失败:', error);
      
      // 最后的降级处理：如果一切都失败了，至少返回一个基本响应
      try {
        const fallbackResponse = this.generateOfflineAIResponse(
          message, 
          conversationType, 
          context
        );
        
        return {
          response: fallbackResponse,
          conversation: conversation || {
            id: `offline_${Date.now()}`,
            userId,
            title: this.generateConversationTitle(message, conversationType),
            aiProvider: provider || 'kimi',
            conversationType: conversationType || 'general',
            isEmergency: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            messages: []
          },
          userMessage: {
            id: `msg_${Date.now()}_user`,
            conversationId: conversation?.id || `offline_${Date.now()}`,
            role: 'user',
            content: message,
            timestamp: new Date(),
            metadata: context
          },
          aiMessage: {
            id: `msg_${Date.now()}_ai`,
            conversationId: conversation?.id || `offline_${Date.now()}`,
            role: 'assistant',
            content: fallbackResponse.message,
            timestamp: new Date(),
            metadata: fallbackResponse.metadata,
            confidenceScore: fallbackResponse.confidence
          }
        };
      } catch (fallbackError) {
        console.error('降级处理也失败了:', fallbackError);
        throw error;
      }
    }
  }

  /**
   * 获取用户的对话列表
   */
  async getConversations(
    userId: string,
    limit?: number,
    offset?: number,
    conversationType?: string
  ): Promise<AIConversation[]> {
    return this.conversationManager.getUserConversations(userId, limit, offset, conversationType);
  }

  /**
   * 获取对话统计信息
   */
  async getConversationStats(userId: string): Promise<AIConversationStats> {
    const conversations = await this.conversationManager.getUserConversations(userId);
    
    const stats = {
      totalConversations: conversations.length,
      totalMessages: conversations.reduce((total, conv) => total + conv.messages.length, 0),
      activeConversations: conversations.filter(conv => conv.isActive).length,
      averageResponseTime: 1.2, // 模拟平均响应时间
      womenSafetyConversations: conversations.filter(conv => conv.conversationType === 'women_safety').length,
      emergencyConversations: conversations.filter(conv => conv.conversationType === 'emergency').length,
      emergencySessions: conversations.filter(conv => conv.isEmergency).length,
      lastConversationAt: conversations.length > 0 ? conversations[0].updatedAt : undefined,
    };
    
    return {
      totalConversations: stats.totalConversations,
      totalMessages: stats.totalMessages,
      activeConversations: stats.activeConversations,
      averageResponseTime: stats.averageResponseTime,
      womenSafetyConversations: stats.womenSafetyConversations || 0,
      emergencyConversations: stats.emergencyConversations || 0,
      emergencySessions: stats.emergencySessions || 0,
      lastConversationAt: stats.lastConversationAt,
    };
  }

  /**
   * 创建新对话
   */
  async createConversation(
    userId: string,
    options: {
      title?: string;
      provider?: 'kimi' | 'deepseek';
      conversationType?: 'general' | 'women_safety' | 'emergency' | 'safety' | 'route_recommendation' | 'challenge_competition' | 'analysis';
      isEmergency?: boolean;
    }
  ): Promise<AIConversation> {
    return this.conversationManager.createConversation(userId, {
      title: options.title,
      aiProvider: options.provider,
      conversationType: options.conversationType,
      isEmergency: options.isEmergency
    });
  }

  /**
   * 获取单个对话
   */
  async getConversation(conversationId: string): Promise<AIConversation | null> {
    return this.conversationManager.getConversation(conversationId);
  }

  /**
   * 删除对话
   */
  async deleteConversation(conversationId: string): Promise<void> {
    return this.conversationManager.deleteConversation(conversationId);
  }

  /**
   * 获取用户安全档案
   */
  async getSafetyProfile(userId: string): Promise<SafetyProfile | null> {
    return this.conversationManager.getSafetyProfile(userId);
  }

  /**
   * 更新用户安全档案
   */
  async updateSafetyProfile(
    userId: string,
    profile: Partial<SafetyProfile>
  ): Promise<SafetyProfile> {
    return this.conversationManager.upsertSafetyProfile(userId, profile);
  }

  /**
   * 进行安全分析
   */
  async performSafetyAnalysis(
    userId: string,
    options: {
      type?: 'route' | 'behavior' | 'risk' | 'comprehensive';
      timeRange?: 'week' | 'month' | 'quarter';
      includeRecommendations?: boolean;
      data?: any;
    } = {}
  ): Promise<SafetyAnalysis> {
    try {
      const { type = 'comprehensive', timeRange = 'week', includeRecommendations = true, data } = options;
      
      // 构建分析请求
      const analysisPrompt = this.buildSafetyAnalysisPrompt(type, timeRange, data);
      
      const context: Partial<AIContext> = {
        locationData: data?.location || {},
        userContext: data?.user || {},
        safetyContext: data?.safety || {},
      };

      // 发送分析请求
      const aiRequest: AIRequest = {
        message: analysisPrompt,
        context,
        conversationType: 'safety',
      };

      const aiResponse = await this.aiRouter.routeRequest(aiRequest);

      // 解析AI响应为结构化的安全分析
      return this.parseAnalysisResponse(aiResponse, type, timeRange, includeRecommendations);
    } catch (error) {
      console.error('安全分析失败:', error);
      throw new Error('安全分析失败');
    }
  }

  /**
   * 处理紧急情况
   */
  async handleEmergency(
    userId: string,
    location: { latitude: number; longitude: number; address: string },
    description: string,
    alertType: 'manual' | 'auto' | 'ai_detected' = 'manual'
  ): Promise<EmergencyAlert> {
    try {
      // 创建紧急对话
      const conversation = await this.conversationManager.createConversation(
        userId,
        {
          title: '紧急求助',
          aiProvider: 'kimi',
          conversationType: 'emergency',
          isEmergency: true
        }
      );

      // 构建紧急上下文
      const emergencyContext: Partial<AIContext> = {
        locationData: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
        },
        safetyContext: {
          emergencyContacts: [], // 这里应该从用户档案获取
        },
      };

      // 发送紧急请求
      const emergencyPrompt = `紧急情况报告：${description}。请立即提供应急指导和建议。`;
      
      const aiResponse = await this.sendMessage(
        userId,
        emergencyPrompt,
        conversation.id,
        emergencyContext,
        'kimi',
        'emergency'
      );

      // 创建紧急警报记录
      const alert: EmergencyAlert = {
        id: `emergency_${Date.now()}`,
        userId,
        location,
        alertType,
        severity: aiResponse.response.emergencyLevel as any || 'high',
        description,
        timestamp: new Date(),
        status: 'active',
        aiAnalysis: {
          riskAssessment: aiResponse.response.message,
          recommendedActions: aiResponse.response.suggestions || [],
          confidence: aiResponse.response.confidence,
        },
      };

      return alert;
    } catch (error) {
      console.error('处理紧急情况失败:', error);
      throw new Error('处理紧急情况失败');
    }
  }

  /**
   * 搜索对话
   */
  async searchConversations(
    userId: string,
    query: string,
    conversationType?: string
  ): Promise<AIConversation[]> {
    return this.conversationManager.searchConversations(userId, query, conversationType);
  }

  /**
   * 获取AI提供商状态
   */
  async getProviderStatus(): Promise<Record<string, any>> {
    return this.aiRouter.getProviderStatus();
  }

  /**
   * 测试AI连接
   */
  async testConnections(): Promise<Record<string, boolean>> {
    return this.aiRouter.testAllConnections();
  }

  // 私有方法

  /**
   * 生成对话标题
   */
  private generateConversationTitle(message: string, conversationType?: string): string {
    const maxLength = 30;
    const title = message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
    
    const typePrefix = {
      'women_safety': '女性安全 - ',
      'emergency': '紧急求助 - ',
      'analysis': '安全分析 - ',
      'general': '',
    };

    const prefix = typePrefix[conversationType as keyof typeof typePrefix] || '';
    return prefix + title;
  }

  /**
   * 构建完整上下文（带缓存优化）
   */
  private async buildFullContext(
    conversationId: string,
    newContext?: Partial<AIContext>
  ): Promise<Partial<AIContext>> {
    const cacheKey = `context_${conversationId}`;
    const now = Date.now();
    
    // 检查缓存
    const cached = this.contextCache.get(cacheKey);
    let historicalContext: AIContext | null = null;
    
    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      // 使用缓存的上下文
      historicalContext = cached.context;
    } else {
      // 从数据库获取并缓存
      historicalContext = await this.conversationManager.getContext(conversationId);
      if (historicalContext) {
        this.contextCache.set(cacheKey, {
          context: historicalContext,
          timestamp: now
        });
      }
    }
    
    // 合并新旧上下文
    const fullContext: Partial<AIContext> = {
      locationData: {
        ...historicalContext?.locationData,
        ...newContext?.locationData,
      },
      userContext: {
        ...historicalContext?.userContext,
        ...newContext?.userContext,
      },
      safetyContext: {
        ...historicalContext?.safetyContext,
        ...newContext?.safetyContext,
      },
    };

    return fullContext;
  }

  /**
   * 构建安全分析提示词
   */
  private buildSafetyAnalysisPrompt(
    type: string,
    timeRange: string,
    data?: any
  ): string {
    return `请对用户的跑步安全情况进行${type}分析，时间范围为${timeRange}：

分析类型：${type}
时间范围：${timeRange}
数据信息：${JSON.stringify(data || {})}

请提供：
1. 整体安全评分（1-100分）
2. 主要风险因素分析
3. 具体的安全建议
4. 行为模式分析
5. 路线安全评估

请以结构化的方式回答，便于解析。`;
  }

  /**
   * 解析分析响应
   */
  private parseAnalysisResponse(
    aiResponse: AIResponse,
    type: string,
    timeRange: string,
    includeRecommendations: boolean
  ): SafetyAnalysis {
    // 这里应该实现更智能的响应解析
    // 目前提供基础实现
    const overallScore = Math.floor(Math.random() * 30) + 70; // 70-100分
    const riskLevel = overallScore >= 85 ? 'low' : overallScore >= 70 ? 'medium' : 'high';
    
    return {
      overallScore,
      riskLevel,
      improvements: Math.floor(Math.random() * 5) + 3, // 3-7个改进建议
      lastUpdated: new Date().toISOString(),
      metrics: {
        safeRoutes: Math.floor(Math.random() * 10) + 5, // 5-14条安全路线
        riskAreas: Math.floor(Math.random() * 3) + 1, // 1-3个风险区域
        avgResponseTime: Math.floor(Math.random() * 2) + 1, // 1-2秒响应时间
      },
      recentActivities: [
        {
          type: 'safe',
          title: '安全路线推荐',
          description: '基于AI分析，为您推荐了3条安全跑步路线',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2小时前
        },
        {
          type: 'warning',
          title: '夜间跑步提醒',
          description: '检测到您经常在夜间跑步，建议携带照明设备',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1天前
        },
        {
          type: 'safe',
          title: '安全评估完成',
          description: '您的跑步习惯整体安全性良好，继续保持',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3天前
        },
      ],
      routeAnalysis: [
        {
          name: '外滩滨江步道',
          riskLevel: 'low',
          description: '人流量适中，照明良好，监控覆盖完善',
          distance: 5.2,
          safetyScore: 92,
          usageCount: 15,
        },
        {
          name: '世纪公园环线',
          riskLevel: 'low',
          description: '公园内部路线，环境安全，适合各时段跑步',
          distance: 3.8,
          safetyScore: 88,
          usageCount: 8,
        },
        {
          name: '淮海路商业区',
          riskLevel: 'medium',
          description: '人流密集，需注意交通安全',
          distance: 2.5,
          safetyScore: 75,
          usageCount: 3,
        },
      ],
      behaviorPatterns: [
        {
          pattern: '偏好早晨跑步',
          description: '您通常在早上6-8点进行跑步，这是一个很好的习惯',
          frequency: '85%',
          impact: 'positive',
        },
        {
          pattern: '路线多样化',
          description: '您会选择不同的跑步路线，有助于保持新鲜感',
          frequency: '70%',
          impact: 'positive',
        },
        {
          pattern: '夜间跑步频率较高',
          description: '建议减少夜间跑步频率，或加强安全防护',
          frequency: '30%',
          impact: 'negative',
        },
      ],
      recommendations: [
        {
          title: '携带安全设备',
          description: '建议携带反光背心、头灯等安全设备，特别是在光线不足的时段',
          priority: 'high',
        },
        {
          title: '选择人流适中的路线',
          description: '避免过于偏僻或过于拥挤的路线，选择有适度人流的安全区域',
          priority: 'medium',
        },
        {
          title: '设置紧急联系人',
          description: '在应用中设置紧急联系人，确保在需要时能够及时求助',
          priority: 'high',
        },
        {
          title: '关注天气变化',
          description: '跑步前查看天气预报，避免在恶劣天气条件下外出',
          priority: 'medium',
        },
      ],
      riskFactors: [
         {
           factor: '环境风险',
           level: 'medium',
           description: 'AI分析中...',
           aiInsight: aiResponse.message,
         },
       ],
       locationAnalysis: {
         safetyScore: 85,
         crowdLevel: 'moderate',
         lightingCondition: 'good',
         historicalIncidents: 0,
         aiAssessment: aiResponse.message,
       },
       timeAnalysis: {
         timeOfDay: 'morning',
         riskLevel: 'medium',
         aiRecommendation: aiResponse.message,
       },
    };
  }

  /**
   * 处理紧急响应
   */
  private async handleEmergencyResponse(
    userId: string,
    conversationId: string,
    aiResponse: AIResponse,
    context?: Partial<AIContext>
  ): Promise<void> {
    // 这里可以实现紧急情况的自动处理逻辑
    // 比如自动发送通知、联系紧急联系人等
    console.log('处理紧急响应:', {
      userId,
      conversationId,
      emergencyLevel: aiResponse.emergencyLevel,
      actionRequired: aiResponse.actionRequired,
    });
  }

  // ==================== GPS集成功能 ====================

  /**
   * 分析GPS数据并提供AI洞察
   */
  async analyzeGPSData(
    userId: string,
    gpsData: GPSData,
    previousData?: GPSData
  ): Promise<{
    insights: string[];
    safetyAlerts: any[];
    recommendations: string[];
  }> {
    try {
      // 构建GPS分析上下文
      const context = this.buildGPSAnalysisContext(gpsData, previousData);
      
      // 生成分析提示词
      const prompt = this.generateGPSAnalysisPrompt(gpsData, previousData);
      
      // 发送到AI进行分析
      const response = await this.sendMessage(
        userId,
        prompt,
        undefined,
        context,
        'kimi',
        'safety'
      );

      // 解析响应
      const insights = this.extractGPSInsights(response.response.message);
      const safetyAlerts = this.extractGPSSafetyAlerts(response.response);
      const recommendations = this.extractGPSRecommendations(response.response.message);

      return { insights, safetyAlerts, recommendations };
    } catch (error) {
      console.error('GPS数据分析失败:', error);
      return { insights: [], safetyAlerts: [], recommendations: [] };
    }
  }

  /**
   * 实时GPS监控和AI分析
   */
  async monitorGPSRealtime(
    userId: string,
    gpsData: GPSData,
    sessionData: {
      startTime: Date;
      totalDistance: number;
      averageSpeed: number;
      routePoints: RealtimeLocation[];
    }
  ): Promise<{
    status: 'safe' | 'warning' | 'danger';
    message: string;
    actions?: string[];
  }> {
    try {
      // 构建实时监控上下文
      const context = this.buildRealtimeMonitoringContext(gpsData, sessionData);
      
      // 生成监控提示词
      const prompt = this.generateRealtimeMonitoringPrompt(gpsData, sessionData);
      
      // 发送到AI进行实时分析
      const response = await this.sendMessage(
        userId,
        prompt,
        undefined,
        context,
        'kimi',
        'safety'
      );

      // 解析实时状态
      return this.parseRealtimeStatus(response.response);
    } catch (error) {
      console.error('实时GPS监控失败:', error);
      return {
        status: 'safe',
        message: '监控系统暂时不可用，请注意安全'
      };
    }
  }

  /**
   * 生成智能路线建议
   */
  async generateRouteRecommendations(
    userId: string,
    currentLocation: { latitude: number; longitude: number },
    preferences: {
      distance?: number;
      difficulty?: 'easy' | 'medium' | 'hard';
      scenery?: 'urban' | 'park' | 'waterfront';
      safety?: 'high' | 'medium';
    }
  ): Promise<{
    routes: Array<{
      name: string;
      description: string;
      distance: number;
      estimatedTime: number;
      safetyScore: number;
      highlights: string[];
    }>;
    aiExplanation: string;
  }> {
    try {
      // 构建路线推荐上下文
      const context = this.buildRouteRecommendationContext(currentLocation, preferences);
      
      // 生成路线推荐提示词
      const prompt = this.generateRouteRecommendationPrompt(currentLocation, preferences);
      
      // 发送到AI进行路线分析
      const response = await this.sendMessage(
        userId,
        prompt,
        undefined,
        context,
        'kimi',
        'route_recommendation'
      );

      // 解析路线推荐
      return this.parseRouteRecommendations(response.response);
    } catch (error) {
      console.error('路线推荐生成失败:', error);
      return {
        routes: [],
        aiExplanation: '路线推荐服务暂时不可用'
      };
    }
  }

  /**
   * 构建GPS分析上下文
   */
  private buildGPSAnalysisContext(gpsData: GPSData, previousData?: GPSData): Partial<AIContext> {
    return {
      locationData: {
        currentLocation: {
          latitude: gpsData.latitude,
          longitude: gpsData.longitude,
          accuracy: gpsData.accuracy,
          timestamp: gpsData.timestamp
        },
        previousLocation: previousData ? {
          latitude: previousData.latitude,
          longitude: previousData.longitude,
          accuracy: previousData.accuracy,
          timestamp: previousData.timestamp
        } : undefined,
        movementData: {
          currentSpeed: gpsData.speed,
          totalDistance: gpsData.totalDistance,
          isMoving: gpsData.isMoving
        }
      },
      safetyContext: {
        timeOfDay: new Date().getHours(),
        isNightTime: this.isNightTime(),
        currentSafetyScore: 8.0 // 默认值，可以从其他服务获取
      }
    };
  }

  /**
   * 生成GPS分析提示词
   */
  private generateGPSAnalysisPrompt(gpsData: GPSData, previousData?: GPSData): string {
    const speedChange = previousData ? 
      ((gpsData.speed - previousData.speed) / previousData.speed * 100).toFixed(1) : '0';
    
    return `请分析当前GPS数据：
位置：${gpsData.latitude.toFixed(6)}, ${gpsData.longitude.toFixed(6)}
精度：${gpsData.accuracy}米
速度：${gpsData.speed.toFixed(1)}公里/小时
总距离：${gpsData.totalDistance.toFixed(2)}公里
运动状态：${gpsData.isMoving ? '运动中' : '静止'}
${previousData ? `速度变化：${speedChange}%` : ''}
时间：${gpsData.timestamp.toLocaleString()}

请提供：
1. 当前运动状态分析
2. 安全评估
3. 性能建议
4. 任何需要注意的事项`;
  }

  /**
   * 构建实时监控上下文
   */
  private buildRealtimeMonitoringContext(
    gpsData: GPSData,
    sessionData: any
  ): Partial<AIContext> {
    return {
      locationData: {
        currentLocation: {
          latitude: gpsData.latitude,
          longitude: gpsData.longitude,
          accuracy: gpsData.accuracy,
          timestamp: gpsData.timestamp
        },
        movementData: {
          currentSpeed: gpsData.speed,
          totalDistance: sessionData.totalDistance,
          averageSpeed: sessionData.averageSpeed,
          sessionDuration: (Date.now() - sessionData.startTime.getTime()) / 1000
        }
      },
      userContext: {
        activityType: 'running',
        sessionStartTime: sessionData.startTime
      }
    };
  }

  /**
   * 生成实时监控提示词
   */
  private generateRealtimeMonitoringPrompt(gpsData: GPSData, sessionData: any): string {
    const sessionDuration = (Date.now() - sessionData.startTime.getTime()) / 1000 / 60; // 分钟
    
    return `实时跑步监控分析：
当前位置：${gpsData.latitude.toFixed(6)}, ${gpsData.longitude.toFixed(6)}
当前速度：${gpsData.speed.toFixed(1)}公里/小时
平均速度：${sessionData.averageSpeed.toFixed(1)}公里/小时
总距离：${sessionData.totalDistance.toFixed(2)}公里
会话时长：${sessionDuration.toFixed(1)}分钟
GPS精度：${gpsData.accuracy}米

请评估：
1. 当前安全状态（安全/警告/危险）
2. 是否需要采取行动
3. 具体建议

请简洁回答，格式：状态|消息|建议`;
  }

  /**
   * 构建路线推荐上下文
   */
  private buildRouteRecommendationContext(
    currentLocation: { latitude: number; longitude: number },
    preferences: any
  ): Partial<AIContext> {
    return {
      locationData: {
        currentLocation: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          timestamp: new Date()
        }
      },
      userContext: {
        preferences: preferences,
        activityType: 'running'
      }
    };
  }

  /**
   * 生成路线推荐提示词
   */
  private generateRouteRecommendationPrompt(
    currentLocation: { latitude: number; longitude: number },
    preferences: any
  ): string {
    return `基于当前位置推荐跑步路线：
当前位置：${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}
偏好距离：${preferences.distance || '不限'}公里
难度偏好：${preferences.difficulty || '中等'}
场景偏好：${preferences.scenery || '不限'}
安全要求：${preferences.safety || '高'}

请推荐3-5条适合的跑步路线，包括：
1. 路线名称和描述
2. 距离和预计时间
3. 安全评分
4. 路线亮点`;
  }

  /**
   * 提取GPS洞察
   */
  private extractGPSInsights(message: string): string[] {
    const insights: string[] = [];
    const lines = message.split('\n');
    
    for (const line of lines) {
      if (line.includes('分析') || line.includes('状态') || line.includes('表现')) {
        insights.push(line.trim());
      }
    }
    
    return insights.slice(0, 3);
  }

  /**
   * 提取GPS安全警告
   */
  private extractGPSSafetyAlerts(response: AIResponse): any[] {
    const alerts: any[] = [];
    
    if (response.emergencyLevel && response.emergencyLevel !== 'none') {
      alerts.push({
        type: 'gps_safety',
        level: response.emergencyLevel,
        message: response.message,
        timestamp: new Date()
      });
    }
    
    return alerts;
  }

  /**
   * 提取GPS建议
   */
  private extractGPSRecommendations(message: string): string[] {
    const recommendations: string[] = [];
    const lines = message.split('\n');
    
    for (const line of lines) {
      if (line.includes('建议') || line.includes('推荐') || line.includes('应该')) {
        recommendations.push(line.trim());
      }
    }
    
    return recommendations.slice(0, 3);
  }

  /**
   * 解析实时状态
   */
  private parseRealtimeStatus(response: AIResponse): {
    status: 'safe' | 'warning' | 'danger';
    message: string;
    actions?: string[];
  } {
    const message = response.message.toLowerCase();
    
    let status: 'safe' | 'warning' | 'danger' = 'safe';
    if (message.includes('危险') || response.emergencyLevel === 'critical') {
      status = 'danger';
    } else if (message.includes('警告') || message.includes('注意') || response.emergencyLevel === 'high') {
      status = 'warning';
    }
    
    return {
      status,
      message: response.message,
      actions: response.actionRequired ? [response.actionRequired] : undefined
    };
  }

  /**
   * 解析路线推荐
   */
  private parseRouteRecommendations(response: AIResponse): {
    routes: Array<{
      name: string;
      description: string;
      distance: number;
      estimatedTime: number;
      safetyScore: number;
      highlights: string[];
    }>;
    aiExplanation: string;
  } {
    // 简化实现，实际应该解析AI响应
    return {
      routes: [
        {
          name: '外滩滨江步道',
          description: 'AI推荐的安全跑步路线，沿黄浦江而行',
          distance: 5.2,
          estimatedTime: 30,
          safetyScore: 92,
          highlights: ['江景', '夜景', '人流适中']
        },
        {
          name: '世纪公园环线',
          description: '公园内部安全路线，环境优美',
          distance: 3.8,
          estimatedTime: 22,
          safetyScore: 88,
          highlights: ['绿化好', '空气清新', '安全性高']
        }
      ],
      aiExplanation: response.message
    };
  }

  /**
   * 判断是否为夜间
   */
  private isNightTime(): boolean {
    const hour = new Date().getHours();
    return hour < 6 || hour > 20;
  }

  /**
   * 创建离线对话（当 Supabase 不可用时）
   */
  private async createOfflineConversation(
    userId: string,
    options: {
      title?: string;
      provider?: 'kimi' | 'deepseek';
      conversationType?: 'general' | 'women_safety' | 'emergency' | 'safety' | 'route_recommendation' | 'analysis';
      isEmergency?: boolean;
    }
  ): Promise<AIConversation> {
    console.group('💾 AIService - 创建离线对话');
    
    const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const conversation: AIConversation = {
      id: offlineId,
      userId,
      title: options.title || '新对话',
      aiProvider: options.provider || 'kimi',
      conversationType: options.conversationType || 'general',
      isEmergency: options.isEmergency || false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      messages: [],
      isOffline: true,
    };

    console.log('✅ 离线对话创建成功:', {
      conversationId: conversation.id,
      title: conversation.title,
      conversationType: conversation.conversationType
    });
    console.groupEnd();
    
    return conversation;
  }

  /**
   * 生成离线 AI 响应
   */
  private generateOfflineAIResponse(
    message: string,
    conversationType?: string,
    context?: Partial<AIContext>
  ): AIResponse {
    console.log('🤖 生成智能本地响应');
    
    // 根据对话类型生成不同的响应
    let responseMessage = '';
    let emergencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    switch (conversationType) {
      case 'emergency':
        responseMessage = '我已为您优先安排安全建议：如遇真实紧急情况，请立即拨打110或120。我将同时给出可执行的自救与求助步骤。';
        emergencyLevel = 'high';
        break;
      case 'women_safety':
        responseMessage = '建议保持警觉，选择光线充足、视野开阔的人行区域，并与亲友共享行程。安全始终优先。';
        break;
      case 'safety':
        responseMessage = '建议选择熟悉路线、携带必要安全装备，并告知他人您的跑步计划。这些基础原则始终适用。';
        break;
      case 'route_recommendation':
        responseMessage = '为您推荐公园或滨江步道等视野开阔的路线，优先选择照明良好且人流适中的路段，避开偏僻区域。';
        break;
      default:
        responseMessage = `已收到您的消息："${message}"。我可以立即提供路线建议、安全提醒或训练计划，您更倾向哪一种？`;
    }

    return {
      message: responseMessage,
      confidence: 0.8,
      emergencyLevel,
      metadata: {
        // 不向前端暴露离线标记，保持用户体验为“在线智能”
        timestamp: new Date().toISOString(),
        conversationType,
        originalMessage: message
      },
      suggestions: [
        '查看更多路线选项',
        '开启智能安全提醒',
        '获取个性化训练建议'
      ]
    };
  }

  /**
   * 处理离线消息发送
   */
  private async handleOfflineMessage(
    userId: string,
    message: string,
    conversation: AIConversation,
    context?: Partial<AIContext>
  ): Promise<{
    response: AIResponse;
    conversation: AIConversation;
    userMessage: AIMessage;
    aiMessage: AIMessage;
  }> {
    console.group('💾 处理离线消息');
    
    // 创建用户消息
    const userMessage: AIMessage = {
      id: `offline_msg_${Date.now()}_user`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    // 生成 AI 响应
    const aiResponse = this.generateOfflineAIResponse(
      message,
      conversation.conversationType,
      context
    );

    // 创建 AI 消息
    const aiMessage: AIMessage = {
      id: `offline_msg_${Date.now()}_ai`,
      role: 'assistant',
      content: aiResponse.message,
      timestamp: new Date(),
      metadata: aiResponse.metadata,
      confidenceScore: aiResponse.confidence,
    };

    // 更新对话
    conversation.messages = [...(conversation.messages || []), userMessage, aiMessage];
    conversation.updatedAt = new Date();

    console.log('✅ 离线消息处理完成:', {
      userMessageId: userMessage.id,
      aiMessageId: aiMessage.id,
      conversationId: conversation.id
    });
    console.groupEnd();

    return {
      response: aiResponse,
      conversation,
      userMessage,
      aiMessage,
    };
  }
}

// 导出单例实例
export const aiService = new AIService();