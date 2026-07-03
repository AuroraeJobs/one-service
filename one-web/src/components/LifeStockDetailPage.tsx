import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Space, Spin, Tag } from 'antd';
import { ArrowLeftOutlined, LineChartOutlined, ReloadOutlined } from '@ant-design/icons';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useNavigate, useParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import MetricCard from './MetricCard';
import MetricGrid from './MetricGrid';
import { stockApi, type StockKLine, type StockQuote } from '../services/api';

const MA_WINDOWS = [5, 10, 20];

const LifeStockDetailPage = () => {
  const navigate = useNavigate();
  const { symbol = '' } = useParams();
  const [quote, setQuote] = useState<StockQuote>();
  const [kLines, setKLines] = useState<StockKLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const loadStockDetail = useCallback(async () => {
    const normalizedSymbol = symbol.trim();
    if (!normalizedSymbol) {
      setError('缺少股票代码');
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const [nextQuote, nextKLines] = await Promise.all([
        stockApi.quote(normalizedSymbol),
        stockApi.klines(normalizedSymbol, { period: 'daily' })
      ]);
      setQuote(nextQuote);
      setKLines(nextKLines);
    } catch (requestError) {
      console.error('获取股票详情失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '获取股票详情失败');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    loadStockDetail();
  }, [loadStockDetail]);

  const chartOption = useMemo(() => buildKLineChartOption(kLines), [kLines]);
  const fetchedAt = quote?.fetchedAt ? new Date(quote.fetchedAt).toLocaleString() : '尚未刷新';

  return (
    <LifePageShell
      className="life-stock-detail-page"
      eyebrow="股票详情"
      title={quote?.name || quote?.symbol || symbol}
      actions={
        <Space wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/investments')}>
            返回
          </Button>
          <Button type="primary" icon={<ReloadOutlined spin={loading} />} onClick={loadStockDetail}>
            刷新
          </Button>
        </Space>
      }
    >
      {error ? <Alert type="error" showIcon message={error} className="stock-market-alert" /> : null}

      <Spin spinning={loading}>
        <MetricGrid gap={16} minColumnWidth={180}>
          <MetricCard title="最新价" value={formatPrice(quote?.price)} accent={quoteAccent(quote)} />
          <MetricCard title="涨跌幅" value={formatChangePercent(quote)} accent={quoteAccent(quote)} />
          <MetricCard title="成交额" value={formatAmount(quote?.amount)} accent="#ff9500" />
          <MetricCard title="行情时间" value={fetchedAt} accent="#34c759" valueStyle={{ fontSize: 18 }} />
        </MetricGrid>

        <Card className="life-panel-card stock-detail-header-card">
          <div className="stock-detail-header">
            <div>
              <h2>{quote?.name || quote?.symbol || symbol}</h2>
              <Space wrap>
                <Tag color="blue">{quote?.symbol || symbol}</Tag>
                {quote?.market ? <Tag>{quote.market}</Tag> : null}
                {quote?.source ? <Tag color="purple">{quote.source}</Tag> : null}
                {quote?.stale ? <Tag color="orange">{quote.staleReason || '缓存行情'}</Tag> : null}
              </Space>
            </div>
            <QuoteChange quote={quote} />
          </div>
        </Card>

        <Card className="life-panel-card stock-chart-card">
          <div className="life-panel-title-row">
            <h2>K 线走势</h2>
            <LineChartOutlined className="stock-chart-title-icon" />
          </div>
          {kLines.length > 0 ? (
            <ReactECharts option={chartOption} className="stock-kline-chart" notMerge lazyUpdate />
          ) : (
            <div className="stock-empty-chart">暂无 K 线数据</div>
          )}
        </Card>
      </Spin>
    </LifePageShell>
  );
};

const buildKLineChartOption = (kLines: StockKLine[]): EChartsOption => {
  const sortedKLines = [...kLines].sort((left, right) => left.tradeDate.localeCompare(right.tradeDate));
  const dates = sortedKLines.map(item => item.tradeDate);
  const candleData = sortedKLines.map(item => [
    Number(item.open || 0),
    Number(item.close || 0),
    Number(item.low || 0),
    Number(item.high || 0)
  ]);
  const volumeData = sortedKLines.map((item, index) => {
    const rising = Number(item.close || 0) >= Number(item.open || 0);
    return {
      value: [index, Number(item.volume || 0)],
      itemStyle: {
        color: rising ? '#f5222d' : '#16a34a'
      }
    };
  });

  return {
    color: ['#f5222d', '#16a34a', '#0071e3', '#ff9500', '#5856d6'],
    animation: false,
    legend: {
      top: 0,
      textStyle: { color: 'var(--app-text-muted)' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    axisPointer: {
      link: [{ xAxisIndex: [0, 1] }]
    },
    grid: [
      { left: 48, right: 20, top: 36, height: 260 },
      { left: 48, right: 20, top: 326, height: 92 }
    ],
    xAxis: [
      {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLine: { lineStyle: { color: 'var(--app-border)' } },
        axisLabel: { color: 'var(--app-text-muted)' },
        min: 'dataMin',
        max: 'dataMax'
      },
      {
        type: 'category',
        gridIndex: 1,
        data: dates,
        boundaryGap: false,
        axisLine: { lineStyle: { color: 'var(--app-border)' } },
        axisLabel: { color: 'var(--app-text-muted)' },
        min: 'dataMin',
        max: 'dataMax'
      }
    ],
    yAxis: [
      {
        scale: true,
        splitLine: { lineStyle: { color: 'var(--app-border)' } },
        axisLabel: { color: 'var(--app-text-muted)' }
      },
      {
        scale: true,
        gridIndex: 1,
        splitNumber: 2,
        splitLine: { lineStyle: { color: 'var(--app-border)' } },
        axisLabel: { color: 'var(--app-text-muted)' }
      }
    ],
    dataZoom: [
      { type: 'inside', xAxisIndex: [0, 1], start: 55, end: 100 },
      { show: true, xAxisIndex: [0, 1], type: 'slider', bottom: 0, start: 55, end: 100 }
    ],
    series: [
      {
        name: '日K',
        type: 'candlestick',
        data: candleData,
        itemStyle: {
          color: '#f5222d',
          color0: '#16a34a',
          borderColor: '#f5222d',
          borderColor0: '#16a34a'
        }
      },
      ...MA_WINDOWS.map(windowSize => ({
        name: `MA${windowSize}`,
        type: 'line' as const,
        data: calculateMovingAverage(sortedKLines, windowSize),
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 1.4 }
      })),
      {
        name: '成交量',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: volumeData
      }
    ]
  };
};

const calculateMovingAverage = (kLines: StockKLine[], windowSize: number) => {
  return kLines.map((_, index) => {
    if (index < windowSize - 1) {
      return '-';
    }
    const values = kLines.slice(index - windowSize + 1, index + 1).map(item => Number(item.close || 0));
    const total = values.reduce((sum, value) => sum + value, 0);
    return Number((total / windowSize).toFixed(2));
  });
};

const formatPrice = (value?: number) => typeof value === 'number' ? value.toFixed(2) : '-';

const formatAmount = (value?: number) => {
  if (typeof value !== 'number' || value <= 0) {
    return '-';
  }
  return `${(value / 100000000).toFixed(2)}亿`;
};

const formatChangePercent = (quote?: StockQuote) => {
  if (!quote?.available || typeof quote.changePercent !== 'number') {
    return '-';
  }
  const sign = quote.changePercent > 0 ? '+' : '';
  return `${sign}${quote.changePercent.toFixed(2)}%`;
};

const quoteAccent = (quote?: StockQuote) => {
  if (!quote?.available || typeof quote.changeAmount !== 'number') {
    return '#0071e3';
  }
  if (quote.changeAmount > 0) {
    return '#f5222d';
  }
  if (quote.changeAmount < 0) {
    return '#16a34a';
  }
  return '#0071e3';
};

const QuoteChange = ({ quote }: { quote?: StockQuote }) => {
  if (!quote?.available || typeof quote.changeAmount !== 'number' || typeof quote.changePercent !== 'number') {
    return <span className="stock-detail-change stock-detail-change-flat">-</span>;
  }
  const sign = quote.changeAmount > 0 ? '+' : '';
  return (
    <span className="stock-detail-change" style={{ color: quoteAccent(quote) }}>
      {sign}{quote.changeAmount.toFixed(2)} / {sign}{quote.changePercent.toFixed(2)}%
    </span>
  );
};

export default LifeStockDetailPage;
