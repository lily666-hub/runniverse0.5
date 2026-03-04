import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Clock, Route, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { RouteAgent } from './agents/RouteAgent';
import { mapCommunicationBridge } from '../../services/mapCommunicationBridge';

// 类型定义
interface TestResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  timestamp: Date;
}

interface CommunicationStatus {
  isConnected: boolean;
  mapFrameLoaded: boolean;
  lastHeartbeat?: Date;
}

interface RouteRecommendation {
  startPoint: { lat: number; lng: number; name: string };
  endPoint: { lat: number; lng: number; name: string };
  waypoints?: Array<{ lat: number; lng: number; name: string }>;
  routeType: 'running' | 'walking' | 'cycling';
  distance: number;
  estimatedTime: number;
  safetyScore: number;
  features: string[];
  reason: string;
}

const RouteMapDemo: React.FC = () => {
  const [communicationStatus, setCommunicationStatus] = useState<CommunicationStatus>({
    isConnected: false,
    mapFrameLoaded: false
  });
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isTestingInProgress, setIsTestingInProgress] = useState(false);
  const [routeRecommendation, setRouteRecommendation] = useState<RouteRecommendation | null>(null);
  
  const mapFrameRef = useRef<HTMLIFrameElement>(null);

  // 添加测试结果
  const addTestResult = (test: string, status: 'success' | 'error' | 'warning', message: string) => {
    const result: TestResult = {
      test,
      status,
      message,
      timestamp: new Date()
    };
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // 保留最新10条
  };

  // 初始化通信
  useEffect(() => {
    const initCommunication = async () => {
      try {
        // 注册消息处理器
        mapCommunicationBridge.onMessage('mapReady', () => {
          setCommunicationStatus(prev => ({ ...prev, mapFrameLoaded: true }));
          addTestResult('地图初始化', 'success', '3.0.html地图组件已加载完成');
          
          // 地图加载完成后自动获取位置
          setTimeout(() => {
            testGetLocation();
          }, 1000);
        });

        mapCommunicationBridge.onMessage('locationUpdate', (data: any) => {
          setCurrentLocation(data.location);
          addTestResult('位置更新', 'success', `获取到位置: ${data.location.lat}, ${data.location.lng}`);
        });

        mapCommunicationBridge.onMessage('routeCalculated', (data: any) => {
          addTestResult('路线计算', 'success', `路线计算完成，距离: ${data.distance}米`);
        });

        setCommunicationStatus(prev => ({ ...prev, isConnected: true }));
        addTestResult('通信初始化', 'success', '通信桥接已建立');
      } catch (error) {
        addTestResult('通信初始化', 'error', `初始化失败: ${error}`);
      }
    };

    initCommunication();

    return () => {
      mapCommunicationBridge.destroy();
    };
  }, []);

  // 测试获取当前位置
  const testGetLocation = async () => {
    try {
      addTestResult('位置测试', 'warning', '正在获取当前位置...');
      const location = await mapCommunicationBridge.getCurrentLocation();
      if (location) {
        setCurrentLocation({ lat: location.latitude, lng: location.longitude });
        addTestResult('位置测试', 'success', `位置获取成功: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
      } else {
        addTestResult('位置测试', 'error', '位置获取失败');
      }
    } catch (error) {
      addTestResult('位置测试', 'error', `位置获取失败: ${error}`);
    }
  };

  // 测试路线推荐
  const testRouteRecommendation = async () => {
    if (!currentLocation) {
      addTestResult('路线推荐', 'error', '请先获取当前位置');
      return;
    }

    try {
      addTestResult('路线推荐', 'warning', '正在生成路线推荐...');
      
      // 模拟智能体推荐
      const mockRecommendation: RouteRecommendation = {
        startPoint: { 
          lat: currentLocation.lat, 
          lng: currentLocation.lng, 
          name: '当前位置' 
        },
        endPoint: { 
          lat: currentLocation.lat + 0.01, 
          lng: currentLocation.lng + 0.01, 
          name: '推荐终点' 
        },
        routeType: 'running',
        distance: 1200,
        estimatedTime: 8,
        safetyScore: 85,
        features: ['安全路段', '景观优美', '空气质量好'],
        reason: '基于您的跑步习惯和安全偏好推荐'
      };

      setRouteRecommendation(mockRecommendation);
      
      // 转换为地图数据格式
      const routeData = {
        startPoint: {
          latitude: mockRecommendation.startPoint.lat,
          longitude: mockRecommendation.startPoint.lng,
          address: mockRecommendation.startPoint.name
        },
        endPoint: {
          latitude: mockRecommendation.endPoint.lat,
          longitude: mockRecommendation.endPoint.lng,
          address: mockRecommendation.endPoint.name
        },
        routeType: 'safe' as const,
        distance: mockRecommendation.distance,
        estimatedTime: mockRecommendation.estimatedTime,
        safetyScore: mockRecommendation.safetyScore,
        description: mockRecommendation.reason
      };

      // 发送路线到地图
      await mapCommunicationBridge.updateRoute(routeData);

      addTestResult('路线推荐', 'success', '路线推荐已生成并发送到地图');
    } catch (error) {
      addTestResult('路线推荐', 'error', `路线推荐失败: ${error}`);
    }
  };

  // 测试导航功能
  const testNavigation = async () => {
    if (!routeRecommendation) {
      addTestResult('导航测试', 'error', '请先生成路线推荐');
      return;
    }

    try {
      addTestResult('导航测试', 'warning', '正在启动导航...');
      
      const routeData = {
        startPoint: {
          latitude: routeRecommendation.startPoint.lat,
          longitude: routeRecommendation.startPoint.lng,
          address: routeRecommendation.startPoint.name
        },
        endPoint: {
          latitude: routeRecommendation.endPoint.lat,
          longitude: routeRecommendation.endPoint.lng,
          address: routeRecommendation.endPoint.name
        },
        routeType: 'safe' as const,
        distance: routeRecommendation.distance,
        estimatedTime: routeRecommendation.estimatedTime,
        safetyScore: routeRecommendation.safetyScore,
        description: routeRecommendation.reason
      };

      await mapCommunicationBridge.startNavigation(routeData);
      addTestResult('导航测试', 'success', '导航已启动');
    } catch (error) {
      addTestResult('导航测试', 'error', `导航启动失败: ${error}`);
    }
  };

  // 运行完整测试
  const runFullTest = async () => {
    setIsTestingInProgress(true);
    setTestResults([]);
    
    try {
      await testGetLocation();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testRouteRecommendation();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testNavigation();
      
      addTestResult('完整测试', 'success', '所有测试完成');
    } catch (error) {
      addTestResult('完整测试', 'error', `测试过程中出现错误: ${error}`);
    } finally {
      setIsTestingInProgress(false);
    }
  };

  // RouteAgent回调处理
  const handleRouteRecommendation = async (recommendation: any) => {
    try {
      // 转换智能体推荐为地图数据
      const routeData = mapCommunicationBridge.convertAgentRecommendationToRoute(recommendation, currentLocation);
      await mapCommunicationBridge.updateRoute(routeData);
      
      setRouteRecommendation(recommendation);
      addTestResult('智能体推荐', 'success', '智能体路线推荐已应用到地图');
    } catch (error) {
      addTestResult('智能体推荐', 'error', `应用推荐失败: ${error}`);
    }
  };

  const handleLocationUpdate = (location: any) => {
    setCurrentLocation(location);
    addTestResult('位置更新', 'success', '智能体位置已更新');
  };

  const getStatusIcon = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">智能体与地图集成演示</h1>
        <p className="text-gray-600">测试RouteAgent智能体与3.0.html高德地图的集成功能</p>
      </div>

      {/* 通信状态 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            通信状态
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                communicationStatus.isConnected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {communicationStatus.isConnected ? "已连接" : "未连接"}
              </span>
              <span className="text-sm text-gray-600">通信桥接</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                communicationStatus.mapFrameLoaded 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {communicationStatus.mapFrameLoaded ? "已加载" : "加载中"}
              </span>
              <span className="text-sm text-gray-600">地图组件</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 智能体面板 */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Route className="w-5 h-5" />
              RouteAgent 智能体
            </h3>
          </div>
          <div className="p-4">
            <RouteAgent
              userLocation={currentLocation ? {
                latitude: currentLocation.lat,
                longitude: currentLocation.lng,
                address: `位置: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
              } : undefined}
              onRouteRecommendation={handleRouteRecommendation}
              onLocationUpdate={handleLocationUpdate}
              userPreferences={{
                preferredDistance: 5,
                preferredTerrain: 'mixed',
                safetyPriority: 'high',
                timeOfDay: 'morning',
                avoidAreas: []
              }}
            />
          </div>
        </div>

        {/* 测试控制面板 */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              测试控制
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={testGetLocation} 
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                获取位置
              </button>
              <button 
                onClick={testRouteRecommendation} 
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                路线推荐
              </button>
              <button 
                onClick={testNavigation} 
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                启动导航
              </button>
              <button 
                onClick={runFullTest} 
                disabled={isTestingInProgress}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  isTestingInProgress 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isTestingInProgress ? '测试中...' : '完整测试'}
              </button>
            </div>

            {/* 当前位置 */}
            {currentLocation && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center text-sm text-blue-800">
                  <MapPin className="w-4 h-4 mr-2" />
                  当前位置: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </div>
              </div>
            )}

            {/* 路线推荐信息 */}
            {routeRecommendation && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-start text-sm text-green-800">
                  <Route className="w-4 h-4 mr-2 mt-0.5" />
                  <div className="space-y-1">
                    <div>推荐路线: {routeRecommendation.distance}米</div>
                    <div>预计时间: {routeRecommendation.estimatedTime}分钟</div>
                    <div>安全评分: {routeRecommendation.safetyScore}/100</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 地图容器 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">高德地图 (3.0.html)</h3>
        </div>
        <div className="p-4">
          <div className="w-full h-96 border rounded-lg overflow-hidden">
            <iframe
              ref={mapFrameRef}
              src="/3.0.html"
              className="w-full h-full"
              title="高德地图"
              onLoad={() => {
                setCommunicationStatus(prev => ({ ...prev, mapFrameLoaded: true }));
                addTestResult('地图加载', 'success', '3.0.html已加载');
              }}
            />
          </div>
        </div>
      </div>

      {/* 测试结果 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Clock className="w-5 h-5" />
            测试结果
          </h3>
        </div>
        <div className="p-4">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-center py-4">暂无测试结果</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{result.test}</span>
                      <span className="text-xs text-gray-500">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteMapDemo;