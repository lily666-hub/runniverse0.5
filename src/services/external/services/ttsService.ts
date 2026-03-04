// TTS语音合成服务
// 支持阿里云TTS和浏览器TTS双重方案

export interface TTSConfig {
  appKey: string;
  accessKeyId: string;
  accessKeySecret: string;
  accessToken?: string;
  region?: string;
  voice?: string;
  format?: string;
  sampleRate?: number;
  volume?: number;
  speechRate?: number;
  pitchRate?: number;
}

export interface SpeechSynthesisOptions {
  text: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

export interface TTSResponse {
  success: boolean;
  audioUrl?: string;
  audioData?: ArrayBuffer;
  error?: string;
}

export class TTSService {
  private config: TTSConfig;
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying = false;

  constructor(config?: Partial<TTSConfig>) {
    this.config = {
      appKey: import.meta.env.VITE_ALIYUN_TTS_APP_KEY || '',
      accessKeyId: import.meta.env.VITE_ALIYUN_TTS_ACCESS_KEY_ID || '',
      accessKeySecret: import.meta.env.VITE_ALIYUN_TTS_ACCESS_KEY_SECRET || '',
      accessToken: import.meta.env.VITE_ALIYUN_TTS_ACCESS_TOKEN || '',
      region: 'cn-shanghai',
      voice: 'xiaoyun', // 中文女声
      format: 'mp3',
      sampleRate: 16000,
      volume: 50,
      speechRate: 0,
      pitchRate: 0,
      ...config
    };
  }

  /**
   * 获取阿里云TTS访问令牌
   */
  private async getAliyunToken(): Promise<string> {
    try {
      // 如果有临时AccessToken，直接使用
      if (this.config.accessToken) {
        return this.config.accessToken;
      }

      // 否则通过AccessKey获取Token
      const timestamp = new Date().toISOString();
      const nonce = Math.random().toString(36).substring(2, 15);
      
      const params = {
        AccessKeyId: this.config.accessKeyId,
        Action: 'CreateToken',
        Format: 'JSON',
        RegionId: this.config.region,
        SignatureMethod: 'HMAC-SHA1',
        SignatureNonce: nonce,
        SignatureVersion: '1.0',
        Timestamp: timestamp,
        Version: '2019-02-28'
      };

      // 这里需要实现签名算法，但由于浏览器环境限制，建议使用临时Token
      console.warn('建议使用临时AccessToken，避免在前端暴露AccessKey');
      throw new Error('请使用临时AccessToken');
      
    } catch (error) {
      console.error('获取阿里云TTS令牌失败:', error);
      throw error;
    }
  }

  /**
   * 使用阿里云TTS合成语音
   */
  private async synthesizeWithAliyun(text: string, options?: Partial<SpeechSynthesisOptions>): Promise<TTSResponse> {
    try {
      if (!this.config.appKey) {
        throw new Error('阿里云TTS AppKey配置缺失');
      }

      // 使用临时AccessToken或获取Token
      let token = this.config.accessToken;
      if (!token) {
        token = await this.getAliyunToken();
      }

      // 构建请求参数 - 使用正确的阿里云TTS API格式
      const params = new URLSearchParams({
        appkey: this.config.appKey,
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

      // 阿里云TTS RESTful API调用 - 使用正确的端点和方法
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

      console.log('TTS开始合成:', text);

      // 优先尝试阿里云TTS
      let result = await this.synthesizeWithAliyun(text, options);
      
      if (result.success && result.audioUrl) {
        console.log('使用阿里云TTS合成成功');
        await this.playAudio(result.audioUrl);
        return;
      }

      // 阿里云TTS失败，使用浏览器TTS作为备用
      console.warn('阿里云TTS失败，使用浏览器TTS:', result.error);
      result = await this.synthesizeWithBrowser(text, options);
      
      if (!result.success) {
        throw new Error(result.error || 'TTS合成失败');
      }

      console.log('使用浏览器TTS合成成功');

    } catch (error) {
      console.error('TTS合成失败:', error);
      throw error;
    }
  }

  /**
   * 停止当前播放
   */
  stop(): void {
    // 停止阿里云TTS音频
    this.cleanup();
    
    // 停止浏览器TTS
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    this.isPlaying = false;
  }

  /**
   * 检查是否正在播放
   */
  isCurrentlyPlaying(): boolean {
    return this.isPlaying || (speechSynthesis && speechSynthesis.speaking);
  }

  /**
   * 获取可用的语音列表
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if ('speechSynthesis' in window) {
      return speechSynthesis.getVoices();
    }
    return [];
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取当前配置
   */
  getConfig(): TTSConfig {
    return { ...this.config };
  }
}

// 创建默认实例
export const ttsService = new TTSService();

// 导出常用的语音选项
export const VOICE_OPTIONS = {
  XIAOYUN: 'xiaoyun', // 小云，温柔女声
  XIAOGANG: 'xiaogang', // 小刚，成熟男声
  RUOXI: 'ruoxi', // 若汐，温暖女声
  SIQI: 'siqi', // 思琪，知性女声
  SIJIA: 'sijia', // 思佳，温柔女声
  SICHENG: 'sicheng', // 思诚，沉稳男声
  AIQI: 'aiqi', // 艾琪，甜美女声
  AIJIA: 'aijia', // 艾佳，亲切女声
  AICHENG: 'aicheng', // 艾诚，磁性男声
  AIDA: 'aida', // 艾达，知性女声
  NINGER: 'ninger', // 宁儿，可爱女声
  RUILIN: 'ruilin', // 瑞琳，清新女声
  SIYUE: 'siyue', // 思悦，活泼女声
  AIXIA: 'aixia', // 艾夏，清脆女声
  AITONG: 'aitong', // 艾彤，甜美女声
  AIWEI: 'aiwei', // 艾薇，温柔女声
  AIBAO: 'aibao', // 艾宝，可爱童声
  HARRY: 'harry', // 哈利，英文男声
  NANCY: 'nancy', // 南希，英文女声
  JAMES: 'james', // 詹姆斯，英文男声
  EMILY: 'emily', // 艾米丽，英文女声
};