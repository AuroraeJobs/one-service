import { useEffect, useState } from 'react';
import { Empty, Form, Input, InputNumber, Modal, Tag, message } from 'antd';
import { EditOutlined, FieldTimeOutlined, TrophyOutlined } from '@ant-design/icons';
import LotteryBalls from './LotteryBalls';
import type { LotteryNumberProbability, LotteryPrediction, LotteryStats } from '../../utils/lotteryStats';
import {
  lotteryTrainingApi,
  type LotteryActualRecord,
  type LotteryLatestPrediction
} from '../../services/api';

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
}

interface PredictionStructure {
  sum: number;
  oddCount: number;
  bigCount: number;
  zoneCounts: number[];
  consecutivePairs: number;
  span: number;
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

const getStructureTone = (structure: PredictionStructure) => {
  const balancedOddEven = structure.oddCount >= 2 && structure.oddCount <= 4;
  const balancedBigSmall = structure.bigCount >= 2 && structure.bigCount <= 4;
  const coveredZones = structure.zoneCounts.filter(count => count > 0).length;
  const balancedSum = structure.sum >= 70 && structure.sum <= 130;
  const balancedSpan = structure.span >= 16 && structure.span <= 30;
  const score = [balancedOddEven, balancedBigSmall, coveredZones >= 2, balancedSum, balancedSpan]
    .filter(Boolean).length;

  if (score >= 4) return { label: '结构均衡', tone: 'good' };
  if (score >= 3) return { label: '结构可用', tone: 'steady' };
  return { label: '结构偏态', tone: 'warn' };
};

const PredictionStructureCheck = ({
  redNumbers,
  blueNumber
}: {
  redNumbers: string[];
  blueNumber: string;
}) => {
  const structure = getPredictionStructure(redNumbers);
  const tone = getStructureTone(structure);
  const evenCount = redNumbers.length - structure.oddCount;
  const smallCount = redNumbers.length - structure.bigCount;

  return (
    <div className={`lottery-prediction-structure lottery-prediction-structure-${tone.tone}`}>
      <div className="lottery-prediction-structure-head">
        <strong>预测结构体检</strong>
        <Tag>{tone.label}</Tag>
      </div>
      <div className="lottery-prediction-structure-grid">
        <div>
          <strong>{structure.sum}</strong>
          <span>红球和值</span>
        </div>
        <div>
          <strong>{structure.oddCount}:{evenCount}</strong>
          <span>奇偶</span>
        </div>
        <div>
          <strong>{structure.bigCount}:{smallCount}</strong>
          <span>大小</span>
        </div>
        <div>
          <strong>{structure.zoneCounts.join('-')}</strong>
          <span>三区</span>
        </div>
        <div>
          <strong>{structure.consecutivePairs}</strong>
          <span>连号组</span>
        </div>
        <div>
          <strong>{structure.span}</strong>
          <span>跨度</span>
        </div>
        <div>
          <strong>{Number(blueNumber) % 2 === 1 ? '奇' : '偶'}</strong>
          <span>蓝球奇偶</span>
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
  meta = []
}: SimplePredictionCardProps) => (
  <div className={`lottery-simple-prediction-card lottery-simple-prediction-card-${tone}`}>
    <div className="lottery-prediction-card-head">
      <div>
        <strong>{title}</strong>
        {typeof score === 'number' && <span>参考评分 {score}</span>}
      </div>
      <Tag color={tone === 'gold' ? 'gold' : tone}>{tag}</Tag>
    </div>
    <LotteryBalls redNumbers={redNumbers} blueNumber={blueNumber} />
    {meta.length > 0 && (
      <div className="lottery-prediction-tags">
        {meta.filter(Boolean).map(item => (
          <span key={item}>{item}</span>
        ))}
      </div>
    )}
  </div>
);

const RulePredictionList = ({ predictions }: { predictions: LotteryPrediction[] }) => (
  <div className="lottery-simple-secondary-list">
    {predictions.slice(0, 2).map(prediction => (
      <SimplePredictionCard
        key={prediction.title}
        title={prediction.title}
        redNumbers={prediction.redNumbers}
        blueNumber={prediction.blueNumber}
        score={prediction.score}
        tag="规则"
        tone="red"
        meta={prediction.tags.slice(0, 2)}
      />
    ))}
  </div>
);

const splitNumbers = (value?: string) =>
  (value || '')
    .split(/[\s,，]+/)
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => item.padStart(2, '0'));

