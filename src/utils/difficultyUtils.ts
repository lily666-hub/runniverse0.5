// 难度分级工具函数

export interface DifficultyLevel {
  level: number;
  category: 'easy' | 'moderate' | 'hard';
  name: string;
  description: string;
  distanceRange: string;
  paceRange: string;
  elevationRange: string;
  characteristics: string[];
  tips: string[];
}

// 难度级别详细配置
export const DIFFICULTY_LEVELS: Record<number, DifficultyLevel> = {
  1: {
    level: 1,
    category: 'easy',
    name: '入门级',
    description: '完全适合跑步新手',
    distanceRange: '1-2km',
    paceRange: '7-8分钟/km',
    elevationRange: '0-20m',
    characteristics: ['平坦道路', '公园步道', '无技术要求'],
    tips: ['建议走跑结合', '注意热身拉伸', '循序渐进增加距离']
  },
  2: {
    level: 2,
    category: 'easy',
    name: '初级',
    description: '有少量跑步经验',
    distanceRange: '2-3km',
    paceRange: '6-7分钟/km',
    elevationRange: '20-50m',
    characteristics: ['公园道路', '轻微起伏', '良好路面'],
    tips: ['保持匀速', '控制呼吸节奏', '适当增加频率']
  },
  3: {
    level: 3,
    category: 'easy',
    name: '初级进阶',
    description: '可以连续跑步30分钟',
    distanceRange: '3-5km',
    paceRange: '5.5-6.5分钟/km',
    elevationRange: '50-100m',
    characteristics: ['混合路面', '小坡度', '多样地形'],
    tips: ['尝试间歇训练', '加强核心力量', '注意营养补充']
  },
  4: {
    level: 4,
    category: 'moderate',
    name: '中级',
    description: '有规律跑步习惯',
    distanceRange: '5-7km',
    paceRange: '5-6分钟/km',
    elevationRange: '100-200m',
    characteristics: ['起伏路面', '台阶路段', '中等难度'],
    tips: ['增加爬坡训练', '提高心肺功能', '制定训练计划']
  },
  5: {
    level: 5,
    category: 'moderate',
    name: '中级进阶',
    description: '可以完成10K跑步',
    distanceRange: '7-10km',
    paceRange: '4.5-5.5分钟/km',
    elevationRange: '200-300m',
    characteristics: ['复杂地形', '连续爬坡', '技术要求'],
    tips: ['长距离耐力训练', '速度与耐力结合', '恢复训练重要']
  },
  6: {
    level: 6,
    category: 'moderate',
    name: '中高级',
    description: '半程马拉松水平',
    distanceRange: '10-15km',
    paceRange: '4-5分钟/km',
    elevationRange: '300-500m',
    characteristics: ['山地步道', '技术路段', '挑战性地形'],
    tips: ['专项技术训练', '营养策略制定', '伤病预防']
  },
  7: {
    level: 7,
    category: 'hard',
    name: '高级',
    description: '全程马拉松水平',
    distanceRange: '15-20km',
    paceRange: '3.5-4.5分钟/km',
    elevationRange: '500-800m',
    characteristics: ['山地越野', '技术难度高', '极具挑战'],
    tips: ['高强度间歇训练', '专业装备需求', '科学恢复']
  },
  8: {
    level: 8,
    category: 'hard',
    name: '专业级',
    description: '竞技水平跑者',
    distanceRange: '20-30km',
    paceRange: '3-4分钟/km',
    elevationRange: '800-1200m',
    characteristics: ['极具挑战性地形', '专业技术要求', '高强度'],
    tips: ['专业教练指导', '精确数据监控', '个性化训练']
  },
  9: {
    level: 9,
    category: 'hard',
    name: '精英级',
    description: '接近专业运动员',
    distanceRange: '30-40km',
    paceRange: '2.5-3.5分钟/km',
    elevationRange: '1200-1800m',
    characteristics: ['极限挑战路线', '专业级要求', '顶级难度'],
    tips: ['专业团队支持', '科学训练体系', '心理素质训练']
  },
  10: {
    level: 10,
    category: 'hard',
    name: '极限级',
    description: '专业运动员水平',
    distanceRange: '40km+',
    paceRange: '2.5分钟/km以下',
    elevationRange: '1800m+',
    characteristics: ['超级挑战路线', '极限技术要求', '顶级专业'],
    tips: ['顶级专业训练', '全方位科学支持', '极限挑战精神']
  }
};

// 获取难度级别信息
export const getDifficultyLevel = (level: number): DifficultyLevel | null => {
  return DIFFICULTY_LEVELS[level] || null;
};

