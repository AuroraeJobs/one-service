import { useMemo, useState } from 'react';
import { Card, Empty, Select, Statistic, Tag } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import LotteryBalls from './LotteryBalls';
import {
  buildLotteryReplayForPeriod,
  buildLotteryReplayReport,
  parseLotteryDraws,
  type LotteryPredictionReplay as LotteryPredictionReplayResult
} from '../../utils/lotteryStats';

interface LotteryPredictionReplayProps {
  allRecords: string | string[];
}

const replayOptions = [
  { label: '最近 5 期', value: 5 },
  { label: '最近 10 期', value: 10 },
  { label: '最近 20 期', value: 20 }
];

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

const ReplayRow = ({ replay }: { replay: LotteryPredictionReplayResult }) => {
  const best = replay.bestPrediction;

  return (
    <div className="lottery-replay-row">
      <div className="lottery-replay-period">
        <strong>预测第 {replay.targetDraw.period} 期</strong>
        <span>基于前 {replay.trainingDrawCount} 期数据</span>
      </div>
      <div className="lottery-replay-comparison">
        <div>
          <span>预测号码</span>
          <LotteryBalls redNumbers={best.redNumbers} blueNumber={best.blueNumber} />
        </div>
        <div>
          <span>实际开奖</span>
          <LotteryBalls redNumbers={replay.targetDraw.redNumbers} blueNumber={replay.targetDraw.blueNumber} />
        </div>
      </div>
      <div className="lottery-replay-score">
        <Tag color={getPrizeColor(best.result.prizeLevel)}>{best.result.prizeName}</Tag>
        <Tag color={getScoreColor(best.result.score)}>评分 {best.result.score}</Tag>
        <span>红球 {best.result.redHits}/6</span>
        <span>{best.result.blueHit ? '蓝球命中' : '蓝球未中'}</span>
        <span>结构 {best.result.structureHits}/4</span>
        <span>{best.title}</span>
      </div>
    </div>
  );
};

const LotteryPredictionReplay = ({ allRecords }: LotteryPredictionReplayProps) => {
  const [replayCount, setReplayCount] = useState(5);
  const draws = useMemo(() => parseLotteryDraws(allRecords), [allRecords]);
  const targetOptions = useMemo(
    () => draws
      .filter(draw => draw.period > 1)
      .map(draw => ({
        label: `第 ${draw.period} 期`,
        value: draw.period
      })),
    [draws]
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
          <h2>预测回放</h2>
          <p>逐期回到开奖前，只用当时已有数据生成预测，再与真实开奖评分。</p>
        </div>
        <HistoryOutlined />
      </div>

      <div className="lottery-replay-toolbar">
        <div className="lottery-replay-controls">
          <div>
            <span>手动目标期</span>
            <Select
              showSearch
              value={selectedTargetPeriod}
              options={targetOptions}
              onChange={setTargetPeriod}
              className="lottery-replay-select"
              optionFilterProp="label"
              placeholder="选择目标期"
            />
          </div>
          <div>
            <span>批量窗口</span>
            <Select
              value={replayCount}
              options={replayOptions}
              onChange={setReplayCount}
              className="lottery-replay-select"
            />
          </div>
        </div>
        <div className="lottery-replay-summary">
          <Statistic title="回放期数" value={report.summary.total} />
          <Statistic title="平均评分" value={report.summary.averageScore} />
          <Statistic title="平均红球" value={report.summary.averageRedHits} suffix="/6" />
          <Statistic title="蓝球命中" value={report.summary.blueHitRate} suffix="%" />
        </div>
      </div>

      <div className="lottery-replay-manual">
        <div className="lottery-card-title-row">
          <div>
            <h3>单期手动回放</h3>
            <p>
              {selectedTargetPeriod
                ? `选择第 ${selectedTargetPeriod} 期：仅使用前 ${Math.max(0, selectedTargetPeriod - 1)} 期数据生成预测，再对照第 ${selectedTargetPeriod} 期开奖。`
                : '请选择目标期号。'}
            </p>
          </div>
          <Tag color="blue">严格时间切片</Tag>
        </div>
        {singleReplay ? (
          <>
            <ReplayRow replay={singleReplay} />
            <div className="lottery-replay-candidate-list">
              {singleReplay.predictions.map(prediction => (
                <div key={`${singleReplay.targetDraw.id}-${prediction.title}`} className="lottery-replay-candidate-row">
                  <strong>{prediction.title}</strong>
                  <LotteryBalls redNumbers={prediction.redNumbers} blueNumber={prediction.blueNumber} />
                  <Tag color={getPrizeColor(prediction.result.prizeLevel)}>{prediction.result.prizeName}</Tag>
                  <span>红球 {prediction.result.redHits}/6</span>
                  <span>{prediction.result.blueHit ? '蓝球命中' : '蓝球未中'}</span>
                  <span>评分 {prediction.result.score}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <Empty description="请选择第 2 期或之后的目标期，系统会用目标期之前的数据回放预测" />
        )}
      </div>

      {report.replays.length === 0 ? (
        <Empty description="历史期数不足，至少需要 20 期后才能回放评分" />
      ) : (
        <>
          <div className="lottery-prize-distribution">
            {prizeOrder
              .filter(prizeName => report.summary.prizeDistribution[prizeName])
              .map(prizeName => (
                <Tag key={prizeName} color={getPrizeColor(prizeLevelByName[prizeName])}>
                  {prizeName} {report.summary.prizeDistribution[prizeName]}期
                </Tag>
              ))}
          </div>
          <div className="lottery-replay-tips">
            {report.summary.improvementTips.map(tip => (
              <span key={tip}>{tip}</span>
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
