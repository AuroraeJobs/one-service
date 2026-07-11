import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { BellOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
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

const LifeStockAlertsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm<StockAlertRuleFormValues>();
  const { isEnglish } = useAppPreferences();
  const text = {
    loadRulesFailed: isEnglish ? 'Failed to load stock alert rules' : '获取股票告警规则失败',
    loadHistoryFailed: isEnglish ? 'Failed to load stock alert history' : '获取股票告警历史失败',
    ruleUpdated: isEnglish ? 'Alert rule updated' : '告警规则已更新',
    ruleSaved: isEnglish ? 'Alert rule saved' : '告警规则已保存',
    saveFailed: isEnglish ? 'Failed to save stock alert rule' : '保存股票告警规则失败',
    ruleDeleted: isEnglish ? 'Alert rule deleted' : '告警规则已删除',
    deleteFailed: isEnglish ? 'Failed to delete stock alert rule' : '删除股票告警规则失败',
    evaluateSuccess: (count: number) => isEnglish ? `Evaluation completed. ${count} alert(s) triggered.` : `评估完成，触发 ${count} 条告警`,
    evaluateFailed: isEnglish ? 'Failed to evaluate stock alerts' : '评估股票告警失败',
    symbol: isEnglish ? 'Symbol' : '标的',
    type: isEnglish ? 'Type' : '类型',
    direction: isEnglish ? 'Direction' : '方向',
    targetValue: isEnglish ? 'Target Value' : '目标值',
    status: isEnglish ? 'Status' : '状态',
    enabled: isEnglish ? 'Enabled' : '启用',
    disabled: isEnglish ? 'Disabled' : '停用',
    throttle: isEnglish ? 'Throttle' : '节流',
    lastTriggered: isEnglish ? 'Last Triggered' : '最近触发',
    action: isEnglish ? 'Action' : '操作',
    detail: isEnglish ? 'Detail' : '个股',
    editAria: isEnglish ? 'Edit alert rule' : '编辑告警规则',
    deleteTitle: isEnglish ? 'Delete this alert rule?' : '删除告警规则？',
    delete: isEnglish ? 'Delete' : '删除',
    cancel: isEnglish ? 'Cancel' : '取消',
    targetTriggered: isEnglish ? 'Target/Triggered' : '目标/触发',
    message: isEnglish ? 'Message' : '消息',
    triggeredAt: isEnglish ? 'Triggered At' : '触发时间',
    eyebrow: isEnglish ? 'Stock Alerts' : '股票告警',
    title: isEnglish ? 'Manage price, percent-change, and volume rules, then review trigger history.' : '维护价格、涨跌幅和成交量规则，并查看每次触发历史。',
    evaluate: isEnglish ? 'Evaluate' : '手动评估',
    addRule: isEnglish ? 'Add Rule' : '新增规则',
    rulesTitle: isEnglish ? 'Alert Rules' : '告警规则',
    rulesDescription: isEnglish
      ? 'Rules are stored in MongoDB. Evaluation reads normalized quotes from the internal market service and uses Redis throttling.'
      : '规则保存在 MongoDB，评估时通过内部行情服务读取标准化报价，并用 Redis 做触发节流。',
    refreshRules: isEnglish ? 'Refresh Rules' : '刷新规则',
    emptyRules: isEnglish ? 'No alert rules yet.' : '暂无告警规则。',
    historyTitle: isEnglish ? 'Trigger History' : '触发历史',
    historyDescription: isEnglish ? 'Shows the latest 100 trigger records, optionally filtered by stock symbol.' : '展示最近100条触发历史，可按股票代码过滤。',
    symbolFilter: isEnglish ? 'Filter symbol' : '过滤股票代码',
    refreshHistory: isEnglish ? 'Refresh History' : '刷新历史',
    emptyHistory: isEnglish ? 'No alert trigger history yet.' : '暂无告警触发历史。',
    editRule: isEnglish ? 'Edit Alert Rule' : '编辑告警规则',
    newRule: isEnglish ? 'New Alert Rule' : '新增告警规则',
    save: isEnglish ? 'Save' : '保存',
    stockSymbol: isEnglish ? 'Stock Symbol' : '股票代码',
    requiredSymbol: isEnglish ? 'Please enter a stock symbol' : '请输入股票代码',
    name: isEnglish ? 'Name' : '名称',
    optional: isEnglish ? 'Optional' : '可选',
    ruleType: isEnglish ? 'Rule Type' : '规则类型',
    requiredRuleType: isEnglish ? 'Please select a rule type' : '请选择规则类型',
    requiredDirection: isEnglish ? 'Please select a direction' : '请选择方向',
    requiredTarget: isEnglish ? 'Please enter a target value' : '请输入目标值',
    throttleSeconds: isEnglish ? 'Throttle Seconds' : '触发节流秒数',
    isEnabled: isEnglish ? 'Enabled' : '是否启用'
  };
  const ruleTypeOptions = useMemo(() => buildRuleTypeOptions(isEnglish), [isEnglish]);
  const directionOptions = useMemo(() => buildDirectionOptions(isEnglish), [isEnglish]);
  const enabledOptions = useMemo(() => buildEnabledOptions(isEnglish), [isEnglish]);
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
      setError(requestError instanceof Error ? requestError.message : text.loadRulesFailed);
    } finally {
      setLoadingRules(false);
    }
  }, [enabledFilter, text.loadRulesFailed]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    setError(undefined);
    try {
      const data = await stockApi.alertHistory(historySymbol.trim() || undefined);
      setHistories(data);
    } catch (requestError) {
      console.error('获取股票告警历史失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : text.loadHistoryFailed);
    } finally {
      setLoadingHistory(false);
    }
  }, [historySymbol, text.loadHistoryFailed]);

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
      setSuccess(editingRule ? text.ruleUpdated : text.ruleSaved);
      await loadRules();
    } catch (requestError) {
      console.error('保存股票告警规则失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : text.saveFailed);
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
      setSuccess(text.ruleDeleted);
      await loadRules();
    } catch (requestError) {
      console.error('删除股票告警规则失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : text.deleteFailed);
    }
  };

  const evaluateAlerts = async () => {
    setEvaluating(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const triggered = await stockApi.evaluateAlerts();
      setSuccess(text.evaluateSuccess(triggered.length));
      await Promise.all([loadRules(), loadHistory()]);
    } catch (requestError) {
      console.error('评估股票告警失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : text.evaluateFailed);
    } finally {
      setEvaluating(false);
    }
  };

  const ruleColumns: ColumnsType<StockAlertRule> = [
    {
      title: text.symbol,
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
      title: text.type,
      dataIndex: 'ruleType',
      key: 'ruleType',
      render: value => <Tag color="blue">{ruleTypeLabel(value, isEnglish)}</Tag>
    },
    {
      title: text.direction,
      dataIndex: 'direction',
      key: 'direction',
      render: value => <Tag color={directionColor(value)}>{directionLabel(value, isEnglish)}</Tag>
    },
    {
      title: text.targetValue,
      dataIndex: 'targetValue',
      key: 'targetValue',
      align: 'right',
      render: value => formatNumber(value)
    },
    {
      title: text.status,
      dataIndex: 'enabled',
      key: 'enabled',
      render: value => value ? <Tag color="green">{text.enabled}</Tag> : <Tag>{text.disabled}</Tag>
    },
    {
      title: text.throttle,
      dataIndex: 'throttleSeconds',
      key: 'throttleSeconds',
      align: 'right',
      render: value => `${value || 0}s`
    },
    {
      title: text.lastTriggered,
      dataIndex: 'lastTriggeredAt',
      key: 'lastTriggeredAt',
      render: value => formatTime(value)
    },
    {
      title: text.action,
      key: 'action',
      fixed: 'right',
      width: 128,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/investments/stocks/${record.symbol}`)}>
            {text.detail}
          </Button>
          <Button type="text" icon={<EditOutlined />} aria-label={text.editAria} onClick={() => openEditModal(record)} />
          <Popconfirm title={text.deleteTitle} okText={text.delete} cancelText={text.cancel} onConfirm={() => deleteRule(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} aria-label={text.deleteTitle} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const historyColumns: ColumnsType<StockAlertHistory> = [
    {
      title: text.symbol,
      dataIndex: 'symbol',
      key: 'symbol',
      render: value => value || '-'
    },
    {
      title: text.type,
      dataIndex: 'ruleType',
      key: 'ruleType',
      render: value => <Tag color="blue">{ruleTypeLabel(value, isEnglish)}</Tag>
    },
    {
      title: text.direction,
      dataIndex: 'direction',
      key: 'direction',
      render: value => <Tag color={directionColor(value)}>{directionLabel(value, isEnglish)}</Tag>
    },
    {
      title: text.targetTriggered,
      key: 'values',
      align: 'right',
      render: (_, record) => `${formatNumber(record.targetValue)} / ${formatNumber(record.triggerValue)}`
    },
    {
      title: text.message,
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: value => value || '-'
    },
    {
      title: text.triggeredAt,
      dataIndex: 'triggeredAt',
      key: 'triggeredAt',
      render: value => formatTime(value)
    }
  ];

  return (
    <LifePageShell
      className="life-investment-page"
      eyebrow={text.eyebrow}
      title={text.title}
      actions={
        <Space wrap>
          <Button icon={<BellOutlined />} loading={evaluating} onClick={evaluateAlerts}>
            {text.evaluate}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            {text.addRule}
          </Button>
        </Space>
      }
    >
      {error ? <Alert type="error" showIcon message={error} className="stock-market-alert" /> : null}
      {success ? <Alert type="success" showIcon message={success} className="stock-market-alert" /> : null}

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>{text.rulesTitle}</h2>
            <p>{text.rulesDescription}</p>
          </div>
          <div className="stock-market-actions">
            <Space wrap>
              <Select value={enabledFilter} options={enabledOptions} onChange={setEnabledFilter} style={{ width: 96 }} />
              <Button icon={<ReloadOutlined spin={loadingRules} />} loading={loadingRules} onClick={loadRules}>
                {text.refreshRules}
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
          locale={{ emptyText: text.emptyRules }}
          scroll={{ x: 980 }}
          rowClassName="stock-quote-row"
        />
      </Card>

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>{text.historyTitle}</h2>
            <p>{text.historyDescription}</p>
          </div>
          <div className="stock-market-actions">
            <Space wrap>
              <Input
                value={historySymbol}
                onChange={event => setHistorySymbol(event.target.value)}
                onPressEnter={loadHistory}
                placeholder={text.symbolFilter}
                prefix={<SearchOutlined />}
                style={{ width: 180 }}
              />
              <Button icon={<ReloadOutlined spin={loadingHistory} />} loading={loadingHistory} onClick={loadHistory}>
                {text.refreshHistory}
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
          locale={{ emptyText: text.emptyHistory }}
          scroll={{ x: 920 }}
          rowClassName="stock-quote-row"
        />
      </Card>

      <Modal
        title={editingRule ? text.editRule : text.newRule}
        open={modalOpen}
        okText={text.save}
        cancelText={text.cancel}
        confirmLoading={saving}
        onOk={saveRule}
        onCancel={() => {
          setModalOpen(false);
          setEditingRule(undefined);
        }}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="symbol" label={text.stockSymbol} rules={[{ required: true, message: text.requiredSymbol }]}>
            <Input placeholder="600519" />
          </Form.Item>
          <Form.Item name="name" label={text.name}>
            <Input placeholder={text.optional} />
          </Form.Item>
          <Form.Item name="ruleType" label={text.ruleType} rules={[{ required: true, message: text.requiredRuleType }]}>
            <Select options={ruleTypeOptions} />
          </Form.Item>
          <Form.Item name="direction" label={text.direction} rules={[{ required: true, message: text.requiredDirection }]}>
            <Select options={directionOptions} />
          </Form.Item>
          <Form.Item name="targetValue" label={text.targetValue} rules={[{ required: true, message: text.requiredTarget }]}>
            <InputNumber style={{ width: '100%' }} precision={4} />
          </Form.Item>
          <Form.Item name="throttleSeconds" label={text.throttleSeconds}>
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="enabled" label={text.isEnabled} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </LifePageShell>
  );
};

const buildRuleTypeOptions = (isEnglish: boolean) => [
  { label: isEnglish ? 'Price' : '价格', value: 'PRICE' },
  { label: isEnglish ? 'Percent Change' : '涨跌幅', value: 'PERCENT_CHANGE' },
  { label: isEnglish ? 'Volume Anomaly' : '成交量异常', value: 'VOLUME_ABNORMAL' }
];

const buildDirectionOptions = (isEnglish: boolean) => [
  { label: isEnglish ? 'Above/Upward' : '高于/向上', value: 'ABOVE' },
  { label: isEnglish ? 'Below/Downward' : '低于/向下', value: 'BELOW' },
  { label: isEnglish ? 'Trigger on Rise' : '上涨触发', value: 'UP' },
  { label: isEnglish ? 'Trigger on Drop' : '下跌触发', value: 'DOWN' }
];

const buildEnabledOptions = (isEnglish: boolean) => [
  { label: isEnglish ? 'All' : '全部', value: 'all' },
  { label: isEnglish ? 'Enabled' : '启用', value: 'true' },
  { label: isEnglish ? 'Disabled' : '停用', value: 'false' }
];

const ruleTypeLabel = (value?: string, isEnglish = false) => buildRuleTypeOptions(isEnglish).find(item => item.value === value)?.label || value || '-';

const directionLabel = (value?: string, isEnglish = false) => buildDirectionOptions(isEnglish).find(item => item.value === value)?.label || value || '-';

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
