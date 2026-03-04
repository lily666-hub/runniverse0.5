/**
 * 响应式设计工具类
 * 提供移动端适配和响应式布局相关功能
 */

export interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
  largeDesktop: number;
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  width: number;
  height: number;
  pixelRatio: number;
  orientation: 'portrait' | 'landscape';
  isTouchDevice: boolean;
  isRetina: boolean;
}

export interface ViewportInfo {
  width: number;
  height: number;
  availableWidth: number;
  availableHeight: number;
  safeAreaInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * 默认断点配置
 */
export const DEFAULT_BREAKPOINTS: BreakpointConfig = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
  largeDesktop: 1920
};

/**
 * 响应式工具类
 */
export class ResponsiveUtils {
  private static breakpoints: BreakpointConfig = DEFAULT_BREAKPOINTS;
  private static listeners: Array<(deviceInfo: DeviceInfo) => void> = [];
  private static currentDeviceInfo: DeviceInfo | null = null;
  
  /**
   * 设置断点配置
   */
  static setBreakpoints(breakpoints: Partial<BreakpointConfig>): void {
    this.breakpoints = { ...DEFAULT_BREAKPOINTS, ...breakpoints };
  }
  
  /**
   * 获取当前设备信息
   */
  static getDeviceInfo(): DeviceInfo {
    if (this.currentDeviceInfo) {
      return this.currentDeviceInfo;
    }
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    
    // 判断设备类型
    let type: DeviceInfo['type'] = 'desktop';
    if (width < this.breakpoints.mobile) {
      type = 'mobile';
    } else if (width < this.breakpoints.tablet) {
      type = 'tablet';
    }
    
    // 判断方向
    const orientation: DeviceInfo['orientation'] = width > height ? 'landscape' : 'portrait';
    
    // 判断是否为触摸设备
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // 判断是否为高分辨率屏幕
    const isRetina = pixelRatio >= 2;
    
    this.currentDeviceInfo = {
      type,
      width,
      height,
      pixelRatio,
      orientation,
      isTouchDevice,
      isRetina
    };
    
    return this.currentDeviceInfo;
  }
  
  /**
   * 获取视口信息
   */
  static getViewportInfo(): ViewportInfo {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const availableWidth = window.screen.availWidth;
    const availableHeight = window.screen.availHeight;
    
    // 获取安全区域信息（主要用于iOS设备）
    const safeAreaInsets = this.getSafeAreaInsets();
    
    return {
      width,
      height,
      availableWidth,
      availableHeight,
      safeAreaInsets
    };
  }
  
  /**
   * 获取安全区域内边距
   */
  static getSafeAreaInsets(): ViewportInfo['safeAreaInsets'] {
    // 尝试从CSS环境变量获取安全区域信息
    const getEnvValue = (name: string): number => {
      if (typeof CSS !== 'undefined' && CSS.supports && CSS.supports('padding', `env(${name})`)) {
        const element = document.createElement('div');
        element.style.padding = `env(${name})`;
        document.body.appendChild(element);
        const value = parseInt(getComputedStyle(element).paddingTop, 10) || 0;
        document.body.removeChild(element);
        return value;
      }
      return 0;
    };
    
    return {
      top: getEnvValue('safe-area-inset-top'),
      right: getEnvValue('safe-area-inset-right'),
      bottom: getEnvValue('safe-area-inset-bottom'),
      left: getEnvValue('safe-area-inset-left')
    };
  }
  
  /**
   * 检查是否为移动设备
   */
  static isMobile(): boolean {
    return this.getDeviceInfo().type === 'mobile';
  }
  
  /**
   * 检查是否为平板设备
   */
  static isTablet(): boolean {
    return this.getDeviceInfo().type === 'tablet';
  }
  
  /**
   * 检查是否为桌面设备
   */
  static isDesktop(): boolean {
    return this.getDeviceInfo().type === 'desktop';
  }
  
  /**
   * 检查是否为触摸设备
   */
  static isTouchDevice(): boolean {
    return this.getDeviceInfo().isTouchDevice;
  }
  
  /**
   * 检查是否为横屏
   */
  static isLandscape(): boolean {
    return this.getDeviceInfo().orientation === 'landscape';
  }
  
  /**
   * 检查是否为竖屏
   */
  static isPortrait(): boolean {
    return this.getDeviceInfo().orientation === 'portrait';
  }
  
  /**
   * 检查是否为高分辨率屏幕
   */
  static isRetina(): boolean {
    return this.getDeviceInfo().isRetina;
  }
  
  /**
   * 监听设备信息变化
   */
  static addDeviceChangeListener(callback: (deviceInfo: DeviceInfo) => void): () => void {
    this.listeners.push(callback);
    
    // 立即调用一次
    callback(this.getDeviceInfo());
    
    // 返回取消监听的函数
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  /**
   * 初始化响应式监听
   */
  static initialize(): void {
    // 监听窗口大小变化
    const handleResize = () => {
      this.currentDeviceInfo = null; // 重置缓存
      const newDeviceInfo = this.getDeviceInfo();
      
      // 通知所有监听器
      this.listeners.forEach(callback => {
        try {
          callback(newDeviceInfo);
        } catch (error) {
          console.warn('响应式监听器执行失败:', error);
        }
      });
    };
    
    // 防抖处理
    let resizeTimer: number;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(handleResize, 150);
    };
    
    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', debouncedResize);
    
    // 初始化时调用一次
    handleResize();
  }
  
