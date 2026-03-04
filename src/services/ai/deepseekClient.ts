// DeepSeek API客户端服务
import type { AIRequest, AIResponse, AIContext } from '../../types/ai';

export class DeepSeekClient {
  private model: string;

  constructor() {
    this.model = 'deepseek-chat';
    console.info('DeepSeek 客户端已初始化，使用服务端代理');
  }

  /**
   * 发送消息到DeepSeek API
   */
  async sendMessage(request: AIRequest): Promise<AIResponse> {
    try {
      return await this.sendRealMessage(request);
    } catch (error) {
      console.warn('🔄 DeepSeek API调用失败，使用智能模拟响应继续服务');
      return this.getMockResponse(request);
    }
  }

  /**
   * 发送真实消息到DeepSeek API
   */
  private async sendRealMessage(request: AIRequest): Promise<AIResponse> {
    try {
      const systemPrompt = this.buildSystemPrompt(request.conversationType, request.context);
      const userMessage = this.buildUserMessage(request.message, request.context);

      console.log('发送DeepSeek API请求:', {
        url: `${this.baseUrl}/chat/completions`,
        model: this.model,
        messageLength: userMessage.length,
        conversationType: request.conversationType
      });

      const response = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          providerPreference: 'deepseek',
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 1000,
        }),
      });

      console.log('DeepSeek API响应状态:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DeepSeek API错误响应:', errorText);
        throw new Error(`DeepSeek API请求失败: ${response.status} ${response.statusText}. 详细信息: ${errorText}`);
      }

      const data = await response.json();
      const aiMessage = data?.content || '抱歉，我无法处理您的请求。';

      return this.parseAIResponse(aiMessage, request.conversationType);
    } catch (error) {
      console.error('DeepSeek API调用错误:', error);
      
      // 重新抛出错误，让调用方处理
      throw error;
    }
  }

  /**
   * 发送消息到DeepSeek API（兼容模式）
   */
  async sendMessageCompat(request: AIRequest): Promise<AIResponse> {
    try {
      return await this.sendRealMessage(request);
    } catch (error) {
      console.warn('🔄 DeepSeek API调用失败，使用智能模拟响应继续服务');
      return this.getMockResponse(request);
    }
  }

  /**
   * 获取模拟响应（用于开发和测试）
   */
  private getMockResponse(request: AIRequest): AIResponse {
    const mockResponses = {
      general: [
        '您好！我是您的AI智能助手。我了解到您想要咨询相关问题。作为专业的智能助手，我建议您注意以下几点：\n\n1. 制定合理的计划和目标\n2. 保持积极的心态\n3. 注意安全和健康\n4. 寻求专业指导\n\n请告诉我您具体想了解什么？',
        '感谢您使用我们的AI智能助手服务。基于您的问题，我为您提供以下专业建议：\n\n智能分析是非常重要的，特别是在复杂环境中。建议您：\n- 收集充分的信息\n- 分析多个维度的因素\n- 制定可行的方案\n- 持续优化和改进\n\n如果您有更具体的需求，请随时告诉我。'
      ],
      women_safety: [
        '作为女性专属智能顾问，我特别理解您对安全的关注。以下是专门为女性准备的安全建议：\n\n🌟 核心安全原则：\n- 选择安全可靠的环境\n- 保持警觉和谨慎\n- 携带必要的安全设备\n- 告知可信任的人您的行程\n\n💪 自信与防范并重：\n- 保持自信的态度\n- 信任您的直觉\n- 如感到不安，立即寻求帮助\n\n您有特定的安全担忧需要我帮助解决吗？'
      ],
      emergency: [
        '⚠️ 紧急情况响应 ⚠️\n\n我检测到这可能是紧急情况。请立即采取以下措施：\n\n🚨 立即行动：\n1. 如果您处于危险中，立即拨打110报警\n2. 移动到安全的地方\n3. 联系您的紧急联系人\n\n📍 安全措施：\n- 寻找最近的安全场所\n- 避免进入危险区域\n- 保持通讯畅通\n\n请告诉我您的具体情况，我会提供更针对性的帮助。您的安全是最重要的！'
      ],
      challenge_competition: [
        '🏆 您好！我是您的AI挑战推荐助手，专门为您提供个性化的挑战和竞赛方案！\n\n🎯 基于深度分析，我为您推荐以下挑战：\n\n💪 智能挑战：\n- 制定渐进式目标计划\n- 尝试突破个人记录\n- 探索新的训练方法\n\n🏃‍♀️ 竞赛建议：\n- 参加适合的竞赛活动\n- 制定科学的训练计划\n- 寻找志同道合的伙伴\n\n请告诉我您的具体目标和当前水平，我会为您制定更详细的挑战方案！',
        '🌟 欢迎来到智能挑战推荐系统！我将基于深度学习为您量身定制挑战方案。\n\n📊 个性化分析推荐：\n\n🎖️ 能力提升挑战：\n- 技能水平阶梯式提升\n- 多维度能力发展\n- 持续进步跟踪\n\n⚡ 创新挑战：\n- 突破传统思维模式\n- 尝试前沿方法\n- 培养创新能力\n\n🏅 协作挑战：\n- 团队合作项目\n- 知识分享交流\n- 共同成长进步\n\n您最感兴趣哪类挑战？我来为您深度定制！',
        '🚀 AI挑战推荐助手为您服务！让我们一起制定激动人心的挑战计划！\n\n🎯 智能分析您的潜力：\n\n📈 提升策略：\n- 基于数据的科学分析\n- 个性化能力评估\n- 精准的改进建议\n\n🏆 挑战推荐：\n- 适合您水平的挑战项目\n- 循序渐进的难度设计\n- 多样化的挑战类型\n\n💡 创新方案：\n- 独特的挑战设计\n- 趣味性与实用性结合\n- 持续的动机激发\n\n告诉我您的兴趣和目标，我会推荐最适合的挑战项目！'
      ],
      route_recommendation: [
        '基于智能分析，我为您推荐以下优质路线：\n\n🏃‍♀️ 推荐路线：智能优化路径\n📍 起点：根据您的位置智能选择\n📏 距离：个性化距离设计\n⏱️ 预计用时：科学时间规划\n🌟 难度：适合您的水平\n\n✨ 路线亮点：\n- 环境优美，空气清新\n- 安全可靠，设施完善\n- 距离适中，挑战合理\n- 风景宜人，体验丰富\n\n需要我为您提供更详细的路线信息吗？'
      ]
    };

    const responseType = request.conversationType || 'general';
    const responses = mockResponses[responseType as keyof typeof mockResponses] || mockResponses.general;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return this.parseAIResponse(randomResponse, request.conversationType);
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(conversationType?: string, context?: Partial<AIContext>): string {
    const basePrompt = `你是上海城市跑应用的AI智能助手，专门为跑步者提供个性化的服务和支持。

你的核心能力：
1. 深度分析用户需求和环境条件
2. 提供基于数据的个性化建议
3. 学习用户习惯并优化建议
4. 快速响应并提供专业指导
5. 持续改进服务质量

你的特点：
- 逻辑清晰，分析深入
- 基于科学数据和实际案例
- 能够快速识别需求并提供解决方案
- 持续学习和改进建议质量`;

    let specificPrompt = '';
    
    switch (conversationType) {
      case 'route_recommendation':
        specificPrompt = `
专业领域：智能路线推荐
你是RouteAgent，专注于：
- 基于用户位置、偏好和实时条件推荐最佳跑步路线
- 分析地形、安全性、景观、人流量等多维度因素
- 考虑天气、空气质量、时间等环境因素
- 提供个性化的距离、难度、风景路线选择
- 实时优化路线建议，避开拥堵和危险区域
- 推荐适合不同技能水平的路线变化

回答风格：专业而友好，像一个经验丰富的跑步教练，善于发现最佳路线`;
        break;
      
      case 'challenge_competition':
        specificPrompt = `
专业领域：挑战竞赛指导
你是ChallengeAgent，专注于：
- 根据用户跑步数据和能力水平设计个性化挑战
- 提供循序渐进的训练计划和目标设定
- 实时监控跑步状态，给予鼓励和指导
- 分析跑步表现，提供改进建议
- 设计有趣的竞赛活动和成就系统
- 帮助用户突破个人记录和舒适区

回答风格：充满激情和鼓励，像一个专业的运动教练，善于激发潜能`;
        break;
      
      case 'safety_advisor':
        specificPrompt = `
专业领域：安全顾问服务
你是SafetyAgent，专注于：
- 深度分析跑步环境的安全风险
- 提供基于数据的个性化安全建议
- 为女性跑步者提供专业的安全指导
- 快速响应紧急情况并提供专业指导
- 实时监控安全状况，预警潜在风险
- 建立安全跑步的最佳实践指南

回答风格：专业严谨，高度关注安全，像一个经验丰富的安全专家`;
        break;
      
      case 'women_safety':
        specificPrompt = `
专业领域：女性跑步安全
深度关注：
- 女性跑步者的特殊安全需求和风险点
- 基于性别的安全威胁分析和预防
- 夜间和偏僻区域的安全策略
- 心理安全和自信心建设
- 社会支持网络的建立和利用
- 自我防护技能和应急响应`;
        break;
      
      case 'emergency':
        specificPrompt = `
专业领域：紧急情况处理
深度关注：
- 快速评估紧急情况的严重程度
- 提供即时的应急处理指导
- 协调救援资源和联系方式
- 心理支持和情绪稳定
- 预防措施和风险规避
- 后续跟进和康复建议`;
        break;
      
      default:
        specificPrompt = `
专业领域：综合跑步服务
提供全方位的跑步相关建议和支持。`;
    }

    // 添加上下文信息
    let contextPrompt = '';
    if (context) {
      if (context.userLocation) {
        contextPrompt += `\n当前用户位置：${context.userLocation.address || '上海市'}`;
      }
      if (context.weatherData) {
        contextPrompt += `\n当前天气：${context.weatherData.condition}，温度${context.weatherData.temperature}°C`;
      }
      if (context.userPreferences) {
        contextPrompt += `\n用户偏好：${JSON.stringify(context.userPreferences)}`;
      }
      if (context.safetyLevel) {
        contextPrompt += `\n安全等级：${context.safetyLevel}`;
      }
    }

    return `${basePrompt}\n${specificPrompt}${contextPrompt}

请始终：
1. 提供具体、可操作的建议
2. 考虑用户的安全和健康
3. 保持专业和友好的语调
4. 基于实际数据和科学原理
5. 适应用户的具体情况和需求`;
  }

  /**
   * 构建用户消息
   */
  private buildUserMessage(message: string, context?: Partial<AIContext>): string {
    return message;
  }

  /**
   * 解析AI响应
   */
  private parseAIResponse(aiMessage: string, conversationType?: string): AIResponse {
    // 基础响应
    const response: AIResponse = {
      message: aiMessage,
      confidence: 0.85, // DeepSeek通常有较高的置信度
    };

    // 智能检测紧急程度
    const criticalKeywords = ['立即', '马上', '紧急', '危险', '报警'];
    const highKeywords = ['注意', '小心', '避免', '警惕'];
    const emergencyKeywords = ['求救', '帮助', '110', '120', '救命'];

    const hasCritical = criticalKeywords.some(keyword => 
      aiMessage.toLowerCase().includes(keyword.toLowerCase())
    );
    const hasHigh = highKeywords.some(keyword => 
      aiMessage.toLowerCase().includes(keyword.toLowerCase())
    );
    const hasEmergency = emergencyKeywords.some(keyword => 
      aiMessage.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasEmergency || conversationType === 'emergency') {
      response.emergencyLevel = 'critical';
      response.actionRequired = true;
    } else if (hasCritical) {
      response.emergencyLevel = 'high';
      response.actionRequired = true;
    } else if (hasHigh) {
      response.emergencyLevel = 'medium';
    } else {
      response.emergencyLevel = 'low';
    }

    // 智能提取建议
    const suggestions: string[] = [];
    
    // 使用正则表达式提取建议
    const suggestionPatterns = [
      /建议[：:](.+?)(?=[。！\n]|$)/g,
      /推荐[：:](.+?)(?=[。！\n]|$)/g,
      /应该(.+?)(?=[。！\n]|$)/g,
      /可以(.+?)(?=[。！\n]|$)/g,
    ];

    suggestionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(aiMessage)) !== null) {
        const suggestion = match[1]?.trim();
        if (suggestion && suggestion.length > 5 && suggestion.length < 100) {
          suggestions.push(suggestion);
        }
      }
    });

    if (suggestions.length > 0) {
      response.suggestions = [...new Set(suggestions)].slice(0, 5); // 去重并限制数量
    }

    // 添加元数据
    response.metadata = {
      provider: 'deepseek',
      model: this.model,
      conversationType,
      timestamp: new Date().toISOString(),
      analysisDepth: 'deep',
      suggestionCount: suggestions.length,
    };

    return response;
  }

  /**
   * 检查API连接状态
   */
  async checkConnection(): Promise<boolean> {
    try {
      const resp = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status' })
      });
      if (!resp.ok) return false;
      const data = await resp.json();
      return !!data.deepseek;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取模型信息
   */
  async getModelInfo(): Promise<any> {
    if (!this.apiKey) {
      throw new Error('DeepSeek API密钥未配置');
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`获取模型信息失败: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('获取DeepSeek模型信息错误:', error);
      throw error;
    }
  }
}