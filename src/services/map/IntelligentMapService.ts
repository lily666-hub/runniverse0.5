/**
 * 智能地图服务类
 * 基于原有5.0.html功能，提供完整的地图操作、路线规划、实时追踪等功能
 */

import { AmapLoader } from '../../utils/amapLoader';
import type {
  IIntelligentMapService,
  MapConfig,
  WaypointData,
  RouteData,
  NavigationInstruction,
  RoutePlanningOptions,
  RoutePlanningResult,
  TrackingConfig,
  TrackingStatus,
  GPSPosition,
  MapError,
  AmapWalkingResponse
} from '../../types/map';

export class IntelligentMapService implements IIntelligentMapService {
  private map: any = null;
  private waypoints: WaypointData[] = [];
  private markers: any[] = [];
  private polyline: any = null;
  private currentRoute: RouteData | null = null;
  private trackingConfig: TrackingConfig | null = null;
  private trackingStatus: TrackingStatus = {
    isActive: false,
    totalDistance: 0,
    totalDuration: 0,
    averageSpeed: 0,
    remainingDistance: 0,
    estimatedTimeToDestination: 0
  };
  private eventListeners: Map<string, Function[]> = new Map();
  private watchId: number | null = null;
  private navigationActive = false;
  private currentInstructionIndex = 0;

  /**
   * 初始化地图服务
   */
  async initialize(container: HTMLElement, config: MapConfig): Promise<void> {
    try {
      console.log('🗺️ 初始化智能地图服务...');
      
      // 加载高德地图API
      await AmapLoader.loadAmap();
      
      if (!window.AMap) {
        throw new Error('高德地图API加载失败');
      }

      // 创建地图实例
      this.map = new window.AMap.Map(container, {
        zoom: config.zoom || 15,
        center: config.center || [121.4737, 31.2304],
        mapStyle: `amap://styles/${config.mapStyle || 'normal'}`,
        showLabel: true,
        showBuildingBlock: true
      });

      // 添加地图控件
      this.map.addControl(new window.AMap.Scale());
      this.map.addControl(new window.AMap.ToolBar({
        locate: true,
        noIpLocate: false,
        locationMarker: true,
        useNative: true
      }));

      // 绑定地图点击事件
      this.map.on('click', this.handleMapClick.bind(this));

      console.log('✅ 智能地图服务初始化完成');
      this.emit('initialized', { map: this.map });
    } catch (error) {
      console.error('❌ 地图服务初始化失败:', error);
      throw new Error(`地图服务初始化失败: ${error}`);
    }
  }

  /**
   * 销毁地图服务
   */
  destroy(): void {
    console.log('🗑️ 销毁地图服务...');
    
    this.stopTracking();
    this.stopNavigation();
    this.clearWaypoints();
    this.clearRoute();
    
    if (this.map) {
      this.map.destroy();
      this.map = null;
    }
    
    this.eventListeners.clear();
    console.log('✅ 地图服务已销毁');
  }

  /**
   * 设置地图中心点
   */
  setCenter(center: [number, number]): void {
    if (this.map) {
      this.map.setCenter(center);
    }
  }

  /**
   * 设置地图缩放级别
   */
  setZoom(zoom: number): void {
    if (this.map) {
      this.map.setZoom(zoom);
    }
  }

  /**
   * 自适应显示
   */
  fitView(points?: [number, number][]): void {
    if (!this.map) return;

    if (points && points.length > 0) {
      this.map.setFitView(points);
    } else if (this.markers.length > 0) {
      this.map.setFitView(this.markers);
    } else if (this.polyline) {
      this.map.setFitView([this.polyline]);
    }
  }

  /**
   * 添加途径点
   */
  addWaypoint(waypoint: WaypointData): void {
    console.log('📍 添加途径点:', waypoint);
    
    // 生成唯一ID
    if (!waypoint.id) {
      waypoint.id = this.generateWaypointId();
    }

    // 创建标记
    const marker = new window.AMap.Marker({
      position: [waypoint.lng, waypoint.lat],
      map: this.map,
      title: waypoint.name,
      content: this.createMarkerContent(waypoint, this.waypoints.length + 1)
    });

    // 添加到数组
    this.waypoints.push({ ...waypoint, marker });
    this.markers.push(marker);

    // 触发事件
    this.emit('waypointAdded', waypoint);
    
    console.log(`✅ 途径点已添加: ${waypoint.name} (总计: ${this.waypoints.length})`);
  }

  /**
   * 移除途径点
   */
  removeWaypoint(waypointId: string): void {
    const index = this.waypoints.findIndex(wp => wp.id === waypointId);
    if (index === -1) return;

    const waypoint = this.waypoints[index];
    
    // 移除标记
    if (waypoint.marker) {
      waypoint.marker.setMap(null);
    }

    // 从数组中移除
    this.waypoints.splice(index, 1);
    this.markers.splice(index, 1);

    // 更新剩余标记的序号
    this.updateMarkerNumbers();

    // 触发事件
    this.emit('waypointRemoved', waypointId);
    
    console.log(`✅ 途径点已移除: ${waypoint.name}`);
  }

  /**
   * 更新途径点
   */
  updateWaypoint(waypointId: string, updates: Partial<WaypointData>): void {
    const waypoint = this.waypoints.find(wp => wp.id === waypointId);
    if (!waypoint) return;

    // 更新数据
    Object.assign(waypoint, updates);

    // 更新标记
    if (waypoint.marker) {
      if (updates.lat !== undefined || updates.lng !== undefined) {
        waypoint.marker.setPosition([waypoint.lng, waypoint.lat]);
      }
      if (updates.name !== undefined) {
        waypoint.marker.setTitle(waypoint.name);
      }
    }

    console.log(`✅ 途径点已更新: ${waypoint.name}`);
  }

  /**
   * 清除所有途径点
   */
  clearWaypoints(): void {
    console.log('🧹 清除所有途径点...');
    
    // 移除所有标记
    this.markers.forEach(marker => {
      marker.setMap(null);
    });

    // 清空数组
    this.waypoints = [];
    this.markers = [];

    // 触发事件
    this.emit('waypointsCleared');
    
    console.log('✅ 所有途径点已清除');
  }

  /**
   * 获取所有途径点
   */
  getWaypoints(): WaypointData[] {
    return [...this.waypoints];
  }

  /**
   * 路线规划
   */
  async planRoute(options: RoutePlanningOptions): Promise<RoutePlanningResult> {
    console.log('🛣️ 开始路线规划...', options);
    
    try {
      if (options.waypoints.length < 2) {
        throw new Error('至少需要2个途径点进行路线规划');
      }

      // 获取API密钥
      const { restApiKey } = AmapLoader.getApiKeys();
      if (!restApiKey) {
        throw new Error('缺少高德地图REST API密钥');
      }

      // 构建路线规划请求
      const route = await this.calculateMultiWaypointRoute(options.waypoints, restApiKey);
      
      // 保存当前路线
      this.currentRoute = route;

      console.log('✅ 路线规划完成:', route);
      
      return {
        success: true,
        route
      };
    } catch (error) {
      console.error('❌ 路线规划失败:', error);
      
      const mapError: MapError = {
        code: 'ROUTE_PLANNING_FAILED',
        message: `路线规划失败: ${error}`,
        type: 'ROUTE_ERROR',
        details: error
      };

      return {
        success: false,
        error: mapError
      };
    }
  }

  /**
   * 绘制路线
   */
  drawRoute(route: RouteData): void {
    console.log('🎨 绘制路线...', route);
    
    // 清除现有路线
    this.clearRoute();

    if (!route.path || route.path.length === 0) {
      console.warn('⚠️ 路线数据为空，无法绘制');
      return;
    }

    // 创建路线折线
    this.polyline = new window.AMap.Polyline({
      path: route.path,
      map: this.map,
      showDir: true,
      strokeWeight: 5,
      strokeColor: '#00A8FF',
      strokeOpacity: 0.8,
      lineJoin: 'round',
      lineCap: 'round'
    });

    // 自适应显示
    this.fitView();

    // 保存路线数据
    this.currentRoute = route;

    console.log('✅ 路线绘制完成');
    this.emit('routeDrawn', route);
  }

  /**
   * 清除路线
   */
  clearRoute(): void {
    if (this.polyline) {
      this.polyline.setMap(null);
      this.polyline = null;
    }
    this.currentRoute = null;
    console.log('✅ 路线已清除');
  }

  /**
   * 开始实时追踪
   */
  startTracking(config: TrackingConfig): void {
    console.log('🎯 开始实时追踪...', config);
    
    this.trackingConfig = config;
    this.trackingStatus.isActive = true;

    // 重置追踪状态
    this.trackingStatus.totalDistance = 0;
    this.trackingStatus.totalDuration = 0;
    this.trackingStatus.averageSpeed = 0;

    this.emit('trackingStarted', config);
    console.log('✅ 实时追踪已开始');
  }

  /**
   * 停止实时追踪
   */
  stopTracking(): void {
    console.log('⏹️ 停止实时追踪...');
    
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.trackingStatus.isActive = false;
    this.trackingConfig = null;

    this.emit('trackingStopped');
    console.log('✅ 实时追踪已停止');
  }

  /**
   * 更新当前位置
   */
  updateCurrentPosition(position: GPSPosition): void {
    if (!this.trackingStatus.isActive) return;

    console.log('📍 更新当前位置:', position);
    
    this.trackingStatus.currentPosition = position;

    // 如果正在导航，检查导航指令
    if (this.navigationActive && this.currentRoute) {
      this.checkNavigationProgress(position);
    }

    this.emit('positionUpdated', position);
  }

  /**
   * 获取追踪状态
   */
  getTrackingStatus(): TrackingStatus {
    return { ...this.trackingStatus };
  }

  /**
   * 开始导航
   */
  startNavigation(route: RouteData): void {
    console.log('🧭 开始导航...', route);
    
    this.currentRoute = route;
    this.navigationActive = true;
    this.currentInstructionIndex = 0;

    // 绘制路线
    this.drawRoute(route);

    this.emit('navigationStarted', route);
    console.log('✅ 导航已开始');
  }

  /**
   * 停止导航
   */
  stopNavigation(): void {
    console.log('⏹️ 停止导航...');
    
    this.navigationActive = false;
    this.currentInstructionIndex = 0;

    this.emit('navigationStopped');
    console.log('✅ 导航已停止');
  }

  /**
   * 获取当前导航指令
   */
  getCurrentInstruction(): NavigationInstruction | null {
    if (!this.currentRoute || !this.navigationActive) return null;
    
    const instructions = this.currentRoute.instructions;
    if (this.currentInstructionIndex >= instructions.length) return null;
    
    return instructions[this.currentInstructionIndex];
  }

  /**
   * 获取下一个导航指令
   */
  getNextInstruction(): NavigationInstruction | null {
    if (!this.currentRoute || !this.navigationActive) return null;
    
    const instructions = this.currentRoute.instructions;
    const nextIndex = this.currentInstructionIndex + 1;
    if (nextIndex >= instructions.length) return null;
    
    return instructions[nextIndex];
  }

