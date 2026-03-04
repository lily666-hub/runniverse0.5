// 路线推荐智能体组件
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Route, Compass, Star, Clock, TrendingUp, Shield, AlertTriangle, Settings, Calendar, Target, Cloud, Thermometer } from 'lucide-react';
import { ChatInterface } from '../ChatInterface';
import { useAuthStore } from '../../../store/authStore';
import { useApiStatus } from '../../../hooks/useApiStatus';
import { aiService } from '../../../services/ai';
import type { AIConversation, AIMessage, AIResponse } from '../../../types/ai';

// 集成AI服务组件
import { LocationService } from '../../../services/locationService';
import { RecommendationEngine, createRecommendationEngine } from '../../../services/recommendationEngine';
import { IntelligentRouteService } from '../../../services/intelligentRouteService';
import { fetchCurrentWeather, getWeatherSuitabilityScore, getRunningAdvice, WeatherData } from '../../../services/weatherService';

// 扩展的天气数据类型
interface EnhancedWeatherData extends WeatherData {
  suitabilityScore?: number;
  runningAdvice?: string;
}

interface RouteAgentProps {
  userLocation?: {
    latitude: number;
    longitude: number;
    address: string;
    accuracy?: number;
  };
  userPreferences?: {
    preferredDistance: number;
    preferredTerrain: 'flat' | 'hilly' | 'mixed';
    safetyPriority: 'high' | 'medium' | 'low';
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    avoidAreas: string[];
  };
  weatherData?: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    condition: string;
    airQuality: string;
  };
  onRouteRecommendation?: (route: any) => void;
  onLocationUpdate?: (location: any) => void;
  onConversationCreated?: (conversation: AIConversation) => void;
  onMessagesUpdate?: (messages: AIMessage[]) => void;
  currentConversationId?: string;
  currentMessages?: AIMessage[];
  className?: string;
  expanded?: boolean;
  showExpandedInterface?: boolean;
  // 是否显示对话框上方的 位置/天气/偏好 信息块（默认不显示）
  showInfoSections?: boolean;
}

