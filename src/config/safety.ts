// 安全评估系统配置

export const SAFETY_CONFIG = {
  // WebSocket 配置
  websocket: {
    url: 'ws://localhost:8080',
    reconnectInterval: 5000,
    maxReconnectAttempts: 5
  },
  
  // 地理位置配置
  geolocation: {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000
  },
  
  // 安全评分阈值
  safetyThresholds: {
    high: 80,
    medium: 60,
    low: 40
  },
  
  // 紧急响应配置
  emergency: {
    sosCountdown: 5, // 秒
    autoCallTimeout: 30, // 秒
    emergencyNumbers: ['110', '120', '119']
  },
  
  // 监控配置
  monitoring: {
    updateInterval: 30000, // 30秒
    alertCheckInterval: 10000, // 10秒
    locationUpdateInterval: 60000 // 1分钟
  },
  
  // 缓存配置
  cache: {
    safetyDataExpiry: 300000, // 5分钟
    locationDataExpiry: 60000, // 1分钟
    alertDataExpiry: 180000 // 3分钟
  },
  
  // UI 配置
  ui: {
    animationDuration: 300,
    toastDuration: 3000,
    loadingDelay: 500
  },
  
  // 安全区域默认配置
  safeZones: {
    defaultRadius: 500, // 米
    checkInterval: 30000, // 30秒
    alertThreshold: 100 // 米
  },
  
  // 女性安全功能配置
  womenSafety: {
    buddyCheckInterval: 300000, // 5分钟
    safetyTipRotationInterval: 10000, // 10秒
    emergencyContactsLimit: 5
  }
};

// 安全评分颜色映射
export const SAFETY_COLORS = {
  high: 'bg-green-500',
  medium: 'bg-yellow-500',
  low: 'bg-red-500',
  unknown: 'bg-gray-500'
};

// 警报类型配置
export const ALERT_TYPES = {
  lighting: {
    icon: 'Lightbulb',
    color: 'bg-yellow-500',
    priority: 'medium'
  },
  crowd: {
    icon: 'Users',
    color: 'bg-blue-500',
    priority: 'low'
  },
  crime: {
    icon: 'AlertTriangle',
    color: 'bg-red-500',
    priority: 'high'
  },
  weather: {
    icon: 'Cloud',
    color: 'bg-gray-500',
    priority: 'medium'
  },
  traffic: {
    icon: 'Car',
    color: 'bg-orange-500',
    priority: 'medium'
  }
};

// 紧急类型配置
export const EMERGENCY_TYPES = {
  medical: {
    label: '医疗急救',
    color: 'bg-red-500',
    icon: 'Heart',
    priority: 'high'
  },
  security: {
    label: '人身安全',
    color: 'bg-orange-500',
    icon: 'Shield',
    priority: 'high'
  },
  accident: {
    label: '意外事故',
    color: 'bg-yellow-500',
    icon: 'AlertTriangle',
    priority: 'medium'
  },
  harassment: {
    label: '骚扰威胁',
    color: 'bg-purple-500',
    icon: 'UserX',
    priority: 'high'
  },
  other: {
    label: '其他紧急情况',
    color: 'bg-gray-500',
    icon: 'HelpCircle',
    priority: 'medium'
  }
};