/**
 * 导航面板组件
 * 显示当前导航指令、路线信息、运动数据等
 */

import React from 'react';
import { 
  Navigation, 
  ArrowRight, 
  ArrowLeft, 
  ArrowUp, 
  RotateCcw,
  MapPin,
  Clock,
  Gauge,
  Target,
  TrendingUp
} from 'lucide-react';
import type { 
  NavigationInstruction, 
  RouteData, 
  GPSPosition,
  TrackingStatus 
} from '../../types/map';

export interface NavigationPanelProps {
  /** 当前导航指令 */
  currentInstruction?: NavigationInstruction | null;
  /** 下一个导航指令 */
  nextInstruction?: NavigationInstruction | null;
  /** 当前路线 */
  currentRoute?: RouteData | null;
  /** 当前位置 */
  currentPosition?: GPSPosition | null;
  /** 追踪状态 */
  trackingStatus?: TrackingStatus | null;
  /** 是否正在导航 */
  isNavigating: boolean;
  /** 是否正在追踪 */
  isTracking: boolean;
  /** 运动数据 */
  runningStats?: {
    distance: number;
    duration: number;
    averageSpeed: number;
    currentSpeed?: number;
    pace?: number;
  };
  /** 显示模式 */
  mode?: 'compact' | 'detailed';
  /** 自定义样式类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 获取方向图标
 */
const getDirectionIcon = (direction: string) => {
  switch (direction.toLowerCase()) {
    case 'left':
    case 'turn_left':
      return <ArrowLeft size={20} />;
    case 'right':
    case 'turn_right':
      return <ArrowRight size={20} />;
    case 'straight':
    case 'continue':
      return <ArrowUp size={20} />;
    case 'u_turn':
    case 'uturn':
      return <RotateCcw size={20} />;
    default:
      return <Navigation size={20} />;
  }
};

/**
 * 格式化距离
 */
const formatDistance = (distance: number): string => {
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)} km`;
  }
  return `${Math.round(distance)} m`;
};

/**
 * 格式化时间
 */
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * 格式化速度
 */
const formatSpeed = (speed: number): string => {
  return `${speed.toFixed(1)} km/h`;
};

/**
 * 格式化配速
 */
const formatPace = (pace: number): string => {
  const minutes = Math.floor(pace / 60);
  const seconds = Math.round(pace % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
};

export const NavigationPanel: React.FC<NavigationPanelProps> = ({
  currentInstruction,
  nextInstruction,
  currentRoute,
  currentPosition,
  trackingStatus,
  isNavigating,
  isTracking,
  runningStats,
  mode = 'detailed',
  className = '',
  style = {}
}) => {
  const isCompact = mode === 'compact';

  const panelStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '8px',
    padding: isCompact ? '12px' : '16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    fontSize: isCompact ? '14px' : '16px',
    ...style
  };

  return (
    <div className={`navigation-panel ${className}`} style={panelStyle}>
      {/* 导航状态指示 */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: isCompact ? '8px' : '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid #e9ecef'
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isNavigating ? '#28a745' : isTracking ? '#ffc107' : '#6c757d'
          }}
        />
        <span style={{ fontWeight: '600', color: '#2c3e50' }}>
          {isNavigating ? '导航中' : isTracking ? '追踪中' : '待机'}
        </span>
      </div>

      {/* 当前导航指令 */}
      {isNavigating && currentInstruction && (
        <div 
          style={{
            marginBottom: isCompact ? '8px' : '12px',
            padding: '12px',
            backgroundColor: '#e7f3ff',
            borderRadius: '6px',
            border: '1px solid #b3d9ff'
          }}
        >
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px'
            }}
          >
            <div style={{ color: '#007bff' }}>
              {getDirectionIcon(currentInstruction.direction)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', color: '#2c3e50' }}>
                {currentInstruction.text}
              </div>
              {currentInstruction.distance > 0 && (
                <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '2px' }}>
                  {formatDistance(currentInstruction.distance)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 下一个导航指令 */}
      {isNavigating && nextInstruction && !isCompact && (
        <div 
          style={{
            marginBottom: '12px',
            padding: '8px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          <div style={{ color: '#6c757d', marginBottom: '4px' }}>接下来:</div>
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <div style={{ color: '#6c757d' }}>
              {getDirectionIcon(nextInstruction.direction)}
            </div>
            <div style={{ color: '#495057' }}>
              {nextInstruction.text}
            </div>
          </div>
        </div>
      )}

      {/* 路线信息 */}
      {currentRoute && !isCompact && (
        <div 
          style={{
            marginBottom: '12px',
            padding: '8px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px'
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '6px', color: '#2c3e50' }}>
            路线信息
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
            <div>
              <span style={{ color: '#6c757d' }}>总距离: </span>
              <span style={{ fontWeight: '500' }}>{formatDistance(currentRoute.distance)}</span>
            </div>
            <div>
              <span style={{ color: '#6c757d' }}>预计时间: </span>
              <span style={{ fontWeight: '500' }}>{Math.round(currentRoute.duration / 60)}分钟</span>
            </div>
          </div>
        </div>
      )}

      {/* 运动数据 */}
      {(isTracking || isNavigating) && runningStats && (
        <div 
          style={{
            marginBottom: isCompact ? '0' : '12px',
            padding: '8px',
            backgroundColor: '#e8f5e8',
            borderRadius: '6px'
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '6px', color: '#2c3e50' }}>
            运动数据
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr 1fr' : '1fr 1fr 1fr', gap: '8px', fontSize: '14px' }}>
            {/* 距离 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} color="#28a745" />
              <div>
                <div style={{ color: '#6c757d', fontSize: '12px' }}>距离</div>
                <div style={{ fontWeight: '600' }}>{formatDistance(runningStats.distance)}</div>
              </div>
            </div>

            {/* 时间 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} color="#28a745" />
              <div>
                <div style={{ color: '#6c757d', fontSize: '12px' }}>时间</div>
                <div style={{ fontWeight: '600' }}>{formatTime(runningStats.duration)}</div>
              </div>
            </div>

            {/* 平均速度 */}
            {!isCompact && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Gauge size={14} color="#28a745" />
                <div>
                  <div style={{ color: '#6c757d', fontSize: '12px' }}>平均速度</div>
                  <div style={{ fontWeight: '600' }}>{formatSpeed(runningStats.averageSpeed)}</div>
                </div>
              </div>
            )}

            {/* 当前速度 */}
            {runningStats.currentSpeed !== undefined && !isCompact && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrendingUp size={14} color="#28a745" />
                <div>
                  <div style={{ color: '#6c757d', fontSize: '12px' }}>当前速度</div>
                  <div style={{ fontWeight: '600' }}>{formatSpeed(runningStats.currentSpeed)}</div>
                </div>
              </div>
            )}

            {/* 配速 */}
            {runningStats.pace !== undefined && !isCompact && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Target size={14} color="#28a745" />
                <div>
                  <div style={{ color: '#6c757d', fontSize: '12px' }}>配速</div>
                  <div style={{ fontWeight: '600' }}>{formatPace(runningStats.pace)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 追踪状态 */}
      {trackingStatus && !isCompact && (
        <div 
          style={{
            padding: '8px',
            backgroundColor: '#fff3cd',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '6px', color: '#2c3e50' }}>
            追踪状态
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {trackingStatus.remainingDistance > 0 && (
              <div>
                <span style={{ color: '#6c757d' }}>剩余距离: </span>
                <span style={{ fontWeight: '500' }}>{formatDistance(trackingStatus.remainingDistance)}</span>
              </div>
            )}
            {trackingStatus.estimatedTimeToDestination > 0 && (
              <div>
                <span style={{ color: '#6c757d' }}>预计到达: </span>
                <span style={{ fontWeight: '500' }}>{Math.round(trackingStatus.estimatedTimeToDestination / 60)}分钟</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 当前位置信息 */}
      {currentPosition && !isCompact && (
        <div 
          style={{
            marginTop: '8px',
            padding: '6px',
            backgroundColor: '#f1f3f4',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#6c757d'
          }}
        >
          位置: {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
          {currentPosition.accuracy && (
            <span> (精度: {currentPosition.accuracy.toFixed(1)}m)</span>
          )}
        </div>
      )}

      {/* 空状态 */}
      {!isNavigating && !isTracking && !currentRoute && (
        <div 
          style={{
            textAlign: 'center',
            color: '#6c757d',
            padding: '20px',
            fontSize: '14px'
          }}
        >
          <Navigation size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
          <div>请添加途径点并规划路线</div>
        </div>
      )}
    </div>
  );
};

/**
 * 紧凑版导航面板
 */
export const CompactNavigationPanel: React.FC<Omit<NavigationPanelProps, 'mode'>> = (props) => {
  return <NavigationPanel {...props} mode="compact" />;
};

export default NavigationPanel;