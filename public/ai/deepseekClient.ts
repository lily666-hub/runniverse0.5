// DeepSeek API客户端服务
import type { AIRequest, AIResponse, AIContext } from '../../../../types/ai';

export class DeepSeekClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
    this.baseUrl = 'https://api.deepseek.com/v1';
    this.model = 'deepseek-chat';
    
    if (!this.apiKey) {
      console.warn('DeepSeek API密钥未配置');
    }
  }

  /**
   * 发送消息到DeepSeek API
   */
  async sendMessage(request: AIRequest): Promise<AIResponse> {
    if (!this.apiKey || this.apiKey === 'your_deepseek_api_key') {
      console.warn('DeepSeek API密钥未配置，使用模拟响应');
      return this.getMockResponse(request);
    }

    try {
      const systemPrompt = this.buildSystemPrompt(request.conversationType, request.context);
      const userMessage = this.buildUserMessage(request.message, request.context);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiMessage = data.choices[0]?.message?.content || '抱歉，我无法处理您的请求。';

      return this.parseAIResponse(aiMessage, request.conversationType);
    } catch (error) {
      console.error('DeepSeek API调用错误:', error);
      console.warn('API调用失败，使用模拟响应:', error);
      return this.getMockResponse(request);
    }
  }

  /**
   * 获取模拟响应（用于开发和测试）
   */
  private getMockResponse(request: AIRequest): AIResponse {
    const mockResponses = {
      general: [
        '您好！我是您的路线小助手。我了解到您想要咨询跑步路线相关的问题。作为专业的路线助手，我建议您在跑步时注意以下几点：\n\n1. 选择安全的跑步路线，避免偏僻地区\n2. 告知家人或朋友您的跑步计划\n3. 携带手机和必要的安全设备\n4. 注意周围环境，保持警觉\n\n请告诉我您具体想了解哪方面的路线知识？',
        '感谢您使用我们的路线小助手服务。基于您的问题，我为您提供以下专业建议：\n\n跑步路线选择是非常重要的，特别是在城市环境中。建议您：\n- 选择光线充足的路段\n- 避开交通繁忙的区域\n- 穿着醒目的运动装备\n- 保持适当的跑步速度\n\n如果您有更具体的路线问题，请随时告诉我。'
      ],
      women_safety: [
        '作为女性跑步者的专属安全顾问，我特别理解您对安全的担忧。以下是专门为女性跑步者准备的安全建议：\n\n🌟 核心安全原则：\n- 选择人流适中的公共区域\n- 避免戴耳机或只戴一只耳机\n- 携带防身警报器\n- 告知可信任的人您的跑步路线和时间\n\n💪 自信与警觉并重：\n- 保持自信的姿态\n- 信任您的直觉\n- 如感到不安，立即改变路线\n\n您有特定的安全担忧需要我帮助解决吗？'
      ],
      emergency: [
        '⚠️ 紧急情况响应 ⚠️\n\n我检测到这可能是紧急情况。请立即采取以下措施：\n\n🚨 立即行动：\n1. 如果您处于危险中，立即拨打110报警\n2. 移动到安全、有人的地方\n3. 联系您的紧急联系人\n\n📍 位置安全：\n- 寻找最近的商店、餐厅或公共场所\n- 避免进入偏僻区域\n- 保持手机畅通\n\n请告诉我您的具体情况，我会提供更针对性的帮助。您的安全是最重要的！'
      ],
      route_recommendation: [
        '基于您的需求，我为您推荐以下跑步路线：\n\n🏃‍♀️ 推荐路线：外滩滨江步道\n📍 起点：外滩观光隧道入口\n📏 距离：约5公里\n⏱️ 预计用时：25-30分钟\n🌟 难度：适中\n\n✨ 路线亮点：\n- 黄浦江美景尽收眼底\n- 路面平整，适合各种跑步水平\n- 安全性高，人流适中\n- 沿途有休息点和补给站\n\n💡 贴心提示：\n- 建议早晨或傍晚时段跑步\n- 注意避开人流高峰期\n- 携带充足的水分补给'
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
    const basePrompt = `你是上海城市跑应用的AI智能安全顾问，专门为跑步者提供个性化的安全建议和支持。

你的核心能力：
1. 深度分析跑步环境的安全风险
2. 提供基于数据的个性化安全建议
3. 为女性跑步者提供专业的安全指导
4. 快速响应紧急情况并提供专业指导
5. 学习用户习惯并优化建议

你的特点：
- 逻辑清晰，分析深入
- 基于科学数据和实际案例
- 对安全问题高度敏感
- 能够快速识别风险并提供解决方案
- 持续学习和改进建议质量`;

    let specificPrompt = '';
    
    switch (conversationType) {
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
响应模式：高优先级
核心能力：
- 快速评估紧急情况的严重程度
- 提供分步骤的应急处理方案
- 指导用户保持冷静并采取正确行动
- 评估是否需要专业救援服务
- 提供心理支持和安抚
- 记录关键信息用于后续分析`;
        break;
      
      case 'analysis':
        specificPrompt = `
专业领域：安全数据分析
分析维度：
- 多维度安全风险评估模型
- 历史数据和趋势分析
- 个人行为模式和风险偏好
- 环境因素的综合影响评估
- 预测性安全建议
- 量化的风险评分和改进建议`;
        break;
      
      default:
        specificPrompt = `
专业领域：综合安全咨询
提供全方位的跑步安全指导和深度分析`;
    }

    // 添加上下文信息
    if (context) {
      let contextInfo = '\n\n当前分析上下文：';
      
      if (context.locationData) {
        contextInfo += `\n地理位置分析：`;
        contextInfo += `地址：${context.locationData.address || '位置未知'}`;
        if (context.locationData.district) {
          contextInfo += `，区域：${context.locationData.district}`;
        }
        if (context.locationData.safetyLevel !== undefined) {
          contextInfo += `，当前安全评分：${context.locationData.safetyLevel}/10`;
        }
      }
      
      if (context.userContext) {
        contextInfo += `\n用户画像分析：`;
        const userInfo = [];
        if (context.userContext.gender) userInfo.push(`性别：${context.userContext.gender}`);
        if (context.userContext.age) userInfo.push(`年龄：${context.userContext.age}`);
        if (context.userContext.runningExperience) userInfo.push(`跑步经验：${context.userContext.runningExperience}`);
        contextInfo += userInfo.join('，');
      }
      
      if (context.safetyContext) {
        contextInfo += `\n环境安全分析：`;
        const envInfo = [];
        if (context.safetyContext.timeOfDay) envInfo.push(`时段：${context.safetyContext.timeOfDay}`);
        if (context.safetyContext.weather) envInfo.push(`天气：${context.safetyContext.weather}`);
        if (context.safetyContext.crowdLevel) envInfo.push(`人流密度：${context.safetyContext.crowdLevel}`);
        if (context.safetyContext.lightingCondition) envInfo.push(`照明状况：${context.safetyContext.lightingCondition}`);
        contextInfo += envInfo.join('，');
      }
      
      specificPrompt += contextInfo;
    }

    return basePrompt + specificPrompt;
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
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
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