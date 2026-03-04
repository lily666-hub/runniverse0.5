/**
 * GPS状态指示器组件
 * 显示GPS连接状态、信号强度、精度等信息
 */

import React from 'react';
import { Satellite, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import type { GPSPosition, GPSSignalQuality } from '../../types/map';

export interface GPSStatusIndicatorProps {
  /** 当前GPS位置 */
  currentPosition?: GPSPosition | null;
  /** GPS是否准备就绪 */
  isGPSReady: boolean;
  /** 是否正在追踪 */
  isTracking: boolean;
  /** GPS错误信息 */
  error?: string | null;
  /** 精度（米） */
  accuracy?: number;
  /** 权限状态 */
  permissionStatus?: 'granted' | 'denied' | 'prompt';
  /** 连接尝试次数 */
  connectionAttempts?: number;
  /** 显示详细信息 */
  showDetails?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 点击事件 */
  onClick?: () => void;
}

/**
 * 获取GPS信号质量
 */
const getGPSSignalQuality = (accuracy?: number): GPSSignalQuality => {
  if (!accuracy) return 'unknown';
  
  if (accuracy <= 5) return 'excellent';
  if (accuracy <= 10) return 'good';
  if (accuracy <= 20) return 'fair';
  return 'poor';
};

/**
 * 获取信号质量颜色
 */
const getSignalColor = (quality: GPSSignalQuality): string => {
  switch (quality) {
    case 'excellent': return '#2ed573';
    case 'good': return '#26de81';
    case 'fair': return '#ffa502';
    case 'poor': return '#ff4757';
    case 'unknown': return '#747d8c';
    default: return '#747d8c';
  }
};

/**
 * 获取信号质量文本
 */
const getSignalText = (quality: GPSSignalQuality): string => {
  switch (quality) {
    case 'excellent': return '优秀';
    case 'good': return '良好';
    case 'fair': return '一般';
    case 'poor': return '较差';
    case 'unknown': return '未知';
    default: return '未知';
  }
};

/**
 * 获取状态图标
 */
const getStatusIcon = (
  isGPSReady: boolean, 
  isTracking: boolean, 
  error: string | null,
  quality: GPSSignalQuality
) => {
  if (error) {
    return <AlertTriangle size={16} color="#ff4757" />;
  }
  
  if (!isGPSReady) {
    return <WifiOff size={16} color="#747d8c" />;
  }
  
  if (isTracking) {
    return <Satellite size={16} color={getSignalColor(quality)} />;
  }
  
  return <Wifi size={16} color={getSignalColor(quality)} />;
};

/**
 * 获取状态文本
 */
const getStatusText = (
  isGPSReady: boolean,
  isTracking: boolean,
  error: string | null,
  permissionStatus?: string
): string => {
  if (error) {
    return '连接错误';
  }
  
  if (!isGPSReady) {
    if (permissionStatus === 'denied') {
      return '权限被拒绝';
    }
    if (permissionStatus === 'prompt') {
      return '等待权限';
    }
    return '未连接';
  }
  
  if (isTracking) {
    return '追踪中';
  }
  
  return '已连接';
};

export const GPSStatusIndicator: React.FC<GPSStatusIndicatorProps> = ({
  currentPosition,
  isGPSReady,
  isTracking,
  error,
  accuracy,
  permissionStatus,
  connectionAttempts = 0,
  showDetails = false,
  className = '',
  style = {},
  onClick
}) => {
  const signalQuality = getGPSSignalQuality(accuracy);
  const statusIcon = getStatusIcon(isGPSReady, isTracking, error, signalQuality);
  const statusText = getStatusText(isGPSReady, isTracking, error, permissionStatus);
  const signalColor = getSignalColor(signalQuality);

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '8px',
    border: `2px solid ${signalColor}`,
    fontSize: '14px',
    fontWeight: '500',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    ...style
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`gps-status-indicator ${className}`}
      style={containerStyle}
      onClick={handleClick}
      title={error || `GPS状态: ${statusText}`}
    >
      {/* 状态图标 */}
      <div className="status-icon">
        {statusIcon}
      </div>

      {/* 状态文本 */}
      <div 
        className="status-text"
        style={{ 
          color: error ? '#ff4757' : '#2c3e50',
          fontWeight: '600'
        }}
      >
        {statusText}
      </div>

      {/* 详细信息 */}
      {showDetails && (
        <div className="status-details" style={{ marginLeft: '8px' }}>
          {/* 信号质量 */}
          {accuracy !== undefined && accuracy !== null && (
            <div 
              style={{ 
                fontSize: '12px', 
                color: signalColor,
                fontWeight: '500'
              }}
            >
              {getSignalText(signalQuality)} ({accuracy.toFixed(1)}m)
            </div>
          )}

          {/* 坐标信息 */}
          {currentPosition && (
            <div 
              style={{ 
                fontSize: '11px', 
                color: '#747d8c',
                marginTop: '2px'
              }}
            >
              {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
            </div>
          )}

          {/* 连接尝试次数 */}
          {connectionAttempts > 0 && !isGPSReady && (
            <div 
              style={{ 
                fontSize: '11px', 
                color: '#ffa502',
                marginTop: '2px'
              }}
            >
              重试: {connectionAttempts}/8
            </div>
          )}
        </div>
      )}

      {/* 追踪指示器 */}
      {isTracking && (
        <div 
          className="tracking-indicator"
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#2ed573',
            animation: 'pulse 2s infinite'
          }}
        />
      )}

      {/* CSS动画 */}
      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(46, 213, 115, 0.7);
          }
          
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 10px rgba(46, 213, 115, 0);
          }
          
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(46, 213, 115, 0);
          }
        }
      `}</style>
    </div>
  );
};

/**
 * 简化版GPS状态指示器
 */
export const SimpleGPSStatusIndicator: React.FC<Pick<
  GPSStatusIndicatorProps, 
  'isGPSReady' | 'isTracking' | 'error' | 'accuracy' | 'className' | 'style'
>> = ({
  isGPSReady,
  isTracking,
  error,
  accuracy,
  className = '',
  style = {}
}) => {
  const signalQuality = getGPSSignalQuality(accuracy);
  const signalColor = getSignalColor(signalQuality);

  return (
    <div 
      className={`simple-gps-indicator ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        backgroundColor: signalColor,
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold',
        ...style
      }}
      title={error || `GPS: ${isGPSReady ? '已连接' : '未连接'}`}
    >
      {error ? '!' : isTracking ? '●' : isGPSReady ? '●' : '○'}
    </div>
  );
};

export default GPSStatusIndicator;