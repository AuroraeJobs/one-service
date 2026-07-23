import { useCallback, useMemo, useState } from 'react';
import { Button, Card, Popover, Space } from 'antd';
import { FastBackwardOutlined, FastForwardOutlined, StepBackwardOutlined, StepForwardOutlined } from '@ant-design/icons';
import type { EChartsOption } from 'echarts';
import ReactECharts from '../LotteryLocalizedECharts';
import { useAnalysisData } from './AnalysisDataProvider';
import AnalysisLayout from './AnalysisLayout';
import { useRecordContext } from '../../contexts/RecordContext';
import dayjs from 'dayjs';

interface Props { isTabVisible: boolean }
const planetColors: Record<string, string> = {
  地球: '#1890ff', 水星: '#52c41a', 金星: '#faad14',
  火星: '#f5222d', 木星: '#13c2c2', 土星: '#fa8c16', 天王星: '#722ed1',
  太阳: '#f5222d', 月亮: '#722ed1',
};

const LotteryAnalysisPlanetPage = ({ isTabVisible }: Props) => {
  const data = useAnalysisData();
  const { lotteryDraws } = useRecordContext();
  const [selectedPlanet, setSelectedPlanet] = useState('');

  const combinationToNameMap = useMemo(() => data.statisticType === 'blue'
    ? { '1奇0偶': '太阳', '0奇1偶': '月亮' }
    : { '0奇6偶': '地球', '1奇5偶': '水星', '2奇4偶': '金星', '3奇3偶': '火星', '4奇2偶': '木星', '5奇1偶': '土星', '6奇0偶': '天王星' },
  [data.statisticType]);

  const planets = useMemo(() => {
    if (!data.oddEvenCombinationAccumulatedData.length) return [];
    const keys = Object.keys(data.oddEvenCombinationAccumulatedData[0].combinations);
    return keys.map(k => combinationToNameMap[k] || k);
  }, [data.oddEvenCombinationAccumulatedData, combinationToNameMap]);

  const effectivePlanet = selectedPlanet && planets.includes(selectedPlanet) ? selectedPlanet : planets[0] || '';

  const computePlanetFromCompact = useCallback((compactRecord: string) => {
    const isBlue = data.statisticType === 'blue';
    const numbers: string[] = isBlue
      ? [compactRecord.substring(12, 14)]
      : Array.from({ length: 6 }, (_, i) => compactRecord.substring(i * 2, i * 2 + 2));
    let oddCount = 0, evenCount = 0;
    numbers.forEach(n => { const v = parseInt(n); if (v % 2 === 0) evenCount++; else oddCount++; });
    if (isBlue) {
      return oddCount === 1 && evenCount === 0 ? '太阳' : '月亮';
    }
    const combo = `${oddCount}奇${evenCount}偶`;
    return combinationToNameMap[combo] || '';
  }, [data.statisticType, combinationToNameMap]);

  const makeCompactRecord = useCallback((draw: LotteryDraw): string | null => {
    if (draw.raw && /^\d{14}$/.test(draw.raw)) return draw.raw;
    if (draw.redNumbers?.length === 6 && draw.blueNumber) return draw.redNumbers.join('') + draw.blueNumber;
    return null;
  }, []);

  const planetCalendarData = useMemo(() => {
    if (!effectivePlanet) return [];
    if (!lotteryDraws || lotteryDraws.length === 0) return [];
    const records: { period: number; date: string; dateKey: string }[] = [];
    lotteryDraws.forEach(draw => {
      if (!draw.drawDate || !draw.period) return;
      const compact = makeCompactRecord(draw);
      if (!compact) return;
      const planet = computePlanetFromCompact(compact);
      if (planet === effectivePlanet) {
        records.push({
          period: draw.period,
          date: draw.drawDate,
          dateKey: dayjs(draw.drawDate).format('YYYY-MM-DD')
        });
      }
    });
    return records.sort((a, b) => a.date.localeCompare(b.date));
  }, [effectivePlanet, lotteryDraws, makeCompactRecord, computePlanetFromCompact]);

  const [selectedYear, setSelectedYear] = useState(dayjs().year());

  const availableYears = useMemo(() => {
    const years = new Set<number>([dayjs().year()]);
    planetCalendarData.forEach(r => years.add(dayjs(r.date).year()));
    return [...years].sort((a, b) => b - a);
  }, [planetCalendarData]);

  const filteredCalendarData = useMemo(() => (
    planetCalendarData.filter(r => dayjs(r.date).year() === selectedYear)
  ), [planetCalendarData, selectedYear]);

  const calendarMonthBlocks = useMemo(() => {
    const months: { key: string; label: string; days: { dateKey: string; day: number; weekday: number; hasRecord: boolean; records: typeof planetCalendarData }[] }[] = [];
    for (let m = 0; m < 12; m++) {
      const cursor = dayjs().year(selectedYear).month(m);
      const monthKey = cursor.format('YYYY-MM');
      const daysInMonth = cursor.daysInMonth();
      const days = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dt = cursor.date(d);
        const dateKey = dt.format('YYYY-MM-DD');
        const recs = planetCalendarData.filter(r => r.dateKey === dateKey);
        days.push({ dateKey, day: d, weekday: dt.day(), hasRecord: recs.length > 0, records: recs });
      }
      months.push({ key: monthKey, label: cursor.format('MMM'), days });
    }
    return months;
  }, [selectedYear, planetCalendarData]);

  const yearStats = useMemo(() => {
    let recordDays = 0;
    let total = 0;
    calendarMonthBlocks.forEach(m => {
      m.days.forEach(d => {
        if (d.hasRecord) {
          recordDays++;
          total += d.records.length;
        }
      });
    });
    return { recordDays, total };
  }, [calendarMonthBlocks]);

  const isBlueMode = data.statisticType === 'blue';
  const planetPanelStyle: React.CSSProperties = {
    borderRadius: 12,
    border: '1px solid var(--app-border)',
    background: 'var(--app-surface)',
    padding: '20px',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
  };

  const monthlyChartOption = useMemo<EChartsOption>(() => {
    const monthData = Array(12).fill(0);
    filteredCalendarData.forEach(r => {
      const d = dayjs(r.date);
      monthData[d.month()]++;
    });
    return {
      tooltip: { trigger: 'axis' as const },
      xAxis: {
        type: 'category' as const,
        data: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
        splitLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: { type: 'value' as const, minInterval: 1, splitLine: { show: false } },
      grid: { left: 36, right: 16, top: 28, bottom: 24 },
      series: [{
        type: 'line' as const,
        smooth: true,
        data: monthData,
        lineStyle: { width: 2, color: isBlueMode ? '#1677ff' : '#cf1322' },
        itemStyle: { color: isBlueMode ? '#1677ff' : '#cf1322' },
        symbol: 'circle' as const,
        symbolSize: 5,
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: isBlueMode ? 'rgba(22,119,255,0.25)' : 'rgba(207,19,34,0.25)' },
              { offset: 1, color: 'rgba(0,0,0,0)' },
            ],
          },
        },
      }],
    };
  }, [filteredCalendarData, isBlueMode]);

  const selectedYearIdx = availableYears.indexOf(selectedYear);

  const renderOddEvenChart = () => {
    if (data.oddEvenCombinationAccumulatedData.length === 0) {
      return (
        <div style={{ ...planetPanelStyle, padding: '40px', textAlign: 'center', color: '#999' }}>
          暂无宁荣两府数据
        </div>
      );
    }

    const firstItemCombinations = Object.keys(data.oddEvenCombinationAccumulatedData[0].combinations);
    const isBlueModeData = firstItemCombinations.every(comb => comb === '太阳' || comb === '月亮');
    const isRedModeData = firstItemCombinations.some(comb => ['水星', '金星', '地球', '火星', '木星', '土星', '天王星'].includes(comb));

    if (data.statisticType === 'blue' && isRedModeData) {
      return (
        <div style={{ ...planetPanelStyle, padding: '40px', textAlign: 'center', color: '#999' }}>
          暂无宁荣两府数据
        </div>
      );
    }

    if (data.statisticType === 'red' && isBlueModeData) {
      return (
        <div style={{ ...planetPanelStyle, padding: '40px', textAlign: 'center', color: '#999' }}>
          暂无宁荣两府数据
        </div>
      );
    }

    const nameToColorMap: { [key: string]: string } = {};

    if (data.statisticType === 'red') {
      nameToColorMap['地球'] = '#1890ff';
      nameToColorMap['水星'] = '#52c41a';
      nameToColorMap['金星'] = '#faad14';
      nameToColorMap['火星'] = '#f5222d';
      nameToColorMap['木星'] = '#13c2c2';
      nameToColorMap['土星'] = '#fa8c16';
      nameToColorMap['天王星'] = '#722ed1';
    } else {
      nameToColorMap['太阳'] = '#f5222d';
      nameToColorMap['月亮'] = '#722ed1';
    }

    const periods = data.oddEvenCombinationAccumulatedData.map(item => item.period);

    const allCombinations = data.oddEvenCombinationAccumulatedData.length > 0 
      ? (() => {
          const combinations = Object.keys(data.oddEvenCombinationAccumulatedData[0].combinations);
          if (data.statisticType === 'blue') {
            return combinations.filter(comb => comb === '太阳' || comb === '月亮');
          }
          const desiredOrder = ['地球', '水星', '金星', '火星', '木星', '土星', '天王星'];
          return desiredOrder.filter(comb => combinations.includes(comb));
        })()
      : [];

    const series = allCombinations.map((combination) => {
      const dataArr = data.oddEvenCombinationAccumulatedData.map(item => item.combinations[combination]);

      const color = nameToColorMap[combination as keyof typeof nameToColorMap] || '#999';

      const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      return {
        name: combination,
        type: 'line',
        smooth: true,
        data: dataArr,
        itemStyle: {
          color: color
        },
        lineStyle: {
          width: 3,
          type: 'solid',
          color: color
        },
        symbol: 'circle',
        symbolSize: 6,
        emphasis: {
          focus: 'series',
          scale: true,
          symbolSize: 10,
          itemStyle: {
            shadowBlur: 10,
            shadowColor: hexToRgba(color, 0.5)
          }
        },
        label: {
          show: false
        }
      };
    });

    const option = {
      backgroundColor: 'transparent',
      textStyle: {
        color: '#fff'
      },
      animation: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        formatter: function(params: Array<{ axisValue: number; marker: string; seriesName: string; value: number }>) {
          let result = `${params[0].axisValue}期<br/>`;
          params.forEach((param) => {
            result += `${param.marker}${param.seriesName}: ${param.value}次<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: allCombinations,
        top: '5%',
        textStyle: {
          fontSize: 12
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '12%',
        containLabel: true
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
          xAxisIndex: 0
        },
        {
          type: 'slider',
          start: 0,
          end: 100,
          show: true,
          xAxisIndex: 0,
          bottom: '5%',
          height: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          fillerColor: data.statisticType === 'red' ? 'rgba(245, 34, 45, 0.2)' : 'rgba(24, 144, 255, 0.2)',
          handleStyle: {
            color: data.statisticType === 'red' ? '#f5222d' : '#1890ff'
          },
          textStyle: {
            color: '#666'
          },
          startLabel: {
            show: true,
            formatter: function(params: { value: number }) {
              return params.value + '期';
            }
          },
          endLabel: {
            show: true,
            formatter: function(params: { value: number }) {
              return params.value + '期';
            }
          }
        }
      ],
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          data: periods,
          axisLabel: {
            fontSize: 12,
            rotate: 45
          },
          axisLine: {
            lineStyle: {
              color: '#666'
            }
          },
          splitLine: {
            show: false
          }
        }
      ],
      yAxis: [
        {
          type: 'value',
          axisLabel: {
            fontSize: 12
          },
          axisLine: {
            lineStyle: {
              color: '#666'
            }
          },
          splitLine: {
            show: false
          }
        }
      ],
      series: series
    };

    return (
      <div style={planetPanelStyle}>
        <div 
          style={{ 
            height: '500px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
          <ReactECharts option={option} style={{ height: '100%', width: '100%', backgroundColor: 'transparent' }} />
        </div>
      </div>
    );
  };

  const renderOddEvenPieChart = () => {
    if (data.oddEvenCombinationData.length === 0) {
      return (
        <div style={{ ...planetPanelStyle, padding: '40px', textAlign: 'center', color: '#999' }}>
          暂无奇偶组合统计数据
        </div>
      );
    }

    const nameToColorMap: { [key: string]: string } = {};

    if (data.statisticType === 'red') {
      nameToColorMap['地球'] = '#1890ff';
      nameToColorMap['水星'] = '#52c41a';
      nameToColorMap['金星'] = '#faad14';
      nameToColorMap['火星'] = '#f5222d';
      nameToColorMap['木星'] = '#13c2c2';
      nameToColorMap['土星'] = '#fa8c16';
      nameToColorMap['天王星'] = '#722ed1';
    } else {
      nameToColorMap['太阳'] = '#f5222d';
      nameToColorMap['月亮'] = '#722ed1';
    }

    const desiredOrder = data.statisticType === 'red' 
      ? ['地球', '水星', '金星', '火星', '木星', '土星', '天王星']
      : ['太阳', '月亮'];
    const pieData = desiredOrder
      .map(name => {
        const item = data.oddEvenCombinationData.find(item => item.combination === name);
        return {
          name: name,
          value: item ? item.count : 0,
          itemStyle: {
            color: nameToColorMap[name as keyof typeof nameToColorMap] || '#999'
          }
        };
      });

    const option = {
      backgroundColor: 'transparent',
      textStyle: {
        color: '#fff'
      },
      animation: false,
      tooltip: {
        trigger: 'item',
        formatter: '{b}\n{c} ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        top: '5%',
        left: 'center',
        data: pieData.map(item => item.name),
        type: 'scroll',
        textStyle: {
          fontSize: 12
        },
        itemWidth: 15,
        itemHeight: 15,
        maxWidth: 500,
        pageIconSize: 12,
        pageTextStyle: {
          fontSize: 10
        }
      },
      series: [
        {
          name: '奇偶组合次数',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '55%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10
          },
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}\n{c} ({d}%)',
            fontSize: 12,
            fontWeight: 'normal',
            color: '#fff',
            textBorderColor: 'transparent',
            textBorderWidth: 0,
            textShadowBlur: 0
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold',
              formatter: '{b}\n{c} ({d}%)',
              color: '#fff',
              textBorderColor: 'transparent',
              textBorderWidth: 0,
              textShadowBlur: 0
            }
          },
          labelLine: {
            show: true,
            length: 20,
            length2: 10
          },
          data: pieData
        }
      ]
    };

    return (
      <div style={planetPanelStyle}>
        <div 
          style={{ 
            height: '500px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
          <ReactECharts option={option} style={{ height: '100%', width: '100%', backgroundColor: 'transparent' }} />
        </div>
      </div>
    );
  };

  const renderPlanetPieChart = () => {
    const planetData = [
      { name: '地球', value: 8008 },
      { name: '水星', value: 74256 },
      { name: '金星', value: 247520 },
      { name: '火星', value: 380800 },
      { name: '木星', value: 285600 },
      { name: '土星', value: 99008 },
      { name: '天王星', value: 12376 }
    ];

    const nameToColorMap: { [key: string]: string } = {
      '地球': '#1890ff',
      '水星': '#52c41a',
      '金星': '#faad14',
      '火星': '#f5222d',
      '木星': '#13c2c2',
      '土星': '#fa8c16',
      '天王星': '#722ed1'
    };

    const pieData = planetData.map(item => ({
      name: item.name,
      value: item.value,
      itemStyle: {
        color: nameToColorMap[item.name] || '#999'
      }
    }));

    const option = {
      backgroundColor: 'transparent',
      textStyle: {
        color: '#fff'
      },
      animation: false,
      tooltip: {
        trigger: 'item',
        formatter: '{b}\n{c} ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        top: '5%',
        left: 'center',
        data: pieData.map(item => item.name),
        type: 'scroll',
        textStyle: {
          fontSize: 12
        },
        itemWidth: 15,
        itemHeight: 15,
        maxWidth: 500,
        pageIconSize: 12,
        pageTextStyle: {
          fontSize: 10
        }
      },
      series: [
        {
          name: '行星数据',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '55%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10
          },
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}\n{c} ({d}%)',
            fontSize: 12,
            fontWeight: 'normal',
            color: '#fff',
            textBorderColor: 'transparent',
            textBorderWidth: 0,
            textShadowBlur: 0
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold',
              formatter: '{b}\n{c} ({d}%)',
              color: '#fff',
              textBorderColor: 'transparent',
              textBorderWidth: 0,
              textShadowBlur: 0
            }
          },
          labelLine: {
            show: true,
            length: 20,
            length2: 10
          },
          data: pieData
        }
      ]
    };

    return (
      <div style={planetPanelStyle}>
        <div 
          style={{ 
            height: '500px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
          <ReactECharts option={option} style={{ height: '100%', width: '100%', backgroundColor: 'transparent' }} />
        </div>
      </div>
    );
  };


  if (data.oddEvenCombinationData.length > 0) {
    const hasMatchingCombination = data.oddEvenCombinationData.some(item => {
      if (data.statisticType === 'blue') {
        return item.combination === '太阳' || item.combination === '月亮';
      } else {
        return ['水星', '金星', '地球', '火星', '木星', '土星', '天王星'].includes(item.combination);
      }
    });

    if (!hasMatchingCombination) {
      return (
        <AnalysisLayout isTabVisible={isTabVisible}>
          <div />
        </AnalysisLayout>
      );
    }
  }

  return (
    <AnalysisLayout isTabVisible={isTabVisible}>
      <div style={{ 
        padding: '16px', 
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ 
          marginBottom: '20px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {renderOddEvenChart()}
        </div>

        <div style={{ 
          display: 'flex',
          gap: '20px',
          marginBottom: '20px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{ 
            width: '50%',
            boxSizing: 'border-box'
          }}>
            {renderOddEvenPieChart()}
          </div>

          <div style={{ 
            width: '50%',
            boxSizing: 'border-box'
          }}>
            {renderPlanetPieChart()}
          </div>
        </div>

        <div style={{
          marginBottom: '20px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {planets.length > 0 && <Card
              className="life-panel-card lottery-planet-calendar-card"
              style={{ border: '1px solid var(--app-border)', borderRadius: 12, background: 'var(--app-surface)' }}
              title={(
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {planets.map(name => {
                    const color = planetColors[name] || '#1677ff';
                    const isActive = effectivePlanet === name;
                    return (
                      <button
                        key={name}
                        onClick={() => setSelectedPlanet(name)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 20,
                          border: `1px solid ${color}`,
                          background: isActive ? color : 'transparent',
                          color: isActive ? '#fff' : color,
                          cursor: 'pointer',
                          fontSize: 14,
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              )}
              extra={availableYears.length > 0 && (
                <Space size={4}>
                  <Button size="small" type="text" icon={<FastBackwardOutlined />} onClick={() => setSelectedYear(availableYears[0])} />
                  <Button size="small" type="text" icon={<StepBackwardOutlined />} disabled={selectedYearIdx <= 0} onClick={() => setSelectedYear(availableYears[selectedYearIdx - 1])} />
                  <Button size="small" shape="round" type="primary" style={{ borderColor: 'transparent' }}>{selectedYear}</Button>
                  <Button size="small" type="text" icon={<StepForwardOutlined />} disabled={selectedYearIdx >= availableYears.length - 1} onClick={() => setSelectedYear(availableYears[selectedYearIdx + 1])} />
                  <Button size="small" type="text" icon={<FastForwardOutlined />} onClick={() => setSelectedYear(availableYears[availableYears.length - 1])} />
                </Space>
              )}
            >
              <ReactECharts option={monthlyChartOption} style={{ height: 180, width: '100%' }} notMerge lazyUpdate />
              <div className="lottery-voyage-heatmap-grid">
                {calendarMonthBlocks.map(month => (
                  <div key={month.key} className="lottery-voyage-heatmap-month">
                    <div className="lottery-voyage-heatmap-label">{month.label}</div>
                    <div className="lottery-voyage-heatmap-weekdays">
                      <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
                    </div>
                    <div className="lottery-voyage-heatmap-days">
                      {month.days.map(day => {
                        const cellColor = planetColors[effectivePlanet] || '#1677ff';
                        return (
                          <div
                            key={day.dateKey}
                            className={'lottery-voyage-heatmap-cell' + (day.hasRecord ? ' is-voyage' : '')}
                            style={{
                              ...(day.hasRecord ? { '--cell-color': cellColor } : {}),
                              ...(day.day === 1 ? { gridColumn: day.weekday + 1 } : {}),
                            } as React.CSSProperties}
                          >
                            {day.hasRecord ? (
                              <Popover
                                placement="top"
                                trigger="hover"
                                content={(
                                  <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                                    {day.records.map(r => (
                                      <div key={r.period}>第{r.period}期</div>
                                    ))}
                                  </div>
                                )}
                              >
                                <div className="lottery-voyage-heatmap-cell-inner">{day.day}</div>
                              </Popover>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="lottery-voyage-heatmap-footer">
                <div className="lottery-voyage-heatmap-stats">
                  <span>记录日期: {yearStats.recordDays}</span>
                  <span>总记录: {yearStats.total}</span>
                </div>
                <div className="lottery-voyage-heatmap-legend">
                  <div className="lottery-voyage-heatmap-cell" />
                  <div className="lottery-voyage-heatmap-cell is-voyage" style={{ '--cell-color': planetColors[effectivePlanet] || '#1677ff' } as React.CSSProperties} />
                </div>
              </div>
            </Card>
          }
        </div>
      </div>
    </AnalysisLayout>
  );
};

export default LotteryAnalysisPlanetPage;
