import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import IntelligentRunningMap from '../IntelligentRunningMap';

// 模拟依赖
vi.mock('../../../hooks/useGPS', () => ({
  default: () => ({
    position: { lng: 121.5, lat: 31.2 },
    accuracy: 10,
    isEnabled: true,
    isLoading: false,
    error: null,
    enableGPS: vi.fn(),
    disableGPS: vi.fn(),
    getCurrentPosition: vi.fn()
  })
}));

vi.mock('../../../hooks/useTracking', () => ({
  default: () => ({
    isTracking: false,
    isPaused: false,
    trackingData: null,
    startTracking: vi.fn(),
    stopTracking: vi.fn(),
    pauseTracking: vi.fn(),
    resumeTracking: vi.fn(),
    clearTrackingData: vi.fn()
  })
}));

vi.mock('../../../hooks/useNavigation', () => ({
  default: () => ({
    isNavigating: false,
    currentRoute: null,
    navigationInstructions: [],
    startNavigation: vi.fn(),
    stopNavigation: vi.fn(),
    calculateRoute: vi.fn()
  })
}));

vi.mock('../../../utils/performanceMonitor', () => ({
  startPerformanceMetric: vi.fn(),
  endPerformanceMetric: vi.fn(),
  getPerformanceMetrics: vi.fn(() => ({}))
}));

vi.mock('../../../utils/errorHandler', () => ({
  errorHandler: {
    handleAsyncError: vi.fn((fn) => fn()),
    createError: vi.fn()
  }
}));

vi.mock('../../../utils/vibration', () => ({
  mapVibration: {
    mapCentered: vi.fn(),
    zoomChanged: vi.fn(),
    layerSwitched: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../../../components/ui/Toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  })
}));

// 模拟高德地图
const mockAMap = {
  Map: vi.fn().mockImplementation(() => ({
    setCenter: vi.fn(),
    setZoom: vi.fn(),
    getZoom: vi.fn(() => 15),
    getCenter: vi.fn(() => ({ lng: 121.5, lat: 31.2 })),
    on: vi.fn(),
    off: vi.fn(),
    destroy: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    clearMap: vi.fn(),
    setMapStyle: vi.fn(),
    plugin: vi.fn()
  })),
  Marker: vi.fn().mockImplementation(() => ({
    setPosition: vi.fn(),
    setMap: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  })),
  Polyline: vi.fn().mockImplementation(() => ({
    setPath: vi.fn(),
    setMap: vi.fn(),
    setOptions: vi.fn()
  })),
  plugin: vi.fn()
};

Object.defineProperty(window, 'AMap', {
  value: mockAMap,
  writable: true
});

