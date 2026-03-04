import { Database } from '../database/Database';

export interface LocationData {
  lng: number;
  lat: number;
  accuracy?: number;
  timestamp: number;
}

export interface SafetyAssessmentRequest {
  location: LocationData;
  timeSlot: string;
  routePoints?: LocationData[];
  userProfile?: {
    gender: 'male' | 'female' | 'other';
    age: number;
    experience: 'beginner' | 'intermediate' | 'advanced';
  };
}

export interface SafetyAssessmentResponse {
  overallScore: number;
  riskFactors: {
    lighting: number;
    crowdDensity: number;
    crimeRate: number;
    trafficSafety: number;
    weatherConditions: number;
  };
  recommendations: string[];
  riskHotspots: RiskHotspot[];
  alternativeRoutes?: RouteRecommendation[];
  emergencyContacts: EmergencyContact[];
}

export interface RiskHotspot {
  location: LocationData;
  type: 'crime' | 'accident' | 'lighting' | 'crowd' | 'weather';
  level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  radius: number;
  reportedAt: string;
  verifiedAt?: string;
}

export interface RouteRecommendation {
  id: string;
  name: string;
  points: LocationData[];
  distance: number;
  estimatedTime: number;
  safetyScore: number;
  features: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  type: 'police' | 'medical' | 'fire' | 'personal';
  location?: LocationData;
  distance?: number;
}

export interface SafetyIncident {
  id?: string;
  type: string;
  location: LocationData;
  timestamp: string;
  severity: string;
  description: string;
  reportedBy: string;
  resolved?: boolean;
}

export interface WomenSafetyFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'tracking' | 'communication' | 'route' | 'emergency';
}

export class SafetyService {
  private db: Database;

  constructor() {
    this.db = new Database();
  }

  // 获取安全评估
  async getSafetyAssessment(request: SafetyAssessmentRequest): Promise<SafetyAssessmentResponse> {
    try {
      // 计算基础安全评分
      const baseScore = await this.calculateBaseSafetyScore(request.location, request.timeSlot);
      
      // 获取风险因子
      const riskFactors = await this.calculateRiskFactors(request.location, request.timeSlot);
      
      // 计算综合评分
      const overallScore = this.calculateOverallScore(baseScore, riskFactors, request.userProfile);
      
      // 获取风险热点
      const riskHotspots = await this.getRiskHotspots(request.location, 2000);
      
      // 生成建议
      const recommendations = this.generateSafetyRecommendations(request);
      
      // 获取紧急联系人
      const emergencyContacts = await this.getNearbyEmergencyContacts(request.location, 5000);
      
      // 获取替代路线（如果提供了路线点）
      let alternativeRoutes: RouteRecommendation[] = [];
      if (request.routePoints && request.routePoints.length > 0) {
        alternativeRoutes = await this.getRouteSafetyAnalysis(request.routePoints);
      }

      return {
        overallScore,
        riskFactors,
        recommendations,
        riskHotspots,
        alternativeRoutes,
        emergencyContacts
      };
    } catch (error) {
      console.error('Safety assessment error:', error);
      throw error;
    }
  }

  // 获取实时安全评分
  async getRealTimeSafetyScore(location: LocationData): Promise<number> {
    try {
      const hour = new Date().getHours();
      const timeSlot = this.getTimeSlot(hour);
      return await this.calculateBaseSafetyScore(location, timeSlot);
    } catch (error) {
      console.error('Real-time safety score error:', error);
      throw error;
    }
  }

  // 获取历史安全数据
  async getHistoricalSafetyData(location: LocationData, timeRange: { start: string; end: string }) {
    try {
      const incidents = await this.db.query(`
        SELECT * FROM safety_incidents 
        WHERE ST_DWithin(
          ST_SetSRID(ST_MakePoint(lng, lat), 4326),
          ST_SetSRID(ST_MakePoint($1, $2), 4326),
          1000
        )
        AND timestamp BETWEEN $3 AND $4
        ORDER BY timestamp DESC
      `, [location.lng, location.lat, timeRange.start, timeRange.end]);

      const statistics = await this.calculateHistoricalStatistics(incidents);

      return {
        location,
        timeRange,
        incidents,
        statistics
      };
    } catch (error) {
      console.error('Historical safety data error:', error);
      throw error;
    }
  }

  // 路线安全分析
  async getRouteSafetyAnalysis(routePoints: LocationData[]): Promise<RouteRecommendation[]> {
    try {
      const routes: RouteRecommendation[] = [];
      
      // 分析原始路线
      const originalRoute = await this.analyzeRoute(routePoints, 'original-route');
      routes.push(originalRoute);
      
      // 生成替代安全路线
      const alternativeRoutes = await this.generateAlternativeRoutes(routePoints);
      routes.push(...alternativeRoutes);
      
      // 按安全评分排序
      return routes.sort((a, b) => b.safetyScore - a.safetyScore);
    } catch (error) {
      console.error('Route safety analysis error:', error);
      throw error;
    }
  }

  // 获取风险热点
  async getRiskHotspots(location: LocationData, radius: number = 1000): Promise<RiskHotspot[]> {
    try {
      const hotspots = await this.db.query(`
        SELECT * FROM risk_hotspots 
        WHERE ST_DWithin(
          ST_SetSRID(ST_MakePoint(lng, lat), 4326),
          ST_SetSRID(ST_MakePoint($1, $2), 4326),
          $3
        )
        AND (verified_at IS NOT NULL OR reported_at > NOW() - INTERVAL '7 days')
        ORDER BY level DESC, reported_at DESC
      `, [location.lng, location.lat, radius]);

      return hotspots.map(this.mapRiskHotspot);
    } catch (error) {
      console.error('Risk hotspots error:', error);
      return this.getMockRiskHotspots(location);
    }
  }

