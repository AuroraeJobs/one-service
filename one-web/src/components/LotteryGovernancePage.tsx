import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Button, Card, Empty, Progress, Space, Spin, Tag } from 'antd';
import {
  AppstoreOutlined,
  AuditOutlined,
  BellOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  CompassOutlined,
  ExperimentOutlined,
  MobileOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import {
  lotteryExportApi,
  lotteryOutcomeApi,
  lotteryOperationsApi,
  lotteryPreferenceApi,
  lotteryRecommendationApi,
  lotteryReminderApi,
  lotteryStrategyNoteApi,
  lotteryStrategyPortfolioApi,
  lotteryTicketPackApi,
  lotteryWorkbenchApi,
  type LotteryAuditEvent,
  type LotteryOperationsHealthSummary,
  type LotteryOutcomeAttributionRollup,
  type LotteryPreference,
  type LotteryRecommendationRollup,
  type LotteryReminderSummary,
  type LotteryStrategyNote,
  type LotteryStrategyPortfolioSummary,
  type LotteryTicketPack,
  type LotteryWorkbenchSummary
} from '../services/api';
import { lotteryCodeLabel, lotteryStatusLabel } from '../utils/lotteryStatusLabel';
import './LotteryOverviewPage.css';

type GovernanceStatus = 'PASS' | 'WARNING' | 'FAILED' | 'MANUAL';

interface GovernanceDomain {
  key: string;
  title: string;
  status: GovernanceStatus;
  score: number;
  message: string;
  detail: string;
  path: string;
  icon: ReactNode;
}

interface GovernanceAnomaly {
  key: string;
  title: string;
  status: GovernanceStatus;
  count: number;
  detail: string;
  trend: string;
  path: string;
}

interface GovernanceTrend {
  key: string;
  label: string;
  value: string;
  detail: string;
  status: GovernanceStatus;
  path: string;
}

const statusColor = (status?: string) => {
  if (status === 'PASS') return 'green';
  if (status === 'WARNING' || status === 'MANUAL') return 'gold';
  if (status === 'FAILED' || status === 'HIGH') return 'red';
  return 'default';
};

const statusScore = (status: GovernanceStatus) => {
  if (status === 'PASS') return 100;
  if (status === 'WARNING' || status === 'MANUAL') return 72;
  return 35;
};

const failureCategoryLabel = (category?: string) => {
  if (category === 'PROXY_OR_NETWORK_BLOCK') return '代理/网络阻断';
  if (category === 'HTTP_FAILURE') return 'HTTP失败';
  if (category === 'BLANK_RESPONSE') return '空响应';
  if (category === 'INVALID_JSON') return '响应解析失败';
  if (category === 'BUSINESS_FAILURE') return '接口业务失败';
  if (category === 'REQUEST_EXCEPTION') return '请求异常';
  if (category === 'PROXY_CONFIG_INVALID') return '代理配置错误';
  return category || '暂无诊断';
};

const formatTime = (value?: number) => value ? new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
}).format(new Date(value)) : '-';

const latestEvents = (events: LotteryAuditEvent[], type: string) => events.filter(event => event.eventType === type);

const ageHours = (timestamp?: number) => timestamp ? (Date.now() - timestamp) / (60 * 60 * 1000) : Number.POSITIVE_INFINITY;

const recentAuditEvents = (events: LotteryAuditEvent[], days: number) =>
  events.filter(event => ageHours(event.generatedAt) <= days * 24);

const attributionWarningRows = (rollup?: LotteryOutcomeAttributionRollup) =>
  (rollup?.rows || []).filter(item => item.evidenceQuality === 'WATCH' || item.evidenceQuality === 'NEGATIVE' || item.evidenceQuality === 'UNDER_TESTED');

const buildGovernancePath = (base: string, params: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  });
  const serialized = query.toString();
  return serialized ? `${base}?${serialized}` : base;
};

