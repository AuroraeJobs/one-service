import type { StockQuote } from '../services/api';

export const formatPrice = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return value.toFixed(2);
};

export const formatMoney = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const formatSignedMoney = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatMoney(value)}`;
};

export const formatQuantity = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 4
  });
};

export const formatPercentValue = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return `${value.toFixed(2)}%`;
};

export const formatPercentSuffix = (value?: number) => {
  if (typeof value !== 'number') {
    return '';
  }
  const sign = value > 0 ? '+' : '';
  return ` / ${sign}${value.toFixed(2)}%`;
};

export const formatSignedPercent = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

export const formatTime = (value?: number) => {
  if (typeof value !== 'number') {
    return '-';
  }
  return new Date(value).toLocaleString();
};

export const formatAmount = (value?: number, unit = '亿') => {
  if (typeof value !== 'number' || value <= 0) {
    return '-';
  }
  return `${(value / 100000000).toFixed(2)} ${unit}`;
};

export const formatChangePercent = (quote?: StockQuote) => {
  if (!quote?.available || typeof quote.changePercent !== 'number') {
    return '-';
  }
  return formatSignedPercent(quote.changePercent);
};

export const pnlAccent = (value?: number) => {
  if (typeof value !== 'number') {
    return '#0071e3';
  }
  if (value > 0) {
    return '#f5222d';
  }
  if (value < 0) {
    return '#16a34a';
  }
  return '#0071e3';
};

export const quoteAccent = (quote?: StockQuote) => {
  if (!quote?.available || typeof quote.changeAmount !== 'number') {
    return '#0071e3';
  }
  if (quote.changeAmount > 0) {
    return '#f5222d';
  }
  if (quote.changeAmount < 0) {
    return '#16a34a';
  }
  return '#0071e3';
};
