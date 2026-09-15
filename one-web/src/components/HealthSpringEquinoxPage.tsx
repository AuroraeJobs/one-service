import React, { useState, useEffect, useMemo } from 'react';
import RecordCardList from './RecordCardList';
import { Card, Form, Input, InputNumber, Select, Button, DatePicker, Row, Col, message, Drawer, Popconfirm } from 'antd';
import { ThunderboltOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { chargeRecordApi, chargeStationApi, type ChargeLocationOption } from '../services/api';
import ReactECharts from 'echarts-for-react';
import { useAppPreferences } from '../contexts/AppPreferencesContext';

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `;
  document.head.appendChild(style);
}

interface ChargeRecordDisplay {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  chargerType: string;
  chargeDuration: number;
  chargeAmount: number;
  batteryCapacity?: number;
  electricityCost: number;
  serviceCost: number;
  discountAmount: number;
  notes?: string;
  provider?: string;
}

interface ChargeRecordStats {
  totalCharges: number;
  totalEnergy: number;
  totalCost: number;
  avgDuration: number;
  totalDiscountAmount?: number;
}

interface ProviderOption {
  label: string;
  value: string;
}

interface ChargeRecordApiItem {
  id?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  chargerType?: string;
  chargeDuration?: number;
  chargeAmount?: number;
  batteryCapacity?: number;
  electricityCost?: number;
  serviceCost?: number;
  discountAmount?: number;
  notes?: string;
  provider?: string;
}

interface ChargeRecordFormValues {
  date: dayjs.Dayjs;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
  location: string;
  chargerType: string;
  chargeDuration: number;
  chargeAmount: number;
  batteryCapacity?: number;
  electricityCost: number;
  serviceCost: number;
  discountAmount?: number;
  notes?: string;
  provider?: string;
}

interface CalendarTooltipParams {
  data: [string, number];
}

const hourOptions = Array.from({ length: 24 }, (_, i) => 23 - i).map(hour => ({
  label: String(hour).padStart(2, '0'),
  value: String(hour).padStart(2, '0')
}));

const minuteOptions = Array.from({ length: 60 }, (_, i) => ({
  label: String(i).padStart(2, '0'),
  value: String(i).padStart(2, '0')
}));

const HealthSpringEquinoxPage: React.FC = () => {
  const { isEnglish, colorMode } = useAppPreferences();
  const textColor = colorMode === 'dark' ? '#fff' : '#1a1a2e';
  const textMutedColor = colorMode === 'dark' ? '#999' : '#666';
  const text = {
    totalSessions: isEnglish ? 'Total Sessions' : '总充电次数',
    totalDiscount: isEnglish ? 'Total Discount' : '总优惠',
    totalSpend: isEnglish ? 'Total Spend' : '总花费',
    totalEnergy: isEnglish ? 'Total Energy' : '总充电量',
    avgPrice: isEnglish ? 'Average Price' : '平均单价',
    yuan: isEnglish ? 'CNY' : '元',
    yuanPerKwh: isEnglish ? 'CNY/kWh' : '元/kWh',
    selectYear: isEnglish ? 'Select year' : '选择年份',
    selectProvider: isEnglish ? 'Select provider' : '选择充电提供方',
    noRecords: isEnglish ? 'No charging records' : '暂无充电记录',
    editRecord: isEnglish ? 'Edit Charging Record' : '编辑充电记录',
    addRecord: isEnglish ? 'Add Charging Record' : '添加充电记录',
    save: isEnglish ? 'Save' : '保存',
    edit: isEnglish ? 'Edit' : '编辑',
    delete: isEnglish ? 'Delete' : '删除',
    cancel: isEnglish ? 'Cancel' : '取消',
    ok: isEnglish ? 'OK' : '确定',
    deleteConfirm: isEnglish ? 'Delete this charging record?' : '确定要删除这条充电记录吗？',
    chargingTime: isEnglish ? 'Charging Time' : '充电时间',
    date: isEnglish ? 'Date' : '日期',
    startTime: isEnglish ? 'Start Time' : '开始时间',
    endTime: isEnglish ? 'End Time' : '结束时间',
    hour: isEnglish ? 'Hour' : '时',
    minute: isEnglish ? 'Minute' : '分',
    duration: isEnglish ? 'Duration' : '充电时长',
    minutes: isEnglish ? 'minutes' : '分钟',
    chargingInfo: isEnglish ? 'Charging Info' : '充电信息',
    chargerType: isEnglish ? 'Station Provider' : '站电提供商',
    location: isEnglish ? 'Charging Location' : '充电地点',
    chargeAmount: isEnglish ? 'Energy (kWh)' : '充电量(kWh)',
    batteryCapacity: isEnglish ? 'Battery Energy (kWh)' : '电池电量(kWh)',
    selectDate: isEnglish ? 'Please select a date' : '请选择日期',
    selectHour: isEnglish ? 'Select hour' : '请选择时',
    selectMinute: isEnglish ? 'Select minute' : '请选择分',
    selectType: isEnglish ? 'Please select station provider' : '请选择站电提供商',
    selectLocation: isEnglish ? 'Please select charging location' : '请选择充电地点',
    enterAmount: isEnglish ? 'Please enter energy' : '请输入充电量',
    actualEnergy: isEnglish ? 'Actual charged energy' : '实际充入电量',
    amount: isEnglish ? 'Amount' : '金额',
    firstPage: isEnglish ? 'First' : '首页',
    prevPage: isEnglish ? 'Previous' : '上一页',
    nextPage: isEnglish ? 'Next' : '下一页',
    lastPage: isEnglish ? 'Last' : '末页',
    pageOf: isEnglish ? 'Page' : '第',
    pageSuffix: isEnglish ? '' : '页',
    chargingCalendar: isEnglish ? 'Charging Calendar' : '充电日历',
    noChargingData: isEnglish ? 'No charging data' : '暂无充电数据',
    chargingEnergy: isEnglish ? 'Charging energy' : '充电电量',
    energy: isEnglish ? 'Energy' : '充电量',
    detail: isEnglish ? 'Charging Details' : '充电详情',
    costDetails: isEnglish ? 'Cost Details' : '费用明细',
    electricityCost: isEnglish ? 'Electricity' : '电费',
    serviceCost: isEnglish ? 'Service Fee' : '服务费',
    discount: isEnglish ? 'Discount' : '优惠',
    discountAmount: isEnglish ? 'Discount Amount' : '优惠金额',
    paidAmount: isEnglish ? 'Paid Amount' : '实付金额',
    notes: isEnglish ? 'Notes' : '备注',
    notesPlaceholder: isEnglish ? 'Add notes (optional)...' : '添加备注信息（可选）...',
    discountNegative: isEnglish ? 'Discount cannot be negative' : '优惠金额不能为负数',
    enterElectricityCost: isEnglish ? 'Please enter electricity cost' : '请输入电费',
    enterServiceCost: isEnglish ? 'Please enter service fee' : '请输入服务费',
    loadLocationsFailed: isEnglish ? 'Failed to load charging locations' : '加载充电地点失败',
    loadRecordsFailed: isEnglish ? 'Failed to load charging records' : '加载充电记录失败',
    saveRecordFailed: isEnglish ? 'Failed to save charging record' : '保存充电记录失败',
    deleteRecordFailed: isEnglish ? 'Failed to delete charging record' : '删除充电记录失败',
    recordUpdated: isEnglish ? 'Charging record updated' : '充电记录更新成功！',
    recordAdded: isEnglish ? 'Charging record added' : '充电记录添加成功！',
    recordDeleted: isEnglish ? 'Charging record deleted' : '充电记录删除成功！'
  };
  const [form] = Form.useForm();

  const watchStartHour = Form.useWatch('startHour', form);
  const watchStartMinute = Form.useWatch('startMinute', form);
  const watchEndHour = Form.useWatch('endHour', form);
  const watchEndMinute = Form.useWatch('endMinute', form);
  const watchElectricity = Form.useWatch('electricityCost', form);
  const watchService = Form.useWatch('serviceCost', form);
  const watchDiscount = Form.useWatch('discountAmount', form);
  const watchProvider = Form.useWatch('provider', form);

  const combineTime = (hour: string, minute: string): string => {
    if (!hour || !minute) return '';
    return `${hour}:${minute}`;
  };

  const calculateDuration = (
    startHour: string, startMinute: string,
    endHour: string, endMinute: string
  ): number => {
    if (!startHour || !startMinute || !endHour || !endMinute) return 0;

    const sHour = Number(startHour);
    const sMin = Number(startMinute);
    const eHour = Number(endHour);
    const eMin = Number(endMinute);

    if (isNaN(sHour) || isNaN(sMin) || isNaN(eHour) || isNaN(eMin)) return 0;

    const startTotal = sHour * 60 + sMin;
    let endTotal = eHour * 60 + eMin;

    if (endTotal < startTotal) {
      endTotal += 24 * 60;
    }

    return endTotal - startTotal;
  };

  const currentDuration = calculateDuration(
    watchStartHour || '', watchStartMinute || '',
    watchEndHour || '', watchEndMinute || ''
  );

  useEffect(() => {
    if (currentDuration > 0) {
      form.setFieldValue('chargeDuration', currentDuration);
    } else {
      form.setFieldValue('chargeDuration', 0);
    }
  }, [currentDuration, form]);

  const subtotal = (watchElectricity || 0) + (watchService || 0);
  const finalCost = Math.max(0, subtotal - (watchDiscount || 0));

  const getLocationLabel = (locationValue: string): string => {
    const location = locations.find(loc => loc.value === locationValue);
    return location ? location.label : locationValue;
  };

  const [records, setRecords] = useState<ChargeRecordDisplay[]>([]);
  const [locations, setLocations] = useState<ChargeLocationOption[]>([]);
  const [stats, setStats] = useState<ChargeRecordStats>({ totalCharges: 0, totalEnergy: 0, totalCost: 0, avgDuration: 0, totalDiscountAmount: 0 });
  const [selectedRecord, setSelectedRecord] = useState<ChargeRecordDisplay | null>(null);
  const [addDrawerVisible, setAddDrawerVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

  const filteredLocations = useMemo(() => {
    if (!watchProvider) return locations;
    return locations.filter(loc => loc.provider === watchProvider);
  }, [locations, watchProvider]);
  const pageSize = 12;

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 2022 }, (_, i) => ({
    label: isEnglish ? String(currentYear - i) : `${currentYear - i}年`,
    value: `${currentYear - i}`
  }));

  const loadLocations = async () => {
    try {
      const stations = await chargeStationApi.findAll();
      const locationOptions: ChargeLocationOption[] = (stations || []).map(station => ({
        label: station.stationName || station.stationCode,
        value: station.stationCode,
        provider: station.provider
      }));
      setLocations(locationOptions);
      if (locationOptions.length > 0) {
        const firstLocation = locationOptions[0];
        form.setFieldsValue({
          location: firstLocation.value,
          provider: firstLocation.provider || null
        });
      }
    } catch (error) {
      console.error('加载充电地点失败:', error);
      message.error(text.loadLocationsFailed);
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await chargeRecordApi.getStatistics();
      setStats(data || { totalCharges: 0, totalEnergy: 0, totalCost: 0, avgDuration: 0, totalDiscountAmount: 0 });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const loadProviders = async () => {
    try {
      const data = await chargeRecordApi.getProviders();
      setProviders(data || []);
    } catch (error) {
      console.error('加载充电提供方失败:', error);
    }
  };

  const loadRecords = async () => {
    try {
      const data = await chargeRecordApi.findAll();
      const formattedRecords: ChargeRecordDisplay[] = ((data || []) as ChargeRecordApiItem[]).map((record) => ({
        id: record.id || '',
        date: record.date || '',
        startTime: record.startTime || '',
        endTime: record.endTime || '',
        location: record.location || '',
        chargerType: record.chargerType || '',
        chargeDuration: record.chargeDuration || 0,
        chargeAmount: record.chargeAmount || 0,
        batteryCapacity: record.batteryCapacity,
        electricityCost: record.electricityCost || 0,
        serviceCost: record.serviceCost || 0,
        discountAmount: record.discountAmount || 0,
        notes: record.notes || '',
        provider: record.provider || ''
      }));
      formattedRecords.sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) {
          return dateCompare;
        }
        return b.startTime.localeCompare(a.startTime);
      });
      setRecords(formattedRecords);
    } catch (error) {
      console.error('加载充电记录失败:', error);
      message.error(text.loadRecordsFailed);
    }
  };

  useEffect(() => {
    loadRecords();
    loadLocations();
    loadStatistics();
    loadProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (values: ChargeRecordFormValues) => {
    try {
      const startTime = combineTime(values.startHour, values.startMinute);
      const endTime = combineTime(values.endHour, values.endMinute);

      const newRecord = {
        date: values.date.format('YYYY-MM-DD'),
        startTime: startTime,
        endTime: endTime,
        location: values.location,
        chargerType: values.provider || '',
        chargeDuration: values.chargeDuration,
        chargeAmount: values.chargeAmount,
        batteryCapacity: values.batteryCapacity,
        electricityCost: values.electricityCost,
        serviceCost: values.serviceCost,
        discountAmount: values.discountAmount || 0,
        notes: values.notes,
        provider: values.provider
      };

      if (editingId) {
        await chargeRecordApi.update({ ...newRecord, id: editingId });
        message.success(text.recordUpdated);
        setEditingId(null);
        setIsEditing(false);
      } else {
        await chargeRecordApi.save(newRecord);
        message.success(text.recordAdded);
      }
      setAddDrawerVisible(false);
      form.resetFields();
      loadRecords();
      loadStatistics();
      loadLocations();
    } catch (error) {
      console.error('保存充电记录失败:', error);
      message.error(text.saveRecordFailed);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await chargeRecordApi.delete(id);
      message.success(text.recordDeleted);
      loadRecords();
      loadStatistics();
      setAddDrawerVisible(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error('删除充电记录失败:', error);
      message.error(text.deleteRecordFailed);
    }
  };

  const handleViewDetail = (record: ChargeRecordDisplay) => {
    setSelectedRecord(record);
    setEditingId(null);
    setIsEditing(false);
    setAddDrawerVisible(true);
  };

  const handleEditFromDetail = () => {
    if (selectedRecord) {
      const [startHour, startMinute] = selectedRecord.startTime.split(':');
      const [endHour, endMinute] = selectedRecord.endTime.split(':');

      form.setFieldsValue({
        date: dayjs(selectedRecord.date),
        startHour: startHour,
        startMinute: startMinute,
        endHour: endHour,
        endMinute: endMinute,
        location: selectedRecord.location,
        chargeAmount: selectedRecord.chargeAmount,
        batteryCapacity: selectedRecord.batteryCapacity,
        electricityCost: selectedRecord.electricityCost,
        serviceCost: selectedRecord.serviceCost,
        discountAmount: selectedRecord.discountAmount || 0,
        notes: selectedRecord.notes,
        provider: selectedRecord.provider
      });
      setEditingId(selectedRecord.id);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    if (selectedRecord) {
      const [startHour, startMinute] = selectedRecord.startTime.split(':');
      const [endHour, endMinute] = selectedRecord.endTime.split(':');

      form.setFieldsValue({
        date: dayjs(selectedRecord.date),
        startHour: startHour,
        startMinute: startMinute,
        endHour: endHour,
        endMinute: endMinute,
        location: selectedRecord.location,
        chargeAmount: selectedRecord.chargeAmount,
        batteryCapacity: selectedRecord.batteryCapacity,
        electricityCost: selectedRecord.electricityCost,
        serviceCost: selectedRecord.serviceCost,
        discountAmount: selectedRecord.discountAmount || 0,
        notes: selectedRecord.notes,
        provider: selectedRecord.provider
      });
    }
    setIsEditing(false);
  };

  const filteredRecords = records.filter(record => {
    const providerMatch = !selectedProvider || record.provider === selectedProvider;
    const yearMatch = !selectedYear || record.date.startsWith(selectedYear);
    return providerMatch && yearMatch;
  });

  const getDrawerTitle = () => {
    if (isEditing) return text.editRecord;
    if (selectedRecord) return text.detail;
    return text.addRecord;
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
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px'
          }}>
            <div
              className="metric-card"
              style={{
                padding: '20px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: textColor }}>
                    {isEnglish ? 'Charging Overview' : '充电概览'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{ fontSize: '28px', fontWeight: 700, color: textColor }}>
                        ¥{stats.totalCost.toFixed(0)}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ 
                        fontSize: '16px', 
                        fontWeight: 600,
                        color: '#52c41a'
                      }}>
                        {stats.totalEnergy.toFixed(1)}kWh
                      </span>
                      <span style={{ fontSize: '11px', color: textMutedColor }}>
                        {isEnglish ? 'Total Energy' : '总充电量'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  borderTop: `1px solid ${colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`, 
                  paddingTop: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ fontSize: '11px', color: textMutedColor }}>
                      {isEnglish ? 'Sessions' : '充电'} {stats.totalCharges}{isEnglish ? '' : '次'}
                    </span>
                    <span style={{ fontSize: '11px', color: textMutedColor }}>
                      {isEnglish ? 'Avg' : '均价'} ¥{stats.totalEnergy > 0 ? (stats.totalCost / stats.totalEnergy).toFixed(2) : '0.00'}/kWh
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div
              className="metric-card"
              style={{
                padding: '20px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: textColor }}>
                    {isEnglish ? 'Discount Summary' : '优惠汇总'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{ fontSize: '28px', fontWeight: 700, color: '#722ed1' }}>
                        ¥{(stats.totalDiscountAmount ?? 0).toFixed(0)}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ 
                        fontSize: '16px', 
                        fontWeight: 600,
                        color: '#722ed1'
                      }}>
                        {isEnglish ? 'Total Saved' : '已节省'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  borderTop: `1px solid ${colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`, 
                  paddingTop: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ fontSize: '11px', color: textMutedColor }}>
                      {isEnglish ? 'Actual' : '实际'} ¥{stats.totalCost.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div
              className="metric-card"
              style={{
                padding: '20px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: textColor }}>
                    {isEnglish ? 'Charging Sessions' : '充电次数'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{ fontSize: '28px', fontWeight: 700, color: '#1890ff' }}>
                        {stats.totalCharges}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ 
                        fontSize: '16px', 
                        fontWeight: 600,
                        color: '#1890ff'
                      }}>
                        {isEnglish ? 'Total Sessions' : '总次数'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  borderTop: `1px solid ${colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`, 
                  paddingTop: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ fontSize: '11px', color: textMutedColor }}>
                      {isEnglish ? 'Avg' : '均'} ¥{stats.totalCharges > 0 ? (stats.totalCost / stats.totalCharges).toFixed(0) : '0'}/{isEnglish ? 'session' : '次'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div
              className="metric-card"
              style={{
                padding: '20px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: textColor }}>
                    {isEnglish ? 'Average Price' : '平均单价'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{ fontSize: '28px', fontWeight: 700, color: '#faad14' }}>
                        ¥{stats.totalEnergy > 0 ? (stats.totalCost / stats.totalEnergy).toFixed(2) : '0.00'}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ 
                        fontSize: '16px', 
                        fontWeight: 600,
                        color: '#faad14'
                      }}>
                        {isEnglish ? 'Per kWh' : '每度电'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  borderTop: `1px solid ${colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`, 
                  paddingTop: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ fontSize: '11px', color: textMutedColor }}>
                      {isEnglish ? 'Energy' : '充电量'} {stats.totalEnergy.toFixed(1)}kWh
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <RecordCardList
          records={filteredRecords}
          getRecordKey={record => record.id}
          onRecordClick={handleViewDetail}
          filters={(
            <>
              <Select
                placeholder={text.selectYear}
                allowClear
                value={selectedYear}
                onChange={(value) => {
                  setSelectedYear(value);
                  setCurrentPage(1);
                }}
                options={yearOptions}
              />
              <Select
                placeholder={text.selectProvider}
                allowClear
                value={selectedProvider}
                onChange={(value) => {
                  setSelectedProvider(value);
                  setCurrentPage(1);
                }}
                options={providers}
              />
            </>
          )}
          onAdd={() => {
            setSelectedRecord(null);
            setEditingId(null);
            setIsEditing(false);
            form.resetFields();
            if (locations.length > 0) {
              const firstLocation = locations[0];
              form.setFieldsValue({
                location: firstLocation.value,
                provider: firstLocation.provider || null
              });
            }
            setAddDrawerVisible(true);
          }}
          addLabel={text.addRecord}
          emptyText={text.noRecords}
          emptyIcon={<ThunderboltOutlined />}
          accent="#1890ff"
          addButtonBackground="linear-gradient(135deg, #1890ff, #096dd9)"
          addButtonShadow="0 2px 8px rgba(24, 144, 255, 0.4)"
          recordClassName="charge-record-tile"
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          paginationText={{
            first: text.firstPage,
            previous: text.prevPage,
            next: text.nextPage,
            last: text.lastPage,
            summary: (page, total) => isEnglish
              ? `${text.pageOf} ${page} / ${total}`
              : `${text.pageOf} ${page} / ${total} ${text.pageSuffix}`
          }}
          renderRecord={(record) => {
            const paidAmount = record.electricityCost + record.serviceCost - (record.discountAmount || 0);
            const avgPrice = record.chargeAmount > 0 ? paidAmount / record.chargeAmount : 0;
            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ color: '#1890ff', fontSize: 16, fontWeight: 'bold' }}>{record.date}</div>
                  <div style={{ backgroundColor: 'rgba(82, 196, 26, 0.2)', color: '#52c41a', fontSize: 12, fontWeight: 'bold', padding: '2px 8px', borderRadius: 10, border: '1px solid rgba(82, 196, 26, 0.3)' }}>
                    {providers.find(provider => provider.value === record.provider)?.label || record.provider}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ color: '#999', fontSize: 12 }}>{text.energy}</div>
                    <div style={{ color: '#52c41a', fontSize: 14, fontWeight: 'bold' }}>{record.chargeAmount} kWh</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#999', fontSize: 12 }}>{text.amount}</div>
                    <div style={{ color: '#ff4d4f', fontSize: 14, fontWeight: 'bold' }}>¥{paidAmount.toFixed(2)}</div>
                  </div>
                  {record.batteryCapacity ? (
                    <div>
                      <div style={{ color: '#999', fontSize: 12 }}>{text.batteryCapacity}</div>
                      <div style={{ color: '#faad14', fontSize: 14, fontWeight: 'bold' }}>{record.batteryCapacity} kWh</div>
                    </div>
                  ) : <div />}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#999', fontSize: 12 }}>{text.avgPrice}</div>
                    <div style={{ color: '#faad14', fontSize: 14, fontWeight: 'bold' }}>¥{avgPrice.toFixed(2)}/kWh</div>
                  </div>
                </div>
              </>
            );
          }}
        />

        <Card
          className="vehicle-charge-container-card"
          style={{
            width: '100%',
            marginTop: '24px',
            borderRadius: '16px',
            backgroundColor: 'rgba(24, 144, 255, 0.08)',
            border: '1px solid rgba(24, 144, 255, 0.2)',
            boxShadow: '0 0 20px rgba(24, 144, 255, 0.2)'
          }}
          headStyle={{
            borderBottom: '1px solid rgba(24, 144, 255, 0.2)',
            color: '#1890ff'
          }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarOutlined />
              {text.chargingCalendar}
            </div>
          }
        >
          {(() => {
            const filteredRecords = records.filter(r => {
              const providerMatch = !selectedProvider || r.provider === selectedProvider;
              const yearMatch = !selectedYear || r.date.startsWith(selectedYear);
              return providerMatch && yearMatch;
            });

            if (filteredRecords.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
                  {text.noChargingData}
                </div>
              );
            }

            const sortedRecords = [...filteredRecords].sort((a, b) =>
              dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
            );

            const dailyDataMap = new Map<string, number>();
            sortedRecords.forEach(record => {
              const currentAmount = dailyDataMap.get(record.date) || 0;
              dailyDataMap.set(record.date, Number((currentAmount + record.chargeAmount).toFixed(2)));
            });

            const dailyData = Array.from(dailyDataMap.entries()).map(([date, chargeAmount]) => ({
              date,
              chargeAmount
            })).sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());

            const maxCharge = Math.max(...dailyData.map(r => r.chargeAmount), 50);

            interface YearStats {
              days: { date: string; chargeAmount: number }[];
              count: number;
              totalAmount: number;
              totalCost: number;
            }

            const yearGroups = dailyData.reduce((acc, item) => {
              const year = item.date.substring(0, 4);
              if (!acc[year]) {
                acc[year] = { days: [], count: 0, totalAmount: 0, totalCost: 0 };
              }
              acc[year].days.push(item);
              return acc;
            }, {} as Record<string, YearStats>);

            filteredRecords.forEach(record => {
              const year = record.date.substring(0, 4);
              if (yearGroups[year]) {
                yearGroups[year].count++;
                yearGroups[year].totalAmount += record.chargeAmount;
                yearGroups[year].totalCost += (record.electricityCost + record.serviceCost - (record.discountAmount || 0));
              }
            });

            const years = Object.keys(yearGroups).sort((a, b) => parseInt(b) - parseInt(a));

            const defaultExpanded = expandedYears.size === 0 && years.length > 0 ? new Set([years[0]]) : expandedYears;

            const toggleYear = (year: string) => {
              const newExpanded = new Set(expandedYears);
              if (newExpanded.has(year)) {
                newExpanded.delete(year);
              } else {
                newExpanded.add(year);
              }
              setExpandedYears(newExpanded);
            };

            return (
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '20px',
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  background: 'linear-gradient(to bottom, #ef5350, #c62828)',
                  zIndex: 0
                }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                  {years.map((year) => {
                    const yearData = yearGroups[year];
                    const yearMinDate = yearData.days[0].date;
                    const yearMaxDate = yearData.days[yearData.days.length - 1].date;
                    const yearTop = 40;
                    const yearHeight = 180;
                    const isExpanded = defaultExpanded.has(year);

                    return (
                      <div key={year} style={{ position: 'relative', paddingLeft: '40px' }}>
                        <div style={{
                          position: 'absolute',
                          left: '10px',
                          top: '12px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#ef5350',
                          border: '3px solid #1a1a2e',
                          zIndex: 2
                        }} />

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            color: '#fff',
                            fontSize: 18,
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            transition: 'background-color 0.2s',
                            width: 'fit-content'
                          }}
                          onClick={() => toggleYear(year)}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                          }}
                        >
                          <span style={{
                            fontSize: 14,
                            transition: 'transform 0.3s'
                          }}>
                            {isExpanded ? '▼' : '▶'}
                          </span>
                          <span>{isEnglish ? year : `${year}年`}</span>
                          <span style={{
                            fontSize: 14,
                            color: '#999',
                            fontWeight: 'normal'
                          }}>
                            {isEnglish
                              ? `${yearData.days.length} days / ${yearData.count} sessions / ${yearData.totalAmount.toFixed(1)}kWh / ¥${yearData.totalCost.toFixed(2)}`
                              : `${yearData.days.length}天 / ${yearData.count}次 / ${yearData.totalAmount.toFixed(1)}kWh / ¥${yearData.totalCost.toFixed(2)}`}
                          </span>
                        </div>

                        <div style={{
                          overflow: 'hidden',
                          transition: 'max-height 0.3s ease-out, opacity 0.3s ease-out',
                          maxHeight: isExpanded ? `${yearHeight + yearTop + 120}px` : '0px',
                          opacity: isExpanded ? 1 : 0,
                          marginTop: isExpanded ? '12px' : 0
                        }}>
                          <ReactECharts
                            option={{
                              tooltip: {
                                formatter: (params: CalendarTooltipParams) => {
                                  const date = params.data[0];
                                  const value = params.data[1];
                                  return `${date}<br/>${text.chargingEnergy}: ${value || 0} kWh`;
                                }
                              },
                              visualMap: {
                                min: 0,
                                max: maxCharge,
                                calculable: true,
                                orient: 'horizontal',
                                left: 'center',
                                bottom: '60',
                                inRange: {
                                  color: ['#ffebee', '#ef5350', '#c62828']
                                },
                                textStyle: {
                                  color: '#fff'
                                }
                              },
                              calendar: {
                                top: yearTop,
                                left: 50,
                                right: 30,
                                height: yearHeight,
                                cellSize: ['auto', 18],
                                range: [yearMinDate, yearMaxDate],
                                itemStyle: {
                                  borderWidth: 0,
                                  borderColor: 'transparent'
                                },
                                yearLabel: { show: false },
                                monthLabel: {
                                  color: '#aaa',
                                  fontSize: 11
                                },
                                dayLabel: {
                                  color: '#aaa',
                                  fontSize: 9,
                                  firstDay: 1,
                                  nameMap: isEnglish ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['日', '一', '二', '三', '四', '五', '六']
                                },
                                splitLine: {
                                  show: false
                                }
                              },
                              series: [{
                                type: 'heatmap',
                                coordinateSystem: 'calendar',
                                data: yearData.days.map(item => [
                                  item.date,
                                  item.chargeAmount
                                ])
                              }]
                            }}
                            style={{ height: `${yearHeight + yearTop + 100}px`, width: '100%' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </Card>

        <Drawer
          title={
            <div style={{
              color: '#fff',
              fontSize: '18px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              {getDrawerTitle()}
            </div>
          }
          placement="right"
          open={addDrawerVisible}
          onClose={() => {
            setAddDrawerVisible(false);
            setSelectedRecord(null);
            setEditingId(null);
            setIsEditing(false);
            form.resetFields();
          }}
          extra={
            <div style={{ display: 'flex', gap: '8px' }}>
              {!isEditing && selectedRecord && (
                <>
                  <Popconfirm
                    title={text.deleteConfirm}
                    onConfirm={() => selectedRecord.id && handleDelete(selectedRecord.id)}
                    okText={text.ok}
                    cancelText={text.cancel}
                  >
                    <Button
                      type="primary"
                      danger
                      className="detail-action-btn detail-action-btn-danger"
                    >
                      {text.delete}
                    </Button>
                  </Popconfirm>
                  <Button
                    type="primary"
                    className="detail-action-btn"
                    onClick={handleEditFromDetail}
                  >
                    {text.edit}
                  </Button>
                </>
              )}
              {isEditing && (
                <>
                  <Button
                    onClick={handleCancelEdit}
                    className="detail-action-btn-cancel"
                  >
                    {text.cancel}
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => form.submit()}
                    className="detail-action-btn-save"
                  >
                    {text.save}
                  </Button>
                </>
              )}
            </div>
          }
          width={480}
          styles={{
            body: { backgroundColor: '#000', padding: '24px' },
            header: { backgroundColor: '#000', borderBottom: '1px solid rgba(24, 144, 255, 0.2)' }
          }}
        >
          {(!isEditing && selectedRecord) ? (
            <div>
              {selectedRecord && (
              <div>
              <div style={{
                marginBottom: '20px',
                padding: '16px',
                backgroundColor: 'rgba(24, 144, 255, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(24, 144, 255, 0.2)'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#1890ff',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {text.chargingTime}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>{text.date}</div>
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>{selectedRecord.date}</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>{text.duration}</div>
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                      {Math.floor(selectedRecord.chargeDuration / 60)}h {selectedRecord.chargeDuration % 60}m
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>{text.startTime}</div>
                    <div style={{ color: '#52c41a', fontSize: '14px', fontWeight: 'bold' }}>{selectedRecord.startTime}</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>{text.endTime}</div>
                    <div style={{ color: '#faad14', fontSize: '14px', fontWeight: 'bold' }}>{selectedRecord.endTime}</div>
                  </div>
                </div>
              </div>

              <div style={{
                marginBottom: '20px',
                padding: '16px',
                backgroundColor: 'rgba(114, 46, 209, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(114, 46, 209, 0.2)'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#722ed1',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {text.chargingInfo}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>{text.chargerType}</div>
                    <div style={{
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      display: 'inline-block',
                      padding: '4px 12px',
                      backgroundColor: 'rgba(24, 144, 255, 0.2)',
                      borderRadius: '6px'
                    }}>
                      {providers.find(p => p.value === selectedRecord.provider)?.label || selectedRecord.provider}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>{text.location}</div>
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>{getLocationLabel(selectedRecord.location)}</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>{text.energy}</div>
                    <div style={{ color: '#52c41a', fontSize: '16px', fontWeight: 'bold' }}>{selectedRecord.chargeAmount} kWh</div>
                  </div>
                  {selectedRecord.batteryCapacity && (
                    <div>
                      <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>{text.batteryCapacity}</div>
                      <div style={{ color: '#faad14', fontSize: '16px', fontWeight: 'bold' }}>{selectedRecord.batteryCapacity} kWh</div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                marginBottom: '20px',
                padding: '16px',
                backgroundColor: 'rgba(82, 196, 26, 0.1)',
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
                  {text.costDetails}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>{text.electricityCost}</div>
                    <div style={{ color: '#52c41a', fontSize: '14px', fontWeight: 'bold' }}>¥{selectedRecord.electricityCost.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>{text.serviceCost}</div>
                    <div style={{ color: '#faad14', fontSize: '14px', fontWeight: 'bold' }}>¥{selectedRecord.serviceCost.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>{text.discountAmount}</div>
                    <div style={{ color: '#722ed1', fontSize: '14px', fontWeight: 'bold' }}>-¥{selectedRecord.discountAmount?.toFixed(2) || '0.00'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>{text.avgPrice}</div>
                    <div style={{ color: '#722ed1', fontSize: '14px', fontWeight: 'bold' }}>
                      ¥{selectedRecord.chargeAmount > 0 ? ((selectedRecord.electricityCost + selectedRecord.serviceCost - (selectedRecord.discountAmount || 0)) / selectedRecord.chargeAmount).toFixed(2) : '0.00'}/kWh
                    </div>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(255, 77, 79, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 77, 79, 0.2)'
                }}>
                  <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>{text.paidAmount}</span>
                  <span style={{
                    color: '#ff4d4f',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    textShadow: '0 0 15px rgba(255, 77, 79, 0.5)'
                  }}>
                    ¥{(selectedRecord.electricityCost + selectedRecord.serviceCost - (selectedRecord.discountAmount || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              {selectedRecord.notes && (
                <div style={{
                  marginBottom: '20px',
                  padding: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#999',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {text.notes}
                  </div>
                  <div style={{ color: '#fff', fontSize: '14px', lineHeight: '1.6' }}>
                    {selectedRecord.notes}
                  </div>
                </div>
              )}
              </div>
              )}
            </div>
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleAdd}
              initialValues={{
                provider: ''
              }}
            >
              <div style={{
                marginBottom: '20px',
                backgroundColor: 'rgba(24, 144, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(24, 144, 255, 0.2)'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#1890ff',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {text.chargingTime}
                </div>
                <Row gutter={12}>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      label={<span style={{ color: '#aaa', fontSize: '12px' }}>{text.date}</span>}
                      name="date"
                      rules={[{ required: true, message: text.selectDate }]}
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div style={{ marginBottom: '8px', color: '#52c41a', fontSize: '12px' }}>{text.startTime}</div>
                    <Row gutter={8}>
                      <Col xs={12}>
                        <Form.Item
                          name="startHour"
                          rules={[{ required: true, message: text.selectHour }]}
                          noStyle
                        >
                          <Select placeholder={text.hour} options={hourOptions} />
                        </Form.Item>
                      </Col>
                      <Col xs={12}>
                        <Form.Item
                          name="startMinute"
                          rules={[{ required: true, message: text.selectMinute }]}
                          noStyle
                        >
                          <Select placeholder={text.minute} options={minuteOptions} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div style={{ marginBottom: '8px', color: '#faad14', fontSize: '12px' }}>{text.endTime}</div>
                    <Row gutter={8}>
                      <Col xs={12}>
                        <Form.Item
                          name="endHour"
                          rules={[{ required: true, message: text.selectHour }]}
                          noStyle
                        >
                          <Select placeholder={text.hour} options={hourOptions} />
                        </Form.Item>
                      </Col>
                      <Col xs={12}>
                        <Form.Item
                          name="endMinute"
                          rules={[{ required: true, message: text.selectMinute }]}
                          noStyle
                        >
                          <Select placeholder={text.minute} options={minuteOptions} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Col>
                </Row>
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: 'rgba(24, 144, 255, 0.15)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#1890ff', fontSize: '13px' }}>{text.duration}</span>
                  <span style={{ color: '#1890ff', fontSize: '18px', fontWeight: 'bold' }}>
                    {currentDuration} {text.minutes}
                  </span>
                </div>
                <Form.Item name="chargeDuration" style={{ display: 'none' }}>
                  <Input />
                </Form.Item>
              </div>

              <div style={{
                marginBottom: '20px',
                backgroundColor: 'rgba(114, 46, 209, 0.08)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(114, 46, 209, 0.2)'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#722ed1',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {text.chargingInfo}
                </div>
                <Row gutter={12}>
                  <Col xs={24} sm={6}>
                    <Form.Item
                      label={<span style={{ color: '#aaa', fontSize: '12px' }}>{text.chargerType}</span>}
                      name="provider"
                      rules={[{ required: true, message: text.selectType }]}
                    >
                      <Select
                        placeholder={text.selectType}
                        onChange={(value) => {
                          const currentLocation = form.getFieldValue('location');
                          if (currentLocation) {
                            const locationExists = locations.some(loc => loc.value === currentLocation && loc.provider === value);
                            if (!locationExists) {
                              form.setFieldsValue({ location: undefined });
                            }
                          }
                        }}
                      >
                        {providers.map(p => (
                          <Select.Option key={p.value} value={p.value}>
                            {p.label}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={18}>
                    <Form.Item
                      label={<span style={{ color: '#aaa', fontSize: '12px' }}>{text.location}</span>}
                      name="location"
                      rules={[{ required: true, message: text.selectLocation }]}
                    >
                      <Select
                        placeholder={text.selectLocation}
                        onChange={(value) => {
                          const selectedLocation = locations.find(loc => loc.value === value);
                          if (selectedLocation?.provider) {
                            form.setFieldsValue({ provider: selectedLocation.provider });
                          }
                        }}
                      >
                        {filteredLocations.map(loc => (
                          <Select.Option key={loc.value} value={loc.value}>
                            {loc.label}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={12} style={{ marginTop: '12px' }}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label={<span style={{ color: '#aaa', fontSize: '12px' }}>{text.chargeAmount}</span>}
                      name="chargeAmount"
                      rules={[{ required: true, message: text.enterAmount }]}
                    >
                      <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label={<span style={{ color: '#aaa', fontSize: '12px' }}>{text.batteryCapacity}</span>}
                      name="batteryCapacity"
                    >
                      <InputNumber style={{ width: '100%' }} min={0} step={0.1} placeholder={text.actualEnergy} />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              <div style={{
                marginBottom: '20px',
                backgroundColor: 'rgba(82, 196, 26, 0.08)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(82, 196, 26, 0.2)'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#52c41a',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {text.costDetails}
                </div>
                <Row gutter={12}>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      label={<span style={{ color: '#52c41a', fontSize: '12px' }}>{text.electricityCost}</span>}
                      name="electricityCost"
                      rules={[{ required: true, message: text.enterElectricityCost }]}
                    >
                      <InputNumber style={{ width: '100%', color: '#52c41a' }} min={0} step={0.01} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      label={<span style={{ color: '#faad14', fontSize: '12px' }}>{text.serviceCost}</span>}
                      name="serviceCost"
                      rules={[{ required: true, message: text.enterServiceCost }]}
                    >
                      <InputNumber style={{ width: '100%', color: '#faad14' }} min={0} step={0.01} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      label={<span style={{ color: '#722ed1', fontSize: '12px' }}>{text.discount}</span>}
                      name="discountAmount"
                      rules={[
                        {
                          validator: (_, value) => {
                            if (value !== undefined && value !== null && value < 0) {
                              return Promise.reject(text.discountNegative);
                            }
                            return Promise.resolve();
                          }
                        }
                      ]}
                    >
                      <InputNumber style={{ width: '100%', color: '#722ed1' }} min={0} step={0.01} />
                    </Form.Item>
                  </Col>
                </Row>
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: 'rgba(255, 77, 79, 0.1)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#fff', fontSize: '13px' }}>{text.paidAmount}</span>
                  <span style={{ color: '#ff4d4f', fontSize: '20px', fontWeight: 'bold' }}>
                    ¥{finalCost.toFixed(2)}
                  </span>
                </div>
              </div>

              <div style={{
                marginBottom: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <Form.Item label={<span style={{ color: '#aaa', fontSize: '12px' }}>{text.notes}</span>} name="notes">
                  <Input.TextArea rows={2} placeholder={text.notesPlaceholder} />
                </Form.Item>
              </div>
            </Form>
          )}
        </Drawer>
      </div>
    </div>
  );
};

export default HealthSpringEquinoxPage;
