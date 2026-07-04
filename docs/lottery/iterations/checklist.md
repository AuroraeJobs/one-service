# Lottery Module Checklist

Last updated: 2026-07-04

Use this file as the durable task board for the lottery module. When a task is finished, change `[ ]` to `[x]` and add a short note if there is useful context for the next thread.

## Baseline: Documentation And Boundaries

- [x] Add `docs/lottery` documentation folder.
- [x] Add lottery roadmap.
- [x] Add lottery checklist.
- [x] Add lottery menu and version plan.
- [x] Add lottery technical design overview.
- [x] Document current API groups: `record/*`, `lottery/training/*`, `lottery/astronauts/*`.
- [x] Document current frontend route groups from `one-web/src/routes/lifeRoutes.tsx`.
- [x] Audit duplicated lottery parsing/statistics logic across backend and frontend. Found duplicated draw parsing, frequency/omission, planet/hexagram, and prize scoring logic across `lotteryStats.ts`, `LotteryTrainingService`, `LotteryBallUtil`, and `LotteryAstronautService`.
- [x] Decide whether new record APIs should live under `lottery/records/*` while preserving `record/*` compatibility. New work should prefer `/lottery/records/*`; existing `record/*` remains compatible.

## Iteration 01: Historical Records And Sync Foundation

- [x] Add or confirm canonical lottery draw model. Added `LotteryDraw` DTO and `LotteryDrawUtil` normalization helpers.
- [x] Add repository/service methods for latest, first, range, and paged draw query. Added normalized `LotteryDraw` service methods and `/lottery/records/draws*` endpoints.
- [x] Add draw sync log model. Added `LotteryRecordSyncLog` persisted in `lottery_record_sync_logs`.
- [x] Add lottery draw provider interface. Added `LotteryDrawProvider`.
- [x] Move external record fetch/parsing behind provider implementation. Added `CwlLotteryDrawProvider`; `RecordUpdater` no longer calls `RecordCalendar` or `RecordClient` directly.
- [x] Add `GET /lottery/records/latest`. Reuses existing record service.
- [x] Add `GET /lottery/records/first`. Reuses existing record service.
- [x] Add `GET /lottery/records`. Supports issue/date/line filters and all-record fallback.
- [x] Add `POST /lottery/records/sync`. Triggers the existing record update flow.
- [x] Add `GET /lottery/records/sync-logs`. Supports optional `status` and `limit`.
- [x] Add Redis sync lock. Manual record sync now uses `lottery:records:sync:lock` with TTL and writes `SKIPPED` logs when another sync is running.
- [x] Add scheduled record sync. Added `LotteryRecordScheduledSync`, disabled by default with `hello.record.scheduled-sync-enabled`, cron configurable by `hello.record.scheduled-sync-cron`.
- [x] Keep existing `record/*` endpoints compatible. Added new controller without changing `RecordController`.
- [x] Add backend tests for number normalization, duplicate issue handling, and sync idempotency. Number normalization is covered by `LotteryDrawUtilTest`; normalized draw query is covered by `RecordServiceTest`; sync lock behavior is covered by `LotteryRecordSyncServiceTest`; scheduled sync is covered by `LotteryRecordScheduledSyncTest`; provider-backed updater no-new-record, old-issue skip, duplicate issue, and sequential line assignment paths are covered by `RecordUpdaterTest`.
- [x] Add frontend API client methods for `/lottery/records/*`. Includes sync and sync-log methods.
- [x] Update frontend record loading to use normalized APIs when ready. `RecordContext` now loads paged `/lottery/records/draws`, keeps `allRecords` as compact strings for legacy statistics pages, and exposes `lotteryDraws` for future normalized UI work.

## Iteration 02: Statistics Cockpit

- [x] Define `LotteryStatisticsSummary` DTO. Includes draw count, first/latest draw metadata, red/blue frequency, and structural distributions.
- [x] Add frequency statistics endpoint. Added `GET /lottery/statistics/frequency`.
- [x] Add distribution statistics endpoint. Added `GET /lottery/statistics/distribution`.
- [x] Add yearly counts endpoint under lottery namespace or document continued `record/yearly-counts` use. Existing `GET /lottery/records/yearly-counts` and `POST /lottery/records/yearly-counts/statistics` are the lottery namespace entry points.
- [x] Add recalculation endpoint for derived statistics. Added `POST /lottery/statistics/summary/refresh`.
- [x] Cache derived statistics in Redis. `LotteryStatisticsService.summary()` reads/writes `lottery:statistics:summary`.
- [x] Invalidate or refresh statistics after record sync. `LotteryRecordSyncService` invalidates the statistics summary cache when sync saves new records.
- [x] Align frontend `lotteryStats.ts` with backend DTO semantics. `LotteryOverviewPage` now reads `LotteryStatisticsSummary`, uses backend red/blue frequency for charts, and keeps local `buildLotteryStats` for prediction/recent-draw details until remaining pages migrate.
- [x] Add overview drill-through links to statistics tabs. Overview actions and frequency/yearly cards now link to frequency and distribution tabs.
- [x] Verify empty, loading, stale-cache, and sync-needed states. Overview page now shows explicit status alerts for loading/recalculating statistics, backend-statistics fallback, stale summary count mismatch, and no-record sync-needed states.

## Iteration 03: Prediction Replay And Rule Operations

- [x] Add durable prediction snapshot model. Added `LotteryPredictionSnapshot` stored in `lottery_prediction_snapshots`.
- [x] Add durable training report model. Added `LotteryTrainingReportRecord` stored in `lottery_training_reports` and persisted when training completes.
- [x] Add prediction rule model or persist rule versions explicitly. Added `LotteryPredictionRuleRecord` stored in `lottery_prediction_rules` when training produces a learned rule.
- [x] Add prediction history endpoint. Added `GET /lottery/predictions`.
- [x] Add prediction detail endpoint. Added `GET /lottery/predictions/{id}`.
- [x] Add training start endpoint under `/lottery/predictions/train` or document continued `/lottery/training/start` use. Added `POST /lottery/predictions/train` delegating to the existing async training service.
- [x] Add actual-result attachment endpoint. Added `POST /lottery/predictions/{id}/actual` to attach actual draw results and rescore the snapshot and candidates.
- [x] Add replay metrics by historical window. Added `GET /lottery/predictions/replay-metrics` to aggregate latest training report timeline by requested window.
- [x] Add rule comparison endpoint. Added `GET /lottery/predictions/rules/compare` with recent rule records and best rank score metadata.
- [x] Add cancel/retry/status behavior for training. Added prediction namespace status, cancel, and retry endpoints plus cooperative cancellation in training loops.
- [x] Add prediction history page. Added `/lottery/predictions/history` with snapshot summary cards and recent prediction history list.
- [x] Add prediction detail page with candidates, score, rule, and actual result. Added `/lottery/predictions/:id` and linked it from prediction history cards.
- [x] Add tests for prediction scoring, actual attachment, and report persistence. Snapshot mapping, history limit, prediction actual attachment, report persistence mapping, and prediction controller routes are covered.

## Iteration 04: Personal Tickets And Prize Checking

- [x] Add `LotteryTicket` model. Added Mongo document model for personal ticket records.
- [x] Add `LotteryPrizeResult` model. Added prize result DTO with hit counts, grade, level, fixed amount, and winning flag.
- [x] Add ticket repository and service. Added `LotteryTicketRepository` and `LotteryTicketService` with default user scoping and ticket normalization.
- [x] Add `GET /lottery/tickets`. Supports optional `issue` filter.
- [x] Add `POST /lottery/tickets`. Creates normalized personal tickets.
- [x] Add `PUT /lottery/tickets/{id}`. Updates existing personal tickets.
- [x] Add `DELETE /lottery/tickets/{id}`. Deletes an existing personal ticket by ID.
- [x] Add `POST /lottery/tickets/check-prizes`. Checks tickets for the actual draw period and writes prize result, grade, and checked status.
- [x] Add `GET /lottery/tickets/summary`. Aggregates ticket count, checked/pending counts, winning count, cost, prize amount, and distributions.
- [x] Add prize grade calculation utility. Added `LotteryPrizeCalculator` with validation-backed hit counting and prize grade mapping tests.
- [x] Add ticket list page. Added `/lottery/tickets` with summary cards, issue filter, and ticket table backed by ticket APIs.
- [x] Add ticket create/edit modal. Ticket list page now supports create, edit, and delete actions with normalized number input.
- [x] Add action to save prediction candidates as tickets. Prediction detail page can save the primary prediction or any candidate as a draft prediction-sourced ticket.
- [x] Add filters by issue, status, source, and prize grade. Ticket API and ticket list page now support issue, status, source, and prize grade filters.
- [x] Add tests for prize grade calculation. Covered first through sixth prize, no prize, normalized number matching, and invalid hit counts.

