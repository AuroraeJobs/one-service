import { useMemo } from 'react';
import { Button, Empty, Progress, Space, Tag } from 'antd';
import {
  BarChartOutlined,
  CompassOutlined,
  DatabaseOutlined,
  FieldTimeOutlined,
  LineChartOutlined,
  ReloadOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import LotteryBalls from './lottery/LotteryBalls';
import { useRecordContext } from '../contexts/RecordContext';
import { buildLotteryStats, type LotteryNumberProbability, type LotteryStats } from '../utils/lotteryStats';
import './LotteryOverviewPage.css';

interface AnalysisSignal {
  key: string;
  title: string;
  value: string;
  description: string;
  tone: 'red' | 'blue' | 'green' | 'purple' | 'orange';
}

interface CandidateLine {
  title: string;
  redNumbers: string[];
  blueNumber: string;
  confidence: number;
  reason: string;
  tags: string[];
}

const getSignalTone = (score: number): AnalysisSignal['tone'] => {
  if (score >= 80) return 'green';
  if (score >= 65) return 'blue';
  if (score >= 50) return 'orange';
  return 'red';
};

const getHotColdText = (items: LotteryNumberProbability[]) => {
  const hot = items.slice(0, 3).map(item => item.number).join(' ');
  const cold = [...items].sort((a, b) => a.probability - b.probability || Number(a.number) - Number(b.number)).slice(0, 3).map(item => item.number).join(' ');
  return `热 ${hot} / 冷 ${cold}`;
};

const buildAnalysisSignals = (stats: LotteryStats): AnalysisSignal[] => {
  const redHealth = stats.distributionHealth.find(item => item.key === 'red-uniformity');
  const blueHealth = stats.distributionHealth.find(item => item.key === 'blue-uniformity');
  const oddEvenHealth = stats.distributionHealth.find(item => item.key === 'odd-even-balance');
  const bigSmallHealth = stats.distributionHealth.find(item => item.key === 'big-small-balance');
  const zoneHealth = stats.distributionHealth.find(item => item.key === 'zone-balance');
  const strongestStructure = stats.structureInsights[0];
  const redPressure = stats.probabilityAnalysis.red.filter(item => item.omissionPressure >= 1).length;
  const bluePressure = stats.probabilityAnalysis.blue.filter(item => item.omissionPressure >= 1).length;

  return [
    {
      key: 'red-frequency',
      title: '红舰队频次离散',
      value: redHealth ? `${redHealth.healthScore}` : '-',
      description: redHealth ? `${redHealth.description} 当前 ${redHealth.actual}，最高 ${redHealth.richest || '-'}，最低 ${redHealth.poorest || '-'}` : '暂无红球频次数据',
      tone: getSignalTone(redHealth?.healthScore || 0)
    },
    {
      key: 'blue-frequency',
      title: '蓝舰队星球节奏',
      value: blueHealth ? `${blueHealth.healthScore}` : '-',
      description: blueHealth ? `${blueHealth.description} 当前 ${blueHealth.actual}，最高 ${blueHealth.richest || '-'}，最低 ${blueHealth.poorest || '-'}` : '暂无蓝球频次数据',
      tone: getSignalTone(blueHealth?.healthScore || 0)
    },
    {
      key: 'omission-pressure',
      title: '遗漏回补压力',
      value: `${redPressure + bluePressure}`,
      description: `红舰队 ${redPressure} 个号码、蓝舰队 ${bluePressure} 个星球当前遗漏超过历史平均值，继续缺席会提高回补压力。`,
      tone: redPressure + bluePressure >= 12 ? 'red' : redPressure + bluePressure >= 7 ? 'orange' : 'green'
    },
    {
      key: 'odd-even',
      title: '奇偶结构',
      value: oddEvenHealth ? `${oddEvenHealth.healthScore}` : '-',
      description: oddEvenHealth ? `${oddEvenHealth.actual}，近期目标组合 ${stats.probabilityAnalysis.summary.recentOddEvenCombination}` : '暂无奇偶结构数据',
      tone: getSignalTone(oddEvenHealth?.healthScore || 0)
    },
    {
      key: 'big-small',
      title: '大小结构',
      value: bigSmallHealth ? `${bigSmallHealth.healthScore}` : '-',
      description: bigSmallHealth ? `${bigSmallHealth.actual}，近期目标组合 ${stats.probabilityAnalysis.summary.recentBigSmallCombination}` : '暂无大小结构数据',
      tone: getSignalTone(bigSmallHealth?.healthScore || 0)
    },
    {
      key: 'zone',
      title: '三区覆盖',
      value: zoneHealth ? `${zoneHealth.healthScore}` : '-',
      description: zoneHealth ? `${zoneHealth.actual}，偏多 ${zoneHealth.richest || '-'}，偏少 ${zoneHealth.poorest || '-'}` : '暂无区间分布数据',
      tone: getSignalTone(zoneHealth?.healthScore || 0)
    },
    {
      key: 'structure-drift',
      title: '近期结构漂移',
      value: strongestStructure ? `${strongestStructure.delta > 0 ? '+' : ''}${strongestStructure.delta}%` : '-',
      description: strongestStructure ? `${strongestStructure.label} 近期 ${strongestStructure.recentPercentage}%，历史 ${strongestStructure.historicalPercentage}%` : '暂无近期结构变化',
      tone: Math.abs(strongestStructure?.delta || 0) >= 18 ? 'purple' : 'blue'
    },
    {
      key: 'hot-cold',
      title: '冷热交叉',
      value: `${stats.probabilityAnalysis.red[0]?.number || '-'} / ${stats.probabilityAnalysis.blue[0]?.number || '-'}`,
      description: `红球 ${getHotColdText(stats.probabilityAnalysis.red)}；蓝球 ${getHotColdText(stats.probabilityAnalysis.blue)}。`,
      tone: 'purple'
    }
  ];
};

const pickByRank = (items: LotteryNumberProbability[], start: number, size: number) =>
  items.slice(start, start + size).map(item => item.number).sort((a, b) => Number(a) - Number(b));

const buildCandidateLines = (stats: LotteryStats): CandidateLine[] => {
  const red = stats.probabilityAnalysis.red;
  const blue = stats.probabilityAnalysis.blue;
  if (!red.length || !blue.length) return [];

  const highPressureRed = red
    .filter(item => item.omissionPressure >= 1)
    .sort((a, b) => b.omissionPressure - a.omissionPressure || b.probability - a.probability)
    .slice(0, 6)
    .map(item => item.number)
    .sort((a, b) => Number(a) - Number(b));
  const highPressureBlue = blue
    .filter(item => item.omissionPressure >= 1)
    .sort((a, b) => b.omissionPressure - a.omissionPressure || b.probability - a.probability)[0]?.number || blue[0].number;

  return [
    {
      title: '综合概率线',
      redNumbers: pickByRank(red, 0, 6),
      blueNumber: blue[0].number,
      confidence: Math.min(96, Math.round(red.slice(0, 6).reduce((sum, item) => sum + item.probability, 0) / 6 * 9)),
      reason: '直接采用综合概率排名靠前号码，适合看历史频次、近期活跃和结构分的合力。',
      tags: ['概率优先', '频次+结构']
    },
    {
      title: '遗漏压力线',
      redNumbers: highPressureRed.length >= 6 ? highPressureRed : pickByRank(red, 0, 6),
      blueNumber: highPressureBlue,
      confidence: Math.min(96, Math.round(red.filter(item => item.omissionPressure >= 1).slice(0, 6).reduce((sum, item) => sum + item.omissionPressure, 0) * 12)),
      reason: '优先捕捉当前遗漏超过历史平均的号码；若继续未出现，压力会继续累计。',
      tags: ['遗漏回补', '压力递增']
    },
    {
      title: '结构平衡线',
      redNumbers: red
        .filter(item => item.factors.some(factor => factor.includes('性匹配') || factor.includes('号匹配')))
        .slice(0, 6)
        .map(item => item.number)
        .sort((a, b) => Number(a) - Number(b)),
      blueNumber: blue.find(item => item.omissionPressure >= 0.8)?.number || blue[1]?.number || blue[0].number,
      confidence: 72,
      reason: '按近期奇偶、大小、三区结构做平衡约束，避免只追热号造成结构过窄。',
      tags: ['奇偶大小', '区间覆盖']
    }
  ];
};

const SignalCard = ({ signal }: { signal: AnalysisSignal }) => (
  <div className={`lottery-deep-signal lottery-deep-signal-${signal.tone}`}>
    <div>
      <strong>{signal.title}</strong>
      <span>{signal.description}</span>
    </div>
    <b>{signal.value}</b>
  </div>
);

const NumberRadarCard = ({ item }: { item: LotteryNumberProbability }) => (
  <div className={`lottery-deep-number-card lottery-deep-number-card-${item.type}`}>
    <div className="lottery-deep-number-head">
      <strong>{item.number}</strong>
      <div>
        <span>{item.type === 'red' ? '红舰队' : '蓝舰队星球'}</span>
        <b>#{item.rank} · {item.probability}%</b>
      </div>
    </div>
    <div className="lottery-deep-number-meta">
      <span>历史 {item.historyCount}</span>
      <span>近期 {item.recentCount}</span>
      <span>遗漏 {item.currentOmission}</span>
      <span>压力 {item.omissionPressure}x</span>
    </div>
    <div className="lottery-deep-number-bars">
      {item.scoreParts.slice(0, item.type === 'red' ? 5 : 4).map(part => (
        <div key={part.label}>
          <span>{part.label}</span>
          <Progress percent={Math.min(100, Math.round(part.score * 4))} showInfo={false} size="small" />
          <b>{part.score}</b>
        </div>
      ))}
    </div>
  </div>
);

const CandidateCard = ({ item }: { item: CandidateLine }) => (
  <div className="lottery-deep-candidate-card">
    <div className="lottery-deep-candidate-head">
      <div>
        <strong>{item.title}</strong>
        <span>{item.reason}</span>
      </div>
      <Progress type="circle" percent={item.confidence} size={48} />
    </div>
    <LotteryBalls redNumbers={item.redNumbers} blueNumber={item.blueNumber} />
    <div className="lottery-deep-tag-row">
      {item.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
    </div>
  </div>
);

const LotteryDeepAnalysisPage = () => {
  const navigate = useNavigate();
  const { allRecords, loading, refreshRecords } = useRecordContext();
  const stats = useMemo(() => {
    try {
      return buildLotteryStats(allRecords);
    } catch (error) {
      console.error('深度规律分析数据构建失败:', error);
      return buildLotteryStats([]);
    }
  }, [allRecords]);
  const signals = useMemo(() => buildAnalysisSignals(stats), [stats]);
  const candidateLines = useMemo(() => buildCandidateLines(stats), [stats]);
  const topRed = stats.probabilityAnalysis.red.slice(0, 9);
  const topBlue = stats.probabilityAnalysis.blue.slice(0, 6);

  return (
    <LifePageShell
      className="lottery-deep-analysis-page"
      eyebrow="彩票数据"
      title="深度规律分析"
      actions={
        <Space wrap>
          <Button type="primary" icon={<ThunderboltOutlined />} onClick={() => navigate('/lottery/prediction')}>
            当前预测
          </Button>
          <Button icon={<BarChartOutlined />} onClick={() => navigate('/lottery/research')}>
            研究证据
          </Button>
          <Button icon={<DatabaseOutlined />} onClick={() => navigate('/lottery/records')}>
            开奖记录
          </Button>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={refreshRecords}>
            更新数据
          </Button>
        </Space>
      }
    >
      {stats.draws.length === 0 ? (
        <section className="lottery-clean-panel">
          <Empty description="暂无可分析的彩票数据" />
        </section>
      ) : (
        <section className="lottery-deep-analysis-layout">
          <section className="lottery-clean-panel lottery-deep-hero-panel">
            <div className="lottery-card-title-row">
              <div>
                <h2>综合方法雷达</h2>
                <p>按历史频次、近期漂移、遗漏压力、奇偶大小、区间覆盖和蓝舰队星球节奏综合评估。</p>
              </div>
              <CompassOutlined />
            </div>
            <div className="lottery-deep-method-strip">
              <div>
                <strong>{stats.draws.length}</strong>
                <span>历史样本</span>
              </div>
              <div>
                <strong>{stats.recentDrawCount}</strong>
                <span>近期窗口</span>
              </div>
              <div>
                <strong>{stats.latestDraw?.period || '-'}</strong>
                <span>最近期号</span>
              </div>
              <div>
                <strong>{stats.averageRedSum}</strong>
                <span>历史和值均值</span>
              </div>
            </div>
            <div className="lottery-deep-signal-grid">
              {signals.map(signal => <SignalCard key={signal.key} signal={signal} />)}
            </div>
          </section>

          <section className="lottery-clean-panel">
            <div className="lottery-card-title-row">
              <div>
                <h2>号码可能性雷达</h2>
                <p>红舰队看频次、遗漏、奇偶、大小和区间；蓝舰队只看星球节奏、频次和遗漏压力。</p>
              </div>
              <LineChartOutlined />
            </div>
            <div className="lottery-deep-number-grid">
              {topRed.map(item => <NumberRadarCard key={`red-${item.number}`} item={item} />)}
              {topBlue.map(item => <NumberRadarCard key={`blue-${item.number}`} item={item} />)}
            </div>
          </section>

          <section className="lottery-clean-panel">
            <div className="lottery-card-title-row">
              <div>
                <h2>候选线索</h2>
                <p>不是最终结论，而是把报告方法转成可复盘的几条观察路径。</p>
              </div>
              <FieldTimeOutlined />
            </div>
            <div className="lottery-deep-candidate-grid">
              {candidateLines.map(item => <CandidateCard key={item.title} item={item} />)}
            </div>
          </section>
        </section>
      )}
    </LifePageShell>
  );
};

export default LotteryDeepAnalysisPage;
