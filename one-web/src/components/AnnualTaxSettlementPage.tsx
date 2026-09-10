import { useEffect, useState } from 'react';
import LifePageShell from './LifePageShell';
import AnnualTaxSettlementCard from './AnnualTaxSettlementCard';
import { salaryRecordApi, type SalaryRecord } from '../services/api';
import { useAppPreferences } from '../contexts/AppPreferencesContext';

const AnnualTaxSettlementPage = () => {
  const { isEnglish } = useAppPreferences();
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const text = {
    eyebrow: isEnglish ? 'Annual Tax Settlement' : '年度综合汇算',
    title: isEnglish ? 'Annual comprehensive individual income tax settlement' : '年度综合个人所得税汇算清缴'
  };

  useEffect(() => {
    let active = true;
    salaryRecordApi.findAll()
      .then(result => {
        if (!active) return;
        setRecords(result || []);
      })
      .catch(() => {
        // ignore
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <LifePageShell eyebrow={text.eyebrow} title={text.title}>
      <AnnualTaxSettlementCard records={records} loading={loading} />
    </LifePageShell>
  );
};

export default AnnualTaxSettlementPage;
