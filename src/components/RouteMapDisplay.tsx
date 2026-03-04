import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader } from 'lucide-react';

interface RouteMapDisplayProps {
  route: {
    id: string;
    name: string;
    coordinates: [number, number][];
    startPoint: string;
    endPoint: string;
    landmarks?: string[];
  };
  height?: string;
  className?: string;
}

export const RouteMapDisplay: React.FC<RouteMapDisplayProps> = ({
  route,
  height = '400px',
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || !route.coordinates || route.coordinates.length === 0) {
      setError('路线数据不完整');
      setIsLoading(false);
      return;
    }

    // 检查高德地图是否已加载
    if (typeof window.AMap === 'undefined') {
      setError('地图服务未加载');
      setIsLoading(false);
      return;
    }

    initializeMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
      }
    };
  }, [route]);

  const initializeMap = () => {
    try {
      // 计算地图中心点
      const centerLng = route.coordinates.reduce((sum, coord) => sum + coord[0], 0) / route.coordinates.length;
      const centerLat = route.coordinates.reduce((sum, coord) => sum + coord[1], 0) / route.coordinates.length;

      // 创建地图实例
      mapInstanceRef.current = new window.AMap.Map(mapRef.current, {
        zoom: 14,
        center: [centerLng, centerLat],
        mapStyle: 'amap://styles/normal',
        showLabel: true,
        showBuildingBlock: true
      });

      // 绘制路线
      drawRoute();
      
      // 添加标记点
      addMarkers();

      setIsLoading(false);
    } catch (err) {
      console.error('地图初始化失败:', err);
      setError('地图初始化失败');
      setIsLoading(false);
    }
  };

  const drawRoute = () => {
    if (!mapInstanceRef.current || !route.coordinates) return;

    // 创建路线折线
    const polyline = new window.AMap.Polyline({
      path: route.coordinates,
      strokeColor: '#3B82F6',
      strokeWeight: 4,
      strokeOpacity: 0.8,
      strokeStyle: 'solid',
      lineJoin: 'round',
      lineCap: 'round',
      showDir: true
    });

    mapInstanceRef.current.add(polyline);

    // 自适应显示所有路线点
    mapInstanceRef.current.setFitView([polyline], false, [50, 50, 50, 50]);
  };

  const addMarkers = () => {
    if (!mapInstanceRef.current || !route.coordinates) return;

    const startPoint = route.coordinates[0];
    const endPoint = route.coordinates[route.coordinates.length - 1];

    // 起点标记
    const startMarker = new window.AMap.Marker({
      position: startPoint,
      icon: new window.AMap.Icon({
        size: new window.AMap.Size(32, 32),
        image: 'data:image/svg+xml;base64,' + btoa(`
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#10B981" stroke="white" stroke-width="2"/>
            <path d="M16 8L20 12H18V20H14V12H12L16 8Z" fill="white"/>
          </svg>
        `),
        imageSize: new window.AMap.Size(32, 32)
      }),
      title: '起点',
      offset: new window.AMap.Pixel(-16, -16)
    });

    // 终点标记
    const endMarker = new window.AMap.Marker({
      position: endPoint,
      icon: new window.AMap.Icon({
        size: new window.AMap.Size(32, 32),
        image: 'data:image/svg+xml;base64,' + btoa(`
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#EF4444" stroke="white" stroke-width="2"/>
            <path d="M12 16L14 18L20 12" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `),
        imageSize: new window.AMap.Size(32, 32)
      }),
      title: '终点',
      offset: new window.AMap.Pixel(-16, -16)
    });

    mapInstanceRef.current.add([startMarker, endMarker]);

    // 添加途径点标记
    if (route.coordinates.length > 2) {
      const waypointMarkers = route.coordinates.slice(1, -1).map((coord, index) => {
        return new window.AMap.Marker({
          position: coord,
          icon: new window.AMap.Icon({
            size: new window.AMap.Size(24, 24),
            image: 'data:image/svg+xml;base64,' + btoa(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="white" stroke-width="2"/>
                <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${index + 1}</text>
              </svg>
            `),
            imageSize: new window.AMap.Size(24, 24)
          }),
          title: `途径点 ${index + 1}`,
          offset: new window.AMap.Pixel(-12, -12)
        });
      });

      mapInstanceRef.current.add(waypointMarkers);
    }
  };

  if (error) {
    return (
      <div className={`h-96 bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-2" />
          <p className="font-medium">地图加载失败</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg overflow-hidden"
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm rounded-lg">
          <div className="text-center">
            <div className="relative">
              <Navigation className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
              <div className="absolute inset-0 w-10 h-10 border-2 border-blue-200 rounded-full animate-pulse"></div>
            </div>
            <p className="text-gray-700 font-medium mb-1">正在加载地图...</p>
            <p className="text-sm text-gray-500">请稍候，正在绘制路线轨迹</p>
          </div>
        </div>
      )}

      {/* 地图控制按钮 */}
      {!isLoading && !error && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1);
              }
            }}
            className="w-8 h-8 bg-white rounded shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="放大"
          >
            <span className="text-gray-600 font-bold">+</span>
          </button>
          <button
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1);
              }
            }}
            className="w-8 h-8 bg-white rounded shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="缩小"
          >
            <span className="text-gray-600 font-bold">-</span>
          </button>
        </div>
      )}

      {/* 路线信息面板 */}
      {!isLoading && !error && (
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">起点</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">途径点</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">终点</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
    