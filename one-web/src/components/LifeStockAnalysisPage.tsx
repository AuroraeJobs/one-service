import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Button, Card, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { BarChartOutlined, LineChartOutlined, PieChartOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import MetricCard from './MetricCard';
import MetricGrid from './MetricGrid';
import { stockApi, type StockAnalysisItem, type StockAnalysisSummary } from '../services/api';

const LifeStockAnalysisPage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<StockAnalysisSummary>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const data = await stockApi.analysisSummary();
      setSummary(data);
    } catch (requestError) {
      console.error('获取股票分析失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '获取股票分析失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const calculatedAt = useMemo(() => {
    return summary?.calculatedAt ? new Date(summary.calculatedAt).toLocaleString() : '尚未计算';
  }, [summary?.calculatedAt]);

  const columns = useMemo<ColumnsType<StockAnalysisItem>>(() => [
    {
      title: '标的',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <strong>{record.name || record.symbol || '-'}</strong>
          <span className="stock-quote-code">{record.symbol || '-'}</span>
        </Space>
      )
    },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
      align: 'right',
      render: value => formatMoney(value)
    },
    {
      title: '比例',
      dataIndex: 'percent',
      key: 'percent',
      align: 'right',
      render: value => formatPercent(value)
    },
    {
      title: '说明',
      dataIndex: 'message',
      key: 'message',
      render: value => value ? <Tag>{value}</Tag> : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 96,
      render: (_, record) => record.symbol ? (
        <Button type="link" onClick={() => navigate(`/investments/stocks/${record.symbol}`)}>
          个股
        </Button>
      ) : '-'
    }
  ], [navigate]);

  return (
    <LifePageShell
      className="life-investment-page"
      eyebrow="股票分析"
      title="从后端分析服务读取集中度、波动、回撤和涨跌榜，辅助检查组合风险。"
      actions={
        <Button type="primary" icon={<ReloadOutlined spin={loading} />} loading={loading} onClick={loadSummary}>
          刷新分析
        </Button>
      }
    >
      {error ? <Alert type="error" showIcon message={error} className="stock-market-alert" /> : null}

      <MetricGrid gap={16} minColumnWidth={200}>
        <MetricCard title="最高集中度" value={formatPercent(summary?.concentrationPercent)} suffix={summary?.concentrationSymbol || ''} accent="#5856d6" />
        <MetricCard title="上涨榜数量" value={summary?.topGainers?.length || 0} suffix="只" accent="#f5222d" />
        <MetricCard title="下跌榜数量" value={summary?.topLosers?.length || 0} suffix="只" accent="#16a34a" />
        <MetricCard title="计算时间" value={calculatedAt} accent="#0071e3" valueStyle={{ fontSize: 18 }} />
      </MetricGrid>

      <section className="life-section-grid life-section-grid-three">
        <AnalysisCard title="集中度" description="按持仓市值占比识别单一标的暴露。" icon={<PieChartOutlined />} accent="#5856d6" />
        <AnalysisCard title="波动" description="基于近60日K线平均绝对涨跌幅。" icon={<LineChartOutlined />} accent="#ff9500" />
        <AnalysisCard title="回撤" description="基于近60日收盘价计算最大回撤。" icon={<BarChartOutlined />} accent="#0071e3" />
      </section>

      <AnalysisTable title="持仓集中度" data={summary?.concentration || []} columns={columns} loading={loading} />
      <AnalysisTable title="近60日波动" data={summary?.volatility || []} columns={columns} loading={loading} />
      <AnalysisTable title="近60日回撤" data={summary?.drawdown || []} columns={columns} loading={loading} />
      <AnalysisTable title="今日涨幅榜" data={summary?.topGainers || []} columns={columns} loading={loading} />
      <AnalysisTable title="今日跌幅榜" data={summary?.topLosers || []} columns={columns} loading={loading} />
    </LifePageShell>
  );
};

const AnalysisCard = ({ title, description, icon, accent }: { title: string; description: string; icon: ReactNode; accent: string }) => (
  <Card className="life-module-card">
    <div className="life-module-card-head">
      <span className="life-module-icon" style={{ color: accent }}>
        {icon}
      </span>
    </div>
    <h2>{title}</h2>
    <p>{description}</p>
  </Card>
);

const AnalysisTable = ({ title, data, columns, loading }: {
  title: string;
  data: StockAnalysisItem[];
  columns: ColumnsType<StockAnalysisItem>;
  loading: boolean;
}) => (
  <Card className="life-panel-card stock-market-panel">
    <div className="stock-market-toolbar">
      <div>
        <h2>{title}</h2>
        <p>指标由后端分析服务计算，前端只负责展示和跳转。</p>
      </div>
    </div>
    <Table
      rowKey={record => `${title}-${record.symbol || 'unknown'}-${record.message || 'item'}`}
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      locale={{ emptyText: '暂无分析数据。' }}
      scroll={{ x: 760 }}
      rowClassName="stock-quote-row"
    />
  </Card>
);

const formatMoney = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatPercent = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return `${value.toFixed(2)}%`;
};

export default LifeStockAnalysisPage;
