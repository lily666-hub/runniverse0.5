// API连接测试工具
import { aiService } from '../services/ai';

export interface ConnectionTestResult {
  provider: string;
  status: 'connected' | 'disconnected' | 'error';
  responseTime?: number;
  error?: string;
  details?: any;
}

export class APIConnectionTester {
  async testAllConnections(): Promise<ConnectionTestResult[]> {
    const results: ConnectionTestResult[] = [];

    // 测试AI服务连接
    try {
      const startTime = performance.now();
      const connections = await aiService.testConnections();
      const responseTime = Math.round(performance.now() - startTime);

      // 测试KIMI连接
      results.push({
        provider: 'KIMI',
        status: connections.kimi ? 'connected' : 'disconnected',
        responseTime,
        details: { hasApiKey: !!import.meta.env.VITE_KIMI_API_KEY }
      });

      // 测试DeepSeek连接（如果启用）
      if (connections.deepseek !== undefined) {
        results.push({
          provider: 'DeepSeek',
          status: connections.deepseek ? 'connected' : 'disconnected',
          responseTime,
          details: { hasApiKey: !!import.meta.env.VITE_DEEPSEEK_API_KEY }
        });
      }
    } catch (error) {
      results.push({
        provider: 'AI Service',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      });
    }

    return results;
  }

  async testProviderStatus(): Promise<any> {
    try {
      return await aiService.getProviderStatus();
    } catch (error) {
      console.error('Failed to get provider status:', error);
      return null;
    }
  }

  async testBasicChat(userId: string): Promise<ConnectionTestResult> {
    try {
      const startTime = performance.now();
      const response = await aiService.sendMessage(
        userId,
        '测试连接 - 请简短回复"连接正常"',
        undefined,
        { userContext: { userType: 'test' } },
        'kimi',
        'general'
      );
      const responseTime = Math.round(performance.now() - startTime);

      return {
        provider: 'AI Chat',
        status: response.response.message ? 'connected' : 'disconnected',
        responseTime,
        details: {
          message: response.response.message,
          confidence: response.response.confidence,
          conversationId: response.conversation.id
        }
      };
    } catch (error) {
      return {
        provider: 'AI Chat',
        status: 'error',
        error: error instanceof Error ? error.message : 'Chat test failed',
        details: error
      };
    }
  }

  getEnvironmentInfo(): Record<string, any> {
    return {
      hasKimiKey: !!import.meta.env.VITE_KIMI_API_KEY,
      hasDeepSeekKey: !!import.meta.env.VITE_DEEPSEEK_API_KEY,
      kimiKeyLength: import.meta.env.VITE_KIMI_API_KEY?.length || 0,
      deepSeekKeyLength: import.meta.env.VITE_DEEPSEEK_API_KEY?.length || 0,
      environment: import.meta.env.MODE,
      baseUrl: window.location.origin
    };
  }

  async runFullTest(userId: string): Promise<{
    connections: ConnectionTestResult[];
    providerStatus: any;
    chatTest: ConnectionTestResult;
    environment: Record<string, any>;
    summary: {
      totalTests: number;
      passed: number;
      failed: number;
      errors: number;
    };
  }> {
    const connections = await this.testAllConnections();
    const providerStatus = await this.testProviderStatus();
    const chatTest = await this.testBasicChat(userId);
    const environment = this.getEnvironmentInfo();

    const allTests = [...connections, chatTest];
    const summary = {
      totalTests: allTests.length,
      passed: allTests.filter(t => t.status === 'connected').length,
      failed: allTests.filter(t => t.status === 'disconnected').length,
      errors: allTests.filter(t => t.status === 'error').length
    };

    return {
      connections,
      providerStatus,
      chatTest,
      environment,
      summary
    };
  }
}

export const apiConnectionTester = new APIConnectionTester();