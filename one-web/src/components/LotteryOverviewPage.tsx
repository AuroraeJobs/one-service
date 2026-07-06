import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Space, Spin, Tag } from 'antd';
import { BarChartOutlined, DatabaseOutlined, FileTextOutlined, PieChartOutlined, ReloadOutlined } from '@ant-design/icons';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import LotteryAiPanel from './lottery/LotteryAiPanel';
import LotteryBalls from './lottery/LotteryBalls';
import LotteryFrequencyCharts from './lottery/LotteryFrequencyCharts';
import LotteryPeriodDetail from './lottery/LotteryPeriodDetail';
import LotterySummaryCards from './lottery/LotterySummaryCards';
import { useRecordContext } from '../contexts/RecordContext';
import { lotteryRecordApi, lotteryStatisticsApi, type LotteryStatisticsSummary, type RecordYearCount } from '../services/api';
import { buildLotteryStats, getRecentDraws, type LotteryDraw } from '../utils/lotteryStats';
import './LotteryOverviewPage.css';

const YEARLY_PIE_COLORS = [
  '#2f6f88',
  '#4f8fa8',
  '#72a9bd',
  '#95becd',
  '#b8d3dc',
  '#d3e3e8',
  '#8aa3a9',
  '#6f8f96'
];

const getThemeValue = (name: string, fallback: string) => {
  if (typeof window === 'undefined') {
    return fallback;
  }
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
};

const createYearlyPieOption = (yearlyCounts: RecordYearCount[]): EChartsOption => ({
  backgroundColor: 'transparent',
  color: YEARLY_PIE_COLORS,
  tooltip: {
    trigger: 'item',
    formatter: params => {
      const item = params as { name: string; value: number; percent: number };
      return `${item.name} 年<br/>${item.value} 条，占比 ${item.percent}%`;
    }
  },
  series: [
    {
      name: '年度记录数',
      type: 'pie',
      radius: ['58%', '78%'],
      center: ['50%', '50%'],
      selectedMode: false,
      selectedOffset: 0,
      avoidLabelOverlap: true,
      padAngle: 1,
      minShowLabelAngle: 8,
      itemStyle: {
        borderWidth: 2,
        borderColor: getThemeValue('--app-bg', 'rgba(255, 255, 255, 0.72)')
      },
      label: {
        show: true,
        formatter: params => {
          const item = params as { name: string; value: number };
          return `${item.name}\n${item.value}`;
        },
        color: getThemeValue('--app-text-muted', '#6b7280'),
        fontSize: 11,
        lineHeight: 15
      },
      labelLine: {
        show: true,
        length: 10,
        length2: 8,
        lineStyle: {
          color: 'rgba(120, 136, 148, 0.62)'
        }
      },
      emphasis: {
        disabled: true,
        scale: false,
        itemStyle: {
          shadowBlur: 0
        }
      },
      data: yearlyCounts.map(item => ({
        name: item.year,
        value: item.count
      }))
    }
  ]
});

