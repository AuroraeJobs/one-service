import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Popconfirm, message, Drawer } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { chargeStationApi, chargeRecordApi } from '../services/api';
import type { ChargeRecord } from '../services/api';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import dayjs from 'dayjs';

interface ChargeProviderOption {
  label: string;
  value: string;
}

interface ChargeStation {
  id?: string;
  provider: string;
  stationCode: string;
  stationName?: string;
  lastChargeAt?: number;
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
  const { isEnglish, colorMode } = useAppPreferences();
  const textColor = colorMode === 'dark' ? '#fff' : '#1a1a2e';
  const textMuted = colorMode === 'dark' ? '#999' : '#666';
  const text = {
    stationUnit: isEnglish ? 'stations' : '个站点',
    chargeCount: isEnglish ? 'Sessions' : '充电次数',
    chargeCountUnit: isEnglish ? '' : '次',
    energy: isEnglish ? 'Energy' : '充电度数',
    totalCost: isEnglish ? 'Total Cost' : '总费用',
    avgPrice: isEnglish ? 'Avg Price' : '平均单价',
    providerPlaceholder: isEnglish ? 'Select provider' : '选择充电提供方',
    searchPlaceholder: isEnglish ? 'Search station code/name' : '搜索站点编码/名称',
    noStations: isEnglish ? 'No charging station data' : '暂无充电站数据',
    deleteConfirm: isEnglish ? 'Delete this charging station?' : '确定要删除这个充电站吗？',
    ok: isEnglish ? 'OK' : '确定',
    cancel: isEnglish ? 'Cancel' : '取消',
    stationCode: isEnglish ? 'Station Code' : '站点编码',
    addStation: isEnglish ? 'Add Charging Station' : '添加充电站',
    editStation: isEnglish ? 'Edit Charging Station' : '编辑充电站',
    provider: isEnglish ? 'Provider' : '充电提供方',
    stationName: isEnglish ? 'Station Name' : '站点名称',
    save: isEnglish ? 'Save' : '保存',
    providerRequired: isEnglish ? 'Please select a provider' : '请选择充电提供方',
    codeRequired: isEnglish ? 'Please enter a station code' : '请输入站点编码',
    codeExists: isEnglish ? 'Station code already exists' : '站点编码已存在',
    stationNamePlaceholder: isEnglish ? 'Enter station name' : '请输入站点名称',
    stationNameRequired: isEnglish ? 'Please enter a station name' : '请输入站点名称',
    lastChargeAt: isEnglish ? 'Last Charge Time' : '最近一次充电时间',
    neverCharged: isEnglish ? 'Never' : '从未充电',
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
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'detail' | 'add' | 'edit'>('detail');
  const [selectedStation, setSelectedStation] = useState<ChargeStation | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchProvider, setSearchProvider] = useState<string>('');

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  
  // 监听提供商变化，自动生成站点编码前缀
  const watchAddProvider = Form.useWatch('provider', addForm);
  const watchEditProvider = Form.useWatch('provider', editForm);
  
  // 获取当前提供商的编码前缀
  const getProviderCode = (providerValue: string) => {
    const provider = providers.find(p => p.value === providerValue);
    return provider?.code || '';
  };
  
  // 当提供商变化时，自动获取下一个站点编码
  useEffect(() => {
    if (watchAddProvider) {
      const fetchNextCode = async () => {
        try {
          const nextCode = await chargeStationApi.getNextStationCode(watchAddProvider);
          // 提取数字部分（去掉前缀）
          const providerCode = getProviderCode(watchAddProvider);
          const numberPart = nextCode.substring(providerCode.length);
          addForm.setFieldsValue({ stationCode: numberPart });
        } catch (error) {
          console.error('获取下一个站点编码失败:', error);
        }
      };
      fetchNextCode();
    }
  }, [watchAddProvider, addForm, providers]);

  const validateStationCode = async (_: unknown, value: string) => {
    if (!value) {
      return Promise.resolve();
    }
    
    // 验证格式：3位数字
    if (!/^\d{3}$/.test(value)) {
      return Promise.reject(new Error(isEnglish ? 'Must be 3 digits' : '必须是3位数字'));
    }
    
    // 验证是否已存在
    const providerCode = getProviderCode(addForm.getFieldValue('provider'));
    const fullStationCode = `${providerCode}${value}`;
    
    try {
      await chargeStationApi.findByStationCode(fullStationCode);
      return Promise.reject(new Error(text.codeExists));
    } catch {
      return Promise.resolve();
    }
  };

