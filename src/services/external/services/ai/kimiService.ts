// KIMI服务包装器
import { KimiClient } from './kimiClient';
import type { AIRequest, AIResponse } from '../../../../types/ai';

/**
 * KIMI服务类 - 提供更高级的AI服务接口
 */
export class KimiService {
  private client: KimiClient;

  constructor() {
    this.client = new KimiClient();
  }

  /**
   * 发送消息到KIMI AI
   */
  async sendMessage(request: AIRequest): Promise<AIResponse> {
    return await this.client.sendMessage(request);
  }

  /**
   * 生成路线推荐
   */
  async generateRouteRecommendation(
    userProfile: any,
    preferences: any,
    context: any
  ): Promise<AIResponse> {
    const prompt = this.buildRoutePrompt(userProfile, preferences, context);
    
    const request: AIRequest = {
      message: prompt,
      conversationType: 'route_recommendation',
      context: {
        userProfile,
        preferences,
        ...context
      }
    };

    return await this.sendMessage(request);
  }

  /**
   * 构建路线推荐提示词
   */
  private buildRoutePrompt(userProfile: any, preferences: any, context: any): string {
    return `
作为一个专业的跑步教练，请根据以下信息为用户推荐最佳的跑步路线：

用户信息：
- 年龄：${userProfile.age}岁
- 体重：${userProfile.weight}kg
- 身高：${userProfile.height}cm
- 健身水平：${userProfile.fitnessLevel}
- 跑步经验：${userProfile.runningExperience}个月

路线偏好：
- 目标距离：${preferences.distance}公里
- 难度等级：${preferences.difficulty}
- 风景偏好：${preferences.scenery}
- 跑步时间：${preferences.timeOfDay}

请提供：
1. 路线建议和理由
2. 配速建议
3. 注意事项
4. 安全提醒

请以JSON格式返回，包含recommendation、paceAdvice、notes、safetyTips字段。
    `.trim();
  }

  /**
   * 分析路线安全性
   */
  async analyzeRouteSafety(routeData: any): Promise<AIResponse> {
    const prompt = `
请分析以下跑步路线的安全性：

路线信息：
${JSON.stringify(routeData, null, 2)}

请评估：
1. 路线安全等级（1-10分）
2. 潜在风险点
3. 安全建议
4. 最佳跑步时间段

请以JSON格式返回分析结果。
    `.trim();

    const request: AIRequest = {
      message: prompt,
      conversationType: 'safety',
      context: {
        availableRoutes: [routeData],
        currentRoute: routeData
      }
    };

    return await this.sendMessage(request);
  }

  /**
   * 检查服务可用性
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const testRequest: AIRequest = {
        message: '测试连接',
        conversationType: 'general'
      };
      
      await this.sendMessage(testRequest);
      return true;
    } catch (error) {
      console.warn('KIMI服务不可用:', error);
      return false;
    }
  }
}

// 导出单例实例
export const kimiService = new KimiService();
export default kimiService;