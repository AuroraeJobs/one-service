import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import { stockApi, type StockAccount, type StockTrade } from '../services/api';

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

const LifeStockTradesPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm<StockTradeFormValues>();
  const { isEnglish } = useAppPreferences();
  const text = {
    unnamedAccount: isEnglish ? 'Unnamed account' : '未命名账户',
    loadTradesFailed: isEnglish ? 'Failed to load stock trades' : '获取股票交易失败',
    tradeUpdated: isEnglish ? 'Trade updated. Positions were recalculated from trade records.' : '交易已更新，后端已按交易记录触发持仓重算。',
    tradeSaved: isEnglish ? 'Trade saved. Positions were recalculated from trade records.' : '交易已保存，后端已按交易记录触发持仓重算。',
    saveFailed: isEnglish ? 'Failed to save stock trade' : '保存股票交易失败',
    tradeDeleted: isEnglish ? 'Trade deleted. Positions were recalculated from trade records.' : '交易已删除，后端已按交易记录触发持仓重算。',
    deleteFailed: isEnglish ? 'Failed to delete stock trade' : '删除股票交易失败',
    symbol: isEnglish ? 'Symbol' : '标的',
    type: isEnglish ? 'Type' : '类型',
    account: isEnglish ? 'Account' : '账户',
    defaultAccount: isEnglish ? 'Default' : '默认',
    quantity: isEnglish ? 'Quantity' : '数量',
    price: isEnglish ? 'Price' : '价格',
    amount: isEnglish ? 'Amount' : '金额',
    feeTax: isEnglish ? 'Fee/Tax' : '费用/税',
    tradedAt: isEnglish ? 'Trade Time' : '交易时间',
    action: isEnglish ? 'Action' : '操作',
    detail: isEnglish ? 'Detail' : '个股',
    editAria: isEnglish ? 'Edit trade record' : '编辑交易记录',
    deleteTitle: isEnglish ? 'Delete this trade record?' : '删除交易记录？',
    delete: isEnglish ? 'Delete' : '删除',
    cancel: isEnglish ? 'Cancel' : '取消',
    eyebrow: isEnglish ? 'Stock Trades' : '股票交易',
    title: isEnglish ? 'Record trade flows so backend positions can be recalculated automatically.' : '录入交易流水，让后端按交易记录自动重算持仓。',
    addTrade: isEnglish ? 'Add Trade' : '新增交易',
    panelTitle: isEnglish ? 'Trade Ledger' : '交易流水',
    panelDescription: isEnglish
      ? 'Buy, sell, dividend, fee, bonus share, and split records are stored in MongoDB; backend services recalculate positions.'
      : '买入、卖出、分红、费用、送股和拆股都会保存到 MongoDB；持仓重算由后端触发。',
    accountPlaceholder: isEnglish ? 'Account ID' : '账户 ID',
    symbolPlaceholder: isEnglish ? 'Stock symbol' : '股票代码',
    query: isEnglish ? 'Query' : '查询',
    empty: isEnglish ? 'No trade records yet. Add a buy record to trigger position recalculation.' : '暂无交易记录，新增一条买入记录后会触发持仓重算。',
    editTrade: isEnglish ? 'Edit Trade' : '编辑交易',
    newTrade: isEnglish ? 'New Trade' : '新增交易',
    save: isEnglish ? 'Save' : '保存',
    requiredSymbol: isEnglish ? 'Please enter a stock symbol' : '请输入股票代码',
    tradeType: isEnglish ? 'Trade Type' : '交易类型',
    requiredTradeType: isEnglish ? 'Please select a trade type' : '请选择交易类型',
    optional: isEnglish ? 'Optional' : '可选',
    name: isEnglish ? 'Name' : '名称',
    fee: isEnglish ? 'Fee' : '费用',
    tax: isEnglish ? 'Tax' : '税费',
    timestamp: isEnglish ? 'Trade Timestamp' : '交易时间戳',
    remark: isEnglish ? 'Remark' : '备注'
  };
  const tradeTypeOptions = useMemo(() => buildTradeTypeOptions(isEnglish), [isEnglish]);
  const [trades, setTrades] = useState<StockTrade[]>([]);
  const [accounts, setAccounts] = useState<StockAccount[]>([]);
  const initialAccountId = searchParams.get('accountId') || '';
  const initialSymbol = searchParams.get('symbol') || '';
  const [accountId, setAccountId] = useState(initialAccountId);
  const [symbol, setSymbol] = useState(initialSymbol);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<StockTrade>();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  const queryParams = useMemo(() => ({
    accountId: accountId.trim() || undefined,
    symbol: symbol.trim() || undefined
  }), [accountId, symbol]);

  const accountOptions = useMemo(() => accounts.map(account => ({
    label: `${account.name || account.id || text.unnamedAccount}${account.broker ? ` · ${account.broker}` : ''}`,
    value: account.id || ''
  })).filter(item => item.value), [accounts, text.unnamedAccount]);

  const loadAccounts = useCallback(async () => {
    try {
      const data = await stockApi.accounts();
      setAccounts(data);
    } catch (requestError) {
      console.error('获取股票账户失败:', requestError);
    }
  }, []);

  const loadTrades = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const data = await stockApi.trades(queryParams);
      setTrades(data);
    } catch (requestError) {
      console.error('获取股票交易失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : text.loadTradesFailed);
    } finally {
      setLoading(false);
    }
  }, [queryParams, text.loadTradesFailed]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const openCreateModal = useCallback(() => {
    form.resetFields();
    setEditingTrade(undefined);
    form.setFieldsValue({
      accountId: accountId.trim() || undefined,
      symbol: symbol.trim() || undefined,
      tradeType: 'BUY',
      tradedAt: Date.now()
    });
    setModalOpen(true);
  }, [accountId, form, symbol]);

  const openEditModal = (trade: StockTrade) => {
    setEditingTrade(trade);
    form.setFieldsValue({
      accountId: trade.accountId,
      symbol: trade.symbol,
      name: trade.name,
      tradeType: trade.tradeType,
      quantity: trade.quantity,
      price: trade.price,
      amount: trade.amount,
      fee: trade.fee,
      tax: trade.tax,
      tradedAt: trade.tradedAt,
      remark: trade.remark
    });
    setModalOpen(true);
  };

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      openCreateModal();
    }
  }, [openCreateModal, searchParams]);

  const saveTrade = async () => {
    const values = await form.validateFields();
    setSaving(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const payload = {
        ...values,
        accountId: values.accountId?.trim() || undefined,
        symbol: values.symbol.trim(),
        name: values.name?.trim() || undefined,
        remark: values.remark?.trim() || undefined
      };
      if (editingTrade?.id) {
        await stockApi.updateTrade(editingTrade.id, payload);
        setSuccess(text.tradeUpdated);
      } else {
        await stockApi.saveTrade(payload);
        setSuccess(text.tradeSaved);
      }
      setModalOpen(false);
      setEditingTrade(undefined);
      await loadTrades();
    } catch (requestError) {
      console.error('保存股票交易失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : text.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const deleteTrade = async (id?: string) => {
    if (!id) {
      return;
    }
    setError(undefined);
    setSuccess(undefined);
    try {
      await stockApi.deleteTrade(id);
      setSuccess(text.tradeDeleted);
      await loadTrades();
    } catch (requestError) {
      console.error('删除股票交易失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : text.deleteFailed);
    }
  };

  const columns: ColumnsType<StockTrade> = [
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
      dataIndex: 'tradeType',
      key: 'tradeType',
      render: value => <Tag color={tradeTypeColor(value)}>{tradeTypeLabel(value, isEnglish)}</Tag>
    },
    {
      title: text.account,
      dataIndex: 'accountId',
      key: 'accountId',
      render: value => value || <Tag>{text.defaultAccount}</Tag>
    },
    {
      title: text.quantity,
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      render: value => formatQuantity(value)
    },
    {
      title: text.price,
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      render: value => formatMoney(value)
    },
    {
      title: text.amount,
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: value => formatMoney(value)
    },
    {
      title: text.feeTax,
      key: 'feeTax',
      align: 'right',
      render: (_, record) => `${formatMoney(record.fee)} / ${formatMoney(record.tax)}`
    },
    {
      title: text.tradedAt,
      dataIndex: 'tradedAt',
      key: 'tradedAt',
      render: value => formatTime(value)
    },
    {
      title: text.action,
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/investments/stocks/${record.symbol}`)}>
            {text.detail}
          </Button>
          <Button type="text" icon={<EditOutlined />} aria-label={text.editAria} onClick={() => openEditModal(record)} />
          <Popconfirm title={text.deleteTitle} okText={text.delete} cancelText={text.cancel} onConfirm={() => deleteTrade(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} aria-label={text.deleteTitle} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <LifePageShell
      className="life-investment-page"
      eyebrow={text.eyebrow}
      title={text.title}
      actions={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          {text.addTrade}
        </Button>
      }
    >
      {error ? <Alert type="error" showIcon message={error} className="stock-market-alert" /> : null}
      {success ? <Alert type="success" showIcon message={success} className="stock-market-alert" /> : null}

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>{text.panelTitle}</h2>
            <p>{text.panelDescription}</p>
          </div>
          <div className="stock-market-actions">
            <Space wrap>
              <Select
                allowClear
                showSearch
                value={accountId}
                onChange={value => setAccountId(value || '')}
                options={accountOptions}
                placeholder={text.accountPlaceholder}
                style={{ width: 220 }}
              />
              <Input
                value={symbol}
                onChange={event => setSymbol(event.target.value)}
                onPressEnter={loadTrades}
                placeholder={text.symbolPlaceholder}
                prefix={<SearchOutlined />}
              />
              <Button icon={<ReloadOutlined spin={loading} />} loading={loading} onClick={loadTrades}>
                {text.query}
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
          locale={{ emptyText: text.empty }}
          scroll={{ x: 1040 }}
          rowClassName="stock-quote-row"
        />
      </Card>

      <Modal
        title={editingTrade ? text.editTrade : text.newTrade}
        open={modalOpen}
        okText={text.save}
        cancelText={text.cancel}
        confirmLoading={saving}
        onOk={saveTrade}
        onCancel={() => {
          setModalOpen(false);
          setEditingTrade(undefined);
        }}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="symbol" label={text.symbolPlaceholder} rules={[{ required: true, message: text.requiredSymbol }]}>
            <Input placeholder="600519" />
          </Form.Item>
          <Form.Item name="tradeType" label={text.tradeType} rules={[{ required: true, message: text.requiredTradeType }]}>
            <Select options={tradeTypeOptions} />
          </Form.Item>
          <Form.Item name="accountId" label={text.account}>
            <Select allowClear showSearch options={accountOptions} placeholder={text.optional} />
          </Form.Item>
          <Form.Item name="name" label={text.name}>
            <Input placeholder={text.optional} />
          </Form.Item>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="quantity" label={text.quantity} style={{ width: '50%' }}>
              <InputNumber min={0} precision={4} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="price" label={text.price} style={{ width: '50%' }}>
              <InputNumber min={0} precision={4} style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="amount" label={text.amount} style={{ width: '34%' }}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="fee" label={text.fee} style={{ width: '33%' }}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="tax" label={text.tax} style={{ width: '33%' }}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="tradedAt" label={text.timestamp}>
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label={text.remark}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </LifePageShell>
  );
};

const buildTradeTypeOptions = (isEnglish: boolean) => [
  { label: isEnglish ? 'Buy' : '买入', value: 'BUY' },
  { label: isEnglish ? 'Sell' : '卖出', value: 'SELL' },
  { label: isEnglish ? 'Dividend' : '分红', value: 'DIVIDEND' },
  { label: isEnglish ? 'Fee' : '费用', value: 'FEE' },
  { label: isEnglish ? 'Bonus Share' : '送股', value: 'BONUS_SHARE' },
  { label: isEnglish ? 'Split' : '拆股', value: 'SPLIT' }
];

const tradeTypeLabel = (value?: string, isEnglish = false) => {
  return buildTradeTypeOptions(isEnglish).find(item => item.value === value)?.label || value || '-';
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
