import type { LocaleDefinition, LocaleSource, MessageTemplate, TranslationParams } from './types';

const interpolate = (template: string, params?: TranslationParams) => {
  if (!params) return template;
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (placeholder, key: string) => (
    Object.prototype.hasOwnProperty.call(params, key)
      ? String(params[key])
      : placeholder
  ));
};

const resolveMessage = (
  message: MessageTemplate,
  params: TranslationParams | undefined,
  pluralRules: Intl.PluralRules,
) => {
  if (typeof message === 'string') return message;
  const count = Number(params?.count);
  const category = Number.isFinite(count) ? pluralRules.select(count) : 'other';
  return message[category] ?? message.other;
};

export const defineLocale = ({
  messages = {},
  fallbackTranslate,
  direction = 'ltr',
  ...metadata
}: LocaleSource): LocaleDefinition => {
  const pluralRules = new Intl.PluralRules(metadata.code);

  return {
    ...metadata,
    direction,
    translateText: (source, params) => {
      const leading = source.match(/^\s*/)?.[0] ?? '';
      const trailing = source.match(/\s*$/)?.[0] ?? '';
      const key = source.trim();
      if (!key) return source;

      const message = messages[key];
      if (message) {
        return `${leading}${interpolate(resolveMessage(message, params, pluralRules), params)}${trailing}`;
      }

      // Compatibility translators operate on the rendered source sentence.
      // Interpolating first lets their number/status patterns handle legacy UI
      // while explicit locale messages remain the long-term source of truth.
      const interpolatedSource = interpolate(key, params);
      const translated = fallbackTranslate?.(interpolatedSource) ?? interpolatedSource;
      return `${leading}${translated}${trailing}`;
    },
  };
};
