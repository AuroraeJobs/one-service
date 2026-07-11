import React, { useMemo } from 'react';
import { Card } from 'antd';
import ReactECharts from './LotteryLocalizedECharts';
import { HEXAGRAMS } from '../constants/hexagrams';
import { useRecordContext } from '../contexts/RecordContext';

const HexagramPage: React.FC = () => {
  const { allRecords } = useRecordContext();
  
  // 状态管理：控制是否显示放大的图表和存储点击的图表类型
  const [showZoomedCharts, setShowZoomedCharts] = React.useState(false);
  const [clickedChartType, setClickedChartType] = React.useState<'row' | 'column' | null>(null);

  // 从记录中提取红球号码并计算卦象
  const extractHexagramFromRecord = (record: string) => {
    // 假设记录格式为红球号码字符串，前12位为6个红球号码，每个号码两位
    const redBalls = record.slice(0, 12);
    let hexagramKey = '';
    
    // 遍历每个红球号码，转换为0或1
    for (let i = 0; i < 12; i += 2) {
      const ball = parseInt(redBalls.slice(i, i + 2));
      // 奇数为阳爻(1)，偶数为阴爻(0)
      hexagramKey += ball % 2 === 1 ? '1' : '0';
    }
    
    return hexagramKey;
  };

  // 计算六十四卦统计数据
  const calculateHexagramStats = () => {
    if (!allRecords) return {};
    
    const stats: Record<string, number> = {};
    
    // 初始化所有卦象的计数为0
    Object.keys(HEXAGRAMS).forEach(key => {
      stats[key] = 0;
    });
    
    // 处理记录数据
    if (typeof allRecords === 'string') {
      // 如果是字符串，按行分割并处理
      const records = allRecords
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length === 14); // 假设有效记录长度为14
      
      records.forEach(record => {
        const hexagramKey = extractHexagramFromRecord(record);
        if (stats[hexagramKey] !== undefined) {
          stats[hexagramKey]++;
        }
      });
    } else if (Array.isArray(allRecords)) {
      // 如果是数组，直接处理
      const validRecords = allRecords.filter(record => typeof record === 'string' && record.length === 14);
      
      validRecords.forEach(record => {
        const hexagramKey = extractHexagramFromRecord(record);
        if (stats[hexagramKey] !== undefined) {
          stats[hexagramKey]++;
        }
      });
    }
    
    return stats;
  };

  // 计算卦象的阳爻数量和奇偶组合
  const getHexagramCombination = (key: string) => {
    const oddCount = (key.match(/1/g) || []).length;
    const evenCount = 6 - oddCount;
    return `${oddCount}奇${evenCount}偶`;
  };

  // 星球颜色映射
  const planetColors: Record<string, string> = {
    '地球': '#1890ff', // 蓝
    '水星': '#52c41a', // 绿
    '金星': '#faad14', // 黄
    '火星': '#f5222d', // 红
    '木星': '#13c2c2', // 青
    '土星': '#fa8c16', // 橙
    '天王星': '#722ed1'  // 紫
  };

  // 奇偶组合到星球的映射
  const combinationToPlanet: { [key: string]: string } = {
    '0奇6偶': '地球',
    '1奇5偶': '水星',
    '2奇4偶': '金星',
    '3奇3偶': '火星',
    '4奇2偶': '木星',
    '5奇1偶': '土星',
    '6奇0偶': '天王星'
  };

  // 获取卦象对应的颜色
  const getHexagramColor = (key: string) => {
    const combination = getHexagramCombination(key);
    const planet = combinationToPlanet[combination];
    return planet ? planetColors[planet] : '#8b5cf6';
  };

  // 卦名到二进制键的映射（从下到上，初爻到上爻）
  const nameToKey: Record<string, string> = {
    '乾': '111111', '姤': '011111', '同人': '101111', '遁': '001111',
    '履': '110111', '讼': '010111', '无妄': '100111', '否': '000111',
    '小畜': '111011', '巽': '011011', '家人': '101011', '渐': '001011',
    '中孚': '110011', '涣': '010011', '益': '100011', '观': '000011',
    '大有': '111101', '鼎': '011101', '离': '101101', '旅': '001101',
    '睽': '110101', '未济': '010101', '噬嗑': '100101', '晋': '000101',
    '大畜': '111001', '蛊': '011001', '贲': '101001', '艮': '001001',
    '损': '110001', '蒙': '010001', '颐': '100001', '剥': '000001',
    '夬': '111110', '大过': '011110', '革': '101110', '咸': '001110',
    '兑': '110110', '困': '010110', '随': '100110', '萃': '000110',
    '需': '111010', '井': '011010', '既济': '101010', '蹇': '001010',
    '节': '110010', '坎': '010010', '屯': '100010', '比': '000010',
    '大壮': '111100', '恒': '011100', '丰': '101100', '小过': '001100',
    '归妹': '110100', '解': '010100', '震': '100100', '豫': '000100',
    '泰': '111000', '升': '011000', '明夷': '101000', '谦': '001000',
    '临': '110000', '师': '010000', '复': '100000', '坤': '000000'
  };

  // 按照六十四卦速查表的顺序（8x8矩阵，下卦为行，上卦为列）
  // 第四行与第五行互换位置
  const hexagramOrder = [
    // 下卦为乾（第一行）
    '乾', '夬', '大有', '大壮', '小畜', '需', '大畜', '泰',
    // 下卦为兑（第二行）
    '履', '兑', '睽', '归妹', '中孚', '节', '损', '临',
    // 下卦为离（第三行）
    '同人', '革', '离', '丰', '家人', '既济', '贲', '明夷',
    // 下卦为巽（第五行）
    '姤', '大过', '鼎', '恒', '巽', '井', '蛊', '升',
    // 下卦为震（第四行）
    '无妄', '随', '噬嗑', '震', '益', '屯', '颐', '复',
    // 下卦为坎（第六行）
    '讼', '困', '未济', '解', '涣', '坎', '蒙', '师',
    // 下卦为艮（第七行）
    '遁', '咸', '旅', '小过', '渐', '蹇', '艮', '谦',
    // 下卦为坤（第八行）
    '否', '萃', '晋', '豫', '观', '比', '剥', '坤'
  ];

  // 创建8x8矩阵并互换第四列和第五列
  const getAdjustedHexagramOrder = () => {
    const matrix: string[][] = [];
    // 将一维数组转换为8x8矩阵
    for (let i = 0; i < 8; i++) {
      matrix[i] = hexagramOrder.slice(i * 8, (i + 1) * 8);
      // 互换第四列和第五列（索引3和4）
      [matrix[i][3], matrix[i][4]] = [matrix[i][4], matrix[i][3]];
    }
    // 将矩阵转换回一维数组
    return matrix.flat();
  };

  // 使用useMemo缓存统计数据计算结果
  // 注意：在开发模式下，React StrictMode会导致组件渲染两次
  const hexagramStats = useMemo(() => calculateHexagramStats(), [allRecords]);

  const totalHexagramCount = Object.values(hexagramStats).reduce((sum, count) => sum + count, 0);

  // 计算每行八个卦象的合计数据
  const rowTotals = useMemo(() => {
    const adjustedOrder = getAdjustedHexagramOrder();
    const rows: number[] = [];
    
    // 将卦象分成8行，每行8个
    for (let i = 0; i < 8; i++) {
      const start = i * 8;
      const rowHexagrams = adjustedOrder.slice(start, start + 8);
      // 计算每行的合计
      const rowTotal = rowHexagrams.reduce((sum, hexagramName) => {
        const key = nameToKey[hexagramName];
        return sum + (hexagramStats[key] || 0);
      }, 0);
      rows.push(rowTotal);
    }
    
    return rows;
  }, [hexagramStats]);

  // 计算每列八个卦象的合计数据
  const columnTotals = useMemo(() => {
    const adjustedOrder = getAdjustedHexagramOrder();
    const columns: number[] = [];
    
    // 计算每列的合计
    for (let j = 0; j < 8; j++) {
      let columnTotal = 0;
      for (let i = 0; i < 8; i++) {
        const index = i * 8 + j;
        const hexagramName = adjustedOrder[index];
        const key = nameToKey[hexagramName];
        columnTotal += hexagramStats[key] || 0;
      }
      columns.push(columnTotal);
    }
    
    return columns;
  }, [hexagramStats]);

  // 直接使用useMemo创建图表配置，确保数据更新时重新创建配置对象
  const rowChartOption = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params: any) {
          return `行 ${params[0].name}: ${params[0].value}`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        top: '5%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['乾', '兑', '离', '巽', '震', '坎', '艮', '坤'],
        axisLabel: {
          color: '#CCCCCC',
          fontSize: 10
        },
        axisLine: {
          lineStyle: {
            color: '#444444'
          }
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#CCCCCC',
          fontSize: 10
        },
        axisLine: {
          lineStyle: {
            color: '#444444'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#333333'
          }
        }
      },
      series: [
        {
          data: rowTotals,
          type: 'line',
          smooth: true,
          itemStyle: {
            color: '#FF3333'
          },
          lineStyle: {
            width: 4,
            color: '#FF3333'
          },
          symbol: 'circle',
          symbolSize: 8,
          label: {
            show: true,
            position: 'top',
            color: '#FFFFFF',
            fontSize: 10
          }
        }
      ]
    };
  }, [rowTotals]);

  const columnChartOption = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params: any) {
          return `列 ${params[0].name}: ${params[0].value}`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        top: '5%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['乾', '兑', '离', '巽', '震', '坎', '艮', '坤'],
        axisLabel: {
          color: '#CCCCCC',
          fontSize: 10
        },
        axisLine: {
          lineStyle: {
            color: '#444444'
          }
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#CCCCCC',
          fontSize: 10
        },
        axisLine: {
          lineStyle: {
            color: '#444444'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#333333'
          }
        }
      },
      series: [
        {
          data: columnTotals,
          type: 'line',
          smooth: true,
          itemStyle: {
            color: '#3399FF'
          },
          lineStyle: {
            width: 4,
            color: '#3399FF'
          },
          symbol: 'circle',
          symbolSize: 8,
          label: {
            show: true,
            position: 'top',
            color: '#FFFFFF',
            fontSize: 10
          }
        }
      ]
    };
  }, [columnTotals]);

  // 处理图表点击事件
  const handleRowChartClick = () => {
    console.log('Row chart clicked');
    setClickedChartType('row');
    setShowZoomedCharts(true);
  };

  const handleColumnChartClick = () => {
    console.log('Column chart clicked');
    setClickedChartType('column');
    setShowZoomedCharts(true);
  };

  // 计算每行的详细数据（每行八个卦象的具体数据）
  const calculateRowDetails = useMemo(() => {
    const adjustedOrder = getAdjustedHexagramOrder();
    const rowDetails: number[][] = [];
    
    // 将卦象分成8行，每行8个
    for (let i = 0; i < 8; i++) {
      const start = i * 8;
      const rowHexagrams = adjustedOrder.slice(start, start + 8);
      // 计算每行中每个卦象的具体数据
      const rowData = rowHexagrams.map(hexagramName => {
        const key = nameToKey[hexagramName];
        return hexagramStats[key] || 0;
      });
      rowDetails.push(rowData);
    }
    
    return rowDetails;
  }, [hexagramStats]);

  // 计算每列的详细数据（每列八个卦象的具体数据）
  const calculateColumnDetails = useMemo(() => {
    const adjustedOrder = getAdjustedHexagramOrder();
    const columnDetails: number[][] = [];
    
    // 计算每列中每个卦象的具体数据
    for (let j = 0; j < 8; j++) {
      const columnData: number[] = [];
      for (let i = 0; i < 8; i++) {
        const index = i * 8 + j;
        const hexagramName = adjustedOrder[index];
        const key = nameToKey[hexagramName];
        columnData.push(hexagramStats[key] || 0);
      }
      columnDetails.push(columnData);
    }
    
    return columnDetails;
  }, [hexagramStats]);

  // 关闭放大视图
  const handleCloseZoomedCharts = () => {
    setShowZoomedCharts(false);
    setClickedChartType(null);
  };

  // 获取放大显示的图表配置
  const getZoomedChartOption = (data: number[], title: string, color: string, type: 'row' | 'column', index: number) => {
    // 获取调整后的卦象顺序
    const adjustedOrder = getAdjustedHexagramOrder();
    let labels: string[] = [];
    
    if (type === 'row') {
      // 行图表：获取该行对应的8个卦名
      const start = index * 8;
      labels = adjustedOrder.slice(start, start + 8);
    } else {
      // 列图表：获取该列对应的8个卦名
      for (let i = 0; i < 8; i++) {
        const hexagramIndex = i * 8 + index;
        labels.push(adjustedOrder[hexagramIndex]);
      }
    }
    
    // 计算数据总和
    const sum = data.reduce((acc, val) => acc + val, 0);
    
    return {
      backgroundColor: 'transparent',
      title: {
        text: title,
        subtext: `${sum}`,
        textStyle: {
          color: '#FFFFFF',
          fontSize: 12,
          fontWeight: 'normal'
        },
        subtextStyle: {
          color: '#FFFFFF',
          fontSize: 12,
          fontWeight: 'normal'
        },
        left: 'left',
        top: 'center',
        textVerticalAlign: 'middle'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params: any) {
          return `${labels[params[0].dataIndex]}: ${params[0].value}`;
        }
      },
      grid: {
        left: '12%',
        right: '4%',
        top: '10%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          color: '#CCCCCC',
          fontSize: 10
        },
        axisLine: {
          lineStyle: {
            color: '#444444'
          }
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#CCCCCC',
          fontSize: 10
        },
        axisLine: {
          lineStyle: {
            color: '#444444'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#333333'
          }
        }
      },
      series: [
        {
          data: data,
          type: 'line',
          smooth: true,
          itemStyle: {
            color: color
          },
          lineStyle: {
            width: 4
          },
          symbol: 'circle',
          symbolSize: 8,
          label: {
            show: true,
            position: 'top',
            color: '#FFFFFF',
            fontSize: 10
          }
        }
      ]
    };
  };

  // 渲染六十四卦卡片，按照调整后的顺序排列
  const renderHexagramCards = () => {
    const adjustedOrder = getAdjustedHexagramOrder();
    return adjustedOrder.map((hexagramName) => {
      const key = nameToKey[hexagramName];
      const hexagram = HEXAGRAMS[key];
      if (!hexagram) return null;
      
      const color = getHexagramColor(key);
      const count = hexagramStats[key] || 0;
      const percentage = totalHexagramCount > 0 ? Math.round((count / totalHexagramCount) * 100) : 0;
      
      return (
        <div
            key={key}
            style={{
              borderRadius: '20px',
              boxShadow: `0 0 20px ${color}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${color}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
              border: `1px solid ${color}50`,
              backgroundColor: '#1A1A1A',
              backgroundImage: `linear-gradient(145deg, #252525, #101010)`,
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              transformStyle: 'preserve-3d',
              perspective: '1000px',
              transform: 'translateZ(0)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              overflow: 'visible',
              cursor: 'pointer',
              minHeight: '96px',
              width: '100%',
              boxSizing: 'border-box'
            }}
            onMouseEnter={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'translateZ(10px) scale(1.02)';
              card.style.boxShadow = `0 0 25px ${color}80, 0 15px 40px rgba(0, 0, 0, 0.6), inset 0 0 15px ${color}30, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
            }}
            onMouseLeave={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'translateZ(0) scale(1)';
              card.style.boxShadow = `0 0 20px ${color}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${color}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
            }}
          >
            {/* 上方：卦名 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                color: color,
                flexShrink: 0,
                boxShadow: `0 0 12px ${color}80, inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)`,
                border: `1px solid ${color}50`
              }}>
                {hexagram.name}
              </div>
            </div>
            
            {/* 下方：次数 + 百分比 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              minWidth: 0,
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 'bold',
              lineHeight: 1.2,
              whiteSpace: 'nowrap'
            }}>
              {count}次 · {percentage}%
            </div>
          </div>
      );
    });
  };

  return (
    <div className="themed-route-page health-season-page" style={{
      minHeight: '100vh', 
      backgroundColor: '#000000',
      color: '#FFFFFF',
      display: 'flex'
    }}>
      {/* 放大显示的图表模态框 */}
      {showZoomedCharts && clickedChartType && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            zIndex: 10000,
            padding: '60px 20px 20px'
          }}
          onClick={handleCloseZoomedCharts}
        >
          {/* 八个平滑曲线图 */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gridTemplateRows: 'repeat(4, 1fr)',
              rowGap: '5px',
              columnGap: '30px',
              width: '100%',
              maxWidth: '1200px',
              height: '80vh',
              marginLeft: '-15px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 颜色数组 */}
            {(() => {
              const colors = ['#FF3333', '#FF6633', '#FFCC33', '#33CC33', '#3399FF', '#6666FF', '#9933FF', '#FF33CC'];
              const labels = ['乾', '兑', '离', '巽', '震', '坎', '艮', '坤'];
              const details = clickedChartType === 'row' ? calculateRowDetails : calculateColumnDetails;
              
              return details.map((data, index) => (
                <Card 
                  key={index}
                  style={{
                    borderRadius: '12px', 
                    boxShadow: `0 0 15px ${colors[index]}30, 0 8px 20px rgba(0, 0, 0, 0.4), inset 0 0 8px ${colors[index]}10, inset 0 4px 8px rgba(255, 255, 255, 0.1), inset 0 -4px 8px rgba(0, 0, 0, 0.3)`,
                    border: `1px solid ${colors[index]}40`,
                    backgroundColor: '#2D2D2D',
                    backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)',
                    padding: '12px'
                  }}
                  title={null}
                >
                  <ReactECharts 
                    option={getZoomedChartOption(
                      data, 
                      labels[index],
                      colors[index],
                      clickedChartType,
                      index
                    )}
                    style={{ height: '110px', width: '100%' }}
                  />
                </Card>
              ));
            })()}
          </div>
        </div>
      )}
      {/* 主要内容区域 */}
      <div style={{ flex: 1, padding: '20px var(--app-page-inline-padding)' }}>
        {/* 行和列合计数据柱状图 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 435px))',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '24px'
        }}>
          {/* 行合计数据柱状图 */}
          <Card 
            style={{
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(255, 51, 51, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255, 51, 51, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: 'none',
              backgroundColor: '#2D2D2D',
              backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)',
              height: '320px',
              padding: '16px'
            }}
            title={null}
          >
            <div onClick={handleRowChartClick} style={{ cursor: 'pointer' }}>
              <ReactECharts 
                option={rowChartOption}
                style={{ height: '240px', width: '100%' }}
              />
            </div>
          </Card>

          {/* 列合计数据柱状图 */}
          <Card 
            style={{
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(24, 144, 255, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(24, 144, 255, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: 'none',
              backgroundColor: '#2D2D2D',
              backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)',
              height: '320px',
              padding: '16px'
            }}
            title={null}
          >
            <div onClick={handleColumnChartClick} style={{ cursor: 'pointer' }}>
              <ReactECharts 
                option={columnChartOption}
                style={{ height: '240px', width: '100%' }}
              />
            </div>
          </Card>
        </div>

        {/* 六十四卦卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(86px, 110px))', justifyContent: 'center', gap: '10px', marginBottom: '60px', overflow: 'visible' }}>
          {renderHexagramCards()}
        </div>
      </div>
    </div>
  );
};

// 使用React.memo避免不必要的重复渲染
export default React.memo(HexagramPage);
