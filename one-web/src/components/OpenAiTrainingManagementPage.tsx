import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Progress, Spin, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ApiOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  CopyOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  LineChartOutlined,
  RocketOutlined
} from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import {
  openAiTrainingApi,
  type OpenAiTrainingAuditEvent,
  type OpenAiTrainingCheckpoint,
  type OpenAiTrainingCostItem,
  type OpenAiTrainingDataset,
  type OpenAiTrainingDeploymentBinding,
  type OpenAiTrainingEvalFailureCase,
  type OpenAiTrainingEvalRun,
  type OpenAiTrainingJob,
  type OpenAiTrainingManagementDashboard,
  type OpenAiTrainingMetric,
  type OpenAiTrainingReportRecord
} from '../services/api';
import './OpenAiTrainingManagementPage.css';

const { Text } = Typography;

const fallbackTrainingDashboard: OpenAiTrainingManagementDashboard = {
  generatedAt: Date.now(),
  lifecycleStages: [
    { key: 'eval', icon: 'experiment', title: 'Baseline Eval', detail: '先测基础模型，确认问题来自 prompt、数据、工具还是模型行为。' },
    { key: 'dataset', icon: 'database', title: 'Dataset', detail: '整理 supervised 样本，记录来源、用途、审核状态和训练文件。' },
    { key: 'job', icon: 'upload', title: 'Fine-tuning Job', detail: '创建训练任务，跟踪 queued、running、succeeded、failed 等状态。' },
    { key: 'checkpoint', icon: 'branches', title: 'Checkpoint', detail: '比较中间模型的 loss、accuracy、样例输出和失败案例。' },
    { key: 'deploy', icon: 'rocket', title: 'Deployment Binding', detail: '只有 eval 达标后，才把模型版本绑定到具体业务能力。' }
  ],
  entities: [
    { key: 'dataset', label: 'llm_training_dataset', value: '训练/评测数据集', accent: '#0071e3' },
    { key: 'job', label: 'llm_training_job', value: '托管训练任务', accent: '#ff9500' },
    { key: 'metric', label: 'llm_training_metric', value: 'step 与 loss 指标', accent: '#34c759' },
    { key: 'checkpoint', label: 'llm_model_checkpoint', value: '中间模型版本', accent: '#5856d6' },
    { key: 'eval', label: 'llm_eval_run', value: '上线前评测', accent: '#00c7be' },
    { key: 'deployment', label: 'llm_model_deployment', value: '业务绑定与回滚', accent: '#ff3b30' }
  ],
  datasets: [
    { key: 'wechat-style', name: 'wechat-style-sft.jsonl', purpose: 'fine_tune', source: '公众号人工精选样本', fileId: 'file-wechat-style-v1', recordCount: 420, qualityStatus: 'approved' },
    { key: 'wechat-publish-eval', name: 'wechat-publish-eval.jsonl', purpose: 'eval', source: '发布回归用例', fileId: 'file-wechat-eval-v1', recordCount: 96, qualityStatus: 'approved' }
  ],
  jobs: [
    { key: 'job-1', jobId: 'ftjob_wechat_draft_v1', baseModel: 'gpt-4.1-mini', dataset: 'wechat-style-sft.jsonl', status: 'succeeded', trainLoss: 0.92, validLoss: 1.04, checkpoint: 'step-240' }
  ],
  metrics: [
    { key: 'wechat-120', jobId: 'ftjob_wechat_draft_v1', step: 120, trainLoss: 1.12, validLoss: 1.18, validTokenAccuracy: 0.74, elapsedSeconds: 365 },
    { key: 'wechat-240', jobId: 'ftjob_wechat_draft_v1', step: 240, trainLoss: 0.92, validLoss: 1.04, validTokenAccuracy: 0.81, elapsedSeconds: 720 }
  ],
  checkpoints: [
    { key: 'wechat-240', providerCheckpointId: 'ckpt_wechat_240', checkpointId: 'ft:wechat:step-240', jobId: 'ftjob_wechat_draft_v1', step: 240, validLoss: 1.04, validTokenAccuracy: 0.81, notes: '候选 checkpoint，Eval 提升明显。' }
  ],
  evalRuns: [
    { key: 'base', model: 'gpt-4.1-mini', evalSet: 'wechat-publish-eval', passRate: 72, score: 0.78, decision: 'baseline' },
    { key: 'checkpoint', model: 'ft:wechat:step-240', evalSet: 'wechat-publish-eval', passRate: 84, score: 0.86, decision: 'candidate' }
  ],
  evalFailureCases: [
    { key: 'format-drift', evalRunId: 'checkpoint', category: '格式漂移', prompt: '生成公众号发布计划摘要', expected: '保留标题、目标读者、发布时间和复盘指标', observed: '遗漏复盘指标', nextAction: '补充包含复盘指标的正例，并在 eval 中增加字段完整性断言' }
  ],
  costItems: [
    { key: 'training-wechat', scope: 'fine_tune', model: 'gpt-4.1-mini', inputTokens: 620000, outputTokens: 0, estimatedUsd: 3.10, note: '训练样本和验证集 token 估算。' }
  ],
  auditEvents: [
    { key: 'dataset-approved', happenedAt: '2026-07-08 09:30', actor: 'learning-admin', action: 'approve_dataset', target: 'ds_wechat_style_v1', note: '训练集完成用途、来源和质量审核。' }
  ],
  deploymentBindings: [
    { key: 'wechat-draft', featureKey: 'wechat-draft', modelId: 'ft:wechat:final', promptVersion: 'wechat-draft-v3', evalRunId: 'checkpoint', rolloutStatus: 'canary', rollbackModelId: 'gpt-4.1-mini' }
  ],
  readinessChecks: [
    { key: 'dataset-reviewed', label: '数据集审核', status: 'PASS', detail: '训练样本已标注用途、来源和审核状态。' },
    { key: 'eval-threshold', label: 'Eval 门槛', status: 'WARNING', detail: '需要用固定评测集确认候选模型是否优于 baseline。' }
  ],
  nextActions: [
    { key: 'api', icon: 'api', title: '接真实 API', detail: '逐步接入 OpenAI file、fine-tuning job、checkpoint、eval API。' },
    { key: 'gate', icon: 'check', title: '上线门禁', detail: '用 eval pass rate、失败案例和回滚模型决定是否灰度。' }
  ]
};

const isNil = (value: unknown) => value === undefined || value === null;

const formatNumber = (value?: number | null) => isNil(value) ? '-' : value.toLocaleString('zh-CN');

const formatDecimal = (value?: number | null) => isNil(value) ? '-' : value.toFixed(2);

const formatPercent = (value?: number | null) => isNil(value) ? '-' : `${Math.round(value * 100)}%`;

const formatProgressPercent = (value?: number | null) => isNil(value) ? 0 : Math.round(value * 100);

const formatDashboardTime = (value?: number) => (
  isNil(value) ? '-' : new Date(value).toLocaleString('zh-CN', { hour12: false })
);

const listLines = <T,>(items: T[] | undefined, render: (item: T) => string) => (
  items?.length ? items.map(render) : ['- 暂无数据']
);

const buildTrainingReport = (dashboard: OpenAiTrainingManagementDashboard) => [
  '# OpenAI 训练管理报告',
  '',
  `生成时间：${formatDashboardTime(dashboard.generatedAt)}`,
  '',
  '## 生命周期',
  ...listLines(dashboard.lifecycleStages, stage => `- ${stage.title || '-'}：${stage.detail || '-'}`),
  '',
  '## 数据集资产',
  ...listLines(
    dashboard.datasets,
    dataset => `- ${dataset.name || '-'}：${dataset.purpose || '-'} / ${formatNumber(dataset.recordCount)} records / ${dataset.qualityStatus || '-'} / ${dataset.fileId || '-'}`
  ),
  '',
  '## 训练任务',
  ...listLines(
    dashboard.jobs,
    job => `- ${job.jobId || '-'}：${job.baseModel || '-'} / ${job.dataset || '-'} / ${job.status || '-'} / train=${formatDecimal(job.trainLoss)} valid=${formatDecimal(job.validLoss)} / checkpoint=${job.checkpoint || '-'}`
  ),
  '',
  '## 训练指标快照',
  ...listLines(
    dashboard.metrics,
    metric => `- ${metric.jobId || '-'} step ${formatNumber(metric.step)}：train=${formatDecimal(metric.trainLoss)}, valid=${formatDecimal(metric.validLoss)}, acc=${formatPercent(metric.validTokenAccuracy)}, elapsed=${isNil(metric.elapsedSeconds) ? '-' : `${metric.elapsedSeconds}s`}`
  ),
  '',
  '## Checkpoint 资产',
  ...listLines(
    dashboard.checkpoints,
    checkpoint => `- ${checkpoint.providerCheckpointId || '-'}：${checkpoint.jobId || '-'} step ${formatNumber(checkpoint.step)} / valid=${formatDecimal(checkpoint.validLoss)} / acc=${formatPercent(checkpoint.validTokenAccuracy)} / ${checkpoint.notes || '-'}`
  ),
  '',
  '## Eval 决策',
  ...listLines(
    dashboard.evalRuns,
    evalRun => `- ${evalRun.model || '-'}：${evalRun.evalSet || '-'} / pass=${isNil(evalRun.passRate) ? '-' : `${evalRun.passRate}%`} / score=${formatDecimal(evalRun.score)} / decision=${evalRun.decision || '-'}`
  ),
  '',
  '## Eval 失败案例',
  ...listLines(
    dashboard.evalFailureCases,
    failure => `- ${failure.category || '-'}：${failure.prompt || '-'} -> observed=${failure.observed || '-'}; next=${failure.nextAction || '-'}`
  ),
  '',
  '## 成本与 Token',
  ...listLines(
    dashboard.costItems,
    cost => `- ${cost.scope || '-'}：${cost.model || '-'} / input=${formatNumber(cost.inputTokens)} / output=${formatNumber(cost.outputTokens)} / estimated=$${formatDecimal(cost.estimatedUsd)} / ${cost.note || '-'}`
  ),
  '',
  '## 部署绑定',
  ...listLines(
    dashboard.deploymentBindings,
    deployment => `- ${deployment.featureKey || '-'}：${deployment.modelId || '-'} / prompt=${deployment.promptVersion || '-'} / eval=${deployment.evalRunId || '-'} / rollout=${deployment.rolloutStatus || '-'} / rollback=${deployment.rollbackModelId || '-'}`
  ),
  '',
  '## 上线门禁',
  ...listLines(
    dashboard.readinessChecks,
    check => `- ${check.label || '-'}：${check.status || '-'} / ${check.detail || '-'}`
  ),
  '',
  '## 审计事件',
  ...listLines(
    dashboard.auditEvents,
    event => `- ${event.happenedAt || '-'} ${event.actor || '-'} ${event.action || '-'} ${event.target || '-'}：${event.note || '-'}`
  )
].join('\n');

