import React, { useState, useEffect } from 'react';
import MetricCard from './MetricCard';
import RecordCardList from './RecordCardList';
import { Button, Drawer, Form, Input, InputNumber, message, Row, Col, Select, Switch, Popconfirm } from 'antd';
import { PlusOutlined, CalendarOutlined, WalletOutlined, InsuranceOutlined, CalculatorOutlined, FileTextOutlined, LeftOutlined, RightOutlined, MinusSquareOutlined } from '@ant-design/icons';
import { salaryRecordApi } from '../services/api';
import type { SalaryRecord, SalaryStatistics } from '../services/api';
import { useAppPreferences } from '../contexts/AppPreferencesContext';

type SalaryRecordFormValues = Omit<SalaryRecord, 'id' | 'createdAt' | 'updatedAt'>;

const HealthSummerSolsticePage: React.FC = () => {
  const { isEnglish } = useAppPreferences();
  const text = {
    totalRecords: isEnglish ? 'Records' : '记录总数',
    totalActualIncome: isEnglish ? 'Total Net Income' : '累计实发',
    totalMonthlyIncome: isEnglish ? 'Total Income' : '累计收入',
    avgActualIncome: isEnglish ? 'Average Salary' : '平均工资',
    totalTaxPaid: isEnglish ? 'Total Tax Paid' : '累计已纳税',
    noRecords: isEnglish ? 'No salary records' : '暂无工资记录',
    company: isEnglish ? 'Company' : '公司',
    selectCompany: isEnglish ? 'Please select company' : '请选择公司',
    monthlyIncome: isEnglish ? 'Monthly Income' : '当月收入',
    totalIncome: isEnglish ? 'Total Income' : '总收入',
    currentTaxDeclaration: isEnglish ? 'Current Tax Declaration' : '本期申报税额',
    actualIncome: isEnglish ? 'Net Income' : '实际所得额',
    addRecord: isEnglish ? 'Add Salary Record' : '添加工资记录',
    salaryDetails: isEnglish ? 'Salary Details' : '工资详情',
    save: isEnglish ? 'Save' : '保存',
    edit: isEnglish ? 'Edit' : '编辑',
    delete: isEnglish ? 'Delete' : '删除',
    basicInfo: isEnglish ? 'Basic Info' : '基本信息',
    year: isEnglish ? 'Year' : '年份',
    month: isEnglish ? 'Month' : '月份',
    selectYear: isEnglish ? 'Please select year' : '请选择年份',
    selectMonth: isEnglish ? 'Please select month' : '请选择月份',
    enterYear: isEnglish ? 'Enter year' : '请输入年份',
    incomeInfo: isEnglish ? 'Income Info' : '收入信息',
    enterMonthlyIncome: isEnglish ? 'Please enter monthly income' : '请输入当月收入',
    otherIncome: isEnglish ? 'Other Income' : '其他收入',
    enterOtherIncome: isEnglish ? 'Please enter other income' : '请输入其他收入',
    standardDeduction: isEnglish ? 'Standard Deduction' : '减除费用',
    enterStandardDeduction: isEnglish ? 'Please enter standard deduction' : '请输入减除费用',
    socialInsurance: isEnglish ? 'Social Insurance and Housing Fund' : '五险一金',
    endowmentInsurance: isEnglish ? 'Pension Insurance' : '养老保险',
    medicalInsurance: isEnglish ? 'Medical Insurance' : '医疗保险',
    unemploymentInsurance: isEnglish ? 'Unemployment Insurance' : '失业保险',
    housingFund: isEnglish ? 'Housing Fund' : '住房公积金',
    specialDeduction: isEnglish ? 'Special Deduction' : '专项扣除',
    resetCumulative: isEnglish ? 'Restart Cumulative Tax (first month at new job)' : '重新累计（跳槽后新公司首月）',
    resetCumulativeShort: isEnglish ? 'Restart' : '重新累计',
    resetCumulativeTip: isEnglish ? 'Turn on to restart cumulative taxable income from this month' : '开启后，累计应纳税所得额从本月重新开始计算',
    notes: isEnglish ? 'Notes' : '备注',
    notesPlaceholder: isEnglish ? 'Notes' : '备注信息',
    calculationResults: isEnglish ? 'Calculation Results' : '计算结果',
    monthlyTaxableIncome: isEnglish ? 'Monthly Taxable Income' : '本月应纳税所得额',
    cumulativeTaxableIncome: isEnglish ? 'Cumulative Taxable Income' : '累计应纳税所得额',
    cumulativeTaxPayable: isEnglish ? 'Cumulative Tax Payable' : '累计应纳税额',
    cumulativeTaxPaid: isEnglish ? 'Cumulative Tax Paid' : '累计已缴纳税',
    fetchRecordsFailed: isEnglish ? 'Failed to load salary records' : '获取工资记录失败',
    fetchStatsFailed: isEnglish ? 'Failed to load statistics' : '获取统计数据失败',
    addSuccess: isEnglish ? 'Salary record added' : '工资记录添加成功',
    addFailed: isEnglish ? 'Failed to add salary record' : '添加失败',
    updateSuccess: isEnglish ? 'Salary record updated' : '工资记录更新成功',
    updateFailed: isEnglish ? 'Failed to update salary record' : '更新失败',
    deleteSuccess: isEnglish ? 'Salary record deleted' : '删除成功',
    deleteFailed: isEnglish ? 'Failed to delete salary record' : '删除失败',
    deleteConfirm: isEnglish ? 'Delete this salary record?' : '确定要删除这条工资记录吗？',
    ok: isEnglish ? 'OK' : '确定',
    cancel: isEnglish ? 'Cancel' : '取消',
    duplicateRecord: isEnglish ? 'A record for this year and month already exists' : '该年月已存在工资记录',
    previousPeriod: isEnglish ? 'Previous' : '上个月',
    nextPeriod: isEnglish ? 'Next' : '下个月',
    addPrevious: isEnglish ? 'Add Previous' : '新增上个月',
    addNext: isEnglish ? 'Add Next' : '新增下个月'
  };
  const monthOptions = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    return {
      value: month,
      label: isEnglish ? new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(2026, index, 1)) : `${month}月`
    };
  });
  const companyOptions = [
    { value: 'QUELLINK', zh: '移为', en: 'Queclink' },
    { value: 'PROUDSMART', zh: '普奥', en: 'Proudsmart' },
    { value: 'MOXI', zh: '摩羲', en: 'MOXI' },
  ].map(company => ({ value: company.value, label: isEnglish ? company.en : company.zh }));
  const formatYearMonth = (record: SalaryRecord) => (
    isEnglish ? `${monthOptions[record.month - 1]?.label || record.month} ${record.year}` : `${record.year}年${record.month}月`
  );

  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [statistics, setStatistics] = useState<SalaryStatistics | null>(null);
  const [isAddDrawerVisible, setIsAddDrawerVisible] = useState(false);
  const [isEditDrawerVisible, setIsEditDrawerVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SalaryRecord | null>(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  // 监听编辑表单的五险一金字段变化
  const editEndowmentInsurance = Form.useWatch('endowmentInsurance', editForm);
  const editMedicalInsurance = Form.useWatch('medicalInsurance', editForm);
  const editUnemploymentInsurance = Form.useWatch('unemploymentInsurance', editForm);
  const editHousingFund = Form.useWatch('housingFund', editForm);
  const editSpecialDeduction = Number(((editEndowmentInsurance || 0) + (editMedicalInsurance || 0) + (editUnemploymentInsurance || 0) + (editHousingFund || 0)).toFixed(2));

  const editMonthlyIncome = Form.useWatch('monthlyIncome', editForm);
  const editOtherIncome = Form.useWatch('otherIncome', editForm);
  const editTotalIncome = (editMonthlyIncome || 0) + (editOtherIncome || 0);

  // 监听添加表单的五险一金字段变化
  const addEndowmentInsurance = Form.useWatch('endowmentInsurance', addForm);
  const addMedicalInsurance = Form.useWatch('medicalInsurance', addForm);
  const addUnemploymentInsurance = Form.useWatch('unemploymentInsurance', addForm);
  const addHousingFund = Form.useWatch('housingFund', addForm);
  const addSpecialDeduction = Number(((addEndowmentInsurance || 0) + (addMedicalInsurance || 0) + (addUnemploymentInsurance || 0) + (addHousingFund || 0)).toFixed(2));

  const addMonthlyIncome = Form.useWatch('monthlyIncome', addForm);
  const addOtherIncome = Form.useWatch('otherIncome', addForm);
  const addTotalIncome = (addMonthlyIncome || 0) + (addOtherIncome || 0);

  const fetchSalaryRecords = async () => {
    try {
      const records = await salaryRecordApi.findAll();
      setSalaryRecords(records);
    } catch {
      message.error(text.fetchRecordsFailed);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await salaryRecordApi.getStatistics();
      setStatistics(stats);
    } catch {
      message.error(text.fetchStatsFailed);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void fetchSalaryRecords();
      void fetchStatistics();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const yearOptions = Array.from(
    new Set(salaryRecords.map(r => r.year).filter((y): y is number => typeof y === 'number'))
  ).sort((a, b) => b - a).map(year => ({
    label: isEnglish ? String(year) : `${year}年`,
    value: year
  }));

  const filteredSalaryRecords = salaryRecords.filter(record =>
    (!selectedYear || record.year === selectedYear) &&
    (!selectedCompany || record.company === selectedCompany)
  );

  const showAddDrawer = () => {
    let year = new Date().getFullYear();
    let month = new Date().getMonth() + 1;
    let standardDeduction = 5000;
    let endowmentInsurance = 0;
    let medicalInsurance = 0;
    let unemploymentInsurance = 0;
    let housingFund = 0;
    let company: string | undefined;
    
    if (salaryRecords.length > 0) {
      const latestRecord = salaryRecords[0];
      year = latestRecord.year || year;
      month = latestRecord.month || month;
      
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
      
      standardDeduction = latestRecord.standardDeduction || 5000;
      endowmentInsurance = latestRecord.endowmentInsurance || 0;
      medicalInsurance = latestRecord.medicalInsurance || 0;
      unemploymentInsurance = latestRecord.unemploymentInsurance || 0;
      housingFund = latestRecord.housingFund || 0;
      company = latestRecord.company;
    }
    
    addForm.setFieldsValue({
      year,
      month,
      company,
      standardDeduction,
      endowmentInsurance,
      medicalInsurance,
      unemploymentInsurance,
      housingFund,
    });
    setIsAddDrawerVisible(true);
  };

  const showEditDrawer = (record: SalaryRecord) => {
    setEditingRecord(record);
    editForm.setFieldsValue(record);
    setIsEditing(false);
    setIsEditDrawerVisible(true);
  };

  const getAdjacentDate = (year: number, month: number, direction: 'prev' | 'next') => {
    let y = year;
    let m = month;
    if (direction === 'prev') {
      m -= 1;
      if (m < 1) {
        m = 12;
        y -= 1;
      }
    } else {
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
    return { year: y, month: m };
  };

  const navigateRecord = (direction: 'prev' | 'next') => {
    if (!editingRecord) return;
    const { year, month } = getAdjacentDate(editingRecord.year, editingRecord.month, direction);
    const target = salaryRecords.find(r => r.year === year && r.month === month);
    if (target) {
      setEditingRecord(target);
      editForm.setFieldsValue(target);
      setIsEditing(false);
    }
  };

  const addAdjacentRecord = (direction: 'prev' | 'next') => {
    if (!editingRecord) return;
    const { year, month } = getAdjacentDate(editingRecord.year, editingRecord.month, direction);
    addForm.setFieldsValue({
      year,
      month,
      company: editingRecord.company,
      standardDeduction: editingRecord.standardDeduction,
      endowmentInsurance: editingRecord.endowmentInsurance,
      medicalInsurance: editingRecord.medicalInsurance,
      unemploymentInsurance: editingRecord.unemploymentInsurance,
      housingFund: editingRecord.housingFund,
    });
    setIsEditDrawerVisible(false);
    setIsAddDrawerVisible(true);
  };

  const prevDate = editingRecord ? getAdjacentDate(editingRecord.year, editingRecord.month, 'prev') : null;
  const nextDate = editingRecord ? getAdjacentDate(editingRecord.year, editingRecord.month, 'next') : null;
  const hasPrevious = !!prevDate && salaryRecords.some(r => r.year === prevDate.year && r.month === prevDate.month);
  const hasNext = !!nextDate && salaryRecords.some(r => r.year === nextDate.year && r.month === nextDate.month);

  const handleAdd = async (values: SalaryRecordFormValues) => {
    const duplicate = salaryRecords.some(r => r.year === values.year && r.month === values.month);
    if (duplicate) {
      message.error(text.duplicateRecord);
      return;
    }
    try {
      await salaryRecordApi.save(values);
      message.success(text.addSuccess);
      setIsAddDrawerVisible(false);
      addForm.resetFields();
      fetchSalaryRecords();
      fetchStatistics();
    } catch {
      message.error(text.addFailed);
    }
  };

  const handleEdit = async (values: SalaryRecordFormValues) => {
    if (!editingRecord) return;
    const duplicate = salaryRecords.some(r => r.id !== editingRecord.id && r.year === values.year && r.month === values.month);
    if (duplicate) {
      message.error(text.duplicateRecord);
      return;
    }
    try {
      await salaryRecordApi.update({ ...values, id: editingRecord.id });
      message.success(text.updateSuccess);
      fetchSalaryRecords();
      fetchStatistics();
      const updatedRecord = await salaryRecordApi.findById(editingRecord.id!);
      setEditingRecord(updatedRecord);
      editForm.setFieldsValue(updatedRecord);
      setIsEditing(false);
    } catch {
      message.error(text.updateFailed);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await salaryRecordApi.delete(id);
      message.success(text.deleteSuccess);
      fetchSalaryRecords();
      fetchStatistics();
      setIsEditDrawerVisible(false);
      setEditingRecord(null);
    } catch {
      message.error(text.deleteFailed);
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return '¥0.00';
    return `¥${value.toFixed(2)}`;
  };

  return (
    <div className="themed-route-page health-fitness-page" style={{
      padding: '20px', 
      backgroundColor: '#000', 
      minHeight: '100vh',
      paddingBottom: '100px'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto',
        position: 'relative'
      }}>
        {statistics && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <MetricCard title={text.totalRecords} value={statistics.totalRecords} prefix={<CalendarOutlined />} accent="#FF9800" minWidth={200} />
            <MetricCard title={text.totalMonthlyIncome} value={statistics.totalMonthlyIncome} prefix="¥" accent="#faad14" minWidth={200} />
            <MetricCard title={text.totalActualIncome} value={statistics.totalActualIncome} prefix="¥" accent="#52c41a" minWidth={200} />
            <MetricCard title={text.avgActualIncome} value={statistics.avgActualIncome} prefix="¥" accent="#1890ff" minWidth={200} />
            <MetricCard title={text.totalTaxPaid} value={statistics.totalTaxPaid} prefix="¥" accent="#9c27b0" minWidth={200} />
          </div>
        )}

        <RecordCardList
          records={filteredSalaryRecords}
          getRecordKey={record => record.id || `${record.year}-${record.month}`}
          onRecordClick={showEditDrawer}
          filters={(
            <>
              <Select
                placeholder={text.selectYear}
                allowClear
                value={selectedYear}
                onChange={(value) => setSelectedYear(value ?? null)}
                options={yearOptions}
              />
              <Select
                placeholder={text.selectCompany}
                allowClear
                value={selectedCompany}
                onChange={(value) => setSelectedCompany(value ?? null)}
                options={companyOptions}
              />
            </>
          )}
          onAdd={showAddDrawer}
          addLabel={text.addRecord}
          emptyText={text.noRecords}
          accent="#FF9800"
          addButtonBackground="linear-gradient(135deg, #FF9800, #e65100)"
          addButtonShadow="0 2px 8px rgba(255, 152, 0, 0.4)"
          recordClassName="salary-record-tile"
          renderRecord={(record) => (
            <>
              <div style={{ color: '#FF9800', fontSize: 16, fontWeight: 'bold', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                {formatYearMonth(record)}
                {record.company && (
                  <span style={{ fontSize: 11, fontWeight: 'normal', color: '#1890ff', background: 'rgba(24, 144, 255, 0.15)', borderRadius: 4, padding: '1px 6px', marginLeft: 'auto' }}>
                    {companyOptions.find(company => company.value === record.company)?.label || record.company}
                  </span>
                )}
                {record.resetCumulative && (
                  <span style={{ fontSize: 11, fontWeight: 'normal', color: '#fff', background: 'linear-gradient(135deg, #FF9800, #FF5722)', borderRadius: 4, padding: '1px 6px' }}>
                    {text.resetCumulativeShort}
                  </span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ color: '#999', fontSize: 12 }}>{text.totalIncome}</div>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{formatCurrency((record.monthlyIncome || 0) + (record.otherIncome || 0))}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#999', fontSize: 12 }}>{text.actualIncome}</div>
                  <div style={{ color: '#52c41a', fontSize: 14, fontWeight: 'bold' }}>{formatCurrency(record.actualIncome)}</div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: 12 }}>{text.specialDeduction}</div>
                  <div style={{ color: '#faad14', fontSize: 14, fontWeight: 'bold' }}>{formatCurrency(record.specialDeduction)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#999', fontSize: 12 }}>{text.currentTaxDeclaration}</div>
                  <div style={{ color: '#FF9800', fontSize: 14, fontWeight: 'bold' }}>{formatCurrency(record.currentTaxDeclaration)}</div>
                </div>
              </div>
            </>
          )}
        />
      </div>

      <Drawer
        rootClassName="finance-salary-drawer"
        title={
          <div style={{
            color: '#fff',
            fontSize: '18px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <PlusOutlined style={{ color: '#FF9800' }} />
              {text.addRecord}
            </div>
          </div>
        }
        placement="right"
        width={520}
        open={isAddDrawerVisible}
        onClose={() => {
          setIsAddDrawerVisible(false);
          addForm.resetFields();
        }}
        extra={
          <Button
            type="primary"
            onClick={() => addForm.submit()}
            style={{
              background: 'linear-gradient(135deg, #52c41a, #389e0d)',
              border: 'none',
              borderRadius: '8px',
              marginRight: '8px'
            }}
          >
            {text.save}
          </Button>
        }
        styles={{
          body: { backgroundColor: '#000', padding: '24px' },
          header: { backgroundColor: '#000', borderBottom: '1px solid rgba(255, 152, 0, 0.2)' }
        }}
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAdd}
        >
          <div style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: 'rgba(255, 152, 0, 0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 152, 0, 0.2)'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#FF9800',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CalendarOutlined />
              {text.basicInfo}
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="year"
                  label={text.year}
                  rules={[{ required: true, message: text.selectYear }]}
                >
                  <InputNumber 
                    placeholder={text.enterYear}
                    style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="month"
                  label={text.month}
                  rules={[{ required: true, message: text.selectMonth }]}
                >
                  <Select 
                    placeholder={text.selectMonth}
                    style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                    options={monthOptions}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item
                  name="company"
                  label={text.company}
                  rules={[{ required: true, message: text.selectCompany }]}
                >
                  <Select
                    placeholder={text.selectCompany}
                    style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                    options={companyOptions}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="resetCumulative"
                  label={text.resetCumulativeShort}
                  valuePropName="checked"
                  tooltip={text.resetCumulativeTip}
                  style={{ marginBottom: 0 }}
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
          </div>

<div style={{
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: 'rgba(24, 144, 255, 0.08)',
              borderRadius: '12px',
              border: '1px solid rgba(24, 144, 255, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#1890ff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <WalletOutlined />
                  {text.incomeInfo}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#FF9800', fontSize: '16px', fontWeight: 'bold' }}>
                    {formatCurrency(addTotalIncome)}
                  </div>
                </div>
              </div>
              <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="monthlyIncome"
                  label={text.monthlyIncome}
                  rules={[{ required: true, message: text.enterMonthlyIncome }]}
                >
                  <InputNumber 
                    placeholder={text.monthlyIncome}
                    prefix="¥"
                    style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="otherIncome"
                  label={text.otherIncome}
                >
                  <InputNumber 
                    placeholder={text.enterOtherIncome}
                    prefix="¥"
                    style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(245, 158, 11, 0.2)'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#faad14',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <MinusSquareOutlined />
              {text.standardDeduction}
            </div>
            <Form.Item
              name="standardDeduction"
              label={text.standardDeduction}
              rules={[{ required: true, message: text.enterStandardDeduction }]}
            >
              <InputNumber 
                placeholder={text.standardDeduction}
                prefix="¥"
                style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
              />
            </Form.Item>
          </div>

          <div style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: 'rgba(114, 46, 209, 0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(114, 46, 209, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#722ed1',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <InsuranceOutlined />
                {text.specialDeduction}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#FF9800', fontSize: '16px', fontWeight: 'bold' }}>
                  {formatCurrency(addSpecialDeduction)}
                </div>
              </div>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="endowmentInsurance"
                  label={text.endowmentInsurance}
                >
                  <InputNumber 
                    placeholder={text.endowmentInsurance}
                    prefix="¥"
                    style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="medicalInsurance"
                  label={text.medicalInsurance}
                >
                  <InputNumber 
                    placeholder={text.medicalInsurance}
                    prefix="¥"
                    style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="unemploymentInsurance"
                  label={text.unemploymentInsurance}
                >
                  <InputNumber 
                    placeholder={text.unemploymentInsurance}
                    prefix="¥"
                    style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="housingFund"
                  label={text.housingFund}
                >
                  <InputNumber 
                    placeholder={text.housingFund}
                    prefix="¥"
                    style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FileTextOutlined />
              {text.notes}
            </div>
            <Form.Item
              name="notes"
              label=""
            >
              <Input.TextArea 
                placeholder={text.notesPlaceholder}
                style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
              />
            </Form.Item>
          </div>
        </Form>
      </Drawer>

      <Drawer
        rootClassName="finance-salary-drawer"
        title={
          <div style={{
            color: '#fff',
            fontSize: '18px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <WalletOutlined style={{ color: '#FF9800' }} />
              {text.salaryDetails}
            </div>
          </div>
        }
        placement="right"
        width={520}
        open={isEditDrawerVisible}
        onClose={() => {
          setIsEditDrawerVisible(false);
          editForm.resetFields();
          setEditingRecord(null);
          setIsEditing(false);
        }}
        extra={
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isEditing && (
              <>
                <Popconfirm
                  title={text.deleteConfirm}
                  onConfirm={() => editingRecord?.id && handleDelete(editingRecord.id)}
                  okText={text.ok}
                  cancelText={text.cancel}
                >
                  <Button
                    type="primary"
                    danger
                    style={{
                      color: '#fff',
                      background: 'linear-gradient(135deg, #ff4d4f, #cf1322)',
                      border: 'none',
                      borderRadius: '8px'
                    }}
                  >
                    {text.delete}
                  </Button>
                </Popconfirm>
                <Button
                  type="primary"
                  onClick={() => setIsEditing(true)}
                  style={{
                    color: '#fff',
                    background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                >
                  {text.edit}
                </Button>
              </>
            )}
            {isEditing && (
              <>
                <Button
                  onClick={() => setIsEditing(false)}
                  style={{
                    color: '#fff',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid #444',
                    borderRadius: '8px'
                  }}
                >
                  {text.cancel}
                </Button>
                <Button
                  type="primary"
                  onClick={() => editForm.submit()}
                  style={{
                    background: 'linear-gradient(135deg, #52c41a, #389e0d)',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                >
                  {text.save}
                </Button>
              </>
            )}
          </div>
        }
        styles={{
          body: { backgroundColor: '#000', padding: '24px' },
          header: { backgroundColor: '#000', borderBottom: '1px solid rgba(255, 152, 0, 0.2)' }
        }}
      >
        {isEditing ? (
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleEdit}
          >
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: 'rgba(255, 152, 0, 0.08)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 152, 0, 0.2)'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#FF9800',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CalendarOutlined />
                {text.basicInfo}
              </div>
<Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="year"
                  label={text.year}
                  rules={[{ required: true, message: text.selectYear }]}
                >
                  <InputNumber 
                    placeholder={text.enterYear}
                    style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="month"
                  label={text.month}
                  rules={[{ required: true, message: text.selectMonth }]}
                >
                  <Select 
                    placeholder={text.selectMonth}
                    style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                    options={monthOptions}
                  />
                </Form.Item>
              </Col>
            </Row>
<Row gutter={16}>
              <Col span={16}>
                <Form.Item
                  name="company"
                  label={text.company}
                  rules={[{ required: true, message: text.selectCompany }]}
                >
                  <Select
                    placeholder={text.selectCompany}
                    style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                    options={companyOptions}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="resetCumulative"
                  label={text.resetCumulativeShort}
                  valuePropName="checked"
                  tooltip={text.resetCumulativeTip}
                  style={{ marginBottom: 0 }}
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
          </div>

<div style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: 'rgba(24, 144, 255, 0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(24, 144, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#1890ff',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <WalletOutlined />
                {text.incomeInfo}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#FF9800', fontSize: '16px', fontWeight: 'bold' }}>
                  {formatCurrency(editTotalIncome)}
                </div>
              </div>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="monthlyIncome"
                  label={text.monthlyIncome}
                  rules={[{ required: true, message: text.enterMonthlyIncome }]}
                >
                  <InputNumber 
                    placeholder={text.monthlyIncome}
                    prefix="¥"
                    style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="otherIncome"
                  label={text.otherIncome}
                >
                  <InputNumber 
                    placeholder={text.enterOtherIncome}
                    prefix="¥"
                    style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(245, 158, 11, 0.2)'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#faad14',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <MinusSquareOutlined />
              {text.standardDeduction}
            </div>
            <Form.Item
              name="standardDeduction"
              label={text.standardDeduction}
              rules={[{ required: true, message: text.enterStandardDeduction }]}
            >
              <InputNumber 
                placeholder={text.standardDeduction}
                prefix="¥"
                style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
              />
            </Form.Item>
          </div>

            <div style={{
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: 'rgba(114, 46, 209, 0.08)',
              borderRadius: '12px',
              border: '1px solid rgba(114, 46, 209, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#722ed1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <InsuranceOutlined />
                  {text.specialDeduction}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#FF9800', fontSize: '16px', fontWeight: 'bold' }}>
                    {formatCurrency(editSpecialDeduction)}
                  </div>
                </div>
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="endowmentInsurance"
                    label={text.endowmentInsurance}
                  >
                    <InputNumber 
                      placeholder={text.endowmentInsurance}
                      prefix="¥"
                      style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="medicalInsurance"
                    label={text.medicalInsurance}
                  >
                    <InputNumber 
                      placeholder={text.medicalInsurance}
                      prefix="¥"
                      style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="unemploymentInsurance"
                    label={text.unemploymentInsurance}
                  >
                    <InputNumber 
                      placeholder={text.unemploymentInsurance}
                      prefix="¥"
                      style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="housingFund"
                    label={text.housingFund}
                  >
                    <InputNumber 
                      placeholder={text.housingFund}
                      prefix="¥"
                      style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <div style={{
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FileTextOutlined />
                {text.notes}
              </div>
              <Form.Item
                name="notes"
                label=""
              >
                <Input.TextArea 
                  placeholder={text.notesPlaceholder}
                  style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                />
              </Form.Item>
            </div>
          </Form>
        ) : editingRecord ? (
          <div className="finance-salary-readonly">
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: 'rgba(255, 152, 0, 0.08)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 152, 0, 0.2)'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#FF9800',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CalendarOutlined />
                {text.basicInfo}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ color: 'var(--app-text-muted)', fontSize: '12px', marginBottom: '4px' }}>{text.year}</div>
                  <div style={{ color: 'var(--app-text)', fontSize: '14px', fontWeight: 'bold' }}>
                    {isEnglish ? editingRecord.year : `${editingRecord.year}年`}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--app-text-muted)', fontSize: '12px', marginBottom: '4px' }}>{text.month}</div>
                  <div style={{ color: 'var(--app-text)', fontSize: '14px', fontWeight: 'bold' }}>
                    {isEnglish ? monthOptions[editingRecord.month - 1]?.label || editingRecord.month : `${editingRecord.month}月`}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                <div>
                  <div style={{ color: 'var(--app-text-muted)', fontSize: '12px', marginBottom: '4px' }}>{text.company}</div>
                  <div style={{ color: 'var(--app-text)', fontSize: '14px', fontWeight: 'bold' }}>
                    {editingRecord.company ? (companyOptions.find(c => c.value === editingRecord.company)?.label || editingRecord.company) : '-'}
                  </div>
                </div>
                {editingRecord.resetCumulative && (
                  <span style={{
                    color: '#FF9800',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    background: 'rgba(255, 152, 0, 0.15)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    flexShrink: 0
                  }}>
                    {isEnglish ? 'Restart' : '重新累计'}
                  </span>
                )}
              </div>
            </div>

            <div style={{
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: 'rgba(24, 144, 255, 0.08)',
              borderRadius: '12px',
              border: '1px solid rgba(24, 144, 255, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#1890ff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <WalletOutlined />
                  {text.incomeInfo}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#FF9800', fontSize: '16px', fontWeight: 'bold' }}>
                    {formatCurrency((editingRecord.monthlyIncome || 0) + (editingRecord.otherIncome || 0))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ color: 'var(--app-text-muted)', fontSize: '12px', marginBottom: '4px' }}>{text.monthlyIncome}</div>
                  <div style={{ color: 'var(--app-text)', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.monthlyIncome)}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--app-text-muted)', fontSize: '12px', marginBottom: '4px' }}>{text.otherIncome}</div>
                  <div style={{ color: 'var(--app-text)', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.otherIncome)}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              borderRadius: '12px',
              border: '1px solid rgba(245, 158, 11, 0.2)'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#faad14',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <MinusSquareOutlined />
                {text.standardDeduction}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--app-text)', fontSize: '18px', fontWeight: 'bold', color: '#faad14' }}>
                  {formatCurrency(editingRecord.standardDeduction)}
                </div>
              </div>
            </div>

            <div style={{
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: 'rgba(114, 46, 209, 0.08)',
              borderRadius: '12px',
              border: '1px solid rgba(114, 46, 209, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#722ed1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <InsuranceOutlined />
                  {text.specialDeduction}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#FF9800', fontSize: '16px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.specialDeduction)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ color: 'var(--app-text-muted)', fontSize: '12px', marginBottom: '4px' }}>{text.endowmentInsurance}</div>
                  <div style={{ color: 'var(--app-text)', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.endowmentInsurance)}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--app-text-muted)', fontSize: '12px', marginBottom: '4px' }}>{text.medicalInsurance}</div>
                  <div style={{ color: 'var(--app-text)', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.medicalInsurance)}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--app-text-muted)', fontSize: '12px', marginBottom: '4px' }}>{text.unemploymentInsurance}</div>
                  <div style={{ color: 'var(--app-text)', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.unemploymentInsurance)}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--app-text-muted)', fontSize: '12px', marginBottom: '4px' }}>{text.housingFund}</div>
                  <div style={{ color: 'var(--app-text)', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.housingFund)}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: 'rgba(82, 196, 26, 0.08)',
              borderRadius: '12px',
              border: '1px solid rgba(82, 196, 26, 0.2)'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#52c41a',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CalculatorOutlined />
                {text.calculationResults}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ color: 'var(--app-text-muted)', fontSize: '12px' }}>{text.monthlyTaxableIncome}</div>
                  <div style={{ color: 'var(--app-text)', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.monthlyTaxableIncome)}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--app-text-muted)', fontSize: '12px' }}>{text.cumulativeTaxableIncome}</div>
                  <div style={{ color: 'var(--app-text)', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.cumulativeTaxableIncome)}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--app-text-muted)', fontSize: '12px' }}>{text.cumulativeTaxPayable}</div>
                  <div style={{ color: '#FF9800', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.cumulativeTaxPayable)}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--app-text-muted)', fontSize: '12px' }}>{text.currentTaxDeclaration}</div>
                  <div style={{ color: '#FF9800', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.currentTaxDeclaration)}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--app-text-muted)', fontSize: '12px' }}>{text.cumulativeTaxPaid}</div>
                  <div style={{ color: '#9c27b0', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.cumulativeTaxPaid)}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--app-text-muted)', fontSize: '12px' }}>{text.actualIncome}</div>
                  <div style={{ color: '#52c41a', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.actualIncome)}
                  </div>
                </div>
              </div>
            </div>

            {editingRecord.notes && (
              <div style={{
                marginBottom: '20px',
                padding: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#fff',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FileTextOutlined />
                  {text.notes}
                </div>
                <div style={{ color: 'var(--app-text)', fontSize: '14px' }}>
                  {editingRecord.notes}
                </div>
              </div>
            )}
            {!isEditing && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '16px',
                padding: '16px 0 0',
                borderTop: '1px solid rgba(255, 152, 0, 0.2)',
                marginTop: '8px'
              }}>
                {hasPrevious ? (
                  <Button
                    onClick={() => navigateRecord('prev')}
                    style={{
                      color: '#FF9800',
                      background: 'rgba(255, 152, 0, 0.1)',
                      border: '1px solid rgba(255, 152, 0, 0.3)',
                      borderRadius: '8px'
                    }}
                  >
                    <LeftOutlined />
                    {text.previousPeriod}
                  </Button>
                ) : (
                  <Button
                    type="dashed"
                    onClick={() => addAdjacentRecord('prev')}
                    style={{
                      color: '#52c41a',
                      borderColor: '#52c41a',
                      background: 'rgba(82, 196, 26, 0.1)',
                      borderRadius: '8px'
                    }}
                  >
                    <PlusOutlined />
                    {text.addPrevious}
                  </Button>
                )}
                {hasNext ? (
                  <Button
                    onClick={() => navigateRecord('next')}
                    style={{
                      color: '#FF9800',
                      background: 'rgba(255, 152, 0, 0.1)',
                      border: '1px solid rgba(255, 152, 0, 0.3)',
                      borderRadius: '8px'
                    }}
                  >
                    {text.nextPeriod}
                    <RightOutlined />
                  </Button>
                ) : (
                  <Button
                    type="dashed"
                    onClick={() => addAdjacentRecord('next')}
                    style={{
                      color: '#52c41a',
                      borderColor: '#52c41a',
                      background: 'rgba(82, 196, 26, 0.1)',
                      borderRadius: '8px'
                    }}
                  >
                    <PlusOutlined />
                    {text.addNext}
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
};

export default HealthSummerSolsticePage;
