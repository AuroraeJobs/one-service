import { useState, useEffect, useRef } from 'react';
import { Card, message, DatePicker, Input } from 'antd';
import { CaretLeftOutlined, CaretRightOutlined, StepBackwardOutlined, StepForwardOutlined, CloudFilled } from '@ant-design/icons';
import dayjs from 'dayjs';
import { recordApi } from '../services/api';
import { periodToGanZhi } from '../constants/heavenlyStemsEarthlyBranches';

// 记录类型定义
interface RecordItem {
  code: string;
  date: string;
  week: string;
  red: string;
  blue: string;
  sales: string;
  poolmoney: string;
  line?: string;
}

// 查询参数类型定义
interface QueryParams {
  name?: string;
  dayStart?: string;
  dayEnd?: string;
  issueStart?: string;
  issueEnd?: string;
  lineStart?: string;
  lineEnd?: string;
}

// RecordList组件的props接口
interface RecordListProps {
  // 筛选条件框现在始终显示，不再需要控制显示/隐藏的props
}

const RecordList: React.FC<RecordListProps> = () => {
  // 状态管理
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [issueRange, setIssueRange] = useState<[string, string]>(['', '']);
  // 卡片3d效果状态
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  
  const [startDate, setStartDate] = useState(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState(dayjs());
  
  // 用于监听日期选择器滚轮事件的ref
  const startDatePickerRef = useRef<HTMLDivElement>(null);
  const endDatePickerRef = useRef<HTMLDivElement>(null);
  
  // 防抖定时器ID
  const debounceTimerRef = useRef<number | null>(null);
  
  // 分页状态管理
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12; // 4个/行 * 3行 = 12个
  
  // 使用ref防止useEffect在StrictMode下运行两次
  const hasFetchedRef = useRef(false);
  
  // 时间筛选框滚轮事件处理
  const handleDateWheel = (e: React.WheelEvent, isStartDate: boolean) => {
    e.preventDefault();
    
    const currentDate = isStartDate ? startDate : endDate;
    let newDate;
    
    // 向上滚动是前一天，向下滚动是后一天
    if (e.deltaY < 0) {
      newDate = currentDate.subtract(1, 'day');
    } else {
      newDate = currentDate.add(1, 'day');
    }
    
    if (isStartDate) {
      setStartDate(newDate);
      // 确保两个日期都有值才查询，使用防抖版本
      if (endDate) {
        debouncedFetchRecords(newDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD'), true);
      }
    } else {
      setEndDate(newDate);
      // 确保两个日期都有值才查询，使用防抖版本
      if (startDate) {
        debouncedFetchRecords(startDate.format('YYYY-MM-DD'), newDate.format('YYYY-MM-DD'), true);
      }
    }
  };
  
  // 期号筛选框滚轮事件处理
  const handleIssueWheel = (e: React.WheelEvent, index: number) => {
    e.preventDefault();
    
    const currentIssue = issueRange[index] || '0000000';
    let issueNum = parseInt(currentIssue);
    
    // 向上滚动减一，向下滚动加一
    if (e.deltaY < 0) {
      issueNum = Math.max(1, issueNum - 1);
    } else {
      issueNum += 1;
    }
    
    // 格式化为7位数字
    const newIssue = issueNum.toString().padStart(7, '0');
    const newRange = [...issueRange];
    newRange[index] = newIssue;
    setIssueRange(newRange as [string, string]);
    
    // 使用防抖版本的fetchRecords函数
    const [start, end] = newRange;
    if (start && end) {
      debouncedFetchRecords(start, end, false);
    }
  };
  
  // 为日期选择器添加滚轮事件监听器
  useEffect(() => {
    // 时间筛选框滚轮事件处理函数
    const handleStartDateWheel = (e: WheelEvent) => {
      e.preventDefault();
      handleDateWheel(e as unknown as React.WheelEvent, true);
    };
    
    const handleEndDateWheel = (e: WheelEvent) => {
      e.preventDefault();
      handleDateWheel(e as unknown as React.WheelEvent, false);
    };
    
    // 添加事件监听器
    if (startDatePickerRef.current) {
      startDatePickerRef.current.addEventListener('wheel', handleStartDateWheel, { passive: false });
      // 确保日期选择器内部输入框字体加粗
      const inputElement = startDatePickerRef.current.querySelector('.ant-picker-input input') as HTMLInputElement;
      if (inputElement) {
        inputElement.style.fontWeight = 'bold';
      }
    }
    if (endDatePickerRef.current) {
      endDatePickerRef.current.addEventListener('wheel', handleEndDateWheel, { passive: false });
      // 确保日期选择器内部输入框字体加粗
      const inputElement = endDatePickerRef.current.querySelector('.ant-picker-input input') as HTMLInputElement;
      if (inputElement) {
        inputElement.style.fontWeight = 'bold';
      }
    }
    
    // 移除事件监听器
    return () => {
      if (startDatePickerRef.current) {
        startDatePickerRef.current.removeEventListener('wheel', handleStartDateWheel);
      }
      if (endDatePickerRef.current) {
        endDatePickerRef.current.removeEventListener('wheel', handleEndDateWheel);
      }
    };
  }, [startDate, endDate, handleDateWheel]);


  // 获取记录数据
  const fetchRecords = (start: string, end: string, isDateRange = false, isLineBased = false) => {

    // 构建请求体
    const requestBody: QueryParams = {
      ...(isDateRange
        ? {
            dayStart: start,
            dayEnd: end,
          }
        : isLineBased
        ? {
            lineStart: start,
            lineEnd: end,
          }
        : {
            issueStart: start,
            issueEnd: end,
          }),
    };

    recordApi.find(requestBody)
      .then((data) => {
        if (Array.isArray(data)) {
          // 按期号倒序排序
          const sortedData = data.sort((a, b) => {
            return b.code.localeCompare(a.code);
          });
          setRecords(sortedData);
          message.success(`获取到 ${sortedData.length} 条记录`);
          
          // 只有初次进入页面时才初始化筛选条件，后续查询不再联动更新
          // 这里不再更新筛选条件，只更新记录数据
        } else {
          message.error('获取记录失败，返回数据格式错误');
        }
      })
      .catch((error) => {
        console.error('获取记录失败:', error);
        message.error('获取记录失败，请稍后重试');
      })
      .finally(() => {});
  };
  
  // 防抖版本的fetchRecords函数，停止滑动后2秒执行
  const debouncedFetchRecords = (start: string, end: string, isDateRange = false, isLineBased = false) => {
    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // 设置新的定时器，2秒后执行查询
    debounceTimerRef.current = setTimeout(() => {
      fetchRecords(start, end, isDateRange, isLineBased);
      debounceTimerRef.current = null;
    }, 2000);
  };

  // 组件加载时获取最新记录
  useEffect(() => {
    // 防止在StrictMode下运行两次
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    // 获取最新记录
      recordApi.getLast()
        .then((data) => {
          if (data && data.code) {
            // 解析最新期号
            const latestIssue = data.code;
            if (latestIssue.length === 7) {
              // 期号格式：YYYYNNN（YYYY为年份，NNN为期数）
              const year = latestIssue.slice(0, 4);
              const issueNumber = parseInt(latestIssue.slice(4));
              
              // 计算结束期号：最新期号+1
              const endIssueNumber = issueNumber + 1;
              // 计算开始期号：最新期号-21
              const startIssueNumber = Math.max(endIssueNumber - 21, 1); // 确保不小于1
              
              // 格式化为3位数字，不足补零
              const formattedStartIssueNumber = startIssueNumber.toString().padStart(3, '0');
              const formattedEndIssueNumber = endIssueNumber.toString().padStart(3, '0');
              
              const startIssue = `${year}${formattedStartIssueNumber}`;
              const endIssue = `${year}${formattedEndIssueNumber}`;
              
              // 设置期号范围：起始期号到结束期号
              setIssueRange([startIssue, endIssue]);
              
              // 自动查询：使用lineStart/lineEnd
              if (data.line) {
                const latestLine = parseInt(data.line);
                const startLine = Math.max(latestLine - 12, 1);
                const endLine = latestLine + 1;
                fetchRecords(startLine.toString(), endLine.toString(), false, true);
              } else {
                // 如果没有line属性，使用期号查询
                fetchRecords(startIssue, endIssue);
              }
            }
          }
        })
      .catch((error) => {
        console.error('获取最新记录失败:', error);
        message.error('获取最新记录失败，请稍后重试');
      });
  }, []);

  // 根据期号范围查询
  const handleIssueQuery = () => {
    const [start, end] = issueRange;
    if (!start || !end) {
      message.warning('请输入完整的期号范围');
      return;
    }
    if (start.length !== 7 || end.length !== 7) {
      message.warning('期号必须为7位数字');
      return;
    }
    fetchRecords(start, end, false);
  };

  // 处理输入变化
  const handleInputChange = (index: number, value: string) => {
    // 只允许输入数字，并且限制长度为7位
    const filteredValue = value.replace(/[^0-9]/g, '').slice(0, 7);
    const newRange = [...issueRange];
    newRange[index] = filteredValue;
    setIssueRange(newRange as [string, string]);
  };



  return (
    <>
      {/* 记录列表 */}
      <Card variant="outlined" style={{ width: '100%', border: 'none', backgroundColor: 'transparent' }}>
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', perspective: '1000px' }}>
          {records.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((record) => (
            <Card
                key={record.code} 
                variant="outlined" 
                style={{ 
                  width: 'calc(25% - 12px)', 
                  minWidth: '240px', 
                  marginBottom: '16px',
                  // 深色主题背景和渐变
                  backgroundColor: '#1A1A1A',
                  backgroundImage: 'linear-gradient(145deg, #252525, #101010)',
                  // 确保边框颜色与深色主题协调
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  // 添加圆角
                  borderRadius: '20px',
                  // 3d效果
                  transformStyle: 'preserve-3d',
                  perspective: '1000px',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  // 光标悬停时3D效果，包括translateZ和scale变换
                  transform: hoveredCard === record.code 
                    ? 'translateZ(10px) scale(1.02)' 
                    : 'translateZ(0) scale(1)',
                  // 增强厚度视觉效果 - 多层阴影模拟真实厚度，添加发光效果
                  boxShadow: hoveredCard === record.code 
                    ? '0 0 25px rgba(255, 255, 255, 0.15), 0 15px 40px rgba(0, 0, 0, 0.6), inset 0 0 15px rgba(255, 255, 255, 0.05), inset 0 6px 12px rgba(255, 255, 255, 0.08), inset 0 -6px 12px rgba(0, 0, 0, 0.4)' 
                    : '0 0 20px rgba(255, 255, 255, 0.1), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.03), inset 0 6px 12px rgba(255, 255, 255, 0.08), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
                  // 增强边框效果，进一步提升厚度感
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                onMouseEnter={() => setHoveredCard(record.code)}
                onMouseLeave={() => setHoveredCard(null)}>
            
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* 期号和日期 */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
                  <span style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF' }}>{record.code}</span>
                  <span style={{ fontSize: '14px', color: '#888888' }}>{record.line ? periodToGanZhi(parseInt(record.line)) : ''}</span>
                  <span style={{ fontSize: '14px', color: '#888888' }}>{record.date} {record.week}</span>
                </div>
                
                {/* 红球和蓝球在一行显示 */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  flexWrap: 'wrap', 
                  alignItems: 'center', 
                  justifyContent: 'center'
                }}>
                  {/* 红球 */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {record.red.split(',').map((ball, index) => (
                      <span
                        key={index}
                        style={{
                          display: 'inline-block',
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'radial-gradient(circle at 30% 30%, #ff6b6b 0%, #f5222d 70%, #c9184a 100%)',
                          color: '#fff',
                          textAlign: 'center',
                          lineHeight: '36px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          boxShadow: '0 4px 8px rgba(245, 34, 45, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(193, 53, 53, 0.5)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                        }}
                      >
                        {ball}
                      </span>
                    ))}
                  </div>
                  
                  {/* 蓝球 */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at 30% 30%, #69b1ff 0%, #1890ff 70%, #096dd9 100%)',
                        color: '#fff',
                        textAlign: 'center',
                        lineHeight: '36px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 8px rgba(24, 144, 255, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(10, 100, 190, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      {record.blue}
                    </span>
                  </div>
                </div>
                
                {/* 号码总和进度条 */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '8px 16px',
                  gap: '16px',
                  flexDirection: 'column'
                }}>
                  {/* 红球总和和全部总和 */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    width: '100%',
                    gap: '16px'
                  }}>
                    {/* 红球号码总和进度条 */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ 
                        width: '100%', 
                        height: '8px', 
                        backgroundColor: '#f5222d',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div 
                          style={{
                            height: '100%',
                            backgroundColor: '#ff6b6b',
                            borderRadius: '4px',
                            width: `${Math.min(100, Math.max(0, ((record.red.split(',').reduce((sum, ball) => sum + parseInt(ball), 0) - 21) / (183 - 21)) * 100))}%`,
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        fontSize: '12px',
                        color: '#888888'
                      }}>
                        <span style={{ color: '#f5222d', fontWeight: 'bold' }}>{record.red.split(',').reduce((sum, ball) => sum + parseInt(ball), 0)}</span>
                        <span style={{ color: '#f5222d' }}>红球</span>
                      </div>
                    </div>
                    
                    {/* 所有号码总和进度条 */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ 
                        width: '100%', 
                        height: '8px', 
                        backgroundColor: '#1890ff',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div 
                          style={{
                            height: '100%',
                            backgroundColor: '#69b1ff',
                            borderRadius: '4px',
                            width: `${Math.min(100, Math.max(0, ((record.red.split(',').reduce((sum, ball) => sum + parseInt(ball), 0) + parseInt(record.blue) - 22) / (199 - 22)) * 100))}%`,
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        fontSize: '12px',
                        color: '#888888'
                      }}>
                        <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{record.red.split(',').reduce((sum, ball) => sum + parseInt(ball), 0) + parseInt(record.blue)}</span>
                        <span style={{ color: '#1890ff' }}>全部</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 奇数和偶数数量 */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    width: '100%',
                    gap: '16px'
                  }}>
                    {/* 奇数数量进度条 */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ 
                        width: '100%', 
                        height: '8px', 
                        backgroundColor: '#722ed1',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div 
                          style={{
                            height: '100%',
                            backgroundColor: '#b37feb',
                            borderRadius: '4px',
                            width: `${Math.min(100, Math.max(0, (([...record.red.split(','), record.blue].filter(ball => parseInt(ball) % 2 !== 0).length - 0) / (7 - 0)) * 100))}%`,
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        fontSize: '12px',
                        color: '#888888'
                      }}>
                        <span style={{ color: '#722ed1', fontWeight: 'bold' }}>{[...record.red.split(','), record.blue].filter(ball => parseInt(ball) % 2 !== 0).length}</span>
                        <span style={{ color: '#722ed1' }}>奇数</span>
                      </div>
                    </div>
                    
                    {/* 偶数数量进度条 */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ 
                        width: '100%', 
                        height: '8px', 
                        backgroundColor: '#52c41a',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div 
                          style={{
                            height: '100%',
                            backgroundColor: '#95de64',
                            borderRadius: '4px',
                            width: `${Math.min(100, Math.max(0, (([...record.red.split(','), record.blue].filter(ball => parseInt(ball) % 2 === 0).length - 0) / (7 - 0)) * 100))}%`,
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        fontSize: '12px',
                        color: '#888888'
                      }}>
                        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{[...record.red.split(','), record.blue].filter(ball => parseInt(ball) % 2 === 0).length}</span>
                        <span style={{ color: '#52c41a' }}>偶数</span>
                      </div>
                    </div>
                  </div>
                </div>
                

              </div>
            </Card>
          ))}
        </div>
        

      </Card>

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
        zIndex: 1000,
        padding: '0 20px',
        borderRadius: '12px',
        boxSizing: 'border-box',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.3)'
      }}>
        {/* 所有元素统一居中容器 */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
          {/* 左侧：图标 */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CloudFilled 
              style={{ fontSize: '24px', color: '#fff', cursor: 'pointer' }} 
            />
          </div>
          
          {/* 中间：筛选条件 */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', whiteSpace: 'nowrap' }}>
            <div 
              className="query-container"
              style={{
                // 背景颜色改为透明
                background: 'transparent',
                // 去掉阴影效果
                boxShadow: 'none',
                padding: '8px 12px',
                borderRadius: '16px', // 添加圆角
                zIndex: 10000, // 增加zIndex值，确保显示在最上层
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px', // 组件之间的间距
                userSelect: 'none',
                whiteSpace: 'nowrap'
              }}
            >
                {/* 日期筛选框 */}
                <div style={{ textAlign: 'center', margin: '0', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: '4px', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>
                    <div ref={startDatePickerRef} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
                      <DatePicker
                        style={{
                          width: '140px',
                          // 背景颜色改为透明
                          background: 'transparent',
                          borderColor: 'rgba(0, 0, 0, 0.1)',
                          borderRadius: '8px',
                          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
                          // 字体加粗
                          fontWeight: 'bold'
                        }}
                        popupStyle={{ zIndex: 12000 }}
                        value={startDate}
                        onChange={(date) => {
                          const newStartDate = date || dayjs();
                          setStartDate(newStartDate);
                          // 确保两个日期都有值才查询
                          if (endDate) {
                            const start = newStartDate.format('YYYY-MM-DD');
                            const end = endDate.format('YYYY-MM-DD');
                            fetchRecords(start, end, true);
                          }
                        }}
                        placeholder="开始日期"
                      />
                    </div>
                    <div ref={endDatePickerRef} style={{ display: 'inline-block' }}>
                      <DatePicker
                        style={{
                          width: '140px',
                          // 背景颜色改为透明
                          background: 'transparent',
                          borderColor: 'rgba(0, 0, 0, 0.1)',
                          borderRadius: '8px',
                          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
                          // 字体加粗
                          fontWeight: 'bold'
                        }}
                        popupStyle={{ zIndex: 12000 }}
                        value={endDate}
                        onChange={(date) => {
                          const newEndDate = date || dayjs();
                          setEndDate(newEndDate);
                          // 确保两个日期都有值才查询
                          if (startDate) {
                            const start = startDate.format('YYYY-MM-DD');
                            const end = newEndDate.format('YYYY-MM-DD');
                            fetchRecords(start, end, true);
                          }
                        }}
                        placeholder="结束日期"
                      />
                    </div>
                  </div>
                </div>
                
                {/* 期号筛选框 */}
                <div style={{ textAlign: 'center', margin: '0', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: '4px', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>
                    <Input
                      style={{
                        width: '100px',
                        textAlign: 'center',
                        // 背景颜色改为透明
                        background: 'transparent',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        borderRadius: '8px',
                        boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
                        // 字体加粗
                        fontWeight: 'bold'
                      }}
                      value={issueRange[0]}
                      onChange={(e) => handleInputChange(0, e.target.value)}
                      onPressEnter={handleIssueQuery}
                      onWheel={(e) => handleIssueWheel(e, 0)}
                      placeholder="开始期号"
                    />
                    <Input
                      style={{
                        width: '100px',
                        textAlign: 'center',
                        // 背景颜色改为透明
                        background: 'transparent',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        borderRadius: '8px',
                        boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
                        // 字体加粗
                        fontWeight: 'bold'
                      }}
                      value={issueRange[1]}
                      onChange={(e) => handleInputChange(1, e.target.value)}
                      onPressEnter={handleIssueQuery}
                      onWheel={(e) => handleIssueWheel(e, 1)}
                      placeholder="结束期号"
                    />
                  </div>
              </div>
            </div>
          </div>
          
          {/* 右侧：分页组件 */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', whiteSpace: 'nowrap' }}>
            {/* 分页组件 - 只有多于一页的时候才显示 */}
            {records.length > pageSize && (
              <div style={{ width: 'auto', textAlign: 'center', margin: '0', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', margin: '0 auto', whiteSpace: 'nowrap' }}>
                  {/* 第一页按钮 */}
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    style={{ 
                      padding: '4px 8px',
                      // 透明背景
                      background: 'transparent',
                      color: currentPage === 1 ? '#666' : '#fff',
                      border: '1px solid transparent',
                      borderRadius: '50%', // 将方形改为圆形
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      boxShadow: 'none'
                    }}
                  >
                    <StepBackwardOutlined />
                  </button>
                  
                  {/* 上一页按钮 */}
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    style={{ 
                      padding: '4px 8px',
                      // 透明背景
                      background: 'transparent',
                      color: currentPage === 1 ? '#666' : '#fff',
                      border: '1px solid transparent',
                      borderRadius: '50%', // 将方形改为圆形
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      boxShadow: 'none'
                    }}
                  >
                    <CaretLeftOutlined />
                  </button>
                  
                  {/* 记录总数显示 */}
                  <span style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>
                    共 {records.length} 条
                  </span>
                  {/* 页码显示 */}
                  <span style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>
                    {currentPage} / {Math.ceil(records.length / pageSize)}
                  </span>
                  
                  {/* 下一页按钮 */}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage * pageSize >= records.length}
                    style={{ 
                      padding: '4px 8px',
                      // 透明背景
                      background: 'transparent',
                      color: currentPage * pageSize >= records.length ? '#666' : '#fff',
                      border: '1px solid transparent',
                      borderRadius: '50%', // 将方形改为圆形
                      cursor: currentPage * pageSize >= records.length ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      boxShadow: 'none'
                    }}
                  >
                    <CaretRightOutlined />
                  </button>
                  
                  {/* 最后一页按钮 */}
                  <button
                    onClick={() => setCurrentPage(Math.ceil(records.length / pageSize))}
                    disabled={currentPage * pageSize >= records.length}
                    style={{ 
                      padding: '4px 8px',
                      // 透明背景
                      background: 'transparent',
                      color: currentPage * pageSize >= records.length ? '#666' : '#fff',
                      border: '1px solid transparent',
                      borderRadius: '50%', // 将方形改为圆形
                      cursor: currentPage * pageSize >= records.length ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      boxShadow: 'none'
                    }}
                  >
                    <StepForwardOutlined />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </footer>
    </>
  );
};

export default RecordList;
