import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  Play, 
  Square, 
  Volume2, 
  VolumeX, 
  Clock, 
  MapPin, 
  Route as RouteIcon,
  AlertTriangle,
  CheckCircle,
  Loader
} from 'lucide-react';
import { 
  RouteNavigatorProps, 
  RouteData, 
  NavigationStep, 
  VoiceNavigationConfig,
  RoutePlanRequest 
} from '../../types/navigation';
import { voiceNavigationService } from '../../services/VoiceNavigationService';
import { VoiceNavigationControl } from './VoiceNavigationControl';

export const RouteNavigator: React.FC<RouteNavigatorProps> = ({
  waypoints,
  onRouteGenerated,
  onNavigationStart,
  isNavigating,
  voiceConfig = {
    enabled: true,
    language: 'zh-CN',
    voice: 'female',
    volume: 0.8,
    rate: 1.0,
    pitch: 1.0,
    announceDistance: 50,
    repeatInterval: 30
  },
  onVoiceConfigChange
}) => {
  const [isPlanning, setIsPlanning] = useState(false);
  const [planningError, setPlanningError] = useState<string | null>(null);
  const [currentRoute, setCurrentRoute] = useState<RouteData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [localVoiceConfig, setLocalVoiceConfig] = useState<VoiceNavigationConfig>(voiceConfig);

  // 更新语音配置
  const updateVoiceConfig = (updates: Partial<VoiceNavigationConfig>) => {
    const newConfig = { ...localVoiceConfig, ...updates };
    setLocalVoiceConfig(newConfig);
    voiceNavigationService.updateConfig(newConfig);
    onVoiceConfigChange?.(newConfig);
  };

  // 路线规划
  const planRoute = async () => {
    if (waypoints.length < 2) {
      setPlanningError('请至少添加2个途径点');
      return;
    }

    setIsPlanning(true);
    setPlanningError(null);

    try {
      // 动态导入RouteService（稍后创建）
      const { RouteService } = await import('../../services/navigation/RouteService');
      
      const request: RoutePlanRequest = {
        waypoints,
        strategy: 'fastest',
        walkingSpeed: 1.2, // 1.2 m/s 平均步行速度
        maxDetourDistance: 500
      };

      const response = await RouteService.planWalkingRoute(request);
      
      if (response.success && response.route) {
        setCurrentRoute(response.route);
        setCurrentStep(0);
        onRouteGenerated(response.route);
      } else {
        throw new Error(response.error?.message || '路线规划失败');
      }
    } catch (error) {
      console.error('路线规划失败:', error);
      setPlanningError(error instanceof Error ? error.message : '路线规划失败，请检查网络连接');
    } finally {
      setIsPlanning(false);
    }
  };

  // 初始化语音服务
  useEffect(() => {
    const initVoice = async () => {
      try {
        await voiceNavigationService.initialize();
        voiceNavigationService.updateConfig(localVoiceConfig);
      } catch (error) {
        console.error('语音服务初始化失败:', error);
      }
    };
    
    initVoice();
  }, []);

  // 开始导航
  const startNavigation = () => {
    if (!currentRoute) {
      setPlanningError('请先规划路线');
      return;
    }
    
    setCurrentStep(0);
    onNavigationStart();
    
    // 播放开始导航语音
    if (localVoiceConfig.enabled) {
      voiceNavigationService.announceProgress(
        currentRoute.totalDistance,
        currentRoute.totalDuration
      );
    }
  };

  // 格式化时间
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  // 格式化距离
  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}公里`;
    }
    return `${Math.round(meters)}米`;
  };

  // 获取路线统计信息
  const getRouteStats = () => {
    if (!currentRoute) return null;
    
    return {
      totalDistance: formatDistance(currentRoute.totalDistance),
      totalDuration: formatDuration(currentRoute.totalDuration),
      stepCount: currentRoute.steps.length,
      segmentCount: currentRoute.segments.length
    };
  };

  const routeStats = getRouteStats();

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Navigation className="w-5 h-5 mr-2 text-green-600" />
          路线导航
        </h3>
        
        {/* 语音控制 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => updateVoiceConfig({ enabled: !localVoiceConfig.enabled })}
            className={`p-2 rounded-full transition-colors ${
              localVoiceConfig.enabled 
                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
            title={localVoiceConfig.enabled ? '关闭语音' : '开启语音'}
          >
            {localVoiceConfig.enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {planningError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
            <span className="text-sm text-red-700">{planningError}</span>
            <button
              onClick={() => setPlanningError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 主要操作按钮 */}
      <div className="space-y-3 mb-4">
        <button
          onClick={planRoute}
          disabled={isPlanning || waypoints.length < 2}
          className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isPlanning ? (
            <>
              <Loader className="animate-spin w-4 h-4 mr-2" />
              规划中...
            </>
          ) : (
            <>
              <RouteIcon className="w-4 h-4 mr-2" />
              {currentRoute ? '重新规划' : '开始规划'}
            </>
          )}
        </button>

        {currentRoute && !isNavigating && (
          <button
            onClick={startNavigation}
            className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Play className="w-4 h-4 mr-2" />
            开始导航
          </button>
        )}

        {isNavigating && (
          <button
            onClick={() => {/* 停止导航逻辑 */}}
            className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Square className="w-4 h-4 mr-2" />
            停止导航
          </button>
        )}
      </div>

      {/* 路线统计信息 */}
      {routeStats && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 text-blue-600 mr-1" />
              <span className="text-gray-600">总距离:</span>
              <span className="ml-1 font-medium">{routeStats.totalDistance}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 text-blue-600 mr-1" />
              <span className="text-gray-600">预计时间:</span>
              <span className="ml-1 font-medium">{routeStats.totalDuration}</span>
            </div>
            <div className="flex items-center">
              <RouteIcon className="w-4 h-4 text-blue-600 mr-1" />
              <span className="text-gray-600">导航步骤:</span>
              <span className="ml-1 font-medium">{routeStats.stepCount}步</span>
            </div>
            <div className="flex items-center">
              <Navigation className="w-4 h-4 text-blue-600 mr-1" />
              <span className="text-gray-600">路线段:</span>
              <span className="ml-1 font-medium">{routeStats.segmentCount}段</span>
            </div>
          </div>
        </div>
      )}

      {/* 导航步骤列表 */}
      {currentRoute && currentRoute.steps.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3 flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            导航指令 ({currentRoute.steps.length}步)
          </h4>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {currentRoute.steps.map((step, index) => (
              <div
                key={step.id}
                className={`p-3 rounded-md text-sm transition-colors ${
                  index === currentStep 
                    ? 'bg-blue-100 border-l-4 border-blue-500' 
                    : index < currentStep
                    ? 'bg-green-50 border-l-4 border-green-500'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium mr-2 ${
                        index === currentStep 
                          ? 'bg-blue-500 text-white' 
                          : index < currentStep
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="font-medium">{step.instruction}</span>
                    </div>
                    
                    {step.road && (
                      <div className="text-xs text-gray-500 ml-7">
                        道路: {step.road}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 ml-7 mt-1">
                      {formatDistance(step.distance)} · {formatDuration(step.duration)}
                    </div>
                  </div>
                  
                  {index === currentStep && isNavigating && (
                    <button
                      onClick={() => voiceNavigationService.announceNavigation(step.instruction)}
                      className="ml-2 p-1 text-blue-600 hover:bg-blue-100 rounded"
                      title="重复播报"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 语音导航控制面板 */}
      <VoiceNavigationControl
        config={localVoiceConfig}
        onConfigChange={updateVoiceConfig}
        className="mt-4"
      />

      {/* 空状态 */}
      {waypoints.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <Navigation className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">请先添加途径点</p>
        </div>
      )}
    </div>
  );
};