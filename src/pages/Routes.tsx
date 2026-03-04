import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Clock, Star, Sparkles, Brain, Loader2, Settings, History, ThumbsUp, ThumbsDown, Heart, Navigation, Eye, Users, TrendingUp, Award, Cloud, Thermometer, ChevronDown, ChevronUp, Zap, Target, Mountain, Shield, Play, Save, Share2, RefreshCw, ArrowRight } from 'lucide-react';
import { routeRecommendationService } from '../services/routeRecommendationService';
import { useAuthStore } from '../store/authStore';
import { RouteRecommendation, RecommendationResponse } from '../types/routeRecommendation';
import { RouteData, WaypointData } from '../types/map';
import { RouteAgent } from '../components/ai/agents/RouteAgent';
import IntelligentRunningMap from '../components/map/IntelligentRunningMap';
// import { toast } from 'sonner';
import { LocationService } from '../services/locationService';
import { RecommendationEngine, createRecommendationEngine } from '../services/recommendationEngine';
import { RouteRecommendationService } from '../services/routeRecommendationService';
import { fetchCurrentWeather, getWeatherSuitabilityScore, getRunningAdvice, WeatherData } from '../services/weatherService';
// import { IntelligentRouteService } from '../services/intelligentRouteService';
// import { toast } from 'sonner';
import { UnifiedGPSAIService } from "../services/unified/UnifiedGPSAIService";

interface Route {
  id: string;
  name: string;
  distance: number;
  duration: string;
  difficulty: 'easy' | 'medium' | 'hard';
  rating: number;
  reviews: number;
  description: string;
  highlights: string[];
  image: string;
  location: string;
  elevation: number;
  popularity: number;
  tags: string[];
  startPoint?: [number, number];
  endPoint?: [number, number];
  coordinates?: [number, number][];
}

