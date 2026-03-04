import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Navigation, Activity, Play, Pause, RotateCcw, Target, Settings } from 'lucide-react';
import { PRESET_LOCATIONS, PresetLocation, getLocationsByCategory } from '../../constants/locations';

interface GPSPosition {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

interface RunningMapProps {
  isRunning: boolean;
  currentPosition: GPSPosition | null;
  positions: GPSPosition[];
  distance: number;
  duration: number;
  pace: number;
  onMapReady?: () => void;
  onError?: (error: { code: string; message: string; type: string; details?: any }) => void;
  onPositionCorrect?: (lat: number, lng: number) => void; // 位置校正回调
  className?: string;
  height?: string;
  showReplay?: boolean; // 是否显示回放功能
  accuracy?: number; // GPS精度
  gpsSignalQuality?: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown'; // GPS信号质量
}

interface DistanceMarker {
  position: [number, number];
  distance: number;
  marker?: any;
}

export const RunningMapComponent: React.FC<RunningMapProps> = ({
  isRunning,
  currentPosition,
  positions,
  distance,
  duration,
  pace,
  onMapReady,
  onError,
  onPositionCorrect,
  className = '',
  height = '400px',
  showReplay = false,
  accuracy,
  gpsSignalQuality = 'unknown'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 回放相关状态
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replaySpeed, setReplaySpeed] = useState(1); // 回放速度倍数
  const replayTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 位置校正相关状态
  const [showLocationCorrection, setShowLocationCorrection] = useState(false);
  const [selectedPresetLocation, setSelectedPresetLocation] = useState<PresetLocation | null>(null);
  const [isManualPositioning, setIsManualPositioning] = useState(false);
  
  // 地图元素引用
  const polylineRef = useRef<any>(null);
  const currentMarkerRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null); // GPS精度圆圈
  const startMarkerRef = useRef<any>(null);
  const endMarkerRef = useRef<any>(null);
  const distanceMarkersRef = useRef<DistanceMarker[]>([]);

  // 动态加载高德地图API
  const loadAmapAPI = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 如果已经加载，直接返回
      if (window.AMap) {
        resolve();
        return;
      }

      // 获取API密钥
      const apiKey = import.meta.env.VITE_AMAP_API_KEY;
      if (!apiKey) {
        reject(new Error('高德地图API密钥未配置'));
        return;
      }

