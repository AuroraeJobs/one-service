import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'antd';
import { CloudFilled, HeartFilled, FireFilled, CalendarOutlined, ClockCircleOutlined, MessageOutlined } from '@ant-design/icons';
import { useRecordContext } from '../contexts/RecordContext';

const HealthFourthPage: React.FC = () => {
  const { allRecords } = useRecordContext();
  const [visiblePeriods, setVisiblePeriods] = useState(10);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const navigate = useNavigate();
  const listRef = React.useRef<HTMLDivElement>(null);
  
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
  console.log('Total periods:', totalPeriods);
  console.log('Visible periods:', visiblePeriods);
  
  // 提取选中期数的中奖号码
  const getSelectedPeriodNumbers = useMemo(() => {
    if (!allRecords || !selectedCard) {
      return { redNumbers: [] as number[], blueNumber: null as number | null };
    }
    
    let recordsArray: (string | { red: any; blue: any })[] = [];
    if (typeof allRecords === 'string') {
      recordsArray = allRecords
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    } else if (Array.isArray(allRecords)) {
      recordsArray = allRecords;
    }
    
    // 计算目标索引：第n期对应的索引是n-1
    const targetIndex = selectedCard - 1;
    if (targetIndex < 0 || targetIndex >= recordsArray.length) {
      return { redNumbers: [] as number[], blueNumber: null as number | null };
    }
    
    const record = recordsArray[targetIndex];
    if (typeof record === 'string') {
      // 解析固定长度格式：前12位是6个红球号码（每个2位），最后2位是1个蓝球号码
      if (record.length >= 14) {
        // 提取红球号码（前12位，每2位一个号码）
        const redNumbers = [];
        for (let i = 0; i < 12; i += 2) {
          const numStr = record.substring(i, i + 2);
          const num = parseInt(numStr);
          if (!isNaN(num) && num >= 1 && num <= 33) {
            redNumbers.push(num);
          }
        }
        
        // 提取蓝球号码（最后2位）
        const blueStr = record.substring(12, 14);
        const blueNum = parseInt(blueStr);
        if (!isNaN(blueNum) && blueNum >= 1 && blueNum <= 16) {
          return { redNumbers, blueNumber: blueNum };
        }
      }
    } else if (typeof record === 'object' && record !== null) {
      // 对象格式的记录
      if ('red' in record && 'blue' in record) {
        const redNumbers = record.red
          .toString()
          .split(/[,\s]+/)
          .map((num: string) => parseInt(num))
          .filter((num: number) => !isNaN(num) && num >= 1 && num <= 33);
        
        const blueNumbers = record.blue
          .toString()
          .split(/[,\s]+/)
          .map((num: string) => parseInt(num))
          .filter((num: number) => !isNaN(num) && num >= 1 && num <= 16);
        
        return { redNumbers, blueNumber: blueNumbers[0] || null };
      }
    }
    
    return { redNumbers: [] as number[], blueNumber: null as number | null };
  }, [allRecords, selectedCard]);

  // 统计红球和蓝球号码出现次数
  const { redBallCounts, blueBallCounts } = useMemo(() => {
    const redCounts = new Map<number, number>();
    const blueCounts = new Map<number, number>();
    
    // 初始化所有红球和蓝球的计数为0
    for (let i = 1; i <= 33; i++) {
      redCounts.set(i, 0);
    }
    for (let i = 1; i <= 16; i++) {
      blueCounts.set(i, 0);
    }
    
    // 解析数据并统计
    if (allRecords) {
      let recordsArray: (string | { red: any; blue: any })[] = [];
      
      if (typeof allRecords === 'string') {
        recordsArray = allRecords
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
      } else if (Array.isArray(allRecords)) {
        recordsArray = allRecords;
      }
      
      // 确定计算范围：从第一期到选中卡片的一期
      // 注意：卡片是倒序显示的，但selectedCard存储的就是真实的期数
      const targetPeriod = selectedCard || totalPeriods;
      const startIndex = 0;
      // 计算结束索引：
      // - 由于recordsArray是正序存储的，索引0对应第一期
      // - 所以第n期对应的索引是n-1
      const endIndex = targetPeriod - 1;
      
      // 统计每个号码的出现次数
      recordsArray.slice(startIndex, endIndex + 1).forEach(record => {
        if (typeof record === 'string') {
          // 解析固定长度格式：前12位是6个红球号码（每个2位），最后2位是1个蓝球号码
          if (record.length >= 14) {
            // 提取红球号码（前12位，每2位一个号码）
            const redNumbers = [];
            for (let i = 0; i < 12; i += 2) {
              const numStr = record.substring(i, i + 2);
              const num = parseInt(numStr);
              if (!isNaN(num) && num >= 1 && num <= 33) {
                redNumbers.push(num);
              }
            }
            // 统计红球号码
            redNumbers.forEach((num: number) => {
              redCounts.set(num, (redCounts.get(num) || 0) + 1);
            });
            
            // 提取蓝球号码（最后2位）
            const blueStr = record.substring(12, 14);
            const blueNum = parseInt(blueStr);
            if (!isNaN(blueNum) && blueNum >= 1 && blueNum <= 16) {
              blueCounts.set(blueNum, (blueCounts.get(blueNum) || 0) + 1);
            }
          }
        } else if (typeof record === 'object' && record !== null) {
          // 对象格式的记录
          if ('red' in record) {
            const redNumbers = record.red
              .toString()
              .split(/[,\s]+/)
              .map((num: string) => parseInt(num))
              .filter((num: number) => !isNaN(num) && num >= 1 && num <= 33);
            redNumbers.forEach((num: number) => {
              redCounts.set(num, (redCounts.get(num) || 0) + 1);
            });
          }
          
          if ('blue' in record) {
            const blueNumbers = record.blue
              .toString()
              .split(/[,\s]+/)
              .map((num: string) => parseInt(num))
              .filter((num: number) => !isNaN(num) && num >= 1 && num <= 16);
            blueNumbers.forEach((num: number) => {
              blueCounts.set(num, (blueCounts.get(num) || 0) + 1);
            });
          }
        }
      });
    }
    
    return { redBallCounts: redCounts, blueBallCounts: blueCounts };
  }, [allRecords, selectedCard, totalPeriods]);
  


  // 滚动加载更多数据
  React.useEffect(() => {
    const listElement = listRef.current;
    if (!listElement) return;
    
    let isLoading = false;
    
    const handleScroll = () => {
      if (isLoading) return;
      if (visiblePeriods >= totalPeriods) return;
      
      const { scrollTop, scrollHeight, clientHeight } = listElement;
      
      // 计算距离底部的距离
      const distanceToBottom = scrollHeight - scrollTop - clientHeight;
      
      // 当滚动到距离底部10px时加载更多
      // 确保distanceToBottom是正数，避免内容不足时误触发
      if (distanceToBottom < 10 && distanceToBottom >= 0) {
        isLoading = true;
        // 延迟加载，避免频繁触发
        setTimeout(() => {
          setVisiblePeriods(prev => Math.min(prev + 10, totalPeriods));
          isLoading = false;
        }, 500);
      }
    };

    listElement.addEventListener('scroll', handleScroll);

    return () => {
      listElement.removeEventListener('scroll', handleScroll);
    };
  }, [visiblePeriods, totalPeriods]);

  return (
    <div className="health-fourth-page" style={{ 
      minHeight: 'calc(100vh - 64px)', 
      backgroundColor: '#000000',
      color: '#FFFFFF',
      display: 'flex'
    }}>
      {/* 主要内容区域 */}
      <div style={{ flex: 1, padding: '20px', marginBottom: '80px' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#1890ff',
            textShadow: '0 0 20px rgba(24, 144, 255, 0.5)'
          }}>
            定风波・莫听穿林打叶声
          </h1>
          <p style={{ 
            fontSize: '16px', 
            color: '#CCCCCC',
            marginTop: '8px'
          }}>
            回首向来萧瑟处，也无风雨也无晴
          </p>
        </div>



        {/* 时间趋势分析卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '24px' }}>
          <Card 
            style={{ 
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(24, 144, 255, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(24, 144, 255, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid transparent',
              backgroundColor: '#1A1A1A',
              backgroundImage: 'linear-gradient(145deg, #252525, #101010)',
              padding: '24px'
            }}

          >
            <div style={{ display: 'flex', gap: '24px', height: '550px' }}>
              {/* 左侧：时间管理建议 */}
              <div style={{ flex: 0.7 }}>

                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div ref={listRef} className="scrollbar-hide" style={{ flex: 1, padding: '0 24px', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {/* 隐藏滚动条和动画定义 */}
                    <style>{`
                      .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                      }
                      @keyframes glow {
                        0% {
                          opacity: 0;
                          transform: rotate(45deg) translateX(-50%) translateY(-50%);
                        }
                        50% {
                          opacity: 0.1;
                        }
                        100% {
                          opacity: 0;
                          transform: rotate(45deg) translateX(50%) translateY(50%);
                        }
                      }
                    `}</style>
                    {totalPeriods === 0 ? (
                      <div style={{ 
                        padding: '24px', 
                        textAlign: 'center',
                        color: '#CCCCCC',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        暂无记录
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {Array.from({ length: Math.min(totalPeriods, visiblePeriods) }, (_, index) => {
                          const periodNumber = totalPeriods - index;
                          const tianGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
                          const diZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
                          const tianGanIndex = (periodNumber - 1) % 10;
                          const diZhiIndex = (periodNumber - 1) % 12;
                          const tianGanDiZhi = tianGan[tianGanIndex] + diZhi[diZhiIndex];
                          const colors = ['#1890ff', '#4CAF50', '#FF9800', '#9C27B0', '#FF5722', '#2196F3', '#8BC34A', '#FFC107', '#E91E63', '#673AB7'];
                          const colorIndex = (periodNumber - 1) % colors.length;
                          const color = colors[colorIndex];
                          const isSelected = selectedCard === periodNumber;
                          return (
                            <div key={periodNumber} 
                              style={{ 
                                padding: '24px', 
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                borderBottom: '1px solid rgba(0, 0, 0, 0.3)',
                                backgroundColor: '#1A1A1A',
                                backgroundImage: `linear-gradient(145deg, rgba(30, 30, 30, 0.9), rgba(10, 10, 10, 0.9)), radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.05), transparent 50%)${isSelected ? `, radial-gradient(circle at 100% 100%, ${color}40, transparent 70%)` : ''}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease, background-position 0.3s ease',
                                cursor: 'pointer',
                                transformStyle: 'preserve-3d',
                                perspective: '1000px',
                                boxShadow: isSelected 
                                  ? `0 12px 32px rgba(0, 0, 0, 0.8), 0 6px 20px rgba(0, 0, 0, 0.6), 0 0 30px ${color}80, inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.6)` 
                                  : '0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                                position: 'relative',
                                overflow: 'hidden'
                              }} 
                              onClick={() => setSelectedCard(isSelected ? null : periodNumber)}
                              onMouseEnter={(e) => {
                                const card = e.currentTarget;
                                card.style.transform = 'translateZ(12px) scale(1.02) translateY(-2px)';
                                card.style.boxShadow = `0 8px 24px rgba(0, 0, 0, 0.6), 0 4px 16px rgba(0, 0, 0, 0.4), 0 0 20px ${color}30, inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.4)`;
                              }} 
                              onMouseLeave={(e) => {
                                const card = e.currentTarget;
                                card.style.transform = 'translateZ(0) scale(1) translateY(0)';
                                card.style.boxShadow = isSelected 
                                  ? `0 12px 32px rgba(0, 0, 0, 0.8), 0 6px 20px rgba(0, 0, 0, 0.6), 0 0 30px ${color}80, inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.6)` 
                                  : '0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3)';
                              }}
                            >
                              <div style={{ 
                                width: '60px', 
                                height: '60px', 
                                borderRadius: '50%', 
                                backgroundColor: 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: color,
                                fontWeight: 'bold',
                                fontSize: '18px',
                                boxShadow: `0 0 12px ${color}80, inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                                border: `1px solid ${color}50`
                              }}>
                                {periodNumber}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: color }}>{tianGanDiZhi}</div>
                              </div>

                            </div>
                          );
                        })}
                        {/* 加载提示 */}
                        {totalPeriods > 0 && visiblePeriods < totalPeriods && (
                          <div style={{ 
                            padding: '16px', 
                            textAlign: 'center',
                            color: '#1890ff'
                          }}>
                            ...
                          </div>
                        )}
                        {/* 加载完成提示 */}
                        {totalPeriods > 0 && visiblePeriods >= totalPeriods && (
                          <div style={{ 
                            padding: '16px', 
                            textAlign: 'center',
                            color: '#4CAF50'
                          }}>
                            已加载全部记录
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  

                </div>
              </div>

              {/* 右侧：中奖号码卡片展示 */}
              <div style={{ flex: 4, display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
                {/* 中奖号码展示区域 */}
                <div style={{ flex: 1, padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {selectedCard ? (
                    <>
                      {/* 红球和蓝球号码卡片（同一行） */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' }}>
                          {/* 红球号码 */}
                          {getSelectedPeriodNumbers.redNumbers.map((num: number, index: number) => {
                            const color = '#ff4d4f'; // 固定使用红色
                            
                            return (
                              <div key={index} 
                                style={{
                                  padding: '24px',
                                  borderRadius: '12px',
                                  border: '1px solid rgba(255, 255, 255, 0.05)',
                                  borderBottom: '1px solid rgba(0, 0, 0, 0.3)',
                                  backgroundColor: '#1A1A1A',
                                  backgroundImage: `linear-gradient(145deg, rgba(30, 30, 30, 0.9), rgba(10, 10, 10, 0.9)), radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.05), transparent 50%), radial-gradient(circle at 100% 100%, ${color}40, transparent 70%)`,
                                  textAlign: 'center',
                                  transition: 'transform 0.3s ease, box-shadow 0.3s ease, backgroundPosition 0.3s ease',
                                  cursor: 'pointer',
                                  transformStyle: 'preserve-3d',
                                  perspective: '1000px',
                                  boxShadow: `0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 20px ${color}30, inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3)`,
                                  position: 'relative',
                                  overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                  const card = e.currentTarget;
                                  card.style.transform = 'translateZ(12px) scale(1.02) translateY(-2px)';
                                  card.style.boxShadow = `0 8px 24px rgba(0, 0, 0, 0.6), 0 4px 16px rgba(0, 0, 0, 0.4), 0 0 30px ${color}80, inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.4)`;
                                }}
                                onMouseLeave={(e) => {
                                  const card = e.currentTarget;
                                  card.style.transform = 'translateZ(0) scale(1) translateY(0)';
                                  card.style.boxShadow = `0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 20px ${color}30, inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3)`;
                                }}
                              >
                                {/* 发光效果 */}
                                <div style={{
                                  position: 'absolute',
                                  top: '-50%',
                                  left: '-50%',
                                  width: '200%',
                                  height: '200%',
                                  backgroundColor: 'rgba(255, 51, 51, 0.1)',
                                  transform: 'rotate(45deg)',
                                  animation: 'glow 3s ease-in-out infinite',
                                  opacity: 0
                                }} />
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                  {/* 上方：号码头像 */}
                                  <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    backgroundColor: '#2a2a2a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: color,
                                    fontSize: '20px',
                                    fontWeight: 'bold',
                                    boxShadow: `0 0 12px ${color}80, inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                                    border: `1px solid ${color}50`
                                  }}>
                                    {num}
                                  </div>
                                  {/* 下方：次数数据 */}
                                  <div style={{ 
                                    fontSize: '14px', 
                                    color: color,
                                    opacity: 0.8,
                                    textAlign: 'center'
                                  }}>
                                    {redBallCounts.get(num) || 0}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* 蓝球号码 */}
                          {getSelectedPeriodNumbers.blueNumber !== null && (
                            <div 
                              key="blue"
                              style={{
                                padding: '24px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                borderBottom: '1px solid rgba(0, 0, 0, 0.3)',
                                backgroundColor: '#1A1A1A',
                                backgroundImage: `linear-gradient(145deg, rgba(30, 30, 30, 0.9), rgba(10, 10, 10, 0.9)), radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.05), transparent 50%), radial-gradient(circle at 100% 100%, #1890ff40, transparent 70%)`,
                                textAlign: 'center',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease, backgroundPosition 0.3s ease',
                                cursor: 'pointer',
                                transformStyle: 'preserve-3d',
                                perspective: '1000px',
                                boxShadow: `0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 20px #1890ff30, inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3)`,
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                              onMouseEnter={(e) => {
                                const card = e.currentTarget;
                                card.style.transform = 'translateZ(12px) scale(1.02) translateY(-2px)';
                                card.style.boxShadow = `0 8px 24px rgba(0, 0, 0, 0.6), 0 4px 16px rgba(0, 0, 0, 0.4), 0 0 30px #1890ff80, inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.4)`;
                              }}
                              onMouseLeave={(e) => {
                                const card = e.currentTarget;
                                card.style.transform = 'translateZ(0) scale(1) translateY(0)';
                                card.style.boxShadow = `0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 20px #1890ff30, inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3)`;
                              }}
                            >
                              {/* 发光效果 */}
                              <div style={{
                                position: 'absolute',
                                top: '-50%',
                                left: '-50%',
                                width: '200%',
                                height: '200%',
                                backgroundColor: 'rgba(24, 144, 255, 0.1)',
                                transform: 'rotate(45deg)',
                                animation: 'glow 3s ease-in-out infinite',
                                opacity: 0
                              }} />
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                {/* 上方：号码头像 */}
                                <div style={{
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '50%',
                                  backgroundColor: '#2a2a2a',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#1890ff',
                                  fontSize: '20px',
                                  fontWeight: 'bold',
                                  boxShadow: `0 0 12px #1890ff80, inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                                  border: `1px solid #1890ff50`
                                }}>
                                  {getSelectedPeriodNumbers.blueNumber}
                                </div>
                                {/* 下方：次数数据 */}
                                <div style={{ 
                                  fontSize: '14px', 
                                  color: '#1890ff',
                                  opacity: 0.8,
                                  textAlign: 'center'
                                }}>
                                  {blueBallCounts.get(getSelectedPeriodNumbers.blueNumber!) || 0}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ 
                      flex: 1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#CCCCCC',
                      fontSize: '18px'
                    }}>
                      请选择一期查看中奖号码
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>


      </div>
      
      {/* 页脚 */}
      <footer className="app-footer" style={{ 
        textAlign: 'center', 
        position: 'fixed', 
        bottom: 0, 
        left: '50%', 
        transform: 'translateX(-50%)',
        height: '64px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backgroundImage: 'linear-gradient(145deg, rgba(30, 30, 30, 0.9), rgba(0, 0, 0, 0.9))',
        color: '#e2e8f0',
        zIndex: 1000,
        padding: '0 20px',
        boxSizing: 'border-box',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.3)'
      }}>
        {/* 图标 - 点击回到首页 */}
        <CloudFilled 
          style={{ fontSize: '24px', color: '#e2e8f0', cursor: 'pointer', marginRight: '20px' }} 
        />
        {/* 功能菜单 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '12px'
        }}>
          <div 
            style={{ 
              fontSize: '14px', 
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              userSelect: 'none'
            }}
            onClick={() => navigate('/health')}
          >
            <HeartFilled style={{ color: '#4CAF50', transition: 'color 0.3s ease' }} /> 立春
          </div>
          <div 
            style={{ 
              fontSize: '14px', 
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              userSelect: 'none'
            }}
            onClick={() => navigate('/hexagram')}
          >
            <FireFilled style={{ color: '#FF0000', transition: 'color 0.3s ease' }} /> 立夏
          </div>
          <div 
            style={{ 
              fontSize: '14px', 
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              userSelect: 'none'
            }}
            onClick={() => navigate('/health/third')}
          >
            <CalendarOutlined style={{ color: '#9C27B0', transition: 'color 0.3s ease' }} /> 立秋
          </div>
          <div 
            style={{ 
              fontSize: '14px', 
              color: '#1890ff',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              userSelect: 'none'
            }}
            onClick={() => navigate('/health/fourth')}
          >
            <ClockCircleOutlined style={{ color: '#FFEB3B', transition: 'color 0.3s ease' }} /> 立冬
          </div>
          <div 
            style={{ 
              fontSize: '14px', 
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              userSelect: 'none'
            }}
            onClick={() => navigate('/health/spring-equinox')}
          >
            <MessageOutlined style={{ color: '#4CAF50', transition: 'color 0.3s ease' }} /> 春分
          </div>
          <div 
            style={{ 
              fontSize: '14px', 
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              userSelect: 'none'
            }}
            onClick={() => navigate('/health/summer-solstice')}
          >
            <FireFilled style={{ color: '#FF9800', transition: 'color 0.3s ease' }} /> 夏至
          </div>
          <div 
            style={{ 
              fontSize: '14px', 
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              userSelect: 'none'
            }}
            onClick={() => navigate('/health/autumn-equinox')}
          >
            <CalendarOutlined style={{ color: '#FF5722', transition: 'color 0.3s ease' }} /> 秋分
          </div>
          <div 
            style={{ 
              fontSize: '14px', 
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              userSelect: 'none'
            }}
            onClick={() => navigate('/health/winter-solstice')}
          >
            <ClockCircleOutlined style={{ color: '#2196F3', transition: 'color 0.3s ease' }} /> 冬至
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HealthFourthPage;