import { useEffect, useState } from 'react';
import { Alert, Button, Card, Descriptions, Empty, Space, Spin, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowLeftOutlined, BarChartOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import LotteryBalls from './lottery/LotteryBalls';
import { lotteryBacktestApi, type LotteryBacktestReplayRow, type LotteryBacktestReport } from '../services/api';
import './LotteryOverviewPage.css';

const formatMoney = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return `¥${Number(value).toFixed(2)}`;
};

const LotteryBacktestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<LotteryBacktestReport>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const loadDetail = async () => {
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
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

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
      <Spin spinning={loading}>
        {!report && !loading ? (
          <Card className="life-panel-card">
            <Empty description="未找到回测报告" />
          </Card>
        ) : report ? (
          <section className="lottery-detail-grid">
            <Card className="life-panel-card lottery-detail-main-card" title={report.strategyName || '未命名回测'}>
              <Descriptions column={3} size="small">
                <Descriptions.Item label="窗口">{report.presetWindow || '-'}</Descriptions.Item>
                <Descriptions.Item label="期号">{report.issueStart || '-'} 到 {report.issueEnd || '-'}</Descriptions.Item>
                <Descriptions.Item label="回放">{report.replayCount || 0}</Descriptions.Item>
                <Descriptions.Item label="红球均值">{report.averageRedHits ?? 0}</Descriptions.Item>
                <Descriptions.Item label="蓝球率">{report.blueHitRate ?? 0}%</Descriptions.Item>
                <Descriptions.Item label="稳定分">{report.stabilityScore ?? 0}</Descriptions.Item>
                <Descriptions.Item label="成本">{formatMoney(report.totalCost)}</Descriptions.Item>
                <Descriptions.Item label="奖金">{formatMoney(report.totalPrize)}</Descriptions.Item>
                <Descriptions.Item label="净值">{formatMoney(report.netResult)}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card className="life-panel-card lottery-detail-main-card" title="奖级分布">
              <div className="lottery-prediction-tags">
                {Object.entries(report.prizeDistribution || {}).map(([name, count]) => (
                  <span key={name}>{name}: {count}</span>
                ))}
              </div>
            </Card>

            <Card className="life-panel-card lottery-detail-main-card" title="回放明细">
              <Table
                rowKey={row => row.issue || `${row.drawDate}-${row.score}`}
                columns={columns}
                dataSource={report.rows || []}
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
