// 挑战竞赛智能体组件
import React, { useState, useEffect } from 'react';
import { Trophy, Target, Zap, TrendingUp, Clock, MapPin, Star, Flame } from 'lucide-react';
import { ChatInterface } from '../ChatInterface';
import { useAuthStore } from '../../../store/authStore';
import type { AIConversation, AIMessage, AIResponse } from '../../../types/ai';

interface ChallengeAgentProps {
  userRunningData?: {
    totalDistance: number;
    totalTime: number;
    averagePace: number;
    weeklyRuns: number;
    personalBest5K: number;
    personalBest10K: number;
    currentStreak: number;
    preferredDistance: string;
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  };
  currentChallenge?: {
    id: string;
    title: string;
    type: string;
    progress: number;
    target: number;
    unit: string;
  };
  onChallengeRecommendation?: (challenge: any) => void;
  onMotivationNeeded?: (message: string) => void;
  className?: string;
}

export const ChallengeAgent: React.FC<ChallengeAgentProps> = ({
  userRunningData,
  currentChallenge,
  onChallengeRecommendation,
  onMotivationNeeded,
  className = '',
}) => {
  const { user } = useAuthStore();
  const [conversation, setConversation] = useState<AIConversation | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [quickActions, setQuickActions] = useState<string[]>([]);

  // 根据用户数据生成快速操作建议
  useEffect(() => {
    if (userRunningData) {
      const actions = generateQuickActions(userRunningData);
      setQuickActions(actions);
    }
  }, [userRunningData]);

  const generateQuickActions = (data: typeof userRunningData) => {
    if (!data) return [];

    const actions = [];
    
    // 基于健身水平推荐
    if (data.fitnessLevel === 'beginner') {
      actions.push('推荐适合新手的挑战项目');
      actions.push('制定循序渐进的挑战计划');
    } else if (data.fitnessLevel === 'intermediate') {
      actions.push('推荐中级挑战竞赛项目');
      actions.push('分析我的跑步数据和潜力');
    } else {
      actions.push('推荐高难度挑战竞赛');
      actions.push('制定突破性挑战计划');
    }

    // 基于连续天数
    if (data.currentStreak > 7) {
      actions.push('推荐保持连续训练的挑战');
    } else {
      actions.push('推荐建立跑步习惯的挑战');
    }

    // 基于个人最佳成绩
    if (data.personalBest5K > 0) {
      actions.push('推荐突破5K个人最佳的挑战');
    }

    return actions.slice(0, 4); // 最多显示4个快速操作
  };

  const handleQuickAction = (action: string) => {
    // 分发快速消息事件，交由 ChatInterface 自动发送并展示
    const event = new CustomEvent('sendQuickMessage', { detail: action });
    window.dispatchEvent(event);
  };

  const handleConversationCreated = (conv: AIConversation) => {
    setConversation(conv);
  };

  const handleMessageSent = (message: AIMessage, response: AIResponse) => {
    // 检查是否包含挑战推荐
    if (response.metadata?.challengeRecommendation) {
      onChallengeRecommendation?.(response.metadata.challengeRecommendation);
    }

    // 检查是否需要激励
    if (response.metadata?.motivationLevel === 'high') {
      onMotivationNeeded?.(response.message);
    }
  };

  const buildChallengeContext = () => {
    return {
      conversationId: conversation?.id || 'challenge-conversation',
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
          fitnessLevel: userRunningData?.fitnessLevel || 'intermediate'
        }
      },
      safetyContext: {
        currentLevel: 'normal',
        alerts: []
      },
      currentChallenge: currentChallenge,
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

  const getFitnessLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'text-green-600 bg-green-100';
      case 'intermediate':
        return 'text-blue-600 bg-blue-100';
      case 'advanced':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!user) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 text-center ${className}`}>
        <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500">请先登录以使用AI训练教练</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${className}`}>
      {/* 智能体头部 */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">AI挑战推荐助手</h3>
              <p className="text-orange-100 text-sm">智能挑战推荐 · 个性化竞赛方案</p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Zap className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 用户数据概览 */}
      {userRunningData && (
        <div className="p-4 bg-gray-50 border-b">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-600">{userRunningData.currentStreak}</div>
              <div className="text-xs text-gray-600">连续训练</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{userRunningData.weeklyRuns}</div>
              <div className="text-xs text-gray-600">周训练量</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {userRunningData.personalBest5K > 0 ? Math.floor(userRunningData.personalBest5K / 60) : '--'}
              </div>
              <div className="text-xs text-gray-600">5K最佳(分)</div>
            </div>
            <div>
              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getFitnessLevelColor(userRunningData.fitnessLevel)}`}>
                {userRunningData.fitnessLevel === 'beginner' ? '新手' : 
                 userRunningData.fitnessLevel === 'intermediate' ? '中级' : '高级'}
              </div>
              <div className="text-xs text-gray-600 mt-1">训练水平</div>
            </div>
          </div>
        </div>
      )}

      {/* 快速操作 */}
      {quickActions.length > 0 && (
        <div className="p-4 border-b">
          <h4 className="text-sm font-medium text-gray-700 mb-3">快速操作</h4>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action)}
                className="p-2 text-sm bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-left"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 聊天界面 */}
      <div className={`transition-all duration-300 ${isExpanded ? 'h-96' : 'h-64'}`}>
        <ChatInterface
          conversationType="challenge_competition"
          provider="deepseek"
          context={buildChallengeContext()}
          onConversationCreated={handleConversationCreated}
          onMessageSent={handleMessageSent}
          className="h-full border-0 rounded-none"
          placeholder="询问挑战推荐、竞赛方案或训练指导..."
        />
      </div>

      {/* 智能体特色功能提示 */}
      <div className="p-3 bg-gray-50 text-center">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
          <div className="flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" />
            数据分析
          </div>
          <div className="flex items-center">
            <Flame className="w-3 h-3 mr-1" />
            挑战推荐
          </div>
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            训练计划
          </div>
          <div className="flex items-center">
            <Trophy className="w-3 h-3 mr-1" />
            目标达成
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeAgent;