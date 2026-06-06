import { useEffect, useRef, useState } from 'react';
import { Alert, Avatar, Button, Card, Input, Popconfirm, Space, Tag } from 'antd';
import {
  ApiOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  GithubOutlined,
  LinkOutlined,
  ReloadOutlined,
  SettingOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import { useAuth } from '../contexts/AuthContext';
import {
  teslaFleetApi,
  thirdPartyUserBindingApi,
  type TeslaFleetApiCache,
  type TeslaFleetTokenCache,
  type TeslaFleetTokenStatus,
  type ThirdPartyProvider,
  type ThirdPartyUserBinding
} from '../services/api';

const providers: Array<{
  provider: ThirdPartyProvider;
  title: string;
  description: string;
  bindPath?: string;
}> = [
  {
    provider: 'Tesla',
    title: 'Tesla',
    description: '车辆、充电、位置与 Fleet API 数据。',
    bindPath: '/vehicle/tesla'
  },
  {
    provider: 'GitHub',
    title: 'GitHub',
    description: '代码仓库、Issue、Pull Request 与开发身份。'
  }
];

const providerColor: Record<string, string> = {
  Tesla: '#e82127',
  GitHub: '#24292f'
};

const providerIcon = (provider: string) => {
  if (provider.toLowerCase() === 'github') return <GithubOutlined />;
  return <ApiOutlined />;
};

type EditableTokenField = 'access_token' | 'refresh_token';

const formatTimestamp = (value?: number) => {
  if (!value) return '未记录';
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
};

const buildThirdPartyAccountKey = (provider: string, userId?: string, username?: string) => {
  const owner = userId || username || 'anonymous';
  return `${provider}:${owner}`;
};

const isTeslaAccountKey = (value: string | null) => Boolean(value?.startsWith('Tesla:'));

const valueAsString = (data: Record<string, unknown> | undefined, keys: string[]) => {
  if (!data) return undefined;
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number') return String(value);
  }
  return undefined;
};

const unwrapTeslaResponse = (data: Record<string, unknown> | undefined) => {
  if (!data) return undefined;
  const response = data.response;
  if (response && typeof response === 'object' && !Array.isArray(response)) {
    return response as Record<string, unknown>;
  }
  return data;
};

const extractTeslaRegionInfo = (cache: TeslaFleetApiCache | null) => {
  const regionData = unwrapTeslaResponse(cache?.data);
  const region = valueAsString(regionData, ['region', 'user_region', 'country', 'country_code']);
  const apiBaseUrl = valueAsString(regionData, [
    'apiBaseUrl',
    'api_base_url',
    'fleetApiBaseUrl',
    'fleet_api_base_url',
    'base_url'
  ]);
  return { region, apiBaseUrl };
};

const PersonalSettingsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const teslaAccountKey = buildThirdPartyAccountKey('Tesla', user?.id, user?.username);
  const teslaCallbackRedirectUri = typeof window === 'undefined' ? '' : `${window.location.origin}/settings`;
  const handledTeslaCallbackRef = useRef('');
  const [bindings, setBindings] = useState<ThirdPartyUserBinding[]>([]);
  const [loading, setLoading] = useState(false);
  const [rebindLoading, setRebindLoading] = useState('');
  const [rebindUrls, setRebindUrls] = useState<Record<string, string>>({});
  const [visibleTokenPanels, setVisibleTokenPanels] = useState<Record<string, boolean>>({});
  const [teslaAuthCode, setTeslaAuthCode] = useState('');
  const [editingTokenField, setEditingTokenField] = useState<EditableTokenField | null>(null);
  const [editingTokenValue, setEditingTokenValue] = useState('');
  const [tokenStatus, setTokenStatus] = useState<TeslaFleetTokenStatus | null>(null);
  const [tokenCache, setTokenCache] = useState<TeslaFleetTokenCache | null>(null);
  const [teslaRegionCache, setTeslaRegionCache] = useState<TeslaFleetApiCache | null>(null);
  const [tokenLoading, setTokenLoading] = useState('');
  const [profileLoading, setProfileLoading] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const loadBindings = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const data = await thirdPartyUserBindingApi.findByLocalUserId(user.id);
      setBindings(data || []);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : '第三方账户绑定加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBindings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    if (code) {
      setTeslaAuthCode(code);
      setVisibleTokenPanels(prev => ({ ...prev, Tesla: true }));
    }
  }, [location.search]);

  const loadTeslaTokenStatus = async (accountKey = teslaAccountKey) => {
    setTokenLoading('status');
    setError('');
    try {
      const [status, storedToken] = await Promise.all([
        teslaFleetApi.tokenStatus(accountKey),
        teslaFleetApi.getStoredToken(accountKey)
      ]);
      setTokenStatus(status);
      setTokenCache(storedToken);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Tesla token 状态加载失败');
    } finally {
      setTokenLoading('');
    }
  };

  const loadTeslaRegionCache = async () => {
    try {
      const cache = await teslaFleetApi.getApiCache(teslaAccountKey, 'user-region', 'current');
      setTeslaRegionCache(cache);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Tesla 用户区域缓存读取失败');
    }
  };

  useEffect(() => {
    if (user?.id || user?.username) {
      loadTeslaTokenStatus();
      loadTeslaRegionCache();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teslaAccountKey]);

  const unbindAccount = async (id?: string) => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      await thirdPartyUserBindingApi.delete(id);
      await loadBindings();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : '第三方账户解除绑定失败');
      setLoading(false);
    }
  };

  const generateRebindUrl = async (binding: ThirdPartyUserBinding) => {
    if (binding.provider !== 'Tesla') {
      setError(`${binding.provider} 重新绑定暂未接入`);
      return;
    }
    if (visibleTokenPanels[binding.provider]) {
      setVisibleTokenPanels(prev => ({ ...prev, [binding.provider]: false }));
      return;
    }
    setRebindLoading(binding.provider);
    setError('');
    try {
      const url = await teslaFleetApi.authorizeUrl({
        state: binding.accountKey || `${binding.provider}:${user?.id || user?.username || 'anonymous'}`,
        redirectUri: teslaCallbackRedirectUri
      });
      setRebindUrls(prev => ({ ...prev, [binding.provider]: url }));
      setVisibleTokenPanels(prev => ({ ...prev, [binding.provider]: true }));
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : '第三方账户重新绑定链接生成失败');
    } finally {
      setRebindLoading('');
    }
  };

  const generateTeslaAuthUrl = async () => {
    setRebindLoading('Tesla');
    setError('');
    setSuccess('');
    try {
      const url = await teslaFleetApi.authorizeUrl({
        state: teslaAccountKey,
        redirectUri: teslaCallbackRedirectUri
      });
      setRebindUrls(prev => ({ ...prev, Tesla: url }));
      setVisibleTokenPanels(prev => ({ ...prev, Tesla: true }));
      setSuccess('Tesla 认证链接已生成');
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Tesla 认证链接生成失败');
    } finally {
      setRebindLoading('');
    }
  };

  const exchangeTeslaCode = async () => {
    const code = teslaAuthCode.trim();
    if (!code) {
      setError('请输入 Tesla 授权回调 code');
      return;
    }
    setTokenLoading('exchange');
    setError('');
    setSuccess('');
    try {
      await teslaFleetApi.exchangeAuthorizationCodeAndStore(teslaAccountKey, {
        code,
        redirectUri: teslaCallbackRedirectUri
      });
      setSuccess('Tesla token 与 refresh_token 已保存到 Redis');
      await loadTeslaTokenStatus();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Tesla code 换 token 失败');
    } finally {
      setTokenLoading('');
    }
  };

  const startTokenEdit = (field: EditableTokenField) => {
    setEditingTokenField(field);
    setEditingTokenValue('');
    setError('');
    setSuccess('');
  };

  const saveEditingTeslaToken = async () => {
    if (!editingTokenField) return;
    const tokenValue = editingTokenValue.trim();
    if (!tokenValue) {
      setError(`请输入 ${editingTokenField}`);
      return;
    }
    setTokenLoading(`manual-${editingTokenField}`);
    setError('');
    setSuccess('');
    try {
      await teslaFleetApi.saveToken(teslaAccountKey, {
        access_token: editingTokenField === 'access_token' ? tokenValue : undefined,
        refresh_token: editingTokenField === 'refresh_token' ? tokenValue : undefined,
        token_type: 'Bearer'
      });
      setSuccess(`${editingTokenField} 已保存到 Redis`);
      setEditingTokenField(null);
      setEditingTokenValue('');
      await loadTeslaTokenStatus();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : '保存 Tesla token 失败');
    } finally {
      setTokenLoading('');
    }
  };

  const refreshTeslaToken = async () => {
    setTokenLoading('refresh');
    setError('');
    setSuccess('');
    try {
      await teslaFleetApi.refreshStoredToken(teslaAccountKey);
      setSuccess('Tesla access_token 已刷新');
      await loadTeslaTokenStatus();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : '刷新 Tesla token 失败');
    } finally {
      setTokenLoading('');
    }
  };

  const saveTeslaUserBindingFromProfile = async (
    profileData: Record<string, unknown> | undefined,
    accountKey = teslaAccountKey
  ) => {
    const profile = unwrapTeslaResponse(profileData);
    const thirdPartyUserId = valueAsString(profile, ['vault_uuid', 'id', 'user_id', 'sub', 'email']);
    if (!profile || !thirdPartyUserId) {
      throw new Error('Tesla 用户信息缺少第三方 ID');
    }

    await thirdPartyUserBindingApi.saveOrUpdate({
      provider: 'Tesla',
      thirdPartyUserId,
      localUserId: user?.id,
      localUsername: user?.username,
      username: valueAsString(profile, ['username', 'name', 'full_name', 'email']),
      nickname: valueAsString(profile, ['display_name', 'nickname', 'full_name', 'name']),
      avatarUrl: valueAsString(profile, ['profile_image_url', 'avatar_url', 'picture']),
      email: valueAsString(profile, ['email']),
      accountKey,
      rawProfile: profile
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    if (!code || !teslaCallbackRedirectUri) return;

    const callbackKey = `${code}:${params.get('state') || ''}`;
    if (handledTeslaCallbackRef.current === callbackKey) return;

    const state = params.get('state');
    const callbackAccountKey = isTeslaAccountKey(state) ? state! : teslaAccountKey;
    if (!callbackAccountKey || callbackAccountKey.endsWith(':anonymous')) return;

    handledTeslaCallbackRef.current = callbackKey;
    setTokenLoading('exchange');
    setError('');
    setSuccess('');

    teslaFleetApi.exchangeAuthorizationCodeAndStore(callbackAccountKey, {
      code,
      redirectUri: teslaCallbackRedirectUri
    })
      .then(async () => {
        setTeslaAuthCode('');
        setSuccess('Tesla 授权已完成，token 已保存');
        await loadTeslaTokenStatus(callbackAccountKey);
        try {
          const profile = await teslaFleetApi.userMeWithStoredToken(callbackAccountKey);
          await saveTeslaUserBindingFromProfile(profile, callbackAccountKey);
          await loadBindings();
        } catch (caught: unknown) {
          setError(caught instanceof Error ? caught.message : 'Tesla token 已保存，但用户信息绑定失败');
        }
        const cleanPath = `${location.pathname}${location.hash}`;
        navigate(cleanPath, { replace: true });
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : 'Tesla code 换 token 失败');
      })
      .finally(() => {
        setTokenLoading('');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, teslaAccountKey, teslaCallbackRedirectUri]);

  const refreshTeslaUserProfile = async () => {
    setProfileLoading('user-me');
    setError('');
    setSuccess('');
    try {
      const profile = await teslaFleetApi.userMeWithStoredToken(teslaAccountKey);
      await saveTeslaUserBindingFromProfile(profile);
      await loadBindings();
      setSuccess('Tesla 用户信息已刷新');
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : '获取 Tesla 用户信息失败');
    } finally {
      setProfileLoading('');
    }
  };

  const refreshTeslaUserRegion = async () => {
    setProfileLoading('user-region');
    setError('');
    setSuccess('');
    try {
      const cache = await teslaFleetApi.refreshUserRegionCache(teslaAccountKey);
      setTeslaRegionCache(cache);
      setSuccess('Tesla 用户区域已获取并保存到 Redis');
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : '获取 Tesla 用户区域失败');
    } finally {
      setProfileLoading('');
    }
  };

  const teslaProfileResultPanel = (() => {
    const { region, apiBaseUrl } = extractTeslaRegionInfo(teslaRegionCache);

    return (
      <>
        {(region || apiBaseUrl || teslaRegionCache) && (
          <div className="tesla-manager-status-grid">
            <div>
              <span>Region</span>
              <strong>{region || '未返回'}</strong>
            </div>
            <div>
              <span>API Base URL</span>
              <strong>{apiBaseUrl || '未返回'}</strong>
            </div>
          </div>
        )}
      </>
    );
  })();

  const renderTeslaTokenPanel = (showProfileActions: boolean) => (
    <div className="third-party-token-panel">
      <div className="tesla-manager-status-grid">
        <div className="tesla-token-edit-card" onClick={() => startTokenEdit('access_token')}>
          <span>access_token</span>
          {editingTokenField === 'access_token' ? (
            <Input.Password
              autoFocus
              value={editingTokenValue}
              placeholder="输入 access_token，回车保存"
              onChange={event => setEditingTokenValue(event.target.value)}
              onClick={event => event.stopPropagation()}
              onKeyDown={event => {
                if (event.key === 'Escape') {
                  setEditingTokenField(null);
                  setEditingTokenValue('');
                }
              }}
              onPressEnter={saveEditingTeslaToken}
              autoComplete="off"
            />
          ) : (
            <Tag color={tokenCache?.token?.access_token ? 'success' : 'default'}>
              {tokenCache?.token?.access_token ? '已保存' : '未保存'}
            </Tag>
          )}
        </div>
        <div className="tesla-token-edit-card" onClick={() => startTokenEdit('refresh_token')}>
          <span>refresh_token</span>
          {editingTokenField === 'refresh_token' ? (
            <Input.Password
              autoFocus
              value={editingTokenValue}
              placeholder="输入 refresh_token，回车保存"
              onChange={event => setEditingTokenValue(event.target.value)}
              onClick={event => event.stopPropagation()}
              onKeyDown={event => {
                if (event.key === 'Escape') {
                  setEditingTokenField(null);
                  setEditingTokenValue('');
                }
              }}
              onPressEnter={saveEditingTeslaToken}
              autoComplete="off"
            />
          ) : (
            <Tag color={tokenCache?.token?.refresh_token ? 'success' : 'default'}>
              {tokenCache?.token?.refresh_token ? '已保存' : '未保存'}
            </Tag>
          )}
        </div>
        <div>
          <span>更新时间</span>
          <strong>{formatTimestamp(tokenStatus?.updatedAt)}</strong>
        </div>
        <div>
          <span>过期时间</span>
          <strong>{formatTimestamp(tokenStatus?.expiresAt)}</strong>
        </div>
      </div>
      <Space wrap>
        <Button loading={tokenLoading === 'refresh'} onClick={refreshTeslaToken}>
          刷新 token
        </Button>
        {showProfileActions && (
          <>
            <Button icon={<UserOutlined />} loading={profileLoading === 'user-me'} onClick={refreshTeslaUserProfile}>
              Tesla 用户信息
            </Button>
            <Button icon={<EnvironmentOutlined />} loading={profileLoading === 'user-region'} onClick={refreshTeslaUserRegion}>
              用户区域
            </Button>
          </>
        )}
      </Space>
      {rebindUrls.Tesla && (
        <div className="third-party-rebind-link">
          <Input.TextArea value={rebindUrls.Tesla} autoSize readOnly />
          <Space wrap>
            <Button href={rebindUrls.Tesla} target="_blank" icon={<LinkOutlined />}>
              打开链接
            </Button>
            <Button onClick={() => navigator.clipboard.writeText(rebindUrls.Tesla)}>
              复制链接
            </Button>
          </Space>
        </div>
      )}
      <div className="tesla-fleet-field">
        <span>授权回调 code</span>
        <Input
          value={teslaAuthCode}
          onChange={event => setTeslaAuthCode(event.target.value)}
          onPressEnter={exchangeTeslaCode}
        />
      </div>
    </div>
  );

  return (
    <LifePageShell
      className="personal-settings-page"
      eyebrow="个人设置"
      title="管理当前用户资料与第三方账户绑定。"
      actions={
        <Button icon={<ReloadOutlined />} loading={loading} onClick={loadBindings}>
          刷新
        </Button>
      }
    >
      {error && <Alert className="tesla-fleet-alert" type="error" showIcon message={error} />}
      {success && <Alert className="tesla-fleet-alert" type="success" showIcon message={success} />}

      <section className="personal-settings-layout">
        <Card className="life-panel-card">
          <div className="life-panel-title-row">
            <h2>当前用户</h2>
            <SettingOutlined />
          </div>
          <div className="personal-user-card">
            <Avatar size={48}>{user?.username?.charAt(0)?.toUpperCase() || '?'}</Avatar>
            <div>
              <strong>{user?.username || '未登录'}</strong>
              <span>{user?.email || user?.phone || user?.id}</span>
            </div>
          </div>
        </Card>

        <Card className="life-panel-card">
          <div className="life-panel-title-row">
            <h2>第三方账户绑定</h2>
            <Tag color={bindings.length > 0 ? 'success' : 'default'}>{bindings.length}</Tag>
          </div>

          <div className="third-party-binding-list">
            {providers.map(item => {
              const binding = bindings.find(candidate => candidate.provider === item.provider);
              if (!binding) {
                return (
                  <div key={item.provider} className="third-party-binding-item third-party-binding-empty">
                    <Avatar
                      size={44}
                      style={{ backgroundColor: providerColor[item.provider] || '#1677ff' }}
                      icon={providerIcon(item.provider)}
                    />
                    <div className="third-party-binding-main">
                      <div className="third-party-binding-title">
                        <strong>{item.title}</strong>
                        <Tag>未绑定</Tag>
                      </div>
                      <div className="third-party-binding-meta">
                        <span>{item.description}</span>
                      </div>
                      {item.provider === 'Tesla' && visibleTokenPanels.Tesla && renderTeslaTokenPanel(true)}
                      {item.provider === 'Tesla' && teslaProfileResultPanel}
                    </div>
                    {item.provider === 'Tesla' ? (
                      <Button
                        icon={<LinkOutlined />}
                        type="primary"
                        loading={rebindLoading === 'Tesla'}
                        onClick={generateTeslaAuthUrl}
                      >
                        去绑定
                      </Button>
                    ) : item.bindPath ? (
                      <Button icon={<LinkOutlined />} type="primary" onClick={() => navigate(item.bindPath!)}>
                        去绑定
                      </Button>
                    ) : (
                      <Button icon={<LinkOutlined />} disabled>
                        待接入
                      </Button>
                    )}
                  </div>
                );
              }

              const bindingTitle = binding.nickname || binding.username || binding.thirdPartyUserId;

              return (
                <div key={binding.id || `${binding.provider}-${binding.thirdPartyUserId}`} className="third-party-binding-item">
                  <Avatar
                    size={44}
                    style={{ backgroundColor: providerColor[binding.provider] || '#1677ff' }}
                    icon={providerIcon(binding.provider)}
                  />
                  <div className="third-party-binding-main">
                    <div className="third-party-binding-title">
                      <div className="third-party-binding-title-main">
                        {binding.avatarUrl && <Avatar size={24} src={binding.avatarUrl} />}
                        <strong>{bindingTitle}</strong>
                        <Tag color={providerColor[binding.provider] || 'processing'}>{binding.provider}</Tag>
                      </div>
                      <div className="third-party-binding-actions">
                        {binding.provider === 'Tesla' && (
                          <>
                            <Button icon={<UserOutlined />} loading={profileLoading === 'user-me'} onClick={refreshTeslaUserProfile}>
                              用户信息
                            </Button>
                            <Button icon={<EnvironmentOutlined />} loading={profileLoading === 'user-region'} onClick={refreshTeslaUserRegion}>
                              用户区域
                            </Button>
                          </>
                        )}
                        <Button
                          icon={<LinkOutlined />}
                          loading={rebindLoading === binding.provider}
                          onClick={() => generateRebindUrl(binding)}
                        >
                          重新绑定
                        </Button>
                        <Popconfirm title="解除这个绑定？" onConfirm={() => unbindAccount(binding.id)}>
                          <Button icon={<DeleteOutlined />} danger>
                            解除绑定
                          </Button>
                        </Popconfirm>
                      </div>
                    </div>
                    <div className="tesla-manager-status-grid">
                      <div>
                        <span>第三方 ID</span>
                        <strong>{binding.thirdPartyUserId}</strong>
                      </div>
                      {binding.username && binding.username !== bindingTitle && (
                        <div>
                          <span>用户名</span>
                          <strong>{binding.username}</strong>
                        </div>
                      )}
                      <div>
                        <span>邮箱</span>
                        <strong>{binding.email || '未返回'}</strong>
                      </div>
                    </div>
                    {binding.provider === 'Tesla' && visibleTokenPanels.Tesla && renderTeslaTokenPanel(false)}
                    {binding.provider === 'Tesla' && teslaProfileResultPanel}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </LifePageShell>
  );
};

export default PersonalSettingsPage;
