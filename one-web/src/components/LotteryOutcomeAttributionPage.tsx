import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Progress, Space, Spin, Tag } from 'antd';
import {
  AppstoreOutlined,
  BranchesOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import {
  lotteryOutcomeApi,
  type LotteryOutcomeAttribution,
  type LotteryOutcomeAttributionRollup
} from '../services/api';
import { lotteryCodeLabel, lotteryStatusLabel } from '../utils/lotteryStatusLabel';
import './LotteryOverviewPage.css';

const formatMoney = (value?: number) => value === undefined || value === null ? '-' : `¥${Number(value).toFixed(2)}`;
const formatPercent = (value?: number) => value === undefined || value === null ? '-' : `${Number(value).toFixed(2)}%`;
const formatTime = (value?: number) => value ? new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
}).format(new Date(value)) : '-';

const stateColor = (state?: string) => {
  if (state === 'PROMOTE_SIGNAL' || state === 'POSITIVE' || state === 'LINKED' || state === 'EXECUTED' || state === 'CONFIRMED_SIGNAL') return 'green';
  if (state === 'WATCH_RISK' || state === 'WATCH' || state === 'PENDING' || state === 'OBSERVE') return 'gold';
  if (state === 'RECALIBRATE' || state === 'NO_HIT') return 'red';
  return 'default';
};

const distributionRows = (distribution?: Record<string, number>) => Object.entries(distribution || {});

const rollupWindows = [
  { key: 'latest', label: '最新期' },
  { key: 'recent10', label: '近10期' },
  { key: 'month-to-date', label: '本月' },
  { key: 'all', label: '全部' }
] as const;

const dimensionLabel = (dimension?: string) => {
  const labels: Record<string, string> = {
    issue: '期号',
    portfolio: '组合',
    rule: '规则',
    source: '来源',
    'ticket-pack-execution': '票包执行',
    'simulator-risk': '沙盘风险',
    'recommendation-lifecycle': '推荐生命周期'
  };
  return labels[dimension || ''] || lotteryCodeLabel(dimension);
};

const evidenceQualityLabel = (quality?: string) => {
  const labels: Record<string, string> = {
    STABLE: '稳定',
    OBSERVE: '观察中',
    WATCH: '需复核',
    UNDER_TESTED: '样本不足',
    NEGATIVE: '负向'
  };
  return labels[quality || ''] || lotteryStatusLabel(quality);
};

const qualityFor = (params: { samples?: number; warnings?: number; score?: number; stale?: boolean }) => {
  const samples = params.samples || 0;
  const warnings = params.warnings || 0;
  if (!samples) {
    return { label: '样本不足', color: 'default', description: '需要更多结果进入归因链路' };
  }
  if (params.stale || warnings > 0) {
    return { label: '需复核', color: 'gold', description: '存在警示或证据需要人工确认' };
  }
  if ((params.score || 0) >= 80 || samples >= 3) {
    return { label: '稳定', color: 'green', description: '证据覆盖较完整，可进入复盘' };
  }
  return { label: '观察中', color: 'blue', description: '已有结果，但仍需继续跟踪' };
};

const average = (values: Array<number | undefined>) => {
  const numericValues = values.filter((value): value is number => typeof value === 'number');
  if (!numericValues.length) {
    return undefined;
  }
  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
};

