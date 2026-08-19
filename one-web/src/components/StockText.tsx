import type { StockQuote } from '../services/api';
import { formatPercentSuffix, formatSignedMoney, pnlAccent, quoteAccent } from '../utils/stockFormat';

export const PnlText = ({ value, percent }: { value?: number; percent?: number }) => {
  if (typeof value !== 'number') {
    return <span>-</span>;
  }
  return (
    <span style={{ color: pnlAccent(value), fontWeight: 700 }}>
      {formatSignedMoney(value)}{formatPercentSuffix(percent)}
    </span>
  );
};

export const QuoteChange = ({ quote, className }: { quote?: StockQuote; className?: string }) => {
  if (!quote?.available || typeof quote.changeAmount !== 'number' || typeof quote.changePercent !== 'number') {
    return <span className={className}>-</span>;
  }
  const sign = quote.changeAmount > 0 ? '+' : '';
  return (
    <span className={className} style={{ color: quoteAccent(quote), fontWeight: 700 }}>
      {sign}{quote.changeAmount.toFixed(2)} / {sign}{quote.changePercent.toFixed(2)}%
    </span>
  );
};
