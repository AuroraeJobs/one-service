import { useState } from 'react';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { CloudFilled, SearchOutlined, BarChartOutlined, AreaChartOutlined, DotChartOutlined, HeartFilled, AimOutlined } from '@ant-design/icons';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import RecordList from './components/RecordList';
import Statistics from './components/Statistics';
import Analysis from './components/Analysis';
import Taiji from './components/Taiji';
import HealthMainPage from './components/HealthMainPage';
import HealthThirdPage from './components/HealthThirdPage';
import HealthFourthPage from './components/HealthFourthPage';
import HealthSpringEquinoxPage from './components/HealthSpringEquinoxPage';
import HealthSummerSolsticePage from './components/HealthSummerSolsticePage';
import HealthAutumnEquinoxPage from './components/HealthAutumnEquinoxPage';
import HealthWinterSolsticePage from './components/HealthWinterSolsticePage';
import HexagramPage from './components/HexagramPage';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import AppHeaderWithUser from './components/AppHeaderWithUser';
import { RecordProvider } from './contexts/RecordContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import './App.css';

// 路由映射表，用于匹配导航项和路径
const routeMap: Record<string, string> = {
  '/taiji': '宇宙',
  '/analysis': '时间',
  '/statistics': '空间',
  '/record': '探索',
  '/health': '健康',
  '/health/third': '健康',
  '/health/fourth': '健康',
  '/fitness': '健身',
  '/fitness/spring-equinox': '健身',
  '/fitness/summer-solstice': '健身',
  '/fitness/autumn-equinox': '健身',
  '/fitness/winter-solstice': '健身',
  '/hexagram': '健康'
};

// 导航栏组件 - 带用户信息
const AppHeaderWithNavigation = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  // 确定当前选中的导航项
  const getCurrentNav = () => {
    const path = location.pathname;
    // 对于根路径，默认选中健康导航项
    if (path === '/') return '健康';
    return routeMap[path] || '';
  };
  
  const currentNav = getCurrentNav();
  
  return (
    <header className="app-header" style={{ 
      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
      backgroundImage: 'linear-gradient(145deg, rgba(30, 30, 30, 0.9), rgba(0, 0, 0, 0.9))',
      position: 'fixed', 
      top: 0, 
      left: '50%', 
      transform: 'translateX(-50%)',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      padding: '0 20px',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', height: '64px' }}>
        {/* 左侧导航 */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <CloudFilled 
              style={{ fontSize: '24px', color: '#fff', marginRight: '16px', cursor: 'pointer' }} 
            />
          </Link>
          
          {/* 自定义导航菜单 */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <Link to="/health" className={`nav-link ${currentNav === '健康' ? 'nav-link-active' : ''}`}>
              <HeartFilled />
              健康
            </Link>
            <Link to="/fitness" className={`nav-link ${currentNav === '健身' ? 'nav-link-active' : ''}`}>
              <AimOutlined />
              健身
            </Link>
            <Link to="/taiji" className={`nav-link ${currentNav === '宇宙' ? 'nav-link-active' : ''}`}>
              <DotChartOutlined />
              宇宙
            </Link>
            <Link to="/analysis" className={`nav-link ${currentNav === '时间' ? 'nav-link-active' : ''}`}>
              <AreaChartOutlined />
              时间
            </Link>
            <Link to="/statistics" className={`nav-link ${currentNav === '空间' ? 'nav-link-active' : ''}`}>
              <BarChartOutlined />
              空间
            </Link>
            <Link to="/record" className={`nav-link ${currentNav === '探索' ? 'nav-link-active' : ''}`}>
              <SearchOutlined />
              探索
            </Link>
          </div>
        </div>

        {/* 右侧用户信息 */}
        {isAuthenticated && <AppHeaderWithUser />}
      </div>
    </header>
  );
};

function App() {
  // Tab显示/隐藏状态，提升到App组件中，以便页脚图标可以控制
  const [isTabVisible] = useState(false);
  
  return (
    <Router>
      <AuthProvider>
        <RecordProvider>
          <ConfigProvider 
            locale={zhCN} 
            theme={{
              algorithm: theme.darkAlgorithm,
              token: {
                colorPrimary: '#1890ff',
                borderRadius: 6,
              },
            }}
          >
            <div className="app-container">
              <Routes>
                {/* 登录页面 - 不需要保护 */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* 受保护的路由 */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <AppHeaderWithNavigation />
                    <HealthMainPage />
                  </ProtectedRoute>
                } />
                <Route path="/statistics" element={
                  <ProtectedRoute>
                    <AppHeaderWithNavigation />
                    <Statistics isTabVisible={isTabVisible} />
                  </ProtectedRoute>
                } />
                <Route path="/analysis" element={
                  <ProtectedRoute>
                    <AppHeaderWithNavigation />
                    <Analysis isTabVisible={isTabVisible} />
                  </ProtectedRoute>
                } />
                <Route path="/taiji" element={
                  <ProtectedRoute>
                    <AppHeaderWithNavigation />
                    <Taiji />
                  </ProtectedRoute>
                } />
                <Route path="/record" element={
                  <ProtectedRoute>
                    <AppHeaderWithNavigation />
                    <RecordList />
                  </ProtectedRoute>
                } />
                <Route path="/health" element={
                  <ProtectedRoute>
                    <AppHeaderWithNavigation />
                    <HealthMainPage />
                  </ProtectedRoute>
                } />
                <Route path="/health/third" element={
                  <ProtectedRoute>
                    <AppHeaderWithNavigation />
                    <HealthThirdPage />
                  </ProtectedRoute>
                } />
                <Route path="/health/fourth" element={
                  <ProtectedRoute>
                    <AppHeaderWithNavigation />
                    <HealthFourthPage />
                  </ProtectedRoute>
                } />
                <Route path="/fitness" element={
                  <ProtectedRoute>
                    <AppHeaderWithNavigation />
                    <HealthSpringEquinoxPage />
                  </ProtectedRoute>
                } />
                <Route path="/fitness/spring-equinox" element={
                  <ProtectedRoute>
                    <AppHeaderWithNavigation />
                    <HealthSpringEquinoxPage />
                  </ProtectedRoute>
                } />
                <Route path="/fitness/summer-solstice" element={
                  <ProtectedRoute>
                    <AppHeaderWithNavigation />
                    <HealthSummerSolsticePage />
                  </ProtectedRoute>
                } />
                <Route path="/fitness/autumn-equinox" element={
                  <ProtectedRoute>
                    <AppHeaderWithNavigation />
                    <HealthAutumnEquinoxPage />
                  </ProtectedRoute>
                } />
                <Route path="/fitness/winter-solstice" element={
                  <ProtectedRoute>
                    <AppHeaderWithNavigation />
                    <HealthWinterSolsticePage />
                  </ProtectedRoute>
                } />
                <Route path="/hexagram" element={
                  <ProtectedRoute>
                    <AppHeaderWithNavigation />
                    <HexagramPage />
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
          </ConfigProvider>
        </RecordProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
