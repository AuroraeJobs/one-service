import React from 'react';
import { Dropdown, Typography } from 'antd';
import { CheckOutlined, GlobalOutlined, LogoutOutlined, SettingOutlined, MoonOutlined, SunOutlined, TeamOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import { useI18n } from '../contexts/I18nContext';
import { useNavigate } from 'react-router-dom';
import { getAvatarColor, getAvatarInitial } from '../utils/avatar';
import './AppHeaderWithUser.css';

const { Text } = Typography;

const AppHeaderWithUser: React.FC = () => {
  const { user, logout } = useAuth();
  const { colorMode, onToggleColorMode } = useAppPreferences();
  const { locale, setLanguage, supportedLocales, t } = useI18n();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = getAvatarInitial(user?.username || '');
  const color = getAvatarColor(user?.username || '');
  const avatarSrc = user?.avatar?.trim() || user?.avatarUrl?.trim();
  const userName = user?.username || t('用户');
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  const items: MenuProps['items'] = [
    {
      key: 'user',
      className: 'header-user-menu-profile-item',
      icon: (
        <div className="avatar-mini" style={avatarSrc ? undefined : { backgroundColor: color }}>
          {avatarSrc ? (
            <img className="avatar-image" src={avatarSrc} alt={t('{{name}}头像', { name: userName })} />
          ) : (
            <span className="avatar-mini-text">{initial}</span>
          )}
        </div>
      ),
      label: <Text className="header-user-menu-name">{userName}</Text>,
    },
    {
      type: 'divider',
    },
    {
      key: '1',
      icon: <SettingOutlined />,
      label: t('用户设置'),
      onClick: () => navigate('/settings'),
    },
    ...(isAdmin ? [{
      key: 'admin-users',
      icon: <TeamOutlined />,
      label: t('用户管理'),
      onClick: () => navigate('/admin/users'),
    }] : []),
    {
      key: 'theme',
      icon: colorMode === 'dark' ? <SunOutlined /> : <MoonOutlined />,
      label: colorMode === 'dark'
        ? t('日间模式')
        : t('夜间模式'),
      onClick: onToggleColorMode,
    },
    {
      key: 'language',
      icon: <GlobalOutlined />,
      label: (
        <span className="header-user-language-label">
          <span>{t('语言')}</span>
          <span className="header-user-language-value">{locale.nativeName}</span>
        </span>
      ),
      children: supportedLocales.map(option => ({
        key: `language-${option.code}`,
        icon: option.code === locale.code ? <CheckOutlined /> : undefined,
        label: option.nativeName,
        onClick: () => setLanguage(option.code),
      })),
    },
    {
      type: 'divider',
    },
    {
      key: '2',
      icon: <LogoutOutlined />,
      label: t('退出登录'),
      onClick: handleLogout,
    },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '20px' }}>
      <Dropdown
        menu={{ items }}
        overlayClassName="header-user-dropdown"
        placement="bottomRight"
        trigger={['click']}
      >
        <div className="avatar-container">
          <div className="avatar-glow"></div>
          <div className="avatar-ring"></div>
          <div className="avatar-main" style={avatarSrc ? undefined : { backgroundColor: color }}>
            {avatarSrc ? (
              <img className="avatar-image" src={avatarSrc} alt={t('{{name}}头像', { name: userName })} />
            ) : (
              <span className="avatar-text">{initial}</span>
            )}
          </div>
        </div>
      </Dropdown>
    </div>
  );
};

export default AppHeaderWithUser;
