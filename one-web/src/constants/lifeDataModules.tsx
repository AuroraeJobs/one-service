import {
  ApiOutlined,
  BankOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CarOutlined,
  ClockCircleOutlined,
  CompassOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DotChartOutlined,
  DollarOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  GlobalOutlined,
  HistoryOutlined,
  LineChartOutlined,
  MessageOutlined,
  MoneyCollectOutlined,
  PieChartOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  StockOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  UserOutlined,
  WalletOutlined
} from '@ant-design/icons';
import type { ReactNode } from 'react';

export type LifeModuleStatus = 'live' | 'partial' | 'planned';
export type LifeModuleKey = 'overview' | 'vehicle' | 'finance' | 'investment' | 'lottery' | 'ai' | 'connectors';

export interface LifeDataModule {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  path: string;
  status: LifeModuleStatus;
  accent: string;
  icon: ReactNode;
  liveCapabilities: string[];
  plannedCapabilities: string[];
  dataSources: string[];
}

export interface LifeNavItem {
  path: string;
  key: LifeModuleKey;
  label: string;
  icon: ReactNode;
}

export interface LifeSubNavItem {
  id: string;
  moduleKey: LifeModuleKey;
  path: string;
  label: string;
  icon: ReactNode;
  accent: string;
  children?: LifeSubNavItem[];
}

export const lifeDataModules: LifeDataModule[] = [
  {
    id: 'vehicle',
    title: '车辆能源',
    shortTitle: '能源',
    description: '统一管理油车加油、电车充电、充电站和车辆接口数据。',
    path: '/vehicle/charging',
    status: 'partial',
    accent: '#0071e3',
    icon: <CarOutlined />,
    liveCapabilities: ['电车充电记录', '充电站管理', '充电成本统计'],
    plannedCapabilities: ['油车加油管理', 'Tesla Fleet API', '车辆里程与电耗趋势'],
    dataSources: ['手动记录', '充电站数据', 'Tesla Fleet API', '加油票据']
  },
  {
    id: 'finance',
    title: '收入与现金流',
    shortTitle: '钞票',
    description: '跟踪工资、五险一金、税费、日常收支和账户流水。',
    path: '/finance/salary',
    status: 'partial',
    accent: '#34c759',
    icon: <MoneyCollectOutlined />,
    liveCapabilities: ['工资记录', '五险一金', '个税与实发收入统计'],
    plannedCapabilities: ['支付宝/微信账单', '银行流水', '预算与分类账'],
    dataSources: ['手动工资记录', '支付宝账单', '微信账单', '银行 Open API']
  },
  {
    id: 'investment',
    title: '投资资产',
    shortTitle: '股票',
    description: '沉淀股票账户、基金、现金类资产与市场行情。',
    path: '/investments',
    status: 'planned',
    accent: '#5856d6',
    icon: <StockOutlined />,
    liveCapabilities: [],
    plannedCapabilities: ['持仓同步', '收益归因', '市场行情', '风险暴露'],
    dataSources: ['券商账户', '基金账户', '行情数据', '自定义资产']
  },
  {
    id: 'lottery',
    title: '彩票研究',
    shortTitle: '彩票',
    description: '管理双色球历史开奖、下注记录、中奖记录和统计模型。',
    path: '/lottery',
    status: 'live',
    accent: '#ff3b30',
    icon: <TrophyOutlined />,
    liveCapabilities: ['历史开奖同步', '号码预测', '红蓝球统计', '趋势分析', '卦象视图'],
    plannedCapabilities: ['个人下注记录', '中奖记录', '投入产出统计'],
    dataSources: ['开奖记录接口', '手动下注记录', '中奖核验数据']
  },
  {
    id: 'ai',
    title: '模型对话',
    shortTitle: '模型',
    description: '统一管理本地模型与在线模型的对话入口。',
    path: '/ai/chat',
    status: 'partial',
    accent: '#00c7be',
    icon: <MessageOutlined />,
    liveCapabilities: ['模型切换', '上下文对话', '本地模型接入'],
    plannedCapabilities: ['Spring AI 深度编排', '工具调用', '对话复盘'],
    dataSources: ['LocalAI/Ollama', 'DeepSeek', 'Spring AI OpenAI 兼容配置']
  },
  {
    id: 'accounts',
    title: '账户与账单',
    shortTitle: '账单',
    description: '作为支付宝、微信、银行卡、信用卡账单的统一入口。',
    path: '/connections',
    status: 'planned',
    accent: '#ff9500',
    icon: <CreditCardOutlined />,
    liveCapabilities: [],
    plannedCapabilities: ['账户授权', '账单导入', '自动分类', '跨账户对账'],
    dataSources: ['支付宝', '微信支付', '银行卡', '信用卡']
  },
  {
    id: 'connectors',
    title: '数据接入',
    shortTitle: '接入',
    description: '管理所有生活数据源的接入状态、同步策略和隐私边界。',
    path: '/connections',
    status: 'partial',
    accent: '#00c7be',
    icon: <ApiOutlined />,
    liveCapabilities: ['本地 API 聚合', '认证态页面保护'],
    plannedCapabilities: ['OAuth 授权', '同步任务', '字段映射', '隐私审计'],
    dataSources: ['后端 API', '第三方授权', '文件导入', '手动录入']
  }
];

export const lifeNavItems: LifeNavItem[] = [
  { path: '/overview', key: 'overview', label: '首页', icon: <DashboardOutlined /> },
  { path: '/lottery', key: 'lottery', label: '彩票', icon: <TrophyOutlined /> },
  { path: '/investments', key: 'investment', label: '股票', icon: <StockOutlined /> },
  { path: '/finance/salary', key: 'finance', label: '钞票', icon: <MoneyCollectOutlined /> },
  { path: '/vehicle/charging', key: 'vehicle', label: '能源', icon: <CarOutlined /> },
  { path: '/ai/chat', key: 'ai', label: '模型', icon: <MessageOutlined /> }
];

export const lifeSubNavItems: Record<LifeModuleKey, LifeSubNavItem[]> = {
  overview: [
    { id: 'overview-home', moduleKey: 'overview', path: '/overview', label: '首页', icon: <DashboardOutlined />, accent: '#0071e3' }
  ],
  investment: [
    { id: 'investment-overview', moduleKey: 'investment', path: '/investments', label: '总览', icon: <DashboardOutlined />, accent: '#5856d6' },
    { id: 'investment-watchlist', moduleKey: 'investment', path: '/investments/watchlist', label: '自选', icon: <StockOutlined />, accent: '#0071e3' },
    { id: 'investment-market', moduleKey: 'investment', path: '/investments/market', label: '行情', icon: <LineChartOutlined />, accent: '#34c759' },
    { id: 'investment-positions', moduleKey: 'investment', path: '/investments/positions', label: '持仓', icon: <WalletOutlined />, accent: '#ff9500' },
    { id: 'investment-trades', moduleKey: 'investment', path: '/investments/trades', label: '交易', icon: <BarChartOutlined />, accent: '#ff3b30' },
    { id: 'investment-klines', moduleKey: 'investment', path: '/investments/klines', label: 'K线', icon: <LineChartOutlined />, accent: '#5856d6' },
    { id: 'investment-alerts', moduleKey: 'investment', path: '/investments/alerts', label: '告警', icon: <SafetyCertificateOutlined />, accent: '#ff9500' },
    { id: 'investment-analysis', moduleKey: 'investment', path: '/investments/analysis', label: '分析', icon: <PieChartOutlined />, accent: '#5856d6' },
    { id: 'investment-sync', moduleKey: 'investment', path: '/investments/sync', label: '同步', icon: <SyncOutlined />, accent: '#00c7be' },
    { id: 'investment-providers', moduleKey: 'investment', path: '/investments/providers', label: '数据源', icon: <ApiOutlined />, accent: '#0071e3' },
    { id: 'investment-settings', moduleKey: 'investment', path: '/investments/settings', label: '设置', icon: <SettingOutlined />, accent: '#8e8e93' }
  ],
  connectors: [
    { id: 'connectors-overview', moduleKey: 'connectors', path: '/connections', label: '接入', icon: <DatabaseOutlined />, accent: '#00c7be' }
  ],
  vehicle: [
    { id: 'vehicle-charging', moduleKey: 'vehicle', path: '/vehicle/charging', label: '充电', icon: <ThunderboltOutlined />, accent: '#0071e3' },
    { id: 'vehicle-stations', moduleKey: 'vehicle', path: '/vehicle/charging-stations', label: '站点', icon: <CarOutlined />, accent: '#34c759' },
    { id: 'vehicle-fleet', moduleKey: 'vehicle', path: '/vehicle/tesla', label: '车辆', icon: <ApiOutlined />, accent: '#5856d6' }
  ],
  finance: [
    { id: 'finance-salary', moduleKey: 'finance', path: '/finance/salary', label: '工资', icon: <WalletOutlined />, accent: '#34c759' },
    { id: 'finance-expense', moduleKey: 'finance', path: '/connections', label: '收支', icon: <DollarOutlined />, accent: '#0071e3' },
    { id: 'finance-accounts', moduleKey: 'finance', path: '/connections', label: '账户', icon: <CreditCardOutlined />, accent: '#5856d6' },
    { id: 'finance-tax', moduleKey: 'finance', path: '/connections', label: '税费', icon: <BankOutlined />, accent: '#ff9500' }
  ],
  lottery: [
    { id: 'lottery-overview', moduleKey: 'lottery', path: '/lottery', label: '概览', icon: <TrophyOutlined />, accent: '#ff3b30' },
    {
      id: 'lottery-predictions',
      moduleKey: 'lottery',
      path: '/lottery/prediction',
      label: '预测',
      icon: <ThunderboltOutlined />,
      accent: '#ff9500',
      children: [
        { id: 'lottery-prediction-current', moduleKey: 'lottery', path: '/lottery/prediction', label: '当前', icon: <ThunderboltOutlined />, accent: '#ff9500' },
        { id: 'lottery-prediction-history', moduleKey: 'lottery', path: '/lottery/predictions/history', label: '历史', icon: <HistoryOutlined />, accent: '#5856d6' }
      ]
    },
    {
      id: 'lottery-tickets',
      moduleKey: 'lottery',
      path: '/lottery/tickets',
      label: '票据',
      icon: <FileTextOutlined />,
      accent: '#34c759'
    },
    {
      id: 'lottery-ledger',
      moduleKey: 'lottery',
      path: '/lottery/ledger',
      label: '账本',
      icon: <PieChartOutlined />,
      accent: '#0071e3'
    },
    {
      id: 'lottery-statistics',
      moduleKey: 'lottery',
      path: '/lottery/statistics?tab=frequency',
      label: '统计',
      icon: <BarChartOutlined />,
      accent: '#0071e3',
      children: [
        { id: 'lottery-statistics-frequency', moduleKey: 'lottery', path: '/lottery/statistics?tab=frequency', label: '频率', icon: <BarChartOutlined />, accent: '#0071e3' },
        { id: 'lottery-statistics-group', moduleKey: 'lottery', path: '/lottery/statistics?tab=group', label: '分组', icon: <DotChartOutlined />, accent: '#34c759' },
        { id: 'lottery-statistics-distribution', moduleKey: 'lottery', path: '/lottery/statistics?tab=distribution', label: '分布', icon: <LineChartOutlined />, accent: '#5856d6' },
        { id: 'lottery-astronauts', moduleKey: 'lottery', path: '/lottery/astronauts', label: '宇航员', icon: <UserOutlined />, accent: '#00c7be' },
        { id: 'lottery-parasite', moduleKey: 'lottery', path: '/lottery/parasite', label: '寄生草', icon: <GlobalOutlined />, accent: '#4caf50' },
        { id: 'lottery-dingfengbo', moduleKey: 'lottery', path: '/lottery/dingfengbo', label: '定风波', icon: <CompassOutlined />, accent: '#1890ff' },
        { id: 'lottery-autumn-beginning', moduleKey: 'lottery', path: '/lottery/autumn-beginning', label: '立秋', icon: <CalendarOutlined />, accent: '#ff9500' },
        { id: 'lottery-winter-beginning', moduleKey: 'lottery', path: '/lottery/winter-beginning', label: '立冬', icon: <ClockCircleOutlined />, accent: '#0071e3' }
      ]
    },
    {
      id: 'lottery-symbols',
      moduleKey: 'lottery',
      path: '/lottery/analysis?tab=illusion',
      label: '分析',
      icon: <ExperimentOutlined />,
      accent: '#5856d6',
      children: [
        { id: 'lottery-analysis-illusion', moduleKey: 'lottery', path: '/lottery/analysis?tab=illusion', label: '幻境', icon: <ExperimentOutlined />, accent: '#5856d6' },
        { id: 'lottery-pixel-universe', moduleKey: 'lottery', path: '/lottery/pixel-universe', label: '宇宙', icon: <DotChartOutlined />, accent: '#ff3b30' },
        { id: 'lottery-pixel-card', moduleKey: 'lottery', path: '/lottery/pixel-card', label: '像素', icon: <DotChartOutlined />, accent: '#00c7be' },
        { id: 'lottery-pixel-stats', moduleKey: 'lottery', path: '/lottery/pixel-stats', label: '行列', icon: <BarChartOutlined />, accent: '#34c759' },
        { id: 'lottery-taiji', moduleKey: 'lottery', path: '/lottery/taiji', label: '太极', icon: <DotChartOutlined />, accent: '#722ed1' },
        { id: 'lottery-hexagram', moduleKey: 'lottery', path: '/lottery/hexagram', label: '卦象', icon: <ExperimentOutlined />, accent: '#ff9500' }
      ]
    },
    {
      id: 'lottery-track',
      moduleKey: 'lottery',
      path: '/lottery/analysis?tab=planet',
      label: '轨迹',
      icon: <DotChartOutlined />,
      accent: '#722ed1',
      children: [
        { id: 'lottery-analysis-planet', moduleKey: 'lottery', path: '/lottery/analysis?tab=planet', label: '星球', icon: <DotChartOutlined />, accent: '#722ed1' },
        { id: 'lottery-analysis-energy', moduleKey: 'lottery', path: '/lottery/analysis?tab=energy', label: '能量', icon: <ThunderboltOutlined />, accent: '#ff9500' },
        { id: 'lottery-analysis-accumulate', moduleKey: 'lottery', path: '/lottery/analysis?tab=accumulate', label: '累计', icon: <LineChartOutlined />, accent: '#34c759' },
        { id: 'lottery-analysis-collect', moduleKey: 'lottery', path: '/lottery/analysis?tab=collect', label: '集齐', icon: <DatabaseOutlined />, accent: '#00c7be' },
        { id: 'lottery-analysis-position', moduleKey: 'lottery', path: '/lottery/analysis?tab=position', label: '位置', icon: <BarChartOutlined />, accent: '#af52de' },
        { id: 'lottery-space', moduleKey: 'lottery', path: '/lottery/space', label: '太空', icon: <ExperimentOutlined />, accent: '#5856d6' }
      ]
    }
  ],
  ai: [
    { id: 'ai-chat', moduleKey: 'ai', path: '/ai/chat', label: '对话', icon: <MessageOutlined />, accent: '#00c7be' }
  ]
};

export const legacyPathMap: Record<string, string> = {
  '/fitness': '/vehicle/charging',
  '/fitness/spring-equinox': '/vehicle/charging',
  '/fitness/charge-station': '/vehicle/charging-stations',
  '/fitness/summer-solstice': '/finance/salary',
  '/health': '/lottery',
  '/health/third': '/lottery/parasite',
  '/health/fourth': '/lottery/dingfengbo',
  '/fitness/autumn-equinox': '/lottery/autumn-beginning',
  '/fitness/winter-solstice': '/lottery/winter-beginning',
  '/lottery/overview': '/lottery',
  '/hexagram': '/lottery/hexagram',
  '/statistics': '/lottery/statistics',
  '/analysis': '/lottery/analysis',
  '/prediction': '/lottery/prediction',
  '/record': '/lottery/records',
  '/taiji': '/lottery/taiji'
};

const splitLifePath = (pathname: string) => {
  const queryIndex = pathname.indexOf('?');
  return queryIndex >= 0
    ? { basePath: pathname.slice(0, queryIndex), search: pathname.slice(queryIndex) }
    : { basePath: pathname, search: '' };
};

export const getCanonicalLifePath = (pathname: string) => {
  const { basePath, search } = splitLifePath(pathname);
  return `${legacyPathMap[basePath] || basePath}${search}`;
};

export const getLifeModuleKeyByPath = (pathname: string): LifeModuleKey | '' => {
  const canonicalPath = splitLifePath(getCanonicalLifePath(pathname)).basePath;

  if (canonicalPath === '/overview') return 'overview';
  if (canonicalPath === '/') return 'lottery';
  if (canonicalPath.startsWith('/vehicle')) return 'vehicle';
  if (canonicalPath.startsWith('/finance')) return 'finance';
  if (canonicalPath.startsWith('/investments')) return 'investment';
  if (canonicalPath.startsWith('/connections')) return 'connectors';
  if (canonicalPath.startsWith('/ai')) return 'ai';
  if (canonicalPath.startsWith('/lottery')) return 'lottery';

  return '';
};

export const getLifeSubNavItems = (pathname: string) => {
  const moduleKey = getLifeModuleKeyByPath(pathname);
  return moduleKey ? lifeSubNavItems[moduleKey] : [];
};

export const getLifeActiveSubNavPath = (pathname: string) => {
  const canonicalPath = getCanonicalLifePath(pathname);
  if (canonicalPath === '/') return '/lottery';
  if (canonicalPath === '/lottery/statistics') return '/lottery/statistics?tab=frequency';
  if (canonicalPath === '/lottery/analysis') return '/lottery/analysis?tab=illusion';
  return canonicalPath;
};

