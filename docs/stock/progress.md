# Stock Module Progress

Last updated: 2026-07-03

## How To Resume

When continuing in a new Codex thread, say:

```text
Continue the stock module from docs/stock/README.md.
Start with the next unchecked task in docs/stock/iterations/checklist.md.
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
docs/stock/iterations/checklist.md
```

When a task is finished, mark it as `[x]` in the checklist and add any short handoff note that would help the next thread.

Technical design file:

```text
docs/stock/modules/technical-design.md
```

Menu and version planning file:

```text
docs/stock/menu-and-version-plan.md
```

When key logic, provider behavior, storage responsibilities, calculation rules, or architecture decisions change, update the technical design document in the same milestone.

Delivery rule:

```text
After each completed milestone, review the diff, update docs/stock/iterations/checklist.md, commit, and push.
```

## Current State

Implemented baseline:

- Real-time stock quote DTO exists.
- Stock quote service interface exists.
- Sina quote provider implementation exists.
- Stock quote controller exists.
- Frontend `stockApi` exists.
- Investment page can request and display real-time quotes.
- MongoDB-backed stock watchlist exists.
- Stock watchlist service and controller exist.
- Investment page loads saved watchlist first and then fetches quotes for saved symbols.
- Manual quote input remains available for adding watchlist items and quick lookup.
- Redis quote cache exists for latest quotes and last successful fallback snapshots.
- Quote responses include stale metadata for fallback data.
- Investment page displays stale fallback messages when present.
- `StockMarketServiceTest` covers symbol normalization, Sina quote parsing, quote cache timestamp serialization, and provider failure fallback to last successful Redis cache.
- JSON conversion is centralized through `com.one.common.util.JsonUtil` for current service-layer Redis/API cache use cases.
- Stock quote and watchlist time fields use millisecond timestamps instead of `LocalDateTime`.
- Backend model/service timestamp fields have been migrated away from `LocalDateTime` to millisecond timestamps.
- `StockMarketControllerTest` verifies repeated `symbols` query params bind to `List<String>`.
- Initial MongoDB-backed K-line backend exists: `StockKLine`, repository, service, query endpoint, and manual sync/upsert endpoints.
- K-line manual sync writes MongoDB sync logs and uses Redis locks to avoid duplicate sync execution.
- K-line scheduled daily sync is wired with a configurable cron and Redis lock; it now fetches configured symbols through `StockKLineProviderRouter`.
- Frontend stock rows navigate to `/investments/stocks/:symbol`; the detail page loads normalized quote and K-line APIs, then renders a real-time quote header plus candlestick, volume, MA5, MA10, and MA20 charts through `echarts-for-react`.
- Stock portfolio foundation exists: MongoDB-backed account, position, and trade models plus CRUD endpoints for `/stock/accounts`, `/stock/positions`, and `/stock/trades`.
- Stock trade CRUD accepts `BUY`, `SELL`, `DIVIDEND`, `FEE`, `BONUS_SHARE`, and `SPLIT`; position and return calculations are intentionally deferred to the next iteration.
- Portfolio summary endpoint `GET /stock/portfolio/summary` calculates current market value, floating PnL, floating PnL percent, and today PnL from persisted positions plus normalized quote data.
- Investment page now loads `stockApi.portfolioSummary`, renders portfolio summary cards, and shows holdings sorted by backend market value/PnL calculations.
- `StockPortfolioServiceTest` covers account defaults, trade symbol normalization, unsupported trade type rejection, and portfolio summary calculations.
- Stock alert foundation exists: MongoDB-backed alert rule and alert history models, CRUD APIs for `/stock/alerts/rules`, and recent history query `/stock/alerts/history`.
- Alert evaluation exists for price, percent-change, and volume-abnormal rules. It writes trigger history to MongoDB and uses Redis for per-rule throttling plus last-evaluated state.
- Alert scheduled evaluation is configurable through `stock.market.alert-evaluation-enabled` and `stock.market.alert-evaluation-cron`.
- `StockAlertServiceTest` covers alert rule normalization/defaults, unsupported rule type rejection, history symbol filtering, alert evaluation, and throttling.
- Analysis summary endpoint `GET /stock/analysis/summary` returns concentration, recent volatility, recent drawdown, top gainers, and top losers from portfolio summary plus MongoDB K-line data.
- `StockAnalysisServiceTest` covers concentration, volatility, drawdown, and ranking calculations.
- Quote provider abstraction is implemented with `StockMarketProvider`, `StockMarketProviderRouter`, and `SinaStockMarketProvider`.
- Active quote provider is configured with `stock.market.provider`; fallback provider order is configured with `stock.market.fallback-providers`.
- Provider health endpoint `GET /stock/providers/health` reports configured and registered providers.
- Investment page responsive CSS has been tightened for desktop and mobile: stable metric grid, scrollable no-wrap tables, compact mobile cards, and full-width mobile toolbar controls.
- Root Maven Surefire is pinned to `3.2.5` so JUnit 5/JUnit Platform tests are discovered instead of being skipped by the old default plugin.
- Full frontend build now passes. Existing unrelated strict TypeScript errors were fixed in health/hexagram pages, and `one-web` was verified with `npm run build`.
- Iteration 05 has started. Portfolio recalculation service entry points and manual APIs are implemented, and trade create/update/delete now trigger recalculation for affected positions. Initial tests cover weighted-average buy/sell recalculation and delete-triggered recalculation.
- Stock menu and version planning has been documented. The target menu tree includes 总览、自选、行情、持仓、交易、个股、K线、告警、分析、数据源、同步、设置, with versions planned by menu capability.
- Menu V1 is implemented. The stock subnav now exposes 总览、自选、行情, routes `/investments/watchlist` and `/investments/market` are wired, and `/investments/stocks/:symbol` remains the 个股 detail route.
- Menu V2 first UX slice is implemented. Routes `/investments/positions` and `/investments/trades` are wired, the stock subnav exposes 持仓 and 交易, positions can be filtered/recalculated, and trades can be created/deleted from the UI.
- Menu V3 first UX slice is implemented. Routes `/investments/klines` and `/investments/sync` are wired, the stock subnav exposes K线 and 同步, K-line rows can be queried, Provider-backed sync is the primary action, standardized K-line JSON can still be submitted as an advanced fallback, and sync logs are visible.
- Menu V4 first UX slice is implemented. Route `/investments/alerts` is wired, the stock subnav exposes 告警, alert rules can be listed/created/deleted, enabled rules can be manually evaluated, and trigger history is visible.
- Menu V5 first UX slice is implemented. Route `/investments/analysis` is wired, the stock subnav exposes 分析, and analysis summary data is displayed for concentration, volatility, drawdown, top gainers, and top losers.
- Menu V6 first UX slice is implemented. Routes `/investments/providers` and `/investments/settings` are wired, provider health is visible, and settings boundaries are documented as read-only until preferences persistence is designed.
- Iteration 05 Track A calculation coverage is complete for the current DTO model. Holding and portfolio summaries now expose realized PnL and dividend income; tests cover buy, sell, fee, tax, dividend, bonus share, split, delete, and idempotent recalculation.
- Iteration 05 Track B first provider-backed sync slice is complete. K-line provider interface/router and Sina daily K-line provider are implemented; manual sync can fetch provider data with an empty request body, scheduled sync fetches configured symbols, and tests cover provider parsing plus sync upsert/logging.
- Iteration 06 is planned in `docs/stock/iterations/06-dashboard-detail-linkage.md`. The next focus is linking overview, symbol detail, alerts, analysis, holdings, trades, K-lines, and sync into a daily-use cockpit.
- Iteration 06 first detail-linkage slice is implemented. Linked stock pages read route query context, and symbol detail now shows holding summary, recent trades, active alerts, plus symbol-aware shortcuts.
- Iteration 06 overview cockpit slice is implemented. `/investments` now shows live portfolio, holdings, alert history, analysis, and provider health widgets from internal stock APIs.

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
GET /stock/providers/health
GET /stock/watchlist
POST /stock/watchlist
DELETE /stock/watchlist/{symbol}
PUT /stock/watchlist/order
GET /stock/{symbol}/klines
POST /stock/{symbol}/klines/sync
POST /stock/klines/sync
GET /stock/klines/sync-logs
GET /stock/accounts
POST /stock/accounts
PUT /stock/accounts/{id}
DELETE /stock/accounts/{id}
GET /stock/positions
POST /stock/positions
PUT /stock/positions/{id}
DELETE /stock/positions/{id}
GET /stock/trades
POST /stock/trades
PUT /stock/trades/{id}
DELETE /stock/trades/{id}
GET /stock/portfolio/summary
GET /stock/alerts/rules
POST /stock/alerts/rules
PUT /stock/alerts/rules/{id}
DELETE /stock/alerts/rules/{id}
GET /stock/alerts/history
POST /stock/alerts/evaluate
GET /stock/analysis/summary
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
one-record/one-record-interface/src/main/java/com/one/record/service/StockMarketProvider.java
one-record/one-record-service/src/main/java/com/one/record/service/impl/StockMarketProviderRouter.java
one-record/one-record-service/src/main/java/com/one/record/service/impl/SinaStockMarketProvider.java
one-record/one-record-web/src/main/java/com/one/record/web/StockMarketController.java
one-record/one-record-model/src/main/java/com/one/record/stock/StockWatchlist.java
one-record/one-record-repository/src/main/java/com/one/record/repository/StockWatchlistRepository.java
one-record/one-record-interface/src/main/java/com/one/record/service/IStockWatchlistService.java
one-record/one-record-service/src/main/java/com/one/record/service/impl/StockWatchlistService.java
one-record/one-record-web/src/main/java/com/one/record/web/StockWatchlistController.java
one-record/one-record-model/src/main/java/com/one/record/stock/StockKLine.java
one-record/one-record-model/src/main/java/com/one/record/stock/StockKLineSyncLog.java
one-record/one-record-repository/src/main/java/com/one/record/repository/StockKLineRepository.java
one-record/one-record-repository/src/main/java/com/one/record/repository/StockKLineSyncLogRepository.java
one-record/one-record-interface/src/main/java/com/one/record/service/IStockKLineService.java
one-record/one-record-service/src/main/java/com/one/record/service/impl/StockKLineService.java
one-record/one-record-web/src/main/java/com/one/record/web/StockKLineController.java
one-record/one-record-model/src/main/java/com/one/record/stock/StockAccount.java
one-record/one-record-model/src/main/java/com/one/record/stock/StockPosition.java
one-record/one-record-model/src/main/java/com/one/record/stock/StockTrade.java
one-record/one-record-model/src/main/java/com/one/record/stock/StockHoldingSummary.java
one-record/one-record-model/src/main/java/com/one/record/stock/StockPortfolioSummary.java
one-record/one-record-repository/src/main/java/com/one/record/repository/StockAccountRepository.java
one-record/one-record-repository/src/main/java/com/one/record/repository/StockPositionRepository.java
one-record/one-record-repository/src/main/java/com/one/record/repository/StockTradeRepository.java
one-record/one-record-interface/src/main/java/com/one/record/service/IStockPortfolioService.java
one-record/one-record-service/src/main/java/com/one/record/service/impl/StockPortfolioService.java
one-record/one-record-web/src/main/java/com/one/record/web/StockPortfolioController.java
one-record/one-record-model/src/main/java/com/one/record/stock/StockAlertRule.java
one-record/one-record-model/src/main/java/com/one/record/stock/StockAlertHistory.java
one-record/one-record-repository/src/main/java/com/one/record/repository/StockAlertRuleRepository.java
one-record/one-record-repository/src/main/java/com/one/record/repository/StockAlertHistoryRepository.java
one-record/one-record-interface/src/main/java/com/one/record/service/IStockAlertService.java
one-record/one-record-service/src/main/java/com/one/record/service/impl/StockAlertService.java
one-record/one-record-web/src/main/java/com/one/record/web/StockAlertController.java
one-record/one-record-model/src/main/java/com/one/record/stock/StockAnalysisItem.java
one-record/one-record-model/src/main/java/com/one/record/stock/StockAnalysisSummary.java
one-record/one-record-interface/src/main/java/com/one/record/service/IStockAnalysisService.java
one-record/one-record-service/src/main/java/com/one/record/service/impl/StockAnalysisService.java
one-record/one-record-web/src/main/java/com/one/record/web/StockAnalysisController.java
```

## Verification Notes

Successful:

```bash
npm exec eslint -- src/components/LifeInvestmentPage.tsx src/services/api.ts
```

Successful with explicit JDK 21:

```bash
JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home PATH=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home/bin:$PATH mvn -pl one-record/one-record-service -am compile -DskipTests
```

Successful for this Redis cache iteration:

```bash
npm exec eslint -- src/components/LifeInvestmentPage.tsx src/services/api.ts
JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home PATH=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home/bin:/Users/aurorae/Program/Git/Apache/Maven/maven3.6.3/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin mvn -pl one-record/one-record-service -am compile -DskipTests
```

Successful for stock service unit tests:

```bash
JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home PATH=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home/bin:/Users/aurorae/Program/Git/Apache/Maven/maven3.6.3/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin mvn -q -pl one-record/one-record-service -am test -Dtest=StockMarketServiceTest -DfailIfNoTests=false -Dsurefire.failIfNoSpecifiedTests=false
```

Note: the provider failure fallback test intentionally logs the mocked 500 response before asserting fallback behavior.

Blocked:

```bash
npm run build
```

Reason: existing TypeScript errors in unrelated pages, including health and hexagram components.

Blocked:

```bash
mvn -pl one-record/one-record-service -am compile -DskipTests
```

Reason: the default local Java is still 1.8 while the project targets Java 21. The same compile succeeds when `JAVA_HOME` is explicitly set to JDK 21.

Expected fix:

```bash
java -version
mvn -version
```

Both should show Java 21 before backend compile is retried.

## Next Task Queue

### Task 1: Add Watchlist Persistence

Status: completed

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

- Add a symbol to watchlist. Completed.
- Remove a symbol from watchlist. Completed.
- List watchlist ordered by `sortOrder`. Completed.
- Duplicate symbols are rejected. Completed.
- Frontend loads watchlist first, then requests quotes for those symbols. Completed.

Implementation notes:

- Current watchlist ownership uses `userId = default`; final auth-bound ownership is still open.
- `StockWatchlistService` uses `IStockMarketService.normalizeSymbol` so symbol logic stays centralized.
- The frontend still calls only internal `/stock/*` APIs.

### Task 2: Add Quote Cache

Status: implemented and covered by unit tests; runtime integration verification is still recommended

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

- Repeated quote calls can be served from cache. Implemented with `stock:quote:{symbol}`.
- Provider failure does not blank the UI when a cached quote exists. Implemented with `stock:quote:last-success:{symbol}`.
- Response includes `fetchedAt` and `message`. Implemented.
- Fallback responses include `stale` and `staleReason`. Implemented.

Implementation notes:

- Latest quote cache TTL is configurable with `stock.market.quote-cache-ttl-seconds`.
- Last successful fallback TTL is configurable with `stock.market.fallback-cache-ttl-seconds`.
- Cache can be disabled with `stock.market.cache-enabled=false`.
- Runtime verification with a live Redis instance and simulated provider failure is still useful before marking the quality gate complete.

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

See `docs/stock/iterations/roadmap.md` for the field list.

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
