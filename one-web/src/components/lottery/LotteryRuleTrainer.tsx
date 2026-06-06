import { Empty, Progress, Statistic, Tag } from 'antd';
import { ExperimentOutlined } from '@ant-design/icons';
import { type LotteryTrainingReport, type LotteryTrainingStatus } from '../../services/api';

interface LotteryRuleTrainerProps {
  report?: LotteryTrainingReport;
  training?: boolean;
  status?: LotteryTrainingStatus;
}

const getWinningCount = (report: LotteryTrainingReport) =>
  report.best ? report.best.summary.total - (report.best.summary.prizeDistribution['未中奖'] || 0) : 0;

const LotteryRuleTrainer = ({ report, training = false, status }: LotteryRuleTrainerProps) => {
  const progress = status?.percent || 0;
  const best = report?.best;

  return (
    <section className="lottery-clean-panel lottery-rule-trainer-panel">
      <div className="lottery-card-title-row">
        <div>
          <h2>训练状态</h2>
          <p>训练完成后会自动刷新本期预测。</p>
        </div>
        <ExperimentOutlined />
      </div>

      {training ? (
        <div className="lottery-training-progress">
          <div className="lottery-training-progress-head">
            <strong>{status?.stage || '训练中'}</strong>
            <span>{progress}%</span>
          </div>
          <Progress percent={progress} showInfo={false} status="active" />
          <div className="lottery-training-status-line">
            <span>{status?.message || '正在回放历史数据'}</span>
            {Boolean(status?.total) && <strong>{status?.processed || 0} / {status?.total}</strong>}
          </div>
        </div>
      ) : !report ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有训练报告" />
      ) : !best ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="历史期数不足，暂时无法训练" />
      ) : (
        <div className="lottery-simple-training-summary">
          <div className="lottery-simple-stat-row">
            <Statistic title="训练代数" value={report.generation || 1} />
            <Statistic title="中奖期数" value={getWinningCount(report)} suffix={`/ ${best.summary.total}`} />
            <Statistic title="平均红球" value={best.summary.averageRedHits} suffix="/6" />
          </div>
          <div className="lottery-trained-latest">
            <Tag color="gold">当前规则</Tag>
            <span>{report.learnedRule?.name || best.config.name}</span>
          </div>
          {report.latestPrediction && (
            <div className="lottery-trained-latest">
              <Tag color="red">最新预测</Tag>
              <span>
                第 {report.latestPrediction.targetPeriod} 期：
                {report.latestPrediction.redNumbers.join(' ')} + {report.latestPrediction.blueNumber}
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default LotteryRuleTrainer;
