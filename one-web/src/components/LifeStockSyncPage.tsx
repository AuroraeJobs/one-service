import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Checkbox, Input, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import MetricCard from './MetricCard';
import MetricGrid from './MetricGrid';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
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

const LifeStockSyncPage = () => {
  const [searchParams] = useSearchParams();
  const { isEnglish } = useAppPreferences();
  const text = {
    loadLogsFailed: isEnglish ? 'Failed to load K-line sync logs' : '获取K线同步日志失败',
    syncSuccess: (manualImport: boolean, count: number) => isEnglish
      ? `${manualImport ? 'Import' : 'Provider sync'} completed. Saved ${count} K-line row(s).`
      : `${manualImport ? '导入' : 'Provider 同步'}完成，保存 ${count} 条K线`,
    syncFailed: isEnglish ? 'Failed to sync K-lines' : '同步K线失败',
    retrySymbolSuccess: (symbolValue: string, count: number) => isEnglish
      ? `Retried ${symbolValue}. Saved ${count} K-line row(s).`
      : `已重试 ${symbolValue}，保存 ${count} 条K线`,
    retryBatchSuccess: (count: number) => isEnglish
      ? `Retried configured batch sync. Saved ${count} K-line row(s).`
      : `已重试配置批量同步，保存 ${count} 条K线`,
    retryFailed: isEnglish ? 'Failed to retry K-line sync' : '重试K线同步失败',
    scheduledSuccess: (status?: string, count?: number) => isEnglish
      ? `Scheduled sync semantic task triggered. Status ${status || '-'}, saved ${count ?? 0} K-line row(s).`
      : `已触发定时同步语义任务，状态 ${status || '-'}，保存 ${count ?? 0} 条K线`,
    scheduledFailed: isEnglish ? 'Failed to trigger scheduled K-line sync' : '触发K线定时同步失败',
    job: isEnglish ? 'Job' : '任务',
    symbol: isEnglish ? 'Symbol' : '标的',
    batch: isEnglish ? 'Batch' : '批量',
    period: isEnglish ? 'Period' : '周期',
    status: isEnglish ? 'Status' : '状态',
    requestedSaved: isEnglish ? 'Requested/Saved' : '请求/保存',
    message: isEnglish ? 'Message' : '消息',
    started: isEnglish ? 'Started' : '开始',
    finished: isEnglish ? 'Finished' : '结束',
    action: isEnglish ? 'Action' : '操作',
    retry: isEnglish ? 'Retry' : '重试',
    retryBatch: isEnglish ? 'Retry Batch' : '批量重试',
    eyebrow: isEnglish ? 'Stock Sync' : '股票同步',
    title: isEnglish ? 'Review historical sync logs and import or fetch normalized K-lines through internal sync APIs.' : '查看历史数据同步日志，并通过内部同步接口拉取或导入标准化K线。',
    triggerScheduled: isEnglish ? 'Trigger Schedule' : '触发定时同步',
    executeSync: isEnglish ? 'Run Sync' : '执行同步',
    latestStatus: isEnglish ? 'Latest Status' : '最近状态',
    success: isEnglish ? 'Success' : '成功',
    failed: isEnglish ? 'Failed' : '失败',
    successRate: isEnglish ? 'Success Rate' : '成功率',
    failedRate: isEnglish ? 'Failed Rate' : '失败率',
    running: isEnglish ? 'Running' : '运行中',
    saved: isEnglish ? 'Saved' : '保存',
    latestDuration: isEnglish ? 'Latest Duration' : '最近耗时',
    averageDuration: isEnglish ? 'Average Duration' : '平均耗时',
    latestFinished: isEnglish ? 'Last Finished' : '最后完成',
    times: isEnglish ? 'time(s)' : '次',
    rows: isEnglish ? 'row(s)' : '条',
    latestJobDescription: (jobName?: string, generatedAt?: number) => isEnglish
      ? `Latest job: ${jobName || '-'}, summary generated: ${formatTime(generatedAt)}`
      : `最近任务：${jobName || '-'}，摘要生成：${formatTime(generatedAt)}`,
    summaryTitle: isEnglish ? 'Summary Window' : '摘要窗口',
    summaryDescription: isEnglish
      ? 'The summary aggregates recent sync logs. Larger windows show trends, smaller windows focus on the latest operation.'
      : '摘要按最近同步日志聚合，窗口越大越适合看趋势，窗口越小越适合看最近一次操作。',
    refreshSummary: isEnglish ? 'Refresh Summary' : '刷新摘要',
    importTitle: isEnglish ? 'K-Line Import' : 'K线导入',
    importDescription: isEnglish
      ? 'By default, data is fetched through the backend K-line provider. Manual JSON import remains available as an advanced fallback.'
      : '默认通过后端 K线 Provider 拉取数据；手动 JSON 导入保留为高级兜底入口。',
    manualImport: isEnglish ? 'Manual Import' : '手动导入',
    sample: isEnglish ? 'Sample' : '示例',
    payloadPlaceholder: isEnglish ? 'Paste a StockKLine JSON array' : '粘贴 StockKLine JSON 数组',
    singleSyncHint: isEnglish ? 'Single-symbol provider sync will be called' : '将调用单只标的 Provider 同步',
    batchSyncHint: isEnglish ? 'Batch sync will use backend klineSyncSymbols configuration' : '将按后端配置的 klineSyncSymbols 批量同步',
    logsTitle: isEnglish ? 'Sync Logs' : '同步日志',
    logsDescription: isEnglish ? 'Logs are stored in MongoDB and can be filtered by symbol, status, and recent window.' : '日志来自 MongoDB，可按标的、状态和窗口过滤最近同步记录。',
    symbolFilter: isEnglish ? 'Filter symbol' : '过滤股票代码',
    refreshLogs: isEnglish ? 'Refresh Logs' : '刷新日志',
    emptyLogs: isEnglish ? 'No sync logs yet.' : '暂无同步日志。',
    jsonArrayRequired: isEnglish ? 'K-line JSON must be an array' : 'K线 JSON 必须是数组'
  };
  const syncModeOptions = useMemo(() => buildSyncModeOptions(isEnglish), [isEnglish]);
  const summaryLimitOptions = useMemo(() => buildSummaryLimitOptions(isEnglish), [isEnglish]);
  const syncStatusOptions = useMemo(() => buildSyncStatusOptions(isEnglish), [isEnglish]);
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
      setError(requestError instanceof Error ? requestError.message : text.loadLogsFailed);
    } finally {
      setLoadingLogs(false);
    }
  }, [logSymbol, logStatus, logLimit, summaryLimit, text.loadLogsFailed]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const syncKLines = async () => {
    setSyncing(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const rows = manualImport ? parseKLineRows(payload, text.jsonArrayRequired) : undefined;
      const saved = syncMode === 'single'
        ? await stockApi.syncKlines(symbol.trim(), rows)
        : await stockApi.syncAllKlines(rows);
      setSuccess(text.syncSuccess(manualImport, saved.length));
      await loadLogs();
    } catch (requestError) {
      console.error('同步K线失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : text.syncFailed);
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
        ? text.retrySymbolSuccess(record.symbol, saved.length)
        : text.retryBatchSuccess(saved.length));
      await loadLogs();
    } catch (requestError) {
      console.error('重试K线同步失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : text.retryFailed);
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
      setSuccess(text.scheduledSuccess(log.status, log.savedCount));
      await loadLogs();
    } catch (requestError) {
      console.error('触发K线定时同步失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : text.scheduledFailed);
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
      title: text.job,
      dataIndex: 'jobName',
      key: 'jobName',
      render: value => value || '-'
    },
    {
      title: text.symbol,
      dataIndex: 'symbol',
      key: 'symbol',
      render: value => value ? (
        <Button type="link" onClick={() => openSymbolSync(value)}>
          {value}
        </Button>
      ) : <Tag>{text.batch}</Tag>
    },
    {
      title: text.period,
      dataIndex: 'period',
      key: 'period',
      render: value => value || '-'
    },
    {
      title: text.status,
      dataIndex: 'status',
      key: 'status',
      render: value => <Tag color={statusColor(value)}>{value || '-'}</Tag>
    },
    {
      title: text.requestedSaved,
      key: 'counts',
      align: 'right',
      render: (_, record) => `${record.requestedCount ?? 0} / ${record.savedCount ?? 0}`
    },
    {
      title: text.message,
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: value => value || '-'
    },
    {
      title: text.started,
      dataIndex: 'startedAt',
      key: 'startedAt',
      render: value => formatTime(value)
    },
    {
      title: text.finished,
      dataIndex: 'finishedAt',
      key: 'finishedAt',
      render: value => formatTime(value)
    },
    {
      title: text.action,
      key: 'action',
      fixed: 'right',
      width: 96,
      render: (_, record) => record.status === 'FAILED' ? (
        <Button
          type="link"
          loading={retryingLogKey === syncLogKey(record)}
          onClick={() => retrySyncLog(record)}
        >
          {record.symbol ? text.retry : text.retryBatch}
        </Button>
      ) : '-'
    }
  ];

  return (
    <LifePageShell
      className="life-investment-page"
      eyebrow={text.eyebrow}
      title={text.title}
      actions={
        <Space wrap>
          <Button icon={<SyncOutlined spin={triggeringScheduled} />} loading={triggeringScheduled} onClick={triggerScheduledSync}>
            {text.triggerScheduled}
          </Button>
          <Button type="primary" icon={<SyncOutlined spin={syncing} />} loading={syncing} onClick={syncKLines}>
            {text.executeSync}
          </Button>
        </Space>
      }
    >
      {error ? <Alert type="error" showIcon message={error} className="stock-market-alert" /> : null}
      {success ? <Alert type="success" showIcon message={success} className="stock-market-alert" /> : null}

      <MetricGrid gap={16} minColumnWidth={180}>
        <MetricCard title={text.latestStatus} value={summary?.latestStatus || '-'} accent={summary?.latestStatus === 'FAILED' ? '#f5222d' : '#34c759'} />
        <MetricCard title={text.success} value={summary?.successCount ?? 0} suffix={text.times} accent="#34c759" />
        <MetricCard title={text.failed} value={summary?.failedCount ?? 0} suffix={text.times} accent="#f5222d" />
        <MetricCard title={text.successRate} value={formatRate(summary?.successRate)} accent="#30d158" />
        <MetricCard title={text.failedRate} value={formatRate(summary?.failedRate)} accent="#ff3b30" />
        <MetricCard title={text.running} value={summary?.runningCount ?? 0} suffix={text.times} accent="#0071e3" />
        <MetricCard title={text.saved} value={summary?.savedCount ?? 0} suffix={text.rows} accent="#ff9500" />
        <MetricCard title={text.latestDuration} value={formatDuration(summary?.latestDurationMs)} accent="#00a6a6" />
        <MetricCard title={text.averageDuration} value={formatDuration(summary?.averageDurationMs)} accent="#bf5af2" />
        <MetricCard title={text.latestFinished} value={formatTime(summary?.latestFinishedAt)} accent="#5856d6" valueStyle={{ fontSize: 18 }} />
      </MetricGrid>

      {summary?.latestMessage ? (
        <Alert
          type={summary.latestStatus === 'FAILED' ? 'warning' : 'info'}
          showIcon
          message={summary.latestMessage}
          description={text.latestJobDescription(summary.latestJobName, summary.generatedAt)}
          className="stock-market-alert"
        />
      ) : null}

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>{text.summaryTitle}</h2>
            <p>{text.summaryDescription}</p>
          </div>
          <Space wrap>
            <Select
              value={summaryLimit}
              options={summaryLimitOptions}
              style={{ width: 140 }}
              onChange={setSummaryLimit}
            />
            <Button icon={<ReloadOutlined spin={loadingLogs} />} loading={loadingLogs} onClick={loadLogs}>
              {text.refreshSummary}
            </Button>
          </Space>
        </div>
      </Card>

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>{text.importTitle}</h2>
            <p>{text.importDescription}</p>
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
                {text.manualImport}
              </Checkbox>
              {manualImport ? (
                <Button onClick={() => setPayload(sampleKLines)}>
                  {text.sample}
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
            placeholder={text.payloadPlaceholder}
          />
        ) : (
          <Alert
            type="info"
            showIcon
            message={syncMode === 'single' ? text.singleSyncHint : text.batchSyncHint}
          />
        )}
      </Card>

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>{text.logsTitle}</h2>
            <p>{text.logsDescription}</p>
          </div>
          <div className="stock-market-actions">
            <Space wrap>
              <Input
                value={logSymbol}
                onChange={event => setLogSymbol(event.target.value)}
                onPressEnter={loadLogs}
                placeholder={text.symbolFilter}
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
                {text.refreshLogs}
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
          locale={{ emptyText: text.emptyLogs }}
          scroll={{ x: 1080 }}
          rowClassName="stock-quote-row"
        />
      </Card>
    </LifePageShell>
  );
};

const parseKLineRows = (value: string, message: string): StockKLine[] => {
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(message);
  }
  return parsed as StockKLine[];
};

const syncLogKey = (record: StockKLineSyncLog) => record.id || `${record.jobName}-${record.symbol}-${record.startedAt}`;

const buildSyncModeOptions = (isEnglish: boolean) => [
  { label: isEnglish ? 'Single Symbol' : '单只标的', value: 'single' },
  { label: isEnglish ? 'Configured Batch' : '配置批量', value: 'batch' }
];

const buildSummaryLimitOptions = (isEnglish: boolean) => [
  { label: isEnglish ? 'Latest 20' : '最近20条', value: 20 },
  { label: isEnglish ? 'Latest 50' : '最近50条', value: 50 },
  { label: isEnglish ? 'Latest 100' : '最近100条', value: 100 }
];

const buildSyncStatusOptions = (isEnglish: boolean) => [
  { label: isEnglish ? 'All Statuses' : '全部状态', value: '' },
  { label: isEnglish ? 'Success' : '成功', value: 'SUCCESS' },
  { label: isEnglish ? 'Failed' : '失败', value: 'FAILED' },
  { label: isEnglish ? 'Running' : '运行中', value: 'RUNNING' }
];

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