const formatDateTime = (timestamp?: number) => {
  if (!timestamp) {
    return undefined;
  }
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const LotteryOverviewPage = () => {
  const navigate = useNavigate();
  const { allRecords, loading, refreshRecords } = useRecordContext();
  const [selectedDraw, setSelectedDraw] = useState<LotteryDraw | undefined>();
  const [statisticsSummary, setStatisticsSummary] = useState<LotteryStatisticsSummary>();
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [statisticsRefreshing, setStatisticsRefreshing] = useState(false);
  const [statisticsError, setStatisticsError] = useState(false);
  const [yearlyCounts, setYearlyCounts] = useState<RecordYearCount[]>([]);
  const [yearlyCountsLoading, setYearlyCountsLoading] = useState(false);
  const [yearlyCountsRefreshing, setYearlyCountsRefreshing] = useState(false);
  const stats = useMemo(() => buildLotteryStats(allRecords), [allRecords]);
  const redFrequency = statisticsSummary?.redFrequency ?? stats.redFrequency;
  const blueFrequency = statisticsSummary?.blueFrequency ?? stats.blueFrequency;
  const statisticsGeneratedAt = formatDateTime(statisticsSummary?.generatedAt);
  const statisticsStale = Boolean(
    statisticsSummary && stats.draws.length > 0 && statisticsSummary.totalDraws !== stats.draws.length
  );
  const syncNeeded = !loading && stats.draws.length === 0;
  const recentDraws = useMemo(() => getRecentDraws(stats.draws, 10), [stats.draws]);
  const recentTopDraws = useMemo(() => recentDraws.slice(0, 4), [recentDraws]);
  const totalYearlyRecords = useMemo(
    () => yearlyCounts.reduce((sum, item) => sum + item.count, 0),
    [yearlyCounts]
  );
  const sortedYearlyCounts = useMemo(
    () => [...yearlyCounts].sort((left, right) => right.year.localeCompare(left.year)),
    [yearlyCounts]
  );
  const yearlyPieOption = useMemo(
    () => createYearlyPieOption(sortedYearlyCounts),
    [sortedYearlyCounts]
  );

  const fetchYearlyCounts = async () => {
    setYearlyCountsLoading(true);
    try {
      const data = await lotteryRecordApi.getYearlyCounts();
      setYearlyCounts(data);
    } catch (error) {
      console.error('获取年度记录统计失败:', error);
      setYearlyCounts([]);
    } finally {
      setYearlyCountsLoading(false);
    }
  };

  const fetchStatisticsSummary = async () => {
    setStatisticsLoading(true);
    setStatisticsError(false);
    try {
      const data = await lotteryStatisticsApi.summary();
      setStatisticsSummary(data);
    } catch (error) {
      console.error('获取彩票统计汇总失败:', error);
      setStatisticsSummary(undefined);
      setStatisticsError(true);
    } finally {
      setStatisticsLoading(false);
    }
  };

  const handleRefreshRecords = async () => {
    await refreshRecords();
    await Promise.all([fetchYearlyCounts(), fetchStatisticsSummary()]);
  };

  const handleRefreshYearlyCounts = async () => {
    setYearlyCountsRefreshing(true);
    try {
      const data = await lotteryRecordApi.refreshYearlyCounts();
      setYearlyCounts(data);
    } catch (error) {
      console.error('手动统计年度记录失败:', error);
    } finally {
      setYearlyCountsRefreshing(false);
    }
  };

  const handleRefreshStatistics = async () => {
    setStatisticsRefreshing(true);
    setStatisticsError(false);
    try {
      const data = await lotteryStatisticsApi.refreshSummary();
      setStatisticsSummary(data);
    } catch (error) {
      console.error('手动重算彩票统计失败:', error);
      setStatisticsError(true);
    } finally {
      setStatisticsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchYearlyCounts();
    fetchStatisticsSummary();
  }, []);

  return (
    <LifePageShell
      className="lottery-overview-page"
      eyebrow="彩票数据"
      title="双色球数据概览"
      actions={
        <Space wrap>
          <LotteryAiPanel stats={stats} recentDraws={recentDraws} />
          <Button icon={<ReloadOutlined />} loading={loading || yearlyCountsLoading} onClick={handleRefreshRecords}>
            更新数据
          </Button>
          <Button
            icon={<BarChartOutlined />}
            loading={statisticsLoading || statisticsRefreshing}
            onClick={handleRefreshStatistics}
          >
            重算统计
          </Button>
          <Button icon={<PieChartOutlined />} onClick={() => navigate('/lottery/statistics?tab=frequency')}>
            统计分析
          </Button>
          <Button icon={<FileTextOutlined />} onClick={() => navigate('/lottery/tickets')}>
            票据
          </Button>
          <Button icon={<PieChartOutlined />} onClick={() => navigate('/lottery/ledger')}>
            账本
          </Button>
          <Button type="primary" icon={<DatabaseOutlined />} onClick={() => navigate('/lottery/records')}>
            开奖记录
          </Button>
        </Space>
      }
    >
      {(statisticsLoading || statisticsRefreshing || statisticsError || statisticsStale || syncNeeded) && (
        <Alert
          className="lottery-overview-status-alert"
          type={statisticsError || statisticsStale ? 'warning' : 'info'}
          showIcon
          message={
            syncNeeded
              ? '暂无开奖记录，请先同步数据'
              : statisticsLoading || statisticsRefreshing
                ? '正在加载彩票统计'
                : statisticsStale
                  ? '统计缓存与当前开奖记录数不一致'
                  : '统计服务暂不可用，当前使用本地开奖记录计算'
          }
          action={
            <Space className="lottery-overview-alert-actions" wrap>
              {statisticsStale && (
                <Button size="small" loading={statisticsRefreshing} onClick={handleRefreshStatistics}>
                  重算
                </Button>
              )}
              {syncNeeded && (
                <Button size="small" loading={loading} onClick={handleRefreshRecords}>
                  同步
                </Button>
              )}
            </Space>
          }
        />
      )}

      <section className="lottery-status-grid">
        <Card className="life-panel-card lottery-latest-card">
          <div className="lottery-card-title-row">
            <div>
              <h2>最近开奖</h2>
              <p>最近四期开奖记录，点击查看完整结构。</p>
            </div>
            <Tag color={recentTopDraws.length ? 'success' : 'default'}>
              {recentTopDraws.length ? `${statisticsSummary?.totalDraws ?? stats.draws.length} 期` : '暂无数据'}
            </Tag>
          </div>

          {recentTopDraws.length > 0 ? (
            <div className="lottery-latest-draw-grid">
              {recentTopDraws.map(draw => (
                <button key={draw.id} type="button" className="lottery-draw-card lottery-latest-draw-card" onClick={() => setSelectedDraw(draw)}>
                  <div className="lottery-draw-card-head">
                    <strong>第 {draw.period} 期</strong>
                    <span>{draw.combination}</span>
                  </div>
                  <LotteryBalls redNumbers={draw.redNumbers} blueNumber={draw.blueNumber} />
                  <div className="lottery-draw-meta">
                    <span>和值 {draw.redSum}</span>
                    <span>{draw.hexagramName}</span>
                    <span>{draw.planetName}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <Empty description="暂无开奖数据" />
          )}
        </Card>

        <Card className="life-panel-card lottery-yearly-card lottery-yearly-card-compact">
          <div className="lottery-card-title-row">
            <div>
              <h2>年度记录占比</h2>
              <p>按开奖年份拆分历史样本。</p>
            </div>
            <div className="lottery-yearly-actions">
              <Button
                size="small"
                icon={<ReloadOutlined />}
                loading={yearlyCountsRefreshing}
                onClick={handleRefreshYearlyCounts}
              >
                统计
              </Button>
              <span>
                {statisticsGeneratedAt ? `统计生成 ${statisticsGeneratedAt}` : '本地临时统计'}
                {statisticsStale ? ' · 待重算' : ''}
              </span>
            </div>
          </div>
          <Spin spinning={yearlyCountsLoading || yearlyCountsRefreshing || statisticsLoading}>
            {yearlyCounts.length > 0 ? (
              <div className="lottery-yearly-content">
                <div className="lottery-yearly-chart-shell">
                  <ReactECharts option={yearlyPieOption} className="lottery-yearly-chart" />
                  <div className="lottery-yearly-center" aria-hidden="true">
                    <strong>{totalYearlyRecords.toLocaleString()}</strong>
                    <span>总记录</span>
                  </div>
                </div>
              </div>
            ) : (
              <Empty description="暂无年度统计数据" />
            )}
          </Spin>
        </Card>
      </section>

      <LotterySummaryCards stats={stats} />

      {stats.draws.length > 0 && (
        <>
          <LotteryFrequencyCharts
            redFrequency={redFrequency}
            blueFrequency={blueFrequency}
            onOpenStatistics={() => navigate('/lottery/statistics?tab=frequency')}
          />
        </>
      )}

      <LotteryPeriodDetail
        draw={selectedDraw}
        open={Boolean(selectedDraw)}
        onClose={() => setSelectedDraw(undefined)}
      />
    </LifePageShell>
  );
};

export default LotteryOverviewPage;
