import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock SpeechSynthesis
class MockSpeechSynthesisUtterance {
  text: string;
  lang: string = 'zh-CN';
  rate: number = 1.0;
  volume: number = 1.0;
  onstart?: () => void;
  onend?: () => void;
  onerror?: (e: any) => void;
  constructor(text: string) { this.text = text; }
}

// UnifiedGPSAIService mock
const listeners: Record<string, Function[]> = {};
const UnifiedGPSAIServiceMock = {
  initialize: vi.fn(async () => {}),
  on: vi.fn((event: string, cb: Function) => {
    listeners[event] = listeners[event] || [];
    listeners[event].push(cb);
  }),
  off: vi.fn((event: string, cb: Function) => {
    listeners[event] = (listeners[event] || []).filter(fn => fn !== cb);
  }),
  startUnifiedTracking: vi.fn(async () => {}),
  stopUnifiedTracking: vi.fn(async () => {}),
  enableVoiceGuidance: vi.fn(async () => {}),
  disableVoiceGuidance: vi.fn(async () => {}),
  updateVoiceOptions: vi.fn(async () => {}),
  getVoiceGuidanceStatus: vi.fn(() => ({ isEnabled: true, isListening: false, queueLength: 0, options: { language: 'zh-CN', voice: 'female', speed: 1.0, volume: 0.8, enableAIGuidance: true, guidanceInterval: 30000 } })),
};

// 关键：mock 的模块标识字符串必须与 Run.tsx 中 import 的一致
vi.mock('../services/unified/UnifiedGPSAIService', () => ({
  UnifiedGPSAIService: {
    getInstance: vi.fn(() => UnifiedGPSAIServiceMock)
  }
}));

// Mock RouteNavigator to auto-trigger route generation and start navigation when mounted
vi.mock('../../components/navigation/RouteNavigator', () => ({
  RouteNavigator: ({ onRouteGenerated, onStartNavigation }: any) => {
    // fire a route generated event
    setTimeout(() => {
      onRouteGenerated?.({ coordinates: [[121.5, 31.2]] });
      onStartNavigation?.();
    }, 0);
    return <div data-testid="route-navigator-mock" />;
  }
}));

// Mock WaypointManager to supply a waypoint
vi.mock('../../components/navigation/WaypointManager', () => ({
  WaypointManager: ({ onWaypointsUpdate }: any) => {
    setTimeout(() => {
      onWaypointsUpdate?.([{ name: '测试途径点', lat: 31.2001, lng: 121.5001 }]);
    }, 0);
    return <div data-testid="waypoint-manager-mock" />;
  }
}));

// SmartRunningMap minimal mock
vi.mock('../../components/unified/SmartRunningMap', () => ({
  SmartRunningMap: () => <div data-testid="smart-running-map-mock" />
}));

// AIRunningAssistant minimal mock
vi.mock('../../components/unified/AIRunningAssistant', () => ({
  AIRunningAssistant: () => <div data-testid="ai-assistant-mock" />
}));

// VoiceNavigationControl minimal mock to show controls
vi.mock('../../components/VoiceNavigationControl', () => ({
  VoiceNavigationControl: ({ onUpdateOptions, onToggleVoice }: any) => (
    <div>
      <button data-testid="toggle-voice" onClick={() => onToggleVoice(true)}>开启语音</button>
      <button data-testid="update-rate" onClick={() => onUpdateOptions({ speed: 1.5 })}>设语速1.5</button>
      <button data-testid="update-volume" onClick={() => onUpdateOptions({ volume: 0.5 })}>设音量0.5</button>
    </div>
  )
}));

