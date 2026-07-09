import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Empty, Form, Input, InputNumber, Progress, Select, Space, Spin, Table, Tag, Typography, message } from 'antd';
import { BarChartOutlined, BookOutlined, BulbOutlined, CloseCircleOutlined, CopyOutlined, DatabaseOutlined, DownloadOutlined, PlayCircleOutlined, ReloadOutlined, SaveOutlined, TrophyOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import LifePageShell from './LifePageShell';
import {
  lotteryBacktestApi,
  lotteryDecisionSetApi,
  miniGptApi,
  type LotteryDecisionCandidateSelection,
  type LotteryBacktestReport,
  type LotteryDecisionSet,
  type MiniGptCorpusInsight,
  type MiniGptDashboard,
  type MiniGptEnvironmentCheck,
  type MiniGptGenerationRequest,
  type MiniGptGenerationResult,
  type MiniGptLotteryCorpusExport,
  type MiniGptRunRecord,
  type MiniGptTokenEntry,
  type MiniGptTrainingLogRecord,
  type MiniGptRunNoteRequest,
  type MiniGptTrainingRequest,
  type MiniGptTrainingStatus
} from '../services/api';
import './MiniGptLearningPage.css';

const { Text } = Typography;

const formatLoss = (value?: number) => Number.isFinite(value) ? value!.toFixed(4) : '-';

const formatInteger = (value?: number) => Number.isFinite(value) ? value!.toLocaleString('zh-CN') : '-';

const formatTime = (value?: string | number) => {
  if (!value) return '-';
  if (typeof value === 'number') {
    return new Date(value).toLocaleString('zh-CN', { hour12: false });
  }
  return value;
};

const statusColor = (status?: string) => {
  if (status === 'SUCCESS') return 'success';
  if (status === 'RUNNING') return 'processing';
  if (status === 'FAILED') return 'error';
  return 'default';
};

const lotteryCandidateStatusColor = (status?: string) => {
  if (status === 'PASS') return 'green';
  if (status === 'WARNING') return 'orange';
  if (status === 'FAILED') return 'red';
  return 'default';
};

const latestSample = (logs: MiniGptTrainingLogRecord[]) => (
  [...logs].reverse().find(log => log.sample)?.sample || ''
);

const mergeStatusLog = (
  runName: string | undefined,
  logs: MiniGptTrainingLogRecord[],
  latestLog?: MiniGptTrainingLogRecord
) => {
  const sameRunLogs = runName
    ? logs.filter(log => !log.runName || log.runName === runName)
    : logs;
  if (!latestLog || (runName && latestLog.runName && latestLog.runName !== runName)) {
    return sameRunLogs;
  }

  const byStep = new Map<number | string, MiniGptTrainingLogRecord>();
  sameRunLogs.forEach(log => {
    byStep.set(log.step ?? `${log.runName}-${log.createdAt}`, log);
  });
  byStep.set(latestLog.step ?? `${latestLog.runName}-${latestLog.createdAt}`, latestLog);
  return Array.from(byStep.values()).sort((left, right) => (left.step ?? 0) - (right.step ?? 0));
};

const buildChartOption = (logs: MiniGptTrainingLogRecord[]) => ({
  color: ['#0071e3', '#ff9500'],
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    top: 0,
    data: ['train_loss', 'eval_loss']
  },
  grid: {
    top: 40,
    right: 20,
    bottom: 36,
    left: 48
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: logs.map(log => log.step ?? 0)
  },
  yAxis: {
    type: 'value',
    scale: true
  },
  series: [
    {
      name: 'train_loss',
      type: 'line',
      smooth: true,
      symbolSize: 6,
      data: logs.map(log => log.trainLoss)
    },
    {
      name: 'eval_loss',
      type: 'line',
      smooth: true,
      symbolSize: 6,
      data: logs.map(log => log.evalLoss)
    }
  ]
});

const buildComparisonChartOption = (comparisonLogs: Record<string, MiniGptTrainingLogRecord[]>) => {
  const runNames = Object.keys(comparisonLogs);
  const steps = Array.from(new Set(runNames.flatMap(runName => (
    comparisonLogs[runName].map(log => log.step ?? 0)
  )))).sort((left, right) => left - right);
  return {
    color: ['#0071e3', '#ff9500', '#00c7be', '#af52de', '#34c759', '#ff3b30'],
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      top: 0,
      data: runNames.flatMap(runName => [`${runName} eval`, `${runName} train`])
    },
    grid: {
      top: 58,
      right: 20,
      bottom: 36,
      left: 48
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: steps
    },
    yAxis: {
      type: 'value',
      scale: true
    },
    series: runNames.flatMap(runName => {
      const byStep = new Map(comparisonLogs[runName].map(log => [log.step ?? 0, log]));
      return [
        {
          name: `${runName} eval`,
          type: 'line',
          smooth: true,
          symbolSize: 5,
          data: steps.map(step => byStep.get(step)?.evalLoss ?? null)
        },
        {
          name: `${runName} train`,
          type: 'line',
          smooth: true,
          symbolSize: 4,
          lineStyle: { type: 'dashed' },
          data: steps.map(step => byStep.get(step)?.trainLoss ?? null)
        }
      ];
    })
  };
};

const comparisonSummaryItems = (comparisonLogs: Record<string, MiniGptTrainingLogRecord[]>) => (
  Object.entries(comparisonLogs).map(([runName, logs]) => {
    const latestLog = logs[logs.length - 1];
    const trainLoss = latestLog?.trainLoss;
    const evalLoss = latestLog?.evalLoss;
    const gap = Number.isFinite(evalLoss) && Number.isFinite(trainLoss)
      ? Number(evalLoss) - Number(trainLoss)
      : undefined;
    const verdict = !latestLog
      ? '暂无日志'
      : Number.isFinite(gap) && Math.abs(Number(gap)) > 0.5
        ? 'gap 偏大'
        : Number.isFinite(evalLoss)
          ? '验证可比'
          : '仅训练 loss';

    return {
      runName,
      step: formatInteger(latestLog?.step),
      trainLoss: formatLoss(trainLoss),
      evalLoss: formatLoss(evalLoss),
      gap: formatLoss(gap),
      verdict
    };
  })
);

type MiniGptTrainingRecipe = {
  key: string;
  title: string;
  description: string;
  values: MiniGptTrainingRequest;
};

const trainingRecipes: MiniGptTrainingRecipe[] = [
  {
    key: 'tiny-baseline',
    title: 'Tiny 基线',
    description: '先跑最小模型，确认语料、loss 和生成链路。',
    values: {
      preset: 'tiny',
      maxSteps: 120,
      valRatio: 0.1,
      samplePrompt: '语言模型',
      sampleTokens: 80
    }
  },
  {
    key: 'low-lr',
    title: '低学习率',
    description: '观察 loss 是否更平滑，训练速度是否变慢。',
    values: {
      preset: 'tiny',
      maxSteps: 240,
      learningRate: 0.0001,
      valRatio: 0.1,
      samplePrompt: '语言模型',
      sampleTokens: 100
    }
  },
  {
    key: 'long-context',
    title: '长上下文',
    description: '增加 block size，看模型能否利用更远的上下文。',
    values: {
      preset: 'custom',
      maxSteps: 240,
      batchSize: 32,
      blockSize: 96,
      nEmbd: 96,
      nHead: 4,
      nLayer: 3,
      valRatio: 0.1,
      samplePrompt: '语言模型',
      sampleTokens: 120
    }
  },
  {
    key: 'small-model',
    title: 'Small 对照',
    description: '扩大模型容量，对比 tiny 的泛化差距和样例质量。',
    values: {
      preset: 'small',
      maxSteps: 300,
      valRatio: 0.1,
      samplePrompt: '语言模型',
      sampleTokens: 120
    }
  }
];

const hyperparameterGuideRows = [
  {
    key: 'learning-rate',
    label: 'Learning Rate',
    effect: '步子大小',
    watch: '过大容易震荡，过小下降慢',
    next: 'loss 抖动时先降低一档'
  },
  {
    key: 'batch-size',
    label: 'Batch Size',
    effect: '每步看到的样本数',
    watch: '更大更稳但更吃内存',
    next: 'loss 噪声大时适度增大'
  },
  {
    key: 'block-size',
    label: 'Block Size',
    effect: '上下文长度',
    watch: '更长可看更远但训练更慢',
    next: '生成断裂时尝试加长'
  },
  {
    key: 'n-embd',
    label: 'Embedding',
    effect: ' token 向量宽度',
    watch: '越大容量越强也越易过拟合',
    next: '样例太贫乏时再增大'
  },
  {
    key: 'n-head',
    label: 'Heads',
    effect: '注意力视角数',
    watch: '需能整除 embedding',
    next: '扩大模型时同步调整'
  },
  {
    key: 'n-layer',
    label: 'Layers',
    effect: 'Transformer 深度',
    watch: '更深表达更强但更难训',
    next: 'tiny 稳定后再增加'
  },
  {
    key: 'temperature',
    label: 'Temperature',
    effect: '生成随机性',
    watch: '高更发散，低更保守',
    next: '重复时升高，跑题时降低'
  },
  {
    key: 'top-k',
    label: 'Top-K',
    effect: '采样候选范围',
    watch: '小更稳定，大更多样',
    next: '先试 10、20、50 对照'
  }
];

const promptPresetRows = [
  {
    key: 'lottery-balanced',
    title: '平衡选号',
    prompt: 'target=next strategy=balanced',
    tokens: 120,
    temperature: 0.9,
    topK: 20,
    intent: '观察模型能否输出结构化候选'
  },
  {
    key: 'lottery-risk',
    title: '大胆探索',
    prompt: 'target=next strategy=explore risk=medium',
    tokens: 140,
    temperature: 1.1,
    topK: 40,
    intent: '测试高随机性下的候选多样性'
  },
  {
    key: 'explain-mini-gpt',
    title: '概念解释',
    prompt: '语言模型',
    tokens: 100,
    temperature: 0.8,
    topK: 20,
    intent: '看训练语料风格是否被学到'
  },
  {
    key: 'low-temperature',
    title: '保守续写',
    prompt: 'target=next strategy=balanced',
    tokens: 100,
    temperature: 0.7,
    topK: 12,
    intent: '降低重复和跑题风险'
  }
];

const metricItems = (run?: MiniGptRunRecord, logs: MiniGptTrainingLogRecord[] = []) => {
  const latestLog = logs[logs.length - 1];
  return [
    { label: 'Step', value: formatInteger(latestLog?.step ?? run?.maxSteps) },
    { label: 'Train Loss', value: formatLoss(run?.finalTrainLoss ?? latestLog?.trainLoss) },
    { label: 'Eval Loss', value: formatLoss(run?.finalEvalLoss ?? latestLog?.evalLoss) },
    { label: 'Gap', value: formatLoss(run?.lossGap) },
    { label: 'Train Tokens', value: formatInteger(run?.trainTokens) },
    { label: 'Eval Tokens', value: formatInteger(run?.evalTokens) }
  ];
};

const lossDiagnostics = (run?: MiniGptRunRecord, logs: MiniGptTrainingLogRecord[] = []) => {
  const firstLog = logs[0];
  const latestLog = logs[logs.length - 1];
  const firstLoss = firstLog?.evalLoss ?? firstLog?.trainLoss;
  const latestEval = run?.finalEvalLoss ?? latestLog?.evalLoss;
  const latestTrain = run?.finalTrainLoss ?? latestLog?.trainLoss;
  const gap = run?.lossGap ?? (
    Number.isFinite(latestEval) && Number.isFinite(latestTrain)
      ? Number(latestEval) - Number(latestTrain)
      : undefined
  );
  const improved = Number.isFinite(firstLoss) && Number.isFinite(latestEval)
    ? Number(firstLoss) - Number(latestEval)
    : undefined;

  return [
    {
      key: 'trend',
      title: '下降趋势',
      status: Number.isFinite(improved) && Number(improved) > 0 ? 'PASS' : 'WATCH',
      value: Number.isFinite(improved) ? formatLoss(improved) : '-',
      detail: Number.isFinite(improved) && Number(improved) > 0
        ? 'eval loss 比开头更低'
        : '日志不足或下降不明显'
    },
    {
      key: 'gap',
      title: '泛化差距',
      status: Number.isFinite(gap) && Math.abs(Number(gap)) <= 0.5 ? 'PASS' : 'WATCH',
      value: formatLoss(gap),
      detail: Number.isFinite(gap) && Math.abs(Number(gap)) <= 0.5
        ? 'train/eval 暂时接近'
        : '注意过拟合或验证集分布差异'
    },
    {
      key: 'validation',
      title: '验证集',
      status: run?.validationEnabled ? 'PASS' : 'WATCH',
      value: run?.validationEnabled ? 'on' : 'off',
      detail: run?.validationEnabled ? '可以观察泛化' : '语料太短时可能关闭'
    }
  ];
};

const corpusDiagnostics = (corpusInsight?: MiniGptCorpusInsight) => {
  const charCount = corpusInsight?.charCount || 0;
  const lineCount = corpusInsight?.lineCount || 0;
  const vocabSize = corpusInsight?.vocabSize || 0;
  const encodedLength = corpusInsight?.encodedSample?.length || 0;
  const charsPerLine = lineCount > 0 ? charCount / lineCount : 0;
  const vocabDensity = charCount > 0 ? vocabSize / charCount : 0;

  return [
    {
      key: 'scale',
      title: '语料规模',
      status: charCount >= 1000 ? 'pass' : charCount >= 200 ? 'watch' : 'todo',
      value: formatInteger(charCount),
      detail: charCount >= 1000 ? '足够做小基线' : '先补到 1000 字以上再观察 loss'
    },
    {
      key: 'line-density',
      title: '行密度',
      status: charsPerLine >= 12 ? 'pass' : lineCount > 0 ? 'watch' : 'todo',
      value: lineCount > 0 ? charsPerLine.toFixed(1) : '-',
      detail: charsPerLine >= 12 ? '句子上下文较完整' : '行太短会削弱上下文学习'
    },
    {
      key: 'vocab-density',
      title: '词表密度',
      status: vocabDensity > 0 && vocabDensity <= 0.35 ? 'pass' : vocabDensity > 0 ? 'watch' : 'todo',
      value: vocabDensity > 0 ? `${(vocabDensity * 100).toFixed(1)}%` : '-',
      detail: vocabDensity > 0 && vocabDensity <= 0.35 ? '字符复用较好' : '生僻字符多时需要更多数据'
    },
    {
      key: 'sample-encode',
      title: '样例编码',
      status: encodedLength >= 8 ? 'pass' : encodedLength > 1 ? 'watch' : 'todo',
      value: encodedLength ? `${encodedLength} tokens` : '-',
      detail: encodedLength >= 8 ? '可以检查 x/y 平移' : '样例太短，batch 解释不明显'
    }
  ];
};

const repeatedCharRatio = (text: string) => {
  const chars = Array.from(text.replace(/\s+/g, ''));
  if (chars.length < 2) return 0;
  let repeated = 0;
  for (let index = 1; index < chars.length; index += 1) {
    if (chars[index] === chars[index - 1]) repeated += 1;
  }
  return repeated / (chars.length - 1);
};

const generationDiagnostics = (
  run: MiniGptRunRecord | undefined,
  logs: MiniGptTrainingLogRecord[],
  generationResult?: MiniGptGenerationResult
) => {
  const generatedText = generationResult?.generatedText || latestSample(logs);
  const prompt = generationResult?.prompt || run?.samplePrompt || '';
  const outputLength = Array.from(generatedText || '').length;
  const repeatRatio = repeatedCharRatio(generatedText || '');
  const continuedPrompt = Boolean(prompt && generatedText?.startsWith(prompt));
  const elapsedMillis = generationResult?.elapsedMillis;

  return [
    {
      key: 'length',
      title: '输出长度',
      status: outputLength >= 60 ? 'pass' : outputLength > 0 ? 'watch' : 'todo',
      value: outputLength ? `${outputLength} chars` : '-',
      detail: outputLength >= 60 ? '样例足够复盘风格' : '太短时先增加 tokens 或检查 checkpoint'
    },
    {
      key: 'repeat',
      title: '重复程度',
      status: outputLength === 0 ? 'todo' : repeatRatio <= 0.08 ? 'pass' : repeatRatio <= 0.18 ? 'watch' : 'todo',
      value: outputLength ? `${(repeatRatio * 100).toFixed(1)}%` : '-',
      detail: repeatRatio <= 0.08 ? '连续重复较少' : '重复高时调低温度或增加语料'
    },
    {
      key: 'prompt',
      title: 'Prompt 延续',
      status: outputLength === 0 ? 'todo' : continuedPrompt ? 'pass' : 'watch',
      value: prompt ? (continuedPrompt ? 'matched' : 'check') : '-',
      detail: prompt ? '确认生成是否接住提示词' : '训练时建议固定采样提示'
    },
    {
      key: 'latency',
      title: '采样耗时',
      status: elapsedMillis === undefined ? 'watch' : elapsedMillis <= 3000 ? 'pass' : 'watch',
      value: elapsedMillis === undefined ? '-' : `${elapsedMillis}ms`,
      detail: elapsedMillis === undefined ? '历史日志样例无耗时' : '同一 checkpoint 可对比采样参数'
    }
  ];
};

type NextExperimentAction = {
  key: string;
  title: string;
  reason: string;
  action: string;
  formValues?: Partial<MiniGptTrainingRequest>;
};

type PlannedExperiment = NextExperimentAction & {
  id: string;
  sourceRun?: string;
};

type ExperimentVariableDiff = {
  key: string;
  label: string;
  from: string;
  to: string;
};

type LaunchChecklistItem = {
  key: string;
  label: string;
  status: 'PASS' | 'WATCH' | 'TODO';
  detail: string;
};

type ReviewQualityItem = {
  key: keyof MiniGptRunNoteRequest;
  label: string;
  status: 'PASS' | 'WATCH' | 'TODO';
  detail: string;
};

type GenerationRankItem = {
  key: string;
  index: number;
  result: MiniGptGenerationResult;
  score: number;
  status: string;
  summary: string;
  diversity: number;
  structure: number;
  validity: number;
  speed: number;
  repeatPenalty: number;
  candidateText: string;
};

type GenerationTokenTraceItem = {
  key: string;
  index: number;
  char: string;
  display: string;
  role: 'prompt' | 'generated';
  codePoint: number;
  isRepeated: boolean;
  localRepeatCount: number;
};

const MINI_GPT_PLAN_STORAGE_KEY = 'one-web:minigpt:planned-experiments';

const isPlannedExperiment = (value: unknown): value is PlannedExperiment => {
  const item = value as PlannedExperiment;
  return Boolean(
    item
    && typeof item.id === 'string'
    && typeof item.key === 'string'
    && typeof item.title === 'string'
    && typeof item.reason === 'string'
    && typeof item.action === 'string'
  );
};

const loadPlannedExperiments = (): PlannedExperiment[] => {
  try {
    const rawValue = window.localStorage.getItem(MINI_GPT_PLAN_STORAGE_KEY);
    if (!rawValue) return [];
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue.filter(isPlannedExperiment).slice(0, 8) : [];
  } catch (error) {
    console.warn('读取 MiniGPT 实验计划失败:', error);
    return [];
  }
};

const savePlannedExperiments = (items: PlannedExperiment[]) => {
  try {
    window.localStorage.setItem(MINI_GPT_PLAN_STORAGE_KEY, JSON.stringify(items.slice(0, 8)));
  } catch (error) {
    console.warn('保存 MiniGPT 实验计划失败:', error);
  }
};

const formatPlannedValues = (values?: Partial<MiniGptTrainingRequest>) => {
  if (!values) return '';
  return Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}=${value}`)
    .join(' / ');
};

const displayVariableValue = (value: unknown) => (
  value === undefined || value === null || value === '' ? '-' : String(value)
);

const candidateKeyFromBalls = (redNumbers: string[] = [], blueNumber?: string) => (
  `${redNumbers.join('-')}+${blueNumber || '--'}`
);

const generationToDecisionCandidate = (
  result: MiniGptGenerationResult,
  index: number
): LotteryDecisionCandidateSelection | undefined => {
  const candidate = result.lotteryCandidate;
  if (!candidate?.parseable) return undefined;
  const rawRedNumbers = candidate.valid ? candidate.redNumbers : candidate.repairedRedNumbers;
  const rawBlueNumber = candidate.valid ? candidate.blueNumber : candidate.repairedBlueNumber;
  const redNumbers = (rawRedNumbers || []).filter(Boolean).slice(0, 6);
  if (redNumbers.length !== 6 || !rawBlueNumber) return undefined;
  const warning = candidate.valid ? undefined : (candidate.issues || []).join('；') || '由 MiniGPT 输出修复得到';
  return {
    key: `minigpt-${candidateKeyFromBalls(redNumbers, rawBlueNumber)}`,
    candidateTitle: `MiniGPT 候选 ${index + 1}`,
    source: 'MINIGPT',
    ruleName: `MiniGPT temp=${result.temperature ?? '-'} topK=${result.topK ?? '-'}`,
    redNumbers,
    blueNumber: rawBlueNumber,
    score: candidate.valid ? 80 : 55,
    replayText: result.generatedText,
    driftLabel: result.temperature !== undefined ? `temp=${result.temperature}` : undefined,
    resultState: 'PENDING',
    ticketCount: 0,
    ticketState: '未转票',
    warning
  };
};

const uniqueDecisionCandidates = (results: MiniGptGenerationResult[]) => {
  const byKey = new Map<string, LotteryDecisionCandidateSelection>();
  results.forEach((result, index) => {
    const candidate = generationToDecisionCandidate(result, index);
    if (!candidate) return;
    const key = candidateKeyFromBalls(candidate.redNumbers, candidate.blueNumber);
    if (!byKey.has(key)) {
      byKey.set(key, candidate);
    }
  });
  return Array.from(byKey.values());
};

const resultCandidateText = (result: MiniGptGenerationResult) => {
  const candidate = result.lotteryCandidate;
  if (!candidate?.parseable) return '未解析';
  const redNumbers = candidate.valid ? candidate.redNumbers : candidate.repairedRedNumbers;
  const blueNumber = candidate.valid ? candidate.blueNumber : candidate.repairedBlueNumber;
  return `${(redNumbers || []).join(' ')} + ${blueNumber || '--'}`;
};

const scoreGenerationResult = (result: MiniGptGenerationResult) => {
  const text = result.generatedText || '';
  const chars = Array.from(text.replace(/\s+/g, ''));
  const uniqueRatio = chars.length ? new Set(chars).size / chars.length : 0;
  const repeatRatio = repeatedCharRatio(text);
  const candidate = result.lotteryCandidate;
  const diversity = Math.min(25, Math.round(uniqueRatio * 45));
  const structure = candidate?.parseable ? 25 : text.length >= 40 ? 12 : 4;
  const validity = candidate?.valid ? 30 : candidate?.parseable ? 18 : 0;
  const speed = result.elapsedMillis === undefined ? 10 : Math.max(0, Math.min(10, Math.round(10 - result.elapsedMillis / 700)));
  const repeatPenalty = Math.round(Math.min(20, repeatRatio * 90));
  return Math.max(0, Math.min(100, diversity + structure + validity + speed - repeatPenalty));
};

const generationRankItems = (results: MiniGptGenerationResult[]): GenerationRankItem[] => (
  results
    .filter(item => item.generatedText || item.lotteryCandidate)
    .map((result, index) => {
      const text = result.generatedText || '';
      const chars = Array.from(text.replace(/\s+/g, ''));
      const diversity = chars.length ? Math.round((new Set(chars).size / chars.length) * 100) : 0;
      const repeat = repeatedCharRatio(text);
      const candidate = result.lotteryCandidate;
      const status = candidate?.valid ? 'VALID' : candidate?.parseable ? 'REPAIR' : text ? 'TEXT' : 'EMPTY';
      const summary = candidate?.valid
        ? '号码结构合规，可进入候选池'
        : candidate?.parseable
          ? '能解析号码，但需要按规则修复'
          : repeat > 0.16
            ? '文本重复偏高，适合降低温度'
            : '更适合做文本风格观察';
      return {
        key: `${result.temperature ?? 't'}-${result.topK ?? 'k'}-${index}`,
        index,
        result,
        score: scoreGenerationResult(result),
        status,
        summary,
        diversity,
        structure: candidate?.parseable ? 100 : text.length >= 40 ? 55 : 20,
        validity: candidate?.valid ? 100 : candidate?.parseable ? 60 : 15,
        speed: result.elapsedMillis === undefined ? 60 : Math.max(0, Math.min(100, Math.round(100 - result.elapsedMillis / 35))),
        repeatPenalty: Math.round(repeat * 100),
        candidateText: resultCandidateText(result)
      };
    })
    .sort((left, right) => right.score - left.score)
);

const buildGenerationRadarOption = (item?: GenerationRankItem) => ({
  color: ['#00c7be'],
  tooltip: {},
  radar: {
    radius: '68%',
    indicator: [
      { name: '结构', max: 100 },
      { name: '合规', max: 100 },
      { name: '多样', max: 100 },
      { name: '速度', max: 100 },
      { name: '低重复', max: 100 }
    ],
    axisName: {
      color: 'inherit'
    }
  },
  series: [
    {
      type: 'radar',
      areaStyle: {
        opacity: 0.18
      },
      data: [
        {
          name: item?.candidateText || 'generation',
          value: item ? [
            item.structure,
            item.validity,
            item.diversity,
            item.speed,
            Math.max(0, 100 - item.repeatPenalty)
          ] : [0, 0, 0, 0, 0]
        }
      ]
    }
  ]
});

const displayGeneratedChar = (char: string) => {
  if (char === '\n') return '↵';
  if (char === '\t') return '⇥';
  if (char === ' ') return '·';
  return char;
};

const buildGenerationTokenTrace = (result?: MiniGptGenerationResult): GenerationTokenTraceItem[] => {
  const text = result?.generatedText || '';
  const promptChars = Array.from(result?.prompt || '');
  const promptLength = promptChars.length;
  const chars = Array.from(text).slice(0, 180);
  const seenCounts = new Map<string, number>();
  return chars.map((char, index) => {
    const previousCount = seenCounts.get(char) || 0;
    seenCounts.set(char, previousCount + 1);
    return {
      key: `${index}-${char.codePointAt(0) || 0}`,
      index,
      char,
      display: displayGeneratedChar(char),
      role: index < promptLength ? 'prompt' : 'generated',
      codePoint: char.codePointAt(0) || 0,
      isRepeated: index > 0 && chars[index - 1] === char,
      localRepeatCount: previousCount + 1
    };
  });
};

const slugifyRunPart = (value: unknown) => (
  displayVariableValue(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28) || 'value'
);

const configNumber = (run: MiniGptRunRecord | undefined, key: string) => {
  const value = run?.config?.[key];
  return Number.isFinite(Number(value)) ? Number(value) : undefined;
};

const currentTrainingValue = (
  run: MiniGptRunRecord | undefined,
  key: keyof MiniGptTrainingRequest
): MiniGptTrainingRequest[keyof MiniGptTrainingRequest] | undefined => {
  if (!run) return undefined;
  const config = run.config || {};
  const values: Partial<MiniGptTrainingRequest> = {
    preset: run.preset,
    resumeFromRun: run.parentRunName,
    data: run.data,
    maxSteps: run.maxSteps,
    batchSize: run.batchSize,
    learningRate: run.learningRate,
    blockSize: configNumber(run, 'block_size'),
    nEmbd: configNumber(run, 'n_embd'),
    nHead: configNumber(run, 'n_head'),
    nLayer: configNumber(run, 'n_layer'),
    valRatio: run.valRatio,
    samplePrompt: run.samplePrompt,
    sampleTokens: run.sampleTokens,
    temperature: Number.isFinite(Number(config.temperature)) ? Number(config.temperature) : undefined,
    topK: Number.isFinite(Number(config.top_k)) ? Number(config.top_k) : undefined
  };
  return values[key];
};

const experimentVariableDiffs = (
  run: MiniGptRunRecord | undefined,
  values: MiniGptTrainingRequest = {}
): ExperimentVariableDiff[] => {
  const rows: Array<[keyof MiniGptTrainingRequest, string, unknown]> = [
    ['preset', '预设', run?.preset],
    ['resumeFromRun', '续训来源', run?.parentRunName],
    ['data', '语料', run?.data],
    ['maxSteps', '步数', run?.maxSteps],
    ['batchSize', 'Batch Size', run?.batchSize],
    ['learningRate', 'Learning Rate', run?.learningRate],
    ['blockSize', 'Block Size', configNumber(run, 'block_size')],
    ['nEmbd', 'Embedding', configNumber(run, 'n_embd')],
    ['nHead', 'Heads', configNumber(run, 'n_head')],
    ['nLayer', 'Layers', configNumber(run, 'n_layer')],
    ['valRatio', '验证比例', run?.valRatio],
    ['samplePrompt', '采样提示', run?.samplePrompt],
    ['sampleTokens', '采样长度', run?.sampleTokens],
    ['temperature', 'Temperature', undefined],
    ['topK', 'Top-K', undefined]
  ];

  return rows
    .filter(([key]) => values[key] !== undefined && values[key] !== '')
    .map(([key, label, currentValue]) => ({
      key: String(key),
      label,
      from: displayVariableValue(currentValue),
      to: displayVariableValue(values[key])
    }))
    .filter(item => item.from !== item.to);
};

const variableGuard = (run: MiniGptRunRecord | undefined, diffs: ExperimentVariableDiff[]) => {
  if (!run) {
    return {
      status: 'baseline',
      tagColor: 'blue',
      title: '基线实验',
      detail: '这是第一轮实验，先确认训练链路和样例输出。'
    };
  }
  if (diffs.length === 0) {
    return {
      status: 'idle',
      tagColor: 'default',
      title: '未选择变量',
      detail: '当前表单与最新实验一致，建议先应用一个计划项或手动改一个变量。'
    };
  }
  if (diffs.length === 1) {
    return {
      status: 'ready',
      tagColor: 'green',
      title: '单变量就绪',
      detail: `本轮只改变 ${diffs[0].label}，适合做对照实验。`
    };
  }
  return {
    status: 'multi',
    tagColor: 'orange',
    title: '多变量变更',
    detail: `当前同时改变 ${diffs.length} 个变量，结论可能难以归因。`
  };
};

const launchChecklist = (
  run: MiniGptRunRecord | undefined,
  corpusItems: ReturnType<typeof corpusDiagnostics>,
  variableState: ReturnType<typeof variableGuard>,
  hasRunNameConflict: boolean,
  plannedExperiments: PlannedExperiment[]
): LaunchChecklistItem[] => {
  const corpusReady = corpusItems.find(item => item.key === 'scale')?.status === 'pass';
  return [
    {
      key: 'corpus',
      label: '语料',
      status: corpusReady ? 'PASS' : 'WATCH',
      detail: corpusReady ? '语料规模足够做小基线' : '语料较短，建议先补文本或降低预期'
    },
    {
      key: 'variable',
      label: '变量',
      status: variableState.status === 'ready' || variableState.status === 'baseline' ? 'PASS' : variableState.status === 'multi' ? 'WATCH' : 'TODO',
      detail: variableState.detail
    },
    {
      key: 'run-name',
      label: '实验名',
      status: hasRunNameConflict ? 'WATCH' : 'PASS',
      detail: hasRunNameConflict ? '实验名已存在，先使用替代名' : '实验名不会和已加载历史 run 冲突'
    },
    {
      key: 'plan',
      label: '计划',
      status: plannedExperiments.length ? 'PASS' : 'WATCH',
      detail: plannedExperiments.length ? `已有 ${plannedExperiments.length} 个待做实验` : '可从下一步建议加入计划'
    },
    {
      key: 'review',
      label: '复盘',
      status: run?.hypothesis || run?.conclusion ? 'PASS' : run ? 'WATCH' : 'TODO',
      detail: run ? '建议保留上一轮假设/结论，再启动下一轮' : '首轮实验完成后补复盘'
    }
  ];
};

const buildSuggestedRunName = (run: MiniGptRunRecord | undefined, diffs: ExperimentVariableDiff[]) => {
  const diff = diffs[0];
  const baseName = slugifyRunPart(run?.runName || 'minigpt');
  if (!diff) return `${baseName}-next`;
  return `${baseName}-${slugifyRunPart(diff.key)}-${slugifyRunPart(diff.to)}`.slice(0, 80);
};

const uniqueRunName = (baseName: string, runs: MiniGptRunRecord[]) => {
  const existingNames = new Set(runs.map(item => item.runName).filter(Boolean));
  if (!existingNames.has(baseName)) return baseName;
  for (let suffix = 2; suffix < 100; suffix += 1) {
    const candidate = `${baseName}-${suffix}`;
    if (!existingNames.has(candidate)) return candidate;
  }
  return `${baseName}-${Date.now()}`;
};

const nextExperimentActions = (
  run: MiniGptRunRecord | undefined,
  logs: MiniGptTrainingLogRecord[],
  corpusInsight: MiniGptCorpusInsight | undefined,
  generationResult?: MiniGptGenerationResult
): NextExperimentAction[] => {
  if (!run) {
    return [
      {
        key: 'start-baseline',
        title: '先跑 Tiny 基线',
        reason: '还没有 Mongo run，先确认训练、日志、checkpoint、生成链路都能闭环。',
        action: '使用 Tiny 基线模板，训练 200 step。',
        formValues: {
          preset: 'tiny',
          maxSteps: 200,
          valRatio: 0.1,
          samplePrompt: '语言模型',
          sampleTokens: 80
        }
      }
    ];
  }

  const charCount = corpusInsight?.charCount || 0;
  const latestLog = logs[logs.length - 1];
  const trainLoss = run.finalTrainLoss ?? latestLog?.trainLoss;
  const evalLoss = run.finalEvalLoss ?? latestLog?.evalLoss;
  const sampleText = generationResult?.generatedText || latestSample(logs);
  const repeatRatio = repeatedCharRatio(sampleText || '');
  const actions: NextExperimentAction[] = [];

  if (charCount > 0 && charCount < 1000) {
    actions.push({
      key: 'expand-corpus',
      title: '先扩充语料',
      reason: `当前只有 ${formatInteger(charCount)} 字，loss 和生成质量容易被小样本噪声主导。`,
      action: '把 data/sample.txt 替换为更长、更统一风格的文本，再重复 Tiny 基线。'
    });
  }

  if (run.validationEnabled === false) {
    actions.push({
      key: 'enable-validation',
      title: '恢复验证集',
      reason: '没有验证集时只能看到训练文本上的拟合，难以判断泛化。',
      action: '增加语料或调低 valRatio 后重训，直到 eval loss 可稳定记录。',
      formValues: {
        valRatio: 0.1
      }
    });
  }

  if (Number.isFinite(run.lossGap) && Math.abs(run.lossGap || 0) > 0.5) {
    actions.push({
      key: 'gap-control',
      title: '控制泛化差距',
      reason: `当前 loss gap=${formatLoss(run.lossGap)}，训练和验证表现已经分开。`,
      action: '优先增加数据；若数据暂时不变，就降低 max steps 或模型尺寸做对照。',
      formValues: {
        maxSteps: Math.max(80, Math.floor((run.maxSteps || 200) * 0.7))
      }
    });
  }

  if (logs.length >= 2 && Number.isFinite(trainLoss) && Number.isFinite(evalLoss) && Number(evalLoss) > Number(trainLoss) + 0.2) {
    actions.push({
      key: 'regularize',
      title: '做保守训练对照',
      reason: 'eval loss 明显高于 train loss，模型可能更会背训练文本。',
      action: '复制当前实验，只把 learning rate 降低一档或减少训练步数。',
      formValues: {
        learningRate: Number(((run.learningRate || 0.0003) * 0.5).toPrecision(3)),
        maxSteps: Math.max(80, Math.floor((run.maxSteps || 200) * 0.8))
      }
    });
  }

  if (!sampleText) {
    actions.push({
      key: 'generate-sample',
      title: '补一次生成样例',
      reason: '没有生成文本时，loss 只能说明优化过程，不能说明输出行为。',
      action: '使用固定 Prompt 生成一次，并把结果写入观察笔记。'
    });
  } else if (repeatRatio > 0.12) {
    actions.push({
      key: 'reduce-repeat',
      title: '降低重复输出',
      reason: `连续重复比例约 ${(repeatRatio * 100).toFixed(1)}%，生成可能在局部循环。`,
      action: '先用更低 temperature/top-k 对比；若仍重复，再补语料或减少训练步数。',
      formValues: {
        temperature: 0.7,
        topK: 20
      }
    });
  }

  if (!run.hypothesis || !run.conclusion) {
    actions.push({
      key: 'write-notes',
      title: '补齐实验笔记',
      reason: '假设和结论缺失时，下一个实验很容易同时改多个变量。',
      action: '写一句假设、一句观察、一句结论，再只选择一个变量继续。'
    });
  }

  actions.push({
    key: 'one-variable',
    title: '下一轮只改一个变量',
    reason: '单变量对照最容易看清 learning rate、block size、模型容量或采样参数的影响。',
    action: '从低学习率、长上下文、Small 对照里选一个，和当前 run 做曲线对比。',
    formValues: {
      learningRate: 0.0001
    }
  });

  return actions.slice(0, 5);
};

const configEntries = (run?: MiniGptRunRecord): [string, string][] => {
  const config = run?.config || {};
  return [
    ['preset', run?.preset],
    ['device', run?.device],
    ['data', run?.data],
    ['checkpoint', run?.checkpoint],
    ['started_at', run?.startedAt],
    ['finished_at', run?.finishedAt],
    ['max_steps', run?.maxSteps],
    ['batch_size', run?.batchSize],
    ['learning_rate', run?.learningRate],
    ['val_ratio', run?.valRatio],
    ['validation_enabled', run?.validationEnabled === undefined ? undefined : String(run.validationEnabled)],
    ['sample_prompt', run?.samplePrompt],
    ['sample_tokens', run?.sampleTokens],
    ['parent_run_name', run?.parentRunName],
    ['parent_checkpoint', run?.parentCheckpoint],
    ['resume_step', run?.resumeStep],
    ['train_step', run?.trainStep],
    ['block_size', config.block_size],
    ['n_layer', config.n_layer],
    ['n_head', config.n_head],
    ['n_embd', config.n_embd],
    ['dropout', config.dropout],
    ['vocab_size', config.vocab_size]
  ].filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => [String(key), String(value)]);
};

const fencedText = (value?: string) => (value || '-').replaceAll('```', "'''");

