import { useEffect, useMemo, useState } from 'react';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedPage from './components/ProtectedPage';
import { RecordProvider } from './contexts/RecordContext';
import { AuthProvider } from './contexts/AuthContext';
import { createProtectedRoutes } from './routes/lifeRoutes';
import './App.css';

function App() {
  // Tab显示/隐藏状态，提升到App组件中，以便页脚图标可以控制
  const [isTabVisible] = useState(false);
  const [colorMode, setColorMode] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem('aurorae-color-mode') as 'light' | 'dark' | null) || 'dark';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = colorMode;
    localStorage.setItem('aurorae-color-mode', colorMode);
  }, [colorMode]);

  const toggleColorMode = () => {
    setColorMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const protectedRoutes = useMemo(() => createProtectedRoutes(isTabVisible), [isTabVisible]);
  
  return (
    <Router>
      <AuthProvider>
        <RecordProvider>
          <ConfigProvider 
            locale={zhCN} 
            theme={{
              algorithm: colorMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
              token: {
                colorPrimary: '#1890ff',
                borderRadius: 6,
              },
            }}
          >
            <div className={`app-container app-theme-${colorMode}`}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                {protectedRoutes.map(route => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={
                      <ProtectedPage colorMode={colorMode} onToggleColorMode={toggleColorMode}>
                        {route.element}
                      </ProtectedPage>
                    }
                  />
                ))}
              </Routes>
            </div>
          </ConfigProvider>
        </RecordProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
