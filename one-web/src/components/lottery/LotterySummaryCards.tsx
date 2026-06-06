import {
  BarChartOutlined,
  FireOutlined,
  LineChartOutlined,
  PartitionOutlined
} from '@ant-design/icons';
import { Card } from 'antd';
import type { ReactNode } from 'react';
import MetricCard from '../MetricCard';
import MetricGrid from '../MetricGrid';
import type { FrequencyItem, LotteryStats } from '../../utils/lotteryStats';

interface LotterySummaryCardsProps {
  stats: LotteryStats;
}

interface NumberFrequencyCardProps {
  title: string;
  item?: FrequencyItem;
  accent: string;
  icon: ReactNode;
  ballClassName: string;
  description: (item: FrequencyItem) => string;
  emptyText: string;
}

const formatHotNumber = (number?: string) => number || '--';

const getLeastFrequentNumber = (frequency: FrequencyItem[]) =>
  [...frequency].sort((left, right) => left.count - right.count || Number(left.number) - Number(right.number))[0];

const NumberFrequencyCard = ({
  title,
  item,
  accent,
  icon,
  ballClassName,
  description,
  emptyText
}: NumberFrequencyCardProps) => (
  <Card
    className="metric-card lottery-hot-number-card"
    style={{
      borderColor: `${accent}55`
    }}
  >
    <div className="lottery-hot-number-title">
      <span style={{ color: accent }}>{icon}</span>
      <span>{title}</span>
    </div>
    <div className="lottery-hot-number-content">
      <span className={`lottery-hot-number-ball ${ballClassName}`}>{formatHotNumber(item?.number)}</span>
      <div className="lottery-hot-number-copy">
        <strong>{item ? `出现 ${item.count} 次` : '暂无出现记录'}</strong>
        <span>{item ? description(item) : emptyText}</span>
      </div>
    </div>
  </Card>
);

const LotterySummaryCards = ({ stats }: LotterySummaryCardsProps) => {
  const leastFrequentRed = getLeastFrequentNumber(stats.redFrequency);
  const leastFrequentBlue = getLeastFrequentNumber(stats.blueFrequency);

  return (
    <MetricGrid gap={16} minColumnWidth={190}>
      <NumberFrequencyCard
        title="热红球"
        item={stats.mostFrequentRed}
        icon={<FireOutlined />}
        accent="#ff3b30"
        ballClassName="lottery-hot-number-ball-red"
        description={item => `${item.number} 号是全历史出现最多的红球`}
        emptyText="同步数据后显示热门红球"
      />
      <NumberFrequencyCard
        title="冷红球"
        item={leastFrequentRed}
        icon={<LineChartOutlined />}
        accent="#ff3b30"
        ballClassName="lottery-hot-number-ball-red"
        description={item => `${item.number} 号是全历史出现最少的红球`}
        emptyText="同步数据后显示冷门红球"
      />
      <NumberFrequencyCard
        title="热蓝球"
        item={stats.mostFrequentBlue}
        icon={<BarChartOutlined />}
        accent="#0071e3"
        ballClassName="lottery-hot-number-ball-blue"
        description={item => `${item.number} 号是全历史出现最多的蓝球`}
        emptyText="同步数据后显示热门蓝球"
      />
      <NumberFrequencyCard
        title="冷蓝球"
        item={leastFrequentBlue}
        icon={<BarChartOutlined />}
        accent="#0071e3"
        ballClassName="lottery-hot-number-ball-blue"
        description={item => `${item.number} 号是全历史出现最少的蓝球`}
        emptyText="同步数据后显示冷门蓝球"
      />
      <MetricCard
        title="常见结构"
        value={stats.dominantCombination?.name || '--'}
        suffix={stats.dominantCombination ? `${stats.dominantCombination.percentage}%` : undefined}
        prefix={<PartitionOutlined />}
        accent="#5856d6"
      />
    </MetricGrid>
  );
};

export default LotterySummaryCards;
