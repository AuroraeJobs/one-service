import type {
  LotteryBacktestReport,
  LotteryDecisionOutcomeItem,
  LotteryResearchProvenance
} from '../services/api';

const warningLabels: Record<string, { zh: string; en: string }> = {
  STATIC_POOL_HISTORICAL_REPLAY: {
    zh: '固定候选池用于历史回放',
    en: 'A static candidate pool was replayed across historical draws'
  },
  TRAIN_WINDOW_OVERLAP: {
    zh: '训练窗口与回测窗口存在重叠',
    en: 'The training window overlaps the backtest window'
  },
  VALIDATION_WINDOW_OVERLAP: {
    zh: '验证窗口与回测窗口存在重叠',
    en: 'The validation window overlaps the backtest window'
  },
  SMALL_SAMPLE: {
    zh: '历史样本量偏小',
    en: 'The historical sample is small'
  },
  LOW_CANDIDATE_DIVERSITY: {
    zh: '候选多样性偏低',
    en: 'Candidate diversity is low'
  },
  NO_RANDOM_ADVANTAGE: {
    zh: '未观察到相对随机基线优势',
    en: 'No advantage over the random baseline was observed'
  }
};

const readableCode = (code: string) => code.toLowerCase().replaceAll('_', ' ');

export const lotteryOverfitWarningLabel = (value: string, isEnglish = false) => {
  const code = String(value || '').trim().toUpperCase();
  if (!code) return '-';
  const exact = warningLabels[code];
  if (exact) return `${isEnglish ? exact.en : exact.zh} (${code})`;
  if (code.startsWith('UNKNOWN_')) {
    return `${isEnglish ? 'Unknown provenance or window evidence' : '语料或窗口证据未知'}: ${readableCode(code.slice('UNKNOWN_'.length))} (${code})`;
  }
  if (/^BASELINE_.+_MISMATCH$/.test(code)) {
    return `${isEnglish ? 'Random-baseline comparison mismatch' : '随机基线对照不一致'}: ${readableCode(code.slice('BASELINE_'.length, -'_MISMATCH'.length))} (${code})`;
  }
  return `${isEnglish ? 'Backtest warning' : '回测提醒'}: ${readableCode(code)} (${code})`;
};

export const lotteryOverfitWarningsText = (values: string[] = [], isEnglish = false) => (
  values.map(value => lotteryOverfitWarningLabel(value, isEnglish)).join(' · ')
);

export const MINI_GPT_OBSERVATION_BOUNDARY_STATES = [
  'TRAIN_WINDOW',
  'VALIDATION_WINDOW',
  'POST_CORPUS_PENDING',
  'POST_CORPUS_OBSERVED',
  'UNKNOWN'
] as const;

export type MiniGptObservationBoundaryState = typeof MINI_GPT_OBSERVATION_BOUNDARY_STATES[number];

export type MiniGptObservationBoundaryTone = 'blue' | 'cyan' | 'gold' | 'purple' | 'default';

export interface MiniGptObservationBoundaryLocalizedText {
  zh: string;
  en: string;
}

export interface MiniGptObservationBoundaryMetadata {
  tone: MiniGptObservationBoundaryTone;
  isOutOfSampleObservation: boolean;
  label: MiniGptObservationBoundaryLocalizedText;
  detail: MiniGptObservationBoundaryLocalizedText;
}

export const MINI_GPT_OBSERVATION_BOUNDARY_METADATA: Record<
  MiniGptObservationBoundaryState,
  MiniGptObservationBoundaryMetadata
