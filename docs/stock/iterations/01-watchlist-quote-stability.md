# Iteration 01: Watchlist And Quote Stability

Last updated: 2026-07-03

## Goal

Make quotes stable, useful, cached, and user-owned through a persisted watchlist.

## Delivered

- Added MongoDB-backed `StockWatchlist`.
- Added watchlist repository, service, and controller.
- Implemented watchlist list, add, delete, and reorder APIs.
- Normalized symbols before persistence and quote fetching.
- Rejected or idempotently handled duplicate normalized symbols.
- Updated investment page to load watchlist first.
- Kept manual quote input as quick lookup/debugging.
- Added Redis latest quote cache.
- Added last-success fallback snapshots.
- Returned stale fallback metadata when provider data is unavailable.
- Added tests for symbol normalization, Sina parsing, cache timestamp serialization, provider fallback, and repeated `symbols` binding.

## API Surface

```text
GET /stock/watchlist
POST /stock/watchlist
DELETE /stock/watchlist/{symbol}
PUT /stock/watchlist/order
GET /stock/quote?symbol=600519
GET /stock/quotes?symbols=sh000001&symbols=sz399001
```

## Storage

- MongoDB: `stock_watchlist`.
- Redis: `stock:quote:{symbol}`, `stock:quote:last-success:{symbol}`.

## Acceptance

- `StockMarketServiceTest` covers normalization, Sina parsing, Redis timestamp serialization, and provider failure fallback.
- `StockMarketControllerTest` covers repeated `symbols` request params.

## Related Module Docs

- [Watchlist](../modules/watchlist.md)
- [Market data and provider switching](../modules/market-data-provider.md)
- [Storage, JSON, and time rules](../modules/storage-json-time.md)
