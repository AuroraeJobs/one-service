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
- [x] Add investment dashboard summary cards.
- [x] Add holdings table sorted by market value, PnL, and daily change.

## Week 4: Alerts, Analysis, And Provider Abstraction

- [x] Add `StockAlertRule` model.
- [x] Persist alert rules and alert history in MongoDB.
- [x] Add alert CRUD endpoints.
- [x] Add price alert evaluation.
- [x] Add percent-change alert evaluation.
- [x] Add volume abnormality alert evaluation.
- [x] Add scheduled alert evaluation job.
- [x] Use Redis to store alert evaluation throttling and last-evaluated state.
- [x] Add analysis summary endpoint.
- [x] Add concentration analysis.
- [x] Add volatility analysis.
- [x] Add drawdown analysis.
- [x] Add top gainers and top losers.
- [x] Extract `StockMarketProvider` interface.
- [x] Add provider router or strategy for selecting the active provider.
- [x] Move Sina parsing behind provider implementation.
- [x] Make active provider configurable with `stock.market.provider`.
- [x] Design fallback provider config, for example `stock.market.fallback-providers`.
- [x] Add provider health status endpoint.
- [x] Keep frontend API contract unchanged after provider abstraction.
- [x] Confirm no controller, frontend, watchlist, position, alert, or analysis code depends on a concrete provider.

## Iteration 05: Trade Recalculation And K-Line Provider

- [x] Add position recalculation service entry point by account and symbol.
- [x] Recalculate position quantity and available quantity from trades.
- [x] Recalculate cost amount and weighted-average cost price from buy/sell trades.
- [x] Include fee and tax in cost and realized PnL calculations.
- [x] Track or expose realized PnL from sell trades. Exposed through holding and portfolio summary DTOs.
- [x] Apply dividend records as cash income separate from price PnL.
- [x] Apply bonus share records without changing total cost basis incorrectly.
- [x] Apply split records by adjusting quantity and cost price.
- [x] Trigger recalculation after trade create, update, and delete.
- [x] Add manual position recalculation endpoints.
- [x] Add unit tests for buy, sell, fee, dividend, bonus share, split, delete, and idempotent recalculation.
- [x] Extract or add a K-line provider interface returning normalized `StockKLine` rows.
- [x] Add provider router/selection for historical K-line data.
- [x] Add one concrete A-share daily K-line provider. Implemented `SinaStockKLineProvider`.
- [x] Wire manual K-line sync to fetch provider data when request rows are not provided.
- [x] Wire scheduled K-line sync to fetch configured symbols instead of recording only `SKIPPED`.
- [x] Preserve Redis sync locks and MongoDB sync logs during provider-based sync.
- [x] Add tests for K-line provider parsing and sync upsert behavior.
- [x] Confirm quote and K-line providers remain switchable and upper layers do not depend on concrete providers.
- [x] Update portfolio, historical K-line, provider, and storage docs with final implementation details.

## Menu-Driven Version Plan

- [x] Plan target stock menu tree and route structure.
- [x] Plan menu-driven version iterations.
- [x] V1: Add stock navigation shell for 总览、自选、行情、个股. Added stock subnav routes and reused the existing investment page by route mode.
- [x] V2: Add portfolio ledger UX for 持仓 and 交易. Added positions/trades routes, tables, trade creation/deletion, filters, and manual recalculation.
- [x] V3: Add historical data operations for K线 and 同步. Added K-line query page, JSON sync/import page, sync logs view, and stock subnav entries.
- [x] V4: Add alerts UX for 告警 and overview/detail alert widgets. Added first alert management page with rule CRUD create/delete, manual evaluation, and history view; overview/detail widgets remain follow-up.
- [x] V5: Add analysis cockpit for 分析 and overview analysis widgets. Added first analysis page for concentration, volatility, drawdown, top gainers, and top losers; overview widgets remain follow-up.
- [x] V6: Add provider and settings operations for 数据源 and 设置. Added read-only provider health page and settings boundary page.

## Iteration 06: Dashboard And Detail Linkage

- [x] Add query-param support for symbol/account filters on linked stock pages. Trades, positions, K-lines, sync, and alerts read route context for initial filters/actions.
- [x] Add holding summary widget to symbol detail.
- [x] Add recent trades widget to symbol detail.
- [x] Add active alert rules widget to symbol detail.
- [x] Add symbol-aware shortcuts from detail to trades, alerts, K-lines, and sync.
- [x] Upgrade overview dashboard with portfolio summary and holdings highlights.
- [x] Add recent alert history widget to overview.
- [x] Add analysis widgets to overview.
- [x] Add provider health mini status to overview.
- [x] Link overview and analysis items to symbol detail.
- [x] Verify empty, loading, and error states.
- [x] Verify frontend lint and build.
- [x] Update docs and commit/push after the milestone.

## Iteration 07: Preferences And Provider Operations

- [x] Add `StockPreference` MongoDB model.
- [x] Add `StockPreferenceRepository`.
- [x] Add `IStockPreferenceService` and implementation.
- [x] Add `GET /stock/preferences`.
- [x] Add `PUT /stock/preferences`.
- [x] Add service tests for defaults, normalization, and validation.
- [x] Wire frontend `stockApi` preferences methods.
- [x] Replace read-only settings future table with editable persisted preference form.
- [x] Expand provider health DTO for quote and K-line provider categories.
- [x] Show detailed K-line provider health on 数据源/总览.
- [x] Verify frontend lint and build.
- [x] Verify backend tests.
- [x] Update docs and commit/push after the milestone.

## Iteration 08: Operational Editing

- [x] Add edit action for trade records.
- [x] Reuse trade modal for create and edit.
- [x] Wire trade update to `PUT /stock/trades/{id}`.
- [x] Add edit action for alert rules.
- [x] Reuse alert modal for create and edit.
- [x] Wire alert update to `PUT /stock/alerts/rules/{id}`.
- [x] Add account selector UX for trade and position pages.
- [x] Surface recalculation impact more explicitly after trade save/delete.
- [x] Verify frontend lint and build.
- [x] Update docs and commit/push after the milestone.

## Quality Gates

- [x] Backend compiles with JDK 21.
- [x] Frontend changed files pass ESLint.
- [x] Full frontend build passes after unrelated TypeScript errors are fixed. Fixed existing strict TypeScript errors in health/hexagram pages and verified `npm run build`.
- [x] Quote provider failure path is verified. Unit test covers provider error fallback to `stock:quote:last-success:{symbol}`.
- [x] Quote cache uses millisecond timestamps for time fields such as `fetchedAt`.
- [x] Stock watchlist uses millisecond timestamps for `createdAt` and `updatedAt`.
- [x] Remaining backend `LocalDateTime` fields/usages are migrated to millisecond timestamps.
- [x] Mobile layout is checked for investment page.
- [x] Desktop layout is checked for investment page.
- [x] Documentation is updated after each completed milestone.
- [x] Changes are reviewed with `git status --short` and `git diff --stat`.
- [x] Completed milestone is committed with a clear message.
- [x] Committed branch is pushed to the remote.
- [x] Provider abstraction rule is still true: upper layers depend on interfaces and normalized DTOs only.
- [x] Storage rule is still true: MongoDB for persisted stock data, Redis for volatile market and operational state.
- [x] `docs/stock/modules/technical-design.md` is updated when key logic or architecture changes.