> = {
  TRAIN_WINDOW: {
    tone: 'blue',
    isOutOfSampleObservation: false,
    label: {
      zh: '训练窗口内',
      en: 'Inside training window'
    },
    detail: {
      zh: '目标期号落在 MiniGPT 训练语料窗口内，属于样本内证据。',
      en: 'The target issue is inside the MiniGPT training corpus window and is in-sample evidence.'
    }
  },
  VALIDATION_WINDOW: {
    tone: 'cyan',
    isOutOfSampleObservation: false,
    label: {
      zh: '验证窗口内',
      en: 'Inside validation window'
    },
    detail: {
      zh: '目标期号落在 MiniGPT 验证语料窗口内，不是语料时间边界之外的观察。',
      en: 'The target issue is inside the MiniGPT validation corpus window, not an observation beyond the corpus boundary.'
    }
  },
  POST_CORPUS_PENDING: {
    tone: 'gold',
    isOutOfSampleObservation: false,
    label: {
      zh: '语料后待观察',
      en: 'Post-corpus observation pending'
    },
    detail: {
      zh: '目标期号晚于验证语料上界，但尚无实际评分，只能标记为待观察。',
      en: 'The target issue is later than the validation corpus boundary but has no actual score yet, so the observation remains pending.'
    }
  },
  POST_CORPUS_OBSERVED: {
    tone: 'purple',
    isOutOfSampleObservation: true,
    label: {
      zh: '语料后已观察',
      en: 'Post-corpus observation recorded'
    },
    detail: {
      zh: '目标期号晚于验证语料上界且已有实际评分。这只是单期样本外观察，不等同于 walk-forward 验证，也不构成未来表现证据。',
      en: 'The target issue is later than the validation corpus boundary and has an actual score. This is only a single out-of-sample observation, not walk-forward validation or evidence of future performance.'
    }
  },
  UNKNOWN: {
    tone: 'default',
    isOutOfSampleObservation: false,
    label: {
      zh: '时间边界未知',
      en: 'Time boundary unknown'
    },
    detail: {
      zh: '期号或语料边界缺失、格式不一致、非数字、顺序非法，或目标位于未声明空档，无法判定样本内外。',
      en: 'The issue or corpus boundaries are missing, inconsistently formatted, non-numeric, illegally ordered, or leave the target in an undeclared gap, so the observation boundary cannot be classified.'
    }
  }
};

export interface MiniGptObservationIssueRange {
  firstIssue: string;
  latestIssue: string;
}

export interface MiniGptObservationBoundaryInput {
  provenance?: LotteryResearchProvenance | null;
  targetIssue?: string | number | null;
  hasObservedResult?: boolean;
}

export interface MiniGptObservationBoundaryResult {
  state: MiniGptObservationBoundaryState;
  tone: MiniGptObservationBoundaryTone;
  isOutOfSampleObservation: boolean;
  trainRange: MiniGptObservationIssueRange | null;
  validationRange: MiniGptObservationIssueRange | null;
  targetIssue: string | null;
  metadata: MiniGptObservationBoundaryMetadata;
}

interface NormalizedIssue {
  value: string;
  numeric: bigint;
}

const normalizeIssue = (value: string | number | null | undefined): NormalizedIssue | null => {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) return null;
    const normalized = String(value);
    return { value: normalized, numeric: BigInt(normalized) };
  }

  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) return null;
  return { value: normalized, numeric: BigInt(normalized) };
};

const buildBoundaryResult = (
  state: MiniGptObservationBoundaryState,
  trainRange: MiniGptObservationIssueRange | null,
  validationRange: MiniGptObservationIssueRange | null,
  targetIssue: string | null
): MiniGptObservationBoundaryResult => {
  const metadata = MINI_GPT_OBSERVATION_BOUNDARY_METADATA[state];
  return {
    state,
    tone: metadata.tone,
    isOutOfSampleObservation: metadata.isOutOfSampleObservation,
    trainRange,
    validationRange,
    targetIssue,
    metadata
  };
};

