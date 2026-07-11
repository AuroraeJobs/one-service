import type { LocaleDefinition, TranslationParams } from './types';

interface LocaleModule {
  default: LocaleDefinition;
}

const discoveredModules = import.meta.glob<LocaleModule>('./locales/*.ts', {
  eager: true,
});

const discoveredLocales = Object.entries(discoveredModules)
  .map(([file, module]) => {
    if (!module.default?.code) {
      throw new Error(`Invalid locale module: ${file}`);
    }
    return module.default;
  })
  .sort((left, right) => (
    (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER)
    || left.code.localeCompare(right.code)
  ));

const localeMap = new Map<string, LocaleDefinition>();
discoveredLocales.forEach(locale => {
  if (localeMap.has(locale.code)) {
    throw new Error(`Duplicate locale code: ${locale.code}`);
  }
  localeMap.set(locale.code, locale);
});

export type AppLanguage = string;

export const defaultLanguage: AppLanguage = 'zh-CN';

if (!localeMap.has(defaultLanguage)) {
  throw new Error(`Default locale ${defaultLanguage} is not registered`);
}

export const supportedLocales = Object.freeze(discoveredLocales);

export const isSupportedLanguage = (value: unknown): value is AppLanguage => (
  typeof value === 'string' && localeMap.has(value)
);

export const getLocaleDefinition = (language: AppLanguage) => (
  localeMap.get(language) ?? localeMap.get(defaultLanguage)!
);

export const getNextLanguage = (language: AppLanguage): AppLanguage => {
  const currentIndex = supportedLocales.findIndex(locale => locale.code === language);
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % supportedLocales.length;
  return supportedLocales[nextIndex]?.code ?? defaultLanguage;
};

export const translateForLanguage = (
  language: AppLanguage,
  source: string,
  params?: TranslationParams,
) => getLocaleDefinition(language).translateText(source, params);

export type { LocaleDefinition, TranslationParams } from './types';
