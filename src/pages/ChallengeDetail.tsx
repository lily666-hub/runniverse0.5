import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Trophy, Calendar, Users, Target, Clock, MapPin, Star, Medal, 
  Flame, TrendingUp, Award, ChevronLeft, Play, Share2, Heart,
  BarChart3, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

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
  detailedDescription?: string;
  rules?: string[];
  tips?: string[];
}

const ChallengeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isJoined, setIsJoined] = useState(false);

  // 模拟挑战数据
  const challengesData: Challenge[] = [
    {
      id: '1',
      title: '春季马拉松挑战',
      description: '在春季完成一次全程马拉松，感受春天的活力与美好。',
      detailedDescription: '春季马拉松挑战是一个为期30天的长距离跑步挑战。参与者需要在挑战期间完成一次完整的42.195公里马拉松距离。这个挑战不仅测试你的耐力和毅力，更是一次与春天美景的完美邂逅。',
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
      tags: ['马拉松', '春季', '长距离'],
      rules: [
        '必须在30天内完成42.195公里的跑步距离',
        '可以分多次完成，但每次跑步距离不少于5公里',
        '需要上传跑步记录和GPS轨迹作为证明',
        '挑战期间至少要有3次不同路线的跑步记录'
      ],
      tips: [
        '建议制定循序渐进的训练计划',
        '注意跑步前的热身和跑步后的拉伸',
        '选择合适的跑鞋和运动装备',
        '保持充足的水分补充',
        '如有身体不适请立即停止并咨询医生'
      ]
    },
    {
      id: '2',
      title: '每日5K挑战',
      description: '连续30天每天跑步5公里，养成良好的运动习惯。',
      detailedDescription: '每日5K挑战旨在帮助跑步爱好者建立稳定的运动习惯。通过连续30天每天5公里的跑步，不仅能提升身体素质，更能培养坚持不懈的品质。',
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
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Daily%205K%20running%20challenge%20urban%20park%20morning%20jog&image_size=landscape_4_3',
      tags: ['日常', '5K', '习惯养成'],
      rules: [
        '每天必须完成至少5公里的跑步',
        '连续30天不能中断',
        '需要记录每日跑步数据',
        '可以选择不同的路线和时间'
      ],
      tips: [
        '选择固定的跑步时间有助于养成习惯',
        '可以寻找跑步伙伴一起参与',
        '记录跑步心情和感受',
        '适当调整跑步强度，避免过度疲劳'
      ]
    },
    {
      id: '3',
      title: '速度突破挑战',
      description: '在5公里跑步中突破个人最佳成绩，挑战自己的极限。',
      detailedDescription: '该挑战专注于提升速度与配速控制。在14天内通过间歇跑、节奏跑与爬坡训练等方法，力争在5公里距离上刷新个人最佳成绩。',
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
      tags: ['速度', '5K', '个人突破'],
      rules: [
        '在挑战期内完成至少6次速度训练（间歇跑/节奏跑）',
        '每周至少进行一次配速测试（3-5公里）',
        '保留跑步记录与心率数据以评估训练效果',
        '尝试在挑战末期进行一次5公里全力冲刺测试'
      ],
      tips: [
        '间歇跑时注意充分热身与冷身',
        '配速训练以可持续的节奏为主，避免过度疲劳',
        '适当加入力量训练提升跑步经济性',
        '保证睡眠与营养摄入，提升恢复质量'
      ]
    },
    {
      id: '4',
      title: '夜跑探索挑战',
      description: '探索城市夜晚的美丽，完成10次夜跑活动。',
      detailedDescription: '为期21天的夜跑主题挑战，参与者需在安全路线和合适时段开展夜跑探索，体验城市夜景，同时提升跑步的趣味性与持续性。',
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
      tags: ['夜跑', '城市探索', '轻松'],
      rules: [
        '挑战期间完成10次有效夜跑（≥20分钟）',
        '选择安全路线，尽量结伴夜跑',
        '佩戴反光或发光装备提升可见性',
        '记录路线与时间，避免深夜与偏僻区域'
      ],
      tips: [
        '夜跑优先选择灯光良好、人流较多的区域',
        '穿戴反光配件并携带简易照明工具',
        '注意补水与保暖，视天气适当调整',
        '提前告知家人或朋友跑步计划'
      ]
    },
    {
      id: '5',
      title: '百公里月度挑战',
      description: '在一个月内累计跑步100公里，挑战你的耐力极限。',
      detailedDescription: '连续一个月进行有计划的里程累积训练，通过稳步推进与适当恢复，在月度总里程达到100公里，提升心肺耐力与跑步稳定性。',
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
      tags: ['月度', '100K', '耐力'],
      rules: [
        '30天内累计跑步里程达到100公里',
        '每周建议至少进行一次长距离跑（≥10公里）',
        '合理安排轻松跑与恢复日，避免过度训练',
        '记录每次跑步的距离与时间'
      ],
      tips: [
        '采用递进式里程计划，逐步增加周跑量',
        '长距离跑前补充碳水，跑后及时恢复',
        '注意跑鞋磨损与足部护理',
        '根据身体反馈适时调整训练强度'
      ]
    },
    {
      id: '6',
      title: '新手挑战',
      description: '适合初学者的跑步挑战',
      detailedDescription: '为跑步初学者设计的循序渐进挑战，目标是在14天内稳定完成3公里跑步，建立基础耐力与跑步习惯。',
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
      tags: ['新手', '跑步'],
      rules: [
        '每周至少进行3次跑步训练',
        '优先采用慢跑与跑走结合方式逐步适应',
        '记录配速与心率，避免过快与过度疲劳',
        '保持拉伸与交叉训练（如骑行/游泳）'
      ],
      tips: [
        '循序渐进，慢慢增加跑步时间与距离',
        '选择合脚的跑鞋与舒适的运动服',
        '跑前热身与跑后拉伸不可少',
        '保持耐心与持续性，避免急速加量'
      ]
    },
    {
      id: '8',
      title: '10公里耐力挑战',
      description: '提升耐力完成10公里',
      detailedDescription: '以耐力提升为目标，在21天内完成针对10公里的专项训练与一次完整10公里跑。',
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
      tags: ['耐力', '10K'],
      rules: [
        '挑战期间完成一次10公里连续跑',
        '每周至少进行一次超过6公里的训练',
        '加入节奏跑与轻松跑穿插，提高耐力与恢复',
        '记录路线、距离与自我感受'
      ],
      tips: [
        '合理控制配速，避免前程过快导致后段疲劳',
        '长距离跑前后注意补水与营养摄入',
        '天气炎热时适当缩短距离或调整时间',
        '关注身体信号，适时休息'
      ]
    },
    {
      id: '9',
      title: '30分钟持续跑步',
      description: '连续跑步30分钟',
      detailedDescription: '以时间为目标的基础耐力挑战，在7天内逐步适应并稳定完成不间断的30分钟连续跑步。',
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
      tags: ['时间', '耐力'],
      rules: [
        '挑战期间至少完成2次≥30分钟的连续跑',
        '可采用慢跑配速，保持匀速与呼吸节奏',
        '记录心率与主观感受以评估进步',
        '避免在疲劳或不适时强行训练'
      ],
      tips: [
        '从20分钟开始逐渐延长至30分钟',
        '注意跑姿与呼吸，保持舒适节奏',
        '在平坦安全的路线进行训练',
        '适度补水，跑后进行拉伸与放松'
      ]
    }
  ];

  useEffect(() => {
    if (id) {
      const foundChallenge = challengesData.find(c => c.id === id);
      setChallenge(foundChallenge || null);
      // 模拟检查用户是否已参加
      setIsJoined(Math.random() > 0.5);
    }
  }, [id]);

  const handleJoinChallenge = () => {
    setIsJoined(true);
    // 这里可以添加实际的参加挑战逻辑
  };

  const handleStartChallenge = () => {
    if (challenge) {
      navigate(`/challenge-progress/${challenge.id}`);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'upcoming': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">挑战不存在</h2>
          <p className="text-gray-600 mb-4">抱歉，找不到您要查看的挑战。</p>
          <button 
            onClick={() => navigate('/challenges')}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            返回挑战列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button 
              onClick={() => navigate('/challenges')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              返回挑战
            </button>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-red-500 transition-colors">
                <Heart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要内容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 挑战头图 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <img 
                src={challenge.image} 
                alt={challenge.title}
                className="w-full h-64 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                      {challenge.difficulty === 'easy' ? '简单' : challenge.difficulty === 'medium' ? '中等' : '困难'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(challenge.status)}`}>
                      {challenge.status === 'active' ? '进行中' : challenge.status === 'upcoming' ? '即将开始' : '已结束'}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Users className="w-4 h-4 mr-1" />
                    <span className="text-sm">{challenge.participants} 人参与</span>
                  </div>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{challenge.title}</h1>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {challenge.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="text-gray-600 text-lg leading-relaxed">
                  {challenge.detailedDescription || challenge.description}
                </p>
              </div>
            </div>

            {/* 挑战规则 */}
            {challenge.rules && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  挑战规则
                </h2>
                <ul className="space-y-3">
                  {challenge.rules.map((rule, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 参与提示 */}
            {challenge.tips && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  参与提示
                </h2>
                <ul className="space-y-3">
                  {challenge.tips.map((tip, index) => (
                    <li key={index} className="flex items-start">
                      <Star className="w-4 h-4 text-yellow-500 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 挑战信息卡片 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">挑战信息</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">目标</span>
                  <span className="font-medium">{challenge.target} {challenge.unit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">持续时间</span>
                  <span className="font-medium">{challenge.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">开始时间</span>
                  <span className="font-medium">{challenge.startDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">结束时间</span>
                  <span className="font-medium">{challenge.endDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">奖励</span>
                  <span className="font-medium text-yellow-600">{challenge.reward}</span>
                </div>
              </div>

              {/* 进度条 */}
              {challenge.progress !== undefined && isJoined && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">完成进度</span>
                    <span className="text-sm font-medium">{challenge.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${challenge.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="mt-6 space-y-3">
                {!isJoined ? (
                  <button 
                    onClick={handleJoinChallenge}
                    className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                  >
                    <Trophy className="w-5 h-5 mr-2" />
                    参加挑战
                  </button>
                ) : (
                  <button 
                    onClick={handleStartChallenge}
                    className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    开始挑战
                  </button>
                )}
                
                <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  查看排行榜
                </button>
              </div>
            </div>

            {/* 参与统计 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">参与统计</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">总参与人数</span>
                  <span className="font-medium text-blue-600">{challenge.participants}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">完成人数</span>
                  <span className="font-medium text-green-600">{Math.floor(challenge.participants * 0.3)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">完成率</span>
                  <span className="font-medium">30%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDetail;