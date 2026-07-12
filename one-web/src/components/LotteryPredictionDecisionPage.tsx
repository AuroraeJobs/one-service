import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Key } from 'react';
import { Alert, Button, Card, Empty, Input, Select, Space, Spin, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined,
  CompassOutlined,
  DownloadOutlined,
  FileAddOutlined,
  FilterOutlined,
  FolderOpenOutlined,
  HistoryOutlined,
  InboxOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  ThunderboltOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import LotteryBalls from './lottery/LotteryBalls';
import { useI18n } from '../contexts/I18nContext';
import type { TranslationParams } from '../i18n/types';
import {
  lotteryBacktestApi,
  lotteryDecisionSetApi,
  lotteryPredictionApi,
  lotteryTicketApi,
  type LotteryBacktestReport,
  type LotteryDecisionCandidateSelection,
  type LotteryDecisionOutcomeItem,
  type LotteryDecisionOutcomeSummary,
  type LotteryDecisionSet,
  type LotteryPageResponse,
  type LotteryPredictionCandidate,
  type LotteryPredictionSnapshot,
  type LotteryReplayMetrics,
  type LotteryRuleComparison,
  type LotteryRuleEvidence,
  type LotteryResearchProvenance,
  type LotteryTicketBudgetPrecheckResult,
  type LotteryTicket
} from '../services/api';
import { lotteryDriftLabel, lotteryEvidenceColor, lotteryEvidenceLabel, lotteryReplayText } from '../utils/lotteryEvidence';
import {
  aggregateMiniGptPostCorpusOutcomes,
  classifyMiniGptObservationBoundary,
  MINI_GPT_OBSERVATION_BOUNDARY_METADATA,
  MINI_GPT_OBSERVATION_BOUNDARY_STATES,
  MINI_GPT_POST_CORPUS_SMALL_SAMPLE_ISSUES,
  MINI_GPT_POST_CORPUS_SNAPSHOT_LIMIT,
  lotteryOverfitWarningsText,
  type MiniGptBaselineComparabilityReason
} from '../utils/lotteryBacktestEvidence';
import './LotteryOverviewPage.css';
import './LotteryPredictionDecisionPage.css';

interface DecisionCandidateRow {
  key: string;
  generationId?: string;
  provenance?: LotteryResearchProvenance;
  snapshotId?: string;
  snapshotTitle: string;
  candidateTitle: string;
  source: 'PRIMARY' | 'CANDIDATE' | 'MINIGPT';
  targetPeriod?: number;
  ruleId?: string;
  ruleName?: string;
  redNumbers: string[];
  blueNumber?: string;
  score?: number;
  evidence?: LotteryRuleEvidence;
  replayText: string;
  driftLabel?: string;
  resultLabel: string;
  resultState: 'PENDING' | 'WON' | 'MISSED';
  redOverlap: number;
  blueOverlap: boolean;
  ticketCount: number;
  ticketState: string;
  warning?: string;
}

const evidenceOptions = [
  { label: '全部证据', value: 'ALL' },
  { label: '稳定', value: 'STABLE' },
  { label: '波动', value: 'VOLATILE' },
  { label: '过期', value: 'STALE' },
  { label: '样本少', value: 'UNDER_TESTED' },
  { label: '缺失', value: 'MISSING' }
];

const resultOptions = [
  { label: '全部结果', value: 'ALL' },
  { label: '待开奖', value: 'PENDING' },
  { label: '已中奖', value: 'WON' },
  { label: '未中奖', value: 'MISSED' }
];

const outcomeOptions = [
  { label: '全部复盘', value: 'ALL' },
  { label: '有命中', value: 'HIT' },
  { label: '未命中', value: 'MISS' },
  { label: '待开奖', value: 'PENDING' }
];

const conversionOptions = [
  { label: '全部转票', value: 'ALL' },
  { label: '已转票', value: 'CONVERTED' },
  { label: '未转票', value: 'UNCONVERTED' },
  { label: '待核奖', value: 'UNCHECKED' }
];

const outcomeAlertOptions = [
  { label: '全部提醒', value: 'ALL' },
  { label: '有提醒', value: 'WARNINGS' },
  { label: '证据过期', value: 'STALE' },
  { label: '规则波动', value: 'VOLATILE' },
  { label: '样本少', value: 'UNDER_TESTED' },
  { label: '无提醒', value: 'CLEAN' }
];

type Translate = (source: string, params?: TranslationParams) => string;

const localizeOptions = (options: Array<{ label: string; value: string }>, t: Translate) =>
  options.map(option => ({ ...option, label: t(option.label) }));

const sourceLabel = (source: DecisionCandidateRow['source'], t: Translate) =>
  t(source === 'PRIMARY' ? '主预测' : source === 'MINIGPT' ? 'MiniGPT 候选' : '候选');

const decisionSetStatusColor = (dirty: boolean) => dirty ? 'orange' : 'green';

const reviewActionLabel = (action: string, t: Translate) => {
  const labels: Record<string, string> = {
    PROMOTE: '推广',
    WATCH: '观察',
    PAUSE: '暂停',
    RETIRE: '退役'
  };
  return t(labels[action] || action);
};

const localizeBudgetWarning = (value: string, translateText: Translate, t: Translate) => {
  const translated = translateText(value);
  if (translated !== value) return translated;
  const exposureMatch = value.match(/^第 (.+) 期保存后票据数量超过上限 (.+)$/);
  return exposureMatch
    ? t('第 {{issue}} 期保存后票据数量超过上限 {{limit}}', {
      issue: exposureMatch[1],
      limit: exposureMatch[2]
    })
    : translated;
};

const budgetPrecheckMessages = (
  result: LotteryTicketBudgetPrecheckResult | undefined,
  language: string,
  translateText: Translate,
  t: Translate
) => {
  const warnings = (result?.warnings || [])
    .map(item => item.message ? localizeBudgetWarning(item.message, translateText, t) : '')
    .filter(Boolean);
  return warnings.length ? new Intl.ListFormat(language, { style: 'short', type: 'conjunction' }).format(warnings) : '';
};

const formatTime = (value: number | undefined, language: string) => {
  if (!value) {
    return '-';
  }
  return new Intl.DateTimeFormat(language, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
};

const formatMoney = (value?: number) => `¥${Number(value || 0).toFixed(2)}`;

const formatPercent = (value?: number) => `${Number(value || 0).toFixed(2)}%`;

const deltaText = (value: number | undefined, t: Translate) => {
  if (value === undefined || value === null) {
    return t('暂无基准');
  }
  const sign = Number(value) > 0 ? '+' : '';
  return `${sign}${Number(value).toFixed(2)}`;
};

const baselineComparabilityReasonText = (reason: MiniGptBaselineComparabilityReason, t: Translate) => {
  const labels: Record<MiniGptBaselineComparabilityReason, string> = {
    MISSING_REVIEW_BINDING: '未绑定人工复核回测',
    REVIEW_REPORT_UNAVAILABLE: '精确复核回测不可用',
    REPORT_ID_MISMATCH: '复核回测 ID 不匹配',
    DECISION_OWNER_MISMATCH: '回测不属于当前决策',
    UNSTABLE_DECISION_PROVENANCE: '决策溯源不完整',
    BACKTEST_PROVENANCE_MISMATCH: '回测与决策溯源不一致',
    BASELINE_WINDOW_MISMATCH: '随机基线窗口不一致',
    BASELINE_BUDGET_MISMATCH: '随机基线预算不一致',
    BASELINE_COMPARABILITY_UNKNOWN: '随机基线可比性未知',
    BASELINE_TICKET_COUNT_MISMATCH: '模型与基线票数不一致',
    BASELINE_METADATA_INCOMPLETE: '随机基线元数据不完整',
    BASELINE_DELTAS_INCOMPLETE: '随机基线差值不完整',
    UNSUPPORTED_EVALUATION_MODE: '评估模式不是固定候选池历史回放'
  };
  return t(labels[reason]);
};

const localizeSnapshotTitle = (value: string, translateText: Translate, t: Translate) => {
  const match = value.match(/^第 (.+) 期预测$/);
  return match ? t('第 {{issue}} 期预测', { issue: match[1] }) : translateText(value);
};

const localizeCandidateTitle = (value: string, translateText: Translate, t: Translate) => {
  const match = value.match(/^候选 (\d+)$/);
  return match ? t('候选 {{index}}', { index: match[1] }) : translateText(value);
};

const localizeResultLabel = (value: string, translateText: Translate, t: Translate) => {
  const match = value.match(/^(.+) · 红 (.+)\/6 · (蓝中|蓝未中)$/);
  if (!match) return translateText(value);
  return t('{{prize}} · 红球 {{redHits}}/6 · {{blueResult}}', {
    prize: translateText(match[1]),
    redHits: match[2],
    blueResult: translateText(match[3])
  });
};

const localizeTicketState = (value: string, translateText: Translate, t: Translate) => {
  const match = value.match(/^已转 (\d+) 注$/);
  return match ? t('已转 {{count}} 注', { count: match[1] }) : translateText(value);
};

const localizeDecisionSetTitle = (value: string, translateText: Translate, t: Translate) => {
  const match = value.match(/^第 (.+) 期决策集$/);
  return match ? t('第 {{issue}} 期决策集', { issue: match[1] }) : translateText(value);
};

const localizeHitDistributionLabel = (value: string, translateText: Translate, t: Translate) => {
  const match = value.match(/^(\d+)红$/);
  return match ? t('{{count}} 红球', { count: match[1] }) : translateText(value);
};

const localizeReplayText = (value: string, translateText: Translate) => translateText(value);

const localizeConversionState = (value: string, translateText: Translate) => {
  const labels: Record<string, string> = {
    DRAFT: '草稿',
    PARTIALLY_CONVERTED: '部分已转票',
    CONVERTED: '已转票',
    ARCHIVED: '已归档'
  };
  return translateText(labels[value] || value);
};

const notebookPathForDecisionOutcome = (item?: LotteryDecisionOutcomeItem) => {
  const search = new URLSearchParams({
    evidenceKey: item?.decisionSetId ? `decision:${item.decisionSetId}` : `decision:${item?.targetIssue || 'latest'}`,
    evidenceType: 'DECISION',
    evidenceTitle: item?.title || item?.targetIssue || '保存决策复盘',
    path: item?.decisionSetId
      ? `/lottery/predictions/decision?decisionSetId=${encodeURIComponent(item.decisionSetId)}&targetIssue=${encodeURIComponent(item.targetIssue || '')}`
      : item?.targetIssue ? `/lottery/predictions/decision?targetIssue=${item.targetIssue}` : '/lottery/predictions/decision',
    title: `${item?.title || item?.targetIssue || '保存决策'} 假设`
  });
  if (item?.targetIssue) {
    search.set('targetIssue', item.targetIssue);
  }
  if (item?.decisionSetId) {
    search.set('sourceId', item.decisionSetId);
  }
  return `/lottery/research/notebook?${search.toString()}`;
};

const decisionOutcomeState = (item: LotteryDecisionOutcomeItem) => {
  if ((item.winningCandidateCount || 0) > 0 || (item.winningConvertedTicketCount || 0) > 0) {
    return 'HIT';
  }
  if ((item.scoredCandidateCount || 0) > 0) {
    return 'MISS';
  }
  return 'PENDING';
};

const matchesDecisionOutcomeFilter = (
  item: LotteryDecisionOutcomeItem,
  outcomeState: string,
  conversionState: string,
  alertState: string
) => {
  if (outcomeState !== 'ALL' && decisionOutcomeState(item) !== outcomeState) {
    return false;
  }
  const convertedCount = item.convertedTicketCount || 0;
  const checkedCount = item.checkedConvertedTicketCount || 0;
  if (conversionState === 'CONVERTED' && convertedCount <= 0) {
    return false;
  }
  if (conversionState === 'UNCONVERTED' && convertedCount > 0) {
    return false;
  }
  if (conversionState === 'UNCHECKED' && (convertedCount <= 0 || checkedCount >= convertedCount)) {
    return false;
  }
  if (alertState === 'WARNINGS' && (item.warningCount || 0) <= 0) {
    return false;
  }
  if (alertState === 'STALE' && (item.staleEvidenceCount || 0) <= 0) {
    return false;
  }
  if (alertState === 'VOLATILE' && (item.volatileEvidenceCount || 0) <= 0) {
    return false;
  }
  if (alertState === 'UNDER_TESTED' && (item.underTestedEvidenceCount || 0) <= 0) {
    return false;
  }
  if (alertState === 'CLEAN' && (item.warningCount || 0) > 0) {
    return false;
  }
  return true;
};

const redOverlapCount = (left: string[] = [], right: string[] = []) => {
  const rightSet = new Set(right);
  return left.filter(item => rightSet.has(item)).length;
};

const predictionResultState = (candidate: LotteryPredictionSnapshot | LotteryPredictionCandidate): DecisionCandidateRow['resultState'] => {
  if (!candidate.result) {
    return 'PENDING';
  }
  return candidate.result.prizeName && candidate.result.prizeName !== '未中奖' ? 'WON' : 'MISSED';
};

const predictionResultLabel = (candidate: LotteryPredictionSnapshot | LotteryPredictionCandidate) => {
  if (!candidate.result) {
    return '待开奖';
  }
  return `${candidate.result.prizeName || '-'} · 红 ${candidate.result.redHits ?? '-'}/6 · ${candidate.result.blueHit ? '蓝中' : '蓝未中'}`;
};

const candidateEvidenceWarning = (evidence?: LotteryRuleEvidence, replayText?: string) => {
  if (!evidence?.tag) {
    return '缺少规则证据';
  }
  if (evidence.tag === 'UNDER_TESTED') {
    return '样本不足，先看回放';
  }
  if (evidence.tag === 'STALE') {
    return '证据过期，建议重新训练';
  }
  if (evidence.tag === 'VOLATILE') {
    return '规则波动，谨慎转票';
  }
  if (!replayText || replayText === '暂无回放证据') {
    return '缺少回放摘要';
  }
  return undefined;
};

const buildDecisionRows = (
  predictions: LotteryPredictionSnapshot[],
  tickets: LotteryTicket[]
): DecisionCandidateRow[] => {
  const reference = predictions[0];
  const ticketsBySnapshot = new Map<string, number>();
  tickets.forEach(ticket => {
    if (!ticket.predictionSnapshotId) {
      return;
    }
    ticketsBySnapshot.set(ticket.predictionSnapshotId, (ticketsBySnapshot.get(ticket.predictionSnapshotId) || 0) + 1);
  });

  return predictions.flatMap(snapshot => {
    const snapshotTicketCount = snapshot.id ? ticketsBySnapshot.get(snapshot.id) || 0 : 0;
    const replayText = lotteryReplayText(snapshot.replaySummary);
    const rows: DecisionCandidateRow[] = [
      {
        key: `snapshot:${snapshot.id || snapshot.targetPeriod}`,
        snapshotId: snapshot.id,
        snapshotTitle: snapshot.title || `第 ${snapshot.targetPeriod || '-'} 期预测`,
        candidateTitle: '主预测',
        source: 'PRIMARY',
        targetPeriod: snapshot.targetPeriod,
        ruleId: snapshot.ruleId,
        ruleName: snapshot.ruleName,
        redNumbers: snapshot.redNumbers || [],
        blueNumber: snapshot.blueNumber,
        score: snapshot.score,
        evidence: snapshot.evidence,
        replayText,
        driftLabel: snapshot.replaySummary?.driftLabel,
        resultLabel: predictionResultLabel(snapshot),
        resultState: predictionResultState(snapshot),
        redOverlap: redOverlapCount(reference?.redNumbers, snapshot.redNumbers),
        blueOverlap: Boolean(reference?.blueNumber && reference.blueNumber === snapshot.blueNumber),
        ticketCount: snapshotTicketCount,
        ticketState: snapshotTicketCount ? `已转 ${snapshotTicketCount} 注` : '未转票',
        warning: candidateEvidenceWarning(snapshot.evidence, replayText)
      }
    ];

    (snapshot.candidates || []).forEach((candidate, index) => {
      rows.push({
        key: `candidate:${snapshot.id || snapshot.targetPeriod}:${index}`,
        snapshotId: snapshot.id,
        snapshotTitle: snapshot.title || `第 ${snapshot.targetPeriod || '-'} 期预测`,
        candidateTitle: candidate.title || `候选 ${index + 1}`,
        source: 'CANDIDATE',
        targetPeriod: snapshot.targetPeriod,
        ruleId: snapshot.ruleId,
        ruleName: snapshot.ruleName,
        redNumbers: candidate.redNumbers || [],
        blueNumber: candidate.blueNumber,
        score: candidate.score,
        evidence: snapshot.evidence,
        replayText,
        driftLabel: snapshot.replaySummary?.driftLabel,
        resultLabel: predictionResultLabel(candidate),
        resultState: predictionResultState(candidate),
        redOverlap: redOverlapCount(reference?.redNumbers, candidate.redNumbers),
        blueOverlap: Boolean(reference?.blueNumber && reference.blueNumber === candidate.blueNumber),
        ticketCount: snapshotTicketCount,
        ticketState: snapshotTicketCount ? '同快照已转票' : '未转票',
        warning: candidateEvidenceWarning(snapshot.evidence, replayText)
      });
    });

    return rows;
  });
};

const decisionRowToSelection = (row: DecisionCandidateRow): LotteryDecisionCandidateSelection => ({
  key: row.key,
  generationId: row.generationId,
  provenance: row.provenance,
  snapshotId: row.snapshotId,
  snapshotTitle: row.snapshotTitle,
  candidateTitle: row.candidateTitle,
  source: row.source,
  targetPeriod: row.targetPeriod,
  ruleId: row.ruleId,
  ruleName: row.ruleName,
  redNumbers: row.redNumbers,
  blueNumber: row.blueNumber,
  score: row.score,
  evidence: row.evidence,
  replayText: row.replayText,
  driftLabel: row.driftLabel,
  resultLabel: row.resultLabel,
  resultState: row.resultState,
  redOverlap: row.redOverlap,
  blueOverlap: row.blueOverlap,
  ticketCount: row.ticketCount,
  ticketState: row.ticketState,
  warning: row.warning
});

const savedDecisionRows = (decisionSet?: LotteryDecisionSet): DecisionCandidateRow[] => (
  (decisionSet?.selectedCandidates || []).map((candidate, index) => ({
    key: candidate.key || candidate.generationId || `saved:${decisionSet?.id || 'decision'}:${index}`,
    generationId: candidate.generationId,
    provenance: candidate.provenance || decisionSet?.provenance,
    snapshotId: candidate.snapshotId,
    snapshotTitle: candidate.snapshotTitle || decisionSet?.title || 'MiniGPT 决策集',
    candidateTitle: candidate.candidateTitle || `MiniGPT 候选 ${index + 1}`,
    source: candidate.source === 'MINIGPT' || candidate.generationId ? 'MINIGPT' : candidate.source === 'PRIMARY' ? 'PRIMARY' : 'CANDIDATE',
    targetPeriod: candidate.targetPeriod || (decisionSet?.targetIssue ? Number(decisionSet.targetIssue) : undefined),
    ruleId: candidate.ruleId,
    ruleName: candidate.ruleName || decisionSet?.ruleName,
    redNumbers: candidate.redNumbers || [],
    blueNumber: candidate.blueNumber,
    score: candidate.score,
    evidence: candidate.evidence,
    replayText: candidate.replayText || 'MiniGPT 服务端校验候选',
    driftLabel: candidate.driftLabel,
    resultLabel: candidate.resultLabel || '待开奖',
    resultState: candidate.resultState === 'WON' || candidate.resultState === 'MISSED' ? candidate.resultState : 'PENDING',
    redOverlap: candidate.redOverlap || 0,
    blueOverlap: Boolean(candidate.blueOverlap),
    ticketCount: candidate.ticketCount || candidate.convertedTicketIds?.length || 0,
    ticketState: candidate.ticketState || (candidate.convertedTicketIds?.length ? `已转 ${candidate.convertedTicketIds.length} 注` : '未转票'),
    warning: candidate.warning
  }))
);

const LotteryPredictionDecisionPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { language, t, translateText } = useI18n();
  const isEnglish = language.toLowerCase().startsWith('en');
  const translateTextRef = useRef(translateText);
  const appliedDecisionSetQueryRef = useRef('');
  const postCorpusRequestIdRef = useRef(0);
  translateTextRef.current = translateText;
  const [predictions, setPredictions] = useState<LotteryPredictionSnapshot[]>([]);
  const [pageResponse, setPageResponse] = useState<LotteryPageResponse<LotteryPredictionSnapshot>>();
  const [ruleComparison, setRuleComparison] = useState<LotteryRuleComparison>();
  const [replayMetrics, setReplayMetrics] = useState<LotteryReplayMetrics>();
  const [predictionTickets, setPredictionTickets] = useState<LotteryTicket[]>([]);
  const [decisionSets, setDecisionSets] = useState<LotteryDecisionSet[]>([]);
  const [decisionOutcomeSummary, setDecisionOutcomeSummary] = useState<LotteryDecisionOutcomeSummary>();
  const [postCorpusOutcomeSummary, setPostCorpusOutcomeSummary] = useState<LotteryDecisionOutcomeSummary>();
  const [postCorpusDecisionPage, setPostCorpusDecisionPage] = useState<LotteryPageResponse<LotteryDecisionSet>>();
  const [postCorpusBacktestsById, setPostCorpusBacktestsById] = useState<Record<string, LotteryBacktestReport | null>>({});
  const [activeDecisionSetId, setActiveDecisionSetId] = useState<string>();
  const [decisionSetTitle, setDecisionSetTitle] = useState('');
  const [decisionSetNote, setDecisionSetNote] = useState('');
  const [ticketBudgetPrecheck, setTicketBudgetPrecheck] = useState<LotteryTicketBudgetPrecheckResult>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDecisionSets, setLoadingDecisionSets] = useState(false);
  const [loadingPostCorpusObservation, setLoadingPostCorpusObservation] = useState(false);
  const [savingDecisionSet, setSavingDecisionSet] = useState(false);
  const [archivingDecisionSet, setArchivingDecisionSet] = useState(false);
  const [savingTickets, setSavingTickets] = useState(false);
  const [reviewingDecisionSet, setReviewingDecisionSet] = useState<string>();
  const [decisionDirty, setDecisionDirty] = useState(false);
  const [error, setError] = useState<string>();
  const [postCorpusObservationError, setPostCorpusObservationError] = useState<string>();

  const targetIssue = searchParams.get('targetIssue') || '';
  const requestedDecisionSetId = searchParams.get('decisionSetId') || '';
  const requestedBacktestId = searchParams.get('backtestId') || '';
  const ruleName = searchParams.get('ruleName') || '';
  const evidenceState = searchParams.get('evidence') || 'ALL';
  const resultState = searchParams.get('resultState') || 'ALL';
  const outcomeState = searchParams.get('outcomeState') || 'ALL';
  const conversionState = searchParams.get('conversionState') || 'ALL';
  const outcomeAlertState = searchParams.get('outcomeAlert') || 'ALL';

  const localizedOptions = useMemo(() => ({
    evidence: localizeOptions(evidenceOptions, t),
    result: localizeOptions(resultOptions, t),
    outcome: localizeOptions(outcomeOptions, t),
    conversion: localizeOptions(conversionOptions, t),
    alerts: localizeOptions(outcomeAlertOptions, t)
  }), [t]);

  const updateQuery = useCallback((patch: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === 'ALL') {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const markDecisionDirty = useCallback(() => {
    if (activeDecisionSetId) {
      setDecisionDirty(true);
    }
  }, [activeDecisionSetId]);

  const updateDecisionQuery = useCallback((patch: Record<string, string | number | undefined>) => {
    markDecisionDirty();
    updateQuery(patch);
  }, [markDecisionDirty, updateQuery]);

  const loadDecisionSets = useCallback(async () => {
    setLoadingDecisionSets(true);
    try {
      const [response, outcomes] = await Promise.all([
        lotteryDecisionSetApi.decisionSets({ page: 1, pageSize: 30 }),
        lotteryDecisionSetApi.outcomes({ limit: 30 })
      ]);
      setDecisionSets(response.items || []);
      setDecisionOutcomeSummary(outcomes);
    } catch (requestError) {
      console.error('读取已保存决策集失败:', requestError);
      message.warning(translateTextRef.current('已使用当前页面状态，暂未读取到已保存决策集'));
    } finally {
      setLoadingDecisionSets(false);
    }
  }, []);

  const loadPostCorpusObservation = useCallback(async () => {
    const requestId = postCorpusRequestIdRef.current + 1;
    postCorpusRequestIdRef.current = requestId;
    setLoadingPostCorpusObservation(true);
    setPostCorpusObservationError(undefined);
    try {
      const [outcomes, decisionPage] = await Promise.all([
        lotteryDecisionSetApi.outcomes({
          includeArchived: true,
          limit: MINI_GPT_POST_CORPUS_SNAPSHOT_LIMIT
        }),
        lotteryDecisionSetApi.decisionSets({
          includeArchived: true,
          page: 1,
          pageSize: MINI_GPT_POST_CORPUS_SNAPSHOT_LIMIT
        })
      ]);
      const preview = aggregateMiniGptPostCorpusOutcomes(outcomes.items || []);
      const reviewedBacktestIds = [...new Set(preview.groups.flatMap(group => group.decisions)
        .filter(decision => decision.stableProvenance)
        .map(decision => decision.item.reviewBacktestId?.trim())
        .filter((id): id is string => Boolean(id)))];
      const resolvedBacktests = await Promise.all(reviewedBacktestIds.map(async id => {
        try {
          return [id, await lotteryBacktestApi.detail(id)] as const;
        } catch {
          return [id, null] as const;
        }
      }));
      if (requestId !== postCorpusRequestIdRef.current) return;
      setPostCorpusOutcomeSummary(outcomes);
      setPostCorpusDecisionPage(decisionPage);
      setPostCorpusBacktestsById(Object.fromEntries(resolvedBacktests));
    } catch (requestError) {
      if (requestId !== postCorpusRequestIdRef.current) return;
      console.error('读取 MiniGPT 语料后观察聚合失败:', requestError);
      setPostCorpusObservationError(requestError instanceof Error
        ? requestError.message
        : translateTextRef.current('读取 MiniGPT 语料后观察聚合失败'));
    } finally {
      if (requestId === postCorpusRequestIdRef.current) {
        setLoadingPostCorpusObservation(false);
      }
    }
  }, []);

  const loadDecision = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const targetPeriod = Number(targetIssue);
      const [history, rules, replay, tickets] = await Promise.all([
        lotteryPredictionApi.historyPage({
          page: 1,
          pageSize: 24,
          resultState,
          targetPeriod: Number.isFinite(targetPeriod) && targetPeriod > 0 ? targetPeriod : undefined,
          ruleName: ruleName.trim() || undefined
        }),
        lotteryPredictionApi.compareRules({ limit: 16 }),
        lotteryPredictionApi.replayMetrics({ window: 100 }),
        lotteryTicketApi.ticketsPage({ page: 1, pageSize: 200, source: 'PREDICTION' })
      ]);
      setPageResponse(history);
      setPredictions(history.items || []);
      setRuleComparison(rules);
      setReplayMetrics(replay);
      setPredictionTickets(tickets.items || []);
    } catch (requestError) {
      console.error('读取预测决策板失败:', requestError);
      setError(requestError instanceof Error
        ? requestError.message
        : translateTextRef.current('读取预测决策板失败'));
    } finally {
      setLoading(false);
    }
  }, [resultState, ruleName, targetIssue]);

  useEffect(() => {
    loadDecision();
  }, [loadDecision]);

  useEffect(() => {
    loadDecisionSets();
  }, [loadDecisionSets]);

  useEffect(() => {
    loadPostCorpusObservation();
    return () => {
      postCorpusRequestIdRef.current += 1;
    };
  }, [loadPostCorpusObservation]);

  const activeDecisionSet = useMemo(
    () => decisionSets.find(item => item.id === activeDecisionSetId),
    [activeDecisionSetId, decisionSets]
  );
  const isMiniGptDecisionSet = Boolean(activeDecisionSet?.provenance?.batchId || activeDecisionSet?.provenance?.generationId);

  const decisionRows = useMemo(() => {
    const predictionRows = buildDecisionRows(predictions, predictionTickets);
    const existingKeys = new Set(predictionRows.map(row => row.key));
    return [
      ...savedDecisionRows(activeDecisionSet).filter(row => !existingKeys.has(row.key)),
      ...predictionRows
    ];
  }, [activeDecisionSet, predictionTickets, predictions]);

  const filteredRows = useMemo(() => decisionRows.filter(row => {
    if (evidenceState === 'MISSING' && row.evidence?.tag) {
      return false;
    }
    if (evidenceState !== 'ALL' && evidenceState !== 'MISSING' && row.evidence?.tag !== evidenceState) {
      return false;
    }
    if (resultState !== 'ALL' && row.resultState !== resultState) {
      return false;
    }
    return true;
  }), [decisionRows, evidenceState, resultState]);

  const filteredDecisionOutcomes = useMemo(() => {
    const items = decisionOutcomeSummary?.items || [];
    return items.filter(item => matchesDecisionOutcomeFilter(item, outcomeState, conversionState, outcomeAlertState));
  }, [conversionState, decisionOutcomeSummary?.items, outcomeAlertState, outcomeState]);

  const selectedRowSet = useMemo(() => new Set(selectedRowKeys.map(String)), [selectedRowKeys]);
  const selectedRows = useMemo(
    () => filteredRows.filter(row => selectedRowSet.has(row.key)),
    [filteredRows, selectedRowSet]
  );

  const activeDecisionOutcome = useMemo<LotteryDecisionOutcomeItem | undefined>(() => {
    return filteredDecisionOutcomes.find(item => item.decisionSetId === activeDecisionSetId)
      || (targetIssue ? filteredDecisionOutcomes.find(item => item.targetIssue === targetIssue) : undefined)
      || filteredDecisionOutcomes[0];
  }, [activeDecisionSetId, filteredDecisionOutcomes, targetIssue]);
  const activeDecisionBoundaryOutcome = useMemo<LotteryDecisionOutcomeItem | undefined>(() => {
    if (!activeDecisionSetId) return undefined;
    return (decisionOutcomeSummary?.items || []).find(item => item.decisionSetId === activeDecisionSetId);
  }, [activeDecisionSetId, decisionOutcomeSummary?.items]);
  const miniGptObservationBoundary = useMemo(() => classifyMiniGptObservationBoundary({
    provenance: activeDecisionSet?.provenance,
    targetIssue: activeDecisionSet?.targetIssue || (activeDecisionSet?.targetPeriod ? String(activeDecisionSet.targetPeriod) : undefined),
    hasObservedResult: activeDecisionBoundaryOutcome
      ? Number(activeDecisionBoundaryOutcome.scoredCandidateCount || 0) > 0
      : undefined
  }), [activeDecisionBoundaryOutcome, activeDecisionSet]);
  const miniGptObservationBoundaryCopy = {
    label: isEnglish ? miniGptObservationBoundary.metadata.label.en : miniGptObservationBoundary.metadata.label.zh,
    detail: isEnglish ? miniGptObservationBoundary.metadata.detail.en : miniGptObservationBoundary.metadata.detail.zh
  };
  const decisionReviewBacktestId = requestedBacktestId || activeDecisionSet?.reviewBacktestId || activeDecisionOutcome?.reviewBacktestId || '';

  const defaultDecisionSetTitle = useMemo(() => {
    const selectedIssue = selectedRows[0]?.targetPeriod;
    if (targetIssue) {
      return `第 ${targetIssue} 期决策集`;
    }
    return selectedIssue ? `第 ${selectedIssue} 期决策集` : '预测决策集';
  }, [selectedRows, targetIssue]);

  const defaultDecisionSetPlaceholder = useMemo(
    () => localizeDecisionSetTitle(defaultDecisionSetTitle, translateText, t),
    [defaultDecisionSetTitle, t, translateText]
  );

  const decisionSetOptions = useMemo(() => decisionSets.map(item => ({
    label: localizeDecisionSetTitle(
      item.title || item.targetIssue || item.id || '未命名决策集',
      translateText,
      t
    ),
    value: item.id || ''
  })).filter(item => item.value), [decisionSets, t, translateText]);

  useEffect(() => {
    if (!requestedDecisionSetId || appliedDecisionSetQueryRef.current === requestedDecisionSetId) return;
    const decisionSet = decisionSets.find(item => item.id === requestedDecisionSetId);
    if (!decisionSet) return;
    appliedDecisionSetQueryRef.current = requestedDecisionSetId;
    setActiveDecisionSetId(decisionSet.id);
    setDecisionSetTitle(decisionSet.title || '');
    setDecisionSetNote(decisionSet.note || '');
    setSelectedRowKeys((decisionSet.selectedCandidates || [])
      .map(item => item.key || item.generationId)
      .filter((key): key is string => Boolean(key)));
    setDecisionDirty(false);
    if (!targetIssue && decisionSet.targetIssue) {
      updateQuery({ targetIssue: decisionSet.targetIssue });
    }
  }, [decisionSets, requestedDecisionSetId, targetIssue, updateQuery]);

  const summary = useMemo(() => {
    const stable = filteredRows.filter(row => row.evidence?.tag === 'STABLE').length;
    const warning = filteredRows.filter(row => row.warning).length;
    const converted = filteredRows.filter(row => row.ticketCount > 0).length;
    const pending = filteredRows.filter(row => row.resultState === 'PENDING').length;
    return { stable, warning, converted, pending };
  }, [filteredRows]);

  const outcomeSummary = useMemo(() => {
    const totalCost = filteredDecisionOutcomes.reduce((sum, item) => sum + Number(item.totalCost || 0), 0);
    const totalPrize = filteredDecisionOutcomes.reduce((sum, item) => sum + Number(item.totalPrize || 0), 0);
    const warning = filteredDecisionOutcomes.reduce((sum, item) => sum + Number(item.warningCount || 0), 0);
    const unchecked = filteredDecisionOutcomes.filter(item =>
      (item.convertedTicketCount || 0) > (item.checkedConvertedTicketCount || 0)
    ).length;
    return {
      count: filteredDecisionOutcomes.length,
      hit: filteredDecisionOutcomes.filter(item => decisionOutcomeState(item) === 'HIT').length,
      unchecked,
      warning,
      net: totalPrize - totalCost,
      roi: totalCost > 0 ? ((totalPrize - totalCost) / totalCost) * 100 : 0
    };
  }, [filteredDecisionOutcomes]);

  const postCorpusObservation = useMemo(() => aggregateMiniGptPostCorpusOutcomes(
    postCorpusOutcomeSummary?.items || [],
    postCorpusBacktestsById
  ), [postCorpusBacktestsById, postCorpusOutcomeSummary?.items]);
  const postCorpusSnapshotTotal = Math.max(
    Number(postCorpusDecisionPage?.total || 0),
    postCorpusObservation.boundedInputCount
  );
  const postCorpusSnapshotTruncated = Boolean(postCorpusDecisionPage?.hasNext)
    || postCorpusSnapshotTotal > postCorpusObservation.boundedInputCount;

  const budgetWarningText = useMemo(
    () => budgetPrecheckMessages(ticketBudgetPrecheck, language, translateText, t),
    [language, t, ticketBudgetPrecheck, translateText]
  );

  const saveSelectedTickets = async () => {
    if (isMiniGptDecisionSet) {
      message.warning(t('MiniGPT 候选必须先在实验页预览并显式创建票包草稿，不能从决策页直接落票。'));
      return;
    }
    if (!selectedRows.length) {
      message.warning(t('请先选择候选号码'));
      return;
    }
    const targetWithoutIssue = selectedRows.filter(row => !row.targetPeriod);
    if (targetWithoutIssue.length) {
      message.warning(t('选中项缺少目标期号'));
      return;
    }
    setSavingTickets(true);
    setError(undefined);
    try {
      const ticketPayload = selectedRows.map(row => ({
        issue: String(row.targetPeriod),
        redNumbers: row.redNumbers,
        blueNumber: row.blueNumber,
        quantity: 1,
        cost: 2,
        source: 'PREDICTION',
        status: 'DRAFT',
        predictionSnapshotId: row.snapshotId,
        note: `决策板转票：${row.snapshotTitle} / ${row.candidateTitle}`
      }));
      const precheck = await lotteryTicketApi.budgetPrecheck({ tickets: ticketPayload });
      setTicketBudgetPrecheck(precheck);
      const warnings = budgetPrecheckMessages(precheck, language, translateText, t);
      if (warnings) {
        message.warning(warnings);
      }
      const result = await lotteryTicketApi.saveTickets(ticketPayload);
      if (result.budgetPrecheck) {
        setTicketBudgetPrecheck(result.budgetPrecheck);
      }
      message.success(t('已保存 {{savedCount}} 注，跳过重复 {{duplicateCount}} 注', {
        savedCount: result.savedCount || 0,
        duplicateCount: result.duplicateCount || 0
      }));
      if (activeDecisionSetId) {
        setDecisionDirty(true);
      } else {
        setSelectedRowKeys([]);
      }
      await loadDecision();
    } catch (requestError) {
      console.error('保存决策候选为票据失败:', requestError);
      setError(requestError instanceof Error
        ? requestError.message
        : t('保存决策候选为票据失败'));
      message.error(t('保存决策候选失败'));
    } finally {
      setSavingTickets(false);
    }
  };

  const buildDecisionSetPayload = () => {
    const selectedIssue = selectedRows[0]?.targetPeriod;
    return {
      title: decisionSetTitle.trim() || defaultDecisionSetTitle,
      targetIssue: targetIssue || (selectedIssue ? String(selectedIssue) : undefined),
      targetPeriod: selectedIssue,
      ruleName: ruleName.trim() || selectedRows[0]?.ruleName,
      evidenceState,
      resultState,
      conversionState: selectedRows.some(row => row.ticketCount > 0) ? 'PARTIALLY_CONVERTED' : 'DRAFT',
      note: decisionSetNote.trim() || undefined,
      selectedCandidates: selectedRows.map(decisionRowToSelection)
    };
  };

  const saveDecisionSet = async () => {
    if (!selectedRows.length) {
      message.warning(t('请先选择要保存的候选号码'));
      return;
    }
    setSavingDecisionSet(true);
    setError(undefined);
    try {
      const payload = buildDecisionSetPayload();
      const saved = activeDecisionSetId
        ? await lotteryDecisionSetApi.updateDecisionSet(activeDecisionSetId, payload)
        : await lotteryDecisionSetApi.createDecisionSet(payload);
      setActiveDecisionSetId(saved.id);
      appliedDecisionSetQueryRef.current = saved.id || '';
      updateQuery({ decisionSetId: saved.id, targetIssue: saved.targetIssue || payload.targetIssue });
      setDecisionSetTitle(saved.title || payload.title || '');
      setDecisionSetNote(saved.note || '');
      setDecisionDirty(false);
      await Promise.all([loadDecisionSets(), loadPostCorpusObservation()]);
      message.success(activeDecisionSetId
        ? t('决策集已更新')
        : t('决策集已保存'));
    } catch (requestError) {
      console.error('保存决策集失败:', requestError);
      setError(requestError instanceof Error
        ? requestError.message
        : t('保存决策集失败'));
      message.error(t('保存决策集失败'));
    } finally {
      setSavingDecisionSet(false);
    }
  };

  const applyDecisionSet = (id?: string) => {
    if (!id) {
      appliedDecisionSetQueryRef.current = '';
      setActiveDecisionSetId(undefined);
      setDecisionSetTitle('');
      setDecisionSetNote('');
      setDecisionDirty(false);
      updateQuery({ decisionSetId: undefined });
      return;
    }
    const decisionSet = decisionSets.find(item => item.id === id);
    if (!decisionSet) {
      return;
    }
    setActiveDecisionSetId(decisionSet.id);
    setDecisionSetTitle(decisionSet.title || '');
    setDecisionSetNote(decisionSet.note || '');
    setSelectedRowKeys((decisionSet.selectedCandidates || [])
      .map(item => item.key || item.generationId)
      .filter((key): key is string => Boolean(key)));
    setDecisionDirty(false);
    appliedDecisionSetQueryRef.current = decisionSet.id || '';
    updateQuery({
      decisionSetId: decisionSet.id,
      targetIssue: decisionSet.targetIssue,
      ruleName: decisionSet.ruleName,
      evidence: ['STABLE', 'VOLATILE', 'STALE', 'UNDER_TESTED', 'MISSING'].includes(decisionSet.evidenceState || '')
        ? decisionSet.evidenceState
        : undefined,
      resultState: decisionSet.resultState
    });
  };

  const archiveDecisionSet = async () => {
    if (!activeDecisionSetId) {
      message.warning(t('请先选择已保存决策集'));
      return;
    }
    setArchivingDecisionSet(true);
    setError(undefined);
    try {
      await lotteryDecisionSetApi.archiveDecisionSet(activeDecisionSetId);
      setActiveDecisionSetId(undefined);
      setDecisionSetTitle('');
      setDecisionSetNote('');
      setDecisionDirty(false);
      await Promise.all([loadDecisionSets(), loadPostCorpusObservation()]);
      message.success(t('决策集已归档'));
    } catch (requestError) {
      console.error('归档决策集失败:', requestError);
      setError(requestError instanceof Error
        ? requestError.message
        : t('归档决策集失败'));
      message.error(t('归档决策集失败'));
    } finally {
      setArchivingDecisionSet(false);
    }
  };

  const reviewDecisionSet = async (reviewAction: 'PROMOTE' | 'WATCH' | 'PAUSE' | 'RETIRE') => {
    if (!activeDecisionSetId) {
      message.warning(t('请先选择已保存决策集'));
      return;
    }
    if (!decisionReviewBacktestId) {
      message.warning(t('请先从 MiniGPT 回测结果进入决策页，或选择已绑定回测的决策集。'));
      return;
    }
    setReviewingDecisionSet(reviewAction);
    setError(undefined);
    try {
      const reviewed = await lotteryDecisionSetApi.reviewDecisionSet(activeDecisionSetId, {
        reviewAction,
        backtestId: decisionReviewBacktestId,
        note: decisionSetNote.trim() || undefined
      });
      setDecisionSets(current => current.map(item => item.id === reviewed.id ? reviewed : item));
      setDecisionSetNote(reviewed.reviewNote || reviewed.note || '');
      await Promise.all([loadDecisionSets(), loadPostCorpusObservation()]);
      message.success(t('复核动作已保存：{{action}}', { action: reviewActionLabel(reviewAction, t) }));
    } catch (requestError) {
      console.error('保存决策集复核动作失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : t('保存决策集复核动作失败'));
      message.error(t('保存决策集复核动作失败'));
    } finally {
      setReviewingDecisionSet(undefined);
    }
  };

  const columns: ColumnsType<DecisionCandidateRow> = [
    {
      title: t('候选'),
      key: 'candidate',
      width: 210,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <strong>{localizeCandidateTitle(record.candidateTitle, translateText, t)}</strong>
          <span className="stock-quote-code">{localizeSnapshotTitle(record.snapshotTitle, translateText, t)}</span>
          <Space wrap size={4}>
            <Tag color={record.source === 'PRIMARY' ? 'blue' : record.source === 'MINIGPT' ? 'purple' : 'default'}>{sourceLabel(record.source, t)}</Tag>
            <Tag>{record.targetPeriod ? t('第 {{issue}} 期', { issue: record.targetPeriod }) : '-'}</Tag>
          </Space>
          {record.generationId ? <span className="lottery-decision-lineage-id">generationId={record.generationId}</span> : null}
        </Space>
      )
    },
    {
      title: t('号码'),
      key: 'numbers',
      render: (_, record) => <LotteryBalls redNumbers={record.redNumbers} blueNumber={record.blueNumber || ''} />
    },
    {
      title: t('证据'),
      key: 'evidence',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Space wrap size={4}>
            <Tag color={lotteryEvidenceColor(record.evidence?.tag)}>{translateText(lotteryEvidenceLabel(record.evidence))}</Tag>
            <Tag>{translateText(lotteryDriftLabel(record.driftLabel))}</Tag>
          </Space>
          <span className="stock-quote-code">{localizeReplayText(record.replayText, translateText)}</span>
          {record.warning ? <Tag color="orange">{translateText(record.warning)}</Tag> : null}
        </Space>
      )
    },
    {
      title: t('对比'),
      key: 'overlap',
      width: 128,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <span>{t('红球重合')} {record.redOverlap}/6</span>
          <Tag color={record.blueOverlap ? 'blue' : 'default'}>
            {t(record.blueOverlap ? '蓝球重合' : '蓝球不同')}
          </Tag>
        </Space>
      )
    },
    {
      title: t('结果/转票'),
      key: 'result',
      width: 210,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Tag color={record.resultState === 'WON' ? 'blue' : record.resultState === 'MISSED' ? 'default' : 'gold'}>
            {localizeResultLabel(record.resultLabel, translateText, t)}
          </Tag>
          <Tag color={record.ticketCount ? 'green' : 'default'}>{localizeTicketState(record.ticketState, translateText, t)}</Tag>
          <span className="stock-quote-code">{t('评分')} {record.score ?? '-'}</span>
        </Space>
      )
    },
    {
      title: t('操作'),
      key: 'actions',
      width: 108,
      render: (_, record) => record.snapshotId ? (
        <Button size="small" icon={<HistoryOutlined />} onClick={() => navigate(`/lottery/predictions/${record.snapshotId}`)}>
          {t('快照')}
        </Button>
      ) : null
    }
  ];

  return (
    <LifePageShell
      className="lottery-prediction-page lottery-decision-page"
      eyebrow={t('彩票数据')}
      title={t('预测决策板')}
      actions={
        <Space wrap>
          <Button type="primary" icon={<FileAddOutlined />} loading={savingTickets} disabled={isMiniGptDecisionSet} onClick={saveSelectedTickets}>
            {t('转为票据')}
          </Button>
          <Button
            icon={<ReloadOutlined />}
            loading={loading || loadingPostCorpusObservation}
            onClick={() => {
              loadDecision();
              loadDecisionSets();
              loadPostCorpusObservation();
            }}
          >
            {t('刷新')}
          </Button>
          <Button icon={<ThunderboltOutlined />} onClick={() => navigate('/lottery/prediction')}>
            {t('训练')}
          </Button>
          <Button icon={<HistoryOutlined />} onClick={() => navigate('/lottery/predictions/history')}>
            {t('历史')}
          </Button>
          <Button icon={<FileAddOutlined />} onClick={() => navigate(notebookPathForDecisionOutcome(activeDecisionOutcome))}>
            {t('写入笔记')}
          </Button>
          <Button icon={<CompassOutlined />} onClick={() => navigate('/lottery/recommendations')}>
            {t('推荐')}
          </Button>
          <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
            {t('打印')}
          </Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={translateText(error)} /> : null}
      <Alert
        className="lottery-overview-status-alert"
        type="info"
        showIcon
        message={t('决策板只汇总历史预测、回放、规则证据和个人票据状态，用于复盘和记录，不代表结果承诺。')}
      />
      {budgetWarningText ? (
        <Alert
          className="lottery-overview-status-alert"
          type={ticketBudgetPrecheck?.status === 'OVER' ? 'error' : 'warning'}
          showIcon
          message={budgetWarningText}
        />
      ) : null}

      <section className="lottery-decision-saved-bar">
        <Select
          allowClear
          suffixIcon={<FolderOpenOutlined />}
          loading={loadingDecisionSets}
          placeholder={t('已保存决策集')}
          value={activeDecisionSetId}
          options={decisionSetOptions}
          onChange={value => applyDecisionSet(value || undefined)}
        />
        <Input
          allowClear
          prefix={<SaveOutlined />}
          placeholder={defaultDecisionSetPlaceholder}
          value={decisionSetTitle}
          onChange={event => {
            setDecisionSetTitle(event.target.value);
            markDecisionDirty();
          }}
        />
        <Input
          allowClear
          placeholder={t('备注')}
          value={decisionSetNote}
          onChange={event => {
            setDecisionSetNote(event.target.value);
            markDecisionDirty();
          }}
        />
        <Space wrap>
          <Button icon={<SaveOutlined />} loading={savingDecisionSet} onClick={saveDecisionSet}>
            {t('保存决策集')}
          </Button>
          <Button icon={<InboxOutlined />} disabled={!activeDecisionSetId} loading={archivingDecisionSet} onClick={archiveDecisionSet}>
            {t('归档')}
          </Button>
          {activeDecisionSet ? (
            <Tag color={decisionSetStatusColor(decisionDirty)}>
              {decisionDirty
                ? t('有未保存变更')
                : localizeConversionState(activeDecisionSet.conversionState || '已保存', translateText)}
            </Tag>
          ) : (
            <Tag>{t('未保存')}</Tag>
          )}
        </Space>
      </section>

      {activeDecisionSet ? (
        <section className="lottery-decision-lineage-panel">
          <div className="lottery-decision-lineage-copy">
            <strong>{t('MiniGPT 决策溯源')}</strong>
            <span>decisionSetId={activeDecisionSet.id || '-'}</span>
            <span>batchId={activeDecisionSet.provenance?.batchId || '-'}</span>
            <span>runId={activeDecisionSet.provenance?.runId || '-'}</span>
            <span>corpusVersion={activeDecisionSet.provenance?.corpusVersion || '-'}</span>
            <span>backtestId={decisionReviewBacktestId || '-'}</span>
          </div>
          <Space wrap>
            {(['PROMOTE', 'WATCH', 'PAUSE', 'RETIRE'] as const).map(action => (
              <Button
                key={action}
                size="small"
                danger={action === 'RETIRE'}
                type={action === 'PROMOTE' ? 'primary' : 'default'}
                loading={reviewingDecisionSet === action}
                disabled={!decisionReviewBacktestId}
                onClick={() => reviewDecisionSet(action)}
              >
                {reviewActionLabel(action, t)}
              </Button>
            ))}
            <Tag color={activeDecisionSet.reviewAction ? 'blue' : 'default'}>
              {t('当前复核')} {activeDecisionSet.reviewAction ? reviewActionLabel(activeDecisionSet.reviewAction, t) : t('未复核')}
            </Tag>
          </Space>
          <div
            className="lottery-decision-lineage-boundary"
            data-boundary-state={miniGptObservationBoundary.state}
            data-out-of-sample-observation={miniGptObservationBoundary.isOutOfSampleObservation}
          >
            <div className="lottery-decision-lineage-boundary-heading">
              <strong>{t('时间边界')}</strong>
              <span className="lottery-decision-lineage-boundary-state">
                <small>{t('边界状态')}</small>
                <Tag color={miniGptObservationBoundary.tone}>{miniGptObservationBoundaryCopy.label}</Tag>
              </span>
            </div>
            <dl className="lottery-decision-lineage-boundary-grid">
              <div>
                <dt>{t('训练范围')}</dt>
                <dd>{miniGptObservationBoundary.trainRange
                  ? `${miniGptObservationBoundary.trainRange.firstIssue} → ${miniGptObservationBoundary.trainRange.latestIssue}`
                  : 'UNKNOWN'}</dd>
              </div>
              <div>
                <dt>{t('验证范围')}</dt>
                <dd>{miniGptObservationBoundary.validationRange
                  ? `${miniGptObservationBoundary.validationRange.firstIssue} → ${miniGptObservationBoundary.validationRange.latestIssue}`
                  : 'UNKNOWN'}</dd>
              </div>
              <div>
                <dt>{t('目标期')}</dt>
                <dd>{miniGptObservationBoundary.targetIssue || 'UNKNOWN'}</dd>
              </div>
            </dl>
            <p className="lottery-decision-lineage-boundary-detail">{miniGptObservationBoundaryCopy.detail}</p>
            <div className="lottery-decision-lineage-guardrails" role="note">
              <span>{t('只有目标期晚于训练与验证语料范围且已有实际评分，才称为样本外观察。')}</span>
              <span>{t('单期样本外观察不是 walk-forward，也不构成未来表现证据；不可外推未来。')}</span>
            </div>
          </div>
          <Alert
            type="info"
            showIcon
            message={t('复核只记录研究生命周期动作，不会自动审批票包或生成票据。')}
          />
        </section>
      ) : null}

      <section
        className="lottery-decision-observation-aggregate"
        data-boundary-state="POST_CORPUS_OBSERVED"
        data-observed-denominator={postCorpusObservation.observedDecisionCount}
        data-read-only="true"
      >
        <Card
          className="life-panel-card lottery-clean-panel"
          title={<Space><SafetyCertificateOutlined />{t('语料后观察聚合')}</Space>}
          extra={(
            <Space wrap size={6}>
              <Tag color="purple">{t('只读研究证据')}</Tag>
              <Tag>{t('最近 {{loaded}}/{{total}} 条', {
                loaded: postCorpusObservation.boundedInputCount,
                total: postCorpusSnapshotTotal
              })}</Tag>
            </Space>
          )}
        >
          <Alert
            type="info"
            showIcon
            message={t('只有 POST_CORPUS_OBSERVED 进入观察分母；训练、验证、待观察和未知状态始终分开计数。')}
            description={t('随机基线只读取当前决策绑定的精确复核回测，并同时校验溯源、同窗口和同预算。任何正差值都不会升级时间边界或构成未来表现结论。')}
          />
          {postCorpusObservationError ? (
            <Alert
              type="warning"
              showIcon
              message={t('语料后观察聚合暂不可用')}
              description={translateText(postCorpusObservationError)}
            />
          ) : null}
          <Spin spinning={loadingPostCorpusObservation}>
            <div className="lottery-decision-observation-state-grid">
              {MINI_GPT_OBSERVATION_BOUNDARY_STATES.map(state => {
                const metadata = MINI_GPT_OBSERVATION_BOUNDARY_METADATA[state];
                return (
                  <article key={state} data-observation-state={state}>
                    <strong>{postCorpusObservation.stateCounts[state]}</strong>
                    <span>{isEnglish ? metadata.label.en : metadata.label.zh}</span>
                    <Tag color={metadata.tone}>{state}</Tag>
                  </article>
                );
              })}
            </div>

            <div className="lottery-decision-observation-scope-note">
              <span>{t('有界快照：读取最近最多 {{limit}} 条（含归档）决策；其中 MiniGPT 决策 {{count}} 条。', {
                limit: MINI_GPT_POST_CORPUS_SNAPSHOT_LIMIT,
                count: postCorpusObservation.miniGptDecisionCount
              })}</span>
              {postCorpusObservation.excludedNonMiniGptCount > 0 ? (
                <span>{t('另有 {{count}} 条非 MiniGPT 决策未进入本面板五态统计。', {
                  count: postCorpusObservation.excludedNonMiniGptCount
                })}</span>
              ) : null}
            </div>

            {postCorpusObservation.miniGptDecisionCount === 0 && !loadingPostCorpusObservation ? (
              <Empty description={t('有界快照内暂无 MiniGPT 决策观察证据')} />
            ) : (
              <>
                <div className="lottery-decision-observation-metric-grid">
                  <article>
                    <strong>{postCorpusObservation.observedDecisionCount}</strong>
                    <span>{t('已观察决策分母')}</span>
                    <small>{t('独立期号 {{count}} · 范围 {{range}}', {
                      count: postCorpusObservation.distinctIssueCount,
                      range: postCorpusObservation.issueRange
                        ? `${postCorpusObservation.issueRange.firstIssue} → ${postCorpusObservation.issueRange.latestIssue}`
                        : '-'
                    })}</small>
                  </article>
                  <article>
                    <strong>{postCorpusObservation.scoredCandidateCount}</strong>
                    <span>{t('已评分候选分母')}</span>
                    <small>{t('候选命中 {{winning}} · 蓝球 {{blue}}/{{scored}}（{{rate}}）', {
                      winning: postCorpusObservation.winningCandidateCount,
                      blue: postCorpusObservation.blueHitCount,
                      scored: postCorpusObservation.scoredCandidateCount,
                      rate: postCorpusObservation.blueHitRatePercent === null
                        ? '-'
                        : formatPercent(postCorpusObservation.blueHitRatePercent)
                    })}</small>
                  </article>
                  <article>
                    <strong>{postCorpusObservation.financial.decisionCount}/{postCorpusObservation.observedDecisionCount}</strong>
                    <span>{t('完整核奖财务覆盖')}</span>
                    <small>
                      {t('成本 {{cost}} · 奖金 {{prize}} · 净值 {{net}} · ROI {{roi}}', {
                        cost: postCorpusObservation.financial.totalCost === null
                          ? '-'
                          : formatMoney(postCorpusObservation.financial.totalCost),
                        prize: postCorpusObservation.financial.totalPrize === null
                          ? '-'
                          : formatMoney(postCorpusObservation.financial.totalPrize),
                        net: postCorpusObservation.financial.netResult === null
                          ? '-'
                          : formatMoney(postCorpusObservation.financial.netResult),
                        roi: postCorpusObservation.financial.roiPercent === null
                          ? '-'
                          : formatPercent(postCorpusObservation.financial.roiPercent)
                      })}
                    </small>
                  </article>
                  <article>
                    <strong>{postCorpusObservation.comparableBaselineCount}/{postCorpusObservation.observedDecisionCount}</strong>
                    <span>{t('精确可比随机基线')}</span>
                    <small>{t('不可比 {{failed}} · 未知 {{unknown}}', {
                      failed: postCorpusObservation.failedBaselineCount,
                      unknown: postCorpusObservation.unknownBaselineCount
                    })}</small>
                  </article>
                </div>

                <div className="lottery-decision-observation-distributions">
                  <article>
                    <strong>{t('红球命中分布')}</strong>
                    <div>
                      {Object.entries(postCorpusObservation.hitDistribution).length ? (
                        Object.entries(postCorpusObservation.hitDistribution).map(([label, count]) => (
                          <Tag key={label}>{localizeHitDistributionLabel(label, translateText, t)} {count}</Tag>
                        ))
                      ) : <span>{t('暂无已观察分布')}</span>}
                    </div>
                  </article>
                  <article>
                    <strong>{t('奖级分布')}</strong>
                    <div>
                      {Object.entries(postCorpusObservation.prizeDistribution).length ? (
                        Object.entries(postCorpusObservation.prizeDistribution).map(([label, count]) => (
                          <Tag key={label}>{translateText(label)} {count}</Tag>
                        ))
                      ) : <span>{t('暂无已观察分布')}</span>}
                    </div>
                  </article>
                </div>

                <div className="lottery-decision-observation-warnings" role="note">
                  {postCorpusSnapshotTruncated ? (
                    <Alert
                      type="warning"
                      showIcon
                      message={t('当前只展示最近 {{loaded}}/{{total}} 条有界快照，更早记录未进入本次分母。', {
                        loaded: postCorpusObservation.boundedInputCount,
                        total: postCorpusSnapshotTotal
                      })}
                    />
                  ) : null}
                  {postCorpusObservation.observedDecisionCount > 0
                    && postCorpusObservation.distinctIssueCount < MINI_GPT_POST_CORPUS_SMALL_SAMPLE_ISSUES ? (
                      <Alert
                        type="warning"
                        showIcon
                        message={t('样本提醒：已观察独立期号少于 {{count}} 期，不能据此判断稳定表现。', {
                          count: MINI_GPT_POST_CORPUS_SMALL_SAMPLE_ISSUES
                        })}
                      />
                    ) : null}
                  {postCorpusObservation.observedDecisionCount > postCorpusObservation.distinctIssueCount ? (
                    <Alert
                      type="warning"
                      showIcon
                      message={t('同一期可能包含多个决策；决策分母与独立开奖期号已分开展示。')}
                    />
                  ) : null}
                  {postCorpusObservation.unstableObservedCount > 0 ? (
                    <Alert
                      type="warning"
                      showIcon
                      message={t('{{count}} 条已观察决策缺少稳定 corpus/run/hash 溯源，已隔离成单独分组且基线保持 UNKNOWN。', {
                        count: postCorpusObservation.unstableObservedCount
                      })}
                    />
                  ) : null}
                  {postCorpusObservation.financial.decisionCount < postCorpusObservation.observedDecisionCount ? (
                    <Alert
                      type="warning"
                      showIcon
                      message={t('财务指标只汇总已转票且全部核奖的决策，覆盖 {{covered}}/{{observed}}。', {
                        covered: postCorpusObservation.financial.decisionCount,
                        observed: postCorpusObservation.observedDecisionCount
                      })}
                    />
                  ) : null}
                  {postCorpusObservation.comparableBaselineCount < postCorpusObservation.observedDecisionCount ? (
                    <Alert
                      type="warning"
                      showIcon
                      message={t('随机基线只展示精确复核、同决策、同溯源、同窗口且同预算的报告，覆盖 {{covered}}/{{observed}}。', {
                        covered: postCorpusObservation.comparableBaselineCount,
                        observed: postCorpusObservation.observedDecisionCount
                      })}
                    />
                  ) : null}
                </div>

                <div className="lottery-decision-observation-groups">
                  {postCorpusObservation.groups.map((group, groupIndex) => (
                    <article key={group.key} className="lottery-decision-observation-group">
                      <header>
                        <div>
                          <strong>{t('语料链 {{index}}', { index: groupIndex + 1 })}</strong>
                          <span>corpusVersion={group.corpusVersion || 'UNKNOWN'} · runId={group.runId || 'UNKNOWN'}</span>
                        </div>
                        <Space wrap size={4}>
                          <Tag color={group.stableProvenance ? 'cyan' : 'default'}>
                            {t(group.stableProvenance ? '稳定溯源' : '隔离溯源')}
                          </Tag>
                          <Tag>{t('{{decisions}} 个决策 · {{issues}} 个期号', {
                            decisions: group.decisions.length,
                            issues: group.distinctIssueCount
                          })}</Tag>
                        </Space>
                      </header>
                      <div className="lottery-decision-observation-group-lineage">
                        <span>train={group.trainFirstIssue || 'UNKNOWN'} → {group.trainLatestIssue || 'UNKNOWN'}</span>
                        <span>validation={group.validationFirstIssue || 'UNKNOWN'} → {group.validationLatestIssue || 'UNKNOWN'}</span>
                        <span>trainSha256={group.trainSha256 || 'UNKNOWN'}</span>
                        <span>validationSha256={group.validationSha256 || 'UNKNOWN'}</span>
                        <span>checkpointSha256={group.checkpointSha256 || 'UNKNOWN'}</span>
                      </div>
                      <div className="lottery-decision-observation-decisions">
                        {group.decisions.map(decision => {
                          const baseline = decision.baseline;
                          return (
                            <div
                              key={decision.item.decisionSetId || `${decision.issue}-${decision.item.title}`}
                              className="lottery-decision-observation-decision"
                              data-exact-review-ownership={baseline.state === 'COMPARABLE'}
                            >
                              <div className="lottery-decision-observation-decision-heading">
                                <div>
                                  <strong>{decision.item.title
                                    ? localizeDecisionSetTitle(decision.item.title, translateText, t)
                                    : t('第 {{issue}} 期决策集', { issue: decision.issue })}</strong>
                                  <span>decisionSetId={decision.item.decisionSetId || 'UNKNOWN'} · batchId={decision.item.provenance?.batchId || '-'}</span>
                                </div>
                                <Space wrap size={4}>
                                  <Tag color="purple">POST_CORPUS_OBSERVED</Tag>
                                  <Tag color={baseline.state === 'COMPARABLE' ? 'cyan' : baseline.state === 'FAIL' ? 'red' : 'default'}>
                                    BASELINE_{baseline.state}
                                  </Tag>
                                </Space>
                              </div>
                              <div className="lottery-decision-observation-decision-metrics">
                                <span>{t('目标期')} {decision.issue}</span>
                                <span>{t('评分')} {decision.item.scoredCandidateCount || 0}</span>
                                <span>{t('蓝球命中')} {decision.item.blueHitCount || 0}</span>
                                <span>{t('财务证据')} {t(decision.financialEvidenceComplete ? '完整核奖' : '未完整核奖')}</span>
                              </div>
                              {baseline.state === 'COMPARABLE' ? (
                                <div className="lottery-decision-observation-baseline">
                                  <div>
                                    <span>{t('红球均值差')}</span>
                                    <strong>{deltaText(baseline.averageRedHitsDelta, t)}</strong>
                                  </div>
                                  <div>
                                    <span>{t('蓝球命中率差')}</span>
                                    <strong>{deltaText(baseline.blueHitRateDelta, t)}%</strong>
                                  </div>
                                  <div>
                                    <span>{t('奖金差')}</span>
                                    <strong>{deltaText(baseline.totalPrizeDelta, t)}</strong>
                                  </div>
                                  <div>
                                    <span>{t('净结果差')}</span>
                                    <strong>{deltaText(baseline.netResultDelta, t)}</strong>
                                  </div>
                                  <div>
                                    <span>{t('ROI 差')}</span>
                                    <strong>{deltaText(baseline.roiPercentDelta, t)}%</strong>
                                  </div>
                                </div>
                              ) : (
                                <p className="lottery-decision-observation-baseline-reason">
                                  {baseline.reasons.map(reason => baselineComparabilityReasonText(reason, t)).join(' · ')}
                                </p>
                              )}
                              <div className="lottery-decision-observation-backtest-lineage">
                                <span>reviewBacktestId={decision.item.reviewBacktestId || 'UNKNOWN'}</span>
                                <span>resolvedReportId={baseline.reportId || 'UNKNOWN'}</span>
                                <span>{baseline.evaluationMode || 'UNKNOWN'} · {baseline.baselineAlgorithm || 'UNKNOWN'} · seed={baseline.baselineSeed ?? 'UNKNOWN'}</span>
                                <span>{t('回测期数')} {baseline.windowIssueCount ?? 'UNKNOWN'} · {t('票数')} {baseline.ticketCount ?? 'UNKNOWN'}/{baseline.baselineTicketCount ?? 'UNKNOWN'}</span>
                              </div>
                              {baseline.warnings.length ? (
                                <small>{lotteryOverfitWarningsText(baseline.warnings, isEnglish)}</small>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </Spin>
        </Card>
      </section>

      <section className="lottery-decision-filter-bar">
        <Input
          allowClear
          prefix={<FilterOutlined />}
          placeholder={t('目标期号')}
          value={targetIssue}
          onChange={event => updateDecisionQuery({ targetIssue: event.target.value })}
        />
        <Input
          allowClear
          prefix={<SafetyCertificateOutlined />}
          placeholder={t('规则名称')}
          value={ruleName}
          onChange={event => updateDecisionQuery({ ruleName: event.target.value })}
        />
        <Select value={evidenceState} options={localizedOptions.evidence} onChange={value => updateDecisionQuery({ evidence: value })} />
        <Select value={resultState} options={localizedOptions.result} onChange={value => updateDecisionQuery({ resultState: value })} />
      </section>

      <section className="lottery-decision-outcome-filter-bar">
        <Select
          value={outcomeState}
          options={localizedOptions.outcome}
          onChange={value => updateQuery({ outcomeState: value })}
        />
        <Select
          value={conversionState}
          options={localizedOptions.conversion}
          onChange={value => updateQuery({ conversionState: value })}
        />
        <Select
          value={outcomeAlertState}
          options={localizedOptions.alerts}
          onChange={value => updateQuery({ outcomeAlert: value })}
        />
        <Button
          icon={<DownloadOutlined />}
          onClick={() => {
            const next = new URLSearchParams({ type: 'decision-outcomes' });
            if (activeDecisionOutcome?.targetIssue) {
              next.set('targetIssue', activeDecisionOutcome.targetIssue);
            }
            navigate(`/lottery/exports?${next.toString()}`);
          }}
        >
          {t('导出复盘')}
        </Button>
      </section>

      <section className="lottery-history-summary-grid">
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <ThunderboltOutlined />
            <div>
              <strong>{filteredRows.length}</strong>
              <span>{t('候选号码')}</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <SafetyCertificateOutlined />
            <div>
              <strong>{summary.stable}</strong>
              <span>{t('稳定证据')}</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <WarningOutlined />
            <div>
              <strong>{summary.warning}</strong>
              <span>{t('证据提醒')}</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <CheckCircleOutlined />
            <div>
              <strong>{summary.converted}</strong>
              <span>{t('已转票候选')}</span>
            </div>
          </div>
        </Card>
      </section>

      <section className="lottery-decision-outcome-summary-grid">
        <article>
          <strong>{outcomeSummary.count}</strong>
          <span>{t('复盘决策集')}</span>
          <Tag color={outcomeSummary.hit ? 'blue' : 'default'}>{t('命中')} {outcomeSummary.hit}</Tag>
        </article>
        <article>
          <strong>{formatMoney(outcomeSummary.net)}</strong>
          <span>{t('筛选范围净结果')}</span>
          <Tag color={outcomeSummary.roi > 0 ? 'green' : 'default'}>ROI {formatPercent(outcomeSummary.roi)}</Tag>
        </article>
        <article>
          <strong>{outcomeSummary.unchecked}</strong>
          <span>{t('仍需核奖')}</span>
          <Tag color={outcomeSummary.unchecked ? 'gold' : 'green'}>
            {t(outcomeSummary.unchecked ? '待处理' : '已处理')}
          </Tag>
        </article>
        <article>
          <strong>{outcomeSummary.warning}</strong>
          <span>{t('证据提醒')}</span>
          <Tag color={outcomeSummary.warning ? 'orange' : 'green'}>
            {t(outcomeSummary.warning ? '需复核' : '无提醒')}
          </Tag>
        </article>
      </section>

      {activeDecisionOutcome ? (
        <Card
          className="life-panel-card lottery-clean-panel lottery-report-print-area"
          title={<Space><SafetyCertificateOutlined />{t('保存决策复盘')}</Space>}
          extra={(
            <Tag color={activeDecisionOutcome.warningCount ? 'gold' : 'green'}>
              {activeDecisionOutcome.title
                ? localizeDecisionSetTitle(activeDecisionOutcome.title, translateText, t)
                : t('最近决策')}
            </Tag>
          )}
        >
          <div className="lottery-decision-brief-grid">
            <article>
              <strong>{activeDecisionOutcome.bestRedHits ?? '-'}/6</strong>
              <span>{t('最佳红球命中 · 蓝球命中 {{count}}', {
                count: activeDecisionOutcome.blueHitCount || 0
              })}</span>
              <Tag color={activeDecisionOutcome.winningCandidateCount ? 'blue' : 'default'}>
                {t('候选中奖')} {activeDecisionOutcome.winningCandidateCount || 0}
              </Tag>
            </article>
            <article>
              <strong>{activeDecisionOutcome.checkedConvertedTicketCount || 0}/{activeDecisionOutcome.convertedTicketCount || 0}</strong>
              <span>{t('已转票核奖 · 中奖票')} {activeDecisionOutcome.winningConvertedTicketCount || 0}</span>
              <Tag color="green">{t('净')} {formatMoney(activeDecisionOutcome.netResult)}</Tag>
            </article>
            <article>
              <strong>{formatPercent(activeDecisionOutcome.roiPercent)}</strong>
              <span>{t('决策 ROI · 规则差额')} {deltaText(activeDecisionOutcome.ruleDelta?.netResultDelta, t)}</span>
              <Tag color={activeDecisionOutcome.sourceDelta?.netResultDelta && activeDecisionOutcome.sourceDelta.netResultDelta > 0 ? 'blue' : 'default'}>
                {t('来源差额')} {deltaText(activeDecisionOutcome.sourceDelta?.netResultDelta, t)}
              </Tag>
            </article>
            <article>
              <strong>{deltaText(activeDecisionOutcome.backtestRoiPercentDelta, t)}%</strong>
              <span>{t('同窗口随机基线 ROI 差额')}</span>
              <Tag color={(activeDecisionOutcome.backtestWarnings || []).length ? 'orange' : 'green'}>
                {t('过拟合提醒')} {(activeDecisionOutcome.backtestWarnings || []).length}
              </Tag>
            </article>
          </div>
          <div className="lottery-research-report-grid">
            {(activeDecisionOutcome.candidates || []).slice(0, 6).map(candidate => (
              <article key={candidate.candidateKey || `${candidate.candidateTitle}-${candidate.blueNumber}`}>
                <Tag color={lotteryEvidenceColor(candidate.evidenceTag)}>{candidate.evidenceTag || 'MISSING'}</Tag>
                <strong>{candidate.candidateTitle
                  ? localizeCandidateTitle(candidate.candidateTitle, translateText, t)
                  : t('候选号码')}</strong>
                <span>
                  {t('红球')} {candidate.redHits ?? '-'}/6 · {t(candidate.blueHit ? '蓝中' : '蓝未中')} · {translateText(candidate.prizeName || '待开奖')}
                </span>
                <small>
                  {t('转票')} {candidate.checkedTicketCount || 0}/{candidate.convertedTicketCount || 0} · {t('净')} {formatMoney(candidate.netResult)}
                </small>
                {candidate.generationId ? <small className="lottery-decision-lineage-id">generationId={candidate.generationId}</small> : null}
              </article>
            ))}
            {(activeDecisionOutcome.backtestWarnings || []).slice(0, 4).map(warning => (
              <article key={`backtest-warning-${warning}`}>
                <Tag color="orange">{t('过拟合提醒')}</Tag>
                <strong>{lotteryOverfitWarningsText([warning], isEnglish)}</strong>
                <span>{t('仅作为历史窗口研究证据，不外推未来表现。')}</span>
                <small>backtestId={activeDecisionOutcome.reviewBacktestId || '-'}</small>
              </article>
            ))}
            {(activeDecisionOutcome.evidenceAlerts || []).slice(0, 4).map(alert => (
              <article key={`alert-${alert}`}>
                <Tag color="orange">{t('提醒')}</Tag>
                <strong>{translateText(alert)}</strong>
                <span>{t('保存决策集证据需要复核')}</span>
                <small>{t('过期/波动/样本不足会在这里聚合。')}</small>
              </article>
            ))}
          </div>
          <div className="lottery-decision-outcome-list">
            {filteredDecisionOutcomes.slice(0, 6).map(item => (
              <button
                type="button"
                key={item.decisionSetId || `${item.title}-${item.targetIssue}`}
                className={item.decisionSetId === activeDecisionOutcome.decisionSetId ? 'active' : undefined}
                onClick={() => {
                  if (item.decisionSetId) {
                    setActiveDecisionSetId(item.decisionSetId);
                  }
                  updateQuery({ targetIssue: item.targetIssue });
                }}
              >
                <strong>{item.title
                  ? localizeDecisionSetTitle(item.title, translateText, t)
                  : (item.targetIssue ? t('第 {{issue}} 期', { issue: item.targetIssue }) : t('保存决策'))}</strong>
                <span>{t('第 {{issue}} 期 · 命中 {{winningCount}}/{{candidateCount}}', {
                  issue: item.targetIssue || '-',
                  winningCount: item.winningCandidateCount || 0,
                  candidateCount: item.scoredCandidateCount || item.candidateCount || 0
                })}</span>
                <small>
                  {t('转票')} {item.checkedConvertedTicketCount || 0}/{item.convertedTicketCount || 0} · {t('净')} {formatMoney(item.netResult)} · {t('提醒')} {item.warningCount || 0}
                </small>
              </button>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="life-panel-card lottery-clean-panel">
          <Empty description={t(
            (decisionOutcomeSummary?.items || []).length ? '当前复盘筛选下暂无结果' : '暂无保存决策复盘结果'
          )} />
        </Card>
      )}

      <section className="lottery-decision-brief-grid">
        <article>
          <strong>{ruleComparison?.bestRuleName || '-'}</strong>
          <span>{t('当前最佳规则')} · {ruleComparison?.bestRankScore ?? '-'} {t('分')}</span>
          {ruleComparison?.bestEvidence ? (
            <Tag color={lotteryEvidenceColor(ruleComparison.bestEvidence.tag)}>
              {translateText(lotteryEvidenceLabel(ruleComparison.bestEvidence))}
            </Tag>
          ) : null}
        </article>
        <article>
          <strong>{localizeReplayText(lotteryReplayText(replayMetrics?.replaySummary), translateText)}</strong>
          <span>
            {t('回放窗口')} {replayMetrics?.actualWindow || replayMetrics?.requestedWindow || '-'} · {t('生成')} {formatTime(replayMetrics?.generatedAt, language)}
          </span>
          {replayMetrics?.evidence ? (
            <Tag color={lotteryEvidenceColor(replayMetrics.evidence.tag)}>{translateText(lotteryEvidenceLabel(replayMetrics.evidence))}</Tag>
          ) : null}
        </article>
        <article>
          <strong>{selectedRows.length}</strong>
          <span>{t('已选候选')} · {t('待开奖')} {summary.pending}</span>
          <Button size="small" icon={<FileAddOutlined />} loading={savingTickets} disabled={isMiniGptDecisionSet} onClick={saveSelectedTickets}>
            {t('保存选中')}
          </Button>
        </article>
      </section>

      {summary.warning > 0 ? (
        <Alert
          className="lottery-overview-status-alert"
          type="warning"
          showIcon
          message={t('存在样本不足、证据过期、规则波动或缺少回放摘要的候选，转票前建议先查看预测详情或重新训练。')}
        />
      ) : null}

      <Card className="life-panel-card lottery-clean-panel lottery-report-print-area">
        <Spin spinning={loading}>
          {filteredRows.length ? (
            <Table
              rowKey="key"
              rowSelection={{
                selectedRowKeys,
                onChange: keys => {
                  setSelectedRowKeys(keys);
                  markDecisionDirty();
                }
              }}
              columns={columns}
              dataSource={filteredRows}
              pagination={{ pageSize: 10, showSizeChanger: true, total: filteredRows.length }}
              scroll={{ x: 980 }}
            />
          ) : (
            <Empty description={t(
              pageResponse?.total ? '当前筛选下暂无候选' : '暂无预测候选，先运行一次预测训练。'
            )} />
          )}
        </Spin>
      </Card>

      <div className="lottery-decision-mobile-list">
        {filteredRows.map(row => (
          <article key={row.key}>
            <div>
              <strong>{localizeCandidateTitle(row.candidateTitle, translateText, t)}</strong>
              <Tag color={row.source === 'PRIMARY' ? 'blue' : row.source === 'MINIGPT' ? 'purple' : 'default'}>{sourceLabel(row.source, t)}</Tag>
            </div>
            <LotteryBalls redNumbers={row.redNumbers} blueNumber={row.blueNumber || ''} />
            <Space wrap>
              <Tag color={lotteryEvidenceColor(row.evidence?.tag)}>{translateText(lotteryEvidenceLabel(row.evidence))}</Tag>
              <Tag>{localizeResultLabel(row.resultLabel, translateText, t)}</Tag>
              <Tag color={row.ticketCount ? 'green' : 'default'}>{localizeTicketState(row.ticketState, translateText, t)}</Tag>
            </Space>
            {row.warning ? <span>{translateText(row.warning)}</span> : null}
            {row.generationId ? <small className="lottery-decision-lineage-id">generationId={row.generationId}</small> : null}
          </article>
        ))}
      </div>
    </LifePageShell>
  );
};

export default LotteryPredictionDecisionPage;
