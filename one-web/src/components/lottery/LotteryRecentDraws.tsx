import { Card, Empty } from 'antd';
import LotteryBalls from './LotteryBalls';
import type { LotteryDraw } from '../../utils/lotteryStats';

interface LotteryRecentDrawsProps {
  draws: LotteryDraw[];
  onSelect: (draw: LotteryDraw) => void;
}

const LotteryRecentDraws = ({ draws, onSelect }: LotteryRecentDrawsProps) => (
  <Card className="life-panel-card lottery-recent-card">
    <div className="lottery-card-title-row">
      <div>
        <h2>最近开奖</h2>
        <p>保留期号、号码、奇偶、和值和卦象，点击查看完整结构。</p>
      </div>
    </div>

    {draws.length === 0 ? (
      <Empty description="暂无开奖数据" />
    ) : (
      <div className="lottery-draw-grid">
        {draws.map(draw => (
          <button key={draw.id} type="button" className="lottery-draw-card" onClick={() => onSelect(draw)}>
            <div className="lottery-draw-card-head">
              <strong>第 {draw.period} 期</strong>
              <span>{draw.combination}</span>
            </div>
            <LotteryBalls redNumbers={draw.redNumbers} blueNumber={draw.blueNumber} />
            <div className="lottery-draw-meta">
              <span>和值 {draw.redSum}</span>
              <span>{draw.hexagramName}</span>
              <span>{draw.planetName}</span>
            </div>
          </button>
        ))}
      </div>
    )}
  </Card>
);

export default LotteryRecentDraws;
