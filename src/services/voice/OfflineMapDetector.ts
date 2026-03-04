/**
 * 离线地图支持检测服务
 * 检测设备和浏览器对离线地图功能的支持情况
 */

export interface OfflineMapCapabilities {
  serviceWorker: boolean;
  indexedDB: boolean;
  cacheAPI: boolean;
  webGL: boolean;
  geolocation: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  webWorker: boolean;
  fileAPI: boolean;
  networkInformation: boolean;
}

export interface OfflineMapStatus {
  isSupported: boolean;
  capabilities: OfflineMapCapabilities;
  storageQuota: {
    available: number;
    used: number;
    total: number;
  } | null;
  networkStatus: {
    isOnline: boolean;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
  recommendations: string[];
  limitations: string[];
}

export interface OfflineMapConfig {
  enableCaching: boolean;
  maxCacheSize: number; // MB
  tileCacheExpiry: number; // 小时
  routeCacheExpiry: number; // 小时
  enablePreloading: boolean;
  preloadRadius: number; // 公里
  compressionLevel: number; // 0-9
}

export class OfflineMapDetector {
  private config: OfflineMapConfig;
  private capabilities: OfflineMapCapabilities | null = null;
  private storageQuota: any = null;

  constructor(config?: Partial<OfflineMapConfig>) {
    this.config = {
      enableCaching: true,
      maxCacheSize: 100, // 100MB
      tileCacheExpiry: 24, // 24小时
      routeCacheExpiry: 12, // 12小时
      enablePreloading: false,
      preloadRadius: 5, // 5公里
      compressionLevel: 6,
      ...config
    };
  }

  /**
   * 检测离线地图支持能力
   */
  async detectCapabilities(): Promise<OfflineMapCapabilities> {
    console.log('🔍 开始检测离线地图支持能力...');

    const capabilities: OfflineMapCapabilities = {
      serviceWorker: this.checkServiceWorkerSupport(),
      indexedDB: this.checkIndexedDBSupport(),
      cacheAPI: this.checkCacheAPISupport(),
      webGL: this.checkWebGLSupport(),
      geolocation: this.checkGeolocationSupport(),
      localStorage: this.checkLocalStorageSupport(),
      sessionStorage: this.checkSessionStorageSupport(),
      webWorker: this.checkWebWorkerSupport(),
      fileAPI: this.checkFileAPISupport(),
      networkInformation: this.checkNetworkInformationSupport()
    };

    this.capabilities = capabilities;
    console.log('✅ 离线地图能力检测完成:', capabilities);
    
    return capabilities;
  }

  /**
   * 检测Service Worker支持
   */
  private checkServiceWorkerSupport(): boolean {
    return 'serviceWorker' in navigator;
  }

  /**
   * 检测IndexedDB支持
   */
  private checkIndexedDBSupport(): boolean {
    return 'indexedDB' in window;
  }

  /**
   * 检测Cache API支持
   */
  private checkCacheAPISupport(): boolean {
    return 'caches' in window;
  }

  /**
   * 检测WebGL支持
   */
  private checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (error) {
      return false;
    }
  }

  /**
   * 检测地理位置支持
   */
  private checkGeolocationSupport(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * 检测LocalStorage支持
   */
  private checkLocalStorageSupport(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 检测SessionStorage支持
   */
  private checkSessionStorageSupport(): boolean {
    try {
      const test = '__sessionStorage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 检测Web Worker支持
   */
  private checkWebWorkerSupport(): boolean {
    return 'Worker' in window;
  }

  /**
   * 检测File API支持
   */
  private checkFileAPISupport(): boolean {
    return 'File' in window && 'FileReader' in window && 'FileList' in window && 'Blob' in window;
  }

  /**
   * 检测网络信息API支持
   */
  private checkNetworkInformationSupport(): boolean {
    return 'connection' in navigator || 'mozConnection' in navigator || 'webkitConnection' in navigator;
  }

  /**
   * 获取存储配额信息
   */
  async getStorageQuota(): Promise<any> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        this.storageQuota = {
          available: estimate.quota ? estimate.quota - (estimate.usage || 0) : 0,
          used: estimate.usage || 0,
          total: estimate.quota || 0
        };
        return this.storageQuota;
      }
    } catch (error) {
      console.warn('⚠️ 无法获取存储配额信息:', error);
    }
    return null;
  }

  /**
   * 获取网络状态
   */
  getNetworkStatus(): any {
    const status = {
      isOnline: navigator.onLine
    };

    // 尝试获取网络连接信息
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      return {
        ...status,
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      };
    }

    return status;
  }

