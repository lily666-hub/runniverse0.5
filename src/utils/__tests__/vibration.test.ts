import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  VibrationUtils, 
  MapVibration, 
  VibrationPatterns
} from '../vibration';

// Mock navigator.vibrate
const mockVibrate = vi.fn();

// 确保 navigator.vibrate 存在并且是一个函数
try {
  Object.defineProperty(navigator, 'vibrate', {
    value: mockVibrate,
    writable: true,
    configurable: true,
    enumerable: true
  });
} catch (error) {
  // 如果属性已经存在，直接赋值
  (navigator as any).vibrate = mockVibrate;
}

describe('VibrationUtils', () => {
  beforeEach(() => {
    mockVibrate.mockClear();
    // 清理 localStorage 以确保测试环境干净
    localStorage.clear();
    // 重置支持状态缓存，强制重新检查
    (VibrationUtils as any).isSupported = null;
    // 强制设置内部状态
    (VibrationUtils as any).isEnabled = true;
    // 确保启用状态并设置 localStorage
    VibrationUtils.setEnabled(true);
    // 再次确认 localStorage 中的值
    localStorage.setItem('vibration_enabled', 'true');
    
    // 直接 mock getEnabled 方法确保返回 true
    vi.spyOn(VibrationUtils, 'getEnabled').mockReturnValue(true);
  });

  describe('checkSupport', () => {
    it('应该检查振动支持', () => {
      expect(VibrationUtils.checkSupport()).toBe(true);
    });

    it('在不支持的环境中应该返回false', () => {
      // 直接设置 isSupported 为 false 来模拟不支持的环境
      (VibrationUtils as any).isSupported = false;
      
      expect(VibrationUtils.checkSupport()).toBe(false);
      
      // 恢复支持状态
      (VibrationUtils as any).isSupported = null;
    });
  });

  describe('setEnabled/getEnabled', () => {
    it('应该设置和获取启用状态', () => {
      // 恢复原始的 getEnabled 方法以测试真实的启用/禁用状态
      vi.restoreAllMocks();
      
      // Mock localStorage 以确保在测试环境中正常工作
      const mockLocalStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      };
      
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      });
      
      // 重置内部状态
      (VibrationUtils as any).isEnabled = true;
      
      // 测试设置为 false
      VibrationUtils.setEnabled(false);
      expect(VibrationUtils.getEnabled()).toBe(false);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('vibration_enabled', 'false');
      
      // Mock localStorage 返回 'false'
      mockLocalStorage.getItem.mockReturnValue('false');
      expect(VibrationUtils.getEnabled()).toBe(false);
      
      // 测试设置为 true
      VibrationUtils.setEnabled(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('vibration_enabled', 'true');
      
      // Mock localStorage 返回 'true'
      mockLocalStorage.getItem.mockReturnValue('true');
      expect(VibrationUtils.getEnabled()).toBe(true);
    });
  });

  describe('vibrate', () => {
    it('应该执行振动', () => {
      VibrationUtils.vibrate(200);
      expect(mockVibrate).toHaveBeenCalledWith(200);
    });

    it('在禁用时不应该振动', () => {
      // 恢复原始的 getEnabled 方法以测试禁用状态
      vi.restoreAllMocks();
      VibrationUtils.setEnabled(false);
      VibrationUtils.vibrate(200);
      expect(mockVibrate).not.toHaveBeenCalled();
    });

    it('在不支持的环境中不应该振动', () => {
      // 恢复原始方法并重置支持状态
      vi.restoreAllMocks();
      
      // 直接 mock checkSupport 方法返回 false
      vi.spyOn(VibrationUtils, 'checkSupport').mockReturnValue(false);
      
      VibrationUtils.vibrate(200);
      expect(mockVibrate).not.toHaveBeenCalled();
    });
  });

  describe('vibratePattern', () => {
    it('应该使用预设模式振动', () => {
      // 确保 getEnabled 和 checkSupport 都返回 true
      vi.spyOn(VibrationUtils, 'getEnabled').mockReturnValue(true);
      vi.spyOn(VibrationUtils, 'checkSupport').mockReturnValue(true);
      VibrationUtils.vibratePattern('light');
      expect(mockVibrate).toHaveBeenCalledWith([50]);
    });

    it('在禁用时不应该振动', () => {
      // 恢复原始的 getEnabled 方法以测试禁用状态
      vi.restoreAllMocks();
      VibrationUtils.setEnabled(false);
      VibrationUtils.vibratePattern('medium');
      expect(mockVibrate).not.toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('应该停止振动', () => {
      VibrationUtils.stop();
      expect(mockVibrate).toHaveBeenCalledWith(0);
    });
  });

  describe('getAvailablePatterns', () => {
    it('应该返回可用的振动模式', () => {
      const patterns = VibrationUtils.getAvailablePatterns();
      const patternNames = patterns.map(p => p.name);
      expect(patternNames).toContain('light');
      expect(patternNames).toContain('medium');
      expect(patternNames).toContain('strong');
      expect(patternNames).toContain('double');
      expect(patternNames).toContain('long');
      expect(patternNames).toContain('rhythm');
      expect(patternNames).toContain('emergency');
    });
  });
});

