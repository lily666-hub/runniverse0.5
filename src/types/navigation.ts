// 智能导航相关类型定义

// 途径点类型
export interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  desc: string;
  order: number;
  elevation?: number;
  safetyScore?: number;
  category?: 'start' | 'waypoint' | 'end' | 'landmark';
  amenities?: string[];
  estimatedArrivalTime?: number;
}

// 导航步骤类型
export interface NavigationStep {
  id: string;
  instruction: string;
  distance: number;
  duration: number;
  polyline: string;
  action?: 'straight' | 'turn_left' | 'turn_right' | 'u_turn' | 'arrive';
  road?: string;
  orientation?: string;
  assistantAction?: string;
}

// 路线段类型
export interface RouteSegment {
  origin: Waypoint;
  destination: Waypoint;
  distance: number;
  duration: number;
  polyline: string;
  steps: NavigationStep[];
  trafficStatus?: 'smooth' | 'slow' | 'congested' | 'severe';
  safetyLevel?: 'high' | 'medium' | 'low';
}

// 完整路线数据类型
export interface RouteData {
  segments: RouteSegment[];
  steps: NavigationStep[];
  totalDistance: number;
  totalDuration: number;
  polyline: string;
  bounds?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
  createdAt?: string;
  routeId?: string;
}

// 导航状态类型
export interface NavigationState {
  isNavigating: boolean;
  currentStepIndex: number;
  currentSegmentIndex: number;
  distanceToNextStep: number;
  estimatedTimeToDestination: number;
  currentInstruction: string;
  nextInstruction?: string;
  progress: number; // 0-100
  deviationDistance?: number;
  isOffRoute?: boolean;
}

// GPS位置类型
export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

// 语音导航配置类型
export interface VoiceNavigationConfig {
  enabled: boolean;
  language: 'zh-CN' | 'en-US';
  voice: 'male' | 'female';
  volume: number; // 0-1
  rate: number; // 0.1-10
  pitch: number; // 0-2
  announceDistance: number; // 提前播报距离（米）
  repeatInterval: number; // 重复播报间隔（秒）
}

// 导航事件类型
export interface NavigationEvent {
  type: 'step_start' | 'step_complete' | 'route_deviation' | 'arrival' | 'reroute';
  timestamp: number;
  data: any;
  stepIndex?: number;
  segmentIndex?: number;
  position?: GPSPosition;
}

// 路线规划请求类型
export interface RoutePlanRequest {
  waypoints: Waypoint[];
  strategy?: 'fastest' | 'shortest' | 'safest' | 'scenic';
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  walkingSpeed?: number; // 步行速度 m/s
  maxDetourDistance?: number; // 最大绕行距离
}

// 路线规划响应类型
export interface RoutePlanResponse {
  success: boolean;
  route?: RouteData;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  alternatives?: RouteData[];
  metadata?: {
    requestId: string;
    processingTime: number;
    apiProvider: string;
    cacheHit: boolean;
  };
}

// CSV导入数据类型
export interface CSVWaypointData {
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  category?: string;
}

// 地图点击事件类型
export interface MapClickEvent {
  lat: number;
  lng: number;
  pixel?: { x: number; y: number };
  target?: any;
}

// 导航模式类型
export type NavigationMode = 'free' | 'guided';

// 跑步模式类型
export type RunningMode = 'free_running' | 'navigation_running';

// 导航精度等级
export type NavigationAccuracy = 'high' | 'medium' | 'low';

// 路线优化选项
export interface RouteOptimizationOptions {
  optimizeForDistance?: boolean;
  optimizeForSafety?: boolean;
  optimizeForScenery?: boolean;
  avoidBusyRoads?: boolean;
  preferParks?: boolean;
  maxElevationGain?: number;
}

// 实时导航更新数据
export interface NavigationUpdate {
  position: GPSPosition;
  navigationState: NavigationState;
  routeProgress: {
    completedDistance: number;
    remainingDistance: number;
    completedTime: number;
    estimatedRemainingTime: number;
  };
  nextManeuver?: {
    instruction: string;
    distance: number;
    icon?: string;
  };
  alerts?: NavigationAlert[];
}

// 导航警告类型
export interface NavigationAlert {
  id: string;
  type: 'route_deviation' | 'speed_limit' | 'safety_warning' | 'traffic_alert';
  severity: 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
  position?: GPSPosition;
  autoHide?: boolean;
  duration?: number;
}

// 导航统计数据
export interface NavigationStats {
  totalDistance: number;
  totalTime: number;
  averageSpeed: number;
  maxSpeed: number;
  routeDeviations: number;
  waypointsReached: number;
  totalWaypoints: number;
  accuracyStats: {
    averageAccuracy: number;
    minAccuracy: number;
    maxAccuracy: number;
  };
}

// 导航会话类型
export interface NavigationSession {
  id: string;
  userId: string;
  route: RouteData;
  startTime: number;
  endTime?: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  currentPosition?: GPSPosition;
  navigationState: NavigationState;
  events: NavigationEvent[];
  stats?: NavigationStats;
  voiceConfig: VoiceNavigationConfig;
}

// 高德地图API响应类型
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
        road: string;
        distance: string;
        duration: string;
        polyline: string;
        action: string;
        assistant_action: string;
      }>;
    }>;
  };
}

// 地图标记类型
export interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  title: string;
  content?: string;
  icon?: string;
  type: 'waypoint' | 'current_position' | 'destination' | 'poi';
  order?: number;
  draggable?: boolean;
  visible?: boolean;
}

// 地图折线类型
export interface MapPolyline {
  id: string;
  path: Array<{ lat: number; lng: number }>;
  strokeColor: string;
  strokeWeight: number;
  strokeOpacity: number;
  strokeStyle: 'solid' | 'dashed';
  visible?: boolean;
}

// 地图配置类型
export interface MapConfig {
  center: { lat: number; lng: number };
  zoom: number;
  mapStyle?: string;
  showTraffic?: boolean;
  showSatellite?: boolean;
  enableScrollWheelZoom?: boolean;
  enableDoubleClickZoom?: boolean;
  enableKeyboard?: boolean;
  enableDragging?: boolean;
}

// 导航组件属性类型
export interface WaypointManagerProps {
  waypoints: Waypoint[];
  onWaypointsChange: (waypoints: Waypoint[]) => void;
  onMapClick?: (position: { lat: number; lng: number }) => void;
  maxWaypoints?: number;
  allowReorder?: boolean;
  showUpload?: boolean;
  showSamples?: boolean;
}

export interface RouteNavigatorProps {
  waypoints: Waypoint[];
  onRouteGenerated: (route: RouteData) => void;
  onNavigationStart: () => void;
  isNavigating: boolean;
  voiceConfig?: VoiceNavigationConfig;
  onVoiceConfigChange?: (config: VoiceNavigationConfig) => void;
}

export interface EnhancedRunningMapProps {
  waypoints: Waypoint[];
  route: RouteData | null;
  currentPosition: GPSPosition | null;
  onMapClick: (position: { lat: number; lng: number }) => void;
  showNavigation: boolean;
  navigationState?: NavigationState;
  mapConfig?: MapConfig;
  markers?: MapMarker[];
  polylines?: MapPolyline[];
}