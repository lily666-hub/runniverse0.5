import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntelligentRunningMap } from '../map/IntelligentRunningMap';
import type { IntelligentRunningMapRef } from '../../types/map';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the map service
const mockMapService = {
  initialize: vi.fn(),
  addWaypoint: vi.fn(),
  removeWaypoint: vi.fn(),
  clearWaypoints: vi.fn(),
  planRoute: vi.fn(),
  startNavigation: vi.fn(),
  startTracking: vi.fn(),
  stopTracking: vi.fn(),
  getCurrentPosition: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  destroy: vi.fn()
};

// Mock the voice service
const mockVoiceService = {
  configure: vi.fn(),
  speak: vi.fn(),
  stop: vi.fn(),
  setEnabled: vi.fn()
};

// Mock the utils
vi.mock('../../utils/performanceMonitor', () => ({
  performanceMonitor: {
    startPerformanceMetric: vi.fn(),
    endPerformanceMetric: vi.fn(),
    measureAsyncOperation: vi.fn().mockImplementation(async (_name: string, operation: () => Promise<unknown>) => {
      return await operation();
    }),
    getPerformanceReport: vi.fn().mockReturnValue({
      metrics: [],
      summary: { totalOperations: 0, averageTime: 0, slowestOperation: null }
    })
  }
}));

vi.mock('../../utils/errorHandler', () => ({
  errorHandler: {
    handleAsyncError: vi.fn().mockImplementation(async (operation: () => Promise<unknown>) => {
      return await operation();
    }),
    handleSyncError: vi.fn().mockImplementation((operation: () => unknown) => {
      return operation();
    }),
    logError: vi.fn(),
    getRecentErrors: vi.fn().mockReturnValue([]),
    clearErrorLog: vi.fn()
  }
}));

vi.mock('../../utils/vibration', () => ({
  MapVibration: {
    gpsLocked: vi.fn(),
    gpsLost: vi.fn(),
    trackingStarted: vi.fn(),
    trackingStopped: vi.fn(),
    routePlanned: vi.fn(),
    navigationStarted: vi.fn(),
    navigationEnded: vi.fn(),
    waypointReached: vi.fn(),
    routeDeviation: vi.fn(),
    operationSuccess: vi.fn(),
    operationError: vi.fn(),
    buttonClick: vi.fn()
  }
}));

vi.mock('../../utils/responsive', () => ({
  ResponsiveUtils: {
    getDeviceType: vi.fn().mockReturnValue('desktop'),
    isMobile: vi.fn().mockReturnValue(false),
    isTablet: vi.fn().mockReturnValue(false),
    isDesktop: vi.fn().mockReturnValue(true),
    getDeviceInfo: vi.fn().mockReturnValue({
      type: 'desktop',
      viewport: { width: 1920, height: 1080 },
      isTouchDevice: false
    })
  }
}));

// Mock services
vi.mock('../../services/IntelligentMapService', () => ({
  IntelligentMapService: vi.fn().mockImplementation(() => mockMapService)
}));

vi.mock('../../services/VoiceNavigationService', () => ({
  VoiceNavigationService: vi.fn().mockImplementation(() => mockVoiceService)
}));

// Mock toast
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
};

vi.mock('sonner', () => ({
  toast: mockToast
}));

