/**
 * 智能跑步导航地图组件
 * 基于原有5.0.html功能，转换为React组件
 * 支持多种模式：planning、navigation、tracking、debug
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { IntelligentMapService } from '../../services/map/IntelligentMapService';
import { VoiceNavigationService } from '../../services/voice/VoiceNavigationService';
import { useGPS } from '../../hooks/useGPS';
import { debounce } from '../../utils/performance';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { MapSkeleton } from '../ui/LoadingSpinner';
import { useToast } from '../ui/Toast';
import { MapVibration } from '../../utils/vibration';
import { ResponsiveUtils, MapResponsiveUtils } from '../../utils/responsive';
import { performanceMonitor, startPerformanceMetric, endPerformanceMetric } from '../../utils/performanceMonitor';
import { errorHandler, ERROR_CODES, handleAsyncError } from '../../utils/errorHandler';
import { offlineMapDetector } from '../../services/voice/OfflineMapDetector';
import type {
  IntelligentRunningMapProps,
  IntelligentRunningMapRef,
  MapConfig,
  WaypointData,
  RouteData,
  NavigationInstruction,
  TrackingConfig,
  VoiceNavigationConfig,
  MapMode,
  GPSPosition
} from '../../types/map';

// 默认地图配置
const DEFAULT_MAP_CONFIG: MapConfig = {
  zoom: 15,
  center: [121.4737, 31.2304], // 上海市中心
  mapStyle: 'normal'
};

// 默认语音配置
const DEFAULT_VOICE_CONFIG: VoiceNavigationConfig = {
  enabled: true,
  language: 'zh-CN',
  rate: 1,
  pitch: 1,
  volume: 0.8,
  autoPlay: true,
  repeatInterval: 0
};

export const IntelligentRunningMap = React.forwardRef<any, IntelligentRunningMapProps>(({
  mode = 'planning',
  config = DEFAULT_MAP_CONFIG,
  voiceConfig = DEFAULT_VOICE_CONFIG,
  initialWaypoints = [],
  onWaypointAdded,
  onWaypointRemoved,
  onRouteCalculated,
  onNavigationStarted,
  onNavigationCompleted,
  onTrackingStarted,
  onTrackingStopped,
  onPositionUpdated,
  onError,
  className = '',
  style = {}
}, ref) => {
  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapServiceRef = useRef<IntelligentMapService | null>(null);
  const voiceServiceRef = useRef<VoiceNavigationService | null>(null);

  // State
  const [isMapReady, setIsMapReady] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<RouteData | null>(null);
  const [waypoints, setWaypoints] = useState<WaypointData[]>(initialWaypoints);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [currentInstruction, setCurrentInstruction] = useState<NavigationInstruction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // 设备信息状态
  const [deviceInfo, setDeviceInfo] = useState(() => ResponsiveUtils.getDeviceInfo());
  
  // 离线地图状态
  const [offlineMapStatus, setOfflineMapStatus] = useState<any>(null);
  const [voiceQualityInfo, setVoiceQualityInfo] = useState<any>(null);
  
  // 性能监控状态
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Toast通知
  const { success, error: showError, warning, info } = useToast();

  // GPS Hook - 性能优化配置
  const {
    currentPosition,
    positions,
    isTracking: gpsIsTracking,
    isGPSReady,
    error: gpsError,
    accuracy,
    permissionStatus,
    startTracking: startGPSTracking,
    stopTracking: stopGPSTracking,
    clearPositions,
    getDistance,
    getAverageSpeed,
    getDuration,
    initializeGPS,
    requestPermission,
    getGPSSignalQuality,
    getPerformanceMetrics
  } = useGPS({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 5000,
    trackingInterval: 2000,
    adaptiveFrequency: true, // 启用自适应频率
    memoryOptimization: true // 启用内存优化
  });

  // 合并配置
  const mapConfig = useMemo(() => ({
    ...DEFAULT_MAP_CONFIG,
    ...config
  }), [config]);

  const voiceNavigationConfig = useMemo(() => ({
    ...DEFAULT_VOICE_CONFIG,
    ...voiceConfig
  }), [voiceConfig]);

  /**
   * 初始化地图服务 - 增强错误处理和重试机制
   */
  const initializeMapService = useCallback(async () => {
    // 开始性能监控
    const performanceId = startPerformanceMetric('map_initialization', {
      retryCount,
      deviceType: deviceInfo.type,
      mapConfig
    });

    try {
      // 验证地图容器
      errorHandler.handleSyncError(() => {
        if (!mapContainerRef.current) {
          throw new Error('地图容器未找到');
        }
      }, ERROR_CODES.INVALID_CONFIG, '地图容器验证失败');

      setIsLoading(true);
      setLoadingMessage('正在初始化地图服务...');
      console.log('🗺️ 初始化智能跑步地图...', { retryCount });
      info('正在初始化地图服务...', { duration: 2000 });
      
      // 创建地图服务实例
      const mapService = new IntelligentMapService();
      const voiceService = new VoiceNavigationService();

      // 初始化地图 - 使用错误处理包装
      setLoadingMessage('正在加载地图引擎...');
      await handleAsyncError(
        () => mapService.initialize(mapContainerRef.current!, mapConfig),
        ERROR_CODES.MAP_SERVICE_ERROR,
        '地图引擎初始化失败'
      );

      // 配置语音导航
      setLoadingMessage('正在配置语音导航...');
      try {
        await handleAsyncError(
          () => voiceService.configure(voiceNavigationConfig),
          ERROR_CODES.VOICE_SERVICE_ERROR,
          '语音服务配置失败'
        );
        console.log('✅ 语音服务配置完成');
        success('语音导航服务已启用');
      } catch (voiceErr) {
        console.warn('⚠️ 语音服务配置失败，但地图服务正常:', voiceErr);
        warning('语音导航服务配置失败，但地图功能正常');
        // 记录非关键错误
        errorHandler.logError(voiceErr as Error, ERROR_CODES.VOICE_SERVICE_ERROR, 'warning');
      }

      // 保存服务实例
      mapServiceRef.current = mapService;
      voiceServiceRef.current = voiceService;

      // 绑定事件监听
      setLoadingMessage('正在设置事件监听...');
      setupEventListeners(mapService, voiceService);

      // 添加初始途径点
      if (initialWaypoints.length > 0) {
        setLoadingMessage('正在加载初始途径点...');
        initialWaypoints.forEach(waypoint => {
          mapService.addWaypoint(waypoint);
        });
      }

      // 结束性能监控
      const metrics = endPerformanceMetric(performanceId, {
        success: true,
        waypointsCount: initialWaypoints.length,
        deviceType: deviceInfo.type
      });
      setPerformanceMetrics(metrics);

      setIsMapReady(true);
      setRetryCount(0); // 重置重试计数
      setIsLoading(false);
      setLoadingMessage('');
      console.log('✅ 智能跑步地图初始化完成');
      success('地图服务初始化成功');
      MapVibration.operationSuccess();

    } catch (err) {
      // 结束性能监控（失败情况）
      endPerformanceMetric(performanceId, {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        retryCount
      });

      const errorMessage = `地图初始化失败: ${err}`;
      console.error('❌', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
      setLoadingMessage('');
      MapVibration.operationError();
      
      // 使用错误处理器记录错误
      errorHandler.logError(
        err instanceof Error ? err : new Error(String(err)),
        ERROR_CODES.MAP_SERVICE_ERROR,
        'critical'
      );

      showError(errorMessage, {
        duration: 8000,
        action: retryCount < 3 ? {
          label: '重试',
          onClick: () => handleRetryInitialization()
        } : undefined
      });
      onError?.({
        code: 'MAP_SERVICE_ERROR',
        message: errorMessage,
        type: 'MAP_ERROR',
        details: error
      });
    }
  }, [mapConfig, voiceNavigationConfig, initialWaypoints, onError, retryCount, info, success, warning, showError]);

  /**
   * 重试初始化
   */
  const handleRetryInitialization = useCallback(() => {
    if (retryCount >= 3) {
      showError('初始化失败次数过多，请刷新页面重试');
      MapVibration.operationError();
      return;
    }

    setRetryCount(prev => prev + 1);
    setError(null);
    MapVibration.buttonClick();
    
    // 延迟重试，避免立即失败
    setTimeout(() => {
      initializeMapService();
    }, 1000 * (retryCount + 1)); // 递增延迟
  }, [retryCount, initializeMapService, showError]);

  /**
   * 设置事件监听器
   */
  const setupEventListeners = useCallback((
    mapService: IntelligentMapService, 
    voiceService: VoiceNavigationService
  ) => {
    // 地图事件
    mapService.on('waypointAdded', (waypoint: WaypointData) => {
      setWaypoints(prev => [...prev, waypoint]);
      if (onWaypointAdded) onWaypointAdded(waypoint);
    });

    mapService.on('waypointRemoved', (waypointId: string) => {
      setWaypoints(prev => prev.filter(wp => wp.id !== waypointId));
      if (onWaypointRemoved) onWaypointRemoved(waypointId);
    });

    mapService.on('waypointsCleared', () => {
      setWaypoints([]);
    });

    mapService.on('routeDrawn', (route: RouteData) => {
      setCurrentRoute(route);
      if (onRouteCalculated) onRouteCalculated(route);
    });

    mapService.on('navigationStarted', (route: RouteData) => {
      setIsNavigating(true);
      setCurrentRoute(route);
      MapVibration.navigationStarted();
      if (onNavigationStarted) onNavigationStarted(route);
    });

    mapService.on('navigationCompleted', () => {
      setIsNavigating(false);
      setCurrentInstruction(null);
      voiceService.speakText('导航完成，您已到达目的地');
      MapVibration.navigationEnded();
      if (onNavigationCompleted) onNavigationCompleted();
    });

    mapService.on('instructionChanged', ({ current }: { current: NavigationInstruction }) => {
      setCurrentInstruction(current);
      if (voiceNavigationConfig.enabled) {
        voiceService.speak(current);
      }
    });

    mapService.on('trackingStarted', (config: TrackingConfig) => {
      setIsTracking(true);
      MapVibration.trackingStarted();
      if (onTrackingStarted) onTrackingStarted(config);
    });

    mapService.on('trackingStopped', () => {
      setIsTracking(false);
      MapVibration.trackingStopped();
      if (onTrackingStopped) onTrackingStopped();
    });

    mapService.on('positionUpdated', (position: GPSPosition) => {
      if (onPositionUpdated) onPositionUpdated(position);
    });

    // 语音事件
    voiceService.on('error', (event: any) => {
      console.error('语音播放错误:', event.error);
    });

  }, []);

  /**
   * 添加途径点
   */
  const addWaypoint = useCallback((waypoint: Omit<WaypointData, 'id'>) => {
    if (!mapServiceRef.current) return;

    const newWaypoint: WaypointData = {
      ...waypoint,
      id: `waypoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    mapServiceRef.current.addWaypoint(newWaypoint);
    MapVibration.buttonClick();
  }, []);

  /**
   * 移除途径点
   */
  const removeWaypoint = useCallback((waypointId: string) => {
    if (!mapServiceRef.current) return;
    mapServiceRef.current.removeWaypoint(waypointId);
  }, []);

  /**
   * 清除所有途径点
   */
  const clearWaypoints = useCallback(() => {
    if (!mapServiceRef.current) return;
    mapServiceRef.current.clearWaypoints();
  }, []);

  /**
   * 规划路线
   */
  const planRoute = useCallback(async () => {
    // 验证前置条件
    const validationError = errorHandler.handleSyncError(() => {
      if (!mapServiceRef.current) {
        throw new Error('地图服务未初始化');
      }
      if (waypoints.length < 2) {
        throw new Error('至少需要2个途径点才能规划路线');
      }
    }, ERROR_CODES.INVALID_CONFIG, '路线规划参数验证失败');

    if (validationError) {
      setError(validationError.message);
      showError(validationError.message);
      onError?.({
        code: 'INVALID_CONFIG',
        message: validationError.message,
        type: 'MAP_ERROR',
        details: validationError
      });
      return;
    }

    // 开始性能监控
    const performanceId = startPerformanceMetric('route_planning', {
      waypointsCount: waypoints.length,
      deviceType: deviceInfo.type
    });

    try {
      console.log('🛣️ 开始规划路线...');
      setError(null);
      setIsLoading(true);
      setLoadingMessage('正在规划最佳路线...');

      const result = await handleAsyncError(
        () => mapServiceRef.current!.planRoute({
          waypoints,
          mode: 'walking',
          avoidTolls: true,
          avoidHighways: true
        }),
        ERROR_CODES.ROUTE_PLANNING_ERROR,
        '路线规划服务调用失败'
      );

      if (result.success && result.route) {
        setLoadingMessage('正在绘制路线...');
        mapServiceRef.current!.drawRoute(result.route);
        
        // 结束性能监控
        endPerformanceMetric(performanceId, {
          success: true,
          routeDistance: result.route.distance,
          routeDuration: result.route.duration
        });

        console.log('✅ 路线规划完成');
        success(`路线规划完成，总距离: ${(result.route.distance / 1000).toFixed(2)}km`);
        MapVibration.routePlanned();
      } else {
        throw new Error(result.error?.message || '路线规划失败');
      }

    } catch (err) {
      // 结束性能监控（失败情况）
      endPerformanceMetric(performanceId, {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        waypointsCount: waypoints.length
      });

      const errorMsg = `路线规划失败: ${err}`;
      console.error('❌', errorMsg);
      setError(errorMsg);
      setIsLoading(false);
      setLoadingMessage('');
      MapVibration.operationError();
      
      // 记录错误
      errorHandler.logError(
        err instanceof Error ? err : new Error(String(err)),
        ERROR_CODES.ROUTE_PLANNING_ERROR,
        'high'
      );

      showError(errorMsg, {
        duration: 6000,
        action: {
          label: '重试',
          onClick: () => {
            MapVibration.buttonClick();
            planRoute();
          }
        }
      });
      onError?.({
        code: 'GPS_ERROR',
        message: errorMsg,
        type: 'GPS_ERROR',
        details: gpsError
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [waypoints, onError, deviceInfo.type, showError]);

  /**
   * 开始导航
   */
  const startNavigation = useCallback(() => {
    // 验证前置条件
    const validationError = errorHandler.handleSyncError(() => {
      if (!mapServiceRef.current) {
        throw new Error('地图服务未初始化');
      }
      if (!currentRoute) {
        throw new Error('请先规划路线');
      }
    }, ERROR_CODES.INVALID_CONFIG, '导航启动条件验证失败');

    if (validationError) {
      setError(validationError.message);
      showError(validationError.message);
      MapVibration.operationError();
      onError?.({
        code: 'INVALID_CONFIG',
        message: validationError.message,
        type: 'MAP_ERROR',
        details: validationError
      });
      return;
    }

    // 开始性能监控
    const performanceId = startPerformanceMetric('navigation_start', {
      routeDistance: currentRoute.distance,
      routeDuration: currentRoute.duration,
      deviceType: deviceInfo.type
    });

    try {
      console.log('🧭 开始导航...');
      setIsLoading(true);
      setLoadingMessage('正在启动导航...');

      mapServiceRef.current!.startNavigation(currentRoute);
      
      // 开始GPS追踪
      if (!gpsIsTracking) {
        startGPSTracking();
      }

      // 结束性能监控
      endPerformanceMetric(performanceId, {
        success: true,
        gpsTrackingEnabled: !gpsIsTracking
      });

      setIsLoading(false);
      setLoadingMessage('');
      success('导航已启动');
      MapVibration.navigationStarted();

    } catch (err) {
      // 结束性能监控（失败情况）
      endPerformanceMetric(performanceId, {
        success: false,
        error: err instanceof Error ? err.message : String(err)
      });

      const errorMsg = `导航启动失败: ${err}`;
      console.error('❌', errorMsg);
      setError(errorMsg);
      setIsLoading(false);
      setLoadingMessage('');
      MapVibration.operationError();
      
      errorHandler.logError(
        err instanceof Error ? err : new Error(String(err)),
        ERROR_CODES.NAVIGATION_ERROR,
        'high'
      );

      showError(errorMsg);
      onError?.({
        code: 'NAVIGATION_ERROR',
        message: errorMsg,
        type: 'MAP_ERROR',
        details: err
      });
    }
  }, [currentRoute, gpsIsTracking, startGPSTracking, onError, deviceInfo.type, showError, success]);

  /**
   * 停止导航
   */
  const stopNavigation = useCallback(() => {
    if (!mapServiceRef.current) return;

    console.log('⏹️ 停止导航...');
    mapServiceRef.current.stopNavigation();
    
    // 停止语音
    if (voiceServiceRef.current) {
      voiceServiceRef.current.stop();
    }
  }, []);

  /**
   * 开始追踪
   */
  const startTracking = useCallback(() => {
    // 验证前置条件
    const validationError = errorHandler.handleSyncError(() => {
      if (!mapServiceRef.current) {
        throw new Error('地图服务未初始化');
      }
    }, ERROR_CODES.INVALID_CONFIG, '追踪启动条件验证失败');

    if (validationError) {
      setError(validationError.message);
      showError(validationError.message);
      MapVibration.operationError();
      return;
    }

    // 开始性能监控
    const performanceId = startPerformanceMetric('tracking_start', {
      deviceType: deviceInfo.type,
      voiceEnabled: voiceNavigationConfig.enabled
    });

    try {
      console.log('🎯 开始追踪...');
      setIsLoading(true);
      setLoadingMessage('正在启动位置追踪...');
      
      const trackingConfig: TrackingConfig = {
        updateInterval: deviceInfo.type === 'mobile' ? 1000 : 2000, // 移动端更频繁更新
        minDistance: 5,
        enableVoice: voiceNavigationConfig.enabled,
        autoCenter: true
      };

      mapServiceRef.current!.startTracking(trackingConfig);
      
      // 开始GPS追踪
      if (!gpsIsTracking) {
        startGPSTracking();
      }

      // 结束性能监控
      endPerformanceMetric(performanceId, {
        success: true,
        gpsTrackingEnabled: !gpsIsTracking,
        updateInterval: trackingConfig.updateInterval
      });

      setIsLoading(false);
      setLoadingMessage('');
      success('位置追踪已启动');
      MapVibration.trackingStarted();

    } catch (err) {
      // 结束性能监控（失败情况）
      endPerformanceMetric(performanceId, {
        success: false,
        error: err instanceof Error ? err.message : String(err)
      });

      const errorMsg = `追踪启动失败: ${err}`;
      console.error('❌', errorMsg);
      setError(errorMsg);
      setIsLoading(false);
      setLoadingMessage('');
      MapVibration.operationError();
      
      errorHandler.logError(
        err instanceof Error ? err : new Error(String(err)),
        ERROR_CODES.TRACKING_ERROR,
        'high'
      );

      showError(errorMsg);
    }
  }, [gpsIsTracking, startGPSTracking, voiceNavigationConfig.enabled, deviceInfo.type, showError, success]);

  /**
   * 停止追踪
   */
  const stopTracking = useCallback(() => {
    if (!mapServiceRef.current) return;

    console.log('⏹️ 停止追踪...');
    mapServiceRef.current.stopTracking();
    stopGPSTracking();
  }, [stopGPSTracking]);

  /**
   * 清除路线
   */
  const clearRoute = useCallback(() => {
    if (!mapServiceRef.current) return;
    mapServiceRef.current.clearRoute();
    setCurrentRoute(null);
  }, []);

  /**
   * 设置地图中心
   */
  const setMapCenter = useCallback((center: [number, number]) => {
    if (!mapServiceRef.current) return;
    mapServiceRef.current.setCenter(center);
  }, []);

  /**
   * 自适应显示
   */
  const fitView = useCallback(() => {
    if (!mapServiceRef.current) return;
    mapServiceRef.current.fitView();
  }, []);

  // 监听GPS位置更新 - 性能优化版本
  useEffect(() => {
    if (currentPosition && mapServiceRef.current) {
      mapServiceRef.current.updateCurrentPosition(currentPosition);
      
      // 在追踪模式下自动居中（使用防抖避免频繁更新）
      if (isTracking && mode === 'tracking') {
        const debouncedSetCenter = debounce(() => {
          setMapCenter([currentPosition.lng, currentPosition.lat]);
        }, 500); // 500ms防抖
        
        debouncedSetCenter();
      }
    }
  }, [currentPosition, isTracking, mode, setMapCenter]);

  // 监听GPS错误 - 增强错误处理
  useEffect(() => {
    if (gpsError) {
      const errorMsg = `GPS错误: ${gpsError}`;
      setError(errorMsg);
      showError(errorMsg, {
        duration: 6000,
        action: {
          label: '重新获取GPS',
          onClick: () => {
             MapVibration.buttonClick();
             initializeGPS();
             info('正在重新获取GPS权限...');
           }
        }
      });
      onError?.({
        code: 'GPS_ERROR',
        message: errorMsg,
        type: 'GPS_ERROR',
        details: gpsError
      });
    }
  }, [gpsError, onError, initializeGPS, showError, info]);

  // 监听设备信息变化
  useEffect(() => {
    const unsubscribe = ResponsiveUtils.addDeviceChangeListener((newDeviceInfo) => {
      setDeviceInfo(newDeviceInfo);
      
      // 设备类型变化时重新调整地图
      if (mapServiceRef.current && isMapReady) {
        setTimeout(() => {
          mapServiceRef.current?.fitView();
        }, 300); // 延迟调整，等待布局完成
      }
    });

    return unsubscribe;
  }, [isMapReady]);

  // 初始化离线地图检测和语音质量检测
  useEffect(() => {
    const initializeOfflineFeatures = async () => {
      try {
        // 检测离线地图支持
        const mapStatus = await offlineMapDetector.getOfflineMapStatus();
        setOfflineMapStatus(mapStatus);
        
        // 检测语音质量
        if (voiceServiceRef.current) {
          const voiceInfo = voiceServiceRef.current.getVoiceQualityInfo();
          setVoiceQualityInfo(voiceInfo);
          
          // 尝试设置最佳离线语音
          voiceServiceRef.current.setBestOfflineVoice();
        }
        
        console.log('✅ 离线功能检测完成');
      } catch (error) {
        console.error('❌ 离线功能检测失败:', error);
      }
    };

    if (isMapReady) {
      initializeOfflineFeatures();
    }
  }, [isMapReady]);



  // 组件挂载时初始化
  useEffect(() => {
    initializeMapService();

    // 组件卸载时清理
    return () => {
      if (mapServiceRef.current) {
        mapServiceRef.current.destroy();
        mapServiceRef.current = null;
      }
      if (voiceServiceRef.current) {
        voiceServiceRef.current.destroy();
        voiceServiceRef.current = null;
      }
    };
  }, []); // 只在组件挂载时执行一次

  // 暴露给父组件的方法
  const mapMethods = useMemo(() => ({
    addWaypoint,
    removeWaypoint,
    clearWaypoints,
    planRoute,
    startNavigation,
    stopNavigation,
    startTracking,
    stopTracking,
    clearRoute,
    setMapCenter,
    fitView,
    getWaypoints: () => waypoints,
    getCurrentRoute: () => currentRoute,
    getCurrentInstruction: () => currentInstruction,
    isReady: () => isMapReady
  }), [
    addWaypoint,
    removeWaypoint,
    clearWaypoints,
    planRoute,
    startNavigation,
    stopNavigation,
    startTracking,
    stopTracking,
    clearRoute,
    setMapCenter,
    fitView,
    waypoints,
    currentRoute,
    currentInstruction,
    isMapReady
  ]);

  // 使用useImperativeHandle暴露方法给父组件
  React.useImperativeHandle(
    ref,
    () => mapMethods,
    [mapMethods]
  );

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('地图组件错误:', error, errorInfo);
        showError('地图组件发生错误，请刷新页面重试');
      }}
    >
      <div 
        className={`intelligent-running-map ${className}`}
        style={{ 
          ...MapResponsiveUtils.getMapContainerStyle(),
          ...style 
        }}
      >
        {/* 地图容器 */}
        <div
          ref={mapContainerRef}
          className="map-container"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f5f5f5'
          }}
        />

        {/* 加载状态 - 使用骨架屏 */}
        {(!isMapReady || isLoading) && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000
            }}
          >
            {!isMapReady && <MapSkeleton />}
            
            {/* 加载提示 */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: deviceInfo.type === 'mobile' ? '24px' : '20px',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              minWidth: deviceInfo.type === 'mobile' ? '280px' : '240px'
            }}>
              <div 
                style={{
                  width: deviceInfo.type === 'mobile' ? '48px' : '40px',
                  height: deviceInfo.type === 'mobile' ? '48px' : '40px',
                  border: '3px solid #e3e3e3',
                  borderTop: '3px solid #007bff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 12px'
                }}
              />
              <div style={{ 
                color: '#333', 
                fontSize: deviceInfo.type === 'mobile' ? '18px' : '16px', 
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                {!isMapReady ? '正在加载智能地图' : '处理中...'}
              </div>
              <div style={{ 
                color: '#666', 
                fontSize: deviceInfo.type === 'mobile' ? '15px' : '13px',
                lineHeight: '1.4'
              }}>
                {loadingMessage || 
                 (retryCount > 0 ? `重试中... (${retryCount}/3)` : '正在初始化GPS和地图服务')}
              </div>
              
              {/* 性能指标显示 */}
              {performanceMetrics && (
                <div style={{
                  marginTop: '12px',
                  padding: '8px',
                  backgroundColor: 'rgba(0, 123, 255, 0.1)',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#666'
                }}>
                  加载时间: {performanceMetrics.duration}ms
                </div>
              )}
            </div>
          </div>
        )}

      {/* 错误提示 - 增强版本 */}
      {error && (
        <div 
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            backgroundColor: '#ff4757',
            color: 'white',
            padding: '16px',
            borderRadius: '12px',
            zIndex: 1001,
            fontSize: '14px',
            boxShadow: '0 4px 20px rgba(255, 71, 87, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
              地图加载失败
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>
              {error}
            </div>
          </div>
          {retryCount < 3 && (
            <button
              onClick={handleRetryInitialization}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                marginLeft: '12px',
                fontWeight: '500'
              }}
            >
              重试
            </button>
          )}
        </div>
      )}

      {/* 状态指示器 */}
      <div 
        className="map-status"
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          display: 'flex',
          gap: '10px',
          zIndex: 1000
        }}
      >
        {/* GPS状态 */}
        <div 
          style={{
            backgroundColor: isGPSReady ? '#2ed573' : '#ff4757',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          GPS: {isGPSReady ? '已连接' : '未连接'}
        </div>

      {/* GPS状态 - 响应式增强版本 */}
        {isMapReady && (
          <div 
            style={{
              position: 'absolute',
              top: deviceInfo.type === 'mobile' ? '60px' : '20px', // 移动端避开安全区域
              right: deviceInfo.type === 'mobile' ? '16px' : '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              ...MapResponsiveUtils.getStatusIndicatorStyle(),
              color: '#333',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: deviceInfo.type === 'mobile' ? '10px' : '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
          <div 
            style={{
              width: deviceInfo.type === 'mobile' ? '12px' : '10px',
              height: deviceInfo.type === 'mobile' ? '12px' : '10px',
              borderRadius: '50%',
              backgroundColor: getGPSSignalQuality() === 'good' ? '#4CAF50' : 
                             getGPSSignalQuality() === 'medium' ? '#FF9800' : '#F44336',
              animation: getGPSSignalQuality() === 'good' ? 'pulse 2s infinite' : 'none'
            }}
          />
          <span style={{ 
            fontWeight: '500',
            fontSize: deviceInfo.type === 'mobile' ? '14px' : '13px'
          }}>
            GPS: {getGPSSignalQuality() === 'good' ? '信号良好' : 
                  getGPSSignalQuality() === 'medium' ? '信号一般' : '信号较差'}
          </span>
          {currentPosition && (
            <span style={{ 
              fontSize: deviceInfo.type === 'mobile' ? '12px' : '11px', 
              color: '#666',
              marginLeft: '4px'
            }}>
              ±{Math.round(currentPosition.accuracy)}m
            </span>
          )}
        </div>
      )}

        {/* 追踪状态 - 响应式增强版本 */}
        {gpsIsTracking && (
          <div 
            style={{
              position: 'absolute',
              bottom: deviceInfo.type === 'mobile' ? '120px' : '100px',
              left: deviceInfo.type === 'mobile' ? '16px' : '20px',
              backgroundColor: 'rgba(76, 175, 80, 0.95)',
              color: 'white',
              ...MapResponsiveUtils.getStatusIndicatorStyle(),
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: deviceInfo.type === 'mobile' ? '10px' : '8px'
            }}
          >
            <div 
              style={{
                width: deviceInfo.type === 'mobile' ? '12px' : '10px',
                height: deviceInfo.type === 'mobile' ? '12px' : '10px',
                borderRadius: '50%',
                backgroundColor: 'white',
                animation: 'pulse 1.5s infinite'
              }}
            />
            <span style={{ 
              fontWeight: '500',
              fontSize: deviceInfo.type === 'mobile' ? '14px' : '13px'
            }}>
              正在追踪位置
            </span>
            {positions.length > 0 && (
              <span style={{ 
                fontSize: deviceInfo.type === 'mobile' ? '12px' : '11px', 
                opacity: 0.9,
                marginLeft: '4px'
              }}>
                ({positions.length} 个点)
              </span>
            )}
          </div>
        )}

        {/* 导航状态 - 响应式增强版本 */}
        {isNavigating && (
          <div 
            style={{
              position: 'absolute',
              bottom: deviceInfo.type === 'mobile' ? '180px' : '160px',
              left: deviceInfo.type === 'mobile' ? '16px' : '20px',
              backgroundColor: 'rgba(33, 150, 243, 0.95)',
              color: 'white',
              ...MapResponsiveUtils.getStatusIndicatorStyle(),
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: deviceInfo.type === 'mobile' ? '10px' : '8px'
            }}
          >
            <div 
              style={{
                width: deviceInfo.type === 'mobile' ? '12px' : '10px',
                height: deviceInfo.type === 'mobile' ? '12px' : '10px',
                borderRadius: '50%',
                backgroundColor: 'white',
                animation: 'pulse 1.5s infinite'
              }}
            />
            <span style={{ 
              fontWeight: '500',
              fontSize: deviceInfo.type === 'mobile' ? '14px' : '13px'
            }}>
              导航中
            </span>
          </div>
        )}
      </div>

      {/* 离线功能状态面板（开发模式） */}
      {import.meta.env.DEV && (offlineMapStatus || voiceQualityInfo) && (
        <div 
          className="offline-status-panel"
          style={{
            position: 'absolute',
            top: deviceInfo.type === 'mobile' ? '120px' : '80px',
            left: deviceInfo.type === 'mobile' ? '16px' : '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            color: 'white',
            padding: deviceInfo.type === 'mobile' ? '12px' : '10px',
            borderRadius: '8px',
            fontSize: deviceInfo.type === 'mobile' ? '12px' : '11px',
            fontFamily: 'monospace',
            zIndex: 1001,
            maxWidth: deviceInfo.type === 'mobile' ? '280px' : '240px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
          onClick={() => {
            console.log('🗺️ 离线地图状态:', offlineMapStatus);
            console.log('🔊 语音质量信息:', voiceQualityInfo);
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#4CAF50' }}>
            🔧 离线功能状态 (点击查看详情)
          </div>
          
          {offlineMapStatus && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ color: '#FFC107' }}>🗺️ 离线地图:</div>
              <div style={{ marginLeft: '8px', fontSize: '10px' }}>
                <div>支持: {offlineMapStatus.isSupported ? '✅' : '❌'}</div>
                <div>网络: {offlineMapStatus.networkStatus.isOnline ? '在线' : '离线'}</div>
                {offlineMapStatus.storageQuota && (
                  <div>存储: {Math.round(offlineMapStatus.storageQuota.available / 1024 / 1024)}MB可用</div>
                )}
              </div>
            </div>
          )}
          
          {voiceQualityInfo && (
            <div>
              <div style={{ color: '#2196F3' }}>🔊 语音质量:</div>
              <div style={{ marginLeft: '8px', fontSize: '10px' }}>
                <div>质量: {voiceQualityInfo.quality === 'high' ? '高' : voiceQualityInfo.quality === 'medium' ? '中' : '低'}</div>
                <div>离线: {voiceQualityInfo.isOffline ? '✅' : '❌'}</div>
                {voiceQualityInfo.currentVoice && (
                  <div>语音: {voiceQualityInfo.currentVoice.name.substring(0, 15)}...</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 性能监控面板（开发模式） - 响应式 */}
      {import.meta.env.DEV && getPerformanceMetrics && (
        <div 
          className="performance-panel"
          style={{
            position: 'absolute',
            top: deviceInfo.type === 'mobile' ? '20px' : '10px',
            right: deviceInfo.type === 'mobile' ? '16px' : '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: deviceInfo.type === 'mobile' ? '12px' : '10px',
            borderRadius: '4px',
            fontSize: deviceInfo.type === 'mobile' ? '12px' : '11px',
            fontFamily: 'monospace',
            zIndex: 1002,
            minWidth: deviceInfo.type === 'mobile' ? '250px' : '200px'
          }}
          onClick={() => {
            const metrics = getPerformanceMetrics();
            console.log('📊 GPS性能指标:', metrics);
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            📊 性能监控 (点击查看详情)
          </div>
          {(() => {
            const metrics = getPerformanceMetrics();
            return (
              <>
                <div>GPS更新: {metrics.updateCount}次</div>
                <div>平均耗时: {metrics.avgUpdateTime.toFixed(1)}ms</div>
                <div>当前精度: {metrics.lastAccuracy}m</div>
                <div>更新间隔: {metrics.currentInterval}ms</div>
                <div>设备性能: {metrics.devicePerformance}</div>
                {metrics.memoryUsage && (
                  <div>内存使用: {metrics.memoryUsage.sizeInKB.toFixed(1)}KB</div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* CSS动画 */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes loading-progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .intelligent-running-map {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
      </div>
    </ErrorBoundary>
  );
});

export default IntelligentRunningMap;