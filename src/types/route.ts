// 路线相关类型定义

export interface Route {
  id: string;
  name: string;
  distance: number;
  duration: string;
  difficulty: 'easy' | 'medium' | 'hard';
  rating: number;
  reviews: number;
  description: string;
  highlights: string[];
  image: string;
  location: string;
  elevation: number;
  popularity: number;
  tags: string[];
  startPoint?: [number, number];
  endPoint?: [number, number];
  coordinates?: [number, number][];
}

export interface RouteDetail {
  id: string;
  name: string;
  description: string;
  distance: number;
  duration: number;
  difficulty: number;
  startPoint: string;
  endPoint: string;
  elevation: number;
  routeType: string;
  features: string[];
  coordinates: [number, number][];
  imageUrl?: string;
  rating: number;
  reviewCount: number;
  completionCount: number;
  tags: string[];
  weatherSuitability: string[];
  bestTimeToRun: string[];
  safetyTips: string[];
  landmarks: string[];
  facilities: string[];
  attractions?: Attraction[];
  specialFeatures?: string;
}

export interface Attraction {
  id: string;
  name: string;
  description: string;
  image: string;
  location: string;
  highlight: string;
}

export interface RouteTask {
  id: string;
  routeId: string;
  title: string;
  description: string;
  targetLocation: string;
  targetImage: string;
  style: 'nature' | 'urban' | 'cultural';
  reward: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  userId: string;
  completedAt: Date;
  photo?: string;
  comment?: string;
  badge: string;
  shareCard?: ShareCard;
}

export interface ShareCard {
  id: string;
  routeName: string;
  taskTitle: string;
  completedPhoto: string;
  userComment: string;
  badgeImage: string;
  qrCode: string;
  createdAt: Date;
}

export class RouteError extends Error {
  public timestamp: Date;
  
  constructor(
    public code: string,
    public message: string,
    public severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    public details?: any
  ) {
    super(message);
    this.name = 'RouteError';
    this.timestamp = new Date();
  }
}

export class RouteGenerationError extends Error {
  public timestamp: Date;
  
  constructor(
    public code: string,
    public message: string,
    public severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    public details?: any
  ) {
    super(message);
    this.name = 'RouteGenerationError';
    this.timestamp = new Date();
  }
}

// 用户配置相关类型
export interface UserProfile {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  runningExperience?: string;
  preferences?: RoutePreferences;
  weight?: number;
  height?: number;
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  preferredDistance?: number;
  healthConditions?: string[];
}

export interface RoutePreferences {
  preferredDistance?: number;
  preferredDifficulty?: 'easy' | 'medium' | 'hard';
  avoidBusyRoads?: boolean;
  preferParks?: boolean;
  safetyPriority?: 'low' | 'medium' | 'high';
  // 智能路线服务需要的属性
  distance?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  scenery?: 'park' | 'urban' | 'waterfront' | 'mixed';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  avoidTraffic?: boolean;
  preferSafety?: boolean;
}

export interface WaypointData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  desc?: string;
  type?: 'start' | 'waypoint' | 'end' | 'poi';
  elevation?: number;
  safetyScore?: number;
  sceneryScore?: number;
  trafficLevel?: number;
  amenities?: string[];
}

export interface IntelligentRouteResult {
  route: Route;
  analysis: RouteAnalysis;
  recommendations: string[];
}

export interface RouteAnalysis {
  safetyScore: number;
  difficultyScore: number;
  scenicScore: number;
  trafficLevel: string;
}

export interface RouteGenerationConfig {
  maxDistance?: number;
  minDistance?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  avoidBusyRoads?: boolean;
  preferParks?: boolean;
  enableAI?: boolean;
  enableSecurityAnalysis?: boolean;
}

export interface RouteValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AIRouteRecommendation {
  route: Route;
  score: number;
  reasons: string[];
  alternatives: Route[];
}

export interface SecurityAnalysis {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  recommendations: string[];
}

export interface EnhancedRouteResult {
  route: Route;
  analysis: RouteAnalysis;
  security: SecurityAnalysis;
  recommendations: string[];
}

export type RouteMode = 'walking' | 'running' | 'cycling';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

export interface RoutePerformanceMetrics {
  loadTime: number;
  renderTime: number;
  apiResponseTime: number;
  cacheHitRate: number;
  generationTime?: number;
}
