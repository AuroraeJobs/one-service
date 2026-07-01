import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Input, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { BarChartOutlined, LineChartOutlined, PieChartOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import MetricCard from './MetricCard';
import MetricGrid from './MetricGrid';
import LifePageShell from './LifePageShell';
import { stockApi, type StockQuote } from '../services/api';

const DEFAULT_SYMBOLS = ['sh000001', 'sz399001', 'sz399006'];

const investmentTracks = [
  {
    title: '账户持仓',
    description: '券商、基金、现金类资产进入统一资产表。',
    icon: <PieChartOutlined />,
    accent: '#5856d6'
  },
  {
    title: '行情数据',
    description: '股票、指数、基金净值统一沉淀为时间序列。',
    icon: <LineChartOutlined />,
    accent: '#0071e3'
  },
  {
    title: '收益归因',
    description: '区分市场收益、交易收益、分红和汇率变化。',
    icon: <BarChartOutlined />,
    accent: '#34c759'
  }
];

const LifeInvestmentPage = () => {
  const navigate = useNavigate();
  const [symbolInput, setSymbolInput] = useState('600519, 000001, 300750');
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const symbols = useMemo(() => {
    const parsed = symbolInput
      .split(/[\s,，;；]+/)
      .map(item => item.trim())
      .filter(Boolean);
    return parsed.length > 0 ? parsed : DEFAULT_SYMBOLS;
  }, [symbolInput]);

  const latestFetchedAt = useMemo(() => {
    const fetchedAt = quotes.find(item => item.fetchedAt)?.fetchedAt;
    return fetchedAt ? new Date(fetchedAt).toLocaleString() : '尚未刷新';
  }, [quotes]);

  const availableQuotes = useMemo(() => quotes.filter(item => item.available), [quotes]);

  const totalMarketAmount = useMemo(() => {
    const amount = availableQuotes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return amount > 0 ? (amount / 100000000).toFixed(1) : '0';
  }, [availableQuotes]);

  const fetchQuotes = useCallback(async (nextSymbols: string[]) => {
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

  useEffect(() => {
    fetchQuotes(DEFAULT_SYMBOLS);
  }, [fetchQuotes]);

  const columns: ColumnsType<StockQuote> = [
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
      render: (_, record) => record.available ? record.tradeDateTime || '-' : <Tag color="warning">{record.message}</Tag>
    }
  ];

  return (
    <LifePageShell
      className="life-investment-page"
      eyebrow="投资资产"
      title="把账户、持仓、行情和收益归因整理成长期资产视图。"
      actions={
        <Button type="primary" icon={<SyncOutlined />} onClick={() => navigate('/connections')}>
          配置接入
        </Button>
      }
    >
      <MetricGrid gap={16} minColumnWidth={200}>
        <MetricCard title="行情源" value="Sina" accent="#5856d6" />
        <MetricCard title="实时标的" value={availableQuotes.length} suffix="个" accent="#0071e3" />
        <MetricCard title="成交额" value={totalMarketAmount} suffix="亿" accent="#ff9500" />
        <MetricCard title="刷新时间" value={latestFetchedAt} accent="#34c759" valueStyle={{ fontSize: 18 }} />
      </MetricGrid>

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>实时行情</h2>
            <p>输入 A 股代码或带市场前缀的代码，后端会对接第三方行情系统并返回结构化报价。</p>
          </div>
          <Space.Compact className="stock-symbol-search">
            <Input
              value={symbolInput}
              onChange={event => setSymbolInput(event.target.value)}
              onPressEnter={() => fetchQuotes(symbols)}
              placeholder="600519, 000001, sh000001"
              prefix={<SearchOutlined />}
            />
            <Button type="primary" icon={<SyncOutlined spin={loading} />} loading={loading} onClick={() => fetchQuotes(symbols)}>
              刷新
            </Button>
          </Space.Compact>
        </div>
        {error ? <Alert type="error" showIcon message={error} className="stock-market-alert" /> : null}
        <Table
          rowKey={record => record.symbol}
          columns={columns}
          dataSource={quotes}
          loading={loading}
          pagination={false}
          scroll={{ x: 820 }}
        />
      </Card>

      <section className="life-section-grid life-section-grid-three">
        {investmentTracks.map(track => (
          <Card key={track.title} className="life-module-card">
            <div className="life-module-card-head">
              <span className="life-module-icon" style={{ color: track.accent }}>
                {track.icon}
              </span>
            </div>
            <h2>{track.title}</h2>
            <p>{track.description}</p>
          </Card>
        ))}
      </section>

      <Card className="life-panel-card">
        <h2>建议的数据模型</h2>
        <div className="life-data-model-grid">
          {['账户 Account', '资产 Asset', '持仓 Position', '交易 Trade', '行情 Quote', '收益 Return'].map(item => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </Card>
    </LifePageShell>
  );
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
