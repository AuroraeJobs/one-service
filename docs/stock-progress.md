# Stock Module Progress

Last updated: 2026-07-03

## How To Resume

When continuing in a new Codex thread, say:

```text
Continue the stock module from docs/stock-roadmap.md and docs/stock-progress.md.
Start with the next unchecked task.
```

First commands to run:

```bash
git status --short
rg -n "StockMarket|StockQuote|stockApi|实时行情" .
java -version
mvn -version
```

Task tracking file:

```text
docs/stock-checklist.md
```

When a task is finished, mark it as `[x]` in the checklist and add any short handoff note that would help the next thread.

Technical design file:

```text
docs/stock-technical-design.md
```

When key logic, provider behavior, storage responsibilities, calculation rules, or architecture decisions change, update the technical design document in the same milestone.

Delivery rule:

```text
After each completed milestone, review the diff, update docs/stock-checklist.md, commit, and push.
```

## Current State

Implemented baseline:

- Real-time stock quote DTO exists.
- Stock quote service interface exists.
- Sina quote provider implementation exists.
- Stock quote controller exists.
- Frontend `stockApi` exists.
- Investment page can request and display real-time quotes.

Architecture rule to preserve:

- Stock data sources must be switchable.
- Upper-layer functions must depend on project DTOs and service/provider interfaces, not a concrete source such as Sina.
- Frontend must call only internal `/stock/*` APIs.
- Provider-specific parsing and request details must stay behind provider implementations.
- Storage is MongoDB plus Redis.
- MongoDB is for persisted stock domain data and historical data.
- Redis is for quote cache, fallback snapshots, provider health, sync locks, throttling, and short-lived calculation state.

Current API surface:

```text
GET /stock/quote?symbol=600519
GET /stock/quotes?symbols=sh000001&symbols=sz399001
```

Current frontend page:

```text
one-web/src/components/LifeInvestmentPage.tsx
```

Current backend files:

```text
one-record/one-record-model/src/main/java/com/one/record/stock/StockQuote.java
one-record/one-record-interface/src/main/java/com/one/record/service/IStockMarketService.java
one-record/one-record-service/src/main/java/com/one/record/configuration/StockMarketProperties.java
one-record/one-record-service/src/main/java/com/one/record/service/impl/StockMarketService.java
one-record/one-record-web/src/main/java/com/one/record/web/StockMarketController.java
```

## Verification Notes

Successful:

```bash
npm exec eslint -- src/components/LifeInvestmentPage.tsx src/services/api.ts
```

Blocked:

```bash
npm run build
```

Reason: existing TypeScript errors in unrelated pages, including health and hexagram components.

Blocked:

```bash
mvn -pl one-record/one-record-service -am compile -DskipTests
```

Reason: local Java was 1.8 while the project targets Java 21.

Expected fix:

```bash
java -version
mvn -version
```

Both should show Java 21 before backend compile is retried.

## Next Task Queue

### Task 1: Add Watchlist Persistence

Status: not started

Goal:

Persist the user's stock watchlist so the investment page is not driven by hard-coded symbols.

Suggested files:

```text
one-record/one-record-model/src/main/java/com/one/record/stock/StockWatchlist.java
one-record/one-record-repository/src/main/java/com/one/record/repository/StockWatchlistRepository.java
one-record/one-record-interface/src/main/java/com/one/record/service/IStockWatchlistService.java
one-record/one-record-service/src/main/java/com/one/record/service/impl/StockWatchlistService.java
one-record/one-record-web/src/main/java/com/one/record/web/StockWatchlistController.java
```

Suggested endpoints:

```text
GET    /stock/watchlist
POST   /stock/watchlist
DELETE /stock/watchlist/{symbol}
PUT    /stock/watchlist/order
```

Acceptance criteria:

- Add a symbol to watchlist.
- Remove a symbol from watchlist.
- List watchlist ordered by `sortOrder`.
- Duplicate symbols are rejected or idempotently ignored.
- Frontend loads watchlist first, then requests quotes for those symbols.

### Task 2: Add Quote Cache

Status: not started

Goal:

Reduce third-party request pressure and provide fallback data.

Suggested behavior:

- Cache each quote by normalized symbol.
- Use a short TTL during trading hours.
- Use a longer TTL outside trading hours.
- On provider failure, return cached quote with a message that it is stale.

Suggested Redis keys:

```text
stock:quote:{symbol}
stock:quote:last-success:{symbol}
```

Acceptance criteria:

- Repeated quote calls can be served from cache.
- Provider failure does not blank the UI when a cached quote exists.
- Response includes `fetchedAt` and `message`.

### Task 3: Add Stock Detail Page

Status: not started

Goal:

Make each symbol clickable and show a richer detail view.

Suggested route:

```text
/investments/stocks/:symbol
```

Initial detail page sections:

- Real-time quote header.
- Price and percent change.
- Open, previous close, high, low, volume, amount.
- Placeholder area for K-line chart.

### Task 4: Add Historical K-Line Storage

Status: not started

Goal:

Store historical OHLCV data for charts and return analysis.

Suggested model:

```text
StockKLine
```

See `docs/stock-roadmap.md` for the field list.

### Task 5: Add Positions And Trades

Status: not started

Goal:

Connect market prices to personal holdings and PnL.

Suggested models:

```text
StockAccount
StockPosition
StockTrade
```

## Decisions

- Frontend should call only internal `/stock/*` APIs.
- Provider-specific parsing stays in service/provider implementation.
- Keep a normalized DTO contract for quotes.
- Start with A-share symbols and Sina provider.
- Prepare provider abstraction before adding a second data source.
- Do not add any new frontend or domain logic that branches on a concrete data source.
- Use MongoDB repositories for watchlists, K-lines, positions, trades, alerts, and sync logs.
- Use Redis for volatile real-time market data and operational state.

## Open Questions

- Should watchlist be global first, or tied to logged-in user from the security module?
- Which chart library should be primary for K-line: existing `echarts` is already installed in `one-web`.
- Should alerts be only in-app first, or also email/Gmail/other channels later?
