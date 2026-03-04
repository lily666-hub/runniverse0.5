/**
 * 触觉反馈（震动）工具类
 * 提供各种场景下的震动反馈功能
 */

export interface VibrationPattern {
  pattern: readonly number[];
  description: string;
}

export const VibrationPatterns = {
  // 轻微震动 - 用于按钮点击等轻量交互
  light: {
    pattern: [50],
    description: '轻微震动'
  },
  
  // 中等震动 - 用于重要操作确认
  medium: {
    pattern: [100],
    description: '中等震动'
  },
  
  // 强烈震动 - 用于警告或错误提示
  strong: {
    pattern: [200],
    description: '强烈震动'
  },
  
  // 双击震动 - 用于成功操作
  double: {
    pattern: [50, 50, 50],
    description: '双击震动'
  },
  
  // 长震动 - 用于重要通知
  long: {
    pattern: [300],
    description: '长震动'
  },
  
  // 节奏震动 - 用于导航提示
  rhythm: {
    pattern: [100, 50, 100, 50, 100],
    description: '节奏震动'
  },
  
  // 紧急震动 - 用于安全警告
  emergency: {
    pattern: [200, 100, 200, 100, 200],
    description: '紧急震动'
  }
} as const;

export type VibrationPatternName = keyof typeof VibrationPatterns;

/**
 * 震动工具类
 */
export class VibrationUtils {
  private static isSupported: boolean | null = null;
  private static isEnabled: boolean = true;
  
  /**
   * 检查设备是否支持震动
   */
  static checkSupport(): boolean {
    if (this.isSupported !== null) {
      return this.isSupported;
    }
    
    this.isSupported = 'vibrate' in navigator && typeof navigator.vibrate === 'function';
    return this.isSupported;
  }
  
  /**
   * 启用/禁用震动功能
   */
  static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    // 保存到本地存储
    try {
      localStorage.setItem('vibration_enabled', enabled.toString());
    } catch (error) {
      console.warn('无法保存震动设置:', error);
    }
  }
  
  /**
   * 获取震动是否启用
   */
  static getEnabled(): boolean {
    if (!this.isEnabled) {
      return false;
    }
    
    // 从本地存储读取设置
    try {
      const stored = localStorage.getItem('vibration_enabled');
      if (stored !== null) {
        return stored === 'true';
      }
    } catch (error) {
      console.warn('无法读取震动设置:', error);
    }
    
    return true;
  }
  
  /**
   * 执行震动
   */
  static vibrate(pattern: number | number[]): boolean {
    if (!this.checkSupport() || !this.getEnabled()) {
      return false;
    }
    
    try {
      navigator.vibrate(pattern);
      return true;
    } catch (error) {
      console.warn('震动执行失败:', error);
      return false;
    }
  }
  
  /**
   * 使用预定义模式震动
   */
  static vibratePattern(patternName: VibrationPatternName): boolean {
    const pattern = VibrationPatterns[patternName];
    if (!pattern) {
      console.warn(`未知的震动模式: ${patternName}`);
      return false;
    }
    
    return this.vibrate([...pattern.pattern]);
  }
  
  /**
   * 停止震动
   */
  static stop(): boolean {
    if (!this.checkSupport()) {
      return false;
    }
    
    try {
      navigator.vibrate(0);
      return true;
    } catch (error) {
      console.warn('停止震动失败:', error);
      return false;
    }
  }
  
  /**
   * 获取所有可用的震动模式
   */
  static getAvailablePatterns(): Array<{
    name: VibrationPatternName;
    pattern: VibrationPattern;
  }> {
    return Object.entries(VibrationPatterns).map(([name, pattern]) => ({
      name: name as VibrationPatternName,
      pattern
    }));
  }
}

/**
 * 地图相关的震动反馈
 */
export class MapVibration {
  /**
   * GPS定位成功
   */
  static gpsLocked(): void {
    VibrationUtils.vibratePattern('double');
  }
  
  /**
   * GPS信号丢失
   */
  static gpsLost(): void {
    VibrationUtils.vibratePattern('long');
  }
  
  /**
   * 开始追踪
   */
  static trackingStarted(): void {
    VibrationUtils.vibratePattern('medium');
  }
  
  /**
   * 停止追踪
   */
  static trackingStopped(): void {
    VibrationUtils.vibratePattern('light');
  }
  
  /**
   * 路线规划完成
   */
  static routePlanned(): void {
    VibrationUtils.vibratePattern('double');
  }
  
  /**
   * 导航开始
   */
  static navigationStarted(): void {
    VibrationUtils.vibratePattern('rhythm');
  }
  
  /**
   * 导航结束
   */
  static navigationEnded(): void {
    VibrationUtils.vibratePattern('medium');
  }
  
  /**
   * 到达途径点
   */
  static waypointReached(): void {
    VibrationUtils.vibratePattern('double');
  }
  
  /**
   * 偏离路线
   */
  static routeDeviation(): void {
    VibrationUtils.vibratePattern('strong');
  }
  
  /**
   * 安全警告
   */
  static safetyWarning(): void {
    VibrationUtils.vibratePattern('emergency');
  }
  
  /**
   * 按钮点击
   */
  static buttonClick(): void {
    VibrationUtils.vibratePattern('light');
  }
  
  /**
   * 操作成功
   */
  static operationSuccess(): void {
    VibrationUtils.vibratePattern('double');
  }
  
  /**
   * 操作失败
   */
  static operationError(): void {
    VibrationUtils.vibratePattern('strong');
  }
}

// 默认导出
export default VibrationUtils;