describe('IntelligentRunningMap', () => {
  const defaultProps = {
    onLocationUpdate: vi.fn(),
    onRouteUpdate: vi.fn(),
    onNavigationUpdate: vi.fn(),
    onError: vi.fn(),
    className: 'test-map',
    mode: 'planning' as const
  };

  let mapRef: React.RefObject<IntelligentRunningMapRef>;

  beforeEach(() => {
    vi.clearAllMocks();
    mapRef = React.createRef<IntelligentRunningMapRef>();
    
    // Reset mock implementations
    mockMapService.initialize.mockResolvedValue(undefined);
    mockMapService.planRoute.mockResolvedValue({
      distance: 1000,
      duration: 600,
      waypoints: []
    });
    mockMapService.startNavigation.mockResolvedValue(undefined);
    mockMapService.startTracking.mockResolvedValue(undefined);
    mockMapService.getCurrentPosition.mockResolvedValue({
      latitude: 31.2304,
      longitude: 121.4737,
      accuracy: 10,
      timestamp: Date.now()
    });
  });

  describe('Rendering', () => {
    it('should render map container', () => {
      render(<IntelligentRunningMap {...defaultProps} />);
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
      expect(mapContainer).toHaveClass('test-map');
    });

    it('should show loading skeleton initially', () => {
      render(<IntelligentRunningMap {...defaultProps} />);
      
      expect(screen.getByTestId('map-loading-skeleton')).toBeInTheDocument();
      expect(screen.getByText(/正在初始化地图/)).toBeInTheDocument();
    });

    it('should show GPS status indicator', () => {
      render(<IntelligentRunningMap {...defaultProps} />);
      
      expect(screen.getByTestId('gps-status')).toBeInTheDocument();
    });

    it('should show tracking status indicator', () => {
      render(<IntelligentRunningMap {...defaultProps} />);
      
      expect(screen.getByTestId('tracking-status')).toBeInTheDocument();
    });

    it('should show navigation status indicator', () => {
      render(<IntelligentRunningMap {...defaultProps} />);
      
      expect(screen.getByTestId('navigation-status')).toBeInTheDocument();
    });
  });

  describe('Initialization', () => {
    it('should initialize map service on mount', async () => {
      render(<IntelligentRunningMap {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockMapService.initialize).toHaveBeenCalled();
      });
    });

    it('should handle initialization success', async () => {
      render(<IntelligentRunningMap {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('地图初始化成功');
      });
    });

    it('should handle initialization failure', async () => {
      const error = new Error('Initialization failed');
      mockMapService.initialize.mockRejectedValue(error);
      
      render(<IntelligentRunningMap {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled();
        expect(defaultProps.onError).toHaveBeenCalledWith(error);
      });
    });

    it('should show retry button on initialization failure', async () => {
      mockMapService.initialize.mockRejectedValue(new Error('Failed'));
      
      render(<IntelligentRunningMap {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('重试')).toBeInTheDocument();
      });
    });
  });

  describe('Waypoint Management', () => {
    it('should add waypoint through ref', async () => {
      render(<IntelligentRunningMap {...defaultProps} ref={mapRef} />);
      
      await waitFor(() => {
        expect(mockMapService.initialize).toHaveBeenCalled();
      });

      const waypoint = { 
        id: 'test-waypoint-1',
        lat: 31.2304, 
        lng: 121.4737, 
        name: 'Test Point' 
      };
      
      act(() => {
        mapRef.current?.addWaypoint(waypoint);
      });

      expect(mockMapService.addWaypoint).toHaveBeenCalledWith(waypoint);
    });

    it('should remove waypoint through ref', async () => {
      render(<IntelligentRunningMap {...defaultProps} ref={mapRef} />);
      
      await waitFor(() => {
        expect(mockMapService.initialize).toHaveBeenCalled();
      });

      act(() => {
        mapRef.current?.removeWaypoint('test-waypoint-1');
      });

      expect(mockMapService.removeWaypoint).toHaveBeenCalledWith('test-waypoint-1');
    });

    it('should clear waypoints through ref', async () => {
      render(<IntelligentRunningMap {...defaultProps} ref={mapRef} />);
      
      await waitFor(() => {
        expect(mockMapService.initialize).toHaveBeenCalled();
      });

      act(() => {
        mapRef.current?.clearWaypoints();
      });

      expect(mockMapService.clearWaypoints).toHaveBeenCalled();
    });
  });

  describe('Route Planning', () => {
    it('should plan route through ref', async () => {
      render(<IntelligentRunningMap {...defaultProps} ref={mapRef} />);
      
      await waitFor(() => {
        expect(mockMapService.initialize).toHaveBeenCalled();
      });

      await act(async () => {
        await mapRef.current?.planRoute();
      });

      expect(mockMapService.planRoute).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith('路线规划成功');
    });

    it('should handle route planning failure', async () => {
      const error = new Error('Route planning failed');
      mockMapService.planRoute.mockRejectedValue(error);
      
      render(<IntelligentRunningMap {...defaultProps} ref={mapRef} />);
      
      await waitFor(() => {
        expect(mockMapService.initialize).toHaveBeenCalled();
      });

      await act(async () => {
        await mapRef.current?.planRoute();
      });

      expect(mockToast.error).toHaveBeenCalled();
      expect(defaultProps.onError).toHaveBeenCalledWith(error);
    });
  });

  describe('Navigation', () => {
    it('should start navigation through ref', async () => {
      render(<IntelligentRunningMap {...defaultProps} ref={mapRef} />);
      
      await waitFor(() => {
        expect(mockMapService.initialize).toHaveBeenCalled();
      });

      await act(async () => {
        await mapRef.current?.startNavigation();
      });

      expect(mockMapService.startNavigation).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith('导航已开始');
    });

    it('should handle navigation start failure', async () => {
      const error = new Error('Navigation failed');
      mockMapService.startNavigation.mockRejectedValue(error);
      
      render(<IntelligentRunningMap {...defaultProps} ref={mapRef} />);
      
      await waitFor(() => {
        expect(mockMapService.initialize).toHaveBeenCalled();
      });

      await act(async () => {
        await mapRef.current?.startNavigation();
      });

      expect(mockToast.error).toHaveBeenCalled();
      expect(defaultProps.onError).toHaveBeenCalledWith(error);
    });
  });

  describe('Tracking', () => {
    it('should start tracking through ref', async () => {
      render(<IntelligentRunningMap {...defaultProps} ref={mapRef} />);
      
      await waitFor(() => {
        expect(mockMapService.initialize).toHaveBeenCalled();
      });

      await act(async () => {
        await mapRef.current?.startTracking();
      });

      expect(mockMapService.startTracking).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith('位置追踪已开始');
    });

    it('should stop tracking through ref', async () => {
      render(<IntelligentRunningMap {...defaultProps} ref={mapRef} />);
      
      await waitFor(() => {
        expect(mockMapService.initialize).toHaveBeenCalled();
      });

      act(() => {
        mapRef.current?.stopTracking();
      });

      expect(mockMapService.stopTracking).toHaveBeenCalled();
    });

    it('should handle tracking start failure', async () => {
      const error = new Error('Tracking failed');
      mockMapService.startTracking.mockRejectedValue(error);
      
      render(<IntelligentRunningMap {...defaultProps} ref={mapRef} />);
      
      await waitFor(() => {
        expect(mockMapService.initialize).toHaveBeenCalled();
      });

      await act(async () => {
        await mapRef.current?.startTracking();
      });

      expect(mockToast.error).toHaveBeenCalled();
      expect(defaultProps.onError).toHaveBeenCalledWith(error);
    });
  });

  describe('Error Handling', () => {
    it('should handle map service errors gracefully', async () => {
      const error = new Error('Map service error');
      mockMapService.initialize.mockRejectedValue(error);
      
      render(<IntelligentRunningMap {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/地图初始化失败/)).toBeInTheDocument();
        expect(screen.getByText('重试')).toBeInTheDocument();
      });
    });

    it('should retry initialization when retry button is clicked', async () => {
      mockMapService.initialize
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce(undefined);
      
      render(<IntelligentRunningMap {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('重试')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('重试'));
      
      await waitFor(() => {
        expect(mockMapService.initialize).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile device', () => {
      const { ResponsiveUtils } = require('../../utils/responsive');
      ResponsiveUtils.isMobile.mockReturnValue(true);
      ResponsiveUtils.getDeviceType.mockReturnValue('mobile');
      
      render(<IntelligentRunningMap {...defaultProps} />);
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toHaveClass('h-screen');
    });

    it('should adapt to desktop device', () => {
      const { ResponsiveUtils } = require('../../utils/responsive');
      ResponsiveUtils.isMobile.mockReturnValue(false);
      ResponsiveUtils.getDeviceType.mockReturnValue('desktop');
      
      render(<IntelligentRunningMap {...defaultProps} />);
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toHaveClass('h-96');
    });
  });

  describe('Performance Monitoring', () => {
    it('should track initialization performance', async () => {
      const { performanceMonitor } = require('../../utils/performanceMonitor');
      
      render(<IntelligentRunningMap {...defaultProps} />);
      
      await waitFor(() => {
        expect(performanceMonitor.startPerformanceMetric).toHaveBeenCalledWith('map-initialization');
        expect(performanceMonitor.endPerformanceMetric).toHaveBeenCalledWith('map-initialization');
      });
    });

    it('should show performance metrics in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      render(<IntelligentRunningMap {...defaultProps} />);
      
      expect(screen.getByTestId('performance-panel')).toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on unmount', async () => {
      const { unmount } = render(<IntelligentRunningMap {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockMapService.initialize).toHaveBeenCalled();
      });

      unmount();
      
      expect(mockMapService.destroy).toHaveBeenCalled();
    });
  });
});