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
  startedAt?: number;
  finishedAt?: number;
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
  if (axios.isAxiosError<{ message?: string; error?: string }>(error)) {
    return error.response?.data?.message || error.response?.data?.error || error.message || fallback;
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
  percent: number;
  stage: string;
  processed: number;
  total: number;
  message: string;
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