## Iteration 05: Outcome Analysis And Ledger

- [x] Add ledger summary DTO. Added `LotteryLedgerSummary` and `GET /lottery/ledger/summary` for cost, prize, net result, and ROI.
- [x] Add issue-level ledger endpoint. Added `LotteryIssueLedger` and `GET /lottery/ledger/issues` to aggregate ticket outcomes by issue.
- [x] Add monthly ledger endpoint. Added `LotteryMonthlyLedger` and `GET /lottery/ledger/months` to aggregate cost and outcome by ticket creation month.
- [x] Add rule/source performance endpoint. Added `LotteryPerformanceLedger` and `GET /lottery/ledger/performance?dimension=source|rule` for source and prediction-rule outcome analysis.
- [x] Add total cost, total prize, net result, ROI, and hit-rate cards. Added `/lottery/ledger` summary cards backed by `GET /lottery/ledger/summary`.
- [x] Add issue ledger table. `/lottery/ledger` now loads `GET /lottery/ledger/issues` and renders issue-level cost, prize, net result, and ROI rows.
- [x] Add monthly trend chart. `/lottery/ledger` now renders an ECharts monthly cost, prize, and net result trend from `GET /lottery/ledger/months`.
- [x] Add source/rule performance chart. `/lottery/ledger` now loads source and rule performance rows and charts net result with hit rate.
- [x] Link overview and prediction pages to ticket and ledger pages. Overview and prediction actions now navigate directly to `/lottery/tickets` and `/lottery/ledger`.
- [x] Add tests for summary math and filtering. Added ledger zero-cost ROI coverage and ticket issue-plus-secondary-filter coverage.

## Iteration 06: Provider, Settings, And Operations

- [x] Add lottery provider health DTO. Added `LotteryProviderHealth` for registered draw provider status.
- [x] Add provider config snapshot DTO. Added `LotteryProviderConfig` for active draw provider, registered providers, and scheduled sync state.
- [x] Add provider probe result DTO. Added `LotteryProviderProbeResult` for provider availability, record count, duration, and message.
- [x] Add `GET /lottery/providers/health`. Added provider service/controller endpoint with service and controller tests.
- [x] Add `GET /lottery/providers/config`. Added provider config endpoint with service and controller tests.
- [x] Add `GET /lottery/providers/probe`. Added provider probe endpoint with success, missing-provider, and failure-path tests.
- [x] Add `LotteryPreference` model. Added default-user lottery preference document for training and ticket defaults.
- [x] Add `GET /lottery/preferences`. Added preference lookup endpoint with default fallback.
- [x] Add `PUT /lottery/preferences`. Added preference update endpoint with normalization and tests.
- [x] Add sync operations page with logs, retry, and scheduled trigger. Added `/lottery/sync` with log filters and manual, retry, and scheduled sync actions.
- [x] Add settings page for preferences and training defaults. Added `/lottery/settings` with preference loading and saving for training scale, replay count, auto-save, and ticket source.
- [x] Add data quality check endpoint. Added `GET /lottery/data-quality` for missing issues, duplicates, malformed numbers, and future dates.
- [x] Add data quality UI for missing issues, duplicates, malformed numbers, and future dates. Added `/lottery/data-quality` summary cards and issue sample lists.

## Iteration 07: Operational Hardening And Data Quality Repair

- [x] Add provider probe log model. Added `LotteryProviderProbeLog` persisted in `lottery_provider_probe_logs`.
- [x] Persist provider probe results. `GET /lottery/providers/probe` now writes durable probe history without changing probe response semantics.
- [x] Add provider probe log endpoint. Added `GET /lottery/providers/probe-logs` with optional `provider` and `limit`.
- [x] Add record sync summary DTO. Added `LotteryRecordSyncSummary` for recent sync status counts, rates, saved count, latest status, issue range, and duration metrics.
- [x] Add `GET /lottery/records/sync-summary`. Aggregates recent MongoDB sync logs with a capped server-side limit.
- [x] Add data quality repair request/result DTOs. Added `LotteryDataQualityRepairRequest` and `LotteryDataQualityRepairResult`.
- [x] Add data quality missing-issue repair dry-run endpoint. Added `POST /lottery/data-quality/repair/missing-issues/dry-run`.
- [x] Add data quality missing-issue repair confirm endpoint. Added `POST /lottery/data-quality/repair/missing-issues/confirm`.
- [x] Add conservative malformed/duplicate repair report behavior. Iteration 07 repair only writes provider-backed missing issues; malformed and duplicate records remain report-only until trusted replacement rules are added.
- [x] Add provider operations panel to `/lottery/sync` or `/lottery/settings`. `/lottery/sync` now has a provider probe action and recent probe-log table.
- [x] Add sync summary cards to `/lottery/sync`. Added recent success/failure/saved/duration cards and a latest sync summary strip.
- [x] Add data quality repair UI with dry-run, confirm, and before/after report. `/lottery/data-quality` now generates missing-issue repair plans, confirms provider-backed fixes, and shows before/after repair counts.
- [x] Integrate preferences into prediction page defaults. Prediction training uses default scale/replay count, auto-save can save the primary prediction as a ticket, and prediction-detail ticket saving uses the default ticket source.
- [x] Add visible data quality indicators on operational entry points. `/lottery/sync` now reads the data-quality report and shows a warning link when issues exist.
- [x] Add frontend API client methods for new Iteration 07 endpoints. Added sync-summary, provider probe, and provider probe-log client methods.
- [x] Add backend tests for repair dry-run/confirm behavior. Covered dry-run no-save behavior, confirm save/reorder behavior, and controller endpoint binding.
- [x] Run frontend build after operational page changes. `npm run build` passed after `/lottery/sync` and `/lottery/data-quality` updates.

## Iteration 08: Prediction Automation And Ticket Closure

- [x] Add ticket batch-save request/result DTOs. Added `LotteryTicketBatchSaveRequest` and `LotteryTicketBatchSaveResult`.
- [x] Add ticket prize-check summary DTO. Added `LotteryTicketPrizeCheckSummary`.
- [x] Add ticket duplicate detection. Single-ticket and batch saves now treat same issue plus normalized red/blue numbers as idempotent for the default user.
- [x] Add `POST /lottery/tickets/batch`. Batch saving skips existing and in-request duplicate tickets.
- [x] Add `POST /lottery/tickets/check-prizes/latest`. Uses the latest draw record to check pending tickets for that issue and returns a summary.
- [x] Add backend tests for batch save, duplicate skip, and latest prize-check summary.
- [x] Add frontend API client methods for batch ticket save and latest prize-check summary. Added `lotteryTicketApi.saveTickets` and `lotteryTicketApi.checkLatestPrizes`.
- [x] Add one-click save of prediction primary plus candidate numbers. Prediction detail can now save the primary prediction and all candidates in one batch, with backend duplicate skipping.
- [x] Add latest-draw prize-check action to `/lottery/tickets`. Ticket page can run latest-draw prize checking and displays the returned summary.
- [x] Add prediction history result-status filtering. `/lottery/predictions/history` can filter all, pending, winning, and missed prediction snapshots.
- [x] Add prediction detail saved-ticket count or linkback backend support. `GET /lottery/tickets` now accepts `predictionSnapshotId` for snapshot-linked ticket lookup.
- [x] Add prediction detail saved-ticket count or linkback UI. Prediction detail shows linked ticket count and opens `/lottery/tickets?predictionSnapshotId=...`.
- [x] Add ticket page linkback to prediction snapshot when `predictionSnapshotId` exists. Ticket rows now expose a prediction-detail shortcut for linked tickets.
- [x] Add prediction actual-result attachment from latest draw where matching snapshots exist. Added `POST /lottery/predictions/attach-latest-actual`.
- [x] Update frontend build after Iteration 08 page changes. `npm run build` passed after batch-save, latest prize-check, history filters, and ticket linkback UI changes.

