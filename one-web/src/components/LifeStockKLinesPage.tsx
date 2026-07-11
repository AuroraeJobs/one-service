import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Input, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { LineChartOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import { stockApi, type StockKLine } from '../services/api';
import { useAppPreferences } from '../contexts/AppPreferencesContext';

const LifeStockKLinesPage = () => {
  const { isEnglish } = useAppPreferences();
  const text = {
    daily: isEnglish ? 'Daily' : '日线',
    weekly: isEnglish ? 'Weekly' : '周线',
    monthly: isEnglish ? 'Monthly' : '月线',
    enterSymbol: isEnglish ? 'Please enter stock symbol' : '请输入股票代码',
    loadFailed: isEnglish ? 'Failed to load stock K-lines' : '获取股票K线失败',
    tradeDate: isEnglish ? 'Trade Date' : '交易日',
    symbol: isEnglish ? 'Symbol' : '标的',
    open: isEnglish ? 'Open' : '开盘',
    close: isEnglish ? 'Close' : '收盘',
    high: isEnglish ? 'High' : '最高',
    low: isEnglish ? 'Low' : '最低',
    changePercent: isEnglish ? 'Change %' : '涨跌幅',
    volume: isEnglish ? 'Volume' : '成交量',
    source: isEnglish ? 'Source' : '来源',
    eyebrow: isEnglish ? 'Stock K-Lines' : '股票K线',
    title: isEnglish ? 'Query historical market data stored in MongoDB and inspect the data foundation used by charts and analysis.' : '查询已沉淀到 MongoDB 的历史行情，检查图表和分析使用的数据基础。',
    openStock: isEnglish ? 'Open Stock' : '打开个股',
    panelTitle: isEnglish ? 'K-Line Data' : 'K线数据',
    description: isEnglish ? 'This page displays standardized K-lines returned by internal /stock/* APIs and does not depend on any specific third-party data source.' : '这里展示内部 `/stock/*` API 返回的标准化 K线，页面不依赖任何具体第三方数据源。',
    startDate: isEnglish ? 'Start date' : '开始日期',
    endDate: isEnglish ? 'End date' : '结束日期',
    query: isEnglish ? 'Query' : '查询',
    empty: isEnglish ? 'No K-line data yet. Import it on the Sync page or wait for provider sync.' : '暂无K线数据，可先到同步页导入或等待 provider 同步接入。'
  };
  const periodOptions = [
    { label: text.daily, value: 'daily' },
    { label: text.weekly, value: 'weekly' },
    { label: text.monthly, value: 'monthly' }
  ];
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [symbol, setSymbol] = useState(searchParams.get('symbol') || '600519');
  const [period, setPeriod] = useState(searchParams.get('period') || 'daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [kLines, setKLines] = useState<StockKLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const normalizedSymbol = useMemo(() => symbol.trim(), [symbol]);

  const loadKLines = useCallback(async () => {
    if (!normalizedSymbol) {
      setError(text.enterSymbol);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const data = await stockApi.klines(normalizedSymbol, {
        period,
        startDate: startDate.trim() || undefined,
        endDate: endDate.trim() || undefined
      });
      setKLines(data);
    } catch (requestError) {
      console.error('获取股票K线失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : text.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [endDate, normalizedSymbol, period, startDate, text.enterSymbol, text.loadFailed]);

  useEffect(() => {
    if (searchParams.get('symbol')) {
      loadKLines();
    }
  }, [loadKLines, searchParams]);

  const columns: ColumnsType<StockKLine> = [
    {
      title: text.tradeDate,
      dataIndex: 'tradeDate',
      key: 'tradeDate',
      fixed: 'left',
      width: 120
    },
    {
      title: text.symbol,
      dataIndex: 'symbol',
      key: 'symbol',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <strong>{record.symbol}</strong>
          <span className="stock-quote-code">{record.period || period}</span>
        </Space>
      )
    },
    {
      title: text.open,
      dataIndex: 'open',
      key: 'open',
      align: 'right',
      render: value => formatNumber(value)
    },
    {
      title: text.close,
      dataIndex: 'close',
      key: 'close',
      align: 'right',
      render: value => formatNumber(value)
    },
    {
      title: text.high,
      dataIndex: 'high',
      key: 'high',
      align: 'right',
      render: value => formatNumber(value)
    },
    {
      title: text.low,
      dataIndex: 'low',
      key: 'low',
      align: 'right',
      render: value => formatNumber(value)
    },
    {
      title: text.changePercent,
      dataIndex: 'changePercent',
      key: 'changePercent',
      align: 'right',
      render: value => formatPercent(value)
    },
    {
      title: text.volume,
      dataIndex: 'volume',
      key: 'volume',
      align: 'right',
      render: value => formatLargeNumber(value)
    },
    {
      title: text.source,
      dataIndex: 'source',
      key: 'source',
      render: value => value ? <Tag color="purple">{value}</Tag> : '-'
    }
  ];

  return (
    <LifePageShell
      className="life-investment-page"
      eyebrow={text.eyebrow}
      title={text.title}
      actions={
        <Button type="primary" icon={<LineChartOutlined />} disabled={!normalizedSymbol} onClick={() => navigate(`/investments/stocks/${normalizedSymbol}`)}>
          {text.openStock}
        </Button>
      }
    >
      {error ? <Alert type="error" showIcon message={error} className="stock-market-alert" /> : null}

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>{text.panelTitle}</h2>
            <p>{text.description}</p>
          </div>
          <div className="stock-market-actions">
            <Space wrap>
              <Input
                value={symbol}
                onChange={event => setSymbol(event.target.value)}
                onPressEnter={loadKLines}
                placeholder="600519"
                prefix={<SearchOutlined />}
                style={{ width: 160 }}
              />
              <Select value={period} options={periodOptions} onChange={setPeriod} style={{ width: 96 }} />
              <Input value={startDate} onChange={event => setStartDate(event.target.value)} placeholder={text.startDate} style={{ width: 120 }} />
              <Input value={endDate} onChange={event => setEndDate(event.target.value)} placeholder={text.endDate} style={{ width: 120 }} />
              <Button icon={<ReloadOutlined spin={loading} />} loading={loading} onClick={loadKLines}>
                {text.query}
              </Button>
            </Space>
          </div>
        </div>
        <Table
          rowKey={record => record.id || `${record.symbol}-${record.period}-${record.tradeDate}`}
          columns={columns}
          dataSource={kLines}
          loading={loading}
          pagination={{ pageSize: 12, showSizeChanger: false }}
          locale={{ emptyText: text.empty }}
          scroll={{ x: 980 }}
          rowClassName="stock-quote-row"
        />
      </Card>
    </LifePageShell>
  );
};

const formatNumber = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return value.toFixed(2);
};

const formatPercent = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const formatLargeNumber = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return value.toLocaleString();
};

export default LifeStockKLinesPage;
