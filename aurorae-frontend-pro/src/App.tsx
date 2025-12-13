import { useState } from 'react';
import { ConfigProvider, Menu } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AppleFilled, SearchOutlined, BarChartOutlined, AreaChartOutlined } from '@ant-design/icons';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import RecordList from './components/RecordList';
import Statistics from './components/Statistics';
import Analysis from './components/Analysis';
import './App.css';

function App() {
  // Tab显示/隐藏状态，提升到App组件中，以便页脚图标可以控制
  const [isTabVisible] = useState(false);
  
  return (
    <Router>
      <ConfigProvider 
        locale={zhCN} 
        theme={{
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
                <AppleFilled 
                  style={{ fontSize: '24px', color: '#fff', marginRight: '16px', cursor: 'pointer' }} 
                />
              </Link>
              
              {/* 导航菜单 */}
              <Menu
                mode="horizontal"
                theme="dark"
                defaultSelectedKeys={['query']}
                items={[
                  {
                    key: 'query',
                    icon: <SearchOutlined />,
                    label: <Link to="/">查询</Link>,
                  },
                  {
                    key: 'statistics',
                    icon: <BarChartOutlined />,
                    label: <Link to="/statistics">统计</Link>,
                  },
                  {
                    key: 'analysis',
                    icon: <AreaChartOutlined />,
                    label: <Link to="/analysis">分析</Link>,
                  },
                ]}
                style={{ 
                  backgroundColor: 'transparent', 
                  borderBottom: 'none',
                }}
                className="custom-menu"
              />
            </div>
          </header>
          <main className="app-main" style={{ paddingTop: '64px', paddingBottom: '20px' }}>
            <Routes>
              <Route path="/" element={<RecordList />} />
              <Route path="/statistics" element={<Statistics isTabVisible={isTabVisible} />} />
              <Route path="/analysis" element={<Analysis isTabVisible={isTabVisible} />} />
            </Routes>
          </main>

        </div>
      </ConfigProvider>
    </Router>
  );
}

export default App;
