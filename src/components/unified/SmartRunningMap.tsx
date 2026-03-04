// 智能跑步地图组件 - 整合GPS追踪和AI建议显示
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Navigation, AlertTriangle, Target, Activity, Plus, Trash2, Route, Settings, Play, Pause } from 'lucide-react';
import { UnifiedGPSAIService } from '../../services/unified/UnifiedGPSAIService';
import { routeService } from '../../services/RouteService';
import { WaypointManager } from '../navigation/WaypointManager';
import { RouteNavigator } from '../navigation/RouteNavigator';
import type { 
  SmartRunningMapProps, 
  GPSPosition, 
  RouteData, 
  FusedData,
  SafetyAlert,
  NavigationGuidance
} from '../../types/unified';
import type { Waypoint, RouteData as NavigationRouteData } from '../../types/navigation';

// 途径点数据接口
interface WaypointData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  desc?: string;
  marker?: any;
}

// 地图模式枚举
enum MapMode {
  FREE_RUNNING = 'free_running',
  NAVIGATION = 'navigation',
  PLANNING = 'planning'
}

export const SmartRunningMap: React.FC<SmartRunningMapProps> = ({
  route,
  currentLocation,
  showAIInsights = true,
  onLocationUpdate,
  onRouteSelect,
  waypoints: propWaypoints = [],
  navigationRoute: propNavigationRoute = null,
  isNavigating: propIsNavigating = false,
  runMode = 'free_running'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const unifiedServiceRef = useRef<UnifiedGPSAIService | null>(null);
  
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<GPSPosition | null>(currentLocation || null);
  const [fusedData, setFusedData] = useState<FusedData | null>(null);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  
  // 新增导航相关状态
  const [mapMode, setMapMode] = useState<MapMode>(
    runMode === 'navigation_running' ? MapMode.NAVIGATION : MapMode.FREE_RUNNING
  );
  const [waypoints, setWaypoints] = useState<Waypoint[]>(
    propWaypoints.map((wp, index) => ({
      id: wp.id,
      name: wp.name,
      lat: wp.latitude,
      lng: wp.longitude,
      desc: wp.address || '',
      order: index,
      category: wp.type as any || 'waypoint'
    }))
  );
  const [navigationRoute, setNavigationRoute] = useState<NavigationRouteData | null>(propNavigationRoute);
  const [routePolyline, setRoutePolyline] = useState<any>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isNavigating, setIsNavigating] = useState(propIsNavigating);
  const [showWaypointManager, setShowWaypointManager] = useState(false);
  const [showRouteNavigator, setShowRouteNavigator] = useState(false);

  // 初始化统一服务
  useEffect(() => {
    const initializeService = async () => {
      try {
        unifiedServiceRef.current = UnifiedGPSAIService.getInstance();
        await unifiedServiceRef.current.initialize();
        
        // 监听统一数据更新
        unifiedServiceRef.current.on('unifiedDataUpdate', handleUnifiedDataUpdate);
        unifiedServiceRef.current.on('safetyAlert', handleSafetyAlert);
        unifiedServiceRef.current.on('gpsUpdate', handleGPSUpdate);
        
        console.log('✅ 智能地图服务初始化完成');
      } catch (error) {
        console.error('❌ 智能地图服务初始化失败:', error);
      }
    };

    initializeService();
    
    return () => {
      if (unifiedServiceRef.current) {
        unifiedServiceRef.current.off('unifiedDataUpdate', handleUnifiedDataUpdate);
        unifiedServiceRef.current.off('safetyAlert', handleSafetyAlert);
        unifiedServiceRef.current.off('gpsUpdate', handleGPSUpdate);
      }
    };
  }, []);

  // 监听props变化并更新内部状态
  useEffect(() => {
    // 更新运行模式
    const newMapMode = runMode === 'navigation_running' ? MapMode.NAVIGATION : MapMode.FREE_RUNNING;
    if (newMapMode !== mapMode) {
      setMapMode(newMapMode);
    }

    // 更新导航状态
    if (propIsNavigating !== isNavigating) {
      setIsNavigating(propIsNavigating);
    }

    // 更新导航路线
    if (propNavigationRoute !== navigationRoute) {
      setNavigationRoute(propNavigationRoute);
    }

    // 更新途径点
    const newWaypoints = propWaypoints.map((wp, index) => ({
      id: wp.id,
      name: wp.name,
      lat: wp.latitude,
      lng: wp.longitude,
      desc: wp.address || '',
      order: index,
      category: wp.type as any || 'waypoint'
    }));
    
    if (JSON.stringify(newWaypoints) !== JSON.stringify(waypoints)) {
      setWaypoints(newWaypoints);
    }
  }, [runMode, propIsNavigating, propNavigationRoute, propWaypoints, mapMode, isNavigating, navigationRoute, waypoints]);

  // 初始化地图 - 使用5.0.html的精确定位逻辑
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current || isMapLoaded) return;

      try {
        // 等待高德地图API加载
        if (!window.AMap) {
          await loadAmapScript();
        }

        // 使用5.0.html的地图配置 - 更精确的定位
        const map = new window.AMap.Map(mapRef.current, {
          zoom: 15,
          center: [121.5035, 31.2973], // 使用5.0.html的默认中心点（更准确的上海坐标）
          mapStyle: 'amap://styles/normal',
          features: ['bg', 'road', 'building', 'point'],
          viewMode: '2D',
          resizeEnable: true,
          rotateEnable: false,
          pitchEnable: false,
          zoomEnable: true,
          dragEnable: true
        });

        mapInstanceRef.current = map;
        setIsMapLoaded(true);

        // 添加地图控件 - 与5.0.html保持一致
        map.addControl(new window.AMap.Scale());
        map.addControl(new window.AMap.ToolBar());

        // 启用高精度定位 - 集成5.0.html的定位逻辑
        initializeHighAccuracyLocation(map);

        // 添加地图点击事件 - 仅在规划模式下添加途径点
        map.on('click', handleMapClick);

        // 如果有路线数据，绘制路线
        if (route) {
          drawRoute(route);
        }

        // 如果有当前位置，添加位置标记
        if (currentPosition) {
          addCurrentLocationMarker(currentPosition);
        }

        console.log('✅ 智能地图初始化完成（使用5.0.html精确定位逻辑），已绑定点击事件');
      } catch (error) {
        console.error('❌ 地图初始化失败:', error);
      }
    };

    initializeMap();
  }, [currentPosition, route, isMapLoaded]);

  // 处理地图点击事件 - 仅在规划模式下添加途径点
  const handleMapClick = useCallback((e: any) => {
    if (mapMode !== MapMode.PLANNING) return;
    
    const { lng, lat } = e.lnglat;
    
    const waypoint: Waypoint = {
      id: `waypoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `点${waypoints.length + 1}`,
      lat: lat,
      lng: lng,
      desc: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      order: waypoints.length,
      category: 'waypoint'
    };

    addWaypoint(waypoint);
  }, [mapMode, waypoints.length]);

  // 添加途径点
  const addWaypoint = useCallback((waypoint: Waypoint) => {
    if (!mapInstanceRef.current) return;

    // 创建标记
    const marker = new window.AMap.Marker({
      position: [waypoint.lng, waypoint.lat],
      title: waypoint.name,
      content: createMarkerContent(waypoint.name, waypoints.length + 1)
    });

    mapInstanceRef.current.add(marker);

    // 更新途径点列表
    setWaypoints(prev => {
      const newWaypoints = [...prev, waypoint];
      console.log(`✅ 添加途径点: ${waypoint.name} (${waypoint.lat.toFixed(6)}, ${waypoint.lng.toFixed(6)})`);
      return newWaypoints;
    });

    setMapMarkers(prev => [...prev, marker]);
  }, [waypoints.length]);

  // 创建标记内容
  const createMarkerContent = (name: string, index: number) => {
    return `<div style="
      background: #3B82F6;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      text-align: center;
      min-width: 24px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    ">${index}</div>`;
  };

  // 清除途径点
  const clearWaypoints = useCallback(() => {
    if (!mapInstanceRef.current) return;

    // 移除地图上的标记
    mapMarkers.forEach(marker => {
      mapInstanceRef.current.remove(marker);
    });

    // 清除路线
    if (routePolyline) {
      mapInstanceRef.current.remove(routePolyline);
      setRoutePolyline(null);
    }

    setWaypoints([]);
    setNavigationRoute(null);
    setMapMarkers([]);
    console.log('🗑️ 已清除所有途径点和路线');
  }, [mapMarkers, routePolyline]);

  // 规划路线
  const planRoute = useCallback(async () => {
    if (waypoints.length < 2) {
      console.warn('⚠️ 需要至少2个途径点才能规划路线');
      return;
    }

    setIsPlanning(true);
    
    try {
      // 使用RouteService进行路线规划
      const routeRequest = {
        origin: waypoints[0],
        destination: waypoints[waypoints.length - 1],
        waypoints: waypoints.slice(1, -1) // 中间的途径点
      };

      const routeData = await routeService.planWalkingRoute(routeRequest);
      setNavigationRoute(routeData);

      // 在地图上绘制路线
      drawNavigationRoute(routeData);
      
      console.log('✅ 路线规划完成');
    } catch (error) {
      console.error('❌ 路线规划失败:', error);
    } finally {
      setIsPlanning(false);
    }
  }, [waypoints]);

  // 绘制导航路线
  const drawNavigationRoute = useCallback((routeData: NavigationRouteData) => {
    if (!mapInstanceRef.current) return;

    // 清除现有路线
    if (routePolyline) {
      mapInstanceRef.current.remove(routePolyline);
    }

    // 绘制路线
    const polyline = new window.AMap.Polyline({
      path: routeData.coordinates,
      strokeColor: '#3B82F6',
      strokeWeight: 4,
      strokeOpacity: 0.8,
      strokeStyle: 'solid'
    });

    mapInstanceRef.current.add(polyline);
    setRoutePolyline(polyline);
    
    // 调整地图视野以显示完整路线
    mapInstanceRef.current.setFitView([polyline]);
  }, [routePolyline]);

  // 开始导航
  const startNavigation = useCallback(() => {
    if (!navigationRoute) return;
    
    setIsNavigating(true);
    setMapMode(MapMode.NAVIGATION);
    setShowRouteNavigator(true);
    console.log('🧭 开始导航模式');
  }, [navigationRoute]);

  // 停止导航
  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    setMapMode(MapMode.FREE_RUNNING);
    setShowRouteNavigator(false);
    console.log('⏹️ 停止导航模式');
  }, []);

  // 切换地图模式
  const toggleMapMode = useCallback(() => {
    const modes = [MapMode.FREE_RUNNING, MapMode.PLANNING, MapMode.NAVIGATION];
    const currentIndex = modes.indexOf(mapMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    
    // 如果切换到导航模式但没有路线，则跳过
    if (nextMode === MapMode.NAVIGATION && !navigationRoute) {
      const afterNavIndex = (currentIndex + 2) % modes.length;
      setMapMode(modes[afterNavIndex]);
    } else {
      setMapMode(nextMode);
    }
    
    console.log(`🔄 切换地图模式: ${nextMode}`);
  }, [mapMode, navigationRoute]);

  // 获取步行路线段
  const fetchWalkingSegment = async (origin: string, destination: string) => {
    const restKey = import.meta.env.VITE_AMAP_REST_KEY;
    if (!restKey) {
      throw new Error('缺少高德REST API密钥');
    }

    const url = `https://restapi.amap.com/v3/direction/walking?origin=${origin}&destination=${destination}&key=${restKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === '1' && data.route && data.route.paths && data.route.paths.length > 0) {
      return data.route.paths[0];
    }
    
    return null;
  };

  // 标准化polyline字符串
  const normalizePolylineString = (polylineStr: string): [number, number][] => {
    if (!polylineStr || typeof polylineStr !== 'string') return [];
    return polylineStr.split(';').map(s => {
      const [lng, lat] = s.split(',').map(Number);
      return [lng, lat] as [number, number];
    }).filter(p => !isNaN(p[0]) && !isNaN(p[1]));
  };

  // 处理统一数据更新
  const handleUnifiedDataUpdate = useCallback((data: FusedData) => {
    setFusedData(data);
    
    // 更新当前位置
    const newPosition: GPSPosition = {
      latitude: data.gps.latitude,
      longitude: data.gps.longitude,
      accuracy: data.gps.accuracy || 10,
      timestamp: data.gps.timestamp
    };
    
    setCurrentPosition(newPosition);
    
    // 更新AI洞察
    if (showAIInsights && data.insights.recommendations) {
      setAiInsights(data.insights.recommendations);
    }
    
    // 通知父组件位置更新
    if (onLocationUpdate) {
      onLocationUpdate(newPosition);
    }
    
    // 更新地图上的位置标记
    if (mapInstanceRef.current) {
      updateCurrentLocationMarker(newPosition);
    }
  }, [showAIInsights, onLocationUpdate]);

  // 处理安全警报
  const handleSafetyAlert = useCallback((alert: SafetyAlert) => {
    setSafetyAlerts(prev => [...prev.slice(-4), alert]); // 保留最近5个警报
    
    // 在地图上显示警报位置
    if (mapInstanceRef.current && currentPosition) {
      addSafetyAlertMarker(currentPosition, alert);
    }
  }, [currentPosition]);

  // 处理GPS更新
  const handleGPSUpdate = useCallback((gpsData: any) => {
    const newPosition: GPSPosition = {
      latitude: gpsData.latitude,
      longitude: gpsData.longitude,
      accuracy: gpsData.accuracy || 10,
      timestamp: gpsData.timestamp
    };
    
    setCurrentPosition(newPosition);
    
    if (onLocationUpdate) {
      onLocationUpdate(newPosition);
    }
  }, [onLocationUpdate]);

  // 开始追踪
  const startTracking = async () => {
    if (!unifiedServiceRef.current) return;

    try {
      await unifiedServiceRef.current.startUnifiedTracking({
        gpsOptions: {
          enableHighAccuracy: true,
          updateInterval: 2000
        },
        aiOptions: {
          contextAwareness: true,
          realtimeAnalysis: true
        }
      });
      
      setIsTracking(true);
      console.log('✅ 开始智能追踪');
    } catch (error) {
      console.error('❌ 开始追踪失败:', error);
    }
  };

  // 停止追踪
  const stopTracking = async () => {
    if (!unifiedServiceRef.current) return;

    try {
      await unifiedServiceRef.current.stopUnifiedTracking();
      setIsTracking(false);
      console.log('✅ 停止智能追踪');
    } catch (error) {
      console.error('❌ 停止追踪失败:', error);
    }
  };

  // 绘制路线
  const drawRoute = (routeData: RouteData) => {
    if (!mapInstanceRef.current || !routeData.waypoints) return;

    // 清除现有路线
    clearRouteMarkers();

    const path = routeData.waypoints.map(wp => [wp.longitude, wp.latitude]);
    
    // 绘制路线
    const polyline = new window.AMap.Polyline({
      path,
      strokeColor: '#3B82F6',
      strokeWeight: 4,
      strokeOpacity: 0.8,
      strokeStyle: 'solid'
    });

    mapInstanceRef.current.add(polyline);

    // 添加起点和终点标记
    if (routeData.waypoints.length > 0) {
      const startPoint = routeData.waypoints[0];
      const endPoint = routeData.waypoints[routeData.waypoints.length - 1];

      addRouteMarker(startPoint, 'start', '起点');
      addRouteMarker(endPoint, 'end', '终点');
    }

    // 调整地图视野
    mapInstanceRef.current.setFitView();
  };

  // 添加路线标记
  const addRouteMarker = (point: any, type: 'start' | 'end', title: string) => {
    if (!mapInstanceRef.current) return;

    const marker = new window.AMap.Marker({
      position: [point.longitude, point.latitude],
      title,
      icon: new window.AMap.Icon({
        image: type === 'start' ? '/icons/start-marker.png' : '/icons/end-marker.png',
        size: new window.AMap.Size(32, 32),
        imageSize: new window.AMap.Size(32, 32)
      })
    });

    mapInstanceRef.current.add(marker);
    setMapMarkers(prev => [...prev, marker]);
  };

  // 添加当前位置标记 - 使用5.0.html的样式
  const addCurrentLocationMarker = (position: GPSPosition) => {
    if (!mapInstanceRef.current) return;

    // 创建蓝色圆点标记，与5.0.html保持一致
    const marker = new window.AMap.Marker({
      position: [position.longitude, position.latitude],
      title: `当前位置 (精度: ${position.accuracy ? Math.round(position.accuracy) : '--'}m)`,
      icon: new window.AMap.Icon({
        image: 'data:image/svg+xml;base64,' + btoa(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" fill="#1890ff" stroke="#fff" stroke-width="3"/>
            <circle cx="12" cy="12" r="3" fill="#fff"/>
            <circle cx="12" cy="12" r="12" fill="none" stroke="#1890ff" stroke-width="1" opacity="0.3">
              <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite"/>
            </circle>
          </svg>
        `),
        size: new window.AMap.Size(24, 24),
        anchor: 'center'
      }),
      zIndex: 200
    });

    // 添加GPS精度圆圈
    if (position.accuracy && position.accuracy > 0) {
      const accuracyCircle = new window.AMap.Circle({
        center: [position.longitude, position.latitude],
        radius: position.accuracy,
        strokeColor: '#1890ff',
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: '#1890ff',
        fillOpacity: 0.1,
        zIndex: 50
      });
      
      mapInstanceRef.current.add(accuracyCircle);
      setMapMarkers(prev => [...prev, accuracyCircle]);
    }

    mapInstanceRef.current.add(marker);
    
    setMapMarkers(prev => [...prev, marker]);
  };

  // 更新当前位置标记
  const updateCurrentLocationMarker = (position: GPSPosition) => {
    if (!mapInstanceRef.current) return;

    // 移除旧的位置标记和精度圆圈
    const oldMarkers = mapMarkers.filter(marker => {
      const title = marker.getTitle ? marker.getTitle() : '';
      return title.includes('当前位置') || marker.CLASS_NAME === 'AMap.Circle';
    });
    
    oldMarkers.forEach(marker => {
      mapInstanceRef.current.remove(marker);
    });

    // 更新标记数组，移除已删除的标记
    setMapMarkers(prev => prev.filter(marker => !oldMarkers.includes(marker)));

    // 添加新的位置标记
    addCurrentLocationMarker(position);
  };

  // 添加安全警报标记
  const addSafetyAlertMarker = (position: GPSPosition, alert: SafetyAlert) => {
    if (!mapInstanceRef.current) return;

    const marker = new window.AMap.Marker({
      position: [position.longitude, position.latitude],
      title: `安全警报: ${alert.message}`,
      icon: new window.AMap.Icon({
        image: '/icons/safety-alert.png',
        size: new window.AMap.Size(20, 20),
        imageSize: new window.AMap.Size(20, 20)
      })
    });

    mapInstanceRef.current.add(marker);
    setMapMarkers(prev => [...prev, marker]);

    // 5秒后移除警报标记
    setTimeout(() => {
      mapInstanceRef.current.remove(marker);
      setMapMarkers(prev => prev.filter(m => m !== marker));
    }, 5000);
  };

  // 清除路线标记
  const clearRouteMarkers = () => {
    mapMarkers.forEach(marker => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove(marker);
      }
    });
    setMapMarkers([]);
  };

  // 加载高德地图脚本 - 使用5.0.html的插件配置
  const loadAmapScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.AMap) {
        resolve();
        return;
      }

      // 使用与5.0.html相同的API密钥和插件配置
      const amapKey = import.meta.env.VITE_AMAP_API_KEY || '';
      const script = document.createElement('script');
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${amapKey}&plugin=AMap.Geolocation,AMap.Driving,AMap.Walking,AMap.Scale,AMap.ToolBar,AMap.Marker,AMap.Polyline,AMap.InfoWindow`;
      script.async = true;
      script.onload = () => {
        console.log('✅ 高德地图API加载成功（5.0.html配置）');
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Amap script'));
      document.head.appendChild(script);
    });
  };

  // 初始化高精度定位 - 集成5.0.html的定位逻辑
  const initializeHighAccuracyLocation = (map: any) => {
    if (!navigator.geolocation) {
      console.warn('浏览器不支持定位功能');
      return;
    }

    // 使用5.0.html的高精度定位配置
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude: lat, longitude: lng, accuracy } = position.coords;
        
        console.log('📍 高精度定位更新:', { lat, lng, accuracy });
        
        // 更新当前位置状态
        const newPosition: GPSPosition = {
          latitude: lat,
          longitude: lng,
          timestamp: Date.now(),
          accuracy
        };
        
        setCurrentPosition(newPosition);
        onLocationUpdate?.(newPosition);
        
        // 如果是第一次定位，将地图中心移动到当前位置
        if (!currentPosition) {
          map.setCenter([lng, lat]);
          console.log('🎯 地图中心已更新到当前位置');
        }
        
        // 添加或更新当前位置标记
        addCurrentLocationMarker(newPosition);
      },
      (error) => {
        console.warn('📍 定位失败:', error.message);
        // 定位失败时的处理逻辑
        switch (error.code) {
          case error.PERMISSION_DENIED:
            console.warn('用户拒绝了定位请求');
            break;
          case error.POSITION_UNAVAILABLE:
            console.warn('位置信息不可用');
            break;
          case error.TIMEOUT:
            console.warn('定位请求超时');
            break;
        }
      },
      {
        enableHighAccuracy: true, // 启用高精度定位
        maximumAge: 2000,         // 最大缓存时间2秒
        timeout: 10000            // 超时时间10秒
      }
    );

    // 保存watchId以便后续清理
    return watchId;
  };

  // 获取地图模式显示文本
  const getMapModeText = () => {
    switch (mapMode) {
      case MapMode.FREE_RUNNING:
        return '自由跑步';
      case MapMode.PLANNING:
        return '路线规划';
      case MapMode.NAVIGATION:
        return '导航模式';
      default:
        return '未知模式';
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
      {/* 地图容器 */}
      <div ref={mapRef} className="w-full h-full" />

      {/* 主控制面板 */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2 max-w-xs">
        {/* 模式切换 */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700">模式: {getMapModeText()}</span>
          <button
            onClick={toggleMapMode}
            className="flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 hover:bg-gray-200"
          >
            <Settings className="w-3 h-3" />
            <span>切换</span>
          </button>
        </div>

        {/* 追踪控制 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={isTracking ? stopTracking : startTracking}
            className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium ${
              isTracking 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{isTracking ? '停止追踪' : '开始追踪'}</span>
          </button>
        </div>

        {/* 规划模式控制 */}
        {mapMode === MapMode.PLANNING && (
          <div className="border-t pt-2">
            <div className="text-xs font-medium text-gray-700 mb-2">路线规划</div>
            <div className="flex items-center space-x-1 mb-2">
              <button
                onClick={planRoute}
                disabled={waypoints.length < 2 || isPlanning}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
                  waypoints.length >= 2 && !isPlanning
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Route className="w-3 h-3" />
                <span>{isPlanning ? '规划中...' : '规划路线'}</span>
              </button>
              <button
                onClick={clearWaypoints}
                disabled={waypoints.length === 0}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
                  waypoints.length > 0
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-3 h-3" />
                <span>清除</span>
              </button>
            </div>
            <div className="text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <Plus className="w-3 h-3" />
                <span>点击地图添加途径点 ({waypoints.length})</span>
              </div>
            </div>
            {navigationRoute && (
              <button
                onClick={startNavigation}
                className="w-full mt-2 flex items-center justify-center space-x-1 px-2 py-1 rounded text-xs font-medium bg-blue-500 text-white hover:bg-blue-600"
              >
                <Navigation className="w-3 h-3" />
                <span>开始导航</span>
              </button>
            )}
          </div>
        )}

        {/* 导航模式控制 */}
        {mapMode === MapMode.NAVIGATION && (
          <div className="border-t pt-2">
            <div className="text-xs font-medium text-gray-700 mb-2">导航控制</div>
            <div className="flex items-center space-x-1">
              <button
                onClick={isNavigating ? stopNavigation : startNavigation}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
                  isNavigating
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isNavigating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isNavigating ? '停止导航' : '开始导航'}</span>
              </button>
            </div>
          </div>
        )}

        {/* GPS状态 */}
        {currentPosition && (
          <div className="text-xs text-gray-600 border-t pt-2">
            <div className="flex items-center space-x-1">
              <MapPin className="w-3 h-3" />
              <span>GPS: {currentPosition.accuracy?.toFixed(0) || 'N/A'}m</span>
            </div>
          </div>
        )}

        {/* 数据质量指示器 */}
        {fusedData && (
          <div className="text-xs">
            <div className={`flex items-center space-x-1 ${
              fusedData.fusion.quality === 'excellent' ? 'text-green-600' :
              fusedData.fusion.quality === 'good' ? 'text-blue-600' :
              fusedData.fusion.quality === 'fair' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              <Target className="w-3 h-3" />
              <span>质量: {fusedData.fusion.quality}</span>
            </div>
            <div className="text-gray-600">
              置信度: {(fusedData.fusion.confidence * 100).toFixed(0)}%
            </div>
          </div>
        )}
      </div>

      {/* 途径点管理面板 */}
      {showWaypointManager && (
        <div className="absolute top-4 right-4 w-80">
          <WaypointManager
            waypoints={waypoints}
            onWaypointsChange={setWaypoints}
            onAddToMap={addWaypoint}
          />
        </div>
      )}

      {/* 路线导航面板 */}
      {showRouteNavigator && navigationRoute && (
        <div className="absolute bottom-4 left-4 w-80">
          <RouteNavigator
            route={navigationRoute}
            currentPosition={currentPosition}
            isNavigating={isNavigating}
            onNavigationStart={startNavigation}
            onNavigationStop={stopNavigation}
          />
        </div>
      )}

      {/* 途径点列表面板 */}
      {waypoints.length > 0 && mapMode === MapMode.PLANNING && !showWaypointManager && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            途径点列表 ({waypoints.length})
          </h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {waypoints.map((waypoint, index) => (
              <div key={waypoint.id} className="text-xs p-2 bg-blue-50 rounded flex items-center justify-between">
                <div>
                  <div className="font-medium">{waypoint.name}</div>
                  <div className="text-gray-600">
                    {waypoint.latitude.toFixed(6)}, {waypoint.longitude.toFixed(6)}
                  </div>
                </div>
                <div className="text-blue-600 font-bold">{index + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI洞察面板 */}
      {showAIInsights && aiInsights.length > 0 && waypoints.length === 0 && mapMode === MapMode.FREE_RUNNING && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
            <Navigation className="w-4 h-4 mr-1" />
            AI建议
          </h3>
          <div className="space-y-1">
            {aiInsights.slice(0, 3).map((insight, index) => (
              <div key={index} className="text-xs text-gray-600 p-2 bg-blue-50 rounded">
                {insight}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 安全警报面板 */}
      {safetyAlerts.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-1" />
            安全警报
          </h3>
          <div className="space-y-1">
            {safetyAlerts.slice(-2).map((alert, index) => (
              <div key={index} className={`text-xs p-2 rounded ${
                alert.level === 'critical' ? 'bg-red-100 text-red-700' :
                alert.level === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                <div className="font-medium">{alert.type}</div>
                <div>{alert.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 路线信息面板 */}
      {route && mapMode === MapMode.FREE_RUNNING && (
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">{route.name}</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <div>距离: {((route.totalDistance || 0) / 1000).toFixed(1)} km</div>
            <div>预计时间: {route.estimatedDuration} 分钟</div>
            <div>难度: {route.difficulty}</div>
            {route.safetyScore && (
              <div>安全评分: {(route.safetyScore * 100).toFixed(0)}%</div>
            )}
          </div>
        </div>
      )}

      {/* 导航路线信息面板 */}
      {navigationRoute && mapMode === MapMode.NAVIGATION && !showRouteNavigator && (
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">导航路线</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <div>总距离: {(navigationRoute.totalDistance / 1000).toFixed(1)} km</div>
            <div>预计时间: {Math.round(navigationRoute.totalDuration / 60)} 分钟</div>
            <div>导航步骤: {navigationRoute.steps.length} 个</div>
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <div className="text-sm text-gray-600">加载智能地图...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartRunningMap;