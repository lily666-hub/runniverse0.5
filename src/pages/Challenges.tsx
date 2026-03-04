import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Calendar, Users, Target, Clock, MapPin, Star, Medal, Flame, TrendingUp, Award, ChevronRight, Play, Pause, Brain, Sparkles, Zap, Loader2 } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'distance' | 'time' | 'frequency' | 'speed';
  target: number;
  unit: string;
  duration: string;
  participants: number;
  reward: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'upcoming' | 'active' | 'completed';
  progress?: number;
  startDate: string;
  endDate: string;
  image: string;
  tags: string[];
}

const Challenges: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'completed'>('active');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // 处理开始挑战按钮点击
  const handleStartChallenge = (challengeId: string) => {
    console.log('开始挑战:', challengeId);
    // 显示加载动画
    setIsLoading(true);
    
    // 模拟300ms的加载动画
    setTimeout(() => {
      setIsLoading(false);
      // 跳转到挑战进度页面
      navigate(`/challenge-progress/${challengeId}`);
    }, 300);
  };

  // 处理继续挑战按钮点击
  const handleContinueChallenge = (challengeId: string) => {
    console.log('继续挑战:', challengeId);
    // 显示加载动画
    setIsLoading(true);
    
    // 模拟300ms的加载动画
    setTimeout(() => {
      setIsLoading(false);
      // 跳转到挑战进度页面
      navigate(`/challenge-progress/${challengeId}`);
    }, 300);
  };

  // 处理详情按钮点击
  const handleViewDetails = (challengeId: string) => {
    navigate(`/challenge-detail/${challengeId}`);
  };

  const challenges: Challenge[] = [
    {
      id: '1',
      title: '春季马拉松挑战',
      description: '在春季完成一次全程马拉松，感受春天的活力与美好。',
      type: 'distance',
      target: 42.195,
      unit: 'km',
      duration: '30天',
      participants: 1256,
      reward: '马拉松完赛奖牌',
      difficulty: 'hard',
      status: 'active',
      progress: 65,
      startDate: '2024-03-01',
      endDate: '2024-03-31',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Spring%20marathon%20challenge%20running%20event%20with%20cherry%20blossoms&image_size=landscape_4_3',
      tags: ['马拉松', '春季', '长距离']
    },
    {
      id: '2',
      title: '每日5K挑战',
      description: '连续30天每天跑步5公里，养成良好的运动习惯。',
      type: 'frequency',
      target: 30,
      unit: '天',
      duration: '30天',
      participants: 3421,
      reward: '坚持者徽章',
      difficulty: 'medium',
      status: 'active',
      progress: 80,
      startDate: '2024-03-01',
      endDate: '2024-03-31',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Daily%205K%20running%20challenge%20urban%20park%20setting&image_size=landscape_4_3',
      tags: ['日常', '5K', '习惯养成']
    },
    {
      id: '3',
      title: '速度突破挑战',
      description: '在5公里跑步中突破个人最佳成绩，挑战自己的极限。',
      type: 'speed',
      target: 25,
      unit: '分钟',
      duration: '14天',
      participants: 892,
      reward: '速度之星称号',
      difficulty: 'hard',
      status: 'active',
      progress: 45,
      startDate: '2024-03-15',
      endDate: '2024-03-29',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Speed%20running%20challenge%20track%20and%20field%20athletic&image_size=landscape_4_3',
      tags: ['速度', '5K', '个人突破']
    },
    {
      id: '4',
      title: '夜跑探索挑战',
      description: '探索城市夜晚的美丽，完成10次夜跑活动。',
      type: 'frequency',
      target: 10,
      unit: '次',
      duration: '21天',
      participants: 567,
      reward: '夜跑探索者徽章',
      difficulty: 'easy',
      status: 'upcoming',
      startDate: '2024-04-01',
      endDate: '2024-04-21',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Night%20running%20challenge%20city%20lights%20urban%20exploration&image_size=landscape_4_3',
      tags: ['夜跑', '城市探索', '轻松']
    },
    {
      id: '5',
      title: '百公里月度挑战',
      description: '在一个月内累计跑步100公里，挑战你的耐力极限。',
      type: 'distance',
      target: 100,
      unit: 'km',
      duration: '30天',
      participants: 2134,
      reward: '百公里勇士奖牌',
      difficulty: 'medium',
      status: 'completed',
      progress: 100,
      startDate: '2024-02-01',
      endDate: '2024-02-29',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=100km%20monthly%20running%20challenge%20endurance%20achievement&image_size=landscape_4_3',
      tags: ['月度', '100K', '耐力']
    },
    // 新增：测试期望的挑战条目
    {
      id: '6',
      title: '新手挑战',
      description: '适合初学者的跑步挑战',
      type: 'distance',
      target: 3,
      unit: 'km',
      duration: '14天',
      participants: 456,
      reward: '新手徽章',
      difficulty: 'easy',
      status: 'active',
      progress: 20,
      startDate: '2024-03-10',
      endDate: '2024-03-24',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Beginner%20running%20challenge&image_size=landscape_4_3',
      tags: ['新手', '跑步']
    },
    {
      id: '7',
      title: '5公里跑步挑战',
      description: '完成一次5公里跑步',
      type: 'distance',
      target: 5,
      unit: 'km',
      duration: '7天',
      participants: 789,
      reward: '5K徽章',
      difficulty: 'medium',
      status: 'active',
      progress: 40,
      startDate: '2024-03-05',
      endDate: '2024-03-12',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=5km%20running%20challenge%20park%20route&image_size=landscape_4_3',
      tags: ['5K', '训练']
    },
    {
      id: '8',
      title: '10公里耐力挑战',
      description: '提升耐力完成10公里',
      type: 'distance',
      target: 10,
      unit: 'km',
      duration: '21天',
      participants: 321,
      reward: '耐力徽章',
      difficulty: 'medium',
      status: 'upcoming',
      startDate: '2024-04-05',
      endDate: '2024-04-26',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=10km%20endurance%20running%20challenge%20city%20park&image_size=landscape_4_3',
      tags: ['耐力', '10K']
    },
    {
      id: '9',
      title: '30分钟持续跑步',
      description: '连续跑步30分钟',
      type: 'time',
      target: 30,
      unit: '分钟',
      duration: '7天',
      participants: 555,
      reward: '时间掌控者',
      difficulty: 'easy',
      status: 'active',
      progress: 60,
      startDate: '2024-03-01',
      endDate: '2024-03-08',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=30%20minutes%20continuous%20running%20challenge&image_size=landscape_4_3',
      tags: ['时间', '耐力']
    }
  ];

  const categories = [
    { id: 'all', label: '全部', icon: Target },
    { id: 'distance', label: '距离', icon: MapPin },
    { id: 'time', label: '时间', icon: Clock },
    { id: 'frequency', label: '频次', icon: Calendar },
    { id: 'speed', label: '速度', icon: TrendingUp },
  ];

  const tabs = [
    { id: 'active', label: '进行中', count: challenges.filter(c => c.status === 'active').length },
    { id: 'upcoming', label: '即将开始', count: challenges.filter(c => c.status === 'upcoming').length },
    { id: 'completed', label: '已完成', count: challenges.filter(c => c.status === 'completed').length },
  ];

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'upcoming': return 'text-orange-600 bg-orange-100';
      case 'completed': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '进行中';
      case 'upcoming': return '即将开始';
      case 'completed': return '已完成';
      default: return '未知';
    }
  };

  const filteredChallenges = challenges.filter(challenge => {
    const matchesCategory = selectedCategory === 'all' || challenge.type === selectedCategory;
    return matchesCategory;
  });

  const stats = [
    { label: '参与挑战', value: '8', icon: Target, color: 'text-blue-500' },
    { label: '完成挑战', value: '5', icon: Trophy, color: 'text-yellow-500' },
    { label: '获得奖牌', value: '12', icon: Medal, color: 'text-purple-500' },
    { label: '连续天数', value: '23', icon: Flame, color: 'text-red-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 加载动画 */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">正在跳转到挑战页面...</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        {/* 头部 */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">挑战竞赛</h1>
          <p className="text-gray-600">参与挑战，突破自我，获得荣誉</p>
        </div>

        {/* AI挑战推荐助手 */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/ai/challenge-recommendation')}
            className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-600 text-white rounded-xl lg:rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group relative overflow-hidden"
          >
            {/* 背景动画效果 */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* 装饰性光点 */}
            <div className="absolute top-4 right-4 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
            <div className="absolute top-8 right-8 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-300"></div>
            <div className="absolute bottom-6 left-6 w-1.5 h-1.5 bg-white/25 rounded-full animate-pulse delay-700"></div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-colors duration-300">
                    <Brain className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Sparkles className="w-2.5 h-2.5 text-yellow-800" />
                  </div>
                </div>
                
                <div className="text-left">
                  <h3 className="text-lg lg:text-xl font-bold text-white mb-1 group-hover:text-yellow-100 transition-colors duration-300">
                    AI挑战推荐助手
                  </h3>
                  <p className="text-white/80 text-sm lg:text-base group-hover:text-white/90 transition-colors duration-300">
                    智能挑战推荐 · 个性化竞赛方案 · 专业训练指导
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-300 animate-pulse" />
                <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </div>
            
            {/* 底部装饰条 */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-pink-400 to-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* 虚拟竞赛 */}
        <div className="mb-6">
          <button
            // 直接跳转到静态页面 5.1.html
            onClick={() => { window.location.href = '/5.1.html'; }}
            className="w-full bg-gradient-to-r from-red-600 via-red-500 to-rose-500 hover:from-red-700 hover:via-red-600 hover:to-rose-600 text-white rounded-xl lg:rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group relative overflow-hidden"
          >
            {/* 背景动画效果（红色系） */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 via-red-400/20 to-rose-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* 装饰性光点（红色主题）*/}
            <div className="absolute top-4 right-4 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
            <div className="absolute top-8 right-8 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-300"></div>
            <div className="absolute bottom-6 left-6 w-1.5 h-1.5 bg-white/25 rounded-full animate-pulse delay-700"></div>

            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-colors duration-300">
                    {/* 使用火焰图标以体现竞赛热度 */}
                    <Flame className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Sparkles className="w-2.5 h-2.5 text-yellow-800" />
                  </div>
                </div>

                <div className="text-left">
                  <h3 className="text-lg lg:text-xl font-bold text-white mb-1 group-hover:text-yellow-100 transition-colors duration-300">
                    虚拟竞赛
                  </h3>
                  <p className="text-white/80 text-sm lg:text-base group-hover:text-white/90 transition-colors duration-300">
                    在线虚拟赛事 · 灵活参与 · 即时体验
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* 右侧采用红色闪电以保持一致的动效语言 */}
                <Zap className="w-5 h-5 lg:w-6 lg:h-6 text-red-200 animate-pulse" />
                <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </div>

            {/* 底部装饰条（红色系）*/}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-300 via-pink-400 to-rose-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* 统计数据 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg lg:rounded-xl p-4 lg:p-6 text-center shadow-sm">
                <Icon className={`h-6 w-6 lg:h-8 lg:w-8 ${stat.color} mx-auto mb-2 lg:mb-3`} />
                <p className="text-lg lg:text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-xs lg:text-sm text-gray-600">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* 标签页 */}
        <div className="bg-white rounded-lg lg:rounded-xl shadow-sm mb-6 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-4 py-4 text-sm font-medium text-center border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* 分类筛选 */}
          <div className="p-4 lg:p-6">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 挑战列表 */}
        <div className="space-y-4 lg:space-y-6">
          {filteredChallenges.map((challenge) => (
            <div key={challenge.id} className="bg-white rounded-lg lg:rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="lg:flex">
                {/* 挑战图片 */}
                <div className="lg:w-80 h-48 lg:h-auto relative">
                  <img
                    src={challenge.image}
                    alt={challenge.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                      {getDifficultyText(challenge.difficulty)}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(challenge.status)}`}>
                      {getStatusText(challenge.status)}
                    </span>
                  </div>
                </div>

                {/* 挑战信息 */}
                <div className="flex-1 p-4 lg:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">{challenge.title}</h3>
                      <p className="text-gray-600 text-sm lg:text-base mb-4">{challenge.description}</p>
                      
                      {/* 挑战目标 */}
                      <div className="flex items-center mb-4">
                        <Target className="w-5 h-5 text-blue-500 mr-2" />
                        <span className="text-sm text-gray-600">
                          目标: <span className="font-medium text-gray-900">{challenge.target} {challenge.unit}</span>
                        </span>
                      </div>

                      {/* 进度条 (仅对进行中和已完成的挑战显示) */}
                      {(challenge.status === 'active' || challenge.status === 'completed') && challenge.progress !== undefined && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">完成进度</span>
                            <span className="text-sm font-medium text-gray-900">{challenge.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${challenge.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* 标签 */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {challenge.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 右侧信息 */}
                    <div className="lg:ml-6 lg:text-right">
                      <div className="flex lg:flex-col items-center lg:items-end space-x-4 lg:space-x-0 lg:space-y-3 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-1" />
                          {challenge.participants} 人参与
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-1" />
                          {challenge.duration}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Award className="w-4 h-4 mr-1" />
                          {challenge.reward}
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex lg:flex-col space-x-3 lg:space-x-0 lg:space-y-2">
                        {challenge.status === 'upcoming' && (
                          <button
                            onClick={() => handleStartChallenge(challenge.id)}
                            className="flex-1 lg:flex-none bg-gradient-to-r from-[#FF5722] to-[#FF7043] hover:from-[#E64A19] hover:to-[#FF5722] text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg whitespace-nowrap"
                          >
                            <Calendar className="w-5 h-5" />
                            <span>开始挑战</span>
                          </button>
                        )}
                        {challenge.status === 'active' && (
                          <button 
                            onClick={() => handleContinueChallenge(challenge.id)}
                            className="flex-1 lg:flex-none bg-gradient-to-r from-[#FF5722] to-[#FF7043] hover:from-[#E64A19] hover:to-[#FF5722] text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg whitespace-nowrap"
                          >
                            <Play className="w-5 h-5" />
                            <span>继续挑战</span>
                          </button>
                        )}
                        {challenge.status === 'completed' && (
                          <button className="flex-1 lg:flex-none bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 cursor-not-allowed opacity-75">
                            <Trophy className="w-4 h-4" />
                            <span>已完成</span>
                          </button>
                        )}
                        <button 
                          onClick={() => handleViewDetails(challenge.id)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                        >
                          详情
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 空状态 */}
        {filteredChallenges.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无挑战</h3>
            <p className="text-gray-600">当前分类下没有找到相关挑战</p>
          </div>
        )}

        {/* 底部提示 */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg lg:rounded-xl p-4 lg:p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Star className="w-6 h-6 text-blue-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-900">挑战小贴士</h3>
              <p className="text-sm text-blue-700 mt-1">
                参与挑战不仅能提升你的跑步能力，还能获得专属奖牌和称号。记得设定合理的目标，循序渐进！
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Challenges;