/**
 * TTS语音合成服务
 * 支持阿里云TTS和浏览器TTS双重方案
 */

// TTS配置接口
export interface TTSConfig {
  provider: 'aliyun' | 'browser';
  // 阿里云TTS配置
  appKey?: string;
  accessKeyId?: string;
  accessKeySecret?: string;
  accessToken?: string;
  region?: string;
  voice?: string;
  format?: string;
  sampleRate?: number;
  volume?: number;
  speechRate?: number;
  pitchRate?: number;
  speed?: number; // 添加speed属性
  pitch?: number; // 添加pitch属性
}

// 语音合成选项
export interface SpeechSynthesisOptions {
  voice?: string;
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  speed?: number; // 添加speed属性
}

// TTS响应接口
export interface TTSResponse {
  success: boolean;
  audioUrl?: string;
  audioData?: ArrayBuffer;
  error?: string;
}

export class TTSService {
  private config: TTSConfig;
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;

  constructor(config: TTSConfig) {
    this.config = {
      provider: 'browser',
      voice: 'xiaoyun',
      format: 'mp3',
      sampleRate: 16000,
      volume: 50,
      speechRate: 0,
      pitchRate: 0,
      region: 'cn-shanghai',
      ...config
    };

    console.log('TTS服务初始化:', {
      provider: this.config.provider,
      voice: this.config.voice,
      hasAliyunConfig: !!(this.config.appKey && (this.config.accessToken || (this.config.accessKeyId && this.config.accessKeySecret)))
    });
  }

  /**
   * 语音合成
   */
  async synthesize(text: string, options?: Partial<SpeechSynthesisOptions>): Promise<TTSResponse> {
    if (!text || text.trim() === '') {
      return {
        success: false,
        error: '文本内容为空'
      };
    }

    console.log(`TTS合成开始: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}" (${this.config.provider})`);

    try {
      // 根据配置选择TTS提供商
      if (this.config.provider === 'aliyun' && this.hasAliyunConfig()) {
        return await this.synthesizeWithAliyun(text, options);
      } else {
        console.log('使用浏览器TTS作为备用方案');
        return await this.synthesizeWithBrowser(text, options);
      }
    } catch (error) {
      console.error('TTS合成失败，尝试备用方案:', error);
      // 如果阿里云TTS失败，降级到浏览器TTS
      if (this.config.provider === 'aliyun') {
        return await this.synthesizeWithBrowser(text, options);
      }
      throw error;
    }
  }

  /**
   * 检查是否有阿里云配置
   */
  private hasAliyunConfig(): boolean {
    return !!(this.config.appKey && (this.config.accessToken || (this.config.accessKeyId && this.config.accessKeySecret)));
  }

  /**
   * 获取阿里云访问令牌
   */
  private async getAliyunToken(): Promise<string> {
    if (this.config.accessToken) {
      return this.config.accessToken;
    }

    if (!this.config.accessKeyId || !this.config.accessKeySecret) {
      throw new Error('阿里云AccessKey配置不完整');
    }

    // 这里应该调用阿里云STS服务获取临时token
    // 为了安全起见，建议在后端服务中获取token
    console.warn('建议在后端服务中获取阿里云访问令牌');
    throw new Error('需要配置访问令牌或在后端获取');
  }

