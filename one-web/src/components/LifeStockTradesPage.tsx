import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import { stockApi, type StockTrade } from '../services/api';

interface StockTradeFormValues {
  accountId?: string;
  symbol: string;
  name?: string;
  tradeType: string;
  quantity?: number;
  price?: number;
  amount?: number;
  fee?: number;
  tax?: number;
  tradedAt?: number;
  remark?: string;
}

const tradeTypeOptions = [
  { label: '买入', value: 'BUY' },
  { label: '卖出', value: 'SELL' },
  { label: '分红', value: 'DIVIDEND' },
  { label: '费用', value: 'FEE' },
  { label: '送股', value: 'BONUS_SHARE' },
  { label: '拆股', value: 'SPLIT' }
];

const LifeStockTradesPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm<StockTradeFormValues>();
  const [trades, setTrades] = useState<StockTrade[]>([]);
  const initialAccountId = searchParams.get('accountId') || '';
  const initialSymbol = searchParams.get('symbol') || '';
  const [accountId, setAccountId] = useState(initialAccountId);
  const [symbol, setSymbol] = useState(initialSymbol);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string>();

  const queryParams = useMemo(() => ({
    accountId: accountId.trim() || undefined,
    symbol: symbol.trim() || undefined
  }), [accountId, symbol]);

  const loadTrades = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const data = await stockApi.trades(queryParams);
      setTrades(data);
    } catch (requestError) {
      console.error('获取股票交易失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '获取股票交易失败');
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  const openCreateModal = useCallback(() => {
    form.resetFields();
    form.setFieldsValue({
      accountId: accountId.trim() || undefined,
      symbol: symbol.trim() || undefined,
      tradeType: 'BUY',
      tradedAt: Date.now()
    });
    setModalOpen(true);
  }, [accountId, form, symbol]);

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      openCreateModal();
    }
  }, [openCreateModal, searchParams]);

  const saveTrade = async () => {
    const values = await form.validateFields();
    setSaving(true);
    setError(undefined);
    try {
      await stockApi.saveTrade({
        ...values,
        accountId: values.accountId?.trim() || undefined,
        symbol: values.symbol.trim(),
        name: values.name?.trim() || undefined,
        remark: values.remark?.trim() || undefined
      });
      setModalOpen(false);
      await loadTrades();
    } catch (requestError) {
      console.error('保存股票交易失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '保存股票交易失败');
    } finally {
      setSaving(false);
    }
  };

  const deleteTrade = async (id?: string) => {
    if (!id) {
      return;
    }
    setError(undefined);
    try {
      await stockApi.deleteTrade(id);
      await loadTrades();
    } catch (requestError) {
      console.error('删除股票交易失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '删除股票交易失败');
    }
  };

  const columns: ColumnsType<StockTrade> = [
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
      dataIndex: 'tradeType',
      key: 'tradeType',
      render: value => <Tag color={tradeTypeColor(value)}>{tradeTypeLabel(value)}</Tag>
    },
    {
      title: '账户',
      dataIndex: 'accountId',
      key: 'accountId',
      render: value => value || <Tag>默认</Tag>
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      render: value => formatQuantity(value)
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      render: value => formatMoney(value)
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: value => formatMoney(value)
    },
    {
      title: '费用/税',
      key: 'feeTax',
      align: 'right',
      render: (_, record) => `${formatMoney(record.fee)} / ${formatMoney(record.tax)}`
    },
    {
      title: '交易时间',
      dataIndex: 'tradedAt',
      key: 'tradedAt',
      render: value => formatTime(value)
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/investments/stocks/${record.symbol}`)}>
            个股
          </Button>
          <Popconfirm title="删除交易记录？" okText="删除" cancelText="取消" onConfirm={() => deleteTrade(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} aria-label="删除交易记录" />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <LifePageShell
      className="life-investment-page"
      eyebrow="股票交易"
      title="录入交易流水，让后端按交易记录自动重算持仓。"
      actions={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          新增交易
        </Button>
      }
    >
      {error ? <Alert type="error" showIcon message={error} className="stock-market-alert" /> : null}

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>交易流水</h2>
            <p>买入、卖出、分红、费用、送股和拆股都会保存到 MongoDB；持仓重算由后端触发。</p>
          </div>
          <div className="stock-market-actions">
            <Space wrap>
              <Input
                value={accountId}
                onChange={event => setAccountId(event.target.value)}
                onPressEnter={loadTrades}
                placeholder="账户 ID"
                prefix={<SearchOutlined />}
              />
              <Input
                value={symbol}
                onChange={event => setSymbol(event.target.value)}
                onPressEnter={loadTrades}
                placeholder="股票代码"
                prefix={<SearchOutlined />}
              />
              <Button icon={<ReloadOutlined spin={loading} />} loading={loading} onClick={loadTrades}>
                查询
              </Button>
            </Space>
          </div>
        </div>
        <Table
          rowKey={record => record.id || `${record.symbol}-${record.tradedAt}`}
          columns={columns}
          dataSource={trades}
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: '暂无交易记录，新增一条买入记录后会触发持仓重算。' }}
          scroll={{ x: 1040 }}
          rowClassName="stock-quote-row"
        />
      </Card>

      <Modal
        title="新增交易"
        open={modalOpen}
        okText="保存"
        cancelText="取消"
        confirmLoading={saving}
        onOk={saveTrade}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="symbol" label="股票代码" rules={[{ required: true, message: '请输入股票代码' }]}>
            <Input placeholder="600519" />
          </Form.Item>
          <Form.Item name="tradeType" label="交易类型" rules={[{ required: true, message: '请选择交易类型' }]}>
            <Select options={tradeTypeOptions} />
          </Form.Item>
          <Form.Item name="accountId" label="账户 ID">
            <Input placeholder="可留空" />
          </Form.Item>
          <Form.Item name="name" label="名称">
            <Input placeholder="可选" />
          </Form.Item>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="quantity" label="数量" style={{ width: '50%' }}>
              <InputNumber min={0} precision={4} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="price" label="价格" style={{ width: '50%' }}>
              <InputNumber min={0} precision={4} style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="amount" label="金额" style={{ width: '34%' }}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="fee" label="费用" style={{ width: '33%' }}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="tax" label="税费" style={{ width: '33%' }}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="tradedAt" label="交易时间戳">
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </LifePageShell>
  );
};

const tradeTypeLabel = (value?: string) => {
  return tradeTypeOptions.find(item => item.value === value)?.label || value || '-';
};

const tradeTypeColor = (value?: string) => {
  if (value === 'BUY' || value === 'BONUS_SHARE') {
    return 'red';
  }
  if (value === 'SELL' || value === 'FEE') {
    return 'green';
  }
  return 'blue';
};

const formatMoney = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatQuantity = (value?: number) => {
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

export default LifeStockTradesPage;
