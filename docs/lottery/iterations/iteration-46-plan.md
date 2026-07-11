# Iteration 46: Sync Operations And Release Baseline Closure

Theme: 同步运维与发布基线收口

## Version Goal

Finish the current sync-operations and navigation work as one safe release slice. This iteration closes the in-flight UI, moves growing log queries onto database-backed pagination, makes deletion rules authoritative in the backend, and refreshes the release evidence before any new product surface is promoted.

Status: completed on 2026-07-11.

## Starting Point

- The sync operations page is being reshaped around compact sync-record cards, explicit filters, pagination, deletion confirmation, provider diagnostics, and responsive states.
- A sync-log delete path exists in the current worktree, but `RUNNING` protection must be enforced by the backend rather than only by a disabled frontend action.
- Sync-log and provider-probe-log page queries still load and filter full collections in memory before slicing a page.
- `/lottery` already renders the overview, while workbench, mobile, and settings entry semantics are being consolidated around the overview and related operational pages.
- The current route smoke summary passes 751 checks across 18 routes, but the durable release evidence snapshot still reflects the earlier 377-check, 17-route baseline and must not be treated as Iteration 46 evidence.

## Scope Principles

- Close and verify the current worktree before adding another lottery page or backend domain.
- Keep `/lottery` as the stable default overview and `/lottery/workbench` as the operation center.
- Keep all existing deep links routable even when a route is no longer a footer-level navigation item.
- Make backend services the source of truth for destructive-operation rules.
- Page and filter growing operational collections in MongoDB with deterministic newest-first ordering.
- Keep the checklist unchecked until implementation and the matching verification evidence are complete.

## Wave 46A: Sync Operations UI Closure

Goal: finish the in-flight `/lottery/sync` experience without expanding its operational scope.

- Finish the sync-record card layout, status filter, empty/loading/error states, deletion confirmation, and responsive presentation.
- Keep the visible manual-sync action clear and decide explicitly whether retry and scheduled-trigger actions remain backend-only or return as user-facing controls.
- Keep UI page numbers one-based while mapping requests to the backend's zero-based page contract.
- After deletion, keep the user on a valid page and reload counts and records from the server.
- Keep provider reliability and data-quality handoffs available from the sync operations context.

Acceptance:

- Sync records and provider probe logs preserve filters and page size across reloads.
- The last item on a non-first page can be deleted without leaving an empty invalid page.
- `RUNNING` records show a non-destructive disabled state, but frontend state is not the security boundary.
- Narrow-screen, empty, loading, and request-failure states are readable and actionable.

## Wave 46B: Backend Deletion And Database Pagination

Goal: make operational log behavior safe and scalable at the service/repository boundary.

- Reject deletion of a `RUNNING` sync log in the backend service and return a clear domain/API error.
- Preserve not-found handling and verify that deleting a completed log does not affect synced draw records.
- Replace full-collection sync-log filtering with repository-backed filters, deterministic `startedAt` descending order, `PageRequest`, and an accurate total count.
- Replace full-collection provider-probe-log filtering with repository-backed provider/status/time filters, deterministic `checkedAt` descending order, `PageRequest`, and an accurate total count.
- Add focused repository/service/controller tests for completed deletion, running deletion rejection, not-found behavior, filters, bounds, page numbering, ordering, and total counts.

Acceptance:

- Neither page API calls `findAll()` and slices the result in memory for normal list requests.
- Backend tests prove that a direct request cannot delete a running sync log.
- First, middle, last, empty, and filtered pages return stable metadata and newest-first rows.

## Wave 46C: Navigation Semantics Closure

Goal: make route ownership clear without removing specialist workflows.

- Keep `/lottery` as the default lottery entry and unified data overview.
- Keep `/lottery/workbench` as the operation center for current-issue closure and daily actions.
- Reach workbench, mobile, and settings from overview actions or relevant operational pages instead of keeping them as footer-level top items.
- Keep prediction, execution, review, data, and visualization groups in the existing single-row footer model.
- Align module entry paths, canonical-path helpers, active-group resolution, smoke fixtures, and visible labels with the same route semantics.

Acceptance:

- Entering the lottery module opens `/lottery`, not `/lottery/workbench`.
- `/lottery/workbench`, `/lottery/mobile`, and `/lottery/settings` remain directly routable and have discoverable in-product entry points.
- Footer active state and deep-link ownership remain correct for all preserved lottery routes.

## Wave 46D: Documentation And Release Baseline

Goal: leave one reproducible handoff instead of mixing an updated smoke summary with stale release evidence.

- Update the lottery README, long-term plan, menu/version plan, this plan, and the authoritative checklist.
- Keep unrelated login, life overview, finance, and other local changes outside the lottery delivery scope unless the user explicitly includes them.
- Run focused backend tests for changed sync-log/provider services and controllers.
- Run `npm run i18n:audit`, `npm run lottery:smoke`, file-scoped ESLint, `npm run build`, and `npm run lottery:release-check` from `one-web`.
- Browser-check `/lottery` and `/lottery/sync` in Chinese and English, desktop and narrow layouts, and light and dark themes when the local backend/session is available.
- Review `git status --short`, staged scope, generated reports, and `git diff --check` before delivery.

Acceptance:

- The current release evidence is generated from the same source state as the final Iteration 46 code and reports the current route/check totals.
- Browser blockers are recorded explicitly as environment blockers; they do not silently replace static and build verification.
- Every Iteration 46 checklist item is checked only after its implementation and evidence are present.

## Out Of Scope

- New lottery pages or another navigation group.
- Automatic deletion, hidden retention jobs, or background prediction work.
- Removing existing workbench, mobile, settings, or deep-analysis routes.
- Iteration 47 MiniGPT lottery research-loop implementation.

## Completion Evidence

- `/lottery/sync` now uses responsive record cards, explicit SUCCESS/FAILED filtering, independent loading/error/empty states, one-based visible paging, and delete confirmation. The UI maps to zero-based API pages and recovers to a valid page from server totals.
- The backend is authoritative for deletion: missing logs return `404`, `RUNNING` logs return `409 Conflict`, and completed-log deletion removes only the operational log.
- Sync and provider-probe pages now use MongoDB count/page queries with exact normalized provider matching, supported compound indexes, and deterministic time plus `_id` descending order.
- `/lottery` is the module-card and top-level default. Workbench, mobile, and settings remain direct routes and overview actions, while their footer ownership resolves to the overview group.
- Focused backend verification passed 38 tests: 3 repository, 16 service, and 19 controller tests.
- Frontend verification passed `npm run i18n:audit`, file-scoped ESLint, `npm run lottery:release-check`, and the production build. Route smoke passed 808 checks across 18 routes.
- In-app browser QA used the local QA frontend and backend data. It covered `/lottery` and `/lottery/sync`, Chinese/dark desktop and English/light 390px layouts, status-filter URL state, delete confirmation and cancellation, and preserved-route footer ownership; no real log was deleted.
