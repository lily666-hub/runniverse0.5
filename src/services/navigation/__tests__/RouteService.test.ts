import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RouteService } from '../RouteService';
import type { RoutePlanRequest, Waypoint } from '../../../types/navigation';

// Mock fetch globally
global.fetch = vi.fn();

// Mock environment variables
const mockEnvConfig = {
  AMAP_API_KEY: 'test-api-key'
};

// Mock window.ENV_CONFIG
Object.defineProperty(window, 'ENV_CONFIG', {
  value: mockEnvConfig,
  writable: true
});

describe('RouteService', () => {
  const mockWaypoints: Waypoint[] = [
    { id: 'start', name: '起点', lat: 31.2304, lng: 121.4737 },
    { id: 'end', name: '终点', lat: 31.2404, lng: 121.4837 }
  ];

  const mockRequest: RoutePlanRequest = {
    waypoints: mockWaypoints,
    strategy: 'fastest'
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Reset fetch mock
    (fetch as any).mockClear();
    
    // Reset console methods
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    vi.restoreAllMocks();
  });

  describe('planWalkingRoute', () => {
    describe('with valid API key', () => {
      it('should successfully plan a route with real API', async () => {
        const mockApiResponse = {
          status: '1',
          info: 'OK',
          route: {
            paths: [{
              distance: '1000',
              duration: '720',
              steps: [{
                instruction: '向北步行100米',
                distance: '100',
                duration: '72',
                road: '南京路',
                orientation: '北',
                action: 'straight',
                polyline: '121.4737,31.2304;121.4737,31.2314'
              }],
              polyline: '121.4737,31.2304;121.4737,31.2314;121.4837,31.2404'
            }]
          }
        };

        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse
        } as Response);

        const result = await RouteService.planWalkingRoute(mockRequest);

        expect(result.success).toBe(true);
        expect(result.route).toBeDefined();
        expect(result.route!.waypoints).toEqual(mockWaypoints);
        expect(result.route!.steps).toHaveLength(1);
        expect(result.route!.totalDistance).toBe(100);
        expect(result.route!.totalDuration).toBe(72);
      });

      it('should handle API error response', async () => {
        const mockApiResponse = {
          status: '0',
          info: 'INVALID_PARAMS',
          infocode: '20001'
        };

        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse
        } as Response);

        const result = await RouteService.planWalkingRoute(mockRequest);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error!.code).toBe('API_ERROR');
        expect(result.error!.message).toContain('INVALID_PARAMS');
      });

      it('should handle network error with retry', async () => {
        // First two calls fail, third succeeds
        (fetch as any)
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              status: '1',
              info: 'OK',
              route: { paths: [{ distance: '1000', duration: '720', steps: [] }] }
            })
          } as Response);

        const result = await RouteService.planWalkingRoute(mockRequest);

        expect(fetch).toHaveBeenCalledTimes(3);
        expect(result.success).toBe(true);
      });

      it('should fail after max retries', async () => {
        (fetch as any)
          .mockRejectedValue(new Error('Network error'));

        const result = await RouteService.planWalkingRoute(mockRequest);

        expect(fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
        expect(result.success).toBe(false);
        expect(result.error!.code).toBe('NETWORK_ERROR');
      });

      it('should handle HTTP error status', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        } as Response);

        const result = await RouteService.planWalkingRoute(mockRequest);

        expect(result.success).toBe(false);
        expect(result.error!.code).toBe('HTTP_ERROR');
        expect(result.error!.message).toContain('500');
      });

      it('should handle JSON parse error', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => { throw new Error('Invalid JSON'); }
        } as Response);

        const result = await RouteService.planWalkingRoute(mockRequest);

        expect(result.success).toBe(false);
        expect(result.error!.code).toBe('PARSE_ERROR');
      });

      it('should support different route strategies', async () => {
        const strategies = ['fastest', 'shortest', 'comfortable', 'safe'];
        
        for (const strategy of strategies) {
          (fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              status: '1',
              info: 'OK',
              route: { paths: [{ distance: '1000', duration: '720', steps: [] }] }
            })
          } as Response);

          const request = { ...mockRequest, strategy };
          const result = await RouteService.planWalkingRoute(request);

          expect(result.success).toBe(true);
          expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining(`strategy=${RouteService['getStrategyCode'](strategy)}`),
            expect.any(Object)
          );
        }
      });
    });

    describe('without API key (mock mode)', () => {
      beforeEach(() => {
        // Remove API key to trigger mock mode
        delete (window as any).ENV_CONFIG;
        delete process.env.VITE_AMAP_API_KEY;
      });

      it('should generate mock route when API key is missing', async () => {
        const result = await RouteService.planWalkingRoute(mockRequest);

        expect(result.success).toBe(true);
        expect(result.route).toBeDefined();
        expect(result.route!.waypoints).toEqual(mockWaypoints);
        expect(result.route!.steps.length).toBeGreaterThan(0);
        expect(result.route!.totalDistance).toBeGreaterThan(0);
        expect(result.route!.totalDuration).toBeGreaterThan(0);
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining('高德地图API Key未配置')
        );
      });

      it('should generate realistic mock data', async () => {
        const result = await RouteService.planWalkingRoute(mockRequest);

        expect(result.success).toBe(true);
        const route = result.route!;
        
        // Check route structure
        expect(route.id).toMatch(/^mock-route-\d+$/);
        expect(route.steps).toHaveLength(1); // One step for two waypoints
        expect(route.segments).toHaveLength(1);
        expect(route.polyline).toBeTruthy();
        expect(route.bounds).toHaveLength(2);
        
        // Check step details
        const step = route.steps[0];
        expect(step.instruction).toBeTruthy();
        expect(step.distance).toBeGreaterThan(0);
        expect(step.duration).toBeGreaterThan(0);
        expect(step.orientation).toBeTruthy();
      });
    });

    describe('input validation', () => {
      it('should reject empty waypoints', async () => {
        const invalidRequest = { ...mockRequest, waypoints: [] };
        
        const result = await RouteService.planWalkingRoute(invalidRequest);
        
        expect(result.success).toBe(false);
        expect(result.error!.code).toBe('INVALID_PARAMS');
        expect(result.error!.message).toContain('至少需要2个途径点');
      });

      it('should reject single waypoint', async () => {
        const invalidRequest = { ...mockRequest, waypoints: [mockWaypoints[0]] };
        
        const result = await RouteService.planWalkingRoute(invalidRequest);
        
        expect(result.success).toBe(false);
        expect(result.error!.code).toBe('INVALID_PARAMS');
      });

      it('should reject waypoints with invalid coordinates', async () => {
        const invalidWaypoints = [
          { id: 'start', name: '起点', lat: 91, lng: 121.4737 }, // Invalid lat
          { id: 'end', name: '终点', lat: 31.2404, lng: 181 } // Invalid lng
        ];
        const invalidRequest = { ...mockRequest, waypoints: invalidWaypoints };
        
        const result = await RouteService.planWalkingRoute(invalidRequest);
        
        expect(result.success).toBe(false);
        expect(result.error!.code).toBe('INVALID_PARAMS');
        expect(result.error!.message).toContain('坐标范围无效');
      });
    });
  });

  describe('optimizeRoute', () => {
    it('should return original route for 2 waypoints', () => {
      const result = RouteService.optimizeRoute(mockWaypoints);
      expect(result).toEqual(mockWaypoints);
    });

    it('should optimize route with multiple waypoints', () => {
      const waypoints: Waypoint[] = [
        { id: 'start', name: '起点', lat: 31.2304, lng: 121.4737 },
        { id: 'point1', name: '点1', lat: 31.2504, lng: 121.4937 },
        { id: 'point2', name: '点2', lat: 31.2354, lng: 121.4787 },
        { id: 'end', name: '终点', lat: 31.2404, lng: 121.4837 }
      ];

      const result = RouteService.optimizeRoute(waypoints);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual(waypoints[0]); // Start point unchanged
      expect(result[result.length - 1]).toEqual(waypoints[waypoints.length - 1]); // End point unchanged
      
      // Middle points should be reordered for optimization
      expect(result[1].id).toBe('point2'); // Closer to start
      expect(result[2].id).toBe('point1'); // Further from start
    });

    it('should handle single waypoint', () => {
      const singleWaypoint = [mockWaypoints[0]];
      const result = RouteService.optimizeRoute(singleWaypoint);
      expect(result).toEqual(singleWaypoint);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // Distance between Shanghai landmarks (approximate)
      const distance = RouteService['calculateDistance'](
        31.2304, 121.4737, // People's Square
        31.2404, 121.4837  // Nearby point
      );

      expect(distance).toBeGreaterThan(1000); // Should be > 1km
      expect(distance).toBeLessThan(2000);    // Should be < 2km
    });

    it('should return 0 for same coordinates', () => {
      const distance = RouteService['calculateDistance'](
        31.2304, 121.4737,
        31.2304, 121.4737
      );

      expect(distance).toBe(0);
    });

    it('should handle edge cases', () => {
      // Test with extreme coordinates
      const distance1 = RouteService['calculateDistance'](0, 0, 0, 1);
      const distance2 = RouteService['calculateDistance'](90, 0, -90, 0);

      expect(distance1).toBeGreaterThan(0);
      expect(distance2).toBeGreaterThan(0);
    });
  });

  describe('generateMockRoute', () => {
    it('should generate realistic mock route data', () => {
      const result = RouteService['generateMockRoute'](mockRequest);

      expect(result.success).toBe(true);
      expect(result.route).toBeDefined();

      const route = result.route!;
      expect(route.id).toMatch(/^mock-route-\d+$/);
      expect(route.waypoints).toEqual(mockWaypoints);
      expect(route.steps).toHaveLength(1);
      expect(route.segments).toHaveLength(1);
      expect(route.totalDistance).toBeGreaterThan(0);
      expect(route.totalDuration).toBeGreaterThan(0);
      expect(route.polyline).toBeTruthy();
      expect(route.bounds).toHaveLength(2);
    });

    it('should generate multiple steps for multiple waypoints', () => {
      const multiWaypoints: Waypoint[] = [
        { id: 'start', name: '起点', lat: 31.2304, lng: 121.4737 },
        { id: 'middle', name: '中点', lat: 31.2354, lng: 121.4787 },
        { id: 'end', name: '终点', lat: 31.2404, lng: 121.4837 }
      ];

      const multiRequest = { ...mockRequest, waypoints: multiWaypoints };
      const result = RouteService['generateMockRoute'](multiRequest);

      expect(result.success).toBe(true);
      expect(result.route!.steps).toHaveLength(2); // n-1 steps for n waypoints
      expect(result.route!.segments).toHaveLength(2);
    });

    it('should generate proper navigation instructions', () => {
      const result = RouteService['generateMockRoute'](mockRequest);
      const step = result.route!.steps[0];

      expect(step.instruction).toBeTruthy();
      expect(step.road).toBeTruthy();
      expect(step.orientation).toMatch(/^(北|东北|东|东南|南|西南|西|西北)$/);
      expect(step.action).toMatch(/^(start|straight|finish)$/);
    });
  });

  describe('utility methods', () => {
    describe('calculateBearing', () => {
      it('should calculate bearing correctly', () => {
        const bearing = RouteService['calculateBearing'](
          31.2304, 121.4737,
          31.2404, 121.4837
        );

        expect(bearing).toMatch(/^(北|东北|东|东南|南|西南|西|西北)$/);
      });

      it('should return correct directions for cardinal points', () => {
        // North
        const north = RouteService['calculateBearing'](0, 0, 1, 0);
        expect(north).toBe('北');

        // East
        const east = RouteService['calculateBearing'](0, 0, 0, 1);
        expect(east).toBe('东');
      });
    });

    describe('parsePolyline', () => {
      it('should parse polyline string correctly', () => {
        const polyline = '121.4737,31.2304;121.4787,31.2354;121.4837,31.2404';
        const result = RouteService['parsePolyline'](polyline);

        expect(result).toHaveLength(3);
        expect(result[0]).toEqual([121.4737, 31.2304]);
        expect(result[1]).toEqual([121.4787, 31.2354]);
        expect(result[2]).toEqual([121.4837, 31.2404]);
      });

      it('should handle empty polyline', () => {
        const result = RouteService['parsePolyline']('');
        expect(result).toEqual([]);
      });
    });

    describe('calculateBounds', () => {
      it('should calculate bounds correctly', () => {
        const segments = [{
          id: 'test',
          coordinates: [[121.4737, 31.2304], [121.4837, 31.2404]] as Array<[number, number]>,
          distance: 1000,
          duration: 720
        }];

        const bounds = RouteService['calculateBounds'](segments);

        expect(bounds).toHaveLength(2);
        expect(bounds[0]).toEqual([121.4737, 31.2304]); // min
        expect(bounds[1]).toEqual([121.4837, 31.2404]); // max
      });
    });
  });

  describe('error handling', () => {
    it('should handle malformed API response', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' })
      } as Response);

      const result = await RouteService.planWalkingRoute(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('ROUTE_NOT_FOUND');
    });

    it('should handle timeout errors', async () => {
      (fetch as any).mockImplementationOnce(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const result = await RouteService.planWalkingRoute(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('NETWORK_ERROR');
    });
  });

  describe('performance tests', () => {
    it('should handle large number of waypoints efficiently', () => {
      const manyWaypoints: Waypoint[] = [];
      for (let i = 0; i < 100; i++) {
        manyWaypoints.push({
          id: `point-${i}`,
          name: `点${i}`,
          lat: 31.2304 + i * 0.001,
          lng: 121.4737 + i * 0.001
        });
      }

      const start = Date.now();
      const result = RouteService.optimizeRoute(manyWaypoints);
      const duration = Date.now() - start;

      expect(result).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should generate mock route quickly', () => {
      const start = Date.now();
      const result = RouteService['generateMockRoute'](mockRequest);
      const duration = Date.now() - start;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });
  });
});