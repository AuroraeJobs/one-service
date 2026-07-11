import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Avatar, Button, Card, Form, Input, Popconfirm, Space, Tag } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  GithubOutlined,
  LinkOutlined,
  ReloadOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import {
  authApi,
  teslaFleetApi,
  thirdPartyUserBindingApi,
  type TeslaFleetApiCache,
  type TeslaFleetTokenCache,
  type TeslaFleetTokenStatus,
  type ThirdPartyProvider,
  type ThirdPartyUserBinding
} from '../services/api';

const providerColor: Record<string, string> = {
  Tesla: '#e82127',
  GitHub: '#24292f'
};

const passwordPattern = /^[a-zA-Z][\w-]{7,29}$/;

type EditableTokenField = 'access_token' | 'refresh_token';

interface UserProfileFormValues {
  username: string;
  avatar?: string;
  email?: string;
  phone?: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const formatTimestamp = (value: number | undefined, fallback: string, locale: string) => {
  if (!value) return fallback;
  return new Date(value).toLocaleString(locale, { hour12: false });
};

const buildThirdPartyAccountKey = (provider: string, userId?: string, username?: string) => {
  const owner = userId || username || 'anonymous';
  return `${provider}:${owner}`;
};

const isTeslaAccountKey = (value: string | null) => Boolean(value?.startsWith('Tesla:'));
const isGitHubAccountKey = (value: string | null) => Boolean(value?.startsWith('GitHub:'));

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
  const { user, updateUser } = useAuth();
  const { t, language } = useI18n();
  const text = useMemo(() => ({
    teslaDescription: t('车辆、充电、位置与 Fleet API 数据。'),
    githubDescription: t('代码仓库、Issue、Pull Request 与开发身份。'),
    passwordRule: t('密码必须以字母开头，长度8-30位，仅支持字母、数字、下划线和短横线'),
    noRecord: t('未记录'),
    sessionExpired: t('登录状态已失效，请重新登录'),
    profileUpdated: t('用户信息已更新'),
    profileUpdateFailed: t('用户信息更新失败'),
    passwordUpdated: t('密码已更新'),
    passwordUpdateFailed: t('密码更新失败'),
    loadBindingsFailed: t('第三方账户绑定加载失败'),
    loadTeslaTokenFailed: t('Tesla token 状态加载失败'),
    loadTeslaRegionFailed: t('Tesla 用户区域缓存读取失败'),
    unbindFailed: t('第三方账户解除绑定失败'),
    rebindUrlFailed: t('第三方账户重新绑定链接生成失败'),
    teslaAuthUrlFailed: t('Tesla 认证链接生成失败'),
    enterTeslaCode: t('请输入 Tesla 授权回调 code'),
    teslaTokenSaved: t('Tesla token 与 refresh_token 已保存到 Redis'),
    teslaCodeExchangeFailed: t('Tesla code 换 token 失败'),
    enterField: (field: string) => t('请输入 {{field}}', { field }),
    fieldSaved: (field: string) => t('{{field}} 已保存到 Redis', { field }),
    saveTeslaTokenFailed: t('保存 Tesla token 失败'),
    teslaAccessTokenRefreshed: t('Tesla access_token 已刷新'),
    refreshTeslaTokenFailed: t('刷新 Tesla token 失败'),
    missingTeslaThirdPartyId: t('Tesla 用户信息缺少第三方 ID'),
    teslaAuthCompleted: t('Tesla 授权已完成，token 已保存'),
    teslaTokenSavedBindingFailed: t('Tesla token 已保存，但用户信息绑定失败'),
    githubBound: t('GitHub 账户已绑定'),
    githubBindFailed: t('GitHub 账户绑定失败'),
    teslaProfileRefreshed: t('Tesla 用户信息已刷新'),
    getTeslaProfileFailed: t('获取 Tesla 用户信息失败'),
    teslaRegionSaved: t('Tesla 用户区域已获取并保存到 Redis'),
    getTeslaRegionFailed: t('获取 Tesla 用户区域失败'),
    notReturned: t('未返回'),
    tokenInputPlaceholder: (field: string) => t('输入 {{field}}，回车保存', { field }),
    saved: t('已保存'),
    unsaved: t('未保存'),
    updatedAt: t('更新时间'),
    expiresAt: t('过期时间'),
    refreshToken: t('刷新 token'),
    teslaUserInfo: t('Tesla 用户信息'),
    userRegion: t('用户区域'),
    openLink: t('打开链接'),
    copyLink: t('复制链接'),
    authCallbackCode: t('授权回调 code'),
    eyebrow: t('个人设置'),
    title: t('管理第三方账户绑定。'),
    refresh: t('刷新'),
    profileTitle: t('用户资料'),
    editingProfile: t('资料修改中'),
    profile: t('资料'),
    editingPassword: t('密码修改中'),
    editProfile: t('修改资料'),
    changePassword: t('修改密码'),
    avatar: t('头像'),
    avatarPlaceholder: t('头像图片 URL'),
    username: t('用户名'),
    requiredUsername: t('请输入用户名'),
    usernameLength: t('用户名长度必须在3-16位之间'),
    usernameStartsWithLetter: t('用户名必须以字母开头'),
    email: t('邮箱'),
    invalidEmail: t('邮箱格式不正确'),
    phone: t('电话'),
    invalidPhone: t('手机号格式不正确'),
    cancel: t('取消'),
    saveProfile: t('保存资料'),
    notSet: t('未设置'),
    currentPassword: t('当前密码'),
    requiredCurrentPassword: t('请输入当前密码'),
    newPassword: t('新密码'),
    requiredNewPassword: t('请输入新密码'),
    passwordLength: t('密码长度必须在8-30位之间'),
    confirmNewPassword: t('确认新密码'),
    requiredConfirmPassword: t('请再次输入新密码'),
    passwordMismatch: t('两次输入的新密码不一致'),
    savePassword: t('保存密码'),
    thirdPartyBinding: t('第三方账户绑定'),
    unbound: t('未绑定'),
    bind: t('去绑定'),
    pendingIntegration: t('待接入'),
    rebind: t('重新绑定'),
    unbindTitle: t('解除这个绑定？'),
    unbind: t('解除绑定'),
    locale: language
  }), [language, t]);
  const providers = useMemo<Array<{
    provider: ThirdPartyProvider;
    title: string;
    description: string;
    bindPath?: string;
  }>>(() => [
    {
      provider: 'Tesla',
      title: 'Tesla',
      description: text.teslaDescription,
      bindPath: '/vehicle/tesla'
    },
    {
      provider: 'GitHub',
      title: 'GitHub',
      description: text.githubDescription
    }
  ], [text.githubDescription, text.teslaDescription]);
  const teslaAccountKey = buildThirdPartyAccountKey('Tesla', user?.id, user?.username);
  const teslaCallbackRedirectUri = typeof window === 'undefined' ? '' : `${window.location.origin}/settings`;
  const handledTeslaCallbackRef = useRef('');
  const [profileForm] = Form.useForm<UserProfileFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();
  const avatarPreview = Form.useWatch('avatar', profileForm);
  const [bindings, setBindings] = useState<ThirdPartyUserBinding[]>([]);
  const [loading, setLoading] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordEditing, setPasswordEditing] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
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
  const savedProfileAvatar = user?.avatar?.trim() || user?.avatarUrl?.trim();
  const profileAvatar = profileEditing ? avatarPreview?.trim() || savedProfileAvatar : savedProfileAvatar;

  useEffect(() => {
    profileForm.setFieldsValue({
      username: user?.username || '',
      avatar: user?.avatar || user?.avatarUrl || '',
      email: user?.email || '',
      phone: user?.phone || ''
    });
  }, [profileForm, user?.avatar, user?.avatarUrl, user?.email, user?.phone, user?.username]);

  useEffect(() => {
    if (!user?.id) return;

    authApi.getCurrentUser()
      .then(currentUser => {
        updateUser(currentUser);
      })
      .catch(() => {
        setError(text.sessionExpired);
        setProfileEditing(false);
        setPasswordEditing(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const resetProfileForm = () => {
    profileForm.setFieldsValue({
      username: user?.username || '',
      avatar: user?.avatar || user?.avatarUrl || '',
      email: user?.email || '',
      phone: user?.phone || ''
    });
  };

  const startProfileEdit = () => {
    resetProfileForm();
    setError('');
    setSuccess('');
    setProfileEditing(true);
  };

  const cancelProfileEdit = () => {
    resetProfileForm();
    setProfileEditing(false);
  };

  const startPasswordEdit = () => {
    passwordForm.resetFields();
    setError('');
    setSuccess('');
    setPasswordEditing(true);
  };

  const cancelPasswordEdit = () => {
    passwordForm.resetFields();
    setPasswordEditing(false);
  };

  const saveUserProfile = async (values: UserProfileFormValues) => {
    setProfileSaving(true);
    setError('');
    setSuccess('');
    try {
      const updatedUser = await authApi.updateCurrentUser({
        username: values.username.trim(),
        avatar: values.avatar?.trim() || undefined,
        email: values.email?.trim() || undefined,
        phone: values.phone?.trim() || undefined
      });
      updateUser(updatedUser);
      profileForm.setFieldsValue({
        username: updatedUser.username,
        avatar: updatedUser.avatar || updatedUser.avatarUrl || '',
        email: updatedUser.email || '',
        phone: updatedUser.phone || ''
      });
      setProfileEditing(false);
      setSuccess(text.profileUpdated);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : text.profileUpdateFailed);
    } finally {
      setProfileSaving(false);
    }
  };

  const savePassword = async (values: PasswordFormValues) => {
    setPasswordSaving(true);
    setError('');
    setSuccess('');
    try {
      await authApi.updateCurrentPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      passwordForm.resetFields();
      setPasswordEditing(false);
      setSuccess(text.passwordUpdated);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : text.passwordUpdateFailed);
    } finally {
      setPasswordSaving(false);
    }
  };

  const loadBindings = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const data = await thirdPartyUserBindingApi.findByLocalUserId(user.id);
      setBindings(data || []);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : text.loadBindingsFailed);
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
    const state = params.get('state');
    if (code && !isGitHubAccountKey(state)) {
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
      setError(caught instanceof Error ? caught.message : text.loadTeslaTokenFailed);
    } finally {
      setTokenLoading('');
    }
  };

  const loadTeslaRegionCache = async () => {
    try {
      const cache = await teslaFleetApi.getApiCache(teslaAccountKey, 'user-region', 'current');
      setTeslaRegionCache(cache);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : text.loadTeslaRegionFailed);
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
      setError(caught instanceof Error ? caught.message : text.unbindFailed);
      setLoading(false);
    }
  };

  const generateRebindUrl = async (binding: ThirdPartyUserBinding) => {
    if (binding.provider === 'GitHub') {
      if (visibleTokenPanels.GitHub) {
        setVisibleTokenPanels(prev => ({ ...prev, GitHub: false }));
        return;
      }
      setRebindUrls(prev => ({ ...prev, GitHub: '/auth/oauth2/github/bind' }));
      setVisibleTokenPanels(prev => ({ ...prev, GitHub: true }));
      return;
    }
    if (visibleTokenPanels[binding.provider]) {
      setVisibleTokenPanels(prev => ({ ...prev, [binding.provider]: false }));
      return;
    }
    setRebindLoading(binding.provider);
    setError('');
    try {
      const state = binding.accountKey || `${binding.provider}:${user?.id || user?.username || 'anonymous'}`;
      const url = await teslaFleetApi.authorizeUrl({
        state,
        redirectUri: teslaCallbackRedirectUri
      });
      setRebindUrls(prev => ({ ...prev, [binding.provider]: url }));
      setVisibleTokenPanels(prev => ({ ...prev, [binding.provider]: true }));
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : text.rebindUrlFailed);
    } finally {
      setRebindLoading('');
    }
  };

  const generateGitHubAuthUrl = async () => {
    window.location.assign('/auth/oauth2/github/bind');
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
      window.location.assign(url);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : text.teslaAuthUrlFailed);
    } finally {
      setRebindLoading('');
    }
  };

  const exchangeTeslaCode = async () => {
    const code = teslaAuthCode.trim();
    if (!code) {
      setError(text.enterTeslaCode);
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
      setSuccess(text.teslaTokenSaved);
      await loadTeslaTokenStatus();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : text.teslaCodeExchangeFailed);
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
      setError(text.enterField(editingTokenField));
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
      setSuccess(text.fieldSaved(editingTokenField));
      setEditingTokenField(null);
      setEditingTokenValue('');
      await loadTeslaTokenStatus();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : text.saveTeslaTokenFailed);
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
      setSuccess(text.teslaAccessTokenRefreshed);
      await loadTeslaTokenStatus();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : text.refreshTeslaTokenFailed);
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
      throw new Error(text.missingTeslaThirdPartyId);
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

    const state = params.get('state');
    if (isGitHubAccountKey(state)) return;

    const callbackKey = `${code}:${params.get('state') || ''}`;
    if (handledTeslaCallbackRef.current === callbackKey) return;

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
        setSuccess(text.teslaAuthCompleted);
        await loadTeslaTokenStatus(callbackAccountKey);
        try {
          const profile = await teslaFleetApi.userMeWithStoredToken(callbackAccountKey);
          await saveTeslaUserBindingFromProfile(profile, callbackAccountKey);
          await loadBindings();
        } catch (caught: unknown) {
          setError(caught instanceof Error ? caught.message : text.teslaTokenSavedBindingFailed);
        }
        const cleanPath = `${location.pathname}${location.hash}`;
        navigate(cleanPath, { replace: true });
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : text.teslaCodeExchangeFailed);
      })
      .finally(() => {
        setTokenLoading('');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, teslaAccountKey, teslaCallbackRedirectUri]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const githubBind = params.get('githubBind');
    if (!githubBind) return;

    if (githubBind === 'success') {
      setSuccess(text.githubBound);
      loadBindings();
    } else {
      setError(text.githubBindFailed);
    }
    navigate(location.pathname, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const refreshTeslaUserProfile = async () => {
    setProfileLoading('user-me');
    setError('');
    setSuccess('');
    try {
      const profile = await teslaFleetApi.userMeWithStoredToken(teslaAccountKey);
      await saveTeslaUserBindingFromProfile(profile);
      await loadBindings();
      setSuccess(text.teslaProfileRefreshed);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : text.getTeslaProfileFailed);
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
      setSuccess(text.teslaRegionSaved);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : text.getTeslaRegionFailed);
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
              <strong>{region || text.notReturned}</strong>
            </div>
            <div>
              <span>API Base URL</span>
              <strong>{apiBaseUrl || text.notReturned}</strong>
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
              placeholder={text.tokenInputPlaceholder('access_token')}
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
              {tokenCache?.token?.access_token ? text.saved : text.unsaved}
            </Tag>
          )}
        </div>
        <div className="tesla-token-edit-card" onClick={() => startTokenEdit('refresh_token')}>
          <span>refresh_token</span>
          {editingTokenField === 'refresh_token' ? (
            <Input.Password
              autoFocus
              value={editingTokenValue}
              placeholder={text.tokenInputPlaceholder('refresh_token')}
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
              {tokenCache?.token?.refresh_token ? text.saved : text.unsaved}
            </Tag>
          )}
        </div>
        <div>
          <span>{text.updatedAt}</span>
          <strong>{formatTimestamp(tokenStatus?.updatedAt, text.noRecord, text.locale)}</strong>
        </div>
        <div>
          <span>{text.expiresAt}</span>
          <strong>{formatTimestamp(tokenStatus?.expiresAt, text.noRecord, text.locale)}</strong>
        </div>
      </div>
      <Space wrap>
        <Button loading={tokenLoading === 'refresh'} onClick={refreshTeslaToken}>
          {text.refreshToken}
        </Button>
        {showProfileActions && (
          <>
            <Button icon={<UserOutlined />} loading={profileLoading === 'user-me'} onClick={refreshTeslaUserProfile}>
              {text.teslaUserInfo}
            </Button>
            <Button icon={<EnvironmentOutlined />} loading={profileLoading === 'user-region'} onClick={refreshTeslaUserRegion}>
              {text.userRegion}
            </Button>
          </>
        )}
      </Space>
      {rebindUrls.Tesla && (
        <div className="third-party-rebind-link">
          <Input.TextArea value={rebindUrls.Tesla} autoSize readOnly />
          <Space wrap>
            <Button href={rebindUrls.Tesla} target="_blank" icon={<LinkOutlined />}>
              {text.openLink}
            </Button>
            <Button onClick={() => navigator.clipboard.writeText(rebindUrls.Tesla)}>
              {text.copyLink}
            </Button>
          </Space>
        </div>
      )}
      <div className="tesla-fleet-field">
        <span>{text.authCallbackCode}</span>
        <Input
          value={teslaAuthCode}
          onChange={event => setTeslaAuthCode(event.target.value)}
          onPressEnter={exchangeTeslaCode}
        />
      </div>
    </div>
  );

  const renderGitHubAuthPanel = () => (
    <div className="third-party-token-panel">
      {rebindUrls.GitHub && (
        <div className="third-party-rebind-link">
          <Input.TextArea value={rebindUrls.GitHub} autoSize readOnly />
          <Space wrap>
            <Button href={rebindUrls.GitHub} target="_blank" icon={<LinkOutlined />}>
              {text.openLink}
            </Button>
            <Button onClick={() => navigator.clipboard.writeText(rebindUrls.GitHub)}>
              {text.copyLink}
            </Button>
          </Space>
        </div>
      )}
    </div>
  );

  return (
    <LifePageShell
      className="personal-settings-page"
      eyebrow={text.eyebrow}
      title={text.title}
      actions={
        <Button icon={<ReloadOutlined />} loading={loading} onClick={loadBindings}>
          {text.refresh}
        </Button>
      }
    >
      {error && <Alert className="tesla-fleet-alert" type="error" showIcon message={error} />}
      {success && <Alert className="tesla-fleet-alert" type="success" showIcon message={success} />}

      <section className="personal-settings-layout">
        <Card className="life-panel-card personal-profile-card">
          <div className="life-panel-title-row">
            <h2>{text.profileTitle}</h2>
            <Space size={8}>
              <Tag color={profileEditing ? 'processing' : profileAvatar ? 'success' : 'default'}>
                {profileEditing ? text.editingProfile : text.profile}
              </Tag>
              {passwordEditing && <Tag color="processing">{text.editingPassword}</Tag>}
              {!profileEditing && (
                <Button icon={<EditOutlined />} onClick={startProfileEdit}>
                  {text.editProfile}
                </Button>
              )}
              {!passwordEditing && (
                <Button icon={<EditOutlined />} onClick={startPasswordEdit}>
                  {text.changePassword}
                </Button>
              )}
            </Space>
          </div>

          <div className="personal-profile-editor">
            <div className="personal-profile-avatar-preview">
              <Avatar size={64} src={profileAvatar} icon={<UserOutlined />} />
            </div>

            {profileEditing ? (
              <Form
                form={profileForm}
                layout="vertical"
                className="personal-profile-form"
                onFinish={saveUserProfile}
              >
                <Form.Item label={text.avatar} name="avatar">
                  <Input placeholder={text.avatarPlaceholder} allowClear />
                </Form.Item>
                <div className="personal-profile-field-grid">
                  <Form.Item
                    label={text.username}
                    name="username"
                    rules={[
                      { required: true, message: text.requiredUsername },
                      { min: 3, max: 16, message: text.usernameLength },
                      { pattern: /^[a-zA-Z]\w{2,15}$/, message: text.usernameStartsWithLetter }
                    ]}
                  >
                    <Input placeholder={text.username} />
                  </Form.Item>
                  <Form.Item
                    label={text.email}
                    name="email"
                    rules={[{ type: 'email', message: text.invalidEmail }]}
                  >
                    <Input placeholder={text.email} allowClear />
                  </Form.Item>
                  <Form.Item
                    label={text.phone}
                    name="phone"
                    rules={[
                      {
                        validator: (_, value?: string) => (
                          !value || /^1[3-9]\d{9}$/.test(value)
                            ? Promise.resolve()
                            : Promise.reject(new Error(text.invalidPhone))
                        )
                      }
                    ]}
                  >
                    <Input placeholder={text.phone} allowClear />
                  </Form.Item>
                </div>
                <div className="personal-profile-actions">
                  <Button onClick={cancelProfileEdit} disabled={profileSaving}>
                    {text.cancel}
                  </Button>
                  <Button type="primary" htmlType="submit" loading={profileSaving}>
                    {text.saveProfile}
                  </Button>
                </div>
              </Form>
            ) : (
              <div className="personal-profile-view">
                <div>
                  <span>{text.username}</span>
                  <strong>{user?.username || text.notSet}</strong>
                </div>
                <div>
                  <span>{text.email}</span>
                  <strong>{user?.email || text.notSet}</strong>
                </div>
                <div>
                  <span>{text.phone}</span>
                  <strong>{user?.phone || text.notSet}</strong>
                </div>
              </div>
            )}
          </div>

          {passwordEditing && (
            <div className="personal-password-section">
              <div className="life-panel-title-row personal-password-title-row">
                <h2>{text.changePassword}</h2>
              </div>
              <Form
                form={passwordForm}
                layout="vertical"
                className="personal-password-form"
                onFinish={savePassword}
              >
                <div className="personal-profile-field-grid">
                  <Form.Item
                    label={text.currentPassword}
                    name="currentPassword"
                    rules={[{ required: true, message: text.requiredCurrentPassword }]}
                  >
                    <Input.Password placeholder={text.currentPassword} autoComplete="current-password" />
                  </Form.Item>
                  <Form.Item
                    label={text.newPassword}
                    name="newPassword"
                    rules={[
                      { required: true, message: text.requiredNewPassword },
                      { min: 8, max: 30, message: text.passwordLength },
                      { pattern: passwordPattern, message: text.passwordRule }
                    ]}
                  >
                    <Input.Password placeholder={text.newPassword} autoComplete="new-password" />
                  </Form.Item>
                  <Form.Item
                    label={text.confirmNewPassword}
                    name="confirmPassword"
                    dependencies={['newPassword']}
                    rules={[
                      { required: true, message: text.requiredConfirmPassword },
                      ({ getFieldValue }) => ({
                        validator: (_, value?: string) => (
                          !value || getFieldValue('newPassword') === value
                            ? Promise.resolve()
                            : Promise.reject(new Error(text.passwordMismatch))
                        )
                      })
                    ]}
                  >
                    <Input.Password placeholder={text.confirmNewPassword} autoComplete="new-password" />
                  </Form.Item>
                </div>
                <div className="personal-profile-actions">
                  <Button onClick={cancelPasswordEdit} disabled={passwordSaving}>
                    {text.cancel}
                  </Button>
                  <Button type="primary" htmlType="submit" loading={passwordSaving}>
                    {text.savePassword}
                  </Button>
                </div>
              </Form>
            </div>
          )}
        </Card>

        <Card className="life-panel-card">
          <div className="life-panel-title-row">
            <h2>{text.thirdPartyBinding}</h2>
            <Tag color={bindings.length > 0 ? 'success' : 'default'}>{bindings.length}</Tag>
          </div>

          <div className="third-party-binding-list">
            {providers.map(item => {
              const binding = bindings.find(candidate => candidate.provider === item.provider);
              if (!binding) {
                return (
                  <div key={item.provider} className="third-party-binding-item third-party-binding-empty">
                    <div className="third-party-binding-main">
                      <div className="third-party-binding-title">
                        <strong>{item.title}</strong>
                        <Tag>{text.unbound}</Tag>
                      </div>
                      <div className="third-party-binding-meta">
                        <span>{item.description}</span>
                      </div>
                      {item.provider === 'Tesla' && visibleTokenPanels.Tesla && renderTeslaTokenPanel(true)}
                      {item.provider === 'Tesla' && teslaProfileResultPanel}
                      {item.provider === 'GitHub' && visibleTokenPanels.GitHub && renderGitHubAuthPanel()}
                    </div>
                    {item.provider === 'Tesla' ? (
                      <Button
                        icon={<LinkOutlined />}
                        type="primary"
                        loading={rebindLoading === 'Tesla'}
                        onClick={generateTeslaAuthUrl}
                      >
                        {text.bind}
                      </Button>
                    ) : item.provider === 'GitHub' ? (
                      <Button
                        icon={<GithubOutlined />}
                        type="primary"
                        loading={rebindLoading === 'GitHub'}
                        onClick={generateGitHubAuthUrl}
                      >
                        {text.bind}
                      </Button>
                    ) : item.bindPath ? (
                      <Button icon={<LinkOutlined />} type="primary" onClick={() => navigate(item.bindPath!)}>
                        {text.bind}
                      </Button>
                    ) : (
                      <Button icon={<LinkOutlined />} disabled>
                        {text.pendingIntegration}
                      </Button>
                    )}
                  </div>
                );
              }

              const bindingTitle = binding.nickname || binding.username || binding.thirdPartyUserId;

              return (
                <div key={binding.id || `${binding.provider}-${binding.thirdPartyUserId}`} className="third-party-binding-item">
                  <div className="third-party-binding-main">
                    <div className="third-party-binding-title">
                      <div className="third-party-binding-title-main">
                        {binding.avatarUrl && <Avatar size={24} src={binding.avatarUrl} />}
                        <strong>{bindingTitle}</strong>
                        {binding.email && <span className="third-party-binding-email">{binding.email}</span>}
                      </div>
                      <Tag color={providerColor[binding.provider] || 'processing'}>{binding.provider}</Tag>
                    </div>
                    {binding.provider === 'Tesla' && visibleTokenPanels.Tesla && renderTeslaTokenPanel(false)}
                    {binding.provider === 'Tesla' && teslaProfileResultPanel}
                    {binding.provider === 'GitHub' && visibleTokenPanels.GitHub && renderGitHubAuthPanel()}
                  </div>
                  <div className="third-party-binding-actions">
                    {binding.provider === 'Tesla' && (
                      <>
                        <Button icon={<UserOutlined />} loading={profileLoading === 'user-me'} onClick={refreshTeslaUserProfile}>
                          {text.teslaUserInfo}
                        </Button>
                        <Button icon={<EnvironmentOutlined />} loading={profileLoading === 'user-region'} onClick={refreshTeslaUserRegion}>
                          {text.userRegion}
                        </Button>
                      </>
                    )}
                    <Button
                      icon={<LinkOutlined />}
                      loading={rebindLoading === binding.provider}
                      onClick={() => generateRebindUrl(binding)}
                    >
                      {text.rebind}
                    </Button>
                    <Popconfirm title={text.unbindTitle} okText={text.unbind} cancelText={text.cancel} onConfirm={() => unbindAccount(binding.id)}>
                      <Button icon={<DeleteOutlined />} danger>
                        {text.unbind}
                      </Button>
                    </Popconfirm>
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
