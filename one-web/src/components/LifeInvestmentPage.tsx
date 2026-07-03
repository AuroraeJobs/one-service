import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Input, Popconfirm, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { BarChartOutlined, DeleteOutlined, LineChartOutlined, PieChartOutlined, PlusOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import MetricCard from './MetricCard';
import MetricGrid from './MetricGrid';
import LifePageShell from './LifePageShell';
import { stockApi, type StockAlertHistory, type StockAnalysisItem, type StockAnalysisSummary, type StockHoldingSummary, type StockPortfolioSummary, type StockProviderHealth, type StockQuote, type StockWatchlistItem } from '../services/api';

const LifeInvestmentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const pageMeta = stockViewMeta[activeView];

  const portfolioCalculatedAt = useMemo(() => {
    const calculatedAt = portfolioSummary?.calculatedAt;
    return calculatedAt ? new Date(calculatedAt).toLocaleString() : '尚未计算';
  }, [portfolioSummary?.calculatedAt]);

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
      setError(requestError instanceof Error ? requestError.message : '获取股票行情失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWatchlist = useCallback(async () => {
    setWatchlistLoading(true);
    setError(undefined);
    try {
      const data = await stockApi.watchlist();
      setWatchlist(data);
      await fetchQuotes(data.map(item => item.symbol).filter(Boolean));
    } catch (requestError) {
      console.error('获取股票自选失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '获取股票自选失败');
    } finally {
      setWatchlistLoading(false);
    }
  }, [fetchQuotes]);

  const fetchPortfolioSummary = useCallback(async () => {
    setPortfolioLoading(true);
    setError(undefined);
    try {
      const data = await stockApi.portfolioSummary();
      setPortfolioSummary(data);
    } catch (requestError) {
      console.error('获取股票组合汇总失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '获取股票组合汇总失败');
    } finally {
      setPortfolioLoading(false);
    }
  }, []);

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
      setError(requestError instanceof Error ? requestError.message : '获取股票总览洞察失败');
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
    fetchPortfolioSummary();
    fetchDashboardInsights();
  }, [fetchDashboardInsights, fetchPortfolioSummary, fetchWatchlist]);

  const addWatchlist = useCallback(async () => {
    if (symbols.length === 0) {
      setError('请输入股票代码');
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
      setError(requestError instanceof Error ? requestError.message : '添加股票自选失败');
    } finally {
      setAddLoading(false);
    }
  }, [fetchWatchlist, symbols]);

  const deleteWatchlist = useCallback(async (symbol: string) => {
    setError(undefined);
    try {
      await stockApi.deleteWatchlist(symbol);
      await fetchWatchlist();
    } catch (requestError) {
      console.error('删除股票自选失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '删除股票自选失败');
    }
  }, [fetchWatchlist]);

  const quoteColumns: ColumnsType<StockQuote> = [
    {
      title: '标的',
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
      title: '最新价',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      render: value => formatPrice(value)
    },
    {
      title: '涨跌',
      dataIndex: 'changeAmount',
      key: 'changeAmount',
      align: 'right',
      render: (_, record) => <QuoteChange quote={record} />
    },
    {
      title: '今开',
      dataIndex: 'open',
      key: 'open',
      align: 'right',
      render: value => formatPrice(value)
    },
    {
      title: '最高/最低',
      key: 'range',
      align: 'right',
      render: (_, record) => `${formatPrice(record.high)} / ${formatPrice(record.low)}`
    },
    {
      title: '成交额',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: value => formatAmount(value)
    },
    {
      title: '行情时间',
      dataIndex: 'tradeDateTime',
      key: 'tradeDateTime',
      render: (_, record) => {
        if (!record.available) {
          return <Tag color="warning">{record.message}</Tag>;
        }
        return (
          <Space direction="vertical" size={0}>
            <span>{record.tradeDateTime || '-'}</span>
            {record.stale ? <Tag color="orange">{record.staleReason || '缓存行情'}</Tag> : null}
          </Space>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 92,
      render: (_, record) => watchlistSymbolSet.has(record.symbol) ? (
        <Popconfirm title="删除自选股？" okText="删除" cancelText="取消" onConfirm={() => deleteWatchlist(record.symbol)}>
          <Button type="text" danger icon={<DeleteOutlined />} aria-label="删除自选股" onClick={event => event.stopPropagation()} />
        </Popconfirm>
      ) : (
        <Tag>查询结果</Tag>
      )
    }
  ];

  const holdingColumns: ColumnsType<StockHoldingSummary> = [
    {
      title: '持仓',
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
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      render: value => formatQuantity(value)
    },
    {
      title: '最新价',
      dataIndex: 'latestPrice',
      key: 'latestPrice',
      align: 'right',
      render: value => formatPrice(value)
    },
    {
      title: '市值',
      dataIndex: 'marketValue',
      key: 'marketValue',
      align: 'right',
      render: value => formatMoney(value)
    },
    {
      title: '持仓成本',
      dataIndex: 'costAmount',
      key: 'costAmount',
      align: 'right',
      render: value => formatMoney(value)
    },
    {
      title: '浮动盈亏',
      key: 'floatingPnl',
      align: 'right',
      render: (_, record) => <PnlText value={record.floatingPnl} percent={record.floatingPnlPercent} />
    },
    {
      title: '已实现',
      dataIndex: 'realizedPnl',
      key: 'realizedPnl',
      align: 'right',
      render: value => <PnlText value={value} />
    },
    {
      title: '分红',
      dataIndex: 'dividendIncome',
      key: 'dividendIncome',
      align: 'right',
      render: value => formatMoney(value)
    },
    {
      title: '今日盈亏',
      dataIndex: 'todayPnl',
      key: 'todayPnl',
      align: 'right',
      render: value => <PnlText value={value} />
    },
    {
      title: '行情',
      key: 'quoteState',
      render: (_, record) => {
        if (!record.quoteAvailable) {
          return <Tag color="warning">暂无行情</Tag>;
        }
        return record.stale ? <Tag color="orange">缓存行情</Tag> : <Tag color="green">实时</Tag>;
      }
    }
  ];

  const alertColumns: ColumnsType<StockAlertHistory> = [
    {
      title: '标的',
      dataIndex: 'symbol',
      key: 'symbol',
      render: value => value ? (
        <Button type="link" onClick={() => navigate(`/investments/stocks/${value}`)}>
          {value}
        </Button>
      ) : '-'
    },
    {
      title: '类型',
      dataIndex: 'ruleType',
      key: 'ruleType',
      render: value => <Tag color="blue">{ruleTypeLabel(value)}</Tag>
    },
    {
      title: '触发值',
      dataIndex: 'triggerValue',
      key: 'triggerValue',
      align: 'right',
      render: value => formatQuantity(value)
    },
    {
      title: '时间',
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
          配置接入
        </Button>
      }
    >
      {isOverview ? (
        <MetricGrid gap={16} minColumnWidth={200}>
          <MetricCard title="组合市值" value={formatMoney(portfolioSummary?.totalMarketValue)} accent="#5856d6" />
          <MetricCard title="浮动盈亏" value={formatSignedMoney(portfolioSummary?.floatingPnl)} suffix={formatPercentSuffix(portfolioSummary?.floatingPnlPercent)} accent={pnlAccent(portfolioSummary?.floatingPnl)} />
          <MetricCard title="已实现盈亏" value={formatSignedMoney(portfolioSummary?.realizedPnl)} accent={pnlAccent(portfolioSummary?.realizedPnl)} />
          <MetricCard title="分红收入" value={formatMoney(portfolioSummary?.dividendIncome)} accent="#ff9500" />
          <MetricCard title="今日盈亏" value={formatSignedMoney(portfolioSummary?.todayPnl)} accent={pnlAccent(portfolioSummary?.todayPnl)} />
          <MetricCard title="持仓数量" value={portfolioSummary?.holdingCount || 0} suffix="只" accent="#0071e3" />
        </MetricGrid>
      ) : null}
      {error ? <Alert type="error" showIcon message={error} className="stock-market-alert" /> : null}

      {isOverview ? <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>组合持仓</h2>
            <p>持仓保存在 MongoDB，市值和收益通过内部组合汇总接口计算；行情来源由后端服务抽象统一处理。</p>
          </div>
          <div className="stock-market-actions">
            <Space wrap>
              <Tag color="blue">计算时间 {portfolioCalculatedAt}</Tag>
              <Button icon={<SyncOutlined spin={portfolioLoading || dashboardLoading} />} loading={portfolioLoading || dashboardLoading} onClick={() => {
                fetchPortfolioSummary();
                fetchDashboardInsights();
              }}>
                刷新总览
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
          locale={{ emptyText: '暂无股票持仓，可先通过接口添加账户、持仓和交易记录。' }}
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
            <h2>分析摘要</h2>
            <Button type="link" icon={<PieChartOutlined />} onClick={() => navigate('/investments/analysis')}>
              分析页
            </Button>
          </div>
          <MetricGrid gap={12} minColumnWidth={140}>
            <MetricCard title="集中度" value={formatPercentValue(analysisSummary?.concentrationPercent)} accent="#5856d6" />
            <MetricCard title="集中标的" value={analysisSummary?.concentrationSymbol || '-'} accent="#0071e3" valueStyle={{ fontSize: 18 }} />
          </MetricGrid>
          <AnalysisList title="涨幅靠前" items={analysisSummary?.topGainers} navigate={navigate} />
          <AnalysisList title="回撤风险" items={analysisSummary?.drawdown} navigate={navigate} />
        </Card>

        <Card className="life-panel-card stock-dashboard-widget">
          <div className="life-panel-title-row">
            <h2>最近告警</h2>
            <Button type="link" icon={<BarChartOutlined />} onClick={() => navigate('/investments/alerts')}>
              告警页
            </Button>
          </div>
          <Table
            rowKey={record => record.id || `${record.ruleId}-${record.triggeredAt}`}
            columns={alertColumns}
            dataSource={alertHistories}
            loading={dashboardLoading}
            pagination={false}
            size="small"
            locale={{ emptyText: '暂无告警触发历史。' }}
            rowClassName="stock-quote-row"
          />
        </Card>

        <Card className="life-panel-card stock-dashboard-widget">
          <div className="life-panel-title-row">
            <h2>数据源健康</h2>
            <Button type="link" icon={<LineChartOutlined />} onClick={() => navigate('/investments/providers')}>
              数据源
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
                  <small>{provider.active ? '当前启用' : provider.fallback ? '备用' : '已注册'}</small>
                </span>
                <Tag color={provider.status === 'UP' || provider.registered ? 'green' : 'orange'}>
                  {provider.status || (provider.registered ? 'READY' : 'UNKNOWN')}
                </Tag>
              </button>
            )) : (
              <div className="stock-empty-dashboard">{dashboardLoading ? '数据源健康加载中...' : '暂无数据源健康信息。'}</div>
            )}
          </div>
        </Card>
      </section> : null}

      {(isOverview || isWatchlist || isMarket) ? <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>{isMarket ? '行情查询' : '自选行情'}</h2>
            <p>{isMarket ? '输入股票或指数代码进行临时查询，查询结果仍然来自内部行情接口。' : '自选股保存到 MongoDB，行情通过内部接口统一获取；可输入 A 股代码添加自选或临时查询。'}</p>
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
                加自选
              </Button>
            </Space.Compact>
            <Space wrap>
              <Button icon={<SearchOutlined />} disabled={symbols.length === 0} onClick={() => fetchQuotes(symbols)}>
                快速查询
              </Button>
              <Button icon={<SyncOutlined spin={loading || watchlistLoading} />} loading={loading || watchlistLoading} onClick={() => fetchQuotes(watchlistSymbols)}>
                刷新自选
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
          locale={{ emptyText: '暂无自选股，输入股票代码后添加自选。' }}
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

const stockViewMeta: Record<StockInvestmentView, { eyebrow: string; title: string }> = {
  overview: {
    eyebrow: '股票总览',
    title: '把账户、持仓、行情和收益归因整理成长期资产视图。'
  },
  watchlist: {
    eyebrow: '股票自选',
    title: '维护关注标的，快速查看内部行情服务返回的实时数据。'
  },
  market: {
    eyebrow: '行情查询',
    title: '独立查询股票、指数和后续扩展市场标的，不绑定具体第三方来源。'
  }
};

const formatPrice = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return value.toFixed(2);
};

const formatAmount = (value?: number) => {
  if (typeof value !== 'number' || value <= 0) {
    return '-';
  }
  return `${(value / 100000000).toFixed(2)} 亿`;
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

const ruleTypeLabel = (value?: string) => {
  const labels: Record<string, string> = {
    PRICE: '价格',
    PERCENT_CHANGE: '涨跌幅',
    VOLUME_ABNORMAL: '成交量异常'
  };
  return value ? labels[value] || value : '-';
};

const AnalysisList = ({ title, items, navigate }: { title: string; items?: StockAnalysisItem[]; navigate: (path: string) => void }) => (
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
    {(items || []).length === 0 ? <div className="stock-empty-dashboard">暂无{title}数据。</div> : null}
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