export const classifyMiniGptObservationBoundary = ({
  provenance,
  targetIssue,
  hasObservedResult
}: MiniGptObservationBoundaryInput): MiniGptObservationBoundaryResult => {
  const trainFirst = normalizeIssue(provenance?.trainFirstIssue);
  const trainLatest = normalizeIssue(provenance?.trainLatestIssue);
  const validationFirst = normalizeIssue(provenance?.validationFirstIssue);
  const validationLatest = normalizeIssue(provenance?.validationLatestIssue);
  const target = normalizeIssue(targetIssue);
  const trainRange = trainFirst && trainLatest
    ? { firstIssue: trainFirst.value, latestIssue: trainLatest.value }
    : null;
  const validationRange = validationFirst && validationLatest
    ? { firstIssue: validationFirst.value, latestIssue: validationLatest.value }
    : null;

  if (
    !trainFirst
    || !trainLatest
    || !validationFirst
    || !validationLatest
    || !target
    || typeof hasObservedResult !== 'boolean'
  ) {
    return buildBoundaryResult('UNKNOWN', trainRange, validationRange, target?.value ?? null);
  }

  const hasLegalBoundaryOrder = trainFirst.numeric <= trainLatest.numeric
    && trainLatest.numeric < validationFirst.numeric
    && validationFirst.numeric <= validationLatest.numeric;
  const hasConsistentIssueWidth = new Set([
    trainFirst.value.length,
    trainLatest.value.length,
    validationFirst.value.length,
    validationLatest.value.length,
    target.value.length
  ]).size === 1;
  if (!hasLegalBoundaryOrder || !hasConsistentIssueWidth) {
    return buildBoundaryResult('UNKNOWN', trainRange, validationRange, target.value);
  }

  if (target.numeric >= trainFirst.numeric && target.numeric <= trainLatest.numeric) {
    return buildBoundaryResult('TRAIN_WINDOW', trainRange, validationRange, target.value);
  }

  if (target.numeric >= validationFirst.numeric && target.numeric <= validationLatest.numeric) {
    return buildBoundaryResult('VALIDATION_WINDOW', trainRange, validationRange, target.value);
  }

  if (target.numeric > validationLatest.numeric) {
    return buildBoundaryResult(
      hasObservedResult ? 'POST_CORPUS_OBSERVED' : 'POST_CORPUS_PENDING',
      trainRange,
      validationRange,
      target.value
    );
  }

  return buildBoundaryResult('UNKNOWN', trainRange, validationRange, target.value);
};

export const MINI_GPT_POST_CORPUS_SNAPSHOT_LIMIT = 100;
export const MINI_GPT_POST_CORPUS_SMALL_SAMPLE_ISSUES = 3;

export type MiniGptBaselineComparabilityState = 'COMPARABLE' | 'FAIL' | 'UNKNOWN';

export type MiniGptBaselineComparabilityReason =
  | 'MISSING_REVIEW_BINDING'
  | 'REVIEW_REPORT_UNAVAILABLE'
  | 'REPORT_ID_MISMATCH'
  | 'DECISION_OWNER_MISMATCH'
  | 'UNSTABLE_DECISION_PROVENANCE'
  | 'BACKTEST_PROVENANCE_MISMATCH'
  | 'BASELINE_WINDOW_MISMATCH'
  | 'BASELINE_BUDGET_MISMATCH'
  | 'BASELINE_COMPARABILITY_UNKNOWN'
  | 'BASELINE_TICKET_COUNT_MISMATCH'
  | 'BASELINE_METADATA_INCOMPLETE'
  | 'BASELINE_DELTAS_INCOMPLETE'
  | 'UNSUPPORTED_EVALUATION_MODE';

export interface MiniGptPostCorpusBaselineEvidence {
  state: MiniGptBaselineComparabilityState;
  reasons: MiniGptBaselineComparabilityReason[];
  reviewBacktestId?: string;
  reportId?: string;
  evaluationMode?: string;
  baselineAlgorithm?: string;
  baselineSeed?: number;
  windowIssueCount?: number;
  ticketCount?: number;
  baselineTicketCount?: number;
  averageRedHitsDelta?: number;
  blueHitRateDelta?: number;
  totalPrizeDelta?: number;
  netResultDelta?: number;
  roiPercentDelta?: number;
  warnings: string[];
}

