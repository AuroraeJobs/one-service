import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Empty, Space, Spin, Tag, Typography, message } from 'antd';
import { ReloadOutlined, RocketOutlined } from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import { useI18n } from '../contexts/I18nContext';
import { lotteryAstronautApi } from '../services/api';
import type { LotteryAstronaut, LotteryAstronautVoyageStat } from '../services/api';

const { Text } = Typography;

const campLabels: Record<string, {
  label: string;
  color: string;
  group: string;
}> = {
  RED: {
    label: '第一舰队',
    color: 'red',
    group: '七大行星探索',
  },
  BLUE: {
    label: '第二舰队',
    color: 'blue',
    group: '恒星卫星探索',
  }
};

const LotteryAstronautPage = () => {
  const navigate = useNavigate();
  const { t, translateText } = useI18n();
  const [astronauts, setAstronauts] = useState<LotteryAstronaut[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [voyageStats, setVoyageStats] = useState<LotteryAstronautVoyageStat[]>([]);

  const fetchAstronauts = useCallback(async () => {
    setLoading(true);
    try {
      const [data, stats] = await Promise.all([
        lotteryAstronautApi.findAll(),
        lotteryAstronautApi.getVoyageStats()
      ]);
      setAstronauts(data);
      setVoyageStats(stats);
    } catch {
      message.error(t('宇航员名单加载失败'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleCalculateVoyageStats = async () => {
    setCalculating(true);
    try {
      const stats = await lotteryAstronautApi.calculateVoyageStats();
      setVoyageStats(stats);
      message.success(t('出行次数统计已更新'));
    } catch {
      message.error(t('出行次数统计失败'));
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    void fetchAstronauts();
  }, [fetchAstronauts]);

  const getRecordKey = (record: LotteryAstronaut) => `${record.camp}-${record.number}`;

  const redAstronauts = useMemo(() => astronauts.filter(item => item.camp === 'RED'), [astronauts]);
  const blueAstronauts = useMemo(() => astronauts.filter(item => item.camp === 'BLUE'), [astronauts]);

  const getVoyageCount = (camp: 'RED' | 'BLUE', number: string) => {
    const stat = voyageStats.find(item => item.camp === camp);
    return stat?.members.find(member => member.number === number)?.count;
  };

  const formatVoyageCount = (count?: number) => {
    if (count === undefined) return '-';
    return t('{{count}} 次', { count });
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
          <Text type="secondary">{t(meta.group)}</Text>
          <h2>{t(meta.label)}</h2>
          </div>
          <Tag color={meta.color}>
            {t('{{count}} 位宇航员', { count: items.length })}
          </Tag>
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
              <div className="lottery-astronaut-card-name">{translateText(record.name)}</div>
              <div className="lottery-astronaut-voyage-count">
                <RocketOutlined />
                <span>{formatVoyageCount(getVoyageCount(record.camp, record.number))}</span>
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
      title={t('星际穿越宇航员')}
      actions={(
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={fetchAstronauts} loading={loading}>
            {t('刷新')}
          </Button>
          <Button icon={<RocketOutlined />} onClick={handleCalculateVoyageStats} loading={calculating}>
            {t('统计出行')}
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
          <Empty description={t('暂无宇航员名单')} />
        )}
      </Spin>
    </LifePageShell>
  );
};

export default LotteryAstronautPage;
