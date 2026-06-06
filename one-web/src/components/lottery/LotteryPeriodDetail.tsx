import { Descriptions, Drawer } from 'antd';
import LotteryBalls from './LotteryBalls';
import type { LotteryDraw } from '../../utils/lotteryStats';

interface LotteryPeriodDetailProps {
  draw?: LotteryDraw;
  open: boolean;
  onClose: () => void;
}

const LotteryPeriodDetail = ({ draw, open, onClose }: LotteryPeriodDetailProps) => (
  <Drawer title={draw ? `第 ${draw.period} 期详情` : '开奖详情'} width={420} open={open} onClose={onClose}>
    {draw && (
      <div className="lottery-detail-panel">
        <LotteryBalls redNumbers={draw.redNumbers} blueNumber={draw.blueNumber} />
        <Descriptions
          column={1}
          size="small"
          items={[
            { key: 'raw', label: '原始记录', children: draw.raw },
            { key: 'sum', label: '红球和值', children: draw.redSum },
            { key: 'oddEven', label: '奇偶结构', children: draw.combination },
            { key: 'size', label: '大小结构', children: `${draw.bigCount}大${draw.smallCount}小` },
            { key: 'consecutive', label: '连号组数', children: draw.consecutivePairs },
            { key: 'hexagram', label: '卦象', children: draw.hexagramName },
            { key: 'planet', label: '组合标签', children: draw.planetName }
          ]}
        />
      </div>
    )}
  </Drawer>
);

export default LotteryPeriodDetail;
