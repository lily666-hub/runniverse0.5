// 错误处理工具类
import { RouteError, RouteGenerationError } from '../types/route';

// 错误代码常量
export const ERROR_CODES = {
  // 网络相关错误
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_TIMEOUT: 'API_TIMEOUT',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  
  // 数据验证错误
  INVALID_PARAMS: 'INVALID_PARAMS',
  INVALID_LOCATION: 'INVALID_LOCATION',
  INVALID_DISTANCE: 'INVALID_DISTANCE',
  INVALID_WAYPOINTS: 'INVALID_WAYPOINTS',
  INSUFFICIENT_WAYPOINTS: 'INSUFFICIENT_WAYPOINTS',
  
  // 路线生成错误
  ROUTE_GENERATION_FAILED: 'ROUTE_GENERATION_FAILED',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  MAP_SERVICE_ERROR: 'MAP_SERVICE_ERROR',
  OPTIMIZATION_FAILED: 'OPTIMIZATION_FAILED',
  
  // 安全分析错误
  SECURITY_ANALYSIS_FAILED: 'SECURITY_ANALYSIS_FAILED',
  RISK_ASSESSMENT_ERROR: 'RISK_ASSESSMENT_ERROR',
  
  // 配置错误
  INVALID_CONFIG: 'INVALID_CONFIG',
  MISSING_CREDENTIALS: 'MISSING_CREDENTIALS',
  
  // GPS和导航错误
  GPS_ERROR: 'GPS_ERROR',
  TRACKING_ERROR: 'TRACKING_ERROR',
  NAVIGATION_ERROR: 'NAVIGATION_ERROR',
  ROUTE_PLANNING_ERROR: 'ROUTE_PLANNING_ERROR',
  
  // 系统错误
  MEMORY_LIMIT_EXCEEDED: 'MEMORY_LIMIT_EXCEEDED',
  PROCESSING_TIMEOUT: 'PROCESSING_TIMEOUT',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

// 错误消息映射
const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
  [ERROR_CODES.API_TIMEOUT]: 'API请求超时，请稍后重试',
  [ERROR_CODES.API_RATE_LIMIT]: 'API调用频率过高，请稍后重试',
  
  [ERROR_CODES.INVALID_PARAMS]: '输入参数无效，请检查参数格式',
  [ERROR_CODES.INVALID_LOCATION]: '位置信息无效，请检查坐标格式',
  [ERROR_CODES.INVALID_DISTANCE]: '距离参数无效，请输入有效的距离值',
  [ERROR_CODES.INVALID_WAYPOINTS]: '途径点数据无效',
  [ERROR_CODES.INSUFFICIENT_WAYPOINTS]: '途径点数量不足，无法生成路线',
  
  [ERROR_CODES.ROUTE_GENERATION_FAILED]: '路线生成失败，请重试',
  [ERROR_CODES.AI_SERVICE_ERROR]: 'AI服务异常，请稍后重试',
  [ERROR_CODES.MAP_SERVICE_ERROR]: '地图服务异常，请检查网络连接',
  [ERROR_CODES.OPTIMIZATION_FAILED]: '路线优化失败',
  
  [ERROR_CODES.SECURITY_ANALYSIS_FAILED]: '安全分析失败',
  [ERROR_CODES.RISK_ASSESSMENT_ERROR]: '风险评估异常',
  
  [ERROR_CODES.INVALID_CONFIG]: '配置参数无效',
  [ERROR_CODES.MISSING_CREDENTIALS]: '缺少必要的认证信息',
  
  [ERROR_CODES.GPS_ERROR]: 'GPS定位失败，请检查定位权限',
  [ERROR_CODES.TRACKING_ERROR]: '位置追踪异常，请重新开始追踪',
  [ERROR_CODES.NAVIGATION_ERROR]: '导航功能异常，请重新启动导航',
  [ERROR_CODES.ROUTE_PLANNING_ERROR]: '路线规划失败，请检查网络连接',
  
  [ERROR_CODES.MEMORY_LIMIT_EXCEEDED]: '内存使用超限，请减少数据量',
  [ERROR_CODES.PROCESSING_TIMEOUT]: '处理超时，请稍后重试',
  [ERROR_CODES.UNKNOWN_ERROR]: '未知错误，请联系技术支持'
};

