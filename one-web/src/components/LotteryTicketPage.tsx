import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Input, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, SearchOutlined, TrophyOutlined } from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import LotteryBalls from './lottery/LotteryBalls';
import { lotteryTicketApi, type LotteryTicket, type LotteryTicketSummary } from '../services/api';
import './LotteryOverviewPage.css';

const formatMoney = (value?: number) => {
  if (value === undefined || value === null) {
    return '-';
  }
  return `¥${Number(value).toFixed(2)}`;
};

const formatPrizeAmount = (value?: number) => {
  if (!value) {
    return '¥0.00';
  }
  return `¥${(Number(value) / 100).toFixed(2)}`;
};

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

const statusLabel = (status?: string) => {
  const value = status || 'UNKNOWN';
  const labels: Record<string, string> = {
    DRAFT: '草稿',
    BOUGHT: '已购买',
    CHECKED: '已兑奖',
    VOID: '作废',
    UNKNOWN: '未知'
  };
  return labels[value] || value;
};

const statusColor = (status?: string) => {
  if (status === 'CHECKED') {
    return 'blue';
  }
  if (status === 'BOUGHT') {
    return 'green';
  }
  if (status === 'VOID') {
    return 'default';
  }
  return 'gold';
};

const emptySummary: LotteryTicketSummary = {
  ticketCount: 0,
  checkedTicketCount: 0,
  pendingTicketCount: 0,
  winningTicketCount: 0,
  totalCost: 0,
  totalPrizeAmount: 0,
  statusDistribution: {},
  prizeDistribution: {}
};

const LotteryTicketPage = () => {
  const [tickets, setTickets] = useState<LotteryTicket[]>([]);
  const [summary, setSummary] = useState<LotteryTicketSummary>(emptySummary);
  const [issue, setIssue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const queryParams = useMemo(() => ({
    issue: issue.trim() || undefined
  }), [issue]);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [ticketItems, ticketSummary] = await Promise.all([
        lotteryTicketApi.tickets(queryParams),
        lotteryTicketApi.summary()
      ]);
      setTickets(ticketItems);
      setSummary(ticketSummary || emptySummary);
    } catch (requestError) {
      console.error('获取彩票票据失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '获取彩票票据失败');
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const columns: ColumnsType<LotteryTicket> = [
    {
      title: '期号',
      dataIndex: 'issue',
      key: 'issue',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <strong>{record.issue || record.period || '-'}</strong>
          <span className="stock-quote-code">{record.source || 'MANUAL'}</span>
        </Space>
      )
    },
    {
      title: '号码',
      key: 'numbers',
      render: (_, record) => <LotteryBalls redNumbers={record.redNumbers || []} blueNumber={record.blueNumber || ''} />
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: value => <Tag color={statusColor(value)}>{statusLabel(value)}</Tag>
    },
    {
      title: '数量/成本',
      key: 'cost',
      align: 'right',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>{record.quantity || 1} 注</span>
          <strong>{formatMoney(record.cost)}</strong>
        </Space>
      )
    },
    {
      title: '兑奖',
      key: 'prize',
      render: (_, record) => record.prizeResult ? (
        <Space direction="vertical" size={0}>
          <Tag color={record.prizeResult.winning ? 'blue' : 'default'}>{record.prizeResult.prizeName || record.prizeGrade}</Tag>
          <span className="stock-quote-code">红 {record.prizeResult.redHits ?? '-'}/6 · {record.prizeResult.blueHit ? '蓝中' : '蓝未中'}</span>
        </Space>
      ) : <Tag>待开奖</Tag>
    },
    {
      title: '更新',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: value => formatTime(value)
    }
  ];

  return (
    <LifePageShell
      className="lottery-prediction-page"
      eyebrow="彩票数据"
      title="我的彩票"
      actions={
        <Space wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="按期号筛选"
            value={issue}
            onChange={event => setIssue(event.target.value)}
            style={{ width: 180 }}
          />
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadTickets}>
            刷新
          </Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}
      <section className="lottery-history-summary-grid">
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <TrophyOutlined />
            <div>
              <strong>{summary.ticketCount || 0}</strong>
              <span>票据数量</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <TrophyOutlined />
            <div>
              <strong>{summary.winningTicketCount || 0}</strong>
              <span>中奖票据</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <TrophyOutlined />
            <div>
              <strong>{formatMoney(summary.totalCost)}</strong>
              <span>总成本</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <TrophyOutlined />
            <div>
              <strong>{formatPrizeAmount(summary.totalPrizeAmount)}</strong>
              <span>已开奖金</span>
            </div>
          </div>
        </Card>
      </section>

      <Card className="life-panel-card">
        <Table
          rowKey={record => record.id || `${record.issue}-${record.blueNumber}-${record.createdAt}`}
          columns={columns}
          dataSource={tickets}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 920 }}
        />
      </Card>
    </LifePageShell>
  );
};

export default LotteryTicketPage;
