/**
 * GPS与AI智能体功能深度整合的统一类型定义
 */

import type { GPSPosition } from './gps';
import type { AIContext, AIResponse } from './ai';

// ==================== 基础数据类型 ====================

export interface GPSData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

export interface AIContextData {
  userPreferences: UserPreferences;
  environmentalFactors: EnvironmentalFactors;
  historicalData: HistoricalData;
  currentActivity: ActivityContext;
  timestamp: number;
}

export interface FusedData {
  gps: GPSData;
  ai: AIContextData;
  insights: AIInsights;
  predictions: Predictions;
  recommendations: string[];
  confidence: number;
  timestamp: number;
}

// ==================== 用户偏好和上下文 ====================

export interface UserPreferences {
  preferredDistance: number;
  preferredDifficulty: 'easy' | 'medium' | 'hard';
  avoidBusyRoads: boolean;
  preferParks: boolean;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  weatherPreference: string[];
  safetyPriority: 'low' | 'medium' | 'high';
}

export interface EnvironmentalFactors {
  weather: WeatherData;
  airQuality: AirQualityData;
  trafficLevel: 'low' | 'medium' | 'high';
  crowdDensity: 'low' | 'medium' | 'high';
  lightingCondition: 'bright' | 'dim' | 'dark';
  noiseLevel: number;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  condition: string;
  uvIndex: number;
}

export interface AirQualityData {
  aqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
}

export interface HistoricalData {
  previousRoutes: RouteHistory[];
  performanceMetrics: PerformanceMetrics;
  preferences: UserPreferences;
  incidents: SafetyIncident[];
}

export interface ActivityContext {
  activityType: 'running' | 'walking' | 'cycling';
  intensity: 'low' | 'medium' | 'high';
  duration: number;
  startTime: number;
  currentPhase: 'warmup' | 'active' | 'cooldown' | 'rest';
}

// ==================== AI洞察和预测 ====================

export interface AIInsights {
  routeOptimization: RouteOptimization;
  safetyAnalysis: SafetyAnalysis;
  performancePrediction: PerformancePrediction;
  recommendations: string[];
  warnings: Warning[];
}

export interface RouteOptimization {
  suggestedAdjustments: RouteAdjustment[];
  alternativeRoutes: AlternativeRoute[];
  trafficAvoidance: TrafficAvoidance;
  scenicEnhancements: ScenicEnhancement[];
}

export interface SafetyAnalysis {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  safetyScore: number;
  recommendations: SafetyRecommendation[];
  emergencyContacts: EmergencyContact[];
}

export interface PerformancePrediction {
  estimatedTime: number;
  estimatedCalories: number;
  difficultyScore: number;
  fatigueLevel: number;
  hydrationNeeds: number;
  restRecommendations: RestRecommendation[];
}

export interface Predictions {
  routeCompletion: RoutePrediction;
  weatherChanges: WeatherPrediction[];
  trafficChanges: TrafficPrediction[];
  safetyRisks: SafetyRiskPrediction[];
}

// ==================== 路线和导航 ====================

export interface RouteData {
  id: string;
  name: string;
  waypoints: WaypointData[];
  distance: number;
  estimatedTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  elevation: ElevationData;
  surface: SurfaceType[];
  amenities: Amenity[];
  safetyRating: number;
  createdAt: number;
  updatedAt: number;
}

export interface WaypointData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'start' | 'waypoint' | 'end' | 'poi' | 'rest' | 'emergency';
  desc?: string;
  amenities?: string[];
  safetyFeatures?: string[];
}

