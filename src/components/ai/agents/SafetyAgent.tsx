// 安全顾问智能体组件
import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Heart, Eye, Phone, MapPin, Clock, Users } from 'lucide-react';
import { ChatInterface } from '../ChatInterface';
import { useAuthStore } from '../../../store/authStore';
import type { AIConversation, AIMessage, AIResponse } from '../../../types/ai';

interface SafetyAgentProps {
  userLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  safetyData?: {
    crimeRate: number;
    lightingLevel: number;
    crowdDensity: number;
    emergencyServices: boolean;
    femaleRunnerReports: number;
  };
  userProfile?: {
    gender: 'male' | 'female' | 'other';
    age: number;
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    medicalConditions: string[];
    emergencyContacts: Array<{
      name: string;
      phone: string;
      relationship: string;
    }>;
  };
  onEmergencyAlert?: (alert: any) => void;
  onSafetyRecommendation?: (recommendation: any) => void;
  className?: string;
}

export const SafetyAgent: React.FC<SafetyAgentProps> = ({
  userLocation,
  safetyData,
  userProfile,
  onEmergencyAlert,
  onSafetyRecommendation,
  className = '',
}) => {
  const { user } = useAuthStore();
  const [conversation, setConversation] = useState<AIConversation | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [safetyLevel, setSafetyLevel] = useState<'safe' | 'caution' | 'danger'>('safe');
  const [quickActions, setQuickActions] = useState<string[]>([]);

  // 计算安全等级
  useEffect(() => {
    if (safetyData) {
      const level = calculateSafetyLevel(safetyData);
      setSafetyLevel(level);
    }
  }, [safetyData]);

  // 生成快速安全建议
  useEffect(() => {
    if (userProfile && safetyData) {
      const actions = generateQuickActions(userProfile, safetyData);
      setQuickActions(actions);
    }
  }, [userProfile, safetyData]);

  const calculateSafetyLevel = (data: typeof safetyData): 'safe' | 'caution' | 'danger' => {
    if (!data) return 'safe';

    let score = 0;
    
    // 犯罪率评分 (0-40分)
    if (data.crimeRate > 0.8) score += 40;
    else if (data.crimeRate > 0.5) score += 25;
    else if (data.crimeRate > 0.2) score += 10;

    // 照明水平评分 (0-30分)
    if (data.lightingLevel < 0.3) score += 30;
    else if (data.lightingLevel < 0.6) score += 15;

    // 人群密度评分 (0-20分)
    if (data.crowdDensity < 0.2) score += 20;
    else if (data.crowdDensity < 0.4) score += 10;

    // 紧急服务评分 (0-10分)
    if (!data.emergencyServices) score += 10;

    if (score >= 60) return 'danger';
    if (score >= 30) return 'caution';
    return 'safe';
  };

  const generateQuickActions = (profile: typeof userProfile, data: typeof safetyData) => {
    if (!profile || !data) return [];

    const actions = [];

    // 基于性别的建议
    if (profile.gender === 'female') {
      actions.push('获取女性跑步安全建议');
      actions.push('查看女性专属安全路线');
      if (data.femaleRunnerReports > 0) {
        actions.push('查看女性跑者安全报告');
      }
    }

    // 基于经验水平的建议
    if (profile.experienceLevel === 'beginner') {
      actions.push('新手跑步安全指南');
      actions.push('基础安全装备推荐');
    }

    // 基于安全等级的建议
    if (safetyLevel === 'danger') {
      actions.push('紧急安全措施');
      actions.push('寻找替代安全路线');
    } else if (safetyLevel === 'caution') {
      actions.push('提高警惕建议');
      actions.push('安全装备检查');
    }

    // 基于医疗状况的建议
    if (profile.medicalConditions.length > 0) {
      actions.push('医疗安全注意事项');
    }

    // 基于时间的建议
    const hour = new Date().getHours();
    if (hour < 6 || hour > 20) {
      actions.push('夜间跑步安全建议');
    }

    return actions.slice(0, 6);
  };

  const handleQuickAction = (action: string) => {
    const event = new CustomEvent('sendQuickMessage', { detail: action });
    window.dispatchEvent(event);
  };

  const handleConversationCreated = (conv: AIConversation) => {
    setConversation(conv);
  };

  const handleMessageSent = (message: AIMessage, response: AIResponse) => {
    // 检查是否包含紧急警报
    if (response.metadata?.emergencyAlert) {
      onEmergencyAlert?.(response.metadata.emergencyAlert);
    }

    // 检查是否包含安全建议
    if (response.metadata?.safetyRecommendation) {
      onSafetyRecommendation?.(response.metadata.safetyRecommendation);
    }
  };

  const buildSafetyContext = () => {
    return {
      conversationId: conversation?.id || 'safety-conversation',
      locationData: {
        latitude: userLocation?.latitude || 31.2304,
        longitude: userLocation?.longitude || 121.4737,
        address: userLocation?.address || '上海市',
        safetyLevel: 85
      },
      userContext: {
        gender: userProfile?.gender,
        preferences: {
          experienceLevel: userProfile?.experienceLevel,
          hasMedicalConditions: userProfile?.medicalConditions && userProfile.medicalConditions.length > 0,
          hasEmergencyContacts: userProfile?.emergencyContacts && userProfile.emergencyContacts.length > 0,
        }
      },
      safetyContext: {
        timeOfDay: new Date().getHours() < 6 || new Date().getHours() > 20 ? 'night' : 'day',
        lightingCondition: safetyData?.lightingLevel ? (safetyData.lightingLevel > 0.7 ? 'good' : 'poor') : 'unknown'
      },
      createdAt: new Date()
    };
  };

  const getSafetyLevelColor = () => {
    switch (safetyLevel) {
      case 'safe': return 'text-green-600 bg-green-100';
      case 'caution': return 'text-yellow-600 bg-yellow-100';
      case 'danger': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSafetyLevelText = () => {
    switch (safetyLevel) {
      case 'safe': return '安全';
      case 'caution': return '注意';
      case 'danger': return '危险';
      default: return '未知';
    }
  };

  const getSafetyIcon = () => {
    switch (safetyLevel) {
      case 'safe': return <Shield className="w-5 h-5 text-green-500" />;
      case 'caution': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'danger': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Shield className="w-5 h-5 text-gray-500" />;
    }
  };

  if (!user) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 text-center">
        <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">安全顾问智能体</h3>
        <p className="text-gray-600 mb-4">登录后获得个性化安全建议和紧急响应服务</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* 智能体头部 */}
      <div className="bg-gradient-to-r from-red-500 to-pink-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 rounded-full p-2">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">安全顾问智能体</h3>
              <p className="text-red-100 text-sm">专业安全评估和紧急响应助手</p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 安全状态概览 */}
      <div className="p-4 bg-red-50 border-b">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900 flex items-center">
            {getSafetyIcon()}
            <span className="ml-2">当前安全状态</span>
          </h4>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSafetyLevelColor()}`}>
            {getSafetyLevelText()}
          </span>
        </div>

        {safetyData && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                {Math.round(safetyData.crimeRate * 100)}%
              </div>
              <div className="text-xs text-gray-600">犯罪率</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">
                {Math.round(safetyData.lightingLevel * 100)}%
              </div>
              <div className="text-xs text-gray-600">照明水平</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {Math.round(safetyData.crowdDensity * 100)}%
              </div>
              <div className="text-xs text-gray-600">人群密度</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {safetyData.emergencyServices ? '✓' : '✗'}
              </div>
              <div className="text-xs text-gray-600">紧急服务</div>
            </div>
          </div>
        )}
      </div>

      {/* 用户安全档案 */}
      {userProfile && (
        <div className="p-4 bg-pink-50 border-b">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Users className="w-4 h-4 mr-2 text-pink-500" />
            安全档案
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">性别:</span>
                  <span className="text-gray-900">
                    {userProfile.gender === 'female' ? '女性' : 
                     userProfile.gender === 'male' ? '男性' : '其他'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">经验:</span>
                  <span className="text-gray-900">
                    {userProfile.experienceLevel === 'beginner' ? '新手' :
                     userProfile.experienceLevel === 'intermediate' ? '中级' : '高级'}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">医疗状况:</span>
                  <span className="text-gray-900">
                    {userProfile.medicalConditions.length > 0 ? '有' : '无'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">紧急联系人:</span>
                  <span className="text-gray-900">
                    {userProfile.emergencyContacts.length}位
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 快速安全操作 */}
      {quickActions.length > 0 && (
        <div className="p-4 border-b">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Heart className="w-4 h-4 mr-2 text-red-500" />
            智能建议
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action)}
                className="text-left p-3 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 rounded-lg transition-colors text-sm"
              >
                <div className="flex items-center">
                  <Shield className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">{action}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 紧急联系按钮 */}
      {userProfile?.emergencyContacts && userProfile.emergencyContacts.length > 0 && (
        <div className="p-4 bg-red-100 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 flex items-center">
              <Phone className="w-4 h-4 mr-2 text-red-500" />
              紧急联系
            </h4>
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              一键求助
            </button>
          </div>
        </div>
      )}

      {/* 聊天界面 */}
      <div className={`transition-all duration-300 ${isExpanded ? 'h-96' : 'h-64'}`}>
        <ChatInterface
          conversationType="safety"
          provider="deepseek"
          context={buildSafetyContext()}
          onConversationCreated={handleConversationCreated}
          onMessageSent={handleMessageSent}
          placeholder="询问安全建议、紧急情况处理或女性跑步安全..."
          className="h-full border-0 rounded-none"
        />
      </div>

      {/* 智能体特色功能提示 */}
      <div className="p-3 bg-gray-50 text-center">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
          <div className="flex items-center">
            <Shield className="w-3 h-3 mr-1" />
            安全评估
          </div>
          <div className="flex items-center">
            <AlertTriangle className="w-3 h-3 mr-1" />
            风险预警
          </div>
          <div className="flex items-center">
            <Phone className="w-3 h-3 mr-1" />
            紧急响应
          </div>
          <div className="flex items-center">
            <Heart className="w-3 h-3 mr-1" />
            女性专属
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyAgent;