import { RouteTask } from '../types/route';
import { getRouteImageById } from '../utils/imageResources';

// 每条路线的专属探索任务（差异化设计）
export const ROUTE_TASKS_MAP: Record<string, RouteTask[]> = {
  '1': [
    {
      id: '1-urban-1',
      routeId: '1',
      title: '和平饭店屋顶打卡',
      description: '找到和平饭店标志性的绿色金字塔屋顶，完成构图拍摄。',
      targetLocation: '和平饭店',
      targetImage: '/pictures/02e87f718b7dd727e33b83978a991d0c.jpg',
      style: 'urban',
      reward: '解锁“外滩文化探秘”徽章',
      difficulty: 'medium'
    },
    {
      id: '1-urban-2',
      routeId: '1',
      title: '陆家嘴夜景光影',
      description: '在外滩对岸拍摄陆家嘴天际线的夜景光影。',
      targetLocation: '十六铺码头',
      targetImage: '/pictures/a732a9d61e39ee26e446e29baf819e6d.jpg',
      style: 'urban',
      reward: '解锁“夜景猎手”徽章',
      difficulty: 'easy'
    },
    {
      id: '1-cultural-1',
      routeId: '1',
      title: '万国建筑群细节收集',
      description: '在外滩沿线，拍摄任意一处历史建筑的精美立面细节。',
      targetLocation: '外滩源',
      targetImage: '/pictures/bcf977b7626b697615b6c98027c929e0.jpg',
      style: 'cultural',
      reward: '解锁“建筑观察员”徽章',
      difficulty: 'medium'
    }
  ],
  '2': [
    {
      id: '2-nature-1',
      routeId: '2',
      title: '古银杏树合影',
      description: '在世纪公园古树群处找到银杏古树，与其合影上传。',
      targetLocation: '古树群',
      targetImage: '/pictures/50f6f14614f17403c4b0d29d4af743e1.jpg',
      style: 'nature',
      reward: '解锁“自然守护者”徽章',
      difficulty: 'easy'
    },
    {
      id: '2-nature-2',
      routeId: '2',
      title: '湖面倒影构图',
      description: '在湖畔拍摄一张包含树影与天空的倒影照片。',
      targetLocation: '湖心岛',
      targetImage: '/pictures/59a297b7573515da2122301022136e6e.jpg',
      style: 'nature',
      reward: '解锁“构图大师”徽章',
      difficulty: 'medium'
    },
    {
      id: '2-nature-3',
      routeId: '2',
      title: '鸟类观察记录',
      description: '在观鸟台记录你看到的任意一种鸟类（文字或照片）。',
      targetLocation: '观鸟台',
      targetImage: '/pictures/ea410ddb4b167884a426555574b38072.jpg',
      style: 'nature',
      reward: '解锁“自然观察者”徽章',
      difficulty: 'medium'
    }
  ],
  '3': [
    {
      id: '3-cultural-1',
      routeId: '3',
      title: '相辉堂建筑打卡',
      description: '拍摄相辉堂建筑的门楣或立面，记录人文细节。',
      targetLocation: '相辉堂',
      targetImage: '/复旦大学/5.png',
      style: 'cultural',
      reward: '解锁“校园人文探索”徽章',
      difficulty: 'easy'
    },
    {
      id: '3-urban-1',
      routeId: '3',
      title: '光华楼纵深透视',
      description: '在光华楼附近拍摄一张具有纵深感的透视照片。',
      targetLocation: '光华楼',
      targetImage: '/复旦大学/6.png',
      style: 'urban',
      reward: '解锁“构图新秀”徽章',
      difficulty: 'medium'
    },
    {
      id: '3-cultural-2',
      routeId: '3',
      title: '图书馆知识之旅',
      description: '以图书馆为背景，拍摄一张与你的跑步装备相关的创意照。',
      targetLocation: '图书馆',
      targetImage: '/复旦大学/7.png',
      style: 'cultural',
      reward: '解锁“知识跑者”徽章',
      difficulty: 'easy'
    }
  ],
  '4': [
    {
      id: '4-nature-1',
      routeId: '4',
      title: '樱花走廊打卡',
      description: '在樱花大道拍摄一张樱花拱廊的步道照片。',
      targetLocation: '樱花大道',
      targetImage: '/pictures/ac3471788ef1d034bfcdf5eff9e1b625.jpg',
      style: 'nature',
      reward: '解锁“春日记录者”徽章',
      difficulty: 'easy'
    },
    {
      id: '4-nature-2',
      routeId: '4',
      title: '四季色彩收集',
      description: '根据当前季节，拍摄一张能体现季节氛围的自然景观。',
      targetLocation: '观景台',
      targetImage: '/pictures/59a297b7573515da2122301022136e6e.jpg',
      style: 'nature',
      reward: '解锁“季节旅人”徽章',
      difficulty: 'medium'
    },
    {
      id: '4-cultural-1',
      routeId: '4',
      title: '摄影胜地构图挑战',
      description: '在热门拍摄点尝试三分法或对称构图，拍摄出一张佳作。',
      targetLocation: '荷花池',
      targetImage: '/pictures/a732a9d61e39ee26e446e29baf819e6d.jpg',
      style: 'cultural',
      reward: '解锁“构图达人”徽章',
      difficulty: 'medium'
    }
  ],
  '5': [
    {
      id: '5-urban-1',
      routeId: '5',
      title: '摩天楼反射写真',
      description: '寻找玻璃幕墙上的城市倒影，完成一次反射构图拍摄。',
      targetLocation: '国金中心',
      targetImage: '/pictures/fccac75e5bc0f07dee76897c5d97f16b.jpg',
      style: 'urban',
      reward: '解锁“城市镜面”徽章',
      difficulty: 'medium'
    },
    {
      id: '5-urban-2',
      routeId: '5',
      title: '天桥视角挑战',
      description: '登上天桥，从高处拍摄一张具有秩序感的街景。',
      targetLocation: '陆家嘴天桥',
      targetImage: '/pictures/a732a9d61e39ee26e446e29baf819e6d.jpg',
      style: 'urban',
      reward: '解锁“视角掌控者”徽章',
      difficulty: 'easy'
    },
    {
      id: '5-urban-3',
      routeId: '5',
      title: '夜晚光轨拍摄',
      description: '使用慢速快门拍摄车流光轨或人流轨迹，注意安全。',
      targetLocation: '东方明珠附近',
      targetImage: '/pictures/ea410ddb4b167884a426555574b38072.jpg',
      style: 'urban',
      reward: '解锁“光影行者”徽章',
      difficulty: 'hard'
    }
  ],
  '6': [
    {
      id: '6-cultural-1',
      routeId: '6',
      title: '石库门门楣细节',
      description: '拍摄石库门建筑的门楣或砖雕细节，感受历史风韵。',
      targetLocation: '新天地石库门街区',
      targetImage: '/pictures/aa040586e27ceb965b45871b2fbfe534.jpg',
      style: 'cultural',
      reward: '解锁“历史守望者”徽章',
      difficulty: 'easy'
    },
    {
      id: '6-cultural-2',
      routeId: '6',
      title: '田子坊涂鸦墙',
      description: '找到涂鸦墙并与艺术作品合影，上传完成任务。',
      targetLocation: '田子坊',
      targetImage: '/pictures/a732a9d61e39ee26e446e29baf819e6d.jpg',
      style: 'cultural',
      reward: '解锁“社区艺游者”徽章',
      difficulty: 'medium'
    },
    {
      id: '6-urban-1',
      routeId: '6',
      title: '历史门牌记录',
      description: '拍摄一块带有年代感的门牌或街牌，记录历史的痕迹。',
      targetLocation: '思南路沿线',
      targetImage: '/pictures/bcf977b7626b697615b6c98027c929e0.jpg',
      style: 'urban',
      reward: '解锁“时光记录者”徽章',
      difficulty: 'easy'
    }
  ]
};

export const getTasksByRouteId = (routeId: string): RouteTask[] => ROUTE_TASKS_MAP[routeId] || [];