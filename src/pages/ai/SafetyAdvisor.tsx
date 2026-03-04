// 安全顾问AI对话页面 - 优化版
import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  MessageCircle, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  User, 
  Settings,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Loader2,
  Heart,
  Navigation,
  Phone
} from 'lucide-react';
import { enhancedAIService } from '../../services/ai/enhancedAIService';
import { TTSService } from '../../services/ttsService';
import { useAuthStore } from '../../store/authStore';
import { ErrorToast, SuccessToast } from '../../components/common/ErrorToast';

// 创建TTS服务实例
const ttsService = new TTSService({
  provider: 'browser',
  volume: 50,
  speed: 1.0
});
import type { AIConversation, AIMessage } from '../../types/ai';

interface SafetyContext {
  timeOfDay: string;
  location: string;
  lightingCondition?: string;
  concerns: string[];
  emergencyContacts: any[];
}

interface EmergencyDetails {
  type: string;
  location?: string;
  description: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

export const SafetyAdvisor: React.FC = () => {
  const { user } = useAuthStore();
  const [conversation, setConversation] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // 安全上下文状态
  const [safetyContext, setSafetyContext] = useState<SafetyContext>({
    timeOfDay: '白天',
    location: '',
    concerns: [],
    emergencyContacts: []
  });
  
  // 语音功能状态
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  // 快捷咨询选项
  const [selectedConsultationType, setSelectedConsultationType] = useState<'general' | 'women_safety' | 'emergency'>('general');

  useEffect(() => {
    if (user) {
      initializeSafetyContext();
    }
  }, [user]);

  const initializeSafetyContext = () => {
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay = hour >= 6 && hour < 18 ? '白天' : hour >= 18 && hour < 22 ? '傍晚' : '夜间';
    
    setSafetyContext(prev => ({
      ...prev,
      timeOfDay,
      location: '当前位置'
    }));
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      const result = await enhancedAIService.sendEnhancedMessage(
        user.id,
        inputMessage,
        conversation?.id,
        {
          safetyContext: {
            timeOfDay: safetyContext.timeOfDay,
            lightingCondition: safetyContext.lightingCondition || 'unknown'
          }
        },
        'kimi',
        selectedConsultationType
      );

      setConversation(result.conversation);
      setMessages([...messages, result.userMessage, result.aiMessage]);
      setInputMessage('');

      // 如果启用语音，播放AI回复
      if (voiceEnabled && result.aiMessage.content) {
        await playAIResponse(result.aiMessage.content);
      }

      setSuccessMessage('消息发送成功');
    } catch (error) {
      console.error('发送消息失败:', error);
      setError('发送消息失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWomenSafetyConsultation = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const result = await enhancedAIService.getWomenSafetyAdvice(user.id, safetyContext);
      
      setConversation(result.conversation);
      setMessages(result.conversation.messages || []);
      setSelectedConsultationType('women_safety');

      if (voiceEnabled && result.response.message) {
        await playAIResponse(result.response.message);
      }

      setSuccessMessage('女性安全咨询已启动');
    } catch (error) {
      console.error('女性安全咨询失败:', error);
      setError('启动女性安全咨询失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencyConsultation = async (emergencyDetails: EmergencyDetails) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const result = await enhancedAIService.handleEmergencySituation(user.id, emergencyDetails);
      
      setConversation(result.conversation);
      setMessages(result.conversation.messages || []);
      setSelectedConsultationType('emergency');

      if (voiceEnabled && result.response.message) {
        await playAIResponse(result.response.message);
      }

      setSuccessMessage('紧急咨询已启动');
    } catch (error) {
      console.error('紧急咨询失败:', error);
      setError('启动紧急咨询失败');
    } finally {
      setIsLoading(false);
    }
  };

  const playAIResponse = async (text: string) => {
    try {
      setIsSpeaking(true);
      await ttsService.synthesize(text, {
        voice: 'female',
        speed: 1.0,
        pitch: 1.0,
        volume: 0.8
      });
    } catch (error) {
      console.error('语音播放失败:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      // 停止语音输入
      setIsListening(false);
    } else {
      // 开始语音输入
      setIsListening(true);
      // 这里可以集成语音识别API
    }
  };

  const toggleVoiceOutput = () => {
    setVoiceEnabled(!voiceEnabled);
    if (isSpeaking) {
      ttsService.stop();
      setIsSpeaking(false);
    }
  };

  const quickEmergencyCall = () => {
    const emergencyDetails: EmergencyDetails = {
      type: '紧急求助',
      location: '当前位置',
      description: '需要立即帮助',
      urgencyLevel: 'critical'
    };
    handleEmergencyConsultation(emergencyDetails);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">路线小助手</h2>
          <p className="text-gray-600 mb-6">请先登录以使用安全顾问服务</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 错误和成功提示 */}
      <ErrorToast error={error} onClose={() => setError(null)} />
      <SuccessToast message={successMessage} onClose={() => setSuccessMessage(null)} />

      {/* 头部 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">路线小助手</h1>
              <p className="text-sm text-gray-600">专业的跑步安全咨询服务</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* 语音控制 */}
            <button
              onClick={toggleVoiceOutput}
              className={`p-2 rounded-lg transition-colors ${
                voiceEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            
            {/* 紧急呼叫 */}
            <button
              onClick={quickEmergencyCall}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Phone className="w-4 h-4" />
              <span>紧急求助</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* 侧边栏 - 安全上下文和快捷选项 */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* 安全上下文 */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">安全上下文</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">跑步时间</label>
                <select
                  value={safetyContext.timeOfDay}
                  onChange={(e) => setSafetyContext(prev => ({ ...prev, timeOfDay: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="白天">白天 (6:00-18:00)</option>
                  <option value="傍晚">傍晚 (18:00-22:00)</option>
                  <option value="夜间">夜间 (22:00-6:00)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">当前位置</label>
                <input
                  type="text"
                  value={safetyContext.location || ''}
                  onChange={(e) => setSafetyContext(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="输入当前位置"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 快捷咨询选项 */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">快捷咨询</h3>
            
            <div className="space-y-2">
              <button
                onClick={() => setSelectedConsultationType('general')}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedConsultationType === 'general' 
                    ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-5 h-5" />
                  <div>
                    <div className="font-medium">通用安全咨询</div>
                    <div className="text-xs text-gray-500">一般跑步安全问题</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={handleWomenSafetyConsultation}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedConsultationType === 'women_safety' 
                    ? 'bg-pink-50 border border-pink-200 text-pink-700' 
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Heart className="w-5 h-5" />
                  <div>
                    <div className="font-medium">女性专属安全</div>
                    <div className="text-xs text-gray-500">女性跑步者专门咨询</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  const emergencyDetails: EmergencyDetails = {
                    type: '一般紧急情况',
                    location: safetyContext.location || '当前位置',
                    description: '需要安全建议',
                    urgencyLevel: 'medium'
                  };
                  handleEmergencyConsultation(emergencyDetails);
                }}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedConsultationType === 'emergency' 
                    ? 'bg-red-50 border border-red-200 text-red-700' 
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5" />
                  <div>
                    <div className="font-medium">紧急情况处理</div>
                    <div className="text-xs text-gray-500">紧急安全求助</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 安全提示 */}
          <div className="flex-1 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">安全提示</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-700">位置安全</span>
                </div>
                <p>选择光线充足、人流适中的跑步路线</p>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-700">时间规划</span>
                </div>
                <p>告知家人朋友您的跑步计划和预计返回时间</p>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <User className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-purple-700">个人安全</span>
                </div>
                <p>携带手机、哨子等安全设备，保持警觉</p>
              </div>
            </div>
          </div>
        </div>

        {/* 主对话区域 */}
        <div className="flex-1 flex flex-col">
          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">欢迎使用路线小助手</h3>
                <p className="text-gray-600 mb-6">我是您的专业跑步安全顾问，有什么可以帮助您的吗？</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setInputMessage('我想了解夜间跑步的安全注意事项')}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    夜间跑步安全
                  </button>
                  <button
                    onClick={() => setInputMessage('女性跑步者需要注意什么？')}
                    className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors"
                  >
                    女性安全指南
                  </button>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <div className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-gray-600">AI正在思考...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 输入区域 */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleVoiceInput}
                className={`p-2 rounded-lg transition-colors ${
                  isListening ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="输入您的安全问题..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>
              
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};