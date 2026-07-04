import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Input, Select, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ApiOutlined, CheckCircleOutlined, ClockCircleOutlined, ExperimentOutlined, ReloadOutlined, SyncOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import {
  lotteryDataQualityApi,
  lotteryProviderApi,
  lotteryRecordApi,
  type LotteryDataQualityReport,
  type LotteryPageResponse,
  type LotteryProviderProbeLog,
  type LotteryRecordSyncLog,
  type LotteryRecordSyncSummary
} from '../services/api';
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState<LotteryRecordSyncLog[]>([]);
  const [logPageResponse, setLogPageResponse] = useState<LotteryPageResponse<LotteryRecordSyncLog>>();
  const [summary, setSummary] = useState<LotteryRecordSyncSummary>();
  const [probeLogs, setProbeLogs] = useState<LotteryProviderProbeLog[]>([]);
  const [probePageResponse, setProbePageResponse] = useState<LotteryPageResponse<LotteryProviderProbeLog>>();
  const [qualityReport, setQualityReport] = useState<LotteryDataQualityReport>();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [probing, setProbing] = useState(false);
  const [error, setError] = useState<string>();

  const statusFilter = searchParams.get('status') || undefined;
  const probeProvider = searchParams.get('provider') || 'cwl';
  const syncPage = Math.max(1, Number(searchParams.get('syncPage') || '1') || 1);
  const syncPageSize = Math.max(1, Number(searchParams.get('syncPageSize') || '10') || 10);
  const probePage = Math.max(1, Number(searchParams.get('probePage') || '1') || 1);
  const probePageSize = Math.max(1, Number(searchParams.get('probePageSize') || '5') || 5);

  const updateQuery = useCallback((patch: Record<string, string | number | undefined>, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    if (resetPage) {
      if (!Object.prototype.hasOwnProperty.call(patch, 'syncPage')) {
        next.delete('syncPage');
      }
      if (!Object.prototype.hasOwnProperty.call(patch, 'probePage')) {
        next.delete('probePage');
      }
    }
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const queryParams = useMemo(() => ({
    status: statusFilter,
    page: syncPage,
    pageSize: syncPageSize
  }), [statusFilter, syncPage, syncPageSize]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [rows, nextSummary, nextProbeLogs, nextQualityReport] = await Promise.all([
        lotteryRecordApi.syncLogsPage(queryParams),
        lotteryRecordApi.syncSummary({ limit: 50 }),
        lotteryProviderApi.probeLogsPage({
          provider: probeProvider.trim() || undefined,
          page: probePage,
          pageSize: probePageSize
        }),
        lotteryDataQualityApi.report()
      ]);
      setLogPageResponse(rows);
      setLogs(rows.items || []);
      setSummary(nextSummary || undefined);
      setProbePageResponse(nextProbeLogs);
      setProbeLogs(nextProbeLogs.items || []);
      setQualityReport(nextQualityReport || undefined);
    } catch (requestError) {
      console.error('读取彩票同步日志失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取彩票同步日志失败');
    } finally {
      setLoading(false);
    }
  }, [probePage, probePageSize, probeProvider, queryParams]);

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

  const runProbe = async () => {
    setProbing(true);
    setError(undefined);
    try {
      const provider = probeProvider.trim() || undefined;
      const result = await lotteryProviderApi.probe({ provider });
      message.success(result.message || 'Provider 探测完成');
      await loadLogs();
    } catch (requestError) {
      console.error('探测彩票 Provider 失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '探测彩票 Provider 失败');
      message.error('探测彩票 Provider 失败');
    } finally {
      setProbing(false);
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

  const probeColumns: ColumnsType<LotteryProviderProbeLog> = [
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
      title: '状态',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.success && record.status === 'AVAILABLE' ? 'green' : 'orange'}>
          {record.status || 'UNKNOWN'}
        </Tag>
      )
    },
    {
      title: '记录数',
      dataIndex: 'recordCount',
      key: 'recordCount',
      align: 'right',
      render: value => value ?? 0
    },
    {
      title: '耗时',
      dataIndex: 'durationMs',
      key: 'durationMs',
      render: value => `${value ?? 0} ms`
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: value => value || '-'
    },
    {
      title: '检查时间',
      dataIndex: 'checkedAt',
      key: 'checkedAt',
      render: value => formatTime(value)
    }
  ];

  const latestStatus = summary?.latestStatus || '-';
  const latestIssueRange = summary?.latestStartIssue || summary?.latestEndIssue
    ? `${summary?.latestStartIssue || '-'} 到 ${summary?.latestEndIssue || '-'}`
    : '-';
  const qualityIssueCount = (qualityReport?.missingIssueCount || 0)
    + (qualityReport?.duplicateIssueCount || 0)
    + (qualityReport?.malformedRecordCount || 0)
    + (qualityReport?.futureDateCount || 0);

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
            onChange={value => updateQuery({ status: value })}
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
      {qualityIssueCount > 0 ? (
        <Alert
          className="lottery-overview-status-alert"
          type="warning"
          showIcon
          message={`发现 ${qualityIssueCount} 项数据质量问题`}
          action={
            <Button size="small" icon={<WarningOutlined />} onClick={() => navigate('/lottery/data-quality')}>
              查看
            </Button>
          }
        />
      ) : null}

      <section className="lottery-history-summary-grid lottery-sync-summary-grid">
        <Card className="life-panel-card lottery-clean-panel" loading={loading}>
          <div className="lottery-history-summary-item">
            <CheckCircleOutlined />
            <div>
              <strong>{summary?.successCount ?? 0}</strong>
              <span>成功同步</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel" loading={loading}>
          <div className="lottery-history-summary-item">
            <WarningOutlined />
            <div>
              <strong>{summary?.failedCount ?? 0}</strong>
              <span>失败同步</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel" loading={loading}>
          <div className="lottery-history-summary-item">
            <SyncOutlined />
            <div>
              <strong>{summary?.savedCount ?? 0}</strong>
              <span>新增记录</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel" loading={loading}>
          <div className="lottery-history-summary-item">
            <ClockCircleOutlined />
            <div>
              <strong>{summary?.averageDurationMs ?? 0}</strong>
              <span>平均耗时 ms</span>
            </div>
          </div>
        </Card>
      </section>

      <Card
        className="life-panel-card"
        title="同步摘要"
        extra={<Tag color={statusColor(latestStatus)}>{latestStatus}</Tag>}
      >
        <Space wrap size={[16, 8]}>
          <span>最近期号：{latestIssueRange}</span>
          <span>成功率：{summary?.successRate ?? 0}%</span>
          <span>失败率：{summary?.failedRate ?? 0}%</span>
          <span>最近完成：{formatTime(summary?.latestFinishedAt)}</span>
          <span>最近消息：{summary?.latestMessage || '-'}</span>
        </Space>
      </Card>

      <Card
        className="life-panel-card"
        title="Provider 探测"
        extra={
          <Space wrap>
            <Input
              value={probeProvider}
              placeholder="provider"
              allowClear
              style={{ width: 140 }}
              onChange={event => updateQuery({ provider: event.target.value })}
            />
            <Button icon={<ExperimentOutlined />} loading={probing} onClick={runProbe}>
              探测
            </Button>
          </Space>
        }
      >
        <Table
          rowKey={record => record.id || `${record.provider}-${record.checkedAt}`}
          columns={probeColumns}
          dataSource={probeLogs}
          loading={loading || probing}
          pagination={{
            current: probePage,
            pageSize: probePageSize,
            total: probePageResponse?.total || 0,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`,
            onChange: (nextPage, nextPageSize) => updateQuery({ probePage: nextPage, probePageSize: nextPageSize }, false)
          }}
          scroll={{ x: 780 }}
        />
      </Card>

      <Card className="life-panel-card">
        <Table
          rowKey={record => record.id || `${record.jobName}-${record.startedAt}`}
          columns={columns}
          dataSource={logs}
          loading={loading}
          pagination={{
            current: syncPage,
            pageSize: syncPageSize,
            total: logPageResponse?.total || 0,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`,
            onChange: (nextPage, nextPageSize) => updateQuery({ syncPage: nextPage, syncPageSize: nextPageSize }, false)
          }}
          scroll={{ x: 920 }}
        />
      </Card>
    </LifePageShell>
  );
};

export default LotterySyncOperationsPage;
