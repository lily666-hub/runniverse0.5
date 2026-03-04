// 统一的路线图片资源管理

export const ROUTE_IMAGE_MAP: Record<string, string> = {
  '1': '/pictures/02e87f718b7dd727e33b83978a991d0c.jpg', // 外滩滨江步道
  '2': '/pictures/50f6f14614f17403c4b0d29d4af743e1.jpg', // 世纪公园环湖路线
  '3': '/pictures/da225bf28f0334c95151c819935a6e42.jpg', // 复旦大学校园环线
  '4': '/pictures/ac3471788ef1d034bfcdf5eff9e1b625.jpg', // 中山公园樱花大道
  '5': '/pictures/fccac75e5bc0f07dee76897c5d97f16b.jpg', // 陆家嘴金融城环线
  '6': '/pictures/aa040586e27ceb965b45871b2fbfe534.jpg', // 新天地历史文化路线
  '7': '/pictures/0f639b802cbd0353753406f442df117b.jpg', // 徐家汇公园绿道
};

export const FALLBACK_IMAGE = '/pictures/64fc30df6aca21cc10faafb324612951.jpg';

export const getRouteImageById = (id: string): string => {
  return ROUTE_IMAGE_MAP[id] ?? FALLBACK_IMAGE;
};

export const getRouteImageByName = (name: string): string => {
  const nameToId: Record<string, string> = {
    '外滩滨江步道': '1',
    '世纪公园环湖路线': '2',
    '复旦大学校园环线': '3',
    '中山公园樱花大道': '4',
    '陆家嘴金融城环线': '5',
    '新天地历史文化路线': '6',
    '徐家汇公园绿道': '7',
  };
  const id = nameToId[name];
  return id ? getRouteImageById(id) : FALLBACK_IMAGE;
};