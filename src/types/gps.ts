/**
 * GPS相关类型定义
 */

export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp?: number;
}

export interface GPSData extends GPSPosition {
  timestamp: number;
}

export interface GPSTrackingOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  trackingInterval?: number;
  distanceFilter?: number;
}

export interface GPSError {
  code: number;
  message: string;
  timestamp: number;
}

export interface GPSQualityMetrics {
  signalStrength: 'excellent' | 'good' | 'medium' | 'fair' | 'poor';
  accuracy: number;
  stability: number;
  reliability: number;
  lastUpdateTime: number;
}

export interface GPSPerformanceMetrics {
  totalPositions: number;
  averageAccuracy: number;
  updateFrequency: number;
  batteryUsage: number;
  signalStrength: 'excellent' | 'good' | 'medium' | 'fair' | 'poor';
  lastUpdateTime: number;
  totalUpdates: number;
  positionBuffer: number;
}

export interface GPSQualityAnalysis {
  signalQuality: 'excellent' | 'good' | 'medium' | 'fair' | 'poor' | 'unknown';
  accuracy: number;
  stability: number;
  reliability: number;
  recommendations: string[];
}

export type GPSEvent = 
  | 'positionUpdate'
  | 'qualityChange'
  | 'trackingStarted'
  | 'trackingStopped'
  | 'error';