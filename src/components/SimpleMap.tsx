import React from 'react';

interface MapProps {
  className?: string;
}

const SimpleMap: React.FC<MapProps> = ({ className = '' }) => {
  return (
    <div className={`bg-gray-200 rounded-lg p-8 text-center ${className}`}>
      <h3 className="text-lg font-medium text-gray-700 mb-2">地图组件</h3>
      <p className="text-gray-500">地图功能正在开发中...</p>
    </div>
  );
};

export default SimpleMap;