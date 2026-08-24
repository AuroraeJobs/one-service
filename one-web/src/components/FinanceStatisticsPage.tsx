import { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import LifePageShell from './LifePageShell';
import MetricCard from './MetricCard';
import MetricGrid from './MetricGrid';
import MonthRangePicker from './MonthRangePicker';
import { enumerateMonthRange, monthToIndex, type MonthRangeValue } from '../utils/monthRange';
import { salaryRecordApi, type SalaryRecord } from '../services/api';
import { useAppPreferences } from '../contexts/AppPreferencesContext';

interface MonthlyFinanceSummary {
  key: string;
  year: number;
  month: number;
  totalIncome: number;
  actualIncome: number;
  taxPaid: number;
}

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const FinanceStatisticsPage = () => {
  const { colorMode, isEnglish } = useAppPreferences();
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [selectedRange, setSelectedRange] = useState<MonthRangeValue>();
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const text = {
    eyebrow: isEnglish ? 'Finance Statistics' : '财务统计',
    title: isEnglish ? 'Income, net income, and tax trends by time range' : '按时间区间查看收入、实发与税费趋势',
    salaryCount: isEnglish ? 'Salary Records' : '工资数',
    bonusCount: isEnglish ? 'Bonus Records' : '奖金数',
    totalIncome: isEnglish ? 'Total Income' : '累计收入',
    actualIncome: isEnglish ? 'Net Income' : '累计实发',
    taxPaid: isEnglish ? 'Tax Paid' : '累计税费',
    monthlyTrend: isEnglish ? 'Monthly Trend' : '月度趋势',
    month: isEnglish ? 'Month' : '月份',
    empty: isEnglish ? 'No finance records in this time range' : '该时间范围内暂无财务记录',
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
        if (latestYear !== undefined) {
          setSelectedRange([{ year: latestYear, month: 1 }, { year: latestYear, month: 12 }]);
        }
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

  const effectiveRange = useMemo<MonthRangeValue | undefined>(() => {
    if (selectedRange) return selectedRange;
    if (records.length === 0) return undefined;
    const sorted = [...records].sort((a, b) => monthToIndex(a) - monthToIndex(b));
    return [
      { year: sorted[0].year, month: sorted[0].month },
      { year: sorted[sorted.length - 1].year, month: sorted[sorted.length - 1].month }
    ];
  }, [records, selectedRange]);

  const selectedRecords = useMemo(() => records.filter(record => {
    if (!selectedRange) return true;
    const recordIndex = monthToIndex(record);
    return recordIndex >= monthToIndex(selectedRange[0]) && recordIndex <= monthToIndex(selectedRange[1]);
  }), [records, selectedRange]);
  const monthlyData = useMemo<MonthlyFinanceSummary[]>(() => (effectiveRange ? enumerateMonthRange(effectiveRange) : []).map(monthValue => {
    const monthRecords = selectedRecords.filter(record => record.year === monthValue.year && record.month === monthValue.month);
    return {
      key: `${monthValue.year}-${monthValue.month}`,
      year: monthValue.year,
      month: monthValue.month,
      totalIncome: roundMoney(monthRecords.reduce((sum, record) => sum + (record.monthlyIncome || 0) + (record.otherIncome || 0), 0)),
      actualIncome: roundMoney(monthRecords.reduce((sum, record) => sum + (record.actualIncome || 0), 0)),
      taxPaid: roundMoney(monthRecords.reduce((sum, record) => sum + (record.currentTaxDeclaration || 0), 0))
    };
  }), [effectiveRange, selectedRecords]);

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
      data: monthlyData.map(item => {
        const spansYears = effectiveRange?.[0].year !== effectiveRange?.[1].year;
        if (spansYears) return `${item.year}-${String(item.month).padStart(2, '0')}`;
        return isEnglish ? String(item.month) : `${item.month}月`;
      }),
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
  }), [axisColor, colorMode, effectiveRange, isEnglish, monthlyData, text.actualIncome, text.taxPaid, text.totalIncome]);

  const columns: ColumnsType<MonthlyFinanceSummary> = [
    {
      title: text.month,
      key: 'month',
      render: (_, record) => isEnglish
        ? `${record.year}-${String(record.month).padStart(2, '0')}`
        : `${record.year}年${record.month}月`
    },
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
        <MonthRangePicker value={selectedRange} onChange={setSelectedRange} isEnglish={isEnglish} />
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
          rowKey="key"
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
