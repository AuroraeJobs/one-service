import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Space } from 'antd';
import {
  DollarOutlined,
  PercentageOutlined,
  ReloadOutlined,
  RiseOutlined,
  TrophyOutlined,
  WalletOutlined
} from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import { lotteryLedgerApi, type LotteryLedgerSummary } from '../services/api';
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

const LotteryLedgerPage = () => {
  const [summary, setSummary] = useState<LotteryLedgerSummary>(emptySummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const hitRate = useMemo(() => {
    const checkedCount = summary.checkedTicketCount || 0;
    if (!checkedCount) {
      return 0;
    }
    return ((summary.winningTicketCount || 0) * 100) / checkedCount;
  }, [summary.checkedTicketCount, summary.winningTicketCount]);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const ledgerSummary = await lotteryLedgerApi.summary();
      setSummary(ledgerSummary || emptySummary);
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
    </LifePageShell>
  );
};

export default LotteryLedgerPage;
