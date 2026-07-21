import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Calendar, Card, Empty, Select, Space, Spin, Tag, Tooltip, message, type CalendarProps } from 'antd';
import { ArrowLeftOutlined, RocketOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import LifePageShell from './LifePageShell';
import { useI18n } from '../contexts/I18nContext';
import { useRecordContext } from '../contexts/RecordContext';
import { lotteryAstronautApi } from '../services/api';
import type { LotteryAstronaut, LotteryAstronautVoyage, LotteryAstronautVoyageRecord } from '../services/api';

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

interface VoyageCalendarRecord extends LotteryAstronautVoyageRecord {
  drawDate: string;
  dateKey: string;
}

const LotteryAstronautVoyagePage = () => {
  const navigate = useNavigate();
  const { t, translateText } = useI18n();
  const { lotteryDraws, loading: recordsLoading } = useRecordContext();
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
        message.error(t('航行记录加载失败'));
      } finally {
        setLoading(false);
      }
    };

    loadVoyage();
  }, [camp, number, t]);

  const astronaut = useMemo(() => (
    voyage?.astronaut || astronauts.find(item => item.camp === camp && item.number === number)
  ), [astronauts, camp, number, voyage]);

  const voyageRecords = useMemo(() => voyage?.records || [], [voyage?.records]);
  const voyageCalendarRecords = useMemo<VoyageCalendarRecord[]>(() => {
    const drawDateByPeriod = new Map<number, string>();
    lotteryDraws.forEach(draw => {
      if (typeof draw.period === 'number' && draw.drawDate) {
        drawDateByPeriod.set(draw.period, draw.drawDate);
      }
    });

    return voyageRecords
      .map(record => {
        const drawDate = drawDateByPeriod.get(record.period);
        if (!drawDate) {
          return null;
        }
        return {
          ...record,
          drawDate,
          dateKey: dayjs(drawDate).format('YYYY-MM-DD')
        };
      })
      .filter((record): record is VoyageCalendarRecord => Boolean(record));
  }, [lotteryDraws, voyageRecords]);
  const voyageCalendarByDate = useMemo(() => {
    const grouped = new Map<string, VoyageCalendarRecord[]>();
    voyageCalendarRecords.forEach(record => {
      const current = grouped.get(record.dateKey) || [];
      current.push(record);
      grouped.set(record.dateKey, current);
    });
    return grouped;
  }, [voyageCalendarRecords]);
  const calendarValue = useMemo(() => {
    const latestRecord = [...voyageCalendarRecords].sort((left, right) => (
      right.drawDate.localeCompare(left.drawDate) || right.period - left.period
    ))[0];
    return latestRecord ? dayjs(latestRecord.drawDate) : dayjs();
  }, [voyageCalendarRecords]);
  const calendarSpinning = loading || recordsLoading;

  const availableAstronauts = useMemo(() => (
    astronauts
      .filter(item => item.camp === camp)
      .map(item => ({
        value: item.number,
        label: t('{{number}} {{name}}', {
          number: item.number,
          name: item.name ? translateText(item.name) : t('未命名')
        })
      }))
  ), [astronauts, camp, t, translateText]);

  const title = astronaut
    ? t('{{name}}的航行记录', { name: translateText(astronaut.name) })
    : t('{{number}}号宇航员航行记录', { number });
  const isBlueVoyage = camp === 'BLUE';
  const localizePlanetName = (name?: string) => name ? translateText(name) : '-';
  const localizeHexagramName = (name?: string) => name ? translateText(name) : '-';
  const renderCalendarCell: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
    if (info.type !== 'date') {
      return info.originNode;
    }

    const dayKey = current.format('YYYY-MM-DD');
    const dayRecords = voyageCalendarByDate.get(dayKey) || [];

    if (!dayRecords.length) {
      return info.originNode;
    }

    const previewRecord = dayRecords[0];
    const overflowCount = Math.max(0, dayRecords.length - 1);
    const countColor = isBlueVoyage ? '#1677ff' : '#cf1322';

    return (
      <div className="lottery-voyage-calendar-cell">
        {info.originNode}
        <Tooltip
          title={(
            <div className="lottery-voyage-calendar-tooltip">
              {dayRecords.map(record => (
                <div key={record.id}>
                  <strong>{t('第 {{period}} 期', { period: record.period })}</strong>
                  <span>{localizePlanetName(record.planetName)}</span>
                </div>
              ))}
            </div>
          )}
        >
          <div className="lottery-voyage-calendar-markers">
            <Badge count={dayRecords.length} style={{ backgroundColor: countColor }} />
            <span>{localizePlanetName(previewRecord.planetName)}</span>
            {overflowCount > 0 ? <em>+{overflowCount}</em> : null}
          </div>
        </Tooltip>
      </div>
    );
  };

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
      oddTotal,
      evenTotal,
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
      eyebrow={t('彩票 / 宇航员航行')}
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
            {t('返回名单')}
          </Button>
        </Space>
      )}
    >
      <Spin spinning={calendarSpinning}>
        {voyageRecords.length > 0 ? (
          <>
            <section
              className="lottery-voyage-calendar-panel"
              aria-label={t('航行日历')}
            >
              <Card
                className="life-panel-card lottery-clean-panel"
                title={t('航行日历')}
                extra={(
                  <span className="lottery-voyage-calendar-hint">
                    {t('按开奖日期展示航行记录。')}
                  </span>
                )}
              >
                <div className="lottery-voyage-calendar-summary">
                  <div>
                    <strong>{voyageCalendarByDate.size}</strong>
                    <span>{t('航行日期')}</span>
                  </div>
                  <div>
                    <strong>{voyageCalendarRecords.length}</strong>
                    <span>{t('已匹配记录')}</span>
                  </div>
                  <div>
                    <strong>{voyageCalendarRecords.length ? calendarValue.format('YYYY-MM-DD') : '-'}</strong>
                    <span>{t('最近日期')}</span>
                  </div>
                </div>
                <Calendar
                  className="lottery-voyage-calendar"
                  fullscreen={false}
                  value={calendarValue}
                  cellRender={renderCalendarCell}
                />
              </Card>
            </section>

            <section
              className="lottery-voyage-summary"
              aria-label={t('航行分析摘要')}
            >
              <Card size="small">
                <span>{t('航行总数')}</span>
                <strong>{voyageAnalysis.total}</strong>
                <small>
                  {t('第 {{startPeriod}} - {{endPeriod}} 期', {
                    startPeriod: voyageAnalysis.earliestRecord?.period || '-',
                    endPeriod: voyageAnalysis.latestRecord?.period || '-'
                  })}
                </small>
              </Card>
              <Card size="small">
                <span>{t('最近航行')}</span>
                <strong>{localizePlanetName(voyageAnalysis.latestRecord?.planetName)}</strong>
                <small>
                  {t('第 {{period}} 期', {
                    period: voyageAnalysis.latestRecord?.period || '-'
                  })}
                </small>
              </Card>
              <Card size="small">
                <span>{t('主访问星球')}</span>
                <strong>{localizePlanetName(voyageAnalysis.planetDistribution[0]?.name)}</strong>
                <small>
                  {t('{{count}} 次访问', {
                    count: voyageAnalysis.planetDistribution[0]?.count || 0
                  })}
                </small>
              </Card>
              <Card size="small">
                <span>{t('平均间隔')}</span>
                <strong>{voyageAnalysis.averageGap ? voyageAnalysis.averageGap.toFixed(1) : '-'}</strong>
                <small>{t('期 / 次')}</small>
              </Card>
            </section>

            <section
              className="lottery-voyage-analysis-grid"
              aria-label={t('航行结构分析')}
            >
              <Card
                className="life-panel-card lottery-clean-panel"
                title={t('星球分布')}
              >
                <div className="lottery-voyage-analysis-list">
                  {voyageAnalysis.planetDistribution.slice(0, 8).map(item => (
                    <div key={item.name}>
                      <span>{localizePlanetName(item.name)}</span>
                      <strong>{item.count}</strong>
                      <em style={{ width: `${Math.max(8, (item.count / voyageAnalysis.total) * 100)}%` }} />
                    </div>
                  ))}
                </div>
              </Card>
              {isBlueVoyage ? (
                <Card
                  className="life-panel-card lottery-clean-panel"
                  title={t('蓝舰队星球节奏')}
                >
                  <div className="lottery-voyage-hexagram-summary">
                    <strong>{localizePlanetName(voyageAnalysis.planetDistribution[0]?.name)}</strong>
                    <span>
                      {t('主星占比 {{percent}}%', {
                        percent: voyageAnalysis.primaryPlanetPercent
                      })}
                    </span>
                    <span>
                      {voyageAnalysis.latestGap
                        ? t('最近间隔 {{count}} 期', { count: voyageAnalysis.latestGap })
                        : t('最近间隔 -')}
                    </span>
                    <span>
                      {voyageAnalysis.longestGap
                        ? t('间隔范围 {{shortest}} - {{longest}} 期', {
                            shortest: voyageAnalysis.shortestGap,
                            longest: voyageAnalysis.longestGap
                          })
                        : t('间隔范围 -')}
                    </span>
                  </div>
                </Card>
              ) : (
                <Card
                  className="life-panel-card lottery-clean-panel"
                  title={t('红舰队卦象与结构')}
                >
                  <div className="lottery-voyage-hexagram-summary">
                    <strong>{localizeHexagramName(voyageAnalysis.hexagramDistribution[0]?.name)}</strong>
                    <span>
                      {t('最高频卦象 {{count}} 次', {
                        count: voyageAnalysis.hexagramDistribution[0]?.count || 0
                      })}
                    </span>
                    <span>
                      {t('平均和值 {{value}}', {
                        value: voyageAnalysis.averageRedSum
                          ? voyageAnalysis.averageRedSum.toFixed(1)
                          : '-'
                      })}
                    </span>
                    <span>
                      {t('累计奇偶 {{odd}}奇 / {{even}}偶', {
                        odd: voyageAnalysis.oddTotal,
                        even: voyageAnalysis.evenTotal
                      })}
                    </span>
                  </div>
                </Card>
              )}
              <Card
                className="life-panel-card lottery-clean-panel"
                title={t('近 12 次趋势')}
              >
                <div className="lottery-voyage-trend-tags">
                  {voyageAnalysis.recentPlanets.length ? voyageAnalysis.recentPlanets.map(item => (
                    <Tag key={item.name} color={planetColors[item.name] ? 'blue' : 'default'}>
                      {localizePlanetName(item.name)} {item.count}
                    </Tag>
                  )) : <Tag>{t('暂无趋势')}</Tag>}
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
                    <strong>{localizePlanetName(record.planetName)}</strong>
                  </div>
                  <div className="lottery-voyage-item-main">
                    <div>
                      <div className="lottery-voyage-period">
                        {t('第 {{period}} 期', { period: record.period })}
                      </div>
                      <div className="lottery-voyage-balls">
                        {record.redNumbers.length > 0 ? record.redNumbers.join(' ') : record.blueNumber || record.raw}
                      </div>
                    </div>
                  </div>
                  <div className="lottery-voyage-tags">
                    {isBlueVoyage ? (
                      <>
                        <Tag color="blue">
                          {t('蓝球 {{number}}', {
                            number: record.blueNumber || record.raw
                          })}
                        </Tag>
                        <Tag>
                          {t('星球 {{name}}', {
                            name: localizePlanetName(record.planetName)
                          })}
                        </Tag>
                      </>
                    ) : (
                      <>
                        <Tag color="gold">{localizeHexagramName(record.hexagramName)}</Tag>
                        <Tag>{t('和值 {{sum}}', { sum: record.redSum })}</Tag>
                        <Tag>
                          {t('{{odd}}奇{{even}}偶', {
                            odd: record.oddCount,
                            even: record.evenCount
                          })}
                        </Tag>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </section>
          </>
        ) : (
          <Empty
            description={t('这个宇航员暂时没有航行记录')}
          />
        )}
      </Spin>
    </LifePageShell>
  );
};

export default LotteryAstronautVoyagePage;