  /**
   * 获取适合当前设备的地图尺寸
   */
  static getOptimalMapSize(): { width: string; height: string } {
    const deviceInfo = this.getDeviceInfo();
    const viewportInfo = this.getViewportInfo();
    
    if (deviceInfo.type === 'mobile') {
      // 移动端：全屏显示，考虑安全区域
      const safeHeight = viewportInfo.height - 
        viewportInfo.safeAreaInsets.top - 
        viewportInfo.safeAreaInsets.bottom;
      
      return {
        width: '100vw',
        height: `${safeHeight}px`
      };
    } else if (deviceInfo.type === 'tablet') {
      // 平板：适中尺寸
      return {
        width: '100%',
        height: '70vh'
      };
    } else {
      // 桌面：固定比例
      return {
        width: '100%',
        height: '60vh'
      };
    }
  }
  
  /**
   * 获取适合当前设备的控件尺寸
   */
  static getOptimalControlSize(): {
    buttonSize: number;
    iconSize: number;
    fontSize: number;
    padding: number;
  } {
    const deviceInfo = this.getDeviceInfo();
    
    if (deviceInfo.type === 'mobile') {
      return {
        buttonSize: 48, // 符合移动端最小触摸目标
        iconSize: 24,
        fontSize: 16,
        padding: 12
      };
    } else if (deviceInfo.type === 'tablet') {
      return {
        buttonSize: 44,
        iconSize: 22,
        fontSize: 15,
        padding: 10
      };
    } else {
      return {
        buttonSize: 40,
        iconSize: 20,
        fontSize: 14,
        padding: 8
      };
    }
  }
  
  /**
   * 获取媒体查询字符串
   */
  static getMediaQuery(breakpoint: keyof BreakpointConfig, type: 'min' | 'max' = 'min'): string {
    const value = this.breakpoints[breakpoint];
    return `(${type}-width: ${value}px)`;
  }
  
  /**
   * 检查媒体查询是否匹配
   */
  static matchMedia(query: string): boolean {
    return window.matchMedia(query).matches;
  }
}

/**
 * 地图响应式适配工具
 */
export class MapResponsiveUtils {
  /**
   * 获取地图容器样式
   */
  static getMapContainerStyle(): React.CSSProperties {
    const deviceInfo = ResponsiveUtils.getDeviceInfo();
    const viewportInfo = ResponsiveUtils.getViewportInfo();
    
    const baseStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      position: 'relative'
    };
    
    if (deviceInfo.type === 'mobile') {
      // 移动端特殊处理
      return {
        ...baseStyle,
        minHeight: '100vh',
        paddingTop: viewportInfo.safeAreaInsets.top,
        paddingBottom: viewportInfo.safeAreaInsets.bottom,
        paddingLeft: viewportInfo.safeAreaInsets.left,
        paddingRight: viewportInfo.safeAreaInsets.right
      };
    }
    
    return baseStyle;
  }
  
  /**
   * 获取控制按钮样式
   */
  static getControlButtonStyle(): React.CSSProperties {
    const controlSize = ResponsiveUtils.getOptimalControlSize();
    const deviceInfo = ResponsiveUtils.getDeviceInfo();
    
    return {
      width: controlSize.buttonSize,
      height: controlSize.buttonSize,
      borderRadius: deviceInfo.type === 'mobile' ? '50%' : '8px',
      fontSize: controlSize.fontSize,
      padding: controlSize.padding,
      minHeight: controlSize.buttonSize, // 确保最小触摸目标
      minWidth: controlSize.buttonSize,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: deviceInfo.isTouchDevice ? 'default' : 'pointer',
      userSelect: 'none',
      WebkitTapHighlightColor: 'transparent' // 移除移动端点击高亮
    };
  }
  
  /**
   * 获取状态指示器样式
   */
  static getStatusIndicatorStyle(): React.CSSProperties {
    const deviceInfo = ResponsiveUtils.getDeviceInfo();
    const controlSize = ResponsiveUtils.getOptimalControlSize();
    
    return {
      fontSize: controlSize.fontSize,
      padding: `${controlSize.padding}px ${controlSize.padding * 1.5}px`,
      borderRadius: deviceInfo.type === 'mobile' ? '24px' : '12px',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)', // Safari兼容
      boxShadow: deviceInfo.type === 'mobile' 
        ? '0 4px 20px rgba(0, 0, 0, 0.15)' 
        : '0 2px 12px rgba(0, 0, 0, 0.1)'
    };
  }
  
  /**
   * 获取加载动画样式
   */
  static getLoadingSpinnerStyle(): React.CSSProperties {
    const deviceInfo = ResponsiveUtils.getDeviceInfo();
    
    const size = deviceInfo.type === 'mobile' ? 50 : 40;
    
    return {
      width: size,
      height: size,
      borderWidth: deviceInfo.type === 'mobile' ? 4 : 3
    };
  }
}

// 自动初始化
if (typeof window !== 'undefined') {
  ResponsiveUtils.initialize();
}

export default ResponsiveUtils;