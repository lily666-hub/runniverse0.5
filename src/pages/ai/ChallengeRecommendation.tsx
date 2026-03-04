// AI挑战推荐页面
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Target, 
  Zap, 
  TrendingUp, 
  Clock, 
  MapPin, 
  Star, 
  Flame,
  ArrowLeft,
  Play,
  CheckCircle,
  BarChart3,
  Users,
  Award,
  Calendar,
  Brain,
  Plus,
  MessageSquare,
  Trash2
} from 'lucide-react';
import { ChatInterface } from '../../components/ai/ChatInterface';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import { AIService } from '../../services/ai/aiService';
import { ConversationManager } from '../../services/ai/conversationManager';
import { toast } from 'sonner';
import type { AIConversation, AIMessage, AIResponse } from '../../types/ai';

interface UserRunningData {
  totalDistance: number;
  totalTime: number;
  averagePace: number;
  weeklyRuns: number;
  personalBest5K: number;
  personalBest10K: number;
  currentStreak: number;
  preferredDistance: string;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
}

const ChallengeRecommendation: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { user: demoUser } = useAuthStore();
  const aiService = new AIService();
  const conversationManager = new ConversationManager();
  
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  // 模拟用户跑步数据
  const [userRunningData] = useState<UserRunningData>({
    totalDistance: 245.6,
    totalTime: 1850, // 分钟
    averagePace: 5.2, // 分钟/公里
    weeklyRuns: 4,
    personalBest5K: 22.5, // 分钟
    personalBest10K: 48.3, // 分钟
    currentStreak: 12, // 连续天数
    preferredDistance: '5K-10K',
    fitnessLevel: 'intermediate'
  });

  // 快速操作建议
  const quickActions = [
    '推荐适合我的挑战项目',
    '制定个性化训练计划',
    '分析我的跑步数据和潜力',
    '推荐突破个人最佳的挑战',
    '制定月度挑战目标',
    '推荐团队挑战活动'
  ];

  // 用户统计数据
  const userStats = [
    {
      label: '总里程',
      value: `${userRunningData.totalDistance}km`,
      icon: MapPin,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      label: '连续天数',
      value: `${userRunningData.currentStreak}天`,
      icon: Flame,
      color: 'text-red-500',
      bgColor: 'bg-red-50'
    },
    {
      label: '5K最佳',
      value: `${userRunningData.personalBest5K}分钟`,
      icon: Target,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      label: '健身水平',
      value: getFitnessLevelText(userRunningData.fitnessLevel),
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    }
  ];

  function getFitnessLevelText(level: string): string {
    switch (level) {
      case 'beginner': return '新手';
      case 'intermediate': return '中级';
      case 'advanced': return '高级';
      default: return '未知';
    }
  }

  const loadConversations = async () => {
    // 支持匿名用户：未登录时使用匿名ID加载离线或在线数据
    const effectiveUserId = user?.id || demoUser?.id || (localStorage.getItem('anonymous_user_id') || `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    if (!localStorage.getItem('anonymous_user_id')) {
      localStorage.setItem('anonymous_user_id', effectiveUserId);
    }
    
    setIsLoadingConversations(true);
    try {
      const userConversations = await aiService.getConversations(effectiveUserId, 20, 0, 'challenge_competition');
      setConversations(userConversations);
      
      // 如果没有当前对话且有对话记录，选择最新的对话
      if (!currentConversation && userConversations.length > 0) {
        setCurrentConversation(userConversations[0]);
      }
    } catch (error) {
      console.error('加载对话列表失败，尝试离线列表:', error);
      // 离线回退：从本地存储读取离线对话
      const offlineConversations = conversationManager.getOfflineConversations(effectiveUserId)
        .filter(conv => conv.conversationType === 'challenge_competition');
      setConversations(offlineConversations);
      // 提示但不中断使用
      toast.warning('网络或权限受限，已展示本地离线对话');
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const createNewConversation = async () => {
    const effectiveUserId = user?.id || demoUser?.id || (localStorage.getItem('anonymous_user_id') || `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    if (!localStorage.getItem('anonymous_user_id')) {
      localStorage.setItem('anonymous_user_id', effectiveUserId);
    }
    
    try {
      const newConv = await aiService.createConversation(effectiveUserId, {
        title: '新的挑战推荐对话',
        provider: 'kimi',
        conversationType: 'challenge_competition'
      });
      setCurrentConversation(newConv);
      setConversations(prev => [newConv, ...prev]);
      toast.success('新对话已创建');
    } catch (error) {
      console.error('创建新对话失败:', error);
      toast.error('创建对话失败，请稍后重试');
    }
  };

  const selectConversation = async (conversation: AIConversation) => {
    setCurrentConversation(conversation);
    toast.success('已切换到对话: ' + conversation.title);
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      await aiService.deleteConversation(conversationId);
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
      }
      toast.success('对话已删除');
    } catch (error) {
      console.error('删除对话失败:', error);
      toast.error('删除对话失败，请稍后重试');
    }
  };

  const handleQuickAction = (action: string) => {
    // 创建新对话（如果不存在）
    if (!currentConversation) {
      createNewConversation();
    }
    
    // 延迟发送消息，确保对话已创建
    setTimeout(() => {
      const event = new CustomEvent('sendQuickMessage', { detail: action });
      window.dispatchEvent(event);
    }, 500);
  };

  const handleConversationCreated = (conv: AIConversation) => {
    setCurrentConversation(conv);
    loadConversations();
  };

  const handleMessageSent = (message: AIMessage, response: AIResponse) => {
    // 处理挑战推荐响应
    if (response.metadata?.challengeRecommendation) {
      console.log('收到挑战推荐:', response.metadata.challengeRecommendation);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user, demoUser]);

  const buildChallengeContext = () => {
    return {
      conversationId: currentConversation?.id || 'challenge-recommendation',
      locationData: {
        latitude: 31.2304,
        longitude: 121.4737,
        address: '上海市',
        safetyLevel: 85
      },
      userContext: {
        userType: 'runner',
        preferences: {
          challengeTypes: ['distance', 'time', 'frequency'],
          motivationStyle: 'encouraging',
          fitnessLevel: userRunningData.fitnessLevel
        },
        runningData: userRunningData
      },
      safetyContext: {
        currentLevel: 'normal',
        alerts: []
      },
      agentContext: {
        agentType: 'challenge_competition',
        capabilities: [
          'challenge_recommendation',
          'progress_analysis',
          'motivation_coaching',
          'training_planning',
          'performance_tracking',
          'goal_setting',
          'real_time_encouragement',
          'competition_strategy',
          'race_preparation'
        ]
      },
      createdAt: new Date()
    };
  };

  // 允许未登录用户直接使用AI挑战推荐功能
  // 当未登录时，不再拦截页面渲染，直接展示主界面

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部横幅 */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/challenges')}
              className="flex items-center text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回挑战竞赛
            </button>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Trophy className="w-12 h-12 mr-3" />
              <h1 className="text-4xl font-bold">AI挑战推荐助手</h1>
            </div>
            <p className="text-xl text-orange-100 mb-6">
              智能挑战推荐 · 个性化竞赛方案 · 专业跑步教练
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>AI驱动</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>个性化推荐</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>专业指导</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左侧信息面板 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 对话管理 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-orange-500" />
                  对话管理
                </h3>
                <button
                  onClick={createNewConversation}
                  className="flex items-center px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  新建
                </button>
              </div>
              
              {isLoadingConversations ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">加载中...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-6">
                  <MessageSquare className="w-12 h-12 text-orange-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-3">还没有对话记录</p>
                  <p className="text-xs text-gray-400 mb-4">开始与AI助手对话，获取个性化的挑战推荐</p>
                  <button
                    onClick={createNewConversation}
                    className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    创建新对话
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        currentConversation?.id === conv.id
                          ? 'border-orange-300 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-200 hover:bg-orange-25'
                      }`}
                      onClick={() => selectConversation(conv)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conv.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {conv.messageCount} 条消息 · {new Date(conv.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 用户数据概览 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-orange-500" />
                跑步数据
              </h3>
              <div className="space-y-4">
                {userStats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className={`${stat.bgColor} rounded-lg p-3`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Icon className={`w-5 h-5 ${stat.color} mr-2`} />
                          <span className="text-sm text-gray-600">{stat.label}</span>
                        </div>
                        <span className="font-semibold text-gray-900">{stat.value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 快速操作 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-orange-500" />
                快速操作
              </h3>
              <div className="space-y-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>

            {/* AI能力介绍 */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-orange-500" />
                AI能力
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  智能挑战推荐
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  个性化训练计划
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  进度分析指导
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  激励与鼓励
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  竞赛策略建议
                </div>
              </div>
            </div>
          </div>

          {/* 右侧对话界面 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm h-[700px] flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Trophy className="w-6 h-6 mr-2 text-orange-500" />
                  AI挑战推荐对话
                </h2>
                <p className="text-gray-600 mt-1">
                  与AI助手对话，获取个性化的挑战推荐和训练指导
                </p>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <ChatInterface
                  conversationId={currentConversation?.id}
                  conversation={currentConversation}
                  agentType="challenge_competition"
                  conversationType="challenge_competition"
                  provider="kimi"
                  context={buildChallengeContext()}
                  onConversationCreated={handleConversationCreated}
                  onMessageSent={handleMessageSent}
                  placeholder="询问挑战推荐、竞赛方案或训练指导..."
                  className="h-full"
                  welcomeMessage="你好！我是你的AI挑战推荐助手。我可以根据你的跑步数据和目标，为你推荐合适的挑战项目，制定个性化的训练计划，并提供专业的竞赛指导。有什么我可以帮助你的吗？"
                  allowAnonymous={true}
                  anonymousId={localStorage.getItem('anonymous_user_id') || undefined}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeRecommendation;