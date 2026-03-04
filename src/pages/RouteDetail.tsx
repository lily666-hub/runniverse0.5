import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Route, 
  TrendingUp, 
  Star, 
  Users, 
  Heart,
  Share2,
  Play,
  MessageSquare,
  Tag,
  Calendar,
  Thermometer,
  Wind
} from 'lucide-react';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { RouteFeedback } from '../components/RouteFeedback';
import { FeedbackService } from '../services/feedbackService';
import { RouteMapDisplay } from '../components/RouteMapDisplay';
import { Attraction } from '../types/route';

interface RouteDetailData {
  id: string;
  name: string;
  description: string;
  distance: number;
  duration: number;
  difficulty: number;
  startPoint: string;
  endPoint: string;
  elevation: number;
  routeType: string;
  features: string[];
  coordinates: [number, number][];
  imageUrl?: string;
  rating: number;
  reviewCount: number;
  completionCount: number;
  tags: string[];
  weatherSuitability: string[];
  bestTimeToRun: string[];
  safetyTips: string[];
  landmarks: string[];
  facilities: string[];
  specialFeatures?: string;
  attractions?: Attraction[];
}

interface RouteStats {
  averageRating: number;
  totalFeedbacks: number; // 改为totalFeedbacks以匹配FeedbackStats
  difficultyRating: number;
  safetyRating: number;
  sceneryRating: number;
  recommendationRate: number;
  popularTags: Array<{ tag: string; count: number }>;
  recentComments: Array<{
    comment: string;
    rating: number;
    createdAt: string;
  }>;
}

