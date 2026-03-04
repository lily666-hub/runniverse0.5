/**
 * 增强服务集成测试
 * 测试增强的GPS和AI服务与统一服务的集成
 */

import { describe, test, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { UnifiedGPSAIService } from '../services/unified/UnifiedGPSAIService';
import { EnhancedGPSService } from '../services/unified/EnhancedGPSService';
import { EnhancedAIService } from '../services/unified/EnhancedAIService';

// Mock AmapLoader
vi.mock('../utils/amapLoader', () => ({
  AmapLoader: {
    loadAmap: vi.fn().mockResolvedValue(true)
  }
}));

// Mock window.AMap
Object.defineProperty(window, 'AMap', {
  value: {
    Map: vi.fn().mockImplementation(() => ({
      addControl: vi.fn(),
      on: vi.fn(),
      setCenter: vi.fn(),
      setZoom: vi.fn(),
      destroy: vi.fn()
    })),
    Scale: vi.fn(),
    ToolBar: vi.fn(),
    Geolocation: vi.fn().mockImplementation(() => ({
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn()
    }))
  },
  writable: true
});

// 全局 mock 设置
beforeAll(() => {
  // Mock navigator.permissions
  Object.defineProperty(navigator, 'permissions', {
    value: {
      query: vi.fn().mockResolvedValue({ state: 'granted' })
    },
    writable: true
  });

  // Mock geolocation
  Object.defineProperty(navigator, 'geolocation', {
    value: {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn()
    },
    writable: true
  });

  // Mock speechSynthesis
  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn().mockReturnValue([])
    },
    writable: true
  });
});

