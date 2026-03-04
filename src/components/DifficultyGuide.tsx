import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, Target, Zap } from 'lucide-react';
import { DIFFICULTY_LEVELS, getDifficultyCategory, getCategoryLabel } from '../utils/difficultyUtils';
import { DifficultyBadge } from './DifficultyBadge';

interface DifficultyGuideProps {
  className?: string;
}

export const DifficultyGuide: React.FC<DifficultyGuideProps> = ({ className = '' }) => {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'easy' | 'moderate' | 'hard'>('all');

  const toggleLevel = (level: number) => {
    setExpandedLevel(expandedLevel === level ? null : level);
  };

  const getCategoryIcon = (category: 'easy' | 'moderate' | 'hard') => {
    switch (category) {
      case 'easy': return Info;
      case 'moderate': return Target;
      case 'hard': return Zap;
    }
  };

  const filteredLevels = Object.values(DIFFICULTY_LEVELS).filter(level => {
    if (selectedCategory === 'all') return true;
    return level.category === selectedCategory;
  });

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">跑步难度分级指南</h3>
        
        {/* 分类筛选 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {(['easy', 'moderate', 'hard'] as const).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getCategoryLabel(category)}
            </button>
          ))}
        </div>

        {/* 难度级别列表 */}
        <div className="space-y-3">
          {filteredLevels.map((level) => {
            const Icon = getCategoryIcon(level.category);
            const isExpanded = expandedLevel === level.level;
            
            return (
              <div key={level.level} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleLevel(level.level)}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <DifficultyBadge 
                        level={level.level} 
                        size="sm" 
                        showLevel={true}
                        showLabel={false}
                      />
                      <div>
                        <h4 className="font-semibold text-gray-800">{level.name}</h4>
                        <p className="text-sm text-gray-600">{level.description}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-lg">
                        <h5 className="font-medium text-gray-700 mb-1">距离范围</h5>
                        <p className="text-sm text-gray-600">{level.distanceRange}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <h5 className="font-medium text-gray-700 mb-1">配速范围</h5>
                        <p className="text-sm text-gray-600">{level.paceRange}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <h5 className="font-medium text-gray-700 mb-1">爬升范围</h5>
                        <p className="text-sm text-gray-600">{level.elevationRange}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-lg">
                        <h5 className="font-medium text-gray-700 mb-2">路线特点</h5>
                        <ul className="space-y-1">
                          {level.characteristics.map((char, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                              {char}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <h5 className="font-medium text-gray-700 mb-2">训练建议</h5>
                        <ul className="space-y-1">
                          {level.tips.map((tip, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 说明文字 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">使用说明</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 选择适合您当前能力的难度级别</li>
            <li>• 建议从较低级别开始，逐步提升</li>
            <li>• 每次提升不超过1-2个级别</li>
            <li>• 注意安全，量力而行</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DifficultyGuide;