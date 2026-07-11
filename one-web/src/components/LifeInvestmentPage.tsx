import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Input, Popconfirm, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { BarChartOutlined, DeleteOutlined, LineChartOutlined, PieChartOutlined, PlusOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import MetricCard from './MetricCard';
import MetricGrid from './MetricGrid';
import LifePageShell from './LifePageShell';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import { stockApi, type StockAlertHistory, type StockAnalysisItem, type StockAnalysisSummary, type StockHoldingSummary, type StockPortfolioSummary, type StockProviderHealth, type StockQuote, type StockWatchlistItem } from '../services/api';

const LifeInvestmentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isEnglish } = useAppPreferences();
  const text = useMemo(() => ({
    notCalculated: isEnglish ? 'Not calculated yet' : '尚未计算',
    loadQuotesFailed: isEnglish ? 'Failed to load stock quotes' : '获取股票行情失败',
    loadWatchlistFailed: isEnglish ? 'Failed to load stock watchlist' : '获取股票自选失败',
    loadPortfolioFailed: isEnglish ? 'Failed to load portfolio summary' : '获取股票组合汇总失败',
    loadInsightsFailed: isEnglish ? 'Failed to load stock overview insights' : '获取股票总览洞察失败',
    enterSymbol: isEnglish ? 'Please enter a stock symbol' : '请输入股票代码',
    addWatchlistFailed: isEnglish ? 'Failed to add stock watchlist item' : '添加股票自选失败',
    deleteWatchlistFailed: isEnglish ? 'Failed to delete stock watchlist item' : '删除股票自选失败',
    symbol: isEnglish ? 'Symbol' : '标的',
    latestPrice: isEnglish ? 'Latest Price' : '最新价',
    change: isEnglish ? 'Change' : '涨跌',
    open: isEnglish ? 'Open' : '今开',
    highLow: isEnglish ? 'High/Low' : '最高/最低',
    turnover: isEnglish ? 'Turnover' : '成交额',
    quoteTime: isEnglish ? 'Quote Time' : '行情时间',
    cachedQuote: isEnglish ? 'Cached Quote' : '缓存行情',
    action: isEnglish ? 'Action' : '操作',
    deleteWatchlistTitle: isEnglish ? 'Remove from watchlist?' : '删除自选股？',
    delete: isEnglish ? 'Delete' : '删除',
    cancel: isEnglish ? 'Cancel' : '取消',
    deleteWatchlistAria: isEnglish ? 'Remove watchlist item' : '删除自选股',
    queryResult: isEnglish ? 'Query Result' : '查询结果',
    holding: isEnglish ? 'Holding' : '持仓',
    quantity: isEnglish ? 'Quantity' : '数量',
    marketValue: isEnglish ? 'Market Value' : '市值',
    costAmount: isEnglish ? 'Cost Amount' : '持仓成本',
    floatingPnl: isEnglish ? 'Floating P/L' : '浮动盈亏',
    realized: isEnglish ? 'Realized' : '已实现',
    dividend: isEnglish ? 'Dividend' : '分红',
    todayPnl: isEnglish ? 'Today P/L' : '今日盈亏',
    quote: isEnglish ? 'Quote' : '行情',
    noQuote: isEnglish ? 'No Quote' : '暂无行情',
    realtime: isEnglish ? 'Realtime' : '实时',
    type: isEnglish ? 'Type' : '类型',
    triggerValue: isEnglish ? 'Trigger Value' : '触发值',
    time: isEnglish ? 'Time' : '时间',
    configureConnection: isEnglish ? 'Configure Connection' : '配置接入',
    portfolioValue: isEnglish ? 'Portfolio Value' : '组合市值',
    realizedPnl: isEnglish ? 'Realized P/L' : '已实现盈亏',
    dividendIncome: isEnglish ? 'Dividend Income' : '分红收入',
    holdingCount: isEnglish ? 'Holding Count' : '持仓数量',
    holdingUnit: isEnglish ? 'stock(s)' : '只',
    portfolioTitle: isEnglish ? 'Portfolio Holdings' : '组合持仓',
    portfolioDescription: isEnglish
      ? 'Holdings are stored in MongoDB. Market value and returns are calculated by the internal portfolio summary API; quote providers are abstracted by backend services.'
      : '持仓保存在 MongoDB，市值和收益通过内部组合汇总接口计算；行情来源由后端服务抽象统一处理。',
    calculatedAt: isEnglish ? 'Calculated' : '计算时间',
    refreshOverview: isEnglish ? 'Refresh Overview' : '刷新总览',
    emptyHoldings: isEnglish ? 'No stock holdings yet. Add accounts, positions, and trades through the APIs first.' : '暂无股票持仓，可先通过接口添加账户、持仓和交易记录。',
    analysisSummary: isEnglish ? 'Analysis Summary' : '分析摘要',
    analysisPage: isEnglish ? 'Analysis' : '分析页',
    concentration: isEnglish ? 'Concentration' : '集中度',
    concentrationSymbol: isEnglish ? 'Concentrated Symbol' : '集中标的',
    topGainers: isEnglish ? 'Top Gainers' : '涨幅靠前',
    drawdownRisk: isEnglish ? 'Drawdown Risk' : '回撤风险',
    recentAlerts: isEnglish ? 'Recent Alerts' : '最近告警',
    alertsPage: isEnglish ? 'Alerts' : '告警页',
    emptyAlertHistory: isEnglish ? 'No alert trigger history yet.' : '暂无告警触发历史。',
    providerHealth: isEnglish ? 'Provider Health' : '数据源健康',
    dataSources: isEnglish ? 'Data Sources' : '数据源',
    activeProvider: isEnglish ? 'Active' : '当前启用',
    fallbackProvider: isEnglish ? 'Fallback' : '备用',
    registeredProvider: isEnglish ? 'Registered' : '已注册',
    providerLoading: isEnglish ? 'Provider health loading...' : '数据源健康加载中...',
    emptyProviders: isEnglish ? 'No provider health information yet.' : '暂无数据源健康信息。',
    marketQuery: isEnglish ? 'Market Query' : '行情查询',
    watchlistQuotes: isEnglish ? 'Watchlist Quotes' : '自选行情',
    marketDescription: isEnglish ? 'Enter stock or index symbols for temporary queries. Results still come from the internal quote API.' : '输入股票或指数代码进行临时查询，查询结果仍然来自内部行情接口。',
    watchlistDescription: isEnglish ? 'Watchlist symbols are stored in MongoDB and quotes are fetched through the internal API. Enter A-share symbols to add or query.' : '自选股保存到 MongoDB，行情通过内部接口统一获取；可输入 A 股代码添加自选或临时查询。',
    addWatchlist: isEnglish ? 'Add' : '加自选',
    quickQuery: isEnglish ? 'Quick Query' : '快速查询',
    refreshWatchlist: isEnglish ? 'Refresh Watchlist' : '刷新自选',
    emptyWatchlist: isEnglish ? 'No watchlist items yet. Enter symbols to add them.' : '暂无自选股，输入股票代码后添加自选。',
    overviewEyebrow: isEnglish ? 'Stock Overview' : '股票总览',
    overviewTitle: isEnglish ? 'Organize accounts, holdings, quotes, and return attribution into a long-term asset view.' : '把账户、持仓、行情和收益归因整理成长期资产视图。',
    watchlistEyebrow: isEnglish ? 'Stock Watchlist' : '股票自选',
    watchlistTitle: isEnglish ? 'Maintain watched symbols and quickly review realtime data returned by internal quote services.' : '维护关注标的，快速查看内部行情服务返回的实时数据。',
    marketEyebrow: isEnglish ? 'Market Query' : '行情查询',
    marketTitle: isEnglish ? 'Query stocks, indices, and future market instruments without binding the UI to a third-party source.' : '独立查询股票、指数和后续扩展市场标的，不绑定具体第三方来源。',
    amountUnit: isEnglish ? 'B' : '亿'
  }), [isEnglish]);
  const [symbolInput, setSymbolInput] = useState('600519');
  const [watchlist, setWatchlist] = useState<StockWatchlistItem[]>([]);
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<StockPortfolioSummary>();
  const [analysisSummary, setAnalysisSummary] = useState<StockAnalysisSummary>();
  const [alertHistories, setAlertHistories] = useState<StockAlertHistory[]>([]);
  const [providerHealth, setProviderHealth] = useState<StockProviderHealth[]>([]);
  const [loading, setLoading] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState<string>();

  const symbols = useMemo(() => {
    return symbolInput
      .split(/[\s,，;；]+/)
      .map(item => item.trim())
      .filter(Boolean);
  }, [symbolInput]);

  const watchlistSymbols = useMemo(() => watchlist.map(item => item.symbol).filter(Boolean), [watchlist]);

  const watchlistSymbolSet = useMemo(() => new Set(watchlistSymbols), [watchlistSymbols]);

  const activeView = useMemo<StockInvestmentView>(() => {
    if (location.pathname.endsWith('/watchlist')) {
      return 'watchlist';
    }
    if (location.pathname.endsWith('/market')) {
      return 'market';
    }
    return 'overview';
  }, [location.pathname]);

  const isOverview = activeView === 'overview';
  const isWatchlist = activeView === 'watchlist';
  const isMarket = activeView === 'market';
  const pageMeta = stockViewMeta[activeView](text);

  const portfolioCalculatedAt = useMemo(() => {
    const calculatedAt = portfolioSummary?.calculatedAt;
    return calculatedAt ? new Date(calculatedAt).toLocaleString() : text.notCalculated;
  }, [portfolioSummary?.calculatedAt, text.notCalculated]);

  const fetchQuotes = useCallback(async (nextSymbols: string[]) => {
    if (nextSymbols.length === 0) {
      setQuotes([]);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const data = await stockApi.quotes(nextSymbols);
      setQuotes(data);
    } catch (requestError) {
      console.error('获取股票行情失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : text.loadQuotesFailed);
    } finally {
      setLoading(false);
    }
  }, [text.loadQuotesFailed]);

  const fetchWatchlist = useCallback(async () => {
    setWatchlistLoading(true);
    setError(undefined);
    try {
      const data = await stockApi.watchlist();
      setWatchlist(data);
      await fetchQuotes(data.map(item => item.symbol).filter(Boolean));
    } catch (requestError) {
      console.error('获取股票自选失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : text.loadWatchlistFailed);
    } finally {
      setWatchlistLoading(false);
    }
  }, [fetchQuotes, text.loadWatchlistFailed]);

  const fetchPortfolioSummary = useCallback(async () => {
    setPortfolioLoading(true);
    setError(undefined);
    try {
      const data = await stockApi.portfolioSummary();
      setPortfolioSummary(data);
    } catch (requestError) {
      console.error('获取股票组合汇总失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : text.loadPortfolioFailed);
    } finally {
      setPortfolioLoading(false);
    }
  }, [text.loadPortfolioFailed]);

  const fetchDashboardInsights = useCallback(async () => {
    setDashboardLoading(true);
    setError(undefined);
    try {
      const [analysis, histories, health] = await Promise.all([
        stockApi.analysisSummary(),
        stockApi.alertHistory(),
        stockApi.providerHealth()
      ]);
      setAnalysisSummary(analysis);
      setAlertHistories(histories.slice(0, 5));
      setProviderHealth(health);
    } catch (requestError) {
      console.error('获取股票总览洞察失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : text.loadInsightsFailed);
    } finally {
      setDashboardLoading(false);
    }
  }, [text.loadInsightsFailed]);

  useEffect(() => {
    fetchWatchlist();
    fetchPortfolioSummary();
    fetchDashboardInsights();
  }, [fetchDashboardInsights, fetchPortfolioSummary, fetchWatchlist]);

  const addWatchlist = useCallback(async () => {
    if (symbols.length === 0) {
      setError(text.enterSymbol);
      return;
    }
    setAddLoading(true);
    setError(undefined);
    try {
      for (const symbol of symbols) {
        await stockApi.addWatchlist(symbol);
      }
      setSymbolInput('');
      await fetchWatchlist();
    } catch (requestError) {
      console.error('添加股票自选失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : text.addWatchlistFailed);
    } finally {
      setAddLoading(false);
    }
  }, [fetchWatchlist, symbols, text.addWatchlistFailed, text.enterSymbol]);

  const deleteWatchlist = useCallback(async (symbol: string) => {
    setError(undefined);
    try {
      await stockApi.deleteWatchlist(symbol);
      await fetchWatchlist();
    } catch (requestError) {
      console.error('删除股票自选失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : text.deleteWatchlistFailed);
    }
  }, [fetchWatchlist, text.deleteWatchlistFailed]);

  const quoteColumns: ColumnsType<StockQuote> = [
    {
      title: text.symbol,
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <strong>{record.name || record.symbol}</strong>
          <span className="stock-quote-code">{record.symbol}</span>
        </Space>
      )
    },
    {
      title: text.latestPrice,
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      render: value => formatPrice(value)
    },
    {
      title: text.change,
      dataIndex: 'changeAmount',
      key: 'changeAmount',
      align: 'right',
      render: (_, record) => <QuoteChange quote={record} />
    },
    {
      title: text.open,
      dataIndex: 'open',
      key: 'open',
      align: 'right',
      render: value => formatPrice(value)
    },
    {
      title: text.highLow,
      key: 'range',
      align: 'right',
      render: (_, record) => `${formatPrice(record.high)} / ${formatPrice(record.low)}`
    },
    {
      title: text.turnover,
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: value => formatAmount(value, text.amountUnit)
    },
    {
      title: text.quoteTime,
      dataIndex: 'tradeDateTime',
      key: 'tradeDateTime',
      render: (_, record) => {
        if (!record.available) {
          return <Tag color="warning">{record.message}</Tag>;
        }
        return (
          <Space direction="vertical" size={0}>
            <span>{record.tradeDateTime || '-'}</span>
            {record.stale ? <Tag color="orange">{record.staleReason || text.cachedQuote}</Tag> : null}
          </Space>
        );
      }
    },
    {
      title: text.action,
      key: 'action',
      fixed: 'right',
      width: 92,
      render: (_, record) => watchlistSymbolSet.has(record.symbol) ? (
        <Popconfirm title={text.deleteWatchlistTitle} okText={text.delete} cancelText={text.cancel} onConfirm={() => deleteWatchlist(record.symbol)}>
          <Button type="text" danger icon={<DeleteOutlined />} aria-label={text.deleteWatchlistAria} onClick={event => event.stopPropagation()} />
        </Popconfirm>
      ) : (
        <Tag>{text.queryResult}</Tag>
      )
    }
  ];

  const holdingColumns: ColumnsType<StockHoldingSummary> = [
    {
      title: text.holding,
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <strong>{record.name || record.symbol}</strong>
          <span className="stock-quote-code">{record.symbol}</span>
        </Space>
      )
    },
    {
      title: text.quantity,
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      render: value => formatQuantity(value)
    },
    {
      title: text.latestPrice,
      dataIndex: 'latestPrice',
      key: 'latestPrice',
      align: 'right',
      render: value => formatPrice(value)
    },
    {
      title: text.marketValue,
      dataIndex: 'marketValue',
      key: 'marketValue',
      align: 'right',
      render: value => formatMoney(value)
    },
    {
      title: text.costAmount,
      dataIndex: 'costAmount',
      key: 'costAmount',
      align: 'right',
      render: value => formatMoney(value)
    },
    {
      title: text.floatingPnl,
      key: 'floatingPnl',
      align: 'right',
      render: (_, record) => <PnlText value={record.floatingPnl} percent={record.floatingPnlPercent} />
    },
    {
      title: text.realized,
      dataIndex: 'realizedPnl',
      key: 'realizedPnl',
      align: 'right',
      render: value => <PnlText value={value} />
    },
    {
      title: text.dividend,
      dataIndex: 'dividendIncome',
      key: 'dividendIncome',
      align: 'right',
      render: value => formatMoney(value)
    },
    {
      title: text.todayPnl,
      dataIndex: 'todayPnl',
      key: 'todayPnl',
      align: 'right',
      render: value => <PnlText value={value} />
    },
    {
      title: text.quote,
      key: 'quoteState',
      render: (_, record) => {
        if (!record.quoteAvailable) {
          return <Tag color="warning">{text.noQuote}</Tag>;
        }
        return record.stale ? <Tag color="orange">{text.cachedQuote}</Tag> : <Tag color="green">{text.realtime}</Tag>;
      }
    }
  ];

  const alertColumns: ColumnsType<StockAlertHistory> = [
    {
      title: text.symbol,
      dataIndex: 'symbol',
      key: 'symbol',
      render: value => value ? (
        <Button type="link" onClick={() => navigate(`/investments/stocks/${value}`)}>
          {value}
        </Button>
      ) : '-'
    },
    {
      title: text.type,
      dataIndex: 'ruleType',
      key: 'ruleType',
      render: value => <Tag color="blue">{ruleTypeLabel(value, isEnglish)}</Tag>
    },
    {
      title: text.triggerValue,
      dataIndex: 'triggerValue',
      key: 'triggerValue',
      align: 'right',
      render: value => formatQuantity(value)
    },
    {
      title: text.time,
      dataIndex: 'triggeredAt',
      key: 'triggeredAt',
      render: value => formatTime(value)
    }
  ];

  return (
    <LifePageShell
      className="life-investment-page"
      eyebrow={pageMeta.eyebrow}
      title={pageMeta.title}
      actions={
        <Button type="primary" icon={<SyncOutlined />} onClick={() => navigate('/connections')}>
          {text.configureConnection}
        </Button>
      }
    >
      {isOverview ? (
        <MetricGrid gap={16} minColumnWidth={200}>
          <MetricCard title={text.portfolioValue} value={formatMoney(portfolioSummary?.totalMarketValue)} accent="#5856d6" />
          <MetricCard title={text.floatingPnl} value={formatSignedMoney(portfolioSummary?.floatingPnl)} suffix={formatPercentSuffix(portfolioSummary?.floatingPnlPercent)} accent={pnlAccent(portfolioSummary?.floatingPnl)} />
          <MetricCard title={text.realizedPnl} value={formatSignedMoney(portfolioSummary?.realizedPnl)} accent={pnlAccent(portfolioSummary?.realizedPnl)} />
          <MetricCard title={text.dividendIncome} value={formatMoney(portfolioSummary?.dividendIncome)} accent="#ff9500" />
          <MetricCard title={text.todayPnl} value={formatSignedMoney(portfolioSummary?.todayPnl)} accent={pnlAccent(portfolioSummary?.todayPnl)} />
          <MetricCard title={text.holdingCount} value={portfolioSummary?.holdingCount || 0} suffix={text.holdingUnit} accent="#0071e3" />
        </MetricGrid>
      ) : null}
      {error ? <Alert type="error" showIcon message={error} className="stock-market-alert" /> : null}

      {isOverview ? <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>{text.portfolioTitle}</h2>
            <p>{text.portfolioDescription}</p>
          </div>
          <div className="stock-market-actions">
            <Space wrap>
              <Tag color="blue">{text.calculatedAt} {portfolioCalculatedAt}</Tag>
              <Button icon={<SyncOutlined spin={portfolioLoading || dashboardLoading} />} loading={portfolioLoading || dashboardLoading} onClick={() => {
                fetchPortfolioSummary();
                fetchDashboardInsights();
              }}>
                {text.refreshOverview}
              </Button>
            </Space>
          </div>
        </div>
        <Table
          rowKey={record => record.positionId || record.symbol}
          columns={holdingColumns}
          dataSource={portfolioSummary?.holdings || []}
          loading={portfolioLoading}
          pagination={false}
          locale={{ emptyText: text.emptyHoldings }}
          scroll={{ x: 1140 }}
          rowClassName="stock-quote-row"
          onRow={record => ({
            onClick: () => navigate(`/investments/stocks/${record.symbol}`)
          })}
        />
      </Card> : null}

      {isOverview ? <section className="life-section-grid life-section-grid-three">
        <Card className="life-panel-card stock-dashboard-widget">
          <div className="life-panel-title-row">
            <h2>{text.analysisSummary}</h2>
            <Button type="link" icon={<PieChartOutlined />} onClick={() => navigate('/investments/analysis')}>
              {text.analysisPage}
            </Button>
          </div>
          <MetricGrid gap={12} minColumnWidth={140}>
            <MetricCard title={text.concentration} value={formatPercentValue(analysisSummary?.concentrationPercent)} accent="#5856d6" />
            <MetricCard title={text.concentrationSymbol} value={analysisSummary?.concentrationSymbol || '-'} accent="#0071e3" valueStyle={{ fontSize: 18 }} />
          </MetricGrid>
          <AnalysisList title={text.topGainers} items={analysisSummary?.topGainers} navigate={navigate} emptyText={isEnglish ? `No ${text.topGainers} data.` : `暂无${text.topGainers}数据。`} />
          <AnalysisList title={text.drawdownRisk} items={analysisSummary?.drawdown} navigate={navigate} emptyText={isEnglish ? `No ${text.drawdownRisk} data.` : `暂无${text.drawdownRisk}数据。`} />
        </Card>

        <Card className="life-panel-card stock-dashboard-widget">
          <div className="life-panel-title-row">
            <h2>{text.recentAlerts}</h2>
            <Button type="link" icon={<BarChartOutlined />} onClick={() => navigate('/investments/alerts')}>
              {text.alertsPage}
            </Button>
          </div>
          <Table
            rowKey={record => record.id || `${record.ruleId}-${record.triggeredAt}`}
            columns={alertColumns}
            dataSource={alertHistories}
            loading={dashboardLoading}
            pagination={false}
            size="small"
            locale={{ emptyText: text.emptyAlertHistory }}
            rowClassName="stock-quote-row"
          />
        </Card>

        <Card className="life-panel-card stock-dashboard-widget">
          <div className="life-panel-title-row">
            <h2>{text.providerHealth}</h2>
            <Button type="link" icon={<LineChartOutlined />} onClick={() => navigate('/investments/providers')}>
              {text.dataSources}
            </Button>
          </div>
          <div className="stock-provider-health-list">
            {providerHealth.length > 0 ? providerHealth.map(provider => (
              <button
                key={`${provider.provider}-${provider.fallback ? 'fallback' : 'primary'}`}
                type="button"
                className="stock-provider-health-row"
                onClick={() => navigate('/investments/providers')}
              >
                <span>
                  <strong>{provider.provider || '-'}</strong>
                  <small>{providerCategoryLabel(provider.category, isEnglish)} · {provider.active ? text.activeProvider : provider.fallback ? text.fallbackProvider : text.registeredProvider}</small>
                </span>
                <Tag color={provider.status === 'UP' || provider.registered ? 'green' : 'orange'}>
                  {provider.status || (provider.registered ? 'READY' : 'UNKNOWN')}
                </Tag>
              </button>
            )) : (
              <div className="stock-empty-dashboard">{dashboardLoading ? text.providerLoading : text.emptyProviders}</div>
            )}
          </div>
        </Card>
      </section> : null}

      {(isOverview || isWatchlist || isMarket) ? <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>{isMarket ? text.marketQuery : text.watchlistQuotes}</h2>
            <p>{isMarket ? text.marketDescription : text.watchlistDescription}</p>
          </div>
          <div className="stock-market-actions">
            <Space.Compact className="stock-symbol-search">
              <Input
                value={symbolInput}
                onChange={event => setSymbolInput(event.target.value)}
                onPressEnter={addWatchlist}
                placeholder="600519, 000001, sh000001"
                prefix={<SearchOutlined />}
              />
              <Button type="primary" icon={<PlusOutlined />} loading={addLoading} onClick={addWatchlist}>
                {text.addWatchlist}
              </Button>
            </Space.Compact>
            <Space wrap>
              <Button icon={<SearchOutlined />} disabled={symbols.length === 0} onClick={() => fetchQuotes(symbols)}>
                {text.quickQuery}
              </Button>
              <Button icon={<SyncOutlined spin={loading || watchlistLoading} />} loading={loading || watchlistLoading} onClick={() => fetchQuotes(watchlistSymbols)}>
                {text.refreshWatchlist}
              </Button>
            </Space>
          </div>
        </div>
        <Table
          rowKey={record => record.symbol}
          columns={quoteColumns}
          dataSource={quotes}
          loading={loading || watchlistLoading}
          pagination={false}
          locale={{ emptyText: text.emptyWatchlist }}
          scroll={{ x: 920 }}
          rowClassName="stock-quote-row"
          onRow={record => ({
            onClick: () => navigate(`/investments/stocks/${record.symbol}`)
          })}
        />
      </Card> : null}

    </LifePageShell>
  );
};

type StockInvestmentView = 'overview' | 'watchlist' | 'market';

type StockViewText = {
  overviewEyebrow: string;
  overviewTitle: string;
  watchlistEyebrow: string;
  watchlistTitle: string;
  marketEyebrow: string;
  marketTitle: string;
};

const stockViewMeta: Record<StockInvestmentView, (text: StockViewText) => { eyebrow: string; title: string }> = {
  overview: text => ({
    eyebrow: text.overviewEyebrow,
    title: text.overviewTitle
  }),
  watchlist: text => ({
    eyebrow: text.watchlistEyebrow,
    title: text.watchlistTitle
  }),
  market: text => ({
    eyebrow: text.marketEyebrow,
    title: text.marketTitle
  })
};

const formatPrice = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return value.toFixed(2);
};

const formatAmount = (value?: number, unit = '亿') => {
  if (typeof value !== 'number' || value <= 0) {
    return '-';
  }
  return `${(value / 100000000).toFixed(2)} ${unit}`;
};

const formatMoney = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatSignedMoney = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatMoney(value)}`;
};

const formatQuantity = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 4
  });
};

const formatPercentSuffix = (value?: number) => {
  if (typeof value !== 'number') {
    return '';
  }
  const sign = value > 0 ? '+' : '';
  return ` / ${sign}${value.toFixed(2)}%`;
};

const formatPercentValue = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return `${value.toFixed(2)}%`;
};

const formatTime = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return new Date(value).toLocaleString();
};

const pnlAccent = (value?: number) => {
  if (typeof value !== 'number') {
    return '#0071e3';
  }
  if (value > 0) {
    return '#f5222d';
  }
  if (value < 0) {
    return '#16a34a';
  }
  return '#0071e3';
};

const PnlText = ({ value, percent }: { value?: number; percent?: number }) => {
  if (typeof value !== 'number') {
    return <span>-</span>;
  }
  return (
    <span style={{ color: pnlAccent(value), fontWeight: 700 }}>
      {formatSignedMoney(value)}{formatPercentSuffix(percent)}
    </span>
  );
};

const ruleTypeLabel = (value?: string, isEnglish = false) => {
  const labels: Record<string, string> = {
    PRICE: isEnglish ? 'Price' : '价格',
    PERCENT_CHANGE: isEnglish ? 'Percent Change' : '涨跌幅',
    VOLUME_ABNORMAL: isEnglish ? 'Volume Anomaly' : '成交量异常'
  };
  return value ? labels[value] || value : '-';
};

const providerCategoryLabel = (value?: string, isEnglish = false) => {
  if (value === 'kline') {
    return isEnglish ? 'K-Line' : 'K线';
  }
  if (value === 'quote') {
    return isEnglish ? 'Quote' : '行情';
  }
  return value || '-';
};

const AnalysisList = ({ title, items, navigate, emptyText }: { title: string; items?: StockAnalysisItem[]; navigate: (path: string) => void; emptyText: string }) => (
  <div className="stock-analysis-mini-list">
    <h3>{title}</h3>
    {(items || []).slice(0, 4).map(item => (
      <button key={`${title}-${item.symbol}`} type="button" onClick={() => item.symbol ? navigate(`/investments/stocks/${item.symbol}`) : undefined}>
        <span>
          <strong>{item.name || item.symbol || '-'}</strong>
          <small>{item.symbol || '-'}</small>
        </span>
        <span>{formatAnalysisValue(item)}</span>
      </button>
    ))}
    {(items || []).length === 0 ? <div className="stock-empty-dashboard">{emptyText}</div> : null}
  </div>
);

const formatAnalysisValue = (item: StockAnalysisItem) => {
  if (typeof item.percent === 'number') {
    return `${item.percent.toFixed(2)}%`;
  }
  if (typeof item.value === 'number') {
    return item.value.toFixed(2);
  }
  return item.message || '-';
};

const QuoteChange = ({ quote }: { quote: StockQuote }) => {
  if (!quote.available || typeof quote.changeAmount !== 'number' || typeof quote.changePercent !== 'number') {
    return <span>-</span>;
  }
  const up = quote.changeAmount > 0;
  const down = quote.changeAmount < 0;
  const color = up ? '#f5222d' : down ? '#16a34a' : 'var(--app-text-muted)';
  const sign = up ? '+' : '';
  return (
    <span style={{ color, fontWeight: 700 }}>
      {sign}{quote.changeAmount.toFixed(2)} / {sign}{quote.changePercent.toFixed(2)}%
    </span>
  );
};

export default LifeInvestmentPage;