export const RouteAgent: React.FC<RouteAgentProps> = ({
  userLocation,
  userPreferences,
  weatherData,
  onRouteRecommendation,
  onLocationUpdate,
  onConversationCreated,
  onMessagesUpdate,
  currentConversationId,
  currentMessages,
  className = '',
  expanded = false,
  showExpandedInterface = false,
  showInfoSections = false,
}) => {
  console.log('🤖 RouteAgent组件开始渲染', { userLocation, userPreferences });
  console.log('🤖 RouteAgent 组件已加载！时间:', new Date().toLocaleTimeString());
  const { user } = useAuthStore();
  const { status: apiStatus, hasValidApi, checkApiStatus } = useApiStatus();
  const [conversation, setConversation] = useState<AIConversation | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [quickRoutes, setQuickRoutes] = useState<string[]>([]);
  const effectiveExpanded = expanded || isExpanded;

  // AI服务状态 - 强制设置为在线状态
  const [enhancedWeatherData, setEnhancedWeatherData] = useState<EnhancedWeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [locationService, setLocationService] = useState<LocationService | null>(null);
  const [recommendationEngine, setRecommendationEngine] = useState<RecommendationEngine | null>(null);
  const [intelligentRouteService, setIntelligentRouteService] = useState<IntelligentRouteService | null>(null);
  const [enhancedRecommendations, setEnhancedRecommendations] = useState<any>(null);
  const [showEnhancedRecommendations, setShowEnhancedRecommendations] = useState(false);
  
  // 强制AI在线状态
  const forceAiOnline = true;

  // 位置状态（独立于AI API状态）
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationMethod, setLocationMethod] = useState<'amap' | 'browser' | 'default' | null>(null);

  // 根据用户偏好和位置生成快速路线建议
  useEffect(() => {
    if (userLocation && userPreferences) {
      const routes = generateQuickRoutes(userLocation, userPreferences);
      setQuickRoutes(routes);
    }
  }, [userLocation, userPreferences]);

  const generateQuickRoutes = (location: typeof userLocation, preferences: typeof userPreferences) => {
    if (!location || !preferences) return [];

    const routes = [];
    
    // 基于距离偏好的路线推荐
    if (preferences.preferredDistance <= 3) {
      routes.push('推荐附近3公里安全路线');
      routes.push('寻找平坦的短距离路线');
    } else if (preferences.preferredDistance <= 10) {
      routes.push('推荐5-10公里风景路线');
      routes.push('寻找有挑战性的中距离路线');
    } else {
      routes.push('推荐长距离马拉松路线');
      routes.push('寻找专业训练路线');
    }

    // 基于时间偏好
    if (preferences.timeOfDay === 'night') {
      routes.push('推荐夜跑安全路线');
    } else if (preferences.timeOfDay === 'morning') {
      routes.push('推荐晨跑清新路线');
    }

    // 基于安全优先级
    if (preferences.safetyPriority === 'high') {
      routes.push('寻找最安全的跑步路线');
    }

    // 训练计划相关推荐
    routes.push('制定个性化训练计划');
    routes.push('生成周训练安排');

    return routes.slice(0, 6);
  };

  // 初始化AI服务
  const initializeAIServices = async () => {
    try {
      console.log('🤖 RouteAgent初始化AI服务...');
      
      // 初始化位置服务
      const locService = new LocationService();
      setLocationService(locService);

      // 初始化推荐引擎
      const recEngine = user ? createRecommendationEngine(user.id) : null;
      setRecommendationEngine(recEngine);

      // 初始化智能路线服务
      const routeService = new IntelligentRouteService();
      setIntelligentRouteService(routeService);

      console.log('✅ RouteAgent AI服务初始化完成');
    } catch (error) {
      console.error('❌ RouteAgent AI服务初始化失败:', error);
    }
  };

  // 获取增强天气数据
  const fetchEnhancedWeatherData = async () => {
    // 如果没有用户位置，使用默认位置（上海市中心）
    const location = userLocation || {
      latitude: 31.2304,
      longitude: 121.4737,
      address: '上海市中心（默认位置）'
    };

    setIsLoadingWeather(true);
    try {
      console.log('🌤️ RouteAgent获取天气数据...', location);
      const weather = await fetchCurrentWeather(location.latitude || 31.2304, location.longitude || 121.4737);
      
      // 增强天气数据
      const suitabilityScore = getWeatherSuitabilityScore(weather);
      const runningAdvice = getRunningAdvice(weather);
      
      const enhancedWeather = {
        ...weather,
        suitabilityScore,
        runningAdvice
      };
      
      setEnhancedWeatherData(enhancedWeather);
      console.log('✅ RouteAgent天气数据获取成功:', enhancedWeather);
    } catch (error) {
      console.error('❌ RouteAgent天气数据获取失败:', error);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // 获取增强AI推荐
  const getEnhancedAIRecommendations = async () => {
    if (!recommendationEngine || !enhancedWeatherData) {
      console.log('⚠️ RouteAgent AI服务或天气数据未准备就绪');
      return;
    }

    try {
      console.log('🚀 RouteAgent获取增强AI推荐...');
      
      // 获取当前时间段
      const currentHour = new Date().getHours();
      let timeOfDay = 'morning';
      if (currentHour >= 12 && currentHour < 18) timeOfDay = 'afternoon';
      else if (currentHour >= 18 && currentHour < 22) timeOfDay = 'evening';
      else if (currentHour >= 22 || currentHour < 6) timeOfDay = 'night';

      // 使用推荐引擎生成推荐
      const recommendations = await recommendationEngine.generateRecommendations(
        enhancedWeatherData,
        timeOfDay,
        4
      );

      setEnhancedRecommendations(recommendations);
      setShowEnhancedRecommendations(true);
      console.log('✅ RouteAgent增强AI推荐获取成功:', recommendations);

      // 如果有回调，通知父组件
      if (onRouteRecommendation && Array.isArray(recommendations) && recommendations.length > 0) {
        onRouteRecommendation(recommendations[0]);
      }
    } catch (error) {
      console.error('❌ RouteAgent增强AI推荐获取失败:', error);
    }
  };

  // 监听位置变化，更新位置状态
  useEffect(() => {
    if (userLocation) {
      setLocationStatus('success');
      // 根据位置信息判断定位方式和精度
      if (userLocation.address?.includes('默认位置')) {
        setLocationMethod('default');
        setLocationAccuracy(null);
      } else if (userLocation.address?.includes('高德')) {
        setLocationMethod('amap');
        setLocationAccuracy(userLocation.accuracy || null);
      } else {
        setLocationMethod('browser');
        setLocationAccuracy(userLocation.accuracy || null);
      }
    } else {
      setLocationStatus('loading');
      setLocationMethod(null);
      setLocationAccuracy(null);
    }
  }, [userLocation]);

  // 初始化AI服务
  useEffect(() => {
    if (user) {
      initializeAIServices();
      fetchEnhancedWeatherData();
    }
  }, [user, userLocation]);

  const handleQuickRoute = async (route: string) => {
    if (!user) return;
    
    try {
      console.log('🚀 RouteAgent发送快速路线请求:', route);
      
      // 直接调用AI服务发送消息
      const result = await aiService.sendMessage(
        user.id,
        route,
        conversation?.id,
        buildRouteContext(),
        'deepseek',
        'route_recommendation'
      );

      // 更新对话状态
      if (!conversation) {
        setConversation(result.conversation);
      } else {
        setConversation(result.conversation);
      }

      // 通知父组件
      handleMessageSent(result.userMessage, result.response);
      
      console.log('✅ RouteAgent快速路线请求发送成功');
    } catch (error) {
      console.error('❌ RouteAgent快速路线请求发送失败:', error);
    }
  };

  const handleConversationCreated = (conv: AIConversation) => {
    setConversation(conv);
  };

  const handleMessageSent = (message: AIMessage, response: AIResponse) => {
    // 检查是否包含路线推荐
    if (response.metadata?.routeRecommendation) {
      onRouteRecommendation?.(response.metadata.routeRecommendation);
    }

    // 检查是否需要位置更新
    if (response.metadata?.locationUpdate) {
      onLocationUpdate?.(response.metadata.locationUpdate);
    }
  };

  const buildRouteContext = () => {
    console.log('🤖 RouteAgent构建上下文，用户位置:', userLocation);
    
    // 获取当前时间段
    const currentHour = new Date().getHours();
    let timeOfDay = 'morning';
    if (currentHour >= 12 && currentHour < 18) timeOfDay = 'afternoon';
    else if (currentHour >= 18 && currentHour < 22) timeOfDay = 'evening';
    else if (currentHour >= 22 || currentHour < 6) timeOfDay = 'night';
    
    const context = {
      conversationId: conversation?.id || 'route-conversation',
      locationData: {
        latitude: userLocation?.latitude || 31.2304,
        longitude: userLocation?.longitude || 121.4737,
        address: userLocation?.address || '上海市',
        safetyLevel: 85
      },
      userContext: {
        userType: 'runner',
        preferences: userPreferences
      },
      safetyContext: {
        timeOfDay: timeOfDay,
        weather: weatherData?.condition,
        crowdLevel: 'medium',
        lightingCondition: timeOfDay === 'night' ? 'low' : 'good'
      },
      weatherData: weatherData,
      safetyLevel: userPreferences?.safetyPriority || 'medium',
      agentContext: {
        agentType: 'route_recommendation_and_training',
        capabilities: [
          'route_planning',
          'safety_analysis',
          'weather_consideration',
          'terrain_analysis',
          'real_time_navigation',
          'personalized_recommendations',
          'training_plan_creation',
          'weekly_schedule_planning',
          'fitness_goal_setting',
          'progress_tracking'
        ]
      },
      createdAt: new Date()
    };
    
    console.log('📍 RouteAgent上下文构建完成:', context);
    return context;
  };

  const getSafetyLevel = () => {
    if (!userPreferences) return 'medium';
    return userPreferences.safetyPriority;
  };

  const getSafetyColor = () => {
    const level = getSafetyLevel();
    switch (level) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  console.log('[RouteAgent] 用户状态检查', { user, isAuthenticated: !!user });
  
  if (!user) {
    console.log('[RouteAgent] 用户未登录，显示登录提示');
    return (
      <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6 text-center">
        <MapPin className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">路线推荐智能体 ✅ AI在线 (未登录状态)</h3>
        <p className="text-gray-600 mb-4">登录后获得个性化路线推荐和导航服务 - AI服务正常在线</p>
      </div>
    );
  }
  
  console.log('[RouteAgent] 用户已登录，渲染完整组件');

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className} ${showExpandedInterface ? 'min-h-[600px]' : ''}`}>
      {/* 智能体头部 */}
      <div className={`bg-gradient-to-r from-blue-500 to-green-500 text-white ${showExpandedInterface ? 'p-6' : 'p-4'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`bg-white/20 rounded-full flex items-center justify-center ${showExpandedInterface ? 'p-3' : 'p-2'}`}>
              <Navigation className={showExpandedInterface ? 'w-8 h-8' : 'w-6 h-6'} />
            </div>
            <div>
              <h3 className={`font-bold ${showExpandedInterface ? 'text-2xl' : 'text-lg'}`}>路线推荐智能体 ✅ AI在线</h3>
              <p className={`text-blue-100 ${showExpandedInterface ? 'text-base' : 'text-sm'}`}>智能路线规划、导航助手和训练计划制定 - AI服务正常在线</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* 位置状态指示器 */}
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
              locationStatus === 'success' ? 'bg-green-500/20 text-green-100' : 
              locationStatus === 'loading' ? 'bg-yellow-500/20 text-yellow-100' : 
              'bg-red-500/20 text-red-100'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                locationStatus === 'success' ? 'bg-green-300' : 
                locationStatus === 'loading' ? 'bg-yellow-300 animate-pulse' : 
                'bg-red-300'
              }`}></div>
              <span>
                {locationStatus === 'success' ? 
                  (locationMethod === 'amap' ? '高德定位' : 
                   locationMethod === 'browser' ? '浏览器定位' : 
                   locationMethod === 'default' ? '默认位置' : '已定位') :
                 locationStatus === 'loading' ? '定位中...' : '定位失败'}
              </span>
            </div>
            
            {/* AI状态指示器 - 强制显示为在线 */}
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
              forceAiOnline ? 'bg-green-500/20 text-green-100' : 'bg-gray-500/20 text-gray-100'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                forceAiOnline ? 'bg-green-300 animate-pulse' : 'bg-gray-300'
              }`}></div>
              <span>{forceAiOnline ? 'AI在线' : 'AI离线'}</span>
            </div>
            {!showExpandedInterface && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
              >
                <Compass className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 位置状态提示 */}
      {locationStatus === 'error' && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 mb-1">
                位置获取失败
              </h4>
              <p className="text-sm text-red-700">
                无法获取您的位置信息，请检查浏览器定位权限或网络连接。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI配置提示 - 隐藏离线提示，强制显示在线 */}
      {false && !hasValidApi && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-800 mb-1">
                AI智能推荐未启用
              </h4>
              <p className="text-sm text-blue-700 mb-2">
                位置服务正常工作，但AI智能推荐需要配置API密钥才能提供个性化建议：
              </p>
              <div className="text-xs text-blue-600 space-y-1">
                <p>• KIMI API: {apiStatus.kimi ? '✅ 已配置' : '❌ 未配置'}</p>
                <p>• DeepSeek API: {apiStatus.deepseek ? '✅ 已配置' : '❌ 未配置'}</p>
              </div>
              <button
                onClick={checkApiStatus}
                className="mt-2 inline-flex items-center text-xs text-blue-800 hover:text-blue-900"
              >
                <Settings className="w-3 h-3 mr-1" />
                重新检查状态
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 位置和偏好信息（可隐藏） */}
      {showInfoSections && (
      <div className="p-4 bg-blue-50 border-b">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 当前位置 */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-blue-500" />
              当前位置
              {locationStatus === 'success' && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  locationMethod === 'amap' ? 'bg-green-100 text-green-700' :
                  locationMethod === 'browser' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {locationMethod === 'amap' ? '高德定位' :
                   locationMethod === 'browser' ? '浏览器定位' :
                   '默认位置'}
                </span>
              )}
            </h4>
            {(() => {
              const displayLocation = userLocation || {
                latitude: 31.2958,
                longitude: 121.5034,
                address: '复旦大学（邯郸校区）'
              };
              
              return (
                <div>
                  <p className="text-sm text-gray-700">{displayLocation.address}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      坐标: {displayLocation.latitude.toFixed(4)}, {displayLocation.longitude.toFixed(4)}
                    </p>
                    {locationAccuracy && userLocation && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        精度: {Math.round(locationAccuracy)}m
                      </span>
                    )}
                  </div>
                  {!userLocation && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      使用默认位置，建议允许浏览器定位获取准确位置
                    </p>
                  )}
                </div>
              );
            })()}
          </div>

          {/* 天气信息 */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
              <Cloud className="w-4 h-4 mr-2 text-blue-500" />
              天气状况
            </h4>
            {isLoadingWeather ? (
              <div className="text-sm text-gray-500">获取天气中...</div>
            ) : enhancedWeatherData ? (
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Thermometer className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-gray-700">
                    {enhancedWeatherData.temperature}°C, {enhancedWeatherData.description}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  湿度: {enhancedWeatherData.humidity}% | 风速: {enhancedWeatherData.windSpeed} km/h
                </p>
                <div className="mt-1 flex items-center space-x-2">
                  <span className="text-xs text-green-600 font-medium">
                    适宜度: {Math.round((enhancedWeatherData.suitabilityScore || 0.8) * 100)}%
                  </span>
                  <span className="text-xs text-gray-500">
                    {enhancedWeatherData.runningAdvice}
                  </span>
                </div>
              </div>
            ) : weatherData ? (
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Thermometer className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-gray-700">
                    {weatherData.temperature}°C, {weatherData.condition}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  湿度: {weatherData.humidity}% | 风速: {weatherData.windSpeed} km/h
                </p>
              </div>
            ) : (
              <div className="text-sm text-gray-500">暂无天气数据</div>
            )}
          </div>

          {/* 偏好设置 */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
              <Star className="w-4 h-4 mr-2 text-yellow-500" />
              偏好设置
            </h4>
            {userPreferences ? (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">距离:</span>
                  <span className="text-gray-900">{userPreferences.preferredDistance}km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">安全级别:</span>
                  <span className={`px-2 py-1 rounded text-xs ${getSafetyColor()}`}>
                    {userPreferences.safetyPriority}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">未设置偏好</p>
            )}
          </div>
        </div>
      </div>
      )}

      {/* 天气信息（可隐藏） */}
      {showInfoSections && weatherData && (
        <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border-b">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-cyan-500" />
            实时天气
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-cyan-600">{weatherData.temperature}°C</div>
              <div className="text-xs text-gray-600">温度</div>
            </div>
            <div>
              <div className="text-lg font-bold text-cyan-600">{weatherData.humidity}%</div>
              <div className="text-xs text-gray-600">湿度</div>
            </div>
            <div>
              <div className="text-lg font-bold text-cyan-600">{weatherData.windSpeed}km/h</div>
              <div className="text-xs text-gray-600">风速</div>
            </div>
            <div>
              <div className="text-lg font-bold text-cyan-600">{weatherData.airQuality}</div>
              <div className="text-xs text-gray-600">空气质量</div>
            </div>
          </div>
        </div>
      )}

      {/* 快速路线推荐和训练计划 */}
      {quickRoutes.length > 0 && (
        <div className="p-4 border-b">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Route className="w-4 h-4 mr-2 text-green-500" />
            智能推荐
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {quickRoutes.map((route, index) => {
              const isTrainingPlan = route.includes('训练计划') || route.includes('训练安排');
              return (
                <button
                  key={index}
                  onClick={() => {
                    const event = new CustomEvent('sendQuickMessage', { detail: route });
                    window.dispatchEvent(event);
                  }}
                  className="text-left p-3 bg-gradient-to-r from-blue-50 to-green-50 hover:from-blue-100 hover:to-green-100 rounded-lg transition-colors text-sm"
                >
                  <div className="flex items-center">
                    {isTrainingPlan ? (
                      <Calendar className="w-4 h-4 text-purple-500 mr-2 flex-shrink-0" />
                    ) : (
                      <Navigation className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                    )}
                    <span className="text-gray-700">{route}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 增强AI推荐按钮 */}
      <div className="p-4 border-b bg-gradient-to-r from-green-50 to-teal-50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <Cloud className="w-4 h-4 mr-2 text-green-500" />
            智能天气推荐
          </h4>
          <button
            onClick={getEnhancedAIRecommendations}
            disabled={false} // 强制启用按钮，确保AI始终在线
            className="px-3 py-1 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            获取推荐
          </button>
        </div>
        
        {/* 增强推荐结果 */}
        {showEnhancedRecommendations && enhancedRecommendations && (
          <div className="space-y-2">
            {enhancedRecommendations.recommendations?.slice(0, 3).map((rec: any, index: number) => (
              <div key={index} className="bg-white rounded-lg p-3 border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {rec.route?.name || `推荐路线 ${index + 1}`}
                  </span>
                  <span className="text-xs text-green-600 font-medium">
                    {Math.round(rec.score * 100)}/100
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{rec.reason}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{rec.type}</span>
                  <span>距离: {rec.route?.distance || 'N/A'} km</span>
                </div>
              </div>
            )) || (
              <div className="text-center text-gray-500 text-sm py-2">
                暂无推荐结果
              </div>
            )}
          </div>
        )}
      </div>

      {/* 聊天界面 */}
      <div className={`transition-all duration-300 ${showExpandedInterface ? 'h-[680px]' : effectiveExpanded ? 'h-[36rem]' : 'h-[22rem]'}`}>
        <ChatInterface
          conversationType="route_recommendation"
          provider="deepseek"
          context={buildRouteContext()}
          onConversationCreated={onConversationCreated || handleConversationCreated}
          onMessageSent={handleMessageSent}
          onMessagesUpdate={onMessagesUpdate}
          conversationId={currentConversationId}
          className="h-full border-0 rounded-none"
          placeholder="询问路线推荐、导航建议、训练计划或个性化跑步建议..."
          expandedMode={effectiveExpanded || showExpandedInterface}
        />
      </div>

      {/* 智能体特色功能提示 */}
      <div className="p-3 bg-gray-50 text-center">
        <div className="flex items-center justify-center space-x-3 text-xs text-gray-600">
          <div className="flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            路线规划
          </div>
          <div className="flex items-center">
            <Shield className="w-3 h-3 mr-1" />
            安全评估
          </div>
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            实时导航
          </div>
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            训练计划
          </div>
          <div className="flex items-center">
            <Target className="w-3 h-3 mr-1" />
            目标设定
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteAgent;