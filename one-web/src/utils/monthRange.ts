export interface MonthValue {
  year: number;
  month: number;
}

export type MonthRangeValue = [MonthValue, MonthValue];

export const monthToIndex = (value: MonthValue) => value.year * 12 + value.month - 1;

export const addMonths = (value: MonthValue, offset: number): MonthValue => {
  const nextIndex = monthToIndex(value) + offset;
  return {
    year: Math.floor(nextIndex / 12),
    month: (nextIndex % 12 + 12) % 12 + 1
  };
};

export const enumerateMonthRange = (range: MonthRangeValue): MonthValue[] => {
  const startIndex = monthToIndex(range[0]);
  const endIndex = monthToIndex(range[1]);
  return Array.from({ length: endIndex - startIndex + 1 }, (_, index) => addMonths(range[0], index));
};
