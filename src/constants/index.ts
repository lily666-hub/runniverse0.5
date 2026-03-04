/**
 * 应用常量定义
 */

// 应用信息
export const APP_NAME = '上海城市跑';
export const APP_DESCRIPTION = '探索上海风光，记录跑步足迹';

// 路由路径
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  RUN: '/run',
  STATS: '/stats',
  ROUTES: '/routes',
  ROUTE_DETAIL: '/route/:id',
  CHALLENGES: '/challenges',
} as const;

// 本地存储键名
export const STORAGE_KEYS = {
  USER: 'shanghai_run_user',
  SETTINGS: 'shanghai_run_settings',
  RUNS: 'shanghai_run_runs',
  THEME: 'shanghai_run_theme',
} as const;

// 主题色彩
export const COLORS = {
  PRIMARY: '#1E88E5', // 上海蓝
  SECONDARY: '#FF7043', // 活力橙
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  ERROR: '#F44336',
  INFO: '#2196F3',
  LIGHT_GRAY: '#F5F5F5',
  DARK_GRAY: '#424242',
} as const;

// 兴趣标签
export const INTEREST_TAGS = [
  { id: 'historical', label: '历史建筑', icon: '🏛️' },
  { id: 'modern_art', label: '现代艺术', icon: '🎨' },
  { id: 'nature', label: '自然风光', icon: '🌳' },
  { id: 'local_life', label: '市井烟火气', icon: '🏮' },
  { id: 'riverside', label: '江景', icon: '🌊' },
  { id: 'park', label: '公园', icon: '🌲' },
  { id: 'cityscape', label: '城市景观', icon: '🏙️' },
  { id: 'cultural', label: '文化古迹', icon: '🏯' },
  { id: 'commercial', label: '商业区', icon: '🏢' },
  { id: 'residential', label: '住宅区', icon: '🏘️' },
] as const;

// 难度级别
export const DIFFICULTY_LEVELS = {
  easy: {
    label: '简单',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: '适合初学者，地势平坦',
  },
  medium: {
    label: '中等',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    description: '有一定挑战性，适合有经验的跑者',
  },
  hard: {
    label: '困难',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: '高强度训练，适合专业跑者',
  },
} as const;

// 跑步配速区间（分钟/公里）
export const PACE_ZONES = {
  RECOVERY: { min: 7, max: 9, label: '恢复跑', color: '#4CAF50' },
  EASY: { min: 5.5, max: 7, label: '轻松跑', color: '#8BC34A' },
  MODERATE: { min: 4.5, max: 5.5, label: '中等强度', color: '#FF9800' },
  THRESHOLD: { min: 4, max: 4.5, label: '乳酸阈值', color: '#FF5722' },
  INTERVAL: { min: 3, max: 4, label: '间歇跑', color: '#F44336' },
} as const;

// 距离选项（公里）
export const DISTANCE_OPTIONS = [
  { value: 1, label: '1公里' },
  { value: 3, label: '3公里' },
  { value: 5, label: '5公里' },
  { value: 10, label: '10公里' },
  { value: 21.1, label: '半程马拉松' },
  { value: 42.2, label: '全程马拉松' },
] as const;

// 时长选项（分钟）
export const DURATION_OPTIONS = [
  { value: 15, label: '15分钟' },
  { value: 30, label: '30分钟' },
  { value: 45, label: '45分钟' },
  { value: 60, label: '1小时' },
  { value: 90, label: '1.5小时' },
  { value: 120, label: '2小时' },
] as const;

// 配速选项（分钟/公里）
export const PACE_OPTIONS = [
  { value: 3, label: '3:00/km' },
  { value: 3.5, label: '3:30/km' },
  { value: 4, label: '4:00/km' },
  { value: 4.5, label: '4:30/km' },
  { value: 5, label: '5:00/km' },
  { value: 5.5, label: '5:30/km' },
  { value: 6, label: '6:00/km' },
  { value: 6.5, label: '6:30/km' },
  { value: 7, label: '7:00/km' },
  { value: 8, label: '8:00/km' },
] as const;

// 成就徽章
export const ACHIEVEMENTS = {
  FIRST_RUN: {
    id: 'first_run',
    title: '初次尝试',
    description: '完成第一次跑步',
    icon: '🏃',
    condition: (stats: any) => stats.total_runs >= 1,
  },
  DISTANCE_5K: {
    id: 'distance_5k',
    title: '5公里达人',
    description: '累计跑步距离达到5公里',
    icon: '🎯',
    condition: (stats: any) => stats.total_distance >= 5000,
  },
  DISTANCE_10K: {
    id: 'distance_10k',
    title: '10公里挑战者',
    description: '累计跑步距离达到10公里',
    icon: '🏆',
    condition: (stats: any) => stats.total_distance >= 10000,
  },
  DISTANCE_MARATHON: {
    id: 'distance_marathon',
    title: '马拉松勇士',
    description: '累计跑步距离达到42.2公里',
    icon: '👑',
    condition: (stats: any) => stats.total_distance >= 42200,
  },
  CONSISTENCY_7: {
    id: 'consistency_7',
    title: '坚持一周',
    description: '连续7天跑步',
    icon: '📅',
    condition: (stats: any) => stats.consecutive_days >= 7,
  },
  CONSISTENCY_30: {
    id: 'consistency_30',
    title: '坚持一月',
    description: '连续30天跑步',
    icon: '🗓️',
    condition: (stats: any) => stats.consecutive_days >= 30,
  },
} as const;

// API端点
export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: '/auth/signup',
    SIGNIN: '/auth/signin',
    SIGNOUT: '/auth/signout',
    USER: '/auth/user',
  },
  PROFILE: '/api/profile',
  RUNS: '/api/runs',
  ROUTES: '/api/routes',
  CHALLENGES: '/api/challenges',
  PERSONAL_RECORDS: '/api/personal-records',
  LEADERBOARD: '/api/leaderboard',
} as const;

// 地图配置
export const MAP_CONFIG = {
  DEFAULT_ZOOM: 13,
  MIN_ZOOM: 10,
  MAX_ZOOM: 18,
  SHANGHAI_CENTER: [121.4737, 31.2304] as [number, number],
  TILE_SIZE: 256,
} as const;

// GPS配置
export const GPS_CONFIG = {
  HIGH_ACCURACY: true,
  TIMEOUT: 10000,
  MAXIMUM_AGE: 60000,
  MIN_DISTANCE: 5, // 最小记录距离（米）
  UPDATE_INTERVAL: 1000, // 更新间隔（毫秒）
} as const;

// 验证规则
export const VALIDATION = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^1[3-9]\d{9}$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 20,
  HEIGHT_MIN: 100,
  HEIGHT_MAX: 250,
  WEIGHT_MIN: 30,
  WEIGHT_MAX: 200,
  AGE_MIN: 10,
  AGE_MAX: 100,
} as const;

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  AUTH_FAILED: '登录失败，请检查用户名和密码',
  PERMISSION_DENIED: '权限不足，请联系管理员',
  GPS_UNAVAILABLE: 'GPS定位不可用，请检查定位权限',
  GPS_TIMEOUT: 'GPS定位超时，请重试',
  INVALID_EMAIL: '请输入有效的邮箱地址',
  INVALID_PHONE: '请输入有效的手机号码',
  PASSWORD_TOO_SHORT: `密码长度不能少于${VALIDATION.PASSWORD_MIN_LENGTH}位`,
  REQUIRED_FIELD: '此字段为必填项',
} as const;