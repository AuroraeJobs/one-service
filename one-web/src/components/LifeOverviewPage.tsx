import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Progress, Space, Tag } from 'antd';
import {
  ApiOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import MetricCard from './MetricCard';
import MetricGrid from './MetricGrid';
import LifePageShell from './LifePageShell';
import { useI18n } from '../contexts/I18nContext';
import { useRecordContext } from '../contexts/RecordContext';
import { chargeRecordApi, salaryRecordApi, type ChargeStatistics, type SalaryStatistics } from '../services/api';
import {
  getLifeModuleDescription,
  getLifeModuleLiveCapabilities,
  getLifeModuleTitle,
  getLifeStatusText,
  lifeDataModules,
  type LifeDataModule,
  type LifeModuleStatus
} from '../constants/lifeDataModules';

const statusColor: Record<LifeModuleStatus, string> = {
  live: 'success',
  partial: 'processing',
  planned: 'default'
};

const nextConnectionPriorities = [
  '现金流账本：支付宝、微信、银行卡账单导入',
  '车辆数据：Tesla Fleet API、油车加油记录',
  '投资资产：券商持仓、基金账户、行情数据',
  '彩票账户：下注、中奖、成本收益归集',
];

const getRecordCount = (allRecords: string | string[]) => {
  if (!allRecords) return 0;
  if (typeof allRecords === 'string') {
    return allRecords
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0).length;
  }
  return allRecords.length;
};

const getModuleScore = (module: LifeDataModule) => {
  const total = module.liveCapabilities.length + module.plannedCapabilities.length;
  if (total === 0) return 0;
  return Math.round((module.liveCapabilities.length / total) * 100);
};

const LifeOverviewPage = () => {
  const navigate = useNavigate();
  const { language, t } = useI18n();
  const { allRecords } = useRecordContext();
  const [chargeStats, setChargeStats] = useState<ChargeStatistics | null>(null);
  const [salaryStats, setSalaryStats] = useState<SalaryStatistics | null>(null);

  useEffect(() => {
    const loadOverviewStats = async () => {
      const [chargeResult, salaryResult] = await Promise.allSettled([
        chargeRecordApi.getStatistics(),
        salaryRecordApi.getStatistics()
      ]);

      if (chargeResult.status === 'fulfilled') {
        setChargeStats(chargeResult.value);
      }

      if (salaryResult.status === 'fulfilled') {
        setSalaryStats(salaryResult.value);
      }
    };

    loadOverviewStats();
  }, []);

  const lotteryCount = useMemo(() => getRecordCount(allRecords), [allRecords]);
  const liveModules = lifeDataModules.filter(module => module.status !== 'planned').length;
  const totalCapabilities = lifeDataModules.reduce((sum, module) => sum + module.liveCapabilities.length, 0);

  return (
    <LifePageShell
      className="life-overview-page"
      eyebrow={t('个人生活数据中台')}
      title={t('把车辆、收入、投资、账单和彩票沉淀成自己的生活仪表盘。')}
      actions={
        <Space wrap>
          <Button type="primary" icon={<DatabaseOutlined />} onClick={() => navigate('/connections')}>
            {t('数据接入')}
          </Button>
          <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/vehicle/charging')}>
            {t('查看车辆')}
          </Button>
        </Space>
      }
    >
      <MetricGrid gap={16} minColumnWidth={190}>
        <MetricCard title={t('已接入模块')} value={`${liveModules}/${lifeDataModules.length}`} prefix={<CheckCircleFilled />} accent="#34c759" />
        <MetricCard title={t('沉淀能力点')} value={totalCapabilities} prefix={<ApiOutlined />} accent="#0071e3" />
        <MetricCard title={t('彩票记录')} value={lotteryCount} prefix={<DatabaseOutlined />} accent="#ff3b30" />
        <MetricCard title={t('充电次数')} value={chargeStats?.totalCharges ?? 0} prefix={<ClockCircleOutlined />} accent="#5856d6" />
        <MetricCard title={t('累计实发')} value={salaryStats?.totalActualIncome?.toFixed?.(0) ?? 0} prefix="¥" accent="#34c759" />
      </MetricGrid>

      <section className="life-section-grid">
        {lifeDataModules.map(module => {
          const score = getModuleScore(module);

          return (
            <Card
              key={module.id}
              className="life-module-card"
              hoverable
              onClick={() => navigate(module.path)}
            >
              <div className="life-module-card-head">
                <span className="life-module-icon" style={{ color: module.accent }}>
                  {module.icon}
                </span>
                <Tag color={statusColor[module.status]}>{getLifeStatusText(module.status, language)}</Tag>
              </div>

              <h2>{getLifeModuleTitle(module, language)}</h2>
              <p>{getLifeModuleDescription(module, language)}</p>

              <Progress
                percent={score}
                showInfo={false}
                strokeColor={module.accent}
                trailColor="rgba(127, 127, 127, 0.14)"
              />

              <div className="life-chip-row">
                {getLifeModuleLiveCapabilities(module, language).slice(0, 3).map(capability => (
                  <span key={capability}>{capability}</span>
                ))}
                {module.liveCapabilities.length === 0 && <span>{t('等待接入')}</span>}
              </div>
            </Card>
          );
        })}
      </section>

      <section className="life-two-column">
        <Card className="life-panel-card">
          <h2>{t('当前系统已经有的骨架')}</h2>
          <div className="life-timeline">
            <div>
              <strong>{t('彩票数据')}</strong>
              <span>{t('历史开奖、统计、分析、卦象视图已经形成完整闭环。')}</span>
            </div>
            <div>
              <strong>{t('车辆能源')}</strong>
              <span>{t('电车充电记录、成本、充电站已经可以继续扩展到 Fleet API。')}</span>
            </div>
            <div>
              <strong>{t('工资税费')}</strong>
              <span>{t('工资、五险一金、个税和实发收入已经有基础模型。')}</span>
            </div>
          </div>
        </Card>

        <Card className="life-panel-card">
          <h2>{t('下一步数据接入顺序')}</h2>
          <div className="life-priority-list">
            {nextConnectionPriorities.map((item, index) => (
              <button key={item} type="button" onClick={() => navigate('/connections')}>
                <span>{index + 1}</span>
                {t(item)}
              </button>
            ))}
          </div>
        </Card>
      </section>
    </LifePageShell>
  );
};

export default LifeOverviewPage;
