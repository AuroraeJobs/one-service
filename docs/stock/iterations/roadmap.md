# Stock Module Roadmap

Last updated: 2026-07-03

## Purpose

Build the stock feature from a simple real-time quote lookup into a durable personal investment module. The module should support market data, watchlists, historical trends, positions, return analysis, and alerts while keeping the frontend independent from any single third-party data provider.

## Current Baseline

The project already has an initial stock quote integration:

- Backend quote DTO: `one-record/one-record-model/src/main/java/com/one/record/stock/StockQuote.java`
- Backend service interface: `one-record/one-record-interface/src/main/java/com/one/record/service/IStockMarketService.java`
- Backend provider implementation: `one-record/one-record-service/src/main/java/com/one/record/service/impl/StockMarketService.java`
- Backend controller: `one-record/one-record-web/src/main/java/com/one/record/web/StockMarketController.java`
- Frontend API client: `one-web/src/services/api.ts`
- Frontend page: `one-web/src/components/LifeInvestmentPage.tsx`

Current endpoints:

```text
GET /stock/quote?symbol=600519
GET /stock/quotes?symbols=sh000001&symbols=sz399001
```

Current third-party provider:

```text
Sina quote API: https://hq.sinajs.cn/list=
```

## Product Direction

The intended product path is:

```text
real-time quotes -> watchlist -> historical charts -> positions and PnL -> alerts and analysis
```

The module should eventually become a personal investment cockpit inside the life/investment area of the app.

## Non-Negotiable Architecture Principle

Stock data sources must be switchable. Upper-layer features must not depend on Sina, Tencent, Eastmoney, Tushare, or any other concrete provider.

Rules:

- Controllers expose project-owned `/stock/*` APIs only.
- Frontend calls only project-owned `/stock/*` APIs.
- Domain services depend on provider interfaces, not provider implementations.
- Provider-specific request parameters, response formats, charset handling, and parsing stay inside provider implementations.
- Internal DTOs such as `StockQuote` and future `StockKLine` remain provider-neutral.
- Adding or switching a provider should not require frontend changes.
- Provider selection should be configuration-driven or strategy-driven.
- Storage is MongoDB plus Redis: MongoDB for persisted domain and historical data, Redis for quote cache, short-lived state, locks, and fallback snapshots.

## One-Month Iteration Plan

### Week 1: Quote Foundation And Watchlist

Goal: make quotes stable, useful, and user-owned.

Deliverables:

- Add stock watchlist CRUD.
- Save user-selected symbols instead of relying on hard-coded defaults.
- Support symbol normalization for `600519`, `sh600519`, `000001`, `sz000001`.
- Add Redis quote cache with short TTL.
- Return the latest cached quote when the third-party provider fails.
- Add quote status fields: source, source symbol, fetched time, available, message.
- Add frontend watchlist management: add, remove, refresh, empty state.
- Keep the current manual quote input as a debugging or quick lookup surface.

Suggested backend endpoints:

```text
GET    /stock/watchlist
POST   /stock/watchlist
DELETE /stock/watchlist/{symbol}
PUT    /stock/watchlist/order
GET    /stock/quotes
POST   /stock/quotes/refresh
```

Suggested model:

```text
StockWatchlist
- id
- userId
- symbol
- market
- code
- name
- sortOrder
- createdAt
- updatedAt
```

### Week 2: Historical Data And Charts

Goal: move from "current price" to "trend understanding".

Deliverables:

- Add daily K-line data model.
- Persist historical OHLCV data.
- Add manual sync endpoint for historical quotes.
- Add scheduled daily sync after market close.
- Add detail page for one symbol.
- Add line chart, candlestick chart, and volume chart.
- Add MA5, MA10, and MA20 overlays.

Suggested backend endpoints:

```text
GET  /stock/{symbol}
GET  /stock/{symbol}/klines?period=day&startDate=2026-01-01&endDate=2026-07-03
POST /stock/{symbol}/klines/sync
POST /stock/klines/sync
```

Suggested model:

```text
StockKLine
- id
- symbol
- market
- code
- period
- tradeDate
- open
- high
- low
- close
- previousClose
- changeAmount
- changePercent
- volume
- amount
- source
- createdAt
- updatedAt
```

### Week 3: Positions, Trades, And Returns

Goal: connect market data to personal investment records.

Deliverables:

- Add account model.
- Add position model.
- Add trade record model.
- Support buy, sell, dividend, fee, bonus share, split.
- Calculate current market value.
- Calculate floating PnL, floating PnL percent, today PnL, total invested amount.
- Add investment dashboard cards.
- Add holdings table sorted by market value, PnL, or daily change.

Suggested backend endpoints:

```text
GET    /stock/accounts
POST   /stock/accounts
GET    /stock/positions
POST   /stock/positions
GET    /stock/trades
POST   /stock/trades
DELETE /stock/trades/{id}
GET    /stock/portfolio/summary
```

