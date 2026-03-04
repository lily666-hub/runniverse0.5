import React from 'react';

// 难度配置
export const DIFFICULTY_CONFIG = {
  easy: {
    label: '轻松跑',
    color: 'bg-green-100 text-green-800 border-green-200',
    range: [1, 3]
  },
  moderate: {
    label: '挑战跑', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    range: [4, 6]
  },
  hard: {
    label: '极限跑',
    color: 'bg-red-100 text-red-800 border-red-200',
    range: [7, 10]
  }
};

export type DifficultyType = keyof typeof DIFFICULTY_CONFIG;

export const getDifficultyType = (level: number): DifficultyType => {
  if (level >= 1 && level <= 3) return 'easy';
  if (level >= 4 && level <= 6) return 'moderate';
  return 'hard';
};

export const getDifficultyConfig = (level: number) => {
  const type = getDifficultyType(level);
  return DIFFICULTY_CONFIG[type];
};

interface DifficultyBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showLevel?: boolean;
  className?: string;
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ 
  level, 
  size = 'md',
  showLabel = false,
  showLevel = true,
  className = ''
}) => {
  const config = getDifficultyConfig(level);
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span className={`
      inline-flex items-center gap-1 rounded-full border font-medium
      ${config.color}
      ${sizeClasses[size]}
      ${className}
    `}>
      {showLevel && <span>Level {level}</span>}
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};

export default DifficultyBadge;