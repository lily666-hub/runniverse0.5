import React, { useState, useEffect, useImperativeHandle } from 'react';
import { Search, Clock, MessageSquare, Trash2, Filter, ChevronRight } from 'lucide-react';
import type { AIMessage } from '../../types/ai';

export interface ChatHistoryItem {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  conversationType: string;
  messages: AIMessage[];
}

interface ChatHistoryProps {
  onSelectHistory: (history: ChatHistoryItem) => void;
  currentConversationId?: string;
  conversationType: string;
}

// 暴露给父组件的ref方法
export interface ChatHistoryRef {
  addOrUpdateHistory: (conversationId: string, messages: AIMessage[], title?: string) => void;
  loadHistories: () => void;
}

const ChatHistory = React.forwardRef<ChatHistoryRef, ChatHistoryProps>(({ onSelectHistory, currentConversationId, conversationType }, ref) => {
  const [histories, setHistories] = useState<ChatHistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // 从localStorage加载历史对话
  useEffect(() => {
    loadHistories();
  }, []);

  const loadHistories = () => {
    try {
      setIsLoading(true);
      const stored = localStorage.getItem(`chat_histories_${conversationType}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const historiesWithDates = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
          messages: item.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setHistories(historiesWithDates);
      }
    } catch (error) {
      console.error('加载历史对话失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 保存历史对话到localStorage
  const saveHistories = (newHistories: ChatHistoryItem[]) => {
    try {
      localStorage.setItem(`chat_histories_${conversationType}`, JSON.stringify(newHistories));
      setHistories(newHistories);
    } catch (error) {
      console.error('保存历史对话失败:', error);
    }
  };

  // 添加新对话或更新现有对话
  const addOrUpdateHistory = (conversationId: string, messages: AIMessage[], title?: string) => {
    const existingIndex = histories.findIndex(h => h.id === conversationId);
    const lastMessage = messages[messages.length - 1];
    const conversationTitle = title || generateTitle(messages);
    
    const newHistory: ChatHistoryItem = {
      id: conversationId,
      title: conversationTitle,
      lastMessage: lastMessage?.content?.substring(0, 100) || '',
      timestamp: new Date(),
      messageCount: messages.length,
      conversationType,
      messages: [...messages]
    };

    let newHistories;
    if (existingIndex >= 0) {
      newHistories = [...histories];
      newHistories[existingIndex] = newHistory;
    } else {
      newHistories = [newHistory, ...histories];
    }

    // 限制历史记录数量，最多保留50条
    if (newHistories.length > 50) {
      newHistories = newHistories.slice(0, 50);
    }

    saveHistories(newHistories);
  };

  // 通过ref暴露方法给父组件
  useImperativeHandle(ref, () => ({
    addOrUpdateHistory,
    loadHistories
  }));

  // 删除历史对话
  const deleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistories = histories.filter(h => h.id !== id);
    saveHistories(newHistories);
  };

  // 格式化日期
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return '今天';
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  // 生成标题
  const generateTitle = (messages: AIMessage[]): string => {
    if (messages.length === 0) return '新对话';
    const firstMessage = messages[0].content;
    return firstMessage.length > 20 ? firstMessage.substring(0, 20) + '...' : firstMessage;
  };

  // 过滤和搜索
  const filteredHistories = histories.filter(history => {
    const matchesSearch = history.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      history.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'today') {
      const now = new Date();
      return history.timestamp.toDateString() === now.toDateString();
    }

    if (filterType === 'week') {
      const now = new Date();
      const diff = now.getTime() - history.timestamp.getTime();
      return diff < 7 * 24 * 60 * 60 * 1000;
    }

    if (filterType === 'month') {
      const now = new Date();
      const diff = now.getTime() - history.timestamp.getTime();
      return diff < 30 * 24 * 60 * 60 * 1000;
    }

    return true;
  });

  return (
    <div ref={ref as any} className="p-2 sm:p-3">
      {/* 搜索和过滤 */}
      <div className="p-2 sm:p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索历史对话..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 text-gray-600" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="ml-2 text-xs border border-gray-200 rounded-md px-2 py-1"
            >
              <option value="all">全部</option>
              <option value="today">今天</option>
              <option value="week">本周</option>
              <option value="month">本月</option>
            </select>
          </div>
        </div>
      </div>

      {/* 历史列表 */}
      <div className="divide-y divide-gray-200">
        {isLoading ? (
          <div className="p-3 text-center text-gray-500 text-sm">加载中...</div>
        ) : filteredHistories.length === 0 ? (
          <div className="p-3 text-center text-gray-500 text-sm">暂无历史对话</div>
        ) : (
          filteredHistories.map((history) => (
            <div
              key={history.id}
              onClick={() => onSelectHistory(history)}
              className={`p-2 sm:p-3 hover:bg-gray-50 cursor-pointer transition-colors border-l-2 ${
                currentConversationId === history.id
                  ? 'bg-purple-50 border-l-purple-600'
                  : 'border-l-transparent'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-1">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-900 truncate flex-1">
                      {history.title}
                    </h4>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatDate(history.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                    {history.lastMessage}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center">
                      <MessageSquare className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                      {history.messageCount} 条消息
                    </span>
                    <button
                      onClick={(e) => deleteHistory(history.id, e)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* 底部统计 */}
      <div className="p-2 sm:p-3 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            <span>共 {histories.length} 条记录</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ChatHistory;