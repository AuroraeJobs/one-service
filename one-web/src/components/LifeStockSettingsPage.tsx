import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, InputNumber, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, SaveOutlined, SettingOutlined } from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import { stockApi, type StockPreference } from '../services/api';

interface SettingRow {
  key: string;
  name: string;
  value: string;
  status: string;
  note: string;
}

const settingRows: SettingRow[] = [
  {
    key: 'provider',
    name: 'stock.market.provider',
    value: 'sina',
    status: '配置项',
    note: '由后端配置决定；用户偏好不会直接写 Spring 配置。'
  },
  {
    key: 'fallback',
    name: 'stock.market.fallback-providers',
    value: '[]',
    status: '配置项',
    note: '数据源切换仍由后端 provider/router 抽象控制。'
  },
  {
    key: 'quoteTtl',
    name: 'quote-cache-ttl-seconds',
    value: '10',
    status: '配置项',
    note: 'Redis 最新行情缓存 TTL。'
  },
  {
    key: 'fallbackTtl',
    name: 'fallback-cache-ttl-seconds',
    value: '604800',
    status: '配置项',
    note: 'Redis last-success fallback 快照 TTL。'
  },
  {
    key: 'klineCron',
    name: 'kline-sync-cron',
    value: '0 30 15 * * MON-FRI',
    status: '配置项',
    note: 'K线定时同步计划。'
  },
  {
    key: 'alertCron',
    name: 'alert-evaluation-cron',
    value: '0 */5 9-15 * * MON-FRI',
    status: '配置项',
    note: '告警定时评估计划。'
  }
];

const kLinePeriodOptions = [
  { label: '日线', value: 'daily' },
  { label: '周线', value: 'weekly' },
  { label: '月线', value: 'monthly' }
];

const LifeStockSettingsPage = () => {
  const [form] = Form.useForm<StockPreference>();
  const [preference, setPreference] = useState<StockPreference>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  const loadPreference = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const data = await stockApi.preferences();
      setPreference(data);
      form.setFieldsValue(data);
    } catch (requestError) {
      console.error('获取股票偏好失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '获取股票偏好失败');
    } finally {
      setLoading(false);
    }
  }, [form]);

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
          pagination={false}
          scroll={{ x: 760 }}
          rowClassName="stock-quote-row"
        />
      </Card>
    </LifePageShell>
  );
};

export default LifeStockSettingsPage;
