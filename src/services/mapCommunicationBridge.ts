// 智能体与3.0.html地图通信桥接服务
export interface RouteData {
  startPoint: {
    latitude: number;
    longitude: number;
    address: string;
  };
  endPoint: {
    latitude: number;
    longitude: number;
    address: string;
  };
  waypoints?: Array<{
    latitude: number;
    longitude: number;
    name: string;
    description?: string;
  }>;
  routeType: 'safe' | 'scenic' | 'fast' | 'challenge';
  distance: number;
  estimatedTime: number;
  safetyScore: number;
  description: string;
}

export interface NavigationCommand {
  type: 'START_NAVIGATION' | 'STOP_NAVIGATION' | 'UPDATE_ROUTE' | 'GET_LOCATION';
  route?: RouteData;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface NavigationResponse {
  type: 'NAVIGATION_STARTED' | 'NAVIGATION_STOPPED' | 'ROUTE_UPDATED' | 'LOCATION_UPDATED' | 'NAVIGATION_ERROR';
  success: boolean;
  message?: string;
  data?: any;
}

export class MapCommunicationBridge {
  private static instance: MapCommunicationBridge;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private isInitialized = false;

  private constructor() {
    this.initializeMessageListener();
  }

  public static getInstance(): MapCommunicationBridge {
    if (!MapCommunicationBridge.instance) {
      MapCommunicationBridge.instance = new MapCommunicationBridge();
    }
    return MapCommunicationBridge.instance;
  }

  // 初始化消息监听器
  private initializeMessageListener(): void {
    if (this.isInitialized) return;

    window.addEventListener('message', (event) => {
      // 验证消息来源（可以根据需要添加更严格的验证）
      if (event.origin !== window.location.origin) {
        return;
      }

      const { type, data } = event.data;
      if (type && this.messageHandlers.has(type)) {
        const handler = this.messageHandlers.get(type);
        if (handler) {
          handler(data);
        }
      }
    });

    this.isInitialized = true;
    console.log('🌉 地图通信桥接服务已初始化');
  }

  // 注册消息处理器
  public onMessage(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
    console.log(`📡 注册消息处理器: ${type}`);
  }

  // 移除消息处理器
  public offMessage(type: string): void {
    this.messageHandlers.delete(type);
    console.log(`📡 移除消息处理器: ${type}`);
  }

  // 发送命令到3.0.html地图
  public sendToMap(command: NavigationCommand): Promise<NavigationResponse> {
    return new Promise((resolve, reject) => {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 设置响应超时
      const timeout = setTimeout(() => {
        this.offMessage(`response_${messageId}`);
        reject(new Error('地图通信超时'));
      }, 10000);

      // 注册响应处理器
      this.onMessage(`response_${messageId}`, (response: NavigationResponse) => {
        clearTimeout(timeout);
        this.offMessage(`response_${messageId}`);
        resolve(response);
      });

      // 发送消息到3.0.html
      const mapFrame = this.getMapFrame();
      if (mapFrame) {
        mapFrame.postMessage({
          id: messageId,
          command: command
        }, window.location.origin);
        console.log('📤 发送命令到地图:', command);
      } else {
        clearTimeout(timeout);
        this.offMessage(`response_${messageId}`);
        reject(new Error('未找到地图框架'));
      }
    });
  }

  // 获取地图框架引用
  private getMapFrame(): Window | null {
    // 尝试获取3.0.html的iframe引用
    const mapIframe = document.querySelector('iframe[src*="3.0.html"]') as HTMLIFrameElement;
    if (mapIframe && mapIframe.contentWindow) {
      return mapIframe.contentWindow;
    }

    // 如果在同一窗口中，尝试直接通信
    if (window.location.pathname.includes('3.0.html')) {
      return window;
    }

    // 尝试查找其他可能的地图容器
    const mapContainer = document.querySelector('[data-map-container]');
    if (mapContainer) {
      // 如果地图容器存在，可能需要其他通信方式
      console.warn('找到地图容器但无法直接通信');
    }

    return null;
  }

