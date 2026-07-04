# One-Month Version Plan: Lottery Research Platform

## Version Window

Cycle length: 1 month.

Version goal: complete the next platform layer after the daily workbench and strategy experiment lab. The month should turn experiments into auditable backtest evidence, add daily reminders, introduce budget/exposure governance, and prepare export/audit/maintenance foundations without breaking existing lottery routes.

## Scope

Included:

- Wave 10C: Backtest And Replay Evidence.
- Wave 10D: Calendar And In-App Reminders.
- Wave 10E: Portfolio-Style Governance.
- Wave 10F: Export, Audit, And Maintenance foundations.
- Documentation, focused backend tests, frontend build, and independent commit/push after each weekly milestone.

Deferred unless the month finishes early:

- External notification providers.
- PDF export rendering.
- Destructive maintenance actions without dry-run and explicit confirmation.
- Replacing existing prediction/training algorithms.

## Week 1: Backtest Evidence Lab

Goal: make strategy quality visible through durable, repeatable replay evidence.

Status: shipped as the first Wave 10C slice. Remaining follow-up is to connect backtest summaries into rule comparison and source/rule ledger performance once those comparison surfaces are expanded.

Deliverables:

- Add `LotteryBacktestReport` durable model.
- Add backtest run request DTO with preset windows and custom issue range.
- Add `POST /lottery/backtests/run`.
- Add `GET /lottery/backtests` with pagination and filters.
- Add `GET /lottery/backtests/{id}`.
- Persist replay rows, hit statistics, prize distribution, stability score, and bankroll simulation.
- Add frontend `/lottery/backtests` and `/lottery/backtests/:id`.
- Add paged replay rows and compact chart/summary cards.

Acceptance:

- A backtest run returns a durable report id.
- Report detail can be audited without re-running the job.
- Replay rows are paged.
- Tests cover preset windows, custom ranges, report persistence, and summary calculations.
- `npm run build` passes.

## Week 2: Calendar And In-App Reminders

Goal: help the workbench explain what needs attention next.

Status: shipped as Wave 10D. Calendar state and in-app reminders are backend-derived, support acknowledgement, and intentionally avoid external notification providers.

Deliverables:

- Add draw calendar DTO with next draw date, expected sync window, and current issue state.
- Add `GET /lottery/calendar`.
- Add reminder model for pending sync, pending prediction review, pending ticket confirmation, and pending prize check.
- Add reminder acknowledgement endpoint.
- Add workbench and reminder UI affordance.
- Keep reminders in-app only.

Acceptance:

- Calendar state is produced by backend services, not browser-only calculations.
- Reminders can be acknowledged.
- Acknowledged reminders do not reappear unless their underlying state changes.
- Tests cover reminder generation and acknowledgement.
- `npm run build` passes.

## Week 3: Budget And Exposure Governance

Goal: add restrained governance around ticket volume and ledger exposure.

Status: shipped as Wave 10E. Budget settings, backend warning status, workbench/ticket warnings, and rolling ledger exposure fields are implemented without blocking ticket CRUD.

Deliverables:

- Extend lottery preferences with weekly budget, monthly budget, max tickets per issue, and reminder thresholds.
- Add backend checks that flag recorded or planned tickets exceeding configured limits.
- Extend ledger summaries with rolling cost, rolling prize, net result, ROI, and drawdown-style summaries.
- Add frontend budget/exposure settings.
- Surface warnings in workbench and ticket pages without blocking existing CRUD.

Acceptance:

- Over-budget and over-ticket conditions are visible in workbench and ticket surfaces.
- Existing ticket CRUD remains compatible.
- Ledger summaries include rolling and drawdown-style values.
- Tests cover thresholds, max-ticket warnings, and rolling ledger summaries.
- `npm run build` passes.

## Week 4: Export, Audit, And Maintenance Foundations

Goal: make the research platform reviewable and maintainable.

Status: shipped as Wave 10F. The implementation delivers CSV-shaped API exports, durable export audit events, shared audit metadata on touched lottery records, a non-destructive maintenance summary, a cleanup dry-run endpoint, and a frontend `/lottery/exports` surface. Destructive cleanup and PDF rendering remain deferred.

Deliverables:

- Add export endpoints for tickets, ledger rows, prediction snapshots, experiment reports, backtest reports, sync logs, and probe logs.
- Add export audit metadata with export type, filters, generated row count, generated time, and requester scope.
- Add audit metadata for generated predictions, saved tickets, daily-run steps, experiments, and backtests where touched by this month.
- Add maintenance summary for stale caches, old logs, and oversized history collections.
- Add cleanup dry-run endpoints where safe.
- Add simple frontend export/maintenance surface if backend scope is stable by mid-week.

Acceptance:

- Export filters and generated row counts are recorded.
- Export endpoints return reproducible data for the same filters.
- Maintenance dry-run reports expected impact without modifying data.
- Tests cover export integrity, audit-field preservation, and dry-run behavior.
- `npm run build` passes.

Month-end split:

- The remaining Wave 10C integration item, connecting backtest summaries into rule comparison and source/rule ledger performance, is explicitly deferred to the next comparison-surface iteration.
- Week 4 intentionally stops at non-destructive maintenance foundations; destructive cleanup remains out of scope until a confirm-only flow and retention policy are selected.

## Weekly Delivery Rules

- Each week is a shippable milestone.
- Commit and push each weekly milestone independently.
- Keep existing APIs compatible.
- Update `docs/lottery/iterations/checklist.md`, `docs/lottery/modules/technical-design.md`, and `docs/lottery/menu-and-version-plan.md` as the contract changes.
- Use focused Maven tests for changed services/controllers.
- Run `npm run build` for frontend route, API type, or page changes.
- Run `git diff --check` before every commit.

## Month-End Release Criteria

- Waves 10C, 10D, 10E, and the non-destructive foundation of 10F are complete or explicitly split into a follow-up plan. The only Wave 10C split is the rule-comparison/ledger-performance integration noted above.
- All newly added growing lists use the shared pagination envelope.
- All new frontend routes are reachable from lottery navigation.
- No existing lottery routes are removed.
- Documentation reflects implemented contracts rather than aspirational behavior.
- Local worktree is clean and `origin/master` contains the final pushed commit.

## Risk Controls

- Backtest and experiment language must stay evidence-oriented and must not imply guaranteed outcomes.
- External notifications are out of scope until a provider is explicitly selected.
- Maintenance actions must be dry-run or confirm-only.
- Export work should prioritize CSV/JSON-shaped API data first; PDF rendering can wait.
- If Week 4 becomes too large, ship export/audit foundations first and move broader maintenance UI into the next month.
