import type { Locale as AntdLocale } from 'antd/es/locale';

export type TranslationValue = string | number;
export type TranslationParams = Record<string, TranslationValue>;
export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
export type PluralMessage = Partial<Record<PluralCategory, string>> & { other: string };
export type MessageTemplate = string | PluralMessage;

export interface LocaleDefinition {
  code: string;
  name: string;
  nativeName: string;
  antdLocale: AntdLocale;
  direction?: 'ltr' | 'rtl';
  order?: number;
  translateText: (source: string, params?: TranslationParams) => string;
}

export interface LocaleSource {
  code: string;
  name: string;
  nativeName: string;
  antdLocale: AntdLocale;
  messages?: Record<string, MessageTemplate>;
  fallbackTranslate?: (source: string) => string;
  direction?: 'ltr' | 'rtl';
  order?: number;
}
