import React from 'react';
import ReactECharts from '../LotteryLocalizedECharts';
import { useAnalysisData } from './AnalysisDataProvider';
import AnalysisLayout from './AnalysisLayout';

const LotteryAnalysisPositionPage: React.FC<{ isTabVisible: boolean }> = ({ isTabVisible }) => {
  const data = useAnalysisData();

  const generateFixedRangeNumbers = (position: number) => {
    if (data.statisticType === 'red') {
      const ranges = [
        { start: 1, end: 28 },
        { start: 2, end: 29 },
        { start: 3, end: 30 },
        { start: 4, end: 31 },
        { start: 5, end: 32 },
        { start: 6, end: 33 }
      ];

      const range = ranges[position - 1];
      const length = range.end - range.start + 1;

      return Array.from({ length }, (_, i) => {
        const num = range.start + i;
        return num < 10 ? `0${num}` : `${num}`;
      });
    } else {
      return Array.from({ length: 16 }, (_, i) => {
        const num = i + 1;
        return num < 10 ? `0${num}` : `${num}`;
      });
    }
  };

  const currentColor = data.statisticType === 'red' ? '#f5222d' : '#1890ff';

  if (data.positionAnalysisData.length === 0) {
    return (
      <AnalysisLayout isTabVisible={isTabVisible}>
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#999',
          backgroundColor: 'transparent',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
        }}>
          暂无位置分析数据
        </div>
      </AnalysisLayout>
    );
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
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          width: '100%',
          boxSizing: 'border-box',
          justifyContent: data.statisticType === 'blue' ? 'center' : 'flex-start'
        }}>
          {data.positionAnalysisData
            .filter(() => {
              return (data.statisticType === 'red' && data.positionAnalysisData.length === 6) ||
                     (data.statisticType === 'blue' && data.positionAnalysisData.length === 1);
            })
            .filter(positionData => {
              if (data.statisticType === 'red') {
                return positionData.position <= 6;
              } else {
                return positionData.position === 1;
              }
            })
            .map((positionData) => {
            const positionNumbers = generateFixedRangeNumbers(positionData.position);
            const barData = positionNumbers.map(number => ({
              name: number,
              value: positionData.numberCounts[number] || 0
            }));

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
                formatter: '{b}\n{c}次'
              },
              legend: {
                show: false
              },
              grid: {
                left: '3%',
                right: '4%',
                bottom: '8%',
                top: '8%',
                containLabel: true
              },
              xAxis: [
              {
                type: 'category',
                data: positionNumbers,
                axisLabel: {
                  fontSize: 10,
                  rotate: 45,
                  interval: data.statisticType === 'red' ? 2 : 0
                },
                axisLine: {
                  lineStyle: {
                    color: '#f0f0f0'
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
                    color: '#f0f0f0'
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
                  data: barData.map(item => item.value),
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
                    show: false
                  }
                }
              ]
            };

            return (
              <div
                key={positionData.position}
                style={{
                  backgroundColor: 'transparent',
                  borderRadius: '16px',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  transform: 'perspective(1000px) translateZ(0)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 60px rgba(100, 100, 255, 0.4), inset 0 0 1px rgba(255, 255, 255, 0.5), 0 4px 8px rgba(0, 0, 0, 0.08), 0 12px 24px rgba(0, 0, 0, 0.12), 0 16px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                  padding: '20px',
                  width: data.statisticType === 'blue' ? 'calc(33.33% - 13.33px)' : 'calc(33.33% - 13.33px)',
                  boxSizing: 'border-box',
                  marginBottom: '20px',
                  display: 'flex',
                  flexDirection: 'column',
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
                    height: '280px',
                    width: '100%',
                    boxSizing: 'border-box',
                    marginBottom: '0px'
                  }}
                >
                  <ReactECharts option={option} style={{ height: '100%', width: '100%', backgroundColor: 'transparent' }} />
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: currentColor,
                  fontSize: '16px',
                  fontWeight: 'bold',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                  textAlign: 'center',
                  padding: '2px 0',
                  marginTop: '2px',
                  width: '100%'
                }}>
                  {(() => {
                    const departmentMap: { [key: string]: { [key: number]: string } } = {
                      red: {
                        1: '痴情司',
                        2: '结怨司',
                        3: '朝啼司',
                        4: '夜哭司',
                        5: '春感司',
                        6: '秋悲司'
                      },
                      blue: {
                        1: '薄命司'
                      }
                    };
                    const currentMap = departmentMap[data.statisticType];
                    return currentMap && currentMap[positionData.position] !== undefined
                      ? currentMap[positionData.position]
                      : positionData.position;
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AnalysisLayout>
  );
};

export default LotteryAnalysisPositionPage;
