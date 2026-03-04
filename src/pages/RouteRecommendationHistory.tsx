import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Clock, Star, ThumbsUp, ThumbsDown, Filter, Search, Brain, TrendingUp, BarChart3 } from 'lucide-react';
import { routeRecommendationService } from '../services/routeRecommendationService';
import { useAuth } from '../hooks/useAuth';
import type { RouteRecommendation, RecommendationFeedback } from '../types/routeRecommendation';

interface RecommendationHistoryItem extends RouteRecommendation {
  route: {
    id: string;
    name: string;
    distance: number;
    difficulty: string;
    rating: number;
    description: string;
    highlights: string[];
    imageUrl: string;
  };
  suitabilityScore: number;
  personalizedReason: string;
  aiAnalysis: {
    matchingFactors: string[];
    weatherSuitability: number;
    crowdLevel: string;
    safetyScore: number;
    riskAssessment: {
      level: 'low' | 'medium' | 'high';
      factors: string[];
    };
    personalizedTips: string[];
  };
  feedback?: RecommendationFeedback & {
    isPositive: boolean;
  };
  usageData?: {
    clicked: boolean;
    navigated: boolean;
    completed: boolean;
    completionTime?: number;
  };
}

const RouteRecommendationHistory: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<RecommendationHistoryItem[]>([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState<RecommendationHistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'liked' | 'disliked' | 'used' | 'unused'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'suitability'>('date');
  const [stats, setStats] = useState({
    totalRecommendations: 0,
    likedCount: 0,
    dislikedCount: 0,
    usedCount: 0,
    averageSuitability: 0
  });

  useEffect(() => {
    loadRecommendationHistory();
  }, [user]);

  useEffect(() => {
    filterAndSortRecommendations();
  }, [recommendations, searchTerm, filterType, sortBy]);

  const loadRecommendationHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // 这里应该调用实际的API来获取推荐历史
      // 目前使用模拟数据
      const mockHistory: RecommendationHistoryItem[] = [
        {
          id: '1',
          userId: user.id,
          routeId: '1',
          recommendationType: 'ai_powered' as const,
          confidenceScore: 0.92,
          reasoning: '基于您的跑步偏好和历史数据推荐',
          context: {
            timeOfDay: 'evening',
            season: 'winter'
          },
          route: {
            id: '1',
            name: '外滩滨江步道',
            distance: 5.2,
            difficulty: '简单',
            rating: 4.8,
            description: '沿黄浦江的经典跑步路线',
            highlights: ['江景', '夜景', '历史建筑'],
            imageUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Shanghai%20Bund%20riverside%20running%20path%20at%20sunset&image_size=landscape_4_3'
          },
          suitabilityScore: 92,
          personalizedReason: '基于您对江景路线的偏好和中等强度训练需求',
          aiAnalysis: {
            matchingFactors: ['距离适中', '风景优美', '安全性高'],
            weatherSuitability: 85,
            crowdLevel: 'moderate',
            safetyScore: 95,
            riskAssessment: {
              level: 'low',
              factors: ['安全性高', '人流适中']
            },
            personalizedTips: ['建议在日落时分跑步，风景更美']
          },
          createdAt: new Date('2024-01-15T08:30:00Z'),
          feedback: {
            id: 'f1',
            recommendationId: '1',
            userId: user.id,
            isPositive: true,
            rating: 5,
            comment: '非常棒的推荐！风景很美',
            isUsed: true,
            usageData: {
              actualDistance: 5.2,
              actualDuration: 28,
              completionRate: 1.0,
              enjoymentLevel: 5
            },
            createdAt: new Date('2024-01-15T20:30:00Z')
          },
          usageData: {
            clicked: true,
            navigated: true,
            completed: true,
            completionTime: 28
          }
        },
        {
          id: '2',
          userId: user.id,
          routeId: '2',
          recommendationType: 'daily' as const,
          confidenceScore: 0.88,
          reasoning: '适合您的晨跑习惯',
          context: {
            timeOfDay: 'morning',
            season: 'winter'
          },
          route: {
            id: '2',
            name: '世纪公园环湖跑道',
            distance: 3.8,
            difficulty: '简单',
            rating: 4.6,
            description: '公园内的标准跑道，适合晨跑',
            highlights: ['湖景', '绿化', '空气清新'],
            imageUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Century%20Park%20Shanghai%20lake%20running%20track%20morning&image_size=landscape_4_3'
          },
          suitabilityScore: 88,
          personalizedReason: '适合您的晨跑习惯和偏好的公园环境',
          aiAnalysis: {
            matchingFactors: ['时间匹配', '环境偏好', '距离合适'],
            weatherSuitability: 90,
            crowdLevel: 'low',
            safetyScore: 98,
            riskAssessment: {
              level: 'low',
              factors: ['公园环境安全', '人流较少']
            },
            personalizedTips: ['早晨空气清新，适合晨跑']
          },
          createdAt: new Date('2024-01-12T07:15:00Z'),
          feedback: {
            id: 'f2',
            recommendationId: '2',
            userId: user.id,
            isPositive: true,
            rating: 4,
            comment: '很好的晨跑地点',
            isUsed: true,
            usageData: {
              actualDistance: 3.8,
              actualDuration: 22,
              completionRate: 1.0,
              enjoymentLevel: 4
            },
            createdAt: new Date('2024-01-12T19:15:00Z')
          },
          usageData: {
            clicked: true,
            navigated: true,
            completed: true,
            completionTime: 22
          }
        },
        {
          id: '3',
          userId: user.id,
          routeId: '3',
          recommendationType: 'challenge' as const,
          confidenceScore: 0.75,
          reasoning: '挑战性路线推荐',
          context: {
            timeOfDay: 'evening',
            season: 'winter'
          },
          route: {
            id: '3',
            name: '陆家嘴金融区环线',
            distance: 6.5,
            difficulty: '中等',
            rating: 4.4,
            description: '现代都市风光跑步路线',
            highlights: ['摩天大楼', '都市风光', '夜景'],
            imageUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Lujiazui%20financial%20district%20Shanghai%20running%20route%20skyscrapers&image_size=landscape_4_3'
          },
          suitabilityScore: 75,
          personalizedReason: '挑战性适中，符合您的城市跑步偏好',
          aiAnalysis: {
            matchingFactors: ['挑战性', '都市环境'],
            weatherSuitability: 70,
            crowdLevel: 'high',
            safetyScore: 85,
            riskAssessment: {
              level: 'medium',
              factors: ['人流密集', '交通繁忙']
            },
            personalizedTips: ['建议避开高峰时段']
          },
          createdAt: new Date('2024-01-10T18:45:00Z'),
          feedback: {
            id: 'f3',
            recommendationId: '3',
            userId: user.id,
            isPositive: false,
            rating: 2,
            comment: '太拥挤了，不太适合跑步',
            isUsed: false,
            usageData: {
              actualDistance: 0,
              actualDuration: 0,
              completionRate: 0,
              enjoymentLevel: 2
            },
            createdAt: new Date('2024-01-10T21:45:00Z')
          },
          usageData: {
            clicked: true,
            navigated: false,
            completed: false
          }
        }
      ];

      setRecommendations(mockHistory);
      
      // 计算统计数据
      const totalRecommendations = mockHistory.length;
      const likedCount = mockHistory.filter(r => r.feedback?.isPositive === true).length;
      const dislikedCount = mockHistory.filter(r => r.feedback?.isPositive === false).length;
      const usedCount = mockHistory.filter(r => r.usageData?.navigated === true).length;
      const averageSuitability = mockHistory.reduce((sum, r) => sum + r.suitabilityScore, 0) / totalRecommendations;

      setStats({
        totalRecommendations,
        likedCount,
        dislikedCount,
        usedCount,
        averageSuitability
      });

    } catch (error) {
      console.error('加载推荐历史失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortRecommendations = () => {
    const filtered = recommendations.filter(rec => {
      // 搜索过滤
      const matchesSearch = rec.route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           rec.route.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // 类型过滤
      switch (filterType) {
        case 'liked':
          return rec.feedback?.isPositive === true;
        case 'disliked':
          return rec.feedback?.isPositive === false;
        case 'used':
          return rec.usageData?.navigated === true;
        case 'unused':
          return rec.usageData?.navigated !== true;
        default:
          return true;
      }
    });

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.route.rating - a.route.rating;
        case 'suitability':
          return b.suitabilityScore - a.suitabilityScore;
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredRecommendations(filtered);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFeedbackIcon = (feedback?: RecommendationFeedback & { isPositive: boolean }) => {
    if (!feedback) return null;
    return feedback.isPositive ? (
      <ThumbsUp className="w-4 h-4 text-green-500" />
    ) : (
      <ThumbsDown className="w-4 h-4 text-red-500" />
    );
  };

  const getUsageStatus = (usageData?: any) => {
    if (!usageData?.clicked) return '未查看';
    if (!usageData?.navigated) return '已查看';
    if (!usageData?.completed) return '已导航';
    return '已完成';
  };

  const getUsageStatusColor = (usageData?: any) => {
    if (!usageData?.clicked) return 'text-gray-500';
    if (!usageData?.navigated) return 'text-blue-500';
    if (!usageData?.completed) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载推荐历史中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/routes')}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center">
                <Brain className="w-6 h-6 text-purple-600 mr-3" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">推荐历史</h1>
                  <p className="text-sm text-gray-600">查看您的AI路线推荐记录</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">总推荐数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRecommendations}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <ThumbsUp className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">喜欢</p>
                <p className="text-2xl font-bold text-gray-900">{stats.likedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <ThumbsDown className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">不喜欢</p>
                <p className="text-2xl font-bold text-gray-900">{stats.dislikedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <MapPin className="w-8 h-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">已使用</p>
                <p className="text-2xl font-bold text-gray-900">{stats.usedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-orange-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">平均适合度</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageSuitability.toFixed(0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜索路线名称或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 筛选器 */}
            <div className="flex gap-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部</option>
                <option value="liked">已点赞</option>
                <option value="disliked">已点踩</option>
                <option value="used">已使用</option>
                <option value="unused">未使用</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">按时间排序</option>
                <option value="rating">按评分排序</option>
                <option value="suitability">按适合度排序</option>
              </select>
            </div>
          </div>
        </div>

        {/* 推荐历史列表 */}
        <div className="space-y-4">
          {filteredRecommendations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无推荐历史</h3>
              <p className="text-gray-600 mb-4">开始使用AI智能推荐功能来获取个性化路线建议</p>
              <button
                onClick={() => navigate('/routes')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                获取推荐
              </button>
            </div>
          ) : (
            filteredRecommendations.map((recommendation) => (
              <div key={recommendation.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* 路线图片 */}
                  <div className="lg:w-48 lg:h-32 w-full h-48 flex-shrink-0">
                    <img
                      src={recommendation.route.imageUrl}
                      alt={recommendation.route.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>

                  {/* 路线信息 */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {recommendation.route.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">
                          {recommendation.route.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {recommendation.route.distance}km
                          </span>
                          <span>{recommendation.route.difficulty}</span>
                          <span className="flex items-center">
                            <Star className="w-4 h-4 mr-1 text-yellow-400" />
                            {recommendation.route.rating}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center mb-2">
                          <span className="text-sm text-gray-600 mr-2">适合度:</span>
                          <span className="font-semibold text-purple-600">
                            {recommendation.suitabilityScore}/100
                          </span>
                        </div>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                            style={{ width: `${recommendation.suitabilityScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* 个性化理由 */}
                    <div className="bg-purple-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-700">
                        <strong>推荐理由:</strong> {recommendation.personalizedReason}
                      </p>
                    </div>

                    {/* 状态和反馈 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-600">
                            {formatDate(recommendation.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600 mr-2">状态:</span>
                          <span className={`text-sm font-medium ${getUsageStatusColor(recommendation.usageData)}`}>
                            {getUsageStatus(recommendation.usageData)}
                          </span>
                        </div>
                        {recommendation.usageData?.completionTime && (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-600">
                              {recommendation.usageData.completionTime}分钟
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {getFeedbackIcon(recommendation.feedback)}
                        {recommendation.feedback?.rating && (
                          <span className="text-sm text-gray-600">
                            {recommendation.feedback.rating}/5
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 反馈评论 */}
                    {recommendation.feedback?.comment && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>您的评价:</strong> {recommendation.feedback.comment}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteRecommendationHistory;