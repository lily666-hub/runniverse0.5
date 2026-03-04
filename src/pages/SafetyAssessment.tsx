import React, { useState, useEffect } from 'react';
import { MapPin, Clock, TrendingUp, BarChart3, Calendar, Search, Filter, Bot } from 'lucide-react';
import { AnalysisPanel } from '../components/ai';

interface TimeSlot {
  hour: number;
  safetyScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
}

interface HistoricalData {
  date: string;
  averageScore: number;
  incidents: number;
  weather: string;
}

interface RouteAssessment {
  routeId: string;
  name: string;
  distance: number;
  safetyScore: number;
  estimatedTime: number;
  riskFactors: string[];
  recommendations: string[];
}

const SafetyAssessment: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState('人民广场');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { hour: 6, safetyScore: 92, riskLevel: 'low', description: '晨跑黄金时段，人流适中，照明良好' },
    { hour: 7, safetyScore: 95, riskLevel: 'low', description: '最佳跑步时间，安全系数最高' },
    { hour: 8, safetyScore: 88, riskLevel: 'low', description: '上班高峰期，人流密集但安全' },
    { hour: 18, safetyScore: 85, riskLevel: 'low', description: '下班时段，人流较多' },
    { hour: 19, safetyScore: 78, riskLevel: 'medium', description: '傍晚时段，光线渐暗' },
    { hour: 20, safetyScore: 72, riskLevel: 'medium', description: '夜晚开始，建议结伴跑步' },
    { hour: 21, safetyScore: 65, riskLevel: 'medium', description: '夜间跑步，需要额外注意安全' },
    { hour: 22, safetyScore: 58, riskLevel: 'high', description: '深夜时段，不建议单独跑步' }
  ]);

  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([
    { date: '2024-01-14', averageScore: 82, incidents: 0, weather: '晴' },
    { date: '2024-01-13', averageScore: 78, incidents: 1, weather: '多云' },
    { date: '2024-01-12', averageScore: 85, incidents: 0, weather: '晴' },
    { date: '2024-01-11', averageScore: 75, incidents: 2, weather: '雨' },
    { date: '2024-01-10', averageScore: 88, incidents: 0, weather: '晴' }
  ]);

  const [routeAssessments, setRouteAssessments] = useState<RouteAssessment[]>([
    {
      routeId: '1',
      name: '外滩滨江步道',
      distance: 3.2,
      safetyScore: 92,
      estimatedTime: 25,
      riskFactors: ['夜间照明不足'],
      recommendations: ['建议白天跑步', '携带照明设备']
    },
    {
      routeId: '2',
      name: '人民公园环线',
      distance: 2.8,
      safetyScore: 88,
      estimatedTime: 22,
      riskFactors: ['人流密集', '路面不平'],
      recommendations: ['避开高峰期', '注意脚下安全']
    },
    {
      routeId: '3',
      name: '世纪公园大道',
      distance: 5.0,
      safetyScore: 85,
      estimatedTime: 40,
      riskFactors: ['距离较长', '部分路段偏僻'],
      recommendations: ['结伴跑步', '携带通讯设备']
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
    setIsLoading(true);
    // 模拟API调用
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const getTimeSlotColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 border-green-300 text-green-800';
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'high': return 'bg-red-100 border-red-300 text-red-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTime = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">安全评估分析</h1>
          <p className="text-gray-600">基于大数据分析的智能安全评估系统</p>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择地点</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={selectedLocation}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="人民广场">人民广场</option>
                  <option value="外滩">外滩</option>
                  <option value="陆家嘴">陆家嘴</option>
                  <option value="世纪公园">世纪公园</option>
                  <option value="静安寺">静安寺</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择日期</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center">
                <Filter className="w-4 h-4 mr-2" />
                分析评估
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">正在分析安全数据...</p>
          </div>
        ) : (
          <>
            {/* 时间段安全评估 */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-purple-600" />
                时间段安全评估
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {timeSlots.map((slot) => (
                  <div
                    key={slot.hour}
                    className={`border-2 rounded-lg p-4 ${getTimeSlotColor(slot.riskLevel)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{formatTime(slot.hour)}</span>
                      <span className={`text-lg font-bold ${getScoreColor(slot.safetyScore)}`}>
                        {slot.safetyScore}
                      </span>
                    </div>
                    <p className="text-sm">{slot.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 历史数据趋势 */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                历史安全趋势
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">日期</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">平均安全分</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">安全事件</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">天气</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicalData.map((data, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{data.date}</td>
                        <td className={`py-3 px-4 font-semibold ${getScoreColor(data.averageScore)}`}>
                          {data.averageScore}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            data.incidents === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {data.incidents} 起
                          </span>
                        </td>
                        <td className="py-3 px-4">{data.weather}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 推荐路线评估 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                推荐路线评估
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {routeAssessments.map((route) => (
                  <div key={route.routeId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800">{route.name}</h3>
                      <span className={`text-lg font-bold ${getScoreColor(route.safetyScore)}`}>
                        {route.safetyScore}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{route.distance} km</span>
                        <Clock className="w-4 h-4 ml-4 mr-1" />
                        <span>{route.estimatedTime} 分钟</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">风险因素:</h4>
                      <div className="flex flex-wrap gap-1">
                        {route.riskFactors.map((factor, index) => (
                          <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">安全建议:</h4>
                      <div className="flex flex-wrap gap-1">
                        {route.recommendations.map((rec, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            {rec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI智能分析面板 */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <Bot className="w-5 h-5 mr-2 text-purple-600" />
                AI智能安全分析
              </h2>
              <AnalysisPanel />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SafetyAssessment;