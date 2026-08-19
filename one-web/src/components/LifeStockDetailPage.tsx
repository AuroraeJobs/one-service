import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Space, Spin, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AlertOutlined, ArrowLeftOutlined, BarChartOutlined, LineChartOutlined, ReloadOutlined, SyncOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate, useParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import MetricCard from './MetricCard';
import MetricGrid from './MetricGrid';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import { stockApi, type StockAlertRule, type StockHoldingSummary, type StockKLine, type StockQuote, type StockTrade } from '../services/api';
import { QuoteChange } from './StockText';
import { formatAmount, formatChangePercent, formatMoney, formatPrice, formatQuantity, formatTime, pnlAccent, quoteAccent } from '../utils/stockFormat';
import { directionColor, directionLabel, ruleTypeLabel, tradeTypeColor, tradeTypeLabel } from '../utils/stockLabels';
import { buildKLineChartOption, type SubChart } from '../utils/stockChart';

const LifeStockDetailPage = () => {
  const navigate = useNavigate();
  const { symbol = '' } = useParams();
  const { isEnglish } = useAppPreferences();
  const [period] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [subCharts] = useState<SubChart[]>(['volume']);
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
    amountUnit: isEnglish ? 'B' : '亿',
    dailyPeriod: isEnglish ? 'Daily' : '日K',
    weeklyPeriod: isEnglish ? 'Weekly' : '周K',
    monthlyPeriod: isEnglish ? 'Monthly' : '月K',
    subChartTitle: isEnglish ? 'Sub Indicators' : '副图指标'
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

  const chartOption = useMemo(() => buildKLineChartOption(kLines, { periodLabel: text.dailyK, volumeLabel: text.volume }, subCharts), [kLines, text.dailyK, text.volume, subCharts]);
  const fetchedAt = quote?.fetchedAt ? new Date(quote.fetchedAt).toLocaleString() : text.notRefreshed;
  useEffect(() => {
    if (!symbol.trim() || period === 'daily') {
      return;
    }
    stockApi.klines(symbol.trim(), { period }).then(setKLines).catch(() => undefined);
  }, [symbol, period]);

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
            <QuoteChange quote={quote} className="stock-detail-change" />
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

export default LifeStockDetailPage;
