import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, MapPin } from 'lucide-react';
import { errorHandler, ERROR_CODES } from '../../utils/errorHandler';
import ResponsiveUtils from '../../utils/responsive';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

/**
 * 地图组件专用错误边界
 * 提供更好的错误处理和恢复机制
 */
export class MapErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误到错误处理器
    errorHandler.logError(error, ERROR_CODES.MAP_SERVICE_ERROR, 'high');

    // 更新状态
    this.setState({
      error,
      errorInfo
    });

    // 调用外部错误处理回调
    this.props.onError?.(error, errorInfo);

    // 在开发环境下打印详细错误信息
    if (import.meta.env.DEV) {
      console.error('MapErrorBoundary caught an error:', error);
      console.error('Error info:', errorInfo);
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 否则使用默认的错误UI
      return <MapErrorFallback 
        error={this.state.error}
        errorInfo={this.state.errorInfo}
        retryCount={this.state.retryCount}
        maxRetries={this.maxRetries}
        onRetry={this.handleRetry}
        onReset={this.handleReset}
      />;
    }

    return this.props.children;
  }
}

interface MapErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  maxRetries: number;
  onRetry: () => void;
  onReset: () => void;
}

/**
 * 地图错误回退UI组件
 */
const MapErrorFallback: React.FC<MapErrorFallbackProps> = ({
  error,
  errorInfo,
  retryCount,
  maxRetries,
  onRetry,
  onReset
}) => {
  const deviceInfo = ResponsiveUtils.getDeviceInfo();
  const isMobile = deviceInfo.type === 'mobile';

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    border: '2px dashed #d1d5db',
    borderRadius: '12px',
    padding: isMobile ? '24px' : '32px',
    textAlign: 'center',
    minHeight: isMobile ? '300px' : '400px'
  };

  const getErrorMessage = () => {
    if (!error) return '地图加载失败';
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return '网络连接异常，无法加载地图';
    }
    
    if (error.message.includes('permission') || error.message.includes('geolocation')) {
      return '位置权限被拒绝，请允许访问位置信息';
    }
    
    if (error.message.includes('quota') || error.message.includes('storage')) {
      return '存储空间不足，请清理浏览器缓存';
    }
    
    return '地图服务暂时不可用';
  };

  const getErrorSuggestion = () => {
    if (!error) return '请尝试刷新页面';
    
    if (error.message.includes('network')) {
      return '请检查网络连接后重试';
    }
    
    if (error.message.includes('permission')) {
      return '请在浏览器设置中允许位置访问权限';
    }
    
    if (error.message.includes('quota')) {
      return '请清理浏览器缓存或释放存储空间';
    }
    
    return '请稍后重试或联系技术支持';
  };

  return (
    <div style={containerStyle}>
      {/* 错误图标 */}
      <div 
        style={{
          marginBottom: isMobile ? '20px' : '24px',
          color: '#ef4444'
        }}
      >
        <AlertTriangle size={isMobile ? 48 : 56} />
      </div>

      {/* 错误标题 */}
      <h3 
        style={{
          fontSize: isMobile ? '18px' : '20px',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: isMobile ? '12px' : '16px',
          margin: 0
        }}
      >
        {getErrorMessage()}
      </h3>

      {/* 错误描述 */}
      <p 
        style={{
          fontSize: isMobile ? '14px' : '16px',
          color: '#6b7280',
          marginBottom: isMobile ? '20px' : '24px',
          lineHeight: '1.5',
          margin: 0,
          marginBottom: isMobile ? '20px' : '24px'
        }}
      >
        {getErrorSuggestion()}
      </p>

      {/* 重试次数提示 */}
      {retryCount > 0 && (
        <p 
          style={{
            fontSize: isMobile ? '12px' : '14px',
            color: '#9ca3af',
            marginBottom: isMobile ? '16px' : '20px',
            margin: 0,
            marginBottom: isMobile ? '16px' : '20px'
          }}
        >
          已重试 {retryCount} 次
        </p>
      )}

      {/* 操作按钮 */}
      <div 
        style={{
          display: 'flex',
          gap: isMobile ? '12px' : '16px',
          flexDirection: isMobile ? 'column' : 'row',
          width: isMobile ? '100%' : 'auto'
        }}
      >
        {/* 重试按钮 */}
        {retryCount < maxRetries && (
          <button
            onClick={onRetry}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: isMobile ? '12px 24px' : '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: isMobile ? '14px' : '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              minWidth: isMobile ? '100%' : '120px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
            }}
          >
            <RefreshCw size={16} />
            重试
          </button>
        )}

        {/* 重置按钮 */}
        <button
          onClick={onReset}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: isMobile ? '12px 24px' : '10px 20px',
            backgroundColor: 'transparent',
            color: '#6b7280',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
            minWidth: isMobile ? '100%' : '120px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f9fafb';
            e.currentTarget.style.borderColor = '#9ca3af';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
        >
          <MapPin size={16} />
          重新加载
        </button>
      </div>

      {/* 开发模式下显示详细错误信息 */}
      {import.meta.env.DEV && error && (
        <details 
          style={{
            marginTop: isMobile ? '20px' : '24px',
            width: '100%',
            maxWidth: '600px'
          }}
        >
          <summary 
            style={{
              fontSize: isMobile ? '12px' : '14px',
              color: '#6b7280',
              cursor: 'pointer',
              marginBottom: '8px'
            }}
          >
            查看详细错误信息
          </summary>
          <pre 
            style={{
              fontSize: '11px',
              color: '#374151',
              backgroundColor: '#f3f4f6',
              padding: '12px',
              borderRadius: '6px',
              overflow: 'auto',
              textAlign: 'left',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
};

export default MapErrorBoundary;