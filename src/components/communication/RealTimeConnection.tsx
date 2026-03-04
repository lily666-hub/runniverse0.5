import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertTriangle, Users, MapPin, Bell } from 'lucide-react';
import { useWebSocket, EmergencyAlert, SafetyNotification, LocationUpdate, BuddyUpdate, WebSocketService } from '../../services/websocketService';

interface RealTimeConnectionProps {
  userId: string;
  onEmergencyAlert?: (alert: EmergencyAlert) => void;
  onSafetyNotification?: (notification: SafetyNotification) => void;
  onLocationUpdate?: (update: any) => void;
  onBuddyUpdate?: (update: any) => void;
  showConnectionStatus?: boolean;
  className?: string;
}

export const RealTimeConnection: React.FC<RealTimeConnectionProps> = ({
  userId,
  onEmergencyAlert,
  onSafetyNotification,
  onLocationUpdate,
  onBuddyUpdate,
  showConnectionStatus = true,
  className = ''
}) => {
  const [lastActivity, setLastActivity] = useState<string>('');
  const { service, connectionStatus, lastMessage, isConnected } = useWebSocket({}, userId);
  const [notifications, setNotifications] = useState<SafetyNotification[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);

  useEffect(() => {
    if (lastMessage) {
      const { type, data } = lastMessage;
      
      switch (type) {
        case 'emergency:received':
          const alert = data as EmergencyAlert;
          setEmergencyAlerts(prev => [alert, ...prev.slice(0, 9)]);
          setLastActivity(`收到紧急警报: ${alert.type}`);
          onEmergencyAlert?.(alert);
          break;
        
        case 'emergency:confirmed':
          setLastActivity('紧急求救已确认');
          break;
        
        case 'safety:alert':
        case 'safety:zone_warning':
          const notification = data as SafetyNotification;
          setNotifications(prev => [notification, ...prev.slice(0, 19)]);
          setLastActivity(`安全通知: ${notification.title}`);
          onSafetyNotification?.(notification);
          break;
        
        case 'location:updated':
          setLastActivity(`位置更新: ${data.userId}`);
          onLocationUpdate?.(data);
          break;
        
        case 'buddy:invitation':
          setLastActivity(`收到跑友邀请`);
          onBuddyUpdate?.(data);
          break;
        
        case 'buddy:response_received':
          setLastActivity(`跑友邀请回复: ${data.response}`);
          onBuddyUpdate?.(data);
          break;
        
        case 'connection:confirmed':
          setLastActivity('已连接到实时通信服务');
          break;
        
        default:
          setLastActivity(`收到消息: ${type}`);
      }
    }
  }, [lastMessage, onEmergencyAlert, onSafetyNotification, onLocationUpdate, onBuddyUpdate]);

  // 监听浏览器事件
  useEffect(() => {
    const handleEmergencyAlert = (event: CustomEvent) => {
      const alert = event.detail as EmergencyAlert;
      setEmergencyAlerts(prev => [alert, ...prev.slice(0, 9)]);
    };

    const handleSafetyNotification = (event: CustomEvent) => {
      const notification = event.detail as SafetyNotification;
      setNotifications(prev => [notification, ...prev.slice(0, 19)]);
    };

    window.addEventListener('emergency-alert', handleEmergencyAlert as EventListener);
    window.addEventListener('safety-notification', handleSafetyNotification as EventListener);

    return () => {
      window.removeEventListener('emergency-alert', handleEmergencyAlert as EventListener);
      window.removeEventListener('safety-notification', handleSafetyNotification as EventListener);
    };
  }, []);

  // 请求通知权限
  useEffect(() => {
    // 请求通知权限
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 发送位置更新
  const sendLocationUpdate = (location: { lng: number; lat: number; accuracy?: number; speed?: number }) => {
    if (isConnected) {
      service.sendLocationUpdate({
        userId,
        lng: location.lng,
        lat: location.lat,
        timestamp: new Date().toISOString(),
        accuracy: location.accuracy,
        speed: location.speed
      });
    }
  };

  // 发送紧急求救
  const sendEmergencyAlert = (type: 'sos' | 'medical' | 'accident' | 'harassment' | 'suspicious', location: { lng: number; lat: number }, description?: string) => {
    if (isConnected) {
      service.sendEmergencyAlert({
        userId,
        type,
        lng: location.lng,
        lat: location.lat,
        location: {
          lng: location.lng,
          lat: location.lat
        },
        description,
        timestamp: new Date().toISOString(),
        severity: 'high'
      });
    }
  };

  // 获取连接状态图标
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Wifi className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'error':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  // 获取连接状态文本
  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return '已连接';
      case 'connecting':
        return '连接中...';
      case 'error':
        return '连接失败';
      default:
        return '未连接';
    }
  };

  return (
    <div className={className}>
      {/* 连接状态显示 */}
      {showConnectionStatus && (
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 mb-4">
          <div className="flex items-center">
            {getConnectionIcon()}
            <span className="ml-2 text-sm font-medium text-gray-700">
              实时通信: {getConnectionText()}
            </span>
          </div>
          
          {lastActivity && (
            <div className="text-xs text-gray-500">
              最后活动: {lastActivity}
            </div>
          )}
        </div>
      )}

      {/* 紧急警报列表 */}
      {emergencyAlerts.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
            紧急警报
          </h3>
          <div className="space-y-2">
            {emergencyAlerts.slice(0, 3).map((alert, index) => (
              <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-red-800">
                    {alert.type === 'sos' ? '紧急求救' : 
                     alert.type === 'medical' ? '医疗急救' :
                     alert.type === 'accident' ? '意外事故' : '骚扰求助'}
                  </span>
                  <span className="text-xs text-red-600">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center text-xs text-red-700">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>
                    {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}
                  </span>
                </div>
                {alert.message && (
                  <p className="text-xs text-red-700 mt-1">{alert.message}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 安全通知列表 */}
      {notifications.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Bell className="h-4 w-4 text-blue-500 mr-1" />
            安全通知
          </h3>
          <div className="space-y-2">
            {notifications.slice(0, 3).map((notification, index) => (
              <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-blue-800">
                    {notification.title}
                  </span>
                  <span className="text-xs text-blue-600">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-blue-700">{notification.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 快速操作按钮 */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            navigator.geolocation.getCurrentPosition((position) => {
              sendLocationUpdate({
                lng: position.coords.longitude,
                lat: position.coords.latitude
              });
            });
          }}
          disabled={!isConnected}
          className="flex items-center justify-center p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">更新位置</span>
        </button>

        <button
          onClick={() => {
            navigator.geolocation.getCurrentPosition((position) => {
              sendEmergencyAlert('sos', {
                lng: position.coords.longitude,
                lat: position.coords.latitude
              }, '紧急求救');
            });
          }}
          disabled={!isConnected}
          className="flex items-center justify-center p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <AlertTriangle className="h-4 w-4 mr-1" />
          <span className="text-sm">紧急求救</span>
        </button>
      </div>
    </div>
  );
};

export default RealTimeConnection;