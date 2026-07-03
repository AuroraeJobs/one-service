import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Input, Select, Space, Statistic, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ApiOutlined, ExperimentOutlined, ReloadOutlined } from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import MetricCard from './MetricCard';
import MetricGrid from './MetricGrid';
import { stockApi, type StockProviderHealth, type StockProviderProbeResult } from '../services/api';

const LifeStockProvidersPage = () => {
  const [providers, setProviders] = useState<StockProviderHealth[]>([]);
  const [loading, setLoading] = useState(false);
  const [probing, setProbing] = useState(false);
  const [latestLoading, setLatestLoading] = useState(false);
  const [probeCategory, setProbeCategory] = useState('quote');
  const [probeSymbol, setProbeSymbol] = useState('');
  const [probeResult, setProbeResult] = useState<StockProviderProbeResult>();
  const [probeResults, setProbeResults] = useState<StockProviderProbeResult[]>([]);
  const [error, setError] = useState<string>();
  const [probeError, setProbeError] = useState<string>();

  const loadProviders = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const data = await stockApi.providerHealth();
      setProviders(data);
    } catch (requestError) {
      console.error('获取股票数据源状态失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '获取股票数据源状态失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const loadLatestProbe = useCallback(async (category: string) => {
    setLatestLoading(true);
    setProbeError(undefined);
    try {
      const result = await stockApi.latestProviderProbe(category);
      setProbeResult(result || undefined);
      setProbeResults(result ? [result] : []);
    } catch (requestError) {
      console.error('获取最近股票数据源探测失败:', requestError);
      setProbeError(requestError instanceof Error ? requestError.message : '获取最近股票数据源探测失败');
    } finally {
      setLatestLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLatestProbe(probeCategory);
  }, [loadLatestProbe, probeCategory]);

  const probeProvider = async () => {
    setProbing(true);
    setProbeError(undefined);
    try {
      const result = await stockApi.providerProbe({
        category: probeCategory,
        symbol: probeSymbol.trim() || undefined
      });
      setProbeResult(result);
      setProbeResults([result]);
    } catch (requestError) {
      console.error('探测股票数据源失败:', requestError);
      setProbeError(requestError instanceof Error ? requestError.message : '探测股票数据源失败');
    } finally {
      setProbing(false);
    }
  };

  const probeAllProviders = async () => {
    setProbing(true);
    setProbeError(undefined);
    try {
      const results = await stockApi.providerProbeAll(probeSymbol.trim() || undefined);
      setProbeResults(results);
      setProbeResult(results.find(item => item.category === probeCategory) || results[0]);
    } catch (requestError) {
      console.error('探测全部股票数据源失败:', requestError);
      setProbeError(requestError instanceof Error ? requestError.message : '探测全部股票数据源失败');
    } finally {
      setProbing(false);
    }
  };

  const activeQuoteProvider = useMemo(() => providers.find(item => item.category === 'quote' && item.active)?.provider || '-', [providers]);
  const activeKLineProvider = useMemo(() => providers.find(item => item.category === 'kline' && item.active)?.provider || '-', [providers]);
  const registeredCount = useMemo(() => providers.filter(item => item.registered).length, [providers]);
  const missingCount = useMemo(() => providers.filter(item => !item.registered).length, [providers]);
  const checkedAt = useMemo(() => {
    const latest = providers.map(item => item.checkedAt).filter((value): value is number => typeof value === 'number').sort((a, b) => b - a)[0];
    return latest ? new Date(latest).toLocaleString() : '-';
  }, [providers]);

  const columns: ColumnsType<StockProviderHealth> = [
    {
      title: '类型',
      dataIndex: 'category',
      key: 'category',
      render: value => <Tag color={value === 'kline' ? 'purple' : 'blue'}>{providerCategoryLabel(value)}</Tag>
    },
    {
      title: 'Provider',
      dataIndex: 'provider',
      key: 'provider',
      render: value => (
        <Space>
          <ApiOutlined />
          <strong>{value || '-'}</strong>
        </Space>
      )
    },
    {
      title: '角色',
      key: 'role',
      render: (_, record) => (
        <Space wrap>
          {record.active ? <Tag color="blue">active</Tag> : null}
          {record.fallback ? <Tag color="purple">fallback</Tag> : null}
          {!record.active && !record.fallback ? <Tag>registered</Tag> : null}
        </Space>
      )
    },
    {
      title: '注册状态',
      dataIndex: 'registered',
      key: 'registered',
      render: value => value ? <Tag color="green">已注册</Tag> : <Tag color="red">缺失</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: value => <Tag color={value === 'REGISTERED' ? 'green' : 'orange'}>{value || '-'}</Tag>
    },
    {
      title: '检查时间',
      dataIndex: 'checkedAt',
      key: 'checkedAt',
      render: value => formatTime(value)
    }
  ];

  return (
    <LifePageShell
      className="life-investment-page"
      eyebrow="股票数据源"
      title="查看行情 Provider 的注册状态、主备关系和健康检查时间。"
      actions={
        <Button type="primary" icon={<ReloadOutlined spin={loading} />} loading={loading} onClick={loadProviders}>
          刷新状态
        </Button>
      }
    >
      {error ? <Alert type="error" showIcon message={error} className="stock-market-alert" /> : null}
      {probeError ? <Alert type="error" showIcon message={probeError} className="stock-market-alert" /> : null}

      <MetricGrid gap={16} minColumnWidth={200}>
        <MetricCard title="行情 Provider" value={activeQuoteProvider} accent="#5856d6" />
        <MetricCard title="K线 Provider" value={activeKLineProvider} accent="#0071e3" />
        <MetricCard title="已注册" value={registeredCount} suffix="个" accent="#34c759" />
        <MetricCard title="缺失" value={missingCount} suffix="个" accent={missingCount > 0 ? '#f5222d' : '#0071e3'} />
        <MetricCard title="检查时间" value={checkedAt} accent="#ff9500" valueStyle={{ fontSize: 18 }} />
      </MetricGrid>

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>Provider 探测</h2>
            <p>通过内部 Provider Router 拉取样本，返回标准化探测结果；页面仍不感知具体第三方协议。</p>
          </div>
          <Space wrap>
            <Select
              value={probeCategory}
              options={[
                { label: '行情', value: 'quote' },
                { label: 'K线', value: 'kline' }
              ]}
              style={{ width: 120 }}
              loading={latestLoading}
              onChange={setProbeCategory}
            />
            <Input
              value={probeSymbol}
              placeholder="样本代码，可留空"
              allowClear
              style={{ width: 180 }}
              onChange={event => setProbeSymbol(event.target.value)}
            />
            <Button type="primary" icon={<ExperimentOutlined />} loading={probing} onClick={probeProvider}>
              探测
            </Button>
            <Button icon={<ExperimentOutlined />} loading={probing} onClick={probeAllProviders}>
              全部探测
            </Button>
          </Space>
        </div>
        {probeResults.length > 0 ? (
          <MetricGrid gap={16} minColumnWidth={180}>
            <MetricCard title="探测数量" value={probeResults.length} suffix="项" accent="#5856d6" />
            <MetricCard title="可用数量" value={probeResults.filter(item => item.available).length} suffix="项" accent="#34c759" />
            <MetricCard title="异常数量" value={probeResults.filter(item => !item.success || !item.available).length} suffix="项" accent="#f5222d" />
            <MetricCard title="最近耗时" value={probeResult?.durationMs ?? 0} suffix="ms" accent="#00c7be" />
          </MetricGrid>
        ) : null}
        {probeResults.length > 0 ? (
          <Table
            rowKey={record => `${record.category || 'unknown'}-${record.symbol || 'default'}`}
            columns={probeColumns}
            dataSource={probeResults}
            pagination={false}
            scroll={{ x: 760 }}
            rowClassName="stock-quote-row"
          />
        ) : (
          <Statistic title="最近探测" value={latestLoading ? '加载中' : '-'} />
        )}
      </Card>

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>Provider 状态</h2>
            <p>数据源切换由后端配置和 Provider Router 控制；前端只读取内部状态接口，不依赖任何第三方行情协议。</p>
          </div>
        </div>
        <Table
          rowKey={record => record.provider || 'unknown'}
          columns={columns}
          dataSource={providers}
          loading={loading}
          pagination={false}
          locale={{ emptyText: '暂无 Provider 状态。' }}
          scroll={{ x: 860 }}
          rowClassName="stock-quote-row"
        />
      </Card>
    </LifePageShell>
  );
};

const probeColumns: ColumnsType<StockProviderProbeResult> = [
  {
    title: '类型',
    dataIndex: 'category',
    key: 'category',
    render: value => <Tag color={value === 'kline' ? 'purple' : 'blue'}>{providerCategoryLabel(value)}</Tag>
  },
  {
    title: '样本代码',
    dataIndex: 'symbol',
    key: 'symbol',
    render: value => value || '-'
  },
  {
    title: '状态',
    key: 'status',
    render: (_, record) => (
      <Tag color={record.success && record.available ? 'green' : 'orange'}>
        {record.success && record.available ? '可用' : '需关注'}
      </Tag>
    )
  },
  {
    title: '样本数',
    dataIndex: 'sampleCount',
    key: 'sampleCount',
    render: value => value ?? 0
  },
  {
    title: '耗时',
    dataIndex: 'durationMs',
    key: 'durationMs',
    render: value => `${value ?? 0} ms`
  },
  {
    title: '检查时间',
    dataIndex: 'checkedAt',
    key: 'checkedAt',
    render: value => formatTime(value)
  },
  {
    title: '说明',
    dataIndex: 'message',
    key: 'message',
    render: value => value || '-'
  }
];

const providerCategoryLabel = (value?: string) => {
  if (value === 'kline') {
    return 'K线';
  }
  if (value === 'quote') {
    return '行情';
  }
  return value || '-';
};

const formatTime = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return new Date(value).toLocaleString();
};

export default LifeStockProvidersPage;
