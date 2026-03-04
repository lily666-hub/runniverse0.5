// 智能分析页面
import React, { useState } from 'react';
import { BarChart3, ArrowLeft, Filter, Calendar, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnalysisPanel } from '../../components/ai';

export const AnalysisPage: React.FC = () => {
  const [analysisType, setAnalysisType] = useState<'route' | 'behavior' | 'risk' | 'comprehensive'>('comprehensive');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week');

  const analysisTypes = [
    { id: 'comprehensive', name: '综合分析', description: '全面的安全状况分析' },
    { id: 'route', name: '路线分析', description: '跑步路线安全评估' },
    { id: 'behavior', name: '行为分析', description: '跑步行为模式分析' },
    { id: 'risk', name: '风险分析', description: '潜在风险识别和预警' },
  ];

  const timeRanges = [
    { id: 'week', name: '最近一周' },
    { id: 'month', name: '最近一月' },
    { id: 'quarter', name: '最近三月' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link
                to="/ai"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">智能安全分析</h1>
                  <p className="text-sm text-gray-600">AI驱动的个性化安全洞察和建议</p>
                </div>
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                <span>导出报告</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 分析配置区域 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* 分析类型选择 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">分析类型:</span>
              </div>
              <div className="flex space-x-2">
                {analysisTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setAnalysisType(type.id as any)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      analysisType === type.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={type.description}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 时间范围选择 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">时间范围:</span>
              </div>
              <div className="flex space-x-2">
                {timeRanges.map((range) => (
                  <button
                    key={range.id}
                    onClick={() => setTimeRange(range.id as any)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      timeRange === range.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 分析类型说明 */}
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              {analysisTypes.find(t => t.id === analysisType)?.name}
            </h3>
            <p className="text-blue-800 text-sm">
              {analysisTypes.find(t => t.id === analysisType)?.description}
            </p>
          </div>
        </div>

        {/* 分析面板 */}
        <AnalysisPanel 
          className="w-full"
          analysisType={analysisType}
          data={{
            timeRange,
            // 可以传递其他分析所需的数据
          }}
        />
      </div>
    </div>
  );
};