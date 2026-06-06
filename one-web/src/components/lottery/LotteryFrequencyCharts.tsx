import { Card } from 'antd';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { BLUE_BALL_CHARACTER_MAP, RED_BALL_CHARACTER_MAP } from '../../constants/colors';
import type { FrequencyItem } from '../../utils/lotteryStats';

interface LotteryFrequencyChartsProps {
  redFrequency: FrequencyItem[];
  blueFrequency: FrequencyItem[];
}

const createBarOption = (
  title: string,
  data: FrequencyItem[],
  color: string,
  nameMap: Record<string, string>
): EChartsOption => ({
  backgroundColor: 'transparent',
  grid: {
    left: 28,
    right: 18,
    top: 18,
    bottom: 34
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: params => {
      const [item] = params as Array<{ name: string; value: number }>;
      return `${title}<br/>${nameMap[item.name] || item.name} ${item.name}: ${item.value} 次`;
    }
  },
  xAxis: {
    type: 'category',
    data: data.map(item => item.number),
    axisLabel: {
      color: 'rgba(142, 142, 147, 0.92)',
      fontSize: 10,
      interval: 0,
      rotate: data.length > 20 ? 45 : 0
    },
    axisLine: { lineStyle: { color: 'rgba(127, 127, 127, 0.2)' } }
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: 'rgba(142, 142, 147, 0.92)', fontSize: 10 },
    splitLine: { lineStyle: { color: 'rgba(127, 127, 127, 0.12)' } }
  },
  series: [
    {
      type: 'bar',
      data: data.map(item => item.count),
      itemStyle: {
        color,
        borderRadius: [6, 6, 0, 0]
      },
      barMaxWidth: 18
    }
  ]
});

const LotteryFrequencyCharts = ({ redFrequency, blueFrequency }: LotteryFrequencyChartsProps) => (
  <section className="lottery-chart-grid">
    <Card className="life-panel-card lottery-chart-card">
      <div className="lottery-card-title-row">
        <div>
          <h2>红球频次</h2>
          <p>按出现次数从高到低排列，帮助快速观察冷热分布。</p>
        </div>
      </div>
      <ReactECharts
        option={createBarOption('红球频次', redFrequency, '#ff3b30', RED_BALL_CHARACTER_MAP)}
        className="lottery-chart"
      />
    </Card>

    <Card className="life-panel-card lottery-chart-card">
      <div className="lottery-card-title-row">
        <div>
          <h2>蓝球频次</h2>
          <p>蓝球样本更小，适合结合遗漏和区间一起看。</p>
        </div>
      </div>
      <ReactECharts
        option={createBarOption('蓝球频次', blueFrequency, '#0071e3', BLUE_BALL_CHARACTER_MAP)}
        className="lottery-chart"
      />
    </Card>
  </section>
);

export default LotteryFrequencyCharts;
