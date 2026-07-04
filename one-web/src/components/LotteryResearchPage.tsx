import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Select, Space, Spin, Tag } from 'antd';
import {
  BarChartOutlined,
  ExperimentOutlined,
  HistoryOutlined,
  LineChartOutlined,
  PieChartOutlined,
  ReloadOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import {
  lotteryBacktestApi,
  lotteryExperimentApi,
  lotteryLedgerApi,
  lotteryPredictionApi,
  type LotteryBacktestReport,
  type LotteryBacktestSummary,
  type LotteryPerformanceLedger,
  type LotteryPredictionRuleRecord,
  type LotteryRuleComparison,
  type LotteryStrategyExperiment
} from '../services/api';
import './LotteryOverviewPage.css';

type EvidenceKind = 'experiment' | 'backtest' | 'rule' | 'performance';

interface EvidenceMetrics {
  rankScore?: number;
  bestScore?: number;
  stabilityScore?: number;
  averageRedHits?: number;
  blueHitRate?: number;
  netResult?: number;
  roiPercent?: number;
  hitRatePercent?: number;
  ticketCount?: number;
  replayCount?: number;
}

interface EvidenceItem {
  key: string;
  kind: EvidenceKind;
  title: string;
  subtitle: string;
  path: string;
  tags: string[];
  metrics: EvidenceMetrics;
  prizeDistribution: Record<string, number>;
  backtestSummary?: LotteryBacktestSummary;
}

const itemSeparator = ';';

const kindLabel: Record<EvidenceKind, string> = {
  experiment: '实验',
  backtest: '回测',
  rule: '规则',
  performance: '表现'
};

const kindColor: Record<EvidenceKind, string> = {
  experiment: 'cyan',
  backtest: 'blue',
  rule: 'gold',
  performance: 'purple'
};

const formatMoney = (value?: number) => `¥${Number(value || 0).toFixed(2)}`;

const formatPercent = (value?: number) => `${Number(value || 0).toFixed(2)}%`;

const calcRoi = (netResult?: number, totalCost?: number, fallback?: number) => {
  if (fallback !== undefined && fallback !== null) {
    return fallback;
  }
  if (netResult === undefined || netResult === null || !totalCost) {
    return undefined;
  }
  return (netResult / totalCost) * 100;
};

const parseSelectedKeys = (searchParams: URLSearchParams) =>
  (searchParams.get('items') || '')
    .split(itemSeparator)
    .map(item => item.trim())
    .filter(Boolean);

const updateSelectedKeys = (searchParams: URLSearchParams, setSearchParams: (next: URLSearchParams) => void, keys: string[]) => {
  const next = new URLSearchParams(searchParams);
  if (keys.length) {
    next.set('items', keys.join(itemSeparator));
  } else {
    next.delete('items');
  }
  setSearchParams(next);
};

const researchPathForKey = (key: string) => `/lottery/research?items=${encodeURIComponent(key)}`;

const experimentToEvidence = (item: LotteryStrategyExperiment): EvidenceItem | undefined => {
  if (!item.id) {
    return undefined;
  }
  return {
    key: `experiment:${item.id}`,
    kind: 'experiment',
    title: item.strategyName || '策略实验',
    subtitle: `${item.scale || 'standard'} · 回放 ${item.replayWindow || 0}`,
    path: `/lottery/experiments/${item.id}`,
    tags: ['实验', item.inputSource || 'training-service', ...(item.tags || [])].filter(Boolean),
    metrics: {
      bestScore: item.outcomeSummary?.bestScore,
      averageRedHits: item.outcomeSummary?.averageRedHits,
      blueHitRate: item.outcomeSummary?.blueHitRate,
      replayCount: item.replayWindow
    },
    prizeDistribution: item.outcomeSummary?.prizeDistribution || {}
  };
};

const backtestToEvidence = (item: LotteryBacktestReport): EvidenceItem | undefined => {
  if (!item.id) {
    return undefined;
  }
  return {
    key: `backtest:${item.id}`,
    kind: 'backtest',
    title: item.strategyName || '回测报告',
    subtitle: `${item.presetWindow || item.requestedWindow || '-'} · ${item.issueStart || '-'} 到 ${item.issueEnd || '-'}`,
    path: `/lottery/backtests/${item.id}`,
    tags: ['回测', item.presetWindow || 'custom'].filter(Boolean),
    metrics: {
      bestScore: item.bestScore,
      stabilityScore: item.stabilityScore,
      averageRedHits: item.averageRedHits,
      blueHitRate: item.blueHitRate,
      netResult: item.netResult,
      roiPercent: calcRoi(item.netResult, item.totalCost),
      replayCount: item.replayCount
    },
    prizeDistribution: item.prizeDistribution || {}
  };
};

const ruleToEvidence = (item: LotteryPredictionRuleRecord): EvidenceItem | undefined => {
  const key = item.id || item.ruleId || item.ruleName;
  if (!key) {
    return undefined;
  }
  const backtest = item.backtestSummary;
  return {
    key: `rule:${key}`,
    kind: 'rule',
    title: item.ruleName || item.ruleId || '规则记录',
    subtitle: `代数 ${item.generation || '-'} · 回放 ${item.replayCount || 0}`,
    path: researchPathForKey(`rule:${key}`),
    tags: ['规则', item.learned ? 'learned' : 'candidate'].filter(Boolean),
    metrics: {
      rankScore: item.rankScore,
      bestScore: item.summary?.bestScore || backtest?.bestScore,
      stabilityScore: backtest?.stabilityScore,
      averageRedHits: backtest?.averageRedHits || item.summary?.averageRedHits,
      blueHitRate: backtest?.blueHitRate || item.summary?.blueHitRate,
      netResult: backtest?.netResult,
      roiPercent: backtest?.roiPercent,
      replayCount: item.replayCount || backtest?.replayCount
    },
    prizeDistribution: backtest?.prizeDistribution || item.summary?.prizeDistribution || {},
    backtestSummary: backtest
  };
};

const performanceToEvidence = (item: LotteryPerformanceLedger): EvidenceItem | undefined => {
  const dimension = item.dimension || 'source';
  const key = item.key || item.name;
  if (!key) {
    return undefined;
  }
  return {
    key: `performance:${dimension}:${key}`,
    kind: 'performance',
    title: item.name || key,
    subtitle: `${dimension === 'rule' ? '规则表现' : '来源表现'} · 票据 ${item.ticketCount || 0}`,
    path: `/lottery/ledger`,
    tags: ['账本', dimension, item.pendingTicketCount ? '含待开奖' : '已核验'].filter(Boolean),
    metrics: {
      stabilityScore: item.backtestSummary?.stabilityScore,
      averageRedHits: item.backtestSummary?.averageRedHits,
      blueHitRate: item.backtestSummary?.blueHitRate,
      netResult: item.netResult,
      roiPercent: item.roiPercent,
      hitRatePercent: item.hitRatePercent,
      ticketCount: item.ticketCount,
      replayCount: item.backtestSummary?.replayCount
    },
    prizeDistribution: item.backtestSummary?.prizeDistribution || {},
    backtestSummary: item.backtestSummary
  };
};

const compactNumber = (value?: number) => {
  if (value === undefined || value === null) {
    return '-';
  }
  return Number(value).toFixed(2);
};

const createMetricOption = (items: EvidenceItem[]): EChartsOption => ({
  tooltip: { trigger: 'axis' },
  legend: { top: 0, data: ['稳定分', '平均红球', '蓝球率'] },
  grid: { top: 48, right: 36, bottom: 48, left: 48 },
  xAxis: {
    type: 'category',
    data: items.map(item => item.title),
    axisLabel: { interval: 0, rotate: items.length > 3 ? 20 : 0 }
  },
  yAxis: [
    { type: 'value', name: '分值', splitLine: { lineStyle: { color: 'rgba(127, 127, 127, 0.12)' } } },
    { type: 'value', name: '百分比', axisLabel: { formatter: '{value}%' }, splitLine: { show: false } }
  ],
  series: [
    {
      name: '稳定分',
      type: 'bar',
      barMaxWidth: 24,
      itemStyle: { color: '#0071e3' },
      data: items.map(item => Number(item.metrics.stabilityScore || item.metrics.bestScore || item.metrics.rankScore || 0))
    },
    {
      name: '平均红球',
      type: 'bar',
      barMaxWidth: 24,
      itemStyle: { color: '#ff3b30' },
      data: items.map(item => Number(item.metrics.averageRedHits || 0))
    },
    {
      name: '蓝球率',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      symbolSize: 7,
      lineStyle: { color: '#34c759', width: 3 },
      itemStyle: { color: '#34c759' },
      data: items.map(item => Number(item.metrics.blueHitRate || 0))
    }
  ]
});

const createOutcomeOption = (items: EvidenceItem[]): EChartsOption => ({
  tooltip: { trigger: 'axis' },
  legend: { top: 0, data: ['净结果', 'ROI', '命中率'] },
  grid: { top: 48, right: 48, bottom: 48, left: 56 },
  xAxis: {
    type: 'category',
    data: items.map(item => item.title),
    axisLabel: { interval: 0, rotate: items.length > 3 ? 20 : 0 }
  },
  yAxis: [
    { type: 'value', name: '金额', axisLabel: { formatter: '¥{value}' }, splitLine: { lineStyle: { color: 'rgba(127, 127, 127, 0.12)' } } },
    { type: 'value', name: '百分比', axisLabel: { formatter: '{value}%' }, splitLine: { show: false } }
  ],
  series: [
    {
      name: '净结果',
      type: 'bar',
      barMaxWidth: 28,
      itemStyle: { color: '#5856d6' },
      data: items.map(item => Number(item.metrics.netResult || 0))
    },
    {
      name: 'ROI',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      symbolSize: 7,
      lineStyle: { color: '#ff9500', width: 3 },
      itemStyle: { color: '#ff9500' },
      data: items.map(item => Number(item.metrics.roiPercent || 0))
    },
    {
      name: '命中率',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      symbolSize: 7,
      lineStyle: { color: '#34c759', width: 3 },
      itemStyle: { color: '#34c759' },
      data: items.map(item => Number(item.metrics.hitRatePercent || 0))
    }
  ]
});

const createPrizeDistributionOption = (items: EvidenceItem[]): EChartsOption => {
  const prizeNames = Array.from(new Set(items.flatMap(item => Object.keys(item.prizeDistribution || {}))));
  return {
    tooltip: { trigger: 'axis' },
    legend: { top: 0, data: prizeNames },
    grid: { top: 56, right: 28, bottom: 48, left: 48 },
    xAxis: {
      type: 'category',
      data: items.map(item => item.title),
      axisLabel: { interval: 0, rotate: items.length > 3 ? 20 : 0 }
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(127, 127, 127, 0.12)' } } },
    series: prizeNames.map((name, index) => ({
      name,
      type: 'bar',
      stack: 'prize',
      barMaxWidth: 40,
      itemStyle: { color: ['#8e8e93', '#0071e3', '#34c759', '#ff9500', '#ff3b30', '#5856d6'][index % 6] },
      data: items.map(item => Number(item.prizeDistribution?.[name] || 0))
    }))
  };
};

const LotteryResearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [experiments, setExperiments] = useState<LotteryStrategyExperiment[]>([]);
  const [backtests, setBacktests] = useState<LotteryBacktestReport[]>([]);
  const [ruleComparison, setRuleComparison] = useState<LotteryRuleComparison>();
  const [sourcePerformance, setSourcePerformance] = useState<LotteryPerformanceLedger[]>([]);
  const [rulePerformance, setRulePerformance] = useState<LotteryPerformanceLedger[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const selectedKeys = useMemo(() => parseSelectedKeys(searchParams), [searchParams]);

  const loadResearch = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [experimentRows, backtestRows, ruleRows, sourceRows, ledgerRuleRows] = await Promise.all([
        lotteryExperimentApi.experiments({ page: 0, pageSize: 12 }),
        lotteryBacktestApi.reports({ page: 0, pageSize: 12 }),
        lotteryPredictionApi.compareRules({ limit: 12 }),
        lotteryLedgerApi.performance({ dimension: 'source' }),
        lotteryLedgerApi.performance({ dimension: 'rule' })
      ]);
      setExperiments(experimentRows.items || []);
      setBacktests(backtestRows.items || []);
      setRuleComparison(ruleRows);
      setSourcePerformance(sourceRows || []);
      setRulePerformance(ledgerRuleRows || []);
    } catch (requestError) {
      console.error('读取彩票研究对比失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取彩票研究对比失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResearch();
  }, [loadResearch]);

  const evidenceItems = useMemo(() => [
    ...experiments.map(experimentToEvidence).filter(Boolean),
    ...backtests.map(backtestToEvidence).filter(Boolean),
    ...(ruleComparison?.rules || []).map(ruleToEvidence).filter(Boolean),
    ...sourcePerformance.map(performanceToEvidence).filter(Boolean),
    ...rulePerformance.map(performanceToEvidence).filter(Boolean)
  ] as EvidenceItem[], [backtests, experiments, ruleComparison?.rules, rulePerformance, sourcePerformance]);

  const defaultSelectedKeys = useMemo(() => {
    const backtestKeys = evidenceItems.filter(item => item.kind === 'backtest').slice(0, 2).map(item => item.key);
    const ruleKeys = evidenceItems.filter(item => item.kind === 'rule').slice(0, 2).map(item => item.key);
    const performanceKeys = evidenceItems.filter(item => item.kind === 'performance').slice(0, 2).map(item => item.key);
    return [...backtestKeys, ...ruleKeys, ...performanceKeys].slice(0, 4);
  }, [evidenceItems]);

  const effectiveSelectedKeys = selectedKeys.length ? selectedKeys : defaultSelectedKeys;

  const selectedItems = useMemo(() => {
    const selected = new Set(effectiveSelectedKeys);
    return evidenceItems.filter(item => selected.has(item.key));
  }, [effectiveSelectedKeys, evidenceItems]);

  const selectOptions = useMemo(() => evidenceItems.map(item => ({
    value: item.key,
    label: `[${kindLabel[item.kind]}] ${item.title}`
  })), [evidenceItems]);

  const metricOption = useMemo(() => createMetricOption(selectedItems), [selectedItems]);
  const outcomeOption = useMemo(() => createOutcomeOption(selectedItems), [selectedItems]);
  const prizeDistributionOption = useMemo(() => createPrizeDistributionOption(selectedItems), [selectedItems]);
  const hasPrizeDistribution = selectedItems.some(item => Object.keys(item.prizeDistribution || {}).length > 0);

  return (
    <LifePageShell
      className="lottery-prediction-page lottery-research-page"
      eyebrow="彩票数据"
      title="研究对比"
      actions={
        <Space wrap>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadResearch}>
            刷新
          </Button>
          <Button icon={<ExperimentOutlined />} onClick={() => navigate('/lottery/experiments')}>
            实验
          </Button>
          <Button icon={<BarChartOutlined />} onClick={() => navigate('/lottery/backtests')}>
            回测
          </Button>
          <Button icon={<PieChartOutlined />} onClick={() => navigate('/lottery/ledger')}>
            账本
          </Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}
      <Alert
        className="lottery-overview-status-alert"
        type="info"
        showIcon
        message="这里比较的是历史实验、回测和个人账本证据，仅用于复盘规则稳定性与记录表现。"
      />

      <Card className="life-panel-card lottery-clean-panel">
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Select
            mode="multiple"
            allowClear
            placeholder="选择实验、回测、规则或账本表现进行对比"
            value={effectiveSelectedKeys}
            options={selectOptions}
            onChange={value => updateSelectedKeys(searchParams, setSearchParams, value)}
            maxTagCount="responsive"
          />
          <Space wrap>
            <Tag color="blue">已选 {selectedItems.length}</Tag>
            {ruleComparison?.bestRuleName ? <Tag color="gold">当前最佳规则 {ruleComparison.bestRuleName}</Tag> : null}
            {ruleComparison?.bestBacktestSummary ? <Tag color="cyan">规则已匹配回测摘要</Tag> : null}
          </Space>
        </Space>
      </Card>

      <Spin spinning={loading}>
        {evidenceItems.length === 0 && !loading ? (
          <Card className="life-panel-card">
            <Empty description="暂无可比较证据，先运行策略实验、回测或积累票据账本。" />
          </Card>
        ) : selectedItems.length === 0 ? (
          <Card className="life-panel-card">
            <Empty description="请选择至少两项证据进行对比。" />
          </Card>
        ) : (
          <>
            <section className="lottery-research-card-grid">
              {selectedItems.map(item => (
                <article className="lottery-research-card" key={item.key}>
                  <div className="lottery-research-card-head">
                    <div>
                      <Tag color={kindColor[item.kind]}>{kindLabel[item.kind]}</Tag>
                      <h2>{item.title}</h2>
                      <span>{item.subtitle}</span>
                    </div>
                    <Button size="small" icon={<HistoryOutlined />} onClick={() => navigate(item.path)}>
                      详情
                    </Button>
                  </div>
                  <div className="lottery-research-metrics">
                    <span><strong>{compactNumber(item.metrics.stabilityScore || item.metrics.bestScore || item.metrics.rankScore)}</strong><small>稳定/评分</small></span>
                    <span><strong>{compactNumber(item.metrics.averageRedHits)}</strong><small>平均红球</small></span>
                    <span><strong>{formatPercent(item.metrics.blueHitRate)}</strong><small>蓝球率</small></span>
                    <span><strong>{formatMoney(item.metrics.netResult)}</strong><small>净结果</small></span>
                    <span><strong>{formatPercent(item.metrics.roiPercent)}</strong><small>ROI</small></span>
                    <span><strong>{formatPercent(item.metrics.hitRatePercent)}</strong><small>命中率</small></span>
                  </div>
                  {item.backtestSummary ? (
                    <div className="lottery-research-backtest-strip">
                      <TrophyOutlined />
                      <span>
                        匹配回测：稳定 {item.backtestSummary.stabilityScore ?? 0} · 红球均值 {item.backtestSummary.averageRedHits ?? 0} · 净值 {formatMoney(item.backtestSummary.netResult)}
                      </span>
                    </div>
                  ) : null}
                  <Space wrap>
                    {item.tags.slice(0, 4).map(tag => <Tag key={tag}>{tag}</Tag>)}
                  </Space>
                </article>
              ))}
            </section>

            <section className="lottery-research-chart-grid">
              <Card className="life-panel-card" title={<Space><LineChartOutlined />稳定与命中结构</Space>}>
                <ReactECharts option={metricOption} style={{ height: 320, width: '100%' }} notMerge lazyUpdate />
              </Card>
              <Card className="life-panel-card" title={<Space><PieChartOutlined />账本结果</Space>}>
                <ReactECharts option={outcomeOption} style={{ height: 320, width: '100%' }} notMerge lazyUpdate />
              </Card>
            </section>

            <Card className="life-panel-card" title={<Space><TrophyOutlined />奖级分布</Space>}>
              {hasPrizeDistribution ? (
                <ReactECharts option={prizeDistributionOption} style={{ height: 340, width: '100%' }} notMerge lazyUpdate />
              ) : (
                <Empty description="选中项暂无奖级分布数据" />
              )}
            </Card>
          </>
        )}
      </Spin>
    </LifePageShell>
  );
};

export default LotteryResearchPage;
