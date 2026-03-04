import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  overlay?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 加载动画组件
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = '#007bff',
  text,
  overlay = false,
  className = '',
  style = {}
}) => {
  const sizeMap = {
    small: 20,
    medium: 40,
    large: 60
  };

  const spinnerSize = sizeMap[size];

  const spinnerStyle: React.CSSProperties = {
    width: `${spinnerSize}px`,
    height: `${spinnerSize}px`,
    border: `${Math.max(2, spinnerSize / 10)}px solid #f3f3f3`,
    borderTop: `${Math.max(2, spinnerSize / 10)}px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    ...style
  };

  if (overlay) {
    containerStyle.position = 'fixed';
    containerStyle.top = 0;
    containerStyle.left = 0;
    containerStyle.right = 0;
    containerStyle.bottom = 0;
    containerStyle.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    containerStyle.backdropFilter = 'blur(2px)';
    containerStyle.zIndex = 9999;
  }

  return (
    <>
      <div className={`loading-spinner ${className}`} style={containerStyle}>
        <div style={spinnerStyle} />
        {text && (
          <div style={{
            color: '#666',
            fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
            fontWeight: '500',
            textAlign: 'center'
          }}>
            {text}
          </div>
        )}
      </div>
      
      {/* CSS动画 */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

/**
 * 骨架屏组件
 */
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  className = '',
  style = {}
}) => {
  const skeletonStyle: React.CSSProperties = {
    width,
    height,
    borderRadius,
    backgroundColor: '#f0f0f0',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-loading 1.5s infinite',
    ...style
  };

  return (
    <>
      <div className={`skeleton ${className}`} style={skeletonStyle} />
      
      {/* CSS动画 */}
      <style>{`
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  );
};

/**
 * 地图骨架屏组件
 */
interface MapSkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const MapSkeleton: React.FC<MapSkeletonProps> = ({
  className = '',
  style = {}
}) => {
  return (
    <div 
      className={`map-skeleton ${className}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
        ...style
      }}
    >
      {/* 地图主体骨架 */}
      <Skeleton 
        width="100%" 
        height="100%" 
        borderRadius="0"
        style={{ position: 'absolute' }}
      />
      
      {/* 控制按钮骨架 */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <Skeleton width="40px" height="40px" borderRadius="4px" />
        <Skeleton width="40px" height="40px" borderRadius="4px" />
        <Skeleton width="40px" height="40px" borderRadius="4px" />
      </div>
      
      {/* 状态栏骨架 */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        display: 'flex',
        gap: '8px'
      }}>
        <Skeleton width="60px" height="24px" borderRadius="12px" />
        <Skeleton width="50px" height="24px" borderRadius="12px" />
      </div>
      
      {/* 搜索框骨架 */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        right: '70px'
      }}>
        <Skeleton width="100%" height="40px" borderRadius="20px" />
      </div>
    </div>
  );
};

/**
 * 脉冲加载动画组件
 */
interface PulseLoaderProps {
  size?: number;
  color?: string;
  count?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const PulseLoader: React.FC<PulseLoaderProps> = ({
  size = 12,
  color = '#007bff',
  count = 3,
  className = '',
  style = {}
}) => {
  return (
    <>
      <div 
        className={`pulse-loader ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: `${size / 3}px`,
          ...style
        }}
      >
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              borderRadius: '50%',
              animation: `pulse-scale 1.4s ease-in-out ${index * 0.16}s infinite both`
            }}
          />
        ))}
      </div>
      
      {/* CSS动画 */}
      <style>{`
        @keyframes pulse-scale {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 1;
          }
          40% {
            transform: scale(1);
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  );
};

export default LoadingSpinner;