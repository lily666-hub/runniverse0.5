import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MobileMapControls from '../MobileMapControls';

// 模拟依赖
const mockVibration = {
  mapCentered: vi.fn(),
  layerSwitched: vi.fn(),
  success: vi.fn(),
  error: vi.fn()
};

vi.mock('../../../utils/vibration', () => ({
  mapVibration: mockVibration
}));

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn()
};

vi.mock('../../../components/ui/Toast', () => ({
  useToast: () => mockToast
}));

const mockResponsive = {
  isMobile: vi.fn(() => true),
  getOptimalControlSize: vi.fn(() => ({
    buttonSize: 48,
    iconSize: 24,
    spacing: 8
  }))
};

vi.mock('../../../utils/responsive', () => ({
  responsiveUtils: mockResponsive
}));

// 模拟 props
const defaultProps = {
  gpsEnabled: false,
  isTracking: false,
  isNavigating: false,
  onGPSToggle: vi.fn(),
  onTrackingToggle: vi.fn(),
  onNavigationToggle: vi.fn(),
  onCenterMap: vi.fn(),
  onClearRoute: vi.fn(),
  onLayerSwitch: vi.fn(),
  onSettings: vi.fn()
};

describe('MobileMapControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该正确渲染控制面板', () => {
      render(<MobileMapControls {...defaultProps} />);
      
      const controlPanel = screen.getByTestId('mobile-map-controls');
      expect(controlPanel).toBeInTheDocument();
      expect(controlPanel).toHaveClass('mobile-controls');
    });

    it('应该渲染所有控制按钮', () => {
      render(<MobileMapControls {...defaultProps} />);
      
      expect(screen.getByLabelText('GPS')).toBeInTheDocument();
      expect(screen.getByLabelText('追踪')).toBeInTheDocument();
      expect(screen.getByLabelText('导航')).toBeInTheDocument();
      expect(screen.getByLabelText('居中')).toBeInTheDocument();
      expect(screen.getByLabelText('清除')).toBeInTheDocument();
      expect(screen.getByLabelText('图层')).toBeInTheDocument();
      expect(screen.getByLabelText('设置')).toBeInTheDocument();
    });
  });

  describe('GPS 控制', () => {
    it('应该显示 GPS 禁用状态', () => {
      render(<MobileMapControls {...defaultProps} gpsEnabled={false} />);
      
      const gpsButton = screen.getByLabelText('GPS');
      expect(gpsButton).toHaveClass('bg-gray-100');
    });

    it('应该显示 GPS 启用状态', () => {
      render(<MobileMapControls {...defaultProps} gpsEnabled={true} />);
      
      const gpsButton = screen.getByLabelText('GPS');
      expect(gpsButton).toHaveClass('bg-blue-500');
    });

    it('应该在点击时切换 GPS 状态', () => {
      const onGPSToggle = vi.fn();
      render(<MobileMapControls {...defaultProps} onGPSToggle={onGPSToggle} />);
      
      const gpsButton = screen.getByLabelText('GPS');
      fireEvent.click(gpsButton);
      
      expect(onGPSToggle).toHaveBeenCalled();
    });

    it('应该在启用 GPS 时显示成功提示', () => {
      const onGPSToggle = vi.fn();
      render(<MobileMapControls {...defaultProps} onGPSToggle={onGPSToggle} />);
      
      const gpsButton = screen.getByLabelText('GPS');
      fireEvent.click(gpsButton);
      
      expect(mockToast.success).toHaveBeenCalledWith('GPS已启用');
    });
  });

  describe('追踪控制', () => {
    it('应该显示追踪停止状态', () => {
      render(<MobileMapControls {...defaultProps} isTracking={false} />);
      
      const trackingButton = screen.getByLabelText('追踪');
      expect(trackingButton).toHaveClass('bg-gray-100');
    });

    it('应该显示追踪进行状态', () => {
      render(<MobileMapControls {...defaultProps} isTracking={true} />);
      
      const trackingButton = screen.getByLabelText('追踪');
      expect(trackingButton).toHaveClass('bg-green-500');
    });

    it('应该在点击时切换追踪状态', () => {
      const onTrackingToggle = vi.fn();
      render(<MobileMapControls {...defaultProps} onTrackingToggle={onTrackingToggle} />);
      
      const trackingButton = screen.getByLabelText('追踪');
      fireEvent.click(trackingButton);
      
      expect(onTrackingToggle).toHaveBeenCalled();
    });

    it('应该在开始追踪时显示成功提示', () => {
      const onTrackingToggle = vi.fn();
      render(<MobileMapControls {...defaultProps} onTrackingToggle={onTrackingToggle} />);
      
      const trackingButton = screen.getByLabelText('追踪');
      fireEvent.click(trackingButton);
      
      expect(mockToast.success).toHaveBeenCalledWith('开始追踪');
    });
  });

  describe('导航控制', () => {
    it('应该显示导航停止状态', () => {
      render(<MobileMapControls {...defaultProps} isNavigating={false} />);
      
      const navigationButton = screen.getByLabelText('导航');
      expect(navigationButton).toHaveClass('bg-gray-100');
    });

    it('应该显示导航进行状态', () => {
      render(<MobileMapControls {...defaultProps} isNavigating={true} />);
      
      const navigationButton = screen.getByLabelText('导航');
      expect(navigationButton).toHaveClass('bg-purple-500');
    });

    it('应该在点击时切换导航状态', () => {
      const onNavigationToggle = vi.fn();
      render(<MobileMapControls {...defaultProps} onNavigationToggle={onNavigationToggle} />);
      
      const navigationButton = screen.getByLabelText('导航');
      fireEvent.click(navigationButton);
      
      expect(onNavigationToggle).toHaveBeenCalled();
    });

    it('应该在开始导航时显示成功提示', () => {
      const onNavigationToggle = vi.fn();
      render(<MobileMapControls {...defaultProps} onNavigationToggle={onNavigationToggle} />);
      
      const navigationButton = screen.getByLabelText('导航');
      fireEvent.click(navigationButton);
      
      expect(mockToast.success).toHaveBeenCalledWith('开始导航');
    });
  });

  describe('地图控制', () => {
    it('应该在点击居中按钮时居中地图', () => {
      const onCenterMap = vi.fn();
      render(<MobileMapControls {...defaultProps} onCenterMap={onCenterMap} />);
      
      const centerButton = screen.getByLabelText('居中');
      fireEvent.click(centerButton);
      
      expect(onCenterMap).toHaveBeenCalled();
      expect(mockVibration.mapCentered).toHaveBeenCalled();
      expect(mockToast.info).toHaveBeenCalledWith('地图已居中');
    });

    it('应该在点击清除按钮时清除路线', () => {
      const onClearRoute = vi.fn();
      render(<MobileMapControls {...defaultProps} onClearRoute={onClearRoute} />);
      
      const clearButton = screen.getByLabelText('清除');
      fireEvent.click(clearButton);
      
      expect(onClearRoute).toHaveBeenCalled();
      expect(mockToast.info).toHaveBeenCalledWith('路线已清除');
    });

    it('应该在点击图层按钮时切换图层', () => {
      const onLayerSwitch = vi.fn();
      render(<MobileMapControls {...defaultProps} onLayerSwitch={onLayerSwitch} />);
      
      const layerButton = screen.getByLabelText('图层');
      fireEvent.click(layerButton);
      
      expect(onLayerSwitch).toHaveBeenCalled();
      expect(mockVibration.layerSwitched).toHaveBeenCalled();
      expect(mockToast.info).toHaveBeenCalledWith('图层已切换');
    });

    it('应该在点击设置按钮时打开设置', () => {
      const onSettings = vi.fn();
      render(<MobileMapControls {...defaultProps} onSettings={onSettings} />);
      
      const settingsButton = screen.getByLabelText('设置');
      fireEvent.click(settingsButton);
      
      expect(onSettings).toHaveBeenCalled();
    });
  });

  describe('触摸手势支持', () => {
    it('应该支持长按手势', async () => {
      const onGPSToggle = vi.fn();
      render(<MobileMapControls {...defaultProps} onGPSToggle={onGPSToggle} />);
      
      const gpsButton = screen.getByLabelText('GPS');
      
      // 模拟长按
      fireEvent.touchStart(gpsButton);
      
      await waitFor(() => {
        expect(mockVibration.success).toHaveBeenCalled();
      }, { timeout: 600 });
      
      fireEvent.touchEnd(gpsButton);
    });

    it('应该支持双击手势', () => {
      const onCenterMap = vi.fn();
      render(<MobileMapControls {...defaultProps} onCenterMap={onCenterMap} />);
      
      const centerButton = screen.getByLabelText('居中');
      
      // 模拟双击
      fireEvent.click(centerButton);
      fireEvent.click(centerButton);
      
      expect(onCenterMap).toHaveBeenCalledTimes(2);
    });
  });

  describe('响应式设计', () => {
    it('应该根据设备类型调整按钮尺寸', () => {
      mockResponsive.getOptimalControlSize.mockReturnValue({
        buttonSize: 56,
        iconSize: 28,
        spacing: 12
      });

      render(<MobileMapControls {...defaultProps} />);
      
      const gpsButton = screen.getByLabelText('GPS');
      expect(gpsButton).toHaveStyle('width: 56px');
      expect(gpsButton).toHaveStyle('height: 56px');
    });

    it('应该在非移动设备上使用桌面样式', () => {
      mockResponsive.isMobile.mockReturnValue(false);

      render(<MobileMapControls {...defaultProps} />);
      
      const controlPanel = screen.getByTestId('mobile-map-controls');
      expect(controlPanel).toHaveClass('desktop-controls');
    });
  });

  describe('禁用状态', () => {
    it('应该在 GPS 未启用时禁用追踪按钮', () => {
      render(<MobileMapControls {...defaultProps} gpsEnabled={false} />);
      
      const trackingButton = screen.getByLabelText('追踪');
      expect(trackingButton).toBeDisabled();
    });

    it('应该在 GPS 未启用时禁用导航按钮', () => {
      render(<MobileMapControls {...defaultProps} gpsEnabled={false} />);
      
      const navigationButton = screen.getByLabelText('导航');
      expect(navigationButton).toBeDisabled();
    });

    it('应该在点击禁用按钮时显示警告', () => {
      render(<MobileMapControls {...defaultProps} gpsEnabled={false} />);
      
      const trackingButton = screen.getByLabelText('追踪');
      fireEvent.click(trackingButton);
      
      expect(mockToast.warning).toHaveBeenCalledWith('请先启用GPS');
    });
  });

  describe('加载状态', () => {
    it('应该在加载时显示加载指示器', () => {
      render(<MobileMapControls {...defaultProps} loading={true} />);
      
      const loadingIndicator = screen.getByTestId('loading-indicator');
      expect(loadingIndicator).toBeInTheDocument();
    });

    it('应该在加载时禁用所有按钮', () => {
      render(<MobileMapControls {...defaultProps} loading={true} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('错误处理', () => {
    it('应该在操作失败时显示错误提示', () => {
      const onGPSToggle = vi.fn().mockRejectedValue(new Error('GPS启用失败'));
      render(<MobileMapControls {...defaultProps} onGPSToggle={onGPSToggle} />);
      
      const gpsButton = screen.getByLabelText('GPS');
      fireEvent.click(gpsButton);
      
      expect(mockToast.error).toHaveBeenCalledWith('操作失败，请重试');
    });
  });

  describe('可访问性', () => {
    it('应该为所有按钮提供正确的 aria-label', () => {
      render(<MobileMapControls {...defaultProps} />);
      
      expect(screen.getByLabelText('GPS')).toBeInTheDocument();
      expect(screen.getByLabelText('追踪')).toBeInTheDocument();
      expect(screen.getByLabelText('导航')).toBeInTheDocument();
      expect(screen.getByLabelText('居中')).toBeInTheDocument();
      expect(screen.getByLabelText('清除')).toBeInTheDocument();
      expect(screen.getByLabelText('图层')).toBeInTheDocument();
      expect(screen.getByLabelText('设置')).toBeInTheDocument();
    });

    it('应该支持键盘导航', () => {
      render(<MobileMapControls {...defaultProps} />);
      
      const gpsButton = screen.getByLabelText('GPS');
      gpsButton.focus();
      
      expect(gpsButton).toHaveFocus();
      
      // 模拟 Tab 键
      fireEvent.keyDown(gpsButton, { key: 'Tab' });
      
      const trackingButton = screen.getByLabelText('追踪');
      expect(trackingButton).toHaveFocus();
    });

    it('应该支持 Enter 和 Space 键激活按钮', () => {
      const onGPSToggle = vi.fn();
      render(<MobileMapControls {...defaultProps} onGPSToggle={onGPSToggle} />);
      
      const gpsButton = screen.getByLabelText('GPS');
      
      fireEvent.keyDown(gpsButton, { key: 'Enter' });
      expect(onGPSToggle).toHaveBeenCalled();
      
      fireEvent.keyDown(gpsButton, { key: ' ' });
      expect(onGPSToggle).toHaveBeenCalledTimes(2);
    });
  });
});