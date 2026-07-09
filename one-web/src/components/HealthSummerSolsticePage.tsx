import React, { useState, useEffect } from 'react';
import MetricCard from './MetricCard';
import MetricGrid from './MetricGrid';
import { Card, Button, Drawer, Form, Input, InputNumber, message, Row, Col, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CalendarOutlined } from '@ant-design/icons';
import { salaryRecordApi } from '../services/api';
import type { SalaryRecord, SalaryStatistics } from '../services/api';

const HealthSummerSolsticePage: React.FC = () => {
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
    } catch (error) {
      message.error('获取工资记录失败');
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await salaryRecordApi.getStatistics();
      setStatistics(stats);
    } catch (error) {
      message.error('获取统计数据失败');
    }
  };

  useEffect(() => {
    fetchSalaryRecords();
    fetchStatistics();
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

  const handleAdd = async (values: any) => {
    try {
      await salaryRecordApi.save(values);
      message.success('工资记录添加成功');
      setIsAddDrawerVisible(false);
      addForm.resetFields();
      fetchSalaryRecords();
      fetchStatistics();
    } catch (error) {
      message.error('添加失败');
    }
  };

  const handleEdit = async (values: any) => {
    if (!editingRecord) return;
    try {
      await salaryRecordApi.update({ ...values, id: editingRecord.id });
      message.success('工资记录更新成功');
      fetchSalaryRecords();
      fetchStatistics();
      const updatedRecord = await salaryRecordApi.findById(editingRecord.id!);
      setEditingRecord(updatedRecord);
      editForm.setFieldsValue(updatedRecord);
      setIsEditing(false);
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await salaryRecordApi.delete(id);
      message.success('删除成功');
      fetchSalaryRecords();
      fetchStatistics();
      setIsEditDrawerVisible(false);
      setEditingRecord(null);
    } catch (error) {
      message.error('删除失败');
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
            <MetricCard title="记录总数" value={statistics.totalRecords} prefix={<CalendarOutlined />} accent="#FF9800" minWidth={200} />
            <MetricCard title="累计实发" value={statistics.totalActualIncome} prefix="¥" accent="#52c41a" minWidth={200} />
            <MetricCard title="平均工资" value={statistics.avgActualIncome} prefix="¥" accent="#1890ff" minWidth={200} />
            <MetricCard title="累计已纳税" value={statistics.totalTaxPaid} prefix="¥" accent="#9c27b0" minWidth={200} />
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
              icon={<PlusOutlined />} 
              onClick={showAddDrawer}
              style={{
                background: 'linear-gradient(135deg, #FF9800, #FF5722)',
                border: 'none',
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
              暂无工资记录
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
                    {record.year}年{record.month}月
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                    <div>
                      <div style={{ color: '#999', fontSize: '12px' }}>当月收入</div>
                      <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                        {formatCurrency(record.monthlyIncome)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#999', fontSize: '12px' }}>本期申报税额</div>
                      <div style={{ color: '#FF9800', fontSize: '14px', fontWeight: 'bold' }}>
                        {formatCurrency(record.currentTaxDeclaration)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#999', fontSize: '12px' }}>实际所得额</div>
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
        title="添加工资记录"
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
            保存
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
            title="基本信息" 
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
                  label="年份"
                  rules={[{ required: true, message: '请选择年份' }]}
                >
                  <InputNumber 
                    placeholder="请输入年份"
                    style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="month"
                  label="月份"
                  rules={[{ required: true, message: '请选择月份' }]}
                >
                  <Select 
                    placeholder="请选择月份"
                    style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                    options={[
                      { value: 1, label: '1月' },
                      { value: 2, label: '2月' },
                      { value: 3, label: '3月' },
                      { value: 4, label: '4月' },
                      { value: 5, label: '5月' },
                      { value: 6, label: '6月' },
                      { value: 7, label: '7月' },
                      { value: 8, label: '8月' },
                      { value: 9, label: '9月' },
                      { value: 10, label: '10月' },
                      { value: 11, label: '11月' },
                      { value: 12, label: '12月' },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card 
            title="收入信息" 
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
              label="当月收入"
              rules={[{ required: true, message: '请输入当月收入' }]}
            >
              <InputNumber 
                placeholder="当月收入"
                prefix="¥"
                style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
              />
            </Form.Item>
            <Form.Item
              name="standardDeduction"
              label="减除费用"
              rules={[{ required: true, message: '请输入减除费用' }]}
            >
              <InputNumber 
                placeholder="减除费用"
                prefix="¥"
                style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
              />
            </Form.Item>
          </Card>

          <Card 
            title="五险一金" 
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
              label="养老保险"
            >
              <InputNumber 
                placeholder="养老保险"
                prefix="¥"
                style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
              />
            </Form.Item>
            <Form.Item
              name="medicalInsurance"
              label="医疗保险"
            >
              <InputNumber 
                placeholder="医疗保险"
                prefix="¥"
                style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
              />
            </Form.Item>
            <Form.Item
              name="unemploymentInsurance"
              label="失业保险"
            >
              <InputNumber 
                placeholder="失业保险"
                prefix="¥"
                style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
              />
            </Form.Item>
            <Form.Item
              name="housingFund"
              label="住房公积金"
            >
              <InputNumber 
                placeholder="住房公积金"
                prefix="¥"
                style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
              />
            </Form.Item>
            <Form.Item
              label="专项扣除"
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
            title="备注" 
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
                placeholder="备注信息"
                style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
              />
            </Form.Item>
          </Card>
        </Form>
      </Drawer>

      <Drawer
        title="工资详情"
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
              title="基本信息" 
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
                    label="年份"
                    rules={[{ required: true, message: '请选择年份' }]}
                  >
                    <InputNumber 
                      placeholder="请输入年份"
                      style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="month"
                    label="月份"
                    rules={[{ required: true, message: '请选择月份' }]}
                  >
                    <Select 
                      placeholder="请选择月份"
                      style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                      options={[
                        { value: 1, label: '1月' },
                        { value: 2, label: '2月' },
                        { value: 3, label: '3月' },
                        { value: 4, label: '4月' },
                        { value: 5, label: '5月' },
                        { value: 6, label: '6月' },
                        { value: 7, label: '7月' },
                        { value: 8, label: '8月' },
                        { value: 9, label: '9月' },
                        { value: 10, label: '10月' },
                        { value: 11, label: '11月' },
                        { value: 12, label: '12月' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card 
              title="收入信息" 
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
                label="当月收入"
                rules={[{ required: true, message: '请输入当月收入' }]}
              >
                <InputNumber 
                  placeholder="当月收入"
                  prefix="¥"
                  style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                />
              </Form.Item>
              <Form.Item
                name="standardDeduction"
                label="减除费用"
                rules={[{ required: true, message: '请输入减除费用' }]}
              >
                <InputNumber 
                  placeholder="减除费用"
                  prefix="¥"
                  style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                />
              </Form.Item>
            </Card>

            <Card 
              title="五险一金" 
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
                label="养老保险"
              >
                <InputNumber 
                  placeholder="养老保险"
                  prefix="¥"
                  style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                />
              </Form.Item>
              <Form.Item
                name="medicalInsurance"
                label="医疗保险"
              >
                <InputNumber 
                  placeholder="医疗保险"
                  prefix="¥"
                  style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                />
              </Form.Item>
              <Form.Item
                name="unemploymentInsurance"
                label="失业保险"
              >
                <InputNumber 
                  placeholder="失业保险"
                  prefix="¥"
                  style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                />
              </Form.Item>
              <Form.Item
                name="housingFund"
                label="住房公积金"
              >
                <InputNumber 
                  placeholder="住房公积金"
                  prefix="¥"
                  style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                />
              </Form.Item>
              <Form.Item
                label="专项扣除"
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
              title="备注" 
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
                  placeholder="备注信息"
                  style={{ width: '100%', backgroundColor: '#1D1D1D', borderColor: '#444', color: '#fff' }}
                />
              </Form.Item>
            </Card>
          </Form>
        ) : editingRecord ? (
          <div>
            <Card 
              title="基本信息" 
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
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>年份</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                    {editingRecord.year}年
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>月份</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                    {editingRecord.month}月
                  </div>
                </div>
              </div>
            </Card>

            <Card 
              title="收入信息" 
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
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>当月收入</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.monthlyIncome)}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>减除费用</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.standardDeduction)}
                  </div>
                </div>
              </div>
            </Card>

            <Card 
              title="五险一金" 
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
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>养老保险</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.endowmentInsurance)}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>医疗保险</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.medicalInsurance)}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>失业保险</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.unemploymentInsurance)}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>住房公积金</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.housingFund)}
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>专项扣除</div>
                  <div style={{ color: '#FF9800', fontSize: '16px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.specialDeduction)}
                  </div>
                </div>
              </div>
            </Card>

            <Card 
              title="计算结果" 
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
                  <div style={{ color: '#999', fontSize: '12px' }}>本月应纳税所得额</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.monthlyTaxableIncome)}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px' }}>累计应纳税所得额</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.cumulativeTaxableIncome)}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px' }}>累计应纳税额</div>
                  <div style={{ color: '#FF9800', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.cumulativeTaxPayable)}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px' }}>本期申报税额</div>
                  <div style={{ color: '#FF9800', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.currentTaxDeclaration)}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px' }}>累计已缴纳税</div>
                  <div style={{ color: '#9c27b0', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.cumulativeTaxPaid)}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px' }}>实际所得额</div>
                  <div style={{ color: '#52c41a', fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(editingRecord.actualIncome)}
                  </div>
                </div>
              </div>
            </Card>

            {editingRecord.notes && (
              <Card 
                title="备注" 
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
