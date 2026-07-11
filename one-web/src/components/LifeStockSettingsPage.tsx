import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, InputNumber, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, SaveOutlined, SettingOutlined } from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import { stockApi, type StockPreference, type StockProviderConfig } from '../services/api';
import { useAppPreferences } from '../contexts/AppPreferencesContext';

interface SettingRow {
  key: string;
  name: string;
  value: string;
  status: string;
  note: string;
}

const LifeStockSettingsPage = () => {
  const { isEnglish } = useAppPreferences();
  const text = {
    daily: isEnglish ? 'Daily' : '日线',
    weekly: isEnglish ? 'Weekly' : '周线',
    monthly: isEnglish ? 'Monthly' : '月线',
    loadFailed: isEnglish ? 'Failed to load stock preferences' : '获取股票偏好失败',
    saveSuccess: isEnglish ? 'Stock preferences saved' : '股票偏好已保存',
    saveFailed: isEnglish ? 'Failed to save stock preferences' : '保存股票偏好失败',
    setting: isEnglish ? 'Setting' : '设置项',
    currentValue: isEnglish ? 'Current Value' : '当前值',
    status: isEnglish ? 'Status' : '状态',
    note: isEnglish ? 'Note' : '说明',
    eyebrow: isEnglish ? 'Stock Settings' : '股票设置',
    title: isEnglish ? 'Maintain stock module user preferences. Provider switching is still managed by the backend provider/router.' : '维护股票模块的用户偏好；数据源切换仍由后端 provider/router 管理。',
    reload: isEnglish ? 'Reload' : '重新加载',
    save: isEnglish ? 'Save Preferences' : '保存偏好',
    userPreferences: isEnglish ? 'User Preferences' : '用户偏好',
    userPreferencesDesc: isEnglish ? 'These values are saved to MongoDB for page defaults. They do not bypass Redis TTL or make the frontend depend on concrete data sources.' : '这些值保存到 MongoDB，用于后续页面默认值；不会绕过 Redis TTL，也不会让前端直接依赖具体数据源。',
    mongoPersisted: isEnglish ? 'MongoDB persisted' : 'MongoDB 持久化',
    defaultAccountId: isEnglish ? 'Default Account ID' : '默认账户 ID',
    optional: isEnglish ? 'Optional' : '可留空',
    defaultCurrency: isEnglish ? 'Default Currency' : '默认币种',
    defaultKLinePeriod: isEnglish ? 'Default K-Line Period' : '默认K线周期',
    selectDefaultKLinePeriod: isEnglish ? 'Please select default K-line period' : '请选择默认K线周期',
    quoteRefreshInterval: isEnglish ? 'Quote Refresh Interval (seconds)' : '行情刷新间隔（秒）',
    enterQuoteRefreshInterval: isEnglish ? 'Please enter quote refresh interval' : '请输入行情刷新间隔',
    backendBoundary: isEnglish ? 'Backend Configuration Boundary' : '后端配置边界',
    backendBoundaryDesc: isEnglish ? 'The following server-side configuration is read-only. Providers, cache TTLs, and scheduled jobs are still controlled by backend configuration and service abstractions.' : '下面是服务端配置边界，只读展示；Provider、缓存 TTL、定时任务仍由后端配置和服务抽象控制。',
    readonlyConfig: isEnglish ? 'Read-only config' : '只读配置',
    snapshotTime: isEnglish ? 'Snapshot time' : '快照时间',
    providerNote: isEnglish ? 'Determined by backend configuration. User preferences do not write Spring configuration directly.' : '由后端配置决定；用户偏好不会直接写 Spring 配置。',
    fallbackNote: isEnglish ? 'Data-source switching is still controlled by backend provider/router abstraction.' : '数据源切换仍由后端 provider/router 抽象控制。',
    cacheEnabledNote: isEnglish ? 'Controls Redis quote cache and fallback snapshot read/write.' : '控制 Redis 行情缓存和 fallback 快照读取写入。',
    quoteTtlNote: isEnglish ? 'Redis latest quote cache TTL.' : 'Redis 最新行情缓存 TTL。',
    fallbackTtlNote: isEnglish ? 'Redis last-success fallback snapshot TTL.' : 'Redis last-success fallback 快照 TTL。',
    probeTtlNote: isEnglish ? 'Redis latest provider-probe result TTL.' : 'Redis 最近 Provider 探测结果 TTL。',
    defaultSymbolsNote: isEnglish ? 'Default quote samples and display symbols when there is no watchlist.' : '默认行情样本和无自选时的展示代码。',
    klineSyncNote: isEnglish ? 'K-line scheduled sync switch.' : 'K线定时同步开关。',
    klineCronNote: isEnglish ? 'K-line scheduled sync cron.' : 'K线定时同步计划。',
    klineSymbolsNote: isEnglish ? 'Backend configured symbols for K-line batch sync and retry.' : 'K线批量同步和批量重试的后端配置代码。',
    alertEnabledNote: isEnglish ? 'Alert scheduled evaluation switch.' : '告警定时评估开关。',
    alertCronNote: isEnglish ? 'Alert scheduled evaluation cron.' : '告警定时评估计划。',
    checkedAtNote: isEnglish ? 'Millisecond timestamp of backend generated configuration snapshot.' : '后端生成配置快照的毫秒时间戳。'
  };
  const kLinePeriodOptions = [
    { label: text.daily, value: 'daily' },
    { label: text.weekly, value: 'weekly' },
    { label: text.monthly, value: 'monthly' }
  ];
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
      setError(requestError instanceof Error ? requestError.message : text.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [form, text.loadFailed]);

  const settingRows = buildSettingRows(providerConfig, text);

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
      setSuccess(text.saveSuccess);
    } catch (requestError) {
      console.error('保存股票偏好失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : text.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<SettingRow> = [
    {
      title: text.setting,
      dataIndex: 'name',
      key: 'name',
      render: value => (
        <span>
          <SettingOutlined /> {value}
        </span>
      )
    },
    {
      title: text.currentValue,
      dataIndex: 'value',
      key: 'value',
      render: value => <code>{value}</code>
    },
    {
      title: text.status,
      dataIndex: 'status',
      key: 'status',
      render: value => <Tag color="blue">{value}</Tag>
    },
    {
      title: text.note,
      dataIndex: 'note',
      key: 'note'
    }
  ];

  return (
    <LifePageShell
      className="life-investment-page"
      eyebrow={text.eyebrow}
      title={text.title}
      actions={
        <Space wrap>
          <Button icon={<ReloadOutlined spin={loading} />} loading={loading} onClick={loadPreference}>
            {text.reload}
          </Button>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={savePreference}>
            {text.save}
          </Button>
        </Space>
      }
    >
      {error ? <Alert type="error" showIcon message={error} className="stock-market-alert" /> : null}
      {success ? <Alert type="success" showIcon message={success} className="stock-market-alert" /> : null}

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>{text.userPreferences}</h2>
            <p>{text.userPreferencesDesc}</p>
          </div>
          <Tag color="green">{text.mongoPersisted}</Tag>
        </div>
        <Form form={form} layout="vertical" className="stock-settings-form">
          <Form.Item name="defaultAccountId" label={text.defaultAccountId}>
            <Input placeholder={text.optional} />
          </Form.Item>
          <Form.Item name="defaultCurrency" label={text.defaultCurrency}>
            <Input placeholder="CNY" maxLength={8} />
          </Form.Item>
          <Form.Item name="defaultKLinePeriod" label={text.defaultKLinePeriod} rules={[{ required: true, message: text.selectDefaultKLinePeriod }]}>
            <Select options={kLinePeriodOptions} />
          </Form.Item>
          <Form.Item
            name="quoteRefreshIntervalSeconds"
            label={text.quoteRefreshInterval}
            rules={[{ required: true, message: text.enterQuoteRefreshInterval }]}
          >
            <InputNumber min={5} max={3600} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Card>

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>{text.backendBoundary}</h2>
            <p>{text.backendBoundaryDesc}</p>
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

type StockSettingsText = {
  readonlyConfig: string;
  snapshotTime: string;
  providerNote: string;
  fallbackNote: string;
  cacheEnabledNote: string;
  quoteTtlNote: string;
  fallbackTtlNote: string;
  probeTtlNote: string;
  defaultSymbolsNote: string;
  klineSyncNote: string;
  klineCronNote: string;
  klineSymbolsNote: string;
  alertEnabledNote: string;
  alertCronNote: string;
  checkedAtNote: string;
};

const buildSettingRows = (config: StockProviderConfig | undefined, text: StockSettingsText): SettingRow[] => [
  {
    key: 'provider',
    name: 'stock.market.provider',
    value: config?.provider || '-',
    status: text.readonlyConfig,
    note: text.providerNote
  },
  {
    key: 'fallback',
    name: 'stock.market.fallback-providers',
    value: formatList(config?.fallbackProviders),
    status: text.readonlyConfig,
    note: text.fallbackNote
  },
  {
    key: 'cacheEnabled',
    name: 'stock.market.cache-enabled',
    value: formatBoolean(config?.cacheEnabled),
    status: text.readonlyConfig,
    note: text.cacheEnabledNote
  },
  {
    key: 'quoteTtl',
    name: 'stock.market.quote-cache-ttl-seconds',
    value: formatValue(config?.quoteCacheTtlSeconds),
    status: text.readonlyConfig,
    note: text.quoteTtlNote
  },
  {
    key: 'fallbackTtl',
    name: 'stock.market.fallback-cache-ttl-seconds',
    value: formatValue(config?.fallbackCacheTtlSeconds),
    status: text.readonlyConfig,
    note: text.fallbackTtlNote
  },
  {
    key: 'probeTtl',
    name: 'stock.market.provider-probe-ttl-seconds',
    value: formatValue(config?.providerProbeTtlSeconds),
    status: text.readonlyConfig,
    note: text.probeTtlNote
  },
  {
    key: 'defaultSymbols',
    name: 'stock.market.default-symbols',
    value: formatList(config?.defaultSymbols),
    status: text.readonlyConfig,
    note: text.defaultSymbolsNote
  },
  {
    key: 'klineSync',
    name: 'stock.market.kline-sync-enabled',
    value: formatBoolean(config?.klineSyncEnabled),
    status: text.readonlyConfig,
    note: text.klineSyncNote
  },
  {
    key: 'klineCron',
    name: 'stock.market.kline-sync-cron',
    value: config?.klineSyncCron || '-',
    status: text.readonlyConfig,
    note: text.klineCronNote
  },
  {
    key: 'klineSymbols',
    name: 'stock.market.kline-sync-symbols',
    value: formatList(config?.klineSyncSymbols),
    status: text.readonlyConfig,
    note: text.klineSymbolsNote
  },
  {
    key: 'alertEnabled',
    name: 'stock.market.alert-evaluation-enabled',
    value: formatBoolean(config?.alertEvaluationEnabled),
    status: text.readonlyConfig,
    note: text.alertEnabledNote
  },
  {
    key: 'alertCron',
    name: 'stock.market.alert-evaluation-cron',
    value: config?.alertEvaluationCron || '-',
    status: text.readonlyConfig,
    note: text.alertCronNote
  },
  {
    key: 'checkedAt',
    name: 'providerConfig.checkedAt',
    value: formatTime(config?.checkedAt),
    status: text.snapshotTime,
    note: text.checkedAtNote
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
