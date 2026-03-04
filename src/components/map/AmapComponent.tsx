import React, { useEffect, useRef, useState } from 'react';
import { amapService, LocationPoint, RouteResult, RiskPoint } from '../../services/amapService';
import { MapPin, Navigation, AlertTriangle, RefreshCw } from 'lucide-react';

interface AmapComponentProps {
  center?: LocationPoint;
  zoom?: number;
  height?: string;
  showCurrentLocation?: boolean;
  showSafetyMarkers?: boolean;
  onLocationChange?: (location: LocationPoint) => void;
  onRouteCalculated?: (route: RouteResult) => void;
  className?: string;
}

export const AmapComponent: React.FC<AmapComponentProps> = ({
  center = { lng: 121.4737, lat: 31.2304 },
  zoom = 15,
  height = '400px',
  showCurrentLocation = true,
  showSafetyMarkers = true,
  onLocationChange,
  onRouteCalculated,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 初始化地图
  useEffect(() => {
    const initMap = async () => {
      try {
        setIsLoading(true);
        await amapService.initialize();
        
        if (mapRef.current) {
          const mapInstance = amapService.createMap(mapRef.current, {
            center: [center.lng, center.lat],
            zoom
          });
          setMap(mapInstance);
        }
      } catch (err) {
        setError('地图初始化失败');
        console.error('Map initialization failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      amapService.destroy();
    };
  }, [center.lng, center.lat, zoom]);

  // 获取当前位置
  useEffect(() => {
    if (!showCurrentLocation || !map) return;

    const getCurrentLocation = async () => {
      try {
        const location = await amapService.getCurrentPosition();
        setCurrentLocation(location);
        onLocationChange?.(location);

        // 在地图上显示当前位置
        const marker = new window.AMap.Marker({
          position: [location.lng, location.lat],
          icon: new window.AMap.Icon({
            image: 'data:image/svg+xml;base64,' + btoa(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#1890ff" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="#1890ff" stroke="#fff" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" fill="#fff"/>
              </svg>
            `),
            size: new window.AMap.Size(24, 24)
          }),
          title: '我的位置'
        });

        marker.setMap(map);
        map.setCenter([location.lng, location.lat]);
      } catch (err) {
        console.error('Failed to get current location:', err);
      }
    };

    getCurrentLocation();
  }, [map, showCurrentLocation, onLocationChange]);

  // 添加安全标记
  useEffect(() => {
    if (!showSafetyMarkers || !map || !currentLocation) return;

    const addSafetyMarkers = async () => {
      try {
        // 模拟风险点数据
        const riskPoints: RiskPoint[] = [
          {
            lng: currentLocation.lng + 0.001,
            lat: currentLocation.lat + 0.001,
            type: 'lighting',
            level: 'medium',
            description: '照明不足区域',
            timestamp: new Date().toISOString()
          },
          {
            lng: currentLocation.lng - 0.001,
            lat: currentLocation.lat + 0.002,
            type: 'crime',
            level: 'high',
            description: '治安风险区域',
            timestamp: new Date().toISOString()
          }
        ];

        amapService.addSafetyMarkers(riskPoints);
      } catch (err) {
        console.error('Failed to add safety markers:', err);
      }
    };

    addSafetyMarkers();
  }, [map, showSafetyMarkers, currentLocation]);

  // 路径规划
  const planRoute = async (destination: LocationPoint) => {
    if (!currentLocation || !map) return;

    try {
      const route = await amapService.planRoute(
        currentLocation,
        destination
      );
      
      onRouteCalculated?.(route);
    } catch (err) {
      console.error('Route planning failed:', err);
    }
  };

  // 刷新地图
  const refreshMap = () => {
    if (map) {
      map.clearMap();
      window.location.reload();
    }
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ height }}>
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshMap}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* 地图容器 */}
      <div
        ref={mapRef}
        style={{ height }}
        className="w-full rounded-lg overflow-hidden"
      />

      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">正在加载地图...</p>
          </div>
        </div>
      )}

      {/* 地图控制按钮 */}
      <div className="absolute top-4 right-4 space-y-2">
        {showCurrentLocation && (
          <button
            onClick={() => {
              if (currentLocation && map) {
                map.setCenter([currentLocation.lng, currentLocation.lat]);
              }
            }}
            className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            title="回到当前位置"
          >
            <Navigation className="h-5 w-5 text-gray-600" />
          </button>
        )}
        
        <button
          onClick={refreshMap}
          className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          title="刷新地图"
        >
          <RefreshCw className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* 当前位置信息 */}
      {currentLocation && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-1" />
            <span>
              {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmapComponent;