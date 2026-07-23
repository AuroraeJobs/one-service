import { useMemo, useState } from 'react';
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
    return Object.keys(data.oddEvenCombinationAccumulatedData[0].combinations);
  }, [data.oddEvenCombinationAccumulatedData]);

  const effectivePlanet = selectedPlanet && planets.includes(selectedPlanet) ? selectedPlanet : planets[0] || '';

  const planetCalendarData = useMemo(() => {
    if (!effectivePlanet || !data.oddEvenData.length) return [];
    const records: { period: number; date: string; dateKey: string }[] = [];
    data.oddEvenData.forEach(item => {
      const combo = `${item.oddCount}奇${item.evenCount}偶`;
      if (combinationToNameMap[combo] === effectivePlanet) {
        const draw = lotteryDraws[item.period - 1];
        const date = draw?.drawDate;
        if (date) records.push({ period: item.period, date, dateKey: dayjs(date).format('YYYY-MM-DD') });
      }
    });
    return records.sort((a, b) => a.date.localeCompare(b.date));
  }, [effectivePlanet, data.oddEvenData, lotteryDraws, combinationToNameMap]);

  const renderOddEvenChart = () => {
    if (data.oddEvenCombinationAccumulatedData.length === 0) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#999',
          backgroundColor: 'transparent',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' 
        }}>
          暂无宁荣两府数据
        </div>
      );
    }

    const firstItemCombinations = Object.keys(data.oddEvenCombinationAccumulatedData[0].combinations);
    const isBlueModeData = firstItemCombinations.every(comb => comb === '太阳' || comb === '月亮');
    const isRedModeData = firstItemCombinations.some(comb => ['水星', '金星', '地球', '火星', '木星', '土星', '天王星'].includes(comb));

    if (data.statisticType === 'blue' && isRedModeData) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#999',
          backgroundColor: 'transparent',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' 
        }}>
          暂无宁荣两府数据
        </div>
      );
    }

    if (data.statisticType === 'red' && isBlueModeData) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#999',
          backgroundColor: 'transparent',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' 
        }}>
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
      <div 
        style={{ 
          backgroundColor: 'transparent',
          borderRadius: '16px',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          transform: 'perspective(1000px) translateZ(0)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 60px rgba(100, 100, 255, 0.4), inset 0 0 1px rgba(255, 255, 255, 0.5), 0 4px 8px rgba(0, 0, 0, 0.08), 0 12px 24px rgba(0, 0, 0, 0.12), 0 16px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          padding: '20px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          backdropFilter: 'blur(5px)',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'perspective(1000px) translateZ(10px)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 60px rgba(100, 100, 255, 0.6), inset 0 0 1px rgba(255, 255, 255, 0.5), 0 8px 16px rgba(0, 0, 0, 0.1), 0 24px 48px rgba(0, 0, 0, 0.15), 0 32px 64px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'perspective(1000px) translateZ(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 60px rgba(100, 100, 255, 0.4), inset 0 0 1px rgba(255, 255, 255, 0.5), 0 4px 8px rgba(0, 0, 0, 0.08), 0 12px 24px rgba(0, 0, 0, 0.12), 0 16px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)';
        }}
      >
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
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#999',
          backgroundColor: 'transparent',
          borderRadius: '12px',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          transform: 'perspective(1000px) translateZ(0)',
          boxShadow: '0 4px 8px rgba(255, 255, 255, 0.08), 0 12px 24px rgba(255, 255, 255, 0.12), 0 16px 32px rgba(255, 255, 255, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
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
      <div 
        style={{
          backgroundColor: 'transparent',
          borderRadius: '16px',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          transform: 'perspective(1000px) translateZ(0)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 60px rgba(100, 100, 255, 0.4), inset 0 0 1px rgba(255, 255, 255, 0.5), 0 4px 8px rgba(0, 0, 0, 0.08), 0 12px 24px rgba(0, 0, 0, 0.12), 0 16px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          padding: '20px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          backdropFilter: 'blur(5px)',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'perspective(1000px) translateZ(10px)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 60px rgba(100, 100, 255, 0.6), inset 0 0 1px rgba(255, 255, 255, 0.5), 0 8px 16px rgba(0, 0, 0, 0.1), 0 24px 48px rgba(0, 0, 0, 0.15), 0 32px 64px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'perspective(1000px) translateZ(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 60px rgba(100, 100, 255, 0.4), inset 0 0 1px rgba(255, 255, 255, 0.5), 0 4px 8px rgba(0, 0, 0, 0.08), 0 12px 24px rgba(0, 0, 0, 0.12), 0 16px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)';
        }}
      >
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
      <div 
        style={{
          backgroundColor: 'transparent',
          borderRadius: '16px',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          transform: 'perspective(1000px) translateZ(0)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 60px rgba(100, 100, 255, 0.4), inset 0 0 1px rgba(255, 255, 255, 0.5), 0 4px 8px rgba(0, 0, 0, 0.08), 0 12px 24px rgba(0, 0, 0, 0.12), 0 16px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          padding: '20px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          backdropFilter: 'blur(5px)',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'perspective(1000px) translateZ(10px)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 60px rgba(100, 100, 255, 0.6), inset 0 0 1px rgba(255, 255, 255, 0.5), 0 8px 16px rgba(0, 0, 0, 0.1), 0 24px 48px rgba(0, 0, 0, 0.15), 0 32px 64px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'perspective(1000px) translateZ(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 60px rgba(100, 100, 255, 0.4), inset 0 0 1px rgba(255, 255, 255, 0.5), 0 4px 8px rgba(0, 0, 0, 0.08), 0 12px 24px rgba(0, 0, 0, 0.12), 0 16px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)';
        }}
      >
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
          {planets.length > 0 && (
            <div style={{
              marginBottom: '16px',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <span style={{ color: '#999', fontSize: 13 }}>星球记录日历</span>
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
                      boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                      opacity: 1,
                    }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          )}
          {effectivePlanet && planetCalendarData.length > 0 && (
            <div style={{
              background: 'var(--app-surface-elevated)', borderRadius: 14, padding: 20,
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16 }}>
                {effectivePlanet} · 共 {planetCalendarData.length} 期
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(7, 22px)',
                gap: 4, justifyContent: 'center'
              }}>
                {['日','一','二','三','四','五','六'].map(w => (
                  <div key={w} style={{ textAlign: 'center', fontSize: 10, color: '#666' }}>{w}</div>
                ))}
                {(() => {
                  const cells: React.ReactNode[] = [];
                  const sorted = [...planetCalendarData].sort((a, b) => a.date.localeCompare(b.date));
                  const firstDate = dayjs(sorted[0].date);
                  const lastDate = dayjs(sorted[sorted.length - 1].date);
                  let cursor = firstDate.startOf('month');
                  while (!cursor.isAfter(lastDate, 'month')) {
                    const daysInMonth = cursor.daysInMonth();
                    for (let d = 1; d <= daysInMonth; d++) {
                      const dt = cursor.date(d);
                      const dateKey = dt.format('YYYY-MM-DD');
                      const hasRecord = sorted.some(r => r.dateKey === dateKey);
                      const period = sorted.find(r => r.dateKey === dateKey)?.period;
                      cells.push(
                        <div
                          key={dateKey}
                          style={{
                            width: 22, height: 22, borderRadius: 4, fontSize: 10,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: hasRecord ? 'pointer' : 'default',
                            background: hasRecord ? planetColors[effectivePlanet] || '#1677ff' : 'transparent',
                            color: hasRecord ? '#fff' : '#555',
                            ...(d === 1 ? { gridColumn: dt.day() + 1 } : {}),
                          }}
                          title={hasRecord && period ? `第${period}期` : ''}
                        >
                          {hasRecord ? d : ''}
                        </div>
                      );
                    }
                    cursor = cursor.add(1, 'month');
                  }
                  return cells;
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </AnalysisLayout>
  );
};

export default LotteryAnalysisPlanetPage;
