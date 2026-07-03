import { useCallback, useMemo, useState } from 'react';
import { Alert, Button, Card, Input, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { LineChartOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import { stockApi, type StockKLine } from '../services/api';

const periodOptions = [
  { label: '日线', value: 'daily' },
  { label: '周线', value: 'weekly' },
  { label: '月线', value: 'monthly' }
];

const LifeStockKLinesPage = () => {
  const navigate = useNavigate();
  const [symbol, setSymbol] = useState('600519');
  const [period, setPeriod] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [kLines, setKLines] = useState<StockKLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const normalizedSymbol = useMemo(() => symbol.trim(), [symbol]);

  const loadKLines = useCallback(async () => {
    if (!normalizedSymbol) {
      setError('请输入股票代码');
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
      setError(requestError instanceof Error ? requestError.message : '获取股票K线失败');
    } finally {
      setLoading(false);
    }
  }, [endDate, normalizedSymbol, period, startDate]);

  const columns: ColumnsType<StockKLine> = [
    {
      title: '交易日',
      dataIndex: 'tradeDate',
      key: 'tradeDate',
      fixed: 'left',
      width: 120
    },
    {
      title: '标的',
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
      title: '开盘',
      dataIndex: 'open',
      key: 'open',
      align: 'right',
      render: value => formatNumber(value)
    },
    {
      title: '收盘',
      dataIndex: 'close',
      key: 'close',
      align: 'right',
      render: value => formatNumber(value)
    },
    {
      title: '最高',
      dataIndex: 'high',
      key: 'high',
      align: 'right',
      render: value => formatNumber(value)
    },
    {
      title: '最低',
      dataIndex: 'low',
      key: 'low',
      align: 'right',
      render: value => formatNumber(value)
    },
    {
      title: '涨跌幅',
      dataIndex: 'changePercent',
      key: 'changePercent',
      align: 'right',
      render: value => formatPercent(value)
    },
    {
      title: '成交量',
      dataIndex: 'volume',
      key: 'volume',
      align: 'right',
      render: value => formatLargeNumber(value)
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      render: value => value ? <Tag color="purple">{value}</Tag> : '-'
    }
  ];

  return (
    <LifePageShell
      className="life-investment-page"
      eyebrow="股票K线"
      title="查询已沉淀到 MongoDB 的历史行情，检查图表和分析使用的数据基础。"
      actions={
        <Button type="primary" icon={<LineChartOutlined />} disabled={!normalizedSymbol} onClick={() => navigate(`/investments/stocks/${normalizedSymbol}`)}>
          打开个股
        </Button>
      }
    >
      {error ? <Alert type="error" showIcon message={error} className="stock-market-alert" /> : null}

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>K线数据</h2>
            <p>这里展示内部 `/stock/*` API 返回的标准化 K线，页面不依赖任何具体第三方数据源。</p>
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
              <Input value={startDate} onChange={event => setStartDate(event.target.value)} placeholder="开始日期" style={{ width: 120 }} />
              <Input value={endDate} onChange={event => setEndDate(event.target.value)} placeholder="结束日期" style={{ width: 120 }} />
              <Button icon={<ReloadOutlined spin={loading} />} loading={loading} onClick={loadKLines}>
                查询
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
          locale={{ emptyText: '暂无K线数据，可先到同步页导入或等待 provider 同步接入。' }}
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
