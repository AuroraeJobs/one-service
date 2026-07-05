import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Popconfirm, Progress, Select, Space, Spin, Tag, message } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CompassOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  StopOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import {
  lotteryRecommendationApi,
  type LotteryRecommendation
} from '../services/api';
import './LotteryOverviewPage.css';

const lanes = [
  { key: 'PROMOTE', label: '推广', icon: <CheckCircleOutlined /> },
  { key: 'WATCH', label: '观察', icon: <ClockCircleOutlined /> },
  { key: 'PAUSE', label: '暂停', icon: <PauseCircleOutlined /> },
  { key: 'RETIRE', label: '退役', icon: <StopOutlined /> }
];

const emptyDescriptions: Record<string, string> = {
  PROMOTE: '暂无推广推荐',
  WATCH: '暂无观察推荐',
  PAUSE: '暂无暂停推荐',
  RETIRE: '暂无退役推荐'
};

const stateColor = (state?: string) => {
  if (state === 'PROMOTE' || state === 'APPLIED') return 'green';
  if (state === 'WATCH' || state === 'SNOOZED') return 'gold';
  if (state === 'PAUSE') return 'orange';
  if (state === 'RETIRE' || state === 'ARCHIVED') return 'red';
  return 'default';
};

const formatTime = (value?: number) => value ? new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
}).format(new Date(value)) : '-';

const lifecycleCopy: Record<string, { label: string; note: string; success: string }> = {
  APPLIED: { label: '应用', note: 'recommendation applied from lifecycle board', success: '推荐已标记为应用' },
  SNOOZED: { label: '稍后', note: 'recommendation snoozed from lifecycle board', success: '推荐已稍后处理' },
  ARCHIVED: { label: '归档', note: 'recommendation archived from lifecycle board', success: '推荐已归档' }
};

type RecommendationPreset = 'ALL' | 'OPEN' | 'HIGH_CONFIDENCE' | 'STALE_EVIDENCE';

const LotteryRecommendationPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<LotteryRecommendation[]>([]);
  const [filterState, setFilterState] = useState<string>();
  const [preset, setPreset] = useState<RecommendationPreset>('ALL');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string>();
  const [error, setError] = useState<string>();

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await lotteryRecommendationApi.recommendations({ recommendationState: filterState, page: 1, pageSize: 80 });
      setItems(response.items || []);
    } catch (requestError) {
      console.error('读取彩票推荐失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取彩票推荐失败');
    } finally {
      setLoading(false);
    }
  }, [filterState]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const refreshRecommendations = async () => {
    setRefreshing(true);
    setError(undefined);
    try {
      const response = await lotteryRecommendationApi.refresh({ limit: 12 });
      setItems(response.items || []);
      message.success('推荐已刷新');
    } catch (requestError) {
      console.error('刷新彩票推荐失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '刷新彩票推荐失败');
      message.error('刷新彩票推荐失败');
    } finally {
      setRefreshing(false);
    }
  };

  const updateStatus = async (recommendation: LotteryRecommendation, lifecycleStatus: string) => {
    if (!recommendation.id) {
      return;
    }
    setActingId(`${recommendation.id}-${lifecycleStatus}`);
    try {
      const copy = lifecycleCopy[lifecycleStatus] || lifecycleCopy.SNOOZED;
      await lotteryRecommendationApi.updateStatus(recommendation.id, { lifecycleStatus, note: copy.note });
      await loadRecommendations();
      message.success(`${copy.success}：${recommendation.title || recommendation.targetId || '推荐'}`);
    } catch (requestError) {
      console.error('更新彩票推荐失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '更新彩票推荐失败');
      message.error('更新彩票推荐失败');
    } finally {
      setActingId(undefined);
    }
  };

  const visibleItems = useMemo(() => items.filter(item => {
    if (preset === 'OPEN') return item.lifecycleStatus !== 'APPLIED' && item.lifecycleStatus !== 'ARCHIVED';
    if (preset === 'HIGH_CONFIDENCE') return (item.confidenceScore || 0) >= 80;
    if (preset === 'STALE_EVIDENCE') return (item.evidenceAgeHours || 0) >= 24;
    return true;
  }), [items, preset]);

  const grouped = useMemo(() => lanes.map(lane => ({
    ...lane,
    items: visibleItems.filter(item => item.recommendationState === lane.key)
  })), [visibleItems]);

  const totals = useMemo(() => ({
    total: visibleItems.length,
    promote: visibleItems.filter(item => item.recommendationState === 'PROMOTE').length,
    watch: visibleItems.filter(item => item.recommendationState === 'WATCH').length,
    open: visibleItems.filter(item => item.lifecycleStatus !== 'APPLIED' && item.lifecycleStatus !== 'ARCHIVED').length
  }), [visibleItems]);

  return (
    <LifePageShell
      className="lottery-prediction-page lottery-recommendation-page"
      eyebrow="彩票数据"
      title="推荐校准"
      actions={
        <Space wrap>
          <Button onClick={() => navigate('/lottery/outcomes')}>归因</Button>
          <div className="lottery-filter-preset-bar">
            <Button size="small" type={preset === 'ALL' ? 'primary' : 'default'} onClick={() => setPreset('ALL')}>全部</Button>
            <Button size="small" type={preset === 'OPEN' ? 'primary' : 'default'} onClick={() => setPreset('OPEN')}>待处理</Button>
            <Button size="small" type={preset === 'HIGH_CONFIDENCE' ? 'primary' : 'default'} onClick={() => setPreset('HIGH_CONFIDENCE')}>高置信</Button>
            <Button size="small" type={preset === 'STALE_EVIDENCE' ? 'primary' : 'default'} onClick={() => setPreset('STALE_EVIDENCE')}>证据过期</Button>
          </div>
          <Select
            allowClear
            placeholder="状态"
            value={filterState}
            onChange={setFilterState}
            style={{ width: 120 }}
            options={lanes.map(lane => ({ label: lane.label, value: lane.key }))}
          />
          <Button icon={<ReloadOutlined />} loading={refreshing} onClick={refreshRecommendations}>刷新推荐</Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}
      <section className="lottery-recommendation-summary">
        <article><strong>{totals.total}</strong><span>推荐</span></article>
        <article><strong>{totals.promote}</strong><span>推广</span></article>
        <article><strong>{totals.watch}</strong><span>观察</span></article>
        <article><strong>{totals.open}</strong><span>待处理</span></article>
      </section>

      <Spin spinning={loading && !items.length}>
        <section className="lottery-recommendation-board">
          {grouped.map(lane => (
            <Card key={lane.key} className="life-panel-card lottery-clean-panel" title={<Space>{lane.icon}{lane.label}</Space>} extra={<Tag>{lane.items.length}</Tag>}>
              <div className="lottery-recommendation-lane">
                {lane.items.length ? lane.items.map(item => (
                  <article key={item.id || `${item.targetType}-${item.targetId}`}>
                    <div className="lottery-recommendation-card-head">
                      <div>
                        <strong>{item.title || item.targetId}</strong>
                        <span>{item.targetType} · {item.expectedAction || '-'}</span>
                      </div>
                      <Tag color={stateColor(item.lifecycleStatus)}>{item.lifecycleStatus || 'OPEN'}</Tag>
                    </div>
                    <Progress percent={item.confidenceScore || 0} size="small" strokeColor={stateColor(item.recommendationState) === 'green' ? '#34c759' : '#ff9500'} />
                    <p>{item.evidenceSummary || '暂无证据摘要'}</p>
                    <div className="lottery-recommendation-meta">
                      <span>证据 {item.evidenceAgeHours || 0}h</span>
                      <span>{formatTime(item.updatedAt || item.generatedAt)}</span>
                    </div>
                    <div className="lottery-recommendation-reasons">
                      {(item.reasons || []).slice(0, 3).map(reason => <Tag key={reason}>{reason}</Tag>)}
                    </div>
                    <Space wrap>
                      <Button size="small" icon={<CompassOutlined />} onClick={() => navigate(item.path || '/lottery/recommendations')}>处理</Button>
                      <Button size="small" loading={actingId === `${item.id}-APPLIED`} onClick={() => updateStatus(item, 'APPLIED')}>应用</Button>
                      <Button size="small" loading={actingId === `${item.id}-SNOOZED`} onClick={() => updateStatus(item, 'SNOOZED')}>稍后</Button>
                      <Popconfirm
                        title="归档推荐？"
                        description="归档后会从当前推荐队列中移除。"
                        okText="归档"
                        cancelText="取消"
                        onConfirm={() => updateStatus(item, 'ARCHIVED')}
                      >
                        <Button size="small" danger loading={actingId === `${item.id}-ARCHIVED`}>归档</Button>
                      </Popconfirm>
                    </Space>
                  </article>
                )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyDescriptions[lane.key]} />}
              </div>
            </Card>
          ))}
        </section>
      </Spin>
    </LifePageShell>
  );
};

export default LotteryRecommendationPage;
