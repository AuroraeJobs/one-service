// API服务配置
import axios from 'axios';

// 类型定义
interface LastRecordResponse {
  code: string;
  date: string;
  week: string;
  red: string;
  blue: string;
  sales: string;
  poolmoney: string;
  line: string;
}

interface RecordListResponse {
  code: string;
  date: string;
  week: string;
  red: string;
  blue: string;
  sales: string;
  poolmoney: string;
  line: string;
}

export interface LotteryRecordQuery {
  issueStart?: string;
  issueEnd?: string;
  lineStart?: string;
  lineEnd?: string;
  dayStart?: string;
  dayEnd?: string;
}

export interface RecordYearCount {
  year: string;
  count: number;
}

export interface LotteryRecordSyncLog {
  id?: string;
  jobName?: string;
  status?: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED' | string;
  startIssue?: string;
  endIssue?: string;
  savedCount?: number;
  message?: string;
  failureCategory?: string;
  provider?: string;
  requestMode?: string;
  httpStatus?: number;
  networkBlockSuspected?: boolean;
  startedAt?: number;
  finishedAt?: number;
}

export interface LotteryRecordSyncSummary {
  totalCount?: number;
  successCount?: number;
  failedCount?: number;
  skippedCount?: number;
  runningCount?: number;
  successRate?: number;
  failedRate?: number;
  savedCount?: number;
  latestJobName?: string;
  latestStatus?: string;
  latestMessage?: string;
  latestFailureCategory?: string;
  latestProvider?: string;
  latestRequestMode?: string;
  latestHttpStatus?: number;
  latestNetworkBlockSuspected?: boolean;
  latestStartIssue?: string;
  latestEndIssue?: string;
  latestStartedAt?: number;
  latestFinishedAt?: number;
  latestDurationMs?: number;
  averageDurationMs?: number;
  lastSuccessAt?: number;
  lastFailureAt?: number;
  lastSkippedAt?: number;
  generatedAt?: number;
}

export interface LotteryProviderProbeResult {
  category?: string;
  provider?: string;
  success?: boolean;
  status?: string;
  message?: string;
  recordCount?: number;
  durationMs?: number;
  checkedAt?: number;
  failureCategory?: string;
  requestMode?: string;
  httpStatus?: number;
  responseContentType?: string;
  responseSnippet?: string;
  networkBlockSuspected?: boolean;
}

export interface LotteryProviderProbeLog extends LotteryProviderProbeResult {
  id?: string;
}

export interface LotteryAuditEvent {
  id?: string;
  eventType?: string;
  targetType?: string;
  targetId?: string;
  requesterScope?: string;
  filters?: Record<string, string>;
  rowCount?: number;
  message?: string;
  generatedAt?: number;
}

export interface LotteryExportResult {
  exportId?: string;
  exportType?: string;
  format?: string;
  filters?: Record<string, string>;
  rowCount?: number;
  requesterScope?: string;
  generatedAt?: number;
  fileName?: string;
  content?: string;
}

export interface LotteryMaintenanceCollectionStatus {
  collection?: string;
  totalCount?: number;
  staleCount?: number;
  retentionDays?: number;
  oversizedBy?: number;
  cleanupSupported?: boolean;
  message?: string;
}

export interface LotteryMaintenanceCacheStatus {
  cacheKey?: string;
  present?: boolean;
  ttlSeconds?: number;
  noExpiry?: boolean;
  cleanupSupported?: boolean;
  message?: string;
}

export interface LotteryMaintenanceSummary {
  dryRun?: boolean;
  collections: LotteryMaintenanceCollectionStatus[];
  caches?: LotteryMaintenanceCacheStatus[];
  generatedAt?: number;
}

export interface LotteryOperationsHealthContributor {
  key?: string;
  label?: string;
  status?: string;
  score?: number;
  weight?: number;
  message?: string;
  path?: string;
  pendingCount?: number;
  updatedAt?: number;
}

export interface LotteryOperationsHealthSummary {
  score?: number;
  status?: string;
  message?: string;
  latestIssue?: string;
  nextIssue?: string;
  warningCount?: number;
  pendingActionCount?: number;
  contributors: LotteryOperationsHealthContributor[];
  generatedAt?: number;
}

export interface LotteryPreference {
  id?: string;
  userId?: string;
  defaultTrainingScale?: string;
  defaultReplayCount?: number;
  autoSavePredictions?: boolean;
  defaultTicketSource?: string;
  weeklyBudget?: number;
  monthlyBudget?: number;
  maxTicketsPerIssue?: number;
  budgetReminderPercent?: number;
  reminderDrawWindowHours?: number;
  reminderDefaultSnoozeMinutes?: number;
  monthEndExportChecklistEnabled?: boolean;
  governancePortfolioScoreThreshold?: number;
  governanceSimulatorHighRiskLimit?: number;
  governanceTicketPackBudgetExposurePercent?: number;
  governanceEvidenceFreshnessDays?: number;
  governanceStaleApprovalHours?: number;
  workbenchWidgetOrder?: string[];
  hiddenWorkbenchWidgets?: string[];
  createdAt?: number;
  updatedAt?: number;
}

export interface LotteryDataQualityReport {
  totalRecords?: number;
  missingIssueCount?: number;
  duplicateIssueCount?: number;
  malformedRecordCount?: number;
  invalidNumberCount?: number;
  outOfOrderLineCount?: number;
  futureDateCount?: number;
  staleDerivedDataCount?: number;
  missingIssues: string[];
  duplicateIssues: string[];
  malformedIssues: string[];
  outOfOrderLineIssues: string[];
  futureDateIssues: string[];
  staleDerivedDataReasons: string[];
  generatedAt?: number;
}

export interface LotteryDataQualityRepairRequest {
  issues?: string[];
  issueStart?: string;
  issueEnd?: string;
  limit?: number;
  confirm?: boolean;
}

export interface LotteryDataQualityRepairResult {
  repairType?: string;
  dryRun?: boolean;
  missingBefore?: number;
  missingAfter?: number;
  requestedIssueCount?: number;
  repairableIssueCount?: number;
  repairedIssueCount?: number;
  skippedIssueCount?: number;
  insertedIssueCount?: number;
  renumberedRecordCount?: number;
  cacheInvalidated?: boolean;
  confirmRequired?: boolean;
  confirmed?: boolean;
  auditEventId?: string;
  message?: string;
  requestedIssues: string[];
  repairableIssues: string[];
  repairedIssues: string[];
  skippedIssues: string[];
  insertIssues: string[];
  repairSteps: string[];
  generatedAt?: number;
}

export interface LotteryDraw {
  id?: string;
  issue?: string;
  period?: number;
  drawDate?: string;
  raw?: string;
  redNumbers: string[];
  blueNumber: string;
  redSum?: number;
  oddCount?: number;
  evenCount?: number;
  bigCount?: number;
  smallCount?: number;
  span?: number;
  consecutivePairs?: number;
  combination?: string;
  planetName?: string;
  hexagramCode?: string;
  hexagramName?: string;
  source?: string;
  sourceUpdatedAt?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface LotteryNumberFrequency {
  number: string;
  count: number;
  percent: number;
}

export interface LotteryDistributionItem {
  value: string;
  count: number;
  percent: number;
}

export interface LotteryStatisticsSummary {
  totalDraws: number;
  firstIssue?: string;
  latestIssue?: string;
  firstDrawDate?: string;
  latestDrawDate?: string;
  firstDraw?: LotteryDraw;
  latestDraw?: LotteryDraw;
  redFrequency: LotteryNumberFrequency[];
  blueFrequency: LotteryNumberFrequency[];
  redSumDistribution: LotteryDistributionItem[];
  oddCountDistribution: LotteryDistributionItem[];
  bigCountDistribution: LotteryDistributionItem[];
  spanDistribution: LotteryDistributionItem[];
  generatedAt?: number;
}

interface ChatResponse {
  response: string;
  model?: string;
}

export interface AiModel {
  id: string;
  name: string;
  provider: 'local' | 'deepseek' | 'openai' | string;
  model: string;
  available?: boolean;
  details?: Record<string, unknown>;
}

export type AiProvider = 'local' | 'deepseek' | 'openai';
export const DEFAULT_LOCAL_AI_MODEL_KEYWORD = 'llama';

export interface AuthUserProfile {
  id: string;
  username: string;
  avatar?: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface UpdateUserProfileRequest {
  username: string;
  avatar?: string;
  email?: string;
  phone?: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AdminUserSummary {
  id: string;
  username: string;
  avatar?: string;
  email?: string;
  phone?: string;
  role?: string;
  enabled?: boolean;
  createTime?: number;
  updateTime?: number;
}

export interface AdminUserPageResponse {
  items: AdminUserSummary[];
  total: number;
  page: number;
  size: number;
}

export interface AdminCreateUserRequest {
  username: string;
  password: string;
  avatar?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface AdminUpdateUserRequest {
  username: string;
  avatar?: string;
  email?: string;
  phone?: string;
  role?: string;
  enabled?: boolean;
}

export interface AdminResetUserCredentialsRequest {
  password: string;
}

interface ApiResponse<T> {
  code: number | string;
  message?: string;
  data: T;
}

interface AuthActionResult {
  success: boolean;
  message?: string;
  user?: AuthUserProfile;
}

const isSuccessCode = (code: number | string) => Number(code) === 200;

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ message?: string; error?: string; msg?: string; detail?: string }>(error)) {
    const responseData = error.response?.data;
    return responseData?.message
      || responseData?.error
      || responseData?.msg
      || responseData?.detail
      || error.message
      || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

// 创建axios实例
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 180000, // 3分钟
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证信息等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API请求失败:', error);
    console.error('错误响应状态:', error.response?.status);
    console.error('错误响应数据:', error.response?.data);
    // 如果后端返回了错误信息，将其附加到 error 对象上
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    } else if (error.response?.data?.error) {
      error.message = error.response.data.error;
    }
    return Promise.reject(error);
  }
);

// 记录相关API
export const recordApi = {
  // 查询记录列表
  find: (params: { issueStart?: string; issueEnd?: string; lineStart?: string; lineEnd?: string; dayStart?: string; dayEnd?: string; name?: string }): Promise<RecordListResponse[]> => {
    return apiClient.post('/record/find', params);
  },
  // 获取最新记录
  getLast: (): Promise<LastRecordResponse> => {
    return apiClient.get('/record/last');
  },
  // 获取第一条记录
  getFirst: (): Promise<LastRecordResponse> => {
    return apiClient.get('/record/first');
  },
  // 获取所有记录（用于统计分析）
  getAllRecords: (): Promise<string | string[]> => {
    return apiClient.get('/record/records');
  },
  // 获取每年的开奖记录数量
  getYearlyCounts: (): Promise<RecordYearCount[]> => {
    return apiClient.get('/record/yearly-counts');
  },
  // 重新统计每年的开奖记录数量并保存到Redis
  refreshYearlyCounts: (): Promise<RecordYearCount[]> => {
    return apiClient.post('/record/yearly-counts/statistics');
  },
  // 更新记录
  update: (): Promise<void> => {
    return apiClient.get('/record/update');
  },
};

// 彩票开奖记录API，新功能优先使用 /lottery/records 命名空间
export const lotteryRecordApi = {
  latest: (): Promise<LastRecordResponse> => {
    return apiClient.get('/lottery/records/latest');
  },
  first: (): Promise<LastRecordResponse> => {
    return apiClient.get('/lottery/records/first');
  },
  latestDraw: (): Promise<LotteryDraw> => {
    return apiClient.get('/lottery/records/draws/latest');
  },
  firstDraw: (): Promise<LotteryDraw> => {
    return apiClient.get('/lottery/records/draws/first');
  },
  records: (params?: LotteryRecordQuery): Promise<RecordListResponse[]> => {
    return apiClient.get('/lottery/records', { params });
  },
  draws: (params?: LotteryRecordQuery & { page?: number; size?: number }): Promise<LotteryDraw[]> => {
    return apiClient.get('/lottery/records/draws', { params });
  },
  getYearlyCounts: (): Promise<RecordYearCount[]> => {
    return apiClient.get('/lottery/records/yearly-counts');
  },
  refreshYearlyCounts: (): Promise<RecordYearCount[]> => {
    return apiClient.post('/lottery/records/yearly-counts/statistics');
  },
  sync: (): Promise<LotteryRecordSyncLog> => {
    return apiClient.post('/lottery/records/sync');
  },
  syncLogs: (params?: { status?: string; limit?: number }): Promise<LotteryRecordSyncLog[]> => {
    return apiClient.get('/lottery/records/sync-logs', { params });
  },
  syncLogsPage: (params?: {
    status?: string;
    startedStartAt?: number;
    startedEndAt?: number;
    page?: number;
    pageSize?: number;
  }): Promise<LotteryPageResponse<LotteryRecordSyncLog>> => {
    return apiClient.get('/lottery/records/sync-logs', { params });
  },
  deleteSyncLog: (id: string): Promise<void> => {
    return apiClient.delete(`/lottery/records/sync-logs/${id}`);
  },
  syncSummary: (params?: { limit?: number }): Promise<LotteryRecordSyncSummary> => {
    return apiClient.get('/lottery/records/sync-summary', { params });
  },
};

export const lotteryProviderApi = {
  probe: (params?: { provider?: string }): Promise<LotteryProviderProbeResult> => {
    return apiClient.get('/lottery/providers/probe', { params });
  },
  probeLogs: (params?: { provider?: string; limit?: number }): Promise<LotteryProviderProbeLog[]> => {
    return apiClient.get('/lottery/providers/probe-logs', { params });
  },
  probeLogsPage: (params?: {
    provider?: string;
    success?: boolean;
    checkedStartAt?: number;
    checkedEndAt?: number;
    page?: number;
    pageSize?: number;
  }): Promise<LotteryPageResponse<LotteryProviderProbeLog>> => {
    return apiClient.get('/lottery/providers/probe-logs', { params });
  },
};

export const lotteryStatisticsApi = {
  summary: (): Promise<LotteryStatisticsSummary> => {
    return apiClient.get('/lottery/statistics/summary');
  },
  refreshSummary: (): Promise<LotteryStatisticsSummary> => {
    return apiClient.post('/lottery/statistics/summary/refresh');
  },
  frequency: (): Promise<{ red: LotteryNumberFrequency[]; blue: LotteryNumberFrequency[] }> => {
    return apiClient.get('/lottery/statistics/frequency');
  },
  distribution: (): Promise<{
    redSum: LotteryDistributionItem[];
    oddCount: LotteryDistributionItem[];
    bigCount: LotteryDistributionItem[];
    span: LotteryDistributionItem[];
  }> => {
    return apiClient.get('/lottery/statistics/distribution');
  },
};

export const lotteryPreferenceApi = {
  preference: (): Promise<LotteryPreference> => {
    return apiClient.get('/lottery/preferences');
  },
  updatePreference: (preference: Partial<LotteryPreference>): Promise<LotteryPreference> => {
    return apiClient.put('/lottery/preferences', preference);
  }
};

export const lotteryDataQualityApi = {
  report: (): Promise<LotteryDataQualityReport> => {
    return apiClient.get('/lottery/data-quality');
  },
  dryRunMissingIssuesRepair: (request?: LotteryDataQualityRepairRequest): Promise<LotteryDataQualityRepairResult> => {
    return apiClient.post('/lottery/data-quality/repair/missing-issues/dry-run', request || {});
  },
  confirmMissingIssuesRepair: (request?: LotteryDataQualityRepairRequest): Promise<LotteryDataQualityRepairResult> => {
    return apiClient.post('/lottery/data-quality/repair/missing-issues/confirm', request || {});
  }
};

export interface StockQuote {
  symbol: string;
  market?: string;
  code?: string;
  name?: string;
  price?: number;
  changeAmount?: number;
  changePercent?: number;
  open?: number;
  previousClose?: number;
  high?: number;
  low?: number;
  volume?: number;
  amount?: number;
  tradeDateTime?: string;
  source?: string;
  sourceSymbol?: string;
  fetchedAt?: number;
  available?: boolean;
  stale?: boolean;
  staleReason?: string;
  message?: string;
}