const buildAttributionHandoffs = (selected?: LotteryOutcomeAttribution) => {
  const portfolioCount = selected?.portfolioContributions?.length || 0;
  const ticketPackCount = selected?.ticketPackExecutions?.length || 0;
  const simulatorCount = selected?.simulationDrifts?.length || 0;
  const decisionCount = selected?.decisionContributions?.length || 0;
  const recommendationTrailCount = selected?.timeline?.filter(item => /RECOMMEND|推荐/i.test(`${item.type || ''} ${item.title || ''}`)).length || 0;
  const portfolioWarnings = selected?.portfolioContributions?.reduce((sum, item) => sum + (item.warningCount || 0), 0) || 0;
  const portfolioScore = average(selected?.portfolioContributions?.map(item => item.healthScore) || []);
  const unsettledPacks = selected?.ticketPackExecutions?.filter(item => (item.savedTicketCount || 0) < (item.itemCount || 0)).length || 0;
  const driftWarnings = selected?.simulationDrifts?.filter(item => item.driftState === 'WATCH_RISK' || item.driftState === 'RECALIBRATE').length || 0;

  return [
    {
      key: 'portfolio',
      title: '组合归因',
      metric: `${portfolioCount} 个组合`,
      description: portfolioCount ? `平均健康度 ${portfolioScore === undefined ? '-' : Math.round(portfolioScore)}` : '等待组合贡献进入复盘',
      path: '/lottery/strategy-portfolios',
      quality: qualityFor({ samples: portfolioCount, warnings: portfolioWarnings, score: portfolioScore })
    },
    {
      key: 'ticket-pack',
      title: '票包执行',
      metric: `${ticketPackCount} 个票包`,
      description: unsettledPacks ? `${unsettledPacks} 个票包仍有保存缺口` : '票包保存状态可进入核对',
      path: '/lottery/ticket-packs',
      quality: qualityFor({ samples: ticketPackCount, warnings: unsettledPacks })
    },
    {
      key: 'simulator',
      title: '沙盘提案',
      metric: `${simulatorCount} 次提案`,
      description: driftWarnings ? `${driftWarnings} 项漂移需要观察` : '模拟结果已接入当期开奖',
      path: '/lottery/simulator',
      quality: qualityFor({ samples: simulatorCount, warnings: driftWarnings })
    },
    {
      key: 'decision',
      title: '保存决策',
      metric: `${decisionCount} 组决策`,
      description: `${selected?.winningTicketCount || 0} 张中奖票据已纳入结果`,
      path: '/lottery/predictions/decision',
      quality: qualityFor({ samples: decisionCount, score: selected?.roiPercent })
    },
    {
      key: 'recommendation',
      title: '推荐线索',
      metric: `${recommendationTrailCount} 条线索`,
      description: recommendationTrailCount ? '推荐事件已进入归因时间线' : '等待推荐状态与结果回连',
      path: '/lottery/recommendations',
      quality: qualityFor({ samples: recommendationTrailCount })
    }
  ];
};

const buildTrendRows = (selected?: LotteryOutcomeAttribution) => {
  if (!selected) {
    return [];
  }
  const ruleRows = (selected.decisionContributions || []).map(item => ({
    key: `rule-${item.decisionSetId || item.title}`,
    source: '规则',
    name: item.ruleName || item.title || item.decisionSetId || '-',
    result: `${item.winningCandidateCount || 0} 个命中候选 · ${formatMoney(item.netResult)}`,
    state: item.contributionState,
    path: '/lottery/predictions/decision',
    quality: qualityFor({ samples: item.winningCandidateCount || 0, score: item.roiPercent })
  }));
  const sourceRows = (selected.ticketPackExecutions || []).map(item => ({
    key: `pack-${item.packId || item.title}`,
    source: '来源',
    name: item.title || item.packId || '-',
    result: `${item.savedTicketCount || 0}/${item.itemCount || 0} 已保存 · ${formatMoney(item.proposedCost)}`,
    state: item.executionState || item.status,
    path: '/lottery/ticket-packs',
    quality: qualityFor({ samples: item.itemCount || 0, warnings: (item.savedTicketCount || 0) < (item.itemCount || 0) ? 1 : 0 })
  }));
  const recommendationRows = (selected.timeline || [])
    .filter(item => /RECOMMEND|推荐/i.test(`${item.type || ''} ${item.title || ''}`))
    .map(item => ({
      key: `recommendation-${item.timestamp}-${item.title}`,
      source: '推荐',
      name: item.title || lotteryCodeLabel(item.type),
      result: `${lotteryStatusLabel(item.state)} · ${formatTime(item.timestamp)}`,
      state: item.state,
      path: item.path || '/lottery/recommendations',
      quality: qualityFor({ samples: 1 })
    }));

  return [...ruleRows, ...sourceRows, ...recommendationRows];
};

const LotteryOutcomeAttributionPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [outcomes, setOutcomes] = useState<LotteryOutcomeAttribution[]>([]);
  const [selected, setSelected] = useState<LotteryOutcomeAttribution>();
  const [rollup, setRollup] = useState<LotteryOutcomeAttributionRollup>();
  const [rollupWindow, setRollupWindow] = useState<(typeof rollupWindows)[number]['key']>('recent10');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'GAP' | 'PROMOTE' | 'WATCH'>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const selectedIssue = searchParams.get('issue') || undefined;
  const requestedDecisionSetId = searchParams.get('decisionSetId') || '';

  const preserveSelectedIssue = useCallback((issue: string) => {
    setSearchParams(current => {
      const next = new URLSearchParams(current);
      next.set('issue', issue);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const loadOutcomes = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [recent, rollupSummary] = await Promise.all([
        lotteryOutcomeApi.recent({ limit: 20 }),
        lotteryOutcomeApi.rollup({ window: rollupWindow })
      ]);
      setOutcomes(recent);
      setRollup(rollupSummary);
      const issue = selectedIssue || recent[0]?.issue;
      if (issue) {
        const detail = await lotteryOutcomeApi.issue(issue);
        setSelected(detail);
        preserveSelectedIssue(issue);
      }
    } catch (requestError) {
      console.error('读取彩票归因失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取彩票归因失败');
    } finally {
      setLoading(false);
    }
  }, [preserveSelectedIssue, rollupWindow, selectedIssue]);

  useEffect(() => {
    loadOutcomes();
  }, [loadOutcomes]);

  const selectIssue = async (issue?: string) => {
    if (!issue) {
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      setSelected(await lotteryOutcomeApi.issue(issue));
      preserveSelectedIssue(issue);
    } catch (requestError) {
      console.error('读取彩票归因失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取彩票归因失败');
    } finally {
      setLoading(false);
    }
  };

  const filteredOutcomes = outcomes.filter(item => {
    if (outcomeFilter === 'GAP') return (item.ticketCount || 0) > (item.checkedTicketCount || 0);
    if (outcomeFilter === 'PROMOTE') return item.calibrationState === 'PROMOTE_SIGNAL';
    if (outcomeFilter === 'WATCH') return item.calibrationState === 'WATCH_RISK' || item.calibrationState === 'RECALIBRATE';
    return true;
  });
  const focusedDecisionContributions = useMemo(() => (
    requestedDecisionSetId
      ? (selected?.decisionContributions || []).filter(item => item.decisionSetId === requestedDecisionSetId)
      : selected?.decisionContributions || []
  ), [requestedDecisionSetId, selected?.decisionContributions]);
  const focusedSelected = useMemo(() => selected ? {
    ...selected,
    decisionContributions: focusedDecisionContributions
  } : undefined, [focusedDecisionContributions, selected]);
  const handoffCards = useMemo(() => buildAttributionHandoffs(focusedSelected), [focusedSelected]);
  const trendRows = useMemo(() => buildTrendRows(selected), [selected]);
  const rollupRows = useMemo(() => (rollup?.rows || []).slice(0, 12), [rollup]);
  const focusMode = searchParams.get('focus') || '';
  const evidenceQualityFocus = focusMode === 'evidence-quality';
  const evidenceQualitySummary = useMemo(() => {
    const qualityRows = rollup?.rows || [];
    return {
      stable: qualityRows.filter(item => item.evidenceQuality === 'STABLE').length,
      watch: qualityRows.filter(item => item.evidenceQuality === 'WATCH').length,
      underTested: qualityRows.filter(item => item.evidenceQuality === 'UNDER_TESTED' || item.evidenceQuality === 'OBSERVE').length,
      negative: qualityRows.filter(item => item.evidenceQuality === 'NEGATIVE').length,
      warnings: qualityRows.reduce((sum, item) => sum + (item.warningCount || 0), 0),
      samples: qualityRows.reduce((sum, item) => sum + (item.sampleCount || 0), 0)
    };
  }, [rollup?.rows]);

  return (
    <LifePageShell
      className="lottery-prediction-page lottery-outcome-page"
      eyebrow="彩票数据"
      title="归因复盘"
      actions={
        <Space wrap>
          <Button icon={<SafetyCertificateOutlined />} onClick={() => navigate('/lottery/outcomes?focus=evidence-quality')}>证据质量</Button>
          <Button onClick={() => navigate('/lottery/governance')}>治理</Button>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadOutcomes}>刷新</Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}
      {requestedDecisionSetId ? (
        <Alert
          className="lottery-overview-status-alert"
          type={focusedDecisionContributions.length ? 'info' : 'warning'}
          showIcon
          message={`决策溯源筛选：decisionSetId=${requestedDecisionSetId} · issue=${selectedIssue || '-'}`}
        />
      ) : null}
      <Spin spinning={loading && !selected}>
        <section className="lottery-outcome-layout">
          <Card className="life-panel-card lottery-clean-panel" title={<Space><BranchesOutlined />期号时间线</Space>}>
            <div className="lottery-filter-preset-bar">
              <Button size="small" type={outcomeFilter === 'ALL' ? 'primary' : 'default'} onClick={() => setOutcomeFilter('ALL')}>全部</Button>
              <Button size="small" type={outcomeFilter === 'GAP' ? 'primary' : 'default'} onClick={() => setOutcomeFilter('GAP')}>待结算</Button>
              <Button size="small" type={outcomeFilter === 'PROMOTE' ? 'primary' : 'default'} onClick={() => setOutcomeFilter('PROMOTE')}>可推广</Button>
              <Button size="small" type={outcomeFilter === 'WATCH' ? 'primary' : 'default'} onClick={() => setOutcomeFilter('WATCH')}>需观察</Button>
            </div>
            <div className="lottery-outcome-issue-list">
              {filteredOutcomes.length ? filteredOutcomes.map(item => (
                <button
                  key={item.issue}
                  type="button"
                  className={item.issue === selected?.issue ? 'active' : ''}
                  onClick={() => selectIssue(item.issue)}
                >
                  <strong>{item.issue}</strong>
                  <span>{formatMoney(item.netResult)} · ROI {formatPercent(item.roiPercent)}</span>
                  <Tag color={stateColor(item.calibrationState)}>{lotteryStatusLabel(item.calibrationState)}</Tag>
                </button>
              )) : <Empty description="暂无归因期号" />}
            </div>
          </Card>

          <div className="lottery-outcome-detail">
            {selected ? (
              <>
                <section className="lottery-outcome-summary-grid">
                  <article><strong>{selected.issue}</strong><span>期号</span></article>
                  <article><strong>{selected.ticketCount || 0}</strong><span>票据</span></article>
                  <article><strong>{selected.winningTicketCount || 0}</strong><span>中奖票据</span></article>
                  <article><strong>{formatMoney(selected.netResult)}</strong><span>净收益</span></article>
                  <article><strong>{formatPercent(selected.roiPercent)}</strong><span>ROI</span></article>
                  <article><Tag color={stateColor(selected.calibrationState)}>{lotteryStatusLabel(selected.calibrationState)}</Tag><span>校准状态</span></article>
                </section>

                <Card className="life-panel-card lottery-clean-panel" title="聚合归因">
                  <div className="lottery-filter-preset-bar">
                    {rollupWindows.map(item => (
                      <Button
                        key={item.key}
                        size="small"
                        type={rollupWindow === item.key ? 'primary' : 'default'}
                        onClick={() => setRollupWindow(item.key)}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>
                  <section className="lottery-attribution-rollup-summary">
                    <article><strong>{rollup?.issueCount || 0}</strong><span>归因期数</span></article>
                    <article><strong>{rollup?.ticketCount || 0}</strong><span>票据</span></article>
                    <article><strong>{rollup?.winningTicketCount || 0}</strong><span>中奖票据</span></article>
                    <article><strong>{formatMoney(rollup?.netResult)}</strong><span>净收益</span></article>
                    <article><strong>{formatPercent(rollup?.roiPercent)}</strong><span>ROI</span></article>
                  </section>
                  {evidenceQualityFocus ? (
                    <div className="lottery-attribution-focus-summary">
                      <strong>证据质量趋势焦点</strong>
                      <section className="lottery-attribution-rollup-summary">
                        <article><strong>{evidenceQualitySummary.stable}</strong><span>稳定</span></article>
                        <article><strong>{evidenceQualitySummary.watch}</strong><span>需复核</span></article>
                        <article><strong>{evidenceQualitySummary.underTested}</strong><span>样本不足</span></article>
                        <article><strong>{evidenceQualitySummary.negative}</strong><span>负向</span></article>
                        <article><strong>{evidenceQualitySummary.warnings}</strong><span>警示</span></article>
                        <article><strong>{evidenceQualitySummary.samples}</strong><span>样本</span></article>
                      </section>
                    </div>
                  ) : null}
                  <div className="lottery-attribution-trend-table">
                    {rollupRows.length ? rollupRows.map(item => (
                      <button key={`${item.dimension}-${item.key}`} type="button" onClick={() => navigate(item.path || '/lottery/outcomes')}>
                        <Tag>{dimensionLabel(item.dimension)}</Tag>
                        <span>{item.label || item.key || '-'}</span>
                        <small>{item.issueCount || 0} 期 · {item.sampleCount || 0} 样本 · {item.warningCount || 0} 警示</small>
                        <Tag color={stateColor(item.state)}>{lotteryStatusLabel(item.state)}</Tag>
                        <Tag color={item.evidenceQuality === 'STABLE' ? 'green' : item.evidenceQuality === 'WATCH' ? 'gold' : item.evidenceQuality === 'NEGATIVE' ? 'red' : 'blue'}>{evidenceQualityLabel(item.evidenceQuality)}</Tag>
                      </button>
                    )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无聚合归因" />}
                  </div>
                </Card>

                <section className="lottery-attribution-handoff-map">
                  {handoffCards.map(item => (
                    <button key={item.key} type="button" onClick={() => navigate(item.path)}>
                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.description}</span>
                      </div>
                      <small>{item.metric}</small>
                      <Tag color={item.quality.color}>{item.quality.label}</Tag>
                    </button>
                  ))}
                </section>

                <Card className="life-panel-card lottery-clean-panel" title="证据趋势">
                  <div className="lottery-attribution-trend-table">
                    {trendRows.length ? trendRows.map(item => (
                      <button key={item.key} type="button" onClick={() => navigate(item.path)}>
                        <Tag>{item.source}</Tag>
                        <span>{item.name}</span>
                        <small>{item.result}</small>
                        <Tag color={stateColor(item.state)}>{lotteryStatusLabel(item.state)}</Tag>
                        <Tag color={item.quality.color}>{item.quality.label}</Tag>
                      </button>
                    )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无规则、来源或推荐趋势" />}
                  </div>
                </Card>

                <section className="lottery-outcome-card-grid">
                  <Card className="life-panel-card lottery-clean-panel" title={<Space><AppstoreOutlined />组合贡献</Space>}>
                    <div className="lottery-outcome-table">
                      {selected.portfolioContributions?.length ? selected.portfolioContributions.map(item => (
                        <button key={item.portfolioId || item.name} type="button" onClick={() => navigate('/lottery/strategy-portfolios')}>
                          <span>{item.name || item.portfolioId || '-'}</span>
                          <Progress percent={item.healthScore || 0} size="small" />
                          <Tag color={stateColor(item.contributionState)}>{lotteryStatusLabel(item.contributionState)}</Tag>
                        </button>
                      )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无组合贡献" />}
                    </div>
                  </Card>

                  <Card className="life-panel-card lottery-clean-panel" title={<Space><SafetyCertificateOutlined />票包执行</Space>}>
                    <div className="lottery-outcome-table">
                      {selected.ticketPackExecutions?.length ? selected.ticketPackExecutions.map(item => (
                        <button key={item.packId || item.title} type="button" onClick={() => navigate('/lottery/ticket-packs')}>
                          <span>{item.title || item.packId}</span>
                          <small>{item.savedTicketCount || 0}/{item.itemCount || 0} 已保存 · {formatMoney(item.proposedCost)}</small>
                          <Tag color={stateColor(item.executionState)}>{lotteryStatusLabel(item.executionState)}</Tag>
                        </button>
                      )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无票包执行" />}
                    </div>
                  </Card>

                  <Card className="life-panel-card lottery-clean-panel" title={<Space><ExperimentOutlined />沙盘 Drift</Space>}>
                    <div className="lottery-outcome-table">
                      {selected.simulationDrifts?.length ? selected.simulationDrifts.map(item => (
                        <button key={item.auditId || item.generatedAt} type="button" onClick={() => navigate('/lottery/simulator')}>
                          <span>{lotteryStatusLabel(item.riskLevel)} · {item.candidateCount || 0} 候选</span>
                          <small>中奖票据 {item.actualWinningTicketCount || 0} · {formatTime(item.generatedAt)}</small>
                          <Tag color={stateColor(item.driftState)}>{lotteryStatusLabel(item.driftState)}</Tag>
                        </button>
                      )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无沙盘归因" />}
                    </div>
                  </Card>

                  <Card className="life-panel-card lottery-clean-panel" title={<Space><FileTextOutlined />决策与奖级</Space>}>
                    <div className="lottery-outcome-distribution">
                      {distributionRows(selected.prizeDistribution).length ? distributionRows(selected.prizeDistribution).map(([name, count]) => (
                        <div key={name}><span>{name}</span><strong>{count}</strong></div>
                      )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无奖级分布" />}
                    </div>
                    <div className="lottery-outcome-table">
                      {focusedDecisionContributions.map(item => (
                        <button key={item.decisionSetId || item.title} type="button" onClick={() => navigate(`/lottery/predictions/decision?decisionSetId=${encodeURIComponent(item.decisionSetId || '')}&targetIssue=${encodeURIComponent(selected.issue || '')}`)}>
                          <span>{item.title || item.decisionSetId}</span>
                          <small>{item.ruleName || '-'} · {formatMoney(item.netResult)}</small>
                          <Tag color={stateColor(item.contributionState)}>{lotteryStatusLabel(item.contributionState)}</Tag>
                        </button>
                      ))}
                      {requestedDecisionSetId && !focusedDecisionContributions.length ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前期号未找到对应决策归因" />
                      ) : null}
                    </div>
                  </Card>
                </section>

                <Card className="life-panel-card lottery-clean-panel" title="归因时间线">
                  <div className="lottery-outcome-timeline">
                    {selected.timeline?.length ? selected.timeline.map(item => (
                      <button key={`${item.type}-${item.timestamp}-${item.title}`} type="button" onClick={() => navigate(item.path || '/lottery/outcomes')}>
                        <Tag>{lotteryCodeLabel(item.type)}</Tag>
                        <span>{item.title}</span>
                        <small>{lotteryStatusLabel(item.state)} · {formatTime(item.timestamp)}</small>
                      </button>
                    )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无归因时间线" />}
                  </div>
                </Card>
              </>
            ) : (
              <Card className="life-panel-card lottery-clean-panel">
                <Empty description="暂无归因数据" />
              </Card>
            )}
          </div>
        </section>
      </Spin>
    </LifePageShell>
  );
};

export default LotteryOutcomeAttributionPage;
