import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Space, Tag, message } from 'antd';
import {
  BarChartOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  HeartOutlined,
  HistoryOutlined,
  PieChartOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import LotteryPredictionInsights from './lottery/LotteryPredictionInsights';
import LotteryRuleTrainer from './lottery/LotteryRuleTrainer';
import { useRecordContext } from '../contexts/RecordContext';
import { buildLotteryStats } from '../utils/lotteryStats';
import {
  lotteryPreferenceApi,
  lotteryTicketApi,
  lotteryTrainingApi,
  type LotteryActualRecord,
  type LotteryLatestPrediction,
  type LotteryPreference,
  type LotteryTrainingReport,
  type LotteryTrainingStatus
} from '../services/api';
import './LotteryOverviewPage.css';

const LotteryPredictionPage = () => {
  const navigate = useNavigate();
  const { allRecords, loading, refreshRecords } = useRecordContext();
  const stats = useMemo(() => buildLotteryStats(allRecords), [allRecords]);
  const [trainedPrediction, setTrainedPrediction] = useState<LotteryLatestPrediction | undefined>();
  const [actualRecord, setActualRecord] = useState<LotteryActualRecord | undefined>();
  const [training, setTraining] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<LotteryTrainingStatus | undefined>();
  const [trainingReport, setTrainingReport] = useState<LotteryTrainingReport | undefined>();
  const [preference, setPreference] = useState<LotteryPreference>();

  const savePredictionTicket = useCallback(async (prediction?: LotteryLatestPrediction) => {
    if (!preference?.autoSavePredictions || !prediction?.targetPeriod || !prediction.redNumbers?.length) {
      return;
    }
    try {
      await lotteryTicketApi.saveTicket({
        issue: String(prediction.targetPeriod),
        redNumbers: prediction.redNumbers,
        blueNumber: prediction.blueNumber,
        quantity: 1,
        cost: 2,
        source: preference.defaultTicketSource || 'PREDICTION',
        status: 'DRAFT',
        note: `${prediction.title || '自动保存预测'} · 预测评分 ${prediction.score ?? '-'}`
      });
      message.success('已按偏好自动保存预测票据');
    } catch (error) {
      console.error('自动保存预测票据失败:', error);
      message.error('自动保存预测票据失败');
    }
  }, [preference]);

  const runTraining = async () => {
    setTraining(true);
    setTrainingReport(undefined);
    try {
      const status = await lotteryTrainingApi.start({
        replayCount: preference?.defaultReplayCount ?? 0,
        scale: (preference?.defaultTrainingScale as 'fast' | 'standard' | 'deep' | undefined) || 'standard'
      });
      setTrainingStatus(status);
      if (!status.running && status.report) {
        setTrainingReport(status.report);
        setTrainedPrediction(status.report.latestPrediction);
        await savePredictionTicket(status.report.latestPrediction);
        message.success('训练完成，已重新预测');
      }
    } catch (error) {
      console.error('规则训练失败:', error);
      message.error('规则训练失败，请检查后端服务');
      setTraining(false);
    }
  };

  useEffect(() => {
    if (!training) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      lotteryTrainingApi.status()
        .then(status => {
          setTrainingStatus(status);
          if (!status.running) {
            window.clearInterval(timer);
            setTraining(false);
            if (status.failed) {
              message.error(status.message || '规则训练失败');
              return;
            }
            if (status.report) {
              setTrainingReport(status.report);
              setTrainedPrediction(status.report.latestPrediction);
              savePredictionTicket(status.report.latestPrediction);
              message.success('训练完成，已重新预测');
            }
          }
        })
        .catch(error => {
          console.error('读取训练状态失败:', error);
          window.clearInterval(timer);
          setTraining(false);
          message.error('读取训练状态失败，请检查后端服务');
        });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [savePredictionTicket, training]);

  useEffect(() => {
    lotteryPreferenceApi.preference()
      .then(setPreference)
      .catch(error => {
        console.warn('读取彩票偏好失败:', error);
      });
  }, []);

  useEffect(() => {
    lotteryTrainingApi.status()
      .then(status => {
        setTrainingStatus(status);
        if (status.running) {
          setTraining(true);
        }
        if (status.report) {
          setTrainingReport(status.report);
        }
      })
      .catch(error => {
        console.warn('读取训练状态失败:', error);
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

  return (
    <LifePageShell
      className="lottery-prediction-page"
      eyebrow="彩票数据"
      title="双色球号码预测"
      actions={
        <Space wrap>
          <Button type="primary" icon={<ExperimentOutlined />} loading={training} onClick={runTraining}>
            开始训练
          </Button>
          <Button icon={<HeartOutlined />} onClick={() => navigate('/lottery/analysis?tab=prediction')}>
            摇奖
          </Button>
          <Button icon={<HistoryOutlined />} onClick={() => navigate('/lottery/predictions/history')}>
            历史
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
          <Button icon={<DatabaseOutlined />} onClick={() => navigate('/lottery/records')}>
            开奖记录
          </Button>
        </Space>
      }
    >
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
        <LotteryRuleTrainer report={trainingReport} training={training} status={trainingStatus} />
      </section>
    </LifePageShell>
  );
};

export default LotteryPredictionPage;
