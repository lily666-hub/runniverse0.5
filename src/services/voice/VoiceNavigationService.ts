/**
 * 语音导航服务
 * 基于原有5.0.html的语音播报功能，提供智能语音导航
 */

import type { 
  VoiceNavigationConfig, 
  NavigationInstruction, 
  GPSPosition 
} from '../../types/map';

export interface VoiceNavigationOptions {
  enabled: boolean;
  language: 'zh-CN' | 'en-US';
  rate: number; // 语速 0.1-10
  pitch: number; // 音调 0-2
  volume: number; // 音量 0-1
  autoPlay: boolean; // 自动播放
  repeatInterval: number; // 重复间隔（秒）
}

export interface VoiceEvent {
  type: 'start' | 'end' | 'error' | 'pause' | 'resume';
  text?: string;
  error?: string;
}

export class VoiceNavigationService {
  private config: VoiceNavigationConfig | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isEnabled = false;
  private isSpeaking = false;
  private lastInstruction: NavigationInstruction | null = null;
  private repeatTimer: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeSpeechSynthesis();
  }

  /**
   * 初始化语音合成
   */
  private initializeSpeechSynthesis(): void {
    try {
      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis;
        console.log('✅ 语音合成API初始化成功');
      } else {
        console.warn('⚠️ 浏览器不支持语音合成API');
      }
    } catch (error) {
      console.error('❌ 语音合成初始化失败:', error);
    }
  }

  /**
   * 配置语音导航
   */
  configure(config: VoiceNavigationConfig): void {
    console.log('🔧 配置语音导航:', config);
    
    this.config = config;
    this.isEnabled = config.enabled;

    // 停止当前播放
    this.stop();

    console.log('✅ 语音导航配置完成');
  }

  /**
   * 启用语音导航
   */
  enable(): void {
    if (!this.synthesis) {
      console.warn('⚠️ 语音合成不可用，无法启用语音导航');
      return;
    }

    this.isEnabled = true;
    console.log('✅ 语音导航已启用');
    this.emit('enabled');
  }

  /**
   * 禁用语音导航
   */
  disable(): void {
    this.isEnabled = false;
    this.stop();
    console.log('✅ 语音导航已禁用');
    this.emit('disabled');
  }

  /**
   * 播放导航指令
   */
  speak(instruction: NavigationInstruction): void {
    if (!this.isEnabled || !this.synthesis || !this.config) {
      return;
    }

    console.log('🔊 播放导航指令:', instruction.text);

    // 停止当前播放
    this.stop();

    // 创建语音合成实例
    this.currentUtterance = new SpeechSynthesisUtterance(instruction.text);
    
    // 设置语音参数
    this.currentUtterance.lang = this.config.language || 'zh-CN';
    this.currentUtterance.rate = this.config.rate || 1;
    this.currentUtterance.pitch = this.config.pitch || 1;
    this.currentUtterance.volume = this.config.volume || 1;

    // 设置事件监听
    this.currentUtterance.onstart = () => {
      this.isSpeaking = true;
      this.emit('start', { type: 'start', text: instruction.text });
      console.log('🎵 开始播放语音');
    };

    this.currentUtterance.onend = () => {
      this.isSpeaking = false;
      this.emit('end', { type: 'end', text: instruction.text });
      console.log('🎵 语音播放完成');
      
      // 设置重复播放
      if (this.config.repeatInterval > 0) {
        this.scheduleRepeat(instruction);
      }
    };

    this.currentUtterance.onerror = (event) => {
      this.isSpeaking = false;
      const error = `语音播放错误: ${event.error}`;
      console.error('❌', error);
      this.emit('error', { type: 'error', error });
    };

    this.currentUtterance.onpause = () => {
      this.emit('pause', { type: 'pause' });
      console.log('⏸️ 语音播放暂停');
    };

    this.currentUtterance.onresume = () => {
      this.emit('resume', { type: 'resume' });
      console.log('▶️ 语音播放恢复');
    };

    // 开始播放
    try {
      this.synthesis.speak(this.currentUtterance);
      this.lastInstruction = instruction;
    } catch (error) {
      console.error('❌ 语音播放失败:', error);
      this.emit('error', { type: 'error', error: `语音播放失败: ${error}` });
    }
  }

  /**
   * 播放自定义文本
   */
  speakText(text: string): void {
    if (!this.isEnabled || !this.synthesis || !this.config) {
      return;
    }

    console.log('🔊 播放自定义文本:', text);

    const instruction: NavigationInstruction = {
      id: `custom_${Date.now()}`,
      text,
      distance: 0,
      duration: 0,
      direction: '',
      coordinates: [0, 0],
      sequence: 0
    };

    this.speak(instruction);
  }

  /**
   * 停止播放
   */
  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    
    this.isSpeaking = false;
    this.currentUtterance = null;
    
    // 清除重复定时器
    if (this.repeatTimer) {
      clearTimeout(this.repeatTimer);
      this.repeatTimer = null;
    }

    console.log('⏹️ 语音播放已停止');
  }

  /**
   * 暂停播放
   */
  pause(): void {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.pause();
      console.log('⏸️ 语音播放已暂停');
    }
  }

  /**
   * 恢复播放
   */
  resume(): void {
    if (this.synthesis && this.synthesis.paused) {
      this.synthesis.resume();
      console.log('▶️ 语音播放已恢复');
    }
  }

  /**
   * 获取可用语音列表
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    
    return this.synthesis.getVoices();
  }

  /**
   * 设置语音
   */
  setVoice(voiceURI: string): void {
    if (!this.config) return;
    
    const voices = this.getAvailableVoices();
    const voice = voices.find(v => v.voiceURI === voiceURI);
    
    if (voice) {
      this.config.voice = voice;
      console.log('✅ 语音设置成功:', voice.name);
    } else {
      console.warn('⚠️ 未找到指定语音:', voiceURI);
    }
  }

  /**
   * 播放距离提醒
   */
  speakDistance(distance: number): void {
    if (!this.isEnabled) return;

    let text = '';
    
    if (distance >= 1000) {
      const km = Math.round(distance / 100) / 10;
      text = `距离目标还有${km}公里`;
    } else if (distance >= 100) {
      const meters = Math.round(distance / 10) * 10;
      text = `距离目标还有${meters}米`;
    } else if (distance >= 10) {
      text = `距离目标还有${Math.round(distance)}米`;
    } else {
      text = '即将到达目标';
    }

    this.speakText(text);
  }

  /**
   * 播放转向指令
   */
  speakTurnInstruction(direction: string, distance: number): void {
    if (!this.isEnabled) return;

    const directionMap: { [key: string]: string } = {
      'left': '左转',
      'right': '右转',
      'straight': '直行',
      'slight_left': '稍微左转',
      'slight_right': '稍微右转',
      'sharp_left': '急左转',
      'sharp_right': '急右转',
      'u_turn': '掉头'
    };

    const directionText = directionMap[direction] || direction;
    let distanceText = '';

    if (distance > 0) {
      if (distance >= 1000) {
        const km = Math.round(distance / 100) / 10;
        distanceText = `${km}公里后`;
      } else {
        distanceText = `${Math.round(distance)}米后`;
      }
    }

    const text = `${distanceText}${directionText}`;
    this.speakText(text);
  }

  /**
   * 播放安全提醒
   */
  speakSafetyAlert(message: string): void {
    if (!this.isEnabled) return;

    // 安全提醒使用更高的优先级
    this.stop();
    
    const alertText = `安全提醒：${message}`;
    this.speakText(alertText);
  }

  /**
   * 播放GPS状态
   */
  speakGPSStatus(status: 'connected' | 'disconnected' | 'weak'): void {
    if (!this.isEnabled) return;

    const statusMap = {
      'connected': 'GPS信号良好',
      'disconnected': 'GPS信号丢失',
      'weak': 'GPS信号较弱'
    };

    this.speakText(statusMap[status]);
  }

  /**
   * 播放运动数据
   */
  speakRunningStats(stats: {
    distance?: number;
    duration?: number;
    pace?: number;
    speed?: number;
  }): void {
    if (!this.isEnabled) return;

    const parts: string[] = [];

    if (stats.distance !== undefined) {
      const km = (stats.distance / 1000).toFixed(1);
      parts.push(`已跑${km}公里`);
    }

    if (stats.duration !== undefined) {
      const minutes = Math.floor(stats.duration / 60);
      const seconds = stats.duration % 60;
      if (minutes > 0) {
        parts.push(`用时${minutes}分${seconds}秒`);
      } else {
        parts.push(`用时${seconds}秒`);
      }
    }

    if (stats.pace !== undefined) {
      const paceMin = Math.floor(stats.pace / 60);
      const paceSec = Math.round(stats.pace % 60);
      parts.push(`配速${paceMin}分${paceSec}秒每公里`);
    }

    if (stats.speed !== undefined) {
      parts.push(`速度${stats.speed.toFixed(1)}公里每小时`);
    }

    if (parts.length > 0) {
      this.speakText(parts.join('，'));
    }
  }

  /**
   * 检查语音合成支持
   */
  isSupported(): boolean {
    return !!this.synthesis;
  }

  /**
   * 检查离线语音支持
   */
  checkOfflineVoiceSupport(): {
    isSupported: boolean;
    availableVoices: SpeechSynthesisVoice[];
    offlineVoices: SpeechSynthesisVoice[];
    recommendations: string[];
  } {
    const voices = this.getAvailableVoices();
    const offlineVoices = voices.filter(voice => voice.localService);
    
    const recommendations: string[] = [];
    
    if (offlineVoices.length === 0) {
      recommendations.push('当前没有离线语音，建议下载系统语音包以支持离线使用');
      recommendations.push('在网络不稳定时可能影响语音播报功能');
    } else {
      recommendations.push(`检测到${offlineVoices.length}个离线语音，支持离线语音播报`);
      
      // 推荐中文语音
      const chineseVoices = offlineVoices.filter(voice => 
        voice.lang.includes('zh') || voice.lang.includes('CN')
      );
      
      if (chineseVoices.length > 0) {
        recommendations.push(`推荐使用离线中文语音: ${chineseVoices[0].name}`);
      }
    }

    return {
      isSupported: offlineVoices.length > 0,
      availableVoices: voices,
      offlineVoices,
      recommendations
    };
  }

  /**
   * 设置最佳离线语音
   */
  setBestOfflineVoice(): boolean {
    const { offlineVoices } = this.checkOfflineVoiceSupport();
    
    if (offlineVoices.length === 0) {
      console.warn('⚠️ 没有可用的离线语音');
      return false;
    }

    // 优先选择中文语音
    let bestVoice = offlineVoices.find(voice => 
      voice.lang.includes('zh') || voice.lang.includes('CN')
    );

    // 如果没有中文语音，选择第一个可用的离线语音
    if (!bestVoice) {
      bestVoice = offlineVoices[0];
    }

    if (bestVoice && this.config) {
      this.config.voice = bestVoice;
      console.log('✅ 已设置最佳离线语音:', bestVoice.name);
      return true;
    }

    return false;
  }

  /**
   * 获取语音质量信息
   */
  getVoiceQualityInfo(): {
    currentVoice: SpeechSynthesisVoice | null;
    isOffline: boolean;
    quality: 'high' | 'medium' | 'low';
    recommendations: string[];
  } {
    const currentVoice = this.config?.voice || null;
    const isOffline = currentVoice ? currentVoice.localService : false;
    
    let quality: 'high' | 'medium' | 'low' = 'low';
    const recommendations: string[] = [];

    if (currentVoice) {
      // 判断语音质量
      if (isOffline && currentVoice.lang.includes('zh')) {
        quality = 'high';
        recommendations.push('当前使用高质量离线中文语音');
      } else if (isOffline) {
        quality = 'medium';
        recommendations.push('当前使用离线语音，但非中文语音');
        recommendations.push('建议切换到中文语音以获得更好的体验');
      } else {
        quality = 'medium';
        recommendations.push('当前使用在线语音，网络不稳定时可能影响播报');
        recommendations.push('建议下载离线语音包以确保稳定性');
      }
    } else {
      recommendations.push('未设置语音，将使用系统默认语音');
      recommendations.push('建议手动选择合适的语音以获得最佳体验');
    }

    return {
      currentVoice,
      isOffline,
      quality,
      recommendations
    };
  }

  /**
   * 获取当前状态
   */
  getStatus(): {
    isEnabled: boolean;
    isSpeaking: boolean;
    isSupported: boolean;
    currentInstruction: NavigationInstruction | null;
  } {
    return {
      isEnabled: this.isEnabled,
      isSpeaking: this.isSpeaking,
      isSupported: this.isSupported(),
      currentInstruction: this.lastInstruction
    };
  }

  /**
   * 事件监听
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * 移除事件监听
   */
  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`语音事件回调执行失败 [${event}]:`, error);
        }
      });
    }
  }

  /**
   * 安排重复播放
   */
  private scheduleRepeat(instruction: NavigationInstruction): void {
    if (!this.config || this.config.repeatInterval <= 0) return;

    this.repeatTimer = setTimeout(() => {
      if (this.isEnabled && !this.isSpeaking) {
        this.speak(instruction);
      }
    }, this.config.repeatInterval * 1000);
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    console.log('🗑️ 销毁语音导航服务...');
    
    this.stop();
    this.eventListeners.clear();
    this.config = null;
    this.lastInstruction = null;
    
    console.log('✅ 语音导航服务已销毁');
  }
}

// 创建单例实例
export const voiceNavigationService = new VoiceNavigationService();

// 默认导出
export default VoiceNavigationService;