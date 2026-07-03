# Stock Module Technical Design

Last updated: 2026-07-03

This document records the evolving technical design and key logic for the stock module. Keep it updated whenever architecture, storage, provider behavior, calculation rules, or important implementation decisions change.

## Design Goals

- Keep stock data sources switchable.
- Keep upper-layer features independent from concrete providers.
- Use MongoDB for persisted domain and historical data.
- Use Redis for volatile real-time data and operational state.
- Normalize third-party market data into project-owned DTOs.
- Make quote, watchlist, position, alert, and analysis features reusable across data providers.

## Layering

Target layering:

```text
Frontend
-> /stock/* HTTP APIs
-> Controller
-> Domain Service
-> Provider Router / Cache / Repository
-> Provider Implementations / MongoDB / Redis
```

Provider-specific code must stay below the domain service boundary.

Forbidden dependencies:

```text
Frontend -> Sina/Tencent/Eastmoney API
Controller -> Sina parser
Watchlist/Position/Alert/Analysis -> concrete provider implementation
Domain DTO -> provider-specific field naming
```

Allowed dependencies:

```text
Frontend -> normalized project DTOs
Controller -> service interfaces
Domain Service -> provider interfaces
Provider Implementation -> third-party API protocol and parsing
Repository -> MongoDB models
Cache service -> Redis keys
```

## Provider Abstraction

Target provider interface:

```java
public interface StockMarketProvider {
    String providerName();

    boolean supports(String market);

    StockQuote quote(String symbol);

    List<StockQuote> quotes(List<String> symbols);

    List<StockKLine> klines(String symbol, StockKLineQuery query);

    StockProviderHealth health();
}
```

Target provider router:

```text
StockMarketProviderRouter
- reads configured provider order
- chooses active provider
- optionally tries fallback providers
- returns normalized DTOs only
- records provider health in Redis
```

Configuration direction:

```yaml
stock:
  market:
    provider: sina
    fallback-providers:
      - tencent
      - eastmoney
```

Provider switching rule:

Changing `stock.market.provider` should not require changing controllers, frontend pages, watchlist logic, position logic, alert logic, or analysis logic.

## Symbol Normalization

Initial A-share normalization:

```text
600519   -> sh600519
900901   -> sh900901
000001   -> sz000001
300750   -> sz300750
sh600519 -> sh600519
sz000001 -> sz000001
```

Rules:

- Normalize at the service/provider boundary.
- Store normalized `symbol`, `market`, and `code`.
- Preserve `sourceSymbol` for observability.
- Do not let frontend infer market rules.

Future extension:

```text
hk00700
usAAPL
fund000001
indexsh000001
```

Add these only through a centralized symbol parser, not scattered string checks.

## Storage Design

Storage is fixed as MongoDB plus Redis.

MongoDB stores durable state:

- Stock metadata.
- Watchlists.
- Historical K-lines.
- Accounts.
- Positions.
- Trades.
- Alert rules.
- Alert history.
- Sync logs.

Redis stores volatile state:

- Latest quote cache.
- Last successful quote fallback snapshot.
- Provider health.
- Sync locks.
- Refresh throttling.
- Alert last-evaluated state.
- Short-lived calculation cache.

Do not add another persistent storage engine for the stock module unless the roadmap is explicitly updated.

Current Redis cache implementation:

```text
stock:quote:{symbol}
- latest successful quote
- short TTL
- used before calling provider

stock:quote:last-success:{symbol}
- last successful quote snapshot
- longer TTL
- used when provider request fails or provider returns unavailable data
```

Current cache configuration:

```yaml
stock:
  market:
    cache-enabled: true
    quote-cache-ttl-seconds: 10
    fallback-cache-ttl-seconds: 604800
```

## Redis Key Plan

Use namespaced keys:

```text
stock:quote:{symbol}
stock:quote:last-success:{symbol}
stock:provider:health:{provider}
stock:sync:lock:{jobName}
stock:sync:last-run:{jobName}
stock:alerts:last-evaluated:{ruleId}
stock:portfolio:summary:{userId}
```

Quote TTL direction:

```text
Trading time: short TTL, for example 3-15 seconds.
Non-trading time: longer TTL, for example 5-30 minutes.
Fallback snapshot: longer TTL or no TTL, depending on storage pressure.
```

The exact TTL should be configurable.

## Quote Fetch Logic

Target quote flow:

```text
1. Receive symbols from frontend.
2. Normalize symbols.
3. Check Redis latest quote cache.
4. For cache misses, call provider router.
5. Provider router calls active provider.
6. Active provider returns normalized StockQuote.
7. Save latest quote to Redis.
8. Save successful quote to last-success Redis snapshot.
9. Return quotes in requested order.
```

Provider failure flow:

```text
1. Provider request fails or response is invalid.
2. Read stock:quote:last-success:{symbol}.
3. If fallback exists, return it with available=true or stale=true depending on future DTO design.
4. Include a message explaining that cached fallback data is used.
5. If fallback does not exist, return unavailable quote with message.
```

Future DTO field to consider:

```text
stale: boolean
staleReason: string
```

