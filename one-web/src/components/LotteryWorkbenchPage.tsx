import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Button, Card, Empty, Progress, Space, Spin, Steps, Tag, message } from 'antd';
import {
  BarChartOutlined,
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  DownloadOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  HistoryOutlined,
  PieChartOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import LotteryBalls from './lottery/LotteryBalls';
import {
  lotteryBacktestApi,
  lotteryBudgetApi,
  lotteryCalendarApi,
  lotteryExperimentApi,
  lotteryExportApi,
  lotteryPredictionApi,
  lotteryTicketApi,
  lotteryWorkbenchApi,
  type LotteryAuditEvent,
  type LotteryBacktestReport,
  type LotteryBudgetStatus,
  type LotteryCalendarState,
  type LotteryDailyStateItem,
  type LotteryPredictionSnapshot,
  type LotteryStrategyExperiment,
  type LotteryTicket,
  type LotteryWorkbenchDailyRunResult,
  type LotteryWorkbenchStepResult,
  type LotteryWorkbenchSummary
} from '../services/api';
import './LotteryOverviewPage.css';

interface LotteryWorkbenchRecentWork {
  predictions: LotteryPredictionSnapshot[];
  tickets: LotteryTicket[];
  experiments: LotteryStrategyExperiment[];
  backtests: LotteryBacktestReport[];
  exports: LotteryAuditEvent[];
}

interface LotteryRecentWorkLink {
  key: string;
  title: string;
  detail: string;
  path: string;
}

const settledItems = <T,>(result: PromiseSettledResult<{ items?: T[] }>) =>
  result.status === 'fulfilled' ? result.value.items || [] : [];

const fetchRecentWork = async (): Promise<LotteryWorkbenchRecentWork> => {
  const [predictions, tickets, experiments, backtests, exports] = await Promise.allSettled([
    lotteryPredictionApi.historyPage({ page: 1, pageSize: 3 }),
    lotteryTicketApi.ticketsPage({ page: 1, pageSize: 3 }),
    lotteryExperimentApi.experiments({ page: 1, pageSize: 3 }),
    lotteryBacktestApi.reports({ page: 1, pageSize: 3 }),
    lotteryExportApi.auditEvents({ page: 1, pageSize: 3 })
  ]);

  return {
    predictions: settledItems<LotteryPredictionSnapshot>(predictions),
    tickets: settledItems<LotteryTicket>(tickets),
    experiments: settledItems<LotteryStrategyExperiment>(experiments),
    backtests: settledItems<LotteryBacktestReport>(backtests),
    exports: settledItems<LotteryAuditEvent>(exports)
  };
};

const createEmptyRecentWork = (): LotteryWorkbenchRecentWork => ({
  predictions: [],
  tickets: [],
  experiments: [],
  backtests: [],
  exports: []
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
  const [budgetStatus, setBudgetStatus] = useState<LotteryBudgetStatus>();
  const [recentWork, setRecentWork] = useState<LotteryWorkbenchRecentWork>(createEmptyRecentWork);
  const [dailyRunResult, setDailyRunResult] = useState<LotteryWorkbenchDailyRunResult>();
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [checkingPrize, setCheckingPrize] = useState(false);
  const [error, setError] = useState<string>();

  const qualityIssueCount = useMemo(() => getQualityIssueCount(summary), [summary]);
  const dailyState = summary?.dailyState;
  const latestSyncStatus = summary?.latestSyncSummary?.latestStatus || 'UNKNOWN';
  const trainingStatus = summary?.trainingStatus;
  const trainingPercent = Math.max(0, Math.min(100, trainingStatus?.percent ?? 0));

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [data, calendarData, budgetData, recentWorkData] = await Promise.all([
        lotteryWorkbenchApi.summary(),
        lotteryCalendarApi.calendar(),
        lotteryBudgetApi.status(),
        fetchRecentWork()
      ]);
      setSummary(data);
      setCalendar(calendarData);
      setBudgetStatus(budgetData);
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

  const runDailyWork = async () => {
    setRunning(true);
    setError(undefined);
    try {
      const result = await lotteryWorkbenchApi.dailyRun();
      setDailyRunResult(result);
      setSummary(result.summary);
      const [calendarData, budgetData, recentWorkData] = await Promise.all([
        lotteryCalendarApi.calendar(),
        lotteryBudgetApi.status(),
        fetchRecentWork()
      ]);
      setCalendar(calendarData);
      setBudgetStatus(budgetData);
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
      value: latestSyncStatus,
      detail: formatDateTime(summary?.latestSyncSummary?.latestFinishedAt),
      path: dailyState?.syncState?.path || '/lottery/sync'
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
      path: dailyState?.prizeCheckState?.path || dailyState?.ticketState?.path || '/lottery/tickets'
    },
    {
      key: 'ledger',
      icon: <PieChartOutlined />,
      label: '账本净值',
      value: formatCurrency(summary?.ledgerSummary?.netResult),
      detail: `ROI ${summary?.ledgerSummary?.roiPercent ?? 0}%`,
      path: '/lottery/ledger'
    }
  ];

  const quickActions = [
    {
      key: 'sync',
      icon: <SyncOutlined />,
      label: '同步',
      detail: latestSyncStatus,
      onClick: () => navigate(dailyState?.syncState?.path || '/lottery/sync')
    },
    {
      key: 'prediction',
      icon: <ThunderboltOutlined />,
      label: '预测',
      detail: trainingStatus?.running ? '训练中' : (dailyState?.predictionState?.status || '就绪'),
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
      detail: `${calendar?.reminders?.length || 0} 条`,
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

  const dailyStateItems: LotteryDailyStateItem[] = [
    dailyState?.syncState,
    dailyState?.predictionState,
    dailyState?.ticketState,
    dailyState?.prizeCheckState,
    dailyState?.qualityState
  ].filter(Boolean) as LotteryDailyStateItem[];

  const stepItems = (dailyRunResult?.steps || []).map((step: LotteryWorkbenchStepResult) => ({
    title: step.step || '任务',
    status: toStepStatus(step.status),
    description: (
      <Space direction="vertical" size={2}>
        <Space wrap size={6}>
          <Tag color={stepStatusColor(step.status)}>{step.status || 'UNKNOWN'}</Tag>
          {step.savedCount !== undefined ? <Tag>新增 {step.savedCount}</Tag> : null}
          {step.checkedCount !== undefined ? <Tag>核验 {step.checkedCount}</Tag> : null}
          {step.updatedCount !== undefined ? <Tag>更新 {step.updatedCount}</Tag> : null}
        </Space>
        <span>{step.error || step.message || '-'}</span>
      </Space>
    )
  }));

  const recentWorkGroups = useMemo(() => {
    const groups: Array<{
      key: string;
      icon: ReactNode;
      title: string;
      path: string;
      items: LotteryRecentWorkLink[];
    }> = [
      {
        key: 'predictions',
        icon: <ThunderboltOutlined />,
        title: '预测',
        path: '/lottery/predictions/history',
        items: recentWork.predictions.map(item => ({
          key: item.id || `prediction-${item.targetPeriod}-${item.createdAt}`,
          title: `第 ${item.targetPeriod || '-'} 期`,
          detail: `${item.ruleName || item.ruleId || '未记录规则'} · ${formatDateTime(item.createdAt)}`,
          path: item.id ? `/lottery/predictions/${item.id}` : '/lottery/predictions/history'
        }))
      },
      {
        key: 'tickets',
        icon: <FileTextOutlined />,
        title: '票据',
        path: '/lottery/tickets',
        items: recentWork.tickets.map(item => ({
          key: item.id || `ticket-${item.issue}-${item.createdAt}`,
          title: `第 ${item.issue || item.period || '-'} 期`,
          detail: `${item.source || 'MANUAL'} · ${item.status || 'UNKNOWN'} · ${formatDateTime(item.updatedAt || item.createdAt)}`,
          path: item.issue ? `/lottery/tickets?issue=${item.issue}` : '/lottery/tickets'
        }))
      },
      {
        key: 'experiments',
        icon: <ExperimentOutlined />,
        title: '实验',
        path: '/lottery/experiments',
        items: recentWork.experiments.map(item => ({
          key: item.id || `experiment-${item.strategyName}-${item.createdAt}`,
          title: item.strategyName || '策略实验',
          detail: `${item.scale || '-'} · 回放 ${item.replayWindow || 0} · ${formatDateTime(item.createdAt)}`,
          path: item.id ? `/lottery/experiments/${item.id}` : '/lottery/experiments'
        }))
      },
      {
        key: 'backtests',
        icon: <BarChartOutlined />,
        title: '回测',
        path: '/lottery/backtests',
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
        items: recentWork.exports.map(item => ({
          key: item.id || `export-${item.targetId || item.generatedAt}`,
          title: item.targetType || item.eventType || '导出记录',
          detail: `${item.rowCount || 0} 行 · ${formatDateTime(item.generatedAt)}`,
          path: '/lottery/exports'
        }))
      }
    ];

    return groups;
  }, [recentWork]);

  return (
    <LifePageShell
      className="lottery-prediction-page lottery-workbench-page"
      eyebrow="彩票数据"
      title="日常工作台"
      actions={
        <Space wrap>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadSummary}>
            刷新
          </Button>
          <Button icon={<SyncOutlined />} onClick={() => navigate('/lottery/sync')}>
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

      <Spin spinning={loading && !summary}>
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

        {dailyStateItems.length > 0 ? (
          <section className="lottery-workbench-daily-state">
            <div>
              <strong>第 {dailyState?.latestIssue || '-'} 期</strong>
              <span>下一期 {dailyState?.nextIssue || '-'}</span>
            </div>
            <Space wrap>
              {dailyStateItems.map(item => (
                <button
                  key={item.key || item.label}
                  type="button"
                  className="lottery-workbench-state-chip"
                  onClick={() => item.path && navigate(item.path)}
                >
                  <Tag color={dailyStateColor(item.status)}>{item.status || 'UNKNOWN'}</Tag>
                  <span>{item.label || item.key}</span>
                  {item.pendingCount ? <em>{item.pendingCount}</em> : null}
                </button>
              ))}
            </Space>
          </section>
        ) : null}

        {calendar ? (
          <section className="lottery-workbench-daily-state lottery-workbench-calendar-state">
            <div>
              <strong>{calendar.nextDrawDate || '-'} {calendar.drawWeekday || ''}</strong>
              <span>同步窗口 {formatDateTime(calendar.expectedSyncStartAt)} - {formatDateTime(calendar.expectedSyncEndAt)}</span>
            </div>
            <Space wrap>
              <Tag color={calendar.currentIssueState === 'BEFORE_DRAW' ? 'blue' : 'orange'}>{calendar.currentIssueState || 'UNKNOWN'}</Tag>
              <Button size="small" icon={<BellOutlined />} onClick={() => navigate('/lottery/alerts')}>
                提醒 {calendar.reminders?.length || 0}
              </Button>
            </Space>
          </section>
        ) : null}

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
                <Button size="small" onClick={() => navigate(dailyState?.predictionState?.path || '/lottery/predictions/history')}>
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
                  {trainingStatus?.stage || (trainingStatus?.running ? 'RUNNING' : 'IDLE')}
                </Tag>
                <Tag>{trainingStatus?.processed ?? 0}/{trainingStatus?.total ?? 0}</Tag>
                {trainingStatus?.scale ? <Tag>{trainingStatus.scale}</Tag> : null}
              </Space>
              <span>{trainingStatus?.message || '训练任务未运行'}</span>
            </div>
          </Card>
        </section>

        <section className="lottery-workbench-main-grid">
          <Card className="life-panel-card lottery-clean-panel" title="日常执行结果">
            {stepItems.length > 0 ? (
              <Steps direction="vertical" size="small" items={stepItems} />
            ) : (
              <Empty description="暂无执行记录" />
            )}
          </Card>

          <Card
            className="life-panel-card lottery-clean-panel lottery-workbench-recent-card"
            title="最近工作"
            extra={
              <Button size="small" icon={<HistoryOutlined />} onClick={() => navigate('/lottery/predictions/history')}>
                历史
              </Button>
            }
          >
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
                        <button key={item.key} type="button" onClick={() => navigate(item.path)}>
                          <strong>{item.title}</strong>
                          <small>{item.detail}</small>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无记录" />
                  )}
                </section>
              ))}
            </div>
          </Card>
        </section>

        <div className="lottery-workbench-generated">
          <ClockCircleOutlined />
          <span>生成时间：{formatDateTime(summary?.generatedAt || dailyRunResult?.generatedAt)}</span>
        </div>
      </Spin>
    </LifePageShell>
  );
};

export default LotteryWorkbenchPage;
