import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Input, Select, Space, Statistic, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ApiOutlined, ExperimentOutlined, ReloadOutlined } from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import MetricCard from './MetricCard';
import MetricGrid from './MetricGrid';
import { stockApi, type StockProviderHealth, type StockProviderProbeResult } from '../services/api';
import { useAppPreferences } from '../contexts/AppPreferencesContext';

const LifeStockProvidersPage = () => {
  const { isEnglish } = useAppPreferences();
  const text = {
    loadFailed: isEnglish ? 'Failed to load stock provider status' : '获取股票数据源状态失败',
    latestProbeFailed: isEnglish ? 'Failed to load latest stock provider probe' : '获取最近股票数据源探测失败',
    probeFailed: isEnglish ? 'Failed to probe stock provider' : '探测股票数据源失败',
    probeAllFailed: isEnglish ? 'Failed to probe all stock providers' : '探测全部股票数据源失败',
    type: isEnglish ? 'Type' : '类型',
    role: isEnglish ? 'Role' : '角色',
    registration: isEnglish ? 'Registration' : '注册状态',
    registered: isEnglish ? 'Registered' : '已注册',
    missing: isEnglish ? 'Missing' : '缺失',
    status: isEnglish ? 'Status' : '状态',
    checkedAt: isEnglish ? 'Checked At' : '检查时间',
    quoteProvider: isEnglish ? 'Quote Provider' : '行情 Provider',
    klineProvider: isEnglish ? 'K-Line Provider' : 'K线 Provider',
    unit: isEnglish ? '' : '个',
    eyebrow: isEnglish ? 'Stock Providers' : '股票数据源',
    title: isEnglish ? 'View market provider registration, primary/fallback roles, and health-check time.' : '查看行情 Provider 的注册状态、主备关系和健康检查时间。',
    refreshStatus: isEnglish ? 'Refresh Status' : '刷新状态',
    probeTitle: isEnglish ? 'Provider Probe' : 'Provider 探测',
    probeDescription: isEnglish ? 'Fetch samples through the internal Provider Router and return standardized probe results. The page still does not know any third-party protocol.' : '通过内部 Provider Router 拉取样本，返回标准化探测结果；页面仍不感知具体第三方协议。',
    quote: isEnglish ? 'Quote' : '行情',
    kline: isEnglish ? 'K-Line' : 'K线',
    samplePlaceholder: isEnglish ? 'Sample symbol, optional' : '样本代码，可留空',
    probe: isEnglish ? 'Probe' : '探测',
    probeAll: isEnglish ? 'Probe All' : '全部探测',
    probeCount: isEnglish ? 'Probe Count' : '探测数量',
    availableCount: isEnglish ? 'Available' : '可用数量',
    abnormalCount: isEnglish ? 'Abnormal' : '异常数量',
    latestDuration: isEnglish ? 'Latest Duration' : '最近耗时',
    itemUnit: isEnglish ? 'items' : '项',
    latestProbe: isEnglish ? 'Latest Probe' : '最近探测',
    loading: isEnglish ? 'Loading' : '加载中',
    providerStatus: isEnglish ? 'Provider Status' : 'Provider 状态',
    statusDescription: isEnglish ? 'Provider switching is controlled by backend configuration and Provider Router. The frontend only reads internal status APIs and does not depend on third-party market protocols.' : '数据源切换由后端配置和 Provider Router 控制；前端只读取内部状态接口，不依赖任何第三方行情协议。',
    emptyStatus: isEnglish ? 'No provider status.' : '暂无 Provider 状态。',
    sampleSymbol: isEnglish ? 'Sample Symbol' : '样本代码',
    sampleCount: isEnglish ? 'Samples' : '样本数',
    duration: isEnglish ? 'Duration' : '耗时',
    message: isEnglish ? 'Message' : '说明',
    available: isEnglish ? 'Available' : '可用',
    attention: isEnglish ? 'Needs attention' : '需关注'
  };
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
      setError(requestError instanceof Error ? requestError.message : text.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [text.loadFailed]);

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
      setProbeError(requestError instanceof Error ? requestError.message : text.latestProbeFailed);
    } finally {
      setLatestLoading(false);
    }
  }, [text.latestProbeFailed]);

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
      setProbeError(requestError instanceof Error ? requestError.message : text.probeFailed);
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
      setProbeError(requestError instanceof Error ? requestError.message : text.probeAllFailed);
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
      title: text.type,
      dataIndex: 'category',
      key: 'category',
      render: value => <Tag color={value === 'kline' ? 'purple' : 'blue'}>{providerCategoryLabel(value, isEnglish)}</Tag>
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
      title: text.role,
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
      title: text.registration,
      dataIndex: 'registered',
      key: 'registered',
      render: value => value ? <Tag color="green">{text.registered}</Tag> : <Tag color="red">{text.missing}</Tag>
    },
    {
      title: text.status,
      dataIndex: 'status',
      key: 'status',
      render: value => <Tag color={value === 'REGISTERED' ? 'green' : 'orange'}>{value || '-'}</Tag>
    },
    {
      title: text.checkedAt,
      dataIndex: 'checkedAt',
      key: 'checkedAt',
      render: value => formatTime(value)
    }
  ];

  return (
    <LifePageShell
      className="life-investment-page"
      eyebrow={text.eyebrow}
      title={text.title}
      actions={
        <Button type="primary" icon={<ReloadOutlined spin={loading} />} loading={loading} onClick={loadProviders}>
          {text.refreshStatus}
        </Button>
      }
    >
      {error ? <Alert type="error" showIcon message={error} className="stock-market-alert" /> : null}
      {probeError ? <Alert type="error" showIcon message={probeError} className="stock-market-alert" /> : null}

      <MetricGrid gap={16} minColumnWidth={200}>
        <MetricCard title={text.quoteProvider} value={activeQuoteProvider} accent="#5856d6" />
        <MetricCard title={text.klineProvider} value={activeKLineProvider} accent="#0071e3" />
        <MetricCard title={text.registered} value={registeredCount} suffix={text.unit} accent="#34c759" />
        <MetricCard title={text.missing} value={missingCount} suffix={text.unit} accent={missingCount > 0 ? '#f5222d' : '#0071e3'} />
        <MetricCard title={text.checkedAt} value={checkedAt} accent="#ff9500" valueStyle={{ fontSize: 18 }} />
      </MetricGrid>

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>{text.probeTitle}</h2>
            <p>{text.probeDescription}</p>
          </div>
          <Space wrap>
            <Select
              value={probeCategory}
              options={[
                { label: text.quote, value: 'quote' },
                { label: text.kline, value: 'kline' }
              ]}
              style={{ width: 120 }}
              loading={latestLoading}
              onChange={setProbeCategory}
            />
            <Input
              value={probeSymbol}
              placeholder={text.samplePlaceholder}
              allowClear
              style={{ width: 180 }}
              onChange={event => setProbeSymbol(event.target.value)}
            />
            <Button type="primary" icon={<ExperimentOutlined />} loading={probing} onClick={probeProvider}>
              {text.probe}
            </Button>
            <Button icon={<ExperimentOutlined />} loading={probing} onClick={probeAllProviders}>
              {text.probeAll}
            </Button>
          </Space>
        </div>
        {probeResults.length > 0 ? (
          <MetricGrid gap={16} minColumnWidth={180}>
            <MetricCard title={text.probeCount} value={probeResults.length} suffix={text.itemUnit} accent="#5856d6" />
            <MetricCard title={text.availableCount} value={probeResults.filter(item => item.available).length} suffix={text.itemUnit} accent="#34c759" />
            <MetricCard title={text.abnormalCount} value={probeResults.filter(item => !item.success || !item.available).length} suffix={text.itemUnit} accent="#f5222d" />
            <MetricCard title={text.latestDuration} value={probeResult?.durationMs ?? 0} suffix="ms" accent="#00c7be" />
          </MetricGrid>
        ) : null}
        {probeResults.length > 0 ? (
          <Table
            rowKey={record => `${record.category || 'unknown'}-${record.symbol || 'default'}`}
            columns={buildProbeColumns(text, isEnglish)}
            dataSource={probeResults}
            pagination={false}
            scroll={{ x: 760 }}
            rowClassName="stock-quote-row"
          />
        ) : (
          <Statistic title={text.latestProbe} value={latestLoading ? text.loading : '-'} />
        )}
      </Card>

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>{text.providerStatus}</h2>
            <p>{text.statusDescription}</p>
          </div>
        </div>
        <Table
          rowKey={record => record.provider || 'unknown'}
          columns={columns}
          dataSource={providers}
          loading={loading}
          pagination={false}
          locale={{ emptyText: text.emptyStatus }}
          scroll={{ x: 860 }}
          rowClassName="stock-quote-row"
        />
      </Card>
    </LifePageShell>
  );
};

