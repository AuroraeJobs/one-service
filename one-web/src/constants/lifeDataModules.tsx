import {
  AlipayOutlined,
  ApiOutlined,
  AppleOutlined,
  AppstoreOutlined,
  AuditOutlined,
  BankOutlined,
  BarChartOutlined,
  BellOutlined,
  BranchesOutlined,
  CalendarOutlined,
  CarOutlined,
  ClockCircleOutlined,
  ChromeOutlined,
  CompassOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DotChartOutlined,
  DollarOutlined,
  DownloadOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  GlobalOutlined,
  HistoryOutlined,
  LineChartOutlined,
  MessageOutlined,
  OpenAIOutlined,
  PieChartOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  StockOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  UserOutlined,
  WalletOutlined,
  WechatOutlined
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import TeslaIcon from '../components/TeslaIcon';
import { translateForLanguage } from '../i18n/registry';
import { resolveLocalizedText } from '../i18n/resolveLocalizedText';
import type { AppLanguage } from '../types/appPreferences';

export type LifeModuleStatus = 'live' | 'partial' | 'planned';
export type LifeModuleKey = 'overview' | 'vehicle' | 'finance' | 'investment' | 'lottery' | 'ai' | 'wechat' | 'connectors';

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
  labelEn?: string;
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

type LifeModuleEnglishText = {
  title: string;
  shortTitle?: string;
  description: string;
  liveCapabilities: string[];
  plannedCapabilities: string[];
  dataSources: string[];
};

export const lifeDataModules: LifeDataModule[] = [
  {
    id: 'vehicle',
    title: '车辆能源',
    shortTitle: 'Tesla',
    description: '统一管理油车加油、电车充电、充电站和车辆接口数据。',
    path: '/vehicle/charging',
    status: 'partial',
    accent: '#e82127',
    icon: <TeslaIcon />,
    liveCapabilities: ['电车充电记录', '充电站管理', '充电成本统计'],
    plannedCapabilities: ['油车加油管理', 'Tesla Fleet API', '车辆里程与电耗趋势'],
    dataSources: ['手动记录', '充电站数据', 'Tesla Fleet API', '加油票据']
  },
  {
    id: 'finance',
    title: '收入与现金流',
    shortTitle: '支付宝',
    description: '跟踪工资、五险一金、税费、日常收支和账户流水。',
    path: '/finance/salary',
    status: 'partial',
    accent: '#1677ff',
    icon: <AlipayOutlined />,
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
    accent: '#ff3b30',
    icon: <ChromeOutlined />,
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
    accent: '#ffcc00',
    icon: <AppleOutlined />,
    liveCapabilities: ['历史开奖同步', '号码预测', '红蓝球统计', '趋势分析', '卦象视图'],
    plannedCapabilities: ['个人下注记录', '中奖记录', '投入产出统计'],
    dataSources: ['开奖记录接口', '手动下注记录', '中奖核验数据']
  },
  {
    id: 'ai',
    title: 'OpenAI',
    shortTitle: 'OpenAI',
    description: '统一管理模型对话、MiniGPT 学习实验、托管训练管理和模型运行观测。',
    path: '/ai/chat',
    status: 'partial',
    accent: '#00c7be',
    icon: <OpenAIOutlined />,
    liveCapabilities: ['模型切换', '上下文对话', 'MiniGPT 实验观察', 'OpenAI 训练管理学习台', '本地模型接入'],
    plannedCapabilities: ['Spring AI 深度编排', '工具调用', '对话复盘', '训练任务 API 接入'],
    dataSources: ['LocalAI/Ollama', 'DeepSeek', 'Spring AI OpenAI 兼容配置', 'MiniGPT Mongo 实验日志', 'OpenAI fine-tuning 管理对象']
  },
  {
    id: 'wechat',
    title: '微信公众号',
    shortTitle: '微信',
    description: '管理公众号写稿、发布规划、草稿箱和已发布文章。',
    path: '/wechat',
    status: 'partial',
    accent: '#07c160',
    icon: <WechatOutlined />,
    liveCapabilities: ['写稿', '发布规划', '草稿箱', '已发布文章'],
    plannedCapabilities: ['素材管理', '发布复盘', '数据看板'],
    dataSources: ['微信公众号 API', '本地文章与封面路径', '发布计划']
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

const lifeModuleEnglish: Record<string, LifeModuleEnglishText> = {
  vehicle: {
    title: 'Vehicle Energy',
    shortTitle: 'Tesla',
    description: 'Manage fuel records, EV charging, charging stations, and vehicle interface data in one place.',
    liveCapabilities: ['EV charging records', 'Charging station management', 'Charging cost statistics'],
    plannedCapabilities: ['Fuel records', 'Tesla Fleet API', 'Mileage and energy trends'],
    dataSources: ['Manual records', 'Charging station data', 'Tesla Fleet API', 'Fuel receipts']
  },
  finance: {
    title: 'Income and Cash Flow',
    shortTitle: 'Alipay',
    description: 'Track salary, social insurance, tax, daily expenses, and account transactions.',
    liveCapabilities: ['Salary records', 'Social insurance', 'Tax and net income statistics'],
    plannedCapabilities: ['Alipay and WeChat bills', 'Bank transactions', 'Budgets and ledgers'],
    dataSources: ['Manual salary records', 'Alipay bills', 'WeChat bills', 'Bank Open API']
  },
  investment: {
    title: 'Investment Assets',
    shortTitle: 'Stocks',
    description: 'Collect stock accounts, funds, cash assets, and market quotes.',
    liveCapabilities: [],
    plannedCapabilities: ['Position sync', 'Return attribution', 'Market quotes', 'Risk exposure'],
    dataSources: ['Brokerage accounts', 'Fund accounts', 'Market data', 'Custom assets']
  },
  lottery: {
    title: 'Lottery Research',
    shortTitle: 'Lottery',
    description: 'Manage Double Color Ball history, tickets, prize checks, and statistical models.',
    liveCapabilities: ['Draw history sync', 'Number prediction', 'Red and blue ball statistics', 'Trend analysis', 'Hexagram views'],
    plannedCapabilities: ['Personal tickets', 'Prize records', 'Cost and return tracking'],
    dataSources: ['Draw API', 'Manual ticket records', 'Prize verification data']
  },
  ai: {
    title: 'OpenAI',
    shortTitle: 'OpenAI',
    description: 'Manage model chat, MiniGPT learning experiments, hosted training, and model operations.',
    liveCapabilities: ['Model switching', 'Context chat', 'MiniGPT experiment tracking', 'OpenAI training console', 'Local model integration'],
    plannedCapabilities: ['Spring AI orchestration', 'Tool calls', 'Conversation review', 'Training task API integration'],
    dataSources: ['LocalAI/Ollama', 'DeepSeek', 'Spring AI OpenAI-compatible config', 'MiniGPT Mongo logs', 'OpenAI fine-tuning objects']
  },
  wechat: {
    title: 'WeChat Official Account',
    shortTitle: 'WeChat',
    description: 'Manage article drafting, publishing plans, drafts, and published posts.',
    liveCapabilities: ['Writing', 'Publishing plans', 'Draft box', 'Published articles'],
    plannedCapabilities: ['Asset management', 'Publishing review', 'Analytics dashboard'],
    dataSources: ['WeChat Official Account API', 'Local article and cover paths', 'Publishing plan']
  },
  accounts: {
    title: 'Accounts and Bills',
    shortTitle: 'Bills',
    description: 'Provide one entry point for Alipay, WeChat, bank card, and credit card bills.',
    liveCapabilities: [],
    plannedCapabilities: ['Account authorization', 'Bill import', 'Auto categorization', 'Cross-account reconciliation'],
    dataSources: ['Alipay', 'WeChat Pay', 'Bank cards', 'Credit cards']
  },
  connectors: {
    title: 'Data Connections',
    shortTitle: 'Connect',
    description: 'Manage connection status, sync strategy, and privacy boundaries for all life data sources.',
    liveCapabilities: ['Local API aggregation', 'Authenticated page protection'],
    plannedCapabilities: ['OAuth authorization', 'Sync jobs', 'Field mapping', 'Privacy audit'],
    dataSources: ['Backend API', 'Third-party authorization', 'File import', 'Manual entry']
  }
};

const legacyTextFallbacks: Record<string, (english?: string) => string | undefined> = {
  'en-US': english => english,
};

const translateLifeText = (
  source: string,
  language: AppLanguage,
  legacyEnglish?: string,
) => {
  // These module/nav strings already have curated English copy. Prefer it to
  // the phrase-level compatibility translator, which may only replace part of
  // a Chinese sentence (for example `首页` -> `首Page`). Other languages still
  // resolve entirely through their locale file.
  const curatedTranslation = legacyTextFallbacks[language]?.(legacyEnglish);
  const translated = translateForLanguage(language, source);
  return resolveLocalizedText({ source, translated, curatedTranslation });
};

const translateLifeTextList = (
  sources: string[],
  language: AppLanguage,
  legacyEnglish: string[] = [],
) => sources.map((source, index) => (
  translateLifeText(source, language, legacyEnglish[index])
));

export const getLifeModuleTitle = (module: LifeDataModule, language: AppLanguage) => (
  translateLifeText(module.title, language, lifeModuleEnglish[module.id]?.title)
);

export const getLifeModuleShortTitle = (module: LifeDataModule, language: AppLanguage) => (
  translateLifeText(module.shortTitle, language, lifeModuleEnglish[module.id]?.shortTitle)
);

export const getLifeModuleDescription = (module: LifeDataModule, language: AppLanguage) => (
  translateLifeText(module.description, language, lifeModuleEnglish[module.id]?.description)
);

export const getLifeModuleLiveCapabilities = (module: LifeDataModule, language: AppLanguage) => (
  translateLifeTextList(module.liveCapabilities, language, lifeModuleEnglish[module.id]?.liveCapabilities)
);

export const getLifeModulePlannedCapabilities = (module: LifeDataModule, language: AppLanguage) => (
  translateLifeTextList(module.plannedCapabilities, language, lifeModuleEnglish[module.id]?.plannedCapabilities)
);

export const getLifeModuleDataSources = (module: LifeDataModule, language: AppLanguage) => (
  translateLifeTextList(module.dataSources, language, lifeModuleEnglish[module.id]?.dataSources)
);

export const lifeNavItems: LifeNavItem[] = [
  { path: '/overview', key: 'overview', label: '首页', labelEn: 'Home', icon: <DashboardOutlined /> },
  { path: '/lottery', key: 'lottery', label: '彩票', labelEn: 'Lottery', icon: <AppleOutlined /> },
  { path: '/investments', key: 'investment', label: '股票', labelEn: 'Stocks', icon: <ChromeOutlined /> },
  { path: '/wechat', key: 'wechat', label: '微信', labelEn: 'WeChat', icon: <WechatOutlined /> },
  { path: '/finance/salary', key: 'finance', label: '支付宝', labelEn: 'Alipay', icon: <AlipayOutlined /> },
  { path: '/vehicle/charging', key: 'vehicle', label: 'Tesla', labelEn: 'Tesla', icon: <TeslaIcon /> },
  { path: '/ai/chat', key: 'ai', label: 'OpenAI', labelEn: 'OpenAI', icon: <OpenAIOutlined /> }
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
        { id: 'lottery-deep-analysis', moduleKey: 'lottery', path: '/lottery/deep-analysis', label: '深度', icon: <LineChartOutlined />, accent: '#ff3b30' },
        { id: 'lottery-prediction-decision', moduleKey: 'lottery', path: '/lottery/predictions/decision', label: '决策', icon: <SafetyCertificateOutlined />, accent: '#34c759' },
        { id: 'lottery-experiments', moduleKey: 'lottery', path: '/lottery/experiments', label: '实验', icon: <ExperimentOutlined />, accent: '#00c7be' },
        { id: 'lottery-backtests', moduleKey: 'lottery', path: '/lottery/backtests', label: '回测', icon: <BarChartOutlined />, accent: '#0071e3' },
        { id: 'lottery-research', moduleKey: 'lottery', path: '/lottery/research', label: '研究', icon: <PieChartOutlined />, accent: '#5856d6' },
        { id: 'lottery-strategy-portfolios', moduleKey: 'lottery', path: '/lottery/strategy-portfolios', label: '组合', icon: <AppstoreOutlined />, accent: '#00c7be' },
        { id: 'lottery-simulator', moduleKey: 'lottery', path: '/lottery/simulator', label: '沙盘', icon: <DotChartOutlined />, accent: '#ff3b30' },
        { id: 'lottery-research-notebook', moduleKey: 'lottery', path: '/lottery/research/notebook', label: '笔记', icon: <FileTextOutlined />, accent: '#5856d6' },
        { id: 'lottery-prediction-history', moduleKey: 'lottery', path: '/lottery/predictions/history', label: '历史', icon: <HistoryOutlined />, accent: '#5856d6' }
      ]
    },
    {
      id: 'lottery-execution',
      moduleKey: 'lottery',
      path: '/lottery/ticket-packs',
      label: '执行',
      icon: <SafetyCertificateOutlined />,
      accent: '#0071e3',
      children: [
        { id: 'lottery-ticket-packs', moduleKey: 'lottery', path: '/lottery/ticket-packs', label: '票包', icon: <SafetyCertificateOutlined />, accent: '#0071e3' },
        { id: 'lottery-tickets', moduleKey: 'lottery', path: '/lottery/tickets', label: '票据', icon: <FileTextOutlined />, accent: '#34c759' },
        { id: 'lottery-alerts', moduleKey: 'lottery', path: '/lottery/alerts', label: '提醒', icon: <BellOutlined />, accent: '#ff9500' },
        { id: 'lottery-month-end', moduleKey: 'lottery', path: '/lottery/month-end', label: '月末', icon: <CalendarOutlined />, accent: '#ff9500' },
        { id: 'lottery-ledger', moduleKey: 'lottery', path: '/lottery/ledger', label: '账本', icon: <PieChartOutlined />, accent: '#0071e3' }
      ]
    },
    {
      id: 'lottery-review',
      moduleKey: 'lottery',
      path: '/lottery/outcomes',
      label: '复盘',
      icon: <BranchesOutlined />,
      accent: '#34c759',
      children: [
        { id: 'lottery-outcomes', moduleKey: 'lottery', path: '/lottery/outcomes', label: '归因', icon: <BranchesOutlined />, accent: '#34c759' },
        { id: 'lottery-recommendations', moduleKey: 'lottery', path: '/lottery/recommendations', label: '推荐', icon: <CompassOutlined />, accent: '#ff9500' },
        { id: 'lottery-governance', moduleKey: 'lottery', path: '/lottery/governance', label: '治理', icon: <AuditOutlined />, accent: '#5856d6' },
        { id: 'lottery-exports', moduleKey: 'lottery', path: '/lottery/exports', label: '导出', icon: <DownloadOutlined />, accent: '#ff9500' }
      ]
    },
    {
      id: 'lottery-data',
      moduleKey: 'lottery',
      path: '/lottery/records',
      label: '数据',
      icon: <DatabaseOutlined />,
      accent: '#00c7be',
      children: [
        { id: 'lottery-records', moduleKey: 'lottery', path: '/lottery/records', label: '开奖', icon: <DatabaseOutlined />, accent: '#00c7be' },
        { id: 'lottery-sync', moduleKey: 'lottery', path: '/lottery/sync', label: '同步', icon: <SyncOutlined />, accent: '#00c7be' },
        { id: 'lottery-data-quality', moduleKey: 'lottery', path: '/lottery/data-quality', label: '质检', icon: <SafetyCertificateOutlined />, accent: '#34c759' },
        { id: 'lottery-statistics-frequency', moduleKey: 'lottery', path: '/lottery/statistics?tab=frequency', label: '频率', icon: <BarChartOutlined />, accent: '#0071e3' },
        { id: 'lottery-statistics-group', moduleKey: 'lottery', path: '/lottery/statistics?tab=group', label: '分组', icon: <DotChartOutlined />, accent: '#34c759' },
        { id: 'lottery-statistics-distribution', moduleKey: 'lottery', path: '/lottery/statistics?tab=distribution', label: '分布', icon: <LineChartOutlined />, accent: '#5856d6' },
        { id: 'lottery-astronauts', moduleKey: 'lottery', path: '/lottery/astronauts', label: '宇航员', icon: <UserOutlined />, accent: '#00c7be' }
      ]
    },
    {
      id: 'lottery-insights',
      moduleKey: 'lottery',
      path: '/lottery/analysis?tab=illusion',
      label: '图谱',
      icon: <ExperimentOutlined />,
      accent: '#5856d6',
      children: [
        { id: 'lottery-analysis-illusion', moduleKey: 'lottery', path: '/lottery/analysis?tab=illusion', label: '幻境', icon: <ExperimentOutlined />, accent: '#5856d6' },
        { id: 'lottery-analysis-planet', moduleKey: 'lottery', path: '/lottery/analysis?tab=planet', label: '星球', icon: <DotChartOutlined />, accent: '#722ed1' },
        { id: 'lottery-analysis-energy', moduleKey: 'lottery', path: '/lottery/analysis?tab=energy', label: '能量', icon: <ThunderboltOutlined />, accent: '#ff9500' },
        { id: 'lottery-analysis-accumulate', moduleKey: 'lottery', path: '/lottery/analysis?tab=accumulate', label: '累计', icon: <LineChartOutlined />, accent: '#34c759' },
        { id: 'lottery-analysis-collect', moduleKey: 'lottery', path: '/lottery/analysis?tab=collect', label: '集齐', icon: <DatabaseOutlined />, accent: '#00c7be' },
        { id: 'lottery-analysis-position', moduleKey: 'lottery', path: '/lottery/analysis?tab=position', label: '位置', icon: <BarChartOutlined />, accent: '#af52de' },
        { id: 'lottery-pixel-universe', moduleKey: 'lottery', path: '/lottery/pixel-universe', label: '宇宙', icon: <DotChartOutlined />, accent: '#ff3b30' },
        { id: 'lottery-pixel-card', moduleKey: 'lottery', path: '/lottery/pixel-card', label: '像素', icon: <DotChartOutlined />, accent: '#00c7be' },
        { id: 'lottery-pixel-stats', moduleKey: 'lottery', path: '/lottery/pixel-stats', label: '行列', icon: <BarChartOutlined />, accent: '#34c759' },
        { id: 'lottery-taiji', moduleKey: 'lottery', path: '/lottery/taiji', label: '太极', icon: <DotChartOutlined />, accent: '#722ed1' },
        { id: 'lottery-hexagram', moduleKey: 'lottery', path: '/lottery/hexagram', label: '卦象', icon: <ExperimentOutlined />, accent: '#ff9500' },
        { id: 'lottery-space', moduleKey: 'lottery', path: '/lottery/space', label: '太空', icon: <ExperimentOutlined />, accent: '#5856d6' },
        { id: 'lottery-parasite', moduleKey: 'lottery', path: '/lottery/parasite', label: '寄生草', icon: <GlobalOutlined />, accent: '#4caf50' },
        { id: 'lottery-dingfengbo', moduleKey: 'lottery', path: '/lottery/dingfengbo', label: '定风波', icon: <CompassOutlined />, accent: '#1890ff' },
        { id: 'lottery-autumn-beginning', moduleKey: 'lottery', path: '/lottery/autumn-beginning', label: '立秋', icon: <CalendarOutlined />, accent: '#ff9500' },
        { id: 'lottery-winter-beginning', moduleKey: 'lottery', path: '/lottery/winter-beginning', label: '立冬', icon: <ClockCircleOutlined />, accent: '#0071e3' }
      ]
    },
  ],
  ai: [
    { id: 'ai-chat', moduleKey: 'ai', path: '/ai/chat', label: 'ChatGPT', icon: <MessageOutlined />, accent: '#00c7be' },
    { id: 'ai-minigpt', moduleKey: 'ai', path: '/ai/minigpt', label: 'MiniGPT', icon: <ExperimentOutlined />, accent: '#5856d6' },
    { id: 'ai-training', moduleKey: 'ai', path: '/ai/training', label: '训练台', icon: <BranchesOutlined />, accent: '#0071e3' }
  ],
  wechat: [
    { id: 'wechat-write', moduleKey: 'wechat', path: '/wechat', label: '写稿', icon: <FileTextOutlined />, accent: '#0071e3' },
    { id: 'wechat-plans', moduleKey: 'wechat', path: '/wechat/plans', label: '规划', icon: <CalendarOutlined />, accent: '#ff9500' },
    { id: 'wechat-drafts', moduleKey: 'wechat', path: '/wechat/drafts', label: '草稿箱', icon: <DatabaseOutlined />, accent: '#00c7be' },
    { id: 'wechat-published', moduleKey: 'wechat', path: '/wechat/published', label: '已发布', icon: <HistoryOutlined />, accent: '#34c759' }
  ]
};

const lifeSubNavEnglishLabels: Record<string, string> = {
  'overview-home': 'Home',
  'investment-overview': 'Overview',
  'investment-watchlist': 'Watchlist',
  'investment-market': 'Market',
  'investment-positions': 'Positions',
  'investment-trades': 'Trades',
  'investment-klines': 'K-Line',
  'investment-alerts': 'Alerts',
  'investment-analysis': 'Analysis',
  'investment-sync': 'Sync',
  'investment-providers': 'Providers',
  'investment-settings': 'Settings',
  'connectors-overview': 'Connect',
  'vehicle-charging': 'Charging',
  'vehicle-stations': 'Stations',
  'vehicle-fleet': 'Vehicles',
  'finance-salary': 'Salary',
  'finance-expense': 'Expenses',
  'finance-accounts': 'Accounts',
  'finance-tax': 'Tax',
  'lottery-overview': 'Overview',
  'lottery-workbench': 'Workbench',
  'lottery-mobile': 'Mobile',
  'lottery-predictions': 'Predict',
  'lottery-prediction-current': 'Current',
  'lottery-deep-analysis': 'Deep',
  'lottery-prediction-decision': 'Decision',
  'lottery-experiments': 'Experiments',
  'lottery-backtests': 'Backtests',
  'lottery-research': 'Research',
  'lottery-strategy-portfolios': 'Portfolios',
  'lottery-simulator': 'Simulator',
  'lottery-research-notebook': 'Notes',
  'lottery-prediction-history': 'History',
  'lottery-execution': 'Execute',
  'lottery-ticket-packs': 'Packs',
  'lottery-tickets': 'Tickets',
  'lottery-alerts': 'Reminders',
  'lottery-month-end': 'Month End',
  'lottery-ledger': 'Ledger',
  'lottery-review': 'Review',
  'lottery-outcomes': 'Attribution',
  'lottery-recommendations': 'Recommend',
  'lottery-governance': 'Governance',
  'lottery-exports': 'Exports',
  'lottery-data': 'Data',
  'lottery-records': 'Draws',
  'lottery-sync': 'Sync',
  'lottery-data-quality': 'Quality',
  'lottery-statistics-frequency': 'Frequency',
  'lottery-statistics-group': 'Groups',
  'lottery-statistics-distribution': 'Distribution',
  'lottery-astronauts': 'Astronauts',
  'lottery-insights': 'Maps',
  'lottery-analysis-illusion': 'Illusion',
  'lottery-analysis-planet': 'Planet',
  'lottery-analysis-energy': 'Energy',
  'lottery-analysis-accumulate': 'Accumulated',
  'lottery-analysis-collect': 'Collect',
  'lottery-analysis-position': 'Position',
  'lottery-pixel-universe': 'Universe',
  'lottery-pixel-card': 'Pixels',
  'lottery-pixel-stats': 'Rows',
  'lottery-taiji': 'Taiji',
  'lottery-hexagram': 'Hexagram',
  'lottery-space': 'Space',
  'lottery-parasite': 'Parasite',
  'lottery-dingfengbo': 'Dingfengbo',
  'lottery-autumn-beginning': 'Autumn',
  'lottery-winter-beginning': 'Winter',
  'lottery-settings': 'Settings',
  'ai-chat': 'ChatGPT',
  'ai-minigpt': 'MiniGPT',
  'ai-training': 'Training',
  'wechat-write': 'Write',
  'wechat-plans': 'Plans',
  'wechat-drafts': 'Drafts',
  'wechat-published': 'Published'
};

export const getLifeItemLabel = (
  item: LifeNavItem | LifeSubNavItem,
  language: AppLanguage
) => {
  const legacyEnglish = 'labelEn' in item && item.labelEn
    ? item.labelEn
    : 'id' in item
      ? lifeSubNavEnglishLabels[item.id]
      : undefined;
  return translateLifeText(item.label, language, legacyEnglish);
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
  '/taiji': '/lottery/taiji',
  '/ai/wechat': '/wechat',
  '/ai/wechat/plans': '/wechat/plans',
  '/ai/wechat/drafts': '/wechat/drafts',
  '/ai/wechat/published': '/wechat/published'
};

const splitLifePath = (pathname: string) => {
  const queryIndex = pathname.indexOf('?');
  return queryIndex >= 0
    ? { basePath: pathname.slice(0, queryIndex), search: pathname.slice(queryIndex) }
    : { basePath: pathname, search: '' };
};

const lotteryOverviewOwnedPaths = new Set([
  '/lottery/workbench',
  '/lottery/mobile',
  '/lottery/settings'
]);

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
  if (canonicalPath.startsWith('/wechat')) return 'wechat';
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
  const { basePath } = splitLifePath(canonicalPath);
  if (canonicalPath === '/') return '/lottery';
  if (lotteryOverviewOwnedPaths.has(basePath)) return '/lottery';
  if (canonicalPath === '/lottery/statistics') return '/lottery/statistics?tab=frequency';
  if (canonicalPath === '/lottery/analysis') return '/lottery/analysis?tab=illusion';
  return canonicalPath;
};

