import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, SyncOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import { stockApi, type StockAccount, type StockPosition } from '../services/api';
import { useAppPreferences } from '../contexts/AppPreferencesContext';

const LifeStockPositionsPage = () => {
  const { isEnglish } = useAppPreferences();
  const text = {
    unnamedAccount: isEnglish ? 'Unnamed account' : '未命名账户',
    loadPositionsFailed: isEnglish ? 'Failed to load stock positions' : '获取股票持仓失败',
    recalculateFailed: isEnglish ? 'Failed to recalculate stock positions' : '重算股票持仓失败',
    position: isEnglish ? 'Position' : '持仓',
    account: isEnglish ? 'Account' : '账户',
    defaultAccount: isEnglish ? 'Default' : '默认',
    quantity: isEnglish ? 'Quantity' : '数量',
    available: isEnglish ? 'Available' : '可用',
    costPrice: isEnglish ? 'Cost Price' : '成本价',
    costAmount: isEnglish ? 'Cost Amount' : '成本金额',
    updatedAt: isEnglish ? 'Updated At' : '更新时间',
    action: isEnglish ? 'Action' : '操作',
    stock: isEnglish ? 'Stock' : '个股',
    trades: isEnglish ? 'Trades' : '交易',
    eyebrow: isEnglish ? 'Stock Positions' : '股票持仓',
    title: isEnglish ? 'View positions, quantities, and weighted costs recalculated from trade records.' : '查看由交易记录重算得到的持仓、数量和加权成本。',
    recalculate: isEnglish ? 'Recalculate Positions' : '重算持仓',
    listTitle: isEnglish ? 'Position List' : '持仓列表',
    description: isEnglish ? 'Positions are stored in MongoDB. Backend logic recalculates from trade flows, and the frontend only displays results.' : '持仓数据保存在 MongoDB，重算逻辑由后端按交易流水计算，前端只展示结果。',
    accountPlaceholder: isEnglish ? 'Account ID, optional' : '账户 ID，可留空',
    query: isEnglish ? 'Query' : '查询',
    empty: isEnglish ? 'No stock positions yet. Add buy trades on the Trades page first.' : '暂无股票持仓，可先在交易页录入买入记录。'
  };
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [accounts, setAccounts] = useState<StockAccount[]>([]);
  const [positions, setPositions] = useState<StockPosition[]>([]);
  const [accountId, setAccountId] = useState(searchParams.get('accountId') || '');
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState<string>();

  const accountOptions = accounts.map(account => ({
    label: `${account.name || account.id || text.unnamedAccount}${account.broker ? ` · ${account.broker}` : ''}`,
    value: account.id || ''
  })).filter(item => item.value);

  const loadAccounts = useCallback(async () => {
    try {
      const data = await stockApi.accounts();
      setAccounts(data);
    } catch (requestError) {
      console.error('获取股票账户失败:', requestError);
    }
  }, []);

  const loadPositions = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const data = await stockApi.positions(accountId.trim() || undefined);
      setPositions(data);
    } catch (requestError) {
      console.error('获取股票持仓失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : text.loadPositionsFailed);
    } finally {
      setLoading(false);
    }
  }, [accountId, text.loadPositionsFailed]);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const recalculatePositions = useCallback(async () => {
    setRecalculating(true);
    setError(undefined);
    try {
      const data = await stockApi.recalculatePositions(accountId.trim() || undefined);
      setPositions(data);
    } catch (requestError) {
      console.error('重算股票持仓失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : text.recalculateFailed);
    } finally {
      setRecalculating(false);
    }
  }, [accountId, text.recalculateFailed]);

  const columns: ColumnsType<StockPosition> = [
    {
      title: text.position,
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
      title: text.available,
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      align: 'right',
      render: value => formatQuantity(value)
    },
    {
      title: text.costPrice,
      dataIndex: 'costPrice',
      key: 'costPrice',
      align: 'right',
      render: value => formatMoney(value)
    },
    {
      title: text.costAmount,
      dataIndex: 'costAmount',
      key: 'costAmount',
      align: 'right',
      render: value => formatMoney(value)
    },
    {
      title: text.updatedAt,
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: value => formatTime(value)
    },
    {
      title: text.action,
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/investments/stocks/${record.symbol}`)}>
            {text.stock}
          </Button>
          <Button type="link" onClick={() => navigate(`/investments/trades?symbol=${encodeURIComponent(record.symbol)}&accountId=${encodeURIComponent(record.accountId || '')}`)}>
            {text.trades}
          </Button>
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
        <Button type="primary" icon={<SyncOutlined spin={recalculating} />} loading={recalculating} onClick={recalculatePositions}>
          {text.recalculate}
        </Button>
      }
    >
      {error ? <Alert type="error" showIcon message={error} className="stock-market-alert" /> : null}

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>{text.listTitle}</h2>
            <p>{text.description}</p>
          </div>
          <div className="stock-market-actions">
            <Space.Compact className="stock-symbol-search">
              <Select
                allowClear
                showSearch
                value={accountId}
                onChange={value => setAccountId(value || '')}
                options={accountOptions}
                placeholder={text.accountPlaceholder}
                style={{ minWidth: 220 }}
              />
              <Button icon={<ReloadOutlined spin={loading} />} loading={loading} onClick={loadPositions}>
                {text.query}
              </Button>
            </Space.Compact>
          </div>
        </div>
        <Table
          rowKey={record => record.id || `${record.accountId || 'default'}-${record.symbol}`}
          columns={columns}
          dataSource={positions}
          loading={loading || recalculating}
          pagination={false}
          locale={{ emptyText: text.empty }}
          scroll={{ x: 920 }}
          rowClassName="stock-quote-row"
        />
      </Card>
    </LifePageShell>
  );
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

export default LifeStockPositionsPage;
