// 天干映射表
export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// 地支映射表
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/**
 * 将期号转换为天干地支
 * @param period 期号（从1开始）
 * @returns 对应的天干地支字符串，如"甲子"
 */
export const periodToGanZhi = (period: number): string => {
  if (period < 1) {
    throw new Error('期号必须大于0');
  }
  
  // 天干计算：期号 % 10，结果为0时对应第10个天干
  const stemIndex = (period - 1) % 10;
  const stem = HEAVENLY_STEMS[stemIndex];
  
  // 地支计算：期号 % 12，结果为0时对应第12个地支
  const branchIndex = (period - 1) % 12;
  const branch = EARTHLY_BRANCHES[branchIndex];
  
  return `${stem}${branch}`;
};
