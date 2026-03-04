import React from 'react';
import { AlertTriangle, Key, ExternalLink } from 'lucide-react';

const APIKeyError: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API密钥配置错误</h1>
          <p className="text-gray-600">检测到API密钥格式不正确，请重新配置</p>
        </div>

        <div className="space-y-6">
          {/* KIMI API状态 */}
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <h3 className="font-semibold text-green-800">KIMI API - 配置正确</h3>
            </div>
            <p className="text-sm text-green-700">
              密钥格式: sk-NlOKUMpd... ✅
            </p>
          </div>

          {/* DeepSeek API状态 */}
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <h3 className="font-semibold text-red-800">DeepSeek API - 配置错误</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-red-700">
                <strong>当前密钥:</strong> sk-proj-LX-TwSZjRMb... ❌
              </p>
              <p className="text-red-700">
                <strong>问题:</strong> 这是OpenAI的项目密钥格式，不是DeepSeek的API密钥
              </p>
              <p className="text-red-700">
                <strong>正确格式:</strong> DeepSeek API密钥应该以 "sk-" 开头，长度较短
              </p>
            </div>
          </div>

          {/* 解决方案 */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
              <Key className="w-4 h-4 mr-2" />
              解决方案
            </h3>
            <div className="space-y-3 text-sm text-blue-700">
              <div>
                <p className="font-medium">1. 获取正确的DeepSeek API密钥：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>访问 <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">DeepSeek官网 <ExternalLink className="w-3 h-3 ml-1" /></a></li>
                  <li>注册账号并登录</li>
                  <li>在API密钥管理页面创建新的API密钥</li>
                  <li>复制以 "sk-" 开头的API密钥</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">2. 更新环境变量：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>打开项目根目录的 .env 文件</li>
                  <li>将 VITE_DEEPSEEK_API_KEY 的值替换为正确的DeepSeek API密钥</li>
                  <li>保存文件并重启开发服务器</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 临时解决方案 */}
          <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
            <h3 className="font-semibold text-yellow-800 mb-2">临时解决方案</h3>
            <p className="text-sm text-yellow-700">
              目前可以使用KIMI API进行AI对话，DeepSeek功能将在密钥配置正确后可用。
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center space-x-4">
          <a
            href="/debug-test"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            查看调试页面
          </a>
          <a
            href="/ai/chat"
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            使用KIMI聊天
          </a>
        </div>
      </div>
    </div>
  );
};

export default APIKeyError;