const iconMap = {
  api: <ApiOutlined />,
  branches: <BranchesOutlined />,
  chart: <LineChartOutlined />,
  check: <CheckCircleOutlined />,
  database: <DatabaseOutlined />,
  experiment: <ExperimentOutlined />,
  rocket: <RocketOutlined />,
  upload: <CloudUploadOutlined />
};

const renderIcon = (icon?: string) => iconMap[icon as keyof typeof iconMap] || <ExperimentOutlined />;

const statusColor: Record<string, string> = {
  queued: 'default',
  running: 'processing',
  succeeded: 'success'
};

const decisionColor: Record<string, string> = {
  baseline: 'default',
  candidate: 'processing',
  deploy: 'success'
};

const rolloutColor: Record<string, string> = {
  active: 'success',
  canary: 'processing',
  draft: 'default',
  rolled_back: 'error'
};

const readinessColor: Record<string, string> = {
  FAILED: 'error',
  PASS: 'success',
  WARNING: 'warning'
};

const qualityColor: Record<string, string> = {
  approved: 'success',
  draft: 'default',
  rejected: 'error',
  reviewed: 'processing'
};

const datasetColumns: ColumnsType<OpenAiTrainingDataset> = [
  {
    title: 'Dataset',
    dataIndex: 'name',
    render: (value?: string) => <strong>{value || '-'}</strong>
  },
  {
    title: 'Purpose',
    dataIndex: 'purpose'
  },
  {
    title: 'Source',
    dataIndex: 'source'
  },
  {
    title: 'File',
    dataIndex: 'fileId'
  },
  {
    title: 'Records',
    dataIndex: 'recordCount',
    render: (value?: number | null) => formatNumber(value)
  },
  {
    title: 'Quality',
    dataIndex: 'qualityStatus',
    render: (value?: string) => <Tag color={qualityColor[value || ''] || 'default'}>{value || '-'}</Tag>
  }
];

