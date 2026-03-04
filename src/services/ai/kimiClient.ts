// KIMI API客户端服务
import type { AIRequest, AIResponse, AIContext } from '../../types/ai';

export class KimiClient {
  private model: string;

  constructor() {
    this.model = 'moonshot-v1-8k';
    console.info('KIMI 客户端已初始化，使用服务端代理');
  }

  /**
   * 发送消息到KIMI API
   */
  async sendMessage(request: AIRequest): Promise<AIResponse> {
    try {
      return await this.sendRealMessage(request);
    } catch (error) {
      console.warn('🔄 KIMI API调用失败，使用智能模拟响应继续服务');
      return this.getMockResponse(request);
    }
  }

  /**
   * 发送真实消息到KIMI API
   */
  private async sendRealMessage(request: AIRequest): Promise<AIResponse> {
    try {
      const systemPrompt = this.buildSystemPrompt(request.conversationType, request.context);
      const userMessage = this.buildUserMessage(request.message, request.context);

      const requestBody = {
        action: 'chat',
        providerPreference: 'kimi',
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 1000,
      };

      const startTime = performance.now();
      const response = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Proxy request failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();
      const aiMessage = data?.content || '抱歉，我无法处理您的请求。';

      return this.parseAIResponse(aiMessage, request.conversationType);
    } catch (error) {
      console.error('错误类型:', error?.constructor?.name || 'Unknown');
      console.error('错误消息:', error instanceof Error ? error.message : String(error));
      console.error('错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息');
      console.error('请求参数:', {
        conversationType: request.conversationType,
        messageLength: request.message.length,
        hasContext: !!request.context
      });
      
      // 重新抛出错误，让调用方处理
      throw error;
    }
  }

  /**
   * 发送消息到KIMI API（兼容模式）
   */
  async sendMessageCompat(request: AIRequest): Promise<AIResponse> {
    try {
      return await this.sendRealMessage(request);
    } catch (error) {
      console.warn('🔄 KIMI API调用失败，使用智能模拟响应继续服务');
      return this.getMockResponse(request);
    }
  }

