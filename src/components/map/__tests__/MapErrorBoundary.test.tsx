import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MapErrorBoundary from '../MapErrorBoundary';

// 模拟错误处理器
const mockErrorHandler = {
  logError: vi.fn(),
  createError: vi.fn()
};

vi.mock('../../../utils/errorHandler', () => ({
  errorHandler: mockErrorHandler
}));

// 模拟响应式工具
vi.mock('../../../utils/responsive', () => ({
  responsiveUtils: {
    isMobile: vi.fn(() => false)
  }
}));

// 创建一个会抛出错误的测试组件
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('测试错误');
  }
  return <div>正常组件</div>;
};

// 创建一个会抛出特定类型错误的组件
const ThrowSpecificError = ({ errorType }: { errorType: string }) => {
  switch (errorType) {
    case 'gps':
      throw new Error('GPS_ERROR: GPS定位失败');
    case 'network':
      throw new Error('NETWORK_ERROR: 网络连接失败');
    case 'map':
      throw new Error('MAP_LOAD_ERROR: 地图加载失败');
    default:
      throw new Error('未知错误');
  }
};

describe('MapErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 抑制控制台错误输出
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('正常渲染', () => {
    it('应该正常渲染子组件', () => {
      render(
        <MapErrorBoundary>
          <ThrowError shouldThrow={false} />
        </MapErrorBoundary>
      );

      expect(screen.getByText('正常组件')).toBeInTheDocument();
    });
  });

  describe('错误捕获', () => {
    it('应该捕获子组件的错误', () => {
      render(
        <MapErrorBoundary>
          <ThrowError shouldThrow={true} />
        </MapErrorBoundary>
      );

      expect(screen.getByText('地图加载失败')).toBeInTheDocument();
      expect(screen.getByText('抱歉，地图组件遇到了问题。请尝试刷新页面或稍后再试。')).toBeInTheDocument();
    });

    it('应该记录错误到错误处理器', () => {
      render(
        <MapErrorBoundary>
          <ThrowError shouldThrow={true} />
        </MapErrorBoundary>
      );

      expect(mockErrorHandler.logError).toHaveBeenCalled();
    });
  });

  describe('特定错误类型处理', () => {
    it('应该处理 GPS 错误', () => {
      render(
        <MapErrorBoundary>
          <ThrowSpecificError errorType="gps" />
        </MapErrorBoundary>
      );

      expect(screen.getByText('GPS定位失败')).toBeInTheDocument();
      expect(screen.getByText('无法获取您的位置信息。请检查设备的GPS设置并允许位置访问权限。')).toBeInTheDocument();
    });

    it('应该处理网络错误', () => {
      render(
        <MapErrorBoundary>
          <ThrowSpecificError errorType="network" />
        </MapErrorBoundary>
      );

      expect(screen.getByText('网络连接失败')).toBeInTheDocument();
      expect(screen.getByText('无法连接到地图服务。请检查您的网络连接并重试。')).toBeInTheDocument();
    });

    it('应该处理地图加载错误', () => {
      render(
        <MapErrorBoundary>
          <ThrowSpecificError errorType="map" />
        </MapErrorBoundary>
      );

      expect(screen.getByText('地图加载失败')).toBeInTheDocument();
      expect(screen.getByText('地图资源加载失败。请检查网络连接或稍后重试。')).toBeInTheDocument();
    });

    it('应该处理未知错误', () => {
      render(
        <MapErrorBoundary>
          <ThrowSpecificError errorType="unknown" />
        </MapErrorBoundary>
      );

      expect(screen.getByText('地图加载失败')).toBeInTheDocument();
      expect(screen.getByText('抱歉，地图组件遇到了问题。请尝试刷新页面或稍后再试。')).toBeInTheDocument();
    });
  });

  describe('重试功能', () => {
    it('应该显示重试按钮', () => {
      render(
        <MapErrorBoundary>
          <ThrowError shouldThrow={true} />
        </MapErrorBoundary>
      );

      const retryButton = screen.getByText('重试');
      expect(retryButton).toBeInTheDocument();
    });

    it('应该在点击重试时重新渲染组件', () => {
      let shouldThrow = true;
      
      const TestComponent = () => <ThrowError shouldThrow={shouldThrow} />;
      
      const { rerender } = render(
        <MapErrorBoundary>
          <TestComponent />
        </MapErrorBoundary>
      );

      // 确认错误状态
      expect(screen.getByText('地图加载失败')).toBeInTheDocument();

      // 修改错误状态
      shouldThrow = false;
      
      // 点击重试
      const retryButton = screen.getByText('重试');
      fireEvent.click(retryButton);

      // 重新渲染
      rerender(
        <MapErrorBoundary>
          <TestComponent />
        </MapErrorBoundary>
      );

      // 应该显示正常组件
      expect(screen.getByText('正常组件')).toBeInTheDocument();
    });
  });

  describe('刷新页面功能', () => {
    it('应该显示刷新页面按钮', () => {
      render(
        <MapErrorBoundary>
          <ThrowError shouldThrow={true} />
        </MapErrorBoundary>
      );

      const refreshButton = screen.getByText('刷新页面');
      expect(refreshButton).toBeInTheDocument();
    });

    it('应该在点击刷新页面时调用 window.location.reload', () => {
      const mockReload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      });

      render(
        <MapErrorBoundary>
          <ThrowError shouldThrow={true} />
        </MapErrorBoundary>
      );

      const refreshButton = screen.getByText('刷新页面');
      fireEvent.click(refreshButton);

      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('开发模式', () => {
    it('应该在开发模式下显示详细错误信息', () => {
      // 模拟开发模式
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <MapErrorBoundary>
          <ThrowError shouldThrow={true} />
        </MapErrorBoundary>
      );

      expect(screen.getByText('错误详情:')).toBeInTheDocument();
      expect(screen.getByText('测试错误')).toBeInTheDocument();

      // 恢复环境变量
      process.env.NODE_ENV = originalEnv;
    });

    it('应该在生产模式下隐藏详细错误信息', () => {
      // 模拟生产模式
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <MapErrorBoundary>
          <ThrowError shouldThrow={true} />
        </MapErrorBoundary>
      );

      expect(screen.queryByText('错误详情:')).not.toBeInTheDocument();
      expect(screen.queryByText('测试错误')).not.toBeInTheDocument();

      // 恢复环境变量
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('移动端适配', () => {
    it('应该在移动端使用适配的样式', () => {
      vi.mocked(require('../../../utils/responsive').responsiveUtils.isMobile).mockReturnValue(true);

      render(
        <MapErrorBoundary>
          <ThrowError shouldThrow={true} />
        </MapErrorBoundary>
      );

      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toHaveClass('p-4', 'text-sm');
    });

    it('应该在桌面端使用标准样式', () => {
      vi.mocked(require('../../../utils/responsive').responsiveUtils.isMobile).mockReturnValue(false);

      render(
        <MapErrorBoundary>
          <ThrowError shouldThrow={true} />
        </MapErrorBoundary>
      );

      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toHaveClass('p-6', 'text-base');
    });
  });

  describe('自定义错误回退组件', () => {
    it('应该支持自定义错误回退组件', () => {
      const CustomFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
        <div>
          <h2>自定义错误页面</h2>
          <p>{error.message}</p>
          <button onClick={retry}>自定义重试</button>
        </div>
      );

      render(
        <MapErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={true} />
        </MapErrorBoundary>
      );

      expect(screen.getByText('自定义错误页面')).toBeInTheDocument();
      expect(screen.getByText('自定义重试')).toBeInTheDocument();
    });
  });

  describe('错误恢复', () => {
    it('应该在 props 变化时重置错误状态', () => {
      const { rerender } = render(
        <MapErrorBoundary key="test1">
          <ThrowError shouldThrow={true} />
        </MapErrorBoundary>
      );

      // 确认错误状态
      expect(screen.getByText('地图加载失败')).toBeInTheDocument();

      // 使用不同的 key 重新渲染
      rerender(
        <MapErrorBoundary key="test2">
          <ThrowError shouldThrow={false} />
        </MapErrorBoundary>
      );

      // 应该显示正常组件
      expect(screen.getByText('正常组件')).toBeInTheDocument();
    });
  });

  describe('错误边界嵌套', () => {
    it('应该正确处理嵌套的错误边界', () => {
      render(
        <MapErrorBoundary>
          <MapErrorBoundary>
            <ThrowError shouldThrow={true} />
          </MapErrorBoundary>
        </MapErrorBoundary>
      );

      // 内层错误边界应该捕获错误
      expect(screen.getByText('地图加载失败')).toBeInTheDocument();
    });
  });
});