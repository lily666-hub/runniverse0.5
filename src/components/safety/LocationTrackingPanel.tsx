import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Save, Trash2, MapPin, Shield, AlertTriangle } from 'lucide-react';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import { GPSStatusIndicator } from './GPSStatusIndicator';
import { LocationHistory } from './LocationHistory';
import { toast } from 'sonner';

interface LocationTrackingPanelProps {
  className?: string;
  autoSave?: boolean;
  safetyMonitoring?: boolean;
}

export const LocationTrackingPanel: React.FC<LocationTrackingPanelProps> = ({
  className = '',
  autoSave = true,
  safetyMonitoring = true
}) => {
  const {
    location,
    isTracking,
    error,
    accuracy,
    locationHistory,
    safetyStatus,
    safetyScore,
    startTracking,
    stopTracking,
    saveCurrentLocation,
    clearHistory,
    getDistanceTraveled,
    getCurrentSpeed
  } = useLocationTracking({
    autoSave,
    safetyMonitoring,
    batchMode: true,
    trackingInterval: 5000
  });

  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState<number | null>(null);

  // 更新距离和速度显示
  useEffect(() => {
    const interval = setInterval(() => {
      setDistanceTraveled(getDistanceTraveled());
      setCurrentSpeed(getCurrentSpeed());
    }, 1000);

    return () => clearInterval(interval);
  }, [getDistanceTraveled, getCurrentSpeed]);

  const handleStartTracking = () => {
    startTracking();
    toast.success('开始位置追踪');
  };

  const handleStopTracking = () => {
    stopTracking();
    toast.success('停止位置追踪');
  };

  const handleSaveLocation = async () => {
    try {
      await saveCurrentLocation();
      toast.success('位置保存成功');
    } catch (error) {
      toast.error('位置保存失败');
    }
  };

  const handleClearHistory = () => {
    clearHistory();
    toast.success('历史记录已清除');
  };

  const getSafetyStatusDisplay = () => {
    switch (safetyStatus) {
      case 'safe':
        return {
          icon: Shield,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          text: '安全',
          description: '当前位置安全'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          text: '注意',
          description: '请保持警惕'
        };
      case 'danger':
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          text: '危险',
          description: '建议离开此区域'
        };
      default:
        return {
          icon: Shield,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          text: '未知',
          description: '安全状态未知'
        };
    }
  };

  const safetyDisplay = getSafetyStatusDisplay();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* GPS状态指示器 */}
      <GPSStatusIndicator
        isTracking={isTracking}
        accuracy={accuracy}
        error={error}
      />

      {/* 控制按钮 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <MapPin className="mr-2 h-5 w-5 text-blue-500" />
          位置追踪控制
        </h3>

        <div className="flex flex-wrap gap-3">
          {!isTracking ? (
            <button
              onClick={handleStartTracking}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Play className="mr-2 h-4 w-4" />
              开始追踪
            </button>
          ) : (
            <button
              onClick={handleStopTracking}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Square className="mr-2 h-4 w-4" />
              停止追踪
            </button>
          )}

          {location && !autoSave && (
            <button
              onClick={handleSaveLocation}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="mr-2 h-4 w-4" />
              保存位置
            </button>
          )}

          {locationHistory.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              清除记录
            </button>
          )}
        </div>
      </div>

      {/* 当前位置信息 */}
      {location && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">当前位置信息</h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">纬度:</span>
              <span className="ml-1 font-mono">{location.latitude.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-gray-500">经度:</span>
              <span className="ml-1 font-mono">{location.longitude.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-gray-500">精度:</span>
              <span className="ml-1">±{accuracy ? Math.round(accuracy) : '--'}m</span>
            </div>
            <div>
              <span className="text-gray-500">速度:</span>
              <span className="ml-1">{currentSpeed ? `${(currentSpeed * 3.6).toFixed(1)} km/h` : '--'}</span>
            </div>
            <div>
              <span className="text-gray-500">行进距离:</span>
              <span className="ml-1">{(distanceTraveled * 1000).toFixed(0)}m</span>
            </div>
            <div>
              <span className="text-gray-500">更新时间:</span>
              <span className="ml-1">{location.timestamp.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* 安全状态 */}
      {safetyMonitoring && location && (
        <div className={`rounded-lg border p-4 ${safetyDisplay.bgColor} border-gray-200`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <safetyDisplay.icon className={`mr-2 h-5 w-5 ${safetyDisplay.color}`} />
              <div>
                <div className={`font-medium ${safetyDisplay.color}`}>
                  安全状态: {safetyDisplay.text}
                </div>
                <div className="text-sm text-gray-600">
                  {safetyDisplay.description}
                </div>
              </div>
            </div>
            {safetyScore && (
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {safetyScore.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">
                  安全评分
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 位置历史 */}
      <LocationHistory locations={locationHistory} maxItems={5} />
    </div>
  );
};