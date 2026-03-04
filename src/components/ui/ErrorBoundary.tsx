import React, { Component, ReactNode } from 'react';
import { performanceMonitor } from '../../utils/performance';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

/**
 * 错误边界组件 - 用于捕获和处理React组件错误
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private maxRetries = 3;
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 更新状态以显示错误UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ErrorBoundary捕获到错误:', error);
    console.error('错误详情:', errorInfo);

    // 记录错误到性能监控
    performanceMonitor.recordMetric('react_error_caught', 1);
    performanceMonitor.recordMetric('error_component_stack_length', 
      errorInfo.componentStack.split('\n').length
    );

    // 更新状态
    this.setState({
      errorInfo,
      retryCount: this.state.retryCount + 1
    });

    // 调用外部错误处理器
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 发送错误报告（生产环境）
    if (import.meta.env.PROD) {
      this.reportError(error, errorInfo);
    }
  }

  componentWillUnmount() {
    // 清理定时器
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  /**
   * 发送错误报告到监控服务
   */
  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      // 这里可以集成错误监控服务，如Sentry、LogRocket等
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        retryCount: this.state.retryCount
      };

      console.log('📊 错误报告:', errorReport);
      
      // 实际项目中可以发送到错误监控服务
      // fetch('/api/error-report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // });
    } catch (reportError) {
      console.error('发送错误报告失败:', reportError);
    }
  };

  /**
   * 重试渲染
   */
  private handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      console.warn('已达到最大重试次数，停止重试');
      return;
    }

    console.log(`🔄 重试渲染 (${this.state.retryCount + 1}/${this.maxRetries})`);
    
    // 延迟重试，避免立即失败
    const timeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
      
      performanceMonitor.recordMetric('error_boundary_retry', 1);
    }, 1000 * this.state.retryCount); // 递增延迟

    this.retryTimeouts.push(timeout);
  };

  /**
   * 重置错误状态
   */
  private handleReset = () => {
    console.log('🔄 重置错误边界');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
    
    performanceMonitor.recordMetric('error_boundary_reset', 1);
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #ff4757',
          borderRadius: '8px',
          backgroundColor: '#fff5f5',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            🚨
          </div>
          
          <h2 style={{
            color: '#ff4757',
            marginBottom: '16px',
            fontSize: '20px'
          }}>
            组件渲染出错
          </h2>
          
          <p style={{
            color: '#666',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            抱歉，页面遇到了一些问题。请尝试刷新页面或联系技术支持。
          </p>

          {/* 错误详情（开发模式） */}
          {import.meta.env.DEV && this.state.error && (
            <details style={{
              marginBottom: '20px',
              textAlign: 'left',
              backgroundColor: '#f8f9fa',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                查看错误详情
              </summary>
              <pre style={{
                marginTop: '8px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#dc3545'
              }}>
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}

          {/* 操作按钮 */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {this.state.retryCount < this.maxRetries && (
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🔄 重试 ({this.maxRetries - this.state.retryCount} 次剩余)
              </button>
            )}
            
            <button
              onClick={this.handleReset}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔄 重置
            </button>
            
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔄 刷新页面
            </button>
          </div>

          {/* 重试次数提示 */}
          {this.state.retryCount > 0 && (
            <p style={{
              marginTop: '16px',
              fontSize: '12px',
              color: '#999'
            }}>
              已重试 {this.state.retryCount} 次
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;