# Stock Module Checklist

Last updated: 2026-07-03

Use this file as the durable task board for the stock module. When a task is finished, change `[ ]` to `[x]` and add a short note if there is useful context for the next thread.

## Baseline: Real-Time Quote

- [x] Add `StockQuote` DTO.
- [x] Add `IStockMarketService`.
- [x] Add Sina-backed `StockMarketService`.
- [x] Add `StockMarketController`.
- [x] Add frontend `stockApi`.
- [x] Update investment page to display real-time quotes.
- [x] Add stock market configuration in `application.yml`.
- [x] Document current verification blockers: frontend has unrelated TypeScript errors; backend requires JDK 21.

## Week 1: Watchlist And Quote Stability

- [x] Add `StockWatchlist` model.
- [x] Add MongoDB-backed `StockWatchlistRepository`.
- [x] Add `IStockWatchlistService`.
- [x] Add `StockWatchlistService`.
- [x] Add `StockWatchlistController`.
- [x] Implement `GET /stock/watchlist`.
- [x] Implement `POST /stock/watchlist`.
- [x] Implement `DELETE /stock/watchlist/{symbol}`.
- [x] Implement `PUT /stock/watchlist/order`.
- [x] Reject or idempotently ignore duplicate watchlist symbols.
- [x] Sort watchlist by `sortOrder`.
- [x] Update investment page to load watchlist first.
- [x] Keep manual quote input as quick lookup/debugging.
- [x] Add Redis cache for quote responses.
- [x] Add provider failure fallback to last successful cached quote.
- [x] Add stale-data message when fallback cache is used.
- [x] Store latest quote and fallback quote snapshots in Redis.
- [x] Add unit tests for symbol normalization. Covered by `StockMarketServiceTest`.
- [x] Add unit tests for Sina quote parsing. Covered by `StockMarketServiceTest`.
- [x] Add controller test or manual verification for repeated `symbols` params. Covered by `StockMarketControllerTest`.
- [x] Ensure watchlist and quote UI depend only on normalized project DTOs, not Sina-specific fields.

## Week 2: Historical Data And Charts

- [x] Add `StockKLine` model.
- [x] Add MongoDB-backed K-line repository.
- [x] Add K-line query request/response DTOs if needed. Reused normalized `StockKLine` DTO for the first backend iteration.
- [x] Add endpoint `GET /stock/{symbol}/klines`.
- [x] Add endpoint `POST /stock/{symbol}/klines/sync`.
- [x] Add endpoint `POST /stock/klines/sync`.
- [x] Persist daily OHLCV data. Initial implementation supports manual K-line import/upsert.
- [x] Store K-line sync logs in MongoDB.
- [x] Use Redis locks to prevent duplicate sync jobs.
- [x] Add scheduled daily sync after market close. Current job records a skipped sync log until historical provider is connected.
- [x] Add stock detail route `/investments/stocks/:symbol`.
- [x] Make quote table rows clickable.
- [x] Add real-time quote header on detail page.
- [x] Add K-line chart with existing `echarts`.
- [x] Add volume chart.
- [x] Add MA5, MA10, and MA20 overlays.

## Week 3: Positions, Trades, And Returns

- [x] Add `StockAccount` model.
- [x] Add `StockPosition` model.
- [x] Add `StockTrade` model.
- [x] Persist accounts, positions, and trades in MongoDB.
- [x] Add account CRUD endpoints.
- [x] Add position endpoints.
- [x] Add trade endpoints.
- [x] Support buy trade records. Initial CRUD supports `BUY`; holding recalculation comes next.
- [x] Support sell trade records. Initial CRUD supports `SELL`; holding recalculation comes next.
- [x] Support dividend, fee, bonus share, and split records. Initial CRUD supports `DIVIDEND`, `FEE`, `BONUS_SHARE`, and `SPLIT`.
- [x] Calculate current market value.
- [x] Calculate floating PnL.
- [x] Calculate floating PnL percent.
- [x] Calculate today PnL.
- [x] Add portfolio summary endpoint.
- [ ] Add investment dashboard summary cards.
- [ ] Add holdings table sorted by market value, PnL, and daily change.

## Week 4: Alerts, Analysis, And Provider Abstraction

- [ ] Add `StockAlertRule` model.
- [ ] Persist alert rules and alert history in MongoDB.
- [ ] Add alert CRUD endpoints.
- [ ] Add price alert evaluation.
- [ ] Add percent-change alert evaluation.
- [ ] Add volume abnormality alert evaluation.
- [ ] Add scheduled alert evaluation job.
- [ ] Use Redis to store alert evaluation throttling and last-evaluated state.
- [ ] Add analysis summary endpoint.
- [ ] Add concentration analysis.
- [ ] Add volatility analysis.
- [ ] Add drawdown analysis.
- [ ] Add top gainers and top losers.
- [ ] Extract `StockMarketProvider` interface.
- [ ] Add provider router or strategy for selecting the active provider.
- [ ] Move Sina parsing behind provider implementation.
- [ ] Make active provider configurable with `stock.market.provider`.
- [ ] Design fallback provider config, for example `stock.market.fallback-providers`.
- [ ] Add provider health status endpoint.
- [ ] Keep frontend API contract unchanged after provider abstraction.
- [ ] Confirm no controller, frontend, watchlist, position, alert, or analysis code depends on a concrete provider.

## Quality Gates

- [x] Backend compiles with JDK 21.
- [x] Frontend changed files pass ESLint.
- [ ] Full frontend build passes after unrelated TypeScript errors are fixed.
- [x] Quote provider failure path is verified. Unit test covers provider error fallback to `stock:quote:last-success:{symbol}`.
- [x] Quote cache uses millisecond timestamps for time fields such as `fetchedAt`.
- [x] Stock watchlist uses millisecond timestamps for `createdAt` and `updatedAt`.
- [x] Remaining backend `LocalDateTime` fields/usages are migrated to millisecond timestamps.
- [ ] Mobile layout is checked for investment page.
- [ ] Desktop layout is checked for investment page.
- [x] Documentation is updated after each completed milestone.
- [x] Changes are reviewed with `git status --short` and `git diff --stat`.
- [x] Completed milestone is committed with a clear message.
- [x] Committed branch is pushed to the remote.
- [ ] Provider abstraction rule is still true: upper layers depend on interfaces and normalized DTOs only.
- [ ] Storage rule is still true: MongoDB for persisted stock data, Redis for volatile market and operational state.
- [x] `docs/stock-technical-design.md` is updated when key logic or architecture changes.
