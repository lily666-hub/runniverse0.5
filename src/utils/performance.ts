/**
 * 性能优化工具类
 * 提供防抖、节流、懒加载等性能优化功能
 */

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param delay 延迟时间（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * 智能节流函数 - 根据设备性能动态调整频率
 * @param func 要节流的函数
 * @param baseDelay 基础延迟时间（毫秒）
 * @returns 智能节流后的函数
 */
export function smartThrottle<T extends (...args: any[]) => any>(
  func: T,
  baseDelay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let adaptiveDelay = baseDelay;
  let performanceHistory: number[] = [];
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;
    
    if (timeSinceLastCall >= adaptiveDelay) {
      const startTime = performance.now();
      
      func(...args);
      
      const executionTime = performance.now() - startTime;
      
      // 记录执行时间
      performanceHistory.push(executionTime);
      if (performanceHistory.length > 10) {
        performanceHistory.shift();
      }
      
      // 根据平均执行时间调整延迟
      const avgExecutionTime = performanceHistory.reduce((a, b) => a + b, 0) / performanceHistory.length;
      
      if (avgExecutionTime > 16) { // 超过一帧时间
        adaptiveDelay = Math.min(baseDelay * 2, 1000); // 增加延迟
      } else if (avgExecutionTime < 8) { // 执行很快
        adaptiveDelay = Math.max(baseDelay * 0.8, 100); // 减少延迟
      }
      
      lastCall = now;
    }
  };
}

/**
 * 内存优化的位置数组管理
 */
export class OptimizedPositionBuffer {
  private positions: Array<{ lat: number; lng: number; timestamp: number; accuracy?: number }> = [];
  private maxSize: number;
  private compressionThreshold: number;

  constructor(maxSize = 1000, compressionThreshold = 500) {
    this.maxSize = maxSize;
    this.compressionThreshold = compressionThreshold;
  }

  /**
   * 添加位置点
   */
  addPosition(position: { lat: number; lng: number; timestamp: number; accuracy?: number }) {
    this.positions.push(position);
    
    // 当达到压缩阈值时，进行数据压缩
    if (this.positions.length > this.compressionThreshold) {
      this.compressData();
    }
    
    // 当达到最大大小时，移除最旧的数据
    if (this.positions.length > this.maxSize) {
      this.positions.shift();
    }
  }

  /**
   * 数据压缩 - 保留关键点，移除冗余点
   */
  private compressData() {
    if (this.positions.length < 3) return;
    
    const compressed = [this.positions[0]]; // 保留第一个点
    
    for (let i = 1; i < this.positions.length - 1; i++) {
      const prev = this.positions[i - 1];
      const current = this.positions[i];
      const next = this.positions[i + 1];
      
      // 计算角度变化，保留转弯点
      const angle1 = Math.atan2(current.lat - prev.lat, current.lng - prev.lng);
      const angle2 = Math.atan2(next.lat - current.lat, next.lng - current.lng);
      const angleDiff = Math.abs(angle1 - angle2);
      
      // 如果角度变化大于阈值，或者时间间隔较大，保留该点
      if (angleDiff > 0.1 || (current.timestamp - prev.timestamp) > 10000) {
        compressed.push(current);
      }
    }
    
    compressed.push(this.positions[this.positions.length - 1]); // 保留最后一个点
    this.positions = compressed;
    
    console.log(`位置数据压缩完成: ${this.positions.length} 个点`);
  }

  /**
   * 获取所有位置
   */
  getPositions() {
    return [...this.positions];
  }

  /**
   * 获取最新位置
   */
  getLatestPosition() {
    return this.positions[this.positions.length - 1] || null;
  }

  /**
   * 清空位置数据
   */
  clear() {
    this.positions = [];
  }

  /**
   * 获取内存使用情况
   */
  getMemoryUsage() {
    const sizeInBytes = JSON.stringify(this.positions).length * 2; // 粗略估算
    return {
      count: this.positions.length,
      sizeInKB: Math.round(sizeInBytes / 1024),
      maxSize: this.maxSize
    };
  }
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private memoryUsage: number[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * 开始性能监控
   */
  startMonitoring(interval = 5000) {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.recordMemoryUsage();
    }, interval);
    
