import React, { useState } from 'react';
import LeftMenu from './LeftMenu';
import { Card, Progress } from 'antd';
import { FastForwardOutlined, StepForwardOutlined, StepBackwardOutlined, FastBackwardOutlined } from '@ant-design/icons';
import { useRecordContext } from '../contexts/RecordContext';
import { RED_BALL_COMBINATION_COLORS, BLUE_BALL_COMBINATION_COLORS } from '../constants/colors';

const HealthThirdPage: React.FC = () => {
  const { allRecords } = useRecordContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [isRedActive, setIsRedActive] = useState(true);
  
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
    
    return Math.max(1, Math.ceil(recordsArray.length / 64));
  };

  // 获取指定页的六十四期记录
  const getLastSixtyFourPeriods = () => {
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
    

    const pageSize = 64;
    const startIndex = allPeriodsWithInfo.length - (currentPage * pageSize);
    const endIndex = allPeriodsWithInfo.length - ((currentPage - 1) * pageSize);
    
    let pagePeriods = [];
    if (startIndex < 0) {
      pagePeriods = allPeriodsWithInfo.slice(0, endIndex).reverse();
    } else {
      pagePeriods = allPeriodsWithInfo.slice(startIndex, endIndex).reverse();
    }
    
    // 如果不足六十四期，用空数据填充
    const emptyPeriods = 64 - pagePeriods.length;
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

  // 获取最后六十四期数据
  const lastSixtyFourPeriods = getLastSixtyFourPeriods();

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
    
    const pageSize = 64;
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
      
      const planetName = isRedActive ? redPlanetName : bluePlanetName;
      planetCounts[planetName] = (planetCounts[planetName] || 0) + 1;
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

  // 生成训练天数数据（根据红蓝切换显示对应的星球名）
  const trainingDays = lastSixtyFourPeriods.map((periodInfo, index) => {
    const displayName = isRedActive ? periodInfo.redPlanetName : periodInfo.bluePlanetName;
    const displayColor = isRedActive ? periodInfo.redColor : periodInfo.blueColor;
    
    return (
      <div 
        key={index}
        className="day-cell"
        style={{
          width: '60px',
          height: '60px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          margin: '2px',
          fontSize: '12px',
          fontWeight: 'bold',
          backgroundColor: displayName ? `${displayColor}22` : '#2D2D2D',
          color: displayName ? displayColor : '#888888',
          border: displayName ? `1px solid ${displayColor}50` : '1px solid #333333',
          boxShadow: displayName ? `0 0 8px ${displayColor}80, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)` : '0 0 4px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)',
          transformStyle: 'preserve-3d',
          perspective: '1000px',
          transform: 'translateZ(0)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          const cell = e.currentTarget;
          if (displayName) {
            cell.style.transform = 'translateZ(6px) scale(1.05)';
            cell.style.boxShadow = `0 0 12px ${displayColor}80, 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
          }
        }}
        onMouseLeave={(e) => {
          const cell = e.currentTarget;
          if (displayName) {
            cell.style.transform = 'translateZ(0) scale(1)';
            cell.style.boxShadow = `0 0 8px ${displayColor}80, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
          }
        }}
      >
        <div>{displayName}</div>
        <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>{periodInfo.period}</div>
      </div>
    );
  });

  return (
    <div className="health-third-page" style={{ 
      minHeight: 'calc(100vh - 64px)', 
      backgroundColor: '#000000',
      color: '#FFFFFF',
      display: 'flex'
    }}>
      {/* 左侧菜单Docker栏 */}
      <LeftMenu />

      {/* 主要内容区域 */}
      <div style={{ flex: 1, marginLeft: '80px', padding: '20px' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#4CAF50',
            textShadow: '0 0 20px rgba(76, 175, 80, 0.5)'
          }}>
            健康数据分析
          </h1>
          <p style={{ 
            fontSize: '16px', 
            color: '#CCCCCC',
            marginTop: '8px'
          }}>
            深度分析您的健康数据，提供个性化的健康建议
          </p>
        </div>

        {/* 健康数据概览卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {/* 总期数卡片 */}
          <Card 
            style={{ 
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(76, 175, 80, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(76, 175, 80, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(76, 175, 80, 0.4)',
              backgroundColor: '#2D2D2D',
              backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)',
              height: '200px',
              padding: '16px'
            }}
          >
            <div style={{ 
              height: '160px', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '48px', 
                  fontWeight: 'bold', 
                  color: '#4CAF50',
                  marginBottom: '8px'
                }}>
                  {totalPeriods}
                </div>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#CCCCCC',
                  margin: 0
                }}>
                  总期数
                </p>
              </div>
            </div>
          </Card>

          {/* 健康指标卡片 */}
          <Card 
            style={{ 
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(76, 175, 80, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(76, 175, 80, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(76, 175, 80, 0.4)',
              backgroundColor: '#2D2D2D',
              backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)',
              height: '200px',
              padding: '16px'
            }}
          >
            <div style={{ 
              height: '160px', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '48px', 
                  fontWeight: 'bold', 
                  color: '#1890ff',
                  marginBottom: '8px'
                }}>
                  85%
                </div>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#CCCCCC',
                  margin: 0
                }}>
                  健康指数
                </p>
              </div>
            </div>
          </Card>

          {/* 趋势分析卡片 */}
          <Card 
            style={{ 
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(76, 175, 80, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(76, 175, 80, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(76, 175, 80, 0.4)',
              backgroundColor: '#2D2D2D',
              backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)',
              height: '200px',
              padding: '16px'
            }}
          >
            <div style={{ 
              height: '160px', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '48px', 
                  fontWeight: 'bold', 
                  color: '#FF5722',
                  marginBottom: '8px'
                }}>
                  ↑ 12%
                </div>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#CCCCCC',
                  margin: 0
                }}>
                  趋势上升
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* 训练天数卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '24px' }}>
          <Card 
            style={{ 
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(76, 175, 80, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(76, 175, 80, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(76, 175, 80, 0.4)',
              backgroundColor: '#1A1A1A',
              backgroundImage: 'linear-gradient(145deg, #252525, #101010)',
              height: 'auto',
              paddingTop: '24px'
            }}
            title={
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF' }}>
                训练天数
              </span>
            }
          >
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                gap: '40px',
                marginBottom: '16px',
                paddingBottom: '16px',
                borderBottom: '1px solid #333333'
              }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <button 
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: isRedActive ? '#FF000022' : '#1890ff22',
                        color: isRedActive ? '#FF0000' : '#1890ff',
                        border: `1px solid ${isRedActive ? '#FF000050' : '#1890ff50'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transformStyle: 'preserve-3d',
                        perspective: '1000px',
                        transform: 'translateZ(0)',
                        boxShadow: `0 0 8px ${isRedActive ? '#FF000080' : '#1890ff80'}, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        fontSize: '16px'
                      }}
                      onClick={() => setIsRedActive(!isRedActive)}
                      onMouseEnter={(e) => {
                        const button = e.currentTarget;
                        const color = isRedActive ? '#FF000080' : '#1890ff80';
                        button.style.transform = 'translateZ(8px) scale(1.05)';
                        button.style.boxShadow = `0 0 12px ${color}, 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                      }}
                      onMouseLeave={(e) => {
                        const button = e.currentTarget;
                        const color = isRedActive ? '#FF000080' : '#1890ff80';
                        button.style.transform = 'translateZ(0) scale(1)';
                        button.style.boxShadow = `0 0 8px ${color}, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                      }}
                    />
                    <button 
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: currentPage === 1 ? '#1A1A1A' : isRedActive ? '#FF000022' : '#1890ff22',
                        color: currentPage === 1 ? '#666666' : isRedActive ? '#FF0000' : '#1890ff',
                        border: currentPage === 1 ? '1px solid #333333' : `1px solid ${isRedActive ? '#FF000050' : '#1890ff50'}`,
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transformStyle: 'preserve-3d',
                        perspective: '1000px',
                        transform: 'translateZ(0)',
                        boxShadow: currentPage === 1 ? '0 0 4px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)' : `0 0 8px ${isRedActive ? '#FF000080' : '#1890ff80'}, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
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
                          button.style.boxShadow = `0 0 12px ${isRedActive ? '#FF000080' : '#1890ff80'}, 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        const button = e.currentTarget;
                        if (!button.disabled) {
                          button.style.transform = 'translateZ(0) scale(1)';
                          button.style.boxShadow = `0 0 8px ${isRedActive ? '#FF000080' : '#1890ff80'}, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
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
                        backgroundColor: currentPage === 1 ? '#1A1A1A' : isRedActive ? '#FF000022' : '#1890ff22',
                        color: currentPage === 1 ? '#666666' : isRedActive ? '#FF0000' : '#1890ff',
                        border: currentPage === 1 ? '1px solid #333333' : `1px solid ${isRedActive ? '#FF000050' : '#1890ff50'}`,
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transformStyle: 'preserve-3d',
                        perspective: '1000px',
                        transform: 'translateZ(0)',
                        boxShadow: currentPage === 1 ? '0 0 4px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)' : `0 0 8px ${isRedActive ? '#FF000080' : '#1890ff80'}, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
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
                          button.style.boxShadow = `0 0 12px ${isRedActive ? '#FF000080' : '#1890ff80'}, 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        const button = e.currentTarget;
                        if (!button.disabled) {
                          button.style.transform = 'translateZ(0) scale(1)';
                          button.style.boxShadow = `0 0 8px ${isRedActive ? '#FF000080' : '#1890ff80'}, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
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
                        backgroundColor: currentPage === getTotalPages() ? '#1A1A1A' : isRedActive ? '#FF000022' : '#1890ff22',
                        color: currentPage === getTotalPages() ? '#666666' : isRedActive ? '#FF0000' : '#1890ff',
                        border: currentPage === getTotalPages() ? '1px solid #333333' : `1px solid ${isRedActive ? '#FF000050' : '#1890ff50'}`,
                        cursor: currentPage === getTotalPages() ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transformStyle: 'preserve-3d',
                        perspective: '1000px',
                        transform: 'translateZ(0)',
                        boxShadow: currentPage === getTotalPages() ? '0 0 4px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)' : `0 0 8px ${isRedActive ? '#FF000080' : '#1890ff80'}, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
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
                          button.style.boxShadow = `0 0 12px ${isRedActive ? '#FF000080' : '#1890ff80'}, 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        const button = e.currentTarget;
                        if (!button.disabled) {
                          button.style.transform = 'translateZ(0) scale(1)';
                          button.style.boxShadow = `0 0 8px ${isRedActive ? '#FF000080' : '#1890ff80'}, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
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
                        backgroundColor: currentPage === getTotalPages() ? '#1A1A1A' : isRedActive ? '#FF000022' : '#1890ff22',
                        color: currentPage === getTotalPages() ? '#666666' : isRedActive ? '#FF0000' : '#1890ff',
                        border: currentPage === getTotalPages() ? '1px solid #333333' : `1px solid ${isRedActive ? '#FF000050' : '#1890ff50'}`,
                        cursor: currentPage === getTotalPages() ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transformStyle: 'preserve-3d',
                        perspective: '1000px',
                        transform: 'translateZ(0)',
                        boxShadow: currentPage === getTotalPages() ? '0 0 4px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)' : `0 0 8px ${isRedActive ? '#FF000080' : '#1890ff80'}, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
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
                          button.style.boxShadow = `0 0 12px ${isRedActive ? '#FF000080' : '#1890ff80'}, 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        const button = e.currentTarget;
                        if (!button.disabled) {
                          button.style.transform = 'translateZ(0) scale(1)';
                          button.style.boxShadow = `0 0 8px ${isRedActive ? '#FF000080' : '#1890ff80'}, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                        }
                      }}
                    >
                      <FastForwardOutlined />
                    </button>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
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
                              width: '60px',
                              height: '60px',
                              borderRadius: '50%',
                              backgroundColor: `${planetColor}22`,
                              color: planetColor,
                              border: `1px solid ${planetColor}50`,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
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
                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{planet.count}</div>
                            <div style={{ fontSize: '10px', opacity: 0.8 }}>{planet.name}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '10px' }}>
                {trainingDays}
              </div>
            </Card>
        </div>


      </div>
    </div>
  );
};

export default HealthThirdPage;