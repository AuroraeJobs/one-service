# Iteration 02: Historical Data And Charts

Last updated: 2026-07-03

## Goal

Move from current quote lookup to trend understanding.

## Delivered

- Added `StockKLine` model.
- Added MongoDB-backed K-line repository.
- Added K-line query endpoint.
- Added manual single-symbol and batch sync endpoints.
- Persisted daily OHLCV data by normalized symbol, period, and trade date.
- Added MongoDB K-line sync logs.
- Added Redis locks to avoid duplicate sync jobs.
- Added scheduled daily sync after market close.
- Added stock detail route `/investments/stocks/:symbol`.
- Made quote table rows clickable.
- Added real-time quote header on detail page.
- Added candlestick, volume, MA5, MA10, and MA20 charts with `echarts-for-react`.

## API Surface

```text
GET /stock/{symbol}/klines
POST /stock/{symbol}/klines/sync
POST /stock/klines/sync
GET /stock/klines/sync-logs
```

## Storage

- MongoDB: `stock_klines`, `stock_kline_sync_logs`.
- Redis: `stock:sync:lock:kline:{symbol}` and scheduled sync lock keys.

## Related Module Docs

- [Historical K-line and charts](../modules/historical-kline.md)
- [Market data and provider switching](../modules/market-data-provider.md)
