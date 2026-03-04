// 性能监控工具
import { RoutePerformanceMetrics } from '../types/route';

// 性能指标接口
export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  totalDuration: number;
  metrics: PerformanceMetric[];
  summary: {
    averageDuration: number;
    maxDuration: number;
    minDuration: number;
    totalOperations: number;
  };
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
  recommendations: string[];
}

// 性能阈值配置
export interface PerformanceThresholds {
  routeGeneration: number; // 路线生成最大时间 (ms)
  aiResponse: number; // AI响应最大时间 (ms)
  mapCalculation: number; // 地图计算最大时间 (ms)
  securityAnalysis: number; // 安全分析最大时间 (ms)
  memoryUsage: number; // 内存使用率阈值 (%)
}

// 默认性能阈值
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  routeGeneration: 10000, // 10秒
  aiResponse: 5000, // 5秒
  mapCalculation: 3000, // 3秒
  securityAnalysis: 2000, // 2秒
  memoryUsage: 80 // 80%
};

// 性能监控器类
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private completedMetrics: PerformanceMetric[] = [];
  private thresholds: PerformanceThresholds;
  private maxHistorySize = 1000;

  private constructor(thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS) {
    this.thresholds = thresholds;
  }

  public static getInstance(thresholds?: PerformanceThresholds): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(thresholds);
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 开始性能监控
   */
  public startMetric(name: string, metadata?: Record<string, any>): string {
    const metricId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };

    this.metrics.set(metricId, metric);
    
    if (import.meta.env.DEV) {
      console.log(`🚀 Performance: Started monitoring "${name}"`);
    }

    return metricId;
  }

  /**
   * 结束性能监控
   */
  public endMetric(metricId: string, additionalMetadata?: Record<string, any>): PerformanceMetric | null {
    const metric = this.metrics.get(metricId);
    if (!metric) {
      console.warn(`Performance metric with ID "${metricId}" not found`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    
    if (additionalMetadata) {
      metric.metadata = { ...metric.metadata, ...additionalMetadata };
    }

    // 移动到已完成指标
    this.metrics.delete(metricId);
    this.completedMetrics.push(metric);

    // 限制历史记录大小
    if (this.completedMetrics.length > this.maxHistorySize) {
      this.completedMetrics = this.completedMetrics.slice(-this.maxHistorySize);
    }

    // 检查性能阈值
    this.checkThreshold(metric);

    if (import.meta.env.DEV) {
      console.log(`✅ Performance: "${metric.name}" completed in ${metric.duration?.toFixed(2)}ms`);
    }

    return metric;
  }

  /**
   * 测量异步操作性能
   */
  public async measureAsync<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<{ result: T; metric: PerformanceMetric }> {
    const metricId = this.startMetric(name, metadata);
    
    try {
      const result = await operation();
      const metric = this.endMetric(metricId, { success: true });
      return { result, metric: metric! };
    } catch (error) {
      const metric = this.endMetric(metricId, { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * 测量同步操作性能
   */
  public measureSync<T>(
    name: string,
    operation: () => T,
    metadata?: Record<string, any>
  ): { result: T; metric: PerformanceMetric } {
    const metricId = this.startMetric(name, metadata);
    
    try {
      const result = operation();
      const metric = this.endMetric(metricId, { success: true });
      return { result, metric: metric! };
    } catch (error) {
      const metric = this.endMetric(metricId, { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * 获取内存使用情况
   */
  public getMemoryUsage(): { used: number; total: number; percentage: number } | null {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      };
    }
    return null;
  }

  /**
   * 生成性能报告
   */
  public generateReport(filterByName?: string): PerformanceReport {
    let metrics = this.completedMetrics;
    
    if (filterByName) {
      metrics = metrics.filter(m => m.name.includes(filterByName));
    }

    if (metrics.length === 0) {
      return {
        totalDuration: 0,
        metrics: [],
        summary: {
          averageDuration: 0,
          maxDuration: 0,
          minDuration: 0,
          totalOperations: 0
        },
        recommendations: ['暂无性能数据']
      };
    }

    const durations = metrics.map(m => m.duration || 0);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const averageDuration = totalDuration / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    const memoryUsage = this.getMemoryUsage();
    const recommendations = this.generateRecommendations(metrics, memoryUsage);

    return {
      totalDuration,
      metrics,
      summary: {
        averageDuration,
        maxDuration,
        minDuration,
        totalOperations: metrics.length
      },
      memoryUsage,
      recommendations
    };
  }

  /**
   * 获取路线生成性能指标
   */
  public getRoutePerformanceMetrics(): RoutePerformanceMetrics | null {
    const routeMetrics = this.completedMetrics.filter(m => 
      m.name.includes('route') || m.name.includes('Route')
    );

    if (routeMetrics.length === 0) {
      return null;
    }

    const generationMetric = routeMetrics.find(m => m.name.includes('generation'));
    const aiMetric = routeMetrics.find(m => m.name.includes('ai') || m.name.includes('AI'));
    const optimizationMetric = routeMetrics.find(m => m.name.includes('optimization'));
    const securityMetric = routeMetrics.find(m => m.name.includes('security'));

    const memoryUsage = this.getMemoryUsage();

    return {
      generationTime: generationMetric?.duration || 0,
      aiResponseTime: aiMetric?.duration,
      optimizationTime: optimizationMetric?.duration || 0,
      securityAnalysisTime: securityMetric?.duration,
      totalWaypoints: generationMetric?.metadata?.totalWaypoints || 0,
      finalWaypoints: generationMetric?.metadata?.finalWaypoints || 0,
      optimizationIterations: optimizationMetric?.metadata?.iterations || 0,
      qualityScore: generationMetric?.metadata?.qualityScore || 0,
      distanceAccuracy: generationMetric?.metadata?.distanceAccuracy || 0,
      memoryUsage: memoryUsage?.used
    };
  }

  /**
   * 检查性能阈值
   */
  private checkThreshold(metric: PerformanceMetric): void {
    if (!metric.duration) return;

    let threshold: number | undefined;
    let thresholdName: string;

    if (metric.name.includes('route') || metric.name.includes('Route')) {
      threshold = this.thresholds.routeGeneration;
      thresholdName = '路线生成';
    } else if (metric.name.includes('ai') || metric.name.includes('AI')) {
      threshold = this.thresholds.aiResponse;
      thresholdName = 'AI响应';
    } else if (metric.name.includes('map') || metric.name.includes('Map')) {
      threshold = this.thresholds.mapCalculation;
      thresholdName = '地图计算';
    } else if (metric.name.includes('security') || metric.name.includes('Security')) {
      threshold = this.thresholds.securityAnalysis;
      thresholdName = '安全分析';
    }

    if (threshold && metric.duration > threshold) {
      console.warn(
        `⚠️ Performance Warning: ${thresholdName} took ${metric.duration.toFixed(2)}ms, ` +
        `exceeding threshold of ${threshold}ms`
      );
    }

    // 检查内存使用
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage && memoryUsage.percentage > this.thresholds.memoryUsage) {
      console.warn(
        `⚠️ Memory Warning: Memory usage at ${memoryUsage.percentage.toFixed(1)}%, ` +
        `exceeding threshold of ${this.thresholds.memoryUsage}%`
      );
    }
  }

  /**
   * 生成性能建议
   */
  private generateRecommendations(
    metrics: PerformanceMetric[], 
    memoryUsage: { used: number; total: number; percentage: number } | null
  ): string[] {
    const recommendations: string[] = [];
    
    // 分析平均响应时间
    const durations = metrics.map(m => m.duration || 0);
    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    
    if (averageDuration > 5000) {
      recommendations.push('平均响应时间较长，建议优化算法或增加缓存');
    }

    // 分析失败率
    const failedMetrics = metrics.filter(m => m.metadata?.success === false);
    const failureRate = failedMetrics.length / metrics.length;
    
    if (failureRate > 0.1) {
      recommendations.push(`失败率较高 (${(failureRate * 100).toFixed(1)}%)，建议检查错误处理逻辑`);
    }

    // 分析内存使用
    if (memoryUsage) {
      if (memoryUsage.percentage > 80) {
        recommendations.push('内存使用率过高，建议优化内存管理');
      } else if (memoryUsage.percentage > 60) {
        recommendations.push('内存使用率偏高，建议监控内存泄漏');
      }
    }

    // 分析特定操作
    const routeMetrics = metrics.filter(m => m.name.includes('route'));
    if (routeMetrics.length > 0) {
      const avgRouteTime = routeMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / routeMetrics.length;
      if (avgRouteTime > 8000) {
        recommendations.push('路线生成时间过长，建议优化路线算法或减少途径点数量');
      }
    }

    const aiMetrics = metrics.filter(m => m.name.includes('ai') || m.name.includes('AI'));
    if (aiMetrics.length > 0) {
      const avgAiTime = aiMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / aiMetrics.length;
      if (avgAiTime > 3000) {
        recommendations.push('AI响应时间较长，建议优化提示词或考虑缓存策略');
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('性能表现良好，继续保持');
    }

    return recommendations;
  }

  /**
   * 清空性能数据
   */
  public clearMetrics(): void {
    this.metrics.clear();
    this.completedMetrics = [];
  }

  /**
   * 获取活跃的监控指标
   */
  public getActiveMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * 获取已完成的监控指标
   */
  public getCompletedMetrics(): PerformanceMetric[] {
    return [...this.completedMetrics];
  }

  /**
   * 设置性能阈值
   */
  public setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * 获取当前阈值配置
   */
  public getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }

  /**
   * 导出性能数据
   */
  public exportData(): {
    activeMetrics: PerformanceMetric[];
    completedMetrics: PerformanceMetric[];
    thresholds: PerformanceThresholds;
    timestamp: string;
  } {
    return {
      activeMetrics: this.getActiveMetrics(),
      completedMetrics: this.getCompletedMetrics(),
      thresholds: this.getThresholds(),
      timestamp: new Date().toISOString()
    };
  }
}

// 导出单例实例
export const performanceMonitor = PerformanceMonitor.getInstance();

// 便捷函数
export const startPerformanceMetric = (name: string, metadata?: Record<string, any>) =>
  performanceMonitor.startMetric(name, metadata);

export const endPerformanceMetric = (metricId: string, additionalMetadata?: Record<string, any>) =>
  performanceMonitor.endMetric(metricId, additionalMetadata);

export const measureAsyncPerformance = <T>(
  name: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
) => performanceMonitor.measureAsync(name, operation, metadata);

export const measureSyncPerformance = <T>(
  name: string,
  operation: () => T,
  metadata?: Record<string, any>
) => performanceMonitor.measureSync(name, operation, metadata);

export const getPerformanceReport = (filterByName?: string) =>
  performanceMonitor.generateReport(filterByName);

export const getRoutePerformanceMetrics = () =>
  performanceMonitor.getRoutePerformanceMetrics();