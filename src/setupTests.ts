// Vitest setup file for global test configuration
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Ensure we're in a browser-like environment
if (typeof window !== 'undefined') {
  // Mock Web APIs that might not be available in Node.js test environment
  Object.defineProperty(window, 'navigator', {
    value: {
      geolocation: {
        getCurrentPosition: vi.fn(),
        watchPosition: vi.fn(),
        clearWatch: vi.fn()
      },
      vibrate: vi.fn(),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    writable: true
  });

  // Mock performance API
  Object.defineProperty(window, 'performance', {
    value: {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByType: vi.fn(() => []),
      memory: {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0
      }
    },
    writable: true
  });

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });
}

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock as any;

// Reset mocks before each test
import { beforeEach, afterEach } from 'vitest';

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
  
  // Reset console methods
  console.error = vi.fn();
  console.warn = vi.fn();
  console.log = vi.fn();
});

afterEach(() => {
  // Cleanup after each test
  vi.clearAllTimers();
});

// Mock environment variables
process.env.VITE_AMAP_KEY = 'test-amap-key';
process.env.VITE_AMAP_SECURITY_CODE = 'test-security-code';
process.env.VITE_KIMI_API_KEY = 'test-kimi-key';
process.env.VITE_DEEPSEEK_API_KEY = 'test-deepseek-key';

// Mock AMap
if (typeof window !== 'undefined') {
  (window as any).AMap = {
    Map: vi.fn().mockImplementation(() => ({
      destroy: vi.fn(),
      clearMap: vi.fn(),
      setCenter: vi.fn(),
      setZoom: vi.fn(),
      add: vi.fn(),
      remove: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      plugin: vi.fn((plugins, callback) => {
        if (callback) callback();
      })
    })),
    Marker: vi.fn().mockImplementation(() => ({
      setMap: vi.fn(),
      setPosition: vi.fn(),
      getPosition: vi.fn(),
      setLabel: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    })),
    Polyline: vi.fn().mockImplementation(() => ({
      setMap: vi.fn(),
      setPath: vi.fn(),
      getPath: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    })),
    LngLat: vi.fn().mockImplementation((lng, lat) => ({ lng, lat })),
    Pixel: vi.fn().mockImplementation((x, y) => ({ x, y })),
    Size: vi.fn().mockImplementation((width, height) => ({ width, height })),
    Bounds: vi.fn().mockImplementation(() => ({
      contains: vi.fn(),
      getCenter: vi.fn(),
      getNorthEast: vi.fn(),
      getSouthWest: vi.fn()
    })),
    Icon: vi.fn().mockImplementation(() => ({})),
    InfoWindow: vi.fn().mockImplementation(() => ({
      open: vi.fn(),
      close: vi.fn(),
      setContent: vi.fn()
    })),
    Geolocation: vi.fn().mockImplementation(() => ({
      getCurrentPosition: vi.fn((callback) => {
        callback('complete', {
          position: { lng: 121.5, lat: 31.2 },
          accuracy: 10
        });
      })
    })),
    Walking: vi.fn().mockImplementation(() => ({
      search: vi.fn((points, callback) => {
        callback('complete', {
          routes: [{
            distance: 1000,
            time: 600,
            steps: []
          }]
        });
      })
    })),
    Scale: vi.fn(),
    ToolBar: vi.fn()
  };

  (window as any)._AMapSecurityConfig = {
    securityJsCode: 'test-security-code'
  };
}

// Mock IntelligentMapService
export const mockIntelligentMapService = {
  initialize: vi.fn().mockResolvedValue(undefined),
  addWaypoint: vi.fn(),
  removeWaypoint: vi.fn(),
  clearWaypoints: vi.fn(),
  planRoute: vi.fn().mockResolvedValue({
    success: true,
    route: { distance: 1000, duration: 600 }
  }),
  drawRoute: vi.fn(),
  clearRoute: vi.fn(),
  startNavigation: vi.fn(),
  stopNavigation: vi.fn(),
  startTracking: vi.fn(),
  stopTracking: vi.fn(),
  setCenter: vi.fn(),
  fitView: vi.fn(),
  updateCurrentPosition: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
};

// Mock VoiceNavigationService
export const mockVoiceNavigationService = {
  configure: vi.fn(),
  speak: vi.fn(),
  speakText: vi.fn(),
  stop: vi.fn(),
  getVoiceQualityInfo: vi.fn().mockReturnValue({
    hasOnlineVoice: true,
    hasOfflineVoice: false,
    recommendedVoice: 'online'
  }),
  setBestOfflineVoice: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
};
