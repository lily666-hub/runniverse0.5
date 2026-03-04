/**
 * 统一服务模块导出
 */

export { UnifiedGPSAIService } from './UnifiedGPSAIService';
export { EnhancedGPSService, KalmanFilter, OutlierDetector } from './EnhancedGPSService';
export { EnhancedAIService } from './EnhancedAIService';
export { DataFusionEngine } from './DataFusionEngine';
export { ContextManager } from './ContextManager';
export { SmartNavigationSessionManager } from './SmartNavigationSession';
export { VoiceGuidanceService } from './VoiceGuidanceService';

// 导出类型
export type {
  EnhancedGPSOptions,
  GPSPerformanceMetrics,
  GPSQualityAnalysis
} from './EnhancedGPSService';

export type {
  EnhancedAIOptions,
  AIPerformanceMetrics,
  AIAnalysisResult,
  ContextualAIRequest
} from './EnhancedAIService';

export type {
  KalmanFilterState
} from './DataFusionEngine';