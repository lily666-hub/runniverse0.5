import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Clock, TrendingUp, Star, Heart, Share2, Navigation, Users, Tag, Eye, Sparkles, Cloud } from 'lucide-react';
import { Route } from '../types/route';
import LazyImage from '../components/LazyImage';
import '../styles/route-library.css';
import { getRouteImageById } from '../utils/imageResources';

const RouteLibrary: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // 模拟路线数据（统一图片来源通过 id 映射）
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
      image: getRouteImageById('1'),
      location: '外滩',
      elevation: 5,
      popularity: 95,
      tags: ['观光', '夜跑', '初学者友好'],
      startPoint: [121.4944, 31.2397],
      endPoint: [121.4956, 31.2403],
      coordinates: [
        [121.4944, 31.2397],
        [121.4950, 31.2400],
        [121.4952, 31.2401],
        [121.4954, 31.2402],
        [121.4956, 31.2403]
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
      image: getRouteImageById('2'),
      location: '浦东新区',
      elevation: 15,
      popularity: 88,
      tags: ['公园', '晨跑', '环湖'],
      startPoint: [121.5569, 31.2196],
      endPoint: [121.5569, 31.2196],
      coordinates: [
        [121.5569, 31.2196],
        [121.5580, 31.2200],
        [121.5590, 31.2190],
        [121.5585, 31.2180],
        [121.5575, 31.2185],
        [121.5565, 31.2190],
        [121.5569, 31.2196]
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
      image: getRouteImageById('3'),
      location: '杨浦区',
      elevation: 8,
      popularity: 75,
      tags: ['校园', '文化', '安全'],
      startPoint: [121.5033, 31.2989],
      endPoint: [121.5033, 31.2989],
      coordinates: [
        [121.5033, 31.2989],
        [121.5040, 31.2995],
        [121.5045, 31.3000],
        [121.5035, 31.3005],
        [121.5025, 31.3000],
        [121.5020, 31.2995],
        [121.5033, 31.2989]
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
      image: getRouteImageById('4'),
      location: '长宁区',
      elevation: 12,
      popularity: 82,
      tags: ['赏花', '摄影', '浪漫'],
      startPoint: [121.4222, 31.2231],
      endPoint: [121.4222, 31.2231],
      coordinates: [
        [121.4222, 31.2231],
        [121.4230, 31.2240],
        [121.4235, 31.2245],
        [121.4240, 31.2250],
        [121.4235, 31.2255],
        [121.4225, 31.2250],
        [121.4215, 31.2240],
        [121.4222, 31.2231]
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
      image: getRouteImageById('5'),
      location: '浦东新区',
      elevation: 25,
      popularity: 78,
      tags: ['都市', '挑战', '金融区'],
      startPoint: [121.5057, 31.2396],
      endPoint: [121.5057, 31.2396],
      coordinates: [
        [121.5057, 31.2396],
        [121.5070, 31.2410],
        [121.5080, 31.2420],
        [121.5075, 31.2430],
        [121.5065, 31.2425],
        [121.5055, 31.2415],
        [121.5045, 31.2405],
        [121.5050, 31.2395],
        [121.5057, 31.2396]
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
      image: getRouteImageById('6'),
      location: '黄浦区',
      elevation: 10,
      popularity: 85,
      tags: ['历史', '文化', '建筑'],
      startPoint: [121.4736, 31.2222],
      endPoint: [121.4736, 31.2222],
      coordinates: [
        [121.4736, 31.2222],
        [121.4740, 31.2225],
        [121.4745, 31.2230],
        [121.4750, 31.2235],
        [121.4745, 31.2240],
        [121.4740, 31.2245],
        [121.4735, 31.2240],
        [121.4736, 31.2222]
      ]
    }
  ];

  const filteredRoutes = useMemo(() => {
    return routes.filter(route => {
      const matchesSearch = route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           route.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           route.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = selectedFilter === 'all' || route.difficulty === selectedFilter;
      
      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, selectedFilter]);

  const toggleFavorite = (routeId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(routeId)) {
        newFavorites.delete(routeId);
      } else {
        newFavorites.add(routeId);
      }
      return newFavorites;
    });
  };

  const handleViewDetails = (routeId: string) => {
    document.body.style.transition = 'opacity 300ms ease-in-out';
    document.body.style.opacity = '0.8';
    setTimeout(() => {
      navigate(`/route/${routeId}`);
      document.body.style.opacity = '1';
    }, 150);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return '未知';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部搜索和筛选区域 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">路线库</h1>
              <p className="text-gray-600">发现上海最美的跑步路线</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              {/* AI智能路线推荐入口 */}
              <button
                onClick={() => navigate('/ai/route-recommendation')}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-lg hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 transition-all shadow-md"
              >
                <span className="flex items-center"><Sparkles className="w-4 h-4 mr-1" /><span className="font-semibold">AI智能路线推荐</span></span>
              </button>

              {/* 智能天气推荐入口 */}
              <button
                onClick={() => navigate('/weather-recommendation')}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-md"
              >
                <Cloud className="w-4 h-4 mr-1" /> 智能天气推荐
              </button>
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜索路线、地点或标签..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80"
                />
              </div>
              
              {/* 筛选器 */}
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部难度</option>
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 路线卡片网格 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoutes.map((route) => (
            <div
              key={route.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group route-card"
            >
              {/* 路线图片 */}
                <div className="relative h-48 overflow-hidden">
                  <LazyImage
                    src={route.image}
                    alt={route.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    placeholder="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop"
                  />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => toggleFavorite(route.id)}
                    className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                      favorites.has(route.id) 
                        ? 'bg-red-500 text-white' 
                        : 'bg-white/80 text-gray-600 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${favorites.has(route.id) ? 'fill-current' : ''}`} />
                  </button>
                  <button className="p-2 rounded-full bg-white/80 text-gray-600 hover:bg-white backdrop-blur-sm transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
                
                {/* 难度标签 */}
                <div className="absolute bottom-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(route.difficulty)}`}>
                    {getDifficultyText(route.difficulty)}
                  </span>
                </div>
              </div>

              {/* 路线信息 */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {route.name}
                  </h3>
                  <div className="flex items-center text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="ml-1 text-sm font-medium">{route.rating}</span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {route.description}
                </p>

                {/* 路线详情 */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{route.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{route.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Navigation className="w-4 h-4" />
                    <span>{route.distance}km</span>
                  </div>
                </div>

                {/* 标签 */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {route.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 查看详情按钮 */}
                <button
                  onClick={() => handleViewDetails(route.id)}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-md"
                >
                  <Eye className="w-4 h-4" />
                  查看详情
                </button>

                {/* 开始导航按钮（位于“查看详情”按钮下方）*/}
                <button
                  onClick={() => navigate(`/route/${route.id}/navigation`)}
                  className="mt-3 w-full bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  开始导航
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredRoutes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">未找到相关路线</h3>
            <p className="text-gray-600">尝试调整搜索条件或筛选器</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteLibrary;