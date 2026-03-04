import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeLocation, LocationHistory } from '../types';

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  trackingInterval?: number;
}

interface UseGeolocationReturn {
  location: RealtimeLocation | null;
  error: string | null;
  isTracking: boolean;
  accuracy: number | null;
  startTracking: () => void;
  stopTracking: () => void;
  getCurrentPosition: () => Promise<RealtimeLocation>;
  locationHistory: LocationHistory[];
}

// 复旦大学邯郸校区默认位置
const FUDAN_DEFAULT_LOCATION: RealtimeLocation = {
  latitude: 31.2977,
  longitude: 121.5053,
  altitude: null,
  accuracy: 100,
  speed: null,
  heading: null,
  timestamp: new Date()
};

export const useGeolocation = (options: GeolocationOptions = {}): UseGeolocationReturn => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
    trackingInterval = 5000
  } = options;

  const [location, setLocation] = useState<RealtimeLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);

  const watchIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  const geolocationOptions: PositionOptions = {
    enableHighAccuracy,
    timeout,
    maximumAge
  };

  const updateLocation = useCallback((position: GeolocationPosition) => {
    const newLocation: RealtimeLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      altitude: position.coords.altitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed,
      heading: position.coords.heading,
      timestamp: new Date(position.timestamp)
    };

    setLocation(newLocation);
    setAccuracy(position.coords.accuracy);
    setError(null);

    // 添加到位置历史
    const historyEntry: LocationHistory = {
      id: `${Date.now()}-${Math.random()}`,
      user_id: '', // 将在组件中设置
      latitude: newLocation.latitude,
      longitude: newLocation.longitude,
      altitude: newLocation.altitude,
      accuracy: newLocation.accuracy,
      speed: newLocation.speed,
      heading: newLocation.heading,
      recorded_at: newLocation.timestamp.toISOString(),
      battery_level: null,
      network_type: null
    };

    setLocationHistory(prev => {
      const updated = [historyEntry, ...prev];
      // 保持最近100个位置记录
      return updated.slice(0, 100);
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = '定位失败';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = '用户拒绝了定位请求，使用复旦大学邯郸校区作为默认位置';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = '位置信息不可用，使用复旦大学邯郸校区作为默认位置';
        break;
      case error.TIMEOUT:
        errorMessage = '定位请求超时，使用复旦大学邯郸校区作为默认位置';
        break;
      default:
        errorMessage = '未知的定位错误，使用复旦大学邯郸校区作为默认位置';
        break;
    }
    
    setError(errorMessage);
    console.error('Geolocation error:', error);
    
    // 当定位失败时，使用复旦大学邯郸校区作为默认位置
    setLocation(FUDAN_DEFAULT_LOCATION);
    setAccuracy(FUDAN_DEFAULT_LOCATION.accuracy);
    
    // 添加到位置历史
    const historyEntry: LocationHistory = {
      id: `${Date.now()}-${Math.random()}`,
      user_id: '',
      latitude: FUDAN_DEFAULT_LOCATION.latitude,
      longitude: FUDAN_DEFAULT_LOCATION.longitude,
      altitude: FUDAN_DEFAULT_LOCATION.altitude,
      accuracy: FUDAN_DEFAULT_LOCATION.accuracy,
      speed: FUDAN_DEFAULT_LOCATION.speed,
      heading: FUDAN_DEFAULT_LOCATION.heading,
      recorded_at: FUDAN_DEFAULT_LOCATION.timestamp.toISOString(),
      battery_level: null,
      network_type: null
    };

    setLocationHistory(prev => {
      const updated = [historyEntry, ...prev];
      return updated.slice(0, 100);
    });
  }, []);

  const getCurrentPosition = useCallback((): Promise<RealtimeLocation> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        // 浏览器不支持地理定位，使用默认位置
        setLocation(FUDAN_DEFAULT_LOCATION);
        setAccuracy(FUDAN_DEFAULT_LOCATION.accuracy);
        setError('浏览器不支持地理定位，使用复旦大学邯郸校区作为默认位置');
        resolve(FUDAN_DEFAULT_LOCATION);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: RealtimeLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: new Date(position.timestamp)
          };
          updateLocation(position);
          resolve(location);
        },
        (error) => {
          handleError(error);
          // 即使定位失败，也返回默认位置
          resolve(FUDAN_DEFAULT_LOCATION);
        },
        geolocationOptions
      );
    });
  }, [geolocationOptions, updateLocation, handleError]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      // 浏览器不支持地理定位，使用默认位置
      setLocation(FUDAN_DEFAULT_LOCATION);
      setAccuracy(FUDAN_DEFAULT_LOCATION.accuracy);
      setError('浏览器不支持地理定位，使用复旦大学邯郸校区作为默认位置');
      return;
    }

    if (isTracking) {
      return;
    }

    setIsTracking(true);
    setError(null);

    // 使用watchPosition进行连续定位
    watchIdRef.current = navigator.geolocation.watchPosition(
      updateLocation,
      handleError,
      geolocationOptions
    );

    // 设置定期更新间隔（作为备用）
    intervalIdRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        updateLocation,
        handleError,
        geolocationOptions
      );
    }, trackingInterval);
  }, [isTracking, updateLocation, handleError, geolocationOptions, trackingInterval]);

  const stopTracking = useCallback(() => {
    setIsTracking(false);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  }, []);

  // 清理函数
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  // 检查地理定位权限
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'denied') {
          setError('地理定位权限被拒绝，使用复旦大学邯郸校区作为默认位置');
          // 权限被拒绝时，立即设置默认位置
          setLocation(FUDAN_DEFAULT_LOCATION);
          setAccuracy(FUDAN_DEFAULT_LOCATION.accuracy);
        }
      });
    } else {
      // 浏览器不支持权限API，尝试获取位置
      getCurrentPosition().catch(() => {
        // 获取位置失败，默认位置已在handleError中设置
      });
    }
  }, [getCurrentPosition]);

  return {
    location,
    error,
    isTracking,
    accuracy,
    startTracking,
    stopTracking,
    getCurrentPosition,
    locationHistory
  };
};