import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, Button, Card, Empty, Input, Progress, Select, Space, Spin, Tag } from 'antd';
import {
  BellOutlined,
  BookOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  FileTextOutlined,
  MobileOutlined,
  PieChartOutlined,
  ReloadOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  TrophyOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import { useI18n } from '../contexts/I18nContext';
import {
  lotteryBacktestApi,
  lotteryDecisionSetApi,
  lotteryExportApi,
  lotteryLedgerApi,
  lotteryOperationsApi,
  lotteryOutcomeApi,
  lotteryRecommendationApi,
  lotteryReminderApi,
  lotteryStrategyNoteApi,
  lotteryTicketApi,
  lotteryTicketPackApi,
  lotteryWorkbenchApi,
  type LotteryAuditEvent,
  type LotteryBacktestReport,
  type LotteryDecisionSet,
  type LotteryDecisionOutcomeItem,
  type LotteryDecisionOutcomeSummary,
  type LotteryIssueLedger,
  type LotteryLedgerSummary,
  type LotteryOperationsHealthSummary,
  type LotteryOutcomeAttributionRollup,
  type LotteryPageResponse,
  type LotteryRecommendationRollup,
  type LotteryReminderSummary,
  type LotteryStrategyNote,
  type LotteryTicketPack,
  type LotteryTicketSummary,
  type LotteryWorkbenchSummary
} from '../services/api';
import {
  aggregateMiniGptPostCorpusOutcomes,
  hasMiniGptResearchProvenance,
  lotteryOverfitWarningsText,
  MINI_GPT_OBSERVATION_BOUNDARY_METADATA,
  MINI_GPT_OBSERVATION_BOUNDARY_STATES,
  MINI_GPT_POST_CORPUS_SMALL_SAMPLE_ISSUES,
  MINI_GPT_POST_CORPUS_SNAPSHOT_LIMIT
} from '../utils/lotteryBacktestEvidence';
import { lotteryMessageLabel, lotteryStatusLabel } from '../utils/lotteryStatusLabel';
import './LotteryOverviewPage.css';

interface MonthEndMetric {
  key: string;
  icon: ReactNode;
  label: string;
  value: ReactNode;
  detail: string;
  path: string;
  status?: string;
}

interface ArchiveItem {
  key: string;
  scope: string;
  title: string;
  detail: string;
  path: string;
  status?: string;
  count?: number;
}

interface NarrativeItem {
  key: string;
  title: string;
  body: string;
  status?: string;
  path: string;
}

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
  return `¥${Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;
};

const formatPercent = (value?: number) => {
  if (value === undefined || value === null) {
    return '-';
  }
  return `${Number(value).toFixed(2)}%`;
};

const statusColor = (status?: string) => {
  if (status === 'PASS' || status === 'COMPLETE') return 'green';
  if (status === 'WARNING' || status === 'MANUAL') return 'gold';
  if (status === 'FAILED' || status === 'OVER') return 'red';
  if (status === 'PENDING' || status === 'SNOOZED') return 'orange';
  return 'default';
};

const archiveReviewPriority = (status?: string) => {
  if (status === 'FAILED' || status === 'OVER') return 0;
  if (status === 'WARNING' || status === 'MANUAL') return 1;
  if (status === 'PENDING' || status === 'SNOOZED') return 2;
  return 3;
};

const sortIssueLedgers = (items: LotteryIssueLedger[]) =>
  [...items].sort((left, right) => Number(right.period || right.issue || 0) - Number(left.period || left.issue || 0));

const attributionReviewRows = (rollup?: LotteryOutcomeAttributionRollup) =>
  (rollup?.rows || [])
    .filter(item => item.dimension !== 'issue')
    .sort((left, right) => (right.warningCount || 0) - (left.warningCount || 0))
    .slice(0, 5);

const attributionQualityLabel = (quality?: string) => {
  const labels: Record<string, string> = {
    STABLE: '稳定',
    OBSERVE: '观察中',
    WATCH: '需复核',
    UNDER_TESTED: '样本不足',
    NEGATIVE: '负向'
  };
  return labels[quality || ''] || lotteryStatusLabel(quality);
};

const archiveScopeLabel = (scope: string) => {
  const labels: Record<string, string> = {
    issue: '期号',
    month: '月份',
    outcome: '归因',
    recommendation: '推荐',
    strategy: '策略',
    operations: '运营',
    release: '发布'
  };
  return labels[scope] || scope;
};

const safeCount = (value?: number) => Number(value || 0);

const researchReviewLabel = (action?: string, isEnglish = false) => {
  const labels: Record<string, [string, string]> = {
    PROMOTE: ['推广', 'Promote'],
    WATCH: ['观察', 'Watch'],
    PAUSE: ['暂停', 'Pause'],
    RETIRE: ['退役', 'Retire']
  };
  return labels[action || '']?.[isEnglish ? 1 : 0] || action || (isEnglish ? 'Not Reviewed' : '未复核');
};

const researchReviewColor = (action?: string) => {
  if (action === 'PROMOTE') return 'green';
  if (action === 'WATCH' || action === 'PAUSE') return 'gold';
  return 'default';
};

const comparisonState = (value?: boolean) => value === true ? 'PASS' : value === false ? 'FAIL' : 'UNKNOWN';

const decisionRecency = (item: LotteryDecisionOutcomeItem) => Math.max(
  item.reviewedAt || 0,
  item.updatedAt || 0,
  item.createdAt || 0
);

const archiveSupportedExportTypes = new Set([
  'tickets',
  'ledger-issues',
  'predictions',
  'experiments',
  'backtests',
  'rule-evidence',
  'replay-evidence',
  'decision-sets',
  'decision-outcomes',
  'ticket-import-previews',
  'budget-prechecks',
  'settlement-reviews',
  'sync-logs',
  'probe-logs'
]);

const archiveScopeOptions = [
  { label: '全部范围', value: 'all' },
  { label: '期号', value: 'issue' },
  { label: '月份', value: 'month' },
  { label: '归因', value: 'outcome' },
  { label: '推荐', value: 'recommendation' },
  { label: '策略', value: 'strategy' },
  { label: '发布', value: 'release' }
];

const archiveStatusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '通过', value: 'PASS' },
  { label: '警示', value: 'WARNING' },
  { label: '失败', value: 'FAILED' },
  { label: '手动', value: 'MANUAL' }
];

const buildArchivePath = (base: string, params: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  });
  const serialized = query.toString();
  return serialized ? `${base}?${serialized}` : base;
};

const archivePathForIssue = (issue: string) => buildArchivePath('/lottery/tickets', { issue });

const archivePathForStrategyNote = (item: LotteryStrategyNote) => buildArchivePath('/lottery/research/notebook', {
  targetIssue: item.targetIssue,
  title: item.title || item.ruleName,
  status: item.status
});

const archivePathForExportAudit = (item: LotteryAuditEvent) => {
  const exportType = archiveSupportedExportTypes.has(item.targetType || '')
    ? item.targetType
    : archiveSupportedExportTypes.has(item.eventType || '')
      ? item.eventType
      : undefined;
  return buildArchivePath('/lottery/exports', {
    type: exportType,
    preset: exportType ? undefined : 'long-term-research',
    issue: exportType === 'tickets' || exportType === 'ledger-issues' || exportType === 'settlement-reviews' ? item.targetId : undefined,
    targetIssue: exportType === 'decision-sets' || exportType === 'decision-outcomes' ? item.targetId : undefined,
    ruleName: exportType === 'rule-evidence' ? item.targetId : undefined
  });
};

const LotteryMonthEndReviewPage = () => {
  const navigate = useNavigate();
  const { language, translateText } = useI18n();
  const isEnglish = language.toLowerCase().startsWith('en');
  const researchText = (zh: string, en: string) => isEnglish ? en : zh;
  const [workbench, setWorkbench] = useState<LotteryWorkbenchSummary>();
  const [health, setHealth] = useState<LotteryOperationsHealthSummary>();
  const [ledger, setLedger] = useState<LotteryLedgerSummary>();
  const [issues, setIssues] = useState<LotteryIssueLedger[]>([]);
  const [tickets, setTickets] = useState<LotteryTicketSummary>();
  const [decisions, setDecisions] = useState<LotteryDecisionOutcomeSummary>();
  const [attributionRollup, setAttributionRollup] = useState<LotteryOutcomeAttributionRollup>();
  const [recommendationRollup, setRecommendationRollup] = useState<LotteryRecommendationRollup>();
  const [notes, setNotes] = useState<LotteryPageResponse<LotteryStrategyNote>>();
  const [reminders, setReminders] = useState<LotteryReminderSummary>();
  const [audits, setAudits] = useState<LotteryAuditEvent[]>([]);
  const [backtests, setBacktests] = useState<LotteryBacktestReport[]>([]);
  const [ticketPacks, setTicketPacks] = useState<LotteryTicketPack[]>([]);
  const [postCorpusOutcomeSummary, setPostCorpusOutcomeSummary] = useState<LotteryDecisionOutcomeSummary>();
  const [postCorpusDecisionPage, setPostCorpusDecisionPage] = useState<LotteryPageResponse<LotteryDecisionSet>>();
  const [postCorpusBacktestsById, setPostCorpusBacktestsById] = useState<Record<string, LotteryBacktestReport | null>>({});
  const [postCorpusObservationError, setPostCorpusObservationError] = useState<string>();
  const [postCorpusScopeError, setPostCorpusScopeError] = useState<string>();
  const [archiveQuery, setArchiveQuery] = useState('');
  const [archiveScopeFilter, setArchiveScopeFilter] = useState('all');
  const [archiveStatusFilter, setArchiveStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const reviewRequestIdRef = useRef(0);

  const loadReview = useCallback(async () => {
    const requestId = reviewRequestIdRef.current + 1;
    reviewRequestIdRef.current = requestId;
    setLoading(true);
    setError(undefined);
    setPostCorpusObservationError(undefined);
    setPostCorpusScopeError(undefined);
    try {
      const [workbenchData, healthData, ledgerData, issueData, ticketData, decisionData, attributionData, recommendationData, noteData, reminderData, auditData, backtestData, ticketPackData, postCorpusOutcomeResult, postCorpusDecisionPageResult] = await Promise.all([
        lotteryWorkbenchApi.summary(),
        lotteryOperationsApi.health(),
        lotteryLedgerApi.summary(),
        lotteryLedgerApi.issues(),
        lotteryTicketApi.summary(),
        lotteryDecisionSetApi.outcomes({ includeArchived: true, limit: 12 }),
        lotteryOutcomeApi.rollup({ window: 'month-to-date' }),
        lotteryRecommendationApi.rollup({ window: 'recent30', limit: 30 }),
        lotteryStrategyNoteApi.notes({ page: 1, pageSize: 6 }),
        lotteryReminderApi.summary(),
        lotteryExportApi.auditEvents({ page: 1, pageSize: 8 }),
        lotteryBacktestApi.reports({ page: 0, pageSize: 24 }).catch(backtestError => {
          console.error('读取 MiniGPT 回测列表失败:', backtestError);
          return { items: [] } as LotteryPageResponse<LotteryBacktestReport>;
        }),
        lotteryTicketPackApi.ticketPacks({ includeArchived: true, page: 1, pageSize: 24 }).catch(ticketPackError => {
          console.error('读取 MiniGPT 票包列表失败:', ticketPackError);
          return { items: [] } as LotteryPageResponse<LotteryTicketPack>;
        }),
        lotteryDecisionSetApi.outcomes({
          includeArchived: true,
          limit: MINI_GPT_POST_CORPUS_SNAPSHOT_LIMIT
        }).then(data => ({ data })).catch(postCorpusError => ({ error: postCorpusError })),
        lotteryDecisionSetApi.decisionSets({
          includeArchived: true,
          page: 1,
          pageSize: MINI_GPT_POST_CORPUS_SNAPSHOT_LIMIT
        }).then(data => ({ data })).catch(scopeError => ({ error: scopeError }))
      ]);
      const reviewedMiniGptDecision = [...(decisionData?.items || [])]
        .filter(item => hasMiniGptResearchProvenance(item.provenance) && item.reviewBacktestId)
        .sort((left, right) => decisionRecency(right) - decisionRecency(left))[0];
      const postCorpusOutcomes = 'data' in postCorpusOutcomeResult ? postCorpusOutcomeResult.data : undefined;
      const postCorpusPage = 'data' in postCorpusDecisionPageResult ? postCorpusDecisionPageResult.data : undefined;
      const preview = aggregateMiniGptPostCorpusOutcomes(postCorpusOutcomes?.items || []);
      const reviewedBacktestIds = new Set(preview.groups.flatMap(group => group.decisions)
        .filter(decision => decision.stableProvenance)
        .map(decision => decision.item.reviewBacktestId?.trim())
        .filter((id): id is string => Boolean(id)));
      if (reviewedMiniGptDecision?.reviewBacktestId) {
        reviewedBacktestIds.add(reviewedMiniGptDecision.reviewBacktestId);
      }
      const exactBacktestEntries = await Promise.all([...reviewedBacktestIds].map(async id => {
        try {
          return [id, await lotteryBacktestApi.detail(id)] as const;
        } catch {
          return [id, null] as const;
        }
      }));
      if (requestId !== reviewRequestIdRef.current) return;
      const exactBacktestsById = Object.fromEntries(exactBacktestEntries);
      const resolvedBacktests = [
        ...exactBacktestEntries.map(([, report]) => report).filter((report): report is LotteryBacktestReport => Boolean(report)),
        ...(backtestData?.items || [])
      ].filter((report, index, items) => items.findIndex(item => item.id === report.id) === index);
      setWorkbench(workbenchData);
      setHealth(healthData);
      setLedger(ledgerData);
      setIssues(issueData || []);
      setTickets(ticketData);
      setDecisions(decisionData);
      setAttributionRollup(attributionData);
      setRecommendationRollup(recommendationData);
      setNotes(noteData);
      setReminders(reminderData);
      setAudits(auditData?.items || []);
      setBacktests(resolvedBacktests);
      setTicketPacks(ticketPackData?.items || []);
      setPostCorpusOutcomeSummary(postCorpusOutcomes);
      setPostCorpusDecisionPage(postCorpusPage);
      setPostCorpusBacktestsById(exactBacktestsById);
      if ('error' in postCorpusOutcomeResult) {
        console.error('读取 MiniGPT 月末语料后观察失败:', postCorpusOutcomeResult.error);
        setPostCorpusObservationError(postCorpusOutcomeResult.error instanceof Error
          ? postCorpusOutcomeResult.error.message
          : '读取 MiniGPT 月末语料后观察失败');
      }
      if ('error' in postCorpusDecisionPageResult) {
        console.error('读取 MiniGPT 月末观察范围失败:', postCorpusDecisionPageResult.error);
        setPostCorpusScopeError(postCorpusDecisionPageResult.error instanceof Error
          ? postCorpusDecisionPageResult.error.message
          : '读取 MiniGPT 月末观察范围失败');
      }
    } catch (requestError) {
      if (requestId !== reviewRequestIdRef.current) return;
      console.error('读取彩票月末复盘失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取彩票月末复盘失败');
    } finally {
      if (requestId === reviewRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadReview();
    return () => {
      reviewRequestIdRef.current += 1;
    };
  }, [loadReview]);

  const recentIssues = useMemo(() => sortIssueLedgers(issues).slice(0, 5), [issues]);
  const exportAudits = useMemo(
    () => audits.filter(item => item.eventType === 'EXPORT' || item.eventType === 'REPORT_EXPORT' || item.targetType === 'decision-outcomes'),
    [audits]
  );
  const releaseChecks = useMemo(() => workbench?.releaseCheckSummary?.checks || [], [workbench?.releaseCheckSummary?.checks]);
  const attributionRows = useMemo(() => attributionReviewRows(attributionRollup), [attributionRollup]);
  const miniGptDecision = useMemo<LotteryDecisionOutcomeItem | undefined>(() => (
    [...(decisions?.items || [])]
      .filter(item => hasMiniGptResearchProvenance(item.provenance) && item.reviewBacktestId)
      .sort((left, right) => decisionRecency(right) - decisionRecency(left))[0]
  ), [decisions?.items]);
  const miniGptBacktest = useMemo<LotteryBacktestReport | undefined>(() => {
    if (!miniGptDecision?.reviewBacktestId) return undefined;
    return backtests.find(item => item.id === miniGptDecision.reviewBacktestId
      && item.decisionSetId === miniGptDecision.decisionSetId);
  }, [backtests, miniGptDecision]);
  const miniGptTicketPack = useMemo<LotteryTicketPack | undefined>(() => {
    if (!miniGptDecision?.decisionSetId) return undefined;
    return ticketPacks.find(item => item.decisionSetId === miniGptDecision.decisionSetId
      || item.sourceId === miniGptDecision.decisionSetId);
  }, [miniGptDecision?.decisionSetId, ticketPacks]);
  const miniGptProvenance = miniGptDecision?.provenance || miniGptBacktest?.provenance || miniGptTicketPack?.provenance;
  const miniGptWarnings = useMemo(() => Array.from(new Set([
    ...(miniGptBacktest?.overfitWarnings || []),
    ...(miniGptDecision?.backtestWarnings || [])
  ])), [miniGptBacktest?.overfitWarnings, miniGptDecision?.backtestWarnings]);
  const miniGptGenerationIds = useMemo(() => Array.from(new Set(
    (miniGptDecision?.candidates || [])
      .map(candidate => candidate.generationId || candidate.provenance?.generationId)
      .filter((value): value is string => Boolean(value))
  )), [miniGptDecision?.candidates]);
  const miniGptComparisonFailed = miniGptBacktest?.sameWindow === false || miniGptBacktest?.sameBudget === false;
  const miniGptComparisonPassed = miniGptBacktest?.sameWindow === true && miniGptBacktest?.sameBudget === true;
  const miniGptTargetIssue = miniGptDecision?.targetIssue || miniGptTicketPack?.targetIssue;
  const miniGptDecisionId = miniGptDecision?.decisionSetId || miniGptBacktest?.decisionSetId || miniGptTicketPack?.decisionSetId;
  const miniGptDecisionPath = buildArchivePath('/lottery/predictions/decision', {
    decisionSetId: miniGptDecisionId,
    targetIssue: miniGptTargetIssue,
    backtestId: miniGptBacktest?.id || miniGptDecision?.reviewBacktestId
  });
  const miniGptTicketPackPath = buildArchivePath('/lottery/ticket-packs', {
    packId: miniGptTicketPack?.id,
    decisionSetId: miniGptDecisionId,
    targetIssue: miniGptTargetIssue
  });
  const miniGptOutcomePath = buildArchivePath('/lottery/outcomes', {
    issue: miniGptTargetIssue,
    decisionSetId: miniGptDecisionId
  });
  const miniGptLedgerPath = buildArchivePath('/lottery/ledger', miniGptProvenance?.batchId ? {
    dimension: 'minigpt_batch',
    value: miniGptProvenance.batchId,
    issue: miniGptTargetIssue
  } : {
    dimension: 'minigpt_run',
    value: miniGptProvenance?.runId,
    issue: miniGptTargetIssue
  });
  const miniGptExportPath = buildArchivePath('/lottery/exports', {
    preset: 'v47-minigpt-research'
  });
  const hasMiniGptHandoff = Boolean(miniGptProvenance || miniGptDecision || miniGptBacktest || miniGptTicketPack);
  const miniGptHandoffStatus = !hasMiniGptHandoff
    ? 'MANUAL'
    : miniGptComparisonFailed
      ? 'FAILED'
      : !miniGptBacktest
        || !miniGptComparisonPassed
        || miniGptWarnings.length
        || !miniGptDecision?.reviewAction
        ? 'WARNING'
        : 'PASS';
  const postCorpusObservation = useMemo(() => aggregateMiniGptPostCorpusOutcomes(
    postCorpusOutcomeSummary?.items || [],
    postCorpusBacktestsById
  ), [postCorpusBacktestsById, postCorpusOutcomeSummary?.items]);
  const postCorpusSnapshotTotal = postCorpusDecisionPage
    ? Math.max(Number(postCorpusDecisionPage.total || 0), postCorpusObservation.boundedInputCount)
    : undefined;
  const postCorpusSnapshotTruncated = postCorpusDecisionPage
    ? Boolean(postCorpusDecisionPage.hasNext)
      || Number(postCorpusSnapshotTotal || 0) > postCorpusObservation.boundedInputCount
    : undefined;
  const postCorpusHasDuplicateIssues = postCorpusObservation.observedDecisionCount > postCorpusObservation.distinctIssueCount;
  const postCorpusHasPartialFinancialCoverage = postCorpusObservation.financial.decisionCount
    < postCorpusObservation.observedDecisionCount;
  const postCorpusHasIncompleteBaselineCoverage = postCorpusObservation.comparableBaselineCount
    < postCorpusObservation.observedDecisionCount;
  const monthEndScore = useMemo(() => {
    const healthScore = health?.score ?? 0;
    const ticketScore = tickets?.pendingTicketCount ? Math.max(40, 100 - tickets.pendingTicketCount * 12) : 100;
    const decisionScore = decisions?.warningCount ? Math.max(40, 100 - decisions.warningCount * 8) : 100;
    const attributionScore = attributionRows.length ? Math.max(45, 100 - attributionRows.reduce((sum, item) => sum + (item.warningCount || 0), 0) * 8) : 100;
    const recommendationScore = recommendationRollup?.recommendationCount ? Math.max(45, 100 - (recommendationRollup.staleCount || 0) * 12 - Math.max(0, (recommendationRollup.activeCount || 0) - (recommendationRollup.appliedCount || 0)) * 5) : 70;
    const exportScore = exportAudits.length ? 100 : 60;
    const reminderScore = reminders?.activeCount ? Math.max(40, 100 - reminders.activeCount * 8) : 100;
    return Math.round((healthScore + ticketScore + decisionScore + attributionScore + recommendationScore + exportScore + reminderScore) / 7);
  }, [attributionRows, decisions?.warningCount, exportAudits.length, health?.score, recommendationRollup, reminders?.activeCount, tickets?.pendingTicketCount]);

  const metrics: MonthEndMetric[] = [
    {
      key: 'ledger',
      icon: <PieChartOutlined />,
      label: '账本净值',
      value: formatCurrency(ledger?.netResult),
      detail: `ROI ${formatPercent(ledger?.roiPercent)} · 30日 ${formatCurrency(ledger?.rollingThirtyDayNetResult)}`,
      path: '/lottery/ledger',
      status: ledger?.netResult && ledger.netResult >= 0 ? 'PASS' : 'WARNING'
    },
    {
      key: 'tickets',
      icon: <FileTextOutlined />,
      label: '票据闭环',
      value: `${tickets?.checkedTicketCount || 0}/${tickets?.ticketCount || 0}`,
      detail: `待核 ${tickets?.pendingTicketCount || 0} · 中奖 ${tickets?.winningTicketCount || 0}`,
      path: '/lottery/tickets',
      status: tickets?.pendingTicketCount ? 'PENDING' : 'PASS'
    },
    {
      key: 'decisions',
      icon: <SafetyCertificateOutlined />,
      label: '决策复盘',
      value: decisions?.savedDecisionSetCount || 0,
      detail: `候选 ${decisions?.candidateCount || 0} · 警示 ${decisions?.warningCount || 0}`,
      path: '/lottery/predictions/decision',
      status: decisions?.warningCount ? 'WARNING' : 'PASS'
    },
    {
      key: 'attribution',
      icon: <BranchesOutlined />,
      label: '归因闭环',
      value: attributionRollup?.issueCount || 0,
      detail: `样本 ${attributionRollup?.ticketCount || 0} · 警示 ${attributionRows.reduce((sum, item) => sum + (item.warningCount || 0), 0)}`,
      path: '/lottery/outcomes',
      status: attributionRows.some(item => (item.warningCount || 0) > 0) ? 'WARNING' : (attributionRollup?.issueCount ? 'PASS' : 'MANUAL')
    },
    {
      key: 'recommendation',
      icon: <CheckCircleOutlined />,
      label: '推荐跟进',
      value: recommendationRollup?.appliedCount || 0,
      detail: `待处理 ${recommendationRollup?.activeCount || 0} · 过期 ${recommendationRollup?.staleCount || 0}`,
      path: '/lottery/recommendations',
      status: recommendationRollup?.staleCount ? 'WARNING' : (recommendationRollup?.recommendationCount ? 'PASS' : 'MANUAL')
    },
    {
      key: 'notes',
      icon: <BookOutlined />,
      label: '策略笔记',
      value: notes?.total || notes?.items?.length || 0,
      detail: `本页证据 ${notes?.items?.reduce((sum, item) => sum + (item.evidence?.length || 0), 0) || 0} 条`,
      path: '/lottery/research/notebook',
      status: notes?.items?.length ? 'PASS' : 'MANUAL'
    },
    {
      key: 'health',
      icon: <TrophyOutlined />,
      label: '运营健康',
      value: health?.score ?? 0,
      detail: lotteryMessageLabel(health?.message, '等待健康评分'),
      path: '/lottery/workbench',
      status: health?.status
    },
    {
      key: 'exports',
      icon: <DownloadOutlined />,
      label: '导出证据',
      value: exportAudits.length,
      detail: exportAudits[0] ? `${exportAudits[0].targetType || exportAudits[0].eventType} · ${formatDateTime(exportAudits[0].generatedAt)}` : '暂无近期导出证据',
      path: '/lottery/exports?type=decision-outcomes',
      status: exportAudits.length ? 'PASS' : 'MANUAL'
    }
  ];

  const allArchiveItems = useMemo<ArchiveItem[]>(() => {
    const items: ArchiveItem[] = [];
    items.push({
      key: 'month:current',
      scope: 'month',
      title: '本月复盘',
      detail: `账本 ${formatCurrency(ledger?.netResult)} · 归因 ${attributionRollup?.issueCount || 0} 期 · 推荐 ${recommendationRollup?.recommendationCount || 0} 条`,
      path: '/lottery/exports?preset=month-end',
      status: monthEndScore >= 85 ? 'PASS' : monthEndScore >= 65 ? 'WARNING' : 'FAILED',
      count: monthEndScore
    });
    recentIssues.forEach(item => {
      const issue = String(item.issue || item.period || '-');
      items.push({
        key: `issue:${issue}`,
        scope: 'issue',
        title: `第 ${issue} 期`,
        detail: `票据 ${item.checkedTicketCount || 0}/${item.ticketCount || 0} · ROI ${formatPercent(item.roiPercent)} · ${formatCurrency(item.netResult)}`,
        path: archivePathForIssue(issue),
        status: item.netResult && item.netResult >= 0 ? 'PASS' : 'WARNING',
        count: item.ticketCount
      });
    });
    attributionRows.forEach(item => {
      items.push({
        key: `outcome:${item.dimension}:${item.key}`,
        scope: 'outcome',
        title: item.label || item.key || '归因维度',
        detail: `${item.issueCount || 0} 期 · 样本 ${item.sampleCount || 0} · 警示 ${item.warningCount || 0}`,
        path: item.path || '/lottery/outcomes',
        status: item.warningCount ? 'WARNING' : 'PASS',
        count: item.sampleCount
      });
    });
    (recommendationRollup?.transitions || []).slice(0, 5).forEach(item => {
      items.push({
        key: `recommendation:${item.day}:${item.lifecycleStatus}:${item.recommendationState}`,
        scope: 'recommendation',
        title: `${item.day || '-'} 推荐流转`,
        detail: `${lotteryStatusLabel(item.lifecycleStatus, 'OPEN')} · ${lotteryStatusLabel(item.recommendationState, 'WATCH')}`,
        path: buildArchivePath('/lottery/recommendations', {
          recommendationState: item.recommendationState,
          preset: item.lifecycleStatus === 'ARCHIVED' ? 'STALE_EVIDENCE' : 'OPEN'
        }),
        status: item.lifecycleStatus,
        count: item.count
      });
    });
    (notes?.items || []).slice(0, 5).forEach(item => {
      items.push({
        key: `strategy:${item.id || item.title}`,
        scope: 'strategy',
        title: item.title || '策略笔记',
        detail: `${item.ruleName || item.targetIssue || '研究假设'} · 证据 ${item.evidence?.length || 0} 条`,
        path: archivePathForStrategyNote(item),
        status: item.status,
        count: item.evidence?.length
      });
    });
    exportAudits.slice(0, 5).forEach(item => {
      items.push({
        key: `release:${item.id || item.generatedAt}`,
        scope: 'release',
        title: item.targetType || item.eventType || '导出证据',
        detail: `${formatDateTime(item.generatedAt)} · ${item.rowCount || 0} 行`,
        path: archivePathForExportAudit(item),
        status: 'PASS',
        count: item.rowCount
      });
    });
    return items;
  }, [attributionRollup?.issueCount, attributionRows, exportAudits, ledger?.netResult, monthEndScore, notes?.items, recentIssues, recommendationRollup]);

  const archiveItems = useMemo<ArchiveItem[]>(() => {
    const keyword = archiveQuery.trim().toLowerCase();
    return allArchiveItems
      .filter(item => archiveScopeFilter === 'all' || item.scope === archiveScopeFilter)
      .filter(item => archiveStatusFilter === 'all' || item.status === archiveStatusFilter)
      .filter(item => !keyword || `${archiveScopeLabel(item.scope)} ${lotteryStatusLabel(item.status)} ${item.title} ${item.detail}`.toLowerCase().includes(keyword))
      .slice(0, 12);
  }, [allArchiveItems, archiveQuery, archiveScopeFilter, archiveStatusFilter]);

  const archiveReviewQueueItems = useMemo<ArchiveItem[]>(() => archiveItems
    .filter(item => archiveReviewPriority(item.status) < 3)
    .sort((left, right) => archiveReviewPriority(left.status) - archiveReviewPriority(right.status))
    .slice(0, 6), [archiveItems]);

  const archiveEvidenceExportPath = useMemo(() => buildArchivePath('/lottery/exports', {
    preset: 'v34-archive-search',
    archiveScope: archiveScopeFilter,
    archiveStatus: archiveStatusFilter,
    archiveQuery: archiveQuery.trim(),
    type: archiveScopeFilter === 'issue' ? 'tickets' : undefined
  }), [archiveQuery, archiveScopeFilter, archiveStatusFilter]);

  const archiveReviewNotePath = useMemo(() => buildArchivePath('/lottery/research/notebook', {
    title: `归档复核 ${archiveScopeLabel(archiveScopeFilter)} ${archiveQuery.trim() || '月末证据'}`,
    status: 'ACTIVE',
    evidenceKey: `archive-review:${archiveScopeFilter}:${archiveStatusFilter}:${archiveQuery.trim() || 'all'}`,
    evidenceType: 'ARCHIVE_REVIEW',
    evidenceTitle: `归档复核队列 ${archiveReviewQueueItems.length} 项`,
    sourceId: archiveScopeFilter,
    path: archiveEvidenceExportPath
  }), [archiveEvidenceExportPath, archiveQuery, archiveReviewQueueItems.length, archiveScopeFilter, archiveStatusFilter]);

  const archiveReviewNotes = useMemo(() => (notes?.items || [])
    .filter(item => (item.evidence || []).some(evidence => evidence.evidenceType === 'ARCHIVE_REVIEW'))
    .slice(0, 4), [notes?.items]);
  const archiveReviewNoteSummary = useMemo(() => ({
    total: archiveReviewNotes.length,
    active: archiveReviewNotes.filter(item => item.status === 'ACTIVE').length,
    validated: archiveReviewNotes.filter(item => item.status === 'VALIDATED').length,
    evidenceCount: archiveReviewNotes.reduce((sum, item) => sum + (item.evidence || []).filter(evidence => evidence.evidenceType === 'ARCHIVE_REVIEW').length, 0)
  }), [archiveReviewNotes]);

  const narrativeItems = useMemo<NarrativeItem[]>(() => {
    const pendingTickets = safeCount(tickets?.pendingTicketCount);
    const attributionWarnings = attributionRows.reduce((sum, item) => sum + safeCount(item.warningCount), 0);
    const staleRecommendations = safeCount(recommendationRollup?.staleCount);
    const dueReminders = safeCount(reminders?.dueCount);
    return [
      {
        key: 'result',
        title: '本月结果',
        body: `账本净值 ${formatCurrency(ledger?.netResult)}，ROI ${formatPercent(ledger?.roiPercent)}；最近 ${recentIssues.length} 个期号已有 ${recentIssues.reduce((sum, item) => sum + safeCount(item.checkedTicketCount), 0)} 张票据完成核验。`,
        status: ledger?.netResult && ledger.netResult >= 0 ? 'PASS' : 'WARNING',
        path: '/lottery/ledger'
      },
      {
        key: 'operations',
        title: '行动闭环',
        body: `票据待核 ${pendingTickets} 张，提醒到期 ${dueReminders} 条，发布检查 ${workbench?.releaseCheckSummary?.passedCount || 0}/${workbench?.releaseCheckSummary?.totalCount || 0} 通过。`,
        status: pendingTickets || dueReminders ? 'WARNING' : 'PASS',
        path: '/lottery/workbench'
      },
      {
        key: 'evidence',
        title: '证据质量',
        body: `归因覆盖 ${attributionRollup?.issueCount || 0} 期，仍有 ${attributionWarnings} 个归因警示；策略笔记 ${notes?.total || notes?.items?.length || 0} 条，当前页证据 ${notes?.items?.reduce((sum, item) => sum + safeCount(item.evidence?.length), 0) || 0} 条。`,
        status: attributionWarnings ? 'WARNING' : (attributionRollup?.issueCount ? 'PASS' : 'MANUAL'),
        path: '/lottery/outcomes'
      },
      {
        key: 'next',
        title: '下月关注',
        body: `推荐待处理 ${recommendationRollup?.activeCount || 0} 条、过期 ${staleRecommendations} 条；导出证据 ${exportAudits.length} 条，建议优先补齐过期推荐、归因警示和月末包。`,
        status: staleRecommendations || attributionWarnings || !exportAudits.length ? 'WARNING' : 'PASS',
        path: staleRecommendations ? '/lottery/recommendations' : '/lottery/exports'
      }
    ];
  }, [attributionRollup?.issueCount, attributionRows, exportAudits.length, ledger?.netResult, ledger?.roiPercent, notes?.items, notes?.total, recentIssues, recommendationRollup?.activeCount, recommendationRollup?.staleCount, reminders?.dueCount, tickets?.pendingTicketCount, workbench?.releaseCheckSummary?.passedCount, workbench?.releaseCheckSummary?.totalCount]);

  const anomalyReviewItems = useMemo<ArchiveItem[]>(() => {
    const healthWarnings = (health?.contributors || []).filter(item => item.status && item.status !== 'PASS');
    const releaseWarnings = releaseChecks.filter(item => item.status && item.status !== 'PASS');
    const attributionWarnings = attributionRows.reduce((sum, item) => sum + safeCount(item.warningCount), 0);
    const staleRecommendations = safeCount(recommendationRollup?.staleCount);
    const dueReminders = safeCount(reminders?.dueCount);
    return [
      {
        key: 'anomaly:health',
        scope: 'operations',
        title: '运营健康异常',
        detail: healthWarnings.map(item => item.label || item.key).filter(Boolean).slice(0, 3).join('、') || lotteryMessageLabel(health?.message, '暂无健康警示'),
        path: '/lottery/governance',
        status: healthWarnings.length ? 'WARNING' : health?.status || 'MANUAL',
        count: healthWarnings.length
      },
      {
        key: 'anomaly:attribution',
        scope: 'outcome',
        title: '归因漂移复核',
        detail: `归因警示 ${attributionWarnings} 项，覆盖 ${attributionRollup?.issueCount || 0} 期`,
        path: '/lottery/outcomes',
        status: attributionWarnings ? 'WARNING' : (attributionRollup?.issueCount ? 'PASS' : 'MANUAL'),
        count: attributionWarnings
      },
      {
        key: 'anomaly:recommendation',
        scope: 'recommendation',
        title: '推荐滞留复核',
        detail: `${staleRecommendations} 条过期，${recommendationRollup?.activeCount || 0} 条待处理`,
        path: '/lottery/recommendations',
        status: staleRecommendations ? 'WARNING' : (recommendationRollup?.recommendationCount ? 'PASS' : 'MANUAL'),
        count: staleRecommendations
      },
      {
        key: 'anomaly:release',
        scope: 'release',
        title: '发布证据复核',
        detail: `${releaseWarnings.length} 项未通过，到期提醒 ${dueReminders} 条`,
        path: '/lottery/exports?preset=v31-anomaly-review',
        status: releaseWarnings.length || dueReminders ? 'WARNING' : (releaseChecks.length ? 'PASS' : 'MANUAL'),
        count: releaseWarnings.length + dueReminders
      }
    ];
  }, [attributionRollup?.issueCount, attributionRows, health, recommendationRollup, releaseChecks, reminders?.dueCount]);

  const longTermPlanningItems = useMemo(() => [
    {
      key: 'review-window',
      label: '35-39 复盘窗口',
      value: '5 轮',
      detail: '归档队列、策略笔记、质量信号和发布证据已闭环',
      path: '/lottery/month-end'
    },
    {
      key: 'long-term-export',
      label: '长期研究包',
      value: exportAudits.length,
      detail: '导出长期研究和年度复盘证据',
      path: '/lottery/exports?preset=long-term-research'
    },
    {
      key: 'archive-notes',
      label: '复核笔记',
      value: notes?.total || notes?.items?.length || 0,
      detail: '查看 ARCHIVE_REVIEW 筛选和闭环摘要',
      path: '/lottery/research/notebook?evidence=ARCHIVE_REVIEW'
    },
    {
      key: 'next-ops',
      label: '下轮执行',
      value: '40',
      detail: '从工作台继续拆解候选复盘主题',
      path: '/lottery/workbench'
    }
  ], [exportAudits.length, notes?.items?.length, notes?.total]);

  const nextPhaseCandidateItems = useMemo(() => [
    {
      key: 'evidence-quality-trend',
      label: '证据质量趋势',
      detail: '继续追踪归因警示、复核笔记质量和策略证据覆盖',
      status: attributionRows.some(item => safeCount(item.warningCount) > 0) || archiveReviewNoteSummary.active ? 'WARNING' : 'PASS',
      path: '/lottery/outcomes?focus=evidence-quality'
    },
    {
      key: 'provider-reliability',
      label: 'Provider可靠性',
      detail: '复用同步页和治理页的探测、跳过、失败和恢复证据',
      status: health?.warningCount ? 'WARNING' : health?.status || 'MANUAL',
      path: '/lottery/sync?focus=provider-reliability'
    },
    {
      key: 'recommendation-retirement',
      label: '策略退休复盘',
      detail: '集中处理过期推荐、退役候选和已应用推荐的归因留档',
      status: (recommendationRollup?.staleCount || 0) ? 'WARNING' : recommendationRollup?.recommendationCount ? 'PASS' : 'MANUAL',
      path: '/lottery/recommendations?focus=retirement-review&preset=STALE_EVIDENCE'
    },
    {
      key: 'archive-review-pressure',
      label: '归档复核压力',
      detail: '把待复核归档队列沉淀为 ARCHIVE_REVIEW 笔记',
      status: archiveReviewQueueItems.length || archiveReviewNoteSummary.active ? 'WARNING' : archiveReviewNoteSummary.total ? 'PASS' : 'MANUAL',
      path: archiveReviewNotePath
    },
    {
      key: 'release-evidence-archive',
      label: '发布证据归档',
      detail: '把长期计划复盘接入发布证据和历史快照',
      status: exportAudits.length ? 'PASS' : 'MANUAL',
      path: '/lottery/exports?focus=release-archive'
    }
  ], [archiveReviewNotePath, archiveReviewNoteSummary.active, archiveReviewNoteSummary.total, archiveReviewQueueItems.length, attributionRows, exportAudits.length, health?.status, health?.warningCount, recommendationRollup?.recommendationCount, recommendationRollup?.staleCount]);

  return (
    <LifePageShell
      className="lottery-prediction-page lottery-month-end-page"
      eyebrow="彩票数据"
      title="月末复盘"
      actions={
        <Space wrap>
          <Button icon={<MobileOutlined />} onClick={() => navigate('/lottery/mobile')}>
            移动指挥
          </Button>
          <Button icon={<BranchesOutlined />} onClick={() => navigate('/lottery/outcomes')}>
            归因
          </Button>
          <Button icon={<DownloadOutlined />} onClick={() => navigate('/lottery/exports?type=decision-outcomes&preset=month-end-governance')}>
            月末包
          </Button>
          <Button icon={<WarningOutlined />} onClick={() => navigate('/lottery/exports?preset=v31-anomaly-review')}>
            异常复盘包
          </Button>
          <Button icon={<DownloadOutlined />} onClick={() => navigate('/lottery/exports?preset=long-term-research')}>
            长期复盘包
          </Button>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadReview}>
            刷新
          </Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}
      <Spin spinning={loading && !workbench}>
        <section className="lottery-month-end-hero">
          <div>
            <strong>{monthEndScore}</strong>
            <span>月末复盘分</span>
            <small>最近期号 {health?.latestIssue || workbench?.dailyState?.latestIssue || '-'} · 下一期 {health?.nextIssue || workbench?.dailyState?.nextIssue || '-'}</small>
          </div>
          <Progress
            type="circle"
            percent={Math.max(0, Math.min(100, monthEndScore))}
            strokeColor={monthEndScore >= 85 ? '#34c759' : monthEndScore >= 65 ? '#ff9500' : '#ff3b30'}
          />
        </section>

        <section className="lottery-month-end-metric-grid">
          {metrics.map(item => (
            <button key={item.key} type="button" onClick={() => navigate(item.path)}>
              <span>{item.icon}</span>
              <em>{item.label}</em>
              <strong>{item.value}</strong>
              <small>{item.detail}</small>
              <Tag color={statusColor(item.status)}>{lotteryStatusLabel(item.status)}</Tag>
            </button>
          ))}
        </section>

        <Card className="life-panel-card lottery-clean-panel" title="月末叙事摘要">
          <div className="lottery-month-end-narrative">
            {narrativeItems.map(item => (
              <button key={item.key} type="button" onClick={() => navigate(item.path)}>
                <Tag color={statusColor(item.status)}>{lotteryStatusLabel(item.status)}</Tag>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card
          className="life-panel-card lottery-clean-panel lottery-month-end-minigpt-card"
          title={<Space><SafetyCertificateOutlined />MiniGPT · {researchText('研究与决策证据', 'Research and Decision Evidence')}</Space>}
          extra={
            <Space wrap>
              <Tag color={statusColor(miniGptHandoffStatus)}>{translateText(lotteryStatusLabel(miniGptHandoffStatus))}</Tag>
              {miniGptBacktest?.id ? (
                <Button size="small" onClick={() => navigate(`/lottery/backtests/${miniGptBacktest.id}`)}>{researchText('回测证据', 'Backtest Evidence')}</Button>
              ) : null}
              <Button size="small" icon={<DownloadOutlined />} onClick={() => navigate(miniGptExportPath)}>{researchText('导出证据', 'Export Evidence')}</Button>
            </Space>
          }
        >
          <Alert
            className="lottery-overview-status-alert"
            type="info"
            showIcon
            message={researchText(
              '仅作为历史窗口研究证据，不外推未来表现。',
              'Historical-window research evidence only; do not extrapolate future performance.'
            )}
          />
          <section
            className="lottery-month-end-observation"
            data-boundary-source="DECISION_PROVENANCE_PLUS_EXACT_DECISION_OUTCOME"
            data-observed-denominator={postCorpusObservation.observedDecisionCount}
            data-read-only="true"
          >
            <header>
              <div>
                <strong>{researchText('语料时间边界与样本外观察', 'Corpus Boundary and Post-Corpus Observation')}</strong>
                <span>{researchText(
                  '月末摘要复用最近 100 条含归档决策的只读口径，不参与月末评分或生命周期动作。',
                  'This month-end summary reuses the latest 100 archived-inclusive decisions as a read-only scope and does not affect the month-end score or lifecycle actions.'
                )}</span>
              </div>
              <Button size="small" onClick={() => navigate('/lottery/predictions/decision')}>
                {researchText('查看逐决策证据', 'View Per-Decision Evidence')}
              </Button>
            </header>

            <Alert
              type="info"
              showIcon
              message={researchText(
                '只有 POST_CORPUS_OBSERVED 进入已观察分母；训练、验证、待观察和未知始终分开。',
                'Only POST_CORPUS_OBSERVED enters the observed denominator; training, validation, pending, and unknown always remain separate.'
              )}
              description={researchText(
                '边界只读取决策溯源中的训练/验证期号、目标期号和同一 decisionSetId 的实际评分。随机基线差值不跨报告平均，正向结果也不证明泛化、不会自动审批票包或生成票据。',
                'The boundary reads only the decision provenance train/validation issues, target issue, and actual score owned by the same decisionSetId. Random-baseline deltas are never averaged across reports; favorable results do not establish generalization or automatically approve a ticket pack or create tickets.'
              )}
            />

            {postCorpusObservationError ? (
              <Alert
                type="warning"
                showIcon
                message={researchText('月末观察聚合暂不可用', 'Month-End Observation Aggregate Unavailable')}
                description={translateText(postCorpusObservationError)}
              />
            ) : null}

            <div className="lottery-month-end-observation-state-grid">
              {MINI_GPT_OBSERVATION_BOUNDARY_STATES.map(state => {
                const metadata = MINI_GPT_OBSERVATION_BOUNDARY_METADATA[state];
                return (
                  <article key={state} data-boundary-state={state}>
                    <strong>{postCorpusObservation.stateCounts[state]}</strong>
                    <span>{isEnglish ? metadata.label.en : metadata.label.zh}</span>
                    <Tag color={metadata.tone}>{state}</Tag>
                  </article>
                );
              })}
            </div>

            <div className="lottery-month-end-observation-scope">
              <span>{researchText(
                `有界快照：最近最多 ${MINI_GPT_POST_CORPUS_SNAPSHOT_LIMIT} 条决策（含归档），已加载 ${postCorpusObservation.boundedInputCount}${postCorpusSnapshotTotal === undefined ? '，总量未知' : ` / 总量 ${postCorpusSnapshotTotal}`}。`,
                `Bounded snapshot: latest ${MINI_GPT_POST_CORPUS_SNAPSHOT_LIMIT} decisions at most (including archived), loaded ${postCorpusObservation.boundedInputCount}${postCorpusSnapshotTotal === undefined ? '; total unknown' : ` / total ${postCorpusSnapshotTotal}`}.`
              )}</span>
              <span>{researchText(
                `MiniGPT ${postCorpusObservation.miniGptDecisionCount} 条；另有 ${postCorpusObservation.excludedNonMiniGptCount} 条非 MiniGPT 决策未进入五态统计。`,
                `${postCorpusObservation.miniGptDecisionCount} MiniGPT decisions; ${postCorpusObservation.excludedNonMiniGptCount} non-MiniGPT decisions are excluded from the five-state counts.`
              )}</span>
            </div>

            {postCorpusObservation.miniGptDecisionCount === 0 && !loading ? (
              <Empty
                description={researchText('有界快照内暂无 MiniGPT 决策观察证据', 'No MiniGPT observation evidence in the bounded snapshot')}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <div className="lottery-month-end-observation-metric-grid">
                <article>
                  <strong>{postCorpusObservation.observedDecisionCount}</strong>
                  <span>{researchText('已观察决策分母', 'Observed Decision Denominator')}</span>
                  <small>{researchText(
                    `独立期号 ${postCorpusObservation.distinctIssueCount} · 范围 ${postCorpusObservation.issueRange
                      ? `${postCorpusObservation.issueRange.firstIssue} → ${postCorpusObservation.issueRange.latestIssue}`
                      : '-'}`,
                    `Distinct issues ${postCorpusObservation.distinctIssueCount} · Range ${postCorpusObservation.issueRange
                      ? `${postCorpusObservation.issueRange.firstIssue} → ${postCorpusObservation.issueRange.latestIssue}`
                      : '-'}`
                  )}</small>
                </article>
                <article>
                  <strong>{postCorpusObservation.scoredCandidateCount}</strong>
                  <span>{researchText('已评分候选分母', 'Scored Candidate Denominator')}</span>
                  <small>{researchText(
                    `候选命中 ${postCorpusObservation.winningCandidateCount} · 蓝球 ${postCorpusObservation.blueHitCount}/${postCorpusObservation.scoredCandidateCount}（${formatPercent(postCorpusObservation.blueHitRatePercent ?? undefined)}）`,
                    `Winning candidates ${postCorpusObservation.winningCandidateCount} · Blue ${postCorpusObservation.blueHitCount}/${postCorpusObservation.scoredCandidateCount} (${formatPercent(postCorpusObservation.blueHitRatePercent ?? undefined)})`
                  )}</small>
                </article>
                <article>
                  <strong>{postCorpusObservation.financial.decisionCount}/{postCorpusObservation.observedDecisionCount}</strong>
                  <span>{researchText('完整核奖财务覆盖', 'Complete Settled-Financial Coverage')}</span>
                  <small>{researchText(
                    `成本 ${formatCurrency(postCorpusObservation.financial.totalCost ?? undefined)} · 奖金 ${formatCurrency(postCorpusObservation.financial.totalPrize ?? undefined)} · 净值 ${formatCurrency(postCorpusObservation.financial.netResult ?? undefined)} · ROI ${formatPercent(postCorpusObservation.financial.roiPercent ?? undefined)}`,
                    `Cost ${formatCurrency(postCorpusObservation.financial.totalCost ?? undefined)} · Prize ${formatCurrency(postCorpusObservation.financial.totalPrize ?? undefined)} · Net ${formatCurrency(postCorpusObservation.financial.netResult ?? undefined)} · ROI ${formatPercent(postCorpusObservation.financial.roiPercent ?? undefined)}`
                  )}</small>
                </article>
                <article>
                  <strong>{postCorpusObservation.comparableBaselineCount}/{postCorpusObservation.observedDecisionCount}</strong>
                  <span>{researchText('精确可比随机基线', 'Exact Comparable Random Baseline')}</span>
                  <small>{researchText(
                    `不可比 ${postCorpusObservation.failedBaselineCount} · 未知 ${postCorpusObservation.unknownBaselineCount}`,
                    `Failed ${postCorpusObservation.failedBaselineCount} · Unknown ${postCorpusObservation.unknownBaselineCount}`
                  )}</small>
                </article>
              </div>
            )}

            <div className="lottery-month-end-observation-warnings">
              {postCorpusScopeError ? (
                <Alert
                  type="warning"
                  showIcon
                  message={researchText('观察总量与截断状态未知', 'Observation Total and Truncation State Unknown')}
                  description={translateText(postCorpusScopeError)}
                />
              ) : null}
              {postCorpusSnapshotTruncated ? (
                <Alert
                  type="warning"
                  showIcon
                  message={researchText('有界快照已截断', 'Bounded Snapshot Is Truncated')}
                  description={researchText(
                    '更早决策不在本次观察分母内，不能把当前统计解释为完整历史。',
                    'Older decisions are outside this observation denominator; do not interpret the current counts as complete history.'
                  )}
                />
              ) : null}
              {postCorpusObservation.observedDecisionCount > 0
                && postCorpusObservation.distinctIssueCount < MINI_GPT_POST_CORPUS_SMALL_SAMPLE_ISSUES ? (
                  <Alert
                    type="warning"
                    showIcon
                    message={researchText('样本外观察期号仍然很少', 'Post-Corpus Issue Sample Is Still Small')}
                    description={researchText(
                      `当前只有 ${postCorpusObservation.distinctIssueCount} 个独立已观察期号，不构成稳定表现证据。`,
                      `Only ${postCorpusObservation.distinctIssueCount} distinct observed issues are available; this does not establish stable performance.`
                    )}
                  />
                ) : null}
              {postCorpusHasDuplicateIssues ? (
                <Alert
                  type="warning"
                  showIcon
                  message={researchText('同一期号存在多条决策', 'Multiple Decisions Share an Issue')}
                  description={researchText('决策分母与独立期号分母保持分离，不按期号自动合并。', 'Decision and distinct-issue denominators remain separate; decisions are not automatically merged by issue.')}
                />
              ) : null}
              {postCorpusObservation.unstableObservedCount > 0 ? (
                <Alert
                  type="warning"
                  showIcon
                  message={researchText('部分已观察决策缺少稳定溯源', 'Some Observed Decisions Lack Stable Provenance')}
                  description={researchText('这些决策保持隔离，其随机基线状态为 UNKNOWN。', 'These decisions remain isolated and their random-baseline state is UNKNOWN.')}
                />
              ) : null}
              {postCorpusHasPartialFinancialCoverage ? (
                <Alert
                  type="warning"
                  showIcon
                  message={researchText('财务覆盖不完整', 'Financial Coverage Is Incomplete')}
                  description={researchText('成本、奖金、净值和 ROI 只汇总已全部核奖的决策。', 'Cost, prize, net result, and ROI aggregate only decisions whose converted tickets are fully settled.')}
                />
              ) : null}
              {postCorpusHasIncompleteBaselineCoverage ? (
                <Alert
                  type="warning"
                  showIcon
                  message={researchText('精确随机基线覆盖不完整', 'Exact Random-Baseline Coverage Is Incomplete')}
                  description={researchText('只接受当前决策绑定的精确复核报告；缺失、归属错误或不可比证据不会借用其他报告。', 'Only the exact reviewed report owned by the current decision is accepted; missing, wrong-owner, or incomparable evidence never borrows another report.')}
                />
              ) : null}
              {postCorpusObservation.stateCounts.UNKNOWN > 0 ? (
                <Alert
                  type="warning"
                  showIcon
                  message={researchText('存在时间边界未知决策', 'Some Decisions Have an Unknown Time Boundary')}
                  description={researchText('UNKNOWN 永不视为 PASS，也不进入已观察分母。', 'UNKNOWN is never treated as PASS and never enters the observed denominator.')}
                />
              ) : null}
            </div>
          </section>
          {hasMiniGptHandoff ? (
            <>
              {!miniGptBacktest ? (
                <Alert
                  className="lottery-overview-status-alert"
                  type="warning"
                  showIcon
                  message={researchText(
                    '当前决策的回测证据未加载，不跨研究链拼接其他模型或随机基线结果。',
                    'The reviewed backtest is unavailable. Results from another research chain are not substituted.'
                  )}
                />
              ) : null}
              <div className="lottery-research-report-grid lottery-research-report-summary">
                <article>
                  <Tag color="blue">{researchText('模型', 'Model')}</Tag>
                  <strong>{formatPercent(miniGptBacktest?.roiPercent)}</strong>
                  <span>{researchText('成本', 'Cost')} {formatCurrency(miniGptBacktest?.totalCost)} · {researchText('奖金', 'Prize')} {formatCurrency(miniGptBacktest?.totalPrize)}</span>
                  <small>{researchText('候选', 'Candidates')} {miniGptBacktest?.candidateCount || miniGptDecision?.candidateCount || 0} · {miniGptBacktest?.issueStart || '-'}-{miniGptBacktest?.issueEnd || '-'}</small>
                </article>
                <article>
                  <Tag>Random Baseline</Tag>
                  <strong>{formatPercent(miniGptBacktest?.baselineRoiPercent)}</strong>
                  <span>{researchText('成本', 'Cost')} {formatCurrency(miniGptBacktest?.baselineTotalCost)} · {researchText('奖金', 'Prize')} {formatCurrency(miniGptBacktest?.baselineTotalPrize)}</span>
                  <small>seed={miniGptBacktest?.baselineSeed ?? '-'} · {miniGptBacktest?.baselineAlgorithm || '-'}</small>
                </article>
                <article>
                  <Tag color={miniGptComparisonFailed
                    ? 'red'
                    : miniGptComparisonPassed && (miniGptBacktest?.roiPercentDelta || 0) > 0 ? 'green' : 'gold'}>
                    {researchText('同窗口', 'Same Window')}
                  </Tag>
                  <strong>{formatPercent(miniGptBacktest?.roiPercentDelta)}</strong>
                  <span>{researchText('同窗口随机基线 ROI 差额', 'Same-Window Random Baseline ROI Delta')}</span>
                  <small>sameWindow={comparisonState(miniGptBacktest?.sameWindow)} · sameBudget={comparisonState(miniGptBacktest?.sameBudget)}</small>
                </article>
                <article>
                  <Tag color="blue">MiniGPT</Tag>
                  <strong>{miniGptProvenance?.corpusVersion || '-'}</strong>
                  <span>runId={miniGptProvenance?.runId || '-'}</span>
                  <small>
                    batchId={miniGptProvenance?.batchId || '-'} · generationId={miniGptGenerationIds[0] || '-'}
                    {miniGptGenerationIds.length > 1 ? ` +${miniGptGenerationIds.length - 1}` : ''}
                  </small>
                </article>
                <article>
                  <Tag color={researchReviewColor(miniGptDecision?.reviewAction)}>{researchText('当前复核', 'Current Review')}</Tag>
                  <strong>{researchReviewLabel(miniGptDecision?.reviewAction, isEnglish)}</strong>
                  <span>backtestId={miniGptDecision?.reviewBacktestId || miniGptBacktest?.id || '-'}</span>
                  <small>
                    reviewedAt={formatDateTime(miniGptDecision?.reviewedAt)} · {miniGptDecision?.reviewNote
                      || researchText('复核只记录研究生命周期动作', 'Review records a research lifecycle action only')}
                  </small>
                </article>
                <article>
                  <Tag color={!miniGptTicketPack || miniGptTicketPack.status === 'DRAFT' ? 'gold' : 'green'}>{researchText('草稿', 'Draft')}</Tag>
                  <strong>{miniGptTicketPack?.status || researchText('未创建草稿', 'Draft Not Created')}</strong>
                  <span>{miniGptTicketPack?.approvalState || researchText('待审批', 'Pending Approval')}</span>
                  <small>packId={miniGptTicketPack?.id || '-'} · {researchText('不会自动审批或生成票据', 'No automatic approval or ticket creation')}</small>
                </article>
              </div>
              <div className="lottery-month-end-list">
                <button type="button" onClick={() => navigate(miniGptDecisionPath)}>
                  <Tag color="blue">{researchText('决策集', 'Decision Set')}</Tag>
                  <span>{miniGptDecision?.title || miniGptDecisionId || researchText('MiniGPT 决策溯源', 'MiniGPT Decision Lineage')}</span>
                  <strong>{researchReviewLabel(miniGptDecision?.reviewAction, isEnglish)}</strong>
                  <small>decisionSetId={miniGptDecisionId || '-'} · targetIssue={miniGptTargetIssue || '-'}</small>
                </button>
                {miniGptBacktest ? (
                  <button type="button" onClick={() => navigate(miniGptBacktest.id ? `/lottery/backtests/${miniGptBacktest.id}` : '/lottery/backtests')}>
                    <Tag color={miniGptComparisonFailed ? 'red' : miniGptComparisonPassed && !miniGptWarnings.length ? 'green' : 'gold'}>{researchText('回测证据', 'Backtest Evidence')}</Tag>
                    <span>{miniGptBacktest.evaluationMode || researchText('未知评估模式', 'Unknown Evaluation Mode')}</span>
                    <strong>{formatPercent(miniGptBacktest.roiPercentDelta)}</strong>
                    <small>{researchText('模型', 'Model')} {formatCurrency(miniGptBacktest.netResult)} · Random Baseline {formatCurrency(miniGptBacktest.baselineNetResult)}</small>
                  </button>
                ) : null}
                <button type="button" onClick={() => navigate(miniGptTicketPackPath)}>
                  <Tag color={!miniGptTicketPack || miniGptTicketPack.status === 'DRAFT' ? 'gold' : 'green'}>{researchText('票包草稿', 'Ticket-Pack Draft')}</Tag>
                  <span>{miniGptTicketPack?.title || researchText('显式创建草稿后再进入审批', 'Create a draft explicitly before approval')}</span>
                  <strong>{miniGptTicketPack?.status || researchText('未创建', 'Not Created')}</strong>
                  <small>{miniGptTicketPack?.approvalState || researchText('待审批', 'Pending Approval')} · {miniGptTicketPack?.items?.length || 0} {researchText('注', 'tickets')}</small>
                </button>
                <button type="button" onClick={() => navigate(miniGptOutcomePath)}>
                  <Tag color="blue">{researchText('归因', 'Attribution')}</Tag>
                  <span>{isEnglish
                    ? `Issue ${miniGptTargetIssue || '-'} · MiniGPT decision outcome`
                    : `第 ${miniGptTargetIssue || '-'} 期 · MiniGPT 决策结果`}</span>
                  <strong>{formatCurrency(miniGptDecision?.netResult)}</strong>
                  <small>{researchText('警示', 'Warnings')} {miniGptDecision?.warningCount || 0} · ROI {formatPercent(miniGptDecision?.roiPercent)}</small>
                </button>
                {miniGptProvenance?.batchId || miniGptProvenance?.runId ? (
                  <button type="button" onClick={() => navigate(miniGptLedgerPath)}>
                    <Tag color="blue">{researchText('账本', 'Ledger')}</Tag>
                    <span>{miniGptProvenance.batchId ? 'MiniGPT Batch' : 'MiniGPT Run'} {researchText('维度', 'dimension')}</span>
                    <strong>{formatCurrency(miniGptDecision?.netResult)}</strong>
                    <small>{miniGptProvenance.batchId || miniGptProvenance.runId}</small>
                  </button>
                ) : null}
                {miniGptWarnings.slice(0, 4).map(warning => (
                  <button
                    key={`minigpt-warning-${warning}`}
                    type="button"
                    onClick={() => navigate(miniGptBacktest?.id ? `/lottery/backtests/${miniGptBacktest.id}` : miniGptDecisionPath)}
                  >
                    <Tag color="gold">{researchText('研究证据提醒', 'Evidence Warning')}</Tag>
                    <span>{lotteryOverfitWarningsText([warning], isEnglish)}</span>
                    <strong>{warning}</strong>
                    <small>{researchText(
                      '仅作为历史窗口研究证据，不外推未来表现。',
                      'Historical-window research evidence only; do not extrapolate future performance.'
                    )}</small>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <Empty
              description={researchText('暂无研究证据', 'No Research Evidence')}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button onClick={() => navigate('/ai/minigpt')}>{researchText('打开 MiniGPT', 'Open MiniGPT')}</Button>
            </Empty>
          )}
        </Card>

        <Card
          className="life-panel-card lottery-clean-panel"
          title={<Space><BookOutlined />长期计划复盘</Space>}
          extra={<Tag color="blue">35-39</Tag>}
        >
          <div className="lottery-month-end-list">
            {longTermPlanningItems.map(item => (
              <button key={item.key} type="button" onClick={() => navigate(item.path)}>
                <Tag color="blue">{item.label}</Tag>
                <span>{item.detail}</span>
                <strong>{item.value}</strong>
                <small>长期计划检查点</small>
              </button>
            ))}
          </div>
          <div className="lottery-month-end-narrative lottery-month-end-candidate-grid">
            {nextPhaseCandidateItems.map(item => (
              <button key={item.key} type="button" onClick={() => navigate(item.path)}>
                <Tag color={statusColor(item.status)}>{lotteryStatusLabel(item.status)}</Tag>
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
              </button>
            ))}
          </div>
        </Card>

        <section className="lottery-workbench-main-grid">
          <Card className="life-panel-card lottery-clean-panel" title="最近期号结果">
            {recentIssues.length ? (
              <div className="lottery-month-end-list">
                {recentIssues.map(item => (
                  <button key={item.issue || item.period} type="button" onClick={() => navigate(`/lottery/tickets?issue=${item.issue || item.period}`)}>
                    <Tag color={item.netResult && item.netResult >= 0 ? 'green' : 'gold'}>第 {item.issue || item.period || '-'} 期</Tag>
                    <span>票据 {item.checkedTicketCount || 0}/{item.ticketCount || 0}</span>
                    <strong>{formatCurrency(item.netResult)}</strong>
                    <small>ROI {formatPercent(item.roiPercent)}</small>
                  </button>
                ))}
              </div>
            ) : (
              <Empty description="暂无期号复盘" />
            )}
          </Card>

          <Card className="life-panel-card lottery-clean-panel" title="行动与发布检查">
            <div className="lottery-month-end-list">
              <button type="button" onClick={() => navigate('/lottery/workbench')}>
                <Tag color={statusColor(workbench?.operationSummary?.status)}>{lotteryStatusLabel(workbench?.operationSummary?.status)}</Tag>
                <span>{workbench?.operationSummary?.message || '暂无日常摘要'}</span>
                <strong>{workbench?.operationSummary?.completedCount || 0}/{workbench?.operationSummary?.totalCount || 0}</strong>
                <small>日常完成度</small>
              </button>
              <button type="button" onClick={() => navigate('/lottery/alerts')}>
                <Tag color={(reminders?.activeCount || 0) ? 'orange' : 'green'}>提醒</Tag>
                <span>活跃 {reminders?.activeCount || 0} · 到期 {reminders?.dueCount || 0}</span>
                <strong>{reminders?.totalCount || 0}</strong>
                <small>行动提醒</small>
              </button>
              <button type="button" onClick={() => navigate('/lottery/exports')}>
                <Tag color={statusColor(workbench?.releaseCheckSummary?.status)}>{lotteryStatusLabel(workbench?.releaseCheckSummary?.status)}</Tag>
                <span>{workbench?.releaseCheckSummary?.message || '暂无发布检查'}</span>
                <strong>{workbench?.releaseCheckSummary?.passedCount || 0}/{workbench?.releaseCheckSummary?.totalCount || 0}</strong>
                <small>发布检查</small>
              </button>
            </div>
          </Card>
        </section>

        <section className="lottery-workbench-main-grid">
          <Card className="life-panel-card lottery-clean-panel" title="研究与决策证据">
            {(decisions?.items?.length || notes?.items?.length) ? (
              <div className="lottery-month-end-list">
                {(decisions?.items || []).slice(0, 4).map(item => (
                  <button key={item.decisionSetId || item.targetIssue} type="button" onClick={() => navigate('/lottery/predictions/decision')}>
                    <Tag color={statusColor(item.warningCount ? 'WARNING' : 'PASS')}>决策</Tag>
                    <span>{item.title || `第 ${item.targetIssue || '-'} 期`}</span>
                    <strong>{formatCurrency(item.netResult)}</strong>
                    <small>警示 {item.warningCount || 0} · ROI {formatPercent(item.roiPercent)}</small>
                  </button>
                ))}
                {(notes?.items || []).slice(0, 3).map(item => (
                  <button key={item.id || item.title} type="button" onClick={() => navigate('/lottery/research/notebook')}>
                    <Tag color="blue">{lotteryStatusLabel(item.status, 'NOTE')}</Tag>
                    <span>{item.title || '策略笔记'}</span>
                    <strong>{item.evidence?.length || 0}</strong>
                    <small>{item.ruleName || item.targetIssue || '待补充假设'}</small>
                  </button>
                ))}
              </div>
            ) : (
              <Empty description="暂无研究证据" />
            )}
          </Card>

          <Card className="life-panel-card lottery-clean-panel" title="归因质量摘要">
            {attributionRows.length ? (
              <div className="lottery-month-end-list">
                {attributionRows.map(item => (
                  <button key={`${item.dimension}-${item.key}`} type="button" onClick={() => navigate(item.path || '/lottery/outcomes')}>
                    <Tag color={(item.warningCount || 0) ? 'gold' : 'green'}>{attributionQualityLabel(item.evidenceQuality)}</Tag>
                    <span>{item.label || item.key || '-'}</span>
                    <strong>{item.sampleCount || 0}</strong>
                    <small>{item.issueCount || 0} 期 · 警示 {item.warningCount || 0}</small>
                  </button>
                ))}
              </div>
            ) : (
              <Empty description="暂无归因质量摘要" />
            )}
          </Card>

          <Card className="life-panel-card lottery-clean-panel" title="推荐生命周期跟进">
            {(recommendationRollup?.transitions?.length || recommendationRollup?.recommendationCount) ? (
              <div className="lottery-month-end-list">
                <button type="button" onClick={() => navigate('/lottery/recommendations')}>
                  <Tag color={(recommendationRollup?.staleCount || 0) ? 'gold' : 'green'}>推荐</Tag>
                  <span>已应用 {recommendationRollup?.appliedCount || 0} · 待处理 {recommendationRollup?.activeCount || 0}</span>
                  <strong>{recommendationRollup?.recommendationCount || 0}</strong>
                  <small>过期 {recommendationRollup?.staleCount || 0} · 退役 {recommendationRollup?.retiredCount || 0}</small>
                </button>
                {(recommendationRollup?.transitions || []).slice(0, 4).map(item => (
                  <button key={`${item.day}-${item.lifecycleStatus}-${item.recommendationState}`} type="button" onClick={() => navigate('/lottery/recommendations')}>
                    <Tag color={statusColor(item.lifecycleStatus)}>{lotteryStatusLabel(item.lifecycleStatus, 'OPEN')}</Tag>
                    <span>{item.day || '-'}</span>
                    <strong>{item.count || 0}</strong>
                    <small>{lotteryStatusLabel(item.recommendationState, 'WATCH')}</small>
                  </button>
                ))}
              </div>
            ) : (
              <Empty description="暂无推荐生命周期摘要" />
            )}
          </Card>

          <Card
            className="life-panel-card lottery-clean-panel"
            title="异常复核闭环"
            extra={<Tag>{anomalyReviewItems.reduce((sum, item) => sum + safeCount(item.count), 0)} 条</Tag>}
          >
            <div className="lottery-month-end-list">
              {anomalyReviewItems.map(item => (
                <button key={item.key} type="button" onClick={() => navigate(item.path)}>
                  <Tag color={statusColor(item.status)}>{archiveScopeLabel(item.scope)}</Tag>
                  <span>{item.title}</span>
                  <strong>{item.count ?? '-'}</strong>
                  <small>{item.detail}</small>
                </button>
              ))}
            </div>
          </Card>

          <Card
            className="life-panel-card lottery-clean-panel"
            title="研究归档索引"
            extra={
              <Space wrap>
                <Tag>{archiveItems.length}/{allArchiveItems.length} 条</Tag>
                <Button size="small" icon={<DownloadOutlined />} onClick={() => navigate(archiveEvidenceExportPath)}>
                  导出证据
                </Button>
              </Space>
            }
          >
            <div className="lottery-archive-search">
              <Input
                allowClear
                prefix={<SearchOutlined />}
                value={archiveQuery}
                onChange={event => setArchiveQuery(event.target.value)}
                placeholder="搜索期号、月份、策略、归因、推荐或发布证据"
              />
              <Select
                value={archiveScopeFilter}
                onChange={setArchiveScopeFilter}
                options={archiveScopeOptions}
              />
              <Select
                value={archiveStatusFilter}
                onChange={setArchiveStatusFilter}
                options={archiveStatusOptions}
              />
            </div>
            {archiveItems.length ? (
              <div className="lottery-month-end-list">
                {archiveItems.map(item => (
                  <button key={item.key} type="button" onClick={() => navigate(item.path)}>
                    <Tag color={statusColor(item.status)}>{archiveScopeLabel(item.scope)}</Tag>
                    <span>{item.title}</span>
                    <strong>{item.count ?? '-'}</strong>
                    <small>{item.detail}</small>
                  </button>
                ))}
              </div>
            ) : (
              <Empty description="暂无研究归档" />
            )}
          </Card>

          <Card
            className="life-panel-card lottery-clean-panel"
            title="归档复核队列"
            extra={
              <Space wrap>
                <Tag color={archiveReviewQueueItems.length ? 'orange' : 'green'}>{archiveReviewQueueItems.length ? `${archiveReviewQueueItems.length} 项` : '已清空'}</Tag>
                <Button size="small" icon={<BookOutlined />} onClick={() => navigate(archiveReviewNotePath)}>
                  记录复核
                </Button>
              </Space>
            }
          >
            {archiveReviewQueueItems.length ? (
              <div className="lottery-month-end-list">
                {archiveReviewQueueItems.map(item => (
                  <button key={`review-${item.key}`} type="button" onClick={() => navigate(item.path)}>
                    <Tag color={statusColor(item.status)}>{lotteryStatusLabel(item.status, '需复核')}</Tag>
                    <span>{archiveScopeLabel(item.scope)} · {item.title}</span>
                    <strong>{item.count ?? '-'}</strong>
                    <small>{item.detail}</small>
                  </button>
                ))}
              </div>
            ) : (
              <Empty description="当前筛选暂无待复核归档" />
            )}
          </Card>

          <Card
            className="life-panel-card lottery-clean-panel"
            title="复核笔记回看"
            extra={<Button size="small" icon={<BookOutlined />} onClick={() => navigate('/lottery/research/notebook?evidence=ARCHIVE_REVIEW')}>全部笔记</Button>}
          >
            <div className="lottery-month-end-note-summary">
              <article><strong>{archiveReviewNoteSummary.total}</strong><span>笔记</span></article>
              <article><strong>{archiveReviewNoteSummary.active}</strong><span>验证中</span></article>
              <article><strong>{archiveReviewNoteSummary.validated}</strong><span>已验证</span></article>
              <article><strong>{archiveReviewNoteSummary.evidenceCount}</strong><span>复核证据</span></article>
            </div>
            {archiveReviewNotes.length ? (
              <div className="lottery-month-end-list">
                {archiveReviewNotes.map(item => (
                  <button key={item.id || item.title} type="button" onClick={() => navigate('/lottery/research/notebook?evidence=ARCHIVE_REVIEW')}>
                    <Tag color={statusColor(item.status)}>{lotteryStatusLabel(item.status, 'ACTIVE')}</Tag>
                    <span>{item.title || '归档复核笔记'}</span>
                    <strong>{item.evidence?.length || 0}</strong>
                    <small>{item.updatedAt ? formatDateTime(item.updatedAt) : (item.ruleName || 'ARCHIVE_REVIEW')}</small>
                  </button>
                ))}
              </div>
            ) : (
              <Empty description="暂无归档复核笔记" />
            )}
          </Card>

          <Card className="life-panel-card lottery-clean-panel" title="月末导出与发布就绪">
            <div className="lottery-month-end-list">
              {releaseChecks.slice(0, 5).map(item => (
                <button key={item.key || item.label} type="button" onClick={() => item.path && navigate(item.path)}>
                  <Tag color={statusColor(item.status)}>{lotteryStatusLabel(item.status)}</Tag>
                  <span>{item.label || item.key}</span>
                  <strong>{item.pendingCount || 0}</strong>
                  <small>{item.message || '-'}</small>
                </button>
              ))}
              {exportAudits.slice(0, 3).map(item => (
                <button key={item.id || `${item.targetType}-${item.generatedAt}`} type="button" onClick={() => navigate('/lottery/exports')}>
                  <Tag color="green"><CheckCircleOutlined /> 导出</Tag>
                  <span>{item.targetType || item.eventType}</span>
                  <strong>{item.rowCount || 0}</strong>
                  <small>{formatDateTime(item.generatedAt)}</small>
                </button>
              ))}
            </div>
            {!releaseChecks.length && !exportAudits.length ? <Empty description="暂无月末导出证据" /> : null}
          </Card>
        </section>

        {(reminders?.dueCount || 0) > 0 ? (
          <Alert
            className="lottery-overview-status-alert"
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            message={`还有 ${reminders?.dueCount || 0} 个到期提醒需要处理`}
            action={<Button size="small" icon={<BellOutlined />} onClick={() => navigate('/lottery/workbench')}>处理</Button>}
          />
        ) : null}
      </Spin>
    </LifePageShell>
  );
};

export default LotteryMonthEndReviewPage;
