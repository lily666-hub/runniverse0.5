import React, { useState, useRef } from 'react';
import { MapPin, Upload, Download, Trash2, Plus, FileText, AlertCircle } from 'lucide-react';
import { Waypoint, WaypointManagerProps, CSVWaypointData } from '../../types/navigation';

export const WaypointManager: React.FC<WaypointManagerProps> = ({
  waypoints,
  onWaypointsChange,
  onMapClick,
  maxWaypoints = 10,
  allowReorder = true,
  showUpload = true,
  showSamples = true
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSample, setSelectedSample] = useState<string>('bund_lujiazui');

  // 上海常见跑步示例路线（联网检索归纳的城市跑步点位集合）
  const SAMPLE_ROUTES: Record<string, { name: string; points: Waypoint[] }> = {
    bund_lujiazui: {
      name: '外滩→陆家嘴滨江线',
      points: [
        { id: 'sample-b1', name: '外滩起点', lat: 31.2397, lng: 121.4912, desc: '黄浦江畔外滩观景台', order: 0, category: 'start' },
        { id: 'sample-b2', name: '金陵东路渡口', lat: 31.2319, lng: 121.4979, desc: '过江连接点', order: 1, category: 'waypoint' },
        { id: 'sample-b3', name: '陆家嘴中心绿地', lat: 31.2353, lng: 121.5051, desc: '陆家嘴核心区', order: 2, category: 'waypoint' },
        { id: 'sample-b4', name: '浦东滨江大道', lat: 31.2406, lng: 121.5118, desc: '滨江步道', order: 3, category: 'waypoint' },
        { id: 'sample-b5', name: '东方明珠终点', lat: 31.2391, lng: 121.4997, desc: '东方明珠附近', order: 4, category: 'end' }
      ]
    },
    century_park_loop: {
      name: '世纪公园环线',
      points: [
        { id: 'sample-c1', name: '世纪公园南门', lat: 31.2154, lng: 121.5510, desc: '南门起点', order: 0, category: 'start' },
        { id: 'sample-c2', name: '湖畔步道', lat: 31.2179, lng: 121.5552, desc: '湖区东侧', order: 1, category: 'waypoint' },
        { id: 'sample-c3', name: '花园大道', lat: 31.2210, lng: 121.5519, desc: '北侧园路', order: 2, category: 'waypoint' },
        { id: 'sample-c4', name: '森林步道', lat: 31.2191, lng: 121.5475, desc: '西侧林荫道', order: 3, category: 'waypoint' },
        { id: 'sample-c5', name: '世纪公园南门', lat: 31.2154, lng: 121.5510, desc: '回到起点', order: 4, category: 'end' }
      ]
    },
    fudan_loop: {
      name: '复旦大学邯郸环校线',
      points: [
        { id: 'sample-f1', name: '正门起点', lat: 31.2977, lng: 121.5053, desc: '复旦邯郸校区正门', order: 0, category: 'start' },
        { id: 'sample-f2', name: '相辉堂', lat: 31.3010, lng: 121.5046, desc: '校园地标', order: 1, category: 'waypoint' },
        { id: 'sample-f3', name: '体育场', lat: 31.2990, lng: 121.5083, desc: '东侧跑道', order: 2, category: 'waypoint' },
        { id: 'sample-f4', name: '光华楼', lat: 31.2966, lng: 121.5039, desc: '南侧地标', order: 3, category: 'waypoint' },
        { id: 'sample-f5', name: '正门终点', lat: 31.2977, lng: 121.5053, desc: '回到起点', order: 4, category: 'end' }
      ]
    },
    riverside_huangpu: {
      name: '黄浦江滨江跑道',
      points: [
        { id: 'sample-h1', name: '十六铺码头', lat: 31.2335, lng: 121.4907, desc: '滨江起点', order: 0, category: 'start' },
        { id: 'sample-h2', name: '外白渡桥', lat: 31.2437, lng: 121.4867, desc: '历史桥梁', order: 1, category: 'waypoint' },
        { id: 'sample-h3', name: '乍浦路桥', lat: 31.2482, lng: 121.4888, desc: '北段步道', order: 2, category: 'waypoint' },
        { id: 'sample-h4', name: '北苏州路终点', lat: 31.2552, lng: 121.4912, desc: '终点', order: 3, category: 'end' }
      ]
    },
    lujiazui_riverside: {
      name: '陆家嘴滨江绿道',
      points: [
        { id: 'sample-l1', name: '东方明珠', lat: 31.2391, lng: 121.4997, desc: '起点', order: 0, category: 'start' },
        { id: 'sample-l2', name: '滨江绿地', lat: 31.2426, lng: 121.5087, desc: '东向步道', order: 1, category: 'waypoint' },
        { id: 'sample-l3', name: '浦东美术馆', lat: 31.2425, lng: 121.5138, desc: '文化地标', order: 2, category: 'waypoint' },
        { id: 'sample-l4', name: '陆家嘴金融城观景', lat: 31.2339, lng: 121.5132, desc: '南段', order: 3, category: 'waypoint' },
        { id: 'sample-l5', name: '小陆家嘴终点', lat: 31.2309, lng: 121.5090, desc: '终点', order: 4, category: 'end' }
      ]
    }
  };

  // 处理CSV文件上传
  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('CSV文件为空');
      }

      // 跳过标题行（如果存在）
      const dataLines = lines[0].includes('name') || lines[0].includes('名称') 
        ? lines.slice(1) 
        : lines;

      const newWaypoints: Waypoint[] = [];
      
      for (let i = 0; i < dataLines.length && i < maxWaypoints; i++) {
        const line = dataLines[i];
        const parts = line.split(',').map(part => part.trim().replace(/"/g, ''));
        
        if (parts.length < 3) {
          console.warn(`第${i + 1}行数据格式不正确，跳过: ${line}`);
          continue;
        }

        const [name, latStr, lngStr, desc = ''] = parts;
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);

        if (isNaN(lat) || isNaN(lng)) {
          console.warn(`第${i + 1}行坐标格式不正确，跳过: ${line}`);
          continue;
        }

        // 验证坐标范围（上海地区）
        if (lat < 30.5 || lat > 32.0 || lng < 120.5 || lng > 122.5) {
          console.warn(`第${i + 1}行坐标超出上海地区范围，跳过: ${line}`);
          continue;
        }

        newWaypoints.push({
          id: `csv-waypoint-${Date.now()}-${i}`,
          name: name || `点${i + 1}`,
          lat,
          lng,
          desc: desc || '',
          order: i,
          category: i === 0 ? 'start' : (i === dataLines.length - 1 ? 'end' : 'waypoint')
        });
      }

      if (newWaypoints.length === 0) {
        throw new Error('没有找到有效的途径点数据');
      }

      onWaypointsChange(newWaypoints);
      
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('CSV上传失败:', error);
      setUploadError(error instanceof Error ? error.message : '文件解析失败');
    } finally {
      setIsUploading(false);
    }
  };

  // 加载示例途径点（根据选择）
  const loadSampleWaypoints = () => {
    const data = SAMPLE_ROUTES[selectedSample];
    if (!data) return;
    onWaypointsChange(data.points);
    console.log('加载示例途径点:', data.name, data.points);
    setTimeout(() => {
      console.log('示例途径点已加载，触发地图更新');
    }, 100);
  };

  // 删除单个途径点
  const removeWaypoint = (waypointId: string) => {
    const newWaypoints = waypoints
      .filter(w => w.id !== waypointId)
      .map((w, index) => ({ ...w, order: index }));
    onWaypointsChange(newWaypoints);
  };

  // 清除所有途径点
  const clearAllWaypoints = () => {
    onWaypointsChange([]);
  };

  // 导出CSV
  const exportToCSV = () => {
    if (waypoints.length === 0) {
      alert('没有途径点可以导出');
      return;
    }

    const csvContent = [
      'name,latitude,longitude,description',
      ...waypoints.map(wp => 
        `"${wp.name}",${wp.lat},${wp.lng},"${wp.desc}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `waypoints_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 获取途径点状态颜色
  const getWaypointStatusColor = (waypoint: Waypoint, index: number) => {
    if (waypoint.category === 'start' || index === 0) return 'bg-green-500';
    if (waypoint.category === 'end' || index === waypoints.length - 1) return 'bg-red-500';
    return 'bg-blue-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-blue-600" />
          途径点管理
        </h3>
        <div className="flex items-center space-x-2">
          <span className={`text-sm px-2 py-1 rounded ${
            waypoints.length >= 2 
              ? 'bg-green-100 text-green-700' 
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {waypoints.length} / {maxWaypoints} 个点
          </span>
          {waypoints.length < 2 && (
            <span className="text-xs text-gray-500">至少需要2个点</span>
          )}
        </div>
      </div>

      {/* 控制按钮组 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {showSamples && (
          <>
            <select
              value={selectedSample}
              onChange={(e) => setSelectedSample(e.target.value)}
              className="px-2 py-2 border rounded-md text-sm"
              title="选择示例路线"
            >
              {Object.entries(SAMPLE_ROUTES).map(([key, value]) => (
                <option key={key} value={key}>{value.name}</option>
              ))}
            </select>
            <button
              onClick={loadSampleWaypoints}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              加载示例
            </button>
          </>
        )}
        
        {showUpload && (
          <label className={`flex items-center px-3 py-2 rounded-md cursor-pointer transition-colors text-sm ${
            isUploading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}>
            <Upload className="w-4 h-4 mr-1" />
            {isUploading ? '上传中...' : '上传CSV'}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleCSVUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        )}

        {waypoints.length > 0 && (
          <>
            <button
              onClick={exportToCSV}
              className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
            >
              <Download className="w-4 h-4 mr-1" />
              导出CSV
            </button>

            <button
              onClick={clearAllWaypoints}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              清除全部
            </button>
          </>
        )}
      </div>

      {/* 错误提示 */}
      {uploadError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
            <span className="text-sm text-red-700">{uploadError}</span>
            <button
              onClick={() => setUploadError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 途径点列表 */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {waypoints.map((waypoint, index) => (
          <div 
            key={waypoint.id} 
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center flex-1">
              {/* 序号标记 */}
              <div className={`w-6 h-6 rounded-full text-white text-xs flex items-center justify-center mr-3 ${
                getWaypointStatusColor(waypoint, index)
              }`}>
                {index + 1}
              </div>
              
              {/* 途径点信息 */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 truncate">
                  {waypoint.name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {waypoint.lat.toFixed(5)}, {waypoint.lng.toFixed(5)}
                </div>
                {waypoint.desc && (
                  <div className="text-xs text-gray-400 truncate mt-1">
                    {waypoint.desc}
                  </div>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center space-x-1 ml-2">
              <button
                onClick={() => removeWaypoint(waypoint.id)}
                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                title="删除途径点"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {waypoints.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm mb-2">还没有添加途径点</p>
          <p className="text-xs text-gray-400">
            点击地图添加途径点，或使用上方按钮加载示例/上传CSV文件
          </p>
        </div>
      )}

      {/* CSV格式说明 */}
      {showUpload && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start">
            <FileText className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">CSV文件格式说明：</p>
              <p>name,latitude,longitude,description</p>
              <p>外滩,31.2397,121.4912,起点</p>
              <p>人民广场,31.2277,121.4692,中转点</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};