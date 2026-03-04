// 语音导航控制组件
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Settings } from 'lucide-react';
import type { VoiceGuidanceOptions } from '../services/unified/VoiceGuidanceService';

interface VoiceNavigationControlProps {
  isEnabled: boolean;
  onToggleVoice: (enabled: boolean) => void;
  onUpdateOptions: (options: Partial<VoiceGuidanceOptions>) => void;
  voiceStatus?: {
    isEnabled: boolean;
    isListening: boolean;
    queueLength: number;
    options: VoiceGuidanceOptions;
  };
}

export const VoiceNavigationControl: React.FC<VoiceNavigationControlProps> = ({
  isEnabled,
  onToggleVoice,
  onUpdateOptions,
  voiceStatus
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [localOptions, setLocalOptions] = useState<VoiceGuidanceOptions>({
    language: 'zh-CN',
    voice: 'female',
    speed: 1.0,
    volume: 0.8,
    enableAIGuidance: true,
    guidanceInterval: 30000
  });

  useEffect(() => {
    if (voiceStatus?.options) {
      setLocalOptions(voiceStatus.options);
    }
  }, [voiceStatus?.options]);

  const handleToggleVoice = () => {
    onToggleVoice(!isEnabled);
  };

  const handleOptionChange = (key: keyof VoiceGuidanceOptions, value: any) => {
    const newOptions = { ...localOptions, [key]: value };
    setLocalOptions(newOptions);
    onUpdateOptions({ [key]: value });
  };

  const supportInfo = React.useMemo(() => {
    if (typeof window === 'undefined') return { speechSynthesis: false, speechRecognition: false };
    
    return {
      speechSynthesis: 'speechSynthesis' in window,
      speechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          语音导航
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="语音设置"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleVoice}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isEnabled
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isEnabled ? (
              <>
                <Volume2 className="w-4 h-4" />
                语音开启
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                语音关闭
              </>
            )}
          </button>
        </div>
      </div>

      {/* 状态指示器 */}
      {isEnabled && voiceStatus && (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            {voiceStatus.isListening ? (
              <>
                <Mic className="w-4 h-4 text-green-500" />
                <span className="text-green-600">正在监听</span>
              </>
            ) : (
              <>
                <MicOff className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">未监听</span>
              </>
            )}
          </div>
          
          {voiceStatus.queueLength > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-blue-600">{voiceStatus.queueLength} 条待播报</span>
            </div>
          )}
        </div>
      )}

      {/* 浏览器支持状态 */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${supportInfo.speechSynthesis ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>语音合成{supportInfo.speechSynthesis ? '支持' : '不支持'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${supportInfo.speechRecognition ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>语音识别{supportInfo.speechRecognition ? '支持' : '不支持'}</span>
        </div>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="border-t pt-4 space-y-4">
          <h4 className="font-medium text-gray-700">语音设置</h4>
          
          {/* 语言选择 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">语言</label>
            <select
              value={localOptions.language}
              onChange={(e) => handleOptionChange('language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="zh-CN">中文</option>
              <option value="en-US">English</option>
            </select>
          </div>

          {/* 语音类型 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">语音类型</label>
            <select
              value={localOptions.voice}
              onChange={(e) => handleOptionChange('voice', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="female">女声</option>
              <option value="male">男声</option>
            </select>
          </div>

          {/* 语速 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">
              语速: {localOptions.speed?.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={localOptions.speed}
              onChange={(e) => handleOptionChange('speed', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* 音量 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">
              音量: {Math.round((localOptions.volume || 0) * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={localOptions.volume}
              onChange={(e) => handleOptionChange('volume', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* AI指导间隔 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">
              AI指导间隔: {Math.round((localOptions.guidanceInterval || 30000) / 1000)}秒
            </label>
            <input
              type="range"
              min="10000"
              max="120000"
              step="5000"
              value={localOptions.guidanceInterval}
              onChange={(e) => handleOptionChange('guidanceInterval', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* AI指导开关 */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-600">启用AI智能指导</label>
            <button
              onClick={() => handleOptionChange('enableAIGuidance', !localOptions.enableAIGuidance)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localOptions.enableAIGuidance ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localOptions.enableAIGuidance ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* 使用提示 */}
      {isEnabled && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700">
            💡 <strong>语音命令：</strong>说"帮助"获取可用命令，"暂停导航"暂停语音，"继续导航"恢复语音
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceNavigationControl;