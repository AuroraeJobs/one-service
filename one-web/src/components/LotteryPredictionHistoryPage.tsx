import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Input, Pagination, Select, Space, Spin, Tag, message } from 'antd';
import { ExperimentOutlined, HistoryOutlined, ReloadOutlined, SafetyCertificateOutlined, ThunderboltOutlined, TrophyOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import { lotteryPredictionApi, type LotteryPageResponse, type LotteryPredictionSnapshot } from '../services/api';
import { lotteryEvidenceColor, lotteryEvidenceLabel, lotteryReplayText } from '../utils/lotteryEvidence';
import { lotteryViewStateKeys, useLotterySavedViewState } from '../utils/lotteryViewState';
import './LotteryOverviewPage.css';

const predictionHistoryViewKeys = ['page', 'pageSize', 'resultState', 'targetPeriod', 'ruleId', 'ruleName'];

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

const evidenceTone = (prediction: LotteryPredictionSnapshot) => (
  <Tag color={lotteryEvidenceColor(prediction.evidence?.tag)}>
    {lotteryEvidenceLabel(prediction.evidence)}
  </Tag>
);

const LotteryPredictionHistoryPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [predictions, setPredictions] = useState<LotteryPredictionSnapshot[]>([]);
  const [pageResponse, setPageResponse] = useState<LotteryPageResponse<LotteryPredictionSnapshot>>();
  const [loading, setLoading] = useState(true);
  const [attachingLatest, setAttachingLatest] = useState(false);
  const [error, setError] = useState<string>();

  useLotterySavedViewState(lotteryViewStateKeys.predictionHistory, searchParams, setSearchParams, predictionHistoryViewKeys);

  const page = Math.max(1, Number(searchParams.get('page') || '1') || 1);
  const pageSize = Math.max(1, Number(searchParams.get('pageSize') || '10') || 10);
  const resultState = searchParams.get('resultState') || 'ALL';
  const targetPeriodValue = searchParams.get('targetPeriod') || '';
  const ruleName = searchParams.get('ruleName') || '';
  const ruleId = searchParams.get('ruleId') || '';

  const updateQuery = useCallback((patch: Record<string, string | number | undefined>, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === 'ALL') {
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

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const targetPeriod = Number(targetPeriodValue);
      const response = await lotteryPredictionApi.historyPage({
        page,
        pageSize,
        resultState,
        targetPeriod: Number.isFinite(targetPeriod) && targetPeriod > 0 ? targetPeriod : undefined,
        ruleId: ruleId.trim() || undefined,
        ruleName: ruleName.trim() || undefined
      });
      setPageResponse(response);
      setPredictions(response.items || []);
    } catch (requestError) {
      console.error('读取彩票预测历史失败:', requestError);
      setError('预测历史读取失败，请检查后端服务');
      message.error('预测历史读取失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, resultState, ruleId, ruleName, targetPeriodValue]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const summary = useMemo(() => {
    const withActual = predictions.filter(item => item.result).length;
    const won = predictions.filter(item => item.result && item.result.prizeName !== '未中奖').length;
    const trusted = predictions.filter(item => item.evidence?.tag === 'STABLE').length;
    const latest = predictions[0];
    return { withActual, won, trusted, latest };
  }, [predictions]);

  const attachLatestActual = async () => {
    setAttachingLatest(true);
    setError(undefined);
    try {
      const updated = await lotteryPredictionApi.attachLatestActual();
      message.success(`已回填 ${updated.length || 0} 条预测`);
      await loadHistory();
    } catch (requestError) {
      console.error('回填最新开奖结果失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '回填最新开奖结果失败');
      message.error('回填最新开奖结果失败');
    } finally {
      setAttachingLatest(false);
    }
  };

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
          <Button icon={<TrophyOutlined />} loading={attachingLatest} onClick={attachLatestActual}>
            回填最新开奖
          </Button>
          <Select
            value={resultState}
            onChange={value => updateQuery({ resultState: value })}
            style={{ width: 130 }}
            options={[
              { label: '全部', value: 'ALL' },
              { label: '待开奖', value: 'PENDING' },
              { label: '已中奖', value: 'WON' },
              { label: '未中奖', value: 'MISSED' }
            ]}
          />
          <Input
            allowClear
            placeholder="目标期号"
            value={targetPeriodValue}
            onChange={event => updateQuery({ targetPeriod: event.target.value })}
            style={{ width: 140 }}
          />
          <Input
            allowClear
            placeholder="规则名称"
            value={ruleName}
            onChange={event => updateQuery({ ruleName: event.target.value })}
            style={{ width: 150 }}
          />
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
              <span>当前页快照</span>
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
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <SafetyCertificateOutlined />
            <div>
              <strong>{summary.trusted}</strong>
              <span>稳定证据</span>
            </div>
          </div>
        </Card>
      </section>

      <Card className="life-panel-card lottery-prediction-panel">
        <div className="lottery-card-title-row">
          <HistoryOutlined />
          <div>
            <h2>最近预测快照</h2>
            <p>共 {pageResponse?.total ?? 0} 条，最新目标期 {summary.latest?.targetPeriod || '暂无'}，更新时间 {formatTime(summary.latest?.updatedAt || summary.latest?.createdAt)}</p>
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
                    <Space wrap size={4}>
                      {evidenceTone(prediction)}
                      {resultTone(prediction)}
                    </Space>
                  </div>
                  {numberBalls(prediction.redNumbers, prediction.blueNumber)}
                  <div className="lottery-prediction-tags">
                    <span>评分 {prediction.score ?? '-'}</span>
                    <span>{prediction.ruleName || prediction.ruleId || '未记录规则'}</span>
                    <span>候选 {prediction.candidates?.length || 0} 组</span>
                    <span>{lotteryReplayText(prediction.replaySummary)}</span>
                  </div>
                  {prediction.reason ? <p>{prediction.reason}</p> : null}
                  {prediction.id ? (
                    <div className="lottery-history-card-actions">
                      <Button size="small" icon={<HistoryOutlined />} onClick={() => navigate(`/lottery/predictions/${prediction.id}`)}>
                        查看详情
                      </Button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </Spin>
        <Pagination
          className="lottery-list-pagination"
          current={page}
          pageSize={pageSize}
          total={pageResponse?.total || 0}
          showSizeChanger
          showTotal={total => `共 ${total} 条`}
          onChange={(nextPage, nextPageSize) => updateQuery({ page: nextPage, pageSize: nextPageSize }, false)}
        />
      </Card>
    </LifePageShell>
  );
};

export default LotteryPredictionHistoryPage;
