import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Statistic, Progress, Spin, Tabs, Slider, message, Tooltip } from 'antd';
import {
  BarChartOutlined,
  PieChartOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
  FastBackwardOutlined,
  FastForwardOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  AreaChartOutlined,
  WomanOutlined,
  ManOutlined,
  SettingOutlined,
  StarFilled,
  AppstoreOutlined,
  ClearOutlined,
  AppstoreAddOutlined
} from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { recordApi } from '../services/api';
// 导入 ECharts
import ReactECharts from 'echarts-for-react';

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

// 移除未使用的TabPane声明



const Statistics: React.FC = () => {
  // 获取当前路由
  const location = useLocation();
  
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [redBallFrequency, setRedBallFrequency] = useState<AnalysisResult>({});
  const [blueBallFrequency, setBlueBallFrequency] = useState<AnalysisResult>({});
  const [redBallOddEven, setRedBallOddEven] = useState<AnalysisResult>({});
  const [redBallSize, setRedBallSize] = useState<AnalysisResult>({});
  const [blueBallOddEven, setBlueBallOddEven] = useState<AnalysisResult>({});
  const [blueBallSize, setBlueBallSize] = useState<AnalysisResult>({});
  // 最后一期中奖号码出现次数总和统计
  const [lastWinningNumbersTotalRed, setLastWinningNumbersTotalRed] = useState<AnalysisResult>({});
  const [lastWinningNumbersTotalBlue, setLastWinningNumbersTotalBlue] = useState<AnalysisResult>({});
  // 分组统计数据状态
  const [specialRedStats, setSpecialRedStats] = useState<{
    individual: AnalysisResult; // 每个号码出现次数
    groups: AnalysisResult; // 每组出现总次数
    absentCounts: { [key: string]: number }; // 每个号码距离上次出现之后累计没出现的次数
  }>({ individual: {}, groups: {}, absentCounts: {} });
  const [specialBlueStats, setSpecialBlueStats] = useState<{
    individual: AnalysisResult; // 每个号码出现次数
    groups: AnalysisResult; // 每组出现总次数
    absentCounts: { [key: string]: number }; // 每个号码距离上次出现之后累计没出现的次数
  }>({ individual: {}, groups: {}, absentCounts: {} });
  // 滑块相关状态
  const [allRecords, setAllRecords] = useState<string[]>([]);
  const [sliderRange, setSliderRange] = useState<[number, number]>([0, 0]);
  // 统计类型切换状态
  const [statisticType, setStatisticType] = useState<'red' | 'blue'>('red');
  // 结束行中奖号码状态
  const [endLineNumbers, setEndLineNumbers] = useState<string[]>([]);
  // 控制是否只显示最后一期中奖号码的状态
  const [showOnlyLastWinning, setShowOnlyLastWinning] = useState(true);
  // 使用ref防止useEffect在StrictMode下运行两次
  const hasFetchedRef = useRef(false);
  // 切换按钮拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  // 滑块隐藏图标拖拽状态
  const [isHiddenIconDragging, setIsHiddenIconDragging] = useState(false);
  // 滑块隐藏图标初始位置，放在切换按钮上方
  const [hiddenIconPosition, setHiddenIconPosition] = useState({
    x: window.innerWidth - 90, // 右侧20px，圆心在window.innerWidth - 65px
    y: window.innerHeight - 130 // 底部80px，位于切换按钮上方，间距10px
  });
  const [hiddenIconDragOffset, setHiddenIconDragOffset] = useState({ x: 0, y: 0 });
  
  // 切换按钮初始位置，放在右下角最下面
  const [buttonPosition, setButtonPosition] = useState({ 
    x: window.innerWidth - 105, // 右侧20px，竖直中心线在window.innerWidth - 65px
    y: window.innerHeight - 70 // 底部20px
  });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // 滑块区域拖拽状态
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  // 初始化滑块位置为右下角，避免遮挡页脚图标
  const [sliderPosition, setSliderPosition] = useState({
    x: window.innerWidth - window.innerWidth / 3 - 20, // 距离右侧20px
    y: window.innerHeight - 150 - 80 // 距离底部80px
  });
  const [sliderDragOffset, setSliderDragOffset] = useState({ x: 0, y: 0 });
  // 控制滑块是否处于固定定位状态 - 默认始终固定定位
  const [isSliderFixed, setIsSliderFixed] = useState(true);
  // 滑块缩放状态
  const [isResizing, setIsResizing] = useState(false);
  // 初始化滑块尺寸为页面宽度的1/3
  const [sliderSize, setSliderSize] = useState({ 
    width: window.innerWidth / 3, 
    height: 150 
  });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  // 滑块隐藏状态 - 默认隐藏
  const [isSliderHidden, setIsSliderHidden] = useState(true);
  // 滑块双击隐藏事件
  const handleSliderDoubleClick = () => {
    setIsSliderHidden(!isSliderHidden);
  };
  

  
  // 跟踪选中号码 - 支持多选
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  // 控制号码选择器的显示/隐藏
  const [showNumberSelector, setShowNumberSelector] = useState(false);
  // 悬浮元素拖动状态管理
  const [isSelectorDragging, setIsSelectorDragging] = useState(false);
  const [isButtonDragging, setIsButtonDragging] = useState(false);
  // 初始位置不要贴在右侧，居中偏左位置
  const [selectorPosition, setSelectorPosition] = useState({ x: 200, y: 100 });
  // 初始位置在滑块按钮上方
  const [floatingButtonPosition, setFloatingButtonPosition] = useState({
    x: window.innerWidth - 90, // 圆心在window.innerWidth - 65px，与滑块按钮水平对齐
    y: window.innerHeight - 190 // 在滑块按钮上方，间距10px
  });
  const [selectorDragOffset, setSelectorDragOffset] = useState({ x: 0, y: 0 });
  const [buttonDragOffset, setButtonDragOffset] = useState({ x: 0, y: 0 });
  // 图表数据状态 - 存储选中号码每期的累计次数
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);

  
  // 图表数据控制 - 显示所有数据，去掉分页逻辑

  // 监听路由变化，当路由为/charts时默认显示图表统计
  useEffect(() => {
    if (location.pathname === '/charts') {
      // 根据当前统计类型设置对应的图表tab key
      setActiveTabKey(statisticType === 'red' ? '7' : '8');
    }
  }, [location.pathname, statisticType]);

  
  // 窗口大小变化时更新滑块初始大小（如果窗口变得太小）以及调整所有悬浮元素位置
  useEffect(() => {
    const handleResize = () => {
      // 如果窗口宽度小于当前滑块宽度的2倍，调整滑块宽度
      if (window.innerWidth < sliderSize.width * 2) {
        setSliderSize(prev => ({
          ...prev,
          width: window.innerWidth / 3
        }));
      }
      
      // 始终保持距离底部80px，避免遮挡页脚图标
      setSliderPosition(prev => ({
        ...prev,
        y: window.innerHeight - sliderSize.height - 80
      }));

      // 计算按钮中心位置：所有按钮的圆心或竖直中心线应该在同一条竖线上
      // 圆形按钮（50px直径）的圆心位置：x + 25px
      // 切换按钮（80px宽）的竖直中心线：x + 40px
      // 为了对齐，将所有按钮的中心位置设置为 window.innerWidth - 65px
      // 因此：
      // - 圆形按钮的x坐标：window.innerWidth - 65px - 25px = window.innerWidth - 90px
      // - 切换按钮的x坐标：window.innerWidth - 65px - 40px = window.innerWidth - 105px
      
      // 计算统一的y坐标，确保垂直布局
      const buttonY = window.innerHeight - 70; // 切换按钮在最底部
      const hiddenIconY = window.innerHeight - 130; // 滑块隐藏图标在切换按钮上方
      const floatingButtonY = window.innerHeight - 190; // 显示/隐藏号码选择器按钮在滑块按钮上方

      // 调整显示/隐藏号码选择器按钮的位置，无论窗口放大还是缩小，都保持统一位置
      setFloatingButtonPosition({
        x: window.innerWidth - 90, // 圆心在window.innerWidth - 65px
        y: floatingButtonY // 始终保持在滑块按钮上方
      });

      // 调整滑块隐藏图标的位置，无论窗口放大还是缩小，都保持统一位置
      setHiddenIconPosition({
        x: window.innerWidth - 90, // 圆心在window.innerWidth - 65px
        y: hiddenIconY // 始终保持在切换按钮上方
      });

      // 调整切换按钮的位置，无论窗口放大还是缩小，都保持统一位置
      setButtonPosition({
        x: window.innerWidth - 105, // 竖直中心线在window.innerWidth - 65px
        y: buttonY // 始终保持在最底部
      });

      // 调整号码选择器的位置，确保不超出窗口边界
      // 红球选择器尺寸：340px宽，360px高 + 16px*2内边距 = 392px高
      // 蓝球选择器尺寸：350px宽，220px高 + 16px*2内边距 = 252px高
      const isRed = statisticType === 'red';
      const selectorHeight = isRed ? 392 : 252;
      
      setSelectorPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 20), // 右侧留20px边距
        y: Math.min(prev.y, window.innerHeight - selectorHeight - 20) // 底部留20px边距
      }));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sliderSize.height, sliderSize.width, statisticType]);

  // 切换按钮拖拽事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - buttonPosition.x,
      y: e.clientY - buttonPosition.y
    });
  };

  // 隐藏图标拖拽事件处理
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
      
      // 限制按钮在视窗内
      const maxX = window.innerWidth - 70; // 按钮宽度约70px
      const maxY = window.innerHeight - 50; // 按钮高度约50px
      
      setButtonPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    } else if (isHiddenIconDragging) {
      const newX = e.clientX - hiddenIconDragOffset.x;
      const newY = e.clientY - hiddenIconDragOffset.y;
      
      // 限制隐藏图标在视窗内
      const maxX = window.innerWidth - 50; // 隐藏图标宽度50px
      const maxY = window.innerHeight - 50; // 隐藏图标高度50px
      
      setHiddenIconPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
  
    } else if (isSliderDragging) {
      const newX = e.clientX - sliderDragOffset.x;
      const newY = e.clientY - sliderDragOffset.y;
      
      // 限制滑块区域在视窗内
      const maxX = window.innerWidth - sliderSize.width;
      const maxY = window.innerHeight - sliderSize.height;
      
      setSliderPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    } else if (isResizing) {
      const newWidth = e.clientX - resizeStart.x + resizeStart.width;
      const newHeight = e.clientY - resizeStart.y + resizeStart.height;
      
      // 限制最小和最大尺寸
      const minWidth = 300;
      const minHeight = 100;
      const maxWidth = window.innerWidth - 50;
      const maxHeight = window.innerHeight - 50;
      
      setSliderSize({
        width: Math.max(minWidth, Math.min(newWidth, maxWidth)),
        height: Math.max(minHeight, Math.min(newHeight, maxHeight))
      });
    } else if (isSelectorDragging) {
      // 拖动号码选择器，允许拖动到页面任意位置，无边界限制
      const newX = e.clientX - selectorDragOffset.x;
      const newY = e.clientY - selectorDragOffset.y;
      
      // 完全自由拖动，无边界限制
      setSelectorPosition({
        x: newX,
        y: newY
      });
    } else if (isButtonDragging) {
      // 拖动显示/隐藏按钮
      const newX = e.clientX - buttonDragOffset.x;
      const newY = e.clientY - buttonDragOffset.y;
      
      // 限制在视窗内
      const maxX = window.innerWidth - 150; // 按钮宽度约150px
      const maxY = window.innerHeight - 40; // 按钮高度约40px
      
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

  // 当统计类型切换时，调整号码选择器位置，防止超出页面底部
  useEffect(() => {
    if (showNumberSelector) {
      const isRed = statisticType === 'red';
      const containerHeight = isRed ? 360 : 220;
      const padding = 16;
      const totalHeight = containerHeight + padding * 2;
      
      // 检查当前位置是否导致底部超出页面
      if (selectorPosition.y + totalHeight > window.innerHeight) {
        // 调整位置，确保底部距离页面底部20px
        setSelectorPosition(prev => ({
          ...prev,
          y: window.innerHeight - totalHeight - 20
        }));
      }
    }
  }, [statisticType, showNumberSelector, selectorPosition]);

  // 滑块区域拖拽事件处理
  const handleSliderMouseDown = (e: React.MouseEvent) => {
    // 只有在首次拖拽时才设置为固定定位
    if (!isSliderFixed) {
      setIsSliderFixed(true);
      // 初始化位置为当前元素的位置
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

  // 红球号码映射配置
  const redBallConfig = {
    // 号码到名字的映射
    numberToName: {
      '01': '薛宝钗', '02': '贾元春', '03': '贾探春', '04': '史湘云', '05': '妙玉',
      '06': '贾迎春', '07': '贾惜春', '08': '王熙凤', '09': '贾巧姐', '10': '李纨',
      '11': '秦可卿', '12': '薛宝琴', '13': '尤二姐', '14': '尤三姐', '15': '邢岫烟',
      '16': '李纹', '17': '李绮', '18': '夏金桂', '19': '秋桐', '20': '小红',
      '21': '龄官', '22': '娇杏', '23': '袭人', '24': '平儿', '25': '鸳鸯',
      '26': '紫鹃', '27': '莺儿', '28': '玉钏', '29': '金钏', '30': '彩云',
      '31': '司棋', '32': '芳官', '33': '麝月'
    },
    // 分组配置
    groups: [
      { name: '林黛玉', numbers: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'] },
      { name: '香菱', numbers: ['12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22'] },
      { name: '晴雯', numbers: ['23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33'] }
    ]
  };

  // 蓝球号码映射配置
  const blueBallConfig = {
    // 号码到名字的映射
    numberToName: {
      '01': '雨水', '02': '惊蛰', '03': '清明', '04': '谷雨',
      '05': '小满', '06': '芒种', '07': '小暑', '08': '大暑',
      '09': '处暑', '10': '白露', '11': '寒露', '12': '霜降',
      '13': '小雪', '14': '大雪', '15': '小寒', '16': '大寒'
    },
    // 分组配置
    groups: [
      { name: '立春', numbers: ['01', '02'] },
      { name: '春分', numbers: ['03', '04'] },
      { name: '立夏', numbers: ['05', '06'] },
      { name: '夏至', numbers: ['07', '08'] },
      { name: '立秋', numbers: ['09', '10'] },
      { name: '秋分', numbers: ['11', '12'] },
      { name: '立冬', numbers: ['13', '14'] },
      { name: '冬至', numbers: ['15', '16'] }
    ]
  };

  // 计算选中号码的出现记录
  // 移除不再使用的calculateNumberRecords函数

  // 移除图表相关代码


  // 处理号码选择
  const handleNumberSelect = (number: string) => {
    // 计算新的选中号码列表
    const newSelectedNumbers = selectedNumbers.includes(number) 
      ? selectedNumbers.filter(n => n !== number) 
      : [...selectedNumbers, number];
    
    // 直接设置选中号码
    setSelectedNumbers(newSelectedNumbers);
    
    // 无需设置chartWindowStart，已去掉分页逻辑
  };

  // 清除所有选择
  const clearAllSelections = () => {
    setSelectedNumbers([]);
    // 无需设置chartWindowStart，已去掉分页逻辑
  };

  // 生成所有可能的号码列表
  const generateNumberList = () => {
    if (statisticType === 'red') {
      // 红球号码：01-33
      return Array.from({ length: 33 }, (_, i) => {
        const num = i + 1;
        return num < 10 ? `0${num}` : `${num}`;
      });
    } else {
      // 蓝球号码：01-16
      return Array.from({ length: 16 }, (_, i) => {
        const num = i + 1;
        return num < 10 ? `0${num}` : `${num}`;
      });
    }
  };

  // 渲染号码选择器 - 固定大小，类似滑块操作面板
  const renderNumberSelector = () => {
    const numbers = generateNumberList();
    const currentColor = statisticType === 'red' ? '#f5222d' : '#1890ff';
    
    // 根据统计类型设置不同的布局
    const isRed = statisticType === 'red';
    
    // 红球：33个号码，每行6个，显示6行
    // 蓝球：16个号码，保持原有布局
    const containerWidth = isRed ? '340px' : '350px'; // 增加红球容器宽度，确保每行能显示6个号码
    const containerHeight = isRed ? '360px' : '220px'; // 增加容器高度，确保底部有足够空间
    const itemWidth = isRed ? '40px' : '40px';
    const itemHeight = isRed ? '40px' : '40px';
    const gap = isRed ? '6px' : '8px'; // 减少红球号码间距，确保每行能显示6个号码

    return (
      <div style={{
        width: containerWidth, // 固定宽度
        height: containerHeight, // 固定高度
        padding: '16px',
        backgroundColor: '#fff',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
        overflow: 'hidden', // 红球选择器不需要滚动，蓝球可能需要
        userSelect: 'none',
        touchAction: 'none',
        display: 'flex', // 使用flex布局
        flexDirection: 'column', // 垂直方向排列
        alignItems: 'center', // 水平居中对齐
        border: '1px solid #d9d9d9' // 添加白色边框，与Ant Design样式保持一致
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
          gap: gap, // 使用动态间距
          padding: '12px 12px 32px 12px', // 增加底部内边距到32px，增加与容器底部的距离
          backgroundColor: '#fafafa',
          borderRadius: '4px',
          justifyContent: 'center', // 号码在容器内居中显示
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
                flexShrink: 0 // 防止号码被压缩
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

    // 处理图表数据，转换为ECharts所需格式
    // 获取所有唯一的期数
    const periods = [...new Set(chartData.map(item => item.period))].sort((a, b) => a - b);
    
    // 获取所有选中的号码
    const numbers = [...new Set(chartData.map(item => item.number))];
    
    // 颜色配置
    const colors = [
      '#1890ff', '#f5222d', '#52c41a', '#faad14', '#722ed1',
      '#13c2c2', '#fa8c16', '#eb2f96', '#a0d911', '#2f54eb',
      '#ff7875', '#52c41a', '#13c2c2', '#722ed1', '#faad14',
      '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb', '#1890ff'
    ];
    
    // 构建ECharts系列数据
    const series = numbers.map((number) => {
      // 为每个号码构建数据数组，按期数顺序排列
      const data = periods.map(period => {
        const item = chartData.find(item => item.period === period && item.number === number);
        return item ? item.count : 0;
      });
      
      return {
        name: number,
        type: 'line',
        data: data,
        itemStyle: {
          // 为每个号码分配固定颜色，使用号码的数值作为颜色索引
          color: colors[Number(number) % colors.length]
        },
        lineStyle: {
          width: 3,
          type: 'solid'
        },
        symbol: 'circle',
        symbolSize: 8,
        symbolRotate: 0,
        emphasis: {
          focus: 'series',
          scale: true,
          symbolSize: 12,
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        },
        label: {
          show: false
        },
        smooth: false
      };
    });
    
    // ECharts配置项
    const option = {
      animation: false, // 关闭初始动画
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params: any) {
          let result = `${params[0].axisValue}期<br/>`;
          params.forEach((param: any) => {
            result += `${param.marker}${param.seriesName}: ${param.value}次<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: numbers,
        top: 0,
        textStyle: {
          fontSize: 12
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '8%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          data: periods,
          axisLabel: {
            fontSize: 12,
            rotate: 45
          },
          axisLine: {
            lineStyle: {
              color: '#f0f0f0'
            }
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: '#f0f0f0'
            }
          },
          name: '期数',
          nameTextStyle: {
            fontSize: 14,
            fontWeight: 'bold'
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
              color: '#f0f0f0'
            }
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: '#f0f0f0'
            }
          }
        }
      ],
      series: series
    };

    return (
      <div 
        style={{ 
          backgroundColor: '#fff',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
          padding: '16px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* 显示所有期数信息 */}
        {/* 删除了显示期数的文本 */}
        
        {/* 图表容器 */}
        <div 
          style={{ 
            height: '400px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
          <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>
    );
  };

  // 渲染号码选择器相关功能
  const renderChartStats = () => {
    const currentColor = statisticType === 'red' ? '#f5222d' : '#1890ff';
    const isRed = statisticType === 'red'; // 在函数内部定义isRed变量

    return (
      <div style={{ 
        padding: '16px', 
        position: 'relative',
        width: '100%', // 确保容器宽度为100%
        maxWidth: '100%', // 确保最大宽度为100%
        boxSizing: 'border-box' // 确保padding不会影响宽度
      }}>
        {/* 平滑折线图 */}
        <div style={{ 
          marginBottom: '20px',
          width: '100%', // 确保图表容器宽度为100%
          boxSizing: 'border-box' // 确保padding不会影响宽度
        }}>
          {renderLineChart()}
        </div>
        
        {/* 号码选择器隐藏时，显示圆形图标按钮 - 类似滑块隐藏按钮 */}
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
              // 显示号码选择器时根据按钮位置调整显示位置
              // 确保选择器不会超出页面底部
              const isButtonOnRight = floatingButtonPosition.x > window.innerWidth / 2;
              // 使用更新后的选择器高度
              const selectorWidth = isRed ? 340 : 350;
              const selectorHeight = isRed ? 360 : 220;
              
              const newX = isButtonOnRight 
                ? floatingButtonPosition.x - selectorWidth - 20 // 左侧20px间距
                : floatingButtonPosition.x + 50 + 20; // 右侧20px间距，按钮宽度50px
              
              // 计算Y位置，确保选择器不会超出页面底部，且底部有足够间距
              let newY = floatingButtonPosition.y - selectorHeight / 2 + 25; // 垂直居中
              // 如果底部超出页面，则向上调整，距离底部至少40px
              if (newY + selectorHeight > window.innerHeight) {
                newY = window.innerHeight - selectorHeight - 40; // 距离底部40px
              }
              // 如果顶部超出页面，则向下调整，距离顶部20px
              if (newY < 0) {
                newY = 20; // 距离顶部20px
              }
              
              setSelectorPosition({
                x: Math.max(0, newX), // 只限制左侧，右侧不限制
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
          // 号码选择器显示时，显示完整的选择器组件
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

  // 解析记录数据
  const parseRecords = (records: string[]) => {
    // 红球号码统计
    const redBallCount: { [key: string]: number } = {};
    // 蓝球号码统计
    const blueBallCount: { [key: string]: number } = {};
    // 红球奇偶统计
    const redOddEvenCount = { odd: 0, even: 0 };
    // 红球大小统计
    const redSizeCount = { small: 0, large: 0 };
    // 蓝球奇偶统计
    const blueOddEvenCount = { odd: 0, even: 0 };
    // 蓝球大小统计
    const blueSizeCount = { small: 0, large: 0 };

    let totalRedBalls = 0;
    let totalBlueBalls = 0;

    // 计算每个号码距离上次出现之后累计没出现的次数
    // 记录每个号码最后一次出现的位置
    const redBallLastPosition: { [key: string]: number } = {};
    const blueBallLastPosition: { [key: string]: number } = {};
    // 记录每个号码连续未出现的次数
    const redBallAbsentCounts: { [key: string]: number } = {};
    const blueBallAbsentCounts: { [key: string]: number } = {};

    // 初始化所有号码的连续未出现次数为0
    for (let i = 1; i <= 33; i++) {
      const number = i < 10 ? `0${i}` : `${i}`;
      redBallAbsentCounts[number] = 0;
    }
    for (let i = 1; i <= 16; i++) {
      const number = i < 10 ? `0${i}` : `${i}`;
      blueBallAbsentCounts[number] = 0;
    }

    // 解析每条记录
    records.forEach((record, recordIndex) => {
      if (record.length < 14) return;

      // 获取当前记录中的红球和蓝球
      const currentRedBalls: string[] = [];
      for (let i = 0; i < 12; i += 2) {
        currentRedBalls.push(record.substring(i, i + 2));
      }
      const currentBlueBall = record.substring(12, 14);

      // 更新所有红球的连续未出现次数
      for (let i = 1; i <= 33; i++) {
        const number = i < 10 ? `0${i}` : `${i}`;
        // 如果当前记录包含该号码，重置连续未出现次数并更新最后出现位置
        if (currentRedBalls.includes(number)) {
          redBallAbsentCounts[number] = 0;
          redBallLastPosition[number] = recordIndex;
        } else {
          // 如果当前记录不包含该号码，且该号码曾经出现过，增加连续未出现次数
          if (redBallLastPosition[number] !== undefined) {
            redBallAbsentCounts[number]++;
          }
        }
      }

      // 更新所有蓝球的连续未出现次数
      for (let i = 1; i <= 16; i++) {
        const number = i < 10 ? `0${i}` : `${i}`;
        // 如果当前记录包含该号码，重置连续未出现次数并更新最后出现位置
        if (currentBlueBall === number) {
          blueBallAbsentCounts[number] = 0;
          blueBallLastPosition[number] = recordIndex;
        } else {
          // 如果当前记录不包含该号码，且该号码曾经出现过，增加连续未出现次数
          if (blueBallLastPosition[number] !== undefined) {
            blueBallAbsentCounts[number]++;
          }
        }
      }

      // 解析红球：前12位，每两位一个号码
      for (let i = 0; i < 12; i += 2) {
        const redBall = record.substring(i, i + 2);
        redBallCount[redBall] = (redBallCount[redBall] || 0) + 1;
        totalRedBalls++;
        
        // 统计红球奇偶
        const redNum = parseInt(redBall);
        if (redNum % 2 === 0) {
          redOddEvenCount.even++;
        } else {
          redOddEvenCount.odd++;
        }
        
        // 统计红球大小（1-16为小，17-33为大）
        if (redNum <= 16) {
          redSizeCount.small++;
        } else {
          redSizeCount.large++;
        }
      }

      // 解析蓝球：最后两位
      const blueBall = record.substring(12, 14);
      blueBallCount[blueBall] = (blueBallCount[blueBall] || 0) + 1;
      totalBlueBalls++;
      
      // 统计蓝球奇偶
      const blueNum = parseInt(blueBall);
      if (blueNum % 2 === 0) {
        blueOddEvenCount.even++;
      } else {
        blueOddEvenCount.odd++;
      }
      
      // 统计蓝球大小（1-8为小，9-16为大）
      if (blueNum <= 8) {
        blueSizeCount.small++;
      } else {
        blueSizeCount.large++;
      }
    });

    // 计算百分比
    const calculatePercent = (count: number, total: number) => {
      return Math.round((count / total) * 100);
    };

    // 处理红球频率结果 - 确保所有33个红球号码都被统计
    const redBallResult: AnalysisResult = {};
    for (let i = 1; i <= 33; i++) {
      const number = i < 10 ? `0${i}` : `${i}`;
      redBallResult[number] = {
        count: redBallCount[number] || 0,
        percent: calculatePercent(redBallCount[number] || 0, totalRedBalls)
      };
    }

    // 处理蓝球频率结果 - 确保所有16个蓝球号码都被统计
    const blueBallResult: AnalysisResult = {};
    for (let i = 1; i <= 16; i++) {
      const number = i < 10 ? `0${i}` : `${i}`;
      blueBallResult[number] = {
        count: blueBallCount[number] || 0,
        percent: calculatePercent(blueBallCount[number] || 0, totalBlueBalls)
      };
    }

    // 处理红球奇偶结果
    const redOddEvenResult: AnalysisResult = {
      odd: {
        count: redOddEvenCount.odd,
        percent: calculatePercent(redOddEvenCount.odd, totalRedBalls)
      },
      even: {
        count: redOddEvenCount.even,
        percent: calculatePercent(redOddEvenCount.even, totalRedBalls)
      }
    };

    // 处理红球大小结果
    const redSizeResult: AnalysisResult = {
      small: {
        count: redSizeCount.small,
        percent: calculatePercent(redSizeCount.small, totalRedBalls)
      },
      large: {
        count: redSizeCount.large,
        percent: calculatePercent(redSizeCount.large, totalRedBalls)
      }
    };

    // 处理蓝球奇偶结果
    const blueOddEvenResult: AnalysisResult = {
      odd: {
        count: blueOddEvenCount.odd,
        percent: calculatePercent(blueOddEvenCount.odd, totalBlueBalls)
      },
      even: {
        count: blueOddEvenCount.even,
        percent: calculatePercent(blueOddEvenCount.even, totalBlueBalls)
      }
    };

    // 处理蓝球大小结果
    const blueSizeResult: AnalysisResult = {
      small: {
        count: blueSizeCount.small,
        percent: calculatePercent(blueSizeCount.small, totalBlueBalls)
      },
      large: {
        count: blueSizeCount.large,
        percent: calculatePercent(blueSizeCount.large, totalBlueBalls)
      }
    };

    // 处理最后一期中奖号码统计
    if (records.length > 0) {
      const lastRecord = records[records.length - 1];
      if (lastRecord && lastRecord.length >= 14) {
        // 解析最后一期红球：前12位，每两位一个号码
        const lastRedBalls: string[] = [];
        for (let i = 0; i < 12; i += 2) {
          lastRedBalls.push(lastRecord.substring(i, i + 2));
        }
        // 解析最后一期蓝球：最后两位
        const lastBlueBall = lastRecord.substring(12, 14);

        // 生成所有可能的红球号码（01-33）
        const allRedBalls = Array.from({ length: 33 }, (_, i) => {
          const num = i + 1;
          return num < 10 ? `0${num}` : `${num}`;
        });
        // 生成所有可能的蓝球号码（01-16）
        const allBlueBalls = Array.from({ length: 16 }, (_, i) => {
          const num = i + 1;
          return num < 10 ? `0${num}` : `${num}`;
        });

        // 处理最后一期红球出现次数总和
        const totalRedCount = lastRedBalls.reduce((sum, redBall) => sum + (redBallCount[redBall] || 0), 0);

        // 处理最后一期红球未中奖号码统计
        const nonWinningRedBalls = allRedBalls.filter(redBall => !lastRedBalls.includes(redBall));
        const nonWinningRedCount = nonWinningRedBalls.reduce((sum, redBall) => sum + (redBallCount[redBall] || 0), 0);
        setLastWinningNumbersTotalRed({
          'total': {
            count: totalRedCount,
            percent: calculatePercent(totalRedCount, totalRedBalls)
          },
          'non_winning_total': {
            count: nonWinningRedCount,
            percent: calculatePercent(nonWinningRedCount, totalRedBalls)
          }
        });

        // 处理最后一期蓝球出现次数总和
        // 处理最后一期蓝球未中奖号码统计
        const nonWinningBlueBalls = allBlueBalls.filter(blueBall => blueBall !== lastBlueBall);
        const nonWinningBlueCount = nonWinningBlueBalls.reduce((sum, blueBall) => sum + (blueBallCount[blueBall] || 0), 0);
        setLastWinningNumbersTotalBlue({
          'total': {
            count: blueBallCount[lastBlueBall] || 0,
            percent: calculatePercent(blueBallCount[lastBlueBall] || 0, totalBlueBalls)
          },
          'non_winning_total': {
            count: nonWinningBlueCount,
            percent: calculatePercent(nonWinningBlueCount, totalBlueBalls)
          }
        });
      }
    }

    // 计算分组统计数据
    // 红球分组统计
    const specialRedIndividual: AnalysisResult = {};
    const specialRedGroups: AnalysisResult = {};
    
    // 处理红球个体统计 - 确保所有33个红球号码都被统计
    for (let i = 1; i <= 33; i++) {
      const number = i < 10 ? `0${i}` : `${i}`;
      specialRedIndividual[number] = {
        count: redBallCount[number] || 0,
        percent: calculatePercent(redBallCount[number] || 0, totalRedBalls)
      };
    }
    
    // 处理红球分组统计
    redBallConfig.groups.forEach(group => {
      const groupCount = group.numbers.reduce((sum, number) => sum + (redBallCount[number] || 0), 0);
      specialRedGroups[group.name] = {
        count: groupCount,
        percent: calculatePercent(groupCount, totalRedBalls)
      };
    });
    setSpecialRedStats({ 
      individual: specialRedIndividual, 
      groups: specialRedGroups,
      absentCounts: redBallAbsentCounts
    });

    // 蓝球分组统计
    const specialBlueIndividual: AnalysisResult = {};
    const specialBlueGroups: AnalysisResult = {};
    
    // 处理蓝球个体统计 - 确保所有16个蓝球号码都被统计
    for (let i = 1; i <= 16; i++) {
      const number = i < 10 ? `0${i}` : `${i}`;
      specialBlueIndividual[number] = {
        count: blueBallCount[number] || 0,
        percent: calculatePercent(blueBallCount[number] || 0, totalBlueBalls)
      };
    }
    
    // 处理蓝球分组统计
    blueBallConfig.groups.forEach(group => {
      const groupCount = group.numbers.reduce((sum, number) => sum + (blueBallCount[number] || 0), 0);
      specialBlueGroups[group.name] = {
        count: groupCount,
        percent: calculatePercent(groupCount, totalBlueBalls)
      };
    });
    setSpecialBlueStats({ 
      individual: specialBlueIndividual, 
      groups: specialBlueGroups,
      absentCounts: blueBallAbsentCounts
    });

    // 更新状态
    setTotalRecords(records.length);
    setRedBallFrequency(redBallResult);
    setBlueBallFrequency(blueBallResult);
    setRedBallOddEven(redOddEvenResult);
    setRedBallSize(redSizeResult);
    setBlueBallOddEven(blueOddEvenResult);
    setBlueBallSize(blueSizeResult);
    
    // 添加调试日志
    console.log('统计结果更新：');
    console.log('总记录数:', records.length);
    console.log('红球频率统计:', redBallResult);
    console.log('蓝球频率统计:', blueBallResult);
    console.log('红球奇偶分布:', redOddEvenResult);
    console.log('红球大小分布:', redSizeResult);
    console.log('蓝球奇偶分布:', blueOddEvenResult);
    console.log('蓝球大小分布:', blueSizeResult);
    console.log('红球分组统计:', specialRedStats);
    console.log('蓝球分组统计:', specialBlueStats);
  };

  // 获取记录数据
  useEffect(() => {
    // 防止在StrictMode下运行两次
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchRecords = async () => {
      setLoading(true);
      try {
        console.log('开始获取记录数据...');
        console.log('API请求URL:', '/api/record/records');
        const data = await recordApi.getAllRecords();
        console.log('获取到的记录数据:', data);
        console.log('数据类型:', typeof data);
        
        let recordsToUse: string[];
        if (typeof data === 'string') {
          // 接口返回的是字符串，通过换行符分割成数组
          recordsToUse = data
            .split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0);
          console.log('字符串分割后记录数据长度:', recordsToUse.length);
          if (recordsToUse.length > 0) {
            console.log('第一条记录:', recordsToUse[0]);
            console.log('记录长度:', recordsToUse[0].length);
          }
          message.success(`成功获取 ${recordsToUse.length} 条记录`);
        } else if (Array.isArray(data) && data.length > 0) {
          // 接口返回的是数组，直接使用
          recordsToUse = data;
          console.log('数组记录数据长度:', recordsToUse.length);
          if (recordsToUse.length > 0) {
            console.log('第一条记录:', recordsToUse[0]);
            console.log('记录长度:', recordsToUse[0].length);
          }
          message.success(`成功获取 ${recordsToUse.length} 条记录`);
        } else {
          console.error('获取到的数据不是字符串或数组，使用模拟数据:', data);
          recordsToUse = mockRecords;
          message.info(`使用模拟数据，共 ${mockRecords.length} 条记录`);
        }
        
        // 保存所有记录到状态
        setAllRecords(recordsToUse);
        // 设置滑块初始范围为全部记录
        const initialRange: [number, number] = [0, Math.max(0, recordsToUse.length - 1)];
        setSliderRange(initialRange);
        // 解析所有记录
        parseRecords(recordsToUse);
        
        // 初始化结束行中奖号码
        if (recordsToUse.length > 0) {
          const endIndex = initialRange[1];
          const endRecord = recordsToUse[endIndex];
          if (endRecord && endRecord.length >= 14) {
            // 解析红球：前12位，每两位一个号码
            const redBalls = [];
            for (let i = 0; i < 12; i += 2) {
              redBalls.push(endRecord.substring(i, i + 2));
            }
            // 解析蓝球：最后两位
            const blueBall = endRecord.substring(12, 14);
            // 合并红球和蓝球，根据当前统计类型设置显示的号码
            if (statisticType === 'red') {
              setEndLineNumbers(redBalls);
            } else {
              setEndLineNumbers([blueBall]);
            }
          }
        }
      } catch (error) {
        console.error('获取记录失败:', error);
        // 添加更详细的错误信息
        if (error instanceof Error) {
          console.error('错误名称:', error.name);
          console.error('错误信息:', error.message);
          console.error('错误堆栈:', error.stack);
        }
        // API请求失败时使用模拟数据
        const recordsToUse = mockRecords;
        setAllRecords(recordsToUse);
        const initialRange: [number, number] = [0, recordsToUse.length - 1];
        setSliderRange(initialRange);
        parseRecords(recordsToUse);
        
        // 初始化结束行中奖号码（模拟数据）
        if (recordsToUse.length > 0) {
          const endIndex = initialRange[1];
          const endRecord = recordsToUse[endIndex];
          if (endRecord && endRecord.length >= 14) {
            // 解析红球：前12位，每两位一个号码
            const redBalls = [];
            for (let i = 0; i < 12; i += 2) {
              redBalls.push(endRecord.substring(i, i + 2));
            }
            // 解析蓝球：最后两位
            const blueBall = endRecord.substring(12, 14);
            // 合并红球和蓝球，根据当前统计类型设置显示的号码
            if (statisticType === 'red') {
              setEndLineNumbers(redBalls);
            } else {
              setEndLineNumbers([blueBall]);
            }
          }
        }
        message.info(`API请求失败，使用模拟数据，共 ${mockRecords.length} 条记录`);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  // 当统计类型切换时，更新结束行中奖号码
  useEffect(() => {
    if (allRecords.length > 0 && sliderRange[1] < allRecords.length) {
      const endIndex = sliderRange[1];
      const endRecord = allRecords[endIndex];
      if (endRecord && endRecord.length >= 14) {
        // 解析红球：前12位，每两位一个号码
        const redBalls = [];
        for (let i = 0; i < 12; i += 2) {
          redBalls.push(endRecord.substring(i, i + 2));
        }
        // 解析蓝球：最后两位
        const blueBall = endRecord.substring(12, 14);
        // 合并红球和蓝球，根据当前统计类型设置显示的号码
        if (statisticType === 'red') {
          setEndLineNumbers(redBalls);
        } else {
          setEndLineNumbers([blueBall]);
        }
      }
    }
  }, [statisticType, allRecords, sliderRange]);

  // 计算选中号码每期的累计次数
  useEffect(() => {
    // 只有当有选中号码且有记录数据时，才生成图表数据
    if (selectedNumbers.length === 0 || allRecords.length === 0) {
      setChartData([]);
      return;
    }

    // 获取滑块范围内的记录
    const [startIndex, endIndex] = sliderRange;
    const selectedRangeRecords = allRecords.slice(startIndex, endIndex + 1);

    // 生成滑块范围内的累计计数数据
    const chartData: ChartDataItem[] = [];
    const cumulativeCounts: { [key: string]: number } = {};
    
    // 初始化累计计数
    selectedNumbers.forEach(num => {
      cumulativeCounts[num] = 0;
    });

    // 计算滑块范围内的累计次数
    selectedRangeRecords.forEach((record, index) => {
      const period = startIndex + index + 1; // 期数从滑块开始位置+1开始
      
      // 解析当前期的号码
      const isRed = statisticType === 'red';
      let currentNumbers: string[] = [];
      
      if (isRed) {
        // 红球：前12位，每两位一个号码
        for (let i = 0; i < 12; i += 2) {
          currentNumbers.push(record.substring(i, i + 2));
        }
      } else {
        // 蓝球：最后两位
        currentNumbers.push(record.substring(12, 14));
      }

      // 更新累计计数并生成数据
      selectedNumbers.forEach(num => {
        if (currentNumbers.includes(num)) {
          cumulativeCounts[num]++;
        }
        
        // 为每期每个选中号码生成数据，无论是否出现
        chartData.push({
          period: period,
          number: num,
          count: cumulativeCounts[num]
        });
      });
    });

    // 设置滑块范围内的图表数据
    setChartData(chartData);
  }, [selectedNumbers, allRecords, statisticType, sliderRange]);

  // 处理滑块变化
  const handleSliderChange = (value: number[]) => {
    const range = value as [number, number];
    setSliderRange(range);
    // 从所有记录中获取选中范围的记录
    const selectedRecords = allRecords.slice(range[0], range[1] + 1);
    // 重新解析数据
    parseRecords(selectedRecords);
    
    // 获取结束行的中奖号码
    if (allRecords.length > 0) {
      const endIndex = range[1];
      const endRecord = allRecords[endIndex];
      if (endRecord && endRecord.length >= 14) {
        // 解析红球：前12位，每两位一个号码
        const redBalls = [];
        for (let i = 0; i < 12; i += 2) {
          redBalls.push(endRecord.substring(i, i + 2));
        }
        // 解析蓝球：最后两位
        const blueBall = endRecord.substring(12, 14);
        
        // 合并红球和蓝球，根据当前统计类型设置显示的号码
        if (statisticType === 'red') {
          setEndLineNumbers(redBalls);
        } else {
          setEndLineNumbers([blueBall]);
        }
      }
    }
  };

  // 卡片拖拽状态
  const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);
  const [frequencyCardOrder, setFrequencyCardOrder] = useState<number[]>([]);
  const [distributionCardOrder, setDistributionCardOrder] = useState<number[]>([]);
  const [specialCardOrder, setSpecialCardOrder] = useState<number[]>([]);
  
  // 当前活动标签页
  const [activeTabKey, setActiveTabKey] = useState<string>(statisticType === 'red' ? '1' : '2');

  // 当切换到图表统计tab时，不默认选择所有号码
  // 避免一次性计算大量数据导致页面卡死
  useEffect(() => {
    // 检查是否切换到了图表统计tab
    if (activeTabKey === '7' || activeTabKey === '8') {
      // 不默认选择任何号码，让用户手动选择
      setSelectedNumbers([]);
    }
  }, [activeTabKey, statisticType]);

  // 渲染频率统计列表
  const renderFrequencyList = (data: AnalysisResult) => {
    // 转换为数组并按计数排序
    let sortedData = Object.entries(data)
      .map(([key, value]) => ({
        name: key,
        count: value.count,
        percent: value.percent
      }))
      .sort((a, b) => b.count - a.count);

    // 如果只显示最后一期中奖号码，进行过滤
    if (showOnlyLastWinning) {
      sortedData = sortedData.filter(item => endLineNumbers.includes(item.name));
    }

    // 初始化卡片顺序
    if (frequencyCardOrder.length !== sortedData.length) {
      setFrequencyCardOrder(Array.from({ length: sortedData.length }, (_, i) => i));
    }

    // 根据当前统计类型设置颜色和获取相关数据
    const currentColor = statisticType === 'red' ? '#f5222d' : '#1890ff';
    const stats = statisticType === 'red' ? specialRedStats : specialBlueStats;
    const isRed = statisticType === 'red';
    
    // 计算平均值
    const totalCount = Object.values(data).reduce((sum, val) => sum + val.count, 0);
    const avgCount = isRed ? totalCount / 33 : totalCount / 16;

    // 按照自定义顺序排列卡片
    // 使用当前数据长度计算有效的卡片顺序，避免索引越界
    const currentOrder = frequencyCardOrder.length === sortedData.length 
      ? frequencyCardOrder 
      : Array.from({ length: sortedData.length }, (_, i) => i);
    const orderedData = currentOrder.map(index => sortedData[index]);

    // 拖拽开始事件
    const handleDragStart = (index: number) => {
      setDraggedCardIndex(index);
    };

    // 拖拽悬停事件
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
    };

    // 拖拽放置事件
    const handleDrop = (targetIndex: number) => {
      if (draggedCardIndex === null) return;
      
      // 创建新的顺序数组
      const newOrder = [...frequencyCardOrder];
      const [draggedItem] = newOrder.splice(draggedCardIndex, 1);
      newOrder.splice(targetIndex, 0, draggedItem);
      
      // 更新顺序
      setFrequencyCardOrder(newOrder);
      setDraggedCardIndex(null);
    };

    return (
      <Row gutter={[16, 16]}>
        {orderedData.map((item, index) => {
          // 检查当前号码是否在结束行中奖号码中
          const isWinningNumber = endLineNumbers.includes(item.name);
          
          // 计算与平均值的差值
          const diff = item.count - avgCount;
          
          return (
            <Col 
              xs={24} 
              sm={12} 
              md={8} 
              lg={6} 
              xl={4} 
              key={index}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
            >
              <Card 
                      title={isWinningNumber ? (
                        <div style={{ 
                          backgroundColor: currentColor, 
                          color: '#fff',
                          borderRadius: '50%',
                          width: '30px',
                          height: '30px',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          margin: '0 auto'
                        }}>
                          {item.name}
                        </div>
                      ) : item.name} 
                      variant="outlined"
                      size="small"
                      draggable
                      onDragStart={(e) => {
                        handleDragStart(index);
                        // 设置自定义拖动图像为空，避免默认的长方形背景
                        e.dataTransfer.setDragImage(new Image(), 0, 0);
                      }}
                      style={{
                        border: '1px solid transparent',
                        borderRadius: '6px',
                        backgroundImage: currentColor === '#f5222d' 
                          ? 'linear-gradient(135deg, #ffffff 0%, rgba(245, 34, 45, 0.1) 100%), linear-gradient(135deg, rgba(245, 34, 45, 0.1) 0%, rgba(245, 34, 45, 0.3) 100%)' 
                          : 'linear-gradient(135deg, #ffffff 0%, rgba(24, 144, 255, 0.1) 100%), linear-gradient(135deg, rgba(24, 144, 255, 0.1) 0%, rgba(24, 144, 255, 0.3) 100%)',
                        backgroundOrigin: 'padding-box, border-box',
                        backgroundClip: 'padding-box, border-box',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        cursor: 'grab',
                        transformStyle: 'preserve-3d',
                        perspective: '1500px',
                        transformOrigin: 'center center',
                        backfaceVisibility: 'hidden',
                      }}
                onMouseEnter={(e) => {
                  const card = e.currentTarget;
                  card.style.transform = 'translateY(-4px) rotateX(0deg) rotateY(0deg) translateZ(40px)';
                  card.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.25)';
                  card.style.cursor = 'grabbing';
                }}
                onMouseMove={(e) => {
                  const card = e.currentTarget;
                  const rect = card.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  const centerX = rect.width / 2;
                  const centerY = rect.height / 2;
                  const rotateX = (y - centerY) / 5;
                  const rotateY = (centerX - x) / 5;
                  card.style.transform = `translateY(-4px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(40px)`;
                }}
                onMouseLeave={(e) => {
                  const card = e.currentTarget;
                  card.style.transform = 'translateY(0) rotateX(0deg) rotateY(0deg) translateZ(0)';
                  card.style.boxShadow = '';
                  card.style.cursor = 'grab';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>次数</span>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: currentColor }}>
                      {item.count}次
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>
                      连续未出现
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: currentColor }}>
                      {(stats.absentCounts[item.name] || 0)}期
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>
                      与平均值差值
                    </span>
                    <span style={{ 
                      fontSize: '16px', 
                      fontWeight: 'bold', 
                      color: diff >= 0 ? '#389e0d' : '#ff4d4f'
                    }}>
                      {`${diff >= 0 ? '+' : ''}${diff.toFixed(1)}次`}
                    </span>
                  </div>
                  <Progress 
                    percent={item.percent} 
                    strokeColor={currentColor} 
                    size="small" 
                    showInfo={true}
                    format={(percent) => `${percent}%`}
                  />
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  };

  // 渲染分布统计列表
  const renderDistributionList = (data: AnalysisResult) => {
    const distributionData = Object.entries(data).map(([key, value]) => ({
      name: key === 'odd' ? '奇数' : 
            key === 'even' ? '偶数' : 
            key === 'small' ? '小号' : 
            key === 'large' ? '大号' : 
            key === 'total' ? '中奖号码总和' : 
            key === 'non_winning_total' ? '未中奖号码总和' : 
            key,
      count: value.count,
      percent: value.percent
    }));

    // 初始化卡片顺序
    if (distributionCardOrder.length !== distributionData.length) {
      setDistributionCardOrder(Array.from({ length: distributionData.length }, (_, i) => i));
    }

    // 根据当前统计类型设置颜色
    const currentColor = statisticType === 'red' ? '#f5222d' : '#1890ff';

    // 按照自定义顺序排列卡片
    // 使用当前数据长度计算有效的卡片顺序，避免索引越界
    const currentOrder = distributionCardOrder.length === distributionData.length 
      ? distributionCardOrder 
      : Array.from({ length: distributionData.length }, (_, i) => i);
    const orderedData = currentOrder.map(index => distributionData[index]);

    // 拖拽开始事件
    const handleDragStart = (index: number) => {
      setDraggedCardIndex(index);
    };

    // 拖拽悬停事件
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
    };

    // 拖拽放置事件
    const handleDrop = (targetIndex: number) => {
      if (draggedCardIndex === null) return;
      
      // 创建新的顺序数组
      const newOrder = [...distributionCardOrder];
      const [draggedItem] = newOrder.splice(draggedCardIndex, 1);
      newOrder.splice(targetIndex, 0, draggedItem);
      
      // 更新顺序
      setDistributionCardOrder(newOrder);
      setDraggedCardIndex(null);
    };

    return (
      <Row gutter={[16, 16]}>
        {orderedData.map((item, index) => {
          return (
              <Col xs={24} sm={12} md={12} lg={12} xl={12} key={index}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
              >
                <Card 
                  title={item.name} 
                  variant="outlined"
                  size="small"
                  draggable
                  onDragStart={(e) => {
                    handleDragStart(index);
                    // 设置自定义拖动图像为空，避免默认的长方形背景
                    e.dataTransfer.setDragImage(new Image(), 0, 0);
                  }}
                  style={{
                    background: currentColor === '#f5222d' 
                      ? 'linear-gradient(135deg, #ffffff 0%, rgba(245, 34, 45, 0.1) 100%)' 
                      : 'linear-gradient(135deg, #ffffff 0%, rgba(24, 144, 255, 0.1) 100%)',
                    border: '1px solid transparent',
                    borderRadius: '6px',
                    backgroundImage: currentColor === '#f5222d' 
                      ? 'linear-gradient(135deg, #ffffff 0%, rgba(245, 34, 45, 0.1) 100%), linear-gradient(135deg, rgba(245, 34, 45, 0.1) 0%, rgba(245, 34, 45, 0.3) 100%)' 
                      : 'linear-gradient(135deg, #ffffff 0%, rgba(24, 144, 255, 0.1) 100%), linear-gradient(135deg, rgba(24, 144, 255, 0.1) 0%, rgba(24, 144, 255, 0.3) 100%)',
                    backgroundOrigin: 'padding-box, border-box',
                    backgroundClip: 'padding-box, border-box',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    cursor: 'grab',
                    transformStyle: 'preserve-3d',
                    perspective: '1500px',
                    transformOrigin: 'center center',
                    backfaceVisibility: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    const card = e.currentTarget;
                    card.style.transform = 'translateY(-4px) rotateX(0deg) rotateY(0deg) translateZ(40px)';
                    card.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.25)';
                    card.style.cursor = 'grabbing';
                  }}
                  onMouseMove={(e) => {
                    const card = e.currentTarget;
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    const rotateX = (y - centerY) / 5;
                    const rotateY = (centerX - x) / 5;
                    card.style.transform = `translateY(-4px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(40px)`;
                  }}
                  onMouseLeave={(e) => {
                    const card = e.currentTarget;
                    card.style.transform = 'translateY(0) rotateX(0deg) rotateY(0deg) translateZ(0)';
                    card.style.boxShadow = '';
                    card.style.cursor = 'grab';
                  }}
                >
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px',
                  justifyContent: 'center'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    whiteSpace: 'nowrap' 
                  }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>次数</span>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: currentColor }}>
                      {item.count}次
                    </span>
                  </div>
                  <Progress 
                    percent={item.percent} 
                    strokeColor={currentColor} 
                    size="small" 
                    showInfo={true}
                    format={(percent) => `${percent}%`}
                    style={{ marginTop: '4px' }}
                  />
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  };

  // 渲染分组统计结果
  const renderSpecialStats = () => {
    // 根据当前统计类型选择相应的数据和配置
    const isRed = statisticType === 'red';
    const stats = isRed ? specialRedStats : specialBlueStats;
    const currentColor = isRed ? '#f5222d' : '#1890ff';
    
    // 生成所有卡片数据
    const allCards = isRed ? (
      [
        // 组1：林黛玉（包含组名卡片 + 11个号码卡片）
        { type: 'group', name: '林黛玉', count: stats.groups['林黛玉']?.count || 0, percent: stats.groups['林黛玉']?.percent || 0 },
        ...redBallConfig.groups[0].numbers.map(number => ({ type: 'number', number, name: redBallConfig.numberToName[number as keyof typeof redBallConfig.numberToName] || number, count: stats.individual[number]?.count || 0, percent: stats.individual[number]?.percent || 0 })),
        // 组2：香菱（包含组名卡片 + 11个号码卡片）
        { type: 'group', name: '香菱', count: stats.groups['香菱']?.count || 0, percent: stats.groups['香菱']?.percent || 0 },
        ...redBallConfig.groups[1].numbers.map(number => ({ type: 'number', number, name: redBallConfig.numberToName[number as keyof typeof redBallConfig.numberToName] || number, count: stats.individual[number]?.count || 0, percent: stats.individual[number]?.percent || 0 })),
        // 组3：晴雯（包含组名卡片 + 11个号码卡片）
        { type: 'group', name: '晴雯', count: stats.groups['晴雯']?.count || 0, percent: stats.groups['晴雯']?.percent || 0 },
        ...redBallConfig.groups[2].numbers.map(number => ({ type: 'number', number, name: redBallConfig.numberToName[number as keyof typeof redBallConfig.numberToName] || number, count: stats.individual[number]?.count || 0, percent: stats.individual[number]?.percent || 0 }))
      ]
    ) : (
      [
        // 组1：立春（包含组名卡片 + 2个号码卡片）
        { type: 'group', name: '立春', count: stats.groups['立春']?.count || 0, percent: stats.groups['立春']?.percent || 0 },
        ...blueBallConfig.groups[0].numbers.map(number => ({ type: 'number', number, name: blueBallConfig.numberToName[number as keyof typeof blueBallConfig.numberToName] || number, count: stats.individual[number]?.count || 0, percent: stats.individual[number]?.percent || 0 })),
        // 组2：春分（包含组名卡片 + 2个号码卡片）
        { type: 'group', name: '春分', count: stats.groups['春分']?.count || 0, percent: stats.groups['春分']?.percent || 0 },
        ...blueBallConfig.groups[1].numbers.map(number => ({ type: 'number', number, name: blueBallConfig.numberToName[number as keyof typeof blueBallConfig.numberToName] || number, count: stats.individual[number]?.count || 0, percent: stats.individual[number]?.percent || 0 })),
        // 组3：立夏（包含组名卡片 + 2个号码卡片）
        { type: 'group', name: '立夏', count: stats.groups['立夏']?.count || 0, percent: stats.groups['立夏']?.percent || 0 },
        ...blueBallConfig.groups[2].numbers.map(number => ({ type: 'number', number, name: blueBallConfig.numberToName[number as keyof typeof blueBallConfig.numberToName] || number, count: stats.individual[number]?.count || 0, percent: stats.individual[number]?.percent || 0 })),
        // 组4：夏至（包含组名卡片 + 2个号码卡片）
        { type: 'group', name: '夏至', count: stats.groups['夏至']?.count || 0, percent: stats.groups['夏至']?.percent || 0 },
        ...blueBallConfig.groups[3].numbers.map(number => ({ type: 'number', number, name: blueBallConfig.numberToName[number as keyof typeof blueBallConfig.numberToName] || number, count: stats.individual[number]?.count || 0, percent: stats.individual[number]?.percent || 0 })),
        // 组5：立秋（包含组名卡片 + 2个号码卡片）
        { type: 'group', name: '立秋', count: stats.groups['立秋']?.count || 0, percent: stats.groups['立秋']?.percent || 0 },
        ...blueBallConfig.groups[4].numbers.map(number => ({ type: 'number', number, name: blueBallConfig.numberToName[number as keyof typeof blueBallConfig.numberToName] || number, count: stats.individual[number]?.count || 0, percent: stats.individual[number]?.percent || 0 })),
        // 组6：秋分（包含组名卡片 + 2个号码卡片）
        { type: 'group', name: '秋分', count: stats.groups['秋分']?.count || 0, percent: stats.groups['秋分']?.percent || 0 },
        ...blueBallConfig.groups[5].numbers.map(number => ({ type: 'number', number, name: blueBallConfig.numberToName[number as keyof typeof blueBallConfig.numberToName] || number, count: stats.individual[number]?.count || 0, percent: stats.individual[number]?.percent || 0 })),
        // 组7：立冬（包含组名卡片 + 2个号码卡片）
        { type: 'group', name: '立冬', count: stats.groups['立冬']?.count || 0, percent: stats.groups['立冬']?.percent || 0 },
        ...blueBallConfig.groups[6].numbers.map(number => ({ type: 'number', number, name: blueBallConfig.numberToName[number as keyof typeof blueBallConfig.numberToName] || number, count: stats.individual[number]?.count || 0, percent: stats.individual[number]?.percent || 0 })),
        // 组8：冬至（包含组名卡片 + 2个号码卡片）
        { type: 'group', name: '冬至', count: stats.groups['冬至']?.count || 0, percent: stats.groups['冬至']?.percent || 0 },
        ...blueBallConfig.groups[7].numbers.map(number => ({ type: 'number', number, name: blueBallConfig.numberToName[number as keyof typeof blueBallConfig.numberToName] || number, count: stats.individual[number]?.count || 0, percent: stats.individual[number]?.percent || 0 }))
      ]
    );

    // 初始化卡片顺序
    if (specialCardOrder.length !== allCards.length) {
      setSpecialCardOrder(Array.from({ length: allCards.length }, (_, i) => i));
    }

    // 按照自定义顺序排列卡片
    // 使用当前数据长度计算有效的卡片顺序，避免索引越界
    const currentOrder = specialCardOrder.length === allCards.length 
      ? specialCardOrder 
      : Array.from({ length: allCards.length }, (_, i) => i);
    const orderedCards = currentOrder.map(index => allCards[index]);

    // 拖拽开始事件
    const handleDragStart = (index: number) => {
      setDraggedCardIndex(index);
    };

    // 拖拽悬停事件
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
    };

    // 拖拽放置事件
    const handleDrop = (targetIndex: number) => {
      if (draggedCardIndex === null) return;
      
      // 创建新的顺序数组
      const newOrder = [...specialCardOrder];
      const [draggedItem] = newOrder.splice(draggedCardIndex, 1);
      newOrder.splice(targetIndex, 0, draggedItem);
      
      // 更新顺序
      setSpecialCardOrder(newOrder);
      setDraggedCardIndex(null);
    };
    
    return (
      <div>
        {/* 合并个体和分组统计 */}
        <Card title="分组统计" variant="outlined">
          {/* 红球分组统计：6列布局，每组12个卡片占2行，共3组36个卡片 */}
          <Row gutter={[16, 16]}>
            {orderedCards.map((item, index) => (
              <Col key={index} xs={24} sm={12} md={8} lg={4} xl={4}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
              >
                <Card 
                  title={
                    <div style={{ 
                      color: currentColor,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      position: 'relative'
                    }}>
                      {item.name}
                      {/* 为最后一期中奖号码添加红色或蓝色实心星星图标 */}
                      {item.type === 'number' && endLineNumbers.includes((item as { number: string }).number) && (
                        <StarFilled 
                          style={{
                            position: 'absolute',
                            top: '0px',
                            left: '0px',
                            color: currentColor, // 使用当前统计类型的颜色（红球红色，蓝球蓝色）
                            fontSize: '18px',
                            zIndex: 10
                          }}
                        />
                      )}
                    </div>
                  } 
                  variant="outlined"
                  size="small"
                  draggable
                  onDragStart={(e) => {
                    handleDragStart(index);
                    // 设置自定义拖动图像为空，避免默认的长方形背景
                    e.dataTransfer.setDragImage(new Image(), 0, 0);
                  }}
                  onClick={() => {
                    if (item.type === 'number') {
                      const number = (item as { number: string }).number;
                      // 使用新的多选逻辑，将点击的号码添加到选中列表
                      handleNumberSelect(number);
                    }
                  }}
                  style={{
                    border: '1px solid transparent',
                    borderRadius: '6px',
                    backgroundImage: item.type === 'group' 
                      ? (isRed 
                        ? 'linear-gradient(135deg, #ffffff 0%, rgba(245, 34, 45, 0.4) 100%), linear-gradient(135deg, rgba(245, 34, 45, 0.4) 0%, rgba(245, 34, 45, 0.6) 100%)' 
                        : 'linear-gradient(135deg, #ffffff 0%, rgba(24, 144, 255, 0.4) 100%), linear-gradient(135deg, rgba(24, 144, 255, 0.4) 0%, rgba(24, 144, 255, 0.6) 100%)')
                      : (isRed 
                        ? 'linear-gradient(135deg, #ffffff 0%, rgba(245, 34, 45, 0.1) 100%), linear-gradient(135deg, rgba(245, 34, 45, 0.1) 0%, rgba(245, 34, 45, 0.3) 100%)' 
                        : 'linear-gradient(135deg, #ffffff 0%, rgba(24, 144, 255, 0.1) 100%), linear-gradient(135deg, rgba(24, 144, 255, 0.1) 0%, rgba(24, 144, 255, 0.3) 100%)'),
                    backgroundOrigin: 'padding-box, border-box',
                    backgroundClip: 'padding-box, border-box',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    cursor: item.type === 'number' ? 'pointer' : 'grab',
                    transformStyle: 'preserve-3d',
                    perspective: '1500px',
                    transformOrigin: 'center center',
                    backfaceVisibility: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    const card = e.currentTarget;
                    card.style.transform = 'translateY(-4px) rotateX(0deg) rotateY(0deg) translateZ(40px)';
                    card.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.25)';
                    card.style.cursor = 'grabbing';
                  }}
                  onMouseMove={(e) => {
                    const card = e.currentTarget;
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    const rotateX = (y - centerY) / 5;
                    const rotateY = (centerX - x) / 5;
                    card.style.transform = `translateY(-4px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(40px)`;
                  }}
                  onMouseLeave={(e) => {
                    const card = e.currentTarget;
                    card.style.transform = 'translateY(0) rotateX(0deg) rotateY(0deg) translateZ(0)';
                    card.style.boxShadow = '';
                    card.style.cursor = 'grab';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#666' }}>
                        {item.type === 'group' ? '总次数' : '次数'}
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: currentColor }}>
                        {item.count}次
                      </span>
                    </div>
                    {item.type === 'group' && (
                      <>
                        {/* 计算该组连续未出现次数的最大值 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: '#666' }}>
                            连续未出现最大值
                          </span>
                          <span style={{ fontSize: '16px', fontWeight: 'bold', color: currentColor }}>
                            {(() => {
                              // 获取当前组的配置
                              const groupsConfig = isRed ? redBallConfig.groups : blueBallConfig.groups;
                              const currentGroupConfig = groupsConfig.find(group => group.name === item.name);
                              if (currentGroupConfig) {
                                // 计算该组所有号码的连续未出现次数的最大值
                                const maxAbsentCount = Math.max(...currentGroupConfig.numbers.map(number => {
                                  return stats.absentCounts[number] || 0;
                                }));
                                return `${maxAbsentCount}期`;
                              }
                              return '0期';
                            })()}
                          </span>
                        </div>
                        {/* 计算与（平均数*每组球数）的差值 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: '#666' }}>
                            与平均总数差值
                          </span>
                          <span style={{ 
                            fontSize: '16px', 
                            fontWeight: 'bold', 
                            // 根据差值正负显示不同颜色
                            color: (() => {
                              const totalCount = Object.values(stats.individual).reduce((sum, val) => sum + val.count, 0);
                              const totalNumbers = isRed ? 33 : 16;
                              const avgCountPerNumber = totalCount / totalNumbers;
                              // 获取当前组的配置
                              const groupsConfig = isRed ? redBallConfig.groups : blueBallConfig.groups;
                              const currentGroupConfig = groupsConfig.find(group => group.name === item.name);
                              const groupSize = currentGroupConfig ? currentGroupConfig.numbers.length : 0;
                              const avgCountForGroup = avgCountPerNumber * groupSize;
                              const diff = item.count - avgCountForGroup;
                              return diff >= 0 ? '#389e0d' : '#ff4d4f';
                            })()
                          }}>
                            {/* 计算差值并保留1位小数 */}
                            {(() => {
                              const totalCount = Object.values(stats.individual).reduce((sum, val) => sum + val.count, 0);
                              const totalNumbers = isRed ? 33 : 16;
                              const avgCountPerNumber = totalCount / totalNumbers;
                              // 获取当前组的配置
                              const groupsConfig = isRed ? redBallConfig.groups : blueBallConfig.groups;
                              const currentGroupConfig = groupsConfig.find(group => group.name === item.name);
                              const groupSize = currentGroupConfig ? currentGroupConfig.numbers.length : 0;
                              const avgCountForGroup = avgCountPerNumber * groupSize;
                              const diff = item.count - avgCountForGroup;
                              // 根据差值正负添加前缀
                              return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}次`;
                            })()}
                          </span>
                        </div>
                      </>
                    )}
                    {item.type === 'number' && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: '#666' }}>
                            连续未出现
                          </span>
                          <span style={{ fontSize: '16px', fontWeight: 'bold', color: currentColor }}>
                            {(isRed ? stats.absentCounts[(item as { number: string }).number] : stats.absentCounts[(item as { number: string }).number]) || 0}期
                          </span>
                        </div>
                        {/* 计算出现次数与平均次数的差值 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: '#666' }}>
                            与平均值差值
                          </span>
                          <span style={{ 
                            fontSize: '16px', 
                            fontWeight: 'bold', 
                            // 根据差值正负显示不同颜色
                            color: (() => {
                              const totalCount = Object.values(stats.individual).reduce((sum, val) => sum + val.count, 0);
                              const avgCount = isRed ? totalCount / 33 : totalCount / 16;
                              const diff = item.count - avgCount;
                              return diff >= 0 ? '#389e0d' : '#ff4d4f';
                            })()
                          }}>
                            {/* 计算差值并保留1位小数 */}
                            {(() => {
                              const totalCount = Object.values(stats.individual).reduce((sum, val) => sum + val.count, 0);
                              const avgCount = isRed ? totalCount / 33 : totalCount / 16;
                              const diff = item.count - avgCount;
                              // 根据差值正负添加前缀
                              return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}次`;
                            })()}
                          </span>
                        </div>
                      </>
                    )}
                    <Progress 
                      percent={item.percent} 
                      strokeColor={currentColor} 
                      size="small" 
                      showInfo={true}
                      format={(percent) => `${percent}%`}
                    />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      </div>
    );
  };

  return (
    <div className="statistics-container">
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
        borderRadius: '4px', // 长方形
        width: '80px', // 更长的长方形
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
          const newType = statisticType === 'red' ? 'blue' : 'red';
          setStatisticType(newType);
          // 根据当前tab类型映射到新统计类型下对应的tab key
          let newTabKey = activeTabKey;
          if (activeTabKey === '1' || activeTabKey === '2') {
            // 频率统计tab
            newTabKey = newType === 'red' ? '1' : '2';
          } else if (activeTabKey === '3' || activeTabKey === '4') {
            // 分布统计tab
            newTabKey = newType === 'red' ? '3' : '4';
          } else if (activeTabKey === '5' || activeTabKey === '6') {
            // 分组统计tab
            newTabKey = newType === 'red' ? '5' : '6';
          } else if (activeTabKey === '7' || activeTabKey === '8') {
            // 图表统计tab
            newTabKey = newType === 'red' ? '7' : '8';
          }
          setActiveTabKey(newTabKey);
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
      
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* 总记录数卡片 */}
        <Col xs={24} sm={12} md={6}>
          <Card 
            variant="outlined"
            style={{
              border: '1px solid transparent',
              borderRadius: '6px',
              backgroundImage: statisticType === 'red' 
                ? 'linear-gradient(135deg, #ffffff 0%, rgba(245, 34, 45, 0.1) 100%), linear-gradient(135deg, rgba(245, 34, 45, 0.1) 0%, rgba(245, 34, 45, 0.3) 100%)' 
                : 'linear-gradient(135deg, #ffffff 0%, rgba(24, 144, 255, 0.1) 100%), linear-gradient(135deg, rgba(24, 144, 255, 0.1) 0%, rgba(24, 144, 255, 0.3) 100%)',
              backgroundOrigin: 'padding-box, border-box',
              backgroundClip: 'padding-box, border-box',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer',
              transformStyle: 'preserve-3d',
              perspective: '1500px',
              transformOrigin: 'center center',
              backfaceVisibility: 'hidden',
            }}
            onMouseEnter={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'translateY(-4px) rotateX(0deg) rotateY(0deg) translateZ(40px)';
              card.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';
            }}
            onMouseMove={(e) => {
              const card = e.currentTarget;
              const rect = card.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              const rotateX = (y - centerY) / 5;
              const rotateY = (centerX - x) / 5;
              card.style.transform = `translateY(-4px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(40px)`;
            }}
            onMouseLeave={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'translateY(0) rotateX(0deg) rotateY(0deg) translateZ(0)';
              card.style.boxShadow = '';
            }}
          >
            <Statistic
              title="总数据量"
              value={totalRecords}
              prefix={<AreaChartOutlined />}
              valueStyle={{ color: statisticType === 'red' ? '#f5222d' : '#1890ff', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        
        {/* 红球/蓝球总数卡片 */}
        <Col xs={24} sm={12} md={6}>
          <Card 
            variant="outlined"
            style={{
              background: statisticType === 'red' 
                ? 'linear-gradient(135deg, #ffffff 0%, rgba(245, 34, 45, 0.025) 100%)' 
                : 'linear-gradient(135deg, #ffffff 0%, rgba(24, 144, 255, 0.025) 100%)',
              border: `1px solid ${statisticType === 'red' ? 'rgba(245, 34, 45, 0.1)' : 'rgba(24, 144, 255, 0.1)'}`,
              borderRadius: '6px',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer',
              transformStyle: 'preserve-3d',
              perspective: '1000px',
            }}
            onMouseEnter={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'translateY(-4px) rotateX(0deg) rotateY(0deg)';
              card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseMove={(e) => {
              const card = e.currentTarget;
              const rect = card.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              const rotateX = (y - centerY) / 10;
              const rotateY = (centerX - x) / 10;
              card.style.transform = `translateY(-4px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            }}
            onMouseLeave={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'translateY(0) rotateX(0deg) rotateY(0deg)';
              card.style.boxShadow = '';
            }}
          >
            <Statistic
              title="总次数"
              value={statisticType === 'red' 
                ? Object.values(redBallFrequency).reduce((sum, item) => sum + item.count, 0) 
                : Object.values(blueBallFrequency).reduce((sum, item) => sum + item.count, 0)}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: statisticType === 'red' ? '#f5222d' : '#1890ff', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        
        {/* 平均次数卡片 */}
        <Col xs={24} sm={12} md={6}>
          <Card 
            variant="outlined"
            style={{
              background: statisticType === 'red' 
                ? 'linear-gradient(135deg, #ffffff 0%, rgba(245, 34, 45, 0.025) 100%)' 
                : 'linear-gradient(135deg, #ffffff 0%, rgba(24, 144, 255, 0.025) 100%)',
              border: `1px solid ${statisticType === 'red' ? 'rgba(245, 34, 45, 0.1)' : 'rgba(24, 144, 255, 0.1)'}`,
              borderRadius: '6px',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer',
              transformStyle: 'preserve-3d',
              perspective: '1000px',
            }}
            onMouseEnter={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'translateY(-4px) rotateX(0deg) rotateY(0deg)';
              card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseMove={(e) => {
              const card = e.currentTarget;
              const rect = card.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              const rotateX = (y - centerY) / 10;
              const rotateY = (centerX - x) / 10;
              card.style.transform = `translateY(-4px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            }}
            onMouseLeave={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'translateY(0) rotateX(0deg) rotateY(0deg)';
              card.style.boxShadow = '';
            }}
          >
            <Statistic
              title="平均次数"
              value={statisticType === 'red' 
                ? Math.round(Object.values(redBallFrequency).reduce((sum, item) => sum + item.count, 0) / 33 * 10) / 10 
                : Math.round(Object.values(blueBallFrequency).reduce((sum, item) => sum + item.count, 0) / 16 * 10) / 10}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: statisticType === 'red' ? '#f5222d' : '#1890ff', fontWeight: 'bold' }}
              suffix="次"
            />
          </Card>
        </Col>
        
        {/* 红球/蓝球号码覆盖卡片 */}
        <Col xs={24} sm={12} md={6}>
          <Card 
            variant="outlined"
            style={{
              background: statisticType === 'red' 
                ? 'linear-gradient(135deg, #ffffff 0%, rgba(245, 34, 45, 0.025) 100%)' 
                : 'linear-gradient(135deg, #ffffff 0%, rgba(24, 144, 255, 0.025) 100%)',
              border: `1px solid ${statisticType === 'red' ? 'rgba(245, 34, 45, 0.1)' : 'rgba(24, 144, 255, 0.1)'}`,
              borderRadius: '6px',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer',
              transformStyle: 'preserve-3d',
              perspective: '1000px',
            }}
            onMouseEnter={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'translateY(-4px) rotateX(0deg) rotateY(0deg)';
              card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseMove={(e) => {
              const card = e.currentTarget;
              const rect = card.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              const rotateX = (y - centerY) / 10;
              const rotateY = (centerX - x) / 10;
              card.style.transform = `translateY(-4px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            }}
            onMouseLeave={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'translateY(0) rotateX(0deg) rotateY(0deg)';
              card.style.boxShadow = '';
            }}
          >
            <Statistic
              title="覆盖率"
              value={statisticType === 'red' 
                ? Object.keys(redBallFrequency).length 
                : Object.keys(blueBallFrequency).length}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: statisticType === 'red' ? '#f5222d' : '#1890ff', fontWeight: 'bold' }}
              suffix={statisticType === 'red' ? "/33" : "/16"}
            />
          </Card>
        </Col>
      </Row>

      {/* 分析结果 */}
      <Spin spinning={loading} indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}>
        <Tabs 
          activeKey={activeTabKey} 
          type="card"
          onChange={(key) => setActiveTabKey(key as string)}
          items={[
            ...(statisticType === 'red' ? [
              {
                key: '1',
                label: <span style={{ color: '#f5222d' }}>频率统计</span>,
                children: (
                  <Row gutter={[16, 16]}>
                    <Col xs={24}>
                      <Card 
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>频率统计</span>
                            <button
                              onClick={() => setShowOnlyLastWinning(!showOnlyLastWinning)}
                              style={{
                                padding: '8px',
                                backgroundColor: showOnlyLastWinning ? '#f5222d' : '#fff',
                                color: showOnlyLastWinning ? '#fff' : '#f5222d',
                                border: '1px solid #f5222d',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                transition: 'all 0.3s',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}
                              title={showOnlyLastWinning ? '显示全部' : '只看最后一期中奖号码'}
                            >
                              {showOnlyLastWinning ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                            </button>
                          </div>
                        } 
                        variant="outlined"
                      >
                        {renderFrequencyList(redBallFrequency)}
                      </Card>
                    </Col>
                  </Row>
                ),
              },
              {
                key: '3',
                label: <span style={{ color: '#f5222d' }}>分布统计</span>,
                children: (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={24} md={12} lg={12} xl={8}>
                      <Card title="奇偶分布" variant="outlined">
                        {renderDistributionList(redBallOddEven)}
                      </Card>
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={12} xl={8}>
                      <Card 
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>大小分布</span>
                            <Tooltip 
                              title="红球小号范围：1-16，大号范围：17-33" 
                              placement="top"
                            >
                              <InfoCircleOutlined style={{ 
                                cursor: 'default', 
                                color: '#999', 
                                fontSize: '16px',
                              }} />
                            </Tooltip>
                          </div>
                        } 
                        variant="outlined"
                      >
                        {renderDistributionList(redBallSize)}
                      </Card>
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={12} xl={8}>
                      <Card title="最后一期" variant="outlined">
                        {renderDistributionList(lastWinningNumbersTotalRed)}
                      </Card>
                    </Col>
                  </Row>
                ),
              },
              {
                key: '5',
                label: <span style={{ color: '#f5222d' }}>分组统计</span>,
                children: renderSpecialStats(),
              },
              {
                key: '7',
                label: <span style={{ color: '#f5222d' }}>图表统计</span>,
                children: renderChartStats(),
              }
            ] : [
              {
                key: '2',
                label: <span style={{ color: '#1890ff' }}>频率统计</span>,
                children: (
                  <Row gutter={[16, 16]}>
                    <Col xs={24}>
                      <Card 
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>频率统计</span>
                            <button
                              onClick={() => setShowOnlyLastWinning(!showOnlyLastWinning)}
                              style={{
                                padding: '8px',
                                backgroundColor: showOnlyLastWinning ? '#1890ff' : '#fff',
                                color: showOnlyLastWinning ? '#fff' : '#1890ff',
                                border: '1px solid #1890ff',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                transition: 'all 0.3s',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}
                              title={showOnlyLastWinning ? '显示全部' : '只看最后一期中奖号码'}
                            >
                              {showOnlyLastWinning ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                            </button>
                          </div>
                        } 
                        variant="outlined"
                      >
                        {renderFrequencyList(blueBallFrequency)}
                      </Card>
                    </Col>
                  </Row>
                ),
              },
              {
                key: '4',
                label: <span style={{ color: '#1890ff' }}>分布统计</span>,
                children: (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={24} md={12} lg={12} xl={8}>
                      <Card title="奇偶分布" variant="outlined">
                        {renderDistributionList(blueBallOddEven)}
                      </Card>
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={12} xl={8}>
                      <Card 
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>大小分布</span>
                            <Tooltip 
                              title="蓝球小号范围：1-8，大号范围：9-16" 
                              placement="top"
                            >
                              <InfoCircleOutlined style={{ 
                                cursor: 'default', 
                                color: '#999', 
                                fontSize: '16px',
                              }} />
                            </Tooltip>
                          </div>
                        } 
                        variant="outlined"
                      >
                        {renderDistributionList(blueBallSize)}
                      </Card>
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={12} xl={8}>
                      <Card title="最后一期" variant="outlined">
                        {renderDistributionList(lastWinningNumbersTotalBlue)}
                      </Card>
                    </Col>
                  </Row>
                ),
              },
              {
                key: '6',
                label: <span style={{ color: '#1890ff' }}>分组统计</span>,
                children: renderSpecialStats(),
              },
              {
                key: '8',
                label: <span style={{ color: '#1890ff' }}>图表统计</span>,
                children: renderChartStats(),
              }
            ])
          ]}
        />
      </Spin>
      
      {/* 可拖拽且可缩放的数据范围滑块 - 始终固定定位 */}
      {allRecords.length > 0 && (
        <>          

          
          {/* 滑块隐藏时，在页面右侧下角显示圆形图标，位于切换按钮下方 */}
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
              // 显示滑块时根据隐藏按钮位置调整显示位置
              // 如果隐藏按钮靠右侧，显示在左侧；如果靠左侧，显示在右侧
              const isHiddenIconOnRight = hiddenIconPosition.x > window.innerWidth / 2;
              const newX = isHiddenIconOnRight 
                ? hiddenIconPosition.x - sliderSize.width - 20 // 左侧20px间距
                : hiddenIconPosition.x + 50 + 20; // 右侧20px间距，50是图标宽度
              
              setSliderPosition({
                x: Math.max(0, Math.min(newX, window.innerWidth - sliderSize.width - 20)),
                y: hiddenIconPosition.y - sliderSize.height / 2 + 25 // 垂直居中，25是图标高度的一半
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
            onDoubleClick={handleSliderDoubleClick}
            >
          {/* 缩放手柄 */}
          {isSliderFixed && (
            <div style={{
              position: 'absolute',
              right: '-8px',
              bottom: '-8px',
              width: '16px',
              height: '16px',
              backgroundColor: '#fff',
              border: '1px solid #d9d9d9',
              borderRadius: '50%',
              cursor: 'nwse-resize',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              zIndex: 1000
            }}
            onMouseDown={handleResizeStart}
            />
          )}
          <div style={{ 
            display: 'flex', 
            gap: '16px',
            marginBottom: 16 
          }}>
            {/* 滑块div */}
            <div style={{ 
              flex: 1,
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{ 
                position: 'relative', 
                width: '100%',
                padding: '16px 20px',
                background: statisticType === 'red' 
                  ? 'linear-gradient(135deg, rgba(245, 34, 45, 0.05) 0%, rgba(245, 34, 45, 0.15) 100%)' 
                  : 'linear-gradient(135deg, rgba(24, 144, 255, 0.05) 0%, rgba(24, 144, 255, 0.15) 100%)',
                borderRadius: 6
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
                  {/* 快退图标 - 最左侧，带圆圈边框 */}
                  <div style={{
                    cursor: sliderRange[0] <= 0 ? 'not-allowed' : 'pointer',
                    userSelect: 'none',
                    border: `1px solid ${statisticType === 'red' ? '#f5222d' : '#1890ff'}`,
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transition: 'all 0.3s',
                    color: sliderRange[0] <= 0 ? '#d9d9d9' : (statisticType === 'red' ? '#f5222d' : '#1890ff'),
                    borderColor: sliderRange[0] <= 0 ? '#d9d9d9' : (statisticType === 'red' ? '#f5222d' : '#1890ff'),
                    padding: 0,
                    margin: 0,
                    opacity: sliderRange[0] <= 0 ? 0.5 : 1
                  }}
                  onClick={() => {
                    if (sliderRange[0] > 0) {
                      const newRange: [number, number] = [0, sliderRange[1]];
                      setSliderRange(newRange);
                      handleSliderChange(newRange);
                    }
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}>
                    <FastBackwardOutlined style={{ fontSize: '18px' }} />
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* 左端减1按钮 */}
                    <button
                      onClick={() => {
                        if (sliderRange[0] > 0) {
                          const newRange: [number, number] = [sliderRange[0] - 1, sliderRange[1]];
                          setSliderRange(newRange);
                          handleSliderChange(newRange);
                        }
                      }}
                      onDoubleClick={(e) => e.stopPropagation()}
                      disabled={sliderRange[0] <= 0}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: `1px solid ${sliderRange[0] <= 0 ? '#d9d9d9' : (statisticType === 'red' ? '#f5222d' : '#1890ff')}`,
                        backgroundColor: '#fff',
                        color: sliderRange[0] <= 0 ? '#d9d9d9' : (statisticType === 'red' ? '#f5222d' : '#1890ff'),
                        cursor: sliderRange[0] <= 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxSizing: 'border-box',
                        padding: 0,
                        margin: 0,
                        opacity: sliderRange[0] <= 0 ? 0.5 : 1
                      }}
                    >
                      <StepBackwardOutlined style={{ fontSize: '14px' }} />
                    </button>
                    
                    {/* 左端加1按钮 */}
                    <button
                      onClick={() => {
                        if (sliderRange[0] < sliderRange[1]) {
                          const newRange: [number, number] = [sliderRange[0] + 1, sliderRange[1]];
                          setSliderRange(newRange);
                          handleSliderChange(newRange);
                        }
                      }}
                      onDoubleClick={(e) => e.stopPropagation()}
                      disabled={sliderRange[0] >= sliderRange[1]}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: `1px solid ${statisticType === 'red' ? '#f5222d' : '#1890ff'}`,
                        backgroundColor: '#fff',
                        color: statisticType === 'red' ? '#f5222d' : '#1890ff',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxSizing: 'border-box',
                        padding: 0,
                        margin: 0
                      }}
                    >
                      <StepForwardOutlined style={{ fontSize: '14px' }} />
                    </button>
                  </div>
              
                    {/* 右端减1按钮 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => {
                        if (sliderRange[1] > sliderRange[0]) {
                          const newRange: [number, number] = [sliderRange[0], sliderRange[1] - 1];
                          setSliderRange(newRange);
                          handleSliderChange(newRange);
                        }
                      }}
                      onDoubleClick={(e) => e.stopPropagation()} // 阻止双击事件冒泡，防止隐藏滑块
                      disabled={sliderRange[1] <= sliderRange[0]}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: `1px solid ${statisticType === 'red' ? '#f5222d' : '#1890ff'}`,
                        backgroundColor: '#fff',
                        color: statisticType === 'red' ? '#f5222d' : '#1890ff',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxSizing: 'border-box',
                        padding: 0,
                        margin: 0
                      }}
                    >
                      <StepBackwardOutlined style={{ fontSize: '14px' }} />
                    </button>
                    
                    {/* 右端加1按钮 */}
                    <button
                      onClick={() => {
                        if (sliderRange[1] < allRecords.length - 1) {
                          const newRange: [number, number] = [sliderRange[0], sliderRange[1] + 1];
                          setSliderRange(newRange);
                          handleSliderChange(newRange);
                        }
                      }}
                      onDoubleClick={(e) => e.stopPropagation()}
                      disabled={sliderRange[1] >= allRecords.length - 1}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: `1px solid ${sliderRange[1] >= allRecords.length - 1 ? '#d9d9d9' : (statisticType === 'red' ? '#f5222d' : '#1890ff')}`,
                        backgroundColor: '#fff',
                        color: sliderRange[1] >= allRecords.length - 1 ? '#d9d9d9' : (statisticType === 'red' ? '#f5222d' : '#1890ff'),
                        cursor: sliderRange[1] >= allRecords.length - 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxSizing: 'border-box',
                        padding: 0,
                        margin: 0,
                        opacity: sliderRange[1] >= allRecords.length - 1 ? 0.5 : 1
                      }}
                    >
                      <StepForwardOutlined style={{ fontSize: '14px' }} />
                    </button>
                  </div>
                  
                  {/* 快进图标 */}
                  <div style={{
                    cursor: sliderRange[1] >= allRecords.length - 1 ? 'not-allowed' : 'pointer',
                    userSelect: 'none',
                    border: `1px solid ${statisticType === 'red' ? '#f5222d' : '#1890ff'}`,
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transition: 'all 0.3s',
                    color: sliderRange[1] >= allRecords.length - 1 ? '#d9d9d9' : (statisticType === 'red' ? '#f5222d' : '#1890ff'),
                    borderColor: sliderRange[1] >= allRecords.length - 1 ? '#d9d9d9' : (statisticType === 'red' ? '#f5222d' : '#1890ff'),
                    padding: 0,
                    margin: 0,
                    opacity: sliderRange[1] >= allRecords.length - 1 ? 0.5 : 1
                  }}
                  onClick={() => {
                    if (sliderRange[1] < allRecords.length - 1) {
                      const newRange: [number, number] = [sliderRange[0], allRecords.length - 1];
                      setSliderRange(newRange);
                      handleSliderChange(newRange);
                    }
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}>
                    <FastForwardOutlined style={{ fontSize: '18px' }} />
                  </div>
                </div>
                
                {/* 滑块 */}
                <div style={{ 
                  width: '100%', 
                  margin: '0 auto',
                  padding: '0 6px',
                  position: 'relative',
                  boxSizing: 'border-box'
                }}>
                  {/* 简单的背景线，去掉粗细渐变效果 */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '6px',
                    right: '6px',
                    height: '6px',
                    transform: 'translateY(-50%)',
                    zIndex: -1,
                    background: statisticType === 'red' 
                      ? 'rgba(245, 34, 45, 0.15)'
                      : 'rgba(24, 144, 255, 0.15)',
                    borderRadius: '3px'
                  }} />
                  
                  {/* 实际滑块 */}
                  <Slider
                    range
                    min={0}
                    max={allRecords.length - 1}
                    value={sliderRange}
                    onChange={handleSliderChange}
                    style={{ 
                      width: '100%',
                      margin: 0,
                      backgroundColor: 'transparent' // 隐藏默认滑块背景
                    }}
                    trackStyle={[
                      {
                        background: statisticType === 'red' 
                          ? 'linear-gradient(90deg, #f5222d 0%, #cf1322 100%)' 
                          : 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)',
                        height: '4px',
                        borderRadius: '2px',
                        boxShadow: 'none'
                      }
                    ]}
                    handleStyle={[
                      {
                        borderWidth: 2,
                        borderColor: statisticType === 'red' ? '#f5222d' : '#1890ff',
                        backgroundColor: statisticType === 'red' ? '#f5222d' : '#1890ff',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                      },
                      {
                        borderWidth: 2,
                        borderColor: statisticType === 'red' ? '#f5222d' : '#1890ff',
                        backgroundColor: statisticType === 'red' ? '#f5222d' : '#1890ff',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                      }
                    ]}
                  />
                </div>
              </div>
            </div>
            

          </div>
            </div>
          )}
        </>
      )}
      

    </div>
  );
};

export default Statistics;
