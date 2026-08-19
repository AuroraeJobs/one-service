export const tradeTypeLabel = (value?: string, isEnglish = false) => {
  const labels: Record<string, string> = {
    BUY: isEnglish ? 'Buy' : '买入',
    SELL: isEnglish ? 'Sell' : '卖出',
    DIVIDEND: isEnglish ? 'Dividend' : '分红',
    FEE: isEnglish ? 'Fee' : '费用',
    BONUS_SHARE: isEnglish ? 'Bonus Share' : '送股',
    SPLIT: isEnglish ? 'Split' : '拆股'
  };
  return value ? labels[value] || value : '-';
};

export const tradeTypeColor = (value?: string) => {
  if (value === 'BUY' || value === 'BONUS_SHARE') {
    return 'red';
  }
  if (value === 'SELL' || value === 'FEE') {
    return 'green';
  }
  return 'blue';
};

export const ruleTypeLabel = (value?: string, isEnglish = false) => {
  const labels: Record<string, string> = {
    PRICE: isEnglish ? 'Price' : '价格',
    PERCENT_CHANGE: isEnglish ? 'Percent Change' : '涨跌幅',
    VOLUME_ABNORMAL: isEnglish ? 'Volume Anomaly' : '成交量异常'
  };
  return value ? labels[value] || value : '-';
};

export const directionLabel = (value?: string, isEnglish = false) => {
  const labels: Record<string, string> = {
    ABOVE: isEnglish ? 'Above/Upward' : '高于/向上',
    BELOW: isEnglish ? 'Below/Downward' : '低于/向下',
    UP: isEnglish ? 'Trigger on Rise' : '上涨触发',
    DOWN: isEnglish ? 'Trigger on Drop' : '下跌触发'
  };
  return value ? labels[value] || value : '-';
};

export const directionColor = (value?: string) => {
  if (value === 'ABOVE' || value === 'UP') {
    return 'red';
  }
  if (value === 'BELOW' || value === 'DOWN') {
    return 'green';
  }
  return 'blue';
};

export const providerCategoryLabel = (value?: string, isEnglish = false) => {
  if (value === 'kline') {
    return isEnglish ? 'K-Line' : 'K线';
  }
  if (value === 'quote') {
    return isEnglish ? 'Quote' : '行情';
  }
  return value || '-';
};