const buildExperimentReport = (
  run: MiniGptRunRecord,
  logs: MiniGptTrainingLogRecord[],
  generationResult?: MiniGptGenerationResult,
  corpusInsight?: MiniGptCorpusInsight,
  plannedExperiments: PlannedExperiment[] = [],
  variableDiffs: ExperimentVariableDiff[] = [],
  checklistItems: LaunchChecklistItem[] = [],
  noteValues: MiniGptRunNoteRequest = {},
  reviewQuality: ReviewQualityItem[] = []
) => {
  const metrics = metricItems(run, logs);
  const diagnostics = lossDiagnostics(run, logs);
  const corpusRows = corpusDiagnostics(corpusInsight);
  const generationRows = generationDiagnostics(run, logs, generationResult);
  const actionRows = nextExperimentActions(run, logs, corpusInsight, generationResult);
  const sample = generationResult?.generatedText || latestSample(logs);
  const shapeRows = tensorShapeRows(run, undefined, []);
  const questions = reviewQuestions(run, logs, generationResult);
  return [
    `# MiniGPT 实验报告：${run.runName || '未命名实验'}`,
    '',
    '## 摘要',
    `- 状态：${run.status || 'UNKNOWN'}`,
    `- 预设：${run.preset || '-'}`,
    `- 开始：${formatTime(run.startedAt)}`,
    `- 结束：${formatTime(run.finishedAt)}`,
    '',
    '## 指标',
    ...metrics.map(item => `- ${item.label}: ${item.value}`),
    '',
    '## Loss 诊断',
    ...diagnostics.map(item => `- ${item.title}: ${item.value} / ${item.detail}`),
    '',
    '## 语料诊断',
    ...corpusRows.map(item => `- ${item.title}: ${item.value} / ${item.detail}`),
    '',
    '## 生成诊断',
    ...generationRows.map(item => `- ${item.title}: ${item.value} / ${item.detail}`),
    '',
    '## 下一步建议',
    ...actionRows.map(item => `- ${item.title}: ${item.action}（${item.reason}）`),
    '',
    '## 实验计划',
    ...(plannedExperiments.length
      ? plannedExperiments.map(item => `- ${item.title}: ${item.action}（来源：${item.sourceRun || '未绑定实验'}）`)
      : ['- 暂无计划']),
    '',
    '## 下一轮变量差异',
    ...(variableDiffs.length
      ? variableDiffs.map(item => `- ${item.label}: ${item.from} -> ${item.to}`)
      : ['- 暂无差异']),
    '',
    '## 训练启动检查',
    ...(checklistItems.length
      ? checklistItems.map(item => `- ${item.label}: ${item.status} / ${item.detail}`)
      : ['- 暂无检查']),
    '',
    '## 配置',
    ...configEntries(run).map(([key, value]) => `- ${key}: ${value}`),
    '',
    '## Tensor Shapes',
    ...shapeRows.map(row => `- ${row.label}: ${row.shape} (${row.note})`),
    '',
    '## 代码定位',
    ...codeReferenceRows.map(row => `- ${row.concept} / ${row.symbol}: ${row.action}`),
    '',
    '## 参数速查',
    ...hyperparameterGuideRows.map(row => `- ${row.label}: ${row.effect}；观察 ${row.watch}；下一步 ${row.next}`),
    '',
    '## 实验笔记',
    `- 假设：${noteValues.hypothesis || run.hypothesis || '-'}`,
    `- 观察：${noteValues.observation || run.observation || '-'}`,
    `- 结论：${noteValues.conclusion || run.conclusion || '-'}`,
    `- 下一步：${noteValues.nextStep || run.nextStep || '-'}`,
    '',
    '## 复盘质量检查',
    ...(reviewQuality.length
      ? reviewQuality.map(item => `- ${item.label}: ${item.status} / ${item.detail}`)
      : ['- 暂无检查']),
    '',
    '## 复盘问题',
    ...questions.map((question, index) => `${index + 1}. ${question}`),
    '',
    '## 生成样例',
    '```text',
    fencedText(sample),
    '```',
    '',
    '## 日志',
    ...logs.slice(-8).map(log => (
      `- step ${formatInteger(log.step)}: train=${formatLoss(log.trainLoss)}, eval=${formatLoss(log.evalLoss)}, elapsed=${formatInteger(log.elapsedSeconds)}s`
    ))
  ].join('\n');
};

const getTokenLabel = (tokenId: number | undefined, tokens: MiniGptTokenEntry[]) => {
  if (tokenId === undefined) return '-';
  const token = tokens.find(item => item.tokenId === tokenId);
  return token?.display || String(tokenId);
};

const buildBatchRows = (encodedSample: number[], tokens: MiniGptTokenEntry[]) => (
  encodedSample.slice(0, Math.max(0, Math.min(encodedSample.length - 1, 8))).map((tokenId, index) => {
    const targetId = encodedSample[index + 1];
    return {
      position: index,
      inputId: tokenId,
      inputToken: getTokenLabel(tokenId, tokens),
      targetId,
      targetToken: getTokenLabel(targetId, tokens)
    };
  })
);

const buildMaskSize = (run?: MiniGptRunRecord, encodedSample: number[] = []) => {
  const blockSize = Number(run?.config?.block_size);
  const candidates = [8, encodedSample.length || 8, Number.isFinite(blockSize) ? blockSize : 8];
  return Math.max(2, Math.min(...candidates.filter(value => value > 0)));
};

const modelStages = (run?: MiniGptRunRecord, corpusInsight?: MiniGptCorpusInsight) => {
  const config = run?.config || {};
  return [
    { key: 'tokens', label: 'Token IDs', value: `vocab=${formatInteger(corpusInsight?.vocabSize)}` },
    { key: 'token-embedding', label: 'Token Embedding', value: `n_embd=${config.n_embd || '-'}` },
    { key: 'position-embedding', label: 'Position Embedding', value: `block=${config.block_size || '-'}` },
    { key: 'blocks', label: 'Transformer Blocks', value: `layers=${config.n_layer || '-'} heads=${config.n_head || '-'}` },
    { key: 'logits', label: 'Logits', value: `vocab=${formatInteger(run?.config?.vocab_size as number | undefined)}` },
    { key: 'loss', label: 'Cross Entropy Loss', value: `eval=${formatLoss(run?.finalEvalLoss)}` }
  ];
};

