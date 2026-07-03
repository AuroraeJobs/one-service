# Iteration 07: Preferences And Provider Operations

Last updated: 2026-07-03

## Goal

Turn the stock settings and provider operation surfaces from read-only planning screens into persisted, operable module controls while preserving provider abstraction.

## Scope

### Track A: User Preferences

Deliverables:

- Add MongoDB-backed stock preference model.
- Add `GET /stock/preferences`.
- Add `PUT /stock/preferences`.
- Persist default account, default currency, default K-line period, and quote refresh interval preference.
- Make `/investments/settings` editable for persisted preferences.

Acceptance:

- Preferences are durable in MongoDB.
- Time fields use millisecond timestamps.
- Frontend calls only internal `/stock/*` APIs.
- Preferences do not directly mutate Spring provider configuration.

### Track B: Provider Operations

Deliverables:

- Expand provider health to distinguish quote provider and K-line provider state.
- Keep active provider and fallback configuration backend-owned.
- Add UI visibility for K-line provider health after the DTO supports it.

Acceptance:

- Upper layers still depend on provider interfaces and normalized DTOs.
- Provider-specific protocol details remain inside provider implementations.

## Checklist

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

## Progress

### 2026-07-03

- Added MongoDB-backed `StockPreference` with millisecond `createdAt` and `updatedAt`.
- Added internal preference APIs under `/stock/preferences`.
- Settings page now loads and saves persisted stock user preferences.
- Provider configuration remains read-only and backend-owned.
- Verified with changed-file ESLint, full frontend build, and `StockPreferenceServiceTest`.

### 2026-07-03 Provider Health Categories

- Extended `StockProviderHealth` with `category` so one internal API can report quote and K-line provider status.
- Aggregated quote and K-line provider router health in `GET /stock/providers/health`.
- Updated 数据源 and 总览 widgets to distinguish 行情 Provider and K线 Provider.
- Verified with changed-file ESLint and `StockMarketServiceTest`.
