import { ConfigProvider, Menu } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AppleFilled, SearchOutlined, BarChartOutlined } from '@ant-design/icons';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import RecordList from './components/RecordList';
import Statistics from './components/Statistics';
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
          <header className="app-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h1>
                <AppleFilled style={{ fontSize: '24px', marginLeft: '24px' }} />
              </h1>
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
                ]}
                style={{ 
                  backgroundColor: 'transparent', 
                  borderBottom: 'none',
                }}
                className="custom-menu"
              />
            </div>
          </header>
          <main className="app-main">
            <Routes>
              <Route path="/" element={<RecordList />} />
              <Route path="/statistics" element={<Statistics />} />
            </Routes>
          </main>
          <footer className="app-footer" style={{ textAlign: 'center' }}>
            <AppleFilled style={{ fontSize: '24px' }} />
          </footer>
        </div>
      </ConfigProvider>
    </Router>
  );
}

export default App;
