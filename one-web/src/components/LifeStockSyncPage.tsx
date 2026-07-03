import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Checkbox, Input, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import MetricCard from './MetricCard';
import MetricGrid from './MetricGrid';
import { stockApi, type StockKLine, type StockKLineSyncLog, type StockKLineSyncSummary } from '../services/api';

const sampleKLines = JSON.stringify([
  {
    tradeDate: '2026-07-03',
    period: 'daily',
    open: 10,
    high: 10.8,
    low: 9.9,
    close: 10.5,
    volume: 1000000,
    amount: 10500000,
    source: 'manual'
  }
], null, 2);

const syncModeOptions = [
  { label: '单只标的', value: 'single' },
  { label: '配置批量', value: 'batch' }
];

const summaryLimitOptions = [
  { label: '最近20条', value: 20 },
  { label: '最近50条', value: 50 },
  { label: '最近100条', value: 100 }
];

const syncStatusOptions = [
  { label: '全部状态', value: '' },
  { label: '成功', value: 'SUCCESS' },
  { label: '失败', value: 'FAILED' },
  { label: '运行中', value: 'RUNNING' }
];

const LifeStockSyncPage = () => {
  const [searchParams] = useSearchParams();
  const initialSymbol = searchParams.get('symbol') || '600519';
  const [symbol, setSymbol] = useState(initialSymbol);
  const [logSymbol, setLogSymbol] = useState(searchParams.get('logSymbol') || searchParams.get('symbol') || '');
  const [syncMode, setSyncMode] = useState<'single' | 'batch'>(searchParams.get('mode') === 'batch' ? 'batch' : 'single');
  const [manualImport, setManualImport] = useState(false);
  const [payload, setPayload] = useState(sampleKLines);
  const [logs, setLogs] = useState<StockKLineSyncLog[]>([]);
  const [summary, setSummary] = useState<StockKLineSyncSummary>();
  const [summaryLimit, setSummaryLimit] = useState(50);
  const [logLimit, setLogLimit] = useState(50);
  const [logStatus, setLogStatus] = useState(searchParams.get('status') || '');
  const [syncing, setSyncing] = useState(false);
  const [triggeringScheduled, setTriggeringScheduled] = useState(false);
  const [retryingLogKey, setRetryingLogKey] = useState<string>();
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    setError(undefined);
    try {
      const symbolFilter = logSymbol.trim() || undefined;
      const statusFilter = logStatus || undefined;
      const [data, nextSummary] = await Promise.all([
        stockApi.klineSyncLogs({ symbol: symbolFilter, status: statusFilter, limit: logLimit }),
        stockApi.klineSyncSummary({ symbol: symbolFilter, limit: summaryLimit })
      ]);
      setLogs(data);
      setSummary(nextSummary);
    } catch (requestError) {
      console.error('获取K线同步日志失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '获取K线同步日志失败');
    } finally {
      setLoadingLogs(false);
    }
  }, [logSymbol, logStatus, logLimit, summaryLimit]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const syncKLines = async () => {
    setSyncing(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const rows = manualImport ? parseKLineRows(payload) : undefined;
      const saved = syncMode === 'single'
        ? await stockApi.syncKlines(symbol.trim(), rows)
        : await stockApi.syncAllKlines(rows);
      setSuccess(`${manualImport ? '导入' : 'Provider 同步'}完成，保存 ${saved.length} 条K线`);
      await loadLogs();
    } catch (requestError) {
      console.error('同步K线失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '同步K线失败');
    } finally {
      setSyncing(false);
    }
  };

  const retrySyncLog = async (record: StockKLineSyncLog) => {
    const logKey = syncLogKey(record);
    setRetryingLogKey(logKey);
    setError(undefined);
    setSuccess(undefined);
    try {
      const saved = record.symbol
        ? await stockApi.syncKlines(record.symbol)
        : await stockApi.retryKlineSync();
      setSuccess(record.symbol
        ? `已重试 ${record.symbol}，保存 ${saved.length} 条K线`
        : `已重试配置批量同步，保存 ${saved.length} 条K线`);
      await loadLogs();
    } catch (requestError) {
      console.error('重试K线同步失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '重试K线同步失败');
    } finally {
      setRetryingLogKey(undefined);
    }
  };

  const triggerScheduledSync = async () => {
    setTriggeringScheduled(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const log = await stockApi.triggerScheduledKlineSync();
      setSuccess(`已触发定时同步语义任务，状态 ${log.status || '-'}，保存 ${log.savedCount ?? 0} 条K线`);
      await loadLogs();
    } catch (requestError) {
      console.error('触发K线定时同步失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '触发K线定时同步失败');
    } finally {
      setTriggeringScheduled(false);
    }
  };

  const openSymbolSync = (nextSymbol?: string) => {
    if (!nextSymbol) {
      return;
    }
    setSyncMode('single');
    setManualImport(false);
    setSymbol(nextSymbol);
    setLogSymbol(nextSymbol);
  };

  const columns: ColumnsType<StockKLineSyncLog> = [
    {
      title: '任务',
      dataIndex: 'jobName',
      key: 'jobName',
      render: value => value || '-'
    },
    {
      title: '标的',
      dataIndex: 'symbol',
      key: 'symbol',
      render: value => value ? (
        <Button type="link" onClick={() => openSymbolSync(value)}>
          {value}
        </Button>
      ) : <Tag>批量</Tag>
    },
    {
      title: '周期',
      dataIndex: 'period',
      key: 'period',
      render: value => value || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: value => <Tag color={statusColor(value)}>{value || '-'}</Tag>
    },
    {
      title: '请求/保存',
      key: 'counts',
      align: 'right',
      render: (_, record) => `${record.requestedCount ?? 0} / ${record.savedCount ?? 0}`
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
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 96,
      render: (_, record) => record.status === 'FAILED' ? (
        <Button
          type="link"
          loading={retryingLogKey === syncLogKey(record)}
          onClick={() => retrySyncLog(record)}
        >
          {record.symbol ? '重试' : '批量重试'}
        </Button>
      ) : '-'
    }
  ];

  return (
    <LifePageShell
      className="life-investment-page"
      eyebrow="股票同步"
      title="查看历史数据同步日志，并通过内部同步接口拉取或导入标准化K线。"
      actions={
        <Space wrap>
          <Button icon={<SyncOutlined spin={triggeringScheduled} />} loading={triggeringScheduled} onClick={triggerScheduledSync}>
            触发定时同步
          </Button>
          <Button type="primary" icon={<SyncOutlined spin={syncing} />} loading={syncing} onClick={syncKLines}>
            执行同步
          </Button>
        </Space>
      }
    >
      {error ? <Alert type="error" showIcon message={error} className="stock-market-alert" /> : null}
      {success ? <Alert type="success" showIcon message={success} className="stock-market-alert" /> : null}

      <MetricGrid gap={16} minColumnWidth={180}>
        <MetricCard title="最近状态" value={summary?.latestStatus || '-'} accent={summary?.latestStatus === 'FAILED' ? '#f5222d' : '#34c759'} />
        <MetricCard title="成功" value={summary?.successCount ?? 0} suffix="次" accent="#34c759" />
        <MetricCard title="失败" value={summary?.failedCount ?? 0} suffix="次" accent="#f5222d" />
        <MetricCard title="成功率" value={formatRate(summary?.successRate)} accent="#30d158" />
        <MetricCard title="失败率" value={formatRate(summary?.failedRate)} accent="#ff3b30" />
        <MetricCard title="运行中" value={summary?.runningCount ?? 0} suffix="次" accent="#0071e3" />
        <MetricCard title="保存" value={summary?.savedCount ?? 0} suffix="条" accent="#ff9500" />
        <MetricCard title="最近耗时" value={formatDuration(summary?.latestDurationMs)} accent="#00a6a6" />
        <MetricCard title="平均耗时" value={formatDuration(summary?.averageDurationMs)} accent="#bf5af2" />
        <MetricCard title="最后完成" value={formatTime(summary?.latestFinishedAt)} accent="#5856d6" valueStyle={{ fontSize: 18 }} />
      </MetricGrid>

      {summary?.latestMessage ? (
        <Alert
          type={summary.latestStatus === 'FAILED' ? 'warning' : 'info'}
          showIcon
          message={summary.latestMessage}
          description={`最近任务：${summary.latestJobName || '-'}，摘要生成：${formatTime(summary.generatedAt)}`}
          className="stock-market-alert"
        />
      ) : null}

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>摘要窗口</h2>
            <p>摘要按最近同步日志聚合，窗口越大越适合看趋势，窗口越小越适合看最近一次操作。</p>
          </div>
          <Space wrap>
            <Select
              value={summaryLimit}
              options={summaryLimitOptions}
              style={{ width: 140 }}
              onChange={setSummaryLimit}
            />
            <Button icon={<ReloadOutlined spin={loadingLogs} />} loading={loadingLogs} onClick={loadLogs}>
              刷新摘要
            </Button>
          </Space>
        </div>
      </Card>

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>K线导入</h2>
            <p>默认通过后端 K线 Provider 拉取数据；手动 JSON 导入保留为高级兜底入口。</p>
          </div>
          <div className="stock-market-actions">
            <Space wrap>
              <Select value={syncMode} options={syncModeOptions} onChange={setSyncMode} style={{ width: 120 }} />
              <Input
                value={symbol}
                disabled={syncMode === 'batch'}
                onChange={event => setSymbol(event.target.value)}
                placeholder="600519"
                prefix={<SearchOutlined />}
                style={{ width: 160 }}
              />
              <Checkbox checked={manualImport} onChange={event => setManualImport(event.target.checked)}>
                手动导入
              </Checkbox>
              {manualImport ? (
                <Button onClick={() => setPayload(sampleKLines)}>
                  示例
                </Button>
              ) : null}
            </Space>
          </div>
        </div>
        {manualImport ? (
          <Input.TextArea
            value={payload}
            onChange={event => setPayload(event.target.value)}
            rows={10}
            spellCheck={false}
            placeholder="粘贴 StockKLine JSON 数组"
          />
        ) : (
          <Alert
            type="info"
            showIcon
            message={syncMode === 'single' ? '将调用单只标的 Provider 同步' : '将按后端配置的 klineSyncSymbols 批量同步'}
          />
        )}
      </Card>

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>同步日志</h2>
            <p>日志来自 MongoDB，可按标的、状态和窗口过滤最近同步记录。</p>
          </div>
          <div className="stock-market-actions">
            <Space wrap>
              <Input
                value={logSymbol}
                onChange={event => setLogSymbol(event.target.value)}
                onPressEnter={loadLogs}
                placeholder="过滤股票代码"
                prefix={<SearchOutlined />}
                style={{ width: 180 }}
              />
              <Select
                value={logStatus}
                options={syncStatusOptions}
                style={{ width: 120 }}
                onChange={setLogStatus}
              />
              <Select
                value={logLimit}
                options={summaryLimitOptions}
                style={{ width: 140 }}
                onChange={setLogLimit}
              />
              <Button icon={<ReloadOutlined spin={loadingLogs} />} loading={loadingLogs} onClick={loadLogs}>
                刷新日志
              </Button>
            </Space>
          </div>
        </div>
        <Table
          rowKey={record => record.id || `${record.jobName}-${record.startedAt}`}
          columns={columns}
          dataSource={logs}
          loading={loadingLogs}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: '暂无同步日志。' }}
          scroll={{ x: 1080 }}
          rowClassName="stock-quote-row"
        />
      </Card>
    </LifePageShell>
  );
};

const parseKLineRows = (value: string): StockKLine[] => {
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('K线 JSON 必须是数组');
  }
  return parsed as StockKLine[];
};

const syncLogKey = (record: StockKLineSyncLog) => record.id || `${record.jobName}-${record.symbol}-${record.startedAt}`;

const statusColor = (value?: string) => {
  if (value === 'SUCCESS') {
    return 'green';
  }
  if (value === 'FAILED') {
    return 'red';
  }
  if (value === 'SKIPPED') {
    return 'orange';
  }
  return 'blue';
};

const formatTime = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return new Date(value).toLocaleString();
};

const formatRate = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return `${value.toFixed(2)}%`;
};

const formatDuration = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  if (value < 1000) {
    return `${value}ms`;
  }
  if (value < 60000) {
    return `${(value / 1000).toFixed(1)}s`;
  }
  return `${(value / 60000).toFixed(1)}m`;
};

export default LifeStockSyncPage;