export interface StockWatchlistItem {
  id?: string;
  userId?: string;
  symbol: string;
  market?: string;
  code?: string;
  name?: string;
  sortOrder?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface StockKLine {
  id?: string;
  symbol: string;
  market?: string;
  code?: string;
  period?: string;
  tradeDate: string;
  open?: number;
  close?: number;
  high?: number;
  low?: number;
  volume?: number;
  amount?: number;
  changeAmount?: number;
  changePercent?: number;
  source?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface StockKLineSyncLog {
  id?: string;
  jobName?: string;
  symbol?: string;
  period?: string;
  status?: string;
  requestedCount?: number;
  savedCount?: number;
  message?: string;
  startedAt?: number;
  finishedAt?: number;
}

export interface StockKLineSyncSummary {
  symbol?: string;
  totalCount?: number;
  successCount?: number;
  failedCount?: number;
  runningCount?: number;
  successRate?: number;
  failedRate?: number;
  requestedCount?: number;
  savedCount?: number;
  latestJobName?: string;
  latestStatus?: string;
  latestMessage?: string;
  latestStartedAt?: number;
  latestFinishedAt?: number;
  latestDurationMs?: number;
  averageDurationMs?: number;
  lastSuccessAt?: number;
  lastFailureAt?: number;
  generatedAt?: number;
}

export interface StockHoldingSummary {
  positionId?: string;
  accountId?: string;
  symbol: string;
  market?: string;
  code?: string;
  name?: string;
  quantity?: number;
  costPrice?: number;
  costAmount?: number;
  latestPrice?: number;
  changeAmount?: number;
  changePercent?: number;
  marketValue?: number;
  floatingPnl?: number;
  floatingPnlPercent?: number;
  realizedPnl?: number;
  dividendIncome?: number;
  todayPnl?: number;
  quoteAvailable?: boolean;
  stale?: boolean;
}

export interface StockPortfolioSummary {
  totalMarketValue?: number;
  totalCostAmount?: number;
  floatingPnl?: number;
  floatingPnlPercent?: number;
  realizedPnl?: number;
  dividendIncome?: number;
  todayPnl?: number;
  holdingCount?: number;
  calculatedAt?: number;
  holdings?: StockHoldingSummary[];
}

export interface StockAccount {
  id?: string;
  userId?: string;
  name: string;
  broker?: string;
  accountNo?: string;
  currency?: string;
  cashBalance?: number;
  status?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface StockPosition {
  id?: string;
  userId?: string;
  accountId?: string;
  symbol: string;
  market?: string;
  code?: string;
  name?: string;
  quantity?: number;
  availableQuantity?: number;
  costPrice?: number;
  costAmount?: number;
  openedAt?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface StockTrade {
  id?: string;
  userId?: string;
  accountId?: string;
  symbol: string;
  market?: string;
  code?: string;
  name?: string;
  tradeType: string;
  quantity?: number;
  price?: number;
  amount?: number;
  fee?: number;
  tax?: number;
  tradedAt?: number;
  remark?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface StockAlertRule {
  id?: string;
  userId?: string;
  symbol: string;
  market?: string;
  code?: string;
  name?: string;
  ruleType: string;
  direction: string;
  targetValue?: number;
  enabled?: boolean;
  throttleSeconds?: number;
  lastTriggeredAt?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface StockAlertHistory {
  id?: string;
  userId?: string;
  ruleId?: string;
  symbol?: string;
  ruleType?: string;
  direction?: string;
  targetValue?: number;
  triggerValue?: number;
  message?: string;
  triggeredAt?: number;
  createdAt?: number;
}

export interface StockAnalysisItem {
  symbol?: string;
  name?: string;
  value?: number;
  percent?: number;
  message?: string;
}

export interface StockAnalysisSummary {
  concentrationPercent?: number;
  concentrationSymbol?: string;
  concentration?: StockAnalysisItem[];
  volatility?: StockAnalysisItem[];
  drawdown?: StockAnalysisItem[];
  topGainers?: StockAnalysisItem[];
  topLosers?: StockAnalysisItem[];
  calculatedAt?: number;
}

export interface StockProviderHealth {
  category?: string;
  provider?: string;
  active?: boolean;
  fallback?: boolean;
  registered?: boolean;
  status?: string;
  checkedAt?: number;
}

export interface StockProviderProbeResult {
  category?: string;
  symbol?: string;
  success?: boolean;
  available?: boolean;
  sampleCount?: number;
  durationMs?: number;
  checkedAt?: number;
  message?: string;
}

export interface StockProviderConfig {
  provider?: string;
  fallbackProviders?: string[];
  cacheEnabled?: boolean;
  quoteCacheTtlSeconds?: number;
  fallbackCacheTtlSeconds?: number;
  providerProbeTtlSeconds?: number;
  defaultSymbols?: string[];
  klineSyncEnabled?: boolean;
  klineSyncCron?: string;
  klineSyncSymbols?: string[];
  alertEvaluationEnabled?: boolean;
  alertEvaluationCron?: string;
  checkedAt?: number;
}

export interface StockPreference {
  id?: string;
  userId?: string;
  defaultAccountId?: string;
  defaultCurrency?: string;
  defaultKLinePeriod?: string;
  quoteRefreshIntervalSeconds?: number;
  createdAt?: number;
  updatedAt?: number;
}

export const stockApi = {
  quote: (symbol: string): Promise<StockQuote> => {
    return apiClient.get('/stock/quote', {
      params: { symbol }
    });
  },

  quotes: (symbols?: string[]): Promise<StockQuote[]> => {
    return apiClient.get('/stock/quotes', {
      params: { symbols },
      paramsSerializer: {
        indexes: null
      }
    });
  },

  watchlist: (): Promise<StockWatchlistItem[]> => {
    return apiClient.get('/stock/watchlist');
  },

  addWatchlist: (symbol: string): Promise<StockWatchlistItem> => {
    return apiClient.post('/stock/watchlist', {
      symbol
    });
  },

  deleteWatchlist: (symbol: string): Promise<void> => {
    return apiClient.delete(`/stock/watchlist/${symbol}`);
  },

  updateWatchlistOrder: (symbols: string[]): Promise<StockWatchlistItem[]> => {
    return apiClient.put('/stock/watchlist/order', symbols);
  },

  klines: (symbol: string, params?: { period?: string; startDate?: string; endDate?: string }): Promise<StockKLine[]> => {
    return apiClient.get(`/stock/${symbol}/klines`, { params });
  },

  syncKlines: (symbol: string, klines?: StockKLine[]): Promise<StockKLine[]> => {
    return apiClient.post(`/stock/${symbol}/klines/sync`, klines);
  },

  syncAllKlines: (klines?: StockKLine[]): Promise<StockKLine[]> => {
    return apiClient.post('/stock/klines/sync', klines);
  },

  retryKlineSync: (): Promise<StockKLine[]> => {
    return apiClient.post('/stock/klines/sync/retry');
  },

  triggerScheduledKlineSync: (): Promise<StockKLineSyncLog> => {
    return apiClient.post('/stock/klines/sync/scheduled');
  },

  klineSyncLogs: (params?: { symbol?: string; status?: string; limit?: number }): Promise<StockKLineSyncLog[]> => {
    return apiClient.get('/stock/klines/sync-logs', {
      params
    });
  },

  klineSyncSummary: (params?: { symbol?: string; limit?: number }): Promise<StockKLineSyncSummary> => {
    return apiClient.get('/stock/klines/sync-summary', {
      params
    });
  },

  portfolioSummary: (): Promise<StockPortfolioSummary> => {
    return apiClient.get('/stock/portfolio/summary');
  },

  accounts: (): Promise<StockAccount[]> => {
    return apiClient.get('/stock/accounts');
  },

  positions: (accountId?: string): Promise<StockPosition[]> => {
    return apiClient.get('/stock/positions', {
      params: { accountId }
    });
  },

  recalculatePositions: (accountId?: string): Promise<StockPosition[]> => {
    return apiClient.post('/stock/positions/recalculate', undefined, {
      params: { accountId }
    });
  },

  recalculatePosition: (symbol: string, accountId?: string): Promise<StockPosition> => {
    return apiClient.post(`/stock/positions/${symbol}/recalculate`, undefined, {
      params: { accountId }
    });
  },

  trades: (params?: { accountId?: string; symbol?: string }): Promise<StockTrade[]> => {
    return apiClient.get('/stock/trades', { params });
  },

  saveTrade: (trade: StockTrade): Promise<StockTrade> => {
    return apiClient.post('/stock/trades', trade);
  },

  updateTrade: (id: string, trade: StockTrade): Promise<StockTrade> => {
    return apiClient.put(`/stock/trades/${id}`, trade);
  },

  deleteTrade: (id: string): Promise<void> => {
    return apiClient.delete(`/stock/trades/${id}`);
  },

  alertRules: (enabled?: boolean): Promise<StockAlertRule[]> => {
    return apiClient.get('/stock/alerts/rules', {
      params: { enabled }
    });
  },

  saveAlertRule: (rule: StockAlertRule): Promise<StockAlertRule> => {
    return apiClient.post('/stock/alerts/rules', rule);
  },

  updateAlertRule: (id: string, rule: StockAlertRule): Promise<StockAlertRule> => {
    return apiClient.put(`/stock/alerts/rules/${id}`, rule);
  },

  deleteAlertRule: (id: string): Promise<void> => {
    return apiClient.delete(`/stock/alerts/rules/${id}`);
  },

  alertHistory: (symbol?: string): Promise<StockAlertHistory[]> => {
    return apiClient.get('/stock/alerts/history', {
      params: { symbol }
    });
  },

  evaluateAlerts: (): Promise<StockAlertHistory[]> => {
    return apiClient.post('/stock/alerts/evaluate');
  },

  analysisSummary: (): Promise<StockAnalysisSummary> => {
    return apiClient.get('/stock/analysis/summary');
  },

  providerHealth: (): Promise<StockProviderHealth[]> => {
    return apiClient.get('/stock/providers/health');
  },

  providerConfig: (): Promise<StockProviderConfig> => {
    return apiClient.get('/stock/providers/config');
  },

  providerProbe: (params?: { category?: string; symbol?: string }): Promise<StockProviderProbeResult> => {
    return apiClient.get('/stock/providers/probe', { params });
  },

  providerProbeAll: (symbol?: string): Promise<StockProviderProbeResult[]> => {
    return apiClient.get('/stock/providers/probe/all', {
      params: { symbol }
    });
  },

  latestProviderProbe: (category?: string): Promise<StockProviderProbeResult | null> => {
    return apiClient.get('/stock/providers/probe/latest', {
      params: { category }
    });
  },

  preferences: (): Promise<StockPreference> => {
    return apiClient.get('/stock/preferences');
  },

  savePreferences: (preference: StockPreference): Promise<StockPreference> => {
    return apiClient.put('/stock/preferences', preference);
  }
};

// AI聊天相关API
export const aiApi = {
  // 调用统一AI聊天入口，model支持 local:xxx / deepseek:xxx
  chat: async (content: string, model: string = `local:${DEFAULT_LOCAL_AI_MODEL_KEYWORD}`, sessionId?: string): Promise<string> => {
    try {
      const url = sessionId ? `/chat/ai/completions/${sessionId}` : '/chat/ai/completions';
      const data = await apiClient.post(url, {
        prompt: content,
        model: model
      }) as ChatResponse;
      
      if (data && data.response) {
        return data.response;
      }
      return 'AI模型未返回有效响应';
    } catch (error) {
      console.error('AI聊天请求失败:', error);
      return 'AI模型请求失败，请稍后重试';
    }
  },
  
  // 通过我们的后端服务调用AI模型（备选方案）
  chatThroughBackend: async (content: string): Promise<string> => {
    try {
      const data = await apiClient.post('/chat/local/completions', {
        prompt: content
      }) as ChatResponse;
      return data.response;
    } catch (error) {
      console.error('后端AI聊天请求失败:', error);
      return '后端服务请求失败，请稍后重试';
    }
  },
  
  // 从后端缓存获取可调用模型列表；传 provider 时只获取该提供商模型
  getModelList: async (provider?: AiProvider): Promise<AiModel[]> => {
    try {
      const url = provider ? `/chat/ai/models/${provider}` : '/chat/ai/models';
      const data = await apiClient.get(url) as { models?: AiModel[] };
      return data.models || [];
    } catch (error) {
      console.error('获取模型列表失败:', error);
      return [];
    }
  },

  // 手动刷新模型列表，并由后端写入 Redis 缓存
  refreshModelList: async (provider?: AiProvider): Promise<AiModel[]> => {
    try {
      const url = provider ? `/chat/ai/models/${provider}/refresh` : '/chat/ai/models/refresh';
      const data = await apiClient.post(url) as { models?: AiModel[] };
      return data.models || [];
    } catch (error) {
      console.error('刷新模型列表失败:', error);
      return [];
    }
  },

  clearSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/chat/ai/sessions/${sessionId}`);
  }
};

export interface MiniGptRunRecord {
  id?: string;
  runName?: string;
  preset?: string;
  status?: string;
  startedAt?: string;
  finishedAt?: string;
  data?: string;
  evalData?: string;
  checkpoint?: string;
  parentRunName?: string;
  parentCheckpoint?: string;
  resumeStep?: number;
  trainStep?: number;
  logFile?: string;
  metadataFile?: string;
  device?: string;
  maxSteps?: number;
  batchSize?: number;
  learningRate?: number;
  valRatio?: number;
  validationEnabled?: boolean;
  trainTokens?: number;
  evalTokens?: number;
  samplePrompt?: string;
  sampleTokens?: number;
  finalTrainLoss?: number;
  finalEvalLoss?: number;
  lossGap?: number;
  fixedEvalLoss?: number;
  qualityGateMaxEvalLoss?: number;
  qualityGateMaxLossGap?: number;
  qualityGateStatus?: string;
  qualityGateReasons?: string;
  hypothesis?: string;
  observation?: string;
  conclusion?: string;
  nextStep?: string;
  config?: Record<string, unknown>;
  createdAt?: number;
  updatedAt?: number;
}

export interface MiniGptTrainingLogRecord {
  id?: string;
  runName?: string;
  step?: number;
  trainLoss?: number;
  evalLoss?: number;
  elapsedSeconds?: number;
  sample?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface MiniGptDashboard {
  latestRun?: MiniGptRunRecord;
  runs?: MiniGptRunRecord[];
  logs?: MiniGptTrainingLogRecord[];
  runCount?: number;
  logCount?: number;
  generatedAt?: number;
}

export interface MiniGptTrainingRequest {
  preset?: string;
  runName?: string;
  resumeFromRun?: string;
  resumeCheckpoint?: string;
  data?: string;
  evalData?: string;
  qualityGateMaxEvalLoss?: number;
  qualityGateMaxLossGap?: number;
  maxSteps?: number;
  batchSize?: number;
  learningRate?: number;
  blockSize?: number;
  nEmbd?: number;
  nHead?: number;
  nLayer?: number;
  valRatio?: number;
  samplePrompt?: string;
  sampleTokens?: number;
  temperature?: number;
  topK?: number;
}

export interface MiniGptTrainingStatus {
  running?: boolean;
  failed?: boolean;
  cancelled?: boolean;
  exitCode?: number;
  percent?: number;
  runName?: string;
  preset?: string;
  stage?: string;
  message?: string;
  processedStep?: number;
  totalSteps?: number;
  run?: MiniGptRunRecord;
  latestLog?: MiniGptTrainingLogRecord;
  startedAt?: number;
  updatedAt?: number;
}

export interface MiniGptEnvironmentCheck {
  playgroundDir?: string;
  pythonPath?: string;
  pythonAvailable?: boolean;
  pymongoAvailable?: boolean;
  pymongoVersion?: string;
  mongoAvailable?: boolean;
  mongoUri?: string;
  mongoDb?: string;
  status?: string;
  message?: string;
  checkedAt?: number;
}

export interface MiniGptLotteryCorpusExport {
  format?: string;
  dataPath?: string;
  filePath?: string;
  drawCount?: number;
  firstIssue?: string;
  latestIssue?: string;
  preview?: string;
  generatedAt?: number;
}

export interface MiniGptLotteryCandidateValidation {
  sourceText?: string;
  redNumbers?: string[];
  blueNumber?: string;
  redCount?: number;
  valid?: boolean;
  parseable?: boolean;
  redSum?: number;
  span?: number;
  oddCount?: number;
  evenCount?: number;
  duplicateCount?: number;
  redAscending?: boolean;
  status?: string;
  issues?: string[];
  repairedRedNumbers?: string[];
  repairedBlueNumber?: string;
}

export interface MiniGptTokenEntry {
  token?: string;
  tokenId?: number;
  codePoint?: number;
  display?: string;
}

export interface MiniGptCorpusInsight {
  data?: string;
  resolvedPath?: string;
  charCount?: number;
  lineCount?: number;
  vocabSize?: number;
  preview?: string;
  sampleText?: string;
  encodedSample?: number[];
  decodedSample?: string;
  tokens?: MiniGptTokenEntry[];
  generatedAt?: number;
}

export interface MiniGptRunNoteRequest {
  hypothesis?: string;
  observation?: string;
  conclusion?: string;
  nextStep?: string;
}

export interface MiniGptGenerationRequest {
  runName?: string;
  prompt?: string;
  maxNewTokens?: number;
  temperature?: number;
  topK?: number;
}

export interface MiniGptGenerationComparisonRequest {
  runName?: string;
  prompt?: string;
  maxNewTokens?: number;
  temperatures?: number[];
  topKs?: number[];
}

export interface MiniGptGenerationResult {
  runName?: string;
  prompt?: string;
  generatedText?: string;
  checkpoint?: string;
  maxNewTokens?: number;
  temperature?: number;
  topK?: number;
  exitCode?: number;
  elapsedMillis?: number;
  lotteryCandidate?: MiniGptLotteryCandidateValidation;
  generatedAt?: number;
}

export const miniGptApi = {
  dashboard: (params?: { runName?: string; runLimit?: number; logLimit?: number }): Promise<MiniGptDashboard> => {
    return apiClient.get('/ai/minigpt/dashboard', { params });
  },

  runs: (limit?: number): Promise<MiniGptRunRecord[]> => {
    return apiClient.get('/ai/minigpt/runs', { params: { limit } });
  },

  latestRun: (): Promise<MiniGptRunRecord> => {
    return apiClient.get('/ai/minigpt/runs/latest');
  },

  logs: (params?: { runName?: string; limit?: number }): Promise<MiniGptTrainingLogRecord[]> => {
    return apiClient.get('/ai/minigpt/logs', { params });
  },

  startTraining: (request: MiniGptTrainingRequest): Promise<MiniGptTrainingStatus> => {
    return apiClient.post('/ai/minigpt/training/start', request);
  },

  trainingStatus: (): Promise<MiniGptTrainingStatus> => {
    return apiClient.get('/ai/minigpt/training/status');
  },

  cancelTraining: (): Promise<MiniGptTrainingStatus> => {
    return apiClient.post('/ai/minigpt/training/cancel');
  },

  environment: (): Promise<MiniGptEnvironmentCheck> => {
    return apiClient.get('/ai/minigpt/environment');
  },

  exportLotteryCorpus: (params?: { format?: string; limit?: number }): Promise<MiniGptLotteryCorpusExport> => {
    return apiClient.post('/ai/minigpt/corpus/lottery/export', undefined, { params });
  },

  corpusInsight: (params?: { data?: string; sample?: string; tokenLimit?: number }): Promise<MiniGptCorpusInsight> => {
    return apiClient.get('/ai/minigpt/corpus', { params });
  },

  generate: (request: MiniGptGenerationRequest): Promise<MiniGptGenerationResult> => {
    return apiClient.post('/ai/minigpt/generate', request);
  },

  compareGeneration: (request: MiniGptGenerationComparisonRequest): Promise<MiniGptGenerationResult[]> => {
    return apiClient.post('/ai/minigpt/generate/compare', request);
  },

  validateLotteryCandidate: (text: string): Promise<MiniGptLotteryCandidateValidation> => {
    return apiClient.post('/ai/minigpt/lottery-candidate/validate', text);
  },

  updateRunNotes: (runName: string, request: MiniGptRunNoteRequest): Promise<MiniGptRunRecord> => {
    return apiClient.patch(`/ai/minigpt/runs/${encodeURIComponent(runName)}/notes`, request);
  }
};

export interface OpenAiTrainingLifecycleStage {
  key: string;
  icon?: string;
  title?: string;
  detail?: string;
}

export interface OpenAiTrainingEntityCard {
  key: string;
  label?: string;
  value?: string;
  accent?: string;
}

export interface OpenAiTrainingDataset {
  key: string;
  datasetId?: string;
  name?: string;
  purpose?: string;
  source?: string;
  fileId?: string;
  recordCount?: number;
  qualityStatus?: string;
}

export interface OpenAiTrainingJob {
  key: string;
  jobId?: string;
  baseModel?: string;
  dataset?: string;
  status?: string;
  trainLoss?: number;
  validLoss?: number;
  checkpoint?: string;
}

export interface OpenAiTrainingMetric {
  key: string;
  jobId?: string;
  step?: number;
  trainLoss?: number;
  validLoss?: number;
  validTokenAccuracy?: number;
  elapsedSeconds?: number;
}

export interface OpenAiTrainingCheckpoint {
  key: string;
  checkpointId?: string;
  providerCheckpointId?: string;
  jobId?: string;
  step?: number;
  validLoss?: number;
  validTokenAccuracy?: number;
  notes?: string;
}

export interface OpenAiTrainingEvalRun {
  key: string;
  model?: string;
  evalSet?: string;
  passRate?: number;
  score?: number;
  decision?: string;
}

export interface OpenAiTrainingEvalFailureCase {
  key: string;
  evalRunId?: string;
  category?: string;
  prompt?: string;
  expected?: string;
  observed?: string;
  nextAction?: string;
}

export interface OpenAiTrainingCostItem {
  key: string;
  scope?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedUsd?: number;
  note?: string;
}

export interface OpenAiTrainingAuditEvent {
  key: string;
  happenedAt?: string;
  actor?: string;
  action?: string;
  target?: string;
  note?: string;
}

export interface OpenAiTrainingDeploymentBinding {
  key: string;
  featureKey?: string;
  modelId?: string;
  promptVersion?: string;
  evalRunId?: string;
  rolloutStatus?: string;
  rollbackModelId?: string;
}

export interface OpenAiTrainingReadinessCheck {
  key: string;
  label?: string;
  status?: string;
  detail?: string;
}

export interface OpenAiTrainingNextAction {
  key: string;
  icon?: string;
  title?: string;
  detail?: string;
}

export interface OpenAiTrainingManagementDashboard {
  lifecycleStages?: OpenAiTrainingLifecycleStage[];
  entities?: OpenAiTrainingEntityCard[];
  datasets?: OpenAiTrainingDataset[];
  jobs?: OpenAiTrainingJob[];
  metrics?: OpenAiTrainingMetric[];
  checkpoints?: OpenAiTrainingCheckpoint[];
  evalRuns?: OpenAiTrainingEvalRun[];
  evalFailureCases?: OpenAiTrainingEvalFailureCase[];
  costItems?: OpenAiTrainingCostItem[];
  auditEvents?: OpenAiTrainingAuditEvent[];
  deploymentBindings?: OpenAiTrainingDeploymentBinding[];
  readinessChecks?: OpenAiTrainingReadinessCheck[];
  nextActions?: OpenAiTrainingNextAction[];
  generatedAt?: number;
}

export interface OpenAiTrainingReportRecord {
  id?: string;
  title?: string;
  content?: string;
  source?: string;
  dashboardGeneratedAt?: number;
  createdAt?: number;
}

export interface OpenAiTrainingReportRequest {
  title?: string;
  content?: string;
  source?: string;
  dashboardGeneratedAt?: number;
}

export const openAiTrainingApi = {
  dashboard: (): Promise<OpenAiTrainingManagementDashboard> => {
    return apiClient.get('/ai/training/dashboard');
  },

  reports: (limit?: number): Promise<OpenAiTrainingReportRecord[]> => {
    return apiClient.get('/ai/training/reports', {
      params: limit ? { limit } : undefined
    });
  },

  saveReport: (request: OpenAiTrainingReportRequest): Promise<OpenAiTrainingReportRecord> => {
    return apiClient.post('/ai/training/reports', request);
  }
};

export interface WechatArticleRequest {
  markdown?: string;
  postPath?: string;
  title?: string;
  author?: string;
  thumbMediaId?: string;
  coverPath?: string;
  contentSourceUrl?: string;
  needOpenComment?: number;
  onlyFansCanComment?: number;
  showCoverPic?: number;
  uploadImages?: boolean;
  publishAfterDraft?: boolean;
}

export interface WechatRenderedArticle {
  title?: string;
  author?: string;
  digest?: string;
  content?: string;
  contentSourceUrl?: string;
  thumbMediaId?: string;
  needOpenComment?: number;
  onlyFansCanComment?: number;
  showCoverPic?: number;
}

export interface WechatDraftResult {
  dryRun?: boolean;
  mediaId?: string;
  publishSubmitted?: boolean;
  publishResponse?: Record<string, unknown>;
  article?: WechatRenderedArticle;
}

export interface WechatTokenStatus {
  configured?: boolean;
  cached?: boolean;
  expiresAt?: number;
  updatedAt?: number;
}

export interface WechatArticleListRequest {
  offset?: number;
  count?: number;
  noContent?: number;
}

export interface WechatArticleListResponse {
  total_count?: number;
  item_count?: number;
  item?: Array<Record<string, unknown>>;
}

export const wechatOfficialAccountApi = {
  render: (request: WechatArticleRequest): Promise<WechatRenderedArticle> => (
    apiClient.post('/wechat/official-account/render', request)
  ),
  createDraft: (request: WechatArticleRequest): Promise<WechatDraftResult> => (
    apiClient.post('/wechat/official-account/drafts', request)
  ),
  listDrafts: (request: WechatArticleListRequest): Promise<WechatArticleListResponse> => (
    apiClient.post('/wechat/official-account/drafts/list', request)
  ),
  listPublishedArticles: (request: WechatArticleListRequest): Promise<WechatArticleListResponse> => (
    apiClient.post('/wechat/official-account/publications/list', request)
  ),
  submitPublish: (mediaId: string): Promise<Record<string, unknown>> => (
    apiClient.post('/wechat/official-account/publish', null, { params: { mediaId } })
  ),
  refreshAccessToken: (): Promise<string> => (
    apiClient.post('/wechat/official-account/token/refresh')
  ),
  tokenStatus: (): Promise<WechatTokenStatus> => (
    apiClient.get('/wechat/official-account/token/status')
  )
};

// 认证相关API
export const authApi = {
  // 登录
  login: async (account: string, password: string): Promise<AuthActionResult> => {
    try {
      const { data: response } = await axios.post<ApiResponse<AuthUserProfile>>('/auth/login', {
        username: account.trim(),
        password
      }, {
        withCredentials: true
      });
      
      if (isSuccessCode(response.code)) {
        return {
          success: true,
          user: response.data,
          message: response.message
        };
      } else {
        return {
          success: false,
          message: response.message || '登录失败'
        };
      }
    } catch (error: unknown) {
      return {
        success: false,
        message: getApiErrorMessage(error, '登录失败')
      };
    }
  },

  // 注册
  register: async (userData: { username: string; password: string; avatar?: string; email?: string; phone?: string }): Promise<{ success: boolean; message?: string }> => {
    try {
      const { data: response } = await axios.post<ApiResponse<string>>('/auth/register', userData, {
        withCredentials: true
      });
      
      if (isSuccessCode(response.code)) {
        return {
          success: true,
          message: response.message
        };
      } else {
        return {
          success: false,
          message: response.message || '注册失败'
        };
      }
    } catch (error: unknown) {
      return {
        success: false,
        message: getApiErrorMessage(error, '注册失败')
      };
    }
  },

  // 获取当前用户信息
  getCurrentUser: async (): Promise<AuthUserProfile> => {
    try {
      const { data: response } = await axios.get<ApiResponse<AuthUserProfile>>('/auth/me', {
        withCredentials: true
      });
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || '获取用户信息失败');
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, '获取用户信息失败'));
    }
  },

  // 更新当前用户资料
  updateCurrentUser: async (profile: UpdateUserProfileRequest): Promise<AuthUserProfile> => {
    try {
      const { data: response } = await axios.put<ApiResponse<AuthUserProfile>>('/auth/me', profile, {
        withCredentials: true
      });
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || '用户信息更新失败');
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, '用户信息更新失败'));
    }
  },

  // 更新当前用户密码
  updateCurrentPassword: async (passwordData: UpdatePasswordRequest): Promise<void> => {
    try {
      const { data: response } = await axios.put<ApiResponse<string>>('/auth/me/password', passwordData, {
        withCredentials: true
      });
      if (isSuccessCode(response.code)) {
        return;
      }
      throw new Error(response.message || '密码更新失败');
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, '密码更新失败'));
    }
  },

  // 登出
  logout: async (): Promise<void> => {
    try {
      await axios.post('/auth/logout', {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('登出失败:', error);
    }
  }
};

export const adminUserApi = {
  listUsers: async (params: { page: number; size: number }): Promise<AdminUserPageResponse> => {
    try {
      const { data: response } = await axios.get<ApiResponse<AdminUserPageResponse>>('/auth/admin/users', {
        params,
        withCredentials: true
      });
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || '用户列表获取失败');
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, '用户列表获取失败'));
    }
  },
  createUser: async (request: AdminCreateUserRequest): Promise<AdminUserSummary> => {
    try {
      const { data: response } = await axios.post<ApiResponse<AdminUserSummary>>('/auth/admin/users', request, {
        withCredentials: true
      });
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || '用户创建失败');
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, '用户创建失败'));
    }
  },
  disableUser: async (id: string): Promise<AdminUserSummary> => {
    try {
      const { data: response } = await axios.patch<ApiResponse<AdminUserSummary>>(`/auth/admin/users/${id}/disable`, null, {
        withCredentials: true
      });
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || '用户禁用失败');
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, '用户禁用失败'));
    }
  },
  enableUser: async (id: string): Promise<AdminUserSummary> => {
    try {
      const { data: response } = await axios.patch<ApiResponse<AdminUserSummary>>(`/auth/admin/users/${id}/enable`, null, {
        withCredentials: true
      });
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || '用户启用失败');
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, '用户启用失败'));
    }
  },
  updateUser: async (id: string, request: AdminUpdateUserRequest): Promise<AdminUserSummary> => {
    try {
      const { data: response } = await axios.put<ApiResponse<AdminUserSummary>>(`/auth/admin/users/${id}`, request, {
        withCredentials: true
      });
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || '用户资料更新失败');
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, '用户资料更新失败'));
    }
  },
  resetCredentials: async (id: string, request: AdminResetUserCredentialsRequest): Promise<AdminUserSummary> => {
    try {
      const { data: response } = await axios.put<ApiResponse<AdminUserSummary>>(`/auth/admin/users/${id}/credentials`, request, {
        withCredentials: true
      });
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || '密码重置失败');
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, '密码重置失败'));
    }
  },
  deleteDisabledUser: async (id: string): Promise<void> => {
    try {
      const { data: response } = await axios.delete<ApiResponse<string>>(`/auth/admin/users/${id}`, {
        withCredentials: true
      });
      if (isSuccessCode(response.code)) {
        return;
      }
      throw new Error(response.message || '用户删除失败');
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, '用户删除失败'));
    }
  }
};

// 充电记录相关API
export interface ChargeRecord {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  chargerType: string;
  chargeDuration: number;
  chargeAmount: number;
  electricityCost: number;
  serviceCost: number;
  discountAmount?: number;
  notes?: string;
  batteryCapacity?: number;
  provider?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface ChargeLocationOption {
  label: string;
  value: string;
  provider?: string;
}

export interface ChargeProviderOption {
  label: string;
  value: string;
}

export interface ChargeStation {
  id?: string;
  provider: string;
  location: string;
  stationCode: string;
  stationName?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface ChargeStatistics {
  totalCharges: number;
  totalEnergy: number;
  totalCost: number;
  totalElectricityCost: number;
  totalServiceCost: number;
  avgDuration: number;
}

export const chargeRecordApi = {
  // 添加充电记录
  save: (record: Omit<ChargeRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChargeRecord> => {
    return apiClient.post('/charge-record', record);
  },

  // 更新充电记录
  update: (record: ChargeRecord): Promise<ChargeRecord> => {
    return apiClient.put('/charge-record', record);
  },

  // 删除充电记录
  delete: (id: string): Promise<void> => {
    return apiClient.delete(`/charge-record/${id}`);
  },

  // 根据ID查询
  findById: (id: string): Promise<ChargeRecord> => {
    return apiClient.get(`/charge-record/${id}`);
  },

  // 查询所有记录
  findAll: (): Promise<ChargeRecord[]> => {
    return apiClient.get('/charge-record');
  },

  // 按日期范围查询
  findByDateRange: (startDate: string, endDate: string): Promise<ChargeRecord[]> => {
    return apiClient.get('/charge-record/date-range', {
      params: { startDate, endDate }
    });
  },

  // 按充电方式查询
  findByChargerType: (chargerType: string): Promise<ChargeRecord[]> => {
    return apiClient.get('/charge-record/charger-type', {
      params: { chargerType }
    });
  },

  // 按地点查询
  findByLocation: (location: string): Promise<ChargeRecord[]> => {
    return apiClient.get('/charge-record/location', {
      params: { location }
    });
  },

  // 获取统计数据
  getStatistics: (): Promise<ChargeStatistics> => {
    return apiClient.get('/charge-record/statistics');
  },
  
  // 获取充电地点列表
  getLocations: (): Promise<ChargeLocationOption[]> => {
    return apiClient.get('/charge-record/locations');
  },

  // 获取充电提供方列表
  getProviders: (): Promise<ChargeProviderOption[]> => {
    return apiClient.get('/charge-record/providers');
  }
};

export interface TeslaVehicle {
  id?: number;
  vehicle_id?: number;
  vin?: string;
  display_name?: string;
  state?: string;
  access_type?: string;
  in_service?: boolean;
  option_codes?: string;
  color?: string | null;
  tokens?: string[];
  calendar_enabled?: boolean;
  api_version?: number;
  backseat_token?: string | null;
  backseat_token_updated_at?: string | null;
}

export interface TeslaVehicleListResponse {
  response?: TeslaVehicle[];
  count?: number;
  [key: string]: unknown;
}

export interface TeslaFleetTokenRequest {
  code?: string;
  refreshToken?: string;
  scope?: string;
  redirectUri?: string;
}

export interface TeslaFleetTokenResponse {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
}

export interface TeslaFleetTokenStatus {
  accountKey: string;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  expiresAt?: number;
  updatedAt?: number;
  tokenType?: string;
  scope?: string;
}

export interface TeslaFleetTokenCache {
  token?: TeslaFleetTokenResponse;
  expiresAt?: number;
  updatedAt?: number;
}

export interface TeslaFleetVehicleCache {
  vehicles?: TeslaVehicleListResponse;
  updatedAt?: number;
}

export interface TeslaFleetChargingHistoryCache {
  chargingHistory?: Record<string, unknown>;
  updatedAt?: number;
}

export interface TeslaFleetApiCache {
  type?: string;
  key?: string;
  data?: Record<string, unknown>;
  updatedAt?: number;
}

export interface TeslaFleetTelemetryCache {
  vin?: string;
  recordType?: string;
  channel?: string;
  data?: Record<string, unknown>;
  updatedAt?: number;
}

export type ThirdPartyProvider = 'Tesla' | 'GitHub';

export interface ThirdPartyUserBinding {
  id?: string;
  provider: ThirdPartyProvider;
  thirdPartyUserId: string;
  localUserId?: string;
  localUsername?: string;
  username?: string;
  nickname?: string;
  avatarUrl?: string;
  email?: string;
  accountKey?: string;
  unionId?: string;
  rawProfile?: Record<string, unknown>;
  createdAt?: number;
  updatedAt?: number;
}

export interface GitHubOAuthBindRequest {
  code: string;
  state?: string;
  redirectUri?: string;
  localUserId?: string;
  localUsername?: string;
}

export const thirdPartyUserBindingApi = {
  saveOrUpdate: (binding: ThirdPartyUserBinding): Promise<ThirdPartyUserBinding> => {
    return apiClient.post('/third-party/user-binding', binding);
  },

  gitHubAuthorizeUrl: (params: {
    state?: string;
    scope?: string;
    redirectUri?: string;
  }): Promise<string> => {
    return apiClient.get('/third-party/user-binding/github/oauth/authorize-url', { params });
  },

  bindGitHubUser: (request: GitHubOAuthBindRequest): Promise<ThirdPartyUserBinding> => {
    return apiClient.post('/third-party/user-binding/github/oauth/bind', request);
  },

  findAll: (): Promise<ThirdPartyUserBinding[]> => {
    return apiClient.get('/third-party/user-binding');
  },

  findByProvider: (provider: ThirdPartyProvider): Promise<ThirdPartyUserBinding[]> => {
    return apiClient.get(`/third-party/user-binding/provider/${provider}`);
  },

  findByAccountKey: (accountKey: string): Promise<ThirdPartyUserBinding[]> => {
    return apiClient.get(`/third-party/user-binding/account/${accountKey}`);
  },

  findByLocalUserId: (localUserId: string): Promise<ThirdPartyUserBinding[]> => {
    return apiClient.get(`/third-party/user-binding/local-user/${localUserId}`);
  },

  delete: (id: string): Promise<void> => {
    return apiClient.delete(`/third-party/user-binding/${id}`);
  }
};

export const teslaFleetApi = {
  authorizeUrl: (params: {
    state?: string;
    nonce?: string;
    scope?: string;
    redirectUri?: string;
  }): Promise<string> => {
    return apiClient.get('/tesla/fleet/oauth/authorize-url', { params });
  },

  exchangeAuthorizationCode: (request: TeslaFleetTokenRequest): Promise<TeslaFleetTokenResponse> => {
    return apiClient.post('/tesla/fleet/oauth/token', request);
  },

  exchangeAuthorizationCodeAndStore: (
    accountKey: string,
    request: TeslaFleetTokenRequest
  ): Promise<TeslaFleetTokenResponse> => {
    return apiClient.post('/tesla/fleet/oauth/token/store', request, {
      params: accountKey ? { accountKey } : undefined
    });
  },

  saveToken: (
    accountKey: string,
    token: TeslaFleetTokenResponse
  ): Promise<TeslaFleetTokenResponse> => {
    return apiClient.post('/tesla/fleet/oauth/token/save', token, {
      params: accountKey ? { accountKey } : undefined
    });
  },

  refreshStoredToken: (accountKey: string): Promise<TeslaFleetTokenResponse> => {
    return apiClient.post('/tesla/fleet/oauth/refresh/store', null, {
      params: accountKey ? { accountKey } : undefined
    });
  },

  tokenStatus: (accountKey: string): Promise<TeslaFleetTokenStatus> => {
    return apiClient.get('/tesla/fleet/oauth/token/status', {
      params: accountKey ? { accountKey } : undefined
    });
  },

  getStoredToken: (accountKey: string): Promise<TeslaFleetTokenCache | null> => {
    return apiClient.get('/tesla/fleet/oauth/token/store', {
      params: accountKey ? { accountKey } : undefined
    });
  },

  partnerToken: (scope?: string): Promise<TeslaFleetTokenResponse> => {
    return apiClient.post('/tesla/fleet/partner/token', null, {
      params: scope ? { scope } : undefined
    });
  },

  registerPartnerAccount: (partnerToken: string, domain: string): Promise<Record<string, unknown>> => {
    const token = partnerToken.trim().replace(/^Bearer\s+/i, '');
    return apiClient.post('/tesla/fleet/partner/register', null, {
      params: { domain },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  getPartnerPublicKey: (partnerToken: string, domain: string): Promise<Record<string, unknown>> => {
    const token = partnerToken.trim().replace(/^Bearer\s+/i, '');
    return apiClient.get('/tesla/fleet/partner/public-key', {
      params: { domain },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  getCachedVehicles: (accountKey: string): Promise<TeslaFleetVehicleCache | null> => {
    return apiClient.get('/tesla/fleet/vehicles/cache', {
      params: accountKey ? { accountKey } : undefined
    });
  },

  refreshCachedVehicles: (accountKey: string): Promise<TeslaFleetVehicleCache> => {
    return apiClient.post('/tesla/fleet/vehicles/cache/refresh', null, {
      params: accountKey ? { accountKey } : undefined
    });
  },

  getCachedChargingHistory: (accountKey: string): Promise<TeslaFleetChargingHistoryCache | null> => {
    return apiClient.get('/tesla/fleet/charging/history/cache', {
      params: accountKey ? { accountKey } : undefined
    });
  },

  refreshCachedChargingHistory: (
    accountKey: string,
    params: Record<string, string>
  ): Promise<TeslaFleetChargingHistoryCache> => {
    return apiClient.post('/tesla/fleet/charging/history/cache/refresh', null, {
      params: {
        ...params,
        ...(accountKey ? { accountKey } : {})
      }
    });
  },

  refreshUserMeCache: (accountKey: string): Promise<TeslaFleetApiCache> => {
    return apiClient.post('/tesla/fleet/users/me/cache/refresh', null, {
      params: accountKey ? { accountKey } : undefined
    });
  },

  userMeWithStoredToken: (accountKey: string): Promise<Record<string, unknown>> => {
    return apiClient.post('/tesla/fleet/users/me', null, {
      params: accountKey ? { accountKey } : undefined
    });
  },

  refreshUserRegionCache: (accountKey: string): Promise<TeslaFleetApiCache> => {
    return apiClient.post('/tesla/fleet/users/region/cache/refresh', null, {
      params: accountKey ? { accountKey } : undefined
    });
  },

  getApiCache: (accountKey: string, type: string, key: string): Promise<TeslaFleetApiCache | null> => {
    return apiClient.get('/tesla/fleet/api/cache', {
      params: {
        type,
        key,
        ...(accountKey ? { accountKey } : {})
      }
    });
  },

  refreshVehicleCache: (accountKey: string, vin: string): Promise<TeslaFleetApiCache> => {
    return apiClient.post(`/tesla/fleet/vehicles/${vin}/cache/refresh`, null, {
      params: accountKey ? { accountKey } : undefined
    });
  },

  refreshVehicleDataCache: (accountKey: string, vin: string): Promise<TeslaFleetApiCache> => {
    return apiClient.post(`/tesla/fleet/vehicles/${vin}/vehicle-data/cache/refresh`, null, {
      params: accountKey ? { accountKey } : undefined
    });
  },

  refreshNearbyChargingSitesCache: (accountKey: string, vin: string): Promise<TeslaFleetApiCache> => {
    return apiClient.post(`/tesla/fleet/vehicles/${vin}/nearby-charging-sites/cache/refresh`, null, {
      params: accountKey ? { accountKey } : undefined
    });
  },

  refreshChargingInvoiceCache: (accountKey: string, invoiceId: string): Promise<TeslaFleetApiCache> => {
    return apiClient.post(`/tesla/fleet/charging/invoice/${invoiceId}/cache/refresh`, null, {
      params: accountKey ? { accountKey } : undefined
    });
  },

  vehicleCommand: (
    accountKey: string,
    vin: string,
    command: string,
    body: Record<string, unknown> = {}
  ): Promise<Record<string, unknown>> => {
    return apiClient.post(`/tesla/fleet/vehicles/${vin}/command/${command}`, body, {
      params: accountKey ? { accountKey } : undefined
    });
  },

  createFleetTelemetryConfig: (
    accountKey: string,
    body: Record<string, unknown>
  ): Promise<Record<string, unknown>> => {
    return apiClient.post('/tesla/fleet/telemetry/config', body, {
      params: accountKey ? { accountKey } : undefined
    });
  },

  getFleetTelemetryConfig: (accountKey: string, vin: string): Promise<Record<string, unknown>> => {
    return apiClient.get(`/tesla/fleet/vehicles/${vin}/telemetry/config`, {
      params: accountKey ? { accountKey } : undefined
    });
  },

  deleteFleetTelemetryConfig: (accountKey: string, vin: string): Promise<Record<string, unknown>> => {
    return apiClient.delete(`/tesla/fleet/vehicles/${vin}/telemetry/config`, {
      params: accountKey ? { accountKey } : undefined
    });
  },

  fleetTelemetryErrors: (accountKey: string, vin: string): Promise<Record<string, unknown>> => {
    return apiClient.get(`/tesla/fleet/vehicles/${vin}/telemetry/errors`, {
      params: accountKey ? { accountKey } : undefined
    });
  },

  getFleetTelemetryCache: (vin: string, recordType = 'V'): Promise<TeslaFleetTelemetryCache | null> => {
    return apiClient.get(`/tesla/fleet/vehicles/${vin}/telemetry/cache`, {
      params: { recordType }
    });
  },

  listVehicles: (accessToken: string): Promise<TeslaVehicleListResponse> => {
    const token = accessToken.trim().replace(/^Bearer\s+/i, '');
    return apiClient.get('/tesla/fleet/vehicles', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
};

export interface SalaryRecord {
  id?: string;
  year: number;
  month: number;
  monthlyIncome: number;
  standardDeduction: number;
  endowmentInsurance: number;
  medicalInsurance: number;
  unemploymentInsurance: number;
  housingFund: number;
  specialDeduction?: number;
  monthlyTaxableIncome?: number;
  cumulativeTaxableIncome?: number;
  cumulativeTaxPayable?: number;
  currentTaxDeclaration?: number;
  cumulativeTaxPaid?: number;
  actualIncome?: number;
  notes?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface SalaryStatistics {
  totalRecords: number;
  totalMonthlyIncome: number;
  totalActualIncome: number;
  totalTaxPaid: number;
  avgActualIncome: number;
}

export const salaryRecordApi = {
  save: (record: Omit<SalaryRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<SalaryRecord> => {
    return apiClient.post('/salary-record', record);
  },

  update: (record: SalaryRecord): Promise<SalaryRecord> => {
    return apiClient.put('/salary-record', record);
  },

  delete: (id: string): Promise<void> => {
    return apiClient.delete(`/salary-record/${id}`);
  },

  findById: (id: string): Promise<SalaryRecord> => {
    return apiClient.get(`/salary-record/${id}`);
  },

  findAll: (): Promise<SalaryRecord[]> => {
    return apiClient.get('/salary-record');
  },

  findByMonth: (month: string): Promise<SalaryRecord> => {
    return apiClient.get('/salary-record/month', {
      params: { month }
    });
  },

  findByMonthRange: (startMonth: string, endMonth: string): Promise<SalaryRecord[]> => {
    return apiClient.get('/salary-record/month-range', {
      params: { startMonth, endMonth }
    });
  },

  getStatistics: (): Promise<SalaryStatistics> => {
    return apiClient.get('/salary-record/statistics');
  }
};

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

export interface LotteryTrainingSummary {
  total: number;
  averageScore: number;
  bestScore: number;
  averageRedHits: number;
  blueHitRate: number;
  prizeDistribution: Record<string, number>;
  bestStrategy?: string;
  improvementTips: string[];
}

export interface LotteryTrainingResult {
  config: PredictionRuleConfig;
  summary: LotteryTrainingSummary;
  rankScore: number;
}

export interface LotteryLatestPrediction {
  title: string;
  redNumbers: string[];
  blueNumber: string;
  score: number;
  ruleId: string;
  ruleName: string;
  basedOnPeriod: number;
  targetPeriod: number;
  reason: string;
  actualRecord?: LotteryActualRecord;
  result?: LotteryPredictionResult;
  candidates: LotteryPredictionCandidate[];
}

export interface LotteryPredictionSnapshot extends LotteryLatestPrediction {
  id?: string;
  evidence?: LotteryRuleEvidence;
  replaySummary?: LotteryReplaySummary;
  createdAt?: number;
  updatedAt?: number;
}

export interface LotteryPredictionRuleRecord {
  id?: string;
  ruleId?: string;
  ruleName?: string;
  generation?: number;
  replayCount?: number;
  rankScore?: number;
  config?: PredictionRuleConfig;
  summary?: LotteryTrainingSummary;
  backtestSummary?: LotteryBacktestSummary;
  evidence?: LotteryRuleEvidence;
  replaySummary?: LotteryReplaySummary;
  learned?: boolean;
  createdAt?: number;
}

export interface LotteryStrategyExperiment {
  id?: string;
  strategyName?: string;
  scale?: string;
  replayWindow?: number;
  inputSource?: string;
  bestRule?: PredictionRuleConfig;
  outcomeSummary?: LotteryTrainingSummary;
  scoreDistribution: Record<string, number>;
  generatedCandidates: LotteryPredictionCandidate[];
  latestPrediction?: LotteryLatestPrediction;
  tags: string[];
  notes?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface LotteryBacktestReplayRow {
  issue?: string;
  drawDate?: string;
  predictedRedNumbers: string[];
  predictedBlueNumber?: string;
  actualRedNumbers: string[];
  actualBlueNumber?: string;
  redHits?: number;
  blueHit?: boolean;
  prizeName?: string;
  score?: number;
  cost?: number;
  prize?: number;
  netResult?: number;
}

export interface LotteryBacktestBankrollPoint {
  issue?: string;
  balance?: number;
}

export interface LotteryBacktestSummary {
  backtestId?: string;
  strategyName?: string;
  presetWindow?: string;
  issueStart?: string;
  issueEnd?: string;
  replayCount?: number;
  averageRedHits?: number;
  blueHitRate?: number;
  baselineAverageRedHits?: number;
  baselineBlueHitRate?: number;
  bestScore?: number;
  stabilityScore?: number;
  totalCost?: number;
  totalPrize?: number;
  netResult?: number;
  roiPercent?: number;
  prizeDistribution: Record<string, number>;
  baselinePrizeDistribution?: Record<string, number>;
  createdAt?: number;
}

export interface LotteryBacktestReport {
  id?: string;
  experimentId?: string;
  strategyName?: string;
  presetWindow?: string;
  requestedWindow?: number;
  issueStart?: string;
  issueEnd?: string;
  replayCount?: number;
  averageRedHits?: number;
  blueHitRate?: number;
  baselineAverageRedHits?: number;
  baselineBlueHitRate?: number;
  bestScore?: number;
  stabilityScore?: number;
  totalCost?: number;
  totalPrize?: number;
  netResult?: number;
  prizeDistribution: Record<string, number>;
  baselinePrizeDistribution?: Record<string, number>;
  rows: LotteryBacktestReplayRow[];
  bankrollSimulation: LotteryBacktestBankrollPoint[];
  createdAt?: number;
}

export interface LotteryStrategyPortfolioEvidenceLink {
  evidenceType?: string;
  sourceId?: string;
  title?: string;
  path?: string;
  allocationWeight?: number;
  note?: string;
  attachedAt?: number;
}

export interface LotteryStrategyPortfolio {
  id?: string;
  userId?: string;
  name?: string;
  description?: string;
  status?: string;
  allocationWeight?: number;
  evidence: LotteryStrategyPortfolioEvidenceLink[];
  tags: string[];
  archived?: boolean;
  archivedAt?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface LotteryStrategyPortfolioEvidenceSummary {
  evidenceType?: string;
  sourceId?: string;
  title?: string;
  path?: string;
  allocationWeight?: number;
  status?: string;
  roiPercent?: number;
  warningCount?: number;
  replayCount?: number;
  updatedAt?: number;
}

export interface LotteryStrategyPortfolioSummary {
  portfolio?: LotteryStrategyPortfolio;
  healthScore?: number;
  healthStatus?: string;
  roiPercent?: number;
  warningCount?: number;
  replayCount?: number;
  evidenceCoveragePercent?: number;
  ruleCount?: number;
  experimentCount?: number;
  backtestCount?: number;
  decisionCount?: number;
  noteCount?: number;
  allocationWeight?: number;
  evidence: LotteryStrategyPortfolioEvidenceSummary[];
  generatedAt?: number;
}

export interface LotterySimulationRequest {
  targetIssue?: string;
  budgetLimit?: number;
  replayWindow?: number;
  ruleWeights?: Record<string, number>;
  portfolioIds?: string[];
  candidateTickets?: Partial<LotteryTicket>[];
}

export interface LotterySimulationCandidate {
  key?: string;
  title?: string;
  redNumbers: string[];
  blueNumber: string;
  quantity?: number;
  cost?: number;
  score?: number;
  source?: string;
  warning?: string;
}

export interface LotterySimulationResult {
  targetIssue?: string;
  candidateCount?: number;
  proposedCost?: number;
  budgetLimit?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  roiReference?: number;
  replayWindow?: number;
  budgetPrecheck?: LotteryTicketBudgetPrecheckResult;
  candidates: LotterySimulationCandidate[];
  warnings: string[];
  hitDistribution: Record<string, number>;
  prizeDistribution: Record<string, number>;
  portfolios: LotteryStrategyPortfolioSummary[];
  generatedAt?: number;
}

export interface LotteryBacktestRunRequest {
  experimentId?: string;
  decisionSetId?: string;
  strategyName?: string;
  presetWindow?: string;
  window?: number;
  issueStart?: string;
  issueEnd?: string;
}

export interface LotteryExperimentRunRequest {
  strategyName?: string;
  replayWindow?: number;
  scale?: 'fast' | 'standard' | 'deep' | string;
  inputSource?: string;
  tags?: string[];
  notes?: string;
}

export interface LotteryExperimentUpdateRequest {
  tags?: string[];
  notes?: string;
}

export interface LotteryRuleComparison {
  rules: LotteryPredictionRuleRecord[];
  bestRuleId?: string;
  bestRuleName?: string;
  bestRankScore?: number;
  bestBacktestSummary?: LotteryBacktestSummary;
  bestEvidence?: LotteryRuleEvidence;
  replaySummary?: LotteryReplaySummary;
  generatedAt?: number;
}

export interface LotteryRuleEvidence {
  tag?: 'STABLE' | 'VOLATILE' | 'STALE' | 'UNDER_TESTED' | string;
  label?: string;
  message?: string;
  score?: number;
  reasons?: string[];
  generatedAt?: number;
}

export interface LotteryReplaySummary {
  ruleId?: string;
  ruleName?: string;
  ruleGeneration?: number;
  replayWindow?: number;
  baselineWindow?: number;
  candidateCount?: number;
  scoredCandidateCount?: number;
  recentAverageScore?: number;
  baselineAverageScore?: number;
  averageScoreDrift?: number;
  recentAverageRedHits?: number;
  baselineAverageRedHits?: number;
  averageRedHitsDrift?: number;
  recentBlueHitRate?: number;
  baselineBlueHitRate?: number;
  blueHitRateDrift?: number;
  bestScore?: number;
  driftLabel?: string;
  prizeDistribution: Record<string, number>;
  redHitDistribution: Record<string, number>;
  candidatePrizeDistribution: Record<string, number>;
  candidateRedHitDistribution: Record<string, number>;
  generatedAt?: number;
}

export interface LotteryReplayMetrics {
  requestedWindow?: number;
  actualWindow?: number;
  reportReplayCount?: number;
  generation?: number;
  averageScore?: number;
  averageRedHits?: number;
  blueHitRate?: number;
  bestScore?: number;
  prizeDistribution: Record<string, number>;
  evidence?: LotteryRuleEvidence;
  replaySummary?: LotteryReplaySummary;
  generatedAt?: number;
}

export interface LotteryPredictionCandidate {
  title: string;
  redNumbers: string[];
  blueNumber: string;
  score: number;
  result?: LotteryPredictionResult;
}

export interface LotteryActualRecord {
  period: number;
  redNumbers: string[];
  blueNumber: string;
}

export interface LotteryPredictionResult {
  redHits: number;
  blueHit: boolean;
  prizeName: string;
  score: number;
}

export interface LotteryPrizeResult {
  redHits?: number;
  blueHit?: boolean;
  prizeGrade?: string;
  prizeName?: string;
  prizeLevel?: number;
  prizeAmount?: number;
  winning?: boolean;
}

export interface LotteryTicket {
  id?: string;
  userId?: string;
  issue?: string;
  period?: number;
  redNumbers: string[];
  blueNumber: string;
  quantity?: number;
  cost?: number;
  source?: string;
  status?: string;
  prizeGrade?: string;
  prizeResult?: LotteryPrizeResult;
  predictionSnapshotId?: string;
  note?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface LotteryTicketPackItem {
  key?: string;
  title?: string;
  redNumbers: string[];
  blueNumber: string;
  quantity?: number;
  cost?: number;
  source?: string;
  predictionSnapshotId?: string;
  decisionSetId?: string;
  portfolioId?: string;
  note?: string;
  warnings?: string[];
}

export interface LotteryTicketPack {
  id?: string;
  userId?: string;
  title?: string;
  targetIssue?: string;
  sourceType?: 'MANUAL' | 'DECISION_SET' | 'SIMULATION' | 'PORTFOLIO' | string;
  sourceId?: string;
  status?: 'DRAFT' | 'APPROVED' | 'SAVED' | 'ARCHIVED' | string;
  approvalState?: 'PENDING' | 'APPROVED' | string;
  archived?: boolean;
  approvedAt?: number;
  savedAt?: number;
  archivedAt?: number;
  items: LotteryTicketPackItem[];
  budgetPrecheck?: LotteryTicketBudgetPrecheckResult;
  savedTicketIds?: string[];
  warnings?: string[];
  createdAt?: number;
  updatedAt?: number;
}

export interface LotteryOutcomePortfolioContribution {
  portfolioId?: string;
  name?: string;
  healthScore?: number;
  roiPercent?: number;
  warningCount?: number;
  linkedDecisionCount?: number;
  contributionState?: string;
}

export interface LotteryOutcomeDecisionContribution {
  decisionSetId?: string;
  title?: string;
  ruleName?: string;
  winningCandidateCount?: number;
  netResult?: number;
  roiPercent?: number;
  contributionState?: string;
}

export interface LotteryOutcomeTicketPackExecution {
  packId?: string;
  title?: string;
  status?: string;
  approvalState?: string;
  itemCount?: number;
  savedTicketCount?: number;
  proposedCost?: number;
  executionState?: string;
  sourcePack?: LotteryTicketPack;
}

export interface LotteryOutcomeSimulationDrift {
  auditId?: string;
  targetIssue?: string;
  riskLevel?: string;
  candidateCount?: number;
  actualWinningTicketCount?: number;
  driftState?: string;
  generatedAt?: number;
}

export interface LotteryOutcomeTimelineItem {
  type?: string;
  title?: string;
  path?: string;
  state?: string;
  timestamp?: number;
}

export interface LotteryOutcomeAttribution {
  issue?: string;
  ticketCount?: number;
  checkedTicketCount?: number;
  winningTicketCount?: number;
  totalCost?: number;
  totalPrize?: number;
  netResult?: number;
  roiPercent?: number;
  bestRedHits?: number;
  blueHitCount?: number;
  calibrationState?: string;
  prizeDistribution: Record<string, number>;
  portfolioContributions: LotteryOutcomePortfolioContribution[];
  decisionContributions: LotteryOutcomeDecisionContribution[];
  ticketPackExecutions: LotteryOutcomeTicketPackExecution[];
  simulationDrifts: LotteryOutcomeSimulationDrift[];
  timeline: LotteryOutcomeTimelineItem[];
  generatedAt?: number;
}

export interface LotteryOutcomeAttributionRollupRow {
  dimension?: string;
  key?: string;
  label?: string;
  issueCount?: number;
  sampleCount?: number;
  warningCount?: number;
  netResult?: number;
  roiPercent?: number;
  state?: string;
  evidenceQuality?: string;
  path?: string;
}

export interface LotteryOutcomeAttributionRollup {
  window?: string;
  requestedLimit?: number;
  issueCount?: number;
  ticketCount?: number;
  checkedTicketCount?: number;
  winningTicketCount?: number;
  totalCost?: number;
  totalPrize?: number;
  netResult?: number;
  roiPercent?: number;
  calibrationDistribution?: Record<string, number>;
  rows: LotteryOutcomeAttributionRollupRow[];
  generatedAt?: number;
}

export interface LotteryRecommendationStatusRequest {
  lifecycleStatus?: string;
  note?: string;
}

export interface LotteryRecommendation {
  id?: string;
  userId?: string;
  targetType?: string;
  targetId?: string;
  title?: string;
  recommendationState?: 'PROMOTE' | 'WATCH' | 'PAUSE' | 'RETIRE' | string;
  lifecycleStatus?: 'OPEN' | 'APPLIED' | 'SNOOZED' | 'ARCHIVED' | string;
  confidenceScore?: number;
  evidenceAgeHours?: number;
  expectedAction?: string;
  evidenceSummary?: string;
  path?: string;
  reasons?: string[];
  evidence?: LotteryStrategyNoteEvidence[];
  archived?: boolean;
  generatedAt?: number;
  archivedAt?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface LotteryRecommendationTransitionRow {
  day?: string;
  lifecycleStatus?: string;
  recommendationState?: string;
  count?: number;
}

export interface LotteryRecommendationRollup {
  window?: string;
  requestedLimit?: number;
  recommendationCount?: number;
  activeCount?: number;
  watchCount?: number;
  pausedCount?: number;
  retiredCount?: number;
  staleCount?: number;
  appliedCount?: number;
  recommendationStateDistribution?: Record<string, number>;
  lifecycleStatusDistribution?: Record<string, number>;
  targetTypeDistribution?: Record<string, number>;
  transitions?: LotteryRecommendationTransitionRow[];
  generatedAt?: number;
}

export interface LotteryTicketSummary {
  ticketCount?: number;
  checkedTicketCount?: number;
  pendingTicketCount?: number;
  winningTicketCount?: number;
  totalCost?: number;
  totalPrizeAmount?: number;
  statusDistribution: Record<string, number>;
  prizeDistribution: Record<string, number>;
  generatedAt?: number;
}

export interface LotteryTicketBatchSaveResult {
  requestedCount?: number;
  savedCount?: number;
  duplicateCount?: number;
  savedTickets: LotteryTicket[];
  duplicateTickets: LotteryTicket[];
  budgetPrecheck?: LotteryTicketBudgetPrecheckResult;
  generatedAt?: number;
}

export interface LotteryTicketPrizeCheckSummary {
  issue?: string;
  checkedTicketCount?: number;
  winningTicketCount?: number;
  totalPrizeAmount?: number;
  generatedAt?: number;
}

export interface LotteryTicketBudgetPrecheckIssueExposure {
  issue?: string;
  currentTicketCount?: number;
  proposedTicketCount?: number;
  projectedTicketCount?: number;
  proposedCost?: number;
}

export interface LotteryTicketBudgetPrecheckResult {
  requestedCount?: number;
  proposedTicketCount?: number;
  proposedCost?: number;
  weeklyBudget?: number;
  monthlyBudget?: number;
  maxTicketsPerIssue?: number;
  budgetReminderPercent?: number;
  weeklyCost?: number;
  monthlyCost?: number;
  projectedWeeklyCost?: number;
  projectedMonthlyCost?: number;
  weeklyUsagePercent?: number;
  monthlyUsagePercent?: number;
  status?: 'OK' | 'WARNING' | 'OVER' | string;
  issueExposures: LotteryTicketBudgetPrecheckIssueExposure[];
  warnings: LotteryBudgetWarning[];
  generatedAt?: number;
}

export interface LotteryTicketImportPreviewRow {
  key?: string;
  lineNumber?: number;
  raw?: string;
  issue?: string;
  redNumbers: string[];
  blueNumber?: string;
  status?: 'VALID' | 'INVALID' | 'DUPLICATE_EXISTING' | 'DUPLICATE_REQUEST' | string;
  messages: string[];
  duplicateGroupKey?: string;
  duplicateTicketId?: string;
  ticket?: Partial<LotteryTicket>;
}

export interface LotteryTicketImportPreviewResult {
  requestedCount?: number;
  validCount?: number;
  invalidCount?: number;
  duplicateExistingCount?: number;
  duplicateRequestCount?: number;
  rows: LotteryTicketImportPreviewRow[];
  budgetPrecheck?: LotteryTicketBudgetPrecheckResult;
  generatedAt?: number;
}

export interface LotteryTicketBulkPatchRequest {
  ids: string[];
  issue?: string;
  quantity?: number;
  cost?: number;
  status?: string;
  source?: string;
  note?: string;
  clearNote?: boolean;
}

export interface LotteryTicketBulkOperationResult {
  requestedCount?: number;
  updatedCount?: number;
  archivedCount?: number;
  deletedCount?: number;
  missingIds: string[];
  tickets: LotteryTicket[];
  generatedAt?: number;
}

export interface LotteryDecisionCandidateSelection {
  key?: string;
  snapshotId?: string;
  snapshotTitle?: string;
  candidateTitle?: string;
  source?: 'PRIMARY' | 'CANDIDATE' | string;
  targetPeriod?: number;
  ruleId?: string;
  ruleName?: string;
  redNumbers: string[];
  blueNumber?: string;
  score?: number;
  evidence?: LotteryRuleEvidence;
  replayText?: string;
  driftLabel?: string;
  resultLabel?: string;
  resultState?: 'PENDING' | 'WON' | 'MISSED' | string;
  redOverlap?: number;
  blueOverlap?: boolean;
  ticketCount?: number;
  ticketState?: string;
  warning?: string;
  convertedTicketIds?: string[];
}

export interface LotteryDecisionSet {
  id?: string;
  userId?: string;
  title?: string;
  targetIssue?: string;
  targetPeriod?: number;
  ruleName?: string;
  evidenceState?: string;
  resultState?: string;
  status?: string;
  conversionState?: string;
  note?: string;
  selectedCandidates: LotteryDecisionCandidateSelection[];
  archived?: boolean;
  archivedAt?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface LotteryDecisionPerformanceDelta {
  dimension?: string;
  key?: string;
  name?: string;
  decisionTicketCount?: number;
  benchmarkTicketCount?: number;
  decisionNetResult?: number;
  benchmarkNetResult?: number;
  netResultDelta?: number;
  decisionRoiPercent?: number;
  benchmarkRoiPercent?: number;
  roiPercentDelta?: number;
  decisionHitRatePercent?: number;
  benchmarkHitRatePercent?: number;
  hitRatePercentDelta?: number;
  backtestStabilityScore?: number;
  backtestAverageRedHits?: number;
  backtestBlueHitRate?: number;
}

export interface LotteryDecisionCandidateOutcome {
  decisionSetId?: string;
  decisionSetTitle?: string;
  candidateKey?: string;
  candidateTitle?: string;
  source?: string;
  snapshotId?: string;
  ruleName?: string;
  targetIssue?: string;
  redNumbers: string[];
  blueNumber?: string;
  evidenceTag?: string;
  driftLabel?: string;
  redHits?: number;
  blueHit?: boolean;
  prizeName?: string;
  resultState?: 'PENDING' | 'WON' | 'MISSED' | string;
  convertedTicketCount?: number;
  checkedTicketCount?: number;
  winningTicketCount?: number;
  totalCost?: number;
  totalPrize?: number;
  netResult?: number;
  warnings: string[];
}

export interface LotteryDecisionOutcomeItem {
  decisionSetId?: string;
  title?: string;
  targetIssue?: string;
  ruleName?: string;
  conversionState?: string;
  status?: string;
  candidateCount?: number;
  scoredCandidateCount?: number;
  winningCandidateCount?: number;
  convertedTicketCount?: number;
  checkedConvertedTicketCount?: number;
  winningConvertedTicketCount?: number;
  totalCost?: number;
  totalPrize?: number;
  netResult?: number;
  roiPercent?: number;
  hitRatePercent?: number;
  bestRedHits?: number;
  blueHitCount?: number;
  warningCount?: number;
  staleEvidenceCount?: number;
  volatileEvidenceCount?: number;
  underTestedEvidenceCount?: number;
  hitDistribution: Record<string, number>;
  prizeDistribution: Record<string, number>;
  evidenceAlerts: string[];
  ruleDelta?: LotteryDecisionPerformanceDelta;
  sourceDelta?: LotteryDecisionPerformanceDelta;
  candidates: LotteryDecisionCandidateOutcome[];
  createdAt?: number;
  updatedAt?: number;
}

export interface LotteryDecisionOutcomeSummary {
  savedDecisionSetCount?: number;
  candidateCount?: number;
  scoredCandidateCount?: number;
  winningCandidateCount?: number;
  convertedTicketCount?: number;
  checkedConvertedTicketCount?: number;
  winningConvertedTicketCount?: number;
  totalCost?: number;
  totalPrize?: number;
  netResult?: number;
  roiPercent?: number;
  hitRatePercent?: number;
  bestRedHits?: number;
  warningCount?: number;
  staleEvidenceCount?: number;
  volatileEvidenceCount?: number;
  underTestedEvidenceCount?: number;
  hitDistribution: Record<string, number>;
  prizeDistribution: Record<string, number>;
  items: LotteryDecisionOutcomeItem[];
  generatedAt?: number;
}

export interface LotteryStrategyNoteEvidence {
  evidenceKey?: string;
  evidenceType?: string;
  title?: string;
  sourceId?: string;
  path?: string;
  attachedAt?: number;
}

export interface LotteryStrategyNote {
  id?: string;
  userId?: string;
  title?: string;
  hypothesis?: string;
  expectedBehavior?: string;
  ruleName?: string;
  targetIssue?: string;
  status?: string;
  tags: string[];
  evidence: LotteryStrategyNoteEvidence[];
  archived?: boolean;
  archivedAt?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface LotteryPageResponse<T> {
  items: T[];
  page?: number;
  pageSize?: number;
  total?: number;
  hasNext?: boolean;
}

export interface LotteryLedgerSummary {
  ticketCount?: number;
  checkedTicketCount?: number;
  pendingTicketCount?: number;
  winningTicketCount?: number;
  totalCost?: number;
  totalPrize?: number;
  netResult?: number;
  roiPercent?: number;
  rollingThirtyDayCost?: number;
  rollingThirtyDayPrize?: number;
  rollingThirtyDayNetResult?: number;
  rollingThirtyDayRoiPercent?: number;
  maxDrawdown?: number;
  currentDrawdown?: number;
  generatedAt?: number;
}

export interface LotteryIssueLedger {
  issue?: string;
  period?: number;
  ticketCount?: number;
  checkedTicketCount?: number;
  pendingTicketCount?: number;
  winningTicketCount?: number;
  totalCost?: number;
  totalPrize?: number;
  netResult?: number;
  roiPercent?: number;
}

export interface LotteryBudgetWarning {
  key?: string;
  level?: string;
  message?: string;
  path?: string;
}

export interface LotteryBudgetStatus {
  weeklyBudget?: number;
  monthlyBudget?: number;
  maxTicketsPerIssue?: number;
  budgetReminderPercent?: number;
  weeklyCost?: number;
  monthlyCost?: number;
  maxIssueTicketCount?: number;
  maxIssue?: string;
  weeklyUsagePercent?: number;
  monthlyUsagePercent?: number;
  status?: string;
  warnings: LotteryBudgetWarning[];
  generatedAt?: number;
}

export interface LotteryMonthlyLedger {
  month?: string;
  ticketCount?: number;
  checkedTicketCount?: number;
  pendingTicketCount?: number;
  winningTicketCount?: number;
  totalCost?: number;
  totalPrize?: number;
  netResult?: number;
  roiPercent?: number;
}

export interface LotteryPerformanceLedger {
  dimension?: string;
  key?: string;
  name?: string;
  ticketCount?: number;
  checkedTicketCount?: number;
  pendingTicketCount?: number;
  winningTicketCount?: number;
  totalCost?: number;
  totalPrize?: number;
  netResult?: number;
  roiPercent?: number;
  hitRatePercent?: number;
  backtestSummary?: LotteryBacktestSummary;
}

export interface LotteryWorkbenchStepResult {
  step?: string;
  status?: string;
  message?: string;
  startedAt?: number;
  finishedAt?: number;
  savedCount?: number;
  checkedCount?: number;
  updatedCount?: number;
  error?: string;
}

export interface LotteryDailyStateItem {
  key?: string;
  label?: string;
  status?: 'COMPLETE' | 'PENDING' | 'WARNING' | string;
  message?: string;
  path?: string;
  pendingCount?: number;
  updatedAt?: number;
}

export interface LotteryDailyState {
  latestIssue?: string;
  nextIssue?: string;
  latestPredictionId?: string;
  syncState?: LotteryDailyStateItem;
  predictionState?: LotteryDailyStateItem;
  ticketState?: LotteryDailyStateItem;
  prizeCheckState?: LotteryDailyStateItem;
  qualityState?: LotteryDailyStateItem;
  pendingActions: string[];
  generatedAt?: number;
}

export interface LotteryWorkbenchSummary {
  dailyState?: LotteryDailyState;
  latestDraw?: LotteryDraw;
  latestSyncSummary?: LotteryRecordSyncSummary;
  dataQualitySummary?: LotteryDataQualityReport;
  latestPrediction?: LotteryPredictionSnapshot;
  trainingStatus?: LotteryTrainingStatus;
  pendingTicketCount?: number;
  latestPrizeCheckSummary?: LotteryTicketPrizeCheckSummary;
  ledgerSummary?: LotteryLedgerSummary;
  scheduledSyncRunbook?: LotteryScheduledSyncRunbook;
  operationSummary?: LotteryDailyOperationSummary;
  maintenanceSummary?: LotteryMaintenanceSummary;
  releaseCheckSummary?: LotteryReleaseCheckSummary;
  generatedAt?: number;
}

export interface LotteryScheduledSyncRunbook {
  enabled?: boolean;
  cron?: string;
  lastRunAt?: number;
  lastStatus?: string;
  lastDurationMs?: number;
  lastFailureCategory?: string;
  lastMessage?: string;
  lastSuccessAt?: number;
  lastFailureAt?: number;
  nextRunAt?: number;
  nextRunText?: string;
  healthStatus?: string;
  message?: string;
  generatedAt?: number;
}

export interface LotteryDailyOperationSummary {
  status?: string;
  completedCount?: number;
  warningCount?: number;
  pendingCount?: number;
  totalCount?: number;
  pendingActions: string[];
  qualityIssueCount?: number;
  pendingPrizeTicketCount?: number;
  activeReminderCount?: number;
  latestPredictionAttachmentCount?: number;
  lastSyncFinishedAt?: number;
  lastPrizeCheckAt?: number;
  message?: string;
  generatedAt?: number;
}

export interface LotteryReleaseCheckItem {
  key?: string;
  label?: string;
  status?: 'PASS' | 'WARNING' | 'MANUAL' | string;
  message?: string;
  path?: string;
  pendingCount?: number;
}

export interface LotteryReleaseCheckSummary {
  status?: string;
  passedCount?: number;
  warningCount?: number;
  totalCount?: number;
  checks: LotteryReleaseCheckItem[];
  message?: string;
  generatedAt?: number;
}

export interface LotteryWorkbenchDailyRunResult {
  steps: LotteryWorkbenchStepResult[];
  summary?: LotteryWorkbenchSummary;
  generatedAt?: number;
}

export interface LotteryCalendarReminder {
  key?: string;
  label?: string;
  status?: string;
  message?: string;
  path?: string;
  fingerprint?: string;
  dueAt?: number;
  acknowledged?: boolean;
}

export interface LotteryCalendarState {
  latestIssue?: string;
  nextIssue?: string;
  nextDrawDate?: string;
  drawWeekday?: string;
  expectedSyncStartAt?: number;
  expectedSyncEndAt?: number;
  currentIssueState?: string;
  reminders: LotteryCalendarReminder[];
  generatedAt?: number;
}

export interface LotteryReminderItem {
  key?: string;
  group?: string;
  title?: string;
  message?: string;
  status?: string;
  severity?: string;
  path?: string;
  fingerprint?: string;
  dueAt?: number;
  acknowledgedAt?: number;
  snoozedUntil?: number;
}

export interface LotteryReminderSummary {
  totalCount?: number;
  activeCount?: number;
  dueCount?: number;
  snoozedCount?: number;
  acknowledgedCount?: number;
  items: LotteryReminderItem[];
  generatedAt?: number;
}

export interface LotteryTrainingTimelineItem {
  period: number;
  predictedRedNumbers: string[];
  predictedBlueNumber: string;
  actualRedNumbers: string[];
  actualBlueNumber: string;
  redHits: number;
  blueHit: boolean;
  prizeName: string;
  score: number;
  strategy: string;
  beforeRuleName: string;
  afterRuleName: string;
  adjustment: string;
}

export interface LotteryTrainingReport {
  replayCount: number;
  generation: number;
  best?: LotteryTrainingResult;
  learnedRule?: PredictionRuleConfig;
  latestPrediction?: LotteryLatestPrediction;
  candidates: LotteryTrainingResult[];
  timeline: LotteryTrainingTimelineItem[];
}

export interface LotteryTrainingStatus {
  running: boolean;
  failed: boolean;
  cancelled?: boolean;
  percent: number;
  stage: string;
  processed: number;
  total: number;
  message: string;
  replayCount?: number;
  scale?: 'fast' | 'standard' | 'deep' | string;
  startedAt?: number;
  updatedAt?: number;
  report?: LotteryTrainingReport;
}

export const lotteryTrainingApi = {
  run: (params: { replayCount?: number; scale?: 'fast' | 'standard' | 'deep' }): Promise<LotteryTrainingReport> => {
    return apiClient.post('/lottery/training/run', params);
  },
  start: (params: { replayCount?: number; scale?: 'fast' | 'standard' | 'deep' }): Promise<LotteryTrainingStatus> => {
    return apiClient.post('/lottery/training/start', params);
  },
  status: (): Promise<LotteryTrainingStatus> => {
    return apiClient.get('/lottery/training/status');
  },
  cancel: (): Promise<LotteryTrainingStatus> => {
    return apiClient.post('/lottery/training/cancel');
  },
  retry: (): Promise<LotteryTrainingStatus> => {
    return apiClient.post('/lottery/training/retry');
  },
  best: (): Promise<PredictionRuleConfig> => {
    return apiClient.get('/lottery/training/best');
  },
  latestPrediction: (): Promise<LotteryLatestPrediction> => {
    return apiClient.get('/lottery/training/prediction/latest');
  },
  latestActualRecord: (): Promise<LotteryActualRecord> => {
    return apiClient.get('/lottery/training/actual/latest');
  },
  saveLatestActualRecord: (record: LotteryActualRecord): Promise<LotteryActualRecord> => {
    return apiClient.post('/lottery/training/actual/latest', record);
  }
};

export const lotteryPredictionApi = {
  history: (params?: { limit?: number }): Promise<LotteryPredictionSnapshot[]> => {
    return apiClient.get('/lottery/predictions', { params });
  },
  historyPage: (params?: {
    page?: number;
    pageSize?: number;
    resultState?: 'ALL' | 'PENDING' | 'WON' | 'MISSED' | string;
    targetPeriod?: number;
    ruleId?: string;
    ruleName?: string;
  }): Promise<LotteryPageResponse<LotteryPredictionSnapshot>> => {
    return apiClient.get('/lottery/predictions', { params });
  },
  detail: (id: string): Promise<LotteryPredictionSnapshot> => {
    return apiClient.get(`/lottery/predictions/${id}`);
  },
  attachActual: (id: string, record: LotteryActualRecord): Promise<LotteryPredictionSnapshot> => {
    return apiClient.post(`/lottery/predictions/${id}/actual`, record);
  },
  attachLatestActual: (): Promise<LotteryPredictionSnapshot[]> => {
    return apiClient.post('/lottery/predictions/attach-latest-actual');
  },
  rules: (params?: { limit?: number }): Promise<LotteryPredictionRuleRecord[]> => {
    return apiClient.get('/lottery/predictions/rules', { params });
  },
  compareRules: (params?: { limit?: number }): Promise<LotteryRuleComparison> => {
    return apiClient.get('/lottery/predictions/rules/compare', { params });
  },
  replayMetrics: (params?: { window?: number }): Promise<LotteryReplayMetrics> => {
    return apiClient.get('/lottery/predictions/replay-metrics', { params });
  },
  trainingStatus: (): Promise<LotteryTrainingStatus> => {
    return apiClient.get('/lottery/predictions/training/status');
  },
  cancelTraining: (): Promise<LotteryTrainingStatus> => {
    return apiClient.post('/lottery/predictions/training/cancel');
  },
  retryTraining: (): Promise<LotteryTrainingStatus> => {
    return apiClient.post('/lottery/predictions/training/retry');
  },
  train: (params: { replayCount?: number; scale?: 'fast' | 'standard' | 'deep' }): Promise<LotteryTrainingStatus> => {
    return apiClient.post('/lottery/predictions/train', params);
  }
};

export const lotteryExperimentApi = {
  run: (request: LotteryExperimentRunRequest): Promise<LotteryStrategyExperiment> => {
    return apiClient.post('/lottery/experiments/run', request);
  },
  experiments: (params?: {
    page?: number;
    pageSize?: number;
    strategyName?: string;
    tag?: string;
    createdStartAt?: number;
    createdEndAt?: number;
  }): Promise<LotteryPageResponse<LotteryStrategyExperiment>> => {
    return apiClient.get('/lottery/experiments', { params });
  },
  detail: (id: string): Promise<LotteryStrategyExperiment> => {
    return apiClient.get(`/lottery/experiments/${id}`);
  },
  updateNotes: (id: string, request: LotteryExperimentUpdateRequest): Promise<LotteryStrategyExperiment> => {
    return apiClient.patch(`/lottery/experiments/${id}`, request);
  }
};

export const lotteryBacktestApi = {
  run: (request: LotteryBacktestRunRequest): Promise<LotteryBacktestReport> => {
    return apiClient.post('/lottery/backtests/run', request);
  },
  reports: (params?: {
    page?: number;
    pageSize?: number;
    strategyName?: string;
    presetWindow?: string;
    createdStartAt?: number;
    createdEndAt?: number;
  }): Promise<LotteryPageResponse<LotteryBacktestReport>> => {
    return apiClient.get('/lottery/backtests', { params });
  },
  detail: (id: string): Promise<LotteryBacktestReport> => {
    return apiClient.get(`/lottery/backtests/${id}`);
  }
};

export const lotteryStrategyPortfolioApi = {
  portfolios: (params?: { includeArchived?: boolean; page?: number; pageSize?: number }): Promise<LotteryPageResponse<LotteryStrategyPortfolioSummary>> => {
    return apiClient.get('/lottery/strategy-portfolios', { params });
  },
  detail: (id: string): Promise<LotteryStrategyPortfolioSummary> => {
    return apiClient.get(`/lottery/strategy-portfolios/${id}`);
  },
  create: (portfolio: Partial<LotteryStrategyPortfolio>): Promise<LotteryStrategyPortfolioSummary> => {
    return apiClient.post('/lottery/strategy-portfolios', portfolio);
  },
  update: (id: string, portfolio: Partial<LotteryStrategyPortfolio>): Promise<LotteryStrategyPortfolioSummary> => {
    return apiClient.put(`/lottery/strategy-portfolios/${id}`, portfolio);
  },
  archive: (id: string): Promise<LotteryStrategyPortfolioSummary> => {
    return apiClient.patch(`/lottery/strategy-portfolios/${id}/archive`);
  }
};

export const lotterySimulationApi = {
  run: (request: LotterySimulationRequest): Promise<LotterySimulationResult> => {
    return apiClient.post('/lottery/simulations/run', request);
  }
};

export const lotteryTicketApi = {
  tickets: (params?: { issue?: string; status?: string; source?: string; prizeGrade?: string; predictionSnapshotId?: string }): Promise<LotteryTicket[]> => {
    return apiClient.get('/lottery/tickets', { params });
  },
  ticketsPage: (params?: {
    issue?: string;
    status?: string;
    source?: string;
    prizeGrade?: string;
    predictionSnapshotId?: string;
    createdStartAt?: number;
    createdEndAt?: number;
    page?: number;
    pageSize?: number;
  }): Promise<LotteryPageResponse<LotteryTicket>> => {
    return apiClient.get('/lottery/tickets', { params });
  },
  summary: (): Promise<LotteryTicketSummary> => {
    return apiClient.get('/lottery/tickets/summary');
  },
  saveTicket: (ticket: Partial<LotteryTicket>): Promise<LotteryTicket> => {
    return apiClient.post('/lottery/tickets', ticket);
  },
  importPreview: (request: {
    content?: string;
    defaultIssue?: string;
    defaultQuantity?: number;
    defaultCost?: number;
    defaultSource?: string;
    defaultStatus?: string;
    note?: string;
  }): Promise<LotteryTicketImportPreviewResult> => {
    return apiClient.post('/lottery/tickets/import/preview', request);
  },
  budgetPrecheck: (request: { tickets: Partial<LotteryTicket>[] }): Promise<LotteryTicketBudgetPrecheckResult> => {
    return apiClient.post('/lottery/tickets/budget/precheck', request);
  },
  saveTickets: (tickets: Partial<LotteryTicket>[]): Promise<LotteryTicketBatchSaveResult> => {
    return apiClient.post('/lottery/tickets/batch', { tickets });
  },
  updateTicket: (id: string, ticket: Partial<LotteryTicket>): Promise<LotteryTicket> => {
    return apiClient.put(`/lottery/tickets/${id}`, ticket);
  },
  bulkUpdateTickets: (request: LotteryTicketBulkPatchRequest): Promise<LotteryTicketBulkOperationResult> => {
    return apiClient.patch('/lottery/tickets/bulk', request);
  },
  archiveTickets: (ids: string[]): Promise<LotteryTicketBulkOperationResult> => {
    return apiClient.patch('/lottery/tickets/bulk/archive', { ids });
  },
  deleteTicket: (id: string): Promise<void> => {
    return apiClient.delete(`/lottery/tickets/${id}`);
  },
  deleteTickets: (ids: string[]): Promise<LotteryTicketBulkOperationResult> => {
    return apiClient.post('/lottery/tickets/bulk/delete', { ids });
  },
  checkPrizes: (actualRecord: LotteryActualRecord): Promise<LotteryTicket[]> => {
    return apiClient.post('/lottery/tickets/check-prizes', actualRecord);
  },
  checkLatestPrizes: (): Promise<LotteryTicketPrizeCheckSummary> => {
    return apiClient.post('/lottery/tickets/check-prizes/latest');
  }
};

export const lotteryTicketPackApi = {
  ticketPacks: (params?: { includeArchived?: boolean; page?: number; pageSize?: number }): Promise<LotteryPageResponse<LotteryTicketPack>> => {
    return apiClient.get('/lottery/ticket-packs', { params });
  },
  preview: (ticketPack: Partial<LotteryTicketPack>): Promise<LotteryTicketPack> => {
    return apiClient.post('/lottery/ticket-packs/preview', ticketPack);
  },
  create: (ticketPack: Partial<LotteryTicketPack>): Promise<LotteryTicketPack> => {
    return apiClient.post('/lottery/ticket-packs', ticketPack);
  },
  approve: (id: string): Promise<LotteryTicketPack> => {
    return apiClient.patch(`/lottery/ticket-packs/${id}/approve`);
  },
  saveAsTickets: (id: string): Promise<LotteryTicketPack> => {
    return apiClient.post(`/lottery/ticket-packs/${id}/save-tickets`);
  },
  archive: (id: string): Promise<LotteryTicketPack> => {
    return apiClient.patch(`/lottery/ticket-packs/${id}/archive`);
  }
};

export const lotteryOutcomeApi = {
  recent: (params?: { limit?: number }): Promise<LotteryOutcomeAttribution[]> => {
    return apiClient.get('/lottery/outcomes', { params });
  },
  rollup: (params?: { window?: string; limit?: number }): Promise<LotteryOutcomeAttributionRollup> => {
    return apiClient.get('/lottery/outcomes/rollup', { params });
  },
  issue: (issue: string): Promise<LotteryOutcomeAttribution> => {
    return apiClient.get(`/lottery/outcomes/${issue}`);
  }
};

export const lotteryRecommendationApi = {
  recommendations: (params?: { recommendationState?: string; page?: number; pageSize?: number }): Promise<LotteryPageResponse<LotteryRecommendation>> => {
    return apiClient.get('/lottery/recommendations', { params });
  },
  detail: (id: string): Promise<LotteryRecommendation> => {
    return apiClient.get(`/lottery/recommendations/${id}`);
  },
  rollup: (params?: { window?: string; limit?: number }): Promise<LotteryRecommendationRollup> => {
    return apiClient.get('/lottery/recommendations/rollup', { params });
  },
  refresh: (params?: { limit?: number }): Promise<LotteryPageResponse<LotteryRecommendation>> => {
    return apiClient.post('/lottery/recommendations/refresh', undefined, { params });
  },
  updateStatus: (id: string, request: LotteryRecommendationStatusRequest): Promise<LotteryRecommendation> => {
    return apiClient.patch(`/lottery/recommendations/${id}/status`, request);
  }
};

export const lotteryDecisionSetApi = {
  decisionSets: (params?: { includeArchived?: boolean; page?: number; pageSize?: number }): Promise<LotteryPageResponse<LotteryDecisionSet>> => {
    return apiClient.get('/lottery/decision-sets', { params });
  },
  outcomes: (params?: { includeArchived?: boolean; limit?: number }): Promise<LotteryDecisionOutcomeSummary> => {
    return apiClient.get('/lottery/decision-sets/outcomes', { params });
  },
  createDecisionSet: (decisionSet: Partial<LotteryDecisionSet>): Promise<LotteryDecisionSet> => {
    return apiClient.post('/lottery/decision-sets', decisionSet);
  },
  updateDecisionSet: (id: string, decisionSet: Partial<LotteryDecisionSet>): Promise<LotteryDecisionSet> => {
    return apiClient.put(`/lottery/decision-sets/${id}`, decisionSet);
  },
  archiveDecisionSet: (id: string): Promise<LotteryDecisionSet> => {
    return apiClient.patch(`/lottery/decision-sets/${id}/archive`);
  }
};

export const lotteryStrategyNoteApi = {
  notes: (params?: { includeArchived?: boolean; status?: string; page?: number; pageSize?: number }): Promise<LotteryPageResponse<LotteryStrategyNote>> => {
    return apiClient.get('/lottery/strategy-notes', { params });
  },
  create: (note: Partial<LotteryStrategyNote>): Promise<LotteryStrategyNote> => {
    return apiClient.post('/lottery/strategy-notes', note);
  },
  update: (id: string, note: Partial<LotteryStrategyNote>): Promise<LotteryStrategyNote> => {
    return apiClient.put(`/lottery/strategy-notes/${id}`, note);
  },
  archive: (id: string): Promise<LotteryStrategyNote> => {
    return apiClient.patch(`/lottery/strategy-notes/${id}/archive`);
  },
  attachEvidence: (id: string, evidence: LotteryStrategyNoteEvidence): Promise<LotteryStrategyNote> => {
    return apiClient.post(`/lottery/strategy-notes/${id}/evidence`, { evidence });
  }
};

export const lotteryLedgerApi = {
  summary: (): Promise<LotteryLedgerSummary> => {
    return apiClient.get('/lottery/ledger/summary');
  },
  issues: (): Promise<LotteryIssueLedger[]> => {
    return apiClient.get('/lottery/ledger/issues');
  },
  months: (): Promise<LotteryMonthlyLedger[]> => {
    return apiClient.get('/lottery/ledger/months');
  },
  performance: (params?: { dimension?: 'source' | 'rule' }): Promise<LotteryPerformanceLedger[]> => {
    return apiClient.get('/lottery/ledger/performance', { params });
  }
};

export const lotteryBudgetApi = {
  status: (): Promise<LotteryBudgetStatus> => {
    return apiClient.get('/lottery/budget/status');
  }
};

export const lotteryExportApi = {
  export: (type: string, params?: Record<string, string | number | undefined>): Promise<LotteryExportResult> => {
    return apiClient.get(`/lottery/exports/${type}`, { params });
  },
  auditEvents: (params?: { page?: number; pageSize?: number }): Promise<LotteryPageResponse<LotteryAuditEvent>> => {
    return apiClient.get('/lottery/audit/events', { params });
  },
  maintenanceSummary: (): Promise<LotteryMaintenanceSummary> => {
    return apiClient.get('/lottery/maintenance/summary');
  },
  cleanupDryRun: (): Promise<LotteryMaintenanceSummary> => {
    return apiClient.post('/lottery/maintenance/cleanup/dry-run');
  }
};

export const lotteryWorkbenchApi = {
  summary: (): Promise<LotteryWorkbenchSummary> => {
    return apiClient.get('/lottery/workbench/summary');
  },
  dailyState: (): Promise<LotteryDailyState> => {
    return apiClient.get('/lottery/workbench/daily-state');
  },
  dailyRun: (): Promise<LotteryWorkbenchDailyRunResult> => {
    return apiClient.post('/lottery/workbench/daily-run');
  }
};

export const lotteryOperationsApi = {
  health: (): Promise<LotteryOperationsHealthSummary> => {
    return apiClient.get('/lottery/operations/health');
  },
  acknowledgeHealth: (request?: { contributorKey?: string; note?: string }): Promise<LotteryOperationsHealthSummary> => {
    return apiClient.post('/lottery/operations/health/acknowledge', request || {});
  }
};

export const lotteryCalendarApi = {
  calendar: (): Promise<LotteryCalendarState> => {
    return apiClient.get('/lottery/calendar');
  },
  acknowledge: (key: string, fingerprint: string): Promise<LotteryCalendarState> => {
    return apiClient.post(`/lottery/alerts/${key}/ack`, { fingerprint });
  }
};

export const lotteryReminderApi = {
  summary: (): Promise<LotteryReminderSummary> => {
    return apiClient.get('/lottery/reminders/summary');
  },
  acknowledge: (key: string, fingerprint: string, note?: string): Promise<LotteryReminderSummary> => {
    return apiClient.post(`/lottery/reminders/${key}/ack`, { fingerprint, note });
  },
  snooze: (key: string, fingerprint: string, snoozeMinutes?: number): Promise<LotteryReminderSummary> => {
    return apiClient.post(`/lottery/reminders/${key}/snooze`, { fingerprint, snoozeMinutes });
  }
};

export interface LotteryAstronaut {
  id?: string;
  camp: 'RED' | 'BLUE';
  number: string;
  name: string;
  gender?: string;
  source?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface LotteryAstronautVoyageRecord {
  id: string;
  period: number;
  raw: string;
  redNumbers: string[];
  blueNumber: string;
  planetName: string;
  redSum: number;
  oddCount: number;
  evenCount: number;
  hexagramName: string;
}

export interface LotteryAstronautVoyage {
  astronaut?: LotteryAstronaut;
  records: LotteryAstronautVoyageRecord[];
}

export interface LotteryAstronautVoyageStatMember {
  number: string;
  count: number;
}

export interface LotteryAstronautVoyageStat {
  camp: 'RED' | 'BLUE';
  totalRecords: number;
  members: LotteryAstronautVoyageStatMember[];
}

export const lotteryAstronautApi = {
  findAll: (): Promise<LotteryAstronaut[]> => {
    return apiClient.get('/lottery/astronauts');
  },
  getVoyageStats: (): Promise<LotteryAstronautVoyageStat[]> => {
    return apiClient.get('/lottery/astronauts/voyage-counts');
  },
  calculateVoyageStats: (): Promise<LotteryAstronautVoyageStat[]> => {
    return apiClient.post('/lottery/astronauts/voyage-counts/statistics');
  },
  findByCamp: (camp: 'RED' | 'BLUE'): Promise<LotteryAstronaut[]> => {
    return apiClient.get(`/lottery/astronauts/${camp}`);
  },
  voyage: (camp: 'RED' | 'BLUE', number: string): Promise<LotteryAstronautVoyage> => {
    return apiClient.get(`/lottery/astronauts/${camp}/${number}/voyage`);
  },
  update: (astronaut: LotteryAstronaut): Promise<LotteryAstronaut> => {
    return apiClient.put('/lottery/astronauts', astronaut);
  },
  saveAll: (astronauts: LotteryAstronaut[]): Promise<LotteryAstronaut[]> => {
    return apiClient.post('/lottery/astronauts/batch', astronauts);
  },
  resetDefaults: (): Promise<LotteryAstronaut[]> => {
    return apiClient.post('/lottery/astronauts/reset');
  }
};

// 充电站管理API
export const chargeStationApi = {
  // 添加充电站
  save: (station: Omit<ChargeStation, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChargeStation> => {
    return apiClient.post('/charge-station', station);
  },

  // 更新充电站
  update: (station: ChargeStation): Promise<ChargeStation> => {
    return apiClient.put('/charge-station', station);
  },

  // 删除充电站
  delete: (id: string): Promise<void> => {
    return apiClient.delete(`/charge-station/${id}`);
  },

  // 根据ID查询
  findById: (id: string): Promise<ChargeStation> => {
    return apiClient.get(`/charge-station/${id}`);
  },

  // 查询所有充电站
  findAll: (): Promise<ChargeStation[]> => {
    return apiClient.get('/charge-station');
  },

  // 按充电提供方查询
  findByProvider: (provider: string): Promise<ChargeStation[]> => {
    return apiClient.get(`/charge-station/provider/${provider}`);
  },

  // 按地点查询
  findByLocation: (location: string): Promise<ChargeStation[]> => {
    return apiClient.get(`/charge-station/location/${location}`);
  },

  // 按提供方和地点查询
  findByProviderAndLocation: (provider: string, location: string): Promise<ChargeStation[]> => {
    return apiClient.get('/charge-station/search', {
      params: { provider, location }
    });
  },

  // 根据站点编码查询
  findByStationCode: (stationCode: string): Promise<ChargeStation> => {
    return apiClient.get(`/charge-station/code/${stationCode}`);
  }
};

// 导出axios实例，方便其他地方使用
export default apiClient;
