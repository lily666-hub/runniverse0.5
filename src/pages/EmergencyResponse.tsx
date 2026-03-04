import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Phone, MapPin, Clock, Shield, Users, Zap, CheckCircle, XCircle, Bot } from 'lucide-react';
import { useWebSocket } from '../services/websocketService';
import { EmergencyAssistant } from '../components/ai';
import { IntelligentRunningMap } from '../components/map/IntelligentRunningMap';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isDefault: boolean;
}

interface EmergencyReport {
  id: string;
  type: 'sos' | 'medical' | 'accident' | 'harassment' | 'suspicious';
  status: 'active' | 'resolved' | 'cancelled';
  timestamp: string;
  location: string;
  description: string;
  responseTime?: number;
}

interface NearbyHelp {
  id: string;
  type: 'police' | 'hospital' | 'security' | 'volunteer';
  name: string;
  distance: number;
  phone: string;
  estimatedArrival: number;
}

const EmergencyResponse: React.FC = () => {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [selectedEmergencyType, setSelectedEmergencyType] = useState<string>('');
  const [emergencyDescription, setEmergencyDescription] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number, accuracy?: number} | null>(null);
  const [sosCountdown, setSosCountdown] = useState(0);
  const [sosPressed, setSosPressed] = useState(false);

  // 地图相关状态
  const mapRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    {
      id: '1',
      name: '家人',
      phone: '138****8888',
      relationship: '家庭',
      isDefault: true
    },
    {
      id: '2',
      name: '朋友小李',
      phone: '139****9999',
      relationship: '朋友',
      isDefault: false
    }
  ]);

  // 地图事件处理函数
  const handleTrackingStarted = () => {
    setIsTracking(true);
    console.log('Emergency tracking started');
  };

  const handleTrackingStopped = () => {
    setIsTracking(false);
    console.log('Emergency tracking stopped');
  };

  const handlePositionUpdate = (position: { lat: number; lng: number; accuracy?: number }) => {
    setCurrentLocation(position);
    console.log('Emergency position updated:', position);
  };

  const handleMapError = (error: any) => {
    setMapError(error.message || '地图加载失败');
    console.error('Emergency map error:', error);
  };

  const handleEmergencyLocationFound = (location: { lat: number; lng: number }) => {
    setCurrentLocation(location);
    // 自动开始追踪
    if (mapRef.current) {
      mapRef.current.startTracking?.();
    }
  };

  // 修改 SOS 处理函数以集成地图
  const handleSOSPress = () => {
    if (sosCountdown > 0) return;
    
    setSosPressed(true);
    setSosCountdown(5);
    
    // 立即开始位置追踪
    if (mapRef.current) {
      mapRef.current.startTracking?.();
    }
    
    const countdown = setInterval(() => {
      setSosCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          setIsEmergencyActive(true);
          setSosPressed(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSOS = () => {
    setSosCountdown(0);
    setSosPressed(false);
    // 停止追踪
    if (mapRef.current) {
      mapRef.current.stopTracking?.();
    }
  };

  const [recentReports, setRecentReports] = useState<EmergencyReport[]>([
    {
      id: '1',
      type: 'suspicious',
      status: 'resolved',
      timestamp: '2024-01-15 18:30',
      location: '人民广场附近',
      description: '发现可疑人员跟踪',
      responseTime: 5
    }
  ]);

  const [nearbyHelp, setNearbyHelp] = useState<NearbyHelp[]>([
    {
      id: '1',
      type: 'police',
      name: '黄浦区派出所',
      distance: 0.8,
      phone: '110',
      estimatedArrival: 3
    },
    {
      id: '2',
      type: 'hospital',
      name: '上海第一人民医院',
      distance: 1.2,
      phone: '120',
      estimatedArrival: 5
    },
    {
      id: '3',
      type: 'security',
      name: '商场安保',
      distance: 0.3,
      phone: '021-****-****',
      estimatedArrival: 2
    }
  ]);

  const { isConnected, service } = useWebSocket();

  const emergencyTypes = [
    { id: 'sos', label: 'SOS紧急求救', icon: AlertTriangle, color: 'bg-red-600', description: '生命危险或紧急情况' },
    { id: 'medical', label: '医疗急救', icon: Shield, color: 'bg-orange-600', description: '身体不适或受伤' },
    { id: 'accident', label: '意外事故', icon: AlertTriangle, color: 'bg-yellow-600', description: '跑步过程中发生意外' },
    { id: 'harassment', label: '骚扰威胁', icon: Users, color: 'bg-purple-600', description: '遭遇骚扰或威胁' },
    { id: 'suspicious', label: '可疑情况', icon: Zap, color: 'bg-blue-600', description: '发现可疑人员或情况' }
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sosCountdown > 0) {
      interval = setInterval(() => {
        setSosCountdown(prev => {
          if (prev <= 1) {
            triggerEmergencyAlert();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sosCountdown]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.error('获取位置失败:', error);
        }
      );
    }
  };

  const startSOSCountdown = () => {
    setSosCountdown(10); // 10秒倒计时
  };

  const cancelSOSCountdown = () => {
    setSosCountdown(0);
  };

  // 修改紧急警报触发函数
  const triggerEmergencyAlert = () => {
    if (!currentLocation) {
      alert('无法获取当前位置，请检查定位权限');
      return;
    }

    // 开始紧急追踪
    if (mapRef.current) {
      mapRef.current.startTracking?.();
    }

    const emergencyData = {
      userId: 'current-user', // 应该从用户状态获取
      type: (selectedEmergencyType || 'sos') as 'medical' | 'accident' | 'harassment' | 'sos' | 'suspicious',
      lng: currentLocation?.lng || 0,
      lat: currentLocation?.lat || 0,
      location: {
        lng: currentLocation?.lng || 0,
        lat: currentLocation?.lat || 0
      },
      description: emergencyDescription || '紧急求救',
      severity: 'high' as const,
      timestamp: new Date().toISOString()
    };

    // 发送紧急警报
    service.sendEmergencyAlert(emergencyData);

    // 添加到报告列表
    const newReport: EmergencyReport = {
      id: Date.now().toString(),
      type: emergencyData.type as any,
      status: 'active',
      timestamp: new Date().toLocaleString(),
      location: '当前位置',
      description: emergencyData.description || '紧急求救'
    };

    setRecentReports(prev => [newReport, ...prev]);
    setIsEmergencyActive(true);
    setSosCountdown(0);

    // 模拟通知紧急联系人
    emergencyContacts.forEach(contact => {
      console.log(`通知紧急联系人: ${contact.name} (${contact.phone})`);
    });
  };

  const quickEmergencyCall = (phone: string) => {
    window.open(`tel:${phone}`);
  };

  const getTypeIcon = (type: string) => {
    const emergencyType = emergencyTypes.find(t => t.id === type);
    if (emergencyType) {
      const Icon = emergencyType.icon;
      return <Icon className="w-5 h-5" />;
    }
    return <AlertTriangle className="w-5 h-5" />;
  };

  const getTypeColor = (type: string) => {
    const emergencyType = emergencyTypes.find(t => t.id === type);
    return emergencyType?.color || 'bg-gray-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHelpTypeIcon = (type: string) => {
    switch (type) {
      case 'police': return <Shield className="w-5 h-5 text-blue-600" />;
      case 'hospital': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'security': return <Users className="w-5 h-5 text-green-600" />;
      case 'volunteer': return <Users className="w-5 h-5 text-purple-600" />;
      default: return <Shield className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 mr-3 text-red-600" />
            紧急响应中心
          </h1>
          <p className="text-gray-600">24小时全天候安全保障服务</p>
        </div>

        {/* 紧急地图 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-red-600" />
              紧急定位地图
            </h2>
            <div className="flex items-center space-x-2">
              {isTracking && (
                <div className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse mr-2"></div>
                  <span className="text-sm">实时追踪中</span>
                </div>
              )}
              {currentLocation && (
                <div className="text-sm text-gray-600">
                  精度: {currentLocation.accuracy ? `${currentLocation.accuracy.toFixed(1)}m` : 'N/A'}
                </div>
              )}
            </div>
          </div>
          
          {mapError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">地图错误: {mapError}</span>
              </div>
            </div>
          )}

          <div className="h-80 rounded-lg overflow-hidden">
            <IntelligentRunningMap
              ref={mapRef}
              mode="tracking"
              center={currentLocation || { lat: 31.2304, lng: 121.4737 }}
              zoom={16}
              className="w-full h-full"
              onTrackingStarted={handleTrackingStarted}
              onTrackingStopped={handleTrackingStopped}
              onPositionUpdate={handlePositionUpdate}
              onError={handleMapError}
              mapConfig={{
                showAccuracyCircle: true,
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 30000,
                showEmergencyMarkers: true,
                showSafeZones: true
              }}
              voiceConfig={{
                enabled: true,
                language: 'zh-CN',
                rate: 1.0,
                volume: 0.8,
                pitch: 1.0,
                announceDistance: 50
              }}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => mapRef.current?.startTracking?.()}
              disabled={isTracking}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
            >
              {isTracking ? '追踪中...' : '开始紧急追踪'}
            </button>
            <button
              onClick={() => mapRef.current?.stopTracking?.()}
              disabled={!isTracking}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
            >
              停止追踪
            </button>
            <button
              onClick={() => mapRef.current?.centerToCurrentPosition?.()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              定位当前位置
            </button>
          </div>
        </div>

        {/* SOS 倒计时 */}
        {sosCountdown > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 text-center max-w-sm mx-4">
              <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-4">紧急求救倒计时</h2>
              <div className="relative mb-4">
                <div className="text-4xl sm:text-6xl font-bold text-red-600 mb-2">{sosCountdown}</div>
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto border-4 border-red-200 rounded-full relative">
                  <div 
                    className="absolute inset-0 border-4 border-red-600 rounded-full transition-all duration-1000"
                    style={{
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + (5 - sosCountdown) * 10}% 0%, ${50 + (5 - sosCountdown) * 10}% 100%, 50% 100%)`
                    }}
                  ></div>
                </div>
              </div>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">将在 {sosCountdown} 秒后自动发送求救信号</p>
              <button
                onClick={cancelSOS}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                取消求救
              </button>
            </div>
          </div>
        )}

        {/* 紧急状态提示 */}
        {isEmergencyActive && (
          <div className="bg-red-100 border border-red-300 rounded-xl p-4 mb-8">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <h3 className="font-semibold text-red-800">紧急状态已激活</h3>
                <p className="text-red-700">您的紧急求救已发送，救援人员正在赶来</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：紧急求救 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 快速SOS */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-red-600" />
                快速SOS求救
              </h2>
              <div className="text-center">
                <button
                  onClick={handleSOSPress}
                  disabled={sosCountdown > 0}
                  className={`w-32 h-32 rounded-full text-xl font-bold shadow-lg transition-all transform hover:scale-105 disabled:transform-none ${
                    sosCountdown > 0 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : sosPressed 
                        ? 'bg-red-700 animate-pulse' 
                        : 'bg-red-600 hover:bg-red-700'
                  } text-white`}
                >
                  <div className="text-2xl font-bold">SOS</div>
                  <div className="text-sm">
                    {sosCountdown > 0 ? `${sosCountdown}秒` : '紧急求救'}
                  </div>
                </button>
                <p className="mt-4 text-gray-600">长按3秒或点击发送紧急求救</p>
              </div>
            </div>

            {/* 紧急类型选择 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">选择紧急类型</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {emergencyTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedEmergencyType(type.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedEmergencyType === type.id
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 hover:border-red-200 hover:bg-red-50'
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <div className={`p-2 rounded-lg mr-3 ${type.color} text-white`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-800">{type.label}</span>
                      </div>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 详细描述 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">详细描述（可选）</h2>
              <textarea
                value={emergencyDescription}
                onChange={(e) => setEmergencyDescription(e.target.value)}
                placeholder="请简要描述紧急情况..."
                className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
              <button
                onClick={triggerEmergencyAlert}
                disabled={!selectedEmergencyType}
                className="mt-4 w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                发送紧急求救
              </button>
            </div>

            {/* 最近报告 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">最近报告</h2>
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${getTypeColor(report.type)} text-white`}>
                          {getTypeIcon(report.type)}
                        </div>
                        <span className="font-medium text-gray-800">{report.description}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status === 'active' ? '进行中' : report.status === 'resolved' ? '已解决' : '已取消'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="mr-4">{report.location}</span>
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{report.timestamp}</span>
                      {report.responseTime && (
                        <>
                          <span className="mx-2">•</span>
                          <span>响应时间: {report.responseTime}分钟</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：紧急联系人和附近帮助 */}
          <div className="space-y-6">
            {/* 紧急联系人 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Phone className="w-5 h-5 mr-2 text-green-600" />
                紧急联系人
              </h2>
              <div className="space-y-3">
                {emergencyContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800">{contact.name}</div>
                      <div className="text-sm text-gray-600">{contact.relationship}</div>
                    </div>
                    <button
                      onClick={() => quickEmergencyCall(contact.phone)}
                      className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 附近救援 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                附近救援
              </h2>
              <div className="space-y-3">
                {nearbyHelp.map((help) => (
                  <div key={help.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {getHelpTypeIcon(help.type)}
                        <span className="ml-2 font-medium text-gray-800">{help.name}</span>
                      </div>
                      <button
                        onClick={() => quickEmergencyCall(help.phone)}
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>距离: {help.distance} km</div>
                      <div>预计到达: {help.estimatedArrival} 分钟</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI紧急助手 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Bot className="w-5 h-5 mr-2 text-red-600" />
                AI紧急助手
              </h2>
              <EmergencyAssistant />
            </div>

            {/* 连接状态 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">系统状态</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">实时连接</span>
                  <div className="flex items-center">
                    {isConnected ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600 mr-1" />
                        <span className="text-green-600">正常</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-600 mr-1" />
                        <span className="text-red-600">断开</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">GPS定位</span>
                  <div className="flex items-center">
                    {currentLocation ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600 mr-1" />
                        <span className="text-green-600">已启用</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-600 mr-1" />
                        <span className="text-red-600">未启用</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyResponse;