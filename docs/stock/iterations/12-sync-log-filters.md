# Iteration 12: Sync Log Filters

Last updated: 2026-07-03

## Goal

Make K-line sync operations easier to inspect when logs grow. Users should be able to narrow MongoDB sync logs by symbol and execution status without relying on frontend-only filtering.

## Scope

### Track A: Status Filter

Deliverables:

- Add optional `status` filtering to `GET /stock/klines/sync-logs`.
- Normalize status input in the service layer.
- Keep symbol normalization in the existing market service.
- Add a status filter control on `/investments/sync`.
- Keep sync-log data access behind internal `/stock/*` APIs.

Acceptance:

- Filtering by status queries MongoDB through repository methods.
- Filtering by symbol plus status uses the normalized symbol and normalized status.
- Time fields stay as millisecond timestamps.
- Provider-specific details remain behind backend provider routers and sync services.

## Checklist

- [x] Add status-specific sync-log repository queries.
- [x] Add optional `status` parameter to `GET /stock/klines/sync-logs`.
- [x] Update stock API client to pass sync-log query params.
- [x] Add status selector on `/investments/sync`.
- [x] Add backend tests for status and symbol+status filters.
- [x] Update docs and commit/push after the milestone.

## Progress

### 2026-07-03

- Added backend status filtering for K-line sync logs.
- Added `/investments/sync` status selector for SUCCESS, FAILED, and RUNNING logs.
- Kept logs persisted in MongoDB and frontend access limited to internal stock APIs.