const jobColumns: ColumnsType<OpenAiTrainingJob> = [
  {
    title: 'Job',
    dataIndex: 'jobId',
    render: (value?: string) => <strong>{value || '-'}</strong>
  },
  {
    title: 'Base Model',
    dataIndex: 'baseModel'
  },
  {
    title: 'Dataset',
    dataIndex: 'dataset'
  },
  {
    title: 'Status',
    dataIndex: 'status',
    render: (value?: string) => <Tag color={statusColor[value || ''] || 'default'}>{value || '-'}</Tag>
  },
  {
    title: 'Train / Valid',
    render: (_, row) => isNil(row.trainLoss) || isNil(row.validLoss)
      ? '-'
      : `${formatDecimal(row.trainLoss)} / ${formatDecimal(row.validLoss)}`
  },
  {
    title: 'Checkpoint',
    dataIndex: 'checkpoint'
  }
];

const metricColumns: ColumnsType<OpenAiTrainingMetric> = [
  {
    title: 'Job',
    dataIndex: 'jobId',
    render: (value?: string) => <strong>{value || '-'}</strong>
  },
  {
    title: 'Step',
    dataIndex: 'step',
    render: (value?: number | null) => formatNumber(value)
  },
  {
    title: 'Train Loss',
    dataIndex: 'trainLoss',
    render: (value?: number | null) => formatDecimal(value)
  },
  {
    title: 'Valid Loss',
    dataIndex: 'validLoss',
    render: (value?: number | null) => formatDecimal(value)
  },
  {
    title: 'Token Accuracy',
    dataIndex: 'validTokenAccuracy',
    render: (value?: number | null) => (
      <Progress percent={formatProgressPercent(value)} size="small" />
    )
  },
  {
    title: 'Elapsed',
    dataIndex: 'elapsedSeconds',
    render: (value?: number | null) => isNil(value) ? '-' : `${value}s`
  }
];

const checkpointColumns: ColumnsType<OpenAiTrainingCheckpoint> = [
  {
    title: 'Checkpoint',
    dataIndex: 'providerCheckpointId',
    render: (value?: string) => <strong>{value || '-'}</strong>
  },
  {
    title: 'Job',
    dataIndex: 'jobId'
  },
  {
    title: 'Step',
    dataIndex: 'step',
    render: (value?: number | null) => formatNumber(value)
  },
  {
    title: 'Valid Loss',
    dataIndex: 'validLoss',
    render: (value?: number | null) => formatDecimal(value)
  },
  {
    title: 'Token Accuracy',
    dataIndex: 'validTokenAccuracy',
    render: (value?: number | null) => (
      <Progress percent={formatProgressPercent(value)} size="small" />
    )
  },
  {
    title: 'Notes',
    dataIndex: 'notes'
  }
];

const evalColumns: ColumnsType<OpenAiTrainingEvalRun> = [
  {
    title: 'Model',
    dataIndex: 'model',
    render: (value?: string) => <strong>{value || '-'}</strong>
  },
  {
    title: 'Eval Set',
    dataIndex: 'evalSet'
  },
  {
    title: 'Pass Rate',
    dataIndex: 'passRate',
    render: (value?: number | null) => <Progress percent={isNil(value) ? 0 : value} size="small" />
  },
  {
    title: 'Score',
    dataIndex: 'score',
    render: (value?: number | null) => formatDecimal(value)
  },
  {
    title: 'Decision',
    dataIndex: 'decision',
    render: (value?: string) => <Tag color={decisionColor[value || ''] || 'default'}>{value || '-'}</Tag>
  }
];

const evalFailureColumns: ColumnsType<OpenAiTrainingEvalFailureCase> = [
  {
    title: 'Eval',
    dataIndex: 'evalRunId',
    render: (value?: string) => <strong>{value || '-'}</strong>
  },
  {
    title: 'Category',
    dataIndex: 'category'
  },
  {
    title: 'Prompt',
    dataIndex: 'prompt'
  },
  {
    title: 'Expected',
    dataIndex: 'expected'
  },
  {
    title: 'Observed',
    dataIndex: 'observed'
  },
  {
    title: 'Next Action',
    dataIndex: 'nextAction'
  }
];

const costColumns: ColumnsType<OpenAiTrainingCostItem> = [
  {
    title: 'Scope',
    dataIndex: 'scope',
    render: (value?: string) => <strong>{value || '-'}</strong>
  },
  {
    title: 'Model',
    dataIndex: 'model'
  },
  {
    title: 'Input Tokens',
    dataIndex: 'inputTokens',
    render: (value?: number | null) => formatNumber(value)
  },
  {
    title: 'Output Tokens',
    dataIndex: 'outputTokens',
    render: (value?: number | null) => formatNumber(value)
  },
  {
    title: 'Estimated USD',
    dataIndex: 'estimatedUsd',
    render: (value?: number | null) => isNil(value) ? '-' : `$${formatDecimal(value)}`
  },
  {
    title: 'Note',
    dataIndex: 'note'
  }
];

const auditColumns: ColumnsType<OpenAiTrainingAuditEvent> = [
  {
    title: 'Time',
    dataIndex: 'happenedAt'
  },
  {
    title: 'Actor',
    dataIndex: 'actor'
  },
  {
    title: 'Action',
    dataIndex: 'action',
    render: (value?: string) => <strong>{value || '-'}</strong>
  },
  {
    title: 'Target',
    dataIndex: 'target'
  },
  {
    title: 'Note',
    dataIndex: 'note'
  }
];

const deploymentColumns: ColumnsType<OpenAiTrainingDeploymentBinding> = [
  {
    title: 'Feature',
    dataIndex: 'featureKey',
    render: (value?: string) => <strong>{value || '-'}</strong>
  },
  {
    title: 'Model',
    dataIndex: 'modelId'
  },
  {
    title: 'Prompt',
    dataIndex: 'promptVersion'
  },
  {
    title: 'Eval',
    dataIndex: 'evalRunId'
  },
  {
    title: 'Rollout',
    dataIndex: 'rolloutStatus',
    render: (value?: string) => <Tag color={rolloutColor[value || ''] || 'default'}>{value || '-'}</Tag>
  },
  {
    title: 'Rollback',
    dataIndex: 'rollbackModelId'
  }
];

const reportColumns: ColumnsType<OpenAiTrainingReportRecord> = [
  {
    title: 'Report',
    dataIndex: 'title',
    render: (value?: string) => <strong>{value || '-'}</strong>
  },
  {
    title: 'Source',
    dataIndex: 'source'
  },
  {
    title: 'Dashboard',
    dataIndex: 'dashboardGeneratedAt',
    render: (value?: number) => formatDashboardTime(value)
  },
  {
    title: 'Saved At',
    dataIndex: 'createdAt',
    render: (value?: number) => formatDashboardTime(value)
  }
];

