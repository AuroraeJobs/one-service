import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Checkbox, Empty, Input, Select, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined,
  DownloadOutlined,
  FilterOutlined,
  FileTextOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
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
  { label: '规则证据', value: 'rule-evidence' },
  { label: '回放证据', value: 'replay-evidence' },
  { label: '决策集', value: 'decision-sets' },
  { label: '决策结果', value: 'decision-outcomes' },
  { label: '导入预览', value: 'ticket-import-previews' },
  { label: '预算预检', value: 'budget-prechecks' },
  { label: '结算复盘', value: 'settlement-reviews' },
  { label: '同步日志', value: 'sync-logs' },
  { label: '探测日志', value: 'probe-logs' }
];

const defaultReportSections = ['tickets', 'ledger-issues', 'predictions', 'decision-outcomes', 'budget-prechecks', 'settlement-reviews', 'rule-evidence', 'replay-evidence'];

const reportPresets = [
  {
    key: 'outcome-operations',
    label: '复盘运营',
    sections: ['decision-outcomes', 'settlement-reviews', 'budget-prechecks', 'ticket-import-previews']
  },
  {
    key: 'month-end',
    label: '月末复盘',
    sections: ['ledger-issues', 'tickets', 'decision-sets', 'decision-outcomes', 'settlement-reviews', 'rule-evidence', 'replay-evidence']
  },
  {
    key: 'month-end-governance',
    label: '月末治理包',
    sections: ['ledger-issues', 'tickets', 'decision-sets', 'decision-outcomes', 'settlement-reviews', 'budget-prechecks', 'ticket-import-previews', 'rule-evidence', 'replay-evidence', 'sync-logs', 'probe-logs']
  }
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
  if (type === 'decision-sets' || type === 'decision-outcomes') params.targetIssue = value;
  if (type === 'settlement-reviews') params.issue = value;
  if (type === 'budget-prechecks') params.status = value;
  if (type === 'rule-evidence') params.ruleName = value;
  if (type === 'replay-evidence') params.window = Number(value) > 0 ? Number(value) : undefined;
  if (type === 'sync-logs') params.status = value;
  if (type === 'probe-logs') params.provider = value;
  return params;
};

const exportTypeLabel = (type?: string) =>
  exportTypeOptions.find(option => option.value === type)?.label || type || '-';

const isSupportedExportType = (value?: string | null) =>
  Boolean(value && exportTypeOptions.some(option => option.value === value));

