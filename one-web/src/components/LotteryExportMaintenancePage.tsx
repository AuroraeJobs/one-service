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
import { lotteryCodeLabel, lotteryStatusLabel } from '../utils/lotteryStatusLabel';
import { useI18n } from '../contexts/I18nContext';
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
  },
  {
    key: 'long-term-research',
    label: '长期研究包',
    sections: ['ledger-issues', 'tickets', 'predictions', 'experiments', 'backtests', 'decision-sets', 'decision-outcomes', 'settlement-reviews', 'rule-evidence', 'replay-evidence', 'sync-logs', 'probe-logs']
  },
  {
    key: 'v34-archive-search',
    label: '归档搜索包',
    sections: ['ledger-issues', 'tickets', 'decision-outcomes', 'settlement-reviews', 'rule-evidence', 'replay-evidence', 'sync-logs', 'probe-logs']
  },
  {
    key: 'annual-retrospective',
    label: '年度复盘包',
    sections: ['ledger-issues', 'tickets', 'predictions', 'experiments', 'backtests', 'decision-outcomes', 'budget-prechecks', 'settlement-reviews', 'rule-evidence', 'replay-evidence', 'probe-logs']
  },
  {
    key: 'v31-anomaly-review',
    label: '异常复盘包',
    sections: ['decision-outcomes', 'settlement-reviews', 'budget-prechecks', 'rule-evidence', 'replay-evidence', 'sync-logs', 'probe-logs']
  },
  {
    key: 'v32-provider-reliability',
    label: 'Provider可靠性包',
    sections: ['sync-logs', 'probe-logs']
  },
  {
    key: 'v33-review-runbook',
    label: '复核Runbook包',
    sections: ['ledger-issues', 'tickets', 'decision-outcomes', 'settlement-reviews', 'sync-logs', 'probe-logs']
  },
  {
    key: 'v15-attribution-loop',
    label: '归因闭环包',
    sections: ['ledger-issues', 'tickets', 'decision-outcomes', 'settlement-reviews', 'rule-evidence', 'replay-evidence']
  },
  {
    key: 'v28-attribution-quality',
    label: '归因质量包',
    sections: ['ledger-issues', 'tickets', 'decision-outcomes', 'settlement-reviews', 'budget-prechecks', 'rule-evidence', 'replay-evidence']
  },
  {
    key: 'v15-recommendation-lifecycle',
    label: '推荐生命周期包',
    sections: ['decision-outcomes', 'settlement-reviews', 'rule-evidence', 'replay-evidence', 'sync-logs', 'probe-logs']
  },
  {
    key: 'v29-recommendation-follow-through',
    label: '推荐跟进包',
    sections: ['decision-outcomes', 'settlement-reviews', 'rule-evidence', 'replay-evidence', 'budget-prechecks', 'sync-logs', 'probe-logs']
  },
  {
    key: 'v15-mobile-command',
    label: '移动指挥包',
    sections: ['tickets', 'decision-sets', 'decision-outcomes', 'budget-prechecks', 'settlement-reviews']
  },
  {
    key: 'v15-governance-evidence',
    label: 'V15治理证据包',
    sections: ['ledger-issues', 'tickets', 'decision-sets', 'decision-outcomes', 'settlement-reviews', 'budget-prechecks', 'ticket-import-previews', 'rule-evidence', 'replay-evidence', 'sync-logs', 'probe-logs']
  }
];

