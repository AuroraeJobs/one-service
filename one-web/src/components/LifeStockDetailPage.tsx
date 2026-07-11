import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Space, Spin, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AlertOutlined, ArrowLeftOutlined, BarChartOutlined, LineChartOutlined, ReloadOutlined, SyncOutlined } from '@ant-design/icons';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useNavigate, useParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import MetricCard from './MetricCard';
import MetricGrid from './MetricGrid';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import { stockApi, type StockAlertRule, type StockHoldingSummary, type StockKLine, type StockQuote, type StockTrade } from '../services/api';

const MA_WINDOWS = [5, 10, 20];

const LifeStockDetailPage = () => {
  const navigate = useNavigate();
  const { symbol = '' } = useParams();
  const { isEnglish } = useAppPreferences();
  const text = useMemo(() => ({
    missingSymbol: isEnglish ? 'Missing stock symbol' : '缺少股票代码',
    loadFailed: isEnglish ? 'Failed to load stock details' : '获取股票详情失败',
    notRefreshed: isEnglish ? 'Not refreshed yet' : '尚未刷新',
    type: isEnglish ? 'Type' : '类型',
    quantity: isEnglish ? 'Quantity' : '数量',
    price: isEnglish ? 'Price' : '价格',
    time: isEnglish ? 'Time' : '时间',
    direction: isEnglish ? 'Direction' : '方向',
    targetValue: isEnglish ? 'Target Value' : '目标值',
    lastTriggered: isEnglish ? 'Last Triggered' : '最近触发',
    eyebrow: isEnglish ? 'Stock Detail' : '股票详情',
    back: isEnglish ? 'Back' : '返回',
    addTrade: isEnglish ? 'Add Trade' : '新增交易',
    alert: isEnglish ? 'Alert' : '告警',
    kline: isEnglish ? 'K-Line' : 'K线',
    sync: isEnglish ? 'Sync' : '同步',
    refresh: isEnglish ? 'Refresh' : '刷新',
    latestPrice: isEnglish ? 'Latest Price' : '最新价',
    changePercent: isEnglish ? 'Change %' : '涨跌幅',
    turnover: isEnglish ? 'Turnover' : '成交额',
    quoteTime: isEnglish ? 'Quote Time' : '行情时间',
    cachedQuote: isEnglish ? 'Cached Quote' : '缓存行情',
    chartTitle: isEnglish ? 'K-Line Trend' : 'K 线走势',
    noKline: isEnglish ? 'No K-line data yet' : '暂无 K 线数据',
    holdingTitle: isEnglish ? 'Holding Summary' : '持仓摘要',
    positionsPage: isEnglish ? 'Positions' : '持仓页',
    holdingQuantity: isEnglish ? 'Holding Quantity' : '持仓数量',
    costPrice: isEnglish ? 'Cost Price' : '成本价',
    marketValue: isEnglish ? 'Market Value' : '市值',
    floatingPnl: isEnglish ? 'Floating P/L' : '浮动盈亏',
    noHolding: isEnglish ? 'No holding for this symbol yet. Add a trade and the backend will recalculate positions.' : '暂无该标的持仓，新增交易后会由后端重算持仓。',
    recentTrades: isEnglish ? 'Recent Trades' : '近期交易',
    allTrades: isEnglish ? 'All Trades' : '全部交易',
    emptyTrades: isEnglish ? 'No trade records for this symbol yet.' : '暂无该标的交易记录。',
    activeAlerts: isEnglish ? 'Active Alerts' : '有效告警',
    alertsPage: isEnglish ? 'Alerts' : '告警页',
    emptyAlerts: isEnglish ? 'No enabled alerts for this symbol yet.' : '暂无该标的启用告警。',
    dailyK: isEnglish ? 'Daily K' : '日K',
    volume: isEnglish ? 'Volume' : '成交量',
    amountUnit: isEnglish ? 'B' : '亿'
  }), [isEnglish]);
  const [quote, setQuote] = useState<StockQuote>();
  const [kLines, setKLines] = useState<StockKLine[]>([]);
  const [holding, setHolding] = useState<StockHoldingSummary>();
  const [trades, setTrades] = useState<StockTrade[]>([]);
  const [alertRules, setAlertRules] = useState<StockAlertRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const loadStockDetail = useCallback(async () => {
    const normalizedSymbol = symbol.trim();
    if (!normalizedSymbol) {
      setError(text.missingSymbol);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const [nextQuote, nextKLines, portfolio, nextTrades, activeRules] = await Promise.all([
        stockApi.quote(normalizedSymbol),
        stockApi.klines(normalizedSymbol, { period: 'daily' }),
        stockApi.portfolioSummary(),
        stockApi.trades({ symbol: normalizedSymbol }),
        stockApi.alertRules(true)
      ]);
      setQuote(nextQuote);
      setKLines(nextKLines);
      setHolding(portfolio.holdings?.find(item => item.symbol === normalizedSymbol));
      setTrades(nextTrades.slice(0, 5));
      setAlertRules(activeRules.filter(item => item.symbol === normalizedSymbol));
    } catch (requestError) {
      console.error('获取股票详情失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : text.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [symbol, text.loadFailed, text.missingSymbol]);

  useEffect(() => {
    loadStockDetail();
  }, [loadStockDetail]);

  const chartOption = useMemo(() => buildKLineChartOption(kLines, text), [kLines, text]);
  const fetchedAt = quote?.fetchedAt ? new Date(quote.fetchedAt).toLocaleString() : text.notRefreshed;
  const tradeColumns = useMemo<ColumnsType<StockTrade>>(() => [
    {
      title: text.type,
      dataIndex: 'tradeType',
      key: 'tradeType',
      render: value => <Tag color={tradeTypeColor(value)}>{tradeTypeLabel(value, isEnglish)}</Tag>
    },
    {
      title: text.quantity,
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      render: value => formatQuantity(value)
    },
    {
      title: text.price,
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      render: value => formatPrice(value)
    },
    {
      title: text.time,
      dataIndex: 'tradedAt',
      key: 'tradedAt',
      render: value => formatTime(value)
    }
  ], [isEnglish, text.price, text.quantity, text.time, text.type]);
  const alertColumns = useMemo<ColumnsType<StockAlertRule>>(() => [
    {
      title: text.type,
      dataIndex: 'ruleType',
      key: 'ruleType',
      render: value => <Tag color="blue">{ruleTypeLabel(value, isEnglish)}</Tag>
    },
    {
      title: text.direction,
      dataIndex: 'direction',
      key: 'direction',
      render: value => <Tag color={directionColor(value)}>{directionLabel(value, isEnglish)}</Tag>
    },
    {
      title: text.targetValue,
      dataIndex: 'targetValue',
      key: 'targetValue',
      align: 'right',
      render: value => formatQuantity(value)
    },
    {
      title: text.lastTriggered,
      dataIndex: 'lastTriggeredAt',
      key: 'lastTriggeredAt',
      render: value => formatTime(value)
    }
  ], [isEnglish, text.direction, text.lastTriggered, text.targetValue, text.type]);

  return (
    <LifePageShell
      className="life-stock-detail-page"
      eyebrow={text.eyebrow}
      title={quote?.name || quote?.symbol || symbol}
      actions={
        <Space wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/investments')}>
            {text.back}
          </Button>
          <Button icon={<BarChartOutlined />} onClick={() => navigate(`/investments/trades?symbol=${encodeURIComponent(symbol)}&action=create`)}>
            {text.addTrade}
          </Button>
          <Button icon={<AlertOutlined />} onClick={() => navigate(`/investments/alerts?symbol=${encodeURIComponent(symbol)}&action=create`)}>
            {text.alert}
          </Button>
          <Button icon={<LineChartOutlined />} onClick={() => navigate(`/investments/klines?symbol=${encodeURIComponent(symbol)}&period=daily`)}>
            {text.kline}
          </Button>
          <Button icon={<SyncOutlined />} onClick={() => navigate(`/investments/sync?symbol=${encodeURIComponent(symbol)}`)}>
            {text.sync}
          </Button>
          <Button type="primary" icon={<ReloadOutlined spin={loading} />} onClick={loadStockDetail}>
            {text.refresh}
          </Button>
        </Space>
      }
    >
      {error ? <Alert type="error" showIcon message={error} className="stock-market-alert" /> : null}

      <Spin spinning={loading}>
        <MetricGrid gap={16} minColumnWidth={180}>
          <MetricCard title={text.latestPrice} value={formatPrice(quote?.price)} accent={quoteAccent(quote)} />
          <MetricCard title={text.changePercent} value={formatChangePercent(quote)} accent={quoteAccent(quote)} />
          <MetricCard title={text.turnover} value={formatAmount(quote?.amount, text.amountUnit)} accent="#ff9500" />
          <MetricCard title={text.quoteTime} value={fetchedAt} accent="#34c759" valueStyle={{ fontSize: 18 }} />
        </MetricGrid>

        <Card className="life-panel-card stock-detail-header-card">
          <div className="stock-detail-header">
            <div>
              <h2>{quote?.name || quote?.symbol || symbol}</h2>
              <Space wrap>
                <Tag color="blue">{quote?.symbol || symbol}</Tag>
                {quote?.market ? <Tag>{quote.market}</Tag> : null}
                {quote?.source ? <Tag color="purple">{quote.source}</Tag> : null}
                {quote?.stale ? <Tag color="orange">{quote.staleReason || text.cachedQuote}</Tag> : null}
              </Space>
            </div>
            <QuoteChange quote={quote} />
          </div>
        </Card>

        <Card className="life-panel-card stock-chart-card">
          <div className="life-panel-title-row">
            <h2>{text.chartTitle}</h2>
            <LineChartOutlined className="stock-chart-title-icon" />
          </div>
          {kLines.length > 0 ? (
            <ReactECharts option={chartOption} className="stock-kline-chart" notMerge lazyUpdate />
          ) : (
            <div className="stock-empty-chart">{text.noKline}</div>
          )}
        </Card>

        <Card className="life-panel-card stock-market-panel">
          <div className="life-panel-title-row">
            <h2>{text.holdingTitle}</h2>
            <Button type="link" onClick={() => navigate(`/investments/positions?accountId=${encodeURIComponent(holding?.accountId || '')}`)}>
              {text.positionsPage}
            </Button>
          </div>
          <MetricGrid gap={12} minColumnWidth={160}>
            <MetricCard title={text.holdingQuantity} value={formatQuantity(holding?.quantity)} accent="#0071e3" />
            <MetricCard title={text.costPrice} value={formatPrice(holding?.costPrice)} accent="#ff9500" />
            <MetricCard title={text.marketValue} value={formatMoney(holding?.marketValue)} accent="#34c759" />
            <MetricCard title={text.floatingPnl} value={formatMoney(holding?.floatingPnl)} accent={pnlAccent(holding?.floatingPnl)} />
          </MetricGrid>
          {!holding ? <Alert type="info" showIcon message={text.noHolding} className="stock-market-alert stock-detail-inline-alert" /> : null}
        </Card>

        <Card className="life-panel-card stock-market-panel">
          <div className="life-panel-title-row">
            <h2>{text.recentTrades}</h2>
            <Button type="link" onClick={() => navigate(`/investments/trades?symbol=${encodeURIComponent(symbol)}`)}>
              {text.allTrades}
            </Button>
          </div>
          <Table
            rowKey={record => record.id || `${record.symbol}-${record.tradedAt}`}
            columns={tradeColumns}
            dataSource={trades}
            pagination={false}
            size="small"
            locale={{ emptyText: text.emptyTrades }}
            rowClassName="stock-quote-row"
          />
        </Card>

        <Card className="life-panel-card stock-market-panel">
          <div className="life-panel-title-row">
            <h2>{text.activeAlerts}</h2>
            <Button type="link" onClick={() => navigate(`/investments/alerts?symbol=${encodeURIComponent(symbol)}`)}>
              {text.alertsPage}
            </Button>
          </div>
          <Table
            rowKey={record => record.id || `${record.symbol}-${record.ruleType}-${record.direction}`}
            columns={alertColumns}
            dataSource={alertRules}
            pagination={false}
            size="small"
            locale={{ emptyText: text.emptyAlerts }}
            rowClassName="stock-quote-row"
          />
        </Card>
      </Spin>
    </LifePageShell>
  );
};

type StockDetailText = {
  dailyK: string;
  volume: string;
};

const buildKLineChartOption = (kLines: StockKLine[], text: StockDetailText): EChartsOption => {
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
        name: text.dailyK,
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
        name: text.volume,
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

const formatMoney = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatQuantity = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 4
  });
};

const formatTime = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return new Date(value).toLocaleString();
};

const formatAmount = (value?: number, unit = '亿') => {
  if (typeof value !== 'number' || value <= 0) {
    return '-';
  }
  return `${(value / 100000000).toFixed(2)}${unit}`;
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

const pnlAccent = (value?: number) => {
  if (typeof value !== 'number') {
    return '#0071e3';
  }
  return value >= 0 ? '#f5222d' : '#16a34a';
};

const tradeTypeLabel = (value?: string, isEnglish = false) => {
  const labels: Record<string, string> = {
    BUY: isEnglish ? 'Buy' : '买入',
    SELL: isEnglish ? 'Sell' : '卖出',
    DIVIDEND: isEnglish ? 'Dividend' : '分红',
    FEE: isEnglish ? 'Fee' : '费用',
    BONUS_SHARE: isEnglish ? 'Bonus Share' : '送股',
    SPLIT: isEnglish ? 'Split' : '拆股'
  };
  return value ? labels[value] || value : '-';
};

const tradeTypeColor = (value?: string) => {
  if (value === 'BUY' || value === 'BONUS_SHARE') {
    return 'red';
  }
  if (value === 'SELL' || value === 'FEE') {
    return 'green';
  }
  return 'blue';
};

const ruleTypeLabel = (value?: string, isEnglish = false) => {
  const labels: Record<string, string> = {
    PRICE: isEnglish ? 'Price' : '价格',
    PERCENT_CHANGE: isEnglish ? 'Percent Change' : '涨跌幅',
    VOLUME_ABNORMAL: isEnglish ? 'Volume Anomaly' : '成交量异常'
  };
  return value ? labels[value] || value : '-';
};

const directionLabel = (value?: string, isEnglish = false) => {
  const labels: Record<string, string> = {
    ABOVE: isEnglish ? 'Above/Upward' : '高于/向上',
    BELOW: isEnglish ? 'Below/Downward' : '低于/向下',
    UP: isEnglish ? 'Trigger on Rise' : '上涨触发',
    DOWN: isEnglish ? 'Trigger on Drop' : '下跌触发'
  };
  return value ? labels[value] || value : '-';
};

const directionColor = (value?: string) => {
  if (value === 'ABOVE' || value === 'UP') {
    return 'red';
  }
  if (value === 'BELOW' || value === 'DOWN') {
    return 'green';
  }
  return 'blue';
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
