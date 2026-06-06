import { useMemo, useState } from 'react';
import { Card, Empty, Select, Statistic, Tag } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import LotteryBalls from './LotteryBalls';
import {
  buildLotteryReplayReport,
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
  const report = useMemo(() => buildLotteryReplayReport(allRecords, replayCount), [allRecords, replayCount]);

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
        <Select
          value={replayCount}
          options={replayOptions}
          onChange={setReplayCount}
          className="lottery-replay-select"
        />
        <div className="lottery-replay-summary">
          <Statistic title="回放期数" value={report.summary.total} />
          <Statistic title="平均评分" value={report.summary.averageScore} />
          <Statistic title="平均红球" value={report.summary.averageRedHits} suffix="/6" />
          <Statistic title="蓝球命中" value={report.summary.blueHitRate} suffix="%" />
        </div>
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