export interface MiniGptPostCorpusObservedDecision {
  item: LotteryDecisionOutcomeItem;
  issue: string;
  stableProvenance: boolean;
  financialEvidenceComplete: boolean;
  baseline: MiniGptPostCorpusBaselineEvidence;
}

export interface MiniGptPostCorpusObservationGroup {
  key: string;
  stableProvenance: boolean;
  sourceType?: string;
  corpusVersion?: string;
  runId?: string;
  trainSha256?: string;
  validationSha256?: string;
  checkpointSha256?: string;
  trainFirstIssue?: string;
  trainLatestIssue?: string;
  validationFirstIssue?: string;
  validationLatestIssue?: string;
  decisionSetIds: string[];
  batchIds: string[];
  distinctIssueCount: number;
  issueRange: MiniGptObservationIssueRange | null;
  decisions: MiniGptPostCorpusObservedDecision[];
}

export interface MiniGptPostCorpusFinancialAggregate {
  decisionCount: number;
  totalCost: number | null;
  totalPrize: number | null;
  netResult: number | null;
  roiPercent: number | null;
}

export interface MiniGptPostCorpusOutcomeAggregate {
  boundedInputCount: number;
  miniGptDecisionCount: number;
  excludedNonMiniGptCount: number;
  stateCounts: Record<MiniGptObservationBoundaryState, number>;
  observedDecisionCount: number;
  distinctIssueCount: number;
  issueRange: MiniGptObservationIssueRange | null;
  scoredCandidateCount: number;
  winningCandidateCount: number;
  blueHitCount: number;
  blueHitRatePercent: number | null;
  hitDistribution: Record<string, number>;
  prizeDistribution: Record<string, number>;
  financial: MiniGptPostCorpusFinancialAggregate;
  comparableBaselineCount: number;
  failedBaselineCount: number;
  unknownBaselineCount: number;
  unstableObservedCount: number;
  groups: MiniGptPostCorpusObservationGroup[];
}

type BacktestLookup = Readonly<Record<string, LotteryBacktestReport | null | undefined>>;

const STABLE_PROVENANCE_FIELDS = [
  'corpusVersion',
  'runId',
  'trainSha256',
  'validationSha256',
  'checkpointSha256',
  'trainFirstIssue',
  'trainLatestIssue',
  'validationFirstIssue',
  'validationLatestIssue'
] as const satisfies ReadonlyArray<keyof LotteryResearchProvenance>;

const normalizedText = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : undefined;

export const hasMiniGptResearchProvenance = (provenance?: LotteryResearchProvenance | null) => {
  const sourceType = normalizedText(provenance?.sourceType)?.toUpperCase();
  return Boolean(
    normalizedText(provenance?.batchId)
    || normalizedText(provenance?.generationId)
    || sourceType?.includes('MINIGPT')
    || sourceType?.includes('MINI_GPT')
  );
};

const stableProvenanceSignature = (provenance?: LotteryResearchProvenance | null) => {
  const values = STABLE_PROVENANCE_FIELDS.map(field => normalizedText(provenance?.[field]));
  return values.every(Boolean) ? values.join('|') : null;
};

const safeCount = (value: unknown) => (
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0
);

const finiteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const mergeDistribution = (target: Record<string, number>, source?: Record<string, number>) => {
  Object.entries(source || {}).forEach(([label, value]) => {
    if (finiteNumber(value) && value >= 0) {
      target[label] = (target[label] || 0) + value;
    }
  });
};

const issueRange = (issues: string[]): MiniGptObservationIssueRange | null => {
  const normalized = issues.map(normalizeIssue).filter((value): value is NormalizedIssue => Boolean(value));
  if (!normalized.length) return null;
  normalized.sort((left, right) => left.numeric < right.numeric ? -1 : left.numeric > right.numeric ? 1 : 0);
  return {
    firstIssue: normalized[0].value,
    latestIssue: normalized[normalized.length - 1].value
  };
};

