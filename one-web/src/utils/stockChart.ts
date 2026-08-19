import type { EChartsOption } from 'echarts';
import type { StockKLine } from '../services/api';

export type SubChart = 'volume' | 'macd' | 'kdj';

export type ChartText = {
  periodLabel: string;
  volumeLabel: string;
};

const MA_WINDOWS = [5, 10, 20, 60];
const MA_COLORS = ['#f5222d', '#ff9500', '#0071e3', '#5856d6'];

export const calculateMovingAverage = (kLines: StockKLine[], windowSize: number): (number | '-')[] => {
  return kLines.map((_, index) => {
    if (index < windowSize - 1) {
      return '-';
    }
    const values = kLines.slice(index - windowSize + 1, index + 1).map(item => Number(item.close || 0));
    const total = values.reduce((sum, value) => sum + value, 0);
    return Number((total / windowSize).toFixed(2));
  });
};

export const calculateMacd = (kLines: StockKLine[]) => {
  const closes = kLines.map(item => Number(item.close || 0));
  const dif: number[] = [];
  const dea: number[] = [];
  const macd: number[] = [];
  let ema12 = closes[0] || 0;
  let ema26 = closes[0] || 0;
  const alpha12 = 2 / 13;
  const alpha26 = 2 / 27;
  const alpha9 = 2 / 10;
  let deaValue = 0;
  for (let i = 0; i < closes.length; i++) {
    const close = closes[i];
    ema12 = i === 0 ? close : ema12 * (1 - alpha12) + close * alpha12;
    ema26 = i === 0 ? close : ema26 * (1 - alpha26) + close * alpha26;
    const difValue = ema12 - ema26;
    deaValue = i === 0 ? difValue : deaValue * (1 - alpha9) + difValue * alpha9;
    dif.push(Number(difValue.toFixed(4)));
    dea.push(Number(deaValue.toFixed(4)));
    macd.push(Number((2 * (difValue - deaValue)).toFixed(4)));
  }
  return { dif, dea, macd };
};

export const calculateKdj = (kLines: StockKLine[]) => {
  const kValues: number[] = [];
  const dValues: number[] = [];
  const jValues: number[] = [];
  let prevK = 50;
  let prevD = 50;
  for (let i = 0; i < kLines.length; i++) {
    const start = Math.max(0, i - 8);
    const window = kLines.slice(start, i + 1);
    const high = Math.max(...window.map(item => Number(item.high || 0)));
    const low = Math.min(...window.map(item => Number(item.low || 0)));
    const close = Number(kLines[i].close || 0);
    const rsv = high === low ? 50 : ((close - low) / (high - low)) * 100;
    const k = (2 / 3) * prevK + (1 / 3) * rsv;
    const d = (2 / 3) * prevD + (1 / 3) * k;
    const j = 3 * k - 2 * d;
    kValues.push(Number(k.toFixed(2)));
    dValues.push(Number(d.toFixed(2)));
    jValues.push(Number(j.toFixed(2)));
    prevK = k;
    prevD = d;
  }
  return { k: kValues, d: dValues, j: jValues };
};

