import React, { useState, useEffect } from 'react';

interface AIMascotProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const AIMascot: React.FC<AIMascotProps> = ({
  position = 'bottom-right',
  size = 'medium',
  className = ''
}) => {
  const [isWaving, setIsWaving] = useState(false);
  const [showBubble, setShowBubble] = useState(false);

  // 定期招手动画
  useEffect(() => {
    const waveInterval = setInterval(() => {
      setIsWaving(true);
      setShowBubble(true);
      setTimeout(() => {
        setIsWaving(false);
        setShowBubble(false);
      }, 2000);
    }, 8000); // 每8秒招手一次

    return () => clearInterval(waveInterval);
  }, []);

  // 尺寸配置
  const sizeConfig = {
    small: { width: 80, height: 100, scale: 0.8 },
    medium: { width: 100, height: 120, scale: 1 },
    large: { width: 120, height: 150, scale: 1.2 }
  };

  // 位置配置
  const positionConfig = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  const currentSize = sizeConfig[size];
  const currentPosition = positionConfig[position];

  return (
    <div 
      className={`fixed ${currentPosition} z-50 ${className}`}
      style={{ 
        width: currentSize.width,
        height: currentSize.height
      }}
    >
      {/* 对话气泡 */}
      {showBubble && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg px-3 py-2 whitespace-nowrap animate-bounce">
          <div className="text-xs text-gray-700 font-medium">你好呀！👋</div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-white"></div>
        </div>
      )}

      {/* 吉祥物主体 */}
      <div 
        className="relative w-full h-full cursor-pointer hover:scale-110 transition-transform duration-300"
        onClick={() => {
          setIsWaving(true);
          setShowBubble(true);
          setTimeout(() => {
            setIsWaving(false);
            setShowBubble(false);
          }, 2000);
        }}
      >
        <svg
          viewBox="0 0 100 120"
          className="w-full h-full drop-shadow-lg"
          style={{ transform: `scale(${currentSize.scale})` }}
        >
          {/* 身体 - 黄色衣服 */}
          <ellipse cx="50" cy="75" rx="20" ry="25" fill="#FFD700" />
          
          {/* 头部 - 米白色 */}
          <circle cx="50" cy="35" r="22" fill="#FFF5E6" />
          
          {/* 耳朵 */}
          <ellipse cx="32" cy="30" rx="8" ry="12" fill="#FFF5E6" />
          <ellipse cx="68" cy="30" rx="8" ry="12" fill="#FFF5E6" />
          <ellipse cx="32" cy="32" rx="4" ry="6" fill="#FFE4E1" />
          <ellipse cx="68" cy="32" rx="4" ry="6" fill="#FFE4E1" />
          
          {/* 脸颊腮红 */}
          <circle cx="38" cy="40" r="4" fill="#FFB6C1" opacity="0.6" />
          <circle cx="62" cy="40" r="4" fill="#FFB6C1" opacity="0.6" />
          
          {/* 眼睛 - 微笑的眼睛 */}
          <path
            d="M 42 32 Q 44 35 46 32"
            stroke="#8B4513"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 54 32 Q 56 35 58 32"
            stroke="#8B4513"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* 嘴巴 - 微笑 */}
          <path
            d="M 42 42 Q 50 48 58 42"
            stroke="#8B4513"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* 左手 - 招手动画 */}
          <g className={isWaving ? 'animate-wave' : ''}>
            <ellipse 
              cx="28" 
              cy="70" 
              rx="6" 
              ry="15" 
              fill="#FFD700"
              style={{
                transformOrigin: '28px 70px',
                transform: isWaving ? 'rotate(-30deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease-in-out'
              }}
            />
            {/* 手掌 */}
            <circle 
              cx="25" 
              cy="58" 
              r="5" 
              fill="#FFF5E6"
              style={{
                transformOrigin: '28px 70px',
                transform: isWaving ? 'rotate(-30deg) translateY(-2px)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease-in-out'
              }}
            />
          </g>
          
          {/* 右手 */}
          <ellipse cx="72" cy="70" rx="6" ry="15" fill="#FFD700" />
          <circle cx="75" cy="58" r="5" fill="#FFF5E6" />
          
          {/* 腿部 */}
          <rect x="42" y="95" width="7" height="18" rx="3" fill="#8B4513" />
          <rect x="51" y="95" width="7" height="18" rx="3" fill="#8B4513" />
          
          {/* 鞋子 */}
          <ellipse cx="45" cy="113" rx="5" ry="3" fill="#654321" />
          <ellipse cx="54" cy="113" rx="5" ry="3" fill="#654321" />
          
          {/* 装饰 - 衣服上的小星星 */}
          <path
            d="M 50 70 L 51 73 L 54 73 L 52 75 L 53 78 L 50 76 L 47 78 L 48 75 L 46 73 L 49 73 Z"
            fill="#FFA500"
          />
        </svg>

        {/* 阴影 */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-2 bg-black/10 rounded-full blur-sm"></div>
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-20deg); }
          75% { transform: rotate(20deg); }
        }
        
        .animate-wave {
          animation: wave 0.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AIMascot;
