import React from 'react';
import ReactECharts from '../LotteryLocalizedECharts';
import { Pagination } from 'antd';
import { useAnalysisData } from './AnalysisDataProvider';
import AnalysisLayout from './AnalysisLayout';
import { GLOBAL_COMBINATION_COLORS } from '../../constants/colors';
import { HEXAGRAMS } from '../../constants/hexagrams';

const LotteryAnalysisPlanetPage: React.FC<{ isTabVisible: boolean }> = ({ isTabVisible }) => {
  const data = useAnalysisData();

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

  const renderHexagonGrid = () => {
    if (data.oddEvenData.length === 0) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#999',
          backgroundColor: 'transparent',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' 
        }}>
          暂无每期组合数据
        </div>
      );
    }

    const combinationToNameMap: { [key: string]: string } = {};
    const nameToColorMap: { [key: string]: string } = {};

    if (data.statisticType === 'red') {
      combinationToNameMap['0奇6偶'] = '地球';
      combinationToNameMap['1奇5偶'] = '水星';
      combinationToNameMap['2奇4偶'] = '金星';
      combinationToNameMap['3奇3偶'] = '火星';
      combinationToNameMap['4奇2偶'] = '木星';
      combinationToNameMap['5奇1偶'] = '土星';
      combinationToNameMap['6奇0偶'] = '天王星';

      nameToColorMap['水星'] = GLOBAL_COMBINATION_COLORS.red['水星'];
      nameToColorMap['金星'] = GLOBAL_COMBINATION_COLORS.red['金星'];
      nameToColorMap['地球'] = GLOBAL_COMBINATION_COLORS.red['地球'];
      nameToColorMap['火星'] = GLOBAL_COMBINATION_COLORS.red['火星'];
      nameToColorMap['木星'] = GLOBAL_COMBINATION_COLORS.red['木星'];
      nameToColorMap['土星'] = GLOBAL_COMBINATION_COLORS.red['土星'];
      nameToColorMap['天王星'] = GLOBAL_COMBINATION_COLORS.red['天王星'];
    } else {
      combinationToNameMap['1奇0偶'] = '太阳';
      combinationToNameMap['0奇1偶'] = '月亮';

      nameToColorMap['太阳'] = GLOBAL_COMBINATION_COLORS.blue['太阳'];
      nameToColorMap['月亮'] = GLOBAL_COMBINATION_COLORS.blue['月亮'];
    }

    const hexSize = window.innerWidth > 1200 ? 48 : window.innerWidth > 900 ? 44 : 40;
    const hexSpacing = 24;
    const hexHeight = Math.sqrt(3) * hexSize;
    const hexWidth = 2 * hexSize;
    const rowHeight = hexHeight + hexSpacing;
    const colWidth = hexWidth * 0.75 + hexSpacing;

    const itemsPerRow = 12;
    const actualContainerWidth = (itemsPerRow * colWidth);

    const renderSingleHexagon = (x: number, y: number, gradientId: string, period: number) => {
      const cornerRadius = hexSize * 0.15;
      const path = [];

      for (let i = 0; i < 6; i++) {
        const angle1 = (i * Math.PI) / 3 - Math.PI / 2;
        const angle2 = ((i + 1) * Math.PI) / 3 - Math.PI / 2;

        const x1 = x + (hexSize - cornerRadius) * Math.cos(angle1);
        const y1 = y + (hexSize - cornerRadius) * Math.sin(angle1);

        const x3 = x + (hexSize - cornerRadius) * Math.cos(angle2);
        const y3 = y + (hexSize - cornerRadius) * Math.sin(angle2);

        if (i === 0) {
          path.push(`M ${x1} ${y1}`);
        } else {
          path.push(`L ${x1} ${y1}`);
        }

        path.push(`A ${cornerRadius} ${cornerRadius} 0 0 1 ${x3} ${y3}`);
      }

      path.push('Z');

      return (
        <g 
          key={period}
          style={{
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.stopPropagation();
            data.setSelectedPeriod(period);
            data.setPopupPosition({ x, y });
            data.setIsPopupVisible(true);
          }}
        >
          <path
            d={path.join(' ')}
            fill={`url(#${gradientId})`}
          />
          <text
            x={x}
            y={y + 5}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fill="#fff"
            fontWeight="bold"
            pointerEvents="none"
          >
            {period}
          </text>
        </g>
      );
    };

    const renderPopup = () => {
      if (!data.isPopupVisible || data.selectedPeriod === null) return null;

      const [startIndex] = data.sliderRange;
      const periodIndex = data.selectedPeriod - startIndex - 1;

      const [startRange, endRange] = data.sliderRange;
      const selectedRangeRecords = data.allRecords.slice(startRange, endRange + 1);
      const record = selectedRangeRecords[periodIndex];

      if (!record) return null;

      let numbers: string[];
      if (data.statisticType === 'red') {
        numbers = [];
        for (let i = 0; i < 12; i += 2) {
          numbers.push(record.substring(i, i + 2));
        }
      } else {
        numbers = [record.substring(12, 14)];
      }

      const oddEvenItem = data.oddEvenData.find(item => item.period === data.selectedPeriod);
      if (!oddEvenItem) return null;

      const sumItem = data.sumData.find(item => item.period === data.selectedPeriod);
      if (!sumItem) return null;

      const originalCombination = `${oddEvenItem.oddCount}奇${oddEvenItem.evenCount}偶`;
      const combination = combinationToNameMap[originalCombination] || originalCombination;
      const baseColor = nameToColorMap[combination as keyof typeof nameToColorMap] || '#999';
      const centerColor = baseColor;

      const calculateHexagram = (redNumbers: string[]) => {
        const trigrams = redNumbers.map(num => {
          const n = parseInt(num, 10);
          return n % 2 === 1 ? '1' : '0';
        });
        const hexagramCode = trigrams.join('');
        return HEXAGRAMS[hexagramCode as keyof typeof HEXAGRAMS]?.name || '坤';
      };

      const hexagram = calculateHexagram(numbers);

      const popupWidth = 240;
      const popupHeight = 120;
      let leftPosition = data.popupPosition.x - popupWidth / 2;
      let topPosition = data.popupPosition.y - popupHeight;

      if (leftPosition < 10) {
        leftPosition = 10;
      }

      if (leftPosition + popupWidth > actualContainerWidth - 10) {
        leftPosition = actualContainerWidth - popupWidth - 10;
      }

      if (topPosition < 10) {
        topPosition = 10;
      }

      const svgHeight = Math.ceil(data.oddEvenData.length / itemsPerRow) * rowHeight + hexSize;
      if (topPosition + popupHeight > svgHeight - 10) {
        topPosition = data.popupPosition.y + 40;
      }

      return (
        <div
          style={{
            position: 'absolute',
            left: `${leftPosition}px`,
            top: `${topPosition}px`,
            zIndex: 1000,
            pointerEvents: 'auto'
          }}
        >
          <div
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              boxShadow: `0 0 25px ${baseColor}80, 0 15px 40px rgba(0, 0, 0, 0.6), 0 5px 15px ${baseColor}40, inset 0 0 15px ${baseColor}40, inset 0 8px 16px rgba(255, 255, 255, 0.2), inset 0 -8px 16px rgba(0, 0, 0, 0.5)`,
              boxSizing: 'border-box',
              position: 'relative',
              opacity: 0.95,
              overflow: 'hidden',
              backgroundColor: '#1A1A1A',
              backgroundImage: 'linear-gradient(135deg, #282828, #121212, #1A1A1A)',
              transition: 'all 0.4s ease, box-shadow 0.4s ease, background-position 0.4s ease',
              transformStyle: 'preserve-3d',
              perspective: '1000px',
              transform: 'translateZ(0)'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 2
            }}>
              <div style={{
                color: centerColor,
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '4px'
              }}>
                {sumItem.sum}
              </div>
              <div style={{
                color: centerColor,
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {hexagram}
              </div>
            </div>

            {data.statisticType === 'red' ? (
              numbers.map((number, index) => {
                const num = parseInt(number);
                const isOdd = num % 2 === 1;
                const ballColor = isOdd ? '#FF3333' : '#FF8888';

                const angle = (index / 6) * 2 * Math.PI;
                const radius = 70;
                const xPos = Math.cos(angle) * radius;
                const yPos = Math.sin(angle) * radius;

                return (
                  <div key={number} style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) translate(${xPos}px, ${yPos}px)`,
                    opacity: 1,
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    backgroundColor: '#1A1A1A',
                    backgroundImage: 'linear-gradient(135deg, #282828, #121212, #1A1A1A)',
                    color: ballColor,
                    boxShadow: `0 0 12px ${ballColor}80, inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                    border: `1px solid ${ballColor}50`,
                    zIndex: 3,
                    transition: 'all 0.3s ease'
                  }}>
                    {number}
                  </div>
                );
              })
            ) : (
              <div style={{
                position: 'absolute',
                top: '50%',
                right: '15%',
                transform: 'translateY(-50%)',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '16px',
                fontWeight: 'bold',
                backgroundColor: '#1A1A1A',
                backgroundImage: 'linear-gradient(135deg, #282828, #121212, #1A1A1A)',
                color: parseInt(numbers[0], 10) % 2 === 1 ? 'rgba(255, 0, 0, 0.8)' : 'rgba(156, 39, 176, 0.8)',
                boxShadow: `0 0 12px ${parseInt(numbers[0], 10) % 2 === 1 ? 'rgba(255, 0, 0, 0.5)' : 'rgba(156, 39, 176, 0.5)'}, inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                border: `1px solid ${parseInt(numbers[0], 10) % 2 === 1 ? 'rgba(255, 0, 0, 0.3)' : 'rgba(156, 39, 176, 0.3)'}`,
                zIndex: 3,
                transition: 'all 0.3s ease'
              }}>
                {numbers[0]}
              </div>
            )}
          </div>
        </div>
      );
    };

    const filteredData = data.currentCombination
      ? data.oddEvenData.filter(item => {
          const originalCombination = `${item.oddCount}奇${item.evenCount}偶`;
          const combination = combinationToNameMap[originalCombination] || originalCombination;
          return combination === data.currentCombination;
        })
      : data.oddEvenData;

    const reversedData = [...filteredData].reverse();

    const totalItems = reversedData.length;
    const startIndex = (data.hexagonCurrentPage - 1) * data.hexagonPageSize;
    const endIndex = startIndex + data.hexagonPageSize;
    const currentPageData = reversedData.slice(startIndex, endIndex);

    let allPossibleCombinations: string[];
    if (data.statisticType === 'red') {
      allPossibleCombinations = ['地球', '水星', '金星', '火星', '木星', '土星', '天王星'];
    } else {
      allPossibleCombinations = ['太阳', '月亮'];
    }

    return (
      <div style={{ 
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
        overflow: 'hidden',
        position: 'relative',
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
      }}>

        <div style={{ 
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          marginTop: '30px',
          marginBottom: '20px',
          justifyContent: 'center',
          padding: '0 16px',
          boxSizing: 'border-box'
        }}>
          {allPossibleCombinations.map(combination => (
            <button
              key={combination}
              onClick={() => data.setCurrentCombination(combination)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: `1px solid ${nameToColorMap[combination as keyof typeof nameToColorMap] || '#d9d9d9'}`,
                backgroundColor: data.currentCombination === combination 
                  ? (nameToColorMap[combination as keyof typeof nameToColorMap] || '#d9d9d9') 
                  : '#fff',
                color: data.currentCombination === combination ? '#fff' : (nameToColorMap[combination as keyof typeof nameToColorMap] || '#333'),
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              {combination}
            </button>
          ))}
        </div>

        <div 
          style={{ 
            overflow: 'hidden',
            padding: '20px 0',
            textAlign: 'center',
            position: 'relative'
          }}
        >
          <div style={{ 
            display: 'inline-block',
            position: 'relative'
          }}>
            <svg
              width={actualContainerWidth}
              height={Math.max(Math.ceil(currentPageData.length / itemsPerRow) * rowHeight + hexSize, 300)}
              style={{ overflow: 'visible' }}
            >
              <defs>
                {Object.keys(nameToColorMap).map((key) => {
                  const color = nameToColorMap[key as keyof typeof nameToColorMap];
                  return (
                    <radialGradient key={key} id={`gradient-${key}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                      <stop offset="0%" stopColor={color} stopOpacity="1" />
                      <stop offset="30%" stopColor={color} stopOpacity="0.85" />
                      <stop offset="60%" stopColor={color} stopOpacity="0.65" />
                      <stop offset="100%" stopColor={color} stopOpacity="0.3" />
                    </radialGradient>
                  );
                })}
                <radialGradient id="gradient-default" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" stopColor="#999" stopOpacity="1" />
                  <stop offset="30%" stopColor="#999" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#999" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#999" stopOpacity="0.3" />
                </radialGradient>
              </defs>

              {currentPageData.map((item, index) => {
                const row = Math.floor(index / itemsPerRow);
                const col = index % itemsPerRow;
                const x = col * colWidth + hexSize;
                const y = row * rowHeight + hexSize + (col % 2) * (rowHeight / 2);
                const originalCombination = `${item.oddCount}奇${item.evenCount}偶`;
                const combination = combinationToNameMap[originalCombination] || originalCombination;

                const gradientId = nameToColorMap[combination as keyof typeof nameToColorMap] ? `gradient-${combination}` : 'gradient-default';

                return renderSingleHexagon(x, y, gradientId, item.period);
              })}
            </svg>

            {renderPopup()}
          </div>

          <div style={{ 
            marginTop: '30px', 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Pagination
              current={data.hexagonCurrentPage}
              pageSize={data.hexagonPageSize}
              total={totalItems}
              onChange={(page) => data.setHexagonCurrentPage(page)}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total) => `共 ${total} 期`}
              style={{ 
                color: '#fff'
              }}
            />
          </div>
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
          {renderHexagonGrid()}
        </div>
      </div>
    </AnalysisLayout>
  );
};

export default LotteryAnalysisPlanetPage;
