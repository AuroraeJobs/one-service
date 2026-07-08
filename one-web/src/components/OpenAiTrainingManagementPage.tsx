import { useCallback, useEffect, useState } from 'react';
import { Alert, Card, Progress, Spin, Table, Tag, Typography, message } from 'antd';
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
import {
  openAiTrainingApi,
  type OpenAiTrainingCheckpoint,
  type OpenAiTrainingCostItem,
  type OpenAiTrainingDataset,
  type OpenAiTrainingDeploymentBinding,
  type OpenAiTrainingEvalFailureCase,
  type OpenAiTrainingEvalRun,
  type OpenAiTrainingJob,
  type OpenAiTrainingManagementDashboard,
  type OpenAiTrainingMetric
} from '../services/api';
import './OpenAiTrainingManagementPage.css';

const { Text } = Typography;

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
    render: (value?: number) => value === undefined ? '-' : value.toLocaleString('zh-CN')
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
    render: (_, row) => row.trainLoss === undefined || row.validLoss === undefined
      ? '-'
      : `${row.trainLoss.toFixed(2)} / ${row.validLoss.toFixed(2)}`
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
    render: (value?: number) => value === undefined ? '-' : value.toLocaleString('zh-CN')
  },
  {
    title: 'Train Loss',
    dataIndex: 'trainLoss',
    render: (value?: number) => value === undefined ? '-' : value.toFixed(2)
  },
  {
    title: 'Valid Loss',
    dataIndex: 'validLoss',
    render: (value?: number) => value === undefined ? '-' : value.toFixed(2)
  },
  {
    title: 'Token Accuracy',
    dataIndex: 'validTokenAccuracy',
    render: (value?: number) => (
      <Progress percent={value === undefined ? 0 : Math.round(value * 100)} size="small" />
    )
  },
  {
    title: 'Elapsed',
    dataIndex: 'elapsedSeconds',
    render: (value?: number) => value === undefined ? '-' : `${value}s`
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
    render: (value?: number) => value === undefined ? '-' : value.toLocaleString('zh-CN')
  },
  {
    title: 'Valid Loss',
    dataIndex: 'validLoss',
    render: (value?: number) => value === undefined ? '-' : value.toFixed(2)
  },
  {
    title: 'Token Accuracy',
    dataIndex: 'validTokenAccuracy',
    render: (value?: number) => (
      <Progress percent={value === undefined ? 0 : Math.round(value * 100)} size="small" />
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
    render: (value?: number) => <Progress percent={value || 0} size="small" />
  },
  {
    title: 'Score',
    dataIndex: 'score',
    render: (value?: number) => value === undefined ? '-' : value.toFixed(2)
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
    render: (value?: number) => value === undefined ? '-' : value.toLocaleString('zh-CN')
  },
  {
    title: 'Output Tokens',
    dataIndex: 'outputTokens',
    render: (value?: number) => value === undefined ? '-' : value.toLocaleString('zh-CN')
  },
  {
    title: 'Estimated USD',
    dataIndex: 'estimatedUsd',
    render: (value?: number) => value === undefined ? '-' : `$${value.toFixed(2)}`
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

const OpenAiTrainingManagementPage = () => {
  const [dashboard, setDashboard] = useState<OpenAiTrainingManagementDashboard>({});
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      setDashboard(await openAiTrainingApi.dashboard());
    } catch (error) {
      console.error('加载 OpenAI 训练管理数据失败:', error);
      message.error('OpenAI 训练管理数据加载失败');
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
  const deploymentRows = dashboard.deploymentBindings || [];
  const readinessChecks = dashboard.readinessChecks || [];
  const nextActions = dashboard.nextActions || [];

  return (
    <LifePageShell
      className="openai-training-page"
      eyebrow="OpenAI / Training Management"
      title="OpenAI 训练管理"
      actions={<Tag color="cyan">one-service API</Tag>}
    >
      <Spin spinning={loading}>
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
