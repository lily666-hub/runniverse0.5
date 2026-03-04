import React, { useState } from 'react';
import { FileText, Download, Share2, Calendar, TrendingUp, AlertTriangle, Shield, MapPin, Clock, Filter } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const SafetyReports: React.FC = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedType, setSelectedType] = useState<'all' | 'safety' | 'incidents' | 'routes'>('all');

  // 模拟报告数据
  const reports = [
    {
      id: '1',
      title: '2024年1月安全评估报告',
      type: 'safety',
      period: '2024-01',
      generatedAt: '2024-02-01',
      status: 'completed',
      summary: {
        totalRuns: 28,
        safetyScore: 8.7,
        incidents: 1,
        improvements: 3
      },
      downloadUrl: '#'
    },
    {
      id: '2',
      title: '外滩路线安全分析报告',
      type: 'routes',
      period: '2024-01',
      generatedAt: '2024-01-28',
      status: 'completed',
      summary: {
        routesAnalyzed: 5,
        averageSafety: 8.9,
        recommendations: 7,
        riskAreas: 2
      },
      downloadUrl: '#'
    },
    {
      id: '3',
      title: '安全事件分析报告',
      type: 'incidents',
      period: '2024-Q1',
      generatedAt: '2024-01-25',
      status: 'completed',
      summary: {
        totalIncidents: 3,
        resolvedIncidents: 3,
        averageResponseTime: '2.5分钟',
        preventionRate: '95%'
      },
      downloadUrl: '#'
    },
    {
      id: '4',
      title: '2024年度安全趋势报告',
      type: 'safety',
      period: '2024',
      generatedAt: '2024-01-20',
      status: 'generating',
      summary: null,
      downloadUrl: null
    }
  ];

  // 安全统计数据
  const safetyStats = {
    totalReports: 15,
    averageSafetyScore: 8.6,
    incidentReduction: 23,
    routeOptimization: 87
  };

  // 最新安全洞察
  const safetyInsights = [
    {
      type: 'improvement',
      title: '安全评分提升',
      description: '本月安全评分较上月提升了0.3分，主要得益于路线优化和安全意识提升。',
      impact: 'positive',
      date: '2024-01-30'
    },
    {
      type: 'warning',
      title: '夜间跑步风险',
      description: '数据显示夜间跑步（20:00-22:00）的安全风险较高，建议选择光线充足的路段。',
      impact: 'warning',
      date: '2024-01-28'
    },
    {
      type: 'recommendation',
      title: '路线推荐更新',
      description: '基于最新安全数据，为您推荐了3条新的高安全评分路线。',
      impact: 'info',
      date: '2024-01-25'
    }
  ];

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'safety': return <Shield className="h-5 w-5 text-green-600" />;
      case 'incidents': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'routes': return <MapPin className="h-5 w-5 text-blue-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getReportTypeName = (type: string) => {
    switch (type) {
      case 'safety': return '安全评估';
      case 'incidents': return '事件分析';
      case 'routes': return '路线分析';
      default: return '综合报告';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'generating': return '生成中';
      case 'failed': return '生成失败';
      default: return '未知';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'improvement': return '📈';
      case 'warning': return '⚠️';
      case 'recommendation': return '💡';
      default: return 'ℹ️';
    }
  };

  const getInsightColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const filteredReports = reports.filter(report => {
    if (selectedType === 'all') return true;
    return report.type === selectedType;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="bg-white rounded-lg border border-blue-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FileText className="mr-3 h-8 w-8 text-blue-600" />
                安全评估报告
              </h1>
              <p className="text-gray-600 mt-2">
                查看和下载您的跑步安全评估报告，了解安全趋势和改进建议
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">报告总数</div>
              <div className="font-medium text-blue-600">{safetyStats.totalReports} 份</div>
            </div>
          </div>
        </div>

        {/* 安全统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">平均安全评分</p>
                <p className="text-2xl font-bold text-green-600">{safetyStats.averageSafetyScore}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">事件减少率</p>
                <p className="text-2xl font-bold text-blue-600">{safetyStats.incidentReduction}%</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">路线优化率</p>
                <p className="text-2xl font-bold text-purple-600">{safetyStats.routeOptimization}%</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">报告总数</p>
                <p className="text-2xl font-bold text-orange-600">{safetyStats.totalReports}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有类型</option>
                <option value="safety">安全评估</option>
                <option value="incidents">事件分析</option>
                <option value="routes">路线分析</option>
              </select>
              
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="week">本周</option>
                <option value="month">本月</option>
                <option value="quarter">本季度</option>
                <option value="year">本年</option>
              </select>
            </div>
            
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="mr-2 h-4 w-4" />
              生成新报告
            </button>
          </div>
        </div>

        {/* 安全洞察 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
            最新安全洞察
          </h2>
          
          <div className="space-y-4">
            {safetyInsights.map((insight, index) => (
              <div key={index} className={`border rounded-lg p-4 ${getInsightColor(insight.impact)}`}>
                <div className="flex items-start">
                  <div className="text-2xl mr-3">{getInsightIcon(insight.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{insight.title}</h3>
                      <span className="text-sm text-gray-500">{insight.date}</span>
                    </div>
                    <p className="text-gray-700 text-sm">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 报告列表 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="mr-2 h-5 w-5 text-gray-600" />
            报告列表
          </h2>
          
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {getReportTypeIcon(report.type)}
                    <div className="ml-3">
                      <h3 className="font-medium text-gray-900">{report.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>{getReportTypeName(report.type)}</span>
                        <span>•</span>
                        <span>生成于 {report.generatedAt}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {getStatusText(report.status)}
                    </span>
                    
                    {report.status === 'completed' && (
                      <div className="flex space-x-1">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Download className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <Share2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {report.summary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
                    {Object.entries(report.summary).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{value}</div>
                        <div className="text-xs text-gray-500 capitalize">
                          {key === 'totalRuns' && '总跑步次数'}
                          {key === 'safetyScore' && '安全评分'}
                          {key === 'incidents' && '安全事件'}
                          {key === 'improvements' && '改进建议'}
                          {key === 'routesAnalyzed' && '分析路线'}
                          {key === 'averageSafety' && '平均安全'}
                          {key === 'recommendations' && '推荐数量'}
                          {key === 'riskAreas' && '风险区域'}
                          {key === 'totalIncidents' && '总事件数'}
                          {key === 'resolvedIncidents' && '已解决'}
                          {key === 'averageResponseTime' && '响应时间'}
                          {key === 'preventionRate' && '预防率'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {report.status === 'generating' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      报告生成中，预计还需要 3-5 分钟...
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {filteredReports.length === 0 && (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">暂无符合条件的报告</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SafetyReports;