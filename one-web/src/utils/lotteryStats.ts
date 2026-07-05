import { HEXAGRAMS } from '../constants/hexagrams';

export interface LotteryDraw {
  id: string;
  period: number;
  raw: string;
  redNumbers: string[];
  blueNumber: string;
  redSum: number;
  oddCount: number;
  evenCount: number;
  bigCount: number;
  smallCount: number;
  consecutivePairs: number;
  combination: string;
  planetName: string;
  hexagramCode: string;
  hexagramName: string;
}

export interface FrequencyItem {
  number: string;
  count: number;
}

export interface NumberOmissionItem extends FrequencyItem {
  currentOmission: number;
  averageOmission: number;
  maxOmission: number;
  omissionRatio: number;
}

export interface StructureInsight {
  label: string;
  type: string;
  recentCount: number;
  recentPercentage: number;
  historicalPercentage: number;
  delta: number;
}

export interface DistributionHealthMetric {
  key: string;
  label: string;
  description: string;
  expected: string;
  actual: string;
  healthScore: number;
  deviation: number;
  standardDeviation: number;
  squaredDeviation: number;
  maxMinGap: number;
  richest?: string;
  poorest?: string;
}

export interface TeamMemberStatus {
  number: string;
  steps: number;
  expectedSteps: number;
  stepDiff: number;
  diffRatio: number;
  status: 'ahead' | 'on-track' | 'behind';
}

export interface TeamGroupStatus {
  name: string;
  numbers: string[];
  totalSteps: number;
  expectedSteps: number;
  stepDiff: number;
  standardDeviation: number;
  leader: TeamMemberStatus;
  laggard: TeamMemberStatus;
}

export interface TeamState {
  title: string;
  expectedStepText: string;
  alignmentScore: number;
  averageSteps: number;
  standardDeviation: number;
  squaredDeviation: number;
  maxStepGap: number;
  aheadCount: number;
  behindCount: number;
  onTrackCount: number;
  leader: TeamMemberStatus;
  laggard: TeamMemberStatus;
  members: TeamMemberStatus[];
  groups: TeamGroupStatus[];
}

export interface CandidatePools {
  activeRed: FrequencyItem[];
  overdueRed: NumberOmissionItem[];
  balancedRed: NumberOmissionItem[];
  blueFocus: NumberOmissionItem[];
}

export interface LotteryPrediction {
  title: string;
  redNumbers: string[];
  blueNumber: string;
  score: number;
  tags: string[];
  reason: string;
}

export interface LotteryNumberProbability {
  number: string;
  type: 'red' | 'blue';
  probability: number;
  score: number;
  poolTotalScore: number;
  probabilityPool: number;
  rank: number;
  historyCount: number;
  recentCount: number;
  currentOmission: number;
  averageOmission: number;
  omissionPressure: number;
  omissionRatio: number;
  oddEvenLabel?: string;
  sizeLabel?: string;
  zoneLabel?: string;
  groupLabel?: string;
  factors: string[];
  scoreParts: Array<{
    label: string;
    score: number;
    description: string;
  }>;
}

export interface LotteryProbabilityAnalysis {
  red: LotteryNumberProbability[];
  blue: LotteryNumberProbability[];
  summary: {
    redTargetOddCount: number;
    redTargetBigCount: number;
    redTargetAverage: number;
    recentOddEvenCombination: string;
    recentBigSmallCombination: string;
    redFrequencyStandardDeviation: number;
    blueFrequencyStandardDeviation: number;
    redFrequencyVariance: number;
    blueFrequencyVariance: number;
  };
}

export interface PredictionRuleConfig {
  id: string;
  name: string;
  recentWindow: number;
  activeWeight: number;
  omissionWeight: number;
  balancedWeight: number;
  blueOmissionWeight: number;
  averageDiffWeight: number;
  squaredDiffWeight: number;
  oddEvenProbabilityWeight: number;
  targetOddCount: number;
  targetBigCount: number;
  requireZoneCoverage: boolean;
  avoidLastDraw: boolean;
}

export interface LotteryPredictionScore {
  redHits: number;
  blueHit: boolean;
  structureHits: number;
  prizeLevel: number;
  prizeName: string;
  score: number;
}

export interface LotteryPredictionReplay {
  targetDraw: LotteryDraw;
  trainingDrawCount: number;
  predictions: Array<LotteryPrediction & { result: LotteryPredictionScore }>;
  bestPrediction: LotteryPrediction & { result: LotteryPredictionScore };
}

export interface LotteryReplaySummary {
  total: number;
  averageScore: number;
  bestScore: number;
  averageRedHits: number;
  blueHitRate: number;
  prizeDistribution: Record<string, number>;
  bestStrategy?: string;
  improvementTips: string[];
}

export interface LotteryReplayReport {
  replays: LotteryPredictionReplay[];
  summary: LotteryReplaySummary;
}

export interface LotteryRuleTrainingResult {
  config: PredictionRuleConfig;
  summary: LotteryReplaySummary;
  rankScore: number;
}

export interface LotteryRuleTrainingReport {
  candidates: LotteryRuleTrainingResult[];
  best?: LotteryRuleTrainingResult;
  replayCount: number;
}

export interface LotteryStats {
  draws: LotteryDraw[];
  latestDraw?: LotteryDraw;
  redFrequency: FrequencyItem[];
  blueFrequency: FrequencyItem[];
  redOmissions: NumberOmissionItem[];
  blueOmissions: NumberOmissionItem[];
  structureInsights: StructureInsight[];
  distributionHealth: DistributionHealthMetric[];
  teamStates: TeamState[];
  candidatePools: CandidatePools;
  predictions: LotteryPrediction[];
  probabilityAnalysis: LotteryProbabilityAnalysis;
  recentDrawCount: number;
  recentAverageRedSum: number;
  recentRedSumSpan: number;
  recentMostFrequentRed?: FrequencyItem;
  recentMostFrequentBlue?: FrequencyItem;
  dominantCombination?: {
    name: string;
    count: number;
    percentage: number;
  };
  redCoverage: number;
  blueCoverage: number;
  averageRedSum: number;
  mostFrequentRed?: FrequencyItem;
  mostFrequentBlue?: FrequencyItem;
}

export const defaultPredictionRuleConfig: PredictionRuleConfig = {
  id: 'default',
  name: '默认综合规则',
  recentWindow: 20,
  activeWeight: 1,
  omissionWeight: 1,
  balancedWeight: 1,
  blueOmissionWeight: 1,
  averageDiffWeight: 1,
  squaredDiffWeight: 1,
  oddEvenProbabilityWeight: 1,
  targetOddCount: 3,
  targetBigCount: 3,
  requireZoneCoverage: true,
  avoidLastDraw: false
};

const planetByOddCount: Record<number, string> = {
  6: '天王星',
  5: '土星',
  4: '木星',
  3: '火星',
  2: '金星',
  1: '水星',
  0: '地球'
};

const createFrequencySeed = (max: number) => {
  const seed: Record<string, number> = {};
  for (let index = 1; index <= max; index += 1) {
    seed[String(index).padStart(2, '0')] = 0;
  }
  return seed;
};

const normalizeRecords = (allRecords: string | string[]) => {
  const records = typeof allRecords === 'string' ? allRecords.split('\n') : allRecords;
  return records
    .map(record => record.trim())
    .filter(record => /^\d{14}$/.test(record));
};

