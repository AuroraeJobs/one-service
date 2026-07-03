import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Input, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import { stockApi, type StockPosition } from '../services/api';

const LifeStockPositionsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [positions, setPositions] = useState<StockPosition[]>([]);
  const [accountId, setAccountId] = useState(searchParams.get('accountId') || '');
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState<string>();

  const loadPositions = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const data = await stockApi.positions(accountId.trim() || undefined);
      setPositions(data);
    } catch (requestError) {
      console.error('获取股票持仓失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '获取股票持仓失败');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  const recalculatePositions = useCallback(async () => {
    setRecalculating(true);
    setError(undefined);
    try {
      const data = await stockApi.recalculatePositions(accountId.trim() || undefined);
      setPositions(data);
    } catch (requestError) {
      console.error('重算股票持仓失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '重算股票持仓失败');
    } finally {
      setRecalculating(false);
    }
  }, [accountId]);

  const columns: ColumnsType<StockPosition> = [
    {
      title: '持仓',
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
      title: '可用',
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      align: 'right',
      render: value => formatQuantity(value)
    },
    {
      title: '成本价',
      dataIndex: 'costPrice',
      key: 'costPrice',
      align: 'right',
      render: value => formatMoney(value)
    },
    {
      title: '成本金额',
      dataIndex: 'costAmount',
      key: 'costAmount',
      align: 'right',
      render: value => formatMoney(value)
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: value => formatTime(value)
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/investments/stocks/${record.symbol}`)}>
            个股
          </Button>
          <Button type="link" onClick={() => navigate(`/investments/trades?symbol=${encodeURIComponent(record.symbol)}&accountId=${encodeURIComponent(record.accountId || '')}`)}>
            交易
          </Button>
        </Space>
      )
    }
  ];

  return (
    <LifePageShell
      className="life-investment-page"
      eyebrow="股票持仓"
      title="查看由交易记录重算得到的持仓、数量和加权成本。"
      actions={
        <Button type="primary" icon={<SyncOutlined spin={recalculating} />} loading={recalculating} onClick={recalculatePositions}>
          重算持仓
        </Button>
      }
    >
      {error ? <Alert type="error" showIcon message={error} className="stock-market-alert" /> : null}

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>持仓列表</h2>
            <p>持仓数据保存在 MongoDB，重算逻辑由后端按交易流水计算，前端只展示结果。</p>
          </div>
          <div className="stock-market-actions">
            <Space.Compact className="stock-symbol-search">
              <Input
                value={accountId}
                onChange={event => setAccountId(event.target.value)}
                onPressEnter={loadPositions}
                placeholder="账户 ID，可留空"
                prefix={<SearchOutlined />}
              />
              <Button icon={<ReloadOutlined spin={loading} />} loading={loading} onClick={loadPositions}>
                查询
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
          locale={{ emptyText: '暂无股票持仓，可先在交易页录入买入记录。' }}
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