  /**
   * 事件监听
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * 移除事件监听
   */
  off(event: string, callback: Function): void {
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
  emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`事件回调执行失败 [${event}]:`, error);
        }
      });
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 处理地图点击事件
   */
  private handleMapClick(e: any): void {
    const { lng, lat } = e.lnglat;
    
    // 创建新的途径点
    const waypoint: WaypointData = {
      id: this.generateWaypointId(),
      name: `自定义点${this.waypoints.length + 1}`,
      lat,
      lng,
      desc: '点击添加',
      type: 'waypoint'
    };

    this.addWaypoint(waypoint);
  }

  /**
   * 生成途径点ID
   */
  private generateWaypointId(): string {
    return `waypoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 创建标记内容
   */
  private createMarkerContent(waypoint: WaypointData, index: number): string {
    const typeColors = {
      start: '#28a745',
      end: '#dc3545',
      waypoint: '#007bff'
    };
    
    const color = typeColors[waypoint.type || 'waypoint'];
    
    return `
      <div style="
        background: ${color};
        color: white;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: bold;
        text-align: center;
        min-width: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        ${index}
      </div>
    `;
  }

  /**
   * 更新标记序号
   */
  private updateMarkerNumbers(): void {
    this.waypoints.forEach((waypoint, index) => {
      if (waypoint.marker) {
        waypoint.marker.setContent(this.createMarkerContent(waypoint, index + 1));
      }
    });
  }

  /**
   * 计算多途径点路线
   */
  private async calculateMultiWaypointRoute(waypoints: WaypointData[], apiKey: string): Promise<RouteData> {
    console.log('🔄 计算多途径点路线...', waypoints);
    
    if (waypoints.length < 2) {
      throw new Error('至少需要2个途径点');
    }

    const fullPath: [number, number][] = [];
    const instructions: NavigationInstruction[] = [];
    let totalDistance = 0;
    let totalDuration = 0;

    // 分段计算路线（每两个相邻点之间）
    for (let i = 0; i < waypoints.length - 1; i++) {
      const origin = waypoints[i];
      const destination = waypoints[i + 1];
      
      console.log(`📍 计算路段 ${i + 1}: ${origin.name} → ${destination.name}`);
      
      try {
        const segmentResult = await this.calculateWalkingRoute(origin, destination, apiKey);
        
        // 拼接路径（避免重复点）
        if (fullPath.length > 0 && segmentResult.path.length > 0) {
          // 检查是否有重复的起点
          const lastPoint = fullPath[fullPath.length - 1];
          const firstPoint = segmentResult.path[0];
          if (Math.abs(lastPoint[0] - firstPoint[0]) < 1e-6 && 
              Math.abs(lastPoint[1] - firstPoint[1]) < 1e-6) {
            fullPath.push(...segmentResult.path.slice(1));
          } else {
            fullPath.push(...segmentResult.path);
          }
        } else {
          fullPath.push(...segmentResult.path);
        }

        // 添加导航指令
        segmentResult.instructions.forEach((instruction, idx) => {
          instructions.push({
            ...instruction,
            id: `instruction_${i}_${idx}`,
            sequence: instructions.length
          });
        });

        totalDistance += segmentResult.distance;
        totalDuration += segmentResult.duration;
        
      } catch (error) {
        console.error(`❌ 路段 ${i + 1} 计算失败:`, error);
        throw new Error(`路段 ${origin.name} → ${destination.name} 计算失败: ${error}`);
      }
    }

    const route: RouteData = {
      id: `route_${Date.now()}`,
      name: `${waypoints[0].name} → ${waypoints[waypoints.length - 1].name}`,
      waypoints,
      path: fullPath,
      distance: totalDistance,
      duration: totalDuration,
      instructions,
      difficulty: this.calculateDifficulty(totalDistance, totalDuration),
      safetyRating: this.calculateSafetyRating(waypoints),
      sceneryRating: this.calculateSceneryRating(waypoints)
    };

    console.log('✅ 多途径点路线计算完成:', {
      distance: `${(totalDistance / 1000).toFixed(2)}km`,
      duration: `${Math.round(totalDuration / 60)}分钟`,
      waypoints: waypoints.length,
      instructions: instructions.length
    });

    return route;
  }

  /**
   * 计算两点间步行路线
   */
  private async calculateWalkingRoute(
    origin: WaypointData, 
    destination: WaypointData, 
    apiKey: string
  ): Promise<{
    path: [number, number][];
    distance: number;
    duration: number;
    instructions: NavigationInstruction[];
  }> {
    const originStr = `${origin.lng},${origin.lat}`;
    const destinationStr = `${destination.lng},${destination.lat}`;
    
    const url = `https://restapi.amap.com/v3/direction/walking?` +
      `origin=${originStr}&destination=${destinationStr}&key=${apiKey}`;

    console.log('🌐 调用高德REST API:', url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }

    const data: AmapWalkingResponse = await response.json();
    
    if (data.status !== '1') {
      throw new Error(`API错误: ${data.info} (${data.infocode})`);
    }

    if (!data.route || !data.route.paths || data.route.paths.length === 0) {
      throw new Error('未找到可用路线');
    }

    const path = data.route.paths[0];
    const steps = path.steps;
    
    // 解析路径坐标
    const pathCoords: [number, number][] = [];
    const instructions: NavigationInstruction[] = [];
    
    steps.forEach((step, index) => {
      // 解析polyline
      const stepCoords = this.parsePolyline(step.polyline);
      pathCoords.push(...stepCoords);
      
      // 创建导航指令
      if (step.instruction) {
        instructions.push({
          id: `step_${index}`,
          text: step.instruction,
          distance: parseInt(step.distance),
          duration: parseInt(step.duration),
          direction: step.orientation || '',
          coordinates: stepCoords[0] || [origin.lng, origin.lat],
          sequence: index
        });
      }
    });

    return {
      path: pathCoords,
      distance: parseInt(path.distance),
      duration: parseInt(path.duration),
      instructions
    };
  }

  /**
   * 解析polyline字符串
   */
  private parsePolyline(polylineStr: string): [number, number][] {
    if (!polylineStr) return [];
    
    return polylineStr.split(';').map(point => {
      const [lng, lat] = point.split(',').map(Number);
      return [lng, lat] as [number, number];
    }).filter(point => !isNaN(point[0]) && !isNaN(point[1]));
  }

  /**
   * 计算路线难度
   */
  private calculateDifficulty(distance: number, duration: number): 'easy' | 'moderate' | 'hard' {
    const distanceKm = distance / 1000;
    
    if (distanceKm < 3) return 'easy';
    if (distanceKm < 8) return 'moderate';
    return 'hard';
  }

  /**
   * 计算安全评分
   */
  private calculateSafetyRating(waypoints: WaypointData[]): number {
    const scores = waypoints
      .map(wp => wp.safetyScore || 5)
      .filter(score => score > 0);
    
    if (scores.length === 0) return 5;
    
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * 计算景观评分
   */
  private calculateSceneryRating(waypoints: WaypointData[]): number {
    const scores = waypoints
      .map(wp => wp.sceneryScore || 5)
      .filter(score => score > 0);
    
    if (scores.length === 0) return 5;
    
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * 检查导航进度
   */
  private checkNavigationProgress(position: GPSPosition): void {
    if (!this.currentRoute || !this.navigationActive) return;

    const currentInstruction = this.getCurrentInstruction();
    if (!currentInstruction) return;

    // 计算到当前指令点的距离
    const distance = this.calculateDistance(
      position.lat, position.lng,
      currentInstruction.coordinates[1], currentInstruction.coordinates[0]
    );

    // 如果距离小于50米，切换到下一个指令
    if (distance < 50) {
      this.currentInstructionIndex++;
      const nextInstruction = this.getCurrentInstruction();
      
      if (nextInstruction) {
        this.emit('instructionChanged', {
          current: nextInstruction,
          previous: currentInstruction
        });
      } else {
        // 导航完成
        this.emit('navigationCompleted');
        this.stopNavigation();
      }
    }
  }

  /**
   * 计算两点间距离（米）
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}