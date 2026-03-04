import { LocationData } from '../hooks/useGPSTracking';

// 安全评估相关接口
export interface SafetyFactors {
  lighting: number; // 照明指数 (0-100)
  crowdDensity: number; // 人群密度 (0-100)
  crimeRate: number; // 犯罪率 (0-100, 越低越安全)
  emergencyAccess: number; // 紧急救援可达性 (0-100)
  roadCondition: number; // 道路状况 (0-100)
  weatherCondition: number; // 天气状况 (0-100)
  timeOfDay: number; // 时间因子 (0-100)
  historicalIncidents: number; // 历史事件 (0-100, 越低越安全)
}

export interface SafetyScore {
  overall: number; // 总体安全分数 (0-100)
  level: 'very_safe' | 'safe' | 'moderate' | 'risky' | 'dangerous';
  factors: SafetyFactors;
  recommendations: string[];
  alerts: SafetyAlert[];
}

export interface SafetyAlert {
  type: 'warning' | 'danger' | 'info';
  message: string;
  priority: 'low' | 'medium' | 'high';
}

export interface TimeSlotSafety {
  hour: number;
  safetyScore: number;
  level: string;
  factors: Partial<SafetyFactors>;
}

export interface RouteSafety {
  routeId: string;
  startPoint: { lat: number; lng: number };
  endPoint: { lat: number; lng: number };
  waypoints: { lat: number; lng: number; safetyScore: number }[];
  overallSafety: number;
  estimatedTime: number;
  distance: number;
  safetyLevel: string;
  risks: string[];
  recommendations: string[];
}

// 权重配置
const SAFETY_WEIGHTS = {
  lighting: 0.20,
  crowdDensity: 0.15,
  crimeRate: 0.25,
  emergencyAccess: 0.15,
  roadCondition: 0.10,
  weatherCondition: 0.05,
  timeOfDay: 0.05,
  historicalIncidents: 0.05
};

// 时间段安全系数
const TIME_SAFETY_FACTORS = {
  6: 0.8,   // 6:00 - 早晨
  7: 0.9,   // 7:00
  8: 0.95,  // 8:00
  9: 0.98,  // 9:00
  10: 1.0,  // 10:00 - 上午最安全
  11: 1.0,  // 11:00
  12: 0.95, // 12:00 - 中午
  13: 0.95, // 13:00
  14: 0.98, // 14:00
  15: 1.0,  // 15:00 - 下午安全
  16: 1.0,  // 16:00
  17: 0.95, // 17:00 - 下班高峰
  18: 0.9,  // 18:00
  19: 0.8,  // 19:00 - 傍晚
  20: 0.7,  // 20:00
  21: 0.6,  // 21:00 - 夜晚
  22: 0.5,  // 22:00
  23: 0.4,  // 23:00
  0: 0.3,   // 0:00 - 深夜最危险
  1: 0.3,   // 1:00
  2: 0.3,   // 2:00
  3: 0.3,   // 3:00
  4: 0.4,   // 4:00
  5: 0.6    // 5:00 - 清晨
};

/**
 * 获取当前时间的安全系数
 */
export const getTimeOfDaySafety = (hour?: number): number => {
  const currentHour = hour ?? new Date().getHours();
  return (TIME_SAFETY_FACTORS[currentHour as keyof typeof TIME_SAFETY_FACTORS] || 0.5) * 100;
};

/**
 * 根据天气获取安全系数
 */
export const getWeatherSafety = (weatherCode?: string): number => {
  const weatherSafety: Record<string, number> = {
    'sunny': 100,
    'cloudy': 95,
    'overcast': 90,
    'light_rain': 70,
    'moderate_rain': 50,
    'heavy_rain': 30,
    'thunderstorm': 20,
    'snow': 40,
    'fog': 60,
    'haze': 80
  };
  
  return weatherSafety[weatherCode || 'sunny'] || 85;
};

/**
 * 模拟获取区域安全数据
 */
export const getAreaSafetyData = (lat: number, lng: number): Partial<SafetyFactors> => {
  // 这里应该调用真实的API获取数据，现在使用模拟数据
  const baseScore = 70 + Math.random() * 20; // 基础分数70-90
  
  // 根据坐标模拟不同区域的安全特征
  const latFactor = Math.sin(lat * Math.PI / 180) * 10;
  const lngFactor = Math.cos(lng * Math.PI / 180) * 10;
  
  return {
    lighting: Math.max(0, Math.min(100, baseScore + latFactor)),
    crowdDensity: Math.max(0, Math.min(100, baseScore + lngFactor)),
    crimeRate: Math.max(0, Math.min(100, 100 - baseScore + Math.random() * 20)),
    emergencyAccess: Math.max(0, Math.min(100, baseScore + Math.random() * 15)),
    roadCondition: Math.max(0, Math.min(100, baseScore + Math.random() * 10)),
    historicalIncidents: Math.max(0, Math.min(100, 100 - baseScore + Math.random() * 15))
  };
};

/**
 * 计算综合安全分数
 */
export const calculateSafetyScore = (
  location: { lat: number; lng: number },
  timeHour?: number,
  weatherCode?: string
): SafetyScore => {
  const areaData = getAreaSafetyData(location.lat, location.lng);
  
  const factors: SafetyFactors = {
    lighting: areaData.lighting || 80,
    crowdDensity: areaData.crowdDensity || 75,
    crimeRate: areaData.crimeRate || 20,
    emergencyAccess: areaData.emergencyAccess || 85,
    roadCondition: areaData.roadCondition || 90,
    weatherCondition: getWeatherSafety(weatherCode),
    timeOfDay: getTimeOfDaySafety(timeHour),
    historicalIncidents: areaData.historicalIncidents || 15
  };

  // 计算加权总分
  const overall = Math.round(
    factors.lighting * SAFETY_WEIGHTS.lighting +
    factors.crowdDensity * SAFETY_WEIGHTS.crowdDensity +
    (100 - factors.crimeRate) * SAFETY_WEIGHTS.crimeRate + // 犯罪率越低越安全
    factors.emergencyAccess * SAFETY_WEIGHTS.emergencyAccess +
    factors.roadCondition * SAFETY_WEIGHTS.roadCondition +
    factors.weatherCondition * SAFETY_WEIGHTS.weatherCondition +
    factors.timeOfDay * SAFETY_WEIGHTS.timeOfDay +
    (100 - factors.historicalIncidents) * SAFETY_WEIGHTS.historicalIncidents // 历史事件越少越安全
  );

  // 确定安全等级
  let level: SafetyScore['level'];
  if (overall >= 85) level = 'very_safe';
  else if (overall >= 70) level = 'safe';
  else if (overall >= 55) level = 'moderate';
  else if (overall >= 40) level = 'risky';
  else level = 'dangerous';

  // 生成建议和警报
  const recommendations = generateRecommendations(factors, level);
  const alerts = generateAlerts(factors, level);

  return {
    overall,
    level,
    factors,
    recommendations,
    alerts
  };
};

/**
 * 生成安全建议
 */
const generateRecommendations = (factors: SafetyFactors, level: SafetyScore['level']): string[] => {
  const recommendations: string[] = [];

  if (factors.lighting < 60) {
    recommendations.push('建议选择照明良好的路线');
    recommendations.push('携带手电筒或使用手机照明');
  }

  if (factors.crowdDensity < 40) {
    recommendations.push('避免在人烟稀少的地方独自跑步');
    recommendations.push('考虑与朋友结伴跑步');
  }

  if (factors.crimeRate > 60) {
    recommendations.push('提高警惕，注意周围环境');
    recommendations.push('避免携带贵重物品');
  }

  if (factors.timeOfDay < 50) {
    recommendations.push('避免在深夜或凌晨时段跑步');
    recommendations.push('选择白天或傍晚时段');
  }

  if (factors.weatherCondition < 70) {
    recommendations.push('注意天气变化，做好防护措施');
    recommendations.push('考虑室内运动替代方案');
  }

  if (level === 'dangerous' || level === 'risky') {
    recommendations.push('强烈建议更换跑步路线');
    recommendations.push('告知家人或朋友您的跑步计划');
    recommendations.push('确保手机电量充足');
  }

  return recommendations;
};

/**
 * 生成安全警报
 */
const generateAlerts = (factors: SafetyFactors, level: SafetyScore['level']): SafetyAlert[] => {
  const alerts: SafetyAlert[] = [];

  if (level === 'dangerous') {
    alerts.push({
      type: 'danger',
      message: '当前区域安全风险极高，强烈建议避免跑步',
      priority: 'high'
    });
  } else if (level === 'risky') {
    alerts.push({
      type: 'warning',
      message: '当前区域存在安全风险，请提高警惕',
      priority: 'high'
    });
  }

  if (factors.crimeRate > 70) {
    alerts.push({
      type: 'warning',
      message: '该区域犯罪率较高，请格外小心',
      priority: 'medium'
    });
  }

  if (factors.lighting < 40) {
    alerts.push({
      type: 'warning',
      message: '照明条件不佳，建议携带照明设备',
      priority: 'medium'
    });
  }

  if (factors.timeOfDay < 40) {
    alerts.push({
      type: 'info',
      message: '当前时段安全系数较低，建议调整跑步时间',
      priority: 'low'
    });
  }

  return alerts;
};

/**
 * 获取24小时安全评估
 */
export const get24HourSafetyAssessment = (location: { lat: number; lng: number }): TimeSlotSafety[] => {
  const assessment: TimeSlotSafety[] = [];
  
  for (let hour = 0; hour < 24; hour++) {
    const safetyScore = calculateSafetyScore(location, hour);
    assessment.push({
      hour,
      safetyScore: safetyScore.overall,
      level: safetyScore.level,
      factors: {
        lighting: safetyScore.factors.lighting,
        timeOfDay: safetyScore.factors.timeOfDay,
        crimeRate: safetyScore.factors.crimeRate
      }
    });
  }
  
  return assessment;
};

/**
 * 路线安全分析
 */
export const analyzeRouteSafety = (
  startPoint: { lat: number; lng: number },
  endPoint: { lat: number; lng: number },
  waypoints: { lat: number; lng: number }[] = []
): RouteSafety => {
  const allPoints = [startPoint, ...waypoints, endPoint];
  const safetyScores: number[] = [];
  const risks: string[] = [];
  const recommendations: string[] = [];

  // 分析每个点的安全性
  const waypointsWithSafety = allPoints.map(point => {
    const safety = calculateSafetyScore(point);
    safetyScores.push(safety.overall);
    
    // 收集风险和建议
    if (safety.level === 'dangerous' || safety.level === 'risky') {
      risks.push(`坐标 (${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}) 存在安全风险`);
    }
    
    return {
      lat: point.lat,
      lng: point.lng,
      safetyScore: safety.overall
    };
  });

  // 计算总体安全分数（加权平均，起点和终点权重更高）
  const weights = allPoints.map((_, index) => {
    if (index === 0 || index === allPoints.length - 1) return 2; // 起点和终点
    return 1; // 中间点
  });
  
  const weightedSum = safetyScores.reduce((sum, score, index) => sum + score * weights[index], 0);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const overallSafety = Math.round(weightedSum / totalWeight);

  // 确定安全等级
  let safetyLevel: string;
  if (overallSafety >= 85) safetyLevel = 'very_safe';
  else if (overallSafety >= 70) safetyLevel = 'safe';
  else if (overallSafety >= 55) safetyLevel = 'moderate';
  else if (overallSafety >= 40) safetyLevel = 'risky';
  else safetyLevel = 'dangerous';

  // 生成路线建议
  if (overallSafety < 60) {
    recommendations.push('建议选择其他更安全的路线');
    recommendations.push('如必须使用此路线，请结伴而行');
  }
  
  if (safetyScores.some(score => score < 40)) {
    recommendations.push('路线中存在高风险区域，请格外小心');
  }

  // 估算距离和时间（简化计算）
  const distance = calculateRouteDistance(allPoints);
  const estimatedTime = Math.round(distance / 10 * 60); // 假设10km/h的跑步速度

  return {
    routeId: `route_${Date.now()}`,
    startPoint,
    endPoint,
    waypoints: waypointsWithSafety,
    overallSafety,
    estimatedTime,
    distance,
    safetyLevel,
    risks,
    recommendations
  };
};

/**
 * 计算路线总距离（简化版）
 */
const calculateRouteDistance = (points: { lat: number; lng: number }[]): number => {
  if (points.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    
    // 使用简化的距离计算公式
    const latDiff = (curr.lat - prev.lat) * 111000; // 纬度差转米
    const lngDiff = (curr.lng - prev.lng) * 111000 * Math.cos(prev.lat * Math.PI / 180); // 经度差转米
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    
    totalDistance += distance;
  }
  
  return Math.round(totalDistance); // 返回米
};

/**
 * 女性专用安全评估
 */
export const calculateWomenSafety = (
  location: { lat: number; lng: number },
  timeHour?: number
): SafetyScore => {
  const baseSafety = calculateSafetyScore(location, timeHour);
  
  // 女性安全需要更严格的标准
  const womenFactors: SafetyFactors = {
    ...baseSafety.factors,
    lighting: baseSafety.factors.lighting * 1.2, // 照明更重要
    crowdDensity: baseSafety.factors.crowdDensity * 1.1, // 人群密度更重要
    crimeRate: baseSafety.factors.crimeRate * 1.3, // 犯罪率影响更大
    emergencyAccess: baseSafety.factors.emergencyAccess * 1.1 // 紧急救援更重要
  };

  // 重新计算分数，标准更严格
  const overall = Math.round(baseSafety.overall * 0.9); // 整体降低10%

  // 调整安全等级（更保守）
  let level: SafetyScore['level'];
  if (overall >= 90) level = 'very_safe';
  else if (overall >= 75) level = 'safe';
  else if (overall >= 60) level = 'moderate';
  else if (overall >= 45) level = 'risky';
  else level = 'dangerous';

  // 添加女性专用建议
  const womenRecommendations = [
    ...baseSafety.recommendations,
    '建议使用女性专用跑步应用',
    '设置紧急联系人',
    '考虑加入女性跑步群组'
  ];

  return {
    overall,
    level,
    factors: womenFactors,
    recommendations: womenRecommendations,
    alerts: baseSafety.alerts
  };
};