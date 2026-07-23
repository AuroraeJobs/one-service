import { useMemo, useState } from 'react';
import { Pagination } from 'antd';
import { useAnalysisData } from './AnalysisDataProvider';
import AnalysisLayout from './AnalysisLayout';
import { GLOBAL_COMBINATION_COLORS, GLOBAL_CHARACTER_MAPS } from '../../constants/colors';
import { HEXAGRAMS, YIN_YANG_LABELS } from '../../constants/hexagrams';

const planetColors: Record<string, string> = {
  地球: '#1890ff', 水星: '#52c41a', 金星: '#faad14',
  火星: '#f5222d', 木星: '#13c2c2', 土星: '#fa8c16', 天王星: '#722ed1',
  太阳: '#f5222d', 月亮: '#722ed1',
};

const globalCombinationColors = GLOBAL_COMBINATION_COLORS;

interface Props { isTabVisible: boolean }
const LotteryAnalysisIllusionPage = ({ isTabVisible }: Props) => {
  const data = useAnalysisData();
  const { statisticType, allRecords, sliderRange, currentPage, pageSize, setCurrentPage, setPageSize } = data;

  const [filterPlanet, setFilterPlanet] = useState('');

  const combinationToNameMap = useMemo(() => statisticType === 'blue'
    ? { '1奇0偶': '太阳', '0奇1偶': '月亮' }
    : { '0奇6偶': '地球', '1奇5偶': '水星', '2奇4偶': '金星', '3奇3偶': '火星', '4奇2偶': '木星', '5奇1偶': '土星', '6奇0偶': '天王星' },
  [statisticType]);

  const availablePlanets = useMemo(() => {
    const planets = new Set<string>();
    allRecords.forEach(record => {
      if (typeof record !== 'string') return;
      const redNumbers = [];
      for (let i = 0; i < 12; i += 2) redNumbers.push(record.substring(i, i + 2));
      let oddCount = 0, evenCount = 0;
      const numbers = statisticType === 'red' ? redNumbers : [record.substring(12, 14)];
      numbers.forEach(n => { if (parseInt(n, 10) % 2 === 0) evenCount++; else oddCount++; });
      const combo = `${oddCount}奇${evenCount}偶`;
      const planet = combinationToNameMap[combo];
      if (planet) planets.add(planet);
    });
    return [...planets];
  }, [allRecords, statisticType, combinationToNameMap]);

  const effectiveFilter = filterPlanet && availablePlanets.includes(filterPlanet) ? filterPlanet : '';

  const blueBallCharacterMap = GLOBAL_CHARACTER_MAPS.blue;
  const redBallCharacterMap = GLOBAL_CHARACTER_MAPS.red;

  const getRecordCombination = (record: { redNumbers: string[]; blueNumber: string }) => {
    let numbers: string[];
    if (statisticType === 'red') {
      numbers = record.redNumbers;
    } else {
      numbers = [record.blueNumber];
    }

    let oddCount = 0;
    let evenCount = 0;

    numbers.forEach(number => {
      const num = parseInt(number, 10);
      if (num % 2 === 0) {
        evenCount++;
      } else {
        oddCount++;
      }
    });

    const originalCombination = `${oddCount}奇${evenCount}偶`;
    const combinationToNameMap: { [key: string]: string } = {};

    if (statisticType === 'red') {
      combinationToNameMap['0奇6偶'] = '地球';
      combinationToNameMap['1奇5偶'] = '水星';
      combinationToNameMap['2奇4偶'] = '金星';
      combinationToNameMap['3奇3偶'] = '火星';
      combinationToNameMap['4奇2偶'] = '木星';
      combinationToNameMap['5奇1偶'] = '土星';
      combinationToNameMap['6奇0偶'] = '天王星';
    } else {
      combinationToNameMap['1奇0偶'] = '太阳';
      combinationToNameMap['0奇1偶'] = '月亮';
    }

    return combinationToNameMap[originalCombination] || originalCombination;
  };

  const calculateHexagram = (redNumbers: string[]) => {
    const trigrams = redNumbers.map(num => {
      const n = parseInt(num, 10);
      return n % 2 === 1 ? '1' : '0';
    });
    const hexagramCode = trigrams.join('');
    return HEXAGRAMS[hexagramCode as keyof typeof HEXAGRAMS]?.name || '坤';
  };

  const calculateBlueBallYinYang = (blueNumber: string) => {
    const n = parseInt(blueNumber, 10);
    return n % 2 === 1 ? YIN_YANG_LABELS.YANG : YIN_YANG_LABELS.YIN;
  };

  const processRecords = (records: string[] = allRecords) => {
    return records.map((record) => {
      if (typeof record !== 'string') return null;

      const redNumbers = [];
      for (let i = 0; i < 12; i += 2) {
        redNumbers.push(record.substring(i, i + 2));
      }
      const blueNumber = record.substring(12, 14);

      const calculateSum = (numbers: string[]) => {
        return numbers.reduce((sum, num) => sum + parseInt(num), 0);
      };

      let totalSum: number;
      if (statisticType === 'red') {
        totalSum = calculateSum(redNumbers);
      } else {
        totalSum = parseInt(blueNumber);
      }

      const hexagram = calculateHexagram(redNumbers);
      const blueYinYang = calculateBlueBallYinYang(blueNumber);

      return {
        period: allRecords.indexOf(record) + 1,
        redNumbers,
        blueNumber,
        totalSum,
        hexagram,
        blueYinYang
      };
    }).filter(Boolean) as Array<{ period: number; redNumbers: string[]; blueNumber: string; totalSum: number; hexagram: string; blueYinYang: string }>;
  };

  const [startRange, endRange] = sliderRange;
  const selectedRecords = allRecords.slice(startRange, endRange + 1);

  const allProcessedRecords = processRecords(selectedRecords).reverse();

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const filteredProcessedRecords = useMemo(() => {
    if (!effectiveFilter) return allProcessedRecords;
    return allProcessedRecords.filter(r => {
      const combo = `${r.redNumbers.reduce((odd, n) => parseInt(n, 10) % 2 === 1 ? odd + 1 : odd, 0)}奇${r.redNumbers.reduce((even, n) => parseInt(n, 10) % 2 === 0 ? even + 1 : even, 0)}偶`;
      const planet = combinationToNameMap[combo];
      return planet === effectiveFilter;
    });
  }, [allProcessedRecords, effectiveFilter, combinationToNameMap]);

  const records = filteredProcessedRecords.slice(startIndex, endIndex);

  return (
    <AnalysisLayout isTabVisible={isTabVisible}>
      <div style={{
        padding: '16px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        {availablePlanets.length > 0 && (
          <div style={{
            marginBottom: 24, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
            maxWidth: 1400, marginLeft: 'auto', marginRight: 'auto', padding: '0 16px'
          }}>
            {availablePlanets.map(name => {
              const color = planetColors[name] || '#1677ff';
              const isActive = effectiveFilter === name;
              return (
                <button
                  key={name}
                  onClick={() => setFilterPlanet(isActive ? '' : name)}
                  style={{
                    padding: '8px 16px', borderRadius: 20,
                    border: `1px solid ${color}`,
                    background: isActive ? color : 'transparent',
                    color: isActive ? '#fff' : color,
                    cursor: 'pointer', fontSize: 14, transition: 'all 0.3s ease',
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '40px',
          justifyContent: 'center',
          justifyItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {records.map((record) => {
            const combination = getRecordCombination(record);

            const centerColor = statisticType === 'red'
              ? (globalCombinationColors.red)[combination as keyof typeof globalCombinationColors.red] || '#f5222d'
              : (globalCombinationColors.blue)[combination as keyof typeof globalCombinationColors.blue] || '#f5222d';

            return (
            <div key={record.period} style={{
              width: '250px',
              height: '250px',
              borderRadius: '50%',
              boxShadow: `0 0 25px ${centerColor}80, 0 15px 40px rgba(0, 0, 0, 0.6), 0 5px 15px ${centerColor}40, inset 0 0 15px ${centerColor}40, inset 0 8px 16px rgba(255, 255, 255, 0.2), inset 0 -8px 16px rgba(0, 0, 0, 0.5)`,
              boxSizing: 'border-box',
              position: 'relative',
              opacity: 0.95,
              overflow: 'hidden',
              backgroundColor: '#1A1A1A',
              backgroundImage: 'linear-gradient(135deg, #282828, #121212, #1A1A1A)',
              transition: 'all 0.4s ease, box-shadow 0.4s ease, background-position 0.4s ease',
              cursor: 'pointer',
              transformStyle: 'preserve-3d',
              perspective: '1000px',
              transform: 'translateZ(0)'
            }} onMouseEnter={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'translateZ(8px) scale(1.02)';
              target.style.boxShadow = `0 0 35px ${centerColor}90, 0 20px 50px rgba(0, 0, 0, 0.7), 0 8px 20px ${centerColor}60, inset 0 0 20px ${centerColor}60, inset 0 10px 20px rgba(255, 255, 255, 0.3), inset 0 -10px 20px rgba(0, 0, 0, 0.6)`;
              target.style.opacity = '1';
            }} onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'translateZ(0) scale(1)';
              target.style.boxShadow = `0 0 25px ${centerColor}80, 0 15px 40px rgba(0, 0, 0, 0.6), 0 5px 15px ${centerColor}40, inset 0 0 15px ${centerColor}40, inset 0 8px 16px rgba(255, 255, 255, 0.2), inset 0 -8px 16px rgba(0, 0, 0, 0.5)`;
              target.style.opacity = '0.95';
            }}>

              {/* 红球模式：圆心显示星球名和卦名 */}
              {statisticType === 'red' ? (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 2
                }}>
                  <div style={{
                    color: centerColor,
                    fontSize: '20px',
                    fontWeight: 'bold',
                    marginBottom: '4px'
                  }}>
                    {combination}
                  </div>
                  <div style={{
                    color: centerColor,
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    flexDirection: 'row'
                  }}>
                    <span>{record.hexagram}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{
                    position: 'absolute',
                    top: '15%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: centerColor,
                    fontSize: '20px',
                    fontWeight: 'bold',
                    zIndex: 2
                  }}>
                    {combination}
                  </div>
                </>
              )}

              <div style={{
                position: 'absolute',
                bottom: '5%',
                left: '50%',
                transform: 'translateX(-50%)',
                color: centerColor,
                fontSize: '12px',
                fontWeight: 'bold',
                zIndex: 4
              }}>
                {record.period}
              </div>

              {statisticType === 'red' ? (
                record.redNumbers.map((number: string, index: number) => {
                  const num = parseInt(number, 10);
                  const isOdd = num % 2 === 1;
                  const ballColor = isOdd ? '#FF3333' : '#FF8888';

                  const angle = (index / 6) * 2 * Math.PI;
                  const radius = 75;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;

                  return (
                    <div key={number} style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                      borderRadius: '50%',
                      width: '50px',
                      height: '50px',
                      padding: '0',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      backgroundColor: '#1A1A1A',
                      backgroundImage: 'linear-gradient(135deg, #282828, #121212, #1A1A1A)',
                      color: ballColor,
                      boxShadow: `0 0 12px ${ballColor}80, inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                      border: `1px solid ${ballColor}50`,
                      zIndex: 3,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }} onMouseEnter={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(1.2) rotate(-5deg)`;
                      target.style.boxShadow = `0 0 16px ${ballColor}90, inset 0 3px 6px rgba(255, 255, 255, 0.3), inset 0 -3px 6px rgba(0, 0, 0, 0.4)`;
                    }} onMouseLeave={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(1) rotate(0deg)`;
                      target.style.boxShadow = `0 0 12px ${ballColor}80, inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                    }}>
                      {redBallCharacterMap[number] || number}
                    </div>
                  );
                })
              ) : (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  width: '80px',
                  height: '80px',
                  padding: '0',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  backgroundColor: '#1A1A1A',
                  backgroundImage: 'linear-gradient(135deg, #282828, #121212, #1A1A1A)',
                  color: parseInt(record.blueNumber, 10) % 2 === 1 ? 'rgba(255, 0, 0, 0.8)' : 'rgba(156, 39, 176, 0.8)',
                  boxShadow: `0 0 16px ${parseInt(record.blueNumber, 10) % 2 === 1 ? 'rgba(255, 0, 0, 0.6)' : 'rgba(156, 39, 176, 0.6)'}, inset 0 3px 6px rgba(255, 255, 255, 0.3), inset 0 -3px 6px rgba(0, 0, 0, 0.4)`,
                  border: `1px solid ${parseInt(record.blueNumber, 10) % 2 === 1 ? 'rgba(255, 0, 0, 0.3)' : 'rgba(156, 39, 176, 0.3)'}`,
                  zIndex: 3,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }} onMouseEnter={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.transform = 'translate(-50%, -50%) scale(1.2) rotate(-5deg)';
                  target.style.boxShadow = `0 0 20px ${parseInt(record.blueNumber, 10) % 2 === 1 ? 'rgba(255, 0, 0, 0.7)' : 'rgba(156, 39, 176, 0.7)'}, inset 0 4px 8px rgba(255, 255, 255, 0.4), inset 0 -4px 8px rgba(0, 0, 0, 0.5)`;
                }} onMouseLeave={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';
                  target.style.boxShadow = `0 0 16px ${parseInt(record.blueNumber, 10) % 2 === 1 ? 'rgba(255, 0, 0, 0.6)' : 'rgba(156, 39, 176, 0.6)'}, inset 0 3px 6px rgba(255, 255, 255, 0.3), inset 0 -3px 6px rgba(0, 0, 0, 0.4)`;
                }}>
                  {blueBallCharacterMap[record.blueNumber] || record.blueNumber}
                </div>
              )}

            </div>
            );
          })}
        </div>

        <div style={{ 
          marginTop: '60px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={allProcessedRecords.length}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
            showSizeChanger
            pageSizeOptions={['8', '12', '24', '36']}
            showTotal={(total) => `共 ${total} 期`}
            style={{
              marginTop: '16px'
            }}
          />
        </div>
      </div>
    </AnalysisLayout>
  );
};

export default LotteryAnalysisIllusionPage;
