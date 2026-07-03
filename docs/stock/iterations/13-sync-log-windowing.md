# Iteration 13: Sync Log Windowing

Last updated: 2026-07-03

## Goal

Make K-line sync log inspection scalable as MongoDB logs grow. Users should be able to choose how many recent logs are loaded without changing backend code or relying on a fixed top-50 query.

## Scope

### Track A: Bounded Log Window

Deliverables:

- Add optional `limit` support to `GET /stock/klines/sync-logs`.
- Reuse the same bounded window rule as sync summary: default 50, maximum 100.
- Use MongoDB repository methods with `Pageable` for all symbol/status filter combinations.
- Add a log-window selector on `/investments/sync`.
- Keep frontend access behind internal `/stock/*` APIs.

Acceptance:

- `limit` applies to unfiltered, symbol-only, status-only, and symbol+status log queries.
- Invalid or non-positive limits fall back to 50.
- Limits above 100 are capped at 100.
- Time fields stay as millisecond timestamps.

## Checklist

- [x] Replace fixed top-50 sync-log queries with pageable repository queries.
- [x] Add optional `limit` parameter to `GET /stock/klines/sync-logs`.
- [x] Reuse bounded 50/100 window normalization in the service layer.
- [x] Add frontend log-window selector on `/investments/sync`.
- [x] Add backend tests for log limit and cap behavior.
- [x] Update docs and commit/push after the milestone.

## Progress

### 2026-07-03

- Added bounded `limit` support to K-line sync-log API.
- Added 20/50/100 log window selection in the sync page.
- Kept sync logs persisted in MongoDB and all frontend calls routed through internal stock APIs.
