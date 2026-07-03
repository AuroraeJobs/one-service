# Iteration 09: Sync Recovery

Last updated: 2026-07-03

## Goal

Make historical K-line sync easier to recover when a provider call fails. Operators should be able to inspect failed logs and retry a single-symbol sync without retyping the symbol.

## Scope

### Track A: Failed Log Retry

Deliverables:

- Add retry action for failed single-symbol K-line sync logs.
- Reuse existing internal provider-backed sync API.
- Keep JSON import as an advanced fallback, not the default retry path.

Acceptance:

- Failed logs with a symbol can be retried from `/investments/sync`.
- Retry calls internal `/stock/{symbol}/klines/sync` without a body so backend provider routing remains the source of data.
- Batch logs stay visible but are not retried as a single log unless a backend batch retry contract is added later.

## Checklist

- [x] Add retry action for failed single-symbol sync logs.
- [x] Link sync-log symbols back to single-symbol sync mode.
- [x] Keep Provider-backed sync as the retry path.
- [ ] Add backend batch retry endpoint if batch retry semantics are needed.
- [x] Verify frontend lint and build.
- [x] Update docs and commit/push after the milestone.

## Progress

### 2026-07-03

- Added retry action on failed sync logs with a symbol.
- Clicking a sync-log symbol prefills the single-symbol sync form.
- Retry uses existing provider-backed sync API and does not expose concrete provider details to the frontend.
- Verified with changed-file ESLint and full frontend build.
