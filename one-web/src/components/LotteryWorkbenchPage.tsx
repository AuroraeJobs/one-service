import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, Button, Card, Empty, Progress, Space, Spin, Steps, Tag, Tooltip, message } from 'antd';
import {
  BarChartOutlined,
  BellOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  DownOutlined,
  DownloadOutlined,
  ExperimentOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  FileTextOutlined,
  HistoryOutlined,
  PieChartOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  UpOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import LotteryBalls from './lottery/LotteryBalls';
import {
  lotteryBacktestApi,
  lotteryBudgetApi,
  lotteryCalendarApi,
  lotteryDecisionSetApi,
  lotteryExperimentApi,
  lotteryExportApi,
  lotteryOperationsApi,
  lotteryPreferenceApi,
  lotteryPredictionApi,
  lotteryReminderApi,
  lotteryStrategyNoteApi,
  lotteryTicketApi,
  lotteryWorkbenchApi,
  type LotteryAuditEvent,
  type LotteryBacktestReport,
  type LotteryBudgetStatus,
  type LotteryCalendarState,
  type LotteryDailyStateItem,
  type LotteryDecisionOutcomeItem,
  type LotteryDecisionOutcomeSummary,
  type LotteryOperationsHealthSummary,
  type LotteryPreference,
  type LotteryPredictionSnapshot,
  type LotteryReminderSummary,
  type LotteryStrategyNote,
  type LotteryStrategyExperiment,
  type LotteryTicket,
  type LotteryWorkbenchDailyRunResult,
  type LotteryWorkbenchStepResult,
  type LotteryWorkbenchSummary
} from '../services/api';
import { getLotterySavedViewPath, lotteryViewStateKeys } from '../utils/lotteryViewState';
import { lotteryCodeLabel, lotteryMessageLabel, lotteryStatusLabel } from '../utils/lotteryStatusLabel';
import './LotteryOverviewPage.css';

interface LotteryWorkbenchRecentWork {
  predictions: LotteryPredictionSnapshot[];
  tickets: LotteryTicket[];
  experiments: LotteryStrategyExperiment[];
  backtests: LotteryBacktestReport[];
  exports: LotteryAuditEvent[];
  decisionOutcomes?: LotteryDecisionOutcomeSummary;
}

interface LotteryRecentWorkLink {
  key: string;
  title: string;
  detail: string;
  path: string;
  actions?: Array<{
    label: string;
    path: string;
  }>;
}

type WorkbenchWidgetKey =
  | 'status'
  | 'closure'
  | 'priority'
  | 'health'
  | 'reminders'
  | 'issueFocus'
  | 'actionQueue'
  | 'calendar'
  | 'runbook'
  | 'quickActions'
  | 'predictionTraining'
  | 'dailyRunRelease'
  | 'recentWork';

interface WorkbenchWidgetSetting {
  key: WorkbenchWidgetKey;
  visible: boolean;
}

interface WorkbenchWidgetMeta {
  key: WorkbenchWidgetKey;
  label: string;
  description: string;
}

type WorkbenchPreferenceSyncState = 'LOCAL' | 'LOADING' | 'SAVING' | 'SYNCED';

interface WorkbenchFocusItem {
  key: string;
  icon: ReactNode;
  label: string;
  value: ReactNode;
  detail: string;
  path: string;
  status?: string;
}

interface WorkbenchIssueNextItem {
  key: string;
  icon: ReactNode;
  title: string;
  detail: string;
  status?: string;
  count?: number;
  path: string;
  actionLabel: string;
}

const workbenchIssueHandoffPaths = {
  mobile: '/lottery/mobile',
  governance: '/lottery/governance',
  ticketPacks: '/lottery/ticket-packs',
  recommendations: '/lottery/recommendations',
  exports: '/lottery/exports',
  monthEnd: '/lottery/month-end'
} as const;

const buildWorkbenchPath = (base: string, params: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  });
  const serialized = query.toString();
  return serialized ? `${base}?${serialized}` : base;
};

interface WorkbenchActionQueueItem {
  key: string;
  group: string;
  title: string;
  detail: string;
  status?: string;
  count?: number;
  path?: string;
}

interface WorkbenchPriorityItem {
  key: string;
  icon: ReactNode;
  title: string;
  detail: string;
  status?: string;
  count?: number;
  path?: string;
  actionLabel: string;
}

interface WorkbenchRecentShortcut {
  key: string;
  icon: ReactNode;
  label: string;
  title: string;
  detail: string;
  path: string;
}

interface WorkbenchClosureStep {
  key: string;
  icon: ReactNode;
  label: string;
  title: string;
  detail: string;
  status?: string;
  count?: number;
  path: string;
  actionLabel: string;
}

interface WorkbenchReviewRunbookItem {
  key: string;
  title: string;
  detail: string;
  status?: string;
  evidence: string[];
  path: string;
  actionLabel: string;
  acknowledgeTarget?: {
    type: 'reminder' | 'health';
    label: string;
    key?: string;
    fingerprint?: string;
    contributorKey?: string;
  };
}

const workbenchWidgetStorageKey = 'one:lottery:workbench:widgets:v1';

const workbenchWidgetMeta: WorkbenchWidgetMeta[] = [
  { key: 'status', label: '状态总览', description: '开奖、同步、质量、票据、账本和发布检查' },
  { key: 'closure', label: '本期闭环', description: '同步、预测、票包、核验、账本和报告的本期主路径' },
  { key: 'priority', label: '今日优先', description: '到期提醒、待办、健康告警和待核验事项' },
  { key: 'health', label: '运营健康', description: 'Provider、同步、质量、票据、决策和导出健康评分' },
  { key: 'reminders', label: '提醒中心', description: '每日行动提醒、到期、稍后和确认状态' },
  { key: 'issueFocus', label: '期号焦点', description: '当前期、下一期、预测、票据、核验和账本结果' },
  { key: 'actionQueue', label: '行动队列', description: '同步、质量、预测回填、核验和发布待办' },
  { key: 'calendar', label: '开奖日历', description: '开奖日、同步窗口和提醒数量' },
  { key: 'runbook', label: '运维摘要', description: '日常运维摘要和定时同步 runbook' },
  { key: 'quickActions', label: '快捷动作', description: '同步、预测、录票、核验、账本、提醒和导出' },
  { key: 'predictionTraining', label: '预测训练', description: '最近预测和训练进度' },
  { key: 'dailyRunRelease', label: '执行发布', description: '日常执行结果和发布检查' },
  { key: 'recentWork', label: '最近工作', description: '最近预测、票据、研究、导出和维护入口' }
];

const workbenchWidgetMetaMap = new Map(workbenchWidgetMeta.map(item => [item.key, item]));

const defaultWorkbenchWidgetSettings = () =>
  workbenchWidgetMeta.map(item => ({ key: item.key, visible: true }));

const canUseWorkbenchStorage = () => {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  } catch {
    return false;
  }
};

const normalizeWorkbenchWidgetSettings = (settings?: Partial<WorkbenchWidgetSetting>[]) => {
  const knownKeys = new Set(workbenchWidgetMeta.map(item => item.key));
  const normalized: WorkbenchWidgetSetting[] = [];
  (settings || []).forEach(item => {
    if (item.key && knownKeys.has(item.key) && !normalized.some(existing => existing.key === item.key)) {
      normalized.push({
        key: item.key,
        visible: item.visible !== false
      });
    }
  });
  workbenchWidgetMeta.forEach(item => {
    if (!normalized.some(existing => existing.key === item.key)) {
      normalized.push({ key: item.key, visible: true });
    }
  });
  return normalized;
};

const readWorkbenchWidgetSettings = () => {
  if (!canUseWorkbenchStorage()) {
    return defaultWorkbenchWidgetSettings();
  }
  try {
    const raw = window.localStorage.getItem(workbenchWidgetStorageKey);
    if (!raw) {
      return defaultWorkbenchWidgetSettings();
    }
    const parsed = JSON.parse(raw) as { widgets?: Partial<WorkbenchWidgetSetting>[] };
    return normalizeWorkbenchWidgetSettings(parsed.widgets);
  } catch {
    window.localStorage.removeItem(workbenchWidgetStorageKey);
    return defaultWorkbenchWidgetSettings();
  }
};

const writeWorkbenchWidgetSettings = (settings: WorkbenchWidgetSetting[]) => {
  if (!canUseWorkbenchStorage()) {
    return;
  }
  window.localStorage.setItem(workbenchWidgetStorageKey, JSON.stringify({
    version: 1,
    widgets: settings,
    updatedAt: Date.now()
  }));
};

const workbenchSettingsFromPreference = (
  preference: LotteryPreference,
  fallback: WorkbenchWidgetSetting[]
) => {
  const order = preference.workbenchWidgetOrder || [];
  const hidden = new Set(preference.hiddenWorkbenchWidgets || []);
  if (!order.length && !hidden.size) {
    return fallback;
  }
  return normalizeWorkbenchWidgetSettings([
    ...order.map(key => ({ key: key as WorkbenchWidgetKey, visible: !hidden.has(key) })),
    ...workbenchWidgetMeta.map(item => ({ key: item.key, visible: !hidden.has(item.key) }))
  ]);
};

const workbenchSettingsToPreferencePatch = (settings: WorkbenchWidgetSetting[]) => ({
  workbenchWidgetOrder: settings.map(item => item.key),
  hiddenWorkbenchWidgets: settings.filter(item => !item.visible).map(item => item.key)
});

const workbenchPreferenceSyncColor = (state: WorkbenchPreferenceSyncState) => {
  if (state === 'SYNCED') return 'green';
  if (state === 'SAVING') return 'processing';
  if (state === 'LOADING') return 'blue';
  return 'gold';
};

const workbenchPreferenceSyncLabel = (state: WorkbenchPreferenceSyncState) => {
  if (state === 'SYNCED') return '已同步';
  if (state === 'SAVING') return '保存中';
  if (state === 'LOADING') return '读取中';
  return '本地';
};

const moveWorkbenchWidget = (
  settings: WorkbenchWidgetSetting[],
  key: WorkbenchWidgetKey,
  direction: -1 | 1
) => {
  const index = settings.findIndex(item => item.key === key);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= settings.length) {
    return settings;
  }
  const next = [...settings];
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  return next;
};

const settledItems = <T,>(result: PromiseSettledResult<{ items?: T[] }>) =>
  result.status === 'fulfilled' ? result.value.items || [] : [];

const settledValue = <T,>(result: PromiseSettledResult<T>): T | undefined =>
  result.status === 'fulfilled' ? result.value : undefined;

const fetchRecentWork = async (): Promise<LotteryWorkbenchRecentWork> => {
  const [predictions, tickets, experiments, backtests, exports, decisionOutcomes] = await Promise.allSettled([
    lotteryPredictionApi.historyPage({ page: 1, pageSize: 3 }),
    lotteryTicketApi.ticketsPage({ page: 1, pageSize: 3 }),
    lotteryExperimentApi.experiments({ page: 1, pageSize: 3 }),
    lotteryBacktestApi.reports({ page: 1, pageSize: 3 }),
    lotteryExportApi.auditEvents({ page: 1, pageSize: 3 }),
    lotteryDecisionSetApi.outcomes({ limit: 12 })
  ]);

  return {
    predictions: settledItems<LotteryPredictionSnapshot>(predictions),
    tickets: settledItems<LotteryTicket>(tickets),
    experiments: settledItems<LotteryStrategyExperiment>(experiments),
    backtests: settledItems<LotteryBacktestReport>(backtests),
    exports: settledItems<LotteryAuditEvent>(exports),
    decisionOutcomes: settledValue<LotteryDecisionOutcomeSummary>(decisionOutcomes)
  };
};

