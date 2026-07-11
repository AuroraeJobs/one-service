import React, { useState, useEffect } from 'react';
import MetricCard from './MetricCard';
import MetricGrid from './MetricGrid';
import { Card, Button, Drawer, Form, Input, InputNumber, message, Row, Col, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CalendarOutlined } from '@ant-design/icons';
import { salaryRecordApi } from '../services/api';
import type { SalaryRecord, SalaryStatistics } from '../services/api';
import { useAppPreferences } from '../contexts/AppPreferencesContext';

type SalaryRecordFormValues = Omit<SalaryRecord, 'id' | 'createdAt' | 'updatedAt'>;

const HealthSummerSolsticePage: React.FC = () => {
  const { isEnglish } = useAppPreferences();
  const text = {
    totalRecords: isEnglish ? 'Records' : '记录总数',
    totalActualIncome: isEnglish ? 'Total Net Income' : '累计实发',
    avgActualIncome: isEnglish ? 'Average Salary' : '平均工资',
    totalTaxPaid: isEnglish ? 'Total Tax Paid' : '累计已纳税',
    noRecords: isEnglish ? 'No salary records' : '暂无工资记录',
    monthlyIncome: isEnglish ? 'Monthly Income' : '当月收入',
    currentTaxDeclaration: isEnglish ? 'Current Tax Declaration' : '本期申报税额',
    actualIncome: isEnglish ? 'Net Income' : '实际所得额',
    addRecord: isEnglish ? 'Add Salary Record' : '添加工资记录',
    salaryDetails: isEnglish ? 'Salary Details' : '工资详情',
    save: isEnglish ? 'Save' : '保存',
    basicInfo: isEnglish ? 'Basic Info' : '基本信息',
    year: isEnglish ? 'Year' : '年份',
    month: isEnglish ? 'Month' : '月份',
    selectYear: isEnglish ? 'Please select year' : '请选择年份',
    selectMonth: isEnglish ? 'Please select month' : '请选择月份',
    enterYear: isEnglish ? 'Enter year' : '请输入年份',
    incomeInfo: isEnglish ? 'Income Info' : '收入信息',
    enterMonthlyIncome: isEnglish ? 'Please enter monthly income' : '请输入当月收入',
    standardDeduction: isEnglish ? 'Standard Deduction' : '减除费用',
    enterStandardDeduction: isEnglish ? 'Please enter standard deduction' : '请输入减除费用',
    socialInsurance: isEnglish ? 'Social Insurance and Housing Fund' : '五险一金',
    endowmentInsurance: isEnglish ? 'Pension Insurance' : '养老保险',
    medicalInsurance: isEnglish ? 'Medical Insurance' : '医疗保险',
    unemploymentInsurance: isEnglish ? 'Unemployment Insurance' : '失业保险',
    housingFund: isEnglish ? 'Housing Fund' : '住房公积金',
    specialDeduction: isEnglish ? 'Special Deduction' : '专项扣除',
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
    deleteFailed: isEnglish ? 'Failed to delete salary record' : '删除失败'
  };
  const monthOptions = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    return {
      value: month,
      label: isEnglish ? new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(2026, index, 1)) : `${month}月`
    };
  });
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

  // 监听编辑表单的五险一金字段变化
  const editEndowmentInsurance = Form.useWatch('endowmentInsurance', editForm);
  const editMedicalInsurance = Form.useWatch('medicalInsurance', editForm);
  const editUnemploymentInsurance = Form.useWatch('unemploymentInsurance', editForm);
  const editHousingFund = Form.useWatch('housingFund', editForm);
  const editSpecialDeduction = Number(((editEndowmentInsurance || 0) + (editMedicalInsurance || 0) + (editUnemploymentInsurance || 0) + (editHousingFund || 0)).toFixed(2));

  // 监听添加表单的五险一金字段变化
  const addEndowmentInsurance = Form.useWatch('endowmentInsurance', addForm);
  const addMedicalInsurance = Form.useWatch('medicalInsurance', addForm);
  const addUnemploymentInsurance = Form.useWatch('unemploymentInsurance', addForm);
  const addHousingFund = Form.useWatch('housingFund', addForm);
  const addSpecialDeduction = Number(((addEndowmentInsurance || 0) + (addMedicalInsurance || 0) + (addUnemploymentInsurance || 0) + (addHousingFund || 0)).toFixed(2));

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

  const showAddDrawer = () => {
    let year = new Date().getFullYear();
    let month = new Date().getMonth() + 1;
    let standardDeduction = 5000;
    let endowmentInsurance = 0;
    let medicalInsurance = 0;
    let unemploymentInsurance = 0;
    let housingFund = 0;
    
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
    }
    
    addForm.setFieldsValue({
      year,
      month,
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

  const handleAdd = async (values: SalaryRecordFormValues) => {
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
        alignItems: 'center',
        maxWidth: '100%',
        margin: '0 auto'
      }}>
        {statistics && (
          <MetricGrid gap={20} minColumnWidth={200} style={{ marginBottom: '32px' }}>
            <MetricCard title={text.totalRecords} value={statistics.totalRecords} prefix={<CalendarOutlined />} accent="#FF9800" minWidth={200} />
            <MetricCard title={text.totalActualIncome} value={statistics.totalActualIncome} prefix="¥" accent="#52c41a" minWidth={200} />
            <MetricCard title={text.avgActualIncome} value={statistics.avgActualIncome} prefix="¥" accent="#1890ff" minWidth={200} />
            <MetricCard title={text.totalTaxPaid} value={statistics.totalTaxPaid} prefix="¥" accent="#9c27b0" minWidth={200} />
          </MetricGrid>
        )}

        <Card
          className="finance-salary-container-card"
          style={{
            width: '100%', 
            borderRadius: '20px', 
            boxShadow: '0 0 20px rgba(255, 152, 0, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255, 152, 0, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 152, 0, 0.4)',
            backgroundColor: '#2D2D2D',
            backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)',
            padding: 0,
            borderTop: 'none'
          }}
          extra={
            <Button 
              type="primary" 
              className="finance-salary-add-button"
              icon={<PlusOutlined />} 
              onClick={showAddDrawer}
              style={{
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                padding: '0'
              }}
            />
          }
        >
          {salaryRecords.length === 0 ? (
            <div style={{
              textAlign: 'center', 
              padding: '60px 20px',
              color: '#666'
            }}>
              {text.noRecords}
            </div>
          ) : (
            <div className="record-grid">
              {salaryRecords.map((record) => (
                <Card
                  key={record.id}
                  className="record-tile salary-record-tile"
                  hoverable
                  onClick={() => showEditDrawer(record)}
                >
                  <div style={{ color: '#FF9800', fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
                    {formatYearMonth(record)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                    <div>
                      <div style={{ color: '#999', fontSize: '12px' }}>{text.monthlyIncome}</div>
                      <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                        {formatCurrency(record.monthlyIncome)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#999', fontSize: '12px' }}>{text.currentTaxDeclaration}</div>
                      <div style={{ color: '#FF9800', fontSize: '14px', fontWeight: 'bold' }}>
                        {formatCurrency(record.currentTaxDeclaration)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#999', fontSize: '12px' }}>{text.actualIncome}</div>
                      <div style={{ color: '#52c41a', fontSize: '14px', fontWeight: 'bold' }}>
                        {formatCurrency(record.actualIncome)}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Drawer
        title={text.addRecord}
        placement="right"
        width={500}
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
              background: 'linear-gradient(135deg, #FF9800, #FF5722)',
              border: 'none',
              borderRadius: '8px',
              marginRight: '8px'
            }}
          >
            {text.save}
          </Button>
        }
        styles={{
          body: { backgroundColor: '#1D1D1D' },
          header: { backgroundColor: '#1D1D1D', borderBottom: '1px solid rgba(255, 152, 0, 0.2)' },
          mask: { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
        }}
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAdd}
        >
          <Card 
            title={text.basicInfo}
            style={{
              marginBottom: '16px', 
              backgroundColor: '#2D2D2D', 
              borderColor: '#444',
              borderRadius: '8px'
            }}
            headStyle={{ borderBottom: '1px solid #444', color: '#fff', fontSize: '14px' }}
          >
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
          </Card>

          <Card 
            title={text.incomeInfo}
            style={{
              marginBottom: '16px', 
              backgroundColor: '#2D2D2D', 
              borderColor: '#444',
              borderRadius: '8px'
            }}
            headStyle={{ borderBottom: '1px solid #444', color: '#fff', fontSize: '14px' }}
          >
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
          </Card>

          <Card 
            title={text.socialInsurance}
            style={{
              marginBottom: '16px', 
              backgroundColor: '#2D2D2D', 
              borderColor: '#444',
              borderRadius: '8px'
            }}
            headStyle={{ borderBottom: '1px solid #444', color: '#fff', fontSize: '14px' }}
          >
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
            <Form.Item
              label={text.specialDeduction}
            >
              <InputNumber 
                disabled
                prefix="¥"
                value={addSpecialDeduction}
                style={{ width: '100%', backgroundColor: '#3D3D3D', borderColor: '#444', color: '#fff' }}
              />
            </Form.Item>
          </Card>

          <Card 
            title={text.notes}
            style={{
              marginBottom: '16px', 
              backgroundColor: '#2D2D2D', 
              borderColor: '#444',
              borderRadius: '8px'
            }}
            headStyle={{ borderBottom: '1px solid #444', color: '#fff', fontSize: '14px' }}
          >
            <Form.Item
              name="notes"
              label=""
            >
              <Input.TextArea 
                placeholder={text.notesPlaceholder}
                style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
              />
            </Form.Item>
          </Card>
        </Form>
      </Drawer>

      <Drawer
        title={text.salaryDetails}
        placement="right"
        width={500}
        open={isEditDrawerVisible}
        onClose={() => {
          setIsEditDrawerVisible(false);
          editForm.resetFields();
          setEditingRecord(null);
          setIsEditing(false);
        }}
        extra={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setIsEditing(!isEditing)}
              style={{
                color: '#fff',
                background: isEditing ? 'linear-gradient(135deg, #FF9800, #FF5722)' : 'linear-gradient(135deg, #1890ff, #096dd9)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                padding: '0'
              }}
            />
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={() => editingRecord?.id && handleDelete(editingRecord.id)}
              style={{
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                padding: '0'
              }}
            />
            {isEditing && (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => editForm.submit()}
                style={{
                  background: 'linear-gradient(135deg, #52c41a, #389e0d)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  padding: '0'
                }}
              />
            )}
          </div>
        }
        styles={{
          body: { backgroundColor: '#1D1D1D' },
          header: { backgroundColor: '#1D1D1D', borderBottom: '1px solid rgba(255, 152, 0, 0.2)' },
          mask: { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
        }}
      >
        {isEditing ? (
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleEdit}
          >
            <Card 
              title={text.basicInfo}
              style={{
                marginBottom: '16px', 
                backgroundColor: '#2D2D2D', 
                borderColor: '#444',
                borderRadius: '8px'
              }}
              headStyle={{ borderBottom: '1px solid #444', color: '#fff', fontSize: '14px' }}
            >
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
            </Card>

            <Card 
              title={text.incomeInfo}
              style={{
                marginBottom: '16px', 
                backgroundColor: '#2D2D2D', 
                borderColor: '#444',
                borderRadius: '8px'
              }}
              headStyle={{ borderBottom: '1px solid #444', color: '#fff', fontSize: '14px' }}
            >
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
            </Card>

            <Card 
              title={text.socialInsurance}
              style={{
                marginBottom: '16px', 
                backgroundColor: '#2D2D2D', 
                borderColor: '#444',
                borderRadius: '8px'
              }}
              headStyle={{ borderBottom: '1px solid #444', color: '#fff', fontSize: '14px' }}
            >
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
              <Form.Item
                label={text.specialDeduction}
              >
                <InputNumber 
                  disabled
                  prefix="¥"
                  value={editSpecialDeduction}
                  style={{ width: '100%', backgroundColor: '#3D3D3D', borderColor: '#444', color: '#fff' }}
                />
              </Form.Item>
            </Card>

            <Card 
              title={text.notes}
              style={{
                marginBottom: '16px', 
                backgroundColor: '#2D2D2D', 
                borderColor: '#444',
                borderRadius: '8px'
              }}
              headStyle={{ borderBottom: '1px solid #444', color: '#fff', fontSize: '14px' }}
            >
              <Form.Item
                name="notes"
                label=""
              >
                <Input.TextArea 
                  placeholder={text.notesPlaceholder}
                  style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                />
              </Form.Item>
            </Card>
          </Form>
        ) : editingRecord ? (
          <div>
            <Card 
              title={text.basicInfo}
              style={{
                marginBottom: '16px', 
                backgroundColor: '#2D2D2D', 
                borderColor: '#444',
                borderRadius: '8px'
              }}
              headStyle={{ borderBottom: '1px solid #444', color: '#fff', fontSize: '14px' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>{text.year}</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                    {isEnglish ? editingRecord.year : `${editingRecord.year}年`}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>{text.month}</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                    {isEnglish ? monthOptions[editingRecord.month - 1]?.label || editingRecord.month : `${editingRecord.month}月`}
                  </div>
                </div>
              </div>
            </Card>

            <Card 
              title={text.incomeInfo}
              style={{
                marginBottom: '16px', 
                backgroundColor: '#2D2D2D', 
                borderColor: '#444',
                borderRadius: '8px'
              }}
              headStyle={{ borderBottom: '1px solid #444', color: '#fff', fontSize: '14px' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                <div>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>{text.monthlyIncome}</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.monthlyIncome)}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>{text.standardDeduction}</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.standardDeduction)}
                  </div>
                </div>
              </div>
            </Card>

            <Card 
              title={text.socialInsurance}
              style={{
                marginBottom: '16px', 
                backgroundColor: '#2D2D2D', 
                borderColor: '#444',
                borderRadius: '8px'
              }}
              headStyle={{ borderBottom: '1px solid #444', color: '#fff', fontSize: '14px' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>{text.endowmentInsurance}</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.endowmentInsurance)}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>{text.medicalInsurance}</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.medicalInsurance)}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>{text.unemploymentInsurance}</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.unemploymentInsurance)}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>{text.housingFund}</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.housingFund)}
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>{text.specialDeduction}</div>
                  <div style={{ color: '#FF9800', fontSize: '16px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.specialDeduction)}
                  </div>
                </div>
              </div>
            </Card>

            <Card 
              title={text.calculationResults}
              style={{
                marginBottom: '16px', 
                backgroundColor: '#2D2D2D', 
                borderColor: '#444',
                borderRadius: '8px'
              }}
              headStyle={{ borderBottom: '1px solid #444', color: '#fff', fontSize: '14px' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ color: '#999', fontSize: '12px' }}>{text.monthlyTaxableIncome}</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.monthlyTaxableIncome)}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px' }}>{text.cumulativeTaxableIncome}</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.cumulativeTaxableIncome)}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px' }}>{text.cumulativeTaxPayable}</div>
                  <div style={{ color: '#FF9800', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.cumulativeTaxPayable)}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px' }}>{text.currentTaxDeclaration}</div>
                  <div style={{ color: '#FF9800', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.currentTaxDeclaration)}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px' }}>{text.cumulativeTaxPaid}</div>
                  <div style={{ color: '#9c27b0', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.cumulativeTaxPaid)}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px' }}>{text.actualIncome}</div>
                  <div style={{ color: '#52c41a', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.actualIncome)}
                  </div>
                </div>
              </div>
            </Card>

            {editingRecord.notes && (
              <Card 
                title={text.notes}
                style={{
                  marginBottom: '16px', 
                  backgroundColor: '#2D2D2D', 
                  borderColor: '#444',
                  borderRadius: '8px'
                }}
                headStyle={{ borderBottom: '1px solid #444', color: '#fff', fontSize: '14px' }}
              >
                <div style={{ color: '#fff', fontSize: '14px' }}>
                  {editingRecord.notes}
                </div>
              </Card>
            )}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
};

export default HealthSummerSolsticePage;
