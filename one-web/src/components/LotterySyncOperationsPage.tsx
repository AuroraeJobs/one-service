import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Empty, Input, Pagination, Popconfirm, Select, Space, Spin, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ApiOutlined, ClockCircleOutlined, DeleteOutlined, ExperimentOutlined, SyncOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import { useI18n } from '../contexts/I18nContext';
import type { TranslationParams } from '../i18n/types';
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
import { lotteryViewStateKeys, useLotterySavedViewState } from '../utils/lotteryViewState';
import { lotteryStatusLabel } from '../utils/lotteryStatusLabel';
import './LotteryOverviewPage.css';
import './LotterySyncOperationsPage.css';

const syncOperationViewKeys = ['status', 'provider', 'focus', 'syncPage', 'syncPageSize', 'probePage', 'probePageSize'];

interface ProviderReliabilityTrend {
  key: string;
  label: string;
  value: string;
  detail: string;
  status: string;
}

type Translate = (source: string, params?: TranslationParams) => string;

const containsChineseText = (value: string) => /[\u3400-\u9fff]/u.test(value);

const formatTime = (value: number | undefined, locale: string) => {
  if (!value) {
    return '-';
  }
  return new Intl.DateTimeFormat(locale, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
    .format(new Date(value))
    .replace(/\//g, '-');
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

const failureCategoryLabel = (category?: string) => {
  if (category === 'PROXY_OR_NETWORK_BLOCK') {
    return '代理/网络阻断';
  }
  if (category === 'HTTP_FAILURE') {
    return 'HTTP失败';
  }
  if (category === 'BLANK_RESPONSE') {
    return '空响应';
  }
  if (category === 'INVALID_JSON') {
    return '响应解析失败';
  }
  if (category === 'BUSINESS_FAILURE') {
    return '接口业务失败';
  }
  if (category === 'REQUEST_EXCEPTION') {
    return '请求异常';
  }
  if (category === 'PROXY_CONFIG_INVALID') {
    return '代理配置错误';
  }
  return category || '-';
};

const diagnosticColor = (record: { networkBlockSuspected?: boolean; failureCategory?: string }) => (
  record.networkBlockSuspected || record.failureCategory === 'PROXY_OR_NETWORK_BLOCK' ? 'red' : 'gold'
);

const formatDurationHours = (start: number | undefined, end: number | undefined, t: Translate) => {
  if (!start || !end || end < start) {
    return '-';
  }
  const hours = Math.max(0, Math.round((end - start) / (60 * 60 * 1000)));
  return hours >= 24
    ? t('{{count}} 天', { count: Math.round(hours / 24) })
    : t('{{count}} 小时', { count: hours });
};

const percentText = (count: number, total: number) => total ? `${Math.round((count / total) * 100)}%` : '-';

const pageParam = (value: string | null, fallback: number, max = Number.MAX_SAFE_INTEGER) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
};

const lastPageFor = (total: number | undefined, pageSize: number) => (
  Math.max(1, Math.ceil(Math.max(0, total ?? 0) / pageSize))
);

const LotterySyncOperationsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { language, defaultLanguage, t, translateText } = useI18n();
  const [logs, setLogs] = useState<LotteryRecordSyncLog[]>([]);
  const [logPageResponse, setLogPageResponse] = useState<LotteryPageResponse<LotteryRecordSyncLog>>();
  const [summary, setSummary] = useState<LotteryRecordSyncSummary>();
  const [probeLogs, setProbeLogs] = useState<LotteryProviderProbeLog[]>([]);
  const [probePageResponse, setProbePageResponse] = useState<LotteryPageResponse<LotteryProviderProbeLog>>();
  const [qualityReport, setQualityReport] = useState<LotteryDataQualityReport>();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [probing, setProbing] = useState(false);
  const [deletingLogId, setDeletingLogId] = useState<string>();
  const [loadError, setLoadError] = useState<string>();
  const [auxiliaryError, setAuxiliaryError] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const loadRequestIdRef = useRef(0);

  useLotterySavedViewState(lotteryViewStateKeys.syncOperations, searchParams, setSearchParams, syncOperationViewKeys);

  const statusFilter = searchParams.get('status') || undefined;
  const focusMode = searchParams.get('focus') || '';
  const providerReliabilityFocus = focusMode === 'provider-reliability';
  const probeProvider = searchParams.get('provider') || 'cwl';
  const syncPage = pageParam(searchParams.get('syncPage'), 1);
  const syncPageSize = pageParam(searchParams.get('syncPageSize'), 10, 100);
  const probePage = pageParam(searchParams.get('probePage'), 1);
  const probePageSize = pageParam(searchParams.get('probePageSize'), 5, 100);

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
    page: syncPage - 1,
    pageSize: syncPageSize
  }), [statusFilter, syncPage, syncPageSize]);

  const loadLogs = useCallback(async () => {
    const requestId = ++loadRequestIdRef.current;
    let isCorrectingPage = false;
    setLoading(true);
    setLoadError(undefined);
    setAuxiliaryError(undefined);
    try {
      const [rowsResult, summaryResult, probeLogsResult, qualityReportResult] = await Promise.allSettled([
        lotteryRecordApi.syncLogsPage(queryParams),
        lotteryRecordApi.syncSummary({ limit: 50 }),
        lotteryProviderApi.probeLogsPage({
          provider: probeProvider.trim() || undefined,
          page: probePage - 1,
          pageSize: probePageSize
        }),
        lotteryDataQualityApi.report()
      ]);
      if (requestId !== loadRequestIdRef.current) {
        return;
      }

      const pageCorrection: Record<string, number> = {};
      if (rowsResult.status === 'fulfilled') {
        const rows = rowsResult.value;
        const pageSize = Math.max(1, rows.pageSize || syncPageSize);
        const syncLastPage = lastPageFor(rows.total, pageSize);
        if (syncPage > syncLastPage) {
          pageCorrection.syncPage = syncLastPage;
          setLogs([]);
        } else {
          setLogs(rows.items || []);
        }
        setLogPageResponse(rows);
      } else {
        console.error('读取彩票同步日志失败:', rowsResult.reason);
        setLogs([]);
        setLogPageResponse(undefined);
        setLoadError('读取彩票同步日志失败');
      }

      let hasAuxiliaryFailure = false;
      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value || undefined);
      } else {
        hasAuxiliaryFailure = true;
        setSummary(undefined);
        console.error('读取彩票同步摘要失败:', summaryResult.reason);
      }

      if (probeLogsResult.status === 'fulfilled') {
        const nextProbeLogs = probeLogsResult.value;
        const pageSize = Math.max(1, nextProbeLogs.pageSize || probePageSize);
        const probeLastPage = lastPageFor(nextProbeLogs.total, pageSize);
        if (probePage > probeLastPage) {
          pageCorrection.probePage = probeLastPage;
          setProbeLogs([]);
        } else {
          setProbeLogs(nextProbeLogs.items || []);
        }
        setProbePageResponse(nextProbeLogs);
      } else {
        hasAuxiliaryFailure = true;
        setProbeLogs([]);
        setProbePageResponse(undefined);
        console.error('读取 Provider 探测日志失败:', probeLogsResult.reason);
      }

      if (qualityReportResult.status === 'fulfilled') {
        setQualityReport(qualityReportResult.value || undefined);
      } else {
        hasAuxiliaryFailure = true;
        setQualityReport(undefined);
        console.error('读取彩票数据质量报告失败:', qualityReportResult.reason);
      }

      setAuxiliaryError(hasAuxiliaryFailure ? '部分运维数据读取失败，请稍后重试' : undefined);
      if (Object.keys(pageCorrection).length > 0) {
        isCorrectingPage = true;
        updateQuery(pageCorrection, false);
      }
    } catch (requestError) {
      if (requestId !== loadRequestIdRef.current) {
        return;
      }
      console.error('读取彩票同步日志失败:', requestError);
      setLogs([]);
      setLogPageResponse(undefined);
      setLoadError('读取彩票同步日志失败');
    } finally {
      if (requestId === loadRequestIdRef.current && !isCorrectingPage) {
        setLoading(false);
      }
    }
  }, [probePage, probePageSize, probeProvider, queryParams, syncPage, syncPageSize, updateQuery]);

  const retryLoad = () => {
    void loadLogs();
  };

  const localizeRuntimeMessage = (value: string | undefined, fallback: string) => {
    const localized = translateText(value || fallback);
    return language !== defaultLanguage && containsChineseText(localized) ? t(fallback) : localized;
  };

  useEffect(() => {
    void loadLogs();
    return () => {
      loadRequestIdRef.current += 1;
    };
  }, [loadLogs]);

  const deleteSyncLog = async (record: LotteryRecordSyncLog) => {
    if (!record.id || record.status === 'RUNNING') {
      return;
    }
    setDeletingLogId(record.id);
    setActionError(undefined);
    try {
      await lotteryRecordApi.deleteSyncLog(record.id);
      message.success(t('同步记录已删除'));
      await loadLogs();
    } catch (requestError) {
      console.error('删除彩票同步记录失败:', requestError);
      setActionError('删除彩票同步记录失败');
      message.error(t('删除彩票同步记录失败'));
    } finally {
      setDeletingLogId(undefined);
    }
  };

  const runOperation = async () => {
    setSyncing(true);
    setActionError(undefined);
    try {
      const result = await lotteryRecordApi.sync();
      message.success(localizeRuntimeMessage(result.message, '同步任务已执行'));
      await loadLogs();
    } catch (requestError) {
      console.error('执行彩票同步失败:', requestError);
      setActionError('执行彩票同步失败');
      message.error(t('执行彩票同步失败'));
    } finally {
      setSyncing(false);
    }
  };

  const runProbe = async () => {
    setProbing(true);
    setActionError(undefined);
    try {
      const provider = probeProvider.trim() || undefined;
      const result = await lotteryProviderApi.probe({ provider });
      message.success(localizeRuntimeMessage(result.message, 'Provider 探测完成'));
      await loadLogs();
    } catch (requestError) {
      console.error('探测彩票 Provider 失败:', requestError);
      setActionError('探测彩票 Provider 失败');
      message.error(t('探测彩票 Provider 失败'));
    } finally {
      setProbing(false);
    }
  };

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
      title: t('状态'),
      key: 'status',
      render: (_, record) => (
        <Tag color={record.success && record.status === 'AVAILABLE' ? 'green' : 'orange'}>
          {translateText(lotteryStatusLabel(record.status))}
        </Tag>
      )
    },
    {
      title: t('记录数'),
      dataIndex: 'recordCount',
      key: 'recordCount',
      align: 'right',
      render: value => value ?? 0
    },
    {
      title: t('耗时'),
      dataIndex: 'durationMs',
      key: 'durationMs',
      render: value => `${value ?? 0} ms`
    },
    {
      title: t('诊断'),
      key: 'diagnostics',
      render: (_, record) => (
        record.failureCategory || record.httpStatus || record.requestMode ? (
          <Space direction="vertical" size={0}>
            {record.failureCategory ? (
              <Tag color={diagnosticColor(record)}>{translateText(failureCategoryLabel(record.failureCategory))}</Tag>
            ) : null}
            <span className="stock-quote-code">
              {record.requestMode || '-'}{record.httpStatus ? ` / HTTP ${record.httpStatus}` : ''}
            </span>
          </Space>
        ) : '-'
      )
    },
    {
      title: t('消息'),
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: value => value ? localizeRuntimeMessage(value, 'Provider 返回了未翻译的诊断信息') : '-'
    },
    {
      title: t('检查时间'),
      dataIndex: 'checkedAt',
      key: 'checkedAt',
      render: value => formatTime(value, language)
    }
  ];

  const providerReliabilityTrends = useMemo<ProviderReliabilityTrend[]>(() => {
    const failedLogs = logs.filter(item => item.status === 'FAILED');
    const skippedLogs = logs.filter(item => item.status === 'SKIPPED');
    const networkBlockedLogs = [...logs, ...probeLogs].filter(item => item.networkBlockSuspected || item.failureCategory === 'PROXY_OR_NETWORK_BLOCK');
    const failureCategoryCounts = [...logs, ...probeLogs].reduce<Record<string, number>>((acc, item) => {
      const category = item.failureCategory;
      if (category) {
        acc[category] = (acc[category] || 0) + 1;
      }
      return acc;
    }, {});
    const topFailureCategory = Object.entries(failureCategoryCounts).sort((left, right) => right[1] - left[1])[0];
    const successfulProbeCount = probeLogs.filter(item => item.success || item.status === 'AVAILABLE').length;
    const probeTotal = probeLogs.length;
    return [
      {
        key: 'sync-stability',
        label: t('同步稳定性'),
        value: `${summary?.successRate ?? 0}%`,
        detail: t('成功 {{success}}，失败 {{failed}}，跳过 {{skipped}}', {
          success: summary?.successCount ?? 0,
          failed: summary?.failedCount ?? 0,
          skipped: summary?.skippedCount ?? 0
        }),
        status: (summary?.failedCount || failedLogs.length) ? 'WARNING' : 'PASS'
      },
      {
        key: 'recovery-window',
        label: t('最近恢复间隔'),
        value: formatDurationHours(summary?.lastFailureAt, summary?.lastSuccessAt, t),
        detail: t('最近失败 {{failureTime}}，最近成功 {{successTime}}', {
          failureTime: formatTime(summary?.lastFailureAt, language),
          successTime: formatTime(summary?.lastSuccessAt, language)
        }),
        status: summary?.lastFailureAt && (!summary?.lastSuccessAt || summary.lastSuccessAt < summary.lastFailureAt) ? 'FAILED' : summary?.lastFailureAt ? 'WARNING' : 'PASS'
      },
      {
        key: 'probe-success',
        label: t('Provider 探测成功率'),
        value: percentText(successfulProbeCount, probeTotal),
        detail: t('{{provider}} · 成功 {{success}}/{{total}}', {
          provider: probeProvider || '-',
          success: successfulProbeCount,
          total: probeTotal
        }),
        status: probeTotal && successfulProbeCount < probeTotal ? 'WARNING' : probeTotal ? 'PASS' : 'MANUAL'
      },
      {
        key: 'failure-category',
        label: t('主要故障分类'),
        value: topFailureCategory ? translateText(failureCategoryLabel(topFailureCategory[0])) : t('暂无'),
        detail: topFailureCategory ? t('{{count}} 条诊断记录，当前页跳过 {{skipped}} 条', {
          count: topFailureCategory[1],
          skipped: skippedLogs.length
        }) : t('当前页暂无故障分类'),
        status: topFailureCategory ? 'WARNING' : 'PASS'
      },
      {
        key: 'network-block',
        label: t('网络阻断信号'),
        value: t('{{count}} 条', { count: networkBlockedLogs.length }),
        detail: t('最近请求 {{request}}', {
          request: `${summary?.latestRequestMode || '-'}${summary?.latestHttpStatus ? ` / HTTP ${summary.latestHttpStatus}` : ''}`
        }),
        status: networkBlockedLogs.length || summary?.latestNetworkBlockSuspected ? 'FAILED' : 'PASS'
      }
    ];
  }, [language, logs, probeLogs, probeProvider, summary, t, translateText]);
  const qualityIssueCount = (qualityReport?.missingIssueCount || 0)
    + (qualityReport?.duplicateIssueCount || 0)
    + (qualityReport?.malformedRecordCount || 0)
    + (qualityReport?.futureDateCount || 0);

  return (
    <LifePageShell
      className="lottery-prediction-page"
      eyebrow={t('彩票数据')}
      title={t('同步运维')}
      actions={
        <Space wrap>
          <Button type="primary" icon={<SyncOutlined />} loading={syncing} onClick={runOperation}>
            {t('同步')}
          </Button>
        </Space>
      }
    >
      {actionError ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={t(actionError)} /> : null}
      {auxiliaryError ? (
        <Alert
          className="lottery-overview-status-alert"
          type="warning"
          showIcon
          message={t(auxiliaryError)}
          action={<Button size="small" onClick={retryLoad}>{t('重新加载')}</Button>}
        />
      ) : null}
      {summary?.latestNetworkBlockSuspected ? (
        <Alert
          className="lottery-overview-status-alert"
          type="warning"
          showIcon
          message={t('最近一次同步疑似被代理或网络策略阻断')}
          description={t('Provider: {{provider}}，模式: {{mode}}，HTTP: {{http}}，分类: {{category}}', {
            provider: summary.latestProvider || '-',
            mode: summary.latestRequestMode || '-',
            http: summary.latestHttpStatus || '-',
            category: translateText(failureCategoryLabel(summary.latestFailureCategory))
          })}
        />
      ) : null}
      {qualityIssueCount > 0 ? (
        <Alert
          className="lottery-overview-status-alert"
          type="warning"
          showIcon
          message={t('发现 {{count}} 项数据质量问题', { count: qualityIssueCount })}
          action={
            <Button size="small" icon={<WarningOutlined />} onClick={() => navigate('/lottery/data-quality')}>
              {t('查看')}
            </Button>
          }
        />
      ) : null}

      <Card
        className="life-panel-card lottery-sync-record-panel"
        title={(
          <div className="lottery-sync-record-toolbar">
            <strong>{t('同步记录')}</strong>
            <Select
              className="lottery-sync-record-status-filter"
              aria-label={t('同步记录状态筛选')}
              allowClear
              placeholder={t('状态筛选')}
              value={statusFilter}
              onChange={value => updateQuery({ status: value })}
              options={[
                { label: t('成功'), value: 'SUCCESS' },
                { label: t('失败'), value: 'FAILED' }
              ]}
            />
          </div>
        )}
      >
        <Spin spinning={loading} tip={t('正在加载同步记录')}>
          {logs.length > 0 ? (
            <section className="lottery-sync-record-grid" aria-label={t('同步记录')}>
              {logs.map(record => (
                <article
                  className="lottery-sync-record-card"
                  data-status={record.status || 'UNKNOWN'}
                  key={record.id || `${record.jobName}-${record.startedAt}`}
                >
                  <header className="lottery-sync-record-issues">
                    <div className="lottery-sync-record-issue lottery-sync-record-issue-start">
                      <span>{t('开始期号')}</span>
                      <strong>{record.startIssue || '-'}</strong>
                    </div>
                    <div className="lottery-sync-record-issue lottery-sync-record-issue-end">
                      <span>{t('结束期号')}</span>
                      <strong>{record.endIssue || '-'}</strong>
                    </div>
                  </header>

                  <div className="lottery-sync-record-details">
                    <div className="lottery-sync-record-time">
                      <span className="lottery-sync-record-detail-label">
                        <ClockCircleOutlined />
                        {t('时间')}
                      </span>
                      <time dateTime={record.finishedAt ? new Date(record.finishedAt).toISOString() : undefined}>
                        {formatTime(record.finishedAt, language)}
                      </time>
                    </div>
                    <div className="lottery-sync-record-saved">
                      <span>{t('同步数量')}</span>
                      <strong>{record.savedCount ?? 0}</strong>
                    </div>
                  </div>

                  <footer className="lottery-sync-record-actions">
                    <Tag color={statusColor(record.status)}>{translateText(lotteryStatusLabel(record.status))}</Tag>
                    {record.id ? (
                      record.status === 'RUNNING' ? (
                        <Button
                          size="small"
                          danger
                          disabled
                          icon={<DeleteOutlined />}
                          title={t('运行中的同步记录暂不可删除')}
                          aria-label={t('运行中的同步记录暂不可删除')}
                        />
                      ) : (
                        <Popconfirm
                          title={t('删除这条同步记录？')}
                          description={t('仅删除运维日志，不影响已同步的开奖记录。')}
                          okText={t('删除')}
                          cancelText={t('取消')}
                          onConfirm={() => deleteSyncLog(record)}
                        >
                          <Button
                            size="small"
                            danger
                            disabled={Boolean(deletingLogId)}
                            icon={<DeleteOutlined />}
                            loading={deletingLogId === record.id}
                            aria-label={t('删除同步记录')}
                          />
                        </Popconfirm>
                      )
                    ) : null}
                  </footer>
                </article>
              ))}
            </section>
          ) : loading ? (
            <div className="lottery-sync-record-load-state" role="status" aria-live="polite">
              {t('正在加载同步记录')}
            </div>
          ) : loadError ? (
            <Empty description={t(loadError)}>
              <Button onClick={retryLoad}>{t('重新加载')}</Button>
            </Empty>
          ) : (
            <Empty description={t('暂无同步记录')} />
          )}
        </Spin>
        <Pagination
          className="lottery-list-pagination"
          current={syncPage}
          pageSize={syncPageSize}
          total={logPageResponse?.total || 0}
          showSizeChanger
          disabled={loading || Boolean(deletingLogId)}
          showTotal={total => t('共 {{total}} 条', { total })}
          onChange={(nextPage, nextPageSize) => updateQuery({ syncPage: nextPage, syncPageSize: nextPageSize }, false)}
        />
      </Card>

      <Card
        className="life-panel-card lottery-clean-panel"
        title={t('Provider 可靠性趋势')}
        extra={<Tag color={summary?.latestNetworkBlockSuspected ? 'red' : 'blue'}>{summary?.latestProvider || probeProvider || '-'}</Tag>}
      >
        {providerReliabilityFocus ? (
          <div className="lottery-attribution-focus-summary">
            <strong>{t('Provider可靠性焦点')}</strong>
            <section className="lottery-attribution-rollup-summary">
              {providerReliabilityTrends.map(item => (
                <article key={item.key}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              ))}
            </section>
          </div>
        ) : null}
        <div className="lottery-provider-reliability-grid">
          {providerReliabilityTrends.map(item => (
            <button
              key={item.key}
              type="button"
              data-status={item.status}
              onClick={() => item.key === 'network-block' ? updateQuery({ status: 'FAILED' }) : undefined}
            >
              <div className="lottery-provider-reliability-head">
                <strong>{item.label}</strong>
                <Tag className="lottery-provider-reliability-status" color={statusColor(item.status)}>
                  {translateText(lotteryStatusLabel(item.status))}
                </Tag>
              </div>
              <span className="lottery-provider-reliability-value">{item.value}</span>
              <small>{item.detail}</small>
            </button>
          ))}
        </div>
      </Card>

      <Card
        className="life-panel-card"
        title={t('Provider 探测')}
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
              {t('探测')}
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
            showTotal: total => t('共 {{total}} 条', { total }),
            onChange: (nextPage, nextPageSize) => updateQuery({ probePage: nextPage, probePageSize: nextPageSize }, false)
          }}
          scroll={{ x: 980 }}
        />
      </Card>

    </LifePageShell>
  );
};

export default LotterySyncOperationsPage;