export const RouteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [route, setRoute] = useState<RouteDetailData | null>(null);
  const [stats, setStats] = useState<RouteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'map'>('overview');

  useEffect(() => {
    if (id) {
      loadRouteDetail(id);
      loadRouteStats(id);
    }
  }, [id]);

  const loadRouteDetail = async (routeId: string) => {
    try {
      // 根据路线ID获取对应的路线数据（已合并 1-6 的完整详情）
      const routeDataMap: { [key: string]: RouteDetailData } = {
        '1': {
          id: '1',
          name: '外滩滨江步道',
          description: '沿着黄浦江畔的经典跑步路线，可以欣赏到外滩万国建筑群和陆家嘴天际线的美景。',
          distance: 3.2,
          duration: 25,
          difficulty: 1,
          startPoint: '外滩源',
          endPoint: '十六铺码头',
          elevation: 5,
          routeType: '城市景观',
          features: ['江景', '夜景', '历史建筑', '平坦路面'],
          coordinates: [
            [121.4944, 31.2397],
            [121.4950, 31.2400],
            [121.4952, 31.2401],
            [121.4954, 31.2402],
            [121.4956, 31.2403]
          ],
          imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
          rating: 4.8,
          reviewCount: 1234,
          completionCount: 2500,
          tags: ['观光', '夜跑', '初学者友好'],
          weatherSuitability: ['晴天', '多云', '微风'],
          bestTimeToRun: ['早晨 6:00-8:00', '傍晚 17:00-19:00', '夜晚 19:00-21:00'],
          safetyTips: [
            '注意避让行人和自行车',
            '夜跑时穿着反光装备',
            '注意江边湿滑路段',
            '保持适当距离，避免拥挤'
          ],
          landmarks: ['外滩源', '外滩18号', '和平饭店', '外滩中心', '十六铺码头'],
          facilities: ['公共厕所', '饮水点', '休息座椅', '急救站']
        },
        '2': {
          id: '2',
          name: '世纪公园环湖路线',
          description: '围绕世纪公园湖泊的环形跑步路线，绿树成荫，空气清新，是晨跑的绝佳选择。',
          distance: 5.0,
          duration: 35,
          difficulty: 2,
          startPoint: '世纪公园1号门',
          endPoint: '世纪公园1号门',
          elevation: 15,
          routeType: '公园环线',
          features: ['湖景', '绿化', '空气清新', '环形路线'],
          coordinates: [
            [121.5569, 31.2196],
            [121.5580, 31.2200],
            [121.5590, 31.2190],
            [121.5585, 31.2180],
            [121.5575, 31.2185],
            [121.5565, 31.2190],
            [121.5569, 31.2196]
          ],
          imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
          rating: 4.6,
          reviewCount: 892,
          completionCount: 1800,
          tags: ['公园', '晨跑', '环湖'],
          weatherSuitability: ['晴天', '多云'],
          bestTimeToRun: ['早晨 6:00-9:00', '傍晚 16:00-18:00'],
          safetyTips: ['注意其他跑者和游客','雨后路面可能湿滑','保持环保，不乱扔垃圾'],
          landmarks: ['湖心岛', '樱花园', '音乐喷泉', '梅花园', '牡丹园'],
          facilities: ['公共厕所', '饮水点', '休息亭', '健身器材'],
          specialFeatures: '世纪公园是市区大型生态公园，环湖步道串联多处主题园区与自然景观，是市民休闲与生态教育的重要场所，体现城市现代化理念。',
          attractions: [
            { id: '2-1', name: '镜天湖', description: '碧波荡漾的湖水如镜，倒映蓝天白云绿树，是公园内最大的湖泊，环湖跑步的绝佳背景', location: '公园中心区域', highlight: '湖景与微风', image: '/pictures/attractions/2/mirror-lake.jpg' },
            { id: '2-2', name: '世纪花钟', description: '巨大花卉装饰时钟，由数万株四季花卉布置而成，是公园的标志性景观，随季节变换呈现不同色彩', location: '公园主入口附近', highlight: '春季花海', image: '/pictures/attractions/2/flower-clock.jpg' },
            { id: '2-3', name: '云帆桥', description: '优雅白色拱桥横跨湖面，桥身如扬起风帆，是观赏湖景的最佳位置，也是摄影爱好者的天堂', location: '镜天湖西侧', highlight: '灯光喷泉', image: '/pictures/attractions/2/sail-bridge.jpg' },
            { id: '2-4', name: '绿色世界', description: '郁郁葱葱生态湿地，水生植物和候鸟栖息地，展现自然生态之美，是观鸟和亲近自然的理想场所', location: '公园东南角', highlight: '季节花香', image: '/pictures/attractions/2/wetland.jpg' },
            { id: '2-5', name: '观景平台', description: '湖边木质观景平台，观赏湖景最佳位置，可远眺整个镜天湖美景，是跑步途中休息的理想场所', location: '镜天湖北岸', highlight: '湖景与微风', image: '/pictures/attractions/2/viewing-platform.jpg' }
          ]
        },
        '3': {
          id: '3',
          name: '复旦大学校园环线',
          description: '穿越复旦大学校园的文化跑步路线，感受百年学府的历史文化底蕴。',
          distance: 2.8,
          duration: 20,
          difficulty: 1,
          startPoint: '复旦大学正门',
          endPoint: '复旦大学正门',
          elevation: 8,
          routeType: '校园环线',
          features: ['校园风光', '历史建筑', '文化氛围', '安全路线'],
          coordinates: [
            [121.5033, 31.2989],
            [121.5040, 31.2995],
            [121.5045, 31.3000],
            [121.5035, 31.3005],
            [121.5025, 31.3000],
            [121.5020, 31.2995],
            [121.5033, 31.2989]
          ],
          imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=300&fit=crop',
          rating: 4.4,
          reviewCount: 456,
          completionCount: 950,
          tags: ['校园', '文化', '安全'],
          weatherSuitability: ['晴天', '多云', '小雨'],
          bestTimeToRun: ['早晨 6:00-8:00', '傍晚 17:00-19:00'],
          safetyTips: ['注意学生和教职工通行','遵守校园管理规定','保持安静，不影响教学'],
          landmarks: ['光华楼', '图书馆', '相辉堂', '燕园', '体育馆'],
          facilities: ['饮水点', '休息座椅', '体育设施'],
          specialFeatures: '复旦大学创办于1905年，校园内保留多处近现代建筑与人文景观。环线串联教学楼、图书馆与历史建筑，体现学术氛围与人文底蕴。',
          attractions: [
            { id: '3-1', name: '光华楼', description: '复旦大学代表性现代建筑，双塔式设计直插云霄，体现学府现代化发展理念', location: '中轴线北段', highlight: '校园地标', image: '/pictures/attractions/3/guanghua-tower.jpg' },
            { id: '3-2', name: '相辉堂', description: '历史建筑，青砖灰瓦承载深厚文化底蕴，见证复旦百年发展历程', location: '东侧人文区', highlight: '历史建筑', image: '/pictures/attractions/3/xianghui-hall.jpg' },
            { id: '3-3', name: '燕园', description: '典型江南园林风格，小桥流水曲径通幽，古树名木与亭台楼阁相映成趣', location: '南侧园区', highlight: '静谧庭院', image: '/pictures/attractions/3/yan-garden.jpg' },
            { id: '3-4', name: '图书馆', description: '庄严雄伟建筑外观，内部藏书丰富，是复旦学子汲取知识的精神殿堂', location: '中轴线中段', highlight: '学术氛围', image: '/pictures/attractions/3/library.jpg' },
            { id: '3-5', name: '校训墙', description: '镌刻着复旦校训的石墙，承载着"博学而笃志，切问而近思"的治学精神', location: '校园中心广场', highlight: '校园文化', image: '/pictures/attractions/3/motto-wall.jpg' }
          ]
        },
        '4': {
          id: '4',
          name: '中山公园樱花大道',
          description: '春季樱花盛开时的浪漫跑步路线，四季皆有不同的自然美景。',
          distance: 4.2,
          duration: 33,
          difficulty: 2,
          startPoint: '中山公园正门',
          endPoint: '中山公园正门',
          elevation: 12,
          routeType: '公园景观',
          features: ['樱花', '四季美景', '浪漫', '摄影胜地'],
          coordinates: [
            [121.4222, 31.2231],
            [121.4230, 31.2240],
            [121.4235, 31.2245],
            [121.4240, 31.2250],
            [121.4235, 31.2255],
            [121.4225, 31.2250],
            [121.4215, 31.2240],
            [121.4222, 31.2231]
          ],
          imageUrl: 'https://images.unsplash.com/photo-1558980664-10c2369d49ec?w=400&h=300&fit=crop',
          rating: 4.6,
          reviewCount: 689,
          completionCount: 1400,
          tags: ['赏花', '摄影', '浪漫'],
          weatherSuitability: ['晴天', '多云'],
          bestTimeToRun: ['春季 3-4月樱花季', '清晨与傍晚时段'],
          safetyTips: ['花季游客较多，注意避让','湿滑路段减速慢行','遵守园区管理规定'],
          landmarks: ['樱花大道入口', '湖畔休憩区', '花卉温室', '中心草坪'],
          facilities: ['公共厕所', '饮水点', '休息亭', '垃圾分类点'],
          specialFeatures: '中山公园为近现代城市公园典型空间，樱花大道形成季节性景观轴线。跑者在花海与绿地交织的步道上，感受城市园林美学与市民休闲文化。',
          attractions: [
            { id: '4-1', name: '樱花大道', description: '800米樱花大道，春季粉色花海如梦如幻，微风拂过花瓣飘洒，城市中最浪漫的跑步体验', location: '公园主道', highlight: '春季花海', image: '/pictures/attractions/4/cherry-avenue.jpg' },
            { id: '4-2', name: '牡丹园', description: '典雅华贵牡丹花，色彩丰富层次分明，花期时节各色牡丹竞相开放，富贵吉祥之意盎然', location: '西侧园区', highlight: '国色天香', image: '/pictures/attractions/4/peony-garden.jpg' },
            { id: '4-3', name: '荷花池', description: '夏季荷花盛开，粉白荷花在碧绿荷叶间亭亭玉立，池畔微风荷香阵阵，为跑步增添诗意', location: '中心湖区', highlight: '夏日荷香', image: '/pictures/attractions/4/lake-pavilion.jpg' },
            { id: '4-4', name: '竹园', description: '幽静雅致竹林，各种竹子形成天然氧吧，翠竹挺拔曲径通幽，为跑者提供清新的休憩空间', location: '东侧园区', highlight: '翠竹清幽', image: '/pictures/attractions/4/bamboo-garden.jpg' },
            { id: '4-5', name: '儿童乐园', description: '色彩缤纷儿童游乐设施，充满欢声笑语，见证家庭温馨时光，为跑步路线增添生活气息', location: '北侧园区', highlight: '童趣时光', image: '/pictures/attractions/4/playground.jpg' }
          ]
        },
        '5': {
  id: '5',
  name: '陆家嘴金融城环线',
  description: '穿梭于摩天大楼与滨江空间的城市地标环线，夜景震撼。',
  distance: 6.5,
  duration: 55,
  difficulty: 3,
  startPoint: '陆家嘴中心绿地',
  endPoint: '陆家嘴中心绿地',
  elevation: 18,
  routeType: '城市地标',
  features: ['摩天楼群', '滨江景观', '灯光秀', '现代都市'],
  coordinates: [
    [121.5065, 31.2401],
    [121.5070, 31.2408],
    [121.5080, 31.2415],
    [121.5090, 31.2420],
    [121.5100, 31.2415],
    [121.5105, 31.2405],
    [121.5095, 31.2395],
    [121.5085, 31.2398],
    [121.5075, 31.2400],
    [121.5065, 31.2401]
  ],
  imageUrl: 'https://images.unsplash.com/photo-1536331092-14fa3cfb0606?w=400&h=300&fit=crop',
  rating: 4.7,
  reviewCount: 923,
  completionCount: 2100,
  tags: ['地标', '夜跑', '城市风光'],
  weatherSuitability: ['晴天', '多云', '凉爽夜间'],
  bestTimeToRun: ['夜间灯光秀时段', '工作日傍晚较清爽'],
  safetyTips: [
    '注意人行道与车流交叉口',
    '避免在人群密集处加速',
    '夜跑注意反光装备'
  ],
  landmarks: ['东方明珠塔', '上海中心大厦', '金茂大厦', '滨江步道'],
  facilities: ['地铁站', '便利店', '观景平台', '公共厕所'],
  specialFeatures: '陆家嘴作为中国金融中心象征，摩天大楼群与滨江公共空间组合展示现代都市形象。跑者在灯光与玻璃幕墙的折射中体验城市速度与能量。',
  attractions: [
            { id: '5-1', name: '东方明珠', description: '上海标志性建筑，独特球体设计直插云霄，夜晚灯光璀璨成为城市天际线最亮眼的明珠', location: '陆家嘴世纪大道旁', highlight: '地标打卡', image: '/pictures/attractions/5/oriental-pearl.jpg' },
            { id: '5-2', name: '上海中心', description: '中国第二高楼，螺旋式上升建筑造型，现代工程技术与美学的完美结合', location: '银城中路附近', highlight: '超高层建筑群', image: '/pictures/attractions/5/shanghai-tower.jpg' },
            { id: '5-3', name: '环球金融中心', description: '方正规整建筑，顶部梯形开口设计独特，展现现代商务建筑的理性美学', location: '世纪大道附近', highlight: '商务地标', image: '/pictures/attractions/5/world-financial-center.jpg' },
            { id: '5-4', name: '金茂大厦', description: '融合中国传统元素的现代摩天大楼，塔式建筑展现东方神韵与现代技术的和谐统一', location: '花园石桥路附近', highlight: '传统现代融合', image: '/pictures/attractions/5/jinmao-tower.jpg' },
            { id: '5-5', name: '滨江大道', description: '沿黄浦江景观大道，江风习习，对岸外滩历史建筑群尽收眼底，现代与历史隔江相望', location: '浦东南路至滨江段', highlight: '江景开阔', image: '/pictures/attractions/5/riverside-avenue.jpg' }
          ]
},
        '6': {
          id: '6',
          name: '新天地历史文化路线',
          description: '结合历史与现代的文化跑步路线，体验上海独特的石库门建筑风情。',
          distance: 3.8,
          duration: 30,
          difficulty: 2,
          startPoint: '新天地北里',
          endPoint: '新天地北里',
          elevation: 10,
          routeType: '历史文化',
          features: ['石库门', '历史文化', '现代艺术', '特色建筑'],
          coordinates: [
            [121.4736, 31.2222],
            [121.4740, 31.2225],
            [121.4745, 31.2230],
            [121.4750, 31.2235],
            [121.4745, 31.2240],
            [121.4740, 31.2245],
            [121.4735, 31.2240],
            [121.4736, 31.2222]
          ],
          imageUrl: 'https://images.unsplash.com/photo-1552573874-4b2b0d59cafe?w=400&h=300&fit=crop',
          rating: 4.6,
          reviewCount: 689,
          completionCount: 1350,
          tags: ['历史', '文化', '建筑'],
          weatherSuitability: ['晴天', '多云', '微风'],
          bestTimeToRun: ['上午 9:00-11:00', '傍晚 17:00-19:00'],
          safetyTips: ['里弄空间较窄，注意避让','石板路面湿滑需小心','尊重社区安静环境'],
          landmarks: ['石库门里弄', '新天地广场', '太平桥公园', '艺术展馆'],
          facilities: ['公共厕所', '饮水点', '咖啡店', '休息座椅'],
          specialFeatures: '新天地以保护与再利用石库门建筑著称，历史街区与现代商业融合。跑者在里弄与广场穿行，体验城市更新中保留与创新的平衡。',
          attractions: [
            { id: '6-1', name: '中共一大会址', description: '典型上海石库门建筑，青砖灰瓦承载历史记忆，见证中国共产党诞生的重要历史时刻', location: '历史保护区', highlight: '历史圣地', image: '/pictures/attractions/6/shikumen-architecture.jpg' },
            { id: '6-2', name: '新天地北里', description: '保留石库门外观，内部融合现代商业文化，传统与现代在这里完美交融', location: '核心商业区', highlight: '传统现代融合', image: '/pictures/attractions/6/xintiandi-north.jpg' },
            { id: '6-3', name: '石库门博物馆', description: '保存上世纪二三十年代石库门生活场景，生动展现老上海弄堂生活的真实面貌', location: '文化展示区', highlight: '生活文化', image: '/pictures/attractions/6/shikumen-museum.jpg' },
            { id: '6-4', name: '太平桥公园', description: '都市绿色翡翠，人工湖与绿地相映，为跑步者提供宁静的自然休憩空间', location: '南侧水岸', highlight: '水岸休憩', image: '/pictures/attractions/6/taipingqiao-park.jpg' },
            { id: '6-5', name: '老码头', description: '见证上海航运历史的古老码头建筑，黄浦江畔的历史印记，承载着城市发展的记忆', location: '滨江历史区', highlight: '历史印记', image: '/pictures/attractions/6/old-dock.jpg' }
          ]
        }
      };

      // 默认路线数据
      const defaultRoute: RouteDetailData = {
        id: routeId,
        name: '外滩滨江步道',
        description: '沿着黄浦江畔的经典跑步路线，可以欣赏到外滩万国建筑群和陆家嘴天际线的美景。',
        distance: 3.2,
        duration: 25,
        difficulty: 1,
        startPoint: '外滩源',
        endPoint: '十六铺码头',
        elevation: 5,
        routeType: '城市景观',
        features: ['江景', '夜景', '历史建筑', '平坦路面'],
        coordinates: [
          [121.4944, 31.2397], // 外滩源
          [121.4950, 31.2400], // 外滩18号
          [121.4952, 31.2401], // 和平饭店
          [121.4954, 31.2402], // 外滩中心
          [121.4956, 31.2403]  // 十六铺码头
        ],
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
        rating: 4.8,
        reviewCount: 1234,
        completionCount: 2500,
        tags: ['观光', '夜跑', '初学者友好'],
        weatherSuitability: ['晴天', '多云', '微风'],
        bestTimeToRun: ['早晨 6:00-8:00', '傍晚 17:00-19:00', '夜晚 19:00-21:00'],
        safetyTips: [
          '注意避让行人和自行车',
          '夜跑时穿着反光装备',
          '注意江边湿滑路段',
          '保持适当距离，避免拥挤'
        ],
        landmarks: ['外滩源', '外滩18号', '和平饭店', '外滩中心', '十六铺码头'],
        facilities: ['公共厕所', '饮水点', '休息座椅', '急救站']
      };

      const mockRoute = routeDataMap[routeId] || defaultRoute;
      setRoute(mockRoute);
    } catch (error) {
      console.error('加载路线详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRouteStats = async (routeId: string) => {
    try {
      const routeStats = await FeedbackService.getRouteFeedbackStats(routeId);
      setStats(routeStats);
    } catch (error) {
      console.error('加载路线统计失败:', error);
      // 使用模拟数据
      setStats({
        averageRating: 4.6,
        totalFeedbacks: 128,
        difficultyRating: 3.2,
        safetyRating: 4.8,
        sceneryRating: 4.9,
        recommendationRate: 0.89,
        popularTags: [
          { tag: '风景优美', count: 45 },
          { tag: '适合初学者', count: 32 },
          { tag: '夜跑推荐', count: 28 }
        ],
        recentComments: [
          { comment: '风景really beautiful, especially at night!', rating: 5, createdAt: '2024-01-15' },
          { comment: '路线很平坦，适合新手', rating: 4, createdAt: '2024-01-14' }
        ]
      });
    }
  };

  const handleStartRun = () => {
    // 实际应该跳转到跑步记录页面
    alert('开始跑步功能开发中...');
  };

  const handleFeedbackSubmit = async (feedback: any) => {
    try {
      // 这里需要用户ID，实际应该从认证系统获取
      const userId = 'current-user-id';
      await FeedbackService.submitFeedback(feedback, userId);
      
      // 重新加载统计数据
      if (id) {
        await loadRouteStats(id);
      }
      
      alert('反馈提交成功！');
      setShowFeedback(false);
    } catch (error) {
      console.error('提交反馈失败:', error);
      alert('提交失败，请重试');
    }
  };

  const handleShare = () => {
    if (navigator.share && route) {
      navigator.share({
        title: route.name,
        text: route.description,
        url: window.location.href
      });
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板');
    }
  };

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
    // 实际应该调用API保存收藏状态
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">路线不存在</p>
          <button
            onClick={() => navigate('/recommendations')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回推荐页面
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部图片和基本信息 */}
      <div className="relative">
        <div className="h-56 sm:h-64 md:h-80 bg-gradient-to-r from-blue-500 to-purple-600 relative overflow-hidden">
          {route.imageUrl && (
            <img
              src={route.imageUrl}
              alt={route.name}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          
          {/* 导航栏 */}
          <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
            >
              <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
              >
                <Share2 className="w-4 sm:w-5 h-4 sm:h-5" />
              </button>
              <button
                onClick={toggleFavorite}
                className={`p-2 rounded-full transition-colors ${
                  isFavorited
                    ? 'bg-red-500 text-white'
                    : 'bg-black bg-opacity-50 text-white hover:bg-opacity-70'
                }`}
              >
                <Heart className={`w-4 sm:w-5 h-4 sm:h-5 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
          
          {/* 路线基本信息 */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{route.name}</h1>
              <DifficultyBadge level={route.difficulty} />
            </div>
            
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1">
                <Route className="w-3 sm:w-4 h-3 sm:h-4" />
                <span>{route.distance} km</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 sm:w-4 h-3 sm:h-4" />
                <span>{route.duration} 分钟</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 sm:w-4 h-3 sm:h-4" />
                <span>{route.elevation}m 爬升</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 sm:w-4 h-3 sm:h-4 fill-current" />
                <span>{route.rating}</span>
                <span className="text-gray-300">({route.reviewCount})</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col sm:flex-row gap-2 sm:gap-3 w-full max-w-xs sm:max-w-none px-4 sm:px-0">
          <button
            onClick={handleStartRun}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            <Play className="w-4 sm:w-5 h-4 sm:h-5" />
            开始跑步
          </button>
          <button
            onClick={() => setShowFeedback(true)}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-white text-gray-700 rounded-full shadow-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
          >
            <MessageSquare className="w-4 sm:w-5 h-4 sm:h-5" />
            评价路线
          </button>
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className="pt-12 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* 标签页导航 */}
          <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
            {[
              { key: 'overview', label: '概览', icon: MapPin },
              { key: 'reviews', label: '评价', icon: MessageSquare },
              { key: 'map', label: '地图', icon: Route }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm sm:text-base">{label}</span>
              </button>
            ))}
          </div>
          
          {/* 标签页内容 */}
          {activeTab === 'overview' && (
            <div className="space-y-6 sm:space-y-8">
              {/* 路线描述 */}
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">路线描述</h2>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {route.description}
                </p>
              </div>
              
              {/* 路线特色 */}
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">路线特色</h2>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {route.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* 历史背景与文化意义 */}
              {route.specialFeatures && (
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">历史背景与文化意义</h2>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {route.specialFeatures || '暂无历史与文化信息'}
                  </p>
                </div>
              )}
              
              {/* 最佳跑步时间 */}
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                  <Calendar className="w-4 sm:w-5 h-4 sm:h-5" />
                  最佳跑步时间
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {route.bestTimeToRun.map((time, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded-lg">
                      <p className="text-green-800 font-medium text-sm sm:text-base">{time}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 天气适宜性 */}
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                  <Thermometer className="w-4 sm:w-5 h-4 sm:h-5" />
                  适宜天气
                </h2>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {route.weatherSuitability.map((weather, index) => (
                    <span
                      key={index}
                      className="px-2 sm:px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs sm:text-sm flex items-center gap-1"
                    >
                      <Wind className="w-3 h-3" />
                      {weather}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* 安全提示 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-4">安全提示</h2>
                <ul className="space-y-2">
                  {route.safetyTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-600">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* 周边设施 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-4">周边设施</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {route.facilities.map((facility, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-gray-700 text-sm">{facility}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'reviews' && stats && (
            <div className="space-y-6">
              {/* 评分统计 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-6">用户评价</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 总体评分 */}
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {stats.averageRating.toFixed(1)}
                    </div>
                    <div className="flex justify-center mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= Math.round(stats.averageRating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-600">{stats.totalFeedbacks} 条评价</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {Math.round(stats.recommendationRate * 100)}% 推荐率
                    </p>
                  </div>
                  
                  {/* 详细评分 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">难度</span>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= Math.round(stats.difficultyRating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {stats.difficultyRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">安全性</span>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= Math.round(stats.safetyRating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {stats.safetyRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">风景</span>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= Math.round(stats.sceneryRating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {stats.sceneryRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 热门标签 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">热门标签</h3>
                <div className="flex flex-wrap gap-2">
                  {stats.popularTags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3" />
                      {tag.tag} ({tag.count})
                    </span>
                  ))}
                </div>
              </div>
              
              {/* 最新评论 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">最新评论</h3>
                <div className="space-y-4">
                  {stats.recentComments.map((comment, index) => (
                    <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= comment.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">{comment.createdAt}</span>
                      </div>
                      <p className="text-gray-700">{comment.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'map' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-4">路线地图</h2>
              <RouteMapDisplay route={route} />
              
              {/* 路线信息 */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">起点</h4>
                  <p className="text-gray-600">{route.startPoint}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">终点</h4>
                  <p className="text-gray-600">{route.endPoint}</p>
                </div>
              </div>
              
              {/* 地标建筑 */}
              <div className="mt-6">
                <h4 className="font-semibold text-gray-800 mb-3">沿途地标</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {route.landmarks.map((landmark, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700">{landmark}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 反馈模态框 */}
      {showFeedback && (
        <RouteFeedback
          routeId={route.id}
          routeName={route.name}
          isOpen={showFeedback}
          onClose={() => setShowFeedback(false)}
          onSubmit={handleFeedbackSubmit}
        />
      )}
    </div>
  );
}

export default RouteDetail;