export interface NavigationGuidance {
  instruction: string;
  distance: number;
  direction: 'straight' | 'left' | 'right' | 'u-turn';
  landmark?: string;
  estimatedTime: number;
  voicePrompt: string;
  visualCue?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface SmartNavigationData {
  currentGuidance: NavigationGuidance;
  nextGuidance?: NavigationGuidance;
  routeProgress: RouteProgress;
  aiRecommendations: string[];
  safetyAlerts: SafetyAlert[];
  performanceMetrics: RealTimeMetrics;
}

// ==================== 安全和紧急响应 ====================

export interface SafetyAlert {
  id: string;
  type: 'traffic' | 'weather' | 'crime' | 'medical' | 'environmental';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: GPSData;
  message: string;
  recommendations: string[];
  timestamp: number;
  expiresAt?: number;
}

export interface EmergencyResponse {
  alertId: string;
  location: GPSData;
  emergencyType: 'medical' | 'safety' | 'accident' | 'lost';
  contactsNotified: EmergencyContact[];
  emergencyServices: EmergencyService[];
  instructions: string[];
  estimatedResponseTime: number;
  timestamp: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  priority: number;
  notified: boolean;
  notifiedAt?: number;
}

export interface EmergencyService {
  type: 'police' | 'medical' | 'fire' | 'rescue';
  phone: string;
  location: GPSData;
  estimatedArrival: number;
  contacted: boolean;
}

// ==================== 服务配置和选项 ====================

export interface UnifiedTrackingOptions {
  gpsOptions: GPSTrackingOptions;
  aiOptions: AITrackingOptions;
  fusionOptions?: FusionOptions;
}

export interface GPSTrackingOptions {
  enableHighAccuracy: boolean;
  updateInterval: number;
  timeout?: number;
  maximumAge?: number;
  distanceFilter?: number;
}

export interface AITrackingOptions {
  contextAwareness: boolean;
  realtimeAnalysis: boolean;
  predictiveMode: boolean;
  safetyMonitoring: boolean;
  performanceTracking: boolean;
}

export interface FusionOptions {
  gpsWeight: number;
  aiWeight: number;
  confidenceThreshold: number;
  updateFrequency: number;
  bufferSize: number;
}

// ==================== 智能导航会话 ====================

export interface SmartNavigationSession {
  id: string;
  route: RouteData;
  startTime: number;
  currentLocation: GPSData;
  progress: RouteProgress;
  guidance: NavigationGuidance[];
  aiAssistant: AIAssistantState;
  safetyMonitoring: SafetyMonitoringState;
  isActive: boolean;
}

export interface RouteProgress {
  distanceCovered: number;
  distanceRemaining: number;
  timeElapsed: number;
  estimatedTimeRemaining: number;
  currentWaypoint: number;
  completionPercentage: number;
}

export interface AIAssistantState {
  isActive: boolean;
  conversationHistory: ConversationMessage[];
  currentContext: AIContext;
  suggestions: string[];
  voiceEnabled: boolean;
}

export interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: any;
}

export interface SafetyMonitoringState {
  isActive: boolean;
  currentRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  activeAlerts: SafetyAlert[];
  emergencyContacts: EmergencyContact[];
  lastSafetyCheck: number;
}

// ==================== 性能和指标 ====================

export interface RealTimeMetrics {
  speed: number;
  pace: number;
  heartRate?: number;
  calories: number;
  distance: number;
  elevation: number;
  cadence?: number;
  timestamp: number;
}

export interface PerformanceMetrics {
  averageSpeed: number;
  maxSpeed: number;
  totalDistance: number;
  totalTime: number;
  caloriesBurned: number;
  elevationGain: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
}

// ==================== 辅助类型 ====================

export interface RouteHistory {
  routeId: string;
  completedAt: number;
  duration: number;
  distance: number;
  averageSpeed: number;
  rating: number;
  notes?: string;
}

export interface RouteAdjustment {
  type: 'detour' | 'shortcut' | 'scenic' | 'safety';
  description: string;
  impact: 'positive' | 'neutral' | 'negative';
  distanceChange: number;
  timeChange: number;
}

export interface AlternativeRoute {
  route: RouteData;
  reason: string;
  advantages: string[];
  disadvantages: string[];
  recommendation: 'highly_recommended' | 'recommended' | 'consider' | 'not_recommended';
}

export interface TrafficAvoidance {
  congestionAreas: CongestionArea[];
  alternativePaths: AlternativePath[];
  estimatedTimeSaving: number;
}

export interface CongestionArea {
  location: GPSData;
  radius: number;
  severity: 'light' | 'moderate' | 'heavy';
  estimatedDelay: number;
}

export interface AlternativePath {
  waypoints: WaypointData[];
  distanceChange: number;
  timeChange: number;
  description: string;
}

export interface ScenicEnhancement {
  location: GPSData;
  type: 'park' | 'waterfront' | 'historic' | 'viewpoint';
  description: string;
  detourDistance: number;
  detourTime: number;
}

