# Iteration 11: Sync Operations Summary

Last updated: 2026-07-03

## Goal

Make the sync menu easier to operate at a glance. Users should see whether recent K-line sync is healthy before scanning the detailed MongoDB log table.

## Scope

### Track A: K-Line Sync Summary

Deliverables:

- Add a normalized K-line sync summary DTO.
- Add an internal sync summary API.
- Summarize recent sync logs by status, requested count, saved count, and latest completion times.
- Show summary metrics on `/investments/sync`.
- Add a manual trigger for scheduled-sync semantics.

Acceptance:

- Summary is derived from MongoDB sync logs.
- Summary timestamps stay as millisecond values.
- Frontend still calls only internal `/stock/*` APIs.
- Provider-specific details remain behind backend provider routers and sync services.

## Checklist

- [x] Add `StockKLineSyncSummary`.
- [x] Add `GET /stock/klines/sync-summary`.
- [x] Aggregate success, failure, running, requested, and saved counts from recent logs.
- [x] Support optional symbol filter with backend normalization.
- [x] Show sync summary metrics on `/investments/sync`.
- [x] Add `POST /stock/klines/sync/scheduled`.
- [x] Add scheduled-sync trigger action on `/investments/sync`.
- [x] Verify frontend lint and build.
- [x] Verify backend tests.
- [x] Update docs and commit/push after the milestone.

## Progress

### 2026-07-03

- Added K-line sync summary API.
- Added sync summary metric cards to the sync page.
- Added manual scheduled-sync trigger from the sync page.
- Kept sync logs in MongoDB and operational locks/state in Redis.
