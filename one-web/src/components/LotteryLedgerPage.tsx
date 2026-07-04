import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DollarOutlined,
  LineChartOutlined,
  PercentageOutlined,
  ReloadOutlined,
  RiseOutlined,
  TrophyOutlined,
  WalletOutlined
} from '@ant-design/icons';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import LifePageShell from './LifePageShell';
import {
  lotteryLedgerApi,
  type LotteryIssueLedger,
  type LotteryLedgerSummary,
  type LotteryMonthlyLedger
} from '../services/api';
import './LotteryOverviewPage.css';

const emptySummary: LotteryLedgerSummary = {
  ticketCount: 0,
  checkedTicketCount: 0,
  pendingTicketCount: 0,
  winningTicketCount: 0,
  totalCost: 0,
  totalPrize: 0,
  netResult: 0,
  roiPercent: 0
};

const formatMoney = (value?: number) => `¥${Number(value || 0).toFixed(2)}`;

const formatPercent = (value?: number) => `${Number(value || 0).toFixed(2)}%`;

const createMonthlyTrendOption = (months: LotteryMonthlyLedger[]): EChartsOption => {
  const sortedMonths = [...months]
    .filter(item => item.month && item.month !== 'UNKNOWN')
    .sort((left, right) => String(left.month).localeCompare(String(right.month)));
  const labels = sortedMonths.map(item => item.month || '');
  return {
    tooltip: { trigger: 'axis' },
    legend: { top: 0, data: ['成本', '奖金', '净结果'] },
    grid: { top: 48, right: 24, bottom: 28, left: 48 },
    xAxis: {
      type: 'category',
      data: labels,
      axisTick: { alignWithLabel: true },
      axisLine: { lineStyle: { color: 'rgba(127, 127, 127, 0.2)' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '¥{value}' },
      splitLine: { lineStyle: { color: 'rgba(127, 127, 127, 0.12)' } }
    },
    series: [
      {
        name: '成本',
        type: 'bar',
        barMaxWidth: 28,
        itemStyle: { color: '#ff9500' },
        data: sortedMonths.map(item => Number(item.totalCost || 0))
      },
      {
        name: '奖金',
        type: 'bar',
        barMaxWidth: 28,
        itemStyle: { color: '#34c759' },
        data: sortedMonths.map(item => Number(item.totalPrize || 0))
      },
      {
        name: '净结果',
        type: 'line',
        smooth: true,
        symbolSize: 7,
        lineStyle: { color: '#0071e3', width: 3 },
        itemStyle: { color: '#0071e3' },
        data: sortedMonths.map(item => Number(item.netResult || 0))
      }
    ]
  };
};

const LotteryLedgerPage = () => {
  const [summary, setSummary] = useState<LotteryLedgerSummary>(emptySummary);
  const [issues, setIssues] = useState<LotteryIssueLedger[]>([]);
  const [months, setMonths] = useState<LotteryMonthlyLedger[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const hitRate = useMemo(() => {
    const checkedCount = summary.checkedTicketCount || 0;
    if (!checkedCount) {
      return 0;
    }
    return ((summary.winningTicketCount || 0) * 100) / checkedCount;
  }, [summary.checkedTicketCount, summary.winningTicketCount]);

  const monthlyTrendOption = useMemo(() => createMonthlyTrendOption(months), [months]);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [ledgerSummary, issueRows, monthRows] = await Promise.all([
        lotteryLedgerApi.summary(),
        lotteryLedgerApi.issues(),
        lotteryLedgerApi.months()
      ]);
      setSummary(ledgerSummary || emptySummary);
      setIssues(issueRows || []);
      setMonths(monthRows || []);
    } catch (requestError) {
      console.error('获取彩票账本失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '获取彩票账本失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const issueColumns: ColumnsType<LotteryIssueLedger> = [
    {
      title: '期号',
      dataIndex: 'issue',
      key: 'issue',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <strong>{record.issue || record.period || '-'}</strong>
          <span className="stock-quote-code">{record.pendingTicketCount ? '待开奖' : '已核验'}</span>
        </Space>
      )
    },
    {
      title: '票据',
      key: 'tickets',
      align: 'right',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <strong>{record.ticketCount || 0}</strong>
          <span className="stock-quote-code">中奖 {record.winningTicketCount || 0}</span>
        </Space>
      )
    },
    {
      title: '成本',
      dataIndex: 'totalCost',
      key: 'totalCost',
      align: 'right',
      render: value => formatMoney(value)
    },
    {
      title: '奖金',
      dataIndex: 'totalPrize',
      key: 'totalPrize',
      align: 'right',
      render: value => formatMoney(value)
    },
    {
      title: '净结果',
      dataIndex: 'netResult',
      key: 'netResult',
      align: 'right',
      render: value => <strong>{formatMoney(value)}</strong>
    },
    {
      title: 'ROI',
      dataIndex: 'roiPercent',
      key: 'roiPercent',
      align: 'right',
      render: value => <Tag color={Number(value || 0) >= 0 ? 'green' : 'red'}>{formatPercent(value)}</Tag>
    }
  ];

  return (
    <LifePageShell
      className="lottery-prediction-page"
      eyebrow="彩票数据"
      title="彩票账本"
      actions={
        <Button icon={<ReloadOutlined />} loading={loading} onClick={loadSummary}>
          刷新
        </Button>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}

      <section className="lottery-history-summary-grid">
        <Card className="life-panel-card lottery-clean-panel" loading={loading}>
          <div className="lottery-history-summary-item">
            <WalletOutlined />
            <div>
              <strong>{formatMoney(summary.totalCost)}</strong>
              <span>总成本</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel" loading={loading}>
          <div className="lottery-history-summary-item">
            <TrophyOutlined />
            <div>
              <strong>{formatMoney(summary.totalPrize)}</strong>
              <span>总奖金</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel" loading={loading}>
          <div className="lottery-history-summary-item">
            <DollarOutlined />
            <div>
              <strong>{formatMoney(summary.netResult)}</strong>
              <span>净结果</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel" loading={loading}>
          <div className="lottery-history-summary-item">
            <RiseOutlined />
            <div>
              <strong>{formatPercent(summary.roiPercent)}</strong>
              <span>ROI</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel" loading={loading}>
          <div className="lottery-history-summary-item">
            <PercentageOutlined />
            <div>
              <strong>{formatPercent(hitRate)}</strong>
              <span>命中率</span>
            </div>
          </div>
        </Card>
      </section>

      <Card className="life-panel-card">
        <Space wrap size="large">
          <span>票据 {summary.ticketCount || 0}</span>
          <span>已兑奖 {summary.checkedTicketCount || 0}</span>
          <span>待开奖 {summary.pendingTicketCount || 0}</span>
          <span>中奖 {summary.winningTicketCount || 0}</span>
        </Space>
      </Card>

      <Card className="life-panel-card" title={<Space><LineChartOutlined />月度趋势</Space>}>
        <ReactECharts option={monthlyTrendOption} style={{ height: 320, width: '100%' }} notMerge lazyUpdate />
      </Card>

      <Card className="life-panel-card" title="期次账本">
        <Table
          rowKey={record => record.issue || String(record.period)}
          columns={issueColumns}
          dataSource={issues}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 760 }}
        />
      </Card>
    </LifePageShell>
  );
};

export default LotteryLedgerPage;
