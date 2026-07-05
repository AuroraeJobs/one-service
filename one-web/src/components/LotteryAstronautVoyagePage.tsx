import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Empty, Select, Space, Spin, Tag, message } from 'antd';
import { ArrowLeftOutlined, RocketOutlined } from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import { lotteryAstronautApi } from '../services/api';
import type { LotteryAstronaut, LotteryAstronautVoyage } from '../services/api';

const planetColors: Record<string, string> = {
  太阳: '#fadb14',
  月亮: '#69b1ff',
  水星: '#13c2c2',
  金星: '#faad14',
  地球: '#52c41a',
  火星: '#ff4d4f',
  木星: '#9254de',
  土星: '#d48806',
  天王星: '#36cfc9'
};

const topDistribution = (values: string[]) => {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach(value => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-Hans-CN'));
};

const LotteryAstronautVoyagePage = () => {
  const navigate = useNavigate();
  const params = useParams<{ camp: string; number: string }>();
  const camp = params.camp?.toUpperCase() === 'BLUE' ? 'BLUE' : 'RED';
  const number = String(params.number || '').padStart(2, '0');
  const [astronauts, setAstronauts] = useState<LotteryAstronaut[]>([]);
  const [voyage, setVoyage] = useState<LotteryAstronautVoyage>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadVoyage = async () => {
      setLoading(true);
      try {
        const [astronautData, voyageData] = await Promise.all([
          lotteryAstronautApi.findAll(),
          lotteryAstronautApi.voyage(camp, number)
        ]);
        setAstronauts(astronautData);
        setVoyage(voyageData);
      } catch (requestError) {
        console.error('读取宇航员航行记录失败:', requestError);
        message.error('航行记录加载失败');
      } finally {
        setLoading(false);
      }
    };

    loadVoyage();
  }, [camp, number]);

  const astronaut = useMemo(() => (
    voyage?.astronaut || astronauts.find(item => item.camp === camp && item.number === number)
  ), [astronauts, camp, number, voyage]);

  const voyageRecords = voyage?.records || [];

  const availableAstronauts = useMemo(() => (
    astronauts
      .filter(item => item.camp === camp)
      .map(item => ({
        value: item.number,
        label: `${item.number} ${item.name || '未命名'}`
      }))
  ), [astronauts, camp]);

  const title = astronaut ? `${astronaut.name}的航行记录` : `${number}号宇航员航行记录`;
  const isBlueVoyage = camp === 'BLUE';
  const voyageAnalysis = useMemo(() => {
    const sortedRecords = [...voyageRecords].sort((a, b) => b.period - a.period);
    const ascendingRecords = [...voyageRecords].sort((a, b) => a.period - b.period);
    const latestRecord = sortedRecords[0];
    const earliestRecord = sortedRecords[sortedRecords.length - 1];
    const total = sortedRecords.length;
    const planetDistribution = topDistribution(sortedRecords.map(record => record.planetName));
    const hexagramDistribution = topDistribution(sortedRecords.map(record => record.hexagramName));
    const sumTotal = sortedRecords.reduce((sum, record) => sum + (record.redSum || 0), 0);
    const oddTotal = sortedRecords.reduce((sum, record) => sum + (record.oddCount || 0), 0);
    const evenTotal = sortedRecords.reduce((sum, record) => sum + (record.evenCount || 0), 0);
    const gaps = ascendingRecords.slice(1).map((record, index) => record.period - ascendingRecords[index].period);
    const averageGap = gaps.length ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : 0;
    const latestGap = sortedRecords.length > 1 ? sortedRecords[0].period - sortedRecords[1].period : 0;
    const longestGap = gaps.length ? Math.max(...gaps) : 0;
    const shortestGap = gaps.length ? Math.min(...gaps) : 0;
    const recentRecords = sortedRecords.slice(0, 12);
    const recentPlanets = topDistribution(recentRecords.map(record => record.planetName)).slice(0, 3);
    const primaryPlanetCount = planetDistribution[0]?.count || 0;
    const primaryPlanetPercent = total ? Math.round((primaryPlanetCount / total) * 100) : 0;

    return {
      total,
      latestRecord,
      earliestRecord,
      planetDistribution,
      hexagramDistribution,
      averageRedSum: total ? sumTotal / total : 0,
      oddEvenLabel: `${oddTotal}奇 / ${evenTotal}偶`,
      averageGap,
      latestGap,
      longestGap,
      shortestGap,
      recentPlanets,
      primaryPlanetPercent
    };
  }, [voyageRecords]);

  return (
    <LifePageShell
      className="lottery-astronaut-voyage-page"
      eyebrow="Lottery / Astronaut Voyage"
      title={title}
      actions={(
        <Space wrap>
          <Select
            value={number}
            options={availableAstronauts}
            style={{ width: 180 }}
            onChange={nextNumber => navigate(`/lottery/astronauts/${camp.toLowerCase()}/${nextNumber}`)}
          />
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/lottery/astronauts')}>
            返回名单
          </Button>
        </Space>
      )}
    >
      <Spin spinning={loading}>
        {voyageRecords.length > 0 ? (
          <>
            <section className="lottery-voyage-summary" aria-label="航行分析摘要">
              <Card size="small">
                <span>航行总数</span>
                <strong>{voyageAnalysis.total}</strong>
                <small>第 {voyageAnalysis.earliestRecord?.period || '-'} - {voyageAnalysis.latestRecord?.period || '-'}</small>
              </Card>
              <Card size="small">
                <span>最近航行</span>
                <strong>{voyageAnalysis.latestRecord?.planetName || '-'}</strong>
                <small>第 {voyageAnalysis.latestRecord?.period || '-'} 期</small>
              </Card>
              <Card size="small">
                <span>主访问星球</span>
                <strong>{voyageAnalysis.planetDistribution[0]?.name || '-'}</strong>
                <small>{voyageAnalysis.planetDistribution[0]?.count || 0} 次</small>
              </Card>
              <Card size="small">
                <span>平均间隔</span>
                <strong>{voyageAnalysis.averageGap ? voyageAnalysis.averageGap.toFixed(1) : '-'}</strong>
                <small>期 / 次</small>
              </Card>
            </section>

            <section className="lottery-voyage-analysis-grid" aria-label="航行结构分析">
              <Card className="life-panel-card lottery-clean-panel" title="星球分布">
                <div className="lottery-voyage-analysis-list">
                  {voyageAnalysis.planetDistribution.slice(0, 8).map(item => (
                    <div key={item.name}>
                      <span>{item.name}</span>
                      <strong>{item.count}</strong>
                      <em style={{ width: `${Math.max(8, (item.count / voyageAnalysis.total) * 100)}%` }} />
                    </div>
                  ))}
                </div>
              </Card>
              {isBlueVoyage ? (
                <Card className="life-panel-card lottery-clean-panel" title="蓝舰队星球节奏">
                  <div className="lottery-voyage-hexagram-summary">
                    <strong>{voyageAnalysis.planetDistribution[0]?.name || '-'}</strong>
                    <span>主星占比 {voyageAnalysis.primaryPlanetPercent}%</span>
                    <span>最近间隔 {voyageAnalysis.latestGap || '-'} 期</span>
                    <span>间隔范围 {voyageAnalysis.shortestGap || '-'} - {voyageAnalysis.longestGap || '-'} 期</span>
                  </div>
                </Card>
              ) : (
                <Card className="life-panel-card lottery-clean-panel" title="红舰队卦象与结构">
                  <div className="lottery-voyage-hexagram-summary">
                    <strong>{voyageAnalysis.hexagramDistribution[0]?.name || '-'}</strong>
                    <span>最高频卦象 {voyageAnalysis.hexagramDistribution[0]?.count || 0} 次</span>
                    <span>平均和值 {voyageAnalysis.averageRedSum ? voyageAnalysis.averageRedSum.toFixed(1) : '-'}</span>
                    <span>累计奇偶 {voyageAnalysis.oddEvenLabel}</span>
                  </div>
                </Card>
              )}
              <Card className="life-panel-card lottery-clean-panel" title="近 12 次趋势">
                <div className="lottery-voyage-trend-tags">
                  {voyageAnalysis.recentPlanets.length ? voyageAnalysis.recentPlanets.map(item => (
                    <Tag key={item.name} color={planetColors[item.name] ? 'blue' : 'default'}>{item.name} {item.count}</Tag>
                  )) : <Tag>暂无趋势</Tag>}
                </div>
              </Card>
            </section>

            <section className="lottery-voyage-list">
              {voyageRecords.map(record => (
                <article
                  className="lottery-voyage-item"
                  key={record.id}
                  style={{ '--voyage-planet-color': planetColors[record.planetName] || '#1890ff' } as React.CSSProperties}
                >
                  <div className="lottery-voyage-planet">
                    <RocketOutlined />
                    <strong>{record.planetName}</strong>
                  </div>
                  <div className="lottery-voyage-item-main">
                    <div>
                      <div className="lottery-voyage-period">第 {record.period} 期</div>
                      <div className="lottery-voyage-balls">
                        {record.redNumbers.length > 0 ? record.redNumbers.join(' ') : record.blueNumber || record.raw}
                      </div>
                    </div>
                  </div>
                  <div className="lottery-voyage-tags">
                    {isBlueVoyage ? (
                      <>
                        <Tag color="blue">蓝球 {record.blueNumber || record.raw}</Tag>
                        <Tag>星球 {record.planetName}</Tag>
                      </>
                    ) : (
                      <>
                        <Tag color="gold">{record.hexagramName}</Tag>
                        <Tag>和值 {record.redSum}</Tag>
                        <Tag>{record.oddCount}奇{record.evenCount}偶</Tag>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </section>
          </>
        ) : (
          <Empty description="这个宇航员暂时没有航行记录" />
        )}
      </Spin>
    </LifePageShell>
  );
};

export default LotteryAstronautVoyagePage;
