import React from 'react';
import { Card, Row, Col, Statistic, Progress, Spin } from 'antd';
import {
  BarChartOutlined,
  PieChartOutlined,
  LoadingOutlined,
  AreaChartOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  StarFilled
} from '@ant-design/icons';
import { useStatisticsData } from './StatisticsDataProvider';
import type { AnalysisResult } from './StatisticsDataProvider';

const LotteryStatisticsFrequencyPage: React.FC = () => {
  const data = useStatisticsData();

  const renderFrequencyList = (frequencyData: AnalysisResult) => {
    // 转换为数组并按计数排序
    let sortedData = Object.entries(frequencyData)
      .map(([key, value]) => ({
        name: key,
        count: value.count,
        percent: value.percent
      }))
      .sort((a, b) => b.count - a.count);

    // 如果只显示最后一期中奖号码，进行过滤
    if (data.showOnlyLastWinning) {
      sortedData = sortedData.filter(item => data.endLineNumbers.includes(item.name));
    }



    // 根据当前统计类型设置颜色和获取相关数据
    const currentColor = data.statisticType === 'red' ? '#f5222d' : '#1890ff';
    const stats = data.statisticType === 'red' ? data.specialRedStats : data.specialBlueStats;
    const isRed = data.statisticType === 'red';

    // 计算平均值
    const totalCount = Object.values(frequencyData).reduce((sum, val) => sum + val.count, 0);
    const avgCount = isRed ? totalCount / 33 : totalCount / 16;

    // 直接使用原始排序，移除自定义拖拽排序
    const orderedData = sortedData;

    return (
      <Row gutter={[16, 16]}>
        {orderedData.map((item, index) => {
          // 检查当前号码是否在结束行中奖号码中
          const isWinningNumber = data.endLineNumbers.includes(item.name);

          // 计算与平均值的差值
          const diff = item.count - avgCount;

          return (
            <Col
              xs={24}
              sm={12}
              md={12}
              lg={8}
              xl={6}
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
                            {isRed ? data.redBallConfig.numberToName[item.name as keyof typeof data.redBallConfig.numberToName] : data.blueBallConfig.numberToName[item.name as keyof typeof data.blueBallConfig.numberToName]}
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

  return (
    <>
      {/* Summary stats cards */}
      <div
        className="lottery-stat-summary-grid"
        style={{
          marginTop: 0,
          marginBottom: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}
      >
      {/* 总数据量卡片 */}
      <div style={{ minWidth: 0 }}>
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
            boxShadow: `0 0 20px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
            // 增强边框效果，进一步提升厚度感
            border: '1px solid rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
            height: '100%',
            minHeight: '120px'
          }}
          onMouseEnter={(e) => {
            const card = e.currentTarget;
            card.style.transform = 'translateZ(10px) scale(1.02)';
            card.style.boxShadow = `0 0 25px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}80, 0 15px 40px rgba(0, 0, 0, 0.6), inset 0 0 15px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}30, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
            card.style.cursor = 'pointer';
          }}
          onMouseLeave={(e) => {
            const card = e.currentTarget;
            card.style.transform = 'translateZ(0) scale(1)';
            card.style.boxShadow = `0 0 20px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
            card.style.cursor = 'pointer';
          }}>
          <Statistic
            title={<div style={{ color: '#ffffff', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>总数据量</div>}
            value={data.totalRecords}
            prefix={<AreaChartOutlined />}
            valueStyle={{ color: data.statisticType === 'red' ? '#f5222d' : '#1890ff', fontWeight: 'bold' }}
          />
        </Card>
      </div>

      {/* 红球/蓝球总数卡片 */}
      <div style={{ minWidth: 0 }}>
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
            boxShadow: `0 0 20px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
            // 增强边框效果，进一步提升厚度感
            border: '1px solid rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
            height: '100%',
            minHeight: '120px'
          }}
          onMouseEnter={(e) => {
            const card = e.currentTarget;
            card.style.transform = 'translateZ(10px) scale(1.02)';
            card.style.boxShadow = `0 0 25px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}80, 0 15px 40px rgba(0, 0, 0, 0.6), inset 0 0 15px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}30, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
            card.style.cursor = 'pointer';
          }}
          onMouseLeave={(e) => {
            const card = e.currentTarget;
            card.style.transform = 'translateZ(0) scale(1)';
            card.style.boxShadow = `0 0 20px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
            card.style.cursor = 'pointer';
          }}
        >
          <Statistic
            title={<div style={{ color: '#ffffff', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>总次数</div>}
            value={data.statisticType === 'red'
              ? Object.values(data.redBallFrequency).reduce((sum, item) => sum + item.count, 0)
              : Object.values(data.blueBallFrequency).reduce((sum, item) => sum + item.count, 0)}
            prefix={<BarChartOutlined />}
            valueStyle={{ color: data.statisticType === 'red' ? '#f5222d' : '#1890ff', fontWeight: 'bold' }}
          />
        </Card>
      </div>

      {/* 平均次数卡片 */}
      <div style={{ minWidth: 0 }}>
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
            boxShadow: `0 0 20px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
            // 增强边框效果，进一步提升厚度感
            border: '1px solid rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
            height: '100%',
            minHeight: '120px'
          }}
          onMouseEnter={(e) => {
            const card = e.currentTarget;
            card.style.transform = 'translateZ(10px) scale(1.02)';
            card.style.boxShadow = `0 0 25px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}80, 0 15px 40px rgba(0, 0, 0, 0.6), inset 0 0 15px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}30, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
            card.style.cursor = 'pointer';
          }}
          onMouseLeave={(e) => {
            const card = e.currentTarget;
            card.style.transform = 'translateZ(0) scale(1)';
            card.style.boxShadow = `0 0 20px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
            card.style.cursor = 'pointer';
          }}
        >
          <Statistic
            title={<div style={{ color: '#ffffff', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>平均</div>}
            value={data.statisticType === 'red'
              ? Math.round(Object.values(data.redBallFrequency).reduce((sum, item) => sum + item.count, 0) / 33 * 10) / 10
              : Math.round(Object.values(data.blueBallFrequency).reduce((sum, item) => sum + item.count, 0) / 16 * 10) / 10}
            prefix={<PieChartOutlined />}
            valueStyle={{ color: data.statisticType === 'red' ? '#f5222d' : '#1890ff', fontWeight: 'bold' }}
          />
        </Card>
      </div>

      {/* 红球/蓝球号码覆盖卡片 */}
      <div style={{ minWidth: 0 }}>
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
            boxShadow: `0 0 20px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
            // 增强边框效果，进一步提升厚度感
            border: '1px solid rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
            height: '100%',
            minHeight: '120px'
          }}
          onMouseEnter={(e) => {
            const card = e.currentTarget;
            card.style.transform = 'translateZ(10px) scale(1.02)';
            card.style.boxShadow = `0 0 25px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}80, 0 15px 40px rgba(0, 0, 0, 0.6), inset 0 0 15px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}30, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
            card.style.cursor = 'pointer';
          }}
          onMouseLeave={(e) => {
            const card = e.currentTarget;
            card.style.transform = 'translateZ(0) scale(1)';
            card.style.boxShadow = `0 0 20px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
            card.style.cursor = 'pointer';
          }}
        >
          <Statistic
            title={<div style={{ color: '#ffffff', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>覆盖率</div>}
            value={data.statisticType === 'red'
              ? Object.keys(data.redBallFrequency).length
              : Object.keys(data.blueBallFrequency).length}
            prefix={<PieChartOutlined />}
            valueStyle={{ color: data.statisticType === 'red' ? '#f5222d' : '#1890ff', fontWeight: 'bold' }}
            suffix={data.statisticType === 'red' ? "/33" : "/16"}
          />
        </Card>
      </div>

      {/* 中奖号码总和卡片 - 放在最后 */}
      <div style={{ minWidth: 0 }}>
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
            boxShadow: `0 0 20px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
            // 增强边框效果，进一步提升厚度感
            border: '1px solid rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
            height: '100%',
            minHeight: '120px'
          }}
          onMouseEnter={(e) => {
            const card = e.currentTarget;
            card.style.transform = 'translateZ(10px) scale(1.02)';
            card.style.boxShadow = `0 0 25px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}80, 0 15px 40px rgba(0, 0, 0, 0.6), inset 0 0 15px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}30, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
            card.style.cursor = 'pointer';
          }}
          onMouseLeave={(e) => {
            const card = e.currentTarget;
            card.style.transform = 'translateZ(0) scale(1)';
            card.style.boxShadow = `0 0 20px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`;
            card.style.cursor = 'pointer';
          }}
        >
          <Statistic
            title={<div style={{ color: '#ffffff', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>总和</div>}
            value={data.statisticType === 'red' ? data.winningNumbersSum.redSum : data.winningNumbersSum.blueSum}
            prefix={<PieChartOutlined />}
            valueStyle={{ color: data.statisticType === 'red' ? '#f5222d' : '#1890ff', fontWeight: 'bold' }}
          />
        </Card>
      </div>
      </div>

      <Spin spinning={data.loading} indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}>
        <div style={{ marginBottom: '80px' }}>
          {/* Show frequency for red or blue based on activeTabKey */}
          {(data.activeTabKey === '1' || data.activeTabKey === '2') && (
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Card
                  className="lottery-stat-container-card"
                  title={
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <button
                        onClick={() => data.setShowOnlyLastWinning(!data.showOnlyLastWinning)}
                        style={{
                          padding: '8px',
                          backgroundColor: 'transparent',
                          color: data.statisticType === 'red' ? '#f5222d' : '#1890ff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          transition: 'all 0.3s',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                        title={data.showOnlyLastWinning ? '显示全部' : '只看最后一期中奖号码'}
                      >
                        {data.showOnlyLastWinning ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                      </button>
                    </div>
                  }
                  style={{ backgroundColor: 'transparent', border: 'none' }}
                >
                  {data.statisticType === 'red' ? renderFrequencyList(data.redBallFrequency) : renderFrequencyList(data.blueBallFrequency)}
                </Card>
              </Col>
            </Row>
          )}
        </div>
      </Spin>
    </>
  );
};

export default LotteryStatisticsFrequencyPage;
