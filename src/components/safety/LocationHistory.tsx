import React, { useState } from 'react';
import { MapPin, Clock, Navigation, Zap, Signal } from 'lucide-react';
import { LocationHistory as LocationHistoryType } from '../../types';

interface LocationHistoryProps {
  locations: LocationHistoryType[];
  className?: string;
  maxItems?: number;
}

export const LocationHistory: React.FC<LocationHistoryProps> = ({
  locations,
  className = '',
  maxItems = 10
}) => {
  const [showAll, setShowAll] = useState(false);

  const displayedLocations = showAll ? locations : locations.slice(0, maxItems);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatCoordinate = (value: number) => {
    return value.toFixed(6);
  };

  const getAccuracyColor = (accuracy: number | null) => {
    if (!accuracy) return 'text-gray-400';
    if (accuracy <= 10) return 'text-green-500';
    if (accuracy <= 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSpeedDisplay = (speed: number | null) => {
    if (!speed || speed < 0) return '--';
    return `${(speed * 3.6).toFixed(1)} km/h`; // 转换为公里/小时
  };

  if (locations.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 text-center ${className}`}>
        <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无位置记录</h3>
        <p className="text-gray-500">开始位置追踪后，您的位置历史将显示在这里</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <MapPin className="mr-2 h-5 w-5 text-blue-500" />
          位置历史记录
          <span className="ml-2 text-sm text-gray-500">({locations.length}条)</span>
        </h3>
      </div>

      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {displayedLocations.map((location, index) => (
          <div key={location.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="mr-1 h-4 w-4" />
                    {formatTime(location.recorded_at)}
                  </div>
                  <div className={`flex items-center text-sm ${getAccuracyColor(location.accuracy)}`}>
                    <Signal className="mr-1 h-4 w-4" />
                    ±{location.accuracy ? Math.round(location.accuracy) : '--'}m
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">纬度:</span>
                    <span className="ml-1 font-mono">{formatCoordinate(location.latitude)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">经度:</span>
                    <span className="ml-1 font-mono">{formatCoordinate(location.longitude)}</span>
                  </div>
                  {location.altitude && (
                    <div>
                      <span className="text-gray-500">海拔:</span>
                      <span className="ml-1">{Math.round(location.altitude)}m</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">速度:</span>
                    <span className="ml-1">{getSpeedDisplay(location.speed)}</span>
                  </div>
                </div>

                {(location.heading !== null || location.battery_level || location.network_type) && (
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    {location.heading !== null && (
                      <div className="flex items-center">
                        <Navigation className="mr-1 h-3 w-3" />
                        {Math.round(location.heading)}°
                      </div>
                    )}
                    {location.battery_level && (
                      <div className="flex items-center">
                        <Zap className="mr-1 h-3 w-3" />
                        {location.battery_level}%
                      </div>
                    )}
                    {location.network_type && (
                      <div className="text-gray-400">
                        {location.network_type.toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="ml-4 flex-shrink-0">
                <div className={`w-3 h-3 rounded-full ${
                  index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {locations.length > maxItems && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showAll ? '收起' : `查看全部 ${locations.length} 条记录`}
          </button>
        </div>
      )}
    </div>
  );
};