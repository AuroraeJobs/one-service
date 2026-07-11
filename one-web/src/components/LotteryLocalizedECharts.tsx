import { useMemo } from 'react';
import ReactECharts, { type EChartsReactProps } from 'echarts-for-react';
import { useI18n } from '../contexts/I18nContext';

type UnknownFunction = (this: unknown, ...args: unknown[]) => unknown;
type TranslateText = (source: string) => string;

const localizeChartValue = (
  value: unknown,
  seen: WeakMap<object, unknown>,
  translateText: TranslateText,
): unknown => {
  if (typeof value === 'string') {
    return translateText(value);
  }

  if (typeof value === 'function') {
    const formatter = value as UnknownFunction;
    return function localizedChartFormatter(this: unknown, ...args: unknown[]) {
      return localizeChartValue(formatter.apply(this, args), new WeakMap(), translateText);
    };
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const cached = seen.get(value);
  if (cached) return cached;

  if (Array.isArray(value)) {
    const localized: unknown[] = [];
    seen.set(value, localized);
    value.forEach(item => localized.push(localizeChartValue(item, seen, translateText)));
    return localized;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    return value;
  }

  const localized: Record<string, unknown> = {};
  seen.set(value, localized);
  Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
    localized[key] = localizeChartValue(item, seen, translateText);
  });
  return localized;
};

const localizeLotteryChartOption = (option: unknown, translateText: TranslateText) => (
  localizeChartValue(option, new WeakMap(), translateText)
);

const LotteryLocalizedECharts = ({ option, loadingOption, ...props }: EChartsReactProps) => {
  const { language, defaultLanguage, translateText } = useI18n();
  const shouldTranslate = language !== defaultLanguage;
  const localizedOption = useMemo(
    () => shouldTranslate ? localizeLotteryChartOption(option, translateText) : option,
    [option, shouldTranslate, translateText]
  );
  const localizedLoadingOption = useMemo(
    () => shouldTranslate ? localizeLotteryChartOption(loadingOption, translateText) : loadingOption,
    [loadingOption, shouldTranslate, translateText]
  );

  return (
    <ReactECharts
      {...props}
      option={localizedOption}
      loadingOption={localizedLoadingOption}
    />
  );
};

export default LotteryLocalizedECharts;