const comparableBaselineEvidence = (
  item: LotteryDecisionOutcomeItem,
  stableSignature: string | null,
  backtestsById: BacktestLookup
): MiniGptPostCorpusBaselineEvidence => {
  const reviewBacktestId = normalizedText(item.reviewBacktestId);
  const unknown = (
    reasons: MiniGptBaselineComparabilityReason[],
    report?: LotteryBacktestReport
  ): MiniGptPostCorpusBaselineEvidence => ({
    state: 'UNKNOWN',
    reasons,
    reviewBacktestId,
    reportId: report?.id,
    evaluationMode: report?.evaluationMode,
    baselineAlgorithm: report?.baselineAlgorithm,
    baselineSeed: report?.baselineSeed,
    windowIssueCount: report?.windowIssueCount,
    ticketCount: report?.ticketCount,
    baselineTicketCount: report?.baselineTicketCount,
    warnings: report?.overfitWarnings || []
  });

  if (!reviewBacktestId) {
    return unknown(['MISSING_REVIEW_BINDING']);
  }
  if (!stableSignature) {
    return unknown(['UNSTABLE_DECISION_PROVENANCE']);
  }
  const report = backtestsById[reviewBacktestId] || undefined;
  if (!report) {
    return unknown(['REVIEW_REPORT_UNAVAILABLE']);
  }
  if (normalizedText(report.id) !== reviewBacktestId) {
    return unknown(['REPORT_ID_MISMATCH'], report);
  }
  if (!normalizedText(item.decisionSetId) || normalizedText(report.decisionSetId) !== normalizedText(item.decisionSetId)) {
    return unknown(['DECISION_OWNER_MISMATCH'], report);
  }
  if (stableProvenanceSignature(report.provenance) !== stableSignature) {
    return unknown(['BACKTEST_PROVENANCE_MISMATCH'], report);
  }

  const failedReasons: MiniGptBaselineComparabilityReason[] = [];
  if (report.sameWindow === false) failedReasons.push('BASELINE_WINDOW_MISMATCH');
  if (report.sameBudget === false) failedReasons.push('BASELINE_BUDGET_MISMATCH');
  if (finiteNumber(report.ticketCount)
    && finiteNumber(report.baselineTicketCount)
    && report.ticketCount !== report.baselineTicketCount) {
    failedReasons.push('BASELINE_TICKET_COUNT_MISMATCH');
  }
  if (failedReasons.length) {
    return {
      ...unknown(failedReasons, report),
      state: 'FAIL'
    };
  }
  if (report.sameWindow !== true || report.sameBudget !== true) {
    return unknown(['BASELINE_COMPARABILITY_UNKNOWN'], report);
  }
  if (report.evaluationMode !== 'STATIC_POOL_HISTORICAL_REPLAY') {
    return unknown(['UNSUPPORTED_EVALUATION_MODE'], report);
  }
  if (!normalizedText(report.baselineAlgorithm)
    || !finiteNumber(report.baselineSeed)
    || !finiteNumber(report.windowIssueCount)
    || report.windowIssueCount <= 0
    || !finiteNumber(report.ticketCount)
    || !finiteNumber(report.baselineTicketCount)) {
    return unknown(['BASELINE_METADATA_INCOMPLETE'], report);
  }
  if (![report.averageRedHitsDelta, report.blueHitRateDelta, report.totalPrizeDelta, report.netResultDelta, report.roiPercentDelta]
    .every(finiteNumber)) {
    return unknown(['BASELINE_DELTAS_INCOMPLETE'], report);
  }

  return {
    state: 'COMPARABLE',
    reasons: [],
    reviewBacktestId,
    reportId: report.id,
    evaluationMode: report.evaluationMode,
    baselineAlgorithm: report.baselineAlgorithm,
    baselineSeed: report.baselineSeed,
    windowIssueCount: report.windowIssueCount,
    ticketCount: report.ticketCount,
    baselineTicketCount: report.baselineTicketCount,
    averageRedHitsDelta: report.averageRedHitsDelta,
    blueHitRateDelta: report.blueHitRateDelta,
    totalPrizeDelta: report.totalPrizeDelta,
    netResultDelta: report.netResultDelta,
    roiPercentDelta: report.roiPercentDelta,
    warnings: report.overfitWarnings || []
  };
};

interface MutableObservationGroup extends Omit<MiniGptPostCorpusObservationGroup, 'decisionSetIds' | 'batchIds' | 'distinctIssueCount' | 'issueRange'> {
  decisionSetIdSet: Set<string>;
  batchIdSet: Set<string>;
}

export const aggregateMiniGptPostCorpusOutcomes = (
  items: LotteryDecisionOutcomeItem[] = [],
  backtestsById: BacktestLookup = {}
): MiniGptPostCorpusOutcomeAggregate => {
  const stateCounts = Object.fromEntries(
    MINI_GPT_OBSERVATION_BOUNDARY_STATES.map(state => [state, 0])
  ) as Record<MiniGptObservationBoundaryState, number>;
  const groups = new Map<string, MutableObservationGroup>();
  const observedItems: LotteryDecisionOutcomeItem[] = [];
  const observedIssues: string[] = [];
  const hitDistribution: Record<string, number> = {};
  const prizeDistribution: Record<string, number> = {};
  let miniGptDecisionCount = 0;
  let scoredCandidateCount = 0;
  let winningCandidateCount = 0;
  let blueHitCount = 0;
  let unstableObservedCount = 0;
  let comparableBaselineCount = 0;
  let failedBaselineCount = 0;
  let unknownBaselineCount = 0;
  let financialDecisionCount = 0;
  let financialCost = 0;
  let financialPrize = 0;

  items.forEach((item, index) => {
    if (!hasMiniGptResearchProvenance(item.provenance)) return;
    miniGptDecisionCount += 1;
    const scoredCount = item.scoredCandidateCount;
    const hasOwnedObservedResult = normalizedText(item.decisionSetId) && finiteNumber(scoredCount) && scoredCount >= 0
      ? scoredCount > 0
      : undefined;
    const boundary = classifyMiniGptObservationBoundary({
      provenance: item.provenance,
      targetIssue: item.targetIssue,
      hasObservedResult: hasOwnedObservedResult
    });
    stateCounts[boundary.state] += 1;
    if (boundary.state !== 'POST_CORPUS_OBSERVED' || !boundary.targetIssue) return;

    observedItems.push(item);
    observedIssues.push(boundary.targetIssue);
    scoredCandidateCount += safeCount(item.scoredCandidateCount);
    winningCandidateCount += safeCount(item.winningCandidateCount);
    blueHitCount += safeCount(item.blueHitCount);
    mergeDistribution(hitDistribution, item.hitDistribution);
    mergeDistribution(prizeDistribution, item.prizeDistribution);

    const convertedTicketCount = safeCount(item.convertedTicketCount);
    const checkedConvertedTicketCount = safeCount(item.checkedConvertedTicketCount);
    const financialEvidenceComplete = convertedTicketCount > 0
      && checkedConvertedTicketCount === convertedTicketCount
      && finiteNumber(item.totalCost)
      && finiteNumber(item.totalPrize);
    if (financialEvidenceComplete) {
      financialDecisionCount += 1;
      financialCost += item.totalCost || 0;
      financialPrize += item.totalPrize || 0;
    }

    const stableSignature = stableProvenanceSignature(item.provenance);
    const stableProvenance = Boolean(stableSignature && normalizedText(item.decisionSetId));
    if (!stableProvenance) unstableObservedCount += 1;
    const groupKey = stableProvenance
      ? stableSignature as string
      : `UNSTABLE|${normalizedText(item.decisionSetId) || index}`;
    const baseline = comparableBaselineEvidence(item, stableSignature, backtestsById);
    if (baseline.state === 'COMPARABLE') comparableBaselineCount += 1;
    else if (baseline.state === 'FAIL') failedBaselineCount += 1;
    else unknownBaselineCount += 1;

    const existing = groups.get(groupKey);
    const decision: MiniGptPostCorpusObservedDecision = {
      item,
      issue: boundary.targetIssue,
      stableProvenance,
      financialEvidenceComplete,
      baseline
    };
    if (existing) {
      existing.decisions.push(decision);
      if (item.decisionSetId) existing.decisionSetIdSet.add(item.decisionSetId);
      if (item.provenance?.batchId) existing.batchIdSet.add(item.provenance.batchId);
      return;
    }
    groups.set(groupKey, {
      key: groupKey,
      stableProvenance,
      sourceType: item.provenance?.sourceType,
      corpusVersion: item.provenance?.corpusVersion,
      runId: item.provenance?.runId,
      trainSha256: item.provenance?.trainSha256,
      validationSha256: item.provenance?.validationSha256,
      checkpointSha256: item.provenance?.checkpointSha256,
      trainFirstIssue: item.provenance?.trainFirstIssue,
      trainLatestIssue: item.provenance?.trainLatestIssue,
      validationFirstIssue: item.provenance?.validationFirstIssue,
      validationLatestIssue: item.provenance?.validationLatestIssue,
      decisions: [decision],
      decisionSetIdSet: new Set(item.decisionSetId ? [item.decisionSetId] : []),
      batchIdSet: new Set(item.provenance?.batchId ? [item.provenance.batchId] : [])
    });
  });

  const finalizedGroups = [...groups.values()].map(group => {
    group.decisions.sort((left, right) => left.issue.localeCompare(right.issue));
    const issues = [...new Set(group.decisions.map(decision => decision.issue))];
    return {
      key: group.key,
      stableProvenance: group.stableProvenance,
      sourceType: group.sourceType,
      corpusVersion: group.corpusVersion,
      runId: group.runId,
      trainSha256: group.trainSha256,
      validationSha256: group.validationSha256,
      checkpointSha256: group.checkpointSha256,
      trainFirstIssue: group.trainFirstIssue,
      trainLatestIssue: group.trainLatestIssue,
      validationFirstIssue: group.validationFirstIssue,
      validationLatestIssue: group.validationLatestIssue,
      decisionSetIds: [...group.decisionSetIdSet],
      batchIds: [...group.batchIdSet],
      distinctIssueCount: issues.length,
      issueRange: issueRange(issues),
      decisions: group.decisions
    };
  }).sort((left, right) => {
    if (left.stableProvenance !== right.stableProvenance) return left.stableProvenance ? -1 : 1;
    return left.key.localeCompare(right.key);
  });
  const distinctIssues = [...new Set(observedIssues)];
  const netResult = financialPrize - financialCost;

  return {
    boundedInputCount: items.length,
    miniGptDecisionCount,
    excludedNonMiniGptCount: items.length - miniGptDecisionCount,
    stateCounts,
    observedDecisionCount: observedItems.length,
    distinctIssueCount: distinctIssues.length,
    issueRange: issueRange(distinctIssues),
    scoredCandidateCount,
    winningCandidateCount,
    blueHitCount,
    blueHitRatePercent: scoredCandidateCount > 0 ? (blueHitCount / scoredCandidateCount) * 100 : null,
    hitDistribution,
    prizeDistribution,
    financial: {
      decisionCount: financialDecisionCount,
      totalCost: financialDecisionCount > 0 ? financialCost : null,
      totalPrize: financialDecisionCount > 0 ? financialPrize : null,
      netResult: financialDecisionCount > 0 ? netResult : null,
      roiPercent: financialCost > 0 ? (netResult / financialCost) * 100 : null
    },
    comparableBaselineCount,
    failedBaselineCount,
    unknownBaselineCount,
    unstableObservedCount,
    groups: finalizedGroups
  };
};
