import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Cloud, 
  Sun, 
  CloudRain, 
  Wind, 
  Thermometer, 
  Droplets, 
  Eye,
  MapPin,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Route,
  Calendar,
  Loader2
} from 'lucide-react';
import { fetchCurrentWeather, getWeatherSuitabilityScore, getRunningAdvice, WeatherData } from '../services/weatherService';
import { LocationData } from '../services/locationService';
import { useEnhancedGeolocation } from '../hooks/useEnhancedGeolocation';

interface WeatherRecommendation {
  id: string;
  title: string;
  description: string;
  suitabilityScore: number;
  weatherCondition: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  visibility: number;
  advice: string[];
  bestTimeSlots: string[];
  routeTypes: string[];
  precautions: string[];
}

const WeatherRecommendation: React.FC = () => {
  const navigate = useNavigate();
  // 设置合理的超时时间（8秒）与hook保持一致
  const { location, accuracy, error: locationError, locationMethod } = useEnhancedGeolocation({
    timeout: 8000,
    enableHighAccuracy: true,
    maximumAge: 300000
  });
  
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [recommendations, setRecommendations] = useState<WeatherRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<'current' | 'today' | 'week'>('current');
  const [locationStatus, setLocationStatus] = useState<'getting' | 'success' | 'failed' | 'timeout'>('getting');
  const [locationProgress, setLocationProgress] = useState(0);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let timeoutTimer: NodeJS.Timeout;

    // 启动进度指示器
    if (!location && !locationError) {
      setLocationStatus('getting');
      setLocationProgress(0);
      
      // 模拟进度条
      progressInterval = setInterval(() => {
        setLocationProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 800);

      // 设置超时，如果8秒内没有获取到位置，使用默认位置
      timeoutTimer = setTimeout(() => {
        if (!location && !locationError && loading) {
          console.log('位置获取超时，使用默认位置');
          setLocationStatus('timeout');
          setLocationProgress(100);
          fetchWeatherRecommendationsWithDefaultLocation();
        }
      }, 8000);
    }

    // 如果有位置信息，使用实际位置
    if (location) {
      setLocationStatus('success');
      setLocationProgress(100);
      clearInterval(progressInterval);
      clearTimeout(timeoutTimer);
      fetchWeatherRecommendations();
    } else if (locationError) {
      // 位置获取失败时，使用默认位置
      setLocationStatus('failed');
      setLocationProgress(100);
      clearInterval(progressInterval);
      clearTimeout(timeoutTimer);
      fetchWeatherRecommendationsWithDefaultLocation();
    }

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timeoutTimer);
    };
  }, [location, locationError]);

  const fetchWeatherRecommendations = async () => {
    if (!location) return;
    
    try {
      setLoading(true);
      // 将位置信息转换为 LocationData 格式
      const locationData: LocationData = {
        latitude: location.latitude,
        longitude: location.longitude,
        city: '上海市',
        district: '杨浦区',
        address: '当前位置'
      };
      
      const weather = await fetchCurrentWeather(locationData.latitude, locationData.longitude);
      setWeatherData(weather);
      
      // 生成基于天气的推荐
      const recs = generateWeatherRecommendations(weather);
      setRecommendations(recs);
    } catch (error) {
      console.error('获取天气推荐失败:', error);
      // 即使天气获取失败，也要停止加载状态
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherRecommendationsWithDefaultLocation = async () => {
    try {
      setLoading(true);
      // 使用复旦大学邯郸校区作为默认位置
      const defaultLocationData: LocationData = {
        latitude: 31.2958,
        longitude: 121.5034,
        city: '上海市',
        district: '杨浦区',
        address: '复旦大学邯郸校区'
      };
      
      const weather = await fetchCurrentWeather(defaultLocationData.latitude, defaultLocationData.longitude);
      setWeatherData(weather);
      
      // 生成基于天气的推荐
      const recs = generateWeatherRecommendations(weather);
      setRecommendations(recs);
    } catch (error) {
      console.error('获取默认位置天气推荐失败:', error);
      // 如果连默认位置都失败，至少要停止加载状态并提供基本信息
      setLoading(false);
      // 提供一个基本的推荐，即使没有天气数据
      setRecommendations([{
        id: 'fallback',
        title: '天气服务暂不可用',
        description: '无法获取当前天气信息，建议查看其他天气应用',
        suitabilityScore: 0.5,
        weatherCondition: '未知',
        temperature: 20,
        humidity: 60,
        windSpeed: 5,
        visibility: 10,
        advice: ['建议查看其他天气应用确认当前天气', '根据实际情况决定是否适合跑步'],
        bestTimeSlots: ['请查看实时天气'],
        routeTypes: ['根据天气情况选择'],
        precautions: ['注意安全', '关注天气变化']
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setLocationStatus('getting');
    setLocationProgress(0);
    
    // 重新初始化位置获取
    try {
      // 如果有位置信息，直接刷新天气数据
      if (location) {
        await fetchWeatherRecommendations();
      } else {
        // 没有位置信息时，尝试重新获取位置或使用默认位置
        await fetchWeatherRecommendationsWithDefaultLocation();
      }
    } catch (error) {
      console.error('刷新失败:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRetryLocation = async () => {
    setLocationStatus('getting');
    setLocationProgress(0);
    
    // 这里可以触发位置重新获取
    // 由于useEnhancedGeolocation hook的限制，我们通过刷新页面来重新获取位置
    window.location.reload();
  };

  const generateWeatherRecommendations = (weather: WeatherData): WeatherRecommendation[] => {
    const suitabilityScore = getWeatherSuitabilityScore(weather);
    const adviceString = getRunningAdvice(weather);
    // 将字符串转换为数组
    const advice = [adviceString];
    
    const recommendations: WeatherRecommendation[] = [];

    // 基于当前天气生成推荐
    if (suitabilityScore >= 0.8) {
      recommendations.push({
        id: '1',
        title: '绝佳跑步天气',
        description: '当前天气条件非常适合户外跑步',
        suitabilityScore: suitabilityScore,
        weatherCondition: weather.condition,
        temperature: weather.temperature,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed,
        visibility: weather.visibility,
        advice: [...advice, '享受户外跑步的乐趣', '保持正常配速'],
        bestTimeSlots: ['现在', '接下来2小时'],
        routeTypes: ['公园路线', '河滨步道', '城市环线'],
        precautions: ['注意补水', '适当防晒']
      });
    } else if (suitabilityScore >= 0.6) {
      recommendations.push({
        id: '2',
        title: '适中跑步条件',
        description: '天气条件尚可，需要注意一些细节',
        suitabilityScore: suitabilityScore,
        weatherCondition: weather.condition,
        temperature: weather.temperature,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed,
        visibility: weather.visibility,
        advice: [...advice, '适当调整跑步强度', '关注身体感受'],
        bestTimeSlots: ['早晨6-8点', '傍晚5-7点'],
        routeTypes: ['室内跑道', '有遮蔽的路线'],
        precautions: ['携带雨具', '注意路面湿滑', '适当增减衣物']
      });
    } else {
      recommendations.push({
        id: '3',
        title: '建议室内运动',
        description: '当前天气不太适合户外跑步',
        suitabilityScore: suitabilityScore,
        weatherCondition: weather.condition,
        temperature: weather.temperature,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed,
        visibility: weather.visibility,
        advice: [...advice, '考虑室内健身替代方案', '等待天气好转'],
        bestTimeSlots: ['等待天气改善'],
        routeTypes: ['健身房', '室内跑道', '家庭健身'],
        precautions: ['避免户外运动', '关注天气变化', '考虑室内替代方案']
      });
    }

    return recommendations;
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case '晴':
        return <Sun className="w-8 h-8 text-yellow-500" />;
      case 'cloudy':
      case '多云':
        return <Cloud className="w-8 h-8 text-gray-500" />;
      case 'rainy':
      case '雨':
        return <CloudRain className="w-8 h-8 text-blue-500" />;
      default:
        return <Cloud className="w-8 h-8 text-gray-500" />;
    }
  };

  const getSuitabilityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getSuitabilityText = (score: number) => {
    if (score >= 0.8) return '非常适合';
    if (score >= 0.6) return '适中';
    return '不建议';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">获取天气推荐中...</p>
          
          {/* 位置获取状态指示器 */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">位置获取进度</span>
              <span className="text-sm font-medium text-gray-900">{locationProgress}%</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${locationProgress}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-center">
              {locationStatus === 'getting' && (
                <div className="flex items-center text-blue-600">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span className="text-sm">正在获取位置信息...</span>
                </div>
              )}
              {locationStatus === 'success' && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">位置获取成功 ({locationMethod === 'amap' ? '高德定位' : locationMethod === 'browser' ? '浏览器定位' : '复旦大学'})</span>
                </div>
              )}
              {locationStatus === 'failed' && (
                <div className="flex items-center text-yellow-600">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  <span className="text-sm">位置获取失败，使用复旦大学邯郸校区</span>
                </div>
              )}
              {locationStatus === 'timeout' && (
                <div className="flex items-center text-orange-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="text-sm">位置获取超时，使用复旦大学邯郸校区</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/routes')}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center">
                <Cloud className="w-6 h-6 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">智能天气推荐</h1>
                  <p className="text-sm text-gray-600">基于实时天气的跑步建议</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 定位信息简洁提示 */}
        <div className="mb-6">
          <div className="flex items-center text-gray-700">
            <MapPin className="w-5 h-5 text-gray-600 mr-2" />
            <span>定位：复旦大学（邯郸校区）</span>
          </div>
        </div>

        {/* 位置获取成功提示 */}
        {locationStatus === 'success' && location && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              <div>
                <h3 className="font-medium text-green-800">位置获取成功</h3>
                <p className="text-sm text-green-700">
                  已通过{locationMethod === 'amap' ? '高德地图' : '浏览器'}定位到您的位置
                  {accuracy && ` (精度: ${Math.round(accuracy)}米)`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 当前天气概览 */}
        {weatherData && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">当前天气</h2>
              <div className="flex items-center text-sm">
                <MapPin className="w-4 h-4 mr-1" />
                <div className="text-right">
                  <div className="text-gray-900">
                    {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : '获取位置中...'}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center">
                    {locationMethod === 'amap' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mr-2">
                        高德定位
                      </span>
                    )}
                    {locationMethod === 'browser' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                        浏览器定位
                      </span>
                    )}
                    {locationMethod === 'default' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mr-2">
                        复旦大学
                      </span>
                    )}
                    {accuracy && `精度: ${Math.round(accuracy)}m`}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                {getWeatherIcon(weatherData.condition)}
                <div className="ml-3">
                  <p className="text-sm text-gray-600">天气状况</p>
                  <p className="text-lg font-semibold text-gray-900">{weatherData.condition}</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-orange-50 rounded-lg">
                <Thermometer className="w-8 h-8 text-orange-500" />
                <div className="ml-3">
                  <p className="text-sm text-gray-600">温度</p>
                  <p className="text-lg font-semibold text-gray-900">{weatherData.temperature}°C</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-cyan-50 rounded-lg">
                <Droplets className="w-8 h-8 text-cyan-500" />
                <div className="ml-3">
                  <p className="text-sm text-gray-600">湿度</p>
                  <p className="text-lg font-semibold text-gray-900">{weatherData.humidity}%</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-green-50 rounded-lg">
                <Wind className="w-8 h-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm text-gray-600">风速</p>
                  <p className="text-lg font-semibold text-gray-900">{weatherData.windSpeed} km/h</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 推荐列表 */}
        <div className="space-y-4">
          {recommendations.map((recommendation) => (
            <div key={recommendation.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${getSuitabilityColor(recommendation.suitabilityScore)}`}>
                    {recommendation.suitabilityScore >= 0.8 ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : recommendation.suitabilityScore >= 0.6 ? (
                      <AlertTriangle className="w-6 h-6" />
                    ) : (
                      <AlertTriangle className="w-6 h-6" />
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{recommendation.title}</h3>
                    <p className="text-gray-600">{recommendation.description}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSuitabilityColor(recommendation.suitabilityScore)}`}>
                  {getSuitabilityText(recommendation.suitabilityScore)} ({Math.round(recommendation.suitabilityScore * 100)}%)
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 跑步建议 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Route className="w-4 h-4 mr-2 text-blue-500" />
                    跑步建议
                  </h4>
                  <ul className="space-y-1">
                    {recommendation.advice.map((item, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 最佳时间段 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-green-500" />
                    最佳时间段
                  </h4>
                  <div className="space-y-1">
                    {recommendation.bestTimeSlots.map((slot, index) => (
                      <span key={index} className="inline-block px-2 py-1 bg-green-50 text-green-700 rounded text-sm mr-2 mb-1">
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 推荐路线类型 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-purple-500" />
                    推荐路线类型
                  </h4>
                  <div className="space-y-1">
                    {recommendation.routeTypes.map((type, index) => (
                      <span key={index} className="inline-block px-2 py-1 bg-purple-50 text-purple-700 rounded text-sm mr-2 mb-1">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 注意事项 */}
              {recommendation.precautions.length > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    注意事项
                  </h4>
                  <ul className="space-y-1">
                    {recommendation.precautions.map((precaution, index) => (
                      <li key={index} className="text-sm text-yellow-700 flex items-start">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {precaution}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => navigate('/routes')}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Route className="w-4 h-4 mr-2" />
                  查看推荐路线
                </button>
                <button
                  onClick={() => navigate('/route-recommendation-settings')}
                  className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  个性化设置
                </button>
              </div>
            </div>
          ))}
        </div>


      </div>
    </div>
  );
};

export default WeatherRecommendation;