const OpenAiTrainingManagementPage = () => {
  const [dashboard, setDashboard] = useState<OpenAiTrainingManagementDashboard>(fallbackTrainingDashboard);
  const [reports, setReports] = useState<OpenAiTrainingReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(false);

  const loadReports = useCallback(async () => {
    try {
      setReports(await openAiTrainingApi.reports(5));
    } catch (error) {
      console.error('加载 OpenAI 训练报告快照失败:', error);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setDashboardError(false);
    try {
      const dashboardData = await openAiTrainingApi.dashboard();
      setDashboard(dashboardData);
    } catch (error) {
      console.error('加载 OpenAI 训练管理数据失败:', error);
      setDashboard(fallbackTrainingDashboard);
      setDashboardError(true);
      message.warning('训练台接口暂不可用，已显示本地企业训练蓝图');
    }

    try {
      setReports(await openAiTrainingApi.reports(5));
    } catch (error) {
      console.error('加载 OpenAI 训练报告快照失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const lifecycleStages = dashboard.lifecycleStages || [];
  const entityCards = dashboard.entities || [];
  const datasetRows = dashboard.datasets || [];
  const jobRows = dashboard.jobs || [];
  const metricRows = dashboard.metrics || [];
  const checkpointRows = dashboard.checkpoints || [];
  const evalRows = dashboard.evalRuns || [];
  const evalFailureRows = dashboard.evalFailureCases || [];
  const costRows = dashboard.costItems || [];
  const auditRows = dashboard.auditEvents || [];
  const deploymentRows = dashboard.deploymentBindings || [];
  const readinessChecks = dashboard.readinessChecks || [];
  const nextActions = dashboard.nextActions || [];

  const handleCopyReport = useCallback(async () => {
    if (!lifecycleStages.length) {
      message.warning('暂无 OpenAI 训练管理报告可复制');
      return;
    }

    try {
      const reportContent = buildTrainingReport(dashboard);
      await navigator.clipboard.writeText(reportContent);
      try {
        await openAiTrainingApi.saveReport({
          title: 'OpenAI 训练管理报告',
          content: reportContent,
          source: 'one-web-copy',
          dashboardGeneratedAt: dashboard.generatedAt
        });
        await loadReports();
        message.success('训练管理报告已复制并保存');
      } catch (saveError) {
        console.error('保存 OpenAI 训练管理报告失败:', saveError);
        message.warning('训练管理报告已复制，Mongo 快照保存失败');
      }
    } catch (error) {
      console.error('复制 OpenAI 训练管理报告失败:', error);
      message.error('训练管理报告复制失败');
    }
  }, [dashboard, lifecycleStages.length, loadReports]);

  return (
    <LifePageShell
      className="openai-training-page"
      eyebrow="OpenAI / Training Management"
      title="OpenAI 训练管理"
      actions={(
        <Button
          disabled={loading || !lifecycleStages.length}
          icon={<CopyOutlined />}
          onClick={handleCopyReport}
        >
          复制并保存
        </Button>
      )}
    >
      <Spin spinning={loading}>
        <Alert
          className="openai-training-intro"
          type={dashboardError ? 'warning' : 'info'}
          showIcon
          message="训练台是企业模型训练管理页，不是直接开始 MiniGPT 训练的按钮"
          description={dashboardError
            ? '当前后端训练台接口不可用，页面已降级展示本地蓝图；MiniGPT 实际训练仍在 MiniGPT 页面里操作。'
            : '这里用于学习和管理企业正规训练流程：数据集、训练任务、指标、checkpoint、评测、部署绑定、成本、审计和上线门禁。'}
        />
        {!loading && !lifecycleStages.length ? (
          <Alert type="warning" showIcon message="暂无 OpenAI 训练管理数据" />
        ) : (
          <>
            <section className="openai-training-overview">
              {lifecycleStages.map(stage => (
                <div key={stage.key}>
                  <span>{renderIcon(stage.icon)}</span>
                  <strong>{stage.title}</strong>
                  <p>{stage.detail}</p>
                </div>
              ))}
            </section>

            <section className="openai-training-grid">
              <Card className="openai-training-panel" title="管理对象">
                <div className="openai-training-entity-grid">
                  {entityCards.map(entity => (
                    <div key={entity.key} style={{ borderColor: entity.accent }}>
                      <Text type="secondary">{entity.label}</Text>
                      <strong>{entity.value}</strong>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="openai-training-panel" title="MiniGPT 对照">
                <div className="openai-training-map">
                  <div><span>MiniGPT run</span><strong>fine-tuning job</strong></div>
                  <div><span>data/sample.txt</span><strong>training file</strong></div>
                  <div><span>logs</span><strong>training metrics</strong></div>
                  <div><span>checkpoint</span><strong>checkpoint model</strong></div>
                  <div><span>实验对比</span><strong>eval comparison</strong></div>
                  <div><span>复制报告</span><strong>training report</strong></div>
                </div>
              </Card>
            </section>

            <Card className="openai-training-panel" title="数据集资产">
              <Table
                columns={datasetColumns}
                dataSource={datasetRows}
                pagination={false}
                size="middle"
                scroll={{ x: 820 }}
              />
            </Card>

            <Card className="openai-training-panel" title="训练任务观测">
              <Table
                columns={jobColumns}
                dataSource={jobRows}
                pagination={false}
                size="middle"
                scroll={{ x: 760 }}
              />
            </Card>

            <Card className="openai-training-panel" title="训练指标快照">
              <Table
                columns={metricColumns}
                dataSource={metricRows}
                pagination={false}
                size="middle"
                scroll={{ x: 840 }}
              />
            </Card>

            <Card className="openai-training-panel" title="Checkpoint 资产">
              <Table
                columns={checkpointColumns}
                dataSource={checkpointRows}
                pagination={false}
                size="middle"
                scroll={{ x: 900 }}
              />
            </Card>

            <section className="openai-training-grid">
              <Card className="openai-training-panel" title="Eval 决策">
                <Table
                  columns={evalColumns}
                  dataSource={evalRows}
                  pagination={false}
                  size="middle"
                  scroll={{ x: 640 }}
                />
              </Card>

              <Card className="openai-training-panel" title="模型部署绑定">
                <Table
                  columns={deploymentColumns}
                  dataSource={deploymentRows}
                  pagination={false}
                  size="middle"
                  scroll={{ x: 760 }}
                />
              </Card>
            </section>

            <Card className="openai-training-panel" title="Eval 失败案例">
              <Table
                columns={evalFailureColumns}
                dataSource={evalFailureRows}
                pagination={false}
                size="middle"
                scroll={{ x: 1100 }}
              />
            </Card>

            <Card className="openai-training-panel" title="成本与 Token 快照">
              <Table
                columns={costColumns}
                dataSource={costRows}
                pagination={false}
                size="middle"
                scroll={{ x: 960 }}
              />
            </Card>

            <Card className="openai-training-panel" title="训练审计事件">
              <Table
                columns={auditColumns}
                dataSource={auditRows}
                pagination={false}
                size="middle"
                scroll={{ x: 900 }}
              />
            </Card>

            <Card className="openai-training-panel" title="报告快照">
              <Table
                columns={reportColumns}
                dataSource={reports}
                pagination={false}
                rowKey={(row) => row.id || `${row.title}-${row.createdAt}`}
                size="middle"
                scroll={{ x: 760 }}
              />
            </Card>

            <Card className="openai-training-panel" title="上线门禁检查">
              <section className="openai-training-readiness">
                {readinessChecks.map(item => (
                  <div className={(item.status || 'WARNING').toLowerCase()} key={item.key}>
                    <span>{item.label}</span>
                    <Tag color={readinessColor[item.status || ''] || 'default'}>{item.status || '-'}</Tag>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </section>
            </Card>

            <section className="openai-training-grid">
              <Card className="openai-training-panel" title="下一步实现">
                <div className="openai-training-next">
                  {nextActions.map(action => (
                    <div key={action.key}>
                      {renderIcon(action.icon)}
                      <strong>{action.title}</strong>
                      <p>{action.detail}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          </>
        )}
      </Spin>
    </LifePageShell>
  );
};

export default OpenAiTrainingManagementPage;
