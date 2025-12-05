import React, { useState, useEffect, useRef } from 'react';
import { Card, Spin, Slider, message, Tooltip } from 'antd';
import {
  LoadingOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  SettingOutlined,
  AppstoreOutlined,
  ClearOutlined,
  AppstoreAddOutlined,
  WomanOutlined,
  ManOutlined
} from '@ant-design/icons';
import { Column } from '@ant-design/charts';
import { recordApi } from '../services/api';

// 定义数据接口
interface AnalysisResult {
  [key: string]: {
    count: number;
    percent: number;
  };
}

// 图表数据接口
interface ChartDataItem {
  period: number;
  number: string;
  count: number;
}

const ChartPage: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [allRecords, setAllRecords] = useState<string[]>([]);
  const [sliderRange, setSliderRange] = useState<[number, number]>([0, 0]);
  const [statisticType, setStatisticType] = useState<'red' | 'blue'>('red');
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  
  // 拖动状态管理
  const [isDragging, setIsDragging] = useState(false);
  const [isHiddenIconDragging, setIsHiddenIconDragging] = useState(false);
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isSelectorDragging, setIsSelectorDragging] = useState(false);
  const [isButtonDragging, setIsButtonDragging] = useState(false);
  
  // 位置状态
  const [buttonPosition, setButtonPosition] = useState({
    x: window.innerWidth - 105,
    y: window.innerHeight - 70
  });
  const [hiddenIconPosition, setHiddenIconPosition] = useState({
    x: window.innerWidth - 90,
    y: window.innerHeight - 130
  });
  const [sliderPosition, setSliderPosition] = useState({
    x: window.innerWidth - window.innerWidth / 3 - 20,
    y: window.innerHeight - 150 - 80
  });
  const [sliderSize, setSliderSize] = useState({
    width: window.innerWidth / 3,
    height: 150
  });
  const [selectorPosition, setSelectorPosition] = useState({ x: 200, y: 100 });
  const [floatingButtonPosition, setFloatingButtonPosition] = useState({
    x: window.innerWidth - 90,
    y: window.innerHeight - 190
  });
  
  // 偏移量状态
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hiddenIconDragOffset, setHiddenIconDragOffset] = useState({ x: 0, y: 0 });
  const [sliderDragOffset, setSliderDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [selectorDragOffset, setSelectorDragOffset] = useState({ x: 0, y: 0 });
  const [buttonDragOffset, setButtonDragOffset] = useState({ x: 0, y: 0 });
  
  // 其他状态
  const [isSliderHidden, setIsSliderHidden] = useState(true);
  const [showNumberSelector, setShowNumberSelector] = useState(false);
  const [isSliderFixed, setIsSliderFixed] = useState(true);
  const hasFetchedRef = useRef(false);
  
  // 模拟数据，用于测试显示效果
  const mockRecords = [
    '01020304050607',
    '08091011121301',
    '14151617181902',
    '20212223242503',
    '26272829303104',
    '32330102030405',
    '05060708091006',
    '11121314151607',
    '17181920212208',
    '23242526272809',
    '29303132330110',
    '02030405060711',
    '08091011121312',
    '14151617181913',
    '20212223242514',
    '26272829303115',
    '32330102030416',
    '05060708091001',
    '11121314151602',
    '17181920212203'
  ];

  // 窗口大小变化时更新位置
  useEffect(() => {
    const handleResize = () => {
      // 调整滑块大小
      if (window.innerWidth < sliderSize.width * 2) {
        setSliderSize(prev => ({
          ...prev,
          width: window.innerWidth / 3
        }));
      }
      
      // 调整位置
      setSliderPosition(prev => ({
        ...prev,
        y: window.innerHeight - sliderSize.height - 80
      }));
      
      const buttonY = window.innerHeight - 70;
      const hiddenIconY = window.innerHeight - 130;
      const floatingButtonY = window.innerHeight - 190;
      
      setFloatingButtonPosition({
        x: window.innerWidth - 90,
        y: floatingButtonY
      });
      
      setHiddenIconPosition({
        x: window.innerWidth - 90,
        y: hiddenIconY
      });
      
      setButtonPosition({
        x: window.innerWidth - 105,
        y: buttonY
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sliderSize.height, sliderSize.width]);

  // 拖动事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - buttonPosition.x,
      y: e.clientY - buttonPosition.y
    });
  };

  const handleHiddenIconMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHiddenIconDragging(true);
    setHiddenIconDragOffset({
      x: e.clientX - hiddenIconPosition.x,
      y: e.clientY - hiddenIconPosition.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      const maxX = window.innerWidth - 70;
      const maxY = window.innerHeight - 50;
      
      setButtonPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    } else if (isHiddenIconDragging) {
      const newX = e.clientX - hiddenIconDragOffset.x;
      const newY = e.clientY - hiddenIconDragOffset.y;
      const maxX = window.innerWidth - 50;
      const maxY = window.innerHeight - 50;
      
      setHiddenIconPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    } else if (isSliderDragging) {
      const newX = e.clientX - sliderDragOffset.x;
      const newY = e.clientY - sliderDragOffset.y;
      const maxX = window.innerWidth - sliderSize.width;
      const maxY = window.innerHeight - sliderSize.height;
      
      setSliderPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    } else if (isResizing) {
      const newWidth = e.clientX - resizeStart.x + resizeStart.width;
      const newHeight = e.clientY - resizeStart.y + resizeStart.height;
      const minWidth = 300;
      const minHeight = 100;
      const maxWidth = window.innerWidth - 50;
      const maxHeight = window.innerHeight - 50;
      
      setSliderSize({
        width: Math.max(minWidth, Math.min(newWidth, maxWidth)),
        height: Math.max(minHeight, Math.min(newHeight, maxHeight))
      });
    } else if (isSelectorDragging) {
      const newX = e.clientX - selectorDragOffset.x;
      const newY = e.clientY - selectorDragOffset.y;
      
      setSelectorPosition({
        x: newX,
        y: newY
      });
    } else if (isButtonDragging) {
      const newX = e.clientX - buttonDragOffset.x;
      const newY = e.clientY - buttonDragOffset.y;
      const maxX = window.innerWidth - 150;
      const maxY = window.innerHeight - 40;
      
      setFloatingButtonPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsHiddenIconDragging(false);
    setIsSliderDragging(false);
    setIsResizing(false);
    setIsSelectorDragging(false);
    setIsButtonDragging(false);
  };

  // 添加全局事件监听
  useEffect(() => {
    if (isDragging || isHiddenIconDragging || isSliderDragging || isResizing || isSelectorDragging || isButtonDragging) {
      document.addEventListener('mousemove', handleMouseMove as unknown as EventListener);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove as unknown as EventListener);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isHiddenIconDragging, isSliderDragging, isResizing, isSelectorDragging, isButtonDragging]);

  // 滑块区域拖拽事件处理
  const handleSliderMouseDown = (e: React.MouseEvent) => {
    if (!isSliderFixed) {
      setIsSliderFixed(true);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setSliderPosition({
        x: rect.left,
        y: rect.top
      });
    }
    
    setIsSliderDragging(true);
    setSliderDragOffset({
      x: e.clientX - sliderPosition.x,
      y: e.clientY - sliderPosition.y
    });
  };

  // 缩放开始事件
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: sliderSize.width,
      height: sliderSize.height
    });
  };

  // 处理号码选择
  const handleNumberSelect = (number: string) => {
    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      } else {
        return [...prev, number];
      }
    });
  };

  // 清除所有选择
  const clearAllSelections = () => {
    setSelectedNumbers([]);
  };

  // 生成所有可能的号码列表
  const generateNumberList = () => {
    if (statisticType === 'red') {
      return Array.from({ length: 33 }, (_, i) => {
        const num = i + 1;
        return num < 10 ? `0${num}` : `${num}`;
      });
    } else {
      return Array.from({ length: 16 }, (_, i) => {
        const num = i + 1;
        return num < 10 ? `0${num}` : `${num}`;
      });
    }
  };

  // 渲染号码选择器
  const renderNumberSelector = () => {
    const numbers = generateNumberList();
    const currentColor = statisticType === 'red' ? '#f5222d' : '#1890ff';
    const isRed = statisticType === 'red';
    
    const containerWidth = isRed ? '340px' : '350px';
    const containerHeight = isRed ? '360px' : '220px';
    const itemWidth = isRed ? '40px' : '40px';
    const itemHeight = isRed ? '40px' : '40px';
    const gap = isRed ? '6px' : '8px';

    return (
      <div style={{
        width: containerWidth,
        height: containerHeight,
        padding: '16px',
        backgroundColor: '#fff',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
        overflow: 'hidden',
        userSelect: 'none',
        touchAction: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: '1px solid #d9d9d9'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', width: '100%' }}>
            <h4 style={{ margin: 0, color: currentColor, fontSize: '14px' }}>
              选择号码
            </h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => {
                  // 全选功能
                  const allNumbers = generateNumberList();
                  setSelectedNumbers(allNumbers);
                }}
                style={{
                  padding: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: 0,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  width: 'auto',
                  height: 'auto',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                title="全选号码"
              >
                <AppstoreAddOutlined style={{ fontSize: '18px', color: '#999', transition: 'color 0.3s ease' }} />
              </button>
              <button 
                onClick={clearAllSelections}
                style={{
                  padding: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: 0,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  width: 'auto',
                  height: 'auto',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                title="清除所有选择"
              >
                <ClearOutlined style={{ fontSize: '18px', color: '#999', transition: 'color 0.3s ease' }} />
              </button>
            </div>
          </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: gap,
          padding: '12px 12px 32px 12px',
          backgroundColor: '#fafafa',
          borderRadius: '4px',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}>
          {numbers.map(number => (
            <div
              key={number}
              onClick={() => handleNumberSelect(number)}
              style={{
                width: itemWidth,
                height: itemHeight,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: selectedNumbers.includes(number) ? currentColor : '#fff',
                color: selectedNumbers.includes(number) ? '#fff' : currentColor,
                border: `1px solid ${currentColor}`,
                fontWeight: selectedNumbers.includes(number) ? 'bold' : 'normal',
                transition: 'all 0.3s ease',
                flexShrink: 0
              }}
            >
              {number}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 双击隐藏号码选择器
  const handleNumberSelectorDoubleClick = () => {
    setShowNumberSelector(false);
  };

  // 渲染柱状图
  const renderLineChart = () => {
    if (chartData.length === 0 || selectedNumbers.length === 0) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#999',
          backgroundColor: '#fff',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)'
        }}>
          请选择至少一个号码查看累计次数趋势图
        </div>
      );
    }

    const config = {
      data: chartData,
      xField: 'period',
      yField: 'count',
      seriesField: 'number',
      animation: {
        appear: {
          animation: 'path-in',
          duration: 1000,
        },
      },
      legend: {
        position: 'top',
        itemName: {
          style: {
            fontSize: 12,
          },
        },
      },
      tooltip: {
        showMarkers: true,
        formatter: (datum: any) => {
          return {
            name: `${datum.number}`,
            value: `${datum.count}次`,
          };
        },
      },
      xAxis: {
        title: {
          text: '期数',
          style: {
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        label: {
          autoHide: true,
          autoRotate: 45,
          style: {
            fontSize: 12,
          },
        },
        grid: {
          line: {
            style: {
              stroke: '#f0f0f0',
            },
          },
        },
      },
      yAxis: {
        title: {
          text: '累计次数',
          style: {
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        label: {
          style: {
            fontSize: 12,
          },
        },
        grid: {
          line: {
            style: {
              stroke: '#f0f0f0',
            },
          },
        },
      },
      colorField: 'number',
      color: [
        '#1890ff', '#f5222d', '#52c41a', '#faad14', '#722ed1',
        '#13c2c2', '#fa8c16', '#eb2f96', '#a0d911', '#2f54eb',
        '#ff7875', '#52c41a', '#13c2c2', '#722ed1', '#faad14',
        '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb', '#1890ff'
      ],
      columnWidth: 30, // 设置固定的柱子宽度
      maxColumnWidth: 35, // 设置最大柱子宽度
      minColumnWidth: 25, // 设置最小柱子宽度
      isGroup: true,
      scrollbar: {
        x: {
          enable: true,
          style: {
            backgroundColor: '#f0f0f0',
            trackColor: '#ddd',
            thumbColor: '#1890ff',
            thumbBorderRadius: 4,
          },
        },
      },
      padding: {
        top: 20,
        right: 20,
        bottom: 80, // 增加底部内边距，避免x轴标签被截断
        left: 60,
      },
    };

    return (
      <div style={{ 
        height: '600px',
        backgroundColor: '#fff',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
        padding: '16px'
      }}>
        <Column {...config} />
      </div>
    );
  };

  // 渲染号码选择器相关功能
  const renderChartStats = () => {
    const currentColor = statisticType === 'red' ? '#f5222d' : '#1890ff';
    const isRed = statisticType === 'red';

    return (
      <div style={{ padding: '16px', position: 'relative' }}>
        {/* 平滑折线图 */}
        <div style={{ marginBottom: '20px' }}>
          {renderLineChart()}
        </div>
        
        {/* 号码选择器隐藏时，显示圆形图标按钮 */}
        {!showNumberSelector ? (
          <div
            style={{
              position: 'fixed',
              left: `${floatingButtonPosition.x}px`,
              top: `${floatingButtonPosition.y}px`,
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: isButtonDragging ? 'grabbing' : 'grab',
              zIndex: 1000,
              transition: 'all 0.3s ease',
              userSelect: 'none',
              touchAction: 'none'
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsButtonDragging(true);
              setButtonDragOffset({
                x: e.clientX - floatingButtonPosition.x,
                y: e.clientY - floatingButtonPosition.y
              });
            }}
            onClick={() => {
              const isButtonOnRight = floatingButtonPosition.x > window.innerWidth / 2;
              const selectorWidth = isRed ? 340 : 350;
              const selectorHeight = isRed ? 360 : 220;
              
              const newX = isButtonOnRight 
                ? floatingButtonPosition.x - selectorWidth - 20
                : floatingButtonPosition.x + 50 + 20;
              
              let newY = floatingButtonPosition.y - selectorHeight / 2 + 25;
              if (newY + selectorHeight > window.innerHeight) {
                newY = window.innerHeight - selectorHeight - 40;
              }
              if (newY < 0) {
                newY = 20;
              }
              
              setSelectorPosition({
                x: Math.max(0, newX),
                y: newY
              });
              setShowNumberSelector(true);
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
              left: `${selectorPosition.x}px`,
              top: `${selectorPosition.y}px`,
              zIndex: 1000,
              cursor: isSelectorDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none'
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsSelectorDragging(true);
              setSelectorDragOffset({
                x: e.clientX - selectorPosition.x,
                y: e.clientY - selectorPosition.y
              });
            }}
            onDoubleClick={handleNumberSelectorDoubleClick}
            title="双击隐藏号码选择器"
          >
            {renderNumberSelector()}
          </div>
        )}
      </div>
    );
  };

  // 获取记录数据
  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const data = await recordApi.getAllRecords();
        
        let recordsToUse: string[];
        if (typeof data === 'string') {
          recordsToUse = data
            .split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0);
          message.success(`成功获取 ${recordsToUse.length} 条记录`);
        } else if (Array.isArray(data) && data.length > 0) {
          recordsToUse = data;
          message.success(`成功获取 ${recordsToUse.length} 条记录`);
        } else {
          recordsToUse = mockRecords;
          message.info(`使用模拟数据，共 ${mockRecords.length} 条记录`);
        }
        
        setAllRecords(recordsToUse);
        const initialRange: [number, number] = [0, Math.max(0, recordsToUse.length - 1)];
        setSliderRange(initialRange);
      } catch (error) {
        console.error('获取记录失败:', error);
        const recordsToUse = mockRecords;
        setAllRecords(recordsToUse);
        const initialRange: [number, number] = [0, recordsToUse.length - 1];
        setSliderRange(initialRange);
        message.info(`API请求失败，使用模拟数据，共 ${mockRecords.length} 条记录`);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  // 计算选中号码每期的累计次数
  useEffect(() => {
    if (selectedNumbers.length === 0 || allRecords.length === 0) {
      setChartData([]);
      return;
    }

    const selectedRangeRecords = allRecords.slice(sliderRange[0], sliderRange[1] + 1);
    
    const cumulativeCounts: { [key: string]: number } = {};
    selectedNumbers.forEach(num => {
      cumulativeCounts[num] = 0;
    });

    const chartData: ChartDataItem[] = [];
    
    selectedRangeRecords.forEach((record, index) => {
      const period = index + 1;
      
      const isRed = statisticType === 'red';
      let currentNumbers: string[] = [];
      
      if (isRed) {
        for (let i = 0; i < 12; i += 2) {
          currentNumbers.push(record.substring(i, i + 2));
        }
      } else {
        currentNumbers.push(record.substring(12, 14));
      }

      selectedNumbers.forEach(num => {
        // 只有当号码在当期出现时，才更新累计计数并生成数据
        if (currentNumbers.includes(num)) {
          cumulativeCounts[num]++;
          
          chartData.push({
            period: period,
            number: num,
            count: cumulativeCounts[num]
          });
        }
      });
    });

    setChartData(chartData);
  }, [selectedNumbers, allRecords, sliderRange, statisticType]);

  // 处理滑块变化
  const handleSliderChange = (value: number[]) => {
    const range = value as [number, number];
    setSliderRange(range);
  };

  return (
    <div className="chart-page-container" style={{ padding: '20px' }}>
      {/* 可拖拽的切换按钮 */}
      <div style={{
        position: 'fixed',
        left: `${buttonPosition.x}px`,
        top: `${buttonPosition.y}px`,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: '4px',
        width: '80px',
        height: '50px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none'
      }}
      onMouseDown={handleMouseDown}
      >
        <div style={{
          display: 'flex', 
          alignItems: 'center',
          backgroundColor: statisticType === 'red' ? '#f5222d' : '#1890ff',
          borderRadius: '15px',
          cursor: 'pointer',
          transition: 'background-color 0.3s',
          width: '45px',
          height: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={() => {
          setStatisticType(prev => prev === 'red' ? 'blue' : 'red');
        }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
            top: '2px',
            left: statisticType === 'red' ? '2px' : '23px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#fff',
            color: statisticType === 'red' ? '#f5222d' : '#1890ff',
            fontWeight: 'bold',
            transition: 'left 0.3s',
            fontSize: '12px',
            zIndex: 1
          }}>
            {statisticType === 'red' ? <WomanOutlined /> : <ManOutlined />}
          </div>
        </div>
      </div>
      
      {/* 图表内容 */}
      <Spin spinning={loading} indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}>
        <Card title="号码累计次数趋势图" style={{ marginBottom: 20 }}>
          {renderChartStats()}
        </Card>
      </Spin>
      
      {/* 可拖拽且可缩放的数据范围滑块 */}
      {allRecords.length > 0 && (
        <>
          {/* 滑块隐藏时，显示圆形图标 */}
          {isSliderHidden ? (
            <div style={{ 
              position: 'fixed',
              left: `${hiddenIconPosition.x}px`,
              top: `${hiddenIconPosition.y}px`,
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: isHiddenIconDragging ? 'grabbing' : 'grab',
              zIndex: 1000,
              transition: 'all 0.3s ease',
              userSelect: 'none',
              touchAction: 'none'
            }}
            onMouseDown={handleHiddenIconMouseDown}
            onClick={() => {
              const isHiddenIconOnRight = hiddenIconPosition.x > window.innerWidth / 2;
              const newX = isHiddenIconOnRight 
                ? hiddenIconPosition.x - sliderSize.width - 20
                : hiddenIconPosition.x + 50 + 20;
              
              setSliderPosition({
                x: Math.max(0, Math.min(newX, window.innerWidth - sliderSize.width - 20)),
                y: hiddenIconPosition.y - sliderSize.height / 2 + 25
              });
              setIsSliderHidden(false);
            }}
            >
              <SettingOutlined style={{ fontSize: '24px', color: statisticType === 'red' ? '#f5222d' : '#1890ff' }} />
            </div>
          ) : (
            <div style={{ 
              position: 'fixed',
              left: `${sliderPosition.x}px`,
              top: `${sliderPosition.y}px`,
              padding: '16px', 
              backgroundColor: '#fff', 
              borderRadius: 6, 
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
              textAlign: 'center',
              cursor: isSliderDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none',
              zIndex: 999,
              width: `${sliderSize.width}px`,
              height: `${sliderSize.height}px`,
              overflow: 'auto',
              boxSizing: 'border-box'
            }}
            onMouseDown={handleSliderMouseDown}
            onDoubleClick={() => setIsSliderHidden(true)}
            title="双击隐藏滑块"
            >
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
                数据范围选择
              </h3>
              <Slider
                range
                min={0}
                max={allRecords.length - 1}
                value={sliderRange}
                onChange={handleSliderChange}
                style={{ marginBottom: 16 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666' }}>
                <span>第 {sliderRange[0] + 1} 期</span>
                <span>第 {sliderRange[1] + 1} 期</span>
              </div>
              
              {/* 缩放手柄 */}
              <div style={{ 
                position: 'absolute',
                right: '-8px',
                bottom: '-8px',
                width: '16px',
                height: '16px',
                backgroundColor: '#1890ff',
                borderRadius: '50%',
                cursor: 'se-resize',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                zIndex: 10
              }}
              onMouseDown={handleResizeStart}
              ></div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChartPage;
