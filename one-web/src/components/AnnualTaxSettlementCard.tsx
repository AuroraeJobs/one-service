import { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Select } from 'antd';
import MetricCard from './MetricCard';
import MetricGrid from './MetricGrid';
import { salaryRecordApi, type AnnualTaxSettlement, type SalaryRecord } from '../services/api';
import { useAppPreferences } from '../contexts/AppPreferencesContext';

interface AnnualTaxSettlementCardProps {
  records: SalaryRecord[];
  loading?: boolean;
}

const formatCurrency = (value: number) => `¥${value.toFixed(2)}`;

const AnnualTaxSettlementCard = ({ records, loading = false }: AnnualTaxSettlementCardProps) => {
  const { isEnglish } = useAppPreferences();
  const [selectedYear, setSelectedYear] = useState<number>();
  const [loadedSettlement, setLoadedSettlement] = useState<AnnualTaxSettlement>();
  const [failedYear, setFailedYear] = useState<number>();
  const availableYears = useMemo(() => Array.from(new Set(records.map(record => record.year)))
    .sort((a, b) => b - a), [records]);
  const effectiveYear = selectedYear !== undefined && availableYears.includes(selectedYear)
    ? selectedYear
    : availableYears[0];
  const settlement = loadedSettlement?.year === effectiveYear ? loadedSettlement : undefined;

  useEffect(() => {
    if (effectiveYear === undefined) return undefined;
    let active = true;
    salaryRecordApi.getAnnualSettlement(effectiveYear)
      .then(result => {
        if (!active) return;
        setLoadedSettlement(result);
        setFailedYear(undefined);
      })
      .catch(() => {
        if (active) setFailedYear(effectiveYear);
      });
    return () => {
      active = false;
    };
  }, [effectiveYear, records]);

  const text = {
    title: isEnglish ? 'Annual Comprehensive Tax Settlement' : '年度综合汇算',
    year: isEnglish ? 'Settlement year' : '汇算年度',
    description: isEnglish
      ? 'Estimated from recorded salary, bonus, and deductions. Other income is excluded.'
      : '按已录入的工资、奖金和扣除估算，其它收入不参与计算。',
    salaryIncome: isEnglish ? 'Salary Income' : '工资收入',
    bonusIncome: isEnglish ? 'Total Bonus' : '奖金总额',
    taxableIncome: isEnglish ? 'Taxable Income' : '应纳税所得额',
    calculatedTax: isEnglish ? 'Calculated Annual Tax' : '年度应纳税额',
    actualTaxPaid: isEnglish ? 'Tax Already Paid' : '实际已纳税额',
    settlementResult: isEnglish ? 'Settlement Result' : '汇算结果',
    taxDue: isEnglish ? 'Estimated tax due' : '预计补税',
    taxRefund: isEnglish ? 'Estimated refund' : '预计退税',
    balanced: isEnglish ? 'No additional tax or refund' : '无需补税或退税',
    includedIncome: isEnglish ? 'Included income' : '计入汇算收入',
    standardDeduction: isEnglish ? 'Annual standard deduction' : '年度减除费用',
    socialInsurance: isEnglish ? 'Social insurance and housing fund' : '五险一金扣除',
    excludedOtherIncome: isEnglish ? 'Excluded other income' : '已排除其它收入',
    taxBracket: isEnglish ? 'Applied bracket' : '适用税档',
    quickDeduction: isEnglish ? 'Quick deduction' : '速算扣除数',
    empty: isEnglish ? 'No salary or bonus records available' : '暂无可汇算的工资或奖金记录',
    loadFailed: isEnglish ? 'Failed to calculate annual tax settlement' : '年度综合汇算计算失败',
    disclaimer: isEnglish
      ? 'Estimate only. Confirm the final filing amount in the official Individual Income Tax app.'
      : '结果仅供估算，最终申报金额请以个人所得税 APP 为准。'
  };

  const resultType = !settlement || settlement.difference === 0
    ? 'balanced'
    : settlement.difference > 0 ? 'due' : 'refund';
  const resultLabel = resultType === 'due' ? text.taxDue : resultType === 'refund' ? text.taxRefund : text.balanced;
  const resultAmount = settlement ? (resultType === 'due' ? settlement.taxDue : settlement.taxRefund) : 0;

  return (
    <Card
      className="life-panel-card annual-tax-settlement-card"
      title={text.title}
      loading={loading || (effectiveYear !== undefined && !settlement && failedYear !== effectiveYear)}
      extra={availableYears.length > 0 ? (
        <Select
          aria-label={text.year}
          value={effectiveYear}
          options={availableYears.map(year => ({ value: year, label: isEnglish ? String(year) : `${year}年` }))}
          onChange={setSelectedYear}
          style={{ minWidth: 112 }}
        />
      ) : undefined}
    >
      {failedYear === effectiveYear ? (
        <Alert type="error" message={text.loadFailed} />
      ) : !settlement ? (
        <div className="annual-tax-empty">{text.empty}</div>
      ) : (
        <>
          <p className="annual-tax-description">{text.description}</p>

          <MetricGrid gap={16} minColumnWidth={190}>
            <MetricCard title={text.salaryIncome} value={settlement.salaryIncome} prefix="¥" accent="#52c41a" />
            <MetricCard title={text.bonusIncome} value={settlement.bonusIncome} prefix="¥" accent="#faad14" />
            <MetricCard title={text.taxableIncome} value={settlement.taxableIncome} prefix="¥" accent="#1677ff" />
            <MetricCard title={text.calculatedTax} value={settlement.calculatedTax} prefix="¥" accent="#9c27b0" />
          </MetricGrid>

          <div className={`annual-tax-result is-${resultType}`}>
            <div>
              <span>{text.settlementResult}</span>
              <strong>{resultLabel}{resultType === 'balanced' ? '' : ` ${formatCurrency(resultAmount)}`}</strong>
            </div>
            <div>
              <span>{text.actualTaxPaid}</span>
              <strong>{formatCurrency(settlement.actualTaxPaid)}</strong>
            </div>
          </div>

          <div className="annual-tax-breakdown">
            <div><span>{text.includedIncome}</span><strong>{formatCurrency(settlement.includedIncome)}</strong></div>
            <div><span>{text.standardDeduction}</span><strong>-{formatCurrency(settlement.standardDeduction)}</strong></div>
            <div><span>{text.socialInsurance}</span><strong>-{formatCurrency(settlement.socialInsuranceDeduction)}</strong></div>
            <div><span>{text.excludedOtherIncome}</span><strong>{formatCurrency(settlement.excludedOtherIncome)}</strong></div>
            <div><span>{text.taxBracket}</span><strong>{settlement.bracketLevel} / {(settlement.taxRate * 100).toFixed(0)}%</strong></div>
            <div><span>{text.quickDeduction}</span><strong>{formatCurrency(settlement.quickDeduction)}</strong></div>
          </div>

          <p className="annual-tax-disclaimer">{text.disclaimer}</p>
        </>
      )}
    </Card>
  );
};

export default AnnualTaxSettlementCard;
