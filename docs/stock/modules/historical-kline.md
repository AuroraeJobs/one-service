# Module: Historical K-Line And Charts

Last updated: 2026-07-03

## Purpose

Persist historical OHLCV data for trend charts, analysis, and later return calculations.

## Storage

MongoDB collections:

```text
stock_klines
stock_kline_sync_logs
```

K-line uniqueness:

```text
symbol + period + tradeDate
```

Current K-line fields:

```text
symbol
market
code
period
tradeDate
open
close
high
low
volume
amount
changeAmount
changePercent
source
createdAt
updatedAt
```

Sync log fields:

```text
jobName
symbol
period
status
requestedCount
savedCount
message
startedAt
finishedAt
```

## Sync Flow

```text
1. Acquire Redis sync lock.
2. Determine missing date range from MongoDB.
3. Fetch K-line data through provider interface.
4. Normalize OHLCV fields.
5. Upsert by symbol + period + tradeDate.
6. Write sync log to MongoDB.
7. Release Redis lock.
```

## Rules

- `tradeDate` is a trading-day identifier such as `2026-07-03`, not a timezone-bound timestamp.
- `createdAt` and `updatedAt` are millisecond timestamps.
- Service normalizes `symbol`, `market`, and `code` before persistence.
- Manual sync writes `RUNNING`, `SUCCESS`, or `FAILED` status.
- Scheduled daily sync currently records `SKIPPED` logs until a historical provider is connected.
- Historical third-party fetching should be added behind provider/router abstractions.

## Next Iteration: Provider-Based Sync

Iteration 05 should connect historical sync to a switchable provider:

- Add a K-line provider interface that returns normalized `StockKLine` rows.
- Add provider selection/fallback behavior consistent with quote providers.
- Keep provider-specific field mapping and date parsing inside provider implementations.
- Let manual sync fetch provider rows when rows are not supplied in the request.
- Let scheduled sync fetch configured symbols instead of recording only `SKIPPED`.
- Keep Redis sync locks and MongoDB sync logs.

## API Surface

```text
GET /stock/{symbol}/klines
POST /stock/{symbol}/klines/sync
POST /stock/klines/sync
GET /stock/klines/sync-logs
```

## Frontend

- Route: `/investments/stocks/:symbol`.
- Uses internal APIs only: `GET /stock/quote` and `GET /stock/{symbol}/klines`.
- Uses `echarts-for-react`.
- Renders candlestick, volume, MA5, MA10, and MA20.
