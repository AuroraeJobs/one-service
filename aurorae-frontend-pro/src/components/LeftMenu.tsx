import React from 'react';
import {
  TrophyOutlined,
  FireFilled,
  UserOutlined,
  HeartFilled,
  SettingOutlined,
  CalendarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { Avatar } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';

const LeftMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 获取当前路径
  const currentPath = location.pathname;
  
  return (
    <div style={{ 
      width: '80px', 
      backgroundColor: 'transparent', 
      borderRight: '1px solid rgba(51, 51, 51, 0.5)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px 0',
      position: 'fixed',
      top: '64px',
      left: 0,
      bottom: 0,
      zIndex: 100,
      boxShadow: '0 0 20px rgba(76, 175, 80, 0.2), inset 0 0 10px rgba(76, 175, 80, 0.1)'
    }}>
      {/* 菜单内容 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {/* 顶部：品牌图标 */}
        <div style={{ paddingTop: '20px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            backgroundColor: 'transparent', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <TrophyOutlined style={{ color: '#4CAF50', fontSize: '20px' }} />
          </div>
        </div>
        
        {/* 中间：导航图标 - 垂直居中 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center' }}>
          {/* Heart按钮 */}
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            // 激活状态样式
            ...((currentPath === '/health' || currentPath === '/') && {
              transform: 'translateZ(10px) scale(1.05)',
              boxShadow: '0 0 16px rgba(76, 175, 80, 0.6), 0 6px 20px rgba(0, 0, 0, 0.5)'
            })
          }}
          onClick={() => navigate('/health')}
          onMouseEnter={(e) => {
            const btn = e.currentTarget;
            btn.style.transform = 'translateZ(10px) scale(1.05)';
            btn.style.boxShadow = '0 0 16px rgba(76, 175, 80, 0.6), 0 6px 20px rgba(0, 0, 0, 0.5)';
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget;
            if (currentPath !== '/health' && currentPath !== '/') {
              btn.style.transform = 'translateZ(0) scale(1)';
              btn.style.boxShadow = 'none';
            }
          }}>
            <HeartFilled style={{ color: (currentPath === '/health' || currentPath === '/') ? '#4CAF50' : '#999999', fontSize: '20px' }} />
          </div>
          
          {/* Fire按钮 */}
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            // 激活状态样式
            ...(currentPath === '/hexagram' && {
              transform: 'translateZ(10px) scale(1.05)',
              boxShadow: '0 0 16px rgba(255, 0, 0, 0.6), 0 6px 20px rgba(0, 0, 0, 0.5)'
            })
          }}
          onClick={() => navigate('/hexagram')}
          onMouseEnter={(e) => {
            const fireBtn = e.currentTarget;
            fireBtn.style.transform = 'translateZ(10px) scale(1.05)';
            fireBtn.style.boxShadow = '0 0 16px rgba(255, 0, 0, 0.6), 0 6px 20px rgba(0, 0, 0, 0.5)';
          }}
          onMouseLeave={(e) => {
            const fireBtn = e.currentTarget;
            if (currentPath !== '/hexagram') {
              fireBtn.style.transform = 'translateZ(0) scale(1)';
              fireBtn.style.boxShadow = 'none';
            }
          }}>
            <FireFilled style={{ color: currentPath === '/hexagram' ? '#FF0000' : '#999999', fontSize: '20px' }} />
          </div>
          
          {/* Calendar按钮 */}
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            // 激活状态样式
            ...(currentPath === '/health/third' && {
              transform: 'translateZ(10px) scale(1.05)',
              boxShadow: '0 0 16px rgba(156, 39, 176, 0.6), 0 6px 20px rgba(0, 0, 0, 0.5)'
            })
          }}
          onClick={() => navigate('/health/third')}
          onMouseEnter={(e) => {
            const btn = e.currentTarget;
            btn.style.transform = 'translateZ(10px) scale(1.05)';
            btn.style.boxShadow = '0 0 16px rgba(156, 39, 176, 0.6), 0 6px 20px rgba(0, 0, 0, 0.5)';
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget;
            if (currentPath !== '/health/third') {
              btn.style.transform = 'translateZ(0) scale(1)';
              btn.style.boxShadow = 'none';
            }
          }}>
            <CalendarOutlined style={{ color: currentPath === '/health/third' ? '#9C27B0' : '#999999', fontSize: '20px' }} />
          </div>
          
          {/* Clock按钮 */}
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            // 激活状态样式
            ...(currentPath === '/health/fourth' && {
              transform: 'translateZ(10px) scale(1.05)',
              boxShadow: '0 0 16px rgba(255, 235, 59, 0.6), 0 6px 20px rgba(0, 0, 0, 0.5)'
            })
          }}
          onClick={() => navigate('/health/fourth')}
          onMouseEnter={(e) => {
            const btn = e.currentTarget;
            btn.style.transform = 'translateZ(10px) scale(1.05)';
            btn.style.boxShadow = '0 0 16px rgba(255, 235, 59, 0.6), 0 6px 20px rgba(0, 0, 0, 0.5)';
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget;
            if (currentPath !== '/health/fourth') {
              btn.style.transform = 'translateZ(0) scale(1)';
              btn.style.boxShadow = 'none';
            }
          }}>
            <ClockCircleOutlined style={{ color: currentPath === '/health/fourth' ? '#FFEB3B' : '#999999', fontSize: '20px' }} />
          </div>
        </div>
        
        {/* 底部：用户头像和设置按钮 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', paddingBottom: '20px' }}>
          {/* 用户头像 */}
          <div>
            <div style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '50%', 
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}>
              <Avatar 
                size={48} 
                icon={<UserOutlined style={{ fontSize: '18px' }} />}
                style={{ 
                  backgroundColor: 'transparent', 
                  color: '#4CAF50',
                  borderRadius: '50%',
                  boxShadow: '0 0 12px rgba(76, 175, 80, 0.4), 0 4px 16px rgba(0, 0, 0, 0.4)',
                  transformStyle: 'preserve-3d',
                  perspective: '1000px',
                  transform: 'translateZ(0)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                }}
              />
            </div>
          </div>
          
          {/* 设置按钮 */}
          <div>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseEnter={(e) => {
              const settingBtn = e.currentTarget;
              settingBtn.style.transform = 'translateZ(10px) scale(1.05)';
              settingBtn.style.boxShadow = '0 0 16px rgba(76, 175, 80, 0.6), 0 6px 20px rgba(0, 0, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              const settingBtn = e.currentTarget;
              settingBtn.style.transform = 'translateZ(0) scale(1)';
              settingBtn.style.boxShadow = 'none';
            }}>
              <SettingOutlined style={{ color: '#4CAF50', fontSize: '20px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftMenu;
