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
  WarningOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import {
  lotteryExportApi,
  lotteryOutcomeApi,
  lotteryOperationsApi,
  lotteryPreferenceApi,
  lotteryReminderApi,
  lotteryStrategyPortfolioApi,
  lotteryTicketPackApi,
  lotteryWorkbenchApi,
  type LotteryAuditEvent,
  type LotteryOperationsHealthSummary,
  type LotteryOutcomeAttributionRollup,
  type LotteryPreference,
  type LotteryReminderSummary,
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

const formatTime = (value?: number) => value ? new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
}).format(new Date(value)) : '-';

const latestEvents = (events: LotteryAuditEvent[], type: string) => events.filter(event => event.eventType === type);

const ageHours = (timestamp?: number) => timestamp ? (Date.now() - timestamp) / (60 * 60 * 1000) : Number.POSITIVE_INFINITY;

const attributionWarningRows = (rollup?: LotteryOutcomeAttributionRollup) =>
  (rollup?.rows || []).filter(item => item.evidenceQuality === 'WATCH' || item.evidenceQuality === 'NEGATIVE' || item.evidenceQuality === 'UNDER_TESTED');

const LotteryGovernancePage = () => {
  const navigate = useNavigate();
  const [preference, setPreference] = useState<LotteryPreference>();
  const [workbench, setWorkbench] = useState<LotteryWorkbenchSummary>();
  const [operations, setOperations] = useState<LotteryOperationsHealthSummary>();
  const [reminders, setReminders] = useState<LotteryReminderSummary>();
  const [attributionRollup, setAttributionRollup] = useState<LotteryOutcomeAttributionRollup>();
  const [portfolios, setPortfolios] = useState<LotteryStrategyPortfolioSummary[]>([]);
  const [ticketPacks, setTicketPacks] = useState<LotteryTicketPack[]>([]);
  const [audits, setAudits] = useState<LotteryAuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const loadGovernance = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [nextPreference, nextWorkbench, nextOperations, nextReminders, nextAttributionRollup, nextPortfolios, nextTicketPacks, nextAudits] = await Promise.all([
        lotteryPreferenceApi.preference(),
        lotteryWorkbenchApi.summary(),
        lotteryOperationsApi.health(),
        lotteryReminderApi.summary(),
        lotteryOutcomeApi.rollup({ window: 'recent10' }),
        lotteryStrategyPortfolioApi.portfolios({ page: 1, pageSize: 50 }),
        lotteryTicketPackApi.ticketPacks({ page: 1, pageSize: 50 }),
        lotteryExportApi.auditEvents({ page: 1, pageSize: 80 })
      ]);
      setPreference(nextPreference);
      setWorkbench(nextWorkbench);
      setOperations(nextOperations);
      setReminders(nextReminders);
      setAttributionRollup(nextAttributionRollup);
      setPortfolios(nextPortfolios.items || []);
      setTicketPacks(nextTicketPacks.items || []);
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
        path: '/lottery/outcomes',
        icon: <BranchesOutlined />
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
  }, [attributionRollup, audits, operations, portfolios, preference, reminders, ticketPacks, workbench]);

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
          <Button icon={<BranchesOutlined />} onClick={() => navigate('/lottery/outcomes')}>归因</Button>
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
