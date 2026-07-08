import { Card, Progress, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ApiOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  LineChartOutlined,
  RocketOutlined
} from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import './OpenAiTrainingManagementPage.css';

const { Text } = Typography;

type TrainingJobRow = {
  key: string;
  jobId: string;
  baseModel: string;
  dataset: string;
  status: 'queued' | 'running' | 'succeeded';
  trainLoss: number;
  validLoss: number;
  checkpoint: string;
};

type EvalRow = {
  key: string;
  model: string;
  evalSet: string;
  passRate: number;
  score: number;
  decision: 'baseline' | 'candidate' | 'deploy';
};

const lifecycleStages = [
  {
    key: 'eval',
    icon: <ExperimentOutlined />,
    title: 'Baseline Eval',
    detail: '先测基础模型，确认问题来自 prompt、数据、工具还是模型行为。'
  },
  {
    key: 'dataset',
    icon: <DatabaseOutlined />,
    title: 'Dataset',
    detail: '整理 supervised 样本，记录来源、用途、审核状态和 OpenAI file id。'
  },
  {
    key: 'job',
    icon: <CloudUploadOutlined />,
    title: 'Fine-tuning Job',
    detail: '创建训练任务，跟踪 queued、running、succeeded、failed 等状态。'
  },
  {
    key: 'checkpoint',
    icon: <BranchesOutlined />,
    title: 'Checkpoint',
    detail: '比较中间模型的 loss、accuracy、样例输出和失败案例。'
  },
  {
    key: 'deploy',
    icon: <RocketOutlined />,
    title: 'Deployment Binding',
    detail: '只有 eval 达标后，才把模型版本绑定到具体业务能力。'
  }
];

const entityCards = [
  { key: 'dataset', label: 'llm_training_dataset', value: '训练/评测数据集', accent: '#0071e3' },
  { key: 'job', label: 'llm_training_job', value: '托管训练任务', accent: '#ff9500' },
  { key: 'metric', label: 'llm_training_metric', value: 'step 与 loss 指标', accent: '#34c759' },
  { key: 'checkpoint', label: 'llm_model_checkpoint', value: '中间模型版本', accent: '#5856d6' },
  { key: 'eval', label: 'llm_eval_run', value: '上线前评测', accent: '#00c7be' },
  { key: 'deployment', label: 'llm_model_deployment', value: '业务绑定与回滚', accent: '#ff3b30' }
];

const jobRows: TrainingJobRow[] = [
  {
    key: 'job-1',
    jobId: 'ftjob_wechat_draft_v1',
    baseModel: 'gpt-4.1-mini',
    dataset: 'wechat-style-sft.jsonl',
    status: 'succeeded',
    trainLoss: 0.92,
    validLoss: 1.04,
    checkpoint: 'step-240'
  },
  {
    key: 'job-2',
    jobId: 'ftjob_review_guard_v2',
    baseModel: 'gpt-4.1-mini',
    dataset: 'review-quality-sft.jsonl',
    status: 'running',
    trainLoss: 1.18,
    validLoss: 1.31,
    checkpoint: 'step-120'
  },
  {
    key: 'job-3',
    jobId: 'ftjob_tool_route_v1',
    baseModel: 'gpt-4.1',
    dataset: 'tool-routing-eval.jsonl',
    status: 'queued',
    trainLoss: 0,
    validLoss: 0,
    checkpoint: '-'
  }
];

const evalRows: EvalRow[] = [
  {
    key: 'base',
    model: 'gpt-4.1-mini',
    evalSet: 'wechat-publish-eval',
    passRate: 72,
    score: 0.78,
    decision: 'baseline'
  },
  {
    key: 'checkpoint',
    model: 'ft:wechat:step-240',
    evalSet: 'wechat-publish-eval',
    passRate: 84,
    score: 0.86,
    decision: 'candidate'
  },
  {
    key: 'deploy',
    model: 'ft:wechat:final',
    evalSet: 'wechat-publish-eval',
    passRate: 89,
    score: 0.91,
    decision: 'deploy'
  }
];

const statusColor: Record<TrainingJobRow['status'], string> = {
  queued: 'default',
  running: 'processing',
  succeeded: 'success'
};

const decisionColor: Record<EvalRow['decision'], string> = {
  baseline: 'default',
  candidate: 'processing',
  deploy: 'success'
};

const jobColumns: ColumnsType<TrainingJobRow> = [
  {
    title: 'Job',
    dataIndex: 'jobId',
    render: (value: string) => <strong>{value}</strong>
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
    render: (value: TrainingJobRow['status']) => <Tag color={statusColor[value]}>{value}</Tag>
  },
  {
    title: 'Train / Valid',
    render: (_, row) => row.status === 'queued' ? '-' : `${row.trainLoss.toFixed(2)} / ${row.validLoss.toFixed(2)}`
  },
  {
    title: 'Checkpoint',
    dataIndex: 'checkpoint'
  }
];

const evalColumns: ColumnsType<EvalRow> = [
  {
    title: 'Model',
    dataIndex: 'model',
    render: (value: string) => <strong>{value}</strong>
  },
  {
    title: 'Eval Set',
    dataIndex: 'evalSet'
  },
  {
    title: 'Pass Rate',
    dataIndex: 'passRate',
    render: (value: number) => <Progress percent={value} size="small" />
  },
  {
    title: 'Score',
    dataIndex: 'score',
    render: (value: number) => value.toFixed(2)
  },
  {
    title: 'Decision',
    dataIndex: 'decision',
    render: (value: EvalRow['decision']) => <Tag color={decisionColor[value]}>{value}</Tag>
  }
];

const OpenAiTrainingManagementPage = () => (
  <LifePageShell
    className="openai-training-page"
    eyebrow="OpenAI / Training Management"
    title="OpenAI 训练管理"
    actions={<Tag color="cyan">学习蓝图</Tag>}
  >
    <section className="openai-training-overview">
      {lifecycleStages.map(stage => (
        <div key={stage.key}>
          <span>{stage.icon}</span>
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

    <Card className="openai-training-panel" title="训练任务观测">
      <Table
        columns={jobColumns}
        dataSource={jobRows}
        pagination={false}
        size="middle"
        scroll={{ x: 760 }}
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

      <Card className="openai-training-panel" title="下一步实现">
        <div className="openai-training-next">
          <div>
            <ApiOutlined />
            <strong>one-service API</strong>
            <p>提供 dataset、job、metric、checkpoint、eval、deployment 的只读接口。</p>
          </div>
          <div>
            <LineChartOutlined />
            <strong>Mongo 持久化</strong>
            <p>保存训练任务状态、指标、评测结果和上线绑定历史。</p>
          </div>
          <div>
            <CheckCircleOutlined />
            <strong>上线门禁</strong>
            <p>用 eval pass rate 和失败案例决定模型是否进入灰度或回滚。</p>
          </div>
        </div>
      </Card>
    </section>
  </LifePageShell>
);

export default OpenAiTrainingManagementPage;
