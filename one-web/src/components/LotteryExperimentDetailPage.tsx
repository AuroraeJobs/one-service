import { useEffect, useState } from 'react';
import { Alert, Button, Card, Descriptions, Empty, Input, Space, Spin, Tag, message } from 'antd';
import { ArrowLeftOutlined, BarChartOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import LotteryBalls from './lottery/LotteryBalls';
import { lotteryExperimentApi, type LotteryStrategyExperiment } from '../services/api';
import './LotteryOverviewPage.css';

const formatTime = (value?: number) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
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

const LotteryExperimentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [experiment, setExperiment] = useState<LotteryStrategyExperiment>();
  const [tagsText, setTagsText] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const loadDetail = async () => {
    if (!id) {
      setError('缺少实验 ID');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const item = await lotteryExperimentApi.detail(id);
      setExperiment(item);
      setTagsText((item.tags || []).join(' '));
      setNotes(item.notes || '');
    } catch (requestError) {
      console.error('读取策略实验详情失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取策略实验详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const saveNotes = async () => {
    if (!id) return;
    setSaving(true);
    setError(undefined);
    try {
      const updated = await lotteryExperimentApi.updateNotes(id, {
        tags: splitTags(tagsText),
        notes
      });
      setExperiment(updated);
      message.success('实验备注已更新');
    } catch (requestError) {
      console.error('更新策略实验备注失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '更新策略实验备注失败');
      message.error('更新策略实验备注失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <LifePageShell
      className="lottery-prediction-page"
      eyebrow="彩票数据"
      title="实验详情"
      actions={
        <Space wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/lottery/experiments')}>
            返回实验室
          </Button>
          {id ? (
            <Button icon={<BarChartOutlined />} onClick={() => navigate(`/lottery/research?items=experiment:${id}`)}>
              加入对比
            </Button>
          ) : null}
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadDetail}>
            刷新
          </Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}
      <Spin spinning={loading}>
        {!experiment && !loading ? (
          <Card className="life-panel-card">
            <Empty description="未找到实验记录" />
          </Card>
        ) : experiment ? (
          <section className="lottery-detail-grid">
            <Card className="life-panel-card lottery-detail-main-card" title={experiment.strategyName || '未命名实验'}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="规模">{experiment.scale || '-'}</Descriptions.Item>
                <Descriptions.Item label="回放窗口">{experiment.replayWindow || 0}</Descriptions.Item>
                <Descriptions.Item label="输入来源">{experiment.inputSource || '-'}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{formatTime(experiment.createdAt)}</Descriptions.Item>
                <Descriptions.Item label="最佳规则">{experiment.bestRule?.name || '-'}</Descriptions.Item>
                <Descriptions.Item label="最佳分">{experiment.outcomeSummary?.bestScore ?? '-'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card className="life-panel-card lottery-detail-main-card" title="分数分布">
              <div className="lottery-prediction-tags">
                {Object.entries(experiment.scoreDistribution || {}).map(([name, score]) => (
                  <span key={name}>{name}: {score}</span>
                ))}
              </div>
            </Card>

            <Card className="life-panel-card lottery-detail-main-card" title="候选号码">
              <div className="lottery-detail-candidate-grid">
                {(experiment.generatedCandidates || []).map(candidate => (
                  <article className="lottery-history-card" key={candidate.title}>
                    <strong>{candidate.title}</strong>
                    <LotteryBalls redNumbers={candidate.redNumbers || []} blueNumber={candidate.blueNumber || ''} />
                    <div className="lottery-prediction-tags">
                      <span>评分 {candidate.score ?? '-'}</span>
                    </div>
                  </article>
                ))}
              </div>
            </Card>

            <Card className="life-panel-card lottery-detail-main-card" title="备注与标签">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input value={tagsText} onChange={event => setTagsText(event.target.value)} placeholder="标签，空格或逗号分隔" />
                <Input.TextArea rows={4} value={notes} onChange={event => setNotes(event.target.value)} />
                <Space wrap>
                  {(experiment.tags || []).map(tag => <Tag key={tag}>{tag}</Tag>)}
                  <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={saveNotes}>
                    保存
                  </Button>
                </Space>
              </Space>
            </Card>
          </section>
        ) : null}
      </Spin>
    </LifePageShell>
  );
};

export default LotteryExperimentDetailPage;
