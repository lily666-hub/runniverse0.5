import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Navigation as NavIcon, MapPin, Sparkles } from 'lucide-react';
import { AmapLoader } from '../utils/amapLoader';
import { getTasksByRouteId } from '../data/routeTasks';

interface Attraction {
  id: string;
  name: string;
  description: string;
  image: string;
  location: string; // 关键字，用于PlaceSearch检索
  highlight: string;
}

interface RouteDataLite {
  id: string;
  name: string;
  coordinates: [number, number][];
  attractions?: Attraction[];
}

// 简化的路线数据提供（与详情页一致的id，坐标来自已有页面）
const getRouteById = (id: string): RouteDataLite | null => {
  const baseMap: Record<string, RouteDataLite> = {
    '1': {
      id: '1',
      name: '外滩滨江步道',
      coordinates: [
        [121.4944, 31.2397],
        [121.495, 31.24],
        [121.4952, 31.2401],
        [121.4954, 31.2402],
        [121.4956, 31.2403]
      ],
      attractions: [
        { id: '1', name: '外滩万国建筑群', description: '', image: '', location: '中山东一路', highlight: '' },
        { id: '2', name: '陆家嘴天际线', description: '', image: '', location: '陆家嘴', highlight: '' },
        { id: '3', name: '黄浦江夜景', description: '', image: '', location: '黄浦江', highlight: '' },
        { id: '4', name: '和平饭店', description: '', image: '', location: '和平饭店', highlight: '' },
        { id: '5', name: '十六铺码头', description: '', image: '', location: '十六铺码头', highlight: '' }
      ]
    },
    '2': {
      id: '2',
      name: '世纪公园环湖路线',
      coordinates: [
        [121.5569, 31.2196],
        [121.558, 31.22],
        [121.559, 31.219],
        [121.5585, 31.218],
        [121.5575, 31.2185],
        [121.5565, 31.219],
        [121.5569, 31.2196]
      ],
      attractions: [
        { id: '1', name: '湖心岛', description: '', image: '', location: '世纪公园湖心岛', highlight: '' },
        { id: '2', name: '观鸟台', description: '', image: '', location: '世纪公园观鸟台', highlight: '' },
        { id: '3', name: '樱花大道', description: '', image: '', location: '世纪公园樱花大道', highlight: '' }
      ]
    },
    '3': {
      id: '3', name: '复旦大学校园环线',
      coordinates: [
        [121.5033, 31.2989],
        [121.504, 31.2995],
        [121.5045, 31.3],
        [121.5035, 31.3005],
        [121.5025, 31.3],
        [121.502, 31.2995],
        [121.5033, 31.2989]
      ],
      attractions: [
        { id: '1', name: '相辉堂', description: '', image: '', location: '复旦大学相辉堂', highlight: '' },
        { id: '2', name: '图书馆', description: '', image: '', location: '复旦大学图书馆', highlight: '' },
        { id: '3', name: '光华楼', description: '', image: '', location: '复旦大学光华楼', highlight: '' }
      ]
    },
    '4': {
      id: '4', name: '中山公园樱花大道',
      coordinates: [
        [121.4222, 31.2231],
        [121.423, 31.224],
        [121.4235, 31.2245],
        [121.424, 31.225],
        [121.4235, 31.2255],
        [121.4225, 31.225],
        [121.4215, 31.224],
        [121.4222, 31.2231]
      ],
      attractions: [
        { id: '1', name: '樱花大道', description: '', image: '', location: '中山公园樱花大道', highlight: '' },
        { id: '2', name: '荷花池', description: '', image: '', location: '中山公园荷花池', highlight: '' }
      ]
    },
    '5': {
      id: '5', name: '陆家嘴金融城环线',
      coordinates: [
        [121.5057, 31.2396],
        [121.5065, 31.2401],
        [121.507, 31.2398],
        [121.5062, 31.2392],
        [121.5057, 31.2396]
      ],
      attractions: [
        { id: '1', name: '东方明珠', description: '', image: '', location: '东方明珠', highlight: '' },
        { id: '2', name: '国金中心', description: '', image: '', location: '上海国金中心', highlight: '' },
        { id: '3', name: '陆家嘴天桥', description: '', image: '', location: '陆家嘴环形天桥', highlight: '' }
      ]
    }
  };
  return baseMap[id] || null;
};

type Mode = 'attractions' | 'tasks';