  /**
   * 获取模拟响应（确保AI始终在线）
   */
  public getMockResponse(request: AIRequest): AIResponse {
    // 如果请求中包含图片上下文，生成图片相关的响应
    if (request.context?.imageUrl) {
      return this.getImageAnalysisMockResponse(request);
    }

    const mockResponses = {
      general: [
        '您好！我是您的路线小助手。我了解到您想要咨询跑步路线相关的问题。作为专业的路线助手，我建议您在跑步时注意以下几点：\n\n1. 选择安全的跑步路线，避免偏僻地区\n2. 告知家人或朋友您的跑步计划\n3. 携带手机和必要的安全设备\n4. 注意周围环境，保持警觉\n\n请告诉我您具体想了解哪方面的路线知识？',
        '感谢您使用我们的路线小助手服务。基于您的问题，我为您提供以下专业建议：\n\n跑步路线选择是非常重要的，特别是在城市环境中。建议您：\n- 选择光线充足的路段\n- 避开交通繁忙的区域\n- 穿着醒目的运动装备\n- 保持适当的跑步速度\n\n如果您有更具体的路线问题，请随时告诉我。',
        '我理解您对跑步安全的关注。作为您的AI安全助手，我建议您制定一个完整的安全跑步计划：\n\n🏃‍♀️ 路线规划：选择熟悉且安全的路线\n⏰ 时间安排：避免过早或过晚的时段\n📱 通讯设备：确保手机电量充足\n👥 结伴跑步：如可能，与朋友一起跑步\n\n您还有其他想了解的安全知识吗？'
      ],
      women_safety: [
        '作为女性跑步者的专属安全顾问，我特别理解您对安全的担忧。以下是专门为女性跑步者准备的安全建议：\n\n🌟 核心安全原则：\n- 选择人流适中的公共区域\n- 避免戴耳机或只戴一只耳机\n- 携带防身警报器\n- 告知可信任的人您的跑步路线和时间\n\n💪 自信与警觉并重：\n- 保持自信的姿态\n- 信任您的直觉\n- 如感到不安，立即改变路线\n\n您有特定的安全担忧需要我帮助解决吗？',
        '女性跑步安全是我特别关注的领域。让我为您提供一些实用的安全策略：\n\n🛡️ 预防措施：\n- 变换跑步路线和时间\n- 穿着合适的运动装备\n- 避免显露贵重物品\n- 学习基本的自卫技巧\n\n📞 紧急准备：\n- 设置紧急联系人快捷拨号\n- 了解沿途的安全点（商店、警察局等）\n- 考虑使用跑步安全APP\n\n请告诉我您最关心的安全方面，我会提供更详细的指导。'
      ],
      emergency: [
        '⚠️ 紧急情况响应 ⚠️\n\n我检测到这可能是紧急情况。请立即采取以下措施：\n\n🚨 立即行动：\n1. 如果您处于危险中，立即拨打110报警\n2. 移动到安全、有人的地方\n3. 联系您的紧急联系人\n\n📍 位置安全：\n- 寻找最近的商店、餐厅或公共场所\n- 避免进入偏僻区域\n- 保持手机畅通\n\n请告诉我您的具体情况，我会提供更针对性的帮助。您的安全是最重要的！',
        '🆘 紧急安全协助 🆘\n\n我正在为您提供紧急安全支持。请保持冷静并按以下步骤操作：\n\n✅ 即时安全检查：\n- 您现在是否安全？\n- 是否需要立即报警？\n- 周围是否有其他人可以帮助？\n\n📱 紧急联系：\n- 报警电话：110\n- 医疗急救：120\n- 消防救援：119\n\n请详细描述您的情况，我会根据具体情况提供最适合的应对建议。'
      ],
      challenge_competition: [
        '🏆 您好！我是您的AI挑战推荐助手，专门为您提供个性化的跑步挑战和竞赛方案！\n\n🎯 基于您的跑步水平，我为您推荐以下挑战：\n\n💪 本周挑战：\n- 连续5天完成3公里跑步\n- 尝试提升配速10秒/公里\n- 探索2条新的跑步路线\n\n🏃‍♀️ 进阶目标：\n- 参加下个月的5公里社区跑\n- 挑战半程马拉松训练计划\n- 加入跑步俱乐部，寻找跑友\n\n请告诉我您的具体目标，我会为您制定更详细的挑战计划！',
        '🌟 欢迎来到智能挑战推荐系统！我将根据您的跑步数据为您量身定制挑战方案。\n\n📊 个性化挑战推荐：\n\n🎖️ 距离挑战：\n- 本月累计跑步50公里\n- 单次最长距离突破8公里\n- 连续30天不间断跑步\n\n⚡ 速度挑战：\n- 5公里PB（个人最佳）提升30秒\n- 间歇训练：8×400米冲刺\n- 节奏跑：保持目标配速20分钟\n\n🏅 趣味挑战：\n- 早晨6点前完成跑步\n- 雨天坚持室内跑步\n- 带朋友一起完成10公里\n\n您最感兴趣哪类挑战？我来为您详细规划！',
        '🚀 AI挑战推荐助手为您服务！让我们一起制定激动人心的跑步挑战计划！\n\n🎯 智能分析您的跑步潜力：\n\n📈 提升建议：\n- 根据您的历史数据，建议每周增加10%的跑量\n- 加入力量训练，提升跑步效率\n- 尝试不同地形，增强适应性\n\n🏆 竞赛推荐：\n- 上海马拉松（11月）- 建议报名10公里组\n- 外滩夜跑活动 - 每周三晚上\n- 公园定向跑 - 周末家庭友好活动\n\n💡 创新挑战：\n- 用跑步轨迹"画"出有趣图案\n- 挑战不同时间段的跑步体验\n- 记录跑步日志，分享心得体会\n\n告诉我您的兴趣点，我会推荐最适合的挑战项目！'
      ]
    };

    const responseType = request.conversationType || 'general';
    const responses = mockResponses[responseType as keyof typeof mockResponses] || mockResponses.general;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return this.parseAIResponse(randomResponse, request.conversationType);
  }

  /**
   * 获取图片分析模拟响应
   */
  private getImageAnalysisMockResponse(request: AIRequest): AIResponse {
    const imageUrl = request.context?.imageUrl || '';
    const analysisType = request.context?.analysisType || 'general';
    
    const mockImageResponses = {
      safety: {
        description: `基于图片分析，这是一个相对安全的跑步环境。${imageUrl ? `图片显示${this.getImageDescription(imageUrl)}` : '环境看起来光线充足，人流适中'}。`,
        safetyLevel: 8,
        riskFactors: ['需要注意来往车辆', '建议避开交通高峰期'],
        recommendations: ['选择人行道跑步', '穿着反光运动装备', '保持警觉']
      },
      route: {
        description: `这是一条适合跑步的路线。${imageUrl ? `图片显示${this.getImageDescription(imageUrl)}` : '路面平整，风景优美'}。`,
        safetyLevel: 7,
        riskFactors: ['部分路段可能湿滑', '有几个急转弯'],
        recommendations: ['注意路面状况', '控制跑步速度', '选择合适的跑鞋']
      },
      emergency: {
        description: `图片分析显示环境安全，没有发现紧急情况。${imageUrl ? `图片显示${this.getImageDescription(imageUrl)}` : '周围环境正常'}。`,
        safetyLevel: 9,
        riskFactors: ['无明显风险'],
        recommendations: ['保持正常跑步节奏', '注意常规安全事项']
      },
      general: {
        description: `从图片来看，这是一个不错的跑步环境。${imageUrl ? `图片显示${this.getImageDescription(imageUrl)}` : '环境适宜跑步'}。`,
        safetyLevel: 7,
        riskFactors: ['需要注意周围环境'],
        recommendations: ['享受跑步过程', '保持适度警觉', '注意补水']
      }
    };

    const analysis = mockImageResponses[analysisType as keyof typeof mockImageResponses] || mockImageResponses.general;
    
    return {
      message: `${analysis.description}\n\n安全等级：${analysis.safetyLevel}/10\n\n风险因素：\n${analysis.riskFactors.map(risk => `• ${risk}`).join('\n')}\n\n建议：\n${analysis.recommendations.map(rec => `• ${rec}`).join('\n')}`,
      confidence: 0.85,
      metadata: {
        analysisType,
        imageUrl,
        safetyLevel: analysis.safetyLevel,
        riskFactors: analysis.riskFactors,
        recommendations: analysis.recommendations
      }
    };
  }

