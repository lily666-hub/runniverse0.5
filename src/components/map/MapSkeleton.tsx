import React from 'react';
import ResponsiveUtils from '../../utils/responsive';

interface MapSkeletonProps {
  showControls?: boolean;
  showStatus?: boolean;
}

/**
 * 地图加载骨架屏组件
 * 在地图加载时显示，提供良好的用户体验
 */
export const MapSkeleton: React.FC<MapSkeletonProps> = ({
  showControls = true,
  showStatus = true
}) => {
  const deviceInfo = ResponsiveUtils.getDeviceInfo();
  const isMobile = deviceInfo.type === 'mobile';

  const skeletonStyle: React.CSSProperties = {
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    animation: 'skeleton-pulse 1.5s ease-in-out infinite alternate'
  };

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden'
  };

  return (
    <div style={containerStyle}>
      {/* 主地图区域骨架 */}
      <div 
        style={{
          ...skeletonStyle,
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />

      {/* 控制按钮骨架 */}
      {showControls && (
        <div 
          style={{
            position: 'absolute',
            top: isMobile ? '20px' : '16px',
            left: isMobile ? '16px' : '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '12px' : '8px',
            zIndex: 10
          }}
        >
          {/* 定位按钮 */}
          <div 
            style={{
              ...skeletonStyle,
              width: isMobile ? '48px' : '40px',
              height: isMobile ? '48px' : '40px',
              borderRadius: '50%'
            }}
          />
          
          {/* 追踪按钮 */}
          <div 
            style={{
              ...skeletonStyle,
              width: isMobile ? '48px' : '40px',
              height: isMobile ? '48px' : '40px',
              borderRadius: '50%'
            }}
          />
          
          {/* 导航按钮 */}
          <div 
            style={{
              ...skeletonStyle,
              width: isMobile ? '48px' : '40px',
              height: isMobile ? '48px' : '40px',
              borderRadius: '50%'
            }}
          />
        </div>
      )}

      {/* 状态指示器骨架 */}
      {showStatus && (
        <div 
          style={{
            position: 'absolute',
            bottom: isMobile ? '120px' : '100px',
            left: isMobile ? '16px' : '20px',
            zIndex: 10
          }}
        >
          <div 
            style={{
              ...skeletonStyle,
              width: isMobile ? '200px' : '180px',
              height: isMobile ? '40px' : '36px',
              borderRadius: isMobile ? '20px' : '18px'
            }}
          />
        </div>
      )}

      {/* 性能监控面板骨架（开发模式） */}
      {import.meta.env.DEV && (
        <div 
          style={{
            position: 'absolute',
            top: isMobile ? '20px' : '10px',
            right: isMobile ? '16px' : '10px',
            zIndex: 10
          }}
        >
          <div 
            style={{
              ...skeletonStyle,
              width: isMobile ? '250px' : '200px',
              height: isMobile ? '120px' : '100px',
              borderRadius: '8px'
            }}
          />
        </div>
      )}

      {/* 加载文本 */}
      <div 
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          zIndex: 20
        }}
      >
        <div 
          style={{
            ...skeletonStyle,
            width: '120px',
            height: '20px',
            marginBottom: '12px'
          }}
        />
        <div 
          style={{
            color: '#6b7280',
            fontSize: isMobile ? '14px' : '13px',
            fontWeight: '500'
          }}
        >
          正在加载地图...
        </div>
      </div>

      {/* 骨架屏动画样式 */}
      <style>{`
        @keyframes skeleton-pulse {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
};

export default MapSkeleton;