import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  ErrorHandler, 
  errorHandler, 
  ERROR_CODES,
  createRouteError,
  validateLocation,
  validateDistance,
  validateWaypoints,
  handleAsyncError,
  handleSyncError
} from '../errorHandler';
import { RouteError } from '../../types/route';

describe('ErrorHandler', () => {
  beforeEach(() => {
    // 清空错误日志
    errorHandler.clearErrorLog();
    
    // 模拟控制台方法
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('单例模式', () => {
    it('应该返回同一个实例', () => {
      const instance1 = ErrorHandler.getInstance();
      const instance2 = ErrorHandler.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('createError', () => {
    it('应该创建标准化错误', () => {
      const error = errorHandler.createError(ERROR_CODES.NETWORK_ERROR);
      
      expect(error).toBeInstanceOf(RouteError);
      expect(error.code).toBe(ERROR_CODES.NETWORK_ERROR);
      expect(error.message).toBe('网络连接失败，请检查网络设置');
      expect(error.severity).toBe('high');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('应该使用自定义消息', () => {
      const customMessage = '自定义错误消息';
      const error = errorHandler.createError(ERROR_CODES.NETWORK_ERROR, customMessage);
      
      expect(error.message).toBe(customMessage);
    });

    it('应该包含详细信息', () => {
      const details = { url: 'https://api.example.com', status: 500 };
      const error = errorHandler.createError(ERROR_CODES.API_TIMEOUT, undefined, details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('logError', () => {
    it('应该记录RouteError', () => {
      const error = new RouteError(ERROR_CODES.GPS_ERROR, 'GPS测试错误', 'high');
      errorHandler.logError(error);
      
      const logs = errorHandler.getErrorLog();
      expect(logs).toHaveLength(1);
      expect(logs[0].code).toBe(ERROR_CODES.GPS_ERROR);
      expect(logs[0].message).toBe('GPS测试错误');
    });

    it('应该记录普通Error', () => {
      const error = new Error('普通错误');
      errorHandler.logError(error, ERROR_CODES.UNKNOWN_ERROR, 'medium');
      
      const logs = errorHandler.getErrorLog();
      expect(logs).toHaveLength(1);
      expect(logs[0].code).toBe(ERROR_CODES.UNKNOWN_ERROR);
      expect(logs[0].severity).toBe('medium');
    });
  });

  describe('handleAsyncError', () => {
    it('应该处理成功的异步操作', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await errorHandler.handleAsyncError(
        operation,
        ERROR_CODES.NETWORK_ERROR
      );
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledOnce();
    });

    it('应该处理失败的异步操作', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('异步错误'));
      
      await expect(
        errorHandler.handleAsyncError(operation, ERROR_CODES.NETWORK_ERROR)
      ).rejects.toThrow(RouteError);
      
      const logs = errorHandler.getErrorLog();
      expect(logs).toHaveLength(1);
      expect(logs[0].code).toBe(ERROR_CODES.NETWORK_ERROR);
    });
  });

  describe('handleSyncError', () => {
    it('应该处理成功的同步操作', () => {
      const operation = vi.fn().mockReturnValue('success');
      
      const result = errorHandler.handleSyncError(
        operation,
        ERROR_CODES.INVALID_PARAMS
      );
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledOnce();
    });

    it('应该处理失败的同步操作', () => {
      const operation = vi.fn().mockImplementation(() => {
        throw new Error('同步错误');
      });
      
      expect(() => 
        errorHandler.handleSyncError(operation, ERROR_CODES.INVALID_PARAMS)
      ).toThrow(RouteError);
      
      const logs = errorHandler.getErrorLog();
      expect(logs).toHaveLength(1);
      expect(logs[0].code).toBe(ERROR_CODES.INVALID_PARAMS);
    });
  });

  describe('validateLocation', () => {
    it('应该验证有效的位置', () => {
      const validLocation = { lng: 121.5, lat: 31.2 };
      expect(() => errorHandler.validateLocation(validLocation)).not.toThrow();
    });

    it('应该拒绝无效的位置对象', () => {
      expect(() => errorHandler.validateLocation(null)).toThrow(RouteError);
      expect(() => errorHandler.validateLocation(undefined)).toThrow(RouteError);
      expect(() => errorHandler.validateLocation('invalid')).toThrow(RouteError);
    });

    it('应该拒绝无效的经纬度', () => {
      expect(() => errorHandler.validateLocation({ lng: 'invalid', lat: 31.2 })).toThrow(RouteError);
      expect(() => errorHandler.validateLocation({ lng: 121.5, lat: 'invalid' })).toThrow(RouteError);
    });

    it('应该拒绝超出范围的经纬度', () => {
      expect(() => errorHandler.validateLocation({ lng: 181, lat: 31.2 })).toThrow(RouteError);
      expect(() => errorHandler.validateLocation({ lng: -181, lat: 31.2 })).toThrow(RouteError);
      expect(() => errorHandler.validateLocation({ lng: 121.5, lat: 91 })).toThrow(RouteError);
      expect(() => errorHandler.validateLocation({ lng: 121.5, lat: -91 })).toThrow(RouteError);
    });
  });

  describe('validateDistance', () => {
    it('应该验证有效的距离', () => {
      expect(() => errorHandler.validateDistance(1000)).not.toThrow();
      expect(() => errorHandler.validateDistance(50000)).not.toThrow();
    });

    it('应该拒绝无效的距离类型', () => {
      expect(() => errorHandler.validateDistance('invalid')).toThrow(RouteError);
      expect(() => errorHandler.validateDistance(null)).toThrow(RouteError);
      expect(() => errorHandler.validateDistance(NaN)).toThrow(RouteError);
    });

    it('应该拒绝无效的距离值', () => {
      expect(() => errorHandler.validateDistance(0)).toThrow(RouteError);
      expect(() => errorHandler.validateDistance(-100)).toThrow(RouteError);
      expect(() => errorHandler.validateDistance(100001)).toThrow(RouteError);
    });
  });

  describe('validateWaypoints', () => {
    it('应该验证有效的途径点', () => {
      const validWaypoints = [
        { lng: 121.5, lat: 31.2 },
        { lng: 121.6, lat: 31.3 }
      ];
      expect(() => errorHandler.validateWaypoints(validWaypoints)).not.toThrow();
    });

    it('应该拒绝非数组的途径点', () => {
      expect(() => errorHandler.validateWaypoints('invalid' as any)).toThrow(RouteError);
      expect(() => errorHandler.validateWaypoints(null as any)).toThrow(RouteError);
    });

    it('应该拒绝途径点数量不足', () => {
      expect(() => errorHandler.validateWaypoints([])).toThrow(RouteError);
      expect(() => errorHandler.validateWaypoints([{ lng: 121.5, lat: 31.2 }])).toThrow(RouteError);
    });

    it('应该拒绝包含无效位置的途径点', () => {
      const invalidWaypoints = [
        { lng: 121.5, lat: 31.2 },
        { lng: 'invalid', lat: 31.3 }
      ];
      expect(() => errorHandler.validateWaypoints(invalidWaypoints as any)).toThrow(RouteError);
    });
  });

  describe('错误日志管理', () => {
    it('应该获取错误日志', () => {
      errorHandler.createError(ERROR_CODES.GPS_ERROR);
      errorHandler.createError(ERROR_CODES.NETWORK_ERROR);
      
      const logs = errorHandler.getErrorLog();
      expect(logs).toHaveLength(2);
    });

    it('应该清空错误日志', () => {
      errorHandler.createError(ERROR_CODES.GPS_ERROR);
      errorHandler.clearErrorLog();
      
      const logs = errorHandler.getErrorLog();
      expect(logs).toHaveLength(0);
    });

    it('应该获取最近的错误', () => {
      for (let i = 0; i < 15; i++) {
        errorHandler.createError(ERROR_CODES.GPS_ERROR);
      }
      
      const recentErrors = errorHandler.getRecentErrors(5);
      expect(recentErrors).toHaveLength(5);
    });

    it('应该按严重程度过滤错误', () => {
      errorHandler.createError(ERROR_CODES.GPS_ERROR); // high
      errorHandler.createError(ERROR_CODES.API_TIMEOUT); // medium
      errorHandler.createError(ERROR_CODES.MISSING_CREDENTIALS); // critical
      
      const highErrors = errorHandler.getErrorsBySeverity('high');
      const criticalErrors = errorHandler.getErrorsBySeverity('critical');
      
      expect(highErrors).toHaveLength(1);
      expect(criticalErrors).toHaveLength(1);
    });

    it('应该检查是否有关键错误', () => {
      expect(errorHandler.hasCriticalErrors()).toBe(false);
      
      errorHandler.createError(ERROR_CODES.MISSING_CREDENTIALS);
      expect(errorHandler.hasCriticalErrors()).toBe(true);
    });

    it('应该生成错误报告', () => {
      errorHandler.createError(ERROR_CODES.GPS_ERROR);
      errorHandler.createError(ERROR_CODES.GPS_ERROR);
      errorHandler.createError(ERROR_CODES.NETWORK_ERROR);
      
      const report = errorHandler.generateErrorReport();
      
      expect(report.totalErrors).toBe(3);
      expect(report.errorsBySeverity.high).toBe(3);
      expect(report.mostCommonErrors[0].code).toBe(ERROR_CODES.GPS_ERROR);
      expect(report.mostCommonErrors[0].count).toBe(2);
    });
  });

  describe('便捷函数', () => {
    it('createRouteError 应该工作', () => {
      const error = createRouteError(ERROR_CODES.GPS_ERROR, '测试消息');
      expect(error).toBeInstanceOf(RouteError);
      expect(error.code).toBe(ERROR_CODES.GPS_ERROR);
    });

    it('validateLocation 应该工作', () => {
      expect(() => validateLocation({ lng: 121.5, lat: 31.2 })).not.toThrow();
    });

    it('validateDistance 应该工作', () => {
      expect(() => validateDistance(1000)).not.toThrow();
    });

    it('validateWaypoints 应该工作', () => {
      const waypoints = [{ lng: 121.5, lat: 31.2 }, { lng: 121.6, lat: 31.3 }];
      expect(() => validateWaypoints(waypoints)).not.toThrow();
    });

    it('handleAsyncError 应该工作', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await handleAsyncError(operation, ERROR_CODES.NETWORK_ERROR);
      expect(result).toBe('success');
    });

    it('handleSyncError 应该工作', () => {
      const operation = vi.fn().mockReturnValue('success');
      const result = handleSyncError(operation, ERROR_CODES.INVALID_PARAMS);
      expect(result).toBe('success');
    });
  });
});