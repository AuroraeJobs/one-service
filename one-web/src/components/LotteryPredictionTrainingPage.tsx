import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Progress,
  Select,
  Space,
  Tag,
  message
} from 'antd';
import {
  CheckCircleOutlined,
  ExperimentOutlined,
  LineChartOutlined,
  ReloadOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import LotteryBalls from './lottery/LotteryBalls';
import LotteryLocalizedECharts from './LotteryLocalizedECharts';
import { useI18n } from '../contexts/I18nContext';
import { useRecordContext } from '../contexts/RecordContext';
import {
  lotteryPreferenceApi,
  lotteryTrainingApi,
  type LotteryActualRecord,
  type LotteryLatestPrediction,
  type LotteryPreference,
  type LotteryTrainingReport,
  type LotteryTrainingStatus
} from '../services/api';
import './LotteryPredictionTrainingPage.css';

const SCALE_OPTIONS: Array<{ value: 'fast' | 'standard' | 'deep'; labelZh: string; labelEn: string }> = [
  { value: 'fast', labelZh: '快速', labelEn: 'Fast' },
  { value: 'standard', labelZh: '标准', labelEn: 'Standard' },
  { value: 'deep', labelZh: '深度', labelEn: 'Deep' }
];

const PRIZE_ORDER = ['一等奖', '二等奖', '三等奖', '四等奖', '五等奖', '六等奖', '未中奖'];

const getWinningCount = (report: LotteryTrainingReport) =>
  report.best ? report.best.summary.total - (report.best.summary.prizeDistribution['未中奖'] || 0) : 0;

const getScoreColor = (score: number) => {
  if (score >= 45) return 'red';
  if (score >= 30) return 'orange';
  if (score >= 18) return 'blue';
  return 'default';
};

const getPrizeColor = (prizeName?: string) => {
  const level = PRIZE_ORDER.indexOf(prizeName || '未中奖');
  if (level < 0 || level === PRIZE_ORDER.length - 1) return 'default';
  if (level <= 1) return 'red';
  if (level <= 3) return 'orange';
  return 'blue';
};

const localizeTrainingText = (
  value: string,
  t: ReturnType<typeof useI18n>['t'],
  translateText: ReturnType<typeof useI18n>['translateText'],
) => {
  const generationMatch = value.match(/^第 (\d+) 代正在回放 (.+)$/);
  if (generationMatch) {
    return t('第 {{generation}} 代正在回放 {{target}}', {
      generation: generationMatch[1],
      target: generationMatch[2],
    });
  }
  const rollingMatch = value.match(/^正在基于前 (\d+) 期预测第 (\d+) 期$/);
  if (rollingMatch) {
    return t('正在基于前 {{historyCount}} 期预测第 {{period}} 期', {
      historyCount: rollingMatch[1],
      period: rollingMatch[2],
    });
  }
  return translateText(value);
};

const getTrainingStageLabel = (status?: LotteryTrainingStatus) => {
  if (!status) return '待训练';
  if (status.running) return status.stage || '训练中';
  if (status.failed) return status.message || '训练失败';
  if (status.cancelled) return status.message || '已取消';
  return status.message || '训练完成';
};

const LotteryPredictionTrainingPage = () => {
  const navigate = useNavigate();
  const { t, translateText } = useI18n();
  const { loading: recordsLoading } = useRecordContext();
  const [scale, setScale] = useState<'fast' | 'standard' | 'deep' | undefined>('standard');
  const [replayCount, setReplayCount] = useState<number>(0);
  const [training, setTraining] = useState(false);
  const [status, setStatus] = useState<LotteryTrainingStatus | undefined>();
  const [report, setReport] = useState<LotteryTrainingReport | undefined>();
  const [preference, setPreference] = useState<LotteryPreference | undefined>();
  const [detailVisiblePeriod, setDetailVisiblePeriod] = useState<number | undefined>();
  const [logs, setLogs] = useState<string[]>([]);
  const [logSequence, setLogSequence] = useState<number>(0);
  const [tick, setTick] = useState<number>(() => Date.now());
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const scaleLabel = useCallback(
    (value: 'fast' | 'standard' | 'deep') =>
      translateText(SCALE_OPTIONS.find(item => item.value === value)?.labelZh || value),
    [translateText],
  );

  const loadPreference = useCallback(() => {
    lotteryPreferenceApi.preference()
      .then(pref => {
        setPreference(pref);
        if (pref.defaultTrainingScale) {
          setScale(pref.defaultTrainingScale as 'fast' | 'standard' | 'deep');
        }
        if (typeof pref.defaultReplayCount === 'number') {
          setReplayCount(pref.defaultReplayCount);
        }
      })
      .catch(error => console.warn('读取彩票训练偏好失败:', error));
  }, []);

  const applyStatus = useCallback((next: LotteryTrainingStatus) => {
    setStatus(next);
    if (typeof next.logSequence === 'number' && next.logSequence > logSequence) {
      setLogs(next.logs || []);
      setLogSequence(next.logSequence);
    } else if (Array.isArray(next.logs) && next.logs.length === 0) {
      setLogs([]);
      setLogSequence(0);
    }
    if (next.report) {
      setReport(next.report);
    }
    if (next.running) {
      setTraining(true);
    } else if (!next.running && training) {
      setTraining(false);
      if (next.failed) {
        message.error(next.message || '规则训练失败');
      } else if (next.report) {
        message.success('训练完成，已重新预测');
      }
    }
  }, [logSequence, training]);

  const startTraining = useCallback(async () => {
    setTraining(true);
    setReport(undefined);
    setLogs([]);
    setLogSequence(0);
    try {
      await lotteryTrainingApi.start({ replayCount, scale });
    } catch (error) {
      console.error('规则训练失败:', error);
      message.error('规则训练失败，请检查后端服务');
      setTraining(false);
    }
  }, [replayCount, scale]);

  const cancelTraining = useCallback(async () => {
    try {
      await lotteryTrainingApi.cancel();
      message.info('已取消训练');
    } catch (error) {
      console.error('取消训练失败:', error);
      message.error('取消训练失败');
    }
  }, []);

  useEffect(() => {
    loadPreference();
  }, [loadPreference]);

  useEffect(() => {
    const source = new EventSource('/api/lottery/training/status/stream', { withCredentials: true });
    eventSourceRef.current = source;
    source.addEventListener('status', (event: MessageEvent) => {
      try {
        const next = JSON.parse(event.data) as LotteryTrainingStatus;
        applyStatus(next);
      } catch (error) {
        console.warn('解析训练状态流失败:', error);
      }
    });
    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) {
        return;
      }
      console.warn('训练状态流连接异常，等待自动重连');
    };
    return () => {
      source.close();
      eventSourceRef.current = null;
    };
  }, [applyStatus]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [logs]);

  const elapsedSeconds = useMemo(() => {
    if (!status?.startedAt) return undefined;
    const end = status.finishedAt ?? tick;
    return Math.max(0, Math.round((end - status.startedAt) / 1000));
  }, [status, tick]);

  const estimatedRemainingSeconds = useMemo(() => {
    if (!status?.running || !status.startedAt || !status.percent || status.percent >= 100) {
      return undefined;
    }
    const elapsed = (tick - status.startedAt) / 1000;
    const ratio = status.percent / 100;
    if (ratio <= 0) return undefined;
    return Math.max(0, Math.round(elapsed / ratio - elapsed));
  }, [status, tick]);

  const formatDuration = (seconds?: number) => {
    if (seconds == null || Number.isNaN(seconds)) return '--';
    const safe = Math.max(0, Math.floor(seconds));
    const h = Math.floor(safe / 3600);
    const m = Math.floor((safe % 3600) / 60);
    const s = safe % 60;
    const parts: string[] = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0 || h > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  };

  const best = report?.best;
  const learnedRule = report?.learnedRule || best?.config;
  const candidates = useMemo(() => report?.candidates || [], [report]);
  const timeline = useMemo(() => report?.timeline || [], [report]);

  const rankedCandidates = useMemo(
    () => [...candidates].sort((left, right) => (right.rankScore ?? 0) - (left.rankScore ?? 0)).slice(0, 8),
    [candidates],
  );

  const scoreChartOption = useMemo(() => {
    if (rankedCandidates.length === 0) {
      return undefined;
    }
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 16, top: 24, bottom: 56 },
      xAxis: {
        type: 'category',
        data: rankedCandidates.map((_item, index) => `${index + 1}`),
        axisLabel: { rotate: 0, fontSize: 11 }
      },
      yAxis: { type: 'value', name: translateText('评分') },
      series: [
        {
          name: translateText('评分'),
          type: 'bar',
          data: rankedCandidates.map(item => item.rankScore ?? 0),
          itemStyle: { color: '#ff9500', borderRadius: [6, 6, 0, 0] }
        }
      ]
    };
  }, [rankedCandidates, translateText]);

  const timelineChartOption = useMemo(() => {
    if (timeline.length === 0) {
      return undefined;
    }
    const sorted = [...timeline].sort((left, right) => left.period - right.period);
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: [translateText('红球命中'), translateText('评分')] },
      grid: { left: 40, right: 40, top: 30, bottom: 48 },
      xAxis: {
        type: 'category',
        data: sorted.map(item => `${item.period}`),
        axisLabel: { fontSize: 10, interval: Math.max(0, Math.floor(sorted.length / 12)) }
      },
      yAxis: [
        { type: 'value', name: translateText('红球命中'), max: 6 },
        { type: 'value', name: translateText('评分') }
      ],
      series: [
        {
          name: translateText('红球命中'),
          type: 'bar',
          data: sorted.map(item => item.redHits),
          itemStyle: { color: '#ff3b30' }
        },
        {
          name: translateText('评分'),
          type: 'line',
          yAxisIndex: 1,
          data: sorted.map(item => item.score),
          itemStyle: { color: '#0071e3' }
        }
      ]
    };
  }, [timeline, translateText]);

  const detailTimeline = useMemo(() => {
    if (!detailVisiblePeriod) return undefined;
    return timeline.find(item => item.period === detailVisiblePeriod);
  }, [detailVisiblePeriod, timeline]);

  const selectedActual = detailTimeline?.actualRedNumbers?.length
    ? { period: detailTimeline.period, redNumbers: detailTimeline.actualRedNumbers, blueNumber: detailTimeline.actualBlueNumber }
    : undefined;

  const stageOptions = useMemo(() => SCALE_OPTIONS.map(({ labelZh, value }) => ({
    label: t(labelZh),
    value,
  })), [t]);

  const replayOptions = useMemo(() => [0, 10, 20, 50, 100].map(count => ({
    label: count === 0 ? t('自动') : t('回放 {{count}} 期', { count }),
    value: count,
  })), [t]);

  const kpis = useMemo(() => [
    {
      key: 'generation',
      label: t('训练代数'),
      value: report?.generation ?? (status?.running ? '—' : 0)
    },
    {
      key: 'winning',
      label: t('中奖期数'),
      value: best ? getWinningCount(report!) : 0,
      suffix: best ? `/ ${best.summary.total}` : ''
    },
    {
      key: 'redHits',
      label: t('平均红球'),
      value: best?.summary.averageRedHits ?? 0,
      suffix: '/6'
    },
    {
      key: 'blueHit',
      label: t('蓝球命中率'),
      value: best?.summary.blueHitRate ?? 0,
      suffix: '%'
    }
  ], [best, report, status?.running, t]);

  const progressPercent = status?.percent ?? (report ? 100 : 0);
  const progressStatus = status?.failed
    ? 'exception'
    : status?.running
      ? 'active'
      : report
        ? 'success'
        : 'normal';

  const trainedPrediction: LotteryLatestPrediction | undefined = report?.latestPrediction;
  const actualRecord: LotteryActualRecord | undefined = trainedPrediction?.actualRecord
    ? {
        period: trainedPrediction.targetPeriod,
        redNumbers: trainedPrediction.actualRecord.redNumbers,
        blueNumber: trainedPrediction.actualRecord.blueNumber
      }
    : undefined;

  return (
    <LifePageShell
      className="lottery-prediction-training-page"
      eyebrow={t('彩票预测')}
      title={t('规则训练台')}
      actions={
        <Space wrap>
          <Button
            type="primary"
            icon={<ExperimentOutlined />}
            loading={training}
            onClick={startTraining}
          >
            {training ? t('训练中') : t('开始训练')}
          </Button>
          <Button
            icon={<ReloadOutlined />}
            loading={recordsLoading}
            onClick={startTraining}
            disabled={training}
          >
            {t('重新训练')}
          </Button>
          {training && (
            <Button danger icon={<ThunderboltOutlined />} onClick={cancelTraining}>
              {t('取消')}
            </Button>
          )}
          <Button icon={<LineChartOutlined />} onClick={() => navigate('/lottery/prediction')}>
            {t('预测总览')}
          </Button>
        </Space>
      }
    >
      <section className="lottery-training-workspace">
        <Card className="life-panel-card lottery-training-config-card">
          <div className="lottery-training-config-head">
            <strong>{t('训练配置')}</strong>
            <span>{t('训练会回放历史开奖，寻找更稳的预测规则。')}</span>
          </div>
          {preference && (
            <div className="lottery-training-config-summary" style={{ marginBottom: 12 }}>
              <Tag color="blue">{scaleLabel((preference.defaultTrainingScale as 'fast' | 'standard' | 'deep') || 'standard')}</Tag>
              <Tag>回放 {preference.defaultReplayCount ?? 0}</Tag>
              <Tag color={preference.autoSavePredictions ? 'green' : 'default'}>
                {preference.autoSavePredictions ? t('自动保存票据') : t('不自动保存')}
              </Tag>
            </div>
          )}
          <div className="lottery-training-config-grid">
            <div>
              <span>{t('训练规模')}</span>
              <Select
                value={scale}
                options={stageOptions}
                onChange={value => setScale(value)}
                disabled={training}
                className="lottery-training-config-select"
              />
            </div>
            <div>
              <span>{t('回放期数')}</span>
              <Select
                value={replayCount}
                options={replayOptions}
                onChange={value => setReplayCount(value)}
                disabled={training}
                className="lottery-training-config-select"
              />
            </div>
          </div>
        </Card>

        <Card className="life-panel-card lottery-training-progress-card">
          <div className="lottery-training-section-head">
            <strong>{t('训练进度')}</strong>
            <Tag color={status?.running ? 'processing' : status?.failed ? 'error' : report ? 'success' : 'default'}>
              {getTrainingStageLabel(status)}
            </Tag>
          </div>
          {status?.running || report || status?.failed ? (
            <div className="lottery-training-progress">
              <Progress percent={progressPercent} status={progressStatus as 'success' | 'exception' | 'active' | 'normal'} />
              <div className="lottery-training-status-line">
                <span>{localizeTrainingText(status?.message || t('等待训练'), t, translateText)}</span>
                {Boolean(status?.total) && (
                  <strong>{status?.processed || 0} / {status?.total}</strong>
                )}
              </div>
              {status?.taskDetail && (
                <div className="lottery-training-task-detail">
                  <span>{t('当前任务')}</span>
                  <strong>{localizeTrainingText(status.taskDetail, t, translateText)}</strong>
                </div>
              )}
              <div className="lottery-training-timing">
                <div>
                  <span>{t('已用时')}</span>
                  <strong>{formatDuration(elapsedSeconds)}</strong>
                </div>
                <div>
                  <span>{status?.running ? t('预计剩余') : t('总耗时')}</span>
                  <strong>
                    {status?.running
                      ? formatDuration(estimatedRemainingSeconds)
                      : status?.finishedAt ? formatDuration(elapsedSeconds) : '--'}
                  </strong>
                </div>
                {status?.scale && (
                  <div>
                    <span>{t('训练规模')}</span>
                    <strong>{scaleLabel((status.scale as 'fast' | 'standard' | 'deep') || 'standard')}</strong>
                  </div>
                )}
                {Boolean(status?.replayCount) && (
                  <div>
                    <span>{t('回放期数')}</span>
                    <strong>{status?.replayCount}</strong>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('还没有训练记录，点击开始训练生成规则')} />
          )}
          <div className="lottery-training-log-stream">
            <div className="lottery-training-log-head">
              <span>{t('训练日志')}</span>
              {logs.length > 0 && <Tag>{logs.length}</Tag>}
            </div>
            <div className="lottery-training-log-body">
              {logs.length > 0 ? (
                logs.map((line, index) => (
                  <div key={`${logSequence}-${index}`} className="lottery-training-log-line">{line}</div>
                ))
              ) : (
                <div className="lottery-training-log-empty">{t('训练开始后实时显示日志')}</div>
              )}
              <div ref={logEndRef} />
            </div>
          </div>
          <div className="lottery-training-kpi-grid">
            {kpis.map(item => (
              <div key={item.key} className="lottery-training-kpi">
                <span>{item.label}</span>
                <strong>
                  {item.value}
                  {item.suffix ? <em>{item.suffix}</em> : null}
                </strong>
              </div>
            ))}
          </div>
        </Card>

        <section className="lottery-training-process-grid">
          <Card className="life-panel-card lottery-training-chart-card">
            <div className="lottery-training-section-head">
              <strong>{t('训练过程 · 候选评分')}</strong>
              <span>{t('按综合评分排序的候选规则')}</span>
            </div>
            {scoreChartOption ? (
              <LotteryLocalizedECharts option={scoreChartOption} className="lottery-chart" />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('训练完成后展示候选评分')} />
            )}
          </Card>

          <Card className="life-panel-card lottery-training-chart-card">
            <div className="lottery-training-section-head">
              <strong>{t('训练过程 · 回放曲线')}</strong>
              <span>{t('逐期红球命中数与评分')}</span>
            </div>
            {timelineChartOption ? (
              <LotteryLocalizedECharts option={timelineChartOption} className="lottery-chart" />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('训练完成后展示回放曲线')} />
            )}
          </Card>
        </section>

        <Card className="life-panel-card lottery-training-timeline-card">
          <div className="lottery-training-section-head">
            <strong>{t('训练过程 · 回放明细')}</strong>
            <span>{t('点击任意一期查看预测与实际开奖对照')}</span>
          </div>
          {timeline.length > 0 ? (
            <>
              <div className="lottery-training-timeline-controls">
                <Select
                  showSearch
                  allowClear
                  placeholder={t('筛选期号')}
                  value={detailVisiblePeriod}
                  options={timeline.map(item => ({
                    label: t('第 {{period}} 期', { period: item.period }),
                    value: item.period
                  }))}
                  onChange={value => setDetailVisiblePeriod(value)}
                  className="lottery-training-timeline-select"
                  optionFilterProp="label"
                />
              </div>
              <div className="lottery-training-timeline">
                {timeline.slice(-40).reverse().map(item => {
                  const isActive = detailVisiblePeriod === item.period;
                  return (
                    <button
                      key={item.period}
                      type="button"
                      className={`lottery-training-timeline-row${isActive ? ' is-active' : ''}`}
                      onClick={() => setDetailVisiblePeriod(isActive ? undefined : item.period)}
                    >
                      <span className="lottery-training-timeline-period">{t('第 {{period}} 期', { period: item.period })}</span>
                      <LotteryBalls
                        redNumbers={item.predictedRedNumbers}
                        blueNumber={item.predictedBlueNumber}
                        hitRedNumbers={item.actualRedNumbers}
                        hitBlueNumber={item.actualBlueNumber}
                      />
                      <span className="lottery-training-timeline-meta">
                        <Tag color={getScoreColor(item.score)}>{t('评分 {{score}}', { score: item.score })}</Tag>
                        <Tag color={getPrizeColor(item.prizeName)}>{translateText(item.prizeName)}</Tag>
                        <span>{t('红球 {{hits}}/6', { hits: item.redHits })}</span>
                        {item.blueHit ? <span>{t('蓝球命中')}</span> : <span>{t('蓝球未中')}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
              {detailTimeline && (
                <div className="lottery-training-timeline-detail">
                  <div className="lottery-training-detail-col">
                    <span className="lottery-training-detail-label">{t('预测号码')}</span>
                    <LotteryBalls
                      redNumbers={detailTimeline.predictedRedNumbers}
                      blueNumber={detailTimeline.predictedBlueNumber}
                      hitRedNumbers={detailTimeline.actualRedNumbers}
                      hitBlueNumber={detailTimeline.actualBlueNumber}
                    />
                    {detailTimeline.adjustment && (
                      <span className="lottery-training-detail-note">{translateText(detailTimeline.adjustment)}</span>
                    )}
                  </div>
                  <div className="lottery-training-detail-col">
                    <span className="lottery-training-detail-label">{t('实际开奖')}</span>
                    {selectedActual ? (
                      <LotteryBalls
                        redNumbers={selectedActual.redNumbers}
                        blueNumber={selectedActual.blueNumber}
                      />
                    ) : (
                      <span className="lottery-training-detail-note">{t('暂无开奖记录')}</span>
                    )}
                  </div>
                  <div className="lottery-training-detail-col lottery-training-detail-strategy">
                    <span className="lottery-training-detail-label">{t('策略调整')}</span>
                    <span className="lottery-training-detail-note">
                      {translateText(detailTimeline.beforeRuleName)} → {translateText(detailTimeline.afterRuleName)}
                    </span>
                    <span className="lottery-training-detail-note">{translateText(detailTimeline.strategy)}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('训练完成后展示逐期回放明细')} />
          )}
        </Card>

        <section className="lottery-training-result-grid">
          <Card className="life-panel-card lottery-training-result-card">
            <div className="lottery-training-section-head">
              <strong>{t('训练结果 · 最优规则')}</strong>
              <CheckCircleOutlined />
            </div>
            {best && learnedRule ? (
              <div className="lottery-trained-rule-card">
                <div className="lottery-trained-rule-head">
                  <div>
                    <strong>{translateText(learnedRule.name)}</strong>
                    <span>{t('第 {{generation}} 代最优规则', { generation: report?.generation ?? 1 })}</span>
                  </div>
                  <Tag color={getScoreColor(best.rankScore ?? best.summary.bestScore)}>
                    {t('评分 {{score}}', { score: best.rankScore ?? best.summary.bestScore })}
                  </Tag>
                </div>
                <div className="lottery-trained-rule-metrics">
                  <span>{t('中奖期数 {{count}}/{{total}}', { count: getWinningCount(report!), total: best.summary.total })}</span>
                  <span>{t('平均红球 {{hits}}/6', { hits: best.summary.averageRedHits })}</span>
                  <span>{t('蓝球命中率 {{rate}}%', { rate: best.summary.blueHitRate })}</span>
                  <span>{t('平均评分 {{score}}', { score: best.summary.averageScore })}</span>
                  {best.summary.bestStrategy && <span>{translateText(best.summary.bestStrategy)}</span>}
                </div>
                <div className="lottery-trained-rule-params">
                  <span>{t('窗口 {{count}} 期', { count: learnedRule.recentWindow })}</span>
                  <span>{t('红球奇偶目标 {{count}}', { count: learnedRule.targetOddCount })}</span>
                  <span>{t('红球大小目标 {{count}}', { count: learnedRule.targetBigCount })}</span>
                  <span>{t('活跃权重 {{value}}', { value: learnedRule.activeWeight })}</span>
                  <span>{t('遗漏权重 {{value}}', { value: learnedRule.omissionWeight })}</span>
                  {learnedRule.requireZoneCoverage && <Tag color="blue">{t('区间覆盖')}</Tag>}
                  {learnedRule.avoidLastDraw && <Tag color="gold">{t('避开上期')}</Tag>}
                </div>
              </div>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('历史期数不足，暂时无法训练')} />
            )}
          </Card>

          <Card className="life-panel-card lottery-training-result-card">
            <div className="lottery-training-section-head">
              <strong>{t('训练结果 · 最新预测')}</strong>
              <Tag color="red">{t('预测')}</Tag>
            </div>
            {trainedPrediction?.redNumbers?.length ? (
              <>
                <div className="lottery-trained-latest">
                  <Tag color="gold">{t('当前规则')}</Tag>
                  <span>{translateText(trainedPrediction.ruleName || learnedRule?.name || '')}</span>
                </div>
                <div className="lottery-training-prediction-balls">
                  <LotteryBalls
                    redNumbers={trainedPrediction.redNumbers}
                    blueNumber={trainedPrediction.blueNumber}
                    hitRedNumbers={actualRecord?.redNumbers}
                    hitBlueNumber={actualRecord?.blueNumber}
                  />
                </div>
                <div className="lottery-trained-rule-metrics">
                  <span>{t('第 {{period}} 期', { period: trainedPrediction.targetPeriod })}</span>
                  <span>{t('基于前 {{count}} 期', { count: trainedPrediction.basedOnPeriod })}</span>
                  <span>{t('评分 {{score}}', { score: trainedPrediction.score })}</span>
                </div>
                <p className="lottery-training-prediction-reason">{trainedPrediction.reason}</p>
                {actualRecord && (
                  <Alert
                    className="lottery-training-actual-alert"
                    type={trainedPrediction.result?.prizeName && trainedPrediction.result.prizeName !== '未中奖' ? 'success' : 'info'}
                    showIcon
                    message={t('第 {{period}} 期开奖：{{redNumbers}} + {{blueNumber}}（{{prizeName}}）', {
                      period: actualRecord.period,
                      redNumbers: actualRecord.redNumbers.join(' '),
                      blueNumber: actualRecord.blueNumber,
                      prizeName: trainedPrediction.result?.prizeName ? translateText(trainedPrediction.result.prizeName) : t('待开奖')
                    })}
                  />
                )}
              </>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('训练完成后展示最新预测')} />
            )}
          </Card>
        </section>

        {best && (
          <Card className="life-panel-card lottery-training-candidates-card">
            <div className="lottery-training-section-head">
              <strong>{t('训练结果 · 候选规则排行')}</strong>
              <span>{t('按综合评分排序')}</span>
            </div>
            <div className="lottery-training-candidates">
              {rankedCandidates.map((item, index) => (
                <div key={item.config.id} className="lottery-training-candidate-row">
                  <span className="lottery-training-candidate-rank">{index + 1}</span>
                  <div className="lottery-training-candidate-body">
                    <div className="lottery-training-candidate-title">
                      <strong>{translateText(item.config.name)}</strong>
                      <Tag color={getScoreColor(item.rankScore ?? 0)}>{t('评分 {{score}}', { score: item.rankScore ?? 0 })}</Tag>
                      <span>{t('中奖 {{count}}/{{total}}', { count: item.summary.total - (item.summary.prizeDistribution['未中奖'] || 0), total: item.summary.total })}</span>
                    </div>
                    <Progress percent={Math.max(0, Math.min(100, Math.round(item.rankScore ?? 0)))} showInfo={false} size="small" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>
    </LifePageShell>
  );
};

export default LotteryPredictionTrainingPage;
