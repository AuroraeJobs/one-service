import React, { useEffect } from 'react';
import { AppstoreOutlined, AppstoreAddOutlined, ClearOutlined } from '@ant-design/icons';
import ReactECharts from '../LotteryLocalizedECharts';
import { GLOBAL_CHARACTER_MAPS } from '../../constants/colors';
import { useAnalysisData } from './AnalysisDataProvider';
import AnalysisLayout from './AnalysisLayout';

const LotteryAnalysisAccumulatePage: React.FC<{ isTabVisible: boolean }> = ({ isTabVisible }) => {
  const data = useAnalysisData();

  const handleNumberSelectorDoubleClick = () => {
    data.setShowNumberSelector(false);
  };

  useEffect(() => {
    const handleResize = () => {
      data.setFloatingButtonPosition({
        x: window.innerWidth - 90,
        y: window.innerHeight - 320
      });
      const isRed = data.statisticType === 'red';
      const selectorHeight = isRed ? 392 : 252;
      data.setSelectorPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 20),
        y: Math.min(prev.y, window.innerHeight - selectorHeight - 20)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [data.statisticType]);

  const renderNumberAccumulatedChart = () => {
    if (data.numberAccumulatedCountData.length === 0) {
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
          border: 'none',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          暂无号码累计次数数据
        </div>
      );
    }

    const currentColor = data.statisticType === 'red' ? '#f5222d' : '#1890ff';
    const isRed = data.statisticType === 'red';

    const characterMap = isRed ? GLOBAL_CHARACTER_MAPS.red : GLOBAL_CHARACTER_MAPS.blue;

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
        formatter: function(params: Array<{ axisValue: string; marker: string; seriesName: string; value: number }>) {
          const number = params[0].axisValue;
          const characterName = characterMap[number] || number;
          return `${characterName}: ${params[0].value}次`;
        }
      },
      legend: {
        show: true,
        data: ['累计出现次数'],
        top: '5%',
        left: 'center'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          data: data.numberAccumulatedCountData.map(item => item.number),
          axisLabel: {
            fontSize: 10,
            rotate: 45,
            interval: isRed ? 2 : 0,
            formatter: function(value: string) {
              return characterMap[value] || value;
            }
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
          name: '累计出现次数',
          type: 'bar',
          data: data.numberAccumulatedCountData.map(item => item.count),
          itemStyle: {
            color: currentColor,
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.2)'
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
          marginBottom: '20px',
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

  const renderLineChart = () => {
    if (data.chartData.length === 0 || data.selectedNumbers.length === 0) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#999',
          backgroundColor: 'transparent',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
        }}>
          请选择至少一个号码查看累计次数趋势图
        </div>
      );
    }

    const periods = [...new Set(data.chartData.map(item => item.period))].sort((a, b) => a - b);

    const numbers = [...new Set(data.chartData.map(item => item.number))];

    const characterMap = data.statisticType === 'red' ? GLOBAL_CHARACTER_MAPS.red : GLOBAL_CHARACTER_MAPS.blue;

    const colors = [
      '#f5222d', '#1890ff', '#52c41a', '#faad14', '#722ed1',
      '#eb2f96', '#fa8c16', '#a0d911', '#13c2c2', '#2f54eb',
      '#f5222d', '#1890ff', '#52c41a', '#faad14', '#722ed1',
      '#eb2f96', '#fa8c16', '#a0d911', '#13c2c2', '#2f54eb'
    ];

    const getCharacterName = (number: string) => {
      return characterMap[number] || number;
    };

    const series = numbers.map((number) => {
      const dataPoints = periods.map(period => {
        const item = data.chartData.find(item => item.period === period && item.number === number);
        return item ? item.count : 0;
      });

      return {
        name: getCharacterName(number),
        type: 'line',
        data: dataPoints,
        itemStyle: {
          color: colors[Number(number) % colors.length]
        },
        lineStyle: {
          width: 3,
          type: 'solid'
        },
        symbol: 'circle',
        symbolSize: 8,
        symbolRotate: 0,
        emphasis: {
          focus: 'series',
          scale: true,
          symbolSize: 12,
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        },
        label: {
          show: false
        },
        smooth: false
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
          type: 'shadow'
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
        data: numbers.map(getCharacterName),
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

  const renderNumberSelector = () => {
    const numbers = data.generateNumberList();
    const currentColor = data.statisticType === 'red' ? '#f5222d' : '#1890ff';
    const isRed = data.statisticType === 'red';
    const characterMap = isRed ? GLOBAL_CHARACTER_MAPS.red : GLOBAL_CHARACTER_MAPS.blue;
    const itemHeight = '36px';
    const gap = '8px';
    const containerPadding = '20px';
    const containerWidth = isRed ? '420px' : '360px';
    const containerHeight = isRed ? '400px' : '320px';
    const itemsPerRow = isRed ? 3 : 3;
    const rows: string[][] = [];
    for (let i = 0; i < numbers.length; i += itemsPerRow) {
      rows.push(numbers.slice(i, i + itemsPerRow));
    }

    return (
      <div style={{
        width: containerWidth,
        height: containerHeight,
        padding: containerPadding,
        backgroundColor: '#1A1A1A',
        backgroundImage: 'linear-gradient(145deg, #252525, #101010)',
        borderRadius: 20,
        boxShadow: `0 0 20px ${currentColor}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${currentColor}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
        overflow: 'auto',
        userSelect: 'none',
        touchAction: 'none',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        position: 'relative',
        transition: 'all 0.3s ease',
        transformStyle: 'preserve-3d',
        perspective: '1000px',
        border: 'none'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: 'none',
          width: '100%'
        }}>
          <button
            onClick={() => {
              const allNumbers = data.generateNumberList();
              data.setSelectedNumbers(allNumbers);
            }}
            style={{
              padding: '10px 24px',
              backgroundColor: '#1A1A1A',
              backgroundImage: 'linear-gradient(145deg, #252525, #101010)',
              border: `1px solid rgba(${data.statisticType === 'red' ? '245, 34, 45' : '24, 144, 255'}, 0.7)`,
              borderRadius: '24px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: currentColor,
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: `0 0 15px ${currentColor}40, 0 4px 15px rgba(0, 0, 0, 0.5), inset 0 0 5px ${currentColor}10, inset 0 2px 5px rgba(255, 255, 255, 0.15), inset 0 -2px 5px rgba(0, 0, 0, 0.4)`,
              transformStyle: 'preserve-3d',
              perspective: '1000px',
              transform: 'translateZ(0) scale(1)'
            }}
            title="全选号码"
          >
            <AppstoreAddOutlined style={{ marginRight: '6px', fontSize: '16px' }} /> 全选
          </button>
          <button
            onClick={data.clearAllSelections}
            style={{
              padding: '10px 24px',
              backgroundColor: '#1A1A1A',
              backgroundImage: 'linear-gradient(145deg, #252525, #101010)',
              border: `1px solid rgba(${data.statisticType === 'red' ? '245, 34, 45' : '24, 144, 255'}, 0.7)`,
              borderRadius: '24px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: currentColor,
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: `0 0 15px ${currentColor}40, 0 4px 15px rgba(0, 0, 0, 0.5), inset 0 0 5px ${currentColor}10, inset 0 2px 5px rgba(255, 255, 255, 0.15), inset 0 -2px 5px rgba(0, 0, 0, 0.4)`,
              transformStyle: 'preserve-3d',
              perspective: '1000px',
              transform: 'translateZ(0) scale(1)'
            }}
            title="清除所有选择"
          >
            <ClearOutlined style={{ marginRight: '6px', fontSize: '16px' }} /> 清除
          </button>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: gap,
          justifyContent: 'flex-start',
          alignItems: 'center',
          flex: 1
        }}>
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                display: 'flex',
                gap: gap,
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%'
              }}
            >
              {row.map(number => (
                <div
                  key={number}
                  onClick={() => data.handleNumberSelect(number)}
                  style={{
                    flex: 1,
                    maxWidth: '120px',
                    height: itemHeight,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: '18px',
                    cursor: 'pointer',
                    backgroundColor: data.selectedNumbers.includes(number) ? currentColor : '#1A1A1A',
                    backgroundImage: data.selectedNumbers.includes(number) ? 'linear-gradient(145deg, #252525, #101010)' : 'linear-gradient(145deg, #252525, #101010)',
                    color: data.selectedNumbers.includes(number) ? '#fff' : currentColor,
                    border: data.selectedNumbers.includes(number)
                      ? `2px solid ${currentColor}`
                      : `1px solid rgba(${data.statisticType === 'red' ? '245, 34, 45' : '24, 144, 255'}, 0.7)`,
                    fontWeight: data.selectedNumbers.includes(number) ? 'bold' : 'normal',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    flexShrink: 0,
                    fontSize: '14px',
                    textAlign: 'center',
                    padding: '0 12px',
                    boxShadow: data.selectedNumbers.includes(number)
                      ? `0 0 15px ${currentColor}60, 0 4px 15px rgba(0, 0, 0, 0.5), inset 0 0 5px ${currentColor}20, inset 0 2px 5px rgba(255, 255, 255, 0.15), inset 0 -2px 5px rgba(0, 0, 0, 0.4)`
                      : `0 0 10px ${currentColor}30, 0 2px 10px rgba(0, 0, 0, 0.4), inset 0 0 3px ${currentColor}10, inset 0 2px 3px rgba(255, 255, 255, 0.1), inset 0 -2px 3px rgba(0, 0, 0, 0.3)`,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                    transform: 'translateZ(0) scale(1)'
                  }}
                  title={characterMap[number] || number}
                >
                  {characterMap[number] || number}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const currentColor = data.statisticType === 'red' ? '#f5222d' : '#1890ff';
  const isRed = data.statisticType === 'red';

  return (
    <AnalysisLayout isTabVisible={isTabVisible}>
      <div style={{
        padding: '16px',
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{
          marginBottom: '20px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {renderNumberAccumulatedChart()}
        </div>
        <div style={{
          marginBottom: '20px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {renderLineChart()}
        </div>
        {!data.showNumberSelector ? (
          <div
            style={{
              position: 'fixed',
              left: `${data.floatingButtonPosition.x}px`,
              top: `${data.floatingButtonPosition.y}px`,
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: data.isButtonDragging ? 'grabbing' : 'grab',
              zIndex: 1000,
              transition: 'all 0.3s ease',
              userSelect: 'none',
              touchAction: 'none'
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              data.setIsButtonDragging(true);
              data.setButtonDragOffset({
                x: e.clientX - data.floatingButtonPosition.x,
                y: e.clientY - data.floatingButtonPosition.y
              });
            }}
            onClick={() => {
              const isButtonOnRight = data.floatingButtonPosition.x > window.innerWidth / 2;
              const selectorWidth = isRed ? 420 : 360;
              const selectorHeight = isRed ? 400 : 320;
              const newX = isButtonOnRight
                ? data.floatingButtonPosition.x - selectorWidth - 20
                : data.floatingButtonPosition.x + 50 + 20;
              const footerHeight = 64;
              let newY = data.floatingButtonPosition.y - selectorHeight / 2 - 40;
              if (newY + selectorHeight > window.innerHeight) {
                newY = window.innerHeight - selectorHeight - footerHeight - 10;
              }
              if (newY < 40) {
                newY = 40;
              }
              data.setSelectorPosition({
                x: Math.max(0, newX),
                y: newY
              });
              data.setShowNumberSelector(true);
            }}
            title="显示号码选择器"
          >
            <AppstoreOutlined
              style={{
                fontSize: '24px',
                color: currentColor,
                transition: 'all 0.3s ease'
              }}
            />
          </div>
        ) : (
          <div
            style={{
              position: 'fixed',
              left: `${data.selectorPosition.x}px`,
              top: `${data.selectorPosition.y}px`,
              zIndex: 1000,
              cursor: data.isSelectorDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none'
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              data.setIsSelectorDragging(true);
              data.setSelectorDragOffset({
                x: e.clientX - data.selectorPosition.x,
                y: e.clientY - data.selectorPosition.y
              });
            }}
            onDoubleClick={handleNumberSelectorDoubleClick}
            title="双击隐藏号码选择器"
          >
            {renderNumberSelector()}
          </div>
        )}
      </div>
    </AnalysisLayout>
  );
};

export default LotteryAnalysisAccumulatePage;
