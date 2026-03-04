// AI对话界面组件
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertTriangle, Loader2, Sparkles, Image, X, WifiOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { enhancedAIService } from '../../services/ai/enhancedAIService';
import { useAuthStore } from '../../store/authStore';
import { imageUploadService } from '../../services/imageUploadService';
import { imageAnalysisService } from '../../services/ai/imageAnalysisService';
import type { AIMessage, AIConversation, AIResponse, ImageUploadResponse } from '../../types/ai';
import ImageUpload from './ImageUpload';
import ImagePreview from './ImagePreview';

interface ChatInterfaceProps {
  conversationId?: string;
  conversation?: AIConversation;
  conversationType?: 'safety' | 'emergency' | 'general' | 'women_safety' | 'route_recommendation' | 'challenge_competition';
  provider?: 'kimi' | 'deepseek';
  context?: any;
  onConversationCreated?: (conversation: AIConversation) => void;
  onConversationUpdate?: (conversation: AIConversation) => void;
  onMessageSent?: (message: AIMessage, response: AIResponse) => void;
  onMessagesUpdate?: (messages: AIMessage[]) => void;
  className?: string;
  placeholder?: string;
  expandedMode?: boolean;
  allowAnonymous?: boolean;
  anonymousId?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  conversation: propConversation,
  conversationType = 'general',
  provider,
  context,
  onConversationCreated,
  onConversationUpdate,
  onMessageSent,
  onMessagesUpdate,
  className = '',
  placeholder = '输入您的消息...',
  expandedMode = false,
  allowAnonymous = false,
  anonymousId,
}) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<AIConversation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<ImageUploadResponse[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getOrCreateAnonymousId = (): string => {
    try {
      const key = 'anonymous_user_id';
      const existing = localStorage.getItem(key);
      if (existing && existing.length > 0) return existing;
      const generated = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(key, generated);
      return generated;
    } catch {
      // 作为兜底，返回一个固定ID（不会持久化）
      return 'anon_local_session';
    }
  };

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 通知父组件消息更新
  useEffect(() => {
    onMessagesUpdate?.(messages);
  }, [messages, onMessagesUpdate]);

  // 处理传入的对话对象
  useEffect(() => {
    if (propConversation) {
      setConversation(propConversation);
      setMessages(propConversation.messages || []);
    }
  }, [propConversation]);

  // 加载现有对话
  useEffect(() => {
    if (conversationId && !propConversation) {
      loadConversation();
    }
  }, [conversationId, propConversation]);

  // 监听快速消息事件
  useEffect(() => {
    const handleQuickMessage = (event: CustomEvent) => {
      const message = event.detail;
      if (message && !isLoading) {
        setInputMessage(message);
        // 自动发送消息
        setTimeout(() => {
          sendMessage();
        }, 100);
      }
    };

    window.addEventListener('sendQuickMessage', handleQuickMessage as EventListener);
    
    return () => {
      window.removeEventListener('sendQuickMessage', handleQuickMessage as EventListener);
    };
  }, [isLoading]);

  const loadConversation = async () => {
    if (!conversationId) return;

    console.group('📂 ChatInterface - 加载对话');
    console.log('📊 加载参数:', {
      conversationId,
      userId: user?.id,
      timestamp: new Date().toISOString()
    });

    try {
      const conv = await enhancedAIService.getConversation(conversationId);
      if (conv) {
        console.log('✅ 对话加载成功:', {
          conversationId: conv.id,
          title: conv.title,
          messageCount: conv.messages?.length || 0,
          conversationType: conv.conversationType
        });
        setConversation(conv);
        setMessages(conv.messages || []);
      } else {
        console.warn('⚠️ 对话不存在:', conversationId);
        setError('对话不存在或已被删除');
      }
      console.groupEnd();
    } catch (error) {
      console.group('❌ 加载对话错误详情');
      console.error('错误类型:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('错误消息:', error instanceof Error ? error.message : String(error));
      console.error('完整错误:', error);
      console.error('对话ID:', conversationId);
      console.groupEnd();
      
      let errorMessage = '加载对话失败';
      if (error instanceof Error) {
        if (error.message.includes('离线对话不存在')) {
          errorMessage = '离线对话不存在，将为您创建新的对话';
          // 清除当前对话状态，让系统重新创建
          setConversation(null);
        } else if (error.message.includes('权限')) {
          errorMessage = '无权访问此对话';
        } else if (error.message.includes('网络')) {
          errorMessage = '网络连接异常，无法加载对话';
          setIsOfflineMode(true);
        } else if (error.message.includes('API密钥') || error.message.includes('认证')) {
          errorMessage = 'AI服务暂时不可用，请稍后重试';
          setIsOfflineMode(true);
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    }
  };

  const handleImageUpload = async (images: ImageUploadResponse[]) => {
    setUploadedImages(prev => [...prev, ...images]);
    setShowImageUpload(false);
  };

  const removeImage = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() && uploadedImages.length === 0) return;
    if (isLoading) return;
    if (!user && !allowAnonymous) return;

    let userMessage = inputMessage.trim();
    let imageAnalysis = '';
    
    // 如果有上传的图片，先进行图片分析
    if (uploadedImages.length > 0) {
      setIsAnalyzing(true);
      try {
        const analysisResults = await Promise.all(
          uploadedImages.map(async (image) => {
            const result = await imageAnalysisService.analyzeImage({
              imageUrl: image.url,
              analysisType: 'general',
              context: userMessage || '请描述这张图片的内容'
            });
            return {
              image: image,
              analysis: result.description
            };
          })
        );

        imageAnalysis = analysisResults
          .map(result => `图片分析: ${result.analysis}`)
          .join('\n');
      } catch (error) {
        console.error('图片分析失败:', error);
        imageAnalysis = '图片分析失败，请稍后重试。';
      } finally {
        setIsAnalyzing(false);
      }
    }

    // 组合文本和图片分析内容
    const finalContent = [userMessage, imageAnalysis]
      .filter(Boolean)
      .join('\n\n');

    setInputMessage('');
    setIsLoading(true);
    setError(null);

    console.group('🗨️ ChatInterface - 发送消息');
    console.log('📊 请求参数:', {
      userId: user?.id || anonymousId || getOrCreateAnonymousId(),
      message: userMessage,
      conversationId: conversationId || propConversation?.id,
      conversationType,
      provider,
      hasContext: !!context,
      hasImages: uploadedImages.length > 0,
      imageCount: uploadedImages.length,
      timestamp: new Date().toISOString()
    });

    try {
      // 使用增强版发送，避免后端存储失败触发离线兜底
      const result = await enhancedAIService.sendEnhancedMessage(
        user?.id || anonymousId || getOrCreateAnonymousId(),
        finalContent,
        conversationId || propConversation?.id,
        context,
        provider,
        conversationType,
        uploadedImages
      );

      console.log('✅ 消息发送成功:', {
        conversationId: result.conversation.id,
        userMessageId: result.userMessage.id,
        aiMessageId: result.aiMessage.id,
        emergencyLevel: result.response.emergencyLevel
      });

      // 更新对话状态
      const currentConversation = conversation || propConversation;
      if (!currentConversation) {
        console.log('🆕 创建新对话:', result.conversation.id);
        setConversation(result.conversation);
        onConversationCreated?.(result.conversation);
      } else {
        console.log('🔄 更新现有对话:', result.conversation.id);
        setConversation(result.conversation);
        onConversationUpdate?.(result.conversation);
      }

      // 更新消息列表
      setMessages(prev => [...prev, result.userMessage, result.aiMessage]);

      // 通知父组件
      onMessageSent?.(result.userMessage, result.response);

      // 成功发送后，确保退出离线模式
      if (isOfflineMode) {
        setIsOfflineMode(false);
      }

      // 如果是紧急情况，显示特殊提示
      if (result.response.emergencyLevel === 'critical' || result.response.emergencyLevel === 'high') {
        console.warn('🚨 检测到紧急情况:', result.response);
      }
      
      console.groupEnd();
    } catch (error) {
      console.group('❌ ChatInterface 错误详情');
      console.error('错误类型:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('错误消息:', error instanceof Error ? error.message : String(error));
      console.error('完整错误:', error);
      console.error('用户信息:', {
        userId: user?.id || anonymousId || 'anon',
        userEmail: user?.email,
        isDemo: !!user && (user.id.includes('demo') || user.id.startsWith('00000000-0000-0000-0000-'))
      });
      const currentConversation = conversation || propConversation;
      console.error('请求上下文:', {
        conversationId: conversationId || propConversation?.id,
        currentConversationId: currentConversation?.id,
        conversationType,
        provider,
        hasContext: !!context
      });
      console.groupEnd();
      
      // 详细的错误分类和处理
      const errorInfo = classifyError(error);
      
      if (errorInfo.isOfflineError) {
        setIsOfflineMode(true);
        console.warn('🔄 已自动切换为离线模式');
      }
      
      // 设置用户友好的错误消息
      setError(errorInfo.userMessage);
      
      // 显示错误提示 - 离线模式下不显示错误提示，只显示离线指示器
      if (!errorInfo.isOfflineError) {
        toast.error(errorInfo.userMessage, {
          description: errorInfo.description,
          duration: 5000,
          action: errorInfo.showRetry ? {
            label: '重试',
            onClick: retryLastMessage
          } : undefined
        });
      }
      
      setRetryCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const retryLastMessage = async () => {
    if (!inputMessage.trim() && messages.length > 0) {
      // 重试最后一条用户消息
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      if (lastUserMessage) {
        setInputMessage(lastUserMessage.content);
        setError(null);
        setRetryCount(0);
      }
    } else {
      // 重试当前输入
      setError(null);
      setRetryCount(0);
      await sendMessage();
    }
  };

  const clearError = () => {
    setError(null);
    setRetryCount(0);
  };

  /**
   * 错误分类和处理函数
   */
  const classifyError = (error: unknown): {
    isOfflineError: boolean;
    userMessage: string;
    description: string;
    showRetry: boolean;
    category: 'network' | 'auth' | 'permission' | 'service' | 'image' | 'unknown';
  } => {
    const defaultError = {
      isOfflineError: false,
      userMessage: '发送消息失败，已自动切换为本地智能响应',
      description: '',
      showRetry: true,
      category: 'unknown' as const
    };

    if (!(error instanceof Error)) {
      return {
        ...defaultError,
        isOfflineError: true,
        userMessage: 'AI服务暂时不可用，已自动切换为本地智能响应'
      };
    }

    const errorMessage = error.message.toLowerCase();

    // 网络相关错误 - 自动切换离线模式
    if (errorMessage.includes('网络') || errorMessage.includes('连接') || 
        errorMessage.includes('timeout') || errorMessage.includes('fetch') ||
        errorMessage.includes('network') || errorMessage.includes('connection') ||
        errorMessage.includes('failed to fetch')) {
      return {
        isOfflineError: true,
        userMessage: '网络连接异常，已自动切换为本地智能响应',
        description: '请检查网络连接或稍后重试',
        showRetry: true,
        category: 'network'
      };
    }

    // 认证相关错误 - 自动切换离线模式
    if (errorMessage.includes('api密钥') || errorMessage.includes('认证') || 
        errorMessage.includes('invalid authentication') || errorMessage.includes('unauthorized') ||
        errorMessage.includes('api key') || errorMessage.includes('forbidden')) {
      return {
        isOfflineError: true,
        userMessage: 'AI服务认证失败，已自动切换为本地智能响应',
        description: 'AI服务暂时不可用，请稍后重试',
        showRetry: true,
        category: 'auth'
      };
    }

    // 服务相关错误 - 自动切换离线模式
    if (errorMessage.includes('服务') || errorMessage.includes('service') || 
        errorMessage.includes('api') || errorMessage.includes('server') ||
        errorMessage.includes('unavailable') || errorMessage.includes('maintenance') ||
        errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
      return {
        isOfflineError: true,
        userMessage: 'AI服务暂时不可用，已自动切换为本地智能响应',
        description: '服务可能正在维护，请稍后重试',
        showRetry: true,
        category: 'service'
      };
    }

    // 权限相关错误 - 不切换离线模式
    if (errorMessage.includes('权限') || errorMessage.includes('permission') || 
        errorMessage.includes('access denied')) {
      return {
        isOfflineError: false,
        userMessage: '权限不足，请重新登录或联系管理员',
        description: '当前用户权限无法执行此操作',
        showRetry: false,
        category: 'permission'
      };
    }

    // 图片相关错误 - 不切换离线模式
    if (errorMessage.includes('图片') || errorMessage.includes('image') || 
        errorMessage.includes('上传') || errorMessage.includes('upload')) {
      return {
        isOfflineError: false,
        userMessage: '图片处理出现问题，请尝试重新上传或发送文字消息',
        description: '图片上传或分析失败',
        showRetry: true,
        category: 'image'
      };
    }

    // 对话相关错误 - 自动切换离线模式
    if (errorMessage.includes('创建对话失败') || errorMessage.includes('对话不存在') ||
        errorMessage.includes('conversation') || errorMessage.includes('offline')) {
      return {
        isOfflineError: true,
        userMessage: '对话服务暂时不可用，已自动切换为本地智能响应',
        description: '正在为您创建新的对话',
        showRetry: true,
        category: 'service'
      };
    }

    // 默认情况下，将未知错误也视为需要切换离线模式
    return {
      ...defaultError,
      isOfflineError: true,
      userMessage: 'AI服务响应异常，已自动切换为本地智能响应'
    };
  };

  const getMessageIcon = (role: 'user' | 'assistant') => {
    if (role === 'user') {
      return <User className="w-5 h-5 text-blue-600" />;
    }
    
    // 根据提供商显示不同图标
    const providerName = conversation?.aiProvider || provider || 'kimi';
    return (
      <div className="flex items-center space-x-1">
        <Bot className="w-5 h-5 text-purple-600" />
        <Sparkles className="w-3 h-3 text-yellow-500" />
        <span className="text-xs text-gray-500 uppercase">{providerName}</span>
      </div>
    );
  };

  const getConversationTypeColor = () => {
    switch (conversationType) {
      case 'emergency':
        return 'border-red-500 bg-red-50';
      case 'women_safety':
        return 'border-pink-500 bg-pink-50';
      case 'safety':
        return 'border-blue-500 bg-blue-50';
      case 'route_recommendation':
        return 'border-green-500 bg-green-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const getConversationTypeLabel = () => {
    switch (conversationType) {
      case 'emergency':
        return '紧急求助';
      case 'women_safety':
        return '女性安全';
      case 'safety':
        return '安全分析';
      case 'challenge_competition':
        return '挑战竞赛';
      case 'route_recommendation':
        return '路线推荐';
      case 'general':
        return 'AI智能对话';
      default:
        return 'AI智能对话';
    }
  };

  if (!user && !allowAnonymous) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        请先登录以使用当前AI功能
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${expandedMode ? 'h-[500px]' : 'h-full'} ${getConversationTypeColor()} rounded-lg border-2 ${className}`}>
      {/* 对话头部 */}
      <div className="flex items-center justify-between p-4 border-b bg-white/80 backdrop-blur-sm rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Bot className="w-6 h-6 text-purple-600" />
            {isOfflineMode && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">{getConversationTypeLabel()}</h3>
              {isOfflineMode && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  本地响应
                </span>
              )}
            </div>
            {conversation && (
              <p className="text-sm text-gray-500">{conversation.title}</p>
            )}
          </div>
        </div>
        
        {conversationType === 'emergency' && (
          <div className="flex items-center space-x-1 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">紧急模式</span>
          </div>
        )}
      </div>

      {/* 消息列表 */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 bg-white/50 ${expandedMode ? 'min-h-[400px]' : 'min-h-0'} pb-28`}>
        {messages.length === 0 && (
          <div className={`text-center text-gray-500 ${expandedMode ? 'py-12' : 'py-8'}`}>
            <Bot className={`mx-auto mb-4 text-gray-400 ${expandedMode ? 'w-16 h-16' : 'w-12 h-12'}`} />
            <p className={`font-medium mb-2 ${expandedMode ? 'text-xl' : 'text-lg'}`}>{getConversationTypeLabel()}</p>
            <p className={`${expandedMode ? 'text-base' : 'text-sm'}`}>
              {conversationType === 'emergency' && '我是您的紧急安全助手，请告诉我您遇到的情况。'}
              {conversationType === 'women_safety' && '我是您的女性专属安全顾问，为您提供个性化的安全建议。'}
              {conversationType === 'safety' && '我将为您分析当前环境的安全状况，提供专业建议。'}
              {conversationType === 'route_recommendation' && '我是您的路线推荐助手，为您提供个性化路线与导航建议。'}
              {conversationType === 'challenge_competition' && '我是您的专业跑步教练，为您提供个性化的训练计划和挑战推荐。'}
              {conversationType === 'general' && '我是您的AI智能对话助手，有什么可以帮助您的吗？'}
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 mt-1">
                    {getMessageIcon(message.role)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  
                  {/* 显示消息中的图片 */}
                  {message.images && message.images.length > 0 && (
                    <div className="mt-3">
                      <ImagePreview
                        images={message.images}
                        maxHeight={150}
                        showCaption={false}
                      />
                    </div>
                  )}
                  
                  {message.role === 'assistant' && message.confidenceScore && (
                    <div className="mt-2 text-xs text-gray-500">
                      置信度: {Math.round(message.confidenceScore * 100)}%
                    </div>
                  )}
                  <div className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 mt-1">
                    {getMessageIcon(message.role)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-purple-600" />
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                <span className="text-gray-500">AI正在思考...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 本地响应指示器 */}
      {isOfflineMode && !error && (
        <div className="mx-4 mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-yellow-700">
              <WifiOff className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">本地智能响应</span>
              <span className="text-xs text-yellow-600">AI 响应由本地智能生成</span>
            </div>
            <button
              onClick={() => setIsOfflineMode(false)}
              className="flex items-center space-x-1 text-xs text-yellow-600 hover:text-yellow-800 underline"
            >
              <RefreshCw className="w-3 h-3" />
              <span>尝试重新连接</span>
            </button>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
            <div className="flex items-center space-x-2">
              {retryCount < 3 && (
                <button
                  onClick={retryLastMessage}
                  disabled={isLoading}
                  className="text-xs text-red-600 hover:text-red-800 underline disabled:opacity-50"
                >
                  重试
                </button>
              )}
              <button
                onClick={clearError}
                className="text-xs text-red-600 hover:text-red-800 underline"
              >
                关闭
              </button>
            </div>
          </div>
          {retryCount >= 3 && (
            <div className="mt-2 text-xs text-red-600">
              多次重试失败，建议检查网络连接或稍后再试
            </div>
          )}
        </div>
      )}

      {/* 输入区域：底部粘性显示，保证随时可见 */}
      <div className={`p-4 border-t bg-white rounded-b-lg sticky bottom-0 z-10 ${expandedMode ? 'px-6 py-4' : ''}`}>
        {/* 图片预览区域 */}
        {uploadedImages.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">已选择 {uploadedImages.length} 张图片</span>
              <button
                onClick={() => setUploadedImages([])}
                className="text-xs text-red-500 hover:text-red-700"
              >
                清除全部
              </button>
            </div>
            <div className="flex space-x-2 overflow-x-auto">
              {uploadedImages.map((image) => (
                <div key={image.id} className="relative flex-shrink-0">
                  <img
                    src={image.url}
                    alt="预览"
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 图片分析状态 */}
        {isAnalyzing && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="font-medium">正在分析图片内容...</span>
            </div>
            <div className="mt-2 text-xs text-blue-500">
              正在处理 {uploadedImages.length} 张图片，请稍候
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              placeholder || (conversationType === 'emergency' 
                ? '请描述您遇到的紧急情况...'
                : '输入您的问题...')
            }
            className={`flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${expandedMode ? 'text-lg py-4' : ''}`}
            disabled={isLoading || isAnalyzing}
          />
          <button
            onClick={() => setShowImageUpload(true)}
            disabled={isLoading || isAnalyzing}
            className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            title="上传图片"
          >
            <Image className="w-5 h-5" />
          </button>
          <button
            onClick={sendMessage}
            disabled={(!inputMessage.trim() && uploadedImages.length === 0) || isLoading || isAnalyzing}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              conversationType === 'emergency'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading || isAnalyzing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {/* 快捷建议 */}
        {messages.length === 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {conversationType === 'emergency' && (
              <>
                <button
                  onClick={() => { setInputMessage('我遇到了危险，需要帮助'); setTimeout(() => sendMessage(), 50); }}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full hover:bg-red-200"
                >
                  遇到危险
                </button>
                <button
                  onClick={() => { setInputMessage('我迷路了，不知道怎么回家'); setTimeout(() => sendMessage(), 50); }}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full hover:bg-red-200"
                >
                  迷路求助
                </button>
              </>
            )}
            {conversationType === 'women_safety' && (
              <>
                <button
                  onClick={() => { setInputMessage('夜间跑步有什么安全建议？'); setTimeout(() => sendMessage(), 50); }}
                  className="px-3 py-1 text-sm bg-pink-100 text-pink-700 rounded-full hover:bg-pink-200"
                >
                  夜间跑步
                </button>
                <button
                  onClick={() => { setInputMessage('如何选择安全的跑步路线？'); setTimeout(() => sendMessage(), 50); }}
                  className="px-3 py-1 text-sm bg-pink-100 text-pink-700 rounded-full hover:bg-pink-200"
                >
                  路线选择
                </button>
              </>
            )}
            {conversationType === 'general' && (
              <>
                <button
                  onClick={() => { setInputMessage('分析一下我当前位置的安全状况'); setTimeout(() => sendMessage(), 50); }}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                >
                  安全分析
                </button>
                <button
                  onClick={() => { setInputMessage('给我一些跑步安全建议'); setTimeout(() => sendMessage(), 50); }}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                >
                  安全建议
                </button>
              </>
            )}
            {conversationType === 'challenge_competition' && (
              <>
                <button
                  onClick={() => { setInputMessage('为我推荐适合的竞赛方案'); setTimeout(() => sendMessage(), 50); }}
                  className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200"
                >
                  竞赛方案
                </button>
                <button
                  onClick={() => { setInputMessage('制定个性化训练计划'); setTimeout(() => sendMessage(), 50); }}
                  className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200"
                >
                  训练计划
                </button>
                <button
                  onClick={() => { setInputMessage('分析我的跑步数据和进步空间'); setTimeout(() => sendMessage(), 50); }}
                  className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200"
                >
                  数据分析
                </button>
                <button
                  onClick={() => { setInputMessage('如何突破个人最佳成绩'); setTimeout(() => sendMessage(), 50); }}
                  className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200"
                >
                  突破PB
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 图片上传模态框 */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">上传图片</h3>
              <button
                onClick={() => setShowImageUpload(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <ImageUpload
              onImageUpload={handleImageUpload}
              multiple={true}
              maxCount={5}
              conversationId={conversation?.id}
              className="mb-4"
            />
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowImageUpload(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};