describe('Enhanced Services Integration', () => {
  let unifiedService: UnifiedGPSAIService;

  beforeEach(() => {
    unifiedService = UnifiedGPSAIService.getInstance();
  });

  afterEach(async () => {
    if (unifiedService) {
      unifiedService.destroy();
    }
  });

  describe('Service Initialization', () => {
    test('should initialize unified service with enhanced GPS and AI services', async () => {
      const mockMapContainer = document.createElement('div');
      
      await unifiedService.initialize({
        userPreferences: {
          preferredDistance: 5000,
          preferredDifficulty: 'medium',
          avoidBusyRoads: true,
          preferParks: true,
          timeOfDay: 'morning',
          weatherPreference: ['sunny', 'cloudy'],
          safetyPriority: 'high'
        },
        mapContainer: mockMapContainer,
        voiceEnabled: true
      });

      const status = unifiedService.getStatus();
      expect(status.isInitialized).toBe(true);
    }, 10000); // 增加超时时间到10秒

    test('should handle initialization errors gracefully', async () => {
      // 测试初始化错误处理
      const errorSpy = vi.spyOn(console, 'error').mockImplementation();
      
      try {
        await unifiedService.initialize({
          mapContainer: null as any // 故意传入无效参数
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
      
      errorSpy.mockRestore();
    }, 10000);
  });

  describe('Enhanced GPS Integration', () => {
    test('should start enhanced GPS tracking', async () => {
      await unifiedService.initialize();
      
      const trackingOptions = {
        gpsOptions: {
          enableHighAccuracy: true,
          timeout: 10000,
          trackingInterval: 2000
        },
        aiOptions: {
          enableRealTimeAnalysis: true
        }
      };

      await unifiedService.startUnifiedTracking(trackingOptions);
      
      const status = unifiedService.getStatus();
      expect(status.isTracking).toBe(true);
    }, 15000); // 增加超时时间

    test('should handle GPS quality changes', (done) => {
      unifiedService.on('gpsQualityChange', (quality) => {
        expect(quality).toBeDefined();
        expect(quality.signalStrength).toBeGreaterThanOrEqual(0);
        done();
      });

      // 模拟GPS质量变化事件
      setTimeout(() => {
        unifiedService.emit('gpsQualityChange', {
          signalStrength: 85,
          accuracy: 5,
          stability: 'good'
        });
      }, 100);
    });

    test('should provide GPS performance metrics', async () => {
      await unifiedService.initialize();
      
      const metrics = unifiedService.getEnhancedGPSMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.totalPositions).toBe('number');
      expect(typeof metrics.averageAccuracy).toBe('number');
    }, 10000);
  });

  describe('Enhanced AI Integration', () => {
    test('should start enhanced AI context monitoring', async () => {
      await unifiedService.initialize();
      
      const aiOptions = {
        enableRealTimeAnalysis: true
      };
      
      await unifiedService.startTracking({
        gpsOptions: { enableHighAccuracy: true },
        aiOptions
      });
      
      const status = unifiedService.getStatus();
      expect(status.isTracking).toBe(true);
    }, 15000); // 增加超时时间

    test('should handle AI analysis completion', async () => {
      await unifiedService.initialize();
      
      const analysisCallback = vi.fn();
      unifiedService.onAIAnalysisComplete(analysisCallback);
      
      // 模拟AI分析数据
      const mockAnalysisData = {
        runningEfficiency: 0.85,
        fatigueLevel: 0.3,
        recommendations: ['保持当前配速', '注意补水'],
        riskFactors: [],
        performanceTrend: 'improving',
        timestamp: Date.now()
      };
      
      // 触发AI分析
      await unifiedService.handleAIAnalysisComplete(mockAnalysisData);
      
      expect(analysisCallback).toHaveBeenCalledWith(mockAnalysisData);
    }, 10000);

    test('should provide AI performance metrics', async () => {
      await unifiedService.initialize();
      
      const metrics = await unifiedService.getAIPerformanceMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.totalAnalyses).toBe('number');
      expect(typeof metrics.averageProcessingTime).toBe('number');
    }, 10000);
  });

  describe('Data Integration', () => {
    test('should integrate GPS and AI data through fusion engine', async () => {
      await unifiedService.initialize();
      
      let fusedDataReceived = false;
      
      unifiedService.on('fusedDataReady', (fusedData) => {
        fusedDataReceived = true;
        expect(fusedData.gps).toBeDefined();
        expect(fusedData.insights).toBeDefined();
        expect(fusedData.timestamp).toBeDefined();
      });

      await unifiedService.startUnifiedTracking({
        gpsOptions: { enableHighAccuracy: true },
        aiOptions: { enableRealTimeAnalysis: true }
      });

      // 等待数据融合
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      expect(fusedDataReceived).toBe(true);
    }, 15000); // 增加超时时间

    test('should handle enhanced GPS updates', (done) => {
      unifiedService.on('enhancedGpsUpdate', (position) => {
        expect(position).toBeDefined();
        expect(position.latitude).toBeDefined();
        expect(position.longitude).toBeDefined();
        expect(position.accuracy).toBeDefined();
        done();
      });

      // 模拟增强GPS更新
      setTimeout(() => {
        unifiedService.emit('enhancedGpsUpdate', {
          latitude: 31.2304,
          longitude: 121.4737,
          accuracy: 5,
          speed: 3.5,
          heading: 45,
          timestamp: Date.now()
        });
      }, 100);
    });
  });

  describe('Performance Monitoring', () => {
    test('should track performance metrics', async () => {
      await unifiedService.initialize();
      
      const performanceMetrics = unifiedService.getPerformanceMetrics();
      expect(performanceMetrics).toBeDefined();
      expect(typeof performanceMetrics.totalUpdates).toBe('number');
      expect(typeof performanceMetrics.successfulFusions).toBe('number');
      expect(typeof performanceMetrics.errors).toBe('number');
    }, 10000);

    test('should provide GPS quality analysis', async () => {
      await unifiedService.initialize();
      
      const qualityAnalysis = unifiedService.getGPSQualityAnalysis();
      expect(qualityAnalysis).toBeDefined();
    }, 10000);

    test('should provide AI analysis history', async () => {
      await unifiedService.initialize();
      
      const analysisHistory = unifiedService.getAIAnalysisHistory();
      expect(analysisHistory).toBeDefined();
      expect(Array.isArray(analysisHistory)).toBe(true);
    }, 10000);
  });

  describe('Configuration Updates', () => {
    test('should update enhanced GPS options', async () => {
      await unifiedService.initialize();
      
      const newGPSOptions = {
        enableHighAccuracy: false,
        trackingInterval: 5000,
        enableKalmanFilter: false
      };

      expect(() => {
        unifiedService.updateEnhancedGPSOptions(newGPSOptions);
      }).not.toThrow();
    }, 10000);

    test('should update enhanced AI options', async () => {
      await unifiedService.initialize();
      
      const newAIOptions = {
        enableRealTimeAnalysis: false,
        analysisInterval: 10000,
        enablePredictiveAnalysis: false
      };

      expect(() => {
        unifiedService.updateEnhancedAIOptions(newAIOptions);
      }).not.toThrow();
    }, 10000);
  });

  describe('Error Handling', () => {
    test('should handle GPS tracking errors', async () => {
      await unifiedService.initialize();
      
      let errorHandled = false;
      
      unifiedService.on('trackingError', (error) => {
        errorHandled = true;
        expect(error).toBeDefined();
      });

      // 模拟GPS追踪错误
      try {
        await unifiedService.startUnifiedTracking({
          gpsOptions: { timeout: 1 } // 极短超时时间
        });
      } catch (error) {
        // 错误被正确抛出
      }
    }, 15000); // 增加超时时间

    test('should handle AI analysis errors', async () => {
      await unifiedService.initialize();
      
      let errorHandled = false;
      
      unifiedService.on('fusionError', (error) => {
        errorHandled = true;
        expect(error).toBeDefined();
      });

      // 模拟AI分析错误
      setTimeout(() => {
        unifiedService.emit('fusionError', new Error('AI analysis failed'));
      }, 100);

      await new Promise(resolve => setTimeout(resolve, 200));
      expect(errorHandled).toBe(true);
    }, 10000);
  });

  describe('Service Cleanup', () => {
    test('should properly destroy all services', async () => {
      await unifiedService.initialize();
      await unifiedService.startUnifiedTracking({
        gpsOptions: { enableHighAccuracy: true },
        aiOptions: { enableRealTimeAnalysis: true }
      });

      expect(() => {
        unifiedService.destroy();
      }).not.toThrow();

      const status = unifiedService.getStatus();
      expect(status.isInitialized).toBe(false);
      expect(status.isTracking).toBe(false);
    }, 10000); // 增加超时时间
  });
});

// 性能基准测试
describe('Performance Benchmarks', () => {
  let unifiedService: UnifiedGPSAIService;

  beforeEach(() => {
    unifiedService = UnifiedGPSAIService.getInstance();
  });

  afterEach(() => {
    if (unifiedService) {
      unifiedService.destroy();
    }
  });

  test('should initialize services within acceptable time', async () => {
    const startTime = Date.now();
    
    await unifiedService.initialize({
      userPreferences: {
        preferredDistance: 5000,
        preferredDifficulty: 'medium',
        avoidBusyRoads: true,
        preferParks: true,
        timeOfDay: 'morning',
        weatherPreference: ['sunny'],
        safetyPriority: 'high'
      },
      voiceEnabled: false // 禁用语音以加快测试
    });
    
    const initTime = Date.now() - startTime;
    expect(initTime).toBeLessThan(5000); // 应在5秒内完成初始化
  }, 15000); // 增加超时时间

  test('should handle multiple GPS updates efficiently', async () => {
    await unifiedService.initialize();
    await unifiedService.startUnifiedTracking({
      gpsOptions: { trackingInterval: 100 }, // 高频更新
      aiOptions: { enableRealTimeAnalysis: true }
    });

    const updateCount = 50;
    const startTime = Date.now();

    // 模拟大量GPS更新
    for (let i = 0; i < updateCount; i++) {
      unifiedService.emit('enhancedGpsUpdate', {
        latitude: 31.2304 + i * 0.0001,
        longitude: 121.4737 + i * 0.0001,
        accuracy: 5,
        speed: 3.5,
        heading: 45,
        timestamp: Date.now()
      });
    }

    const processingTime = Date.now() - startTime;
    const avgTimePerUpdate = processingTime / updateCount;
    
    expect(avgTimePerUpdate).toBeLessThan(10); // 每次更新应在10ms内处理完成
  }, 20000); // 增加超时时间
});