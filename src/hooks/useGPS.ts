import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { smartThrottle, OptimizedPositionBuffer, performanceMonitor, getDevicePerformance } from '../utils/performance';

interface GPSPosition {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

interface UseGPSOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  trackingInterval?: number;
  autoInitialize?: boolean;
  adaptiveFrequency?: boolean; // 新增：自适应频率
  memoryOptimization?: boolean; // 新增：内存优化
}

interface UseGPSReturn {
  currentPosition: GPSPosition | null;
  positions: GPSPosition[];
  isTracking: boolean;
  isGPSReady: boolean;
  error: string | null;
  accuracy: number | null;
  permissionStatus: 'granted' | 'denied' | 'prompt' | null;
  connectionAttempts: number;
  startTracking: () => void;
  stopTracking: () => void;
  clearPositions: () => void;
  getDistance: () => number;
  getAverageSpeed: () => number;
  getDuration: () => number;
  initializeGPS: () => void;
  requestPermission: () => Promise<void>;
  retryConnection: () => void;
  setManualPosition: (lat: number, lng: number) => void;
  getGPSSignalQuality: () => 'excellent' | 'good' | 'medium' | 'fair' | 'poor' | 'unknown';
  getPerformanceMetrics?: () => any;
}

export const useGPS = (options: UseGPSOptions = {}): UseGPSReturn => {
  const {
    enableHighAccuracy = true,
    timeout = 60000, // 增加到60秒，提高定位成功率
    maximumAge = 0, // 不使用缓存位置，确保获取最新位置
    trackingInterval = 1000,
    autoInitialize = false,
    adaptiveFrequency = true, // 默认启用自适应频率
    memoryOptimization = true // 默认启用内存优化
  } = options;

  // 根据设备性能调整默认参数
  const devicePerformance = useMemo(() => getDevicePerformance(), []);
  const optimizedInterval = useMemo(() => {
    if (!adaptiveFrequency) return trackingInterval;
    
    switch (devicePerformance) {
      case 'high': return Math.max(trackingInterval, 500); // 高性能设备可以更频繁
      case 'medium': return Math.max(trackingInterval, 1000); // 中等性能设备标准频率
      case 'low': return Math.max(trackingInterval, 2000); // 低性能设备降低频率
      default: return trackingInterval;
    }
  }, [trackingInterval, adaptiveFrequency, devicePerformance]);

  const [currentPosition, setCurrentPosition] = useState<GPSPosition | null>(null);
  const [positions, setPositions] = useState<GPSPosition[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [isGPSReady, setIsGPSReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const watchIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const initWatchIdRef = useRef<number | null>(null);
  const isTrackingRef = useRef<boolean>(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 性能优化相关的refs
  const positionBufferRef = useRef<OptimizedPositionBuffer | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const performanceMetricsRef = useRef({
    updateCount: 0,
    totalUpdateTime: 0,
    lastAccuracy: 0
  });

  // 初始化位置缓冲区
  useEffect(() => {
    if (memoryOptimization && !positionBufferRef.current) {
      positionBufferRef.current = new OptimizedPositionBuffer(1000, 500);
      console.log('📊 GPS位置缓冲区已初始化');
    }
  }, [memoryOptimization]);

  // 同步 isTracking 状态到 ref
  useEffect(() => {
    isTrackingRef.current = isTracking;
  }, [isTracking]);

  // 检查GPS支持
  const isGPSSupported = useCallback(() => {
    return 'geolocation' in navigator;
  }, []);

  // 检查权限状态
  const checkPermissionStatus = useCallback(async () => {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionStatus(permission.state);
        console.log('GPS权限状态:', permission.state);
        
        // 监听权限状态变化
        permission.onchange = () => {
          setPermissionStatus(permission.state);
          console.log('GPS权限状态变化:', permission.state);
        };
        
        return permission.state;
      } catch (error) {
        console.warn('无法检查GPS权限状态:', error);
        return 'unknown';
      }
    }
    return 'unknown';
  }, []);

  // 请求权限
  const requestPermission = useCallback(async () => {
    if (!isGPSSupported()) {
      setError('您的设备不支持GPS定位');
      return;
    }

    try {
      // 先检查当前权限状态
      const currentStatus = await checkPermissionStatus();
      
      if (currentStatus === 'denied') {
        setError('GPS权限被拒绝。请在浏览器设置中允许位置访问，然后刷新页面。');
        return;
      }

      // 尝试获取位置来触发权限请求
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, // 首次请求使用低精度
          timeout: 10000,
          maximumAge: 0
        });
      });

      console.log('GPS权限获取成功');
      handlePositionUpdate(position);
    } catch (error: any) {
      console.error('GPS权限请求失败:', error);
      handlePositionError(error);
    }
  }, [isGPSSupported, checkPermissionStatus]);

  // 计算两点间距离（米）
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  // 获取总距离
  const getDistance = useCallback((): number => {
    if (positions.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < positions.length; i++) {
      totalDistance += calculateDistance(
        positions[i-1].lat, positions[i-1].lng,
        positions[i].lat, positions[i].lng
      );
    }
    return totalDistance;
  }, [positions, calculateDistance]);

  // 获取平均速度（km/h）
  const getAverageSpeed = useCallback((): number => {
    const distance = getDistance(); // 米
    const duration = getDuration(); // 秒
    
    if (duration === 0) return 0;
    
    return (distance / 1000) / (duration / 3600); // km/h
  }, [getDistance]);

  // 获取持续时间（秒）
  const getDuration = useCallback((): number => {
    if (positions.length < 2) return 0;
    
    const startTime = positions[0].timestamp;
    const endTime = positions[positions.length - 1].timestamp;
    
    return (endTime - startTime) / 1000;
  }, [positions]);

  // 智能位置更新处理 - 性能优化版本
  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    const updateStartTime = performance.now();
    
    const newPosition: GPSPosition = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: position.timestamp,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined
    };

    // 检查是否需要更新（避免无意义的重渲染）
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
    
    // 智能过滤：如果位置变化很小且时间间隔很短，跳过更新
    if (currentPosition && timeSinceLastUpdate < optimizedInterval / 2) {
      const distance = calculateDistance(
        currentPosition.lat, currentPosition.lng,
        newPosition.lat, newPosition.lng
      );
      
      // 如果移动距离小于精度范围的一半，且精度没有显著改善，跳过更新
      const accuracyImprovement = (currentPosition.accuracy || 100) - (newPosition.accuracy || 100);
      if (distance < (newPosition.accuracy || 10) / 2 && accuracyImprovement < 5) {
        return;
      }
    }

    console.log('GPS位置更新:', {
      lat: newPosition.lat.toFixed(6),
      lng: newPosition.lng.toFixed(6),
      accuracy: newPosition.accuracy,
      timeSinceLastUpdate
    });

    // 更新状态
    setCurrentPosition(newPosition);
    setAccuracy(position.coords.accuracy);
    setError(null);
    setIsGPSReady(true);
    setConnectionAttempts(0);
    lastUpdateTimeRef.current = now;

    // 性能监控
    const updateTime = performance.now() - updateStartTime;
    performanceMetricsRef.current.updateCount++;
    performanceMetricsRef.current.totalUpdateTime += updateTime;
    performanceMetricsRef.current.lastAccuracy = position.coords.accuracy;
    
    performanceMonitor.recordMetric('gps_update_time', updateTime);
    performanceMonitor.recordMetric('gps_accuracy', position.coords.accuracy);

    // 只有在追踪状态下才添加到路径
    if (isTrackingRef.current) {
      if (memoryOptimization && positionBufferRef.current) {
        // 使用优化的位置缓冲区
        positionBufferRef.current.addPosition(newPosition);
        const optimizedPositions = positionBufferRef.current.getPositions();
        setPositions(optimizedPositions);
        
        // 记录内存使用情况
        const memoryUsage = positionBufferRef.current.getMemoryUsage();
        if (memoryUsage.count % 100 === 0) { // 每100个点记录一次
          console.log('📊 GPS内存使用:', memoryUsage);
          performanceMonitor.recordMetric('gps_memory_usage_kb', memoryUsage.sizeInKB);
        }
      } else {
        // 传统方式
        setPositions(prev => {
          // 过滤掉精度太低的点（大于30米，提高精度要求）
          if (newPosition.accuracy && newPosition.accuracy > 30) {
            console.log('GPS精度太低，跳过此点:', newPosition.accuracy);
            return prev;
          }

          // 如果是第一个点，直接添加
          if (prev.length === 0) {
            return [newPosition];
          }

          // 检查与上一个点的距离，避免添加太近的点
          const lastPosition = prev[prev.length - 1];
          const distance = calculateDistance(
            lastPosition.lat, lastPosition.lng,
            newPosition.lat, newPosition.lng
          );
          
          // 如果距离小于5米且时间间隔小于5秒，不添加
          if (distance < 5 && (newPosition.timestamp - lastPosition.timestamp) < 5000) {
            return prev;
          }

          return [...prev, newPosition];
        });
      }
    }
  }, [calculateDistance, memoryOptimization, positions.length]);

  // 处理位置错误
  const handlePositionError = useCallback((error: GeolocationPositionError) => {
    console.error('GPS错误:', error);
    
    let errorMessage = '';
    let shouldRetry = false;
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'GPS权限被拒绝。请允许位置访问并刷新页面。';
        setPermissionStatus('denied');
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'GPS位置信息不可用。请检查设备GPS设置。';
        shouldRetry = true;
        break;
      case error.TIMEOUT:
        errorMessage = 'GPS定位超时。正在重试...';
        shouldRetry = true;
        break;
      default:
        errorMessage = '获取GPS位置时发生未知错误。';
        shouldRetry = true;
        break;
    }
    
    setError(errorMessage);
    setIsGPSReady(false);
    
    // 增加连接尝试次数
    setConnectionAttempts(prev => prev + 1);
    
    // 如果应该重试且尝试次数少于8次，则自动重试（增加重试次数）
    if (shouldRetry && connectionAttempts < 8) {
      console.log(`GPS连接失败，${3000}ms后重试 (第${connectionAttempts + 1}次)`);
      retryTimeoutRef.current = setTimeout(() => {
        retryConnection();
      }, 3000);
    }
  }, [connectionAttempts]);

  // 重试连接
  const retryConnection = useCallback(() => {
    console.log('重试GPS连接...');
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    initializeGPS();
  }, []);

  // 初始化GPS定位（降级策略）
  const initializeGPS = useCallback(async () => {
    if (!isGPSSupported()) {
      setError('您的设备不支持GPS定位');
      setIsGPSReady(false);
      return;
    }

    console.log('初始化GPS定位...');
    setError(null);
    setIsGPSReady(false);

    // 先检查权限状态
    const permissionState = await checkPermissionStatus();
    
    if (permissionState === 'denied') {
      setError('GPS权限被拒绝。请在浏览器设置中允许位置访问。');
      return;
    }

    // 降级策略：先尝试高精度，失败后尝试低精度
    const tryGetPosition = async (highAccuracy: boolean) => {
      const options: PositionOptions = {
        enableHighAccuracy: highAccuracy,
        timeout: highAccuracy ? timeout : 15000, // 低精度模式使用较短超时
        maximumAge: maximumAge
      };

      console.log(`尝试GPS定位 (高精度: ${highAccuracy})...`);

      return new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
    };

    try {
      // 首先尝试高精度定位
      let position: GeolocationPosition;
      
      try {
        position = await tryGetPosition(enableHighAccuracy);
        console.log('高精度GPS定位成功');
      } catch (highAccuracyError) {
        console.warn('高精度GPS定位失败，尝试低精度模式:', highAccuracyError);
        
        // 如果高精度失败，尝试低精度
        position = await tryGetPosition(false);
        console.log('低精度GPS定位成功');
      }

      handlePositionUpdate(position);

      // 开始监听位置变化
      const watchOptions: PositionOptions = {
        enableHighAccuracy: false, // 监听时使用低精度以提高稳定性
        timeout: 20000,
        maximumAge: 5000
      };

      initWatchIdRef.current = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        handlePositionError,
        watchOptions
      );

    } catch (error: any) {
      console.error('GPS初始化失败:', error);
      handlePositionError(error);
    }
  }, [isGPSSupported, enableHighAccuracy, timeout, maximumAge, handlePositionUpdate, handlePositionError, checkPermissionStatus, smartThrottle]);

  // 开始追踪 - 性能优化版本
  const startTracking = useCallback(() => {
    if (!isGPSSupported()) {
      setError('您的设备不支持GPS定位');
      return;
    }

    console.log('🎯 开始GPS追踪...', {
      interval: optimizedInterval,
      adaptiveFrequency,
      memoryOptimization
    });
    
    setIsTracking(true);
    setError(null);
    lastUpdateTimeRef.current = Date.now();

    // 重置性能指标
    performanceMetricsRef.current = {
      updateCount: 0,
      totalUpdateTime: 0,
      lastAccuracy: 0
    };

    const options: PositionOptions = {
      enableHighAccuracy: false, // 追踪时使用低精度以提高稳定性
      timeout: 20000,
      maximumAge: Math.min(1000, optimizedInterval / 2) // 动态调整缓存时间
    };

    // 如果还没有初始化GPS，先初始化
    if (!isGPSReady) {
      initializeGPS();
    }

    // 开始持续监听位置变化
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      options
    );

    // 使用智能节流的定时器定期获取位置（作为备用）
    const smartTrackingFunction = smartThrottle(() => {
      navigator.geolocation.getCurrentPosition(
        handlePositionUpdate,
        handlePositionError,
        options
      );
    }, optimizedInterval);

    intervalIdRef.current = setInterval(smartTrackingFunction, optimizedInterval);

    // 记录追踪开始
    performanceMonitor.recordMetric('gps_tracking_started', 1);
  }, [
    isGPSSupported,
    optimizedInterval,
    adaptiveFrequency,
    memoryOptimization,
    handlePositionUpdate,
    handlePositionError,
    isGPSReady,
    initializeGPS
  ]);

  // 停止追踪 - 性能优化版本
  const stopTracking = useCallback(() => {
    console.log('⏹️ 停止GPS追踪');
    setIsTracking(false);
    isTrackingRef.current = false;

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    // 记录性能指标
    const metrics = performanceMetricsRef.current;
    if (metrics.updateCount > 0) {
      const avgUpdateTime = metrics.totalUpdateTime / metrics.updateCount;
      console.log('📊 GPS追踪性能统计:', {
        totalUpdates: metrics.updateCount,
        avgUpdateTime: avgUpdateTime.toFixed(2) + 'ms',
        lastAccuracy: metrics.lastAccuracy + 'm'
      });
      
      performanceMonitor.recordMetric('gps_avg_update_time', avgUpdateTime);
      performanceMonitor.recordMetric('gps_total_updates', metrics.updateCount);
    }

    // 记录追踪停止
    performanceMonitor.recordMetric('gps_tracking_stopped', 1);

    // 保持GPS初始化状态，继续监听位置
  }, []);

  // 清除位置记录 - 性能优化版本
  const clearPositions = useCallback(() => {
    console.log('🗑️ 清除位置记录');
    setPositions([]);
    
    // 清除优化缓冲区
    if (memoryOptimization && positionBufferRef.current) {
      positionBufferRef.current.clear();
      console.log('📊 已清除位置缓冲区');
    }
    
    // 记录清除操作
    performanceMonitor.recordMetric('gps_positions_cleared', 1);
  }, [memoryOptimization]);

  // 自动初始化GPS
  useEffect(() => {
    if (autoInitialize) {
      console.log('自动初始化GPS...');
      // 延迟一点时间以确保组件完全挂载
      setTimeout(() => {
        initializeGPS();
      }, 1000);
    }

    // 组件卸载时清理
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
      }
      if (initWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(initWatchIdRef.current);
      }
      if (retryTimeoutRef.current !== null) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [autoInitialize, initializeGPS]);

  // 手动设置位置
  const setManualPosition = useCallback((lat: number, lng: number) => {
    console.log('手动设置位置:', { lat, lng });
    
    const manualPosition: GPSPosition = {
      lat,
      lng,
      timestamp: Date.now(),
      accuracy: 5, // 手动设置的位置认为是高精度
      speed: 0,
      heading: 0
    };

    setCurrentPosition(manualPosition);
    setAccuracy(5);
    setError(null);
    setIsGPSReady(true);
    
    // 如果正在追踪，也添加到路径中
    if (isTrackingRef.current) {
      setPositions(prev => [...prev, manualPosition]);
    }
  }, []);

  // 获取GPS信号质量 - 增强版本
  const getGPSSignalQuality = useCallback((): 'excellent' | 'good' | 'medium' | 'fair' | 'poor' | 'unknown' => {
    if (!accuracy) return 'unknown';
    
    // 考虑设备性能调整质量标准
    const devicePerf = getDevicePerformance();
    let thresholds = { excellent: 5, good: 10, medium: 15, fair: 20 };
    
    if (devicePerf === 'low') {
      // 低性能设备放宽标准
      thresholds = { excellent: 8, good: 15, medium: 25, fair: 30 };
    } else if (devicePerf === 'high') {
      // 高性能设备提高标准
      thresholds = { excellent: 3, good: 8, medium: 12, fair: 15 };
    }
    
    if (accuracy <= thresholds.excellent) return 'excellent';
    if (accuracy <= thresholds.good) return 'good';
    if (accuracy <= thresholds.medium) return 'medium';
    if (accuracy <= thresholds.fair) return 'fair';
    return 'poor';
  }, [accuracy]);

  // 返回性能监控信息（开发模式）
  const getPerformanceMetrics = useCallback(() => {
    const metrics = performanceMetricsRef.current;
    const memoryUsage = memoryOptimization && positionBufferRef.current 
      ? positionBufferRef.current.getMemoryUsage() 
      : null;
    
    return {
      updateCount: metrics.updateCount,
      avgUpdateTime: metrics.updateCount > 0 ? metrics.totalUpdateTime / metrics.updateCount : 0,
      lastAccuracy: metrics.lastAccuracy,
      memoryUsage,
      currentInterval: optimizedInterval,
      devicePerformance: getDevicePerformance()
    };
  }, [memoryOptimization, optimizedInterval]);

  return {
    // 状态
    currentPosition,
    positions,
    isTracking,
    isGPSReady,
    error,
    accuracy,
    permissionStatus,
    connectionAttempts,
    
    // 方法
    startTracking,
    stopTracking,
    clearPositions,
    getDistance,
    getAverageSpeed,
    getDuration,
    initializeGPS,
    requestPermission,
    retryConnection,
    setManualPosition,
    getGPSSignalQuality,
    
    // 性能监控（开发模式）
    getPerformanceMetrics: import.meta.env.DEV ? getPerformanceMetrics : undefined
  };
};