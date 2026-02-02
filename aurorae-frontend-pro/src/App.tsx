import { useState } from 'react';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { CloudFilled, SearchOutlined, BarChartOutlined, AreaChartOutlined, DotChartOutlined, HeartFilled } from '@ant-design/icons';
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
import { RecordProvider } from './contexts/RecordContext';
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
  '/health/spring-equinox': '健康',
  '/health/summer-solstice': '健康',
  '/health/autumn-equinox': '健康',
  '/health/winter-solstice': '健康',
  '/hexagram': '健康'
};

// 导航栏组件
const AppHeader = () => {
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '64px' }}>
        {/* 苹果白实心图标 - 放在查询按钮左侧，与菜单一起居中，点击回到首页 */}
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
    </header>
  );
};

function App() {
  // Tab显示/隐藏状态，提升到App组件中，以便页脚图标可以控制
  const [isTabVisible] = useState(false);
  
  return (
    <Router>
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
            <AppHeader />
            <main className="app-main" style={{ paddingTop: '64px', paddingBottom: '20px', backgroundColor: '#000' }}>
              <Routes>
                <Route path="/" element={<HealthMainPage />} />
                <Route path="/statistics" element={<Statistics isTabVisible={isTabVisible} />} />
                <Route path="/analysis" element={<Analysis isTabVisible={isTabVisible} />} />
                <Route path="/taiji" element={<Taiji />} />
                <Route path="/record" element={<RecordList />} />
                <Route path="/health" element={<HealthMainPage />} />
                <Route path="/health/third" element={<HealthThirdPage />} />
                <Route path="/health/fourth" element={<HealthFourthPage />} />
                <Route path="/health/spring-equinox" element={<HealthSpringEquinoxPage />} />
                <Route path="/health/summer-solstice" element={<HealthSummerSolsticePage />} />
                <Route path="/health/autumn-equinox" element={<HealthAutumnEquinoxPage />} />
                <Route path="/health/winter-solstice" element={<HealthWinterSolsticePage />} />
                <Route path="/hexagram" element={<HexagramPage />} />
              </Routes>
            </main>

          </div>
        </ConfigProvider>
      </RecordProvider>
    </Router>
  );
}

export default App;