Implemented DTO stale fields:

```text
stale
staleReason
```

Current behavior:

- Successful provider quotes are written to both latest and last-success Redis keys.
- Latest cache hits are returned before calling the provider.
- Provider request failures try last-success fallback for every missing symbol.
- Provider unavailable responses also try last-success fallback for that symbol.
- Fallback quotes set `stale=true` and include a `staleReason`.
- Quote cache JSON is written through `JsonUtil`.
- Quote time fields use millisecond timestamps, for example `fetchedAt: 1783065600000`, rather than timezone-bound date/time objects.

## JSON And Time Rules

- Use `com.one.common.util.JsonUtil` for service-layer JSON serialization, deserialization, JSON tree parsing, and JSON file writing.
- Do not inject or instantiate `ObjectMapper` in business services for ad hoc JSON conversion.
- Use millisecond timestamps for stock module API/cache time fields.
- Do not expose `LocalDateTime` in stock quote, watchlist, provider health, sync, alert, or analysis DTOs.
- Frontend can format timestamps for display with the user's runtime locale, but backend API contracts should stay timezone-neutral.

Current verification:

- `StockMarketServiceTest.normalizeSymbolAddsMarketPrefixForAShares` covers the initial A-share normalization rules.
- `StockMarketServiceTest.quotesParsesSinaResponseIntoNormalizedQuote` covers GBK Sina payload parsing into the project-owned `StockQuote` DTO.
- `StockMarketServiceTest.quotesWritesFetchedAtQuoteToRedisCache` covers Redis serialization for quotes that contain numeric `fetchedAt`.
- `StockMarketServiceTest.quotesReturnsLastSuccessCacheWhenProviderFails` covers provider error fallback to `stock:quote:last-success:{symbol}`.
- Maven Surefire is pinned to `3.2.5` in the root POM so these JUnit Platform tests are executed.

## Watchlist Logic

Watchlist flow:

```text
1. User adds symbol.
2. Backend normalizes symbol.
3. Backend fetches quote or metadata to fill name if available.
4. Backend writes watchlist item to MongoDB.
5. Duplicate normalized symbol is rejected or treated as idempotent success.
6. Frontend reloads watchlist.
7. Frontend requests quotes for watchlist symbols.
```

## K-Line Logic

Initial K-line storage:

```text
collection: stock_klines
unique key: symbol + period + tradeDate
```

Sync log storage:

```text
collection: stock_kline_sync_logs
```

Current fields:

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

Rules:

- `tradeDate` is a trading-day identifier such as `2026-07-03`, not a timezone-bound timestamp.
- `createdAt` and `updatedAt` are millisecond timestamps.
- The service normalizes `symbol`, `market`, and `code` before persistence.
- The first backend iteration supports manual sync/upsert through internal APIs.
- Manual sync writes a MongoDB sync log with `RUNNING`, `SUCCESS`, or `FAILED` status.
- Manual sync uses Redis locks with keys like `stock:sync:lock:kline:{symbol}` and a short TTL.
- Scheduled daily sync is enabled by Spring scheduling and configured with `stock.market.kline-sync-cron`.
- Scheduled daily sync currently writes a `SKIPPED` log because the historical K-line provider is intentionally not bound directly to the scheduler.
- Historical third-party provider fetching should be added behind provider/router abstractions, not directly in controllers.

Frontend stock detail:

- `/investments` owns the watchlist table and navigates rows to `/investments/stocks/:symbol`.
- `/investments/stocks/:symbol` consumes only internal APIs: `GET /stock/quote` and `GET /stock/{symbol}/klines`.
- The detail page renders quote metrics from `StockQuote` and chart series from normalized `StockKLine`; it does not know the concrete market data provider.
- K-line visualization uses `echarts-for-react` with candlestick, volume, MA5, MA10, and MA20 series.

Portfolio storage:

```text
stock_accounts
- userId
- name
- broker
- accountNo
- currency
- cashBalance
- status
- createdAt
- updatedAt

stock_positions
- userId
- accountId
- symbol
- market
- code
- name
- quantity
- availableQuantity
- costPrice
- costAmount
- openedAt
- createdAt
- updatedAt

stock_trades
- userId
- accountId
- symbol
- market
- code
- name
- tradeType
- quantity
- price
- amount
- fee
- tax
- tradedAt
- remark
- createdAt
- updatedAt
```

Portfolio rules:

- Portfolio state is persisted in MongoDB.
- `createdAt`, `updatedAt`, `openedAt`, and `tradedAt` are millisecond timestamps.
- Account, position, and trade controllers depend on `IStockPortfolioService`, not provider implementations.
- Position and trade symbols are normalized through the stock market service contract before persistence.
- Supported trade types are `BUY`, `SELL`, `DIVIDEND`, `FEE`, `BONUS_SHARE`, and `SPLIT`.
- Current iteration stores manually maintained positions and trade records. Derived position recalculation from trades comes next.

Portfolio summary:

- Endpoint: `GET /stock/portfolio/summary`.
- Source of persisted state: MongoDB `stock_positions`.
- Source of market data: `IStockMarketService.quotes`, returning normalized `StockQuote`.
- Current market value: `quantity * latestPrice`.
- Floating PnL: `marketValue - costAmount`.
- Floating PnL percent: `floatingPnl / costAmount * 100`; zero when `costAmount` is zero.
- Today PnL: `quantity * quote.changeAmount`.
- Holding rows are returned sorted by `marketValue` descending, then `symbol` ascending.
- If quote data is unavailable, latest price and market-derived PnL default to zero while `quoteAvailable` marks the row state.
- The investment dashboard consumes `stockApi.portfolioSummary` for summary cards and the holdings table. It does not recalculate portfolio metrics in the browser.

Alert storage:

```text
stock_alert_rules
- userId
- symbol
- market
- code
- name
- ruleType
- direction
- targetValue
- enabled
- throttleSeconds
- lastTriggeredAt
- createdAt
- updatedAt

stock_alert_history
- userId
- ruleId
- symbol
- ruleType
- direction
- targetValue
- triggerValue
- message
- triggeredAt
- createdAt
```

Alert rules:

- Rule CRUD endpoints live under `/stock/alerts/rules`.
- Recent trigger history is queried through `/stock/alerts/history`.
- Rule symbols are normalized through `IStockMarketService`.
- Supported rule types are `PRICE`, `PERCENT_CHANGE`, and `VOLUME_ABNORMAL`.
- Supported directions are `ABOVE`, `BELOW`, `UP`, and `DOWN`.
- Evaluation, Redis throttling, and scheduled alert jobs come in the next alert iteration.

K-line sync configuration:

```yaml
stock:
  market:
    kline-sync-enabled: true
    kline-sync-cron: "0 30 15 * * MON-FRI"
    kline-sync-symbols:
      - sh000001
      - sz399001
      - sz399006
```

Ordering:

```text
sortOrder asc, createdAt asc
```

User ownership:

Initial option can be global if auth context is not ready. Final design should bind watchlists to `userId`.

Current implementation:

```text
StockWatchlist
- persisted in MongoDB collection stock_watchlist
- current userId is default
- duplicate key behavior is enforced by service lookup on userId + normalized symbol
- ordering uses sortOrder asc, createdAt asc
```

Current endpoints:

```text
GET    /stock/watchlist
POST   /stock/watchlist
DELETE /stock/watchlist/{symbol}
PUT    /stock/watchlist/order
```

Current frontend behavior:

```text
1. Load /stock/watchlist.
2. Fetch /stock/quotes for saved symbols.
3. Add input symbols to watchlist through /stock/watchlist.
4. Keep quick lookup separate from persisted watchlist.
5. Delete saved symbols through /stock/watchlist/{symbol}.
```

## K-Line Logic

Historical sync flow:

```text
1. Acquire Redis sync lock.
2. Determine missing date range from MongoDB.
3. Fetch K-line data through provider interface.
4. Normalize OHLCV fields.
5. Upsert by symbol + period + tradeDate.
6. Write sync log to MongoDB.
7. Release Redis lock.
```

K-line uniqueness:

```text
symbol + period + tradeDate
```

Periods:

```text
day
week
month
```

Start with `day`.

## Position And Trade Logic

Core formulas:

```text
marketValue = currentPrice * quantity
costAmount = sum(buy amount + fee) - sum(sell cost basis)
floatingPnL = marketValue - remainingCostAmount
floatingPnLPercent = floatingPnL / remainingCostAmount * 100
todayPnL = (currentPrice - previousClose) * quantity
```

Important notes:

- Keep calculation logic in backend domain services.
- Frontend displays calculated results instead of reimplementing portfolio math.
- Fees should be included in cost.
- Sell trades should reduce remaining quantity and cost basis.
- Dividends should be tracked separately from price PnL.

## Alert Logic

Alert evaluation flow:

```text
1. Load enabled alert rules from MongoDB.
2. Use Redis last-evaluated state to avoid excessive repeated notifications.
3. Fetch latest quotes through internal stock service.
4. Evaluate rules against normalized DTOs.
5. Write alert history to MongoDB.
6. Update Redis last-evaluated state.
```

Initial rule types:

```text
price_above
price_below
change_percent_above
change_percent_below
volume_abnormal
```

## Frontend Contract

Frontend should consume only normalized internal types:

```text
StockQuote
StockWatchlistItem
StockKLine
StockPositionSummary
StockAlertRule
```

Frontend should not:

- Know the active provider.
- Parse third-party response text.
- Build third-party URLs.
- Branch UI behavior on provider-specific fields.

Frontend may display:

- `source`
- `sourceSymbol`
- `fetchedAt`
- availability or stale-state messages

These are observability fields, not business logic switches.

## Verification Checklist For Design Changes

Before finishing a milestone, verify:

- Provider-specific code is isolated.
- MongoDB/Redis responsibilities are not mixed up.
- Frontend API contract remains provider-neutral.
- New models have clear ownership and unique keys.
- Redis keys are namespaced under `stock:`.
- Checklist and progress docs are updated.
- Commit and push are completed.