const LotteryGovernancePage = () => {
  const navigate = useNavigate();
  const [preference, setPreference] = useState<LotteryPreference>();
  const [workbench, setWorkbench] = useState<LotteryWorkbenchSummary>();
  const [operations, setOperations] = useState<LotteryOperationsHealthSummary>();
  const [reminders, setReminders] = useState<LotteryReminderSummary>();
  const [attributionRollup, setAttributionRollup] = useState<LotteryOutcomeAttributionRollup>();
  const [recommendationRollup, setRecommendationRollup] = useState<LotteryRecommendationRollup>();
  const [portfolios, setPortfolios] = useState<LotteryStrategyPortfolioSummary[]>([]);
  const [ticketPacks, setTicketPacks] = useState<LotteryTicketPack[]>([]);
  const [notes, setNotes] = useState<LotteryStrategyNote[]>([]);
  const [audits, setAudits] = useState<LotteryAuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const loadGovernance = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [nextPreference, nextWorkbench, nextOperations, nextReminders, nextAttributionRollup, nextRecommendationRollup, nextPortfolios, nextTicketPacks, nextNotes, nextAudits] = await Promise.all([
        lotteryPreferenceApi.preference(),
        lotteryWorkbenchApi.summary(),
        lotteryOperationsApi.health(),
        lotteryReminderApi.summary(),
        lotteryOutcomeApi.rollup({ window: 'recent10' }),
        lotteryRecommendationApi.rollup({ window: 'recent30', limit: 30 }),
        lotteryStrategyPortfolioApi.portfolios({ page: 1, pageSize: 50 }),
        lotteryTicketPackApi.ticketPacks({ page: 1, pageSize: 50 }),
        lotteryStrategyNoteApi.notes({ page: 1, pageSize: 30 }),
        lotteryExportApi.auditEvents({ page: 1, pageSize: 80 })
      ]);
      setPreference(nextPreference);
      setWorkbench(nextWorkbench);
      setOperations(nextOperations);
      setReminders(nextReminders);
      setAttributionRollup(nextAttributionRollup);
      setRecommendationRollup(nextRecommendationRollup);
      setPortfolios(nextPortfolios.items || []);
      setTicketPacks(nextTicketPacks.items || []);
      setNotes(nextNotes.items || []);
      setAudits(nextAudits.items || []);
    } catch (requestError) {
      console.error('读取彩票治理看板失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取彩票治理看板失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGovernance();
  }, [loadGovernance]);

  const domains = useMemo<GovernanceDomain[]>(() => {
    const portfolioThreshold = preference?.governancePortfolioScoreThreshold ?? 70;
    const highRiskLimit = preference?.governanceSimulatorHighRiskLimit ?? 2;
    const ticketPackExposureThreshold = preference?.governanceTicketPackBudgetExposurePercent ?? 90;
    const freshnessDays = preference?.governanceEvidenceFreshnessDays ?? 14;
    const staleApprovalHours = preference?.governanceStaleApprovalHours ?? 24;

    const portfolioWarnings = portfolios.filter(item => (item.healthScore || 0) < portfolioThreshold || item.healthStatus !== 'PASS');
    const highRiskSimulations = latestEvents(audits, 'LOTTERY_SIMULATION_RUN')
      .filter(event => event.filters?.riskLevel === 'HIGH');
    const pendingPacks = ticketPacks.filter(pack => pack.approvalState !== 'APPROVED' && pack.status !== 'SAVED');
    const stalePacks = pendingPacks.filter(pack => ageHours(pack.updatedAt || pack.createdAt) > staleApprovalHours);
    const overBudgetPacks = ticketPacks.filter(pack => {
      const usage = Math.max(pack.budgetPrecheck?.weeklyUsagePercent || 0, pack.budgetPrecheck?.monthlyUsagePercent || 0);
      return usage >= ticketPackExposureThreshold || pack.budgetPrecheck?.status === 'OVER';
    });
    const staleEvidence = portfolios.filter(item => ageHours(item.generatedAt) > freshnessDays * 24);
    const attributionWarnings = attributionWarningRows(attributionRollup);
    const recommendationOpenGap = Math.max(0, (recommendationRollup?.activeCount || 0) - (recommendationRollup?.appliedCount || 0));
    const recommendationWarnings = (recommendationRollup?.staleCount || 0) + recommendationOpenGap;
    const exportEvents = audits.filter(event => event.eventType?.includes('EXPORT'));
    const release = workbench?.releaseCheckSummary;

    return [
      {
        key: 'portfolio',
        title: '策略组合健康',
        status: portfolioWarnings.length ? 'WARNING' : 'PASS',
        score: portfolios.length ? Math.round(portfolios.reduce((sum, item) => sum + (item.healthScore || 0), 0) / portfolios.length) : 0,
        message: portfolioWarnings.length ? `${portfolioWarnings.length} 个组合低于阈值` : '组合健康通过',
        detail: `阈值 ${portfolioThreshold} 分 · ${portfolios.length} 个组合`,
        path: '/lottery/strategy-portfolios',
        icon: <AppstoreOutlined />
      },
      {
        key: 'simulator',
        title: '沙盘风险',
        status: highRiskSimulations.length > highRiskLimit ? 'FAILED' : highRiskSimulations.length ? 'WARNING' : 'PASS',
        score: Math.max(0, 100 - highRiskSimulations.length * 25),
        message: highRiskSimulations.length ? `${highRiskSimulations.length} 次高风险模拟` : '近期沙盘无高风险',
        detail: `上限 ${highRiskLimit} 次 · 审计 ${latestEvents(audits, 'LOTTERY_SIMULATION_RUN').length} 条`,
        path: '/lottery/simulator',
        icon: <ExperimentOutlined />
      },
      {
        key: 'ticket-pack',
        title: '票包审批与暴露',
        status: stalePacks.length || overBudgetPacks.length ? 'WARNING' : 'PASS',
        score: Math.max(30, 100 - stalePacks.length * 20 - overBudgetPacks.length * 20),
        message: `${pendingPacks.length} 个待审批，${overBudgetPacks.length} 个预算预警`,
        detail: `暴露阈值 ${ticketPackExposureThreshold}% · 滞留 ${staleApprovalHours} 小时`,
        path: '/lottery/ticket-packs',
        icon: <SafetyCertificateOutlined />
      },
      {
        key: 'reminders',
        title: '提醒与月末复盘',
        status: reminders?.dueCount ? 'WARNING' : 'PASS',
        score: Math.max(40, 100 - (reminders?.dueCount || 0) * 15),
        message: `${reminders?.activeCount || 0} 条活跃提醒，${reminders?.dueCount || 0} 条到期`,
        detail: `运营健康 ${lotteryStatusLabel(operations?.status)} · 月末 ${workbench?.maintenanceSummary?.collections?.length || 0} 集合`,
        path: '/lottery/month-end',
        icon: <BellOutlined />
      },
      {
        key: 'attribution',
        title: '归因质量',
        status: attributionWarnings.length ? 'WARNING' : (attributionRollup?.issueCount ? 'PASS' : 'MANUAL'),
        score: attributionRollup?.issueCount ? Math.max(45, 100 - attributionWarnings.length * 12) : statusScore('MANUAL'),
        message: attributionWarnings.length ? `${attributionWarnings.length} 个归因维度需要复核` : '归因聚合质量稳定',
        detail: `近10期 ${attributionRollup?.issueCount || 0} 期 · 警示 ${attributionWarnings.length}`,
        path: '/lottery/outcomes?focus=evidence-quality',
        icon: <BranchesOutlined />
      },
      {
        key: 'recommendation',
        title: '推荐跟进',
        status: recommendationWarnings ? 'WARNING' : (recommendationRollup?.recommendationCount ? 'PASS' : 'MANUAL'),
        score: recommendationRollup?.recommendationCount ? Math.max(45, 100 - (recommendationRollup.staleCount || 0) * 15 - recommendationOpenGap * 6) : statusScore('MANUAL'),
        message: recommendationWarnings ? `${recommendationRollup?.staleCount || 0} 条过期，${recommendationRollup?.activeCount || 0} 条待处理` : '推荐生命周期已跟进',
        detail: `近30条 ${recommendationRollup?.recommendationCount || 0} 条 · 已应用 ${recommendationRollup?.appliedCount || 0}`,
        path: '/lottery/recommendations',
        icon: <CompassOutlined />
      },
      {
        key: 'evidence',
        title: '证据新鲜度',
        status: staleEvidence.length ? 'WARNING' : 'PASS',
        score: Math.max(45, 100 - staleEvidence.length * 10),
        message: staleEvidence.length ? `${staleEvidence.length} 个组合证据需要刷新` : '证据在新鲜窗口内',
        detail: `新鲜窗口 ${freshnessDays} 天 · 最近导出 ${formatTime(exportEvents[0]?.generatedAt)}`,
        path: '/lottery/research',
        icon: <AuditOutlined />
      },
      {
        key: 'release',
        title: '发布就绪',
        status: release?.status === 'PASS' ? 'PASS' : (release?.warningCount ? 'WARNING' : 'MANUAL'),
        score: release?.totalCount ? Math.round(((release.passedCount || 0) / release.totalCount) * 100) : statusScore('MANUAL'),
        message: release?.message || '等待发布检查证据',
        detail: `${release?.passedCount || 0}/${release?.totalCount || 0} 通过`,
        path: '/lottery/exports',
        icon: <CheckCircleOutlined />
      }
    ];
  }, [attributionRollup, audits, operations, portfolios, preference, recommendationRollup, reminders, ticketPacks, workbench]);

  const archiveReviewPressure = useMemo(() => {
    const releaseWarnings = (workbench?.releaseCheckSummary?.checks || []).filter(item => item.status && item.status !== 'PASS');
    const attributionWarnings = attributionWarningRows(attributionRollup);
    const staleRecommendations = recommendationRollup?.staleCount || 0;
    const dueReminders = reminders?.dueCount || 0;
    const recentExportEvents = recentAuditEvents(audits, 14).filter(event => event.eventType?.includes('EXPORT'));
    const missingExportEvidence = recentExportEvents.length ? 0 : 1;
    const count = releaseWarnings.length + attributionWarnings.length + staleRecommendations + dueReminders + missingExportEvidence;
    return {
      count,
      status: releaseWarnings.some(item => item.status === 'FAILED') ? 'FAILED' as const : count ? 'WARNING' as const : 'PASS' as const,
      detail: `发布 ${releaseWarnings.length} · 归因 ${attributionWarnings.length} · 推荐过期 ${staleRecommendations} · 提醒 ${dueReminders}`,
      trend: recentExportEvents.length ? `近14天导出证据 ${recentExportEvents.length} 条` : '近14天暂无导出证据',
      path: '/lottery/month-end'
    };
  }, [attributionRollup, audits, recommendationRollup?.staleCount, reminders?.dueCount, workbench?.releaseCheckSummary?.checks]);

  const archiveReviewNotePath = useMemo(() => buildGovernancePath('/lottery/research/notebook', {
    title: '治理归档复核',
    status: 'ACTIVE',
    evidenceKey: `governance-archive-review:${archiveReviewPressure.count}`,
    evidenceType: 'ARCHIVE_REVIEW',
    evidenceTitle: `治理归档复核压力 ${archiveReviewPressure.count} 项`,
    sourceId: 'governance',
    path: buildGovernancePath('/lottery/exports', { preset: 'v34-archive-search' })
  }), [archiveReviewPressure.count]);

  const archiveReviewNoteQuality = useMemo(() => {
    const archiveNotes = notes.filter(note => (note.evidence || []).some(evidence => evidence.evidenceType === 'ARCHIVE_REVIEW'));
    const active = archiveNotes.filter(note => note.status === 'ACTIVE').length;
    const validated = archiveNotes.filter(note => note.status === 'VALIDATED').length;
    const evidenceCount = archiveNotes.reduce((sum, note) => sum + (note.evidence || []).filter(evidence => evidence.evidenceType === 'ARCHIVE_REVIEW').length, 0);
    return {
      total: archiveNotes.length,
      active,
      validated,
      evidenceCount,
      status: archiveNotes.length ? (active ? 'WARNING' : validated ? 'PASS' : 'MANUAL') : 'MANUAL' as GovernanceStatus
    };
  }, [notes]);

  const anomalyItems = useMemo<GovernanceAnomaly[]>(() => {
    const highRiskLimit = preference?.governanceSimulatorHighRiskLimit ?? 2;
    const ticketPackExposureThreshold = preference?.governanceTicketPackBudgetExposurePercent ?? 90;
    const staleApprovalHours = preference?.governanceStaleApprovalHours ?? 24;

    const highRiskSimulations = latestEvents(audits, 'LOTTERY_SIMULATION_RUN')
      .filter(event => event.filters?.riskLevel === 'HIGH');
    const pendingPacks = ticketPacks.filter(pack => pack.approvalState !== 'APPROVED' && pack.status !== 'SAVED');
    const stalePacks = pendingPacks.filter(pack => ageHours(pack.updatedAt || pack.createdAt) > staleApprovalHours);
    const overBudgetPacks = ticketPacks.filter(pack => {
      const usage = Math.max(pack.budgetPrecheck?.weeklyUsagePercent || 0, pack.budgetPrecheck?.monthlyUsagePercent || 0);
      return usage >= ticketPackExposureThreshold || pack.budgetPrecheck?.status === 'OVER';
    });
    const healthWarnings = (operations?.contributors || []).filter(item => item.status && item.status !== 'PASS');
    const attributionWarnings = attributionWarningRows(attributionRollup);
    const recommendationOpenGap = Math.max(0, (recommendationRollup?.activeCount || 0) - (recommendationRollup?.appliedCount || 0));
    const releaseWarnings = (workbench?.releaseCheckSummary?.checks || []).filter(item => item.status && item.status !== 'PASS');
    const syncSummary = workbench?.latestSyncSummary;
    const syncWarningCount = (syncSummary?.failedCount || 0) + (syncSummary?.skippedCount || 0) + (syncSummary?.latestNetworkBlockSuspected ? 1 : 0);
    const items: GovernanceAnomaly[] = [];

    if (healthWarnings.length) {
      items.push({
        key: 'operations-health',
        title: '运营健康待复核',
        status: healthWarnings.some(item => item.status === 'FAILED') ? 'FAILED' : 'WARNING',
        count: healthWarnings.length,
        detail: healthWarnings.map(item => item.label || item.key).filter(Boolean).slice(0, 3).join('、') || '运营健康贡献项异常',
        trend: `最近更新 ${formatTime(operations?.generatedAt)}`,
        path: healthWarnings.find(item => item.path)?.path || '/lottery/workbench'
      });
    }

    if (highRiskSimulations.length) {
      items.push({
        key: 'simulation-risk',
        title: '沙盘高风险模拟',
        status: highRiskSimulations.length > highRiskLimit ? 'FAILED' : 'WARNING',
        count: highRiskSimulations.length,
        detail: `高风险上限 ${highRiskLimit} 次，需复核参数和回填结果`,
        trend: `近14天沙盘审计 ${recentAuditEvents(highRiskSimulations, 14).length} 条`,
        path: '/lottery/simulator'
      });
    }

    if (stalePacks.length || overBudgetPacks.length) {
      items.push({
        key: 'ticket-pack-exposure',
        title: '票包审批或预算暴露',
        status: 'WARNING',
        count: stalePacks.length + overBudgetPacks.length,
        detail: `滞留 ${stalePacks.length} 个，预算预警 ${overBudgetPacks.length} 个`,
        trend: `最久滞留 ${Math.max(0, ...stalePacks.map(pack => Math.floor(ageHours(pack.updatedAt || pack.createdAt))))} 小时`,
        path: '/lottery/ticket-packs'
      });
    }

    if (attributionWarnings.length) {
      items.push({
        key: 'attribution-drift',
        title: '归因证据漂移',
        status: 'WARNING',
        count: attributionWarnings.length,
        detail: attributionWarnings.map(item => item.label || item.key || item.dimension).filter(Boolean).slice(0, 3).join('、') || '归因质量需要复核',
        trend: `近10期样本 ${attributionRollup?.issueCount || 0} 期`,
        path: '/lottery/outcomes?focus=evidence-quality'
      });
    }

    if ((recommendationRollup?.staleCount || 0) || recommendationOpenGap) {
      items.push({
        key: 'recommendation-stale',
        title: '推荐跟进滞留',
        status: 'WARNING',
        count: (recommendationRollup?.staleCount || 0) + recommendationOpenGap,
        detail: `${recommendationRollup?.staleCount || 0} 条过期，${recommendationOpenGap} 条未闭环`,
        trend: `近30条流转 ${recommendationRollup?.transitions?.length || 0} 类`,
        path: '/lottery/recommendations'
      });
    }

    if (releaseWarnings.length) {
      items.push({
        key: 'release-readiness',
        title: '发布检查未通过',
        status: releaseWarnings.some(item => item.status === 'FAILED') ? 'FAILED' : 'WARNING',
        count: releaseWarnings.length,
        detail: releaseWarnings.map(item => item.label || item.key).filter(Boolean).slice(0, 3).join('、') || '发布检查需要补证据',
        trend: `检查更新时间 ${formatTime(workbench?.releaseCheckSummary?.generatedAt)}`,
        path: '/lottery/exports'
      });
    }

    if (archiveReviewPressure.count > 0) {
      items.push({
        key: 'archive-review-pressure',
        title: '归档复核压力',
        status: archiveReviewPressure.status,
        count: archiveReviewPressure.count,
        detail: archiveReviewPressure.detail,
        trend: archiveReviewPressure.trend,
        path: archiveReviewPressure.path
      });
    }

    if (syncWarningCount || syncSummary?.latestStatus === 'FAILED') {
      items.push({
        key: 'provider-reliability',
        title: 'Provider可靠性复核',
        status: syncSummary?.latestNetworkBlockSuspected || syncSummary?.latestStatus === 'FAILED' ? 'FAILED' : 'WARNING',
        count: Math.max(1, syncWarningCount),
        detail: `${syncSummary?.latestProvider || 'provider'} · ${failureCategoryLabel(syncSummary?.latestFailureCategory)}`,
        trend: `同步成功率 ${syncSummary?.successRate ?? 0}% · 最近完成 ${formatTime(syncSummary?.latestFinishedAt)}`,
        path: '/lottery/sync?focus=provider-reliability'
      });
    }

    return items.sort((left, right) => {
      const weight = (status: GovernanceAnomaly['status']) => status === 'FAILED' ? 0 : status === 'WARNING' ? 1 : 2;
      return weight(left.status) - weight(right.status) || right.count - left.count;
    });
  }, [archiveReviewPressure, attributionRollup, audits, operations, preference, recommendationRollup, ticketPacks, workbench]);

  const driftTrendItems = useMemo<GovernanceTrend[]>(() => {
    const recentEvents = recentAuditEvents(audits, 14);
    const simulationEvents = recentEvents.filter(event => event.eventType === 'LOTTERY_SIMULATION_RUN');
    const exportEvents = recentEvents.filter(event => event.eventType?.includes('EXPORT'));
    const attributionWarnings = attributionWarningRows(attributionRollup);
    const healthWarningCount = operations?.warningCount || operations?.contributors?.filter(item => item.status && item.status !== 'PASS').length || 0;
    const recommendationTransitions = recommendationRollup?.transitions || [];
    const syncSummary = workbench?.latestSyncSummary;

    return [
      {
        key: 'provider-reliability',
        label: '同步可靠性',
        value: `${syncSummary?.successRate ?? 0}%`,
        detail: `${syncSummary?.latestProvider || 'provider'} · ${failureCategoryLabel(syncSummary?.latestFailureCategory)} · ${syncSummary?.latestRequestMode || '-'}`,
        status: syncSummary?.latestNetworkBlockSuspected || syncSummary?.latestStatus === 'FAILED' ? 'FAILED' : (syncSummary?.failedCount ? 'WARNING' : syncSummary ? 'PASS' : 'MANUAL'),
        path: '/lottery/sync?focus=provider-reliability'
      },
      {
        key: 'audit-repeat',
        label: '近14天审计重复',
        value: `${recentEvents.length} 条`,
        detail: `沙盘 ${simulationEvents.length} 条，导出 ${exportEvents.length} 条`,
        status: recentEvents.length > 12 ? 'WARNING' : 'PASS',
        path: '/lottery/exports'
      },
      {
        key: 'recommendation-transition',
        label: '推荐状态流转',
        value: `${recommendationTransitions.length} 类`,
        detail: `${recommendationRollup?.staleCount || 0} 条过期，${recommendationRollup?.appliedCount || 0} 条已应用`,
        status: recommendationRollup?.staleCount ? 'WARNING' : recommendationTransitions.length ? 'PASS' : 'MANUAL',
        path: '/lottery/recommendations'
      },
      {
        key: 'attribution-quality',
        label: '归因质量警示',
        value: `${attributionWarnings.length} 项`,
        detail: `近10期 ${attributionRollup?.issueCount || 0} 期，样本 ${attributionRollup?.ticketCount || 0} 张`,
        status: attributionWarnings.length ? 'WARNING' : attributionRollup?.issueCount ? 'PASS' : 'MANUAL',
        path: '/lottery/outcomes?focus=evidence-quality'
      },
      {
        key: 'archive-review-pressure',
        label: '归档复核压力',
        value: `${archiveReviewPressure.count} 项`,
        detail: archiveReviewPressure.detail,
        status: archiveReviewPressure.status,
        path: archiveReviewPressure.path
      },
      {
        key: 'archive-review-note-quality',
        label: '复核笔记质量',
        value: `${archiveReviewNoteQuality.validated}/${archiveReviewNoteQuality.total}`,
        detail: `验证中 ${archiveReviewNoteQuality.active} 条，复核证据 ${archiveReviewNoteQuality.evidenceCount} 条`,
        status: archiveReviewNoteQuality.status,
        path: '/lottery/research/notebook?evidence=ARCHIVE_REVIEW'
      },
      {
        key: 'operations-freshness',
        label: '运营健康刷新',
        value: formatTime(operations?.generatedAt),
        detail: `${healthWarningCount} 个健康贡献项需关注`,
        status: healthWarningCount ? 'WARNING' : operations?.generatedAt ? 'PASS' : 'MANUAL',
        path: '/lottery/workbench'
      }
    ];
  }, [archiveReviewNoteQuality, archiveReviewPressure, attributionRollup, audits, operations, recommendationRollup, workbench]);

  const overallScore = domains.length ? Math.round(domains.reduce((sum, item) => sum + item.score, 0) / domains.length) : 0;
  const warningCount = domains.filter(item => item.status !== 'PASS').length;

  return (
    <LifePageShell
      className="lottery-prediction-page lottery-governance-page"
      eyebrow="彩票数据"
      title="治理看板"
      actions={
        <Space wrap>
          <Button icon={<MobileOutlined />} onClick={() => navigate('/lottery/mobile')}>移动指挥</Button>
          <Button icon={<SyncOutlined />} onClick={() => navigate('/lottery/sync')}>同步</Button>
          <Button icon={<BranchesOutlined />} onClick={() => navigate('/lottery/outcomes?focus=evidence-quality')}>归因</Button>
          <Button icon={<CompassOutlined />} onClick={() => navigate('/lottery/recommendations')}>推荐</Button>
          <Button onClick={() => navigate('/lottery/settings')}>阈值设置</Button>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadGovernance}>刷新</Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}
      <Spin spinning={loading && !workbench}>
        <section className="lottery-governance-hero">
          <div>
            <strong>{overallScore}</strong>
            <span>综合治理分</span>
          </div>
          <Progress percent={overallScore} strokeColor={warningCount ? '#ff9500' : '#34c759'} />
          <Space wrap>
            <Tag color={warningCount ? 'gold' : 'green'}>{warningCount ? `${warningCount} 项需处理` : '全部通过'}</Tag>
            <Tag>最新期 {workbench?.dailyState?.latestIssue || '-'}</Tag>
            <Tag>下期 {workbench?.dailyState?.nextIssue || '-'}</Tag>
          </Space>
        </section>

        <section className="lottery-governance-grid">
          {domains.map(domain => (
            <Card key={domain.key} className="life-panel-card lottery-clean-panel">
              <div className="lottery-governance-card-head">
                <span>{domain.icon}</span>
                <div>
                  <strong>{domain.title}</strong>
                  <small>{domain.detail}</small>
                </div>
                <Tag color={statusColor(domain.status)}>{lotteryStatusLabel(domain.status)}</Tag>
              </div>
              <Progress percent={domain.score} size="small" status={domain.status === 'FAILED' ? 'exception' : 'normal'} />
              <p>{domain.message}</p>
              <Button size="small" onClick={() => navigate(domain.path)}>处理</Button>
            </Card>
          ))}
        </section>

        <section className="lottery-governance-release-grid">
          <Card
            className="life-panel-card lottery-clean-panel"
            title="异常观察"
            extra={archiveReviewPressure.count > 0 ? (
              <Button size="small" icon={<AuditOutlined />} onClick={() => navigate(archiveReviewNotePath)}>
                记录复核
              </Button>
            ) : undefined}
          >
            <div className="lottery-governance-anomaly-list">
              {anomalyItems.length ? anomalyItems.map(item => (
                <button key={item.key} type="button" onClick={() => navigate(item.path)}>
                  <span>
                    <strong><WarningOutlined /> {item.title}</strong>
                    <small>{item.detail}</small>
                    <small>{item.trend}</small>
                  </span>
                  <Tag color={statusColor(item.status)}>{item.count} 条</Tag>
                </button>
              )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无异常观察" />}
            </div>
          </Card>
          <Card className="life-panel-card lottery-clean-panel" title="漂移趋势">
            <div className="lottery-governance-trend-list">
              {driftTrendItems.map(item => (
                <button key={item.key} type="button" onClick={() => navigate(item.path)}>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <Tag color={statusColor(item.status)}>{item.value}</Tag>
                </button>
              ))}
            </div>
          </Card>
          <Card className="life-panel-card lottery-clean-panel" title="发布检查">
            {workbench?.releaseCheckSummary?.checks?.length ? workbench.releaseCheckSummary.checks.map(check => (
              <button key={check.key} type="button" onClick={() => navigate(check.path || '/lottery/exports')}>
                <span><WarningOutlined /> {check.label || check.key}</span>
                <Tag color={statusColor(check.status)}>{lotteryStatusLabel(check.status)}</Tag>
              </button>
            )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无发布检查" />}
          </Card>
          <Card className="life-panel-card lottery-clean-panel" title="最近治理证据">
            <div className="lottery-governance-audit-list">
              {audits.length ? audits.slice(0, 8).map(event => (
                <button key={event.id || `${event.eventType}-${event.generatedAt}`} type="button" onClick={() => navigate('/lottery/exports')}>
                  <span>{lotteryCodeLabel(event.eventType)}</span>
                  <small>{formatTime(event.generatedAt)} · {event.rowCount || 0} 行</small>
                </button>
              )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无治理证据" />}
            </div>
          </Card>
        </section>
      </Spin>
    </LifePageShell>
  );
};

export default LotteryGovernancePage;
