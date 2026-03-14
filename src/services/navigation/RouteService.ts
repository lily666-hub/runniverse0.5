import { 
  RoutePlanRequest, 
  RoutePlanResponse, 
  RouteData, 
  NavigationStep, 
  RouteSegment,
  Waypoint 
} from '../../types/navigation';

/**
 * 路线规划服务
 * 集成高德地图API进行路线规划
 */
export class RouteService {
  private static readonly BASE_URL = 'https://restapi.amap.com/v3';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1秒
  private static readonly WALKING_SPEED = 1.2; // 步行速度 m/s

  /**
   * 获取高德地图API Key
   */
  private static getAmapKey(): string {
    // 优先从环境变量获取
    if (typeof window !== 'undefined' && (window as any).ENV_CONFIG?.VITE_AMAP_API_KEY) {
      return (window as any).ENV_CONFIG.VITE_AMAP_API_KEY;
    }
    
    // 从import.meta.env获取
    if (import.meta?.env?.VITE_AMAP_API_KEY) {
      return import.meta.env.VITE_AMAP_API_KEY;
    }
    
    // 使用提供的API密钥作为默认值
    return import.meta.env.VITE_AMAP_API_KEY || '';
  }

  /**
   * 规划步行路线
   */
  static async planWalkingRoute(request: RoutePlanRequest): Promise<RoutePlanResponse> {
    // 验证输入
    const validationError = this.validateRequest(request);
    if (validationError) {
      return validationError;
    }

    const apiKey = this.getAmapKey();
    
    // 如果没有API Key，直接返回模拟数据
    if (!apiKey) {
      console.info('使用模拟路线数据');
      return this.generateMockRoute(request);
    }

    // 尝试调用真实API
    return this.callAmapApiWithRetry(request, apiKey);
  }

  /**
   * 验证请求参数
   */
  private static validateRequest(request: RoutePlanRequest): RoutePlanResponse | null {
    if (!request.waypoints || request.waypoints.length < 2) {
      return {
        success: false,
        error: {
          code: 'INVALID_WAYPOINTS',
          message: '至少需要2个途径点'
        }
      };
    }

    // 验证坐标有效性
    for (const waypoint of request.waypoints) {
      if (!this.isValidCoordinate(waypoint.lat, waypoint.lng)) {
        return {
          success: false,
          error: {
            code: 'INVALID_COORDINATES',
            message: `无效的坐标: ${waypoint.lat}, ${waypoint.lng}`
          }
        };
      }
    }

    return null;
  }

  /**
   * 验证坐标有效性
   */
  private static isValidCoordinate(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  /**
   * 带重试机制的API调用
   */
  private static async callAmapApiWithRetry(
    request: RoutePlanRequest, 
    apiKey: string
  ): Promise<RoutePlanResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const result = await this.callAmapApi(request, apiKey);
        if (result.success) {
          return result;
        }
        
        // API返回错误，不重试
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`路线规划API调用失败 (尝试 ${attempt}/${this.MAX_RETRIES}):`, error);
        
        if (attempt < this.MAX_RETRIES) {
          await this.delay(this.RETRY_DELAY * attempt);
        }
      }
    }

    console.error('路线规划API调用失败，使用模拟数据:', lastError);
    return this.generateMockRoute(request);
  }

  /**
   * 调用高德地图API
   */
  private static async callAmapApi(
    request: RoutePlanRequest, 
    apiKey: string
  ): Promise<RoutePlanResponse> {
    // 构建路线规划请求
    const origin = `${request.waypoints[0].lng},${request.waypoints[0].lat}`;
    const destination = `${request.waypoints[request.waypoints.length - 1].lng},${request.waypoints[request.waypoints.length - 1].lat}`;
    
    // 中间途径点
    const waypoints = request.waypoints.slice(1, -1)
      .map(wp => `${wp.lng},${wp.lat}`)
      .join(';');

    const params = new URLSearchParams({
      key: apiKey,
      origin,
      destination,
      strategy: this.getStrategyCode(request.strategy || 'fastest'),
      extensions: 'all',
      output: 'json'
    });

    if (waypoints) {
      params.append('waypoints', waypoints);
    }

    // 发送请求到高德地图API（使用AbortController实现超时）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(`${this.BASE_URL}/direction/walking?${params}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === '1' && data.route && data.route.paths && data.route.paths.length > 0) {
        const route = this.parseAmapRoute(data.route.paths[0], request.waypoints);
        return {
          success: true,
          route
        };
      } else {
        return {
          success: false,
          error: {
            code: 'ROUTE_NOT_FOUND',
            message: data.info || '无法找到合适的路线'
          }
        };
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: '请求超时'
          }
        };
      }
      throw error;
    }
  }

  /**
   * 获取策略代码
   */
  private static getStrategyCode(strategy: string): string {
    switch (strategy) {
      case 'fastest':
        return '0'; // 最快路线
      case 'shortest':
        return '1'; // 最短路线
      case 'comfortable':
        return '2'; // 最舒适路线
      case 'safe':
        return '3'; // 最安全路线
      default:
        return '0';
    }
  }

  /**
   * 解析高德地图路线数据
   */
  private static parseAmapRoute(path: any, waypoints: Waypoint[]): RouteData {
    const steps: NavigationStep[] = [];
    const segments: RouteSegment[] = [];
    let totalDistance = 0;
    let totalDuration = 0;

    // 解析步骤
    if (path.steps && Array.isArray(path.steps)) {
      path.steps.forEach((step: any, index: number) => {
        const distance = parseInt(step.distance) || 0;
        const duration = parseInt(step.duration) || 0;
        
        totalDistance += distance;
        totalDuration += duration;

        steps.push({
          id: `step-${index}`,
          instruction: step.instruction || `步骤 ${index + 1}`,
          distance,
          duration,
          polyline: step.polyline || '',
          road: step.road || '',
          orientation: step.orientation || '',
          action: step.action || 'straight'
        });

        // 创建路线段
        if (step.polyline) {
          const coordinates = this.parsePolyline(step.polyline);
          const origin = waypoints[Math.min(index, waypoints.length - 1)];
          const destination = waypoints[Math.min(index + 1, waypoints.length - 1)];
          
          segments.push({
            id: `segment-${index}`,
            origin,
            destination,
            coordinates,
            distance,
            duration,
            polyline: step.polyline,
            steps: [steps[steps.length - 1]]
          });
        }
      });
    }

    return {
      id: `route-${Date.now()}`,
      waypoints,
      steps,
      segments,
      totalDistance,
      totalDuration,
      polyline: path.polyline || '',
      bounds: this.calculateBounds(segments)
    };
  }

  /**
   * 解析polyline坐标
   */
  private static parsePolyline(polyline: string): Array<[number, number]> {
    if (!polyline) return [];
    
    return polyline.split(';').map(point => {
      const [lng, lat] = point.split(',').map(Number);
      return [lng, lat] as [number, number];
    });
  }

  /**
   * 计算边界框
   */
  private static calculateBounds(segments: RouteSegment[]): { northeast: { lat: number; lng: number }; southwest: { lat: number; lng: number } } {
    let minLng = Infinity, minLat = Infinity;
    let maxLng = -Infinity, maxLat = -Infinity;

    segments.forEach(segment => {
      if (segment.coordinates) {
        segment.coordinates.forEach(([lng, lat]) => {
          minLng = Math.min(minLng, lng);
          minLat = Math.min(minLat, lat);
          maxLng = Math.max(maxLng, lng);
          maxLat = Math.max(maxLat, lat);
        });
      }
    });

    return {
      northeast: { lat: maxLat, lng: maxLng },
      southwest: { lat: minLat, lng: minLng }
    };
  }

  /**
   * 生成模拟路线数据（用于开发测试）
   */
  private static generateMockRoute(request: RoutePlanRequest): RoutePlanResponse {
    const { waypoints } = request;
    const steps: NavigationStep[] = [];
    const segments: RouteSegment[] = [];
    let totalDistance = 0;
    let totalDuration = 0;

    // 为每对相邻途径点生成步骤
    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];
      
      // 计算距离
      const distance = this.calculateDistance(from.lat, from.lng, to.lat, to.lng);
      const duration = Math.round(distance / this.WALKING_SPEED); // 步行时间
      
      totalDistance += distance;
      totalDuration += duration;

      // 生成导航步骤
      const step: NavigationStep = {
        id: `step-${i}`,
        instruction: this.generateMockInstruction(from, to, i),
        distance,
        duration,
        polyline: `${from.lng},${from.lat};${to.lng},${to.lat}`,
        road: `模拟道路 ${i + 1}`,
        orientation: this.calculateBearing(from.lat, from.lng, to.lat, to.lng),
        action: 'straight'
      };

      steps.push(step);

      // 生成路线段坐标（简化的直线）
      const coordinates = this.generateMockCoordinates(from, to);
      segments.push({
        id: `segment-${i}`,
        origin: from,
        destination: to,
        coordinates,
        distance,
        duration,
        polyline: `${from.lng},${from.lat};${to.lng},${to.lat}`,
        steps: [step]
      });
    }

    const route: RouteData = {
      id: `mock-route-${Date.now()}`,
      waypoints,
      steps,
      segments,
      totalDistance,
      totalDuration,
      polyline: this.generateMockPolyline(segments),
      bounds: this.calculateBounds(segments)
    };

    return {
      success: true,
      route
    };
  }

  /**
   * 计算两点间距离（米）
   * 使用Haversine公式
   */
  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // 地球半径（米）
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return Math.round(R * c);
  }

  /**
   * 计算方位角
   */
  private static calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): string {
    const dLng = this.toRadians(lng2 - lng1);
    const lat1Rad = this.toRadians(lat1);
    const lat2Rad = this.toRadians(lat2);
    
    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
    
    const bearing = this.toDegrees(Math.atan2(y, x));
    const normalizedBearing = (bearing + 360) % 360;
    
    // 转换为方向描述
    if (normalizedBearing >= 337.5 || normalizedBearing < 22.5) return '北';
    if (normalizedBearing >= 22.5 && normalizedBearing < 67.5) return '东北';
    if (normalizedBearing >= 67.5 && normalizedBearing < 112.5) return '东';
    if (normalizedBearing >= 112.5 && normalizedBearing < 157.5) return '东南';
    if (normalizedBearing >= 157.5 && normalizedBearing < 202.5) return '南';
    if (normalizedBearing >= 202.5 && normalizedBearing < 247.5) return '西南';
    if (normalizedBearing >= 247.5 && normalizedBearing < 292.5) return '西';
    return '西北';
  }

  /**
   * 生成模拟导航指令
   */
  private static generateMockInstruction(from: Waypoint, to: Waypoint, index: number): string {
    if (index === 0) {
      return '开始导航，向前直行';
    }
    
    const bearing = this.calculateBearing(from.lat, from.lng, to.lat, to.lng);
    const distance = this.calculateDistance(from.lat, from.lng, to.lat, to.lng);
    
    if (distance < 50) {
      return '即将到达目的地';
    }
    
    return `向${bearing}方向行走${distance}米`;
  }

  /**
   * 生成模拟坐标点
   */
  private static generateMockCoordinates(from: Waypoint, to: Waypoint): Array<[number, number]> {
    const coordinates: Array<[number, number]> = [];
    const steps = 10; // 生成10个中间点
    
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const lat = from.lat + (to.lat - from.lat) * ratio;
      const lng = from.lng + (to.lng - from.lng) * ratio;
      coordinates.push([lng, lat]);
    }
    
    return coordinates;
  }

  /**
   * 生成模拟polyline
   */
  private static generateMockPolyline(segments: RouteSegment[]): string {
    const allCoordinates: string[] = [];
    
    segments.forEach(segment => {
      segment.coordinates.forEach(([lng, lat]) => {
        allCoordinates.push(`${lng},${lat}`);
      });
    });
    
    return allCoordinates.join(';');
  }

  /**
   * 路线优化
   */
  static optimizeRoute(waypoints: Waypoint[]): Waypoint[] {
    if (waypoints.length <= 2) {
      return waypoints;
    }

    // 简单的最近邻算法优化
    const optimized = [waypoints[0]]; // 起点
    const remaining = waypoints.slice(1, -1); // 中间点
    const destination = waypoints[waypoints.length - 1]; // 终点

    let current = waypoints[0];
    
    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;
      
      remaining.forEach((point, index) => {
        const distance = this.calculateDistance(
          current.lat, current.lng, 
          point.lat, point.lng
        );
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });
      
      const nearest = remaining.splice(nearestIndex, 1)[0];
      optimized.push(nearest);
      current = nearest;
    }
    
    optimized.push(destination); // 终点
    return optimized;
  }

  /**
   * 工具方法：角度转弧度
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * 工具方法：弧度转角度
   */
  private static toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  /**
   * 工具方法：延迟
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}