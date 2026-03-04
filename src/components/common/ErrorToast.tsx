// 改进的错误提示组件
import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Info, X, Wifi, WifiOff } from 'lucide-react';
import { ErrorAnalyzer, ErrorType, ErrorTypes } from '../../utils/networkUtils';

interface ErrorToastProps {
  error: string | null;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  showNetworkStatus?: boolean;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  error,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
  showNetworkStatus = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
        
        return () => clearTimeout(timer);
      }
    } else {
      // 立即隐藏，不等待动画
      setIsVisible(false);
    }
  }, [error, autoClose, autoCloseDelay]);

  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // 等待动画完成
  };

  // 如果没有错误，立即返回null
  if (!error) return null;

  const errorAnalysis = ErrorAnalyzer.analyzeError({ message: error });
  
  const getErrorIcon = (type: ErrorType) => {
    switch (type) {
      case ErrorTypes.NETWORK:
        return <WifiOff className="w-4 h-4" />;
      case ErrorTypes.DATABASE:
        return <AlertCircle className="w-4 h-4" />;
      case ErrorTypes.AI_SERVICE:
        return <Info className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getErrorColor = (type: ErrorType) => {
    switch (type) {
      case ErrorTypes.NETWORK:
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case ErrorTypes.DATABASE:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case ErrorTypes.AI_SERVICE:
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const getIconColor = (type: ErrorType) => {
    switch (type) {
      case ErrorTypes.NETWORK:
        return 'text-orange-500';
      case ErrorTypes.DATABASE:
        return 'text-yellow-500';
      case ErrorTypes.AI_SERVICE:
        return 'text-blue-500';
      default:
        return 'text-red-500';
    }
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-md w-full
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className={`
        p-4 rounded-lg border shadow-lg
        ${getErrorColor(errorAnalysis.type)}
      `}>
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 ${getIconColor(errorAnalysis.type)}`}>
            {getErrorIcon(errorAnalysis.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-medium">
                  {errorAnalysis.message}
                </h4>
                <p className="text-xs mt-1 opacity-80">
                  {errorAnalysis.suggestion}
                </p>
                
                {showNetworkStatus && (
                  <div className="flex items-center space-x-1 mt-2 text-xs opacity-70">
                    {networkStatus ? (
                      <>
                        <Wifi className="w-3 h-3" />
                        <span>网络已连接</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3" />
                        <span>网络已断开</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <button
                onClick={handleClose}
                className="flex-shrink-0 ml-2 p-1 rounded-md hover:bg-black hover:bg-opacity-10 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 成功提示组件
interface SuccessToastProps {
  message: string | null;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({
  message,
  onClose,
  autoClose = true,
  autoCloseDelay = 3000,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [message, autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!message) return null;

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-md w-full
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="p-4 rounded-lg border shadow-lg bg-green-50 border-green-200 text-green-800">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium">{message}</p>
              
              <button
                onClick={handleClose}
                className="flex-shrink-0 ml-2 p-1 rounded-md hover:bg-green-200 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}