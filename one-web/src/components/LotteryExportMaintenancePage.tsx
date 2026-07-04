import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Input, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined, ReloadOutlined, SafetyCertificateOutlined, ToolOutlined } from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import {
  lotteryExportApi,
  type LotteryAuditEvent,
  type LotteryExportResult,
  type LotteryMaintenanceCacheStatus,
  type LotteryMaintenanceCollectionStatus,
  type LotteryMaintenanceSummary
} from '../services/api';
import './LotteryOverviewPage.css';

const exportTypeOptions = [
  { label: '票据', value: 'tickets' },
  { label: '期次账本', value: 'ledger-issues' },
  { label: '预测快照', value: 'predictions' },
  { label: '策略实验', value: 'experiments' },
  { label: '回测报告', value: 'backtests' },
  { label: '同步日志', value: 'sync-logs' },
  { label: '探测日志', value: 'probe-logs' }
];

const formatDateTime = (timestamp?: number) => {
  if (!timestamp) {
    return '-';
  }
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp));
};

const toParams = (type: string, primaryFilter: string, limit: string) => {
  const params: Record<string, string | number | undefined> = {
    limit: Number(limit) > 0 ? Number(limit) : 500
  };
  const value = primaryFilter.trim();
  if (!value) {
    return params;
  }
  if (type === 'tickets' || type === 'ledger-issues') params.issue = value;
  if (type === 'predictions') params.targetPeriod = value;
  if (type === 'experiments' || type === 'backtests') params.strategyName = value;
  if (type === 'sync-logs') params.status = value;
  if (type === 'probe-logs') params.provider = value;
  return params;
};

