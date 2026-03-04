import { KimiClient } from './kimiClient';
import type { AIImageAnalysisRequest, AIImageAnalysisResponse } from '../../types/ai';

export class ImageAnalysisService {
  private static instance: ImageAnalysisService;
  private kimiClient: KimiClient;

  constructor() {
    this.kimiClient = new KimiClient();
  }

  static getInstance(): ImageAnalysisService {
    if (!ImageAnalysisService.instance) {
      ImageAnalysisService.instance = new ImageAnalysisService();
    }
    return ImageAnalysisService.instance;
  }

  /**
   * 分析图片内容
   */
  async analyzeImage(request: AIImageAnalysisRequest): Promise<AIImageAnalysisResponse> {
    try {
      // 构建分析提示词
      const systemPrompt = this.buildAnalysisPrompt(request.analysisType || 'general');
      const userPrompt = this.buildUserPrompt(request);

      console.log('🔍 开始图片分析:', {
        imageUrl: request.imageUrl,
        analysisType: request.analysisType,
        hasContext: !!request.context,
        hasLocation: !!request.location
      });

      // 发送到KIMI API进行图像识别
      // 注意：KIMI API目前主要支持文本，这里通过URL描述来模拟图像识别
      // 实际项目中需要集成支持图像识别的API，如百度AI、腾讯云等
      const enhancedMessage = `${systemPrompt}\n\n${userPrompt}`;
      
      const response = await this.kimiClient.sendMessage({
        message: enhancedMessage,
        context: {
          locationData: request.location ? {
            latitude: request.latitude,
            longitude: request.longitude
          } : undefined,
          analysisType: request.analysisType,
          imageUrl: request.imageUrl // 添加图片URL到上下文
        },
        conversationType: request.analysisType || 'general'
      });

      console.log('✅ KIMI API响应:', {
        messageLength: response.message.length,
        confidence: response.confidence,
        hasMetadata: !!response.metadata
      });

      // 解析AI响应
      const analysis = this.parseAnalysisResponse(response.message);

      return {
        description: analysis.description,
        safetyLevel: analysis.safetyLevel,
        riskFactors: analysis.riskFactors,
        recommendations: analysis.recommendations,
        confidence: response.confidence,
        metadata: {
          imageUrl: request.imageUrl,
          analysisType: request.analysisType,
          originalResponse: response.message,
          kimiResponse: response
        }
      };
    } catch (error) {
      console.error('❌ 图片分析失败:', error);
      throw new Error(`图片分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 构建系统提示词
   */
  private buildAnalysisPrompt(analysisType: string): string {
    const prompts = {
      safety: `你是一个专业的跑步安全分析专家。请分析图片中的环境安全状况，包括：
1. 整体安全等级评分（1-10分，10分最安全）
2. 潜在风险因素识别
3. 具体的安全建议
4. 适合跑步的程度评估

请基于图片内容提供详细的安全分析。`,

      route: `你是一个专业的跑步路线规划专家。请分析图片中的跑步路线：
1. 路线质量评估
2. 路面状况分析
3. 适合跑步的程度
4. 路线安全建议
5. 推荐的使用时间

请提供专业的路线分析建议。`,

      emergency: `你是一个紧急安全响应专家。请分析图片中是否存在紧急情况：
1. 是否有明显的危险或紧急情况
2. 紧急程度评估
3. 需要采取的紧急措施
4. 是否需要立即求助

请快速识别并响应可能的紧急情况。`,

      general: `你是一个智能助手，请分析图片内容并提供有用的信息：
1. 图片的主要内容描述
2. 相关的有用信息
3. 针对跑步场景的建议

请提供准确和有用的分析。`
    };

    return prompts[analysisType as keyof typeof prompts] || prompts.general;
  }

  /**
   * 构建用户提示词
   */
  private buildUserPrompt(request: AIImageAnalysisRequest): string {
    let prompt = `请分析这张图片：${request.imageUrl}`;
    
    if (request.context) {
      prompt += `\n\n上下文信息：${request.context}`;
    }

    if (request.location) {
      prompt += `\n\n位置信息：纬度 ${request.location.latitude}, 经度 ${request.location.longitude}`;
    }

    prompt += `\n\n请提供详细的分析结果，包括安全等级、风险因素和建议。`;

    return prompt;
  }

  /**
   * 解析AI响应
   */
  private parseAnalysisResponse(message: string): {
    description: string;
    safetyLevel?: number;
    riskFactors: string[];
    recommendations: string[];
  } {
    // 这里需要更复杂的解析逻辑
    // 暂时使用简单的文本解析
    const lines = message.split('\n').filter(line => line.trim());
    
    const result = {
      description: '',
      safetyLevel: undefined as number | undefined,
      riskFactors: [] as string[],
      recommendations: [] as string[]
    };

    // 提取安全等级
    const safetyMatch = message.match(/安全等级[:：]\s*(\d+)/);
    if (safetyMatch) {
      result.safetyLevel = parseInt(safetyMatch[1]);
    }

    // 提取风险因素
    const riskSection = message.match(/风险因素[:：](.*?)(?:\n\n|$)/s);
    if (riskSection) {
      result.riskFactors = riskSection[1]
        .split('\n')
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0);
    }

    // 提取建议
    const recommendationSection = message.match(/建议[:：](.*?)(?:\n\n|$)/s);
    if (recommendationSection) {
      result.recommendations = recommendationSection[1]
        .split('\n')
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0);
    }

    // 设置描述
    result.description = lines[0] || message.substring(0, 200);

    return result;
  }

  /**
   * 批量分析多张图片
   */
  async analyzeMultipleImages(
    requests: AIImageAnalysisRequest[]
  ): Promise<AIImageAnalysisResponse[]> {
    const analysisPromises = requests.map(request => 
      this.analyzeImage(request)
    );

    return await Promise.all(analysisPromises);
  }

  /**
   * 快速安全检查（用于紧急情况）
   */
  async quickSafetyCheck(imageUrl: string): Promise<{
    isSafe: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    immediateActions: string[];
  }> {
    try {
      const analysis = await this.analyzeImage({
        imageUrl,
        analysisType: 'emergency'
      });

      const riskLevel = analysis.safetyLevel ? 
        (analysis.safetyLevel >= 7 ? 'low' : 
         analysis.safetyLevel >= 4 ? 'medium' : 
         analysis.safetyLevel >= 2 ? 'high' : 'critical') : 'medium';

      return {
        isSafe: riskLevel === 'low',
        riskLevel,
        immediateActions: analysis.recommendations || []
      };
    } catch (error) {
      console.error('快速安全检查失败:', error);
      return {
        isSafe: false,
        riskLevel: 'medium',
        immediateActions: ['无法分析图片，请谨慎评估环境安全']
      };
    }
  }
}

export const imageAnalysisService = ImageAnalysisService.getInstance();