## Iteration 09: Daily Workflow And Scalable Lists

- [x] Add workbench summary DTO. Added `LotteryWorkbenchSummary` with latest draw, sync summary, data quality, prediction, training status, pending ticket count, latest prize-check summary, and ledger snapshot.
- [x] Add `GET /lottery/workbench/summary`. Added `LotteryWorkbenchController` and service composition without duplicating provider parsing or lottery scoring logic.
- [x] Add daily workflow step/result DTOs. Added `LotteryWorkbenchStepResult` and `LotteryWorkbenchDailyRunResult` with step status, timestamps, counts, and error fields.
- [x] Add `POST /lottery/workbench/daily-run`. It runs record sync, latest-actual prediction attachment, latest pending-ticket prize check, and statistics summary refresh with per-step status.
- [x] Keep long-running prediction training explicit. Workbench summary exposes training status and daily-run does not start prediction training.
- [x] Add backend tests for workbench summary composition and daily-run step status behavior. Added service and controller tests.
- [x] Add pagination response envelope for lottery list endpoints that can grow. Added shared `LotteryPageResponse<T>` with `items`, `page`, `pageSize`, `total`, and `hasNext`.
- [x] Add paged prediction history query with result-state, target-period, and rule filters while preserving existing limit-based compatibility. `GET /lottery/predictions?page=...` returns the paged envelope; no-page requests still return the legacy list.
- [x] Add paged ticket query with issue, status, source, prize grade, prediction snapshot, and created-time filters while preserving existing list compatibility. `GET /lottery/tickets?page=...` returns the paged envelope; no-page requests still return the legacy list.
- [x] Add paged sync-log and provider-probe-log queries while preserving existing limit-based compatibility. `GET /lottery/records/sync-logs?page=...` and `GET /lottery/providers/probe-logs?page=...` return the paged envelope; no-page requests still return legacy lists.
- [x] Add frontend API client methods/types for workbench summary, daily-run, and paged list responses. Added workbench APIs, shared page response type, prediction history page client, and ticket page client.
- [x] Add `/lottery/workbench` route and navigation entry. Added protected route and lottery sub-navigation item after overview.
- [x] Build workbench UI with daily status cards, step-run action, data-quality warning, latest prediction/ticket/ledger sections, and drill-through links.
- [x] Add query-parameter-backed filters and pagination controls to prediction history. `/lottery/predictions/history` now uses the paged backend query and persists page, result state, target period, and rule filter in the URL.
- [x] Add query-parameter-backed filters and pagination controls to ticket list. `/lottery/tickets` now uses the paged backend query and persists issue, status, source, prize grade, prediction snapshot, page, and page size in the URL.
- [x] Add pagination controls to sync/probe history surfaces if their backend endpoints are migrated in this iteration. `/lottery/sync` now uses paged sync-log and provider-probe-log APIs with separate URL-backed pagination state.
- [x] Update `docs/lottery/modules/technical-design.md` with workbench, daily-run, and pagination contracts.
- [x] Update `docs/lottery/menu-and-version-plan.md` with workbench route/menu placement.
- [x] Run focused backend tests for changed services/controllers. Workbench, prediction pagination, and ticket pagination service/controller tests passed.
- [x] Run frontend build after workbench and list-page changes. `npm run build` passes after workbench, prediction history, ticket list, and sync/probe pagination controls.
- [x] Review git status and diff before each commit, then commit and push.

## Iteration 10: Lottery Intelligence Platform

### Wave 10A: Daily State Backbone

