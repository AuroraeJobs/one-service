import { ConfigProvider, Menu } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AppleFilled, SearchOutlined, BarChartOutlined, AreaChartOutlined } from '@ant-design/icons';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import RecordList from './components/RecordList';
import Statistics from './components/Statistics';
import ChartPage from './components/ChartPage';
import './App.css';

function App() {
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
          <header className="app-header" style={{ backgroundColor: '#000', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', height: '64px' }}>
              {/* 左侧 Hello World */}
              <h1 style={{ color: '#fff', margin: 0, fontSize: '20px', marginLeft: '24px' }}>
                Hello World
              </h1>
              
              {/* 中间苹果白实心图标 - 点击滚动到底部 */}
              <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                <AppleFilled 
                  style={{ fontSize: '24px', color: '#fff', cursor: 'pointer' }} 
                  onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} 
                />
              </div>
              
              {/* 右侧导航菜单 */}
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
                    key: 'charts',
                    icon: <AreaChartOutlined />,
                    label: <Link to="/charts">图表</Link>,
                  },
                ]}
                style={{ 
                  backgroundColor: 'transparent', 
                  borderBottom: 'none',
                  marginRight: '24px',
                }}
                className="custom-menu"
              />
            </div>
          </header>
          <main className="app-main">
            <Routes>
              <Route path="/" element={<RecordList />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/charts" element={<ChartPage />} />
            </Routes>
          </main>
          <footer className="app-footer" style={{ textAlign: 'center' }}>
            <AppleFilled 
              style={{ fontSize: '24px', cursor: 'pointer' }} 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            />
          </footer>
        </div>
      </ConfigProvider>
    </Router>
  );
}

export default App;
