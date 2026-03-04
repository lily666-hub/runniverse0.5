import React, { useState, useCallback } from 'react';
import { 
  MapPin, 
  Navigation, 
  Play, 
  Pause, 
  Square, 
  RotateCcw,
  Settings,
  Layers,
  Zap
} from 'lucide-react';
import { MapVibration } from '../../utils/vibration';
import ResponsiveUtils from '../../utils/responsive';

interface MobileMapControlsProps {
  isGPSEnabled: boolean;
  isTracking: boolean;
  isNavigating: boolean;
  onGPSToggle: () => void;
  onTrackingToggle: () => void;
  onNavigationStart: () => void;
  onNavigationStop: () => void;
  onCenterMap: () => void;
  onClearRoute: () => void;
  onSettingsOpen?: () => void;
  onLayersToggle?: () => void;
  disabled?: boolean;
}

/**
 * 移动端优化的地图控制面板
 * 提供触摸友好的界面和手势支持
 */
export const MobileMapControls: React.FC<MobileMapControlsProps> = ({
  isGPSEnabled,
  isTracking,
  isNavigating,
  onGPSToggle,
  onTrackingToggle,
  onNavigationStart,
  onNavigationStop,
  onCenterMap,
  onClearRoute,
  onSettingsOpen,
  onLayersToggle,
  disabled = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const deviceInfo = ResponsiveUtils.getDeviceInfo();
  const isMobile = deviceInfo.type === 'mobile';

  const handleButtonClick = useCallback((action: () => void) => {
    if (disabled) return;
    
    MapVibration.buttonClick();
    action();
  }, [disabled]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
    MapVibration.buttonClick();
  }, []);

  // 基础按钮样式
  const getButtonStyle = (isActive = false, isPrimary = false): React.CSSProperties => ({
    width: isMobile ? '56px' : '48px',
    height: isMobile ? '56px' : '48px',
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    opacity: disabled ? 0.5 : 1,
    backgroundColor: isActive 
      ? '#3b82f6' 
      : isPrimary 
        ? '#10b981' 
        : 'white',
    color: isActive || isPrimary ? 'white' : '#374151',
    fontSize: isMobile ? '20px' : '18px',
    // 移动端触摸优化
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    touchAction: 'manipulation'
  });

  // 容器样式
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: isMobile ? '24px' : '20px',
    right: isMobile ? '16px' : '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: isMobile ? '12px' : '8px',
    zIndex: 1000
  };

  // 主控制按钮组
  const mainControls = [
    {
      id: 'gps',
      icon: <MapPin size={isMobile ? 24 : 20} />,
      isActive: isGPSEnabled,
      onClick: () => handleButtonClick(onGPSToggle),
      label: 'GPS定位'
    },
    {
      id: 'tracking',
      icon: isTracking ? <Pause size={isMobile ? 24 : 20} /> : <Play size={isMobile ? 24 : 20} />,
      isActive: isTracking,
      onClick: () => handleButtonClick(onTrackingToggle),
      label: isTracking ? '停止追踪' : '开始追踪'
    }
  ];

  // 导航控制按钮
  const navigationControl = {
    id: 'navigation',
    icon: isNavigating ? <Square size={isMobile ? 24 : 20} /> : <Navigation size={isMobile ? 24 : 20} />,
    isActive: isNavigating,
    isPrimary: !isNavigating,
    onClick: () => handleButtonClick(isNavigating ? onNavigationStop : onNavigationStart),
    label: isNavigating ? '停止导航' : '开始导航'
  };

  // 扩展控制按钮组
  const extendedControls = [
    {
      id: 'center',
      icon: <RotateCcw size={isMobile ? 20 : 18} />,
      onClick: () => handleButtonClick(onCenterMap),
      label: '居中地图'
    },
    {
      id: 'clear',
      icon: <Zap size={isMobile ? 20 : 18} />,
      onClick: () => handleButtonClick(onClearRoute),
      label: '清除路线'
    }
  ];

  // 可选控制按钮
  const optionalControls = [
    ...(onLayersToggle ? [{
      id: 'layers',
      icon: <Layers size={isMobile ? 20 : 18} />,
      onClick: () => handleButtonClick(onLayersToggle),
      label: '图层切换'
    }] : []),
    ...(onSettingsOpen ? [{
      id: 'settings',
      icon: <Settings size={isMobile ? 20 : 18} />,
      onClick: () => handleButtonClick(onSettingsOpen),
      label: '设置'
    }] : [])
  ];

  return (
    <div style={containerStyle}>
      {/* 扩展控制按钮（仅在展开时显示） */}
      {isExpanded && (
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '8px' : '6px',
            animation: 'slideUp 0.2s ease-out'
          }}
        >
          {/* 可选控制按钮 */}
          {optionalControls.map((control) => (
            <button
              key={control.id}
              onClick={control.onClick}
              style={{
                ...getButtonStyle(),
                width: isMobile ? '48px' : '40px',
                height: isMobile ? '48px' : '40px'
              }}
              title={control.label}
              disabled={disabled}
            >
              {control.icon}
            </button>
          ))}
          
          {/* 扩展控制按钮 */}
          {extendedControls.map((control) => (
            <button
              key={control.id}
              onClick={control.onClick}
              style={{
                ...getButtonStyle(),
                width: isMobile ? '48px' : '40px',
                height: isMobile ? '48px' : '40px'
              }}
              title={control.label}
              disabled={disabled}
            >
              {control.icon}
            </button>
          ))}
        </div>
      )}

      {/* 导航控制按钮 */}
      <button
        onClick={navigationControl.onClick}
        style={getButtonStyle(navigationControl.isActive, navigationControl.isPrimary)}
        title={navigationControl.label}
        disabled={disabled}
      >
        {navigationControl.icon}
      </button>

      {/* 主控制按钮组 */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '8px' : '6px'
        }}
      >
        {mainControls.map((control) => (
          <button
            key={control.id}
            onClick={control.onClick}
            style={getButtonStyle(control.isActive)}
            title={control.label}
            disabled={disabled}
          >
            {control.icon}
          </button>
        ))}
      </div>

      {/* 展开/收起按钮 */}
      {(extendedControls.length > 0 || optionalControls.length > 0) && (
        <button
          onClick={toggleExpanded}
          style={{
            ...getButtonStyle(),
            width: isMobile ? '40px' : '36px',
            height: isMobile ? '40px' : '36px',
            transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
            backgroundColor: isExpanded ? '#ef4444' : '#6b7280'
          }}
          title={isExpanded ? '收起' : '更多'}
        >
          <span 
            style={{
              fontSize: isMobile ? '18px' : '16px',
              fontWeight: 'bold',
              color: 'white'
            }}
          >
            +
          </span>
        </button>
      )}

      {/* 动画样式 */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* 移动端触摸反馈 */
        @media (hover: none) and (pointer: coarse) {
          button:active {
            transform: scale(0.95);
          }
        }
        
        /* 桌面端悬停效果 */
        @media (hover: hover) and (pointer: fine) {
          button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
          }
        }
      `}</style>
    </div>
  );
};

export default MobileMapControls;