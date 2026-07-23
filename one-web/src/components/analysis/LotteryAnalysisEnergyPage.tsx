import React from 'react';
import ReactECharts from '../LotteryLocalizedECharts';
import { Pagination } from 'antd';
import { useAnalysisData } from './AnalysisDataProvider';
import AnalysisLayout from './AnalysisLayout';
import { getGalaxyName } from '../../constants/galaxies';
import { HEXAGRAMS } from '../../constants/hexagrams';

const LotteryAnalysisEnergyPage: React.FC<{ isTabVisible: boolean }> = ({ isTabVisible }) => {
  const data = useAnalysisData();

  const renderSumChart = () => {
    if (data.sumData.length === 0) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#999',
          backgroundColor: 'transparent',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' 
        }}>
          暂无能量分析数据
        </div>
      );
    }

    const filteredSumData = data.sumData.filter(item => {
      if (data.statisticType === 'blue') {
        return true;
      }

      if (data.sumMode === 'northern') {
        return item.sum >= 21 && item.sum <= 102;
      } else {
        return item.sum >= 102 && item.sum <= 183;
      }
    });

    const periods = filteredSumData.map(item => item.period);
    const sums = filteredSumData.map(item => item.sum);

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
            result += `${param.marker}${param.seriesName}: ${param.value}<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: ['能量总和'],
        top: 0,
        textStyle: {
          fontSize: 12
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '20%',
        top: '8%',
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
          bottom: '8%',
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
      series: [
        {        
          name: '能量总和',
          type: 'line',
          smooth: true,
          data: sums,
          itemStyle: {
            color: '#52c41a'
          },
          lineStyle: {
            width: 3,
            type: 'solid',
            color: '#52c41a'
          },
          symbol: 'circle',
          symbolSize: 6,
          emphasis: {
            focus: 'series',
            scale: true,
            symbolSize: 10,
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(82, 196, 26, 0.5)'
            }
          },
          label: {
            show: true,
            position: 'top',
            color: '#fff',
            fontSize: 12
          }
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

  const renderCombinedSumBarChart = () => {
    if (data.sumCountData.length === 0 || data.sumCombinationCountData.length === 0) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#999',
          backgroundColor: 'transparent',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' 
        }}>
          暂无能量分析数据
        </div>
      );
    }

    const filteredSumCountData = data.sumCountData.filter(item => {
      if (data.statisticType === 'blue') {
        return true;
      }

      if (data.sumMode === 'northern') {
        return item.sum >= 21 && item.sum <= 102;
      } else {
        return item.sum >= 102 && item.sum <= 183;
      }
    });

    const filteredSumCombinationCountData = data.sumCombinationCountData.filter(item => {
      if (data.statisticType === 'blue') {
        return true;
      }

      if (data.sumMode === 'northern') {
        return item.sum >= 21 && item.sum <= 102;
      } else {
        return item.sum >= 102 && item.sum <= 183;
      }
    });

    const sumToCountMap: { [key: number]: number } = {};
    filteredSumCountData.forEach(item => {
      sumToCountMap[item.sum] = item.count;
    });

    const sumToCombinationCountMap: { [key: number]: number } = {};
    filteredSumCombinationCountData.forEach(item => {
      sumToCombinationCountMap[item.sum] = item.combinationCount;
    });

    const allSums = Array.from(new Set([...filteredSumCountData.map(item => item.sum), ...filteredSumCombinationCountData.map(item => item.sum)]));
    allSums.sort((a, b) => a - b);

    const option = {
      backgroundColor: 'transparent',
      textStyle: {
        color: '#fff'
      },
      animation: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params: Array<{ axisValue: number; marker: string; seriesName: string; value: number }>) {
          let result = `${params[0].axisValue}<br/>`;
          params.forEach((param) => {
            const unit = param.seriesName === '出现次数' ? '次' : '种';
            result += `${param.marker}${param.seriesName}: ${param.value}${unit}<br/>`;
          });
          return result;
        }
      },
      legend: {
        show: true,
        data: ['出现次数', '组合数量'],
        top: '5%',
        left: 'center'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '20%',
        top: '15%',
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
          bottom: '8%',
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
              return params.value;
            }
          },
          endLabel: {
            show: true,
            formatter: function(params: { value: number }) {
              return params.value;
            }
          }
        }
      ],
      xAxis: [
        {
          type: 'category',
          data: allSums,
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
        },
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
      series: [
        {
          name: '出现次数',
          type: 'bar',
          data: allSums.map(sum => ({
            value: sumToCountMap[sum] || 0,
            sum: sum,
            combinationCount: sumToCombinationCountMap[sum] || 0
          })),
          itemStyle: {
            color: '#f5222d'
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(245, 34, 45, 0.5)'
            }
          },
          label: {
            show: true,
            position: 'top',
            color: '#fff',
            fontSize: 12
          }
        },
        {
          name: '组合数量',
          type: 'bar',
          yAxisIndex: 1,
          data: allSums.map(sum => ({
            value: sumToCombinationCountMap[sum] || 0,
            sum: sum
          })),
          itemStyle: {
            color: '#1890ff'
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(24, 144, 255, 0.5)'
            }
          },
          label: {
            show: true,
            position: 'top',
            color: '#fff',
            fontSize: 12
          }
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

  const getSumColor = (_sum: number, combinationCount: number) => {
    let hue: number;

    if (data.statisticType === 'red') {
      hue = 0;
    } else {
      hue = 210;
    }

    let maxCombinationCount = 1;
    let minCombinationCount = 0;

    if (data.sumCombinationCountData.length > 0) {
      maxCombinationCount = Math.max(...data.sumCombinationCountData.map(item => item.combinationCount), 1);
      minCombinationCount = Math.min(...data.sumCombinationCountData.map(item => item.combinationCount), 0);
    }

    let normalizedValue = 0;
    if (maxCombinationCount > minCombinationCount) {
      normalizedValue = (combinationCount - minCombinationCount) / (maxCombinationCount - minCombinationCount);
    }

    normalizedValue = Math.max(0, Math.min(1, normalizedValue));

    const saturation = 85;
    const lightness = 50 - normalizedValue * 30;

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const renderRedSumGrid = () => {
    if (data.statisticType !== 'red') {
      return null;
    }

    const sumCombinationMap: { [key: number]: number } = {};
    data.sumCombinationCountData.forEach(item => {
      sumCombinationMap[item.sum] = item.combinationCount;
    });

    let displayRange: number[];
    if (data.sumMode === 'northern') {
      displayRange = Array.from({ length: 82 }, (_, i) => 21 + i);
    } else {
      displayRange = Array.from({ length: 82 }, (_, i) => 102 + i);
    }

    const renderGridItem = (sum: number) => {
      const combinationCount = sumCombinationMap[sum] || 0;
      const sumColor = getSumColor(sum, combinationCount);

      const hexSize = 32;
      const cornerRadius = 3;

      const path = [];
      for (let i = 0; i < 6; i++) {
        const angle1 = (i * Math.PI) / 3 - Math.PI / 2;
        const angle2 = ((i + 1) * Math.PI) / 3 - Math.PI / 2;

        const x1 = (hexSize - cornerRadius) * Math.cos(angle1);
        const y1 = (hexSize - cornerRadius) * Math.sin(angle1);
        const x3 = (hexSize - cornerRadius) * Math.cos(angle2);
        const y3 = (hexSize - cornerRadius) * Math.sin(angle2);

        if (i === 0) {
          path.push(`M ${x1} ${y1}`);
        } else {
          path.push(`L ${x1} ${y1}`);
        }

        path.push(`A ${cornerRadius} ${cornerRadius} 0 0 1 ${x3} ${y3}`);
      }
      path.push('Z');

      const handleGridItemClick = () => {
        data.setSelectedSums(prev => {
          if (prev.includes(sum)) {
            return prev.filter(item => item !== sum);
          } else {
            return [...prev, sum];
          }
        });
      };

      return (
        <div style={{
          position: 'relative',
          display: 'inline-block',
          margin: '5px'
        }}>
          <svg 
            key={sum}
            width="84px"
            height="84px"
            style={{
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              outline: 'none'
            }}
            onClick={handleGridItemClick}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <defs>
              <radialGradient id={`grid-gradient-${sum}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor={sumColor} stopOpacity="1" />
                <stop offset="30%" stopColor={sumColor} stopOpacity="0.85" />
                <stop offset="60%" stopColor={sumColor} stopOpacity="0.65" />
                <stop offset="100%" stopColor={sumColor} stopOpacity="0.3" />
              </radialGradient>
            </defs>
            <g transform="translate(42, 42)">
              <path
                d={path.join(' ')}
                fill={`url(#grid-gradient-${sum})`}
              />
              <text
                x={0}
                y={0}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fill="#fff"
                fontWeight="bold"
                pointerEvents="none"
              >
                {getGalaxyName(sum)}
              </text>
            </g>
          </svg>

          {data.selectedSums.includes(sum) && (
            <div style={{
              position: 'absolute',
              bottom: '-5px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '8px',
              height: '8px',
              backgroundColor: '#52c41a',
              borderRadius: '50%',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              zIndex: 2
            }} />
          )}
        </div>
      );
    };

    const renderGrid = (sumRange: number[]) => {
      const rows: number[][] = [];

      rows.push(sumRange.slice(0, 13));
      rows.push(sumRange.slice(13, 27));
      rows.push(sumRange.slice(27, 41));
      rows.push(sumRange.slice(41, 55));
      rows.push(sumRange.slice(55, 69));
      rows.push(sumRange.slice(69));

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          margin: '0 auto'
        }}>
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '8px'
            }}>
              {row.map(sum => renderGridItem(sum))}
            </div>
          ))}
        </div>
      );
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
          maxWidth: '100%',
          boxSizing: 'border-box',
          marginLeft: 'auto',
          marginRight: 'auto',
          position: 'relative',
          overflow: 'visible',
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
        <div style={{
          display: 'block',
          textAlign: 'center'
        }}>
          <div>
            {renderGrid(displayRange)}
          </div>
        </div>
      </div>
    );
  };

  const renderSumHexagonGrid = () => {
    if (data.sumData.length === 0) {
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
          border: 'none'
        }}>
          暂无总和分析数据
        </div>
      );
    }

    const hexSize = window.innerWidth > 1200 ? 48 : window.innerWidth > 900 ? 44 : 40;
    const hexSpacing = 24;
    const hexHeight = Math.sqrt(3) * hexSize;
    const hexWidth = 2 * hexSize;
    const rowHeight = hexHeight + hexSpacing;
    const colWidth = hexWidth * 0.75 + hexSpacing;

    const itemsPerRow = 12;
    const actualContainerWidth = (itemsPerRow * colWidth);

    const sumToCombinationCount: { [key: number]: number } = {};
    data.sumCombinationCountData.forEach(item => {
      sumToCombinationCount[item.sum] = item.combinationCount;
    });

    const renderHexagon = (x: number, y: number, sum: number, period: number) => {
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

      const combinationCount = sumToCombinationCount[sum] || 0;
      const sumColor = getSumColor(sum, combinationCount);

      return (
        <g 
          key={period}
          style={{
            cursor: 'pointer',
            opacity: 1,
            pointerEvents: 'auto'
          }}
          onMouseEnter={(e) => {
            e.stopPropagation();
            data.setSelectedPeriod(period);
            data.setPopupPosition({ x, y });
            data.setIsPopupVisible(true);
          }}
        >
          <defs>
            <radialGradient id={`gradient-sum-${period}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor={sumColor} stopOpacity="1" />
              <stop offset="30%" stopColor={sumColor} stopOpacity="0.85" />
              <stop offset="60%" stopColor={sumColor} stopOpacity="0.65" />
              <stop offset="100%" stopColor={sumColor} stopOpacity="0.3" />
            </radialGradient>
          </defs>
          <path
            d={path.join(' ')}
            fill={`url(#gradient-sum-${period})`}
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

      const numbers: string[] = [];
      if (data.statisticType === 'red') {
        for (let i = 0; i < 12; i += 2) {
          numbers.push(record.substring(i, i + 2));
        }
      } else {
        numbers.push(record.substring(12, 14));
      }

      const sumItem = data.sumData.find(item => item.period === data.selectedPeriod);
      if (!sumItem) return null;

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

      const svgHeight = Math.ceil(data.sumData.length / itemsPerRow) * rowHeight + hexSize * 2;
      if (topPosition + popupHeight > svgHeight - 10) {
        topPosition = data.popupPosition.y + 40;
      }

      const centerColor = data.statisticType === 'red' ? '#f5222d' : '#1890ff';

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
              boxShadow: `0 0 25px ${centerColor}80, 0 15px 40px rgba(0, 0, 0, 0.6), 0 5px 15px ${centerColor}40, inset 0 0 15px ${centerColor}40, inset 0 8px 16px rgba(255, 255, 255, 0.2), inset 0 -8px 16px rgba(0, 0, 0, 0.5)`,
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

                return (
                  <div key={number} style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) translate(0, 0) scale(0.5)`,
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    background: isOdd 
                      ? `radial-gradient(circle at 25% 25%, #ffffff 0%, #ffb3d9 20%, #ff69b4 50%, #ff3d99 100%)` 
                      : `radial-gradient(circle at 25% 25%, #ffffff 0%, #fff2b3 20%, #f0e68c 50%, #e6c249 100%)`,
                    color: '#333',
                    boxShadow: `0 10px 25px rgba(0, 0, 0, 0.25), inset 0 0 15px rgba(255, 255, 255, 0.4), inset 0 -10px 15px rgba(0, 0, 0, 0.1)`,
                    zIndex: 3,
                    opacity: 0,
                    animation: `spreadOut-${index} 0.8s ease-out ${index * 0.1}s forwards`
                  }}>
                    {number}
                  </div>
                );
              })
            ) : (
              <div style={{
                position: 'absolute',
                top: '50%',
                right: '10%',
                transform: 'translateY(-50%) scale(0.5)',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '16px',
                fontWeight: 'bold',
                background: parseInt(numbers[0], 10) % 2 === 1 
                  ? `radial-gradient(circle at 25% 25%, #ffffff 0%, #ffb3d9 20%, #ff69b4 50%, #ff3d99 100%)` 
                  : `radial-gradient(circle at 25% 25%, #ffffff 0%, #fff2b3 20%, #f0e68c 50%, #e6c249 100%)`,
                color: '#333',
                boxShadow: `0 10px 25px rgba(0, 0, 0, 0.25), inset 0 0 15px rgba(255, 255, 255, 0.4), inset 0 -10px 15px rgba(0, 0, 0, 0.1)`,
                zIndex: 3,
                opacity: 0,
                animation: 'spreadOut-blue 0.8s ease-out 0s forwards'
              }}>
                {numbers[0]}
              </div>
            )}
          </div>
        </div>
      );
    };

    const filteredSumData = data.sumData.filter(item => {
      if (data.statisticType === 'blue') {
        return true;
      }

      if (data.sumMode === 'northern') {
        return item.sum >= 21 && item.sum <= 102;
      } else {
        return item.sum >= 102 && item.sum <= 183;
      }
    });

    const reversedSumData = [...filteredSumData].reverse();

    const filteredBySelection = data.selectedSums.length === 0 
      ? reversedSumData 
      : reversedSumData.filter(item => data.selectedSums.includes(item.sum));

    const sumTotalItems = filteredBySelection.length;
    const sumStartIndex = (data.sumHexagonCurrentPage - 1) * data.sumHexagonPageSize;
    const sumEndIndex = sumStartIndex + data.sumHexagonPageSize;
    const sumCurrentPageData = filteredBySelection.slice(sumStartIndex, sumEndIndex);

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
        overflow: 'visible',
        position: 'relative',
        marginBottom: '40px',
        backdropFilter: 'blur(5px)',
        cursor: 'pointer'
      }} onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'perspective(1000px) translateZ(10px)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 60px rgba(100, 100, 255, 0.6), inset 0 0 1px rgba(255, 255, 255, 0.5), 0 8px 16px rgba(0, 0, 0, 0.1), 0 24px 48px rgba(0, 0, 0, 0.15), 0 32px 64px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)';
      }} onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'perspective(1000px) translateZ(0)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 60px rgba(100, 100, 255, 0.4), inset 0 0 1px rgba(255, 255, 255, 0.5), 0 4px 8px rgba(0, 0, 0, 0.08), 0 12px 24px rgba(0, 0, 0, 0.12), 0 16px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)';
      }}>
        <div 
          style={{ 
            overflow: 'visible',
            padding: '40px 0',
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
              height={Math.max(Math.ceil(sumCurrentPageData.length / itemsPerRow) * rowHeight + hexSize * 3 + 40, 400)}
              style={{ overflow: 'visible' }}
            >
              {sumCurrentPageData.map((item, index) => {
                const row = Math.floor(index / itemsPerRow);
                const col = index % itemsPerRow;
                const x = col * colWidth + hexSize;
                const y = row * rowHeight + hexSize * 2 + (col % 2) * (rowHeight / 2);

                return renderHexagon(x, y, item.sum, item.period);
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
              current={data.sumHexagonCurrentPage}
              pageSize={data.sumHexagonPageSize}
              total={sumTotalItems}
              onChange={(page) => data.setSumHexagonCurrentPage(page)}
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

  return (
    <AnalysisLayout isTabVisible={isTabVisible} showHemisphereToggle>
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
          {renderSumChart()}
        </div>

        <div style={{ 
          marginBottom: '20px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {renderCombinedSumBarChart()}
        </div>

        <div style={{ 
          marginBottom: '20px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {renderRedSumGrid()}
        </div>

        <div style={{ 
          marginBottom: '40px',
          marginTop: '20px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {renderSumHexagonGrid()}
        </div>
      </div>
    </AnalysisLayout>
  );
};

export default LotteryAnalysisEnergyPage;
