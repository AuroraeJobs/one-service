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

const Analysis: React.FC = () => {
  // 获取当前路由
  const location = useLocation();
  
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
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
  // 奇偶分析数据 - 存储每期的奇偶号码个数
  const [oddEvenData, setOddEvenData] = useState<Array<{ period: number; oddCount: number; evenCount: number }>>([]);

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
            formatter: function(params: any) {
              return params.value + '期';
            }
          },
          endLabel: {
            show: true,
            formatter: function(params: any) {
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

  // 渲染奇偶分析平滑曲线
  const renderOddEvenChart = () => {
    if (oddEvenData.length === 0) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#999',
          backgroundColor: '#fff',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' 
        }}>
          暂无奇偶分析数据
        </div>
      );
    }

    // 处理图表数据，转换为ECharts所需格式
    const periods = oddEvenData.map(item => item.period);
    const oddCounts = oddEvenData.map(item => item.oddCount);
    const evenCounts = oddEvenData.map(item => item.evenCount);
    
    // ECharts配置项
    const option = {
      animation: false, // 关闭初始动画
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        formatter: function(params: any) {
          let result = `${params[0].axisValue}期<br/>`;
          params.forEach((param: any) => {
            result += `${param.marker}${param.seriesName}: ${param.value}个<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: ['奇数个数', '偶数个数'],
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
            formatter: function(params: any) {
              return params.value + '期';
            }
          },
          endLabel: {
            show: true,
            formatter: function(params: any) {
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
          },
          name: '号码个数',
          nameTextStyle: {
            fontSize: 14,
            fontWeight: 'bold'
          }
        }
      ],
      series: [
        {
          name: '奇数个数',
          type: 'line',
          smooth: true,
          data: oddCounts,
          itemStyle: {
            color: '#f5222d'
          },
          lineStyle: {
            width: 3,
            type: 'solid',
            color: '#f5222d'
          },
          symbol: 'circle',
          symbolSize: 6,
          emphasis: {
            focus: 'series',
            scale: true,
            symbolSize: 10,
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
          name: '偶数个数',
          type: 'line',
          smooth: true,
          data: evenCounts,
          itemStyle: {
            color: '#1890ff'
          },
          lineStyle: {
            width: 3,
            type: 'solid',
            color: '#1890ff'
          },
          symbol: 'circle',
          symbolSize: 6,
          emphasis: {
            focus: 'series',
            scale: true,
            symbolSize: 10,
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
          backgroundColor: '#fff',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
          padding: '16px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}
      >
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

  // 渲染奇偶分析
  const renderOddEvenStats = () => {
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
          {renderOddEvenChart()}
        </div>
      </div>
    );
  };

  // 解析记录数据
  const parseRecords = (records: string[]) => {
    // 红球号码统计
    const redBallCount: { [key: string]: number } = {};
    // 蓝球号码统计
    const blueBallCount: { [key: string]: number } = {};

    let totalRedBalls = 0;
    let totalBlueBalls = 0;

    // 解析每条记录
    records.forEach((record) => {
      if (record.length < 14) return;

      // 获取当前记录中的红球和蓝球
      const currentRedBalls: string[] = [];
      for (let i = 0; i < 12; i += 2) {
        currentRedBalls.push(record.substring(i, i + 2));
      }
      const currentBlueBall = record.substring(12, 14);

      // 解析红球：前12位，每两位一个号码
      for (let i = 0; i < 12; i += 2) {
        const redBall = record.substring(i, i + 2);
        redBallCount[redBall] = (redBallCount[redBall] || 0) + 1;
        totalRedBalls++;
      }

      // 解析蓝球：最后两位
      const blueBall = record.substring(12, 14);
      blueBallCount[blueBall] = (blueBallCount[blueBall] || 0) + 1;
      totalBlueBalls++;
    });

    // 更新状态
    setTotalRecords(records.length);
  };

  // 获取记录数据
  useEffect(() => {
    // 防止在StrictMode下运行两次
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchRecords = async () => {
      setLoading(true);
      try {
        const data = await recordApi.getAllRecords();
        
        let recordsToUse: string[];
        if (typeof data === 'string') {
          // 接口返回的是字符串，通过换行符分割成数组
          recordsToUse = data
            .split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0);
          message.success(`成功获取 ${recordsToUse.length} 条记录`);
        } else if (Array.isArray(data) && data.length > 0) {
          // 接口返回的是数组，直接使用
          recordsToUse = data;
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
        // API请求失败时使用模拟数据
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
        message.info(`API请求失败，使用模拟数据，共 ${recordsToUse.length} 条记录`);
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
      let numbers: string[] = [];
      
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
  const [activeTabKey, setActiveTabKey] = useState<string>('1');

  // 当切换到不同tab时，处理相关状态
  useEffect(() => {
    // 当切换到奇偶分析tab时，隐藏号码选择器
    if (activeTabKey !== '1') {
      setShowNumberSelector(false);
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
            title={isSliderHidden ? "显示期号选择滑块" : "隐藏期号选择滑块"}
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
              backgroundColor: '#fff',
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
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
            title="双击隐藏滑块"
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
      
      {/* 标签页 */}
      <Tabs
        activeKey={activeTabKey}
        onChange={setActiveTabKey}
        type="card"
        items={[
          {
            key: '1',
            label: <span style={{ color: statisticType === 'red' ? '#f5222d' : '#1890ff' }}>累计次数</span>,
            children: renderChartStats(),
          },
          {
            key: '2',
            label: <span style={{ color: statisticType === 'red' ? '#f5222d' : '#1890ff' }}>奇偶分析</span>,
            children: renderOddEvenStats(),
          },
        ]}
        style={{ marginTop: '20px' }}
      />
    </div>
  );
};

export default Analysis;