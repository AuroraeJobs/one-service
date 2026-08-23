import { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Select, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import LifePageShell from './LifePageShell';
import MetricCard from './MetricCard';
import MetricGrid from './MetricGrid';
import { salaryRecordApi, type SalaryRecord } from '../services/api';
import { useAppPreferences } from '../contexts/AppPreferencesContext';

interface MonthlyFinanceSummary {
  month: number;
  totalIncome: number;
  actualIncome: number;
  taxPaid: number;
}

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const FinanceStatisticsPage = () => {
  const { colorMode, isEnglish } = useAppPreferences();
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>();
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const text = {
    eyebrow: isEnglish ? 'Finance Statistics' : '财务统计',
    title: isEnglish ? 'Annual income, net income, and tax trends' : '年度收入、实发与税费趋势',
    year: isEnglish ? 'Year' : '年份',
    salaryCount: isEnglish ? 'Salary Records' : '工资数',
    bonusCount: isEnglish ? 'Bonus Records' : '奖金数',
    totalIncome: isEnglish ? 'Total Income' : '累计收入',
    actualIncome: isEnglish ? 'Net Income' : '累计实发',
    taxPaid: isEnglish ? 'Tax Paid' : '累计税费',
    monthlyTrend: isEnglish ? 'Monthly Trend' : '月度趋势',
    month: isEnglish ? 'Month' : '月份',
    empty: isEnglish ? 'No finance records for this year' : '该年份暂无财务记录',
    loadFailed: isEnglish ? 'Failed to load finance statistics' : '财务统计加载失败'
  };

  useEffect(() => {
    let active = true;
    salaryRecordApi.findAll()
      .then(result => {
        if (!active) return;
        setRecords(result);
        const latestYear = result.reduce<number | undefined>((latest, record) => (
          latest === undefined || record.year > latest ? record.year : latest
        ), undefined);
        setSelectedYear(latestYear);
      })
      .catch(() => {
        if (active) setLoadFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const yearOptions = useMemo(() => Array.from(new Set(records.map(record => record.year)))
    .sort((a, b) => b - a)
    .map(year => ({ value: year, label: isEnglish ? String(year) : `${year}年` })), [isEnglish, records]);

  const selectedRecords = useMemo(() => records.filter(record => record.year === selectedYear), [records, selectedYear]);
  const monthlyData = useMemo<MonthlyFinanceSummary[]>(() => Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const monthRecords = selectedRecords.filter(record => record.month === month);
    return {
      month,
      totalIncome: roundMoney(monthRecords.reduce((sum, record) => sum + (record.monthlyIncome || 0) + (record.otherIncome || 0), 0)),
      actualIncome: roundMoney(monthRecords.reduce((sum, record) => sum + (record.actualIncome || 0), 0)),
      taxPaid: roundMoney(monthRecords.reduce((sum, record) => sum + (record.currentTaxDeclaration || 0), 0))
    };
  }), [selectedRecords]);

  const salaryCount = selectedRecords.filter(record => (record.recordType || 'SALARY') === 'SALARY').length;
  const bonusCount = selectedRecords.filter(record => record.recordType === 'BONUS').length;
  const totalIncome = roundMoney(monthlyData.reduce((sum, item) => sum + item.totalIncome, 0));
  const actualIncome = roundMoney(monthlyData.reduce((sum, item) => sum + item.actualIncome, 0));
  const taxPaid = roundMoney(monthlyData.reduce((sum, item) => sum + item.taxPaid, 0));
  const axisColor = colorMode === 'dark' ? '#8c8c8c' : '#6e6e73';

  const chartOption = useMemo<EChartsOption>(() => ({
    animationDuration: 300,
    color: ['#faad14', '#52c41a', '#9c27b0'],
    tooltip: { trigger: 'axis', valueFormatter: value => `¥${Number(value || 0).toFixed(2)}` },
    legend: { top: 0, textStyle: { color: axisColor } },
    grid: { left: 24, right: 24, top: 52, bottom: 24, containLabel: true },
    xAxis: {
      type: 'category',
      data: monthlyData.map(item => isEnglish ? String(item.month) : `${item.month}月`),
      axisLabel: { color: axisColor },
      axisLine: { lineStyle: { color: axisColor } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: axisColor, formatter: (value: number) => `¥${value}` },
      splitLine: { lineStyle: { color: colorMode === 'dark' ? '#262626' : '#e5e5ea' } }
    },
    series: [
      { name: text.totalIncome, type: 'bar', data: monthlyData.map(item => item.totalIncome), barMaxWidth: 30 },
      { name: text.actualIncome, type: 'line', data: monthlyData.map(item => item.actualIncome), smooth: true, symbolSize: 7 },
      { name: text.taxPaid, type: 'line', data: monthlyData.map(item => item.taxPaid), smooth: true, symbolSize: 7 }
    ]
  }), [axisColor, colorMode, isEnglish, monthlyData, text.actualIncome, text.taxPaid, text.totalIncome]);

  const columns: ColumnsType<MonthlyFinanceSummary> = [
    { title: text.month, dataIndex: 'month', key: 'month', render: month => isEnglish ? month : `${month}月` },
    { title: text.totalIncome, dataIndex: 'totalIncome', key: 'totalIncome', align: 'right', render: value => `¥${value.toFixed(2)}` },
    { title: text.actualIncome, dataIndex: 'actualIncome', key: 'actualIncome', align: 'right', render: value => `¥${value.toFixed(2)}` },
    { title: text.taxPaid, dataIndex: 'taxPaid', key: 'taxPaid', align: 'right', render: value => `¥${value.toFixed(2)}` }
  ];

  return (
    <LifePageShell
      className="finance-statistics-page"
      eyebrow={text.eyebrow}
      title={text.title}
      actions={(
        <Select
          aria-label={text.year}
          value={selectedYear}
          options={yearOptions}
          placeholder={text.year}
          onChange={setSelectedYear}
          style={{ minWidth: 120 }}
        />
      )}
    >
      {loadFailed && <Alert type="error" showIcon message={text.loadFailed} />}
      <MetricGrid gap={16} minColumnWidth={200}>
        <MetricCard
          title={text.salaryCount}
          value={salaryCount}
          accent="#52c41a"
          secondaryTitle={text.bonusCount}
          secondaryValue={bonusCount}
          secondaryAccent="#faad14"
        />
        <MetricCard title={text.totalIncome} value={totalIncome} prefix="¥" accent="#faad14" />
        <MetricCard title={text.actualIncome} value={actualIncome} prefix="¥" accent="#52c41a" />
        <MetricCard title={text.taxPaid} value={taxPaid} prefix="¥" accent="#9c27b0" />
      </MetricGrid>

      <Card className="life-panel-card finance-statistics-chart-card" title={text.monthlyTrend} loading={loading}>
        <ReactECharts option={chartOption} style={{ width: '100%', height: 360 }} notMerge lazyUpdate />
      </Card>

      <Card className="life-panel-card finance-statistics-table-card" title={text.monthlyTrend}>
        <Table
          rowKey="month"
          columns={columns}
          dataSource={selectedRecords.length > 0 ? monthlyData : []}
          loading={loading}
          locale={{ emptyText: text.empty }}
          pagination={false}
          scroll={{ x: 640 }}
          size="small"
        />
      </Card>
    </LifePageShell>
  );
};

export default FinanceStatisticsPage;
