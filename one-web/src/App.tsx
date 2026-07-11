import { useEffect, useMemo, useState } from 'react';
import { ConfigProvider, theme } from 'antd';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedPage from './components/ProtectedPage';
import AppTextLocalizer from './components/AppTextLocalizer';
import { RecordProvider } from './contexts/RecordContext';
import { AuthProvider } from './contexts/AuthContext';
import { AppPreferencesProvider } from './contexts/AppPreferencesContext';
import { I18nProvider } from './contexts/I18nContext';
import { createProtectedRoutes } from './routes/lifeRoutes';
import {
  defaultLanguage,
  getLocaleDefinition,
  isSupportedLanguage,
} from './i18n/registry';
import type { AppLanguage, ColorMode } from './types/appPreferences';
import './App.css';

function App() {
  // Tab显示/隐藏状态，提升到App组件中，以便页脚图标可以控制
  const [isTabVisible] = useState(false);
  const [colorMode, setColorMode] = useState<ColorMode>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem('aurorae-color-mode') as ColorMode | null) || 'dark';
  });
  const [language, setLanguage] = useState<AppLanguage>(() => {
    if (typeof window === 'undefined') return defaultLanguage;
    const storedLanguage = localStorage.getItem('aurorae-language');
    return isSupportedLanguage(storedLanguage) ? storedLanguage : defaultLanguage;
  });
  const locale = getLocaleDefinition(language);

  useEffect(() => {
    document.documentElement.dataset.theme = colorMode;
    localStorage.setItem('aurorae-color-mode', colorMode);
  }, [colorMode]);

  const toggleColorMode = () => {
    setColorMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    document.documentElement.lang = locale.code;
    document.documentElement.dir = locale.direction ?? 'ltr';
    document.documentElement.dataset.language = locale.code;
    localStorage.setItem('aurorae-language', locale.code);
  }, [locale]);

  const protectedRoutes = useMemo(() => createProtectedRoutes(isTabVisible), [isTabVisible]);
  
  return (
    <Router>
      <I18nProvider language={language} onLanguageChange={setLanguage}>
        <AuthProvider>
          <RecordProvider>
            <ConfigProvider
              locale={locale.antdLocale}
              direction={locale.direction}
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
                language={locale.code}
                isEnglish={locale.code === 'en-US'}
                onToggleColorMode={toggleColorMode}
              >
                <div className={`app-container app-theme-${colorMode}`}>
                  <AppTextLocalizer />
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
      </I18nProvider>
    </Router>
  );
}

export default App;
