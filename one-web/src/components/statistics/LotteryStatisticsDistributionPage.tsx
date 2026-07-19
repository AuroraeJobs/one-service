import React from 'react';
import { Card, Row, Col, Statistic, Progress, Spin, Tooltip } from 'antd';
import {
  BarChartOutlined,
  PieChartOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
  AreaChartOutlined
} from '@ant-design/icons';
import { useStatisticsData } from './StatisticsDataProvider';
import type { AnalysisResult } from './StatisticsDataProvider';

const LotteryStatisticsDistributionPage: React.FC = () => {
  const data = useStatisticsData();
  const { statisticType } = data;

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

  const isRed = data.statisticType === 'red';

  return (
    <>
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
              padding: '20px',
              backgroundColor: '#1A1A1A',
              backgroundImage: 'linear-gradient(145deg, #252525, #101010)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              transformStyle: 'preserve-3d',
              perspective: '1000px',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              transform: 'translateZ(0) scale(1)',
              boxShadow: `0 0 20px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
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
              padding: '20px',
              backgroundColor: '#1A1A1A',
              backgroundImage: 'linear-gradient(145deg, #252525, #101010)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              transformStyle: 'preserve-3d',
              perspective: '1000px',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              transform: 'translateZ(0) scale(1)',
              boxShadow: `0 0 20px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
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
              padding: '20px',
              backgroundColor: '#1A1A1A',
              backgroundImage: 'linear-gradient(145deg, #252525, #101010)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              transformStyle: 'preserve-3d',
              perspective: '1000px',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              transform: 'translateZ(0) scale(1)',
              boxShadow: `0 0 20px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
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
              padding: '20px',
              backgroundColor: '#1A1A1A',
              backgroundImage: 'linear-gradient(145deg, #252525, #101010)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              transformStyle: 'preserve-3d',
              perspective: '1000px',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              transform: 'translateZ(0) scale(1)',
              boxShadow: `0 0 20px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
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
              padding: '20px',
              backgroundColor: '#1A1A1A',
              backgroundImage: 'linear-gradient(145deg, #252525, #101010)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              transformStyle: 'preserve-3d',
              perspective: '1000px',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              transform: 'translateZ(0) scale(1)',
              boxShadow: `0 0 20px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
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
          {(data.activeTabKey === '3' || data.activeTabKey === '4') && (
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={24} md={12} lg={12} xl={8}>
                <Card className="lottery-stat-container-card" title={<div style={{ textAlign: 'center' }}>奇偶分布</div>} style={{ backgroundColor: 'transparent', border: 'none' }}>
                  {isRed ? renderDistributionList(data.redBallOddEven) : renderDistributionList(data.blueBallOddEven)}
                </Card>
              </Col>
              <Col xs={24} sm={24} md={12} lg={12} xl={8}>
                <Card className="lottery-stat-container-card" title={<div style={{ textAlign: 'center' }}>大小分布</div>} style={{ backgroundColor: 'transparent', border: 'none' }}>
                  {isRed ? renderDistributionList(data.redBallSize, 'red') : renderDistributionList(data.blueBallSize, 'blue')}
                </Card>
              </Col>
              <Col xs={24} sm={24} md={12} lg={12} xl={8}>
                <Card className="lottery-stat-container-card" title={<div style={{ textAlign: 'center' }}>最后一期</div>} style={{ backgroundColor: 'transparent', border: 'none' }}>
                  {isRed ? renderDistributionList(data.lastWinningNumbersTotalRed) : renderDistributionList(data.lastWinningNumbersTotalBlue)}
                </Card>
              </Col>
            </Row>
          )}
        </div>
      </Spin>
    </>
  );
};

export default LotteryStatisticsDistributionPage;
