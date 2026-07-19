import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Progress, Space, Tag } from 'antd';
import {
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  HeartOutlined,
  HistoryOutlined,
  LineChartOutlined,
  PieChartOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import LotteryBalls from './lottery/LotteryBalls';
import LotteryPredictionInsights from './lottery/LotteryPredictionInsights';
import LotteryPredictionReplay from './lottery/LotteryPredictionReplay';
import { useRecordContext } from '../contexts/RecordContext';
import { buildLotteryStats } from '../utils/lotteryStats';
import {
  lotteryPreferenceApi,
  lotteryTrainingApi,
  type LotteryActualRecord,
  type LotteryLatestPrediction,
  type LotteryPreference
} from '../services/api';
import './LotteryOverviewPage.css';

const formatDashboardNumber = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }
  return value.toLocaleString('zh-CN');
};

const clampPercent = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
};

const LotteryPredictionPage = () => {
  const navigate = useNavigate();
  const { allRecords, loading, refreshRecords } = useRecordContext();
  const stats = useMemo(() => buildLotteryStats(allRecords), [allRecords]);
  const [trainedPrediction, setTrainedPrediction] = useState<LotteryLatestPrediction | undefined>();
  const [actualRecord, setActualRecord] = useState<LotteryActualRecord | undefined>();
  const [preference, setPreference] = useState<LotteryPreference>();

  useEffect(() => {
    lotteryPreferenceApi.preference()
      .then(setPreference)
      .catch(error => {
        console.warn('读取彩票偏好失败:', error);
      });
  }, []);

  useEffect(() => {
    lotteryTrainingApi.latestPrediction()
      .then(prediction => {
        if (prediction?.redNumbers?.length) {
          setTrainedPrediction(prediction);
          if (prediction.actualRecord?.redNumbers?.length) {
            setActualRecord(prediction.actualRecord);
          }
        }
      })
      .catch(error => {
        console.warn('读取训练后预测失败:', error);
      });
  }, []);

  useEffect(() => {
    lotteryTrainingApi.latestActualRecord()
      .then(record => {
        if (record?.redNumbers?.length) {
          setActualRecord(record);
        }
      })
      .catch(error => {
        console.warn('读取最新中奖记录失败:', error);
      });
  }, []);

  const dashboardPrediction = useMemo(() => {
    if (trainedPrediction?.redNumbers?.length) {
      return {
        title: trainedPrediction.title || '训练后预测',
        redNumbers: trainedPrediction.redNumbers,
        blueNumber: trainedPrediction.blueNumber,
        score: trainedPrediction.score,
        reason: trainedPrediction.reason,
        targetPeriod: trainedPrediction.targetPeriod,
        meta: [
          trainedPrediction.ruleName,
          trainedPrediction.basedOnPeriod ? `基于前 ${trainedPrediction.basedOnPeriod} 期` : '',
          trainedPrediction.candidates?.length ? `${trainedPrediction.candidates.length} 组候选` : ''
        ].filter(Boolean)
      };
    }

    const primaryPrediction = stats.predictions[0];
    if (!primaryPrediction) {
      return undefined;
    }

    return {
      title: primaryPrediction.title || '规则预测',
      redNumbers: primaryPrediction.redNumbers,
      blueNumber: primaryPrediction.blueNumber,
      score: primaryPrediction.score,
      reason: primaryPrediction.reason,
      targetPeriod: stats.latestDraw ? stats.latestDraw.period + 1 : undefined,
      meta: primaryPrediction.tags
    };
  }, [stats.latestDraw, stats.predictions, trainedPrediction]);

  const probabilityRows = useMemo(
    () => [
      ...stats.probabilityAnalysis.red.slice(0, 4),
      ...stats.probabilityAnalysis.blue.slice(0, 2)
    ].sort((a, b) => b.probability - a.probability),
    [stats.probabilityAnalysis.blue, stats.probabilityAnalysis.red]
  );

  const recentDraws = useMemo(
    () => stats.draws.slice(-4).reverse(),
    [stats.draws]
  );

  const dashboardKpis = useMemo(() => [
    {
      key: 'target',
      label: '当前期号',
      value: dashboardPrediction?.targetPeriod ? String(dashboardPrediction.targetPeriod) : '-',
      detail: stats.latestDraw ? `上期开奖 ${stats.latestDraw.period}` : '等待开奖数据',
      tone: 'blue'
    },
    {
      key: 'samples',
      label: '训练样本',
      value: formatDashboardNumber(stats.draws.length),
      detail: `最近 ${stats.recentDrawCount} 期参与分析`,
      tone: 'violet'
    },
    {
      key: 'score',
      label: '预测评分',
      value: typeof dashboardPrediction?.score === 'number' ? dashboardPrediction.score.toFixed(1) : '-',
      detail: trainedPrediction ? '训练后预测' : '规则预测',
      tone: 'green'
    },
    {
      key: 'health',
      label: '数据健康',
      value: `${Math.round((stats.redCoverage + stats.blueCoverage) / 2)}%`,
      detail: `红球覆盖 ${stats.redCoverage}% / 蓝球 ${stats.blueCoverage}%`,
      tone: 'amber'
    }
  ], [dashboardPrediction, stats.blueCoverage, stats.draws.length, stats.latestDraw, stats.recentDrawCount, stats.redCoverage, trainedPrediction]);

  const healthItems = useMemo(() => [
    {
      label: '数据同步',
      value: loading ? 68 : 96,
      detail: loading ? '正在更新开奖记录' : '开奖记录可用',
      tone: 'green'
    },
    {
      label: '质量校验',
      value: Math.round((stats.redCoverage + stats.blueCoverage) / 2),
      detail: '红蓝球覆盖率',
      tone: 'blue'
    },
    {
      label: '回测训练',
      value: 88,
      detail: '前往训练台查看',
      tone: 'violet'
    },
    {
      label: '票据偏好',
      value: preference?.autoSavePredictions ? 92 : 58,
      detail: preference?.autoSavePredictions ? '自动保存已开启' : '手动保存预测',
      tone: 'amber'
    }
  ], [loading, preference?.autoSavePredictions, stats.blueCoverage, stats.redCoverage]);

  const actionQueue = useMemo(() => [
    {
      key: 'verify',
      title: '核验上一期命中情况',
      detail: actualRecord ? `已录入 ${actualRecord.period}` : '等待最新开奖记录',
      tag: actualRecord ? '已准备' : '待确认',
      icon: <CheckCircleOutlined />,
      path: '/lottery/outcomes'
    },
    {
      key: 'ticket',
      title: '发布本期预测票据',
      detail: dashboardPrediction ? `目标期号 ${dashboardPrediction.targetPeriod || '-'}` : '先生成预测组合',
      tag: preference?.autoSavePredictions ? '自动' : '手动',
      icon: <FileTextOutlined />,
      path: '/lottery/tickets'
    },
    {
      key: 'decision',
      title: '检查决策集合',
      detail: probabilityRows[0] ? `${probabilityRows[0].number} 概率最高` : '暂无概率分析',
      tag: '观察',
      icon: <SafetyCertificateOutlined />,
      path: '/lottery/predictions/decision'
    },
    {
      key: 'sync',
      title: '同步最新开奖源',
      detail: loading ? '同步中' : '可手动刷新',
      tag: loading ? '进行中' : '可执行',
      icon: <DatabaseOutlined />,
      path: '/lottery/sync'
    }
  ], [actualRecord, dashboardPrediction, loading, preference?.autoSavePredictions, probabilityRows]);

  return (
    <LifePageShell
      className="lottery-prediction-page"
      eyebrow="彩票数据"
      title="双色球号码预测"
      actions={
        <Space wrap>
          <Button icon={<HeartOutlined />} onClick={() => navigate('/lottery/analysis?tab=prediction')}>
            摇奖
          </Button>
          <Button icon={<LineChartOutlined />} onClick={() => navigate('/lottery/deep-analysis')}>
            深度
          </Button>
          <Button icon={<HistoryOutlined />} onClick={() => navigate('/lottery/predictions/history')}>
            历史
          </Button>
          <Button icon={<ExperimentOutlined />} onClick={() => navigate('/lottery/prediction/training')}>
            训练台
          </Button>
          <Button icon={<BarChartOutlined />} onClick={() => navigate('/lottery/research')}>
            研究
          </Button>
          <Button icon={<FileTextOutlined />} onClick={() => navigate('/lottery/tickets')}>
            票据
          </Button>
          <Button icon={<PieChartOutlined />} onClick={() => navigate('/lottery/ledger')}>
            账本
          </Button>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={refreshRecords}>
            更新数据
          </Button>
        </Space>
      }
    >
      <section className="lottery-admin-dashboard">
        <section className="lottery-admin-kpi-grid">
          {dashboardKpis.map(item => (
            <Card key={item.key} className={`life-panel-card lottery-admin-kpi-card lottery-admin-tone-${item.tone}`}>
              <span className="lottery-admin-kpi-accent" />
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <em>{item.detail}</em>
              </div>
            </Card>
          ))}
        </section>

        <section className="lottery-admin-main-grid">
          <Card className="life-panel-card lottery-admin-card lottery-admin-primary-card">
            <div className="lottery-admin-card-head">
              <div>
                <span>推荐组合</span>
                <h2>{dashboardPrediction?.title || '等待预测结果'}</h2>
              </div>
              <Tag color={preference?.autoSavePredictions ? 'green' : 'default'}>
                {preference?.autoSavePredictions ? '自动保存票据' : '手动保存'}
              </Tag>
            </div>
            {dashboardPrediction ? (
              <>
                <div className="lottery-admin-period-row">
                  <ClockCircleOutlined />
                  <span>目标期号 {dashboardPrediction.targetPeriod || '-'}</span>
                  {dashboardPrediction.meta.slice(0, 2).map(item => <Tag key={item}>{item}</Tag>)}
                </div>
                <LotteryBalls redNumbers={dashboardPrediction.redNumbers} blueNumber={dashboardPrediction.blueNumber} />
                <div className="lottery-admin-explain-block">
                  <strong>模型解释</strong>
                  <p>{dashboardPrediction.reason || '当前组合来自历史频率、遗漏压力、区间分布与训练回放的综合评分。'}</p>
                </div>
                <div className="lottery-admin-confidence">
                  <Progress percent={clampPercent(dashboardPrediction.score)} showInfo={false} strokeColor="#34c759" />
                  <span>置信度 {typeof dashboardPrediction.score === 'number' ? dashboardPrediction.score.toFixed(1) : '-'}%</span>
                </div>
              </>
            ) : (
              <Alert type="info" showIcon message="暂无可用预测，更新数据或开始训练后会在这里生成推荐组合。" />
            )}
          </Card>

          <Card className="life-panel-card lottery-admin-card lottery-admin-rank-card">
            <div className="lottery-admin-card-head">
              <div>
                <span>号码概率排行</span>
                <h2>红蓝球候选池</h2>
              </div>
              <Space size={6}>
                <Tag color="red">红球</Tag>
                <Tag color="blue">蓝球</Tag>
              </Space>
            </div>
            <div className="lottery-admin-probability-list">
              {probabilityRows.map(item => (
                <div key={`${item.type}-${item.number}`} className="lottery-admin-probability-row">
                  <span className={`lottery-admin-number-badge lottery-admin-number-${item.type}`}>{item.number}</span>
                  <div>
                    <strong>{item.type === 'blue' ? '蓝球回归概率' : '红球候选概率'}</strong>
                    <Progress percent={clampPercent(item.probability)} showInfo={false} strokeColor={item.type === 'blue' ? '#0071e3' : '#ff3b30'} />
                  </div>
                  <b>{item.probability.toFixed(2)}%</b>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="lottery-admin-secondary-grid">
          <Card className="life-panel-card lottery-admin-card">
            <div className="lottery-admin-card-head">
              <div>
                <span>最近开奖记录</span>
                <h2>开奖回看</h2>
              </div>
            </div>
            <div className="lottery-admin-draw-list">
              {recentDraws.map(draw => (
                <button key={draw.id} type="button" onClick={() => navigate('/lottery/records')}>
                  <strong>{draw.period}</strong>
                  <LotteryBalls redNumbers={draw.redNumbers} blueNumber={draw.blueNumber} />
                </button>
              ))}
            </div>
          </Card>

          <Card className="life-panel-card lottery-admin-card">
            <div className="lottery-admin-card-head">
              <div>
                <span>策略健康</span>
                <h2>模型状态</h2>
              </div>
              <ThunderboltOutlined />
            </div>
            <div className="lottery-admin-health-list">
              {healthItems.map(item => (
                <div key={item.label} className={`lottery-admin-health-row lottery-admin-tone-${item.tone}`}>
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.detail}</span>
                  </div>
                  <Progress percent={item.value} size="small" strokeColor="currentColor" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="life-panel-card lottery-admin-card">
            <div className="lottery-admin-card-head">
              <div>
                <span>行动队列</span>
                <h2>今日待办</h2>
              </div>
            </div>
            <div className="lottery-admin-action-list">
              {actionQueue.map(item => (
                <button key={item.key} type="button" onClick={() => navigate(item.path)}>
                  <span>{item.icon}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </div>
                  <Tag>{item.tag}</Tag>
                </button>
              ))}
            </div>
          </Card>
        </section>
      </section>

      {preference ? (
        <Alert
          className="lottery-overview-status-alert"
          type={preference.autoSavePredictions ? 'success' : 'info'}
          showIcon
          message={
            <Space wrap>
              <span>训练偏好</span>
              <Tag>{preference.defaultTrainingScale || 'standard'}</Tag>
              <Tag>回放 {preference.defaultReplayCount ?? 0}</Tag>
              <Tag color={preference.autoSavePredictions ? 'green' : 'default'}>
                {preference.autoSavePredictions ? '自动保存票据' : '不自动保存'}
              </Tag>
            </Space>
          }
        />
      ) : null}
      <LotteryPredictionInsights
        stats={stats}
        trainedPrediction={trainedPrediction}
        actualRecord={actualRecord}
        onPredictionUpdated={setTrainedPrediction}
        onActualRecordUpdated={setActualRecord}
      />
      <section className="lottery-simple-support-grid">
        <LotteryPredictionReplay allRecords={allRecords} />
      </section>
    </LifePageShell>
  );
};

export default LotteryPredictionPage;
