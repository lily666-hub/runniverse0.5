// 语音导航服务 - 集成Web Speech API进行语音播报
import type { VoiceNavigationConfig, NavigationStep, GPSPosition } from '../types/navigation';

export class VoiceNavigationService {
  private static instance: VoiceNavigationService | null = null;
  private speechSynthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private config: VoiceNavigationConfig;
  private isEnabled: boolean = false;
  private lastAnnouncementTime: number = 0;
  private lastAnnouncedStep: string = '';

  private constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.config = {
      enabled: true,
      language: 'zh-CN',
      voice: 'female',
      volume: 0.8,
      rate: 1.0,
      pitch: 1.0,
      announceDistance: 50, // 提前50米播报
      repeatInterval: 30000 // 30秒重复播报间隔
    };
  }

  public static getInstance(): VoiceNavigationService {
    if (!VoiceNavigationService.instance) {
      VoiceNavigationService.instance = new VoiceNavigationService();
    }
    return VoiceNavigationService.instance;
  }

  /**
   * 初始化语音服务
   */
  public async initialize(): Promise<void> {
    try {
      // 检查浏览器支持
      if (!('speechSynthesis' in window)) {
        throw new Error('浏览器不支持语音合成功能');
      }

      // 等待语音列表加载
      await this.waitForVoices();
      
      this.isEnabled = true;
      console.log('✅ 语音导航服务初始化完成');
    } catch (error) {
      console.error('❌ 语音导航服务初始化失败:', error);
      this.isEnabled = false;
    }
  }

  /**
   * 等待语音列表加载
   */
  private waitForVoices(): Promise<void> {
    return new Promise((resolve) => {
      const voices = this.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve();
        return;
      }

      const onVoicesChanged = () => {
        this.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        resolve();
      };

      this.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    });
  }

  /**
   * 更新语音配置
   */
  public updateConfig(config: Partial<VoiceNavigationConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('🔧 语音导航配置已更新:', this.config);
  }

  /**
   * 获取当前配置
   */
  public getConfig(): VoiceNavigationConfig {
    return { ...this.config };
  }

  /**
   * 启用/禁用语音导航
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (!enabled) {
      this.stopSpeaking();
    }
    console.log(`🔊 语音导航${enabled ? '已启用' : '已禁用'}`);
  }

  /**
   * 播报导航指令
   */
  public announceNavigation(step: NavigationStep, distanceToStep: number): void {
    if (!this.isEnabled || !this.config.enabled) return;

    const currentTime = Date.now();
    const stepKey = `${step.id}-${step.instruction}`;

    // 检查是否需要播报
    if (!this.shouldAnnounce(stepKey, distanceToStep, currentTime)) {
      return;
    }

    // 生成播报文本
    const announcement = this.generateAnnouncement(step, distanceToStep);
    
    // 播报
    this.speak(announcement);
    
    // 更新播报记录
    this.lastAnnouncementTime = currentTime;
    this.lastAnnouncedStep = stepKey;

    console.log(`🔊 语音播报: ${announcement}`);
  }

  /**
   * 播报到达目的地
   */
  public announceArrival(): void {
    if (!this.isEnabled || !this.config.enabled) return;
    
    const announcement = '恭喜您，已到达目的地！跑步结束。';
    this.speak(announcement);
    console.log(`🎉 语音播报: ${announcement}`);
  }

  /**
   * 播报路线偏离
   */
  public announceRouteDeviation(): void {
    if (!this.isEnabled || !this.config.enabled) return;
    
    const announcement = '您已偏离路线，正在重新规划路线，请稍等。';
    this.speak(announcement);
    console.log(`⚠️ 语音播报: ${announcement}`);
  }

  /**
   * 播报距离和时间信息
   */
  public announceProgress(remainingDistance: number, estimatedTime: number): void {
    if (!this.isEnabled || !this.config.enabled) return;

    const distanceText = remainingDistance > 1000 
      ? `${(remainingDistance / 1000).toFixed(1)}公里`
      : `${Math.round(remainingDistance)}米`;
    
    const timeText = estimatedTime > 60
      ? `${Math.round(estimatedTime / 60)}分钟`
      : `${Math.round(estimatedTime)}秒`;

    const announcement = `距离目的地还有${distanceText}，预计${timeText}到达。`;
    this.speak(announcement);
    console.log(`📍 语音播报: ${announcement}`);
  }

  /**
   * 判断是否需要播报
   */
  private shouldAnnounce(stepKey: string, distanceToStep: number, currentTime: number): boolean {
    // 距离足够近才播报
    if (distanceToStep > this.config.announceDistance) {
      return false;
    }

    // 避免重复播报同一指令
    if (this.lastAnnouncedStep === stepKey) {
      // 检查重复播报间隔
      if (currentTime - this.lastAnnouncementTime < this.config.repeatInterval) {
        return false;
      }
    }

    return true;
  }

  /**
   * 生成播报文本
   */
  private generateAnnouncement(step: NavigationStep, distanceToStep: number): string {
    const distance = Math.round(distanceToStep);
    let announcement = '';

    // 根据动作类型生成不同的播报
    switch (step.action) {
      case 'straight':
        announcement = `前方${distance}米，继续直行`;
        break;
      case 'turn_left':
        announcement = `前方${distance}米，左转`;
        break;
      case 'turn_right':
        announcement = `前方${distance}米，右转`;
        break;
      case 'u_turn':
        announcement = `前方${distance}米，掉头`;
        break;
      case 'arrive':
        announcement = `前方${distance}米，即将到达目的地`;
        break;
      default:
        announcement = `前方${distance}米，${step.instruction}`;
    }

    // 添加道路信息
    if (step.road) {
      announcement += `，沿${step.road}`;
    }

    return announcement;
  }

  /**
   * 执行语音播报
   */
  private speak(text: string): void {
    // 停止当前播报
    this.stopSpeaking();

    // 创建新的语音合成实例
    const utterance = new SpeechSynthesisUtterance(text);
    
    // 设置语音参数
    utterance.lang = this.config.language;
    utterance.volume = this.config.volume;
    utterance.rate = this.config.rate;
    utterance.pitch = this.config.pitch;

    // 选择语音
    const voices = this.speechSynthesis.getVoices();
    const voice = voices.find(v => 
      v.lang.includes(this.config.language) && 
      (this.config.voice === 'female' ? v.name.includes('Female') || v.name.includes('女') : 
       v.name.includes('Male') || v.name.includes('男'))
    ) || voices.find(v => v.lang.includes(this.config.language)) || voices[0];

    if (voice) {
      utterance.voice = voice;
    }

    // 设置事件监听
    utterance.onstart = () => {
      console.log('🔊 开始语音播报');
    };

    utterance.onend = () => {
      console.log('🔊 语音播报结束');
      this.currentUtterance = null;
    };

    utterance.onerror = (event) => {
      console.error('❌ 语音播报错误:', event.error);
      this.currentUtterance = null;
    };

    // 开始播报
    this.currentUtterance = utterance;
    this.speechSynthesis.speak(utterance);
  }

  /**
   * 停止当前播报
   */
  public stopSpeaking(): void {
    if (this.currentUtterance) {
      this.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * 暂停播报
   */
  public pauseSpeaking(): void {
    if (this.speechSynthesis.speaking) {
      this.speechSynthesis.pause();
    }
  }

  /**
   * 恢复播报
   */
  public resumeSpeaking(): void {
    if (this.speechSynthesis.paused) {
      this.speechSynthesis.resume();
    }
  }

  /**
   * 获取可用语音列表
   */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.speechSynthesis.getVoices().filter(voice => 
      voice.lang.includes('zh') || voice.lang.includes('en')
    );
  }

  /**
   * 测试语音播报
   */
  public testVoice(): void {
    const testText = '这是语音导航测试，如果您能听到这段话，说明语音功能正常工作。';
    this.speak(testText);
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    this.stopSpeaking();
    this.isEnabled = false;
    VoiceNavigationService.instance = null;
    console.log('🗑️ 语音导航服务已销毁');
  }
}

// 导出单例实例
export const voiceNavigationService = VoiceNavigationService.getInstance();