// 错误严重程度映射
const ERROR_SEVERITY: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
  [ERROR_CODES.NETWORK_ERROR]: 'high',
  [ERROR_CODES.API_TIMEOUT]: 'medium',
  [ERROR_CODES.API_RATE_LIMIT]: 'medium',
  
  [ERROR_CODES.INVALID_PARAMS]: 'high',
  [ERROR_CODES.INVALID_LOCATION]: 'high',
  [ERROR_CODES.INVALID_DISTANCE]: 'medium',
  [ERROR_CODES.INVALID_WAYPOINTS]: 'high',
  [ERROR_CODES.INSUFFICIENT_WAYPOINTS]: 'high',
  
  [ERROR_CODES.ROUTE_GENERATION_FAILED]: 'high',
  [ERROR_CODES.AI_SERVICE_ERROR]: 'medium',
  [ERROR_CODES.MAP_SERVICE_ERROR]: 'high',
  [ERROR_CODES.OPTIMIZATION_FAILED]: 'medium',
  
  [ERROR_CODES.SECURITY_ANALYSIS_FAILED]: 'low',
  [ERROR_CODES.RISK_ASSESSMENT_ERROR]: 'low',
  
  [ERROR_CODES.INVALID_CONFIG]: 'high',
  [ERROR_CODES.MISSING_CREDENTIALS]: 'critical',
  
  [ERROR_CODES.GPS_ERROR]: 'high',
  [ERROR_CODES.TRACKING_ERROR]: 'medium',
  [ERROR_CODES.NAVIGATION_ERROR]: 'high',
  [ERROR_CODES.ROUTE_PLANNING_ERROR]: 'high',
  
  [ERROR_CODES.MEMORY_LIMIT_EXCEEDED]: 'critical',
  [ERROR_CODES.PROCESSING_TIMEOUT]: 'high',
  [ERROR_CODES.UNKNOWN_ERROR]: 'critical'
};