Suggested models:

```text
StockAccount
- id
- userId
- name
- provider
- currency
- createdAt
- updatedAt

StockPosition
- id
- userId
- accountId
- symbol
- quantity
- costPrice
- costAmount
- createdAt
- updatedAt

StockTrade
- id
- userId
- accountId
- symbol
- tradeType
- tradeDateTime
- price
- quantity
- fee
- amount
- note
- createdAt
- updatedAt
```

### Week 4: Analysis, Alerts, And Provider Abstraction

Goal: make the module useful for daily monitoring and future provider changes.

Deliverables:

- Add price alerts.
- Add daily percent-change alerts.
- Add volume abnormality alerts.
- Add rule evaluation job.
- Add analysis cards: concentration, volatility, drawdown, top gainers, top losers.
- Add provider abstraction so Sina can be replaced or supplemented without changing frontend contracts.
- Add provider health status endpoint.

Suggested backend endpoints:

```text
GET    /stock/alerts
POST   /stock/alerts
PUT    /stock/alerts/{id}
DELETE /stock/alerts/{id}
POST   /stock/alerts/evaluate
GET    /stock/analysis/summary
GET    /stock/providers/status
```

Provider abstraction:

```text
StockMarketProvider
- String providerName()
- StockQuote quote(String symbol)
- List<StockQuote> quotes(List<String> symbols)
- List<StockKLine> klines(String symbol, StockKLineQuery query)
- boolean supports(String market)
```

## Architecture Notes

Keep the service boundary like this:

```text
Controller -> IStockMarketService -> provider/cache/repository implementation
```

The frontend should only call project-owned APIs under `/stock/*`. It should never call third-party quote providers directly.

Target provider boundary:

```text
Controller
-> IStockMarketService
-> StockMarketProviderRouter
-> StockMarketProvider
-> SinaStockMarketProvider / TencentStockMarketProvider / EastmoneyStockMarketProvider / ...
```

Separate these responsibilities:

- Provider: third-party protocol and parsing.
- Cache: freshness, fallback, TTL.
- Repository: user-owned and historical data.
- Domain service: calculations and aggregation.
- Controller: HTTP contract only.

Storage responsibilities:

- MongoDB stores durable data: watchlists, stock metadata, K-lines, accounts, positions, trades, alert rules, alert history, and sync logs.
- Redis stores volatile data: latest quotes, last successful quote snapshots, provider health status, sync locks, refresh throttling keys, and short-lived calculation caches.
- Do not introduce another persistent storage engine for the stock module unless this roadmap is explicitly updated.

Suggested Redis key style:

```text
stock:quote:{symbol}
stock:quote:last-success:{symbol}
stock:provider:health:{provider}
stock:sync:lock:{jobName}
stock:alerts:last-evaluated:{ruleId}
```

Detailed technical decisions and key logic are maintained in:

```text
docs/stock/modules/technical-design.md
```

## Data Source Strategy

Start with Sina for A-share quote availability. Prepare the provider layer so that future sources can be added:

- Tencent Finance
- Eastmoney
- Tushare
- Alpha Vantage
- Polygon
- Official broker APIs, if credentials become available

Do not hard-code provider-specific field names into frontend types. Normalize into project DTOs.

Provider switching requirements:

- Configure active provider with `stock.market.provider`.
- Support future fallback provider list with `stock.market.fallback-providers`.
- Add `GET /stock/providers/status` before or during Week 4.
- Include `source` and `sourceSymbol` in DTOs for observability, but do not let callers branch business logic on a concrete source.

## Validation Strategy

Backend:

- Unit test symbol normalization.
- Unit test Sina quote parsing with fixture text.
- Unit test unavailable quote behavior.
- Integration test controller parameter binding for repeated `symbols`.
- Verify Redis fallback when provider request fails.

Frontend:

- Lint changed files.
- Verify watchlist empty, loading, error, and populated states.
- Verify responsive layout for mobile and desktop.
- Verify table and chart do not overflow.

Known current blockers:

- Full frontend build currently has pre-existing TypeScript errors in unrelated health and hexagram pages.
- Backend compile requires JDK 21. Java 8 fails with `invalid target release: 21`.

## Delivery Rule

After each completed milestone:

1. Update `docs/stock/iterations/checklist.md`.
2. Review `git status --short` and `git diff --stat`.
3. Commit with a clear stock-module message.
4. Push the branch to the remote.

## Next Recommended Work

The first one-month plan is complete. Continue with:

```text
docs/stock/iterations/05-trade-recalculation-and-kline-provider.md
```

Recommended order:

1. Implement trade-driven position recalculation with tests.
2. Trigger recalculation after trade create, update, and delete.
3. Add manual recalculation endpoints for recovery/debugging.
4. Add K-line provider interface/router and one concrete daily provider.
5. Wire manual and scheduled K-line sync to the provider router.
