import { 
  performanceMonitor, 
  startPerformanceMetric, 
  endPerformanceMetric,
  measureAsyncPerformance,
  measureSyncPerformance,
  getPerformanceReport,
  getRoutePerformanceMetrics
} from '../performanceMonitor';
import { createMockPerformanceMetrics } from '../../setupTests';

// Mock performance.now
const mockNow = jest.fn();
Object.defineProperty(window, 'performance', {
  value: {
    now: mockNow,
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    }
  },
  writable: true
});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNow.mockReturnValue(1000);
    performanceMonitor.clearMetrics();
  });

  describe('startPerformanceMetric and endPerformanceMetric', () => {
    it('should start and end a performance metric', () => {
      mockNow.mockReturnValueOnce(1000).mockReturnValueOnce(2000);
      
      const metricId = startPerformanceMetric('test_operation', { test: true });
      expect(metricId).toBeDefined();
      
      const result = endPerformanceMetric(metricId, { success: true });
      expect(result).toEqual({
        name: 'test_operation',
        startTime: 1000,
        endTime: 2000,
        duration: 1000,
        metadata: { test: true, success: true }
      });
    });

    it('should handle invalid metric ID', () => {
      const result = endPerformanceMetric('invalid_id');
      expect(result).toBeNull();
    });
  });

  describe('measureAsyncPerformance', () => {
    it('should measure async operation performance', async () => {
      mockNow.mockReturnValueOnce(1000).mockReturnValueOnce(2000);
      const asyncFn = jest.fn().mockResolvedValue('success');
      
      const { result, metric } = await measureAsyncPerformance('test-async', asyncFn);
      
      expect(result).toBe('success');
      expect(metric.name).toBe('test-async');
      expect(metric.duration).toBe(1000);
      expect(asyncFn).toHaveBeenCalled();
    });

    it('should handle async operation errors', async () => {
      mockNow.mockReturnValueOnce(1000).mockReturnValueOnce(2000);
      const error = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      
      await expect(measureAsyncPerformance('test-async-error', asyncFn)).rejects.toThrow('Async error');
    });
  });

  describe('measureSyncPerformance', () => {
    it('should measure sync operation performance', () => {
      mockNow.mockReturnValueOnce(1000).mockReturnValueOnce(2000);
      const syncFn = jest.fn().mockReturnValue('success');
      
      const { result, metric } = measureSyncPerformance('test-sync', syncFn);
      
      expect(result).toBe('success');
      expect(metric.name).toBe('test-sync');
      expect(metric.duration).toBe(1000);
      expect(syncFn).toHaveBeenCalled();
    });

    it('should handle sync operation errors', () => {
      mockNow.mockReturnValueOnce(1000).mockReturnValueOnce(2000);
      const error = new Error('Sync error');
      const syncFn = jest.fn().mockImplementation(() => { throw error; });
      
      expect(() => measureSyncPerformance('test-sync-error', syncFn)).toThrow('Sync error');
    });
  });

  describe('getPerformanceReport', () => {
    it('should generate performance report', () => {
      // Add some test metrics
      mockNow.mockReturnValue(1000);
      const id1 = startPerformanceMetric('operation1');
      mockNow.mockReturnValue(2000);
      endPerformanceMetric(id1);
      
      mockNow.mockReturnValue(3000);
      const id2 = startPerformanceMetric('operation2');
      mockNow.mockReturnValue(5000);
      endPerformanceMetric(id2);
      
      const report = getPerformanceReport();
      
      expect(report.summary.totalOperations).toBe(2);
      expect(report.summary.averageDuration).toBe(1500); // (1000 + 2000) / 2
      expect(report.summary.maxDuration).toBe(2000);
      expect(report.summary.minDuration).toBe(1000);
    });

    it('should handle empty metrics', () => {
      const report = getPerformanceReport();
      
      expect(report.summary.totalOperations).toBe(0);
      expect(report.summary.averageDuration).toBe(0);
      expect(report.summary.maxDuration).toBe(0);
      expect(report.summary.minDuration).toBe(0);
    });
  });

  describe('memory usage', () => {
    it('should get memory usage when available', () => {
      const memoryUsage = performanceMonitor.getMemoryUsage();
      
      expect(memoryUsage).toEqual({
        used: 1000000,
        total: 2000000,
        percentage: 50
      });
    });
  });

  describe('thresholds', () => {
    it('should check performance thresholds', () => {
      mockNow.mockReturnValueOnce(1000).mockReturnValueOnce(7000); // 6000ms duration - exceeds 5000ms threshold
      
      const metricId = startPerformanceMetric('slow_operation');
      const result = endPerformanceMetric(metricId);
      
      const report = getPerformanceReport();
      expect(report.recommendations).toContain('平均响应时间较长，建议优化算法或增加缓存');
    });
  });
});