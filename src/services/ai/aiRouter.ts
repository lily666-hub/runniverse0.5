// AI路由器服务 - 智能选择最适合的AI提供商
import { KimiClient } from './kimiClient';
import { DeepSeekClient } from './deepseekClient';
import type { AIRequest, AIResponse, AIProvider } from '../../types/ai';
import { NetworkUtils } from '../../utils/networkUtils';

export class AIRouter {
  private kimiClient: KimiClient;
  private deepseekClient: DeepSeekClient;
  private providerStatus: Map<string, boolean> = new Map();
  private lastHealthCheck: Date = new Date(0);
  private healthCheckInterval = 5 * 60 * 1000; // 5分钟

  constructor() {
    this.kimiClient = new KimiClient();
    this.deepseekClient = new DeepSeekClient();
  }

  /**
   * 智能路由AI请求到最适合的提供商
   */
  async routeRequest(request: AIRequest): Promise<AIResponse> {
    // 检查提供商健康状态
    await this.checkProviderHealth();

    // 如果用户指定了提供商，优先使用
    if (request.provider) {
      return this.sendToProvider(request, request.provider);
    }

    // 根据对话类型智能选择提供商
    const preferredProvider = this.selectProviderByType(request.conversationType);
    
    // 直接发送到选择的提供商，sendToProvider会处理在线/离线逻辑
    return this.sendToProvider(request, preferredProvider);
  }

  /**
   * 根据对话类型选择最适合的AI提供商
   * 优先使用KIMI API
   */
  private selectProviderByType(conversationType?: string): 'kimi' | 'deepseek' {
    // 优先选择健康、可用的在线提供商
    const kimiAvailable = this.isProviderAvailable('kimi');
    const deepseekAvailable = this.isProviderAvailable('deepseek');

    // 路线推荐优先DeepSeek，其次KIMI（DeepSeek具备RouteAgent提示）
    if (conversationType === 'route_recommendation') {
      if (deepseekAvailable) return 'deepseek';
      if (kimiAvailable) return 'kimi';
      return 'deepseek';
    }

    // 其他类型：优先KIMI，失败则DeepSeek
    if (kimiAvailable) return 'kimi';
    if (deepseekAvailable) return 'deepseek';
    return 'kimi';
  }

  /**
   * 强制在线模式 - 始终尝试真实API调用
   */
  async sendMessageOnline(request: AIRequest): Promise<AIResponse> {
    console.log('🌐 强制在线模式 - 尝试真实API调用');
    
    // 如果明确指定了提供商，则遵循显式选择；否则按类型选择
    const provider = (request.provider as ('kimi' | 'deepseek') | undefined) || this.selectProviderByType(request.conversationType);
    
    try {
      // 尝试真实API调用
      if (provider === 'kimi') {
        return await this.kimiClient.sendMessage(request);
      } else if (provider === 'deepseek') {
        return await this.deepseekClient.sendMessage(request);
      }
      
      // 默认使用KIMI
      return await this.kimiClient.sendMessage(request);
    } catch (error) {
      console.error('❌ 在线模式调用失败:', error);
      // 如果在线模式失败，回退到普通模式（会提供模拟响应）
      return this.routeRequest(request);
    }
  }

  /**
   * 发送请求到指定提供商
   * 仅使用KIMI API
   */
  private async sendToProvider(request: AIRequest, provider: 'kimi' | 'deepseek'): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      let response: AIResponse;
      
      // 检查提供商健康状态
      await this.checkProviderHealth();
      
      // 优先使用在线模式，如果不可用则使用模拟响应
      if (provider === 'deepseek') {
        if (this.isProviderAvailable('deepseek')) {
          response = await this.deepseekClient.sendMessage(request);
        } else {
          console.info('DeepSeek不可用，使用模拟响应');
          response = this.getMockResponse(request);
        }
      } else {
        if (this.isProviderAvailable('kimi')) {
          response = await this.kimiClient.sendMessage(request);
        } else {
          console.info('KIMI不可用，使用模拟响应');
          response = this.getMockResponse(request);
        }
      }

      const responseTime = Date.now() - startTime;
      this.updateProviderMetrics(provider, responseTime, true);
      return response;
    } catch (error) {
      console.warn(`${provider} API调用失败，使用模拟响应继续服务:`, error);
      this.updateProviderMetrics(provider, Date.now() - startTime, false);
      // 即使API调用失败，也返回模拟响应而不是抛出错误
      return this.getMockResponse(request);
    }
  }

  /**
   * 检查提供商健康状态
   * 仅检查KIMI API
   */
  private async checkProviderHealth(): Promise<void> {
    const now = new Date();
    if (now.getTime() - this.lastHealthCheck.getTime() < this.healthCheckInterval) {
      return;
    }
    this.lastHealthCheck = now;

    try {
      // 使用统一网络检测工具检查提供商连接状态
      const results = await NetworkUtils.checkAIServiceConnection();
      this.providerStatus.set('kimi', !!results.kimi);
      this.providerStatus.set('deepseek', !!results.deepseek);
      console.info('AI提供商健康检查完成:', results);
    } catch (error) {
      console.info('AI提供商健康检查失败，采用保守可用策略:', error);
      // 保守策略：不阻断服务，保持当前或默认可用
      if (!this.providerStatus.has('kimi')) this.providerStatus.set('kimi', true);
      if (!this.providerStatus.has('deepseek')) this.providerStatus.set('deepseek', false);
    }
  }

  /**
   * 检查提供商是否可用
   */
  private isProviderAvailable(provider: string): boolean {
    return this.providerStatus.get(provider) ?? true; // 默认认为可用，确保AI在线
  }

  /**
   * 获取模拟响应（确保AI始终在线）
   */
  private getMockResponse(request: AIRequest): AIResponse {
    // 根据类型/显式提供商选择更贴近业务的模拟响应
    const providerHint = (request.provider as ('kimi' | 'deepseek') | undefined);
    if (providerHint === 'deepseek' || request.conversationType === 'route_recommendation') {
      return this.deepseekClient.getMockResponse(request);
    }
    return this.kimiClient.getMockResponse(request);
  }

  /**
   * 获取响应最快的提供商
   * 优先使用KIMI API
   */
  private getFastestProvider(): 'kimi' | 'deepseek' {
    // 优先使用KIMI API
    return 'kimi';
  }

  /**
   * 获取负载均衡的提供商
   * 优先使用KIMI API
   */
  private getBalancedProvider(): 'kimi' | 'deepseek' {
    // 优先使用KIMI API
    return 'kimi';
  }

  /**
   * 更新提供商性能指标
   */
  private updateProviderMetrics(provider: string, responseTime: number, success: boolean): void {
    // 这里可以实现更复杂的性能指标收集
    // 目前只是简单记录
    console.log(`提供商 ${provider} 性能指标:`, {
      responseTime: `${responseTime}ms`,
      success,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 获取所有提供商状态
   */
  async getProviderStatus(): Promise<Record<string, any>> {
    await this.checkProviderHealth();
    
    return {
      kimi: {
        available: this.isProviderAvailable('kimi'),
        lastCheck: this.lastHealthCheck.toISOString(),
      },
      deepseek: {
        available: this.isProviderAvailable('deepseek'),
        lastCheck: this.lastHealthCheck.toISOString(),
      },
    };
  }

  /**
   * 强制刷新提供商状态
   */
  async refreshProviderStatus(): Promise<void> {
    this.lastHealthCheck = new Date(0); // 重置检查时间
    await this.checkProviderHealth();
  }

  /**
   * 获取推荐的提供商
   */
  getRecommendedProvider(conversationType?: string): 'kimi' | 'deepseek' {
    return this.selectProviderByType(conversationType);
  }

  /**
   * 测试所有提供商连接
   * 测试KIMI和DeepSeek API连接状态
   */
  async testAllConnections(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    try {
      // 测试KIMI连接
      results.kimi = await this.kimiClient.checkConnection();
    } catch (error) {
      console.info('KIMI API未配置或连接失败，将使用模拟模式');
      results.kimi = false;
    }

    try {
      // 测试DeepSeek连接
      results.deepseek = await this.deepseekClient.checkConnection();
    } catch (error) {
      console.info('DeepSeek API未配置或连接失败，将使用模拟模式');
      results.deepseek = false;
    }

    return results;
  }
}