describe('MapVibration', () => {
  beforeEach(() => {
    mockVibrate.mockClear();
    // 清理 localStorage 以确保测试环境干净
    localStorage.clear();
    // 重置支持状态缓存，强制重新检查
    (VibrationUtils as any).isSupported = null;
    // 强制设置内部状态
    (VibrationUtils as any).isEnabled = true;
    // 确保启用状态并设置 localStorage
    VibrationUtils.setEnabled(true);
    // 再次确认 localStorage 中的值
    localStorage.setItem('vibration_enabled', 'true');
    
    // 直接 mock getEnabled 方法确保返回 true
    vi.spyOn(VibrationUtils, 'getEnabled').mockReturnValue(true);
  });

  describe('GPS相关振动', () => {
    it('gpsLocked 应该执行GPS锁定振动', () => {
      MapVibration.gpsLocked();
      expect(mockVibrate).toHaveBeenCalledWith([50, 50, 50]);
    });

    it('gpsLost 应该执行GPS丢失振动', () => {
      MapVibration.gpsLost();
      expect(mockVibrate).toHaveBeenCalledWith([300]);
    });
  });

  describe('追踪相关振动', () => {
    it('trackingStarted 应该执行追踪开始振动', () => {
      MapVibration.trackingStarted();
      expect(mockVibrate).toHaveBeenCalledWith([100]);
    });

    it('trackingStopped 应该执行追踪停止振动', () => {
      MapVibration.trackingStopped();
      expect(mockVibrate).toHaveBeenCalledWith([50]);
    });
  });

  describe('导航相关振动', () => {
    it('navigationStarted 应该执行导航开始振动', () => {
      MapVibration.navigationStarted();
      expect(mockVibrate).toHaveBeenCalledWith([100, 50, 100, 50, 100]);
    });

    it('navigationEnded 应该执行导航结束振动', () => {
      MapVibration.navigationEnded();
      expect(mockVibrate).toHaveBeenCalledWith([100]);
    });

    it('waypointReached 应该执行到达途径点振动', () => {
      MapVibration.waypointReached();
      expect(mockVibrate).toHaveBeenCalledWith([50, 50, 50]);
    });
  });

  describe('其他地图功能振动', () => {
    it('routePlanned 应该执行路线规划完成振动', () => {
      MapVibration.routePlanned();
      expect(mockVibrate).toHaveBeenCalledWith([50, 50, 50]);
    });

    it('routeDeviation 应该执行偏离路线振动', () => {
      MapVibration.routeDeviation();
      expect(mockVibrate).toHaveBeenCalledWith([200]);
    });

    it('safetyWarning 应该执行安全警告振动', () => {
      MapVibration.safetyWarning();
      expect(mockVibrate).toHaveBeenCalledWith([200, 100, 200, 100, 200]);
    });

    it('buttonClick 应该执行按钮点击振动', () => {
      MapVibration.buttonClick();
      expect(mockVibrate).toHaveBeenCalledWith([50]);
    });

    it('operationSuccess 应该执行操作成功振动', () => {
      // 强制确保振动功能启用
      VibrationUtils.setEnabled(true);
      
      MapVibration.operationSuccess();
      expect(mockVibrate).toHaveBeenCalledWith([50, 50, 50]);
    });

    it('operationError 应该执行操作失败振动', () => {
      // 强制确保振动功能启用
      VibrationUtils.setEnabled(true);
      
      MapVibration.operationError();
      expect(mockVibrate).toHaveBeenCalledWith([200]);
    });
  });

  describe('禁用状态下的行为', () => {
    it('在振动禁用时不应该执行任何振动', () => {
      // 恢复原始的 getEnabled 方法以测试禁用状态
      vi.restoreAllMocks();
      VibrationUtils.setEnabled(false);
      
      MapVibration.gpsLocked();
      MapVibration.trackingStarted();
      MapVibration.navigationStarted();
      MapVibration.operationError();
      
      expect(mockVibrate).not.toHaveBeenCalled();
    });
  });
});

describe('VibrationPatterns', () => {
  it('应该包含所有预设模式', () => {
    expect(VibrationPatterns.light.pattern).toEqual([50]);
    expect(VibrationPatterns.medium.pattern).toEqual([100]);
    expect(VibrationPatterns.strong.pattern).toEqual([200]);
    expect(VibrationPatterns.double.pattern).toEqual([50, 50, 50]);
    expect(VibrationPatterns.long.pattern).toEqual([300]);
    expect(VibrationPatterns.rhythm.pattern).toEqual([100, 50, 100, 50, 100]);
    expect(VibrationPatterns.emergency.pattern).toEqual([200, 100, 200, 100, 200]);
  });

  it('应该包含描述信息', () => {
    expect(VibrationPatterns.light.description).toBe('轻微震动');
    expect(VibrationPatterns.medium.description).toBe('中等震动');
    expect(VibrationPatterns.strong.description).toBe('强烈震动');
    expect(VibrationPatterns.double.description).toBe('双击震动');
    expect(VibrationPatterns.long.description).toBe('长震动');
    expect(VibrationPatterns.rhythm.description).toBe('节奏震动');
    expect(VibrationPatterns.emergency.description).toBe('紧急震动');
  });
});