// 获取难度分类
export const getDifficultyCategory = (level: number): 'easy' | 'moderate' | 'hard' => {
  if (level >= 1 && level <= 3) return 'easy';
  if (level >= 4 && level <= 6) return 'moderate';
  return 'hard';
};

// 获取分类标签
export const getCategoryLabel = (category: 'easy' | 'moderate' | 'hard'): string => {
  const labels = {
    easy: '轻松跑',
    moderate: '挑战跑',
    hard: '极限跑'
  };
  return labels[category];
};

// 获取分类描述
export const getCategoryDescription = (category: 'easy' | 'moderate' | 'hard'): string => {
  const descriptions = {
    easy: '适合初学者和休闲跑者，路线平坦，距离较短',
    moderate: '适合有一定基础的跑者，有一定挑战性',
    hard: '适合经验丰富的跑者，具有很高的挑战性'
  };
  return descriptions[category];
};

// 获取分类范围
export const getCategoryRange = (category: 'easy' | 'moderate' | 'hard'): [number, number] => {
  const ranges = {
    easy: [1, 3] as [number, number],
    moderate: [4, 6] as [number, number],
    hard: [7, 10] as [number, number]
  };
  return ranges[category];
};

// 获取推荐的下一个难度级别
export const getNextDifficultyLevel = (currentLevel: number): number | null => {
  if (currentLevel >= 10) return null;
  return currentLevel + 1;
};

// 获取推荐的上一个难度级别
export const getPreviousDifficultyLevel = (currentLevel: number): number | null => {
  if (currentLevel <= 1) return null;
  return currentLevel - 1;
};

// 判断用户是否适合某个难度级别
export const isUserSuitableForLevel = (
  userLevel: number,
  targetLevel: number,
  allowChallenge: boolean = true
): boolean => {
  const diff = targetLevel - userLevel;
  
  // 如果目标级别低于或等于用户级别，总是适合
  if (diff <= 0) return true;
  
  // 如果允许挑战，可以尝试高1-2级的难度
  if (allowChallenge && diff <= 2) return true;
  
  // 否则不适合
  return false;
};

// 获取用户推荐的难度级别范围
export const getRecommendedLevelRange = (
  userLevel: number,
  includeChallenge: boolean = true
): [number, number] => {
  const minLevel = Math.max(1, userLevel - 1);
  const maxLevel = includeChallenge 
    ? Math.min(10, userLevel + 2)
    : Math.min(10, userLevel + 1);
  
  return [minLevel, maxLevel];
};

// 根据用户能力评估推荐难度
export const assessUserCapability = (
  totalRuns: number,
  avgDistance: number,
  avgPace: number, // 分钟/km
  completedDifficulties: number[]
): number => {
  let recommendedLevel = 1;
  
  // 基于跑步次数
  if (totalRuns >= 50) recommendedLevel += 2;
  else if (totalRuns >= 20) recommendedLevel += 1;
  
  // 基于平均距离
  if (avgDistance >= 15) recommendedLevel += 3;
  else if (avgDistance >= 10) recommendedLevel += 2;
  else if (avgDistance >= 5) recommendedLevel += 1;
  
  // 基于配速
  if (avgPace <= 3.5) recommendedLevel += 3;
  else if (avgPace <= 4.5) recommendedLevel += 2;
  else if (avgPace <= 5.5) recommendedLevel += 1;
  
  // 基于完成的最高难度
  if (completedDifficulties.length > 0) {
    const maxCompleted = Math.max(...completedDifficulties);
    recommendedLevel = Math.max(recommendedLevel, maxCompleted);
  }
  
  return Math.min(10, recommendedLevel);
};

// 生成难度进阶建议
export const generateProgressionAdvice = (currentLevel: number): string[] => {
  const advice: string[] = [];
  const nextLevel = getNextDifficultyLevel(currentLevel);
  
  if (!nextLevel) {
    advice.push('您已达到最高难度级别，继续保持并挑战自己的极限！');
    return advice;
  }
  
  const current = getDifficultyLevel(currentLevel);
  const next = getDifficultyLevel(nextLevel);
  
  if (current && next) {
    advice.push(`当前级别：${current.name} (Level ${currentLevel})`);
    advice.push(`下一目标：${next.name} (Level ${nextLevel})`);
    advice.push('进阶建议：');
    
    // 根据级别差异给出具体建议
    if (next.category !== current.category) {
      advice.push(`• 准备进入${getCategoryLabel(next.category)}阶段`);
    }
    
    advice.push(`• 逐步增加距离至${next.distanceRange}`);
    advice.push(`• 提升配速至${next.paceRange}`);
    advice.push(`• 适应${next.elevationRange}的爬升挑战`);
    
    // 添加具体训练建议
    next.tips.forEach(tip => {
      advice.push(`• ${tip}`);
    });
  }
  
  return advice;
};