import React, { useState, useEffect } from 'react';
import { Shield, MapPin, Clock, AlertTriangle, Phone, Users, Activity, RefreshCw, Share2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import { useSafetyAnalysis } from '../../hooks/useSafetyAnalysis';
import SafetyAnalysisDashboard from '../../components/safety/SafetyAnalysisDashboard';
// import AmapComponent from '../../components/map/AmapComponent';
import RealTimeConnection from '../../components/communication/RealTimeConnection';

const SafetyMonitor: React.FC = () => {
  const { user } = useAuth();
  const { 
    location: currentLocation, 
    isTracking, 
    startTracking, 
    stopTracking, 
    error: locationError,
    locationHistory 
  } = useLocationTracking();
  
  const {
    currentSafetyScore,
    safetyRecommendations,
    bestRunningTimes,
    riskHotspots,
    isAnalyzing: safetyLoading,
    error: safetyError,
    refreshAnalysis
  } = useSafetyAnalysis();

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [emergencyContacts] = useState([
    { name: '紧急联系人1', phone: '138****1234' },
    { name: '紧急联系人2', phone: '139****5678' }
  ]);
  const [userId] = useState('user-' + Math.random().toString(36).substr(2, 9)); // 模拟用户ID
  const [showMap, setShowMap] = useState(true);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getTimeSlotDisplay = () => {
    const hour = currentTime.getHours();
    if (hour >= 6 && hour < 10) return { label: '早晨', icon: '🌅', risk: 'low' };
    if (hour >= 10 && hour < 18) return { label: '白天', icon: '☀️', risk: 'low' };
    if (hour >= 18 && hour < 22) return { label: '傍晚', icon: '🌆', risk: 'medium' };
    return { label: '夜晚', icon: '🌙', risk: 'high' };
  };

  const timeSlot = getTimeSlotDisplay();

  const getSafetyStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'danger': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTimeRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSafetyStatus = () => {
    if (!currentSafetyScore) return { level: 'unknown', text: '评估中...', color: 'gray' };
    
    const score = currentSafetyScore.overall;
    if (score >= 80) return { level: 'safe', text: '安全', color: 'green' };
    if (score >= 60) return { level: 'moderate', text: '较安全', color: 'yellow' };
    if (score >= 40) return { level: 'caution', text: '需注意', color: 'orange' };
    return { level: 'danger', text: '高风险', color: 'red' };
  };

  const safetyStatus = getSafetyStatus();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <Activity className="mr-3 text-blue-500" />
            实时安全监控
          </h1>
          <p className="text-gray-600">
            欢迎回来，{user?.email}！为您提供实时安全状况监控和分析。
          </p>
        </div>

        {/* 错误提示 */}
        {(locationError || safetyError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">
                {locationError || safetyError}
              </span>
            </div>
          </div>
        )}

        {/* 当前安全状态 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Shield className="mr-2 text-blue-500" />
            当前安全状态
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 安全等级 */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
                safetyStatus.color === 'green' ? 'bg-green-100 text-green-600' :
                safetyStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                safetyStatus.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                safetyStatus.color === 'red' ? 'bg-red-100 text-red-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                <Shield className="w-12 h-12" />
              </div>
              <div className="text-2xl font-bold text-gray-800">{safetyStatus.text}</div>
              {currentSafetyScore && (
                <div className="text-lg text-gray-600">
                  安全分数: {currentSafetyScore.overall.toFixed(1)}/100
                </div>
              )}
              <div className="text-sm text-gray-500 mt-2">
                {safetyLoading ? '正在分析...' : '实时评估'}
              </div>
            </div>

            {/* 追踪状态 */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
                isTracking ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}>
                <MapPin className="w-12 h-12" />
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {isTracking ? '追踪中' : '未追踪'}
              </div>
              <div className="text-lg text-gray-600">GPS定位</div>
              <button
                onClick={isTracking ? stopTracking : startTracking}
                className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  isTracking 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isTracking ? '停止追踪' : '开始追踪'}
              </button>
            </div>
          </div>
        </div>

        {/* 当前位置信息 */}
        {currentLocation && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <MapPin className="mr-2 text-green-500" />
              当前位置
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">经纬度</div>
                <div className="font-mono text-sm">
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">精度</div>
                <div className="text-sm">±{currentLocation.accuracy?.toFixed(1) || 'N/A'}米</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">更新时间</div>
                <div className="text-sm">{new Date(currentLocation.timestamp).toLocaleTimeString()}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">当前时间</div>
                <div className="text-sm">{currentTime.toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* 地图显示 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <MapPin className="mr-2 text-blue-500" />
              实时位置监控
            </h2>
            <button
              onClick={() => setShowMap(!showMap)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              {showMap ? '隐藏地图' : '显示地图'}
            </button>
          </div>
          
          {showMap && (
            <div className="h-72 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-2" />
                <p>地图功能开发中...</p>
                <p className="text-sm">位置: {currentLocation ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}` : '获取中...'}</p>
              </div>
            </div>
          )}
        </div>

        {/* 快速安全建议 */}
        {safetyRecommendations.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <AlertTriangle className="mr-2 text-purple-500" />
              实时安全建议
            </h2>
            
            <div className="space-y-2">
              {safetyRecommendations.slice(0, 3).map((recommendation, index) => (
                <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                    {index + 1}
                  </div>
                  <div className="text-sm text-gray-700">{recommendation}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 快速操作 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">快速操作</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="flex items-center justify-center p-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
              <Phone className="mr-2" />
              紧急联系人
            </button>
            
            <button className="flex items-center justify-center p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              <Share2 className="mr-2" />
              分享位置
            </button>
          </div>
        </div>

        {/* 实时通信 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Activity className="mr-2 text-green-500" />
            实时通信
          </h2>
          
          <RealTimeConnection
            userId={userId}
            onEmergencyAlert={(alert) => {
              console.log('Emergency alert received:', alert);
              // 这里可以添加紧急警报处理逻辑
            }}
            onSafetyNotification={(notification) => {
              console.log('Safety notification received:', notification);
              // 这里可以添加安全通知处理逻辑
            }}
            onLocationUpdate={(update) => {
              console.log('Location update received:', update);
              // 这里可以添加位置更新处理逻辑
            }}
            onBuddyUpdate={(update) => {
              console.log('Buddy update received:', update);
              // 这里可以添加跑步伙伴更新处理逻辑
            }}
            showConnectionStatus={true}
          />
        </div>

        {/* 详细安全分析仪表板 */}
        <SafetyAnalysisDashboard 
          autoRefresh={true}
          refreshInterval={30000}
        />
      </div>
    </div>
  );
};

export default SafetyMonitor;