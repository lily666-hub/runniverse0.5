import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Activity, AlertTriangle, Users, MapPin, BarChart3, Settings, Clock } from 'lucide-react';
import SafetyAgent from '../components/ai/agents/SafetyAgent';

const SafetyDashboard: React.FC = () => {
  const safetyFeatures = [
    {
      title: '实时安全监控',
      description: '24小时实时监控您的跑步安全状况',
      icon: Activity,
      href: '/safety/monitor',
      color: 'bg-blue-600',
      stats: '实时保护'
    },
    {
      title: '安全评估分析',
      description: '基于时间、地点的智能安全评估',
      icon: BarChart3,
      href: '/safety/assessment',
      color: 'bg-green-600',
      stats: '智能分析'
    },
    {
      title: '女性专区',
      description: '专为女性用户设计的安全保障功能',
      icon: Users,
      href: '/safety/women',
      color: 'bg-pink-600',
      stats: '专属保护'
    },
    {
      title: '紧急响应',
      description: '一键求救，快速响应紧急情况',
      icon: AlertTriangle,
      href: '/safety/emergency',
      color: 'bg-red-600',
      stats: 'SOS求救'
    }
  ];

  const quickStats = [
    {
      label: '今日安全指数',
      value: '85',
      unit: '分',
      change: '+5',
      changeType: 'positive',
      icon: Shield
    },
    {
      label: '安全跑步时长',
      value: '2.5',
      unit: '小时',
      change: '+0.5',
      changeType: 'positive',
      icon: Clock
    },
    {
      label: '安全路线数',
      value: '12',
      unit: '条',
      change: '+2',
      changeType: 'positive',
      icon: MapPin
    },
    {
      label: '紧急联系人',
      value: '3',
      unit: '人',
      change: '0',
      changeType: 'neutral',
      icon: Users
    }
  ];

  const recentAlerts = [
    {
      id: 1,
      type: 'info',
      message: '您常跑的人民广场路线今日安全指数较高',
      time: '2小时前',
      icon: Shield
    },
    {
      id: 2,
      type: 'warning',
      message: '夜间跑步建议选择照明良好的路线',
      time: '4小时前',
      icon: AlertTriangle
    },
    {
      id: 3,
      type: 'success',
      message: '您的紧急联系人设置已更新',
      time: '1天前',
      icon: Users
    }
  ];

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">安全评估系统</h1>
          <p className="text-sm sm:text-base text-gray-600">实时监控跑步安全，为您的运动保驾护航</p>
        </div>

        {/* 快速统计 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div className={`text-xs sm:text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.change !== '0' && (stat.changeType === 'positive' ? '+' : '')}{stat.change}
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
                  {stat.value}
                  <span className="text-xs sm:text-sm font-normal text-gray-600 ml-1">{stat.unit}</span>
                </div>
                <div className="text-xs sm:text-sm text-gray-600">{stat.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要功能 */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">安全功能</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {safetyFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Link
                    key={index}
                    to={feature.href}
                    className="group bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className={`p-2 sm:p-3 rounded-lg ${feature.color} text-white`}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        运行中
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-xs sm:text-sm">{feature.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 最近警报 */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">最近警报</h3>
              <div className="space-y-3">
                {recentAlerts.map((alert) => {
                  const Icon = alert.icon;
                  return (
                    <div key={alert.id} className="flex items-center p-3 sm:p-4 rounded-lg border border-gray-200">
                      <div className={`p-2 rounded-lg mr-3 sm:mr-4 ${getAlertColor(alert.type)}`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{alert.message}</p>
                        <p className="text-xs opacity-75 mt-1">{alert.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 快速操作 */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">快速操作</h3>
              <div className="space-y-3">
                <Link
                  to="/safety/emergency"
                  className="flex items-center p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                  <span className="text-red-700 font-medium">紧急求救</span>
                </Link>
                <Link
                  to="/safety/monitor"
                  className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Activity className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="text-blue-700 font-medium">开始监控</span>
                </Link>
                <Link
                  to="/safety/assessment"
                  className="flex items-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <BarChart3 className="w-5 h-5 text-green-600 mr-3" />
                  <span className="text-green-700 font-medium">安全评估</span>
                </Link>
              </div>
            </div>

            {/* 安全提示 */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-3">💡 安全提示</h3>
              <ul className="space-y-2 text-sm">
                <li>• 夜间跑步请选择照明良好的路线</li>
                <li>• 告知家人朋友您的跑步计划</li>
                <li>• 保持手机电量充足</li>
                <li>• 避免在偏僻地区独自跑步</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 安全智能体 */}
        <SafetyAgent />
      </div>
    </div>
  );
};

export default SafetyDashboard;