const createEmptyRecentWork = (): LotteryWorkbenchRecentWork => ({
  predictions: [],
  tickets: [],
  experiments: [],
  backtests: [],
  exports: [],
  decisionOutcomes: undefined
});

const formatDateTime = (timestamp?: number) => {
  if (!timestamp) {
    return '-';
  }
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp));
};

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) {
    return '-';
  }
  return `¥${value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;
};

const formatPercent = (value?: number) => {
  if (value === undefined || value === null) {
    return '-';
  }
  return `${Number(value).toFixed(2)}%`;
};

const formatRoi = (netResult?: number, totalCost?: number) => {
  if (netResult === undefined || netResult === null || !totalCost) {
    return '-';
  }
  return formatPercent((netResult / totalCost) * 100);
};

const decisionOutcomePath = (item?: LotteryDecisionOutcomeItem, params?: Record<string, string | undefined>) => {
  const search = new URLSearchParams();
  if (item?.targetIssue) {
    search.set('targetIssue', item.targetIssue);
  }
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value) {
      search.set(key, value);
    }
  });
  return `/lottery/predictions/decision${search.toString() ? `?${search.toString()}` : ''}`;
};

const decisionOutcomeTicketPath = (item?: LotteryDecisionOutcomeItem, fallback = '/lottery/tickets') =>
  item?.targetIssue ? `/lottery/tickets?issue=${encodeURIComponent(item.targetIssue)}` : fallback;

const decisionOutcomeExportPath = (item?: LotteryDecisionOutcomeItem) => {
  const search = new URLSearchParams({ type: 'decision-outcomes' });
  if (item?.targetIssue) {
    search.set('targetIssue', item.targetIssue);
  }
  return `/lottery/exports?${search.toString()}`;
};

const stepStatusColor = (status?: string) => {
  if (status === 'SUCCESS') return 'green';
  if (status === 'FAILED') return 'red';
  if (status === 'RUNNING') return 'processing';
  if (status === 'SKIPPED') return 'gold';
  return 'default';
};

const toStepStatus = (status?: string) => {
  if (status === 'SUCCESS') return 'finish' as const;
  if (status === 'FAILED') return 'error' as const;
  if (status === 'RUNNING') return 'process' as const;
  return 'wait' as const;
};

const dailyStateColor = (status?: string) => {
  if (status === 'COMPLETE') return 'green';
  if (status === 'WARNING') return 'gold';
  if (status === 'PENDING') return 'orange';
  return 'default';
};

const releaseStatusColor = (status?: string) => {
  if (status === 'PASS') return 'green';
  if (status === 'WARNING') return 'orange';
  if (status === 'MANUAL') return 'blue';
  return 'default';
};

const scheduledStatusColor = (status?: string) => {
  if (status === 'READY') return 'green';
  if (status === 'WARNING') return 'red';
  if (status === 'DISABLED') return 'default';
  if (status === 'PENDING') return 'gold';
  return 'blue';
};

const queueStatusColor = (status?: string) => {
  if (status === 'PASS' || status === 'SUCCESS' || status === 'COMPLETE') return 'green';
  if (status === 'FAILED' || status === 'WARNING') return 'red';
  if (status === 'MANUAL') return 'blue';
  if (status === 'PENDING' || status === 'RUNNING') return 'gold';
  return 'default';
};

const operationsHealthColor = (status?: string) => {
  if (status === 'PASS') return 'green';
  if (status === 'WARNING') return 'gold';
  if (status === 'FAILED') return 'red';
  return 'default';
};

const isActionableState = (item?: LotteryDailyStateItem) =>
  Boolean(item && (item.status !== 'COMPLETE' || (item.pendingCount || 0) > 0));

const issueText = (issue?: string | number) => {
  if (issue === undefined || issue === null || issue === '') {
    return '-';
  }
  return String(issue);
};

const getQualityIssueCount = (summary?: LotteryWorkbenchSummary) => {
  const report = summary?.dataQualitySummary;
  return (report?.missingIssueCount || 0)
    + (report?.duplicateIssueCount || 0)
    + (report?.malformedRecordCount || 0)
    + (report?.futureDateCount || 0);
};

const LotteryWorkbenchPage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<LotteryWorkbenchSummary>();
  const [calendar, setCalendar] = useState<LotteryCalendarState>();
  const [reminders, setReminders] = useState<LotteryReminderSummary>();
  const [budgetStatus, setBudgetStatus] = useState<LotteryBudgetStatus>();
  const [operationsHealth, setOperationsHealth] = useState<LotteryOperationsHealthSummary>();
  const [notes, setNotes] = useState<LotteryStrategyNote[]>([]);
  const [recentWork, setRecentWork] = useState<LotteryWorkbenchRecentWork>(createEmptyRecentWork);
  const [dailyRunResult, setDailyRunResult] = useState<LotteryWorkbenchDailyRunResult>();
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [checkingPrize, setCheckingPrize] = useState(false);
  const [error, setError] = useState<string>();
  const [showWidgetConfig, setShowWidgetConfig] = useState(false);
  const [widgetSettings, setWidgetSettings] = useState<WorkbenchWidgetSetting[]>(readWorkbenchWidgetSettings);
  const [widgetPreferenceReady, setWidgetPreferenceReady] = useState(false);
  const [widgetPreferenceSync, setWidgetPreferenceSync] = useState<WorkbenchPreferenceSyncState>('LOCAL');
  const preferenceRef = useRef<LotteryPreference | undefined>(undefined);

  const qualityIssueCount = useMemo(() => getQualityIssueCount(summary), [summary]);
  const dailyState = summary?.dailyState;
  const operationSummary = summary?.operationSummary;
  const scheduledRunbook = summary?.scheduledSyncRunbook;
  const releaseCheckSummary = summary?.releaseCheckSummary;
  const latestSyncStatus = summary?.latestSyncSummary?.latestStatus || 'UNKNOWN';
  const latestSyncStatusLabel = lotteryStatusLabel(latestSyncStatus);
  const trainingStatus = summary?.trainingStatus;
  const trainingPercent = Math.max(0, Math.min(100, trainingStatus?.percent ?? 0));
  const savedPredictionHistoryPath = getLotterySavedViewPath('/lottery/predictions/history', lotteryViewStateKeys.predictionHistory);
  const savedTicketsPath = getLotterySavedViewPath('/lottery/tickets', lotteryViewStateKeys.tickets);
  const savedSyncPath = getLotterySavedViewPath('/lottery/sync', lotteryViewStateKeys.syncOperations);

  useEffect(() => {
    writeWorkbenchWidgetSettings(widgetSettings);
    if (!widgetPreferenceReady) {
      return;
    }
    const handle = window.setTimeout(() => {
      setWidgetPreferenceSync('SAVING');
      lotteryPreferenceApi.updatePreference({
        ...(preferenceRef.current || {}),
        ...workbenchSettingsToPreferencePatch(widgetSettings)
      }).then(savedPreference => {
        preferenceRef.current = savedPreference;
        setWidgetPreferenceSync('SYNCED');
      }).catch(requestError => {
        console.error('保存彩票工作台布局偏好失败:', requestError);
        setWidgetPreferenceSync('LOCAL');
      });
    }, 400);
    return () => window.clearTimeout(handle);
  }, [widgetPreferenceReady, widgetSettings]);

  useEffect(() => {
    let cancelled = false;
    setWidgetPreferenceSync('LOADING');
    lotteryPreferenceApi.preference().then(preference => {
      if (cancelled) {
        return;
      }
      preferenceRef.current = preference;
      setWidgetSettings(current => {
        const next = workbenchSettingsFromPreference(preference, current);
        writeWorkbenchWidgetSettings(next);
        return next;
      });
      setWidgetPreferenceSync('SYNCED');
    }).catch(requestError => {
      if (cancelled) {
        return;
      }
      console.error('读取彩票工作台布局偏好失败，继续使用本地布局:', requestError);
      setWidgetPreferenceSync('LOCAL');
    }).finally(() => {
      if (!cancelled) {
        setWidgetPreferenceReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [data, calendarData, reminderData, budgetData, healthData, notesData, recentWorkData] = await Promise.all([
        lotteryWorkbenchApi.summary(),
        lotteryCalendarApi.calendar(),
        lotteryReminderApi.summary(),
        lotteryBudgetApi.status(),
        lotteryOperationsApi.health(),
        lotteryStrategyNoteApi.notes({ page: 1, pageSize: 30 }),
        fetchRecentWork()
      ]);
      setSummary(data);
      setCalendar(calendarData);
      setReminders(reminderData);
      setBudgetStatus(budgetData);
      setOperationsHealth(healthData);
      setNotes(notesData.items || []);
      setRecentWork(recentWorkData);
    } catch (requestError) {
      console.error('读取彩票工作台失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取彩票工作台失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const toggleWidget = useCallback((key: WorkbenchWidgetKey) => {
    setWidgetSettings(current => current.map(item => (
      item.key === key ? { ...item, visible: !item.visible } : item
    )));
  }, []);

  const moveWidget = useCallback((key: WorkbenchWidgetKey, direction: -1 | 1) => {
    setWidgetSettings(current => moveWorkbenchWidget(current, key, direction));
  }, []);

  const resetWidgetSettings = useCallback(() => {
    setWidgetSettings(defaultWorkbenchWidgetSettings());
  }, []);

  const runDailyWork = async () => {
    setRunning(true);
    setError(undefined);
    try {
      const result = await lotteryWorkbenchApi.dailyRun();
      setDailyRunResult(result);
      setSummary(result.summary);
      const [calendarData, reminderData, budgetData, healthData, recentWorkData] = await Promise.all([
        lotteryCalendarApi.calendar(),
        lotteryReminderApi.summary(),
        lotteryBudgetApi.status(),
        lotteryOperationsApi.health(),
        fetchRecentWork()
      ]);
      setCalendar(calendarData);
      setReminders(reminderData);
      setBudgetStatus(budgetData);
      setOperationsHealth(healthData);
      setRecentWork(recentWorkData);
      message.success('日常任务已完成');
    } catch (requestError) {
      console.error('执行彩票日常任务失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '执行彩票日常任务失败');
      message.error('执行彩票日常任务失败');
    } finally {
      setRunning(false);
    }
  };

  const checkLatestPrizes = async () => {
    setCheckingPrize(true);
    setError(undefined);
    try {
      const result = await lotteryTicketApi.checkLatestPrizes();
      message.success(`已核验 ${result.checkedTicketCount || 0} 张，中奖 ${result.winningTicketCount || 0} 张`);
      await loadSummary();
    } catch (requestError) {
      console.error('按最新开奖核验彩票失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '按最新开奖核验彩票失败');
      message.error('按最新开奖核验彩票失败');
    } finally {
      setCheckingPrize(false);
    }
  };

  const acknowledgeHealth = async (contributorKey?: string) => {
    try {
      const result = await lotteryOperationsApi.acknowledgeHealth({
        contributorKey,
        note: contributorKey ? 'workbench contributor acknowledgement' : 'workbench health acknowledgement'
      });
      setOperationsHealth(result);
      message.success('健康提醒已确认');
    } catch (requestError) {
      console.error('确认彩票运营健康提醒失败:', requestError);
      message.error('确认健康提醒失败');
    }
  };

  const acknowledgeReminder = async (key?: string, fingerprint?: string) => {
    if (!key || !fingerprint) {
      return;
    }
    try {
      const result = await lotteryReminderApi.acknowledge(key, fingerprint, 'workbench acknowledgement');
      setReminders(result);
      message.success('提醒已确认');
    } catch (requestError) {
      console.error('确认彩票行动提醒失败:', requestError);
      message.error('确认提醒失败');
    }
  };

  const snoozeReminder = async (key?: string, fingerprint?: string) => {
    if (!key || !fingerprint) {
      return;
    }
    try {
      const result = await lotteryReminderApi.snooze(key, fingerprint);
      setReminders(result);
      message.success('已稍后提醒');
    } catch (requestError) {
      console.error('稍后处理彩票行动提醒失败:', requestError);
      message.error('稍后提醒失败');
    }
  };

  const statusCards = [
    {
      key: 'draw',
      icon: <DatabaseOutlined />,
      label: '最近开奖',
      value: summary?.latestDraw?.issue || summary?.latestDraw?.period || '-',
      detail: summary?.latestDraw?.drawDate || '-',
      path: '/lottery/records'
    },
    {
      key: 'sync',
      icon: <SyncOutlined />,
      label: '同步状态',
      value: latestSyncStatusLabel,
      detail: formatDateTime(summary?.latestSyncSummary?.latestFinishedAt),
      path: dailyState?.syncState?.path || savedSyncPath
    },
    {
      key: 'scheduled',
      icon: <ClockCircleOutlined />,
      label: '定时同步',
      value: lotteryStatusLabel(scheduledRunbook?.healthStatus),
      detail: scheduledRunbook?.nextRunText || scheduledRunbook?.message || '-',
      path: savedSyncPath
    },
    {
      key: 'quality',
      icon: <SafetyCertificateOutlined />,
      label: '质量问题',
      value: qualityIssueCount,
      detail: `${summary?.dataQualitySummary?.totalRecords ?? 0} 条记录`,
      path: dailyState?.qualityState?.path || '/lottery/data-quality'
    },
    {
      key: 'ticket',
      icon: <FileTextOutlined />,
      label: '待核验票据',
      value: summary?.pendingTicketCount ?? 0,
      detail: `最近核验 ${summary?.latestPrizeCheckSummary?.checkedTicketCount ?? 0} 张`,
      path: dailyState?.prizeCheckState?.path || dailyState?.ticketState?.path || savedTicketsPath
    },
    {
      key: 'ledger',
      icon: <PieChartOutlined />,
      label: '账本净值',
      value: formatCurrency(summary?.ledgerSummary?.netResult),
      detail: `ROI ${summary?.ledgerSummary?.roiPercent ?? 0}%`,
      path: '/lottery/ledger'
    },
    {
      key: 'release',
      icon: <CheckCircleOutlined />,
      label: '发布检查',
      value: `${releaseCheckSummary?.passedCount ?? 0}/${releaseCheckSummary?.totalCount ?? 0}`,
      detail: releaseCheckSummary?.message || '-',
      path: '/lottery/exports'
    }
  ];

  const quickActions = [
    {
      key: 'sync',
      icon: <SyncOutlined />,
      label: '同步',
      detail: latestSyncStatusLabel,
      onClick: () => navigate(dailyState?.syncState?.path || savedSyncPath)
    },
    {
      key: 'prediction',
      icon: <ThunderboltOutlined />,
      label: '预测',
      detail: trainingStatus?.running ? '训练中' : lotteryStatusLabel(dailyState?.predictionState?.status, 'READY'),
      onClick: () => navigate(dailyState?.predictionState?.path || '/lottery/prediction')
    },
    {
      key: 'ticket',
      icon: <FileTextOutlined />,
      label: '录票',
      detail: `${summary?.pendingTicketCount ?? 0} 张待核验`,
      onClick: () => navigate(dailyState?.ticketState?.path || '/lottery/tickets?status=DRAFT')
    },
    {
      key: 'ticket-pack',
      icon: <SafetyCertificateOutlined />,
      label: '票包',
      detail: '待审批执行',
      onClick: () => navigate(workbenchIssueHandoffPaths.ticketPacks)
    },
    {
      key: 'check',
      icon: <CheckCircleOutlined />,
      label: '核验',
      detail: summary?.latestPrizeCheckSummary?.issue || '最新开奖',
      loading: checkingPrize,
      onClick: checkLatestPrizes
    },
    {
      key: 'ledger',
      icon: <PieChartOutlined />,
      label: '账本',
      detail: `ROI ${formatPercent(summary?.ledgerSummary?.roiPercent)}`,
      onClick: () => navigate('/lottery/ledger')
    },
    {
      key: 'alerts',
      icon: <BellOutlined />,
      label: '提醒',
      detail: `${reminders?.activeCount ?? calendar?.reminders?.length ?? 0} 条`,
      onClick: () => navigate('/lottery/alerts')
    },
    {
      key: 'exports',
      icon: <DownloadOutlined />,
      label: '导出',
      detail: `${recentWork.exports.length} 次近期`,
      onClick: () => navigate('/lottery/exports')
    }
  ];

  const latestDrawIssue = issueText(summary?.latestDraw?.issue || summary?.latestDraw?.period || dailyState?.latestIssue);
  const nextIssue = issueText(dailyState?.nextIssue || calendar?.nextIssue);
  const latestPredictionTarget = issueText(summary?.latestPrediction?.targetPeriod || dailyState?.nextIssue);
  const latestTicketIssue = issueText(recentWork.tickets[0]?.issue || recentWork.tickets[0]?.period || dailyState?.latestIssue);
  const latestDrawPeriodNumber = Number(summary?.latestDraw?.period || summary?.latestDraw?.issue || 0);
  const latestPredictionTargetNumber = Number(summary?.latestPrediction?.targetPeriod || 0);
  const predictionAttachmentPending = Boolean(
    summary?.latestPrediction
      && !summary.latestPrediction.actualRecord
      && latestDrawPeriodNumber
      && latestPredictionTargetNumber
      && latestDrawPeriodNumber >= latestPredictionTargetNumber
  );

  const issueFocusItems: WorkbenchFocusItem[] = [
    {
      key: 'latest-draw',
      icon: <DatabaseOutlined />,
      label: '最近开奖',
      value: latestDrawIssue,
      detail: summary?.latestDraw?.drawDate || '暂无开奖日期',
      path: '/lottery/records'
    },
    {
      key: 'next-issue',
      icon: <ClockCircleOutlined />,
      label: '下一期',
      value: nextIssue,
      detail: calendar?.nextDrawDate ? `${calendar.nextDrawDate} ${calendar.drawWeekday || ''}` : '等待开奖日历',
      path: '/lottery/alerts',
      status: calendar?.currentIssueState
    },
    {
      key: 'prediction',
      icon: <ThunderboltOutlined />,
      label: '预测目标',
      value: latestPredictionTarget,
      detail: summary?.latestPrediction?.ruleName || dailyState?.predictionState?.message || '暂无预测快照',
      path: summary?.latestPrediction?.id ? `/lottery/predictions/${summary.latestPrediction.id}` : '/lottery/prediction',
      status: dailyState?.predictionState?.status
    },
    {
      key: 'ticket',
      icon: <FileTextOutlined />,
      label: '票据期号',
      value: latestTicketIssue,
      detail: `${summary?.pendingTicketCount ?? 0} 张待核验`,
      path: latestTicketIssue !== '-' ? `/lottery/tickets?issue=${latestTicketIssue}` : savedTicketsPath,
      status: dailyState?.ticketState?.status
    },
    {
      key: 'prize-check',
      icon: <CheckCircleOutlined />,
      label: '中奖核验',
      value: issueText(summary?.latestPrizeCheckSummary?.issue || latestDrawIssue),
      detail: `已核验 ${summary?.latestPrizeCheckSummary?.checkedTicketCount ?? 0} 张`,
      path: dailyState?.prizeCheckState?.path || savedTicketsPath,
      status: dailyState?.prizeCheckState?.status
    },
    {
      key: 'ledger',
      icon: <PieChartOutlined />,
      label: '账本结果',
      value: formatCurrency(summary?.ledgerSummary?.netResult),
      detail: `ROI ${formatPercent(summary?.ledgerSummary?.roiPercent)}`,
      path: '/lottery/ledger'
    }
  ];

  const closureSteps: WorkbenchClosureStep[] = [
    {
      key: 'sync',
      icon: <SyncOutlined />,
      label: '同步',
      title: dailyState?.syncState?.label || '更新开奖记录',
      detail: dailyState?.syncState?.message || latestSyncStatusLabel,
      status: dailyState?.syncState?.status || summary?.latestSyncSummary?.latestStatus,
      count: dailyState?.syncState?.pendingCount,
      path: dailyState?.syncState?.path || savedSyncPath,
      actionLabel: '去同步'
    },
    {
      key: 'prediction',
      icon: <ThunderboltOutlined />,
      label: '预测',
      title: dailyState?.predictionState?.label || '复核预测快照',
      detail: dailyState?.predictionState?.message || (summary?.latestPrediction ? `第 ${summary.latestPrediction.targetPeriod} 期` : '暂无预测快照'),
      status: trainingStatus?.running ? 'RUNNING' : dailyState?.predictionState?.status,
      count: dailyState?.predictionState?.pendingCount,
      path: dailyState?.predictionState?.path || (summary?.latestPrediction?.id ? `/lottery/predictions/${summary.latestPrediction.id}` : '/lottery/prediction'),
      actionLabel: trainingStatus?.running ? '看进度' : '去复核'
    },
    {
      key: 'ticket',
      icon: <FileTextOutlined />,
      label: '票包',
      title: dailyState?.ticketState?.label || '确认票据',
      detail: dailyState?.ticketState?.message || `${summary?.pendingTicketCount ?? 0} 张待核验`,
      status: dailyState?.ticketState?.status,
      count: dailyState?.ticketState?.pendingCount || summary?.pendingTicketCount,
      path: dailyState?.ticketState?.path || savedTicketsPath,
      actionLabel: '去处理'
    },
    {
      key: 'prize-check',
      icon: <CheckCircleOutlined />,
      label: '核验',
      title: dailyState?.prizeCheckState?.label || '核验开奖结果',
      detail: dailyState?.prizeCheckState?.message || `最近核验 ${summary?.latestPrizeCheckSummary?.checkedTicketCount ?? 0} 张`,
      status: dailyState?.prizeCheckState?.status,
      count: dailyState?.prizeCheckState?.pendingCount,
      path: dailyState?.prizeCheckState?.path || savedTicketsPath,
      actionLabel: '去核验'
    },
    {
      key: 'ledger',
      icon: <PieChartOutlined />,
      label: '账本',
      title: '复盘账本结果',
      detail: `${formatCurrency(summary?.ledgerSummary?.netResult)} · ROI ${formatPercent(summary?.ledgerSummary?.roiPercent)}`,
      status: summary?.ledgerSummary ? 'COMPLETE' : 'PENDING',
      path: '/lottery/ledger',
      actionLabel: '看账本'
    },
    {
      key: 'report',
      icon: <DownloadOutlined />,
      label: '留档',
      title: '生成报告导出',
      detail: releaseCheckSummary?.message || `${recentWork.exports.length} 次近期导出`,
      status: releaseCheckSummary?.status || (recentWork.exports.length ? 'COMPLETE' : 'MANUAL'),
      count: releaseCheckSummary?.totalCount,
      path: '/lottery/exports',
      actionLabel: '去留档'
    }
  ];

  const closureCompleteCount = closureSteps.filter(item => item.status === 'COMPLETE' || item.status === 'PASS' || item.status === 'SUCCESS').length;
  const closureNeedsAttentionCount = closureSteps.filter(item => item.status && item.status !== 'COMPLETE' && item.status !== 'PASS' && item.status !== 'SUCCESS').length;

  const decisionOutcomeFollowUps = useMemo<WorkbenchActionQueueItem[]>(() => {
    const outcomes = recentWork.decisionOutcomes?.items || [];
    const items: WorkbenchActionQueueItem[] = [];

    outcomes
      .filter(item => (item.convertedTicketCount || 0) > (item.checkedConvertedTicketCount || 0))
      .slice(0, 3)
      .forEach(item => {
        items.push({
          key: `decision-unchecked-${item.decisionSetId || item.targetIssue}`,
          group: '决策复盘',
          title: '转票待核奖',
          detail: `${item.title || `第 ${item.targetIssue || '-'} 期`} · 已核 ${item.checkedConvertedTicketCount || 0}/${item.convertedTicketCount || 0}`,
          status: 'PENDING',
          count: Math.max(0, (item.convertedTicketCount || 0) - (item.checkedConvertedTicketCount || 0)),
          path: decisionOutcomeTicketPath(item, savedTicketsPath)
        });
      });

    outcomes
      .filter(item => (item.staleEvidenceCount || 0) > 0 || (item.volatileEvidenceCount || 0) > 0)
      .slice(0, 3)
      .forEach(item => {
        const alertState = (item.staleEvidenceCount || 0) > 0 ? 'STALE' : 'VOLATILE';
        items.push({
          key: `decision-evidence-${item.decisionSetId || item.targetIssue}`,
          group: '证据复核',
          title: alertState === 'STALE' ? '决策证据过期' : '决策规则波动',
          detail: `${item.title || `第 ${item.targetIssue || '-'} 期`} · 过期 ${item.staleEvidenceCount || 0} · 波动 ${item.volatileEvidenceCount || 0}`,
          status: 'WARNING',
          count: (item.staleEvidenceCount || 0) + (item.volatileEvidenceCount || 0),
          path: decisionOutcomePath(item, { outcomeAlert: alertState })
        });
      });

    outcomes
      .filter(item => (item.warningCount || 0) >= 2)
      .slice(0, 3)
      .forEach(item => {
        items.push({
          key: `decision-warning-export-${item.decisionSetId || item.targetIssue}`,
          group: '复盘留证',
          title: '导出高提醒复盘',
          detail: `${item.title || `第 ${item.targetIssue || '-'} 期`} · 提醒 ${item.warningCount || 0} · 净 ${formatCurrency(item.netResult)}`,
          status: 'MANUAL',
          count: item.warningCount,
          path: decisionOutcomeExportPath(item)
        });
      });

    return items;
  }, [recentWork.decisionOutcomes?.items, savedTicketsPath]);

  const actionQueueItems = useMemo<WorkbenchActionQueueItem[]>(() => {
    const items: WorkbenchActionQueueItem[] = [];
    const pushDailyState = (group: string, item?: LotteryDailyStateItem) => {
      if (!isActionableState(item)) {
        return;
      }
      items.push({
        key: item?.key || group,
        group,
        title: item?.label || group,
        detail: item?.message || '等待处理',
        status: item?.status,
        count: item?.pendingCount,
        path: item?.path
      });
    };

    pushDailyState('同步', dailyState?.syncState);
    pushDailyState('数据质量', dailyState?.qualityState);
    pushDailyState('预测', dailyState?.predictionState);
    pushDailyState('中奖核验', dailyState?.prizeCheckState);

    if (predictionAttachmentPending) {
      items.push({
        key: 'prediction-attachment',
        group: '预测',
        title: '回填开奖结果',
        detail: `第 ${latestPredictionTarget} 期预测等待关联最新开奖`,
        status: 'PENDING',
        count: 1,
        path: summary?.latestPrediction?.id ? `/lottery/predictions/${summary.latestPrediction.id}` : savedPredictionHistoryPath
      });
    }

    (operationSummary?.pendingActions || []).forEach((action, index) => {
      items.push({
        key: `operation-${index}`,
        group: '日常运维',
        title: action,
        detail: operationSummary?.message || '等待日常处理',
        status: operationSummary?.status || 'PENDING'
      });
    });

    if (scheduledRunbook?.healthStatus === 'WARNING') {
      items.push({
        key: 'scheduled-sync-warning',
        group: '同步',
        title: '定时同步异常',
        detail: scheduledRunbook.message || scheduledRunbook.lastMessage || '需要检查定时同步',
        status: 'WARNING',
        path: savedSyncPath
      });
    }

    (budgetStatus?.warnings || []).forEach((warning, index) => {
      items.push({
        key: warning.key || `budget-${index}`,
        group: '预算',
        title: '预算提醒',
        detail: warning.message || '预算状态需要确认',
        status: warning.level || 'WARNING',
        path: warning.path || '/lottery/settings'
      });
    });

    (releaseCheckSummary?.checks || [])
      .filter(item => item.status && item.status !== 'PASS')
      .slice(0, 6)
      .forEach(item => {
        items.push({
          key: item.key || item.label || 'release-check',
          group: item.status === 'MANUAL' ? '发布确认' : '发布告警',
          title: item.label || item.key || '发布检查',
          detail: item.message || '需要确认发布检查',
          status: item.status,
          count: item.pendingCount,
          path: item.path
        });
      });

    return [...items, ...decisionOutcomeFollowUps];
  }, [
    budgetStatus?.warnings,
    dailyState?.predictionState,
    dailyState?.prizeCheckState,
    dailyState?.qualityState,
    dailyState?.syncState,
    decisionOutcomeFollowUps,
    latestPredictionTarget,
    operationSummary?.message,
    operationSummary?.pendingActions,
    operationSummary?.status,
    predictionAttachmentPending,
    releaseCheckSummary?.checks,
    savedPredictionHistoryPath,
    savedSyncPath,
    scheduledRunbook?.healthStatus,
    scheduledRunbook?.lastMessage,
    scheduledRunbook?.message,
    summary?.latestPrediction?.id
  ]);

  const priorityItems = useMemo<WorkbenchPriorityItem[]>(() => {
    const items: WorkbenchPriorityItem[] = [];

    (reminders?.items || [])
      .filter(item => !item.acknowledgedAt)
      .slice(0, 3)
      .forEach(item => {
        items.push({
          key: `reminder-${item.key}-${item.fingerprint}`,
          icon: <BellOutlined />,
          title: item.title || item.key || '待处理提醒',
          detail: item.message || '提醒等待确认',
          status: item.status || 'TODO',
          path: item.path || '/lottery/alerts',
          actionLabel: '查看提醒'
        });
      });

    actionQueueItems.slice(0, 4).forEach(item => {
      items.push({
        key: `queue-${item.key}`,
        icon: <WarningOutlined />,
        title: item.title,
        detail: item.detail,
        status: item.status || 'TODO',
        count: item.count,
        path: item.path,
        actionLabel: item.path ? '处理待办' : '查看待办'
      });
    });

    if (operationsHealth?.status && operationsHealth.status !== 'PASS') {
      items.push({
        key: 'operations-health-priority',
        icon: <SafetyCertificateOutlined />,
        title: '运营健康需要确认',
        detail: operationsHealth.message || '健康评分存在提醒',
        status: operationsHealth.status,
        count: operationsHealth.warningCount || operationsHealth.pendingActionCount,
        path: workbenchIssueHandoffPaths.governance,
        actionLabel: '查看健康'
      });
    }

    if ((summary?.pendingTicketCount || 0) > 0) {
      items.push({
        key: 'pending-ticket-priority',
        icon: <FileTextOutlined />,
        title: '核验待处理票据',
        detail: `${summary?.pendingTicketCount || 0} 张票据等待核验或归档`,
        status: 'PENDING',
        count: summary?.pendingTicketCount,
        path: dailyState?.prizeCheckState?.path || dailyState?.ticketState?.path || savedTicketsPath,
        actionLabel: '去核验'
      });
    }

    const releaseIssue = (releaseCheckSummary?.checks || []).find(item => item.status && item.status !== 'PASS');
    if (releaseIssue) {
      items.push({
        key: `release-${releaseIssue.key || releaseIssue.label || 'check'}`,
        icon: <CheckCircleOutlined />,
        title: releaseIssue.label || '发布检查',
        detail: releaseIssue.message || releaseCheckSummary?.message || '发布检查需要确认',
        status: releaseIssue.status,
        count: releaseIssue.pendingCount,
        path: releaseIssue.path || '/lottery/exports',
        actionLabel: '查看检查'
      });
    }

    return items.slice(0, 8);
  }, [
    actionQueueItems,
    dailyState?.prizeCheckState?.path,
    dailyState?.ticketState?.path,
    operationsHealth?.message,
    operationsHealth?.pendingActionCount,
    operationsHealth?.status,
    operationsHealth?.warningCount,
    releaseCheckSummary?.checks,
    releaseCheckSummary?.message,
    reminders?.items,
    savedTicketsPath,
    summary?.pendingTicketCount
  ]);

  const actionQueueGroups = useMemo(() => {
    const groups = new Map<string, WorkbenchActionQueueItem[]>();
    actionQueueItems.forEach(item => {
      const groupItems = groups.get(item.group) || [];
      groupItems.push(item);
      groups.set(item.group, groupItems);
    });
    return Array.from(groups.entries()).map(([title, items]) => ({ title, items }));
  }, [actionQueueItems]);

  const archiveReviewPressure = useMemo(() => {
    const releaseBlockers = (releaseCheckSummary?.checks || []).filter(item => item.status && item.status !== 'PASS');
    const evidenceFollowUps = actionQueueItems.filter(item => item.group === '证据复核' || item.title.includes('证据') || item.title.includes('过期'));
    const dueReminderCount = reminders?.dueCount || 0;
    const missingExportEvidence = recentWork.exports.length ? 0 : 1;
    const count = releaseBlockers.length + evidenceFollowUps.length + dueReminderCount + missingExportEvidence;
    return {
      count,
      status: releaseBlockers.some(item => item.status === 'FAILED') ? 'FAILED' : count ? 'WARNING' : 'PASS',
      detail: `发布阻塞 ${releaseBlockers.length} · 证据复核 ${evidenceFollowUps.length} · 到期提醒 ${dueReminderCount}`,
      path: workbenchIssueHandoffPaths.monthEnd
    };
  }, [actionQueueItems, recentWork.exports.length, releaseCheckSummary?.checks, reminders?.dueCount]);

  const archiveReviewNotePath = useMemo(() => buildWorkbenchPath('/lottery/research/notebook', {
    title: '工作台归档复核',
    status: 'ACTIVE',
    evidenceKey: `workbench-archive-review:${archiveReviewPressure.count}`,
    evidenceType: 'ARCHIVE_REVIEW',
    evidenceTitle: `工作台归档复核 ${archiveReviewPressure.count} 项`,
    sourceId: 'workbench',
    path: buildWorkbenchPath('/lottery/exports', { preset: 'v34-archive-search' })
  }), [archiveReviewPressure.count]);

  const archiveReviewNoteQuality = useMemo(() => {
    const archiveNotes = notes.filter(note => (note.evidence || []).some(evidence => evidence.evidenceType === 'ARCHIVE_REVIEW'));
    const active = archiveNotes.filter(note => note.status === 'ACTIVE').length;
    const validated = archiveNotes.filter(note => note.status === 'VALIDATED').length;
    const evidenceCount = archiveNotes.reduce((sum, note) => sum + (note.evidence || []).filter(evidence => evidence.evidenceType === 'ARCHIVE_REVIEW').length, 0);
    const missingEvidence = Math.max(0, archiveNotes.length - evidenceCount);
    const needsFollowUp = active > 0 || missingEvidence > 0 || (archiveReviewPressure.count > 0 && archiveNotes.length === 0);
    return {
      total: archiveNotes.length,
      active,
      validated,
      evidenceCount,
      missingEvidence,
      needsFollowUp,
      status: needsFollowUp ? 'WARNING' : archiveNotes.length ? 'PASS' : 'MANUAL'
    };
  }, [archiveReviewPressure.count, notes]);

  const issueNextItems = useMemo<WorkbenchIssueNextItem[]>(() => {
    const items: WorkbenchIssueNextItem[] = [];
    const releaseBlockers = (releaseCheckSummary?.checks || []).filter(item => item.status && item.status !== 'PASS');
    const staleEvidence = actionQueueItems.find(item => item.group === '证据复核' || item.title.includes('过期'));
    const anomalyCount = (operationsHealth?.warningCount || 0) + releaseBlockers.length + (staleEvidence?.count || 0);

    if ((summary?.pendingTicketCount || 0) > 0) {
      items.push({
        key: 'pending-tickets',
        icon: <FileTextOutlined />,
        title: '待处理票据',
        detail: `第 ${latestTicketIssue} 期 · ${summary?.pendingTicketCount || 0} 张待核验`,
        status: dailyState?.ticketState?.status || 'PENDING',
        count: summary?.pendingTicketCount,
        path: dailyState?.ticketState?.path || savedTicketsPath,
        actionLabel: '处理票据'
      });
    }

    if (isActionableState(dailyState?.prizeCheckState)) {
      items.push({
        key: 'pending-prize-check',
        icon: <CheckCircleOutlined />,
        title: '开奖核验',
        detail: dailyState?.prizeCheckState?.message || `第 ${latestDrawIssue} 期等待核验`,
        status: dailyState?.prizeCheckState?.status,
        count: dailyState?.prizeCheckState?.pendingCount,
        path: dailyState?.prizeCheckState?.path || savedTicketsPath,
        actionLabel: '去核验'
      });
    }

    if (staleEvidence) {
      items.push({
        key: 'stale-evidence',
        icon: <WarningOutlined />,
        title: '证据复核',
        detail: staleEvidence.detail,
        status: staleEvidence.status,
        count: staleEvidence.count,
        path: staleEvidence.path || workbenchIssueHandoffPaths.recommendations,
        actionLabel: '复核证据'
      });
    }

    if (staleEvidence || archiveReviewPressure.count > 0) {
      items.push({
        key: 'evidence-quality-trend',
        icon: <SafetyCertificateOutlined />,
        title: '证据质量趋势',
        detail: staleEvidence?.detail || archiveReviewPressure.detail,
        status: staleEvidence?.status || archiveReviewPressure.status,
        count: staleEvidence?.count || archiveReviewPressure.count,
        path: '/lottery/outcomes?focus=evidence-quality',
        actionLabel: '看趋势'
      });
    }

    if (latestSyncStatus !== 'SUCCESS' || (operationsHealth?.warningCount || 0) > 0) {
      items.push({
        key: 'provider-reliability-focus',
        icon: <SyncOutlined />,
        title: 'Provider可靠性',
        detail: `同步 ${latestSyncStatusLabel} · 健康警示 ${operationsHealth?.warningCount || 0}`,
        status: latestSyncStatus === 'FAILED' ? 'FAILED' : (operationsHealth?.warningCount ? 'WARNING' : latestSyncStatus),
        count: operationsHealth?.warningCount || undefined,
        path: '/lottery/sync?focus=provider-reliability',
        actionLabel: '看可靠性'
      });
    }

    if (releaseBlockers.length > 0) {
      const blocker = releaseBlockers[0];
      items.push({
        key: 'release-blockers',
        icon: <DownloadOutlined />,
        title: '发布阻塞',
        detail: blocker.message || releaseCheckSummary?.message || '发布检查需要确认',
        status: blocker.status,
        count: releaseBlockers.length,
        path: blocker.path || workbenchIssueHandoffPaths.exports,
        actionLabel: '看证据'
      });
    }

    if (archiveReviewPressure.count > 0) {
      items.push({
        key: 'archive-review',
        icon: <BookOutlined />,
        title: '归档复核',
        detail: archiveReviewPressure.detail,
        status: archiveReviewPressure.status,
        count: archiveReviewPressure.count,
        path: archiveReviewPressure.path,
        actionLabel: '看队列'
      });
    }

    if (archiveReviewNoteQuality.needsFollowUp) {
      items.push({
        key: 'archive-review-note-quality',
        icon: <BookOutlined />,
        title: '复核笔记质量',
        detail: archiveReviewNoteQuality.total
          ? `验证中 ${archiveReviewNoteQuality.active} 条 · 复核证据 ${archiveReviewNoteQuality.evidenceCount} 条`
          : '归档复核尚未沉淀为策略笔记',
        status: archiveReviewNoteQuality.status,
        count: archiveReviewNoteQuality.active || archiveReviewNoteQuality.missingEvidence || archiveReviewPressure.count,
        path: archiveReviewNotePath,
        actionLabel: archiveReviewNoteQuality.total ? '补齐笔记' : '记录复核'
      });
    }

    if (anomalyCount > 0) {
      items.push({
        key: 'anomaly-review',
        icon: <WarningOutlined />,
        title: '异常复盘',
        detail: `${operationsHealth?.warningCount || 0} 个健康警示，${releaseBlockers.length} 个发布阻塞`,
        status: releaseBlockers.some(item => item.status === 'FAILED') ? 'FAILED' : 'WARNING',
        count: anomalyCount,
        path: '/lottery/governance',
        actionLabel: '看异常'
      });
    }

    items.push({
      key: 'ticket-pack-review',
      icon: <FileTextOutlined />,
      title: '票包复核',
      detail: '审批票包、预算预检和保存票据',
      status: 'MANUAL',
      path: workbenchIssueHandoffPaths.ticketPacks,
      actionLabel: '看票包'
    });

    items.push({
      key: 'governance-review',
      icon: <SafetyCertificateOutlined />,
      title: '治理复核',
      detail: operationsHealth?.message || '检查组合、票包、证据和发布健康',
      status: operationsHealth?.status || 'MANUAL',
      count: operationsHealth?.warningCount || operationsHealth?.pendingActionCount,
      path: workbenchIssueHandoffPaths.governance,
      actionLabel: '看治理'
    });

    items.push({
      key: 'mobile-command',
      icon: <ThunderboltOutlined />,
      title: '移动复核',
      detail: `当前 ${latestDrawIssue} · 下一期 ${nextIssue}`,
      status: reminders?.dueCount ? 'PENDING' : operationsHealth?.status,
      count: reminders?.dueCount || operationsHealth?.pendingActionCount,
      path: workbenchIssueHandoffPaths.mobile,
      actionLabel: '移动处理'
    });

    items.push({
      key: 'recommendation-review',
      icon: <SafetyCertificateOutlined />,
      title: '推荐复核',
      detail: '检查推荐生命周期和 stale evidence',
      status: staleEvidence ? 'WARNING' : 'MANUAL',
      path: workbenchIssueHandoffPaths.recommendations,
      actionLabel: '看推荐'
    });

    return items.slice(0, 6);
  }, [
    actionQueueItems,
    archiveReviewNotePath,
    archiveReviewNoteQuality,
    archiveReviewPressure,
    dailyState?.prizeCheckState,
    dailyState?.ticketState?.path,
    dailyState?.ticketState?.status,
    latestDrawIssue,
    latestSyncStatus,
    latestSyncStatusLabel,
    latestTicketIssue,
    nextIssue,
    operationsHealth?.message,
    operationsHealth?.pendingActionCount,
    operationsHealth?.status,
    operationsHealth?.warningCount,
    releaseCheckSummary?.checks,
    releaseCheckSummary?.message,
    reminders?.dueCount,
    savedTicketsPath,
    summary?.pendingTicketCount
  ]);

  const reminderGroups = useMemo(() => {
    const groups = new Map<string, NonNullable<LotteryReminderSummary['items']>>();
    (reminders?.items || [])
      .filter(item => !item.acknowledgedAt)
      .forEach(item => {
        const group = item.group || '提醒';
        const groupItems = groups.get(group) || [];
        groupItems.push(item);
        groups.set(group, groupItems);
      });
    return Array.from(groups.entries()).map(([title, items]) => ({ title, items }));
  }, [reminders?.items]);

  const stepItems = (dailyRunResult?.steps || []).map((step: LotteryWorkbenchStepResult) => ({
    title: step.step || '任务',
    status: toStepStatus(step.status),
    description: (
      <Space direction="vertical" size={2}>
        <Space wrap size={6}>
          <Tag color={stepStatusColor(step.status)}>{lotteryStatusLabel(step.status)}</Tag>
          {step.savedCount !== undefined ? <Tag>新增 {step.savedCount}</Tag> : null}
          {step.checkedCount !== undefined ? <Tag>核验 {step.checkedCount}</Tag> : null}
          {step.updatedCount !== undefined ? <Tag>更新 {step.updatedCount}</Tag> : null}
        </Space>
        <span>{step.error || step.message || '-'}</span>
      </Space>
    )
  }));

  const releaseCheckItems = useMemo(
    () => (releaseCheckSummary?.checks || []).slice(0, 6),
    [releaseCheckSummary?.checks]
  );

  const reviewRunbookItems = useMemo<WorkbenchReviewRunbookItem[]>(() => {
    const releaseBlockers = (releaseCheckSummary?.checks || []).filter(item => item.status && item.status !== 'PASS').length;
    const dueReminderCount = reminders?.dueCount || 0;
    const pendingQueueCount = actionQueueItems.length;
    const monthEndStatus = archiveReviewPressure.count ? archiveReviewPressure.status : recentWork.exports.length ? 'PASS' : 'MANUAL';
    const firstReminder = (reminders?.items || []).find(item => !item.acknowledgedAt);
    const healthContributors = operationsHealth?.contributors || [];
    const firstHealthContributor = healthContributors.find(item => item.status && item.status !== 'PASS');
    const syncContributor = healthContributors.find(item => item.key && /provider|sync/i.test(item.key) && item.status && item.status !== 'PASS');
    const exportContributor = healthContributors.find(item => item.key && /export/i.test(item.key) && item.status && item.status !== 'PASS');
    return [
      {
        key: 'daily-review',
        title: '日常复核',
        detail: operationSummary?.message || '检查同步、数据质量、预测回填和中奖核验',
        status: pendingQueueCount ? 'WARNING' : operationSummary?.status || 'PASS',
        evidence: [
          `闭环 ${closureCompleteCount}/${closureSteps.length}`,
          `待办 ${pendingQueueCount}`,
          `提醒 ${reminders?.activeCount || 0}`
        ],
        path: '/lottery/workbench',
        actionLabel: '看待办',
        acknowledgeTarget: firstReminder?.key && firstReminder.fingerprint ? {
          type: 'reminder',
          label: '确认提醒',
          key: firstReminder.key,
          fingerprint: firstReminder.fingerprint
        } : firstHealthContributor?.key ? {
          type: 'health',
          label: '确认健康',
          contributorKey: firstHealthContributor.key
        } : undefined
      },
      {
        key: 'draw-cycle-review',
        title: '开奖周期',
        detail: calendar?.nextDrawDate ? `${calendar.nextDrawDate} ${calendar.drawWeekday || ''} · ${calendar.currentIssueState || '-'}` : '等待开奖日历和同步窗口',
        status: closureNeedsAttentionCount ? 'WARNING' : calendar?.currentIssueState || dailyState?.syncState?.status || 'MANUAL',
        evidence: [
          `当前 ${latestDrawIssue}`,
          `下一期 ${nextIssue}`,
          `同步 ${lotteryStatusLabel(dailyState?.syncState?.status || summary?.latestSyncSummary?.latestStatus)}`
        ],
        path: '/lottery/sync',
        actionLabel: '看同步',
        acknowledgeTarget: syncContributor?.key ? {
          type: 'health',
          label: '确认同步健康',
          contributorKey: syncContributor.key
        } : undefined
      },
      {
        key: 'month-end-review',
        title: '月末复盘',
        detail: `账本 ${formatCurrency(summary?.ledgerSummary?.netResult)} · ROI ${formatPercent(summary?.ledgerSummary?.roiPercent)}`,
        status: monthEndStatus,
        evidence: [
          `票据待核 ${summary?.pendingTicketCount || 0}`,
          `归档复核 ${archiveReviewPressure.count}`,
          `导出 ${recentWork.exports.length}`,
          `发布阻塞 ${releaseBlockers}`
        ],
        path: archiveReviewPressure.path,
        actionLabel: '看复盘',
        acknowledgeTarget: dueReminderCount && firstReminder?.key && firstReminder.fingerprint ? {
          type: 'reminder',
          label: '确认月末提醒',
          key: firstReminder.key,
          fingerprint: firstReminder.fingerprint
        } : undefined
      },
      {
        key: 'release-archive-review',
        title: '发布归档',
        detail: releaseCheckSummary?.message || '确认 smoke、导出、治理和可靠性证据',
        status: releaseCheckSummary?.status || (recentWork.exports.length ? 'PASS' : 'MANUAL'),
        evidence: [
          `检查 ${releaseCheckSummary?.passedCount || 0}/${releaseCheckSummary?.totalCount || 0}`,
          `近期导出 ${recentWork.exports.length}`,
          `Provider ${lotteryStatusLabel(summary?.latestSyncSummary?.latestStatus)}`
        ],
        path: '/lottery/exports?focus=release-archive',
        actionLabel: '看证据',
        acknowledgeTarget: exportContributor?.key ? {
          type: 'health',
          label: '确认导出健康',
          contributorKey: exportContributor.key
        } : undefined
      }
    ];
  }, [
    actionQueueItems.length,
    archiveReviewPressure,
    calendar?.currentIssueState,
    calendar?.drawWeekday,
    calendar?.nextDrawDate,
    closureCompleteCount,
    closureNeedsAttentionCount,
    closureSteps.length,
    dailyState?.syncState?.status,
    latestDrawIssue,
    nextIssue,
    operationSummary?.message,
    operationSummary?.status,
    operationsHealth?.contributors,
    recentWork.exports.length,
    releaseCheckSummary,
    reminders?.activeCount,
    reminders?.dueCount,
    reminders?.items,
    summary?.latestSyncSummary?.latestStatus,
    summary?.ledgerSummary?.netResult,
    summary?.ledgerSummary?.roiPercent,
    summary?.pendingTicketCount
  ]);

  const recentWorkGroups = useMemo(() => {
    const groups: Array<{
      key: string;
      icon: ReactNode;
      title: string;
      path: string;
      emptyDescription?: string;
      items: LotteryRecentWorkLink[];
    }> = [
      {
        key: 'predictions',
        icon: <ThunderboltOutlined />,
        title: '预测',
        path: savedPredictionHistoryPath,
        emptyDescription: '暂无预测快照',
        items: recentWork.predictions.map(item => ({
          key: item.id || `prediction-${item.targetPeriod}-${item.createdAt}`,
          title: `第 ${item.targetPeriod || '-'} 期`,
          detail: `${item.ruleName || item.ruleId || '未记录规则'} · ${formatDateTime(item.createdAt)}`,
          path: item.id ? `/lottery/predictions/${item.id}` : savedPredictionHistoryPath
        }))
      },
      {
        key: 'tickets',
        icon: <FileTextOutlined />,
        title: '票据',
        path: savedTicketsPath,
        emptyDescription: '暂无票据记录',
        items: recentWork.tickets.map(item => ({
          key: item.id || `ticket-${item.issue}-${item.createdAt}`,
          title: `第 ${item.issue || item.period || '-'} 期`,
          detail: `${lotteryCodeLabel(item.source, 'MANUAL')} · ${lotteryStatusLabel(item.status)} · ${formatDateTime(item.updatedAt || item.createdAt)}`,
          path: item.issue ? `/lottery/tickets?issue=${item.issue}` : savedTicketsPath
        }))
      },
      {
        key: 'decision-outcomes',
        icon: <SafetyCertificateOutlined />,
        title: '决策复盘',
        path: '/lottery/predictions/decision',
        emptyDescription: recentWork.decisionOutcomes ? '暂无保存决策复盘结果' : '暂未读取到决策复盘',
        items: (recentWork.decisionOutcomes?.items || []).slice(0, 3).map(item => ({
          key: item.decisionSetId || `decision-${item.targetIssue}-${item.updatedAt}`,
          title: item.title || `第 ${item.targetIssue || '-'} 期决策`,
          detail: `候选 ${item.candidateCount || 0} · 中 ${item.winningCandidateCount || 0} · 净 ${formatCurrency(item.netResult)}`,
          path: decisionOutcomePath(item),
          actions: [
            { label: '决策', path: decisionOutcomePath(item) },
            { label: '票据', path: decisionOutcomeTicketPath(item, savedTicketsPath) },
            { label: '导出', path: decisionOutcomeExportPath(item) }
          ]
        }))
      },
      {
        key: 'experiments',
        icon: <ExperimentOutlined />,
        title: '实验',
        path: '/lottery/experiments',
        emptyDescription: '暂无策略实验',
        items: recentWork.experiments.map(item => ({
          key: item.id || `experiment-${item.strategyName}-${item.createdAt}`,
          title: item.strategyName || '策略实验',
          detail: `${lotteryCodeLabel(item.scale)} · 回放 ${item.replayWindow || 0} · ${formatDateTime(item.createdAt)}`,
          path: item.id ? `/lottery/experiments/${item.id}` : '/lottery/experiments'
        }))
      },
      {
        key: 'backtests',
        icon: <BarChartOutlined />,
        title: '回测',
        path: '/lottery/backtests',
        emptyDescription: '暂无回测报告',
        items: recentWork.backtests.map(item => ({
          key: item.id || `backtest-${item.strategyName}-${item.createdAt}`,
          title: item.strategyName || '回测报告',
          detail: `${item.presetWindow || item.requestedWindow || '-'} · ROI ${formatRoi(item.netResult, item.totalCost)} · ${formatDateTime(item.createdAt)}`,
          path: item.id ? `/lottery/backtests/${item.id}` : '/lottery/backtests'
        }))
      },
      {
        key: 'exports',
        icon: <DownloadOutlined />,
        title: '导出',
        path: '/lottery/exports',
        emptyDescription: '暂无导出审计',
        items: recentWork.exports.map(item => ({
          key: item.id || `export-${item.targetId || item.generatedAt}`,
          title: lotteryCodeLabel(item.targetType || item.eventType, '导出记录'),
          detail: `${item.rowCount || 0} 行 · ${formatDateTime(item.generatedAt)}`,
          path: '/lottery/exports'
        }))
      }
    ];

    return groups;
  }, [recentWork, savedPredictionHistoryPath, savedTicketsPath]);

  const recentShortcuts = useMemo<WorkbenchRecentShortcut[]>(() => {
    const latestPrediction = recentWork.predictions[0];
    const latestTicket = recentWork.tickets[0];
    const latestBacktest = recentWork.backtests[0];
    const latestExperiment = recentWork.experiments[0];
    const latestExport = recentWork.exports[0];
    const researchKey = latestBacktest?.id
      ? `backtest:${latestBacktest.id}`
      : latestExperiment?.id ? `experiment:${latestExperiment.id}` : '';

    return [
      {
        key: 'prediction',
        icon: <ThunderboltOutlined />,
        label: '预测',
        title: latestPrediction ? `第 ${latestPrediction.targetPeriod || '-'} 期` : '预测历史',
        detail: latestPrediction?.ruleName || latestPrediction?.reason || '打开上次筛选',
        path: latestPrediction?.id ? `/lottery/predictions/${latestPrediction.id}` : savedPredictionHistoryPath
      },
      {
        key: 'ticket',
        icon: <FileTextOutlined />,
        label: '票据',
        title: latestTicket ? `第 ${latestTicket.issue || latestTicket.period || '-'} 期` : '投注记录',
        detail: latestTicket ? `${lotteryStatusLabel(latestTicket.status)} · ${formatDateTime(latestTicket.updatedAt || latestTicket.createdAt)}` : '打开上次筛选',
        path: latestTicket?.issue ? `/lottery/tickets?issue=${latestTicket.issue}` : savedTicketsPath
      },
      {
        key: 'research',
        icon: <ExperimentOutlined />,
        label: '研究',
        title: latestBacktest?.strategyName || latestExperiment?.strategyName || '研究对比',
        detail: latestBacktest ? `回测 · ${formatRoi(latestBacktest.netResult, latestBacktest.totalCost)}` : latestExperiment ? `实验 · ${lotteryCodeLabel(latestExperiment.scale)}` : '打开研究页面',
        path: researchKey ? `/lottery/research?items=${encodeURIComponent(researchKey)}` : '/lottery/research'
      },
      {
        key: 'export',
        icon: <DownloadOutlined />,
        label: '导出',
        title: lotteryCodeLabel(latestExport?.targetType || latestExport?.eventType, '导出审计'),
        detail: latestExport ? `${latestExport.rowCount || 0} 行 · ${formatDateTime(latestExport.generatedAt)}` : '打开报表构建器',
        path: '/lottery/exports'
      },
      {
        key: 'maintenance',
        icon: <SafetyCertificateOutlined />,
        label: '维护',
        title: releaseCheckSummary?.status ? lotteryStatusLabel(releaseCheckSummary.status) : '维护检查',
        detail: releaseCheckSummary?.message || '查看保留和导出检查',
        path: '/lottery/exports'
      }
    ];
  }, [
    recentWork.backtests,
    recentWork.experiments,
    recentWork.exports,
    recentWork.predictions,
    recentWork.tickets,
    releaseCheckSummary?.message,
    releaseCheckSummary?.status,
    savedPredictionHistoryPath,
    savedTicketsPath
  ]);

  const visibleWidgetSettings = widgetSettings.filter(item => item.visible);

  const renderWorkbenchWidget = (key: WorkbenchWidgetKey) => {
    switch (key) {
      case 'status':
        return (
          <section className="lottery-workbench-status-grid">
            {statusCards.map(item => (
              <button key={item.key} type="button" className="lottery-workbench-status-card" onClick={() => navigate(item.path)}>
                <span>{item.icon}</span>
                <div>
                  <strong>{item.value}</strong>
                  <em>{item.label}</em>
                  <small>{item.detail}</small>
                </div>
              </button>
            ))}
          </section>
        );
      case 'closure':
        return (
          <Card
            className="life-panel-card lottery-clean-panel lottery-workbench-closure-card"
            title="本期闭环"
            extra={
              <Space wrap>
                <Tag color={closureNeedsAttentionCount ? 'orange' : 'green'}>
                  完成 {closureCompleteCount}/{closureSteps.length}
                </Tag>
                <Button size="small" icon={<ThunderboltOutlined />} loading={running} onClick={runDailyWork}>
                  执行日常
                </Button>
              </Space>
            }
          >
            <div className="lottery-workbench-closure-list">
              {closureSteps.map((item, index) => (
                <button key={item.key} type="button" onClick={() => navigate(item.path)}>
                  <span className="lottery-workbench-closure-index">{index + 1}</span>
                  <span className="lottery-workbench-closure-icon">{item.icon}</span>
                  <span className="lottery-workbench-closure-copy">
                    <em>{item.label}</em>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <span className="lottery-workbench-closure-meta">
                    <Tag color={queueStatusColor(item.status)}>{lotteryStatusLabel(item.status, 'TODO')}</Tag>
                    {item.count ? <b>{item.count}</b> : null}
                    <small>{item.actionLabel}</small>
                  </span>
                </button>
              ))}
            </div>
          </Card>
        );
      case 'priority':
        return (
          <Card
            className="life-panel-card lottery-clean-panel lottery-workbench-priority-card"
            title="今日优先事项"
            extra={<Tag color={priorityItems.length ? 'orange' : 'green'}>{priorityItems.length ? `${priorityItems.length} 项` : '已清空'}</Tag>}
          >
            {priorityItems.length ? (
              <div className="lottery-workbench-priority-list">
                {priorityItems.map(item => (
                  <button
                    key={item.key}
                    type="button"
                    disabled={!item.path}
                    onClick={() => item.path && navigate(item.path)}
                  >
                    <span className="lottery-workbench-priority-icon">{item.icon}</span>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.detail}</small>
                    </span>
                    <Space size={6}>
                      {item.count ? <em>{item.count}</em> : null}
                      <Tag color={queueStatusColor(item.status)}>{lotteryStatusLabel(item.status, 'TODO')}</Tag>
                      <b>{item.actionLabel}</b>
                    </Space>
                  </button>
                ))}
              </div>
            ) : (
              <Empty description="暂无优先事项" />
            )}
          </Card>
        );
      case 'health':
        return (
          <Card
            className="life-panel-card lottery-clean-panel lottery-workbench-health-card"
            title="运营健康"
            extra={
              <Space wrap>
                <Tag color={operationsHealthColor(operationsHealth?.status)}>{lotteryStatusLabel(operationsHealth?.status)}</Tag>
                <Button size="small" onClick={() => acknowledgeHealth()}>确认</Button>
              </Space>
            }
          >
            <div className="lottery-workbench-health-summary">
              <Progress
                type="circle"
                percent={Math.max(0, Math.min(100, operationsHealth?.score || 0))}
                size={84}
                strokeColor={operationsHealth?.status === 'FAILED' ? '#ff4d4f' : operationsHealth?.status === 'WARNING' ? '#faad14' : '#52c41a'}
              />
              <div>
                <strong>{lotteryMessageLabel(operationsHealth?.message, '等待健康评分')}</strong>
                <span>最近期号 {operationsHealth?.latestIssue || '-'} · 下一期 {operationsHealth?.nextIssue || '-'}</span>
                <Space wrap>
                  <Tag color={operationsHealth?.warningCount ? 'gold' : 'green'}>提醒 {operationsHealth?.warningCount || 0}</Tag>
                  <Tag color={operationsHealth?.pendingActionCount ? 'orange' : 'green'}>待办 {operationsHealth?.pendingActionCount || 0}</Tag>
                  <Tag>{formatDateTime(operationsHealth?.generatedAt)}</Tag>
                </Space>
              </div>
            </div>
            {(operationsHealth?.contributors || []).length ? (
              <div className="lottery-workbench-health-list">
                {(operationsHealth?.contributors || []).map(item => (
                  <button key={item.key || item.label} type="button" onClick={() => item.path && navigate(item.path)}>
                    <Tag color={operationsHealthColor(item.status)}>{lotteryStatusLabel(item.status)}</Tag>
                    <span>
                      <strong>{item.label || item.key}</strong>
                      <small>{item.message || '-'}</small>
                    </span>
                    <em>{item.score ?? 0}</em>
                  </button>
                ))}
              </div>
            ) : (
              <Empty description="暂无健康评分" />
            )}
          </Card>
        );
      case 'reminders':
        return (
          <Card
            className="life-panel-card lottery-clean-panel lottery-workbench-action-queue"
            title="提醒中心"
            extra={
              <Space wrap>
                <Tag color={(reminders?.dueCount || 0) > 0 ? 'orange' : 'green'}>到期 {reminders?.dueCount || 0}</Tag>
                <Tag>稍后 {reminders?.snoozedCount || 0}</Tag>
                <Tag>确认 {reminders?.acknowledgedCount || 0}</Tag>
              </Space>
            }
          >
            {reminderGroups.length > 0 ? (
              <div className="lottery-workbench-action-groups">
                {reminderGroups.map(group => (
                  <section key={group.title} className="lottery-workbench-action-group">
                    <div className="lottery-workbench-action-group-title">
                      <strong>{group.title}</strong>
                      <Tag>{group.items.length}</Tag>
                    </div>
                    <div className="lottery-workbench-action-list">
                      {group.items.map(item => (
                        <article key={`${item.key}-${item.fingerprint}`} className="lottery-workbench-reminder-item">
                          <button
                            type="button"
                            disabled={!item.path}
                            onClick={() => item.path && navigate(item.path)}
                          >
                            <Tag color={queueStatusColor(item.status)}>{lotteryStatusLabel(item.status, 'TODO')}</Tag>
                            <span>
                              <strong>{item.title || item.key}</strong>
                              <small>{item.message || '-'}</small>
                            </span>
                            {item.snoozedUntil ? <em>{formatDateTime(item.snoozedUntil)}</em> : null}
                          </button>
                          <Space size={4}>
                            <Button size="small" onClick={() => snoozeReminder(item.key, item.fingerprint)}>稍后</Button>
                            <Button size="small" type="primary" onClick={() => acknowledgeReminder(item.key, item.fingerprint)}>确认</Button>
                          </Space>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <Empty description="暂无提醒" />
            )}
          </Card>
        );
      case 'issueFocus':
        return (
          <section className="lottery-workbench-issue-focus-panel">
            <div className="lottery-workbench-issue-next">
              {issueNextItems.map(item => (
                <button key={item.key} type="button" onClick={() => navigate(item.path)}>
                  <span className="lottery-workbench-issue-icon">{item.icon}</span>
                  <span>
                    <em>{item.title}</em>
                    <strong>{item.actionLabel}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <Space size={6}>
                    {item.count ? <b>{item.count}</b> : null}
                    <Tag color={queueStatusColor(item.status)}>{lotteryStatusLabel(item.status, 'TODO')}</Tag>
                  </Space>
                </button>
              ))}
            </div>
            {archiveReviewPressure.count > 0 ? (
              <div className="lottery-workbench-archive-note-bar">
                <span>归档复核可沉淀为研究笔记，保存复核原因、证据入口和后续动作。</span>
                <Button size="small" icon={<BookOutlined />} onClick={() => navigate(archiveReviewNotePath)}>
                  记录复核
                </Button>
              </div>
            ) : null}
            <div className="lottery-workbench-issue-focus">
              {issueFocusItems.map(item => (
                <button key={item.key} type="button" onClick={() => navigate(item.path)}>
                  <span className="lottery-workbench-issue-icon">{item.icon}</span>
                  <span>
                    <em>{item.label}</em>
                    <strong>{item.value}</strong>
                    <small>{item.detail}</small>
                  </span>
                  {item.status ? <Tag color={dailyStateColor(item.status)}>{lotteryStatusLabel(item.status)}</Tag> : null}
                </button>
              ))}
            </div>
          </section>
        );
      case 'actionQueue':
        return (
          <Card
            className="life-panel-card lottery-clean-panel lottery-workbench-action-queue"
            title="行动队列"
            extra={<Tag color={actionQueueItems.length ? 'orange' : 'green'}>{actionQueueItems.length} 项</Tag>}
          >
            {actionQueueGroups.length > 0 ? (
              <div className="lottery-workbench-action-groups">
                {actionQueueGroups.map(group => (
                  <section key={group.title} className="lottery-workbench-action-group">
                    <div className="lottery-workbench-action-group-title">
                      <strong>{group.title}</strong>
                      <Tag>{group.items.length}</Tag>
                    </div>
                    <div className="lottery-workbench-action-list">
                      {group.items.map(item => (
                        <button
                          key={item.key}
                          type="button"
                          disabled={!item.path}
                          onClick={() => item.path && navigate(item.path)}
                        >
                          <Tag color={queueStatusColor(item.status)}>{lotteryStatusLabel(item.status, 'TODO')}</Tag>
                          <span>
                            <strong>{item.title}</strong>
                            <small>{item.detail}</small>
                          </span>
                          {item.count ? <em>{item.count}</em> : null}
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <Empty description="暂无待办" />
            )}
          </Card>
        );
      case 'calendar':
        return calendar ? (
          <section className="lottery-workbench-daily-state lottery-workbench-calendar-state">
            <div>
              <strong>{calendar.nextDrawDate || '-'} {calendar.drawWeekday || ''}</strong>
              <span>同步窗口 {formatDateTime(calendar.expectedSyncStartAt)} - {formatDateTime(calendar.expectedSyncEndAt)}</span>
            </div>
            <Space wrap>
              <Tag color={calendar.currentIssueState === 'BEFORE_DRAW' ? 'blue' : 'orange'}>{lotteryStatusLabel(calendar.currentIssueState)}</Tag>
              <Button size="small" icon={<BellOutlined />} onClick={() => navigate('/lottery/alerts')}>
                提醒 {calendar.reminders?.length || 0}
              </Button>
            </Space>
          </section>
        ) : null;
      case 'runbook':
        return (
          <section className="lottery-workbench-runbook-grid">
            {reviewRunbookItems.map(item => (
              <article
                key={item.key}
                role="button"
                tabIndex={0}
                className="lottery-workbench-runbook-panel"
                onClick={() => navigate(item.path)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    navigate(item.path);
                  }
                }}
              >
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                  <Space wrap>
                    {item.evidence.map(label => <Tag key={label}>{label}</Tag>)}
                  </Space>
                </div>
                <Space direction="vertical" align="end">
                  <Tag color={dailyStateColor(item.status)}>{lotteryStatusLabel(item.status)}</Tag>
                  {item.acknowledgeTarget ? (
                    <Button
                      size="small"
                      onClick={event => {
                        event.stopPropagation();
                        if (item.acknowledgeTarget?.type === 'reminder') {
                          acknowledgeReminder(item.acknowledgeTarget.key, item.acknowledgeTarget.fingerprint);
                        } else {
                          acknowledgeHealth(item.acknowledgeTarget?.contributorKey);
                        }
                      }}
                    >
                      {item.acknowledgeTarget.label}
                    </Button>
                  ) : null}
                  <small>{item.actionLabel}</small>
                </Space>
              </article>
            ))}
            <article className="lottery-workbench-runbook-panel lottery-workbench-runbook-note">
              <div>
                <strong>定时同步 Runbook</strong>
                <span>{scheduledRunbook?.message || '暂无定时同步状态'}</span>
              </div>
              <Space wrap>
                <Tag color={scheduledStatusColor(scheduledRunbook?.healthStatus)}>{lotteryStatusLabel(scheduledRunbook?.healthStatus)}</Tag>
                <Tag>{scheduledRunbook?.enabled ? '已启用' : '未启用'}</Tag>
                <Tag>{scheduledRunbook?.cron || '-'}</Tag>
                <Tag>最近 {formatDateTime(scheduledRunbook?.lastRunAt)}</Tag>
              </Space>
            </article>
          </section>
        );
      case 'quickActions':
        return (
          <section className="lottery-workbench-quick-rail" aria-label="彩票快捷动作">
            {quickActions.map(action => (
              <button
                key={action.key}
                type="button"
                className="lottery-workbench-quick-action"
                disabled={action.loading}
                onClick={action.onClick}
              >
                <span className="lottery-workbench-quick-icon">
                  {action.loading ? <SyncOutlined spin /> : action.icon}
                </span>
                <span>
                  <strong>{action.label}</strong>
                  <small>{action.detail}</small>
                </span>
              </button>
            ))}
          </section>
        );
      case 'predictionTraining':
        return (
          <section className="lottery-workbench-main-grid">
            <Card
              className="life-panel-card lottery-clean-panel"
              title="最近预测"
              extra={
                <Space wrap>
                  {summary?.latestPrediction?.id ? (
                    <Button size="small" onClick={() => navigate(`/lottery/predictions/${summary.latestPrediction?.id}`)}>
                      详情
                    </Button>
                  ) : null}
                  <Button size="small" onClick={() => navigate(dailyState?.predictionState?.path || savedPredictionHistoryPath)}>
                    历史
                  </Button>
                </Space>
              }
            >
              {summary?.latestPrediction ? (
                <div className="lottery-workbench-prediction">
                  <div className="lottery-card-title-row">
                    <div>
                      <h2>第 {summary.latestPrediction.targetPeriod} 期</h2>
                      <p>{summary.latestPrediction.ruleName || summary.latestPrediction.reason || '-'}</p>
                    </div>
                    <Tag color="processing">评分 {summary.latestPrediction.score ?? 0}</Tag>
                  </div>
                  <LotteryBalls redNumbers={summary.latestPrediction.redNumbers || []} blueNumber={summary.latestPrediction.blueNumber || ''} />
                  <div className="lottery-latest-meta">
                    <span>基于 {summary.latestPrediction.basedOnPeriod || '-'}</span>
                    <span>{summary.latestPrediction.result?.prizeName || '待开奖'}</span>
                    <span>{formatDateTime(summary.latestPrediction.createdAt)}</span>
                  </div>
                </div>
              ) : (
                <Empty description="暂无预测快照" />
              )}
            </Card>

            <Card
              className="life-panel-card lottery-clean-panel"
              title="训练状态"
              extra={
                <Button size="small" icon={<ThunderboltOutlined />} onClick={() => navigate('/lottery/prediction')}>
                  预测
                </Button>
              }
            >
              <div className="lottery-workbench-training">
                <Progress percent={trainingPercent} status={trainingStatus?.failed ? 'exception' : trainingStatus?.running ? 'active' : 'normal'} />
                <Space wrap>
                  <Tag color={trainingStatus?.running ? 'processing' : trainingStatus?.failed ? 'red' : 'green'}>
                    {lotteryStatusLabel(trainingStatus?.stage || (trainingStatus?.running ? 'RUNNING' : 'IDLE'))}
                  </Tag>
                  <Tag>{trainingStatus?.processed ?? 0}/{trainingStatus?.total ?? 0}</Tag>
                  {trainingStatus?.scale ? <Tag>{lotteryCodeLabel(trainingStatus.scale)}</Tag> : null}
                </Space>
                <span>{trainingStatus?.message || '训练任务未运行'}</span>
              </div>
            </Card>
          </section>
        );
      case 'dailyRunRelease':
        return (
          <section className="lottery-workbench-main-grid">
            <Card className="life-panel-card lottery-clean-panel" title="日常执行结果">
              {stepItems.length > 0 ? (
                <Steps direction="vertical" size="small" items={stepItems} />
              ) : (
                <Empty description="暂无执行记录" />
              )}
            </Card>

            <Card
              className="life-panel-card lottery-clean-panel"
              title="发布检查"
              extra={<Tag color={releaseStatusColor(releaseCheckSummary?.status)}>{lotteryStatusLabel(releaseCheckSummary?.status)}</Tag>}
            >
              {releaseCheckItems.length > 0 ? (
                <div className="lottery-release-check-list">
                  {releaseCheckItems.map(item => (
                    <button
                      key={item.key || item.label}
                      type="button"
                      onClick={() => navigate(item.path || '/lottery/exports?focus=release-archive')}
                    >
                      <Tag color={releaseStatusColor(item.status)}>{lotteryStatusLabel(item.status)}</Tag>
                      <span>
                        <strong>{item.label || item.key}</strong>
                        <small>{item.message || '-'}</small>
                      </span>
                      {item.pendingCount ? <em>{item.pendingCount}</em> : null}
                    </button>
                  ))}
                </div>
              ) : (
                <Empty description="暂无发布检查" />
              )}
            </Card>
          </section>
        );
      case 'recentWork':
        return (
          <section className="lottery-workbench-main-grid lottery-workbench-single-grid">
            <Card
              className="life-panel-card lottery-clean-panel lottery-workbench-recent-card"
              title="最近工作"
              extra={
                <Button size="small" icon={<HistoryOutlined />} onClick={() => navigate(savedPredictionHistoryPath)}>
                  历史
                </Button>
              }
            >
              <div className="lottery-workbench-shortcut-grid">
                {recentShortcuts.map(item => (
                  <button key={item.key} type="button" onClick={() => navigate(item.path)}>
                    <span>{item.icon}</span>
                    <small>{item.label}</small>
                    <strong>{item.title}</strong>
                    <em>{item.detail}</em>
                  </button>
                ))}
              </div>
              <div className="lottery-workbench-recent-grid">
                {recentWorkGroups.map(group => (
                  <section className="lottery-workbench-recent-group" key={group.key}>
                    <div className="lottery-workbench-recent-title">
                      <span>{group.icon}</span>
                      <strong>{group.title}</strong>
                      <Button type="link" size="small" onClick={() => navigate(group.path)}>
                        全部
                      </Button>
                    </div>
                    {group.items.length > 0 ? (
                      <div className="lottery-workbench-recent-list">
                        {group.items.map(item => (
                          <article key={item.key} className="lottery-workbench-recent-item">
                            <button type="button" onClick={() => navigate(item.path)}>
                              <strong>{item.title}</strong>
                              <small>{item.detail}</small>
                            </button>
                            {item.actions?.length ? (
                              <div className="lottery-workbench-recent-actions">
                                {item.actions.map(action => (
                                  <Button key={action.label} size="small" type="link" onClick={() => navigate(action.path)}>
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={group.emptyDescription || '暂无记录'} />
                    )}
                  </section>
                ))}
              </div>
            </Card>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <LifePageShell
      className="lottery-prediction-page lottery-workbench-page"
      eyebrow="彩票数据"
      title="日常工作台"
      actions={
        <Space wrap>
          <Button
            icon={<SettingOutlined />}
            type={showWidgetConfig ? 'primary' : 'default'}
            onClick={() => setShowWidgetConfig(value => !value)}
          >
            布局
          </Button>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadSummary}>
            刷新
          </Button>
          <Button icon={<ThunderboltOutlined />} onClick={() => navigate('/lottery/mobile')}>
            移动指挥
          </Button>
          <Button icon={<SyncOutlined />} onClick={() => navigate(savedSyncPath)}>
            同步运维
          </Button>
          <Button type="primary" icon={<ThunderboltOutlined />} loading={running} onClick={runDailyWork}>
            执行日常
          </Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}
      {qualityIssueCount > 0 ? (
        <Alert
          className="lottery-overview-status-alert"
          type="warning"
          showIcon
          message={`发现 ${qualityIssueCount} 项数据质量问题`}
          action={
            <Button size="small" icon={<WarningOutlined />} onClick={() => navigate('/lottery/data-quality')}>
              查看
            </Button>
          }
        />
      ) : null}
      {budgetStatus?.warnings?.length ? (
        <Alert
          className="lottery-overview-status-alert"
          type="warning"
          showIcon
          message={budgetStatus.warnings.map(item => item.message).join('；')}
          action={
            <Button size="small" onClick={() => navigate('/lottery/settings')}>
              设置
            </Button>
          }
        />
      ) : null}

      {showWidgetConfig ? (
        <section className="lottery-workbench-widget-config">
          <div className="lottery-workbench-widget-config-head">
            <div>
              <strong>工作台布局</strong>
              <span>{visibleWidgetSettings.length}/{widgetSettings.length} 个组件已显示</span>
              <Tag color={workbenchPreferenceSyncColor(widgetPreferenceSync)}>
                {workbenchPreferenceSyncLabel(widgetPreferenceSync)}
              </Tag>
            </div>
            <Button size="small" onClick={resetWidgetSettings}>
              重置
            </Button>
          </div>
          <div className="lottery-workbench-widget-list">
            {widgetSettings.map((item, index) => {
              const meta = workbenchWidgetMetaMap.get(item.key);
              return (
                <div
                  key={item.key}
                  className={`lottery-workbench-widget-row${item.visible ? '' : ' is-hidden'}`}
                >
                  <span className="lottery-workbench-widget-index">{index + 1}</span>
                  <div className="lottery-workbench-widget-copy">
                    <strong>{meta?.label || item.key}</strong>
                    <small>{meta?.description || '-'}</small>
                  </div>
                  <Space className="lottery-workbench-widget-actions" size={4}>
                    <Tooltip title="上移">
                      <Button
                        size="small"
                        icon={<UpOutlined />}
                        disabled={index === 0}
                        onClick={() => moveWidget(item.key, -1)}
                      />
                    </Tooltip>
                    <Tooltip title="下移">
                      <Button
                        size="small"
                        icon={<DownOutlined />}
                        disabled={index === widgetSettings.length - 1}
                        onClick={() => moveWidget(item.key, 1)}
                      />
                    </Tooltip>
                    <Tooltip title={item.visible ? '隐藏' : '显示'}>
                      <Button
                        size="small"
                        icon={item.visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        onClick={() => toggleWidget(item.key)}
                      />
                    </Tooltip>
                  </Space>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <Spin spinning={loading && !summary}>
        {visibleWidgetSettings.length > 0 ? (
          visibleWidgetSettings.map(item => (
            <Fragment key={item.key}>
              {renderWorkbenchWidget(item.key)}
            </Fragment>
          ))
        ) : (
          <Empty description="所有工作台组件已隐藏" />
        )}

        <div className="lottery-workbench-generated">
          <ClockCircleOutlined />
          <span>生成时间：{formatDateTime(summary?.generatedAt || dailyRunResult?.generatedAt)}</span>
        </div>
      </Spin>
    </LifePageShell>
  );
};

export default LotteryWorkbenchPage;
