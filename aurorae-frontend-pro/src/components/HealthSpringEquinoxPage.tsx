import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Form, Input, InputNumber, Select, Button, DatePicker, Statistic, Row, Col, message, Drawer } from 'antd';
import { ThunderboltOutlined, PlusOutlined, DeleteOutlined, CalendarOutlined, ClockCircleOutlined, CarOutlined, DollarOutlined, FireFilled, MessageOutlined, CloudFilled, HeartFilled, GiftOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { chargeRecordApi, type ChargeLocationOption } from '../services/api';
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
  const location = useLocation();
  const isFitnessMenu = location.pathname.startsWith('/fitness');
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
  
  // 加载充电地点列表
  const loadLocations = async () => {
    try {
      const data = await chargeRecordApi.getLocations();
      setLocations(data || []);
      // 设置默认的充电地点为最后一个，并自动设置对应的provider
      if (data && data.length > 0) {
        const lastLocation = data[data.length - 1];
        form.setFieldsValue({ 
          location: lastLocation.value,
          provider: lastLocation.provider || null
        });
      }
    } catch (error) {
      console.error('加载充电地点失败:', error);
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
      setCurrentPage(1); // 重置分页到第一页
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
      setCurrentPage(1); // 重置分页到第一页
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
    <div style={{ 
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
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          gap: '12px',
          marginBottom: '24px',
          width: '100%',
          flexWrap: 'wrap'
        }}>
          <Card 
            style={{ 
              flex: '1 1 18%',
              minWidth: '150px',
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(24, 144, 255, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(24, 144, 255, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(24, 144, 255, 0.4)',
              backgroundColor: '#2D2D2D',
              backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)'
            }}
          >
            <Statistic 
              title={<span style={{ color: '#aaa' }}>总充电次数</span>}
              value={stats.totalCharges}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
            />
          </Card>
          <Card 
            style={{ 
              flex: '1 1 18%',
              minWidth: '150px',
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(24, 144, 255, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(24, 144, 255, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(24, 144, 255, 0.4)',
              backgroundColor: '#2D2D2D',
              backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)'
            }}
          >
            <Statistic 
              title={<span style={{ color: '#aaa' }}>总优惠</span>}
              value={stats.totalDiscountAmount}
              prefix="-¥"
              suffix={<GiftOutlined />}
              valueStyle={{ color: '#722ed1', fontWeight: 'bold' }}
            />
          </Card>
          <Card 
            style={{ 
              flex: '1 1 18%',
              minWidth: '150px',
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(24, 144, 255, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(24, 144, 255, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(24, 144, 255, 0.4)',
              backgroundColor: '#2D2D2D',
              backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)'
            }}
          >
            <Statistic 
              title={<span style={{ color: '#aaa' }}>总花费</span>}
              value={stats.totalCost}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: '24px' }}
              suffix="元"
            />
          </Card>
          <Card 
            style={{ 
              flex: '1 1 18%',
              minWidth: '150px',
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(24, 144, 255, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(24, 144, 255, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(24, 144, 255, 0.4)',
              backgroundColor: '#2D2D2D',
              backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)'
            }}
          >
            <Statistic 
              title={<span style={{ color: '#aaa' }}>总充电量</span>}
              value={stats.totalEnergy}
              suffix="kWh"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
            />
          </Card>
          <Card 
            style={{ 
              flex: '1 1 18%',
              minWidth: '150px',
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(24, 144, 255, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(24, 144, 255, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(24, 144, 255, 0.4)',
              backgroundColor: '#2D2D2D',
              backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)'
            }}
          >
            <Statistic 
              title={<span style={{ color: '#aaa' }}>平均单价</span>}
              value={stats.totalEnergy > 0 ? (stats.totalCost / stats.totalEnergy).toFixed(2) : '0.00'}
              suffix="元/kWh"
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#faad14', fontWeight: 'bold' }}
            />
          </Card>
        </div>

        {/* 日历热力图 - 每日充电电量 */}
        <Card
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
            
            const minDate = dailyData[0].date;
            const maxDate = dailyData[dailyData.length - 1].date;
            const maxCharge = Math.max(...dailyData.map(r => r.chargeAmount), 50);
            
            return (
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
                    bottom: '20',
                    inRange: {
                      color: ['#e0f2f1', '#26a69a', '#004d40']
                    },
                    textStyle: {
                      color: '#fff'
                    }
                  },
                  calendar: {
                    top: 60,
                    left: 50,
                    right: 30,
                    cellSize: ['auto', 20],
                    range: [minDate, maxDate],
                    itemStyle: {
                      borderWidth: 2,
                      borderColor: 'rgba(24, 144, 255, 0.3)'
                    },
                    yearLabel: { show: false },
                    monthLabel: {
                      color: '#aaa',
                      fontSize: 12
                    },
                    dayLabel: {
                      color: '#aaa',
                      fontSize: 10,
                      firstDay: 1,
                      nameMap: ['日', '一', '二', '三', '四', '五', '六']
                    },
                    splitLine: {
                      show: true,
                      lineStyle: {
                        color: 'rgba(24, 144, 255, 0.2)'
                      }
                    }
                  },
                  series: [{
                    type: 'heatmap',
                    coordinateSystem: 'calendar',
                    data: dailyData.map(item => [
                      item.date,
                      item.chargeAmount
                    ])
                  }]
                }}
                style={{ height: '300px', width: '100%' }}
              />
            );
          })()}
        </Card>

        {/* 充电记录列表 */}
        <Card 
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
                <ThunderboltOutlined style={{ color: '#1890ff' }} />
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
                    const lastLocation = locations[locations.length - 1];
                    form.setFieldsValue({ 
                      location: lastLocation.value,
                      provider: lastLocation.provider || null
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
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px'
              }}>
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
                        onClick={() => handleViewDetail(record)}
                        style={{
                          backgroundColor: 'rgba(24, 144, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '16px',
                          borderBottom: '1px solid rgba(24, 144, 255, 0.2)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(24, 144, 255, 0.12)';
                          e.currentTarget.style.borderBottomColor = 'rgba(24, 144, 255, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(24, 144, 255, 0.08)';
                          e.currentTarget.style.borderBottomColor = 'rgba(24, 144, 255, 0.2)';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ color: '#1890ff', fontSize: '16px', fontWeight: 'bold' }}>
                            {record.date}
                          </div>
                          <div style={{ color: '#ff4d4f', fontSize: '20px', fontWeight: 'bold' }}>
                            ¥{finalCost}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <div style={{ color: '#999', fontSize: '12px' }}>充电量</div>
                            <div style={{ color: '#52c41a', fontSize: '14px', fontWeight: 'bold' }}>
                              {record.chargeAmount} kWh
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#999', fontSize: '12px' }}>平均单价</div>
                            <div style={{ color: '#faad14', fontSize: '14px', fontWeight: 'bold' }}>
                              ¥{avgPrice}/kWh
                            </div>
                          </div>
                          {record.batteryCapacity && (
                            <div style={{ gridColumn: '1 / -1' }}>
                              <div style={{ color: '#999', fontSize: '12px' }}>电池电量</div>
                              <div style={{ color: '#faad14', fontSize: '14px', fontWeight: 'bold' }}>
                                {record.batteryCapacity} kWh
                              </div>
                            </div>
                          )}
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
      
      {/* 页脚 */}
      <footer className="app-footer" style={{ 
        textAlign: 'center', 
        position: 'fixed', 
        bottom: 0, 
        left: '50%', 
        transform: 'translateX(-50%)',
        height: '64px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backgroundImage: 'linear-gradient(145deg, rgba(30, 30, 30, 0.9), rgba(0, 0, 0, 0.9))',
        color: '#e2e8f0',
        zIndex: 1000,
        padding: '0 20px',
        boxSizing: 'border-box',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.3)'
      }}>
        {/* 图标 - 点击回到首页 */}
        <CloudFilled 
          style={{ fontSize: '24px', color: '#e2e8f0', cursor: 'pointer', marginRight: '20px' }} 
          onClick={() => navigate('/')}
        />
        {/* 功能菜单 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '12px'
        }}>
          {!isFitnessMenu ? (
            <>
              <div 
                className="footer-menu-item"
                style={{ 
                  fontSize: '14px', 
                  color: '#1890ff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  userSelect: 'none'
                }}
                onClick={() => navigate('/health')}
              >
                <HeartFilled style={{ color: '#4CAF50', transition: 'color 0.3s ease' }} /> 立春
              </div>
              <div 
                className="footer-menu-item"
                style={{ 
                  fontSize: '14px', 
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'normal',
                  transition: 'color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  userSelect: 'none'
                }}
                onClick={() => navigate('/hexagram')}
              >
                <FireFilled style={{ color: '#FF0000', transition: 'color 0.3s ease' }} /> 立夏
              </div>
              <div 
                className="footer-menu-item"
                style={{ 
                  fontSize: '14px', 
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'normal',
                  transition: 'color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  userSelect: 'none'
                }}
                onClick={() => navigate('/health/third')}
              >
                <CalendarOutlined style={{ color: '#9C27B0', transition: 'color 0.3s ease' }} /> 立秋
              </div>
              <div 
                className="footer-menu-item"
                style={{ 
                  fontSize: '14px', 
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'normal',
                  transition: 'color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  userSelect: 'none'
                }}
                onClick={() => navigate('/health/fourth')}
              >
                <ClockCircleOutlined style={{ color: '#FFEB3B', transition: 'color 0.3s ease' }} /> 立冬
              </div>
            </>
          ) : (
            <>
              <div 
                className="footer-menu-item"
                style={{ 
                  fontSize: '14px', 
                  color: '#1890ff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  userSelect: 'none'
                }}
                onClick={() => navigate('/fitness/spring-equinox')}
              >
                <MessageOutlined style={{ color: '#4CAF50', transition: 'color 0.3s ease' }} /> 春分
              </div>
              <div 
                className="footer-menu-item"
                style={{ 
                  fontSize: '14px', 
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'normal',
                  transition: 'color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  userSelect: 'none'
                }}
                onClick={() => navigate('/fitness/summer-solstice')}
              >
                <FireFilled style={{ color: '#FF0000', transition: 'color 0.3s ease' }} /> 夏至
              </div>
              <div 
                className="footer-menu-item"
                style={{ 
                  fontSize: '14px', 
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'normal',
                  transition: 'color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  userSelect: 'none'
                }}
                onClick={() => navigate('/fitness/autumn-equinox')}
              >
                <CalendarOutlined style={{ color: '#9C27B0', transition: 'color 0.3s ease' }} /> 秋分
              </div>
              <div 
                className="footer-menu-item"
                style={{ 
                  fontSize: '14px', 
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'normal',
                  transition: 'color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  userSelect: 'none'
                }}
                onClick={() => navigate('/fitness/winter-solstice')}
              >
                <ClockCircleOutlined style={{ color: '#FFEB3B', transition: 'color 0.3s ease' }} /> 冬至
              </div>
            </>
          )}
        </div>
      </footer>
    </div>
  );
};

export default HealthSpringEquinoxPage;
