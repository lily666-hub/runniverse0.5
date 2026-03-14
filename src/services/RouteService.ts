import { Waypoint, RouteData, NavigationStep, RouteRequest, RouteResponse } from '../types/navigation';

/**
 * 路线规划服务类
 * 集成高德地图REST API进行路线规划和导航
 */
export class RouteService {
  private static instance: RouteService;
  private readonly apiKey: string;
  private readonly baseUrl = 'https://restapi.amap.com/v3';

  private constructor() {
    // 从环境变量或配置中获取高德地图API密钥
    this.apiKey = import.meta.env.VITE_AMAP_API_KEY || 'your_amap_api_key_here';
  }

  /**
   * 获取RouteService单例实例
   */
  public static getInstance(): RouteService {
    if (!RouteService.instance) {
      RouteService.instance = new RouteService();
    }
    return RouteService.instance;
  }

  /**
   * 规划步行路线
   * @param request 路线规划请求参数
   * @returns Promise<RouteData> 路线数据
   */
  public async planWalkingRoute(request: RouteRequest): Promise<RouteData> {
    try {
      const { origin, destination, waypoints = [] } = request;
      
      // 构建请求参数
      const params = new URLSearchParams({
        key: this.apiKey,
        origin: `${origin.longitude},${origin.latitude}`,
        destination: `${destination.longitude},${destination.latitude}`,
        strategy: '0', // 0: 最快捷模式
        extensions: 'all', // 返回详细路径信息
        output: 'json'
      });

      // 如果有途径点，添加到请求参数中
      if (waypoints.length > 0) {
        const waypointsStr = waypoints
          .map(wp => `${wp.longitude},${wp.latitude}`)
          .join(';');
        params.append('waypoints', waypointsStr);
      }

      const response = await fetch(`${this.baseUrl}/direction/walking?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: RouteResponse = await response.json();
      
      if (data.status !== '1') {
        throw new Error(`API error: ${data.info}`);
      }

      return this.parseRouteResponse(data);
    } catch (error) {
      console.error('Route planning failed:', error);
      throw new Error(`路线规划失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 规划驾车路线（备用方案）
   * @param request 路线规划请求参数
   * @returns Promise<RouteData> 路线数据
   */
  public async planDrivingRoute(request: RouteRequest): Promise<RouteData> {
    try {
      const { origin, destination, waypoints = [] } = request;
      
      const params = new URLSearchParams({
        key: this.apiKey,
        origin: `${origin.longitude},${origin.latitude}`,
        destination: `${destination.longitude},${destination.latitude}`,
        strategy: '0', // 0: 速度优先
        extensions: 'all',
        output: 'json'
      });

      if (waypoints.length > 0) {
        const waypointsStr = waypoints
          .map(wp => `${wp.longitude},${wp.latitude}`)
          .join('|');
        params.append('waypoints', waypointsStr);
      }

      const response = await fetch(`${this.baseUrl}/direction/driving?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: RouteResponse = await response.json();
      
      if (data.status !== '1') {
        throw new Error(`API error: ${data.info}`);
      }

      return this.parseRouteResponse(data);
    } catch (error) {
      console.error('Driving route planning failed:', error);
      throw new Error(`驾车路线规划失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 解析高德地图API响应数据
   * @param response API响应数据
   * @returns RouteData 标准化的路线数据
   */
  private parseRouteResponse(response: RouteResponse): RouteData {
    const route = response.route;
    const path = route.paths[0]; // 取第一条路径

    // 解析路径坐标点
    const coordinates: [number, number][] = [];
    path.steps.forEach(step => {
      if (step.polyline) {
        const points = step.polyline.split(';');
        points.forEach(point => {
          const [lng, lat] = point.split(',').map(Number);
          if (!isNaN(lng) && !isNaN(lat)) {
            coordinates.push([lng, lat]);
          }
        });
      }
    });

    // 解析导航步骤
    const steps: NavigationStep[] = path.steps.map((step, index) => ({
      id: `step_${index}`,
      instruction: step.instruction || '继续前进',
      distance: parseInt(step.distance) || 0,
      duration: parseInt(step.duration) || 0,
      action: this.parseAction(step.action),
      road: step.road || '',
      orientation: step.orientation || '',
      coordinates: step.polyline ? this.parsePolyline(step.polyline) : []
    }));

    return {
      id: `route_${Date.now()}`,
      coordinates,
      steps,
      totalDistance: parseInt(path.distance) || 0,
      totalDuration: parseInt(path.duration) || 0,
      bounds: this.calculateBounds(coordinates),
      createdAt: new Date().toISOString()
    };
  }

  /**
   * 解析动作类型
   * @param action 高德地图动作代码
   * @returns 标准化的动作类型
   */
  private parseAction(action?: string): string {
    const actionMap: Record<string, string> = {
      '0': 'straight', // 直行
      '1': 'left', // 左转
      '2': 'right', // 右转
      '3': 'left_front', // 左前方转弯
      '4': 'right_front', // 右前方转弯
      '5': 'left_back', // 左后方转弯
      '6': 'right_back', // 右后方转弯
      '7': 'left_u_turn', // 左转掉头
      '8': 'straight', // 直行
      '11': 'start', // 起点
      '12': 'destination' // 终点
    };

    return actionMap[action || '0'] || 'straight';
  }

  /**
   * 解析polyline字符串为坐标数组
   * @param polyline polyline字符串
   * @returns 坐标数组
   */
  private parsePolyline(polyline: string): [number, number][] {
    const coordinates: [number, number][] = [];
    const points = polyline.split(';');
    
    points.forEach(point => {
      const [lng, lat] = point.split(',').map(Number);
      if (!isNaN(lng) && !isNaN(lat)) {
        coordinates.push([lng, lat]);
      }
    });

    return coordinates;
  }

  /**
   * 计算路线边界
   * @param coordinates 坐标数组
   * @returns 边界对象
   */
  private calculateBounds(coordinates: [number, number][]): {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  } {
    if (coordinates.length === 0) {
      return {
        northeast: { lat: 0, lng: 0 },
        southwest: { lat: 0, lng: 0 }
      };
    }

    let minLng = coordinates[0][0];
    let maxLng = coordinates[0][0];
    let minLat = coordinates[0][1];
    let maxLat = coordinates[0][1];

    coordinates.forEach(([lng, lat]) => {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });

    return {
      northeast: { lat: maxLat, lng: maxLng },
      southwest: { lat: minLat, lng: minLng }
    };
  }

  /**
   * 地理编码 - 将地址转换为坐标
   * @param address 地址字符串
   * @returns Promise<Waypoint> 坐标点
   */
  public async geocode(address: string): Promise<Waypoint> {
    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        address: address,
        city: '上海', // 限制在上海市范围内
        output: 'json'
      });

      const response = await fetch(`${this.baseUrl}/geocode/geo?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== '1' || !data.geocodes || data.geocodes.length === 0) {
        throw new Error('地址解析失败');
      }

      const geocode = data.geocodes[0];
      const [longitude, latitude] = geocode.location.split(',').map(Number);

      return {
        id: `geocode_${Date.now()}`,
        name: geocode.formatted_address || address,
        latitude,
        longitude,
        address: geocode.formatted_address || address,
        type: 'geocoded'
      };
    } catch (error) {
      console.error('Geocoding failed:', error);
      throw new Error(`地址解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 逆地理编码 - 将坐标转换为地址
   * @param latitude 纬度
   * @param longitude 经度
   * @returns Promise<string> 地址字符串
   */
  public async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        location: `${longitude},${latitude}`,
        radius: '1000',
        extensions: 'base',
        output: 'json'
      });

      const response = await fetch(`${this.baseUrl}/geocode/regeo?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== '1' || !data.regeocode) {
        throw new Error('坐标解析失败');
      }

      return data.regeocode.formatted_address || `${latitude}, ${longitude}`;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return `${latitude}, ${longitude}`;
    }
  }

  /**
   * 计算两点之间的距离（米）
   * @param point1 起点
   * @param point2 终点
   * @returns 距离（米）
   */
  public calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371e3; // 地球半径（米）
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * 验证坐标是否在上海市范围内
   * @param latitude 纬度
   * @param longitude 经度
   * @returns 是否在上海市范围内
   */
  public isInShanghai(latitude: number, longitude: number): boolean {
    // 上海市大致边界
    const bounds = {
      north: 31.8733,
      south: 30.6717,
      east: 122.2081,
      west: 120.8517
    };

    return (
      latitude >= bounds.south &&
      latitude <= bounds.north &&
      longitude >= bounds.west &&
      longitude <= bounds.east
    );
  }
}

// 导出单例实例
export const routeService = RouteService.getInstance();