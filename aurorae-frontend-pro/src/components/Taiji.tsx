import React, { useState, useEffect } from 'react';
import { Typography, Slider } from 'antd';
import { CloudFilled, EyeInvisibleOutlined, EyeOutlined, FastBackwardOutlined, FastForwardOutlined, StepBackwardOutlined, StepForwardOutlined, ClearOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import { HEXAGRAMS } from '../constants/hexagrams';
import { recordApi } from '../services/api';
// 导入 ECharts
import ReactECharts from 'echarts-for-react';

const { Text } = Typography;

const Taiji: React.FC = () => {
  // 状态管理
  const [records, setRecords] = useState<string[]>([]);
  const [allRecords, setAllRecords] = useState<string[]>([]);
  const [blueBallOddEven, setBlueBallOddEven] = useState({ odd: 0, even: 0 });
  const [hexagramStats, setHexagramStats] = useState<Record<string, number>>({});
  // 滑块相关状态
  const [sliderRange, setSliderRange] = useState<[number, number]>([0, 0]);
  // 悬浮滑块相关状态
  const [isSliderHidden, setIsSliderHidden] = useState(true);
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  const [sliderPosition, setSliderPosition] = useState({
    x: window.innerWidth - 370, // 靠右，预留边距
    y: window.innerHeight - 350 // 靠底部，避免被页脚遮挡
  });
  const [sliderDragOffset, setSliderDragOffset] = useState({ x: 0, y: 0 });
  // 菜单状态管理
  const [activeMenu, setActiveMenu] = useState<string>('太极'); // 当前激活的菜单：太极或太空
  // 当前选中的奇偶组合 - 支持多选
  const [selectedCombinations, setSelectedCombinations] = useState<string[]>([]);
  
  // 奇偶组合到原始组合的映射
  const combinationToOriginalMap: { [key: string]: string[] } = {
    // 蓝球组合
    '太阳': ['1奇0偶'], // 蓝球奇数
    '月亮': ['0奇1偶'], // 蓝球偶数
    // 红球组合
    '地球': ['0奇6偶'], // 0奇6偶
    '水星': ['1奇5偶'], // 1奇5偶
    '金星': ['2奇4偶'], // 2奇4偶
    '火星': ['3奇3偶'], // 3奇3偶
    '木星': ['4奇2偶'], // 4奇2偶
    '土星': ['5奇1偶'], // 5奇1偶
    '天王星': ['6奇0偶'] // 6奇0偶
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

  // 解析记录数据
  const parseRecords = (recordsData: string[]) => {
    let blueOdd = 0;
    let blueEven = 0;
    const hexagramCount: Record<string, number> = {};

    recordsData.forEach(record => {
      if (record.length < 14) return;

      // 解析蓝球：最后两位
      const blueBall = record.substring(12, 14);
      const blueNum = parseInt(blueBall);
      if (blueNum % 2 === 0) {
        blueEven++;
      } else {
        blueOdd++;
      }

      // 解析红球：前12位，每两位一个号码
      const redBalls: number[] = [];
      for (let i = 0; i < 12; i += 2) {
        const redBall = record.substring(i, i + 2);
        redBalls.push(parseInt(redBall));
      }

      // 生成卦象：红色球的六个号码奇偶形依次对应每个卦从下往上的一爻
      // 奇数为阳爻(1)，偶数为阴爻(0)
      const hexagramCode = redBalls.map(num => num % 2 === 1 ? '1' : '0').join('');
      hexagramCount[hexagramCode] = (hexagramCount[hexagramCode] || 0) + 1;
    });

    setBlueBallOddEven({ odd: blueOdd, even: blueEven });
    setHexagramStats(hexagramCount);
  };

  // 处理滑块变化
  const handleSliderChange = (value: number[]) => {
    const range = value as [number, number];
    setSliderRange(range);
    // 从所有记录中获取选中范围的记录
    let selectedRecords = allRecords.slice(range[0], range[1] + 1);
    // 应用组合过滤
    if (selectedCombinations.length > 0) {
      selectedRecords = filterRecordsByCombination(selectedRecords, selectedCombinations);
    }
    // 更新records状态为选中范围的记录
    setRecords(selectedRecords);
    // 重新解析数据
    parseRecords(selectedRecords);
  };
  
  // 根据选中的组合过滤记录 - 支持多选
  const filterRecordsByCombination = (records: string[], combinations: string[]): string[] => {
    if (!combinations || combinations.length === 0) {
      return records;
    }
    
    return records.filter(record => {
      if (record.length < 14) return false;
      
      // 解析蓝球
      const blueBall = record.substring(12, 14);
      const blueNum = parseInt(blueBall);
      const isBlueOdd = blueNum % 2 === 1;
      const blueCombination = isBlueOdd ? '1奇0偶' : '0奇1偶';
      
      // 解析红球
      const redBalls: number[] = [];
      for (let i = 0; i < 12; i += 2) {
        const redBall = record.substring(i, i + 2);
        redBalls.push(parseInt(redBall));
      }
      const redOddCount = redBalls.filter(num => num % 2 === 1).length;
      const redEvenCount = redBalls.length - redOddCount;
      const redCombination = `${redOddCount}奇${redEvenCount}偶`;
      
      // 检查记录是否匹配任何选中的组合
      return combinations.some(combination => {
        if (!combinationToOriginalMap[combination]) {
          return false;
        }
        
        const originalCombinations = combinationToOriginalMap[combination];
        
        if (combination === '太阳' || combination === '月亮') {
          // 蓝球组合检查
          return originalCombinations.includes(blueCombination);
        } else {
          // 红球组合检查
          return originalCombinations.includes(redCombination);
        }
      });
    });
  };

  // 悬浮滑块拖动事件处理
  const handleSliderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // 防止默认行为，提高拖动流畅性
    setIsSliderDragging(true);
    setSliderDragOffset({
      x: e.clientX - sliderPosition.x,
      y: e.clientY - sliderPosition.y
    });
  };

  const handleSliderMouseMove = (e: MouseEvent) => {
    if (!isSliderDragging) return;
    e.preventDefault(); // 防止默认行为，提高拖动流畅性
    setSliderPosition({
      x: e.clientX - sliderDragOffset.x,
      y: e.clientY - sliderDragOffset.y
    });
  };

  const handleSliderMouseUp = () => {
    setIsSliderDragging(false);
  };

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (isSliderDragging) {
      window.addEventListener('mousemove', handleSliderMouseMove);
      window.addEventListener('mouseup', handleSliderMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleSliderMouseMove);
      window.removeEventListener('mouseup', handleSliderMouseUp);
    };
  }, [isSliderDragging, sliderDragOffset]);

  // 切换滑块显示/隐藏
  const toggleSliderVisibility = () => {
    setIsSliderHidden(!isSliderHidden);
  };

  // 获取记录数据
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const data = await recordApi.getAllRecords();
        let recordsToUse: string[];
        
        if (typeof data === 'string') {
          // 接口返回的是字符串，通过换行符分割成数组
          recordsToUse = data
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        } else if (Array.isArray(data) && data.length > 0) {
          // 接口返回的是数组，直接使用
          recordsToUse = data;
        } else {
          // 使用模拟数据
          recordsToUse = mockRecords;
        }
        
        // 保存所有记录到allRecords状态
        setAllRecords(recordsToUse);
        // 设置初始滑块范围为全部记录
        const initialRange: [number, number] = [0, Math.max(0, recordsToUse.length - 1)];
        setSliderRange(initialRange);
        
        // 应用组合过滤
        let filteredRecords = recordsToUse;
        if (selectedCombinations.length > 0) {
          filteredRecords = filterRecordsByCombination(filteredRecords, selectedCombinations);
        }
        setRecords(filteredRecords);
        parseRecords(filteredRecords);
      } catch (error) {
        console.error('获取记录失败:', error);
        // 使用模拟数据
        // 保存模拟数据到allRecords状态
        setAllRecords(mockRecords);
        // 设置初始滑块范围为模拟数据范围
        const initialRange: [number, number] = [0, Math.max(0, mockRecords.length - 1)];
        setSliderRange(initialRange);
        
        // 应用组合过滤
        let filteredRecords = mockRecords;
        if (selectedCombinations.length > 0) {
          filteredRecords = filterRecordsByCombination(filteredRecords, selectedCombinations);
        }
        setRecords(filteredRecords);
        parseRecords(filteredRecords);
      }
    };

    fetchRecords();
  }, [selectedCombinations]);

  // 渲染太极图
  const renderTaiji = () => (
    <div 
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        background: 'transparent',
        margin: '20px auto',
        transition: 'transform 0.3s ease',
        boxShadow: 'none'
      } as React.CSSProperties}
    >
      <div 
        style={{
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'linear-gradient(to bottom, #ffffff 0%, #ffffff 50%, #000000 50%, #000000 100%)',
          position: 'relative',
          boxShadow: '0 0 20px rgba(100, 100, 255, 0.2)'
        } as React.CSSProperties}
      >
        <div style={{
          width: '75px',
          height: '75px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at center, #000000 0%, #000000 25%, #ffffff 25%, #ffffff 100%)',
          position: 'absolute',
          top: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
        }} />
        <div style={{
          width: '75px',
          height: '75px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at center, #ffffff 0%, #ffffff 25%, #000000 25%, #000000 100%)',
          position: 'absolute',
          bottom: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
        }} />
      </div>
    </div>
  );

  // 渲染两仪卡片（仅用于太极演变）
  const renderLiangyiCards = () => {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', gap: '80px', margin: '30px 0' }}>
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.3s ease',
            background: 'radial-gradient(circle at center, rgba(60, 60, 100, 0.8) 0%, rgba(40, 40, 80, 0.8) 50%, rgba(30, 30, 60, 0.9) 100%)',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2), 0 0 30px rgba(100, 100, 255, 0.1)',
            height: '240px',
            width: '180px',
            position: 'relative',
            border: '1px solid rgba(79, 70, 229, 0.3)'
          } as React.CSSProperties}
        >
          {/* 左上角文字 */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#e2e8f0'
          }}>
            阴
          </div>
          
          {/* 右下角文字 */}
          <div style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#e2e8f0'
          }}>
            阴
          </div>
          
          <div style={{
            width: '120px',
            height: '120px',
            backgroundColor: '#000000',
            borderRadius: '50%',
            position: 'relative',
            boxShadow: '0 0 20px rgba(100, 100, 255, 0.2)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#ffffff',
              borderRadius: '50%',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 15px rgba(255, 255, 255, 0.4)'
            }} />
          </div>
        </div>
        
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.3s ease',
            background: 'radial-gradient(circle at center, rgba(60, 60, 100, 0.8) 0%, rgba(40, 40, 80, 0.8) 50%, rgba(30, 30, 60, 0.9) 100%)',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2), 0 0 30px rgba(100, 100, 255, 0.1)',
            height: '240px',
            width: '180px',
            position: 'relative',
            border: '1px solid rgba(79, 70, 229, 0.3)'
          } as React.CSSProperties}
        >
          {/* 左上角文字 */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#e2e8f0'
          }}>
            阳
          </div>
          
          {/* 右下角文字 */}
          <div style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#e2e8f0'
          }}>
            阳
          </div>
          
          <div style={{
            width: '120px',
            height: '120px',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            border: '2px solid #000000',
            position: 'relative',
            boxShadow: '0 0 20px rgba(100, 100, 255, 0.2)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#000000',
              borderRadius: '50%',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 15px rgba(0, 0, 0, 0.4)'
            }} />
          </div>
        </div>
      </div>
    );
  };



  // 渲染卡片式卦象
  const renderGuaCard = (name: string, yao: boolean[], size: 'small' | 'medium' | 'large' | 'xlarge' = 'medium', count?: number) => {
    const cardSize = {
      small: { width: '120px', height: '80px', padding: '15px', fontSize: '12px' }, // 统一宽度为120px
      medium: { width: '120px', height: '100px', padding: '20px', fontSize: '14px' }, // 统一宽度为120px
      large: { width: '120px', height: '180px', padding: '30px', fontSize: '14px' }, // 更高的八卦卡片，统一宽度
      xlarge: { width: '120px', height: '200px', padding: '28px', fontSize: '14px' } // 增大六十四卦卡片高度，统一宽度
    }[size];
    
    // 解析卦名：分离主名称和括号内的符号
    const nameMatch = name.match(/^(.+)\s*\(([^)]+)\)$/);
    const mainName = nameMatch ? nameMatch[1] : name;
    const bracketName = nameMatch ? nameMatch[2] : name;
    
    return (
      <div 
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: cardSize.padding,
          border: '1px solid rgba(79, 70, 229, 0.3)',
          borderRadius: '8px',
          transition: 'all 0.3s ease',
          background: 'radial-gradient(circle at center, rgba(60, 60, 100, 0.8) 0%, rgba(40, 40, 80, 0.8) 50%, rgba(30, 30, 60, 0.9) 100%)',
          width: cardSize.width,
          height: cardSize.height,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), 0 0 20px rgba(100, 100, 255, 0.1)',
          cursor: 'pointer',
          position: 'relative'
        } as React.CSSProperties}
      >
        {/* 左上角卦名：不显示括号部分 */}
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          fontSize: cardSize.fontSize,
          fontWeight: 'bold',
          color: '#e2e8f0'
        }}>
          {mainName}
        </div>
        
        {/* 右下角卦名：只显示括号里的部分 */}
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          fontSize: cardSize.fontSize,
          fontWeight: 'bold',
          color: '#e2e8f0'
        }}>
          {bracketName}
        </div>
        
        {/* 居中卦象 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* 反转数组后渲染，实现从下往上排列每一爻 */}
          {/* 数组顺序：[下爻, 中爻, 上爻] → 反转后：[上爻, 中爻, 下爻] → 渲染顺序：下爻 → 中爻 → 上爻 */}
          {yao.slice().reverse().map((isYang, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'center' }}>
              {renderYao(isYang, yao.length)}
            </div>
          ))}
        </div>
        
        {/* 计数信息（如果有的话） */}
        {count !== undefined && (
          <div style={{ 
            position: 'absolute',
            bottom: cardSize.padding,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            backgroundColor: 'rgba(30, 30, 60, 0.8)',
            padding: '6px 12px',
            borderRadius: '4px',
            width: '80%',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}>
            <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#60a5fa' }}>{count}</Text>
          </div>
        )}
      </div>
    );
  };

  // 渲染四象
  const renderSixiang = () => {
    // 四象由两爻组成：[下爻, 上爻]，true为阳，false为阴
    // 正确卦象：
    // 太阴：☷ 下阴、上阴
    // 少阴：☳ 下阴、上阳
    // 少阳：☴ 下阳、上阴
    // 太阳：☰ 下阳、上阳
    const sixiangElements = [
      { type: 'taiyin', name: '太阴', yao: [false, false] }, // 下阴、上阴
      { type: 'shaoyin', name: '少阴', yao: [false, true] }, // 下阴、上阳
      { type: 'shaoyang', name: '少阳', yao: [true, false] }, // 下阳、上阴
      { type: 'taiyang', name: '太阳', yao: [true, true] }   // 下阳、上阳
    ];

    return (
      <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', margin: '30px 0' }}>
        {sixiangElements.map((element) => (
          <div key={element.type}>
            {renderGuaCard(element.name, element.yao, 'large')}
          </div>
        ))}
      </div>
    );
  };

  // 渲染单个爻（阳爻或阴爻）
  const renderYao = (isYang: boolean, yaoCount?: number) => {
    // 根据爻数量区分不同类型的卦象，设置不同的margin
    // 四象(2爻)和八卦(3爻)使用较大间距，六十四卦(6爻)使用较小间距
    const margin = yaoCount === 6 ? '2px 0' : '3px 0';
    
    if (isYang) {
      // 阳爻：整个黑色按钮，细长设计
      return (
        <div style={{
          width: '60px',
          height: '10px',
          backgroundColor: '#000000',
          borderRadius: '4px',
          margin: margin
        }} />
      );
    } else {
      // 阴爻：中间透明两边黑色，细长设计，更短的透明区域
      return (
        <div style={{
          width: '60px',
          height: '10px',
          backgroundColor: 'transparent',
          borderRadius: '4px',
          margin: margin,
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          {/* 左侧黑色部分 */}
          <div style={{
            width: '26px',
            height: '100%',
            backgroundColor: '#000000',
            borderRadius: '4px 0 0 4px'
          }} />
          
          {/* 右侧黑色部分 */}
          <div style={{
            width: '26px',
            height: '100%',
            backgroundColor: '#000000',
            borderRadius: '0 4px 4px 0'
          }} />
        </div>
      );
    }
  };

  // 渲染八卦
  const renderBagua = () => {
    // 按照要求的顺序：乾、兑、离、震、巽、坎、艮、坤
    // 二进制表示：type字符串顺序：[上爻, 中爻, 下爻]，转换为yao数组时变为[下爻, 中爻, 上爻]
    // true为阳，false为阴
    const baguaElements = [
      { type: '111', name: '天 (乾)', yao: [true, true, true] }, // 天(乾)：下阳、中阳、上阳
      { type: '011', name: '泽 (兑)', yao: [true, true, false] }, // 泽(兑)：下阳、中阳、上阴
      { type: '101', name: '火 (离)', yao: [true, false, true] }, // 火(离)：下阳、中阴、上阳
      { type: '001', name: '雷 (震)', yao: [true, false, false] }, // 雷(震)：下阳、中阴、上阴
      { type: '110', name: '风 (巽)', yao: [false, true, true] }, // 风(巽)：下阴、中阳、上阳
      { type: '010', name: '水 (坎)', yao: [false, true, false] }, // 水(坎)：下阴、中阳、上阴
      { type: '100', name: '山 (艮)', yao: [false, false, true] }, // 山(艮)：下阴、中阴、上阳
      { type: '000', name: '地 (坤)', yao: [false, false, false] }  // 地(坤)：下阴、中阴、上阴
    ];

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '30px', margin: '30px auto', maxWidth: '1200px' }}>
        {baguaElements.map((element) => (
          <div key={element.type}>
            {renderGuaCard(element.name, element.yao, 'large')}
          </div>
        ))}
      </div>
    );
  };

  // 将符号转换为爻数组（true为阳，false为阴）
  // hexagramCode的顺序是：下爻、中爻、上爻（从左到右）
  // 直接从hexagramCode生成yao数组，顺序：下爻、中爻、上爻
  const hexagramCodeToYaoArray = (code: string): boolean[] => {
    return code.split('').map(bit => bit === '1');
  };

  // 渲染卦象统计图表（柱状图）
  const renderHexagramChart = () => {
    // 转换hexagramStats为图表所需格式
    const hexagramCountData = Object.entries(hexagramStats).map(([key, count]) => {
      const hexagram = HEXAGRAMS[key];
      return {
        hexagram: hexagram ? hexagram.name : key,
        count: count
      };
    })
    .filter(item => item.count > 0) // 只显示出现过的卦
    .sort((a, b) => b.count - a.count); // 按出现次数从大到小排序

    if (hexagramCountData.length === 0) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#94a3b8',
          backgroundColor: 'rgba(30, 30, 60, 0.8)',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), 0 0 20px rgba(100, 100, 255, 0.1)',
          border: '1px solid rgba(79, 70, 229, 0.3)'
        }}>
          暂无卦象数据
        </div>
      );
    }

    // 计算最后一期中奖号码对应的卦象
    let lastHexagramName = '';
    if (records.length > 0) {
      // 获取最后一条记录
      const lastRecord = records[records.length - 1];
      if (lastRecord && lastRecord.length >= 12) {
        // 解析红球：前12位，每两位一个号码
        const lastRedBalls: number[] = [];
        for (let i = 0; i < 12; i += 2) {
          const redBall = lastRecord.substring(i, i + 2);
          lastRedBalls.push(parseInt(redBall));
        }
        
        // 生成卦象编码
        const hexagramCode = lastRedBalls.map(num => num % 2 === 1 ? '1' : '0').join('');
        
        // 获取卦象对象
        const hexagram = HEXAGRAMS[hexagramCode as keyof typeof HEXAGRAMS] || { name: '坤' };
        lastHexagramName = hexagram.name;
      }
    }

    // ECharts配置项
    const option = {
      animation: false, // 关闭初始动画
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: 'rgba(96, 165, 250, 0.2)'
          }
        },
        formatter: function(params: Array<{ axisValue: string; marker: string; seriesName: string; value: number }>) {
          let result = `${params[0].axisValue}<br/>`;
          params.forEach((param) => {
            result += `${param.marker}${param.seriesName}: ${param.value}次<br/>`;
          });
          return result;
        },
        backgroundColor: 'rgba(30, 30, 60, 0.9)',
        borderColor: 'rgba(96, 165, 250, 0.5)',
        borderWidth: 1,
        textStyle: {
          color: '#e2e8f0'
        }
      },
      legend: {
        show: false // 隐藏图例
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%', // 进一步减小底部空间，减少下方空白
        top: '8%',
        containLabel: true,
        backgroundColor: 'transparent'
      },
      xAxis: [
        {
          type: 'category',
          data: hexagramCountData.map(item => item.hexagram),
          axisLabel: {
            fontSize: 11,
            rotate: 45, // 旋转标签，避免重叠
            interval: 0, // 显示所有标签
            color: '#94a3b8'
          },
          axisLine: {
            lineStyle: {
              color: '#475569'
            }
          },
          axisTick: {
            lineStyle: {
              color: '#475569'
            }
          },
          splitLine: {
            show: false
          },
          name: '卦象',
          nameTextStyle: {
            fontSize: 12,
            fontWeight: 'bold',
            color: '#94a3b8'
          },
          nameLocation: 'middle',
          nameGap: 25 // 调整名称与坐标轴的距离
        }
      ],
      yAxis: [
        {
          type: 'value',
          axisLabel: {
            fontSize: 12,
            color: '#94a3b8'
          },
          axisLine: {
            lineStyle: {
              color: '#475569'
            }
          },
          axisTick: {
            lineStyle: {
              color: '#475569'
            }
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: '#334155',
              type: 'dashed'
            }
          },
          name: '出现次数',
          nameTextStyle: {
            fontSize: 14,
            fontWeight: 'bold',
            color: '#94a3b8'
          }
        }
      ],
      series: [
        {
          name: '出现次数',
          type: 'bar',
          data: hexagramCountData.map(item => item.count),
          itemStyle: {
            borderRadius: 8,
            color: function(params: { dataIndex: number }) {
              // 将最后一期中奖号码对应的卦象柱状图改为亮蓝色
              const currentHexagram = hexagramCountData[params.dataIndex].hexagram;
              return currentHexagram === lastHexagramName ? '#60a5fa' : '#8b5cf6';
            }
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 20,
              shadowColor: function(params: { dataIndex: number }) {
                const currentHexagram = hexagramCountData[params.dataIndex].hexagram;
                return currentHexagram === lastHexagramName ? 'rgba(96, 165, 250, 0.6)' : 'rgba(139, 92, 246, 0.6)';
              }
            }
          },
          label: {
            show: true,
            position: 'top',
            fontSize: 10,
            color: '#e2e8f0'
          }
        }
      ]
    };

    return (
      <div 
        style={{ 
          backgroundColor: 'transparent',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 60px rgba(100, 100, 255, 0.1)',
          padding: '20px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          marginTop: '10px',
          marginBottom: '40px',
          backdropFilter: 'blur(5px)'
        }}
      >
        {/* 图表标题 */}

        {/* 图表容器 */}
        <div 
          style={{ 
            height: '400px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            background: 'transparent'
          }}
        >
          <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>
    );
  };

  // 渲染阴阳统计图表（饼状图）
  const renderYinYangPieChart = () => {
    // 计算蓝球总次数
    const totalBlueBalls = blueBallOddEven.odd + blueBallOddEven.even;
    
    if (totalBlueBalls === 0) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#94a3b8',
          backgroundColor: 'rgba(30, 30, 60, 0.8)',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), 0 0 20px rgba(100, 100, 255, 0.1)',
          border: '1px solid rgba(79, 70, 229, 0.3)'
        }}>
          暂无阴阳数据
        </div>
      );
    }

    // 处理饼状图数据 - 按数值从小到大排序
    const pieData = [
      { name: '阴', value: blueBallOddEven.odd },
      { name: '阳', value: blueBallOddEven.even }
    ].sort((a, b) => a.value - b.value);
    
    // ECharts配置项
    const option = {
      animation: false, // 关闭初始动画
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: 'rgba(30, 30, 60, 0.9)',
        borderColor: 'rgba(96, 165, 250, 0.5)',
        borderWidth: 1,
        textStyle: {
          color: '#e2e8f0'
        }
      },
      legend: {
        orient: 'horizontal',
        top: '5%',
        left: 'center',
        data: pieData.map(item => item.name),
        textStyle: {
          fontSize: 14,
          color: '#94a3b8'
        },
        itemWidth: 15,
        itemHeight: 15,
        itemGap: 20
      },
      series: [
        {
          name: '阴阳出现次数',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '55%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 15,
            borderColor: 'rgba(30, 30, 60, 0.8)',
            borderWidth: 3,
            color: function(params: { dataIndex: number }) {
              // 阴：星空紫，阳：星空蓝
              return params.dataIndex === 0 ? '#8b5cf6' : '#60a5fa';
            },
            shadowBlur: 20,
            shadowColor: function(params: { dataIndex: number }) {
              return params.dataIndex === 0 ? 'rgba(139, 92, 246, 0.5)' : 'rgba(96, 165, 250, 0.5)';
            }
          },
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}\n{c}',
            fontSize: 14,
            fontWeight: 'bold',
            color: '#cbd5e1'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 18,
              fontWeight: 'bold',
              formatter: '{b}: {c} ({d}%)',
              color: '#e2e8f0'
            },
            itemStyle: {
              shadowBlur: 30,
              shadowColor: function(params: { dataIndex: number }) {
                return params.dataIndex === 0 ? 'rgba(139, 92, 246, 0.8)' : 'rgba(96, 165, 250, 0.8)';
              }
            }
          },
          labelLine: {
            show: true,
            length: 20,
            length2: 10,
            lineStyle: {
              color: '#64748b'
            }
          },
          data: pieData
        }
      ]
    };

    return (
      <div 
        style={{ 
          backgroundColor: 'transparent',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 60px rgba(100, 100, 255, 0.1)',
          padding: '20px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          backdropFilter: 'blur(5px)'
        }}
      >
        {/* 图表标题 */}

        {/* 图表容器 */}
        <div 
          style={{ 
            height: '500px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            background: 'transparent'
          }}
        >
          <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>
    );
  };

  // 渲染卦象统计图表（饼状图）
  const renderHexagramPieChart = () => {
    // 转换hexagramStats为图表所需格式
    const hexagramCountData = Object.entries(hexagramStats).map(([key, count]) => {
      const hexagram = HEXAGRAMS[key];
      return {
        hexagram: hexagram ? hexagram.name : key,
        count: count
      };
    })
    .filter(item => item.count > 0); // 只显示出现过的卦

    if (hexagramCountData.length === 0) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#94a3b8',
          backgroundColor: 'rgba(30, 30, 60, 0.8)',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), 0 0 20px rgba(100, 100, 255, 0.1)',
          border: '1px solid rgba(79, 70, 229, 0.3)'
        }}>
          暂无卦象数据
        </div>
      );
    }

    // 处理饼状图数据 - 按数值从小到大排序
    const pieData = hexagramCountData.map(item => ({
      name: item.hexagram,
      value: item.count
    })).sort((a, b) => a.value - b.value);
    
    // ECharts配置项
    const option = {
      animation: false, // 关闭初始动画
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: 'rgba(30, 30, 60, 0.9)',
        borderColor: 'rgba(96, 165, 250, 0.5)',
        borderWidth: 1,
        textStyle: {
          color: '#e2e8f0'
        }
      },
      legend: {
        orient: 'horizontal',
        top: '5%',
        left: 'center',
        data: pieData.map(item => item.name),
        type: 'scroll',
        textStyle: {
          fontSize: 12,
          color: '#94a3b8'
        },
        itemWidth: 15,
        itemHeight: 15,
        maxWidth: 500,
        pageIconSize: 12,
        pageTextStyle: {
          fontSize: 10,
          color: '#64748b'
        },
        pageIconColor: '#64748b',
        pageIconInactiveColor: '#334155',
        itemGap: 15
      },
      series: [
        {
          name: '卦象出现次数',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '55%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 15,
            borderColor: 'rgba(30, 30, 60, 0.8)',
            borderWidth: 3,
            color: function(params: { dataIndex: number }) {
              // 使用渐变紫色和蓝色系列
              const colors = ['#8b5cf6', '#60a5fa', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#14b8a6', '#f43f5e'];
              return colors[params.dataIndex % colors.length];
            },
            shadowBlur: 15,
            shadowColor: 'rgba(139, 92, 246, 0.4)'
          },
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}\n{c}',
            fontSize: 12,
            fontWeight: 'normal',
            color: '#cbd5e1'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
              formatter: '{b}: {c} ({d}%)',
              color: '#e2e8f0'
            },
            itemStyle: {
              shadowBlur: 30,
              shadowColor: 'rgba(139, 92, 246, 0.6)'
            }
          },
          labelLine: {
            show: true,
            length: 20,
            length2: 10,
            lineStyle: {
              color: '#64748b'
            }
          },
          data: pieData
        }
      ]
    };

    return (
      <div 
        style={{ 
          backgroundColor: 'transparent',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 60px rgba(100, 100, 255, 0.1)',
          padding: '20px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          backdropFilter: 'blur(5px)'
        }}
      >
        {/* 图表标题 */}

        {/* 图表容器 */}
        <div 
          style={{ 
            height: '500px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            background: 'transparent'
          }}
        >
          <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>
    );
  };

  // 渲染六十四卦统计网格（科技梦幻风格）
  const renderStatsTable = () => {
    // 卦名到二进制键的映射（从下到上，初爻到上爻）
    // 阳爻为1，阴爻为0
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
    const hexagramOrder = [
      // 下卦为乾（第一行）
      '乾', '夬', '大有', '大壮', '小畜', '需', '大畜', '泰',
      // 下卦为兑（第二行）
      '履', '兑', '睽', '归妹', '中孚', '节', '损', '临',
      // 下卦为离（第三行）
      '同人', '革', '离', '丰', '家人', '既济', '贲', '明夷',
      // 下卦为震（第四行）
      '无妄', '随', '噬嗑', '震', '益', '屯', '颐', '复',
      // 下卦为巽（第五行）
      '姤', '大过', '鼎', '恒', '巽', '井', '蛊', '升',
      // 下卦为坎（第六行）
      '讼', '困', '未济', '解', '涣', '坎', '蒙', '师',
      // 下卦为艮（第七行）
      '遁', '咸', '旅', '小过', '渐', '蹇', '艮', '谦',
      // 下卦为坤（第八行）
      '否', '萃', '晋', '豫', '观', '比', '剥', '坤'
    ];

    // 将卦名数组转换为8x8矩阵
    const hexagramMatrix: string[][] = [];
    for (let i = 0; i < 8; i++) {
      hexagramMatrix[i] = hexagramOrder.slice(i * 8, (i + 1) * 8);
    }

    // 计算行总和和列总和
    const rowSums: number[] = [];
    const colSums: number[] = [];
    let total = 0;

    // 初始化行总和和列总和数组
    for (let i = 0; i < 8; i++) {
      rowSums[i] = 0;
      colSums[i] = 0;
    }

    // 计算行总和和列总和
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const hexagramName = hexagramMatrix[row][col];
        const key = nameToKey[hexagramName];
        const count = hexagramStats[key] || 0;
        rowSums[row] += count;
        colSums[col] += count;
        total += count;
      }
    }

    // 获取最后一期对应的卦象
    let lastHexagramKey = '';
    if (records.length > 0) {
      const lastRecord = records[records.length - 1];
      if (lastRecord && lastRecord.length >= 12) {
        // 解析红球：前12位，每两位一个号码
        const lastRedBalls: number[] = [];
        for (let i = 0; i < 12; i += 2) {
          const redBall = lastRecord.substring(i, i + 2);
          lastRedBalls.push(parseInt(redBall));
        }
        
        // 生成卦象编码
        lastHexagramKey = lastRedBalls.map(num => num % 2 === 1 ? '1' : '0').join('');
      }
    }

    // 计算最大计数，只执行一次
    const maxCount = Math.max(...Object.values(hexagramStats), 1);

    // 计算数值对应的颜色强度
    const getCountColor = (count: number) => {
      if (count === 0) return '#64748b';
      const intensity = Math.min(1, count / maxCount);
      
      // 星空蓝到亮蓝的渐变
      const r = Math.floor(100 + intensity * 155);
      const g = Math.floor(120 + intensity * 135);
      const b = Math.floor(200 + intensity * 55);
      return `rgb(${r}, ${g}, ${b})`;
    };

    // 计算数值对应的发光效果
    const getGlowEffect = (count: number) => {
      if (count === 0) return 'none';
      const intensity = Math.min(1, count / maxCount);
      const color = getCountColor(count);
      return `0 0 ${10 + intensity * 15}px ${color}40`;
    };

    return (
        <div style={{
          overflowX: 'auto',
          width: '100%',
          boxSizing: 'border-box',
          margin: 0,
          padding: 0
        }}>
          {/* 八卦行标题 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            {/* 左上角空白 */}
                <div style={{
                  width: '150px',
                  height: '60px',
                  marginRight: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box'
                }} />
            
            {/* 上卦列标题 */}
                {['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'].map((baguaName) => (
                  <div key={`col-header-${baguaName}`} style={{
                    width: '150px',
                    height: '60px',
                    marginRight: '10px',
                    padding: '0 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(79, 70, 229, 0.2)',
                    borderRadius: '12px',
                    transform: 'none',
                    color: '#c7d2fe',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.15)',
                    border: '1px solid rgba(79, 70, 229, 0.4)',
                    boxSizing: 'border-box'
                  }}>
                    {baguaName}
                  </div>
                ))}
                
                {/* 行小计标题 */}
                <div style={{
                  width: '150px',
                  height: '60px',
                  marginRight: '10px',
                  padding: '0 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  borderRadius: '12px',
                  transform: 'none',
                  color: '#93c5fd',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  boxSizing: 'border-box'
                }}>
                  小计
                </div>
          </div>

          {/* 六十四卦网格 */}
          {hexagramMatrix.map((row, rowIndex) => {
            const baguaNames = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];
            return (
              <div key={`row-${rowIndex}`} style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px',
                transition: 'all 0.3s ease'
              }}>
                {/* 下卦行标题 */}
                <div style={{
                  width: '150px',
                  height: '60px',
                  marginRight: '10px',
                  padding: '0 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(139, 92, 246, 0.2)',
                  borderRadius: '12px',
                  color: '#d8b4fe',
                  fontSize: '14px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  boxSizing: 'border-box'
                }}>
                  {baguaNames[rowIndex]}
                </div>

                {/* 卦象单元格 */}
                {row.map((hexagramName, colIndex) => {
                  const key = nameToKey[hexagramName];
                  const count = hexagramStats[key] || 0;
                  const isLastHexagram = key === lastHexagramKey;
                  
                  return (
                    <div key={`hex-${rowIndex}-${colIndex}`} style={{
                      width: '150px',
                      height: '60px',
                      marginRight: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isLastHexagram ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.5), rgba(139, 92, 246, 0.5))' : 'rgba(30, 30, 60, 0.8)',
                      borderRadius: '12px',
                      transform: 'none',
                      color: '#e2e8f0',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      border: isLastHexagram ? '2px solid #60a5fa' : '1px solid rgba(79, 70, 229, 0.3)',
                      boxShadow: isLastHexagram ? 
                        `0 0 30px rgba(96, 165, 250, 0.8), 0 4px 16px rgba(0, 0, 0, 0.3), ${getGlowEffect(count)}` : 
                        `0 2px 6px rgba(0, 0, 0, 0.15), ${getGlowEffect(count)}`,
                      position: 'relative',
                      padding: '0 20px',
                      textShadow: isLastHexagram ? '0 0 10px rgba(255, 255, 255, 0.5)' : 'none',
                      boxSizing: 'border-box'
                    }}>
                      
                      {/* 卦名 - 左侧 */}
                      <div style={{
                        color: '#cbd5e1',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}>
                        {hexagramName}
                      </div>
                      
                      {/* 统计数字 - 右侧 */}
                      <div style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: getCountColor(count),
                        textShadow: `0 0 8px ${getCountColor(count)}80`
                      }}>
                        {count}
                      </div>
                    </div>
                  );
                })}

                {/* 行小计 */}
                <div style={{ 
                  width: '150px',
                  height: '60px',
                  marginRight: '10px',
                  padding: '0 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  borderRadius: '12px',
                  transform: 'none',
                  color: '#93c5fd',
                  fontSize: '18px',
                  fontWeight: '700',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  borderTop: '2px solid rgba(59, 130, 246, 0.6)',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)',
                  textShadow: '0 0 8px rgba(147, 197, 253, 0.4)',
                  boxSizing: 'border-box'
                }}>
                  {rowSums[rowIndex]}
                </div>
              </div>
            );
          })}

          {/* 列总和行 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '12px',
            transition: 'all 0.3s ease',
            flexWrap: 'nowrap'
          }}>
            {/* 列小计标题 */}
            <div style={{
              width: '150px',
              height: '60px',
              marginRight: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(139, 92, 246, 0.3)',
              borderRadius: '12px',
              transform: 'none',
              color: '#d8b4fe',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.5)',
              borderLeft: '2px solid rgba(139, 92, 246, 0.6)',
              boxSizing: 'border-box'
            }}>
              小计
            </div>

            {/* 列小计值 */}
            {colSums.map((sum, index) => (
              <div key={`col-sum-${index}`} style={{
                width: '150px',
                height: '60px',
                marginRight: '10px',
                padding: '0 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                borderRadius: '12px',
                transform: 'none',
                color: '#a5b4fc',
                fontSize: '18px',
                fontWeight: '700',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderLeft: '2px solid rgba(139, 92, 246, 0.6)',
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.15)',
                textShadow: '0 0 8px rgba(165, 180, 252, 0.5)',
                boxSizing: 'border-box'
              }}>
                {sum}
              </div>
            ))}

            {/* 总计 */}
            <div style={{
              width: '150px',
              height: '60px',
              marginRight: '10px',
              padding: '0 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(139, 92, 246, 0.4)',
              borderRadius: '12px',
              transform: 'none',
              color: '#d8b4fe',
              fontSize: '22px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              border: '1px solid rgba(139, 92, 246, 0.6)',
              borderLeft: '2px solid rgba(139, 92, 246, 0.6)',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
              textShadow: '0 0 12px rgba(216, 180, 254, 0.6)',
              boxSizing: 'border-box'
            }}>
              {total}
            </div>
          </div>
        </div>
    );
  };

  // 渲染六十四卦卡片（仅用于太极演变）
  const renderLiushisiCards = () => {
    // 卦名到二进制键的映射（从下到上，初爻到上爻）
    // 阳爻为1，阴爻为0
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
    const hexagramOrder = [
      // 下卦为乾（第一行）
      '乾', '夬', '大有', '大壮', '小畜', '需', '大畜', '泰',
      // 下卦为兑（第二行）
      '履', '兑', '睽', '归妹', '中孚', '节', '损', '临',
      // 下卦为离（第三行）
      '同人', '革', '离', '丰', '家人', '既济', '贲', '明夷',
      // 下卦为震（第四行）
      '无妄', '随', '噬嗑', '震', '益', '屯', '颐', '复',
      // 下卦为巽（第五行）
      '姤', '大过', '鼎', '恒', '巽', '井', '蛊', '升',
      // 下卦为坎（第六行）
      '讼', '困', '未济', '解', '涣', '坎', '蒙', '师',
      // 下卦为艮（第七行）
      '遁', '咸', '旅', '小过', '渐', '蹇', '艮', '谦',
      // 下卦为坤（第八行）
      '否', '萃', '晋', '豫', '观', '比', '剥', '坤'
    ].map(name => nameToKey[name]); // 转换为二进制键

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, minmax(120px, 1fr))',
        gap: '20px',
        maxWidth: '1200px',
        margin: '30px auto 0 auto',
        overflowX: 'auto',
        padding: '0 40px',
        justifyItems: 'center',
        alignItems: 'center'
      }}>
        {hexagramOrder.map((key) => {
          const hexagram = HEXAGRAMS[key];
          if (!hexagram) return null;
          
          const yaoArray = hexagramCodeToYaoArray(key);
          
          return (
            <div key={key}>
              {renderGuaCard(hexagram.name, yaoArray, 'xlarge')}
            </div>
          );
        })}
      </div>
    );
  };

  // 渲染演化层级
  const renderEvolutionLevel = (_title: string, content: React.ReactNode, _level: number) => {
    // 直接返回内容，移除容器和标题
    return content;
  };

  // 渲染统计概览卡片（科技梦幻风格）
  const renderCloudCard = () => {
    // 计算卦象统计数据
    const totalHexagrams = Object.keys(hexagramStats).length;
    const totalCount = Object.values(hexagramStats).reduce((sum, count) => sum + count, 0);
    const avgCount = totalHexagrams > 0 ? (totalCount / totalHexagrams).toFixed(2) : '0';
    
    // 找出出现次数最多和最少的卦象
    let maxHexagram = { name: '', count: 0 };
    let minHexagram = { name: '', count: Infinity };
    
    Object.entries(hexagramStats).forEach(([key, count]) => {
      const hexagram = HEXAGRAMS[key];
      if (hexagram) {
        if (count > maxHexagram.count) {
          maxHexagram = { name: hexagram.name, count };
        }
        if (count < minHexagram.count) {
          minHexagram = { name: hexagram.name, count };
        }
      }
    });
    
    // 处理没有数据的情况
    if (minHexagram.count === Infinity) {
      minHexagram = { name: '无', count: 0 };
    }
    
    // 卡片样式配置
    const cardStyle = {
      backgroundColor: 'transparent',
      borderRadius: '8px',
      padding: '16px',
      minWidth: '140px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      transition: 'all 0.2s ease',
      cursor: 'pointer'
    };
    
    // 卡片悬停效果
    // 卡片数据配置
    const cardData = [
      {
        title: '总卦象数',
        value: totalHexagrams,
        color: '#667eea',
        glowColor: 'rgba(102, 126, 234, 0.4)'
      },
      {
        title: '总出现次数',
        value: totalCount,
        color: '#f093fb',
        glowColor: 'rgba(240, 147, 251, 0.4)'
      },
      {
        title: '平均出现次数',
        value: avgCount,
        color: '#4facfe',
        glowColor: 'rgba(79, 172, 254, 0.4)'
      },
      {
        title: '出现最多的卦象',
        value: maxHexagram.name,
        subValue: `${maxHexagram.count}次`,
        color: '#fa709a',
        glowColor: 'rgba(250, 112, 154, 0.4)'
      },
      {
        title: '出现最少的卦象',
        value: minHexagram.name,
        subValue: `${minHexagram.count}次`,
        color: '#fee140',
        glowColor: 'rgba(254, 225, 64, 0.4)'
      },
      {
        title: '未出现的卦象数',
        value: 64 - totalHexagrams,
        color: '#43e97b',
        glowColor: 'rgba(67, 233, 123, 0.4)'
      }
    ];
    
    return (
      <div style={{
        margin: '0 0 30px 0',
        padding: '10px 0 0 0',
        borderRadius: '16px',
        backgroundColor: 'transparent',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 60px rgba(100, 100, 255, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        {/* 统计卡片网格标题 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '15px',
          padding: '0 20px'
        }}>
          <Text style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#e2e8f0',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>六十四卦统计概览</Text>
        </div>
        
        {/* 统计卡片网格 */}
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          overflowX: 'auto',
          maxWidth: '100%',
          margin: '0 auto',
          padding: '0 0 10px 0',
          flexWrap: 'nowrap'
        }}>
          {cardData.map((card, index) => (
            <div 
              key={index}
              style={cardStyle}
            >
              {/* 卡片标题 - 小字 */}
              <div style={{
                fontSize: '12px',
                color: '#e2e8f0',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                {card.title}
              </div>
              
              {/* 卡片主要数值 */}
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: card.color,
                textAlign: 'center',
                marginBottom: card.subValue ? '8px' : '0',
                textShadow: `0 0 15px ${card.glowColor}`
              }}>
                {card.value}
              </div>
              
              {/* 卡片次要数值（如果有） */}
              {card.subValue && (
                <div style={{
                  fontSize: '16px',
                  color: card.color,
                  opacity: 0.8,
                  textAlign: 'center',
                  textShadow: `0 0 10px ${card.glowColor}`
                }}>
                  {card.subValue}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染统计数据部分
  const renderStatsContent = () => {
    return (
      <>
        {/* 云形卡片 - 六十四卦统计概览 */}
        {renderCloudCard()}
        
        {/* 卦象统计表格 */}
        {renderStatsTable()}
        
        {/* 卦象统计柱状图 */}
        {renderHexagramChart()}
        
        {/* 并排显示卦象饼状图和阴阳饼状图 */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '10px', flexWrap: 'wrap' }}>
          {/* 卦象统计饼状图 */}
          <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
            {renderHexagramPieChart()}
          </div>
          {/* 阴阳统计饼状图 */}
          <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
            {renderYinYangPieChart()}
          </div>
        </div>
      </>
    );
  };

  // 渲染太极演变部分
  const renderTaijiEvolution = () => {
    return (
      <>
        {/* 六十四卦层级 - 红色球卦象统计 */}
        {renderEvolutionLevel('', renderLiushisiCards(), 0)}
        
        {/* 八卦层级 */}
        {renderEvolutionLevel('', renderBagua(), 1)}
        
        {/* 四象层级 */}
        {renderEvolutionLevel('', renderSixiang(), 2)}
        
        {/* 两仪层级 - 蓝色球奇偶统计 */}
        {renderEvolutionLevel('', renderLiangyiCards(), 3)}
        
        {/* 太极层级 */}
        {renderEvolutionLevel('', renderTaiji(), 4)}
      </>
    );
  };

  return (
    <>
      {/* 悬浮滑块控制 - 仅在太空菜单显示 */}
      {activeMenu === '太空' && !isSliderHidden && (
        <div
          style={{
            position: 'fixed',
            left: `${sliderPosition.x}px`,
            top: `${sliderPosition.y}px`,
            backgroundColor: 'transparent',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            cursor: isSliderDragging ? 'grabbing' : 'grab',
            zIndex: 1000,
            transition: isSliderDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(10px)',
            userSelect: 'none', // 禁止用户选择文本
            touchAction: 'none', // 禁止触摸设备上的默认行为
            willChange: 'left, top' // 告知浏览器元素将要发生变化，优化性能
          }}
          onMouseDown={handleSliderMouseDown}
        >
          {/* 奇偶组合选择按钮组 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* 第一排：蓝球奇偶组合（太阳和月亮） */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {/* 太阳：蓝球奇数 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCombinations(prev => {
                    if (prev.includes('太阳')) {
                      // 如果已选中，则取消选中
                      return prev.filter(item => item !== '太阳');
                    } else {
                      // 如果未选中，则添加到选中列表
                      return [...prev, '太阳'];
                    }
                  });
                }}
                style={{
                  width: '80px',
                  height: '36px',
                  borderRadius: '18px',
                  border: `2px solid #f5222d`,
                  backgroundColor: selectedCombinations.includes('太阳') ? '#f5222d' : '#fff',
                  color: selectedCombinations.includes('太阳') ? '#fff' : '#333',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedCombinations.includes('太阳') ? '0 0 8px rgba(245, 34, 45, 0.6)' : 'none'
                }}
              >
                太阳
              </button>
              {/* 月亮：蓝球偶数 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCombinations(prev => {
                    if (prev.includes('月亮')) {
                      // 如果已选中，则取消选中
                      return prev.filter(item => item !== '月亮');
                    } else {
                      // 如果未选中，则添加到选中列表
                      return [...prev, '月亮'];
                    }
                  });
                }}
                style={{
                  width: '80px',
                  height: '36px',
                  borderRadius: '18px',
                  border: `2px solid #722ed1`,
                  backgroundColor: selectedCombinations.includes('月亮') ? '#722ed1' : '#fff',
                  color: selectedCombinations.includes('月亮') ? '#fff' : '#333',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedCombinations.includes('月亮') ? '0 0 8px rgba(114, 46, 209, 0.6)' : 'none'
                }}
              >
                月球
              </button>
            </div>
            
            {/* 第二排：红球奇偶组合（七大行星） */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {/* 地球：0奇6偶 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCombinations(prev => {
                    if (prev.includes('地球')) {
                      // 如果已选中，则取消选中
                      return prev.filter(item => item !== '地球');
                    } else {
                      // 如果未选中，则添加到选中列表
                      return [...prev, '地球'];
                    }
                  });
                }}
                style={{
                  width: '80px',
                  height: '36px',
                  borderRadius: '18px',
                  border: `2px solid #1890ff`,
                  backgroundColor: selectedCombinations.includes('地球') ? '#1890ff' : '#fff',
                  color: selectedCombinations.includes('地球') ? '#fff' : '#333',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedCombinations.includes('地球') ? '0 0 8px rgba(24, 144, 255, 0.6)' : 'none'
                }}
              >
                地球
              </button>
              {/* 水星：1奇5偶 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCombinations(prev => {
                    if (prev.includes('水星')) {
                      // 如果已选中，则取消选中
                      return prev.filter(item => item !== '水星');
                    } else {
                      // 如果未选中，则添加到选中列表
                      return [...prev, '水星'];
                    }
                  });
                }}
                style={{
                  width: '80px',
                  height: '36px',
                  borderRadius: '18px',
                  border: `2px solid #52c41a`,
                  backgroundColor: selectedCombinations.includes('水星') ? '#52c41a' : '#fff',
                  color: selectedCombinations.includes('水星') ? '#fff' : '#333',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedCombinations.includes('水星') ? '0 0 8px rgba(82, 196, 26, 0.6)' : 'none'
                }}
              >
                水星
              </button>
              {/* 金星：2奇4偶 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCombinations(prev => {
                    if (prev.includes('金星')) {
                      // 如果已选中，则取消选中
                      return prev.filter(item => item !== '金星');
                    } else {
                      // 如果未选中，则添加到选中列表
                      return [...prev, '金星'];
                    }
                  });
                }}
                style={{
                  width: '80px',
                  height: '36px',
                  borderRadius: '18px',
                  border: `2px solid #faad14`,
                  backgroundColor: selectedCombinations.includes('金星') ? '#faad14' : '#fff',
                  color: selectedCombinations.includes('金星') ? '#fff' : '#333',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedCombinations.includes('金星') ? '0 0 8px rgba(250, 173, 20, 0.6)' : 'none'
                }}
              >
                金星
              </button>
              {/* 火星：3奇3偶 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCombinations(prev => {
                    if (prev.includes('火星')) {
                      // 如果已选中，则取消选中
                      return prev.filter(item => item !== '火星');
                    } else {
                      // 如果未选中，则添加到选中列表
                      return [...prev, '火星'];
                    }
                  });
                }}
                style={{
                  width: '80px',
                  height: '36px',
                  borderRadius: '18px',
                  border: `2px solid #f5222d`,
                  backgroundColor: selectedCombinations.includes('火星') ? '#f5222d' : '#fff',
                  color: selectedCombinations.includes('火星') ? '#fff' : '#333',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedCombinations.includes('火星') ? '0 0 8px rgba(245, 34, 45, 0.6)' : 'none'
                }}
              >
                火星
              </button>
              {/* 木星：4奇2偶 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCombinations(prev => {
                    if (prev.includes('木星')) {
                      // 如果已选中，则取消选中
                      return prev.filter(item => item !== '木星');
                    } else {
                      // 如果未选中，则添加到选中列表
                      return [...prev, '木星'];
                    }
                  });
                }}
                style={{
                  width: '80px',
                  height: '36px',
                  borderRadius: '18px',
                  border: `2px solid #13c2c2`,
                  backgroundColor: selectedCombinations.includes('木星') ? '#13c2c2' : '#fff',
                  color: selectedCombinations.includes('木星') ? '#fff' : '#333',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedCombinations.includes('木星') ? '0 0 8px rgba(19, 194, 194, 0.6)' : 'none'
                }}
              >
                木星
              </button>
              {/* 土星：5奇1偶 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCombinations(prev => {
                    if (prev.includes('土星')) {
                      // 如果已选中，则取消选中
                      return prev.filter(item => item !== '土星');
                    } else {
                      // 如果未选中，则添加到选中列表
                      return [...prev, '土星'];
                    }
                  });
                }}
                style={{
                  width: '80px',
                  height: '36px',
                  borderRadius: '18px',
                  border: `2px solid #fa8c16`,
                  backgroundColor: selectedCombinations.includes('土星') ? '#fa8c16' : '#fff',
                  color: selectedCombinations.includes('土星') ? '#fff' : '#333',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedCombinations.includes('土星') ? '0 0 8px rgba(250, 140, 22, 0.6)' : 'none'
                }}
              >
                土星
              </button>
              {/* 天王星：6奇0偶 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCombinations(prev => {
                    if (prev.includes('天王星')) {
                      // 如果已选中，则取消选中
                      return prev.filter(item => item !== '天王星');
                    } else {
                      // 如果未选中，则添加到选中列表
                      return [...prev, '天王星'];
                    }
                  });
                }}
                style={{
                  width: '80px',
                  height: '36px',
                  borderRadius: '18px',
                  border: `2px solid #722ed1`,
                  backgroundColor: selectedCombinations.includes('天王星') ? '#722ed1' : '#fff',
                  color: selectedCombinations.includes('天王星') ? '#fff' : '#333',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedCombinations.includes('天王星') ? '0 0 8px rgba(114, 46, 209, 0.6)' : 'none'
                }}
              >
                天王星
              </button>
            </div>
          </div>
          {/* 滑块控制按钮 */}
          <div style={{ 
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {/* 第一期按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                // 保持结束期号不变，只把开始期号重置为第一期
                const newRange: [number, number] = [0, sliderRange[1]];
                setSliderRange(newRange);
                const selectedRecords = allRecords.slice(newRange[0], newRange[1] + 1);
                setRecords(selectedRecords);
                parseRecords(selectedRecords);
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid #1890ff',
                backgroundColor: '#fff',
                color: '#1890ff',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxSizing: 'border-box',
                padding: 0,
                margin: 0,
                transition: 'all 0.3s ease'
              }}
              title="第一期"
            >
              <FastBackwardOutlined style={{ fontSize: '14px' }} />
            </button>
            
            {/* 左端减1按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (sliderRange[0] > 0) {
                  const newRange: [number, number] = [sliderRange[0] - 1, sliderRange[1]];
                  setSliderRange(newRange);
                  const selectedRecords = allRecords.slice(newRange[0], newRange[1] + 1);
                  setRecords(selectedRecords);
                  parseRecords(selectedRecords);
                }
              }}
              disabled={sliderRange[0] <= 0}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: `1px solid ${sliderRange[0] <= 0 ? '#d9d9d9' : '#1890ff'}`,
                backgroundColor: '#fff',
                color: sliderRange[0] <= 0 ? '#d9d9d9' : '#1890ff',
                cursor: sliderRange[0] <= 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxSizing: 'border-box',
                padding: 0,
                margin: 0,
                opacity: sliderRange[0] <= 0 ? 0.5 : 1,
                transition: 'all 0.3s ease'
              }}
              title="左端减1期"
            >
              <StepBackwardOutlined style={{ fontSize: '14px' }} />
            </button>
            
            {/* 左端加1按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (sliderRange[0] < sliderRange[1]) {
                  const newRange: [number, number] = [sliderRange[0] + 1, sliderRange[1]];
                  setSliderRange(newRange);
                  const selectedRecords = allRecords.slice(newRange[0], newRange[1] + 1);
                  setRecords(selectedRecords);
                  parseRecords(selectedRecords);
                }
              }}
              disabled={sliderRange[0] >= sliderRange[1]}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: `1px solid ${sliderRange[0] >= sliderRange[1] ? '#d9d9d9' : '#1890ff'}`,
                backgroundColor: '#fff',
                color: sliderRange[0] >= sliderRange[1] ? '#d9d9d9' : '#1890ff',
                cursor: sliderRange[0] >= sliderRange[1] ? 'not-allowed' : 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxSizing: 'border-box',
                padding: 0,
                margin: 0,
                opacity: sliderRange[0] >= sliderRange[1] ? 0.5 : 1,
                transition: 'all 0.3s ease'
              }}
              title="左端加1期"
            >
              <StepForwardOutlined style={{ fontSize: '14px' }} />
            </button>
            
            {/* 右端减1按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (sliderRange[1] > sliderRange[0]) {
                  const newRange: [number, number] = [sliderRange[0], sliderRange[1] - 1];
                  setSliderRange(newRange);
                  const selectedRecords = allRecords.slice(newRange[0], newRange[1] + 1);
                  setRecords(selectedRecords);
                  parseRecords(selectedRecords);
                }
              }}
              disabled={sliderRange[1] <= sliderRange[0]}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: `1px solid ${sliderRange[1] <= sliderRange[0] ? '#d9d9d9' : '#1890ff'}`,
                backgroundColor: '#fff',
                color: sliderRange[1] <= sliderRange[0] ? '#d9d9d9' : '#1890ff',
                cursor: sliderRange[1] <= sliderRange[0] ? 'not-allowed' : 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxSizing: 'border-box',
                padding: 0,
                margin: 0,
                opacity: sliderRange[1] <= sliderRange[0] ? 0.5 : 1,
                transition: 'all 0.3s ease'
              }}
              title="右端减1期"
            >
              <StepBackwardOutlined style={{ fontSize: '14px' }} />
            </button>
            
            {/* 右端加1按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (sliderRange[1] < allRecords.length - 1) {
                  const newRange: [number, number] = [sliderRange[0], sliderRange[1] + 1];
                  setSliderRange(newRange);
                  const selectedRecords = allRecords.slice(newRange[0], newRange[1] + 1);
                  setRecords(selectedRecords);
                  parseRecords(selectedRecords);
                }
              }}
              disabled={sliderRange[1] >= allRecords.length - 1}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: `1px solid ${sliderRange[1] >= allRecords.length - 1 ? '#d9d9d9' : '#1890ff'}`,
                backgroundColor: '#fff',
                color: sliderRange[1] >= allRecords.length - 1 ? '#d9d9d9' : '#1890ff',
                cursor: sliderRange[1] >= allRecords.length - 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxSizing: 'border-box',
                padding: 0,
                margin: 0,
                opacity: sliderRange[1] >= allRecords.length - 1 ? 0.5 : 1,
                transition: 'all 0.3s ease'
              }}
              title="右端加1期"
            >
              <StepForwardOutlined style={{ fontSize: '14px' }} />
            </button>
            
            {/* 最后一期按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                // 保持开始期号不变，只把结束期号重置为最后一期
                const newRange: [number, number] = [sliderRange[0], allRecords.length - 1];
                setSliderRange(newRange);
                const selectedRecords = allRecords.slice(newRange[0], newRange[1] + 1);
                setRecords(selectedRecords);
                parseRecords(selectedRecords);
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid #1890ff',
                backgroundColor: '#fff',
                color: '#1890ff',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxSizing: 'border-box',
                padding: 0,
                margin: 0,
                transition: 'all 0.3s ease'
              }}
              title="最后一期"
            >
              <FastForwardOutlined style={{ fontSize: '14px' }} />
            </button>
          </div>
          
          {/* 滑块容器 */}
          <div style={{ 
            width: '100%',
            minWidth: '300px',
            position: 'relative'
          }}>
            {/* 背景线 */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '0',
              right: '0',
              height: '4px',
              transform: 'translateY(-50%)',
              zIndex: -1,
              background: 'linear-gradient(90deg, #e0e0e0 0%, #f0f0f0 100%)',
              borderRadius: '2px',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)'
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
                margin: 0
              }}
            />
          </div>
          
          {/* 清除所选按钮 - 右上角下方 */}
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              position: 'absolute',
              top: '60px',
              right: '10px',
              zIndex: 1001
            }}
            onClick={(e) => {
              e.stopPropagation(); // 防止触发滑块拖动
              setSelectedCombinations([]); // 清除所有选中的组合
            }}
          >
            <ClearOutlined style={{ fontSize: '18px', color: '#666' }} />
          </div>
          
          {/* 隐藏图标按钮 - 右上角 */}
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 1001
            }}
            onClick={(e) => {
              e.stopPropagation(); // 防止触发滑块拖动
              toggleSliderVisibility();
            }}
          >
            <EyeInvisibleOutlined style={{ fontSize: '18px', color: '#666' }} />
          </div>
        </div>
      )}
      
      {/* 悬浮显示/隐藏按钮 - 仅在太空菜单显示 */}
      {activeMenu === '太空' && isSliderHidden && (
        <div
          style={{
            position: 'fixed',
            right: '20px',
            bottom: '80px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            transition: 'all 0.3s ease'
          }}
          onClick={toggleSliderVisibility}
        >
          <EyeOutlined style={{ fontSize: '24px', color: '#666' }} />
        </div>
      )}
      
      {/* 根据当前菜单显示不同内容 */}
      {activeMenu === '太极' ? (
        renderTaijiEvolution()
      ) : (
        renderStatsContent()
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
        backgroundColor: '#000',
        color: '#e2e8f0',
        zIndex: 1000,
        padding: '0 20px',
        boxSizing: 'border-box'
      }}>
        {/* 图标 - 点击回到首页 */}
        <CloudFilled 
          style={{ fontSize: '24px', color: '#e2e8f0', cursor: 'pointer', marginRight: '20px' }} 
        />
        {/* 功能菜单 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '20px'
        }}>
          <div 
            style={{ 
              fontSize: '14px', 
              color: '#fff',
              cursor: 'pointer',
              fontWeight: activeMenu === '太极' ? 'bold' : 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            onClick={() => setActiveMenu('太极')}
          >
            <SunOutlined style={{ color: '#fff' }} /> 太极
          </div>
          <div 
            style={{ 
              fontSize: '14px', 
              color: '#fff',
              cursor: 'pointer',
              fontWeight: activeMenu === '太空' ? 'bold' : 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            onClick={() => setActiveMenu('太空')}
          >
            <MoonOutlined style={{ color: '#fff' }} /> 太空
          </div>
        </div>
      </footer>
    </>
  );
};

export default Taiji;