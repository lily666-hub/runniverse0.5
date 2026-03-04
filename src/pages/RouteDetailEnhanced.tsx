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
  Wind,
  Camera,
  Target,
  Award,
  Navigation
} from 'lucide-react';
import { RouteDetail as RouteDetailType, Attraction, RouteTask } from '../types/route';
import LazyImage from '../components/LazyImage';
import '../styles/route-library.css';
import { getRouteImageById } from '../utils/imageResources';
import { getTasksByRouteId } from '../data/routeTasks';

const RouteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [route, setRoute] = useState<RouteDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'attractions' | 'tasks'>('overview');
  const [tasks, setTasks] = useState<RouteTask[]>([]);

  useEffect(() => {
    if (id) {
      loadRouteDetail(id);
      setTasks(getTasksByRouteId(id));
    }
  }, [id]);

  const loadRouteDetail = async (routeId: string) => {
    try {
      // 模拟路线详情数据
      const routeDataMap: { [key: string]: RouteDetailType } = {
        '1': {
          id: '1',
          name: '外滩滨江步道',
          description: '沿着黄浦江畔的经典跑步路线，可以欣赏到外滩万国建筑群和陆家嘴天际线的美景。这里是上海最具代表性的城市景观之一，融合了历史与现代的完美对比。',
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
          imageUrl: getRouteImageById('1'),
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
          facilities: ['公共厕所', '饮水点', '休息座椅', '急救站'],
          specialFeatures: '外滩滨江步道是上海最具标志性的跑步路线之一，完美融合了历史建筑与现代都市风光。沿途可以欣赏到19世纪的万国建筑博览群和21世纪的陆家嘴摩天大楼天际线，形成了独特的时空对话。路线平坦易行，适合各个水平的跑者，特别是夜跑体验极佳，灯光璀璨，江风习习。',
          attractions: [
            {
              id: '1',
              name: '外滩万国建筑群',
              description: '外滩万国建筑群是上海最具代表性的历史建筑群，包括哥特式、巴洛克式、罗马式、古典主义式等多种建筑风格。这些建筑代表了上海从小渔村发展成为国际大都市的历史进程，每一栋建筑都有着深厚的历史底蕴和独特的建筑美学。',
              image: '/外滩滨江步道/0.png',
              location: '中山东一路',
              highlight: '26栋历史建筑，百年历史见证'
            },
            {
              id: '2',
              name: '陆家嘴天际线',
              description: '陆家嘴天际线是中国最具代表性的现代城市景观之一，汇集了东方明珠、上海中心大厦、环球金融中心、金茂大厦等地标建筑。这些摩天大楼代表着中国改革开放的成果和上海作为国际金融中心的地位，夜晚的灯光秀更是令人叹为观止。',
              image: '/外滩滨江步道/1.png',
              location: '浦东新区陆家嘴',
              highlight: '现代摩天大楼群，夜景绝佳'
            },
            {
              id: '3',
              name: '黄浦江夜景',
              description: '黄浦江夜景是上海最美的城市名片之一，两岸的灯光交相辉映，形成了独特的城市夜景。夜晚的外滩灯火辉煌，对岸的陆家嘴摩天大楼灯火通明，江面上的游船缓缓驶过，构成了一幅动人的城市画卷。',
              image: '/外滩滨江步道/2.png',
              location: '黄浦江两岸',
              highlight: '璀璨夜景，摄影胜地'
            },
            {
              id: '4',
              name: '和平饭店',
              description: '和平饭店是上海最著名的历史酒店之一，建于1929年，是外滩的标志性建筑。这座绿色金字塔顶的建筑代表了上海百年年的历史变迁，曾接待过无数政要和名人，是上海历史文化的重要载体。',
              image: '/外滩滨江步道/3.png',
              location: '南京东路20号',
              highlight: '百年历史酒店，外滩地标'
            },
            {
              id: '5',
              name: '十六铺码头',
              description: '十六铺码头是上海重要的水上交通枢纽，也是外滩跑步路线的终点。这里不仅可以欣赏到黄浦江的美景，还可以看到各种船只来往穿梭，感受上海作为港口城市的独特魅力。码头周边还有丰富的商业设施。',
              image: '/外滩滨江步道/4.png',
              location: '中山东二路501号',
              highlight: '水上交通枢纽，港口文化'
            }
          ]
        },
        '2': {
          id: '2',
          name: '世纪公园环湖路线',
          description: '围绕世纪公园湖泊的环形跑步路线，绿树成荫，空气清新，是晨跑的绝佳选择。公园内有大面积的绿地和湖泊，是城市中的天然氧吧。',
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
          imageUrl: getRouteImageById('2'),
          rating: 4.6,
          reviewCount: 892,
          completionCount: 1600,
          tags: ['公园', '晨跑', '环湖'],
          weatherSuitability: ['晴天', '微风', '阴天'],
          bestTimeToRun: ['早晨 6:00-9:00', '下午 16:00-18:00'],
          safetyTips: ['注意防晒和补水', '环湖路段注意骑行者', '留意儿童活动区域'],
          landmarks: ['湖心岛', '樱花园', '音乐喷泉', '梅花园', '牡丹园'],
          facilities: ['饮水点', '休息区', '儿童乐园', '洗手间'],
          attractions: [
            {
              id: '2-1',
              name: '湖心岛风光',
              description: '湖心岛视野开阔，环湖步道与树影交织成优美画面。清晨倒影清晰，是构图与宁静体验的最佳地点。',
              image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=A serene lake in Century Park Shanghai with crystal-clear water reflecting blue sky white clouds and lush green trees, peaceful morning light, natural landscape photography style, wide angle view&image_size=landscape_16_9',
              location: '湖心岛',
              highlight: '环湖广阔视野与镜面倒影'
            },
            {
              id: '2-2',
              name: '樱花园步道',
              description: '春季樱花盛开，粉白花拱覆盖步道，四季皆可赏花。人行步道平缓，适合轻松慢跑与拍照打卡。',
              image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=A giant floral clock in Century Park Shanghai made of thousands of seasonal flowers in full bloom, colorful petal patterns forming clock face, spring morning sunlight, botanical garden photography style&image_size=square',
              location: '樱花园',
              highlight: '花季拱廊与轻松慢跑'
            },
            {
              id: '2-3',
              name: '音乐喷泉广场',
              description: '喷泉随音乐节奏起舞，夜晚灯光与水柱交织。是亲子与社交氛围浓厚的开放空间，跑后休憩佳处。',
              image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=An elegant white arch bridge spanning across the lake in Century Park Shanghai, bridge design resembling raised sails, morning mist over water, architectural photography style&image_size=landscape_16_9',
              location: '喷泉广场',
              highlight: '灯光水舞与社交氛围'
            },
            {
              id: '2-4',
              name: '观鸟台湿地',
              description: '近水湿地生态良好，常见水鸟栖息。安静的观察点与木栈道让你在跑步之余靠近自然生境。',
              image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Lush ecological wetland area in Century Park Shanghai with aquatic plants water birds habitat, green vegetation reflecting in calm water, natural ecosystem beauty, wildlife photography style&image_size=landscape_4_3',
              location: '观鸟台',
              highlight: '湿地生态与亲近自然'
            },
            {
              id: '2-5',
              name: '梅花园四季',
              description: '梅花园四季色彩丰富，花期时香气扑鼻。步道平整，适合放松步频，感受清新植物气息。',
              image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=A wooden viewing platform by the lake in Century Park Shanghai overlooking Mirror Sky Lake panoramic water view, natural wood deck with railings, peaceful lakeside scenery, landscape photography style&image_size=landscape_16_9',
              location: '梅花园',
              highlight: '四季花色与清新香气'
            }
          ]
        },
        '3': {
          id: '3',
          name: '复旦大学校园环线',
          description: '穿越复旦大学校园的文化跑步路线，感受百年学府的历史文化底蕴。',
          distance: 2.8,
          duration: 22,
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
          imageUrl: getRouteImageById('3'),
          rating: 4.4,
          reviewCount: 456,
          completionCount: 980,
          tags: ['校园', '文化', '安全'],
          weatherSuitability: ['晴天', '阴天'],
          bestTimeToRun: ['早晨 7:00-9:00', '下午 16:00-18:00'],
          safetyTips: ['注意上课时间人流', '避免穿越草坪', '遵守校园管理规定'],
          landmarks: ['光华楼', '图书馆', '相辉堂', '燕园', '体育馆'],
          facilities: ['饮水机', '休息区', '洗手间'],
          attractions: [
            {
              id: '3-1',
              name: '复旦校门',
              description: '复旦校门庄严肃穆，承载百年学府厚重历史。跑步起点，感受学术氛围与青春活力的交汇，是精神振奋与仪式感兼具的地标。',
              image: '/复旦大学/0.png',
              location: '复旦正门',
              highlight: '百年学府庄重校门'
            },
            {
              id: '3-2',
              name: '燕园湖畔',
              description: '燕园湖水碧波荡漾，湖畔垂柳与中式亭台相映成趣。环湖步道平缓，适合放松跑，欣赏江南园林的精致与宁静。',
              image: '/复旦大学/1.png',
              location: '燕园湖区',
              highlight: '江南园林湖光柳影'
            },
            {
              id: '3-3',
              name: '相辉堂草坪',
              description: '相辉堂前开阔草坪，古树与历史建筑环绕。适合短暂休息与拉伸，感受校园人文气息与青春活力，是校园跑的经典画面。',
              image: '/复旦大学/2.png',
              location: '相辉堂前',
              highlight: '古树历史建筑草坪'
            },
            {
              id: '3-4',
              name: '图书馆大道',
              description: '图书馆大道梧桐成荫，书香与树影交织。平整的步道适合节奏跑，感受知识殿堂的庄严与学术探索的氛围。',
              image: '/复旦大学/3.png',
              location: '图书馆大道',
              highlight: '梧桐书香知识殿堂'
            },
            {
              id: '3-5',
              name: '光华楼广场',
              description: '光华楼现代建筑前的开阔广场，玻璃幕墙反射晨光。适合冲刺与拍照，感受现代校园活力与创新精神，是校园跑的高潮终点。',
              image: '/复旦大学/4.png',
              location: '光华楼广场',
              highlight: '现代建筑晨光冲刺'
            }
          ]
        },
        '4': {
          id: '4',
          name: '中山公园樱花大道',
          description: '春季樱花盛开时的浪漫跑步路线，四季皆有不同的自然美景。',
          distance: 4.2,
          duration: 32,
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
          imageUrl: getRouteImageById('4'),
          rating: 4.6,
          reviewCount: 689,
          completionCount: 1200,
          tags: ['赏花', '摄影', '浪漫'],
          weatherSuitability: ['晴天', '微风'],
          bestTimeToRun: ['春季 3-4月', '秋季 9-10月'],
          safetyTips: ['花季人多注意避让', '防滑路段注意', '避免踩踏花草'],
          landmarks: ['樱花大道', '观景台', '荷花池', '竹林小径', '梅园'],
          facilities: ['饮水点', '休息区', '洗手间'],
          attractions: [
            {
              id: '4-1',
              name: '樱花大道入口',
              description: '800米樱花大道入口，春季粉色花海如隧道般覆盖。适合春季主题跑，拍照打卡与赏花体验，是浪漫与活力的象征。',
              image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=800-meter cherry blossom avenue in Zhongshan Park Shanghai, pink flower sea forming tunnel over path, spring season sakura trees in full bloom, romantic floral canopy, botanical photography style&image_size=landscape_16_9',
              location: '樱花大道入口',
              highlight: '粉色花海隧道'
            },
            {
              id: '4-2',
              name: '牡丹园春韵',
              description: '牡丹园典雅华贵，色彩丰富层次分明。春季花期时香气扑鼻，适合慢节奏赏花跑，感受国色天香的雍容华贵。',
              image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Elegant and noble peony garden in Zhongshan Park Shanghai, rich colorful peonies with distinct layers, spring blooming season, luxurious flower varieties, classical Chinese garden photography style&image_size=square',
              location: '牡丹园',
              highlight: '国色天香雍容'
            },
            {
              id: '4-3',
              name: '荷花池夏意',
              description: '夏季荷花池粉白荷花在碧绿荷叶间亭亭玉立。池边步道平缓，适合夏日清晨跑，感受出淤泥而不染的高洁意境。',
              image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Summer lotus pond in Zhongshan Park Shanghai, pink and white lotus flowers blooming among green lotus leaves, elegant lotus blossoms over water surface, peaceful pond scenery, botanical photography style&image_size=landscape_4_3',
              location: '荷花池',
              highlight: '出淤泥而不染'
            },
            {
              id: '4-4',
              name: '竹园幽静',
              description: '竹园幽静雅致，各种竹子形成天然氧吧。光影斑驳的步道适合冥想跑，在都市中感受山林般的宁静与清新。',
              image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tranquil bamboo garden in Zhongshan Park Shanghai, various bamboo species forming natural oxygen bar, dappled sunlight through bamboo leaves, peaceful forest atmosphere, nature photography style&image_size=portrait_4_3',
              location: '竹园',
              highlight: '天然氧吧幽静'
            },
            {
              id: '4-5',
              name: '儿童乐园活力',
              description: '儿童乐园色彩缤纷，充满欢声笑语。跑道环绕园区，适合家庭亲子跑，感受童真活力与天伦之乐的美好氛围。',
              image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Colorful children playground in Zhongshan Park Shanghai, vibrant play equipment with happy children playing, family-friendly recreational area, joyful atmosphere with laughter, playground photography style&image_size=landscape_4_3',
              location: '儿童乐园',
              highlight: '童真活力天伦'
            }
          ]
        },
        '5': {
          id: '5',
          name: '陆家嘴金融城环线',
          description: '穿梭在摩天大楼间的都市跑步路线，感受上海现代化金融中心的脉搏。',
          distance: 6.5,
          duration: 47,
          difficulty: 3,
          startPoint: '东方明珠',
          endPoint: '东方明珠',
          elevation: 25,
          routeType: '都市风光',
          features: ['摩天大楼', '都市风光', '现代化', '挑战性'],
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
          ],
          imageUrl: getRouteImageById('5'),
          rating: 4.4,
          reviewCount: 658,
          completionCount: 1100,
          tags: ['都市', '挑战', '金融区'],
          weatherSuitability: ['晴天', '阴天'],
          bestTimeToRun: ['傍晚 17:00-19:00', '夜晚 19:00-21:00'],
          safetyTips: ['注意车流和人流', '佩戴反光装备', '高处拍摄注意安全'],
          landmarks: ['东方明珠', '上海中心', '环球金融中心', '金茂大厦', '正大广场'],
          facilities: ['休息区', '洗手间', '饮水点'],
          attractions: [
            {
              id: '5-1',
              name: '东方明珠塔底',
              description: '东方明珠塔底仰视视角，球体设计独特壮观。城市地标打卡点，感受上海现代化象征的震撼，是城市跑的精神起点。',
              image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Shanghai Oriental Pearl Tower iconic landmark, unique sphere design reaching into clouds, modern architectural marvel, city landmark photography, upward perspective view&image_size=portrait_16_9',
              location: '东方明珠塔底',
              highlight: '球体设计城市地标'
            },
            {
              id: '5-2',
              name: '上海中心大厦',
              description: '上海中心大厦螺旋式上升建筑造型，中国第二高楼。现代建筑美学与工程奇迹，感受城市向上生长的力量与速度。',
              image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Shanghai Tower China second tallest building, spiral ascending architectural design, modern skyscraper engineering marvel, twisting glass facade reaching sky, architectural photography style&image_size=portrait_16_9',
              location: '上海中心大厦',
              highlight: '螺旋上升建筑奇迹'
            },
            {
              id: '5-3',
              name: '环球金融中心',
              description: '环球金融中心方正规整建筑，顶部梯形开口设计独特。现代商务氛围浓厚，感受金融城的快节奏与高效活力。',
              image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Shanghai World Financial Center square regular building, unique trapezoidal opening at top, modern business architecture, distinctive top design, financial district landmark&image_size=portrait_16_9',
              location: '环球金融中心',
              highlight: '梯形开口商务高效'
            },
            {
              id: '5-4',
              name: '金茂大厦',
              description: '金茂大厦融合中国传统元素的现代摩天大楼。建筑细节体现文化传承，感受现代与传统的和谐统一之美。',
              image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Jin Mao Tower Shanghai modern skyscraper incorporating traditional Chinese architectural elements, pagoda-inspired design elements, cultural heritage in modern architecture, upward perspective view&image_size=portrait_16_9',
              location: '金茂大厦',
              highlight: '传统元素现代融合'
            },
            {
              id: '5-5',
              name: '滨江大道江景',
              description: '滨江大道沿黄浦江景观大道，江风习习。跑步同时欣赏浦江两岸风光，感受上海独特的江海文化与开放胸怀。',
              image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Shanghai Riverside Avenue scenic boulevard along Huangpu River, river breeze and waterfront views, running path with city skyline views, Shanghai riverfront culture, urban landscape photography&image_size=landscape_16_9',
              location: '滨江大道',
              highlight: '黄浦江景江海文化'
            }
          ]
        },
        '6': {
          id: '6',
          name: '新天地历史文化路线',
          description: '结合历史与现代的文化跑步路线，体验上海独特的石库门建筑风情。',
          distance: 3.8,
          duration: 30,
          difficulty: 2,
          startPoint: '新天地',
          endPoint: '新天地',
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
          imageUrl: getRouteImageById('6'),
          rating: 4.6,
          reviewCount: 689,
          completionCount: 1350,
          tags: ['历史', '文化', '建筑'],
          weatherSuitability: ['晴天', '阴天'],
          bestTimeToRun: ['下午 15:00-18:00', '傍晚 18:00-20:00'],
          safetyTips: ['注意人流密集区', '留意自行车和车辆', '尊重社区居民'],
          landmarks: ['新天地石库门街区', '田子坊', '思南公馆', '复兴公园', '孙中山故居'],
          facilities: ['休息区', '洗手间', '饮水点'],
          attractions: [
            {
              id: '6-1',
              name: '石库门建筑',
              description: '典型上海石库门建筑，青砖灰瓦承载历史记忆。中西合璧的建筑风格独特，感受老上海的生活气息与文化传承。',
              image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Typical Shanghai Shikumen architecture Xinti Shanghai, gray brick and tile buildings carrying historical memory, traditional Chinese-Western fusion style, old Shanghai residential architecture, cultural heritage buildings&image_size=landscape_4_3',
              location: '石库门建筑群',
              highlight: '青砖灰瓦历史记忆'
            },
            {
              id: '6-2',
              name: '新天地北里',
              description: '新天地北里保留石库门外观，内部融合现代商业文化。历史与时尚碰撞，感受上海独特的文化包容与创新精神。',
              image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Xintiandi North Block Shanghai preserving Shikumen exterior appearance while integrating modern commercial culture inside, historical architecture with contemporary lifestyle, cultural fusion district&image_size=landscape_4_3',
              location: '新天地北里',
              highlight: '历史时尚文化碰撞'
            },
            {
              id: '6-3',
              name: '石库门博物馆',
              description: '石库门博物馆保存上世纪二三十年代石库门生活场景。沉浸式体验老上海生活方式，感受城市发展的历史脉络。',
              image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Shikumen Museum Shanghai preserving 1920s-1930s Shikumen living scenes, traditional Shanghai residential lifestyle exhibits, historical household items and interior decoration, cultural museum display&image_size=landscape_4_3',
              location: '石库门博物馆',
              highlight: '三十年代生活场景'
            },
            {
              id: '6-4',
              name: '太平桥公园',
              description: '太平桥公园都市绿色翡翠，人工湖与绿地相映。现代都市中的生态绿洲，感受城市更新中的自然和谐之美。',
              image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Taipingqiao Park Shanghai urban green emerald with artificial lake and green spaces reflecting each other, modern city ecological oasis, urban renewal nature harmony, peaceful park scenery&image_size=landscape_4_3',
              location: '太平桥公园',
              highlight: '都市绿洲生态和谐'
            },
            {
              id: '6-5',
              name: '老码头记忆',
              description: '老码头见证上海航运历史的古老码头建筑。工业遗存与现代艺术结合，感受上海从港口到国际都市的变迁历程。',
              image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Old Wharf Shanghai witnessing city shipping history, ancient dock buildings with industrial heritage combined with modern art, Shanghai port to international metropolis transformation, historical waterfront architecture&image_size=landscape_4_3',
              location: '老码头',
              highlight: '航运历史工业遗存'
            }
          ]
        }
      };

      const data = routeDataMap[routeId];
      setRoute(data || null);
      setLoading(false);
    } catch (error) {
      console.error('加载路线详情失败:', error);
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 1) return 'text-green-600 bg-green-100';
    if (difficulty === 2) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getDifficultyText = (difficulty: number) => {
    if (difficulty <= 1) return '简单';
    if (difficulty === 2) return '中等';
    return '困难';
  };

  const taskCardBg = (style: RouteTask['style']) => {
    switch (style) {
      case 'nature':
        return 'bg-gradient-to-br from-green-50 to-emerald-100';
      case 'urban':
        return 'bg-gradient-to-br from-blue-50 to-indigo-100';
      case 'cultural':
      default:
        return 'bg-gradient-to-br from-orange-50 to-red-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">未找到路线详情</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        {/* 顶部操作区：左侧返回，右侧开始导航 */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> 返回
          </button>
          <button
            onClick={() => id && navigate(`/route/${id}/navigation`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="开始导航"
          >
            <Navigation className="w-4 h-4" />
            开始导航
          </button>
        </div>

        {/* 顶部图片与基本信息 */}
        <div className="bg-white rounded-lg lg:rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="relative">
            <LazyImage
              src={getRouteImageById(route.id)}
              alt={route.name}
              className="w-full h-80 object-cover"
              placeholder="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop"
            />
            <div className="absolute top-4 left-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(route.difficulty)}`}>
                {getDifficultyText(route.difficulty)}
              </span>
            </div>
          </div>

          {/* 路线基本信息 */}
          <div className="space-y-6 p-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{route.name}</h1>
              <p className="text-gray-600 text-lg leading-relaxed">{route.description}</p>
            </div>

            {/* 评分和统计 */}
            <div className="flex items-center gap-6">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="ml-1 font-semibold">{route.rating}</span>
                <span className="ml-1 text-gray-500">({route.reviewCount}条评价)</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Users className="w-5 h-5 mr-1" />
                <span>{route.completionCount}人完成</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          <button
            className={`px-4 py-2 rounded-lg ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
            onClick={() => setActiveTab('overview')}
          >概览</button>
          <button
            className={`px-4 py-2 rounded-lg ${activeTab === 'attractions' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
            onClick={() => setActiveTab('attractions')}
          >沿途景点</button>
          <button
            className={`px-4 py-2 rounded-lg ${activeTab === 'tasks' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
            onClick={() => setActiveTab('tasks')}
          >探索任务</button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* 路线介绍 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">路线介绍</h2>
              <p className="text-gray-700 leading-relaxed">{route.description}</p>
            </div>

            {/* 路线特色 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">路线特色</h2>
              <div className="flex flex-wrap gap-2">
                {route.features?.map((feature, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-sm"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {/* 最佳时间 & 天气适宜性 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">最佳时间</h3>
                <ul className="space-y-2">
                  {route.bestTimeToRun?.map((time, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                      {time}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">天气适宜性</h3>
                <ul className="space-y-2">
                  {route.weatherSuitability?.map((weather, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <Thermometer className="w-4 h-4 mr-2 text-red-500" />
                      {weather}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 安全提示 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">安全提示</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {route.safetyTips?.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>

            {/* 周边设施 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">周边设施</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {route.facilities?.map((facility, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg text-gray-700">
                    {facility}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attractions' && (
          <div className="space-y-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">沿途景点</h2>
              <p className="text-gray-600">探索路线上的精彩景点，感受每个地方的独特魅力</p>
            </div>

            <div className="space-y-6">
              {route.attractions?.map((attraction) => (
                <div key={attraction.id} className="bg-white rounded-lg p-6 shadow-sm border">
                  <div className="flex gap-4">
                    <LazyImage
                      src={attraction.image}
                      alt={attraction.name}
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      placeholder="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-gray-900 mb-2">{attraction.name}</h4>
                      <p className="text-gray-600 leading-relaxed mb-2">{attraction.description}</p>
                      <div className="flex items-center text-gray-500 text-sm">
                        <MapPin className="w-4 h-4 mr-1" />
                        {attraction.location}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">探索任务</h2>
              <p className="text-gray-600">完成特色任务，获得独特的跑步体验和成就奖励</p>
            </div>

            {/* 任务卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.map(task => (
                <div key={task.id} className={`task-card ${taskCardBg(task.style)} p-6 rounded-xl`}>
                  <LazyImage
                    src={task.targetImage}
                    alt={task.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                    placeholder="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop"
                  />
                  <h4 className="text-xl font-bold mb-3">{task.title}</h4>
                  <p className="text-gray-700 mb-4">{task.description}</p>
                  <button 
                    className="btn-click w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                    onClick={() => {
                      document.body.style.transition = 'opacity 300ms ease-in-out';
                      document.body.style.opacity = '0.8';
                      setTimeout(() => {
                        navigate('/task-completion', { 
                          state: { 
                            task: {
                              id: task.id,
                              title: task.title,
                              description: task.description,
                              routeName: route.name,
                              routeId: route.id
                            }
                          }
                        });
                        document.body.style.opacity = '1';
                      }, 150);
                    }}
                  >
                    完成任务
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteDetail;