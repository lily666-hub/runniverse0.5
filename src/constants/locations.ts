// 常用位置配置
export interface PresetLocation {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  category: 'university' | 'landmark' | 'park' | 'commercial';
}

export const PRESET_LOCATIONS: PresetLocation[] = [
  // 大学校区
  {
    id: 'fudan-jiangwan',
    name: '复旦大学江湾校区',
    description: '复旦大学江湾校区主入口',
    lat: 31.3346,
    lng: 121.5019,
    category: 'university'
  },
  {
    id: 'fudan-handan',
    name: '复旦大学邯郸校区',
    description: '复旦大学邯郸校区',
    lat: 31.2989,
    lng: 121.5033,
    category: 'university'
  },
  {
    id: 'sjtu-minhang',
    name: '上海交通大学闵行校区',
    description: '上海交通大学闵行校区',
    lat: 31.0249,
    lng: 121.4338,
    category: 'university'
  },
  {
    id: 'tongji-siping',
    name: '同济大学四平路校区',
    description: '同济大学四平路校区',
    lat: 31.2818,
    lng: 121.5045,
    category: 'university'
  },
  
  // 上海地标
  {
    id: 'peoples-square',
    name: '人民广场',
    description: '上海市中心人民广场',
    lat: 31.2317,
    lng: 121.4753,
    category: 'landmark'
  },
  {
    id: 'lujiazui',
    name: '陆家嘴',
    description: '陆家嘴金融中心',
    lat: 31.2397,
    lng: 121.4994,
    category: 'landmark'
  },
  {
    id: 'the-bund',
    name: '外滩',
    description: '上海外滩',
    lat: 31.2396,
    lng: 121.4906,
    category: 'landmark'
  },
  
  // 公园
  {
    id: 'century-park',
    name: '世纪公园',
    description: '世纪公园主入口',
    lat: 31.2198,
    lng: 121.5531,
    category: 'park'
  },
  {
    id: 'zhongshan-park',
    name: '中山公园',
    description: '中山公园',
    lat: 31.2225,
    lng: 121.4194,
    category: 'park'
  },
  {
    id: 'fuxing-park',
    name: '复兴公园',
    description: '复兴公园',
    lat: 31.2206,
    lng: 121.4661,
    category: 'park'
  },
  
  // 商业区
  {
    id: 'nanjing-road',
    name: '南京路步行街',
    description: '南京路步行街',
    lat: 31.2342,
    lng: 121.4753,
    category: 'commercial'
  },
  {
    id: 'xintiandi',
    name: '新天地',
    description: '上海新天地',
    lat: 31.2196,
    lng: 121.4753,
    category: 'commercial'
  }
];

// 根据分类获取位置
export const getLocationsByCategory = (category: PresetLocation['category']): PresetLocation[] => {
  return PRESET_LOCATIONS.filter(location => location.category === category);
};

// 根据ID获取位置
export const getLocationById = (id: string): PresetLocation | undefined => {
  return PRESET_LOCATIONS.find(location => location.id === id);
};

// 获取最近的位置
export const getNearestLocation = (lat: number, lng: number): PresetLocation | null => {
  if (PRESET_LOCATIONS.length === 0) return null;
  
  let nearest = PRESET_LOCATIONS[0];
  let minDistance = calculateDistance(lat, lng, nearest.lat, nearest.lng);
  
  for (let i = 1; i < PRESET_LOCATIONS.length; i++) {
    const distance = calculateDistance(lat, lng, PRESET_LOCATIONS[i].lat, PRESET_LOCATIONS[i].lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = PRESET_LOCATIONS[i];
    }
  }
  
  return nearest;
};

// 计算两点间距离（米）
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // 地球半径（米）
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}