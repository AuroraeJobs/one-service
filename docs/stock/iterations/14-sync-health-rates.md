# Iteration 14: Sync Health Rates

Last updated: 2026-07-03

## Goal

Make K-line sync health easier to read from the summary cards. Users should see not only success and failure counts, but also the success and failure rate for the selected recent-log window.

## Scope

### Track A: Summary Rates

Deliverables:

- Add `successRate` and `failedRate` to `StockKLineSyncSummary`.
- Calculate rates in the backend service from MongoDB sync logs.
- Return `0.00` for empty windows.
- Show success and failure rate cards on `/investments/sync`.
- Keep frontend access behind internal `/stock/*` APIs.

Acceptance:

- Rates are based on the same bounded window used by `GET /stock/klines/sync-summary`.
- Rates are percentage values rounded to two decimals.
- Frontend displays backend-provided metrics and does not reimplement summary business logic.
- Time fields stay as millisecond timestamps.

## Checklist

- [x] Add `successRate` and `failedRate` fields to `StockKLineSyncSummary`.
- [x] Calculate percentage metrics in `StockKLineService`.
- [x] Add backend tests for non-empty and empty summary rates.
- [x] Update frontend API type.
- [x] Add success-rate and failure-rate cards on `/investments/sync`.
- [x] Update docs and commit/push after the milestone.

## Progress

### 2026-07-03

- Added backend-calculated K-line sync success and failure rates.
- Displayed rate metrics in the sync page summary cards.
- Kept summary source as MongoDB sync logs through internal stock APIs.
