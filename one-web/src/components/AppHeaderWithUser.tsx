import React from 'react';
import { Dropdown, Typography } from 'antd';
import { LogoutOutlined, SettingOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAvatarColor, getAvatarInitial } from '../utils/avatar';
import './AppHeaderWithUser.css';

const { Text } = Typography;

interface AppHeaderWithUserProps {
  colorMode: 'light' | 'dark';
  onToggleColorMode: () => void;
}

const AppHeaderWithUser: React.FC<AppHeaderWithUserProps> = ({
  colorMode,
  onToggleColorMode
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = getAvatarInitial(user?.username || '');
  const color = getAvatarColor(user?.username || '');
  const avatarSrc = user?.avatar?.trim() || user?.avatarUrl?.trim();

  const items: MenuProps['items'] = [
    {
      key: 'user',
      className: 'header-user-menu-profile-item',
      icon: (
        <div className="avatar-mini" style={avatarSrc ? undefined : { backgroundColor: color }}>
          {avatarSrc ? (
            <img className="avatar-image" src={avatarSrc} alt={`${user?.username || '用户'}头像`} />
          ) : (
            <span className="avatar-mini-text">{initial}</span>
          )}
        </div>
      ),
      label: <Text className="header-user-menu-name">{user?.username}</Text>,
    },
    {
      type: 'divider',
    },
    {
      key: '1',
      icon: <SettingOutlined />,
      label: '用户设置',
      onClick: () => navigate('/settings'),
    },
    {
      key: 'theme',
      icon: colorMode === 'dark' ? <SunOutlined /> : <MoonOutlined />,
      label: colorMode === 'dark' ? '日间模式' : '夜间模式',
      onClick: onToggleColorMode,
    },
    {
      type: 'divider',
    },
    {
      key: '2',
      icon: <LogoutOutlined />,
      label: '退出登录',
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
              <img className="avatar-image" src={avatarSrc} alt={`${user?.username || '用户'}头像`} />
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
