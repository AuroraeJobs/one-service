import React, { useState, useEffect } from 'react';
import MetricCard from './MetricCard';
import MetricGrid from './MetricGrid';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, InputNumber, Select, Button, DatePicker, Row, Col, message, Drawer } from 'antd';
import { ThunderboltOutlined, PlusOutlined, DeleteOutlined, CalendarOutlined, ClockCircleOutlined, CarOutlined, DollarOutlined, MessageOutlined, GiftOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { chargeRecordApi, chargeStationApi, type ChargeLocationOption } from '../services/api';
import ReactECharts from 'echarts-for-react';

// 隐藏滚动条的全局样式
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

// 充电记录类型定义（用于表格渲染）
interface ChargeRecordDisplay {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  chargerType: string;
  chargeDuration: number; // 分钟
  chargeAmount: number; // kWh
  batteryCapacity?: number; // 电池电量(kWh)
  electricityCost: number; // 电费
  serviceCost: number; // 服务费
  discountAmount: number; // 优惠金额
  notes?: string;
  provider?: string; // 充电提供方
}

// 生成小时选项 (0-23 倒序)
const hourOptions = Array.from({ length: 24 }, (_, i) => 23 - i).map(hour => ({
  label: String(hour).padStart(2, '0'),
  value: String(hour).padStart(2, '0')
}));

// 生成分钟选项 (0-59 正序)
const minuteOptions = Array.from({ length: 60 }, (_, i) => ({
  label: String(i).padStart(2, '0'),
  value: String(i).padStart(2, '0')
}));

const HealthSpringEquinoxPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  // 监听表单字段变化，自动计算
  const watchStartHour = Form.useWatch('startHour', form);
  const watchStartMinute = Form.useWatch('startMinute', form);
  const watchEndHour = Form.useWatch('endHour', form);
  const watchEndMinute = Form.useWatch('endMinute', form);
  const watchElectricity = Form.useWatch('electricityCost', form);
  const watchService = Form.useWatch('serviceCost', form);
  const watchDiscount = Form.useWatch('discountAmount', form);
  
  // 将时和分组合成 HH:mm 格式
  const combineTime = (hour: string, minute: string): string => {
    if (!hour || !minute) return '';
    return `${hour}:${minute}`;
  };
  
  // 计算充电时长
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
    
    let startTotal = sHour * 60 + sMin;
    let endTotal = eHour * 60 + eMin;
    
    // 如果结束时间小于开始时间，说明跨天了
    if (endTotal < startTotal) {
      endTotal += 24 * 60;
    }
    
    return endTotal - startTotal;
  };
  
  // 计算当前充电时长
  const currentDuration = calculateDuration(
    watchStartHour || '', watchStartMinute || '',
    watchEndHour || '', watchEndMinute || ''
  );
  
  // 自动设置充电时长字段
  useEffect(() => {
    if (currentDuration > 0) {
      form.setFieldValue('chargeDuration', currentDuration);
    } else {
      form.setFieldValue('chargeDuration', 0);
    }
  }, [currentDuration, form]);
  
  // 计算总费用（电费+服务费）
  const subtotal = (watchElectricity || 0) + (watchService || 0);
  
  // 计算最后金额（电费+服务费-优惠金额）
  const finalCost = Math.max(0, subtotal - (watchDiscount || 0));
  
  // 获取地点显示名称
  const getLocationLabel = (locationValue: string): string => {
    const location = locations.find(loc => loc.value === locationValue);
    return location ? location.label : locationValue;
  };
  
  // 充电记录状态
  const [records, setRecords] = useState<any[]>([]);
  const [locations, setLocations] = useState<ChargeLocationOption[]>([]);
  const [stats, setStats] = useState<any>({ totalCharges: 0, totalEnergy: 0, totalCost: 0, avgDuration: 0, totalDiscountAmount: 0 });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [addDrawerVisible, setAddDrawerVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const pageSize = 12;
  
  // 生成年份选项（从当前年份倒序到2023）
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 2022 }, (_, i) => ({
    label: `${currentYear - i}年`,
    value: `${currentYear - i}`
  }));
  
  // 从后端API加载数据
  useEffect(() => {
    loadRecords();
    loadLocations();
    loadStatistics();
    loadProviders();
  }, []);
  
  // 加载充电地点列表（从MongoDB查询充电站）
  const loadLocations = async () => {
    try {
      const stations = await chargeStationApi.findAll();
      // 将充电站转换为地点选项格式
      const locationOptions: ChargeLocationOption[] = (stations || []).map(station => ({
        label: station.stationName ? `${station.location} (${station.stationName})` : station.location,
        value: station.stationCode,
        provider: station.provider
      }));
      setLocations(locationOptions);
      // 设置默认的充电地点为第一个，并自动设置对应的provider
      if (locationOptions.length > 0) {
        const firstLocation = locationOptions[0];
        form.setFieldsValue({ 
          location: firstLocation.value,
          provider: firstLocation.provider || null
        });
      }
    } catch (error) {
      console.error('加载充电地点失败:', error);
      message.error('加载充电地点失败');
    }
  };
  
  // 加载统计数据
  const loadStatistics = async () => {
    try {
      const data = await chargeRecordApi.getStatistics();
      setStats(data || { totalCharges: 0, totalEnergy: 0, totalCost: 0, avgDuration: 0, totalDiscountAmount: 0 });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };
  
  // 加载充电提供方列表
  const loadProviders = async () => {
    try {
      const data = await chargeRecordApi.getProviders();
      setProviders(data || []);
    } catch (error) {
      console.error('加载充电提供方失败:', error);
    }
  };
  
  // 加载充电记录
  const loadRecords = async () => {
    try {
      const data = await chargeRecordApi.findAll();
      const formattedRecords: ChargeRecordDisplay[] = (data || []).map((record: any) => ({
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
      // 按日期倒序排列（最新的在前面），日期相同则按开始时间倒序
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
      message.error('加载充电记录失败');
    }
  };
  
  // 添加充电记录
  const handleAdd = async (values: any) => {
    try {
      const startTime = combineTime(values.startHour, values.startMinute);
      const endTime = combineTime(values.endHour, values.endMinute);
      
      const newRecord = {
        date: values.date.format('YYYY-MM-DD'),
        startTime: startTime,
        endTime: endTime,
        location: values.location,
        chargerType: values.chargerType,
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
        // 更新记录
        await chargeRecordApi.update({ ...newRecord, id: editingId });
        message.success('充电记录更新成功！');
        setEditingId(null);
        setIsEditing(false);
      } else {
        // 添加新记录
        await chargeRecordApi.save(newRecord);
        message.success('充电记录添加成功！');
      }
      setAddDrawerVisible(false);
      form.resetFields();
      loadRecords(); // 重新加载数据
      loadStatistics(); // 重新加载统计数据
      loadLocations(); // 重新加载充电地点并设置默认值
    } catch (error) {
      console.error('保存充电记录失败:', error);
      message.error('保存充电记录失败');
    }
  };
  
  // 删除充电记录
  const handleDelete = async (id: string) => {
    try {
      await chargeRecordApi.delete(id);
      message.success('充电记录删除成功！');
      loadRecords(); // 重新加载数据
      loadStatistics(); // 重新加载统计数据
    } catch (error) {
      console.error('删除充电记录失败:', error);
      message.error('删除充电记录失败');
    }
  };

  // 查看详情
  const handleViewDetail = (record: ChargeRecordDisplay) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  return (
    <div className="themed-route-page health-fitness-page" style={{
      padding: '20px', 
      backgroundColor: '#000', 
      minHeight: '100vh',
      paddingBottom: '100px' // 为页脚留出空间
    }}>
      <div style={{
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* 统计卡片 */}
        <MetricGrid gap={12} minColumnWidth={160}>
          <MetricCard title="总充电次数" value={stats.totalCharges} prefix={<CalendarOutlined />} accent="#1890ff" />
          <MetricCard title="总优惠" value={stats.totalDiscountAmount} prefix={<GiftOutlined />} suffix="元" accent="#722ed1" />
          <MetricCard title="总花费" value={stats.totalCost} prefix={<DollarOutlined />} suffix="元" accent="#ff4d4f" valueStyle={{ fontSize: '24px' }} />
          <MetricCard title="总充电量" value={stats.totalEnergy} prefix={<ThunderboltOutlined />} suffix="kWh" accent="#52c41a" />
          <MetricCard title="平均单价" value={stats.totalEnergy > 0 ? (stats.totalCost / stats.totalEnergy).toFixed(2) : '0.00'} prefix={<DollarOutlined />} suffix="元/kWh" accent="#faad14" />
        </MetricGrid>

        {/* 充电记录列表 */}
        <Card
          className="vehicle-charge-container-card"
          style={{
            borderRadius: '16px',
            backgroundColor: 'transparent',
            boxShadow: 'none',
            border: 'none',
            width: '100%'
          }}
          headStyle={{ border: 'none', padding: '0 0 16px 0' }}
          title={
            <div style={{
              color: '#fff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              width: '100%',
              gap: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button 
                  type="text" 
                  icon={<ThunderboltOutlined style={{ fontSize: '20px' }} />}
                  onClick={() => navigate('/vehicle/charging-stations')}
                  style={{
                    color: '#1890ff',
                    height: '32px',
                    width: '32px',
                    borderRadius: '50%',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Select
                  placeholder="选择年份"
                  allowClear
                  value={selectedYear}
                  onChange={(value) => {
                    setSelectedYear(value);
                    setCurrentPage(1);
                  }}
                  style={{
                    minWidth: '120px',
                    width: 'auto'
                  }}
                  options={yearOptions}
                />
                <Select
                  placeholder="选择充电提供方"
                  allowClear
                  value={selectedProvider}
                  onChange={(value) => {
                    setSelectedProvider(value);
                    setCurrentPage(1);
                  }}
                  style={{
                    minWidth: '200px',
                    width: 'auto'
                  }}
                  options={providers.map(p => ({
                    label: p.label,
                    value: p.value
                  }))}
                />
              </div>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => {
                  if (locations.length > 0) {
                    const firstLocation = locations[0];
                    form.setFieldsValue({ 
                      location: firstLocation.value,
                      provider: firstLocation.provider || null
                    });
                  }
                  setAddDrawerVisible(true);
                }}
                size="small"
                style={{
                  height: '32px',
                  width: '32px',
                  borderRadius: '50%',
                  padding: 0,
                  background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                  boxShadow: '0 2px 8px rgba(24, 144, 255, 0.4)'
                }}
              />
            </div>
          }
        >
          {records.length === 0 ? (
            <div style={{
              textAlign: 'center', 
              padding: '40px 20px',
              color: '#666'
            }}>
              <ThunderboltOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
              <div>暂无充电记录</div>
            </div>
          ) : (
            <>
              <div className="record-grid">
                {(() => {
                  const filteredRecords = records.filter(r => {
                    const providerMatch = !selectedProvider || r.provider === selectedProvider;
                    const yearMatch = !selectedYear || r.date.startsWith(selectedYear);
                    return providerMatch && yearMatch;
                  });
                  
                  if (filteredRecords.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666', gridColumn: '1 / -1' }}>
                        暂无充电记录
                      </div>
                    );
                  }
                  
                  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);
                  
                  return paginatedRecords.map((record) => {
                    const finalCost = (record.electricityCost + record.serviceCost - (record.discountAmount || 0)).toFixed(2);
                    const avgPrice = record.chargeAmount > 0 
                      ? ((record.electricityCost + record.serviceCost - (record.discountAmount || 0)) / record.chargeAmount).toFixed(2) 
                      : '0.00';
                    
                    return (
                      <div
                        key={record.id}
                        className="record-tile charge-record-tile"
                        onClick={() => handleViewDetail(record)}
                        style={{
                          padding: '16px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ color: '#1890ff', fontSize: '16px', fontWeight: 'bold' }}>
                            {record.date}
                          </div>
                          <div style={{
                            backgroundColor: 'rgba(82, 196, 26, 0.2)',
                            color: '#52c41a',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            border: '1px solid rgba(82, 196, 26, 0.3)'
                          }}>
                            {providers.find(p => p.value === record.provider)?.label || record.provider}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: record.batteryCapacity ? 'auto auto' : 'auto', gap: '8px' }}>
                          <div>
                            <div style={{ color: '#999', fontSize: '12px' }}>充电量</div>
                            <div style={{ color: '#52c41a', fontSize: '14px', fontWeight: 'bold' }}>
                              {record.chargeAmount} kWh
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#999', fontSize: '12px' }}>金额</div>
                            <div style={{ color: '#ff4d4f', fontSize: '14px', fontWeight: 'bold' }}>
                              ¥{finalCost}
                            </div>
                          </div>
                          {record.batteryCapacity ? (
                            <div>
                              <div style={{ color: '#999', fontSize: '12px' }}>电池电量</div>
                              <div style={{ color: '#faad14', fontSize: '14px', fontWeight: 'bold' }}>
                                {record.batteryCapacity} kWh
                              </div>
                            </div>
                          ) : (
                            <div></div>
                          )}
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#999', fontSize: '12px' }}>平均单价</div>
                            <div style={{ color: '#faad14', fontSize: '14px', fontWeight: 'bold' }}>
                              ¥{avgPrice}/kWh
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              {(() => {
                const filteredRecords = records.filter(r => {
                  const providerMatch = !selectedProvider || r.provider === selectedProvider;
                  const yearMatch = !selectedYear || r.date.startsWith(selectedYear);
                  return providerMatch && yearMatch;
                });
                return filteredRecords.length > pageSize && (
                  <div style={{
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: '24px',
                    padding: '16px'
                  }}>
                    <Button 
                      size="small"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                      style={{
                        borderRadius: '6px',
                        backgroundColor: 'rgba(24, 144, 255, 0.1)',
                        borderColor: 'rgba(24, 144, 255, 0.3)',
                        color: '#1890ff'
                      }}
                    >
                      首页
                    </Button>
                    <Button 
                      size="small"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      style={{
                        borderRadius: '6px',
                        backgroundColor: 'rgba(24, 144, 255, 0.1)',
                        borderColor: 'rgba(24, 144, 255, 0.3)',
                        color: '#1890ff'
                      }}
                    >
                      上一页
                    </Button>
                    <span style={{ color: '#fff', fontSize: '14px' }}>
                      第 {currentPage} / {Math.ceil(filteredRecords.length / pageSize)} 页
                    </span>
                    <Button 
                      size="small"
                      disabled={currentPage >= Math.ceil(filteredRecords.length / pageSize)}
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredRecords.length / pageSize), prev + 1))}
                      style={{
                        borderRadius: '6px',
                        backgroundColor: 'rgba(24, 144, 255, 0.1)',
                        borderColor: 'rgba(24, 144, 255, 0.3)',
                        color: '#1890ff'
                      }}
                    >
                      下一页
                    </Button>
                    <Button 
                      size="small"
                      disabled={currentPage >= Math.ceil(filteredRecords.length / pageSize)}
                      onClick={() => setCurrentPage(Math.ceil(filteredRecords.length / pageSize))}
                      style={{
                        borderRadius: '6px',
                        backgroundColor: 'rgba(24, 144, 255, 0.1)',
                        borderColor: 'rgba(24, 144, 255, 0.3)',
                        color: '#1890ff'
                      }}
                    >
                      末页
                    </Button>
                  </div>
                );
              })()}
            </>
          )}
        </Card>

        {/* 日历热力图 - 每日充电电量 */}
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
              充电日历
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
                  暂无充电数据
                </div>
              );
            }
            
            const sortedRecords = [...filteredRecords].sort((a, b) => 
              dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
            );
            
            // 按日期分组并求和
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
            
            // 按年份分组（包含天数、次数、度数、费用）
            interface YearStats {
              days: { date: string; chargeAmount: number }[];
              count: number; // 充电次数
              totalAmount: number; // 总度数
              totalCost: number; // 总费用
            }
            
            const yearGroups = dailyData.reduce((acc, item) => {
              const year = item.date.substring(0, 4);
              if (!acc[year]) {
                acc[year] = { days: [], count: 0, totalAmount: 0, totalCost: 0 };
              }
              acc[year].days.push(item);
              return acc;
            }, {} as Record<string, YearStats>);
            
            // 统计每年的充电次数、度数、费用
            filteredRecords.forEach(record => {
              const year = record.date.substring(0, 4);
              if (yearGroups[year]) {
                yearGroups[year].count++;
                yearGroups[year].totalAmount += record.chargeAmount;
                yearGroups[year].totalCost += (record.electricityCost + record.serviceCost - (record.discountAmount || 0));
              }
            });
            
            const years = Object.keys(yearGroups).sort((a, b) => parseInt(b) - parseInt(a));
            
            // 默认展开最新年份
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
                {/* 时间线 */}
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
                        {/* 时间线节点 */}
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
                        
                        {/* 年份标题（可点击折叠/展开） */}
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
                          <span>{year}年</span>
                          <span style={{
                            fontSize: 14,
                            color: '#999',
                            fontWeight: 'normal'
                          }}>
                            {yearData.days.length}天 / {yearData.count}次 / {yearData.totalAmount.toFixed(1)}kWh / ¥{yearData.totalCost.toFixed(2)}
                          </span>
                        </div>
                        
                        {/* 日历内容（可折叠） */}
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
                                formatter: (params: any) => {
                                  const date = params.data[0];
                                  const value = params.data[1];
                                  return `${date}<br/>充电电量: ${value || 0} kWh`;
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
                                  nameMap: ['日', '一', '二', '三', '四', '五', '六']
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

        {/* 详情Drawer */}
        <Drawer
          title={
            <div style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              width: '100%'
            }}>
              <div style={{
                color: '#fff', 
                fontSize: '18px', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <CarOutlined style={{ color: '#1890ff' }} />
                充电详情
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button 
                  type="primary"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => {
                    if (selectedRecord) {
                      // 将时间字符串拆分为小时和分钟
                      const [startHour, startMinute] = selectedRecord.startTime.split(':');
                      const [endHour, endMinute] = selectedRecord.endTime.split(':');
                      
                      form.setFieldsValue({
                        date: dayjs(selectedRecord.date),
                        startHour: startHour,
                        startMinute: startMinute,
                        endHour: endHour,
                        endMinute: endMinute,
                        chargerType: selectedRecord.chargerType,
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
                      setDetailModalVisible(false);
                      setAddDrawerVisible(true);
                    }
                  }}
                  style={{
                    backgroundColor: 'rgba(24, 144, 255, 0.1)',
                    borderColor: '#1890ff',
                    color: '#1890ff',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    padding: 0
                  }}
                />
                <Button 
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    if (selectedRecord) {
                      handleDelete(selectedRecord.id);
                      setDetailModalVisible(false);
                    }
                  }}
                  style={{
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    padding: 0
                  }}
                />
              </div>
            </div>
          }
          placement="right"
          open={detailModalVisible}
          onClose={() => setDetailModalVisible(false)}
          width={480}
          styles={{
            body: { backgroundColor: '#000', padding: '24px' },
            header: { backgroundColor: '#000', borderBottom: '1px solid rgba(24, 144, 255, 0.2)' }
          }}
        >
          {selectedRecord && (
            <div>
              {/* 基本信息 */}
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
                  <CalendarOutlined />
                  充电时间
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>日期</div>
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>{selectedRecord.date}</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>充电时长</div>
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                      {Math.floor(selectedRecord.chargeDuration / 60)}h {selectedRecord.chargeDuration % 60}m
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>开始时间</div>
                    <div style={{ color: '#52c41a', fontSize: '14px', fontWeight: 'bold' }}>{selectedRecord.startTime}</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>结束时间</div>
                    <div style={{ color: '#faad14', fontSize: '14px', fontWeight: 'bold' }}>{selectedRecord.endTime}</div>
                  </div>
                </div>
              </div>

              {/* 充电信息 */}
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
                  <CarOutlined />
                  充电信息
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>充电方式</div>
                    <div style={{
                      color: '#fff', 
                      fontSize: '14px', 
                      fontWeight: 'bold',
                      display: 'inline-block',
                      padding: '4px 12px',
                      backgroundColor: 'rgba(24, 144, 255, 0.2)',
                      borderRadius: '6px'
                    }}>
                      {selectedRecord.chargerType}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>充电地点</div>
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>{getLocationLabel(selectedRecord.location)}</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>充电量</div>
                    <div style={{ color: '#52c41a', fontSize: '16px', fontWeight: 'bold' }}>{selectedRecord.chargeAmount} kWh</div>
                  </div>
                  {selectedRecord.batteryCapacity && (
                    <div>
                      <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>电池电量</div>
                      <div style={{ color: '#faad14', fontSize: '16px', fontWeight: 'bold' }}>{selectedRecord.batteryCapacity} kWh</div>
                    </div>
                  )}
                </div>
              </div>

              {/* 费用信息 */}
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
                  <DollarOutlined />
                  费用明细
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>电费</div>
                    <div style={{ color: '#52c41a', fontSize: '14px', fontWeight: 'bold' }}>¥{selectedRecord.electricityCost.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>服务费</div>
                    <div style={{ color: '#faad14', fontSize: '14px', fontWeight: 'bold' }}>¥{selectedRecord.serviceCost.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>优惠金额</div>
                    <div style={{ color: '#722ed1', fontSize: '14px', fontWeight: 'bold' }}>-¥{selectedRecord.discountAmount?.toFixed(2) || '0.00'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>平均单价</div>
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
                  <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>实付金额</span>
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

              {/* 备注 */}
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
                    <MessageOutlined />
                    备注
                  </div>
                  <div style={{ color: '#fff', fontSize: '14px', lineHeight: '1.6' }}>
                    {selectedRecord.notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </Drawer>

        {/* 添加记录Drawer */}
        <Drawer
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
                {isEditing ? (
                  <>
                    <EditOutlined style={{ color: '#1890ff' }} />
                    编辑充电记录
                  </>
                ) : (
                  <>
                    <PlusOutlined style={{ color: '#1890ff' }} />
                    添加充电记录
                  </>
                )}
              </div>
              <Button
                type="primary"
                htmlType="submit"
                onClick={() => form.submit()}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #1890ff, #096dd9)'
                }}
              >
                <CheckOutlined style={{ fontSize: '16px' }} />
              </Button>
            </div>
          }
          placement="right"
          open={addDrawerVisible}
          onClose={() => {
            setAddDrawerVisible(false);
            setEditingId(null);
            setIsEditing(false);
            form.resetFields();
          }}
          width={520}
          styles={{
            body: { backgroundColor: '#000', padding: '24px' },
            header: { backgroundColor: '#000', borderBottom: '1px solid rgba(24, 144, 255, 0.2)' }
          }}
        >
          <Form 
            form={form} 
            layout="vertical" 
            onFinish={handleAdd}
            initialValues={{
              chargerType: '快充'
            }}
          >
            {/* 第一组：日期、时间 */}
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
                <ClockCircleOutlined />
                充电时间
              </div>
              <Row gutter={12}>
                <Col xs={24} sm={8}>
                  <Form.Item 
                    label={<span style={{ color: '#aaa', fontSize: '12px' }}>日期</span>} 
                    name="date" 
                    rules={[{ required: true, message: '请选择日期' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ marginBottom: '8px', color: '#52c41a', fontSize: '12px' }}>开始时间</div>
                  <Row gutter={8}>
                    <Col xs={12}>
                      <Form.Item 
                        name="startHour" 
                        rules={[{ required: true, message: '请选择时' }]}
                        noStyle
                      >
                        <Select placeholder="时" options={hourOptions} />
                      </Form.Item>
                    </Col>
                    <Col xs={12}>
                      <Form.Item 
                        name="startMinute" 
                        rules={[{ required: true, message: '请选择分' }]}
                        noStyle
                      >
                        <Select placeholder="分" options={minuteOptions} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ marginBottom: '8px', color: '#faad14', fontSize: '12px' }}>结束时间</div>
                  <Row gutter={8}>
                    <Col xs={12}>
                      <Form.Item 
                        name="endHour" 
                        rules={[{ required: true, message: '请选择时' }]}
                        noStyle
                      >
                        <Select placeholder="时" options={hourOptions} />
                      </Form.Item>
                    </Col>
                    <Col xs={12}>
                      <Form.Item 
                        name="endMinute" 
                        rules={[{ required: true, message: '请选择分' }]}
                        noStyle
                      >
                        <Select placeholder="分" options={minuteOptions} />
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
                <span style={{ color: '#1890ff', fontSize: '13px' }}>充电时长</span>
                <span style={{ color: '#1890ff', fontSize: '18px', fontWeight: 'bold' }}>
                  {currentDuration} 分钟
                </span>
              </div>
              <Form.Item name="chargeDuration" style={{ display: 'none' }}>
                <Input />
              </Form.Item>
            </div>

            {/* 第三组：充电信息 */}
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
                <CarOutlined />
                充电信息
              </div>
              <Row gutter={12}>
                <Col xs={24} sm={6}>
                  <Form.Item 
                    label={<span style={{ color: '#aaa', fontSize: '12px' }}>充电方式</span>} 
                    name="chargerType" 
                    rules={[{ required: true, message: '请选择充电方式' }]}
                  >
                    <Select placeholder="选择充电方式">
                      <Select.Option value="家充">🏠 家充</Select.Option>
                      <Select.Option value="超充">⚡ 超充</Select.Option>
                      <Select.Option value="快充">🔋 快充</Select.Option>
                      <Select.Option value="慢充">🔌 慢充</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={18}>
                  <Form.Item 
                    label={<span style={{ color: '#aaa', fontSize: '12px' }}>充电地点</span>} 
                    name="location" 
                    rules={[{ required: true, message: '请选择充电地点' }]}
                  >
                    <Select 
                      placeholder="选择充电地点"
                      onChange={(value) => {
                        const selectedLocation = locations.find(loc => loc.value === value);
                        if (selectedLocation?.provider) {
                          form.setFieldsValue({ provider: selectedLocation.provider });
                        }
                      }}
                    >
                      {locations.map(loc => (
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
                    label={<span style={{ color: '#aaa', fontSize: '12px' }}>充电量(kWh)</span>} 
                    name="chargeAmount" 
                    rules={[{ required: true, message: '请输入充电量' }]}
                  >
                    <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item 
                    label={<span style={{ color: '#aaa', fontSize: '12px' }}>电池电量(kWh)</span>} 
                    name="batteryCapacity"
                  >
                    <InputNumber style={{ width: '100%' }} min={0} step={0.1} placeholder="实际充入电量" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="provider" style={{ display: 'none' }}>
                <Input />
              </Form.Item>
            </div>

            {/* 第二组：费用 */}
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
                <DollarOutlined />
                费用明细
              </div>
              <Row gutter={12}>
                <Col xs={24} sm={8}>
                  <Form.Item 
                    label={<span style={{ color: '#52c41a', fontSize: '12px' }}>电费</span>} 
                    name="electricityCost" 
                    rules={[{ required: true, message: '请输入电费' }]}
                  >
                    <InputNumber style={{ width: '100%', color: '#52c41a' }} min={0} step={0.01} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item 
                    label={<span style={{ color: '#faad14', fontSize: '12px' }}>服务费</span>} 
                    name="serviceCost" 
                    rules={[{ required: true, message: '请输入服务费' }]}
                  >
                    <InputNumber style={{ width: '100%', color: '#faad14' }} min={0} step={0.01} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item 
                    label={<span style={{ color: '#722ed1', fontSize: '12px' }}>优惠</span>} 
                    name="discountAmount"
                    rules={[
                      { 
                        validator: (_, value) => {
                          if (value !== undefined && value !== null && value < 0) {
                            return Promise.reject('优惠金额不能为负数');
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
                <span style={{ color: '#fff', fontSize: '13px' }}>实付金额</span>
                <span style={{ color: '#ff4d4f', fontSize: '20px', fontWeight: 'bold' }}>
                  ¥{finalCost.toFixed(2)}
                </span>
              </div>
            </div>

            {/* 备注 */}
            <div style={{
              marginBottom: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Form.Item label={<span style={{ color: '#aaa', fontSize: '12px' }}>备注</span>} name="notes">
                <Input.TextArea rows={2} placeholder="添加备注信息（可选）..." />
              </Form.Item>
            </div>
          </Form>
        </Drawer>
      </div>
    </div>
  );
};

export default HealthSpringEquinoxPage;
