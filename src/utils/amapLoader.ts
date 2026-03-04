import { performanceMonitor, getDevicePerformance } from './performance';

// 高德地图API加载器 - 优化版本
export class AmapLoader {
  private static isLoading = false;
  private static isLoaded = false;
  private static loadPromise: Promise<void> | null = null;
  private static loadStartTime = 0;
  private static retryCount = 0;
  private static maxRetries = 3;

  /**
   * 加载高德地图API - 性能优化版本
   */
  static async loadAmap(): Promise<void> {
    // 如果已经加载，直接返回
    if (this.isLoaded && window.AMap) {
      console.log('✅ 高德地图API已加载');
      return Promise.resolve();
    }

    // 如果正在加载，返回现有的Promise
    if (this.isLoading && this.loadPromise) {
      console.log('⏳ 高德地图API正在加载中...');
      return this.loadPromise;
    }

    // 开始加载
    this.isLoading = true;
    this.loadStartTime = performance.now();
    this.loadPromise = this.doLoadAmap();
    
    try {
      await this.loadPromise;
      this.isLoaded = true;
      
      const loadTime = performance.now() - this.loadStartTime;
      performanceMonitor.recordMetric('map_api_load_time', loadTime);
      console.log(`✅ 高德地图API加载完成 (${Math.round(loadTime)}ms)`);
    } catch (error) {
      console.error('❌ 高德地图API加载失败:', error);
      
      // 重试机制
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`🔄 重试加载高德地图API (${this.retryCount}/${this.maxRetries})`);
        this.isLoading = false;
        this.loadPromise = null;
        
        // 延迟重试
        await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
        return this.loadAmap();
      }
      
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 执行实际的加载逻辑 - 性能优化版本
   */
  private static doLoadAmap(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🗺️ 开始加载高德地图API...');

      // 检查API密钥
      const apiKey = import.meta.env.VITE_AMAP_API_KEY;
      if (!apiKey) {
        const error = new Error('高德地图API密钥未配置');
        console.error('❌ 配置错误:', error);
        reject(error);
        return;
      }

      console.log('🔑 API密钥已配置:', apiKey.substring(0, 8) + '...');

      // 如果window.AMap已存在，直接resolve
      if (window.AMap) {
        console.log('✅ 高德地图API已存在于window对象');
        resolve();
        return;
      }

      // 根据设备性能调整加载策略
      const devicePerformance = getDevicePerformance();
      console.log('📱 设备性能等级:', devicePerformance);

      // 创建script标签
      const script = document.createElement('script');
      
      // 根据设备性能选择插件
      let plugins: string[];
      if (devicePerformance === 'high') {
        // 高性能设备加载所有插件
        plugins = [
          'AMap.Geolocation',
          'AMap.Scale', 
          'AMap.ToolBar',
          'AMap.Walking',
          'AMap.Marker',
          'AMap.Polyline',
          'AMap.InfoWindow',
          'AMap.CircleMarker',
          'AMap.LngLat',
          'AMap.Geocoder',
          'AMap.PlaceSearch'
        ];
      } else if (devicePerformance === 'medium') {
        // 中等性能设备加载核心插件
        plugins = [
          'AMap.Geolocation',
          'AMap.Scale', 
          'AMap.ToolBar',
          'AMap.Walking',
          'AMap.Marker',
          'AMap.Polyline',
          'AMap.InfoWindow'
        ];
      } else {
        // 低性能设备只加载必需插件
        plugins = [
          'AMap.Geolocation',
          'AMap.Walking',
          'AMap.Marker',
          'AMap.Polyline'
        ];
      }

      const scriptUrl = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}&plugin=${plugins.join(',')}`;
      
      console.log('📍 加载脚本URL:', scriptUrl);
      console.log('🔌 加载插件数量:', plugins.length);
      
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;
      
      // 添加预加载提示 (注意：这些属性在script标签上不是标准属性)
      // script.rel = 'preload';
      // script.as = 'script';

      // 超时处理
      const timeout = setTimeout(() => {
        const error = new Error('高德地图API加载超时');
        console.error('❌ 加载超时:', error);
        script.remove();
        reject(error);
      }, 15000); // 15秒超时

      // 成功回调
      script.onload = () => {
        clearTimeout(timeout);
        console.log('✅ 高德地图API脚本加载成功');
        
        // 检查AMap对象是否可用
        if (window.AMap) {
          console.log('✅ 高德地图API对象可用:', {
            version: window.AMap.version || 'unknown',
            plugins: Object.keys(window.AMap).filter(key => key.startsWith('AMap') || key === 'Geolocation')
          });
          resolve();
        } else {
          const error = new Error('高德地图API脚本加载成功但AMap对象不可用');
          console.error('❌ API对象检查失败:', error);
          reject(error);
        }
      };

      // 错误回调
      script.onerror = (event) => {
        clearTimeout(timeout);
        const error = new Error('高德地图API脚本加载失败');
        console.error('❌ 脚本加载失败:', { event, scriptUrl });
        script.remove();
        reject(error);
      };

      // 添加到页面
      document.head.appendChild(script);
      console.log('📄 高德地图API脚本已添加到页面');
    });
  }

  /**
   * 检查高德地图API是否可用
   */
  static isAmapAvailable(): boolean {
    const available = typeof window !== 'undefined' && !!window.AMap;
    console.log('🔍 高德地图API可用性检查:', {
      windowExists: typeof window !== 'undefined',
      amapExists: !!window.AMap,
      available
    });
    return available;
  }

  /**
   * 获取加载状态
   */
  static getLoadStatus(): {
    isLoading: boolean;
    isLoaded: boolean;
    isAvailable: boolean;
  } {
    return {
      isLoading: this.isLoading,
      isLoaded: this.isLoaded,
      isAvailable: this.isAmapAvailable()
    };
  }

  /**
   * 获取高德地图API密钥配置
   */
  static getApiKeys(): {
    jsApiKey: string | null;
    restApiKey: string | null;
  } {
    const jsApiKey = import.meta.env.VITE_AMAP_API_KEY || null;
    const restApiKey = import.meta.env.VITE_AMAP_REST_KEY || jsApiKey; // 如果没有单独的REST密钥，使用JS API密钥
    
    return {
      jsApiKey,
      restApiKey
    };
  }

  /**
   * 验证API密钥配置
   */
  static validateApiKeys(): {
    isValid: boolean;
    errors: string[];
  } {
    const { jsApiKey, restApiKey } = this.getApiKeys();
    const errors: string[] = [];

    if (!jsApiKey) {
      errors.push('缺少高德地图JS API密钥 (VITE_AMAP_API_KEY)');
    }

    if (!restApiKey) {
      errors.push('缺少高德地图REST API密钥 (VITE_AMAP_REST_KEY)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// 全局类型已在 types/map.ts 中声明，无需重复声明