- [x] Confirm Iteration 09 workbench and scalable-list tasks are complete before adding higher-level platform features.
- [x] Add stable query-backed drill-through links between workbench, prediction history, ticket pages, ledger, sync, and data quality pages.
- [x] Add a compact daily state DTO so the module can show whether sync, prediction review, ticket confirmation, prize checking, and quality repair are complete for the current issue.
- [x] Add `GET /lottery/workbench/daily-state` and cover service/controller state composition with tests.
- [x] Preserve all existing lottery routes while keeping `/lottery/workbench` the daily entry point.
- [x] Update workbench UI to show daily-state badges and route users into the right filtered specialist page.
- [x] Run focused Maven tests and `npm run build`, then commit and push Wave 10A independently.

### Wave 10B: Strategy Experiment Lab

- [x] Add durable strategy experiment model with strategy name, parameters, replay window, generated candidates, score distribution, and outcome summary.
- [x] Add `POST /lottery/experiments/run` for explicit experiment runs.
- [x] Add `GET /lottery/experiments` with pagination, tags, strategy, and date filters.
- [x] Add `GET /lottery/experiments/{id}` for experiment detail and candidate review.
- [x] Add experiment notes/tags so useful trials can be revisited.
- [x] Add backend tests for experiment persistence, parameter normalization, and paged search.
- [x] Add experiment lab frontend route and API client types.

### Wave 10C: Backtest And Replay Evidence

- [x] Add durable backtest report model with replay rows, prize distribution, hit statistics, stability score, and bankroll simulation.
- [x] Add `POST /lottery/backtests/run` with preset windows and custom issue-range support.
- [x] Add `GET /lottery/backtests` and `GET /lottery/backtests/{id}`.
- [x] Connect backtest summaries to rule comparison and source/rule ledger performance. Rule comparison and ledger performance rows now expose matched `LotteryBacktestSummary` by strategy/rule/source keys.
- [x] Add frontend backtest report page with paged replay rows and chart summaries.
- [x] Add export-ready report snapshot fields for future CSV/PDF export.

### Wave 10D: Alerts, Calendar, And Daily Reminders

- [x] Add draw calendar DTO with next draw date, expected sync window, and current issue state.
- [x] Add `GET /lottery/calendar` for upcoming draw and recent draw schedule context.
- [x] Add alert/reminder model for pending sync, pending prediction, pending ticket confirmation, and pending prize check.
- [x] Add alert acknowledgement endpoint and UI affordance.
- [x] Keep reminders in-app only until an explicit external notification provider is selected.

### Wave 10E: Portfolio-Style Governance

- [x] Extend preferences with weekly/monthly budget, max tickets per issue, and reminder thresholds.
- [x] Add backend checks that flag planned or recorded tickets exceeding configured limits.
- [x] Extend ledger with rolling cost, rolling prize, net result, ROI, and drawdown-style summaries.
- [x] Add frontend budget and exposure settings.
- [x] Add restrained warning copy for budget/exposure state without promising outcomes.

### Wave 10F: Export, Audit, And Maintenance

- [x] Add export endpoints for tickets, ledger rows, prediction snapshots, experiment reports, and sync/probe logs. Added CSV-shaped `GET /lottery/exports/{type}` for `tickets`, `ledger-issues`, `predictions`, `experiments`, `backtests`, `sync-logs`, and `probe-logs`.
- [x] Add audit metadata for generated predictions, saved tickets, daily-run steps, experiments, and exports. Added shared `LotteryAuditMetadata` on touched durable records and `LotteryAuditEvent` for export events.
- [x] Add maintenance summary for stale caches, old logs, and oversized history collections. Added `GET /lottery/maintenance/summary` with cache presence/TTL, log retention, and high-growth collection previews.
- [x] Add cleanup/dry-run endpoints where safe and keep destructive maintenance confirm-only. Added non-destructive `POST /lottery/maintenance/cleanup/dry-run`; no destructive cleanup is exposed in this wave.
- [x] Add tests for export integrity, audit-field preservation, and maintenance dry-run behavior. Added service/controller tests plus audit assertions for tickets, experiments, and backtests.
- [x] Update docs and run appropriate backend/frontend verification after each wave.
- [x] Commit and push each wave independently.

