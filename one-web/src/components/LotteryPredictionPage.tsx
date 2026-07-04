import { useEffect, useMemo, useState } from 'react';
import { Button, Space, message } from 'antd';
import {
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
  lotteryTrainingApi,
  type LotteryActualRecord,
  type LotteryLatestPrediction,
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

  const runTraining = async () => {
    setTraining(true);
    setTrainingReport(undefined);
    try {
      const status = await lotteryTrainingApi.start({ replayCount: 0, scale: 'deep' });
      setTrainingStatus(status);
      if (!status.running && status.report) {
        setTrainingReport(status.report);
        setTrainedPrediction(status.report.latestPrediction);
        message.success('全历史训练完成，已重新预测');
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
              message.success('全历史训练完成，已重新预测');
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
  }, [training]);

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
