import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Button, Empty, Popconfirm, Progress, Segmented, Space, Spin, Tag, message } from 'antd';
import {
  BellOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CompassOutlined,
  FileTextOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import {
  lotteryOperationsApi,
  lotteryOutcomeApi,
  lotteryRecommendationApi,
  lotteryReminderApi,
  lotteryTicketPackApi,
  lotteryWorkbenchApi,
  type LotteryOperationsHealthSummary,
  type LotteryOutcomeAttribution,
  type LotteryRecommendation,
  type LotteryReminderItem,
  type LotteryReminderSummary,
  type LotteryTicketPack,
  type LotteryWorkbenchSummary
} from '../services/api';
import './LotteryOverviewPage.css';

type MobileView = 'actions' | 'packs' | 'outcomes' | 'recommendations';

interface MobileMetric {
  key: string;
  label: string;
  value: ReactNode;
  detail: string;
  status?: string;
  path: string;
  icon: ReactNode;
}

const statusColor = (status?: string) => {
  if (status === 'PASS' || status === 'COMPLETE' || status === 'PROMOTE' || status === 'APPLIED' || status === 'APPROVED' || status === 'SAVED') return 'green';
  if (status === 'WARNING' || status === 'MANUAL' || status === 'WATCH' || status === 'SNOOZED') return 'gold';
  if (status === 'FAILED' || status === 'OVER' || status === 'PAUSE' || status === 'RETIRE' || status === 'ARCHIVED') return 'red';
  if (status === 'PENDING' || status === 'OPEN') return 'orange';
  return 'default';
};

const formatTime = (value?: number) => value ? new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
}).format(new Date(value)) : '-';

const ageHours = (timestamp?: number) => timestamp ? (Date.now() - timestamp) / (60 * 60 * 1000) : 0;

const packNeedsReview = (pack: LotteryTicketPack) => pack.approvalState !== 'APPROVED' && pack.status !== 'SAVED' && pack.status !== 'ARCHIVED';

const LotteryMobileCommandPage = () => {
  const navigate = useNavigate();
  const [workbench, setWorkbench] = useState<LotteryWorkbenchSummary>();
  const [health, setHealth] = useState<LotteryOperationsHealthSummary>();
  const [reminders, setReminders] = useState<LotteryReminderSummary>();
  const [packs, setPacks] = useState<LotteryTicketPack[]>([]);
  const [outcomes, setOutcomes] = useState<LotteryOutcomeAttribution[]>([]);
  const [recommendations, setRecommendations] = useState<LotteryRecommendation[]>([]);
  const [view, setView] = useState<MobileView>('actions');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string>();
  const [error, setError] = useState<string>();

  const loadCommand = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [workbenchData, healthData, reminderData, packData, outcomeData, recommendationData] = await Promise.all([
        lotteryWorkbenchApi.summary(),
        lotteryOperationsApi.health(),
        lotteryReminderApi.summary(),
        lotteryTicketPackApi.ticketPacks({ page: 1, pageSize: 20 }),
        lotteryOutcomeApi.recent({ limit: 8 }),
        lotteryRecommendationApi.recommendations({ page: 1, pageSize: 20 })
      ]);
      setWorkbench(workbenchData);
      setHealth(healthData);
      setReminders(reminderData);
      setPacks(packData.items || []);
      setOutcomes(outcomeData || []);
      setRecommendations(recommendationData.items || []);
    } catch (requestError) {
      console.error('读取彩票移动指挥失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取彩票移动指挥失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommand();
  }, [loadCommand]);

  const activeReminders = useMemo(() => (reminders?.items || []).filter(item => !item.acknowledgedAt).slice(0, 8), [reminders?.items]);
  const reviewPacks = useMemo(() => packs.filter(packNeedsReview), [packs]);
  const settlementGaps = useMemo(() => outcomes.filter(item => (item.ticketCount || 0) > (item.checkedTicketCount || 0)), [outcomes]);
  const releaseBlockers = workbench?.releaseCheckSummary?.checks?.filter(item => item.status !== 'PASS') || [];
  const staleRecommendations = recommendations.filter(item => (item.evidenceAgeHours || 0) >= 24 && item.lifecycleStatus !== 'APPLIED');
  const staleEvidenceCount = staleRecommendations.length + packs.filter(pack => ageHours(pack.updatedAt || pack.createdAt) >= 24 && packNeedsReview(pack)).length;

  const metrics: MobileMetric[] = [
    {
      key: 'today',
      label: '今日',
      value: workbench?.dailyState?.latestIssue || health?.latestIssue || '-',
      detail: `下一期 ${workbench?.dailyState?.nextIssue || health?.nextIssue || '-'}`,
      status: workbench?.operationSummary?.status,
      path: '/lottery/workbench',
      icon: <ThunderboltOutlined />
    },
    {
      key: 'packs',
      label: '待审批',
      value: reviewPacks.length,
      detail: `${packs.length} 个票包 · ${reviewPacks.length} 个待复核`,
      status: reviewPacks.length ? 'PENDING' : 'PASS',
      path: '/lottery/ticket-packs',
      icon: <SafetyCertificateOutlined />
    },
    {
      key: 'stale',
      label: '过期证据',
      value: staleEvidenceCount,
      detail: `${staleRecommendations.length} 条推荐 · 24h+`,
      status: staleEvidenceCount ? 'WARNING' : 'PASS',
      path: '/lottery/recommendations',
      icon: <ClockCircleOutlined />
    },
    {
      key: 'settlement',
      label: '结算缺口',
      value: settlementGaps.length,
      detail: `${outcomes.length} 期归因 · ${settlementGaps.length} 期待核`,
      status: settlementGaps.length ? 'WARNING' : 'PASS',
      path: '/lottery/outcomes',
      icon: <BranchesOutlined />
    },
    {
      key: 'release',
      label: '发布阻塞',
      value: releaseBlockers.length,
      detail: workbench?.releaseCheckSummary?.message || '发布检查',
      status: releaseBlockers.length ? 'WARNING' : 'PASS',
      path: '/lottery/governance',
      icon: <WarningOutlined />
    }
  ];

  const acknowledgeReminder = async (item: LotteryReminderItem) => {
    if (!item.key || !item.fingerprint) {
      return;
    }
    setActionLoading(`ack-${item.key}`);
    try {
      const result = await lotteryReminderApi.acknowledge(item.key, item.fingerprint, 'mobile command acknowledgement');
      setReminders(result);
      message.success('提醒已确认');
    } catch (requestError) {
      console.error('移动指挥确认提醒失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '移动指挥确认提醒失败');
      message.error('移动指挥确认提醒失败');
    } finally {
      setActionLoading(undefined);
    }
  };

  const snoozeReminder = async (item: LotteryReminderItem) => {
    if (!item.key || !item.fingerprint) {
      return;
    }
    setActionLoading(`snooze-${item.key}`);
    try {
      const result = await lotteryReminderApi.snooze(item.key, item.fingerprint, 60);
      setReminders(result);
      message.success('已稍后 1 小时');
    } catch (requestError) {
      console.error('移动指挥稍后提醒失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '移动指挥稍后提醒失败');
      message.error('移动指挥稍后提醒失败');
    } finally {
      setActionLoading(undefined);
    }
  };

  const runPackAction = async (pack: LotteryTicketPack, action: 'approve' | 'save') => {
    if (!pack.id) {
      return;
    }
    setActionLoading(`${action}-${pack.id}`);
    try {
      if (action === 'approve') {
        await lotteryTicketPackApi.approve(pack.id);
        message.success(`${pack.title || pack.targetIssue || '票包'} 已审批`);
      } else {
        const saved = await lotteryTicketPackApi.saveAsTickets(pack.id);
        message.success(`已保存为票据：${saved.savedTicketIds?.length || saved.items?.length || 0} 注`);
      }
      const nextPacks = await lotteryTicketPackApi.ticketPacks({ page: 1, pageSize: 20 });
      setPacks(nextPacks.items || []);
    } catch (requestError) {
      console.error('移动指挥执行票包失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '移动指挥执行票包失败');
      message.error('移动指挥执行票包失败');
    } finally {
      setActionLoading(undefined);
    }
  };

  const updateRecommendation = async (item: LotteryRecommendation, lifecycleStatus: string) => {
    if (!item.id) {
      return;
    }
    setActionLoading(`${lifecycleStatus}-${item.id}`);
    try {
      await lotteryRecommendationApi.updateStatus(item.id, { lifecycleStatus, note: 'mobile command action' });
      const nextRecommendations = await lotteryRecommendationApi.recommendations({ page: 1, pageSize: 20 });
      setRecommendations(nextRecommendations.items || []);
      message.success(`${lifecycleStatus === 'APPLIED' ? '推荐已应用' : '推荐已稍后处理'}：${item.title || item.targetId || '推荐'}`);
    } catch (requestError) {
      console.error('移动指挥更新推荐失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '移动指挥更新推荐失败');
      message.error('移动指挥更新推荐失败');
    } finally {
      setActionLoading(undefined);
    }
  };

  return (
    <LifePageShell
      className="lottery-prediction-page lottery-mobile-page"
      eyebrow="彩票数据"
      title="移动指挥"
      actions={
        <Space wrap>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadCommand}>刷新</Button>
          <Button type="primary" icon={<ThunderboltOutlined />} onClick={() => navigate('/lottery/workbench')}>工作台</Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}
      <Spin spinning={loading && !workbench}>
        <section className="lottery-mobile-hero">
          <div>
            <span>下一期</span>
            <strong>{workbench?.dailyState?.nextIssue || health?.nextIssue || '-'}</strong>
            <p>{health?.message || workbench?.operationSummary?.message || '等待移动端批量复核'}</p>
          </div>
          <Progress type="circle" percent={Math.max(0, Math.min(100, health?.score || 0))} size={86} strokeColor="#34c759" />
        </section>

        <section className="lottery-mobile-metrics">
          {metrics.map(metric => (
            <button key={metric.key} type="button" onClick={() => navigate(metric.path)}>
              <span>{metric.icon}{metric.label}</span>
              <strong>{metric.value}</strong>
              <em>{metric.detail}</em>
              <Tag color={statusColor(metric.status)}>{metric.status || 'UNKNOWN'}</Tag>
            </button>
          ))}
        </section>

        <Segmented
          block
          className="lottery-mobile-tabs"
          value={view}
          onChange={value => setView(value as MobileView)}
          options={[
            { label: '行动', value: 'actions', icon: <BellOutlined /> },
            { label: '票包', value: 'packs', icon: <SafetyCertificateOutlined /> },
            { label: '归因', value: 'outcomes', icon: <BranchesOutlined /> },
            { label: '推荐', value: 'recommendations', icon: <CompassOutlined /> }
          ]}
        />

        {view === 'actions' ? (
          <section className="lottery-mobile-list">
            {activeReminders.length ? activeReminders.map(item => (
              <article key={`${item.key}-${item.fingerprint}`}>
                <div>
                  <Tag color={statusColor(item.severity)}>{item.group || '提醒'}</Tag>
                  <strong>{item.title || item.key}</strong>
                  <p>{item.message || '-'}</p>
                  <span>{formatTime(item.dueAt)}</span>
                </div>
                <Space wrap>
                  <Button size="large" icon={<CheckCircleOutlined />} loading={actionLoading === `ack-${item.key}`} onClick={() => acknowledgeReminder(item)}>确认</Button>
                  <Button size="large" icon={<ClockCircleOutlined />} loading={actionLoading === `snooze-${item.key}`} onClick={() => snoozeReminder(item)}>稍后</Button>
                  <Button size="large" onClick={() => navigate(item.path || '/lottery/alerts')}>查看</Button>
                </Space>
              </article>
            )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无移动行动提醒" />}
          </section>
        ) : null}

        {view === 'packs' ? (
          <section className="lottery-mobile-list">
            {reviewPacks.length ? reviewPacks.map(pack => (
              <article key={pack.id || pack.title}>
                <div>
                  <Tag color={statusColor(pack.approvalState || pack.status)}>{pack.approvalState || pack.status || 'PENDING'}</Tag>
                  <strong>{pack.title || '票包'}</strong>
                  <p>{pack.targetIssue || '-'} · {(pack.items || []).length} 注 · {pack.budgetPrecheck?.status || 'UNKNOWN'}</p>
                  <span>{formatTime(pack.updatedAt || pack.createdAt)}</span>
                </div>
                <Space wrap>
                  <Popconfirm
                    title="审批票包？"
                    description={`${pack.targetIssue || '-'} · ${(pack.items || []).length} 注`}
                    okText="审批"
                    cancelText="取消"
                    onConfirm={() => runPackAction(pack, 'approve')}
                  >
                    <Button size="large" icon={<CheckCircleOutlined />} loading={actionLoading === `approve-${pack.id}`}>审批</Button>
                  </Popconfirm>
                  <Popconfirm
                    title="保存为票据？"
                    description={`${pack.targetIssue || '-'} · ${(pack.items || []).length} 注，保存后会进入票据列表。`}
                    okText="保存"
                    cancelText="取消"
                    onConfirm={() => runPackAction(pack, 'save')}
                  >
                    <Button size="large" icon={<FileTextOutlined />} loading={actionLoading === `save-${pack.id}`}>保存票据</Button>
                  </Popconfirm>
                  <Button size="large" onClick={() => navigate('/lottery/ticket-packs')}>详情</Button>
                </Space>
              </article>
            )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无待复核票包" />}
          </section>
        ) : null}

        {view === 'outcomes' ? (
          <section className="lottery-mobile-list">
            {outcomes.length ? outcomes.map(item => (
              <article key={item.issue}>
                <div>
                  <Tag color={statusColor(item.calibrationState)}>{item.calibrationState || 'UNKNOWN'}</Tag>
                  <strong>{item.issue || '-'} 期归因</strong>
                  <p>已核 {item.checkedTicketCount || 0}/{item.ticketCount || 0} · 中奖 {item.winningTicketCount || 0} · ROI {item.roiPercent ?? '-'}%</p>
                  <span>{formatTime(item.generatedAt)}</span>
                </div>
                <Space wrap>
                  <Button size="large" icon={<BranchesOutlined />} onClick={() => navigate(`/lottery/outcomes?issue=${item.issue}`)}>归因</Button>
                  <Button size="large" onClick={() => navigate('/lottery/tickets')}>结算</Button>
                </Space>
              </article>
            )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无移动归因复核" />}
          </section>
        ) : null}

        {view === 'recommendations' ? (
          <section className="lottery-mobile-list">
            {recommendations.length ? recommendations.map(item => (
              <article key={item.id || `${item.targetType}-${item.targetId}`}>
                <div>
                  <Tag color={statusColor(item.recommendationState)}>{item.recommendationState || 'WATCH'}</Tag>
                  <strong>{item.title || item.targetId}</strong>
                  <p>{item.expectedAction || '-'} · 置信 {item.confidenceScore || 0}% · 证据 {item.evidenceAgeHours || 0}h</p>
                  <span>{item.evidenceSummary || '暂无证据摘要'}</span>
                </div>
                <Space wrap>
                  <Popconfirm
                    title="应用推荐？"
                    description={item.expectedAction || '确认后会把推荐标记为已应用。'}
                    okText="应用"
                    cancelText="取消"
                    onConfirm={() => updateRecommendation(item, 'APPLIED')}
                  >
                    <Button size="large" icon={<CheckCircleOutlined />} loading={actionLoading === `APPLIED-${item.id}`}>应用</Button>
                  </Popconfirm>
                  <Button size="large" icon={<ClockCircleOutlined />} loading={actionLoading === `SNOOZED-${item.id}`} onClick={() => updateRecommendation(item, 'SNOOZED')}>稍后</Button>
                  <Button size="large" onClick={() => navigate(item.path || '/lottery/recommendations')}>处理</Button>
                </Space>
              </article>
            )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无移动推荐复核" />}
          </section>
        ) : null}
      </Spin>
    </LifePageShell>
  );
};

export default LotteryMobileCommandPage;
