/**
 * 智能跑步导航地图组件类型定义
 * 基于原有5.0.html功能和useGPS hook接口设计
 */

import React from 'react';

// 基础位置类型
export interface Position {
  lat: number;
  lng: number;
  accuracy?: number;
}

// 基础途径点类型
export interface Waypoint {
  id: string;
  name: string;
  description?: string;
  lat: number;
  lng: number;
  type?: string;
}

// GPS位置数据接口（与useGPS hook兼容）
export interface GPSPosition {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

// 途径点数据接口
export interface WaypointData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  desc?: string;
  type?: 'start' | 'waypoint' | 'end';
  safetyScore?: number; // 安全评分 1-10
  sceneryScore?: number; // 景观评分 1-10
  facilities?: string[]; // 设施信息
  marker?: any; // 地图标记对象
}

// 导航指令接口
export interface NavigationInstruction {
  id: string;
  text: string; // 导航文本
  distance: number; // 到下一个指令的距离（米）
  duration: number; // 到下一个指令的时间（秒）
  direction: string; // 方向指示
  coordinates: [number, number]; // 指令位置坐标 [lng, lat]
  sequence: number; // 指令序号
}

// 路线数据接口
export interface RouteData {
  id: string;
  name?: string;
  waypoints: WaypointData[];
  path: [number, number][]; // 路线坐标数组 [[lng, lat], ...]
  distance: number; // 总距离（米）
  duration: number; // 预计时间（秒）
  instructions: NavigationInstruction[]; // 导航指令数组
  polyline?: string; // 路线编码字符串
  difficulty?: 'easy' | 'moderate' | 'hard'; // 难度等级
  safetyRating?: number; // 安全评分
  sceneryRating?: number; // 景观评分
}

// 地图配置接口
export interface MapConfig {
  apiKey: string;
  restApiKey: string;
  version: string;
  plugins: string[];
  center: [number, number]; // [lng, lat]
  zoom: number;
  mapStyle: 'normal' | 'satellite' | 'dark';
  enableHighAccuracy?: boolean;
  trackingInterval?: number;
}

// 地图模式枚举
export type MapMode = 'planning' | 'navigation' | 'tracking' | 'debug';

// GPS信号质量枚举
export type GPSSignalQuality = 'excellent' | 'good' | 'medium' | 'fair' | 'poor' | 'unknown';

// 地图事件接口
export interface MapEvents {
  onRouteGenerated?: (route: RouteData) => void;
  onLocationUpdate?: (location: GPSPosition) => void;
  onWaypointAdded?: (waypoint: WaypointData) => void;
  onWaypointRemoved?: (waypointId: string) => void;
  onNavigationStart?: (route: RouteData) => void;
  onNavigationEnd?: () => void;
  onError?: (error: MapError) => void;
}

// 地图错误接口
export interface MapError {
  code: string;
  message: string;
  type: 'GPS_ERROR' | 'MAP_ERROR' | 'ROUTE_ERROR' | 'NETWORK_ERROR';
  details?: any;
}

// 智能地图组件属性接口
export interface IntelligentRunningMapProps {
  // 基础配置
  mode?: MapMode;
  waypoints?: WaypointData[];
  initialCenter?: [number, number];
  initialZoom?: number;
  center?: { lat: number; lng: number }; // 地图中心点
  zoom?: number; // 地图缩放级别
  
  // 功能开关
  enableRealTimeTracking?: boolean;
  enableVoiceNavigation?: boolean;
  enableRouteOptimization?: boolean;
  enableSafetyAnalysis?: boolean;
  
  // 样式配置
  height?: string | number;
  width?: string | number;
  className?: string;
  style?: React.CSSProperties;
  
  // 事件回调
  onRouteGenerated?: (route: RouteData) => void;
  onRouteCalculated?: (route: RouteData) => void; // 路线计算完成回调
  onLocationUpdate?: (location: GPSPosition) => void;
  onPositionUpdate?: (position: GPSPosition) => void; // 位置更新回调
  onWaypointAdded?: (waypoint: WaypointData) => void;
  onWaypointRemoved?: (waypointId: string) => void;
  onNavigationStart?: (route: RouteData) => void;
  onNavigationStarted?: (route: RouteData) => void; // 导航开始回调
  onNavigationEnd?: () => void;
  onNavigationCompleted?: () => void; // 导航完成回调
  onTrackingStarted?: (config?: TrackingConfig) => void; // 追踪开始回调
  onTrackingStopped?: () => void; // 追踪停止回调
  onInstructionChanged?: (instruction: NavigationInstruction) => void; // 导航指令变化回调
  onError?: (error: MapError) => void;
  
  // 高级配置
  minWaypoints?: number; // 最少途径点数量
  maxWaypoints?: number; // 最多途径点数量
  routeType?: 'walking' | 'running' | 'cycling';
  avoidTraffic?: boolean;
  preferSafeRoutes?: boolean;
  config?: Partial<MapConfig>; // 地图配置
  mapConfig?: any; // 地图特定配置
  voiceConfig?: Partial<VoiceNavigationConfig>; // 语音导航配置
}

// 路线规划选项接口
export interface RoutePlanningOptions {
  waypoints: WaypointData[];
  routeType: 'walking' | 'running' | 'cycling';
  avoidTraffic?: boolean;
  preferSafeRoutes?: boolean;
  optimizeOrder?: boolean; // 是否优化途径点顺序
}

// 路线规划结果接口
export interface RoutePlanningResult {
  success: boolean;
  route?: RouteData;
  error?: MapError;
  alternatives?: RouteData[]; // 备选路线
}

// 实时追踪配置接口
export interface TrackingConfig {
  interval: number; // 位置更新间隔（毫秒）
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  minDistance: number; // 最小移动距离（米）
  enableVoiceGuidance: boolean;
}

// 实时追踪状态接口
export interface TrackingStatus {
  isActive: boolean;
  currentPosition?: GPSPosition;
  totalDistance: number;
  totalDuration: number;
  averageSpeed: number;
  currentInstruction?: NavigationInstruction;
  nextInstruction?: NavigationInstruction;
  remainingDistance: number;
  estimatedTimeToDestination: number;
}

// 语音导航配置接口
export interface VoiceNavigationConfig {
  enabled: boolean;
  language: string;
  rate: number; // 语速
  volume: number; // 音量
  pitch?: number; // 音调
  voice?: SpeechSynthesisVoice; // 语音
  announceDistance: number; // 提前播报距离（米）
  repeatInterval?: number; // 重复播报间隔（秒）
}

// 地图服务接口
export interface IIntelligentMapService {
  // 初始化
  initialize(container: HTMLElement, config: MapConfig): Promise<void>;
  destroy(): void;
  
  // 地图操作
  setCenter(center: [number, number]): void;
  setZoom(zoom: number): void;
  fitView(points?: [number, number][]): void;
  
  // 途径点管理
  addWaypoint(waypoint: WaypointData): void;
  removeWaypoint(waypointId: string): void;
  updateWaypoint(waypointId: string, updates: Partial<WaypointData>): void;
  clearWaypoints(): void;
  getWaypoints(): WaypointData[];
  
  // 路线规划
  planRoute(options: RoutePlanningOptions): Promise<RoutePlanningResult>;
  drawRoute(route: RouteData): void;
  clearRoute(): void;
  
  // 实时追踪
  startTracking(config: TrackingConfig): void;
  stopTracking(): void;
  updateCurrentPosition(position: GPSPosition): void;
  getTrackingStatus(): TrackingStatus;
  
  // 导航功能
  startNavigation(route: RouteData): void;
  stopNavigation(): void;
  getCurrentInstruction(): NavigationInstruction | null;
  getNextInstruction(): NavigationInstruction | null;
  
  // 事件监听
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
  emit(event: string, data?: any): void;
}

// 高德地图API类型扩展
declare global {
  interface Window {
    AMap: {
      Map: any;
      Marker: any;
      Polyline: any;
      Geolocation: any;
      Walking: any;
      Scale: any;
      ToolBar: any;
      version?: string;
      [key: string]: any;
    };
  }
}

// 高德地图REST API响应类型
export interface AmapWalkingResponse {
  status: string;
  info: string;
  infocode: string;
  count: string;
  route: {
    origin: string;
    destination: string;
    paths: Array<{
      distance: string;
      duration: string;
      steps: Array<{
        instruction: string;
        orientation: string;
        distance: string;
        duration: string;
        polyline: string;
        action: string;
        assistant_action: string;
      }>;
    }>;
  };
}

// CSV文件解析结果接口
export interface CSVParseResult {
  success: boolean;
  waypoints: WaypointData[];
  errors: string[];
}

// 地图工具函数类型
export interface MapUtils {
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number;
  calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number;
  formatDistance(distance: number): string;
  formatDuration(duration: number): string;
  parseCSV(csvText: string): CSVParseResult;
  generateWaypointId(): string;
  validateWaypoint(waypoint: Partial<WaypointData>): boolean;
}

// 安全分析接口
export interface SafetyAnalysis {
  overallScore: number; // 总体安全评分 1-10
  timeOfDayScore: number; // 时间段安全评分
  lightingScore: number; // 照明条件评分
  crowdDensityScore: number; // 人流密度评分
  crimeRateScore: number; // 犯罪率评分
  recommendations: string[]; // 安全建议
  warnings: string[]; // 安全警告
}

// 路线优化选项接口
export interface RouteOptimizationOptions {
  prioritizeSafety: boolean; // 优先考虑安全性
  prioritizeScenery: boolean; // 优先考虑景观
  prioritizeDistance: boolean; // 优先考虑距离
  avoidBusyRoads: boolean; // 避开繁忙道路
  preferParks: boolean; // 偏好公园路线
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'; // 时间段
}

// IntelligentRunningMap 组件 ref 接口
export interface IntelligentRunningMapRef {
  // 地图操作方法
  addWaypoint: (waypoint: WaypointData) => void;
  removeWaypoint: (waypointId: string) => void;
  clearWaypoints: () => void;
  planRoute: () => Promise<RouteData | null>;
  generateRoute: () => Promise<RouteData | null>; // 添加 generateRoute 方法
  startNavigation: () => void;
  stopNavigation: () => void;
  startTracking: () => void;
  stopTracking: () => void;
  getCurrentPosition: () => GPSPosition | null;
  getWaypoints: () => WaypointData[];
  getCurrentRoute: () => RouteData | null;
  getTrackingStatus: () => TrackingStatus;
  
  // 地图视图操作
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  fitView: (points?: [number, number][]) => void;
  
  // 状态查询
  isMapReady: () => boolean;
  isNavigating: () => boolean;
  isTracking: () => boolean;
}

// 所有类型已在上面单独导出，无需重复导出