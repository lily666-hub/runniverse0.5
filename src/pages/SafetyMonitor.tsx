import React, { useState, useEffect, useRef } from 'react';
import { Shield, MapPin, Clock, AlertTriangle, Users, Eye } from 'lucide-react';
import { useWebSocket } from '../services/websocketService';
import { IntelligentRunningMap } from '../components/map/IntelligentRunningMap';
import type { GPSPosition } from '../types/map';

interface SafetyScore {
  overall: number;
  lighting: number;
  crowdDensity: number;
  crimeRate: number;
  emergencyAccess: number;
}

interface LocationData {
  lng: number;
  lat: number;
  address: string;
  timestamp: string;
}

interface RiskAlert {
  id: string;
  type: 'high_risk' | 'medium_risk' | 'low_risk';
  message: string;
  location: string;
  timestamp: string;
}

const SafetyMonitor: React.FC = () => {
  const mapRef = useRef<any>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [safetyScore, setSafetyScore] = useState<SafetyScore>({
    overall: 85,
    lighting: 90,
    crowdDensity: 80,
    crimeRate: 85,
    emergencyAccess: 95
  });
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([
    {
      id: '1',
      type: 'medium_risk',
      message: '该区域夜间照明较暗，建议结伴跑步',
      location: '人民广场附近',
      timestamp: '2024-01-15 18:30'
    },
    {
      id: '2',
      type: 'low_risk',
      message: '前方有施工区域，请注意绕行',
      location: '南京路步行街',
      timestamp: '2024-01-15 18:25'
    }
  ]);

  const handleToggleTracking = async () => {
    setIsLoading(true);
    try {
      if (!isTracking) {
        // 开始追踪
        await mapRef.current?.startTracking();
        setIsTracking(true);
      } else {
        // 停止追踪
        await mapRef.current?.stopTracking();
        setIsTracking(false);
      }
    } catch (error) {
      console.error('切换追踪状态失败:', error);
      setMapError('切换追踪状态失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 地图事件处理函数
  const handleTrackingStarted = () => {
    console.log('安全监控追踪已开始');
    setMapError(null);
  };

  const handleTrackingStopped = () => {
    console.log('安全监控追踪已停止');
  };

  const handlePositionUpdated = (position: GPSPosition) => {
    console.log('位置更新:', position);
    setCurrentLocation({
      lng: position.lng,
      lat: position.lat,
      address: '上海市黄浦区人民广场', // 使用地图提供的地址或默认地址
      timestamp: new Date().toISOString()
    });
    
    // 基于位置更新安全评分
    updateSafetyScore(position);
  };

  const handleMapError = (error: any) => {
    console.error('地图错误:', error);
    setMapError(error.message || '地图加载失败');
    setIsTracking(false);
  };

  // 基于位置更新安全评分
  const updateSafetyScore = (position: GPSPosition) => {
    // 模拟基于位置的安全评分计算
    const timeOfDay = new Date().getHours();
    const isNight = timeOfDay < 6 || timeOfDay > 20;
    
    setSafetyScore(prev => ({
      ...prev,
      overall: Math.floor(Math.random() * 20) + (isNight ? 70 : 80),
      lighting: Math.floor(Math.random() * 20) + (isNight ? 60 : 85),
      crowdDensity: Math.floor(Math.random() * 30) + 70,
      crimeRate: Math.floor(Math.random() * 25) + 75,
      emergencyAccess: Math.floor(Math.random() * 15) + 85
    }));
  };

  const { isConnected } = useWebSocket();

  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(() => {
        getCurrentLocation();
      }, 5000); // 每5秒更新一次位置

      return () => clearInterval(interval);
    }
  }, [isTracking]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({
            lng: longitude,
            lat: latitude,
            address: '上海市黄浦区人民广场', // 模拟地址
            timestamp: new Date().toISOString()
          });
          
          // 模拟安全评分更新
          setSafetyScore(prev => ({
            ...prev,
            overall: Math.floor(Math.random() * 20) + 80,
            lighting: Math.floor(Math.random() * 20) + 80,
            crowdDensity: Math.floor(Math.random() * 30) + 70,
            crimeRate: Math.floor(Math.random() * 25) + 75,
            emergencyAccess: Math.floor(Math.random() * 15) + 85
          }));
        },
        (error) => {
          console.error('获取位置失败:', error);
        }
      );
    }
  };

  const toggleTracking = () => {
    setIsTracking(!isTracking);
    if (!isTracking) {
      getCurrentLocation();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getRiskAlertColor = (type: string) => {
    switch (type) {
      case 'high_risk': return 'border-red-500 bg-red-50';
      case 'medium_risk': return 'border-yellow-500 bg-yellow-50';
      case 'low_risk': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getRiskIcon = (type: string) => {
    switch (type) {
      case 'high_risk': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'medium_risk': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'low_risk': return <AlertTriangle className="w-5 h-5 text-blue-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">实时安全监控</h1>
          <p className="text-gray-600">为您的跑步之旅提供全方位安全保障</p>
        </div>

        {/* 连接状态 */}
        <div className="mb-6 flex items-center justify-center">
          <div className={`flex items-center px-4 py-2 rounded-full ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            {isConnected ? '实时连接正常' : '连接已断开'}
          </div>
        </div>

        {/* 地图错误提示 */}
        {mapError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{mapError}</span>
            </div>
          </div>
        )}

        {/* 主要控制面板 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 当前位置信息 */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                当前位置
              </h2>
              <button
                onClick={handleToggleTracking}
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isTracking
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isTracking ? '停止中...' : '启动中...'}
                  </div>
                ) : (
                  isTracking ? '停止追踪' : '开始追踪'
                )}
              </button>
            </div>
            
            {currentLocation ? (
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{currentLocation.address}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>更新时间: {new Date(currentLocation.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-sm text-gray-500">
                  坐标: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                {isTracking ? '正在获取位置信息...' : '点击开始追踪获取位置信息'}
              </div>
            )}
          </div>

          {/* 整体安全评分 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-600" />
              安全评分
            </h2>
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(safetyScore.overall)}`}>
                {safetyScore.overall}
              </div>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(safetyScore.overall)} ${getScoreColor(safetyScore.overall)}`}>
                {safetyScore.overall >= 80 ? '安全' : safetyScore.overall >= 60 ? '一般' : '危险'}
              </div>
            </div>
          </div>
        </div>

        {/* 智能地图组件 */}
        <div className="mb-8 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-blue-600" />
              实时位置地图
            </h2>
          </div>
          <div className="h-96">
            <IntelligentRunningMap
              ref={mapRef}
              mode="tracking"
              initialCenter={currentLocation ? [currentLocation.lng, currentLocation.lat] : [121.4737, 31.2304]}
              initialZoom={16}
              width="100%"
              height="100%"
              onLocationUpdate={handlePositionUpdated}
              onError={handleMapError}
            />
          </div>
        </div>

        {/* 详细安全指标 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">照明条件</span>
              <Eye className="w-4 h-4 text-gray-400" />
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(safetyScore.lighting)}`}>
              {safetyScore.lighting}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">人流密度</span>
              <Users className="w-4 h-4 text-gray-400" />
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(safetyScore.crowdDensity)}`}>
              {safetyScore.crowdDensity}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">治安状况</span>
              <Shield className="w-4 h-4 text-gray-400" />
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(safetyScore.crimeRate)}`}>
              {safetyScore.crimeRate}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">应急通道</span>
              <AlertTriangle className="w-4 h-4 text-gray-400" />
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(safetyScore.emergencyAccess)}`}>
              {safetyScore.emergencyAccess}
            </div>
          </div>
        </div>

        {/* 风险提醒 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
            风险提醒
          </h2>
          <div className="space-y-3">
            {riskAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`border-l-4 p-4 rounded-r-lg ${getRiskAlertColor(alert.type)}`}
              >
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5">
                    {getRiskIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{alert.message}</p>
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span className="mr-4">{alert.location}</span>
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{alert.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyMonitor;