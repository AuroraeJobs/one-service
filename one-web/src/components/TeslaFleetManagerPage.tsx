import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Input, InputNumber, Switch, Tabs } from 'antd';
import {
  CarOutlined,
  CloudSyncOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import { useAuth } from '../contexts/AuthContext';
import {
  teslaFleetApi,
  type TeslaFleetApiCache,
  type TeslaFleetChargingHistoryCache,
  type TeslaFleetTelemetryCache,
  type TeslaFleetVehicleCache,
  type TeslaVehicle
} from '../services/api';

const buildThirdPartyAccountKey = (provider: string, userId?: string, username?: string) => {
  const owner = userId || username || 'anonymous';
  return `${provider}:${owner}`;
};

type TeslaCommandParam = {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'password';
  defaultValue?: string | number | boolean;
};

type TeslaCommandDefinition = {
  key: string;
  label: string;
  command: string;
  description?: string;
  params?: TeslaCommandParam[];
};

type TeslaCommandGroup = {
  title: string;
  commands: TeslaCommandDefinition[];
};

const teslaCommandGroups: TeslaCommandGroup[] = [
  {
    title: '基础控制',
    commands: [
      { key: 'wake-up', label: '唤醒车辆', command: 'wake_up' },
      { key: 'flash-lights', label: '闪灯', command: 'flash_lights' },
      { key: 'honk-horn', label: '鸣笛', command: 'honk_horn' },
      { key: 'door-lock', label: '锁车', command: 'door_lock' },
      { key: 'door-unlock', label: '解锁', command: 'door_unlock' }
    ]
  },
  {
    title: '车门与开合件',
    commands: [
      { key: 'trunk-rear', label: '后备箱', command: 'actuate_trunk', params: [{ name: 'which_trunk', label: '位置', type: 'string', defaultValue: 'rear' }] },
      { key: 'trunk-front', label: '前备箱', command: 'actuate_trunk', params: [{ name: 'which_trunk', label: '位置', type: 'string', defaultValue: 'front' }] },
      { key: 'windows-vent', label: '车窗通风', command: 'window_control', params: [{ name: 'command', label: '指令', type: 'string', defaultValue: 'vent' }, { name: 'lat', label: '纬度', type: 'number' }, { name: 'lon', label: '经度', type: 'number' }] },
      { key: 'windows-close', label: '关闭车窗', command: 'window_control', params: [{ name: 'command', label: '指令', type: 'string', defaultValue: 'close' }, { name: 'lat', label: '纬度', type: 'number' }, { name: 'lon', label: '经度', type: 'number' }] },
      { key: 'charge-port-open', label: '打开充电口', command: 'charge_port_door_open' },
      { key: 'charge-port-close', label: '关闭充电口', command: 'charge_port_door_close' }
    ]
  },
  {
    title: '充电控制',
    commands: [
      { key: 'charge-start', label: '开始充电', command: 'charge_start' },
      { key: 'charge-stop', label: '停止充电', command: 'charge_stop' },
      { key: 'charge-limit', label: '设置充电上限', command: 'set_charge_limit', params: [{ name: 'percent', label: '百分比', type: 'number', defaultValue: 80 }] },
      { key: 'charging-amps', label: '设置充电电流', command: 'set_charging_amps', params: [{ name: 'charging_amps', label: '电流 A', type: 'number', defaultValue: 16 }] }
    ]
  },
  {
    title: '空调与座舱',
    commands: [
      { key: 'climate-start', label: '开启空调', command: 'auto_conditioning_start' },
      { key: 'climate-stop', label: '关闭空调', command: 'auto_conditioning_stop' },
      { key: 'set-temps', label: '设置温度', command: 'set_temps', params: [{ name: 'driver_temp', label: '驾驶侧', type: 'number', defaultValue: 22 }, { name: 'passenger_temp', label: '乘客侧', type: 'number', defaultValue: 22 }] },
      { key: 'preconditioning-max-on', label: '最大预处理', command: 'set_preconditioning_max', params: [{ name: 'on', label: '开启', type: 'boolean', defaultValue: true }] },
      { key: 'seat-heater', label: '座椅加热', command: 'remote_seat_heater_request', params: [{ name: 'heater', label: '座椅编号', type: 'number', defaultValue: 0 }, { name: 'level', label: '档位', type: 'number', defaultValue: 1 }] },
      { key: 'wheel-heater', label: '方向盘加热', command: 'remote_steering_wheel_heater_request', params: [{ name: 'on', label: '开启', type: 'boolean', defaultValue: true }] },
      { key: 'bioweapon', label: '生化防御模式', command: 'set_bioweapon_mode', params: [{ name: 'on', label: '开启', type: 'boolean', defaultValue: true }] },
      { key: 'cabin-overheat', label: '座舱过热保护', command: 'set_cabin_overheat_protection', params: [{ name: 'on', label: '开启', type: 'boolean', defaultValue: true }, { name: 'fan_only', label: '仅风扇', type: 'boolean', defaultValue: false }] }
    ]
  },
  {
    title: '安全与驾驶',
    commands: [
      { key: 'sentry-mode', label: '哨兵模式', command: 'set_sentry_mode', params: [{ name: 'on', label: '开启', type: 'boolean', defaultValue: true }] },
      { key: 'remote-start', label: '远程启动驾驶', command: 'remote_start_drive', params: [{ name: 'password', label: '账号密码', type: 'password' }] },
      { key: 'remote-start-cancel', label: '取消远程启动', command: 'remote_start_drive_cancel' },
      { key: 'valet-mode', label: '代客模式', command: 'set_valet_mode', params: [{ name: 'on', label: '开启', type: 'boolean', defaultValue: true }, { name: 'password', label: 'PIN', type: 'password' }] },
      { key: 'reset-valet-pin', label: '重置代客 PIN', command: 'reset_valet_pin' },
      { key: 'speed-limit-activate', label: '启用限速', command: 'speed_limit_activate', params: [{ name: 'pin', label: 'PIN', type: 'password' }] },
      { key: 'speed-limit-deactivate', label: '停用限速', command: 'speed_limit_deactivate', params: [{ name: 'pin', label: 'PIN', type: 'password' }] },
      { key: 'speed-limit-set', label: '设置限速', command: 'speed_limit_set_limit', params: [{ name: 'limit_mph', label: 'mph', type: 'number', defaultValue: 55 }] },
      { key: 'speed-limit-clear', label: '清除限速 PIN', command: 'speed_limit_clear_pin', params: [{ name: 'pin', label: 'PIN', type: 'password' }] }
    ]
  },
  {
    title: '媒体',
    commands: [
      { key: 'media-toggle', label: '播放/暂停', command: 'media_toggle_playback' },
      { key: 'media-next', label: '下一首', command: 'media_next_track' },
      { key: 'media-prev', label: '上一首', command: 'media_prev_track' },
      { key: 'media-next-fav', label: '下个收藏', command: 'media_next_fav' },
      { key: 'media-prev-fav', label: '上个收藏', command: 'media_prev_fav' },
      { key: 'media-volume-up', label: '音量+', command: 'media_volume_up' },
      { key: 'media-volume-down', label: '音量-', command: 'media_volume_down' }
    ]
  },
  {
    title: '导航与 HomeLink',
    commands: [
      { key: 'navigation-request', label: '发送导航', command: 'navigation_request', params: [{ name: 'type', label: '类型', type: 'string', defaultValue: 'share_ext_content_raw' }, { name: 'value', label: '目的地', type: 'string' }, { name: 'locale', label: '语言', type: 'string', defaultValue: 'zh-CN' }, { name: 'timestamp_ms', label: '时间戳 ms', type: 'number' }] },
      { key: 'homelink', label: '触发 HomeLink', command: 'trigger_homelink', params: [{ name: 'lat', label: '纬度', type: 'number' }, { name: 'lon', label: '经度', type: 'number' }] }
    ]
  }
];

const defaultCommandValues = teslaCommandGroups.reduce<Record<string, Record<string, string | number | boolean>>>((acc, group) => {
  group.commands.forEach(command => {
    acc[command.key] = {};
    command.params?.forEach(param => {
      if (param.defaultValue !== undefined) {
        acc[command.key][param.name] = param.defaultValue;
      }
    });
  });
  return acc;
}, {});

const buildDefaultTelemetryConfig = (vin: string) => JSON.stringify({
  vins: vin ? [vin] : [],
  config: {
    hostname: 'your-fleet-telemetry.example.com',
    port: 443,
    fields: {
      VehicleSpeed: { interval_seconds: 10 },
      Odometer: { interval_seconds: 60 },
      Soc: { interval_seconds: 60 },
      EstBatteryRange: { interval_seconds: 60 },
      ChargeState: { interval_seconds: 30 },
      Location: { interval_seconds: 30 }
    }
  }
}, null, 2);

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
};

