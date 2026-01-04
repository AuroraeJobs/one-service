import React, { useState, useEffect, useRef } from 'react';
import { Tabs, Slider, message, Pagination } from 'antd';
import {
  FastBackwardOutlined,
  FastForwardOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  WomanOutlined,
  ManOutlined,
  SettingOutlined,
  AppstoreOutlined,
  ClearOutlined,
  AppstoreAddOutlined,
  CloudFilled,
  HarmonyOSOutlined,
  OpenAIOutlined,
  LinuxOutlined,
  DribbbleOutlined,
  HeartOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import { useRecordContext } from '../contexts/RecordContext';
// 导入 ECharts
import ReactECharts from 'echarts-for-react';
// 导入全局颜色和人物配置
import { GLOBAL_COMBINATION_COLORS, GLOBAL_CHARACTER_MAPS } from '../constants/colors';
// 导入六十四卦配置
import { HEXAGRAMS, YIN_YANG_LABELS } from '../constants/hexagrams';

// 图表数据接口
interface ChartDataItem {
  period: number;
  number: string;
  count: number;
}

// 全局奇偶组合颜色映射
const globalCombinationColors = GLOBAL_COMBINATION_COLORS;

const Analysis: React.FC<{ isTabVisible: boolean }> = ({ isTabVisible }) => {
  // 状态管理
  // 滑块相关状态
  const [allRecords, setAllRecords] = useState<string[]>([]);
  const [sliderRange, setSliderRange] = useState<[number, number]>([0, 0]);
  // 统计类型切换状态
  const [statisticType, setStatisticType] = useState<'red' | 'blue'>('red');
  // 使用ref防止useEffect在StrictMode下运行两次
  const hasFetchedRef = useRef(false);
  // 从Context获取数据
  const { allRecords: contextAllRecords } = useRecordContext();
  
  // 切换按钮拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  // 滑块隐藏图标拖拽状态
  const [isHiddenIconDragging, setIsHiddenIconDragging] = useState(false);
  // 滑块隐藏图标初始位置，放在切换按钮上方，避免被页脚遮挡
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
  
  
  // 跟踪选中号码 - 支持多选
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  // 控制号码选择器的显示/隐藏
  const [showNumberSelector, setShowNumberSelector] = useState(false);
  // 悬浮元素拖动状态管理
  const [isSelectorDragging, setIsSelectorDragging] = useState(false);
  const [isButtonDragging, setIsButtonDragging] = useState(false);
  // 初始位置不要贴在右侧，居中偏左位置，位置最大化上移
  const [selectorPosition, setSelectorPosition] = useState({ x: 200, y: 0 }); // y值设为0，选择器顶部紧贴视口顶部
  // 初始位置在滑块按钮上方
  const [floatingButtonPosition, setFloatingButtonPosition] = useState({
    x: window.innerWidth - 90, // 右侧20px，圆心在window.innerWidth - 65px
    y: window.innerHeight - 260 // 滑块隐藏图标上方60px
  });
  const [selectorDragOffset, setSelectorDragOffset] = useState({ x: 0, y: 0 });
  const [buttonDragOffset, setButtonDragOffset] = useState({ x: 0, y: 0 });
  // Tab容器拖动状态管理
  const [isTabContainerDragging, setIsTabContainerDragging] = useState(false);
  const [tabContainerPosition, setTabContainerPosition] = useState({
    x: window.innerWidth / 2 - 200, // 初始居中，宽度约400px
    y: window.innerHeight - 140 // 底部上方140px，再上移20px
  });
  const [tabContainerDragOffset, setTabContainerDragOffset] = useState({ x: 0, y: 0 });

  // 图表数据状态 - 存储选中号码每期的累计次数
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  // 宁荣两府数据 - 存储每期的奇偶号码个数
  const [oddEvenData, setOddEvenData] = useState<Array<{ period: number; oddCount: number; evenCount: number }>>([]);
  // 奇偶组合统计数据 - 存储每种奇偶组合出现的次数
  const [oddEvenCombinationData, setOddEvenCombinationData] = useState<Array<{ combination: string; count: number }>>([]);
  // 每期奇偶组合累计次数数据 - 存储每期每个组合的累计出现次数
  const [oddEvenCombinationAccumulatedData, setOddEvenCombinationAccumulatedData] = useState<Array<{ period: number; combinations: { [key: string]: number } }>>([]);

  // 能量分析数据 - 存储每期的号码总和
  const [sumData, setSumData] = useState<Array<{ period: number; sum: number }>>([]);
  // 总和结果统计数据 - 存储每个总和结果出现的次数
  const [sumCountData, setSumCountData] = useState<Array<{ sum: number; count: number }>>([]);
  // 总和组合数量数据 - 存储每个总和值对应的组合数量
  const [sumCombinationCountData, setSumCombinationCountData] = useState<Array<{ sum: number; combinationCount: number }>>([]);
  // 当前显示的组合类型
  const [currentCombination, setCurrentCombination] = useState<string>('3奇3偶');
  
  // 位置分析数据 - 存储每个位置上每个号码出现的次数
  // 红球有6个位置，蓝球有1个位置
  interface PositionAnalysisItem {
    position: number;
    numberCounts: Record<string, number>;
  }
  const [positionAnalysisData, setPositionAnalysisData] = useState<PositionAnalysisItem[]>([]);
  
  // 每个号码累计出现次数数据
  const [numberAccumulatedCountData, setNumberAccumulatedCountData] = useState<Array<{ number: string; count: number }>>([]);
  
  // 当统计类型切换时，确保当前组合类型在可选范围内
  useEffect(() => {
    let allPossibleCombinations: string[];
    if (statisticType === 'red') {
      // 红球：7种组合（七大行星）
      allPossibleCombinations = ['地球', '水星', '金星', '火星', '木星', '土星', '天王星'];
    } else {
      // 蓝球：2种组合（太阳和月亮）
      allPossibleCombinations = ['太阳', '月亮'];
    }
    
    if (!allPossibleCombinations.includes(currentCombination)) {
      setCurrentCombination(allPossibleCombinations[0]);
    }
  }, [statisticType, currentCombination]);
  
  // 六边形点击相关状态
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  // 选中的总和值数组，用于过滤下方六边形，支持多选
  const [selectedSums, setSelectedSums] = useState<number[]>([]);
  // 能量分析模式：'northern'（北半球，21-102）或'southern'（南半球，102-183）
  const [sumMode, setSumMode] = useState<'northern' | 'southern'>('northern');
  // 南北半球切换按钮拖拽状态
  const [isSumButtonDragging, setIsSumButtonDragging] = useState(false);
  // 南北半球切换按钮初始位置，放在显示/隐藏号码选择器按钮（期号滑块按钮）的正上方
  const [sumButtonPosition, setSumButtonPosition] = useState({
    x: window.innerWidth - 105, // 右侧20px，竖直中心线在window.innerWidth - 65px
    y: window.innerHeight - 260 // 滑块隐藏图标上方60px
  });
  const [sumButtonDragOffset, setSumButtonDragOffset] = useState({ x: 0, y: 0 });
  
  // 点击空白区域关闭气泡
  useEffect(() => {
    const handleClickOutside = () => {
      setIsPopupVisible(false);
    };
    
    if (isPopupVisible) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isPopupVisible]);



  // 处理号码选择
  const handleNumberSelect = (number: string) => {
    // 计算新的选中号码列表
    const newSelectedNumbers = selectedNumbers.includes(number) 
      ? selectedNumbers.filter(n => n !== number) 
      : [...selectedNumbers, number];
    
    // 直接设置选中号码
    setSelectedNumbers(newSelectedNumbers);
  };

  // 清除所有选择
  const clearAllSelections = () => {
    setSelectedNumbers([]);
  };

  // 解析记录数据，统计奇偶个数和奇偶组合出现次数
  const parseRecords = (records: string[]) => {
    if (!records || records.length === 0) return;
    
    // 处理宁荣两府数据
    const parsedOddEvenData: Array<{ period: number; oddCount: number; evenCount: number }> = [];
    
    // 初始化所有可能的组合为0次
    const combinationCount: { [key: string]: number } = {};
    
    // 定义奇偶组合到新名称的映射
    const combinationToNameMap: { [key: string]: string } = {};
    
    // 初始化每个号码累计出现次数
    const numberCount: { [key: string]: number } = {};
    // 生成所有可能的号码列表并初始化为0
    const allNumbers = generateNumberList();
    allNumbers.forEach(number => {
      numberCount[number] = 0;
    });
    
    if (statisticType === 'red') {
      // 红球：7种组合（七大行星）
      combinationToNameMap['0奇6偶'] = '地球';
      combinationToNameMap['1奇5偶'] = '水星';
      combinationToNameMap['2奇4偶'] = '金星';
      combinationToNameMap['3奇3偶'] = '火星';
      combinationToNameMap['4奇2偶'] = '木星';
      combinationToNameMap['5奇1偶'] = '土星';
      combinationToNameMap['6奇0偶'] = '天王星';
      
      // 初始化所有可能的组合为0次
      combinationCount['水星'] = 0;
      combinationCount['金星'] = 0;
      combinationCount['地球'] = 0;
      combinationCount['火星'] = 0;
      combinationCount['木星'] = 0;
      combinationCount['土星'] = 0;
      combinationCount['天王星'] = 0;
    } else {
      // 蓝球：2种组合（太阳和月亮）
      combinationToNameMap['1奇0偶'] = '太阳';
      combinationToNameMap['0奇1偶'] = '月亮';
      
      // 初始化所有可能的组合为0次
      combinationCount['太阳'] = 0;
      combinationCount['月亮'] = 0;
    }
    
    // 初始化卦象统计
    const hexagramCount: { [key: string]: number } = {};
    // 初始化所有卦为0次
    Object.values(HEXAGRAMS).forEach(hexagram => {
      hexagramCount[hexagram.name] = 0;
    });
    
    // 初始化每期奇偶组合累计次数数据
    const parsedOddEvenCombinationAccumulatedData: Array<{ period: number; combinations: { [key: string]: number } }> = [];
    
    // 创建一个累计计数对象，用于跟踪到目前为止每个组合的累计次数
    const accumulatedCount: { [key: string]: number } = { ...combinationCount };
    
    records.forEach((record, index) => {
      if (typeof record === 'string') {
            let numbers: string[];
            
            // 记录格式是连续数字，前12位是红球（6个号码，每个2位），后2位是蓝球
            // 例如：'01020304050607' 表示红球01,02,03,04,05,06，蓝球07
            if (statisticType === 'red') {
              // 红球：前12位，每2位一个号码
              numbers = [];
              for (let i = 0; i < 12; i += 2) {
                numbers.push(record.substring(i, i + 2));
              }
            } else {
              // 蓝球：后2位
              numbers = [record.substring(12, 14)];
            }
        
        // 统计奇偶个数
        let oddCount = 0;
        let evenCount = 0;
        
        numbers.forEach(number => {
          const num = parseInt(number, 10);
          if (num % 2 === 0) {
            evenCount++;
          } else {
            oddCount++;
          }
          
          // 更新每个号码的累计出现次数
          if (numberCount[number] !== undefined) {
            numberCount[number]++;
          }
        });
        
        // 记录本期的奇偶个数
        parsedOddEvenData.push({
          period: index + 1,
          oddCount,
          evenCount
        });
        
        // 统计奇偶组合出现次数
        const originalCombination = `${oddCount}奇${evenCount}偶`;
        const combination = combinationToNameMap[originalCombination] || originalCombination;
        if (combinationCount[combination] !== undefined) {
          combinationCount[combination]++;
          // 更新累计计数
          accumulatedCount[combination]++;
        }
        
        // 统计卦象出现次数（仅红球模式）
        if (statisticType === 'red') {
          // 生成卦象编码
          const hexagramCode = numbers.map(num => {
            const n = parseInt(num, 10);
            return n % 2 === 1 ? '1' : '0';
          }).join('');
          
          // 获取卦象对象
          const hexagram = HEXAGRAMS[hexagramCode as keyof typeof HEXAGRAMS] || { name: '坤' };
          // 统计卦象出现次数
          if (hexagramCount[hexagram.name] !== undefined) {
            hexagramCount[hexagram.name]++;
          }
        }
        
        // 记录本期每个组合的累计次数
        parsedOddEvenCombinationAccumulatedData.push({
          period: index + 1,
          combinations: { ...accumulatedCount }
        });
      }
    });
    
    // 更新宁荣两府数据
    setOddEvenData(parsedOddEvenData);
    
    // 转换奇偶组合统计数据格式
    const combinationData = Object.entries(combinationCount).map(([combination, count]) => ({
      combination,
      count
    }));
    
    // 更新奇偶组合统计数据
    setOddEvenCombinationData(combinationData);
    
    // 更新每期奇偶组合累计次数数据
    setOddEvenCombinationAccumulatedData(parsedOddEvenCombinationAccumulatedData);
    
    // 转换每个号码累计出现次数数据格式
    const numberAccumulatedData = Object.entries(numberCount).map(([number, count]) => ({
      number,
      count
    }))
    .sort((a, b) => parseInt(a.number) - parseInt(b.number)); // 按号码从小到大排序
    
    // 更新每个号码累计出现次数数据
    setNumberAccumulatedCountData(numberAccumulatedData);
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

  // 窗口大小变化时更新Tab容器位置，确保居中显示
  useEffect(() => {
    const handleResize = () => {
      // 调整Tab容器位置，确保在页面缩放时保持居中
      setTabContainerPosition(prev => ({
        x: window.innerWidth / 2 - 150, // 初始居中，宽度约300px
        y: prev.y // 保持原来的y坐标
      }));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 渲染号码选择器 - 重新设计的美观样式，显示人物名称
  const renderNumberSelector = () => {
    const numbers = generateNumberList();
    const currentColor = statisticType === 'red' ? '#f5222d' : '#1890ff';
    
    // 根据统计类型设置不同的布局
    const isRed = statisticType === 'red';
    
    // 获取人物映射
    const characterMap = isRed ? GLOBAL_CHARACTER_MAPS.red : GLOBAL_CHARACTER_MAPS.blue;
    
    // 人物标签尺寸和间距 - 重新设计
    const itemHeight = '36px'; // 标签高度
    const gap = '8px'; // 合适的间距
    const containerPadding = '20px'; // 容器内边距
    
    // 容器尺寸 - 自适应设计
    const containerWidth = isRed ? '420px' : '360px';
    const containerHeight = isRed ? '400px' : '320px';
    
    // 计算每行显示的标签数量
    const itemsPerRow = isRed ? 3 : 3;
    
    // 将号码分配到不同行
    const rows: string[][] = [];
    for (let i = 0; i < numbers.length; i += itemsPerRow) {
      rows.push(numbers.slice(i, i + itemsPerRow));
    }

    return (
      <div style={{
        width: containerWidth,
        height: containerHeight,
        padding: containerPadding,
        backgroundColor: '#1a1a1a',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        overflow: 'auto',
        userSelect: 'none',
        touchAction: 'none',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        position: 'relative',
        transition: 'all 0.3s ease'
      }}>
        {/* 顶部操作按钮 */}
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid #444',
            width: '100%'
          }}>
          {/* 全选按钮 */}
          <button 
            onClick={() => {
              const allNumbers = generateNumberList();
              setSelectedNumbers(allNumbers);
            }}
            style={{
              padding: '10px 24px',
              backgroundColor: '#3a3a3a',
              border: `1px solid ${currentColor}`,
              borderRadius: '24px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: currentColor,
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
            title="全选号码"
          >
            <AppstoreAddOutlined style={{ marginRight: '6px', fontSize: '16px' }} /> 全选
          </button>
          
          {/* 清除按钮 */}
          <button 
            onClick={clearAllSelections}
            style={{
              padding: '10px 24px',
              backgroundColor: '#3a3a3a',
              border: `1px solid ${currentColor}`,
              borderRadius: '24px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: currentColor,
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
            title="清除所有选择"
          >
            <ClearOutlined style={{ marginRight: '6px', fontSize: '16px' }} /> 清除
          </button>
        </div>
        
        {/* 人物标签网格 - 重新设计 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: gap,
          justifyContent: 'flex-start',
          alignItems: 'center',
          flex: 1
        }}>
          {rows.map((row, rowIndex) => (
            <div 
              key={rowIndex} 
              style={{
                display: 'flex',
                gap: gap,
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%'
              }}
            >
              {row.map(number => (
                <div
                  key={number}
                  onClick={() => handleNumberSelect(number)}
                  style={{
                    flex: 1,
                    maxWidth: '120px',
                    height: itemHeight,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: '18px', // 采用圆角矩形设计
                    cursor: 'pointer',
                    backgroundColor: selectedNumbers.includes(number) ? currentColor : '#3a3a3a',
                    color: selectedNumbers.includes(number) ? '#fff' : currentColor,
                    border: selectedNumbers.includes(number) 
                      ? `2px solid ${currentColor}` 
                      : `1px solid ${isRed ? '#4a2a2a' : '#2a2a4a'}`,
                    fontWeight: selectedNumbers.includes(number) ? 'bold' : 'normal',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    flexShrink: 0,
                    fontSize: '14px',
                    textAlign: 'center',
                    padding: '0 12px',
                    boxShadow: selectedNumbers.includes(number) 
                      ? `0 4px 12px rgba(${isRed ? '245, 34, 45' : '24, 144, 255'}, 0.3)` 
                      : '0 1px 3px rgba(0, 0, 0, 0.3)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={characterMap[number] || number}
                >
                  {characterMap[number] || number}
                </div>
              ))}
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
          backgroundColor: 'transparent',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' 
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
    
    // 获取人物映射
    const characterMap = statisticType === 'red' ? GLOBAL_CHARACTER_MAPS.red : GLOBAL_CHARACTER_MAPS.blue;
    
    // 颜色配置 - 恢复彩色
    const colors = [
      '#f5222d', '#1890ff', '#52c41a', '#faad14', '#722ed1',
      '#eb2f96', '#fa8c16', '#a0d911', '#13c2c2', '#2f54eb',
      '#f5222d', '#1890ff', '#52c41a', '#faad14', '#722ed1',
      '#eb2f96', '#fa8c16', '#a0d911', '#13c2c2', '#2f54eb'
    ];
    
    // 将号码转换为人物名称
    const getCharacterName = (number: string) => {
      return characterMap[number] || number;
    };
    
    // 构建ECharts系列数据
    const series = numbers.map((number) => {
      // 为每个号码构建数据数组，按期数顺序排列
      const data = periods.map(period => {
        const item = chartData.find(item => item.period === period && item.number === number);
        return item ? item.count : 0;
      });
      
      return {
        name: getCharacterName(number),
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
      backgroundColor: 'transparent',
      textStyle: {
        color: '#fff'
      },
      animation: false, // 关闭初始动画
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params: Array<{ axisValue: number; marker: string; seriesName: string; value: number }>) {
          let result = `${params[0].axisValue}期<br/>`;
          params.forEach((param) => {
            result += `${param.marker}${param.seriesName}: ${param.value}次<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: numbers.map(getCharacterName),
        top: 0,
        textStyle: {
          fontSize: 12
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%', // 增加底部空间，为缩略轴留出位置
        top: '8%',
        containLabel: true
      },
      // 添加缩略轴
      dataZoom: [
        {
          type: 'inside', // 内置的缩略轴，可通过鼠标滚轮或双击缩放
          start: 0,
          end: 100,
          xAxisIndex: 0
        },
        {
          type: 'slider', // 底部的滑块式缩略轴
          start: 0,
          end: 100,
          show: true,
          xAxisIndex: 0,
          bottom: '3%', // 放置在底部
          height: 20, // 高度
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          fillerColor: statisticType === 'red' ? 'rgba(245, 34, 45, 0.2)' : 'rgba(24, 144, 255, 0.2)',
          handleStyle: {
            color: statisticType === 'red' ? '#f5222d' : '#1890ff'
          },
          textStyle: {
            color: '#666'
          },
          startLabel: {
            show: true,
            formatter: function(params: { value: number }) {
              return params.value + '期';
            }
          },
          endLabel: {
            show: true,
            formatter: function(params: { value: number }) {
              return params.value + '期';
            }
          }
        }
      ],
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
              color: '#666'
            }
          },
          splitLine: {
            show: false
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
              color: '#666'
            }
          },
          splitLine: {
            show: false
          }
        }
      ],
      series: series
    };

    return (
      <div 
        style={{ 
          backgroundColor: 'transparent',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
          padding: '16px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* 图表容器 */}
        <div 
          style={{ 
            height: '500px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
          <ReactECharts option={option} style={{ height: '100%', width: '100%', backgroundColor: 'transparent' }} />
        </div>
      </div>
    );
  };

  // 渲染卦象出现次数占比饼状图


  // 渲染宁荣两府平滑曲线
  const renderOddEvenChart = () => {
    // 检查数据是否为空或不属于当前模式
    if (oddEvenCombinationAccumulatedData.length === 0) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#999',
          backgroundColor: 'transparent',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' 
        }}>
          暂无宁荣两府数据
        </div>
      );
    }
    
    // 检查第一个数据项的组合是否符合当前模式，避免闪现旧模式数据
    const firstItemCombinations = Object.keys(oddEvenCombinationAccumulatedData[0].combinations);
    const isBlueModeData = firstItemCombinations.every(comb => comb === '太阳' || comb === '月亮');
    const isRedModeData = firstItemCombinations.some(comb => ['水星', '金星', '地球', '火星', '木星', '土星', '天王星'].includes(comb));
    
    // 如果当前是蓝球模式，但数据是红球模式，显示空状态
    if (statisticType === 'blue' && isRedModeData) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#999',
          backgroundColor: 'transparent',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' 
        }}>
          暂无宁荣两府数据
        </div>
      );
    }
    
    // 如果当前是红球模式，但数据是蓝球模式，显示空状态
    if (statisticType === 'red' && isBlueModeData) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#999',
          backgroundColor: 'transparent',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' 
        }}>
          暂无宁荣两府数据
        </div>
      );
    }

    // 定义与饼状图一致的颜色映射
    const nameToColorMap: { [key: string]: string } = {};
    
    if (statisticType === 'red') {
      // 红球：7种组合（七大行星）
      // 红球颜色：红橙黄绿青蓝紫
      nameToColorMap['地球'] = '#1890ff'; // 蓝
      nameToColorMap['水星'] = '#52c41a'; // 绿
      nameToColorMap['金星'] = '#faad14'; // 黄
      nameToColorMap['火星'] = '#f5222d'; // 红
      nameToColorMap['木星'] = '#13c2c2'; // 青
      nameToColorMap['土星'] = '#fa8c16'; // 橙
      nameToColorMap['天王星'] = '#722ed1'; // 紫
    } else {
      // 蓝球：2种组合（太阳和月亮）
      // 蓝球颜色：红色和紫色
      nameToColorMap['太阳'] = '#f5222d'; // 红色
      nameToColorMap['月亮'] = '#722ed1'; // 紫色
    }

    // 处理图表数据，转换为ECharts所需格式
    const periods = oddEvenCombinationAccumulatedData.map(item => item.period);
    
    // 获取所有唯一的组合名称，并根据当前统计类型过滤和排序
    const allCombinations = oddEvenCombinationAccumulatedData.length > 0 
      ? (() => {
          const combinations = Object.keys(oddEvenCombinationAccumulatedData[0].combinations);
          if (statisticType === 'blue') {
            // 蓝球模式只显示太阳和月亮
            return combinations.filter(comb => comb === '太阳' || comb === '月亮');
          }
          // 红球模式：按照指定顺序显示七大行星
          const desiredOrder = ['地球', '水星', '金星', '火星', '木星', '土星', '天王星'];
          return desiredOrder.filter(comb => combinations.includes(comb));
        })()
      : [];
    
    // 准备系列数据
    const series = allCombinations.map((combination) => {
      // 为每个组合生成数据数组
      const data = oddEvenCombinationAccumulatedData.map(item => item.combinations[combination]);
      
      // 获取当前组合对应的颜色，与饼状图保持一致
      const color = nameToColorMap[combination as keyof typeof nameToColorMap] || '#999';
      
      // 将颜色转换为rgba格式用于阴影
      const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };
      
      return {
        name: combination,
        type: 'line',
        smooth: true,
        data: data,
        itemStyle: {
          color: color
        },
        lineStyle: {
          width: 3,
          type: 'solid',
          color: color
        },
        symbol: 'circle',
        symbolSize: 6,
        emphasis: {
          focus: 'series',
          scale: true,
          symbolSize: 10,
          itemStyle: {
            shadowBlur: 10,
            shadowColor: hexToRgba(color, 0.5)
          }
        },
        label: {
          show: false
        }
      };
    });
    
    // ECharts配置项
    const option = {
      backgroundColor: 'transparent',
      textStyle: {
        color: '#fff'
      },
      animation: false, // 关闭初始动画
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        formatter: function(params: Array<{ axisValue: number; marker: string; seriesName: string; value: number }>) {
          let result = `${params[0].axisValue}期<br/>`;
          params.forEach((param) => {
            result += `${param.marker}${param.seriesName}: ${param.value}次<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: allCombinations,
        top: 0,
        textStyle: {
          fontSize: 12
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%', // 增加底部空间，为缩略轴留出位置
        top: '8%',
        containLabel: true
      },
      // 添加缩略轴
      dataZoom: [
        {
          type: 'inside', // 内置的缩略轴，可通过鼠标滚轮或双击缩放
          start: 0,
          end: 100,
          xAxisIndex: 0
        },
        {
          type: 'slider', // 底部的滑块式缩略轴
          start: 0,
          end: 100,
          show: true,
          xAxisIndex: 0,
          bottom: '3%', // 放置在底部
          height: 20, // 高度
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          fillerColor: statisticType === 'red' ? 'rgba(245, 34, 45, 0.2)' : 'rgba(24, 144, 255, 0.2)',
          handleStyle: {
            color: statisticType === 'red' ? '#f5222d' : '#1890ff'
          },
          textStyle: {
            color: '#666'
          },
          startLabel: {
            show: true,
            formatter: function(params: { value: number }) {
              return params.value + '期';
            }
          },
          endLabel: {
            show: true,
            formatter: function(params: { value: number }) {
              return params.value + '期';
            }
          }
        }
      ],
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          data: periods,
          axisLabel: {
            fontSize: 12,
            rotate: 45
          },
          axisLine: {
            lineStyle: {
              color: '#666'
            }
          },
          splitLine: {
            show: false
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
              color: '#666'
            }
          },
          splitLine: {
            show: false
          }
        }
      ],
      series: series
    };

    return (
      <div 
        style={{ 
          backgroundColor: 'transparent',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
          padding: '16px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* 图表容器 */}
        <div 
          style={{ 
            height: '500px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
          <ReactECharts option={option} style={{ height: '100%', width: '100%', backgroundColor: 'transparent' }} />
        </div>
      </div>
    );
  };

  // 渲染能量分析平滑曲线
  const renderSumChart = () => {
    if (sumData.length === 0) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#999',
          backgroundColor: 'transparent',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' 
        }}>
          暂无能量分析数据
        </div>
      );
    }

    // 根据模式过滤数据
    const filteredSumData = sumData.filter(item => {
      // 蓝球模式下不进行范围过滤，因为蓝球数值范围是1-16
      if (statisticType === 'blue') {
        return true;
      }
      
      // 红球模式下按正常范围过滤
      if (sumMode === 'northern') {
        return item.sum >= 21 && item.sum <= 102;
      } else {
        return item.sum >= 102 && item.sum <= 183;
      }
    });
    
    // 处理图表数据，转换为ECharts所需格式
    const periods = filteredSumData.map(item => item.period);
    const sums = filteredSumData.map(item => item.sum);
    
    // ECharts配置项
    const option = {
      backgroundColor: 'transparent',
      textStyle: {
        color: '#fff'
      },
      animation: false, // 关闭初始动画
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        formatter: function(params: Array<{ axisValue: number; marker: string; seriesName: string; value: number }>) {
          let result = `${params[0].axisValue}期<br/>`;
          params.forEach((param) => {
            result += `${param.marker}${param.seriesName}: ${param.value}<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: ['能量总和'],
        top: 0,
        textStyle: {
          fontSize: 12
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%', // 增加底部空间，为缩略轴留出位置
        top: '8%',
        containLabel: true
      },
      // 添加缩略轴
      dataZoom: [
        {
          type: 'inside', // 内置的缩略轴，可通过鼠标滚轮或双击缩放
          start: 0,
          end: 100,
          xAxisIndex: 0
        },
        {
          type: 'slider', // 底部的滑块式缩略轴
          start: 0,
          end: 100,
          show: true,
          xAxisIndex: 0,
          bottom: '3%', // 放置在底部
          height: 20, // 高度
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          fillerColor: statisticType === 'red' ? 'rgba(245, 34, 45, 0.2)' : 'rgba(24, 144, 255, 0.2)',
          handleStyle: {
            color: statisticType === 'red' ? '#f5222d' : '#1890ff'
          },
          textStyle: {
            color: '#666'
          },
          startLabel: {
            show: true,
            formatter: function(params: { value: number }) {
              return params.value + '期';
            }
          },
          endLabel: {
            show: true,
            formatter: function(params: { value: number }) {
              return params.value + '期';
            }
          }
        }
      ],
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          data: periods,
          axisLabel: {
            fontSize: 12,
            rotate: 45
          },
          axisLine: {
            lineStyle: {
              color: '#666'
            }
          },
          splitLine: {
            show: false
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
              color: '#666'
            }
          },
          splitLine: {
            show: false
          }
        }
      ],
      series: [
        {        
          name: '能量总和',
          type: 'line',
          smooth: true,
          data: sums,
          itemStyle: {
            color: '#52c41a'
          },
          lineStyle: {
            width: 3,
            type: 'solid',
            color: '#52c41a'
          },
          symbol: 'circle',
          symbolSize: 6,
          emphasis: {
            focus: 'series',
            scale: true,
            symbolSize: 10,
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(82, 196, 26, 0.5)'
            }
          },
          label: {
            show: false
          }
        }
      ]
    };

    return (
      <div 
        style={{ 
          backgroundColor: 'transparent',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
          padding: '16px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* 图表容器 */}
        <div 
          style={{ 
            height: '500px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
          <ReactECharts option={option} style={{ height: '100%', width: '100%', backgroundColor: 'transparent' }} />
        </div>
      </div>
    );
  };

  // 渲染合并的能量分析柱状图
  const renderCombinedSumBarChart = () => {
    if (sumCountData.length === 0 || sumCombinationCountData.length === 0) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#999',
          backgroundColor: 'transparent',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' 
        }}>
          暂无能量分析数据
        </div>
      );
    }

    // 根据模式过滤数据
    const filteredSumCountData = sumCountData.filter(item => {
      // 蓝球模式下不进行范围过滤，因为蓝球数值范围是1-16
      if (statisticType === 'blue') {
        return true;
      }
      
      // 红球模式下按正常范围过滤
      if (sumMode === 'northern') {
        return item.sum >= 21 && item.sum <= 102;
      } else {
        return item.sum >= 102 && item.sum <= 183;
      }
    });
    
    const filteredSumCombinationCountData = sumCombinationCountData.filter(item => {
      // 蓝球模式下不进行范围过滤，因为蓝球数值范围是1-16
      if (statisticType === 'blue') {
        return true;
      }
      
      // 红球模式下按正常范围过滤
      if (sumMode === 'northern') {
        return item.sum >= 21 && item.sum <= 102;
      } else {
        return item.sum >= 102 && item.sum <= 183;
      }
    });
    
    // 创建总和值到出现次数的映射
    const sumToCountMap: { [key: number]: number } = {};
    filteredSumCountData.forEach(item => {
      sumToCountMap[item.sum] = item.count;
    });
    
    // 创建总和值到组合数量的映射
    const sumToCombinationCountMap: { [key: number]: number } = {};
    filteredSumCombinationCountData.forEach(item => {
      sumToCombinationCountMap[item.sum] = item.combinationCount;
    });
    
    // 获取所有唯一的总和值，用于x轴数据
    const allSums = Array.from(new Set([...filteredSumCountData.map(item => item.sum), ...filteredSumCombinationCountData.map(item => item.sum)]));
    allSums.sort((a, b) => a - b);
    
    // ECharts配置项
    const option = {
      backgroundColor: 'transparent',
      textStyle: {
        color: '#fff'
      },
      animation: false, // 关闭初始动画
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params: Array<{ axisValue: number; marker: string; seriesName: string; value: number }>) {
          let result = `${params[0].axisValue}<br/>`;
          params.forEach((param) => {
            const unit = param.seriesName === '出现次数' ? '次' : '种';
            result += `${param.marker}${param.seriesName}: ${param.value}${unit}<br/>`;
          });
          return result;
        }
      },
      legend: {
        show: true,
        data: ['出现次数', '组合数量'],
        top: '5%',
        left: 'center'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%', // 增加底部空间，为缩略轴留出位置
        top: '15%',
        containLabel: true
      },
      // 添加缩略轴
      dataZoom: [
        {
          type: 'inside', // 内置的缩略轴，可通过鼠标滚轮或双击缩放
          start: 0,
          end: 100,
          xAxisIndex: 0
        },
        {
          type: 'slider', // 底部的滑块式缩略轴
          start: 0,
          end: 100,
          show: true,
          xAxisIndex: 0,
          bottom: '3%', // 放置在底部
          height: 20, // 高度
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          fillerColor: statisticType === 'red' ? 'rgba(245, 34, 45, 0.2)' : 'rgba(24, 144, 255, 0.2)',
          handleStyle: {
            color: statisticType === 'red' ? '#f5222d' : '#1890ff'
          },
          textStyle: {
            color: '#666'
          },
          startLabel: {
            show: true,
            formatter: function(params: { value: number }) {
              return params.value;
            }
          },
          endLabel: {
            show: true,
            formatter: function(params: { value: number }) {
              return params.value;
            }
          }
        }
      ],
      xAxis: [
        {
          type: 'category',
          data: allSums,
          axisLabel: {
            fontSize: 12,
            rotate: 45
          },
          axisLine: {
            lineStyle: {
              color: '#666'
            }
          },
          splitLine: {
            show: false
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
              color: '#666'
            }
          },
          splitLine: {
            show: false
          }
        },
        {
          type: 'value',
          axisLabel: {
            fontSize: 12
          },
          axisLine: {
            lineStyle: {
              color: '#666'
            }
          },
          splitLine: {
            show: false
          }
        }
      ],
      series: [
        {
          name: '出现次数',
          type: 'bar',
          data: allSums.map(sum => ({
            value: sumToCountMap[sum] || 0,
            sum: sum,
            combinationCount: sumToCombinationCountMap[sum] || 0
          })),
          itemStyle: {
            color: '#f5222d' // 红色表示出现次数
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(245, 34, 45, 0.5)'
            }
          },
          label: {
            show: false
          }
        },
        {
          name: '组合数量',
          type: 'bar',
          yAxisIndex: 1,
          data: allSums.map(sum => ({
            value: sumToCombinationCountMap[sum] || 0,
            sum: sum
          })),
          itemStyle: {
            color: '#1890ff' // 蓝色表示组合数量
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(24, 144, 255, 0.5)'
            }
          },
          label: {
            show: false
          }
        }
      ]
    };

    return (
      <div 
        style={{ 
          backgroundColor: 'transparent',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
          padding: '16px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          marginTop: '20px'
        }}
      >
        {/* 图表容器 */}
        <div 
          style={{ 
            height: '500px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
          <ReactECharts option={option} style={{ height: '100%', width: '100%', backgroundColor: 'transparent' }} />
        </div>
      </div>
    );
  };

  // 预测功能状态管理
  const [predictionRedNumbers, setPredictionRedNumbers] = useState<string[]>([]);
  const [predictionBlueNumber, setPredictionBlueNumber] = useState<string>('');
  const [isShaking, setIsShaking] = useState(false);

  // 生成随机号码的函数
  const generateRandomNumbers = () => {
    // 生成红球：33选6，不重复
    const redPool = Array.from({ length: 33 }, (_, i) => {
      const num = i + 1;
      return num < 10 ? `0${num}` : `${num}`;
    });
    
    const redNumbers: string[] = [];
    const shuffledRed = [...redPool].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 6; i++) {
      redNumbers.push(shuffledRed[i]);
    }
    // 排序
    redNumbers.sort((a, b) => parseInt(a) - parseInt(b));
    
    // 生成蓝球：16选1
    const bluePool = Array.from({ length: 16 }, (_, i) => {
      const num = i + 1;
      return num < 10 ? `0${num}` : `${num}`;
    });
    const blueNumber = bluePool[Math.floor(Math.random() * bluePool.length)];
    
    return { redNumbers, blueNumber };
  };

  // 摇奖功能
  const handleShake = () => {
    setIsShaking(true);
    
    // 模拟摇奖过程，显示随机变化的号码
    const shakeInterval = setInterval(() => {
      const { redNumbers, blueNumber } = generateRandomNumbers();
      setPredictionRedNumbers(redNumbers);
      setPredictionBlueNumber(blueNumber);
    }, 100);
    
    // 3秒后停止摇奖
    setTimeout(() => {
      clearInterval(shakeInterval);
      const { redNumbers, blueNumber } = generateRandomNumbers();
      setPredictionRedNumbers(redNumbers);
      setPredictionBlueNumber(blueNumber);
      setIsShaking(false);
    }, 3000);
  };

  // 渲染预测tab内容
  const renderPredictionStats = () => {
    return (
      <div style={{ 
        padding: '48px 16px 16px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        textAlign: 'center'
      }}>
        <div style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#f5222d',
          marginBottom: '30px'
        }}>

        </div>
        
        {/* 摇奖结果显示区域 - 固定在底部悬浮，开始按钮上方 */}
        <div style={{
          position: 'fixed',
          bottom: '160px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'nowrap',
          zIndex: 1000
        }}>
          {/* 红球显示 */}
          {predictionRedNumbers.map((num, index) => (
            <div 
              key={`red-${index}`}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #ff6b6b 0%, #f5222d 70%, #c9184a 100%)',
                color: '#000',
                fontSize: '24px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 6px 16px rgba(245, 34, 45, 0.4), 0 2px 8px rgba(245, 34, 45, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(193, 53, 53, 0.5)',
                animation: isShaking ? 'shake 0.5s infinite' : 'none',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              {num}
            </div>
          ))}
          
          {/* 蓝球显示 - 保持较大尺寸，与红球形成对比 */}
          <div 
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #4da6ff 0%, #1890ff 70%, #0050b3 100%)',
              color: '#000',
              fontSize: '32px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 6px 20px rgba(24, 144, 255, 0.4), 0 2px 10px rgba(24, 144, 255, 0.2), inset 0 2px 6px rgba(255, 255, 255, 0.3), inset 0 -2px 6px rgba(0, 72, 186, 0.5)',
              animation: isShaking ? 'shake 0.5s infinite' : 'none',
              transition: 'all 0.3s ease',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {predictionBlueNumber}
          </div>
        </div>
        
        {/* 摇奖按钮 - 固定在底部悬浮，避免被页脚遮挡 */}
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000
        }}>
          <button
            onClick={handleShake}
            disabled={isShaking}
            style={{
              padding: '16px 48px',
              fontSize: '18px',
              fontWeight: 'bold',
              backgroundColor: isShaking ? '#d9d9d9' : '#52c41a',
              color: '#000',
              border: 'none',
              borderRadius: '32px',
              cursor: isShaking ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: isShaking ? 'none' : '0 4px 16px rgba(82, 196, 26, 0.3)',
              animation: isShaking ? 'pulse 1s infinite' : 'none'
            }}
          >
            {isShaking ? '预测中' : '开始'}
          </button>
        </div>
        

        
        {/* 摇奖动画样式 */}
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0) rotate(0deg); }
            25% { transform: translateX(-10px) rotate(-5deg); }
            50% { transform: translateX(10px) rotate(5deg); }
            75% { transform: translateX(-10px) rotate(-5deg); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}</style>
      </div>
    );
  };

  // 渲染太虚幻境tab内容
  const renderTaiXuHuanJingStats = () => {
    // 使用全局人物映射
    const blueBallCharacterMap = GLOBAL_CHARACTER_MAPS.blue;
    const redBallCharacterMap = GLOBAL_CHARACTER_MAPS.red;

    // 计算记录的奇偶组合类型
    const getRecordCombination = (record: { redNumbers: string[]; blueNumber: string }) => {
      let numbers: string[];
      if (statisticType === 'red') {
        numbers = record.redNumbers;
      } else {
        numbers = [record.blueNumber];
      }
      
      let oddCount = 0;
      let evenCount = 0;
      
      numbers.forEach(number => {
        const num = parseInt(number, 10);
        if (num % 2 === 0) {
          evenCount++;
        } else {
          oddCount++;
        }
      });
      
      const originalCombination = `${oddCount}奇${evenCount}偶`;
      const combinationToNameMap: { [key: string]: string } = {};
      
      if (statisticType === 'red') {
        combinationToNameMap['0奇6偶'] = '地球';
        combinationToNameMap['1奇5偶'] = '水星';
        combinationToNameMap['2奇4偶'] = '金星';
        combinationToNameMap['3奇3偶'] = '火星';
        combinationToNameMap['4奇2偶'] = '木星';
        combinationToNameMap['5奇1偶'] = '土星';
        combinationToNameMap['6奇0偶'] = '天王星';
      } else {
        combinationToNameMap['1奇0偶'] = '太阳';
        combinationToNameMap['0奇1偶'] = '月亮';
      }
      
      return combinationToNameMap[originalCombination] || originalCombination;
    };

    // 计算红球对应的卦名
    const calculateHexagram = (redNumbers: string[]) => {
      // 将每个红球号码转换为爻（1为阳，0为阴）
      // 红球号码顺序：第一位对应第一爻（最下面），第六位对应第六爻（最上面）
      const trigrams = redNumbers.map(num => {
        const n = parseInt(num, 10);
        return n % 2 === 1 ? '1' : '0';
      });
      // 组合6个爻为卦象编码
      const hexagramCode = trigrams.join('');
      // 返回对应的卦名
      return HEXAGRAMS[hexagramCode as keyof typeof HEXAGRAMS]?.name || '坤';
    };

    // 计算蓝球的阴阳属性
    const calculateBlueBallYinYang = (blueNumber: string) => {
      const n = parseInt(blueNumber, 10);
      return n % 2 === 1 ? YIN_YANG_LABELS.YANG : YIN_YANG_LABELS.YIN;
    };

    // 处理所有记录，生成每一期的数据
    const processRecords = (records: string[] = allRecords) => {
      return records.map((record) => {
        if (typeof record !== 'string') return null;

        // 前12位是红球（6个号码，每个2位），后2位是蓝球
        const redNumbers = [];
        for (let i = 0; i < 12; i += 2) {
          redNumbers.push(record.substring(i, i + 2));
        }
        const blueNumber = record.substring(12, 14);
        
        // 计算号码总和，根据统计类型决定计算方式
        const calculateSum = (numbers: string[]) => {
          return numbers.reduce((sum, num) => sum + parseInt(num), 0);
        };
        
        let totalSum: number;
        if (statisticType === 'red') {
          // 红球模式：只计算6个红球的总和，不包括蓝球
          totalSum = calculateSum(redNumbers);
        } else {
          // 蓝球模式：只计算蓝球的总和
          totalSum = parseInt(blueNumber);
        }

        // 计算红球对应的卦名
        const hexagram = calculateHexagram(redNumbers);
        
        // 计算蓝球的阴阳属性
        const blueYinYang = calculateBlueBallYinYang(blueNumber);

        return {
          period: allRecords.indexOf(record) + 1,
          redNumbers,
          blueNumber,
          totalSum,
          hexagram,
          blueYinYang
        };
      }).filter(Boolean) as Array<{ period: number; redNumbers: string[]; blueNumber: string; totalSum: number; hexagram: string; blueYinYang: string }>;
    };

    // 根据滑块范围获取选定的记录
    const [startRange, endRange] = sliderRange;
    const selectedRecords = allRecords.slice(startRange, endRange + 1);
    
    // 处理选定的记录并倒序排序
    const allProcessedRecords = processRecords(selectedRecords).reverse();
    
    // 计算当前页显示的记录
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const records = allProcessedRecords.slice(startIndex, endIndex);

    return (
      <div style={{
        padding: '48px 16px 16px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '40px',
          justifyContent: 'center',
          justifyItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {records.map((record) => {
            // 获取当前记录的奇偶组合类型
            const combination = getRecordCombination(record);
            
            // 获取对应的颜色，根据统计类型选择不同的颜色映射
            const centerColor = statisticType === 'red' 
              ? (globalCombinationColors.red)[combination as keyof typeof globalCombinationColors.red] || '#f5222d'
              : (globalCombinationColors.blue)[combination as keyof typeof globalCombinationColors.blue] || '#f5222d';
            
            return (
            <div key={record.period} style={{
              width: '250px',
              height: '250px',
              borderRadius: '50%',
              boxShadow: `0 12px 35px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(255, 255, 255, 0.1)`,
              boxSizing: 'border-box',
              position: 'relative',
              opacity: 0.95,
              overflow: 'hidden',
              background: `radial-gradient(circle at 50% 50%, ${centerColor} 0%, #f0f0f0 65%, #ffffff 100%)`,
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }} onMouseEnter={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'scale(1.05)';
              target.style.boxShadow = `0 15px 40px rgba(0, 0, 0, 0.6), inset 0 0 50px rgba(255, 255, 255, 0.15)`;
              target.style.opacity = '1';
            }} onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'scale(1) rotate(0deg)';
              target.style.boxShadow = `0 12px 35px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(255, 255, 255, 0.1)`;
              target.style.opacity = '0.95';
            }}>
              {/* 定义扩散动画 */}
              <style scoped>
                {`
                  @keyframes initialSpreadOut-0 {
                    0% {
                      transform: translate(-50%, -50%) translate(0, 0) scale(0.5);
                      opacity: 0;
                    }
                    100% {
                      transform: translate(-50%, -50%) translate(${Math.cos(0 * Math.PI / 6) * 75}px, ${Math.sin(0 * Math.PI / 6) * 75}px) scale(1);
                      opacity: 1;
                    }
                  }
                  @keyframes initialSpreadOut-1 {
                    0% {
                      transform: translate(-50%, -50%) translate(0, 0) scale(0.5);
                      opacity: 0;
                    }
                    100% {
                      transform: translate(-50%, -50%) translate(${Math.cos(1 * Math.PI / 6) * 75}px, ${Math.sin(1 * Math.PI / 6) * 75}px) scale(1);
                      opacity: 1;
                    }
                  }
                  @keyframes initialSpreadOut-2 {
                    0% {
                      transform: translate(-50%, -50%) translate(0, 0) scale(0.5);
                      opacity: 0;
                    }
                    100% {
                      transform: translate(-50%, -50%) translate(${Math.cos(2 * Math.PI / 6) * 75}px, ${Math.sin(2 * Math.PI / 6) * 75}px) scale(1);
                      opacity: 1;
                    }
                  }
                  @keyframes initialSpreadOut-3 {
                    0% {
                      transform: translate(-50%, -50%) translate(0, 0) scale(0.5);
                      opacity: 0;
                    }
                    100% {
                      transform: translate(-50%, -50%) translate(${Math.cos(3 * Math.PI / 6) * 75}px, ${Math.sin(3 * Math.PI / 6) * 75}px) scale(1);
                      opacity: 1;
                    }
                  }
                  @keyframes initialSpreadOut-4 {
                    0% {
                      transform: translate(-50%, -50%) translate(0, 0) scale(0.5);
                      opacity: 0;
                    }
                    100% {
                      transform: translate(-50%, -50%) translate(${Math.cos(4 * Math.PI / 6) * 75}px, ${Math.sin(4 * Math.PI / 6) * 75}px) scale(1);
                      opacity: 1;
                    }
                  }
                  @keyframes initialSpreadOut-5 {
                    0% {
                      transform: translate(-50%, -50%) translate(0, 0) scale(0.5);
                      opacity: 0;
                    }
                    100% {
                      transform: translate(-50%, -50%) translate(${Math.cos(5 * Math.PI / 6) * 75}px, ${Math.sin(5 * Math.PI / 6) * 75}px) scale(1);
                      opacity: 1;
                    }
                  }
                  @keyframes initialSpreadOut-blue {
                    0% {
                      transform: translate(-50%, -50%) scale(0.5);
                      opacity: 0;
                    }
                    100% {
                      transform: translateX(-50%) scale(1);
                      opacity: 1;
                    }
                  }
                `}
              </style>
              
              {/* 圆心文字显示 - 整体上移 */}
              <div style={{
                position: 'absolute',
                top: '45%',
                left: '50%',
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 2
              }}>
                {/* 号码总和显示在中心名称上方，只显示数字 */}
                <div style={{
                  color: '#000',
                  fontSize: '12px',
                  fontWeight: 'bold',

                  marginBottom: '4px'
                }}>
                  {record.totalSum}
                </div>
                {/* 显示奇偶组合名称（主要显示内容） */}
                <div style={{
                  color: '#000',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '4px'
                }}>
                  {combination}
                </div>
                {/* 卦象或阴阳（次要显示内容） */}
                <div style={{
                  color: '#000',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  flexDirection: 'row'
                }}>
                  {/* 红球显示卦名，蓝球显示阴阳 */}
                  {statisticType === 'red' ? (
                    <span>{record.hexagram}</span>
                  ) : (
                    <span>{record.blueYinYang}</span>
                  )}
                </div>
              </div>
              
              {/* 红球号码围绕在边缘 */}
              {statisticType === 'red' ? (
                record.redNumbers.map((number: string, index: number) => {
                  const num = parseInt(number, 10);
                  const isOdd = num % 2 === 1;
                  // 生成更强烈的球体径向渐变，增强光影效果
                  const backgroundColor = isOdd 
                    ? `radial-gradient(circle at 25% 25%, #ffffff 0%, #ffb3d9 20%, #ff69b4 50%, #ff3d99 100%)` 
                    : `radial-gradient(circle at 25% 25%, #ffffff 0%, #fff2b3 20%, #f0e68c 50%, #e6c249 100%)`;
                  
                  // 计算每个号码的位置，均匀分布在圆形边缘，离中心更近
                  const angle = (index / 6) * 2 * Math.PI;
                  const radius = 75; // 减小半径，适应较小的卡片尺寸
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  
                  return (
                    <div key={number} style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                      borderRadius: '50%',
                      width: '50px',
                      height: '50px',
                      padding: '0',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      background: backgroundColor,
                      color: '#333',
                      boxShadow: `0 10px 25px rgba(0, 0, 0, 0.25), inset 0 0 15px rgba(255, 255, 255, 0.4), inset 0 -10px 15px rgba(0, 0, 0, 0.1)`,
                      zIndex: 3,
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      animation: `initialSpreadOut-${index} 1s ease-out forwards`
                    }} onMouseEnter={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(1.2) rotate(-5deg)`;
                      target.style.boxShadow = `0 15px 35px rgba(0, 0, 0, 0.35), inset 0 0 20px rgba(255, 255, 255, 0.5), inset 0 -15px 20px rgba(0, 0, 0, 0.15)`;
                    }} onMouseLeave={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(1) rotate(0deg)`;
                      target.style.boxShadow = `0 10px 25px rgba(0, 0, 0, 0.25), inset 0 0 15px rgba(255, 255, 255, 0.4), inset 0 -10px 15px rgba(0, 0, 0, 0.1)`;
                    }}>
                      {redBallCharacterMap[number] || number}
                    </div>
                  );
                })
              ) : (
                // 蓝球模式，号码放在卡片底部
                <div style={{
                  position: 'absolute',
                  bottom: '10%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  borderRadius: '50%',
                  width: '60px',
                  height: '60px',
                  padding: '0',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  background: parseInt(record.blueNumber, 10) % 2 === 1 
                    ? `radial-gradient(circle at 25% 25%, #ffffff 0%, #ffb3d9 20%, #ff69b4 50%, #ff3d99 100%)` 
                    : `radial-gradient(circle at 25% 25%, #ffffff 0%, #fff2b3 20%, #f0e68c 50%, #e6c249 100%)`,
                  color: '#333',
                  boxShadow: `0 10px 25px rgba(0, 0, 0, 0.25), inset 0 0 15px rgba(255, 255, 255, 0.4), inset 0 -10px 15px rgba(0, 0, 0, 0.1)`,
                  zIndex: 3,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  animation: `initialSpreadOut-blue 1s ease-out forwards`
                }} onMouseEnter={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.transform = 'translateX(-50%) scale(1.2) rotate(-5deg)';
                  target.style.boxShadow = `0 15px 35px rgba(0, 0, 0, 0.35), inset 0 0 20px rgba(255, 255, 255, 0.5), inset 0 -15px 20px rgba(0, 0, 0, 0.15)`;
                }} onMouseLeave={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.transform = 'translateX(-50%) scale(1) rotate(0deg)';
                  target.style.boxShadow = `0 10px 25px rgba(0, 0, 0, 0.25), inset 0 0 15px rgba(255, 255, 255, 0.4), inset 0 -10px 15px rgba(0, 0, 0, 0.1)`;
                }}>
                  {blueBallCharacterMap[record.blueNumber] || record.blueNumber}
                </div>
              )}
              
              {/* 期号放在卡片顶部 */}
              <div style={{
                position: 'absolute',
                top: '10%',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#000',
                fontSize: '12px',
                fontWeight: 'bold',
                
                zIndex: 4
              }}>
                {record.period}
              </div>
            </div>
            );
          })}
        </div>
        
        {/* 分页组件 */}
        <div style={{
          marginTop: '24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={allProcessedRecords.length}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
            showSizeChanger
            pageSizeOptions={['8', '12', '24', '36']}
            showTotal={(total) => `共 ${total} 期`}
            style={{
              marginTop: '16px'
            }}
          />
        </div>
      </div>
    );
  };

  // 渲染红球总和值9*9宫格
  const renderRedSumGrid = () => {
    // 只针对红球
    if (statisticType !== 'red') {
      return null;
    }

    // 计算每个总和值对应的组合数，创建一个映射
    const sumCombinationMap: { [key: number]: number } = {};
    sumCombinationCountData.forEach(item => {
      sumCombinationMap[item.sum] = item.combinationCount;
    });

    // 根据模式定义总和值范围
    let displayRange: number[];
    if (sumMode === 'northern') {
      displayRange = Array.from({ length: 82 }, (_, i) => 21 + i); // 21-102 (82个值)
    } else {
      displayRange = Array.from({ length: 82 }, (_, i) => 102 + i); // 102-183 (82个值)
    }

    // 渲染单个六边形宫格项
    const renderGridItem = (sum: number) => {
      const combinationCount = sumCombinationMap[sum] || 0;
      const sumColor = getSumColor(sum, combinationCount);
      
      // 六边形大小和圆角
      const hexSize = 26; // 六边形半径，增大2px
      const cornerRadius = 3; // 圆角半径
      
      // 计算六边形路径
      const path = [];
      for (let i = 0; i < 6; i++) {
        const angle1 = (i * Math.PI) / 3 - Math.PI / 2;
        const angle2 = ((i + 1) * Math.PI) / 3 - Math.PI / 2;
        
        const x1 = (hexSize - cornerRadius) * Math.cos(angle1);
        const y1 = (hexSize - cornerRadius) * Math.sin(angle1);
        const x3 = (hexSize - cornerRadius) * Math.cos(angle2);
        const y3 = (hexSize - cornerRadius) * Math.sin(angle2);
        
        if (i === 0) {
          path.push(`M ${x1} ${y1}`);
        } else {
          path.push(`L ${x1} ${y1}`);
        }
        
        path.push(`A ${cornerRadius} ${cornerRadius} 0 0 1 ${x3} ${y3}`);
      }
      path.push('Z');

      const handleGridItemClick = () => {
        // 支持多选，添加或移除总和值
        setSelectedSums(prev => {
          if (prev.includes(sum)) {
            // 如果已选中，则移除
            return prev.filter(item => item !== sum);
          } else {
            // 如果未选中，则添加
            return [...prev, sum];
          }
        });
      };

      return (
        <div style={{
          position: 'relative',
          display: 'inline-block',
          margin: '5px' // 70px SVG + 10px margin(左右各5px) = 80px，9*80=720px，正好填满容器
        }}>
          <svg 
            key={sum}
            width="70px"
            height="70px"
            style={{
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              outline: 'none'
            }}

            onClick={handleGridItemClick}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <defs>
              {/* 定义径向渐变 */}
              <radialGradient id={`grid-gradient-${sum}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor={sumColor} stopOpacity="1" />
                <stop offset="30%" stopColor={sumColor} stopOpacity="0.85" />
                <stop offset="60%" stopColor={sumColor} stopOpacity="0.65" />
                <stop offset="100%" stopColor={sumColor} stopOpacity="0.3" />
              </radialGradient>
            </defs>
            <g transform="translate(35, 35)">
              <path
                d={path.join(' ')}
                fill={`url(#grid-gradient-${sum})`}
                stroke="#fff"
                strokeWidth="1"
              />
              <text
                x={0}
                y={-10}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fill="#fff"
                fontWeight="bold"
                pointerEvents="none"
              >
                {sum}
              </text>
              <text
                x={0}
                y={5}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                fill="#fff"
                opacity="1"
                pointerEvents="none"
              >
                {combinationCount}
              </text>
            </g>
          </svg>
          
          {/* 选中状态指示灯 - 绿色小圆点 */}
          {selectedSums.includes(sum) && (
            <div style={{
              position: 'absolute',
              bottom: '-5px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '8px',
              height: '8px',
              backgroundColor: '#52c41a',
              borderRadius: '50%',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              zIndex: 2
            }} />
          )}
        </div>
      );
    };

    // 渲染宫格，精确控制每行数量
    const renderGrid = (sumRange: number[]) => {
      // 精确布局：第一行13个，中间四行14个，最后一行13个
      // 13 + 4×14 + 13 = 82个，正好符合总数量
      
      // 手动分割数据为指定行数
      const rows: number[][] = [];
      
      // 第一行：13个
      rows.push(sumRange.slice(0, 13));
      
      // 中间四行：每行14个
      rows.push(sumRange.slice(13, 27)); // 第2-3行
      rows.push(sumRange.slice(27, 41)); // 第3-4行
      rows.push(sumRange.slice(41, 55)); // 第4-5行
      rows.push(sumRange.slice(55, 69)); // 第5-6行
      
      // 最后一行：13个
      rows.push(sumRange.slice(69));
      
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          margin: '0 auto'
        }}>
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '8px'
            }}>
              {row.map(sum => renderGridItem(sum))}
            </div>
          ))}
        </div>
      );
    };

    return (
      <div 
        style={{ 
          backgroundColor: 'transparent',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
          padding: '20px',
          maxWidth: '100%', // 移除固定宽度，适应页面宽度
          boxSizing: 'border-box',
          marginTop: '80px',
          marginBottom: '80px',
          marginLeft: 'auto',
          marginRight: 'auto',
          position: 'relative', // 用于定位右上角的所选个数
          overflow: 'visible'
        }}
      >
        {/* 底部居中显示所选个数 */}
        <div style={{
          position: 'absolute',
          bottom: '-60px',
          left: '20%',
          transform: 'translateX(-50%)',
          backgroundColor: statisticType === 'red' ? '#f5222d' : '#1890ff',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 'bold',
          padding: '6px 16px',
          borderRadius: '16px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          minWidth: '50px', // 与下方显示号码个数的按钮长度一致
          textAlign: 'center',
          zIndex: 10
        }}>
          {selectedSums.length}
        </div>
        

        
        {/* 根据模式显示对应范围的数据 */}
        <div style={{
          display: 'block',
          textAlign: 'center'
        }}>
          {/* 左部分：21-101 */}
          <div>

            {renderGrid(displayRange)}
          </div>
          

        </div>
      </div>
    );
  };

  // 统一的总和值颜色计算函数，根据组合数量设置深浅度，组合数量越多颜色越深
  const getSumColor = (_sum: number, combinationCount: number) => {
    let hue: number;

    if (statisticType === 'red') {
      hue = 0; // 红色色相为0
    } else {
      hue = 210; // 蓝色色相为210
    }

    // 找到最大和最小的组合数量，用于归一化
    let maxCombinationCount = 1;
    let minCombinationCount = 0;
    
    if (sumCombinationCountData.length > 0) {
      maxCombinationCount = Math.max(...sumCombinationCountData.map(item => item.combinationCount), 1);
      minCombinationCount = Math.min(...sumCombinationCountData.map(item => item.combinationCount), 0);
    }

    // 将组合数量映射到0-1范围，处理可能的除以0情况
    let normalizedValue = 0;
    if (maxCombinationCount > minCombinationCount) {
      normalizedValue = (combinationCount - minCombinationCount) / (maxCombinationCount - minCombinationCount);
    }
    
    // 确保normalizedValue在0-1范围内
    normalizedValue = Math.max(0, Math.min(1, normalizedValue));
    
    // 计算颜色深浅，使用HSL颜色模型，保持色相不变，调整亮度
    const saturation = 85; // 饱和度
    const lightness = 50 - normalizedValue * 30; // 亮度范围50%-20%，组合数量越多颜色越深

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // 渲染能量分析六边形网格
  const renderSumHexagonGrid = () => {
    if (sumData.length === 0) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#999',
          backgroundColor: 'transparent',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' 
        }}>
          暂无总和分析数据
        </div>
      );
    }

    // 六边形大小和间距 - 根据屏幕宽度动态调整
    const hexSize = window.innerWidth > 1200 ? 32 : window.innerWidth > 900 ? 30 : 28;
    const hexSpacing = 4;
    const hexHeight = Math.sqrt(3) * hexSize;
    const hexWidth = 2 * hexSize;
    const rowHeight = hexHeight + hexSpacing;
    const colWidth = hexWidth * 0.75 + hexSpacing;

    // 计算容器大小 - 减少内边距，减少左右空白
    const containerPadding = 20;
    const availableWidth = window.innerWidth - containerPadding * 2;
    // 调整每行六边形数量，再少一个
    const itemsPerRow = Math.max(16, Math.floor((availableWidth - hexSize) / colWidth) - 2); 
    // 增加10px的宽度，适应向右偏移
    const actualContainerWidth = (itemsPerRow * colWidth) + hexSize + 20;

    // 创建总和值到组合数量的映射，用于快速查找
    const sumToCombinationCount: { [key: number]: number } = {};
    sumCombinationCountData.forEach(item => {
      sumToCombinationCount[item.sum] = item.combinationCount;
    });

    // 渲染单个六边形
    const renderHexagon = (x: number, y: number, sum: number, period: number) => {
      // 计算圆角六边形的路径数据
      const cornerRadius = hexSize * 0.15; // 圆角半径，约为六边形大小的15%
      const path = [];
      
      for (let i = 0; i < 6; i++) {
        const angle1 = (i * Math.PI) / 3 - Math.PI / 2;
        const angle2 = ((i + 1) * Math.PI) / 3 - Math.PI / 2;
        
        // 计算每个顶点的坐标
        const x1 = x + (hexSize - cornerRadius) * Math.cos(angle1);
        const y1 = y + (hexSize - cornerRadius) * Math.sin(angle1);

        const x3 = x + (hexSize - cornerRadius) * Math.cos(angle2);
        const y3 = y + (hexSize - cornerRadius) * Math.sin(angle2);
        
        if (i === 0) {
          path.push(`M ${x1} ${y1}`);
        } else {
          path.push(`L ${x1} ${y1}`);
        }
        
        // 添加圆弧路径
        path.push(`A ${cornerRadius} ${cornerRadius} 0 0 1 ${x3} ${y3}`);
      }
      
      path.push('Z'); // 闭合路径

      // 获取当前总和的组合数量
      const combinationCount = sumToCombinationCount[sum] || 0;
      // 获取当前总和的颜色，根据组合数量设置深浅度
      const sumColor = getSumColor(sum, combinationCount);

      // 根据选中的总和值数组决定是否显示当前六边形，支持多选
      const isVisible = selectedSums.length === 0 || selectedSums.includes(sum);

      return (
        <g 
          key={period}
          style={{
            cursor: isVisible ? 'pointer' : 'default',
            opacity: isVisible ? 1 : 0,
            // 保持位置不变
            pointerEvents: isVisible ? 'auto' : 'none'
          }}
          onMouseEnter={(e) => {
            e.stopPropagation(); // 阻止事件冒泡
            setSelectedPeriod(period);
            setPopupPosition({ x, y });
            setIsPopupVisible(true);
          }}
        >
          <defs>
            {/* 定义径向渐变，透明度从中心到边缘逐渐变浅 */}
            <radialGradient id={`gradient-sum-${period}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor={sumColor} stopOpacity="1" /> {/* 中心透明度最高 */}
              <stop offset="30%" stopColor={sumColor} stopOpacity="0.85" />
              <stop offset="60%" stopColor={sumColor} stopOpacity="0.65" />
              <stop offset="100%" stopColor={sumColor} stopOpacity="0.3" /> {/* 边缘透明度最低 */}
            </radialGradient>
          </defs>
          <path
            d={path.join(' ')}
            fill={`url(#gradient-sum-${period})`}
            stroke="#fff"
            strokeWidth="1"
          />
          {/* 和值显示在上方，字体较小 */}
          <text
            x={x}
            y={y - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fill="#fff"
            fontWeight="normal"
            pointerEvents="none"
          >
            {sum}
          </text>
          {/* 期号显示在下方，字体较大 */}
          <text
            x={x}
            y={y + 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fill="#fff"
            fontWeight="bold"
            pointerEvents="none"
          >
            {period}
          </text>
        </g>
      );
    };

    // 渲染气泡组件
    const renderPopup = () => {
      if (!isPopupVisible || selectedPeriod === null) return null;
      
      // 获取选中期数的索引
      const [startIndex] = sliderRange;
      const periodIndex = selectedPeriod - startIndex - 1;
      
      // 获取对应的记录
      const [startRange, endRange] = sliderRange;
      const selectedRangeRecords = allRecords.slice(startRange, endRange + 1);
      const record = selectedRangeRecords[periodIndex];
      
      if (!record) return null;
      
      // 解析中奖号码
      const numbers: string[] = [];
      if (statisticType === 'red') {
        // 红球：前12位，每2位一个号码
        for (let i = 0; i < 12; i += 2) {
          numbers.push(record.substring(i, i + 2));
        }
      } else {
        // 蓝球：后2位
        numbers.push(record.substring(12, 14));
      }
      
      // 获取对应的总和数据
      const sumItem = sumData.find(item => item.period === selectedPeriod);
      if (!sumItem) return null;
      
      // 计算气泡位置，避免边缘遮挡
      const popupWidth = 240;
      const popupHeight = 120;
      let leftPosition = popupPosition.x - popupWidth / 2;
      let topPosition = popupPosition.y - popupHeight;
      
      // 避免左侧遮挡
      if (leftPosition < 10) {
        leftPosition = 10;
      }
      
      // 避免右侧遮挡
      if (leftPosition + popupWidth > actualContainerWidth - 10) {
        leftPosition = actualContainerWidth - popupWidth - 10;
      }
      
      // 避免顶部遮挡
      if (topPosition < 10) {
        topPosition = 10;
      }
      
      // 避免底部遮挡
      const svgHeight = Math.ceil(sumData.length / itemsPerRow) * rowHeight + hexSize;
      if (topPosition + popupHeight > svgHeight - 10) {
        topPosition = popupPosition.y + 40; // 显示在六边形下方
      }
      
      // 创建球体背景颜色
      const centerColor = statisticType === 'red' ? '#f5222d' : '#1890ff';
      
      return (
        <div
          style={{
            position: 'absolute',
            left: `${leftPosition}px`, // 动态调整位置，避免遮挡
            top: `${topPosition}px`,
            zIndex: 1000,
            pointerEvents: 'auto'
          }}
        >
          {/* 球体气泡 */}
          <div
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              boxShadow: `0 12px 35px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(255, 255, 255, 0.1)`,
              boxSizing: 'border-box',
              position: 'relative',
              opacity: 0.95,
              overflow: 'hidden',
              background: `radial-gradient(circle at 50% 50%, ${centerColor} 0%, #f0f0f0 65%, #ffffff 100%)`,
              transition: 'all 0.3s ease'
            }}
          >
            {/* 定义扩散动画 */}
            <style>
              {`
                @keyframes spreadOut-0 {
                  0% {
                    transform: translate(-50%, -50%) translate(0, 0) scale(0.5);
                    opacity: 0;
                  }
                  100% {
                    transform: translate(-50%, -50%) translate(${Math.cos(0 * Math.PI / 3) * 60}px, ${Math.sin(0 * Math.PI / 3) * 60}px) scale(1);
                    opacity: 1;
                  }
                }
                @keyframes spreadOut-1 {
                  0% {
                    transform: translate(-50%, -50%) translate(0, 0) scale(0.5);
                    opacity: 0;
                  }
                  100% {
                    transform: translate(-50%, -50%) translate(${Math.cos(1 * Math.PI / 3) * 60}px, ${Math.sin(1 * Math.PI / 3) * 60}px) scale(1);
                    opacity: 1;
                  }
                }
                @keyframes spreadOut-2 {
                  0% {
                    transform: translate(-50%, -50%) translate(0, 0) scale(0.5);
                    opacity: 0;
                  }
                  100% {
                    transform: translate(-50%, -50%) translate(${Math.cos(2 * Math.PI / 3) * 60}px, ${Math.sin(2 * Math.PI / 3) * 60}px) scale(1);
                    opacity: 1;
                  }
                }
                @keyframes spreadOut-3 {
                  0% {
                    transform: translate(-50%, -50%) translate(0, 0) scale(0.5);
                    opacity: 0;
                  }
                  100% {
                    transform: translate(-50%, -50%) translate(${Math.cos(3 * Math.PI / 3) * 60}px, ${Math.sin(3 * Math.PI / 3) * 60}px) scale(1);
                    opacity: 1;
                  }
                }
                @keyframes spreadOut-4 {
                  0% {
                    transform: translate(-50%, -50%) translate(0, 0) scale(0.5);
                    opacity: 0;
                  }
                  100% {
                    transform: translate(-50%, -50%) translate(${Math.cos(4 * Math.PI / 3) * 60}px, ${Math.sin(4 * Math.PI / 3) * 60}px) scale(1);
                    opacity: 1;
                  }
                }
                @keyframes spreadOut-5 {
                  0% {
                    transform: translate(-50%, -50%) translate(0, 0) scale(0.5);
                    opacity: 0;
                  }
                  100% {
                    transform: translate(-50%, -50%) translate(${Math.cos(5 * Math.PI / 3) * 60}px, ${Math.sin(5 * Math.PI / 3) * 60}px) scale(1);
                    opacity: 1;
                  }
                }
                @keyframes spreadOut-blue {
                  0% {
                    transform: translateY(-50%) scale(0.5);
                    opacity: 0;
                  }
                  100% {
                    transform: translateY(-50%) scale(1);
                    opacity: 1;
                  }
                }
              `}
            </style>
            {/* 中心显示期号和总和 */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 2
            }}>
              {/* 期号显示在上方 */}
              <div style={{
                color: '#000',
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '4px'
              }}>
                {selectedPeriod}期
              </div>
              {/* 总和显示在下方 */}
              <div style={{
                color: '#000',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                总和: {sumItem.sum}
              </div>
            </div>
            
            {/* 号码围绕在球体外侧 */}
            {statisticType === 'red' ? (
              // 红球模式：6个号码围绕在球体外侧
              numbers.map((number, index) => {
                const num = parseInt(number);
                const isOdd = num % 2 === 1;
                const backgroundColor = isOdd 
                  ? `radial-gradient(circle at 25% 25%, #ffffff 0%, #ffb3d9 20%, #ff69b4 50%, #ff3d99 100%)` 
                  : `radial-gradient(circle at 25% 25%, #ffffff 0%, #fff2b3 20%, #f0e68c 50%, #e6c249 100%)`;
                

                
                return (
                  <div key={number} style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) translate(0, 0) scale(0.5)`,
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    background: backgroundColor,
                    color: '#333',
                    boxShadow: `0 10px 25px rgba(0, 0, 0, 0.25), inset 0 0 15px rgba(255, 255, 255, 0.4), inset 0 -10px 15px rgba(0, 0, 0, 0.1)`,
                    zIndex: 3,
                    opacity: 0,
                    animation: `spreadOut-${index} 0.8s ease-out ${index * 0.1}s forwards`
                  }}>
                    {number}
                  </div>
                );
              })
            ) : (
              // 蓝球模式：1个号码放在球体右侧
              <div style={{
                position: 'absolute',
                top: '50%',
                right: '10%',
                transform: 'translateY(-50%) scale(0.5)',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '16px',
                fontWeight: 'bold',
                background: parseInt(numbers[0], 10) % 2 === 1 
                  ? `radial-gradient(circle at 25% 25%, #ffffff 0%, #ffb3d9 20%, #ff69b4 50%, #ff3d99 100%)` 
                  : `radial-gradient(circle at 25% 25%, #ffffff 0%, #fff2b3 20%, #f0e68c 50%, #e6c249 100%)`,
                color: '#333',
                boxShadow: `0 10px 25px rgba(0, 0, 0, 0.25), inset 0 0 15px rgba(255, 255, 255, 0.4), inset 0 -10px 15px rgba(0, 0, 0, 0.1)`,
                zIndex: 3,
                opacity: 0,
                animation: 'spreadOut-blue 0.8s ease-out 0s forwards'
              }}>
                {numbers[0]}
              </div>
            )}
          </div>
        </div>
      );
    };
    
    // 根据模式过滤数据
    const filteredSumData = sumData.filter(item => {
      // 蓝球模式下不进行范围过滤，因为蓝球数值范围是1-16
      if (statisticType === 'blue') {
        return true;
      }
      
      // 红球模式下按正常范围过滤
      if (sumMode === 'northern') {
        return item.sum >= 21 && item.sum <= 102;
      } else {
        return item.sum >= 102 && item.sum <= 183;
      }
    });
    
    // 计算实际显示的六边形数量
    const displayedHexagonCount = selectedSums.length === 0 
      ? filteredSumData.length 
      : filteredSumData.filter(item => selectedSums.includes(item.sum)).length;
    
    return (
        <div style={{ 
          backgroundColor: 'transparent',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
          padding: '20px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflow: 'visible',
          position: 'relative', // 添加相对定位，使气泡相对于容器定位
          marginTop: '80px',
          marginBottom: '80px'
        }}>
        {/* 顶部居中显示实际显示的六边形数量 */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          left: '80%',
          transform: 'translateX(-50%)',
          backgroundColor: statisticType === 'red' ? '#f5222d' : '#1890ff',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 'bold',
          padding: '4px 12px',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          zIndex: 10
        }}>
          {displayedHexagonCount}
        </div>
        

        <div 
          style={{ 
            overflow: 'hidden',
            padding: '20px 0',
            textAlign: 'center',
            position: 'relative' // 添加相对定位，使气泡相对于此容器定位
          }}
        >
          <div style={{ 
            display: 'inline-block',
            position: 'relative' // 添加相对定位，使气泡相对于此容器定位
          }}>
            <svg
            width={actualContainerWidth}
            height={Math.max(Math.ceil(filteredSumData.length / itemsPerRow) * rowHeight + hexSize + 20, 300)} // 设置最小高度为300px
            style={{ overflow: 'hidden' }}
          >
            {[...filteredSumData].reverse().map((item, index) => {
              const row = Math.floor(index / itemsPerRow);
              const col = index % itemsPerRow;
              // 增加10px的水平偏移量，统一往右移一点儿
              const x = col * colWidth + hexSize + 10;
              // 增加10px的垂直偏移量，统一往下移一点儿
              const y = row * rowHeight + hexSize + (col % 2) * (rowHeight / 2) + 10;
              
              return renderHexagon(x, y, item.sum, item.period);
            })}
          </svg>
            
            {/* 渲染气泡 */}
            {renderPopup()}
          </div>
        </div>
      </div>
    );
  };

  // 渲染每一期出现的组合图表



  // 渲染六边形网格图表
  const renderHexagonGrid = () => {
    if (oddEvenData.length === 0) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#999',
          backgroundColor: 'transparent',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' 
        }}>
          暂无每期组合数据
        </div>
      );
    }

    // 定义奇偶组合到新名称的映射
    const combinationToNameMap: { [key: string]: string } = {};
    // 定义新名称到颜色的映射
    const nameToColorMap: { [key: string]: string } = {};
    
    if (statisticType === 'red') {
      // 红球：7种组合（七大行星）
      combinationToNameMap['0奇6偶'] = '地球';
      combinationToNameMap['1奇5偶'] = '水星';
      combinationToNameMap['2奇4偶'] = '金星';
      combinationToNameMap['3奇3偶'] = '火星';
      combinationToNameMap['4奇2偶'] = '木星';
      combinationToNameMap['5奇1偶'] = '土星';
      combinationToNameMap['6奇0偶'] = '天王星';
      
      // 红球颜色：红橙黄绿青蓝紫（使用全局颜色配置）
      nameToColorMap['水星'] = GLOBAL_COMBINATION_COLORS.red['水星']; // 红
      nameToColorMap['金星'] = GLOBAL_COMBINATION_COLORS.red['金星']; // 橙
      nameToColorMap['地球'] = GLOBAL_COMBINATION_COLORS.red['地球']; // 黄
      nameToColorMap['火星'] = GLOBAL_COMBINATION_COLORS.red['火星']; // 绿
      nameToColorMap['木星'] = GLOBAL_COMBINATION_COLORS.red['木星']; // 青
      nameToColorMap['土星'] = GLOBAL_COMBINATION_COLORS.red['土星']; // 蓝
      nameToColorMap['天王星'] = GLOBAL_COMBINATION_COLORS.red['天王星']; // 紫
    } else {
      // 蓝球：2种组合（太阳和月亮）
      combinationToNameMap['1奇0偶'] = '太阳';
      combinationToNameMap['0奇1偶'] = '月亮';
      
      // 蓝球颜色：红色和紫色（使用全局颜色配置）
      nameToColorMap['太阳'] = GLOBAL_COMBINATION_COLORS.blue['太阳']; // 红色
      nameToColorMap['月亮'] = GLOBAL_COMBINATION_COLORS.blue['月亮']; // 紫色
    }

    // 六边形大小和间距 - 根据屏幕宽度动态调整
    const hexSize = window.innerWidth > 1200 ? 30 : window.innerWidth > 900 ? 28 : 26;
    const hexSpacing = 4;
    const hexHeight = Math.sqrt(3) * hexSize;
    const hexWidth = 2 * hexSize;
    const rowHeight = hexHeight + hexSpacing;
    const colWidth = hexWidth * 0.75 + hexSpacing;

    // 计算容器大小 - 根据窗口宽度动态调整每行数量
    const containerPadding = 50;
    const availableWidth = window.innerWidth - containerPadding;
    // 计算每行实际能容纳的完整六边形数量，减少一个
    const itemsPerRow = Math.max(14, Math.floor((availableWidth - hexSize * 2) / colWidth) - 1); 
    // 增加20px的宽度，适应向右偏移
    const actualContainerWidth = (itemsPerRow * colWidth) + hexSize * 2 + 20;

    // 渲染单个六边形
    const renderHexagon = (x: number, y: number, gradientId: string, period: number) => {
      // 计算圆角六边形的路径数据
      const cornerRadius = hexSize * 0.15; // 圆角半径，约为六边形大小的15%
      const path = [];
      
      for (let i = 0; i < 6; i++) {
        const angle1 = (i * Math.PI) / 3 - Math.PI / 2;
        const angle2 = ((i + 1) * Math.PI) / 3 - Math.PI / 2;
        
        // 计算每个顶点的坐标
        const x1 = x + (hexSize - cornerRadius) * Math.cos(angle1);
        const y1 = y + (hexSize - cornerRadius) * Math.sin(angle1);

        const x3 = x + (hexSize - cornerRadius) * Math.cos(angle2);
        const y3 = y + (hexSize - cornerRadius) * Math.sin(angle2);
        
        if (i === 0) {
          path.push(`M ${x1} ${y1}`);
        } else {
          path.push(`L ${x1} ${y1}`);
        }
        
        // 添加圆弧路径
        path.push(`A ${cornerRadius} ${cornerRadius} 0 0 1 ${x3} ${y3}`);
      }
      
      path.push('Z'); // 闭合路径

      return (
        <g 
          key={period}
          style={{
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.stopPropagation(); // 阻止事件冒泡
            setSelectedPeriod(period);
            setPopupPosition({ x, y });
            setIsPopupVisible(true);
          }}
        >
          <path
            d={path.join(' ')}
            fill={`url(#${gradientId})`}
            stroke="#fff"
            strokeWidth="1"
          />
          <text
            x={x}
            y={y + 5}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fill="#fff"
            fontWeight="bold"
            pointerEvents="none"
          >
            {period}
          </text>
        </g>
      );
    };

    // 渲染气泡组件
    const renderPopup = () => {
      if (!isPopupVisible || selectedPeriod === null) return null;
      
      // 获取选中期数的索引
      const [startIndex] = sliderRange;
      const periodIndex = selectedPeriod - startIndex - 1;
      
      // 获取对应的记录
      const [startRange, endRange] = sliderRange;
      const selectedRangeRecords = allRecords.slice(startRange, endRange + 1);
      const record = selectedRangeRecords[periodIndex];
      
      if (!record) return null;
      
      // 解析中奖号码
      let numbers: string[];
      if (statisticType === 'red') {
        // 红球：前12位，每2位一个号码
        numbers = [];
        for (let i = 0; i < 12; i += 2) {
          numbers.push(record.substring(i, i + 2));
        }
      } else {
        // 蓝球：后2位
        numbers = [record.substring(12, 14)];
      }
      
      // 获取对应的组合类型和颜色
      const oddEvenItem = oddEvenData.find(item => item.period === selectedPeriod);
      if (!oddEvenItem) return null;
      
      const originalCombination = `${oddEvenItem.oddCount}奇${oddEvenItem.evenCount}偶`;
      const combination = combinationToNameMap[originalCombination] || originalCombination;
      const baseColor = nameToColorMap[combination as keyof typeof nameToColorMap] || '#999';
      
      // 计算气泡位置，避免边缘遮挡
      const popupWidth = 240;
      const popupHeight = 120;
      let leftPosition = popupPosition.x - popupWidth / 2;
      let topPosition = popupPosition.y - popupHeight;
      
      // 避免左侧遮挡
      if (leftPosition < 10) {
        leftPosition = 10;
      }
      
      // 避免右侧遮挡
      if (leftPosition + popupWidth > actualContainerWidth - 10) {
        leftPosition = actualContainerWidth - popupWidth - 10;
      }
      
      // 避免顶部遮挡
      if (topPosition < 10) {
        topPosition = 10;
      }
      
      // 避免底部遮挡
      const svgHeight = Math.ceil(oddEvenData.length / itemsPerRow) * rowHeight + hexSize;
      if (topPosition + popupHeight > svgHeight - 10) {
        topPosition = popupPosition.y + 40; // 显示在六边形下方
      }
      
      return (
        <div
          style={{
            position: 'absolute',
            left: `${leftPosition}px`, // 动态调整位置，避免遮挡
            top: `${topPosition}px`,
            zIndex: 1000,
            pointerEvents: 'auto'
          }}
        >
          {/* 球体气泡 */}
          <div
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              boxShadow: `0 12px 35px rgba(0, 0, 0, 0.25), inset 0 0 40px rgba(255, 255, 255, 0.25)`,
              boxSizing: 'border-box',
              position: 'relative',
              opacity: 0.95,
              overflow: 'hidden',
              background: `radial-gradient(circle at 50% 50%, ${baseColor} 0%, #f5f5f5 65%, #e5e5e5 100%)`,
              transition: 'all 0.3s ease'
            }}
          >
            {/* 定义扩散动画 */}
            <style scoped>
              {`
                ${numbers.map((_, index) => `
                  @keyframes spreadOutRed-${selectedPeriod}-${index} {
                    0% {
                      transform: translate(-50%, -50%) translate(0, 0) scale(0.5);
                      opacity: 0;
                    }
                    100% {
                      transform: translate(-50%, -50%) translate(${Math.cos(index / 6 * 2 * Math.PI) * 60}px, ${Math.sin(index / 6 * 2 * Math.PI) * 60}px) scale(1);
                      opacity: 1;
                    }
                  }
                `).join('')}
                
                @keyframes spreadOutBlue-${selectedPeriod} {
                  0% {
                    transform: translateY(-50%) scale(0.5);
                    opacity: 0;
                  }
                  100% {
                    transform: translateY(-50%) scale(1);
                    opacity: 1;
                  }
                }
              `}
            </style>
            
            {/* 中心显示期号 */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 2
            }}>
              {/* 期号显示在中心 */}
              <div style={{
                color: '#000',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                {selectedPeriod}期
              </div>
            </div>
            
            {/* 号码围绕在球体外侧 */}
            {statisticType === 'red' ? (
              // 红球模式：6个号码围绕在球体外侧
              numbers.map((number, index) => {
                
                // 计算每个号码的位置，均匀分布在球体边缘
                // const angle = (index / 6) * 2 * Math.PI;
                // const radius = 60; // 球体半径
                // const x = Math.cos(angle) * radius;
                // const y = Math.sin(angle) * radius;
                
                return (
                  <div key={number} style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) translate(0, 0) scale(0.5)`,
                    opacity: 0,
                    animation: `spreadOutRed-${selectedPeriod}-${index} 0.5s ease-out ${index * 0.05}s forwards`,
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    background: `radial-gradient(circle at 25% 25%, #ffffff 0%, ${baseColor}88 20%, ${baseColor}CC 60%, ${baseColor}FF 100%)`,
                    color: '#fff',
                    boxShadow: `0 10px 25px rgba(${parseInt(baseColor.substring(1, 3), 16)}, ${parseInt(baseColor.substring(3, 5), 16)}, ${parseInt(baseColor.substring(5, 7), 16)}, 0.4), inset 0 0 15px rgba(255, 255, 255, 0.4), inset 0 -10px 15px rgba(0, 0, 0, 0.1)`,
                    zIndex: 3,
                    transition: 'all 0.2s ease'
                  }}>
                    {number}
                  </div>
                );
              })
            ) : (
              // 蓝球模式：1个号码放在球体右侧
              <div style={{
                position: 'absolute',
                top: '50%',
                right: '10%',
                transform: 'translateY(-50%)',
                animation: `spreadOutBlue-${selectedPeriod} 0.5s ease-out forwards`,
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '16px',
                fontWeight: 'bold',
                background: `radial-gradient(circle at 25% 25%, #ffffff 0%, ${baseColor}88 20%, ${baseColor}CC 60%, ${baseColor}FF 100%)`,
                color: '#fff',
                boxShadow: `0 10px 25px rgba(${parseInt(baseColor.substring(1, 3), 16)}, ${parseInt(baseColor.substring(3, 5), 16)}, ${parseInt(baseColor.substring(5, 7), 16)}, 0.4), inset 0 0 15px rgba(255, 255, 255, 0.4), inset 0 -10px 15px rgba(0, 0, 0, 0.1)`,
                zIndex: 3,
                transition: 'all 0.2s ease'
              }}>
                {numbers[0]}
              </div>
            )}
          </div>
        </div>
      );
    };
    
    // 根据currentCombination过滤数据
    const filteredData = currentCombination
      ? oddEvenData.filter(item => {
          const originalCombination = `${item.oddCount}奇${item.evenCount}偶`;
          const combination = combinationToNameMap[originalCombination] || originalCombination;
          return combination === currentCombination;
        })
      : oddEvenData;
    
    // 根据统计类型获取所有可能的组合类型
    let allPossibleCombinations: string[];
    if (statisticType === 'red') {
      // 红球：7种组合（七大行星）
      allPossibleCombinations = ['地球', '水星', '金星', '火星', '木星', '土星', '天王星'];
    } else {
      // 蓝球：2种组合（太阳和月亮）
      allPossibleCombinations = ['太阳', '月亮'];
    }
    
    return (
      <div style={{ 
        backgroundColor: 'transparent',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
        padding: '16px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative' // 添加相对定位，使气泡相对于容器定位
      }}>
        {/* 组合切换按钮 - 移到六边形网格标题上方 */}
        <div style={{ 
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '20px',
          justifyContent: 'center',
          padding: '0 16px',
          boxSizing: 'border-box'
        }}>
          {allPossibleCombinations.map(combination => (
            <button
              key={combination}
              onClick={() => setCurrentCombination(combination)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: `1px solid ${nameToColorMap[combination as keyof typeof nameToColorMap] || '#d9d9d9'}`,
                backgroundColor: currentCombination === combination 
                  ? (nameToColorMap[combination as keyof typeof nameToColorMap] || '#d9d9d9') 
                  : '#fff',
                color: currentCombination === combination ? '#fff' : (nameToColorMap[combination as keyof typeof nameToColorMap] || '#333'),
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              {combination}
            </button>
          ))}
        </div>
        

        <div 
          style={{ 
            overflow: 'hidden',
            padding: '20px 0',
            textAlign: 'center',
            position: 'relative' // 添加相对定位，使气泡相对于此容器定位
          }}
        >
          <div style={{ 
            display: 'inline-block',
            position: 'relative' // 添加相对定位，使气泡相对于此容器定位
          }}>
            <svg
              width={actualContainerWidth}
              height={Math.max(Math.ceil(filteredData.length / itemsPerRow) * rowHeight + hexSize, 300)} // 设置最小高度为300px
              style={{ overflow: 'visible' }}
            >
              {/* 定义渐变，透明度从中心到边缘逐渐变浅 */}
              <defs>
                {Object.keys(nameToColorMap).map((key) => {
                  const color = nameToColorMap[key as keyof typeof nameToColorMap];
                  return (
                    <radialGradient key={key} id={`gradient-${key}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                      <stop offset="0%" stopColor={color} stopOpacity="1" />
                      <stop offset="30%" stopColor={color} stopOpacity="0.85" />
                      <stop offset="60%" stopColor={color} stopOpacity="0.65" />
                      <stop offset="100%" stopColor={color} stopOpacity="0.3" />
                    </radialGradient>
                  );
                })}
                {/* 默认渐变 */}
                <radialGradient id="gradient-default" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" stopColor="#999" stopOpacity="1" />
                  <stop offset="30%" stopColor="#999" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#999" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#999" stopOpacity="0.3" />
                </radialGradient>
              </defs>
              
              {filteredData.map((item, index) => {
                const row = Math.floor(index / itemsPerRow);
                const col = index % itemsPerRow;
                // 增加10px的水平偏移量，统一往右移一点儿
                const x = col * colWidth + hexSize + 10;
                const y = row * rowHeight + hexSize + (col % 2) * (rowHeight / 2);
                const originalCombination = `${item.oddCount}奇${item.evenCount}偶`;
                const combination = combinationToNameMap[originalCombination] || originalCombination;

                const gradientId = nameToColorMap[combination as keyof typeof nameToColorMap] ? `gradient-${combination}` : 'gradient-default';
                
                return renderHexagon(x, y, gradientId, item.period);
              })}
            </svg>
            
            {/* 渲染气泡 */}
            {renderPopup()}
          </div>
        </div>
      </div>
    );
  };



  // 渲染位置分析柱状图
  const renderPositionAnalysis = () => {
    if (positionAnalysisData.length === 0) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#999',
          backgroundColor: 'transparent',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' 
        }}>
          暂无位置分析数据
        </div>
      );
    }

    // 根据统计类型生成所有可能的号码列表
    const generateAllNumbers = () => {
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

    const allNumbers = generateAllNumbers();
    const currentColor = statisticType === 'red' ? '#f5222d' : '#1890ff';

    return (
      <div style={{ 
        padding: '16px', 
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        {/* 根据统计类型显示不同布局 */}
        <div style={{ 
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          width: '100%',
          boxSizing: 'border-box',
          justifyContent: statisticType === 'blue' ? 'center' : 'flex-start'
        }}>
          {positionAnalysisData.map((positionData) => {
            // 准备柱状图数据，确保所有号码都有数据，未出现的号码次数为0
            const barData = allNumbers.map(number => ({
              name: number,
              value: positionData.numberCounts[number] || 0
            }));

            // ECharts配置项
            const option = {
              backgroundColor: 'transparent',
              textStyle: {
                color: '#fff'
              },
              animation: false, // 关闭初始动画
              tooltip: {
                trigger: 'axis',
                axisPointer: {
                  type: 'shadow'
                },
                formatter: '{b}\n{c}次'
              },
              legend: {
                show: false // 隐藏图例
              },
              grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                top: '8%',
                containLabel: true
              },
              xAxis: [
              {
                type: 'category',
                data: barData.map(item => item.name),
                axisLabel: {
                  fontSize: 10,
                  rotate: 45,
                  interval: statisticType === 'red' ? 2 : 0 // 红球每3个显示一个标签，避免重叠
                },
                axisLine: {
                  lineStyle: {
                    color: '#f0f0f0'
                  }
                },
                splitLine: {
                  show: false
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
                  show: false
                }
              }
            ],
              series: [
                {
                  name: '出现次数',
                  type: 'bar',
                  data: barData.map(item => item.value),
                  itemStyle: {
                    color: currentColor,
                    borderRadius: [4, 4, 0, 0]
                  },
                  emphasis: {
                    focus: 'series',
                    itemStyle: {
                      shadowBlur: 10,
                      shadowOffsetX: 0,
                      shadowColor: 'rgba(0, 0, 0, 0.2)'
                    }
                  },
                  label: {
                    show: false
                  }
                }
              ]
            };

            return (
              <div 
                key={positionData.position}
                style={{ 
                  backgroundColor: 'transparent',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                  padding: '16px',
                  width: statisticType === 'blue' ? '40%' : 'calc(33.33% - 13.33px)', // 蓝球居中显示，红球保持3个一行
                  boxSizing: 'border-box',
                  marginBottom: '20px'
                }}
              >
                {/* 位置标题 - 球形数字 */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: currentColor,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  margin: '0 auto 12px',
                  boxShadow: `0 3px 8px rgba(${statisticType === 'red' ? '245, 34, 45' : '24, 144, 255'}, 0.4)`,
                  color: '#fff',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                }}>
                  {positionData.position}
                </div>
              
                {/* 图表容器 */}
                <div 
                  style={{ 
                    height: '300px',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <ReactECharts option={option} style={{ height: '100%', width: '100%', backgroundColor: 'transparent' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // 渲染每个号码累计次数柱状图
  const renderNumberAccumulatedChart = () => {
    if (numberAccumulatedCountData.length === 0) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#999',
          backgroundColor: '#fff',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' 
        }}>
          暂无号码累计次数数据
        </div>
      );
    }
    
    const currentColor = statisticType === 'red' ? '#f5222d' : '#1890ff';
    const isRed = statisticType === 'red';
    
    // 获取人物映射
    const characterMap = isRed ? GLOBAL_CHARACTER_MAPS.red : GLOBAL_CHARACTER_MAPS.blue;
    
    // ECharts配置项
    const option = {
      backgroundColor: 'transparent',
      textStyle: {
        color: '#fff'
      },
      animation: false, // 关闭初始动画
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params: Array<{ axisValue: string; marker: string; seriesName: string; value: number }>) {
          const number = params[0].axisValue;
          const characterName = characterMap[number] || number;
          return `${characterName}: ${params[0].value}次`;
        }
      },
      legend: {
        show: true,
        data: ['累计出现次数'],
        top: '5%',
        left: 'center'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          data: numberAccumulatedCountData.map(item => item.number),
          axisLabel: {
            fontSize: 10,
            rotate: 45,
            interval: isRed ? 2 : 0, // 红球每3个显示一个标签，蓝球全显示
            formatter: function(value: string) {
              return characterMap[value] || value;
            }
          },
          axisLine: {
            lineStyle: {
              color: '#666'
            }
          },
          splitLine: {
            show: false
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
              color: '#666'
            }
          },
          splitLine: {
            show: false
          }
        }
      ],
      series: [
        {
          name: '累计出现次数',
          type: 'bar',
          data: numberAccumulatedCountData.map(item => item.count),
          itemStyle: {
            color: currentColor,
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.2)'
            }
          },
          label: {
            show: false
          }
        }
      ]
    };
    
    return (
      <div style={{ 
        backgroundColor: 'transparent',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
        padding: '16px',
        marginBottom: '20px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        {/* 图表容器 */}
        <div 
          style={{ 
            height: '500px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
          <ReactECharts option={option} style={{ height: '100%', width: '100%', backgroundColor: 'transparent' }} />
        </div>
      </div>
    );
  };

  // 渲染能量分析
  const renderSumStats = () => {
    return (
      <div style={{ 
        padding: '16px', 
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>

        {/* 平滑曲线图表 */}
        <div style={{ 
          marginBottom: '20px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {renderSumChart()}
        </div>
        
        {/* 合并的能量分析柱状图 */}
        <div style={{ 
          marginBottom: '20px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {renderCombinedSumBarChart()}
        </div>
        
        {/* 红球总和值9*9宫格 */}
        <div style={{ 
          marginBottom: '20px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {renderRedSumGrid()}
        </div>
        
        {/* 每期总和六边形网格 */}
        <div style={{ 
          marginBottom: '40px',
          marginTop: '20px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {renderSumHexagonGrid()}
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
        {/* 每个号码累计次数柱状图 */}
        <div style={{ 
          marginBottom: '20px',
          width: '100%', // 确保图表容器宽度为100%
          boxSizing: 'border-box' // 确保padding不会影响宽度
        }}>
          {renderNumberAccumulatedChart()}
        </div>
        
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
              backgroundColor: 'transparent',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
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
              // 使用与renderNumberSelector一致的容器尺寸
              const selectorWidth = isRed ? 420 : 360;
              const selectorHeight = isRed ? 400 : 320;
              
              const newX = isButtonOnRight 
                ? floatingButtonPosition.x - selectorWidth - 20 // 左侧20px间距
                : floatingButtonPosition.x + 50 + 20; // 右侧20px间距，按钮宽度50px
              
              // 计算Y位置，确保选择器不会超出页面底部，且底部与页脚齐平
              // 页脚高度固定为64px
              const footerHeight = 64;
              let newY = floatingButtonPosition.y - selectorHeight / 2 - 40; // 垂直居中，向上偏移40px
              // 如果底部超出页面，则向上调整，距离底部至少footerHeight+10px（10px为间距）
              if (newY + selectorHeight > window.innerHeight) {
                newY = window.innerHeight - selectorHeight - footerHeight - 10; // 距离页脚顶部10px
              }
              // 确保选择器不会太靠上，保持距离顶部至少40px
              if (newY < 40) {
                newY = 40; // 距离顶部至少40px
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

  // 渲染宁荣两府
  // 渲染奇偶组合饼状图
  const renderOddEvenPieChart = () => {
    if (oddEvenCombinationData.length === 0) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#999',
          backgroundColor: '#fff',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' 
        }}>
          暂无奇偶组合统计数据
        </div>
      );
    }

    // 定义不同组合的颜色，与组合曲线图保持一致 - 红球：红橙黄绿青蓝紫，蓝球：黄绿
    const nameToColorMap: { [key: string]: string } = {};
    
    if (statisticType === 'red') {
      // 红球：7种组合（七大行星）
      // 红球颜色：红橙黄绿青蓝紫
      nameToColorMap['地球'] = '#1890ff'; // 蓝
      nameToColorMap['水星'] = '#52c41a'; // 绿
      nameToColorMap['金星'] = '#faad14'; // 黄
      nameToColorMap['火星'] = '#f5222d'; // 红
      nameToColorMap['木星'] = '#13c2c2'; // 青
      nameToColorMap['土星'] = '#fa8c16'; // 橙
      nameToColorMap['天王星'] = '#722ed1'; // 紫
    } else {
      // 蓝球：2种组合（太阳和月亮）
      // 蓝球颜色：红色和紫色
      nameToColorMap['太阳'] = '#f5222d'; // 红色
      nameToColorMap['月亮'] = '#722ed1'; // 紫色
    }
    
    // 处理饼状图数据，添加颜色属性并按照指定顺序排列
    const desiredOrder = statisticType === 'red' 
      ? ['地球', '水星', '金星', '火星', '木星', '土星', '天王星'] // 红球：七大行星
      : ['太阳', '月亮']; // 蓝球：太阳和月亮
    const pieData = desiredOrder
      .map(name => {
        const item = oddEvenCombinationData.find(item => item.combination === name);
        if (item) {
          return {
            name: item.combination,
            value: item.count,
            itemStyle: {
              color: nameToColorMap[item.combination as keyof typeof nameToColorMap] || '#999'
            }
          };
        }
        return null;
      })
      .filter(item => item !== null) as Array<{ name: string; value: number; itemStyle: { color: string } }>;
    
    // ECharts配置项
    const option = {
      backgroundColor: 'transparent',
      textStyle: {
        color: '#fff'
      },
      animation: false, // 关闭初始动画
      tooltip: {
        trigger: 'item',
        formatter: '{b}\n{c}次'
      },
      legend: {
        orient: 'horizontal',
        top: '5%',
        left: 'center',
        data: pieData.map(item => item.name),
        type: 'scroll',
        textStyle: {
          fontSize: 12
        },
        itemWidth: 15,
        itemHeight: 15,
        maxWidth: 500,
        pageIconSize: 12,
        pageTextStyle: {
          fontSize: 10
        }
      },
      series: [
        {
          name: '奇偶组合次数',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '55%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10
          },
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}\n{c}次',
            fontSize: 12,
            fontWeight: 'normal',
            color: '#fff',
            textBorderColor: 'transparent',
            textBorderWidth: 0,
            textShadowBlur: 0
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold',
              formatter: '{b}\n{c}次',
              color: '#fff',
              textBorderColor: 'transparent',
              textBorderWidth: 0,
              textShadowBlur: 0
            }
          },
          labelLine: {
            show: true,
            length: 20,
            length2: 10
          },
          data: pieData
        }
      ]
    };

    return (
      <div 
        style={{ 
          backgroundColor: 'transparent',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
          padding: '16px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}
      >
        <div 
          style={{ 
            height: '500px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
          <ReactECharts option={option} style={{ height: '100%', width: '100%', backgroundColor: 'transparent' }} />
        </div>
      </div>
    );
  };

  const renderOddEvenStats = () => {
    // 在统计类型切换时，确保数据符合当前模式，避免闪现旧图表
    // 检查奇偶组合数据是否为空或不属于当前模式
    if (oddEvenCombinationData.length > 0) {
      const firstCombination = oddEvenCombinationData[0].combination;
      const isBlueModeCombination = firstCombination === '太阳' || firstCombination === '月亮';
      const isRedModeCombination = ['水星', '金星', '地球', '火星', '木星', '土星', '天王星'].includes(firstCombination);
      
      // 如果当前是蓝球模式，但数据是红球模式，返回空数组，避免渲染
      if (statisticType === 'blue' && isRedModeCombination) {
        return null;
      }
      // 如果当前是红球模式，但数据是蓝球模式，返回空数组，避免渲染
      if (statisticType === 'red' && isBlueModeCombination) {
        return null;
      }
    }
    // 渲染蓝球模式下的阴阳累计次数柱状图
    return (
      <div style={{ 
        padding: '16px', 
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        {/* 两个统计图并排布局 */}
        <div style={{ 
          display: 'flex',
          gap: '20px',
          marginBottom: '20px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* 平滑曲线图表 - 占50%空间 */}
          <div style={{ 
            width: '50%',
            boxSizing: 'border-box'
          }}>
            {renderOddEvenChart()}
          </div>
          
          {/* 奇偶组合饼状图 - 占50%空间 */}
          <div style={{ 
            width: '50%',
            boxSizing: 'border-box'
          }}>
            {renderOddEvenPieChart()}
          </div>
        </div>
        
        {/* 六边形网格图表 */}
        <div style={{ 
          marginBottom: '20px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {renderHexagonGrid()}
        </div>
      </div>
    );
  };

  // 当Context中的数据变化时，更新组件状态
  useEffect(() => {
    // 防止在StrictMode下运行两次
    if (!contextAllRecords || contextAllRecords.length === 0) return;
    hasFetchedRef.current = true;

    try {
      let recordsToUse: string[];
      if (typeof contextAllRecords === 'string') {
        // 接口返回的是字符串，通过换行符分割成数组
        recordsToUse = contextAllRecords
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0);
        message.success(`成功获取 ${recordsToUse.length} 条记录`);
      } else if (Array.isArray(contextAllRecords)) {
        // 接口返回的是数组，直接使用
        recordsToUse = contextAllRecords;
        message.success(`成功获取 ${recordsToUse.length} 条记录`);
      } else {
        // 使用模拟数据
        recordsToUse = [
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
        message.info(`使用模拟数据，共 ${recordsToUse.length} 条记录`);
      }
      
      // 保存所有记录到状态
      setAllRecords(recordsToUse);
      // 设置滑块初始范围为全部记录
      const initialRange: [number, number] = [0, Math.max(0, recordsToUse.length - 1)];
      setSliderRange(initialRange);
      // 解析所有记录
      parseRecords(recordsToUse);
    } catch (error) {
      console.error('处理记录失败:', error);
      // 处理失败时使用模拟数据
      const recordsToUse = [
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
      setAllRecords(recordsToUse);
      const initialRange: [number, number] = [0, recordsToUse.length - 1];
      setSliderRange(initialRange);
      parseRecords(recordsToUse);
      message.info(`处理记录失败，使用模拟数据，共 ${recordsToUse.length} 条记录`);
    }
  }, [contextAllRecords]);

  // 当统计类型切换时，立即清空相关状态，避免闪现旧数据
  useEffect(() => {
    // 统计类型变化时，立即清空所有相关状态
    setOddEvenCombinationData([]);
    setOddEvenCombinationAccumulatedData([]);
    // 清空能量分析相关数据
    setSumData([]);
    setSumCountData([]);
    setSumCombinationCountData([]);
  }, [statisticType]);

  // 当统计类型切换或滑块范围变化时，重新计算奇偶组合数据
  useEffect(() => {
    if (allRecords.length > 0) {
      // 获取滑块范围内的记录
      const [startIndex, endIndex] = sliderRange;
      const selectedRangeRecords = allRecords.slice(startIndex, endIndex + 1);
      // 重新计算奇偶组合数据
      parseRecords(selectedRangeRecords);
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
      const currentNumbers: string[] = [];
      
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

  // 计算每期的奇偶号码个数
  useEffect(() => {
    if (allRecords.length === 0) {
      setOddEvenData([]);
      return;
    }

    // 获取滑块范围内的记录
    const [startIndex, endIndex] = sliderRange;
    const selectedRangeRecords = allRecords.slice(startIndex, endIndex + 1);

    // 计算每期的奇偶号码个数
    const oddEvenData = selectedRangeRecords.map((record, index) => {
      const period = startIndex + index + 1;
      const isRed = statisticType === 'red';
      const numbers: string[] = [];
      
      if (isRed) {
        // 红球：前12位，每两位一个号码
        for (let i = 0; i < 12; i += 2) {
          numbers.push(record.substring(i, i + 2));
        }
      } else {
        // 蓝球：最后两位
        numbers.push(record.substring(12, 14));
      }

      // 计算奇偶个数
      let oddCount = 0;
      let evenCount = 0;

      numbers.forEach(number => {
        const num = parseInt(number);
        if (num % 2 === 0) {
          evenCount++;
        } else {
          oddCount++;
        }
      });

      return { period, oddCount, evenCount };
    });

    setOddEvenData(oddEvenData);
  }, [allRecords, statisticType, sliderRange]);

  // 计算每期的号码总和
  useEffect(() => {
    if (allRecords.length === 0) {
      setSumData([]);
      setSumCountData([]);
      return;
    }

    // 获取滑块范围内的记录
    const [startIndex, endIndex] = sliderRange;
    const selectedRangeRecords = allRecords.slice(startIndex, endIndex + 1);

    // 计算每期的号码总和
    const sumData = selectedRangeRecords.map((record, index) => {
      const period = startIndex + index + 1;
      const isRed = statisticType === 'red';
      const numbers: string[] = [];
      
      if (isRed) {
        // 红球：前12位，每两位一个号码
        for (let i = 0; i < 12; i += 2) {
          numbers.push(record.substring(i, i + 2));
        }
      } else {
        // 蓝球：最后两位
        numbers.push(record.substring(12, 14));
      }

      // 计算总和
      const sum = numbers.reduce((total, number) => {
        return total + parseInt(number);
      }, 0);

      return { period, sum };
    });

    setSumData(sumData);

    // 统计每个总和结果出现的次数
    const sumCountMap: { [key: number]: number } = {};
    sumData.forEach(item => {
      const sum = item.sum;
      sumCountMap[sum] = (sumCountMap[sum] || 0) + 1;
    });

    // 转换为数组格式
    const sumCountArray = Object.entries(sumCountMap)
      .map(([sum, count]) => ({ sum: parseInt(sum), count }))
      .sort((a, b) => a.sum - b.sum);

    setSumCountData(sumCountArray);
  }, [allRecords, statisticType, sliderRange]);

  // 计算每个位置上每个号码出现的次数
  useEffect(() => {
    if (allRecords.length === 0) {
      setPositionAnalysisData([]);
      return;
    }

    // 获取滑块范围内的记录
    const [startIndex, endIndex] = sliderRange;
    const selectedRangeRecords = allRecords.slice(startIndex, endIndex + 1);

    // 根据统计类型确定位置数量
    const positionCount = statisticType === 'red' ? 6 : 1;
    // 初始化位置分析数据
      const initialPositionData: PositionAnalysisItem[] = Array.from({ length: positionCount }, (_, i) => ({
        position: i + 1,
        numberCounts: {}
      }));

    // 遍历所有记录，统计每个位置上每个号码出现的次数
    selectedRangeRecords.forEach(record => {
      if (typeof record === 'string') {
        // 解析每个位置的号码
        for (let position = 0; position < positionCount; position++) {
          let number: string;
          if (statisticType === 'red') {
            // 红球：前12位，每两位一个号码，每个位置对应两个字符
            number = record.substring(position * 2, position * 2 + 2);
          } else {
            // 蓝球：后两位
            number = record.substring(12, 14);
          }

          // 更新该位置上该号码的出现次数
          initialPositionData[position].numberCounts[number] = 
            (initialPositionData[position].numberCounts[number] || 0) + 1;
        }
      }
    });

    setPositionAnalysisData(initialPositionData);
  }, [allRecords, statisticType, sliderRange]);

  // 计算每个总和值对应的组合数量
  useEffect(() => {
    // 红球：计算所有可能的6个红球组合的总和
    if (statisticType === 'red') {
      // 红球号码范围：1-33
      const redBalls = Array.from({ length: 33 }, (_, i) => i + 1);
      // 计算所有6个红球的组合
      const combinations: number[][] = [];
      
      // 生成所有可能的6个红球组合
      const generateCombinations = (arr: number[], len: number, start: number, current: number[]) => {
        if (current.length === len) {
          combinations.push([...current]);
          return;
        }
        for (let i = start; i < arr.length; i++) {
          current.push(arr[i]);
          generateCombinations(arr, len, i + 1, current);
          current.pop();
        }
      };
      
      generateCombinations(redBalls, 6, 0, []);
      
      // 统计每个总和值对应的组合数量
      const sumCombinationMap: { [key: number]: number } = {};
      combinations.forEach(combination => {
        const sum = combination.reduce((total, num) => total + num, 0);
        sumCombinationMap[sum] = (sumCombinationMap[sum] || 0) + 1;
      });
      
      // 转换为数组格式
      const sumCombinationArray = Object.entries(sumCombinationMap)
        .map(([sum, combinationCount]) => ({ sum: parseInt(sum), combinationCount }))
        .sort((a, b) => a.sum - b.sum);
      
      setSumCombinationCountData(sumCombinationArray);
    } else {
      // 蓝球：计算所有可能的1个蓝球组合的总和（即每个蓝球本身）
      const blueBalls = Array.from({ length: 16 }, (_, i) => i + 1);
      const sumCombinationArray = blueBalls.map(ball => ({
        sum: ball,
        combinationCount: 1
      }));
      
      setSumCombinationCountData(sumCombinationArray);
    }
  }, [statisticType]);

  // 处理滑块变化
  const handleSliderChange = (value: number[]) => {
    const range = value as [number, number];
    setSliderRange(range);
    // 从所有记录中获取选中范围的记录
    const selectedRecords = allRecords.slice(range[0], range[1] + 1);
    // 重新解析数据
    parseRecords(selectedRecords);
  };

  // 当前活动标签页
  const [activeTabKey, setActiveTabKey] = useState<string>('4');

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  // 当切换到不同tab时，处理相关状态
  useEffect(() => {
    // 当切换到非累计分析tab时，隐藏号码选择器
    if (activeTabKey !== '1') {
      setShowNumberSelector(false);
    }
    // 当切换到太虚幻境tab时，重置页码为1
    if (activeTabKey === '4') {
      setCurrentPage(1);
    }
  }, [activeTabKey, statisticType]);

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
    } else if (isSumButtonDragging) {
      const newX = e.clientX - sumButtonDragOffset.x;
      const newY = e.clientY - sumButtonDragOffset.y;
      
      // 限制按钮在视窗内
      const maxX = window.innerWidth - 70; // 按钮宽度约70px
      const maxY = window.innerHeight - 50; // 按钮高度约50px
      
      setSumButtonPosition({
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
    } else if (isTabContainerDragging) {
      // 拖动Tab容器
      const newX = e.clientX - tabContainerDragOffset.x;
      const newY = e.clientY - tabContainerDragOffset.y;
      
      // 限制在视窗内
      const maxX = window.innerWidth - 300; // Tab容器宽度约300px
      const maxY = window.innerHeight - 60; // Tab容器高度约60px
      
      setTabContainerPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsSumButtonDragging(false);
    setIsHiddenIconDragging(false);
    setIsSliderDragging(false);
    setIsSelectorDragging(false);
    setIsButtonDragging(false);
    setIsTabContainerDragging(false);
  };

  // 添加全局事件监听
  useEffect(() => {
    if (isDragging || isSumButtonDragging || isHiddenIconDragging || isSliderDragging || isSelectorDragging || isButtonDragging || isTabContainerDragging) {
      document.addEventListener('mousemove', handleMouseMove as unknown as EventListener);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove as unknown as EventListener);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isSumButtonDragging, isHiddenIconDragging, isSliderDragging, isSelectorDragging, isButtonDragging, isTabContainerDragging]);

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
      // 调整三者之间的距离，保持一致
      const buttonY = window.innerHeight - 140; // 切换按钮在底部上方140px
      const hiddenIconY = window.innerHeight - 200; // 滑块隐藏图标在切换按钮上方60px
      const sumButtonY = window.innerHeight - 260; // 南北切换按钮在滑块隐藏图标上方60px，保持三者间距一致

      // 调整显示/隐藏号码选择器按钮的位置，无论窗口放大还是缩小，都保持统一位置
      setFloatingButtonPosition({
        x: window.innerWidth - 90, // 右侧20px，圆心在window.innerWidth - 65px
        y: window.innerHeight - 320 // 南北切换按钮上方60px
      });

      // 调整滑块隐藏图标的位置，无论窗口放大还是缩小，都保持统一位置
      setHiddenIconPosition({
        x: window.innerWidth - 90, // 圆心在window.innerWidth - 65px
        y: hiddenIconY // 始终保持在切换按钮上方
      });

      // 调整南北半球切换按钮的位置，无论窗口放大还是缩小，都保持统一位置
      setSumButtonPosition({
        x: window.innerWidth - 105, // 右侧20px，竖直中心线在window.innerWidth - 65px
        y: sumButtonY // 滑块隐藏图标上方60px，保持三者间距一致
      });
      
      // 调整切换按钮的位置，无论窗口放大还是缩小，都保持统一位置
      setButtonPosition({
        x: window.innerWidth - 105, // 竖直中心线在window.innerWidth - 65px
        y: buttonY // 始终保持在底部上方140px，避免被页脚挡住
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

  // Tab容器拖拽事件处理
  const handleTabContainerMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTabContainerDragging(true);
    setTabContainerDragOffset({
      x: e.clientX - tabContainerPosition.x,
      y: e.clientY - tabContainerPosition.y
    });
  };

  return (
    <>
      {/* 可拖拽的南北半球切换按钮 - 只在能量分析页面显示 */}
      {activeTabKey === '3' && (
        <div style={{
          position: 'fixed',
          left: `${sumButtonPosition.x}px`,
          top: `${sumButtonPosition.y}px`,
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'transparent',
          borderRadius: '4px', // 长方形
          width: '80px', // 更长的长方形
          height: '50px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
          cursor: isSumButtonDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none'
        }}
        onMouseDown={(e) => {
          setIsSumButtonDragging(true);
          setSumButtonDragOffset({
            x: e.clientX - sumButtonPosition.x,
            y: e.clientY - sumButtonPosition.y
          });
        }}
        >
          <div style={{
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: sumMode === 'northern' ? '#1890ff' : '#2fc25b',
            borderRadius: '15px',
            cursor: 'pointer',
            transition: 'background-color 0.3s',
            width: '45px',
            height: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}
          onClick={() => {
            const newMode = sumMode === 'northern' ? 'southern' : 'northern';
            setSumMode(newMode);
          }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'absolute',
              top: '2px',
              left: sumMode === 'northern' ? '2px' : '23px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#fff',
              color: sumMode === 'northern' ? '#1890ff' : '#2fc25b',
              fontWeight: 'bold',
              transition: 'left 0.3s',
              fontSize: '12px',
              zIndex: 1
            }}>
              {sumMode === 'northern' ? '北' : '南'}
            </div>
          </div>
        </div>
      )}
      
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
      
      {/* 滑块区域 - 与Statistics组件保持一致 */}
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
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsHiddenIconDragging(true);
              setHiddenIconDragOffset({
                x: e.clientX - hiddenIconPosition.x,
                y: e.clientY - hiddenIconPosition.y
              });
            }}
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
              width: `${sliderSize.width}px`,
              height: `${sliderSize.height}px`,
              backgroundColor: '#2a2a2a',
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
              padding: '16px',
              zIndex: 999,
              cursor: isSliderDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none',
              overflow: 'auto',
              boxSizing: 'border-box'
            }}
            onMouseDown={handleSliderMouseDown}
            onDoubleClick={handleSliderDoubleClick}
            title="双击隐藏滑块">

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
                        border: '1px solid #ff0000',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        transition: 'all 0.3s',
                        color: '#ff0000',
                        borderColor: '#ff0000',
                        padding: 0,
                        margin: 0,
                        opacity: sliderRange[0] <= 0 ? 0.3 : 1,
                        backgroundColor: 'transparent'
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
                            border: `1px solid ${sliderRange[0] <= 0 ? '#666' : (statisticType === 'red' ? '#f5222d' : '#1890ff')}`,
                            backgroundColor: 'transparent',
                            color: sliderRange[0] <= 0 ? '#999' : (statisticType === 'red' ? '#f5222d' : '#1890ff'),
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
                            backgroundColor: 'transparent',
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
                            backgroundColor: 'transparent',
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
                            backgroundColor: 'transparent',
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
                        opacity: sliderRange[1] >= allRecords.length - 1 ? 0.5 : 1,
                        backgroundColor: 'transparent'
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
                      {/* 简单的背景线，与图片样式一致 */}
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '0px',
                        right: '0px',
                        height: '2px',
                        transform: 'translateY(-50%)',
                        zIndex: -1,
                        background: '#333',
                        borderRadius: '1px'
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
                            background: '#ff0000',
                            height: '2px',
                            borderRadius: '1px',
                            boxShadow: 'none'
                          }
                        ]}
                        handleStyle={[
                          {
                            borderWidth: 2,
                            borderColor: '#0078d4',
                            backgroundColor: 'transparent',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            boxShadow: 'none',
                            cursor: 'pointer',
                            outline: 'none',
                            backgroundImage: 'none'
                          },
                          {
                            borderWidth: 2,
                            borderColor: '#0078d4',
                            backgroundColor: 'transparent',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            boxShadow: 'none',
                            cursor: 'pointer',
                            outline: 'none',
                            backgroundImage: 'none'
                          }
                        ]}
                      />
                    </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* 内容区域，给底部Tab留出空间 */}
      <div style={{ marginBottom: '60px' }}>
        {/* Tab内容显示区域 */}
        {activeTabKey === '1' && renderChartStats()}
        {activeTabKey === '2' && renderOddEvenStats()}
        {activeTabKey === '3' && renderSumStats()}
        {activeTabKey === '4' && renderTaiXuHuanJingStats()}
        {activeTabKey === '5' && renderPredictionStats()}
        {activeTabKey === '6' && renderPositionAnalysis()}
      </div>
      
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
          setStatisticType(statisticType === 'red' ? 'blue' : 'red');
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
          onChange={setActiveTabKey}
          items={[
            {
              key: '4',
              label: (
                <div style={{
                  display: 'inline-block',
                  color: activeTabKey === '4' ? '#1890ff' : '#fff',
                  backgroundColor: 'transparent',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  marginRight: '8px',
                  cursor: 'pointer',
                  transition: 'color 0.3s ease',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: activeTabKey === '4' ? 'bold' : 'normal',
                  userSelect: 'none'
                }}>
                  太虚幻境
                </div>
              ),
              children: null
            },
            {
              key: '2',
              label: (
                <div style={{
                  display: 'inline-block',
                  color: activeTabKey === '2' ? '#1890ff' : '#fff',
                  backgroundColor: 'transparent',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  marginRight: '8px',
                  cursor: 'pointer',
                  transition: 'color 0.3s ease',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: activeTabKey === '2' ? 'bold' : 'normal',
                  userSelect: 'none'
                }}>
                  星球
                </div>
              ),
              children: null
            },
            {
              key: '3',
              label: (
                <div style={{
                  display: 'inline-block',
                  color: activeTabKey === '3' ? '#1890ff' : '#fff',
                  backgroundColor: 'transparent',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  marginRight: '8px',
                  cursor: 'pointer',
                  transition: 'color 0.3s ease',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: activeTabKey === '3' ? 'bold' : 'normal',
                  userSelect: 'none'
                }}>
                  能量分析
                </div>
              ),
              children: null
            },
            {
              key: '1',
              label: (
                <div style={{
                  display: 'inline-block',
                  color: activeTabKey === '1' ? '#1890ff' : '#fff',
                  backgroundColor: 'transparent',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  marginRight: '8px',
                  cursor: 'pointer',
                  transition: 'color 0.3s ease',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: activeTabKey === '1' ? 'bold' : 'normal',
                  userSelect: 'none'
                }}>
                  累计分析
                </div>
              ),
              children: null
            },
            {
              key: '6',
              label: (
                <div style={{
                  display: 'inline-block',
                  color: activeTabKey === '6' ? '#1890ff' : '#fff',
                  backgroundColor: 'transparent',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  marginRight: '8px',
                  cursor: 'pointer',
                  transition: 'color 0.3s ease',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: activeTabKey === '6' ? 'bold' : 'normal',
                  userSelect: 'none'
                }}>
                  位置
                </div>
              ),
              children: null
            },
            {
              key: '5',
              label: (
                <div style={{
                  display: 'inline-block',
                  color: activeTabKey === '5' ? '#1890ff' : '#fff',
                  backgroundColor: 'transparent',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'color 0.3s ease',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: activeTabKey === '5' ? 'bold' : 'normal',
                  userSelect: 'none'
                }}>
                  预测
                </div>
              ),
              children: null
            }
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
      </div>)}
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 1000,
        padding: '0 20px',
        boxSizing: 'border-box'
      }}>
        {/* 图标 - 点击回到幻境页面 */}
        <CloudFilled 
          style={{ fontSize: '24px', color: '#fff', cursor: 'pointer', marginRight: '20px' }} 
          onClick={() => setActiveTabKey('4')}
        />
        {/* 五个Tab名称（菜单）放在图标右侧，顺序：幻境，星球，能量，累计，预测，位置 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '12px'
        }}>
          <div 
            style={{ 
              fontSize: '14px', 
              color: activeTabKey === '4' ? '#1890ff' : '#fff',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontWeight: activeTabKey === '4' ? 'bold' : 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              userSelect: 'none'
            }}
            onClick={() => setActiveTabKey('4')}
          >
            <HarmonyOSOutlined style={{ color: activeTabKey === '4' ? '#1890ff' : '#fff', transition: 'color 0.3s ease' }} /> 幻境
          </div>
          <div 
            style={{ 
              fontSize: '14px', 
              color: activeTabKey === '2' ? '#1890ff' : '#fff',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontWeight: activeTabKey === '2' ? 'bold' : 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              userSelect: 'none'
            }}
            onClick={() => setActiveTabKey('2')}
          >
            <OpenAIOutlined style={{ color: activeTabKey === '2' ? '#1890ff' : '#fff', transition: 'color 0.3s ease' }} /> 星球
          </div>
          <div 
            style={{ 
              fontSize: '14px', 
              color: activeTabKey === '3' ? '#1890ff' : '#fff',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontWeight: activeTabKey === '3' ? 'bold' : 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              userSelect: 'none'
            }}
            onClick={() => setActiveTabKey('3')}
          >
            <LinuxOutlined style={{ color: activeTabKey === '3' ? '#1890ff' : '#fff', transition: 'color 0.3s ease' }} /> 能量
          </div>
          <div 
            style={{ 
              fontSize: '14px', 
              color: activeTabKey === '1' ? '#1890ff' : '#fff',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontWeight: activeTabKey === '1' ? 'bold' : 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              userSelect: 'none'
            }}
            onClick={() => setActiveTabKey('1')}
          >
            <DribbbleOutlined style={{ color: activeTabKey === '1' ? '#1890ff' : '#fff', transition: 'color 0.3s ease' }} /> 累计
          </div>
          <div 
            style={{ 
              fontSize: '14px', 
              color: activeTabKey === '6' ? '#1890ff' : '#fff',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontWeight: activeTabKey === '6' ? 'bold' : 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              userSelect: 'none'
            }}
            onClick={() => setActiveTabKey('6')}
          >
            <ExperimentOutlined style={{ color: activeTabKey === '6' ? '#1890ff' : '#fff', transition: 'color 0.3s ease' }} /> 位置
          </div>
          <div 
            style={{ 
              fontSize: '14px', 
              color: activeTabKey === '5' ? '#1890ff' : '#fff',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontWeight: activeTabKey === '5' ? 'bold' : 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              userSelect: 'none'
            }}
            onClick={() => setActiveTabKey('5')}
          >
            <HeartOutlined style={{ color: activeTabKey === '5' ? '#1890ff' : '#fff', transition: 'color 0.3s ease' }} /> 预测
          </div>
        </div>
      </footer>
    </>
  );
};

export default Analysis;