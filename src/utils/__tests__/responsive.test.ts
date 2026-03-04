import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  ResponsiveUtils, 
  MapResponsiveUtils,
  responsiveUtils,
  mapResponsiveUtils,
  DEFAULT_BREAKPOINTS
} from '../responsive';

// 模拟 window 对象
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  devicePixelRatio: 1,
  matchMedia: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: mockWindow.innerWidth
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: mockWindow.innerHeight
});

Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  configurable: true,
  value: mockWindow.devicePixelRatio
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: mockWindow.matchMedia
});

// 模拟 navigator 对象
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  maxTouchPoints: 0
};

Object.defineProperty(navigator, 'userAgent', {
  writable: true,
  configurable: true,
  value: mockNavigator.userAgent
});

Object.defineProperty(navigator, 'maxTouchPoints', {
  writable: true,
  configurable: true,
  value: mockNavigator.maxTouchPoints
});

describe('ResponsiveUtils', () => {
  beforeEach(() => {
    // 重置窗口尺寸
    window.innerWidth = 1024;
    window.innerHeight = 768;
    window.devicePixelRatio = 1;
    navigator.maxTouchPoints = 0;
    
    // 清除模拟调用
    mockWindow.matchMedia.mockClear();
    mockWindow.addEventListener.mockClear();
    mockWindow.removeEventListener.mockClear();
  });

  describe('setBreakpoints', () => {
    it('应该设置自定义断点', () => {
      const customBreakpoints = {
        mobile: 480,
        tablet: 768,
        desktop: 1200
      };
      
      responsiveUtils.setBreakpoints(customBreakpoints);
      
      // 验证断点是否生效
      window.innerWidth = 500;
      const deviceInfo = responsiveUtils.getDeviceInfo();
      expect(deviceInfo.isMobile).toBe(false);
      expect(deviceInfo.isTablet).toBe(true);
    });
  });

  describe('getDeviceInfo', () => {
    it('应该识别移动设备', () => {
      window.innerWidth = 375;
      window.innerHeight = 667;
      
      const deviceInfo = responsiveUtils.getDeviceInfo();
      
      expect(deviceInfo.isMobile).toBe(true);
      expect(deviceInfo.isTablet).toBe(false);
      expect(deviceInfo.isDesktop).toBe(false);
      expect(deviceInfo.screenSize).toBe('mobile');
    });

    it('应该识别平板设备', () => {
      window.innerWidth = 768;
      window.innerHeight = 1024;
      
      const deviceInfo = responsiveUtils.getDeviceInfo();
      
      expect(deviceInfo.isMobile).toBe(false);
      expect(deviceInfo.isTablet).toBe(true);
      expect(deviceInfo.isDesktop).toBe(false);
      expect(deviceInfo.screenSize).toBe('tablet');
    });

    it('应该识别桌面设备', () => {
      window.innerWidth = 1440;
      window.innerHeight = 900;
      
      const deviceInfo = responsiveUtils.getDeviceInfo();
      
      expect(deviceInfo.isMobile).toBe(false);
      expect(deviceInfo.isTablet).toBe(false);
      expect(deviceInfo.isDesktop).toBe(true);
      expect(deviceInfo.screenSize).toBe('desktop');
    });
  });

  describe('getViewportInfo', () => {
    it('应该返回视口信息', () => {
      window.innerWidth = 1024;
      window.innerHeight = 768;
      
      const viewportInfo = responsiveUtils.getViewportInfo();
      
      expect(viewportInfo.width).toBe(1024);
      expect(viewportInfo.height).toBe(768);
      expect(viewportInfo.aspectRatio).toBeCloseTo(1024 / 768);
    });
  });

  describe('getSafeAreaInsets', () => {
    it('应该返回安全区域内边距', () => {
      const insets = responsiveUtils.getSafeAreaInsets();
      
      expect(insets).toHaveProperty('top');
      expect(insets).toHaveProperty('right');
      expect(insets).toHaveProperty('bottom');
      expect(insets).toHaveProperty('left');
    });
  });

  describe('设备类型检测', () => {
    it('isMobile 应该正确检测移动设备', () => {
      window.innerWidth = 375;
      expect(responsiveUtils.isMobile()).toBe(true);
      
      window.innerWidth = 1024;
      expect(responsiveUtils.isMobile()).toBe(false);
    });

    it('isTablet 应该正确检测平板设备', () => {
      window.innerWidth = 768;
      expect(responsiveUtils.isTablet()).toBe(true);
      
      window.innerWidth = 375;
      expect(responsiveUtils.isTablet()).toBe(false);
    });

    it('isDesktop 应该正确检测桌面设备', () => {
      window.innerWidth = 1440;
      expect(responsiveUtils.isDesktop()).toBe(true);
      
      window.innerWidth = 768;
      expect(responsiveUtils.isDesktop()).toBe(false);
    });
  });

  describe('isTouchDevice', () => {
    it('应该检测触摸设备', () => {
      navigator.maxTouchPoints = 1;
      expect(responsiveUtils.isTouchDevice()).toBe(true);
      
      navigator.maxTouchPoints = 0;
      expect(responsiveUtils.isTouchDevice()).toBe(false);
    });
  });

  describe('屏幕方向检测', () => {
    it('isLandscape 应该检测横屏', () => {
      window.innerWidth = 1024;
      window.innerHeight = 768;
      expect(responsiveUtils.isLandscape()).toBe(true);
      
      window.innerWidth = 768;
      window.innerHeight = 1024;
      expect(responsiveUtils.isLandscape()).toBe(false);
    });

    it('isPortrait 应该检测竖屏', () => {
      window.innerWidth = 768;
      window.innerHeight = 1024;
      expect(responsiveUtils.isPortrait()).toBe(true);
      
      window.innerWidth = 1024;
      window.innerHeight = 768;
      expect(responsiveUtils.isPortrait()).toBe(false);
    });
  });

  describe('isHighDPI', () => {
    it('应该检测高分辨率屏幕', () => {
      window.devicePixelRatio = 2;
      expect(responsiveUtils.isHighDPI()).toBe(true);
      
      window.devicePixelRatio = 1;
      expect(responsiveUtils.isHighDPI()).toBe(false);
    });
  });

  describe('getOptimalMapSize', () => {
    it('应该为移动设备返回优化的地图尺寸', () => {
      window.innerWidth = 375;
      window.innerHeight = 667;
      
      const mapSize = responsiveUtils.getOptimalMapSize();
      
      expect(mapSize.width).toBeLessThanOrEqual(375);
      expect(mapSize.height).toBeLessThanOrEqual(667);
    });

    it('应该为桌面设备返回优化的地图尺寸', () => {
      window.innerWidth = 1440;
      window.innerHeight = 900;
      
      const mapSize = responsiveUtils.getOptimalMapSize();
      
      expect(mapSize.width).toBeLessThanOrEqual(1440);
      expect(mapSize.height).toBeLessThanOrEqual(900);
    });
  });

  describe('getOptimalControlSize', () => {
    it('应该为移动设备返回较大的控件尺寸', () => {
      window.innerWidth = 375;
      
      const controlSize = responsiveUtils.getOptimalControlSize();
      
      expect(controlSize.buttonSize).toBeGreaterThan(40);
      expect(controlSize.iconSize).toBeGreaterThan(20);
    });

    it('应该为桌面设备返回标准的控件尺寸', () => {
      window.innerWidth = 1440;
      
      const controlSize = responsiveUtils.getOptimalControlSize();
      
      expect(controlSize.buttonSize).toBeLessThanOrEqual(48);
      expect(controlSize.iconSize).toBeLessThanOrEqual(24);
    });
  });

  describe('媒体查询', () => {
    it('getMediaQuery 应该生成正确的媒体查询', () => {
      const mobileQuery = responsiveUtils.getMediaQuery('mobile');
      expect(mobileQuery).toContain('max-width');
      
      const desktopQuery = responsiveUtils.getMediaQuery('desktop');
      expect(desktopQuery).toContain('min-width');
    });

    it('matchMedia 应该调用 window.matchMedia', () => {
      const mockMediaQueryList = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      
      mockWindow.matchMedia.mockReturnValue(mockMediaQueryList);
      
      const result = responsiveUtils.matchMedia('(max-width: 768px)');
      
      expect(mockWindow.matchMedia).toHaveBeenCalledWith('(max-width: 768px)');
      expect(result).toBe(mockMediaQueryList);
    });
  });

  describe('设备变化监听', () => {
    it('addDeviceChangeListener 应该添加事件监听器', () => {
      const callback = vi.fn();
      
      responsiveUtils.addDeviceChangeListener(callback);
      
      expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });
});

describe('MapResponsiveUtils', () => {
  beforeEach(() => {
    window.innerWidth = 1024;
    window.innerHeight = 768;
  });

  describe('getMapContainerStyle', () => {
    it('应该返回地图容器样式', () => {
      const style = mapResponsiveUtils.getMapContainerStyle();
      
      expect(style).toHaveProperty('width');
      expect(style).toHaveProperty('height');
      expect(style).toHaveProperty('position');
    });

    it('应该为移动设备调整样式', () => {
      window.innerWidth = 375;
      
      const style = mapResponsiveUtils.getMapContainerStyle();
      
      expect(style.width).toBe('100%');
      expect(style.height).toBe('100%');
    });
  });

  describe('getControlButtonStyle', () => {
    it('应该返回控制按钮样式', () => {
      const style = mapResponsiveUtils.getControlButtonStyle();
      
      expect(style).toHaveProperty('width');
      expect(style).toHaveProperty('height');
      expect(style).toHaveProperty('borderRadius');
    });

    it('应该为移动设备返回较大的按钮', () => {
      window.innerWidth = 375;
      
      const style = mapResponsiveUtils.getControlButtonStyle();
      
      expect(parseInt(style.width)).toBeGreaterThan(40);
      expect(parseInt(style.height)).toBeGreaterThan(40);
    });
  });

  describe('getStatusIndicatorStyle', () => {
    it('应该返回状态指示器样式', () => {
      const style = mapResponsiveUtils.getStatusIndicatorStyle();
      
      expect(style).toHaveProperty('fontSize');
      expect(style).toHaveProperty('padding');
      expect(style).toHaveProperty('borderRadius');
    });
  });

  describe('getLoadingSpinnerStyle', () => {
    it('应该返回加载动画样式', () => {
      const style = mapResponsiveUtils.getLoadingSpinnerStyle();
      
      expect(style).toHaveProperty('width');
      expect(style).toHaveProperty('height');
      expect(style).toHaveProperty('borderWidth');
    });

    it('应该为移动设备调整加载动画尺寸', () => {
      window.innerWidth = 375;
      
      const style = mapResponsiveUtils.getLoadingSpinnerStyle();
      
      expect(parseInt(style.width)).toBeGreaterThan(30);
      expect(parseInt(style.height)).toBeGreaterThan(30);
    });
  });
});

describe('DEFAULT_BREAKPOINTS', () => {
  it('应该包含正确的断点值', () => {
    expect(DEFAULT_BREAKPOINTS.mobile).toBe(768);
    expect(DEFAULT_BREAKPOINTS.tablet).toBe(1024);
    expect(DEFAULT_BREAKPOINTS.desktop).toBe(1200);
  });
});

describe('单例实例', () => {
  it('responsiveUtils 应该是 ResponsiveUtils 的实例', () => {
    expect(responsiveUtils).toBeInstanceOf(ResponsiveUtils);
  });

  it('mapResponsiveUtils 应该是 MapResponsiveUtils 的实例', () => {
    expect(mapResponsiveUtils).toBeInstanceOf(MapResponsiveUtils);
  });
});