  // 启动导航
  public async startNavigation(route: RouteData): Promise<NavigationResponse> {
    try {
      console.log('🚀 启动导航:', route);
      
      const command: NavigationCommand = {
        type: 'START_NAVIGATION',
        route: route
      };

      const response = await this.sendToMap(command);
      
      if (response.success) {
        console.log('✅ 导航启动成功');
      } else {
        console.error('❌ 导航启动失败:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ 导航启动异常:', error);
      return {
        type: 'NAVIGATION_ERROR',
        success: false,
        message: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  // 停止导航
  public async stopNavigation(): Promise<NavigationResponse> {
    try {
      console.log('⏹️ 停止导航');
      
      const command: NavigationCommand = {
        type: 'STOP_NAVIGATION'
      };

      const response = await this.sendToMap(command);
      
      if (response.success) {
        console.log('✅ 导航停止成功');
      } else {
        console.error('❌ 导航停止失败:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ 导航停止异常:', error);
      return {
        type: 'NAVIGATION_ERROR',
        success: false,
        message: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  // 更新路线
  public async updateRoute(route: RouteData): Promise<NavigationResponse> {
    try {
      console.log('🔄 更新路线:', route);
      
      const command: NavigationCommand = {
        type: 'UPDATE_ROUTE',
        route: route
      };

      const response = await this.sendToMap(command);
      
      if (response.success) {
        console.log('✅ 路线更新成功');
      } else {
        console.error('❌ 路线更新失败:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ 路线更新异常:', error);
      return {
        type: 'NAVIGATION_ERROR',
        success: false,
        message: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  // 获取当前位置
  public async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      console.log('📍 获取当前位置');
      
      const command: NavigationCommand = {
        type: 'GET_LOCATION'
      };

      const response = await this.sendToMap(command);
      
      if (response.success && response.data) {
        console.log('✅ 位置获取成功:', response.data);
        return response.data;
      } else {
        console.error('❌ 位置获取失败:', response.message);
        return null;
      }
    } catch (error) {
      console.error('❌ 位置获取异常:', error);
      return null;
    }
  }

  // 转换智能体推荐数据为地图路线数据
  public convertAgentRecommendationToRoute(recommendation: any, userLocation: any): RouteData {
    return {
      startPoint: {
        latitude: userLocation?.latitude || 31.2304,
        longitude: userLocation?.longitude || 121.4737,
        address: userLocation?.address || '当前位置'
      },
      endPoint: {
        latitude: recommendation.endPoint?.latitude || 31.2404,
        longitude: recommendation.endPoint?.longitude || 121.4837,
        address: recommendation.endPoint?.address || '推荐终点'
      },
      waypoints: recommendation.waypoints || [],
      routeType: recommendation.routeType || 'safe',
      distance: recommendation.distance || 5000,
      estimatedTime: recommendation.estimatedTime || 30,
      safetyScore: recommendation.safetyScore || 85,
      description: recommendation.description || '智能推荐路线'
    };
  }

  // 创建用于嵌入3.0.html的iframe
  public createMapIframe(container: HTMLElement, options: {
    width?: string;
    height?: string;
    src?: string;
  } = {}): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.src = options.src || '/3.0.html';
    iframe.style.width = options.width || '100%';
    iframe.style.height = options.height || '600px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    iframe.setAttribute('data-map-container', 'true');
    
    // 添加iframe加载完成监听器
    iframe.onload = () => {
      console.log('🗺️ 地图iframe加载完成');
      
      // 发送初始化消息
      setTimeout(() => {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'INIT_COMMUNICATION',
            origin: window.location.origin
          }, window.location.origin);
        }
      }, 1000);
    };

    container.appendChild(iframe);
    return iframe;
  }

  // 销毁通信桥接
  public destroy(): void {
    this.messageHandlers.clear();
    this.isInitialized = false;
    console.log('🌉 地图通信桥接服务已销毁');
  }
}

// 导出单例实例
export const mapCommunicationBridge = MapCommunicationBridge.getInstance();