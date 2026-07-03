import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Checkbox, Input, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import { stockApi, type StockKLine, type StockKLineSyncLog } from '../services/api';

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

const LifeStockSyncPage = () => {
  const [searchParams] = useSearchParams();
  const initialSymbol = searchParams.get('symbol') || '600519';
  const [symbol, setSymbol] = useState(initialSymbol);
  const [logSymbol, setLogSymbol] = useState(searchParams.get('logSymbol') || searchParams.get('symbol') || '');
  const [syncMode, setSyncMode] = useState<'single' | 'batch'>(searchParams.get('mode') === 'batch' ? 'batch' : 'single');
  const [manualImport, setManualImport] = useState(false);
  const [payload, setPayload] = useState(sampleKLines);
  const [logs, setLogs] = useState<StockKLineSyncLog[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [retryingLogKey, setRetryingLogKey] = useState<string>();
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    setError(undefined);
    try {
      const data = await stockApi.klineSyncLogs(logSymbol.trim() || undefined);
      setLogs(data);
    } catch (requestError) {
      console.error('获取K线同步日志失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '获取K线同步日志失败');
    } finally {
      setLoadingLogs(false);
    }
  }, [logSymbol]);

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
    if (!record.symbol) {
      setError('批量同步日志暂不支持按单条重试');
      return;
    }
    const logKey = syncLogKey(record);
    setRetryingLogKey(logKey);
    setError(undefined);
    setSuccess(undefined);
    try {
      const saved = await stockApi.syncKlines(record.symbol);
      setSuccess(`已重试 ${record.symbol}，保存 ${saved.length} 条K线`);
      await loadLogs();
    } catch (requestError) {
      console.error('重试K线同步失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '重试K线同步失败');
    } finally {
      setRetryingLogKey(undefined);
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
      render: (_, record) => record.status === 'FAILED' && record.symbol ? (
        <Button
          type="link"
          loading={retryingLogKey === syncLogKey(record)}
          onClick={() => retrySyncLog(record)}
        >
          重试
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
        <Button type="primary" icon={<SyncOutlined spin={syncing} />} loading={syncing} onClick={syncKLines}>
          执行同步
        </Button>
      }
    >
      {error ? <Alert type="error" showIcon message={error} className="stock-market-alert" /> : null}
      {success ? <Alert type="success" showIcon message={success} className="stock-market-alert" /> : null}

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
            <p>日志来自 MongoDB，可按标的过滤最近 50 条同步记录。</p>
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

export default LifeStockSyncPage;
