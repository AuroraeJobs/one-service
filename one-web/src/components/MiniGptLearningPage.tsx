import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Form, Input, InputNumber, Progress, Select, Space, Spin, Table, Tag, Typography, message } from 'antd';
import { CloseCircleOutlined, CopyOutlined, DatabaseOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import LifePageShell from './LifePageShell';
import {
  miniGptApi,
  type MiniGptCorpusInsight,
  type MiniGptDashboard,
  type MiniGptGenerationRequest,
  type MiniGptGenerationResult,
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

const latestSample = (logs: MiniGptTrainingLogRecord[]) => (
  [...logs].reverse().find(log => log.sample)?.sample || ''
);

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
        action: '使用 Tiny 基线模板，训练 200 step。'
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
      action: '增加语料或调低 valRatio 后重训，直到 eval loss 可稳定记录。'
    });
  }

  if (Number.isFinite(run.lossGap) && Math.abs(run.lossGap || 0) > 0.5) {
    actions.push({
      key: 'gap-control',
      title: '控制泛化差距',
      reason: `当前 loss gap=${formatLoss(run.lossGap)}，训练和验证表现已经分开。`,
      action: '优先增加数据；若数据暂时不变，就降低 max steps 或模型尺寸做对照。'
    });
  }

  if (logs.length >= 2 && Number.isFinite(trainLoss) && Number.isFinite(evalLoss) && Number(evalLoss) > Number(trainLoss) + 0.2) {
    actions.push({
      key: 'regularize',
      title: '做保守训练对照',
      reason: 'eval loss 明显高于 train loss，模型可能更会背训练文本。',
      action: '复制当前实验，只把 learning rate 降低一档或减少训练步数。'
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
      action: '先用更低 temperature/top-k 对比；若仍重复，再补语料或减少训练步数。'
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
    action: '从低学习率、长上下文、Small 对照里选一个，和当前 run 做曲线对比。'
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
  corpusInsight?: MiniGptCorpusInsight
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
    `- 假设：${run.hypothesis || '-'}`,
    `- 观察：${run.observation || '-'}`,
    `- 结论：${run.conclusion || '-'}`,
    `- 下一步：${run.nextStep || '-'}`,
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

const MiniGptLearningPage = () => {
  const [form] = Form.useForm<MiniGptTrainingRequest>();
  const [noteForm] = Form.useForm<MiniGptRunNoteRequest>();
  const [generationForm] = Form.useForm<MiniGptGenerationRequest>();
  const [dashboard, setDashboard] = useState<MiniGptDashboard>({});
  const [corpusInsight, setCorpusInsight] = useState<MiniGptCorpusInsight>({});
  const [trainingStatus, setTrainingStatus] = useState<MiniGptTrainingStatus>({});
  const [generationResult, setGenerationResult] = useState<MiniGptGenerationResult>();
  const [selectedRun, setSelectedRun] = useState<string>();
  const [comparisonRunNames, setComparisonRunNames] = useState<string[]>([]);
  const [comparisonLogs, setComparisonLogs] = useState<Record<string, MiniGptTrainingLogRecord[]>>({});
  const [loading, setLoading] = useState(false);
  const [corpusLoading, setCorpusLoading] = useState(false);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [generating, setGenerating] = useState(false);

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

  const handleApplyTrainingRecipe = (recipe: MiniGptTrainingRecipe) => {
    const mergedValues = {
      ...form.getFieldsValue(),
      ...recipe.values
    };
    form.setFieldsValue(mergedValues);
    loadCorpusInsight(mergedValues);
    message.info(`已应用实验模板：${recipe.title}`);
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
    } catch (error) {
      console.error('MiniGPT 生成失败:', error);
      message.error('MiniGPT 生成失败');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadTrainingStatus();
    loadCorpusInsight({
      data: 'data/sample.txt',
      samplePrompt: '语言模型'
    });
    const timer = window.setInterval(() => {
      loadTrainingStatus(true);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [loadCorpusInsight, loadDashboard, loadTrainingStatus]);

  const runs = useMemo(() => dashboard.runs || [], [dashboard.runs]);
  const logs = useMemo(() => dashboard.logs || [], [dashboard.logs]);
  const run = dashboard.latestRun;
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
  const milestones = useMemo(() => learningMilestones(run, logs, corpusInsight), [corpusInsight, logs, run]);
  const reviewQuestionItems = useMemo(() => reviewQuestions(run, logs, generationResult), [generationResult, logs, run]);
  const generationDiagnosticItems = useMemo(
    () => generationDiagnostics(run, logs, generationResult),
    [generationResult, logs, run]
  );
  const nextActionItems = useMemo(
    () => nextExperimentActions(run, logs, corpusInsight, generationResult),
    [corpusInsight, generationResult, logs, run]
  );
  const experimentReport = useMemo(
    () => run ? buildExperimentReport(run, logs, generationResult, corpusInsight) : '',
    [corpusInsight, generationResult, logs, run]
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
                  <Input placeholder="留空自动生成" />
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
              </div>
            </div>
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
                </section>
              ))}
            </div>
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
                    <ReactECharts option={comparisonChartOption} className="mini-gpt-comparison-chart" notMerge />
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
                  <Button type="primary" htmlType="submit" loading={savingNotes} disabled={!run?.runName}>
                    保存笔记
                  </Button>
                </Form>
              </div>
            </Card>

            <section className="mini-gpt-main-grid">
              <Card className="mini-gpt-panel" title="Loss 曲线">
                {logs.length > 1 ? (
                  <ReactECharts option={chartOption} className="mini-gpt-chart" notMerge />
                ) : (
                  <Empty description="训练日志不足" />
                )}
              </Card>

              <Card className="mini-gpt-panel" title="生成试验台">
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
                    <Button type="primary" htmlType="submit" loading={generating} disabled={!run?.checkpoint}>
                      生成
                    </Button>
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
