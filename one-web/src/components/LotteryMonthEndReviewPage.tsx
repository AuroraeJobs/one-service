import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Button, Card, Empty, Progress, Space, Spin, Tag } from 'antd';
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

const LotteryMonthEndReviewPage = () => {
  const navigate = useNavigate();
  const [workbench, setWorkbench] = useState<LotteryWorkbenchSummary>();
  const [health, setHealth] = useState<LotteryOperationsHealthSummary>();
  const [ledger, setLedger] = useState<LotteryLedgerSummary>();
  const [issues, setIssues] = useState<LotteryIssueLedger[]>([]);
  const [tickets, setTickets] = useState<LotteryTicketSummary>();
  const [decisions, setDecisions] = useState<LotteryDecisionOutcomeSummary>();
  const [attributionRollup, setAttributionRollup] = useState<LotteryOutcomeAttributionRollup>();
  const [notes, setNotes] = useState<LotteryPageResponse<LotteryStrategyNote>>();
  const [reminders, setReminders] = useState<LotteryReminderSummary>();
  const [audits, setAudits] = useState<LotteryAuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const loadReview = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [workbenchData, healthData, ledgerData, issueData, ticketData, decisionData, attributionData, noteData, reminderData, auditData] = await Promise.all([
        lotteryWorkbenchApi.summary(),
        lotteryOperationsApi.health(),
        lotteryLedgerApi.summary(),
        lotteryLedgerApi.issues(),
        lotteryTicketApi.summary(),
        lotteryDecisionSetApi.outcomes({ limit: 12 }),
        lotteryOutcomeApi.rollup({ window: 'month-to-date' }),
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
  const releaseChecks = workbench?.releaseCheckSummary?.checks || [];
  const attributionRows = useMemo(() => attributionReviewRows(attributionRollup), [attributionRollup]);
  const monthEndScore = useMemo(() => {
    const healthScore = health?.score ?? 0;
    const ticketScore = tickets?.pendingTicketCount ? Math.max(40, 100 - tickets.pendingTicketCount * 12) : 100;
    const decisionScore = decisions?.warningCount ? Math.max(40, 100 - decisions.warningCount * 8) : 100;
    const attributionScore = attributionRows.length ? Math.max(45, 100 - attributionRows.reduce((sum, item) => sum + (item.warningCount || 0), 0) * 8) : 100;
    const exportScore = exportAudits.length ? 100 : 60;
    const reminderScore = reminders?.activeCount ? Math.max(40, 100 - reminders.activeCount * 8) : 100;
    return Math.round((healthScore + ticketScore + decisionScore + attributionScore + exportScore + reminderScore) / 6);
  }, [attributionRows, decisions?.warningCount, exportAudits.length, health?.score, reminders?.activeCount, tickets?.pendingTicketCount]);

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
