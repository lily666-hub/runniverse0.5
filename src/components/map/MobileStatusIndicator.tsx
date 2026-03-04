import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Battery, 
  Signal, 
  MapPin, 
  Navigation,
  Clock,
  Zap,
  AlertTriangle
} from 'lucide-react';
import ResponsiveUtils from '../../utils/responsive';

interface MobileStatusIndicatorProps {
  gpsStatus: 'disabled' | 'searching' | 'locked' | 'lost';
  gpsAccuracy?: number;
  isTracking: boolean;
  isNavigating: boolean;
  trackingDuration?: number;
  trackingDistance?: number;
  networkStatus: boolean;
  batteryLevel?: number;
  signalStrength?: number;
  position?: 'top' | 'bottom';
  compact?: boolean;
}

/**
 * 移动端优化的状态指示器
 * 显示GPS、网络、电池等关键状态信息
 */
export const MobileStatusIndicator: React.FC<MobileStatusIndicatorProps> = ({
  gpsStatus,
  gpsAccuracy,
  isTracking,
  isNavigating,
  trackingDuration = 0,
  trackingDistance = 0,
  networkStatus,
  batteryLevel,
  signalStrength,
  position = 'bottom',
  compact = false
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastTap, setLastTap] = useState(0);
  const deviceInfo = ResponsiveUtils.getDeviceInfo();
  const isMobile = deviceInfo.type === 'mobile';

  // 双击隐藏/显示状态栏
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      setIsVisible(prev => !prev);
    }
    setLastTap(now);
  };

  // 格式化时间
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // 格式化距离
  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${Math.round(meters)}m`;
  };

  // 获取GPS状态颜色和图标
  const getGPSStatusInfo = () => {
    switch (gpsStatus) {
      case 'locked':
        return { color: '#10b981', icon: <MapPin size={14} />, text: 'GPS已锁定' };
      case 'searching':
        return { color: '#f59e0b', icon: <MapPin size={14} />, text: 'GPS搜索中' };
      case 'lost':
        return { color: '#ef4444', icon: <AlertTriangle size={14} />, text: 'GPS信号丢失' };
      default:
        return { color: '#6b7280', icon: <MapPin size={14} />, text: 'GPS未启用' };
    }
  };

  const gpsInfo = getGPSStatusInfo();

  // 容器样式
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    [position]: isMobile ? '16px' : '20px',
    left: isMobile ? '16px' : '20px',
    right: isMobile ? '16px' : '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    color: 'white',
    borderRadius: compact ? '8px' : '12px',
    padding: compact ? '8px 12px' : '12px 16px',
    fontSize: isMobile ? '12px' : '11px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    zIndex: 1001,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease',
    transform: isVisible ? 'translateY(0)' : `translateY(${position === 'top' ? '-100%' : '100%'})`,
    opacity: isVisible ? 1 : 0,
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent'
  };

  // 状态项样式
  const statusItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    minWidth: 'fit-content'
  };

  return (
    <div 
      style={containerStyle}
      onClick={handleDoubleTap}
      title="双击隐藏/显示状态栏"
    >
      {compact ? (
        // 紧凑模式 - 单行显示
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          {/* GPS状态 */}
          <div style={{ ...statusItemStyle, color: gpsInfo.color }}>
            {gpsInfo.icon}
            <span>{gpsStatus === 'locked' && gpsAccuracy ? `${gpsAccuracy}m` : gpsInfo.text}</span>
          </div>

          {/* 追踪/导航状态 */}
          {(isTracking || isNavigating) && (
            <div style={statusItemStyle}>
              {isNavigating ? <Navigation size={14} /> : <Zap size={14} />}
              <span>{isNavigating ? '导航中' : '追踪中'}</span>
              {isTracking && trackingDuration > 0 && (
                <span>• {formatDuration(trackingDuration)}</span>
              )}
            </div>
          )}

          {/* 网络状态 */}
          <div style={{ ...statusItemStyle, color: networkStatus ? '#10b981' : '#ef4444' }}>
            {networkStatus ? <Wifi size={14} /> : <WifiOff size={14} />}
          </div>

          {/* 电池状态（如果可用） */}
          {batteryLevel !== undefined && (
            <div style={{ ...statusItemStyle, color: batteryLevel > 20 ? '#10b981' : '#ef4444' }}>
              <Battery size={14} />
              <span>{batteryLevel}%</span>
            </div>
          )}
        </div>
      ) : (
        // 完整模式 - 多行显示
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* 第一行：GPS和网络状态 */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ ...statusItemStyle, color: gpsInfo.color }}>
              {gpsInfo.icon}
              <span>{gpsInfo.text}</span>
              {gpsStatus === 'locked' && gpsAccuracy && (
                <span style={{ opacity: 0.8 }}>({gpsAccuracy}m)</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* 网络状态 */}
              <div style={{ ...statusItemStyle, color: networkStatus ? '#10b981' : '#ef4444' }}>
                {networkStatus ? <Wifi size={14} /> : <WifiOff size={14} />}
                <span>{networkStatus ? '在线' : '离线'}</span>
              </div>

              {/* 信号强度（如果可用） */}
              {signalStrength !== undefined && (
                <div style={statusItemStyle}>
                  <Signal size={14} />
                  <span>{signalStrength}%</span>
                </div>
              )}
            </div>
          </div>

          {/* 第二行：追踪/导航信息 */}
          {(isTracking || isNavigating) && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                paddingTop: '4px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div style={statusItemStyle}>
                {isNavigating ? <Navigation size={14} /> : <Zap size={14} />}
                <span>{isNavigating ? '导航模式' : '追踪模式'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* 追踪时间 */}
                {isTracking && trackingDuration > 0 && (
                  <div style={statusItemStyle}>
                    <Clock size={14} />
                    <span>{formatDuration(trackingDuration)}</span>
                  </div>
                )}

                {/* 追踪距离 */}
                {isTracking && trackingDistance > 0 && (
                  <div style={statusItemStyle}>
                    <span>{formatDistance(trackingDistance)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 第三行：设备状态（如果可用） */}
          {(batteryLevel !== undefined || signalStrength !== undefined) && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                paddingTop: '4px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '10px',
                opacity: 0.8
              }}
            >
              {/* 电池状态 */}
              {batteryLevel !== undefined && (
                <div style={{ ...statusItemStyle, color: batteryLevel > 20 ? '#10b981' : '#ef4444' }}>
                  <Battery size={12} />
                  <span>电池 {batteryLevel}%</span>
                </div>
              )}

              {/* 设备信息 */}
              <div style={statusItemStyle}>
                <span>{deviceInfo.type} • {deviceInfo.orientation}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 隐藏提示 */}
      {!compact && (
        <div 
          style={{
            position: 'absolute',
            top: '-6px',
            right: '8px',
            width: '2px',
            height: '2px',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            borderRadius: '50%'
          }}
        />
      )}
    </div>
  );
};

export default MobileStatusIndicator;