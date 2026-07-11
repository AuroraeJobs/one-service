import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, message, Space, Spin, Tag } from 'antd';
import { DashboardOutlined, MobileOutlined, SettingOutlined, SyncOutlined } from '@ant-design/icons';
import type { EChartsOption } from 'echarts';
import ReactECharts from './LotteryLocalizedECharts';
import { useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import LotteryBalls from './lottery/LotteryBalls';
import LotteryFrequencyCharts from './lottery/LotteryFrequencyCharts';
import LotteryPeriodDetail from './lottery/LotteryPeriodDetail';
import LotterySummaryCards from './lottery/LotterySummaryCards';
import { useI18n } from '../contexts/I18nContext';
import { useRecordContext } from '../contexts/RecordContext';
import { localizeLotteryCombination, type TranslateText } from '../i18n/formatLotteryText';
import { lotteryRecordApi, lotteryStatisticsApi, type LotteryStatisticsSummary, type RecordYearCount } from '../services/api';
import { buildLotteryStats, getRecentDraws, type LotteryDraw } from '../utils/lotteryStats';
import './LotteryOverviewPage.css';

const YEARLY_PIE_COLORS = [
  '#5f8ea0',
  '#7aa8b7',
  '#91b8c4',
  '#abc9d1',
  '#c2d8dd',
  '#d9e7ea',
  '#9fb4b8',
  '#82999e'
];

const YEARLY_PIE_DARK_COLORS = [
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

const getCurrentThemeKey = () => {
  if (typeof document === 'undefined') {
    return 'dark';
  }
  return document.documentElement.dataset.theme || 'dark';
};

// eslint-disable-next-line react-refresh/only-export-components
export const createYearlyPieOption = (
  yearlyCounts: RecordYearCount[],
  themeKey: string,
  translateText: TranslateText,
): EChartsOption => ({
  backgroundColor: 'transparent',
  color: themeKey === 'light' ? YEARLY_PIE_COLORS : YEARLY_PIE_DARK_COLORS,
  tooltip: {
    show: false
  },
  series: [
    {
      name: translateText('年度记录数'),
      type: 'pie',
      radius: ['56%', '74%'],
      center: ['50%', '50%'],
      silent: true,
      selectedMode: false,
      selectedOffset: 0,
      avoidLabelOverlap: true,
      padAngle: 1.6,
      minShowLabelAngle: 8,
      itemStyle: {
        borderWidth: 1,
        borderColor: getThemeValue('--lottery-yearly-slice-separator', 'rgba(255, 255, 255, 0.9)')
      },
      label: {
        show: true,
        formatter: params => {
          const item = params as { name: string; value: number };
          return translateText('{{year}}年\n{{count}}条', { year: item.name, count: item.value });
        },
        color: getThemeValue('--app-text-muted', '#6b7280'),
        fontSize: 10,
        lineHeight: 14
      },
      labelLine: {
        show: true,
        length: 8,
        length2: 6,
        lineStyle: {
          color: getThemeValue('--lottery-yearly-label-line', 'rgba(120, 136, 148, 0.38)')
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

const formatDateTime = (timestamp: number | undefined, language: string) => {
  if (!timestamp) {
    return undefined;
  }
  return new Date(timestamp).toLocaleString(language, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const LotteryOverviewPage = () => {
  const navigate = useNavigate();
  const { language, t, translateText } = useI18n();
  const [messageApi, messageContextHolder] = message.useMessage();
  const { allRecords, loading, refreshRecords } = useRecordContext();
  const [selectedDraw, setSelectedDraw] = useState<LotteryDraw | undefined>();
  const [statisticsSummary, setStatisticsSummary] = useState<LotteryStatisticsSummary>();
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [statisticsError, setStatisticsError] = useState(false);
  const [yearlyCounts, setYearlyCounts] = useState<RecordYearCount[]>([]);
  const [yearlyCountsLoading, setYearlyCountsLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string>();
  const [yearlyThemeKey, setYearlyThemeKey] = useState(getCurrentThemeKey);
  const stats = useMemo(() => buildLotteryStats(allRecords), [allRecords]);
  const redFrequency = statisticsSummary?.redFrequency ?? stats.redFrequency;
  const blueFrequency = statisticsSummary?.blueFrequency ?? stats.blueFrequency;
  const statisticsGeneratedAt = formatDateTime(statisticsSummary?.generatedAt, language);
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
    () => createYearlyPieOption(sortedYearlyCounts, yearlyThemeKey, t),
    [sortedYearlyCounts, yearlyThemeKey, t]
  );

  useEffect(() => {
    if (typeof MutationObserver === 'undefined') {
      return undefined;
    }
    const observer = new MutationObserver(() => setYearlyThemeKey(getCurrentThemeKey()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

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

  const handleUpdateAll = async () => {
    setUpdating(true);
    setUpdateError(undefined);
    let syncCompleted = false;
    try {
      const syncResult = await lotteryRecordApi.sync();
      if (syncResult.status === 'FAILED') {
        throw new Error(syncResult.message ? translateText(syncResult.message) : t('开奖记录同步失败'));
      }
      if (syncResult.status !== 'SUCCESS') {
        messageApi.warning(syncResult.message ? translateText(syncResult.message) : t('同步未完成，请稍后重试'));
        return;
      }
      syncCompleted = true;

      const [nextYearlyCounts, nextStatisticsSummary] = await Promise.all([
        lotteryRecordApi.refreshYearlyCounts(),
        lotteryStatisticsApi.refreshSummary(),
        refreshRecords()
      ]);
      setYearlyCounts(nextYearlyCounts);
      setStatisticsSummary(nextStatisticsSummary);
      setStatisticsError(false);
      messageApi.success(t('一键更新完成'));
    } catch (error) {
      console.error('一键更新彩票数据失败:', error);
      const detail = error instanceof Error && error.message
        ? translateText(error.message)
        : t('一键更新失败，请稍后重试');
      const errorMessage = syncCompleted
        ? t('开奖记录已同步，但统计或页面刷新失败：{{message}}', { message: detail })
        : detail;
      setUpdateError(errorMessage);
      messageApi.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchYearlyCounts();
    fetchStatisticsSummary();
  }, []);

  return (
    <LifePageShell
      className="lottery-overview-page"
      eyebrow={t('彩票数据')}
      title={t('数据概览')}
      actions={
        <Space wrap>
          <Button icon={<DashboardOutlined />} onClick={() => navigate('/lottery/workbench')}>
            {t('工作台')}
          </Button>
          <Button icon={<MobileOutlined />} onClick={() => navigate('/lottery/mobile')}>
            {t('移动')}
          </Button>
          <Button icon={<SettingOutlined />} onClick={() => navigate('/lottery/settings')}>
            {t('设置')}
          </Button>
          <Button
            type="primary"
            icon={<SyncOutlined />}
            loading={updating}
            disabled={loading || statisticsLoading || yearlyCountsLoading}
            onClick={handleUpdateAll}
          >
            {t('一键更新')}
          </Button>
        </Space>
      }
    >
      {messageContextHolder}
      {(updating || statisticsLoading || updateError || statisticsError || statisticsStale || syncNeeded) && (
        <Alert
          className="lottery-overview-status-alert"
          type={updateError ? 'error' : statisticsError || statisticsStale ? 'warning' : 'info'}
          showIcon
          message={
            updating
              ? t('正在一键更新彩票数据')
              : updateError
                ? updateError
                : syncNeeded
                  ? t('暂无开奖记录，请点击一键更新')
                  : statisticsLoading
                    ? t('正在加载彩票统计')
                    : statisticsStale
                      ? t('统计缓存与当前开奖记录数不一致')
                      : t('统计服务暂不可用，当前使用本地开奖记录计算')
          }
        />
      )}

      <section className="lottery-status-grid">
        <Card className="life-panel-card lottery-latest-card">
          <div className="lottery-card-title-row">
            <div>
              <h2>{t('最近开奖')}</h2>
              <p>{t('最近四期开奖记录，点击查看完整结构。')}</p>
            </div>
            <Tag color={recentTopDraws.length ? 'success' : 'default'}>
              {recentTopDraws.length
                ? t('{{count}} 期', { count: statisticsSummary?.totalDraws ?? stats.draws.length })
                : t('暂无数据')}
            </Tag>
          </div>

          {recentTopDraws.length > 0 ? (
            <div className="lottery-latest-draw-grid">
              {recentTopDraws.map(draw => (
                <button key={draw.id} type="button" className="lottery-draw-card lottery-latest-draw-card" onClick={() => setSelectedDraw(draw)}>
                  <div className="lottery-draw-card-head">
                    <strong>{t('第 {{period}} 期', { period: draw.period })}</strong>
                    <span>{localizeLotteryCombination(draw.combination, t, translateText)}</span>
                  </div>
                  <LotteryBalls redNumbers={draw.redNumbers} blueNumber={draw.blueNumber} />
                  <div className="lottery-draw-meta">
                    <span>{t('和值 {{sum}}', { sum: draw.redSum })}</span>
                    <span>{translateText(draw.hexagramName)}</span>
                    <span>{translateText(draw.planetName)}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <Empty description={t('暂无开奖数据')} />
          )}
        </Card>

        <Card className="life-panel-card lottery-yearly-card lottery-yearly-card-compact">
          <div className="lottery-card-title-row">
            <div>
              <h2>{t('年度记录占比')}</h2>
              <p>{t('按开奖年份拆分历史样本。')}</p>
            </div>
            <div className="lottery-yearly-actions">
              <span>
                {statisticsGeneratedAt
                  ? t('统计生成 {{time}}', { time: statisticsGeneratedAt })
                  : t('本地临时统计')}
                {statisticsStale ? (
                  <>
                    {' '}
                    {t('· 待重算')}
                  </>
                ) : null}
              </span>
            </div>
          </div>
          <Spin spinning={yearlyCountsLoading || updating || statisticsLoading}>
            {yearlyCounts.length > 0 ? (
              <div className="lottery-yearly-content">
                <div className="lottery-yearly-chart-shell">
                  <ReactECharts option={yearlyPieOption} className="lottery-yearly-chart" />
                  <div className="lottery-yearly-center" aria-hidden="true">
                    <strong>{totalYearlyRecords.toLocaleString(language)}</strong>
                    <span>{t('总记录')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <Empty description={t('暂无年度统计数据')} />
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
