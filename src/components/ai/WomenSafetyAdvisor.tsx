// 女性专属安全顾问组件
import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Heart, 
  Users, 
  MapPin, 
  Clock, 
  AlertTriangle,
  Star,
  MessageCircle,
  Settings
} from 'lucide-react';
import { ChatInterface } from './ChatInterface';
import { aiService } from '../../services/ai';
import { useAuthStore } from '../../store/authStore';
import type { SafetyProfile, WomenSafetyFeature } from '../../types/ai';

interface WomenSafetyAdvisorProps {
  className?: string;
}

export const WomenSafetyAdvisor: React.FC<WomenSafetyAdvisorProps> = ({
  className = '',
}) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'chat' | 'features' | 'profile'>('chat');
  const [safetyProfile, setSafetyProfile] = useState<SafetyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 女性安全功能列表
  const safetyFeatures: WomenSafetyFeature[] = [
    {
      id: 'buddy-system',
      name: '跑步伙伴系统',
      description: '智能匹配附近的女性跑步者，结伴跑步更安全',
      category: 'prevention',
      isActive: true,
      aiEnhanced: true,
      settings: { autoMatch: true, maxDistance: 2 }
    },
    {
      id: 'safe-routes',
      name: '女性安全路线',
      description: 'AI推荐光线充足、人流适中的安全跑步路线',
      category: 'prevention',
      isActive: true,
      aiEnhanced: true,
      settings: { preferWellLit: true, avoidIsolated: true }
    },
    {
      id: 'emergency-contacts',
      name: '紧急联系人',
      description: '一键联系预设的紧急联系人，自动分享位置',
      category: 'response',
      isActive: true,
      aiEnhanced: false,
      settings: { autoShare: true, callDelay: 30 }
    },
    {
      id: 'safety-check-in',
      name: '安全签到',
      description: 'AI监控跑步状态，异常时自动发送警报',
      category: 'detection',
      isActive: false,
      aiEnhanced: true,
      settings: { checkInterval: 10, autoAlert: true }
    },
    {
      id: 'harassment-report',
      name: '骚扰举报',
      description: '快速举报不当行为，帮助其他女性避开危险区域',
      category: 'support',
      isActive: true,
      aiEnhanced: true,
      settings: { anonymous: true, shareLocation: true }
    },
    {
      id: 'confidence-building',
      name: '信心建设',
      description: 'AI提供个性化的心理支持和安全技能培训',
      category: 'support',
      isActive: true,
      aiEnhanced: true,
      settings: { dailyTips: true, skillAssessment: true }
    }
  ];

  useEffect(() => {
    if (user) {
      loadSafetyProfile();
    }
  }, [user]);

  const loadSafetyProfile = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const profile = await aiService.getSafetyProfile(user.id);
      setSafetyProfile(profile);
    } catch (error) {
      console.error('加载安全档案失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSafetyProfile = async (updates: Partial<SafetyProfile>) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const updatedProfile = await aiService.updateSafetyProfile(user.id, updates);
      setSafetyProfile(updatedProfile);
    } catch (error) {
      console.error('更新安全档案失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'prevention':
        return <Shield className="w-5 h-5 text-green-600" />;
      case 'detection':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'response':
        return <Heart className="w-5 h-5 text-red-600" />;
      case 'support':
        return <Users className="w-5 h-5 text-purple-600" />;
      default:
        return <Star className="w-5 h-5 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'prevention':
        return 'bg-green-50 border-green-200';
      case 'detection':
        return 'bg-yellow-50 border-yellow-200';
      case 'response':
        return 'bg-red-50 border-red-200';
      case 'support':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        请先登录以使用女性专属安全顾问
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* 头部导航 */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Heart className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">女性专属安全顾问</h2>
              <p className="text-sm text-gray-600">为女性跑步者提供专业的安全指导和支持</p>
            </div>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'chat'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>AI对话</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'features'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>安全功能</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'profile'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>个人档案</span>
            </div>
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-6">
        {activeTab === 'chat' && (
          <div className="h-96">
            <ChatInterface
              conversationType="women_safety"
              provider="kimi"
              context={{
                userContext: {
                  gender: 'female',
                  preferences: safetyProfile?.preferences,
                },
                safetyContext: {
                  emergencyContacts: safetyProfile?.emergencyContacts,
                },
              }}
              className="h-full"
            />
          </div>
        )}

        {activeTab === 'features' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safetyFeatures.map((feature) => (
                <div
                  key={feature.id}
                  className={`p-4 rounded-lg border-2 transition-all ${getCategoryColor(feature.category)} ${
                    feature.isActive ? 'ring-2 ring-pink-200' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(feature.category)}
                      <h3 className="font-semibold text-gray-900">{feature.name}</h3>
                      {feature.aiEnhanced && (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                          AI增强
                        </span>
                      )}
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={feature.isActive}
                        onChange={() => {
                          // 这里可以实现功能开关逻辑
                          console.log(`切换功能: ${feature.name}`);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                  
                  {feature.isActive && (
                    <div className="text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>已启用</span>
                        </span>
                        {feature.category === 'prevention' && (
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>位置监控</span>
                          </span>
                        )}
                        {feature.category === 'detection' && (
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>实时监控</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 功能统计 */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">安全功能统计</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {safetyFeatures.filter(f => f.category === 'prevention' && f.isActive).length}
                  </div>
                  <div className="text-sm text-gray-600">预防功能</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {safetyFeatures.filter(f => f.category === 'detection' && f.isActive).length}
                  </div>
                  <div className="text-sm text-gray-600">检测功能</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {safetyFeatures.filter(f => f.category === 'response' && f.isActive).length}
                  </div>
                  <div className="text-sm text-gray-600">响应功能</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {safetyFeatures.filter(f => f.category === 'support' && f.isActive).length}
                  </div>
                  <div className="text-sm text-gray-600">支持功能</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-4">基本信息</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    性别
                  </label>
                  <select
                    value={safetyProfile?.gender || 'female'}
                    onChange={(e) => updateSafetyProfile({ gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="female">女性</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    安全等级偏好
                  </label>
                  <select
                    value={safetyProfile?.preferences?.safetyLevel || 'high'}
                    onChange={(e) => updateSafetyProfile({
                      preferences: {
                        ...safetyProfile?.preferences,
                        safetyLevel: e.target.value as 'low' | 'medium' | 'high'
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="high">高安全</option>
                    <option value="medium">中等安全</option>
                    <option value="low">基础安全</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 紧急联系人 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-4">紧急联系人</h4>
              <div className="space-y-3">
                {safetyProfile?.emergencyContacts?.map((contact, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-600">{contact.phone}</div>
                      <div className="text-xs text-gray-500">{contact.relationship}</div>
                    </div>
                    <button className="text-red-600 hover:text-red-700">
                      删除
                    </button>
                  </div>
                )) || (
                  <div className="text-center text-gray-500 py-4">
                    暂无紧急联系人
                  </div>
                )}
                <button className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-pink-300 hover:text-pink-600 transition-colors">
                  + 添加紧急联系人
                </button>
              </div>
            </div>

            {/* 安全设置 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-4">安全设置</h4>
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={safetyProfile?.safetySettings?.nightRunning || false}
                    onChange={(e) => updateSafetyProfile({
                      safetySettings: {
                        ...safetyProfile?.safetySettings,
                        nightRunning: e.target.checked
                      }
                    })}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="text-gray-700">允许夜间跑步</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={safetyProfile?.safetySettings?.buddySystem || false}
                    onChange={(e) => updateSafetyProfile({
                      safetySettings: {
                        ...safetyProfile?.safetySettings,
                        buddySystem: e.target.checked
                      }
                    })}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="text-gray-700">启用伙伴系统</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={safetyProfile?.safetySettings?.emergencyAutoCall || false}
                    onChange={(e) => updateSafetyProfile({
                      safetySettings: {
                        ...safetyProfile?.safetySettings,
                        emergencyAutoCall: e.target.checked
                      }
                    })}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="text-gray-700">紧急情况自动拨号</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={safetyProfile?.safetySettings?.shareLocation || false}
                    onChange={(e) => updateSafetyProfile({
                      safetySettings: {
                        ...safetyProfile?.safetySettings,
                        shareLocation: e.target.checked
                      }
                    })}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="text-gray-700">自动分享位置</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};