export const buildKLineChartOption = (
  kLines: StockKLine[],
  text: ChartText,
  subCharts: SubChart[] = ['volume']
): EChartsOption => {
  const sortedKLines = [...kLines].sort((left, right) => left.tradeDate.localeCompare(right.tradeDate));
  const dates = sortedKLines.map(item => item.tradeDate);
  const candleData = sortedKLines.map(item => [
    Number(item.open || 0),
    Number(item.close || 0),
    Number(item.low || 0),
    Number(item.high || 0)
  ]);

  const subChartCount = subCharts.length;
  const mainHeight = 260;
  const subHeight = subChartCount > 0 ? Math.max(60, Math.floor(92 / subChartCount * 1.2)) : 0;
  const gap = 16;
  const grids: Array<Record<string, number | string>> = [{ left: 48, right: 20, top: 36, height: mainHeight }];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const xAxes: any[] = [{
    type: 'category',
    data: dates,
    boundaryGap: false,
    axisLine: { lineStyle: { color: 'var(--app-border)' } },
    axisLabel: { color: 'var(--app-text-muted)' },
    min: 'dataMin',
    max: 'dataMax'
  }];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const yAxes: any[] = [{
    scale: true,
    splitLine: { lineStyle: { color: 'var(--app-border)' } },
    axisLabel: { color: 'var(--app-text-muted)' }
  }];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const series: any[] = [
    {
      name: text.periodLabel,
      type: 'candlestick',
      data: candleData,
      itemStyle: {
        color: '#f5222d',
        color0: '#16a34a',
        borderColor: '#f5222d',
        borderColor0: '#16a34a'
      }
    },
    ...MA_WINDOWS.map((windowSize, idx) => ({
      name: `MA${windowSize}`,
      type: 'line' as const,
      data: calculateMovingAverage(sortedKLines, windowSize),
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 1.4, color: MA_COLORS[idx] }
    }))
  ];

  let currentTop = 36 + mainHeight + gap;
  const xAxisIndices = [0];
  subCharts.forEach((sub, idx) => {
    grids.push({ left: 48, right: 20, top: currentTop, height: subHeight });
    xAxes.push({
      type: 'category',
      gridIndex: idx + 1,
      data: dates,
      boundaryGap: false,
      axisLine: { lineStyle: { color: 'var(--app-border)' } },
      axisLabel: { color: 'var(--app-text-muted)' },
      min: 'dataMin',
      max: 'dataMax'
    });
    yAxes.push({
      scale: true,
      gridIndex: idx + 1,
      splitNumber: 2,
      splitLine: { lineStyle: { color: 'var(--app-border)' } },
      axisLabel: { color: 'var(--app-text-muted)' }
    });
    xAxisIndices.push(idx + 1);
    if (sub === 'volume') {
      const volumeData = sortedKLines.map((item, index) => {
        const rising = Number(item.close || 0) >= Number(item.open || 0);
        return {
          value: [index, Number(item.volume || 0)],
          itemStyle: { color: rising ? '#f5222d' : '#16a34a' }
        };
      });
      series.push({
        name: text.volumeLabel,
        type: 'bar',
        xAxisIndex: idx + 1,
        yAxisIndex: idx + 1,
        data: volumeData
      });
    } else if (sub === 'macd') {
      const { dif, dea, macd } = calculateMacd(sortedKLines);
      series.push(
        { name: 'DIF', type: 'line', xAxisIndex: idx + 1, yAxisIndex: idx + 1, data: dif, symbol: 'none', lineStyle: { width: 1.2 } },
        { name: 'DEA', type: 'line', xAxisIndex: idx + 1, yAxisIndex: idx + 1, data: dea, symbol: 'none', lineStyle: { width: 1.2 } },
        {
          name: 'MACD',
          type: 'bar',
          xAxisIndex: idx + 1,
          yAxisIndex: idx + 1,
          data: macd.map(value => ({
            value,
            itemStyle: { color: value >= 0 ? '#f5222d' : '#16a34a' }
          }))
        }
      );
    } else if (sub === 'kdj') {
      const { k, d, j } = calculateKdj(sortedKLines);
      series.push(
        { name: 'K', type: 'line', xAxisIndex: idx + 1, yAxisIndex: idx + 1, data: k, symbol: 'none', lineStyle: { width: 1.2 } },
        { name: 'D', type: 'line', xAxisIndex: idx + 1, yAxisIndex: idx + 1, data: d, symbol: 'none', lineStyle: { width: 1.2 } },
        { name: 'J', type: 'line', xAxisIndex: idx + 1, yAxisIndex: idx + 1, data: j, symbol: 'none', lineStyle: { width: 1.2 } }
      );
    }
    currentTop += subHeight + gap;
  });

  return {
    color: ['#f5222d', '#16a34a', '#0071e3', '#ff9500', '#5856d6'],
    animation: false,
    legend: {
      top: 0,
      textStyle: { color: 'var(--app-text-muted)' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    axisPointer: {
      link: [{ xAxisIndex: xAxisIndices }]
    },
    grid: grids,
    xAxis: xAxes,
    yAxis: yAxes,
    dataZoom: [
      { type: 'inside', xAxisIndex: xAxisIndices, start: 55, end: 100 },
      { show: true, xAxisIndex: xAxisIndices, type: 'slider', bottom: 0, start: 55, end: 100 }
    ],
    series
  };
};