## Iteration 11: Frontend Experience And Power Tools

### Wave 11A: Frontend Shell And Personalized Cockpit

- [x] Audit lottery routes, page titles, nav labels, and primary actions. Reviewed `lifeRoutes.tsx`, `lifeDataModules.tsx`, and existing lottery action surfaces before keeping the first 11A slice centered on `/lottery/workbench`.
- [x] Add a compact quick-action rail or panel for sync, prediction, ticket save, prize check, ledger review, alerts, and export. `/lottery/workbench` now has a seven-action rail and latest prize-check can run directly from the workbench.
- [x] Upgrade `/lottery/workbench` widgets for daily state, recent prediction, pending tickets, alerts, budget warning, latest backtest, and latest ledger outcome. The workbench now keeps existing daily/budget/ledger widgets and adds recent prediction, ticket, experiment, backtest, and export shortcuts.
- [x] Add saved frontend view state for common filters and page sizes where query parameters already exist. Prediction history, ticket list, and sync operations now restore saved query state from local storage when opened without explicit URL parameters.
- [x] Add recent-work shortcuts for prediction snapshots, tickets, experiments, backtests, and exports.
- [x] Preserve URL-backed drill-through links from workbench to specialist pages.
- [x] Run `npm run build`, update docs, commit, and push. Wave 11A frontend shell is complete.

### Wave 11B: Research Comparison Studio

- [x] Add a frontend research comparison route, proposed `/lottery/research`. Added the route, protected route entry, and lottery prediction submenu item.
- [x] Build side-by-side comparison cards for selected experiments, backtests, rules, and ledger performance rows. The research page normalizes all four sources into evidence cards with matched backtest summaries when available.
- [x] Add selectable compare sets from existing experiment, backtest, rule, and ledger pages. The research page uses URL-backed `items` selection and defaults to representative recent backtests/rules/performance rows.
- [x] Add compact charts for stability score, average red hits, blue hit rate, net result, ROI, and prize distribution. Added ECharts metric, outcome, and stacked prize-distribution charts.
- [x] Add deep links from experiment detail, backtest detail, rule comparison, and ledger performance into the comparison route. Experiment/backtest list/detail pages, prediction rule surface, and ledger performance panel now link into `/lottery/research`.
- [x] Keep copy evidence-oriented and avoid outcome promises.
- [x] Run `npm run build`, update docs, commit, and push.

### Wave 11C: Ticket Workflow Power Tools

- [x] Add bulk ticket paste/import UI with preview before save. Ticket page now opens a paste modal, parses common issue/red/blue formats, normalizes rows, and previews them before batch save.
- [x] Add duplicate preview for existing matches and in-request duplicates. Bulk preview compares against existing saved tickets and marks duplicate rows within the pasted batch.
- [x] Add safe batch actions for source, status, note, and delete. Ticket list supports row selection with batch status/source/note updates and confirm-protected batch deletion.
- [x] Add issue timeline view grouping tickets, predictions, prize checks, and ledger result by issue. Ticket page now summarizes recent issues with ticket count, prediction-linked count, checked/pending counts, winners, net result, and ROI.
- [x] Add mobile-friendly card layout for ticket rows and prize-check results. Ticket rows switch from table to cards on narrow screens, and latest prize-check output has a compact result card.
- [x] Add stronger ticket shortcuts from prediction detail, workbench, and ledger issue rows. Prediction detail and workbench already link to ticket filters; ledger issue rows now expose a ticket shortcut for each issue.
- [x] Run `npm run build`, update docs, commit, and push.

### Wave 11D: Reports, Export, Audit, And Frontend Polish