    console.log('性能监控已启动');
  }

  /**
   * 停止性能监控
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('性能监控已停止');
  }

  /**
   * 记录性能指标
   */
  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // 保持最近100个记录
    if (values.length > 100) {
      values.shift();
    }
  }

  /**
   * 记录内存使用情况
   */
  private recordMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.memoryUsage.push(memory.usedJSHeapSize);
      
      // 保持最近50个记录
      if (this.memoryUsage.length > 50) {
        this.memoryUsage.shift();
      }
    }
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    const report: any = {
      timestamp: new Date().toISOString(),
      metrics: {}
    };

    // 计算各指标的统计信息
    for (const [name, values] of this.metrics.entries()) {
      if (values.length > 0) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        
        report.metrics[name] = {
          average: Math.round(avg * 100) / 100,
          maximum: max,
          minimum: min,
          count: values.length
        };
      }
    }

    // 内存使用情况
    if (this.memoryUsage.length > 0) {
      const currentMemory = this.memoryUsage[this.memoryUsage.length - 1];
      const avgMemory = this.memoryUsage.reduce((a, b) => a + b, 0) / this.memoryUsage.length;
      
      report.memory = {
        current: Math.round(currentMemory / 1024 / 1024), // MB
        average: Math.round(avgMemory / 1024 / 1024), // MB
        samples: this.memoryUsage.length
      };
    }

    return report;
  }

  /**
   * 清除所有记录
   */
  clearMetrics() {
    this.metrics.clear();
    this.memoryUsage = [];
  }
}

/**
 * 懒加载工具
 */
export class LazyLoader {
  private static loadedModules = new Set<string>();
  private static loadingPromises = new Map<string, Promise<any>>();

  /**
   * 懒加载地图API
   */
  static async loadMapAPI(): Promise<void> {
    const moduleKey = 'amap-api';
    
    if (this.loadedModules.has(moduleKey)) {
      return;
    }

    if (this.loadingPromises.has(moduleKey)) {
      return this.loadingPromises.get(moduleKey);
    }

    const loadPromise = this.loadAmapAPI();
    this.loadingPromises.set(moduleKey, loadPromise);

    try {
      await loadPromise;
      this.loadedModules.add(moduleKey);
    } catch (error) {
      this.loadingPromises.delete(moduleKey);
      throw error;
    }
  }

  /**
   * 加载高德地图API
   */
  private static async loadAmapAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.AMap) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${import.meta.env.VITE_AMAP_API_KEY || ''}&plugin=AMap.Walking,AMap.Driving,AMap.Transfer,AMap.Geocoder`;
      script.async = true;
      
      script.onload = () => {
        console.log('高德地图API加载完成');
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('高德地图API加载失败'));
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * 预加载资源
   */
  static preloadResources(urls: string[]): Promise<void[]> {
    return Promise.all(
      urls.map(url => {
        return new Promise<void>((resolve, reject) => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = url;
          link.onload = () => resolve();
          link.onerror = () => reject(new Error(`Failed to preload: ${url}`));
          document.head.appendChild(link);
        });
      })
    );
  }
}

/**
 * 全局性能监控实例
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * 设备性能检测
 */
export function getDevicePerformance(): 'high' | 'medium' | 'low' {
  // 检测设备内存
  const memory = (navigator as any).deviceMemory || 4;
  
  // 检测CPU核心数
  const cores = navigator.hardwareConcurrency || 2;
  
  // 检测连接速度
  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType || '4g';
  
  // 综合评分
  let score = 0;
  
  if (memory >= 8) score += 3;
  else if (memory >= 4) score += 2;
  else score += 1;
  
  if (cores >= 8) score += 3;
  else if (cores >= 4) score += 2;
  else score += 1;
  
  if (effectiveType === '4g') score += 2;
  else if (effectiveType === '3g') score += 1;
  
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}