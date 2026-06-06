import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Empty, Space, Spin, Tag, Typography, message } from 'antd';
import { ReloadOutlined, RocketOutlined } from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import { lotteryAstronautApi } from '../services/api';
import type { LotteryAstronaut, LotteryAstronautVoyageStat } from '../services/api';

const { Text } = Typography;

const campLabels: Record<string, { label: string; color: string; group: string }> = {
  RED: { label: '第一舰队', color: 'red', group: '七大行星探索' },
  BLUE: { label: '第二舰队', color: 'blue', group: '恒星卫星探索' }
};

const LotteryAstronautPage = () => {
  const navigate = useNavigate();
  const [astronauts, setAstronauts] = useState<LotteryAstronaut[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [voyageStats, setVoyageStats] = useState<LotteryAstronautVoyageStat[]>([]);

  const fetchAstronauts = async () => {
    setLoading(true);
    try {
      const [data, stats] = await Promise.all([
        lotteryAstronautApi.findAll(),
        lotteryAstronautApi.getVoyageStats()
      ]);
      setAstronauts(data);
      setVoyageStats(stats);
    } catch {
      message.error('宇航员名单加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateVoyageStats = async () => {
    setCalculating(true);
    try {
      const stats = await lotteryAstronautApi.calculateVoyageStats();
      setVoyageStats(stats);
      message.success('出行次数统计已更新');
    } catch {
      message.error('出行次数统计失败');
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    fetchAstronauts();
  }, []);

  const getRecordKey = (record: LotteryAstronaut) => `${record.camp}-${record.number}`;

  const redAstronauts = useMemo(() => astronauts.filter(item => item.camp === 'RED'), [astronauts]);
  const blueAstronauts = useMemo(() => astronauts.filter(item => item.camp === 'BLUE'), [astronauts]);

  const getVoyageCount = (camp: 'RED' | 'BLUE', number: string) => {
    const stat = voyageStats.find(item => item.camp === camp);
    return stat?.members.find(member => member.number === number)?.count;
  };

  const renderAstronautCards = (items: LotteryAstronaut[], camp: 'RED' | 'BLUE') => {
    const meta = campLabels[camp];
    const openVoyage = (record: LotteryAstronaut) => {
      navigate(`/lottery/astronauts/${record.camp.toLowerCase()}/${record.number}`);
    };

    return (
      <section className={`lottery-astronaut-card-section lottery-astronaut-card-section-${camp.toLowerCase()}`}>
        <div className="lottery-astronaut-card-section-header">
          <div>
          <Text type="secondary">{meta.group}</Text>
          <h2>{meta.label}</h2>
          </div>
          <Tag color={meta.color}>{items.length} 位</Tag>
        </div>

        <div className="lottery-astronaut-card-grid">
          {items.map(record => (
            <article
              className="lottery-astronaut-card"
              key={getRecordKey(record)}
              role="button"
              tabIndex={0}
              onClick={() => openVoyage(record)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openVoyage(record);
                }
              }}
            >
              <div className="lottery-astronaut-card-top">
                <span className={`lottery-astronaut-number lottery-astronaut-number-${record.camp.toLowerCase()}`}>
                  {record.number}
                </span>
              </div>
              <div className="lottery-astronaut-card-name">{record.name}</div>
              <div className="lottery-astronaut-voyage-count">
                <RocketOutlined />
                <span>{getVoyageCount(record.camp, record.number) ?? '-'} 次</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  };

  return (
    <LifePageShell
      eyebrow="Lottery / Interstellar"
      title="星际穿越宇航员"
      actions={(
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={fetchAstronauts} loading={loading}>
            刷新
          </Button>
          <Button icon={<RocketOutlined />} onClick={handleCalculateVoyageStats} loading={calculating}>
            统计出行
          </Button>
        </Space>
      )}
    >
      <Spin spinning={loading}>
        {astronauts.length > 0 ? (
          <div className="lottery-astronaut-card-layout">
            {renderAstronautCards(redAstronauts, 'RED')}
            {renderAstronautCards(blueAstronauts, 'BLUE')}
          </div>
        ) : (
          <Empty description="暂无宇航员名单" />
        )}
      </Spin>
    </LifePageShell>
  );
};

export default LotteryAstronautPage;
