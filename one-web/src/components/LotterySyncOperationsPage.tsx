import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Select, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, SyncOutlined } from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import { lotteryRecordApi, type LotteryRecordSyncLog } from '../services/api';
import './LotteryOverviewPage.css';

const formatTime = (value?: number) => {
  if (!value) {
    return '-';
  }
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
};

const statusColor = (status?: string) => {
  if (status === 'SUCCESS') {
    return 'green';
  }
  if (status === 'FAILED') {
    return 'red';
  }
  if (status === 'RUNNING') {
    return 'processing';
  }
  if (status === 'SKIPPED') {
    return 'gold';
  }
  return 'default';
};

const LotterySyncOperationsPage = () => {
  const [logs, setLogs] = useState<LotteryRecordSyncLog[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string>();

  const queryParams = useMemo(() => ({
    status: statusFilter,
    limit: 50
  }), [statusFilter]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const rows = await lotteryRecordApi.syncLogs(queryParams);
      setLogs(rows || []);
    } catch (requestError) {
      console.error('读取彩票同步日志失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取彩票同步日志失败');
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const runOperation = async (operation: 'sync' | 'retry' | 'scheduled') => {
    setSyncing(true);
    setError(undefined);
    try {
      const result = operation === 'scheduled'
        ? await lotteryRecordApi.scheduledSync()
        : operation === 'retry'
          ? await lotteryRecordApi.retrySync()
          : await lotteryRecordApi.sync();
      message.success(result.message || '同步任务已执行');
      await loadLogs();
    } catch (requestError) {
      console.error('执行彩票同步失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '执行彩票同步失败');
      message.error('执行彩票同步失败');
    } finally {
      setSyncing(false);
    }
  };

  const columns: ColumnsType<LotteryRecordSyncLog> = [
    {
      title: '任务',
      dataIndex: 'jobName',
      key: 'jobName',
      render: value => value || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: value => <Tag color={statusColor(value)}>{value || 'UNKNOWN'}</Tag>
    },
    {
      title: '期号',
      key: 'issue',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>{record.startIssue || '-'}</span>
          <span className="stock-quote-code">到 {record.endIssue || '-'}</span>
        </Space>
      )
    },
    {
      title: '新增',
      dataIndex: 'savedCount',
      key: 'savedCount',
      align: 'right',
      render: value => value ?? 0
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: value => value || '-'
    },
    {
      title: '开始',
      dataIndex: 'startedAt',
      key: 'startedAt',
      render: value => formatTime(value)
    },
    {
      title: '结束',
      dataIndex: 'finishedAt',
      key: 'finishedAt',
      render: value => formatTime(value)
    }
  ];

  return (
    <LifePageShell
      className="lottery-prediction-page"
      eyebrow="彩票数据"
      title="同步运维"
      actions={
        <Space wrap>
          <Button type="primary" icon={<SyncOutlined />} loading={syncing} onClick={() => runOperation('sync')}>
            同步
          </Button>
          <Button icon={<ReloadOutlined />} loading={syncing} onClick={() => runOperation('retry')}>
            重试
          </Button>
          <Button icon={<SyncOutlined />} loading={syncing} onClick={() => runOperation('scheduled')}>
            定时触发
          </Button>
          <Select
            allowClear
            placeholder="状态"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 130 }}
            options={[
              { label: '运行中', value: 'RUNNING' },
              { label: '成功', value: 'SUCCESS' },
              { label: '失败', value: 'FAILED' },
              { label: '跳过', value: 'SKIPPED' }
            ]}
          />
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadLogs}>
            刷新
          </Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}
      <Card className="life-panel-card">
        <Table
          rowKey={record => record.id || `${record.jobName}-${record.startedAt}`}
          columns={columns}
          dataSource={logs}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 920 }}
        />
      </Card>
    </LifePageShell>
  );
};

export default LotterySyncOperationsPage;