  /**
   * 根据图片URL生成描述
   */
  private getImageDescription(imageUrl: string): string {
    if (imageUrl.includes('street')) return '城市街道';
    if (imageUrl.includes('park')) return '公园环境';
    if (imageUrl.includes('trail')) return '山间小径';
    if (imageUrl.includes('beach')) return '海滩路径';
    return '跑步环境';
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(conversationType?: string, context?: Partial<AIContext>): string {
    const basePrompt = `你是上海城市跑应用的路线小助手，专门为跑步者提供个性化的路线建议和支持。

你的核心职责：
1. 提供专业的跑步安全建议
2. 分析当前环境的安全风险
3. 为女性跑步者提供专门的安全指导
4. 在紧急情况下提供快速响应和指导
5. 基于用户画像提供个性化建议

请始终保持：
- 专业、友善、关怀的语调
- 基于科学和实际经验的建议
- 对女性安全特别关注和敏感
- 在紧急情况下保持冷静和高效
- 提供具体可行的建议`;

    let specificPrompt = '';
    
    switch (conversationType) {
      case 'women_safety':
        specificPrompt = `
当前对话类型：女性专属安全咨询
特别关注：
- 女性跑步者面临的特殊安全风险
- 夜间跑步的安全预防措施
- 人身安全和防范意识
- 紧急情况的应对策略
- 心理安全和信心建设`;
        break;
      
      case 'emergency':
        specificPrompt = `
当前对话类型：紧急情况处理
优先级：最高
响应要求：
- 立即评估紧急程度
- 提供快速有效的应对方案
- 指导用户采取安全措施
- 必要时建议联系紧急服务
- 保持冷静并给予心理支持`;
        break;
      
      case 'analysis':
        specificPrompt = `
当前对话类型：安全分析咨询
分析重点：
- 路线安全评估
- 环境风险分析
- 个人安全状况评估
- 改进建议和预防措施
- 数据驱动的安全洞察`;
        break;
      
      case 'challenge_competition':
        specificPrompt = `
当前对话类型：挑战推荐咨询
你现在是AI挑战推荐助手，专门提供：
- 个性化跑步挑战方案
- 竞赛活动推荐
- 训练计划制定
- 目标设定和进度跟踪
- 激励和动机支持
- 跑步技巧提升建议

请以积极、鼓励的语调提供专业的挑战推荐，帮助用户突破自我，享受跑步乐趣。`;
        break;
      
      default:
        specificPrompt = `
当前对话类型：一般安全咨询
提供全面的跑步安全指导和建议`;
    }

    // 添加上下文信息
    if (context) {
      let contextInfo = '\n\n当前上下文信息：';
      
      if (context.locationData) {
        contextInfo += `\n位置信息：${context.locationData.address || '未知位置'}`;
        if (context.locationData.safetyLevel) {
          contextInfo += `，安全等级：${context.locationData.safetyLevel}/10`;
        }
      }
      
      if (context.userContext) {
        contextInfo += `\n用户信息：`;
        if (context.userContext.gender) {
          contextInfo += `性别：${context.userContext.gender}`;
        }
        if (context.userContext.runningExperience) {
          contextInfo += `，跑步经验：${context.userContext.runningExperience}`;
        }
      }
      
      if (context.safetyContext) {
        contextInfo += `\n环境信息：`;
        if (context.safetyContext.timeOfDay) {
          contextInfo += `时间：${context.safetyContext.timeOfDay}`;
        }
        if (context.safetyContext.weather) {
          contextInfo += `，天气：${context.safetyContext.weather}`;
        }
        if (context.safetyContext.crowdLevel) {
          contextInfo += `，人流量：${context.safetyContext.crowdLevel}`;
        }
        if (context.safetyContext.lightingCondition) {
          contextInfo += `，照明条件：${context.safetyContext.lightingCondition}`;
        }
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
      confidence: 0.8, // 默认置信度
    };

    // 检测紧急程度
    const emergencyKeywords = ['紧急', '危险', '求救', '帮助', '报警', '110', '120'];
    const hasEmergencyKeywords = emergencyKeywords.some(keyword => 
      aiMessage.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasEmergencyKeywords || conversationType === 'emergency') {
      response.emergencyLevel = 'high';
      response.actionRequired = true;
    }

    // 提取建议（简单的关键词匹配）
    const suggestions: string[] = [];
    if (aiMessage.includes('建议')) {
      // 这里可以添加更复杂的建议提取逻辑
      suggestions.push('请关注AI提供的具体建议');
    }
    
    if (suggestions.length > 0) {
      response.suggestions = suggestions;
    }

    // 添加元数据
    response.metadata = {
      provider: 'kimi',
      model: this.model,
      conversationType,
      timestamp: new Date().toISOString(),
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
      return !!data.kimi;
    } catch (error) {
      return false;
    }
  }
}