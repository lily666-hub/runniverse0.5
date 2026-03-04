// 紧急AI助手组件
import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  Phone, 
  MapPin, 
  Clock, 
  Shield,
  Heart,
  Volume2,
  VolumeX,
  Zap,
  Navigation,
  Users,
  MessageSquare
} from 'lucide-react';
import { ChatInterface } from './ChatInterface';
import { aiService } from '../../services/ai';
import { useAuthStore } from '../../store/authStore';
import type { EmergencyAlert, SafetyProfile } from '../../types/ai';

interface EmergencyAssistantProps {
  className?: string;
  onEmergencyTriggered?: (alert: EmergencyAlert) => void;
}

export const EmergencyAssistant: React.FC<EmergencyAssistantProps> = ({
  className = '',
  onEmergencyTriggered,
}) => {
  const { user } = useAuthStore();
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [safetyProfile, setSafetyProfile] = useState<SafetyProfile | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [emergencyType, setEmergencyType] = useState<'medical' | 'harassment' | 'lost' | 'accident' | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 紧急情况类型配置
  const emergencyTypes = [
    {
      id: 'medical' as const,
      name: '医疗急救',
      description: '身体不适、受伤或需要医疗帮助',
      color: 'bg-red-500',
      icon: <Heart className="w-6 h-6" />,
      priority: 'critical' as const,
      autoCall: true,
    },
    {
      id: 'harassment' as const,
      name: '骚扰威胁',
      description: '遭遇骚扰、跟踪或感到威胁',
      color: 'bg-orange-500',
      icon: <Shield className="w-6 h-6" />,
      priority: 'high' as const,
      autoCall: false,
    },
    {
      id: 'lost' as const,
      name: '迷路求助',
      description: '迷路或无法找到安全路线',
      color: 'bg-yellow-500',
      icon: <Navigation className="w-6 h-6" />,
      priority: 'medium' as const,
      autoCall: false,
    },
    {
      id: 'accident' as const,
      name: '意外事故',
      description: '发生跌倒、碰撞等意外事故',
      color: 'bg-purple-500',
      icon: <Zap className="w-6 h-6" />,
      priority: 'high' as const,
      autoCall: true,
    },
  ];

  useEffect(() => {
    if (user) {
      loadSafetyProfile();
      getCurrentLocation();
    }
  }, [user]);

  useEffect(() => {
    if (isEmergencyMode && countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isEmergencyMode && countdown === 0) {
      triggerEmergency();
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [isEmergencyMode, countdown]);

  const loadSafetyProfile = async () => {
    if (!user) return;

    try {
      const profile = await aiService.getSafetyProfile(user.id);
      setSafetyProfile(profile);
    } catch (error) {
      console.error('加载安全档案失败:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('获取位置失败:', error);
        }
      );
    }
  };

  const startEmergencyCountdown = (type: typeof emergencyType) => {
    setEmergencyType(type);
    setIsEmergencyMode(true);
    setCountdown(10); // 10秒倒计时

    // 播放警报声
    if (isSoundEnabled && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  const cancelEmergency = () => {
    setIsEmergencyMode(false);
    setCountdown(0);
    setEmergencyType(null);
    
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
    }

    // 停止警报声
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const triggerEmergency = async () => {
    if (!user || !emergencyType) return;

    const emergencyConfig = emergencyTypes.find(t => t.id === emergencyType);
    if (!emergencyConfig) return;

    const alert: EmergencyAlert = {
      id: `emergency_${Date.now()}`,
      userId: user.id,
      alertType: 'manual',
      severity: emergencyConfig.priority === 'critical' ? 'critical' : 
                emergencyConfig.priority === 'high' ? 'high' : 'medium',
      location: {
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        address: '当前位置'
      },
      timestamp: new Date(),
      status: 'active',
      description: `用户触发${emergencyConfig.name}警报`,
    };

    try {
      // 调用AI服务处理紧急情况
      await aiService.handleEmergency(
        user.id,
        {
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          address: '当前位置'
        },
        `${emergencyConfig.name}: ${emergencyConfig.description}`,
        'manual'
      );
      
      // 通知父组件
      onEmergencyTriggered?.(alert);

      // 重置状态
      setIsEmergencyMode(false);
      setCountdown(0);
      setEmergencyType(null);

      // 显示成功提示
      window.alert('紧急警报已发送！相关人员将会收到通知。');
    } catch (error) {
      console.error('处理紧急情况失败:', error);
      window.alert('发送紧急警报失败，请手动拨打紧急电话！');
    }
  };

  const callEmergencyNumber = () => {
    window.open('tel:110', '_self');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        请先登录以使用紧急AI助手
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* 隐藏的音频元素 */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
        className="hidden"
      >
        <source src="/emergency-alert.mp3" type="audio/mpeg" />
        {/* 如果没有音频文件，可以使用Web Audio API生成警报声 */}
      </audio>

      {/* 紧急模式覆盖层 */}
      {isEmergencyMode && (
        <div className="fixed inset-0 bg-red-600 bg-opacity-95 z-50 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <div className="mb-6">
              <AlertTriangle className="w-24 h-24 mx-auto mb-4 animate-pulse" />
              <h2 className="text-4xl font-bold mb-2">紧急模式</h2>
              <p className="text-xl">
                {emergencyTypes.find(t => t.id === emergencyType)?.name}
              </p>
            </div>
            
            <div className="mb-8">
              <div className="text-6xl font-bold mb-2">{countdown}</div>
              <p className="text-lg">秒后自动发送紧急警报</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={triggerEmergency}
                className="w-full py-4 px-8 bg-white text-red-600 rounded-lg font-bold text-xl hover:bg-gray-100 transition-colors"
              >
                立即发送警报
              </button>
              <button
                onClick={cancelEmergency}
                className="w-full py-3 px-8 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-red-600 transition-colors"
              >
                取消警报
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 正常界面 */}
      <div className="p-6">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">紧急AI助手</h2>
              <p className="text-sm text-gray-600">24小时智能紧急响应系统</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                isSoundEnabled 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 快速紧急按钮 */}
        <div className="mb-6">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-red-900 mb-1">一键紧急求助</h3>
                <p className="text-sm text-red-700">立即联系紧急服务或预设联系人</p>
              </div>
              <button
                onClick={callEmergencyNumber}
                className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                <Phone className="w-5 h-5" />
                <span>拨打110</span>
              </button>
            </div>
          </div>
        </div>

        {/* 紧急情况类型选择 */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">选择紧急情况类型</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {emergencyTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => startEmergencyCountdown(type.id)}
                className={`p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all text-left group hover:shadow-md`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${type.color} text-white group-hover:scale-110 transition-transform`}>
                    {type.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{type.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className={`px-2 py-1 rounded-full text-white ${
                        type.priority === 'critical' ? 'bg-red-500' :
                        type.priority === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                      }`}>
                        {type.priority === 'critical' ? '危急' : 
                         type.priority === 'high' ? '高优先级' : '中优先级'}
                      </span>
                      {type.autoCall && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          自动拨号
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 当前状态信息 */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">当前状态</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">位置状态</span>
              </div>
              <div className="text-sm text-gray-600">
                {currentLocation ? '位置已获取' : '正在获取位置...'}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">紧急联系人</span>
              </div>
              <div className="text-sm text-gray-600">
                {safetyProfile?.emergencyContacts?.length || 0} 个联系人
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">响应时间</span>
              </div>
              <div className="text-sm text-gray-600">
                &lt; 30秒
              </div>
            </div>
          </div>
        </div>

        {/* AI对话界面 */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>AI紧急咨询</span>
          </h3>
          <div className="h-64 border border-gray-200 rounded-lg">
            <ChatInterface
              conversationType="emergency"
              provider="deepseek"
              context={{
                userContext: {
                  location: currentLocation,
                  emergencyContacts: safetyProfile?.emergencyContacts,
                },
                safetyContext: {
                  isEmergency: true,
                  emergencyTypes: emergencyTypes.map(t => t.id),
                },
              }}
              className="h-full"
            />
          </div>
        </div>

        {/* 安全提示 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">安全提示</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 在真正的紧急情况下，请直接拨打110、120或119</li>
            <li>• 确保您的紧急联系人信息是最新的</li>
            <li>• 在安全的地方使用此功能，避免在危险环境中操作手机</li>
            <li>• AI助手可以提供指导，但不能替代专业的紧急服务</li>
          </ul>
        </div>
      </div>
    </div>
  );
};