import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocationTracking } from './useLocationTracking';
import { safetyAnalysisService, RouteSafetyAnalysis, TimeSlotSafetyData } from '../services/safetyAnalysisService';
import { SafetyScore } from '../utils/safetyAlgorithm';
import type { 
  RealtimeLocation, 
  LocationHistory,
  TimeSlot,
  EnvironmentalData
} from '../types';

export interface UseSafetyAnalysisReturn {
  // 实时安全评估
  currentSafetyScore: SafetyScore | null;
  isAnalyzing: boolean;
  
  // 路线安全分析
  routeAnalysis: RouteSafetyAnalysis | null;
  analyzeRoute: (locations: RealtimeLocation[]) => Promise<void>;
  
  // 时间段分析
  timeSlotAnalysis: TimeSlotSafetyData[];
  analyzeTimeSlots: () => Promise<void>;
  
  // 安全建议
  safetyRecommendations: string[];
  
  // 风险热点
  riskHotspots: RouteSafetyAnalysis['riskHotspots'];
  
  // 最佳跑步时间
  bestRunningTimes: Array<{
    timeSlot: TimeSlot;
    safetyScore: number;
    description: string;
  }>;
  
  // 错误处理
  error: string | null;
  clearError: () => void;
  
  // 手动刷新
  refreshAnalysis: () => Promise<void>;
}

export const useSafetyAnalysis = (
  environmentalData?: EnvironmentalData,
  autoRefreshInterval?: number
): UseSafetyAnalysisReturn => {
  const { location: currentLocation, locationHistory } = useLocationTracking();
  
  // 状态管理
  const [currentSafetyScore, setCurrentSafetyScore] = useState<SafetyScore | null>(null);
  const [routeAnalysis, setRouteAnalysis] = useState<RouteSafetyAnalysis | null>(null);
  const [timeSlotAnalysis, setTimeSlotAnalysis] = useState<TimeSlotSafetyData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 计算衍生状态
  const safetyRecommendations = useMemo(() => {
    if (!routeAnalysis) return [];
    return routeAnalysis.recommendations;
  }, [routeAnalysis]);

  const riskHotspots = useMemo(() => {
    if (!routeAnalysis) return [];
    return routeAnalysis.riskHotspots;
  }, [routeAnalysis]);

  const bestRunningTimes = useMemo(() => {
    if (timeSlotAnalysis.length === 0) return [];
    
    return timeSlotAnalysis
      .sort((a, b) => b.safetyScore - a.safetyScore)
      .slice(0, 3)
      .map(data => ({
        timeSlot: data.timeSlot,
        safetyScore: data.safetyScore,
        description: getTimeSlotDescription(data.timeSlot, data.safetyScore)
      }));
  }, [timeSlotAnalysis]);

  // 获取实时安全评估
  const updateCurrentSafetyScore = useCallback(async () => {
    if (!currentLocation) return;

    try {
      setIsAnalyzing(true);
      setError(null);
      
      const safetyScore = safetyAnalysisService.getRealTimeSafetyAssessment(
        currentLocation,
        environmentalData
      );
      
      setCurrentSafetyScore(safetyScore);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取安全评估失败');
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentLocation, environmentalData]);

  // 分析路线安全性
  const analyzeRoute = useCallback(async (locations: RealtimeLocation[]) => {
    if (locations.length === 0) {
      setError('路线数据不能为空');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      
      // 模拟事件数据（实际应用中应从数据库获取）
      const mockIncidentData = generateMockIncidentData();
      
      const analysis = safetyAnalysisService.analyzeRouteSafety(
        locations,
        convertLocationHistoryToRealtimeLocation(locationHistory),
        mockIncidentData
      );
      
      setRouteAnalysis(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : '路线安全分析失败');
    } finally {
      setIsAnalyzing(false);
    }
  }, [locationHistory]);

  // 分析时间段安全性
  const analyzeTimeSlots = useCallback(async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      
      const timeSlots: TimeSlot[] = [
        'early_morning', 'morning', 'late_morning', 'afternoon', 
        'evening', 'night', 'late_night'
      ];
      
      const mockIncidentData = generateMockIncidentData();
      
      const analysis = timeSlots.map(timeSlot => 
        safetyAnalysisService.analyzeTimeSlotSafety(
          timeSlot,
          convertLocationHistoryToRealtimeLocation(locationHistory),
          mockIncidentData
        )
      );
      
      setTimeSlotAnalysis(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : '时间段安全分析失败');
    } finally {
      setIsAnalyzing(false);
    }
  }, [locationHistory]);

  // 刷新所有分析
  const refreshAnalysis = useCallback(async () => {
    await Promise.all([
      updateCurrentSafetyScore(),
      analyzeTimeSlots(),
      locationHistory.length > 0 ? analyzeRoute(convertLocationHistoryToRealtimeLocation(locationHistory)) : Promise.resolve()
    ]);
  }, [updateCurrentSafetyScore, analyzeTimeSlots, analyzeRoute, locationHistory]);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 自动更新实时安全评估
  useEffect(() => {
    updateCurrentSafetyScore();
  }, [updateCurrentSafetyScore]);

  // 自动分析时间段（初始化时）
  useEffect(() => {
    analyzeTimeSlots();
  }, []);

  // 自动刷新
  useEffect(() => {
    if (!autoRefreshInterval) return;

    const interval = setInterval(refreshAnalysis, autoRefreshInterval);
    return () => clearInterval(interval);
  }, [refreshAnalysis, autoRefreshInterval]);

  // 当位置历史变化时自动分析路线
  useEffect(() => {
    if (locationHistory.length >= 5) {
      analyzeRoute(convertLocationHistoryToRealtimeLocation(locationHistory));
    }
  }, [locationHistory, analyzeRoute]);

  return {
    // 实时安全评估
    currentSafetyScore,
    isAnalyzing,
    
    // 路线安全分析
    routeAnalysis,
    analyzeRoute,
    
    // 时间段分析
    timeSlotAnalysis,
    analyzeTimeSlots,
    
    // 安全建议
    safetyRecommendations,
    
    // 风险热点
    riskHotspots,
    
    // 最佳跑步时间
    bestRunningTimes,
    
    // 错误处理
    error,
    clearError,
    
    // 手动刷新
    refreshAnalysis
  };
};

// 辅助函数
function convertLocationHistoryToRealtimeLocation(locationHistory: LocationHistory[]): RealtimeLocation[] {
  return locationHistory.map(location => ({
    latitude: location.latitude,
    longitude: location.longitude,
    altitude: location.altitude,
    accuracy: location.accuracy,
    speed: location.speed,
    heading: location.heading,
    timestamp: new Date(location.recorded_at)
  }));
}

function getTimeSlotDescription(timeSlot: TimeSlot, safetyScore: number): string {
  const timeNames = {
    'early_morning': '清晨（5-7点）',
    'morning': '上午（7-10点）',
    'late_morning': '上午晚些（10-12点）',
    'afternoon': '下午（12-17点）',
    'evening': '傍晚（17-20点）',
    'night': '夜晚（20-23点）',
    'late_night': '深夜（23-5点）'
  };

  const safetyLevel = safetyScore >= 80 ? '非常安全' : 
                    safetyScore >= 60 ? '较安全' : 
                    safetyScore >= 40 ? '一般' : '需谨慎';

  return `${timeNames[timeSlot]} - ${safetyLevel}（${safetyScore.toFixed(1)}分）`;
}

function generateMockIncidentData() {
  // 模拟事件数据，实际应用中应从数据库获取
  return [
    {
      timeSlot: 'night' as TimeSlot,
      location: { latitude: 31.2304, longitude: 121.4737, timestamp: new Date() } as RealtimeLocation,
      type: 'harassment'
    },
    {
      timeSlot: 'late_night' as TimeSlot,
      location: { latitude: 31.2204, longitude: 121.4637, timestamp: new Date() } as RealtimeLocation,
      type: 'theft'
    },
    {
      timeSlot: 'evening' as TimeSlot,
      location: { latitude: 31.2404, longitude: 121.4837, timestamp: new Date() } as RealtimeLocation,
      type: 'accident'
    }
  ];
}