      // 创建script标签加载API
      const script = document.createElement('script');
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}&plugin=AMap.Scale,AMap.ToolBar`;
      script.async = true;
      
      script.onload = () => {
        console.log('高德地图API加载成功');
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('高德地图API加载失败'));
      };
      
      document.head.appendChild(script);
    });
  }, []);

  // 初始化高德地图
  useEffect(() => {
    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 动态加载高德地图API
        await loadAmapAPI();

        if (!mapRef.current) {
          throw new Error('地图容器未准备好');
        }

        // 创建地图实例
        const mapInstance = new window.AMap.Map(mapRef.current, {
          zoom: 16,
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
          visible: false
        }));

        // 地图加载完成事件
        mapInstance.on('complete', () => {
          console.log('跑步地图初始化完成');
          setIsMapReady(true);
          onMapReady?.();
        });

        setMap(mapInstance);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '地图初始化失败';
        setError(errorMsg);
        onError?.({
          code: 'MAP_INIT_ERROR',
          message: errorMsg,
          type: 'MAP_ERROR',
          details: err
        });
        console.error('跑步地图初始化失败:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      // 清理地图资源
      if (map) {
        // 清理所有标记和图形
        if (currentMarkerRef.current) {
          map.remove(currentMarkerRef.current);
        }
        if (accuracyCircleRef.current) {
          map.remove(accuracyCircleRef.current);
        }
        if (startMarkerRef.current) {
          map.remove(startMarkerRef.current);
        }
        if (endMarkerRef.current) {
          map.remove(endMarkerRef.current);
        }
        if (polylineRef.current) {
          map.remove(polylineRef.current);
        }
        
        // 清理距离标记
        distanceMarkersRef.current.forEach(marker => {
          if (marker.marker) {
            map.remove(marker.marker);
          }
        });
        
        map.destroy();
      }
    };
  }, [loadAmapAPI]);

  // 创建起点标记
  const createStartMarker = useCallback((position: GPSPosition) => {
    if (!map || !isMapReady) return;

    // 移除旧的起点标记
    if (startMarkerRef.current) {
      map.remove(startMarkerRef.current);
    }

    const startMarker = new window.AMap.Marker({
      position: [position.lng, position.lat],
      icon: new window.AMap.Icon({
        image: 'data:image/svg+xml;base64,' + btoa(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" fill="#60AB43" stroke="#fff" stroke-width="3"/>
            <circle cx="12" cy="12" r="3" fill="#fff"/>
          </svg>
        `),
        size: new window.AMap.Size(24, 24),
        anchor: 'center'
      }),
      title: '起点',
      zIndex: 100
    });

    map.add(startMarker);
    startMarkerRef.current = startMarker;
  }, [map, isMapReady]);

  // 创建当前位置标记
  const createCurrentMarker = useCallback((position: GPSPosition) => {
    if (!map || !isMapReady) return;

    // 移除旧的当前位置标记和精度圆圈
    if (currentMarkerRef.current) {
      map.remove(currentMarkerRef.current);
    }
    if (accuracyCircleRef.current) {
      map.remove(accuracyCircleRef.current);
    }

    // 创建GPS精度圆圈
    const currentAccuracy = accuracy || position.accuracy;
    if (currentAccuracy && currentAccuracy > 0) {
      const accuracyCircle = new window.AMap.Circle({
        center: [position.lng, position.lat],
        radius: currentAccuracy, // 精度半径（米）
        strokeColor: gpsSignalQuality === 'excellent' ? '#52c41a' : 
                     gpsSignalQuality === 'good' ? '#1890ff' : 
                     gpsSignalQuality === 'fair' ? '#faad14' : 
                     gpsSignalQuality === 'poor' ? '#ff4d4f' : '#d9d9d9',
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: gpsSignalQuality === 'excellent' ? '#52c41a' : 
                   gpsSignalQuality === 'good' ? '#1890ff' : 
                   gpsSignalQuality === 'fair' ? '#faad14' : 
                   gpsSignalQuality === 'poor' ? '#ff4d4f' : '#d9d9d9',
        fillOpacity: 0.1,
        zIndex: 50
      });
      
      map.add(accuracyCircle);
      accuracyCircleRef.current = accuracyCircle;
    }

    // 创建当前位置标记
    const currentMarker = new window.AMap.Marker({
      position: [position.lng, position.lat],
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
      title: `当前位置 (精度: ${currentAccuracy ? Math.round(currentAccuracy) : '--'}m)`,
      zIndex: 200
    });

    map.add(currentMarker);
    currentMarkerRef.current = currentMarker;
  }, [map, isMapReady, accuracy, gpsSignalQuality]);

  // 创建距离标记
  const createDistanceMarker = useCallback((position: [number, number], distanceKm: number) => {
    if (!map || !isMapReady) return;

    const marker = new window.AMap.Marker({
      position: position,
      content: `
        <div class="running-distance">
          <span class="running-number">${distanceKm}</span>km
        </div>
      `,
      anchor: 'bottom-right',
      zIndex: 150
    });

    map.add(marker);
    return marker;
  }, [map, isMapReady]);

  // 获取配速对应的颜色
  const getPaceColor = useCallback((currentPace: number) => {
    // 配速越快，颜色越绿；配速越慢，颜色越红
    if (currentPace < 4) return '#00ff00'; // 很快 - 绿色
    if (currentPace < 5) return '#7fff00'; // 快 - 黄绿色
    if (currentPace < 6) return '#ffff00'; // 中等 - 黄色
    if (currentPace < 7) return '#ff7f00'; // 慢 - 橙色
    return '#ff0000'; // 很慢 - 红色
  }, []);

  // 更新跑步路径
  const updateRunningPath = useCallback(() => {
    if (!map || !isMapReady || positions.length < 2) return;

    // 移除旧的路径
    if (polylineRef.current) {
      map.remove(polylineRef.current);
    }

    // 创建路径点数组
    const pathPoints = positions.map(pos => [pos.lng, pos.lat]);

    // 创建路径线
    const polyline = new window.AMap.Polyline({
      path: pathPoints,
      strokeColor: getPaceColor(pace),
      strokeWeight: 6,
      strokeOpacity: 0.8,
      strokeStyle: 'solid',
      lineJoin: 'round',
      lineCap: 'round',
      zIndex: 50
    });

    map.add(polyline);
    polylineRef.current = polyline;

    // 自动调整地图视野以包含所有路径点
    if (pathPoints.length > 1) {
      map.setFitView([polyline], false, [20, 20, 20, 20]);
    }
  }, [map, isMapReady, positions, pace, getPaceColor]);

  // 更新距离标记
  const updateDistanceMarkers = useCallback(() => {
    if (!map || !isMapReady || positions.length < 2) return;

    const currentDistanceKm = Math.floor(distance);
    const existingMarkersCount = distanceMarkersRef.current.length;

    // 如果需要添加新的距离标记
    if (currentDistanceKm > existingMarkersCount && currentDistanceKm > 0) {
      // 找到距离目标公里数最近的位置点
      const targetDistance = currentDistanceKm * 1000; // 转换为米
      let closestPosition = positions[0];
      let minDiff = Infinity;

      for (let i = 1; i < positions.length; i++) {
        const segmentDistance = calculateDistance(positions[0], positions[i]);
        const diff = Math.abs(segmentDistance - targetDistance);
        if (diff < minDiff) {
          minDiff = diff;
          closestPosition = positions[i];
        }
      }

      const marker = createDistanceMarker([closestPosition.lng, closestPosition.lat], currentDistanceKm);
      if (marker) {
        distanceMarkersRef.current.push({
          position: [closestPosition.lng, closestPosition.lat],
          distance: currentDistanceKm,
          marker
        });
      }
    }
  }, [map, isMapReady, positions, distance, createDistanceMarker]);

  // 计算两点间距离（米）
  const calculateDistance = useCallback((pos1: GPSPosition, pos2: GPSPosition): number => {
    const R = 6371000; // 地球半径（米）
    const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const dLng = (pos2.lng - pos1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // 监听位置变化，更新地图
  useEffect(() => {
    if (!currentPosition || !map || !isMapReady) return;

    // 创建或更新当前位置标记
    createCurrentMarker(currentPosition);

    // 如果是第一个位置，创建起点标记
    if (positions.length === 1) {
      createStartMarker(currentPosition);
      map.setCenter([currentPosition.lng, currentPosition.lat]);
    }

    // 如果正在跑步，更新路径和距离标记
    if (isRunning && positions.length > 1) {
      updateRunningPath();
      updateDistanceMarkers();
    }
  }, [currentPosition, positions, isRunning, map, isMapReady, createCurrentMarker, createStartMarker, updateRunningPath, updateDistanceMarkers]);

  // 回放功能
  const startReplay = useCallback(() => {
    if (positions.length === 0) return;
    
    setIsReplaying(true);
    setReplayIndex(0);
    
    // 清除现有的路径和标记
    if (polylineRef.current) {
      map.remove(polylineRef.current);
      polylineRef.current = null;
    }
    
    // 清除距离标记
    distanceMarkersRef.current.forEach(marker => {
      if (marker.marker) {
        map.remove(marker.marker);
      }
    });
    distanceMarkersRef.current = [];
    
    // 开始回放动画
    const replayInterval = 1000 / replaySpeed; // 根据速度调整间隔
    replayTimerRef.current = setInterval(() => {
      setReplayIndex(prevIndex => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= positions.length) {
          // 回放完成
          setIsReplaying(false);
          if (replayTimerRef.current) {
            clearInterval(replayTimerRef.current);
            replayTimerRef.current = null;
          }
          return prevIndex;
        }
        return nextIndex;
      });
    }, replayInterval);
  }, [positions, map, replaySpeed]);

  const pauseReplay = useCallback(() => {
    if (replayTimerRef.current) {
      clearInterval(replayTimerRef.current);
      replayTimerRef.current = null;
    }
    setIsReplaying(false);
  }, []);

  const resetReplay = useCallback(() => {
    pauseReplay();
    setReplayIndex(0);
    
    // 重新绘制完整路径
    if (positions.length > 0 && map) {
      updateRunningPath();
    }
  }, [pauseReplay, positions, map, updateRunningPath]);

  // 回放时更新路径
  useEffect(() => {
    if (isReplaying && replayIndex > 0 && map && positions.length > 0) {
      const replayPositions = positions.slice(0, replayIndex + 1);
      
      // 清除现有路径
      if (polylineRef.current) {
        map.remove(polylineRef.current);
      }
      
      // 绘制回放路径
      if (replayPositions.length > 1) {
        const path = replayPositions.map(pos => [pos.lng, pos.lat]);
        polylineRef.current = new window.AMap.Polyline({
          path,
          strokeColor: '#1890ff',
          strokeWeight: 4,
          strokeOpacity: 0.8,
          lineJoin: 'round',
          lineCap: 'round'
        });
        map.add(polylineRef.current);
      }
      
      // 更新当前位置标记
      const currentPos = positions[replayIndex];
      if (currentMarkerRef.current) {
        currentMarkerRef.current.setPosition([currentPos.lng, currentPos.lat]);
      }
      
      // 地图跟随当前位置
      map.setCenter([currentPos.lng, currentPos.lat]);
    }
  }, [isReplaying, replayIndex, map, positions]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (replayTimerRef.current) {
        clearInterval(replayTimerRef.current);
      }
    };
  }, []);

  // 清理函数
  useEffect(() => {
    return () => {
      // 清理所有标记和路径
      if (map) {
        if (polylineRef.current) map.remove(polylineRef.current);
        if (currentMarkerRef.current) map.remove(currentMarkerRef.current);
        if (startMarkerRef.current) map.remove(startMarkerRef.current);
        if (endMarkerRef.current) map.remove(endMarkerRef.current);
        
        distanceMarkersRef.current.forEach(({ marker }) => {
          if (marker) map.remove(marker);
        });
        distanceMarkersRef.current = [];
      }
    };
  }, [map]);

  // 重试加载地图
  const retryLoadMap = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      // 动态加载高德地图API
      await loadAmapAPI();

      if (!mapRef.current) {
        throw new Error('地图容器未准备好');
      }

      // 创建地图实例
      const mapInstance = new window.AMap.Map(mapRef.current, {
        zoom: 16,
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
        visible: false
      }));

      // 地图加载完成事件
      mapInstance.on('complete', () => {
        console.log('跑步地图重新加载完成');
        setIsMapReady(true);
        onMapReady?.();
      });

      setMap(mapInstance);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '地图重新加载失败';
      setError(errorMsg);
      onError?.({
        code: 'MAP_RELOAD_ERROR',
        message: errorMsg,
        type: 'MAP_ERROR',
        details: err
      });
      console.error('跑步地图重新加载失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, [loadAmapAPI, onMapReady, onError]);

  // 处理地图点击事件（手动定位）
  const handleMapClick = useCallback((e: any) => {
    if (!isManualPositioning) return;
    
    const { lng, lat } = e.lnglat;
    console.log('手动选择位置:', { lat, lng });
    
    // 调用位置校正回调
    onPositionCorrect?.(lat, lng);
    
    // 退出手动定位模式
    setIsManualPositioning(false);
  }, [isManualPositioning, onPositionCorrect]);

  // 设置地图点击事件
  useEffect(() => {
    if (map && isMapReady) {
      if (isManualPositioning) {
        map.on('click', handleMapClick);
        // 改变鼠标样式
        map.getContainer().style.cursor = 'crosshair';
      } else {
        map.off('click', handleMapClick);
        map.getContainer().style.cursor = 'default';
      }
    }
    
    return () => {
      if (map) {
        map.off('click', handleMapClick);
        map.getContainer().style.cursor = 'default';
      }
    };
  }, [map, isMapReady, isManualPositioning, handleMapClick]);

  // 处理预设位置选择
  const handlePresetLocationSelect = useCallback((location: PresetLocation) => {
    console.log('选择预设位置:', location);
    onPositionCorrect?.(location.lat, location.lng);
    setSelectedPresetLocation(location);
    setShowLocationCorrection(false);
  }, [onPositionCorrect]);

  // 获取GPS信号质量颜色
  const getSignalQualityColor = useCallback((quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }, []);

  // 获取GPS信号质量文本
  const getSignalQualityText = useCallback((quality: string) => {
    switch (quality) {
      case 'excellent': return '优秀';
      case 'good': return '良好';
      case 'fair': return '一般';
      case 'poor': return '较差';
      default: return '未知';
    }
  }, []);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ height }}>
        <div className="text-center p-4">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2 font-medium">地图加载失败</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={retryLoadMap}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            重试加载
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
        className="w-full rounded-lg overflow-hidden"
        style={{ height }}
      />
      
      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm rounded-lg">
          <div className="text-center">
            <div className="relative">
              <Navigation className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
              <div className="absolute inset-0 w-10 h-10 border-2 border-blue-200 rounded-full animate-pulse"></div>
            </div>
            <p className="text-gray-700 font-medium mb-1">正在加载地图...</p>
            <p className="text-sm text-gray-500">请稍候，正在连接高德地图服务</p>
          </div>
        </div>
      )}

      {/* 地图信息面板 */}
      {isMapReady && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="space-y-2">
            {/* GPS信息 */}
            {currentPosition && (
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600">精度</span>
                  <span className="font-medium">{(accuracy || currentPosition.accuracy)?.toFixed(0) || '--'}m</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${gpsSignalQuality === 'excellent' ? 'bg-green-500' : 
                    gpsSignalQuality === 'good' ? 'bg-blue-500' : 
                    gpsSignalQuality === 'fair' ? 'bg-yellow-500' : 
                    gpsSignalQuality === 'poor' ? 'bg-red-500' : 'bg-gray-500'}`} />
                  <span className="text-gray-600">信号</span>
                  <span className={`font-medium ${getSignalQualityColor(gpsSignalQuality)}`}>
                    {getSignalQualityText(gpsSignalQuality)}
                  </span>
                </div>
                {currentPosition.speed && (
                  <div className="flex items-center space-x-1">
                    <Navigation className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600">速度</span>
                    <span className="font-medium">{(currentPosition.speed * 3.6).toFixed(1)} km/h</span>
                  </div>
                )}
              </div>
            )}
            
            {/* 位置校正按钮 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowLocationCorrection(!showLocationCorrection)}
                className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                title="校正位置"
              >
                <Target className="w-3 h-3" />
                <span>校正位置</span>
              </button>
              
              <button
                onClick={() => setIsManualPositioning(!isManualPositioning)}
                className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
                  isManualPositioning 
                    ? 'bg-orange-600 text-white hover:bg-orange-700' 
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
                title={isManualPositioning ? "取消手动定位" : "手动定位"}
              >
                <Settings className="w-3 h-3" />
                <span>{isManualPositioning ? '取消' : '手动'}</span>
              </button>
            </div>
            
            {/* 手动定位提示 */}
            {isManualPositioning && (
              <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                点击地图选择您的当前位置
              </div>
            )}
          </div>
        </div>
      )}

      {/* 回放控制面板 */}
      {showReplay && positions.length > 0 && !isRunning && (
        <div className="absolute top-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="flex items-center space-x-2">
            <button
              onClick={isReplaying ? pauseReplay : startReplay}
              className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              title={isReplaying ? "暂停回放" : "开始回放"}
            >
              {isReplaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={resetReplay}
              className="flex items-center justify-center w-8 h-8 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors"
              title="重置回放"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <div className="text-xs text-gray-600 ml-2">
              {isReplaying ? `${replayIndex}/${positions.length}` : '路径回放'}
            </div>
          </div>
          
          {/* 回放速度控制 */}
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-xs text-gray-600">速度:</span>
            {[0.5, 1, 2, 4].map(speed => (
              <button
                key={speed}
                onClick={() => setReplaySpeed(speed)}
                className={`px-2 py-1 text-xs rounded ${
                  replaySpeed === speed
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 位置校正面板 */}
      {showLocationCorrection && (
        <div className="absolute top-4 right-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-800">位置校正</h3>
              <button
                onClick={() => setShowLocationCorrection(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            {/* 预设位置选择 */}
            <div className="space-y-2">
              <p className="text-xs text-gray-600">选择常用位置：</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {getLocationsByCategory('university').map((location) => (
                  <button
                    key={location.id}
                    onClick={() => handlePresetLocationSelect(location)}
                    className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                      selectedPresetLocation?.id === location.id
                        ? 'bg-blue-100 text-blue-800'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {location.name}
                  </button>
                ))}
                {getLocationsByCategory('landmark').slice(0, 3).map((location) => (
                  <button
                    key={location.id}
                    onClick={() => handlePresetLocationSelect(location)}
                    className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                      selectedPresetLocation?.id === location.id
                        ? 'bg-blue-100 text-blue-800'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {location.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 选中位置信息 */}
            {selectedPresetLocation && (
              <div className="bg-blue-50 p-2 rounded text-xs">
                <p className="font-medium text-blue-800">{selectedPresetLocation.name}</p>
                <p className="text-blue-600">
                  {selectedPresetLocation.lat.toFixed(4)}, {selectedPresetLocation.lng.toFixed(4)}
                </p>
                <button
                  onClick={() => {
                    if (onPositionCorrect) {
                      onPositionCorrect(selectedPresetLocation.lat, selectedPresetLocation.lng);
                    }
                    setShowLocationCorrection(false);
                    setSelectedPresetLocation(null);
                  }}
                  className="mt-1 w-full bg-blue-600 text-white py-1 rounded hover:bg-blue-700 transition-colors"
                >
                  应用此位置
                </button>
              </div>
            )}
            
            <div className="border-t pt-2">
              <p className="text-xs text-gray-500">
                或点击地图上的任意位置进行手动定位
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 路径统计信息 */}
      {positions.length > 1 && (
        <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">路径点:</span>
              <span className="font-medium">{positions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">距离:</span>
              <span className="font-medium">{(distance / 1000).toFixed(2)} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">配速:</span>
              <span className="font-medium" style={{ color: getPaceColor(pace) }}>
                {pace.toFixed(1)} min/km
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 自定义样式 */}
      <style>{`
        .running-distance {
          background-color: #000;
          font-size: 12px;
          font-family: 'Arial', sans-serif;
          color: #fff;
          min-width: 50px;
          height: 24px;
          line-height: 24px;
          text-align: center;
          border-top-left-radius: 12px;
          border-bottom-left-radius: 12px;
          position: relative;
          white-space: nowrap;
          padding: 0 8px;
          font-weight: bold;
        }
        
        .running-distance:after {
          content: "";
          right: -12px;
          top: 0;
          position: absolute;
          height: 0;
          width: 0;
          border: 12px solid transparent;
          border-left-color: #000;
        }
        
        .running-distance .running-number {
          color: #83DD00;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default RunningMapComponent;