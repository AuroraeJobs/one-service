import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Alert, Button, Card, Input, Space, Tag } from 'antd';
import {
  ApiOutlined,
  ArrowRightOutlined,
  CarOutlined,
  CheckCircleFilled,
  CloudSyncOutlined,
  LinkOutlined,
  LockOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import {
  getLifeModuleDataSources,
  getLifeModuleTitle,
  getLifeStatusText,
  integrationPrinciples,
  lifeDataModules,
  type LifeModuleStatus
} from '../constants/lifeDataModules';
import {
  teslaFleetApi,
  type TeslaFleetTokenResponse,
  type TeslaVehicle,
  type TeslaVehicleListResponse
} from '../services/api';

const statusColor: Record<LifeModuleStatus, string> = {
  live: 'success',
  partial: 'processing',
  planned: 'default'
};

const connectorRoadmap = [
  {
    title: '车辆接口',
    accent: '#0071e3',
    items: ['Tesla Fleet API', '充电平台账单', '油车加油记录', '里程与能耗']
  },
  {
    title: '资金账户',
    accent: '#34c759',
    items: ['支付宝账单', '微信支付账单', '银行流水', '信用卡账单']
  },
  {
    title: '投资资产',
    accent: '#5856d6',
    items: ['券商持仓', '基金账户', '市场行情', '收益归因']
  },
  {
    title: '彩票账户',
    accent: '#ff3b30',
    items: ['开奖同步', '下注记录', '中奖核验', '投入产出']
  }
];

const connectorRoadmapEn = [
  {
    title: 'Vehicle Interfaces',
    accent: '#0071e3',
    items: ['Tesla Fleet API', 'Charging platform bills', 'Fuel records', 'Mileage and energy use']
  },
  {
    title: 'Financial Accounts',
    accent: '#34c759',
    items: ['Alipay bills', 'WeChat Pay bills', 'Bank transactions', 'Credit card bills']
  },
  {
    title: 'Investment Assets',
    accent: '#5856d6',
    items: ['Brokerage positions', 'Fund accounts', 'Market quotes', 'Return attribution']
  },
  {
    title: 'Lottery Account',
    accent: '#ff3b30',
    items: ['Draw sync', 'Ticket records', 'Prize verification', 'Cost and return']
  }
];

const LifeDataConnectionsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, isEnglish } = useAppPreferences();
  const defaultTeslaRedirectUri = typeof window === 'undefined' ? '' : `${window.location.origin}/connections`;
  const defaultTeslaDomain = typeof window === 'undefined' ? '' : window.location.hostname;
  const [teslaDomain, setTeslaDomain] = useState(defaultTeslaDomain);
  const [teslaRedirectUri, setTeslaRedirectUri] = useState(defaultTeslaRedirectUri);
  const [teslaAuthorizeUrl, setTeslaAuthorizeUrl] = useState('');
  const [teslaAuthCode, setTeslaAuthCode] = useState('');
  const [teslaPartnerToken, setTeslaPartnerToken] = useState('');
  const [teslaAccessToken, setTeslaAccessToken] = useState('');
  const [teslaRefreshToken, setTeslaRefreshToken] = useState('');
  const [teslaPartnerLoading, setTeslaPartnerLoading] = useState(false);
  const [teslaRegisterLoading, setTeslaRegisterLoading] = useState(false);
  const [teslaPublicKeyLoading, setTeslaPublicKeyLoading] = useState(false);
  const [teslaAuthLoading, setTeslaAuthLoading] = useState(false);
  const [teslaTokenLoading, setTeslaTokenLoading] = useState(false);
  const [teslaLoading, setTeslaLoading] = useState(false);
  const [teslaError, setTeslaError] = useState('');
  const [teslaPartnerResult, setTeslaPartnerResult] = useState<Record<string, unknown> | null>(null);
  const [teslaTokenResult, setTeslaTokenResult] = useState<TeslaFleetTokenResponse | null>(null);
  const [teslaResult, setTeslaResult] = useState<TeslaVehicleListResponse | null>(null);

  const teslaVehicles = useMemo<TeslaVehicle[]>(() => {
    return Array.isArray(teslaResult?.response) ? teslaResult.response : [];
  }, [teslaResult]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    if (code) {
      setTeslaAuthCode(code);
    }
  }, [location.search]);

  const createTeslaAuthorizeUrl = async () => {
    setTeslaAuthLoading(true);
    setTeslaError('');
    try {
      const url = await teslaFleetApi.authorizeUrl({
        redirectUri: teslaRedirectUri,
        state: crypto.randomUUID()
      });
      setTeslaAuthorizeUrl(url);
    } catch (error: unknown) {
      setTeslaError(error instanceof Error ? error.message : (isEnglish ? 'Failed to generate Tesla authorization URL' : 'Tesla 授权链接生成失败'));
    } finally {
      setTeslaAuthLoading(false);
    }
  };

  const exchangeTeslaToken = async () => {
    const code = teslaAuthCode.trim();
    if (!code) {
      setTeslaError(isEnglish ? 'Enter the Tesla authorization callback code' : '请输入 Tesla 授权回调 code');
      return;
    }

    setTeslaTokenLoading(true);
    setTeslaError('');
    try {
      const result = await teslaFleetApi.exchangeAuthorizationCode({
        code,
        redirectUri: teslaRedirectUri
      });
      setTeslaTokenResult(result);
      if (result.access_token) {
        setTeslaAccessToken(result.access_token);
      }
      if (result.refresh_token) {
        setTeslaRefreshToken(result.refresh_token);
      }
    } catch (error: unknown) {
      setTeslaError(error instanceof Error ? error.message : (isEnglish ? 'Failed to get Tesla access token' : 'Tesla access token 获取失败'));
    } finally {
      setTeslaTokenLoading(false);
    }
  };

  const createTeslaPartnerToken = async () => {
    setTeslaPartnerLoading(true);
    setTeslaError('');
    try {
      const result = await teslaFleetApi.partnerToken();
      if (result.access_token) {
        setTeslaPartnerToken(result.access_token);
      }
      setTeslaPartnerResult(result as unknown as Record<string, unknown>);
    } catch (error: unknown) {
      setTeslaError(error instanceof Error ? error.message : (isEnglish ? 'Failed to get Tesla partner token' : 'Tesla partner token 获取失败'));
    } finally {
      setTeslaPartnerLoading(false);
    }
  };

  const registerTeslaPartnerAccount = async () => {
    const domain = teslaDomain.trim();
    const token = teslaPartnerToken.trim();
    if (!domain) {
      setTeslaError(isEnglish ? 'Enter the Tesla partner registration domain' : '请输入 Tesla partner 注册域名');
      return;
    }
    if (!token) {
      setTeslaError(isEnglish ? 'Get or enter the Tesla partner token first' : '请先获取或填写 Tesla partner token');
      return;
    }

    setTeslaRegisterLoading(true);
    setTeslaError('');
    try {
      const result = await teslaFleetApi.registerPartnerAccount(token, domain);
      setTeslaPartnerResult(result);
    } catch (error: unknown) {
      setTeslaError(error instanceof Error ? error.message : (isEnglish ? 'Failed to register Tesla partner account' : 'Tesla partner account 注册失败'));
    } finally {
      setTeslaRegisterLoading(false);
    }
  };

  const checkTeslaPublicKey = async () => {
    const domain = teslaDomain.trim();
    const token = teslaPartnerToken.trim();
    if (!domain) {
      setTeslaError(isEnglish ? 'Enter the Tesla partner registration domain' : '请输入 Tesla partner 注册域名');
      return;
    }
    if (!token) {
      setTeslaError(isEnglish ? 'Get or enter the Tesla partner token first' : '请先获取或填写 Tesla partner token');
      return;
    }

    setTeslaPublicKeyLoading(true);
    setTeslaError('');
    try {
      const result = await teslaFleetApi.getPartnerPublicKey(token, domain);
      setTeslaPartnerResult(result);
    } catch (error: unknown) {
      setTeslaError(error instanceof Error ? error.message : (isEnglish ? 'Failed to validate Tesla public key' : 'Tesla public key 校验失败'));
    } finally {
      setTeslaPublicKeyLoading(false);
    }
  };

  const testTeslaVehicles = async () => {
    const token = teslaAccessToken.trim();
    if (!token) {
      setTeslaError(isEnglish ? 'Enter the Tesla access token' : '请输入 Tesla access token');
      setTeslaResult(null);
      return;
    }

    setTeslaLoading(true);
    setTeslaError('');
    try {
      const result = await teslaFleetApi.listVehicles(token);
      setTeslaResult(result);
    } catch (error: unknown) {
      setTeslaResult(null);
      setTeslaError(error instanceof Error ? error.message : (isEnglish ? 'Failed to get Tesla vehicle information' : 'Tesla 车辆信息获取失败'));
    } finally {
      setTeslaLoading(false);
    }
  };

  return (
    <LifePageShell
      className="life-connections-page"
      eyebrow={isEnglish ? 'Data Connections' : '数据接入'}
      title={isEnglish
        ? 'All life data sources enter one unified model before analysis and decisions.'
        : '所有生活数据源都先进入统一模型，再进入分析和决策。'}
      actions={
        <Button type="primary" icon={<CloudSyncOutlined />} onClick={() => navigate('/')}>
          {isEnglish ? 'Back to Overview' : '回到总览'}
        </Button>
      }
    >
      <section className="life-principle-grid">
        {integrationPrinciples.map(principle => (
          <Card key={principle.title} className="life-principle-card">
            <span>{principle.icon}</span>
            <h2>{isEnglish ? principle.titleEn : principle.title}</h2>
            <p>{isEnglish ? principle.descriptionEn : principle.description}</p>
          </Card>
        ))}
      </section>

      <section className="life-two-column">
        <Card className="life-panel-card">
          <div className="life-panel-title-row">
            <h2>{isEnglish ? 'Module Connection Status' : '模块接入状态'}</h2>
            <ApiOutlined />
          </div>
          <div className="life-connection-list">
            {lifeDataModules.map(module => (
              <button
                key={module.id}
                type="button"
                onClick={() => navigate(module.path)}
                style={{ '--life-module-accent': module.accent } as CSSProperties}
              >
                <span className="life-module-icon">
                  {module.icon}
                </span>
                <div>
                  <strong>{getLifeModuleTitle(module, language)}</strong>
                  <small>{getLifeModuleDataSources(module, language).join(' / ')}</small>
                </div>
                <Tag color={statusColor[module.status]}>{getLifeStatusText(module.status, language)}</Tag>
              </button>
            ))}
          </div>
        </Card>

        <Card className="life-panel-card">
          <div className="life-panel-title-row">
            <h2>{isEnglish ? 'Authorization Boundaries' : '授权边界'}</h2>
            <LockOutlined />
          </div>
          <div className="life-privacy-stack">
            <div>
              <CheckCircleFilled />
              <span>{isEnglish ? 'Account authorization and data sync stay separate; connect read-only data first.' : '账户授权与数据同步分离，先接入只读数据。'}</span>
            </div>
            <div>
              <CheckCircleFilled />
              <span>{isEnglish ? 'Raw transactions keep source and timestamps; categorization results are stored separately.' : '原始流水保留来源和时间戳，分类结果单独存储。'}</span>
            </div>
            <div>
              <CheckCircleFilled />
              <span>{isEnglish ? 'Third-party secrets never enter the frontend; backend connectors manage them centrally.' : '第三方密钥不进入前端，统一由后端连接器托管。'}</span>
            </div>
          </div>
        </Card>
      </section>

      <section className="tesla-fleet-test-panel">
        <Card className="life-panel-card">
          <div className="life-panel-title-row">
            <h2>{isEnglish ? 'Tesla Fleet API Test' : 'Tesla Fleet API 测试'}</h2>
            <CarOutlined />
          </div>
          <div className="tesla-fleet-partner-panel">
            <div className="tesla-fleet-field">
              <span>{isEnglish ? 'Partner Domain' : 'Partner 注册域名'}</span>
              <Input
                value={teslaDomain}
                onChange={event => setTeslaDomain(event.target.value)}
                placeholder={isEnglish ? 'Example: example.com, must match Tesla allowed_origins root domain' : '例如 example.com，需匹配 Tesla allowed_origins 根域'}
              />
            </div>
            <Input.Password
              value={teslaPartnerToken}
              onChange={event => setTeslaPartnerToken(event.target.value)}
              placeholder={isEnglish ? 'Tesla partner token, can be generated automatically' : 'Tesla partner token，可点击生成后自动填入'}
              autoComplete="off"
            />
            <Space wrap>
              <Button loading={teslaPartnerLoading} onClick={createTeslaPartnerToken}>
                {isEnglish ? 'Generate Partner Token' : '生成 partner token'}
              </Button>
              <Button type="primary" loading={teslaRegisterLoading} onClick={registerTeslaPartnerAccount}>
                {isEnglish ? 'Register Partner' : '注册 Partner'}
              </Button>
              <Button loading={teslaPublicKeyLoading} onClick={checkTeslaPublicKey}>
                {isEnglish ? 'Check Public Key' : '校验公钥'}
              </Button>
            </Space>
            {teslaPartnerResult && (
              <details className="tesla-fleet-json">
                <summary>{isEnglish ? 'Partner Response' : 'Partner 响应'}</summary>
                <pre>{JSON.stringify(teslaPartnerResult, null, 2)}</pre>
              </details>
            )}
          </div>

          <div className="tesla-fleet-auth-grid">
            <div className="tesla-fleet-field">
              <span>{isEnglish ? 'Redirect URI' : '回调地址'}</span>
              <Input
                value={teslaRedirectUri}
                onChange={event => setTeslaRedirectUri(event.target.value)}
                placeholder="Tesla OAuth redirect_uri"
              />
            </div>
            <Button
              type="primary"
              icon={<LinkOutlined />}
              loading={teslaAuthLoading}
              onClick={createTeslaAuthorizeUrl}
            >
              {isEnglish ? 'Generate Authorization Link' : '生成授权链接'}
            </Button>
          </div>

          {teslaAuthorizeUrl && (
            <div className="tesla-fleet-auth-link">
              <Input.TextArea value={teslaAuthorizeUrl} autoSize readOnly />
              <Space wrap>
                <Button href={teslaAuthorizeUrl} target="_blank" icon={<LinkOutlined />}>
                  {isEnglish ? 'Open Authorization' : '打开授权'}
                </Button>
                <Button onClick={() => navigator.clipboard.writeText(teslaAuthorizeUrl)}>
                  {isEnglish ? 'Copy Link' : '复制链接'}
                </Button>
              </Space>
            </div>
          )}

          <div className="tesla-fleet-token-grid">
            <div className="tesla-fleet-field">
              <span>{isEnglish ? 'Authorization Callback Code' : '授权回调 code'}</span>
              <Input
                value={teslaAuthCode}
                onChange={event => setTeslaAuthCode(event.target.value)}
                placeholder={isEnglish ? 'Code from the Tesla callback URL after authorization' : 'Tesla 授权后回调 URL 中的 code'}
              />
            </div>
            <Button
              icon={<ReloadOutlined />}
              loading={teslaTokenLoading}
              onClick={exchangeTeslaToken}
            >
              {isEnglish ? 'Exchange Token' : '换取 token'}
            </Button>
          </div>

          {teslaTokenResult?.access_token && (
            <Alert
              className="tesla-fleet-alert"
              type="success"
              showIcon
              message={isEnglish ? 'access_token acquired and filled into the test input below' : 'access_token 已获取，并已自动填入下方测试输入框'}
            />
          )}

          <div className="tesla-fleet-form">
            <Input.Password
              value={teslaAccessToken}
              onChange={event => setTeslaAccessToken(event.target.value)}
              placeholder="Tesla access token"
              autoComplete="off"
            />
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              loading={teslaLoading}
              onClick={testTeslaVehicles}
            >
              {isEnglish ? 'Get Vehicles' : '获取车辆'}
            </Button>
          </div>

          {teslaRefreshToken && (
            <details className="tesla-fleet-token-detail">
              <summary>refresh_token</summary>
              <pre>{teslaRefreshToken}</pre>
            </details>
          )}

          {teslaError && (
            <Alert className="tesla-fleet-alert" type="error" showIcon message={teslaError} />
          )}

          {teslaResult && (
            <div className="tesla-fleet-result">
              <div className="tesla-fleet-summary">
                <strong>{isEnglish ? 'Vehicle Count' : '车辆数量'}</strong>
                <Tag color={teslaVehicles.length > 0 ? 'success' : 'default'}>
                  {teslaResult.count ?? teslaVehicles.length}
                </Tag>
              </div>

              {teslaVehicles.length > 0 && (
                <div className="tesla-fleet-vehicle-list">
                  {teslaVehicles.map(vehicle => (
                    <div key={vehicle.vin || vehicle.id || vehicle.vehicle_id} className="tesla-fleet-vehicle">
                      <div>
                        <strong>{vehicle.display_name || (isEnglish ? 'Unnamed vehicle' : '未命名车辆')}</strong>
                        <span>{vehicle.vin || (isEnglish ? 'VIN not returned' : 'VIN 未返回')}</span>
                      </div>
                      <Tag color={vehicle.state === 'online' ? 'success' : 'processing'}>
                        {vehicle.state || 'unknown'}
                      </Tag>
                    </div>
                  ))}
                </div>
              )}

              <details className="tesla-fleet-json">
                <summary>{isEnglish ? 'Raw Response' : '原始响应'}</summary>
                <pre>{JSON.stringify(teslaResult, null, 2)}</pre>
              </details>
            </div>
          )}
        </Card>
      </section>

      <section className="life-roadmap-grid">
        {(isEnglish ? connectorRoadmapEn : connectorRoadmap).map(group => (
          <Card key={group.title} className="life-roadmap-card">
            <div className="life-roadmap-card-head">
              <h2>{group.title}</h2>
              <ArrowRightOutlined style={{ color: group.accent }} />
            </div>
            <div className="life-chip-row">
              {group.items.map(item => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </Card>
        ))}
      </section>
    </LifePageShell>
  );
};

export default LifeDataConnectionsPage;
