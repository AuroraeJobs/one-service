import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { BellOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import { stockApi, type StockAlertHistory, type StockAlertRule } from '../services/api';

interface StockAlertRuleFormValues {
  symbol: string;
  name?: string;
  ruleType: string;
  direction: string;
  targetValue: number;
  throttleSeconds?: number;
  enabled?: boolean;
}

const ruleTypeOptions = [
  { label: '价格', value: 'PRICE' },
  { label: '涨跌幅', value: 'PERCENT_CHANGE' },
  { label: '成交量异常', value: 'VOLUME_ABNORMAL' }
];

const directionOptions = [
  { label: '高于/向上', value: 'ABOVE' },
  { label: '低于/向下', value: 'BELOW' },
  { label: '上涨触发', value: 'UP' },
  { label: '下跌触发', value: 'DOWN' }
];

const enabledOptions = [
  { label: '全部', value: 'all' },
  { label: '启用', value: 'true' },
  { label: '停用', value: 'false' }
];

const LifeStockAlertsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm<StockAlertRuleFormValues>();
  const [rules, setRules] = useState<StockAlertRule[]>([]);
  const [histories, setHistories] = useState<StockAlertHistory[]>([]);
  const [enabledFilter, setEnabledFilter] = useState<'all' | 'true' | 'false'>('all');
  const initialSymbol = searchParams.get('symbol') || '';
  const [historySymbol, setHistorySymbol] = useState(initialSymbol);
  const [loadingRules, setLoadingRules] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<StockAlertRule>();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  const loadRules = useCallback(async () => {
    setLoadingRules(true);
    setError(undefined);
    try {
      const enabled = enabledFilter === 'all' ? undefined : enabledFilter === 'true';
      const data = await stockApi.alertRules(enabled);
      setRules(data);
    } catch (requestError) {
      console.error('获取股票告警规则失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '获取股票告警规则失败');
    } finally {
      setLoadingRules(false);
    }
  }, [enabledFilter]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    setError(undefined);
    try {
      const data = await stockApi.alertHistory(historySymbol.trim() || undefined);
      setHistories(data);
    } catch (requestError) {
      console.error('获取股票告警历史失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '获取股票告警历史失败');
    } finally {
      setLoadingHistory(false);
    }
  }, [historySymbol]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const openCreateModal = useCallback(() => {
    form.resetFields();
    setEditingRule(undefined);
    form.setFieldsValue({
      symbol: historySymbol.trim() || undefined,
      ruleType: 'PRICE',
      direction: 'ABOVE',
      enabled: true,
      throttleSeconds: 3600
    });
    setModalOpen(true);
  }, [form, historySymbol]);

  const openEditModal = (rule: StockAlertRule) => {
    setEditingRule(rule);
    form.setFieldsValue({
      symbol: rule.symbol,
      name: rule.name,
      ruleType: rule.ruleType,
      direction: rule.direction,
      targetValue: rule.targetValue,
      throttleSeconds: rule.throttleSeconds,
      enabled: rule.enabled !== false
    });
    setModalOpen(true);
  };

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      openCreateModal();
    }
  }, [openCreateModal, searchParams]);

  const saveRule = async () => {
    const values = await form.validateFields();
    setSaving(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const payload = {
        ...values,
        symbol: values.symbol.trim(),
        name: values.name?.trim() || undefined,
        enabled: values.enabled !== false
      };
      if (editingRule?.id) {
        await stockApi.updateAlertRule(editingRule.id, payload);
      } else {
        await stockApi.saveAlertRule(payload);
      }
      setModalOpen(false);
      setEditingRule(undefined);
      setSuccess(editingRule ? '告警规则已更新' : '告警规则已保存');
      await loadRules();
    } catch (requestError) {
      console.error('保存股票告警规则失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '保存股票告警规则失败');
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (id?: string) => {
    if (!id) {
      return;
    }
    setError(undefined);
    setSuccess(undefined);
    try {
      await stockApi.deleteAlertRule(id);
      setSuccess('告警规则已删除');
      await loadRules();
    } catch (requestError) {
      console.error('删除股票告警规则失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '删除股票告警规则失败');
    }
  };

  const evaluateAlerts = async () => {
    setEvaluating(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const triggered = await stockApi.evaluateAlerts();
      setSuccess(`评估完成，触发 ${triggered.length} 条告警`);
      await Promise.all([loadRules(), loadHistory()]);
    } catch (requestError) {
      console.error('评估股票告警失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '评估股票告警失败');
    } finally {
      setEvaluating(false);
    }
  };

  const ruleColumns: ColumnsType<StockAlertRule> = [
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
      title: '类型',
      dataIndex: 'ruleType',
      key: 'ruleType',
      render: value => <Tag color="blue">{ruleTypeLabel(value)}</Tag>
    },
    {
      title: '方向',
      dataIndex: 'direction',
      key: 'direction',
      render: value => <Tag color={directionColor(value)}>{directionLabel(value)}</Tag>
    },
    {
      title: '目标值',
      dataIndex: 'targetValue',
      key: 'targetValue',
      align: 'right',
      render: value => formatNumber(value)
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: value => value ? <Tag color="green">启用</Tag> : <Tag>停用</Tag>
    },
    {
      title: '节流',
      dataIndex: 'throttleSeconds',
      key: 'throttleSeconds',
      align: 'right',
      render: value => `${value || 0}s`
    },
    {
      title: '最近触发',
      dataIndex: 'lastTriggeredAt',
      key: 'lastTriggeredAt',
      render: value => formatTime(value)
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 128,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/investments/stocks/${record.symbol}`)}>
            个股
          </Button>
          <Button type="text" icon={<EditOutlined />} aria-label="编辑告警规则" onClick={() => openEditModal(record)} />
          <Popconfirm title="删除告警规则？" okText="删除" cancelText="取消" onConfirm={() => deleteRule(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} aria-label="删除告警规则" />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const historyColumns: ColumnsType<StockAlertHistory> = [
    {
      title: '标的',
      dataIndex: 'symbol',
      key: 'symbol',
      render: value => value || '-'
    },
    {
      title: '类型',
      dataIndex: 'ruleType',
      key: 'ruleType',
      render: value => <Tag color="blue">{ruleTypeLabel(value)}</Tag>
    },
    {
      title: '方向',
      dataIndex: 'direction',
      key: 'direction',
      render: value => <Tag color={directionColor(value)}>{directionLabel(value)}</Tag>
    },
    {
      title: '目标/触发',
      key: 'values',
      align: 'right',
      render: (_, record) => `${formatNumber(record.targetValue)} / ${formatNumber(record.triggerValue)}`
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: value => value || '-'
    },
    {
      title: '触发时间',
      dataIndex: 'triggeredAt',
      key: 'triggeredAt',
      render: value => formatTime(value)
    }
  ];

  return (
    <LifePageShell
      className="life-investment-page"
      eyebrow="股票告警"
      title="维护价格、涨跌幅和成交量规则，并查看每次触发历史。"
      actions={
        <Space wrap>
          <Button icon={<BellOutlined />} loading={evaluating} onClick={evaluateAlerts}>
            手动评估
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新增规则
          </Button>
        </Space>
      }
    >
      {error ? <Alert type="error" showIcon message={error} className="stock-market-alert" /> : null}
      {success ? <Alert type="success" showIcon message={success} className="stock-market-alert" /> : null}

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>告警规则</h2>
            <p>规则保存在 MongoDB，评估时通过内部行情服务读取标准化报价，并用 Redis 做触发节流。</p>
          </div>
          <div className="stock-market-actions">
            <Space wrap>
              <Select value={enabledFilter} options={enabledOptions} onChange={setEnabledFilter} style={{ width: 96 }} />
              <Button icon={<ReloadOutlined spin={loadingRules} />} loading={loadingRules} onClick={loadRules}>
                刷新规则
              </Button>
            </Space>
          </div>
        </div>
        <Table
          rowKey={record => record.id || `${record.symbol}-${record.ruleType}-${record.direction}`}
          columns={ruleColumns}
          dataSource={rules}
          loading={loadingRules}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: '暂无告警规则。' }}
          scroll={{ x: 980 }}
          rowClassName="stock-quote-row"
        />
      </Card>

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>触发历史</h2>
            <p>展示最近100条触发历史，可按股票代码过滤。</p>
          </div>
          <div className="stock-market-actions">
            <Space wrap>
              <Input
                value={historySymbol}
                onChange={event => setHistorySymbol(event.target.value)}
                onPressEnter={loadHistory}
                placeholder="过滤股票代码"
                prefix={<SearchOutlined />}
                style={{ width: 180 }}
              />
              <Button icon={<ReloadOutlined spin={loadingHistory} />} loading={loadingHistory} onClick={loadHistory}>
                刷新历史
              </Button>
            </Space>
          </div>
        </div>
        <Table
          rowKey={record => record.id || `${record.ruleId}-${record.triggeredAt}`}
          columns={historyColumns}
          dataSource={histories}
          loading={loadingHistory}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: '暂无告警触发历史。' }}
          scroll={{ x: 920 }}
          rowClassName="stock-quote-row"
        />
      </Card>

      <Modal
        title={editingRule ? '编辑告警规则' : '新增告警规则'}
        open={modalOpen}
        okText="保存"
        cancelText="取消"
        confirmLoading={saving}
        onOk={saveRule}
        onCancel={() => {
          setModalOpen(false);
          setEditingRule(undefined);
        }}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="symbol" label="股票代码" rules={[{ required: true, message: '请输入股票代码' }]}>
            <Input placeholder="600519" />
          </Form.Item>
          <Form.Item name="name" label="名称">
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item name="ruleType" label="规则类型" rules={[{ required: true, message: '请选择规则类型' }]}>
            <Select options={ruleTypeOptions} />
          </Form.Item>
          <Form.Item name="direction" label="方向" rules={[{ required: true, message: '请选择方向' }]}>
            <Select options={directionOptions} />
          </Form.Item>
          <Form.Item name="targetValue" label="目标值" rules={[{ required: true, message: '请输入目标值' }]}>
            <InputNumber style={{ width: '100%' }} precision={4} />
          </Form.Item>
          <Form.Item name="throttleSeconds" label="触发节流秒数">
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="enabled" label="是否启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </LifePageShell>
  );
};

const ruleTypeLabel = (value?: string) => ruleTypeOptions.find(item => item.value === value)?.label || value || '-';

const directionLabel = (value?: string) => directionOptions.find(item => item.value === value)?.label || value || '-';

const directionColor = (value?: string) => {
  if (value === 'ABOVE' || value === 'UP') {
    return 'red';
  }
  if (value === 'BELOW' || value === 'DOWN') {
    return 'green';
  }
  return 'blue';
};

const formatNumber = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 4
  });
};

const formatTime = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return new Date(value).toLocaleString();
};

export default LifeStockAlertsPage;
