// AI安全顾问主页
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, 
  MessageCircle, 
  Shield, 
  AlertTriangle, 
  BarChart3,
  Heart,
  Users,
  Zap,
  Clock,
  TrendingUp,
  Star,
  ArrowRight,
  Play,
  CheckCircle
} from 'lucide-react';
import { aiService } from '../../services/ai';
import { emergencyService } from '../../../public/services/emergencyService';
import { safetyAnalysisService } from '../../../public/services/safetyAnalysisService';
import { safetyApiService } from '../../../public/services/safetyApiService';
import { useAuthStore } from '../../store/authStore';
import type { AIConversationStats, SafetyProfile } from '../../types/ai';

export const AIHome: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AIConversationStats | null>(null);
  const [safetyProfile, setSafetyProfile] = useState<SafetyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const [statsData, profileData] = await Promise.all([
        aiService.getConversationStats(user.id),
        aiService.getSafetyProfile(user.id),
      ]);
      setStats(statsData);
      setSafetyProfile(profileData);
    } catch (error) {
      console.error('加载用户数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // AI功能卡片配置
  const aiFeatures = [
    {
      id: 'chat',
      title: 'AI智能对话',
      description: '与AI助手进行自然对话，获取个性化安全建议',
      icon: <MessageCircle className="w-8 h-8" />,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      link: '/ai/chat',
      stats: stats?.totalConversations || 0,
      statsLabel: '次对话',
    },
    {
      id: 'women-safety',
      title: '女性专属顾问',
      description: '专为女性跑步者设计的安全指导和支持系统',
      icon: <Heart className="w-8 h-8" />,
      color: 'bg-pink-500',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      link: '/ai/women-safety',
      stats: safetyProfile?.preferences ? 1 : 0,
      statsLabel: '个人档案',
    },
    {
      id: 'emergency',
      title: '紧急AI助手',
      description: '24小时紧急响应系统，关键时刻的智能帮助',
      icon: <AlertTriangle className="w-8 h-8" />,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      link: '/ai/emergency',
      stats: safetyProfile?.emergencyContacts?.length || 0,
      statsLabel: '紧急联系人',
    },
    {
      id: 'analysis',
      title: '智能分析面板',
      description: 'AI驱动的个性化安全分析和趋势洞察',
      icon: <BarChart3 className="w-8 h-8" />,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      link: '/ai/analysis',
      stats: stats?.averageResponseTime || 0,
      statsLabel: '秒响应',
    },
  ];

  // 快速操作
  const quickActions = [
    {
      title: '开始安全咨询',
      description: '立即与AI助手开始对话',
      icon: <Play className="w-5 h-5" />,
      action: () => window.location.href = '/ai/chat',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: '更新安全档案',
      description: '完善个人安全信息',
      icon: <Shield className="w-5 h-5" />,
      action: () => window.location.href = '/ai/women-safety',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      title: '查看安全分析',
      description: '了解您的安全状况',
      icon: <TrendingUp className="w-5 h-5" />,
      action: () => window.location.href = '/ai/analysis',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
  ];

  // 最新功能介绍
  const latestFeatures = [
    {
      title: '智能安全分析',
      description: 'AI分析环境数据，提供实时安全评估和建议',
      isNew: true,
    },
    {
      title: '紧急响应系统',
      description: '24小时紧急求救，自动联系紧急联系人和相关部门',
      isNew: true,
    },
    {
      title: '风险预警提醒',
      description: '提前识别潜在风险，主动提供安全建议和预警',
      isNew: false,
    },
    {
      title: '女性安全保护',
      description: '专为女性跑步者设计的安全指导和保护系统',
      isNew: false,
    },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">AI安全顾问</h2>
          <p className="text-gray-600 mb-6">请先登录以使用AI功能</p>
          <Link
            to="/login"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            立即登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部横幅 */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Brain className="w-12 h-12 mr-3" />
              <h1 className="text-4xl font-bold">AI安全顾问</h1>
            </div>
            <p className="text-xl text-blue-100 mb-6">
              为您的跑步安全提供24小时智能守护
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>AI驱动</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>24小时在线</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>个性化服务</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>紧急响应</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 快速操作区域 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">快速开始</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`p-4 rounded-lg text-white text-left transition-colors ${action.color}`}
              >
                <div className="flex items-center space-x-3">
                  {action.icon}
                  <div>
                    <h3 className="font-semibold">{action.title}</h3>
                    <p className="text-sm opacity-90">{action.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* AI功能卡片 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">AI功能中心</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiFeatures.map((feature) => (
              <Link
                key={feature.id}
                to={feature.link}
                className={`block p-6 rounded-lg border-2 transition-all hover:shadow-lg hover:scale-105 ${feature.bgColor} ${feature.borderColor}`}
              >
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${feature.color} text-white mb-4`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
                  
                  {/* 统计信息 */}
                  <div className="flex items-center justify-center space-x-2 text-sm">
                    <span className="text-2xl font-bold text-gray-900">{feature.stats}</span>
                    <span className="text-gray-600">{feature.statsLabel}</span>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-center text-blue-600">
                    <span className="text-sm font-medium">立即使用</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 用户统计概览 */}
        {stats && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">使用统计</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {stats.totalConversations}
                  </div>
                  <div className="text-sm text-gray-600">总对话次数</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {stats.averageResponseTime}s
                  </div>
                  <div className="text-sm text-gray-600">平均响应时间</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {stats.totalMessages}
                  </div>
                  <div className="text-sm text-gray-600">消息总数</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {stats.activeConversations}
                  </div>
                  <div className="text-sm text-gray-600">活跃对话</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 最新功能 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">最新功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {latestFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {feature.isNew ? (
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    ) : (
                      <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                      {feature.isNew && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                          新功能
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI提供商状态 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>AI服务状态</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900">KIMI AI</span>
              </div>
              <div className="text-sm text-gray-600">正常运行</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900">DeepSeek AI</span>
              </div>
              <div className="text-sm text-gray-600">正常运行</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};