  const validateStationCodeEdit = async (_: unknown, value: string) => {
    if (!value || !selectedStation) {
      return Promise.resolve();
    }
    
    // 验证格式：3位数字
    if (!/^\d{3}$/.test(value)) {
      return Promise.reject(new Error(isEnglish ? 'Must be 3 digits' : '必须是3位数字'));
    }
    
    // 如果编码没变，直接通过
    const providerCode = getProviderCode(editForm.getFieldValue('provider'));
    const fullStationCode = `${providerCode}${value}`;
    
    if (fullStationCode === selectedStation.stationCode) {
      return Promise.resolve();
    }
    
    // 验证是否已存在
    try {
      await chargeStationApi.findByStationCode(fullStationCode);
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
      // 自动生成完整的站点编码：前缀+用户输入（无横杠）
      const providerCode = getProviderCode(values.provider);
      const fullStationCode = providerCode ? `${providerCode}${values.stationCode}` : values.stationCode;
      
      await chargeStationApi.save({
        ...values,
        stationCode: fullStationCode
      });
      message.success(text.addSuccess);
      setDrawerVisible(false);
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
      setDrawerVisible(false);
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
    setDrawerMode('edit');
  };

  const filteredStations = stations.filter(station => {
    const matchSearch = !searchText || 
      (station.stationCode && station.stationCode.toLowerCase().includes(searchText.toLowerCase())) ||
      (station.stationName && station.stationName.toLowerCase().includes(searchText.toLowerCase()));
    const matchProvider = !searchProvider || station.provider === searchProvider;
    return matchSearch && matchProvider;
  });

  return (
    <div className="themed-route-page health-fitness-page charge-station-page" style={{
      padding: '84px 20px 100px 20px', 
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
                className={`charge-station-stat-card ${searchProvider === stat.provider ? 'charge-station-stat-card-active' : ''}`}
                bodyStyle={{ padding: '16px' }}
                hoverable
                onClick={() => setSearchProvider(searchProvider === stat.provider ? '' : stat.provider)}
                style={{ cursor: 'pointer' }}
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
                    <span style={{ color: textMuted, fontSize: '12px' }}>{text.chargeCount}</span>
                    <span style={{ color: textColor, fontSize: '14px', fontWeight: 'bold' }}>{stat.chargeCount}{text.chargeCountUnit}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: textMuted, fontSize: '12px' }}>{text.energy}</span>
                    <span style={{ color: '#52c41a', fontSize: '14px', fontWeight: 'bold' }}>{stat.totalAmount.toFixed(2)}kWh</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: textMuted, fontSize: '12px' }}>{text.totalCost}</span>
                    <span style={{ color: '#faad14', fontSize: '14px', fontWeight: 'bold' }}>¥{stat.totalCost.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: textMuted, fontSize: '12px' }}>{text.avgPrice}</span>
                    <span style={{ color: '#1890ff', fontSize: '14px', fontWeight: 'bold' }}>¥{stat.avgPrice.toFixed(2)}/kWh</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
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
          <div
            className="charge-station-add-wrapper"
            style={{ '--record-list-accent-gradient': 'linear-gradient(135deg, #1890ff, #096dd9)', '--record-list-accent-shadow': '0 2px 8px rgba(24, 144, 255, 0.4)' } as React.CSSProperties}
          >
            <Button
              className="record-list-add-button"
              icon={<PlusOutlined />}
              onClick={() => {
                addForm.setFieldsValue({ provider: 'STAR' });
                setDrawerMode('add');
                setDrawerVisible(true);
              }}
              size="small"
            />
          </div>
        </div>

        {filteredStations.length === 0 ? (
          <div style={{
            textAlign: 'center', 
            padding: '60px 20px',
            color: textMuted
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
                className="charge-station-card"
                hoverable
                onClick={() => {
                  setSelectedStation(station);
                  setDrawerMode('detail');
                  setDrawerVisible(true);
                }}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ color: '#1890ff', fontSize: '16px', fontWeight: 'bold' }}>
                    {getProviderLabel(station.provider)}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  <div>
                    <div style={{ color: textMuted, fontSize: '12px' }}>{text.stationCode}</div>
                    <div style={{ color: textColor, fontSize: '14px', fontWeight: 'bold' }}>
                      {station.stationCode}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: textMuted, fontSize: '12px' }}>{text.lastChargeAt}</div>
                    <div style={{ color: '#ffc53d', fontSize: '12px' }}>
                      {station.lastChargeAt ? dayjs(station.lastChargeAt).format('YYYY-MM-DD HH:mm') : text.neverCharged}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

      <Drawer
        title={
          <div style={{ color: textColor, fontSize: '18px', fontWeight: 'bold' }}>
            {drawerMode === 'detail' && (isEnglish ? 'Station Details' : '站点详情')}
            {drawerMode === 'add' && text.addStation}
            {drawerMode === 'edit' && text.editStation}
          </div>
        }
        placement="right"
        width={400}
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          setSelectedStation(null);
          addForm.resetFields();
          editForm.resetFields();
        }}
        extra={
          drawerMode === 'detail' && selectedStation ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Popconfirm
                title={text.deleteConfirm}
                onConfirm={() => {
                  if (selectedStation && selectedStation.id) {
                    handleDelete(selectedStation.id);
                    setDrawerVisible(false);
                  }
                }}
                okText={text.ok}
                cancelText={text.cancel}
              >
                <Button
                  type="primary"
                  danger
                  className="detail-action-btn detail-action-btn-danger"
                >
                  {isEnglish ? 'Delete' : '删除'}
                </Button>
              </Popconfirm>
              <Button
                type="primary"
                className="detail-action-btn"
                onClick={() => {
                  if (selectedStation) {
                    handleOpenEdit(selectedStation);
                  }
                }}
              >
                {isEnglish ? 'Edit' : '编辑'}
              </Button>
            </div>
          ) : drawerMode === 'add' ? (
            <Button
              type="primary"
              onClick={() => addForm.submit()}
              className="detail-action-btn-save"
            >
              {text.save}
            </Button>
          ) : drawerMode === 'edit' ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                onClick={() => {
                  editForm.resetFields();
                  setDrawerMode('detail');
                }}
                className="detail-action-btn-cancel"
              >
                {text.cancel}
              </Button>
              <Button
                type="primary"
                onClick={() => editForm.submit()}
                className="detail-action-btn-save"
              >
                {text.save}
              </Button>
            </div>
          ) : null
        }
      >
        {drawerMode === 'detail' && selectedStation && (
          <div style={{ color: textColor }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ color: textMuted, fontSize: '12px', marginBottom: '4px' }}>{text.provider}</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>{getProviderLabel(selectedStation.provider)}</div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ color: textMuted, fontSize: '12px', marginBottom: '4px' }}>{text.stationCode}</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{selectedStation.stationCode}</div>
            </div>
            {selectedStation.stationName && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ color: textMuted, fontSize: '12px', marginBottom: '4px' }}>{text.stationName}</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{selectedStation.stationName}</div>
              </div>
            )}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ color: textMuted, fontSize: '12px', marginBottom: '4px' }}>{text.lastChargeAt}</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffc53d' }}>
                {selectedStation.lastChargeAt ? dayjs(selectedStation.lastChargeAt).format('YYYY-MM-DD HH:mm') : text.neverCharged}
              </div>
            </div>
          </div>
        )}
        {drawerMode === 'add' && (
          <Form
            form={addForm}
            layout="vertical"
            onFinish={handleAdd}
            style={{ color: textColor }}
          >
            <Form.Item
              name="provider"
              label={text.provider}
              rules={[{ required: true, message: text.providerRequired }]}
            >
              <Select placeholder={text.providerPlaceholder} options={providers} />
            </Form.Item>
            <Form.Item
              name="stationCode"
              label={text.stationCode}
              rules={[
                { required: true, message: text.codeRequired },
                { validator: validateStationCode }
              ]}
            >
              <Input 
                placeholder={isEnglish ? 'Auto-generated' : '自动生成'}
                addonBefore={watchAddProvider ? getProviderCode(watchAddProvider) : undefined}
                disabled={!watchAddProvider}
                maxLength={3}
                onInput={(e) => {
                  // 只允许输入数字
                  const target = e.target as HTMLInputElement;
                  target.value = target.value.replace(/\D/g, '').slice(0, 3);
                }}
              />
            </Form.Item>
            <Form.Item
              name="stationName"
              label={text.stationName}
              rules={[{ required: true, message: text.stationNameRequired }]}
            >
              <Input placeholder={text.stationNamePlaceholder} />
            </Form.Item>
          </Form>
        )}
        {drawerMode === 'edit' && (
          <Form form={editForm} layout="vertical" onFinish={handleEdit} style={{ color: textColor }}>
            <Form.Item
              name="provider"
              label={text.provider}
              rules={[{ required: true, message: text.providerRequired }]}
            >
              <Select placeholder={text.providerPlaceholder} options={providers} />
            </Form.Item>
            <Form.Item
              name="stationCode"
              label={text.stationCode}
              rules={[
                { required: true, message: text.codeRequired },
                { validator: validateStationCodeEdit }
              ]}
            >
              <Input 
                placeholder={isEnglish ? '3 digits (e.g., 001)' : '3位数字（如 001）'}
                addonBefore={watchEditProvider ? getProviderCode(watchEditProvider) : undefined}
                disabled
                maxLength={3}
              />
            </Form.Item>
            <Form.Item
              name="stationName"
              label={text.stationName}
              rules={[{ required: true, message: text.stationNameRequired }]}
            >
              <Input placeholder={text.stationNamePlaceholder} />
            </Form.Item>
          </Form>
        )}
      </Drawer>
      </div>
    </div>
  );
};

export default HealthChargeStationPage;
