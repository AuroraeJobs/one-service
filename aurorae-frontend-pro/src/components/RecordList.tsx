import { useState, useEffect, useRef } from 'react';
import { Card, message, DatePicker, Input } from 'antd';
import { CaretLeftOutlined, CaretRightOutlined, StepBackwardOutlined, StepForwardOutlined, AppleFilled } from '@ant-design/icons';
import dayjs from 'dayjs';
import { recordApi } from '../services/api';

// 记录类型定义
interface RecordItem {
  code: string;
  date: string;
  week: string;
  red: string;
  blue: string;
  sales: string;
  poolmoney: string;
}

// 查询参数类型定义
interface QueryParams {
  name?: string;
  dayStart?: string;
  dayEnd?: string;
  issueStart?: string;
  issueEnd?: string;
}

// RecordList组件的props接口
interface RecordListProps {
  isFilterVisible: boolean;
  setIsFilterVisible: (visible: boolean) => void;
}

const RecordList: React.FC<RecordListProps> = ({ isFilterVisible, setIsFilterVisible }) => {
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
  const pageSize = 20; // 4个/行 * 5行 = 20个
  
  // 筛选条件div拖动相关状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [filterPosition, setFilterPosition] = useState({
    x: '50%', // 默认居中
    y: 'auto',
    bottom: '64px' // 默认位于页脚上方
  });
  
  // 筛选条件div显示/隐藏状态从props获取

  // 切换筛选条件显示/隐藏
  const toggleFilterVisible = () => {
    setIsFilterVisible(!isFilterVisible);
  };

  // 使用ref防止useEffect在StrictMode下运行两次
  const hasFetchedRef = useRef(false);
  
  // 筛选条件div双击隐藏处理
  const handleFilterDoubleClick = () => {
    // 确保正确调用setIsFilterVisible，传递false值隐藏筛选条件div
    setIsFilterVisible(false);
    // 阻止事件冒泡，避免触发其他事件
    event?.stopPropagation();
  };
  
  // 时间筛选框滚轮事件处理
  const handleDateWheel = (e: React.WheelEvent, isStartDate: boolean) => {
    e.preventDefault();
    
    const currentDate = isStartDate ? startDate : endDate;
    let newDate;
    
    // 向上滚动是后一天，向下滚动是前一天
    if (e.deltaY < 0) {
      newDate = currentDate.add(1, 'day');
    } else {
      newDate = currentDate.subtract(1, 'day');
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
    
    // 向上滚动加一，向下滚动减一
    if (e.deltaY < 0) {
      issueNum += 1;
    } else {
      issueNum = Math.max(1, issueNum - 1);
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


  // 筛选条件div拖动事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      setFilterPosition({
        x: `${newX}px`,
        y: `${newY}px`,
        bottom: 'auto'
      });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // 添加全局事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove as unknown as EventListener);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove as unknown as EventListener);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);
  
  // 窗口大小变化时调整筛选条件div位置，确保不会超出屏幕
      useEffect(() => {
        const handleResize = () => {
          // 确保筛选条件div不会超出屏幕
          if (filterPosition.x !== '50%') {
            setFilterPosition(prev => ({
              ...prev,
              x: `${Math.max(0, Math.min(parseInt(prev.x.replace('px', '')), window.innerWidth - 480))}px`
            }));
          }
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }, [filterPosition]);

  // 获取记录数据
  const fetchRecords = (start: string, end: string, isDateRange = false) => {

    // 构建请求体
    const requestBody: QueryParams = {
      name: 'ssq', // 默认值
      ...(isDateRange
        ? {
            dayStart: start,
            dayEnd: end,
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
          const sortedData = data.sort((a: RecordItem, b: RecordItem) => {
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
  const debouncedFetchRecords = (start: string, end: string, isDateRange = false) => {
    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // 设置新的定时器，2秒后执行查询
    debounceTimerRef.current = setTimeout(() => {
      fetchRecords(start, end, isDateRange);
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
              // 计算开始期号：结束期号-21
              const startIssueNumber = Math.max(endIssueNumber - 21, 1); // 确保不小于1
              
              // 格式化为3位数字，不足补零
              const formattedStartIssueNumber = startIssueNumber.toString().padStart(3, '0');
              const formattedEndIssueNumber = endIssueNumber.toString().padStart(3, '0');
              
              const startIssue = `${year}${formattedStartIssueNumber}`;
              const endIssue = `${year}${formattedEndIssueNumber}`;
              
              // 设置期号范围：起始期号到结束期号
              setIssueRange([startIssue, endIssue]);
              // 自动查询
              fetchRecords(startIssue, endIssue);
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
    <div style={{ paddingTop: '20px', position: 'relative', paddingBottom: '64px' }}>
      {/* 记录列表 */}
      <Card bordered={false} style={{ width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', perspective: '1000px' }}>
          {records.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((record) => (
            <Card 
              key={record.code} 
              bordered={true} 
              style={{ 
                width: 'calc(25% - 12px)', 
                minWidth: '240px', 
                marginBottom: '16px',
                // 从左红色到右蓝色的渐变背景
                background: 'linear-gradient(90deg, rgba(245,34,45,0.15) 0%, rgba(255,255,255,0.1) 80%, rgba(24,144,255,0.15) 100%)',
                // 确保边框颜色与渐变协调
                borderColor: '#e8e8e8',
                // 添加圆角
                borderRadius: '12px',
                // 3d效果
                transformStyle: 'preserve-3d',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                // 光标悬停时产生中间往下弯曲，两边往上翘起的效果
                // 使用perspective创建3D空间，rotateX负值让中间向下弯曲
                transform: hoveredCard === record.code 
                  ? 'perspective(1000px) rotateX(-10deg) translateZ(15px)' 
                  : 'perspective(1000px) rotateX(0deg) translateZ(0)',
                // 增强厚度视觉效果 - 多层阴影模拟真实厚度
                boxShadow: hoveredCard === record.code 
                  ? '0 8px 16px rgba(0, 0, 0, 0.1), 0 24px 48px rgba(0, 0, 0, 0.15), 0 32px 64px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)' 
                  : '0 4px 8px rgba(0, 0, 0, 0.08), 0 12px 24px rgba(0, 0, 0, 0.12), 0 16px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                // 增强边框效果，进一步提升厚度感
                border: '1px solid rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={() => setHoveredCard(record.code)}
              onMouseLeave={() => setHoveredCard(null)}>
            
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* 期号和日期 */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{record.code}</h4>
                  <span style={{ fontSize: '14px', color: '#666' }}>{record.date} {record.week}</span>
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
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#f5222d',
                          color: '#fff',
                          textAlign: 'center',
                          lineHeight: '32px',
                          fontSize: '14px',
                          fontWeight: 'bold',
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
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#1890ff',
                        color: '#fff',
                        textAlign: 'center',
                        lineHeight: '32px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                      }}
                    >
                      {record.blue}
                    </span>
                  </div>
                </div>
                

              </div>
            </Card>
          ))}
        </div>
        

      </Card>

      {/* 可拖动的查询条件和分页区域 */}
      {isFilterVisible && (
        <div 
          className="query-container"
          style={{
            position: 'fixed',
            left: filterPosition.x,
            top: filterPosition.y,
            bottom: filterPosition.bottom,
            transform: filterPosition.x === '50%' ? 'translateX(-50%)' : 'none',
            // 左边从左往右红色渐变，右边从右往左蓝色渐变，进一步增加透明度
            background: 'linear-gradient(90deg, rgba(245,34,45,0.6) 0%, rgba(255,255,255,0.8) 45%, rgba(255,255,255,0.8) 55%, rgba(24,144,255,0.6) 100%)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            padding: '12px 16px',
            borderRadius: '16px', // 添加圆角
            zIndex: 10000, // 增加zIndex值，确保显示在最上层
            // 移除overflowY和maxHeight，避免日期弹出框被裁剪
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px', // 组件之间的间距
            minWidth: '480px', // 减小最小宽度
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            touchAction: 'none'
          }}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleFilterDoubleClick}
        >
          {/* 分页组件行 - 单独占一行，只有多于一页的时候才显示 */}
          {records.length > pageSize && (
            <div style={{ width: '100%', textAlign: 'center', margin: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', margin: '0 auto' }}>
                {/* 第一页按钮 */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  style={{ 
                    padding: '4px 8px',
                    // 去掉渐变色，使用简单纯色
                    background: currentPage === 1 ? '#f5f5f5' : '#ffffff',
                    color: currentPage === 1 ? '#999' : '#333',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '50%', // 将方形改为圆形
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)'
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
                    // 去掉渐变色，使用简单纯色
                    background: currentPage === 1 ? '#f5f5f5' : '#ffffff',
                    color: currentPage === 1 ? '#999' : '#333',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '50%', // 将方形改为圆形
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)'
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
                    // 去掉渐变色，使用简单纯色
                    background: currentPage * pageSize >= records.length ? '#f5f5f5' : '#ffffff',
                    color: currentPage * pageSize >= records.length ? '#999' : '#333',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '50%', // 将方形改为圆形
                    cursor: currentPage * pageSize >= records.length ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)'
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
                    // 去掉渐变色，使用简单纯色
                    background: currentPage * pageSize >= records.length ? '#f5f5f5' : '#ffffff',
                    color: currentPage * pageSize >= records.length ? '#999' : '#333',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '50%', // 将方形改为圆形
                    cursor: currentPage * pageSize >= records.length ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <StepForwardOutlined />
                </button>
              </div>
            </div>
          )}
          
          {/* 筛选条件行 */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* 日期筛选框 */}
            <div style={{ textAlign: 'center', margin: '8px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'row', gap: '4px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                <div ref={startDatePickerRef} style={{ display: 'inline-block' }}>
                  <DatePicker
                    style={{
                      width: '140px',
                      // 为日期选择器添加类似的渐变效果和透明度
                      background: 'linear-gradient(90deg, rgba(245,34,45,0.2) 0%, rgba(255,255,255,0.85) 45%, rgba(255,255,255,0.85) 55%, rgba(24,144,255,0.2) 100%)',
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
                      // 为日期选择器添加类似的渐变效果和透明度
                      background: 'linear-gradient(90deg, rgba(245,34,45,0.2) 0%, rgba(255,255,255,0.85) 45%, rgba(255,255,255,0.85) 55%, rgba(24,144,255,0.2) 100%)',
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
            <div style={{ textAlign: 'center', margin: '8px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'row', gap: '4px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Input
                  style={{
                    width: '100px',
                    textAlign: 'center',
                    // 为期号输入框添加类似的渐变效果和透明度
                    background: 'linear-gradient(90deg, rgba(245,34,45,0.2) 0%, rgba(255,255,255,0.85) 45%, rgba(255,255,255,0.85) 55%, rgba(24,144,255,0.2) 100%)',
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
                    // 为期号输入框添加类似的渐变效果和透明度
                    background: 'linear-gradient(90deg, rgba(245,34,45,0.2) 0%, rgba(255,255,255,0.85) 45%, rgba(255,255,255,0.85) 55%, rgba(24,144,255,0.2) 100%)',
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
      )}
      
      {/* 页脚 */}
      <footer className="app-footer" style={{ 
        textAlign: 'center', 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        height: '64px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#fff',
        zIndex: 1000
      }}>
        <AppleFilled 
          style={{ fontSize: '24px', color: '#000', cursor: 'pointer' }} 
          onClick={toggleFilterVisible}
        />
      </footer>
    </div>
  );
};

export default RecordList;
