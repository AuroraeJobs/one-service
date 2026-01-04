import { useState } from 'react';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { CloudFilled, SearchOutlined, BarChartOutlined, AreaChartOutlined, DotChartOutlined } from '@ant-design/icons';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import RecordList from './components/RecordList';
import Statistics from './components/Statistics';
import Analysis from './components/Analysis';
import Taiji from './components/Taiji';
import { RecordProvider } from './contexts/RecordContext';
import './App.css';

// 路由映射表，用于匹配导航项和路径
const routeMap: Record<string, string> = {
  '/taiji': '宇宙',
  '/analysis': '时间',
  '/statistics': '空间',
  '/record': '探索'
};

// 导航栏组件
const AppHeader = () => {
  const location = useLocation();
  
  // 确定当前选中的导航项
  const getCurrentNav = () => {
    const path = location.pathname;
    // 对于根路径，默认选中第一个导航项
    if (path === '/') return '宇宙';
    return routeMap[path] || '';
  };
  
  const currentNav = getCurrentNav();
  
  return (
    <header className="app-header" style={{ 
      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      width: '100%', 
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
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
                <Route path="/" element={<Taiji />} />
                <Route path="/statistics" element={<Statistics isTabVisible={isTabVisible} />} />
                <Route path="/analysis" element={<Analysis isTabVisible={isTabVisible} />} />
                <Route path="/taiji" element={<Taiji />} />
                <Route path="/record" element={<RecordList />} />
              </Routes>
            </main>

          </div>
        </ConfigProvider>
      </RecordProvider>
    </Router>
  );
}

export default App;
