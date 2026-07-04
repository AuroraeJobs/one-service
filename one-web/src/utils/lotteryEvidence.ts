import type { LotteryReplaySummary, LotteryRuleEvidence } from '../services/api';

export const lotteryEvidenceColor = (tag?: string) => {
  if (tag === 'STABLE') return 'green';
  if (tag === 'VOLATILE') return 'orange';
  if (tag === 'STALE') return 'default';
  if (tag === 'UNDER_TESTED') return 'gold';
  return 'blue';
};

export const lotteryEvidenceLabel = (evidence?: LotteryRuleEvidence) => {
  if (evidence?.label) return evidence.label;
  if (evidence?.tag === 'STABLE') return '稳定';
  if (evidence?.tag === 'VOLATILE') return '波动';
  if (evidence?.tag === 'STALE') return '陈旧';
  if (evidence?.tag === 'UNDER_TESTED') return '样本不足';
  return '未评估';
};

export const lotteryDriftLabel = (drift?: string) => {
  if (drift === 'IMPROVING') return '走强';
  if (drift === 'DROPPING') return '走弱';
  if (drift === 'FLAT') return '平稳';
  return '未知';
};

export const lotteryReplayText = (summary?: LotteryReplaySummary) => {
  if (!summary) return '暂无回放摘要';
  const parts = [
    summary.ruleGeneration ? `规则代数 ${summary.ruleGeneration}` : undefined,
    summary.replayWindow !== undefined ? `窗口 ${summary.replayWindow}` : undefined,
    summary.averageRedHitsDrift !== undefined ? `红球漂移 ${summary.averageRedHitsDrift}` : undefined,
    summary.blueHitRateDrift !== undefined ? `蓝球漂移 ${summary.blueHitRateDrift}%` : undefined,
    summary.candidateCount !== undefined ? `候选 ${summary.scoredCandidateCount || 0}/${summary.candidateCount}` : undefined
  ].filter(Boolean);
  return parts.join(' · ') || '暂无回放摘要';
};
