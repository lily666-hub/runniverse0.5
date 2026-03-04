// 语音导航服务 - 支持语音指导和交互
import { aiService } from '../ai/aiService';
import type { GPSData, NavigationGuidance } from '../../types/unified';
import type { RealtimeLocation } from '../../types';

export interface VoiceGuidanceOptions {
  language?: 'zh-CN' | 'en-US';
  voice?: 'male' | 'female';
  speed?: number; // 0.5 - 2.0
  volume?: number; // 0.0 - 1.0
  enableAIGuidance?: boolean;
  guidanceInterval?: number; // 毫秒
}

export interface VoiceCommand {
  command: string;
  confidence: number;
  timestamp: Date;
}

export interface VoiceGuidanceEvent {
  type: 'guidance' | 'command' | 'error' | 'status';
  data: any;
  timestamp: Date;
}

export class VoiceGuidanceService {
  private static instance: VoiceGuidanceService;
  private speechSynthesis: SpeechSynthesis;
  private speechRecognition: any; // SpeechRecognition
  private isListening = false;
  private isEnabled = false;
  private currentVoice: SpeechSynthesisVoice | null = null;
  private options: VoiceGuidanceOptions = {
    language: 'zh-CN',
    voice: 'female',
    speed: 1.0,
    volume: 0.8,
    enableAIGuidance: true,
    guidanceInterval: 30000 // 30秒
  };
  
  // 事件监听器
  private eventListeners: Map<string, Function[]> = new Map();
  
  // 语音指导缓存
  private guidanceQueue: string[] = [];
  private lastGuidanceTime = 0;
  private guidanceTimer: NodeJS.Timeout | null = null;
  
  // AI集成
  private userId: string = '';
  private currentSessionId: string = '';

  static getInstance(): VoiceGuidanceService {
    if (!VoiceGuidanceService.instance) {
      VoiceGuidanceService.instance = new VoiceGuidanceService();
    }
    return VoiceGuidanceService.instance;
  }

  constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.initializeSpeechRecognition();
    this.loadVoices();
  }

  /**
   * 初始化语音识别
   */
  private initializeSpeechRecognition(): void {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || 
                               (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        this.speechRecognition = new SpeechRecognition();
        this.speechRecognition.continuous = true;
        this.speechRecognition.interimResults = false;
        this.speechRecognition.lang = this.options.language;
        
        this.speechRecognition.onresult = (event: any) => {
          this.handleSpeechResult(event);
        };
        
        this.speechRecognition.onerror = (event: any) => {
          this.handleSpeechError(event);
        };
        
        this.speechRecognition.onend = () => {
          if (this.isListening) {
            // 自动重启监听
            setTimeout(() => {
              this.speechRecognition.start();
            }, 1000);
          }
        };
      }
    } catch (error) {
      console.warn('语音识别不可用:', error);
    }
  }

  /**
   * 加载可用语音
   */
  private loadVoices(): void {
    const voices = this.speechSynthesis.getVoices();
    if (voices.length === 0) {
      // 等待语音加载完成
      this.speechSynthesis.onvoiceschanged = () => {
        this.selectVoice();
      };
    } else {
      this.selectVoice();
    }
  }

  /**
   * 选择语音
   */
  private selectVoice(): void {
    const voices = this.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.includes(this.options.language!) && 
      (this.options.voice === 'female' ? 
        voice.name.includes('Female') || voice.name.includes('女') :
        voice.name.includes('Male') || voice.name.includes('男'))
    );
    
    this.currentVoice = preferredVoice || voices.find(voice => 
      voice.lang.includes(this.options.language!)
    ) || voices[0] || null;
  }

  /**
   * 启动语音导航
   */
  async startVoiceGuidance(userId: string, sessionId: string, options?: Partial<VoiceGuidanceOptions>): Promise<void> {
    try {
      this.userId = userId;
      this.currentSessionId = sessionId;
      
      if (options) {
        this.options = { ...this.options, ...options };
      }
      
      this.isEnabled = true;
      
      // 启动语音识别
      if (this.speechRecognition && !this.isListening) {
        this.speechRecognition.lang = this.options.language;
        this.speechRecognition.start();
        this.isListening = true;
      }
      
      // 启动定期指导
      if (this.options.enableAIGuidance) {
        this.startPeriodicGuidance();
      }
      
      // 播放启动提示
      await this.speak('语音导航已启动，您可以说"帮助"获取可用命令');
      
      this.emitEvent('status', { 
        type: 'started', 
        message: '语音导航已启动' 
      });
    } catch (error) {
      console.error('启动语音导航失败:', error);
      throw error;
    }
  }

  /**
   * 停止语音导航
   */
  async stopVoiceGuidance(): Promise<void> {
    try {
      this.isEnabled = false;
      
      // 停止语音识别
      if (this.speechRecognition && this.isListening) {
        this.speechRecognition.stop();
        this.isListening = false;
      }
      
      // 停止定期指导
      this.stopPeriodicGuidance();
      
      // 清空指导队列
      this.guidanceQueue = [];
      
      // 停止当前语音
      this.speechSynthesis.cancel();
      
      this.emitEvent('status', { 
        type: 'stopped', 
        message: '语音导航已停止' 
      });
    } catch (error) {
      console.error('停止语音导航失败:', error);
      throw error;
    }
  }

  /**
   * 语音播报
   */
  async speak(text: string, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<void> {
    if (!this.isEnabled) return;
    
    return new Promise((resolve, reject) => {
      try {
        // 高优先级消息立即播放
        if (priority === 'high') {
          this.speechSynthesis.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.currentVoice;
        utterance.rate = this.options.speed!;
        utterance.volume = this.options.volume!;
        utterance.lang = this.options.language!;
        
        utterance.onend = () => resolve();
        utterance.onerror = (event) => reject(event.error);
        
        this.speechSynthesis.speak(utterance);
        
        this.emitEvent('guidance', {
          text,
          priority,
          timestamp: new Date()
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 添加导航指导
   */
  async addGuidance(guidance: NavigationGuidance): Promise<void> {
    if (!this.isEnabled) return;
    
    try {
      let message = '';
      
      switch (guidance.type) {
        case 'turn':
          message = `前方${guidance.distance}米${guidance.instruction}`;
          break;
        case 'continue':
          message = guidance.instruction;
          break;
        case 'arrival':
          message = `已到达${guidance.instruction}`;
          break;
        case 'warning':
          message = `注意：${guidance.instruction}`;
          await this.speak(message, 'high');
          return;
        case 'emergency':
          message = `紧急：${guidance.instruction}`;
          await this.speak(message, 'high');
          return;
        default:
          message = guidance.instruction;
      }
      
      // 普通指导加入队列
      this.guidanceQueue.push(message);
      this.processGuidanceQueue();
    } catch (error) {
      console.error('添加导航指导失败:', error);
    }
  }

  /**
   * 处理指导队列
   */
  private async processGuidanceQueue(): Promise<void> {
    if (this.guidanceQueue.length === 0 || this.speechSynthesis.speaking) {
      return;
    }
    
    const message = this.guidanceQueue.shift();
    if (message) {
      await this.speak(message);
      
      // 处理下一个
      setTimeout(() => {
        this.processGuidanceQueue();
      }, 1000);
    }
  }

  /**
   * 启动定期指导
   */
  private startPeriodicGuidance(): void {
    this.guidanceTimer = setInterval(async () => {
      if (this.isEnabled && this.options.enableAIGuidance) {
        await this.generateAIGuidance();
      }
    }, this.options.guidanceInterval!);
  }

  /**
   * 停止定期指导
   */
  private stopPeriodicGuidance(): void {
    if (this.guidanceTimer) {
      clearInterval(this.guidanceTimer);
      this.guidanceTimer = null;
    }
  }

  /**
   * 生成AI指导
   */
  private async generateAIGuidance(): Promise<void> {
    try {
      if (!this.userId) return;
      
      // 获取AI建议
      const response = await aiService.sendMessage(
        this.userId,
        '请提供当前跑步状态的简短语音指导建议',
        this.currentSessionId,
        undefined,
        'kimi',
        'safety'
      );
      
      if (response.response.message) {
        // 提取简短的指导内容
        const guidance = this.extractVoiceGuidance(response.response.message);
        if (guidance) {
          this.guidanceQueue.push(guidance);
          this.processGuidanceQueue();
        }
      }
    } catch (error) {
      console.error('生成AI指导失败:', error);
    }
  }

  /**
   * 提取语音指导内容
   */
  private extractVoiceGuidance(message: string): string | null {
    // 简化实现，提取适合语音播报的内容
    const lines = message.split('\n');
    for (const line of lines) {
      if (line.length > 10 && line.length < 50 && 
          (line.includes('建议') || line.includes('注意') || line.includes('保持'))) {
        return line.trim();
      }
    }
    return null;
  }

  /**
   * 处理语音识别结果
   */
  private async handleSpeechResult(event: any): Promise<void> {
    try {
      const results = event.results;
      const lastResult = results[results.length - 1];
      
      if (lastResult.isFinal) {
        const command = lastResult[0].transcript.toLowerCase().trim();
        const confidence = lastResult[0].confidence;
        
        const voiceCommand: VoiceCommand = {
          command,
          confidence,
          timestamp: new Date()
        };
        
        this.emitEvent('command', voiceCommand);
        
        // 处理命令
        await this.processVoiceCommand(command, confidence);
      }
    } catch (error) {
      console.error('处理语音识别结果失败:', error);
    }
  }

  /**
   * 处理语音命令
   */
  private async processVoiceCommand(command: string, confidence: number): Promise<void> {
    if (confidence < 0.7) {
      await this.speak('抱歉，我没有听清楚，请再说一遍');
      return;
    }
    
    try {
      // 基本命令处理
      if (command.includes('帮助') || command.includes('help')) {
        await this.speak('可用命令：暂停导航、继续导航、当前状态、安全检查、路线信息');
        return;
      }
      
      if (command.includes('暂停') || command.includes('pause')) {
        this.isEnabled = false;
        await this.speak('语音导航已暂停');
        return;
      }
      
      if (command.includes('继续') || command.includes('resume')) {
        this.isEnabled = true;
        await this.speak('语音导航已恢复');
        return;
      }
      
      if (command.includes('状态') || command.includes('status')) {
        await this.speak('正在获取当前状态信息');
        // 这里可以集成实时状态信息
        return;
      }
      
      if (command.includes('安全') || command.includes('safety')) {
        await this.speak('正在进行安全检查');
        // 这里可以触发安全检查
        return;
      }
      
      // 使用AI处理复杂命令
      if (this.userId) {
        const response = await aiService.sendMessage(
          this.userId,
          `用户语音命令："${command}"，请提供简短的语音回复`,
          this.currentSessionId,
          undefined,
          'kimi',
          'general'
        );
        
        if (response.response.message) {
          const reply = this.extractVoiceGuidance(response.response.message) || 
                       response.response.message.substring(0, 100);
          await this.speak(reply);
        }
      }
    } catch (error) {
      console.error('处理语音命令失败:', error);
      await this.speak('命令处理失败，请稍后再试');
    }
  }

  /**
   * 处理语音识别错误
   */
  private handleSpeechError(event: any): void {
    console.error('语音识别错误:', event.error);
    
    this.emitEvent('error', {
      type: 'speech_recognition',
      error: event.error,
      message: '语音识别出现错误'
    });
    
    // 尝试重启
    if (this.isListening && event.error !== 'not-allowed') {
      setTimeout(() => {
        if (this.speechRecognition && this.isListening) {
          this.speechRecognition.start();
        }
      }, 2000);
    }
  }

  /**
   * 更新配置
   */
  updateOptions(options: Partial<VoiceGuidanceOptions>): void {
    this.options = { ...this.options, ...options };
    
    if (options.language) {
      this.selectVoice();
      if (this.speechRecognition) {
        this.speechRecognition.lang = options.language;
      }
    }
    
    if (options.voice) {
      this.selectVoice();
    }
  }

  /**
   * 获取当前状态
   */
  getStatus(): {
    isEnabled: boolean;
    isListening: boolean;
    queueLength: number;
    options: VoiceGuidanceOptions;
  } {
    return {
      isEnabled: this.isEnabled,
      isListening: this.isListening,
      queueLength: this.guidanceQueue.length,
      options: { ...this.options }
    };
  }

  /**
   * 检查浏览器支持
   */
  static checkSupport(): {
    speechSynthesis: boolean;
    speechRecognition: boolean;
  } {
    return {
      speechSynthesis: 'speechSynthesis' in window,
      speechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    };
  }

  /**
   * 添加事件监听器
   */
  addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(event: string, callback: Function): void {
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
  private emitEvent(type: string, data: any): void {
    const event: VoiceGuidanceEvent = {
      type: type as any,
      data,
      timestamp: new Date()
    };
    
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('事件监听器执行失败:', error);
        }
      });
    }
  }
}