const unwrapTeslaResponse = (cache: TeslaFleetApiCache) => {
  const data = asRecord(cache.data);
  return asRecord(data?.response) || data || {};
};

const valueAsString = (data: Record<string, unknown> | undefined, keys: string[]) => {
  if (!data) return undefined;
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  }
  return undefined;
};

const valueAsNumber = (data: Record<string, unknown> | undefined, keys: string[]) => {
  if (!data) return undefined;
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) return Number(value);
  }
  return undefined;
};

const valueAsRecord = (data: Record<string, unknown> | undefined, keys: string[]) => {
  if (!data) return undefined;
  for (const key of keys) {
    const record = asRecord(data[key]);
    if (record) return record;
  }
  return undefined;
};

const valueAsArray = (data: Record<string, unknown> | undefined, keys: string[]) => {
  if (!data) return undefined;
  for (const key of keys) {
    const value = data[key];
    if (Array.isArray(value)) return value;
  }
  return undefined;
};

const formatNumber = (value?: number, suffix = '') => {
  if (value === undefined) return '未返回';
  return `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}`;
};

const formatMilesAsKm = (value?: number) => {
  if (value === undefined) return '未返回';
  return `${(value * 1.60934).toFixed(1)} km`;
};

const formatTimestamp = (value?: string | number) => {
  if (value === undefined || value === '') return '未返回';
  const parsed = typeof value === 'number' && value < 10000000000 ? value * 1000 : value;
  const date = new Date(parsed);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const formatCurrency = (amount?: number, currency?: string) => {
  if (amount === undefined) return '未返回';
  return `${Number.isInteger(amount) ? amount : amount.toFixed(2)} ${currency || 'CNY'}`;
};

const formatSwitch = (value?: string) => {
  if (value === undefined) return undefined;
  if (value === 'true') return '开';
  if (value === 'false') return '关';
  return value;
};

const vehicleDataModuleLabels: Record<string, string> = {
  charge_state: '充电与电池',
  climate_state: '空调与温度',
  drive_state: '行驶与位置',
  vehicle_state: '车辆状态',
  vehicle_config: '车辆配置',
  gui_settings: '界面设置'
};

const vehicleDataFieldLabels: Record<string, string> = {
  api_version: 'API 版本',
  backseat_token: '后排控制令牌',
  backseat_token_updated_at: '后排令牌更新时间',
  calendar_enabled: '日历启用',
  color: '车身颜色',
  display_name: '车辆名称',
  id: '车辆 ID',
  in_service: '维修中',
  option_codes: '配置代码',
  state: '在线状态',
  tokens: '车辆令牌',
  vehicle_id: '车辆平台 ID',
  vin: 'VIN',

  battery_heater_on: '电池加热',
  battery_level: '电池电量',
  battery_range: '额定续航',
  charge_amps: '设置充电电流',
  charge_current_request: '请求充电电流',
  charge_current_request_max: '最大请求电流',
  charge_enable_request: '允许充电请求',
  charge_energy_added: '本次已充电量',
  charge_limit_soc: '充电上限',
  charge_limit_soc_max: '最大充电上限',
  charge_limit_soc_min: '最小充电上限',
  charge_limit_soc_std: '标准充电上限',
  charge_miles_added_ideal: '理想增加续航',
  charge_miles_added_rated: '额定增加续航',
  charge_port_cold_weather_mode: '充电口低温模式',
  charge_port_color: '充电口灯色',
  charge_port_door_open: '充电口盖',
  charge_port_latch: '充电口锁止',
  charge_rate: '充电速度',
  charger_actual_current: '实际充电电流',
  charger_phases: '充电相数',
  charger_pilot_current: '导引电流',
  charger_power: '充电功率',
  charger_voltage: '充电电压',
  charging_state: '充电状态',
  conn_charge_cable: '连接线缆',
  est_battery_range: '估算续航',
  fast_charger_brand: '快充品牌',
  fast_charger_present: '连接快充',
  fast_charger_type: '快充类型',
  ideal_battery_range: '理想续航',
  max_range_charge_counter: '最大续航充电次数',
  minutes_to_full_charge: '充满剩余分钟',
  not_enough_power_to_heat: '加热功率不足',
  off_peak_charging_enabled: '低谷充电',
  off_peak_charging_times: '低谷充电时间',
  preconditioning_enabled: '预处理',
  preconditioning_times: '预处理时间',
  scheduled_charging_mode: '定时充电模式',
  scheduled_charging_pending: '定时充电待执行',
  scheduled_charging_start_time: '定时充电开始时间',
  scheduled_departure_time: '计划出发时间',
  supercharger_session_trip_planner: '超充行程规划会话',
  time_to_full_charge: '充满剩余小时',
  timestamp: '数据时间',
  trip_charging: '行程充电',
  usable_battery_level: '可用电量',
  user_charge_enable_request: '用户充电请求',

  gps_as_of: 'GPS 时间',
  heading: '方向',
  latitude: '纬度',
  longitude: '经度',
  native_latitude: '原生纬度',
  native_location_supported: '支持原生定位',
  native_longitude: '原生经度',
  native_type: '原生坐标类型',
  power: '电机功率',
  shift_state: '档位',
  speed: '车速',

  battery_heater: '电池加热器',
  bioweapon_mode: '生化防御模式',
  cabin_overheat_protection: '座舱过热保护',
  cabin_overheat_protection_actively_cooling: '过热保护制冷中',
  climate_keeper_mode: '空调保持模式',
  defrost_mode: '除霜模式',
  driver_temp_setting: '驾驶侧温度设定',
  fan_status: '风扇状态',
  inside_temp: '车内温度',
  is_auto_conditioning_on: '自动空调',
  is_climate_on: '空调状态',
  is_front_defroster_on: '前挡除霜',
  is_preconditioning: '预处理中',
  is_rear_defroster_on: '后窗除霜',
  left_temp_direction: '左侧出风方向',
  max_avail_temp: '最高可设温度',
  min_avail_temp: '最低可设温度',
  outside_temp: '车外温度',
  passenger_temp_setting: '乘客侧温度设定',
  remote_heater_control_enabled: '远程加热控制',
  right_temp_direction: '右侧出风方向',
  seat_heater_left: '左前座椅加热',
  seat_heater_right: '右前座椅加热',
  side_mirror_heaters: '后视镜加热',
  steering_wheel_heater: '方向盘加热',
  wiper_blade_heater: '雨刷加热',

  car_version: '车辆软件版本',
  center_display_state: '中控屏状态',
  df: '左前门',
  dr: '左后门',
  fd_window: '左前车窗',
  fp_window: '右前车窗',
  ft: '前备箱',
  homelink_device_count: 'Homelink 设备数',
  is_user_present: '车内有人',
  locked: '车辆锁定',
  media_state: '媒体状态',
  odometer: '里程表',
  parsed_calendar_supported: '支持解析日历',
  pf: '右前门',
  pr: '右后门',
  rd_window: '左后车窗',
  remote_start: '远程启动',
  remote_start_enabled: '允许远程启动',
  remote_start_supported: '支持远程启动',
  rp_window: '右后车窗',
  rt: '后备箱',
  sentry_mode: '哨兵模式',
  sentry_mode_available: '支持哨兵模式',
  smart_summon_available: '支持智能召唤',
  valet_mode: '代客模式',
  vehicle_name: '车辆名称',

  can_accept_navigation_requests: '可接收导航请求',
  can_actuate_trunks: '可控制前后备箱',
  car_special_type: '车辆特殊类型',
  car_type: '车型',
  charge_port_type: '充电口类型',
  eu_vehicle: '欧规车辆',
  exterior_color: '外观颜色',
  has_air_suspension: '空气悬架',
  has_ludicrous_mode: '狂暴模式',
  key_version: '钥匙版本',
  motorized_charge_port: '电动充电口',
  plg: '电动尾门',
  rear_drive_unit: '后驱单元',
  rear_seat_heaters: '后排座椅加热',
  rear_seat_type: '后排座椅类型',
  rhd: '右舵',
  roof_color: '车顶颜色',
  seat_type: '座椅类型',
  spoiler_type: '扰流板类型',
  sun_roof_installed: '天窗配置',
  third_row_seats: '第三排座椅',
  trim_badging: '车型标识',
  wheel_type: '轮毂类型',

  gui_24_hour_time: '24 小时制',
  gui_charge_rate_units: '充电速率单位',
  gui_distance_units: '距离单位',
  gui_range_display: '续航显示方式',
  gui_temperature_units: '温度单位',
  show_range_units: '显示续航单位'
};

const rangeFields = new Set([
  'battery_range',
  'est_battery_range',
  'ideal_battery_range',
  'charge_miles_added_ideal',
  'charge_miles_added_rated'
]);

const timestampFields = new Set([
  'timestamp',
  'scheduled_charging_start_time',
  'scheduled_departure_time'
]);

const formatTeslaFieldValue = (key: string, value: unknown) => {
  if (value === null || value === undefined || value === '') return '未返回';
  if (typeof value === 'boolean') return value ? '开' : '关';
  if (typeof value === 'number') {
    if (timestampFields.has(key)) return formatTimestamp(value);
    if (rangeFields.has(key)) return `${formatNumber(value, ' mi')} / ${formatMilesAsKm(value)}`;
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  if (typeof value === 'string') {
    if (value === 'true' || value === 'false') return formatSwitch(value);
    return value;
  }
  return JSON.stringify(value);
};

const renderTeslaDataField = (key: string, value: unknown) => (
  <div key={key}>
    <span>
      {vehicleDataFieldLabels[key] || key}
      {vehicleDataFieldLabels[key] && <small>{key}</small>}
    </span>
    <strong>{formatTeslaFieldValue(key, value)}</strong>
  </div>
);

const renderField = (label: string, value?: string | number) => (
  <div>
    <span>{label}</span>
    <strong>{value === undefined || value === '' ? '未返回' : value}</strong>
  </div>
);

const historyContainers = [
  'charging_history',
  'chargingHistory',
  'charge_history',
  'response',
  'sessions',
  'records',
  'items',
  'data',
  'results'
];

const extractChargingSessions = (cache: TeslaFleetChargingHistoryCache | null) => {
  const history = cache?.chargingHistory;
  const response = asRecord(history?.response) || history;
  const direct = valueAsArray(response, historyContainers);
  if (direct) {
    return direct.map(asRecord).filter((item): item is Record<string, unknown> => Boolean(item));
  }

  const nested = valueAsRecord(response, ['data', 'result', 'results', 'history']);
  const nestedArray = valueAsArray(nested, historyContainers);
  if (nestedArray) {
    return nestedArray.map(asRecord).filter((item): item is Record<string, unknown> => Boolean(item));
  }

  return Array.isArray(response) ? response.map(asRecord).filter((item): item is Record<string, unknown> => Boolean(item)) : [];
};

const sessionMatchesVehicle = (session: Record<string, unknown>, vehicle?: TeslaVehicle) => {
  if (!vehicle) return true;
  const sessionVin = valueAsString(session, ['vin', 'vehicle_vin', 'vehicleVin']);
  if (sessionVin) return sessionVin === vehicle.vin;

  const sessionVehicleId = valueAsString(session, ['vehicle_id', 'vehicleId']);
  const vehicleIds = [vehicle.vehicle_id, vehicle.id].filter((id): id is number => id !== undefined).map(String);
  return !sessionVehicleId || vehicleIds.includes(sessionVehicleId);
};

const TeslaFleetManagerPage = () => {
  const { user } = useAuth();
  const defaultAccountKey = buildThirdPartyAccountKey('Tesla', user?.id, user?.username);
  const [accountKey, setAccountKey] = useState(defaultAccountKey);
  const [vehicleCache, setVehicleCache] = useState<TeslaFleetVehicleCache | null>(null);
  const [chargingHistoryCache, setChargingHistoryCache] = useState<TeslaFleetChargingHistoryCache | null>(null);
  const [vehicleApiCaches, setVehicleApiCaches] = useState<Record<string, Record<string, TeslaFleetApiCache>>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [chargingHistoryLoading, setChargingHistoryLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState('');
  const [commandLoading, setCommandLoading] = useState('');
  const [commandValues, setCommandValues] = useState<Record<string, Record<string, string | number | boolean>>>(defaultCommandValues);
  const [lastCommandResponse, setLastCommandResponse] = useState<Record<string, unknown> | null>(null);
  const [telemetryLoading, setTelemetryLoading] = useState('');
  const [telemetryConfigJson, setTelemetryConfigJson] = useState('');
  const [telemetryConfigResponse, setTelemetryConfigResponse] = useState<Record<string, unknown> | null>(null);
  const [telemetryErrorsResponse, setTelemetryErrorsResponse] = useState<Record<string, unknown> | null>(null);
  const [telemetryCache, setTelemetryCache] = useState<TeslaFleetTelemetryCache | null>(null);
  const [telemetryConnectivityCache, setTelemetryConnectivityCache] = useState<TeslaFleetTelemetryCache | null>(null);
  const [selectedVin, setSelectedVin] = useState('');

  const vehicles = useMemo<TeslaVehicle[]>(() => {
    const response = vehicleCache?.vehicles?.response;
    return Array.isArray(response) ? response : [];
  }, [vehicleCache]);

  useEffect(() => {
    setAccountKey(defaultAccountKey);
  }, [defaultAccountKey]);

  useEffect(() => {
    const availableVins = vehicles.map(vehicle => vehicle.vin || '').filter(Boolean);
    if (availableVins.length === 0) {
      setSelectedVin('');
      return;
    }
    if (!selectedVin || !availableVins.includes(selectedVin)) {
      setSelectedVin(availableVins[0]);
    }
  }, [selectedVin, vehicles]);

  useEffect(() => {
    if (!selectedVin) return;
    setTelemetryConfigJson(buildDefaultTelemetryConfig(selectedVin));
  }, [selectedVin]);

  const withFeedback = async (action: () => Promise<void>) => {
    setError('');
    setSuccess('');
    try {
      await action();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Tesla Fleet 操作失败');
    }
  };

  const loadVehicleCache = async () => {
    setVehicleLoading(true);
    await withFeedback(async () => {
      const cache = await teslaFleetApi.getCachedVehicles(accountKey);
      setVehicleCache(cache);
    });
    setVehicleLoading(false);
  };

  const loadChargingHistoryCache = async () => {
    setChargingHistoryLoading(true);
    await withFeedback(async () => {
      const cache = await teslaFleetApi.getCachedChargingHistory(accountKey);
      setChargingHistoryCache(cache);
    });
    setChargingHistoryLoading(false);
  };

  useEffect(() => {
    loadVehicleCache();
    loadChargingHistoryCache();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (vehicles.length === 0) return;

    const loadCachedVehicleApis = async () => {
      try {
        const entries = await Promise.all(
          vehicles
            .map(vehicle => vehicle.vin || '')
            .filter(Boolean)
            .flatMap(vin => [
              teslaFleetApi
                .getApiCache(accountKey, 'vehicle-data', vin)
                .then(cache => ({ vin, type: `车辆实时数据:${vin}`, cache })),
              teslaFleetApi
                .getApiCache(accountKey, 'nearby-charging-sites', vin)
                .then(cache => ({ vin, type: `附近充电站:${vin}`, cache }))
            ])
        );

        const nextCaches = entries.reduce<Record<string, Record<string, TeslaFleetApiCache>>>((acc, item) => {
          if (!item.cache) return acc;
          acc[item.vin] = { ...acc[item.vin], [item.type]: item.cache };
          return acc;
        }, {});

        setVehicleApiCaches(prev => ({ ...prev, ...nextCaches }));
      } catch (caught: unknown) {
        setError(caught instanceof Error ? caught.message : 'Tesla 车辆 API 缓存读取失败');
      }
    };

    loadCachedVehicleApis();
  }, [accountKey, vehicles]);

  const refreshVehicles = async () => {
    setVehicleLoading(true);
    await withFeedback(async () => {
      const cache = await teslaFleetApi.refreshCachedVehicles(accountKey);
      setVehicleCache(cache);
      setSuccess('车辆信息已刷新并保存到 Redis');
    });
    setVehicleLoading(false);
  };

  const refreshVehicleApi = async (vin: string, type: string, action: () => Promise<TeslaFleetApiCache>) => {
    setApiLoading(type);
    await withFeedback(async () => {
      const cache = await action();
      setVehicleApiCaches(prev => ({ ...prev, [vin]: { ...prev[vin], [type]: cache } }));
      setSuccess(`${type} 已刷新并保存到 Redis`);
    });
    setApiLoading('');
  };

  const refreshChargingHistory = async () => {
    setChargingHistoryLoading(true);
    await withFeedback(async () => {
      const cache = await teslaFleetApi.refreshCachedChargingHistory(accountKey, {});
      setChargingHistoryCache(cache);
      setSuccess('充电历史已刷新并保存到 Redis');
    });
    setChargingHistoryLoading(false);
  };

  const updateCommandValue = (commandKey: string, paramName: string, value: string | number | boolean | null) => {
    setCommandValues(prev => ({
      ...prev,
      [commandKey]: {
        ...prev[commandKey],
        [paramName]: value ?? ''
      }
    }));
  };

  const runVehicleCommand = async (vin: string, command: TeslaCommandDefinition) => {
    setCommandLoading(command.key);
    await withFeedback(async () => {
      const body = Object.entries(commandValues[command.key] || {}).reduce<Record<string, unknown>>((acc, [key, value]) => {
        if (value !== '') acc[key] = value;
        return acc;
      }, {});
      const response = await teslaFleetApi.vehicleCommand(accountKey, vin, command.command, body);
      setLastCommandResponse(response);
      setSuccess(`${command.label} 指令已发送`);
      if (command.command === 'wake_up') {
        await refreshVehicles();
      }
    });
    setCommandLoading('');
  };

  const createTelemetryConfig = async (vin: string) => {
    setTelemetryLoading('create');
    await withFeedback(async () => {
      const body = JSON.parse(telemetryConfigJson || buildDefaultTelemetryConfig(vin)) as Record<string, unknown>;
      const response = await teslaFleetApi.createFleetTelemetryConfig(accountKey, body);
      setTelemetryConfigResponse(response);
      setSuccess('Fleet Telemetry 配置已提交');
    });
    setTelemetryLoading('');
  };

  const loadTelemetryConfig = async (vin: string) => {
    setTelemetryLoading('config');
    await withFeedback(async () => {
      const response = await teslaFleetApi.getFleetTelemetryConfig(accountKey, vin);
      setTelemetryConfigResponse(response);
      setSuccess('Fleet Telemetry 配置状态已刷新');
    });
    setTelemetryLoading('');
  };

  const deleteTelemetryConfig = async (vin: string) => {
    setTelemetryLoading('delete');
    await withFeedback(async () => {
      const response = await teslaFleetApi.deleteFleetTelemetryConfig(accountKey, vin);
      setTelemetryConfigResponse(response);
      setSuccess('Fleet Telemetry 配置已删除');
    });
    setTelemetryLoading('');
  };

  const loadTelemetryErrors = async (vin: string) => {
    setTelemetryLoading('errors');
    await withFeedback(async () => {
      const response = await teslaFleetApi.fleetTelemetryErrors(accountKey, vin);
      setTelemetryErrorsResponse(response);
      setSuccess('Fleet Telemetry 错误已刷新');
    });
    setTelemetryLoading('');
  };

  const loadTelemetryCache = async (vin: string) => {
    setTelemetryLoading('cache');
    await withFeedback(async () => {
      const [vehicleData, connectivity] = await Promise.all([
        teslaFleetApi.getFleetTelemetryCache(vin, 'V'),
        teslaFleetApi.getFleetTelemetryCache(vin, 'connectivity')
      ]);
      setTelemetryCache(vehicleData);
      setTelemetryConnectivityCache(connectivity);
      setSuccess('Fleet Telemetry 最新缓存已刷新');
    });
    setTelemetryLoading('');
  };

  const renderPanelHeader = (loading: boolean, onRefresh: () => void) => (
    <div className="tesla-friendly-title-row">
      <Button size="small" icon={<ReloadOutlined />} loading={loading} onClick={onRefresh}>
        刷新
      </Button>
    </div>
  );

  const renderCommandParam = (command: TeslaCommandDefinition, param: TeslaCommandParam) => {
    const value = commandValues[command.key]?.[param.name] ?? param.defaultValue ?? '';
    if (param.type === 'boolean') {
      return (
        <label key={param.name} className="tesla-command-switch">
          <span>{param.label}</span>
          <Switch checked={Boolean(value)} onChange={checked => updateCommandValue(command.key, param.name, checked)} />
        </label>
      );
    }

    if (param.type === 'number') {
      return (
        <InputNumber
          key={param.name}
          size="small"
          placeholder={param.label}
          value={typeof value === 'number' ? value : undefined}
          onChange={next => updateCommandValue(command.key, param.name, next)}
        />
      );
    }

    const InputComponent = param.type === 'password' ? Input.Password : Input;
    return (
      <InputComponent
        key={param.name}
        size="small"
        placeholder={param.label}
        value={String(value)}
        onChange={event => updateCommandValue(command.key, param.name, event.target.value)}
      />
    );
  };

  const renderVehicleCommands = (vin: string) => (
    <div className="tesla-friendly-panel">
      <div className="tesla-command-groups">
        {teslaCommandGroups.map(group => (
          <section key={group.title} className="tesla-command-group">
            <div className="tesla-site-group-title">{group.title}</div>
            <div className="tesla-command-list">
              {group.commands.map(command => (
                <div key={command.key} className="tesla-command-item">
                  <div className="tesla-command-main">
                    <strong>{command.label}</strong>
                    <span>{command.command}</span>
                  </div>
                  {command.params && (
                    <div className="tesla-command-params">
                      {command.params.map(param => renderCommandParam(command, param))}
                    </div>
                  )}
                  <Button
                    size="small"
                    loading={commandLoading === command.key}
                    onClick={() => runVehicleCommand(vin, command)}
                  >
                    执行
                  </Button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      {lastCommandResponse && (
        <details className="tesla-fleet-json tesla-command-response">
          <summary>最近指令响应</summary>
          <pre>{JSON.stringify(lastCommandResponse, null, 2)}</pre>
        </details>
      )}
    </div>
  );

  const renderTelemetryCache = (title: string, cache: TeslaFleetTelemetryCache | null) => (
    <div className="tesla-telemetry-cache-card">
      <div>
        <strong>{title}</strong>
        <span>{cache?.updatedAt ? formatTimestamp(cache.updatedAt) : '暂无数据'}</span>
      </div>
      {cache?.data ? (
        <pre>{JSON.stringify(cache.data, null, 2)}</pre>
      ) : (
        <p>等待车辆推送遥测数据</p>
      )}
    </div>
  );

  const renderFleetTelemetry = (vin: string) => (
    <div className="tesla-friendly-panel tesla-telemetry-panel">
      <div className="tesla-telemetry-actions">
        <Button size="small" type="primary" loading={telemetryLoading === 'create'} onClick={() => createTelemetryConfig(vin)}>
          提交配置
        </Button>
        <Button size="small" loading={telemetryLoading === 'config'} onClick={() => loadTelemetryConfig(vin)}>
          配置状态
        </Button>
        <Button size="small" loading={telemetryLoading === 'errors'} onClick={() => loadTelemetryErrors(vin)}>
          错误
        </Button>
        <Button size="small" loading={telemetryLoading === 'cache'} onClick={() => loadTelemetryCache(vin)}>
          最新数据
        </Button>
        <Button size="small" danger loading={telemetryLoading === 'delete'} onClick={() => deleteTelemetryConfig(vin)}>
          删除配置
        </Button>
      </div>

      <Input.TextArea
        className="tesla-telemetry-config-input"
        rows={12}
        value={telemetryConfigJson}
        onChange={event => setTelemetryConfigJson(event.target.value)}
      />

      <div className="tesla-telemetry-cache-grid">
        {renderTelemetryCache('车辆数据', telemetryCache)}
        {renderTelemetryCache('连接状态', telemetryConnectivityCache)}
      </div>

      {telemetryConfigResponse && (
        <details className="tesla-fleet-json">
          <summary>配置响应</summary>
          <pre>{JSON.stringify(telemetryConfigResponse, null, 2)}</pre>
        </details>
      )}
      {telemetryErrorsResponse && (
        <details className="tesla-fleet-json">
          <summary>错误响应</summary>
          <pre>{JSON.stringify(telemetryErrorsResponse, null, 2)}</pre>
        </details>
      )}
    </div>
  );

  const renderVehicleData = (vin: string, cache?: TeslaFleetApiCache) => {
    const response = cache ? unwrapTeslaResponse(cache) : {};
    const moduleEntries = Object.entries(response).filter(([, value]) => asRecord(value));
    const topLevelFields = Object.entries(response).filter(([, value]) => !asRecord(value));

    return (
      <div className="tesla-friendly-panel">
        {renderPanelHeader(
          apiLoading === `车辆实时数据:${vin}`,
          () => refreshVehicleApi(vin, `车辆实时数据:${vin}`, () => teslaFleetApi.refreshVehicleDataCache(accountKey, vin))
        )}
        {cache ? (
          <div className="tesla-vehicle-data-modules">
            {topLevelFields.length > 0 && (
              <section className="tesla-vehicle-data-module">
                <div className="tesla-site-group-title">基础信息</div>
                <div className="tesla-manager-status-grid">
                  {topLevelFields.map(([key, value]) => renderTeslaDataField(key, value))}
                </div>
              </section>
            )}
            {moduleEntries.map(([moduleKey, moduleValue]) => {
              const moduleRecord = asRecord(moduleValue);
              if (!moduleRecord) return null;

              return (
                <section key={moduleKey} className="tesla-vehicle-data-module">
                  <div className="tesla-site-group-title">{vehicleDataModuleLabels[moduleKey] || moduleKey}</div>
                  <div className="tesla-manager-status-grid">
                    {Object.entries(moduleRecord).map(([key, value]) => renderTeslaDataField(key, value))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="tesla-empty-hint">暂无车辆实时数据缓存</div>
        )}
      </div>
    );
  };

  const renderChargingSites = (vin: string, cache?: TeslaFleetApiCache) => {
    const response = cache ? unwrapTeslaResponse(cache) : {};
    const superchargers = Array.isArray(response.superchargers) ? response.superchargers : [];
    const destinationChargers = Array.isArray(response.destination_charging) ? response.destination_charging : [];
    const siteGroups = [
      {
        title: '超级充电站',
        sites: superchargers.map(asRecord).filter((site): site is Record<string, unknown> => Boolean(site))
      },
      {
        title: '目的地充电站',
        sites: destinationChargers.map(asRecord).filter((site): site is Record<string, unknown> => Boolean(site))
      }
    ].filter(group => group.sites.length > 0);

    return (
      <div className="tesla-friendly-panel">
        {renderPanelHeader(
          apiLoading === `附近充电站:${vin}`,
          () => refreshVehicleApi(vin, `附近充电站:${vin}`, () => teslaFleetApi.refreshNearbyChargingSitesCache(accountKey, vin))
        )}
        {siteGroups.length > 0 ? (
          <div className="tesla-site-groups">
            {siteGroups.map(group => (
              <section key={group.title} className="tesla-site-group">
                <div className="tesla-site-group-title">{group.title}</div>
                <div className="tesla-site-list">
                  {group.sites.map((site, index) => {
                    const name = valueAsString(site, ['name', 'location_name']) || `充电站 ${index + 1}`;
                    const distance = valueAsNumber(site, ['distance_miles', 'distance_km']);
                    const unit = site.distance_km !== undefined ? ' km' : ' mi';
                    const available = valueAsString(site, ['available_stalls', 'available_charging_stalls']);
                    const total = valueAsString(site, ['total_stalls', 'total_charging_stalls']);
                    const status = valueAsString(site, ['site_closed']) === 'true' ? '已关闭' : '可用';

                    return (
                      <div key={`${group.title}-${name}-${index}`} className="tesla-site-item">
                        <strong>{name}</strong>
                        <span>距离: {formatNumber(distance, unit)}</span>
                        <span>桩位: {available || '未知'} / {total || '未知'}</span>
                        <span>状态: {status}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="tesla-empty-hint">暂无附近充电站数据</div>
        )}
      </div>
    );
  };

  const renderChargingHistory = (vehicle?: TeslaVehicle) => {
    const allSessions = extractChargingSessions(chargingHistoryCache);
    const sessions = allSessions.filter(session => sessionMatchesVehicle(session, vehicle));
    const totalEnergy = sessions.reduce((sum, session) => (
      sum + (valueAsNumber(session, ['charge_energy_added', 'energy_added', 'kwh', 'total_kwh', 'usage']) || 0)
    ), 0);
    const totalCost = sessions.reduce((sum, session) => (
      sum + (valueAsNumber(session, ['total_due', 'total_cost', 'cost', 'amount', 'fee', 'session_fee']) || 0)
    ), 0);
    const latestSession = sessions[0];
    const historyUpdated = chargingHistoryCache?.updatedAt;

    return (
      <div className="tesla-friendly-panel">
        {renderPanelHeader(chargingHistoryLoading, refreshChargingHistory)}
        <div className="tesla-charging-summary">
          {renderField('记录数', sessions.length)}
          {renderField('总电量', sessions.length > 0 ? formatNumber(totalEnergy, ' kWh') : undefined)}
          {renderField('总费用', sessions.length > 0 ? formatCurrency(totalCost) : undefined)}
          {renderField('最近充电', formatTimestamp(valueAsString(latestSession, ['start_date_time', 'start_time', 'session_start_time', 'created_at'])))}
        </div>
        {historyUpdated && (
          <div className="tesla-cache-footnote">缓存更新时间: {formatTimestamp(historyUpdated)}</div>
        )}
        {sessions.length > 0 ? (
          <div className="tesla-charging-history-list">
            {sessions.slice(0, 12).map((session, index) => {
              const location = valueAsString(session, ['site_name', 'location_name', 'site', 'location', 'name']) || `充电记录 ${index + 1}`;
              const start = valueAsString(session, ['start_date_time', 'start_time', 'session_start_time', 'created_at']);
              const end = valueAsString(session, ['stop_date_time', 'end_time', 'session_end_time', 'completed_at']);
              const energy = valueAsNumber(session, ['charge_energy_added', 'energy_added', 'kwh', 'total_kwh', 'usage']);
              const cost = valueAsNumber(session, ['total_due', 'total_cost', 'cost', 'amount', 'fee', 'session_fee']);
              const currency = valueAsString(session, ['currency', 'currency_code']);
              const status = valueAsString(session, ['status', 'session_status', 'type']);
              const invoiceId = valueAsString(session, ['invoice_id', 'invoiceId', 'id']);

              return (
                <div key={`${invoiceId || location}-${start || index}`} className="tesla-charging-history-item">
                  <strong>{location}</strong>
                  <span>开始: {formatTimestamp(start)}</span>
                  <span>结束: {formatTimestamp(end)}</span>
                  <span>电量: {formatNumber(energy, ' kWh')}</span>
                  <span>费用: {formatCurrency(cost, currency)}</span>
                  <span>状态: {status || '未返回'}</span>
                  <span>发票: {invoiceId || '未返回'}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="tesla-empty-hint">暂无该车辆的充电历史缓存</div>
        )}
      </div>
    );
  };

  const renderVehicleTabs = (vin: string, vehicle?: TeslaVehicle, caches?: Record<string, TeslaFleetApiCache>) => {
    const isOnline = vehicle?.state === 'online';

    return (
      <Tabs
        className="tesla-vehicle-tabs"
        size="small"
        items={[
          {
            key: 'vehicle-data',
            label: '车辆实时数据',
            children: isOnline ? renderVehicleData(vin, caches?.[`车辆实时数据:${vin}`]) : (
              <div className="tesla-empty-hint">车辆离线时暂不显示实时数据</div>
            )
          },
          {
            key: 'nearby-charging-sites',
            label: '附近充电站',
            children: isOnline ? renderChargingSites(vin, caches?.[`附近充电站:${vin}`]) : (
              <div className="tesla-empty-hint">车辆离线时暂不显示附近充电站</div>
            )
          },
          {
            key: 'charging-history',
            label: '充电历史',
            children: renderChargingHistory(vehicle)
          },
          {
            key: 'commands',
            label: '车辆指令',
            children: renderVehicleCommands(vin)
          },
          {
            key: 'telemetry',
            label: 'Fleet Telemetry',
            children: renderFleetTelemetry(vin)
          }
        ]}
      />
    );
  };

  const selectedVehicle = vehicles.find(vehicle => vehicle.vin === selectedVin);
  const selectedVehicleCaches = selectedVin ? vehicleApiCaches[selectedVin] : undefined;

  return (
    <LifePageShell
      className="tesla-fleet-manager-page"
      eyebrow="Tesla Fleet"
      title="车辆、充电与 Fleet API 数据管理。"
      actions={
        <Button type="primary" icon={<CloudSyncOutlined />} loading={vehicleLoading} onClick={refreshVehicles}>
          刷新车辆信息
        </Button>
      }
    >
      {(error || success) && (
        <Alert
          className="tesla-fleet-alert"
          type={error ? 'error' : 'success'}
          showIcon
          message={error || success}
        />
      )}

      <Card className="life-panel-card tesla-manager-vehicle-card">
        <div className="life-panel-title-row">
          <h2>车辆列表</h2>
          <CarOutlined />
        </div>

        {vehicles.length > 0 && (
          <div className="tesla-vehicle-workspace">
            <div className="tesla-fleet-vehicle-list">
              {vehicles.map(vehicle => {
                const vin = vehicle.vin || '';
                const isOnline = vehicle.state === 'online';
                const selected = vin && vin === selectedVin;
                return (
                  <div
                    role="button"
                    tabIndex={0}
                    key={vehicle.vin || vehicle.id || vehicle.vehicle_id}
                    className={`tesla-fleet-vehicle ${selected ? 'tesla-fleet-vehicle-selected' : ''}`}
                    onClick={() => {
                      if (vin) setSelectedVin(vin);
                    }}
                    onKeyDown={event => {
                      if ((event.key === 'Enter' || event.key === ' ') && vin) {
                        event.preventDefault();
                        setSelectedVin(vin);
                      }
                    }}
                  >
                    <span className={`tesla-vehicle-icon ${isOnline ? 'tesla-vehicle-icon-online' : ''}`}>
                      <CarOutlined />
                    </span>
                    <div className="tesla-vehicle-card-main">
                      <strong>{vehicle.display_name || '未命名车辆'}</strong>
                      <span>{vehicle.vin || 'VIN 未返回'}</span>
                    </div>
                    <Button
                      size="small"
                      shape="circle"
                      icon={<ReloadOutlined />}
                      loading={apiLoading === `车辆详情:${vin}`}
                      onClick={event => {
                        event.stopPropagation();
                        if (vin) {
                          refreshVehicleApi(vin, `车辆详情:${vin}`, () => teslaFleetApi.refreshVehicleCache(accountKey, vin));
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="tesla-vehicle-detail-panel">
              {selectedVehicle && selectedVin ? (
                renderVehicleTabs(selectedVin, selectedVehicle, selectedVehicleCaches)
              ) : (
                <div className="tesla-empty-hint">请选择车辆</div>
              )}
            </div>
          </div>
        )}

      </Card>
    </LifePageShell>
  );
};

export default TeslaFleetManagerPage;
