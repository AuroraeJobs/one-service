import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Form, Input, InputNumber, Modal, Pagination, Select, Space, Spin, Tag, message } from 'antd';
import { BarChartOutlined, ExperimentOutlined, HistoryOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import {
  lotteryExperimentApi,
  type LotteryExperimentRunRequest,
  type LotteryPageResponse,
  type LotteryStrategyExperiment
} from '../services/api';
import './LotteryOverviewPage.css';

const formatTime = (value?: number) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
};

const splitTags = (value?: string) => (value || '')
  .split(/[\s,，]+/)
  .map(item => item.trim())
  .filter(Boolean);

const LotteryExperimentPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm<LotteryExperimentRunRequest & { tagsText?: string }>();
  const [experiments, setExperiments] = useState<LotteryStrategyExperiment[]>([]);
  const [pageResponse, setPageResponse] = useState<LotteryPageResponse<LotteryStrategyExperiment>>();
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string>();

  const page = Math.max(0, Number(searchParams.get('page') || '0') || 0);
  const pageSize = Math.max(1, Number(searchParams.get('pageSize') || '10') || 10);
  const strategyName = searchParams.get('strategyName') || '';
  const tag = searchParams.get('tag') || '';

  const updateQuery = useCallback((patch: Record<string, string | number | undefined>, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    if (resetPage && !Object.prototype.hasOwnProperty.call(patch, 'page')) {
      next.delete('page');
    }
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const loadExperiments = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await lotteryExperimentApi.experiments({
        page,
        pageSize,
        strategyName: strategyName.trim() || undefined,
        tag: tag.trim() || undefined
      });
      setPageResponse(response);
      setExperiments(response.items || []);
    } catch (requestError) {
      console.error('读取策略实验失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取策略实验失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, strategyName, tag]);

  useEffect(() => {
    loadExperiments();
  }, [loadExperiments]);

  const summary = useMemo(() => {
    const latest = experiments[0];
    const bestScore = experiments.reduce((max, item) => Math.max(max, item.outcomeSummary?.bestScore || 0), 0);
    return { latest, bestScore };
  }, [experiments]);

  const runExperiment = async () => {
    const values = await form.validateFields();
    setRunning(true);
    setError(undefined);
    try {
      const experiment = await lotteryExperimentApi.run({
        strategyName: values.strategyName,
        replayWindow: values.replayWindow,
        scale: values.scale,
        inputSource: values.inputSource,
        tags: splitTags(values.tagsText),
        notes: values.notes
      });
      message.success('策略实验已保存');
      setModalOpen(false);
      form.resetFields();
      await loadExperiments();
      if (experiment.id) {
        navigate(`/lottery/experiments/${experiment.id}`);
      }
    } catch (requestError) {
      console.error('运行策略实验失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '运行策略实验失败');
      message.error('运行策略实验失败');
    } finally {
      setRunning(false);
    }
  };

  return (
    <LifePageShell
      className="lottery-prediction-page"
      eyebrow="彩票数据"
      title="策略实验室"
      actions={
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            新建实验
          </Button>
          <Button icon={<BarChartOutlined />} onClick={() => navigate('/lottery/research')}>
            研究对比
          </Button>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="策略名称"
            value={strategyName}
            onChange={event => updateQuery({ strategyName: event.target.value })}
            style={{ width: 160 }}
          />
          <Input
            allowClear
            prefix={<HistoryOutlined />}
            placeholder="标签"
            value={tag}
            onChange={event => updateQuery({ tag: event.target.value })}
            style={{ width: 130 }}
          />
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadExperiments}>
            刷新
          </Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}

      <section className="lottery-history-summary-grid">
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <ExperimentOutlined />
            <div>
              <strong>{pageResponse?.total || 0}</strong>
              <span>实验记录</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <ExperimentOutlined />
            <div>
              <strong>{summary.bestScore}</strong>
              <span>当前页最高分</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <ExperimentOutlined />
            <div>
              <strong>{summary.latest?.strategyName || '-'}</strong>
              <span>最近实验</span>
            </div>
          </div>
        </Card>
      </section>

      <Card className="life-panel-card lottery-prediction-panel">
        <Spin spinning={loading}>
          <div className="lottery-history-list">
            {experiments.map(experiment => (
              <article className="lottery-history-card" key={experiment.id}>
                <div className="lottery-prediction-card-head">
                  <div>
                    <strong>{experiment.strategyName || '未命名实验'}</strong>
                    <span>{experiment.scale || 'standard'} · 回放 {experiment.replayWindow || 0} · {formatTime(experiment.createdAt)}</span>
                  </div>
                  <Tag color="processing">{experiment.outcomeSummary?.bestScore ?? 0} 分</Tag>
                </div>
                <div className="lottery-prediction-tags">
                  <span>{experiment.bestRule?.name || '未记录规则'}</span>
                  <span>候选 {experiment.generatedCandidates?.length || 0} 组</span>
                  <span>{experiment.inputSource || 'training-service'}</span>
                </div>
                <Space wrap>
                  {(experiment.tags || []).map(item => <Tag key={item}>{item}</Tag>)}
                </Space>
                {experiment.notes ? <p>{experiment.notes}</p> : null}
                <div className="lottery-history-card-actions">
                  {experiment.id ? (
                    <Button size="small" icon={<BarChartOutlined />} onClick={() => navigate(`/lottery/research?items=experiment:${experiment.id}`)}>
                      加入对比
                    </Button>
                  ) : null}
                  <Button size="small" icon={<ExperimentOutlined />} onClick={() => navigate(`/lottery/experiments/${experiment.id}`)}>
                    查看详情
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </Spin>
        <Pagination
          className="lottery-list-pagination"
          current={page + 1}
          pageSize={pageSize}
          total={pageResponse?.total || 0}
          showSizeChanger
          showTotal={total => `共 ${total} 条`}
          onChange={(nextPage, nextPageSize) => updateQuery({ page: nextPage - 1, pageSize: nextPageSize }, false)}
        />
      </Card>

      <Modal
        title="新建策略实验"
        open={modalOpen}
        okText="运行"
        cancelText="取消"
        confirmLoading={running}
        onOk={runExperiment}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical" initialValues={{ replayWindow: 30, scale: 'standard', inputSource: 'training-service' }}>
          <Form.Item name="strategyName" label="策略名称" rules={[{ required: true, message: '请输入策略名称' }]}>
            <Input placeholder="例如 近期平衡试验" />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="replayWindow" label="回放窗口" style={{ width: '50%' }}>
              <InputNumber min={1} max={500} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="scale" label="规模" style={{ width: '50%' }}>
              <Select
                options={[
                  { label: 'fast', value: 'fast' },
                  { label: 'standard', value: 'standard' },
                  { label: 'deep', value: 'deep' }
                ]}
              />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="inputSource" label="输入来源">
            <Input />
          </Form.Item>
          <Form.Item name="tagsText" label="标签">
            <Input placeholder="空格或逗号分隔" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </LifePageShell>
  );
};

export default LotteryExperimentPage;
