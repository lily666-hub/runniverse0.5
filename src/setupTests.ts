// Jest setup file for global test configuration
import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn();

// Ensure we're in a browser-like environment
if (typeof window !== 'undefined') {
  // Mock Web APIs that might not be available in Node.js test environment
  Object.defineProperty(window, 'navigator', {
    value: {
      geolocation: {
        getCurrentPosition: jest.fn(),
        watchPosition: jest.fn(),
        clearWatch: jest.fn()
      },
      vibrate: jest.fn(),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    writable: true
  });

  // Mock performance API
  Object.defineProperty(window, 'performance', {
    value: {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByType: jest.fn(() => []),
      memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000
      }
    },
    writable: true
  });

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    })),
    writable: true
  });
}

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Mock console methods to avoid noise in test output
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
});

afterEach(() => {
  // Restore console methods after each test
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});

// Global test utilities
export const createMockLocation = (lat: number = 31.2304, lng: number = 121.4737) => ({
  lat,
  lng
});

export const createMockUserProfile = () => ({
  age: 25,
  weight: 70,
  height: 175,
  fitnessLevel: 'intermediate' as const,
  runningExperience: 12,
  preferredDistance: 5,
  healthConditions: []
});

export const createMockRoutePreferences = () => ({
  distance: 5,
  difficulty: 'medium' as const,
  scenery: 'park' as const,
  avoidTraffic: true,
  preferSafety: true,
  timeOfDay: 'morning' as const
});

export const createMockWaypoint = (name: string = 'Test Waypoint') => ({
  name,
  desc: `Description for ${name}`,
  lat: 31.2304 + Math.random() * 0.01,
  lng: 121.4737 + Math.random() * 0.01,
  safetyScore: 8,
  sceneryScore: 7,
  trafficLevel: 3
});

// Mock GPS Position
export const createMockGPSPosition = (accuracy: number = 10) => ({
  lat: 31.2304 + Math.random() * 0.001,
  lng: 121.4737 + Math.random() * 0.001,
  accuracy,
  altitude: 10 + Math.random() * 5,
  altitudeAccuracy: 5,
  heading: Math.random() * 360,
  speed: Math.random() * 10,
  timestamp: Date.now()
});

// Mock Route Data
export const createMockRoute = () => ({
  id: `route_${Date.now()}`,
  distance: 5000 + Math.random() * 3000,
  duration: 1800 + Math.random() * 900,
  coordinates: Array.from({ length: 10 }, (_, i) => [
    121.4737 + i * 0.001,
    31.2304 + i * 0.001
  ]),
  waypoints: [createMockWaypoint('起点'), createMockWaypoint('终点')],
  elevationProfile: Array.from({ length: 10 }, () => Math.random() * 50),
  safetyScore: 8,
  sceneryScore: 7
});

// Mock Performance Metrics
export const createMockPerformanceMetrics = () => ({
  name: 'test_operation',
  startTime: Date.now() - 1000,
  endTime: Date.now(),
  duration: 1000,
  metadata: {
    success: true,
    deviceType: 'desktop'
  }
});

// Mock Error
export const createMockError = (code: string = 'TEST_ERROR') => ({
  code,
  message: `Test error: ${code}`,
  timestamp: Date.now(),
  severity: 'medium' as const,
  context: 'test'
});

// Mock Device Info
export const createMockDeviceInfo = () => ({
  type: 'desktop' as const,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isTouchDevice: false,
  screenWidth: 1920,
  screenHeight: 1080,
  pixelRatio: 1,
  orientation: 'landscape' as const
});

// Test utilities for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const flushPromises = () => new Promise(resolve => setImmediate(resolve));

// Mock map service methods
export const createMockMapService = () => ({
  initialize: jest.fn().mockResolvedValue(undefined),
  addWaypoint: jest.fn(),
  removeWaypoint: jest.fn(),
  clearWaypoints: jest.fn(),
  planRoute: jest.fn().mockResolvedValue({
    success: true,
    route: createMockRoute()
  }),
  drawRoute: jest.fn(),
  clearRoute: jest.fn(),
  startNavigation: jest.fn(),
  stopNavigation: jest.fn(),
  startTracking: jest.fn(),
  stopTracking: jest.fn(),
  setCenter: jest.fn(),
  fitView: jest.fn(),
  updateCurrentPosition: jest.fn(),
  destroy: jest.fn(),
  on: jest.fn(),
  off: jest.fn()
});

// Mock voice service methods
export const createMockVoiceService = () => ({
  configure: jest.fn(),
  speak: jest.fn(),
  speakText: jest.fn(),
  stop: jest.fn(),
  getVoiceQualityInfo: jest.fn().mockReturnValue({
    quality: 'high',
    isOffline: true,
    currentVoice: { name: 'Test Voice' }
  }),
  setBestOfflineVoice: jest.fn(),
  destroy: jest.fn(),
  on: jest.fn(),
  off: jest.fn()
});