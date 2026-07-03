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
- Scheduled daily sync fetches configured symbols through `StockKLineProviderRouter`.
- Historical third-party fetching stays behind provider/router abstractions.

## Provider-Based Sync

Iteration 05 connects historical sync to a switchable provider:

- `StockKLineProvider` returns normalized `StockKLine` rows.
- `StockKLineProviderRouter` selects active and fallback providers using the same provider configuration as quote routing.
- `SinaStockKLineProvider` owns Sina daily K-line HTTP access and JSON parsing.
- Manual sync fetches provider rows when rows are not supplied in the request.
- Scheduled sync fetches configured symbols instead of recording only `SKIPPED`.
- Redis sync locks and MongoDB sync logs remain in the sync path.

Current provider configuration:

```yaml
stock:
  market:
    provider: sina
    fallback-providers: []
    sina-kline-url: https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData
```

## API Surface

```text
GET /stock/{symbol}/klines
POST /stock/{symbol}/klines/sync
POST /stock/klines/sync
POST /stock/klines/sync/scheduled
GET /stock/klines/sync-logs?status=FAILED&limit=50
GET /stock/klines/sync-summary?limit=50
```

`sync-logs` supports optional `symbol`, `status`, and `limit` filters. The service normalizes the symbol through `IStockMarketService`, uppercases status, and caps the log window at 100 before querying MongoDB.

## Frontend

- Route: `/investments/stocks/:symbol`.
- Uses internal APIs only: `GET /stock/quote` and `GET /stock/{symbol}/klines`.
- Uses `echarts-for-react`.
- Renders candlestick, volume, MA5, MA10, and MA20.

## Operations Routes

```text
/investments/klines
/investments/sync
```

Current UX:

- K-line page queries MongoDB-backed historical rows by symbol, period, and date range.
- Sync page can submit standardized K-line JSON to the existing sync APIs.
- Sync page can manually trigger scheduled-sync semantics through `POST /stock/klines/sync/scheduled`.
- Sync page can filter MongoDB sync logs by symbol, status, and 20/50/100 log windows.
- Sync page shows recent MongoDB sync logs, including status, requested/saved counts, messages, and timestamps.
- Sync page reads `GET /stock/klines/sync-summary` to show recent status, success/failure/running counts, saved rows, and latest completion time.
- Sync summary supports bounded windows of 20, 50, or 100 recent logs from the UI; backend caps the limit at 100.
- Provider-specific K-line fetching is still not exposed to the frontend; provider integration remains a backend Track B task.