const tensorShapeRows = (
  run: MiniGptRunRecord | undefined,
  corpusInsight: MiniGptCorpusInsight | undefined,
  encodedSample: number[]
) => {
  const config = run?.config || {};
  const batch = run?.batchSize || config.batch_size || '-';
  const block = config.block_size || buildMaskSize(run, encodedSample);
  const embedding = config.n_embd || '-';
  const heads = config.n_head || '-';
  const vocab = config.vocab_size || corpusInsight?.vocabSize || '-';
  return [
    {
      key: 'batch-x',
      label: 'x / y',
      shape: `[${batch}, ${block}]`,
      note: '输入 token 与下一个 token 目标'
    },
    {
      key: 'embedding',
      label: 'token + position',
      shape: `[${batch}, ${block}, ${embedding}]`,
      note: '离散 token 进入连续向量空间'
    },
    {
      key: 'attention',
      label: 'attention scores',
      shape: `[${batch}, ${heads}, ${block}, ${block}]`,
      note: '每个位置对历史位置打分'
    },
    {
      key: 'logits',
      label: 'logits',
      shape: `[${batch}, ${block}, ${vocab}]`,
      note: '每个位置预测词表分布'
    },
    {
      key: 'loss',
      label: 'cross entropy',
      shape: `[${Number.isFinite(Number(batch)) && Number.isFinite(Number(block)) ? Number(batch) * Number(block) : 'B*T'}, ${vocab}]`,
      note: '展平后计算 next-token loss'
    }
  ];
};

const codeReferenceRows = [
  {
    key: 'tokenizer',
    concept: 'Tokenizer',
    symbol: 'CharTokenizer',
    note: '字符与 token id 互转',
    action: '替换语料后检查 vocab 是否变化'
  },
  {
    key: 'batch',
    concept: 'Batch',
    symbol: 'get_batch',
    note: '构造 x/y next-token 样本',
    action: '确认 y 正好比 x 向后错一位'
  },
  {
    key: 'attention',
    concept: 'Causal Attention',
    symbol: 'CausalSelfAttention',
    note: 'mask、Q/K/V 和注意力权重',
    action: '对照 mask 看未来 token 是否被遮住'
  },
  {
    key: 'block',
    concept: 'Transformer Block',
    symbol: 'Block',
    note: 'attention、MLP、残差和 layer norm',
    action: '跟踪残差连接前后的张量形状'
  },
  {
    key: 'model',
    concept: 'Model',
    symbol: 'MiniGPT',
    note: 'embedding、blocks、logits、loss',
    action: '确认 logits 最后一维等于 vocab size'
  },
  {
    key: 'train',
    concept: 'Train',
    symbol: 'train',
    note: 'AdamW、eval、checkpoint 和日志',
    action: '比较 train/eval loss 和生成样例'
  },
  {
    key: 'generate',
    concept: 'Generate',
    symbol: 'generate',
    note: 'temperature、top-k 和采样',
    action: '用同一 prompt 对比采样参数'
  }
];

type LearningMilestoneStatus = 'done' | 'active' | 'todo';

const learningMilestones = (
  run: MiniGptRunRecord | undefined,
  logs: MiniGptTrainingLogRecord[],
  corpusInsight: MiniGptCorpusInsight | undefined
) => {
  const hasCorpus = Boolean(corpusInsight?.charCount && corpusInsight.charCount > 0 && corpusInsight.vocabSize);
  const hasBatch = Boolean((corpusInsight?.encodedSample?.length || 0) > 1);
  const hasTraining = Boolean(run?.runName);
  const hasEnoughLogs = logs.length >= 2;
  const hasEval = logs.some(log => Number.isFinite(log.evalLoss));
  const hasSample = logs.some(log => log.sample);
  const hasNotes = Boolean(run?.hypothesis || run?.observation || run?.conclusion || run?.nextStep);
  const isFinished = run?.status === 'SUCCESS' || run?.status === 'FAILED' || run?.status === 'CANCELLED';

  const status = (done: boolean, active: boolean): LearningMilestoneStatus => {
    if (done) return 'done';
    if (active) return 'active';
    return 'todo';
  };

  return [
    {
      key: 'tokenizer',
      title: 'Tokenizer',
      target: '理解字符如何映射为 token id',
      evidence: hasCorpus ? `vocab=${formatInteger(corpusInsight?.vocabSize)}` : '等待语料',
      status: status(hasCorpus, !hasCorpus)
    },
    {
      key: 'batch',
      title: 'Batch',
      target: '看清 x/y 错位一位的 next-token 目标',
      evidence: hasBatch ? `${Math.max(0, (corpusInsight?.encodedSample?.length || 1) - 1)} pairs` : '等待样例',
      status: status(hasBatch, hasCorpus)
    },
    {
      key: 'attention',
      title: 'Causal Attention',
      target: '确认当前位置只能看见历史 token',
      evidence: hasBatch ? `${buildMaskSize(run, corpusInsight?.encodedSample || [])}x mask` : '等待 batch',
      status: status(hasBatch && hasTraining, hasBatch)
    },
    {
      key: 'loss',
      title: 'Loss',
      target: '比较 train/eval loss 是否一起下降',
      evidence: hasEval ? `eval=${formatLoss(run?.finalEvalLoss ?? logs[logs.length - 1]?.evalLoss)}` : '等待验证',
      status: status(hasEnoughLogs && hasEval, hasTraining)
    },
    {
      key: 'sample',
      title: 'Generate',
      target: '观察生成文本是否从重复变得更像语料',
      evidence: hasSample ? '已有样例' : '等待采样',
      status: status(hasSample, hasEnoughLogs)
    },
    {
      key: 'review',
      title: 'Review',
      target: '写下假设、观察、结论和下一步',
      evidence: hasNotes ? '已有笔记' : isFinished ? '待复盘' : '等待实验结束',
      status: status(hasNotes, isFinished)
    }
  ];
};

const reviewQuestions = (
  run: MiniGptRunRecord | undefined,
  logs: MiniGptTrainingLogRecord[],
  generationResult?: MiniGptGenerationResult
) => {
  if (!run) {
    return [
      '先跑一次 Tiny 基线：语料能否被读取、tokenizer 是否符合预期？',
      '训练日志里 train/eval loss 是否都有记录？',
      '生成样例是否能看出语料风格的影子？'
    ];
  }
  const latestLog = logs[logs.length - 1];
  const questions = [
    `本次 ${run.preset || 'custom'} 实验的目标是什么，和上一个实验只改了哪个变量？`,
    `最后一步 train=${formatLoss(run.finalTrainLoss ?? latestLog?.trainLoss)}、eval=${formatLoss(run.finalEvalLoss ?? latestLog?.evalLoss)}，趋势是否稳定下降？`
  ];
  if (run.validationEnabled === false) {
    questions.push('验证集没有启用：是语料太短，还是 valRatio 设置不合适？');
  }
  if (Number.isFinite(run.lossGap) && Math.abs(run.lossGap || 0) > 0.5) {
    questions.push(`泛化差距 ${formatLoss(run.lossGap)} 偏大：模型是在记忆训练文本，还是验证集分布不同？`);
  }
  if (!latestSample(logs) && !generationResult?.generatedText) {
    questions.push('还没有生成样例：当前 checkpoint 是否保存成功，采样 prompt 是否在词表内？');
  } else {
    questions.push('生成文本里最明显的问题是什么：重复、跑题、标点混乱，还是上下文断裂？');
  }
  if (!run.conclusion) {
    questions.push('这次实验能形成哪一句结论，下一次要改学习率、上下文长度还是模型容量？');
  }
  return questions.slice(0, 6);
};

const buildReviewDraft = (
  run: MiniGptRunRecord | undefined,
  logs: MiniGptTrainingLogRecord[],
  variableDiffs: ExperimentVariableDiff[],
  checklistItems: LaunchChecklistItem[],
  actionItems: NextExperimentAction[],
  generationResult?: MiniGptGenerationResult
): MiniGptRunNoteRequest => {
  const latestLog = logs[logs.length - 1];
  const primaryDiff = variableDiffs[0];
  const sampleText = generationResult?.generatedText || latestSample(logs);
  const watchItems = checklistItems.filter(item => item.status !== 'PASS').map(item => item.label).join('、') || '暂无明显风险';
  const nextAction = actionItems[0];

  return {
    hypothesis: primaryDiff
      ? `如果只调整 ${primaryDiff.label}（${primaryDiff.from} -> ${primaryDiff.to}），应该能更清楚地观察它对 eval loss 和生成样例的影响。`
      : `本次 ${run?.preset || 'MiniGPT'} 实验先作为观察基线，确认训练链路、loss 记录和生成样例是否稳定。`,
    observation: `当前 train=${formatLoss(run?.finalTrainLoss ?? latestLog?.trainLoss)}，eval=${formatLoss(run?.finalEvalLoss ?? latestLog?.evalLoss)}；启动检查风险：${watchItems}；生成样例${sampleText ? '已有可复盘输出' : '暂缺，需要补一次采样'}。`,
    conclusion: run?.lossGap !== undefined
      ? `当前 loss gap=${formatLoss(run.lossGap)}，先把它作为判断过拟合和验证集差异的主要信号。`
      : '当前日志还不足以下强结论，先保留为待观察状态。',
    nextStep: nextAction ? `${nextAction.title}：${nextAction.action}` : '下一轮保持单变量对照，并补齐生成样例。'
  };
};

const reviewDraftSources = (
  run: MiniGptRunRecord | undefined,
  logs: MiniGptTrainingLogRecord[],
  variableDiffs: ExperimentVariableDiff[],
  checklistItems: LaunchChecklistItem[],
  actionItems: NextExperimentAction[],
  generationResult?: MiniGptGenerationResult
) => {
  const latestLog = logs[logs.length - 1];
  const sampleText = generationResult?.generatedText || latestSample(logs);
  const watchCount = checklistItems.filter(item => item.status !== 'PASS').length;
  return [
    {
      key: 'loss',
      label: 'Loss',
      value: `train=${formatLoss(run?.finalTrainLoss ?? latestLog?.trainLoss)} / eval=${formatLoss(run?.finalEvalLoss ?? latestLog?.evalLoss)}`
    },
    {
      key: 'variable',
      label: '变量',
      value: variableDiffs[0] ? `${variableDiffs[0].label}: ${variableDiffs[0].from} -> ${variableDiffs[0].to}` : '暂无变量差异'
    },
    {
      key: 'checklist',
      label: '启动检查',
      value: watchCount ? `${watchCount} 项需注意` : '全部通过'
    },
    {
      key: 'sample',
      label: '生成样例',
      value: sampleText ? '已有输出' : '暂缺采样'
    },
    {
      key: 'next',
      label: '下一步',
      value: actionItems[0]?.title || '暂无建议'
    }
  ];
};

const reviewQualityItems = (values: MiniGptRunNoteRequest = {}): ReviewQualityItem[] => {
  const rows: Array<[keyof MiniGptRunNoteRequest, string, string]> = [
    ['hypothesis', '假设', '说明本轮实验要验证什么'],
    ['observation', '观察', '记录 loss、样例或异常现象'],
    ['conclusion', '结论', '写出当前能确认和不能确认的判断'],
    ['nextStep', '下一步', '明确下一轮只改哪个变量']
  ];

  return rows.map(([key, label, hint]) => {
    const length = (values[key] || '').trim().length;
    return {
      key,
      label,
      status: length >= 18 ? 'PASS' : length > 0 ? 'WATCH' : 'TODO',
      detail: length >= 18 ? '内容足够复盘' : length > 0 ? '再补一点具体依据' : hint
    };
  });
};

const MiniGptLearningPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<MiniGptTrainingRequest>();
  const [noteForm] = Form.useForm<MiniGptRunNoteRequest>();
  const [generationForm] = Form.useForm<MiniGptGenerationRequest>();
  const [dashboard, setDashboard] = useState<MiniGptDashboard>({});
  const [corpusInsight, setCorpusInsight] = useState<MiniGptCorpusInsight>({});
  const [trainingStatus, setTrainingStatus] = useState<MiniGptTrainingStatus>({});
  const [environmentCheck, setEnvironmentCheck] = useState<MiniGptEnvironmentCheck>({});
  const [lotteryCorpusExport, setLotteryCorpusExport] = useState<MiniGptLotteryCorpusExport>();
  const [generationResult, setGenerationResult] = useState<MiniGptGenerationResult>();
  const [generationComparisons, setGenerationComparisons] = useState<MiniGptGenerationResult[]>([]);
  const [selectedGenerationKey, setSelectedGenerationKey] = useState<string>();
  const [selectedTraceTokenKey, setSelectedTraceTokenKey] = useState<string>();
  const [savedCandidateSet, setSavedCandidateSet] = useState<LotteryDecisionSet>();
  const [candidateBacktest, setCandidateBacktest] = useState<LotteryBacktestReport>();
  const [selectedRun, setSelectedRun] = useState<string>();
  const [comparisonRunNames, setComparisonRunNames] = useState<string[]>([]);
  const [comparisonLogs, setComparisonLogs] = useState<Record<string, MiniGptTrainingLogRecord[]>>({});
  const [plannedExperiments, setPlannedExperiments] = useState<PlannedExperiment[]>(loadPlannedExperiments);
  const [loading, setLoading] = useState(false);
  const [corpusLoading, setCorpusLoading] = useState(false);
  const [environmentLoading, setEnvironmentLoading] = useState(false);
  const [lotteryCorpusLoading, setLotteryCorpusLoading] = useState(false);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [comparingGeneration, setComparingGeneration] = useState(false);
  const [savingCandidateSet, setSavingCandidateSet] = useState(false);
  const [runningCandidateBacktest, setRunningCandidateBacktest] = useState(false);
  const watchedTrainingValues = Form.useWatch([], form) as MiniGptTrainingRequest | undefined;
  const watchedRunName = Form.useWatch('runName', form) as string | undefined;
  const watchedNoteValues = Form.useWatch([], noteForm) as MiniGptRunNoteRequest | undefined;

  const loadDashboard = useCallback(async (runName?: string, quiet = false) => {
    if (!quiet) {
      setLoading(true);
    }
    try {
      const data = await miniGptApi.dashboard({ runName, runLimit: 50, logLimit: 500 });
      setDashboard(data);
      setSelectedRun(data.latestRun?.runName);
    } catch (error) {
      console.error('加载 MiniGPT 学习数据失败:', error);
      message.error('MiniGPT 学习数据加载失败');
    } finally {
      if (!quiet) {
        setLoading(false);
      }
    }
  }, []);

  const loadTrainingStatus = useCallback(async (quiet = true) => {
    try {
      const status = await miniGptApi.trainingStatus();
      setTrainingStatus(status);
      if (status.runName) {
        setSelectedRun(status.runName);
      }
      if (status.running && status.runName) {
        await loadDashboard(status.runName, quiet);
      }
    } catch (error) {
      console.error('加载 MiniGPT 训练状态失败:', error);
    }
  }, [loadDashboard]);

  const loadCorpusInsight = useCallback(async (values?: MiniGptTrainingRequest) => {
    const currentValues = values || form.getFieldsValue();
    setCorpusLoading(true);
    try {
      const data = await miniGptApi.corpusInsight({
        data: currentValues.data || 'data/sample.txt',
        sample: currentValues.samplePrompt || '语言模型',
        tokenLimit: 120
      });
      setCorpusInsight(data);
    } catch (error) {
      console.error('加载 MiniGPT 语料洞察失败:', error);
      message.error('MiniGPT 语料洞察加载失败');
    } finally {
      setCorpusLoading(false);
    }
  }, [form]);

  const loadEnvironmentCheck = useCallback(async (quiet = false) => {
    setEnvironmentLoading(true);
    try {
      const data = await miniGptApi.environment();
      setEnvironmentCheck(data);
      if (!quiet && data.status === 'PASS') {
        message.success('MiniGPT 训练环境检查通过');
      }
    } catch (error) {
      console.error('加载 MiniGPT 训练环境检查失败:', error);
      if (!quiet) {
        message.error('MiniGPT 训练环境检查失败');
      }
    } finally {
      setEnvironmentLoading(false);
    }
  }, []);

  const handleExportLotteryCorpus = useCallback(async (format: 'raw' | 'features') => {
    setLotteryCorpusLoading(true);
    try {
      const exported = await miniGptApi.exportLotteryCorpus({ format, limit: 2000 });
      setLotteryCorpusExport(exported);
      const nextValues = {
        ...form.getFieldsValue(),
        data: exported.dataPath || `data/lottery-${format}.txt`,
        samplePrompt: format === 'features'
          ? 'target=next strategy=balanced'
          : exported.latestIssue ? `${exported.latestIssue}:` : '2026001:'
      };
      form.setFieldsValue(nextValues);
      await loadCorpusInsight(nextValues);
      message.success(`已导出 ${exported.drawCount || 0} 期双色球语料`);
    } catch (error) {
      console.error('导出 MiniGPT 双色球语料失败:', error);
      message.error('双色球语料导出失败');
    } finally {
      setLotteryCorpusLoading(false);
    }
  }, [form, loadCorpusInsight]);

  const handleApplyTrainingRecipe = (recipe: MiniGptTrainingRecipe) => {
    const mergedValues = {
      ...form.getFieldsValue(),
      ...recipe.values
    };
    form.setFieldsValue(mergedValues);
    loadCorpusInsight(mergedValues);
    message.info(`已应用实验模板：${recipe.title}`);
  };

  const handleApplyPromptPreset = (preset: typeof promptPresetRows[number]) => {
    generationForm.setFieldsValue({
      ...generationForm.getFieldsValue(),
      prompt: preset.prompt,
      maxNewTokens: preset.tokens,
      temperature: preset.temperature,
      topK: preset.topK
    });
    message.info(`已应用 Prompt：${preset.title}`);
  };

  const handleAddPlan = (item: NextExperimentAction) => {
    const plannedItem: PlannedExperiment = {
      ...item,
      id: `${item.key}-${Date.now()}`,
      sourceRun: run?.runName
    };
    setPlannedExperiments(current => [plannedItem, ...current].slice(0, 8));
    message.success(`已加入实验计划：${item.title}`);
  };

  const handleRemovePlan = (id: string) => {
    setPlannedExperiments(current => current.filter(item => item.id !== id));
  };

  const handleClearPlans = () => {
    setPlannedExperiments([]);
    message.success('实验计划已清空');
  };

  const handleApplyPlanToForm = (item: PlannedExperiment) => {
    if (!item.formValues) {
      message.info('这条计划没有可自动应用的训练参数');
      return;
    }
    const mergedValues = {
      ...form.getFieldsValue(),
      ...item.formValues
    };
    form.setFieldsValue(mergedValues);
    loadCorpusInsight(mergedValues);
    message.success(`已应用计划到训练表单：${item.title}`);
  };

  const handleKeepFirstVariableOnly = () => {
    if (!run || variableDiffItems.length <= 1) return;
    const [, ...diffsToReset] = variableDiffItems;
    const resetValues = diffsToReset.reduce<Partial<MiniGptTrainingRequest>>((values, item) => ({
      ...values,
      [item.key]: currentTrainingValue(run, item.key as keyof MiniGptTrainingRequest)
    }), {});
    const mergedValues = {
      ...form.getFieldsValue(),
      ...resetValues
    };
    form.setFieldsValue(mergedValues);
    loadCorpusInsight(mergedValues);
    message.success(`已保留变量：${variableDiffItems[0].label}`);
  };

  const handleSuggestRunName = () => {
    if (variableDiffItems.length !== 1) {
      message.info('请先收敛到一个变量，再生成实验名');
      return;
    }
    const nextRunName = uniqueRunName(buildSuggestedRunName(run, variableDiffItems), runs);
    form.setFieldsValue({
      ...form.getFieldsValue(),
      runName: nextRunName
    });
    message.success(`已生成实验名：${nextRunName}`);
  };

  const loadComparisonLogs = useCallback(async (runNames: string[]) => {
    const safeRunNames = runNames.filter(Boolean).slice(0, 4);
    setComparisonRunNames(safeRunNames);
    if (!safeRunNames.length) {
      setComparisonLogs({});
      return;
    }
    setComparisonLoading(true);
    try {
      const entries = await Promise.all(safeRunNames.map(async runName => {
        const items = await miniGptApi.logs({ runName, limit: 500 });
        return [runName, items] as const;
      }));
      setComparisonLogs(Object.fromEntries(entries));
    } catch (error) {
      console.error('加载 MiniGPT 对比日志失败:', error);
      message.error('MiniGPT 对比日志加载失败');
    } finally {
      setComparisonLoading(false);
    }
  }, []);

  const handleStartTraining = async (values: MiniGptTrainingRequest) => {
    const startDiffs = experimentVariableDiffs(run, values);
    if (run && startDiffs.length === 0) {
      message.warning('当前表单与最新实验一致，建议先修改一个变量再训练');
    }
    if (run && startDiffs.length > 1) {
      message.warning(`当前同时修改 ${startDiffs.length} 个变量，复盘时会更难归因`);
    }
    setStarting(true);
    try {
      const status = await miniGptApi.startTraining(values);
      setTrainingStatus(status);
      setSelectedRun(status.runName);
      message.success('MiniGPT 训练已启动');
      await loadDashboard(status.runName, true);
    } catch (error) {
      console.error('启动 MiniGPT 训练失败:', error);
      message.error('启动 MiniGPT 训练失败');
    } finally {
      setStarting(false);
    }
  };

  const handleCancelTraining = async () => {
    setCancelling(true);
    try {
      const status = await miniGptApi.cancelTraining();
      setTrainingStatus(status);
      message.info(status.message || '已发送取消请求');
    } catch (error) {
      console.error('取消 MiniGPT 训练失败:', error);
      message.error('取消 MiniGPT 训练失败');
    } finally {
      setCancelling(false);
    }
  };

  const handleSaveNotes = async (values: MiniGptRunNoteRequest) => {
    if (!run?.runName) {
      message.warning('请先选择一个实验');
      return;
    }
    setSavingNotes(true);
    try {
      await miniGptApi.updateRunNotes(run.runName, values);
      message.success('实验笔记已保存');
      await loadDashboard(run.runName, true);
    } catch (error) {
      console.error('保存 MiniGPT 实验笔记失败:', error);
      message.error('实验笔记保存失败');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDraftReviewNotes = () => {
    const draft = buildReviewDraft(run, logs, variableDiffItems, launchChecklistItems, nextActionItems, generationResult);
    noteForm.setFieldsValue({
      ...noteForm.getFieldsValue(),
      ...draft
    });
    message.success('复盘草稿已填入');
  };

  const handleGenerate = async (values: MiniGptGenerationRequest) => {
    if (!run?.runName) {
      message.warning('请先选择一个已完成训练的实验');
      return;
    }
    setGenerating(true);
    try {
      const result = await miniGptApi.generate({
        ...values,
        runName: run.runName
      });
      setGenerationResult(result);
      setSelectedGenerationKey(undefined);
      setSelectedTraceTokenKey(undefined);
      setSavedCandidateSet(undefined);
      setCandidateBacktest(undefined);
    } catch (error) {
      console.error('MiniGPT 生成失败:', error);
      message.error('MiniGPT 生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleCompareGeneration = async () => {
    if (!run?.runName || !run?.checkpoint) {
      message.warning('请先选择一个有 checkpoint 的实验');
      return;
    }
    const values = generationForm.getFieldsValue();
    setComparingGeneration(true);
    try {
      const results = await miniGptApi.compareGeneration({
        runName: run.runName,
        prompt: values.prompt || run.samplePrompt || 'target=next strategy=balanced',
        maxNewTokens: values.maxNewTokens || run.sampleTokens || 120,
        temperatures: [0.7, values.temperature || 0.9, 1.1],
        topKs: [values.topK || 20]
      });
      setGenerationComparisons(results);
      if (results[0]) {
        setGenerationResult(results[0]);
      }
      setSelectedGenerationKey(undefined);
      setSelectedTraceTokenKey(undefined);
      setSavedCandidateSet(undefined);
      setCandidateBacktest(undefined);
      message.success(`已完成 ${results.length} 组采样参数对比`);
    } catch (error) {
      console.error('MiniGPT 采样参数对比失败:', error);
      message.error('MiniGPT 采样参数对比失败');
    } finally {
      setComparingGeneration(false);
    }
  };

  const handleSaveCandidateSet = async () => {
    if (!decisionCandidateSelections.length) {
      message.warning('当前没有可保存的合规或可修复候选');
      return;
    }
    setSavingCandidateSet(true);
    try {
      const timestamp = new Date().toLocaleString('zh-CN', { hour12: false });
      const saved = await lotteryDecisionSetApi.createDecisionSet({
        title: `MiniGPT 候选池 ${timestamp}`,
        ruleName: run?.runName ? `MiniGPT:${run.runName}` : 'MiniGPT',
        evidenceState: 'MINIGPT',
        resultState: 'PENDING',
        conversionState: 'DRAFT',
        note: `由 MiniGPT 生成试验台保存，prompt=${generationForm.getFieldValue('prompt') || run?.samplePrompt || '-'}`,
        selectedCandidates: decisionCandidateSelections
      });
      setSavedCandidateSet(saved);
      setCandidateBacktest(undefined);
      message.success(`已保存候选池：${saved.title || saved.id || 'MiniGPT 决策集'}`);
    } catch (error) {
      console.error('保存 MiniGPT 候选池失败:', error);
      message.error('保存 MiniGPT 候选池失败');
    } finally {
      setSavingCandidateSet(false);
    }
  };

  const handleRunCandidateBacktest = async () => {
    if (!savedCandidateSet?.id) {
      message.warning('请先保存候选池');
      return;
    }
    setRunningCandidateBacktest(true);
    try {
      const report = await lotteryBacktestApi.run({
        decisionSetId: savedCandidateSet.id,
        strategyName: savedCandidateSet.ruleName || savedCandidateSet.title || 'MiniGPT 候选池',
        presetWindow: 'latest-30',
        window: 30
      });
      setCandidateBacktest(report);
      message.success('MiniGPT 候选池回测完成');
    } catch (error) {
      console.error('MiniGPT 候选池回测失败:', error);
      message.error('MiniGPT 候选池回测失败');
    } finally {
      setRunningCandidateBacktest(false);
    }
  };

  const openCandidateBacktestDetail = () => {
    if (!candidateBacktest?.id) {
      message.warning('当前回测报告缺少 ID，暂时无法打开详情');
      return;
    }
    navigate(`/lottery/backtests/${candidateBacktest.id}`);
  };

  const openCandidateBacktestResearch = () => {
    if (!candidateBacktest?.id) {
      message.warning('当前回测报告缺少 ID，暂时无法进入研究对比');
      return;
    }
    navigate(`/lottery/research?items=${encodeURIComponent(`backtest:${candidateBacktest.id}`)}`);
  };

  const openCandidateBacktestNotebook = () => {
    if (!candidateBacktest?.id) {
      message.warning('当前回测报告缺少 ID，暂时无法挂到笔记');
      return;
    }
    const evidenceKey = `backtest:${candidateBacktest.id}`;
    const search = new URLSearchParams({
      evidenceKey,
      evidenceType: 'BACKTEST',
      evidenceTitle: candidateBacktest.strategyName || 'MiniGPT 候选池回测',
      sourceId: candidateBacktest.id,
      path: `/lottery/backtests/${candidateBacktest.id}`,
      title: `${candidateBacktest.strategyName || 'MiniGPT 候选池'} 训练复盘`
    });
    navigate(`/lottery/research/notebook?${search.toString()}`);
  };

  const openCandidateBacktestExport = () => {
    if (!candidateBacktest?.strategyName) {
      message.warning('当前回测报告缺少策略名称，暂时无法带入导出筛选');
      return;
    }
    const search = new URLSearchParams({
      type: 'backtests',
      strategyName: candidateBacktest.strategyName,
      preset: 'long-term-research'
    });
    navigate(`/lottery/exports?${search.toString()}`);
  };

  useEffect(() => {
    loadDashboard();
    loadTrainingStatus();
    loadCorpusInsight({
      data: 'data/sample.txt',
      samplePrompt: '语言模型'
    });
    loadEnvironmentCheck(true);
    const timer = window.setInterval(() => {
      loadTrainingStatus(true);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [loadCorpusInsight, loadDashboard, loadEnvironmentCheck, loadTrainingStatus]);

  useEffect(() => {
    savePlannedExperiments(plannedExperiments);
  }, [plannedExperiments]);

  const runs = useMemo(() => dashboard.runs || [], [dashboard.runs]);
  const dashboardLogs = useMemo(() => dashboard.logs || [], [dashboard.logs]);
  const activeTrainingRun = useMemo<MiniGptRunRecord | undefined>(() => {
    if (!trainingStatus.runName) {
      return undefined;
    }
    return trainingStatus.run || {
      runName: trainingStatus.runName,
      preset: trainingStatus.preset,
      status: trainingStatus.running ? 'RUNNING' : trainingStatus.failed ? 'FAILED' : trainingStatus.cancelled ? 'CANCELLED' : undefined,
      maxSteps: trainingStatus.totalSteps,
      finalTrainLoss: trainingStatus.latestLog?.trainLoss,
      finalEvalLoss: trainingStatus.latestLog?.evalLoss
    };
  }, [trainingStatus]);
  const run = (trainingStatus.running && activeTrainingRun) ? activeTrainingRun : dashboard.latestRun || activeTrainingRun;
  const logs = useMemo(
    () => mergeStatusLog(run?.runName, dashboardLogs, trainingStatus.latestLog),
    [dashboardLogs, run?.runName, trainingStatus.latestLog]
  );
  const sample = latestSample(logs);
  const chartOption = useMemo(() => buildChartOption(logs), [logs]);
  const lossDiagnosticItems = useMemo(() => lossDiagnostics(run, logs), [logs, run]);
  const latestStatusLog = trainingStatus.latestLog;
  const trainingPercent = trainingStatus.running ? trainingStatus.percent ?? 1 : trainingStatus.failed ? 100 : trainingStatus.percent ?? 0;
  const encodedSample = useMemo(() => corpusInsight.encodedSample || [], [corpusInsight.encodedSample]);
  const tokenRows = useMemo(() => corpusInsight.tokens || [], [corpusInsight.tokens]);
  const corpusDiagnosticItems = useMemo(() => corpusDiagnostics(corpusInsight), [corpusInsight]);
  const batchRows = useMemo(() => buildBatchRows(encodedSample, tokenRows), [encodedSample, tokenRows]);
  const maskSize = useMemo(() => buildMaskSize(run, encodedSample), [encodedSample, run]);
  const architectureStages = useMemo(() => modelStages(run, corpusInsight), [corpusInsight, run]);
  const shapeRows = useMemo(() => tensorShapeRows(run, corpusInsight, encodedSample), [corpusInsight, encodedSample, run]);
  const comparisonChartOption = useMemo(() => buildComparisonChartOption(comparisonLogs), [comparisonLogs]);
  const comparisonSummary = useMemo(() => comparisonSummaryItems(comparisonLogs), [comparisonLogs]);
  const milestones = useMemo(() => learningMilestones(run, logs, corpusInsight), [corpusInsight, logs, run]);
  const reviewQuestionItems = useMemo(() => reviewQuestions(run, logs, generationResult), [generationResult, logs, run]);
  const generationDiagnosticItems = useMemo(
    () => generationDiagnostics(run, logs, generationResult),
    [generationResult, logs, run]
  );
  const lotteryCandidate = generationResult?.lotteryCandidate;
  const generationRankRows = useMemo(
    () => generationRankItems([
      ...(generationResult ? [generationResult] : []),
      ...generationComparisons
    ]),
    [generationComparisons, generationResult]
  );
  const selectedGenerationRank = useMemo(
    () => generationRankRows.find(item => item.key === selectedGenerationKey) || generationRankRows[0],
    [generationRankRows, selectedGenerationKey]
  );
  const generationRadarOption = useMemo(
    () => buildGenerationRadarOption(selectedGenerationRank),
    [selectedGenerationRank]
  );
  const generationTokenTrace = useMemo(
    () => buildGenerationTokenTrace(generationResult),
    [generationResult]
  );
  const selectedTraceToken = useMemo(
    () => generationTokenTrace.find(item => item.key === selectedTraceTokenKey) || generationTokenTrace.find(item => item.role === 'generated') || generationTokenTrace[0],
    [generationTokenTrace, selectedTraceTokenKey]
  );
  const decisionCandidateSelections = useMemo(
    () => uniqueDecisionCandidates([
      ...(generationResult ? [generationResult] : []),
      ...generationComparisons
    ]),
    [generationComparisons, generationResult]
  );
  const nextActionItems = useMemo(
    () => nextExperimentActions(run, logs, corpusInsight, generationResult),
    [corpusInsight, generationResult, logs, run]
  );
  const trainingFormValues = useMemo(
    () => ({ ...form.getFieldsValue(), ...(watchedTrainingValues || {}) }),
    [form, watchedTrainingValues]
  );
  const noteFormValues = useMemo(
    () => ({ ...noteForm.getFieldsValue(), ...(watchedNoteValues || {}) }),
    [noteForm, watchedNoteValues]
  );
  const variableDiffItems = useMemo(
    () => experimentVariableDiffs(run, trainingFormValues),
    [run, trainingFormValues]
  );
  const variableGuardState = useMemo(
    () => variableGuard(run, variableDiffItems),
    [run, variableDiffItems]
  );
  const suggestedRunName = useMemo(
    () => variableDiffItems.length === 1 ? buildSuggestedRunName(run, variableDiffItems) : '',
    [run, variableDiffItems]
  );
  const runNameExists = useMemo(
    () => Boolean(watchedRunName && runs.some(item => item.runName === watchedRunName)),
    [runs, watchedRunName]
  );
  const fallbackRunName = useMemo(
    () => watchedRunName ? uniqueRunName(watchedRunName, runs) : uniqueRunName(suggestedRunName || 'minigpt-next', runs),
    [runs, suggestedRunName, watchedRunName]
  );
  const launchChecklistItems = useMemo(
    () => launchChecklist(run, corpusDiagnosticItems, variableGuardState, runNameExists, plannedExperiments),
    [corpusDiagnosticItems, plannedExperiments, run, runNameExists, variableGuardState]
  );
  const reviewDraftSourceItems = useMemo(
    () => reviewDraftSources(run, logs, variableDiffItems, launchChecklistItems, nextActionItems, generationResult),
    [generationResult, launchChecklistItems, logs, nextActionItems, run, variableDiffItems]
  );
  const reviewQualityCheckItems = useMemo(
    () => reviewQualityItems(noteFormValues),
    [noteFormValues]
  );
  const experimentReport = useMemo(
    () => run ? buildExperimentReport(
      run,
      logs,
      generationResult,
      corpusInsight,
      plannedExperiments,
      variableDiffItems,
      launchChecklistItems,
      noteFormValues,
      reviewQualityCheckItems
    ) : '',
    [
      corpusInsight,
      generationResult,
      launchChecklistItems,
      logs,
      noteFormValues,
      plannedExperiments,
      reviewQualityCheckItems,
      run,
      variableDiffItems
    ]
  );

  const handleCopyReport = async () => {
    if (!experimentReport) {
      message.warning('请先选择一个实验');
      return;
    }
    try {
      await navigator.clipboard.writeText(experimentReport);
      message.success('实验报告已复制');
    } catch (error) {
      console.error('复制 MiniGPT 实验报告失败:', error);
      message.error('实验报告复制失败');
    }
  };

  useEffect(() => {
    if (!comparisonRunNames.length && runs.length) {
      loadComparisonLogs(runs.slice(0, 3).map(item => item.runName).filter(Boolean) as string[]);
    }
  }, [comparisonRunNames.length, loadComparisonLogs, runs]);

  useEffect(() => {
    noteForm.setFieldsValue({
      hypothesis: run?.hypothesis,
      observation: run?.observation,
      conclusion: run?.conclusion,
      nextStep: run?.nextStep
    });
    generationForm.setFieldsValue({
      prompt: run?.samplePrompt || '语言模型',
      maxNewTokens: run?.sampleTokens || 120,
      temperature: 0.9,
      topK: 20
    });
    setGenerationResult(undefined);
    setGenerationComparisons([]);
    setSelectedGenerationKey(undefined);
    setSelectedTraceTokenKey(undefined);
    setSavedCandidateSet(undefined);
    setCandidateBacktest(undefined);
  }, [generationForm, noteForm, run]);

  const columns = [
    {
      title: 'Step',
      dataIndex: 'step',
      width: 90
    },
    {
      title: 'Train Loss',
      dataIndex: 'trainLoss',
      width: 130,
      render: (value?: number) => formatLoss(value)
    },
    {
      title: 'Eval Loss',
      dataIndex: 'evalLoss',
      width: 130,
      render: (value?: number) => formatLoss(value)
    },
    {
      title: '耗时',
      dataIndex: 'elapsedSeconds',
      width: 100,
      render: (value?: number) => Number.isFinite(value) ? `${value}s` : '-'
    },
    {
      title: '样例',
      dataIndex: 'sample',
      render: (value?: string) => <pre className="mini-gpt-table-sample">{value || '-'}</pre>
    }
  ];

  const tokenColumns = [
    {
      title: 'ID',
      dataIndex: 'tokenId',
      width: 76
    },
    {
      title: 'Token',
      dataIndex: 'display',
      width: 110,
      render: (value?: string) => <code>{value || '-'}</code>
    },
    {
      title: 'Code Point',
      dataIndex: 'codePoint',
      width: 130
    }
  ];

  return (
    <LifePageShell
      eyebrow="OneAI / MiniGPT"
      title="MiniGPT 学习实验"
      className="mini-gpt-page"
      actions={(
        <Space wrap>
          <Select
            className="mini-gpt-run-select"
            placeholder="选择实验"
            value={selectedRun}
            options={runs.map(item => ({
              value: item.runName,
              label: [item.runName, item.preset, item.finalEvalLoss !== undefined ? `eval=${formatLoss(item.finalEvalLoss)}` : '']
                .filter(Boolean)
                .join(' · ')
            }))}
            onChange={(value) => loadDashboard(value)}
          />
          <Button icon={<ReloadOutlined />} onClick={() => loadDashboard(selectedRun)} loading={loading}>
            刷新
          </Button>
        </Space>
      )}
    >
      <Spin spinning={loading}>
        <div className="mini-gpt-workspace">
          <Card className="mini-gpt-panel mini-gpt-training-card" title="训练控制">
            <div className="mini-gpt-training-grid">
              <Form
                form={form}
                layout="vertical"
                className="mini-gpt-training-form"
                initialValues={{
                  preset: 'tiny',
                  data: 'data/sample.txt',
                  maxSteps: 120,
                  valRatio: 0.1,
                  samplePrompt: '语言模型',
                  sampleTokens: 80
                }}
                onFinish={handleStartTraining}
              >
                <Form.Item name="preset" label="预设">
                  <Select
                    options={[
                      { value: 'tiny', label: 'tiny' },
                      { value: 'small', label: 'small' },
                      { value: 'medium', label: 'medium' },
                      { value: 'custom', label: 'custom' }
                    ]}
                  />
                </Form.Item>
                <Form.Item name="runName" label="实验名">
                  <Input
                    placeholder="留空自动生成"
                    addonAfter={(
                      <Button
                        type="link"
                        size="small"
                        disabled={variableDiffItems.length !== 1}
                        onClick={handleSuggestRunName}
                      >
                        命名
                      </Button>
                    )}
                  />
                </Form.Item>
                <Form.Item name="resumeFromRun" label="续训来源">
                  <Select
                    allowClear
                    placeholder="从已有 checkpoint 继续"
                    options={runs
                      .filter(item => item.runName && item.checkpoint)
                      .map(item => ({
                        value: item.runName,
                        label: [item.runName, item.trainStep !== undefined ? `step=${formatInteger(item.trainStep)}` : '', item.finalEvalLoss !== undefined ? `eval=${formatLoss(item.finalEvalLoss)}` : '']
                          .filter(Boolean)
                          .join(' · ')
                      }))}
                  />
                </Form.Item>
                <Form.Item name="data" label="语料">
                  <Input />
                </Form.Item>
                <Form.Item name="maxSteps" label="步数">
                  <InputNumber min={1} max={5000} />
                </Form.Item>
                <Form.Item name="valRatio" label="验证比例">
                  <InputNumber min={0} max={0.5} step={0.05} />
                </Form.Item>
                <Form.Item name="samplePrompt" label="采样提示">
                  <Input />
                </Form.Item>
                <Form.Item name="sampleTokens" label="采样长度">
                  <InputNumber min={1} max={500} />
                </Form.Item>
                <section className="mini-gpt-advanced-form">
                  <Form.Item name="batchSize" label="Batch Size">
                    <InputNumber min={1} max={256} />
                  </Form.Item>
                  <Form.Item name="learningRate" label="Learning Rate">
                    <InputNumber min={0.000001} max={0.1} step={0.0001} />
                  </Form.Item>
                  <Form.Item name="blockSize" label="Block Size">
                    <InputNumber min={4} max={512} />
                  </Form.Item>
                  <Form.Item name="nEmbd" label="Embedding">
                    <InputNumber min={8} max={1024} />
                  </Form.Item>
                  <Form.Item name="nHead" label="Heads">
                    <InputNumber min={1} max={32} />
                  </Form.Item>
                  <Form.Item name="nLayer" label="Layers">
                    <InputNumber min={1} max={48} />
                  </Form.Item>
                  <Form.Item name="temperature" label="Temperature">
                    <InputNumber min={0.1} max={2} step={0.1} />
                  </Form.Item>
                  <Form.Item name="topK" label="Top-K">
                    <InputNumber min={1} max={200} />
                  </Form.Item>
                </section>
                <section className="mini-gpt-recipe-grid">
                  {trainingRecipes.map(recipe => (
                    <button
                      type="button"
                      key={recipe.key}
                      onClick={() => handleApplyTrainingRecipe(recipe)}
                      disabled={trainingStatus.running}
                    >
                      <strong>{recipe.title}</strong>
                      <span>{recipe.description}</span>
                    </button>
                  ))}
                </section>
                <section className="mini-gpt-lottery-corpus">
                  <div className="mini-gpt-lottery-corpus-head">
                    <Text type="secondary">双色球训练语料</Text>
                    <Space wrap>
                      <Button
                        size="small"
                        icon={<DatabaseOutlined />}
                        loading={lotteryCorpusLoading}
                        disabled={trainingStatus.running}
                        onClick={() => handleExportLotteryCorpus('raw')}
                      >
                        开奖格式
                      </Button>
                      <Button
                        size="small"
                        icon={<DatabaseOutlined />}
                        loading={lotteryCorpusLoading}
                        disabled={trainingStatus.running}
                        onClick={() => handleExportLotteryCorpus('features')}
                      >
                        结构特征
                      </Button>
                    </Space>
                  </div>
                  {lotteryCorpusExport ? (
                    <div className="mini-gpt-lottery-corpus-result">
                      <Tag color="cyan">{lotteryCorpusExport.format}</Tag>
                      <span>{lotteryCorpusExport.drawCount || 0} 期</span>
                      <code>{lotteryCorpusExport.dataPath || '-'}</code>
                      <p>{lotteryCorpusExport.firstIssue || '-'} - {lotteryCorpusExport.latestIssue || '-'}</p>
                    </div>
                  ) : (
                    <p>从 Mongo 开奖记录导出 MiniGPT 训练文本，并自动填入语料路径。</p>
                  )}
                </section>
                <Form.Item className="mini-gpt-training-actions">
                  <Space wrap>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<PlayCircleOutlined />}
                      loading={starting}
                      disabled={trainingStatus.running}
                    >
                      开始训练
                    </Button>
                    <Button
                      danger
                      icon={<CloseCircleOutlined />}
                      loading={cancelling}
                      disabled={!trainingStatus.running}
                      onClick={handleCancelTraining}
                    >
                      取消
                    </Button>
                  </Space>
                </Form.Item>
              </Form>

              <div className="mini-gpt-status-panel">
                <Space wrap>
                  <Tag color={trainingStatus.running ? 'processing' : trainingStatus.failed ? 'error' : trainingStatus.cancelled ? 'warning' : 'default'}>
                    {trainingStatus.stage || '空闲'}
                  </Tag>
                  {trainingStatus.runName && <Tag>{trainingStatus.runName}</Tag>}
                </Space>
                <Progress
                  percent={trainingPercent}
                  status={trainingStatus.failed ? 'exception' : trainingStatus.running ? 'active' : 'normal'}
                />
                <p>{trainingStatus.message || '暂无运行中的 MiniGPT 训练'}</p>
                <dl>
                  <div>
                    <dt>当前 Step</dt>
                    <dd>{formatInteger(trainingStatus.processedStep)} / {formatInteger(trainingStatus.totalSteps)}</dd>
                  </div>
                  <div>
                    <dt>最近 Loss</dt>
                    <dd>{formatLoss(latestStatusLog?.evalLoss)}</dd>
                  </div>
                  <div>
                    <dt>更新时间</dt>
                    <dd>{formatTime(trainingStatus.updatedAt)}</dd>
                  </div>
                </dl>
                <section className="mini-gpt-env-check">
                  <div className="mini-gpt-env-check-head">
                    <Text type="secondary">训练环境</Text>
                    <Space wrap>
                      <Tag color={environmentCheck.status === 'PASS' ? 'green' : 'orange'}>
                        {environmentCheck.status || 'CHECK'}
                      </Tag>
                      <Button size="small" icon={<ReloadOutlined />} loading={environmentLoading} onClick={() => loadEnvironmentCheck()}>
                        检查
                      </Button>
                    </Space>
                  </div>
                  <div className="mini-gpt-env-check-grid">
                    <div className={environmentCheck.pythonAvailable ? 'pass' : 'watch'}>
                      <span>Python</span>
                      <strong>{environmentCheck.pythonAvailable ? '可用' : '未确认'}</strong>
                    </div>
                    <div className={environmentCheck.pymongoAvailable ? 'pass' : 'watch'}>
                      <span>pymongo</span>
                      <strong>{environmentCheck.pymongoVersion || '-'}</strong>
                    </div>
                    <div className={environmentCheck.mongoAvailable ? 'pass' : 'watch'}>
                      <span>Mongo</span>
                      <strong>{environmentCheck.mongoAvailable ? environmentCheck.mongoDb || 'test' : '不可用'}</strong>
                    </div>
                  </div>
                  <p>{environmentCheck.message || '检查 Python 直接写 Mongo 的依赖链路'}</p>
                </section>
              </div>
            </div>
            <section className="mini-gpt-variable-diff">
              <div className="mini-gpt-variable-diff-head">
                <Text type="secondary">下一轮变量差异</Text>
                <Space wrap>
                  <Tag color={variableGuardState.tagColor}>{variableGuardState.title}</Tag>
                  <Tag color={variableDiffItems.length === 1 ? 'green' : variableDiffItems.length > 1 ? 'orange' : 'default'}>
                    {run ? `${variableDiffItems.length} changes` : 'baseline'}
                  </Tag>
                </Space>
              </div>
              <p className={`mini-gpt-variable-guard ${variableGuardState.status}`}>{variableGuardState.detail}</p>
              {suggestedRunName && (
                <p className="mini-gpt-run-name-suggestion">建议实验名：<code>{suggestedRunName}</code></p>
              )}
              {runNameExists && (
                <div className="mini-gpt-run-name-conflict">
                  <Text type="secondary">实验名已存在，建议改用 <code>{fallbackRunName}</code></Text>
                  <Button size="small" onClick={() => form.setFieldsValue({ ...form.getFieldsValue(), runName: fallbackRunName })}>
                    使用替代名
                  </Button>
                </div>
              )}
              {run && variableDiffItems.length > 1 && (
                <Button size="small" onClick={handleKeepFirstVariableOnly}>
                  只保留第一个变量
                </Button>
              )}
              {run ? (
                variableDiffItems.length ? (
                  <div className="mini-gpt-variable-diff-grid">
                    {variableDiffItems.map(item => (
                      <div key={item.key}>
                        <span>{item.label}</span>
                        <strong>{item.from}</strong>
                        <em>{item.to}</em>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>当前训练表单与最新实验一致。应用一个计划项，或只手动改一个变量再开始下一轮。</p>
                )
              ) : (
                <p>还没有历史实验，当前表单会作为第一个 Tiny 基线。</p>
              )}
            </section>
            <section className="mini-gpt-launch-checklist">
              <div className="mini-gpt-variable-diff-head">
                <Text type="secondary">训练启动检查</Text>
                <Tag color={launchChecklistItems.every(item => item.status === 'PASS') ? 'green' : 'orange'}>
                  {launchChecklistItems.filter(item => item.status === 'PASS').length} / {launchChecklistItems.length}
                </Tag>
              </div>
              <div className="mini-gpt-launch-checklist-grid">
                {launchChecklistItems.map(item => (
                  <div className={item.status.toLowerCase()} key={item.key}>
                    <span>{item.label}</span>
                    <strong>{item.status}</strong>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          </Card>

          <Card className="mini-gpt-panel" title="参数速查">
            <div className="mini-gpt-hparam-grid">
              {hyperparameterGuideRows.map(row => (
                <section className="mini-gpt-hparam-card" key={row.key}>
                  <div>
                    <strong>{row.label}</strong>
                    <span>{row.effect}</span>
                  </div>
                  <p>{row.watch}</p>
                  <em>{row.next}</em>
                </section>
              ))}
            </div>
          </Card>

          <Card
            className="mini-gpt-panel"
            title="语料与 Tokenizer"
            extra={<Button size="small" icon={<ReloadOutlined />} onClick={() => loadCorpusInsight()}>刷新语料</Button>}
          >
            <Spin spinning={corpusLoading}>
              <div className="mini-gpt-tokenizer-grid">
                <div className="mini-gpt-corpus-overview">
                  <section className="mini-gpt-tokenizer-metrics">
                    <div>
                      <span>字符数</span>
                      <strong>{formatInteger(corpusInsight.charCount)}</strong>
                    </div>
                    <div>
                      <span>行数</span>
                      <strong>{formatInteger(corpusInsight.lineCount)}</strong>
                    </div>
                    <div>
                      <span>词表大小</span>
                      <strong>{formatInteger(corpusInsight.vocabSize)}</strong>
                    </div>
                  </section>
                  <section className="mini-gpt-corpus-diagnostics">
                    {corpusDiagnosticItems.map(item => (
                      <div className={item.status} key={item.key}>
                        <div>
                          <Text type="secondary">{item.title}</Text>
                          <Tag>{item.status.toUpperCase()}</Tag>
                        </div>
                        <strong>{item.value}</strong>
                        <p>{item.detail}</p>
                      </div>
                    ))}
                  </section>
                  <div className="mini-gpt-tokenizer-block">
                    <Text type="secondary">语料预览</Text>
                    <pre>{corpusInsight.preview || '暂无语料预览'}</pre>
                  </div>
                  <div className="mini-gpt-tokenizer-block">
                    <Text type="secondary">Encode / Decode</Text>
                    <p className="mini-gpt-tokenizer-sample">{corpusInsight.sampleText || '-'}</p>
                    <pre>{encodedSample.length ? encodedSample.join(', ') : '-'}</pre>
                    <p className="mini-gpt-tokenizer-sample">{corpusInsight.decodedSample || '-'}</p>
                  </div>
                </div>
                <Table
                  rowKey={(record) => String(record.tokenId)}
                  columns={tokenColumns}
                  dataSource={tokenRows}
                  pagination={{ pageSize: 8, showSizeChanger: false }}
                  size="small"
                  scroll={{ x: 320 }}
                />
              </div>
            </Spin>
          </Card>

          <Card className="mini-gpt-panel" title="训练过程解释">
            <div className="mini-gpt-explain-grid">
              <section className="mini-gpt-explain-section">
                <div className="mini-gpt-explain-heading">
                  <Text type="secondary">Batch x / y</Text>
                  <Tag>{batchRows.length} pairs</Tag>
                </div>
                <div className="mini-gpt-batch-rows">
                  {batchRows.length ? batchRows.map(row => (
                    <div className="mini-gpt-batch-row" key={row.position}>
                      <span>{row.position}</span>
                      <code>{row.inputToken}</code>
                      <strong>→</strong>
                      <code>{row.targetToken}</code>
                    </div>
                  )) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无 batch 样例" />
                  )}
                </div>
              </section>

              <section className="mini-gpt-explain-section">
                <div className="mini-gpt-explain-heading">
                  <Text type="secondary">Causal Mask</Text>
                  <Tag>{maskSize}x{maskSize}</Tag>
                </div>
                <div
                  className="mini-gpt-mask-grid"
                  style={{ gridTemplateColumns: `repeat(${maskSize}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: maskSize * maskSize }).map((_, index) => {
                    const row = Math.floor(index / maskSize);
                    const col = index % maskSize;
                    const visible = col <= row;
                    return (
                      <span
                        key={`${row}-${col}`}
                        className={visible ? 'visible' : 'blocked'}
                        title={`query ${row}, key ${col}`}
                      >
                        {visible ? '1' : '0'}
                      </span>
                    );
                  })}
                </div>
              </section>

              <section className="mini-gpt-explain-section mini-gpt-architecture-section">
                <div className="mini-gpt-explain-heading">
                  <Text type="secondary">Model Flow</Text>
                  <Tag>{run?.preset || 'preset'}</Tag>
                </div>
                <div className="mini-gpt-architecture-flow">
                  {architectureStages.map(stage => (
                    <div className="mini-gpt-architecture-node" key={stage.key}>
                      <strong>{stage.label}</strong>
                      <span>{stage.value}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="mini-gpt-shape-grid">
              {shapeRows.map(row => (
                <section className="mini-gpt-shape-card" key={row.key}>
                  <span>{row.label}</span>
                  <strong>{row.shape}</strong>
                  <p>{row.note}</p>
                </section>
              ))}
            </div>

            <div className="mini-gpt-code-map">
              {codeReferenceRows.map(row => (
                <section className="mini-gpt-code-card" key={row.key}>
                  <span>{row.concept}</span>
                  <code>{row.symbol}</code>
                  <p>{row.note}</p>
                  <strong>{row.action}</strong>
                </section>
              ))}
            </div>
          </Card>

          <Card className="mini-gpt-panel" title="学习阶段清单">
            <div className="mini-gpt-learning-grid">
              {milestones.map(item => (
                <section className={`mini-gpt-learning-card ${item.status}`} key={item.key}>
                  <div className="mini-gpt-learning-card-head">
                    <strong>{item.title}</strong>
                    <Tag color={item.status === 'done' ? 'success' : item.status === 'active' ? 'processing' : 'default'}>
                      {item.status === 'done' ? '完成' : item.status === 'active' ? '进行中' : '待开始'}
                    </Tag>
                  </div>
                  <p>{item.target}</p>
                  <span>{item.evidence}</span>
                </section>
              ))}
            </div>
          </Card>

          <Card className="mini-gpt-panel" title="复盘问题">
            <ol className="mini-gpt-review-list">
              {reviewQuestionItems.map(question => (
                <li key={question}>{question}</li>
              ))}
            </ol>
          </Card>

          <Card className="mini-gpt-panel" title="下一步实验建议">
            <div className="mini-gpt-next-actions">
              {nextActionItems.map(item => (
                <section key={item.key}>
                  <Text type="secondary">{item.reason}</Text>
                  <strong>{item.title}</strong>
                  <p>{item.action}</p>
                  <Button size="small" onClick={() => handleAddPlan(item)}>
                    加入计划
                  </Button>
                </section>
              ))}
            </div>
          </Card>

          <Card
            className="mini-gpt-panel"
            title="实验计划队列"
            extra={(
              <Button size="small" onClick={handleClearPlans} disabled={!plannedExperiments.length}>
                清空计划
              </Button>
            )}
          >
            {plannedExperiments.length ? (
              <div className="mini-gpt-plan-list">
                {plannedExperiments.map(item => (
                  <section key={item.id}>
                    <div>
                      <strong>{item.title}</strong>
                      {item.sourceRun && <Tag>{item.sourceRun}</Tag>}
                    </div>
                    <Text type="secondary">{item.reason}</Text>
                    <p>{item.action}</p>
                    {item.formValues && (
                      <code>{formatPlannedValues(item.formValues)}</code>
                    )}
                    <Space wrap>
                      <Button size="small" onClick={() => handleApplyPlanToForm(item)} disabled={!item.formValues}>
                        应用到表单
                      </Button>
                      <Button size="small" onClick={() => handleRemovePlan(item.id)}>
                        完成/移除
                      </Button>
                    </Space>
                  </section>
                ))}
              </div>
            ) : (
              <Empty description="从下一步建议加入计划，本机自动保存" />
            )}
          </Card>

          {!run ? (
            <Alert
              type="info"
              showIcon
              icon={<DatabaseOutlined />}
              message="暂无 MiniGPT Mongo 数据"
              description="可以直接使用上方训练控制启动一次 tiny 训练；完成后这里会显示实验、loss 曲线和生成样例。"
            />
          ) : (
            <>
            <section className="mini-gpt-summary-band">
              <div>
                <Text type="secondary">当前实验</Text>
                <h2>{run.runName}</h2>
                <Space wrap>
                  <Tag color={statusColor(run.status)}>{run.status || 'UNKNOWN'}</Tag>
                  {run.preset && <Tag color="cyan">{run.preset}</Tag>}
                  {run.validationEnabled !== undefined && (
                    <Tag color={run.validationEnabled ? 'green' : 'orange'}>
                      validation={String(run.validationEnabled)}
                    </Tag>
                  )}
                  {run.parentRunName && <Tag color="purple">parent={run.parentRunName}</Tag>}
                  {run.trainStep !== undefined && <Tag color="blue">train_step={formatInteger(run.trainStep)}</Tag>}
                </Space>
              </div>
              <div className="mini-gpt-time-stack">
                <span>{formatTime(run.startedAt)}</span>
                <strong>{formatTime(run.finishedAt)}</strong>
              </div>
            </section>

            <section className="mini-gpt-metric-grid">
              {metricItems(run, logs).map(item => (
                <div className="mini-gpt-metric" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </section>

            <section className="mini-gpt-diagnostic-grid">
              {lossDiagnosticItems.map(item => (
                <div className={item.status === 'PASS' ? 'pass' : 'watch'} key={item.key}>
                  <span>{item.title}</span>
                  <strong>{item.value}</strong>
                  <p>{item.detail}</p>
                </div>
              ))}
            </section>

            <Card
              className="mini-gpt-panel"
              title="实验对比与笔记"
              extra={(
                <Button size="small" icon={<CopyOutlined />} onClick={handleCopyReport} disabled={!run}>
                  复制报告
                </Button>
              )}
            >
              <div className="mini-gpt-comparison-grid">
                <section className="mini-gpt-comparison-chart-panel">
                  <div className="mini-gpt-comparison-toolbar">
                    <Text type="secondary">对比实验</Text>
                    <Select
                      mode="multiple"
                      placeholder="选择最多 4 个实验"
                      value={comparisonRunNames}
                      options={runs.map(item => ({
                        value: item.runName,
                        label: item.runName
                      }))}
                      onChange={(values) => loadComparisonLogs(values.slice(0, 4))}
                      loading={comparisonLoading}
                      maxTagCount="responsive"
                    />
                  </div>
                  {Object.keys(comparisonLogs).length ? (
                    <>
                      <ReactECharts option={comparisonChartOption} className="mini-gpt-comparison-chart" notMerge />
                      <section className="mini-gpt-comparison-summary">
                        {comparisonSummary.map(item => (
                          <div key={item.runName}>
                            <span>{item.runName}</span>
                            <strong>{item.verdict}</strong>
                            <dl>
                              <dt>step</dt>
                              <dd>{item.step}</dd>
                              <dt>train</dt>
                              <dd>{item.trainLoss}</dd>
                              <dt>eval</dt>
                              <dd>{item.evalLoss}</dd>
                              <dt>gap</dt>
                              <dd>{item.gap}</dd>
                            </dl>
                          </div>
                        ))}
                      </section>
                    </>
                  ) : (
                    <Empty description="暂无可对比的训练日志" />
                  )}
                </section>

                <Form
                  form={noteForm}
                  layout="vertical"
                  className="mini-gpt-note-form"
                  onFinish={handleSaveNotes}
                >
                  <section className="mini-gpt-review-draft-sources">
                    {reviewDraftSourceItems.map(item => (
                      <div key={item.key}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </section>
                  <section className="mini-gpt-review-quality">
                    {reviewQualityCheckItems.map(item => (
                      <div className={item.status.toLowerCase()} key={item.key}>
                        <span>{item.label}</span>
                        <strong>{item.status}</strong>
                        <p>{item.detail}</p>
                      </div>
                    ))}
                  </section>
                  <Form.Item name="hypothesis" label="训练假设">
                    <Input.TextArea rows={3} placeholder="例如：更小学习率会降低 eval loss 抖动" />
                  </Form.Item>
                  <Form.Item name="observation" label="观察记录">
                    <Input.TextArea rows={3} placeholder="记录 loss、样例输出、过拟合迹象" />
                  </Form.Item>
                  <Form.Item name="conclusion" label="阶段结论">
                    <Input.TextArea rows={3} placeholder="这次实验说明了什么" />
                  </Form.Item>
                  <Form.Item name="nextStep" label="下一步">
                    <Input.TextArea rows={2} placeholder="下一次要调整的参数或语料" />
                  </Form.Item>
                  <Space wrap>
                    <Button onClick={handleDraftReviewNotes} disabled={!run?.runName}>
                      生成复盘草稿
                    </Button>
                    <Button type="primary" htmlType="submit" loading={savingNotes} disabled={!run?.runName}>
                      保存笔记
                    </Button>
                  </Space>
                </Form>
              </div>
            </Card>

            <section className="mini-gpt-main-grid">
              <Card className="mini-gpt-panel" title="Loss 曲线">
                {trainingStatus.runName && (
                  <section className="mini-gpt-live-loss">
                    <div>
                      <span>运行实验</span>
                      <strong>{trainingStatus.runName}</strong>
                    </div>
                    <div>
                      <span>当前 Step</span>
                      <strong>{formatInteger(trainingStatus.processedStep)} / {formatInteger(trainingStatus.totalSteps)}</strong>
                    </div>
                    <div>
                      <span>Train Loss</span>
                      <strong>{formatLoss(latestStatusLog?.trainLoss ?? logs[logs.length - 1]?.trainLoss)}</strong>
                    </div>
                    <div>
                      <span>Eval Loss</span>
                      <strong>{formatLoss(latestStatusLog?.evalLoss ?? logs[logs.length - 1]?.evalLoss)}</strong>
                    </div>
                  </section>
                )}
                {logs.length ? (
                  <ReactECharts option={chartOption} className="mini-gpt-chart" notMerge />
                ) : (
                  <Empty description={trainingStatus.running ? '等待第一条 loss 日志' : '训练日志不足'} />
                )}
              </Card>

              <Card className="mini-gpt-panel" title="生成试验台">
                <section className="mini-gpt-prompt-presets">
                  {promptPresetRows.map(preset => (
                    <button
                      type="button"
                      key={preset.key}
                      onClick={() => handleApplyPromptPreset(preset)}
                    >
                      <div>
                        <BulbOutlined />
                        <strong>{preset.title}</strong>
                      </div>
                      <span>{preset.intent}</span>
                      <code>temp={preset.temperature} / topK={preset.topK}</code>
                    </button>
                  ))}
                </section>
                <Form
                  form={generationForm}
                  layout="vertical"
                  className="mini-gpt-generation-form"
                  onFinish={handleGenerate}
                >
                  <Form.Item name="prompt" label="Prompt">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <div className="mini-gpt-generation-controls">
                    <Form.Item name="maxNewTokens" label="Tokens">
                      <InputNumber min={1} max={500} />
                    </Form.Item>
                    <Form.Item name="temperature" label="Temp">
                      <InputNumber min={0.1} max={2} step={0.1} />
                    </Form.Item>
                    <Form.Item name="topK" label="Top-K">
                      <InputNumber min={1} max={200} />
                    </Form.Item>
                    <Space wrap className="mini-gpt-generation-buttons">
                      <Button type="primary" htmlType="submit" loading={generating} disabled={!run?.checkpoint}>
                        生成
                      </Button>
                      <Button loading={comparingGeneration} disabled={!run?.checkpoint} onClick={handleCompareGeneration}>
                        参数对比
                      </Button>
                    </Space>
                  </div>
                </Form>
                <div className="mini-gpt-generation-result">
                  <Text type="secondary">
                    {generationResult?.elapsedMillis !== undefined
                      ? `${generationResult.runName || run.runName} · ${generationResult.elapsedMillis}ms`
                      : '当前 checkpoint 生成结果'}
                  </Text>
                  <pre className="mini-gpt-sample">
                    {generationResult?.generatedText || sample || '暂无生成样例'}
                  </pre>
                  <section className="mini-gpt-generation-diagnostics">
                    {generationDiagnosticItems.map(item => (
                      <div className={item.status} key={item.key}>
                        <span>{item.title}</span>
                        <strong>{item.value}</strong>
                        <p>{item.detail}</p>
                      </div>
                    ))}
                  </section>
                  {selectedGenerationRank && (
                    <section className="mini-gpt-generation-cockpit">
                      <div className="mini-gpt-generation-best">
                        <div>
                          <Text type="secondary">当前最佳输出</Text>
                          <strong>{selectedGenerationRank.candidateText}</strong>
                        </div>
                        <Tag color={selectedGenerationRank.status === 'VALID' ? 'green' : selectedGenerationRank.status === 'REPAIR' ? 'orange' : 'blue'}>
                          {selectedGenerationRank.score} pts
                        </Tag>
                        <p>{selectedGenerationRank.summary}</p>
                        <dl>
                          <div>
                            <dt>Temp</dt>
                            <dd>{selectedGenerationRank.result.temperature ?? '-'}</dd>
                          </div>
                          <div>
                            <dt>Top-K</dt>
                            <dd>{selectedGenerationRank.result.topK ?? '-'}</dd>
                          </div>
                          <div>
                            <dt>重复</dt>
                            <dd>{selectedGenerationRank.repeatPenalty}%</dd>
                          </div>
                        </dl>
                      </div>
                      <ReactECharts option={generationRadarOption} className="mini-gpt-generation-radar" notMerge />
                    </section>
                  )}
                  {generationTokenTrace.length > 0 && (
                    <section className="mini-gpt-token-replay">
                      <div className="mini-gpt-lottery-candidate-head">
                        <Text type="secondary">Token 回放</Text>
                        <Space wrap>
                          <Tag color="blue">prompt</Tag>
                          <Tag color="green">generated</Tag>
                          <Tag>{generationTokenTrace.length} chars</Tag>
                        </Space>
                      </div>
                      <div className="mini-gpt-token-replay-grid">
                        {generationTokenTrace.map(item => (
                          <button
                            type="button"
                            key={item.key}
                            className={[
                              item.role,
                              item.isRepeated ? 'repeated' : '',
                              item.key === selectedTraceToken?.key ? 'active' : ''
                            ].filter(Boolean).join(' ')}
                            title={`#${item.index} U+${item.codePoint.toString(16).toUpperCase()}`}
                            onClick={() => setSelectedTraceTokenKey(item.key)}
                          >
                            {item.display}
                          </button>
                        ))}
                      </div>
                      {selectedTraceToken && (
                        <div className="mini-gpt-token-replay-detail">
                          <div>
                            <span>位置</span>
                            <strong>#{selectedTraceToken.index}</strong>
                          </div>
                          <div>
                            <span>来源</span>
                            <strong>{selectedTraceToken.role === 'prompt' ? 'Prompt' : '模型生成'}</strong>
                          </div>
                          <div>
                            <span>Code Point</span>
                            <strong>U+{selectedTraceToken.codePoint.toString(16).toUpperCase()}</strong>
                          </div>
                          <div>
                            <span>重复计数</span>
                            <strong>{selectedTraceToken.localRepeatCount}</strong>
                          </div>
                        </div>
                      )}
                    </section>
                  )}
                  <section className="mini-gpt-lottery-candidate-check">
                    <div className="mini-gpt-lottery-candidate-head">
                      <Text type="secondary">双色球候选校验</Text>
                      <Tag color={lotteryCandidateStatusColor(lotteryCandidate?.status)}>
                        {lotteryCandidate?.status || 'WAITING'}
                      </Tag>
                    </div>
                    {lotteryCandidate?.parseable ? (
                      <>
                        <div className="mini-gpt-lottery-balls">
                          {(lotteryCandidate.redNumbers || []).map((ball, index) => (
                            <span className="red" key={`${ball}-${index}`}>{ball}</span>
                          ))}
                          <span className="blue">{lotteryCandidate.blueNumber || '--'}</span>
                        </div>
                        <div className="mini-gpt-lottery-candidate-metrics">
                          <div>
                            <span>红球数</span>
                            <strong>{lotteryCandidate.redCount ?? '-'}</strong>
                          </div>
                          <div>
                            <span>和值</span>
                            <strong>{lotteryCandidate.redSum ?? '-'}</strong>
                          </div>
                          <div>
                            <span>跨度</span>
                            <strong>{lotteryCandidate.span ?? '-'}</strong>
                          </div>
                          <div>
                            <span>奇偶</span>
                            <strong>{lotteryCandidate.oddCount ?? '-'} / {lotteryCandidate.evenCount ?? '-'}</strong>
                          </div>
                        </div>
                        {lotteryCandidate.issues?.length ? (
                          <ul>
                            {lotteryCandidate.issues.map(issue => (
                              <li key={issue}>{issue}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>候选满足基础合规约束，可以进入候选池或回测。</p>
                        )}
                        {(lotteryCandidate.repairedRedNumbers?.length || lotteryCandidate.repairedBlueNumber) && !lotteryCandidate.valid && (
                          <p>
                            修复参考：
                            <code>{lotteryCandidate.repairedRedNumbers?.join(' ') || '--'} + {lotteryCandidate.repairedBlueNumber || '--'}</code>
                          </p>
                        )}
                      </>
                    ) : (
                      <p>生成一段包含 6 个红球和 1 个蓝球的文本后，这里会解析并检查基础约束。</p>
                    )}
                  </section>
                  {decisionCandidateSelections.length > 0 && (
                    <section className="mini-gpt-candidate-set-save">
                      <div>
                        <Text type="secondary">候选池草稿</Text>
                        <strong>{decisionCandidateSelections.length} 注可保存</strong>
                      </div>
                      <Button
                        icon={<SaveOutlined />}
                        loading={savingCandidateSet}
                        onClick={handleSaveCandidateSet}
                      >
                        保存到决策集
                      </Button>
                      <Button
                        loading={runningCandidateBacktest}
                        disabled={!savedCandidateSet?.id}
                        onClick={handleRunCandidateBacktest}
                      >
                        立即回测
                      </Button>
                    </section>
                  )}
                  {candidateBacktest && (
                    <section className="mini-gpt-candidate-backtest">
                      <div className="mini-gpt-lottery-candidate-head">
                        <Text type="secondary">候选池历史回测</Text>
                        <Tag>{candidateBacktest.replayCount || 0} rows</Tag>
                      </div>
                      <div className="mini-gpt-candidate-backtest-grid">
                        <div>
                          <span>平均红球</span>
                          <strong>{candidateBacktest.averageRedHits ?? '-'}</strong>
                          <em>随机 {candidateBacktest.baselineAverageRedHits ?? '-'}</em>
                        </div>
                        <div>
                          <span>蓝球命中率</span>
                          <strong>{candidateBacktest.blueHitRate ?? '-'}%</strong>
                          <em>随机 {candidateBacktest.baselineBlueHitRate ?? '-'}%</em>
                        </div>
                        <div>
                          <span>净结果</span>
                          <strong>{candidateBacktest.netResult ?? '-'}</strong>
                          <em>成本 {candidateBacktest.totalCost ?? '-'}</em>
                        </div>
                        <div>
                          <span>奖级分布</span>
                          <strong>{Object.entries(candidateBacktest.prizeDistribution || {}).slice(0, 2).map(([key, value]) => `${key}:${value}`).join(' / ') || '-'}</strong>
                          <em>历史窗口表现</em>
                        </div>
                      </div>
                      <div className="mini-gpt-candidate-backtest-actions">
                        <Button size="small" icon={<BarChartOutlined />} onClick={openCandidateBacktestDetail}>
                          回测详情
                        </Button>
                        <Button size="small" icon={<BarChartOutlined />} onClick={openCandidateBacktestResearch}>
                          研究对比
                        </Button>
                        <Button size="small" icon={<BookOutlined />} onClick={openCandidateBacktestNotebook}>
                          挂到笔记
                        </Button>
                        <Button size="small" icon={<DownloadOutlined />} onClick={openCandidateBacktestExport}>
                          导出证据
                        </Button>
                      </div>
                    </section>
                  )}
                  {generationComparisons.length > 0 && (
                    <section className="mini-gpt-generation-comparison">
                      <div className="mini-gpt-lottery-candidate-head">
                        <Text type="secondary">采样参数对比</Text>
                        <Tag>{generationComparisons.length} runs</Tag>
                      </div>
                      {generationRankRows.length > 0 && (
                        <div className="mini-gpt-generation-rank-list">
                          {generationRankRows.map(item => (
                            <button
                              type="button"
                              key={item.key}
                              className={item.key === selectedGenerationRank?.key ? 'active' : ''}
                              onClick={() => {
                                setSelectedGenerationKey(item.key);
                                setGenerationResult(item.result);
                              }}
                            >
                              <TrophyOutlined />
                              <span>#{item.index + 1}</span>
                              <strong>{item.score}</strong>
                              <em>{item.candidateText}</em>
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="mini-gpt-generation-comparison-grid">
                        {generationComparisons.map((item, index) => (
                          <article key={`${item.temperature}-${item.topK}-${index}`}>
                            <div>
                              <strong>temp={item.temperature ?? '-'}</strong>
                              <Tag color={lotteryCandidateStatusColor(item.lotteryCandidate?.status)}>
                                {item.lotteryCandidate?.status || 'CHECK'}
                              </Tag>
                            </div>
                            <span>topK={item.topK ?? '-'} · {item.elapsedMillis ?? '-'}ms</span>
                            {item.lotteryCandidate?.parseable ? (
                              <p>
                                {(item.lotteryCandidate.redNumbers || []).join(' ')}
                                {' + '}
                                {item.lotteryCandidate.blueNumber || '--'}
                              </p>
                            ) : (
                              <p>未解析到完整候选号码</p>
                            )}
                            <pre>{item.generatedText || '-'}</pre>
                          </article>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </Card>
            </section>

            <section className="mini-gpt-main-grid">
              <Card className="mini-gpt-panel" title="实验配置">
                <dl className="mini-gpt-config-list">
                  {configEntries(run).map(([key, value]) => (
                    <div key={key}>
                      <dt>{key}</dt>
                      <dd>{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </Card>

              <Card className="mini-gpt-panel" title="历史实验">
                <div className="mini-gpt-run-list">
                  {runs.map(item => (
                    <button
                      type="button"
                      key={item.runName}
                      className={item.runName === run.runName ? 'active' : ''}
                      onClick={() => item.runName && loadDashboard(item.runName)}
                    >
                      <span>{item.runName}</span>
                      <strong>{formatLoss(item.finalEvalLoss)}</strong>
                    </button>
                  ))}
                </div>
              </Card>
            </section>

            <Card className="mini-gpt-panel" title="训练日志">
              <Table
                rowKey={(record) => `${record.runName}-${record.step}`}
                columns={columns}
                dataSource={logs}
                pagination={{ pageSize: 8, showSizeChanger: false }}
                scroll={{ x: 820 }}
              />
            </Card>
            </>
          )}
        </div>
      </Spin>
    </LifePageShell>
  );
};

export default MiniGptLearningPage;
