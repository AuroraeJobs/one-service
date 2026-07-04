import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Form, Input, InputNumber, Modal, Select, Space, Spin, Tag, message } from 'antd';
import {
  AppstoreOutlined,
  BarChartOutlined,
  BookOutlined,
  ExperimentOutlined,
  FileAddOutlined,
  PieChartOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import {
  lotteryStrategyPortfolioApi,
  type LotteryStrategyPortfolio,
  type LotteryStrategyPortfolioEvidenceLink,
  type LotteryStrategyPortfolioSummary
} from '../services/api';
import './LotteryOverviewPage.css';

type SortKey = 'health' | 'roi' | 'coverage' | 'warnings' | 'updated';

const evidenceTypes = [
  { label: '规则', value: 'RULE' },
  { label: '实验', value: 'EXPERIMENT' },
  { label: '回测', value: 'BACKTEST' },
  { label: '决策', value: 'DECISION' },
  { label: '笔记', value: 'NOTE' }
];

const typeIcon = (type?: string) => {
  if (type === 'RULE') return <ThunderboltOutlined />;
  if (type === 'EXPERIMENT') return <ExperimentOutlined />;
  if (type === 'BACKTEST') return <BarChartOutlined />;
  if (type === 'DECISION') return <SafetyCertificateOutlined />;
  if (type === 'NOTE') return <BookOutlined />;
  return <AppstoreOutlined />;
};

const typeColor = (type?: string) => {
  if (type === 'RULE') return 'gold';
  if (type === 'EXPERIMENT') return 'cyan';
  if (type === 'BACKTEST') return 'blue';
  if (type === 'DECISION') return 'magenta';
  if (type === 'NOTE') return 'purple';
  return 'default';
};

const statusColor = (status?: string) => {
  if (status === 'PASS' || status === 'ACTIVE') return 'green';
  if (status === 'WARNING' || status === 'PENDING' || status === 'MANUAL') return 'gold';
  if (status === 'FAILED' || status === 'MISSING') return 'red';
  return 'default';
};

const formatPercent = (value?: number) => {
  if (value === undefined || value === null) {
    return '-';
  }
  return `${Number(value).toFixed(2)}%`;
};

const formatTime = (value?: number) => {
  if (!value) {
    return '-';
  }
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
};

const defaultEvidence = (): LotteryStrategyPortfolioEvidenceLink[] => [
  { evidenceType: 'RULE', allocationWeight: 1 },
  { evidenceType: 'BACKTEST', allocationWeight: 1 },
  { evidenceType: 'DECISION', allocationWeight: 1 },
  { evidenceType: 'NOTE', allocationWeight: 1 }
];

const sortValue = (item: LotteryStrategyPortfolioSummary, key: SortKey) => {
  if (key === 'health') return item.healthScore || 0;
  if (key === 'roi') return item.roiPercent || -999;
  if (key === 'coverage') return item.evidenceCoveragePercent || 0;
  if (key === 'warnings') return -(item.warningCount || 0);
  return item.portfolio?.updatedAt || item.generatedAt || 0;
};

const LotteryStrategyPortfolioPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<LotteryStrategyPortfolio>();
  const [portfolios, setPortfolios] = useState<LotteryStrategyPortfolioSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('health');
  const [error, setError] = useState<string>();

  const loadPortfolios = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await lotteryStrategyPortfolioApi.portfolios({ includeArchived: showArchived, page: 1, pageSize: 50 });
      setPortfolios(response.items || []);
    } catch (requestError) {
      console.error('读取彩票策略组合失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取彩票策略组合失败');
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    loadPortfolios();
  }, [loadPortfolios]);

  const sortedPortfolios = useMemo(
    () => [...portfolios].sort((left, right) => sortValue(right, sortKey) - sortValue(left, sortKey)),
    [portfolios, sortKey]
  );

  const openCreateModal = () => {
    form.setFieldsValue({
      name: '',
      status: 'ACTIVE',
      allocationWeight: 1,
      tags: [],
      evidence: defaultEvidence()
    });
    setModalOpen(true);
  };

  const savePortfolio = async () => {
    const values = await form.validateFields();
    setSaving(true);
    setError(undefined);
    try {
      const saved = await lotteryStrategyPortfolioApi.create({
        ...values,
        evidence: (values.evidence || []).filter(item => item?.evidenceType || item?.sourceId || item?.title),
        tags: values.tags || []
      });
      setPortfolios(current => [saved, ...current]);
      setModalOpen(false);
      message.success('策略组合已创建');
    } catch (requestError) {
      console.error('创建彩票策略组合失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '创建彩票策略组合失败');
      message.error('创建策略组合失败');
    } finally {
      setSaving(false);
    }
  };

  const archivePortfolio = async (portfolioId?: string) => {
    if (!portfolioId) {
      return;
    }
    try {
      await lotteryStrategyPortfolioApi.archive(portfolioId);
      await loadPortfolios();
      message.success('策略组合已归档');
    } catch (requestError) {
      console.error('归档彩票策略组合失败:', requestError);
      message.error('归档策略组合失败');
    }
  };

  const portfolioTotals = useMemo(() => ({
    total: portfolios.length,
    pass: portfolios.filter(item => item.healthStatus === 'PASS').length,
    warnings: portfolios.reduce((sum, item) => sum + (item.warningCount || 0), 0),
    coverage: portfolios.length
      ? Math.round(portfolios.reduce((sum, item) => sum + (item.evidenceCoveragePercent || 0), 0) / portfolios.length)
      : 0
  }), [portfolios]);

  return (
    <LifePageShell
      className="lottery-prediction-page lottery-strategy-portfolio-page"
      eyebrow="彩票数据"
      title="策略组合"
      actions={
        <Space wrap>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadPortfolios}>刷新</Button>
          <Button type="primary" icon={<FileAddOutlined />} onClick={openCreateModal}>新组合</Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}
      <section className="lottery-portfolio-summary-grid">
        <article><strong>{portfolioTotals.total}</strong><span>组合</span></article>
        <article><strong>{portfolioTotals.pass}</strong><span>健康通过</span></article>
        <article><strong>{portfolioTotals.coverage}%</strong><span>平均覆盖</span></article>
        <article><strong>{portfolioTotals.warnings}</strong><span>警示</span></article>
      </section>

      <Card
        className="life-panel-card lottery-clean-panel"
        title={<Space><PieChartOutlined />分配看板</Space>}
        extra={
          <Space wrap>
            <Select
              size="small"
              value={sortKey}
              onChange={setSortKey}
              options={[
                { label: '健康分', value: 'health' },
                { label: 'ROI', value: 'roi' },
                { label: '覆盖率', value: 'coverage' },
                { label: '警示少', value: 'warnings' },
                { label: '最近更新', value: 'updated' }
              ]}
              style={{ width: 120 }}
            />
            <Button size="small" type={showArchived ? 'primary' : 'default'} onClick={() => setShowArchived(value => !value)}>
              归档
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading && !portfolios.length}>
          {sortedPortfolios.length ? (
            <div className="lottery-portfolio-grid">
              {sortedPortfolios.map(item => {
                const portfolio = item.portfolio;
                return (
                  <article key={portfolio?.id || portfolio?.name} className="lottery-portfolio-card">
                    <div className="lottery-portfolio-card-head">
                      <div>
                        <strong>{portfolio?.name || '策略组合'}</strong>
                        <span>{portfolio?.description || `权重 ${item.allocationWeight ?? portfolio?.allocationWeight ?? 1}`}</span>
                      </div>
                      <Tag color={statusColor(item.healthStatus)}>{item.healthStatus || 'UNKNOWN'}</Tag>
                    </div>
                    <div className="lottery-portfolio-score-row">
                      <button type="button" onClick={() => portfolio?.id && navigate(`/lottery/strategy-portfolios?id=${portfolio.id}`)}>
                        <strong>{item.healthScore ?? 0}</strong>
                        <span>健康</span>
                      </button>
                      <button type="button" onClick={() => navigate('/lottery/research')}>
                        <strong>{formatPercent(item.roiPercent)}</strong>
                        <span>ROI</span>
                      </button>
                      <button type="button" onClick={() => navigate('/lottery/research/notebook')}>
                        <strong>{item.evidenceCoveragePercent ?? 0}%</strong>
                        <span>覆盖</span>
                      </button>
                      <button type="button" onClick={() => navigate('/lottery/predictions/decision')}>
                        <strong>{item.warningCount ?? 0}</strong>
                        <span>警示</span>
                      </button>
                    </div>
                    <Space wrap size={4}>
                      <Tag color="gold">规则 {item.ruleCount || 0}</Tag>
                      <Tag color="cyan">实验 {item.experimentCount || 0}</Tag>
                      <Tag color="blue">回测 {item.backtestCount || 0}</Tag>
                      <Tag color="magenta">决策 {item.decisionCount || 0}</Tag>
                      <Tag color="purple">笔记 {item.noteCount || 0}</Tag>
                    </Space>
                    <div className="lottery-portfolio-evidence-list">
                      {(item.evidence || []).slice(0, 6).map(evidence => (
                        <button key={`${evidence.evidenceType}-${evidence.sourceId}-${evidence.title}`} type="button" onClick={() => navigate(evidence.path || '/lottery/research')}>
                          <Tag color={typeColor(evidence.evidenceType)}>{typeIcon(evidence.evidenceType)} {evidence.evidenceType || 'EVIDENCE'}</Tag>
                          <span>{evidence.title || evidence.sourceId || '组合证据'}</span>
                          <small>权重 {evidence.allocationWeight ?? 1} · 回放 {evidence.replayCount || 0} · {formatTime(evidence.updatedAt)}</small>
                        </button>
                      ))}
                    </div>
                    <Space wrap>
                      <Button size="small" icon={<SafetyCertificateOutlined />} onClick={() => navigate('/lottery/predictions/decision')}>
                        决策
                      </Button>
                      <Button size="small" icon={<BookOutlined />} onClick={() => navigate('/lottery/research/notebook')}>
                        笔记
                      </Button>
                      <Button size="small" danger onClick={() => archivePortfolio(portfolio?.id)}>
                        归档
                      </Button>
                    </Space>
                  </article>
                );
              })}
            </div>
          ) : (
            <Empty description="暂无策略组合" />
          )}
        </Spin>
      </Card>

      <Modal
        title="新建策略组合"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={savePortfolio}
        confirmLoading={saving}
        width={820}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="组合名称" rules={[{ required: true, message: '请输入组合名称' }]}>
            <Input placeholder="例如：稳态蓝球组合" />
          </Form.Item>
          <Form.Item name="description" label="说明">
            <Input.TextArea rows={2} placeholder="组合假设、适用期号或执行边界" />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="status" label="状态" style={{ width: '50%' }}>
              <Select options={[
                { label: '验证中', value: 'ACTIVE' },
                { label: '观察', value: 'WATCHING' },
                { label: '暂停', value: 'PAUSED' }
              ]} />
            </Form.Item>
            <Form.Item name="allocationWeight" label="组合权重" style={{ width: '50%' }}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Form.List name="evidence">
            {(fields, { add, remove }) => (
              <div className="lottery-portfolio-evidence-editor">
                <div className="lottery-card-title-row">
                  <div>
                    <h2>证据引用</h2>
                    <p>sourceId 可填写规则、实验、回测、决策或笔记记录 id；也可以先只填标题。</p>
                  </div>
                  <Button size="small" onClick={() => add({ evidenceType: 'RULE', allocationWeight: 1 })}>添加</Button>
                </div>
                {fields.map(field => (
                  <section key={field.key} className="lottery-portfolio-evidence-editor-row">
                    <Form.Item name={[field.name, 'evidenceType']} label="类型">
                      <Select options={evidenceTypes} />
                    </Form.Item>
                    <Form.Item name={[field.name, 'sourceId']} label="Source ID">
                      <Input placeholder="记录 id" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'title']} label="标题">
                      <Input placeholder="显示标题" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'allocationWeight']} label="权重">
                      <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                    </Form.Item>
                    <Button danger onClick={() => remove(field.name)}>删除</Button>
                  </section>
                ))}
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </LifePageShell>
  );
};

export default LotteryStrategyPortfolioPage;