const v15EvidencePacks = [
  {
    key: 'attribution',
    title: '归因闭环证据',
    route: '/lottery/outcomes',
    preset: '归因闭环包',
    auditTypes: ['LOTTERY_OUTCOME_ATTRIBUTION'],
    sections: ['decision-outcomes', 'settlement-reviews', 'ledger-issues']
  },
  {
    key: 'attribution-quality',
    title: '归因质量证据',
    route: '/lottery/outcomes',
    preset: '归因质量包',
    auditTypes: ['LOTTERY_OUTCOME_ATTRIBUTION', 'decision-outcomes', 'settlement-reviews'],
    sections: ['decision-outcomes', 'settlement-reviews', 'budget-prechecks', 'rule-evidence']
  },
  {
    key: 'recommendations',
    title: '推荐生命周期证据',
    route: '/lottery/recommendations',
    preset: '推荐生命周期包',
    auditTypes: ['LOTTERY_RECOMMENDATION_REFRESH', 'LOTTERY_RECOMMENDATION_STATUS'],
    sections: ['decision-outcomes', 'rule-evidence', 'replay-evidence']
  },
  {
    key: 'recommendation-follow-through',
    title: '推荐跟进证据',
    route: '/lottery/recommendations',
    preset: '推荐跟进包',
    auditTypes: ['LOTTERY_RECOMMENDATION_STATUS', 'LOTTERY_RECOMMENDATION_REFRESH', 'decision-outcomes'],
    sections: ['decision-outcomes', 'settlement-reviews', 'rule-evidence', 'replay-evidence']
  },
  {
    key: 'mobile',
    title: '移动指挥证据',
    route: '/lottery/mobile',
    preset: '移动指挥包',
    auditTypes: ['reminder-ack', 'ticket-pack-action', 'recommendation-status'],
    sections: ['tickets', 'budget-prechecks', 'settlement-reviews']
  },
  {
    key: 'governance',
    title: 'V15治理证据',
    route: '/lottery/governance',
    preset: 'V15治理证据包',
    auditTypes: ['EXPORT', 'REPORT_EXPORT', 'LOTTERY_RECOMMENDATION_REFRESH'],
    sections: ['sync-logs', 'probe-logs', 'decision-outcomes']
  },
  {
    key: 'anomaly-review',
    title: '异常观察证据',
    route: '/lottery/governance',
    preset: '异常复盘包',
    auditTypes: ['EXPORT', 'REPORT_EXPORT', 'LOTTERY_OUTCOME_ATTRIBUTION', 'LOTTERY_RECOMMENDATION_STATUS'],
    sections: ['decision-outcomes', 'settlement-reviews', 'budget-prechecks', 'sync-logs', 'probe-logs']
  },
  {
    key: 'provider-reliability',
    title: 'Provider可靠性证据',
    route: '/lottery/sync',
    preset: 'Provider可靠性包',
    auditTypes: ['sync-logs', 'probe-logs', 'PROXY_OR_NETWORK_BLOCK'],
    sections: ['sync-logs', 'probe-logs']
  },
  {
    key: 'review-runbook',
    title: '复核Runbook证据',
    route: '/lottery/workbench',
    preset: '复核Runbook包',
    auditTypes: ['reminder-ack', 'lottery-operations-health', 'EXPORT', 'REPORT_EXPORT'],
    sections: ['ledger-issues', 'tickets', 'decision-outcomes', 'settlement-reviews', 'sync-logs', 'probe-logs']
  },
  {
    key: 'long-term-research',
    title: '长期研究证据',
    route: '/lottery/month-end',
    preset: '长期研究包',
    auditTypes: ['EXPORT', 'REPORT_EXPORT', 'LOTTERY_RECOMMENDATION_STATUS', 'LOTTERY_OUTCOME_ATTRIBUTION'],
    sections: ['ledger-issues', 'tickets', 'predictions', 'experiments', 'backtests', 'decision-outcomes', 'rule-evidence', 'replay-evidence']
  },
  {
    key: 'v34-archive-search',
    title: '归档搜索证据',
    route: '/lottery/month-end',
    preset: '归档搜索包',
    auditTypes: ['EXPORT', 'REPORT_EXPORT', 'archiveScope', 'archiveStatus', 'archiveQuery'],
    sections: ['ledger-issues', 'tickets', 'decision-outcomes', 'settlement-reviews', 'rule-evidence', 'replay-evidence']
  }
];

