// 紧急AI助手页面
import React from 'react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmergencyAssistant } from '../../components/ai';

export const EmergencyPage: React.FC = () => {
  const handleEmergencyTriggered = (alert: any) => {
    // 处理紧急警报触发
    console.log('紧急警报已触发:', alert);
    
    // 这里可以添加更多的紧急响应逻辑，比如：
    // - 发送通知给紧急联系人
    // - 记录紧急事件
    // - 显示成功提示
    // - 跳转到紧急状态页面等
  };

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
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">紧急AI助手</h1>
                  <p className="text-sm text-gray-600">24小时智能紧急响应系统</p>
                </div>
              </div>
            </div>
            
            {/* 紧急状态指示器 */}
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">系统正常</span>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EmergencyAssistant 
          className="w-full" 
          onEmergencyTriggered={handleEmergencyTriggered}
        />
      </div>
    </div>
  );
};