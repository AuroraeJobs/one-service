import { useMemo, useState } from 'react';
import { Card, Empty, Select, Statistic, Tag } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import LotteryBalls from './LotteryBalls';
import { useI18n } from '../../contexts/I18nContext';
import {
  buildLotteryReplayForPeriod,
  buildLotteryReplayReport,
  parseLotteryDraws,
  type LotteryPredictionReplay as LotteryPredictionReplayResult
} from '../../utils/lotteryStats';

interface LotteryPredictionReplayProps {
  allRecords: string | string[];
}

const replayCounts = [5, 10, 20];

const prizeOrder = ['一等奖', '二等奖', '三等奖', '四等奖', '五等奖', '六等奖', '未中奖'];

const prizeLevelByName: Record<string, number> = {
  一等奖: 1,
  二等奖: 2,
  三等奖: 3,
  四等奖: 4,
  五等奖: 5,
  六等奖: 6,
  未中奖: 0
};

const getScoreColor = (score: number) => {
  if (score >= 45) return 'red';
  if (score >= 30) return 'orange';
  if (score >= 18) return 'blue';
  return 'default';
};

const getPrizeColor = (prizeLevel: number) => {
  if (prizeLevel === 0) return 'default';
  if (prizeLevel <= 2) return 'red';
  if (prizeLevel <= 4) return 'orange';
  return 'blue';
};

const localizeReplayTip = (
  tip: string,
  t: ReturnType<typeof useI18n>['t'],
  translateText: ReturnType<typeof useI18n>['translateText'],
) => {
  const bestStrategyMatch = tip.match(/^(.+) 在当前回放窗口内平均表现最好，可提高该策略权重。$/);
  return bestStrategyMatch
    ? t('{{strategy}} 在当前回放窗口内平均表现最好，可提高该策略权重。', {
      strategy: translateText(bestStrategyMatch[1]),
    })
    : translateText(tip);
};

const ReplayRow = ({ replay }: { replay: LotteryPredictionReplayResult }) => {
  const { t, translateText } = useI18n();
  const best = replay.bestPrediction;

  return (
    <div className="lottery-replay-row">
      <div className="lottery-replay-period">
        <strong>{t('预测第 {{period}} 期', { period: replay.targetDraw.period })}</strong>
        <span>{t('基于前 {{count}} 期数据', { count: replay.trainingDrawCount })}</span>
      </div>
      <div className="lottery-replay-comparison">
        <div>
          <span>{t('预测号码')}</span>
          <LotteryBalls redNumbers={best.redNumbers} blueNumber={best.blueNumber} />
        </div>
        <div>
          <span>{t('实际开奖')}</span>
          <LotteryBalls redNumbers={replay.targetDraw.redNumbers} blueNumber={replay.targetDraw.blueNumber} />
        </div>
      </div>
      <div className="lottery-replay-score">
        <Tag color={getPrizeColor(best.result.prizeLevel)}>{translateText(best.result.prizeName)}</Tag>
        <Tag color={getScoreColor(best.result.score)}>{t('评分 {{score}}', { score: best.result.score })}</Tag>
        <span>{t('红球 {{hits}}/6', { hits: best.result.redHits })}</span>
        <span>{best.result.blueHit ? t('蓝球命中') : t('蓝球未中')}</span>
        <span>{t('结构 {{hits}}/4', { hits: best.result.structureHits })}</span>
        <span>{translateText(best.title)}</span>
      </div>
    </div>
  );
};

const LotteryPredictionReplay = ({ allRecords }: LotteryPredictionReplayProps) => {
  const { t, translateText } = useI18n();
  const [replayCount, setReplayCount] = useState(5);
  const draws = useMemo(() => parseLotteryDraws(allRecords), [allRecords]);
  const replayOptions = useMemo(
    () => replayCounts.map(count => ({
      label: t('最近 {{count}} 期', { count }),
      value: count
    })),
    [t]
  );
  const targetOptions = useMemo(
    () => draws
      .filter(draw => draw.period > 1)
      .map(draw => ({
        label: t('第 {{period}} 期', { period: draw.period }),
        value: draw.period
      })),
    [draws, t]
  );
  const [targetPeriod, setTargetPeriod] = useState<number>();
  const selectedTargetPeriod = targetPeriod || targetOptions[targetOptions.length - 1]?.value;
  const report = useMemo(() => buildLotteryReplayReport(allRecords, replayCount), [allRecords, replayCount]);
  const singleReplay = useMemo(
    () => selectedTargetPeriod ? buildLotteryReplayForPeriod(allRecords, selectedTargetPeriod) : undefined,
    [allRecords, selectedTargetPeriod]
  );

  return (
    <Card className="life-panel-card lottery-prediction-panel lottery-replay-panel">
      <div className="lottery-card-title-row">
        <div>
          <h2>{t('预测回放')}</h2>
          <p>{t('逐期回到开奖前，只用当时已有数据生成预测，再与真实开奖评分。')}</p>
        </div>
        <HistoryOutlined />
      </div>

      <div className="lottery-replay-toolbar">
        <div className="lottery-replay-controls">
          <div>
            <span>{t('手动目标期')}</span>
            <Select
              showSearch
              value={selectedTargetPeriod}
              options={targetOptions}
              onChange={setTargetPeriod}
              className="lottery-replay-select"
              optionFilterProp="label"
              placeholder={t('选择目标期')}
            />
          </div>
          <div>
            <span>{t('批量窗口')}</span>
            <Select
              value={replayCount}
              options={replayOptions}
              onChange={setReplayCount}
              className="lottery-replay-select"
            />
          </div>
        </div>
        <div className="lottery-replay-summary">
          <Statistic title={t('回放期数')} value={report.summary.total} />
          <Statistic title={t('平均评分')} value={report.summary.averageScore} />
          <Statistic title={t('平均红球')} value={report.summary.averageRedHits} suffix="/6" />
          <Statistic title={t('蓝球命中率')} value={report.summary.blueHitRate} suffix="%" />
        </div>
      </div>

      <div className="lottery-replay-manual">
        <div className="lottery-card-title-row">
          <div>
            <h3>{t('单期手动回放')}</h3>
            <p>
              {selectedTargetPeriod
                ? t('选择第 {{period}} 期：仅使用前 {{historyCount}} 期数据生成预测，再对照第 {{period}} 期开奖。', {
                  period: selectedTargetPeriod,
                  historyCount: Math.max(0, selectedTargetPeriod - 1),
                })
                : t('请选择目标期号。')}
            </p>
          </div>
          <Tag color="blue">{t('严格时间切片')}</Tag>
        </div>
        {singleReplay ? (
          <>
            <ReplayRow replay={singleReplay} />
            <div className="lottery-replay-candidate-list">
              {singleReplay.predictions.map(prediction => (
                <div key={`${singleReplay.targetDraw.id}-${prediction.title}`} className="lottery-replay-candidate-row">
                  <strong>{translateText(prediction.title)}</strong>
                  <LotteryBalls redNumbers={prediction.redNumbers} blueNumber={prediction.blueNumber} />
                  <Tag color={getPrizeColor(prediction.result.prizeLevel)}>{translateText(prediction.result.prizeName)}</Tag>
                  <span>{t('红球 {{hits}}/6', { hits: prediction.result.redHits })}</span>
                  <span>{prediction.result.blueHit ? t('蓝球命中') : t('蓝球未中')}</span>
                  <span>{t('评分 {{score}}', { score: prediction.result.score })}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <Empty description={t('请选择第 2 期或之后的目标期，系统会用目标期之前的数据回放预测')} />
        )}
      </div>

      {report.replays.length === 0 ? (
        <Empty description={t('历史期数不足，至少需要 20 期后才能回放评分')} />
      ) : (
        <>
          <div className="lottery-prize-distribution">
            {prizeOrder
              .filter(prizeName => report.summary.prizeDistribution[prizeName])
              .map(prizeName => (
                <Tag key={prizeName} color={getPrizeColor(prizeLevelByName[prizeName])}>
                  {t('{{prizeName}} {{count}} 期', {
                    prizeName: translateText(prizeName),
                    count: report.summary.prizeDistribution[prizeName],
                  })}
                </Tag>
              ))}
          </div>
          <div className="lottery-replay-tips">
            {report.summary.improvementTips.map(tip => (
              <span key={tip}>{localizeReplayTip(tip, t, translateText)}</span>
            ))}
          </div>
          <div className="lottery-replay-list">
            {[...report.replays].reverse().map(replay => (
              <ReplayRow key={replay.targetDraw.id} replay={replay} />
            ))}
          </div>
        </>
      )}
    </Card>
  );
};

export default LotteryPredictionReplay;
