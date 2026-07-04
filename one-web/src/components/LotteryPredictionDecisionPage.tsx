import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Key } from 'react';
import { Alert, Button, Card, Empty, Input, Select, Space, Spin, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined,
  FileAddOutlined,
  FilterOutlined,
  HistoryOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import LotteryBalls from './lottery/LotteryBalls';
import {
  lotteryPredictionApi,
  lotteryTicketApi,
  type LotteryPageResponse,
  type LotteryPredictionCandidate,
  type LotteryPredictionSnapshot,
  type LotteryReplayMetrics,
  type LotteryRuleComparison,
  type LotteryRuleEvidence,
  type LotteryTicket
} from '../services/api';
import { lotteryDriftLabel, lotteryEvidenceColor, lotteryEvidenceLabel, lotteryReplayText } from '../utils/lotteryEvidence';
import './LotteryOverviewPage.css';

interface DecisionCandidateRow {
  key: string;
  snapshotId?: string;
  snapshotTitle: string;
  candidateTitle: string;
  source: 'PRIMARY' | 'CANDIDATE';
  targetPeriod?: number;
  ruleId?: string;
  ruleName?: string;
  redNumbers: string[];
  blueNumber?: string;
  score?: number;
  evidence?: LotteryRuleEvidence;
  replayText: string;
  driftLabel?: string;
  resultLabel: string;
  resultState: 'PENDING' | 'WON' | 'MISSED';
  redOverlap: number;
  blueOverlap: boolean;
  ticketCount: number;
  ticketState: string;
  warning?: string;
}

const evidenceOptions = [
  { label: '全部证据', value: 'ALL' },
  { label: '稳定', value: 'STABLE' },
  { label: '波动', value: 'VOLATILE' },
  { label: '过期', value: 'STALE' },
  { label: '样本少', value: 'UNDER_TESTED' },
  { label: '缺失', value: 'MISSING' }
];

const resultOptions = [
  { label: '全部结果', value: 'ALL' },
  { label: '待开奖', value: 'PENDING' },
  { label: '已中奖', value: 'WON' },
  { label: '未中奖', value: 'MISSED' }
];

const sourceLabel = (source: DecisionCandidateRow['source']) => source === 'PRIMARY' ? '主预测' : '候选';

const formatTime = (value?: number) => {
  if (!value) {
    return '-';
  }
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
};

const redOverlapCount = (left: string[] = [], right: string[] = []) => {
  const rightSet = new Set(right);
  return left.filter(item => rightSet.has(item)).length;
};

const predictionResultState = (candidate: LotteryPredictionSnapshot | LotteryPredictionCandidate): DecisionCandidateRow['resultState'] => {
  if (!candidate.result) {
    return 'PENDING';
  }
  return candidate.result.prizeName && candidate.result.prizeName !== '未中奖' ? 'WON' : 'MISSED';
};

const predictionResultLabel = (candidate: LotteryPredictionSnapshot | LotteryPredictionCandidate) => {
  if (!candidate.result) {
    return '待开奖';
  }
  return `${candidate.result.prizeName || '-'} · 红 ${candidate.result.redHits ?? '-'}/6 · ${candidate.result.blueHit ? '蓝中' : '蓝未中'}`;
};

const candidateEvidenceWarning = (evidence?: LotteryRuleEvidence, replayText?: string) => {
  if (!evidence?.tag) {
    return '缺少规则证据';
  }
  if (evidence.tag === 'UNDER_TESTED') {
    return '样本不足，先看回放';
  }
  if (evidence.tag === 'STALE') {
    return '证据过期，建议重新训练';
  }
  if (evidence.tag === 'VOLATILE') {
    return '规则波动，谨慎转票';
  }
  if (!replayText || replayText === '暂无回放证据') {
    return '缺少回放摘要';
  }
  return undefined;
};

const buildDecisionRows = (
  predictions: LotteryPredictionSnapshot[],
  tickets: LotteryTicket[]
): DecisionCandidateRow[] => {
  const reference = predictions[0];
  const ticketsBySnapshot = new Map<string, number>();
  tickets.forEach(ticket => {
    if (!ticket.predictionSnapshotId) {
      return;
    }
    ticketsBySnapshot.set(ticket.predictionSnapshotId, (ticketsBySnapshot.get(ticket.predictionSnapshotId) || 0) + 1);
  });

  return predictions.flatMap(snapshot => {
    const snapshotTicketCount = snapshot.id ? ticketsBySnapshot.get(snapshot.id) || 0 : 0;
    const replayText = lotteryReplayText(snapshot.replaySummary);
    const rows: DecisionCandidateRow[] = [
      {
        key: `snapshot:${snapshot.id || snapshot.targetPeriod}`,
        snapshotId: snapshot.id,
        snapshotTitle: snapshot.title || `第 ${snapshot.targetPeriod || '-'} 期预测`,
        candidateTitle: '主预测',
        source: 'PRIMARY',
        targetPeriod: snapshot.targetPeriod,
        ruleId: snapshot.ruleId,
        ruleName: snapshot.ruleName,
        redNumbers: snapshot.redNumbers || [],
        blueNumber: snapshot.blueNumber,
        score: snapshot.score,
        evidence: snapshot.evidence,
        replayText,
        driftLabel: snapshot.replaySummary?.driftLabel,
        resultLabel: predictionResultLabel(snapshot),
        resultState: predictionResultState(snapshot),
        redOverlap: redOverlapCount(reference?.redNumbers, snapshot.redNumbers),
        blueOverlap: Boolean(reference?.blueNumber && reference.blueNumber === snapshot.blueNumber),
        ticketCount: snapshotTicketCount,
        ticketState: snapshotTicketCount ? `已转 ${snapshotTicketCount} 注` : '未转票',
        warning: candidateEvidenceWarning(snapshot.evidence, replayText)
      }
    ];

    (snapshot.candidates || []).forEach((candidate, index) => {
      rows.push({
        key: `candidate:${snapshot.id || snapshot.targetPeriod}:${index}`,
        snapshotId: snapshot.id,
        snapshotTitle: snapshot.title || `第 ${snapshot.targetPeriod || '-'} 期预测`,
        candidateTitle: candidate.title || `候选 ${index + 1}`,
        source: 'CANDIDATE',
        targetPeriod: snapshot.targetPeriod,
        ruleId: snapshot.ruleId,
        ruleName: snapshot.ruleName,
        redNumbers: candidate.redNumbers || [],
        blueNumber: candidate.blueNumber,
        score: candidate.score,
        evidence: snapshot.evidence,
        replayText,
        driftLabel: snapshot.replaySummary?.driftLabel,
        resultLabel: predictionResultLabel(candidate),
        resultState: predictionResultState(candidate),
        redOverlap: redOverlapCount(reference?.redNumbers, candidate.redNumbers),
        blueOverlap: Boolean(reference?.blueNumber && reference.blueNumber === candidate.blueNumber),
        ticketCount: snapshotTicketCount,
        ticketState: snapshotTicketCount ? '同快照已转票' : '未转票',
        warning: candidateEvidenceWarning(snapshot.evidence, replayText)
      });
    });

    return rows;
  });
};

const LotteryPredictionDecisionPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [predictions, setPredictions] = useState<LotteryPredictionSnapshot[]>([]);
  const [pageResponse, setPageResponse] = useState<LotteryPageResponse<LotteryPredictionSnapshot>>();
  const [ruleComparison, setRuleComparison] = useState<LotteryRuleComparison>();
  const [replayMetrics, setReplayMetrics] = useState<LotteryReplayMetrics>();
  const [predictionTickets, setPredictionTickets] = useState<LotteryTicket[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingTickets, setSavingTickets] = useState(false);
  const [error, setError] = useState<string>();

  const targetIssue = searchParams.get('targetIssue') || '';
  const ruleName = searchParams.get('ruleName') || '';
  const evidenceState = searchParams.get('evidence') || 'ALL';
  const resultState = searchParams.get('resultState') || 'ALL';

  const updateQuery = useCallback((patch: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === 'ALL') {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const loadDecision = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const targetPeriod = Number(targetIssue);
      const [history, rules, replay, tickets] = await Promise.all([
        lotteryPredictionApi.historyPage({
          page: 1,
          pageSize: 24,
          resultState,
          targetPeriod: Number.isFinite(targetPeriod) && targetPeriod > 0 ? targetPeriod : undefined,
          ruleName: ruleName.trim() || undefined
        }),
        lotteryPredictionApi.compareRules({ limit: 16 }),
        lotteryPredictionApi.replayMetrics({ window: 100 }),
        lotteryTicketApi.ticketsPage({ page: 1, pageSize: 200, source: 'PREDICTION' })
      ]);
      setPageResponse(history);
      setPredictions(history.items || []);
      setRuleComparison(rules);
      setReplayMetrics(replay);
      setPredictionTickets(tickets.items || []);
    } catch (requestError) {
      console.error('读取预测决策板失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取预测决策板失败');
    } finally {
      setLoading(false);
    }
  }, [resultState, ruleName, targetIssue]);

  useEffect(() => {
    loadDecision();
  }, [loadDecision]);

  const decisionRows = useMemo(
    () => buildDecisionRows(predictions, predictionTickets),
    [predictionTickets, predictions]
  );

  const filteredRows = useMemo(() => decisionRows.filter(row => {
    if (evidenceState === 'MISSING' && row.evidence?.tag) {
      return false;
    }
    if (evidenceState !== 'ALL' && evidenceState !== 'MISSING' && row.evidence?.tag !== evidenceState) {
      return false;
    }
    if (resultState !== 'ALL' && row.resultState !== resultState) {
      return false;
    }
    return true;
  }), [decisionRows, evidenceState, resultState]);

  const selectedRowSet = useMemo(() => new Set(selectedRowKeys.map(String)), [selectedRowKeys]);
  const selectedRows = useMemo(
    () => filteredRows.filter(row => selectedRowSet.has(row.key)),
    [filteredRows, selectedRowSet]
  );

  const summary = useMemo(() => {
    const stable = filteredRows.filter(row => row.evidence?.tag === 'STABLE').length;
    const warning = filteredRows.filter(row => row.warning).length;
    const converted = filteredRows.filter(row => row.ticketCount > 0).length;
    const pending = filteredRows.filter(row => row.resultState === 'PENDING').length;
    return { stable, warning, converted, pending };
  }, [filteredRows]);

  const saveSelectedTickets = async () => {
    if (!selectedRows.length) {
      message.warning('请先选择候选号码');
      return;
    }
    const targetWithoutIssue = selectedRows.filter(row => !row.targetPeriod);
    if (targetWithoutIssue.length) {
      message.warning('选中项缺少目标期号');
      return;
    }
    setSavingTickets(true);
    setError(undefined);
    try {
      const result = await lotteryTicketApi.saveTickets(selectedRows.map(row => ({
        issue: String(row.targetPeriod),
        redNumbers: row.redNumbers,
        blueNumber: row.blueNumber,
        quantity: 1,
        cost: 2,
        source: 'PREDICTION',
        status: 'DRAFT',
        predictionSnapshotId: row.snapshotId,
        note: `决策板转票：${row.snapshotTitle} / ${row.candidateTitle}`
      })));
      message.success(`已保存 ${result.savedCount || 0} 注，跳过重复 ${result.duplicateCount || 0} 注`);
      setSelectedRowKeys([]);
      await loadDecision();
    } catch (requestError) {
      console.error('保存决策候选为票据失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '保存决策候选为票据失败');
      message.error('保存决策候选失败');
    } finally {
      setSavingTickets(false);
    }
  };

  const columns: ColumnsType<DecisionCandidateRow> = [
    {
      title: '候选',
      key: 'candidate',
      width: 210,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <strong>{record.candidateTitle}</strong>
          <span className="stock-quote-code">{record.snapshotTitle}</span>
          <Space wrap size={4}>
            <Tag color={record.source === 'PRIMARY' ? 'blue' : 'default'}>{sourceLabel(record.source)}</Tag>
            <Tag>{record.targetPeriod || '-'}</Tag>
          </Space>
        </Space>
      )
    },
    {
      title: '号码',
      key: 'numbers',
      render: (_, record) => <LotteryBalls redNumbers={record.redNumbers} blueNumber={record.blueNumber || ''} />
    },
    {
      title: '证据',
      key: 'evidence',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Space wrap size={4}>
            <Tag color={lotteryEvidenceColor(record.evidence?.tag)}>{lotteryEvidenceLabel(record.evidence)}</Tag>
            <Tag>{lotteryDriftLabel(record.driftLabel)}</Tag>
          </Space>
          <span className="stock-quote-code">{record.replayText}</span>
          {record.warning ? <Tag color="orange">{record.warning}</Tag> : null}
        </Space>
      )
    },
    {
      title: '对比',
      key: 'overlap',
      width: 128,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <span>红球重合 {record.redOverlap}/6</span>
          <Tag color={record.blueOverlap ? 'blue' : 'default'}>{record.blueOverlap ? '蓝球重合' : '蓝球不同'}</Tag>
        </Space>
      )
    },
    {
      title: '结果/转票',
      key: 'result',
      width: 210,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Tag color={record.resultState === 'WON' ? 'blue' : record.resultState === 'MISSED' ? 'default' : 'gold'}>
            {record.resultLabel}
          </Tag>
          <Tag color={record.ticketCount ? 'green' : 'default'}>{record.ticketState}</Tag>
          <span className="stock-quote-code">评分 {record.score ?? '-'}</span>
        </Space>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 108,
      render: (_, record) => record.snapshotId ? (
        <Button size="small" icon={<HistoryOutlined />} onClick={() => navigate(`/lottery/predictions/${record.snapshotId}`)}>
          快照
        </Button>
      ) : null
    }
  ];

  return (
    <LifePageShell
      className="lottery-prediction-page lottery-decision-page"
      eyebrow="彩票数据"
      title="预测决策板"
      actions={
        <Space wrap>
          <Button type="primary" icon={<FileAddOutlined />} loading={savingTickets} onClick={saveSelectedTickets}>
            转为票据
          </Button>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadDecision}>
            刷新
          </Button>
          <Button icon={<ThunderboltOutlined />} onClick={() => navigate('/lottery/prediction')}>
            训练
          </Button>
          <Button icon={<HistoryOutlined />} onClick={() => navigate('/lottery/predictions/history')}>
            历史
          </Button>
          <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
            打印
          </Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}
      <Alert
        className="lottery-overview-status-alert"
        type="info"
        showIcon
        message="决策板只汇总历史预测、回放、规则证据和个人票据状态，用于复盘和记录，不代表结果承诺。"
      />

      <section className="lottery-decision-filter-bar">
        <Input
          allowClear
          prefix={<FilterOutlined />}
          placeholder="目标期号"
          value={targetIssue}
          onChange={event => updateQuery({ targetIssue: event.target.value })}
        />
        <Input
          allowClear
          prefix={<SafetyCertificateOutlined />}
          placeholder="规则名称"
          value={ruleName}
          onChange={event => updateQuery({ ruleName: event.target.value })}
        />
        <Select value={evidenceState} options={evidenceOptions} onChange={value => updateQuery({ evidence: value })} />
        <Select value={resultState} options={resultOptions} onChange={value => updateQuery({ resultState: value })} />
      </section>

      <section className="lottery-history-summary-grid">
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <ThunderboltOutlined />
            <div>
              <strong>{filteredRows.length}</strong>
              <span>候选号码</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <SafetyCertificateOutlined />
            <div>
              <strong>{summary.stable}</strong>
              <span>稳定证据</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <WarningOutlined />
            <div>
              <strong>{summary.warning}</strong>
              <span>证据提醒</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <CheckCircleOutlined />
            <div>
              <strong>{summary.converted}</strong>
              <span>已转票候选</span>
            </div>
          </div>
        </Card>
      </section>

      <section className="lottery-decision-brief-grid">
        <article>
          <strong>{ruleComparison?.bestRuleName || '-'}</strong>
          <span>当前最佳规则 · {ruleComparison?.bestRankScore ?? '-'} 分</span>
          {ruleComparison?.bestEvidence ? (
            <Tag color={lotteryEvidenceColor(ruleComparison.bestEvidence.tag)}>
              {lotteryEvidenceLabel(ruleComparison.bestEvidence)}
            </Tag>
          ) : null}
        </article>
        <article>
          <strong>{lotteryReplayText(replayMetrics?.replaySummary)}</strong>
          <span>回放窗口 {replayMetrics?.actualWindow || replayMetrics?.requestedWindow || '-'} · 生成 {formatTime(replayMetrics?.generatedAt)}</span>
          {replayMetrics?.evidence ? (
            <Tag color={lotteryEvidenceColor(replayMetrics.evidence.tag)}>{lotteryEvidenceLabel(replayMetrics.evidence)}</Tag>
          ) : null}
        </article>
        <article>
          <strong>{selectedRows.length}</strong>
          <span>已选候选 · 待开奖 {summary.pending}</span>
          <Button size="small" icon={<FileAddOutlined />} loading={savingTickets} onClick={saveSelectedTickets}>
            保存选中
          </Button>
        </article>
      </section>

      {summary.warning > 0 ? (
        <Alert
          className="lottery-overview-status-alert"
          type="warning"
          showIcon
          message="存在样本不足、证据过期、规则波动或缺少回放摘要的候选，转票前建议先查看预测详情或重新训练。"
        />
      ) : null}

      <Card className="life-panel-card lottery-clean-panel lottery-report-print-area">
        <Spin spinning={loading}>
          {filteredRows.length ? (
            <Table
              rowKey="key"
              rowSelection={{
                selectedRowKeys,
                onChange: keys => setSelectedRowKeys(keys)
              }}
              columns={columns}
              dataSource={filteredRows}
              pagination={{ pageSize: 10, showSizeChanger: true, total: filteredRows.length }}
              scroll={{ x: 980 }}
            />
          ) : (
            <Empty description={pageResponse?.total ? '当前筛选下暂无候选' : '暂无预测候选，先运行一次预测训练。'} />
          )}
        </Spin>
      </Card>

      <div className="lottery-decision-mobile-list">
        {filteredRows.map(row => (
          <article key={row.key}>
            <div>
              <strong>{row.candidateTitle}</strong>
              <Tag color={row.source === 'PRIMARY' ? 'blue' : 'default'}>{sourceLabel(row.source)}</Tag>
            </div>
            <LotteryBalls redNumbers={row.redNumbers} blueNumber={row.blueNumber || ''} />
            <Space wrap>
              <Tag color={lotteryEvidenceColor(row.evidence?.tag)}>{lotteryEvidenceLabel(row.evidence)}</Tag>
              <Tag>{row.resultLabel}</Tag>
              <Tag color={row.ticketCount ? 'green' : 'default'}>{row.ticketState}</Tag>
            </Space>
            {row.warning ? <span>{row.warning}</span> : null}
          </article>
        ))}
      </div>
    </LifePageShell>
  );
};

export default LotteryPredictionDecisionPage;
