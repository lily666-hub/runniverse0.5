// AI对话页面
import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Trash2,
  Edit,
  Clock,
  Bot,
  User,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { ChatInterface } from '../../components/ai';
import { ErrorToast, SuccessToast } from '../../components/common/ErrorToast';
import { NetworkUtils } from '../../utils/networkUtils';
import { aiService } from '../../services/ai';
import { useAuthStore } from '../../store/authStore';
import type { AIConversation } from '../../types/ai';

export const AIChat: React.FC = () => {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<AIConversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'general' | 'women_safety' | 'emergency' | 'safety' | 'route_recommendation' | 'challenge_competition'>('all');
  const [showSidebar, setShowSidebar] = useState(true);
  const [networkStatus, setNetworkStatus] = useState<{
    online: boolean;
    supabase: boolean;
    ai: { kimi: boolean; deepseek: boolean };
    description: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
      checkNetworkStatus();
    }
  }, [user, filterType]);

  useEffect(() => {
    // 监听网络状态变化
    const unsubscribe = NetworkUtils.onNetworkChange((online) => {
      if (online) {
        setSuccessMessage('网络连接已恢复');
        checkNetworkStatus();
      } else {
        setError('网络连接已断开，正在使用离线模式');
      }
    });

    return unsubscribe;
  }, []);

  // 页面加载时清除所有错误状态
  useEffect(() => {
    setError(null);
    setSuccessMessage('');
  }, []);

  // 监听成功消息变化，确保显示成功消息时清除错误
  useEffect(() => {
    if (successMessage) {
      setError(null); // 显示成功消息时立即清除错误
    }
  }, [successMessage]);

  const checkNetworkStatus = async () => {
    try {
      const status = await NetworkUtils.getNetworkStatus();
      setNetworkStatus(status);
    } catch (error) {
      console.error('检查网络状态失败:', error);
    }
  };

  const loadConversations = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      const typeFilter = filterType === 'all' ? undefined : filterType;
      const conversationList = await aiService.getConversations(user.id, 50, 0, typeFilter);
      // 当选择“所有对话”时，确保只展示通用/女性安全/紧急/安全分析，排除路线推荐与挑战竞赛
      const allowedTypesForAll = ['general', 'women_safety', 'emergency', 'safety'];
      const normalizedList = (filterType === 'all')
        ? conversationList.filter(c => allowedTypesForAll.includes(c.conversationType))
        : conversationList;
      setConversations(normalizedList);
      
      // 如果没有选中的对话，选择第一个
      if (!selectedConversation && conversationList.length > 0) {
        setSelectedConversation(conversationList[0]);
      }
    } catch (error) {
      console.error('加载对话列表失败:', error);
      setError('加载对话列表失败');
      // 如果是数据库连接问题，使用本地存储作为备选方案
      const localConversations = getLocalConversations();
      setConversations(localConversations);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewConversation = async () => {
    if (!user) return;

    try {
      setIsCreating(true);
      setError(null); // 清除之前的错误
      
      const newConversation = await aiService.createConversation(user.id, {
        conversationType: filterType === 'all' ? 'general' : filterType,
        title: '新对话',
      });
      
      setConversations([newConversation, ...conversations]);
      setSelectedConversation(newConversation);
      setSuccessMessage('新对话创建成功');
      
      // 确保成功后清除任何残留错误
      setError(null);
      
      // 保存到本地存储作为备份
      saveConversationToLocal(newConversation);
    } catch (error) {
      console.error('创建新对话失败:', error);
      setError('创建新对话失败');
      
      // 如果服务器创建失败，创建本地对话
      const localConversation = createLocalConversation(user.id, filterType === 'all' ? 'general' : filterType);
      setConversations([localConversation, ...conversations]);
      setSelectedConversation(localConversation);
      setSuccessMessage('已在本地创建新对话');
      saveConversationToLocal(localConversation);
    } finally {
      setIsCreating(false);
    }
  };

  // 本地存储备选方案
  const getLocalConversations = (): AIConversation[] => {
    try {
      if (filterType === 'all') {
        // 仅聚合通用/女性安全/紧急/安全分析，避免跨页面历史干扰
        const types = ['general', 'women_safety', 'emergency', 'safety'];
        const merged: AIConversation[] = [];
        types.forEach(t => {
          const stored = localStorage.getItem(`ai_conversations_${t}`);
          const arr = stored ? JSON.parse(stored) : [];
          merged.push(...arr);
        });
        // 最新更新靠前
        return merged.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }
      const stored = localStorage.getItem(`ai_conversations_${filterType}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveConversationToLocal = (conversation: AIConversation) => {
    try {
      const key = `ai_conversations_${conversation.conversationType || 'general'}`;
      const existingRaw = localStorage.getItem(key);
      const existing: AIConversation[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [conversation, ...existing.filter(c => c.id !== conversation.id)];
      localStorage.setItem(key, JSON.stringify(updated.slice(0, 50))); // 只保存最近50个
    } catch (error) {
      console.error('保存到本地存储失败:', error);
    }
  };

  const createLocalConversation = (userId: string, type: string = 'general'): AIConversation => {
    const now = new Date();
    return {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      title: '新对话',
      aiProvider: 'kimi',
      conversationType: type as any,
      isEmergency: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      messages: [],
      messageCount: 0,
    };
  };

  const deleteConversation = async (conversationId: string) => {
    if (!user) return;

    try {
      setError(null); // 清除之前的错误
      await aiService.deleteConversation(conversationId);
      const updatedConversations = conversations.filter(c => c.id !== conversationId);
      setConversations(updatedConversations);
      
      // 如果删除的是当前选中的对话，选择第一个可用的对话
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(updatedConversations.length > 0 ? updatedConversations[0] : null);
      }
      
      setSuccessMessage('对话删除成功');
      
      // 确保成功后清除任何残留错误
      setError(null);
      
      // 从本地存储中删除
      const localConversations = getLocalConversations().filter(c => c.id !== conversationId);
      const key = `ai_conversations_${selectedConversation?.conversationType || 'general'}`;
      const existingRaw = localStorage.getItem(key);
      const existing: AIConversation[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = existing.filter(c => c.id !== conversationId);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (error) {
      console.error('删除对话失败:', error);
      setError('删除对话失败');
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conversation.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getConversationTypeLabel = (type: string) => {
    switch (type) {
      case 'general':
        return '通用对话';
      case 'women_safety':
        return '女性安全';
      case 'emergency':
        return '紧急情况';
      case 'safety':
        return '安全分析';
      case 'route_recommendation':
        return '路线推荐';
      case 'challenge_competition':
        return '挑战竞赛';
      default:
        return '未知类型';
    }
  };

  const getConversationTypeColor = (type: string) => {
    switch (type) {
      case 'general':
        return 'bg-blue-100 text-blue-700';
      case 'women_safety':
        return 'bg-pink-100 text-pink-700';
      case 'emergency':
        return 'bg-red-100 text-red-700';
      case 'safety':
        return 'bg-purple-100 text-purple-700';
      case 'route_recommendation':
        return 'bg-green-100 text-green-700';
      case 'challenge_competition':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">AI智能对话</h2>
          <p className="text-gray-600 mb-6">请先登录以开始与AI助手对话</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 错误和成功提示 */}
      <ErrorToast 
        error={error} 
        onClose={() => setError(null)} 
        showNetworkStatus={true}
      />
      <SuccessToast 
        message={successMessage} 
        onClose={() => setSuccessMessage(null)} 
      />

      {/* 侧边栏 */}
      {showSidebar && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* 侧边栏头部 */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">对话历史</h2>
              <button
                onClick={createNewConversation}
                disabled={isCreating}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </button>
            </div>
            
            {/* 网络状态指示器 */}
            {networkStatus && (
              <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600">
                  {networkStatus.description}
                </div>
              </div>
            )}
            
            {/* 搜索框 */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索对话..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* 过滤器 */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="all">所有对话</option>
                <option value="general">通用对话</option>
                <option value="women_safety">女性安全</option>
                <option value="emergency">紧急情况</option>
                <option value="safety">安全分析</option>
                {/* 移除路线推荐与挑战竞赛，保持页面历史独立 */}
              </select>
            </div>
          </div>

          {/* 对话列表 */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">加载中...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">暂无对话记录</p>
                <p className="text-xs mt-1">点击"+"创建新对话</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`
                      p-3 rounded-lg cursor-pointer transition-colors group
                      ${selectedConversation?.id === conversation.id 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-50 border border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {conversation.title}
                          </h3>
                          <span className={`
                            px-1.5 py-0.5 text-xs rounded-full
                            ${getConversationTypeColor(conversation.conversationType)}
                          `}>
                            {getConversationTypeLabel(conversation.conversationType)}
                          </span>
                        </div>
                        
                        {conversation.lastMessage && (
                          <p className="text-xs text-gray-600 truncate mb-1">
                            {conversation.lastMessage}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>
                            {conversation.updatedAt.toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>{conversation.messageCount || 0} 条消息</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // 编辑对话标题的逻辑
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conversation.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ChatInterface 
            conversation={selectedConversation}
            conversationType={selectedConversation?.conversationType || 'general'}
            onConversationUpdate={(updatedConversation) => {
              setSelectedConversation(updatedConversation);
              setConversations(conversations.map(c => 
                c.id === updatedConversation.id ? updatedConversation : c
              ));
              // 成功更新对话后清除错误
              setError(null);
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center max-w-md mx-auto p-8">
              <Bot className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">AI智能对话</h2>
            <p className="text-gray-600 mb-6">
              我是您的智能顾问，可以提供安全建议、路线参考等帮助。
            </p>
              <button
                onClick={createNewConversation}
                disabled={isCreating}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                创建新对话
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};