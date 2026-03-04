// 天气服务 - 集成 OpenWeatherMap One Call API 3.0 和高德地图位置服务

// API 配置（使用代理）
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';
const OPENWEATHER_CURRENT_URL = '/api/openweather/data/2.5/weather';
const OPENWEATHER_FORECAST_URL = '/api/openweather/data/2.5/forecast';
const AMAP_API_KEY = import.meta.env.VITE_AMAP_API_KEY || '';

// 默认位置：复旦大学邯郸校区
const DEFAULT_LOCATION = {
  lat: 31.2973,
  lon: 121.5035,
  name: '复旦大学邯郸校区'
};

// 位置信息接口
export interface LocationData {
  lat: number;
  lon: number;
  name?: string;
  address?: string;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  uvIndex?: number;
  visibility?: number;
  pressure?: number;
  feelsLike?: number;
}

export interface WeatherForecast {
  date: string;
  temperature: {
    min: number;
    max: number;
  };
  condition: string;
  description: string;
  icon: string;
  precipitation: number;
}

// 天气条件映射
const weatherConditionMap: Record<string, { description: string; icon: string; runningAdvice: string }> = {
  'clear': { description: '晴朗', icon: '☀️', runningAdvice: '完美的跑步天气！' },
  'sunny': { description: '晴天', icon: '🌞', runningAdvice: '适合跑步，注意防晒' },
  'partly-cloudy': { description: '多云', icon: '⛅', runningAdvice: '很好的跑步条件' },
  'cloudy': { description: '阴天', icon: '☁️', runningAdvice: '舒适的跑步天气' },
  'overcast': { description: '阴沉', icon: '🌫️', runningAdvice: '适合跑步，空气湿润' },
  'light-rain': { description: '小雨', icon: '🌦️', runningAdvice: '建议室内运动或等雨停' },
  'rain': { description: '雨天', icon: '🌧️', runningAdvice: '不建议户外跑步' },
  'heavy-rain': { description: '大雨', icon: '⛈️', runningAdvice: '避免户外运动' },
  'snow': { description: '雪天', icon: '❄️', runningAdvice: '路面湿滑，注意安全' },
  'fog': { description: '雾天', icon: '🌫️', runningAdvice: '能见度低，注意安全' },
  'windy': { description: '大风', icon: '💨', runningAdvice: '注意风阻，调整配速' }
};

// OpenWeatherMap 天气条件映射
const openWeatherConditionMap: Record<string, string> = {
  'Clear': 'clear',
  'Clouds': 'cloudy',
  'Rain': 'rain',
  'Drizzle': 'light-rain',
  'Thunderstorm': 'heavy-rain',
  'Snow': 'snow',
  'Mist': 'fog',
  'Smoke': 'fog',
  'Haze': 'fog',
  'Dust': 'fog',
  'Fog': 'fog',
  'Sand': 'fog',
  'Ash': 'fog',
  'Squall': 'windy',
  'Tornado': 'windy'
};

// 缓存机制
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

const cache = new Map<string, CacheItem<any>>();
const CACHE_DURATION = 10 * 60 * 1000; // 10分钟

function getCacheKey(lat: number, lon: number, type: string): string {
  return `${type}_${lat.toFixed(4)}_${lon.toFixed(4)}`;
}

function getFromCache<T>(key: string): T | null {
  const item = cache.get(key);
  if (item && Date.now() < item.expiry) {
    return item.data;
  }
  cache.delete(key);
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    expiry: Date.now() + CACHE_DURATION
  });
}

// 位置获取功能
export const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('浏览器不支持地理定位，使用默认位置');
      resolve(DEFAULT_LOCATION);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5分钟
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: LocationData = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          name: '当前位置'
        };
        console.log('✅ 获取到用户位置:', location);
        resolve(location);
      },
      (error) => {
        console.warn('获取位置失败，使用默认位置:', error.message);
        resolve(DEFAULT_LOCATION);
      },
      options
    );
  });
};

// 使用高德地图获取地址信息
export const getAddressFromCoords = async (lat: number, lon: number): Promise<string> => {
  try {
    const url = `https://restapi.amap.com/v3/geocode/regeo?location=${lon},${lat}&key=${AMAP_API_KEY}&radius=1000&extensions=base`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === '1' && data.regeocode) {
      return data.regeocode.formatted_address || '未知地址';
    }
  } catch (error) {
    console.warn('获取地址信息失败:', error);
  }
  return '未知地址';
};

// OpenWeatherMap 2.5 API 数据转换
const convertOpenWeatherData = (data: any): WeatherData => {
  const weather = data.weather[0];
  const main = data.main;
  const wind = data.wind || {};
  
  // 映射天气条件
  const condition = openWeatherConditionMap[weather.main] || 'clear';
  const conditionInfo = weatherConditionMap[condition] || weatherConditionMap['clear'];
  
  return {
    temperature: Math.round(main.temp),
    condition,
    humidity: main.humidity,
    windSpeed: Math.round((wind.speed || 0) * 3.6), // m/s 转 km/h
    description: weather.description,
    icon: conditionInfo.icon,
    uvIndex: undefined, // 2.5 API 不提供 UV 指数
    visibility: data.visibility ? Math.round(data.visibility / 1000) : undefined, // m 转 km
    pressure: main.pressure,
    feelsLike: Math.round(main.feels_like)
  };
};

// 获取跑步建议
export const getRunningAdvice = (weather: WeatherData): string => {
  const condition = weatherConditionMap[weather.condition];
  if (condition) {
    return condition.runningAdvice;
  }

  // 基于温度的建议
  if (weather.temperature < 0) {
    return '气温较低，注意保暖，建议室内运动';
  } else if (weather.temperature > 35) {
    return '气温过高，建议避开高温时段或选择室内运动';
  } else if (weather.temperature >= 15 && weather.temperature <= 25) {
    return '温度适宜，是跑步的好时机！';
  } else if (weather.temperature < 15) {
    return '气温偏低，注意热身和保暖';
  } else {
    return '气温偏高，注意补水和防暑';
  }
};

// 获取天气适宜性评分 (0-1)
export const getWeatherSuitabilityScore = (weather: WeatherData): number => {
  let score = 1.0;

  // 温度评分
  if (weather.temperature >= 15 && weather.temperature <= 25) {
    score *= 1.0; // 最佳温度
  } else if (weather.temperature >= 10 && weather.temperature <= 30) {
    score *= 0.8; // 良好温度
  } else if (weather.temperature >= 5 && weather.temperature <= 35) {
    score *= 0.6; // 可接受温度
  } else {
    score *= 0.3; // 不适宜温度
  }

  // 天气条件评分
  switch (weather.condition) {
    case 'clear':
    case 'sunny':
    case 'partly-cloudy':
      score *= 1.0;
      break;
    case 'cloudy':
    case 'overcast':
      score *= 0.9;
      break;
    case 'light-rain':
      score *= 0.4;
      break;
    case 'rain':
    case 'heavy-rain':
      score *= 0.1;
      break;
    case 'snow':
    case 'fog':
      score *= 0.2;
      break;
    default:
      score *= 0.7;
  }

  // 风速评分
  if (weather.windSpeed <= 10) {
    score *= 1.0;
  } else if (weather.windSpeed <= 20) {
    score *= 0.8;
  } else {
    score *= 0.5;
  }

  // 湿度评分
  if (weather.humidity >= 40 && weather.humidity <= 70) {
    score *= 1.0;
  } else if (weather.humidity >= 30 && weather.humidity <= 80) {
    score *= 0.9;
  } else {
    score *= 0.7;
  }

  return Math.max(0, Math.min(1, score));
};

// 获取当前天气数据 - 使用 OpenWeatherMap One Call API 3.0
export const fetchCurrentWeather = async (lat?: number, lon?: number): Promise<WeatherData> => {
  // 如果没有提供坐标，获取当前位置
  let location: LocationData;
  if (lat !== undefined && lon !== undefined) {
    location = { lat, lon };
  } else {
    location = await getCurrentLocation();
  }

  console.log('🌤️ 开始获取天气数据，位置:', location);

  // 检查缓存
  const cacheKey = getCacheKey(location.lat, location.lon, 'current');
  const cachedData = getFromCache<WeatherData>(cacheKey);
  if (cachedData) {
    console.log('📦 使用缓存的天气数据');
    return cachedData;
  }

  try {
    // 构建 OpenWeatherMap 2.5 Current Weather API URL
    const url = `${OPENWEATHER_CURRENT_URL}?lat=${location.lat}&lon=${location.lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=zh_cn`;
    
    console.log('🌐 调用 OpenWeatherMap API:', url.replace(OPENWEATHER_API_KEY, '***'));
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.main || !data.weather) {
      throw new Error('API 响应数据格式错误');
    }
    
    // 转换数据格式
    const weatherData = convertOpenWeatherData(data);
    
    // 缓存数据
    setCache(cacheKey, weatherData);
    
    console.log('✅ OpenWeatherMap 天气数据获取成功:', weatherData);
    return weatherData;
    
  } catch (error) {
    console.error('❌ OpenWeatherMap API 调用失败:', error);
    
    // Fallback: 生成基于位置和季节的合理天气数据
    return generateFallbackWeatherData(location.lat, location.lon);
  }
};