// Bind global SpeechSynthesis mocks
function setupSpeechMocks() {
  const cancel = vi.fn();
  const speak = vi.fn();
  (globalThis as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance as any;
  (globalThis as any).window.speechSynthesis = { cancel, speak } as any;
  return { cancel, speak };
}

// Trigger a gpsUpdate event
function emitGPSUpdate(latitude: number, longitude: number, accuracy = 10) {
  const list = listeners['gpsUpdate'] || [];
  list.forEach(fn => fn({ latitude, longitude, accuracy, timestamp: Date.now() }));
}

// Import after mocks
import Run from '../Run';

describe('Run.tsx 语音播报与导航逻辑（5.0.html对齐）', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('自定义文本播报：默认速率1.0、音量0.8，先取消队列再播报', async () => {
    const { cancel, speak } = setupSpeechMocks();
    render(<Run />);

    // 允许所有 0ms 计时器触发（确保初始化与任何 setTimeout 执行）
    vi.runAllTimers();

    // 输入自定义文本并点击“播报”
    const input = await screen.findByPlaceholderText('输入要播报的内容');
    fireEvent.change(input, { target: { value: '测试播报' } });
    const button = screen.getByText('播报');
    fireEvent.click(button);

    await waitFor(() => {
      expect(cancel).toHaveBeenCalled();
      expect(speak).toHaveBeenCalledTimes(1);
    });

    // 验证 utterance 参数
    const utter = (speak.mock.calls[0][0]) as InstanceType<typeof MockSpeechSynthesisUtterance>;
    expect(utter.text).toBe('测试播报');
    expect(utter.lang).toBe('zh-CN');
    expect(utter.rate).toBeCloseTo(1.0, 2);
    expect(utter.volume).toBeCloseTo(0.8, 2);
  });

  it('通过语音设置更新速率与音量后，播报应按新参数执行', async () => {
    const { speak } = setupSpeechMocks();
    render(<Run />);

    vi.runAllTimers();

    // 开启语音与更新设置
    fireEvent.click(await screen.findByTestId('toggle-voice'));
    fireEvent.click(screen.getByTestId('update-rate'));
    fireEvent.click(screen.getByTestId('update-volume'));

    // 触发一次播报
    const input = await screen.findByPlaceholderText('输入要播报的内容');
    fireEvent.change(input, { target: { value: '参数更新测试' } });
    fireEvent.click(screen.getByText('播报'));

    await waitFor(() => expect(speak).toHaveBeenCalledTimes(1));
    const utter = (speak.mock.calls[0][0]) as InstanceType<typeof MockSpeechSynthesisUtterance>;
    expect(utter.rate).toBeCloseTo(1.5, 2);
    expect(utter.volume).toBeCloseTo(0.5, 2);
  });

  it('路线规划完成应立即播报完成提示（与5.0.html一致）', async () => {
    const { speak } = setupSpeechMocks();
    render(<Run />);

    // 等待 RouteNavigator mock 触发 onRouteGenerated
    await screen.findByTestId('route-navigator-mock');

    // 运行所有计时器以触发 setTimeout 回调
    vi.runAllTimers();

    await waitFor(() => expect(speak).toHaveBeenCalled());

    const utter = (speak.mock.calls[0][0]) as InstanceType<typeof MockSpeechSynthesisUtterance>;
    expect(utter.text).toContain('路线规划完成');
  });

  it('导航模式下靠近途径点（≤25m）应播报“已到达{名称}”并推进索引', async () => {
    const { speak } = setupSpeechMocks();
    render(<Run />);

    // 等待 mock 组件挂载
    await screen.findByTestId('waypoint-manager-mock');
    await screen.findByTestId('route-navigator-mock');

    // 触发定时器以应用途径点更新与开始导航
    vi.runAllTimers();

    // 触发 gpsUpdate，位置接近 (31.2001, 121.5001) 的途径点
    emitGPSUpdate(31.2001, 121.5001, 5);

    await waitFor(() => expect(speak).toHaveBeenCalled());
    const utter = (speak.mock.calls[0][0]) as InstanceType<typeof MockSpeechSynthesisUtterance>;
    expect(utter.text).toContain('已到达');
    expect(utter.text).toContain('测试途径点');
  });

  it('不支持speechSynthesis时应安全降级且不抛异常', async () => {
    // 移除 speechSynthesis
    (globalThis as any).window.speechSynthesis = undefined;
    (globalThis as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance as any;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<Run />);
    vi.runAllTimers();

    const btn = await screen.findByText('播报');
    fireEvent.click(btn);

    await waitFor(() => expect(warnSpy).toHaveBeenCalled());
    warnSpy.mockRestore();
  });
});