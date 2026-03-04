// 智能路线服务单元测试
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IntelligentRouteService } from '../intelligentRouteService';
import { 
  UserProfile, 
  RoutePreferences, 
  LocationPoint, 
  WaypointData,
  RouteGenerationConfig 
} from '../../../../types/route';

// Mock services
class MockAmapService {
  async calculateRoute() {
    return {
      distance: 5000,
      duration: 1800,
      path: [
        { lat: 31.2304, lng: 121.4737 },
        { lat: 31.2314, lng: 121.4747 }
      ]
    };
  }
}

class MockKimiService {
  async generateResponse() {
    return 'Mock AI response';
  }
}

class MockSafetyAnalysisService {
  async analyzeRoute() {
    return {
      safetyScore: 8.5,
      risks: [],
      recommendations: []
    };
  }
}

// Mock 外部依赖
vi.mock('../../../../utils/errorHandler', () => ({
  errorHandler: {
    createError: vi.fn((code: string, message: string) => new Error(message)),
    handleAsyncError: vi.fn((fn: Function) => fn()),
    validateLocation: vi.fn(() => true),
    validateDistance: vi.fn(() => true),
    validateWaypoints: vi.fn(() => true)
  },
  ERROR_CODES: {
    INVALID_CONFIG: 'INVALID_CONFIG',
    INVALID_PARAMS: 'INVALID_PARAMS',
    ROUTE_GENERATION_FAILED: 'ROUTE_GENERATION_FAILED'
  },
  handleAsyncError: vi.fn((fn: Function) => fn()),
  createRouteError: vi.fn((code: string, message: string) => new Error(message))
}));

vi.mock('../../../../utils/performanceMonitor', () => ({
  measureAsyncPerformance: vi.fn(async (name: string, fn: Function) => ({ result: await fn(), duration: 100 })),
  measureSyncPerformance: vi.fn((name: string, fn: Function) => ({ result: fn(), duration: 50 })),
  performanceMonitor: {
    startMetric: vi.fn(() => 'metric-id'),
    endMetric: vi.fn()
  }
}));

