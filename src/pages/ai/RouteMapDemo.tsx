// 智能体与地图集成演示页面
import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Navigation, Route, Compass, Star, Clock, TrendingUp, Shield, Play, Pause, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RouteMapIntegration } from '../../components/ai/RouteMapIntegration';
import { mapCommunicationBridge } from '../../services/mapCommunicationBridge';
import { useAuthStore } from '../../store/authStore';

const RouteMapDemo: React.FC = () => {
  const { user } = useAuthStore();
  const [isMapFrameLoaded, setIsMapFrameLoaded] = useState(false);
  const [communicationStatus, setCommunicationStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    // 初始化通信桥接
    initializeCommunication();

    return () => {
      // 清理资源
      mapCommunicationBridge.destroy();
    };
  }, []);

  const initializeCommunication = async () => {
    try {
      // 注册消息处理器
      mapCommunicationBridge.onMessage('NAVIGATION_STARTED', (data) => {
        console.log('导航已启动:', data);
        addTestResult('导航启动', true, '成功启动导航');
      });

      mapCommunicationBridge.onMessage('NAVIGATION_STOPPED', (data) => {
        console.log('导航已停止:', data);
        addTestResult('导航停止', true, '成功停止导航');
      });

      mapCommunicationBridge.onMessage('ROUTE_UPDATED', (data) => {
        console.log('路线已更新:', data);
        addTestResult('路线更新', true, '成功更新路线');
      });

      mapCommunicationBridge.onMessage('LOCATION_UPDATED', (data) => {
        console.log('位置已更新:', data);
        addTestResult('位置更新', true, `位置: ${data.latitude}, ${data.longitude}`);
      });

      setCommunicationStatus('connected');
    } catch (error) {
      console.error('通信初始化失败:', error);
      setCommunicationStatus('error');
    }
  };

  const addTestResult = (action: string, success: boolean, message: string) => {
    const result = {
      id: Date.now(),
      action,
      success,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [result, ...prev].slice(0, 10)); // 保留最近10条记录
  };

  const testCommunication = async () => {
    try {
      addTestResult('通信测试', true, '开始测试通信...');

      // 测试获取位置
      const location = await mapCommunicationBridge.getCurrentLocation();
      if (location) {
        addTestResult('位置获取', true, `获取到位置: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
      } else {
        addTestResult('位置获取', false, '无法获取位置');
      }

      // 测试路线推荐
      const testRoute = {
        startPoint: {
          latitude: 31.2304,
          longitude: 121.4737,
          address: '上海市中心'
        },
        endPoint: {
          latitude: 31.2404,
          longitude: 121.4837,
          address: '测试终点'
        },
        waypoints: [
          {
            latitude: 31.2354,
            longitude: 121.4787,
            name: '中途点1',
            description: '测试途径点'
          }
        ],
        routeType: 'safe' as const,
        distance: 5000,
        estimatedTime: 30,
        safetyScore: 85,
        description: '测试路线'
      };

      const startResult = await mapCommunicationBridge.startNavigation(testRoute);
      addTestResult('导航测试', startResult.success, startResult.message || '导航测试完成');

    } catch (error) {
      addTestResult('通信测试', false, error instanceof Error ? error.message : '测试失败');
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <MapPin className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">智能路线推荐演示</h2>
          <p className="text-gray-600 mb-6">请先登录以体验AI智能体与高德地图的集成功能</p>
          <Link
            to="/auth/login"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            立即登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/ai"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                返回AI主页
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">智能路线推荐演示</h1>
            </div>
            
            {/* 通信状态指示器 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  communicationStatus === 'connected' ? 'bg-green-500' :
                  communicationStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {communicationStatus === 'connected' ? '通信正常' :
                   communicationStatus === 'connecting' ? '连接中...' :
                   '通信异常'}
                </span>
              </div>
              
              <button
                onClick={testCommunication}
                className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                测试通信
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* 主要集成组件 */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">AI智能体 + 高德地图集成</h2>
                    <p className="text-gray-600 mt-1">体验智能路线推荐与实时地图导航的完美结合</p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Route className="w-4 h-4" />
                    <span>实时集成</span>
                  </div>
                </div>
              </div>
              
              {/* 集成组件 */}
              <RouteMapIntegration height="700px" />
            </div>
          </div>

          {/* 侧边栏 - 测试面板 */}
          <div className="xl:col-span-1 space-y-6">
            {/* 功能特性 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">集成特性</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 rounded-full p-1">
                    <Navigation className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">智能路线推荐</p>
                    <p className="text-sm text-gray-600">AI分析用户偏好生成个性化路线</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 rounded-full p-1">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">实时地图导航</p>
                    <p className="text-sm text-gray-600">高德地图提供精确导航服务</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 rounded-full p-1">
                    <Shield className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">安全评估</p>
                    <p className="text-sm text-gray-600">智能分析路线安全性</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-orange-100 rounded-full p-1">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">数据同步</p>
                    <p className="text-sm text-gray-600">智能体与地图实时通信</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 测试结果 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">测试日志</h3>
                <button
                  onClick={clearTestResults}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  清空
                </button>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">暂无测试记录</p>
                ) : (
                  testResults.map((result) => (
                    <div
                      key={result.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        result.success 
                          ? 'bg-green-50 border-green-400' 
                          : 'bg-red-50 border-red-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-gray-900">
                          {result.action}
                        </span>
                        <span className="text-xs text-gray-500">
                          {result.timestamp}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{result.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 技术说明 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">技术架构</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <span className="font-medium text-gray-900">前端:</span>
                  <p>React + TypeScript + Tailwind CSS</p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">地图:</span>
                  <p>高德地图 API 2.0</p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">AI:</span>
                  <p>智能体系统 + 路线推荐算法</p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">通信:</span>
                  <p>PostMessage + 事件驱动架构</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};