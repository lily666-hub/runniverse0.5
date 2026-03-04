import { supabase } from '../lib/supabase';
import { KimiClient } from './ai/kimiClient';
import { userPreferenceService } from './userPreferenceService';
import type { 
  RecommendationRequest,
  RecommendationResponse,
  EnhancedRouteRecommendation,
  RouteRecommendation,
  RecommendationContext,
  AIAnalysis,
  RecommendationFeedback,
  RecommendationStats,
  RunningPreferences
} from '../types/routeRecommendation';
import type { AIRequest } from '../types/ai';

/**
 * AI智能路线推荐服务
 * 集成KIMI AI API，提供个性化路线推荐
 */
export class RouteRecommendationService {
  private kimiClient: KimiClient;

  constructor() {
    this.kimiClient = new KimiClient();
  }

  /**
   * 获取AI智能路线推荐
   */
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    try {
      console.log('🤖 开始AI路线推荐:', request);

      // 1. 获取用户偏好
      const userPreferences = await userPreferenceService.getRunningPreferences(request.userId);
      
      // 2. 获取用户历史数据
      const userHistory = await this.getUserRunningHistory(request.userId);
      
      // 3. 获取可用路线
      const availableRoutes = await this.getAvailableRoutes(request);
      
      // 4. 构建推荐上下文
      const context = await this.buildRecommendationContext(request, userPreferences);
      
      // 5. 调用AI进行智能分析和推荐
      const aiRecommendations = await this.getAIRecommendations(
        request,
        userPreferences,
        userHistory,
        availableRoutes,
        context
      );

      // 6. 保存推荐记录
      await this.saveRecommendations(request.userId, aiRecommendations);

      const response: RecommendationResponse = {
        recommendations: aiRecommendations,
        reasoning: this.generateRecommendationReasoning(aiRecommendations),
        confidence: this.calculateOverallConfidence(aiRecommendations),
        metadata: {
          totalRoutes: availableRoutes.length,
          processingTime: Date.now(),
          aiModel: 'moonshot-v1-8k',
          version: '1.0.0',
          factors: {
            userHistory: 0.3,
            preferences: 0.4,
            context: 0.2,
            community: 0.1
          }
        }
      };

      console.log('✅ AI路线推荐完成:', response);
      return response;
    } catch (error) {
      console.error('❌ AI路线推荐失败:', error);
      throw error;
    }
  }

  /**
   * 调用KIMI AI进行智能推荐分析
   */
  private async getAIRecommendations(
    request: RecommendationRequest,
    userPreferences: RunningPreferences | null,
    userHistory: any[],
    availableRoutes: any[],
    context: RecommendationContext
  ): Promise<EnhancedRouteRecommendation[]> {
    try {
      // 构建AI请求
      const aiRequest: AIRequest = {
        message: this.buildRecommendationPrompt(request, userPreferences, userHistory, availableRoutes, context),
        conversationType: 'route_recommendation',
        context: {
          userPreferences,
          userHistory,
          availableRoutes: availableRoutes.slice(0, 10) // 限制路线数量
        }
      };

      console.log('🧠 发送AI推荐请求:', {
        messageLength: aiRequest.message.length,
        routeCount: availableRoutes.length,
        hasPreferences: !!userPreferences,
        historyCount: userHistory.length
      });

      // 调用KIMI AI
      const aiResponse = await this.kimiClient.sendMessage(aiRequest);
      
      console.log('🎯 AI推荐响应:', aiResponse);

      // 解析AI响应并生成推荐
      return this.parseAIRecommendationResponse(aiResponse, availableRoutes, context);
    } catch (error) {
      console.error('❌ AI推荐分析失败:', error);
      // 如果AI调用失败，使用基础推荐算法
      return this.getFallbackRecommendations(request, userPreferences, availableRoutes, context);
    }
  }

  /**
   * 构建AI推荐提示词
   */
  private buildRecommendationPrompt(
    request: RecommendationRequest,
    userPreferences: RunningPreferences | null,
    userHistory: any[],
    availableRoutes: any[],
    context: RecommendationContext
  ): string {
    const prompt = `
作为上海城市跑应用的AI路线推荐专家，请基于以下信息为用户推荐最适合的跑步路线：

## 用户信息
- 用户ID: ${request.userId}
- 推荐类型: ${request.recommendationType || 'daily'}
- 推荐数量: ${request.limit || 5}

## 用户偏好
${userPreferences ? `
- 难度偏好: ${userPreferences.difficulty}
- 距离偏好: ${userPreferences.preferredDistance}
- 时间偏好: ${userPreferences.timeOfDay}
- 路线类型: ${userPreferences.routeTypes.join(', ')}
- 避免交通: ${userPreferences.avoidTraffic ? '是' : '否'}
- 天气偏好: ${userPreferences.preferredWeather.join(', ')}
- 最大爬升: ${userPreferences.maxElevation}米
` : '暂无用户偏好数据'}

## 跑步历史
${userHistory.length > 0 ? `
- 历史跑步次数: ${userHistory.length}
- 平均距离: ${(userHistory.reduce((sum, h) => sum + h.distance, 0) / userHistory.length).toFixed(1)}km
- 平均时长: ${(userHistory.reduce((sum, h) => sum + h.duration_minutes, 0) / userHistory.length).toFixed(0)}分钟
- 最近活跃度: ${userHistory.filter(h => new Date(h.completed_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}次/周
` : '暂无跑步历史'}

## 当前环境
- 时间: ${context.timeOfDay}
- 季节: ${context.season}
${context.weather ? `
- 天气: ${context.weather.condition}
- 温度: ${context.weather.temperature}°C
- 湿度: ${context.weather.humidity}%
- 风速: ${context.weather.windSpeed}km/h
- 空气质量: ${context.weather.airQuality}
` : ''}
${context.userLocation ? `
- 用户位置: ${context.userLocation.district}
` : ''}

## 可选路线 (前10条)
${availableRoutes.slice(0, 10).map((route, index) => `
${index + 1}. ${route.name}
   - 距离: ${route.distance}km
   - 难度: ${route.difficulty}
   - 评分: ${route.rating}/5 (${route.reviews}条评价)
   - 位置: ${route.location}
   - 爬升: ${route.elevation}m
   - 标签: ${route.tags.join(', ')}
   - 描述: ${route.description}
`).join('')}

## 推荐要求
请从以上路线中选择${request.limit || 5}条最适合的路线，并为每条路线提供：

1. **适合度评分** (0-100): 基于用户偏好和当前环境的匹配度
2. **个性化推荐理由**: 为什么推荐这条路线给该用户
3. **风险评估**: 安全风险等级和注意事项
4. **个性化建议**: 针对用户的具体建议
5. **预期表现**: 预估完成时间、难度感受、卡路里消耗

请以JSON格式返回推荐结果，格式如下：
{
  "recommendations": [
    {
      "routeId": "路线ID",
      "suitabilityScore": 85,
      "personalizedReason": "基于您的偏好...",
      "confidenceScore": 0.9,
      "riskAssessment": {
        "level": "low",
        "factors": ["交通较少", "光线充足"]
      },
      "personalizedTips": ["建议携带水壶", "注意路面湿滑"],
      "estimatedPerformance": {
        "expectedTime": "25-30分钟",
        "difficultyRating": 3,
        "caloriesBurn": 280
      }
    }
  ],
  "overallReasoning": "基于您的跑步历史和偏好分析..."
}

请确保推荐的路线多样化，兼顾安全性、适合度和挑战性。
`;

    return prompt;
  }

  /**
   * 解析AI推荐响应
   */
  private parseAIRecommendationResponse(
    aiResponse: any,
    availableRoutes: any[],
    context: RecommendationContext
  ): EnhancedRouteRecommendation[] {
    try {
      // 尝试解析JSON响应
      let parsedResponse;
      if (typeof aiResponse.message === 'string') {
        // 提取JSON部分
        const jsonMatch = aiResponse.message.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        }
      }

      if (!parsedResponse || !parsedResponse.recommendations) {
        console.warn('⚠️ AI响应格式不正确，使用备用解析');
        return this.parseTextRecommendationResponse(aiResponse.message, availableRoutes, context);
      }

      const recommendations: EnhancedRouteRecommendation[] = [];

      for (const rec of parsedResponse.recommendations) {
        const route = availableRoutes.find(r => r.id === rec.routeId);
        if (!route) continue;

        const recommendation: EnhancedRouteRecommendation = {
          id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: '', // 将在调用处设置
          routeId: route.id,
          recommendationType: 'ai_powered',
          confidenceScore: rec.confidenceScore || 0.8,
          reasoning: rec.personalizedReason || '基于AI分析推荐',
          context: context,
          aiAnalysis: {
            matchingFactors: rec.matchingFactors || [],
            riskAssessment: rec.riskAssessment || { level: 'medium', factors: [] },
            personalizedTips: rec.personalizedTips || [],
            estimatedPerformance: rec.estimatedPerformance
          },
          createdAt: new Date(),
          route: route,
          suitabilityScore: rec.suitabilityScore || 75,
          personalizedReason: rec.personalizedReason || '基于您的偏好推荐'
        };

        recommendations.push(recommendation);
      }

      console.log('✅ AI推荐解析成功:', recommendations.length);
      return recommendations;
    } catch (error) {
      console.error('❌ AI推荐解析失败:', error);
      return this.parseTextRecommendationResponse(aiResponse.message, availableRoutes, context);
    }
  }

  /**
   * 解析文本格式的AI推荐响应
   */
  private parseTextRecommendationResponse(
    responseText: string,
    availableRoutes: any[],
    context: RecommendationContext
  ): EnhancedRouteRecommendation[] {
    // 基于文本内容智能匹配路线
    const recommendations: EnhancedRouteRecommendation[] = [];
    
    // 简单的文本匹配逻辑
    const routeKeywords = availableRoutes.map(route => ({
      route,
      keywords: [route.name, route.location, ...route.tags].join(' ').toLowerCase()
    }));

    const responseTextLower = responseText.toLowerCase();
    
    for (const { route, keywords } of routeKeywords.slice(0, 5)) {
      const matchScore = this.calculateTextMatchScore(responseTextLower, keywords);
      
      if (matchScore > 0.1) {
        const recommendation: EnhancedRouteRecommendation = {
          id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: '',
          routeId: route.id,
          recommendationType: 'ai_powered',
          confidenceScore: Math.min(matchScore, 0.9),
          reasoning: '基于AI文本分析推荐',
          context: context,
          aiAnalysis: {
            matchingFactors: ['AI文本分析'],
            riskAssessment: { level: 'medium', factors: [] },
            personalizedTips: ['请根据实际情况调整'],
            estimatedPerformance: {
              expectedTime: `${Math.round(route.distance * 6)}-${Math.round(route.distance * 8)}分钟`,
              difficultyRating: route.difficulty === 'easy' ? 2 : route.difficulty === 'hard' ? 4 : 3,
              caloriesBurn: Math.round(route.distance * 60)
            }
          },
          createdAt: new Date(),
          route: route,
          suitabilityScore: Math.round(matchScore * 100),
          personalizedReason: '基于AI智能分析为您推荐'
        };

        recommendations.push(recommendation);
      }
    }

    return recommendations.slice(0, 5);
  }

  /**
   * 计算文本匹配分数
   */
  private calculateTextMatchScore(responseText: string, keywords: string): number {
    const keywordList = keywords.split(' ').filter(k => k.length > 1);
    let matchCount = 0;
    
    for (const keyword of keywordList) {
      if (responseText.includes(keyword)) {
        matchCount++;
      }
    }
    
    return keywordList.length > 0 ? matchCount / keywordList.length : 0;
  }

  /**
   * 备用推荐算法（当AI调用失败时使用）
   */
  private getFallbackRecommendations(
    request: RecommendationRequest,
    userPreferences: RunningPreferences | null,
    availableRoutes: any[],
    context: RecommendationContext
  ): EnhancedRouteRecommendation[] {
    console.log('🔄 使用备用推荐算法');

    const recommendations: EnhancedRouteRecommendation[] = [];
    const limit = request.limit || 5;

    // 基于用户偏好进行简单匹配
    const scoredRoutes = availableRoutes.map(route => {
      let score = 50; // 基础分数

      if (userPreferences) {
        // 难度匹配
        if (route.difficulty === userPreferences.difficulty) score += 20;
        
        // 距离匹配
        const routeDistance = route.distance;
        const preferredDistance = userPreferences.preferredDistance;
        if (this.isDistanceMatch(routeDistance, typeof preferredDistance === 'string' ? preferredDistance : `${preferredDistance.min}-${preferredDistance.max}km`)) score += 15;
        
        // 路线类型匹配
        const typeMatch = userPreferences.routeTypes.some(type => 
          route.tags.includes(type) || route.name.toLowerCase().includes(type)
        );
        if (typeMatch) score += 10;
        
        // 爬升高度匹配
        if (route.elevation <= userPreferences.maxElevation) score += 5;
      }

      // 评分和热度
      score += route.rating * 5;
      score += Math.min(route.reviews / 10, 10);

      return { route, score };
    });

    // 排序并选择前N个
    scoredRoutes.sort((a, b) => b.score - a.score);
    
    for (let i = 0; i < Math.min(limit, scoredRoutes.length); i++) {
      const { route, score } = scoredRoutes[i];
      
      const recommendation: EnhancedRouteRecommendation = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: request.userId,
        routeId: route.id,
        recommendationType: request.recommendationType || 'daily',
        confidenceScore: Math.min(score / 100, 0.9),
        reasoning: '基于用户偏好和路线特征的智能匹配',
        context: context,
        aiAnalysis: {
          matchingFactors: this.getMatchingFactors(route, userPreferences),
          riskAssessment: { level: 'medium', factors: ['请注意安全'] },
          personalizedTips: ['根据天气情况调整装备', '保持适当配速'],
          estimatedPerformance: {
            expectedTime: `${Math.round(route.distance * 6)}-${Math.round(route.distance * 8)}分钟`,
            difficultyRating: route.difficulty === 'easy' ? 2 : route.difficulty === 'hard' ? 4 : 3,
            caloriesBurn: Math.round(route.distance * 60)
          }
        },
        createdAt: new Date(),
        route: route,
        suitabilityScore: Math.round(score),
        personalizedReason: this.generatePersonalizedReason(route, userPreferences)
      };

      recommendations.push(recommendation);
    }

    return recommendations;
  }

  /**
   * 获取用户跑步历史
   */
  private async getUserRunningHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('running_history')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ 获取跑步历史失败:', error);
      return [];
    }
  }

  /**
   * 获取可用路线
   */
  private async getAvailableRoutes(request: RecommendationRequest): Promise<any[]> {
    // 这里应该从数据库获取路线，暂时使用模拟数据
    const mockRoutes = [
      {
        id: 'route_1',
        name: '外滩滨江步道',
        distance: 5.2,
        duration: '30-40分钟',
        difficulty: 'easy',
        rating: 4.8,
        reviews: 156,
        description: '沿黄浦江畔的经典跑步路线，风景优美，路面平坦',
        highlights: ['江景', '夜景', '平坦路面'],
        image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Shanghai%20Bund%20riverside%20running%20path%20at%20sunset&image_size=landscape_4_3',
        location: '黄浦区外滩',
        elevation: 10,
        popularity: 95,
        tags: ['waterfront', 'urban', 'scenic']
      },
      {
        id: 'route_2',
        name: '世纪公园环湖跑道',
        distance: 3.8,
        duration: '25-35分钟',
        difficulty: 'easy',
        rating: 4.6,
        reviews: 203,
        description: '公园内的专业跑道，环境优美，空气清新',
        highlights: ['湖景', '绿化', '专业跑道'],
        image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Century%20Park%20lake%20running%20track%20Shanghai&image_size=landscape_4_3',
        location: '浦东新区世纪公园',
        elevation: 15,
        popularity: 88,
        tags: ['park', 'lake', 'professional']
      },
      {
        id: 'route_3',
        name: '陆家嘴金融区晨跑',
        distance: 4.5,
        duration: '28-38分钟',
        difficulty: 'medium',
        rating: 4.4,
        reviews: 89,
        description: '穿梭在摩天大楼间的都市跑步体验',
        highlights: ['都市风光', '现代建筑', '挑战性'],
        image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Lujiazui%20financial%20district%20morning%20run%20Shanghai&image_size=landscape_4_3',
        location: '浦东新区陆家嘴',
        elevation: 25,
        popularity: 75,
        tags: ['urban', 'financial', 'modern']
      }
    ];

    // 应用过滤条件
    let filteredRoutes = mockRoutes;

    if (request.excludeRoutes && request.excludeRoutes.length > 0) {
      filteredRoutes = filteredRoutes.filter(route => !request.excludeRoutes!.includes(route.id));
    }

    return filteredRoutes;
  }

  /**
   * 构建推荐上下文
   */
  private async buildRecommendationContext(
    request: RecommendationRequest,
    userPreferences: RunningPreferences | null
  ): Promise<RecommendationContext> {
    const now = new Date();
    const hour = now.getHours();
    
    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
    else if (hour >= 22 || hour < 6) timeOfDay = 'night';

    const month = now.getMonth();
    let season = 'spring';
    if (month >= 5 && month <= 7) season = 'summer';
    else if (month >= 8 && month <= 10) season = 'autumn';
    else if (month >= 11 || month <= 1) season = 'winter';

    const context: RecommendationContext = {
      timeOfDay,
      season,
      weather: {
        condition: 'sunny',
        temperature: 22,
        humidity: 65,
        windSpeed: 8,
        airQuality: 'good'
      }
    };

    return context;
  }

  /**
   * 保存推荐记录
   */
  private async saveRecommendations(userId: string, recommendations: EnhancedRouteRecommendation[]): Promise<void> {
    try {
      const records = recommendations.map(rec => ({
        user_id: userId,
        route_id: rec.routeId,
        recommendation_type: rec.recommendationType,
        confidence_score: rec.confidenceScore,
        reasoning: rec.reasoning,
        context: rec.context,
        ai_analysis: rec.aiAnalysis,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('route_recommendations')
        .insert(records);

      if (error) throw error;
      console.log('✅ 推荐记录保存成功');
    } catch (error) {
      console.error('❌ 保存推荐记录失败:', error);
    }
  }

  /**
   * 提交推荐反馈
   */
  async submitFeedback(feedback: Omit<RecommendationFeedback, 'id' | 'createdAt'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('recommendation_feedback')
        .insert({
          recommendation_id: feedback.recommendationId,
          user_id: feedback.userId,
          rating: feedback.rating,
          feedback_text: feedback.feedbackText,
          is_used: feedback.isUsed,
          usage_data: feedback.usageData,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      console.log('✅ 反馈提交成功');
    } catch (error) {
      console.error('❌ 反馈提交失败:', error);
      throw error;
    }
  }

  /**
   * 获取推荐统计
   */
  async getRecommendationStats(userId: string): Promise<RecommendationStats> {
    try {
      // 获取推荐总数
      const { count: totalRecommendations } = await supabase
        .from('route_recommendations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // 获取使用的推荐数
      const { count: usedRecommendations } = await supabase
        .from('recommendation_feedback')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_used', true);

      // 获取平均评分
      const { data: feedbackData } = await supabase
        .from('recommendation_feedback')
        .select('rating')
        .eq('user_id', userId);

      const averageRating = feedbackData && feedbackData.length > 0
        ? feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length
        : 0;

      const stats: RecommendationStats = {
        totalRecommendations: totalRecommendations || 0,
        usedRecommendations: usedRecommendations || 0,
        averageRating,
        favoriteRouteTypes: ['park', 'waterfront'], // 简化实现
        improvementSuggestions: ['尝试更多样化的路线', '增加反馈频率'],
        accuracyTrend: [] // 简化实现
      };

      return stats;
    } catch (error) {
      console.error('❌ 获取推荐统计失败:', error);
      throw error;
    }
  }

  // 辅助方法
  private isDistanceMatch(routeDistance: number, preferredDistance: string): boolean {
    switch (preferredDistance) {
      case '3km以下':
        return routeDistance < 3;
      case '3-5km':
        return routeDistance >= 3 && routeDistance <= 5;
      case '5-10km':
        return routeDistance > 5 && routeDistance <= 10;
      case '10km以上':
        return routeDistance > 10;
      default:
        return true;
    }
  }

  private getMatchingFactors(route: any, userPreferences: RunningPreferences | null): string[] {
    const factors: string[] = [];
    
    if (userPreferences) {
      if (route.difficulty === userPreferences.difficulty) {
        factors.push('难度匹配');
      }
      
      if (userPreferences.routeTypes.some(type => route.tags.includes(type))) {
        factors.push('路线类型匹配');
      }
      
      if (route.elevation <= userPreferences.maxElevation) {
        factors.push('爬升高度适宜');
      }
    }
    
    if (route.rating >= 4.0) {
      factors.push('高评分路线');
    }
    
    return factors;
  }

  private generatePersonalizedReason(route: any, userPreferences: RunningPreferences | null): string {
    let reason = `推荐${route.name}，`;
    
    if (userPreferences) {
      if (route.difficulty === userPreferences.difficulty) {
        reason += `难度${route.difficulty}符合您的偏好，`;
      }
      
      if (userPreferences.routeTypes.some(type => route.tags.includes(type))) {
        reason += `路线类型匹配您的喜好，`;
      }
    }
    
    reason += `该路线评分${route.rating}/5，深受跑友喜爱。`;
    
    return reason;
  }

  private generateRecommendationReasoning(recommendations: EnhancedRouteRecommendation[]): string {
    if (recommendations.length === 0) {
      return '暂无合适的路线推荐';
    }
    
    const avgConfidence = recommendations.reduce((sum, rec) => sum + rec.confidenceScore, 0) / recommendations.length;
    const topRoute = recommendations[0];
    
    return `基于您的跑步偏好和历史数据，为您精选了${recommendations.length}条路线。推荐置信度${(avgConfidence * 100).toFixed(0)}%，其中${topRoute.route.name}最为适合，${topRoute.personalizedReason}`;
  }

  private calculateOverallConfidence(recommendations: EnhancedRouteRecommendation[]): number {
    if (recommendations.length === 0) return 0;
    
    return recommendations.reduce((sum, rec) => sum + rec.confidenceScore, 0) / recommendations.length;
  }
}

// 创建单例实例
export const routeRecommendationService = new RouteRecommendationService();