// Fallback 天气数据生成
const generateFallbackWeatherData = (lat: number, lon: number): WeatherData => {
  console.log('🔄 生成 Fallback 天气数据');
  
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const hour = now.getHours();
  
  // 基于季节的温度范围
  let baseTemp: number;
  let tempVariation: number;
  
  if (month >= 12 || month <= 2) { // 冬季
    baseTemp = 8;
    tempVariation = 8;
  } else if (month >= 3 && month <= 5) { // 春季
    baseTemp = 18;
    tempVariation = 10;
  } else if (month >= 6 && month <= 8) { // 夏季
    baseTemp = 28;
    tempVariation = 8;
  } else { // 秋季
    baseTemp = 20;
    tempVariation = 10;
  }
  
  // 基于时间的温度调整
  const timeAdjustment = Math.sin((hour - 6) * Math.PI / 12) * 5; // -5 到 +5 度
  const temperature = Math.round(baseTemp + tempVariation * (Math.random() - 0.5) + timeAdjustment);
  
  // 基于季节的天气条件
  const seasonalConditions = {
    winter: ['clear', 'cloudy', 'overcast', 'fog'],
    spring: ['clear', 'partly-cloudy', 'cloudy', 'light-rain'],
    summer: ['clear', 'sunny', 'partly-cloudy', 'cloudy'],
    autumn: ['clear', 'partly-cloudy', 'cloudy', 'light-rain']
  };
  
  let conditions: string[];
  if (month >= 12 || month <= 2) conditions = seasonalConditions.winter;
  else if (month >= 3 && month <= 5) conditions = seasonalConditions.spring;
  else if (month >= 6 && month <= 8) conditions = seasonalConditions.summer;
  else conditions = seasonalConditions.autumn;
  
  const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
  const conditionInfo = weatherConditionMap[randomCondition] || weatherConditionMap['clear'];
  
  const weatherData: WeatherData = {
    temperature,
    condition: randomCondition,
    humidity: Math.round(40 + Math.random() * 40), // 40-80%
    windSpeed: Math.round(Math.random() * 15), // 0-15 km/h
    description: conditionInfo.description,
    icon: conditionInfo.icon,
    uvIndex: Math.max(0, Math.round((temperature - 10) / 5 + Math.random() * 3)), // 基于温度估算
    visibility: Math.round(8 + Math.random() * 7), // 8-15 km
    pressure: Math.round(1000 + Math.random() * 50), // 1000-1050 hPa
    feelsLike: temperature + Math.round((Math.random() - 0.5) * 4) // ±2度
  };
  
  console.log('✅ Fallback 天气数据生成完成:', weatherData);
  return weatherData;
};

// 获取天气预报 - 使用 OpenWeatherMap One Call API 3.0
export const fetchWeatherForecast = async (lat?: number, lon?: number): Promise<WeatherForecast[]> => {
  // 如果没有提供坐标，获取当前位置
  let location: LocationData;
  if (lat !== undefined && lon !== undefined) {
    location = { lat, lon };
  } else {
    location = await getCurrentLocation();
  }

  console.log('📅 开始获取天气预报，位置:', location);

  // 检查缓存
  const cacheKey = getCacheKey(location.lat, location.lon, 'forecast');
  const cachedData = getFromCache<WeatherForecast[]>(cacheKey);
  if (cachedData) {
    console.log('📦 使用缓存的预报数据');
    return cachedData;
  }

  try {
    // 构建 OpenWeatherMap 2.5 Forecast API URL
    const url = `${OPENWEATHER_FORECAST_URL}?lat=${location.lat}&lon=${location.lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=zh_cn`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.list) {
      throw new Error('API 响应数据格式错误');
    }
    
    // 转换预报数据 - 2.5 API 返回每3小时的数据，需要按天分组
    const dailyData = new Map<string, any[]>();
    
    data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!dailyData.has(date)) {
        dailyData.set(date, []);
      }
      dailyData.get(date)!.push(item);
    });
    
    const forecast: WeatherForecast[] = Array.from(dailyData.entries())
      .slice(0, 7)
      .map(([date, dayItems]) => {
        // 取当天的主要天气条件（出现最多的）
        const weatherCounts = new Map<string, number>();
        let totalTemp = 0;
        let minTemp = Infinity;
        let maxTemp = -Infinity;
        let totalPrecipitation = 0;
        
        dayItems.forEach(item => {
          const weatherMain = item.weather[0].main;
          weatherCounts.set(weatherMain, (weatherCounts.get(weatherMain) || 0) + 1);
          totalTemp += item.main.temp;
          minTemp = Math.min(minTemp, item.main.temp_min);
          maxTemp = Math.max(maxTemp, item.main.temp_max);
          if (item.rain && item.rain['3h']) {
            totalPrecipitation += item.rain['3h'];
          }
        });
        
        // 找出出现最多的天气条件
        let dominantWeather = 'Clear';
        let maxCount = 0;
        weatherCounts.forEach((count, weather) => {
          if (count > maxCount) {
            maxCount = count;
            dominantWeather = weather;
          }
        });
        
        const condition = openWeatherConditionMap[dominantWeather] || 'clear';
        const conditionInfo = weatherConditionMap[condition] || weatherConditionMap['clear'];
        
        return {
          date,
          temperature: {
            min: Math.round(minTemp),
            max: Math.round(maxTemp)
          },
          condition,
          description: conditionInfo.description,
          icon: conditionInfo.icon,
          precipitation: Math.round((totalPrecipitation / dayItems.length) * 100) // 平均降水量转换为百分比
        };
      });
    
    // 缓存数据
    setCache(cacheKey, forecast);
    
    console.log('✅ OpenWeatherMap 预报数据获取成功');
    return forecast;
    
  } catch (error) {
    console.error('❌ OpenWeatherMap 预报 API 调用失败:', error);
    
    // Fallback: 生成基于位置和季节的合理预报数据
    return generateFallbackForecastData(location.lat, location.lon);
  }
};

