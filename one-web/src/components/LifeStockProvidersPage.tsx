import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ApiOutlined, ReloadOutlined } from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import MetricCard from './MetricCard';
import MetricGrid from './MetricGrid';
import { stockApi, type StockProviderHealth } from '../services/api';

const LifeStockProvidersPage = () => {
  const [providers, setProviders] = useState<StockProviderHealth[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const loadProviders = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const data = await stockApi.providerHealth();
      setProviders(data);
    } catch (requestError) {
      console.error('获取股票数据源状态失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '获取股票数据源状态失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const activeProvider = useMemo(() => providers.find(item => item.active)?.provider || '-', [providers]);
  const registeredCount = useMemo(() => providers.filter(item => item.registered).length, [providers]);
  const missingCount = useMemo(() => providers.filter(item => !item.registered).length, [providers]);
  const checkedAt = useMemo(() => {
    const latest = providers.map(item => item.checkedAt).filter((value): value is number => typeof value === 'number').sort((a, b) => b - a)[0];
    return latest ? new Date(latest).toLocaleString() : '-';
  }, [providers]);

  const columns: ColumnsType<StockProviderHealth> = [
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
      title: '角色',
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
      title: '注册状态',
      dataIndex: 'registered',
      key: 'registered',
      render: value => value ? <Tag color="green">已注册</Tag> : <Tag color="red">缺失</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: value => <Tag color={value === 'REGISTERED' ? 'green' : 'orange'}>{value || '-'}</Tag>
    },
    {
      title: '检查时间',
      dataIndex: 'checkedAt',
      key: 'checkedAt',
      render: value => formatTime(value)
    }
  ];

  return (
    <LifePageShell
      className="life-investment-page"
      eyebrow="股票数据源"
      title="查看行情 Provider 的注册状态、主备关系和健康检查时间。"
      actions={
        <Button type="primary" icon={<ReloadOutlined spin={loading} />} loading={loading} onClick={loadProviders}>
          刷新状态
        </Button>
      }
    >
      {error ? <Alert type="error" showIcon message={error} className="stock-market-alert" /> : null}

      <MetricGrid gap={16} minColumnWidth={200}>
        <MetricCard title="当前 Provider" value={activeProvider} accent="#5856d6" />
        <MetricCard title="已注册" value={registeredCount} suffix="个" accent="#34c759" />
        <MetricCard title="缺失" value={missingCount} suffix="个" accent={missingCount > 0 ? '#f5222d' : '#0071e3'} />
        <MetricCard title="检查时间" value={checkedAt} accent="#ff9500" valueStyle={{ fontSize: 18 }} />
      </MetricGrid>

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>Provider 状态</h2>
            <p>数据源切换由后端配置和 Provider Router 控制；前端只读取内部状态接口，不依赖任何第三方行情协议。</p>
          </div>
        </div>
        <Table
          rowKey={record => record.provider || 'unknown'}
          columns={columns}
          dataSource={providers}
          loading={loading}
          pagination={false}
          locale={{ emptyText: '暂无 Provider 状态。' }}
          scroll={{ x: 760 }}
          rowClassName="stock-quote-row"
        />
      </Card>
    </LifePageShell>
  );
};

const formatTime = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return new Date(value).toLocaleString();
};

export default LifeStockProvidersPage;