const countConsecutivePairs = (numbers: number[]) => {
  const sorted = [...numbers].sort((a, b) => a - b);
  return sorted.reduce((count, number, index) => {
    if (index === 0) return count;
    return sorted[index - 1] + 1 === number ? count + 1 : count;
  }, 0);
};

export const parseLotteryDraws = (allRecords: string | string[]): LotteryDraw[] => {
  return normalizeRecords(allRecords).map((record, index) => {
    const redNumbers = record.slice(0, 12).match(/.{2}/g) || [];
    const redValues = redNumbers.map(number => Number(number));
    const blueNumber = record.slice(12, 14);
    const oddCount = redValues.filter(number => number % 2 !== 0).length;
    const evenCount = redValues.length - oddCount;
    const bigCount = redValues.filter(number => number >= 17).length;
    const smallCount = redValues.length - bigCount;
    const redSum = redValues.reduce((sum, number) => sum + number, 0);
    const hexagramCode = redValues.map(number => number % 2 === 1 ? '1' : '0').join('');
    const hexagram = HEXAGRAMS[hexagramCode] || { name: '坤' };
    const planetName = planetByOddCount[oddCount] || '地球';

    return {
      id: `${index + 1}-${record}`,
      period: index + 1,
      raw: record,
      redNumbers,
      blueNumber,
      redSum,
      oddCount,
      evenCount,
      bigCount,
      smallCount,
      consecutivePairs: countConsecutivePairs(redValues),
      combination: `${oddCount}奇${evenCount}偶`,
      planetName,
      hexagramCode,
      hexagramName: hexagram.name
    };
  });
};

export const buildFrequency = (draws: LotteryDraw[], type: 'red' | 'blue'): FrequencyItem[] => {
  const frequency = createFrequencySeed(type === 'red' ? 33 : 16);

  draws.forEach(draw => {
    if (type === 'red') {
      draw.redNumbers.forEach(number => {
        frequency[number] += 1;
      });
      return;
    }

    frequency[draw.blueNumber] += 1;
  });

  return Object.entries(frequency)
    .map(([number, count]) => ({ number, count }))
    .sort((a, b) => b.count - a.count || Number(a.number) - Number(b.number));
};

const getDominantCombination = (draws: LotteryDraw[]) => {
  if (draws.length === 0) return undefined;

  const counts = draws.reduce<Record<string, number>>((result, draw) => {
    result[draw.combination] = (result[draw.combination] || 0) + 1;
    return result;
  }, {});

  const [name, count] = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];

  return {
    name,
    count,
    percentage: Math.round((count / draws.length) * 100)
  };
};

const getFrequencyLeader = (frequency: FrequencyItem[]) => {
  const leader = frequency[0];
  return leader?.count > 0 ? leader : undefined;
};

const createNumberList = (max: number) =>
  Array.from({ length: max }, (_, index) => String(index + 1).padStart(2, '0'));

const buildOmissions = (draws: LotteryDraw[], type: 'red' | 'blue'): NumberOmissionItem[] => {
  const numbers = createNumberList(type === 'red' ? 33 : 16);
  const totalDraws = draws.length;

  return numbers.map(number => {
    const periods = draws
      .filter(draw => (type === 'red' ? draw.redNumbers.includes(number) : draw.blueNumber === number))
      .map(draw => draw.period);

    const count = periods.length;
    const currentOmission = count > 0 ? totalDraws - periods[periods.length - 1] : totalDraws;
    const gaps = periods.map((period, index) => {
      if (index === 0) return period - 1;
      return period - periods[index - 1] - 1;
    });

    if (count > 0) {
      gaps.push(currentOmission);
    }

    const averageOmission = count > 0 ? Math.round((totalDraws / count) * 10) / 10 : totalDraws;
    const maxOmission = gaps.length > 0 ? Math.max(...gaps) : totalDraws;

    return {
      number,
      count,
      currentOmission,
      averageOmission,
      maxOmission,
      omissionRatio: averageOmission > 0 ? Math.round((currentOmission / averageOmission) * 10) / 10 : 0
    };
  });
};

const getRedSumRange = (redSum: number) => {
  if (redSum <= 70) return '和值偏低';
  if (redSum <= 90) return '和值70-90';
  if (redSum <= 110) return '和值91-110';
  if (redSum <= 130) return '和值111-130';
  return '和值偏高';
};

const getZoneLabel = (draw: LotteryDraw) => {
  const zones = draw.redNumbers.reduce(
    (result, number) => {
      const value = Number(number);
      if (value <= 11) result[0] += 1;
      else if (value <= 22) result[1] += 1;
      else result[2] += 1;
      return result;
    },
    [0, 0, 0]
  );

  return `${zones[0]}-${zones[1]}-${zones[2]}区`;
};

const getStructureEntries = (draw: LotteryDraw) => [
  { type: '奇偶', label: draw.combination },
  { type: '大小', label: `${draw.bigCount}大${draw.smallCount}小` },
  { type: '三区', label: getZoneLabel(draw) },
  { type: '连号', label: draw.consecutivePairs === 0 ? '无连号' : `${draw.consecutivePairs}组连号` },
  { type: '和值', label: getRedSumRange(draw.redSum) }
];