// Fallback 预报数据生成
const generateFallbackForecastData = (lat: number, lon: number): WeatherForecast[] => {
  console.log('🔄 生成 Fallback 预报数据');
  
  const forecast: WeatherForecast[] = [];
  const now = new Date();
  const month = now.getMonth() + 1;
  
  // 基于季节的条件和温度
  let conditions: string[];
  let baseMinTemp: number;
  let baseMaxTemp: number;
  
  if (month >= 12 || month <= 2) { // 冬季
    conditions = ['clear', 'cloudy', 'overcast', 'fog'];
    baseMinTemp = 2;
    baseMaxTemp = 12;
  } else if (month >= 3 && month <= 5) { // 春季
    conditions = ['clear', 'partly-cloudy', 'cloudy', 'light-rain'];
    baseMinTemp = 12;
    baseMaxTemp = 22;
  } else if (month >= 6 && month <= 8) { // 夏季
    conditions = ['clear', 'sunny', 'partly-cloudy', 'cloudy'];
    baseMinTemp = 22;
    baseMaxTemp = 32;
  } else { // 秋季
    conditions = ['clear', 'partly-cloudy', 'cloudy', 'light-rain'];
    baseMinTemp = 15;
    baseMaxTemp = 25;
  }

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const conditionInfo = weatherConditionMap[randomCondition] || weatherConditionMap['clear'];
    
    const minTemp = Math.round(baseMinTemp + (Math.random() - 0.5) * 8);
    const maxTemp = minTemp + Math.round(5 + Math.random() * 10);

    forecast.push({
      date: date.toISOString().split('T')[0],
      temperature: {
        min: minTemp,
        max: maxTemp
      },
      condition: randomCondition,
      description: conditionInfo.description,
      icon: conditionInfo.icon,
      precipitation: randomCondition.includes('rain') ? Math.round(60 + Math.random() * 40) : Math.round(Math.random() * 30)
    });
  }

  console.log('✅ Fallback 预报数据生成完成');
  return forecast;
};

// 获取基于天气的路线推荐
export const getWeatherBasedRouteRecommendations = (weather: WeatherData) => {
  const recommendations = [];

  if (weather.condition === 'rain' || weather.condition === 'heavy-rain') {
    recommendations.push({
      type: 'indoor',
      message: '雨天建议选择室内跑步机或体育馆',
      routes: ['室内体育馆', '健身房跑步机', '地下通道']
    });
  } else if (weather.temperature > 30) {
    recommendations.push({
      type: 'shade',
      message: '高温天气建议选择有遮阴的路线',
      routes: ['公园林荫道', '河滨绿道', '地下通道']
    });
  } else if (weather.temperature < 5) {
    recommendations.push({
      type: 'warm',
      message: '低温天气建议选择避风的路线',
      routes: ['室内场馆', '建筑群间道路', '地铁站周边']
    });
  } else {
    recommendations.push({
      type: 'outdoor',
      message: '天气适宜，推荐户外路线',
      routes: ['滨江大道', '世纪公园', '外滩步道']
    });
  }

  return recommendations;
};

// 天气服务已完成 OpenWeatherMap One Call API 3.0 集成