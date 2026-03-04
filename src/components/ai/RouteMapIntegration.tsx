// 智能体与高德地图集成组件
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Route, Compass, Star, Clock, TrendingUp, Shield, Play, Pause } from 'lucide-react';
import { RouteAgent } from './agents/RouteAgent';
import { useAuthStore } from '../../store/authStore';
import type { AIConversation, AIMessage, AIResponse } from '../../types/ai';

interface RouteMapIntegrationProps {
  className?: string;
  height?: string;
}

interface RouteRecommendation {
  startPoint: {
    latitude: number;
    longitude: number;
    address: string;
  };
  endPoint: {
    latitude: number;
    longitude: number;
    address: string;
  };
  waypoints?: Array<{
    latitude: number;
    longitude: number;
    name: string;
    description?: string;
  }>;
  routeType: 'safe' | 'scenic' | 'fast' | 'challenge';
  distance: number;
  estimatedTime: number;
  safetyScore: number;
  description: string;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  address: string;
}

interface UserPreferences {
  preferredDistance: number;
  preferredTerrain: 'flat' | 'hilly' | 'mixed';
  safetyPriority: 'high' | 'medium' | 'low';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  avoidAreas: string[];
}

export const RouteMapIntegration: React.FC<RouteMapIntegrationProps> = ({
  className = '',
  height = '600px'
}) => {
  const { user } = useAuthStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    preferredDistance: 5,
    preferredTerrain: 'mixed',
    safetyPriority: 'high',
    timeOfDay: 'morning',
    avoidAreas: []
  });
  const [currentRoute, setCurrentRoute] = useState<RouteRecommendation | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routePolyline, setRoutePolyline] = useState<any>(null);
  const [routeMarkers, setRouteMarkers] = useState<any[]>([]);

  // 初始化高德地图
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        // 确保高德地图API已加载
        if (!window.AMap) {
          const script = document.createElement('script');
          script.src = 'https://webapi.amap.com/maps?v=2.0&key=b4bbc4d6ac83b3431412e4f99c4d7b26&plugin=AMap.Driving,AMap.Walking,AMap.Geolocation';
          script.async = true;
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // 创建地图实例
        const mapInstance = new window.AMap.Map(mapRef.current, {
          zoom: 15,
          center: [121.4737, 31.2304], // 上海市中心
          mapStyle: 'amap://styles/normal',
          showLabel: true,
          showBuildingBlock: true,
          viewMode: '2D',
          features: ['bg', 'road', 'building', 'point'],
          resizeEnable: true
        });

        // 添加地图控件
        mapInstance.addControl(new window.AMap.Scale());
        mapInstance.addControl(new window.AMap.ToolBar({
          visible: true
        }));

        setMap(mapInstance);
        setIsMapLoaded(true);

        // 获取用户当前位置
        getCurrentLocation(mapInstance);

      } catch (error) {
        console.error('地图初始化失败:', error);
      }
    };

    initMap();

    return () => {
      if (map) {
        map.destroy();
      }
    };
  }, []);

  // 获取当前位置
  const getCurrentLocation = (mapInstance: any) => {
    window.AMap.plugin('AMap.Geolocation', () => {
      const geolocation = new window.AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 10000,
        showButton: false,
        showMarker: true,
        panToLocation: true
      });

      mapInstance.addControl(geolocation);

      geolocation.getCurrentPosition((status: string, result: any) => {
        if (status === 'complete') {
          const location = {
            latitude: result.position.lat,
            longitude: result.position.lng,
            address: result.formattedAddress || '当前位置'
          };
          setUserLocation(location);
          mapInstance.setCenter([location.longitude, location.latitude]);
        } else {
          // 使用默认位置
          const defaultLocation = {
            latitude: 31.2304,
            longitude: 121.4737,
            address: '上海市中心'
          };
          setUserLocation(defaultLocation);
        }
      });
    });
  };

  // 处理智能体路线推荐
  const handleRouteRecommendation = (recommendation: any) => {
    console.log('收到路线推荐:', recommendation);
    
    // 解析智能体推荐的路线数据
    const routeData: RouteRecommendation = {
      startPoint: userLocation || {
        latitude: 31.2304,
        longitude: 121.4737,
        address: '当前位置'
      },
      endPoint: recommendation.endPoint || {
        latitude: 31.2404,
        longitude: 121.4837,
        address: '推荐终点'
      },
      waypoints: recommendation.waypoints || [],
      routeType: recommendation.routeType || 'safe',
      distance: recommendation.distance || 5000,
      estimatedTime: recommendation.estimatedTime || 30,
      safetyScore: recommendation.safetyScore || 85,
      description: recommendation.description || '智能推荐路线'
    };

    setCurrentRoute(routeData);
    drawRouteOnMap(routeData);
  };

  // 在地图上绘制路线
  const drawRouteOnMap = (route: RouteRecommendation) => {
    if (!map || !isMapLoaded) return;

    // 清除之前的路线
    clearRoute();

    // 创建路线规划实例
    window.AMap.plugin(['AMap.Driving'], () => {
      const driving = new window.AMap.Driving({
        map: map,
        policy: window.AMap.DrivingPolicy.LEAST_TIME,
        showTraffic: false
      });

      const startPoint = new window.AMap.LngLat(route.startPoint.longitude, route.startPoint.latitude);
      const endPoint = new window.AMap.LngLat(route.endPoint.longitude, route.endPoint.latitude);
      
      // 添加途径点
      const waypoints = route.waypoints?.map(wp => 
        new window.AMap.LngLat(wp.longitude, wp.latitude)
      ) || [];

      driving.search(startPoint, endPoint, {
        waypoints: waypoints
      }, (status: string, result: any) => {
        if (status === 'complete') {
          console.log('路线规划成功:', result);
          
          // 添加起点和终点标记
          addRouteMarkers(route);
          
          // 调整地图视野
          map.setFitView();
        } else {
          console.error('路线规划失败:', status, result);
          // 使用直线连接作为备选方案
          drawStraightLine(route);
        }
      });
    });
  };

  // 添加路线标记
  const addRouteMarkers = (route: RouteRecommendation) => {
    const markers: any[] = [];

    // 起点标记
    const startMarker = new window.AMap.Marker({
      position: [route.startPoint.longitude, route.startPoint.latitude],
      icon: new window.AMap.Icon({
        image: 'data:image/svg+xml;base64,' + btoa(`
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#10B981" stroke="#fff" stroke-width="2"/>
            <path d="M16 8l4 8h-8l4-8z" fill="#fff"/>
          </svg>
        `),
        size: new window.AMap.Size(32, 32),
        imageOffset: new window.AMap.Pixel(-16, -16)
      }),
      title: '起点: ' + route.startPoint.address
    });

    // 终点标记
    const endMarker = new window.AMap.Marker({
      position: [route.endPoint.longitude, route.endPoint.latitude],
      icon: new window.AMap.Icon({
        image: 'data:image/svg+xml;base64,' + btoa(`
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#EF4444" stroke="#fff" stroke-width="2"/>
            <rect x="12" y="12" width="8" height="8" fill="#fff"/>
          </svg>
        `),
        size: new window.AMap.Size(32, 32),
        imageOffset: new window.AMap.Pixel(-16, -16)
      }),
      title: '终点: ' + route.endPoint.address
    });

    markers.push(startMarker, endMarker);

    // 途径点标记
    route.waypoints?.forEach((waypoint, index) => {
      const waypointMarker = new window.AMap.Marker({
        position: [waypoint.longitude, waypoint.latitude],
        icon: new window.AMap.Icon({
          image: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="#fff" stroke-width="2"/>
              <text x="12" y="16" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold">${index + 1}</text>
            </svg>
          `),
          size: new window.AMap.Size(24, 24),
          imageOffset: new window.AMap.Pixel(-12, -12)
        }),
        title: waypoint.name
      });
      markers.push(waypointMarker);
    });

    // 添加标记到地图
    markers.forEach(marker => {
      map.add(marker);
    });

    setRouteMarkers(markers);
  };

  // 绘制直线路线（备选方案）
  const drawStraightLine = (route: RouteRecommendation) => {
    const path = [
      [route.startPoint.longitude, route.startPoint.latitude],
      ...route.waypoints?.map(wp => [wp.longitude, wp.latitude]) || [],
      [route.endPoint.longitude, route.endPoint.latitude]
    ];

    const polyline = new window.AMap.Polyline({
      path: path,
      strokeColor: '#3B82F6',
      strokeWeight: 4,
      strokeOpacity: 0.8,
      strokeStyle: 'dashed'
    });

    map.add(polyline);
    setRoutePolyline(polyline);
    addRouteMarkers(route);
  };

  // 清除路线
  const clearRoute = () => {
    if (routePolyline) {
      map.remove(routePolyline);
      setRoutePolyline(null);
    }
    
    routeMarkers.forEach(marker => {
      map.remove(marker);
    });
    setRouteMarkers([]);
  };

  // 开始导航
  const startNavigation = () => {
    if (!currentRoute) return;
    
    setIsNavigating(true);
    
    // 这里可以集成3.0.html中的实时导航功能
    console.log('开始导航:', currentRoute);
    
    // 可以通过postMessage与3.0.html通信
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'START_NAVIGATION',
        route: currentRoute
      }, '*');
    }
  };

  // 停止导航
  const stopNavigation = () => {
    setIsNavigating(false);
    
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'STOP_NAVIGATION'
      }, '*');
    }
  };

  if (!user) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6 text-center">
        <MapPin className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">智能路线推荐</h3>
        <p className="text-gray-600 mb-4">登录后获得AI智能路线推荐和地图导航服务</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* 头部信息 */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 rounded-full p-2">
              <Route className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">AI智能路线推荐</h3>
              <p className="text-blue-100 text-sm">智能体 + 高德地图集成导航</p>
            </div>
          </div>
          {currentRoute && (
            <div className="flex space-x-2">
              {!isNavigating ? (
                <button
                  onClick={startNavigation}
                  className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
                  title="开始导航"
                >
                  <Play className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={stopNavigation}
                  className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
                  title="停止导航"
                >
                  <Pause className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* 智能体面板 */}
        <div className="lg:w-1/3 border-r border-gray-200">
          <RouteAgent
            userLocation={userLocation}
            userPreferences={userPreferences}
            onRouteRecommendation={handleRouteRecommendation}
            onLocationUpdate={(location) => setUserLocation(location)}
            className="border-0 shadow-none rounded-none"
          />
        </div>

        {/* 地图面板 */}
        <div className="lg:w-2/3">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">路线地图</h4>
              {currentRoute && (
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>距离: {(currentRoute.distance / 1000).toFixed(1)}km</span>
                  <span>时间: {currentRoute.estimatedTime}分钟</span>
                  <span className="flex items-center">
                    <Shield className="w-4 h-4 mr-1" />
                    安全: {currentRoute.safetyScore}%
                  </span>
                </div>
              )}
            </div>
            
            {/* 地图容器 */}
            <div 
              ref={mapRef}
              className="w-full rounded-lg overflow-hidden border border-gray-200"
              style={{ height }}
            />

            {/* 路线信息 */}
            {currentRoute && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">当前路线</h5>
                <p className="text-gray-700 text-sm mb-3">{currentRoute.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">起点:</span>
                    <p className="font-medium">{currentRoute.startPoint.address}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">终点:</span>
                    <p className="font-medium">{currentRoute.endPoint.address}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteMapIntegration;