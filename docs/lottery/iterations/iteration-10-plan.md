# Iteration 10 Plan: Lottery Intelligence Platform

## Version Goal

Turn the completed daily lottery workbench into a longer-running research platform. The next version should make strategy experiments, backtest evidence, daily state, and governance auditable without changing the existing prediction, ticket, ledger, sync, or visual-analysis routes.

Iteration 10 should be delivered as independent waves. Each wave must keep existing API compatibility, update docs, run focused verification, then commit and push independently.

For a one-month delivery view after Waves 10A and 10B, use `docs/lottery/iterations/one-month-version-plan.md`.

## Scope Principles

- Keep `/lottery/workbench` as the daily entry point, not a replacement for specialist pages.
- Keep prediction generation explicit when it can be long-running.
- Keep browser code on project-owned `lottery/*` APIs only.
- Store durable research artifacts in MongoDB; use Redis only for short-lived state, locks, and derived cache.
- Keep all prediction, experiment, and backtest language evidence-oriented and avoid any implication of guaranteed outcomes.
- Prefer paged envelopes for all growing lists: `items`, `page`, `pageSize`, `total`, and `hasNext`.

## Delivery Waves

### Wave 10A: Daily State Backbone

Goal: make the workbench resumable after refresh and make drill-through links stable.

- Add a compact `LotteryDailyState` DTO for the current issue.
- Include sync state, latest draw state, prediction state, ticket state, prize-check state, and quality state.
- Add `GET /lottery/workbench/daily-state`.
- Extend workbench summary to reference daily state without duplicating specialized page data.
- Add query-backed drill-through links from workbench cards into prediction history, tickets, ledger, sync logs, and data quality.
- Preserve all existing lottery routes and aliases.

Acceptance:

- Workbench can show whether the current issue needs sync, prediction review, ticket confirmation, prize check, or quality repair.
- Refreshing the page preserves the same daily state and drill-through targets.
- Backend service and controller tests cover state composition.
- Frontend build passes.

### Wave 10B: Strategy Experiment Lab

Goal: make strategy trials durable and revisit-able without replacing the active prediction rule.

- Add `LotteryStrategyExperiment` with strategy name, parameters, replay window, input source, generated candidates, score distribution, outcome summary, tags, notes, and timestamps.
- Add `POST /lottery/experiments/run`.
- Add `GET /lottery/experiments` with pagination, strategy, tag, and date filters.
- Add `GET /lottery/experiments/{id}` for detail and candidate review.
- Add frontend route `/lottery/experiments` and detail route `/lottery/experiments/:id`.
- Add experiment notes/tags editing if the first implementation already has stable persistence.

Acceptance:

- Running an experiment returns a durable experiment id.
- List filters are URL-backed and paged.
- Detail page shows parameters, candidates, score distribution, outcome summary, tags, and notes.
- Tests cover persistence, parameter normalization, paged search, and detail lookup.

### Wave 10C: Backtest Evidence Lab

Goal: make strategy quality visible through repeatable replay evidence.

- Add `LotteryBacktestReport` with replay rows, hit statistics, prize distribution, stability score, and bankroll simulation.
- Add `POST /lottery/backtests/run` with preset windows and custom issue-range support.
- Add `GET /lottery/backtests` and `GET /lottery/backtests/{id}`.
- Connect summaries to rule comparison and source/rule ledger performance where data already exists.
- Add frontend backtest report page with paged replay rows and compact chart summaries.
- Add export-ready snapshot fields, but defer actual export endpoints to Wave 10F.

Acceptance:

- Backtest runs are reproducible from persisted inputs.
- Report detail can be audited without re-running the job.
- Replay rows are paged.
- Tests cover preset windows, custom issue ranges, persisted report shape, and summary calculations.

### Wave 10D: Calendar And In-App Reminders

Goal: help the daily workbench explain what needs attention next.

- Add draw calendar DTO with next draw date, expected sync window, and current issue state.
- Add `GET /lottery/calendar`.
- Add in-app reminders for pending sync, pending prediction review, pending ticket confirmation, and pending prize check.
- Add acknowledgement endpoint and UI affordance.
- Keep notifications inside the app until an external notification provider is explicitly selected.

Acceptance:

- Calendar state does not depend on browser-only calculations.
- Reminders can be acknowledged and do not repeatedly reappear without state change.
- Tests cover reminder generation and acknowledgement.

### Wave 10E: Budget And Exposure Governance

Goal: add restrained governance around ticket volume and ledger exposure.

- Extend preferences with weekly budget, monthly budget, max tickets per issue, and reminder thresholds.
- Add backend checks that flag recorded or planned tickets exceeding configured limits.
- Extend ledger summaries with rolling cost, rolling prize, net result, ROI, and drawdown-style summaries.
- Add frontend budget/exposure settings.
- Use restrained warning copy and do not block CRUD unless a future explicit enforcement mode is added.

Acceptance:

- Over-budget conditions are visible in workbench and ticket surfaces.
- Existing ticket CRUD remains compatible.
- Tests cover budget thresholds, max-ticket warnings, and rolling ledger summaries.

### Wave 10F: Export, Audit, And Maintenance

Goal: make the research platform maintainable and externally reviewable.

- Add export endpoints for tickets, ledger rows, prediction snapshots, experiment reports, backtest reports, sync logs, and probe logs.
- Add audit metadata for generated predictions, saved tickets, daily-run steps, experiments, backtests, and exports.
- Add maintenance summary for stale caches, old logs, and oversized history collections.
- Add cleanup/dry-run endpoints where safe; destructive maintenance must be confirm-only.
- Add tests for export integrity, audit-field preservation, and maintenance dry-run behavior.

Acceptance:

- Export filters are persisted in audit metadata with generated row counts.
- Audit metadata survives ordinary update flows.
- Maintenance dry-run reports expected impact without modifying data.

## Suggested First Implementation Slice

Start with Wave 10A only:

1. Add backend daily-state DTO and service composition.
2. Add `/lottery/workbench/daily-state` controller and tests.
3. Extend the workbench UI to show daily-state badges and query-backed drill-through links.
4. Update `technical-design.md`, `menu-and-version-plan.md`, and `checklist.md`.
5. Run focused Maven tests and `npm run build`.
6. Commit and push.

This keeps the platform iteration grounded in the daily workflow before adding the experiment lab.