  /**
   * 使用阿里云TTS合成语音
   */
  private async synthesizeWithAliyun(text: string, options?: Partial<SpeechSynthesisOptions>): Promise<TTSResponse> {
    try {
      console.log('使用阿里云TTS合成语音...');

      // 使用临时AccessToken或获取Token
      let token = this.config.accessToken;
      if (!token) {
        token = await this.getAliyunToken();
      }

      // 构建请求参数
      const params = new URLSearchParams({
        appkey: this.config.appKey!,
        token: token,
        text: text,
        voice: options?.voice || this.config.voice || 'xiaoyun',
        format: this.config.format || 'mp3',
        sample_rate: String(this.config.sampleRate || 16000),
        volume: String(options?.volume !== undefined ? Math.round(options.volume * 100) : (this.config.volume || 50)),
        speech_rate: String(options?.rate !== undefined ? Math.round((options.rate - 1) * 500) : (this.config.speechRate || 0)),
        pitch_rate: String(options?.pitch !== undefined ? Math.round((options.pitch - 1) * 500) : (this.config.pitchRate || 0))
      });

      console.log('阿里云TTS请求参数:', {
        appkey: this.config.appKey,
        token: token ? '***' : 'null',
        text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        voice: options?.voice || this.config.voice || 'xiaoyun'
      });

      // 阿里云TTS RESTful API调用
      const response = await fetch('https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'audio/mpeg'
        },
        body: params.toString()
      });

      console.log('阿里云TTS响应状态:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('阿里云TTS API错误响应:', errorText);
        throw new Error(`阿里云TTS API调用失败: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // 检查响应内容类型
      const contentType = response.headers.get('content-type');
      console.log('阿里云TTS响应类型:', contentType);

      if (!contentType || !contentType.includes('audio')) {
        const errorText = await response.text();
        console.error('阿里云TTS返回非音频内容:', errorText);
        throw new Error(`阿里云TTS返回错误: ${errorText}`);
      }

      const audioData = await response.arrayBuffer();
      console.log('阿里云TTS音频数据大小:', audioData.byteLength, 'bytes');

      if (audioData.byteLength === 0) {
        throw new Error('阿里云TTS返回空音频数据');
      }

      const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      return {
        success: true,
        audioUrl,
        audioData
      };

    } catch (error) {
      console.error('阿里云TTS合成失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 使用浏览器TTS合成语音（备用方案）
   */
  private async synthesizeWithBrowser(text: string, options?: Partial<SpeechSynthesisOptions>): Promise<TTSResponse> {
    return new Promise((resolve) => {
      try {
        if (!('speechSynthesis' in window)) {
          throw new Error('浏览器不支持语音合成');
        }

        // 停止当前播放
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // 设置语音参数
        utterance.lang = options?.lang || 'zh-CN';
        utterance.rate = options?.rate || 1.0;
        utterance.pitch = options?.pitch || 1.0;
        utterance.volume = options?.volume || 1.0;

        // 尝试选择中文语音
        const voices = speechSynthesis.getVoices();
        const chineseVoice = voices.find(voice => 
          voice.lang.includes('zh') || voice.name.includes('Chinese')
        );
        if (chineseVoice) {
          utterance.voice = chineseVoice;
        }

        utterance.onstart = () => {
          this.isPlaying = true;
        };

        utterance.onend = () => {
          this.isPlaying = false;
          resolve({
            success: true
          });
        };

        utterance.onerror = (event) => {
          this.isPlaying = false;
          console.error('浏览器TTS错误:', event.error);
          resolve({
            success: false,
            error: `浏览器TTS错误: ${event.error}`
          });
        };

        speechSynthesis.speak(utterance);

      } catch (error) {
        console.error('浏览器TTS合成失败:', error);
        resolve({
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    });
  }

  /**
   * 播放音频
   */
  private async playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 停止当前播放
        this.stop();

        this.currentAudio = new Audio(audioUrl);
        this.currentAudio.preload = 'auto';

        this.currentAudio.onloadeddata = () => {
          if (this.currentAudio) {
            this.currentAudio.play()
              .then(() => {
                this.isPlaying = true;
                resolve();
              })
              .catch(reject);
          }
        };

        this.currentAudio.onended = () => {
          this.isPlaying = false;
          this.cleanup();
        };

        this.currentAudio.onerror = (error) => {
          console.error('音频播放错误:', error);
          this.cleanup();
          reject(new Error('音频播放失败'));
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 清理音频资源
   */
  private cleanup(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
    }
    this.isPlaying = false;
  }

  /**
   * 语音合成并播放
   */
  async speak(text: string, options?: Partial<SpeechSynthesisOptions>): Promise<void> {
    try {
      if (!text || text.trim() === '') {
        console.warn('TTS: 文本为空，跳过合成');
        return;
      }

      console.log(`TTS播放: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

      const result = await this.synthesize(text, options);
      
      if (!result.success) {
        throw new Error(result.error || 'TTS合成失败');
      }

      // 如果有音频URL，播放音频文件
      if (result.audioUrl) {
        await this.playAudio(result.audioUrl);
      }
      // 否则使用浏览器TTS直接播放（已经在synthesizeWithBrowser中播放了）

    } catch (error) {
      console.error('TTS播放失败:', error);
      throw error;
    }
  }

