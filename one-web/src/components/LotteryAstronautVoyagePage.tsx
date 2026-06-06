import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Empty, Select, Space, Spin, Tag, message } from 'antd';
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
      } catch {
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
                  <Tag color="gold">{record.hexagramName}</Tag>
                  <Tag>和值 {record.redSum}</Tag>
                  <Tag>{record.oddCount}奇{record.evenCount}偶</Tag>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <Empty description="这个宇航员暂时没有航行记录" />
        )}
      </Spin>
    </LifePageShell>
  );
};

export default LotteryAstronautVoyagePage;
