// AI智能路线推荐相关类型定义

export interface UserPreference {
  id?: string;
  userId: string;
  runningPreferences: RunningPreferences;
  safetyPreferences: SafetyPreferences;
  notificationPreferences: NotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface RunningPreferences {
  difficulty: string[];
  preferredDistance: string | { min: number; max: number }; // e.g., "5km", "3-5km", "10km+" or {min: 3, max: 10}
  timeOfDay: string[];
  routeTypes: string[]; // e.g., ["park", "waterfront", "urban", "mountain"]
  avoidTraffic: boolean;
  preferredWeather: string[]; // e.g., ["sunny", "cloudy", "light_rain"]
  maxElevation: number; // 最大爬升高度（米）
  preferredEnvironment?: string[];
  avoidTrafficRoads?: boolean;
  preferScenicRoutes?: boolean;
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferredDifficulty?: string[];
  preferredTime?: string[];
}

export interface SafetyPreferences {
  nightRunning: boolean;
  buddySystem: boolean;
  emergencyContacts: boolean;
  safetyAlerts: boolean;
  avoidIsolatedAreas: boolean;
  avoidDarkAreas?: boolean;
  preferWellLitRoutes?: boolean;
  preferPopularRoutes?: boolean;
  emergencyContactEnabled?: boolean;
  shareLocationEnabled?: boolean;
}

export interface NotificationPreferences {
  aiRecommendations: boolean;
  weatherAlerts: boolean;
  routeUpdates: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  pushNotifications: boolean;
  quietHours: {
    start: string;
    end: string;
  };
  enableWeatherAlerts?: boolean;
  enableSafetyAlerts?: boolean;
  enablePersonalizedTips?: boolean;
  recommendationFrequency?: 'daily' | 'weekly' | 'monthly';
  enableRecommendations?: boolean;
}

export interface RouteRecommendation {
  id: string;
  userId: string;
  routeId: string;
  recommendationType: 'daily' | 'challenge' | 'explore' | 'themed' | 'ai_powered';
  confidenceScore: number; // 0.0 - 1.0
  reasoning: string;
  context: RecommendationContext;
  aiAnalysis: AIAnalysis;
  createdAt: Date;
}

export interface RecommendationContext {
  weather?: {
    condition: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
    airQuality: string;
  };
  timeOfDay: string;
  season: string;
  userLocation?: {
    latitude: number;
    longitude: number;
    district: string;
  };
  userActivity?: {
    recentRuns: number;
    avgDistance: number;
    fitnessLevel: string;
  };
}

export interface AIAnalysis {
  matchingFactors: string[]; // 匹配的因素
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  personalizedTips: string[];
  alternativeRoutes?: string[]; // 备选路线ID
  estimatedPerformance?: {
    expectedTime: string;
    difficultyRating: number;
    caloriesBurn: number;
  };
}

export interface RecommendationFeedback {
  id: string;
  recommendationId: string;
  userId: string;
  rating: number; // 1-5
  comment?: string;
  feedbackText?: string;
  isUsed: boolean;
  usageData: UsageData;
  createdAt: Date;
}

export interface UsageData {
  actualDistance?: number;
  actualDuration?: number;
  completionRate?: number; // 0.0 - 1.0
  enjoymentLevel?: number; // 1-5
  difficultyExperience?: 'too_easy' | 'just_right' | 'too_hard';
  weatherConditions?: string;
  issues?: string[]; // 遇到的问题
}

export interface RunningHistory {
  id: string;
  userId: string;
  routeId?: string;
  distance: number;
  durationMinutes: number;
  performanceData: PerformanceData;
  completedAt: Date;
}

export interface PerformanceData {
  avgPace: string; // e.g., "6:10"
  maxSpeed: number;
  calories: number;
  heartRate?: {
    avg: number;
    max: number;
    zones?: Record<string, number>;
  };
  elevation?: {
    gain: number;
    loss: number;
  };
  splits?: Array<{
    distance: number;
    time: string;
    pace: string;
  }>;
}

export interface RouteRating {
  id: string;
  userId: string;
  routeId: string;
  rating: number; // 1-5
  reviewText?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 推荐请求接口
export interface RecommendationRequest {
  userId: string;
  recommendationType?: 'daily' | 'challenge' | 'explore' | 'themed';
  preferences?: Partial<RunningPreferences>;
  context?: Partial<RecommendationContext>;
  limit?: number; // 推荐数量限制，默认5条
  excludeRoutes?: string[]; // 排除的路线ID
}

// 推荐响应接口
export interface RecommendationResponse {
  recommendations: EnhancedRouteRecommendation[];
  reasoning: string;
  confidence: number;
  metadata: RecommendationMetadata;
}

export interface EnhancedRouteRecommendation extends RouteRecommendation {
  route: {
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
  };
  suitabilityScore: number; // 适合度评分 0-100
  personalizedReason: string; // 个性化推荐理由
}

export interface RecommendationMetadata {
  totalRoutes: number;
  processingTime: number;
  aiModel: string;
  version: string;
  factors: {
    userHistory: number; // 权重
    preferences: number;
    context: number;
    community: number;
  };
}

// 推荐设置接口
export interface RecommendationSettings {
  algorithm: {
    noveltyWeight: number; // 新颖性权重 0-1
    safetyWeight: number; // 安全性权重 0-1
    challengeWeight: number; // 挑战性权重 0-1
    popularityWeight: number; // 热门度权重 0-1
  };
  filters: {
    maxDistance: number;
    minRating: number;
    excludeDifficulties: string[];
    excludeRouteTypes: string[];
  };
  notifications: {
    dailyRecommendations: boolean;
    weatherBasedSuggestions: boolean;
    newRouteAlerts: boolean;
    personalizedTips: boolean;
  };
}

// 推荐历史统计
export interface RecommendationStats {
  totalRecommendations: number;
  usedRecommendations: number;
  averageRating: number;
  favoriteRouteTypes: string[];
  improvementSuggestions: string[];
  accuracyTrend: Array<{
    date: string;
    accuracy: number;
  }>;
}

// AI推荐引擎配置
export interface AIRecommendationConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  contextWindow: number;
}

// 推荐算法类型
export type RecommendationAlgorithm = 
  | 'collaborative_filtering'
  | 'content_based'
  | 'hybrid'
  | 'ai_powered';

// 推荐触发器类型
export type RecommendationTrigger = 
  | 'manual'
  | 'scheduled'
  | 'weather_change'
  | 'location_based'
  | 'activity_based';

// 导出所有类型（移除重复导出）