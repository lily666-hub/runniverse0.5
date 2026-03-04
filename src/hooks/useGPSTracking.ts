import { useState, useEffect, useRef, useCallback } from 'react';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export interface GPSTrackingOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  trackingInterval?: number;
  distanceFilter?: number; // 最小移动距离（米）
}

export interface GPSTrackingState {
  isTracking: boolean;
  currentLocation: LocationData | null;
  locationHistory: LocationData[];
  error: string | null;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
}

const defaultOptions: GPSTrackingOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
  trackingInterval: 5000,
  distanceFilter: 10
};

export const useGPSTracking = (options: GPSTrackingOptions = {}) => {
  const opts = { ...defaultOptions, ...options };
  
  const [state, setState] = useState<GPSTrackingState>({
    isTracking: false,
    currentLocation: null,
    locationHistory: [],
    error: null,
    permissionStatus: 'unknown'
  });

  const watchIdRef = useRef<number | null>(null);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<LocationData | null>(null);

  // 检查GPS权限
  const checkPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      setState(prev => ({ 
        ...prev, 
        error: '此设备不支持GPS定位',
        permissionStatus: 'denied'
      }));
      return false;
    }

    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setState(prev => ({ 
          ...prev, 
          permissionStatus: permission.state as any
        }));
        return permission.state === 'granted';
      }
      return true;
    } catch (error) {
      console.error('检查GPS权限失败:', error);
      return true; // 降级处理
    }
  }, []);

  // 计算两点间距离（米）
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }, []);

  // 获取当前位置
  const getCurrentLocation = useCallback((): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('此设备不支持GPS定位'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: position.timestamp
          };
          resolve(locationData);
        },
        (error) => {
          let errorMessage = '获取位置失败';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '用户拒绝了位置访问请求';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '位置信息不可用';
              break;
            case error.TIMEOUT:
              errorMessage = '获取位置超时';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: opts.enableHighAccuracy,
          timeout: opts.timeout,
          maximumAge: opts.maximumAge
        }
      );
    });
  }, [opts]);

  // 处理位置更新
  const handleLocationUpdate = useCallback((locationData: LocationData) => {
    const lastLocation = lastLocationRef.current;
    
    // 检查距离过滤器
    if (lastLocation && opts.distanceFilter) {
      const distance = calculateDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        locationData.latitude,
        locationData.longitude
      );
      
      if (distance < opts.distanceFilter) {
        return; // 移动距离太小，忽略此次更新
      }
    }

    lastLocationRef.current = locationData;
    
    setState(prev => ({
      ...prev,
      currentLocation: locationData,
      locationHistory: [...prev.locationHistory, locationData].slice(-100), // 保留最近100个位置
      error: null
    }));
  }, [opts.distanceFilter, calculateDistance]);

  // 开始GPS追踪
  const startTracking = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const hasPermission = await checkPermission();
      if (!hasPermission) {
        throw new Error('GPS权限被拒绝');
      }

      // 先获取一次当前位置
      const initialLocation = await getCurrentLocation();
      handleLocationUpdate(initialLocation);

      setState(prev => ({ ...prev, isTracking: true }));

      // 开始持续追踪
      if (opts.trackingInterval && opts.trackingInterval > 0) {
        trackingIntervalRef.current = setInterval(async () => {
          try {
            const location = await getCurrentLocation();
            handleLocationUpdate(location);
          } catch (error) {
            console.error('GPS追踪更新失败:', error);
          }
        }, opts.trackingInterval);
      } else {
        // 使用watchPosition进行实时追踪
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const locationData: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              speed: position.coords.speed,
              heading: position.coords.heading,
              timestamp: position.timestamp
            };
            handleLocationUpdate(locationData);
          },
          (error) => {
            let errorMessage = 'GPS追踪失败';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = '用户拒绝了位置访问请求';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = '位置信息不可用';
                break;
              case error.TIMEOUT:
                errorMessage = 'GPS追踪超时';
                break;
            }
            setState(prev => ({ ...prev, error: errorMessage }));
          },
          {
            enableHighAccuracy: opts.enableHighAccuracy,
            timeout: opts.timeout,
            maximumAge: opts.maximumAge
          }
        );
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'GPS追踪启动失败',
        isTracking: false
      }));
    }
  }, [checkPermission, getCurrentLocation, handleLocationUpdate, opts]);

  // 停止GPS追踪
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }

    setState(prev => ({ ...prev, isTracking: false }));
  }, []);

  // 清除位置历史
  const clearHistory = useCallback(() => {
    setState(prev => ({ ...prev, locationHistory: [] }));
  }, []);

  // 获取追踪统计信息
  const getTrackingStats = useCallback(() => {
    const { locationHistory } = state;
    
    if (locationHistory.length < 2) {
      return {
        totalDistance: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        duration: 0,
        points: locationHistory.length
      };
    }

    let totalDistance = 0;
    let maxSpeed = 0;
    const speeds: number[] = [];

    for (let i = 1; i < locationHistory.length; i++) {
      const prev = locationHistory[i - 1];
      const curr = locationHistory[i];
      
      const distance = calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude
      );
      
      totalDistance += distance;
      
      if (curr.speed !== null) {
        speeds.push(curr.speed);
        maxSpeed = Math.max(maxSpeed, curr.speed);
      }
    }

    const duration = locationHistory[locationHistory.length - 1].timestamp - locationHistory[0].timestamp;
    const averageSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

    return {
      totalDistance: Math.round(totalDistance),
      averageSpeed: Math.round(averageSpeed * 3.6 * 100) / 100, // 转换为km/h
      maxSpeed: Math.round(maxSpeed * 3.6 * 100) / 100, // 转换为km/h
      duration: Math.round(duration / 1000), // 转换为秒
      points: locationHistory.length
    };
  }, [state.locationHistory, calculateDistance]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    ...state,
    startTracking,
    stopTracking,
    getCurrentLocation,
    clearHistory,
    getTrackingStats,
    checkPermission
  };
};