// 错误处理器类
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: RouteGenerationError[] = [];
  private maxLogSize = 100;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 创建标准化错误
   */
  public createError(
    code: string,
    customMessage?: string,
    details?: any
  ): RouteError {
    const message = customMessage || ERROR_MESSAGES[code] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
    const severity = ERROR_SEVERITY[code] || 'medium';
    
    const error = new RouteError(code, message, severity, details);
    this._logError(error);
    
    return error;
  }

  /**
   * 处理异步操作错误
   */
  public async handleAsyncError<T>(
    operation: () => Promise<T>,
    errorCode: string,
    customMessage?: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const routeError = this.createError(
        errorCode,
        customMessage,
        {
          originalError: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }
      );
      throw routeError;
    }
  }

  /**
   * 处理同步操作错误
   */
  public handleSyncError<T>(
    operation: () => T,
    errorCode: string,
    customMessage?: string
  ): T {
    try {
      return operation();
    } catch (error) {
      const routeError = this.createError(
        errorCode,
        customMessage,
        {
          originalError: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }
      );
      throw routeError;
    }
  }

  /**
   * 验证位置数据
   */
  public validateLocation(location: any): void {
    if (!location || typeof location !== 'object') {
      throw this.createError(ERROR_CODES.INVALID_LOCATION, '位置对象不能为空');
    }

    if (typeof location.lng !== 'number' || typeof location.lat !== 'number') {
      throw this.createError(ERROR_CODES.INVALID_LOCATION, '经纬度必须为数字');
    }

    if (location.lng < -180 || location.lng > 180) {
      throw this.createError(ERROR_CODES.INVALID_LOCATION, '经度范围必须在-180到180之间');
    }

    if (location.lat < -90 || location.lat > 90) {
      throw this.createError(ERROR_CODES.INVALID_LOCATION, '纬度范围必须在-90到90之间');
    }
  }

  /**
   * 验证距离参数
   */
  public validateDistance(distance: any): void {
    if (typeof distance !== 'number' || isNaN(distance)) {
      throw this.createError(ERROR_CODES.INVALID_DISTANCE, '距离必须为有效数字');
    }

    if (distance <= 0) {
      throw this.createError(ERROR_CODES.INVALID_DISTANCE, '距离必须大于0');
    }

    if (distance > 100000) { // 100km
      throw this.createError(ERROR_CODES.INVALID_DISTANCE, '距离不能超过100公里');
    }
  }

  /**
   * 验证途径点数据
   */
  public validateWaypoints(waypoints: any[]): void {
    if (!Array.isArray(waypoints)) {
      throw this.createError(ERROR_CODES.INVALID_WAYPOINTS, '途径点必须为数组');
    }

    if (waypoints.length < 2) {
      throw this.createError(ERROR_CODES.INSUFFICIENT_WAYPOINTS, '至少需要2个途径点');
    }

    waypoints.forEach((waypoint, index) => {
      try {
        this.validateLocation(waypoint);
      } catch (error) {
        throw this.createError(
          ERROR_CODES.INVALID_WAYPOINTS,
          `第${index + 1}个途径点无效: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  /**
   * 公共错误记录方法
   */
  public logError(
    error: Error | RouteError,
    code?: string,
    severity?: 'low' | 'medium' | 'high' | 'critical'
  ): void {
    let routeError: RouteError;
    
    if (error instanceof RouteError) {
      routeError = error;
    } else {
      routeError = this.createError(
        code || ERROR_CODES.UNKNOWN_ERROR,
        error.message,
        { originalError: error.message, stack: error.stack }
      );
      if (severity) {
        routeError.severity = severity;
      }
    }
    
    this._logError(routeError);
  }

  /**
   * 内部错误记录方法
   */
  private _logError(error: RouteError): void {
    const errorLog = new RouteGenerationError(
      error.code,
      error.message,
      error.severity,
      error.details
    );

    this.errorLog.push(errorLog);

    // 限制日志大小
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // 在开发环境下打印错误
    if (import.meta.env.DEV) {
      console.error('RouteError:', errorLog);
    }
  }

  /**
   * 获取错误日志
   */
  public getErrorLog(): RouteGenerationError[] {
    return [...this.errorLog];
  }

  /**
   * 清空错误日志
   */
  public clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * 获取最近的错误
   */
  public getRecentErrors(count: number = 10): RouteGenerationError[] {
    return this.errorLog.slice(-count);
  }

  /**
   * 按严重程度过滤错误
   */
  public getErrorsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): RouteGenerationError[] {
    return this.errorLog.filter(error => error.severity === severity);
  }

  /**
   * 检查是否有关键错误
   */
  public hasCriticalErrors(): boolean {
    return this.errorLog.some(error => error.severity === 'critical');
  }

  /**
   * 生成错误报告
   */
  public generateErrorReport(): {
    totalErrors: number;
    errorsBySeverity: Record<string, number>;
    recentErrors: RouteGenerationError[];
    mostCommonErrors: Array<{ code: string; count: number }>;
  } {
    const errorsBySeverity = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    const errorCounts: Record<string, number> = {};

    this.errorLog.forEach(error => {
      errorsBySeverity[error.severity]++;
      errorCounts[error.code] = (errorCounts[error.code] || 0) + 1;
    });

    const mostCommonErrors = Object.entries(errorCounts)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalErrors: this.errorLog.length,
      errorsBySeverity,
      recentErrors: this.getRecentErrors(5),
      mostCommonErrors
    };
  }
}

// 导出单例实例
export const errorHandler = ErrorHandler.getInstance();

// 便捷函数
export const createRouteError = (code: string, message?: string, details?: any) => 
  errorHandler.createError(code, message, details);

export const validateLocation = (location: any) => 
  errorHandler.validateLocation(location);

export const validateDistance = (distance: any) => 
  errorHandler.validateDistance(distance);

export const validateWaypoints = (waypoints: any[]) => 
  errorHandler.validateWaypoints(waypoints);

export const handleAsyncError = <T>(
  operation: () => Promise<T>,
  errorCode: string,
  customMessage?: string
) => errorHandler.handleAsyncError(operation, errorCode, customMessage);

export const handleSyncError = <T>(
  operation: () => T,
  errorCode: string,
  customMessage?: string
) => errorHandler.handleSyncError(operation, errorCode, customMessage);