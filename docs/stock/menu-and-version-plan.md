# Stock Menu And Version Plan

Last updated: 2026-07-03

## Purpose

Plan the stock module by user-facing menus first, then derive version iterations from those menus. This keeps backend capability, frontend navigation, and documentation moving together.

## Current UI State

Current frontend routes:

```text
/investments
/investments/stocks/:symbol
```

Current life module subnav:

```text
股票 -> 资产
股票 -> 接入
```

Current backend capability is richer than the menu surface. The next UI work should expose existing stock capability through clear stock-specific menus instead of continuing to pack everything into `/investments`.

## Target Menu Tree

### Primary Entry

```text
股票
```

The stock module remains under the life-data navigation as the top-level "股票" entry.

### Recommended Stock Menus

```text
股票
- 总览
- 自选
- 行情
- 持仓
- 交易
- 个股
- K线
- 告警
- 分析
- 数据源
- 同步
- 设置
```

## Menu Definitions

### 总览

Route:

```text
/investments
```

Purpose:

- First screen for the stock module.
- Shows portfolio summary, today's movement, major alerts, and watchlist highlights.

Main widgets:

- Total market value.
- Total cost.
- Floating PnL.
- Today PnL.
- Top gainers and losers.
- Latest alert history.
- Provider health mini status.

Primary APIs:

```text
GET /stock/portfolio/summary
GET /stock/analysis/summary
GET /stock/alerts/history
GET /stock/providers/health
```

### 自选

Route:

```text
/investments/watchlist
```

Purpose:

- Manage followed symbols.
- Refresh and inspect real-time quotes.

Main actions:

- Add symbol.
- Remove symbol.
- Reorder symbols.
- Refresh quotes.
- Navigate to detail.

Primary APIs:

```text
GET /stock/watchlist
POST /stock/watchlist
DELETE /stock/watchlist/{symbol}
PUT /stock/watchlist/order
GET /stock/quotes
```

### 行情

Route:

```text
/investments/market
```

Purpose:

- Market-level quote board and quick lookup.
- Keep quick lookup separate from persisted watchlist.

Main actions:

- Search symbol.
- Batch quote lookup.
- Add search result to watchlist.
- Open individual stock detail.

Primary APIs:

```text
GET /stock/quote
GET /stock/quotes
```

### 持仓

Route:

```text
/investments/positions
```

Purpose:

- Display current holdings and return metrics.
- Show whether positions are manually maintained or trade-derived.

Main actions:

- Filter by account.
- Sort by market value, PnL, today PnL, and change percent.
- Manually trigger recalculation.
- Open trade list for a symbol.

Primary APIs:

```text
GET /stock/positions
POST /stock/positions/recalculate
POST /stock/positions/{symbol}/recalculate
GET /stock/portfolio/summary
```

### 交易

Route:

```text
/investments/trades
```

Purpose:

- Record and inspect stock trades.
- Trades become the source for position recalculation.

Main actions:

- Add trade.
- Edit trade.
- Delete trade.
- Filter by account and symbol.
- View recalculation impact.

Primary APIs:

```text
GET /stock/trades
POST /stock/trades
PUT /stock/trades/{id}
DELETE /stock/trades/{id}
```

### 个股

Route:

```text
/investments/stocks/:symbol
```

Purpose:

- Symbol detail page.
- Combines quote, K-line, holdings, trades, alerts, and analysis for one stock.

Main widgets:

- Real-time quote header.
- K-line chart.
- Volume chart.
- MA overlays.
- Holding summary for this symbol.
- Recent trades for this symbol.
- Active alerts for this symbol.

Primary APIs:

```text
GET /stock/quote
GET /stock/{symbol}/klines
GET /stock/trades?symbol={symbol}
GET /stock/alerts/rules
```

### K线

Route:

```text
/investments/klines
```

Purpose:

- Historical data management and chart-focused views.
- Useful for checking data completeness and sync status.

Main actions:

- Trigger manual sync.
- View sync logs.
- Inspect missing data.
- Open symbol chart.

Primary APIs:

```text
GET /stock/{symbol}/klines
POST /stock/{symbol}/klines/sync
POST /stock/klines/sync
GET /stock/klines/sync-logs
```

### 告警

Route:

```text
/investments/alerts
```

Purpose:

- Manage price, percent-change, and volume abnormality alerts.

Main actions:

- Add alert rule.
- Enable/disable rule.
- Edit threshold.
- Delete rule.
- Manually evaluate rules.
- View trigger history.

Primary APIs:

```text
GET /stock/alerts/rules
POST /stock/alerts/rules
PUT /stock/alerts/rules/{id}
DELETE /stock/alerts/rules/{id}
GET /stock/alerts/history
POST /stock/alerts/evaluate
```

### 分析

Route:

```text
/investments/analysis
```

Purpose:

- Portfolio risk and performance insight.

Main widgets:

- Concentration analysis.
- Volatility.
- Drawdown.
- Top gainers.
- Top losers.
- Position distribution.

Primary APIs:

```text
GET /stock/analysis/summary
GET /stock/portfolio/summary
```

### 数据源

Route:

```text
/investments/providers
```

Purpose:

- Show active quote/K-line providers and fallback order.
- Keep data source switching visible without leaking provider details into business menus.

Main widgets:

- Active quote provider.
- Active K-line provider.
- Registered providers.
- Provider health.
- Last success/failure.

Primary APIs:

```text
GET /stock/providers/health
```

Future APIs:

```text
GET /stock/providers
PUT /stock/providers/config
```

### 同步

Route:

```text
/investments/sync
```

Purpose:

- Operational view for historical sync, alert evaluation, provider health refresh, and future broker imports.

Main actions:

- Trigger K-line sync.
- View sync logs.
- Retry failed sync.
- Inspect Redis lock/throttle status if exposed.

Primary APIs:

```text
POST /stock/klines/sync
GET /stock/klines/sync-logs
POST /stock/alerts/evaluate
GET /stock/providers/health
```

### 设置

Route:

```text
/investments/settings
```

Purpose:

- Stock module preferences.

Future settings:

- Default account.
- Default currency.
- Quote refresh interval.
- K-line period defaults.
- Alert throttle defaults.
- Provider preference display.

## Version Iteration Plan By Menu

### V1: Stock Navigation Shell

Goal:

Split the stock module into clear menus without changing backend behavior.

Menus delivered:

- 总览
- 自选
- 行情
- 个股

Tasks:

- Add stock subnav items under the existing "股票" module.
- Keep `/investments` as 总览.
- Move watchlist table into 自选 route or tab.
- Move quick quote lookup into 行情 route or tab.
- Keep `/investments/stocks/:symbol` as 个股.
- Make all menus consume only existing internal `/stock/*` APIs.

Acceptance:

- Users can navigate stock menus from the life module subnav.
- Existing quote/watchlist/detail behavior still works.
- No concrete provider dependency appears in frontend.
- Frontend build passes.

Progress:

- Completed on 2026-07-03.
- Added stock subnav items for 总览、自选、行情, while keeping 个股 at `/investments/stocks/:symbol`.
- Added routes:

```text
/investments/watchlist
/investments/market
```

- Reused `LifeInvestmentPage` with route-based view modes for V1 to avoid duplicating quote/watchlist logic.
- Verified changed files with ESLint and full frontend build.

### V2: Portfolio Ledger UX

Goal:

Expose trade-driven position management from Iteration 05.

Menus delivered:

- 持仓
- 交易

Tasks:

- Add positions page.
- Add trades page.
- Add trade form for `BUY`, `SELL`, `DIVIDEND`, `FEE`, `BONUS_SHARE`, and `SPLIT`.
- Show recalculation status and manual recalculation actions.
- Filter trades by account and symbol.
- Link holdings to symbol detail and trade history.

Acceptance:

- Creating/editing/deleting trades updates positions through backend recalculation.
- Positions page displays backend-calculated values only.
- Trade page supports the full current trade type list.
- Backend tests cover recalculation; frontend changed files pass lint/build.

Progress:

- Completed first UX slice on 2026-07-03.
- Added routes:

```text
/investments/positions
/investments/trades
```

- Added stock subnav items for 持仓 and 交易.
- Added positions page with account filter and manual recalculation action.
- Added trades page with account/symbol filters, trade creation, and delete action.
- Trade creation supports `BUY`, `SELL`, `DIVIDEND`, `FEE`, `BONUS_SHARE`, and `SPLIT`.
- Verified changed files with ESLint and full frontend build.

Follow-up:

- Add edit-trade modal by reusing the create form.
- Add account selector after account UX is designed.
- Surface recalculation impact more explicitly after save/delete.

### V3: Historical Data Operations

Goal:

Make K-line sync observable and operable.

Menus delivered:

- K线
- 同步

Tasks:

- Add K-line management page.
- Add sync log page or sync section.
- Add manual sync action.
- Show sync status, saved count, failed messages, and timestamps.
- Connect scheduled sync status once provider-based sync is implemented.

Acceptance:

