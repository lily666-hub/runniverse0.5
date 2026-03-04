// AI跑步助手组件 - 提供实时AI指导和建议
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageCircle, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Activity, 
  Heart, 
  Navigation,
  AlertTriangle,
  Target,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { UnifiedGPSAIService } from '../../services/unified/UnifiedGPSAIService';
import { SmartNavigationSessionManager } from '../../services/unified/SmartNavigationSession';
import type { 
  AIRunningAssistantProps,
  NavigationGuidance,
  FusedData,
  SafetyAlert,
  AIResponse
} from '../../types/unified';

export const AIRunningAssistant: React.FC<AIRunningAssistantProps> = ({
  isActive = false,
  currentRoute,
  onGuidanceReceived,
  onEmergencyAlert
}) => {
  const unifiedServiceRef = useRef<UnifiedGPSAIService | null>(null);
  const navigationSessionRef = useRef<SmartNavigationSession | null>(null);
  
  const [isAssistantActive, setIsAssistantActive] = useState(isActive);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentGuidance, setCurrentGuidance] = useState<NavigationGuidance | null>(null);
  const [recentMessages, setRecentMessages] = useState<AIResponse[]>([]);
  const [runningStats, setRunningStats] = useState({
    distance: 0,
    duration: 0,
    pace: 0,
    heartRate: 0,
    calories: 0
  });
  const [safetyStatus, setSafetyStatus] = useState<'safe' | 'warning' | 'danger'>('safe');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isNavigationActive, setIsNavigationActive] = useState(false);

  // 语音识别和合成
  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);

  // 初始化服务
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // 初始化统一服务
        unifiedServiceRef.current = UnifiedGPSAIService.getInstance();
        await unifiedServiceRef.current.initialize();

        // 初始化导航会话
        if (currentRoute) {
          navigationSessionRef.current = new SmartNavigationSession(
            unifiedServiceRef.current,
            currentRoute
          );
          await navigationSessionRef.current.initialize();
        }

        // 初始化语音服务
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = false;
          recognitionRef.current.lang = 'zh-CN';
          
          recognitionRef.current.onresult = handleSpeechResult;
          recognitionRef.current.onerror = handleSpeechError;
          recognitionRef.current.onend = () => setIsListening(false);
        }

        speechSynthesisRef.current = window.speechSynthesis;

        // 设置事件监听
        setupEventListeners();

        console.log('✅ AI跑步助手初始化完成');
      } catch (error) {
        console.error('❌ AI跑步助手初始化失败:', error);
      }
    };

    initializeServices();

    return () => {
      cleanup();
    };
  }, [currentRoute]);

  // 设置事件监听
  const setupEventListeners = () => {
    if (!unifiedServiceRef.current) return;

    // 监听统一数据更新
    unifiedServiceRef.current.on('unifiedDataUpdate', handleUnifiedDataUpdate);
    unifiedServiceRef.current.on('safetyAlert', handleSafetyAlert);
    unifiedServiceRef.current.on('aiResponse', handleAIResponse);

    // 监听导航事件
    if (navigationSessionRef.current) {
      navigationSessionRef.current.on('guidanceUpdate', handleGuidanceUpdate);
      navigationSessionRef.current.on('routeDeviation', handleRouteDeviation);
      navigationSessionRef.current.on('waypointReached', handleWaypointReached);
    }
  };

  // 清理资源
  const cleanup = () => {
    if (unifiedServiceRef.current) {
      unifiedServiceRef.current.off('unifiedDataUpdate', handleUnifiedDataUpdate);
      unifiedServiceRef.current.off('safetyAlert', handleSafetyAlert);
      unifiedServiceRef.current.off('aiResponse', handleAIResponse);
    }

    if (navigationSessionRef.current) {
      navigationSessionRef.current.off('guidanceUpdate', handleGuidanceUpdate);
      navigationSessionRef.current.off('routeDeviation', handleRouteDeviation);
      navigationSessionRef.current.off('waypointReached', handleWaypointReached);
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
  };

  // 处理统一数据更新
  const handleUnifiedDataUpdate = useCallback((data: FusedData) => {
    // 更新跑步统计
    setRunningStats(prev => ({
      ...prev,
      distance: data.gps.totalDistance || 0,
      duration: data.gps.duration || 0,
      pace: data.gps.speed ? (1000 / (data.gps.speed * 60)) : 0, // 分钟/公里
      heartRate: data.ai.context.health?.heartRate || 0,
      calories: data.ai.context.health?.calories || 0
    }));

    // 更新安全状态
    if (data.safety.alerts && data.safety.alerts.length > 0) {
      const highestLevel = data.safety.alerts.reduce((max, alert) => {
        if (alert.level === 'critical') return 'danger';
        if (alert.level === 'warning' && max !== 'danger') return 'warning';
        return max;
      }, 'safe' as 'safe' | 'warning' | 'danger');
      setSafetyStatus(highestLevel);
    } else {
      setSafetyStatus('safe');
    }
  }, []);

  // 处理安全警报
  const handleSafetyAlert = useCallback((alert: SafetyAlert) => {
    if (alert.level === 'critical' && onEmergencyAlert) {
      onEmergencyAlert(alert);
    }

    // 语音播报重要警报
    if (voiceEnabled && (alert.level === 'critical' || alert.level === 'warning')) {
      speakMessage(`安全警报：${alert.message}`);
    }
  }, [voiceEnabled, onEmergencyAlert]);

  // 处理AI响应
  const handleAIResponse = useCallback((response: AIResponse) => {
    setRecentMessages(prev => [...prev.slice(-4), response]);

    // 如果是重要建议，进行语音播报
    if (voiceEnabled && response.priority === 'high') {
      speakMessage(response.content);
    }
  }, [voiceEnabled]);

  // 处理导航指导更新
  const handleGuidanceUpdate = useCallback((guidance: NavigationGuidance) => {
    setCurrentGuidance(guidance);
    
    if (onGuidanceReceived) {
      onGuidanceReceived(guidance);
    }

    // 语音播报导航指导
    if (voiceEnabled && guidance.instruction) {
      speakMessage(guidance.instruction);
    }
  }, [voiceEnabled, onGuidanceReceived]);

  // 处理路线偏离
  const handleRouteDeviation = useCallback((deviation: any) => {
    if (voiceEnabled) {
      speakMessage('您已偏离路线，正在重新规划...');
    }
  }, [voiceEnabled]);

  // 处理途径点到达
  const handleWaypointReached = useCallback((waypoint: any) => {
    if (voiceEnabled) {
      speakMessage(`已到达${waypoint.name || '途径点'}`);
    }
  }, [voiceEnabled]);

  // 开始/停止助手
  const toggleAssistant = async () => {
    if (!unifiedServiceRef.current) return;

    try {
      if (isAssistantActive) {
        await unifiedServiceRef.current.stopUnifiedTracking();
        if (navigationSessionRef.current) {
          await navigationSessionRef.current.stop();
        }
        setIsAssistantActive(false);
        setIsNavigationActive(false);
      } else {
        await unifiedServiceRef.current.startUnifiedTracking({
          gpsOptions: {
            enableHighAccuracy: true,
            updateInterval: 2000
          },
          aiOptions: {
            contextAwareness: true,
            realtimeAnalysis: true
          }
        });

        if (navigationSessionRef.current && currentRoute) {
          await navigationSessionRef.current.start();
          setIsNavigationActive(true);
        }

        setIsAssistantActive(true);
      }
    } catch (error) {
      console.error('❌ 切换助手状态失败:', error);
    }
  };

  // 开始语音识别
  const startListening = () => {
    if (!recognitionRef.current || isListening) return;

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('❌ 开始语音识别失败:', error);
    }
  };

  // 停止语音识别
  const stopListening = () => {
    if (!recognitionRef.current || !isListening) return;

    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (error) {
      console.error('❌ 停止语音识别失败:', error);
    }
  };

  // 处理语音识别结果
  const handleSpeechResult = async (event: any) => {
    const transcript = event.results[0][0].transcript;
    console.log('🎤 语音识别结果:', transcript);

    if (!unifiedServiceRef.current) return;

    try {
      // 发送语音指令到AI服务
      const response = await unifiedServiceRef.current.sendMessage(transcript, {
        type: 'voice_command',
        context: {
          isRunning: isAssistantActive,
          currentStats: runningStats,
          safetyStatus
        }
      });

      if (response && voiceEnabled) {
        speakMessage(response.content);
      }
    } catch (error) {
      console.error('❌ 处理语音指令失败:', error);
    }
  };

  // 处理语音识别错误
  const handleSpeechError = (event: any) => {
    console.error('❌ 语音识别错误:', event.error);
    setIsListening(false);
  };

  // 语音播报
  const speakMessage = (message: string) => {
    if (!speechSynthesisRef.current || !voiceEnabled || isSpeaking) return;

    try {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      speechSynthesisRef.current.speak(utterance);
    } catch (error) {
      console.error('❌ 语音播报失败:', error);
      setIsSpeaking(false);
    }
  };

  // 切换语音功能
  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (isSpeaking && speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 格式化配速
  const formatPace = (pace: number): string => {
    if (pace === 0) return '--:--';
    const mins = Math.floor(pace);
    const secs = Math.floor((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
      {/* 助手状态和控制 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isAssistantActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          }`} />
          <h3 className="text-lg font-semibold text-gray-800">AI跑步助手</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleVoice}
            className={`p-2 rounded-full ${
              voiceEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
          <button
            onClick={toggleAssistant}
            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
              isAssistantActive 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isAssistantActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isAssistantActive ? '停止' : '开始'}</span>
          </button>
        </div>
      </div>

      {/* 跑步统计 */}
      {isAssistantActive && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Navigation className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">距离</span>
            </div>
            <div className="text-lg font-bold text-blue-900">
              {(runningStats.distance / 1000).toFixed(2)} km
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">时间</span>
            </div>
            <div className="text-lg font-bold text-green-900">
              {formatTime(runningStats.duration)}
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Target className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">配速</span>
            </div>
            <div className="text-lg font-bold text-purple-900">
              {formatPace(runningStats.pace)}
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Heart className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">心率</span>
            </div>
            <div className="text-lg font-bold text-red-900">
              {runningStats.heartRate || '--'} bpm
            </div>
          </div>
        </div>
      )}

      {/* 当前导航指导 */}
      {currentGuidance && isNavigationActive && (
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Navigation className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">导航指导</span>
          </div>
          <div className="text-sm text-blue-900">
            {currentGuidance.instruction}
          </div>
          {currentGuidance.distance && (
            <div className="text-xs text-blue-700 mt-1">
              距离: {currentGuidance.distance}m
            </div>
          )}
        </div>
      )}

      {/* 安全状态 */}
      <div className={`rounded-lg p-3 ${
        safetyStatus === 'safe' ? 'bg-green-50' :
        safetyStatus === 'warning' ? 'bg-yellow-50' : 'bg-red-50'
      }`}>
        <div className="flex items-center space-x-2">
          <AlertTriangle className={`w-4 h-4 ${
            safetyStatus === 'safe' ? 'text-green-600' :
            safetyStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'
          }`} />
          <span className={`text-sm font-medium ${
            safetyStatus === 'safe' ? 'text-green-800' :
            safetyStatus === 'warning' ? 'text-yellow-800' : 'text-red-800'
          }`}>
            安全状态: {
              safetyStatus === 'safe' ? '安全' :
              safetyStatus === 'warning' ? '注意' : '危险'
            }
          </span>
        </div>
      </div>

      {/* 语音交互 */}
      <div className="flex items-center space-x-2">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={!isAssistantActive}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium ${
            isListening 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          <span>{isListening ? '停止听取' : '语音指令'}</span>
        </button>

        {isSpeaking && (
          <div className="flex items-center space-x-1 text-blue-600">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span className="text-sm">播报中...</span>
          </div>
        )}
      </div>

      {/* 最近的AI消息 */}
      {recentMessages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 flex items-center">
            <MessageCircle className="w-4 h-4 mr-1" />
            AI建议
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {recentMessages.slice(-3).map((message, index) => (
              <div key={index} className={`text-xs p-2 rounded ${
                message.priority === 'high' ? 'bg-red-100 text-red-700' :
                message.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {message.content}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRunningAssistant;