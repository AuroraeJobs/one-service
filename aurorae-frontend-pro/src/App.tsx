import { useState } from 'react';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { CloudFilled, SearchOutlined, BarChartOutlined, AreaChartOutlined, DotChartOutlined } from '@ant-design/icons';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import RecordList from './components/RecordList';
import Statistics from './components/Statistics';
import Analysis from './components/Analysis';
import Taiji from './components/Taiji';
import './App.css';

function App() {
  // Tab显示/隐藏状态，提升到App组件中，以便页脚图标可以控制
  const [isTabVisible] = useState(false);
  
  return (
    <Router>
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
          <header className="app-header" style={{ 
            backgroundColor: '#000', 
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
                <Link to="/taiji" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  color: '#fff', 
                  textDecoration: 'none',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  transition: 'background-color 0.3s ease',
                  fontSize: '12px',
                  fontWeight: 'normal'
                }}>
                  <DotChartOutlined />
                  宇宙
                </Link>
                <Link to="/analysis" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  color: '#fff', 
                  textDecoration: 'none',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  transition: 'background-color 0.3s ease',
                  fontSize: '12px',
                  fontWeight: 'normal'
                }}>
                  <AreaChartOutlined />
                  时间
                </Link>
                <Link to="/statistics" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  color: '#fff', 
                  textDecoration: 'none',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  transition: 'background-color 0.3s ease',
                  fontSize: '12px',
                  fontWeight: 'normal'
                }}>
                  <BarChartOutlined />
                  空间
                </Link>
                <Link to="/record" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  color: '#fff', 
                  textDecoration: 'none',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  transition: 'background-color 0.3s ease',
                  fontSize: '12px',
                  fontWeight: 'normal'
                }}>
                  <SearchOutlined />
                  探索
                </Link>
              </div>
            </div>
          </header>
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
    </Router>
  );
}

export default App;
