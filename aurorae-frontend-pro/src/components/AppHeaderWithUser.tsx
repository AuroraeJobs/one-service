import React from 'react';
import { Avatar, Dropdown, Space, Typography } from 'antd';
import { LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AppHeaderWithUser.css';

const { Text } = Typography;

const COLORS = [
  '#667eea',
  '#764ba2',
  '#f093fb',
  '#4facfe',
  '#43e97b',
  '#38f9d7',
  '#fa709a',
  '#fee140',
  '#a8edea',
  '#fed6e3',
];

const getInitial = (name: string): string => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

const getColor = (name: string): string => {
  if (!name) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
};

const AppHeaderWithUser: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = getInitial(user?.username || '');
  const color = getColor(user?.username || '');

  const items: MenuProps['items'] = [
    {
      key: 'user',
      label: (
        <div style={{ padding: '8px 16px', cursor: 'default' }}>
          <Space>
            <div className="avatar-mini" style={{ backgroundColor: color }}>
              <span className="avatar-mini-text">{initial}</span>
            </div>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{user?.username}</Text>
          </Space>
        </div>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: '1',
      icon: <SettingOutlined />,
      label: '设置',
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
      <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']}>
        <div className="avatar-container">
          <div className="avatar-glow"></div>
          <div className="avatar-ring"></div>
          <div className="avatar-main" style={{ backgroundColor: color }}>
            <span className="avatar-text">{initial}</span>
          </div>
        </div>
      </Dropdown>
    </div>
  );
};

export default AppHeaderWithUser;