- [x] Add a frontend report builder for tickets, ledger, prediction, experiment, backtest, sync-log, and probe-log sections. `/lottery/exports` now lets users select multiple export sections and generate a combined report preview.
- [x] Add browser CSV download for existing `GET /lottery/exports/{type}` responses. Single export results and report sections now download client-side CSV files from returned content.
- [x] Add audit explorer filters for type, target, date range, and row count where available. Audit events now have current-page filters for event/type, target/message text, date range, and minimum row count.
- [x] Improve maintenance preview with cache, log, and history grouping. Maintenance preview now summarizes cache, log, history, and other collection groups before the detailed tables.
- [x] Add print-friendly report view for selected report sections. Report preview supports browser printing with print-only layout rules.
- [x] Polish dense loading, empty, error, overflow, and responsive states across workbench, research, ticket, ledger, export, and alert pages. Export/audit/maintenance gained empty states, table scroll, responsive filters, and print layout while reusing the existing workbench/research/ticket/ledger/alert loading and empty-state patterns.
- [x] Run `npm run build`, update docs, commit, and push.

## Iteration 12: Reliability And Intelligent Operations

### Wave 12A: Provider Diagnostics And Sync Resilience

- [ ] Preserve CWL as the primary provider and document proxy-related failure modes.
- [ ] Build on explicit provider error handling so null upstream content never reaches JSON parsing.
- [ ] Add provider request diagnostics for direct/proxy/no-proxy context, HTTP status, response content type, latency, and safe response snippets.
- [ ] Add server-side configuration for provider direct/proxy/no-proxy behavior where supported.
- [ ] Surface suspected proxy/network block in `/lottery/sync`, sync logs, and provider probe logs.
- [ ] Keep fallback provider work secondary until primary direct-connect diagnostics are clear.
- [ ] Run focused provider/sync tests, update docs, commit, and push.

### Wave 12B: Data Quality Repair Automation

- [ ] Add data-quality issue summary for missing issues, duplicate issues, invalid numbers, out-of-order lines, and stale derived data.
- [ ] Add repair dry-run output that explains proposed inserts, skips, renumbering, and cache refreshes.
- [ ] Add confirm-only repair endpoints for safe bounded issue ranges.
- [ ] Add frontend repair review states on the quality or sync page.
- [ ] Add audit events for dry-run and confirmed repair actions.
- [ ] Run focused quality/repair tests, update docs, commit, and push.

### Wave 12C: Prediction Evidence And Rule Intelligence

- [ ] Automatically attach latest actual results to eligible prediction snapshots after sync.
- [ ] Add replay summary for candidates, hit distribution, rule version, and recent-window drift.
- [ ] Add rule evidence tags for stable, volatile, stale, and under-tested rules.
- [ ] Improve frontend comparison states so evidence quality is visible before a rule is trusted.
- [ ] Add export or report sections for replay and rule evidence.
- [ ] Run focused prediction/replay tests, frontend build if changed, update docs, commit, and push.

### Wave 12D: Daily Automation And Release Hardening

- [ ] Add scheduled sync runbook state with last run, next run, duration, and failure category.
- [ ] Add daily operation summary for sync, quality, prediction attachment, ticket prize check, and pending alerts.
- [ ] Add retention and export checks for sync logs, provider probe logs, repair audit events, and replay evidence.
- [ ] Add release checklist coverage for backend tests, frontend build, documentation, and pushed commits.
- [ ] Polish frontend empty/error/loading states touched by this month.
- [ ] Run month-end verification, update docs, commit, and push.

## Documentation And Delivery

- [x] Update `docs/lottery/modules/technical-design.md` after key architecture changes. Updated with ticket, ledger, provider, preference, data quality, probe-log, sync-summary, and ticket-automation contracts.
- [x] Update `docs/lottery/menu-and-version-plan.md` when menu scope changes. Updated route and API boundary plan for ticket, ledger, sync, settings, and quality pages.
- [x] Keep `docs/lottery/iterations/checklist.md` current after each milestone. Checklist reflects Iterations 01-06 completion.
- [x] Run backend tests for changed services/controllers. Ran focused Maven tests for changed backend services/controllers after each backend milestone.
- [x] Run frontend lint/build after changed pages or API types. Ran `npm run build` after frontend route/API/page changes.
- [x] Review `git status --short` and diff before committing. Reviewed status/diff before each pushed milestone.
