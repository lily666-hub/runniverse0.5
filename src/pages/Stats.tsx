import React, { useState, useMemo } from 'react';
import { Calendar, TrendingUp, Activity, Target, Clock, Zap } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useRunStore } from '../store';
import { formatDistance, formatDuration, formatPace, formatNumber } from '../utils/format';

const Stats: React.FC = () => {
  const { runs } = useRunStore();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  // 计算统计数据
  const stats = useMemo(() => {
    const now = new Date();
    let filteredRuns = runs;

    // 根据时间范围过滤数据
    if (timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredRuns = runs.filter(run => new Date(run.startTime) >= weekAgo);
    } else if (timeRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredRuns = runs.filter(run => new Date(run.startTime) >= monthAgo);
    } else if (timeRange === 'year') {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      filteredRuns = runs.filter(run => new Date(run.startTime) >= yearAgo);
    }

    const totalDistance = filteredRuns.reduce((sum, run) => sum + run.distance, 0);
    const totalDuration = filteredRuns.reduce((sum, run) => sum + run.duration, 0);
    const totalCalories = filteredRuns.reduce((sum, run) => sum + run.calories, 0);
    const totalRuns = filteredRuns.length;
    const averagePace = totalDistance > 0 ? (totalDuration / 1000) / (totalDistance / 1000) / 60 : 0;
    const averageDistance = totalRuns > 0 ? totalDistance / totalRuns : 0;

    return {
      totalDistance,
      totalDuration,
      totalCalories,
      totalRuns,
      averagePace,
      averageDistance
    };
  }, [runs, timeRange]);

  // 准备图表数据
  const chartData = useMemo(() => {
    const now = new Date();
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayRuns = runs.filter(run => {
        const runDate = new Date(run.startTime);
        return runDate.toDateString() === date.toDateString();
      });

      const dayDistance = dayRuns.reduce((sum, run) => sum + run.distance, 0) / 1000; // 转换为公里
      const dayDuration = dayRuns.reduce((sum, run) => sum + run.duration, 0) / 1000 / 60; // 转换为分钟
      const dayCalories = dayRuns.reduce((sum, run) => sum + run.calories, 0);
      const dayRuns_count = dayRuns.length;

      data.push({
        date: date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
        distance: Number(dayDistance.toFixed(2)),
        duration: Number(dayDuration.toFixed(0)),
        calories: dayCalories,
        runs: dayRuns_count,
        pace: dayDistance > 0 ? Number(((dayDuration / dayDistance)).toFixed(2)) : 0
      });
    }

    return data;
  }, [runs, timeRange]);

  // 配速分布数据
  const paceDistribution = useMemo(() => {
    const paceRanges = [
      { name: '<4\'00"', min: 0, max: 4, count: 0, color: '#ef4444' },
      { name: '4\'00"-5\'00"', min: 4, max: 5, count: 0, color: '#f97316' },
      { name: '5\'00"-6\'00"', min: 5, max: 6, count: 0, color: '#eab308' },
      { name: '6\'00"-7\'00"', min: 6, max: 7, count: 0, color: '#22c55e' },
      { name: '>7\'00"', min: 7, max: Infinity, count: 0, color: '#3b82f6' }
    ];

    runs.forEach(run => {
      const pace = (run.duration / 1000) / (run.distance / 1000) / 60; // 分钟/公里
      const range = paceRanges.find(r => pace >= r.min && pace < r.max);
      if (range) range.count++;
    });

    return paceRanges.filter(range => range.count > 0);
  }, [runs]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 页面标题和时间范围选择器 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">数据统计</h1>
            <p className="mt-2 text-gray-600">查看您的跑步历史和成就</p>
          </div>
          <div className="flex space-x-2 mt-4 sm:mt-0">
            {(['week', 'month', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {range === 'week' ? '本周' : range === 'month' ? '本月' : '本年'}
              </button>
            ))}
          </div>
        </div>
        
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">总距离</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatDistance(stats.totalDistance)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="w-8 h-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">总时间</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatDuration(stats.totalDuration / 1000)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">跑步次数</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(stats.totalRuns)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Zap className="w-8 h-8 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">总卡路里</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(Math.round(stats.totalCalories))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">平均配速</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatPace(stats.averagePace)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="w-8 h-8 text-indigo-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">平均距离</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatDistance(stats.averageDistance)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 距离趋势图 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">距离趋势</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value} km`, '距离']}
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="distance" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 配速趋势图 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">配速趋势</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(2)} min/km`, '配速']}
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pace" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: '#ef4444' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 每日跑步次数 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">每日跑步次数</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value} 次`, '跑步次数']}
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                  <Bar dataKey="runs" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 配速分布 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">配速分布</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paceDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    label={({ name, count }) => `${name}: ${count}`}
                  >
                    {paceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} 次`, '跑步次数']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 最近跑步记录 */}
        {runs.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">最近跑步记录</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      日期
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      距离
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      配速
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      卡路里
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {runs.slice(0, 10).map((run) => {
                    const pace = (run.duration / 1000) / (run.distance / 1000) / 60;
                    return (
                      <tr key={run.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(run.startTime).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDistance(run.distance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDuration(run.duration / 1000)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPace(pace)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {Math.round(run.calories)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stats;