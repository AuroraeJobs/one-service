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
import { useAppPreferences } from '../contexts/AppPreferencesContext';

const LifeStockAnalysisPage = () => {
  const { isEnglish } = useAppPreferences();
  const text = {
    loadFailed: isEnglish ? 'Failed to load stock analysis' : '获取股票分析失败',
    notCalculated: isEnglish ? 'Not calculated yet' : '尚未计算',
    symbol: isEnglish ? 'Symbol' : '标的',
    value: isEnglish ? 'Value' : '数值',
    percent: isEnglish ? 'Percent' : '比例',
    message: isEnglish ? 'Description' : '说明',
    action: isEnglish ? 'Action' : '操作',
    stock: isEnglish ? 'Stock' : '个股',
    eyebrow: isEnglish ? 'Stock Analysis' : '股票分析',
    title: isEnglish ? 'Read concentration, volatility, drawdown, and gain/loss rankings from backend analysis services to inspect portfolio risk.' : '从后端分析服务读取集中度、波动、回撤和涨跌榜，辅助检查组合风险。',
    refresh: isEnglish ? 'Refresh Analysis' : '刷新分析',
    maxConcentration: isEnglish ? 'Max Concentration' : '最高集中度',
    gainersCount: isEnglish ? 'Gainers' : '上涨榜数量',
    losersCount: isEnglish ? 'Losers' : '下跌榜数量',
    stockUnit: isEnglish ? 'stocks' : '只',
    calculatedAt: isEnglish ? 'Calculated At' : '计算时间',
    concentration: isEnglish ? 'Concentration' : '集中度',
    concentrationDesc: isEnglish ? 'Identify single-symbol exposure by market-value share.' : '按持仓市值占比识别单一标的暴露。',
    volatility: isEnglish ? 'Volatility' : '波动',
    volatilityDesc: isEnglish ? 'Based on the average absolute change over the latest 60 daily K-lines.' : '基于近60日K线平均绝对涨跌幅。',
    drawdown: isEnglish ? 'Drawdown' : '回撤',
    drawdownDesc: isEnglish ? 'Calculate maximum drawdown from closing prices over the latest 60 days.' : '基于近60日收盘价计算最大回撤。',
    concentrationTable: isEnglish ? 'Position Concentration' : '持仓集中度',
    volatilityTable: isEnglish ? '60-Day Volatility' : '近60日波动',
    drawdownTable: isEnglish ? '60-Day Drawdown' : '近60日回撤',
    topGainers: isEnglish ? 'Top Gainers Today' : '今日涨幅榜',
    topLosers: isEnglish ? 'Top Losers Today' : '今日跌幅榜',
    tableDescription: isEnglish ? 'Metrics are calculated by backend analysis services; the frontend only displays and navigates.' : '指标由后端分析服务计算，前端只负责展示和跳转。',
    empty: isEnglish ? 'No analysis data.' : '暂无分析数据。'
  };
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
      setError(requestError instanceof Error ? requestError.message : text.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [text.loadFailed]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const calculatedAt = useMemo(() => {
    return summary?.calculatedAt ? new Date(summary.calculatedAt).toLocaleString() : text.notCalculated;
  }, [summary?.calculatedAt, text.notCalculated]);

  const columns = useMemo<ColumnsType<StockAnalysisItem>>(() => [
    {
      title: text.symbol,
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
      title: text.value,
      dataIndex: 'value',
      key: 'value',
      align: 'right',
      render: value => formatMoney(value)
    },
    {
      title: text.percent,
      dataIndex: 'percent',
      key: 'percent',
      align: 'right',
      render: value => formatPercent(value)
    },
    {
      title: text.message,
      dataIndex: 'message',
      key: 'message',
      render: value => value ? <Tag>{value}</Tag> : '-'
    },
    {
      title: text.action,
      key: 'action',
      width: 96,
      render: (_, record) => record.symbol ? (
        <Button type="link" onClick={() => navigate(`/investments/stocks/${record.symbol}`)}>
          {text.stock}
        </Button>
      ) : '-'
    }
  ], [navigate, text.action, text.message, text.percent, text.stock, text.symbol, text.value]);

  return (
    <LifePageShell
      className="life-investment-page"
      eyebrow={text.eyebrow}
      title={text.title}
      actions={
        <Button type="primary" icon={<ReloadOutlined spin={loading} />} loading={loading} onClick={loadSummary}>
          {text.refresh}
        </Button>
      }
    >
      {error ? <Alert type="error" showIcon message={error} className="stock-market-alert" /> : null}

      <MetricGrid gap={16} minColumnWidth={200}>
        <MetricCard title={text.maxConcentration} value={formatPercent(summary?.concentrationPercent)} suffix={summary?.concentrationSymbol || ''} accent="#5856d6" />
        <MetricCard title={text.gainersCount} value={summary?.topGainers?.length || 0} suffix={text.stockUnit} accent="#f5222d" />
        <MetricCard title={text.losersCount} value={summary?.topLosers?.length || 0} suffix={text.stockUnit} accent="#16a34a" />
        <MetricCard title={text.calculatedAt} value={calculatedAt} accent="#0071e3" valueStyle={{ fontSize: 18 }} />
      </MetricGrid>

      <section className="life-section-grid life-section-grid-three">
        <AnalysisCard title={text.concentration} description={text.concentrationDesc} icon={<PieChartOutlined />} accent="#5856d6" />
        <AnalysisCard title={text.volatility} description={text.volatilityDesc} icon={<LineChartOutlined />} accent="#ff9500" />
        <AnalysisCard title={text.drawdown} description={text.drawdownDesc} icon={<BarChartOutlined />} accent="#0071e3" />
      </section>

      <AnalysisTable title={text.concentrationTable} description={text.tableDescription} emptyText={text.empty} data={summary?.concentration || []} columns={columns} loading={loading} />
      <AnalysisTable title={text.volatilityTable} description={text.tableDescription} emptyText={text.empty} data={summary?.volatility || []} columns={columns} loading={loading} />
      <AnalysisTable title={text.drawdownTable} description={text.tableDescription} emptyText={text.empty} data={summary?.drawdown || []} columns={columns} loading={loading} />
      <AnalysisTable title={text.topGainers} description={text.tableDescription} emptyText={text.empty} data={summary?.topGainers || []} columns={columns} loading={loading} />
      <AnalysisTable title={text.topLosers} description={text.tableDescription} emptyText={text.empty} data={summary?.topLosers || []} columns={columns} loading={loading} />
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

const AnalysisTable = ({ title, description, emptyText, data, columns, loading }: {
  title: string;
  description: string;
  emptyText: string;
  data: StockAnalysisItem[];
  columns: ColumnsType<StockAnalysisItem>;
  loading: boolean;
}) => (
  <Card className="life-panel-card stock-market-panel">
    <div className="stock-market-toolbar">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
    <Table
      rowKey={record => `${title}-${record.symbol || 'unknown'}-${record.message || 'item'}`}
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      locale={{ emptyText }}
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
