import React, { useState, useEffect, useCallback } from 'react';
import { performanceMonitor } from '../../utils/performance';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  message: ToastMessage;
  onClose: (id: string) => void;
}

/**
 * 单个Toast组件
 */
const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // 进入动画
    const timer = setTimeout(() => setIsVisible(true), 10);
    
    // 自动关闭
    if (message.duration && message.duration > 0) {
      const autoCloseTimer = setTimeout(() => {
        handleClose();
      }, message.duration);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(autoCloseTimer);
      };
    }
    
    return () => clearTimeout(timer);
  }, [message.duration]);

  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(message.id);
    }, 300); // 等待退出动画完成
  }, [message.id, onClose]);

  const getToastStyles = () => {
    const baseStyles: React.CSSProperties = {
      position: 'relative',
      padding: '12px 16px',
      marginBottom: '8px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      minWidth: '300px',
      maxWidth: '500px',
      transform: isVisible && !isLeaving ? 'translateX(0)' : 'translateX(100%)',
      opacity: isVisible && !isLeaving ? 1 : 0,
      transition: 'all 0.3s ease-in-out',
      fontSize: '14px',
      lineHeight: '1.4'
    };

    const typeStyles: Record<ToastType, React.CSSProperties> = {
      success: {
        backgroundColor: '#d4edda',
        borderLeft: '4px solid #28a745',
        color: '#155724'
      },
      error: {
        backgroundColor: '#f8d7da',
        borderLeft: '4px solid #dc3545',
        color: '#721c24'
      },
      warning: {
        backgroundColor: '#fff3cd',
        borderLeft: '4px solid #ffc107',
        color: '#856404'
      },
      info: {
        backgroundColor: '#d1ecf1',
        borderLeft: '4px solid #17a2b8',
        color: '#0c5460'
      }
    };

    return { ...baseStyles, ...typeStyles[message.type] };
  };

  const getIcon = () => {
    const iconMap: Record<ToastType, string> = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return iconMap[message.type];
  };

  return (
    <div style={getToastStyles()}>
      {/* 图标 */}
      <div style={{ fontSize: '16px', flexShrink: 0 }}>
        {getIcon()}
      </div>
      
      {/* 内容 */}
      <div style={{ flex: 1 }}>
        {message.title && (
          <div style={{ 
            fontWeight: 'bold', 
            marginBottom: '4px',
            fontSize: '15px'
          }}>
            {message.title}
          </div>
        )}
        <div>{message.message}</div>
        
        {/* 操作按钮 */}
        {message.action && (
          <button
            onClick={message.action.onClick}
            style={{
              marginTop: '8px',
              padding: '4px 8px',
              backgroundColor: 'transparent',
              border: '1px solid currentColor',
              borderRadius: '4px',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            {message.action.label}
          </button>
        )}
      </div>
      
      {/* 关闭按钮 */}
      <button
        onClick={handleClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          fontSize: '18px',
          padding: '0',
          opacity: 0.7,
          flexShrink: 0
        }}
      >
        ×
      </button>
    </div>
  );
};

/**
 * Toast容器组件
 */
interface ToastContainerProps {
  messages: ToastMessage[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  messages,
  onClose,
  position = 'top-right'
}) => {
  const getContainerStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      pointerEvents: 'none'
    };

    const positionStyles: Record<string, React.CSSProperties> = {
      'top-right': { top: '20px', right: '20px' },
      'top-left': { top: '20px', left: '20px' },
      'bottom-right': { bottom: '20px', right: '20px' },
      'bottom-left': { bottom: '20px', left: '20px' },
      'top-center': { top: '20px', left: '50%', transform: 'translateX(-50%)' },
      'bottom-center': { bottom: '20px', left: '50%', transform: 'translateX(-50%)' }
    };

    return { ...baseStyles, ...positionStyles[position] };
  };

  if (messages.length === 0) return null;

  return (
    <div style={getContainerStyles()}>
      <div style={{ pointerEvents: 'auto' }}>
        {messages.map(message => (
          <Toast
            key={message.id}
            message={message}
            onClose={onClose}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Toast Hook
 */
export const useToast = () => {
  const [messages, setMessages] = useState<ToastMessage[]>();

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastMessage = {
      id,
      duration: 5000, // 默认5秒
      ...toast
    };

    setMessages(prev => [...(prev || []), newToast]);
    
    // 记录Toast使用情况
    performanceMonitor.recordMetric('toast_shown', 1);
    performanceMonitor.recordMetric(`toast_${toast.type}`, 1);

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setMessages(prev => (prev || []).filter(msg => msg.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setMessages([]);
  }, []);

  // 便捷方法
  const success = useCallback((message: string, options?: Partial<Omit<ToastMessage, 'id' | 'type' | 'message'>>) => {
    return addToast({ type: 'success', message, ...options });
  }, [addToast]);

  const error = useCallback((message: string, options?: Partial<Omit<ToastMessage, 'id' | 'type' | 'message'>>) => {
    return addToast({ type: 'error', message, duration: 8000, ...options }); // 错误消息显示更久
  }, [addToast]);

  const warning = useCallback((message: string, options?: Partial<Omit<ToastMessage, 'id' | 'type' | 'message'>>) => {
    return addToast({ type: 'warning', message, ...options });
  }, [addToast]);

  const info = useCallback((message: string, options?: Partial<Omit<ToastMessage, 'id' | 'type' | 'message'>>) => {
    return addToast({ type: 'info', message, ...options });
  }, [addToast]);

  return {
    messages: messages || [],
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info
  };
};

export default Toast;