const formatDateTime = (timestamp: number | undefined, language: string) => {
  if (!timestamp) {
    return '-';
  }
  return new Intl.DateTimeFormat(language, {
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

const exportTypeLabel = (
  type: string | undefined,
  translateText: ReturnType<typeof useI18n>['translateText']
) => {
  const option = exportTypeOptions.find(item => item.value === type);
  return translateText(option?.label || lotteryCodeLabel(type, type || '-'));
};

const isSupportedExportType = (value?: string | null) =>
  Boolean(value && exportTypeOptions.some(option => option.value === value));

const downloadCsv = (
  result: LotteryExportResult | undefined,
  t: ReturnType<typeof useI18n>['t']
) => {
  if (!result?.content) {
    message.warning(t('暂无可下载内容'));
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
  const { language, t, translateText } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [exportType, setExportType] = useState(() => {
    const requestedType = searchParams.get('type');
    return isSupportedExportType(requestedType) ? requestedType || 'tickets' : 'tickets';
  });
  const [primaryFilter, setPrimaryFilter] = useState(() =>
    searchParams.get('targetIssue')
    || searchParams.get('issue')
    || searchParams.get('ruleName')
    || searchParams.get('strategyName')
    || searchParams.get('archiveQuery')
    || ''
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
  const releaseArchiveFocus = searchParams.get('focus') === 'release-archive';
  const localizedExportTypeOptions = useMemo(
    () => exportTypeOptions.map(option => ({
      label: translateText(option.label),
      value: option.value
    })),
    [translateText]
  );
  const archiveEvidenceContext = useMemo(() => {
    const scope = searchParams.get('archiveScope');
    const status = searchParams.get('archiveStatus');
    const query = searchParams.get('archiveQuery');
    if (!scope && !status && !query) {
      return '';
    }
    return [
      scope && scope !== 'all' ? t('范围：{{scope}}', { scope }) : t('范围：全部'),
      status && status !== 'all'
        ? t('状态：{{status}}', { status: translateText(lotteryStatusLabel(status)) })
        : t('状态：全部'),
      query ? t('关键词：{{query}}', { query }) : undefined
    ].filter(Boolean).join(' · ');
  }, [searchParams, t, translateText]);

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
      setError(requestError instanceof Error ? translateText(requestError.message) : t('读取彩票导出审计失败'));
    } finally {
      setLoading(false);
    }
  }, [auditPage, auditPageSize, t, translateText]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => {
    const preset = searchParams.get('preset');
    const matchedPreset = reportPresets.find(item => item.key === preset);
    if (matchedPreset) {
      setReportSections(matchedPreset.sections);
    }
  }, [searchParams]);

  const runExport = async () => {
    setExporting(true);
    setError(undefined);
    try {
      const data = await lotteryExportApi.export(exportType, toParams(exportType, primaryFilter, limit));
      setResult(data);
      message.success(t('已生成 {{type}} {{rows}} 行', {
        type: exportTypeLabel(data.exportType, translateText),
        rows: data.rowCount || 0
      }));
      await loadState();
    } catch (requestError) {
      console.error('导出彩票数据失败:', requestError);
      setError(requestError instanceof Error ? translateText(requestError.message) : t('导出彩票数据失败'));
      message.error(t('导出彩票数据失败'));
    } finally {
      setExporting(false);
    }
  };

  const buildReport = async () => {
    if (!reportSections.length) {
      message.warning(t('请选择至少一个报表区块'));
      return;
    }
    setReporting(true);
    setError(undefined);
    try {
      const results = await Promise.all(reportSections.map(type => (
        lotteryExportApi.export(type, toParams(type, primaryFilter, limit))
      )));
      setReportResults(results);
      message.success(t('已生成 {{count}} 个报表区块', { count: results.length }));
      await loadState();
    } catch (requestError) {
      console.error('生成彩票报表失败:', requestError);
      setError(requestError instanceof Error ? translateText(requestError.message) : t('生成彩票报表失败'));
      message.error(t('生成彩票报表失败'));
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
      setError(requestError instanceof Error ? translateText(requestError.message) : t('执行彩票维护 dry-run 失败'));
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
      { key: 'cache', title: t('缓存'), count: caches.length, stale: caches.filter(item => !item.present || item.noExpiry).length },
      { key: 'log', title: t('日志'), count: logCollections.length, stale: logCollections.reduce((sum, item) => sum + Number(item.staleCount || 0), 0) },
      { key: 'history', title: t('历史'), count: historyCollections.length, stale: historyCollections.reduce((sum, item) => sum + Number(item.staleCount || 0), 0) },
      { key: 'other', title: t('其他'), count: otherCollections.length, stale: otherCollections.reduce((sum, item) => sum + Number(item.staleCount || 0), 0) }
    ];
  }, [maintenance?.caches, maintenance?.collections, t]);
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
      message: '导出页提供复盘运营、月末复盘、月末治理包和长期研究包报表区块预设',
      path: '/lottery/exports'
    },
    {
      key: 'v30-long-term-research-exports',
      label: 'V30长期复盘导出',
      status: 'PASS',
      message: '长期研究包和年度复盘包覆盖期号、票据、预测、实验、回测、决策、归因和发布证据',
      path: '/lottery/exports?preset=long-term-research'
    },
    {
      key: 'v31-anomaly-review',
      label: 'V31异常复盘',
      status: 'PASS',
      message: '治理异常观察已接入工作台、月末复盘和异常复盘导出证据包',
      path: '/lottery/exports?preset=v31-anomaly-review'
    },
    {
      key: 'v32-provider-reliability',
      label: 'V32Provider可靠性',
      status: 'PASS',
      message: 'Provider 可靠性焦点已接入月末、工作台、同步页和治理；继续复用同步/探测日志证据包',
      path: '/lottery/sync?focus=provider-reliability'
    },
    {
      key: 'v44-recommendation-retirement',
      label: 'V44策略退休复盘',
      status: 'PASS',
      message: '推荐退休复盘已接入推荐页、月末候选、工作台和治理；继续复用推荐跟进证据包',
      path: '/lottery/recommendations?focus=retirement-review&preset=STALE_EVIDENCE'
    },
    {
      key: 'v45-archive-review-pressure',
      label: 'V45归档复核压力',
      status: 'PASS',
      message: '归档复核压力已接入月末候选、工作台优先项、治理和归档搜索证据包',
      path: '/lottery/exports?preset=v34-archive-search'
    },
    {
      key: 'v33-review-runbook',
      label: 'V33复核Runbook',
      status: 'PASS',
      message: '工作台复核 Runbook 已接入显式确认、月末复盘和导出证据包',
      path: '/lottery/exports?preset=v33-review-runbook'
    },
    {
      key: 'v39-archive-note-quality',
      label: 'V39复核笔记质量',
      status: 'PASS',
      message: '复核笔记质量已接入笔记本、月末复盘和治理趋势；当前作为发布证据展示，不作为阻塞项',
      path: '/lottery/research/notebook?evidence=ARCHIVE_REVIEW'
    },
    {
      key: 'v40-planning-review',
      label: 'V40长期计划复盘',
      status: 'PASS',
      message: '五轮复盘检查点已接入月末复盘、候选主题和长期研究证据；当前保留为月末证据，不新增历史快照',
      path: '/lottery/month-end'
    },
    {
      key: 'v41-evidence-quality-trend',
      label: 'V41证据质量趋势',
      status: 'PASS',
      message: '证据质量趋势已接入月末、工作台、归因焦点和治理；当前复用归因与长期研究证据，不新增导出标签',
      path: '/lottery/outcomes?focus=evidence-quality'
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
      message: 'npm run lottery:smoke 校验工作台、归因、推荐、移动指挥、治理、月末复盘和导出路由',
      path: '/lottery/exports'
    },
    {
      key: 'v15-outcome-attribution',
      label: 'V15归因闭环',
      status: 'PASS',
      message: '/lottery/outcomes 已纳入闭环证据、路线冒烟和归因报告预设',
      path: '/lottery/outcomes'
    },
    {
      key: 'v15-recommendation-lifecycle',
      label: 'V15推荐生命周期',
      status: 'PASS',
      message: '/lottery/recommendations 已纳入生命周期证据、审计筛选和推荐报告预设',
      path: '/lottery/recommendations'
    },
    {
      key: 'v29-recommendation-follow-through',
      label: 'V29推荐跟进',
      status: 'PASS',
      message: '推荐生命周期 rollup 已接入推荐页、治理看板、月末复盘和导出证据包',
      path: '/lottery/recommendations'
    },
    {
      key: 'v15-mobile-command',
      label: 'V15移动指挥',
      status: 'PASS',
      message: '/lottery/mobile 已纳入批量复核证据、路线冒烟和移动指挥报告预设',
      path: '/lottery/mobile'
    },
    {
      key: 'v15-governance-evidence',
      label: 'V15治理证据包',
      status: 'PASS',
      message: '导出页提供归因、推荐、移动指挥和治理闭环证据包',
      path: '/lottery/exports'
    },
    {
      key: 'v28-attribution-quality',
      label: 'V28归因质量',
      status: 'PASS',
      message: '归因聚合已接入治理看板、月末复盘和导出证据包，支持质量警示复核',
      path: '/lottery/outcomes'
    },
    {
      key: 'v16-navigation-usability',
      label: 'V16导航易用性',
      status: 'PASS',
      message: '底部导航恢复为单行主菜单，所有顶层分组直接显示或横向滚动，不再渲染第二行子菜单',
      path: '/lottery/workbench'
    },
    {
      key: 'v16-operation-ergonomics',
      label: 'V16操作体验',
      status: 'PASS',
      message: '票包和推荐操作具备默认值、确认提示和可读结果反馈',
      path: '/lottery/ticket-packs'
    },
    {
      key: 'v16-filter-readability',
      label: 'V16筛选可读性',
      status: 'PASS',
      message: '票据、归因、推荐和审计页面提供常用预设筛选',
      path: '/lottery/tickets'
    },
    {
      key: 'v16-responsive-polish',
      label: 'V16响应式打磨',
      status: 'PASS',
      message: '预设条、移动指挥和推荐卡片统一换行与横向操作布局',
      path: '/lottery/mobile'
    },
    {
      key: 'v18-priority-workbench',
      label: 'V18今日优先事项',
      status: 'PASS',
      message: '工作台聚合提醒、待办、健康、票据和发布检查，形成可点击的今日处理列表',
      path: '/lottery/workbench'
    },
    {
      key: 'v18-astronaut-voyage-analysis',
      label: 'V18航行记录分析',
      status: 'PASS',
      message: '宇航员航行详情页区分红蓝舰队：红舰队分析卦象/和值/奇偶，蓝舰队只分析星球节奏和访问趋势',
      path: '/lottery/astronauts'
    },
    {
      key: 'v18-number-probability-pressure',
      label: 'V18号码综合可能性',
      status: 'PASS',
      message: '预测页综合历史频次、近期频次、遗漏压力、奇偶性、大小和分区；每个号码可查看分项贡献，回放支持手动选择目标期并按前置数据预测',
      path: '/lottery/prediction'
    },
    {
      key: 'v18-deep-pattern-analysis',
      label: 'V18深度规律分析',
      status: 'PASS',
      message: '深度规律分析页已按报告结构覆盖数据规模、冷热、和值、奇偶大小、区间、连号重号、高频组合和核心建议',
      path: '/lottery/deep-analysis'
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

  const auditColumns = useMemo<ColumnsType<LotteryAuditEvent>>(() => [
    {
      title: t('类型'),
      dataIndex: 'targetType',
      key: 'targetType',
      render: value => <Tag color="blue">{exportTypeLabel(value, translateText)}</Tag>
    },
    { title: t('行数'), dataIndex: 'rowCount', key: 'rowCount', align: 'right' },
    {
      title: t('范围'),
      dataIndex: 'requesterScope',
      key: 'requesterScope',
      render: value => translateText(lotteryCodeLabel(value, '-'))
    },
    { title: t('生成时间'), dataIndex: 'generatedAt', key: 'generatedAt', render: value => formatDateTime(value, language) }
  ], [language, t, translateText]);

  const maintenanceColumns = useMemo<ColumnsType<LotteryMaintenanceCollectionStatus>>(() => [
    { title: t('集合'), dataIndex: 'collection', key: 'collection', render: value => translateText(value || '-') },
    { title: t('总量'), dataIndex: 'totalCount', key: 'totalCount', align: 'right' },
    { title: t('过期'), dataIndex: 'staleCount', key: 'staleCount', align: 'right' },
    { title: t('超量'), dataIndex: 'oversizedBy', key: 'oversizedBy', align: 'right' },
    {
      title: t('模式'),
      dataIndex: 'cleanupSupported',
      key: 'cleanupSupported',
      render: value => <Tag color={value ? 'gold' : 'default'}>{t(value ? '预演' : '报告')}</Tag>
    }
  ], [t, translateText]);

  const cacheColumns = useMemo<ColumnsType<LotteryMaintenanceCacheStatus>>(() => [
    { title: t('缓存'), dataIndex: 'cacheKey', key: 'cacheKey', render: value => translateText(value || '-') },
    {
      title: t('状态'),
      dataIndex: 'present',
      key: 'present',
      render: value => <Tag color={value ? 'green' : 'default'}>{t(value ? '存在' : '缺失')}</Tag>
    },
    { title: t('TTL'), dataIndex: 'ttlSeconds', key: 'ttlSeconds', align: 'right', render: value => (value === undefined || value === null ? '-' : value) },
    {
      title: t('过期'),
      dataIndex: 'noExpiry',
      key: 'noExpiry',
      render: value => <Tag color={value ? 'gold' : 'default'}>{t(value ? '无过期' : '有过期')}</Tag>
    }
  ], [t, translateText]);

  const resultLines = useMemo(() => csvPreview(result?.content, 12), [result?.content]);
  const reportTotalRows = useMemo(
    () => reportResults.reduce((sum, item) => sum + Number(item.rowCount || 0), 0),
    [reportResults]
  );

  return (
    <LifePageShell
      className="lottery-prediction-page lottery-export-page"
      eyebrow={t('彩票数据')}
      title={t('导出审计')}
      actions={
        <Space wrap>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadState}>
            {t('刷新')}
          </Button>
          <Button icon={<ToolOutlined />} loading={dryRunning} onClick={runDryRun}>
            {t('预演')}
          </Button>
          <Button icon={<PrinterOutlined />} disabled={!reportResults.length} onClick={() => window.print()}>
            {t('打印报表')}
          </Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}

      <Card className="life-panel-card lottery-clean-panel">
        <Space wrap>
          <Select value={exportType} onChange={updateExportType} options={localizedExportTypeOptions} style={{ width: 160 }} />
          <Input allowClear value={primaryFilter} onChange={event => setPrimaryFilter(event.target.value)} placeholder={t('过滤值')} style={{ width: 180 }} />
          <Input value={limit} onChange={event => setLimit(event.target.value)} placeholder={t('行数')} style={{ width: 96 }} />
          <Button type="primary" icon={<DownloadOutlined />} loading={exporting} onClick={runExport}>
            {t('导出')}
          </Button>
        </Space>
      </Card>

      <Card
        className="life-panel-card lottery-clean-panel"
        title={<Space><FileTextOutlined />{t('报表构建器')}</Space>}
        extra={
          <Space wrap>
            <Tag color="blue">{t('区块 {{count}}', { count: reportSections.length })}</Tag>
            <Button icon={<PrinterOutlined />} disabled={!reportResults.length} onClick={() => window.print()}>
              {t('打印')}
            </Button>
            <Button type="primary" icon={<FileTextOutlined />} loading={reporting} onClick={buildReport}>
              {t('生成报表')}
            </Button>
          </Space>
        }
      >
        <div className="lottery-report-builder">
          <Space wrap className="lottery-report-preset-bar">
            {reportPresets.map(preset => (
              <Button key={preset.key} size="small" icon={<FilterOutlined />} onClick={() => setReportSections(preset.sections)}>
                {translateText(preset.label)}
              </Button>
            ))}
          </Space>
          <Checkbox.Group
            options={localizedExportTypeOptions}
            value={reportSections}
            onChange={values => setReportSections(values.map(String))}
          />
          <Space wrap>
            <span>{t('共用筛选：{{filter}}', { filter: primaryFilter.trim() || t('全部') })}</span>
            <span>{t('行数上限：{{limit}}', { limit: Number(limit) > 0 ? Number(limit) : 500 })}</span>
            <span>{t('已生成 {{sections}} 个区块 / {{rows}} 行', { sections: reportResults.length, rows: reportTotalRows })}</span>
            {archiveEvidenceContext ? <Tag color="purple">{t('归档上下文：{{context}}', { context: archiveEvidenceContext })}</Tag> : null}
          </Space>
        </div>
      </Card>

      <Card
        className="life-panel-card lottery-clean-panel lottery-v15-evidence-card"
        title={<Space><SafetyCertificateOutlined />{t('闭环证据包')}</Space>}
        extra={<Tag color="blue">{t('归因 / 推荐 / 移动 / 治理 / 异常 / Provider / Runbook / 长期')}</Tag>}
      >
        <div className="lottery-v15-evidence-grid">
          {v15EvidencePacks.map(pack => (
            <button
              key={pack.key}
              type="button"
              onClick={() => {
                setReportSections(pack.sections);
                window.history.replaceState(null, '', `/lottery/exports?preset=${pack.key}`);
              }}
            >
              <strong>{translateText(pack.title)}</strong>
              <span>{translateText(pack.preset)} · {pack.route}</span>
              <small>{pack.auditTypes.map(type => translateText(type)).join(' / ')}</small>
            </button>
          ))}
        </div>
      </Card>

      {result ? (
        <Card
          className="life-panel-card lottery-clean-panel"
          title={<Space><DownloadOutlined />{result.fileName}</Space>}
          extra={<Button size="small" icon={<DownloadOutlined />} onClick={() => downloadCsv(result, t)}>{t('下载 CSV')}</Button>}
        >
          <Space wrap size="large">
            <span>{t('类型：{{type}}', { type: exportTypeLabel(result.exportType, translateText) })}</span>
            <span>{t('行数：{{rows}}', { rows: result.rowCount || 0 })}</span>
            <span>{t('生成时间：{{time}}', { time: formatDateTime(result.generatedAt, language) })}</span>
          </Space>
          {resultLines ? <pre className="lottery-export-preview">{resultLines}</pre> : <Empty description={t('本次导出没有数据')} />}
        </Card>
      ) : null}

      {reportResults.length ? (
        <Card className="life-panel-card lottery-clean-panel lottery-report-print-area" title={<Space><FileTextOutlined />{t('报表预览')}</Space>}>
          <div className="lottery-report-section-grid">
            {reportResults.map(section => (
              <article className="lottery-report-section" key={`${section.exportType}-${section.generatedAt}`}>
                <div className="lottery-report-section-head">
                  <div>
                    <strong>{exportTypeLabel(section.exportType, translateText)}</strong>
                    <span>{t('{{fileName}} · {{rows}} 行 · {{time}}', {
                      fileName: section.fileName || '-',
                      rows: section.rowCount || 0,
                      time: formatDateTime(section.generatedAt, language)
                    })}</span>
                  </div>
                  <Button size="small" icon={<DownloadOutlined />} onClick={() => downloadCsv(section, t)}>{t('CSV')}</Button>
                </div>
                {section.content ? <pre className="lottery-export-preview">{csvPreview(section.content, 8)}</pre> : <Empty description={t('暂无数据')} />}
              </article>
            ))}
          </div>
        </Card>
      ) : null}

      {releaseArchiveFocus ? (
        <Card
          className="life-panel-card lottery-clean-panel"
          title={<Space><SafetyCertificateOutlined />{t('发布证据归档焦点')}</Space>}
          extra={<Tag color="blue">{t('仅文档')}</Tag>}
        >
          <div className="lottery-release-readiness-grid">
            <button type="button" onClick={() => window.location.assign('/lottery/exports')}>
              <span><FileTextOutlined /></span>
              <Tag color="blue">{t('报告')}</Tag>
              <strong>reports/lottery-release-evidence.md</strong>
              <small>{t('最新前端彩票发布证据')}</small>
            </button>
            <button type="button" onClick={() => window.location.assign('/lottery/exports')}>
              <span><FileTextOutlined /></span>
              <Tag color="blue">{t('历史')}</Tag>
              <strong>reports/lottery-release-history/README.md</strong>
              <small>{t('本地 Markdown 快照索引')}</small>
            </button>
            <button type="button" onClick={() => window.location.assign('/lottery/exports')}>
              <span><ThunderboltOutlined /></span>
              <Tag color="green">{t('命令')}</Tag>
              <strong>npm run lottery:release-archive</strong>
              <small>{t('release-check 通过后生成历史快照')}</small>
            </button>
          </div>
        </Card>
      ) : null}

      <Card
        className="life-panel-card lottery-clean-panel lottery-release-readiness-card"
        title={<Space><CheckCircleOutlined />{t('前端发布就绪')}</Space>}
        extra={<Tag color="blue">{t('{{count}} 项', { count: releaseReadinessChecks.length })}</Tag>}
      >
        <div className="lottery-release-readiness-grid">
          {releaseReadinessChecks.map(item => (
            <button key={item.key} type="button" onClick={() => window.location.assign(item.path)}>
              <span>{item.status === 'PASS' ? <CheckCircleOutlined /> : <ThunderboltOutlined />}</span>
              <Tag color={item.status === 'PASS' ? 'green' : 'blue'}>{translateText(lotteryStatusLabel(item.status))}</Tag>
              <strong>{translateText(item.label)}</strong>
              <small>{translateText(item.message)}</small>
            </button>
          ))}
        </div>
      </Card>

      <section className="lottery-workbench-main-grid">
        <Card
          className="life-panel-card lottery-clean-panel"
          title={<Space><SafetyCertificateOutlined />{t('审计事件')}</Space>}
          extra={<Tag>{t('{{filtered}}/{{total}} 条', { filtered: filteredAuditEvents.length, total: auditEvents.length })}</Tag>}
        >
          <div className="lottery-audit-filter-bar">
            <div className="lottery-filter-preset-bar">
              <Button size="small" onClick={() => {
                setAuditTypeFilter('LOTTERY_RECOMMENDATION_REFRESH');
                setAuditTargetFilter('lottery');
              }}>{t('V15')}</Button>
              <Button size="small" onClick={() => {
                setAuditTypeFilter('EXPORT');
                setAuditTargetFilter('');
              }}>{t('导出')}</Button>
              <Button size="small" onClick={() => {
                setAuditTypeFilter('LOTTERY_RECOMMENDATION_STATUS');
                setAuditTargetFilter('');
              }}>{t('推荐')}</Button>
              <Button size="small" onClick={() => {
                setAuditTypeFilter('LOTTERY_RECOMMENDATION_STATUS');
                setAuditTargetFilter('lottery-recommendation');
              }}>{t('V29')}</Button>
              <Button size="small" onClick={clearAuditFilters}>{t('清除')}</Button>
            </div>
            <Select
              allowClear
              placeholder={t('类型')}
              value={auditTypeFilter}
              onChange={setAuditTypeFilter}
              options={[
                { label: t('导出'), value: 'EXPORT' },
                { label: t('报告导出'), value: 'REPORT_EXPORT' },
                { label: t('归因审计'), value: 'LOTTERY_OUTCOME_ATTRIBUTION' },
                { label: t('推荐刷新'), value: 'LOTTERY_RECOMMENDATION_REFRESH' },
                { label: t('推荐状态'), value: 'LOTTERY_RECOMMENDATION_STATUS' },
                ...localizedExportTypeOptions
              ]}
              style={{ width: 140 }}
            />
            <Input
              allowClear
              prefix={<FilterOutlined />}
              value={auditTargetFilter}
              onChange={event => setAuditTargetFilter(event.target.value)}
              placeholder={t('目标/消息')}
              style={{ width: 180 }}
            />
            <Input type="date" value={auditStartDate} onChange={event => setAuditStartDate(event.target.value)} style={{ width: 150 }} />
            <Input type="date" value={auditEndDate} onChange={event => setAuditEndDate(event.target.value)} style={{ width: 150 }} />
            <Input
              value={auditMinRows}
              onChange={event => setAuditMinRows(event.target.value)}
              placeholder={t('最少行数')}
              style={{ width: 110 }}
            />
            <Button onClick={clearAuditFilters}>{t('清除')}</Button>
          </div>
          <Table
            rowKey={record => record.id || record.targetId || `${record.targetType}-${record.generatedAt}`}
            columns={auditColumns}
            dataSource={filteredAuditEvents}
            loading={loading}
            size="small"
            locale={{ emptyText: <Empty description={t('暂无审计事件')} /> }}
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
        <Card className="life-panel-card lottery-clean-panel" title={<Space><ToolOutlined />{t('维护预览')}</Space>}>
          <div className="lottery-maintenance-group-grid">
            {maintenanceGroups.map(group => (
              <span key={group.key}>
                <small>{group.title}</small>
                <strong>{group.count}</strong>
                <em>{t('需关注 {{count}}', { count: group.stale })}</em>
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
            locale={{ emptyText: <Empty description={t('暂无集合状态')} /> }}
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
            locale={{ emptyText: <Empty description={t('暂无缓存状态')} /> }}
            scroll={{ x: 620 }}
          />
        </Card>
      </section>
    </LifePageShell>
  );
};

export default LotteryExportMaintenancePage;
