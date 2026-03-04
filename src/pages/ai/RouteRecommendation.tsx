import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Sparkles, 
  MapPin, 
  MessageCircle,
  ArrowLeft,
  Route,
  Target,
  Compass,
  Star,
  TrendingUp,
  Clock,
  Mountain,
  Navigation,
  History,
  Menu,
  X,
  Settings,
  RefreshCw
} from 'lucide-react';
import { RouteAgent } from '../../components/ai/agents/RouteAgent';
import ChatHistory, { ChatHistoryItem } from '../../components/ai/ChatHistory';
import type { AIMessage } from '../../types/ai';
import { useAuthStore } from '../../store/authStore';
import { useGeolocation } from '../../hooks/useGeolocation';

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export const RouteRecommendation: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { location, error: locationError } = useGeolocation();
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number, address: string} | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string>('');
  const [currentMessages, setCurrentMessages] = useState<AIMessage[]>([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState(true); // 默认显示历史对话栏
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const chatHistoryRef = React.useRef<any>(null);

  // 复旦大学邯郸校区默认位置
  const FUDAN_DEFAULT_LOCATION = {
    latitude: 31.2977,
    longitude: 121.5053,
    address: '复旦大学邯郸校区'
  };

  useEffect(() => {
    if (location) {
      setUserLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        address: '当前位置'
      });
    } else {
      // 当GPS定位失败或未授权时，使用复旦大学邯郸校区作为默认位置
      setUserLocation(FUDAN_DEFAULT_LOCATION);
    }
  }, [location]);

  // 处理消息更新，保存到历史记录
  const handleMessagesUpdate = (messages: AIMessage[]) => {
    setCurrentMessages(messages);
    if (messages.length > 0 && chatHistoryRef.current) {
      const conversationId = currentConversationId || `route_${Date.now()}`;
      if (!currentConversationId) {
        setCurrentConversationId(conversationId);
      }
      chatHistoryRef.current.addOrUpdateHistory(conversationId, messages);
    }
  };

  // 处理对话创建
  const handleConversationCreated = (conversation: any) => {
    setCurrentConversationId(conversation.id);
  };

  // 选择历史对话
  const handleSelectHistory = (history: ChatHistoryItem) => {
    setCurrentConversationId(history.id);
    setCurrentMessages(history.messages);
  };

  // 切换历史面板
  const toggleHistoryPanel = () => {
    setShowHistoryPanel(!showHistoryPanel);
  };

  // 切换信息面板
  const toggleInfoPanel = () => {
    setShowInfoPanel(!showInfoPanel);
  };

  const features: FeatureCard[] = [
    {
      id: 'smart-analysis',
      title: '智能路线分析',
      description: '基于您的跑步数据和偏好，AI为您推荐最适合的路线',
      icon: <Brain className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'real-time-adaptation',
      title: '实时路线调整',
      description: '根据天气、交通和您的实时状态动态调整推荐',
      icon: <Compass className="w-6 h-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'difficulty-matching',
      title: '难度智能匹配',
      description: '结合您的体能水平和训练目标，推荐合适难度的路线',
      icon: <Mountain className="w-6 h-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'scenic-routes',
      title: '风景路线推荐',
      description: '发现城市中最美的跑步路线，让每次跑步都是视觉享受',
      icon: <Star className="w-6 h-6" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">AI智能路线推荐</h2>
          <p className="text-gray-600 mb-6">请先登录以使用AI路线推荐功能</p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            立即登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-y-auto">
      {/* 顶部横幅 - 紫色渐变横幅 */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center">
          <div className="relative mr-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
              <Sparkles className="w-2 h-2 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-white font-bold text-2xl mb-1">AI智能推荐</h1>
            <p className="text-white/90 text-sm">基于人工智能的个性化路线推荐系统</p>
          </div>
        </div>
        <div className="flex items-center space-x-6 text-white/90 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>AI驱动</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>实时推荐</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>个性化服务</span>
          </div>
        </div>
      </div>

      {/* 左上角浮窗：位置、偏好、天气信息 - 保持不变 */}
      {showInfoPanel && (
        <div className="fixed top-20 left-4 z-50 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 w-80 max-h-[calc(100vh-6rem)] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">跑步信息</h3>
            <button
              onClick={toggleInfoPanel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {/* 当前位置 */}
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">当前位置</h4>
                <p className="text-sm text-gray-700 truncate">{userLocation?.address || '获取位置中...'}</p>
                <p className="text-xs text-gray-500">
                  坐标: {userLocation ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}` : '--'}
                </p>
                {locationError && (
                  <p className="text-xs text-orange-500 flex items-center mt-1">
                    <Navigation className="w-3 h-3 mr-1" />
                    使用默认位置，建议允许浏览器定位获取准确位置
                  </p>
                )}
              </div>
            </div>

            {/* 偏好设置 */}
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">偏好设置</h4>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">距离:</span>
                    <span className="text-xs font-medium text-gray-900">5km</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">安全级别:</span>
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">high</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 天气状况 */}
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Compass className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">天气状况</h4>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-orange-100 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    </div>
                    <span className="text-xs text-gray-700">21°C，多云</span>
                  </div>
                  <p className="text-xs text-gray-500">湿度: 68% | 风速: 18 km/h</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600">适宜度:</span>
                    <span className="text-xs text-green-600 font-medium">72%</span>
                    <span className="text-xs text-gray-600">舒适的跑步天气</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 信息面板切换按钮（当面板关闭时显示） */}
      {!showInfoPanel && (
        <button
          onClick={toggleInfoPanel}
          className="fixed top-20 left-4 z-50 bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all"
          title="显示跑步信息"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      )}

      {/* AI顾问对话框 - 占据整个页面高度（100vh） */}
      <div className="h-[calc(100vh-80px)] flex flex-col overflow-hidden">
        {/* 顶部导航 - 固定在对话框顶部 */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between z-20 flex-shrink-0">
          <button
            onClick={() => navigate('/routes')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回路线库
          </button>
          <button
            onClick={toggleHistoryPanel}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <History className="w-5 h-5 mr-2" />
            {showHistoryPanel ? '隐藏历史' : '显示历史'}
          </button>
        </div>

        {/* AI顾问对话框主体 - 最大化高度 */}
        <div className="flex-1 flex bg-white shadow-xl overflow-hidden">
          {/* 对话框主体内容 - 左右分栏布局 */}
          <div className="flex-1 flex min-h-0">
            {/* 左侧：对话区域 - 占据剩余空间 */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 p-4 overflow-y-auto">
                <RouteAgent 
                  userLocation={userLocation}
                  userPreferences={{
                    preferredDistance: 5,
                    preferredTerrain: 'mixed',
                    safetyPriority: 'high',
                    timeOfDay: 'morning',
                    avoidAreas: []
                  }}
                  onLocationUpdate={(location) => {
                    console.log('位置更新:', location);
                    setUserLocation(location);
                  }}
                  onConversationCreated={handleConversationCreated}
                  onMessagesUpdate={handleMessagesUpdate}
                  currentConversationId={currentConversationId}
                  currentMessages={currentMessages}
                  className="h-full"
                  expanded={true}
                  showInfoSections={false}
                />
              </div>
            </div>
            
            {/* 右侧：历史对话栏 - 作为对话框的一部分，宽度350px */}
            {showHistoryPanel && (
              <div className="w-80 xl:w-96 border-l border-gray-200 bg-gray-50 flex flex-col flex-shrink-0">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white flex-shrink-0">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <History className="w-5 h-5 mr-2 text-purple-600" />
                    历史对话
                  </h3>
                  <button
                    onClick={() => setShowHistoryPanel(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <ChatHistory
                    ref={chatHistoryRef}
                    onSelectHistory={handleSelectHistory}
                    currentConversationId={currentConversationId}
                    conversationType="route_recommendation"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RouteRecommendation;