// 增强的AI服务 - 整合KIMI客户端（本地实现，支持无密钥模拟）
import { KimiClient } from './kimiClient';
import { AIService } from './aiService';
import type { 
  AIMessage, 
  AIConversation, 
  AIContext, 
  AIRequest, 
  AIResponse,
  ImageUploadResponse
} from '../../types/ai';

export class EnhancedAIService extends AIService {
  private kimiClient: KimiClient;

  constructor() {
    super();
    this.kimiClient = new KimiClient();
  }

  /**
   * 增强的消息发送功能，使用外部KIMI客户端
   */
  async sendEnhancedMessage(
    userId: string,
    message: string,
    conversationId?: string,
    context?: Partial<AIContext>,
    provider?: 'kimi' | 'deepseek',
    conversationType?: 'safety' | 'emergency' | 'general' | 'women_safety' | 'route_recommendation' | 'challenge_competition' | 'analysis',
    images?: ImageUploadResponse[]
  ): Promise<{
    response: AIResponse;
    conversation: AIConversation;
    userMessage: AIMessage;
    aiMessage: AIMessage;
  }> {
    // 在线优先策略：
    // - 路线推荐优先DeepSeek（具备RouteAgent提示）
    // - 其他类型优先KIMI
    try {
      const isRoute = conversationType === 'route_recommendation';
      const explicitProvider = provider as ('kimi' | 'deepseek' | undefined);

      if (explicitProvider === 'deepseek' || isRoute) {
        // DeepSeek优先
        try {
          return await this.sendMessage(
            userId,
            message,
            conversationId,
            context,
            'deepseek',
            conversationType
          );
        } catch (deepseekError) {
          console.warn('DeepSeek发送失败，尝试KIMI备选:', deepseekError);
          try {
            return await this.sendMessageWithKimi(
              userId,
              message,
              conversationId,
              context,
              conversationType,
              images
            );
          } catch (kimiError) {
            console.warn('KIMI也失败，回退基础AI服务:', kimiError);
            return await this.sendMessage(
              userId,
              message,
              conversationId,
              context,
              explicitProvider,
              conversationType
            );
          }
        }
      }

      // 默认或明确指定KIMI：KIMI优先
      try {
        return await this.sendMessageWithKimi(
          userId,
          message,
          conversationId,
          context,
          conversationType,
          images
        );
      } catch (kimiError) {
        console.warn('KIMI发送失败，尝试DeepSeek备选:', kimiError);
        try {
          return await this.sendMessage(
            userId,
            message,
            conversationId,
            context,
            'deepseek',
            conversationType
          );
        } catch (deepseekError) {
          console.warn('DeepSeek也失败，回退基础AI服务:', deepseekError);
          return await this.sendMessage(
            userId,
            message,
            conversationId,
            context,
            explicitProvider,
            conversationType
          );
        }
      }
    } catch (error) {
      console.error('增强AI服务总失败，最终回退基础服务:', error);
      return await this.sendMessage(
        userId,
        message,
        conversationId,
        context,
        provider as ('kimi' | 'deepseek' | undefined),
        conversationType
      );
    }
  }

  /**
   * 使用KIMI客户端发送消息
   */
  private async sendMessageWithKimi(
    userId: string,
    message: string,
    conversationId?: string,
    context?: Partial<AIContext>,
    conversationType?: 'safety' | 'emergency' | 'general' | 'women_safety' | 'route_recommendation' | 'challenge_competition' | 'analysis',
    images?: ImageUploadResponse[]
  ): Promise<{
    response: AIResponse;
    conversation: AIConversation;
    userMessage: AIMessage;
    aiMessage: AIMessage;
  }> {
    let conversation: AIConversation;

    // 如果没有提供对话ID，创建新对话
    if (!conversationId) {
      conversation = await this.createConversation(userId, {
        title: this.generateEnhancedConversationTitle(message, conversationType),
        provider: 'kimi',
        conversationType: conversationType || 'general',
        isEmergency: conversationType === 'emergency'
      });
      conversationId = conversation.id;
    } else {
      // 获取现有对话；若不存在则自动创建，保证实时对话不中断
      const existingConversation = await this.getConversation(conversationId);
      if (!existingConversation) {
        // 自动创建新的对话，使用当前会话类型与KIMI作为默认提供商
        const created = await this.createConversation(userId, {
          title: this.generateEnhancedConversationTitle(message, conversationType),
          provider: 'kimi',
          conversationType: conversationType || 'general',
          isEmergency: conversationType === 'emergency'
        });
        conversation = created;
        conversationId = created.id;
      } else {
        conversation = existingConversation;
      }
    }

    // 保存用户消息
    const userMessage: AIMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      images: images?.map(img => ({
        id: img.id,
        url: img.url,
        type: 'upload' as const,
        width: img.width,
        height: img.height,
        size: img.size,
        mimeType: img.mimeType
      })),
      metadata: context ? { context, conversationId } : { conversationId }
    };

    // 构建AI请求
    const aiRequest: AIRequest = {
      message,
      context: context || {},
      conversationId,
      provider: 'kimi',
      conversationType: conversationType || 'general',
    };

    // 使用KIMI客户端发送请求
    const aiResponse = await this.kimiClient.sendMessage(aiRequest);

    // 保存AI响应
    const aiMessage: AIMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      content: aiResponse.message,
      timestamp: new Date(),
      metadata: {
        conversationId: conversationId,
        ...aiResponse.metadata
      },
      confidenceScore: aiResponse.confidence
    };

    // 更新对话对象
    conversation.messages = [...(conversation.messages || []), userMessage, aiMessage];
    conversation.updatedAt = new Date();
    conversation.lastMessage = aiResponse.message.substring(0, 100);

    return {
      response: aiResponse,
      conversation,
      userMessage,
      aiMessage,
    };
  }

  /**
   * 生成增强对话标题
   */
  private generateEnhancedConversationTitle(message: string, conversationType?: string): string {
    const typeLabels = {
      'general': '通用咨询',
      'women_safety': '女性安全',
      'emergency': '紧急求助',
      'safety': '安全分析',
      'route_recommendation': '路线推荐',
      'challenge_competition': '挑战竞赛',
      'analysis': '智能分析'
    };

    const typeLabel = typeLabels[conversationType as keyof typeof typeLabels] || '智能对话';
    const shortMessage = message.length > 20 ? message.substring(0, 20) + '...' : message;
    
    return `${typeLabel} - ${shortMessage}`;
  }

  /**
   * 专门用于路线推荐的AI对话
   */
  async generateRouteRecommendation(
    userId: string,
    userProfile: any,
    routePreferences: any,
    currentLocation: any,
    availableWaypoints: any[]
  ): Promise<{
    response: AIResponse;
    conversation: AIConversation;
  }> {
    const context: Partial<AIContext> = {
      userContext: {
        preferences: routePreferences
      },
      locationData: {
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        address: currentLocation.address
      },
      conversationId: `route_${Date.now()}`,
      createdAt: new Date()
    };

    const message = this.buildRouteRecommendationMessage(
      userProfile, 
      routePreferences, 
      currentLocation, 
      availableWaypoints
    );

    const result = await this.sendEnhancedMessage(
      userId,
      message,
      undefined,
      context,
      'deepseek',
      'route_recommendation'
    );

    return {
      response: result.response,
      conversation: result.conversation
    };
  }

  /**
   * 构建路线推荐消息
   */
  private buildRouteRecommendationMessage(
    userProfile: any,
    routePreferences: any,
    currentLocation: any,
    availableWaypoints: any[]
  ): string {
    return `请为我推荐一条跑步路线。

用户信息：
- 年龄：${userProfile.age || '未知'}
- 性别：${userProfile.gender || '未知'}
- 跑步经验：${userProfile.runningExperience || '初级'}
- 身体状况：${userProfile.fitnessLevel || '一般'}

路线偏好：
- 目标距离：${routePreferences.targetDistance || '5'}公里
- 难度等级：${routePreferences.difficulty || '中等'}
- 场景类型：${routePreferences.sceneryType || '城市'}
- 安全优先级：${routePreferences.safetyPriority || '高'}

当前位置：${currentLocation.name || '未知位置'}

可选途径点：
${availableWaypoints.map((point, index) => 
  `${index + 1}. ${point.name} - 距离：${point.distance}km，类型：${point.type}`
).join('\n')}

请基于以上信息，为我推荐最适合的跑步路线，并说明推荐理由。`;
  }

  /**
   * 专门用于女性安全咨询的AI对话
   */
  async getWomenSafetyAdvice(
    userId: string,
    safetyContext: {
      timeOfDay?: string;
      location?: string;
      concerns?: string[];
      emergencyContacts?: any[];
    }
  ): Promise<{
    response: AIResponse;
    conversation: AIConversation;
  }> {
    const context: Partial<AIContext> = {
      safetyContext: {
        timeOfDay: safetyContext.timeOfDay,
        lightingCondition: safetyContext.location
      },
      conversationId: `women_safety_${Date.now()}`,
      createdAt: new Date()
    };

    const message = `我是一名女性跑步者，想咨询跑步安全问题。

当前情况：
- 跑步时间：${safetyContext.timeOfDay || '白天'}
- 跑步地点：${safetyContext.location || '城市公园'}
- 主要担忧：${safetyContext.concerns?.join('、') || '人身安全'}

请为我提供专业的女性跑步安全建议。`;

    const result = await this.sendEnhancedMessage(
      userId,
      message,
      undefined,
      context,
      'kimi',
      'women_safety'
    );

    return {
      response: result.response,
      conversation: result.conversation
    };
  }

  /**
   * 紧急情况处理
   */
  async handleEmergencySituation(
    userId: string,
    emergencyDetails: {
      type: string;
      location?: string;
      description: string;
      urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    }
  ): Promise<{
    response: AIResponse;
    conversation: AIConversation;
  }> {
    const context: Partial<AIContext> = {
      safetyContext: {
        timeOfDay: 'emergency',
        lightingCondition: emergencyDetails.location || 'unknown'
      },
      conversationId: `emergency_${Date.now()}`,
      createdAt: new Date()
    };

    const message = `紧急情况求助！

情况类型：${emergencyDetails.type}
紧急程度：${emergencyDetails.urgencyLevel}
当前位置：${emergencyDetails.location || '未知'}
详细描述：${emergencyDetails.description}

请立即提供应对建议！`;

    const result = await this.sendEnhancedMessage(
      userId,
      message,
      undefined,
      context,
      'kimi',
      'emergency'
    );

    return {
      response: result.response,
      conversation: result.conversation
    };
  }
}

// 创建增强AI服务实例
export const enhancedAIService = new EnhancedAIService();
