import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
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
import {
  lotteryDecisionSetApi,
  lotteryExportApi,
  lotteryLedgerApi,
  lotteryOperationsApi,
  lotteryOutcomeApi,
  lotteryRecommendationApi,
  lotteryReminderApi,
  lotteryStrategyNoteApi,
  lotteryTicketApi,
  lotteryWorkbenchApi,
  type LotteryAuditEvent,
  type LotteryDecisionOutcomeSummary,
  type LotteryIssueLedger,
  type LotteryLedgerSummary,
  type LotteryOperationsHealthSummary,
  type LotteryOutcomeAttributionRollup,
  type LotteryPageResponse,
  type LotteryRecommendationRollup,
  type LotteryReminderSummary,
  type LotteryStrategyNote,
  type LotteryTicketSummary,
  type LotteryWorkbenchSummary
} from '../services/api';
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
  const [archiveQuery, setArchiveQuery] = useState('');
  const [archiveScopeFilter, setArchiveScopeFilter] = useState('all');
  const [archiveStatusFilter, setArchiveStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const loadReview = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [workbenchData, healthData, ledgerData, issueData, ticketData, decisionData, attributionData, recommendationData, noteData, reminderData, auditData] = await Promise.all([
        lotteryWorkbenchApi.summary(),
        lotteryOperationsApi.health(),
        lotteryLedgerApi.summary(),
        lotteryLedgerApi.issues(),
        lotteryTicketApi.summary(),
        lotteryDecisionSetApi.outcomes({ limit: 12 }),
        lotteryOutcomeApi.rollup({ window: 'month-to-date' }),
        lotteryRecommendationApi.rollup({ window: 'recent30', limit: 30 }),
        lotteryStrategyNoteApi.notes({ page: 1, pageSize: 6 }),
        lotteryReminderApi.summary(),
        lotteryExportApi.auditEvents({ page: 1, pageSize: 8 })
      ]);
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
    } catch (requestError) {
      console.error('读取彩票月末复盘失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取彩票月末复盘失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReview();
  }, [loadReview]);

  const recentIssues = useMemo(() => sortIssueLedgers(issues).slice(0, 5), [issues]);
  const exportAudits = useMemo(
    () => audits.filter(item => item.eventType === 'EXPORT' || item.eventType === 'REPORT_EXPORT' || item.targetType === 'decision-outcomes'),
    [audits]
  );
  const releaseChecks = useMemo(() => workbench?.releaseCheckSummary?.checks || [], [workbench?.releaseCheckSummary?.checks]);
  const attributionRows = useMemo(() => attributionReviewRows(attributionRollup), [attributionRollup]);
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
      const issue = item.issue || item.period || '-';
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
