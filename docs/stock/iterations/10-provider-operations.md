# Iteration 10: Provider Operations

Last updated: 2026-07-03

## Goal

Make the data source menu more operational. Users should be able to verify whether the configured quote and K-line provider routes can return sample data without learning any third-party API detail.

## Scope

### Track A: Provider Probe

Deliverables:

- Add an internal provider probe API.
- Probe quote and K-line provider routes through backend provider routers.
- Return a normalized probe DTO with millisecond timestamps and duration.
- Store the latest probe result in Redis as short-lived operational state.
- Add a probe action to `/investments/providers`.
- Add an all-provider probe action for quote and K-line provider routes.
- Add a read-only backend provider configuration snapshot for settings.

Acceptance:

- The frontend calls only internal `/stock/*` APIs.
- Probe logic does not branch on concrete providers in controllers or frontend pages.
- Probe failures return a structured result for the data source page instead of exposing third-party exception shapes.

## Checklist

- [x] Add `StockProviderProbeResult`.
- [x] Add `GET /stock/providers/probe`.
- [x] Probe quote provider route through `StockMarketProviderRouter`.
- [x] Probe K-line provider route through `StockKLineProviderRouter`.
- [x] Cache latest probe result in Redis by provider category.
- [x] Add `GET /stock/providers/probe/latest`.
- [x] Add `GET /stock/providers/probe/all`.
- [x] Add `GET /stock/providers/config`.
- [x] Wire `/investments/providers` probe controls and result display.
- [x] Load latest probe result when the data source page opens or category changes.
- [x] Add one-click all-provider probe on `/investments/providers`.
- [x] Replace hard-coded settings config rows with backend runtime configuration snapshot.
- [x] Verify frontend lint and build.
- [x] Verify backend tests.
- [x] Update docs and commit/push after the milestone.

## Progress

### 2026-07-03

- Added provider probing through internal provider routers.
- Added provider probe UI on the data source page.
- Kept provider switching backend-owned and upper layers provider-neutral.
- Added Redis-backed latest probe result lookup for quote and K-line categories.
- Added one-click all-provider probe for quote and K-line categories.
- Added read-only provider configuration snapshot for `/investments/settings`.