describe('IntelligentRunningMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该正确渲染地图容器', () => {
      render(<IntelligentRunningMap />);
      
      const mapContainer = screen.getByTestId('intelligent-running-map');
      expect(mapContainer).toBeInTheDocument();
      expect(mapContainer).toHaveClass('relative', 'w-full', 'h-full');
    });

    it('应该渲染地图控制面板', () => {
      render(<IntelligentRunningMap />);
      
      const controlPanel = screen.getByTestId('map-control-panel');
      expect(controlPanel).toBeInTheDocument();
    });

    it('应该渲染状态指示器', () => {
      render(<IntelligentRunningMap />);
      
      const statusIndicator = screen.getByTestId('map-status-indicator');
      expect(statusIndicator).toBeInTheDocument();
    });
  });

  describe('地图初始化', () => {
    it('应该在组件挂载时初始化地图', async () => {
      render(<IntelligentRunningMap />);
      
      await waitFor(() => {
        expect(mockAMap.Map).toHaveBeenCalled();
      });
    });

    it('应该设置正确的地图配置', async () => {
      render(<IntelligentRunningMap />);
      
      await waitFor(() => {
        expect(mockAMap.Map).toHaveBeenCalledWith(
          expect.any(HTMLElement),
          expect.objectContaining({
            zoom: 15,
            center: [121.5, 31.2],
            mapStyle: 'amap://styles/normal'
          })
        );
      });
    });
  });

  describe('GPS 功能', () => {
    it('应该显示 GPS 启用按钮', () => {
      render(<IntelligentRunningMap />);
      
      const gpsButton = screen.getByLabelText('启用GPS');
      expect(gpsButton).toBeInTheDocument();
    });

    it('应该在点击时启用 GPS', () => {
      const mockEnableGPS = vi.fn();
      vi.mocked(require('../../../hooks/useGPS').default).mockReturnValue({
        position: null,
        accuracy: 0,
        isEnabled: false,
        isLoading: false,
        error: null,
        enableGPS: mockEnableGPS,
        disableGPS: vi.fn(),
        getCurrentPosition: vi.fn()
      });

      render(<IntelligentRunningMap />);
      
      const gpsButton = screen.getByLabelText('启用GPS');
      fireEvent.click(gpsButton);
      
      expect(mockEnableGPS).toHaveBeenCalled();
    });
  });

  describe('追踪功能', () => {
    it('应该显示开始追踪按钮', () => {
      render(<IntelligentRunningMap />);
      
      const trackingButton = screen.getByLabelText('开始追踪');
      expect(trackingButton).toBeInTheDocument();
    });

    it('应该在点击时开始追踪', () => {
      const mockStartTracking = vi.fn();
      vi.mocked(require('../../../hooks/useTracking').default).mockReturnValue({
        isTracking: false,
        isPaused: false,
        trackingData: null,
        startTracking: mockStartTracking,
        stopTracking: vi.fn(),
        pauseTracking: vi.fn(),
        resumeTracking: vi.fn(),
        clearTrackingData: vi.fn()
      });

      render(<IntelligentRunningMap />);
      
      const trackingButton = screen.getByLabelText('开始追踪');
      fireEvent.click(trackingButton);
      
      expect(mockStartTracking).toHaveBeenCalled();
    });

    it('应该在追踪时显示停止按钮', () => {
      vi.mocked(require('../../../hooks/useTracking').default).mockReturnValue({
        isTracking: true,
        isPaused: false,
        trackingData: null,
        startTracking: vi.fn(),
        stopTracking: vi.fn(),
        pauseTracking: vi.fn(),
        resumeTracking: vi.fn(),
        clearTrackingData: vi.fn()
      });

      render(<IntelligentRunningMap />);
      
      const stopButton = screen.getByLabelText('停止追踪');
      expect(stopButton).toBeInTheDocument();
    });
  });

  describe('导航功能', () => {
    it('应该显示开始导航按钮', () => {
      render(<IntelligentRunningMap />);
      
      const navigationButton = screen.getByLabelText('开始导航');
      expect(navigationButton).toBeInTheDocument();
    });

    it('应该在点击时开始导航', () => {
      const mockStartNavigation = vi.fn();
      vi.mocked(require('../../../hooks/useNavigation').default).mockReturnValue({
        isNavigating: false,
        currentRoute: null,
        navigationInstructions: [],
        startNavigation: mockStartNavigation,
        stopNavigation: vi.fn(),
        calculateRoute: vi.fn()
      });

      render(<IntelligentRunningMap />);
      
      const navigationButton = screen.getByLabelText('开始导航');
      fireEvent.click(navigationButton);
      
      expect(mockStartNavigation).toHaveBeenCalled();
    });
  });

  describe('地图控制', () => {
    it('应该显示居中按钮', () => {
      render(<IntelligentRunningMap />);
      
      const centerButton = screen.getByLabelText('居中地图');
      expect(centerButton).toBeInTheDocument();
    });

    it('应该显示清除路线按钮', () => {
      render(<IntelligentRunningMap />);
      
      const clearButton = screen.getByLabelText('清除路线');
      expect(clearButton).toBeInTheDocument();
    });

    it('应该显示图层切换按钮', () => {
      render(<IntelligentRunningMap />);
      
      const layerButton = screen.getByLabelText('切换图层');
      expect(layerButton).toBeInTheDocument();
    });

    it('应该显示设置按钮', () => {
      render(<IntelligentRunningMap />);
      
      const settingsButton = screen.getByLabelText('设置');
      expect(settingsButton).toBeInTheDocument();
    });
  });

  describe('状态显示', () => {
    it('应该显示 GPS 状态', () => {
      vi.mocked(require('../../../hooks/useGPS').default).mockReturnValue({
        position: { lng: 121.5, lat: 31.2 },
        accuracy: 10,
        isEnabled: true,
        isLoading: false,
        error: null,
        enableGPS: vi.fn(),
        disableGPS: vi.fn(),
        getCurrentPosition: vi.fn()
      });

      render(<IntelligentRunningMap />);
      
      expect(screen.getByText('GPS: 已连接')).toBeInTheDocument();
      expect(screen.getByText('精度: 10m')).toBeInTheDocument();
    });

    it('应该显示追踪状态', () => {
      vi.mocked(require('../../../hooks/useTracking').default).mockReturnValue({
        isTracking: true,
        isPaused: false,
        trackingData: {
          distance: 1500,
          duration: 300000,
          averageSpeed: 5,
          currentSpeed: 6
        },
        startTracking: vi.fn(),
        stopTracking: vi.fn(),
        pauseTracking: vi.fn(),
        resumeTracking: vi.fn(),
        clearTrackingData: vi.fn()
      });

      render(<IntelligentRunningMap />);
      
      expect(screen.getByText('追踪: 进行中')).toBeInTheDocument();
      expect(screen.getByText('距离: 1.50km')).toBeInTheDocument();
      expect(screen.getByText('时间: 05:00')).toBeInTheDocument();
    });

    it('应该显示导航状态', () => {
      vi.mocked(require('../../../hooks/useNavigation').default).mockReturnValue({
        isNavigating: true,
        currentRoute: {
          distance: 5000,
          duration: 1800,
          waypoints: []
        },
        navigationInstructions: [
          { instruction: '直行500米', distance: 500 }
        ],
        startNavigation: vi.fn(),
        stopNavigation: vi.fn(),
        calculateRoute: vi.fn()
      });

      render(<IntelligentRunningMap />);
      
      expect(screen.getByText('导航: 进行中')).toBeInTheDocument();
      expect(screen.getByText('剩余: 5.00km')).toBeInTheDocument();
    });
  });

  describe('错误处理', () => {
    it('应该显示 GPS 错误', () => {
      vi.mocked(require('../../../hooks/useGPS').default).mockReturnValue({
        position: null,
        accuracy: 0,
        isEnabled: false,
        isLoading: false,
        error: 'GPS 定位失败',
        enableGPS: vi.fn(),
        disableGPS: vi.fn(),
        getCurrentPosition: vi.fn()
      });

      render(<IntelligentRunningMap />);
      
      expect(screen.getByText('GPS: 错误')).toBeInTheDocument();
    });

    it('应该在地图加载失败时显示错误', async () => {
      mockAMap.Map.mockImplementation(() => {
        throw new Error('地图加载失败');
      });

      render(<IntelligentRunningMap />);
      
      await waitFor(() => {
        expect(screen.getByText('地图加载失败')).toBeInTheDocument();
      });
    });
  });

  describe('性能监控', () => {
    it('应该在组件挂载时开始性能监控', () => {
      const mockStartMetric = vi.fn();
      vi.mocked(require('../../../utils/performanceMonitor').startPerformanceMetric).mockImplementation(mockStartMetric);

      render(<IntelligentRunningMap />);
      
      expect(mockStartMetric).toHaveBeenCalledWith('map-initialization');
    });

    it('应该在地图初始化完成后结束性能监控', async () => {
      const mockEndMetric = vi.fn();
      vi.mocked(require('../../../utils/performanceMonitor').endPerformanceMetric).mockImplementation(mockEndMetric);

      render(<IntelligentRunningMap />);
      
      await waitFor(() => {
        expect(mockEndMetric).toHaveBeenCalledWith('map-initialization');
      });
    });
  });

  describe('响应式设计', () => {
    it('应该在移动设备上使用移动端控件', () => {
      // 模拟移动设备
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      render(<IntelligentRunningMap />);
      
      const controlPanel = screen.getByTestId('map-control-panel');
      expect(controlPanel).toHaveClass('mobile-controls');
    });

    it('应该在桌面设备上使用桌面端控件', () => {
      // 模拟桌面设备
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1440
      });

      render(<IntelligentRunningMap />);
      
      const controlPanel = screen.getByTestId('map-control-panel');
      expect(controlPanel).toHaveClass('desktop-controls');
    });
  });

  describe('组件卸载', () => {
    it('应该在组件卸载时清理地图实例', () => {
      const mockDestroy = vi.fn();
      const mockMap = {
        destroy: mockDestroy,
        setCenter: vi.fn(),
        setZoom: vi.fn(),
        on: vi.fn(),
        off: vi.fn()
      };
      
      mockAMap.Map.mockReturnValue(mockMap);

      const { unmount } = render(<IntelligentRunningMap />);
      
      unmount();
      
      expect(mockDestroy).toHaveBeenCalled();
    });
  });
});