const RouteNavigation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mode, setMode] = useState<Mode>('attractions');
  const [route, setRoute] = useState<RouteDataLite | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setRoute(getRouteById(id) || null);
  }, [id]);

  useEffect(() => {
    const init = async () => {
      if (!route || !mapRef.current) return;
      try {
        setIsLoading(true);
        await AmapLoader.loadAmap();
        // 确保加载PlaceSearch插件
        await new Promise<void>((resolve) => {
          if ((window as any).AMap?.PlaceSearch) {
            resolve();
          } else {
            (window as any).AMap?.plugin?.(['AMap.PlaceSearch'], () => resolve());
          }
        });
        // 创建地图
        const centerLng = route.coordinates.reduce((s, c) => s + c[0], 0) / route.coordinates.length;
        const centerLat = route.coordinates.reduce((s, c) => s + c[1], 0) / route.coordinates.length;
        mapInstanceRef.current = new window.AMap.Map(mapRef.current, {
          zoom: 14,
          center: [centerLng, centerLat],
          mapStyle: 'amap://styles/normal',
          showLabel: true
        });

        // 绘制路线
        const polyline = new window.AMap.Polyline({
          path: route.coordinates,
          strokeColor: '#3B82F6',
          strokeWeight: 4,
          strokeOpacity: 0.8,
          showDir: true
        });
        mapInstanceRef.current.add(polyline);
        mapInstanceRef.current.setFitView([polyline], false, [40, 40, 40, 40]);

        // 初次渲染沿途景点
        await renderMarkers('attractions');
        setIsLoading(false);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || '地图加载失败');
        setIsLoading(false);
      }
    };

    init();
    return () => {
      // 清理
      if (mapInstanceRef.current) {
        clearMarkers();
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [route]);

  const clearMarkers = () => {
    if (!mapInstanceRef.current) return;
    if (markersRef.current.length) {
      mapInstanceRef.current.remove(markersRef.current);
      markersRef.current = [];
    }
  };

  const placeSearch = (keyword: string): Promise<[number, number] | null> => {
    return new Promise((resolve) => {
      // @ts-ignore
      const ps = new window.AMap.PlaceSearch({ city: '上海', pageSize: 1 });
      ps.search(keyword, (status: string, result: any) => {
        if (status === 'complete' && result?.poiList?.pois?.length) {
          const poi = result.poiList.pois[0];
          if (poi?.location) {
            resolve([poi.location.lng, poi.location.lat]);
            return;
          }
        }
        resolve(null);
      });
    });
  };

  const renderMarkers = async (targetMode: Mode) => {
    if (!mapInstanceRef.current || !route) return;
    clearMarkers();

    const iconGen = (color: string, label?: string) => new window.AMap.Icon({
      size: new window.AMap.Size(28, 28),
      image: 'data:image/svg+xml;base64,' + btoa(`
        <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="12" fill="${color}" stroke="white" stroke-width="2" />
          ${label ? `<text x="14" y="18" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${label}</text>` : ''}
        </svg>
      `),
      imageSize: new window.AMap.Size(28, 28)
    });

    const items = targetMode === 'attractions' 
      ? (route.attractions || []).map((a) => ({ id: a.id, name: a.name, keyword: a.location }))
      : getTasksByRouteId(route.id).map((t, idx) => ({ id: t.id, name: t.title, keyword: t.targetLocation, label: String(idx + 1) }));

    for (const item of items) {
      const loc = await placeSearch(item.keyword);
      if (!loc) continue;
      const marker = new window.AMap.Marker({
        position: loc,
        icon: targetMode === 'attractions' ? iconGen('#10B981') : iconGen('#F59E0B', (item as any).label),
        title: item.name,
        offset: new window.AMap.Pixel(-14, -14)
      });

      // 信息窗
      const info = new window.AMap.InfoWindow({
        content: `<div style="padding:6px 8px;font-size:12px"><strong>${item.name}</strong><br/>${targetMode === 'attractions' ? '沿途景点' : '探索任务'}</div>`
      });
      marker.on('click', () => info.open(mapInstanceRef.current, marker.getPosition()));

      markersRef.current.push(marker);
    }
    if (markersRef.current.length) {
      mapInstanceRef.current.add(markersRef.current);
    }
  };

  const handleModeChange = async (m: Mode) => {
    setMode(m);
    await renderMarkers(m);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-600">
          <MapPin className="w-10 h-10 mx-auto mb-2" />
          <div className="font-medium">地图加载失败</div>
          <div className="text-sm mt-1">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        {/* 顶部操作区 */}
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" /> 返回
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleModeChange('attractions')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${mode === 'attractions' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              <NavIcon className="w-4 h-4" /> 沿途景点
            </button>
            <button
              onClick={() => handleModeChange('tasks')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${mode === 'tasks' ? 'bg-yellow-600 text-white border-yellow-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              <Sparkles className="w-4 h-4" /> 探索任务
            </button>
          </div>
        </div>

        {/* 标题 */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{route?.name || '地图导航'}</h1>
          <p className="text-gray-600 text-sm">切换模式以查看沿途景点或探索任务标记</p>
        </div>

        {/* 地图容器 */}
        <div ref={mapRef} className="w-full h-[520px] bg-white rounded-lg shadow-sm overflow-hidden" />

        {isLoading && (
          <div className="mt-4 text-gray-600">正在加载地图与标记...</div>
        )}
      </div>
    </div>
  );
};

export default RouteNavigation;