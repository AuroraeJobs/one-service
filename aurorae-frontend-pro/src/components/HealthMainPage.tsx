import React, { useState } from 'react';
import LeftMenu from './LeftMenu';
import { Card, Progress } from 'antd';
import { FastForwardOutlined, StepForwardOutlined, StepBackwardOutlined, FastBackwardOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { RED_BALL_COMBINATION_COLORS, RED_BALL_CHARACTER_MAP, BLUE_BALL_COMBINATION_COLORS } from '../constants/colors';
import { useRecordContext } from '../contexts/RecordContext';
import { periodToGanZhi } from '../constants/heavenlyStemsEarthlyBranches';
import { HEXAGRAMS } from '../constants/hexagrams';

// 蓝球号码与节气名称的对应关系
const BLUE_BALL_SOLAR_TERM_MAP: { [key: string]: string } = {
  '01': '雨水',
  '02': '惊蛰',
  '03': '清明',
  '04': '谷雨',
  '05': '小满',
  '06': '芒种',
  '07': '小暑',
  '08': '大暑',
  '09': '处暑',
  '10': '白露',
  '11': '寒露',
  '12': '霜降',
  '13': '小雪',
  '14': '大雪',
  '15': '小寒',
  '16': '大寒'
};

// 健康数据图表配置
const workoutChartOption = {
  backgroundColor: 'transparent',
  series: [
    {
      type: 'custom',
      renderItem: (_params: unknown, api: { coord: (arg0: number[]) => number[]; size: (arg0: number[]) => number[] }) => {
        const center = api.coord([0.5, 0.5]);
        const size = Math.min(api.size([1, 1])[0], api.size([1, 1])[1]) * 0.8;
        
        return {
          type: 'group',
          children: [
            // 黄色圆形（卡路里）
            {
              type: 'circle',
              shape: {
                cx: center[0] + size * 0.3,
                cy: center[1] - size * 0.2,
                r: size * 0.4
              },
              style: {
                fill: 'rgba(255, 213, 79, 0.6)'
              }
            },
            // 红色圆形（燃烧卡路里）
            {
              type: 'circle',
              shape: {
                cx: center[0] - size * 0.2,
                cy: center[1] + size * 0.3,
                r: size * 0.3
              },
              style: {
                fill: 'rgba(255, 87, 34, 0.6)'
              }
            },
            // 黄色数字
            {
              type: 'text',
              shape: {
                x: center[0] + size * 0.3,
                y: center[1] - size * 0.2
              },
              style: {
                text: '1875',
                fontSize: size * 0.2,
                fontWeight: 'bold',
                fill: '#FFFFFF',
                textAlign: 'center'
              }
            },
            // 红色数字
            {
              type: 'text',
              shape: {
                x: center[0] - size * 0.2,
                y: center[1] + size * 0.3
              },
              style: {
                text: '850',
                fontSize: size * 0.15,
                fontWeight: 'bold',
                fill: '#FFFFFF',
                textAlign: 'center'
              }
            },
            // 黑色数字
            {
              type: 'text',
              shape: {
                x: center[0] - size * 0.3,
                y: center[1] - size * 0.3
              },
              style: {
                text: '2.30',
                fontSize: size * 0.12,
                fontWeight: 'bold',
                fill: '#FFFFFF',
                textAlign: 'center'
              }
            }
          ]
        };
      },
      data: [1]
    }
  ]
};



const HealthMainPage: React.FC = () => {
  const { allRecords } = useRecordContext();
  const [currentRightPage, setCurrentRightPage] = useState(1);
  
  // 计算总期数
  const calculateTotalPeriods = () => {
    if (!allRecords) return 0;
    if (typeof allRecords === 'string') {
      // 如果是字符串，用换行符分割并过滤空行
      return allRecords
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .length;
    } else if (Array.isArray(allRecords)) {
      // 如果是数组，直接返回长度
      return allRecords.length;
    }
    return 0;
  };
  
  const totalPeriods = calculateTotalPeriods();
  




  // 计算红球奇偶组合（星球名映射）
  const calculateRedBallOddEvenCombinations = () => {
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
  };
  
  // 获取右侧分页的总页数
  const getRightTotalPages = () => {
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
    
    return Math.max(1, Math.ceil(recordsArray.length / 8));
  };
  
  // 获取指定页的八期红球奇偶组合记录，包含到每期为止的累计次数
  const getLastEightPeriods = () => {
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
    
    // 初始化所有可能的红球号码（01-33）和蓝球号码（01-16）的计数为0
    const cumulativeRedCounts: { [key: string]: number } = {};
    const cumulativeBlueCounts: { [key: string]: number } = {};
    
    for (let i = 1; i <= 33; i++) {
      const ballStr = i.toString().padStart(2, '0');
      cumulativeRedCounts[ballStr] = 0;
    }
    
    for (let i = 1; i <= 16; i++) {
      const ballStr = i.toString().padStart(2, '0');
      cumulativeBlueCounts[ballStr] = 0;
    }
    
    // 计算每期的累计次数
    const allPeriodsWithCounts = recordsArray.map((record, recordIndex) => {
      const redBalls = record.slice(0, 12);
      const blueBall = record.slice(12, 14); // 提取蓝球号码（最后2位）
      let oddCount = 0;
      
      // 提取红球号码
      const balls = [];
      for (let i = 0; i < 12; i += 2) {
        const ball = parseInt(redBalls.slice(i, i + 2));
        balls.push(ball);
        if (ball % 2 !== 0) {
          oddCount++;
        }
      }
      
      // 根据奇数个数映射到对应的星球名
      let planetName = '';
      switch (oddCount) {
        case 6:
          planetName = '天王星';
          break;
        case 5:
          planetName = '土星';
          break;
        case 4:
          planetName = '木星';
          break;
        case 3:
          planetName = '火星';
          break;
        case 2:
          planetName = '金星';
          break;
        case 1:
          planetName = '水星';
          break;
        case 0:
          planetName = '地球';
          break;
      }
      
      // 创建当期的累计次数副本
      const currentRedCounts = { ...cumulativeRedCounts };
      const currentBlueCount = cumulativeBlueCounts[blueBall]; // 蓝球到当前期的累计次数
      
      // 为当期的每个红球号码创建带累计次数的对象
      const ballsWithCounts = balls.map(ball => {
        const ballStr = ball.toString().padStart(2, '0');
        return {
          number: ball,
          cumulativeCount: currentRedCounts[ballStr]
        };
      });
      
      // 更新累计次数（当前期的号码不计入本期的累计次数）
      for (let i = 0; i < 12; i += 2) {
        const ballStr = redBalls.slice(i, i + 2);
        cumulativeRedCounts[ballStr]++;
      }
      
      // 更新蓝球累计次数
      cumulativeBlueCounts[blueBall]++;
      
      // 计算卦象：红色球的六个号码奇偶形依次对应每个卦从下往上的一爻
        // 奇数为阳爻(1)，偶数为阴爻(0)
        const hexagramCode = balls.map(ball => ball % 2 === 1 ? '1' : '0').join('');
        const hexagram = HEXAGRAMS[hexagramCode as keyof typeof HEXAGRAMS] || { name: '坤' };
        
        return {
          period: recordIndex + 1, // 期数从1开始
          ganzhi: periodToGanZhi(recordIndex + 1), // 对应的天干地支
          balls: ballsWithCounts, // 带累计次数的红球号码
          blueBall: parseInt(blueBall), // 蓝球号码
          blueBallStr: blueBall, // 蓝球号码字符串（两位数字）
          blueCumulativeCount: currentBlueCount, // 蓝球到当前期的累计次数
          oddCount, // 奇数个数
          evenCount: 6 - oddCount, // 偶数个数
          combination: `${oddCount}奇${6 - oddCount}偶`, // 奇偶组合
          planetName, // 对应的星球名
          color: RED_BALL_COMBINATION_COLORS[planetName as keyof typeof RED_BALL_COMBINATION_COLORS] || '#4CAF50',
          hexagramCode, // 卦象编码
          hexagramName: hexagram.name // 卦象名称
        };
    });
    
    // 计算分页逻辑，每页8期，最新的在前
    const pageSize = 8;
    const startIndex = allPeriodsWithCounts.length - (currentRightPage * pageSize);
    const endIndex = allPeriodsWithCounts.length - ((currentRightPage - 1) * pageSize);
    
    let pagePeriods = [];
    if (startIndex < 0) {
      pagePeriods = allPeriodsWithCounts.slice(0, endIndex).reverse();
    } else {
      pagePeriods = allPeriodsWithCounts.slice(startIndex, endIndex).reverse();
    }
    
    return pagePeriods;
  };
  
  const redBallCombinations = calculateRedBallOddEvenCombinations();
  const lastEightPeriods = getLastEightPeriods();
  
  // 计算蓝球奇偶次数
  const calculateBlueBallOddEven = () => {
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
  };
  
  const blueBallOddEven = calculateBlueBallOddEven();
  
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
  const allCards = [
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
  ].sort((a, b) => b.count - a.count);

  return (
    <div className="health-main-page" style={{ 
      minHeight: 'calc(100vh - 64px)', 
      backgroundColor: '#000000',
      color: '#FFFFFF',
      display: 'flex'
    }}>
      {/* 左侧菜单Docker栏 */}
      <LeftMenu />

      {/* 主要内容区域 */}
      <div style={{ flex: 1, marginLeft: '80px', padding: '20px' }}>

        {/* 今日锻炼结果卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {/* 锻炼结果图表 */}
          <Card 
            style={{ 
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(76, 175, 80, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(76, 175, 80, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(76, 175, 80, 0.4)',
              backgroundColor: '#2D2D2D',
              backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)',
              height: '280px',
              padding: '16px'
            }}
            title={
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF' }}>
                Your Workout Results for Today
              </span>
            }
          >
          </Card>

          {/* 步数卡片 */}
          <Card 
            style={{ 
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(76, 175, 80, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(76, 175, 80, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(76, 175, 80, 0.4)',
              backgroundColor: '#2D2D2D',
              backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)',
              height: '280px',
              padding: '16px'
            }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF' }}>
                  Steps for Today
                </span>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#4CAF50',
                  padding: 0
                }}>
                  1107568
                </span>
              </div>
            }
          >
            <div style={{ 
              height: '180px', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '48px', 
                  fontWeight: 'bold', 
                  color: '#FFFFFF',
                  marginBottom: '8px'
                }}>
                  {totalPeriods}
                </div>
                <p style={{ 
                  fontSize: '12px', 
                  color: '#CCCCCC',
                  margin: 0
                }}>
                  Total Periods
                </p>
              </div>
            </div>
          </Card>

          {/* 减肥计划卡片 */}
          <Card 
            style={{ 
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(76, 175, 80, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(76, 175, 80, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(76, 175, 80, 0.4)',
              backgroundColor: '#2D2D2D',
              backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)',
              height: '280px',
              padding: '16px'
            }}
            title={
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF' }}>
                Weight Loss Plan
              </span>
            }
          >
            <div style={{ 
              height: '180px', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#CCCCCC' }}>34.5 kg</span>
                  <span style={{ fontSize: '14px', color: '#4CAF50', fontWeight: 'bold' }}>69% Completed</span>
                </div>
                <Progress 
                  percent={69} 
                  strokeColor="#4CAF50" 
                  size="default"
                  showInfo={false}
                  strokeWidth={8}
                  status="active"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '14px', color: '#CCCCCC' }}>Current</span>
                </div>
                <div style={{ flex: 1, margin: '0 16px' }}>
                  <div style={{ 
                    height: '4px', 
                    backgroundColor: '#333333', 
                    borderRadius: '2px',
                    position: 'relative'
                  }}>
                    <div style={{ 
                      position: 'absolute', 
                      left: '60%', 
                      top: '-8px', 
                      width: '20px', 
                      height: '20px', 
                      backgroundColor: '#4CAF50', 
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{ 
                        width: '8px', 
                        height: '8px', 
                        backgroundColor: '#fff', 
                        borderRadius: '50%'
                      }} />
                    </div>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '14px', color: '#CCCCCC' }}>50 kg</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 星球出现次数卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: '16px', marginBottom: '24px', overflow: 'visible' }}>
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
                    backgroundColor: `${combination.color}22`,
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
                    style={{ width: '100%', margin: 0 }}
                  />
                </div>
              </Card>
            );
          })}
        </div>

        {/* 主要内容区域 */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>


              





          {/* 右侧：最后八期卡片 */}
          <Card 
            style={{ 
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(76, 175, 80, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(76, 175, 80, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(76, 175, 80, 0.4)',
              flex: 1,
              backgroundColor: '#1A1A1A',
              overflow: 'visible',
              backgroundImage: 'linear-gradient(145deg, #252525, #101010)',
              height: 'auto'
            }}
            title={null} // 去掉标题
          >
            {/* 最后八期记录 - 每行两期 */}
            {lastEightPeriods.length > 0 ? (
              <div>
                {Array.from({ length: Math.ceil(lastEightPeriods.length / 2) }, (_, rowIndex) => {
                  const start = rowIndex * 2;
                  const rowPeriods = lastEightPeriods.slice(start, start + 2);
                  return (
                    <div 
                      key={rowIndex}
                      style={{ 
                        display: 'flex', 
                        gap: '32px',
                        padding: '20px 0',
                        borderBottom: rowIndex < Math.ceil(lastEightPeriods.length / 2) - 1 ? '1px solid #333333' : 'none'
                      }}
                    >
                      {rowPeriods.map((period, colIndex) => (
                        <div 
                          key={`${rowIndex}-${colIndex}`}
                          style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center',
                            flex: 1,
                            gap: '16px'
                          }}
                        >
                          {/* 顶部：期号、天干地支avatar和其他avatar（期号在左，天干地支avatar在中，其他avatar在右） */}
                          <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '0 40px' }}>
                            {/* 左侧：期号和天干地支Avatar */}
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              {/* 期号Avatar */}
                              <div
                                style={{
                                  width: '48px',
                                  height: '48px',
                                  backgroundColor: '#FF980022',
                                  color: '#FF9800',
                                  boxShadow: `0 0 8px rgba(255, 152, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                                  border: `1px solid rgba(255, 152, 0, 0.5)`,
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transformStyle: 'preserve-3d',
                                  perspective: '1000px',
                                  transform: 'translateZ(0)',
                                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                  cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                  const avatar = e.currentTarget;
                                  avatar.style.transform = 'translateZ(8px) scale(1.05)';
                                  avatar.style.boxShadow = `0 0 12px rgba(255, 152, 0, 0.8), 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                                }}
                                onMouseLeave={(e) => {
                                  const avatar = e.currentTarget;
                                  avatar.style.transform = 'translateZ(0) scale(1)';
                                  avatar.style.boxShadow = `0 0 8px rgba(255, 152, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                                }}
                              >
                                {period.period}
                              </div>
                              
                              {/* 天干地支Avatar */}
                              <div
                                style={{
                                  width: '48px',
                                  height: '48px',
                                  backgroundColor: '#4CAF5022',
                                  color: '#4CAF50',
                                  boxShadow: `0 0 8px rgba(76, 175, 80, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                                  border: `1px solid rgba(76, 175, 80, 0.5)`,
                                  fontSize: '12px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transformStyle: 'preserve-3d',
                                  perspective: '1000px',
                                  transform: 'translateZ(0)',
                                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                  cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                  const avatar = e.currentTarget;
                                  avatar.style.transform = 'translateZ(8px) scale(1.05)';
                                  avatar.style.boxShadow = `0 0 12px rgba(76, 175, 80, 0.8), 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                                }}
                                onMouseLeave={(e) => {
                                  const avatar = e.currentTarget;
                                  avatar.style.transform = 'translateZ(0) scale(1)';
                                  avatar.style.boxShadow = `0 0 8px rgba(76, 175, 80, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                                }}
                              >
                                {period.ganzhi}
                              </div>
                            </div>
                            
                            {/* 中间：卦象Avatar */}
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                              <div
                                style={{
                                  width: '48px',
                                  height: '48px',
                                  backgroundColor: `${period.color}22`,
                                  color: period.color,
                                  boxShadow: `0 0 8px ${period.color}80, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                                  border: `1px solid ${period.color}50`,
                                  fontSize: '12px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transformStyle: 'preserve-3d',
                                  perspective: '1000px',
                                  transform: 'translateZ(0)',
                                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                  cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                  const avatar = e.currentTarget;
                                  avatar.style.transform = 'translateZ(8px) scale(1.05)';
                                  avatar.style.boxShadow = `0 0 12px ${period.color}80, 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                                }}
                                onMouseLeave={(e) => {
                                  const avatar = e.currentTarget;
                                  avatar.style.transform = 'translateZ(0) scale(1)';
                                  avatar.style.boxShadow = `0 0 8px ${period.color}80, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                                }}
                              >
                                {period.hexagramName}
                              </div>
                            </div>
                            
                            {/* 右侧：星球和蓝球Avatar */}
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              {/* 星球Avatar */}
                              <div
                                style={{
                                  width: '48px',
                                  height: '48px',
                                  backgroundColor: '#2D2D2D',
                                  color: period.color,
                                  boxShadow: `0 0 8px ${period.color}80, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                                  border: `1px solid ${period.color}50`,
                                  fontSize: '12px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transformStyle: 'preserve-3d',
                                  perspective: '1000px',
                                  transform: 'translateZ(0)',
                                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                  cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                  const avatar = e.currentTarget;
                                  avatar.style.transform = 'translateZ(8px) scale(1.05)';
                                  avatar.style.boxShadow = `0 0 12px ${period.color}80, 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                                }}
                                onMouseLeave={(e) => {
                                  const avatar = e.currentTarget;
                                  avatar.style.transform = 'translateZ(0) scale(1)';
                                  avatar.style.boxShadow = `0 0 8px ${period.color}80, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                                }}
                              >
                                {period.planetName}
                              </div>
                              
                              {/* 蓝球奇偶Avatar */}
                              <div
                                style={{
                                  width: '48px',
                                  height: '48px',
                                  backgroundColor: period.blueBall % 2 !== 0 ? '#FF000022' : '#9C27B022',
                                  color: period.blueBall % 2 !== 0 ? '#FF0000' : '#9C27B0',
                                  boxShadow: `0 0 8px ${period.blueBall % 2 !== 0 ? '#FF000080' : '#9C27B080'}, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                                  border: `1px solid ${period.blueBall % 2 !== 0 ? '#FF000050' : '#9C27B050'}` ,
                                  fontSize: '12px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transformStyle: 'preserve-3d',
                                  perspective: '1000px',
                                  transform: 'translateZ(0)',
                                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                  cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                  const avatar = e.currentTarget;
                                  avatar.style.transform = 'translateZ(8px) scale(1.05)';
                                  avatar.style.boxShadow = `0 0 12px ${period.blueBall % 2 !== 0 ? '#FF000080' : '#9C27B080'}, 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                                }}
                                onMouseLeave={(e) => {
                                  const avatar = e.currentTarget;
                                  avatar.style.transform = 'translateZ(0) scale(1)';
                                  avatar.style.boxShadow = `0 0 8px ${period.blueBall % 2 !== 0 ? '#FF000080' : '#9C27B080'}, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                                }}
                              >
                                {period.blueBall % 2 !== 0 ? '太阳' : '月亮'}
                              </div>
                            </div>
                          </div>
                          
                          {/* 底部：数字和卡片 */}
                          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '8px', overflow: 'visible' }}>
                            {/* 数字行（与天干地支水平） */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', overflowX: 'visible' }}>
                              {/* 红球数字 */}
                              {period.balls.map((ballObj, ballIndex) => (
                                <div 
                                  key={`number-${ballIndex}`}
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 'normal',
                                    color: '#888888',
                                    width: '80px',
                                    textAlign: 'center',
                                    marginRight: '8px'
                                  }}
                                >
                                  {ballObj.cumulativeCount}
                                </div>
                              ))}
                              
                              {/* 蓝球数字 */}
                              <div 
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 'normal',
                                  color: '#888888',
                                  width: '80px',
                                  textAlign: 'center'
                                }}
                              >
                                {period.blueCumulativeCount}
                              </div>
                            </div>
                            
                            {/* 卡片行 */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflowX: 'visible' }}>
                              {/* 红球人名 */}
                              {period.balls.map((ballObj, ballIndex) => {
                                const { number } = ballObj;
                                // 将球号转换为两位数字符串
                                const ballStr = number.toString().padStart(2, '0');
                                // 获取对应的人名
                                const characterName = RED_BALL_CHARACTER_MAP[ballStr] || ballStr;
                                
                                // 确定卡片颜色
                                const cardColor = number % 2 !== 0 ? '#FF3333' : '#FF8888';
                                const bgColor = number % 2 !== 0 ? '#333333' : '#2D2D2D';
                                const borderColor = number % 2 !== 0 ? '#FF333340' : '#FF888840';
                                
                                return (
                                  <div 
                                    key={ballIndex}
                                    style={{
                                      padding: '16px 12px',
                                      borderRadius: '12px',
                                      backgroundColor: bgColor,
                                      color: cardColor,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '12px',
                                      fontWeight: 'bold',
                                      border: `1px solid ${borderColor}`,
                                      boxShadow: `0 0 8px ${cardColor}80, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                                      whiteSpace: 'nowrap',
                                      width: '80px',
                                      textAlign: 'center',
                                      transformStyle: 'preserve-3d',
                                      perspective: '1000px',
                                      transform: 'translateZ(0)',
                                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                      cursor: 'pointer',
                                      marginRight: '8px',
                                      overflow: 'visible'
                                    }}
                                    onMouseEnter={(e) => {
                                      const card = e.currentTarget;
                                      card.style.transform = 'translateZ(8px) scale(1.05)';
                                      card.style.boxShadow = `0 0 12px ${cardColor}80, 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                                    }}
                                    onMouseLeave={(e) => {
                                      const card = e.currentTarget;
                                      card.style.transform = 'translateZ(0) scale(1)';
                                      card.style.boxShadow = `0 0 8px ${cardColor}80, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                                    }}
                                  >
                                    <div>{characterName}</div>
                                  </div>
                                );
                              })}
                              
                              {/* 蓝球信息 */}
                              <div 
                                style={{
                                  padding: '16px 12px',
                                  borderRadius: '12px',
                                  backgroundColor: '#2D2D2D',
                                  color: period.blueBall % 2 === 0 ? '#87CEFA' : '#1890ff',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  border: `1px solid ${period.blueBall % 2 === 0 ? '#87CEFA40' : '#1890ff40'}`,
                                  boxShadow: `0 0 8px ${period.blueBall % 2 === 0 ? 'rgba(135, 206, 250, 0.6)' : 'rgba(24, 144, 255, 0.6)'}, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                                  whiteSpace: 'nowrap',
                                  width: '80px',
                                  textAlign: 'center',
                                  transformStyle: 'preserve-3d',
                                  perspective: '1000px',
                                  transform: 'translateZ(0)',
                                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                  cursor: 'pointer',
                                  overflow: 'visible'
                                }}
                                onMouseEnter={(e) => {
                                  const card = e.currentTarget;
                                  const cardColor = period.blueBall % 2 === 0 ? 'rgba(135, 206, 250, 0.8)' : 'rgba(24, 144, 255, 0.8)';
                                  card.style.transform = 'translateZ(8px) scale(1.05)';
                                  card.style.boxShadow = `0 0 12px ${cardColor}, 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                                }}
                                onMouseLeave={(e) => {
                                  const card = e.currentTarget;
                                  const cardColor = period.blueBall % 2 === 0 ? 'rgba(135, 206, 250, 0.6)' : 'rgba(24, 144, 255, 0.6)';
                                  card.style.transform = 'translateZ(0) scale(1)';
                                  card.style.boxShadow = `0 0 8px ${cardColor}, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`;
                                }}
                              >
                                <div>{BLUE_BALL_SOLAR_TERM_MAP[period.blueBallStr]}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 0',
                color: '#CCCCCC',
                fontSize: '14px'
              }}>
                暂无数据
              </div>
            )}
        
    
            
            {/* 分页控件 */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: '1px solid #333333'
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
                    backgroundColor: currentRightPage === 1 ? '#1A1A1A' : '#FF000022',
                    color: currentRightPage === 1 ? '#666666' : '#FF0000',
                    border: currentRightPage === 1 ? '1px solid #333333' : '1px solid #FF000050',
                    cursor: currentRightPage === 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                    transform: 'translateZ(0)',
                    boxShadow: currentRightPage === 1 ? '0 0 4px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)' : '0 0 8px #FF000080, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    fontSize: '16px'
                  }}
                  onClick={() => setCurrentRightPage(1)}
                  disabled={currentRightPage === 1}
                  title="第一页"
                  onMouseEnter={(e) => {
                    const button = e.currentTarget;
                    if (!button.disabled) {
                      button.style.transform = 'translateZ(8px) scale(1.05)';
                      button.style.boxShadow = '0 0 12px #FF000080, 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const button = e.currentTarget;
                    if (!button.disabled) {
                      button.style.transform = 'translateZ(0) scale(1)';
                      button.style.boxShadow = '0 0 8px #FF000080, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)';
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
                    backgroundColor: currentRightPage === 1 ? '#1A1A1A' : '#FF000022',
                    color: currentRightPage === 1 ? '#666666' : '#FF0000',
                    border: currentRightPage === 1 ? '1px solid #333333' : '1px solid #FF000050',
                    cursor: currentRightPage === 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                    transform: 'translateZ(0)',
                    boxShadow: currentRightPage === 1 ? '0 0 4px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)' : '0 0 8px #FF000080, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    fontSize: '16px'
                  }}
                  onClick={() => setCurrentRightPage(prev => Math.max(1, prev - 1))}
                  disabled={currentRightPage === 1}
                  title="上一页"
                  onMouseEnter={(e) => {
                    const button = e.currentTarget;
                    if (!button.disabled) {
                      button.style.transform = 'translateZ(8px) scale(1.05)';
                      button.style.boxShadow = '0 0 12px #FF000080, 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const button = e.currentTarget;
                    if (!button.disabled) {
                      button.style.transform = 'translateZ(0) scale(1)';
                      button.style.boxShadow = '0 0 8px #FF000080, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)';
                    }
                  }}
                >
                  <StepBackwardOutlined />
                </button>
                <span style={{ fontSize: '12px', color: '#888888' }}>
                  {currentRightPage} / {getRightTotalPages()}
                </span>
                <button 
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: currentRightPage === getRightTotalPages() ? '#1A1A1A' : '#FF000022',
                    color: currentRightPage === getRightTotalPages() ? '#666666' : '#FF0000',
                    border: currentRightPage === getRightTotalPages() ? '1px solid #333333' : '1px solid #FF000050',
                    cursor: currentRightPage === getRightTotalPages() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                    transform: 'translateZ(0)',
                    boxShadow: currentRightPage === getRightTotalPages() ? '0 0 4px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)' : '0 0 8px #FF000080, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    fontSize: '16px'
                  }}
                  onClick={() => setCurrentRightPage(prev => Math.min(getRightTotalPages(), prev + 1))}
                  disabled={currentRightPage === getRightTotalPages()}
                  title="下一页"
                  onMouseEnter={(e) => {
                    const button = e.currentTarget;
                    if (!button.disabled) {
                      button.style.transform = 'translateZ(8px) scale(1.05)';
                      button.style.boxShadow = '0 0 12px #FF000080, 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const button = e.currentTarget;
                    if (!button.disabled) {
                      button.style.transform = 'translateZ(0) scale(1)';
                      button.style.boxShadow = '0 0 8px #FF000080, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)';
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
                    backgroundColor: currentRightPage === getRightTotalPages() ? '#1A1A1A' : '#FF000022',
                    color: currentRightPage === getRightTotalPages() ? '#666666' : '#FF0000',
                    border: currentRightPage === getRightTotalPages() ? '1px solid #333333' : '1px solid #FF000050',
                    cursor: currentRightPage === getRightTotalPages() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                    transform: 'translateZ(0)',
                    boxShadow: currentRightPage === getRightTotalPages() ? '0 0 4px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)' : '0 0 8px #FF000080, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    fontSize: '16px'
                  }}
                  onClick={() => setCurrentRightPage(getRightTotalPages())}
                  disabled={currentRightPage === getRightTotalPages()}
                  title="最后一页"
                  onMouseEnter={(e) => {
                    const button = e.currentTarget;
                    if (!button.disabled) {
                      button.style.transform = 'translateZ(8px) scale(1.05)';
                      button.style.boxShadow = '0 0 12px #FF000080, 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const button = e.currentTarget;
                    if (!button.disabled) {
                      button.style.transform = 'translateZ(0) scale(1)';
                      button.style.boxShadow = '0 0 8px #FF000080, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)';
                    }
                  }}
                >
                  <FastForwardOutlined />
                </button>
              </div>
            </div>
          </Card>

          {/* 右侧：今日锻炼结果 */}
          <div style={{ display: 'none' }}>
            <div style={{ 
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(76, 175, 80, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(76, 175, 80, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden',
              backgroundColor: '#1A1A1A',
              border: '1px solid rgba(76, 175, 80, 0.4)',
              backgroundImage: 'linear-gradient(145deg, #252525, #101010)'
            }}>
              <div style={{ 
                backgroundColor: '#2D2D2D', 
                padding: '20px', 
                borderRadius: '20px',
                marginBottom: '20px',
                backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)',
                boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.1), inset 0 -2px 4px rgba(0, 0, 0, 0.3)'
              }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  color: '#FFFFFF',
                  margin: '0 0 20px 0'
                }}>
                  Your Workout Results for Today
                </h3>
                <div style={{ height: '200px' }}>
                  <ReactECharts option={workoutChartOption} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      backgroundColor: '#FFD54F', 
                      borderRadius: '50%',
                      marginRight: '8px'
                    }} />
                    <span style={{ fontSize: '12px', color: '#CCCCCC' }}>Calories eaten</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      backgroundColor: '#FF5722', 
                      borderRadius: '50%',
                      marginRight: '8px'
                    }} />
                    <span style={{ fontSize: '12px', color: '#CCCCCC' }}>Calories burned</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      backgroundColor: '#9E9E9E', 
                      borderRadius: '50%',
                      marginRight: '8px'
                    }} />
                    <span style={{ fontSize: '12px', color: '#CCCCCC' }}>Activity time</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 步数卡片 */}
            <Card 
              style={{ 
                borderRadius: '20px', 
                boxShadow: '0 0 15px rgba(76, 175, 80, 0.15), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 8px rgba(76, 175, 80, 0.08), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(76, 175, 80, 0.2)',
                backgroundColor: '#2D2D2D',
                backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)'
              }}
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF' }}>
                    Steps for Today
                  </span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#4CAF50',
                    padding: 0
                  }}>
                    1107568
                  </span>
                </div>
              }
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: '12px', 
                    color: '#CCCCCC',
                    margin: '0 0 8px 0'
                  }}>
                    Keep your body traveled
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: '#FFFFFF',
                    marginBottom: '8px'
                  }}>
                    {totalPeriods}
                  </div>
                  <p style={{ 
                    fontSize: '12px', 
                    color: '#CCCCCC',
                    margin: 0
                  }}>
                    Total Periods
                  </p>
                </div>
              </div>
            </Card>

            {/* 减肥计划卡片 */}
            <Card 
              style={{ 
                borderRadius: '12px', 
                boxShadow: '0 0 15px rgba(76, 175, 80, 0.15), inset 0 0 8px rgba(76, 175, 80, 0.08)',
                border: '1px solid rgba(76, 175, 80, 0.2)',
                marginTop: '16px',
                backgroundColor: '#2D2D2D'
              }}
              title={
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF' }}>
                  Weight Loss Plan
                </span>
              }
            >
              <div style={{ marginBottom: '16px' }}>
                <Progress 
                  percent={69} 
                  strokeColor="#4CAF50" 
                  size="small"
                  format={() => '69% Completed'}
                  strokeWidth={8}
                  status="active"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '14px', color: '#CCCCCC' }}>34.5 kg</span>
                </div>
                <div style={{ flex: 1, margin: '0 16px' }}>
                  <div style={{ 
                    height: '4px', 
                    backgroundColor: '#333333', 
                    borderRadius: '2px',
                    position: 'relative'
                  }}>
                    <div style={{ 
                      position: 'absolute', 
                      left: '60%', 
                      top: '-8px', 
                      width: '20px', 
                      height: '20px', 
                      backgroundColor: '#4CAF50', 
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{ 
                        width: '8px', 
                        height: '8px', 
                        backgroundColor: '#fff', 
                        borderRadius: '50%'
                      }} />
                    </div>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '14px', color: '#CCCCCC' }}>50 kg</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthMainPage;