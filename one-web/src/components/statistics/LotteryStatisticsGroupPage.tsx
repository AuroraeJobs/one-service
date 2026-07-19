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

const LotteryStatisticsGroupPage: React.FC = () => {
  const data = useStatisticsData();

  const renderSpecialStats = () => {
    // 根据当前统计类型选择相应的数据和配置
    const isRed = data.statisticType === 'red';
    const stats = isRed ? data.specialRedStats : data.specialBlueStats;
    const currentColor = isRed ? '#f5222d' : '#1890ff';

    // 生成所有卡片数据
    const allCards = isRed ? (
      [
        // 组1：林黛玉（包含组名卡片 + 11个号码卡片）
        { type: 'group', name: '林黛玉', count: stats.groups['林黛玉']?.count || 0, percent: stats.groups['林黛玉']?.percent || 0 },
        ...data.redBallConfig.groups[0].numbers.map(number => ({ type: 'number', number, name: data.redBallConfig.numberToName[number as keyof typeof data.redBallConfig.numberToName] || number, count: stats.individual[number]?.count || 0, percent: stats.individual[number]?.percent || 0 })),
        // 组2：香菱（包含组名卡片 + 11个号码卡片）
        { type: 'group', name: '香菱', count: stats.groups['香菱']?.count || 0, percent: stats.groups['香菱']?.percent || 0 },
        ...data.redBallConfig.groups[1].numbers.map(number => ({ type: 'number', number, name: data.redBallConfig.numberToName[number as keyof typeof data.redBallConfig.numberToName] || number, count: stats.individual[number]?.count || 0, percent: stats.individual[number]?.percent || 0 })),
        // 组3：晴雯（包含组名卡片 + 11个号码卡片）
        { type: 'group', name: '晴雯', count: stats.groups['晴雯']?.count || 0, percent: stats.groups['晴雯']?.percent || 0 },
        ...data.redBallConfig.groups[2].numbers.map(number => ({ type: 'number', number, name: data.redBallConfig.numberToName[number as keyof typeof data.redBallConfig.numberToName] || number, count: stats.individual[number]?.count || 0, percent: stats.individual[number]?.percent || 0 }))
      ]
    ) : (
      [
        // 组1：立春（包含组名卡片 + 2个号码卡片）
        { type: 'group', name: '立春', count: stats.groups['立春']?.count || 0, percent: stats.groups['立春']?.percent || 0 },
        ...data.blueBallConfig.groups[0].numbers.map(number => ({ type: 'number', number, name: data.blueBallConfig.numberToName[number as keyof typeof data.blueBallConfig.numberToName] || number, count: stats.individual[number]?.count || 0, percent: stats.individual[number]?.percent || 0 })),
        // 组2：春分（包含组名卡片 + 2个号码卡片）
        { type: 'group', name: '春分', count: stats.groups['春分']?.count || 0, percent: stats.groups['春分']?.percent || 0 },
        ...data.blueBallConfig.groups[1].numbers.map(number => ({ type: 'number', number, name: data.blueBallConfig.numberToName[number as keyof typeof data.blueBallConfig.numberToName] || number, count: stats.individual[number]?.count || 0, percent: stats.individual[number]?.percent || 0 })),
        // 组3：立夏（包含组名卡片 + 2个号码卡片）
        { type: 'group', name: '立夏', count: stats.groups['立夏']?.count || 0, percent: stats.groups['立夏']?.percent || 0 },
        ...data.blueBallConfig.groups[2].numbers.map(number => ({ type: 'number', number, name: data.blueBallConfig.numberToName[number as keyof typeof data.blueBallConfig.numberToName] || number, count: stats.individual[number]?.count || 0, percent: stats.individual[number]?.percent || 0 })),
        // 组4：夏至（包含组名卡片 + 2个号码卡片）
        { type: 'group', name: '夏至', count: stats.groups['夏至']?.count || 0, percent: stats.groups['夏至']?.percent || 0 },
        ...data.blueBallConfig.groups[3].numbers.map(number => ({ type: 'number', number, name: data.blueBallConfig.numberToName[number as keyof typeof data.blueBallConfig.numberToName] || number, count: stats.individual[number]?.count || 0, percent: stats.individual[number]?.percent || 0 })),
        // 组5：立秋（包含组名卡片 + 2个号码卡片）
        { type: 'group', name: '立秋', count: stats.groups['立秋']?.count || 0, percent: stats.groups['立秋']?.percent || 0 },
        ...data.blueBallConfig.groups[4].numbers.map(number => ({ type: 'number', number, name: data.blueBallConfig.numberToName[number as keyof typeof data.blueBallConfig.numberToName] || number, count: stats.individual[number]?.count || 0, percent: stats.individual[number]?.percent || 0 })),
        // 组6：秋分（包含组名卡片 + 2个号码卡片）
        { type: 'group', name: '秋分', count: stats.groups['秋分']?.count || 0, percent: stats.groups['秋分']?.percent || 0 },
        ...data.blueBallConfig.groups[5].numbers.map(number => ({ type: 'number', number, name: data.blueBallConfig.numberToName[number as keyof typeof data.blueBallConfig.numberToName] || number, count: stats.individual[number]?.count || 0, percent: stats.individual[number]?.percent || 0 })),
        // 组7：立冬（包含组名卡片 + 2个号码卡片）
        { type: 'group', name: '立冬', count: stats.groups['立冬']?.count || 0, percent: stats.groups['立冬']?.percent || 0 },
        ...data.blueBallConfig.groups[6].numbers.map(number => ({ type: 'number', number, name: data.blueBallConfig.numberToName[number as keyof typeof data.blueBallConfig.numberToName] || number, count: stats.individual[number]?.count || 0, percent: stats.individual[number]?.percent || 0 })),
        // 组8：冬至（包含组名卡片 + 2个号码卡片）
        { type: 'group', name: '冬至', count: stats.groups['冬至']?.count || 0, percent: stats.groups['冬至']?.percent || 0 },
        ...data.blueBallConfig.groups[7].numbers.map(number => ({ type: 'number', number, name: data.blueBallConfig.numberToName[number as keyof typeof data.blueBallConfig.numberToName] || number, count: stats.individual[number]?.count || 0, percent: stats.individual[number]?.percent || 0 }))
      ]
    );

    // 直接使用原始排序，移除自定义拖拽排序
    const orderedCards = allCards;

    return (
      <div>
        {/* 合并个体和分组统计 */}
        <Card
          className="lottery-stat-container-card"
          title={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <button
                onClick={() => data.setShowOnlyLastWinning(!data.showOnlyLastWinning)}
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
                title={data.showOnlyLastWinning ? '显示全部' : '只看最后一期中奖号码'}
              >
                {data.showOnlyLastWinning ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              </button>
            </div>
          }
          style={{ backgroundColor: 'transparent', border: 'none' }}>


          {/* 红球分组统计：6列布局，每组12个卡片占2行，共3组36个卡片 */}
          {/* 将卡片按组分组，确保每个组名卡片在新行开始 */}
          {(() => {
            // 过滤出要显示的卡片
            const filteredCards = orderedCards.filter(item => {
              if (!data.showOnlyLastWinning) return true;
              if (item.type === 'group') return true;
              return data.endLineNumbers.includes((item as { number: string }).number);
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
                    md={12}
                    lg={8}
                    xl={6}

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
                      {item.type === 'number' && data.endLineNumbers.includes((item as { number: string }).number) && (
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
                              const groupsConfig = isRed ? data.redBallConfig.groups : data.blueBallConfig.groups;
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
                              const groupsConfig = isRed ? data.redBallConfig.groups : data.blueBallConfig.groups;
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
                              const groupsConfig = isRed ? data.redBallConfig.groups : data.blueBallConfig.groups;
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

      {/* Group statistics */}
      <Spin spinning={data.loading} indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}>
        <div style={{ marginBottom: '80px' }}>
          {/* Show special stats for red or blue based on activeTabKey */}
          {(data.activeTabKey === '5' || data.activeTabKey === '6') && renderSpecialStats()}
        </div>
      </Spin>
    </>
  );
};

export default LotteryStatisticsGroupPage;