const LatestRecordCard = ({
  record,
  onEdit
}: {
  record?: LotteryActualRecord;
  onEdit: () => void;
}) => (
  <button type="button" className="lottery-latest-vs-card lottery-latest-record-card" onClick={onEdit}>
    <div className="lottery-prediction-card-head">
      <div>
        <strong>输入的最新中奖记录</strong>
        <span>{record ? `第 ${record.period} 期` : '尚未保存'}</span>
      </div>
      <Tag icon={<EditOutlined />}>{record ? '编辑' : '录入'}</Tag>
    </div>
    {record ? (
      <>
        <LotteryBalls redNumbers={record.redNumbers} blueNumber={record.blueNumber} />
        <div className="lottery-prediction-tags">
          <span>手动录入</span>
          <span>用于校验预测</span>
        </div>
      </>
    ) : (
      <p className="lottery-latest-record-empty">点击卡片录入最新中奖号码。</p>
    )}
  </button>
);

const ProbabilityGrid = ({ title, items }: { title: string; items: LotteryNumberProbability[] }) => (
  <div className="lottery-probability-block">
    <div className="lottery-probability-block-head">
      <strong>{title}</strong>
      <span>按概率从高到低排序</span>
    </div>
    <div className="lottery-probability-grid">
      {[...items].sort((a, b) => b.probability - a.probability || Number(a.number) - Number(b.number)).map(item => (
        <div key={`${item.type}-${item.number}`} className={`lottery-probability-cell lottery-probability-cell-${item.type}`}>
          <strong>{item.number}</strong>
          <span>{item.probability}%</span>
        </div>
      ))}
    </div>
  </div>
);

const ProbabilityDetail = ({ item }: { item: LotteryNumberProbability }) => (
  <div className="lottery-probability-detail">
    <div>
      <strong>{item.number}</strong>
      <span>#{item.rank} · {item.probability}%</span>
    </div>
    <div className="lottery-probability-detail-meta">
      <span>历史 {item.historyCount}</span>
      <span>近期 {item.recentCount}</span>
      <span>遗漏 {item.currentOmission}</span>
      <span>{item.oddEvenLabel}</span>
      <span>{item.sizeLabel}</span>
      {item.zoneLabel && <span>{item.zoneLabel}</span>}
      {item.groupLabel && <span>{item.groupLabel}</span>}
    </div>
    <p>{item.factors.slice(0, 4).join('，')}</p>
  </div>
);

const LotteryPredictionInsights = ({
  stats,
  trainedPrediction,
  actualRecord,
  onPredictionUpdated,
  onActualRecordUpdated
}: LotteryPredictionInsightsProps) => {
  const [form] = Form.useForm();
  const [editingActualRecord, setEditingActualRecord] = useState(false);
  const [savingActualRecord, setSavingActualRecord] = useState(false);
  const probability = stats.probabilityAnalysis;
  const topRed = probability.red.slice(0, 6);
  const topBlue = probability.blue.slice(0, 4);
  const primaryRulePrediction = stats.predictions[0];
  const trainedCandidates = trainedPrediction?.candidates ?? [];
  const primaryPrediction = trainedPrediction?.redNumbers?.length
    ? {
        title: trainedPrediction.title || '训练后预测',
        redNumbers: trainedPrediction.redNumbers,
        blueNumber: trainedPrediction.blueNumber,
        score: trainedPrediction.score,
        tag: '训练后预测',
        tone: 'gold' as const,
        meta: [
          trainedPrediction.ruleName,
          `基于前${trainedPrediction.basedOnPeriod}期`,
          `预测第${trainedPrediction.targetPeriod}期`,
          trainedPrediction.result ? `${trainedPrediction.result.prizeName} · 红球${trainedPrediction.result.redHits}/6` : ''
        ]
      }
    : primaryRulePrediction
      ? {
          title: primaryRulePrediction.title,
          redNumbers: primaryRulePrediction.redNumbers,
          blueNumber: primaryRulePrediction.blueNumber,
          score: primaryRulePrediction.score,
          tag: '规则预测',
          tone: 'red' as const,
          meta: primaryRulePrediction.tags.slice(0, 2)
        }
      : undefined;

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
      message.error('请输入 6 个红球号码');
      return;
    }
    setSavingActualRecord(true);
    try {
      const saved = await lotteryTrainingApi.saveLatestActualRecord({
        period: values.period || trainedPrediction?.targetPeriod || 0,
        redNumbers,
        blueNumber: String(values.blueNumber).padStart(2, '0')
      });
      onActualRecordUpdated?.(saved);
      const latestPrediction = await lotteryTrainingApi.latestPrediction();
      onPredictionUpdated?.(latestPrediction);
      setEditingActualRecord(false);
      message.success('最新中奖记录已保存');
    } catch (error) {
      console.error('保存最新中奖记录失败:', error);
      message.error('保存失败，请检查号码格式');
    } finally {
      setSavingActualRecord(false);
    }
  };

  if (stats.draws.length === 0) {
    return (
      <section className="lottery-clean-panel">
        <Empty description="暂无可分析的彩票数据" />
      </section>
    );
  }

  return (
    <section className="lottery-simple-page-grid">
      <section className="lottery-clean-panel lottery-simple-main-card">
        <div className="lottery-card-title-row">
          <div>
            <h2>最新记录 / 本期预测</h2>
            <p>左侧是你输入的最新中奖记录，右侧是下一期预测。</p>
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
            />
          )}
        </div>

        {primaryPrediction && (
          <PredictionStructureCheck
            redNumbers={primaryPrediction.redNumbers}
            blueNumber={primaryPrediction.blueNumber}
          />
        )}

        {trainedCandidates.length > 1 ? (
          <div className="lottery-simple-candidate-strip">
            {trainedCandidates.slice(1, 4).map((candidate, index) => (
              <SimplePredictionCard
                key={`${candidate.title}-${index}`}
                title={`备选 ${index + 1} · ${candidate.title}`}
                redNumbers={candidate.redNumbers}
                blueNumber={candidate.blueNumber}
                score={candidate.score}
                tag="备选"
                tone="blue"
                meta={[
                  candidate.result ? `${candidate.result.prizeName} · 红球${candidate.result.redHits}/6` : '',
                  candidate.result?.blueHit ? '蓝球命中' : ''
                ]}
              />
            ))}
          </div>
        ) : (
          <RulePredictionList predictions={stats.predictions.slice(1)} />
        )}
      </section>

      <Modal
        title="编辑最新中奖记录"
        open={editingActualRecord}
        okText="保存"
        cancelText="取消"
        confirmLoading={savingActualRecord}
        onOk={saveActualRecord}
        onCancel={() => setEditingActualRecord(false)}
      >
        <Form form={form} layout="vertical" className="lottery-actual-modal-form">
          <Form.Item name="period" label="期号">
            <InputNumber min={1} placeholder="例如 2026" />
          </Form.Item>
          <Form.Item
            name="redNumbers"
            label="红球"
            rules={[{ required: true, message: '请输入 6 个红球号码' }]}
          >
            <Input placeholder="例如 03 05 16 18 29 32" />
          </Form.Item>
          <Form.Item
            name="blueNumber"
            label="蓝球"
            rules={[{ required: true, message: '请输入蓝球号码' }]}
          >
            <Input placeholder="例如 04" />
          </Form.Item>
        </Form>
      </Modal>

      <aside className="lottery-clean-panel lottery-simple-reference-card">
        <div className="lottery-card-title-row">
          <div>
            <h2>号码概率分析</h2>
            <p>结合历史次数、奇偶组合、三/四小组、大小分组、方差和标准差。</p>
          </div>
          <FieldTimeOutlined />
        </div>
        <div className="lottery-probability-summary">
          <div>
            <strong>{probability.summary.recentOddEvenCombination}</strong>
            <span>目标奇偶</span>
          </div>
          <div>
            <strong>{probability.summary.recentBigSmallCombination}</strong>
            <span>目标大小</span>
          </div>
          <div>
            <strong>{probability.summary.redTargetAverage}</strong>
            <span>红球均值</span>
          </div>
          <div>
            <strong>{probability.summary.redFrequencyStandardDeviation}</strong>
            <span>红球标准差</span>
          </div>
        </div>
        <ProbabilityGrid title="红球 01-33" items={probability.red} />
        <ProbabilityGrid title="蓝球 01-16" items={probability.blue} />
        <div className="lottery-probability-top-list">
          <div>
            <strong>红球关注</strong>
            {topRed.map(item => <ProbabilityDetail key={`top-red-${item.number}`} item={item} />)}
          </div>
          <div>
            <strong>蓝球关注</strong>
            {topBlue.map(item => <ProbabilityDetail key={`top-blue-${item.number}`} item={item} />)}
          </div>
        </div>
      </aside>
    </section>
  );
};

export default LotteryPredictionInsights;