describe('IntelligentRouteService', () => {
  let service: IntelligentRouteService;
  let mockAmapService: MockAmapService;
  let mockKimiService: MockKimiService;
  let mockSafetyService: MockSafetyAnalysisService;
  let mockUserProfile: UserProfile;
  let mockPreferences: RoutePreferences;
  let mockLocation: LocationPoint;
  let mockWaypoints: WaypointData[];

  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks();

    // 创建 mock 服务实例
    mockAmapService = new MockAmapService();
    mockKimiService = new MockKimiService();
    mockSafetyService = new MockSafetyAnalysisService();

    // 测试数据
    mockUserProfile = {
      age: 25,
      weight: 70,
      height: 175,
      fitnessLevel: 'intermediate',
      runningExperience: 12,
      preferredDistance: 5,
      healthConditions: []
    };

    mockPreferences = {
      distance: 5,
      difficulty: 'medium',
      scenery: 'park',
      avoidTraffic: true,
      preferSafety: true,
      timeOfDay: 'morning'
    };

    mockLocation = {
      lat: 31.2304,
      lng: 121.4737
    };

    mockWaypoints = [
      {
        name: '人民公园',
        desc: '市中心公园',
        lat: 31.2314,
        lng: 121.4747,
        safetyScore: 9,
        sceneryScore: 8,
        trafficLevel: 2
      },
      {
        name: '外滩',
        desc: '黄浦江畔',
        lat: 31.2396,
        lng: 121.4990,
        safetyScore: 7,
        sceneryScore: 10,
        trafficLevel: 8
      }
    ];

    // 创建服务实例
    service = new IntelligentRouteService(
      mockAmapService as any,
      mockKimiService as any,
      mockSafetyService as any
    );
  });

  describe('构造函数和初始化', () => {
    it('应该正确初始化服务', () => {
      expect(service).toBeInstanceOf(IntelligentRouteService);
    });

    it('应该在传入null服务时使用默认服务', () => {
      expect(() => {
        new IntelligentRouteService(null as any, mockKimiService as any, mockSafetyService as any);
      }).not.toThrow();
    });

    it('应该使用默认配置', () => {
      const serviceWithDefaults = new IntelligentRouteService(
        mockAmapService as any,
        mockKimiService as any,
        mockSafetyService as any
      );
      expect(serviceWithDefaults).toBeInstanceOf(IntelligentRouteService);
    });
  });

  describe('输入验证', () => {
    it('应该验证用户画像', () => {
      const invalidProfile = { ...mockUserProfile, age: -1 };
      
      expect(() => {
        (service as any).validateInputs(invalidProfile, mockPreferences, mockLocation, mockWaypoints);
      }).toThrow();
    });

    it('应该验证路线偏好', () => {
      const invalidPreferences = { ...mockPreferences, distance: -1 };
      
      expect(() => {
        (service as any).validateInputs(mockUserProfile, invalidPreferences, mockLocation, mockWaypoints);
      }).toThrow();
    });

    it('应该验证位置坐标', () => {
      const invalidLocation = { lat: 200, lng: 200 };
      
      expect(() => {
        (service as any).validateInputs(mockUserProfile, mockPreferences, invalidLocation, mockWaypoints);
      }).toThrow();
    });

    it('应该验证途径点数据', () => {
      const invalidWaypoints = [{ ...mockWaypoints[0], name: '' }];
      
      expect(() => {
        (service as any).validateInputs(mockUserProfile, mockPreferences, mockLocation, invalidWaypoints);
      }).toThrow();
    });

    it('应该通过有效输入验证', () => {
      expect(() => {
        (service as any).validateInputs(mockUserProfile, mockPreferences, mockLocation, mockWaypoints);
      }).not.toThrow();
    });
  });

  describe('坐标验证', () => {
    it('应该验证有效纬度', () => {
      expect((service as any).isValidLatitude(31.2304)).toBe(true);
      expect((service as any).isValidLatitude(0)).toBe(true);
      expect((service as any).isValidLatitude(-90)).toBe(true);
      expect((service as any).isValidLatitude(90)).toBe(true);
    });

    it('应该拒绝无效纬度', () => {
      expect((service as any).isValidLatitude(-91)).toBe(false);
      expect((service as any).isValidLatitude(91)).toBe(false);
      expect((service as any).isValidLatitude(NaN)).toBe(false);
      expect((service as any).isValidLatitude('invalid' as any)).toBe(false);
    });

    it('应该验证有效经度', () => {
      expect((service as any).isValidLongitude(121.4737)).toBe(true);
      expect((service as any).isValidLongitude(0)).toBe(true);
      expect((service as any).isValidLongitude(-180)).toBe(true);
      expect((service as any).isValidLongitude(180)).toBe(true);
    });

    it('应该拒绝无效经度', () => {
      expect((service as any).isValidLongitude(-181)).toBe(false);
      expect((service as any).isValidLongitude(181)).toBe(false);
      expect((service as any).isValidLongitude(NaN)).toBe(false);
      expect((service as any).isValidLongitude('invalid' as any)).toBe(false);
    });
  });

  describe('边界条件测试', () => {
    it('应该处理空途径点列表', () => {
      expect(() => {
        (service as any).validateInputs(mockUserProfile, mockPreferences, mockLocation, []);
      }).not.toThrow(); // 应该只产生警告，不抛出错误
    });

    it('应该处理极限年龄值', () => {
      const minAgeProfile = { ...mockUserProfile, age: 10 };
      const maxAgeProfile = { ...mockUserProfile, age: 100 };
      
      expect(() => {
        (service as any).validateInputs(minAgeProfile, mockPreferences, mockLocation, mockWaypoints);
      }).not.toThrow();
      
      expect(() => {
        (service as any).validateInputs(maxAgeProfile, mockPreferences, mockLocation, mockWaypoints);
      }).not.toThrow();
    });

    it('应该处理极限距离值', () => {
      const minDistancePrefs = { ...mockPreferences, distance: 0.5 };
      const maxDistancePrefs = { ...mockPreferences, distance: 50 };
      
      expect(() => {
        (service as any).validateInputs(mockUserProfile, minDistancePrefs, mockLocation, mockWaypoints);
      }).not.toThrow();
      
      expect(() => {
        (service as any).validateInputs(mockUserProfile, maxDistancePrefs, mockLocation, mockWaypoints);
      }).not.toThrow();
    });
  });

  describe('错误处理', () => {
    it('应该处理null输入', () => {
      expect(() => {
        (service as any).validateInputs(null, mockPreferences, mockLocation, mockWaypoints);
      }).toThrow();
    });

    it('应该处理undefined输入', () => {
      expect(() => {
        (service as any).validateInputs(mockUserProfile, undefined, mockLocation, mockWaypoints);
      }).toThrow();
    });

    it('应该处理无效的枚举值', () => {
      const invalidProfile = { ...mockUserProfile, fitnessLevel: 'invalid' as any };
      
      expect(() => {
        (service as any).validateInputs(invalidProfile, mockPreferences, mockLocation, mockWaypoints);
      }).toThrow();
    });
  });
});