export interface RiskFactor {
  type: 'traffic' | 'crime' | 'weather' | 'terrain' | 'lighting';
  severity: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string[];
}

export interface SafetyRecommendation {
  type: 'route' | 'timing' | 'equipment' | 'behavior';
  priority: 'low' | 'medium' | 'high';
  description: string;
  action: string;
}

export interface SafetyIncident {
  id: string;
  type: 'accident' | 'crime' | 'harassment' | 'medical';
  location: GPSData;
  description: string;
  severity: 'minor' | 'moderate' | 'severe';
  reportedAt: number;
  resolved: boolean;
}

export interface RestRecommendation {
  location: GPSData;
  type: 'hydration' | 'rest' | 'nutrition' | 'medical';
  urgency: 'low' | 'medium' | 'high';
  description: string;
  estimatedDuration: number;
}

export interface RoutePrediction {
  estimatedCompletionTime: number;
  probabilityOfCompletion: number;
  potentialChallenges: string[];
  recommendedAdjustments: string[];
}

export interface WeatherPrediction {
  timeframe: number;
  condition: string;
  temperature: number;
  precipitation: number;
  impact: 'positive' | 'neutral' | 'negative';
  recommendations: string[];
}

export interface TrafficPrediction {
  timeframe: number;
  congestionLevel: 'low' | 'medium' | 'high';
  affectedAreas: GPSData[];
  impact: 'minimal' | 'moderate' | 'significant';
  alternatives: string[];
}

export interface SafetyRiskPrediction {
  timeframe: number;
  riskType: 'crime' | 'accident' | 'weather' | 'medical';
  probability: number;
  severity: 'low' | 'medium' | 'high';
  preventiveMeasures: string[];
}

export interface ElevationData {
  gain: number;
  loss: number;
  maxElevation: number;
  minElevation: number;
  profile: ElevationPoint[];
}

export interface ElevationPoint {
  distance: number;
  elevation: number;
}

export interface SurfaceType {
  type: 'asphalt' | 'concrete' | 'dirt' | 'grass' | 'gravel' | 'track';
  percentage: number;
}

export interface Amenity {
  type: 'restroom' | 'water' | 'parking' | 'shelter' | 'medical' | 'food';
  location: GPSData;
  name: string;
  availability: '24/7' | 'business_hours' | 'seasonal';
}

export interface Warning {
  type: 'safety' | 'weather' | 'traffic' | 'route' | 'performance';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  action?: string;
  expiresAt?: number;
}

// ==================== 事件类型 ====================

export type UnifiedServiceEvent = 
  | 'unifiedDataUpdate'
  | 'safetyAlert'
  | 'gpsUpdate'
  | 'aiContextUpdate'
  | 'navigationUpdate'
  | 'emergencyTriggered'
  | 'routeOptimized'
  | 'performanceUpdate'
  | 'unifiedTrackingStarted'
  | 'unifiedTrackingStopped';

// ==================== 智能推荐类型 ====================

export interface SmartRouteRecommendation {
  route: RouteData;
  aiAnalysis: AIRouteAnalysis;
  safetyScore: number;
  personalizedScore: number;
  reasons: string[];
  alternatives: AlternativeRoute[];
  warnings: Warning[];
}

export interface AIRouteAnalysis {
  difficultyAssessment: DifficultyAssessment;
  safetyAssessment: SafetyAssessment;
  scenicValue: ScenicValue;
  trafficAnalysis: TrafficAnalysis;
  weatherImpact: WeatherImpact;
  personalizedFit: PersonalizedFit;
}

export interface DifficultyAssessment {
  overall: 'easy' | 'medium' | 'hard' | 'extreme';
  factors: DifficultyFactor[];
  score: number;
  recommendations: string[];
}

export interface DifficultyFactor {
  type: 'elevation' | 'distance' | 'surface' | 'weather' | 'traffic';
  impact: 'low' | 'medium' | 'high';
  description: string;
}

export interface SafetyAssessment {
  overall: number;
  factors: SafetyFactor[];
  timeOfDayImpact: TimeOfDayImpact;
  recommendations: SafetyRecommendation[];
}

export interface SafetyFactor {
  type: 'lighting' | 'crime' | 'traffic' | 'isolation' | 'emergency_access';
  score: number;
  description: string;
  mitigation: string[];
}

export interface TimeOfDayImpact {
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
  recommendations: { [key: string]: string[] };
}

export interface ScenicValue {
  score: number;
  highlights: ScenicHighlight[];
  photoOpportunities: PhotoOpportunity[];
  seasonalVariations: SeasonalVariation[];
}

export interface ScenicHighlight {
  location: GPSData;
  type: 'nature' | 'architecture' | 'water' | 'viewpoint' | 'cultural';
  description: string;
  rating: number;
}

export interface PhotoOpportunity {
  location: GPSData;
  description: string;
  bestTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface SeasonalVariation {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  score: number;
  highlights: string[];
  considerations: string[];
}

export interface TrafficAnalysis {
  currentLevel: 'low' | 'medium' | 'high';
  peakTimes: PeakTime[];
  alternativeTimings: AlternativeTiming[];
  avoidanceStrategies: AvoidanceStrategy[];
}

export interface PeakTime {
  startTime: string;
  endTime: string;
  level: 'medium' | 'high' | 'extreme';
  impact: string;
}

export interface AlternativeTiming {
  time: string;
  trafficLevel: 'low' | 'medium' | 'high';
  advantages: string[];
  considerations: string[];
}

export interface AvoidanceStrategy {
  type: 'timing' | 'route' | 'mode';
  description: string;
  effectiveness: number;
  tradeoffs: string[];
}

export interface WeatherImpact {
  current: WeatherConditionImpact;
  forecast: WeatherForecastImpact[];
  recommendations: WeatherRecommendation[];
}

export interface WeatherConditionImpact {
  condition: string;
  impact: 'positive' | 'neutral' | 'negative' | 'dangerous';
  score: number;
  considerations: string[];
}

export interface WeatherForecastImpact {
  timeframe: string;
  condition: string;
  impact: 'positive' | 'neutral' | 'negative' | 'dangerous';
  recommendations: string[];
}

export interface WeatherRecommendation {
  type: 'timing' | 'equipment' | 'route' | 'preparation';
  priority: 'low' | 'medium' | 'high';
  description: string;
  action: string;
}

export interface PersonalizedFit {
  score: number;
  matchingFactors: MatchingFactor[];
  improvements: Improvement[];
  adaptations: Adaptation[];
}

export interface MatchingFactor {
  type: 'distance' | 'difficulty' | 'scenery' | 'safety' | 'amenities';
  match: 'poor' | 'fair' | 'good' | 'excellent';
  description: string;
}

export interface Improvement {
  aspect: string;
  suggestion: string;
  impact: 'minor' | 'moderate' | 'significant';
}

export interface Adaptation {
  type: 'route' | 'timing' | 'preparation' | 'equipment';
  description: string;
  benefit: string;
}

// ==================== 组件Props类型 ====================

export interface SmartRunningMapProps {
  route?: RouteData | null;
  currentLocation?: GPSPosition | null;
  showAIInsights?: boolean;
  onLocationUpdate?: (location: GPSPosition) => void;
  onRouteSelect?: (route: RouteData) => void;
  waypoints?: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    address?: string;
    type?: string;
  }>;
  navigationRoute?: RouteData | null;
  isNavigating?: boolean;
  runMode?: string;
}

export interface AIRunningAssistantProps {
  isActive?: boolean;
  currentRoute?: RouteData;
  onGuidanceReceived?: (guidance: NavigationGuidance) => void;
  onEmergencyAlert?: (alert: SafetyAlert) => void;
}

// ==================== 导出所有类型 ====================

export type {
  // 基础类型
  GPSData,
  AIContextData,
  FusedData,
  
  // 配置类型
  UnifiedTrackingOptions,
  GPSTrackingOptions,
  AITrackingOptions,
  FusionOptions,
  
  // 导航类型
  SmartNavigationSession,
  NavigationGuidance,
  SmartNavigationData,
  
  // 安全类型
  SafetyAlert,
  EmergencyResponse,
  
  // 推荐类型
  SmartRouteRecommendation,
  AIRouteAnalysis,
  
  // 事件类型
  UnifiedServiceEvent,
  
  // 组件Props类型
  AIRunningAssistantProps
};