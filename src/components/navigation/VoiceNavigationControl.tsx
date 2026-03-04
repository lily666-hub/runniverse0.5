// 语音导航控制组件
import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Settings, Play, TestTube } from 'lucide-react';
import { voiceNavigationService } from '../../services/VoiceNavigationService';
import type { VoiceNavigationConfig } from '../../types/navigation';

interface VoiceNavigationControlProps {
  className?: string;
  onConfigChange?: (config: VoiceNavigationConfig) => void;
}

export const VoiceNavigationControl: React.FC<VoiceNavigationControlProps> = ({
  className = '',
  onConfigChange
}) => {
  const [config, setConfig] = useState<VoiceNavigationConfig>(voiceNavigationService.getConfig());
  const [showSettings, setShowSettings] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化语音服务
  useEffect(() => {
    const initializeVoice = async () => {
      try {
        await voiceNavigationService.initialize();
        setAvailableVoices(voiceNavigationService.getAvailableVoices());
        setIsInitialized(true);
      } catch (error) {
        console.error('语音服务初始化失败:', error);
      }
    };

    initializeVoice();
  }, []);

  // 更新配置
  const updateConfig = (updates: Partial<VoiceNavigationConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    voiceNavigationService.updateConfig(updates);
    onConfigChange?.(newConfig);
  };

  // 切换语音开关
  const toggleVoice = () => {
    const enabled = !config.enabled;
    updateConfig({ enabled });
    voiceNavigationService.setEnabled(enabled);
  };

  // 测试语音
  const testVoice = () => {
    voiceNavigationService.testVoice();
  };

  if (!isInitialized) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-500">语音服务加载中...</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* 主控制按钮 */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleVoice}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            config.enabled
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          {config.enabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {config.enabled ? '语音导航' : '语音已关闭'}
          </span>
        </button>

        {/* 设置按钮 */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="语音设置"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* 测试按钮 */}
        <button
          onClick={testVoice}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="测试语音"
          disabled={!config.enabled}
        >
          <TestTube className="w-4 h-4" />
        </button>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <h3 className="text-lg font-semibold mb-4">语音导航设置</h3>
          
          {/* 语言设置 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              语言
            </label>
            <select
              value={config.language}
              onChange={(e) => updateConfig({ language: e.target.value as 'zh-CN' | 'en-US' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="zh-CN">中文</option>
              <option value="en-US">English</option>
            </select>
          </div>

          {/* 语音类型 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              语音类型
            </label>
            <select
              value={config.voice}
              onChange={(e) => updateConfig({ voice: e.target.value as 'male' | 'female' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="female">女声</option>
              <option value="male">男声</option>
            </select>
          </div>

          {/* 音量设置 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              音量: {Math.round(config.volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.volume}
              onChange={(e) => updateConfig({ volume: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* 语速设置 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              语速: {config.rate.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={config.rate}
              onChange={(e) => updateConfig({ rate: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* 音调设置 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              音调: {config.pitch.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={config.pitch}
              onChange={(e) => updateConfig({ pitch: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* 提前播报距离 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              提前播报距离: {config.announceDistance}米
            </label>
            <input
              type="range"
              min="20"
              max="200"
              step="10"
              value={config.announceDistance}
              onChange={(e) => updateConfig({ announceDistance: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* 重复播报间隔 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              重复播报间隔: {config.repeatInterval / 1000}秒
            </label>
            <input
              type="range"
              min="10000"
              max="60000"
              step="5000"
              value={config.repeatInterval}
              onChange={(e) => updateConfig({ repeatInterval: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={testVoice}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <Play className="w-4 h-4" />
              测试语音
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 点击外部关闭设置面板 */}
      {showSettings && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSettings(false)}
        />
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};