  /**
   * 停止播放
   */
  stop(): void {
    // 停止浏览器TTS
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }

    // 停止音频播放
    this.cleanup();
    
    console.log('TTS播放已停止');
  }

  /**
   * 暂停播放
   */
  pause(): void {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
      this.isPlaying = false;
    }

    if ('speechSynthesis' in window && speechSynthesis.speaking) {
      speechSynthesis.pause();
    }
  }

  /**
   * 恢复播放
   */
  resume(): void {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play();
      this.isPlaying = true;
    }

    if ('speechSynthesis' in window && speechSynthesis.paused) {
      speechSynthesis.resume();
    }
  }

  /**
   * 获取播放状态
   */
  getPlayingStatus(): boolean {
    return this.isPlaying || ('speechSynthesis' in window && speechSynthesis.speaking);
  }

  /**
   * 获取可用语音列表
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if ('speechSynthesis' in window) {
      return speechSynthesis.getVoices();
    }
    return [];
  }

  /**
   * 设置配置
   */
  updateConfig(newConfig: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('TTS配置已更新:', newConfig);
  }

  /**
   * 获取当前配置
   */
  getConfig(): TTSConfig {
    return { ...this.config };
  }

  /**
   * 预设语音播报模板
   */
  async speakRunningUpdate(data: {
    distance?: number;
    time?: number;
    pace?: number;
    heartRate?: number;
    calories?: number;
  }): Promise<void> {
    const messages: string[] = [];

    if (data.distance !== undefined) {
      messages.push(`已跑步${data.distance.toFixed(1)}公里`);
    }

    if (data.time !== undefined) {
      const minutes = Math.floor(data.time / 60);
      const seconds = data.time % 60;
      messages.push(`用时${minutes}分${seconds}秒`);
    }

    if (data.pace !== undefined) {
      const paceMinutes = Math.floor(data.pace);
      const paceSeconds = Math.round((data.pace - paceMinutes) * 60);
      messages.push(`配速${paceMinutes}分${paceSeconds}秒每公里`);
    }

    if (data.heartRate !== undefined) {
      messages.push(`心率${data.heartRate}次每分钟`);
    }

    if (data.calories !== undefined) {
      messages.push(`消耗${Math.round(data.calories)}卡路里`);
    }

    const message = messages.join('，');
    if (message) {
      await this.speak(message);
    }
  }

  /**
   * 安全提醒语音播报
   */
  async speakSafetyAlert(alertType: 'traffic' | 'weather' | 'route' | 'emergency', message: string): Promise<void> {
    const prefix = {
      'traffic': '交通提醒：',
      'weather': '天气提醒：',
      'route': '路线提醒：',
      'emergency': '紧急提醒：'
    }[alertType];

    await this.speak(`${prefix}${message}`, {
      rate: 0.9, // 稍慢的语速确保清晰
      volume: 1.0 // 最大音量确保能听到
    });
  }

  /**
   * 路线导航语音播报
   */
  async speakNavigation(instruction: string): Promise<void> {
    await this.speak(`导航提示：${instruction}`, {
      rate: 0.8,
      volume: 0.9
    });
  }
}