import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Select, Button, Popconfirm, message, Drawer } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { chargeStationApi, chargeRecordApi } from '../services/api';
import type { ChargeRecord } from '../services/api';
import { useAppPreferences } from '../contexts/AppPreferencesContext';

interface ChargeProviderOption {
  label: string;
  value: string;
}

interface ChargeStation {
  id?: string;
  provider: string;
  location: string;
  stationCode: string;
  stationName?: string;
  createdAt?: number;
  updatedAt?: number;
}

interface ProviderStats {
  provider: string;
  providerLabel: string;
  stationCount: number;
  chargeCount: number;
  totalAmount: number;
  totalCost: number;
  avgPrice: number;
}

interface ChargeStationFormValues {
  provider: string;
  location: string;
  stationCode: string;
  stationName?: string;
}

interface ApiErrorLike {
  message?: string;
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
}

const errorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiErrorLike;
  return apiError.response?.data?.message
    || apiError.response?.data?.error
    || apiError.message
    || fallback;
};

const HealthChargeStationPage: React.FC = () => {
  const navigate = useNavigate();
  const { isEnglish } = useAppPreferences();
  const text = {
    stationUnit: isEnglish ? 'stations' : '个站点',
    chargeCount: isEnglish ? 'Sessions' : '充电次数',
    chargeCountUnit: isEnglish ? '' : '次',
    energy: isEnglish ? 'Energy' : '充电度数',
    totalCost: isEnglish ? 'Total Cost' : '总费用',
    avgPrice: isEnglish ? 'Avg Price' : '平均单价',
    providerPlaceholder: isEnglish ? 'Select provider' : '选择充电提供方',
    searchPlaceholder: isEnglish ? 'Search station code/name/location' : '搜索站点编码/名称/地点',
    noStations: isEnglish ? 'No charging station data' : '暂无充电站数据',
    deleteConfirm: isEnglish ? 'Delete this charging station?' : '确定要删除这个充电站吗？',
    ok: isEnglish ? 'OK' : '确定',
    cancel: isEnglish ? 'Cancel' : '取消',
    stationCode: isEnglish ? 'Station Code' : '站点编码',
    location: isEnglish ? 'Charging Location' : '充电地点',
    addStation: isEnglish ? 'Add Charging Station' : '添加充电站',
    editStation: isEnglish ? 'Edit Charging Station' : '编辑充电站',
    provider: isEnglish ? 'Provider' : '充电提供方',
    stationName: isEnglish ? 'Station Name' : '站点名称',
    save: isEnglish ? 'Save' : '保存',
    providerRequired: isEnglish ? 'Please select a provider' : '请选择充电提供方',
    locationRequired: isEnglish ? 'Please enter a charging location' : '请输入充电地点',
    codeRequired: isEnglish ? 'Please enter a station code' : '请输入站点编码',
    codeExists: isEnglish ? 'Station code already exists' : '站点编码已存在',
    stationNamePlaceholder: isEnglish ? 'Enter station name (optional)' : '请输入站点名称（可选）',
    addSuccess: isEnglish ? 'Charging station added' : '添加充电站成功',
    addFailed: isEnglish ? 'Failed to add charging station' : '添加充电站失败',
    updateSuccess: isEnglish ? 'Charging station updated' : '更新充电站成功',
    updateFailed: isEnglish ? 'Failed to update charging station' : '更新充电站失败',
    deleteSuccess: isEnglish ? 'Charging station deleted' : '删除充电站成功',
    deleteFailed: isEnglish ? 'Failed to delete charging station' : '删除充电站失败',
    loadFailed: isEnglish ? 'Failed to load charging stations' : '加载充电站列表失败',
    providerLoadFailed: isEnglish ? 'Failed to load charging providers' : '加载充电提供方列表失败'
  };
  const [stations, setStations] = useState<ChargeStation[]>([]);
  const [providers, setProviders] = useState<ChargeProviderOption[]>([]);
  const [chargeRecords, setChargeRecords] = useState<ChargeRecord[]>([]);
  const [isAddDrawerVisible, setIsAddDrawerVisible] = useState(false);
  const [isEditDrawerVisible, setIsEditDrawerVisible] = useState(false);
  const [selectedStation, setSelectedStation] = useState<ChargeStation | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchProvider, setSearchProvider] = useState<string>('');

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const validateStationCode = async (_: unknown, value: string) => {
    if (!value) {
      return Promise.resolve();
    }
    
    try {
      await chargeStationApi.findByStationCode(value);
      return Promise.reject(new Error(text.codeExists));
    } catch {
      return Promise.resolve();
    }
  };

  const validateStationCodeEdit = async (_: unknown, value: string) => {
    if (!value || !selectedStation) {
      return Promise.resolve();
    }
    
    if (value === selectedStation.stationCode) {
      return Promise.resolve();
    }
    
    try {
      await chargeStationApi.findByStationCode(value);
      return Promise.reject(new Error(text.codeExists));
    } catch {
      return Promise.resolve();
    }
  };

  const loadStations = async () => {
    try {
      const data = await chargeStationApi.findAll();
      setStations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载充电站列表失败:', error);
      message.error(text.loadFailed);
    }
  };

  const loadProviders = async () => {
    try {
      const data = await chargeRecordApi.getProviders();
      setProviders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载充电提供方列表失败:', error);
      message.error(text.providerLoadFailed);
    }
  };

  const loadChargeRecords = async () => {
    try {
      const data = await chargeRecordApi.findAll();
      setChargeRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载充电记录失败:', error);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void loadStations();
      void loadProviders();
      void loadChargeRecords();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getProviderLabel = (providerValue: string): string => {
    const provider = providers.find(p => p.value === providerValue);
    return provider ? provider.label : providerValue;
  };

  // 计算每个提供商的统计数据
  const calculateProviderStats = (): ProviderStats[] => {
    const statsMap = new Map<string, { stationCount: number; count: number; amount: number; cost: number }>();

    // 统计每个提供商的充电站个数
    stations.forEach(station => {
      const providerKey = station.provider || 'unknown';
      if (statsMap.has(providerKey)) {
        statsMap.get(providerKey)!.stationCount += 1;
      } else {
        statsMap.set(providerKey, { stationCount: 1, count: 0, amount: 0, cost: 0 });
      }
    });

    chargeRecords.forEach(record => {
      const providerKey = record.provider || 'unknown';
      const totalCost = (record.electricityCost || 0) + (record.serviceCost || 0) - (record.discountAmount || 0);

      if (statsMap.has(providerKey)) {
        const stats = statsMap.get(providerKey)!;
        stats.count += 1;
        stats.amount += record.chargeAmount || 0;
        stats.cost += totalCost;
      } else {
        statsMap.set(providerKey, {
          stationCount: 0,
          count: 1,
          amount: record.chargeAmount || 0,
          cost: totalCost
        });
      }
    });

    const result: ProviderStats[] = [];
    statsMap.forEach((stats, provider) => {
      result.push({
        provider,
        providerLabel: getProviderLabel(provider),
        stationCount: stats.stationCount,
        chargeCount: stats.count,
        totalAmount: stats.amount,
        totalCost: stats.cost,
        avgPrice: stats.amount > 0 ? stats.cost / stats.amount : 0
      });
    });

    return result.sort((a, b) => b.totalAmount - a.totalAmount);
  };

  const providerStats = calculateProviderStats();

  const handleAdd = async (values: ChargeStationFormValues) => {
    try {
      await chargeStationApi.save(values);
      message.success(text.addSuccess);
      setIsAddDrawerVisible(false);
      addForm.resetFields();
      loadStations();
    } catch (error: unknown) {
      console.error('添加充电站错误:', error);
      message.error(errorMessage(error, text.addFailed));
    }
  };

  const handleEdit = async (values: ChargeStationFormValues) => {
    if (!selectedStation) return;
    
    try {
      await chargeStationApi.update({ ...values, id: selectedStation.id });
      message.success(text.updateSuccess);
      setIsEditDrawerVisible(false);
      editForm.resetFields();
      setSelectedStation(null);
      loadStations();
    } catch (error: unknown) {
      console.error('更新充电站错误:', error);
      message.error(errorMessage(error, text.updateFailed));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await chargeStationApi.delete(id);
      message.success(text.deleteSuccess);
      loadStations();
    } catch (error: unknown) {
      console.error('删除充电站错误:', error);
      message.error(errorMessage(error, text.deleteFailed));
    }
  };

  const handleOpenEdit = (station: ChargeStation) => {
    setSelectedStation(station);
    editForm.setFieldsValue(station);
    setIsEditDrawerVisible(true);
  };

  const filteredStations = stations.filter(station => {
    const matchSearch = !searchText || 
      (station.stationCode && station.stationCode.toLowerCase().includes(searchText.toLowerCase())) ||
      (station.stationName && station.stationName.toLowerCase().includes(searchText.toLowerCase())) ||
      (station.location && station.location.toLowerCase().includes(searchText.toLowerCase()));
    const matchProvider = !searchProvider || station.provider === searchProvider;
    return matchSearch && matchProvider;
  });

  return (
    <div className="themed-route-page health-fitness-page" style={{
      padding: '84px 20px 100px 20px', 
      backgroundColor: '#000', 
      minHeight: '100vh'
    }}>
      <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      position: 'relative'
    }}>
        {/* 统计卡片区域 */}
        {providerStats.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {providerStats.map(stat => (
              <Card
                key={stat.provider}
                style={{
                  backgroundColor: 'rgba(24, 144, 255, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(24, 144, 255, 0.2)'
                }}
                bodyStyle={{ padding: '16px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ color: '#1890ff', fontSize: '16px', fontWeight: 'bold' }}>
                    {stat.providerLabel}
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
                    {stat.stationCount} {text.stationUnit}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#999', fontSize: '12px' }}>{text.chargeCount}</span>
                    <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>{stat.chargeCount}{text.chargeCountUnit}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#999', fontSize: '12px' }}>{text.energy}</span>
                    <span style={{ color: '#52c41a', fontSize: '14px', fontWeight: 'bold' }}>{stat.totalAmount.toFixed(2)}kWh</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#999', fontSize: '12px' }}>{text.totalCost}</span>
                    <span style={{ color: '#faad14', fontSize: '14px', fontWeight: 'bold' }}>¥{stat.totalCost.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#999', fontSize: '12px' }}>{text.avgPrice}</span>
                    <span style={{ color: '#1890ff', fontSize: '14px', fontWeight: 'bold' }}>¥{stat.avgPrice.toFixed(2)}/kWh</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', left: '20px' }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/vehicle/charging')}
              size="small"
              style={{
                height: '32px',
                width: '32px',
                borderRadius: '50%',
                padding: 0,
                color: '#1890ff',
                backgroundColor: 'rgba(24, 144, 255, 0.1)',
                borderColor: 'rgba(24, 144, 255, 0.3)'
              }}
            />
          </div>
          <Select
            placeholder={text.providerPlaceholder}
            style={{ width: 200 }}
            allowClear
            value={searchProvider}
            onChange={setSearchProvider}
            options={providers}
          />
          <Input
            placeholder={text.searchPlaceholder}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
          <div style={{ position: 'absolute', right: '20px' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsAddDrawerVisible(true)}
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
        </div>

        {filteredStations.length === 0 ? (
          <div style={{
            textAlign: 'center', 
            padding: '60px 20px',
            color: '#666'
          }}>
            {text.noStations}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {filteredStations.map((station) => (
              <Card
                key={station.id}
                style={{
                  backgroundColor: 'rgba(24, 144, 255, 0.08)',
                  borderRadius: '12px',
                  borderBottom: '1px solid rgba(24, 144, 255, 0.2)',
                  transition: 'all 0.3s ease'
                }}
                hoverable
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ color: '#1890ff', fontSize: '16px', fontWeight: 'bold' }}>
                    {getProviderLabel(station.provider)}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleOpenEdit(station)}
                      style={{ color: '#1890ff' }}
                    />
                    <Popconfirm
                      title={text.deleteConfirm}
                      onConfirm={() => station.id && handleDelete(station.id)}
                      okText={text.ok}
                      cancelText={text.cancel}
                    >
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px' }}>{text.stationCode}</div>
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                      {station.stationCode}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px' }}>{text.location}</div>
                    <div style={{ color: '#52c41a', fontSize: '14px', fontWeight: 'bold' }}>
                      {station.location}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

      <Drawer
        title={text.addStation}
        placement="right"
        width={400}
        open={isAddDrawerVisible}
        onClose={() => {
          setIsAddDrawerVisible(false);
          addForm.resetFields();
        }}
        afterOpenChange={(open) => {
          if (open) {
            addForm.setFieldsValue({ provider: 'STAR' });
          }
        }}
        styles={{
          body: { backgroundColor: '#000' },
          header: { backgroundColor: '#000', borderBottom: '1px solid rgba(24, 144, 255, 0.2)' },
          mask: { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
        }}
      >
        <Form 
          form={addForm} 
          layout="vertical" 
          onFinish={handleAdd} 
          style={{ color: '#fff' }}
        >
          <Form.Item
            name="provider"
            label={text.provider}
            rules={[{ required: true, message: text.providerRequired }]}
          >
            <Select placeholder={text.providerPlaceholder} options={providers} />
          </Form.Item>
          <Form.Item
            name="location"
            label={text.location}
            rules={[{ required: true, message: text.locationRequired }]}
          >
            <Input placeholder={text.locationRequired} />
          </Form.Item>
          <Form.Item
            name="stationCode"
            label={text.stationCode}
            rules={[
              { required: true, message: text.codeRequired },
              { validator: validateStationCode }
            ]}
          >
            <Input placeholder={text.codeRequired} />
          </Form.Item>
          <Form.Item
            name="stationName"
            label={text.stationName}
          >
            <Input placeholder={text.stationNamePlaceholder} />
          </Form.Item>
          <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                boxShadow: '0 2px 8px rgba(24, 144, 255, 0.4)'
              }}
            >
              {text.save}
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title={text.editStation}
        placement="right"
        width={400}
        open={isEditDrawerVisible}
        onClose={() => {
          setIsEditDrawerVisible(false);
          editForm.resetFields();
          setSelectedStation(null);
        }}
        styles={{
          body: { backgroundColor: '#000' },
          header: { backgroundColor: '#000', borderBottom: '1px solid rgba(24, 144, 255, 0.2)' },
          mask: { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
        }}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit} style={{ color: '#fff' }}>
          <Form.Item
            name="provider"
            label={text.provider}
            rules={[{ required: true, message: text.providerRequired }]}
          >
            <Select placeholder={text.providerPlaceholder} options={providers} />
          </Form.Item>
          <Form.Item
            name="location"
            label={text.location}
            rules={[{ required: true, message: text.locationRequired }]}
          >
            <Input placeholder={text.locationRequired} />
          </Form.Item>
          <Form.Item
            name="stationCode"
            label={text.stationCode}
            rules={[
              { required: true, message: text.codeRequired },
              { validator: validateStationCodeEdit }
            ]}
          >
            <Input placeholder={text.codeRequired} />
          </Form.Item>
          <Form.Item
            name="stationName"
            label={text.stationName}
          >
            <Input placeholder={text.stationNamePlaceholder} />
          </Form.Item>
          <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                boxShadow: '0 2px 8px rgba(24, 144, 255, 0.4)'
              }}
            >
              {text.save}
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
      </div>
    </div>
  );
};

export default HealthChargeStationPage;