const buildStructureInsights = (draws: LotteryDraw[], recentDraws: LotteryDraw[]): StructureInsight[] => {
  if (draws.length === 0 || recentDraws.length === 0) return [];

  const historicalCounts = new Map<string, { type: string; label: string; count: number }>();
  const recentCounts = new Map<string, { type: string; label: string; count: number }>();

  const addEntries = (target: Map<string, { type: string; label: string; count: number }>, draw: LotteryDraw) => {
    getStructureEntries(draw).forEach(entry => {
      const key = `${entry.type}:${entry.label}`;
      const current = target.get(key) || { ...entry, count: 0 };
      target.set(key, { ...current, count: current.count + 1 });
    });
  };

  draws.forEach(draw => addEntries(historicalCounts, draw));
  recentDraws.forEach(draw => addEntries(recentCounts, draw));

  return Array.from(recentCounts.values())
    .map(item => {
      const historicalCount = historicalCounts.get(`${item.type}:${item.label}`)?.count || 0;
      const recentPercentage = Math.round((item.count / recentDraws.length) * 100);
      const historicalPercentage = Math.round((historicalCount / draws.length) * 100);

      return {
        type: item.type,
        label: item.label,
        recentCount: item.count,
        recentPercentage,
        historicalPercentage,
        delta: recentPercentage - historicalPercentage
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || b.recentCount - a.recentCount)
    .slice(0, 6);
};

const roundTwo = (value: number) => Math.round(value * 100) / 100;

const buildFrequencyHealthMetric = (
  key: string,
  label: string,
  description: string,
  frequency: FrequencyItem[],
  expectedCount: number,
  expectedProbability: number
): DistributionHealthMetric => {
  const counts = frequency.map(item => item.count);
  const average = counts.length > 0 ? counts.reduce((sum, count) => sum + count, 0) / counts.length : 0;
  const variance = counts.length > 0
    ? counts.reduce((sum, count) => sum + Math.pow(count - expectedCount, 2), 0) / counts.length
    : 0;
  const standardDeviation = Math.sqrt(variance);
  const max = counts.length > 0 ? Math.max(...counts) : 0;
  const min = counts.length > 0 ? Math.min(...counts) : 0;
  const richest = frequency.find(item => item.count === max);
  const poorest = frequency.find(item => item.count === min);
  const relativeDeviation = expectedCount > 0 ? standardDeviation / expectedCount : 0;
  const healthScore = Math.max(0, Math.min(100, Math.round(100 - relativeDeviation * 100)));

  return {
    key,
    label,
    description,
    expected: `${roundTwo(expectedProbability * 100)}% / 均值${roundTwo(expectedCount)}次`,
    actual: `均值${roundTwo(average)}次`,
    healthScore,
    deviation: roundTwo(relativeDeviation * 100),
    standardDeviation: roundTwo(standardDeviation),
    squaredDeviation: roundTwo(variance),
    maxMinGap: max - min,
    richest: richest ? `${richest.number}(${richest.count})` : undefined,
    poorest: poorest ? `${poorest.number}(${poorest.count})` : undefined
  };
};

const buildBinaryHealthMetric = (
  key: string,
  label: string,
  description: string,
  firstLabel: string,
  firstCount: number,
  secondLabel: string,
  secondCount: number
): DistributionHealthMetric => {
  const total = firstCount + secondCount;
  const firstRatio = total > 0 ? firstCount / total : 0;
  const secondRatio = total > 0 ? secondCount / total : 0;
  const expectedCount = total / 2;
  const variance = total > 0 ? (Math.pow(firstCount - expectedCount, 2) + Math.pow(secondCount - expectedCount, 2)) / 2 : 0;
  const deviation = Math.abs(firstRatio - 0.5);

  return {
    key,
    label,
    description,
    expected: '50% / 50%',
    actual: `${firstLabel}${roundTwo(firstRatio * 100)}% · ${secondLabel}${roundTwo(secondRatio * 100)}%`,
    healthScore: Math.max(0, Math.min(100, Math.round(100 - deviation * 200))),
    deviation: roundTwo(deviation * 100),
    standardDeviation: roundTwo(Math.sqrt(variance)),
    squaredDeviation: roundTwo(variance),
    maxMinGap: Math.abs(firstCount - secondCount),
    richest: firstCount >= secondCount ? firstLabel : secondLabel,
    poorest: firstCount >= secondCount ? secondLabel : firstLabel
  };
};

const buildZoneHealthMetric = (draws: LotteryDraw[]): DistributionHealthMetric => {
  const zoneCounts = [0, 0, 0];
  draws.forEach(draw => {
    draw.redNumbers.forEach(number => {
      const value = Number(number);
      if (value <= 11) zoneCounts[0] += 1;
      else if (value <= 22) zoneCounts[1] += 1;
      else zoneCounts[2] += 1;
    });
  });
  const total = zoneCounts.reduce((sum, count) => sum + count, 0);
  const expected = total / 3;
  const variance = total > 0 ? zoneCounts.reduce((sum, count) => sum + Math.pow(count - expected, 2), 0) / 3 : 0;
  const standardDeviation = Math.sqrt(variance);
  const max = Math.max(...zoneCounts);
  const min = Math.min(...zoneCounts);
  const labels = ['一区', '二区', '三区'];
  const relativeDeviation = expected > 0 ? standardDeviation / expected : 0;

  return {
    key: 'zone-balance',
    label: '三区均衡',
    description: '红球三区是否接近 1/3、1/3、1/3。',
    expected: '33.33% / 33.33% / 33.33%',
    actual: zoneCounts.map((count, index) => `${labels[index]}${total > 0 ? roundTwo((count / total) * 100) : 0}%`).join(' · '),
    healthScore: Math.max(0, Math.min(100, Math.round(100 - relativeDeviation * 100))),
    deviation: roundTwo(relativeDeviation * 100),
    standardDeviation: roundTwo(standardDeviation),
    squaredDeviation: roundTwo(variance),
    maxMinGap: max - min,
    richest: labels[zoneCounts.indexOf(max)],
    poorest: labels[zoneCounts.indexOf(min)]
  };
};

const buildDistributionHealth = (
  draws: LotteryDraw[],
  redFrequency: FrequencyItem[],
  blueFrequency: FrequencyItem[]
): DistributionHealthMetric[] => {
  const drawCount = draws.length;
  const redSlotCount = drawCount * 6;
  const oddCount = draws.reduce((sum, draw) => sum + draw.oddCount, 0);
  const evenCount = redSlotCount - oddCount;
  const bigCount = draws.reduce((sum, draw) => sum + draw.bigCount, 0);
  const smallCount = redSlotCount - bigCount;

  return [
    buildFrequencyHealthMetric('red-uniformity', '红球均匀度', '每个红球出现次数是否接近理论均值，贫富差距越小越健康。', redFrequency, redSlotCount / 33, 6 / 33),
    buildFrequencyHealthMetric('blue-uniformity', '蓝球均匀度', '每个蓝球出现概率是否接近 1/16。', blueFrequency, drawCount / 16, 1 / 16),
    buildBinaryHealthMetric('odd-even-balance', '奇偶均衡', '红球奇偶比例是否趋近 1/2。', '奇', oddCount, '偶', evenCount),
    buildBinaryHealthMetric('big-small-balance', '大小均衡', '红球大小比例是否趋近 1/2。', '大', bigCount, '小', smallCount),
    buildZoneHealthMetric(draws)
  ];
};

const getMemberStatus = (stepDiff: number, expectedSteps: number): TeamMemberStatus['status'] => {
  const tolerance = Math.max(1, expectedSteps * 0.08);
  if (stepDiff > tolerance) return 'ahead';
  if (stepDiff < -tolerance) return 'behind';
  return 'on-track';
};

const buildTeamMembers = (frequency: FrequencyItem[], expectedSteps: number): TeamMemberStatus[] =>
  frequency
    .map(item => {
      const stepDiff = roundTwo(item.count - expectedSteps);
      return {
        number: item.number,
        steps: item.count,
        expectedSteps: roundTwo(expectedSteps),
        stepDiff,
        diffRatio: expectedSteps > 0 ? roundTwo((stepDiff / expectedSteps) * 100) : 0,
        status: getMemberStatus(stepDiff, expectedSteps)
      };
    })
    .sort((a, b) => b.stepDiff - a.stepDiff || Number(a.number) - Number(b.number));

const buildTeamGroups = (
  groups: Array<{ name: string; numbers: string[] }>,
  members: TeamMemberStatus[],
  expectedSteps: number
): TeamGroupStatus[] =>
  groups.map(group => {
    const groupMembers = group.numbers
      .map(number => members.find(member => member.number === number))
      .filter((member): member is TeamMemberStatus => Boolean(member));
    const totalSteps = groupMembers.reduce((sum, member) => sum + member.steps, 0);
    const groupExpectedSteps = expectedSteps * group.numbers.length;
    const variance = groupMembers.length > 0
      ? groupMembers.reduce((sum, member) => sum + Math.pow(member.steps - expectedSteps, 2), 0) / groupMembers.length
      : 0;

    return {
      name: group.name,
      numbers: group.numbers,
      totalSteps,
      expectedSteps: roundTwo(groupExpectedSteps),
      stepDiff: roundTwo(totalSteps - groupExpectedSteps),
      standardDeviation: roundTwo(Math.sqrt(variance)),
      leader: groupMembers[0],
      laggard: [...groupMembers].sort((a, b) => a.stepDiff - b.stepDiff || Number(a.number) - Number(b.number))[0]
    };
  });

const buildTeamState = (
  title: string,
  frequency: FrequencyItem[],
  expectedSteps: number,
  expectedStepText: string,
  groups: Array<{ name: string; numbers: string[] }>
): TeamState => {
  const members = buildTeamMembers(frequency, expectedSteps);
  const counts = members.map(member => member.steps);
  const variance = counts.length > 0
    ? counts.reduce((sum, count) => sum + Math.pow(count - expectedSteps, 2), 0) / counts.length
    : 0;
  const standardDeviation = Math.sqrt(variance);
  const max = counts.length > 0 ? Math.max(...counts) : 0;
  const min = counts.length > 0 ? Math.min(...counts) : 0;
  const relativeDeviation = expectedSteps > 0 ? standardDeviation / expectedSteps : 0;

  return {
    title,
    expectedStepText,
    alignmentScore: Math.max(0, Math.min(100, Math.round(100 - relativeDeviation * 100))),
    averageSteps: roundTwo(counts.length > 0 ? counts.reduce((sum, count) => sum + count, 0) / counts.length : 0),
    standardDeviation: roundTwo(standardDeviation),
    squaredDeviation: roundTwo(variance),
    maxStepGap: max - min,
    aheadCount: members.filter(member => member.status === 'ahead').length,
    behindCount: members.filter(member => member.status === 'behind').length,
    onTrackCount: members.filter(member => member.status === 'on-track').length,
    leader: members[0],
    laggard: [...members].sort((a, b) => a.stepDiff - b.stepDiff || Number(a.number) - Number(b.number))[0],
    members,
    groups: buildTeamGroups(groups, members, expectedSteps)
  };
};

const buildTeamStates = (
  draws: LotteryDraw[],
  redFrequency: FrequencyItem[],
  blueFrequency: FrequencyItem[]
): TeamState[] => {
  const redExpectedSteps = draws.length > 0 ? draws.length * 6 / 33 : 0;
  const blueExpectedSteps = draws.length > 0 ? draws.length / 16 : 0;

  return [
    buildTeamState('红球队伍', redFrequency, redExpectedSteps, `中线 ${roundTwo(redExpectedSteps)} 步`, [
      { name: '一区 01-11', numbers: createNumberList(11) },
      { name: '二区 12-22', numbers: createNumberList(22).slice(11) },
      { name: '三区 23-33', numbers: createNumberList(33).slice(22) }
    ]),
    buildTeamState('蓝球队伍', blueFrequency, blueExpectedSteps, `中线 ${roundTwo(blueExpectedSteps)} 步`, [
      { name: '低位 01-04', numbers: createNumberList(4) },
      { name: '中低 05-08', numbers: createNumberList(8).slice(4) },
      { name: '中高 09-12', numbers: createNumberList(12).slice(8) },
      { name: '高位 13-16', numbers: createNumberList(16).slice(12) }
    ])
  ];
};

const buildCandidatePools = (
  recentRedFrequency: FrequencyItem[],
  redOmissions: NumberOmissionItem[],
  blueOmissions: NumberOmissionItem[],
  config: PredictionRuleConfig
): CandidatePools => ({
  activeRed: recentRedFrequency
    .filter(item => item.count > 0)
    .sort((a, b) => b.count * config.activeWeight - a.count * config.activeWeight || Number(a.number) - Number(b.number))
    .slice(0, 6),
  overdueRed: redOmissions
    .filter(item => item.count > 0)
    .sort((a, b) => b.omissionRatio * config.omissionWeight - a.omissionRatio * config.omissionWeight || b.currentOmission - a.currentOmission)
    .slice(0, 6),
  balancedRed: redOmissions
    .filter(item => item.count > 0 && item.omissionRatio >= 0.8)
    .sort((a, b) => {
      const targetRatio = 1.4;
      const aScore = (3 - Math.abs(a.omissionRatio - targetRatio)) * config.balancedWeight + a.count / 10;
      const bScore = (3 - Math.abs(b.omissionRatio - targetRatio)) * config.balancedWeight + b.count / 10;
      return bScore - aScore || b.count - a.count;
    })
    .slice(0, 6),
  blueFocus: blueOmissions
    .filter(item => item.count > 0)
    .sort((a, b) => b.omissionRatio * config.blueOmissionWeight - a.omissionRatio * config.blueOmissionWeight || b.currentOmission - a.currentOmission)
    .slice(0, 4)
});

const uniqueNumbers = (numbers: string[]) => Array.from(new Set(numbers));

const sortNumbers = (numbers: string[]) => [...numbers].sort((a, b) => Number(a) - Number(b));

const getNumberFrequency = (frequency: FrequencyItem[], number: string) =>
  frequency.find(item => item.number === number)?.count || 0;

const getNumberOmission = (omissions: NumberOmissionItem[], number: string) =>
  omissions.find(item => item.number === number);

const getPredictionProfile = (numbers: string[]) => {
  const values = numbers.map(number => Number(number));
  const oddCount = values.filter(number => number % 2 !== 0).length;
  const bigCount = values.filter(number => number >= 17).length;
  const zones = values.reduce(
    (result, value) => {
      if (value <= 11) result[0] += 1;
      else if (value <= 22) result[1] += 1;
      else result[2] += 1;
      return result;
    },
    [0, 0, 0]
  );
  const redSum = values.reduce((sum, value) => sum + value, 0);

  return {
    oddCount,
    evenCount: numbers.length - oddCount,
    bigCount,
    smallCount: numbers.length - bigCount,
    zones,
    redSum
  };
};

const scorePrediction = (
  numbers: string[],
  blueNumber: string,
  redFrequency: FrequencyItem[],
  blueOmissions: NumberOmissionItem[],
  redOmissions: NumberOmissionItem[],
  targetAverageRedSum: number,
  config: PredictionRuleConfig
) => {
  const profile = getPredictionProfile(numbers);
  const frequencyScore = numbers.reduce((score, number) => score + getNumberFrequency(redFrequency, number), 0);
  const omissionScore = numbers.reduce((score, number) => {
    const omission = getNumberOmission(redOmissions, number);
    return score + Math.min(omission?.omissionRatio || 0, 3) * 2 * config.omissionWeight;
  }, 0);
  const blueScore = Math.min(getNumberOmission(blueOmissions, blueNumber)?.omissionRatio || 0, 3) * 3 * config.blueOmissionWeight;
  const structureScore =
    Math.abs(profile.oddCount - config.targetOddCount) <= 1 &&
    Math.abs(profile.bigCount - config.targetBigCount) <= 1 &&
    (!config.requireZoneCoverage || profile.zones.every(count => count > 0))
      ? 18
      : 8;
  const sumScore = Math.max(0, 20 - Math.abs(profile.redSum - targetAverageRedSum));

  return Math.round(frequencyScore + omissionScore + blueScore + structureScore + sumScore);
};

const average = (values: number[]) =>
  values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const varianceOf = (values: number[], expected = average(values)) =>
  values.length > 0 ? values.reduce((sum, value) => sum + Math.pow(value - expected, 2), 0) / values.length : 0;

const getRedZone = (value: number) => {
  if (value <= 11) return { index: 0, label: '一区' };
  if (value <= 22) return { index: 1, label: '二区' };
  return { index: 2, label: '三区' };
};

const getRedFourGroup = (value: number) => {
  if (value <= 8) return { index: 0, label: '01-08' };
  if (value <= 16) return { index: 1, label: '09-16' };
  if (value <= 24) return { index: 2, label: '17-24' };
  return { index: 3, label: '25-33' };
};

const buildGroupPressure = (
  draws: LotteryDraw[],
  groupCount: number,
  expectedPerDraw: number,
  getIndex: (value: number) => number
) => {
  const counts = Array.from({ length: groupCount }, () => 0);
  draws.forEach(draw => {
    draw.redNumbers.forEach(number => {
      counts[getIndex(Number(number))] += 1;
    });
  });
  const expected = Math.max(1, draws.length * expectedPerDraw);
  return counts.map(count => roundTwo((expected - count) / expected));
};

const getOmissionPressure = (omission?: NumberOmissionItem) => {
  if (!omission || omission.averageOmission <= 0) {
    return 0;
  }
  return roundTwo(omission.currentOmission / omission.averageOmission);
};

const getOmissionTrendFactor = (pressure: number) => {
  if (pressure >= 2.4) return '极长遗漏回补';
  if (pressure >= 1.6) return '遗漏显著超均';
  if (pressure >= 1) return '遗漏超过均值';
  return '遗漏未达均值';
};

const buildProbabilityAnalysis = (
  draws: LotteryDraw[],
  recentDraws: LotteryDraw[],
  redFrequency: FrequencyItem[],
  blueFrequency: FrequencyItem[],
  redOmissions: NumberOmissionItem[],
  blueOmissions: NumberOmissionItem[],
  recentRedFrequency: FrequencyItem[],
  recentBlueFrequency: FrequencyItem[],
  averageRedSum: number,
  recentAverageRedSum: number
): LotteryProbabilityAnalysis => {
  const redExpectedCount = draws.length > 0 ? draws.length * 6 / 33 : 1;
  const blueExpectedCount = draws.length > 0 ? draws.length / 16 : 1;
  const recentRedExpectedCount = recentDraws.length > 0 ? recentDraws.length * 6 / 33 : 1;
  const recentBlueExpectedCount = recentDraws.length > 0 ? recentDraws.length / 16 : 1;
  const redCounts = redFrequency.map(item => item.count);
  const blueCounts = blueFrequency.map(item => item.count);
  const redVariance = roundTwo(varianceOf(redCounts, redExpectedCount));
  const blueVariance = roundTwo(varianceOf(blueCounts, blueExpectedCount));
  const targetAverage = (recentAverageRedSum || averageRedSum || 100) / 6;
  const recentOddAverage = Math.round(average(recentDraws.map(draw => draw.oddCount)) || 3);
  const recentBigAverage = Math.round(average(recentDraws.map(draw => draw.bigCount)) || 3);
  const targetOddCount = Math.max(2, Math.min(4, recentOddAverage));
  const targetBigCount = Math.max(2, Math.min(4, recentBigAverage));
  const oddPressure = (targetOddCount - 3) / 3;
  const bigPressure = (targetBigCount - 3) / 3;
  const zonePressure = buildGroupPressure(recentDraws, 3, 2, value => getRedZone(value).index);
  const fourGroupPressure = buildGroupPressure(recentDraws, 4, 1.5, value => getRedFourGroup(value).index);

  const redScores = createNumberList(33).map(number => {
    const value = Number(number);
    const historyCount = getNumberFrequency(redFrequency, number);
    const recentCount = getNumberFrequency(recentRedFrequency, number);
    const omission = getNumberOmission(redOmissions, number);
    const omissionPressure = getOmissionPressure(omission);
    const zone = getRedZone(value);
    const group = getRedFourGroup(value);
    const historyScore = Math.min(1.35, historyCount / redExpectedCount) * 24;
    const recentScore = Math.min(1.5, recentCount / recentRedExpectedCount) * 16;
    const omissionScore = Math.min(34, Math.max(0, omissionPressure - 0.55) * 14);
    const oddScore = (value % 2 !== 0 ? oddPressure : -oddPressure) * 8 + 8;
    const bigScore = (value >= 17 ? bigPressure : -bigPressure) * 8 + 8;
    const zoneScore = Math.max(0, 10 + zonePressure[zone.index] * 10);
    const groupScore = Math.max(0, 10 + fourGroupPressure[group.index] * 10);
    const varianceScore = Math.max(0, 12 - Math.abs(value - targetAverage) / 2.2);
    const score = Math.max(1, historyScore + recentScore + omissionScore + oddScore + bigScore + zoneScore + groupScore + varianceScore);
    const scoreParts = [
      {
        label: '历史频次',
        score: historyScore,
        description: `${historyCount}次 / 期望${roundTwo(redExpectedCount)}次，上限按1.35倍截断`
      },
      {
        label: '近期活跃',
        score: recentScore,
        description: `${recentCount}次 / 近期期望${roundTwo(recentRedExpectedCount)}次，上限按1.5倍截断`
      },
      {
        label: '遗漏压力',
        score: omissionScore,
        description: `当前遗漏${omission?.currentOmission || 0}期 / 平均遗漏${roundTwo(omission?.averageOmission || 0)}期 = ${omissionPressure || 0}x`
      },
      {
        label: '奇偶匹配',
        score: oddScore,
        description: `${value % 2 !== 0 ? '奇数' : '偶数'}，目标奇数约${targetOddCount}个`
      },
      {
        label: '大小匹配',
        score: bigScore,
        description: `${value >= 17 ? '大号' : '小号'}，目标大号约${targetBigCount}个`
      },
      {
        label: '区间压力',
        score: zoneScore,
        description: `${zone.label}，近期分布压力${roundTwo(zonePressure[zone.index])}`
      },
      {
        label: '四组压力',
        score: groupScore,
        description: `${group.label}，近期分组压力${roundTwo(fourGroupPressure[group.index])}`
      },
      {
        label: '均值贴合',
        score: varianceScore,
        description: `号码距离目标均值${roundTwo(targetAverage)}越近，结构分越高`
      }
    ];
    const factors = [
      historyCount >= redExpectedCount ? '历史偏热' : '历史偏冷',
      recentCount >= recentRedExpectedCount ? '近期活跃' : '近期平稳',
      getOmissionTrendFactor(omissionPressure),
      `遗漏压力${omissionPressure || 0}x`,
      `${value % 2 !== 0 ? '奇' : '偶'}性匹配`,
      `${value >= 17 ? '大' : '小'}号匹配`,
      `${zone.label}压力${zonePressure[zone.index] >= 0 ? '偏高' : '偏低'}`,
      `四组${group.label}`
    ];

    return {
      number,
      type: 'red' as const,
      probability: 0,
      score: roundTwo(score),
      poolTotalScore: 0,
      probabilityPool: 600,
      rank: 0,
      historyCount,
      recentCount,
      currentOmission: omission?.currentOmission || 0,
      averageOmission: roundTwo(omission?.averageOmission || 0),
      omissionPressure,
      omissionRatio: omission?.omissionRatio || 0,
      oddEvenLabel: value % 2 !== 0 ? '奇' : '偶',
      sizeLabel: value >= 17 ? '大' : '小',
      zoneLabel: zone.label,
      groupLabel: group.label,
      factors,
      scoreParts: scoreParts.map(part => ({ ...part, score: roundTwo(part.score) }))
    };
  });

  const blueScores = createNumberList(16).map(number => {
    const value = Number(number);
    const historyCount = getNumberFrequency(blueFrequency, number);
    const recentCount = getNumberFrequency(recentBlueFrequency, number);
    const omission = getNumberOmission(blueOmissions, number);
    const omissionPressure = getOmissionPressure(omission);
    const groupLabel = value <= 4 ? '01-04' : value <= 8 ? '05-08' : value <= 12 ? '09-12' : '13-16';
    const historyScore = Math.min(1.35, historyCount / blueExpectedCount) * 30;
    const recentScore = Math.min(1.6, recentCount / recentBlueExpectedCount) * 18;
    const omissionScore = Math.min(38, Math.max(0, omissionPressure - 0.5) * 16);
    const balanceScore = Math.max(0, 14 - Math.abs(value - 8.5) * 1.2);
    const score = Math.max(1, historyScore + recentScore + omissionScore + balanceScore);
    const scoreParts = [
      {
        label: '历史频次',
        score: historyScore,
        description: `${historyCount}次 / 期望${roundTwo(blueExpectedCount)}次，上限按1.35倍截断`
      },
      {
        label: '近期活跃',
        score: recentScore,
        description: `${recentCount}次 / 近期期望${roundTwo(recentBlueExpectedCount)}次，上限按1.6倍截断`
      },
      {
        label: '遗漏压力',
        score: omissionScore,
        description: `当前遗漏${omission?.currentOmission || 0}期 / 平均遗漏${roundTwo(omission?.averageOmission || 0)}期 = ${omissionPressure || 0}x`
      },
      {
        label: '星球平衡',
        score: balanceScore,
        description: `蓝舰队按星球位置节奏分析，越接近中位轨道结构分越高`
      }
    ];

    return {
      number,
      type: 'blue' as const,
      probability: 0,
      score: roundTwo(score),
      poolTotalScore: 0,
      probabilityPool: 100,
      rank: 0,
      historyCount,
      recentCount,
      currentOmission: omission?.currentOmission || 0,
      averageOmission: roundTwo(omission?.averageOmission || 0),
      omissionPressure,
      omissionRatio: omission?.omissionRatio || 0,
      oddEvenLabel: value % 2 !== 0 ? '奇' : '偶',
      sizeLabel: value >= 9 ? '大' : '小',
      groupLabel,
      factors: [
        historyCount >= blueExpectedCount ? '历史偏热' : '历史偏冷',
        recentCount >= recentBlueExpectedCount ? '近期活跃' : '近期平稳',
        getOmissionTrendFactor(omissionPressure),
        `遗漏压力${omissionPressure || 0}x`,
        `${groupLabel}小组`
      ],
      scoreParts: scoreParts.map(part => ({ ...part, score: roundTwo(part.score) }))
    };
  });

  const normalize = (items: LotteryNumberProbability[], totalProbability: number) => {
    const totalScore = items.reduce((sum, item) => sum + item.score, 0) || 1;
    return items
      .map(item => ({
        ...item,
        poolTotalScore: roundTwo(totalScore),
        probabilityPool: totalProbability,
        probability: roundTwo((item.score / totalScore) * totalProbability)
      }))
      .sort((a, b) => b.probability - a.probability || Number(a.number) - Number(b.number))
      .map((item, index) => ({ ...item, rank: index + 1 }));
  };

  return {
    red: normalize(redScores, 600),
    blue: normalize(blueScores, 100),
    summary: {
      redTargetOddCount: targetOddCount,
      redTargetBigCount: targetBigCount,
      redTargetAverage: roundTwo(targetAverage),
      recentOddEvenCombination: `${targetOddCount}奇${6 - targetOddCount}偶`,
      recentBigSmallCombination: `${targetBigCount}大${6 - targetBigCount}小`,
      redFrequencyStandardDeviation: roundTwo(Math.sqrt(redVariance)),
      blueFrequencyStandardDeviation: roundTwo(Math.sqrt(blueVariance)),
      redFrequencyVariance: redVariance,
      blueFrequencyVariance: blueVariance
    }
  };
};

const completeRedNumbers = (
  seedNumbers: string[],
  fallbackNumbers: string[],
  redFrequency: FrequencyItem[],
  redOmissions: NumberOmissionItem[],
  targetAverageRedSum: number,
  config: PredictionRuleConfig,
  latestDraw?: LotteryDraw
) => {
  const avoidedNumbers = config.avoidLastDraw ? latestDraw?.redNumbers || [] : [];
  const candidates = uniqueNumbers([...seedNumbers, ...fallbackNumbers, ...createNumberList(33)])
    .filter(number => !avoidedNumbers.includes(number));
  const selected: string[] = [];

  candidates.forEach(number => {
    if (selected.length >= 6 || selected.includes(number)) return;

    const draft = [...selected, number];
    const profile = getPredictionProfile(draft);
    const canStillBalanceOddEven = profile.oddCount <= config.targetOddCount + 1 && profile.evenCount <= 7 - config.targetOddCount;
    const canStillBalanceSize = profile.bigCount <= config.targetBigCount + 1 && profile.smallCount <= 7 - config.targetBigCount;

    if (canStillBalanceOddEven && canStillBalanceSize) {
      selected.push(number);
    }
  });

  if (selected.length < 6) {
    candidates.forEach(number => {
      if (selected.length < 6 && !selected.includes(number)) selected.push(number);
    });
  }

  return sortNumbers(selected)
    .sort((a, b) => {
      const aScore =
        getNumberFrequency(redFrequency, a) +
        Math.min(getNumberOmission(redOmissions, a)?.omissionRatio || 0, 3) * 2 * config.omissionWeight -
        Math.abs(Number(a) - targetAverageRedSum / 6) / 10;
      const bScore =
        getNumberFrequency(redFrequency, b) +
        Math.min(getNumberOmission(redOmissions, b)?.omissionRatio || 0, 3) * 2 * config.omissionWeight -
        Math.abs(Number(b) - targetAverageRedSum / 6) / 10;
      return bScore - aScore || Number(a) - Number(b);
    })
    .slice(0, 6)
    .sort((a, b) => Number(a) - Number(b));
};

const buildPredictions = (
  candidatePools: CandidatePools,
  redFrequency: FrequencyItem[],
  blueOmissions: NumberOmissionItem[],
  redOmissions: NumberOmissionItem[],
  recentAverageRedSum: number,
  averageRedSum: number,
  config: PredictionRuleConfig,
  latestDraw?: LotteryDraw
): LotteryPrediction[] => {
  const activeRed = candidatePools.activeRed.map(item => item.number);
  const overdueRed = candidatePools.overdueRed.map(item => item.number);
  const balancedRed = candidatePools.balancedRed.map(item => item.number);
  const fallbackRed = redFrequency.filter(item => item.count > 0).map(item => item.number);
  const blueCandidates = candidatePools.blueFocus.length > 0 ? candidatePools.blueFocus : blueOmissions;
  const targetAverageRedSum = recentAverageRedSum || averageRedSum || 100;

  const templates = [
    {
      title: '综合推荐',
      seeds: [...activeRed.slice(0, 2), ...overdueRed.slice(0, 2), ...balancedRed.slice(0, 4)],
      blueIndex: 0,
      tags: ['冷热混合', '遗漏回补', '结构均衡'],
      reason: '优先混合近期活跃红球和高遗漏红球，再用均衡号补足结构。'
    },
    {
      title: '回补优先',
      seeds: [...overdueRed.slice(0, 4), ...balancedRed.slice(0, 3), ...activeRed.slice(0, 1)],
      blueIndex: 1,
      tags: ['回补倾向', '遗漏比优先', '保留热号'],
      reason: '偏向当前遗漏高于平均遗漏的号码，同时保留少量近期活跃号。'
    },
    {
      title: '稳态结构',
      seeds: [...balancedRed.slice(0, 4), ...activeRed.slice(0, 3), ...overdueRed.slice(0, 2)],
      blueIndex: 2,
      tags: ['均衡遗漏', '和值贴近', '三区覆盖'],
      reason: '优先选择遗漏接近可观察区间的号码，控制奇偶、大小和三区覆盖。'
    }
  ];

  return templates.map(template => {
    const redNumbers = completeRedNumbers(
      template.seeds,
      uniqueNumbers([...activeRed, ...overdueRed, ...balancedRed, ...fallbackRed]),
      redFrequency,
      redOmissions,
      targetAverageRedSum,
      config,
      latestDraw
    );
    const blueNumber = blueCandidates[template.blueIndex % Math.max(blueCandidates.length, 1)]?.number || '01';

    return {
      title: template.title,
      redNumbers,
      blueNumber,
      tags: template.tags,
      reason: template.reason,
      score: scorePrediction(redNumbers, blueNumber, redFrequency, blueOmissions, redOmissions, targetAverageRedSum, config)
    };
  });
};

const getPrizeResult = (redHits: number, blueHit: boolean) => {
  if (redHits === 6 && blueHit) return { prizeLevel: 1, prizeName: '一等奖' };
  if (redHits === 6) return { prizeLevel: 2, prizeName: '二等奖' };
  if (redHits === 5 && blueHit) return { prizeLevel: 3, prizeName: '三等奖' };
  if (redHits === 5 || (redHits === 4 && blueHit)) return { prizeLevel: 4, prizeName: '四等奖' };
  if (redHits === 4 || (redHits === 3 && blueHit)) return { prizeLevel: 5, prizeName: '五等奖' };
  if (blueHit && redHits <= 2) return { prizeLevel: 6, prizeName: '六等奖' };
  return { prizeLevel: 0, prizeName: '未中奖' };
};

const scoreAgainstActual = (prediction: LotteryPrediction, actual: LotteryDraw): LotteryPredictionScore => {
  const redHits = prediction.redNumbers.filter(number => actual.redNumbers.includes(number)).length;
  const blueHit = prediction.blueNumber === actual.blueNumber;
  const prizeResult = getPrizeResult(redHits, blueHit);
  const profile = getPredictionProfile(prediction.redNumbers);
  const zoneLabel = `${profile.zones[0]}-${profile.zones[1]}-${profile.zones[2]}区`;
  const structureHits = [
    `${profile.oddCount}奇${profile.evenCount}偶` === actual.combination,
    `${profile.bigCount}大${profile.smallCount}小` === `${actual.bigCount}大${actual.smallCount}小`,
    zoneLabel === getZoneLabel(actual),
    getRedSumRange(profile.redSum) === getRedSumRange(actual.redSum)
  ].filter(Boolean).length;

  return {
    redHits,
    blueHit,
    structureHits,
    ...prizeResult,
    score: redHits * 12 + (blueHit ? 10 : 0) + structureHits * 3
  };
};

const buildReplaySummary = (replays: LotteryPredictionReplay[]): LotteryReplaySummary => {
  if (replays.length === 0) {
    return {
      total: 0,
      averageScore: 0,
      bestScore: 0,
      averageRedHits: 0,
      blueHitRate: 0,
      prizeDistribution: {},
      improvementTips: ['历史期数不足，至少需要 20 期后再做回放评分。']
    };
  }

  const totalScore = replays.reduce((sum, replay) => sum + replay.bestPrediction.result.score, 0);
  const totalRedHits = replays.reduce((sum, replay) => sum + replay.bestPrediction.result.redHits, 0);
  const blueHits = replays.filter(replay => replay.bestPrediction.result.blueHit).length;
  const prizeDistribution = replays.reduce<Record<string, number>>((result, replay) => {
    const prizeName = replay.bestPrediction.result.prizeName;
    result[prizeName] = (result[prizeName] || 0) + 1;
    return result;
  }, {});
  const strategyScores = replays.reduce<Record<string, { count: number; score: number }>>((result, replay) => {
    const strategy = replay.bestPrediction.title;
    const current = result[strategy] || { count: 0, score: 0 };
    result[strategy] = {
      count: current.count + 1,
      score: current.score + replay.bestPrediction.result.score
    };
    return result;
  }, {});
  const bestStrategy = Object.entries(strategyScores)
    .sort((a, b) => b[1].score / b[1].count - a[1].score / a[1].count)[0]?.[0];
  const averageScore = Math.round((totalScore / replays.length) * 10) / 10;
  const averageRedHits = Math.round((totalRedHits / replays.length) * 10) / 10;
  const blueHitRate = Math.round((blueHits / replays.length) * 100);
  const tips: string[] = [];

  if (bestStrategy) tips.push(`${bestStrategy} 在当前回放窗口内平均表现最好，可提高该策略权重。`);
  if (averageRedHits < 2) tips.push('红球平均命中偏低，应降低单一热号权重，增加结构和遗漏约束。');
  if (blueHitRate < 15) tips.push('蓝球命中率偏低，蓝球规则应减少遗漏比依赖，加入近期频次对照。');
  if (averageScore >= 30) tips.push('当前规则在回放窗口内有稳定命中，可继续扩大回放期数验证。');

  return {
    total: replays.length,
    averageScore,
    bestScore: Math.max(...replays.map(replay => replay.bestPrediction.result.score)),
    averageRedHits,
    blueHitRate,
    prizeDistribution,
    bestStrategy,
    improvementTips: tips
  };
};

export const buildLotteryReplayReport = (
  allRecords: string | string[],
  replayCount = 10,
  config: PredictionRuleConfig = defaultPredictionRuleConfig
): LotteryReplayReport => {
  const draws = parseLotteryDraws(allRecords);
  const minTrainingDraws = 20;
  const startIndex = Math.max(minTrainingDraws, draws.length - replayCount);
  const replays = draws.slice(startIndex).map(targetDraw => {
    const trainingDraws = draws.slice(0, targetDraw.period - 1);
    const trainingStats = buildLotteryStats(trainingDraws.map(draw => draw.raw), config);
    const predictions = trainingStats.predictions
      .map(prediction => ({
        ...prediction,
        result: scoreAgainstActual(prediction, targetDraw)
      }))
      .sort((a, b) => b.result.score - a.result.score || b.result.redHits - a.result.redHits);

    return {
      targetDraw,
      trainingDrawCount: trainingDraws.length,
      predictions,
      bestPrediction: predictions[0]
    };
  }).filter((replay): replay is LotteryPredictionReplay => Boolean(replay.bestPrediction));

  return {
    replays,
    summary: buildReplaySummary(replays)
  };
};

const buildTrainingConfigs = (scale: 'fast' | 'standard' | 'deep'): PredictionRuleConfig[] => {
  const windows = scale === 'fast' ? [20] : scale === 'standard' ? [20, 30] : [10, 20, 30];
  const activeWeights = scale === 'fast' ? [1] : [0.8, 1.2];
  const omissionWeights = scale === 'fast' ? [1.2, 1.6] : [1, 1.4, 1.8];
  const blueWeights = scale === 'deep' ? [0.8, 1.2] : [1];
  const configs: PredictionRuleConfig[] = [];

  windows.forEach(recentWindow => {
    activeWeights.forEach(activeWeight => {
      omissionWeights.forEach(omissionWeight => {
        blueWeights.forEach(blueOmissionWeight => {
          const balancedWeight = Math.max(0.6, 2.4 - (activeWeight + omissionWeight) / 2);
          configs.push({
            id: `w${recentWindow}-a${activeWeight}-o${omissionWeight}-b${blueOmissionWeight}`,
            name: `窗口${recentWindow} 热${activeWeight} 遗${omissionWeight} 蓝${blueOmissionWeight}`,
            recentWindow,
            activeWeight,
            omissionWeight,
            balancedWeight,
            blueOmissionWeight,
            averageDiffWeight: recentWindow === 10 ? 0.8 : recentWindow === 20 ? 1 : 1.2,
            squaredDiffWeight: omissionWeight >= 1.4 ? 1.2 : 0.8,
            oddEvenProbabilityWeight: balancedWeight,
            targetOddCount: 3,
            targetBigCount: 3,
            requireZoneCoverage: true,
            avoidLastDraw: false
          });
        });
      });
    });
  });

  if (scale !== 'fast') {
    configs.push(
      {
        ...defaultPredictionRuleConfig,
        id: 'avoid-last-balanced',
        name: '避开上期均衡',
        avoidLastDraw: true,
        balancedWeight: 1.6
      },
      {
        ...defaultPredictionRuleConfig,
        id: 'odd-four-overdue',
        name: '4奇回补',
        targetOddCount: 4,
        omissionWeight: 1.6
      },
      {
        ...defaultPredictionRuleConfig,
        id: 'big-four-active',
        name: '4大活跃',
        targetBigCount: 4,
        activeWeight: 1.4
      }
    );
  }

  const maxConfigs = scale === 'fast' ? 2 : scale === 'standard' ? 12 : 24;
  return configs.slice(0, maxConfigs);
};

const getTrainingRankScore = (summary: LotteryReplaySummary) => {
  const winningCount = summary.total - (summary.prizeDistribution['未中奖'] || 0);
  const highPrizeCount = ['一等奖', '二等奖', '三等奖', '四等奖', '五等奖']
    .reduce((count, prizeName) => count + (summary.prizeDistribution[prizeName] || 0), 0);

  return Math.round(
    winningCount * 120 +
    highPrizeCount * 40 +
    summary.averageScore * 6 +
    summary.averageRedHits * 30 +
    summary.blueHitRate * 2
  );
};

export const buildLotteryRuleTrainingReport = (
  allRecords: string | string[],
  replayCount = 10,
  scale: 'fast' | 'standard' | 'deep' = 'fast'
): LotteryRuleTrainingReport => {
  const safeReplayCount = Math.min(replayCount, scale === 'fast' ? 10 : scale === 'standard' ? 20 : 30);
  const candidates = buildTrainingConfigs(scale)
    .map(config => {
      const report = buildLotteryReplayReport(allRecords, safeReplayCount, config);
      return {
        config,
        summary: report.summary,
        rankScore: getTrainingRankScore(report.summary)
      };
    })
    .sort((a, b) =>
      b.rankScore - a.rankScore ||
      b.summary.averageScore - a.summary.averageScore ||
      b.summary.averageRedHits - a.summary.averageRedHits
    )
    .slice(0, 8);

  return {
    candidates,
    best: candidates[0],
    replayCount: safeReplayCount
  };
};

export const buildLotteryStats = (
  allRecords: string | string[],
  config: PredictionRuleConfig = defaultPredictionRuleConfig
): LotteryStats => {
  const draws = parseLotteryDraws(allRecords);
  const redFrequency = buildFrequency(draws, 'red');
  const blueFrequency = buildFrequency(draws, 'blue');
  const recentDraws = draws.slice(-config.recentWindow);
  const recentRedFrequency = buildFrequency(recentDraws, 'red');
  const recentBlueFrequency = buildFrequency(recentDraws, 'blue');
  const redOmissions = buildOmissions(draws, 'red');
  const blueOmissions = buildOmissions(draws, 'blue');
  const activeRedCount = redFrequency.filter(item => item.count > 0).length;
  const activeBlueCount = blueFrequency.filter(item => item.count > 0).length;
  const totalRedSum = draws.reduce((sum, draw) => sum + draw.redSum, 0);
  const recentRedSums = recentDraws.map(draw => draw.redSum);
  const recentTotalRedSum = recentRedSums.reduce((sum, value) => sum + value, 0);
  const recentRedSumSpan = recentRedSums.length > 0 ? Math.max(...recentRedSums) - Math.min(...recentRedSums) : 0;
  const recentAverageRedSum = recentDraws.length > 0 ? Math.round(recentTotalRedSum / recentDraws.length) : 0;
  const averageRedSum = draws.length > 0 ? Math.round(totalRedSum / draws.length) : 0;
  const candidatePools = buildCandidatePools(recentRedFrequency, redOmissions, blueOmissions, config);
  const probabilityAnalysis = buildProbabilityAnalysis(
    draws,
    recentDraws,
    redFrequency,
    blueFrequency,
    redOmissions,
    blueOmissions,
    recentRedFrequency,
    recentBlueFrequency,
    averageRedSum,
    recentAverageRedSum
  );

  return {
    draws,
    latestDraw: draws[draws.length - 1],
    redFrequency,
    blueFrequency,
    redOmissions,
    blueOmissions,
    structureInsights: buildStructureInsights(draws, recentDraws),
    distributionHealth: buildDistributionHealth(draws, redFrequency, blueFrequency),
    teamStates: buildTeamStates(draws, redFrequency, blueFrequency),
    candidatePools,
    predictions: buildPredictions(
      candidatePools,
      redFrequency,
      blueOmissions,
      redOmissions,
      recentAverageRedSum,
      averageRedSum,
      config,
      draws[draws.length - 1]
    ),
    probabilityAnalysis,
    recentDrawCount: recentDraws.length,
    recentAverageRedSum,
    recentRedSumSpan,
    recentMostFrequentRed: getFrequencyLeader(recentRedFrequency),
    recentMostFrequentBlue: getFrequencyLeader(recentBlueFrequency),
    dominantCombination: getDominantCombination(recentDraws),
    redCoverage: Math.round((activeRedCount / 33) * 100),
    blueCoverage: Math.round((activeBlueCount / 16) * 100),
    averageRedSum,
    mostFrequentRed: getFrequencyLeader(redFrequency),
    mostFrequentBlue: getFrequencyLeader(blueFrequency)
  };
};

export const getRecentDraws = (draws: LotteryDraw[], count = 10) => {
  return draws.slice(-count).reverse();
};
