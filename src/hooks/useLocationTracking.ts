import { useState, useEffect, useCallback, useRef } from 'react';
import { useGeolocation } from './useGeolocation';
import { LocationService } from '../services/locationService';
import { RealtimeLocation, LocationHistory } from '../types';
import { useAuth } from './useAuth';

interface LocationTrackingOptions {
  autoSave?: boolean;
  batchMode?: boolean;
  trackingInterval?: number;
  safetyMonitoring?: boolean;
}

interface UseLocationTrackingReturn {
  location: RealtimeLocation | null;
  isTracking: boolean;
  error: string | null;
  accuracy: number | null;
  locationHistory: LocationHistory[];
  safetyStatus: 'safe' | 'warning' | 'danger' | 'unknown';
  safetyScore: number | null;
  startTracking: () => void;
  stopTracking: () => void;
  saveCurrentLocation: () => Promise<void>;
  clearHistory: () => void;
  getDistanceTraveled: () => number;
  getCurrentSpeed: () => number | null;
}

export const useLocationTracking = (
  options: LocationTrackingOptions = {}
): UseLocationTrackingReturn => {
  const {
    autoSave = true,
    batchMode = true,
    trackingInterval = 5000,
    safetyMonitoring = true
  } = options;

  const { user } = useAuth();
  const {
    location,
    error: geoError,
    isTracking: geoTracking,
    accuracy,
    startTracking: startGeoTracking,
    stopTracking: stopGeoTracking,
    locationHistory: geoHistory
  } = useGeolocation({ trackingInterval });

  const [error, setError] = useState<string | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  const [safetyStatus, setSafetyStatus] = useState<'safe' | 'warning' | 'danger' | 'unknown'>('unknown');
  const [safetyScore, setSafetyScore] = useState<number | null>(null);
  const [distanceTraveled, setDistanceTraveled] = useState(0);

  const locationService = useRef(LocationService.getInstance());
  const lastSavedLocation = useRef<RealtimeLocation | null>(null);
  const safetyCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // 保存位置到数据库
  const saveLocationToDatabase = useCallback(async (locationData: RealtimeLocation) => {
    if (!user?.id) return;

    try {
      if (batchMode) {
        await locationService.current.batchSaveLocation(locationData, user.id);
      } else {
        await locationService.current.saveLocation(locationData, user.id);
      }
    } catch (error) {
      console.error('保存位置失败:', error);
      setError('位置保存失败');
    }
  }, [user?.id, batchMode]);

  // 检查安全状态
  const checkSafetyStatus = useCallback(async (locationData: RealtimeLocation) => {
    if (!safetyMonitoring) return;

    try {
      const [isSafe, timeSlotScore] = await Promise.all([
        locationService.current.isLocationSafe(locationData.latitude, locationData.longitude),
        locationService.current.getTimeSlotSafety(locationData.latitude, locationData.longitude)
      ]);

      setSafetyScore(timeSlotScore);

      if (timeSlotScore >= 8.0 && isSafe) {
        setSafetyStatus('safe');
      } else if (timeSlotScore >= 6.0) {
        setSafetyStatus('warning');
      } else {
        setSafetyStatus('danger');
      }
    } catch (error) {
      console.error('安全状态检查失败:', error);
      setSafetyStatus('unknown');
    }
  }, [safetyMonitoring]);

  // 计算行进距离
  const updateDistanceTraveled = useCallback((newLocation: RealtimeLocation) => {
    if (lastSavedLocation.current) {
      const distance = locationService.current.calculateDistance(
        lastSavedLocation.current.latitude,
        lastSavedLocation.current.longitude,
        newLocation.latitude,
        newLocation.longitude
      );
      setDistanceTraveled(prev => prev + distance);
    }
    lastSavedLocation.current = newLocation;
  }, []);

  // 处理位置更新
  useEffect(() => {
    if (!location) return;

    // 更新距离
    updateDistanceTraveled(location);

    // 自动保存位置
    if (autoSave && user?.id) {
      saveLocationToDatabase(location);
    }

    // 检查安全状态
    if (safetyMonitoring) {
      checkSafetyStatus(location);
    }

    // 更新本地历史记录
    const historyEntry: LocationHistory = {
      id: `${Date.now()}-${Math.random()}`,
      user_id: user?.id || '',
      latitude: location.latitude,
      longitude: location.longitude,
      altitude: location.altitude,
      accuracy: location.accuracy,
      speed: location.speed,
      heading: location.heading,
      recorded_at: location.timestamp.toISOString(),
      battery_level: null,
      network_type: null
    };

    setLocationHistory(prev => {
      const updated = [historyEntry, ...prev];
      return updated.slice(0, 100); // 保持最近100个记录
    });
  }, [location, autoSave, user?.id, saveLocationToDatabase, checkSafetyStatus, updateDistanceTraveled, safetyMonitoring]);

  // 合并错误状态
  useEffect(() => {
    setError(geoError);
  }, [geoError]);

  // 开始追踪
  const startTracking = useCallback(() => {
    if (!user?.id) {
      setError('请先登录');
      return;
    }

    setError(null);
    setDistanceTraveled(0);
    lastSavedLocation.current = null;
    startGeoTracking();

    // 定期安全检查
    if (safetyMonitoring) {
      safetyCheckInterval.current = setInterval(() => {
        if (location) {
          checkSafetyStatus(location);
        }
      }, 30000); // 每30秒检查一次安全状态
    }
  }, [user?.id, startGeoTracking, safetyMonitoring, checkSafetyStatus, location]);

  // 停止追踪
  const stopTracking = useCallback(async () => {
    stopGeoTracking();

    // 清除安全检查定时器
    if (safetyCheckInterval.current) {
      clearInterval(safetyCheckInterval.current);
      safetyCheckInterval.current = null;
    }

    // 强制刷新缓冲区
    if (batchMode && user?.id) {
      try {
        await locationService.current.forceFlush();
      } catch (error) {
        console.error('刷新位置缓冲区失败:', error);
      }
    }
  }, [stopGeoTracking, batchMode, user?.id]);

  // 手动保存当前位置
  const saveCurrentLocation = useCallback(async () => {
    if (!location || !user?.id) {
      throw new Error('没有可用的位置信息或用户未登录');
    }

    await saveLocationToDatabase(location);
  }, [location, user?.id, saveLocationToDatabase]);

  // 清除历史记录
  const clearHistory = useCallback(() => {
    setLocationHistory([]);
    setDistanceTraveled(0);
    lastSavedLocation.current = null;
  }, []);

  // 获取行进距离
  const getDistanceTraveled = useCallback(() => {
    return distanceTraveled;
  }, [distanceTraveled]);

  // 获取当前速度
  const getCurrentSpeed = useCallback(() => {
    return location?.speed || null;
  }, [location?.speed]);

  // 清理函数
  useEffect(() => {
    return () => {
      if (safetyCheckInterval.current) {
        clearInterval(safetyCheckInterval.current);
      }
    };
  }, []);

  // 页面卸载时强制刷新缓冲区
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (batchMode && user?.id) {
        await locationService.current.forceFlush();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [batchMode, user?.id]);

  return {
    location,
    isTracking: geoTracking,
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
  };
};