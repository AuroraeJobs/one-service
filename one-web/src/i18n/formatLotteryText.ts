import type { TranslationParams } from './types';

export type TranslateText = (source: string, params?: TranslationParams) => string;

export const localizeLotteryCombination = (
  combination: string,
  t: TranslateText,
  translateText: TranslateText,
) => {
  const match = combination.match(/^(\d+)奇(\d+)偶$/);
  return match
    ? t('{{odd}}奇{{even}}偶', { odd: match[1], even: match[2] })
    : translateText(combination);
};
