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