const Routes: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showMapView, setShowMapView] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number, address: string} | null>(null);

  // 模拟路线数据
  const routes: Route[] = [
    {
      id: '1',
      name: '外滩滨江步道',
      distance: 3.2,
      duration: '25-30分钟',
      difficulty: 'easy',
      rating: 4.8,
      reviews: 1234,
      description: '沿着黄浦江畔的经典跑步路线，可以欣赏到外滩万国建筑群和陆家嘴天际线的美景。',
      highlights: ['江景', '夜景', '历史建筑', '平坦路面'],
      image: '/pictures/02e87f718b7dd727e33b83978a991d0c.jpg',
      location: '外滩',
      elevation: 5,
      popularity: 95,
      tags: ['观光', '夜跑', '初学者友好'],
      startPoint: [121.4944, 31.2397],
      endPoint: [121.4956, 31.2403],
      coordinates: [
        [121.4944, 31.2397], // 外滩源
        [121.4950, 31.2400], // 外滩18号
        [121.4952, 31.2401], // 和平饭店
        [121.4954, 31.2402], // 外滩中心
        [121.4956, 31.2403]  // 十六铺码头
      ]
    },
    {
      id: '2',
      name: '世纪公园环湖路线',
      distance: 5.0,
      duration: '35-40分钟',
      difficulty: 'medium',
      rating: 4.6,
      reviews: 892,
      description: '围绕世纪公园湖泊的环形跑步路线，绿树成荫，空气清新，是晨跑的绝佳选择。',
      highlights: ['湖景', '绿化', '空气清新', '环形路线'],
      image: '/pictures/50f6f14614f17403c4b0d29d4af743e1.jpg',
      location: '浦东新区',
      elevation: 15,
      popularity: 88,
      tags: ['公园', '晨跑', '环湖'],
      startPoint: [121.5569, 31.2196],
      endPoint: [121.5569, 31.2196],
      coordinates: [
        [121.5569, 31.2196], // 世纪公园1号门
        [121.5580, 31.2200], // 湖心岛
        [121.5590, 31.2190], // 樱花园
        [121.5585, 31.2180], // 音乐喷泉
        [121.5575, 31.2185], // 梅花园
        [121.5565, 31.2190], // 牡丹园
        [121.5569, 31.2196]  // 回到起点
      ]
    },
    {
      id: '3',
      name: '复旦大学校园环线',
      distance: 2.8,
      duration: '20-25分钟',
      difficulty: 'easy',
      rating: 4.4,
      reviews: 456,
      description: '穿越复旦大学校园的文化跑步路线，感受百年学府的历史文化底蕴。',
      highlights: ['校园风光', '历史建筑', '文化氛围', '安全路线'],
      image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=300&fit=crop',
      location: '杨浦区',
      elevation: 8,
      popularity: 75,
      tags: ['校园', '文化', '安全'],
      startPoint: [121.5033, 31.2989],
      endPoint: [121.5033, 31.2989],
      coordinates: [
        [121.5033, 31.2989], // 复旦大学正门
        [121.5040, 31.2995], // 光华楼
        [121.5045, 31.3000], // 图书馆
        [121.5035, 31.3005], // 相辉堂
        [121.5025, 31.3000], // 燕园
        [121.5020, 31.2995], // 体育馆
        [121.5033, 31.2989]  // 回到正门
      ]
    },
    {
      id: '4',
      name: '中山公园樱花大道',
      distance: 4.2,
      duration: '30-35分钟',
      difficulty: 'medium',
      rating: 4.6,
      reviews: 689,
      description: '春季樱花盛开时的浪漫跑步路线，四季皆有不同的自然美景。',
      highlights: ['樱花', '四季美景', '浪漫', '摄影胜地'],
      image: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=300&fit=crop',
      location: '长宁区',
      elevation: 12,
      popularity: 82,
      tags: ['赏花', '摄影', '浪漫'],
      startPoint: [121.4222, 31.2231],
      endPoint: [121.4222, 31.2231],
      coordinates: [
        [121.4222, 31.2231], // 中山公园正门
        [121.4230, 31.2240], // 樱花大道入口
        [121.4235, 31.2245], // 樱花林
        [121.4240, 31.2250], // 观景台
        [121.4235, 31.2255], // 荷花池
        [121.4225, 31.2250], // 竹林小径
        [121.4215, 31.2240], // 梅园
        [121.4222, 31.2231]  // 回到正门
      ]
    },
    {
      id: '5',
      name: '陆家嘴金融城环线',
      distance: 6.5,
      duration: '45-50分钟',
      difficulty: 'hard',
      rating: 4.4,
      reviews: 658,
      description: '穿梭在摩天大楼间的都市跑步路线，感受上海现代化金融中心的脉搏。',
      highlights: ['摩天大楼', '都市风光', '现代化', '挑战性'],
      image: 'https://images.unsplash.com/photo-1548919973-5cef591cdbc9?w=400&h=300&fit=crop',
      location: '浦东新区',
      elevation: 25,
      popularity: 78,
      tags: ['都市', '挑战', '金融区'],
      startPoint: [121.5057, 31.2396],
      endPoint: [121.5057, 31.2396],
      coordinates: [
        [121.5057, 31.2396], // 东方明珠
        [121.5070, 31.2410], // 上海中心大厦
        [121.5080, 31.2420], // 环球金融中心
        [121.5075, 31.2430], // 金茂大厦
        [121.5065, 31.2425], // 国际金融中心
        [121.5055, 31.2415], // 正大广场
        [121.5045, 31.2405], // 滨江大道
        [121.5050, 31.2395], // 陆家嘴中心绿地
        [121.5057, 31.2396]  // 回到东方明珠
      ]
    },
    {
      id: '6',
      name: '新天地历史文化路线',
      distance: 3.8,
      duration: '28-32分钟',
      difficulty: 'medium',
      rating: 4.6,
      reviews: 689,
      description: '结合历史与现代的文化跑步路线，体验上海独特的石库门建筑风情。',
      highlights: ['石库门', '历史文化', '现代艺术', '特色建筑'],
      image: '/pictures/bcf977b7626b697615b6c98027c929e0.jpg',
      location: '黄浦区',
      elevation: 10,
      popularity: 85,
      tags: ['历史', '文化', '建筑'],
      startPoint: [121.4737, 31.2190],
      endPoint: [121.4737, 31.2190],
      coordinates: [
        [121.4737, 31.2190], // 新天地北里
        [121.4745, 31.2200], // 石库门博物馆
        [121.4750, 31.2205], // 太平桥公园
        [121.4745, 31.2210], // 新天地南里
        [121.4740, 31.2205], // 中共一大会址
        [121.4735, 31.2200], // 马当路
        [121.4730, 31.2195], // 淮海中路
        [121.4737, 31.2190]  // 回到北里
      ]
    },
    {
      id: '7',
      name: '徐家汇公园绿道',
      distance: 4.0,
      duration: '30-35分钟',
      difficulty: 'easy',
      rating: 4.5,
      reviews: 543,
      description: '城市中的绿色氧吧，宽敞的绿道和丰富的植被让跑步成为享受。',
      highlights: ['绿色氧吧', '宽敞绿道', '植被丰富', '空气清新'],
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
      location: '徐汇区',
      elevation: 18,
      popularity: 80,
      tags: ['绿道', '氧吧', '植被'],
      startPoint: [121.4368, 31.1886],
      endPoint: [121.4368, 31.1886],
      coordinates: [
        [121.4368, 31.1886], // 徐家汇公园正门
        [121.4375, 31.1895], // 湿地花园
        [121.4380, 31.1900], // 儿童乐园
        [121.4375, 31.1905], // 健身广场
        [121.4370, 31.1910], // 观鸟台
        [121.4365, 31.1905], // 竹林步道
        [121.4360, 31.1900], // 荷花池
        [121.4365, 31.1890], // 梅花坡
        [121.4368, 31.1886]  // 回到正门
      ]
    }
  ];

  const filters = [
    { id: 'all', label: '全部', icon: Target },
    { id: 'easy', label: '简单', icon: Heart },
    { id: 'medium', label: '中等', icon: Mountain },
    { id: 'hard', label: '困难', icon: Shield },
    { id: 'popular', label: '热门', icon: TrendingUp },
    { id: 'scenic', label: '风景', icon: Eye }
  ];

  // 筛选路线
  const filteredRoutes = useMemo(() => {
    let filtered = routes;

    // 搜索筛选
    if (searchTerm) {
      filtered = filtered.filter(route =>
        route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 分类筛选
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(route => {
        switch (selectedFilter) {
          case 'easy':
          case 'medium':
          case 'hard':
            return route.difficulty === selectedFilter;
          case 'popular':
            return route.popularity >= 90;
          case 'scenic':
            return route.tags.includes('观光') || route.highlights.some(h => h.includes('景'));
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [searchTerm, selectedFilter]);

  const handleRouteSelect = (route: Route) => {
    navigate(`/route/${route.id}`);
  };

const handleCloseMapView = () => {
  setShowMapView(false);
  setSelectedRoute(null);
};

return (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
      {/* 头部 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">路线推荐</h1>
            <p className="text-gray-600">发现上海最佳跑步路线</p>
          </div>
        </div>
      </div>
  
      {/* 搜索和筛选 */}
      <div className="bg-white rounded-lg lg:rounded-xl shadow-sm p-4 lg:p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索路线名称、地点或标签..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            <Filter className="w-5 h-5 mr-2" />
            高级筛选
          </button>
        </div>
  
        {/* 筛选器 */}
        <div className="flex flex-wrap gap-2 mt-4">
          {filters.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === filter.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>
  
      {/* 功能按钮 */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setShowMapView(!showMapView)}
          className={`flex items-center px-4 py-2 rounded-lg transition-all ${
            showMapView 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <MapPin className="w-5 h-5 mr-2" />
          {showMapView ? '隐藏地图' : '显示地图'}
        </button>
        
        {/* AI智能路线推荐按钮 - 新颖设计 */}
        <button
          onClick={() => navigate('/ai/route-recommendation')}
          className="relative flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-lg hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <div className="flex items-center relative">
            <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
            <Brain className="w-5 h-5 mr-2" />
            <span className="font-semibold mr-2">AI智能路线推荐</span>
            <div className="absolute -top-1 -right-6 w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
          </div>
          <div className="ml-2 text-xs opacity-80">
            NEW
          </div>
        </button>
        
        <button
          onClick={() => navigate('/weather-recommendation')}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-md hover:shadow-lg"
        >
          <Cloud className="w-5 h-5 mr-2" />
          智能天气推荐
        </button>
      </div>
  
  
  
        {/* 地图视图 */}
        {showMapView && (
          <div className="bg-white rounded-lg lg:rounded-xl shadow-sm mb-6 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedRoute ? `路线预览: ${selectedRoute.name}` : '路线规划地图'}
                </h3>
              </div>
              <button
                onClick={handleCloseMapView}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="h-64 sm:h-80 lg:h-96">
              <IntelligentRunningMap
                mode="planning"
                initialCenter={
                  userLocation ? [userLocation.longitude, userLocation.latitude] : 
                  [121.4737, 31.2304]
                }
                initialZoom={13}
                enableRouteOptimization={true}
                enableSafetyAnalysis={true}
                enableVoiceNavigation={false}
                onRouteGenerated={(route) => console.log('路线生成:', route)}
                onWaypointAdded={(waypoint) => console.log('添加路点:', waypoint)}
                onError={(error) => console.error('地图错误:', error)}
                className="w-full h-full"
                height="100%"
                width="100%"
              />
            </div>
          </div>
        )}
  
        {/* 路线列表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRoutes.map((route) => (
            <div key={route.id} className="bg-white rounded-lg lg:rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={route.image} 
                  alt={route.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // 如果图片加载失败，显示渐变背景
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.classList.add('bg-gradient-to-br', 'from-blue-400', 'to-purple-500');
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="absolute top-4 left-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                    route.difficulty === 'easy' ? 'bg-green-500' :
                    route.difficulty === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}>
                    {route.difficulty === 'easy' ? '简单' :
                     route.difficulty === 'medium' ? '中等' : '困难'}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-lg font-semibold mb-1">{route.name}</h3>
                  <p className="text-sm opacity-90">{route.location}</p>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="text-sm font-medium">{route.rating}</span>
                    <span className="text-sm text-gray-500 ml-1">({route.reviews})</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    {route.duration}
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{route.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-semibold text-gray-900">
                    {route.distance}km
                  </div>
                  <div className="text-sm text-gray-500">
                    海拔 {route.elevation}m
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {route.highlights.slice(0, 3).map((highlight, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {highlight}
                    </span>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleRouteSelect(route)}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    查看详情
                  </button>
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Heart className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRoutes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">未找到匹配的路线</h3>
            <p className="text-gray-600">尝试调整搜索条件或筛选器</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Routes;