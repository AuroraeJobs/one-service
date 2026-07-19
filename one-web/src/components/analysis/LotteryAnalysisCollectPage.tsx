import React from 'react';
import { useAnalysisData } from './AnalysisDataProvider';
import AnalysisLayout from './AnalysisLayout';
import ReactECharts from '../LotteryLocalizedECharts';

const LotteryAnalysisCollectPage: React.FC<{ isTabVisible: boolean }> = ({ isTabVisible }) => {
  const data = useAnalysisData();
  const { allRecords, currentPeriod, setCurrentPeriod, statisticType, collectRulerRef } = data;

  const renderRuler = () => {
    return (
      <div 
        ref={collectRulerRef}
        style={{ 
          width: '60%', 
          height: '35px', 
          backgroundColor: '#000', 
          borderRadius: '4px', 
          padding: '4px 12px',
          boxSizing: 'border-box',
          position: 'fixed',
          bottom: '64px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 999,
          overflow: 'hidden',
          maxWidth: '600px',
          overscrollBehavior: 'contain',
          overscrollBehaviorX: 'none',
          touchAction: 'none'
        }}
      >
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ 
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '100%',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              padding: '0 6px'
            }}>
              {Array.from({ length: 5 }).map((_, index) => {
                const position = index * 25;
                const height = 18 - Math.abs(2 - index) * 3;
                const opacity = 1 - Math.abs(2 - index) * 0.25;
                return (
                  <div 
                    key={index} 
                    style={{
                      height: `${height}px`,
                      width: '2px',
                      backgroundColor: '#1890ff',
                      opacity: opacity,
                      position: 'relative'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      bottom: '-16px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '9px',
                      color: `rgba(255, 255, 255, ${opacity})`
                    }}>
                      {position}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '100%',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              padding: '0 6px'
            }}>
              {Array.from({ length: 41 }).map((_, index) => {
                const positionPercent = (index / 40) * 100;
                const distanceFromCenter = Math.abs(50 - positionPercent);
                const height = index % 10 === 0 ? 0 : (8 - distanceFromCenter * 0.12);
                const opacity = index % 10 === 0 ? 0 : (0.4 - distanceFromCenter * 0.01);
                return (
                  <div 
                    key={index} 
                    style={{
                      height: `${height}px`,
                      width: '1px',
                      backgroundColor: `rgba(217, 217, 217, ${opacity})`
                    }}
                  />
                );
              })}
            </div>

            <div style={{ 
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: '2px',
              backgroundColor: '#ff4d4f',
              transform: 'translateX(-50%)',
              boxShadow: '0 0 3px rgba(255, 77, 79, 0.8)'
            }}>
              <div style={{
                position: 'absolute',
                top: '-6px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderBottom: '6px solid #ff4d4f'
              }} />
            </div>
          </div>

          <div style={{ 
            textAlign: 'center', 
            fontSize: '9px', 
            color: 'rgba(255, 255, 255, 0.6)',
            marginTop: '1px'
          }}>
            {currentPeriod + 1}
          </div>
        </div>
        <button
          type="button"
          aria-label="上一期"
          title="上一期"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setCurrentPeriod(previousPeriod => Math.max(0, previousPeriod - 1));
          }}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: '50%',
            border: 0,
            padding: 0,
            backgroundColor: 'transparent',
            cursor: currentPeriod > 0 ? 'pointer' : 'default',
            zIndex: 2
          }}
        />
        <button
          type="button"
          aria-label="下一期"
          title="下一期"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setCurrentPeriod(previousPeriod => Math.min(allRecords.length - 1, previousPeriod + 1));
          }}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: '50%',
            border: 0,
            padding: 0,
            backgroundColor: 'transparent',
            cursor: currentPeriod < allRecords.length - 1 ? 'pointer' : 'default',
            zIndex: 2
          }}
        />
      </div>
    );
  };

  const renderCollectStats = () => {
    const calculateCollectRange = () => {
      if (!allRecords.length || currentPeriod >= allRecords.length) return { start: -1, end: -1, numbers: {}, count: 0, recentNumbers: [] };

      const isRed = statisticType === 'red';
      const totalNumbers = isRed ? 33 : 16;
      const numberSet = new Set<string>();
      const numberCounts: { [key: string]: number } = {};
      const periodNumbers: Array<{ period: number; numbers: string[] }> = [];

      for (let i = 1; i <= totalNumbers; i++) {
        const num = i < 10 ? `0${i}` : `${i}`;
        numberCounts[num] = 0;
      }

      let startPeriod = currentPeriod;
      const endPeriod = currentPeriod;

      while (startPeriod >= 0 && numberSet.size < totalNumbers) {
        const record = allRecords[startPeriod];
        if (record) {
          const numbers: string[] = [];

          if (isRed) {
            for (let i = 0; i < 12; i += 2) {
              numbers.push(record.substring(i, i + 2));
            }
          } else {
            numbers.push(record.substring(12, 14));
          }
          periodNumbers.push({ period: startPeriod, numbers });

          numbers.forEach(number => {
            numberSet.add(number);
            numberCounts[number] = (numberCounts[number] || 0) + 1;
          });
        }

        if (numberSet.size < totalNumbers) {
          startPeriod--;
        }
      }

      const actualStartPeriod = Math.max(0, startPeriod);

      return {
        start: actualStartPeriod,
        end: endPeriod,
        numbers: numberCounts,
        count: endPeriod - actualStartPeriod + 1,
        recentNumbers: Array.from(new Set(periodNumbers.flatMap(item => item.numbers)))
      };
    };

    const collectRange = calculateCollectRange();

    const prepareBarData = () => {
      const isRed = statisticType === 'red';
      const totalNumbers = isRed ? 33 : 16;
      const data = [];

      for (let i = 1; i <= totalNumbers; i++) {
        const num = i < 10 ? `0${i}` : `${i}`;
        data.push({
          name: num,
          value: collectRange.numbers[num] || 0
        });
      }

      data.sort((a, b) => b.value - a.value);

      return data;
    };

    const barData = prepareBarData();

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
          data: barData.map(item => item.name),
          axisLabel: {
            fontSize: 10,
            rotate: 45,
            interval: 0
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
          name: '出现次数',
          type: 'bar',
          data: barData.map(item => item.value),
          itemStyle: {
            color: statisticType === 'red' ? '#f5222d' : '#1890ff',
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
      <div style={{ padding: '16px', position: 'relative', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
            }}>
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

          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            gap: '10px',
            margin: '0 0 10px 0'
          }}>
            {collectRange.recentNumbers.map((num, index) => (
              <div key={index} style={{ 
                width: '50px', 
                height: '50px', 
                borderRadius: '50%', 
                backgroundColor: statisticType === 'red' ? '#f5222d' : '#1890ff',
                color: '#fff',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '20px',
                fontWeight: 'bold'
              }}>
                {parseInt(num)}
              </div>
            ))}
          </div>

          {collectRange.start !== -1 && (
            <div style={{ 
              padding: '15px', 
              backgroundColor: 'rgba(0, 0, 0, 0.1)', 
              borderRadius: '8px', 
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '5px 0' }}>
                从 {collectRange.start + 1} 期到 {collectRange.end + 1} 期，共 {collectRange.count} 期
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <AnalysisLayout isTabVisible={isTabVisible}>
        {renderCollectStats()}
      </AnalysisLayout>
      {renderRuler()}
    </>
  );
};

export default LotteryAnalysisCollectPage;
