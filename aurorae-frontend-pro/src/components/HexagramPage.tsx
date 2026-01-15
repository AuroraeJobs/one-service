import React, { useEffect, useState } from 'react';
import { Card, Progress } from 'antd';
import { HEXAGRAMS } from '../constants/hexagrams';
import { useRecordContext } from '../contexts/RecordContext';
import LeftMenu from './LeftMenu';

const HexagramPage: React.FC = () => {
  const { allRecords } = useRecordContext();
  const [hexagramStats, setHexagramStats] = useState<Record<string, number>>({});

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

  // 当RecordContext中的数据变化时，重新计算统计数据
  useEffect(() => {
    const stats = calculateHexagramStats();
    setHexagramStats(stats);
  }, [allRecords]);

  const totalHexagramCount = Object.values(hexagramStats).reduce((sum, count) => sum + count, 0);

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
        <Card
            key={key}
            style={{
              borderRadius: '20px',
              boxShadow: `0 0 20px ${color}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${color}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
              border: `1px solid ${color}50`,
              backgroundColor: '#1A1A1A',
              backgroundImage: `linear-gradient(145deg, #252525, #101010)`,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transformStyle: 'preserve-3d',
              perspective: '1000px',
              transform: 'translateZ(0)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              overflow: 'visible',
              cursor: 'pointer',
              minHeight: '120px'
            }}
            hoverable
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
            {/* 卦名 - 圆形背景效果，类似星球名 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: `${color}22`,
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
            
            {/* 统计数据 - 次数和百分比在同一行 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
              width: '100%'
            }}>
              {/* 左侧：次数 */}
              <div style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#FFFFFF'
              }}>
                {count}
              </div>
              
              {/* 右侧：百分比 */}
              <div style={{
                fontSize: '10px',
                fontWeight: 'bold',
                color: '#888888'
              }}>
                {percentage}%
              </div>
            </div>
            
            {/* 统计数据 - 进度条 */}
            <div style={{ width: '100%' }}>
              <Progress
                percent={percentage}
                strokeColor={color}
                size="default"
                strokeLinecap="round"
                showInfo={false}
                style={{ width: '100%', margin: 0 }}
              />
            </div>
          </Card>
      );
    });
  };

  return (
    <div className="hexagram-page" style={{ 
      minHeight: 'calc(100vh - 64px)', 
      backgroundColor: '#000000',
      color: '#FFFFFF',
      display: 'flex'
    }}>
      {/* 左侧菜单Docker栏 */}
      <LeftMenu />

      {/* 主要内容区域 */}
      <div style={{ flex: 1, marginLeft: '80px', padding: '20px' }}>
        {/* 六十四卦卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '16px', marginBottom: '24px', overflow: 'visible' }}>
          {renderHexagramCards()}
        </div>
      </div>
    </div>
  );
};

export default HexagramPage;