const LotteryExportMaintenancePage = () => {
  const [exportType, setExportType] = useState('tickets');
  const [primaryFilter, setPrimaryFilter] = useState('');
  const [limit, setLimit] = useState('500');
  const [result, setResult] = useState<LotteryExportResult>();
  const [auditEvents, setAuditEvents] = useState<LotteryAuditEvent[]>([]);
  const [maintenance, setMaintenance] = useState<LotteryMaintenanceSummary>();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dryRunning, setDryRunning] = useState(false);
  const [error, setError] = useState<string>();

  const loadState = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [events, maintenanceSummary] = await Promise.all([
        lotteryExportApi.auditEvents({ limit: 20 }),
        lotteryExportApi.maintenanceSummary()
      ]);
      setAuditEvents(events || []);
      setMaintenance(maintenanceSummary);
    } catch (requestError) {
      console.error('读取彩票导出审计失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取彩票导出审计失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const runExport = async () => {
    setExporting(true);
    setError(undefined);
    try {
      const data = await lotteryExportApi.export(exportType, toParams(exportType, primaryFilter, limit));
      setResult(data);
      await loadState();
    } catch (requestError) {
      console.error('导出彩票数据失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '导出彩票数据失败');
    } finally {
      setExporting(false);
    }
  };

  const runDryRun = async () => {
    setDryRunning(true);
    setError(undefined);
    try {
      setMaintenance(await lotteryExportApi.cleanupDryRun());
    } catch (requestError) {
      console.error('执行彩票维护 dry-run 失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '执行彩票维护 dry-run 失败');
    } finally {
      setDryRunning(false);
    }
  };

  const auditColumns: ColumnsType<LotteryAuditEvent> = [
    { title: '类型', dataIndex: 'targetType', key: 'targetType', render: value => <Tag color="blue">{value || '-'}</Tag> },
    { title: '行数', dataIndex: 'rowCount', key: 'rowCount', align: 'right' },
    { title: '范围', dataIndex: 'requesterScope', key: 'requesterScope' },
    { title: '生成', dataIndex: 'generatedAt', key: 'generatedAt', render: value => formatDateTime(value) }
  ];

  const maintenanceColumns: ColumnsType<LotteryMaintenanceCollectionStatus> = [
    { title: '集合', dataIndex: 'collection', key: 'collection' },
    { title: '总量', dataIndex: 'totalCount', key: 'totalCount', align: 'right' },
    { title: '过期', dataIndex: 'staleCount', key: 'staleCount', align: 'right' },
    { title: '超量', dataIndex: 'oversizedBy', key: 'oversizedBy', align: 'right' },
    { title: '模式', dataIndex: 'cleanupSupported', key: 'cleanupSupported', render: value => <Tag color={value ? 'gold' : 'default'}>{value ? 'DRY-RUN' : 'REPORT'}</Tag> }
  ];

  const cacheColumns: ColumnsType<LotteryMaintenanceCacheStatus> = [
    { title: '缓存', dataIndex: 'cacheKey', key: 'cacheKey' },
    { title: '状态', dataIndex: 'present', key: 'present', render: value => <Tag color={value ? 'green' : 'default'}>{value ? 'PRESENT' : 'MISS'}</Tag> },
    { title: 'TTL', dataIndex: 'ttlSeconds', key: 'ttlSeconds', align: 'right', render: value => (value === undefined || value === null ? '-' : value) },
    { title: '过期', dataIndex: 'noExpiry', key: 'noExpiry', render: value => <Tag color={value ? 'gold' : 'default'}>{value ? 'NO TTL' : 'TTL'}</Tag> }
  ];

  const resultLines = useMemo(() => (result?.content || '').split('\n').slice(0, 12).join('\n'), [result?.content]);

  return (
    <LifePageShell
      className="lottery-prediction-page lottery-export-page"
      eyebrow="彩票数据"
      title="导出审计"
      actions={
        <Space wrap>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadState}>
            刷新
          </Button>
          <Button icon={<ToolOutlined />} loading={dryRunning} onClick={runDryRun}>
            Dry-run
          </Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}

      <Card className="life-panel-card lottery-clean-panel">
        <Space wrap>
          <Select value={exportType} onChange={setExportType} options={exportTypeOptions} style={{ width: 160 }} />
          <Input allowClear value={primaryFilter} onChange={event => setPrimaryFilter(event.target.value)} placeholder="过滤值" style={{ width: 180 }} />
          <Input value={limit} onChange={event => setLimit(event.target.value)} placeholder="行数" style={{ width: 96 }} />
          <Button type="primary" icon={<DownloadOutlined />} loading={exporting} onClick={runExport}>
            导出
          </Button>
        </Space>
      </Card>

      {result ? (
        <Card className="life-panel-card lottery-clean-panel" title={<Space><DownloadOutlined />{result.fileName}</Space>}>
          <Space wrap size="large">
            <span>类型 {result.exportType}</span>
            <span>行数 {result.rowCount || 0}</span>
            <span>生成 {formatDateTime(result.generatedAt)}</span>
          </Space>
          {resultLines ? <pre className="lottery-export-preview">{resultLines}</pre> : <Empty description="本次导出没有数据" />}
        </Card>
      ) : null}

      <section className="lottery-workbench-main-grid">
        <Card className="life-panel-card lottery-clean-panel" title={<Space><SafetyCertificateOutlined />审计事件</Space>}>
          <Table rowKey={record => record.id || record.targetId || `${record.targetType}-${record.generatedAt}`} columns={auditColumns} dataSource={auditEvents} loading={loading} pagination={{ pageSize: 6 }} />
        </Card>
        <Card className="life-panel-card lottery-clean-panel" title={<Space><ToolOutlined />维护预览</Space>}>
          <Table rowKey={record => record.collection || ''} columns={maintenanceColumns} dataSource={maintenance?.collections || []} loading={loading || dryRunning} pagination={false} size="small" />
          <Table className="lottery-maintenance-cache-table" rowKey={record => record.cacheKey || ''} columns={cacheColumns} dataSource={maintenance?.caches || []} loading={loading || dryRunning} pagination={false} size="small" />
        </Card>
      </section>
    </LifePageShell>
  );
};

export default LotteryExportMaintenancePage;
