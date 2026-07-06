const lotteryStatusText: Record<string, string> = {
  ACTIVE: '启用',
  ALL: '全部',
  APPLIED: '已应用',
  APPROVED: '已审批',
  ARCHIVED: '已归档',
  AVAILABLE: '可用',
  BEFORE_DRAW: '开奖前',
  COMPLETE: '已完成',
  CONFIRMED_SIGNAL: '已确认信号',
  DISABLED: '未启用',
  DRAFT: '草稿',
  EXECUTED: '已执行',
  FAILED: '失败',
  HIGH: '高风险',
  IDLE: '空闲',
  LINKED: '已关联',
  MANUAL: '人工处理',
  MISSING: '缺失',
  NO_HIT: '未命中',
  NOTE: '备注',
  OBSERVE: '观察',
  OK: '正常',
  OPEN: '待处理',
  OVER: '超额',
  PASS: '通过',
  PAUSE: '暂停',
  PENDING: '待处理',
  POSITIVE: '正向',
  POST_SYNC_WINDOW: '同步窗口后',
  POSTSYNCWINDOW: '同步窗口后',
  PROMOTE: '推广',
  PROMOTE_SIGNAL: '推广信号',
  READY: '就绪',
  RECALIBRATE: '需校准',
  REJECTED: '已放弃',
  RETIRE: '退役',
  RUNNING: '运行中',
  SAVED: '已保存',
  SKIPPED: '已跳过',
  SNOOZED: '稍后',
  STALE: '已过期',
  SUCCESS: '成功',
  TODO: '待办',
  UNKNOWN: '未知',
  VALIDATED: '已验证',
  VOLATILE: '波动',
  WAITING_SYNC: '等待同步',
  WARNING: '警告',
  WATCH: '观察',
  WATCH_RISK: '观察风险',
  WATCHING: '观察中'
};

const readableStatusText: Record<string, string> = {
  after: '后',
  before: '前',
  draw: '开奖',
  high: '高',
  risk: '风险',
  signal: '信号'
};

const lotteryCodeText: Record<string, string> = {
  BACKTEST: '回测',
  BACKTESTS: '回测报告',
  CANDIDATE: '候选',
  DECISION: '决策',
  DECISION_OUTCOMES: '决策结果',
  DECISION_SETS: '决策集',
  DEEP: '深度',
  EXPORT: '导出',
  EXPERIMENT: '实验',
  EXPERIMENTS: '策略实验',
  FAST: '快速',
  LEDGER_ISSUES: '期次账本',
  MANUAL: '手动',
  PORTFOLIO: '组合',
  PREDICTION: '预测',
  PREDICTIONS: '预测快照',
  PRIMARY: '主选',
  REPORT_EXPORT: '报表导出',
  RULE: '规则',
  RULE_EVIDENCE: '规则证据',
  SIMULATION: '模拟',
  STANDARD: '标准',
  TICKET_IMPORT_PREVIEWS: '导入预览',
  TICKET_PACK: '票包',
  TICKETS: '票据'
};

const lotteryMessageText: Record<string, string> = {
  'Lottery operations are ready': '彩票运营已就绪',
  'Lottery operations need review before month-end': '月末前需要复核彩票运营',
  'Lottery operations need attention': '彩票运营需要关注'
};

export const lotteryStatusLabel = (status?: string, fallback = 'UNKNOWN') => {
  const normalized = (status || fallback).trim();
  if (!normalized) {
    return lotteryStatusText.UNKNOWN;
  }
  const upper = normalized.toUpperCase();
  if (lotteryStatusText[upper]) {
    return lotteryStatusText[upper];
  }
  const underscoreUpper = normalized
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toUpperCase();
  if (lotteryStatusText[underscoreUpper]) {
    return lotteryStatusText[underscoreUpper];
  }
  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(part => lotteryStatusText[part.toUpperCase()] || readableStatusText[part.toLowerCase()] || part)
    .join('');
};

export const lotteryCodeLabel = (code?: string, fallback = '-') => {
  const normalized = (code || fallback).trim();
  if (!normalized || normalized === '-') {
    return fallback;
  }
  const upperKey = normalized.replace(/[-\s]+/g, '_').toUpperCase();
  if (lotteryCodeText[upperKey]) {
    return lotteryCodeText[upperKey];
  }
  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(part => lotteryCodeText[part.toUpperCase()] || readableStatusText[part.toLowerCase()] || part)
    .join('');
};

export const lotteryMessageLabel = (message?: string, fallback = '-') => {
  const normalized = (message || '').trim();
  if (!normalized) {
    return fallback;
  }
  return lotteryMessageText[normalized] || normalized;
};
