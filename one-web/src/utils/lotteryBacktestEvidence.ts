import type { LotteryResearchProvenance } from '../services/api';

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
