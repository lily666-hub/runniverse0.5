// 对话创建调试页面
import React, { useState } from 'react';
import { MessageCircle, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { aiService } from '../services/ai';
import { useAuthStore } from '../store/authStore';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  data?: any;
}

export const ConversationDebug: React.FC = () => {
  const { user } = useAuthStore();
  const [tests, setTests] = useState<TestResult[]>([
    { name: '环境变量检查', status: 'pending' },
    { name: 'KIMI API连接测试', status: 'pending' },
    { name: '数据库连接测试', status: 'pending' },
    { name: '创建对话测试', status: 'pending' },
    { name: '发送消息测试', status: 'pending' },
  ]);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => i === index ? { ...test, ...updates } : test));
  };

  const runAllTests = async () => {
    if (!user) {
      alert('请先登录');
      return;
    }

    // 1. 环境变量检查
    updateTest(0, { status: 'running' });
    try {
      const kimiKey = import.meta.env.VITE_KIMI_API_KEY;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!kimiKey || !supabaseUrl || !supabaseKey) {
        throw new Error('关键环境变量缺失');
      }
      
      updateTest(0, { 
        status: 'success', 
        message: '所有环境变量已正确配置',
        data: { 
          kimiKey: kimiKey ? `${kimiKey.substring(0, 10)}...` : '未配置',
          supabaseUrl: supabaseUrl ? '已配置' : '未配置',
          supabaseKey: supabaseKey ? '已配置' : '未配置'
        }
      });
    } catch (error) {
      updateTest(0, { 
        status: 'error', 
        message: error instanceof Error ? error.message : '环境变量检查失败' 
      });
      return;
    }

    // 2. KIMI API连接测试
    updateTest(1, { status: 'running' });
    try {
      const connections = await aiService.testConnections();
      if (connections.kimi) {
        updateTest(1, { 
          status: 'success', 
          message: 'KIMI API连接正常',
          data: connections
        });
      } else {
        throw new Error('KIMI API连接失败');
      }
    } catch (error) {
      updateTest(1, { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'KIMI API连接测试失败' 
      });
      return;
    }

    // 3. 数据库连接测试
    updateTest(2, { status: 'running' });
    try {
      const conversations = await aiService.getConversations(user.id, 1);
      updateTest(2, { 
        status: 'success', 
        message: '数据库连接正常',
        data: { conversationCount: conversations.length }
      });
    } catch (error) {
      updateTest(2, { 
        status: 'error', 
        message: error instanceof Error ? error.message : '数据库连接测试失败' 
      });
      return;
    }

    // 4. 创建对话测试
    updateTest(3, { status: 'running' });
    try {
      const conversation = await aiService.createConversation(user.id, {
        title: '调试测试对话',
        provider: 'kimi',
        conversationType: 'general'
      });
      
      updateTest(3, { 
        status: 'success', 
        message: '对话创建成功',
        data: { 
          conversationId: conversation.id,
          title: conversation.title,
          provider: conversation.aiProvider
        }
      });

      // 5. 发送消息测试
      updateTest(4, { status: 'running' });
      try {
        const result = await aiService.sendMessage(
          user.id,
          '你好，这是一个测试消息',
          conversation.id
        );
        
        updateTest(4, { 
          status: 'success', 
          message: '消息发送成功',
          data: { 
            userMessage: result.userMessage.content,
            aiResponse: result.response.message.substring(0, 100) + '...'
          }
        });
      } catch (error) {
        updateTest(4, { 
          status: 'error', 
          message: error instanceof Error ? error.message : '消息发送测试失败' 
        });
      }
    } catch (error) {
      updateTest(3, { 
        status: 'error', 
        message: error instanceof Error ? error.message : '创建对话测试失败' 
      });
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-500';
      case 'running':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-6">
            <MessageCircle className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">对话创建调试工具</h1>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">用户状态</h3>
            {user ? (
              <div className="text-blue-800">
                <p>用户ID: {user.id}</p>
                <p>用户名: {user.name}</p>
                <p>邮箱: {user.email}</p>
              </div>
            ) : (
              <p className="text-yellow-800">请先登录以进行调试测试</p>
            )}
          </div>

          <div className="space-y-4 mb-6">
            {tests.map((test, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  {getStatusIcon(test.status)}
                  <h3 className={`font-medium ${getStatusColor(test.status)}`}>
                    {test.name}
                  </h3>
                </div>
                
                {test.message && (
                  <p className={`text-sm ${getStatusColor(test.status)} ml-7`}>
                    {test.message}
                  </p>
                )}
                
                {test.data && (
                  <div className="ml-7 mt-2">
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(test.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={runAllTests}
            disabled={!user || tests.some(t => t.status === 'running')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 mr-2" />
            开始调试测试
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationDebug;