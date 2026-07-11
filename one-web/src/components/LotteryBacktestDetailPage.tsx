import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Descriptions, Empty, Space, Spin, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowLeftOutlined, BarChartOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import LotteryBalls from './lottery/LotteryBalls';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import { lotteryOverfitWarningsText } from '../utils/lotteryBacktestEvidence';
import { lotteryBacktestApi, type LotteryBacktestReplayRow, type LotteryBacktestReport } from '../services/api';
import './LotteryOverviewPage.css';

const formatMoney = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return `¥${Number(value).toFixed(2)}`;
};

const formatPercent = (value?: number) => value === undefined || value === null ? '-' : `${Number(value).toFixed(2)}%`;

const formatDistribution = (value?: Record<string, number>) => (
  Object.entries(value || {}).map(([key, count]) => `${key}:${count}`).join(' / ') || '-'
);

const LotteryBacktestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isEnglish } = useAppPreferences();
  const [report, setReport] = useState<LotteryBacktestReport>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const loadDetail = useCallback(async () => {
    if (!id) {
      setError('缺少回测 ID');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      setReport(await lotteryBacktestApi.detail(id));
    } catch (requestError) {
      console.error('读取回测详情失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取回测详情失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const columns: ColumnsType<LotteryBacktestReplayRow> = [
    {
      title: '期号',
      dataIndex: 'issue',
      key: 'issue',
      width: 110
    },
    {
      title: '预测',
      key: 'predicted',
      render: (_, row) => <LotteryBalls redNumbers={row.predictedRedNumbers || []} blueNumber={row.predictedBlueNumber || ''} />
    },
    {
      title: '实际',
      key: 'actual',
      render: (_, row) => <LotteryBalls redNumbers={row.actualRedNumbers || []} blueNumber={row.actualBlueNumber || ''} />
    },
    {
      title: '命中',
      key: 'hit',
      render: (_, row) => <Tag color={row.prizeName === '未中奖' ? 'default' : 'blue'}>红 {row.redHits}/6 · {row.blueHit ? '蓝中' : '蓝未中'} · {row.prizeName}</Tag>
    },
    {
      title: '净值',
      dataIndex: 'netResult',
      key: 'netResult',
      align: 'right',
      render: value => formatMoney(value)
    }
  ];

  return (
    <LifePageShell
      className="lottery-prediction-page"
      eyebrow="彩票数据"
      title="回测详情"
      actions={
        <Space wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/lottery/backtests')}>
            返回回测
          </Button>
          {id ? (
            <Button icon={<BarChartOutlined />} onClick={() => navigate(`/lottery/research?items=backtest:${id}`)}>
              加入对比
            </Button>
          ) : null}
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadDetail}>
            刷新
          </Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}
      <Alert
        className="lottery-overview-status-alert"
        type="info"
        showIcon
        message={isEnglish
          ? 'This report compares model candidates with a same-window, same-budget random baseline. It is historical-window research evidence, not a future-performance claim.'
          : '本报告将模型候选与同窗口、同预算随机基线并列，仅作为历史窗口研究证据，不代表未来表现。'}
      />
      <Spin spinning={loading}>
        {!report && !loading ? (
          <Card className="life-panel-card">
            <Empty description="未找到回测报告" />
          </Card>
        ) : report ? (
          <section className="lottery-detail-grid">
            <Card className="life-panel-card lottery-detail-main-card" title={report.strategyName || '未命名回测'}>
              <Descriptions column={{ xs: 1, sm: 2, lg: 4 }} size="small">
                <Descriptions.Item label="窗口">{report.presetWindow || '-'}</Descriptions.Item>
                <Descriptions.Item label="期号">{report.issueStart || '-'} 到 {report.issueEnd || '-'}</Descriptions.Item>
                <Descriptions.Item label="回放">{report.replayCount || 0}</Descriptions.Item>
                <Descriptions.Item label="评价模式">{report.evaluationMode || '-'}</Descriptions.Item>
                <Descriptions.Item label="决策集 ID">{report.decisionSetId || '-'}</Descriptions.Item>
                <Descriptions.Item label="随机 Seed">{report.baselineSeed ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="随机算法">{report.baselineAlgorithm || '-'}</Descriptions.Item>
                <Descriptions.Item label="窗口期数">{report.windowIssueCount ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="红球均值">{report.averageRedHits ?? 0}</Descriptions.Item>
                <Descriptions.Item label="蓝球率">{formatPercent(report.blueHitRate)}</Descriptions.Item>
                <Descriptions.Item label="稳定分">{report.stabilityScore ?? 0}</Descriptions.Item>
                <Descriptions.Item label="成本">{formatMoney(report.totalCost)}</Descriptions.Item>
                <Descriptions.Item label="奖金">{formatMoney(report.totalPrize)}</Descriptions.Item>
                <Descriptions.Item label="净值">{formatMoney(report.netResult)}</Descriptions.Item>
                <Descriptions.Item label="ROI">{formatPercent(report.roiPercent)}</Descriptions.Item>
                <Descriptions.Item label="候选多样性">{report.candidateDiversity ?? '-'}%</Descriptions.Item>
                <Descriptions.Item label="最大红球重叠">{report.maxRedOverlap ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="去重蓝球">{report.distinctBlueCount ?? '-'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card className="life-panel-card lottery-detail-main-card" title={isEnglish ? 'Model vs Random Baseline' : '模型 vs 随机基线'}>
              <Descriptions column={{ xs: 1, sm: 2, lg: 4 }} size="small">
                <Descriptions.Item label={isEnglish ? 'Same window' : '同窗口'}><Tag color={report.sameWindow ? 'green' : 'red'}>{report.sameWindow ? 'PASS' : 'FAIL'}</Tag></Descriptions.Item>
                <Descriptions.Item label={isEnglish ? 'Same budget' : '同预算'}><Tag color={report.sameBudget ? 'green' : 'red'}>{report.sameBudget ? 'PASS' : 'FAIL'}</Tag></Descriptions.Item>
                <Descriptions.Item label={isEnglish ? 'Tickets' : '模型票数'}>{report.ticketCount ?? '-'}</Descriptions.Item>
                <Descriptions.Item label={isEnglish ? 'Random tickets' : '随机票数'}>{report.baselineTicketCount ?? '-'}</Descriptions.Item>
                <Descriptions.Item label={isEnglish ? 'Random cost' : '随机成本'}>{formatMoney(report.baselineTotalCost)}</Descriptions.Item>
                <Descriptions.Item label={isEnglish ? 'Random prize' : '随机奖金'}>{formatMoney(report.baselineTotalPrize)}</Descriptions.Item>
                <Descriptions.Item label={isEnglish ? 'Random net' : '随机净值'}>{formatMoney(report.baselineNetResult)}</Descriptions.Item>
                <Descriptions.Item label={isEnglish ? 'Random ROI' : '随机 ROI'}>{formatPercent(report.baselineRoiPercent)}</Descriptions.Item>
                <Descriptions.Item label={isEnglish ? 'Red-hit delta' : '红球均值差'}>{report.averageRedHitsDelta ?? '-'}</Descriptions.Item>
                <Descriptions.Item label={isEnglish ? 'Blue-hit delta' : '蓝球率差'}>{formatPercent(report.blueHitRateDelta)}</Descriptions.Item>
                <Descriptions.Item label={isEnglish ? 'Net delta' : '净值差'}>{formatMoney(report.netResultDelta)}</Descriptions.Item>
                <Descriptions.Item label="ROI delta">{formatPercent(report.roiPercentDelta)}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card className="life-panel-card lottery-detail-main-card" title={isEnglish ? 'Distributions' : '分布证据'}>
              <Descriptions column={{ xs: 1, md: 2 }} size="small">
                <Descriptions.Item label={isEnglish ? 'Model hits' : '模型命中'}>{formatDistribution(report.hitDistribution)}</Descriptions.Item>
                <Descriptions.Item label={isEnglish ? 'Random hits' : '随机命中'}>{formatDistribution(report.baselineHitDistribution)}</Descriptions.Item>
                <Descriptions.Item label={isEnglish ? 'Model prizes' : '模型奖级'}>{formatDistribution(report.prizeDistribution)}</Descriptions.Item>
                <Descriptions.Item label={isEnglish ? 'Random prizes' : '随机奖级'}>{formatDistribution(report.baselinePrizeDistribution)}</Descriptions.Item>
              </Descriptions>
            </Card>

            {(report.overfitWarnings || []).length ? (
              <Alert
                className="lottery-overview-status-alert"
                type="warning"
                showIcon
                message={isEnglish ? 'Overfit warnings' : '过拟合提醒'}
                description={lotteryOverfitWarningsText(report.overfitWarnings || [], isEnglish)}
              />
            ) : null}

            <Card className="life-panel-card lottery-detail-main-card" title={isEnglish ? 'Model Replay Rows' : '模型回放明细'}>
              <Table
                rowKey={row => row.issue || `${row.drawDate}-${row.score}`}
                columns={columns}
                dataSource={report.rows || []}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                scroll={{ x: 980 }}
              />
            </Card>

            <Card className="life-panel-card lottery-detail-main-card" title={isEnglish ? 'Random Baseline Replay Rows' : '随机基线回放明细'}>
              <Table
                rowKey={row => `baseline-${row.issue || `${row.drawDate}-${row.candidateSlot}`}`}
                columns={columns}
                dataSource={report.baselineRows || []}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                scroll={{ x: 980 }}
              />
            </Card>
          </section>
        ) : null}
      </Spin>
    </LifePageShell>
  );
};

export default LotteryBacktestDetailPage;