export const getLifeSubNavAriaLabel = (pathname: string, language: AppLanguage = 'zh-CN') => {
  const moduleKey = getLifeModuleKeyByPath(pathname);
  const labels: Record<LifeModuleKey, { source: string; legacyEnglish: string }> = {
    overview: { source: '生活数据总览导航', legacyEnglish: 'Life data overview navigation' },
    vehicle: { source: '车辆数据导航', legacyEnglish: 'Vehicle data navigation' },
    finance: { source: '财务数据导航', legacyEnglish: 'Finance data navigation' },
    investment: { source: '投资数据导航', legacyEnglish: 'Investment data navigation' },
    lottery: { source: '彩票数据导航', legacyEnglish: 'Lottery data navigation' },
    ai: { source: 'AI 对话导航', legacyEnglish: 'AI navigation' },
    wechat: { source: '微信公众号导航', legacyEnglish: 'WeChat Official Account navigation' },
    connectors: { source: '数据接入导航', legacyEnglish: 'Data connection navigation' }
  };

  if (!moduleKey) return translateLifeText('模块导航', language, 'Module navigation');
  const label = labels[moduleKey];
  return translateLifeText(label.source, language, label.legacyEnglish);
};

export const lifeStatusText: Record<LifeModuleStatus, { zh: string; en: string }> = {
  live: { zh: '已运行', en: 'Live' },
  partial: { zh: '建设中', en: 'In Progress' },
  planned: { zh: '待接入', en: 'Planned' }
};

export const getLifeStatusText = (status: LifeModuleStatus, language: AppLanguage) => (
  translateLifeText(lifeStatusText[status].zh, language, lifeStatusText[status].en)
);

export const integrationPrinciples = [
  {
    title: '先记录，再同步',
    titleEn: 'Record First, Sync Later',
    description: '每个模块都保留手动记录能力，再逐步接入第三方 API。',
    descriptionEn: 'Every module keeps manual entry first, then gradually connects third-party APIs.',
    icon: <SafetyCertificateOutlined />
  },
  {
    title: '先归一，再分析',
    titleEn: 'Normalize Before Analysis',
    description: '第三方字段进入统一数据模型后，再做趋势、预算和预测。',
    descriptionEn: 'External fields enter a unified model before trends, budgets, and predictions are calculated.',
    icon: <BarChartOutlined />
  },
  {
    title: '先本地，再自动',
    titleEn: 'Local First, Then Automation',
    description: '敏感账户数据优先走本地后端和授权边界，自动化同步单独配置。',
    descriptionEn: 'Sensitive account data stays behind local backend and authorization boundaries before automation is enabled.',
    icon: <BankOutlined />
  },
  {
    title: '成本可追踪',
    titleEn: 'Track Every Cost',
    description: '车辆、消费、投资和彩票都统一沉淀投入、收益和时间成本。',
    descriptionEn: 'Vehicles, spending, investments, and lottery research share cost, return, and time tracking.',
    icon: <DollarOutlined />
  },
  {
    title: '能源可量化',
    titleEn: 'Quantify Energy',
    description: '电耗、油耗、里程、充电站和车辆状态最终归为车辆能源模型。',
    descriptionEn: 'Power use, fuel use, mileage, charging stations, and vehicle states roll up into a vehicle energy model.',
    icon: <ThunderboltOutlined />
  }
];