  /**
   * 生成建议和限制
   */
  private generateRecommendations(capabilities: OfflineMapCapabilities, storageQuota: any, networkStatus: any): {
    recommendations: string[];
    limitations: string[];
  } {
    const recommendations: string[] = [];
    const limitations: string[] = [];

    // 基于能力生成建议
    if (capabilities.serviceWorker && capabilities.cacheAPI) {
      recommendations.push('支持高级缓存功能，可以实现完整的离线地图体验');
    } else {
      limitations.push('不支持Service Worker或Cache API，离线功能受限');
    }

    if (capabilities.indexedDB) {
      recommendations.push('支持大容量数据存储，可以缓存地图瓦片和路线数据');
    } else {
      limitations.push('不支持IndexedDB，无法进行大容量数据缓存');
    }

    if (capabilities.webGL) {
      recommendations.push('支持硬件加速渲染，地图性能更佳');
    } else {
      limitations.push('不支持WebGL，地图渲染性能可能较差');
    }

    if (capabilities.geolocation) {
      recommendations.push('支持GPS定位，可以提供精确的位置服务');
    } else {
      limitations.push('不支持地理位置API，无法获取GPS位置');
    }

    if (capabilities.webWorker) {
      recommendations.push('支持后台处理，可以在不阻塞UI的情况下处理地图数据');
    } else {
      limitations.push('不支持Web Worker，数据处理可能影响界面响应');
    }

    // 基于存储配额生成建议
    if (storageQuota) {
      const availableMB = Math.round(storageQuota.available / 1024 / 1024);
      if (availableMB > 500) {
        recommendations.push(`存储空间充足(${availableMB}MB)，可以缓存大量地图数据`);
      } else if (availableMB > 100) {
        recommendations.push(`存储空间适中(${availableMB}MB)，建议适度缓存地图数据`);
      } else {
        limitations.push(`存储空间不足(${availableMB}MB)，缓存功能受限`);
      }
    }

    // 基于网络状态生成建议
    if (!networkStatus.isOnline) {
      limitations.push('当前处于离线状态，只能使用已缓存的地图数据');
    } else if (networkStatus.effectiveType) {
      const connectionType = networkStatus.effectiveType;
      if (connectionType === '4g' || connectionType === '3g') {
        recommendations.push('网络连接良好，可以预加载地图数据');
      } else if (connectionType === '2g' || connectionType === 'slow-2g') {
        recommendations.push('网络连接较慢，建议启用数据压缩和智能缓存');
      }
    }

    return { recommendations, limitations };
  }

  /**
   * 获取完整的离线地图状态
   */
  async getOfflineMapStatus(): Promise<OfflineMapStatus> {
    console.log('📊 获取离线地图状态...');

    const capabilities = this.capabilities || await this.detectCapabilities();
    const storageQuota = await this.getStorageQuota();
    const networkStatus = this.getNetworkStatus();

    // 判断是否支持离线地图
    const isSupported = capabilities.serviceWorker && 
                       capabilities.indexedDB && 
                       capabilities.cacheAPI &&
                       capabilities.geolocation;

    const { recommendations, limitations } = this.generateRecommendations(
      capabilities, 
      storageQuota, 
      networkStatus
    );

    const status: OfflineMapStatus = {
      isSupported,
      capabilities,
      storageQuota,
      networkStatus,
      recommendations,
      limitations
    };

    console.log('✅ 离线地图状态获取完成:', status);
    return status;
  }

  /**
   * 检查特定功能是否可用
   */
  isFeatureAvailable(feature: keyof OfflineMapCapabilities): boolean {
    return this.capabilities ? this.capabilities[feature] : false;
  }

  /**
   * 获取推荐的缓存配置
   */
  getRecommendedCacheConfig(storageQuota?: any): Partial<OfflineMapConfig> {
    const quota = storageQuota || this.storageQuota;
    const config: Partial<OfflineMapConfig> = {};

    if (quota) {
      const availableMB = Math.round(quota.available / 1024 / 1024);
      
      if (availableMB > 500) {
        config.maxCacheSize = 200; // 200MB
        config.enablePreloading = true;
        config.preloadRadius = 10; // 10公里
      } else if (availableMB > 200) {
        config.maxCacheSize = 100; // 100MB
        config.enablePreloading = true;
        config.preloadRadius = 5; // 5公里
      } else if (availableMB > 50) {
        config.maxCacheSize = 50; // 50MB
        config.enablePreloading = false;
      } else {
        config.maxCacheSize = 20; // 20MB
        config.enablePreloading = false;
        config.tileCacheExpiry = 12; // 12小时
        config.routeCacheExpiry = 6; // 6小时
      }
    }

    return config;
  }

  /**
   * 监听网络状态变化
   */
  onNetworkChange(callback: (isOnline: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 返回清理函数
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<OfflineMapConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('✅ 离线地图配置已更新:', this.config);
  }

  /**
   * 获取当前配置
   */
  getConfig(): OfflineMapConfig {
    return { ...this.config };
  }
}

// 创建单例实例
export const offlineMapDetector = new OfflineMapDetector();

// 默认导出
export default OfflineMapDetector;