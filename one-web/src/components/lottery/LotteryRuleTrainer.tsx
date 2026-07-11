import { Empty, Progress, Statistic, Tag } from 'antd';
import { ExperimentOutlined } from '@ant-design/icons';
import { useI18n } from '../../contexts/I18nContext';
import { type LotteryTrainingReport, type LotteryTrainingStatus } from '../../services/api';

interface LotteryRuleTrainerProps {
  report?: LotteryTrainingReport;
  training?: boolean;
  status?: LotteryTrainingStatus;
}

const getWinningCount = (report: LotteryTrainingReport) =>
  report.best ? report.best.summary.total - (report.best.summary.prizeDistribution['未中奖'] || 0) : 0;

const localizeTrainingText = (
  value: string,
  t: ReturnType<typeof useI18n>['t'],
  translateText: ReturnType<typeof useI18n>['translateText'],
) => {
  const generationMatch = value.match(/^第 (\d+) 代正在回放 (.+)$/);
  if (generationMatch) {
    return t('第 {{generation}} 代正在回放 {{target}}', {
      generation: generationMatch[1],
      target: generationMatch[2],
    });
  }
  const rollingMatch = value.match(/^正在基于前 (\d+) 期预测第 (\d+) 期$/);
  if (rollingMatch) {
    return t('正在基于前 {{historyCount}} 期预测第 {{period}} 期', {
      historyCount: rollingMatch[1],
      period: rollingMatch[2],
    });
  }
  return translateText(value);
};

const LotteryRuleTrainer = ({ report, training = false, status }: LotteryRuleTrainerProps) => {
  const { t, translateText } = useI18n();
  const progress = status?.percent || 0;
  const best = report?.best;

  return (
    <section className="lottery-clean-panel lottery-rule-trainer-panel">
      <div className="lottery-card-title-row">
        <div>
          <h2>{t('训练状态')}</h2>
          <p>{t('训练完成后会自动刷新本期预测。')}</p>
        </div>
        <ExperimentOutlined />
      </div>

      {training ? (
        <div className="lottery-training-progress">
          <div className="lottery-training-progress-head">
            <strong>{localizeTrainingText(status?.stage || '训练中', t, translateText)}</strong>
            <span>{progress}%</span>
          </div>
          <Progress percent={progress} showInfo={false} status="active" />
          <div className="lottery-training-status-line">
            <span>{localizeTrainingText(status?.message || '正在回放历史数据', t, translateText)}</span>
            {Boolean(status?.total) && <strong>{status?.processed || 0} / {status?.total}</strong>}
          </div>
        </div>
      ) : !report ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('还没有训练报告')} />
      ) : !best ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('历史期数不足，暂时无法训练')} />
      ) : (
        <div className="lottery-simple-training-summary">
          <div className="lottery-simple-stat-row">
            <Statistic title={t('训练代数')} value={report.generation || 1} />
            <Statistic title={t('中奖期数')} value={getWinningCount(report)} suffix={`/ ${best.summary.total}`} />
            <Statistic title={t('平均红球')} value={best.summary.averageRedHits} suffix="/6" />
          </div>
          <div className="lottery-trained-latest">
            <Tag color="gold">{t('当前规则')}</Tag>
            <span>{translateText(report.learnedRule?.name || best.config.name)}</span>
          </div>
          {report.latestPrediction && (
            <div className="lottery-trained-latest">
              <Tag color="red">{t('最新预测')}</Tag>
              <span>
                {t('第 {{period}} 期：{{redNumbers}} + {{blueNumber}}', {
                  period: report.latestPrediction.targetPeriod,
                  redNumbers: report.latestPrediction.redNumbers.join(' '),
                  blueNumber: report.latestPrediction.blueNumber,
                })}
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default LotteryRuleTrainer;
