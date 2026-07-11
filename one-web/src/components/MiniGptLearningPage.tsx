import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AutoComplete, Button, Card, Empty, Form, Input, InputNumber, Progress, Segmented, Select, Space, Spin, Table, Tag, Typography, message } from 'antd';
import { BarChartOutlined, BookOutlined, BulbOutlined, CloseCircleOutlined, CopyOutlined, DatabaseOutlined, DownloadOutlined, PlayCircleOutlined, ReloadOutlined, SaveOutlined, TrophyOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import LifePageShell from './LifePageShell';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
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

const qualityGateStatusColor = (status?: string) => {
  if (status === 'PASS') return 'green';
  if (status === 'FAILED') return 'red';
  if (status === 'NOT_CONFIGURED') return 'default';
  return 'orange';
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

const comparisonSummaryItems = (comparisonLogs: Record<string, MiniGptTrainingLogRecord[]>, isEnglish = false) => (
  Object.entries(comparisonLogs).map(([runName, logs]) => {
    const latestLog = logs[logs.length - 1];
    const trainLoss = latestLog?.trainLoss;
    const evalLoss = latestLog?.evalLoss;
    const gap = Number.isFinite(evalLoss) && Number.isFinite(trainLoss)
      ? Number(evalLoss) - Number(trainLoss)
      : undefined;
    const verdict = !latestLog
      ? (isEnglish ? 'No logs' : '暂无日志')
      : Number.isFinite(gap) && Math.abs(Number(gap)) > 0.5
        ? (isEnglish ? 'Large gap' : 'gap 偏大')
        : Number.isFinite(evalLoss)
          ? (isEnglish ? 'Eval comparable' : '验证可比')
          : (isEnglish ? 'Train loss only' : '仅训练 loss');

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

const trainingRecipeEnglish: Record<string, Pick<MiniGptTrainingRecipe, 'title' | 'description'>> = {
  'tiny-baseline': {
    title: 'Tiny Baseline',
    description: 'Run the smallest model first to verify corpus, loss, and generation flow.'
  },
  'low-lr': {
    title: 'Low Learning Rate',
    description: 'Check whether loss gets smoother and training slows down.'
  },
  'long-context': {
    title: 'Long Context',
    description: 'Increase block size to see whether the model uses longer context.'
  },
  'small-model': {
    title: 'Small Comparison',
    description: 'Increase model capacity and compare generalization gap and sample quality against tiny.'
  }
};

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

const hyperparameterGuideEnglish: Record<string, { effect: string; watch: string; next: string }> = {
  'learning-rate': {
    effect: 'step size',
    watch: 'too high can oscillate; too low descends slowly',
    next: 'lower one level when loss jitters'
  },
  'batch-size': {
    effect: 'samples seen per step',
    watch: 'larger is steadier but uses more memory',
    next: 'increase moderately when loss is noisy'
  },
  'block-size': {
    effect: 'context length',
    watch: 'longer sees farther but trains slower',
    next: 'try longer context when generation breaks'
  },
  'n-embd': {
    effect: 'token vector width',
    watch: 'larger has more capacity and overfits more easily',
    next: 'increase only when samples feel too weak'
  },
  'n-head': {
    effect: 'attention perspectives',
    watch: 'must divide embedding size',
    next: 'adjust together when scaling the model'
  },
  'n-layer': {
    effect: 'Transformer depth',
    watch: 'deeper is more expressive but harder to train',
    next: 'increase after tiny is stable'
  },
  temperature: {
    effect: 'generation randomness',
    watch: 'higher diverges more; lower is more conservative',
    next: 'raise when repetitive, lower when off-topic'
  },
  'top-k': {
    effect: 'sampling candidate range',
    watch: 'smaller is steadier; larger is more diverse',
    next: 'compare 10, 20, and 50 first'
  }
};

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

const promptPresetEnglish: Record<string, { title: string; intent: string; prompt?: string }> = {
  'lottery-balanced': {
    title: 'Balanced Picks',
    intent: 'Observe whether the model can output structured candidates'
  },
  'lottery-risk': {
    title: 'Explore Diversity',
    intent: 'Test candidate diversity under higher randomness'
  },
  'explain-mini-gpt': {
    title: 'Concept Probe',
    intent: 'Check whether the training corpus style was learned',
    prompt: 'language model'
  },
  'low-temperature': {
    title: 'Conservative Draft',
    intent: 'Reduce repetition and off-topic drift'
  }
};

const localizedPromptPresetRows = (isEnglish = false) => (
  promptPresetRows.map(preset => ({
    ...preset,
    ...(isEnglish ? promptPresetEnglish[preset.key] : undefined)
  }))
);

const qualityGateDisplay = (status?: string) => {
  if (!status) return '-';
  if (status === 'NOT_CONFIGURED') return 'Not Configured';
  return status.replaceAll('_', ' ');
};

const metricItems = (run?: MiniGptRunRecord, logs: MiniGptTrainingLogRecord[] = []) => {
  const latestLog = logs[logs.length - 1];
  return [
    { label: 'Step', value: formatInteger(latestLog?.step ?? run?.maxSteps) },
    { label: 'Train Loss', value: formatLoss(run?.finalTrainLoss ?? latestLog?.trainLoss) },
    { label: 'Eval Loss', value: formatLoss(run?.finalEvalLoss ?? latestLog?.evalLoss) },
    { label: 'Gap', value: formatLoss(run?.lossGap) },
    { label: 'Fixed Eval', value: formatLoss(run?.fixedEvalLoss) },
    { label: 'Gate', value: qualityGateDisplay(run?.qualityGateStatus) },
    { label: 'Train Tokens', value: formatInteger(run?.trainTokens) },
    { label: 'Eval Tokens', value: formatInteger(run?.evalTokens) }
  ];
};

const lossDiagnostics = (run?: MiniGptRunRecord, logs: MiniGptTrainingLogRecord[] = [], isEnglish = false) => {
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
      title: isEnglish ? 'Downtrend' : '下降趋势',
      status: Number.isFinite(improved) && Number(improved) > 0 ? 'PASS' : 'WATCH',
      value: Number.isFinite(improved) ? formatLoss(improved) : '-',
      detail: Number.isFinite(improved) && Number(improved) > 0
        ? (isEnglish ? 'eval loss is lower than the first point' : 'eval loss 比开头更低')
        : (isEnglish ? 'Not enough logs or no clear decrease' : '日志不足或下降不明显')
    },
    {
      key: 'gap',
      title: isEnglish ? 'Generalization Gap' : '泛化差距',
      status: Number.isFinite(gap) && Math.abs(Number(gap)) <= 0.5 ? 'PASS' : 'WATCH',
      value: formatLoss(gap),
      detail: Number.isFinite(gap) && Math.abs(Number(gap)) <= 0.5
        ? (isEnglish ? 'train/eval are close for now' : 'train/eval 暂时接近')
        : (isEnglish ? 'Watch overfitting or validation distribution shift' : '注意过拟合或验证集分布差异')
    },
    {
      key: 'validation',
      title: isEnglish ? 'Validation Set' : '验证集',
      status: run?.validationEnabled ? 'PASS' : 'WATCH',
      value: run?.validationEnabled ? 'on' : 'off',
      detail: run?.validationEnabled
        ? (isEnglish ? 'Generalization can be observed' : '可以观察泛化')
        : (isEnglish ? 'May be disabled when corpus is too short' : '语料太短时可能关闭')
    }
  ];
};

const corpusDiagnostics = (corpusInsight?: MiniGptCorpusInsight, isEnglish = false) => {
  const charCount = corpusInsight?.charCount || 0;
  const lineCount = corpusInsight?.lineCount || 0;
  const vocabSize = corpusInsight?.vocabSize || 0;
  const encodedLength = corpusInsight?.encodedSample?.length || 0;
  const charsPerLine = lineCount > 0 ? charCount / lineCount : 0;
  const vocabDensity = charCount > 0 ? vocabSize / charCount : 0;

  return [
    {
      key: 'scale',
      title: isEnglish ? 'Corpus Size' : '语料规模',
      status: charCount >= 1000 ? 'pass' : charCount >= 200 ? 'watch' : 'todo',
      value: formatInteger(charCount),
      detail: charCount >= 1000
        ? (isEnglish ? 'Enough for a small baseline' : '足够做小基线')
        : (isEnglish ? 'Add at least 1,000 characters before judging loss' : '先补到 1000 字以上再观察 loss')
    },
    {
      key: 'line-density',
      title: isEnglish ? 'Line Density' : '行密度',
      status: charsPerLine >= 12 ? 'pass' : lineCount > 0 ? 'watch' : 'todo',
      value: lineCount > 0 ? charsPerLine.toFixed(1) : '-',
      detail: charsPerLine >= 12
        ? (isEnglish ? 'Sentence context is reasonably complete' : '句子上下文较完整')
        : (isEnglish ? 'Short lines weaken context learning' : '行太短会削弱上下文学习')
    },
    {
      key: 'vocab-density',
      title: isEnglish ? 'Vocabulary Density' : '词表密度',
      status: vocabDensity > 0 && vocabDensity <= 0.35 ? 'pass' : vocabDensity > 0 ? 'watch' : 'todo',
      value: vocabDensity > 0 ? `${(vocabDensity * 100).toFixed(1)}%` : '-',
      detail: vocabDensity > 0 && vocabDensity <= 0.35
        ? (isEnglish ? 'Characters are reused well' : '字符复用较好')
        : (isEnglish ? 'Rare characters need more data' : '生僻字符多时需要更多数据')
    },
    {
      key: 'sample-encode',
      title: isEnglish ? 'Sample Encoding' : '样例编码',
      status: encodedLength >= 8 ? 'pass' : encodedLength > 1 ? 'watch' : 'todo',
      value: encodedLength ? `${encodedLength} tokens` : '-',
      detail: encodedLength >= 8
        ? (isEnglish ? 'Good enough to inspect the x/y shift' : '可以检查 x/y 平移')
        : (isEnglish ? 'Sample is too short for a clear batch explanation' : '样例太短，batch 解释不明显')
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
  generationResult?: MiniGptGenerationResult,
  isEnglish = false
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
      title: isEnglish ? 'Output Length' : '输出长度',
      status: outputLength >= 60 ? 'pass' : outputLength > 0 ? 'watch' : 'todo',
      value: outputLength ? `${outputLength} chars` : '-',
      detail: outputLength >= 60
        ? (isEnglish ? 'Long enough to review style' : '样例足够复盘风格')
        : (isEnglish ? 'If too short, increase tokens or check the checkpoint' : '太短时先增加 tokens 或检查 checkpoint')
    },
    {
      key: 'repeat',
      title: isEnglish ? 'Repetition' : '重复程度',
      status: outputLength === 0 ? 'todo' : repeatRatio <= 0.08 ? 'pass' : repeatRatio <= 0.18 ? 'watch' : 'todo',
      value: outputLength ? `${(repeatRatio * 100).toFixed(1)}%` : '-',
      detail: repeatRatio <= 0.08
        ? (isEnglish ? 'Low consecutive repetition' : '连续重复较少')
        : (isEnglish ? 'When repetition is high, lower temperature or add corpus text' : '重复高时调低温度或增加语料')
    },
    {
      key: 'prompt',
      title: isEnglish ? 'Prompt Continuity' : 'Prompt 延续',
      status: outputLength === 0 ? 'todo' : continuedPrompt ? 'pass' : 'watch',
      value: prompt ? (continuedPrompt ? 'matched' : 'check') : '-',
      detail: prompt
        ? (isEnglish ? 'Confirm generation continues the prompt' : '确认生成是否接住提示词')
        : (isEnglish ? 'Use a fixed sampling prompt during training' : '训练时建议固定采样提示')
    },
    {
      key: 'latency',
      title: isEnglish ? 'Sampling Latency' : '采样耗时',
      status: elapsedMillis === undefined ? 'watch' : elapsedMillis <= 3000 ? 'pass' : 'watch',
      value: elapsedMillis === undefined ? '-' : `${elapsedMillis}ms`,
      detail: elapsedMillis === undefined
        ? (isEnglish ? 'Historical log samples have no latency' : '历史日志样例无耗时')
        : (isEnglish ? 'Compare sampling parameters on the same checkpoint' : '同一 checkpoint 可对比采样参数')
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

type LabSectionKey = 'training' | 'corpus' | 'explain' | 'review' | 'generate' | 'records';

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

const normalizeTrainingData = (value?: string) => (value || 'data/sample.txt').trim() || 'data/sample.txt';

const groupRunsByData = (runs: MiniGptRunRecord[]) => {
  const groups = new Map<string, MiniGptRunRecord[]>();
  runs.forEach(item => {
    const dataKey = normalizeTrainingData(item.data);
    groups.set(dataKey, [...(groups.get(dataKey) || []), item]);
  });
  return Array.from(groups.entries()).map(([data, items]) => ({ data, items }));
};

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

const resultCandidateText = (result: MiniGptGenerationResult, isEnglish = false) => {
  const candidate = result.lotteryCandidate;
  if (!candidate?.parseable) return isEnglish ? 'Unparsed' : '未解析';
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

const generationRankItems = (results: MiniGptGenerationResult[], isEnglish = false): GenerationRankItem[] => (
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
        ? (isEnglish ? 'Number structure is valid and can enter the candidate pool' : '号码结构合规，可进入候选池')
        : candidate?.parseable
          ? (isEnglish ? 'Numbers are parseable, but need rule-based repair' : '能解析号码，但需要按规则修复')
          : repeat > 0.16
            ? (isEnglish ? 'Text repetition is high; lower temperature is a better fit' : '文本重复偏高，适合降低温度')
            : (isEnglish ? 'Better suited for text-style observation' : '更适合做文本风格观察');
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
        candidateText: resultCandidateText(result, isEnglish)
      };
    })
    .sort((left, right) => right.score - left.score)
);

const buildGenerationRadarOption = (item?: GenerationRankItem, isEnglish = false) => ({
  color: ['#00c7be'],
  tooltip: {},
  radar: {
    radius: '68%',
    indicator: [
      { name: isEnglish ? 'Structure' : '结构', max: 100 },
      { name: isEnglish ? 'Validity' : '合规', max: 100 },
      { name: isEnglish ? 'Diversity' : '多样', max: 100 },
      { name: isEnglish ? 'Speed' : '速度', max: 100 },
      { name: isEnglish ? 'Low Repeat' : '低重复', max: 100 }
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
    evalData: run.evalData,
    qualityGateMaxEvalLoss: run.qualityGateMaxEvalLoss,
    qualityGateMaxLossGap: run.qualityGateMaxLossGap,
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
  values: MiniGptTrainingRequest = {},
  isEnglish = false
): ExperimentVariableDiff[] => {
  const rows: Array<[keyof MiniGptTrainingRequest, string, unknown]> = [
    ['preset', isEnglish ? 'Preset' : '预设', run?.preset],
    ['resumeFromRun', isEnglish ? 'Resume Source' : '续训来源', run?.parentRunName],
    ['data', isEnglish ? 'Corpus' : '语料', run?.data],
    ['evalData', isEnglish ? 'Fixed Eval Set' : '固定评估集', run?.evalData],
    ['qualityGateMaxEvalLoss', isEnglish ? 'Eval Gate' : 'Eval 门禁', run?.qualityGateMaxEvalLoss],
    ['qualityGateMaxLossGap', isEnglish ? 'Gap Gate' : 'Gap 门禁', run?.qualityGateMaxLossGap],
    ['maxSteps', isEnglish ? 'Steps' : '步数', run?.maxSteps],
    ['batchSize', 'Batch Size', run?.batchSize],
    ['learningRate', 'Learning Rate', run?.learningRate],
    ['blockSize', 'Block Size', configNumber(run, 'block_size')],
    ['nEmbd', 'Embedding', configNumber(run, 'n_embd')],
    ['nHead', 'Heads', configNumber(run, 'n_head')],
    ['nLayer', 'Layers', configNumber(run, 'n_layer')],
    ['valRatio', isEnglish ? 'Validation Ratio' : '验证比例', run?.valRatio],
    ['samplePrompt', isEnglish ? 'Sample Prompt' : '采样提示', run?.samplePrompt],
    ['sampleTokens', isEnglish ? 'Sample Tokens' : '采样长度', run?.sampleTokens],
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

const variableGuard = (run: MiniGptRunRecord | undefined, diffs: ExperimentVariableDiff[], isEnglish = false) => {
  if (!run) {
    return {
      status: 'baseline',
      tagColor: 'blue',
      title: isEnglish ? 'Baseline Run' : '基线实验',
      detail: isEnglish ? 'This is the first run. Verify the training flow and sample output first.' : '这是第一轮实验，先确认训练链路和样例输出。'
    };
  }
  if (diffs.length === 0) {
    return {
      status: 'idle',
      tagColor: 'default',
      title: isEnglish ? 'No Variable Selected' : '未选择变量',
      detail: isEnglish ? 'The current form matches the latest run. Apply a plan item or change one variable manually.' : '当前表单与最新实验一致，建议先应用一个计划项或手动改一个变量。'
    };
  }
  if (diffs.length === 1) {
    return {
      status: 'ready',
      tagColor: 'green',
      title: isEnglish ? 'Single Variable Ready' : '单变量就绪',
      detail: isEnglish ? `Only ${diffs[0].label} changes in this run. Good for a controlled comparison.` : `本轮只改变 ${diffs[0].label}，适合做对照实验。`
    };
  }
  return {
    status: 'multi',
    tagColor: 'orange',
    title: isEnglish ? 'Multiple Changes' : '多变量变更',
    detail: isEnglish ? `${diffs.length} variables changed at once, which makes conclusions harder to attribute.` : `当前同时改变 ${diffs.length} 个变量，结论可能难以归因。`
  };
};

const launchChecklist = (
  run: MiniGptRunRecord | undefined,
  corpusItems: ReturnType<typeof corpusDiagnostics>,
  variableState: ReturnType<typeof variableGuard>,
  hasRunNameConflict: boolean,
  plannedExperiments: PlannedExperiment[],
  isEnglish = false
): LaunchChecklistItem[] => {
  const corpusReady = corpusItems.find(item => item.key === 'scale')?.status === 'pass';
  return [
    {
      key: 'corpus',
      label: isEnglish ? 'Corpus' : '语料',
      status: corpusReady ? 'PASS' : 'WATCH',
      detail: corpusReady ? (isEnglish ? 'Corpus is large enough for a small baseline' : '语料规模足够做小基线') : (isEnglish ? 'Corpus is short; add text or lower expectations first' : '语料较短，建议先补文本或降低预期')
    },
    {
      key: 'variable',
      label: isEnglish ? 'Variable' : '变量',
      status: variableState.status === 'ready' || variableState.status === 'baseline' ? 'PASS' : variableState.status === 'multi' ? 'WATCH' : 'TODO',
      detail: variableState.detail
    },
    {
      key: 'run-name',
      label: isEnglish ? 'Run Name' : '实验名',
      status: hasRunNameConflict ? 'WATCH' : 'PASS',
      detail: hasRunNameConflict ? (isEnglish ? 'Run name already exists; use the alternative first' : '实验名已存在，先使用替代名') : (isEnglish ? 'Run name does not conflict with loaded history' : '实验名不会和已加载历史 run 冲突')
    },
    {
      key: 'plan',
      label: isEnglish ? 'Plan' : '计划',
      status: plannedExperiments.length ? 'PASS' : 'WATCH',
      detail: plannedExperiments.length ? (isEnglish ? `${plannedExperiments.length} planned experiments queued` : `已有 ${plannedExperiments.length} 个待做实验`) : (isEnglish ? 'Add items from next suggestions to the plan' : '可从下一步建议加入计划')
    },
    {
      key: 'review',
      label: isEnglish ? 'Review' : '复盘',
      status: run?.hypothesis || run?.conclusion ? 'PASS' : run ? 'WATCH' : 'TODO',
      detail: run ? (isEnglish ? 'Keep the previous hypothesis/conclusion before starting the next run' : '建议保留上一轮假设/结论，再启动下一轮') : (isEnglish ? 'Write a review after the first run completes' : '首轮实验完成后补复盘')
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
  generationResult?: MiniGptGenerationResult,
  isEnglish = false
): NextExperimentAction[] => {
  if (!run) {
    return [
      {
        key: 'start-baseline',
        title: isEnglish ? 'Run Tiny Baseline First' : '先跑 Tiny 基线',
        reason: isEnglish ? 'No Mongo run yet. Confirm training, logs, checkpoints, and generation all close the loop.' : '还没有 Mongo run，先确认训练、日志、checkpoint、生成链路都能闭环。',
        action: isEnglish ? 'Use the Tiny baseline template and train for 200 steps.' : '使用 Tiny 基线模板，训练 200 step。',
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
      title: isEnglish ? 'Expand Corpus First' : '先扩充语料',
      reason: isEnglish ? `Only ${formatInteger(charCount)} characters are available, so loss and generation quality are easily dominated by small-sample noise.` : `当前只有 ${formatInteger(charCount)} 字，loss 和生成质量容易被小样本噪声主导。`,
      action: isEnglish ? 'Replace data/sample.txt with longer, more consistent text, then repeat the Tiny baseline.' : '把 data/sample.txt 替换为更长、更统一风格的文本，再重复 Tiny 基线。'
    });
  }

  if (run.validationEnabled === false) {
    actions.push({
      key: 'enable-validation',
      title: isEnglish ? 'Restore Validation Set' : '恢复验证集',
      reason: isEnglish ? 'Without a validation set, you only see fit on training text and cannot judge generalization well.' : '没有验证集时只能看到训练文本上的拟合，难以判断泛化。',
      action: isEnglish ? 'Add corpus text or lower valRatio, then retrain until eval loss is recorded reliably.' : '增加语料或调低 valRatio 后重训，直到 eval loss 可稳定记录。',
      formValues: {
        valRatio: 0.1
      }
    });
  }

  if (Number.isFinite(run.lossGap) && Math.abs(run.lossGap || 0) > 0.5) {
    actions.push({
      key: 'gap-control',
      title: isEnglish ? 'Control Generalization Gap' : '控制泛化差距',
      reason: isEnglish ? `Current loss gap=${formatLoss(run.lossGap)}, so train and eval behavior have separated.` : `当前 loss gap=${formatLoss(run.lossGap)}，训练和验证表现已经分开。`,
      action: isEnglish ? 'Prioritize more data; if data stays fixed, lower max steps or model size for comparison.' : '优先增加数据；若数据暂时不变，就降低 max steps 或模型尺寸做对照。',
      formValues: {
        maxSteps: Math.max(80, Math.floor((run.maxSteps || 200) * 0.7))
      }
    });
  }

  if (logs.length >= 2 && Number.isFinite(trainLoss) && Number.isFinite(evalLoss) && Number(evalLoss) > Number(trainLoss) + 0.2) {
    actions.push({
      key: 'regularize',
      title: isEnglish ? 'Run Conservative Training Control' : '做保守训练对照',
      reason: isEnglish ? 'Eval loss is clearly higher than train loss, so the model may be memorizing training text.' : 'eval loss 明显高于 train loss，模型可能更会背训练文本。',
      action: isEnglish ? 'Copy the current run and only lower learning rate one level or reduce training steps.' : '复制当前实验，只把 learning rate 降低一档或减少训练步数。',
      formValues: {
        learningRate: Number(((run.learningRate || 0.0003) * 0.5).toPrecision(3)),
        maxSteps: Math.max(80, Math.floor((run.maxSteps || 200) * 0.8))
      }
    });
  }

  if (!sampleText) {
    actions.push({
      key: 'generate-sample',
      title: isEnglish ? 'Generate One Sample' : '补一次生成样例',
      reason: isEnglish ? 'Without generated text, loss only describes optimization, not output behavior.' : '没有生成文本时，loss 只能说明优化过程，不能说明输出行为。',
      action: isEnglish ? 'Generate once with a fixed prompt and write the result into observation notes.' : '使用固定 Prompt 生成一次，并把结果写入观察笔记。'
    });
  } else if (repeatRatio > 0.12) {
    actions.push({
      key: 'reduce-repeat',
      title: isEnglish ? 'Reduce Repetition' : '降低重复输出',
      reason: isEnglish ? `Consecutive repetition is about ${(repeatRatio * 100).toFixed(1)}%, suggesting local loops in generation.` : `连续重复比例约 ${(repeatRatio * 100).toFixed(1)}%，生成可能在局部循环。`,
      action: isEnglish ? 'First compare with lower temperature/top-k; if repetition remains, add corpus text or reduce steps.' : '先用更低 temperature/top-k 对比；若仍重复，再补语料或减少训练步数。',
      formValues: {
        temperature: 0.7,
        topK: 20
      }
    });
  }

  if (!run.hypothesis || !run.conclusion) {
    actions.push({
      key: 'write-notes',
      title: isEnglish ? 'Complete Experiment Notes' : '补齐实验笔记',
      reason: isEnglish ? 'When hypothesis and conclusion are missing, the next run easily changes multiple variables at once.' : '假设和结论缺失时，下一个实验很容易同时改多个变量。',
      action: isEnglish ? 'Write one hypothesis, one observation, and one conclusion, then continue with only one variable.' : '写一句假设、一句观察、一句结论，再只选择一个变量继续。'
    });
  }

  actions.push({
    key: 'one-variable',
    title: isEnglish ? 'Change Only One Variable Next' : '下一轮只改一个变量',
    reason: isEnglish ? 'Single-variable controls make it easiest to see the effect of learning rate, block size, model capacity, or sampling parameters.' : '单变量对照最容易看清 learning rate、block size、模型容量或采样参数的影响。',
    action: isEnglish ? 'Choose one from Low Learning Rate, Long Context, or Small Comparison, then compare curves with the current run.' : '从低学习率、长上下文、Small 对照里选一个，和当前 run 做曲线对比。',
    formValues: {
      learningRate: 0.0001
    }
  });

  return actions.slice(0, 5);
};

const localizePlannedExperiment = (item: PlannedExperiment, isEnglish = false): PlannedExperiment => {
  if (!isEnglish) return item;
  const localized = nextExperimentActions(undefined, [], undefined, undefined, true)
    .find(action => action.key === item.key)
    || nextExperimentActions({
      runName: item.sourceRun || 'current',
      status: 'SUCCESS',
      validationEnabled: false,
      maxSteps: item.formValues?.maxSteps,
      learningRate: item.formValues?.learningRate
    }, [], { charCount: 222 } as MiniGptCorpusInsight, undefined, true).find(action => action.key === item.key);

  return localized ? { ...item, title: localized.title, reason: localized.reason, action: localized.action } : item;
};

const configEntries = (run?: MiniGptRunRecord): [string, string][] => {
  const config = run?.config || {};
  return [
    ['preset', run?.preset],
    ['device', run?.device],
    ['data', run?.data],
    ['checkpoint', run?.checkpoint],
    ['eval_data', run?.evalData],
    ['started_at', run?.startedAt],
    ['finished_at', run?.finishedAt],
    ['max_steps', run?.maxSteps],
    ['batch_size', run?.batchSize],
    ['learning_rate', run?.learningRate],
    ['val_ratio', run?.valRatio],
    ['validation_enabled', run?.validationEnabled === undefined ? undefined : String(run.validationEnabled)],
    ['sample_prompt', run?.samplePrompt],
    ['sample_tokens', run?.sampleTokens],
    ['fixed_eval_loss', run?.fixedEvalLoss],
    ['quality_gate_status', run?.qualityGateStatus],
    ['quality_gate_reasons', run?.qualityGateReasons],
    ['quality_gate_max_eval_loss', run?.qualityGateMaxEvalLoss],
    ['quality_gate_max_loss_gap', run?.qualityGateMaxLossGap],
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
  encodedSample: number[],
  isEnglish = false
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
      note: isEnglish ? 'Input tokens and next-token targets' : '输入 token 与下一个 token 目标'
    },
    {
      key: 'embedding',
      label: 'token + position',
      shape: `[${batch}, ${block}, ${embedding}]`,
      note: isEnglish ? 'Discrete tokens enter a continuous vector space' : '离散 token 进入连续向量空间'
    },
    {
      key: 'attention',
      label: 'attention scores',
      shape: `[${batch}, ${heads}, ${block}, ${block}]`,
      note: isEnglish ? 'Each position scores previous positions' : '每个位置对历史位置打分'
    },
    {
      key: 'logits',
      label: 'logits',
      shape: `[${batch}, ${block}, ${vocab}]`,
      note: isEnglish ? 'Each position predicts a vocabulary distribution' : '每个位置预测词表分布'
    },
    {
      key: 'loss',
      label: 'cross entropy',
      shape: `[${Number.isFinite(Number(batch)) && Number.isFinite(Number(block)) ? Number(batch) * Number(block) : 'B*T'}, ${vocab}]`,
      note: isEnglish ? 'Flattened before computing next-token loss' : '展平后计算 next-token loss'
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

const localizedCodeReferenceRows = (isEnglish = false) => {
  if (!isEnglish) return codeReferenceRows;
  return codeReferenceRows.map(row => ({
    ...row,
    ...(row.key === 'tokenizer' ? {
      note: 'Convert between characters and token ids',
      action: 'After replacing the corpus, check whether vocab changes'
    } : {}),
    ...(row.key === 'batch' ? {
      note: 'Build x/y next-token samples',
      action: 'Confirm y is exactly one position after x'
    } : {}),
    ...(row.key === 'attention' ? {
      note: 'Mask, Q/K/V, and attention weights',
      action: 'Compare the mask to verify future tokens are blocked'
    } : {}),
    ...(row.key === 'block' ? {
      note: 'Attention, MLP, residuals, and layer norm',
      action: 'Trace tensor shapes before and after residual connections'
    } : {}),
    ...(row.key === 'model' ? {
      note: 'Embeddings, blocks, logits, and loss',
      action: 'Confirm the last logits dimension equals vocab size'
    } : {}),
    ...(row.key === 'train' ? {
      note: 'AdamW, eval, checkpoint, and logs',
      action: 'Compare train/eval loss and generated samples'
    } : {}),
    ...(row.key === 'generate' ? {
      note: 'Temperature, top-k, and sampling',
      action: 'Compare sampling parameters with the same prompt'
    } : {})
  }));
};

type LearningMilestoneStatus = 'done' | 'active' | 'todo';

const learningMilestones = (
  run: MiniGptRunRecord | undefined,
  logs: MiniGptTrainingLogRecord[],
  corpusInsight: MiniGptCorpusInsight | undefined,
  isEnglish = false
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
      target: isEnglish ? 'Understand how characters map to token ids' : '理解字符如何映射为 token id',
      evidence: hasCorpus ? `vocab=${formatInteger(corpusInsight?.vocabSize)}` : (isEnglish ? 'Waiting for corpus' : '等待语料'),
      status: status(hasCorpus, !hasCorpus)
    },
    {
      key: 'batch',
      title: 'Batch',
      target: isEnglish ? 'Verify x/y are shifted by one token for next-token targets' : '看清 x/y 错位一位的 next-token 目标',
      evidence: hasBatch ? `${Math.max(0, (corpusInsight?.encodedSample?.length || 1) - 1)} pairs` : (isEnglish ? 'Waiting for sample' : '等待样例'),
      status: status(hasBatch, hasCorpus)
    },
    {
      key: 'attention',
      title: 'Causal Attention',
      target: isEnglish ? 'Confirm each position can only see historical tokens' : '确认当前位置只能看见历史 token',
      evidence: hasBatch ? `${buildMaskSize(run, corpusInsight?.encodedSample || [])}x mask` : (isEnglish ? 'Waiting for batch' : '等待 batch'),
      status: status(hasBatch && hasTraining, hasBatch)
    },
    {
      key: 'loss',
      title: 'Loss',
      target: isEnglish ? 'Compare whether train/eval loss fall together' : '比较 train/eval loss 是否一起下降',
      evidence: hasEval ? `eval=${formatLoss(run?.finalEvalLoss ?? logs[logs.length - 1]?.evalLoss)}` : (isEnglish ? 'Waiting for eval' : '等待验证'),
      status: status(hasEnoughLogs && hasEval, hasTraining)
    },
    {
      key: 'sample',
      title: 'Generate',
      target: isEnglish ? 'Watch whether generated text becomes less repetitive and more corpus-like' : '观察生成文本是否从重复变得更像语料',
      evidence: hasSample ? (isEnglish ? 'Sample available' : '已有样例') : (isEnglish ? 'Waiting for sampling' : '等待采样'),
      status: status(hasSample, hasEnoughLogs)
    },
    {
      key: 'review',
      title: 'Review',
      target: isEnglish ? 'Write the hypothesis, observations, conclusion, and next step' : '写下假设、观察、结论和下一步',
      evidence: hasNotes ? (isEnglish ? 'Notes available' : '已有笔记') : isFinished ? (isEnglish ? 'Needs review' : '待复盘') : (isEnglish ? 'Waiting for run to finish' : '等待实验结束'),
      status: status(hasNotes, isFinished)
    }
  ];
};

const reviewQuestions = (
  run: MiniGptRunRecord | undefined,
  logs: MiniGptTrainingLogRecord[],
  generationResult?: MiniGptGenerationResult,
  isEnglish = false
) => {
  if (!run) {
    return isEnglish ? [
      'Run a Tiny baseline first: can the corpus be read and does the tokenizer match expectations?',
      'Do the training logs record both train/eval loss?',
      'Does the generated sample show any shadow of the corpus style?'
    ] : [
      '先跑一次 Tiny 基线：语料能否被读取、tokenizer 是否符合预期？',
      '训练日志里 train/eval loss 是否都有记录？',
      '生成样例是否能看出语料风格的影子？'
    ];
  }
  const latestLog = logs[logs.length - 1];
  const questions = isEnglish ? [
    `What is the goal of this ${run.preset || 'custom'} run, and which single variable changed from the previous run?`,
    `At the final step, train=${formatLoss(run.finalTrainLoss ?? latestLog?.trainLoss)} and eval=${formatLoss(run.finalEvalLoss ?? latestLog?.evalLoss)}. Is the trend falling steadily?`
  ] : [
    `本次 ${run.preset || 'custom'} 实验的目标是什么，和上一个实验只改了哪个变量？`,
    `最后一步 train=${formatLoss(run.finalTrainLoss ?? latestLog?.trainLoss)}、eval=${formatLoss(run.finalEvalLoss ?? latestLog?.evalLoss)}，趋势是否稳定下降？`
  ];
  if (run.validationEnabled === false) {
    questions.push(isEnglish ? 'Validation is disabled: is the corpus too short, or is valRatio unsuitable?' : '验证集没有启用：是语料太短，还是 valRatio 设置不合适？');
  }
  if (Number.isFinite(run.lossGap) && Math.abs(run.lossGap || 0) > 0.5) {
    questions.push(isEnglish ? `The generalization gap ${formatLoss(run.lossGap)} is large: is the model memorizing training text, or is the validation distribution different?` : `泛化差距 ${formatLoss(run.lossGap)} 偏大：模型是在记忆训练文本，还是验证集分布不同？`);
  }
  if (!latestSample(logs) && !generationResult?.generatedText) {
    questions.push(isEnglish ? 'No generated sample yet: was the checkpoint saved successfully, and is the sampling prompt inside the vocabulary?' : '还没有生成样例：当前 checkpoint 是否保存成功，采样 prompt 是否在词表内？');
  } else {
    questions.push(isEnglish ? 'What is the most obvious issue in the generated text: repetition, off-topic drift, punctuation noise, or broken context?' : '生成文本里最明显的问题是什么：重复、跑题、标点混乱，还是上下文断裂？');
  }
  if (!run.conclusion) {
    questions.push(isEnglish ? 'What single conclusion can this run support, and should the next run change learning rate, context length, or model capacity?' : '这次实验能形成哪一句结论，下一次要改学习率、上下文长度还是模型容量？');
  }
  return questions.slice(0, 6);
};

const buildReviewDraft = (
  run: MiniGptRunRecord | undefined,
  logs: MiniGptTrainingLogRecord[],
  variableDiffs: ExperimentVariableDiff[],
  checklistItems: LaunchChecklistItem[],
  actionItems: NextExperimentAction[],
  generationResult?: MiniGptGenerationResult,
  isEnglish = false
): MiniGptRunNoteRequest => {
  const latestLog = logs[logs.length - 1];
  const primaryDiff = variableDiffs[0];
  const sampleText = generationResult?.generatedText || latestSample(logs);
  const watchItems = checklistItems.filter(item => item.status !== 'PASS').map(item => item.label).join(isEnglish ? ', ' : '、') || (isEnglish ? 'no obvious risk' : '暂无明显风险');
  const nextAction = actionItems[0];

  return {
    hypothesis: primaryDiff
      ? (isEnglish ? `If only ${primaryDiff.label} changes (${primaryDiff.from} -> ${primaryDiff.to}), its effect on eval loss and generated samples should be easier to observe.` : `如果只调整 ${primaryDiff.label}（${primaryDiff.from} -> ${primaryDiff.to}），应该能更清楚地观察它对 eval loss 和生成样例的影响。`)
      : (isEnglish ? `Use this ${run?.preset || 'MiniGPT'} run as an observation baseline to confirm the training path, loss logs, and generated samples are stable.` : `本次 ${run?.preset || 'MiniGPT'} 实验先作为观察基线，确认训练链路、loss 记录和生成样例是否稳定。`),
    observation: isEnglish
      ? `Current train=${formatLoss(run?.finalTrainLoss ?? latestLog?.trainLoss)}, eval=${formatLoss(run?.finalEvalLoss ?? latestLog?.evalLoss)}; launch-check risks: ${watchItems}; generated sample is ${sampleText ? 'available for review' : 'missing and needs one sampling run'}.`
      : `当前 train=${formatLoss(run?.finalTrainLoss ?? latestLog?.trainLoss)}，eval=${formatLoss(run?.finalEvalLoss ?? latestLog?.evalLoss)}；启动检查风险：${watchItems}；生成样例${sampleText ? '已有可复盘输出' : '暂缺，需要补一次采样'}。`,
    conclusion: run?.lossGap !== undefined
      ? (isEnglish ? `Current loss gap=${formatLoss(run.lossGap)}; use it as the main signal for overfitting and validation-set differences.` : `当前 loss gap=${formatLoss(run.lossGap)}，先把它作为判断过拟合和验证集差异的主要信号。`)
      : (isEnglish ? 'The logs are not enough for a strong conclusion yet; keep this in watch state.' : '当前日志还不足以下强结论，先保留为待观察状态。'),
    nextStep: nextAction ? `${nextAction.title}: ${nextAction.action}` : (isEnglish ? 'Keep the next run as a single-variable control and add a generated sample.' : '下一轮保持单变量对照，并补齐生成样例。')
  };
};

const reviewDraftSources = (
  run: MiniGptRunRecord | undefined,
  logs: MiniGptTrainingLogRecord[],
  variableDiffs: ExperimentVariableDiff[],
  checklistItems: LaunchChecklistItem[],
  actionItems: NextExperimentAction[],
  generationResult?: MiniGptGenerationResult,
  isEnglish = false
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
      label: isEnglish ? 'Variable' : '变量',
      value: variableDiffs[0] ? `${variableDiffs[0].label}: ${variableDiffs[0].from} -> ${variableDiffs[0].to}` : (isEnglish ? 'No variable diff' : '暂无变量差异')
    },
    {
      key: 'checklist',
      label: isEnglish ? 'Launch Check' : '启动检查',
      value: watchCount ? (isEnglish ? `${watchCount} items need attention` : `${watchCount} 项需注意`) : (isEnglish ? 'All passed' : '全部通过')
    },
    {
      key: 'sample',
      label: isEnglish ? 'Sample' : '生成样例',
      value: sampleText ? (isEnglish ? 'Output available' : '已有输出') : (isEnglish ? 'No sample yet' : '暂缺采样')
    },
    {
      key: 'next',
      label: isEnglish ? 'Next Step' : '下一步',
      value: actionItems[0]?.title || (isEnglish ? 'No suggestion' : '暂无建议')
    }
  ];
};

const reviewQualityItems = (values: MiniGptRunNoteRequest = {}, isEnglish = false): ReviewQualityItem[] => {
  const rows: Array<[keyof MiniGptRunNoteRequest, string, string]> = [
    ['hypothesis', isEnglish ? 'Hypothesis' : '假设', isEnglish ? 'Explain what this run is testing' : '说明本轮实验要验证什么'],
    ['observation', isEnglish ? 'Observation' : '观察', isEnglish ? 'Record loss, samples, or abnormal behavior' : '记录 loss、样例或异常现象'],
    ['conclusion', isEnglish ? 'Conclusion' : '结论', isEnglish ? 'State what is and is not confirmed' : '写出当前能确认和不能确认的判断'],
    ['nextStep', isEnglish ? 'Next Step' : '下一步', isEnglish ? 'Specify which single variable changes next' : '明确下一轮只改哪个变量']
  ];

  return rows.map(([key, label, hint]) => {
    const length = (values[key] || '').trim().length;
    return {
      key,
      label,
      status: length >= 18 ? 'PASS' : length > 0 ? 'WATCH' : 'TODO',
      detail: length >= 18
        ? (isEnglish ? 'Enough detail for review' : '内容足够复盘')
        : length > 0
          ? (isEnglish ? 'Add one more concrete detail' : '再补一点具体依据')
          : hint
    };
  });
};

const MiniGptLearningPage = () => {
  const navigate = useNavigate();
  const { isEnglish } = useAppPreferences();
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
  const [activeLabSection, setActiveLabSection] = useState<LabSectionKey>('training');
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
  const text = useMemo(() => ({
    title: isEnglish ? 'MiniGPT Learning Lab' : 'MiniGPT 学习实验',
    selectRun: isEnglish ? 'Select run' : '选择实验',
    refresh: isEnglish ? 'Refresh' : '刷新',
    sections: [
      { label: isEnglish ? 'Training' : '训练', value: 'training' as LabSectionKey },
      { label: isEnglish ? 'Corpus' : '语料', value: 'corpus' as LabSectionKey },
      { label: isEnglish ? 'Explain' : '解释', value: 'explain' as LabSectionKey },
      { label: isEnglish ? 'Review' : '复盘', value: 'review' as LabSectionKey },
      { label: isEnglish ? 'Generate' : '生成', value: 'generate' as LabSectionKey },
      { label: isEnglish ? 'Records' : '记录', value: 'records' as LabSectionKey }
    ],
    trainingControl: isEnglish ? 'Training Control' : '训练控制',
    chooseCorpus: isEnglish ? 'Choose Corpus' : '选择语料',
    chooseCorpusDesc: isEnglish ? 'Pick training data first. Resume sources are limited to checkpoints from the same corpus.' : '先确定训练数据，续训来源会只保留同一语料的 checkpoint。',
    trainingData: isEnglish ? 'Training Corpus' : '训练语料',
    trainingDataPlaceholder: isEnglish ? 'Select or enter a corpus path' : '选择或输入语料路径',
    evalData: isEnglish ? 'Fixed Eval Set' : '固定评估集',
    evalDataPlaceholder: isEnglish ? 'For example, data/eval.txt' : '例如 data/eval.txt',
    lotteryCorpus: isEnglish ? 'Lottery Training Corpus' : '双色球训练语料',
    drawFormat: isEnglish ? 'Draw Format' : '开奖格式',
    structuredFeatures: isEnglish ? 'Structured Features' : '结构特征',
    strategySamples: isEnglish ? 'Strategy Samples' : '策略样本',
    periods: isEnglish ? 'draws' : '期',
    lotteryCorpusDesc: isEnglish ? 'Export MiniGPT training text from Mongo lottery records and fill the corpus path automatically.' : '从 Mongo 开奖记录导出 MiniGPT 训练文本，并自动填入语料路径。',
    corpusVersion: isEnglish ? 'Corpus Version' : '语料版本',
    timeSplit: isEnglish ? 'Chronological 80/20 Split' : '时间顺序 80/20 切分',
    trainSplit: isEnglish ? 'Train' : '训练集',
    validationSplit: isEnglish ? 'Validation' : '验证集',
    manifest: isEnglish ? 'Manifest' : '清单',
    exported: isEnglish ? 'Exported' : '已导出',
    lotteryCorpusExportSuccess: (count: number) => isEnglish
      ? `Exported ${count} lottery draws`
      : `已导出 ${count} 期双色球语料`,
    lotteryCorpusExportFailed: isEnglish ? 'Lottery corpus export failed' : '双色球语料导出失败',
    setupTraining: isEnglish ? 'Configure Training' : '设置训练',
    setupTrainingDesc: isEnglish ? 'After choosing the corpus, configure preset, run name, resume source, and training parameters.' : '语料确定后，再配置预设、实验名、续训来源和训练参数。',
    preset: isEnglish ? 'Preset' : '预设',
    runName: isEnglish ? 'Run Name' : '实验名',
    autoNamePlaceholder: isEnglish ? 'Leave blank to auto-generate' : '留空自动生成',
    name: isEnglish ? 'Name' : '命名',
    resumeSource: isEnglish ? 'Resume Source' : '续训来源',
    resumeSourcePlaceholder: isEnglish ? 'Only same-corpus checkpoints are shown' : '仅显示同语料 checkpoint',
    maxSteps: isEnglish ? 'Steps' : '步数',
    valRatio: isEnglish ? 'Validation Ratio' : '验证比例',
    samplePrompt: isEnglish ? 'Sample Prompt' : '采样提示',
    sampleTokens: isEnglish ? 'Sample Tokens' : '采样长度',
    evalGate: isEnglish ? 'Eval Gate' : 'Eval 门禁',
    gapGate: isEnglish ? 'Gap Gate' : 'Gap 门禁',
    startTraining: isEnglish ? 'Start Training' : '开始训练',
    cancel: isEnglish ? 'Cancel' : '取消',
    idle: isEnglish ? 'Idle' : '空闲',
    noRunningTraining: isEnglish ? 'No running MiniGPT training' : '暂无运行中的 MiniGPT 训练',
    currentStep: isEnglish ? 'Current Step' : '当前 Step',
    latestLoss: isEnglish ? 'Latest Loss' : '最近 Loss',
    updatedAt: isEnglish ? 'Updated At' : '更新时间',
    environment: isEnglish ? 'Training Environment' : '训练环境',
    check: isEnglish ? 'Check' : '检查',
    available: isEnglish ? 'Available' : '可用',
    unknown: isEnglish ? 'Unknown' : '未确认',
    unavailable: isEnglish ? 'Unavailable' : '不可用',
    envDesc: isEnglish ? 'Check the dependency path for Python writing directly to Mongo.' : '检查 Python 直接写 Mongo 的依赖链路',
    nextDiff: isEnglish ? 'Next Run Variable Diff' : '下一轮变量差异',
    suggestedRunName: isEnglish ? 'Suggested run name:' : '建议实验名：',
    runNameExists: isEnglish ? 'Run name already exists. Suggested alternative:' : '实验名已存在，建议改用',
    useAlternative: isEnglish ? 'Use Alternative' : '使用替代名',
    keepFirstVariable: isEnglish ? 'Keep First Variable Only' : '只保留第一个变量',
    unchangedForm: isEnglish ? 'The current training form matches the latest run. Apply a plan item or change one variable manually before the next run.' : '当前训练表单与最新实验一致。应用一个计划项，或只手动改一个变量再开始下一轮。',
    firstBaseline: isEnglish ? 'No historical runs yet. The current form will be the first Tiny baseline.' : '还没有历史实验，当前表单会作为第一个 Tiny 基线。',
    launchChecklist: isEnglish ? 'Training Launch Checklist' : '训练启动检查',
    hparamQuickRef: isEnglish ? 'Parameter Quick Reference' : '参数速查',
    corpusTokenizer: isEnglish ? 'Corpus and Tokenizer' : '语料与 Tokenizer',
    refreshCorpus: isEnglish ? 'Refresh Corpus' : '刷新语料',
    charCount: isEnglish ? 'Characters' : '字符数',
    lineCount: isEnglish ? 'Lines' : '行数',
    vocabSize: isEnglish ? 'Vocabulary Size' : '词表大小',
    corpusPreview: isEnglish ? 'Corpus Preview' : '语料预览',
    noCorpusPreview: isEnglish ? 'No corpus preview' : '暂无语料预览',
    processExplain: isEnglish ? 'Training Process Explanation' : '训练过程解释',
    batchEmpty: isEnglish ? 'No batch sample' : '暂无 batch 样例',
    learningChecklist: isEnglish ? 'Learning Stage Checklist' : '学习阶段清单',
    reviewQuestions: isEnglish ? 'Review Questions' : '复盘问题',
    nextSuggestions: isEnglish ? 'Next Experiment Suggestions' : '下一步实验建议',
    addToPlan: isEnglish ? 'Add to Plan' : '加入计划',
    planQueue: isEnglish ? 'Experiment Plan Queue' : '实验计划队列',
    clearPlan: isEnglish ? 'Clear Plan' : '清空计划',
    applyToForm: isEnglish ? 'Apply to Form' : '应用到表单',
    doneRemove: isEnglish ? 'Done / Remove' : '完成/移除',
    emptyPlan: isEnglish ? 'Add items from next suggestions. Saved locally on this device.' : '从下一步建议加入计划，本机自动保存',
    noMongoData: isEnglish ? 'No MiniGPT Mongo Data' : '暂无 MiniGPT Mongo 数据',
    noMongoDesc: isEnglish ? 'Start a tiny training run from the training control above. Completed runs will show experiments, loss curves, and samples here.' : '可以直接使用上方训练控制启动一次 tiny 训练；完成后这里会显示实验、loss 曲线和生成样例。',
    currentRun: isEnglish ? 'Current Run' : '当前实验',
    compareNotes: isEnglish ? 'Experiment Comparison and Notes' : '实验对比与笔记',
    copyReport: isEnglish ? 'Copy Report' : '复制报告',
    compareRuns: isEnglish ? 'Compare Runs' : '对比实验',
    compareRunsPlaceholder: isEnglish ? 'Select up to 4 runs' : '选择最多 4 个实验',
    noCompareLogs: isEnglish ? 'No comparable training logs' : '暂无可对比的训练日志',
    hypothesis: isEnglish ? 'Training Hypothesis' : '训练假设',
    hypothesisPlaceholder: isEnglish ? 'Example: lower learning rate reduces eval loss jitter' : '例如：更小学习率会降低 eval loss 抖动',
    observation: isEnglish ? 'Observation' : '观察记录',
    observationPlaceholder: isEnglish ? 'Record loss, sample output, or overfitting signals' : '记录 loss、样例输出、过拟合迹象',
    conclusion: isEnglish ? 'Conclusion' : '阶段结论',
    conclusionPlaceholder: isEnglish ? 'What this run shows' : '这次实验说明了什么',
    nextStep: isEnglish ? 'Next Step' : '下一步',
    nextStepPlaceholder: isEnglish ? 'The next parameter or corpus change' : '下一次要调整的参数或语料',
    generateReviewDraft: isEnglish ? 'Generate Review Draft' : '生成复盘草稿',
    saveNotes: isEnglish ? 'Save Notes' : '保存笔记',
    lossCurve: isEnglish ? 'Loss Curve' : 'Loss 曲线',
    runningRun: isEnglish ? 'Running Run' : '运行实验',
    waitingLoss: isEnglish ? 'Waiting for the first loss log' : '等待第一条 loss 日志',
    insufficientLogs: isEnglish ? 'Insufficient training logs' : '训练日志不足',
    generationLab: isEnglish ? 'Generation Lab' : '生成试验台',
    defaultPrompt: isEnglish ? 'language model' : '语言模型',
    generate: isEnglish ? 'Generate' : '生成',
    compareParams: isEnglish ? 'Parameter Compare' : '参数对比',
    currentCheckpointOutput: isEnglish ? 'Current checkpoint output' : '当前 checkpoint 生成结果',
    noGeneratedSample: isEnglish ? 'No generated sample' : '暂无生成样例',
    currentBestOutput: isEnglish ? 'Current Best Output' : '当前最佳输出',
    points: isEnglish ? 'pts' : '分',
    repeat: isEnglish ? 'Repeat' : '重复',
    tokenReplay: isEnglish ? 'Token Replay' : 'Token 回放',
    position: isEnglish ? 'Position' : '位置',
    source: isEnglish ? 'Source' : '来源',
    modelGenerated: isEnglish ? 'Model Generated' : '模型生成',
    lotteryCandidateCheck: isEnglish ? 'Lottery Candidate Check' : '双色球候选校验',
    redCount: isEnglish ? 'Red Count' : '红球数',
    redSum: isEnglish ? 'Red Sum' : '和值',
    span: isEnglish ? 'Span' : '跨度',
    oddEven: isEnglish ? 'Odd / Even' : '奇偶',
    candidateValid: isEnglish ? 'Candidate satisfies baseline constraints and can enter the pool or backtest.' : '候选满足基础合规约束，可以进入候选池或回测。',
    repairReference: isEnglish ? 'Repair reference:' : '修复参考：',
    lotteryCandidateWaiting: isEnglish ? 'After generating text with 6 red balls and 1 blue ball, this panel parses and checks baseline constraints.' : '生成一段包含 6 个红球和 1 个蓝球的文本后，这里会解析并检查基础约束。',
    incompleteCandidate: isEnglish ? 'No complete candidate numbers parsed' : '未解析到完整候选号码',
    config: isEnglish ? 'Run Configuration' : '实验配置',
    history: isEnglish ? 'Historical Runs' : '历史实验',
    trainingLogs: isEnglish ? 'Training Logs' : '训练日志'
  }), [isEnglish]);
  const displayTrainingRecipes = useMemo(() => (
    trainingRecipes.map(recipe => ({
      ...recipe,
      ...(isEnglish ? trainingRecipeEnglish[recipe.key] : undefined)
    }))
  ), [isEnglish]);
  const displayHyperparameterGuideRows = useMemo(() => (
    hyperparameterGuideRows.map(row => ({
      ...row,
      ...(isEnglish ? hyperparameterGuideEnglish[row.key] : undefined)
    }))
  ), [isEnglish]);
  const environmentMessage = useMemo(() => {
    const messageText = environmentCheck.message;
    if (!messageText) return text.envDesc;
    if (!isEnglish) return messageText;
    if (messageText.includes('Python 可以直接写 Mongo')) {
      return 'Python can write directly to Mongo';
    }
    return messageText;
  }, [environmentCheck.message, isEnglish, text.envDesc]);
  const trainingStageText = useMemo(() => {
    const stage = trainingStatus.stage;
    if (!stage) return text.idle;
    if (!isEnglish) return stage;
    const stageMap: Record<string, string> = {
      空闲: 'Idle',
      运行中: 'Running',
      训练中: 'Training',
      已完成: 'Completed',
      已失败: 'Failed',
      已取消: 'Cancelled',
      取消中: 'Cancelling'
    };
    return stageMap[stage] || stage;
  }, [isEnglish, text.idle, trainingStatus.stage]);
  const trainingStatusMessage = useMemo(() => {
    const statusMessage = trainingStatus.message;
    if (!statusMessage) return text.noRunningTraining;
    if (!isEnglish) return statusMessage;
    if (statusMessage.includes('暂无运行中的 MiniGPT 训练')) {
      return text.noRunningTraining;
    }
    if (statusMessage.includes('已发送取消请求')) {
      return 'Cancel request sent';
    }
    return statusMessage;
  }, [isEnglish, text.noRunningTraining, trainingStatus.message]);

  const labSectionClass = useCallback((section: LabSectionKey) => (
    `mini-gpt-lab-section ${activeLabSection === section ? 'active' : ''}`
  ), [activeLabSection]);

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

  const handleExportLotteryCorpus = useCallback(async (format: 'raw' | 'features' | 'strategy') => {
    setLotteryCorpusLoading(true);
    try {
      const exported = await miniGptApi.exportLotteryCorpus({ format, limit: 2000 });
      setLotteryCorpusExport(exported);
      const trainDataPath = exported.trainDataPath || exported.dataPath || `data/lottery-${format}.txt`;
      const nextValues = {
        ...form.getFieldsValue(),
        data: trainDataPath,
        evalData: exported.validationDataPath || form.getFieldValue('evalData'),
        samplePrompt: format === 'features' || format === 'strategy'
          ? 'target=next strategy=balanced'
          : exported.latestIssue ? `${exported.latestIssue}:` : '2026001:'
      };
      form.setFieldsValue(nextValues);
      await loadCorpusInsight(nextValues);
      message.success(text.lotteryCorpusExportSuccess(exported.drawCount || 0));
    } catch (error) {
      console.error('导出 MiniGPT 双色球语料失败:', error);
      message.error(text.lotteryCorpusExportFailed);
    } finally {
      setLotteryCorpusLoading(false);
    }
  }, [form, loadCorpusInsight, text]);

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
    const startDiffs = experimentVariableDiffs(run, values, isEnglish);
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
    const draft = buildReviewDraft(run, logs, variableDiffItems, launchChecklistItems, nextActionItems, generationResult, isEnglish);
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
  const lossDiagnosticItems = useMemo(() => lossDiagnostics(run, logs, isEnglish), [isEnglish, logs, run]);
  const latestStatusLog = trainingStatus.latestLog;
  const trainingPercent = trainingStatus.running ? trainingStatus.percent ?? 1 : trainingStatus.failed ? 100 : trainingStatus.percent ?? 0;
  const encodedSample = useMemo(() => corpusInsight.encodedSample || [], [corpusInsight.encodedSample]);
  const tokenRows = useMemo(() => corpusInsight.tokens || [], [corpusInsight.tokens]);
  const corpusDiagnosticItems = useMemo(() => corpusDiagnostics(corpusInsight, isEnglish), [corpusInsight, isEnglish]);
  const batchRows = useMemo(() => buildBatchRows(encodedSample, tokenRows), [encodedSample, tokenRows]);
  const maskSize = useMemo(() => buildMaskSize(run, encodedSample), [encodedSample, run]);
  const architectureStages = useMemo(() => modelStages(run, corpusInsight), [corpusInsight, run]);
  const shapeRows = useMemo(() => tensorShapeRows(run, corpusInsight, encodedSample, isEnglish), [corpusInsight, encodedSample, isEnglish, run]);
  const codeRows = useMemo(() => localizedCodeReferenceRows(isEnglish), [isEnglish]);
  const displayPromptPresetRows = useMemo(() => localizedPromptPresetRows(isEnglish), [isEnglish]);
  const comparisonChartOption = useMemo(() => buildComparisonChartOption(comparisonLogs), [comparisonLogs]);
  const comparisonSummary = useMemo(() => comparisonSummaryItems(comparisonLogs, isEnglish), [comparisonLogs, isEnglish]);
  const milestones = useMemo(() => learningMilestones(run, logs, corpusInsight, isEnglish), [corpusInsight, isEnglish, logs, run]);
  const reviewQuestionItems = useMemo(() => reviewQuestions(run, logs, generationResult, isEnglish), [generationResult, isEnglish, logs, run]);
  const generationDiagnosticItems = useMemo(
    () => generationDiagnostics(run, logs, generationResult, isEnglish),
    [generationResult, isEnglish, logs, run]
  );
  const lotteryCandidate = generationResult?.lotteryCandidate;
  const generationRankRows = useMemo(
    () => generationRankItems([
      ...(generationResult ? [generationResult] : []),
      ...generationComparisons
    ], isEnglish),
    [generationComparisons, generationResult, isEnglish]
  );
  const selectedGenerationRank = useMemo(
    () => generationRankRows.find(item => item.key === selectedGenerationKey) || generationRankRows[0],
    [generationRankRows, selectedGenerationKey]
  );
  const generationRadarOption = useMemo(
    () => buildGenerationRadarOption(selectedGenerationRank, isEnglish),
    [isEnglish, selectedGenerationRank]
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
    () => nextExperimentActions(run, logs, corpusInsight, generationResult, isEnglish),
    [corpusInsight, generationResult, isEnglish, logs, run]
  );
  const trainingFormValues = useMemo(
    () => ({ ...form.getFieldsValue(), ...(watchedTrainingValues || {}) }),
    [form, watchedTrainingValues]
  );
  const currentTrainingData = normalizeTrainingData(trainingFormValues.data);
  const resumeSourceRuns = useMemo(
    () => runs.filter(item => item.runName && item.checkpoint && normalizeTrainingData(item.data) === currentTrainingData),
    [currentTrainingData, runs]
  );
  const runGroupsByData = useMemo(() => groupRunsByData(runs), [runs]);
  const trainingDataOptions = useMemo(() => {
    const exportedTrainingPath = lotteryCorpusExport?.trainDataPath || lotteryCorpusExport?.dataPath;
    const dataPaths = [
      'data/sample.txt',
      ...runGroupsByData.map(group => group.data),
      exportedTrainingPath
    ]
      .map(item => normalizeTrainingData(item))
      .filter(Boolean);
    return Array.from(new Set(dataPaths)).map(dataPath => ({
      value: dataPath,
      label: dataPath === exportedTrainingPath
        ? `${dataPath} · ${text.exported}`
        : dataPath
    }));
  }, [lotteryCorpusExport?.dataPath, lotteryCorpusExport?.trainDataPath, runGroupsByData, text.exported]);
  const noteFormValues = useMemo(
    () => ({ ...noteForm.getFieldsValue(), ...(watchedNoteValues || {}) }),
    [noteForm, watchedNoteValues]
  );

  useEffect(() => {
    const selectedResume = trainingFormValues.resumeFromRun;
    if (!selectedResume) return;
    const stillValid = resumeSourceRuns.some(item => item.runName === selectedResume);
    if (!stillValid) {
      form.setFieldsValue({
        ...form.getFieldsValue(),
        resumeFromRun: undefined
      });
    }
  }, [form, resumeSourceRuns, trainingFormValues.resumeFromRun]);

  const variableDiffItems = useMemo(
    () => experimentVariableDiffs(run, trainingFormValues, isEnglish),
    [isEnglish, run, trainingFormValues]
  );
  const variableGuardState = useMemo(
    () => variableGuard(run, variableDiffItems, isEnglish),
    [isEnglish, run, variableDiffItems]
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
    () => launchChecklist(run, corpusDiagnosticItems, variableGuardState, runNameExists, plannedExperiments, isEnglish),
    [corpusDiagnosticItems, isEnglish, plannedExperiments, run, runNameExists, variableGuardState]
  );
  const displayPlannedExperiments = useMemo(
    () => plannedExperiments.map(item => localizePlannedExperiment(item, isEnglish)),
    [isEnglish, plannedExperiments]
  );
  const reviewDraftSourceItems = useMemo(
    () => reviewDraftSources(run, logs, variableDiffItems, launchChecklistItems, nextActionItems, generationResult, isEnglish),
    [generationResult, isEnglish, launchChecklistItems, logs, nextActionItems, run, variableDiffItems]
  );
  const reviewQualityCheckItems = useMemo(
    () => reviewQualityItems(noteFormValues, isEnglish),
    [isEnglish, noteFormValues]
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
      prompt: run?.samplePrompt || text.defaultPrompt,
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
  }, [generationForm, noteForm, run, text.defaultPrompt]);

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
      title: isEnglish ? 'Elapsed' : '耗时',
      dataIndex: 'elapsedSeconds',
      width: 100,
      render: (value?: number) => Number.isFinite(value) ? `${value}s` : '-'
    },
    {
      title: isEnglish ? 'Sample' : '样例',
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
      title={text.title}
      className="mini-gpt-page"
      actions={(
        <Space wrap>
          <Select
            className="mini-gpt-run-select"
            placeholder={text.selectRun}
            value={selectedRun}
            options={runGroupsByData.map(group => ({
              label: group.data,
              options: group.items.map(item => ({
                value: item.runName,
                label: [item.runName, item.preset, item.finalEvalLoss !== undefined ? `eval=${formatLoss(item.finalEvalLoss)}` : '']
                  .filter(Boolean)
                  .join(' · ')
              }))
            }))}
            onChange={(value) => loadDashboard(value)}
          />
          <Button icon={<ReloadOutlined />} onClick={() => loadDashboard(selectedRun)} loading={loading}>
            {text.refresh}
          </Button>
        </Space>
      )}
    >
      <Spin spinning={loading}>
        <div className="mini-gpt-workspace">
          <section className="mini-gpt-lab-switcher">
            <Segmented
              value={activeLabSection}
              options={text.sections}
              onChange={(value) => setActiveLabSection(value as LabSectionKey)}
            />
          </section>
          <section className={labSectionClass('training')}>
          <Card className="mini-gpt-panel mini-gpt-training-card" title={text.trainingControl}>
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
                <section className="mini-gpt-corpus-step">
                  <div className="mini-gpt-step-head">
                    <Tag color="cyan">1</Tag>
                    <div>
                      <strong>{text.chooseCorpus}</strong>
                      <p>{text.chooseCorpusDesc}</p>
                    </div>
                  </div>
                  <div className="mini-gpt-corpus-step-grid">
                    <Form.Item name="data" label={text.trainingData}>
                      <AutoComplete
                        options={trainingDataOptions}
                        placeholder={text.trainingDataPlaceholder}
                        filterOption={(inputValue, option) => (
                          String(option?.value || '').toLowerCase().includes(inputValue.toLowerCase())
                        )}
                      />
                    </Form.Item>
                    <Form.Item name="evalData" label={text.evalData}>
                      <Input placeholder={text.evalDataPlaceholder} />
                    </Form.Item>
                  </div>
                  <section className="mini-gpt-lottery-corpus">
                    <div className="mini-gpt-lottery-corpus-head">
                      <Text type="secondary">{text.lotteryCorpus}</Text>
                      <Space wrap>
                        <Button
                          size="small"
                          icon={<DatabaseOutlined />}
                          loading={lotteryCorpusLoading}
                          disabled={trainingStatus.running}
                          onClick={() => handleExportLotteryCorpus('raw')}
                        >
                          {text.drawFormat}
                        </Button>
                        <Button
                          size="small"
                          icon={<DatabaseOutlined />}
                          loading={lotteryCorpusLoading}
                          disabled={trainingStatus.running}
                          onClick={() => handleExportLotteryCorpus('features')}
                        >
                          {text.structuredFeatures}
                        </Button>
                        <Button
                          size="small"
                          icon={<DatabaseOutlined />}
                          loading={lotteryCorpusLoading}
                          disabled={trainingStatus.running}
                          onClick={() => handleExportLotteryCorpus('strategy')}
                        >
                          {text.strategySamples}
                        </Button>
                      </Space>
                    </div>
                    {lotteryCorpusExport ? (
                      <div className="mini-gpt-lottery-corpus-result">
                        <Tag color="cyan">{lotteryCorpusExport.format}</Tag>
                        <Tag color="blue" title={lotteryCorpusExport.corpusVersion}>
                          {lotteryCorpusExport.corpusVersion?.slice(0, 16) || text.corpusVersion}
                        </Tag>
                        <span>{lotteryCorpusExport.drawCount || 0} {text.periods} · {text.timeSplit}</span>
                        <p>
                          schema v{lotteryCorpusExport.schemaVersion || '-'} · {lotteryCorpusExport.templateVersion || '-'} · {lotteryCorpusExport.sortOrder || '-'}
                        </p>
                        <div className="mini-gpt-lottery-corpus-splits">
                          <article>
                            <strong>{text.trainSplit} · {lotteryCorpusExport.trainDrawCount || 0} {text.periods}</strong>
                            <span>{lotteryCorpusExport.trainFirstIssue || '-'} - {lotteryCorpusExport.trainLatestIssue || '-'}</span>
                            <small title={lotteryCorpusExport.trainSha256}>SHA-256 {lotteryCorpusExport.trainSha256?.slice(0, 16) || '-'}</small>
                            <code>{lotteryCorpusExport.trainDataPath || lotteryCorpusExport.dataPath || '-'}</code>
                          </article>
                          <article>
                            <strong>{text.validationSplit} · {lotteryCorpusExport.validationDrawCount || 0} {text.periods}</strong>
                            <span>{lotteryCorpusExport.validationFirstIssue || '-'} - {lotteryCorpusExport.validationLatestIssue || '-'}</span>
                            <small title={lotteryCorpusExport.validationSha256}>SHA-256 {lotteryCorpusExport.validationSha256?.slice(0, 16) || '-'}</small>
                            <code>{lotteryCorpusExport.validationDataPath || '-'}</code>
                          </article>
                        </div>
                        <p>{text.manifest}: <code>{lotteryCorpusExport.manifestDataPath || '-'}</code></p>
                      </div>
                    ) : (
                      <p>{text.lotteryCorpusDesc}</p>
                    )}
                  </section>
                </section>
                <section className="mini-gpt-training-step">
                  <div className="mini-gpt-step-head">
                    <Tag color="blue">2</Tag>
                    <div>
                      <strong>{text.setupTraining}</strong>
                      <p>{text.setupTrainingDesc}</p>
                    </div>
                  </div>
                  <div className="mini-gpt-training-step-grid">
                    <Form.Item name="preset" label={text.preset}>
                      <Select
                        options={[
                          { value: 'tiny', label: 'tiny' },
                          { value: 'small', label: 'small' },
                          { value: 'medium', label: 'medium' },
                          { value: 'custom', label: 'custom' }
                        ]}
                      />
                    </Form.Item>
                    <Form.Item name="runName" label={text.runName}>
                      <Input
                        placeholder={text.autoNamePlaceholder}
                        addonAfter={(
                          <Button
                            type="link"
                            size="small"
                            disabled={variableDiffItems.length !== 1}
                            onClick={handleSuggestRunName}
                          >
                            {text.name}
                          </Button>
                        )}
                      />
                    </Form.Item>
                    <Form.Item name="resumeFromRun" label={text.resumeSource}>
                      <Select
                        allowClear
                        placeholder={text.resumeSourcePlaceholder}
                        options={resumeSourceRuns
                          .map(item => ({
                            value: item.runName,
                            label: [item.runName, item.trainStep !== undefined ? `step=${formatInteger(item.trainStep)}` : '', item.finalEvalLoss !== undefined ? `eval=${formatLoss(item.finalEvalLoss)}` : '']
                              .filter(Boolean)
                              .join(' · ')
                          }))}
                      />
                    </Form.Item>
                    <Form.Item name="maxSteps" label={text.maxSteps}>
                      <InputNumber min={1} max={5000} />
                    </Form.Item>
                    <Form.Item name="valRatio" label={text.valRatio}>
                      <InputNumber min={0} max={0.5} step={0.05} />
                    </Form.Item>
                    <Form.Item name="samplePrompt" label={text.samplePrompt}>
                      <Input />
                    </Form.Item>
                    <Form.Item name="sampleTokens" label={text.sampleTokens}>
                      <InputNumber min={1} max={500} />
                    </Form.Item>
                  </div>
                </section>
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
                  <Form.Item name="qualityGateMaxEvalLoss" label={text.evalGate}>
                    <InputNumber min={0} max={20} step={0.1} />
                  </Form.Item>
                  <Form.Item name="qualityGateMaxLossGap" label={text.gapGate}>
                    <InputNumber min={0} max={10} step={0.05} />
                  </Form.Item>
                </section>
                <section className="mini-gpt-recipe-grid">
                  {displayTrainingRecipes.map(recipe => (
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
                <Form.Item className="mini-gpt-training-actions">
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<PlayCircleOutlined />}
                      loading={starting}
                      disabled={trainingStatus.running}
                    >
                      {text.startTraining}
                    </Button>
                    <Button
                      danger
                      icon={<CloseCircleOutlined />}
                      loading={cancelling}
                      disabled={!trainingStatus.running}
                      onClick={handleCancelTraining}
                    >
                      {text.cancel}
                    </Button>
                  </Space>
                </Form.Item>
              </Form>

              <div className="mini-gpt-status-panel">
                <Space wrap>
                  <Tag color={trainingStatus.running ? 'processing' : trainingStatus.failed ? 'error' : trainingStatus.cancelled ? 'warning' : 'default'}>
                    {trainingStageText}
                  </Tag>
                  {trainingStatus.runName && <Tag>{trainingStatus.runName}</Tag>}
                </Space>
                <Progress
                  percent={trainingPercent}
                  status={trainingStatus.failed ? 'exception' : trainingStatus.running ? 'active' : 'normal'}
                />
                <p>{trainingStatusMessage}</p>
                <dl>
                  <div>
                    <dt>{text.currentStep}</dt>
                    <dd>{formatInteger(trainingStatus.processedStep)} / {formatInteger(trainingStatus.totalSteps)}</dd>
                  </div>
                  <div>
                    <dt>{text.latestLoss}</dt>
                    <dd>{formatLoss(latestStatusLog?.evalLoss)}</dd>
                  </div>
                  <div>
                    <dt>{text.updatedAt}</dt>
                    <dd>{formatTime(trainingStatus.updatedAt)}</dd>
                  </div>
                </dl>
                <section className="mini-gpt-env-check">
                  <div className="mini-gpt-env-check-head">
                    <Text type="secondary">{text.environment}</Text>
                    <Space wrap>
                      <Tag color={environmentCheck.status === 'PASS' ? 'green' : 'orange'}>
                        {environmentCheck.status || 'CHECK'}
                      </Tag>
                      <Button size="small" icon={<ReloadOutlined />} loading={environmentLoading} onClick={() => loadEnvironmentCheck()}>
                        {text.check}
                      </Button>
                    </Space>
                  </div>
                  <div className="mini-gpt-env-check-grid">
                    <div className={environmentCheck.pythonAvailable ? 'pass' : 'watch'}>
                      <span>Python</span>
                      <strong>{environmentCheck.pythonAvailable ? text.available : text.unknown}</strong>
                    </div>
                    <div className={environmentCheck.pymongoAvailable ? 'pass' : 'watch'}>
                      <span>pymongo</span>
                      <strong>{environmentCheck.pymongoVersion || '-'}</strong>
                    </div>
                    <div className={environmentCheck.mongoAvailable ? 'pass' : 'watch'}>
                      <span>Mongo</span>
                      <strong>{environmentCheck.mongoAvailable ? environmentCheck.mongoDb || 'test' : text.unavailable}</strong>
                    </div>
                  </div>
                  <p>{environmentMessage}</p>
                </section>
              </div>
            </div>
            <section className="mini-gpt-variable-diff">
              <div className="mini-gpt-variable-diff-head">
                <Text type="secondary">{text.nextDiff}</Text>
                <Space wrap>
                  <Tag color={variableGuardState.tagColor}>{variableGuardState.title}</Tag>
                  <Tag color={variableDiffItems.length === 1 ? 'green' : variableDiffItems.length > 1 ? 'orange' : 'default'}>
                    {run ? `${variableDiffItems.length} changes` : 'baseline'}
                  </Tag>
                </Space>
              </div>
              <p className={`mini-gpt-variable-guard ${variableGuardState.status}`}>{variableGuardState.detail}</p>
              {suggestedRunName && (
                <p className="mini-gpt-run-name-suggestion"> {text.suggestedRunName} <code>{suggestedRunName}</code></p>
              )}
              {runNameExists && (
                <div className="mini-gpt-run-name-conflict">
                  <Text type="secondary">{text.runNameExists} <code>{fallbackRunName}</code></Text>
                  <Button size="small" onClick={() => form.setFieldsValue({ ...form.getFieldsValue(), runName: fallbackRunName })}>
                    {text.useAlternative}
                  </Button>
                </div>
              )}
              {run && variableDiffItems.length > 1 && (
                <Button size="small" onClick={handleKeepFirstVariableOnly}>
                  {text.keepFirstVariable}
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
                  <p>{text.unchangedForm}</p>
                )
              ) : (
                <p>{text.firstBaseline}</p>
              )}
            </section>
            <section className="mini-gpt-launch-checklist">
              <div className="mini-gpt-variable-diff-head">
                <Text type="secondary">{text.launchChecklist}</Text>
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

          <Card className="mini-gpt-panel" title={text.hparamQuickRef}>
            <div className="mini-gpt-hparam-grid">
              {displayHyperparameterGuideRows.map(row => (
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
          </section>

          <section className={labSectionClass('corpus')}>
          <Card
            className="mini-gpt-panel"
            title={text.corpusTokenizer}
            extra={<Button size="small" icon={<ReloadOutlined />} onClick={() => loadCorpusInsight()}>{text.refreshCorpus}</Button>}
          >
            <Spin spinning={corpusLoading}>
              <div className="mini-gpt-tokenizer-grid">
                <div className="mini-gpt-corpus-overview">
                  <section className="mini-gpt-tokenizer-metrics">
                    <div>
                      <span>{text.charCount}</span>
                      <strong>{formatInteger(corpusInsight.charCount)}</strong>
                    </div>
                    <div>
                      <span>{text.lineCount}</span>
                      <strong>{formatInteger(corpusInsight.lineCount)}</strong>
                    </div>
                    <div>
                      <span>{text.vocabSize}</span>
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
                    <Text type="secondary">{text.corpusPreview}</Text>
                    <pre>{corpusInsight.preview || text.noCorpusPreview}</pre>
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
          </section>

          <section className={labSectionClass('explain')}>
          <Card className="mini-gpt-panel" title={text.processExplain}>
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
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={text.batchEmpty} />
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
              {codeRows.map(row => (
                <section className="mini-gpt-code-card" key={row.key}>
                  <span>{row.concept}</span>
                  <code>{row.symbol}</code>
                  <p>{row.note}</p>
                  <strong>{row.action}</strong>
                </section>
              ))}
            </div>
          </Card>

          <Card className="mini-gpt-panel" title={text.learningChecklist}>
            <div className="mini-gpt-learning-grid">
              {milestones.map(item => (
                <section className={`mini-gpt-learning-card ${item.status}`} key={item.key}>
                  <div className="mini-gpt-learning-card-head">
                    <strong>{item.title}</strong>
                    <Tag color={item.status === 'done' ? 'success' : item.status === 'active' ? 'processing' : 'default'}>
                      {item.status === 'done'
                        ? (isEnglish ? 'Done' : '完成')
                        : item.status === 'active'
                          ? (isEnglish ? 'In Progress' : '进行中')
                          : (isEnglish ? 'Pending' : '待开始')}
                    </Tag>
                  </div>
                  <p>{item.target}</p>
                  <span>{item.evidence}</span>
                </section>
              ))}
            </div>
          </Card>
          </section>

          <section className={labSectionClass('review')}>
          <Card className="mini-gpt-panel" title={text.reviewQuestions}>
            <ol className="mini-gpt-review-list">
              {reviewQuestionItems.map(question => (
                <li key={question}>{question}</li>
              ))}
            </ol>
          </Card>

          <Card className="mini-gpt-panel" title={text.nextSuggestions}>
            <div className="mini-gpt-next-actions">
              {nextActionItems.map(item => (
                <section key={item.key}>
                  <Text type="secondary">{item.reason}</Text>
                  <strong>{item.title}</strong>
                  <p>{item.action}</p>
                  <Button size="small" onClick={() => handleAddPlan(item)}>
                    {text.addToPlan}
                  </Button>
                </section>
              ))}
            </div>
          </Card>

          <Card
            className="mini-gpt-panel"
            title={text.planQueue}
            extra={(
              <Button size="small" onClick={handleClearPlans} disabled={!plannedExperiments.length}>
                {text.clearPlan}
              </Button>
            )}
          >
            {plannedExperiments.length ? (
              <div className="mini-gpt-plan-list">
                {displayPlannedExperiments.map(item => (
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
                        {text.applyToForm}
                      </Button>
                      <Button size="small" onClick={() => handleRemovePlan(item.id)}>
                        {text.doneRemove}
                      </Button>
                    </Space>
                  </section>
                ))}
              </div>
            ) : (
              <Empty description={text.emptyPlan} />
            )}
          </Card>
          </section>

          {!run ? (
            <Alert
              type="info"
              showIcon
              icon={<DatabaseOutlined />}
              message={text.noMongoData}
              description={text.noMongoDesc}
            />
          ) : (
            <>
            <section className={labSectionClass('records')}>
            <section className="mini-gpt-summary-band">
              <div>
                <Text type="secondary">{text.currentRun}</Text>
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
                  {run.qualityGateStatus && (
                    <Tag color={qualityGateStatusColor(run.qualityGateStatus)}>
                      gate={run.qualityGateStatus}
                    </Tag>
                  )}
                </Space>
                {run.qualityGateReasons && (
                  <p className="mini-gpt-quality-gate-reasons">{run.qualityGateReasons}</p>
                )}
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
            </section>

            <section className={labSectionClass('review')}>
            <Card
              className="mini-gpt-panel"
              title={text.compareNotes}
              extra={(
                <Button size="small" icon={<CopyOutlined />} onClick={handleCopyReport} disabled={!run}>
                  {text.copyReport}
                </Button>
              )}
            >
              <div className="mini-gpt-comparison-grid">
                <section className="mini-gpt-comparison-chart-panel">
                  <div className="mini-gpt-comparison-toolbar">
                    <Text type="secondary">{text.compareRuns}</Text>
                    <Select
                      mode="multiple"
                      placeholder={text.compareRunsPlaceholder}
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
                    <Empty description={text.noCompareLogs} />
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
                  <Form.Item name="hypothesis" label={text.hypothesis}>
                    <Input.TextArea rows={3} placeholder={text.hypothesisPlaceholder} />
                  </Form.Item>
                  <Form.Item name="observation" label={text.observation}>
                    <Input.TextArea rows={3} placeholder={text.observationPlaceholder} />
                  </Form.Item>
                  <Form.Item name="conclusion" label={text.conclusion}>
                    <Input.TextArea rows={3} placeholder={text.conclusionPlaceholder} />
                  </Form.Item>
                  <Form.Item name="nextStep" label={text.nextStep}>
                    <Input.TextArea rows={2} placeholder={text.nextStepPlaceholder} />
                  </Form.Item>
                  <Space wrap>
                    <Button onClick={handleDraftReviewNotes} disabled={!run?.runName}>
                      {text.generateReviewDraft}
                    </Button>
                    <Button type="primary" htmlType="submit" loading={savingNotes} disabled={!run?.runName}>
                      {text.saveNotes}
                    </Button>
                  </Space>
                </Form>
              </div>
            </Card>
            </section>

            <section className={labSectionClass('generate')}>
            <section className="mini-gpt-main-grid mini-gpt-generate-grid">
              <Card className="mini-gpt-panel" title={text.lossCurve}>
                {trainingStatus.runName && (
                  <section className="mini-gpt-live-loss">
                    <div>
                      <span>{text.runningRun}</span>
                      <strong>{trainingStatus.runName}</strong>
                    </div>
                    <div>
                      <span>{text.currentStep}</span>
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
                  <Empty description={trainingStatus.running ? text.waitingLoss : text.insufficientLogs} />
                )}
              </Card>

              <Card className="mini-gpt-panel" title={text.generationLab}>
                <section className="mini-gpt-prompt-presets">
                  {displayPromptPresetRows.map(preset => (
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
                        {text.generate}
                      </Button>
                      <Button loading={comparingGeneration} disabled={!run?.checkpoint} onClick={handleCompareGeneration}>
                        {text.compareParams}
                      </Button>
                    </Space>
                  </div>
                </Form>
                <div className="mini-gpt-generation-result">
                  <Text type="secondary">
                    {generationResult?.elapsedMillis !== undefined
                      ? `${generationResult.runName || run.runName} · ${generationResult.elapsedMillis}ms`
                      : text.currentCheckpointOutput}
                  </Text>
                  <pre className="mini-gpt-sample">
                    {generationResult?.generatedText || sample || text.noGeneratedSample}
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
                          <Text type="secondary">{text.currentBestOutput}</Text>
                          <strong>{selectedGenerationRank.candidateText}</strong>
                        </div>
                        <Tag color={selectedGenerationRank.status === 'VALID' ? 'green' : selectedGenerationRank.status === 'REPAIR' ? 'orange' : 'blue'}>
                          {selectedGenerationRank.score} {text.points}
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
                            <dt>{text.repeat}</dt>
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
                        <Text type="secondary">{text.tokenReplay}</Text>
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
                            <span>{text.position}</span>
                            <strong>#{selectedTraceToken.index}</strong>
                          </div>
                          <div>
                            <span>{text.source}</span>
                            <strong>{selectedTraceToken.role === 'prompt' ? 'Prompt' : text.modelGenerated}</strong>
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
                      <Text type="secondary">{text.lotteryCandidateCheck}</Text>
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
                            <span>{text.redCount}</span>
                            <strong>{lotteryCandidate.redCount ?? '-'}</strong>
                          </div>
                          <div>
                            <span>{text.redSum}</span>
                            <strong>{lotteryCandidate.redSum ?? '-'}</strong>
                          </div>
                          <div>
                            <span>{text.span}</span>
                            <strong>{lotteryCandidate.span ?? '-'}</strong>
                          </div>
                          <div>
                            <span>{text.oddEven}</span>
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
                          <p>{text.candidateValid}</p>
                        )}
                        {(lotteryCandidate.repairedRedNumbers?.length || lotteryCandidate.repairedBlueNumber) && !lotteryCandidate.valid && (
                          <p>
                            {text.repairReference}
                            <code>{lotteryCandidate.repairedRedNumbers?.join(' ') || '--'} + {lotteryCandidate.repairedBlueNumber || '--'}</code>
                          </p>
                        )}
                      </>
                    ) : (
                      <p>{text.lotteryCandidateWaiting}</p>
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
                              <p>{text.incompleteCandidate}</p>
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
            </section>

            <section className={labSectionClass('records')}>
            <section className="mini-gpt-main-grid">
              <Card className="mini-gpt-panel" title={text.config}>
                <dl className="mini-gpt-config-list">
                  {configEntries(run).map(([key, value]) => (
                    <div key={key}>
                      <dt>{key}</dt>
                      <dd>{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </Card>

              <Card className="mini-gpt-panel" title={text.history}>
                <div className="mini-gpt-run-list">
                  {runGroupsByData.map(group => (
                    <section className="mini-gpt-run-group" key={group.data}>
                      <div className="mini-gpt-run-group-head">
                        <span>{group.data}</span>
                        <Tag>{group.items.length} runs</Tag>
                      </div>
                      {group.items.map(item => (
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
                    </section>
                  ))}
                </div>
              </Card>
            </section>

            <Card className="mini-gpt-panel" title={text.trainingLogs}>
              <Table
                rowKey={(record) => `${record.runName}-${record.step}`}
                columns={columns}
                dataSource={logs}
                pagination={{ pageSize: 8, showSizeChanger: false }}
                scroll={{ x: 820 }}
              />
            </Card>
            </section>
            </>
          )}
        </div>
      </Spin>
    </LifePageShell>
  );
};

export default MiniGptLearningPage;
