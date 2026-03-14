import React from 'react';
import { AIMascot } from '../../components/ai/AIMascot';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const MascotDemo: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        返回
      </button>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">AI吉祥物演示</h1>
        <p className="text-gray-600 mb-8">
          这是一个可爱的AI吉祥物，它会定期向你招手问好！点击它也可以触发招手动画。
        </p>

        <div className="grid grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">小尺寸 - 左下角</h3>
            <div className="relative h-64 bg-gray-50 rounded-lg">
              <AIMascot position="bottom-left" size="small" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">中等尺寸 - 右下角</h3>
            <div className="relative h-64 bg-gray-50 rounded-lg">
              <AIMascot position="bottom-right" size="medium" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">大尺寸 - 左上角</h3>
            <div className="relative h-64 bg-gray-50 rounded-lg">
              <AIMascot position="top-left" size="large" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">中等尺寸 - 右上角</h3>
            <div className="relative h-64 bg-gray-50 rounded-lg">
              <AIMascot position="top-right" size="medium" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">功能说明</h3>
          <ul className="space-y-2 text-gray-600">
            <li>✨ 每8秒自动招手一次</li>
            <li>👋 点击吉祥物可以触发招手动画</li>
            <li>💬 招手时会显示问候气泡</li>
            <li>🎨 支持4个位置：左上、右上、左下、右下</li>
            <li>📏 支持3种尺寸：小、中、大</li>
            <li>🖱️ 鼠标悬停时会放大</li>
          </ul>
        </div>
      </div>

      {/* 全局吉祥物示例 */}
      <AIMascot position="bottom-right" size="medium" />
    </div>
  );
};

export default MascotDemo;
