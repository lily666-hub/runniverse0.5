import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Shield, 
  Clock, 
  MapPin, 
  AlertTriangle,
  Download,
  Share2,
  Filter,
  Calendar,
  Eye
} from 'lucide-react';
import { useSafetyAnalysis } from '../../hooks/useSafetyAnalysis';
import SafetyAnalysisDashboard from '../../components/safety/SafetyAnalysisDashboard';

const SafetyAssessment: React.FC = () => {
  const {
    currentSafetyScore,
    routeAnalysis,
    timeSlotAnalysis,
    safetyRecommendations,
    riskHotspots,
    bestRunningTimes,
    isAnalyzing,
    error,
    refreshAnalysis
  } = useSafetyAnalysis();

  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('all');

  // 模拟数据 - 在实际应用中这些数据应该来自API
  const mockAssessmentData = {
    overallScore: currentSafetyScore?.overall || 85,
    totalRuns: 42,
    riskIncidents: 3,
    improvementTrend: 12
  };

  const getSafetyGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 60) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { grade: 'D', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const safetyGrade = getSafetyGrade(mockAssessmentData.overallScore);

  const handleExportReport = () => {
    // 实现报告导出功能
    console.log('导出安全评估报告');
  };

  const handleShareReport = () => {
    // 实现报告分享功能
    console.log('分享安全评估报告');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 页面标题和操作 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                <BarChart3 className="mr-3 text-blue-500" />
                安全评估报告
              </h1>
              <p className="text-gray-600">
                基于您的跑步数据和环境分析生成的个性化安全评估
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
              <button
                onClick={handleExportReport}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Download className="mr-2 h-4 w-4" />
                导出报告
              </button>
              <button
                onClick={handleShareReport}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Share2 className="mr-2 h-4 w-4" />
                分享报告
              </button>
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* 筛选器 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center">
              <Filter className="mr-2 h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 mr-3">筛选条件:</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">时间周期</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="week">最近一周</option>
                  <option value="month">最近一月</option>
                  <option value="quarter">最近三月</option>
                  <option value="year">最近一年</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">时间段</label>
                <select
                  value={selectedTimeSlot}
                  onChange={(e) => setSelectedTimeSlot(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部时间</option>
                  <option value="morning">早晨</option>
                  <option value="afternoon">下午</option>
                  <option value="evening">傍晚</option>
                  <option value="night">夜晚</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 总体安全评分 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <Shield className="mr-2 text-blue-500" />
            总体安全评分
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* 安全等级 */}
            <div className={`text-center p-6 rounded-lg ${safetyGrade.bg}`}>
              <div className={`text-4xl font-bold ${safetyGrade.color} mb-2`}>
                {safetyGrade.grade}
              </div>
              <div className="text-lg font-semibold text-gray-800">
                {mockAssessmentData.overallScore}/100
              </div>
              <div className="text-sm text-gray-600 mt-1">安全等级</div>
            </div>
            
            {/* 跑步次数 */}
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {mockAssessmentData.totalRuns}
              </div>
              <div className="text-sm text-gray-600">总跑步次数</div>
              <div className="text-xs text-blue-600 mt-1">
                {selectedPeriod === 'week' ? '本周' : 
                 selectedPeriod === 'month' ? '本月' : 
                 selectedPeriod === 'quarter' ? '本季度' : '本年'}
              </div>
            </div>
            
            {/* 风险事件 */}
            <div className="text-center p-6 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {mockAssessmentData.riskIncidents}
              </div>
              <div className="text-sm text-gray-600">风险事件</div>
              <div className="text-xs text-red-600 mt-1">需要关注</div>
            </div>
            
            {/* 改善趋势 */}
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2 flex items-center justify-center">
                <TrendingUp className="mr-1 h-6 w-6" />
                +{mockAssessmentData.improvementTrend}%
              </div>
              <div className="text-sm text-gray-600">安全改善</div>
              <div className="text-xs text-green-600 mt-1">较上期提升</div>
            </div>
          </div>
        </div>

        {/* 详细安全分析仪表板 */}
        <SafetyAnalysisDashboard 
          autoRefresh={false}
          className="space-y-6"
        />

        {/* 时间段分析（如果有数据） */}
        {timeSlotAnalysis.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <Clock className="mr-2 text-purple-500" />
              时间段安全分析
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {timeSlotAnalysis.map((data) => (
                <div key={data.timeSlot} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-800">
                      {getTimeSlotName(data.timeSlot)}
                    </span>
                    <span className={`px-2 py-1 rounded text-sm ${getSafetyScoreColor(data.safetyScore)}`}>
                      {data.safetyScore.toFixed(1)}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>跑步次数:</span>
                      <span>{data.totalRuns}次</span>
                    </div>
                    <div className="flex justify-between">
                      <span>事件数量:</span>
                      <span>{data.incidentCount}起</span>
                    </div>
                    <div className="flex justify-between">
                      <span>平均速度:</span>
                      <span>{data.averageSpeed.toFixed(1)} km/h</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 路线安全排名（如果有数据） */}
        {routeAnalysis && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <MapPin className="mr-2 text-green-500" />
              路线安全分析
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-800 mb-2">
                  {routeAnalysis.overallSafetyScore.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">路线安全分数</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600 mb-2">
                  {routeAnalysis.riskHotspots.length}
                </div>
                <div className="text-sm text-gray-600">风险热点</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {routeAnalysis.recommendations.length}
                </div>
                <div className="text-sm text-gray-600">优化建议</div>
              </div>
            </div>
          </div>
        )}

        {/* 个性化安全建议 */}
        {safetyRecommendations.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <Eye className="mr-2 text-blue-500" />
              个性化安全建议
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safetyRecommendations.map((recommendation, index) => (
                <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                      {index + 1}
                    </div>
                    <div className="text-sm text-gray-700">{recommendation}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 刷新按钮 */}
        <div className="text-center">
          <button
            onClick={refreshAnalysis}
            disabled={isAnalyzing}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {isAnalyzing ? '分析中...' : '刷新分析'}
          </button>
        </div>
      </div>
    </div>
  );
};

// 辅助函数
function getTimeSlotName(timeSlot: string): string {
  const names = {
    'early_morning': '清晨',
    'morning': '上午',
    'late_morning': '上午晚些',
    'afternoon': '下午',
    'evening': '傍晚',
    'night': '夜晚',
    'late_night': '深夜'
  };
  return names[timeSlot] || timeSlot;
}

function getSafetyScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-700';
  if (score >= 60) return 'bg-yellow-100 text-yellow-700';
  if (score >= 40) return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
}

export default SafetyAssessment;