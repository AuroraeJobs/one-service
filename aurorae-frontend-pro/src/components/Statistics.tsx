import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Statistic, Progress, Spin, Tabs, Slider, message, Tooltip } from 'antd';
import {
  BarChartOutlined,
  PieChartOutlined,
  NumberOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
  FastBackwardOutlined,
  FastForwardOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  AreaChartOutlined
} from '@ant-design/icons';
import { recordApi } from '../services/api';

// 定义数据接口
interface AnalysisResult {
  [key: string]: {
    count: number;
    percent: number;
  };
}

// 移除未使用的TabPane声明

const Statistics: React.FC = () => {
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

    // 解析每条记录
    records.forEach(record => {
      if (record.length < 14) return;

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

    // 处理红球频率结果
    const redBallResult: AnalysisResult = {};
    for (const [key, value] of Object.entries(redBallCount)) {
      redBallResult[key] = {
        count: value,
        percent: calculatePercent(value, totalRedBalls)
      };
    }

    // 处理蓝球频率结果
    const blueBallResult: AnalysisResult = {};
    for (const [key, value] of Object.entries(blueBallCount)) {
      blueBallResult[key] = {
        count: value,
        percent: calculatePercent(value, totalBlueBalls)
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

    // 更新状态
    setTotalRecords(records.length);
    setRedBallFrequency(redBallResult);
    setBlueBallFrequency(blueBallResult);
    setRedBallOddEven(redOddEvenResult);
    setRedBallSize(redSizeResult);
    setBlueBallOddEven(blueOddEvenResult);
    setBlueBallSize(blueSizeResult);
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
        const initialRange: [number, number] = [0, recordsToUse.length - 1];
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

    // 根据当前统计类型设置颜色
    const currentColor = statisticType === 'red' ? '#f5222d' : '#1890ff';

    return (
      <Row gutter={[16, 16]}>
        {sortedData.map((item, index) => {
          // 检查当前号码是否在结束行中奖号码中
          const isWinningNumber = endLineNumbers.includes(item.name);
          
          return (
            <Col xs={24} sm={12} md={8} lg={6} xl={4} key={index}>
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
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>出现次数</span>
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

    // 根据当前统计类型设置颜色
    const currentColor = statisticType === 'red' ? '#f5222d' : '#1890ff';

    return (
      <Row gutter={[16, 16]}>
        {distributionData.map((item, index) => {
          // 生成tooltip内容
          const tooltipContent = () => {
            if (item.name === '小号') {
              return statisticType === 'red' ? '红球小号范围：1-16' : '蓝球小号范围：1-8';
            } else if (item.name === '大号') {
              return statisticType === 'red' ? '红球大号范围：17-33' : '蓝球大号范围：9-16';
            }
            return '';
          };
          
          // 如果是大小号，添加问号和tooltip
          const isSize = item.name === '小号' || item.name === '大号';
          
          return (
              <Col xs={24} sm={24} md={12} lg={12} xl={8} key={index}>
                <Card 
                  title={isSize ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
                      <span>{item.name}</span>
                      <Tooltip title={tooltipContent()} placement="top">
                      <InfoCircleOutlined style={{ 
                        cursor: 'default', 
                        color: '#999', 
                        fontSize: '12px',
                        marginLeft: '4px',
                        marginTop: '-2px'
                      }} />
                    </Tooltip>
                    </div>
                  ) : item.name} 
                  variant="outlined"
                  size="small"
                  style={{ minWidth: '150px', height: '120px' }}
                >
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px',
                  height: '70px',
                  justifyContent: 'center'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    whiteSpace: 'nowrap' 
                  }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>出现次数</span>
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

  return (
    <div className="statistics-container">
      <h1 style={{ marginBottom: 24, fontSize: 24, fontWeight: 500 }}>统计分析</h1>
      
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* 总记录数卡片 */}
        <Col xs={24} sm={12} md={8}>
          <Card variant="outlined">
            <Statistic
              title="总记录数"
              value={totalRecords}
              prefix={<AreaChartOutlined />}
              valueStyle={{ color: statisticType === 'red' ? '#f5222d' : '#1890ff' }}
            />
          </Card>
        </Col>
        
        {/* 红球/蓝球总数卡片 */}
        <Col xs={24} sm={12} md={8}>
          <Card variant="outlined">
            <Statistic
              title={statisticType === 'red' ? "红球总数" : "蓝球总数"}
              value={statisticType === 'red' 
                ? Object.values(redBallFrequency).reduce((sum, item) => sum + item.count, 0) 
                : Object.values(blueBallFrequency).reduce((sum, item) => sum + item.count, 0)}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: statisticType === 'red' ? '#f5222d' : '#1890ff' }}
            />
          </Card>
        </Col>
        
        {/* 红球/蓝球号码覆盖卡片 */}
        <Col xs={24} sm={24} md={8}>
          <Card variant="outlined">
            <Statistic
              title={statisticType === 'red' ? "红球号码覆盖" : "蓝球号码覆盖"}
              value={statisticType === 'red' 
                ? Object.keys(redBallFrequency).length 
                : Object.keys(blueBallFrequency).length}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: statisticType === 'red' ? '#f5222d' : '#1890ff' }}
              suffix={statisticType === 'red' ? "/33" : "/16"}
            />
          </Card>
        </Col>
      </Row>

      {/* 分析结果 */}
      <Spin spinning={loading} indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}>
        <Tabs 
          defaultActiveKey="1" 
          type="card"
          items={[
            ...(statisticType === 'red' ? [
              {
                key: '1',
                label: <span style={{ color: '#f5222d' }}>红球号码频率</span>,
                children: (
                  <Row gutter={[16, 16]}>
                    <Col xs={24}>
                      <Card 
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>红球号码出现频率统计</span>
                            <button
                              onClick={() => setShowOnlyLastWinning(!showOnlyLastWinning)}
                              style={{
                                padding: '8px',
                                backgroundColor: showOnlyLastWinning ? (statisticType === 'red' ? '#f5222d' : '#1890ff') : '#fff',
                                color: showOnlyLastWinning ? '#fff' : (statisticType === 'red' ? '#f5222d' : '#1890ff'),
                                border: `1px solid ${statisticType === 'red' ? '#f5222d' : '#1890ff'}`,
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
                label: <span style={{ color: '#f5222d' }}>红球分布统计</span>,
                children: (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Card title="红球奇偶分布" variant="outlined">
                        {renderDistributionList(redBallOddEven)}
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card title="红球大小分布" variant="outlined">
                        {renderDistributionList(redBallSize)}
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card title="最后一期统计" variant="outlined">
                        {renderDistributionList(lastWinningNumbersTotalRed)}
                      </Card>
                    </Col>
                  </Row>
                ),
              }
            ] : [
              {
                key: '2',
                label: <span style={{ color: '#1890ff' }}>蓝球号码频率</span>,
                children: (
                  <Row gutter={[16, 16]}>
                    <Col xs={24}>
                      <Card 
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>蓝球号码出现频率统计</span>
                            <button
                              onClick={() => setShowOnlyLastWinning(!showOnlyLastWinning)}
                              style={{
                                padding: '8px',
                                backgroundColor: showOnlyLastWinning ? (statisticType === 'red' ? '#f5222d' : '#1890ff') : '#fff',
                                color: showOnlyLastWinning ? '#fff' : (statisticType === 'red' ? '#f5222d' : '#1890ff'),
                                border: `1px solid ${statisticType === 'red' ? '#f5222d' : '#1890ff'}`,
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
                label: <span style={{ color: '#1890ff' }}>蓝球分布统计</span>,
                children: (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Card title="蓝球奇偶分布" variant="outlined">
                        {renderDistributionList(blueBallOddEven)}
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card title="蓝球大小分布" variant="outlined">
                        {renderDistributionList(blueBallSize)}
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card title="最后一期统计" variant="outlined">
                        {renderDistributionList(lastWinningNumbersTotalBlue)}
                      </Card>
                    </Col>
                  </Row>
                ),
              }
            ])
          ]}
        />
      </Spin>
      
      {/* 数据范围滑块 */}
      {allRecords.length > 0 && (
        <div style={{ 
          marginTop: 40, // 增加 marginTop 实现整体下移
          padding: '16px', 
          backgroundColor: '#fff', 
          borderRadius: 6, 
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
          textAlign: 'center'
        }}>
          <div style={{ 
            display: 'flex', 
            gap: '16px',
            marginBottom: 16 
          }}>
            {/* 滑块div */}
            <div style={{ 
              flex: '0 0 80%',
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{ 
                position: 'relative', 
                width: '100%',
                padding: '0 10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
              {/* 快退图标 - 最左侧，带圆圈边框 */}
              <div style={{
                color: statisticType === 'red' ? '#f5222d' : '#1890ff',
                cursor: 'pointer',
                userSelect: 'none',
                border: `1px solid ${statisticType === 'red' ? '#f5222d' : '#1890ff'}`,
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'all 0.3s'
              }}
              onClick={() => {
                const newRange: [number, number] = [0, sliderRange[1]];
                setSliderRange(newRange);
                handleSliderChange(newRange);
              }}
              >
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
                  disabled={sliderRange[0] <= 0}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: `1px solid ${sliderRange[0] > 0 ? (statisticType === 'red' ? '#f5222d' : '#1890ff') : '#d9d9d9'}`,
                    backgroundColor: '#fff',
                    color: sliderRange[0] > 0 ? (statisticType === 'red' ? '#f5222d' : '#1890ff') : '#d9d9d9',
                    cursor: sliderRange[0] > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '16px',
                    lineHeight: '1',
                    transition: 'all 0.3s',
                    padding: 0,
                    margin: 0,
                    boxSizing: 'border-box'
                  }}
                >
                  <StepBackwardOutlined style={{ fontSize: '14px' }} />
                </button>
                
                {/* 左端加1按钮 - 新增 */}
                <button
                  onClick={() => {
                    if (sliderRange[0] < sliderRange[1]) {
                      const newRange: [number, number] = [sliderRange[0] + 1, sliderRange[1]];
                      setSliderRange(newRange);
                      handleSliderChange(newRange);
                    }
                  }}
                  disabled={sliderRange[0] >= sliderRange[1]}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: `1px solid ${sliderRange[0] < sliderRange[1] ? (statisticType === 'red' ? '#f5222d' : '#1890ff') : '#d9d9d9'}`,
                    backgroundColor: '#fff',
                    color: sliderRange[0] < sliderRange[1] ? (statisticType === 'red' ? '#f5222d' : '#1890ff') : '#d9d9d9',
                    cursor: sliderRange[0] < sliderRange[1] ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '16px',
                    lineHeight: '1',
                    transition: 'all 0.3s',
                    padding: 0,
                    margin: 0,
                    boxSizing: 'border-box'
                  }}
                >
                  <StepForwardOutlined style={{ fontSize: '14px' }} />
                </button>
              </div>
              
              {/* 右端减1按钮 - 新增 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => {
                    if (sliderRange[1] > sliderRange[0]) {
                      const newRange: [number, number] = [sliderRange[0], sliderRange[1] - 1];
                      setSliderRange(newRange);
                      handleSliderChange(newRange);
                    }
                  }}
                  disabled={sliderRange[1] <= sliderRange[0]}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: `1px solid ${sliderRange[1] > sliderRange[0] ? (statisticType === 'red' ? '#f5222d' : '#1890ff') : '#d9d9d9'}`,
                    backgroundColor: '#fff',
                    color: sliderRange[1] > sliderRange[0] ? (statisticType === 'red' ? '#f5222d' : '#1890ff') : '#d9d9d9',
                    cursor: sliderRange[1] > sliderRange[0] ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '16px',
                    lineHeight: '1',
                    transition: 'all 0.3s',
                    padding: 0,
                    margin: 0,
                    boxSizing: 'border-box'
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
                  disabled={sliderRange[1] >= allRecords.length - 1}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: `1px solid ${sliderRange[1] < allRecords.length - 1 ? (statisticType === 'red' ? '#f5222d' : '#1890ff') : '#d9d9d9'}`,
                    backgroundColor: '#fff',
                    color: sliderRange[1] < allRecords.length - 1 ? (statisticType === 'red' ? '#f5222d' : '#1890ff') : '#d9d9d9',
                    cursor: sliderRange[1] < allRecords.length - 1 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '16px',
                    lineHeight: '1',
                    transition: 'all 0.3s',
                    padding: 0,
                    margin: 0,
                    boxSizing: 'border-box'
                  }}
                >
                  <StepForwardOutlined style={{ fontSize: '14px' }} />
                </button>
              </div>
              
              {/* 快进图标 - 最右侧，带圆圈边框 */}
              <div style={{
                color: statisticType === 'red' ? '#f5222d' : '#1890ff',
                cursor: 'pointer',
                userSelect: 'none',
                border: `1px solid ${statisticType === 'red' ? '#f5222d' : '#1890ff'}`,
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'all 0.3s'
              }}
              onClick={() => {
                const newRange: [number, number] = [sliderRange[0], allRecords.length - 1];
                setSliderRange(newRange);
                handleSliderChange(newRange);
              }}
              >
                <FastForwardOutlined style={{ fontSize: '18px' }} />
              </div>
            </div>
            <Slider
              range
              min={0}
              max={allRecords.length - 1}
              value={sliderRange}
              onChange={handleSliderChange}
              style={{ width: '100%' }}
              trackStyle={[
                {
                  backgroundColor: statisticType === 'red' ? '#f5222d' : '#1890ff'
                }
              ]}
              handleStyle={[
                {
                  borderWidth: 2,
                  borderColor: statisticType === 'red' ? '#f5222d' : '#1890ff',
                  backgroundColor: statisticType === 'red' ? '#f5222d' : '#1890ff'
                },
                {
                  borderWidth: 2,
                  borderColor: statisticType === 'red' ? '#f5222d' : '#1890ff',
                  backgroundColor: statisticType === 'red' ? '#f5222d' : '#1890ff'
                }
              ]}
            />
              </div>
            </div>
            
            {/* 切换按钮div */}
            <div style={{ 
              flex: '0 0 20%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#fff',
              borderRadius: 6,
              padding: '8px'
            }}>
              <div style={{
                display: 'flex', 
                alignItems: 'center',
                backgroundColor: statisticType === 'red' ? '#f5222d' : '#1890ff',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'background-color 0.3s',
                width: '60px',
                height: '32px',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={() => setStatisticType(statisticType === 'red' ? 'blue' : 'red')}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'absolute',
                  top: '2px',
                  left: statisticType === 'red' ? '2px' : '30px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  color: statisticType === 'red' ? '#f5222d' : '#1890ff',
                  fontWeight: 'bold',
                  transition: 'left 0.3s',
                  fontSize: '12px',
                  zIndex: 1
                }}>
                  {statisticType === 'red' ? '红球' : '蓝球'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;
