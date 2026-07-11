import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import {
  defaultLanguage,
  getLocaleDefinition,
  supportedLocales,
  type AppLanguage,
  type TranslationParams,
} from '../i18n/registry';

interface I18nContextValue {
  language: AppLanguage;
  defaultLanguage: AppLanguage;
  locale: ReturnType<typeof getLocaleDefinition>;
  supportedLocales: typeof supportedLocales;
  setLanguage: (language: AppLanguage) => void;
  t: (source: string, params?: TranslationParams) => string;
  translateText: (source: string, params?: TranslationParams) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  language: AppLanguage;
  onLanguageChange: (language: AppLanguage) => void;
}

export const I18nProvider = ({ children, language, onLanguageChange }: I18nProviderProps) => {
  const locale = useMemo(() => getLocaleDefinition(language), [language]);
  const translateText = useCallback(
    (source: string, params?: TranslationParams) => locale.translateText(source, params),
    [locale],
  );

  const value = useMemo<I18nContextValue>(() => ({
    language: locale.code,
    defaultLanguage,
    locale,
    supportedLocales,
    setLanguage: onLanguageChange,
    t: translateText,
    translateText,
  }), [locale, onLanguageChange, translateText]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
