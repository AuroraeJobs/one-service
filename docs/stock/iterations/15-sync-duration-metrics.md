# Iteration 15: Sync Duration Metrics

Last updated: 2026-07-03

## Goal

Make K-line sync operations easier to diagnose when provider calls slow down. Users should see recent and average sync duration from the same bounded MongoDB log window used by the sync summary.

## Scope

### Track A: Duration Metrics

Deliverables:

- Add `latestDurationMs` and `averageDurationMs` to `StockKLineSyncSummary`.
- Calculate durations in the backend service from millisecond timestamps.
- Ignore running or invalid logs that do not have a valid finished timestamp.
- Show recent and average duration cards on `/investments/sync`.
- Keep frontend access behind internal `/stock/*` APIs.

Acceptance:

- Duration metrics are based on the same bounded window used by `GET /stock/klines/sync-summary`.
- `latestDurationMs` is derived from the latest log when it has valid start and finish timestamps.
- `averageDurationMs` includes only completed logs with non-negative durations.
- Frontend displays backend-provided metrics and does not reimplement summary business logic.

## Checklist

- [x] Add `latestDurationMs` and `averageDurationMs` fields to `StockKLineSyncSummary`.
- [x] Calculate duration metrics in `StockKLineService`.
- [x] Add backend tests for populated and empty duration metrics.
- [x] Update frontend API type.
- [x] Add recent-duration and average-duration cards on `/investments/sync`.
- [x] Update docs and commit/push after the milestone.

## Progress

### 2026-07-03

- Added backend-calculated K-line sync duration metrics.
- Displayed recent and average duration in the sync page summary cards.
- Kept sync summary sourced from MongoDB logs through internal stock APIs.
