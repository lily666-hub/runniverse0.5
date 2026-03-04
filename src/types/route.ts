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
  constructor(
    public code: string,
    public message: string,
    public severity: 'low' | 'medium' | 'high' = 'medium',
    public details?: any
  ) {
    super(message);
    this.name = 'RouteError';
  }
}

export class RouteGenerationError extends Error {
  constructor(
    public code: string,
    public message: string,
    public severity: 'low' | 'medium' | 'high' = 'medium',
    public details?: any
  ) {
    super(message);
    this.name = 'RouteGenerationError';
  }
}