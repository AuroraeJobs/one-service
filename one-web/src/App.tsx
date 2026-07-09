import { useEffect, useMemo, useState } from 'react';
import { ConfigProvider, theme } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedPage from './components/ProtectedPage';
import { RecordProvider } from './contexts/RecordContext';
import { AuthProvider } from './contexts/AuthContext';
import { AppPreferencesProvider } from './contexts/AppPreferencesContext';
import { createProtectedRoutes } from './routes/lifeRoutes';
import type { AppLanguage, ColorMode } from './types/appPreferences';
import './App.css';

const appLocales = {
  'zh-CN': zhCN,
  'en-US': enUS,
} as const;

function App() {
  // Tab显示/隐藏状态，提升到App组件中，以便页脚图标可以控制
  const [isTabVisible] = useState(false);
  const [colorMode, setColorMode] = useState<ColorMode>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem('aurorae-color-mode') as ColorMode | null) || 'dark';
  });
  const [language, setLanguage] = useState<AppLanguage>(() => {
    if (typeof window === 'undefined') return 'zh-CN';
    return (localStorage.getItem('aurorae-language') as AppLanguage | null) || 'zh-CN';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = colorMode;
    localStorage.setItem('aurorae-color-mode', colorMode);
  }, [colorMode]);

  const toggleColorMode = () => {
    setColorMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.language = language;
    localStorage.setItem('aurorae-language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh-CN' ? 'en-US' : 'zh-CN');
  };

  const protectedRoutes = useMemo(() => createProtectedRoutes(isTabVisible), [isTabVisible]);
  
  return (
    <Router>
      <AuthProvider>
        <RecordProvider>
          <ConfigProvider
            locale={appLocales[language]}
            theme={{
              algorithm: colorMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
              token: {
                colorPrimary: '#1890ff',
                borderRadius: 6,
              },
            }}
          >
            <AppPreferencesProvider
              colorMode={colorMode}
              language={language}
              isEnglish={language === 'en-US'}
              onToggleColorMode={toggleColorMode}
              onToggleLanguage={toggleLanguage}
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
                        <ProtectedPage>
                          {route.element}
                        </ProtectedPage>
                      }
                    />
                  ))}
                </Routes>
              </div>
            </AppPreferencesProvider>
          </ConfigProvider>
        </RecordProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
