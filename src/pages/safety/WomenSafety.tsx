import React, { useState } from 'react';
import { 
  Heart, 
  Users, 
  MapPin, 
  Shield, 
  MessageCircle, 
  Star,
  Clock,
  Phone,
  AlertTriangle,
  Eye,
  UserPlus,
  Calendar,
  Navigation,
  Bell
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSafetyAnalysis } from '../../hooks/useSafetyAnalysis';
import { useLocationTracking } from '../../hooks/useLocationTracking';

interface RunningBuddy {
  id: string;
  name: string;
  avatar: string;
  age: number;
  experience: string;
  rating: number;
  location: string;
  preferredTime: string;
  isOnline: boolean;
  safetyScore: number;
}

interface SafeRoute {
  id: string;
  name: string;
  distance: string;
  difficulty: string;
  safetyRating: number;
  lighting: string;
  crowdLevel: string;
  lastUpdated: string;
  reviews: number;
  womenFriendly: boolean;
}

interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  replies: number;
  category: 'safety' | 'route' | 'experience' | 'emergency';
}

const WomenSafety: React.FC = () => {
  const { user } = useAuth();
  const { location: currentLocation } = useLocationTracking();
  const {
    currentSafetyScore,
    safetyRecommendations,
    bestRunningTimes,
    riskHotspots
  } = useSafetyAnalysis();

  const [activeTab, setActiveTab] = useState<'buddies' | 'routes' | 'community' | 'safety'>('safety');
  const [selectedBuddy, setSelectedBuddy] = useState<RunningBuddy | null>(null);

  // 模拟数据
  const runningBuddies: RunningBuddy[] = [
    {
      id: '1',
      name: '小雨',
      avatar: '👩‍🦰',
      age: 28,
      experience: '3年跑龄',
      rating: 4.8,
      location: '静安区',
      preferredTime: '早晨 6:00-8:00',
      isOnline: true,
      safetyScore: 95
    },
    {
      id: '2',
      name: '晓梅',
      avatar: '👩‍🦱',
      age: 32,
      experience: '5年跑龄',
      rating: 4.9,
      location: '黄浦区',
      preferredTime: '傍晚 18:00-20:00',
      isOnline: false,
      safetyScore: 92
    },
    {
      id: '3',
      name: '欣怡',
      avatar: '👩',
      age: 25,
      experience: '2年跑龄',
      rating: 4.7,
      location: '徐汇区',
      preferredTime: '早晨 7:00-9:00',
      isOnline: true,
      safetyScore: 88
    }
  ];

  const safeRoutes: SafeRoute[] = [
    {
      id: '1',
      name: '外滩滨江步道',
      distance: '5.2km',
      difficulty: '简单',
      safetyRating: 9.2,
      lighting: '优秀',
      crowdLevel: '适中',
      lastUpdated: '2小时前',
      reviews: 156,
      womenFriendly: true
    },
    {
      id: '2',
      name: '人民公园女性专用跑道',
      distance: '3.8km',
      difficulty: '简单',
      safetyRating: 9.5,
      lighting: '优秀',
      crowdLevel: '适中',
      lastUpdated: '1小时前',
      reviews: 89,
      womenFriendly: true
    },
    {
      id: '3',
      name: '静安雕塑公园环线',
      distance: '4.1km',
      difficulty: '中等',
      safetyRating: 8.7,
      lighting: '良好',
      crowdLevel: '适中',
      lastUpdated: '3小时前',
      reviews: 67,
      womenFriendly: true
    }
  ];

  const communityPosts: CommunityPost[] = [
    {
      id: '1',
      author: '跑步小仙女',
      avatar: '👩‍🦰',
      content: '今天早上在外滩跑步遇到了超级友善的跑友，大家一起跑完全程，感觉特别安全！推荐给姐妹们 💪',
      timestamp: '2小时前',
      likes: 24,
      replies: 8,
      category: 'experience'
    },
    {
      id: '2',
      author: '安全跑步达人',
      avatar: '👩‍🦱',
      content: '分享一个夜跑安全小贴士：一定要穿反光装备，选择人多的路段，最好和朋友一起。安全第一！',
      timestamp: '5小时前',
      likes: 45,
      replies: 12,
      category: 'safety'
    },
    {
      id: '3',
      author: '马拉松妈妈',
      avatar: '👩',
      content: '作为两个孩子的妈妈，我觉得这个女性专区真的很棒！可以放心地和其他妈妈们一起跑步，孩子们也有地方玩耍。',
      timestamp: '1天前',
      likes: 67,
      replies: 15,
      category: 'experience'
    }
  ];

  const getSafetyColor = (score: number) => {
    if (score >= 9) return 'text-green-600 bg-green-50';
    if (score >= 7) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'safety': return <Shield className="h-4 w-4" />;
      case 'route': return <MapPin className="h-4 w-4" />;
      case 'experience': return <Heart className="h-4 w-4" />;
      case 'emergency': return <AlertTriangle className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'safety': return 'bg-blue-100 text-blue-700';
      case 'route': return 'bg-green-100 text-green-700';
      case 'experience': return 'bg-purple-100 text-purple-700';
      case 'emergency': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const renderSafetyOverview = () => (
    <div className="space-y-6">
      {/* 当前安全状态 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Shield className="mr-2 text-pink-500" />
          女性专属安全状态
        </h3>
        
        {currentSafetyScore ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${getSafetyColor(currentSafetyScore.overall)}`}>
              <div className="text-2xl font-bold">{currentSafetyScore.overall.toFixed(1)}</div>
              <div className="text-sm">综合安全分数</div>
            </div>
            <div className={`p-4 rounded-lg ${getSafetyColor(currentSafetyScore.factors.timeOfDay)}`}>
              <div className="text-2xl font-bold">{currentSafetyScore.factors.timeOfDay.toFixed(1)}</div>
              <div className="text-sm">时间段安全</div>
            </div>
            <div className={`p-4 rounded-lg ${getSafetyColor(currentSafetyScore.factors.lighting)}`}>
              <div className="text-2xl font-bold">{currentSafetyScore.factors.lighting.toFixed(1)}</div>
              <div className="text-sm">位置安全</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            正在分析当前安全状况...
          </div>
        )}
      </div>

      {/* 女性专属安全建议 */}
      {safetyRecommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <Eye className="mr-2 text-purple-500" />
            女性安全建议
          </h3>
          
          <div className="space-y-3">
            {safetyRecommendations.slice(0, 3).map((recommendation, index) => (
              <div key={index} className="flex items-start p-3 bg-pink-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  {index + 1}
                </div>
                <div className="text-sm text-gray-700">{recommendation}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 最佳跑步时间 */}
      {bestRunningTimes.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <Clock className="mr-2 text-blue-500" />
            推荐跑步时间
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bestRunningTimes.slice(0, 3).map((time, index) => (
              <div key={time.timeSlot} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{time.description}</span>
                  <span className={`px-2 py-1 rounded text-sm ${getSafetyColor(time.safetyScore)}`}>
                    {time.safetyScore.toFixed(1)}分
                  </span>
                </div>
                {index === 0 && (
                  <div className="text-xs text-green-600 font-medium">推荐首选</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 紧急联系功能 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Phone className="mr-2 text-red-500" />
          紧急联系
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="flex items-center justify-center p-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
            <Phone className="mr-2 h-5 w-5" />
            一键求救
          </button>
          <button className="flex items-center justify-center p-4 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors">
            <Bell className="mr-2 h-5 w-5" />
            安全提醒
          </button>
        </div>
      </div>
    </div>
  );

  const renderRunningBuddies = () => (
    <div className="space-y-4">
      {runningBuddies.map((buddy) => (
        <div key={buddy.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-4xl mr-4">{buddy.avatar}</div>
              <div>
                <div className="flex items-center">
                  <h3 className="text-lg font-bold text-gray-800 mr-2">{buddy.name}</h3>
                  {buddy.isOnline && (
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {buddy.age}岁 • {buddy.experience} • {buddy.location}
                </div>
                <div className="flex items-center mt-1">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm text-gray-600">{buddy.rating}</span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className={`px-2 py-1 rounded text-xs ${getSafetyColor(buddy.safetyScore)}`}>
                    安全分数: {buddy.safetyScore}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-2">{buddy.preferredTime}</div>
              <button
                onClick={() => setSelectedBuddy(buddy)}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                <UserPlus className="h-4 w-4 mr-1 inline" />
                邀请同跑
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSafeRoutes = () => (
    <div className="space-y-4">
      {safeRoutes.map((route) => (
        <div key={route.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center">
                <h3 className="text-lg font-bold text-gray-800 mr-2">{route.name}</h3>
                {route.womenFriendly && (
                  <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">
                    女性友好
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {route.distance} • {route.difficulty} • {route.reviews}条评价
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-2xl font-bold ${getSafetyColor(route.safetyRating).split(' ')[0]} mb-1`}>
                {route.safetyRating}
              </div>
              <div className="text-xs text-gray-500">安全评分</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">照明条件</div>
              <div className="font-medium">{route.lighting}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">人流密度</div>
              <div className="font-medium">{route.crowdLevel}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">更新时间</div>
              <div className="font-medium">{route.lastUpdated}</div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              最后更新: {route.lastUpdated}
            </span>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              <Navigation className="h-4 w-4 mr-1 inline" />
              开始导航
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCommunity = () => (
    <div className="space-y-4">
      {communityPosts.map((post) => (
        <div key={post.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start">
            <div className="text-2xl mr-3">{post.avatar}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="font-medium text-gray-800 mr-2">{post.author}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(post.category)}`}>
                    {getCategoryIcon(post.category)}
                    <span className="ml-1">
                      {post.category === 'safety' ? '安全' :
                       post.category === 'route' ? '路线' :
                       post.category === 'experience' ? '经验' : '紧急'}
                    </span>
                  </span>
                </div>
                <span className="text-sm text-gray-500">{post.timestamp}</span>
              </div>
              
              <p className="text-gray-700 mb-3">{post.content}</p>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <button className="flex items-center hover:text-pink-600">
                  <Heart className="h-4 w-4 mr-1" />
                  {post.likes}
                </button>
                <button className="flex items-center hover:text-blue-600">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {post.replies}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <Heart className="mr-3 text-pink-500" />
            女性安全专区
          </h1>
          <p className="text-gray-600">
            专为女性跑友打造的安全跑步环境，提供专业的安全保障和社区支持
          </p>
        </div>

        {/* 标签页导航 */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="flex border-b border-gray-200">
            {[
              { key: 'safety', label: '安全监控', icon: Shield },
              { key: 'buddies', label: '跑步伙伴', icon: Users },
              { key: 'routes', label: '安全路线', icon: MapPin },
              { key: 'community', label: '女性社区', icon: MessageCircle }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium ${
                  activeTab === key
                    ? 'text-pink-600 border-b-2 border-pink-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            ))}
          </div>
          
          <div className="p-6">
            {activeTab === 'safety' && renderSafetyOverview()}
            {activeTab === 'buddies' && renderRunningBuddies()}
            {activeTab === 'routes' && renderSafeRoutes()}
            {activeTab === 'community' && renderCommunity()}
          </div>
        </div>

        {/* 邀请跑步伙伴弹窗 */}
        {selectedBuddy && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                邀请 {selectedBuddy.name} 一起跑步
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    跑步时间
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    跑步路线
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500">
                    <option>外滩女性专用跑道</option>
                    <option>人民公园安全环线</option>
                    <option>静安雕塑公园女性路线</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    留言
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    rows={3}
                    placeholder="想对她说些什么..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setSelectedBuddy(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    // 发送邀请逻辑
                    setSelectedBuddy(null);
                  }}
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
                >
                  发送邀请
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WomenSafety;