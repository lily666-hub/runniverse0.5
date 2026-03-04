// AI功能测试运行器
import { aiService } from '../services/ai';

export interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
  duration?: number;
}

export class AITestRunner {
  private results: TestResult[] = [];
  private onUpdate?: (results: TestResult[]) => void;

  constructor(onUpdate?: (results: TestResult[]) => void) {
    this.onUpdate = onUpdate;
  }

  private updateResult(name: string, status: TestResult['status'], message: string, details?: any, duration?: number) {
    const existingIndex = this.results.findIndex(r => r.name === name);
    const result: TestResult = { name, status, message, details, duration };
    
    if (existingIndex >= 0) {
      this.results[existingIndex] = result;
    } else {
      this.results.push(result);
    }
    
    this.onUpdate?.(this.results);
  }

  async runAllTests(userId: string): Promise<TestResult[]> {
    this.results = [];
    
    const tests = [
      { name: 'AI服务初始化', test: () => this.testServiceInitialization() },
      { name: 'API连接状态', test: () => this.testAPIConnections() },
      { name: 'KIMI API连接', test: () => this.testKimiConnection() },
      { name: 'AI聊天功能', test: () => this.testChatFunction(userId) },
      { name: '安全顾问智能体', test: () => this.testSafetyAgent(userId) },
      { name: '女性安全顾问', test: () => this.testWomenSafetyAgent(userId) },
      { name: '路线推荐智能体', test: () => this.testRouteAgent(userId) },
      { name: '紧急响应功能', test: () => this.testEmergencyResponse(userId) },
    ];

    for (const { name, test } of tests) {
      this.updateResult(name, 'pending', '测试中...');
      
      const startTime = performance.now();
      try {
        const result = await test();
        const duration = Math.round(performance.now() - startTime);
        this.updateResult(name, 'success', '测试通过', result, duration);
      } catch (error) {
        const duration = Math.round(performance.now() - startTime);
        const message = error instanceof Error ? error.message : '测试失败';
        this.updateResult(name, 'error', message, error, duration);
      }
      
      // 等待一下再进行下一个测试
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return this.results;
  }

  private async testServiceInitialization() {
    // 测试AI服务是否正确初始化
    const status = await aiService.getProviderStatus();
    return { status, message: 'AI服务初始化成功' };
  }

  private async testAPIConnections() {
    // 测试API连接状态
    const connections = await aiService.testConnections();
    return { connections, message: `连接状态: ${JSON.stringify(connections)}` };
  }

  private async testKimiConnection() {
    // 专门测试KIMI API连接
    const connections = await aiService.testConnections();
    if (!connections.kimi) {
      throw new Error('KIMI API连接失败 - 请检查API密钥配置');
    }
    return { kimi: connections.kimi, message: 'KIMI API连接正常' };
  }

  private async testChatFunction(userId: string) {
    // 测试基本聊天功能
    const response = await aiService.sendMessage(
      userId,
      '你好，这是一个测试消息，请简短回复。',
      undefined,
      { userContext: { userType: 'test' } },
      'kimi',
      'general'
    );
    
    if (!response.response.message) {
      throw new Error('AI没有返回有效响应');
    }
    
    return {
      message: response.response.message,
      conversationId: response.conversation.id,
      confidence: response.response.confidence
    };
  }

  private async testSafetyAgent(userId: string) {
    // 测试安全顾问智能体
    const response = await aiService.sendMessage(
      userId,
      '我想在晚上跑步，请给我一些安全建议。',
      undefined,
      { 
        safetyContext: { 
          timeOfDay: 'evening',
          weather: 'clear',
          crowdLevel: 'low'
        }
      },
      'kimi',
      'safety'
    );
    
    if (!response.response.message) {
      throw new Error('安全顾问没有返回有效响应');
    }
    
    return {
      message: response.response.message,
      confidence: response.response.confidence,
      emergencyLevel: response.response.emergencyLevel
    };
  }

  private async testWomenSafetyAgent(userId: string) {
    // 测试女性安全顾问
    const response = await aiService.sendMessage(
      userId,
      '作为女性跑步者，我需要什么特别的安全建议？',
      undefined,
      { 
        userContext: { gender: 'female' },
        safetyContext: { timeOfDay: 'night' }
      },
      'kimi',
      'women_safety'
    );
    
    if (!response.response.message) {
      throw new Error('女性安全顾问没有返回有效响应');
    }
    
    return {
      message: response.response.message,
      confidence: response.response.confidence,
      emergencyLevel: response.response.emergencyLevel
    };
  }

  private async testRouteAgent(userId: string) {
    // 测试路线推荐智能体
    const response = await aiService.sendMessage(
      userId,
      '请推荐一条适合晨跑的5公里路线。',
      undefined,
      { 
        userLocation: {
          latitude: 31.2304,
          longitude: 121.4737,
          address: '上海市黄浦区'
        }
      },
      'kimi',
      'route_recommendation'
    );
    
    if (!response.response.message) {
      throw new Error('路线推荐智能体没有返回有效响应');
    }
    
    return {
      message: response.response.message,
      confidence: response.response.confidence
    };
  }

  private async testEmergencyResponse(userId: string) {
    // 测试紧急响应功能
    const alert = await aiService.handleEmergency(
      userId,
      {
        latitude: 31.2304,
        longitude: 121.4737,
        address: '上海市黄浦区人民广场'
      },
      '测试紧急情况 - 这是一个测试',
      'manual'
    );
    
    if (!alert.id) {
      throw new Error('紧急响应功能没有返回有效警报');
    }
    
    return {
      alertId: alert.id,
      status: alert.status,
      timestamp: alert.timestamp
    };
  }

  getResults(): TestResult[] {
    return this.results;
  }

  getSuccessCount(): number {
    return this.results.filter(r => r.status === 'success').length;
  }

  getErrorCount(): number {
    return this.results.filter(r => r.status === 'error').length;
  }

  getTotalDuration(): number {
    return this.results.reduce((total, r) => total + (r.duration || 0), 0);
  }
}

export default AITestRunner;