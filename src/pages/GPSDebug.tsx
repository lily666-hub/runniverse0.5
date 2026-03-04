import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Wifi, 
  Shield, 
  AlertTriangle, 
  RefreshCw, 
  Clock,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';
import { useGPS } from '../hooks/useGPS';
import IntelligentRunningMap from '../components/map/IntelligentRunningMap';

const GPSDebug: React.FC = () => {
  const {
    currentPosition,
    isTracking,
    accuracy,
    error,
    permissionStatus,
    connectionAttempts,
    initializeGPS,
    requestPermission,
    retryConnection
  } = useGPS();

  // 地图相关状态
  const mapRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [debugMetrics, setDebugMetrics] = useState<any>(null);

  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    // 收集调试信息
    const info = {
      userAgent: navigator.userAgent,
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
      geolocationSupported: 'geolocation' in navigator,
      permissionsSupported: 'permissions' in navigator,
      timestamp: new Date().toISOString()
    };
    setDebugInfo(info);
  }, []);

  // 地图事件处理函数
  const handleDebugUpdate = (metrics: any) => {
    setDebugMetrics(metrics);
    console.log('Debug metrics updated:', metrics);
  };

  const handleMapError = (error: { code: string; message: string; type: 'GPS_ERROR' | 'MAP_ERROR' | 'ROUTE_ERROR' | 'NETWORK_ERROR'; details?: any }) => {
    setMapError(error.message);
    console.error('Map error:', error);
  };

  const handlePositionUpdate = (position: { lat: number; lng: number; accuracy?: number }) => {
    console.log('Position updated from map:', position);
    // 可以与 useGPS hook 的位置信息进行对比
  };

  // 运行 GPS 测试时也测试地图组件
  const runGPSTest = () => {
    const testId = Date.now().toString();
    setTestResults(prev => [...prev, {
      id: testId,
      test: 'GPS连接测试',
      status: 'running',
      timestamp: Date.now(),
      details: { message: '正在测试GPS连接...' }
    }]);

    // 测试地图组件的 GPS 功能
    if (mapRef.current) {
      mapRef.current.startTracking?.();
    }

    setTimeout(() => {
      const success = isTracking && currentPosition;
      setTestResults(prev => prev.map(result => 
        result.id === testId ? {
          ...result,
          status: success ? 'success' : 'error',
          details: success ? {
            position: currentPosition,
            accuracy,
            connectionAttempts,
            mapMetrics: debugMetrics
          } : {
            error: typeof error === 'string' ? error : (error as any)?.message || '连接失败',
            connectionAttempts
          }
        } : result
      ));

      // 停止地图追踪
      if (mapRef.current) {
        mapRef.current.stopTracking?.();
      }
    }, 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'granted': return 'text-green-600 bg-green-50';
      case 'denied': return 'text-red-600 bg-red-50';
      case 'prompt': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getErrorMessage = (error: any) => {
    if (!error) return null;
    
    const errorMessages: { [key: number]: string } = {
      1: '用户拒绝了位置权限请求',
      2: '位置信息不可用',
      3: '获取位置信息超时'
    };

    return errorMessages[error.code] || error.message || '未知错误';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* 页面标题 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GPS调试工具</h1>
          <p className="text-gray-600">实时监控GPS状态和定位精度</p>
        </div>

        {/* 地图组件 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">实时地图调试</h2>
            <p className="text-sm text-gray-600 mt-1">显示GPS定位精度和信号质量</p>
          </div>
          <div className="p-6">
            {mapError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-red-700">地图错误: {mapError}</span>
                </div>
              </div>
            )}
            <div className="h-96 rounded-lg overflow-hidden">
              <IntelligentRunningMap
                ref={mapRef}
                mode="debug"
                initialCenter={currentPosition ? [currentPosition.lng, currentPosition.lat] : [121.4737, 31.2304]}
                initialZoom={16}
                className="w-full h-full"
                height="100%"
                width="100%"
                enableRealTimeTracking={true}
                enableVoiceNavigation={false}
                onLocationUpdate={handlePositionUpdate}
                onError={handleMapError}
              />
            </div>
            {debugMetrics && (
              <div className="mt-4 bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">地图调试信息</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">定位精度:</span>
                    <span className="ml-2 font-mono">{debugMetrics.accuracy?.toFixed(1)}m</span>
                  </div>
                  <div>
                    <span className="text-blue-600">信号强度:</span>
                    <span className="ml-2 font-mono">{debugMetrics.signalStrength || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">卫星数量:</span>
                    <span className="ml-2 font-mono">{debugMetrics.satelliteCount || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">更新频率:</span>
                    <span className="ml-2 font-mono">{debugMetrics.updateRate || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* GPS状态面板 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">GPS状态</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">连接状态</span>
                  {isTracking ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <p className={`font-semibold mt-1 ${isTracking ? 'text-green-600' : 'text-red-600'}`}>
                  {isTracking ? '已连接' : '未连接'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">权限状态</span>
                  <Shield className={`w-5 h-5 ${
                    permissionStatus === 'granted' ? 'text-green-500' : 
                    permissionStatus === 'denied' ? 'text-red-500' : 'text-yellow-500'
                  }`} />
                </div>
                <p className={`font-semibold mt-1 ${
                  permissionStatus === 'granted' ? 'text-green-600' : 
                  permissionStatus === 'denied' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {permissionStatus === 'granted' ? '已授权' : 
                   permissionStatus === 'denied' ? '已拒绝' : '待授权'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">定位精度</span>
                  <MapPin className="w-5 h-5 text-blue-500" />
                </div>
                <p className="font-semibold mt-1">
                  {accuracy ? `${accuracy.toFixed(1)}m` : 'N/A'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">尝试次数</span>
                  <RefreshCw className="w-5 h-5 text-blue-500" />
                </div>
                <p className="font-semibold mt-1">{connectionAttempts}</p>
              </div>
            </div>

            {/* 位置信息 */}
            {currentPosition && (
              <div className="mt-4 bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">当前位置</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-600">纬度:</span>
                    <span className="ml-2 font-mono">{currentPosition.lat.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="text-green-600">经度:</span>
                    <span className="ml-2 font-mono">{currentPosition.lng.toFixed(6)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 错误信息 */}
            {error && (
              <div className="mt-4 bg-red-50 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="font-semibold text-red-800">错误信息</h3>
                    <p className="text-red-700 mt-1">{getErrorMessage(error)}</p>
                    {error && typeof error === 'object' && 'code' in (error as object) && (
                      <p className="text-red-600 text-sm mt-1">错误代码: {(error as any).code}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 系统信息 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold mb-4">系统信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">HTTPS支持</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    debugInfo.isSecureContext ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {debugInfo.isSecureContext ? '是' : '否'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">协议</span>
                  <span className="font-mono text-sm">{debugInfo.protocol}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">地理定位API</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    debugInfo.geolocationSupported ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {debugInfo.geolocationSupported ? '支持' : '不支持'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">权限API</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    debugInfo.permissionsSupported ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {debugInfo.permissionsSupported ? '支持' : '不支持'}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-gray-600 mb-2">用户代理</div>
                <div className="bg-gray-50 rounded p-3 text-xs font-mono break-all">
                  {debugInfo.userAgent}
                </div>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold mb-4">操作</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={initializeGPS}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                重新初始化GPS
              </button>
              
              <button
                onClick={requestPermission}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <Shield className="w-4 h-4 mr-2" />
                请求权限
              </button>
              
              <button
                onClick={retryConnection}
                className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                <Wifi className="w-4 h-4 mr-2" />
                重试连接
              </button>
              
              <button
                onClick={runGPSTest}
                className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                <Clock className="w-4 h-4 mr-2" />
                运行测试
              </button>
            </div>
          </div>

          {/* 测试结果 */}
          {testResults.length > 0 && (
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">测试结果</h2>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{result.test}</span>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          result.status === 'success' ? 'bg-green-100 text-green-800' :
                          result.status === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {result.status === 'success' ? '成功' : 
                           result.status === 'error' ? '失败' : '运行中'}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-3 text-sm font-mono">
                      <pre>{JSON.stringify(result.details, null, 2)}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 故障排除指南 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">故障排除指南</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-blue-800">GPS无法连接</h3>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  <li>• 确保网站使用HTTPS协议</li>
                  <li>• 检查浏览器是否允许位置权限</li>
                  <li>• 确认设备GPS功能已开启</li>
                  <li>• 尝试在室外或窗边使用</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="font-semibold text-yellow-800">精度较低</h3>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  <li>• 移动到开阔区域</li>
                  <li>• 等待更长时间让GPS稳定</li>
                  <li>• 检查设备GPS设置</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-semibold text-red-800">权限被拒绝</h3>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  <li>• 点击地址栏的位置图标重新授权</li>
                  <li>• 清除浏览器缓存和Cookie</li>
                  <li>• 检查浏览器隐私设置</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GPSDebug;