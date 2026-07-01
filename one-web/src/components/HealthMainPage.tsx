import React, { useState, useMemo, useEffect } from 'react';
import { Card, Progress, Input, Button, message as antMessage } from 'antd';
import { FastForwardOutlined, StepForwardOutlined, StepBackwardOutlined, FastBackwardOutlined, MessageOutlined, SendOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { RED_BALL_COMBINATION_COLORS, RED_BALL_CHARACTER_MAP } from '../constants/colors';
import { useRecordContext } from '../contexts/RecordContext';
import { periodToGanZhi } from '../constants/heavenlyStemsEarthlyBranches';
import { HEXAGRAMS } from '../constants/hexagrams';
import { aiApi } from '../services/api';
import './HealthMainPage.css';

// 格式化聊天消息，处理强调格式
const formatMessage = (content: string): React.ReactNode => {
  if (!content) return null;
  
  // 处理换行符
  const lines = content.split('\n');
  
  return lines.map((line, lineIndex) => {
    if (!line.trim()) return <br key={lineIndex} />;
    
    // 处理粗体和斜体
    let formattedLine = line
      // 粗体：**文本**
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // 粗体：__文本__
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // 斜体：*文本*
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // 斜体：_文本_
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // 代码：`文本`
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // 处理列表
      .replace(/^\s*\*\s+(.*)$/g, '<li style="margin-left: 20px;">$1</li>')
      .replace(/^\s*\d+\.\s+(.*)$/g, '<li style="margin-left: 20px;">$1</li>');
    
    // 检查是否包含列表项
    if (formattedLine.includes('<li>')) {
      formattedLine = `<ul style="margin: 8px 0;">${formattedLine}</ul>`;
    }
    
    return (
      <div key={lineIndex} dangerouslySetInnerHTML={{ __html: formattedLine }} />
    );
  });
};

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
  const { allRecords, loading } = useRecordContext();
  const [currentRightPage, setCurrentRightPage] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null);
  const [showFullPage, setShowFullPage] = useState(false);
  // 聊天功能相关状态
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const [models, setModels] = useState<any[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('local:qwen3:8b');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  
  // 拖动功能相关状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [chatPosition, setChatPosition] = useState({ bottom: 30, right: 30 });
  
  // 当聊天窗口打开时，获取模型列表
  useEffect(() => {
    const fetchModels = async () => {
      if (showChat) {
        setModelsLoading(true);
        try {
          const modelList = await aiApi.getModelList();
          setModels(modelList);
        } catch (error) {
          console.error('获取模型列表失败:', error);
          antMessage.error('获取模型列表失败');
        } finally {
          setModelsLoading(false);
        }
      }
    };
    
    fetchModels();
  }, [showChat]);
  
  // 处理发送消息
  const handleSendMessage = async () => {
    if (!chatInput.trim()) {
      antMessage.warning('请输入消息内容');
      return;
    }
    
    // 添加用户消息到聊天记录
    const newUserMessage = { role: 'user' as const, content: chatInput };
    setChatMessages(prev => [...prev, newUserMessage]);
    setChatInput('');
    setChatLoading(true);
    
    try {
      // 调用AI模型获取回复
      const response = await aiApi.chat(chatInput, selectedModel);
      // 添加AI回复到聊天记录
      const newAiMessage = { role: 'assistant' as const, content: response };
      setChatMessages(prev => [...prev, newAiMessage]);
    } catch (error) {
      console.error('发送消息失败:', error);
      antMessage.error('发送消息失败，请稍后重试');
      // 添加错误消息到聊天记录
      const errorMessage = { role: 'assistant' as const, content: '抱歉，我暂时无法回答你的问题，请稍后重试。' };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };
  
  // 清空聊天记录（预留功能）
  // const handleClearChat = () => {
  //   setChatMessages([]);
  // };
  
  // 处理消息展开/收起
  const toggleMessageExpansion = (index: number) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };
  
  // 拖动功能事件处理函数
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setChatPosition(prev => ({
      bottom: prev.bottom - deltaY,
      right: prev.right - deltaX
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // 计算总期数
  const totalPeriods = useMemo(() => {
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
  }, [allRecords]);
  




  // 获取右侧分页的总页数
  const getRightTotalPages = useMemo(() => {
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
    
    return Math.max(1, Math.ceil(recordsArray.length / 3));
  }, [allRecords]);
  
  // 为了保持函数调用的一致性，创建一个函数版本
  const getRightTotalPagesFunc = () => getRightTotalPages;
  
  // 获取指定页的八期红球奇偶组合记录，包含到每期为止的累计次数
  const lastEightPeriods = useMemo(() => {
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
      
      // 先更新累计次数（当前期的号码计入本期的累计次数）
      for (let i = 0; i < 12; i += 2) {
        const ballStr = redBalls.slice(i, i + 2);
        cumulativeRedCounts[ballStr]++;
      }
      
      // 更新蓝球累计次数
      cumulativeBlueCounts[blueBall]++;
      
      // 创建当期的累计次数副本（使用更新后的值）
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
    
    // 计算分页逻辑，每页3期，最新的在前
    const pageSize = 3;
    const startIndex = allPeriodsWithCounts.length - (currentRightPage * pageSize);
    const endIndex = allPeriodsWithCounts.length - ((currentRightPage - 1) * pageSize);
    
    let pagePeriods = [];
    if (startIndex < 0) {
      pagePeriods = allPeriodsWithCounts.slice(0, endIndex).reverse();
    } else {
      pagePeriods = allPeriodsWithCounts.slice(startIndex, endIndex).reverse();
    }
    
    return pagePeriods;
  }, [allRecords, currentRightPage]);
  
  // 计算红球33个号码的累计出现次数
  const redBallCounts = useMemo(() => {
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
    
    // 初始化所有红球号码（01-33）的计数为0
    const redCounts: { [key: string]: number } = {};
    for (let i = 1; i <= 33; i++) {
      const ballStr = i.toString().padStart(2, '0');
      redCounts[ballStr] = 0;
    }
    
    // 计算每个红球号码的出现次数
    recordsArray.forEach(record => {
      const redBalls = record.slice(0, 12);
      for (let i = 0; i < 12; i += 2) {
        const ballStr = redBalls.slice(i, i + 2);
        redCounts[ballStr]++;
      }
    });
    
    return redCounts;
  }, [allRecords]);
  
  // 计算蓝球16个号码的累计出现次数
  const blueBallCounts = useMemo(() => {
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
    
    // 初始化所有蓝球号码（01-16）的计数为0
    const blueCounts: { [key: string]: number } = {};
    for (let i = 1; i <= 16; i++) {
      const ballStr = i.toString().padStart(2, '0');
      blueCounts[ballStr] = 0;
    }
    
    // 计算每个蓝球号码的出现次数
    recordsArray.forEach(record => {
      const blueBall = record.slice(12, 14);
      blueCounts[blueBall]++;
    });
    
    return blueCounts;
  }, [allRecords]);
  
  return (
    <div className="themed-route-page health-main-page health-spring-page" style={{
        minHeight: '100vh', 
        backgroundColor: '#000000',
        color: '#FFFFFF',
        display: 'flex'
      }}>
        {/* 主要内容区域 */}
        <div className="health-spring-content" style={{ flex: 1, padding: '20px 30px', position: 'relative' }}>
          {/* 聊天按钮 - 固定在右下角 */}
          <div 
            style={{
              position: 'fixed',
              bottom: `${chatPosition.bottom}px`,
              right: `${chatPosition.right}px`,
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '12px',
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {showChat ? (
              <div 
                style={{
                  width: '450px',
                  height: 'calc(100vh - 120px)',
                  maxHeight: 'none',
                  borderRadius: '20px',
                  boxShadow: '0 0 20px rgba(24, 144, 255, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(24, 144, 255, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
                  border: 'none',
                  backgroundColor: '#2D2D2D',
                  backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                {/* 聊天窗口头部 */}
                <div 
                  style={{
                    padding: '16px',
                    backgroundColor: '#2D2D2D',
                    backgroundImage: 'linear-gradient(145deg, #323232, #252525)',
                    borderBottom: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  onDoubleClick={() => setShowChat(false)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageOutlined style={{ color: '#1890ff' }} />
                    <span style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Hello AI</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {/* 模型选择下拉菜单 */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setShowModelDropdown(!showModelDropdown)}
                        style={{
                          backgroundColor: '#3D3D3D',
                          border: '1px solid rgba(24, 144, 255, 0.3)',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {selectedModel}
                        <span style={{ fontSize: '10px' }}>▼</span>
                      </button>
                      {showModelDropdown && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '4px',
                            backgroundColor: '#3D3D3D',
                            border: '1px solid rgba(24, 144, 255, 0.3)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                            zIndex: 1001,
                            minWidth: '180px',
                            maxHeight: '200px',
                            overflowY: 'auto'
                          }}
                        >
                          {modelsLoading ? (
                            <div style={{ padding: '12px', textAlign: 'center', color: '#CCCCCC', fontSize: '12px' }}>
                              加载中...
                            </div>
                          ) : models.length === 0 ? (
                            <div style={{ padding: '12px', textAlign: 'center', color: '#CCCCCC', fontSize: '12px' }}>
                              暂无可用模型
                            </div>
                          ) : (
                            models.map((model) => (
                              <div
                                key={model.id || model.name}
                                onClick={() => {
                                  setSelectedModel(model.id || model.name);
                                  setShowModelDropdown(false);
                                }}
                                style={{
                                  padding: '10px 12px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid rgba(24, 144, 255, 0.1)',
                                  fontSize: '12px',
                                  color: (model.id || model.name) === selectedModel ? '#1890ff' : '#FFFFFF',
                                  backgroundColor: (model.id || model.name) === selectedModel ? 'rgba(24, 144, 255, 0.1)' : 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'rgba(24, 144, 255, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = (model.id || model.name) === selectedModel ? 'rgba(24, 144, 255, 0.1)' : 'transparent';
                                }}
                              >
                                <div style={{ fontWeight: 'bold' }}>{model.name}</div>
                                {model.details && model.details.parameter_size && (
                                  <div style={{ fontSize: '10px', color: '#999999', marginTop: '2px' }}>
                                    {model.details.parameter_size}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 聊天消息区域 */}
                <div 
                  style={{
                    flex: 1,
                    padding: '16px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  {chatMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#999999', padding: '20px 0' }}>
                      <p>欢迎使用 Hello AI</p>
                      <p style={{ fontSize: '12px' }}>您可以询问任何问题，我会尽力为您解答</p>
                    </div>
                  ) : (
                    chatMessages.map((message, index) => {
                      const isExpanded = expandedMessages.has(index);
                      const content = message.content;
                      const isLongMessage = content.length > 200;
                      const displayContent = isExpanded || !isLongMessage ? content : content.substring(0, 200) + '...';
                      
                      // 复制消息内容
                      const handleCopyMessage = async () => {
                        try {
                          await navigator.clipboard.writeText(message.content);
                          antMessage.success('复制成功');
                        } catch (error) {
                          console.error('复制失败:', error);
                          antMessage.error('复制失败，请手动复制');
                        }
                      };
                      
                      return (
                        <div 
                          key={index} 
                          style={{
                            alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '80%'
                          }}
                        >
                          <div 
                            style={{
                              padding: '12px 16px',
                              borderRadius: message.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              backgroundColor: message.role === 'user' ? '#4CAF50' : '#2D2D2D',
                            backgroundImage: message.role === 'user' ? 'linear-gradient(145deg, #43a047, #388e3c)' : 'linear-gradient(145deg, #323232, #252525)',
                            color: message.role === 'user' ? '#FFFFFF' : '#E0E0E0',
                            boxShadow: message.role === 'user' ? '0 4px 12px rgba(76, 175, 80, 0.4), 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.4), 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.1), inset 0 -2px 4px rgba(0, 0, 0, 0.3)',
                            border: message.role === 'user' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(24, 144, 255, 0.1)',
                              lineHeight: '1.5',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              transform: 'translateZ(0)',
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                            }}
                          >
                            {formatMessage(displayContent)}
                            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              {isLongMessage && (
                                <button
                                  onClick={() => toggleMessageExpansion(index)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: message.role === 'user' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(24, 144, 255, 0.8)',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    transition: 'background-color 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = message.role === 'user' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(24, 144, 255, 0.1)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  {isExpanded ? '收起' : '显示更多'}
                                </button>
                              )}
                              <button
                                onClick={handleCopyMessage}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: message.role === 'user' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(24, 144, 255, 0.8)',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  transition: 'background-color 0.2s ease',
                                  marginLeft: isLongMessage ? '8px' : '0'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = message.role === 'user' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(24, 144, 255, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                复制
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {chatLoading && (
                    <div style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
                      <div 
                        style={{
                          padding: '12px 16px',
                          borderRadius: '16px 16px 16px 4px',
                          backgroundColor: '#2D2D2D',
                          backgroundImage: 'linear-gradient(145deg, #323232, #252525)',
                          color: '#E0E0E0',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.1), inset 0 -2px 4px rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(24, 144, 255, 0.1)',
                          transform: 'translateZ(0)',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                        }}
                      >
                        思考中...
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 聊天输入区域 */}
                <div 
                  style={{
                    padding: '16px',
                    backgroundColor: '#2D2D2D',
                    backgroundImage: 'linear-gradient(145deg, #323232, #252525)',
                    borderTop: 'none',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-end'
                  }}
                >
                  <Input 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="输入消息..."
                    style={{
                      backgroundColor: '#3D3D3D',
                      border: '1px solid rgba(24, 144, 255, 0.3)',
                      borderRadius: '12px',
                      color: '#FFFFFF',
                      flex: 1
                    }}
                    disabled={chatLoading}
                  />
                  <Button 
                    type="primary" 
                    icon={<SendOutlined />} 
                    onClick={handleSendMessage}
                    loading={chatLoading}
                    disabled={chatLoading || !chatInput.trim()}
                    style={{
                      borderRadius: '12px',
                      backgroundColor: '#4CAF50',
                      borderColor: '#4CAF50'
                    }}
                  >
                    发送
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                type="text" 
                shape="circle" 
                icon={<MessageOutlined />} 
                onClick={() => setShowChat(true)}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  borderColor: 'transparent',
                  boxShadow: '0 4px 12px rgba(24, 144, 255, 0.4), 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.2)',
                  fontSize: '20px',
                  color: '#1890ff',
                  transform: 'translateZ(0)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  const button = e.currentTarget;
                  button.style.transform = 'translateZ(6px) scale(1.05)';
                  button.style.boxShadow = '0 6px 16px rgba(24, 144, 255, 0.5), 0 10px 24px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  const button = e.currentTarget;
                  button.style.transform = 'translateZ(0) scale(1)';
                  button.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.4), 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.2)';
                }}
              />
            )}
          </div>

        {/* 今日锻炼结果卡片 */}
        <div className="health-spring-chart-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
          {/* 红球33个号码累计出现次数柱状图 */}
          <div className="health-spring-panel health-spring-chart-panel" style={{
            position: 'relative',
            padding: '20px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(255, 51, 51, 0.15) 0%, rgba(139, 0, 0, 0.15) 50%, rgba(75, 0, 0, 0.15) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 51, 51, 0.3)',
            boxShadow: '0 8px 32px rgba(255, 51, 51, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
            height: '320px',
            overflow: 'hidden'
          }}>
            {/* 科技感网格背景 */}
            <div className="health-spring-decor" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                linear-gradient(rgba(255, 51, 51, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 51, 51, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              pointerEvents: 'none',
              opacity: 0.5
            }} />
            
            {/* 顶部装饰线 */}
            <div className="health-spring-decor" style={{
              position: 'absolute',
              top: 0,
              left: '20px',
              right: '20px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, rgba(255, 51, 51, 0.8), transparent)',
              boxShadow: '0 0 20px rgba(255, 51, 51, 0.5)'
            }} />
            
            {/* 顶部打光效果 */}
            <div className="health-spring-decor" style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60%',
              height: '60px',
              background: 'linear-gradient(to bottom, rgba(255, 100, 100, 0.3), transparent)',
              pointerEvents: 'none',
              filter: 'blur(15px)'
            }} />
            
            {/* 底部打光效果 */}
            <div className="health-spring-decor" style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60%',
              height: '60px',
              background: 'linear-gradient(to top, rgba(255, 100, 100, 0.3), transparent)',
              pointerEvents: 'none',
              filter: 'blur(15px)'
            }} />
            
            {/* 标题 */}
            <div style={{
              position: 'relative',
              zIndex: 1,
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#FF3333',
              textShadow: '0 0 20px rgba(255, 51, 51, 0.5)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              textAlign: 'center'
            }}>
              大观园热力图
            </div>
            
            {loading ? (
              <div style={{
                height: '240px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#FF3333'
              }}>
                加载中...
              </div>
            ) : (
              <ReactECharts 
                option={{
                  backgroundColor: 'transparent',
                  tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(30, 30, 30, 0.95)',
                    borderColor: 'rgba(255, 51, 51, 0.5)',
                    borderWidth: 1,
                    textStyle: { color: '#fff' },
                    axisPointer: {
                      type: 'shadow',
                      shadowStyle: {
                        color: 'rgba(255, 51, 51, 0.1)'
                      }
                    },
                    formatter: function(params: any) {
                      const ballName = RED_BALL_CHARACTER_MAP[params[0].name] || params[0].name;
                      return `<div style="padding: 8px;">
                              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <div style="color: #FF3333; font-weight: bold;">${ballName}</div>
                                <div style="color: #AAAAAA;">${params[0].name}</div>
                              </div>
                              <div style="text-align: center; font-size: 16px; color: #FF3333; font-weight: bold;">${params[0].value}次</div>
                            </div>`;
                    }
                  },
                  grid: {
                    left: '3%',
                    right: '4%',
                    top: '10%',
                    bottom: '8%',
                    containLabel: true
                  },
                  xAxis: {
                    type: 'category',
                    data: Object.entries(redBallCounts).sort((a, b) => b[1] - a[1]).map(([key]) => key),
                    axisLabel: {
                      color: 'rgba(255, 80, 80, 0.9)',
                      fontSize: 9,
                      rotate: 45,
                      fontWeight: 'bold'
                    },
                    axisLine: {
                      lineStyle: {
                        color: 'rgba(255, 60, 60, 0.5)'
                      }
                    },
                    splitLine: {
                      show: false
                    }
                  },
                  yAxis: {
                    type: 'value',
                    axisLabel: {
                      color: 'rgba(255, 80, 80, 0.9)',
                      fontSize: 10,
                      fontWeight: 'bold'
                    },
                    axisLine: {
                      lineStyle: {
                        color: 'rgba(255, 60, 60, 0.5)'
                      }
                    },
                    splitLine: {
                      lineStyle: {
                        color: 'rgba(255, 60, 60, 0.15)'
                      }
                    }
                  },
                  series: [
                    {
                      data: Object.entries(redBallCounts).sort((a, b) => b[1] - a[1]).map(([, value]) => value),
                      type: 'bar',
                      itemStyle: {
                        color: function(params: any) {
                          const ballNum = parseInt(params.name);
                          return ballNum % 2 === 1 ? '#FF3333' : '#FF6B6B';
                        },
                        barBorderRadius: [6, 6, 0, 0],
                        shadowBlur: 10,
                        shadowColor: 'rgba(255, 51, 51, 0.5)'
                      },
                      barWidth: '70%',
                      emphasis: {
                        itemStyle: {
                          color: '#FF0000',
                          shadowBlur: 20,
                          shadowColor: 'rgba(255, 0, 0, 0.8)'
                        }
                      }
                    }
                  ]
                }}
                style={{ height: '240px', width: '100%', position: 'relative', zIndex: 1 }}
              />
            )}
          </div>

          {/* 蓝球16个号码累计出现次数柱状图 */}
          <div className="health-spring-panel health-spring-chart-panel" style={{
            position: 'relative',
            padding: '20px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(24, 144, 255, 0.15) 0%, rgba(0, 82, 180, 0.15) 50%, rgba(0, 40, 100, 0.15) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(24, 144, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(24, 144, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
            height: '320px',
            overflow: 'hidden'
          }}>
            {/* 科技感网格背景 */}
            <div className="health-spring-decor" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                linear-gradient(rgba(24, 144, 255, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(24, 144, 255, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              pointerEvents: 'none',
              opacity: 0.5
            }} />
            
            {/* 顶部装饰线 */}
            <div className="health-spring-decor" style={{
              position: 'absolute',
              top: 0,
              left: '20px',
              right: '20px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, rgba(24, 144, 255, 0.8), transparent)',
              boxShadow: '0 0 20px rgba(24, 144, 255, 0.5)'
            }} />
            
            {/* 顶部打光效果 */}
            <div className="health-spring-decor" style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60%',
              height: '60px',
              background: 'linear-gradient(to bottom, rgba(100, 180, 255, 0.3), transparent)',
              pointerEvents: 'none',
              filter: 'blur(15px)'
            }} />
            
            {/* 底部打光效果 */}
            <div className="health-spring-decor" style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60%',
              height: '60px',
              background: 'linear-gradient(to top, rgba(100, 180, 255, 0.3), transparent)',
              pointerEvents: 'none',
              filter: 'blur(15px)'
            }} />
            
            {/* 标题 */}
            <div style={{
              position: 'relative',
              zIndex: 1,
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#1890FF',
              textShadow: '0 0 20px rgba(24, 144, 255, 0.5)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              textAlign: 'center'
            }}>
              四季热力图
            </div>
            
            {loading ? (
              <div style={{
                height: '240px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#1890FF'
              }}>
                加载中...
              </div>
            ) : (
              <ReactECharts 
                option={{
                  backgroundColor: 'transparent',
                  tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(30, 30, 30, 0.95)',
                    borderColor: 'rgba(24, 144, 255, 0.5)',
                    borderWidth: 1,
                    textStyle: { color: '#fff' },
                    axisPointer: {
                      type: 'shadow',
                      shadowStyle: {
                        color: 'rgba(24, 144, 255, 0.1)'
                      }
                    },
                    formatter: function(params: any) {
                      const solarTerm = BLUE_BALL_SOLAR_TERM_MAP[params[0].name] || params[0].name;
                      return `<div style="padding: 8px;">
                              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <div style="color: #1890FF; font-weight: bold;">${solarTerm}</div>
                                <div style="color: #AAAAAA;">${params[0].name}</div>
                              </div>
                              <div style="text-align: center; font-size: 16px; color: #1890FF; font-weight: bold;">${params[0].value}次</div>
                            </div>`;
                    }
                  },
                  grid: {
                    left: '3%',
                    right: '4%',
                    top: '10%',
                    bottom: '8%',
                    containLabel: true
                  },
                  xAxis: {
                    type: 'category',
                    data: Object.entries(blueBallCounts).sort((a, b) => b[1] - a[1]).map(([key]) => key),
                    axisLabel: {
                      color: 'rgba(80, 180, 255, 0.9)',
                      fontSize: 10,
                      fontWeight: 'bold'
                    },
                    axisLine: {
                      lineStyle: {
                        color: 'rgba(60, 160, 255, 0.5)'
                      }
                    },
                    splitLine: {
                      show: false
                    }
                  },
                  yAxis: {
                    type: 'value',
                    axisLabel: {
                      color: 'rgba(80, 180, 255, 0.9)',
                      fontSize: 10,
                      fontWeight: 'bold'
                    },
                    axisLine: {
                      lineStyle: {
                        color: 'rgba(60, 160, 255, 0.5)'
                      }
                    },
                    splitLine: {
                      lineStyle: {
                        color: 'rgba(60, 160, 255, 0.15)'
                      }
                    }
                  },
                  series: [
                    {
                      data: Object.entries(blueBallCounts).sort((a, b) => b[1] - a[1]).map(([, value]) => value),
                      type: 'bar',
                      itemStyle: {
                        color: function(params: any) {
                          const ballNum = parseInt(params.name);
                          return ballNum % 2 === 1 ? '#1890FF' : '#69C0FF';
                        },
                        barBorderRadius: [6, 6, 0, 0],
                        shadowBlur: 10,
                        shadowColor: 'rgba(24, 144, 255, 0.5)'
                      },
                      barWidth: '70%',
                      emphasis: {
                        itemStyle: {
                          color: '#0052CC',
                          shadowBlur: 20,
                          shadowColor: 'rgba(24, 144, 255, 0.8)'
                        }
                      }
                    }
                  ]
                }}
                style={{ height: '240px', width: '100%', position: 'relative', zIndex: 1 }}
              />
            )}
          </div>
        </div>



        {/* 主要内容区域 */}
        <div className="health-spring-period-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px', transformStyle: 'preserve-3d', perspective: '1200px' }}>
            {/* 最后八期记录 - 每行四期记录，每一期一个窄卡片 */}
            {lastEightPeriods.length > 0 ? (
              lastEightPeriods.map((period) => (
                <div
                  className="health-spring-period-card"
                  key={period.period}
                  style={{
                    position: 'relative',
                    borderRadius: '20px',
                    padding: '40px 20px',
                    backdropFilter: 'blur(16px)',
                    background: `linear-gradient(135deg, ${period.blueBall % 2 !== 0 ? 'rgba(255, 0, 0, 0.12)' : 'rgba(156, 39, 176, 0.12)'} 0%, ${period.blueBall % 2 !== 0 ? 'rgba(139, 0, 0, 0.08)' : 'rgba(90, 0, 120, 0.08)'} 100%)`,
                    border: `1px solid ${period.blueBall % 2 !== 0 ? 'rgba(255, 0, 0, 0.4)' : 'rgba(156, 39, 176, 0.4)'}`,
                    boxShadow: `0 0 30px ${period.blueBall % 2 !== 0 ? 'rgba(255, 0, 0, 0.3)' : 'rgba(156, 39, 176, 0.3)'}, 0 8px 32px ${period.blueBall % 2 !== 0 ? 'rgba(255, 0, 0, 0.25)' : 'rgba(156, 39, 176, 0.25)'}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                    transform: 'translateZ(0)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    minHeight: '280px'
                  }}
                  onMouseEnter={(e) => {
                    const card = e.currentTarget;
                    card.style.transform = 'translateZ(12px) scale(1.02)';
                    card.style.boxShadow = `0 0 40px ${period.blueBall % 2 !== 0 ? 'rgba(255, 0, 0, 0.5)' : 'rgba(156, 39, 176, 0.5)'}, 0 12px 40px ${period.blueBall % 2 !== 0 ? 'rgba(255, 0, 0, 0.4)' : 'rgba(156, 39, 176, 0.4)'}, inset 0 2px 0 rgba(255, 255, 255, 0.15)`;
                  }}
                  onMouseLeave={(e) => {
                    const card = e.currentTarget;
                    card.style.transform = 'translateZ(0) scale(1)';
                    card.style.boxShadow = `0 0 30px ${period.blueBall % 2 !== 0 ? 'rgba(255, 0, 0, 0.3)' : 'rgba(156, 39, 176, 0.3)'}, 0 8px 32px ${period.blueBall % 2 !== 0 ? 'rgba(255, 0, 0, 0.25)' : 'rgba(156, 39, 176, 0.25)'}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`;
                  }}
                  onClick={() => {
                    setSelectedPeriod(period);
                    setShowFullPage(true);
                  }}

                >
                  {/* 顶部打光效果 */}
                  <div className="health-spring-decor" style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60%',
                    height: '60px',
                    background: `linear-gradient(to bottom, ${period.blueBall % 2 !== 0 ? 'rgba(255, 100, 100, 0.3)' : 'rgba(180, 100, 200, 0.3)'}, transparent)`,
                    pointerEvents: 'none',
                    filter: 'blur(15px)'
                  }} />
                  
                  {/* 底部打光效果 */}
                  <div className="health-spring-decor" style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60%',
                    height: '60px',
                    background: `linear-gradient(to top, ${period.blueBall % 2 !== 0 ? 'rgba(255, 100, 100, 0.3)' : 'rgba(180, 100, 200, 0.3)'}, transparent)`,
                    pointerEvents: 'none',
                    filter: 'blur(15px)'
                  }} />
                  
                  {/* 红球和蓝球中奖号码 */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '20px', marginBottom: '20px', width: '100%', position: 'relative', zIndex: 1 }}>
                    {/* 红球部分 - 两行三列 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      {/* 第一行红球 */}
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', width: '100%' }}>
                        {period.balls.slice(0, 3).map((ballObj, ballIndex) => {
                          const { number } = ballObj;
                          const ballStr = number.toString().padStart(2, '0');
                          const characterName = RED_BALL_CHARACTER_MAP[ballStr] || ballStr;
                          const cardColor = number % 2 !== 0 ? '#FF3333' : '#FF8888';
                          const bgColor = number % 2 !== 0 ? '#333333' : '#2D2D2D';
                          const borderColor = number % 2 !== 0 ? '#FF333340' : '#FF888840';
                          
                          return (
                            <div 
                              key={ballIndex}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '16px',
                                backgroundColor: bgColor,
                                backgroundImage: `linear-gradient(135deg, ${bgColor === '#333333' ? '#3F3F3F' : '#373737'}, ${bgColor === '#333333' ? '#333333' : '#2D2D2D'}, ${bgColor === '#333333' ? '#2A2A2A' : '#252525'}), radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.2), transparent 50%)`,
                                color: cardColor,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                border: `1px solid ${borderColor}`,
                                boxShadow: `0 0 12px ${cardColor}80, 0 6px 18px rgba(0, 0, 0, 0.6), 0 3px 9px ${cardColor}40, inset 0 3px 6px rgba(255, 255, 255, 0.2), inset 0 -3px 6px rgba(0, 0, 0, 0.5), 0 2px 0 rgba(255, 255, 255, 0.1)`,
                                whiteSpace: 'nowrap',
                                width: '100px',
                                height: '80px',
                                textAlign: 'center',
                                transformStyle: 'preserve-3d',
                                perspective: '1000px',
                                transform: 'translateZ(0)',
                                transition: 'transform 0.4s ease, box-shadow 0.4s ease',
                                cursor: 'pointer',
                                overflow: 'visible',
                                position: 'relative'
                              }}
                              onMouseEnter={(e) => {
                                const card = e.currentTarget;
                                card.style.transform = 'translateZ(6px) scale(1.05)';
                                card.style.boxShadow = `0 0 16px ${cardColor}80, 0 8px 20px rgba(0, 0, 0, 0.6), 0 4px 10px ${cardColor}40, inset 0 3px 6px rgba(255, 255, 255, 0.2), inset 0 -3px 6px rgba(0, 0, 0, 0.5), 0 2px 0 rgba(255, 255, 255, 0.15)`;
                              }}
                              onMouseLeave={(e) => {
                                const card = e.currentTarget;
                                card.style.transform = 'translateZ(0) scale(1)';
                                card.style.boxShadow = `0 0 12px ${cardColor}80, 0 6px 18px rgba(0, 0, 0, 0.6), 0 3px 9px ${cardColor}40, inset 0 3px 6px rgba(255, 255, 255, 0.2), inset 0 -3px 6px rgba(0, 0, 0, 0.5), 0 2px 0 rgba(255, 255, 255, 0.1)`;
                              }}
                            >
                              <div style={{ fontSize: '12px', marginBottom: '4px', opacity: 0.8 }}>{ballStr}</div>
                              <div style={{ fontSize: '13px' }}>{characterName}</div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* 第二行红球 */}
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', width: '100%' }}>
                        {period.balls.slice(3, 6).map((ballObj, ballIndex) => {
                          const { number } = ballObj;
                          const ballStr = number.toString().padStart(2, '0');
                          const characterName = RED_BALL_CHARACTER_MAP[ballStr] || ballStr;
                          const cardColor = number % 2 !== 0 ? '#FF3333' : '#FF8888';
                          const bgColor = number % 2 !== 0 ? '#333333' : '#2D2D2D';
                          const borderColor = number % 2 !== 0 ? '#FF333340' : '#FF888840';
                          
                          return (
                            <div 
                              key={ballIndex}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '16px',
                                backgroundColor: bgColor,
                                backgroundImage: `linear-gradient(135deg, ${bgColor === '#333333' ? '#3F3F3F' : '#373737'}, ${bgColor === '#333333' ? '#333333' : '#2D2D2D'}, ${bgColor === '#333333' ? '#2A2A2A' : '#252525'}), radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.2), transparent 50%)`,
                                color: cardColor,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                border: `1px solid ${borderColor}`,
                                boxShadow: `0 0 12px ${cardColor}80, 0 6px 18px rgba(0, 0, 0, 0.6), 0 3px 9px ${cardColor}40, inset 0 3px 6px rgba(255, 255, 255, 0.2), inset 0 -3px 6px rgba(0, 0, 0, 0.5), 0 2px 0 rgba(255, 255, 255, 0.1)`,
                                whiteSpace: 'nowrap',
                                width: '100px',
                                height: '80px',
                                textAlign: 'center',
                                transformStyle: 'preserve-3d',
                                perspective: '1000px',
                                transform: 'translateZ(0)',
                                transition: 'transform 0.4s ease, box-shadow 0.4s ease',
                                cursor: 'pointer',
                                overflow: 'visible',
                                position: 'relative'
                              }}
                              onMouseEnter={(e) => {
                                const card = e.currentTarget;
                                card.style.transform = 'translateZ(6px) scale(1.05)';
                                card.style.boxShadow = `0 0 16px ${cardColor}80, 0 8px 20px rgba(0, 0, 0, 0.6), 0 4px 10px ${cardColor}40, inset 0 3px 6px rgba(255, 255, 255, 0.2), inset 0 -3px 6px rgba(0, 0, 0, 0.5), 0 2px 0 rgba(255, 255, 255, 0.15)`;
                              }}
                              onMouseLeave={(e) => {
                                const card = e.currentTarget;
                                card.style.transform = 'translateZ(0) scale(1)';
                                card.style.boxShadow = `0 0 12px ${cardColor}80, 0 6px 18px rgba(0, 0, 0, 0.6), 0 3px 9px ${cardColor}40, inset 0 3px 6px rgba(255, 255, 255, 0.2), inset 0 -3px 6px rgba(0, 0, 0, 0.5), 0 2px 0 rgba(255, 255, 255, 0.1)`;
                              }}
                            >
                              <div style={{ fontSize: '12px', marginBottom: '4px', opacity: 0.8 }}>{ballStr}</div>
                              <div style={{ fontSize: '13px' }}>{characterName}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* 蓝球中奖号码 */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch' }}>
                      <div 
                        style={{
                        padding: '8px 20px',
                        borderRadius: '16px',
                        backgroundColor: '#2D2D2D',
                        backgroundImage: 'linear-gradient(145deg, #323232, #252525)',
                        color: period.blueBall % 2 === 0 ? '#87CEFA' : '#1890ff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        border: `1px solid ${period.blueBall % 2 === 0 ? '#87CEFA40' : '#1890ff40'}`,
                        boxShadow: `0 0 8px ${period.blueBall % 2 === 0 ? 'rgba(135, 206, 250, 0.6)' : 'rgba(24, 144, 255, 0.6)'}, 0 4px 12px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.15), inset 0 -2px 4px rgba(0, 0, 0, 0.4), 0 2px 0 rgba(255, 255, 255, 0.05)`,
                        whiteSpace: 'nowrap',
                        minWidth: '80px',
                        height: '178px',
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
                          const cardColor = period.blueBall % 2 === 0 ? 'rgba(135, 206, 250, 0.9)' : 'rgba(24, 144, 255, 0.9)';
                          card.style.transform = 'translateZ(10px) scale(1.05)';
                          card.style.boxShadow = `0 0 20px ${cardColor}, 0 12px 30px rgba(0, 0, 0, 0.7), inset 0 3px 6px rgba(255, 255, 255, 0.3), inset 0 -3px 6px rgba(0, 0, 0, 0.5), 0 3px 0 rgba(255, 255, 255, 0.15)`;
                        }}
                        onMouseLeave={(e) => {
                          const card = e.currentTarget;
                          const cardColor = period.blueBall % 2 === 0 ? 'rgba(135, 206, 250, 0.6)' : 'rgba(24, 144, 255, 0.6)';
                          card.style.transform = 'translateZ(0) scale(1)';
                          card.style.boxShadow = `0 0 8px ${cardColor}, 0 4px 12px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.15), inset 0 -2px 4px rgba(0, 0, 0, 0.4), 0 2px 0 rgba(255, 255, 255, 0.05)`;
                        }}
                      >
                        <div style={{ fontSize: '16px', marginBottom: '10px', opacity: 0.9 }}>{period.blueBallStr}</div>
                        <div style={{ fontSize: '15px' }}>{BLUE_BALL_SOLAR_TERM_MAP[period.blueBallStr]}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 底部区域：期号、三个Avatar、天干地支 */}
                  <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    {/* 期号 - 左下角 */}
                    <div
                      style={{
                      fontSize: '13px',
                      fontWeight: 'bold',
                      color: '#FF9800',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 152, 0, 0.15)',
                      border: '1px solid rgba(255, 152, 0, 0.3)',
                      boxShadow: '0 0 10px rgba(255, 152, 0, 0.2)',
                      textShadow: '0 0 8px rgba(255, 152, 0, 0.5)'
                    }}>
                      {period.period}
                    </div>
                    
                    {/* 三个Avatar - 中间 */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px' }}>
                      {/* 卦象Avatar */}
                      <div
                        style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: period.color,
                        flexShrink: 0,
                        boxShadow: `0 0 12px ${period.color}80, inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                        border: `1px solid ${period.color}50`
                      }}>
                        {period.hexagramName}
                      </div>
                      {/* 星球Avatar */}
                      <div
                        style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: period.color,
                        flexShrink: 0,
                        boxShadow: `0 0 12px ${period.color}80, inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                        border: `1px solid ${period.color}50`
                      }}>
                        {period.planetName}
                      </div>
                      {/* 太阳/月亮Avatar */}
                      <div
                        style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: period.blueBall % 2 !== 0 ? '#f5222d' : '#722ed1',
                        flexShrink: 0,
                        boxShadow: `0 0 12px ${period.blueBall % 2 !== 0 ? '#f5222d80' : '#722ed180'}, inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                        border: `1px solid ${period.blueBall % 2 !== 0 ? '#f5222d50' : '#722ed150'}`
                      }}>
                        {period.blueBall % 2 !== 0 ? '太阳' : '月亮'}
                      </div>
                    </div>
                    
                    {/* 天干地支 - 右下角 */}
                    <div
                      style={{
                      fontSize: '13px',
                      fontWeight: 'bold',
                      color: '#4CAF50',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(76, 175, 80, 0.15)',
                      border: '1px solid rgba(76, 175, 80, 0.3)',
                      boxShadow: '0 0 10px rgba(76, 175, 80, 0.2)',
                      textShadow: '0 0 8px rgba(76, 175, 80, 0.5)'
                    }}>
                      {period.ganzhi}
                    </div>
                  </div>
                </div>
              ))
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
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '24px',
              width: '100%',
              gridColumn: '1 / -1', // 跨越所有列
              order: 9999 // 确保分页组件在所有卡片之后显示
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
                    backgroundColor: 'transparent',
                    color: currentRightPage === 1 ? '#666666' : '#FF0000',
                    border: 'none',
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
                    backgroundColor: 'transparent',
                    color: currentRightPage === 1 ? '#666666' : '#FF0000',
                    border: 'none',
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
                  {currentRightPage} / {getRightTotalPagesFunc()}
                </span>
                <button 
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'transparent',
                    color: currentRightPage === getRightTotalPagesFunc() ? '#666666' : '#FF0000',
                    border: 'none',
                    cursor: currentRightPage === getRightTotalPagesFunc() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                    transform: 'translateZ(0)',
                    boxShadow: currentRightPage === getRightTotalPagesFunc() ? '0 0 4px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)' : '0 0 8px #FF000080, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    fontSize: '16px'
                  }}
                  onClick={() => setCurrentRightPage(prev => Math.min(getRightTotalPagesFunc(), prev + 1))}
                  disabled={currentRightPage === getRightTotalPagesFunc()}
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
                    backgroundColor: 'transparent',
                    color: currentRightPage === getRightTotalPagesFunc() ? '#666666' : '#FF0000',
                    border: 'none',
                    cursor: currentRightPage === getRightTotalPagesFunc() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                    transform: 'translateZ(0)',
                    boxShadow: currentRightPage === getRightTotalPagesFunc() ? '0 0 4px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)' : '0 0 8px #FF000080, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    fontSize: '16px'
                  }}
                  onClick={() => setCurrentRightPage(getRightTotalPagesFunc())}
                  disabled={currentRightPage === getRightTotalPagesFunc()}
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
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '12px', 
                    color: '#4CAF50',
                    padding: 0
                  }}>
                    Total Periods
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
                  <div style={{
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    color: '#4CAF50',
                    marginBottom: '8px'
                  }}>
                    1107568
                  </div>
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
      
      {/* 放大显示组件 */}
      {showFullPage && selectedPeriod && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          zIndex: 2000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px'
        }}
        onClick={() => {
          setShowFullPage(false);
          setSelectedPeriod(null);
        }}>
          {/* 上一期按钮 */}
          <button
            style={{
              position: 'fixed',
              left: '140px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: selectedPeriod && selectedPeriod.period === lastEightPeriods[0].period ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
              color: selectedPeriod && selectedPeriod.period === lastEightPeriods[0].period ? '#666666' : '#FFFFFF',
              border: 'none',
              cursor: selectedPeriod && selectedPeriod.period === lastEightPeriods[0].period ? 'not-allowed' : 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '32px',
              fontWeight: 'bold',
              boxShadow: selectedPeriod && selectedPeriod.period === lastEightPeriods[0].period ? '0 2px 6px rgba(0, 0, 0, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.3)',
              zIndex: 2001
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (selectedPeriod) {
                const currentIndex = lastEightPeriods.findIndex(p => p.period === selectedPeriod.period);
                if (currentIndex > 0) {
                  setSelectedPeriod(lastEightPeriods[currentIndex - 1]);
                }
              }
            }}
            disabled={selectedPeriod && selectedPeriod.period === lastEightPeriods[0].period}
          >
            <StepBackwardOutlined />
          </button>
          
          {/* 下一期按钮 */}
          <button
            style={{
              position: 'fixed',
              right: '140px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: selectedPeriod && selectedPeriod.period === lastEightPeriods[lastEightPeriods.length - 1].period ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
              color: selectedPeriod && selectedPeriod.period === lastEightPeriods[lastEightPeriods.length - 1].period ? '#666666' : '#FFFFFF',
              border: 'none',
              cursor: selectedPeriod && selectedPeriod.period === lastEightPeriods[lastEightPeriods.length - 1].period ? 'not-allowed' : 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '32px',
              fontWeight: 'bold',
              boxShadow: selectedPeriod && selectedPeriod.period === lastEightPeriods[lastEightPeriods.length - 1].period ? '0 2px 6px rgba(0, 0, 0, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.3)',
              zIndex: 2001
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (selectedPeriod) {
                const currentIndex = lastEightPeriods.findIndex(p => p.period === selectedPeriod.period);
                if (currentIndex < lastEightPeriods.length - 1) {
                  setSelectedPeriod(lastEightPeriods[currentIndex + 1]);
                }
              }
            }}
            disabled={selectedPeriod && selectedPeriod.period === lastEightPeriods[lastEightPeriods.length - 1].period}
          >
            <StepForwardOutlined />
          </button>
          <div style={{
            width: '100%',
            maxWidth: '800px',
            position: 'relative',
            padding: '48px',
            borderRadius: '24px',
            backdropFilter: 'blur(20px)',
            background: `linear-gradient(135deg, ${selectedPeriod.blueBall % 2 !== 0 ? 'rgba(255, 0, 0, 0.12)' : 'rgba(156, 39, 176, 0.12)'} 0%, ${selectedPeriod.blueBall % 2 !== 0 ? 'rgba(139, 0, 0, 0.08)' : 'rgba(90, 0, 120, 0.08)'} 100%)`,
            border: `1px solid ${selectedPeriod.blueBall % 2 !== 0 ? 'rgba(255, 0, 0, 0.4)' : 'rgba(156, 39, 176, 0.4)'}`,
            boxShadow: `0 0 40px ${selectedPeriod.blueBall % 2 !== 0 ? 'rgba(255, 0, 0, 0.4)' : 'rgba(156, 39, 176, 0.4)'}, 0 12px 48px ${selectedPeriod.blueBall % 2 !== 0 ? 'rgba(255, 0, 0, 0.3)' : 'rgba(156, 39, 176, 0.3)'}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflow: 'hidden'
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}>
            
            {/* 顶部打光效果 */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60%',
              height: '60px',
              background: `linear-gradient(to bottom, ${selectedPeriod.blueBall % 2 !== 0 ? 'rgba(255, 100, 100, 0.3)' : 'rgba(180, 100, 200, 0.3)'}, transparent)`,
              pointerEvents: 'none',
              filter: 'blur(15px)'
            }} />
            
            {/* 底部打光效果 */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60%',
              height: '60px',
              background: `linear-gradient(to top, ${selectedPeriod.blueBall % 2 !== 0 ? 'rgba(255, 100, 100, 0.3)' : 'rgba(180, 100, 200, 0.3)'}, transparent)`,
              pointerEvents: 'none',
              filter: 'blur(15px)'
            }} />
            
            {/* 红球和蓝球中奖号码 */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '32px', marginBottom: '40px', width: '100%', position: 'relative', zIndex: 1 }}>
              {/* 红球部分 - 两行三列 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* 第一行红球 */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', width: '100%' }}>
                  {selectedPeriod.balls.slice(0, 3).map((ballObj: any, ballIndex: number) => {
                    const { number } = ballObj;
                    const ballStr = number.toString().padStart(2, '0');
                    const characterName = RED_BALL_CHARACTER_MAP[ballStr] || ballStr;
                    const cardColor = number % 2 !== 0 ? '#FF3333' : '#FF8888';
                    const bgColor = number % 2 !== 0 ? '#333333' : '#2D2D2D';
                    const borderColor = number % 2 !== 0 ? '#FF333340' : '#FF888840';
                    
                    return (
                      <div 
                        key={ballIndex}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '18px',
                          backgroundColor: bgColor,
                          backgroundImage: `linear-gradient(135deg, ${bgColor === '#333333' ? '#3F3F3F' : '#373737'}, ${bgColor === '#333333' ? '#333333' : '#2D2D2D'}, ${bgColor === '#333333' ? '#2A2A2A' : '#252525'}), radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.2), transparent 50%)`,
                          color: cardColor,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          border: `1px solid ${borderColor}`,
                          boxShadow: `0 0 14px ${cardColor}80, 0 8px 20px rgba(0, 0, 0, 0.6), 0 4px 10px ${cardColor}40, inset 0 3px 6px rgba(255, 255, 255, 0.2), inset 0 -3px 6px rgba(0, 0, 0, 0.5), 0 2px 0 rgba(255, 255, 255, 0.1)`,
                          whiteSpace: 'nowrap',
                          width: '120px',
                          height: '96px',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontSize: '14px', marginBottom: '6px', opacity: 0.9 }}>{ballStr}</div>
                        <div style={{ fontSize: '15px' }}>{characterName}</div>
                      </div>
                    );
                  })}
                </div>
                
                {/* 第二行红球 */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', width: '100%' }}>
                  {selectedPeriod.balls.slice(3, 6).map((ballObj: any, ballIndex: number) => {
                    const { number } = ballObj;
                    const ballStr = number.toString().padStart(2, '0');
                    const characterName = RED_BALL_CHARACTER_MAP[ballStr] || ballStr;
                    const cardColor = number % 2 !== 0 ? '#FF3333' : '#FF8888';
                    const bgColor = number % 2 !== 0 ? '#333333' : '#2D2D2D';
                    const borderColor = number % 2 !== 0 ? '#FF333340' : '#FF888840';
                    
                    return (
                      <div 
                        key={ballIndex}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '18px',
                          backgroundColor: bgColor,
                          backgroundImage: `linear-gradient(135deg, ${bgColor === '#333333' ? '#3F3F3F' : '#373737'}, ${bgColor === '#333333' ? '#333333' : '#2D2D2D'}, ${bgColor === '#333333' ? '#2A2A2A' : '#252525'}), radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.2), transparent 50%)`,
                          color: cardColor,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          border: `1px solid ${borderColor}`,
                          boxShadow: `0 0 14px ${cardColor}80, 0 8px 20px rgba(0, 0, 0, 0.6), 0 4px 10px ${cardColor}40, inset 0 3px 6px rgba(255, 255, 255, 0.2), inset 0 -3px 6px rgba(0, 0, 0, 0.5), 0 2px 0 rgba(255, 255, 255, 0.1)`,
                          whiteSpace: 'nowrap',
                          width: '120px',
                          height: '96px',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontSize: '14px', marginBottom: '6px', opacity: 0.9 }}>{ballStr}</div>
                        <div style={{ fontSize: '15px' }}>{characterName}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* 蓝球中奖号码 */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch' }}>
                <div 
                  style={{
                  padding: '12px 24px',
                  borderRadius: '18px',
                  backgroundColor: '#2D2D2D',
                  backgroundImage: 'linear-gradient(145deg, #323232, #252525)',
                  color: selectedPeriod.blueBall % 2 === 0 ? '#87CEFA' : '#1890ff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: `1px solid ${selectedPeriod.blueBall % 2 === 0 ? '#87CEFA40' : '#1890ff40'}`,
                  boxShadow: `0 0 12px ${selectedPeriod.blueBall % 2 === 0 ? 'rgba(135, 206, 250, 0.6)' : 'rgba(24, 144, 255, 0.6)'}, 0 6px 16px rgba(0, 0, 0, 0.5), inset 0 3px 6px rgba(255, 255, 255, 0.15), inset 0 -3px 6px rgba(0, 0, 0, 0.4), 0 2px 0 rgba(255, 255, 255, 0.05)`,
                  whiteSpace: 'nowrap',
                  minWidth: '100px',
                  height: '216px',
                  textAlign: 'center'
                }}
                >
                  <div style={{ fontSize: '18px', marginBottom: '12px', opacity: 0.9 }}>{selectedPeriod.blueBallStr}</div>
                  <div style={{ fontSize: '16px' }}>{BLUE_BALL_SOLAR_TERM_MAP[selectedPeriod.blueBallStr]}</div>
                </div>
              </div>
            </div>
            
            {/* 底部区域：期号、三个Avatar、天干地支 */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              {/* 期号 - 左下角 */}
              <div
                style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#FF9800',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 152, 0, 0.15)',
                border: '1px solid rgba(255, 152, 0, 0.3)',
                boxShadow: '0 0 12px rgba(255, 152, 0, 0.2)',
                textShadow: '0 0 10px rgba(255, 152, 0, 0.5)'
              }}>
                {selectedPeriod.period}
              </div>
              
              {/* 三个Avatar - 中间 */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px' }}>
                {/* 卦象Avatar */}
                <div
                  style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: selectedPeriod.color,
                  flexShrink: 0,
                  boxShadow: `0 0 16px ${selectedPeriod.color}80, inset 0 3px 6px rgba(255, 255, 255, 0.2), inset 0 -3px 6px rgba(0, 0, 0, 0.3)`,
                  border: `2px solid ${selectedPeriod.color}50`
                }}>
                  {selectedPeriod.hexagramName}
                </div>
                {/* 星球Avatar */}
                <div
                  style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: selectedPeriod.color,
                  flexShrink: 0,
                  boxShadow: `0 0 16px ${selectedPeriod.color}80, inset 0 3px 6px rgba(255, 255, 255, 0.2), inset 0 -3px 6px rgba(0, 0, 0, 0.3)`,
                  border: `2px solid ${selectedPeriod.color}50`
                }}>
                  {selectedPeriod.planetName}
                </div>
                {/* 太阳/月亮Avatar */}
                <div
                  style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: selectedPeriod.blueBall % 2 !== 0 ? '#f5222d' : '#722ed1',
                  flexShrink: 0,
                  boxShadow: `0 0 16px ${selectedPeriod.blueBall % 2 !== 0 ? '#f5222d80' : '#722ed180'}, inset 0 3px 6px rgba(255, 255, 255, 0.2), inset 0 -3px 6px rgba(0, 0, 0, 0.3)`,
                  border: `2px solid ${selectedPeriod.blueBall % 2 !== 0 ? '#f5222d50' : '#722ed150'}`
                }}>
                  {selectedPeriod.blueBall % 2 !== 0 ? '太阳' : '月亮'}
                </div>
              </div>
              
              {/* 天干地支 - 右下角 */}
              <div
                style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#4CAF50',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(76, 175, 80, 0.15)',
                border: '1px solid rgba(76, 175, 80, 0.3)',
                boxShadow: '0 0 12px rgba(76, 175, 80, 0.2)',
                textShadow: '0 0 10px rgba(76, 175, 80, 0.5)'
              }}>
                {selectedPeriod.ganzhi}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthMainPage;
