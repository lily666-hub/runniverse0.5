import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Challenges from '../pages/Challenges';
import ChallengeProgress from '../pages/ChallengeProgress';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 模拟依赖
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

// 保存原始的 geolocation
const originalGeolocation = navigator.geolocation;

// 模拟全局对象
const mockGeolocation = {
  getCurrentPosition: vi.fn((success) => {
    // 模拟成功获取位置
    success({
      coords: {
        latitude: 31.2304,
        longitude: 121.4737,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      },
      timestamp: Date.now()
    });
  }),
  watchPosition: vi.fn(),
  clearWatch: vi.fn()
};

Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
  configurable: true
});

// 模拟 DeviceMotionEvent 和 DeviceOrientationEvent
global.DeviceMotionEvent = class DeviceMotionEvent extends Event {
  constructor(type: string, eventInitDict?: EventInit) {
    super(type, eventInitDict);
  }
} as any;

global.DeviceOrientationEvent = class DeviceOrientationEvent extends Event {
  constructor(type: string, eventInitDict?: EventInit) {
    super(type, eventInitDict);
  }
} as any;

describe('挑战竞赛流程测试', () => {
  const mockNavigate = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as any).mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Challenges 页面测试', () => {
    it('应该正确渲染挑战列表', async () => {
      render(
        <MemoryRouter>
          <Challenges />
        </MemoryRouter>
      );

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('挑战竞赛')).toBeInTheDocument();
      });

      // 检查挑战列表是否显示
      expect(screen.getByText('新手挑战')).toBeInTheDocument();
      expect(screen.getByText('5公里跑步挑战')).toBeInTheDocument();
      expect(screen.getByText('10公里耐力挑战')).toBeInTheDocument();
    });

    it('应该能够筛选不同类别的挑战', async () => {
      render(
        <MemoryRouter>
          <Challenges />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('挑战竞赛')).toBeInTheDocument();
      });

      // 点击距离筛选
      const distanceFilter = screen.getByText('距离');
      fireEvent.click(distanceFilter);

      // 检查是否只显示距离相关的挑战
      expect(screen.getByText('5公里跑步挑战')).toBeInTheDocument();
      expect(screen.queryByText('30分钟持续跑步')).not.toBeInTheDocument();
    });

    it('应该能够点击开始挑战按钮', async () => {
      render(
        <MemoryRouter>
          <Challenges />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('挑战竞赛')).toBeInTheDocument();
      });

      // 找到第一个开始挑战按钮
      const startButtons = screen.getAllByText('开始挑战');
      expect(startButtons.length).toBeGreaterThan(0);

      // 点击开始挑战
      fireEvent.click(startButtons[0]);

      // 验证导航被调用
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });
    });

    it('应该能够点击查看详情按钮', async () => {
      render(
        <MemoryRouter>
          <Challenges />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('挑战竞赛')).toBeInTheDocument();
      });

      // 找到详情按钮
      const detailButtons = screen.getAllByText('详情');
      expect(detailButtons.length).toBeGreaterThan(0);

      // 点击查看详情
      fireEvent.click(detailButtons[0]);

      // 验证导航被调用
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });
    });

    it('应该能够点击继续挑战按钮', async () => {
      render(
        <MemoryRouter>
          <Challenges />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('挑战竞赛')).toBeInTheDocument();
      });

      // 找到继续挑战按钮
      const continueButtons = screen.getAllByText('继续挑战');
      expect(continueButtons.length).toBeGreaterThan(0);

      // 点击继续挑战
      fireEvent.click(continueButtons[0]);

      // 验证导航被调用
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });
    });
  });

  describe('ChallengeProgress 页面测试', () => {
    it('应该正确渲染挑战进度页面', async () => {
      render(
        <MemoryRouter initialEntries={['/challenge-progress/1']}>
          <Routes>
            <Route path="/challenge-progress/:id" element={<ChallengeProgress />} />
          </Routes>
        </MemoryRouter>
      );

      // 等待数据加载 - 检查具体的挑战标题
      await waitFor(() => {
        expect(screen.getByText('春季马拉松挑战')).toBeInTheDocument();
      });

      // 检查传感器状态显示
      expect(screen.getByText('传感器状态')).toBeInTheDocument();
      expect(screen.getByText('GPS定位')).toBeInTheDocument();
      expect(screen.getByText('运动传感器')).toBeInTheDocument();
    });

    it('应该显示传感器状态', async () => {
      render(
        <MemoryRouter initialEntries={['/challenge-progress/1']}>
          <Routes>
            <Route path="/challenge-progress/:id" element={<ChallengeProgress />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('春季马拉松挑战')).toBeInTheDocument();
      });

      // 检查传感器状态指示器
      expect(screen.getByText('GPS定位')).toBeInTheDocument();
      expect(screen.getByText('运动传感器')).toBeInTheDocument();
      expect(screen.getByText('方向传感器')).toBeInTheDocument();
    });

    it('应该能够点击开始挑战按钮', async () => {
      render(
        <MemoryRouter initialEntries={['/challenge-progress/1']}>
          <Routes>
            <Route path="/challenge-progress/:id" element={<ChallengeProgress />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('开始挑战')).toBeInTheDocument();
      });

      // 点击开始挑战
      const startButton = screen.getByText('开始挑战');
      fireEvent.click(startButton);

      // 等待导航被调用 - 检查具体的导航路径
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/run', expect.any(Object));
      });
    });

    it('应该处理设备不支持的情况', async () => {
      // 模拟设备不支持的情况
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        writable: true,
        configurable: true
      });

      render(
        <MemoryRouter initialEntries={['/challenge-progress/1']}>
          <Routes>
            <Route path="/challenge-progress/:id" element={<ChallengeProgress />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('开始挑战')).toBeInTheDocument();
      });

      // 点击开始挑战
      const startButton = screen.getByText('开始挑战');
      fireEvent.click(startButton);

      // 等待错误提示
      await waitFor(() => {
        expect(screen.getByText(/设备不支持/)).toBeInTheDocument();
      });

      // 恢复 geolocation
      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
        configurable: true
      });
    });

    it('应该能够暂停和继续挑战', async () => {
      render(
        <MemoryRouter initialEntries={['/challenge-progress/1']}>
          <Routes>
            <Route path="/challenge-progress/:id" element={<ChallengeProgress />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('开始挑战')).toBeInTheDocument();
      });

      // 开始挑战
      const startButton = screen.getByText('开始挑战');
      fireEvent.click(startButton);

      // 等待状态更新
      await waitFor(() => {
        expect(screen.getByText('暂停')).toBeInTheDocument();
      });

      // 点击暂停
      const pauseButton = screen.getByText('暂停');
      fireEvent.click(pauseButton);

      // 等待继续按钮出现
      await waitFor(() => {
        expect(screen.getByText('继续')).toBeInTheDocument();
      });

      // 点击继续
      const continueButton = screen.getByText('继续');
      fireEvent.click(continueButton);

      // 验证状态恢复
      await waitFor(() => {
        expect(screen.getByText('暂停')).toBeInTheDocument();
      });
    });

    it('应该能够重置挑战', async () => {
      render(
        <MemoryRouter initialEntries={['/challenge-progress/1']}>
          <Routes>
            <Route path="/challenge-progress/:id" element={<ChallengeProgress />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('重置挑战')).toBeInTheDocument();
      });

      // 点击重置
      const resetButton = screen.getByText('重置挑战');
      fireEvent.click(resetButton);

      // 验证重置后的状态
      await waitFor(() => {
        expect(screen.getByText('开始挑战')).toBeInTheDocument();
      });
    });

    it('应该显示错误信息', async () => {
      // 模拟网络错误
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('网络错误'));

      render(
        <MemoryRouter initialEntries={['/challenge-progress/invalid-id']}>
          <Routes>
            <Route path="/challenge-progress/:id" element={<ChallengeProgress />} />
          </Routes>
        </MemoryRouter>
      );

      // 等待错误显示
      await waitFor(() => {
        expect(screen.getByText(/加载失败/)).toBeInTheDocument();
      });
    });

    it('应该显示空状态', async () => {
      render(
        <MemoryRouter initialEntries={['/challenge-progress/nonexistent']}>
          <Routes>
            <Route path="/challenge-progress/:id" element={<ChallengeProgress />} />
          </Routes>
        </MemoryRouter>
      );

      // 等待空状态显示
      await waitFor(() => {
        expect(screen.getByText('挑战不存在')).toBeInTheDocument();
      });
    });
  });

  describe('异常处理测试', () => {
    it('应该处理网络异常重试', async () => {
      let attemptCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('网络错误'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: '1',
            title: '测试挑战',
            description: '测试描述',
            type: 'distance',
            targetValue: 5000,
            duration: 1800000,
            difficulty: 'beginner',
            status: 'not_started',
            participants: 100,
            reward: '100积分'
          })
        });
      });

      render(
        <MemoryRouter initialEntries={['/challenge-progress/1']}>
          <Routes>
            <Route path="/challenge-progress/:id" element={<ChallengeProgress />} />
          </Routes>
        </MemoryRouter>
      );

      // 等待重试
      await waitFor(() => {
        expect(screen.getByText('测试挑战')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('应该处理权限被拒绝的情况', async () => {
      // 模拟权限被拒绝
      const mockDeniedGeolocation = {
        getCurrentPosition: vi.fn((_success, error) => {
          error({
            code: 1, // PERMISSION_DENIED
            message: 'User denied Geolocation',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3
          });
        }),
        watchPosition: vi.fn(),
        clearWatch: vi.fn()
      };
      
      Object.defineProperty(navigator, 'geolocation', {
        value: mockDeniedGeolocation,
        writable: true,
        configurable: true
      });

      render(
        <MemoryRouter initialEntries={['/challenge-progress/1']}>
          <Routes>
            <Route path="/challenge-progress/:id" element={<ChallengeProgress />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('开始挑战')).toBeInTheDocument();
      });

      // 点击开始挑战
      const startButton = screen.getByText('开始挑战');
      fireEvent.click(startButton);

      // 等待权限错误提示
      await waitFor(() => {
        expect(screen.getByText(/权限被拒绝/)).toBeInTheDocument();
      });

      // 恢复 geolocation
      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
        configurable: true
      });
    });
  });

  describe('数据传递和状态管理测试', () => {
    it('应该正确传递挑战数据', async () => {
      const challengeData = {
        id: '1',
        title: '测试挑战',
        description: '测试描述',
        type: 'distance',
        targetValue: 5000,
        duration: 1800000,
        difficulty: 'beginner',
        status: 'not_started',
        participants: 100,
        reward: '100积分'
      };

      render(
        <MemoryRouter initialEntries={['/challenge-progress/1']}>
          <Routes>
            <Route path="/challenge-progress/:id" element={<ChallengeProgress />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('测试挑战')).toBeInTheDocument();
      });

      // 验证数据正确显示
      expect(screen.getByText('测试描述')).toBeInTheDocument();
      expect(screen.getByText('5公里')).toBeInTheDocument();
      expect(screen.getByText('30分钟')).toBeInTheDocument();
    });

    it('应该正确处理挑战状态变化', async () => {
      render(
        <MemoryRouter initialEntries={['/challenge-progress/1']}>
          <Routes>
            <Route path="/challenge-progress/:id" element={<ChallengeProgress />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('开始挑战')).toBeInTheDocument();
      });

      // 开始挑战
      const startButton = screen.getByText('开始挑战');
      fireEvent.click(startButton);

      // 验证状态变化
      await waitFor(() => {
        expect(screen.getByText('暂停')).toBeInTheDocument();
        expect(screen.queryByText('开始挑战')).not.toBeInTheDocument();
      });
    });
  });
});