  // 报告安全事件
  async reportSafetyIncident(incident: SafetyIncident): Promise<SafetyIncident> {
    try {
      const result = await this.db.query(`
        INSERT INTO safety_incidents (type, lng, lat, timestamp, severity, description, reported_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        incident.type,
        incident.location.lng,
        incident.location.lat,
        incident.timestamp,
        incident.severity,
        incident.description,
        incident.reportedBy
      ]);

      return this.mapSafetyIncident(result[0]);
    } catch (error) {
      console.error('Report safety incident error:', error);
      throw error;
    }
  }

  // 获取安全建议
  async getSafetyRecommendations(location: LocationData, userProfile?: any, timeSlot?: string): Promise<string[]> {
    const recommendations: string[] = [];
    
    try {
      const currentHour = new Date().getHours();
      const currentTimeSlot = timeSlot || this.getTimeSlot(currentHour);
      
      // 基于时间的建议
      if (currentTimeSlot === 'night') {
        recommendations.push('夜间跑步建议结伴进行，选择照明良好的路段');
        recommendations.push('携带反光装备和照明设备');
      } else if (currentTimeSlot === 'evening') {
        recommendations.push('傍晚时段注意能见度，建议穿着鲜艳服装');
      }
      
      // 基于性别的建议
      if (userProfile?.gender === 'female') {
        recommendations.push('建议使用女性专用跑步路线和安全功能');
        recommendations.push('开启实时位置分享给信任的联系人');
        recommendations.push('携带个人安全设备（如防身警报器）');
      }
      
      // 基于经验的建议
      if (userProfile?.experience === 'beginner') {
        recommendations.push('新手建议选择熟悉的路线，避免偏僻区域');
        recommendations.push('建议加入跑步社群，寻找经验丰富的跑友');
      }
      
      // 获取当前位置的特定建议
      const locationRisks = await this.getRiskHotspots(location, 500);
      if (locationRisks.length > 0) {
        recommendations.push('当前区域存在安全风险点，建议选择替代路线');
      }
      
      // 通用安全建议
      recommendations.push('保持手机电量充足，确保通信畅通');
      recommendations.push('告知家人或朋友您的跑步计划和路线');
      recommendations.push('注意周围环境，保持警觉');
      
      return recommendations;
    } catch (error) {
      console.error('Safety recommendations error:', error);
      return [
        '保持手机电量充足',
        '告知家人或朋友跑步路线',
        '注意周围环境，保持警觉',
        '选择照明良好的路段'
      ];
    }
  }

  // 获取最佳跑步时间
  async getBestRunningTimes(location: LocationData): Promise<Array<{ time: string; score: number; description: string }>> {
    try {
      const times = [
        { time: '06:00-08:00', slot: 'morning' },
        { time: '09:00-11:00', slot: 'morning' },
        { time: '16:00-18:00', slot: 'afternoon' },
        { time: '18:00-20:00', slot: 'evening' },
        { time: '20:00-22:00', slot: 'night' }
      ];

      const bestTimes = await Promise.all(
        times.map(async (timeInfo) => {
          const score = await this.calculateBaseSafetyScore(location, timeInfo.slot);
          return {
            time: timeInfo.time,
            score,
            description: this.getTimeDescription(timeInfo.slot, score)
          };
        })
      );

      return bestTimes.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Best running times error:', error);
      return [
        { time: '06:00-08:00', score: 85, description: '早晨时段，空气清新，安全性较高' },
        { time: '16:00-18:00', score: 80, description: '下午时段，光线充足，人流适中' },
        { time: '18:00-20:00', score: 75, description: '傍晚时段，需注意照明条件' }
      ];
    }
  }

  // 获取女性专用安全功能
  async getWomenSafetyFeatures(): Promise<WomenSafetyFeature[]> {
    try {
      const features = await this.db.query('SELECT * FROM women_safety_features ORDER BY category, name');
      return features.map(this.mapWomenSafetyFeature);
    } catch (error) {
      console.error('Women safety features error:', error);
      return this.getDefaultWomenSafetyFeatures();
    }
  }

  // 更新安全偏好
  async updateSafetyPreferences(userId: string, preferences: any): Promise<boolean> {
    try {
      await this.db.query(`
        INSERT INTO user_safety_preferences (user_id, preferences, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET preferences = $2, updated_at = NOW()
      `, [userId, JSON.stringify(preferences)]);

      return true;
    } catch (error) {
      console.error('Update safety preferences error:', error);
      return false;
    }
  }

  // 获取附近紧急联系人
  async getNearbyEmergencyContacts(location: LocationData, radius: number = 5000): Promise<EmergencyContact[]> {
    try {
      const contacts = await this.db.query(`
        SELECT * FROM emergency_contacts 
        WHERE ST_DWithin(
          ST_SetSRID(ST_MakePoint(lng, lat), 4326),
          ST_SetSRID(ST_MakePoint($1, $2), 4326),
          $3
        )
        ORDER BY type, ST_Distance(
          ST_SetSRID(ST_MakePoint(lng, lat), 4326),
          ST_SetSRID(ST_MakePoint($1, $2), 4326)
        )
      `, [location.lng, location.lat, radius]);

      return contacts.map(this.mapEmergencyContact);
    } catch (error) {
      console.error('Nearby emergency contacts error:', error);
      return this.getMockEmergencyContacts(location);
    }
  }

  // 私有辅助方法
  private async calculateBaseSafetyScore(location: LocationData, timeSlot: string): Promise<number> {
    let score = 75; // 基础分数

    // 时间因子
    const timeMultiplier = this.getTimeMultiplier(timeSlot);
    score *= timeMultiplier;

    // 位置因子（基于历史数据）
    const locationRisk = await this.getLocationRiskScore(location);
    score *= (1 - locationRisk / 100);

    // 确保分数在0-100范围内
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private async calculateRiskFactors(location: LocationData, timeSlot: string) {
    return {
      lighting: this.calculateLightingScore(timeSlot),
      crowdDensity: 70 + Math.random() * 20,
      crimeRate: await this.getCrimeRateScore(location),
      trafficSafety: 75 + Math.random() * 20,
      weatherConditions: 85 + Math.random() * 10
    };
  }

  private calculateOverallScore(baseScore: number, riskFactors: any, userProfile?: any): number {
    const weights = {
      lighting: 0.25,
      crowdDensity: 0.2,
      crimeRate: 0.3,
      trafficSafety: 0.15,
      weatherConditions: 0.1
    };

    let weightedScore = 0;
    for (const [factor, weight] of Object.entries(weights)) {
      weightedScore += riskFactors[factor] * weight;
    }

    // 用户档案调整
    if (userProfile?.gender === 'female') {
      weightedScore *= 0.95; // 女性用户更严格的安全标准
    }

    return Math.round(Math.max(0, Math.min(100, weightedScore)));
  }

  private generateSafetyRecommendations(request: SafetyAssessmentRequest): string[] {
    const recommendations: string[] = [];
    
    if (request.timeSlot === 'night') {
      recommendations.push('夜间跑步建议结伴进行');
      recommendations.push('选择照明良好的路段');
    }
    
    if (request.userProfile?.gender === 'female') {
      recommendations.push('建议使用女性专用跑步路线');
      recommendations.push('携带个人安全设备');
    }
    
    recommendations.push('保持手机电量充足');
    recommendations.push('告知家人或朋友跑步路线');
    
    return recommendations;
  }

  private async analyzeRoute(routePoints: LocationData[], routeId: string): Promise<RouteRecommendation> {
    const distance = this.calculateRouteDistance(routePoints);
    const estimatedTime = Math.round(distance / 200); // 假设200m/min的速度
    const safetyScore = await this.calculateRouteSafetyScore(routePoints);
    
    return {
      id: routeId,
      name: routeId === 'original-route' ? '原始路线' : '推荐路线',
      points: routePoints,
      distance,
      estimatedTime,
      safetyScore,
      features: this.getRouteFeatures(safetyScore),
      difficulty: this.getRouteDifficulty(distance)
    };
  }

  private async generateAlternativeRoutes(originalPoints: LocationData[]): Promise<RouteRecommendation[]> {
    // 这里应该调用地图API生成替代路线
    // 目前返回模拟数据
    return [
      {
        id: 'alt-route-1',
        name: '安全替代路线1',
        points: originalPoints.map(p => ({
          ...p,
          lng: p.lng + 0.001,
          lat: p.lat + 0.001
        })),
        distance: 3200,
        estimatedTime: 20,
        safetyScore: 88,
        features: ['良好照明', '监控覆盖', '人流密集'],
        difficulty: 'easy'
      }
    ];
  }

  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  private getTimeMultiplier(timeSlot: string): number {
    switch (timeSlot) {
      case 'morning': return 1.1;
      case 'afternoon': return 1.0;
      case 'evening': return 0.9;
      case 'night': return 0.7;
      default: return 1.0;
    }
  }

  private calculateLightingScore(timeSlot: string): number {
    switch (timeSlot) {
      case 'morning': return 85;
      case 'afternoon': return 95;
      case 'evening': return 70;
      case 'night': return 45;
      default: return 75;
    }
  }

  private async getLocationRiskScore(location: LocationData): Promise<number> {
    // 基于历史犯罪数据计算位置风险
    // 这里返回模拟值
    return Math.random() * 30; // 0-30的风险分数
  }

  private async getCrimeRateScore(location: LocationData): Promise<number> {
    // 基于犯罪率数据计算分数
    return 80 + Math.random() * 15;
  }

  private calculateRouteDistance(points: LocationData[]): number {
    let distance = 0;
    for (let i = 1; i < points.length; i++) {
      distance += this.calculateDistance(points[i-1], points[i]);
    }
    return Math.round(distance);
  }

  private calculateDistance(point1: LocationData, point2: LocationData): number {
    const R = 6371000; // 地球半径（米）
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private async calculateRouteSafetyScore(points: LocationData[]): Promise<number> {
    let totalScore = 0;
    for (const point of points) {
      const score = await this.calculateBaseSafetyScore(point, this.getTimeSlot(new Date().getHours()));
      totalScore += score;
    }
    return Math.round(totalScore / points.length);
  }

  private getRouteFeatures(safetyScore: number): string[] {
    const features: string[] = [];
    if (safetyScore >= 90) features.push('优秀安全等级');
    if (safetyScore >= 80) features.push('良好照明');
    if (safetyScore >= 70) features.push('监控覆盖');
    features.push('紧急电话');
    return features;
  }

  private getRouteDifficulty(distance: number): 'easy' | 'medium' | 'hard' {
    if (distance < 3000) return 'easy';
    if (distance < 8000) return 'medium';
    return 'hard';
  }

  private getTimeDescription(timeSlot: string, score: number): string {
    const descriptions = {
      morning: '早晨时段，空气清新',
      afternoon: '下午时段，光线充足',
      evening: '傍晚时段，需注意照明',
      night: '夜间时段，建议结伴'
    };
    
    const safetyLevel = score >= 80 ? '安全性较高' : score >= 60 ? '安全性一般' : '需要注意安全';
    return `${descriptions[timeSlot] || ''}，${safetyLevel}`;
  }

  private async calculateHistoricalStatistics(incidents: any[]) {
    const incidentsByType = incidents.reduce((acc, incident) => {
      acc[incident.type] = (acc[incident.type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalIncidents: incidents.length,
      incidentsByType,
      averageSafetyScore: 75 + Math.random() * 20,
      trendDirection: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)]
    };
  }

  // 数据映射方法
  private mapRiskHotspot(row: any): RiskHotspot {
    return {
      location: {
        lng: row.lng,
        lat: row.lat,
        timestamp: Date.now()
      },
      type: row.type,
      level: row.level,
      description: row.description,
      radius: row.radius,
      reportedAt: row.reported_at,
      verifiedAt: row.verified_at
    };
  }

  private mapSafetyIncident(row: any): SafetyIncident {
    return {
      id: row.id,
      type: row.type,
      location: {
        lng: row.lng,
        lat: row.lat,
        timestamp: new Date(row.timestamp).getTime()
      },
      timestamp: row.timestamp,
      severity: row.severity,
      description: row.description,
      reportedBy: row.reported_by,
      resolved: row.resolved
    };
  }

  private mapEmergencyContact(row: any): EmergencyContact {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      type: row.type,
      location: row.lng && row.lat ? {
        lng: row.lng,
        lat: row.lat,
        timestamp: Date.now()
      } : undefined,
      distance: row.distance
    };
  }

  private mapWomenSafetyFeature(row: any): WomenSafetyFeature {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      enabled: row.enabled,
      category: row.category
    };
  }

  // 模拟数据方法
  private getMockRiskHotspots(location: LocationData): RiskHotspot[] {
    return [
      {
        location: {
          lng: location.lng + 0.001,
          lat: location.lat + 0.001,
          timestamp: Date.now()
        },
        type: 'lighting',
        level: 'medium',
        description: '照明不足区域',
        radius: 100,
        reportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  private getMockEmergencyContacts(location: LocationData): EmergencyContact[] {
    return [
      {
        id: 'police-001',
        name: '黄浦区派出所',
        phone: '021-23456789',
        type: 'police',
        location: {
          lng: location.lng + 0.001,
          lat: location.lat + 0.001,
          timestamp: Date.now()
        },
        distance: 500
      }
    ];
  }

  private getDefaultWomenSafetyFeatures(): WomenSafetyFeature[] {
    return [
      {
        id: 'real-time-tracking',
        name: '实时位置追踪',
        description: '向信任联系人实时分享位置信息',
        enabled: true,
        category: 'tracking'
      },
      {
        id: 'emergency-alert',
        name: '一键紧急求救',
        description: '快速发送求救信号给紧急联系人',
        enabled: true,
        category: 'emergency'
      },
      {
        id: 'safe-route',
        name: '女性专用安全路线',
        description: '推荐照明良好、人流密集的安全路线',
        enabled: true,
        category: 'route'
      },
      {
        id: 'buddy-system',
        name: '女性跑友匹配',
        description: '匹配附近的女性跑友，结伴跑步',
        enabled: false,
        category: 'communication'
      }
    ];
  }
}