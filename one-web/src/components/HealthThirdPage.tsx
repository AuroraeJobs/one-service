import React, { useState, useMemo } from 'react';
import { Card, Progress } from 'antd';
import { FastForwardOutlined, StepForwardOutlined, StepBackwardOutlined, FastBackwardOutlined } from '@ant-design/icons';
import { useRecordContext } from '../contexts/RecordContext';
import { RED_BALL_COMBINATION_COLORS, BLUE_BALL_COMBINATION_COLORS } from '../constants/colors';

const PAGE_SIZE = 49;

const HealthThirdPage: React.FC = () => {
  const { allRecords, loading } = useRecordContext();
  const [currentPage, setCurrentPage] = useState(1);
  
  // 计算总期数
  const calculateTotalPeriods = () => {
    if (!allRecords) return 0;
    if (typeof allRecords === 'string') {
      return allRecords
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .length;
    } else if (Array.isArray(allRecords)) {
      return allRecords.length;
    }
    return 0;
  };
  
  const totalPeriods = calculateTotalPeriods();

  // 计算蓝球奇偶次数
  const blueBallOddEven = useMemo(() => {
    if (!allRecords) return { odd: 0, even: 0 };
    
    let recordsArray: string[] = [];
    
    if (typeof allRecords === 'string') {
      recordsArray = allRecords
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length === 14);
    } else if (Array.isArray(allRecords)) {
      recordsArray = allRecords.filter(record => typeof record === 'string' && record.length === 14);
    }
    
    let oddCount = 0;
    let evenCount = 0;
    
    recordsArray.forEach(record => {
      const blueBall = parseInt(record.slice(12, 14));
      if (blueBall % 2 !== 0) {
        oddCount++;
      } else {
        evenCount++;
      }
    });
    
    return { odd: oddCount, even: evenCount };
  }, [allRecords]);

  // 计算红球奇偶组合（星球名映射）
  const redBallCombinations = useMemo(() => {
    if (!allRecords) return {};
    
    let recordsArray: string[] = [];
    
    if (typeof allRecords === 'string') {
      recordsArray = allRecords
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length === 14);
    } else if (Array.isArray(allRecords)) {
      recordsArray = allRecords.filter(record => typeof record === 'string' && record.length === 14);
    }
    
    // 初始化星球名对应的组合计数
    const combinations: { [key: string]: number } = {
      '天王星': 0, // 6奇0偶
      '土星': 0,   // 5奇1偶
      '木星': 0,   // 4奇2偶
      '火星': 0,   // 3奇3偶
      '金星': 0,   // 2奇4偶
      '水星': 0,   // 1奇5偶
      '地球': 0    // 0奇6偶
    };
    
    recordsArray.forEach(record => {
      const redBalls = record.slice(0, 12);
      let oddCount = 0;
      
      for (let i = 0; i < 12; i += 2) {
        const ball = parseInt(redBalls.slice(i, i + 2));
        if (ball % 2 !== 0) {
          oddCount++;
        }
      }
      
      // 根据奇数个数映射到对应的星球名
      switch (oddCount) {
        case 6:
          combinations['天王星']++;
          break;
        case 5:
          combinations['土星']++;
          break;
        case 4:
          combinations['木星']++;
          break;
        case 3:
          combinations['火星']++;
          break;
        case 2:
          combinations['金星']++;
          break;
        case 1:
          combinations['水星']++;
          break;
        case 0:
          combinations['地球']++;
          break;
      }
    });
    
    return combinations;
  }, [allRecords]);

  // 红球奇偶组合列表（带颜色）
  const oddEvenCombinations = Object.entries(redBallCombinations)
    .map(([name, count]) => ({
      name,
      count,
      total: totalPeriods,
      color: RED_BALL_COMBINATION_COLORS[name as keyof typeof RED_BALL_COMBINATION_COLORS] || '#4CAF50'
    }))
    .sort((a, b) => b.count - a.count);
    
  // 所有卡片列表（包括太阳、月亮和红球组合），按出现次数排序
  const allCards = useMemo(() => {
    const cards = [
      {
        name: '太阳',
        count: blueBallOddEven.odd,
        total: totalPeriods,
        color: '#FF0000' // 红色
      },
      {
        name: '月亮',
        count: blueBallOddEven.even,
        total: totalPeriods,
        color: '#9C27B0' // 紫色
      },
      ...oddEvenCombinations
    ];
    return cards.sort((a, b) => b.count - a.count);
  }, [blueBallOddEven, oddEvenCombinations, totalPeriods]);
  
  // 获取总页数
  const getTotalPages = () => {
    if (!allRecords) return 1;
    
    let recordsArray: string[] = [];
    
    if (typeof allRecords === 'string') {
      recordsArray = allRecords
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length === 14);
    } else if (Array.isArray(allRecords)) {
      recordsArray = allRecords.filter(record => typeof record === 'string' && record.length === 14);
    }
    
    return Math.max(1, Math.ceil(recordsArray.length / PAGE_SIZE));
  };

  // 获取指定页的航行记录
  const getPagePeriods = () => {
    if (!allRecords) return [];
    
    let recordsArray: string[] = [];
    
    if (typeof allRecords === 'string') {
      recordsArray = allRecords
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length === 14);
    } else if (Array.isArray(allRecords)) {
      recordsArray = allRecords.filter(record => typeof record === 'string' && record.length === 14);
    }
    
    // 计算每期的奇偶组合和星球名
    const allPeriodsWithInfo = recordsArray.map((record, recordIndex) => {
      const redBalls = record.slice(0, 12);
      const blueBall = record.slice(12, 14);
      let redOddCount = 0;
      
      // 计算红球奇数个数
      for (let i = 0; i < 12; i += 2) {
        const ball = parseInt(redBalls.slice(i, i + 2));
        if (ball % 2 !== 0) {
          redOddCount++;
        }
      }
      
      // 红球星球名
      let redPlanetName = '';
      switch (redOddCount) {
        case 6:
          redPlanetName = '天王星';
          break;
        case 5:
          redPlanetName = '土星';
          break;
        case 4:
          redPlanetName = '木星';
          break;
        case 3:
          redPlanetName = '火星';
          break;
        case 2:
          redPlanetName = '金星';
          break;
        case 1:
          redPlanetName = '水星';
          break;
        case 0:
          redPlanetName = '地球';
          break;
      }
      
      // 蓝球奇偶和星球名
      const blueBallNum = parseInt(blueBall);
      const blueIsOdd = blueBallNum % 2 !== 0;
      const bluePlanetName = blueIsOdd ? '太阳' : '月亮';
      
      return {
        period: recordIndex + 1,
        redPlanetName,
        bluePlanetName,
        redColor: RED_BALL_COMBINATION_COLORS[redPlanetName as keyof typeof RED_BALL_COMBINATION_COLORS] || '#4CAF50',
        blueColor: blueIsOdd ? '#FF0000' : '#9C27B0'
      };
    });
    

    const pageSize = PAGE_SIZE;
    const startIndex = allPeriodsWithInfo.length - (currentPage * pageSize);
    const endIndex = allPeriodsWithInfo.length - ((currentPage - 1) * pageSize);
    
    let pagePeriods = [];
    if (startIndex < 0) {
      pagePeriods = allPeriodsWithInfo.slice(0, endIndex).reverse();
    } else {
      pagePeriods = allPeriodsWithInfo.slice(startIndex, endIndex).reverse();
    }
    
    // 如果不足一页，用空数据填充
    const emptyPeriods = PAGE_SIZE - pagePeriods.length;
    for (let i = 0; i < emptyPeriods; i++) {
      pagePeriods.push({ 
        period: 0, 
        redPlanetName: '', 
        bluePlanetName: '', 
        redColor: '#4CAF50', 
        blueColor: '#4CAF50' 
      });
    }
    
    return pagePeriods;
  };

  // 获取当前页数据
  const pagePeriods = getPagePeriods();

  // 计算当前页星球出现次数
  const calculatePlanetCounts = () => {
    if (!allRecords) return [];
    
    let recordsArray: string[] = [];
    
    if (typeof allRecords === 'string') {
      recordsArray = allRecords
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length === 14);
    } else if (Array.isArray(allRecords)) {
      recordsArray = allRecords.filter(record => typeof record === 'string' && record.length === 14);
    }
    
    const pageSize = PAGE_SIZE;
    const startIndex = recordsArray.length - (currentPage * pageSize);
    const endIndex = recordsArray.length - ((currentPage - 1) * pageSize);
    
    let pageRecords = [];
    if (startIndex < 0) {
      pageRecords = recordsArray.slice(0, endIndex);
    } else {
      pageRecords = recordsArray.slice(startIndex, endIndex);
    }
    
    const planetCounts: { [key: string]: number } = {};
    
    pageRecords.forEach(record => {
      const redBalls = record.slice(0, 12);
      let redOddCount = 0;
      
      for (let i = 0; i < 12; i += 2) {
        const ball = parseInt(redBalls.slice(i, i + 2));
        if (ball % 2 !== 0) {
          redOddCount++;
        }
      }
      
      let redPlanetName = '';
      switch (redOddCount) {
        case 6:
          redPlanetName = '天王星';
          break;
        case 5:
          redPlanetName = '土星';
          break;
        case 4:
          redPlanetName = '木星';
          break;
        case 3:
          redPlanetName = '火星';
          break;
        case 2:
          redPlanetName = '金星';
          break;
        case 1:
          redPlanetName = '水星';
          break;
        case 0:
          redPlanetName = '地球';
          break;
      }
      
      const blueBallNum = parseInt(record.slice(12, 14));
      const bluePlanetName = blueBallNum % 2 !== 0 ? '太阳' : '月亮';
      
      planetCounts[redPlanetName] = (planetCounts[redPlanetName] || 0) + 1;
      planetCounts[bluePlanetName] = (planetCounts[bluePlanetName] || 0) + 1;
    });
    
    // 转换为数组并按出现次数从大到小排序
    return Object.entries(planetCounts)
      .map(([name, count]) => ({
        name,
        count
      }))
      .sort((a, b) => b.count - a.count);
  };

  // 获取当前页星球出现次数
  const planetCounts = calculatePlanetCounts();
  const navigationColor = '#4CAF50';
  const navigationBorderColor = '#4CAF5050';
  const navigationShadowColor = '#4CAF5080';

  // 生成训练天数数据（每期同时显示红球星球和蓝球星球）
  const trainingDays = pagePeriods.map((periodInfo, index) => {
    const hasPlanets = Boolean(periodInfo.redPlanetName || periodInfo.bluePlanetName);
    
    return (
      <div 
            key={index}
            className="day-cell"
            style={{
              width: '118px',
              height: '64px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: '32px',
              margin: '2px',
              padding: '12px 10px 8px',
              fontSize: '11px',
              fontWeight: 'bold',
              backgroundColor: 'transparent',
              color: hasPlanets ? '#FFFFFF' : '#888888',
              border: hasPlanets ? `1px solid ${periodInfo.redColor}50` : '1px solid #333333',
              boxShadow: hasPlanets ? `0 0 8px ${periodInfo.redColor}70, 0 0 8px ${periodInfo.blueColor}60, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)` : '0 0 4px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)',
              transformStyle: 'preserve-3d',
              perspective: '1000px',
              transform: 'translateZ(0)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer',
              boxSizing: 'border-box'
            }}
        onMouseEnter={(e) => {
          const cell = e.currentTarget;
          if (hasPlanets) {
            cell.style.transform = 'translateZ(6px) scale(1.05)';
            cell.style.boxShadow = `0 0 12px ${periodInfo.redColor}70, 0 0 12px ${periodInfo.blueColor}60, 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
          }
        }}
        onMouseLeave={(e) => {
          const cell = e.currentTarget;
          if (hasPlanets) {
            cell.style.transform = 'translateZ(0) scale(1)';
            cell.style.boxShadow = `0 0 8px ${periodInfo.redColor}70, 0 0 8px ${periodInfo.blueColor}60, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
          }
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          width: '100%'
        }}>
          <span style={{ color: periodInfo.redColor }}>{periodInfo.redPlanetName}</span>
          <span style={{ color: periodInfo.blueColor }}>{periodInfo.bluePlanetName}</span>
        </div>
        <div style={{ fontSize: '9px', opacity: 0.75, textAlign: 'center', width: '100%' }}>{periodInfo.period}</div>
      </div>
    );
  });

  return (
    <div className="themed-route-page health-season-page" style={{
      minHeight: '100vh', 
      backgroundColor: '#000000',
      color: '#FFFFFF',
      display: 'flex'
    }}>
      {/* 主要内容区域 */}
      <div style={{ flex: 1, padding: '20px' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#4CAF50',
            textShadow: '0 0 20px rgba(76, 175, 80, 0.5)'
          }}>
            寄生草・漫揾英雄泪
          </h1>
          <p style={{
            fontSize: '16px', 
            color: '#CCCCCC',
            marginTop: '8px'
          }}>
            赤条条，来去无牵挂
          </p>
        </div>

        {/* 星球出现次数卡片 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '16px',
          maxWidth: '720px',
          margin: '0 auto 24px',
          overflow: 'visible'
        }}>
          {allCards.map((combination) => {
            const percentage = combination.total > 0 ? Math.round((combination.count / combination.total) * 100) : 0;
            return (
              <Card
                key={combination.name}
                style={{
                  borderRadius: '20px',
                  boxShadow: `0 0 20px ${combination.color}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${combination.color}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
                  border: `1px solid ${combination.color}50`,
                  backgroundColor: '#1A1A1A',
                  backgroundImage: `linear-gradient(145deg, #252525, #101010)`,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  transformStyle: 'preserve-3d',
                  perspective: '1000px',
                  transform: 'translateZ(0)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  overflow: 'visible'
                }}
                hoverable
                onMouseEnter={(e) => {
                  const card = e.currentTarget;
                  card.style.transform = 'translateZ(10px) scale(1.02)';
                  card.style.boxShadow = `0 0 25px ${combination.color}80, 0 15px 40px rgba(0, 0, 0, 0.6), inset 0 0 15px ${combination.color}30, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
                }}
                onMouseLeave={(e) => {
                  const card = e.currentTarget;
                  card.style.transform = 'translateZ(0) scale(1)';
                  card.style.boxShadow = `0 0 20px ${combination.color}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${combination.color}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
                }}
              >
                {/* 顶部：圆形星球名 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: combination.color,
                    flexShrink: 0,
                    boxShadow: `0 0 12px ${combination.color}80, inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                    border: `1px solid ${combination.color}50`
                  }}>
                    {combination.name}
                  </div>
                </div>
                
                {/* 底部：次数和百分比 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  {/* 左侧：次数 */}
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#FFFFFF'
                  }}>
                    {combination.count}
                  </div>
                  
                  {/* 右侧：百分比 */}
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#888888'
                  }}>
                    {percentage}%
                  </div>
                </div>
                
                {/* 底部：进度条 */}
                <div style={{ width: '100%' }}>
                  <Progress
                    percent={percentage}
                    strokeColor={combination.color}
                    size="default"
                    strokeLinecap="round"
                    showInfo={false}
                  />
                </div>
              </Card>
            );
          })}
        </div>

        {/* 训练天数卡片 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '16px',
          maxWidth: '1040px',
          margin: '0 auto 24px'
        }}>
          <Card 
            style={{
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(76, 175, 80, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(76, 175, 80, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(76, 175, 80, 0.4)',
              backgroundColor: '#1A1A1A',
              backgroundImage: 'linear-gradient(145deg, #252525, #101010)',
              height: 'auto',
              paddingTop: '12px',
              position: 'relative',
              paddingBottom: '84px'
            }}
          >
              <div style={{
                display: 'flex', 
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '20px',
                flexWrap: 'wrap',
                marginBottom: '16px',
                paddingBottom: '16px',
                borderBottom: '1px solid #333333',
                width: '100%'
              }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    justifyContent: 'flex-start',
                    flex: '1 1 620px',
                    flexWrap: 'wrap',
                    marginLeft: '10px'
                  }}>
                    {planetCounts.map((planet, index) => {
                      // 获取星球颜色
                      let planetColor = '#4CAF50';
                      if (planet.name === '太阳' || planet.name === '月亮') {
                        planetColor = BLUE_BALL_COMBINATION_COLORS[planet.name as keyof typeof BLUE_BALL_COMBINATION_COLORS] || '#4CAF50';
                      } else {
                        planetColor = RED_BALL_COMBINATION_COLORS[planet.name as keyof typeof RED_BALL_COMBINATION_COLORS] || '#4CAF50';
                      }
                       
                      return (
                        <div 
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <div 
                          style={{
                            width: '96px',
                            height: '48px',
                            borderRadius: '24px',
                            backgroundColor: 'transparent',
                            color: planetColor,
                            border: `1px solid ${planetColor}50`,
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0 10px',
                            transformStyle: 'preserve-3d',
                            perspective: '1000px',
                            transform: 'translateZ(0)',
                            boxShadow: `0 0 8px ${planetColor}80, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                            cursor: 'pointer',
                            fontSize: '16px'
                          }}
                          title={planet.name}
                          onMouseEnter={(e) => {
                            const button = e.currentTarget;
                            button.style.transform = 'translateZ(8px) scale(1.05)';
                            button.style.boxShadow = `0 0 12px ${planetColor}80, 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                          }}
                          onMouseLeave={(e) => {
                            const button = e.currentTarget;
                            button.style.transform = 'translateZ(0) scale(1)';
                            button.style.boxShadow = `0 0 8px ${planetColor}80, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                          }}
                        >
                          <div style={{ fontSize: '12px', opacity: 0.8 }}>{planet.name}</div>
                          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{planet.count}</div>
                        </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    justifyContent: 'flex-end',
                    flex: '1 1 280px',
                    flexWrap: 'wrap',
                    marginRight: '10px',
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: '18px',
                    justifyContent: 'center'
                  }}>
                    <button 
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'transparent',
                        color: currentPage === 1 ? '#666666' : navigationColor,
                        border: currentPage === 1 ? '1px solid #333333' : `1px solid ${navigationBorderColor}`,
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transformStyle: 'preserve-3d',
                        perspective: '1000px',
                        transform: 'translateZ(0)',
                        boxShadow: currentPage === 1 ? '0 0 4px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)' : `0 0 8px ${navigationShadowColor}, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        fontSize: '16px'
                      }}
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      title="第一页"
                      onMouseEnter={(e) => {
                        const button = e.currentTarget;
                        if (!button.disabled) {
                          button.style.transform = 'translateZ(8px) scale(1.05)';
                          button.style.boxShadow = `0 0 12px ${navigationShadowColor}, 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        const button = e.currentTarget;
                        if (!button.disabled) {
                          button.style.transform = 'translateZ(0) scale(1)';
                          button.style.boxShadow = `0 0 8px ${navigationShadowColor}, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                        }
                      }}
                    >
                      <FastBackwardOutlined />
                    </button>
                    <button 
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'transparent',
                        color: currentPage === 1 ? '#666666' : navigationColor,
                        border: currentPage === 1 ? '1px solid #333333' : `1px solid ${navigationBorderColor}`,
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transformStyle: 'preserve-3d',
                        perspective: '1000px',
                        transform: 'translateZ(0)',
                        boxShadow: currentPage === 1 ? '0 0 4px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)' : `0 0 8px ${navigationShadowColor}, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        fontSize: '16px'
                      }}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      title="上一页"
                      onMouseEnter={(e) => {
                        const button = e.currentTarget;
                        if (!button.disabled) {
                          button.style.transform = 'translateZ(8px) scale(1.05)';
                          button.style.boxShadow = `0 0 12px ${navigationShadowColor}, 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        const button = e.currentTarget;
                        if (!button.disabled) {
                          button.style.transform = 'translateZ(0) scale(1)';
                          button.style.boxShadow = `0 0 8px ${navigationShadowColor}, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                        }
                      }}
                    >
                      <StepBackwardOutlined />
                    </button>
                    <span style={{ fontSize: '12px', color: '#888888' }}>
                      {currentPage} / {getTotalPages()}
                    </span>
                    <button 
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'transparent',
                        color: currentPage === getTotalPages() ? '#666666' : navigationColor,
                        border: currentPage === getTotalPages() ? '1px solid #333333' : `1px solid ${navigationBorderColor}`,
                        cursor: currentPage === getTotalPages() ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transformStyle: 'preserve-3d',
                        perspective: '1000px',
                        transform: 'translateZ(0)',
                        boxShadow: currentPage === getTotalPages() ? '0 0 4px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)' : `0 0 8px ${navigationShadowColor}, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        fontSize: '16px'
                      }}
                      onClick={() => setCurrentPage(prev => Math.min(getTotalPages(), prev + 1))}
                      disabled={currentPage === getTotalPages()}
                      title="下一页"
                      onMouseEnter={(e) => {
                        const button = e.currentTarget;
                        if (!button.disabled) {
                          button.style.transform = 'translateZ(8px) scale(1.05)';
                          button.style.boxShadow = `0 0 12px ${navigationShadowColor}, 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        const button = e.currentTarget;
                        if (!button.disabled) {
                          button.style.transform = 'translateZ(0) scale(1)';
                          button.style.boxShadow = `0 0 8px ${navigationShadowColor}, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                        }
                      }}
                    >
                      <StepForwardOutlined />
                    </button>
                    <button 
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'transparent',
                        color: currentPage === getTotalPages() ? '#666666' : navigationColor,
                        border: currentPage === getTotalPages() ? '1px solid #333333' : `1px solid ${navigationBorderColor}`,
                        cursor: currentPage === getTotalPages() ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transformStyle: 'preserve-3d',
                        perspective: '1000px',
                        transform: 'translateZ(0)',
                        boxShadow: currentPage === getTotalPages() ? '0 0 4px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)' : `0 0 8px ${navigationShadowColor}, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        fontSize: '16px'
                      }}
                      onClick={() => setCurrentPage(getTotalPages())}
                      disabled={currentPage === getTotalPages()}
                      title="最后一页"
                      onMouseEnter={(e) => {
                        const button = e.currentTarget;
                        if (!button.disabled) {
                          button.style.transform = 'translateZ(8px) scale(1.05)';
                          button.style.boxShadow = `0 0 12px ${navigationShadowColor}, 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        const button = e.currentTarget;
                        if (!button.disabled) {
                          button.style.transform = 'translateZ(0) scale(1)';
                          button.style.boxShadow = `0 0 8px ${navigationShadowColor}, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                        }
                      }}
                    >
                      <FastForwardOutlined />
                    </button>
                  </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))',
                gap: '12px',
                justifyItems: 'center',
                alignItems: 'center'
              }}>
                {trainingDays.map((day, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {day}
                  </div>
                ))}
              </div>
            </Card>
        </div>


      </div>
    </div>
  );
};

export default HealthThirdPage;