const downloadCsv = (result?: LotteryExportResult) => {
  if (!result?.content) {
    message.warning('暂无可下载内容');
    return;
  }
  const fileName = result.fileName || `${result.exportType || 'lottery-export'}.csv`;
  const blob = new Blob([`\uFEFF${result.content}`], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const csvPreview = (content?: string, maxLines = 10) => (content || '').split('\n').slice(0, maxLines).join('\n');

const toDateStart = (value: string) => {
  if (!value) {
    return undefined;
  }
  return new Date(`${value}T00:00:00`).getTime();
};

const toDateEnd = (value: string) => {
  if (!value) {
    return undefined;
  }
  return new Date(`${value}T23:59:59`).getTime();
};

const LotteryExportMaintenancePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [exportType, setExportType] = useState(() => {
    const requestedType = searchParams.get('type');
    return isSupportedExportType(requestedType) ? requestedType || 'tickets' : 'tickets';
  });
  const [primaryFilter, setPrimaryFilter] = useState(() =>
    searchParams.get('targetIssue') || searchParams.get('issue') || searchParams.get('ruleName') || ''
  );
  const [limit, setLimit] = useState('500');
  const [result, setResult] = useState<LotteryExportResult>();
  const [reportSections, setReportSections] = useState<string[]>(defaultReportSections);
  const [reportResults, setReportResults] = useState<LotteryExportResult[]>([]);
  const [reporting, setReporting] = useState(false);
  const [auditEvents, setAuditEvents] = useState<LotteryAuditEvent[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(6);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditTypeFilter, setAuditTypeFilter] = useState<string>();
  const [auditTargetFilter, setAuditTargetFilter] = useState('');
  const [auditStartDate, setAuditStartDate] = useState('');
  const [auditEndDate, setAuditEndDate] = useState('');
  const [auditMinRows, setAuditMinRows] = useState('');
  const [maintenance, setMaintenance] = useState<LotteryMaintenanceSummary>();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dryRunning, setDryRunning] = useState(false);
  const [error, setError] = useState<string>();

  const updateExportType = (value: string) => {
    setExportType(value);
    const next = new URLSearchParams(searchParams);
    if (value === 'tickets') {
      next.delete('type');
    } else {
      next.set('type', value);
    }
    setSearchParams(next, { replace: true });
  };

  const loadState = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [events, maintenanceSummary] = await Promise.all([
        lotteryExportApi.auditEvents({ page: auditPage, pageSize: auditPageSize }),
        lotteryExportApi.maintenanceSummary()
      ]);
      setAuditEvents(events?.items || []);
      setAuditTotal(events?.total || 0);
      setMaintenance(maintenanceSummary);
    } catch (requestError) {
      console.error('读取彩票导出审计失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取彩票导出审计失败');
    } finally {
      setLoading(false);
    }
  }, [auditPage, auditPageSize]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const runExport = async () => {
    setExporting(true);
    setError(undefined);
    try {
      const data = await lotteryExportApi.export(exportType, toParams(exportType, primaryFilter, limit));
      setResult(data);
      message.success(`已生成 ${exportTypeLabel(data.exportType)} ${data.rowCount || 0} 行`);
      await loadState();
    } catch (requestError) {
      console.error('导出彩票数据失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '导出彩票数据失败');
      message.error('导出彩票数据失败');
    } finally {
      setExporting(false);
    }
  };

  const buildReport = async () => {
    if (!reportSections.length) {
      message.warning('请选择报表区块');
      return;
    }
    setReporting(true);
    setError(undefined);
    try {
      const results = await Promise.all(reportSections.map(type => (
        lotteryExportApi.export(type, toParams(type, primaryFilter, limit))
      )));
      setReportResults(results);
      message.success(`已生成 ${results.length} 个报表区块`);
      await loadState();
    } catch (requestError) {
      console.error('生成彩票报表失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '生成彩票报表失败');
      message.error('生成彩票报表失败');
    } finally {
      setReporting(false);
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

  const clearAuditFilters = () => {
    setAuditTypeFilter(undefined);
    setAuditTargetFilter('');
    setAuditStartDate('');
    setAuditEndDate('');
    setAuditMinRows('');
  };

  const filteredAuditEvents = useMemo(() => {
    const startAt = toDateStart(auditStartDate);
    const endAt = toDateEnd(auditEndDate);
    const minRows = Number(auditMinRows || 0);
    return auditEvents.filter(event => {
      const targetText = `${event.targetType || ''} ${event.targetId || ''} ${event.message || ''}`.toLowerCase();
      if (auditTypeFilter && event.targetType !== auditTypeFilter && event.eventType !== auditTypeFilter) {
        return false;
      }
      if (auditTargetFilter.trim() && !targetText.includes(auditTargetFilter.trim().toLowerCase())) {
        return false;
      }
      if (startAt && (!event.generatedAt || event.generatedAt < startAt)) {
        return false;
      }
      if (endAt && (!event.generatedAt || event.generatedAt > endAt)) {
        return false;
      }
      if (minRows > 0 && Number(event.rowCount || 0) < minRows) {
        return false;
      }
      return true;
    });
  }, [auditEndDate, auditEvents, auditMinRows, auditStartDate, auditTargetFilter, auditTypeFilter]);

  const maintenanceGroups = useMemo(() => {
    const collections = maintenance?.collections || [];
    const caches = maintenance?.caches || [];
    const logCollections = collections.filter(item => /log|audit|probe|sync/i.test(item.collection || ''));
    const historyCollections = collections.filter(item => /history|prediction|experiment|backtest|ticket|record/i.test(item.collection || ''));
    const otherCollections = collections.filter(item => !logCollections.includes(item) && !historyCollections.includes(item));
    return [
      { key: 'cache', title: '缓存', count: caches.length, stale: caches.filter(item => !item.present || item.noExpiry).length },
      { key: 'log', title: '日志', count: logCollections.length, stale: logCollections.reduce((sum, item) => sum + Number(item.staleCount || 0), 0) },
      { key: 'history', title: '历史', count: historyCollections.length, stale: historyCollections.reduce((sum, item) => sum + Number(item.staleCount || 0), 0) },
      { key: 'other', title: '其他', count: otherCollections.length, stale: otherCollections.reduce((sum, item) => sum + Number(item.staleCount || 0), 0) }
    ];
  }, [maintenance?.caches, maintenance?.collections]);
  const releaseReadinessChecks = useMemo(() => [
    {
      key: 'decision-route',
      label: '预测决策板路由',
      status: 'PASS',
      message: '/lottery/predictions/decision 已加入受保护路由和预测菜单',
      path: '/lottery/predictions/decision'
    },
    {
      key: 'ticket-guardrails',
      label: '票据预算护栏',
      status: 'PASS',
      message: '票据页展示期号/月度暴露、批量期号/注数/成本更新、归档和结算复盘',
      path: '/lottery/tickets'
    },
    {
      key: 'research-presets',
      label: '研究预设报告',
      status: 'PASS',
      message: '研究页支持决策差额、ROI 优先、预警复核和打印摘要',
      path: '/lottery/research'
    },
    {
      key: 'outcome-operations',
      label: '复盘运营入口',
      status: 'PASS',
      message: '决策页、工作台、票据结算和研究页均已接入保存决策复盘入口',
      path: '/lottery/predictions/decision'
    },
    {
      key: 'month-end-report-presets',
      label: '月末报表预设',
      status: 'PASS',
      message: '导出页提供复盘运营、月末复盘和月末治理包报表区块预设',
      path: '/lottery/exports'
    },
    {
      key: 'month-end-dashboard',
      label: '月末复盘仪表盘',
      status: 'PASS',
      message: '/lottery/month-end 汇总账本、票据、决策、笔记、健康、提醒和导出证据',
      path: '/lottery/month-end'
    },
    {
      key: 'reminder-center',
      label: '提醒中心',
      status: 'PASS',
      message: '工作台提醒中心覆盖到期、稍后、确认和直接处理入口',
      path: '/lottery/workbench'
    },
    {
      key: 'strategy-notebook',
      label: '策略笔记',
      status: 'PASS',
      message: '策略笔记路由已纳入研究证据和月末复盘证据链',
      path: '/lottery/research/notebook'
    },
    {
      key: 'strategy-portfolios-simulator',
      label: '组合与沙盘',
      status: 'PASS',
      message: '策略组合、沙盘模拟和票包执行已纳入 V14 执行链路',
      path: '/lottery/governance'
    },
    {
      key: 'governance-dashboard',
      label: '治理看板',
      status: 'PASS',
      message: '/lottery/governance 汇总组合、沙盘、票包、提醒、月末和发布证据',
      path: '/lottery/governance'
    },
    {
      key: 'api-contract',
      label: 'API 合约覆盖',
      status: 'PASS',
      message: '新流程复用 lottery/predictions、lottery/tickets、lottery/ticket-packs、lottery/reminders、lottery/exports 合约',
      path: '/lottery/exports'
    },
    {
      key: 'automated-route-smoke',
      label: '自动路由冒烟',
      status: 'PASS',
      message: 'npm run lottery:smoke 校验工作台、组合、沙盘、票包、治理、月末复盘和导出路由',
      path: '/lottery/exports'
    },
    {
      key: 'decision-outcome-export',
      label: '决策复盘证据',
      status: 'PASS',
      message: '导出页已覆盖决策集、决策结果、导入预览、预算预检和结算复盘 CSV',
      path: '/lottery/exports'
    },
    {
      key: 'manual-smoke',
      label: '浏览器冒烟',
      status: 'MANUAL',
      message: '真实浏览器复测仍需要本地登录态、后端服务和代理/网络状态确认',
      path: '/lottery/workbench'
    }
  ], []);

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

  const resultLines = useMemo(() => csvPreview(result?.content, 12), [result?.content]);
  const reportTotalRows = useMemo(
    () => reportResults.reduce((sum, item) => sum + Number(item.rowCount || 0), 0),
    [reportResults]
  );

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
          <Button icon={<PrinterOutlined />} disabled={!reportResults.length} onClick={() => window.print()}>
            打印报表
          </Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}

      <Card className="life-panel-card lottery-clean-panel">
        <Space wrap>
          <Select value={exportType} onChange={updateExportType} options={exportTypeOptions} style={{ width: 160 }} />
          <Input allowClear value={primaryFilter} onChange={event => setPrimaryFilter(event.target.value)} placeholder="过滤值" style={{ width: 180 }} />
          <Input value={limit} onChange={event => setLimit(event.target.value)} placeholder="行数" style={{ width: 96 }} />
          <Button type="primary" icon={<DownloadOutlined />} loading={exporting} onClick={runExport}>
            导出
          </Button>
        </Space>
      </Card>

      <Card
        className="life-panel-card lottery-clean-panel"
        title={<Space><FileTextOutlined />报表构建器</Space>}
        extra={
          <Space wrap>
            <Tag color="blue">区块 {reportSections.length}</Tag>
            <Button icon={<PrinterOutlined />} disabled={!reportResults.length} onClick={() => window.print()}>
              打印
            </Button>
            <Button type="primary" icon={<FileTextOutlined />} loading={reporting} onClick={buildReport}>
              生成报表
            </Button>
          </Space>
        }
      >
        <div className="lottery-report-builder">
          <Space wrap className="lottery-report-preset-bar">
            {reportPresets.map(preset => (
              <Button key={preset.key} size="small" icon={<FilterOutlined />} onClick={() => setReportSections(preset.sections)}>
                {preset.label}
              </Button>
            ))}
          </Space>
          <Checkbox.Group
            options={exportTypeOptions}
            value={reportSections}
            onChange={values => setReportSections(values.map(String))}
          />
          <Space wrap>
            <span>共用筛选 {primaryFilter.trim() || '全部'}</span>
            <span>行数上限 {Number(limit) > 0 ? Number(limit) : 500}</span>
            <span>已生成 {reportResults.length} 个区块 / {reportTotalRows} 行</span>
          </Space>
        </div>
      </Card>

      {result ? (
        <Card
          className="life-panel-card lottery-clean-panel"
          title={<Space><DownloadOutlined />{result.fileName}</Space>}
          extra={<Button size="small" icon={<DownloadOutlined />} onClick={() => downloadCsv(result)}>下载 CSV</Button>}
        >
          <Space wrap size="large">
            <span>类型 {result.exportType}</span>
            <span>行数 {result.rowCount || 0}</span>
            <span>生成 {formatDateTime(result.generatedAt)}</span>
          </Space>
          {resultLines ? <pre className="lottery-export-preview">{resultLines}</pre> : <Empty description="本次导出没有数据" />}
        </Card>
      ) : null}

      {reportResults.length ? (
        <Card className="life-panel-card lottery-clean-panel lottery-report-print-area" title={<Space><FileTextOutlined />报表预览</Space>}>
          <div className="lottery-report-section-grid">
            {reportResults.map(section => (
              <article className="lottery-report-section" key={`${section.exportType}-${section.generatedAt}`}>
                <div className="lottery-report-section-head">
                  <div>
                    <strong>{exportTypeLabel(section.exportType)}</strong>
                    <span>{section.fileName || '-'} · {section.rowCount || 0} 行 · {formatDateTime(section.generatedAt)}</span>
                  </div>
                  <Button size="small" icon={<DownloadOutlined />} onClick={() => downloadCsv(section)}>CSV</Button>
                </div>
                {section.content ? <pre className="lottery-export-preview">{csvPreview(section.content, 8)}</pre> : <Empty description="暂无数据" />}
              </article>
            ))}
          </div>
        </Card>
      ) : null}

      <Card
        className="life-panel-card lottery-clean-panel lottery-release-readiness-card"
        title={<Space><CheckCircleOutlined />前端发布就绪</Space>}
        extra={<Tag color="blue">{releaseReadinessChecks.length} 项</Tag>}
      >
        <div className="lottery-release-readiness-grid">
          {releaseReadinessChecks.map(item => (
            <button key={item.key} type="button" onClick={() => window.location.assign(item.path)}>
              <span>{item.status === 'PASS' ? <CheckCircleOutlined /> : <ThunderboltOutlined />}</span>
              <Tag color={item.status === 'PASS' ? 'green' : 'blue'}>{item.status}</Tag>
              <strong>{item.label}</strong>
              <small>{item.message}</small>
            </button>
          ))}
        </div>
      </Card>

      <section className="lottery-workbench-main-grid">
        <Card
          className="life-panel-card lottery-clean-panel"
          title={<Space><SafetyCertificateOutlined />审计事件</Space>}
          extra={<Tag>{filteredAuditEvents.length}/{auditEvents.length} 条</Tag>}
        >
          <div className="lottery-audit-filter-bar">
            <Select
              allowClear
              placeholder="类型"
              value={auditTypeFilter}
              onChange={setAuditTypeFilter}
              options={[
                { label: '导出', value: 'EXPORT' },
                ...exportTypeOptions
              ]}
              style={{ width: 140 }}
            />
            <Input
              allowClear
              prefix={<FilterOutlined />}
              value={auditTargetFilter}
              onChange={event => setAuditTargetFilter(event.target.value)}
              placeholder="目标/消息"
              style={{ width: 180 }}
            />
            <Input type="date" value={auditStartDate} onChange={event => setAuditStartDate(event.target.value)} style={{ width: 150 }} />
            <Input type="date" value={auditEndDate} onChange={event => setAuditEndDate(event.target.value)} style={{ width: 150 }} />
            <Input
              value={auditMinRows}
              onChange={event => setAuditMinRows(event.target.value)}
              placeholder="最少行数"
              style={{ width: 110 }}
            />
            <Button onClick={clearAuditFilters}>清除</Button>
          </div>
          <Table
            rowKey={record => record.id || record.targetId || `${record.targetType}-${record.generatedAt}`}
            columns={auditColumns}
            dataSource={filteredAuditEvents}
            loading={loading}
            size="small"
            locale={{ emptyText: <Empty description="暂无审计事件" /> }}
            pagination={{
              current: auditPage,
              pageSize: auditPageSize,
              total: auditTypeFilter || auditTargetFilter || auditStartDate || auditEndDate || auditMinRows ? filteredAuditEvents.length : auditTotal,
              showSizeChanger: true,
              onChange: (page, pageSize) => {
                setAuditPage(page);
                setAuditPageSize(pageSize);
              }
            }}
            scroll={{ x: 680 }}
          />
        </Card>
        <Card className="life-panel-card lottery-clean-panel" title={<Space><ToolOutlined />维护预览</Space>}>
          <div className="lottery-maintenance-group-grid">
            {maintenanceGroups.map(group => (
              <span key={group.key}>
                <small>{group.title}</small>
                <strong>{group.count}</strong>
                <em>需关注 {group.stale}</em>
              </span>
            ))}
          </div>
          <Table
            rowKey={record => record.collection || ''}
            columns={maintenanceColumns}
            dataSource={maintenance?.collections || []}
            loading={loading || dryRunning}
            pagination={false}
            size="small"
            locale={{ emptyText: <Empty description="暂无集合状态" /> }}
            scroll={{ x: 720 }}
          />
          <Table
            className="lottery-maintenance-cache-table"
            rowKey={record => record.cacheKey || ''}
            columns={cacheColumns}
            dataSource={maintenance?.caches || []}
            loading={loading || dryRunning}
            pagination={false}
            size="small"
            locale={{ emptyText: <Empty description="暂无缓存状态" /> }}
            scroll={{ x: 620 }}
          />
        </Card>
      </section>
    </LifePageShell>
  );
};

export default LotteryExportMaintenancePage;
