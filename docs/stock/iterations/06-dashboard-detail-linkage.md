# Iteration 06: Dashboard And Detail Linkage

Last updated: 2026-07-03

## Goal

Turn the stock module from separate feature pages into a daily-use cockpit. The next iteration should connect overview, symbol detail, alerts, analysis, holdings, trades, K-lines, and sync so users can spot movement or risk and drill into the exact stock records.

## Why This Iteration

The current module already has the main foundations:

- Provider-backed quotes and K-lines.
- Watchlist, portfolio, positions, trades, alerts, and analysis.
- Stock menus for overview, watchlist, market, positions, trades, K-lines, alerts, analysis, providers, sync, and settings.

The highest-value gap is cross-page linkage. Existing backend APIs can support much of this without changing the provider boundary.

## Scope

### Track A: Overview Cockpit

Deliverables:

- Upgrade `/investments` into a real dashboard.
- Show portfolio summary, holdings highlights, top gainers, top losers, concentration risk, and provider health.
- Show recent alert history.
- Keep watchlist highlights visible without duplicating the full watchlist management page.
- Link overview rows and cards to symbol detail where possible.

Acceptance:

- Users can see portfolio status, recent movement, alerts, and provider health from `/investments`.
- Overview calls only internal `/stock/*` APIs.
- Overview does not branch on a concrete provider name for business behavior.

### Track B: Symbol Detail Enrichment

Deliverables:

- Add holding summary for the current symbol on `/investments/stocks/:symbol`.
- Add recent trades for the current symbol.
- Add active alert rules for the current symbol.
- Add a compact analysis section when available.
- Add direct actions to open trade creation, alert creation, K-line query, and K-line sync with the symbol prefilled when feasible.

Acceptance:

- A symbol detail page answers: current quote, trend, holding, recent transactions, and active monitoring.
- Detail page data comes from normalized DTOs and existing internal APIs.
- Missing holdings, trades, or alerts render clean empty states.

### Track C: Alert And Analysis Widgets

Deliverables:

- Add recent triggered-alert widget on overview.
- Add active-symbol-alert section on detail.
- Add dashboard analysis widgets for concentration, volatility, drawdown, top gainers, and top losers.
- Link analysis items to `/investments/stocks/:symbol`.

Acceptance:

- Alert and analysis pages remain the full management surfaces.
- Overview/detail widgets are read-focused and do not duplicate all page controls.
- Frontend math remains minimal; calculations stay in backend services.

### Track D: Navigation Context

Deliverables:

- Preserve route context in common actions, such as jumping from holdings to trades or detail.
- Add query-param support where useful, for example symbol filters on trades, alerts, K-lines, and sync pages.
- Document which query params are supported by each stock page.

Acceptance:

- Users can move between overview, detail, trades, alerts, K-lines, and sync without retyping the symbol.
- Existing pages continue to work without query params.

## Out Of Scope

- New third-party providers.
- Broker account import.
- Auth/user separation beyond existing model fields.
- Real-time WebSocket quote streaming.
- New persistent storage engines.

## Architecture Guardrails

- Stock data sources remain switchable.
- Upper layers depend on project DTOs and internal `/stock/*` APIs only.
- Provider-specific parsing and request behavior stay behind provider implementations.
- MongoDB remains the durable store for stock domain data and K-lines.
- Redis remains the volatile store for quote cache, fallback snapshots, sync locks, throttling, and short-lived state.
- Time fields remain millisecond timestamps.

## Suggested Implementation Order

1. Add query-param handling and prefilled filters to existing frontend pages.
2. Enrich symbol detail with holdings, trades, and active alerts.
3. Upgrade overview with portfolio, analysis, alert history, watchlist highlights, and provider health.
4. Polish empty/loading/error states across the linked widgets.
5. Update module docs and checklist.

## Verification Plan

Frontend:

```bash
npm exec eslint -- src/services/api.ts src/components/LifeInvestmentPage.tsx src/components/LifeStockDetailPage.tsx
npm run build
```

Backend:

- Add tests only if new backend aggregation or endpoint behavior is introduced.
- If frontend only, run existing backend tests only when related API contracts are changed.

Documentation:

- Update `docs/stock/iterations/checklist.md`.
- Update `docs/stock/menu-and-version-plan.md`.
- Update `docs/stock/modules/technical-design.md` if route contracts, key logic, or API usage changes.

## Checklist

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

## Progress

### 2026-07-03

- Added route-context support for linked stock pages:
  - `/investments/trades?symbol=600519&accountId=...&action=create`
  - `/investments/positions?accountId=...`
  - `/investments/klines?symbol=600519&period=daily`
  - `/investments/sync?symbol=600519&mode=single`
  - `/investments/alerts?symbol=600519&action=create`
- Enriched `/investments/stocks/:symbol` with holding summary, recent trades, and active alert rules.
- Added symbol-aware detail shortcuts for creating a trade, creating an alert, querying K-lines, and opening K-line sync.
- Verified with changed-file ESLint and full frontend build.

### 2026-07-03 Overview Cockpit

- Upgraded `/investments` with analysis summary, recent alert history, and provider health widgets.
- Replaced early static planning cards with live dashboard data from internal stock APIs.
- Linked overview alert and analysis items back to symbol detail or full management pages.

### 2026-07-03 Acceptance Polish

- Verified empty, loading, and error states for the Iteration 06 overview/detail surfaces.
- Added explicit no-holding state on symbol detail.
- Added distinct provider-health loading copy on overview.
