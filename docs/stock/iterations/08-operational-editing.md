# Iteration 08: Operational Editing

Last updated: 2026-07-03

## Goal

Make stock operation pages practical for correction workflows. Users should be able to fix existing records instead of deleting and recreating them.

## Scope

### Track A: Trade Editing

Deliverables:

- Reuse the trade form for editing existing trades.
- Call `PUT /stock/trades/{id}` for updates.
- Refresh the trade list after save.
- Preserve backend recalculation as the source of position updates.

Acceptance:

- Users can create, edit, and delete trade records from `/investments/trades`.
- Frontend still sends normalized project DTOs to internal `/stock/*` APIs only.

### Track B: Alert Rule Editing

Deliverables:

- Reuse the alert rule form for editing existing rules.
- Call `PUT /stock/alerts/rules/{id}` for updates.
- Refresh rules after save.

Acceptance:

- Users can create, edit, delete, evaluate, and inspect alert rules from `/investments/alerts`.
- Alert evaluation still depends on backend quote service and normalized DTOs.

## Checklist

- [x] Add edit action for trade records.
- [x] Reuse trade modal for create and edit.
- [x] Wire trade update to `PUT /stock/trades/{id}`.
- [x] Add edit action for alert rules.
- [x] Reuse alert modal for create and edit.
- [x] Wire alert update to `PUT /stock/alerts/rules/{id}`.
- [x] Add account selector UX for trade and position pages.
- [x] Surface recalculation impact more explicitly after trade save/delete.
- [x] Verify frontend lint and build.
- [x] Update docs and commit/push after the milestone.

## Progress

### 2026-07-03

- Added edit actions to `/investments/trades`.
- Added edit actions to `/investments/alerts`.
- Reused existing create modals and internal update APIs.
- Verified with changed-file ESLint and full frontend build.

### 2026-07-03 Account And Recalculation UX

- Added account selectors to trade and position pages using `GET /stock/accounts`.
- Trade save, update, and delete now surface a success message that backend recalculation has been triggered.