- Users can inspect whether historical data exists for a symbol.
- Users can trigger manual sync from UI.
- Sync logs are visible.
- K-line provider details remain hidden behind internal APIs.

Progress:

- Completed first UX slice on 2026-07-03.
- Added routes:

```text
/investments/klines
/investments/sync
```

- Added stock subnav items for K线 and 同步.
- Added K-line page with symbol, period, and date-range filters.
- Added sync page with Provider-backed sync as the primary action, standardized K-line JSON import as an advanced fallback, single-symbol/configured-batch modes, and sync log table.
- Verified changed files with ESLint and full frontend build.

Follow-up:

- Add sync retry action for failed logs after backend retry API exists.

### V4: Alerts And Daily Monitoring

Goal:

Expose rule management and trigger history.

Menus delivered:

- 告警
- 总览 alert widgets
- 个股 alert section

Tasks:

- Add alert rule management page.
- Add trigger history view.
- Add manual evaluate action.
- Show active alerts on stock detail.
- Surface recent triggered alerts on overview.

Acceptance:

- Users can CRUD alert rules.
- Users can manually evaluate alerts.
- Alert history is visible.
- Alert logic continues to depend on normalized quote DTOs.

Progress:

- Completed first UX slice on 2026-07-03.
- Added route:

```text
/investments/alerts
```

- Added stock subnav item for 告警.
- Added alert rule table with enabled filter, delete action, and symbol detail link.
- Added create-rule modal for `PRICE`, `PERCENT_CHANGE`, and `VOLUME_ABNORMAL` rules.
- Added manual evaluation action and trigger history table.
- Verified changed files with ESLint and full frontend build.

Follow-up:

- Add edit-rule modal by reusing the create form.
- Surface recent triggered alerts on 总览.
- Show active symbol alerts on 个股 detail.

### V5: Analysis Cockpit

Goal:

Make risk and performance insights first-class.

Menus delivered:

- 分析
- 总览 analysis widgets

Tasks:

- Add analysis page.
- Show concentration, volatility, drawdown, top gainers, and top losers.
- Add portfolio distribution charts.
- Link analysis items back to symbol detail.

Acceptance:

- Users can identify concentration and drawdown risks.
- Analysis uses backend calculations.
- No frontend-side duplication of portfolio math.

Progress:

- Completed first UX slice on 2026-07-03.
- Added route:

```text
/investments/analysis
```

- Added stock subnav item for 分析.
- Added analysis page with concentration, volatility, drawdown, top gainers, and top losers.
- Analysis page reads `GET /stock/analysis/summary` and does not duplicate backend portfolio math in the browser.
- Verified changed files with ESLint and full frontend build.

Follow-up:

- Surface compact analysis widgets on 总览.
- Add charts after the analysis DTO supports trend/history windows.

### V6: Provider And Settings Operations

Goal:

Make provider status and stock preferences manageable.

Menus delivered:

- 数据源
- 设置

Tasks:

- Add provider status page.
- Show active provider and fallback provider order.
- Add read-only config display first.
- Add settings page for refresh interval, default account, and default chart period.
- Add write APIs only after config persistence is designed.

Acceptance:

- Users can inspect data source health.
- Provider switching remains configuration-driven.
- Settings do not couple frontend to a concrete provider.

Progress:

- Completed first UX slice on 2026-07-03.
- Added routes:

```text
/investments/providers
/investments/settings
```

- Added stock subnav items for 数据源 and 设置.
- Added read-only provider health page using `GET /stock/providers/health`.
- Added settings boundary page documenting current backend config items and future user preferences.
- Settings are intentionally read-only until a MongoDB-backed preferences model and write API are designed.
- Verified changed files with ESLint and full frontend build.

Follow-up:

- Add persisted stock user preferences model and API.
- Add write controls only after persistence and validation rules are implemented.
- Add K-line provider status after historical provider routing is implemented.

## Recommended Build Order

1. V1 navigation shell.
2. V2 portfolio ledger UX.
3. Finish Iteration 05 backend gaps: realized PnL, dividend cash income, bonus/split tests, K-line provider.
4. V3 historical data operations.
5. V4 alerts.
6. V5 analysis.
7. V6 providers and settings.

## Architecture Rules To Preserve

- Frontend calls only internal `/stock/*` APIs.
- Menus reflect user workflows, not provider implementation details.
- Quote and K-line data sources stay switchable.
- MongoDB remains the durable stock data store.
- Redis remains cache, fallback, lock, throttle, and short-lived state.
- Backend owns calculation logic; frontend displays results.
