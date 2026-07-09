import { createContext, useContext, type ReactNode } from 'react';
import type { AppLanguage, ColorMode } from '../types/appPreferences';

interface AppPreferencesContextValue {
  colorMode: ColorMode;
  language: AppLanguage;
  isEnglish: boolean;
  onToggleColorMode: () => void;
  onToggleLanguage: () => void;
}

const AppPreferencesContext = createContext<AppPreferencesContextValue | undefined>(undefined);

interface AppPreferencesProviderProps extends AppPreferencesContextValue {
  children: ReactNode;
}

export const AppPreferencesProvider = ({ children, ...value }: AppPreferencesProviderProps) => (
  <AppPreferencesContext.Provider value={value}>
    {children}
  </AppPreferencesContext.Provider>
);

// eslint-disable-next-line react-refresh/only-export-components
export const useAppPreferences = () => {
  const context = useContext(AppPreferencesContext);
  if (!context) {
    throw new Error('useAppPreferences must be used within an AppPreferencesProvider');
  }
  return context;
};
