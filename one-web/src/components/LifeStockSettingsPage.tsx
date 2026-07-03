import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Form, Input, InputNumber, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, SaveOutlined, SettingOutlined } from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import { stockApi, type StockPreference, type StockProviderConfig } from '../services/api';

interface SettingRow {
  key: string;
  name: string;
  value: string;
  status: string;
  note: string;
}

const kLinePeriodOptions = [
  { label: '日线', value: 'daily' },
  { label: '周线', value: 'weekly' },
  { label: '月线', value: 'monthly' }
];

const LifeStockSettingsPage = () => {
  const [form] = Form.useForm<StockPreference>();
  const [preference, setPreference] = useState<StockPreference>();
  const [providerConfig, setProviderConfig] = useState<StockProviderConfig>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  const loadPreference = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [data, config] = await Promise.all([
        stockApi.preferences(),
        stockApi.providerConfig()
      ]);
      setPreference(data);
      setProviderConfig(config);
      form.setFieldsValue(data);
    } catch (requestError) {
      console.error('获取股票偏好失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '获取股票偏好失败');
    } finally {
      setLoading(false);
    }
  }, [form]);

  const settingRows = useMemo(() => buildSettingRows(providerConfig), [providerConfig]);

  useEffect(() => {
    loadPreference();
  }, [loadPreference]);

  const savePreference = async () => {
    const values = await form.validateFields();
    setSaving(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const saved = await stockApi.savePreferences({
        ...preference,
        ...values,
        defaultAccountId: values.defaultAccountId?.trim() || undefined,
        defaultCurrency: values.defaultCurrency?.trim() || undefined,
        defaultKLinePeriod: values.defaultKLinePeriod?.trim() || undefined
      });
      setPreference(saved);
      form.setFieldsValue(saved);
      setSuccess('股票偏好已保存');
    } catch (requestError) {
      console.error('保存股票偏好失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '保存股票偏好失败');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<SettingRow> = [
    {
      title: '设置项',
      dataIndex: 'name',
      key: 'name',
      render: value => (
        <span>
          <SettingOutlined /> {value}
        </span>
      )
    },
    {
      title: '当前值',
      dataIndex: 'value',
      key: 'value',
      render: value => <code>{value}</code>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: value => <Tag color="blue">{value}</Tag>
    },
    {
      title: '说明',
      dataIndex: 'note',
      key: 'note'
    }
  ];

  return (
    <LifePageShell
      className="life-investment-page"
      eyebrow="股票设置"
      title="维护股票模块的用户偏好；数据源切换仍由后端 provider/router 管理。"
      actions={
        <Space wrap>
          <Button icon={<ReloadOutlined spin={loading} />} loading={loading} onClick={loadPreference}>
            重新加载
          </Button>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={savePreference}>
            保存偏好
          </Button>
        </Space>
      }
    >
      {error ? <Alert type="error" showIcon message={error} className="stock-market-alert" /> : null}
      {success ? <Alert type="success" showIcon message={success} className="stock-market-alert" /> : null}

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>用户偏好</h2>
            <p>这些值保存到 MongoDB，用于后续页面默认值；不会绕过 Redis TTL，也不会让前端直接依赖具体数据源。</p>
          </div>
          <Tag color="green">MongoDB 持久化</Tag>
        </div>
        <Form form={form} layout="vertical" className="stock-settings-form">
          <Form.Item name="defaultAccountId" label="默认账户 ID">
            <Input placeholder="可留空" />
          </Form.Item>
          <Form.Item name="defaultCurrency" label="默认币种">
            <Input placeholder="CNY" maxLength={8} />
          </Form.Item>
          <Form.Item name="defaultKLinePeriod" label="默认K线周期" rules={[{ required: true, message: '请选择默认K线周期' }]}>
            <Select options={kLinePeriodOptions} />
          </Form.Item>
          <Form.Item
            name="quoteRefreshIntervalSeconds"
            label="行情刷新间隔（秒）"
            rules={[{ required: true, message: '请输入行情刷新间隔' }]}
          >
            <InputNumber min={5} max={3600} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Card>

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>后端配置边界</h2>
            <p>下面是服务端配置边界，只读展示；Provider、缓存 TTL、定时任务仍由后端配置和服务抽象控制。</p>
          </div>
        </div>
        <Table
          rowKey={record => record.key}
          columns={columns}
          dataSource={settingRows}
          loading={loading}
          pagination={false}
          scroll={{ x: 760 }}
          rowClassName="stock-quote-row"
        />
      </Card>
    </LifePageShell>
  );
};

const buildSettingRows = (config?: StockProviderConfig): SettingRow[] => [
  {
    key: 'provider',
    name: 'stock.market.provider',
    value: config?.provider || '-',
    status: '只读配置',
    note: '由后端配置决定；用户偏好不会直接写 Spring 配置。'
  },
  {
    key: 'fallback',
    name: 'stock.market.fallback-providers',
    value: formatList(config?.fallbackProviders),
    status: '只读配置',
    note: '数据源切换仍由后端 provider/router 抽象控制。'
  },
  {
    key: 'cacheEnabled',
    name: 'stock.market.cache-enabled',
    value: formatBoolean(config?.cacheEnabled),
    status: '只读配置',
    note: '控制 Redis 行情缓存和 fallback 快照读取写入。'
  },
  {
    key: 'quoteTtl',
    name: 'stock.market.quote-cache-ttl-seconds',
    value: formatValue(config?.quoteCacheTtlSeconds),
    status: '只读配置',
    note: 'Redis 最新行情缓存 TTL。'
  },
  {
    key: 'fallbackTtl',
    name: 'stock.market.fallback-cache-ttl-seconds',
    value: formatValue(config?.fallbackCacheTtlSeconds),
    status: '只读配置',
    note: 'Redis last-success fallback 快照 TTL。'
  },
  {
    key: 'probeTtl',
    name: 'stock.market.provider-probe-ttl-seconds',
    value: formatValue(config?.providerProbeTtlSeconds),
    status: '只读配置',
    note: 'Redis 最近 Provider 探测结果 TTL。'
  },
  {
    key: 'defaultSymbols',
    name: 'stock.market.default-symbols',
    value: formatList(config?.defaultSymbols),
    status: '只读配置',
    note: '默认行情样本和无自选时的展示代码。'
  },
  {
    key: 'klineSync',
    name: 'stock.market.kline-sync-enabled',
    value: formatBoolean(config?.klineSyncEnabled),
    status: '只读配置',
    note: 'K线定时同步开关。'
  },
  {
    key: 'klineCron',
    name: 'stock.market.kline-sync-cron',
    value: config?.klineSyncCron || '-',
    status: '只读配置',
    note: 'K线定时同步计划。'
  },
  {
    key: 'klineSymbols',
    name: 'stock.market.kline-sync-symbols',
    value: formatList(config?.klineSyncSymbols),
    status: '只读配置',
    note: 'K线批量同步和批量重试的后端配置代码。'
  },
  {
    key: 'alertEnabled',
    name: 'stock.market.alert-evaluation-enabled',
    value: formatBoolean(config?.alertEvaluationEnabled),
    status: '只读配置',
    note: '告警定时评估开关。'
  },
  {
    key: 'alertCron',
    name: 'stock.market.alert-evaluation-cron',
    value: config?.alertEvaluationCron || '-',
    status: '只读配置',
    note: '告警定时评估计划。'
  },
  {
    key: 'checkedAt',
    name: 'providerConfig.checkedAt',
    value: formatTime(config?.checkedAt),
    status: '快照时间',
    note: '后端生成配置快照的毫秒时间戳。'
  }
];

const formatList = (value?: string[]) => {
  if (!value || value.length === 0) {
    return '[]';
  }
  return value.join(', ');
};

const formatBoolean = (value?: boolean) => {
  if (typeof value !== 'boolean') {
    return '-';
  }
  return value ? 'true' : 'false';
};

const formatValue = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return String(value);
};

const formatTime = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return new Date(value).toLocaleString();
};

export default LifeStockSettingsPage;