export const getLifeSubNavAriaLabel = (pathname: string) => {
  const moduleKey = getLifeModuleKeyByPath(pathname);
  const labels: Record<LifeModuleKey, string> = {
    overview: '生活数据总览导航',
    vehicle: '车辆数据导航',
    finance: '财务数据导航',
    investment: '投资数据导航',
    lottery: '彩票数据导航',
    ai: 'AI 对话导航',
    connectors: '数据接入导航'
  };

  return moduleKey ? labels[moduleKey] : '模块导航';
};

export const integrationPrinciples = [
  {
    title: '先记录，再同步',
    description: '每个模块都保留手动记录能力，再逐步接入第三方 API。',
    icon: <SafetyCertificateOutlined />
  },
  {
    title: '先归一，再分析',
    description: '第三方字段进入统一数据模型后，再做趋势、预算和预测。',
    icon: <BarChartOutlined />
  },
  {
    title: '先本地，再自动',
    description: '敏感账户数据优先走本地后端和授权边界，自动化同步单独配置。',
    icon: <BankOutlined />
  },
  {
    title: '成本可追踪',
    description: '车辆、消费、投资和彩票都统一沉淀投入、收益和时间成本。',
    icon: <DollarOutlined />
  },
  {
    title: '能源可量化',
    description: '电耗、油耗、里程、充电站和车辆状态最终归为车辆能源模型。',
    icon: <ThunderboltOutlined />
  }
];
