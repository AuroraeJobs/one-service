import { useEffect, useMemo, useState } from 'react';
import { Button, Empty, Form, Input, InputNumber, Modal, Tag, message } from 'antd';
import { EditOutlined, FieldTimeOutlined, TrophyOutlined } from '@ant-design/icons';
import LotteryBalls from './LotteryBalls';
import type { LotteryNumberProbability, LotteryPrediction, LotteryStats } from '../../utils/lotteryStats';
import {
  lotteryTrainingApi,
  type LotteryActualRecord,
  type LotteryLatestPrediction
} from '../../services/api';
import { useI18n } from '../../contexts/I18nContext';

interface LotteryPredictionInsightsProps {
  stats: LotteryStats;
  trainedPrediction?: LotteryLatestPrediction;
  actualRecord?: LotteryActualRecord;
  onPredictionUpdated?: (prediction?: LotteryLatestPrediction) => void;
  onActualRecordUpdated?: (record?: LotteryActualRecord) => void;
}

interface SimplePredictionCardProps {
  title: string;
  redNumbers: string[];
  blueNumber: string;
  score?: number;
  tag: string;
  tone?: 'gold' | 'red' | 'blue';
  meta?: string[];
  actualRecord?: LotteryActualRecord;
}

interface PredictionStructure {
  sum: number;
  oddCount: number;
  bigCount: number;
  zoneCounts: number[];
  consecutivePairs: number;
  span: number;
}

interface PredictionConsensusItem {
  number: string;
  count: number;
}

interface PredictionConsensus {
  red: PredictionConsensusItem[];
  blue: PredictionConsensusItem[];
}

interface PredictionCandidateLike {
  title?: string;
  redNumbers: string[];
  blueNumber: string;
  score?: number;
}

interface PredictionReviewItem extends PredictionCandidateLike {
  title: string;
  source: string;
  score?: number;
}

interface PredictionReviewResult extends PredictionReviewItem {
  redHits: number;
  blueHit: boolean;
  prizeName: string;
  reviewScore: number;
}

const getPredictionStructure = (redNumbers: string[]): PredictionStructure => {
  const values = redNumbers.map(Number).sort((a, b) => a - b);
  const sum = values.reduce((total, value) => total + value, 0);
  const oddCount = values.filter(value => value % 2 === 1).length;
  const bigCount = values.filter(value => value >= 17).length;
  const zoneCounts = [
    values.filter(value => value >= 1 && value <= 11).length,
    values.filter(value => value >= 12 && value <= 22).length,
    values.filter(value => value >= 23 && value <= 33).length
  ];
  const consecutivePairs = values.slice(1).filter((value, index) => value - values[index] === 1).length;
  const span = values.length > 0 ? values[values.length - 1] - values[0] : 0;

  return { sum, oddCount, bigCount, zoneCounts, consecutivePairs, span };
};

const getStructureTone = (
  structure: PredictionStructure,
  translateText: ReturnType<typeof useI18n>['translateText']
) => {
  const balancedOddEven = structure.oddCount >= 2 && structure.oddCount <= 4;
  const balancedBigSmall = structure.bigCount >= 2 && structure.bigCount <= 4;
  const coveredZones = structure.zoneCounts.filter(count => count > 0).length;
  const balancedSum = structure.sum >= 70 && structure.sum <= 130;
  const balancedSpan = structure.span >= 16 && structure.span <= 30;
  const score = [balancedOddEven, balancedBigSmall, coveredZones >= 2, balancedSum, balancedSpan]
    .filter(Boolean).length;

  if (score >= 4) return { label: translateText('结构均衡'), tone: 'good' };
  if (score >= 3) return { label: translateText('结构可用'), tone: 'steady' };
  return { label: translateText('结构偏态'), tone: 'warn' };
};

const buildPredictionConsensus = (candidates: PredictionCandidateLike[]): PredictionConsensus => {
  const redCounts = new Map<string, number>();
  const blueCounts = new Map<string, number>();

  candidates.forEach(candidate => {
    candidate.redNumbers.forEach(number => {
      redCounts.set(number, (redCounts.get(number) || 0) + 1);
    });
    blueCounts.set(candidate.blueNumber, (blueCounts.get(candidate.blueNumber) || 0) + 1);
  });

  const toSortedItems = (counts: Map<string, number>) => Array.from(counts.entries())
    .map(([number, count]) => ({ number, count }))
    .sort((a, b) => b.count - a.count || Number(a.number) - Number(b.number));

  return {
    red: toSortedItems(redCounts).slice(0, 10),
    blue: toSortedItems(blueCounts).slice(0, 6)
  };
};

const buildConsensusTicket = (consensus: PredictionConsensus): PredictionCandidateLike | undefined => {
  const redNumbers = consensus.red
    .slice(0, 6)
    .map(item => item.number)
    .sort((a, b) => Number(a) - Number(b));
  const blueNumber = consensus.blue[0]?.number;

  if (redNumbers.length !== 6 || !blueNumber) {
    return undefined;
  }

  return { redNumbers, blueNumber };
};

const getPrizeName = (redHits: number, blueHit: boolean) => {
  if (redHits === 6 && blueHit) return '一等奖';
  if (redHits === 6) return '二等奖';
  if (redHits === 5 && blueHit) return '三等奖';
  if (redHits === 5 || (redHits === 4 && blueHit)) return '四等奖';
  if (redHits === 4 || (redHits === 3 && blueHit)) return '五等奖';
  if (blueHit) return '六等奖';
  return '未中奖';
};

const reviewPrediction = (
  prediction: PredictionReviewItem,
  actualRecord: LotteryActualRecord,
  translateText: ReturnType<typeof useI18n>['translateText']
): PredictionReviewResult => {
  const redHits = prediction.redNumbers.filter(number => actualRecord.redNumbers.includes(number)).length;
  const blueHit = prediction.blueNumber === actualRecord.blueNumber;
  return {
    ...prediction,
    redHits,
    blueHit,
    prizeName: translateText(getPrizeName(redHits, blueHit)),
    reviewScore: redHits * 12 + (blueHit ? 10 : 0)
  };
};

const PredictionStructureCheck = ({
  redNumbers,
  blueNumber
}: {
  redNumbers: string[];
  blueNumber: string;
}) => {
  const { t, translateText } = useI18n();
  const structure = getPredictionStructure(redNumbers);
  const tone = getStructureTone(structure, translateText);
  const evenCount = redNumbers.length - structure.oddCount;
  const smallCount = redNumbers.length - structure.bigCount;

  return (
    <div className={`lottery-prediction-structure lottery-prediction-structure-${tone.tone}`}>
      <div className="lottery-prediction-structure-head">
        <strong>{t('预测结构体检')}</strong>
        <Tag>{tone.label}</Tag>
      </div>
      <div className="lottery-prediction-structure-grid">
        <div>
          <strong>{structure.sum}</strong>
          <span>{t('红球和值')}</span>
        </div>
        <div>
          <strong>{structure.oddCount}:{evenCount}</strong>
          <span>{t('奇偶')}</span>
        </div>
        <div>
          <strong>{structure.bigCount}:{smallCount}</strong>
          <span>{t('大小')}</span>
        </div>
        <div>
          <strong>{structure.zoneCounts.join('-')}</strong>
          <span>{t('三区')}</span>
        </div>
        <div>
          <strong>{structure.consecutivePairs}</strong>
          <span>{t('连号组')}</span>
        </div>
        <div>
          <strong>{structure.span}</strong>
          <span>{t('跨度')}</span>
        </div>
        <div>
          <strong>{Number(blueNumber) % 2 === 1 ? t('奇') : t('偶')}</strong>
          <span>{t('蓝球奇偶')}</span>
        </div>
      </div>
    </div>
  );
};

const SimplePredictionCard = ({
  title,
  redNumbers,
  blueNumber,
  score,
  tag,
  tone = 'red',
  meta = [],
  actualRecord
}: SimplePredictionCardProps) => {
  const { t, translateText } = useI18n();

  return (
    <div className={`lottery-simple-prediction-card lottery-simple-prediction-card-${tone}`}>
      <div className="lottery-prediction-card-head">
        <div>
          <strong>{translateText(title)}</strong>
          {typeof score === 'number' && <span>{t('参考评分 {{score}}', { score })}</span>}
        </div>
        <Tag color={tone === 'gold' ? 'gold' : tone}>{translateText(tag)}</Tag>
      </div>
      <LotteryBalls
        redNumbers={redNumbers}
        blueNumber={blueNumber}
        hitRedNumbers={actualRecord?.redNumbers}
        hitBlueNumber={actualRecord?.blueNumber}
      />
      {meta.length > 0 && (
        <div className="lottery-prediction-tags">
          {meta.filter(Boolean).map(item => (
            <span key={item}>{translateText(item)}</span>
          ))}
        </div>
      )}
    </div>
  );
};

const RulePredictionList = ({
  predictions,
  actualRecord
}: {
  predictions: LotteryPrediction[];
  actualRecord?: LotteryActualRecord;
}) => {
  const { t, translateText } = useI18n();

  return (
    <div className="lottery-simple-secondary-list">
      {predictions.slice(0, 2).map(prediction => (
        <SimplePredictionCard
          key={prediction.title}
          title={translateText(prediction.title)}
          redNumbers={prediction.redNumbers}
          blueNumber={prediction.blueNumber}
          score={prediction.score}
          tag={t('规则')}
          tone="red"
          meta={prediction.tags.slice(0, 2).map(item => translateText(item))}
          actualRecord={actualRecord}
        />
      ))}
    </div>
  );
};

const PredictionConsensusPanel = ({
  consensus,
  candidateCount,
  actualRecord
}: {
  consensus: PredictionConsensus;
  candidateCount: number;
  actualRecord?: LotteryActualRecord;
}) => {
  const { t } = useI18n();

  if (candidateCount < 2 || consensus.red.length === 0) {
    return null;
  }

  const consensusTicket = buildConsensusTicket(consensus);
  const consensusRedTotal = consensus.red.slice(0, 6).reduce((total, item) => total + item.count, 0);
  const consensusBlueCount = consensus.blue[0]?.count || 0;

  return (
    <div className="lottery-prediction-consensus">
      <div className="lottery-prediction-consensus-head">
        <strong>{t('候选共识')}</strong>
        <span>{t('来自 {{count}} 组候选', { count: candidateCount })}</span>
      </div>
      {consensusTicket && (
        <div className="lottery-prediction-consensus-ticket">
          <div>
            <strong>{t('共识组合')}</strong>
            <span>{t('红球 {{redVotes}} · 蓝球 {{blueVotes}}', {
              redVotes: consensusRedTotal,
              blueVotes: consensusBlueCount
            })}</span>
          </div>
          <LotteryBalls
            redNumbers={consensusTicket.redNumbers}
            blueNumber={consensusTicket.blueNumber}
            hitRedNumbers={actualRecord?.redNumbers}
            hitBlueNumber={actualRecord?.blueNumber}
          />
        </div>
      )}
      <div className="lottery-prediction-consensus-group lottery-prediction-consensus-group-red">
        {consensus.red.map(item => {
          const isHit = actualRecord?.redNumbers?.includes(item.number);
          return (
            <span key={item.number} className={isHit ? 'lottery-prediction-consensus-hit' : undefined}>
              <strong>{item.number}</strong>
              <small>{item.count}</small>
            </span>
          );
        })}
      </div>
      <div className="lottery-prediction-consensus-group lottery-prediction-consensus-group-blue">
        {consensus.blue.map(item => {
          const isHit = actualRecord?.blueNumber === item.number;
          return (
            <span key={item.number} className={isHit ? 'lottery-prediction-consensus-hit' : undefined}>
              <strong>{item.number}</strong>
              <small>{item.count}</small>
            </span>
          );
        })}
      </div>
    </div>
  );
};

const PredictionHitReviewPanel = ({
  actualRecord,
  items,
  onEditActualRecord
}: {
  actualRecord?: LotteryActualRecord;
  items: PredictionReviewItem[];
  onEditActualRecord: () => void;
}) => {
  const { t, translateText } = useI18n();
  const reviewItems = useMemo(() => {
    if (!actualRecord || items.length === 0) {
      return [];
    }

    return items
      .map(item => reviewPrediction(item, actualRecord, translateText))
      .sort((a, b) => b.reviewScore - a.reviewScore || b.redHits - a.redHits || Number(a.blueNumber) - Number(b.blueNumber));
  }, [actualRecord, items, translateText]);

  if (!actualRecord) {
    return (
      <div className="lottery-prediction-hit-review">
        <div className="lottery-prediction-hit-review-head">
          <div>
            <strong>{t('命中复盘')}</strong>
            <span>{t('录入最新开奖号后自动对照预测结果。')}</span>
          </div>
          <Button size="small" type="primary" onClick={onEditActualRecord}>
            {t('录入开奖号')}
          </Button>
        </div>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('暂无最新开奖号，暂不能复盘命中情况')}
        />
      </div>
    );
  }

  if (reviewItems.length === 0) {
    return null;
  }

  const bestRedHits = reviewItems[0].redHits;
  const blueHitCount = reviewItems.filter(item => item.blueHit).length;
  const averageRedHits = (reviewItems.reduce((total, item) => total + item.redHits, 0) / reviewItems.length).toFixed(1);
  const sourceSummary = Array.from(
    reviewItems.reduce((summary, item) => {
      const current = summary.get(item.source) || { source: item.source, count: 0, redHits: 0, bestRedHits: 0, blueHits: 0 };
      current.count += 1;
      current.redHits += item.redHits;
      current.bestRedHits = Math.max(current.bestRedHits, item.redHits);
      current.blueHits += item.blueHit ? 1 : 0;
      summary.set(item.source, current);
      return summary;
    }, new Map<string, { source: string; count: number; redHits: number; bestRedHits: number; blueHits: number }>())
  ).map(([, item]) => ({
    ...item,
    averageRedHits: (item.redHits / item.count).toFixed(1)
  }));
  const actualCoverage = actualRecord.redNumbers.map(number => ({
    number,
    count: reviewItems.filter(item => item.redNumbers.includes(number)).length
  }));
  const missedActualRedNumbers = actualCoverage.filter(item => item.count === 0).map(item => item.number);
  const actualBlueCoverage = reviewItems.filter(item => item.blueHit).length;

  return (
    <div className="lottery-prediction-hit-review">
      <div className="lottery-prediction-hit-review-head">
        <div>
          <strong>{t('命中复盘')}</strong>
          <span>{t('对照第 {{period}} 期最新开奖号', { period: actualRecord.period })}</span>
        </div>
        <Tag color={reviewItems[0].prizeName === t('未中奖') ? 'default' : 'gold'}>
          {t('最佳 {{prizeName}} · 红球 {{redHits}}/6', {
            prizeName: reviewItems[0].prizeName,
            redHits: reviewItems[0].redHits
          })}
        </Tag>
      </div>
      <div className="lottery-prediction-hit-review-summary">
        <div>
          <strong>{reviewItems.length}</strong>
          <span>{t('复盘组数')}</span>
        </div>
        <div>
          <strong>{bestRedHits}/6</strong>
          <span>{t('最佳红球')}</span>
        </div>
        <div>
          <strong>{blueHitCount}</strong>
          <span>{t('蓝球命中')}</span>
        </div>
        <div>
          <strong>{averageRedHits}</strong>
          <span>{t('平均红球')}</span>
        </div>
      </div>
      <div className="lottery-prediction-hit-review-source">
        {sourceSummary.map(item => (
          <div key={item.source}>
            <strong>{translateText(item.source)}</strong>
            <span>{t('{{count}} 组', { count: item.count })}</span>
            <span>{t('最佳红 {{hits}}/6', { hits: item.bestRedHits })}</span>
            <span>{t('均红 {{average}}', { average: item.averageRedHits })}</span>
            <span>{t('蓝中 {{hits}}', { hits: item.blueHits })}</span>
          </div>
        ))}
      </div>
      <div className="lottery-prediction-hit-review-coverage">
        <div className="lottery-prediction-hit-review-coverage-head">
          <strong>{t('开奖号覆盖')}</strong>
          <span>{t('蓝球 {{blueNumber}} · {{count}} 组命中', {
            blueNumber: actualRecord.blueNumber,
            count: actualBlueCoverage
          })}</span>
        </div>
        <div className="lottery-prediction-hit-review-coverage-balls">
          {actualCoverage.map(item => (
            <span
              key={item.number}
              className={item.count === 0 ? 'lottery-prediction-hit-review-coverage-missed' : undefined}
            >
              <strong>{item.number}</strong>
              <small>{item.count}</small>
            </span>
          ))}
        </div>
        <div className={`lottery-prediction-hit-review-blindspot${missedActualRedNumbers.length === 0 ? ' lottery-prediction-hit-review-blindspot-clear' : ''}`}>
          <strong>
            {missedActualRedNumbers.length > 0
              ? t('未覆盖红球')
              : t('红球全覆盖')}
          </strong>
          <span>
            {missedActualRedNumbers.length > 0
              ? missedActualRedNumbers.join(' ')
              : t('当前复盘预测集覆盖了本期开奖的全部红球')}
          </span>
        </div>
      </div>
      <div className="lottery-prediction-hit-review-list">
        {reviewItems.map(item => (
          <div className="lottery-prediction-hit-review-row" key={`${item.source}-${item.title}`}>
            <div className="lottery-prediction-hit-review-meta">
              <strong>{translateText(item.title)}</strong>
              <span>{translateText(item.source)}</span>
            </div>
            <LotteryBalls
              redNumbers={item.redNumbers}
              blueNumber={item.blueNumber}
              hitRedNumbers={actualRecord.redNumbers}
              hitBlueNumber={actualRecord.blueNumber}
            />
            <div className="lottery-prediction-hit-review-result">
              <Tag color={item.prizeName === t('未中奖') ? 'default' : 'blue'}>{item.prizeName}</Tag>
              <span>{t('红 {{hits}}/6', { hits: item.redHits })}</span>
              <span
                title={t('未覆盖红球：{{numbers}}', {
                  numbers: actualRecord.redNumbers.filter(number => !item.redNumbers.includes(number)).join(' ') || t('无')
                })}
              >
                {t('差红 {{count}}', { count: 6 - item.redHits })}
              </span>
              <span>{item.blueHit ? t('蓝中') : t('蓝未中')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const splitNumbers = (value?: string) =>
  (value || '')
    .split(/[\s,，]+/)
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => item.padStart(2, '0'));

const isNumberInRange = (value: string, min: number, max: number) => {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue >= min && numberValue <= max;
};

const LatestRecordCard = ({
  record,
  onEdit
}: {
  record?: LotteryActualRecord;
  onEdit: () => void;
}) => {
  const { t } = useI18n();

  return (
    <button type="button" className="lottery-latest-vs-card lottery-latest-record-card" onClick={onEdit}>
      <div className="lottery-prediction-card-head">
        <div>
          <strong>{t('输入的最新中奖记录')}</strong>
          <span>{record ? t('第 {{period}} 期', { period: record.period }) : t('尚未保存')}</span>
        </div>
        <Tag icon={<EditOutlined />}>{record ? t('编辑') : t('录入')}</Tag>
      </div>
      {record ? (
        <>
          <LotteryBalls redNumbers={record.redNumbers} blueNumber={record.blueNumber} />
          <div className="lottery-prediction-tags">
            <span>{t('手动录入')}</span>
            <span>{t('用于校验预测')}</span>
          </div>
        </>
      ) : (
        <p className="lottery-latest-record-empty">
          {t('点击卡片录入最新中奖号码。')}
        </p>
      )}
    </button>
  );
};

const ProbabilityGrid = ({
  title,
  items,
  selectedKey,
  onSelect
}: {
  title: string;
  items: LotteryNumberProbability[];
  selectedKey?: string;
  onSelect: (item: LotteryNumberProbability) => void;
}) => {
  const { t } = useI18n();

  return (
    <div className="lottery-probability-block">
      <div className="lottery-probability-block-head">
        <strong>{title}</strong>
        <span>{t('按概率从高到低排序')}</span>
      </div>
      <div className="lottery-probability-grid">
        {[...items].sort((a, b) => b.probability - a.probability || Number(a.number) - Number(b.number)).map(item => {
          const itemKey = `${item.type}-${item.number}`;
          return (
            <button
              key={itemKey}
              type="button"
              className={`lottery-probability-cell lottery-probability-cell-${item.type}${selectedKey === itemKey ? ' lottery-probability-cell-active' : ''}`}
              onClick={() => onSelect(item)}
            >
              <strong>{item.number}</strong>
              <span>{item.probability}%</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ProbabilityDetail = ({ item }: { item: LotteryNumberProbability }) => {
  const { t, translateText } = useI18n();

  return (
    <div className="lottery-probability-detail">
      <div>
        <strong>{item.number}</strong>
        <span>#{item.rank} · {item.probability}%</span>
      </div>
      <div className="lottery-probability-detail-meta">
        <span>{t('历史 {{count}}', { count: item.historyCount })}</span>
        <span>{t('近期 {{count}}', { count: item.recentCount })}</span>
        <span>{t('遗漏 {{count}}', { count: item.currentOmission })}</span>
        <span>{t('均遗 {{count}}', { count: item.averageOmission })}</span>
        <span>{t('压力 {{pressure}}x', { pressure: item.omissionPressure })}</span>
        {item.oddEvenLabel && <span>{translateText(item.oddEvenLabel)}</span>}
        {item.sizeLabel && <span>{translateText(item.sizeLabel)}</span>}
        {item.zoneLabel && <span>{translateText(item.zoneLabel)}</span>}
        {item.groupLabel && <span>{translateText(item.groupLabel)}</span>}
      </div>
      <p>{item.factors.slice(0, 4).map(factor => translateText(factor)).join(t('，'))}</p>
    </div>
  );
};

const ProbabilityFormulaPanel = ({ item }: { item: LotteryNumberProbability }) => {
  const { t, translateText } = useI18n();

  return (
    <div className="lottery-probability-formula">
      <div className={`lottery-probability-formula-head lottery-probability-formula-head-${item.type}`}>
        <strong>{item.number}</strong>
        <div>
          <span>{item.type === 'red' ? t('红舰队号码') : t('蓝舰队星球')}</span>
          <b>#{item.rank} · {item.probability}%</b>
        </div>
      </div>
      <div className="lottery-probability-formula-kpis">
        <div>
          <strong>{item.score}</strong>
          <span>{t('本号综合分')}</span>
        </div>
        <div>
          <strong>{item.poolTotalScore}</strong>
          <span>{item.type === 'red' ? t('红球总分') : t('蓝球总分')}</span>
        </div>
        <div>
          <strong>{item.probabilityPool}%</strong>
          <span>{item.type === 'red' ? t('红球概率池') : t('蓝球概率池')}</span>
        </div>
        <div>
          <strong>{item.omissionPressure}x</strong>
          <span>{t('遗漏压力')}</span>
        </div>
      </div>
      <div className="lottery-probability-equation">
        {t('概率 = {{score}} / {{poolTotalScore}} × {{probabilityPool}}% = {{probability}}%', {
          score: item.score,
          poolTotalScore: item.poolTotalScore,
          probabilityPool: item.probabilityPool,
          probability: item.probability
        })}
      </div>
      <div className="lottery-probability-score-list">
        {item.scoreParts.map(part => (
          <div key={part.label} className="lottery-probability-score-row">
            <div>
              <strong>{translateText(part.label)}</strong>
              <span>{translateText(part.description)}</span>
            </div>
            <b>{part.score}</b>
          </div>
        ))}
      </div>
      <div className="lottery-probability-factor-list">
        {item.factors.map(factor => <Tag key={factor}>{translateText(factor)}</Tag>)}
      </div>
    </div>
  );
};

const LotteryPredictionInsights = ({
  stats,
  trainedPrediction,
  actualRecord,
  onPredictionUpdated,
  onActualRecordUpdated
}: LotteryPredictionInsightsProps) => {
  const { language, t, translateText } = useI18n();
  const [form] = Form.useForm();
  const [editingActualRecord, setEditingActualRecord] = useState(false);
  const [savingActualRecord, setSavingActualRecord] = useState(false);
  const probability = stats.probabilityAnalysis;
  const topRed = probability.red.slice(0, 6);
  const topBlue = probability.blue.slice(0, 6);
  const [selectedProbability, setSelectedProbability] = useState<LotteryNumberProbability | undefined>(
    probability.red[0] || probability.blue[0]
  );
  const selectedProbabilityKey = selectedProbability ? `${selectedProbability.type}-${selectedProbability.number}` : undefined;
  const primaryRulePrediction = stats.predictions[0];
  const trainedCandidates = useMemo(
    () => trainedPrediction?.candidates ?? [],
    [trainedPrediction?.candidates]
  );
  const consensusCandidates = useMemo<PredictionCandidateLike[]>(
    () => (trainedCandidates.length > 0 ? trainedCandidates : stats.predictions),
    [stats.predictions, trainedCandidates]
  );
  const predictionConsensus = useMemo(
    () => buildPredictionConsensus(consensusCandidates),
    [consensusCandidates]
  );
  const consensusTicket = useMemo(
    () => buildConsensusTicket(predictionConsensus),
    [predictionConsensus]
  );
  const primaryPrediction = useMemo(() => {
    if (trainedPrediction?.redNumbers?.length) {
      const resultPrizeName = translateText(trainedPrediction.result?.prizeName || '');
      return {
        title: trainedPrediction.title ? translateText(trainedPrediction.title) : t('训练后预测'),
        redNumbers: trainedPrediction.redNumbers,
        blueNumber: trainedPrediction.blueNumber,
        score: trainedPrediction.score,
        tag: t('训练后预测'),
        tone: 'gold' as const,
        meta: [
          translateText(trainedPrediction.ruleName),
          t('基于前 {{period}} 期', { period: trainedPrediction.basedOnPeriod }),
          t('预测第 {{period}} 期', { period: trainedPrediction.targetPeriod }),
          trainedPrediction.result
            ? t('{{prizeName}} · 红球 {{redHits}}/6', {
              prizeName: resultPrizeName,
              redHits: trainedPrediction.result.redHits
            })
            : ''
        ]
      };
    }
    if (primaryRulePrediction) {
      return {
        title: translateText(primaryRulePrediction.title),
        redNumbers: primaryRulePrediction.redNumbers,
        blueNumber: primaryRulePrediction.blueNumber,
        score: primaryRulePrediction.score,
        tag: t('规则预测'),
        tone: 'red' as const,
        meta: primaryRulePrediction.tags.slice(0, 2).map(item => translateText(item))
      };
    }
    return undefined;
  }, [primaryRulePrediction, t, trainedPrediction, translateText]);
  const hitReviewItems = useMemo<PredictionReviewItem[]>(() => {
    const items: PredictionReviewItem[] = [];
    if (primaryPrediction) {
      items.push({
        title: primaryPrediction.title,
        source: primaryPrediction.tag,
        redNumbers: primaryPrediction.redNumbers,
        blueNumber: primaryPrediction.blueNumber,
        score: primaryPrediction.score
      });
    }
    if (consensusTicket) {
      items.push({
        title: t('共识组合'),
        source: t('候选共识'),
        redNumbers: consensusTicket.redNumbers,
        blueNumber: consensusTicket.blueNumber
      });
    }
    consensusCandidates.slice(0, 5).forEach((candidate, index) => {
      items.push({
        title: candidate.title
          ? translateText(candidate.title)
          : t('候选 {{index}}', { index: index + 1 }),
        source: trainedCandidates.length > 0
          ? t('训练候选')
          : t('规则候选'),
        redNumbers: candidate.redNumbers,
        blueNumber: candidate.blueNumber,
        score: candidate.score
      });
    });

    const seen = new Set<string>();
    return items.filter(item => {
      const key = `${item.redNumbers.join(',')}+${item.blueNumber}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [consensusCandidates, consensusTicket, primaryPrediction, t, trainedCandidates.length, translateText]);

  useEffect(() => {
    if (!editingActualRecord) {
      return;
    }
    form.setFieldsValue({
      period: actualRecord?.period || trainedPrediction?.targetPeriod,
      redNumbers: actualRecord?.redNumbers?.join(' ') || '',
      blueNumber: actualRecord?.blueNumber || ''
    });
  }, [actualRecord, editingActualRecord, form, trainedPrediction?.targetPeriod]);

  const saveActualRecord = async () => {
    const values = await form.validateFields();
    const redNumbers = splitNumbers(values.redNumbers);
    if (redNumbers.length !== 6) {
      message.error(t('请输入 6 个红球号码'));
      return;
    }
    if (new Set(redNumbers).size !== 6) {
      message.error(t('红球号码不能重复'));
      return;
    }
    if (redNumbers.some(number => !isNumberInRange(number, 1, 33))) {
      message.error(t('红球号码范围是 01-33'));
      return;
    }
    const blueNumber = String(values.blueNumber).padStart(2, '0');
    if (!isNumberInRange(blueNumber, 1, 16)) {
      message.error(t('蓝球号码范围是 01-16'));
      return;
    }
    setSavingActualRecord(true);
    try {
      const saved = await lotteryTrainingApi.saveLatestActualRecord({
        period: values.period || trainedPrediction?.targetPeriod || 0,
        redNumbers,
        blueNumber
      });
      onActualRecordUpdated?.(saved);
      const latestPrediction = await lotteryTrainingApi.latestPrediction();
      onPredictionUpdated?.(latestPrediction);
      setEditingActualRecord(false);
      message.success(t('最新中奖记录已保存'));
    } catch (error) {
      console.error('保存最新中奖记录失败:', error);
      message.error(t('保存失败，请检查号码格式'));
    } finally {
      setSavingActualRecord(false);
    }
  };

  if (stats.draws.length === 0) {
    return (
      <section className="lottery-clean-panel">
        <Empty description={t('暂无可分析的彩票数据')} />
      </section>
    );
  }

  return (
    <section className="lottery-simple-page-grid" lang={language}>
      <section className="lottery-clean-panel lottery-simple-main-card">
        <div className="lottery-card-title-row">
          <div>
            <h2>{t('最新记录 / 本期预测')}</h2>
            <p>{t('左侧是你输入的最新中奖记录，右侧是下一期预测。')}</p>
          </div>
          <TrophyOutlined />
        </div>

        <div className="lottery-latest-vs-grid">
          <LatestRecordCard record={actualRecord} onEdit={() => setEditingActualRecord(true)} />
          {primaryPrediction && (
            <SimplePredictionCard
              title={primaryPrediction.title}
              redNumbers={primaryPrediction.redNumbers}
              blueNumber={primaryPrediction.blueNumber}
              score={primaryPrediction.score}
              tag={primaryPrediction.tag}
              tone={primaryPrediction.tone}
              meta={primaryPrediction.meta}
              actualRecord={actualRecord}
            />
          )}
        </div>

        {primaryPrediction && (
          <PredictionStructureCheck
            redNumbers={primaryPrediction.redNumbers}
            blueNumber={primaryPrediction.blueNumber}
          />
        )}

        <PredictionConsensusPanel
          consensus={predictionConsensus}
          candidateCount={consensusCandidates.length}
          actualRecord={actualRecord}
        />

        <PredictionHitReviewPanel
          actualRecord={actualRecord}
          items={hitReviewItems}
          onEditActualRecord={() => setEditingActualRecord(true)}
        />

        {trainedCandidates.length > 1 ? (
          <div className="lottery-simple-candidate-strip">
            {trainedCandidates.slice(1, 4).map((candidate, index) => (
              <SimplePredictionCard
                key={`${candidate.title}-${index}`}
                title={t('备选 {{index}} · {{title}}', {
                  index: index + 1,
                  title: translateText(candidate.title)
                })}
                redNumbers={candidate.redNumbers}
                blueNumber={candidate.blueNumber}
                score={candidate.score}
                tag={t('备选')}
                tone="blue"
                actualRecord={actualRecord}
                meta={[
                  candidate.result
                    ? t('{{prizeName}} · 红球 {{redHits}}/6', {
                      prizeName: translateText(candidate.result.prizeName),
                      redHits: candidate.result.redHits
                    })
                    : '',
                  candidate.result?.blueHit ? t('蓝球命中') : ''
                ]}
              />
            ))}
          </div>
        ) : (
          <RulePredictionList predictions={stats.predictions.slice(1)} actualRecord={actualRecord} />
        )}
      </section>

      <Modal
        title={t('编辑最新中奖记录')}
        open={editingActualRecord}
        okText={t('保存')}
        cancelText={t('取消')}
        confirmLoading={savingActualRecord}
        onOk={saveActualRecord}
        onCancel={() => setEditingActualRecord(false)}
      >
        <Form form={form} layout="vertical" className="lottery-actual-modal-form">
          <Form.Item name="period" label={t('期号')}>
            <InputNumber min={1} placeholder={t('例如 2026')} />
          </Form.Item>
          <Form.Item
            name="redNumbers"
            label={t('红球')}
            rules={[{ required: true, message: t('请输入 6 个红球号码') }]}
          >
            <Input placeholder={t('例如 03 05 16 18 29 32')} />
          </Form.Item>
          <Form.Item
            name="blueNumber"
            label={t('蓝球')}
            rules={[{ required: true, message: t('请输入蓝球号码') }]}
          >
            <Input placeholder={t('例如 04')} />
          </Form.Item>
        </Form>
      </Modal>

      <aside className="lottery-clean-panel lottery-simple-reference-card">
        <div className="lottery-card-title-row">
          <div>
            <h2>{t('号码概率分析')}</h2>
            <p>{t('综合历史频次、近期活跃、遗漏压力、奇偶性、大小分组和区间结构；遗漏超过平均后，未出现时间越长，回补压力越高。')}</p>
          </div>
          <FieldTimeOutlined />
        </div>
        <div className="lottery-probability-summary">
          <div>
            <strong>{probability.summary.recentOddEvenCombination}</strong>
            <span>{t('目标奇偶')}</span>
          </div>
          <div>
            <strong>{probability.summary.recentBigSmallCombination}</strong>
            <span>{t('目标大小')}</span>
          </div>
          <div>
            <strong>{probability.summary.redTargetAverage}</strong>
            <span>{t('红球均值')}</span>
          </div>
          <div>
            <strong>{probability.summary.redFrequencyStandardDeviation}</strong>
            <span>{t('红球标准差')}</span>
          </div>
        </div>
        <ProbabilityGrid
          title={t('红球 01-33')}
          items={probability.red}
          selectedKey={selectedProbabilityKey}
          onSelect={setSelectedProbability}
        />
        <ProbabilityGrid
          title={t('蓝球 01-16')}
          items={probability.blue}
          selectedKey={selectedProbabilityKey}
          onSelect={setSelectedProbability}
        />
        {selectedProbability && <ProbabilityFormulaPanel item={selectedProbability} />}
        <div className="lottery-probability-top-list">
          <div>
            <strong>{t('红球关注')}</strong>
            {topRed.map(item => <ProbabilityDetail key={`top-red-${item.number}`} item={item} />)}
          </div>
          <div>
            <strong>{t('蓝球关注')}</strong>
            {topBlue.map(item => <ProbabilityDetail key={`top-blue-${item.number}`} item={item} />)}
          </div>
        </div>
      </aside>
    </section>
  );
};

export default LotteryPredictionInsights;
