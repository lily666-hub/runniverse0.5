import React from 'react';
import { Satellite, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface GPSStatusIndicatorProps {
  isTracking: boolean;
  accuracy: number | null;
  error: string | null;
  className?: string;
}

export const GPSStatusIndicator: React.FC<GPSStatusIndicatorProps> = ({
  isTracking,
  accuracy,
  error,
  className = ''
}) => {
  const getStatusInfo = () => {
    if (error) {
      return {
        icon: XCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        status: 'GPS错误',
        description: error
      };
    }

    if (!isTracking) {
      return {
        icon: Satellite,
        color: 'text-gray-500',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        status: 'GPS未启用',
        description: '点击开始位置追踪'
      };
    }

    if (accuracy === null) {
      return {
        icon: AlertTriangle,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        status: 'GPS搜索中',
        description: '正在获取位置信息...'
      };
    }

    if (accuracy > 50) {
      return {
        icon: AlertTriangle,
        color: 'text-orange-500',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        status: 'GPS信号弱',
        description: `精度: ±${Math.round(accuracy)}米`
      };
    }

    if (accuracy > 20) {
      return {
        icon: CheckCircle,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        status: 'GPS信号一般',
        description: `精度: ±${Math.round(accuracy)}米`
      };
    }

    return {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      status: 'GPS信号良好',
      description: `精度: ±${Math.round(accuracy)}米`
    };
  };

  const { icon: Icon, color, bgColor, borderColor, status, description } = getStatusInfo();

  return (
    <div className={`flex items-center space-x-3 p-3 rounded-lg border ${bgColor} ${borderColor} ${className}`}>
      <div className={`flex-shrink-0 ${color}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${color}`}>
          {status}
        </div>
        <div className="text-xs text-gray-600 truncate">
          {description}
        </div>
      </div>
      {isTracking && !error && (
        <div className="flex-shrink-0">
          <div className={`w-2 h-2 rounded-full ${accuracy && accuracy <= 20 ? 'bg-green-400' : accuracy && accuracy <= 50 ? 'bg-yellow-400' : 'bg-red-400'} animate-pulse`} />
        </div>
      )}
    </div>
  );
};