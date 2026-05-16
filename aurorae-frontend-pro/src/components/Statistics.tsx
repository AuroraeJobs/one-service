import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  CloudFilled,
  ChromeOutlined,
  DockerOutlined,
  RubyOutlined
} from '@ant-design/icons';

import { useRecordContext } from '../contexts/RecordContext';
// 导入 ECharts


// 定义数据接口
interface AnalysisResult {
  [key: string]: {
    count: number;
    percent: number;
  };
}



// 移除未使用的TabPane声明



const Statistics: React.FC<{ isTabVisible: boolean }> = ({ isTabVisible }) => {
  const location = useLocation();
  const isFitnessMenu = location.pathname.includes('/fitness');
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
  // 统计范围内中奖号码总和
  const [winningNumbersSum, setWinningNumbersSum] = useState<{
    redSum: number;
    blueSum: number;
  }>({ redSum: 0, blueSum: 0 });
  // 滑块相关状态
  const [allRecords, setAllRecords] = useState<string[]>([]);
  const [sliderRange, setSliderRange] = useState<[number, number]>([0, 0]);
  // 统计类型切换状态
  const [statisticType, setStatisticType] = useState<'red' | 'blue'>('red');
  // 结束行中奖号码状态
  const [endLineNumbers, setEndLineNumbers] = useState<string[]>([]);
  // 控制是否只显示最后一期中奖号码的状态
  const [showOnlyLastWinning, setShowOnlyLastWinning] = useState(true);
  // 从Context获取数据
  const { allRecords: contextAllRecords, loading: contextLoading } = useRecordContext();
  
  // 切换按钮拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  // 滑块隐藏图标拖拽状态
  const [isHiddenIconDragging, setIsHiddenIconDragging] = useState(false);
  // 滑块隐藏图标初始位置，放在切换按钮上方
  const [hiddenIconPosition, setHiddenIconPosition] = useState({
    x: window.innerWidth - 90, // 右侧20px，圆心在window.innerWidth - 65px
    y: window.innerHeight - 200 // 底部上移，位于切换按钮上方，间距60px
  });
  const [hiddenIconDragOffset, setHiddenIconDragOffset] = useState({ x: 0, y: 0 });
  
  // 切换按钮初始位置，放在右下角，上移避免被页脚挡住
  const [buttonPosition, setButtonPosition] = useState({ 
    x: window.innerWidth - 105, // 右侧20px，竖直中心线在window.innerWidth - 65px
    y: window.innerHeight - 140 // 底部上移70px，避免被页脚挡住
  });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // 滑块区域拖拽状态
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  // 初始化滑块位置为右下角，避免遮挡页脚图标
  const [sliderPosition, setSliderPosition] = useState({
    x: window.innerWidth - window.innerWidth / 3 - 20, // 距离右侧20px
    y: window.innerHeight - 150 - 150 // 距离底部150px，上移70px
  });
  const [sliderDragOffset, setSliderDragOffset] = useState({ x: 0, y: 0 });
  // 控制滑块是否处于固定定位状态 - 默认始终固定定位
  const [isSliderFixed, setIsSliderFixed] = useState(true);
  // 固定滑块尺寸为页面宽度的1/3
  const sliderSize = { 
    width: window.innerWidth / 3, 
    height: 150 
  };
  // 滑块隐藏状态 - 默认隐藏
  const [isSliderHidden, setIsSliderHidden] = useState(true);
  // 滑块双击隐藏事件
  const handleSliderDoubleClick = () => {
    setIsSliderHidden(!isSliderHidden);
  };
  

  
  // Tab容器拖动状态管理
  const [isTabContainerDragging, setIsTabContainerDragging] = useState(false);
  const [tabContainerPosition, setTabContainerPosition] = useState({
    x: window.innerWidth / 2 - 200, // 初始居中，宽度约400px
    y: window.innerHeight - 140 // 底部上方140px，再往上调整20px
  });
  const [tabContainerDragOffset, setTabContainerDragOffset] = useState({ x: 0, y: 0 });

  
  // 图表数据控制 - 显示所有数据，去掉分页逻辑



  
  // 窗口大小变化时调整所有悬浮元素位置
  useEffect(() => {
    const handleResize = () => {
      // 始终保持距离底部150px，避免遮挡页脚图标和切换按钮
      setSliderPosition(prev => ({
        ...prev,
        y: window.innerHeight - sliderSize.height - 150
      }));

      // 计算按钮中心位置：所有按钮的圆心或竖直中心线应该在同一条竖线上
      // 圆形按钮（50px直径）的圆心位置：x + 25px
      // 切换按钮（80px宽）的竖直中心线：x + 40px
      // 为了对齐，将所有按钮的中心位置设置为 window.innerWidth - 65px
      // 因此：
      // - 圆形按钮的x坐标：window.innerWidth - 65px - 25px = window.innerWidth - 90px
      // - 切换按钮的x坐标：window.innerWidth - 65px - 40px = window.innerWidth - 105px
      
      // 计算统一的y坐标，确保垂直布局，同时上移避免被页脚挡住
      const buttonY = window.innerHeight - 140; // 切换按钮在底部上方140px
      const hiddenIconY = window.innerHeight - 200; // 滑块隐藏图标在切换按钮上方60px

      // 调整滑块隐藏图标的位置，无论窗口放大还是缩小，都保持统一位置
      setHiddenIconPosition({
        x: window.innerWidth - 90, // 圆心在window.innerWidth - 65px
        y: hiddenIconY // 始终保持在切换按钮上方
      });

      // 调整切换按钮的位置，无论窗口放大还是缩小，都保持统一位置
      setButtonPosition({
        x: window.innerWidth - 105, // 竖直中心线在window.innerWidth - 65px
        y: buttonY // 始终保持在底部上方140px，避免被页脚挡住
      });

      // 调整Tab容器位置，确保在页面缩放时保持居中
      setTabContainerPosition(prev => ({
        x: window.innerWidth / 2 - 200, // 初始居中，宽度约400px
        y: prev.y // 保持原来的y坐标
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

  // Tab容器拖拽事件处理
  const handleTabContainerMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTabContainerDragging(true);
    setTabContainerDragOffset({
      x: e.clientX - tabContainerPosition.x,
      y: e.clientY - tabContainerPosition.y
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
    } else if (isTabContainerDragging) {
      // 拖动Tab容器
      const newX = e.clientX - tabContainerDragOffset.x;
      const newY = e.clientY - tabContainerDragOffset.y;
      
      // 限制在视窗内
      const maxX = window.innerWidth - 400; // Tab容器宽度约400px
      const maxY = window.innerHeight - 80; // Tab容器高度约80px
      
      setTabContainerPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsHiddenIconDragging(false);
    setIsSliderDragging(false);
    setIsTabContainerDragging(false);
  };
  


  // 添加全局事件监听
  useEffect(() => {
    if (isDragging || isHiddenIconDragging || isSliderDragging || isTabContainerDragging) {
      document.addEventListener('mousemove', handleMouseMove as unknown as EventListener);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove as unknown as EventListener);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isHiddenIconDragging, isSliderDragging, isTabContainerDragging]);

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




  // 渲染号码选择器 - 固定大小，类似滑块操作面板


  // 渲染柱状图


  // 渲染号码选择器相关功能


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

    // 统计范围内中奖号码总和
    let redSum = 0;
    let blueSum = 0;

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
        
        // 计算红球总和
        const redNum = parseInt(redBall);
        redSum += redNum;
        
        // 统计红球奇偶
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
      
      // 计算蓝球总和
      const blueNum = parseInt(blueBall);
      blueSum += blueNum;
      
      // 统计蓝球奇偶
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

    // 更新统计范围内中奖号码总和
    setWinningNumbersSum({ redSum, blueSum });

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

  // 当Context中的数据变化时，更新组件状态
  useEffect(() => {
    // 防止在StrictMode下运行两次
    if (contextAllRecords && contextAllRecords.length > 0) {
      setLoading(contextLoading);
      
      let recordsToUse: string[];
      if (typeof contextAllRecords === 'string') {
        // 接口返回的是字符串，通过换行符分割成数组
        recordsToUse = contextAllRecords
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0);
        console.log('字符串分割后记录数据长度:', recordsToUse.length);
      } else if (Array.isArray(contextAllRecords)) {
        // 接口返回的是数组，直接使用
        recordsToUse = contextAllRecords;
        console.log('数组记录数据长度:', recordsToUse.length);
      } else {
        // 如果数据格式不正确，使用模拟数据
        console.error('获取到的数据不是字符串或数组，使用模拟数据:', contextAllRecords);
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
      
      setLoading(false);
    }
  }, [contextAllRecords, contextLoading, statisticType]);

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


  
  // 当前活动标签页
  const [activeTabKey, setActiveTabKey] = useState<string>(statisticType === 'red' ? '1' : '2');



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



    // 根据当前统计类型设置颜色和获取相关数据
    const currentColor = statisticType === 'red' ? '#f5222d' : '#1890ff';
    const stats = statisticType === 'red' ? specialRedStats : specialBlueStats;
    const isRed = statisticType === 'red';
    
    // 计算平均值
    const totalCount = Object.values(data).reduce((sum, val) => sum + val.count, 0);
    const avgCount = isRed ? totalCount / 33 : totalCount / 16;

    // 直接使用原始排序，移除自定义拖拽排序
    const orderedData = sortedData;

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
            >
              <Card 
                      title={
                        <div style={{ 
                          position: 'relative',
                          textAlign: 'center',
                          height: '30px',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          {/* 左上角显示中奖号码标记（五角星） */}
                          {isWinningNumber && (
                            <StarFilled 
                              style={{
                                position: 'absolute',
                                top: '50%',
                                left: '0px',
                                color: currentColor,
                                fontSize: '18px',
                                zIndex: 10,
                                transform: 'translateY(-50%)'
                              }}
                            />
                          )}
                          {/* 右上角显示号码 */}
                          <div style={{ 
                            position: 'absolute',
                            top: '50%',
                            right: '0',
                            color: currentColor,
                            fontSize: '14px',
                            fontWeight: 'bold',
                            transform: 'translateY(-50%)'
                          }}>
                            {item.name}
                          </div>
                          {/* 中间显示人物名称 */}
                          <div style={{ 
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: currentColor
                          }}>
                            {isRed ? redBallConfig.numberToName[item.name as keyof typeof redBallConfig.numberToName] : blueBallConfig.numberToName[item.name as keyof typeof blueBallConfig.numberToName]}
                          </div>
                        </div>
                      } 
                      variant="outlined"
                      size="small"
                      style={{
                        width: '100%',
                        marginBottom: '16px',
                        // 增大内边距，让内容离边缘更远
                        padding: '20px',
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
                        // 初始状态
                        transform: 'translateZ(0) scale(1)',
                        // 增强厚度视觉效果 - 多层阴影模拟真实厚度和发光效果
                        boxShadow: `0 0 20px ${currentColor}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${currentColor}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
                        // 增强边框效果，进一步提升厚度感
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        // 确保背景样式能够覆盖组件默认样式
                        backgroundClip: 'padding-box'
                      }}
                onMouseEnter={(e) => {
                  const card = e.currentTarget;
                  card.style.transform = 'translateZ(10px) scale(1.02)';
                  card.style.boxShadow = `0 0 25px ${currentColor}80, 0 15px 40px rgba(0, 0, 0, 0.6), inset 0 0 15px ${currentColor}30, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
                  card.style.cursor = 'pointer';
                }}
                onMouseLeave={(e) => {
                  const card = e.currentTarget;
                  card.style.transform = 'translateZ(0) scale(1)';
                  card.style.boxShadow = `0 0 20px ${currentColor}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${currentColor}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
                  card.style.cursor = 'pointer';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#888888' }}>次数</span>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: currentColor }}>
                      {item.count}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#888888' }}>
                      连续未出现
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: currentColor }}>
                      {(stats.absentCounts[item.name] || 0)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#888888' }}>
                      与平均值差值
                    </span>
                    <span style={{ 
                      fontSize: '16px', 
                      fontWeight: 'bold', 
                      color: diff >= 0 ? '#389e0d' : '#ff4d4f'
                    }}>
                      {`${diff >= 0 ? '+' : ''}${diff.toFixed(1)}`}
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
  const renderDistributionList = (data: AnalysisResult, type?: 'red' | 'blue') => {
    const distributionData = Object.entries(data).map(([key, value]) => ({
      name: key === 'odd' ? '奇数' : 
            key === 'even' ? '偶数' : 
            key === 'small' ? '小号' : 
            key === 'large' ? '大号' : 
            key === 'total' ? '中奖号码总和' : 
            key === 'non_winning_total' ? '未中奖号码总和' : 
            key,
      count: value.count,
      percent: value.percent,
      originalKey: key
    }));



    // 根据当前统计类型设置颜色
    const currentColor = statisticType === 'red' ? '#f5222d' : '#1890ff';

    // 直接使用原始排序，移除自定义拖拽排序
    const orderedData = distributionData;

    return (
      <Row gutter={[16, 16]}>
        {orderedData.map((item, index) => {
          return (
              <Col xs={24} sm={12} md={12} lg={12} xl={12} key={index}>
                <Card 
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px', fontWeight: 'bold', color: currentColor }}>
                      {item.name}
                      {(item.originalKey === 'small' || item.originalKey === 'large') && type && (
                        <Tooltip 
                          title={type === 'red' ? 
                            (item.originalKey === 'small' ? '红球小号范围：1-16' : '红球大号范围：17-33') : 
                            (item.originalKey === 'small' ? '蓝球小号范围：1-8' : '蓝球大号范围：9-16')} 
                          placement="top"
                        >
                          <InfoCircleOutlined style={{ 
                            cursor: 'default', 
                            color: '#999', 
                            fontSize: '16px',
                          }} />
                        </Tooltip>
                      )}
                    </div>
                  } 
                  variant="outlined"
                  size="small"
                  style={{
                    width: '100%',
                    marginBottom: '16px',
                    // 增大内边距，让内容离边缘更远
                    padding: '20px',
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
                    // 初始状态
                    transform: 'translateZ(0) scale(1)',
                    // 增强厚度视觉效果 - 多层阴影模拟真实厚度和发光效果
                    boxShadow: `0 0 20px ${currentColor}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${currentColor}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
                    // 增强边框效果，进一步提升厚度感
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    // 确保背景样式能够覆盖组件默认样式
                    backgroundClip: 'padding-box'
                  }}
                  onMouseEnter={(e) => {
                    const card = e.currentTarget;
                    card.style.transform = 'translateZ(10px) scale(1.02)';
                    card.style.boxShadow = `0 0 25px ${currentColor}80, 0 15px 40px rgba(0, 0, 0, 0.6), inset 0 0 15px ${currentColor}30, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
                    card.style.cursor = 'pointer';
                  }}
                  onMouseLeave={(e) => {
                    const card = e.currentTarget;
                    card.style.transform = 'translateZ(0) scale(1)';
                    card.style.boxShadow = `0 0 20px ${currentColor}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${currentColor}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
                    card.style.cursor = 'pointer';
                  }}
                >
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  justifyContent: 'center'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    whiteSpace: 'nowrap' 
                  }}>
                    <span style={{ fontSize: '14px', color: '#888888' }}>次数</span>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: currentColor }}>
                      {item.count}
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

    // 直接使用原始排序，移除自定义拖拽排序
    const orderedCards = allCards;
    
    return (
      <div>
        {/* 合并个体和分组统计 */}
        <Card 
          title={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <button
                onClick={() => setShowOnlyLastWinning(!showOnlyLastWinning)}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  color: '#f5222d',
                  border: 'none',
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
          style={{ backgroundColor: 'transparent', border: 'none' }}>


          {/* 红球分组统计：6列布局，每组12个卡片占2行，共3组36个卡片 */}
          {/* 将卡片按组分组，确保每个组名卡片在新行开始 */}
          {(() => {
            // 过滤出要显示的卡片
            const filteredCards = orderedCards.filter(item => {
              if (!showOnlyLastWinning) return true;
              if (item.type === 'group') return true;
              return endLineNumbers.includes((item as { number: string }).number);
            });

            // 将卡片按组分组
            const groupedCards = [];
            let currentGroup: any[] = [];
            filteredCards.forEach(card => {
              if (card.type === 'group') {
                // 如果当前已有组，先保存
                if (currentGroup.length > 0) {
                  groupedCards.push(currentGroup);
                  currentGroup = [];
                }
                // 开始新组
                currentGroup.push(card);
              } else {
                // 添加到当前组
                currentGroup.push(card);
              }
            });
            // 保存最后一组
            if (currentGroup.length > 0) {
              groupedCards.push(currentGroup);
            }

            // 渲染每组卡片，每组使用一个新的Row
            return groupedCards.map((group, groupIndex) => (
              <Row key={groupIndex} gutter={[16, 16]} style={{ marginBottom: '16px' }}>
                {group.map((item, index) => (
                  <Col 
                    key={`${groupIndex}-${index}`} 
                    xs={24} 
                    sm={12} 
                    md={8} 
                    lg={4} 
                    xl={4}

                  >
                <Card 
                  title={
                    <div style={{ 
                      color: currentColor,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      position: 'relative',
                      height: '30px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      {/* 左上角显示星星图标（如果是中奖号码） */}
                      {item.type === 'number' && endLineNumbers.includes((item as { number: string }).number) && (
                        <StarFilled 
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '0px',
                            color: currentColor,
                            fontSize: '18px',
                            zIndex: 10,
                            transform: 'translateY(-50%)'
                          }}
                        />
                      )}
                      {/* 右上角显示号码（如果是数字类型卡片） */}
                      {item.type === 'number' && (
                        <div style={{ 
                          position: 'absolute',
                          top: '50%',
                          right: '0',
                          color: currentColor,
                          fontSize: '14px',
                          fontWeight: 'bold',
                          transform: 'translateY(-50%)'
                        }}>
                          {(item as { number: string }).number}
                        </div>
                      )}
                      {/* 中间显示名称 */}
                      <div style={{ 
                        flex: 1,
                        textAlign: 'center',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%'
                      }}>
                        {item.name}
                      </div>
                    </div>
                  } 
                  variant="outlined"
                  size="small"

                  style={{
                    width: '100%',
                    marginBottom: '16px',
                    // 增大内边距，让内容离边缘更远
                    padding: '20px',
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
                    // 初始状态
                    transform: 'translateZ(0) scale(1)',
                    // 增强厚度视觉效果 - 多层阴影模拟真实厚度和发光效果
                    boxShadow: `0 0 20px ${currentColor}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${currentColor}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
                    // 增强边框效果，进一步提升厚度感
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    // 确保背景样式能够覆盖组件默认样式
                    backgroundClip: 'padding-box'
                  }}
                  onMouseEnter={(e) => {
                    const card = e.currentTarget;
                    card.style.transform = 'translateZ(10px) scale(1.02)';
                    card.style.boxShadow = `0 0 25px ${currentColor}80, 0 15px 40px rgba(0, 0, 0, 0.6), inset 0 0 15px ${currentColor}30, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
                    card.style.cursor = 'pointer';
                  }}
                  onMouseLeave={(e) => {
                    const card = e.currentTarget;
                    card.style.transform = 'translateZ(0) scale(1)';
                    card.style.boxShadow = `0 0 20px ${currentColor}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${currentColor}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
                    card.style.cursor = 'pointer';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#888888' }}>
                        {item.type === 'group' ? '总次数' : '次数'}
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: currentColor }}>
                        {item.count}
                      </span>
                    </div>
                    {item.type === 'group' && (
                      <>
                        {/* 计算该组连续未出现次数的最大值 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: '#888888' }}>
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
                                return `${maxAbsentCount}`;
                              }
                              return '0';
                            })()}
                          </span>
                        </div>
                        {/* 计算与（平均数*每组球数）的差值 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: '#888888' }}>
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
                              return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}`;
                            })()}
                          </span>
                        </div>
                      </>
                    )}
                    {item.type === 'number' && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: '#888888' }}>
                            连续未出现
                          </span>
                          <span style={{ fontSize: '16px', fontWeight: 'bold', color: currentColor }}>
                            {(isRed ? stats.absentCounts[(item as { number: string }).number] : stats.absentCounts[(item as { number: string }).number]) || 0}
                          </span>
                        </div>
                        {/* 计算出现次数与平均的差值 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: '#888888' }}>
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
                              return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}`;
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
            ));
          })()}
        </Card>
      </div>
    );
  };

  return (
    <>
      {/* 可拖拽的切换按钮 */}
      <div style={{
        position: 'fixed',
        left: `${buttonPosition.x}px`,
        top: `${buttonPosition.y}px`,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        borderRadius: '4px', // 长方形
        width: '80px', // 更长的长方形
        height: '50px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
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
      <div style={{ marginTop: 32, marginBottom: 24, marginLeft: 24, marginRight: 24, display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {/* 总数据量卡片 */}
        <div style={{ flex: 1, minWidth: '160px' }}>
          <Card 
            variant="outlined"
            style={{
              width: '100%',
              marginBottom: '16px',
              // 增大内边距，让内容离边缘更远
              padding: '20px',
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
              // 初始状态
              transform: 'translateZ(0) scale(1)',
              // 增强厚度视觉效果 - 多层阴影模拟真实厚度和发光效果
              boxShadow: `0 0 20px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
              // 增强边框效果，进一步提升厚度感
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              height: '100%',
              minHeight: '120px'
            }}
            onMouseEnter={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'translateZ(10px) scale(1.02)';
              card.style.boxShadow = `0 0 25px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}80, 0 15px 40px rgba(0, 0, 0, 0.6), inset 0 0 15px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}30, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
              card.style.cursor = 'pointer';
            }}
            onMouseLeave={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'translateZ(0) scale(1)';
              card.style.boxShadow = `0 0 20px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
              card.style.cursor = 'pointer';
            }}>
            <Statistic
              title={<div style={{ color: '#ffffff', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>总数据量</div>}
              value={totalRecords}
              prefix={<AreaChartOutlined />}
              valueStyle={{ color: statisticType === 'red' ? '#f5222d' : '#1890ff', fontWeight: 'bold' }}
            />
          </Card>
        </div>
        
        {/* 红球/蓝球总数卡片 */}
        <div style={{ flex: 1, minWidth: '160px' }}>
          <Card 
            variant="outlined"
            style={{
              width: '100%',
              marginBottom: '16px',
              // 增大内边距，让内容离边缘更远
              padding: '20px',
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
              // 初始状态
              transform: 'translateZ(0) scale(1)',
              // 增强厚度视觉效果 - 多层阴影模拟真实厚度和发光效果
              boxShadow: `0 0 20px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
              // 增强边框效果，进一步提升厚度感
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              height: '100%',
              minHeight: '120px'
            }}
            onMouseEnter={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'translateZ(10px) scale(1.02)';
              card.style.boxShadow = `0 0 25px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}80, 0 15px 40px rgba(0, 0, 0, 0.6), inset 0 0 15px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}30, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
              card.style.cursor = 'pointer';
            }}
            onMouseLeave={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'translateZ(0) scale(1)';
              card.style.boxShadow = `0 0 20px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
              card.style.cursor = 'pointer';
            }}
          >
            <Statistic
              title={<div style={{ color: '#ffffff', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>总次数</div>}
              value={statisticType === 'red' 
                ? Object.values(redBallFrequency).reduce((sum, item) => sum + item.count, 0) 
                : Object.values(blueBallFrequency).reduce((sum, item) => sum + item.count, 0)}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: statisticType === 'red' ? '#f5222d' : '#1890ff', fontWeight: 'bold' }}
            />
          </Card>
        </div>
        
        {/* 平均次数卡片 */}
        <div style={{ flex: 1, minWidth: '160px' }}>
          <Card 
            variant="outlined"
            style={{
              width: '100%',
              marginBottom: '16px',
              // 增大内边距，让内容离边缘更远
              padding: '20px',
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
              // 初始状态
              transform: 'translateZ(0) scale(1)',
              // 增强厚度视觉效果 - 多层阴影模拟真实厚度和发光效果
              boxShadow: `0 0 20px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
              // 增强边框效果，进一步提升厚度感
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              height: '100%',
              minHeight: '120px'
            }}
            onMouseEnter={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'translateZ(10px) scale(1.02)';
              card.style.boxShadow = `0 0 25px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}80, 0 15px 40px rgba(0, 0, 0, 0.6), inset 0 0 15px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}30, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
              card.style.cursor = 'pointer';
            }}
            onMouseLeave={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'translateZ(0) scale(1)';
              card.style.boxShadow = `0 0 20px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
              card.style.cursor = 'pointer';
            }}
          >
            <Statistic
              title={<div style={{ color: '#ffffff', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>平均</div>}
              value={statisticType === 'red' 
                ? Math.round(Object.values(redBallFrequency).reduce((sum, item) => sum + item.count, 0) / 33 * 10) / 10 
                : Math.round(Object.values(blueBallFrequency).reduce((sum, item) => sum + item.count, 0) / 16 * 10) / 10}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: statisticType === 'red' ? '#f5222d' : '#1890ff', fontWeight: 'bold' }}
            />
          </Card>
        </div>
        
        {/* 红球/蓝球号码覆盖卡片 */}
        <div style={{ flex: 1, minWidth: '160px' }}>
          <Card 
            variant="outlined"
            style={{
              width: '100%',
              marginBottom: '16px',
              // 增大内边距，让内容离边缘更远
              padding: '20px',
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
              // 初始状态
              transform: 'translateZ(0) scale(1)',
              // 增强厚度视觉效果 - 多层阴影模拟真实厚度和发光效果
              boxShadow: `0 0 20px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
              // 增强边框效果，进一步提升厚度感
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              height: '100%',
              minHeight: '120px'
            }}
            onMouseEnter={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'translateZ(10px) scale(1.02)';
              card.style.boxShadow = `0 0 25px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}80, 0 15px 40px rgba(0, 0, 0, 0.6), inset 0 0 15px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}30, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
              card.style.cursor = 'pointer';
            }}
            onMouseLeave={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'translateZ(0) scale(1)';
              card.style.boxShadow = `0 0 20px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
              card.style.cursor = 'pointer';
            }}
          >
            <Statistic
              title={<div style={{ color: '#ffffff', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>覆盖率</div>}
              value={statisticType === 'red' 
                ? Object.keys(redBallFrequency).length 
                : Object.keys(blueBallFrequency).length}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: statisticType === 'red' ? '#f5222d' : '#1890ff', fontWeight: 'bold' }}
              suffix={statisticType === 'red' ? "/33" : "/16"}
            />
          </Card>
        </div>
        
        {/* 中奖号码总和卡片 - 放在最后 */}
        <div style={{ flex: 1, minWidth: '160px' }}>
          <Card 
            variant="outlined"
            style={{
              width: '100%',
              marginBottom: '16px',
              // 增大内边距，让内容离边缘更远
              padding: '20px',
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
              // 初始状态
              transform: 'translateZ(0) scale(1)',
              // 增强厚度视觉效果 - 多层阴影模拟真实厚度和发光效果
              boxShadow: `0 0 20px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
              // 增强边框效果，进一步提升厚度感
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              height: '100%',
              minHeight: '120px'
            }}
            onMouseEnter={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'translateZ(10px) scale(1.02)';
              card.style.boxShadow = `0 0 25px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}80, 0 15px 40px rgba(0, 0, 0, 0.6), inset 0 0 15px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}30, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
              card.style.cursor = 'pointer';
            }}
            onMouseLeave={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'translateZ(0) scale(1)';
              card.style.boxShadow = `0 0 20px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
              card.style.cursor = 'pointer';
            }}
          >
            <Statistic
              title={<div style={{ color: '#ffffff', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>总和</div>}
              value={statisticType === 'red' ? winningNumbersSum.redSum : winningNumbersSum.blueSum}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: statisticType === 'red' ? '#f5222d' : '#1890ff', fontWeight: 'bold' }}
            />
          </Card>
        </div>
      </div>

      {/* 分析结果 */}
      <Spin spinning={loading} indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}>
        {/* 内容区域，给底部Tab留出空间 */}
        <div style={{ marginBottom: '80px' }}>
          {/* Tab内容显示区域 */}
          {activeTabKey === '1' && statisticType === 'red' && (
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Card 
                  title={
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <button
                        onClick={() => setShowOnlyLastWinning(!showOnlyLastWinning)}
                        style={{
                          padding: '8px',
                          backgroundColor: 'transparent',
                          color: '#f5222d',
                          border: 'none',
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
                  style={{ backgroundColor: 'transparent', border: 'none' }}
                >
                  {renderFrequencyList(redBallFrequency)}
                </Card>
              </Col>
            </Row>
          )}
          {activeTabKey === '3' && statisticType === 'red' && (
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={24} md={12} lg={12} xl={8}>
                <Card 
                  title={<div style={{ textAlign: 'center' }}>奇偶分布</div>} style={{ backgroundColor: 'transparent', border: 'none' }}>
                  {renderDistributionList(redBallOddEven)}
                </Card>
              </Col>
              <Col xs={24} sm={24} md={12} lg={12} xl={8}>
                <Card 
                  title={<div style={{ textAlign: 'center' }}>大小分布</div>} 
                  style={{ backgroundColor: 'transparent', border: 'none' }}
                >
                  {renderDistributionList(redBallSize, 'red')}
                </Card>
              </Col>
              <Col xs={24} sm={24} md={12} lg={12} xl={8}>
                <Card title={<div style={{ textAlign: 'center' }}>最后一期</div>} style={{ backgroundColor: 'transparent', border: 'none' }}>
                  {renderDistributionList(lastWinningNumbersTotalRed)}
                </Card>
              </Col>
            </Row>
          )}
          {activeTabKey === '5' && statisticType === 'red' && renderSpecialStats()}
          {activeTabKey === '2' && statisticType === 'blue' && (
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Card 
                  title={
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <button
                        onClick={() => setShowOnlyLastWinning(!showOnlyLastWinning)}
                        style={{
                          padding: '8px',
                          backgroundColor: 'transparent',
                          color: '#1890ff',
                          border: 'none',
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
                  style={{ backgroundColor: 'transparent', border: 'none' }}
                >
                  {renderFrequencyList(blueBallFrequency)}
                </Card>
              </Col>
            </Row>
          )}
          {activeTabKey === '4' && statisticType === 'blue' && (
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={24} md={12} lg={12} xl={8}>
                <Card title={<div style={{ textAlign: 'center' }}>奇偶分布</div>} style={{ backgroundColor: 'transparent', border: 'none' }}>
                  {renderDistributionList(blueBallOddEven)}
                </Card>
              </Col>
              <Col xs={24} sm={24} md={12} lg={12} xl={8}>
                <Card 
                  title={<div style={{ textAlign: 'center' }}>大小分布</div>} 
                  style={{ backgroundColor: 'transparent', border: 'none' }}
                >
                  {renderDistributionList(blueBallSize, 'blue')}
                </Card>
              </Col>
              <Col xs={24} sm={24} md={12} lg={12} xl={8}>
                <Card title={<div style={{ textAlign: 'center' }}>最后一期</div>} style={{ backgroundColor: 'transparent', border: 'none' }}>
                  {renderDistributionList(lastWinningNumbersTotalBlue)}
                </Card>
              </Col>
            </Row>
          )}
          {activeTabKey === '6' && statisticType === 'blue' && renderSpecialStats()}
        </div>
        
        {/* 底部悬浮可拖动Tab */}
        {isTabVisible && (
          <div 
            style={{
            position: 'fixed',
            left: `${tabContainerPosition.x}px`,
            top: `${tabContainerPosition.y}px`,
            backgroundColor: '#2a2a2a',
            borderRadius: '24px',
            boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.5)',
            padding: '8px 24px',
            width: 'fit-content',
            minWidth: '400px',
            maxWidth: '500px',
            cursor: isTabContainerDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            touchAction: 'none',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
            onMouseDown={handleTabContainerMouseDown}
          >
          <Tabs 
            activeKey={activeTabKey} 
            onChange={(key) => setActiveTabKey(key as string)}
            items={[
              ...(statisticType === 'red' ? [
                {
                  key: '1',
                  label: (
                    <div style={{
                      display: 'inline-block',
                      color: activeTabKey === '1' ? '#fff' : '#f5222d',
                      backgroundColor: activeTabKey === '1' ? '#f5222d' : '#3a3a3a',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      marginRight: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                      fontSize: '14px'
                    }}>
                      频率统计
                    </div>
                  ),
                  children: null
                },
                {
                  key: '5',
                  label: (
                    <div style={{
                      display: 'inline-block',
                      color: activeTabKey === '5' ? '#fff' : '#f5222d',
                      backgroundColor: activeTabKey === '5' ? '#f5222d' : '#f0f0f0',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      marginRight: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                      fontSize: '14px'
                    }}>
                      分组统计
                    </div>
                  ),
                  children: null
                },
                {
                  key: '3',
                  label: (
                    <div style={{
                      display: 'inline-block',
                      color: activeTabKey === '3' ? '#fff' : '#f5222d',
                      backgroundColor: activeTabKey === '3' ? '#f5222d' : '#f0f0f0',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                      fontSize: '14px'
                    }}>
                      分布统计
                    </div>
                  ),
                  children: null
                },

              ] : [
                {
                  key: '2',
                  label: (
                    <div style={{
                      display: 'inline-block',
                      color: activeTabKey === '2' ? '#fff' : '#1890ff',
                      backgroundColor: activeTabKey === '2' ? '#1890ff' : '#f0f0f0',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      marginRight: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                      fontSize: '14px'
                    }}>
                      频率统计
                    </div>
                  ),
                  children: null
                },
                {
                  key: '6',
                  label: (
                    <div style={{
                      display: 'inline-block',
                      color: activeTabKey === '6' ? '#fff' : '#1890ff',
                      backgroundColor: activeTabKey === '6' ? '#1890ff' : '#f0f0f0',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      marginRight: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                      fontSize: '14px'
                    }}>
                      分组统计
                    </div>
                  ),
                  children: null
                },
                {
                  key: '4',
                  label: (
                    <div style={{
                      display: 'inline-block',
                      color: activeTabKey === '4' ? '#fff' : '#1890ff',
                      backgroundColor: activeTabKey === '4' ? '#1890ff' : '#f0f0f0',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                      fontSize: '14px'
                    }}>
                      分布统计
                    </div>
                  ),
                  children: null
                },

              ])
            ]}
            style={{
              width: '100%',
              margin: 0,
              border: 'none',
              boxShadow: 'none'
            }}
            tabBarStyle={{
              borderBottom: 'none',
              backgroundColor: 'transparent',
              padding: '0',
              margin: '0',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          />
        </div>
        )}
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
              backgroundColor: 'transparent',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
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
              // 深色主题背景和渐变
              backgroundColor: '#1A1A1A',
              backgroundImage: 'linear-gradient(145deg, #252525, #101010)',
              borderRadius: 20, 
              // 增强厚度视觉效果 - 多层阴影模拟真实厚度和发光效果
              boxShadow: `0 0 20px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
              textAlign: 'center',
              cursor: isSliderDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none',
              zIndex: 999,
              width: `${sliderSize.width}px`,
              height: `${sliderSize.height}px`,
              overflow: 'auto',
              boxSizing: 'border-box',
              // 3d效果
              transformStyle: 'preserve-3d',
              perspective: '1000px',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              // 增强边框效果，进一步提升厚度感
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            onMouseDown={handleSliderMouseDown}
            onDoubleClick={handleSliderDoubleClick}
            >

              <div style={{ 
                position: 'relative', 
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '0 20px',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 12 }}>
                  {/* 快退图标 - 最左侧，带圆圈边框 */}
                  <div style={{ 
                    cursor: sliderRange[0] <= 0 ? 'not-allowed' : 'pointer',
                    userSelect: 'none',
                    border: `1px solid ${sliderRange[0] <= 0 ? 'rgba(102, 102, 102, 0.5)' : `rgba(${statisticType === 'red' ? '245, 34, 45' : '24, 144, 255'}, 0.7)`}`,
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transition: 'all 0.3s ease',
                    color: sliderRange[0] <= 0 ? '#999999' : (statisticType === 'red' ? '#f5222d' : '#1890ff'),
                    borderColor: sliderRange[0] <= 0 ? '#666666' : (statisticType === 'red' ? '#f5222d' : '#1890ff'),
                    padding: 0,
                    margin: 0,
                    opacity: sliderRange[0] <= 0 ? 0.6 : 1,
                    backgroundColor: sliderRange[0] <= 0 ? '#222222' : '#1A1A1A',
                    backgroundImage: sliderRange[0] <= 0 ? 'linear-gradient(145deg, #333333, #111111)' : 'linear-gradient(145deg, #252525, #101010)',
                    boxShadow: sliderRange[0] <= 0 ? 
                      `0 0 8px rgba(102, 102, 102, 0.3), 0 3px 8px rgba(0, 0, 0, 0.3), inset 0 0 3px rgba(102, 102, 102, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.05), inset 0 -2px 4px rgba(0, 0, 0, 0.3)` : 
                      `0 0 20px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 6px 20px rgba(0, 0, 0, 0.5), inset 0 0 8px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 4px 8px rgba(255, 255, 255, 0.15), inset 0 -4px 8px rgba(0, 0, 0, 0.4)`,
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                    transform: sliderRange[0] <= 0 ? 'translateZ(0) scale(0.95)' : 'translateZ(0) scale(1)'
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
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: `1px solid ${sliderRange[0] <= 0 ? 'rgba(102, 102, 102, 0.5)' : `rgba(${statisticType === 'red' ? '245, 34, 45' : '24, 144, 255'}, 0.7)`}`,
                          backgroundColor: sliderRange[0] <= 0 ? '#222222' : '#1A1A1A',
                          backgroundImage: sliderRange[0] <= 0 ? 'linear-gradient(145deg, #333333, #111111)' : 'linear-gradient(145deg, #252525, #101010)',
                          color: sliderRange[0] <= 0 ? '#999999' : (statisticType === 'red' ? '#f5222d' : '#1890ff'),
                          cursor: sliderRange[0] <= 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          boxSizing: 'border-box',
                          padding: 0,
                          margin: 0,
                          opacity: sliderRange[0] <= 0 ? 0.6 : 1,
                          transition: 'all 0.3s ease',
                          boxShadow: sliderRange[0] <= 0 ? 
                            `0 0 6px rgba(102, 102, 102, 0.3), 0 2px 6px rgba(0, 0, 0, 0.3), inset 0 0 2px rgba(102, 102, 102, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.05), inset 0 -1px 3px rgba(0, 0, 0, 0.3)` : 
                            `0 0 15px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 4px 15px rgba(0, 0, 0, 0.5), inset 0 0 5px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 2px 5px rgba(255, 255, 255, 0.15), inset 0 -2px 5px rgba(0, 0, 0, 0.4)`,
                          transformStyle: 'preserve-3d',
                          perspective: '1000px',
                          transform: sliderRange[0] <= 0 ? 'translateZ(0) scale(0.9)' : 'translateZ(0) scale(1)'
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
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: `1px solid ${sliderRange[0] >= sliderRange[1] ? 'rgba(102, 102, 102, 0.5)' : `rgba(${statisticType === 'red' ? '245, 34, 45' : '24, 144, 255'}, 0.7)`}`,
                          backgroundColor: sliderRange[0] >= sliderRange[1] ? '#222222' : '#1A1A1A',
                          backgroundImage: sliderRange[0] >= sliderRange[1] ? 'linear-gradient(145deg, #333333, #111111)' : 'linear-gradient(145deg, #252525, #101010)',
                          color: sliderRange[0] >= sliderRange[1] ? '#999999' : (statisticType === 'red' ? '#f5222d' : '#1890ff'),
                          cursor: sliderRange[0] >= sliderRange[1] ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          boxSizing: 'border-box',
                          padding: 0,
                          margin: 0,
                          opacity: sliderRange[0] >= sliderRange[1] ? 0.6 : 1,
                          transition: 'all 0.3s ease',
                          boxShadow: sliderRange[0] >= sliderRange[1] ? 
                            `0 0 6px rgba(102, 102, 102, 0.3), 0 2px 6px rgba(0, 0, 0, 0.3), inset 0 0 2px rgba(102, 102, 102, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.05), inset 0 -1px 3px rgba(0, 0, 0, 0.3)` : 
                            `0 0 15px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 4px 15px rgba(0, 0, 0, 0.5), inset 0 0 5px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 2px 5px rgba(255, 255, 255, 0.15), inset 0 -2px 5px rgba(0, 0, 0, 0.4)`,
                          transformStyle: 'preserve-3d',
                          perspective: '1000px',
                          transform: sliderRange[0] >= sliderRange[1] ? 'translateZ(0) scale(0.9)' : 'translateZ(0) scale(1)'
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
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: `1px solid ${sliderRange[1] <= sliderRange[0] ? 'rgba(102, 102, 102, 0.5)' : `rgba(${statisticType === 'red' ? '245, 34, 45' : '24, 144, 255'}, 0.7)`}`,
                          backgroundColor: sliderRange[1] <= sliderRange[0] ? '#222222' : '#1A1A1A',
                          backgroundImage: sliderRange[1] <= sliderRange[0] ? 'linear-gradient(145deg, #333333, #111111)' : 'linear-gradient(145deg, #252525, #101010)',
                          color: sliderRange[1] <= sliderRange[0] ? '#999999' : (statisticType === 'red' ? '#f5222d' : '#1890ff'),
                          cursor: sliderRange[1] <= sliderRange[0] ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          boxSizing: 'border-box',
                          padding: 0,
                          margin: 0,
                          opacity: sliderRange[1] <= sliderRange[0] ? 0.6 : 1,
                          transition: 'all 0.3s ease',
                          boxShadow: sliderRange[1] <= sliderRange[0] ? 
                            `0 0 6px rgba(102, 102, 102, 0.3), 0 2px 6px rgba(0, 0, 0, 0.3), inset 0 0 2px rgba(102, 102, 102, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.05), inset 0 -1px 3px rgba(0, 0, 0, 0.3)` : 
                            `0 0 15px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 4px 15px rgba(0, 0, 0, 0.5), inset 0 0 5px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 2px 5px rgba(255, 255, 255, 0.15), inset 0 -2px 5px rgba(0, 0, 0, 0.4)`,
                          transformStyle: 'preserve-3d',
                          perspective: '1000px',
                          transform: sliderRange[1] <= sliderRange[0] ? 'translateZ(0) scale(0.9)' : 'translateZ(0) scale(1)'
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
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: `1px solid ${sliderRange[1] >= allRecords.length - 1 ? 'rgba(102, 102, 102, 0.5)' : `rgba(${statisticType === 'red' ? '245, 34, 45' : '24, 144, 255'}, 0.7)`}`,
                          backgroundColor: sliderRange[1] >= allRecords.length - 1 ? '#222222' : '#1A1A1A',
                          backgroundImage: sliderRange[1] >= allRecords.length - 1 ? 'linear-gradient(145deg, #333333, #111111)' : 'linear-gradient(145deg, #252525, #101010)',
                          color: sliderRange[1] >= allRecords.length - 1 ? '#999999' : (statisticType === 'red' ? '#f5222d' : '#1890ff'),
                          cursor: sliderRange[1] >= allRecords.length - 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          boxSizing: 'border-box',
                          padding: 0,
                          margin: 0,
                          opacity: sliderRange[1] >= allRecords.length - 1 ? 0.6 : 1,
                          transition: 'all 0.3s ease',
                          boxShadow: sliderRange[1] >= allRecords.length - 1 ? 
                            `0 0 6px rgba(102, 102, 102, 0.3), 0 2px 6px rgba(0, 0, 0, 0.3), inset 0 0 2px rgba(102, 102, 102, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.05), inset 0 -1px 3px rgba(0, 0, 0, 0.3)` : 
                            `0 0 15px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 4px 15px rgba(0, 0, 0, 0.5), inset 0 0 5px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 2px 5px rgba(255, 255, 255, 0.15), inset 0 -2px 5px rgba(0, 0, 0, 0.4)`,
                          transformStyle: 'preserve-3d',
                          perspective: '1000px',
                          transform: sliderRange[1] >= allRecords.length - 1 ? 'translateZ(0) scale(0.9)' : 'translateZ(0) scale(1)'
                        }}
                    >
                      <StepForwardOutlined style={{ fontSize: '14px' }} />
                    </button>
                  </div>
                  
                  {/* 快进图标 */}
                  <div style={{ 
                    cursor: sliderRange[1] >= allRecords.length - 1 ? 'not-allowed' : 'pointer',
                    userSelect: 'none',
                    border: `1px solid ${sliderRange[1] >= allRecords.length - 1 ? 'rgba(102, 102, 102, 0.5)' : `rgba(${statisticType === 'red' ? '245, 34, 45' : '24, 144, 255'}, 0.7)`}`,
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transition: 'all 0.3s ease',
                    color: sliderRange[1] >= allRecords.length - 1 ? '#999999' : (statisticType === 'red' ? '#f5222d' : '#1890ff'),
                    borderColor: sliderRange[1] >= allRecords.length - 1 ? 'rgba(102, 102, 102, 0.5)' : `rgba(${statisticType === 'red' ? '245, 34, 45' : '24, 144, 255'}, 0.7)`,
                    padding: 0,
                    margin: 0,
                    opacity: sliderRange[1] >= allRecords.length - 1 ? 0.6 : 1,
                    backgroundColor: sliderRange[1] >= allRecords.length - 1 ? '#222222' : '#1A1A1A',
                    backgroundImage: sliderRange[1] >= allRecords.length - 1 ? 'linear-gradient(145deg, #333333, #111111)' : 'linear-gradient(145deg, #252525, #101010)',
                    boxShadow: sliderRange[1] >= allRecords.length - 1 ? 
                      `0 0 8px rgba(102, 102, 102, 0.3), 0 3px 8px rgba(0, 0, 0, 0.3), inset 0 0 3px rgba(102, 102, 102, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.05), inset 0 -2px 4px rgba(0, 0, 0, 0.3)` : 
                      `0 0 20px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 6px 20px rgba(0, 0, 0, 0.5), inset 0 0 8px ${statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 4px 8px rgba(255, 255, 255, 0.15), inset 0 -4px 8px rgba(0, 0, 0, 0.4)`,
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                    transform: sliderRange[1] >= allRecords.length - 1 ? 'translateZ(0) scale(0.95)' : 'translateZ(0) scale(1)'
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
                        backgroundColor: 'transparent',
                        borderColor: statisticType === 'red' ? '#f5222d' : '#1890ff'
                      },
                      {
                        backgroundColor: 'transparent',
                        borderColor: statisticType === 'red' ? '#f5222d' : '#1890ff'
                      }
                    ]}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
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
        boxSizing: 'border-box',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.3)'
      }}>
        {/* 图标 - 点击回到频率页面 */}
        <CloudFilled 
          style={{ fontSize: '24px', color: '#fff', cursor: 'pointer', marginRight: '20px' }} 
          onClick={() => setActiveTabKey(statisticType === 'red' ? '1' : '2')}
        />
        {/* 三个Tab名称（菜单）放在图标右侧，顺序：频率统计，分组统计，分布统计 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '12px'
        }}>
          {/* 频率统计 */}
          <div 
            className="footer-menu-item"
            style={{ 
              fontSize: '14px', 
              color: (statisticType === 'red' && activeTabKey === '1') || (statisticType === 'blue' && activeTabKey === '2') ? '#1890ff' : '#fff',
              cursor: 'pointer',
              fontWeight: (statisticType === 'red' && activeTabKey === '1') || (statisticType === 'blue' && activeTabKey === '2') ? 'bold' : 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              userSelect: 'none'
            }}
            onClick={() => setActiveTabKey(statisticType === 'red' ? '1' : '2')}
          >
            <ChromeOutlined style={{ color: (statisticType === 'red' && activeTabKey === '1') || (statisticType === 'blue' && activeTabKey === '2') ? '#1890ff' : '#fff', transition: 'color 0.3s ease' }} /> 频率
          </div>
          {/* 分组统计 */}
          <div 
            className="footer-menu-item"
            style={{ 
              fontSize: '14px', 
              color: (statisticType === 'red' && activeTabKey === '5') || (statisticType === 'blue' && activeTabKey === '6') ? '#1890ff' : '#fff',
              cursor: 'pointer',
              fontWeight: (statisticType === 'red' && activeTabKey === '5') || (statisticType === 'blue' && activeTabKey === '6') ? 'bold' : 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              userSelect: 'none'
            }}
            onClick={() => setActiveTabKey(statisticType === 'red' ? '5' : '6')}
          >
            <DockerOutlined style={{ color: (statisticType === 'red' && activeTabKey === '5') || (statisticType === 'blue' && activeTabKey === '6') ? '#1890ff' : '#fff', transition: 'color 0.3s ease' }} /> 分组
          </div>
          {/* 分布统计 */}
          <div 
            className="footer-menu-item"
            style={{ 
              fontSize: '14px', 
              color: (statisticType === 'red' && activeTabKey === '3') || (statisticType === 'blue' && activeTabKey === '4') ? '#1890ff' : '#fff',
              cursor: 'pointer',
              fontWeight: (statisticType === 'red' && activeTabKey === '3') || (statisticType === 'blue' && activeTabKey === '4') ? 'bold' : 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              userSelect: 'none'
            }}
            onClick={() => setActiveTabKey(statisticType === 'red' ? '3' : '4')}
          >
            <RubyOutlined style={{ color: (statisticType === 'red' && activeTabKey === '3') || (statisticType === 'blue' && activeTabKey === '4') ? '#1890ff' : '#fff', transition: 'color 0.3s ease' }} /> 分布
          </div>
        </div>
      </footer>
    </>
  );
};

export default Statistics;
