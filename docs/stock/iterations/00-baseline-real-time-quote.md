# Iteration 00: Baseline Real-Time Quote

Last updated: 2026-07-03

## Goal

Create the first internal stock quote path from frontend to backend.

## Delivered

- Added normalized `StockQuote` DTO.
- Added `IStockMarketService`.
- Added Sina-backed quote implementation.
- Added `StockMarketController`.
- Added frontend `stockApi`.
- Updated the investment page to request and display real-time quotes.
- Added stock market configuration in `application.yml`.

## API Surface

```text
GET /stock/quote?symbol=600519
GET /stock/quotes?symbols=sh000001&symbols=sz399001
```

## Key Notes

- This iteration started with Sina as the first provider.
- Upper layers should treat Sina as replaceable and consume only project-owned DTOs.
- Later iterations extracted provider switching behind `StockMarketProvider`.

## Related Module Docs

- [Market data and provider switching](../modules/market-data-provider.md)
- [Storage, JSON, and time rules](../modules/storage-json-time.md)
