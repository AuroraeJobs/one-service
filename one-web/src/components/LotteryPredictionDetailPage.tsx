import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Descriptions, Empty, Space, Spin, Tag, message } from 'antd';
import { ArrowLeftOutlined, HistoryOutlined, ReloadOutlined, TrophyOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import LotteryBalls from './lottery/LotteryBalls';
import {
  lotteryPreferenceApi,
  lotteryPredictionApi,
  lotteryTicketApi,
  type LotteryPredictionCandidate,
  type LotteryPredictionSnapshot,
  type LotteryPreference
} from '../services/api';
import './LotteryOverviewPage.css';

const formatTime = (value?: number) => {
  if (!value) {
    return '未记录';
  }
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
};

const scoreTag = (result?: LotteryPredictionCandidate['result']) => {
  if (!result) {
    return <Tag>待开奖</Tag>;
  }
  return (
    <Tag color={result.prizeName === '未中奖' ? 'default' : 'blue'}>
      {result.prizeName} · 红 {result.redHits}/6 · {result.blueHit ? '蓝中' : '蓝未中'} · {result.score} 分
    </Tag>
  );
};

const LotteryPredictionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState<LotteryPredictionSnapshot>();
  const [preference, setPreference] = useState<LotteryPreference>();
  const [loading, setLoading] = useState(true);
  const [savingTicketKey, setSavingTicketKey] = useState<string>();
  const [batchSaving, setBatchSaving] = useState(false);
  const [error, setError] = useState<string>();

  const loadDetail = async () => {
    if (!id) {
      setError('缺少预测快照 ID');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const item = await lotteryPredictionApi.detail(id);
      if (!item?.id && !item?.targetPeriod) {
        setPrediction(undefined);
        setError('未找到预测快照');
        return;
      }
      setPrediction(item);
    } catch (requestError) {
      console.error('读取彩票预测详情失败:', requestError);
      setError('预测详情读取失败，请检查后端服务');
      message.error('预测详情读取失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  useEffect(() => {
    lotteryPreferenceApi.preference()
      .then(setPreference)
      .catch(requestError => {
        console.warn('读取彩票偏好失败:', requestError);
      });
  }, []);

  const hitRedNumbers = useMemo(() => prediction?.actualRecord?.redNumbers || [], [prediction?.actualRecord?.redNumbers]);
  const hitBlueNumber = prediction?.actualRecord?.blueNumber;

  const saveAsTicket = async (
    ticketKey: string,
    title: string,
    redNumbers: string[],
    blueNumber: string,
    score?: number
  ) => {
    if (!prediction?.targetPeriod) {
      message.error('缺少目标期号，无法保存票据');
      return;
    }
    setSavingTicketKey(ticketKey);
    setError(undefined);
    try {
      await lotteryTicketApi.saveTicket({
        issue: String(prediction.targetPeriod),
        redNumbers,
        blueNumber,
        quantity: 1,
        cost: 2,
        source: preference?.defaultTicketSource || 'PREDICTION',
        status: 'DRAFT',
        predictionSnapshotId: prediction.id,
        note: `${title} · 预测评分 ${score ?? '-'}`
      });
      message.success('已保存为彩票票据');
    } catch (requestError) {
      console.error('保存预测票据失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '保存预测票据失败');
      message.error('保存预测票据失败');
    } finally {
      setSavingTicketKey(undefined);
    }
  };

  const saveAllAsTickets = async () => {
    if (!prediction?.targetPeriod) {
      message.error('缺少目标期号，无法保存票据');
      return;
    }
    const tickets = [
      {
        title: prediction.title || '主预测',
        redNumbers: prediction.redNumbers || [],
        blueNumber: prediction.blueNumber || '',
        score: prediction.score
      },
      ...(prediction.candidates || []).map(candidate => ({
        title: candidate.title,
        redNumbers: candidate.redNumbers || [],
        blueNumber: candidate.blueNumber || '',
        score: candidate.score
      }))
    ].filter(item => item.redNumbers.length === 6 && item.blueNumber);
    if (!tickets.length) {
      message.warning('暂无可保存的预测号码');
      return;
    }
    setBatchSaving(true);
    setError(undefined);
    try {
      const result = await lotteryTicketApi.saveTickets(tickets.map(ticket => ({
        issue: String(prediction.targetPeriod),
        redNumbers: ticket.redNumbers,
        blueNumber: ticket.blueNumber,
        quantity: 1,
        cost: 2,
        source: preference?.defaultTicketSource || 'PREDICTION',
        status: 'DRAFT',
        predictionSnapshotId: prediction.id,
        note: `${ticket.title} · 预测评分 ${ticket.score ?? '-'}`
      })));
      message.success(`已保存 ${result.savedCount || 0} 注，跳过重复 ${result.duplicateCount || 0} 注`);
    } catch (requestError) {
      console.error('批量保存预测票据失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '批量保存预测票据失败');
      message.error('批量保存预测票据失败');
    } finally {
      setBatchSaving(false);
    }
  };

  return (
    <LifePageShell
      className="lottery-prediction-page"
      eyebrow="彩票数据"
      title="预测详情"
      actions={
        <Space wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/lottery/predictions/history')}>
            返回历史
          </Button>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadDetail}>
            刷新
          </Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}
      <Spin spinning={loading}>
        {!prediction && !loading ? (
          <Card className="life-panel-card">
            <Empty description="未找到预测详情" />
          </Card>
        ) : prediction ? (
          <section className="lottery-detail-grid">
            <Card className="life-panel-card lottery-prediction-panel lottery-detail-main-card">
              <div className="lottery-card-title-row">
                <TrophyOutlined />
                <div>
                  <h2>{prediction.title || `第 ${prediction.targetPeriod} 期预测`}</h2>
                  <p>基于第 {prediction.basedOnPeriod || '-'} 期，目标第 {prediction.targetPeriod || '-'} 期</p>
                </div>
              </div>
              <LotteryBalls
                redNumbers={prediction.redNumbers || []}
                blueNumber={prediction.blueNumber || ''}
                hitRedNumbers={hitRedNumbers}
                hitBlueNumber={hitBlueNumber}
              />
              <div className="lottery-prediction-tags">
                <span>评分 {prediction.score ?? '-'}</span>
                <span>{prediction.ruleName || prediction.ruleId || '未记录规则'}</span>
                <span>{formatTime(prediction.createdAt)}</span>
              </div>
              {prediction.reason ? <p>{prediction.reason}</p> : null}
              <div className="lottery-detail-result-line">
                {scoreTag(prediction.result)}
                <Button
                  size="small"
                  type="primary"
                  loading={savingTicketKey === 'primary'}
                  onClick={() => saveAsTicket(
                    'primary',
                    prediction.title || '主预测',
                    prediction.redNumbers || [],
                    prediction.blueNumber || '',
                    prediction.score
                  )}
                >
                  保存为票据
                </Button>
                <Button
                  size="small"
                  loading={batchSaving}
                  onClick={saveAllAsTickets}
                >
                  保存全部候选
                </Button>
              </div>
            </Card>

            <Card className="life-panel-card lottery-prediction-panel">
              <div className="lottery-card-title-row">
                <HistoryOutlined />
                <div>
                  <h2>规则与结果</h2>
                  <p>查看规则、保存时间和实际开奖反馈。</p>
                </div>
              </div>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="规则 ID">{prediction.ruleId || '-'}</Descriptions.Item>
                <Descriptions.Item label="规则名称">{prediction.ruleName || '-'}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{formatTime(prediction.createdAt)}</Descriptions.Item>
                <Descriptions.Item label="更新时间">{formatTime(prediction.updatedAt)}</Descriptions.Item>
                <Descriptions.Item label="实际期号">{prediction.actualRecord?.period || '-'}</Descriptions.Item>
              </Descriptions>
              <div className="lottery-detail-actual-card">
                {prediction.actualRecord?.redNumbers?.length ? (
                  <>
                    <strong>实际开奖号</strong>
                    <LotteryBalls redNumbers={prediction.actualRecord.redNumbers} blueNumber={prediction.actualRecord.blueNumber} />
                  </>
                ) : (
                  <span>尚未回填实际开奖结果</span>
                )}
              </div>
            </Card>

            <Card className="life-panel-card lottery-prediction-panel lottery-detail-candidates-card">
              <div className="lottery-card-title-row">
                <HistoryOutlined />
                <div>
                  <h2>候选号码</h2>
                  <p>共 {prediction.candidates?.length || 0} 组候选，包含各自评分和命中结果。</p>
                </div>
              </div>
              {prediction.candidates?.length ? (
                <div className="lottery-detail-candidate-grid">
                  {prediction.candidates.map(candidate => (
                    <article className="lottery-history-card" key={`${candidate.title}-${candidate.blueNumber}`}>
                      <div className="lottery-prediction-card-head">
                        <div>
                          <strong>{candidate.title}</strong>
                          <span>评分 {candidate.score}</span>
                        </div>
                        {scoreTag(candidate.result)}
                      </div>
                      <LotteryBalls
                        redNumbers={candidate.redNumbers || []}
                        blueNumber={candidate.blueNumber || ''}
                        hitRedNumbers={hitRedNumbers}
                        hitBlueNumber={hitBlueNumber}
                      />
                      <div className="lottery-history-card-actions">
                        <Button
                          size="small"
                          loading={savingTicketKey === `${candidate.title}-${candidate.blueNumber}`}
                          onClick={() => saveAsTicket(
                            `${candidate.title}-${candidate.blueNumber}`,
                            candidate.title,
                            candidate.redNumbers || [],
                            candidate.blueNumber || '',
                            candidate.score
                          )}
                        >
                          保存为票据
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <Empty description="暂无候选号码" />
              )}
            </Card>
          </section>
        ) : null}
      </Spin>
    </LifePageShell>
  );
};

export default LotteryPredictionDetailPage;
