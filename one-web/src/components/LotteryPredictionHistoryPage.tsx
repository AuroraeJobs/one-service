import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Space, Spin, Tag, message } from 'antd';
import { ExperimentOutlined, HistoryOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import { lotteryPredictionApi, type LotteryPredictionSnapshot } from '../services/api';
import './LotteryOverviewPage.css';

const formatTime = (value?: number) => {
  if (!value) {
    return '未记录';
  }
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
};

const numberBalls = (redNumbers: string[] = [], blueNumber?: string) => (
  <div className="lottery-balls">
    {redNumbers.map(number => (
      <span className="lottery-ball lottery-ball-red" key={number}>{number}</span>
    ))}
    {blueNumber ? <span className="lottery-ball lottery-ball-blue">{blueNumber}</span> : null}
  </div>
);

const resultTone = (prediction: LotteryPredictionSnapshot) => {
  if (!prediction.result) {
    return <Tag>待开奖</Tag>;
  }
  const won = prediction.result.prizeName !== '未中奖';
  return (
    <Tag color={won ? 'blue' : 'default'}>
      {prediction.result.prizeName} · 红 {prediction.result.redHits}/6 · {prediction.result.blueHit ? '蓝中' : '蓝未中'}
    </Tag>
  );
};

const LotteryPredictionHistoryPage = () => {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState<LotteryPredictionSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const loadHistory = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const items = await lotteryPredictionApi.history({ limit: 50 });
      setPredictions(items);
    } catch (requestError) {
      console.error('读取彩票预测历史失败:', requestError);
      setError('预测历史读取失败，请检查后端服务');
      message.error('预测历史读取失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const summary = useMemo(() => {
    const withActual = predictions.filter(item => item.result).length;
    const won = predictions.filter(item => item.result && item.result.prizeName !== '未中奖').length;
    const latest = predictions[0];
    return { withActual, won, latest };
  }, [predictions]);

  return (
    <LifePageShell
      className="lottery-prediction-page"
      eyebrow="彩票数据"
      title="预测历史"
      actions={
        <Space wrap>
          <Button type="primary" icon={<ExperimentOutlined />} onClick={() => navigate('/lottery/prediction')}>
            训练预测
          </Button>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadHistory}>
            刷新
          </Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}
      <section className="lottery-history-summary-grid">
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <HistoryOutlined />
            <div>
              <strong>{predictions.length}</strong>
              <span>历史快照</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <ThunderboltOutlined />
            <div>
              <strong>{summary.withActual}</strong>
              <span>已回填结果</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <ExperimentOutlined />
            <div>
              <strong>{summary.won}</strong>
              <span>命中奖级</span>
            </div>
          </div>
        </Card>
      </section>

      <Card className="life-panel-card lottery-prediction-panel">
        <div className="lottery-card-title-row">
          <HistoryOutlined />
          <div>
            <h2>最近预测快照</h2>
            <p>最新目标期 {summary.latest?.targetPeriod || '暂无'}，更新时间 {formatTime(summary.latest?.updatedAt || summary.latest?.createdAt)}</p>
          </div>
        </div>
        <Spin spinning={loading}>
          {predictions.length === 0 && !loading ? (
            <Empty description="暂无预测历史" />
          ) : (
            <div className="lottery-history-list">
              {predictions.map(prediction => (
                <article className="lottery-history-card" key={prediction.id || `${prediction.targetPeriod}-${prediction.title}`}>
                  <div className="lottery-prediction-card-head">
                    <div>
                      <strong>{prediction.title || `第 ${prediction.targetPeriod} 期预测`}</strong>
                      <span>
                        基于第 {prediction.basedOnPeriod || '-'} 期 · 目标第 {prediction.targetPeriod || '-'} 期 · {formatTime(prediction.createdAt)}
                      </span>
                    </div>
                    {resultTone(prediction)}
                  </div>
                  {numberBalls(prediction.redNumbers, prediction.blueNumber)}
                  <div className="lottery-prediction-tags">
                    <span>评分 {prediction.score ?? '-'}</span>
                    <span>{prediction.ruleName || prediction.ruleId || '未记录规则'}</span>
                    <span>候选 {prediction.candidates?.length || 0} 组</span>
                  </div>
                  {prediction.reason ? <p>{prediction.reason}</p> : null}
                </article>
              ))}
            </div>
          )}
        </Spin>
      </Card>
    </LifePageShell>
  );
};

export default LotteryPredictionHistoryPage;
