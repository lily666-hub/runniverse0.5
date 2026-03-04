// 智能分析面板组件
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  MapPin, 
  Clock, 
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Users,
  Target,
  Zap
} from 'lucide-react';
import { aiService } from '../../services/ai';
import { useAuthStore } from '../../store/authStore';
import type { SafetyAnalysis, AIConversationStats } from '../../types/ai';

interface AnalysisPanelProps {
  className?: string;
  analysisType?: 'route' | 'behavior' | 'risk' | 'comprehensive';
  data?: any;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  className = '',
  analysisType = 'comprehensive',
  data,
}) => {
  const { user } = useAuthStore();
  const [analysis, setAnalysis] = useState<SafetyAnalysis | null>(null);
  const [conversationStats, setConversationStats] = useState<AIConversationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter'>('week');
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'trends' | 'recommendations'>('overview');

  useEffect(() => {
    if (user) {
      loadAnalysisData();
      loadConversationStats();
    }
  }, [user, analysisType, selectedTimeRange]);

  const loadAnalysisData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const analysisData = await aiService.performSafetyAnalysis(user.id, {
        type: analysisType,
        timeRange: selectedTimeRange,
        includeRecommendations: true,
        data: data,
      });
      setAnalysis(analysisData);
    } catch (error) {
      console.error('加载分析数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversationStats = async () => {
    if (!user) return;

    try {
      const stats = await aiService.getConversationStats(user.id);
      setConversationStats(stats);
    } catch (error) {
      console.error('加载对话统计失败:', error);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskLevelText = (level: string) => {
    switch (level) {
      case 'low':
        return '低风险';
      case 'medium':
        return '中等风险';
      case 'high':
        return '高风险';
      default:
        return '未知';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        请先登录以查看智能分析
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* 头部 */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">智能安全分析</h2>
              <p className="text-sm text-gray-600">AI驱动的个性化安全洞察</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* 时间范围选择 */}
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="week">最近一周</option>
              <option value="month">最近一月</option>
              <option value="quarter">最近三月</option>
            </select>
            
            <button
              onClick={loadAnalysisData}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>刷新</span>
            </button>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="flex space-x-8 px-6">
          {[
            { id: 'overview', name: '概览', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'details', name: '详细分析', icon: <Target className="w-4 h-4" /> },
            { id: 'trends', name: '趋势分析', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'recommendations', name: '建议', icon: <Zap className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                {tab.icon}
                <span>{tab.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600">正在分析数据...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 总体安全评分 */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">总体安全评分</h3>
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-600">基于AI分析</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className={`text-4xl font-bold mb-2 ${getScoreColor(analysis?.overallScore || 0)}`}>
                        {analysis?.overallScore || 0}
                      </div>
                      <div className="text-sm text-gray-600">总体评分</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${analysis?.overallScore || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(analysis?.riskLevel || 'low')}`}>
                        {getRiskLevelText(analysis?.riskLevel || 'low')}
                      </div>
                      <div className="text-sm text-gray-600 mt-2">风险等级</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        {analysis?.improvements || 0}
                      </div>
                      <div className="text-sm text-gray-600">改进建议</div>
                    </div>
                  </div>
                </div>

                {/* 关键指标 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="text-2xl font-bold text-green-600">
                        {analysis?.metrics?.safeRoutes || 0}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900">安全路线</h4>
                    <p className="text-sm text-gray-600">已识别的安全跑步路线</p>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      </div>
                      <span className="text-2xl font-bold text-yellow-600">
                        {analysis?.metrics?.riskAreas || 0}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900">风险区域</h4>
                    <p className="text-sm text-gray-600">需要注意的高风险区域</p>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-2xl font-bold text-blue-600">
                        {conversationStats?.totalConversations || 0}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900">AI对话</h4>
                    <p className="text-sm text-gray-600">与AI助手的对话次数</p>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Clock className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="text-2xl font-bold text-purple-600">
                        {analysis?.metrics?.avgResponseTime || 0}s
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900">响应时间</h4>
                    <p className="text-sm text-gray-600">平均AI响应时间</p>
                  </div>
                </div>

                {/* 最近活动 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">最近活动分析</h3>
                  <div className="space-y-3">
                    {analysis?.recentActivities?.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                        <div className={`p-2 rounded-lg ${
                          activity.type === 'safe' ? 'bg-green-100' :
                          activity.type === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          {activity.type === 'safe' ? (
                            <CheckCircle className={`w-4 h-4 ${
                              activity.type === 'safe' ? 'text-green-600' :
                              activity.type === 'warning' ? 'text-yellow-600' : 'text-red-600'
                            }`} />
                          ) : activity.type === 'warning' ? (
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{activity.title}</div>
                          <div className="text-sm text-gray-600">{activity.description}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    )) || (
                      <div className="text-center text-gray-500 py-4">
                        暂无最近活动数据
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* 详细分析内容 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 路线安全分析 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <MapPin className="w-5 h-5" />
                      <span>路线安全分析</span>
                    </h3>
                    <div className="space-y-3">
                      {analysis?.routeAnalysis?.map((route, index) => (
                        <div key={index} className="p-3 bg-white rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{route.name}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(route.riskLevel)}`}>
                              {getRiskLevelText(route.riskLevel)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">{route.description}</div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>距离: {route.distance}km</span>
                            <span>评分: {route.safetyScore}/100</span>
                            <span>使用次数: {route.usageCount}</span>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center text-gray-500 py-4">
                          暂无路线分析数据
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 行为模式分析 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>行为模式分析</span>
                    </h3>
                    <div className="space-y-3">
                      {analysis?.behaviorPatterns?.map((pattern, index) => (
                        <div key={index} className="p-3 bg-white rounded-lg">
                          <div className="font-medium text-gray-900 mb-1">{pattern.pattern}</div>
                          <div className="text-sm text-gray-600 mb-2">{pattern.description}</div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">频率: {pattern.frequency}</span>
                            <span className={`px-2 py-1 rounded-full font-medium ${
                              pattern.impact === 'positive' ? 'bg-green-100 text-green-700' :
                              pattern.impact === 'negative' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {pattern.impact === 'positive' ? '积极' :
                               pattern.impact === 'negative' ? '需改进' : '中性'}
                            </span>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center text-gray-500 py-4">
                          暂无行为模式数据
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'trends' && (
              <div className="space-y-6">
                {/* 趋势图表区域 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">安全趋势分析</h3>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>趋势图表功能开发中...</p>
                      <p className="text-sm">将显示安全评分、风险变化等趋势数据</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'recommendations' && (
              <div className="space-y-6">
                {/* AI建议 */}
                <div className="space-y-4">
                  {analysis?.recommendations?.map((rec, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          rec.priority === 'high' ? 'bg-red-100' :
                          rec.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                        }`}>
                          <Zap className={`w-5 h-5 ${
                            rec.priority === 'high' ? 'text-red-600' :
                            rec.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">{rec.title}</h4>
                          <p className="text-gray-600 mb-3">{rec.description}</p>
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {rec.priority === 'high' ? '高优先级' :
                               rec.priority === 'medium' ? '中优先级' : '低优先级'}
                            </span>
                            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                              查看详情
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-gray-500 py-8">
                      <Zap className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>暂无个性化建议</p>
                      <p className="text-sm">继续使用应用，AI将为您生成更多建议</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            最后更新: {analysis?.lastUpdated ? new Date(analysis.lastUpdated).toLocaleString() : '未知'}
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span>导出报告</span>
          </button>
        </div>
      </div>
    </div>
  );
};