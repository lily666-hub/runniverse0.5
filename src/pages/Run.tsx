import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, MapPin, Clock, Activity, Zap, Navigation, Heart, AlertCircle, CheckCircle, Brain, Shield, RotateCcw, Wifi, WifiOff, Loader2, RefreshCw, AlertTriangle, Route as RouteIcon, Target, Mic } from 'lucide-react';
import { SmartRunningMap } from '../components/unified/SmartRunningMap';
import { AIRunningAssistant } from '../components/unified/AIRunningAssistant';
import { VoiceNavigationControl } from '../components/VoiceNavigationControl';
import { WaypointManager } from '../components/navigation/WaypointManager';
import { RouteNavigator } from '../components/navigation/RouteNavigator';
import { UnifiedGPSAIService } from '../services/unified/UnifiedGPSAIService';
import type { VoiceGuidanceOptions } from '../services/unified/VoiceGuidanceService';
import { useRunStore } from '../store';
import { formatDistance, formatDuration, formatPace, calculateCalories } from '../utils/format';
import type { 
  GPSPosition, 
  RouteData, 
  FusedData, 
  SafetyAlert, 
  NavigationGuidance,
  UnifiedTrackingOptions,
  Waypoint
} from '../types/unified';

// 右下角可拖拽的语音调试浮窗
const VoiceDebugFloat: React.FC<{
  show: boolean;
  onClose: () => void;
  onStartNav: () => void;
  onStopNav: () => void;
}> = ({ show, onClose, onStartNav, onStopNav }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const startRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    // 初始位置：右下角
    const initX = (typeof window !== 'undefined') ? Math.max(16, window.innerWidth - 360 - 16) : 16;
    const initY = (typeof window !== 'undefined') ? Math.max(16, window.innerHeight - 240 - 16) : 16;
    setPos({ x: initX, y: initY });
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    startRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    const nx = e.clientX - startRef.current.x;
    const ny = e.clientY - startRef.current.y;
    setPos({ x: Math.max(8, nx), y: Math.max(8, ny) });
  };

  const onMouseUp = () => {
    setDragging(false);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  if (!show) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-40 w-80 bg-white border border-gray-200 rounded-lg shadow-lg"
      style={{ left: pos.x, top: pos.y }}
    >
      <div
        className="cursor-move px-3 py-2 border-b flex items-center justify-between bg-gray-50"
        onMouseDown={onMouseDown}
      >
        <span className="text-sm font-medium">语音调试区</span>
        <button className="text-xs text-gray-600 hover:text-gray-800" onClick={onClose}>收起</button>
      </div>
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between p-2 bg-gray-100 rounded">
          <span className="text-xs text-gray-700">安全状态：安全</span>
          <button className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300">语音指令</button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onStartNav} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">语音导航</button>
          <button onClick={onStopNav} className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">停止</button>
        </div>
      </div>
    </div>
  );
};

// 跑步模式枚举
enum RunMode {
  FREE_RUNNING = 'free_running',
  NAVIGATION = 'navigation'
}

const Run: React.FC = () => {
  // 基础跑步状态
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [pausedTime, setPausedTime] = useState(0);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [currentRoute, setCurrentRoute] = useState<RouteData | null>(null);

  // 跑步模式状态
  const [runMode, setRunMode] = useState<RunMode>(RunMode.FREE_RUNNING);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [navigationRoute, setNavigationRoute] = useState<RouteData | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // 统一服务状态
  const [isServiceReady, setIsServiceReady] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [currentPosition, setCurrentPosition] = useState<GPSPosition | null>(null);
  const [fusedData, setFusedData] = useState<FusedData | null>(null);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [isAIAssistantActive, setIsAIAssistantActive] = useState(false);
  // 语音调试区显示状态（右侧可展开/收起）
  const [showVoiceDebug, setShowVoiceDebug] = useState(true);
  
  // GPS状态
  const [isGPSReady, setIsGPSReady] = useState(false);
  const [positions, setPositions] = useState<GPSPosition[]>([]);
  
  // 语音导航状态
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<any>(null);
  // 5.0.html 风格语音参数 & 自定义文本
  const [voiceRate, setVoiceRate] = useState(1.0);
  const [voiceVolume, setVoiceVolume] = useState(0.8);
  const [customVoiceText, setCustomVoiceText] = useState('');
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);

  // 服务引用
  const unifiedServiceRef = useRef<UnifiedGPSAIService | null>(null);

  const { setCurrentRun, addRun } = useRunStore();

  // 初始化统一服务
  useEffect(() => {
    const initializeUnifiedService = async () => {
      try {
        unifiedServiceRef.current = UnifiedGPSAIService.getInstance();
        await unifiedServiceRef.current.initialize();
        
        // 设置事件监听
        unifiedServiceRef.current.on('unifiedDataUpdate', handleUnifiedDataUpdate);
        unifiedServiceRef.current.on('safetyAlert', handleSafetyAlert);
        unifiedServiceRef.current.on('gpsUpdate', handleGPSUpdate);
        unifiedServiceRef.current.on('aiResponse', handleAIResponse);
        
        setIsServiceReady(true);
        setIsGPSReady(true);
        setServiceError(null);
        console.log('✅ 统一GPS+AI服务初始化完成');
      } catch (error) {
        console.error('❌ 统一服务初始化失败:', error);
        setServiceError(error instanceof Error ? error.message : '服务初始化失败');
        setIsServiceReady(false);
        setIsGPSReady(false);
      }
    };

    initializeUnifiedService();

    return () => {
      if (unifiedServiceRef.current) {
        unifiedServiceRef.current.off('unifiedDataUpdate', handleUnifiedDataUpdate);
        unifiedServiceRef.current.off('safetyAlert', handleSafetyAlert);
        unifiedServiceRef.current.off('gpsUpdate', handleGPSUpdate);
        unifiedServiceRef.current.off('aiResponse', handleAIResponse);
      }
    };
  }, []);

  // 计时器
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isPaused && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime - pausedTime);
      }, 100);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, isPaused, startTime, pausedTime]);

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
    setPositions(prev => [...prev, newPosition]);
    
    // 更新AI洞察
    if (data.insights.recommendations) {
      setAiInsights(data.insights.recommendations);
    }
  }, []);

  // 处理安全警报
  const handleSafetyAlert = useCallback((alert: SafetyAlert) => {
    setSafetyAlerts(prev => [...prev.slice(-4), alert]);
  }, []);

  // 处理GPS更新
  const handleGPSUpdate = useCallback((gpsData: any) => {
    const newPosition: GPSPosition = {
      latitude: gpsData.latitude,
      longitude: gpsData.longitude,
      accuracy: gpsData.accuracy || 10,
      timestamp: gpsData.timestamp
    };
    setCurrentPosition(newPosition);
    setPositions(prev => [...prev, newPosition]);

    // 5.0.html 到达检测与语音播报：导航模式下接近当前途径点播报
    if (runMode === RunMode.NAVIGATION && isNavigating && waypoints.length > 0) {
      const idx = Math.min(currentWaypointIndex, waypoints.length - 1);
      const target = waypoints[idx];
      if (target) {
        const dist = calculateDistanceMeters(newPosition.latitude, newPosition.longitude, target.lat, target.lng);
        // 与 5.0.html 保持一致的阈值（约 25 米）
        if (dist <= 25) {
          speak(`已到达${target.name}`);
          setCurrentWaypointIndex(idx + 1);
        } else if (dist > 150) {
          // 可选偏离提示（5.0.html中为注释，这里同样保留为注释）
          // speak('注意：你偏离路线较远，建议重规划。');
        }
      }
    }
  }, [waypoints, runMode, isNavigating, currentWaypointIndex]);

  // 处理AI响应
  const handleAIResponse = useCallback((response: any) => {
    console.log('AI响应:', response);
  }, []);

  // 处理导航指导
  const handleGuidanceReceived = useCallback((guidance: NavigationGuidance) => {
    console.log('导航指导:', guidance);
  }, []);

  // 处理紧急警报
  const handleEmergencyAlert = useCallback((alert: SafetyAlert) => {
    console.log('紧急警报:', alert);
    // 这里可以添加紧急处理逻辑，如自动发送求救信息
  }, []);

  // 计算平均速度
  const getAverageSpeed = (): number => {
    if (positions.length < 2 || elapsedTime === 0) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const curr = positions[i];
      const distance = calculateDistanceMeters(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
      totalDistance += distance;
    }
    
    const timeInHours = elapsedTime / (1000 * 60 * 60);
    return totalDistance / 1000 / timeInHours; // km/h
  };

  // 计算两点间距离（米）
  const calculateDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // 5.0.html 风格的语音播报函数
  const speak = useCallback((text: string) => {
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('语音合成不可用');
        return;
      }
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'zh-CN';
      utter.rate = voiceRate;
      utter.volume = voiceVolume;
      utter.onstart = () => console.log('🔊 语音开始:', text);
      utter.onend = () => console.log('🔊 语音结束');
      utter.onerror = (e) => console.error('语音错误:', e);
      // 性能优化：避免队列堆积，先取消之前的播报
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.error('语音播报失败:', e);
    }
  }, [voiceRate, voiceVolume]);

  // 浏览器语音支持与安全环境检测
  const checkVoiceSupport = useCallback(() => {
    const hasSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const hasRecognition = typeof window !== 'undefined' && (
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    );
    const isSecure = typeof window !== 'undefined' ? window.isSecureContext : false;
    return { synthesis: hasSynthesis, recognition: hasRecognition, secure: isSecure };
  }, []);

  // 主动申请麦克风权限（用于语音识别场景）
  const ensureMicrophonePermission = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('当前浏览器不支持麦克风权限API');
        return false;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 立即释放资源
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch (error) {
      console.error('麦克风权限获取失败:', error);
      return false;
    }
  }, []);

  // 挂载后记录支持状态与安全环境
  useEffect(() => {
    const support = checkVoiceSupport();
    console.log(`Web Speech API 支持 - 合成: ${support.synthesis}, 识别: ${support.recognition}, HTTPS: ${support.secure}`);
  }, [checkVoiceSupport]);

  // 处理模式切换
  const handleModeChange = (mode: RunMode) => {
    if (isRunning) {
      alert('请先停止当前跑步再切换模式');
      return;
    }
    
    setRunMode(mode);
    
    // 重置相关状态
    if (mode === RunMode.FREE_RUNNING) {
      setWaypoints([]);
      setNavigationRoute(null);
      setIsNavigating(false);
    }
  };

  // 处理途径点更新
  const handleWaypointsUpdate = (newWaypoints: Waypoint[]) => {
    console.log('Run页面：收到途径点更新:', newWaypoints);
    setWaypoints(newWaypoints);
    
    // 如果有途径点，自动生成路线
    if (newWaypoints.length > 0) {
      console.log('开始生成导航路线...');
      generateRouteFromWaypoints(newWaypoints);
    }
  };

  // 根据途径点生成路线
  const generateRouteFromWaypoints = async (waypoints: Waypoint[]) => {
    if (waypoints.length < 2) {
      console.log('途径点数量不足，无法生成路线');
      return;
    }

    try {
      // 创建路线数据
      const coordinates: [number, number][] = waypoints.map(wp => [wp.lng, wp.lat]);
      const routeData: RouteData = {
        id: `route-${Date.now()}`,
        name: '上海经典跑步路线',
        description: '外滩-南京东路-人民广场-淮海中路-世纪公园',
        distance: calculateTotalDistance(waypoints),
        duration: 0,
        difficulty: '中等',
        coordinates,
        waypoints: waypoints,
        elevation: [],
        tags: ['上海', '经典', '城市风光'],
        created_at: new Date().toISOString()
      };

      console.log('生成的路线数据:', routeData);
      setNavigationRoute(routeData);
      setCurrentRoute(routeData);
      
      // 语音播报
      if (isVoiceEnabled) {
        speak(`路线规划完成，全程${routeData.distance.toFixed(1)}公里，途经${waypoints.length}个地标`);
      }
      
    } catch (error) {
      console.error('生成路线失败:', error);
    }
  };

  // 计算总距离
  const calculateTotalDistance = (waypoints: Waypoint[]): number => {
    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const distance = calculateDistanceBetweenPoints(
        waypoints[i].lat,
        waypoints[i].lng,
        waypoints[i + 1].lat,
        waypoints[i + 1].lng
      );
      totalDistance += distance;
    }
    return totalDistance;
  };

  // 计算两点间距离（公里） - 辅助函数
  const calculateDistanceBetweenPoints = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 处理路线规划
  const handleRouteGenerated = (route: RouteData) => {
    setNavigationRoute(route);
    setCurrentRoute(route);
    // 与 5.0.html 保持一致：规划完成后播报提示
    speak('路线规划完成，已绘制在地图上。');
    setCurrentWaypointIndex(0);
  };

  // 开始导航
  const handleStartNavigation = () => {
    if (!navigationRoute) {
      alert('请先规划路线');
      return;
    }
    
    setIsNavigating(true);
    setCurrentRoute(navigationRoute);
  };

  // 停止导航
  const handleStopNavigation = () => {
    setIsNavigating(false);
  };

  // 开始跑步
  const handleStart = async () => {
    if (!isServiceReady || !unifiedServiceRef.current) return;
    
    try {
      const now = Date.now();
      setStartTime(now);
      setIsRunning(true);
      setIsPaused(false);
      setEndTime(null);
      setElapsedTime(0);
      setPausedTime(0);
      
      // 启动统一追踪服务
      const trackingOptions: UnifiedTrackingOptions = {
        gpsOptions: {
          enableHighAccuracy: true,
          updateInterval: 2000
        },
        aiOptions: {
          contextAwareness: true,
          realtimeAnalysis: true
        }
      };
      
      const voiceOptions: VoiceGuidanceOptions = {
        language: 'zh-CN',
        voice: 'female',
        speed: 1.0,
        volume: 0.8,
        enableAIGuidance: isVoiceEnabled,
        guidanceInterval: 30000
      };
      
      await unifiedServiceRef.current.startUnifiedTracking(trackingOptions);
      setIsAIAssistantActive(true);
      
      // 更新语音状态
      if (isVoiceEnabled) {
        setVoiceStatus({ enabled: true, active: true });
      }
      
      // 如果是导航模式且有路线，开始导航
      if (runMode === RunMode.NAVIGATION && navigationRoute) {
        setIsNavigating(true);
      }
      
      setCurrentRun({
        id: Date.now().toString(),
        user_id: 'default-user',
        startTime: now,
        distance: 0,
        duration: 0,
        calories: 0,
        route: [],
        route_data: { coordinates: [] },
        average_pace: 0,
        created_at: new Date().toISOString(),
        status: 'idle'
      });
      
      console.log(`✅ 开始${runMode === RunMode.NAVIGATION ? '导航' : '自由'}跑步追踪`);
    } catch (error) {
      console.error('❌ 开始跑步失败:', error);
    }
  };

  // 暂停/继续跑步
  const handlePause = async () => {
    if (!unifiedServiceRef.current) return;

    try {
      if (isPaused) {
        // 继续跑步
        const now = Date.now();
        setPausedTime(prev => prev + (now - (startTime || 0) - elapsedTime));
        setIsPaused(false);
        
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
        
        console.log('✅ 继续智能跑步追踪');
      } else {
        // 暂停跑步
        setIsPaused(true);
        await unifiedServiceRef.current.stopUnifiedTracking();
        
        console.log('⏸️ 暂停智能跑步追踪');
      }
    } catch (error) {
      console.error('❌ 暂停/继续操作失败:', error);
    }
  };

  // 停止跑步
  const handleStop = async () => {
    if (!startTime || !unifiedServiceRef.current) return;
    
    try {
      const now = new Date();
      setEndTime(now);
      setIsRunning(false);
      setIsPaused(false);
      setIsAIAssistantActive(false);
      
      await unifiedServiceRef.current.stopUnifiedTracking();
      
      // 获取最终数据
      const finalDistance = fusedData?.gps.totalDistance ? fusedData.gps.totalDistance / 1000 : 0;
      const finalDuration = elapsedTime / 1000;
      const finalPace = finalDistance > 0 ? finalDuration / finalDistance / 60 : 0;
      const finalCalories = calculateCalories(finalDistance, finalDuration, 70);
      
      // 构建路线坐标
      const coordinates: [number, number][] = [];
      if (fusedData?.gps.positions) {
        coordinates.push(...fusedData.gps.positions.map(pos => [pos.longitude, pos.latitude] as [number, number]));
      }
      
      const runData = {
        id: Date.now().toString(),
        user_id: 'temp-user',
        route_data: { coordinates },
        distance: finalDistance,
        duration: finalDuration,
        average_pace: finalPace,
        calories: finalCalories,
        startTime: startTime,
        endTime: now.getTime(),
        status: 'completed' as const,
        created_at: new Date().toISOString()
      };
      
      addRun(runData);
      setCurrentRun(null);
      
      console.log('✅ 跑步记录已保存');
    } catch (error) {
      console.error('❌ 停止跑步失败:', error);
    }
  };

  // 重置
  const handleReset = async () => {
    try {
      if (unifiedServiceRef.current) {
        await unifiedServiceRef.current.stopUnifiedTracking();
      }
      
      setIsRunning(false);
      setIsPaused(false);
      setStartTime(null);
      setElapsedTime(0);
      setPausedTime(0);
      setEndTime(null);
      setCurrentRoute(null);
      setCurrentPosition(null);
      setFusedData(null);
      setSafetyAlerts([]);
      setAiInsights([]);
      setIsAIAssistantActive(false);
      setIsVoiceEnabled(false);
      setVoiceStatus(null);
      setCurrentRun(null);
      
      // 重置导航相关状态
      setIsNavigating(false);
      if (runMode === RunMode.FREE_RUNNING) {
        setWaypoints([]);
        setNavigationRoute(null);
      }
      
      console.log('✅ 跑步数据已重置');
    } catch (error) {
      console.error('❌ 重置失败:', error);
    }
  };

  // 语音导航控制函数
  const handleToggleVoice = async (enabled: boolean) => {
    try {
      const support = checkVoiceSupport();

      if (enabled) {
        if (!support.secure) {
          console.warn('语音API需要HTTPS安全连接，建议在HTTPS环境下使用');
        }
        // 如果支持语音识别，主动尝试获取麦克风权限
        if (support.recognition) {
          const micOK = await ensureMicrophonePermission();
          if (!micOK) {
            console.warn('未获取麦克风权限，语音识别将不可用');
          }
        }
        setIsVoiceEnabled(true);
        const svc: any = unifiedServiceRef.current;
        await svc?.enableVoiceGuidance?.();
        updateVoiceStatus();
      } else {
        setIsVoiceEnabled(false);
        const svc: any = unifiedServiceRef.current;
        await svc?.disableVoiceGuidance?.();
        setVoiceStatus(null);
      }
    } catch (error) {
      console.error('切换语音导航失败:', error);
    }
  };

  const handleUpdateVoiceOptions = (options: Partial<VoiceGuidanceOptions>) => {
    try {
      const svc: any = unifiedServiceRef.current;
      svc?.updateVoiceOptions?.(options);
      // 同步到本地语速与音量（保持与 5.0.html 的合成参数一致）
      if (options.speed !== undefined) setVoiceRate(options.speed);
      if (options.volume !== undefined) setVoiceVolume(options.volume);
      updateVoiceStatus();
    } catch (error) {
      console.error('更新语音选项失败:', error);
    }
  };

  const updateVoiceStatus = () => {
    try {
      const svc: any = unifiedServiceRef.current;
      const status = svc?.getVoiceGuidanceStatus?.();
      if (status) {
        setVoiceStatus(status);
      } else {
        const support = checkVoiceSupport();
        setVoiceStatus({
          isEnabled: isVoiceEnabled,
          isListening: false,
          queueLength: 0,
          options: {
            language: 'zh-CN',
            voice: 'female',
            speed: voiceRate,
            volume: voiceVolume,
            enableAIGuidance: true,
            guidanceInterval: 30000
          },
          support
        });
      }
    } catch (error) {
      console.error('获取语音状态失败:', error);
    }
  };

  // 地图右上“语音指令”点击：展开调试区并开启语音（不改变既有功能）
  const handleVoiceCommandClick = useCallback(async () => {
    try {
      setShowVoiceDebug(true);
      if (!isVoiceEnabled) {
        await handleToggleVoice(true);
      }
    } catch (e) {
      console.error('语音指令入口操作失败:', e);
    }
  }, [isVoiceEnabled]);

  // 计算实时数据
  const distance = fusedData?.gps.totalDistance ? fusedData.gps.totalDistance / 1000 : 0; // 公里
  const duration = elapsedTime / 1000; // 秒
  const pace = distance > 0 ? duration / distance / 60 : 0; // 分钟/公里
  const calories = (isRunning && distance > 0) ? calculateCalories(distance, duration / 60, 70) : 0;
  const currentSpeed = fusedData?.gps.speed || 0; // km/h
  const averageSpeed = distance > 0 && duration > 0 ? (distance / (duration / 3600)) : 0; // km/h

  // 统计数据
  const stats = [
    { 
      label: '时间', 
      value: formatDuration(duration), 
      icon: Clock, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    { 
      label: '配速', 
      value: formatPace(pace), 
      icon: Activity, 
      color: 'text-orange-500',
      bgColor: 'bg-orange-50'
    },
    { 
      label: '距离', 
      value: formatDistance(distance * 1000), 
      icon: MapPin, 
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    { 
      label: '卡路里', 
      value: Math.round(calories).toString(), 
      icon: Zap, 
      color: 'text-red-500',
      bgColor: 'bg-red-50'
    },
  ];

  // 服务状态显示组件
  const renderServiceStatus = () => {
    if (serviceError) {
      return (
        <div className="service-status error bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <div className="status-icon">⚠️</div>
            <div className="flex-1">
              <div className="status-title font-medium text-red-800">智能服务连接失败</div>
              <div className="status-detail text-sm text-red-600 mt-1">{serviceError}</div>
              <div className="status-actions mt-3">
                <button 
                  className="retry-btn px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700" 
                  onClick={() => window.location.reload()}
                >
                  重新加载
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!isServiceReady) {
      return (
        <div className="service-status connecting bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <div className="status-icon">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
            </div>
            <div className="flex-1">
              <div className="status-title font-medium text-yellow-800">正在初始化智能服务...</div>
              <div className="status-detail text-sm text-yellow-600 mt-1">
                GPS定位 + AI智能分析 + 安全监控
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="service-status ready bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="status-icon">✅</div>
            <div className="flex-1">
              <div className="status-title font-medium text-green-800 flex items-center">
                智能跑步服务已就绪
                <Brain className="w-4 h-4 ml-2 text-blue-600" />
              </div>
              <div className="status-detail text-sm text-green-600 mt-1 flex items-center space-x-4">
                <span>GPS精度: {currentPosition?.accuracy ? `${Math.round(currentPosition.accuracy)}米` : '获取中...'}</span>
                {fusedData && (
                  <>
                    <span>数据质量: {fusedData.fusion.quality}</span>
                    <span>置信度: {(fusedData.fusion.confidence * 100).toFixed(0)}%</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {safetyAlerts.length > 0 && (
            <div className="flex items-center space-x-1 text-orange-600">
              <Shield className="w-4 h-4" />
              <span className="text-sm">{safetyAlerts.length} 个安全提醒</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="header mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
            上海跑市
            <Brain className="w-8 h-8 ml-3 text-blue-600" />
            <span className="text-lg text-blue-600 ml-2">AI智能跑步</span>
          </h1>
        </div>

        {/* 跑步模式选择 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">选择跑步模式</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleModeChange(RunMode.FREE_RUNNING)}
              className={`p-4 rounded-lg border-2 transition-all ${
                runMode === RunMode.FREE_RUNNING
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Activity className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-medium">自由跑步</div>
                  <div className="text-sm text-gray-500">随心所欲，自由奔跑</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => handleModeChange(RunMode.NAVIGATION)}
              className={`p-4 rounded-lg border-2 transition-all ${
                runMode === RunMode.NAVIGATION
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Navigation className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-medium">导航跑步</div>
                  <div className="text-sm text-gray-500">规划路线，精准导航</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 服务状态显示 */}
        {renderServiceStatus()}

        <div className="grid grid-cols-1 gap-6">
          {/* 主区域：智能地图与数据 */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg lg:rounded-xl shadow-sm mb-4 lg:mb-6 overflow-hidden">
              <div className="relative h-48 sm:h-64 lg:h-96">
                <SmartRunningMap
                  route={currentRoute}
                  currentLocation={currentPosition}
                  showAIInsights={true}
                  onLocationUpdate={setCurrentPosition}
                  onRouteSelect={setCurrentRoute}
                  waypoints={waypoints}
                  navigationRoute={navigationRoute}
                  isNavigating={isNavigating}
                  runMode={runMode}
                />
                {/* 左上：停止追踪浮层（红色） */}
                <div className="absolute top-3 left-3 z-10">
                  <div className="rounded-lg overflow-hidden shadow bg-white border border-gray-200 w-44">
                    <button
                      onClick={handleStop}
                      disabled={!isRunning}
                      className={`w-full text-white text-sm px-3 py-2 flex items-center justify-center ${isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300 cursor-not-allowed'}`}
                    >
                      停止追踪
                    </button>
                    <div className="px-3 py-2 text-xs text-gray-600 flex items-center gap-1">
                      <Target className="w-3 h-3 text-gray-500" />
                      全球定位系统：{currentPosition?.accuracy ? `${Math.round(currentPosition.accuracy)}m` : '获取中...'}
                    </div>
                  </div>
                </div>
                {/* 右上：安全状态 + 语音指令浮层 */}
                <div className="absolute top-3 right-3 z-10">
                  <div className="rounded-lg shadow bg-white border border-gray-200 p-3 flex flex-col gap-2">
                    <div className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 ${safetyAlerts.length === 0 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                      {safetyAlerts.length === 0 ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      安全状态：{safetyAlerts.length === 0 ? '安全' : '有提醒'}
                    </div>
                    <button
                      onClick={handleVoiceCommandClick}
                      className="px-3 py-1 text-xs bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 flex items-center gap-1 justify-center"
                    >
                      <Mic className="w-3 h-3" /> 语音指令
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 地图下方：时间/配速等四个小模块（横向排列） */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className={`${stat.bgColor} rounded-lg lg:rounded-xl p-4 lg:p-6 text-center border border-opacity-20`}>
                    <Icon className={`h-6 w-6 lg:h-8 lg:w-8 ${stat.color} mx-auto mb-2 lg:mb-3`} />
                    <p className="text-lg lg:text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                    <p className="text-xs lg:text-sm text-gray-600 font-medium">{stat.label}</p>
                    {stat.label === '距离' && fusedData?.fusion && (
                      <div className="text-xs text-blue-600 mt-1">
                        精度: {(fusedData.fusion.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                    {stat.label === '配速' && currentSpeed > 0 && (
                      <div className="text-xs text-green-600 mt-1">
                        当前: {currentSpeed.toFixed(1)} km/h
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 导航模式专用控制面板 */}
            {runMode === RunMode.NAVIGATION && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* 途径点管理 */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <WaypointManager
                    waypoints={waypoints}
                    onWaypointsChange={handleWaypointsUpdate}
                    currentLocation={currentPosition}
                  />
                </div>

                {/* 路线导航 */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <RouteNavigator
                    waypoints={waypoints}
                    currentLocation={currentPosition}
                    onRouteGenerated={handleRouteGenerated}
                    onStartNavigation={handleStartNavigation}
                    onStopNavigation={handleStopNavigation}
                    isNavigating={isNavigating}
                    navigationRoute={navigationRoute}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 右侧栏移除，改为浮窗模式 */}

          {/* 语音导航控制 */}
          <div className="col-span-1">
            <VoiceNavigationControl
              isEnabled={isVoiceEnabled}
              onToggleVoice={handleToggleVoice}
              onUpdateOptions={handleUpdateVoiceOptions}
              voiceStatus={voiceStatus}
            />

            {/* 5.0.html 风格的语音自定义与测试面板 */}
            <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
              <h4 className="font-medium text-gray-700">语音播报测试与自定义</h4>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={customVoiceText}
                  onChange={(e) => setCustomVoiceText(e.target.value)}
                  placeholder="输入要播报的内容"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => speak(customVoiceText || '语音测试')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  播报
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="text-sm text-gray-600">语速: {voiceRate.toFixed(1)}x</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={voiceRate}
                    onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">音量: {Math.round(voiceVolume * 100)}%</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={voiceVolume}
                    onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">语音由浏览器 Web Speech API 提供，设备支持情况可能不同。</p>
            </div>
          </div>
        </div>

        {/* 浮窗：AI跑步助手（右侧可折叠） */}
        <div className="fixed right-4 top-24 z-40">
          {isAIAssistantActive ? (
            <div className="w-80 max-h-[70vh] bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <span className="text-sm font-medium">AI跑步助手</span>
                <button
                  className="text-xs text-gray-600 hover:text-gray-800"
                  onClick={() => setIsAIAssistantActive(false)}
                >
                  收起
                </button>
              </div>
              <div className="p-2 overflow-y-auto">
                <AIRunningAssistant
                  isActive={true}
                  currentRoute={currentRoute}
                  onGuidanceReceived={handleGuidanceReceived}
                  onEmergencyAlert={handleEmergencyAlert}
                />
              </div>
            </div>
          ) : (
            <button
              className="px-3 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
              onClick={() => setIsAIAssistantActive(true)}
            >
              打开 AI 助手
            </button>
          )}
        </div>

        {/* 浮窗：语音调试区（右下角可拖拽） */}
        <VoiceDebugFloat
          show={showVoiceDebug}
          onClose={() => setShowVoiceDebug(false)}
          onStartNav={handleStartNavigation}
          onStopNav={handleStopNavigation}
        />

        {/* 运动数据模块已移动到地图下方 */}

        {/* AI洞察和安全提醒 */}
        {(aiInsights.length > 0 || safetyAlerts.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* AI洞察 */}
            {aiInsights.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                  <Brain className="w-4 h-4 mr-2" />
                  AI智能建议
                </h3>
                <div className="space-y-2">
                  {aiInsights.slice(-3).map((insight, index) => (
                    <div key={index} className="text-sm text-blue-800">
                      {insight}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 安全提醒 */}
            {safetyAlerts.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-900 mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  安全提醒
                </h3>
                <div className="space-y-2">
                  {safetyAlerts.slice(-3).map((alert, index) => (
                    <div key={index} className="text-sm text-red-800">
                      <span className="font-medium">{alert.type}:</span> {alert.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 控制按钮 */}
        <div className="bg-white rounded-lg lg:rounded-xl p-4 lg:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {!isRunning ? (
              <button
                onClick={handleStart}
                disabled={!isGPSReady || (runMode === RunMode.NAVIGATION && !navigationRoute)}
                className="w-full sm:w-auto flex items-center justify-center px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <Play className="h-5 w-5 mr-2" />
                {!isGPSReady 
                  ? '等待GPS连接...' 
                  : runMode === RunMode.NAVIGATION && !navigationRoute
                    ? '请先规划路线'
                    : `开始${runMode === RunMode.NAVIGATION ? '导航' : '自由'}跑步`
                }
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={handlePause}
                  className={`flex items-center justify-center px-6 py-3 rounded-lg transition-colors font-medium ${
                    isPaused
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-yellow-600 text-white hover:bg-yellow-700'
                  }`}
                >
                  {isPaused ? (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      继续
                    </>
                  ) : (
                    <>
                      <Pause className="h-5 w-5 mr-2" />
                      暂停
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleStop}
                  className="flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <Square className="h-5 w-5 mr-2" />
                  结束
                </button>
              </div>
            )}
            
            {(endTime || (!isRunning && (distance > 0 || duration > 0))) && (
              <button
                onClick={handleReset}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                重置
              </button>
            )}
          </div>
        </div>

        {/* 跑步完成后的总结 */}
        {endTime && (
          <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {runMode === RunMode.NAVIGATION ? '导航' : '自由'}跑步完成！
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{formatDuration(duration)}</p>
                <p className="text-sm text-gray-600">总时长</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{formatDistance(distance * 1000)}</p>
                <p className="text-sm text-gray-600">总距离</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{formatPace(pace)}</p>
                <p className="text-sm text-gray-600">平均配速</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{Math.round(calories)}</p>
                <p className="text-sm text-gray-600">消耗卡路里</p>
              </div>
            </div>
            
            {runMode === RunMode.NAVIGATION && navigationRoute && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  导航路线: {waypoints.length} 个途径点，预计距离 {(navigationRoute.distance / 1000).toFixed(2)} 公里
                </p>
              </div>
            )}
          </div>
        )}

        {/* 实时数据 */}
        {isRunning && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">实时数据</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">平均速度:</span>
                <span className="ml-2 font-medium">{getAverageSpeed().toFixed(1)} km/h</span>
              </div>
              <div>
                <span className="text-gray-500">记录点数:</span>
                <span className="ml-2 font-medium">{positions.length}</span>
              </div>
              {currentPosition && (
                <div>
                  <span className="text-gray-500">当前速度:</span>
                  <span className="ml-2 font-medium">
                    {currentPosition.speed ? (currentPosition.speed * 3.6).toFixed(1) : '0.0'} km/h
                  </span>
                </div>
              )}
              {runMode === RunMode.NAVIGATION && (
                <>
                  <div>
                    <span className="text-gray-500">导航状态:</span>
                    <span className="ml-2 font-medium">{isNavigating ? '导航中' : '未导航'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">途径点:</span>
                    <span className="ml-2 font-medium">{waypoints.length} 个</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Run;