type ProviderPageText = {
  type: string;
  sampleSymbol: string;
  status: string;
  available: string;
  attention: string;
  sampleCount: string;
  duration: string;
  checkedAt: string;
  message: string;
};

const buildProbeColumns = (text: ProviderPageText, isEnglish: boolean): ColumnsType<StockProviderProbeResult> => [
  {
    title: text.type,
    dataIndex: 'category',
    key: 'category',
    render: value => <Tag color={value === 'kline' ? 'purple' : 'blue'}>{providerCategoryLabel(value, isEnglish)}</Tag>
  },
  {
    title: text.sampleSymbol,
    dataIndex: 'symbol',
    key: 'symbol',
    render: value => value || '-'
  },
  {
    title: text.status,
    key: 'status',
    render: (_, record) => (
      <Tag color={record.success && record.available ? 'green' : 'orange'}>
        {record.success && record.available ? text.available : text.attention}
      </Tag>
    )
  },
  {
    title: text.sampleCount,
    dataIndex: 'sampleCount',
    key: 'sampleCount',
    render: value => value ?? 0
  },
  {
    title: text.duration,
    dataIndex: 'durationMs',
    key: 'durationMs',
    render: value => `${value ?? 0} ms`
  },
  {
    title: text.checkedAt,
    dataIndex: 'checkedAt',
    key: 'checkedAt',
    render: value => formatTime(value)
  },
  {
    title: text.message,
    dataIndex: 'message',
    key: 'message',
    render: value => value || '-'
  }
];

const providerCategoryLabel = (value?: string, isEnglish = false) => {
  if (value === 'kline') {
    return isEnglish ? 'K-Line' : 'K线';
  }
  if (value === 'quote') {
    return isEnglish ? 'Quote' : '行情';
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
