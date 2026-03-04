// TTS语音助手设置页面
import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw,
  Save,
  TestTube,
  Speaker,
  Headphones,
  Smartphone,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { TTSService } from '../../services/ttsService';

const ttsService = new TTSService({
  provider: 'browser',
  volume: 50,
  speed: 1.0
});
import { useAuthStore } from '../../store/authStore';
import { ErrorToast, SuccessToast } from '../../components/common/ErrorToast';

interface VoiceSettings {
  provider: 'aliyun' | 'browser';
  voice: string;
  speed: number;
  pitch: number;
  volume: number;
  enableRunningUpdates: boolean;
  enableSafetyAlerts: boolean;
  enableRouteGuidance: boolean;
  updateInterval: number; // 秒
}

interface VoiceOption {
  value: string;
  label: string;
  language: string;
  gender: 'male' | 'female';
}

export const VoiceAssistant: React.FC = () => {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<VoiceSettings>({
    provider: 'browser',
    voice: 'zh-CN-XiaoxiaoNeural',
    speed: 1.0,
    pitch: 1.0,
    volume: 0.8,
    enableRunningUpdates: true,
    enableSafetyAlerts: true,
    enableRouteGuidance: true,
    updateInterval: 30
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [ttsStatus, setTtsStatus] = useState<{
    aliyunAvailable: boolean;
    browserAvailable: boolean;
    currentProvider: string;
  }>({
    aliyunAvailable: false,
    browserAvailable: false,
    currentProvider: 'browser'
  });

  useEffect(() => {
    loadSettings();
    checkTTSAvailability();
    loadAvailableVoices();
  }, []);

  const loadSettings = async () => {
    try {
      const config = await ttsService.getConfig();
      if (config) {
        setSettings(prev => ({
          ...prev,
          provider: config.provider,
          voice: config.voice,
          speed: config.speed,
          pitch: config.pitch,
          volume: config.volume
        }));
      }
    } catch (error) {
      console.error('加载语音设置失败:', error);
    }
  };

  const checkTTSAvailability = async () => {
    try {
      const config = await ttsService.getConfig();
      const browserSupported = 'speechSynthesis' in window;
      const aliyunSupported = !!(config.appKey && config.accessKeyId);

      setTtsStatus({
        aliyunAvailable: aliyunSupported,
        browserAvailable: browserSupported,
        currentProvider: config.provider
      });

      if (!browserSupported && !aliyunSupported) {
        setError('当前设备不支持语音合成功能');
      }
    } catch (error) {
      console.error('检查TTS可用性失败:', error);
    }
  };

  const loadAvailableVoices = async () => {
    try {
      const voices = await ttsService.getAvailableVoices();
      const voiceOptions: VoiceOption[] = voices.map(voice => ({
        value: voice.name,
        label: voice.name,
        language: voice.lang,
        gender: voice.name.includes('Female') || voice.name.includes('Xiaoxiao') || voice.name.includes('Xiaoyi') ? 'female' : 'male'
      }));
      setAvailableVoices(voiceOptions);
    } catch (error) {
      console.error('加载可用语音失败:', error);
      // 提供默认语音选项
      setAvailableVoices([
        { value: 'zh-CN-XiaoxiaoNeural', label: '晓晓 (女声)', language: 'zh-CN', gender: 'female' },
        { value: 'zh-CN-YunxiNeural', label: '云希 (男声)', language: 'zh-CN', gender: 'male' },
        { value: 'zh-CN-XiaoyiNeural', label: '晓伊 (女声)', language: 'zh-CN', gender: 'female' }
      ]);
    }
  };

  const handleSettingsChange = (key: keyof VoiceSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await ttsService.updateConfig({
        provider: settings.provider,
        voice: settings.voice,
        speed: settings.speed,
        pitch: settings.pitch,
        volume: settings.volume
      });

      // 保存用户偏好设置到本地存储
      localStorage.setItem('voiceAssistantSettings', JSON.stringify(settings));

      setSuccessMessage('语音设置保存成功');
    } catch (error) {
      console.error('保存语音设置失败:', error);
      setError('保存设置失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const testVoice = async (testType: 'running' | 'safety' | 'route') => {
    try {
      setIsTesting(true);
      setIsPlaying(true);
      setError(null);

      let testText = '';
      switch (testType) {
        case 'running':
          testText = '您已跑步15分钟，当前配速每公里6分30秒，心率正常，继续保持！';
          break;
        case 'safety':
          testText = '安全提醒：前方路段光线较暗，请注意周围环境，建议放慢速度。';
          break;
        case 'route':
          testText = '路线导航：前方200米右转进入公园主道，注意避让行人。';
          break;
      }

      await ttsService.synthesize(testText, {
        voice: settings.voice,
        speed: settings.speed,
        pitch: settings.pitch,
        volume: settings.volume
      });

      setSuccessMessage('语音测试完成');
    } catch (error) {
      console.error('语音测试失败:', error);
      setError('语音测试失败，请检查设置');
    } finally {
      setIsTesting(false);
      setIsPlaying(false);
    }
  };

  const stopVoice = async () => {
    try {
      await ttsService.stop();
      setIsPlaying(false);
    } catch (error) {
      console.error('停止语音失败:', error);
    }
  };

  const resetToDefaults = () => {
    setSettings({
      provider: 'browser',
      voice: 'zh-CN-XiaoxiaoNeural',
      speed: 1.0,
      pitch: 1.0,
      volume: 0.8,
      enableRunningUpdates: true,
      enableSafetyAlerts: true,
      enableRouteGuidance: true,
      updateInterval: 30
    });
    setSuccessMessage('已重置为默认设置');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Volume2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">语音助手设置</h2>
          <p className="text-gray-600 mb-6">请先登录以配置语音助手</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 错误和成功提示 */}
      <ErrorToast error={error} onClose={() => setError(null)} />
      <SuccessToast message={successMessage} onClose={() => setSuccessMessage(null)} />

      {/* 头部 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Volume2 className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">语音助手设置</h1>
              <p className="text-sm text-gray-600">配置TTS语音合成和播报功能</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={resetToDefaults}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重置默认</span>
            </button>
            
            <button
              onClick={saveSettings}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>保存设置</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* TTS状态卡片 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">TTS服务状态</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${ttsStatus.browserAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <Headphones className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">浏览器TTS</div>
                <div className="text-sm text-gray-600">
                  {ttsStatus.browserAvailable ? '可用' : '不可用'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${ttsStatus.aliyunAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <Speaker className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">阿里云TTS</div>
                <div className="text-sm text-gray-600">
                  {ttsStatus.aliyunAvailable ? '可用' : '需要配置API密钥'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 基础设置 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">基础设置</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TTS提供商 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">TTS提供商</label>
              <select
                value={settings.provider}
                onChange={(e) => handleSettingsChange('provider', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="browser">浏览器TTS (免费)</option>
                <option value="aliyun" disabled={!ttsStatus.aliyunAvailable}>
                  阿里云TTS {!ttsStatus.aliyunAvailable && '(需要配置)'}
                </option>
              </select>
            </div>

            {/* 语音选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">语音</label>
              <select
                value={settings.voice}
                onChange={(e) => handleSettingsChange('voice', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                {availableVoices.map((voice) => (
                  <option key={voice.value} value={voice.value}>
                    {voice.label} ({voice.language})
                  </option>
                ))}
              </select>
            </div>

            {/* 语速 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                语速: {settings.speed.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.speed}
                onChange={(e) => handleSettingsChange('speed', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>慢 (0.5x)</span>
                <span>正常 (1.0x)</span>
                <span>快 (2.0x)</span>
              </div>
            </div>

            {/* 音调 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                音调: {settings.pitch.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.pitch}
                onChange={(e) => handleSettingsChange('pitch', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>低 (0.5)</span>
                <span>正常 (1.0)</span>
                <span>高 (2.0)</span>
              </div>
            </div>

            {/* 音量 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                音量: {Math.round(settings.volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.volume}
                onChange={(e) => handleSettingsChange('volume', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>静音 (0%)</span>
                <span>中等 (50%)</span>
                <span>最大 (100%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 语音测试 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">语音测试</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => testVoice('running')}
              disabled={isTesting}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center space-x-2 mb-2">
                {isTesting ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                ) : (
                  <Play className="w-5 h-5 text-blue-600" />
                )}
                <span className="font-medium text-gray-900">跑步更新</span>
              </div>
              <p className="text-sm text-gray-600">测试跑步过程中的语音播报</p>
            </button>

            <button
              onClick={() => testVoice('safety')}
              disabled={isTesting}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center space-x-2 mb-2">
                {isTesting ? (
                  <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                )}
                <span className="font-medium text-gray-900">安全提醒</span>
              </div>
              <p className="text-sm text-gray-600">测试安全警告语音播报</p>
            </button>

            <button
              onClick={() => testVoice('route')}
              disabled={isTesting}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center space-x-2 mb-2">
                {isTesting ? (
                  <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                ) : (
                  <Settings className="w-5 h-5 text-green-600" />
                )}
                <span className="font-medium text-gray-900">路线导航</span>
              </div>
              <p className="text-sm text-gray-600">测试路线导航语音播报</p>
            </button>
          </div>

          {isPlaying && (
            <div className="mt-4 flex items-center justify-center">
              <button
                onClick={stopVoice}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-2"
              >
                <Pause className="w-4 h-4" />
                <span>停止播放</span>
              </button>
            </div>
          )}
        </div>

        {/* 播报设置 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">播报设置</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">跑步数据播报</div>
                <div className="text-sm text-gray-600">播报配速、距离、心率等跑步数据</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableRunningUpdates}
                  onChange={(e) => handleSettingsChange('enableRunningUpdates', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">安全警告播报</div>
                <div className="text-sm text-gray-600">播报安全提醒和警告信息</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableSafetyAlerts}
                  onChange={(e) => handleSettingsChange('enableSafetyAlerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">路线导航播报</div>
                <div className="text-sm text-gray-600">播报转弯提示和路线指引</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableRouteGuidance}
                  onChange={(e) => handleSettingsChange('enableRouteGuidance', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                播报间隔: {settings.updateInterval} 秒
              </label>
              <input
                type="range"
                min="10"
                max="120"
                step="10"
                value={settings.updateInterval}
                onChange={(e) => handleSettingsChange('updateInterval', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10秒</span>
                <span>60秒</span>
                <span>120秒</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};