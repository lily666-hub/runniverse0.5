import React, { useState } from 'react';
import { 
  Shield, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useSafetyAnalysis } from '../../hooks/useSafetyAnalysis';
import { TimeSlot } from '../../types';

interface SafetyAnalysisDashboardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const SafetyAnalysisDashboard: React.FC<SafetyAnalysisDashboardProps> = ({
  className = '',
  autoRefresh = true,
  refreshInterval = 30000 // 30秒
}) => {
  const {
    currentSafetyScore,
    routeAnalysis,
    timeSlotAnalysis,
    safetyRecommendations,
    riskHotspots,
    bestRunningTimes,
    isAnalyzing,
    error,
    clearError,
    refreshAnalysis
  } = useSafetyAnalysis(undefined, autoRefresh ? refreshInterval : undefined);

  const [expandedSections, setExpandedSections] = useState({
    timeSlots: true,
    hotspots: false,
    recommendations: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getSafetyColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getSafetyLevel = (score: number) => {
    if (score >= 80) return '非常安全';
    if (score >= 60) return '较安全';
    if (score >= 40) return '一般';
    return '需谨慎';
  };

  const getTimeSlotIcon = (timeSlot: TimeSlot) => {
    const icons = {
      'early_morning': '🌅',
      'morning': '☀️',
      'late_morning': '🌤️',
      'afternoon': '🌞',
      'evening': '🌇',
      'night': '🌙',
      'late_night': '🌚'
    };
    return icons[timeSlot] || '⏰';
  };

  const getRiskLevelColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 实时安全评估 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Shield className="mr-2 text-blue-500" />
            实时安全评估
          </h2>
          <button
            onClick={refreshAnalysis}
            disabled={isAnalyzing}
            className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isAnalyzing ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>

        {currentSafetyScore ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg border ${getSafetyColor(currentSafetyScore.overall)}`}>
              <div className="text-2xl font-bold">{currentSafetyScore.overall.toFixed(1)}</div>
              <div className="text-sm">综合安全分数</div>
              <div className="text-xs mt-1">{getSafetyLevel(currentSafetyScore.overall)}</div>
            </div>
            
            <div className={`p-4 rounded-lg border ${getSafetyColor(currentSafetyScore.factors.timeOfDay)}`}>
              <div className="text-2xl font-bold">{currentSafetyScore.factors.timeOfDay.toFixed(1)}</div>
              <div className="text-sm">时间段安全</div>
            </div>
            
            <div className={`p-4 rounded-lg border ${getSafetyColor(currentSafetyScore.factors.lighting)}`}>
              <div className="text-2xl font-bold">{currentSafetyScore.factors.lighting.toFixed(1)}</div>
              <div className="text-sm">位置安全</div>
            </div>
            
            <div className={`p-4 rounded-lg border ${getSafetyColor(currentSafetyScore.factors.weatherCondition)}`}>
              <div className="text-2xl font-bold">{currentSafetyScore.factors.weatherCondition.toFixed(1)}</div>
              <div className="text-sm">环境安全</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {isAnalyzing ? '正在分析安全状况...' : '暂无安全评估数据'}
          </div>
        )}
      </div>

      {/* 最佳跑步时间 */}
      {bestRunningTimes.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Clock className="mr-2 text-green-500" />
            推荐跑步时间
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bestRunningTimes.map((time, index) => (
              <div key={time.timeSlot} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{getTimeSlotIcon(time.timeSlot)}</span>
                  <span className={`px-2 py-1 rounded text-sm ${getSafetyColor(time.safetyScore)}`}>
                    {time.safetyScore.toFixed(1)}分
                  </span>
                </div>
                <div className="text-sm text-gray-600">{time.description}</div>
                {index === 0 && (
                  <div className="mt-2 text-xs text-green-600 font-medium">推荐首选</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 时间段详细分析 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <button
          onClick={() => toggleSection('timeSlots')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Clock className="mr-2 text-purple-500" />
            时间段安全分析
          </h2>
          {expandedSections.timeSlots ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedSections.timeSlots && (
          <div className="space-y-3">
            {timeSlotAnalysis.map((data) => (
              <div key={data.timeSlot} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">{getTimeSlotIcon(data.timeSlot)}</span>
                    <span className="font-medium">
                      {getTimeSlotName(data.timeSlot)}
                    </span>
                  </div>
                  <div className={`px-3 py-1 rounded ${getSafetyColor(data.safetyScore)}`}>
                    {data.safetyScore.toFixed(1)}分
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>
                    <div className="font-medium">跑步次数</div>
                    <div>{data.totalRuns}次</div>
                  </div>
                  <div>
                    <div className="font-medium">事件数量</div>
                    <div>{data.incidentCount}起</div>
                  </div>
                  <div>
                    <div className="font-medium">平均速度</div>
                    <div>{data.averageSpeed.toFixed(1)} km/h</div>
                  </div>
                  <div>
                    <div className="font-medium">环境风险</div>
                    <div>{data.environmentalRisk.toFixed(1)}%</div>
                  </div>
                </div>

                {data.riskFactors.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">主要风险因素:</div>
                    <div className="flex flex-wrap gap-1">
                      {data.riskFactors.map((factor) => (
                        <span
                          key={factor}
                          className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded"
                        >
                          {getRiskFactorName(factor)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 风险热点 */}
      {riskHotspots.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <button
            onClick={() => toggleSection('hotspots')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <MapPin className="mr-2 text-red-500" />
              风险热点 ({riskHotspots.length})
            </h2>
            {expandedSections.hotspots ? <ChevronUp /> : <ChevronDown />}
          </button>

          {expandedSections.hotspots && (
            <div className="space-y-3">
              {riskHotspots.map((hotspot, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="font-medium">
                        {hotspot.location.latitude.toFixed(4)}, {hotspot.location.longitude.toFixed(4)}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${getRiskLevelColor(hotspot.riskLevel)}`}>
                      {hotspot.riskLevel === 'high' ? '高风险' : 
                       hotspot.riskLevel === 'medium' ? '中风险' : '低风险'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">{hotspot.description}</div>
                  
                  <div className="flex flex-wrap gap-1">
                    {hotspot.riskFactors.map((factor) => (
                      <span
                        key={factor}
                        className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded"
                      >
                        {getRiskFactorName(factor)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 安全建议 */}
      {safetyRecommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <button
            onClick={() => toggleSection('recommendations')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <Eye className="mr-2 text-blue-500" />
              安全建议
            </h2>
            {expandedSections.recommendations ? <ChevronUp /> : <ChevronDown />}
          </button>

          {expandedSections.recommendations && (
            <div className="space-y-2">
              {safetyRecommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                    {index + 1}
                  </div>
                  <div className="text-sm text-gray-700">{recommendation}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 路线分析概览 */}
      {routeAnalysis && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="mr-2 text-green-500" />
            路线安全概览
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${getSafetyColor(routeAnalysis.overallSafetyScore)}`}>
              <div className="text-2xl font-bold">{routeAnalysis.overallSafetyScore.toFixed(1)}</div>
              <div className="text-sm">路线安全分数</div>
              <div className="text-xs mt-1">{getSafetyLevel(routeAnalysis.overallSafetyScore)}</div>
            </div>
            
            <div className="p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-red-600">{routeAnalysis.riskHotspots.length}</div>
              <div className="text-sm text-gray-600">风险热点</div>
            </div>
            
            <div className="p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{routeAnalysis.recommendations.length}</div>
              <div className="text-sm text-gray-600">安全建议</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 辅助函数
function getTimeSlotName(timeSlot: TimeSlot): string {
  const names = {
    'early_morning': '清晨（5-7点）',
    'morning': '上午（7-10点）',
    'late_morning': '上午晚些（10-12点）',
    'afternoon': '下午（12-17点）',
    'evening': '傍晚（17-20点）',
    'night': '夜晚（20-23点）',
    'late_night': '深夜（23-5点）'
  };
  return names[timeSlot];
}

function getRiskFactorName(factor: string): string {
  const names = {
    'poor_lighting': '照明不足',
    'isolated_area': '偏僻区域',
    'high_crime_rate': '治安风险',
    'heavy_traffic': '交通繁忙',
    'construction_zone': '施工区域',
    'weather_conditions': '天气不佳',
    'crowd_density': '人群拥挤'
  };
  return names[factor] || factor;
}

export default SafetyAnalysisDashboard;