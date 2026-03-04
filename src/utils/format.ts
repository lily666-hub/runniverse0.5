/**
 * 格式化距离显示
 * @param meters 距离（米）
 * @returns 格式化的距离字符串
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(2)}km`;
};

/**
 * 格式化时间显示
 * @param seconds 时间（秒）
 * @returns 格式化的时间字符串 (HH:MM:SS)
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * 格式化配速显示
 * @param minutesPerKm 配速（分钟/公里）
 * @returns 格式化的配速字符串 (M'SS")
 */
export const formatPace = (minutesPerKm: number): string => {
  if (!minutesPerKm || minutesPerKm === Infinity) {
    return "--'--\"";
  }
  
  const minutes = Math.floor(minutesPerKm);
  const seconds = Math.floor((minutesPerKm - minutes) * 60);
  
  return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
};

/**
 * 格式化速度显示
 * @param kmh 速度（公里/小时）
 * @returns 格式化的速度字符串
 */
export const formatSpeed = (kmh: number): string => {
  return `${kmh.toFixed(1)} km/h`;
};

/**
 * 计算卡路里消耗
 * @param distanceKm 距离（公里）
 * @param durationMinutes 时间（分钟）
 * @param weightKg 体重（公斤）
 * @returns 卡路里消耗
 */
export const calculateCalories = (distanceKm: number, durationMinutes: number, weightKg: number): number => {
  // 使用MET值计算卡路里
  // 跑步的MET值根据速度而定：
  // 8 km/h: 8.3 MET
  // 10 km/h: 9.8 MET
  // 12 km/h: 11.0 MET
  // 14 km/h: 12.3 MET
  // 16 km/h: 14.5 MET
  
  if (durationMinutes === 0) return 0;
  
  const speedKmh = (distanceKm / durationMinutes) * 60;
  let met = 8.3; // 默认MET值
  
  if (speedKmh >= 16) {
    met = 14.5;
  } else if (speedKmh >= 14) {
    met = 12.3;
  } else if (speedKmh >= 12) {
    met = 11.0;
  } else if (speedKmh >= 10) {
    met = 9.8;
  } else if (speedKmh >= 8) {
    met = 8.3;
  } else {
    met = 6.0; // 慢跑或快走
  }
  
  // 卡路里 = MET × 体重(kg) × 时间(小时)
  return met * weightKg * (durationMinutes / 60);
};

/**
 * 格式化日期显示
 * @param date 日期
 * @param format 格式类型
 * @returns 格式化的日期字符串
 */
export const formatDate = (date: Date, format: 'short' | 'long' | 'time' = 'short'): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (format === 'time') {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  if (diffDays === 0) {
    return '今天';
  } else if (diffDays === 1) {
    return '昨天';
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  }
  
  if (format === 'short') {
    return date.toLocaleDateString('zh-CN', { 
      month: 'numeric', 
      day: 'numeric' 
    });
  }
  
  return date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化的文件大小字符串
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * 格式化数字显示（添加千分位分隔符）
 * @param num 数字
 * @returns 格式化的数字字符串
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-CN');
};

/**
 * 格式化百分比显示
 * @param value 数值
 * @param total 总数
 * @param decimals 小数位数
 * @returns 格式化的百分比字符串
 */
export const formatPercentage = (value: number, total: number, decimals: number = 1): string => {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
};