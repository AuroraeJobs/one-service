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

- [x] Preserve CWL as the primary provider and document proxy-related failure modes. CWL remains the active draw provider; `403` is treated as a proxy/network diagnostic category rather than a source replacement trigger.
- [x] Build on explicit provider error handling so null upstream content never reaches JSON parsing. `RecordClientException` now carries failure category and request diagnostics for sync logs.
- [x] Add provider request diagnostics for direct/proxy/no-proxy context, HTTP status, response content type, latency, and safe response snippets. Probe results/logs now include request mode, HTTP status, content type, snippet, category, and network-block suspicion.
- [x] Add server-side configuration for provider direct/proxy/no-proxy behavior where supported. Added `LOTTERY_PROVIDER_NETWORK_MODE`, proxy host/port, timeout, and diagnostic snippet length config.
- [x] Surface suspected proxy/network block in `/lottery/sync`, sync logs, and provider probe logs. The sync page now shows failure category, request mode, HTTP status, and a warning for suspected proxy/network blocks.
- [x] Keep fallback provider work secondary until primary direct-connect diagnostics are clear. No fallback provider was added in 12A; diagnostics are the first shipped step.
- [x] Run focused provider/sync tests, update docs, commit, and push.

### Wave 12B: Data Quality Repair Automation

- [x] Add data-quality issue summary for missing issues, duplicate issues, invalid numbers, out-of-order lines, and stale derived data.
- [x] Add repair dry-run output that explains proposed inserts, skips, renumbering, and cache refreshes.
- [x] Add confirm-only repair endpoints for safe bounded issue ranges. Missing-issue confirm now requires `confirm=true`, supports `issueStart`/`issueEnd`, and keeps the capped repair limit.
- [x] Add frontend repair review states on the quality or sync page. `/lottery/data-quality` now shows range inputs, repair steps, renumber count, cache-refresh state, and audit id.
- [x] Add audit events for dry-run and confirmed repair actions.
- [x] Run focused quality/repair tests, update docs, commit, and push.

### Wave 12C: Prediction Evidence And Rule Intelligence

- [x] Automatically attach latest actual results to eligible prediction snapshots after sync. `LotteryRecordSyncService` now runs latest-actual prediction attachment after successful record sync and records the attachment count in the sync message.
- [x] Add replay summary for candidates, hit distribution, rule version, and recent-window drift. Added `LotteryReplaySummary` for snapshot candidate distribution, rule version context, red-hit distribution, and recent-vs-baseline drift.
- [x] Add rule evidence tags for stable, volatile, stale, and under-tested rules. Added `LotteryRuleEvidence` and conservative server-side classification for rule comparison, replay metrics, and prediction snapshots.
- [x] Improve frontend comparison states so evidence quality is visible before a rule is trusted. Prediction history/detail and research comparison now show evidence tags, scores, reasons, and replay summaries.
- [x] Add export or report sections for replay and rule evidence. Added `rule-evidence` and `replay-evidence` export types and included them in the frontend report builder.
- [x] Run focused prediction/replay tests, frontend build if changed, update docs, commit, and push.

### Wave 12D: Daily Automation And Release Hardening

- [x] Add scheduled sync runbook state with last run, next run, duration, and failure category. `LotteryWorkbenchSummary` now includes `scheduledSyncRunbook` from cron config and scheduled sync logs.
- [x] Add daily operation summary for sync, quality, prediction attachment, ticket prize check, and pending alerts. Added `LotteryDailyOperationSummary` to the workbench summary and UI.
- [x] Add retention and export checks for sync logs, provider probe logs, repair audit events, and replay evidence. Maintenance preview now includes audit events, prediction rules, and training reports; release checks surface retention/export warnings.
- [x] Add release checklist coverage for backend tests, frontend build, documentation, and pushed commits. Added `LotteryReleaseCheckSummary` with automatic and manual checklist items.
- [x] Polish frontend empty/error/loading states touched by this month. Workbench now shows runbook, operation, and release-check empty/default states without adding new navigation.
- [x] Run month-end verification, update docs, commit, and push. Verification: focused Maven service tests, focused Maven web tests, and `one-web npm run build`.

## Iteration 13: Guided Daily Decision Experience

Goal: add more frontend workflow depth so the lottery module guides a daily user from health checks, to prediction comparison, to ticket action, to result review.

### Wave 13A: Workbench Personalization And Action Queue

- [x] Add configurable workbench widget visibility/order persisted in browser-local state first, with room for backend preferences later. Added local layout state under `one:lottery:workbench:widgets:v1`.
- [x] Add an issue-focus strip that links latest draw, next target issue, pending predictions, ticket status, prize check, and ledger outcome. `/lottery/workbench` now shows these as a single drill-through row.
- [x] Add a daily action queue panel that groups pending sync, data quality, prediction attachment, ticket prize check, and export/release warnings. The queue is derived from daily state, operation summary, scheduled runbook, budget warnings, and release checks.
- [x] Add recent-work shortcuts for the last opened prediction, ticket issue, research comparison, export report, and maintenance page. Added top shortcuts above the existing recent-work grouped lists.
- [x] Polish responsive layout for the expanded workbench without nesting cards or hiding operational density. Added stable grids for widget settings, issue focus, action groups, and shortcuts across desktop/mobile.
- [x] Run frontend build, update docs, commit, and push. Verification: `one-web npm run build`; Browser smoke was blocked by local login/backend state and did not reveal a Vite overlay on the login screen.

### Wave 13B: Prediction Decision Board

- [x] Add a prediction decision board view that compares latest prediction, saved snapshots, candidate sets, rule evidence, and replay drift. Added `/lottery/predictions/decision` using existing prediction, rule, replay, and ticket APIs.
- [x] Add candidate comparison controls for red/blue overlap, score, evidence tag, actual-result status, and ticket conversion state. Decision rows show overlap, score, evidence, result state, and prediction-ticket conversion.
- [x] Add a guided pick builder that can select candidate rows and send them to ticket creation/import flows. Selected rows can be saved as `PREDICTION` draft tickets through the existing batch ticket API.
- [x] Add URL-backed filters and shareable state for selected target issue, rule group, and evidence status. Decision filters use `targetIssue`, `ruleName`, `evidence`, and `resultState` query parameters.
- [x] Add empty and warning states for under-tested, stale, or missing replay evidence before a candidate is trusted. Added warning tags and page-level evidence warning alert.
- [x] Run focused backend/frontend checks, update docs, commit, and push. Verification: frontend build; no backend contracts changed.

### Wave 13C: Ticket Import, Batch Review, And Budget Guardrails

- [x] Add paste/import assistant UI for tickets with preview parsing, duplicate grouping, and invalid row explanations. Existing import assistant now also has mobile preview cards and clearer duplicate/invalid summaries.
- [x] Add batch ticket actions for source, issue, stake, status, and delete/archive where existing APIs support it or can be safely extended. Batch toolbar now updates issue, quantity, cost, status, source, note, and supports archive/delete.
- [x] Add budget exposure cards by issue and month with warnings before new tickets exceed configured limits. Ticket page now shows recent issue/month exposure against configured limits.
- [x] Add issue settlement review that combines ticket rows, prize check output, ledger result, and prediction source. Added settlement review card for the active issue with source distribution, ledger metrics, prize-check context, and ticket rows.
- [x] Add mobile-first ticket review cards for imported rows, duplicate rows, and settlement rows. Import preview and settlement review now render compact mobile cards.
- [x] Run focused ticket/ledger tests, frontend build, update docs, commit, and push. Verification: frontend build; existing ticket and ledger APIs were reused.

### Wave 13D: Research Reports And Release Readiness

- [x] Add guided research comparison presets for latest prediction, strongest rule, volatile rule, and ticket outcome review. Research page now includes one-click presets and prediction evidence in the comparison model.
- [x] Add report-ready summary sections for prediction decision board, ticket settlement, budget exposure, and research comparison. Added decision report area, ticket settlement report area, budget exposure cards, and research report summary.
- [x] Add print/export polish for the new decision and settlement views. Decision, ticket settlement, and research summary support print-ready report areas.
- [x] Add release readiness checks for the new frontend flows, including route smoke checks and API contract coverage. Export/maintenance page now includes frontend release readiness checks for the new routes and reused API contracts.
- [x] Update version docs, technical design notes, and iteration checklist with delivered scope and verification. Version and technical design docs now describe 13B-13D.
- [x] Run month-end verification, commit, and push. Verification: `one-web npm run build`.

## Iteration 14: Productionized Decision Operations

Goal: turn the guided frontend workflows from Iteration 13 into durable, auditable, and testable operations so decision sets, ticket imports, budget checks, and release readiness survive reloads and can be trusted in daily use.

### Wave 14A: Shared Preferences And Saved Decision Sets

- [x] Add backend-backed workbench preference storage for widget visibility/order while preserving browser-local fallback. `LotteryPreference` now stores widget order/hidden keys; `/lottery/workbench` reads/writes preferences and still keeps local fallback state.
- [x] Add saved decision-set records for selected prediction candidates, rule/evidence context, target issue, and conversion state. Added `LotteryDecisionSet` and `LotteryDecisionCandidateSelection`.
- [x] Add APIs to list, create, update, and archive saved decision sets under project-owned `lottery/*` routes. Added `/lottery/decision-sets` list/create/update/archive APIs.
- [x] Update `/lottery/predictions/decision` to save/load decision sets and show unsaved-change state. Decision board now has saved-set selection, title/note editing, save, archive, and dirty-state tags.
- [x] Add audit events for saved decision set create/update/archive actions. `LotteryDecisionSetService` writes `LotteryAuditEvent` rows for each mutation.
- [x] Run focused backend/frontend checks, update docs, commit, and push. Verification: focused Maven tests for preference/decision-set service and controller; `one-web npm run build`.

### Wave 14B: Server-Side Ticket Import And Batch Guardrails

- [x] Add a server-side ticket import preview endpoint with normalized rows, invalid reasons, duplicate grouping, and proposed save payloads. Added `POST /lottery/tickets/import/preview` with backend-normalized rows and proposed tickets.
- [x] Add bulk ticket patch/archive endpoints so batch issue, quantity, cost, source, status, and note changes do not require many full-row `PUT` calls. Added sparse bulk update, archive, and delete APIs.
- [x] Add budget pre-check for proposed ticket imports and selected decision-set conversions before saving tickets. Added `POST /lottery/tickets/budget/precheck` and batch-save precheck output.
- [x] Add audit events for import preview, confirmed import, bulk update, archive, and delete actions. Ticket service now records `LotteryAuditEvent` rows for those operations.
- [x] Update the ticket page and decision board to use preview/pre-check results and show backend-confirmed warnings. Ticket import uses backend preview/precheck; decision board prechecks selected candidates before saving tickets.
- [x] Run focused ticket/import/budget tests, frontend build, update docs, commit, and push. Verification: focused Maven ticket service/controller tests; `one-web npm run build`.

### Wave 14C: Automated Route Smoke And Release Evidence

- [x] Add authenticated frontend route smoke coverage for workbench, decision board, ticket page, research page, and export/release page. Added `npm run lottery:smoke` to validate protected routes, lottery navigation entries, and component bindings for the five core routes.
- [x] Add fixture or mocked API data for route smoke so UI checks do not depend on live lottery provider availability. Added `one-web/scripts/fixtures/lottery-route-smoke.json` with mocked route/API evidence and explicit `providerNetwork=not-required`.
- [x] Add console-error and empty-state assertions for the new Iteration 13/14 frontend flows. The smoke script checks controlled `console.error` handling plus route-specific empty/error-state copy.
- [x] Feed smoke/build/test result summaries into release readiness surfaces or durable docs. `/lottery/exports` now lists the automated route smoke gate, and the script writes `one-web/reports/lottery-route-smoke-summary.json`.
- [x] Document local QA prerequisites for login state, backend service, and proxy-related provider failures. Quality gates and technical design now separate fixture smoke from real browser login/backend/proxy checks.
- [x] Run smoke/build verification, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm run build`.

### Wave 14D: Decision Outcome Feedback Loop

- [x] Add saved decision-set outcome comparison after actual draw attachment, including candidate hit distribution and ticket conversion results. Added `GET /lottery/decision-sets/outcomes` with candidate hit distribution, prize distribution, converted-ticket counts, checked/winning ticket counts, cost, prize, net, ROI, and hit-rate summaries.
- [x] Add rule/source performance deltas comparing saved decision sets against existing backtest and ledger evidence. Decision outcome items now include rule/source deltas against `lottery/ledger/performance` benchmarks, including net, ROI, hit-rate, and matched backtest stability context when available.
- [x] Add drift and stale-evidence alerts when a saved decision set was created from volatile, stale, or under-tested rules. Candidate outcome rows preserve saved evidence tags and aggregate stale, volatile, under-tested, missing-result, unconverted, and unchecked-ticket warnings.
- [x] Add export/report sections for saved decision sets, import previews, budget pre-checks, and settlement reviews. Added CSV export types `decision-sets`, `decision-outcomes`, `ticket-import-previews`, `budget-prechecks`, and `settlement-reviews`; budget precheck requests now write audit evidence.
- [x] Surface outcome feedback on workbench, decision board, research report, and ticket settlement pages. Workbench recent work includes decision outcomes, the decision board shows saved-decision replay cards, research treats outcomes as `decision` evidence, and the ticket settlement card includes same-issue decision context.
- [x] Run month-end verification, update docs, commit, and push. Verification: focused Maven tests for decision/ticket/export services and controller; `one-web npm run lottery:smoke`; `one-web npm run build`.

## Iteration 15: Frontend Outcome Operations

Goal: make the saved-decision outcome loop easier to operate from the frontend, with filterable review states, faster export handoff, and clearer daily follow-up queues.

### Wave 15A: Decision Outcome Focus Filters

- [x] Add URL-backed outcome filters on `/lottery/predictions/decision` for hit state, ticket conversion state, and evidence alert state. Decision board now filters saved-decision outcomes by hit/miss/pending, converted/unconverted/unchecked, and warning/stale/volatile/under-tested/clean states.
- [x] Add a compact outcome operations summary for filtered saved decisions. The decision board now shows filtered count, hit count, net result, ROI, unchecked items, and evidence reminder totals.
- [x] Add a selectable saved-outcome list so users can jump between matching decision sets without leaving the decision board. The active outcome card now includes a filtered list with issue, hit, conversion, net, and warning evidence.
- [x] Add frontend handoff from decision outcomes to CSV export. The decision board opens `/lottery/exports` with `type=decision-outcomes`, and the export page initializes type/filter state from URL parameters.
- [x] Run frontend smoke/build verification, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

### Wave 15B: Workbench Follow-Up Queue

- [x] Add workbench follow-up grouping for unchecked converted tickets, stale evidence, and high-warning saved decisions. Workbench action queue now derives decision follow-ups from saved outcomes and groups unchecked converted tickets, stale/volatile evidence, and high-warning export evidence.
- [x] Add quick actions from workbench outcome cards to decision board, ticket settlement, and export views with preserved issue context. Recent decision outcome cards now expose direct decision, ticket, and export actions with target issue parameters.
- [x] Add empty/error states that distinguish no saved decisions from no outcomes after filtering. Workbench recent groups now use source-specific empty text, and the decision board distinguishes no saved outcomes from no filtered matches.
- [x] Run smoke/build verification, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

### Wave 15C: Research And Ticket Outcome Drilldowns

- [x] Add research-page presets for saved decision outcomes by rule/source delta, warning state, and ROI band. Research page now includes decision delta, ROI priority, and warning review presets derived from saved decision outcomes.
- [x] Add ticket-page drilldowns from settlement review into matching saved-decision outcome candidates. Ticket settlement review now lists same-issue decision candidates with direct decision and ticket actions.
- [x] Add export report presets for outcome operation queues and month-end decision review. Export report builder now has outcome-operations and month-end report presets.
- [x] Run focused frontend checks, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

### Wave 15D: Release Evidence And Month-End UX Polish

- [x] Extend route smoke fixtures/assertions for outcome filters, export URL initialization, and workbench follow-up links. Route smoke fixture now targets V12 frontend outcome operations and checks decision empty states, workbench saved-outcome states, ticket drilldown copy, research presets, and export report presets.
- [x] Add release-readiness evidence for V12 frontend outcome operations. Export release readiness now includes outcome operations, V12 route smoke evidence, and month-end report presets.
- [x] Review responsive layout for decision, export, workbench, research, and ticket pages. CSS now keeps decision outcome grids, ticket decision drilldowns, report sections, release cards, and report builder controls single-column on narrow screens.
- [x] Run month-end verification, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

## Iteration 16: V13 Monthly Intelligence Automation

Goal: spend the next month turning the lottery module from a frontend-operated outcome cockpit into a repeatable intelligence and automation workflow: data health should be explainable, hypotheses should be traceable, reminders should lead users to the next action, and month-end review should be auditable without manual assembly.

### Week 1: Data Health And Outcome Intelligence Foundation

- [x] Add a lottery health score model that combines provider freshness, record gaps, ticket settlement coverage, decision outcome completeness, stale evidence, and export evidence into one summary. Added weighted operations health contributors and summary score/status/message.
- [x] Add backend summary API for `/lottery/operations/health` with issue-level health contributors and action links. Added `LotteryOperationsController`, `ILotteryOperationsService`, and `/lottery/operations/health/acknowledge`.
- [x] Add a workbench health widget with drilldowns into sync, data quality, decision outcomes, tickets, and exports. Workbench now loads operations health, shows score/contributors, and links each contributor to its operational route.
- [x] Add audit events for health-score generation, data-quality refresh, and manual health acknowledgement. Health generation and acknowledgement now write `LotteryAuditEvent` rows under `lottery-operations-health`.
- [x] Run focused backend/frontend checks, update docs, commit, and push. Verification: focused Maven operations service/controller tests; `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

### Week 2: Strategy Notebook And Hypothesis Lab

- [x] Add strategy-notebook records for rule hypotheses, expected behavior, linked predictions, linked backtests, and saved decision outcomes. Added `LotteryStrategyNote` and evidence attachment rows in `lottery_strategy_notes`.
- [x] Add APIs to list, create, update, archive, and attach evidence to strategy notes under project-owned `lottery/*` routes. Added `/lottery/strategy-notes` list/create/update/archive plus evidence attachment API with audit events.
- [x] Add `/lottery/research/notebook` frontend view with hypothesis cards, evidence attachments, status filters, and comparison shortcuts. Notebook page now supports status filtering, note creation, evidence display, archive, and pending evidence attachment.
- [x] Add research-page and decision-board actions to attach selected evidence or saved decisions into a notebook entry. Research and decision pages now open notebook with URL-backed evidence payloads.
- [x] Run focused service/controller tests, frontend build, update docs, commit, and push. Verification: focused Maven strategy-note service/controller tests; `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

### Week 3: Action Reminders And Daily Workflow Automation

- [x] Add reminder rules for upcoming draw windows, unsynced records, unconverted saved decisions, unchecked tickets, stale evidence, and missing month-end exports. Added rule generation from calendar state, daily state, sync summary, data quality, tickets, decision outcomes, and month-end export audits.
- [x] Add backend reminder summary API and acknowledgement/snooze endpoints with audit events. Added `/lottery/reminders/summary`, `/lottery/reminders/{key}/ack`, and `/lottery/reminders/{key}/snooze` backed by `LotteryAuditEvent`.
- [x] Add workbench reminder center with grouped daily actions, due state, snooze, acknowledgement, and direct route handoff. Workbench now loads reminder summary, exposes the Reminder Center widget, and supports direct route handoff, snooze, and acknowledgement actions.
- [x] Add settings page controls for reminder thresholds, default snooze duration, and month-end export checklist preferences. Added preference fields for draw-window hours, default snooze minutes, and month-end export checklist enablement.
- [x] Run smoke/build verification, update docs, commit, and push. Verification: focused Maven reminder/preference service/controller tests; `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

### Week 4: Month-End Review, Release Governance, And Mobile Polish

- [x] Add month-end review dashboard that combines ledger results, tickets, decision outcomes, research notes, health score, and export evidence. Added `/lottery/month-end` with month-end score, ledger/ticket/decision/note/health/export metrics, issue review, release checks, and reminders.
- [x] Add month-end report preset that can generate all required CSV/report sections from one saved review scope. Extended the export builder with a `月末治理包` preset covering ledger, tickets, decisions, settlement, budget, import, evidence, sync logs, and probe logs.
- [x] Extend route smoke and release readiness checks for health, notebook, reminders, and month-end review routes. Smoke fixture now covers `/lottery/month-end`, and export release readiness includes month-end dashboard, reminder center, and strategy notebook checks.
- [x] Review responsive layout for workbench, research notebook, reminders, month-end review, export, decision, and ticket pages. Added month-end dashboard responsive layout and folded it into existing mobile breakpoints used by the lottery workflow pages.
- [x] Run month-end verification, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

## Iteration 17: V14 Guided Strategy Execution

Goal: turn the lottery intelligence cockpit into an execution-grade workflow closer to the stock module: strategies should be grouped, simulated, compared, approved, converted into ticket packs, reviewed after draw, and governed from mobile-friendly frontends.

### Week 1: Strategy Portfolio And Allocation Board

- [x] Add a strategy portfolio model that groups prediction rules, experiments, backtests, saved decisions, and notes into named portfolios. Added `LotteryStrategyPortfolio` with weighted evidence links for `RULE`, `EXPERIMENT`, `BACKTEST`, `DECISION`, and `NOTE`.
- [x] Add backend APIs for portfolio list/detail/create/update/archive with health, ROI, warning, replay, and evidence coverage summaries. Added `/lottery/strategy-portfolios` list/detail/create/update/archive and `LotteryStrategyPortfolioSummary`.
- [x] Add `/lottery/strategy-portfolios` frontend board with portfolio cards, sortable score columns, allocation weights, and evidence drilldowns. Added dense portfolio board with health, ROI, coverage, warnings, evidence counts, source links, and create modal.
- [x] Add portfolio links from prediction rules, research comparison, strategy notebook, and decision outcomes. Portfolio evidence links route back to research, experiment, backtest, decision, and notebook surfaces from each evidence row.
- [x] Run focused backend/frontend verification, update docs, commit, and push. Verification: focused Maven portfolio service/controller tests; `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

### Week 2: Simulation Sandbox And What-If Tickets

- [x] Add a simulation request model for hypothetical ticket packs, budget limits, rule weights, replay window, and target issue. Added `LotterySimulationRequest` with target issue, budget, replay, rule-weight, portfolio, and candidate-ticket inputs.
- [x] Add backend simulation API that compares projected cost, historical hit distribution, backtest summaries, decision evidence, and budget exposure without saving tickets. Added `POST /lottery/simulations/run`, budget precheck reuse, latest prediction replay distributions, portfolio evidence summaries, risk warnings, and audit evidence.
- [x] Add `/lottery/simulator` frontend sandbox with sliders for weights/budget, candidate ticket previews, risk warnings, and comparison charts. Added parameter sliders, ticket text parsing, result KPI cards, risk alerting, candidate previews, and distribution bars.
- [x] Add handoff from simulator to decision board, ticket import preview, strategy notebook, and export report builder. Added direct route actions for decision, simulated ticket import preview, notebook evidence capture, and budget-precheck export context.
- [x] Run simulation tests, route smoke/build verification, update docs, commit, and push. Verification: focused Maven simulation service/controller tests; `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

### Week 3: Guided Ticket Pack Execution

- [x] Add a ticket-pack draft model that can be generated from saved decisions, simulator output, or portfolio allocation. Added `LotteryTicketPack` and `LotteryTicketPackItem` with source type/source ID, approval state, budget precheck, saved ticket IDs, warnings, and audit metadata.
- [x] Add backend APIs for ticket-pack preview, budget precheck, approval, save-as-tickets, archive, and audit trail. Added `/lottery/ticket-packs` list/preview/create/approve/save-tickets/archive with decision-set generation, ticket budget precheck reuse, batch-save reuse, and audit events.
- [x] Add `/lottery/ticket-packs` frontend execution page with draft packs, approval checklist, conflict detection, batch save, and issue handoff. Added ticket-pack page with manual/decision source inputs, precheck panel, approval/save/archive actions, warning display, and ticket-page handoff.
- [x] Add workbench and reminder-center actions for pending ticket packs, overdue approval, and post-draw settlement. Added workbench quick action, reminder-center ticket-pack queue action, and navigation entry for pending ticket-pack execution.
- [x] Run ticket-pack service/controller tests, frontend smoke/build, update docs, commit, and push. Verification: focused Maven ticket-pack service/controller tests; `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

### Week 4: Governance Dashboard, Mobile Polish, And Release Evidence

- [x] Add `/lottery/governance` dashboard that combines strategy portfolio health, simulator usage, ticket packs, reminders, month-end review, exports, and release readiness. Added a frontend governance board that aggregates portfolio summaries, simulation audit events, ticket packs, reminders, operations health, workbench release checks, and export evidence.
- [x] Add configurable governance thresholds for portfolio score, simulator risk, ticket-pack budget exposure, evidence freshness, and stale approvals. Added preference fields and settings controls for portfolio score, simulator high-risk count, ticket-pack budget exposure, evidence freshness days, and stale approval hours.
- [x] Extend smoke fixtures and release readiness checks for strategy portfolios, simulator, ticket packs, and governance dashboard. Added `/lottery/governance` to route smoke and added V14 execution/governance release readiness rows on the export page.
- [x] Review responsive/mobile layout for strategy portfolio board, simulator, ticket packs, governance, workbench, and month-end pages. Added responsive governance grid rules and kept strategy portfolio, simulator, ticket-pack, workbench, and month-end mobile grids covered in shared CSS breakpoints.
- [x] Run V14 verification, update docs, commit, and push. Verification: focused Maven preference tests; `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

## Iteration 18: V15 Adaptive Review And Mobile Execution

Goal: turn the V14 execution workflow into a learning loop: every strategy, simulation, ticket pack, and draw result should feed back into calibrated recommendations, mobile-friendly review, and release-ready operational evidence.

### Week 1: Outcome Attribution And Calibration

- [x] Add an attribution model that connects draw outcomes back to strategy portfolios, simulations, decision sets, ticket packs, and saved tickets. Added `LotteryOutcomeAttribution` with portfolio contributions, decision contributions, ticket-pack executions, simulation drift, prize distribution, timeline, ROI, and calibration state.
- [x] Add backend attribution APIs for issue-level outcome attribution, portfolio contribution, simulation-vs-result drift, and ticket-pack execution result summaries. Added `/lottery/outcomes` and `/lottery/outcomes/{issue}` backed by ticket, ticket-pack, decision-outcome, strategy-portfolio, and audit-event sources.
- [x] Add `/lottery/outcomes` frontend page with issue timeline, attribution cards, portfolio contribution table, and drilldowns into tickets, packs, simulations, and decisions. Added route, navigation item, issue list, summary cards, contribution panels, drift rows, distribution, and timeline.
- [x] Add outcome handoffs from ticket settlement, month-end review, governance, and strategy portfolio pages. Added attribution handoff actions from ticket, month-end, governance, and strategy portfolio surfaces.
- [x] Run attribution service/controller tests, route smoke/build verification, update docs, commit, and push. Verification: focused Maven attribution service/controller tests; `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

### Week 2: Recommendation Calibration And Strategy Lifecycle

- [x] Add calibrated recommendation records that summarize whether a rule, portfolio, or simulator setting should be promoted, watched, paused, or retired. Added `LotteryRecommendation` with target metadata, lifecycle status, confidence, evidence age, expected action, reasons, evidence, audit metadata, and archived state.
- [x] Add backend lifecycle APIs for recommendation list/detail, status transitions, evidence refresh, and audit events. Added `/lottery/recommendations`, `/lottery/recommendations/{id}`, `/lottery/recommendations/refresh`, and `/lottery/recommendations/{id}/status` backed by outcome attribution and audit events.
- [x] Add `/lottery/recommendations` frontend lifecycle board with recommendation lanes, confidence, evidence age, expected action, and one-click handoffs. Added promote/watch/pause/retire lanes, refresh, status actions, evidence summaries, and target-path handoff buttons.
- [x] Add lifecycle links into strategy portfolios, research notebook, governance, simulator, and decision board. Added recommendation handoffs from portfolio, notebook, governance, simulator, and prediction decision surfaces.
- [x] Run recommendation service/controller tests, frontend smoke/build, update docs, commit, and push. Verification: focused Maven recommendation service/controller tests; `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

### Week 3: Mobile Command Flow And Batch Review

- [x] Add mobile-oriented summaries for today, next draw, pending approvals, stale evidence, settlement gaps, and release blockers. Added `/lottery/mobile` metric cards backed by workbench, operations health, reminders, ticket packs, outcomes, and recommendations.
- [x] Add backend compact summary API only if existing workbench/governance responses are too heavy for mobile command flow. Reused existing workbench, operations, reminder, ticket-pack, outcome, and recommendation APIs; no extra backend endpoint was needed for this slice.
- [x] Add `/lottery/mobile` frontend command page with compact cards, segmented views, large touch targets, and batch review actions for reminders, packs, and outcomes. Added action, ticket-pack, attribution, and recommendation segments with confirm, snooze, approve, save-as-ticket, apply, and defer actions.
- [x] Add mobile entry points from workbench, alerts, governance, ticket packs, and monthly review while preserving desktop routes. Added `移动指挥` handoffs without changing desktop workflow routes.
- [x] Run mobile route smoke/build verification, responsive layout review, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

### Week 4: Closed-Loop Reports, Evidence Packs, And Release Readiness

- [x] Add closed-loop report presets for outcome attribution, recommendation lifecycle, mobile command flow, and V15 governance evidence. Added `归因闭环包`, `推荐生命周期包`, `移动指挥包`, and `V15治理证据包` presets that reuse supported export sections.
- [x] Extend export/audit surfaces with V15 evidence filters, report sections, and release-readiness rows. Added V15 evidence-pack cards, audit filters for attribution/recommendation events, and release-readiness rows for attribution, recommendation lifecycle, mobile command flow, and governance evidence.
- [x] Extend route smoke coverage for outcomes, recommendations, mobile command flow, and updated release evidence. Smoke fixture now targets V15 Week 4 release evidence and validates the outcome, recommendation, mobile, governance, and export surfaces.
- [x] Review responsive/mobile layout for outcomes, recommendations, mobile command flow, governance, ticket packs, and export pages. Added responsive evidence-pack grid behavior and kept V15 pages in the existing mobile grid breakpoints.
- [x] Run V15 verification, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

## Iteration 19: V16 Frontend Usability

Goal: make the lottery frontend easier to navigate and operate day to day, with fewer scattered choices, clearer current context, better default actions, and more readable states.

### Week 1: Navigation And Information Architecture

- [x] Optimize the grouped lottery menu after the V15 consolidation. Kept the reduced top-level groups and added a persistent current-group child navigation strip for grouped items.
- [x] Make the active workflow group easier to recognize. The footer now shows the active group name, icon, and its child entries with the active child highlighted.
- [x] Improve child-menu switching feedback without relying only on hover. Group children are available as direct buttons above the footer, which works on desktop and mobile.
- [x] Keep common routes reachable from the grouped menu. Smoke coverage still validates protected routes, navigation source entries, and component API bindings.
- [x] Run route smoke/build verification, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

### Week 2: Forms And Operation Ergonomics

- [x] Improve primary actions on ticket, ticket-pack, recommendation, and mobile command pages. Added safer ticket-pack and recommendation action flows on desktop and mobile command surfaces.
- [x] Reduce repeated input with recent values, default issue values, and clearer generated titles. Ticket-pack drafts now load the next issue from the workbench summary and auto-generate the draft title until the user edits it.
- [x] Add safer confirmations and clearer success/failure summaries for destructive and batch actions. Added confirmation prompts for ticket-pack approval/save/archive, mobile ticket-pack save, recommendation apply, and recommendation archive actions, with success messages that include the affected title or saved ticket count.
- [x] Convert technical errors into business-readable guidance where the frontend has enough context. Kept existing business-facing error messages and added non-blocking default-issue loading failure handling for ticket-pack drafting.
- [x] Run frontend smoke/build verification, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

### Week 3: Lists, Filters, And State Readability

- [x] Normalize list/table/card empty, loading, and error states across lottery pages. Kept existing empty/loading/error components and added preset bars without introducing new page-specific state wrappers.
- [x] Add clearer filter presets for tickets, attribution, recommendations, audit events, and review queues. Added ticket presets for pending/checked/missed/ticket-pack, attribution presets for settlement gaps/promote/watch, recommendation presets for open/high-confidence/stale evidence, and audit presets for V15/export/recommendation events.
- [x] Unify status colors and business labels for pending, warning, failed, applied, archived, and settled states. Added preset labels that map technical states to business review queues while preserving existing tag colors.
- [x] Add recent-view, recently-handled, or pending-me views where supported by existing data. Added pending/open and stale evidence views using existing ticket, attribution, recommendation, and audit data.
- [x] Run frontend smoke/build verification, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

### Week 4: Visual Consistency And Release Quality

- [x] Review spacing, buttons, tags, progress indicators, and card density across the lottery module. Polished shared preset bars, recommendation cards, and mobile command cards without changing backend contracts.
- [x] Fix mobile/desktop text overflow, cramped actions, and inconsistent wrapping on high-use pages. Added safer wrapping and horizontal action behavior for recommendation and mobile command card actions.
- [x] Extend smoke fixture coverage for the new usability entry points and release evidence. Smoke fixture now targets V16 frontend usability release evidence and checks navigation, operation, filtering, responsive, and release-readiness copy.
- [x] Update frontend usability documentation and version plan. Version plan now marks the V16 visual consistency and release quality slice as shipped.
- [x] Run V16 verification, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

## Iteration 20: V17 Navigation Density And Daily Focus

Goal: reduce visible menu density after V16 by keeping daily actions in front while preserving advanced routes behind grouped menus.

### Week 1: Single-Row Lottery Navigation

- [x] Identify the second-row child menu introduction point. It was introduced by `1eb0adc8 feat(lottery): improve workflow navigation usability`.
- [x] Restore the footer shape from before that commit. The footer is a single horizontal row with all lottery top-level groups rendered directly.
- [x] Remove the later 更多/home-shortcut hiding flow. Top-level lottery groups are no longer hidden behind secondary flags or shortcut menus.
- [x] Add smoke coverage so future menu changes do not reintroduce the second row, 更多, or hidden top-level groups.
- [x] Update menu documentation and release-readiness copy for the rollback behavior.
- [x] Run frontend smoke/build verification, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

## Iteration 21: V18 Astronaut Voyage Analysis

Goal: make the astronaut feature useful as an analysis surface. The core object is the astronaut voyage record. Red fleet analysis can explain hexagram, red-sum, and odd-even structure; blue fleet analysis should focus on planet rhythm, interval, and recent movement trends because hexagram analysis is not meaningful there. Do not change the footer/navigation shell.

### Week 1: Workbench Priority Actions

- [x] Add a workbench "今日优先事项" panel that aggregates reminders, action queue items, operation health warnings, pending tickets, and release checks.
- [x] Make each priority item actionable with a direct page handoff while reusing existing backend data and routes.
- [x] Keep the feature inside workbench content only; do not adjust the navigation bar or footer styling.
- [x] Add responsive styling for narrow screens so priority status and action labels wrap under the item body.
- [x] Extend route smoke and release evidence for the priority workbench feature.
- [x] Run frontend smoke/build verification, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

### Week 2: Voyage Record Analysis

- [x] Add voyage-level analysis to the astronaut detail page, including total voyages, latest voyage, primary planet, average interval, average red sum, and odd/even structure.
- [x] Add planet distribution, hexagram structure, and recent 12-voyage trend panels based on existing voyage records.
- [x] Keep analysis inside the astronaut voyage page; do not adjust navigation bar or footer styling.
- [x] Extend route smoke coverage to include the astronaut voyage detail route and analysis copy.
- [x] Update release evidence for the astronaut voyage analysis direction.
- [x] Run frontend smoke/build verification, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

### Week 3: Fleet-Specific Analysis Semantics

- [x] Split astronaut voyage analysis by fleet semantics. Red fleet keeps hexagram, red-sum, and odd-even structure analysis.
- [x] Remove hexagram analysis from blue fleet views and replace it with planet rhythm, primary-planet share, latest gap, and interval range.
- [x] Update blue fleet voyage cards so they show blue ball and planet context instead of hexagram tags.
- [x] Extend route smoke and release evidence so blue fleet remains planet-analysis-only.
- [x] Run frontend smoke/build verification, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

### Week 4: Number Probability Pressure Analysis

- [x] Strengthen number probability scoring with explicit omission pressure: current consecutive absence divided by historical average omission.
- [x] Make omission pressure monotonic after the historical average, so a number that remains absent keeps gaining comeback pressure until capped.
- [x] Keep frequency, recent activity, odd/even, size, zone, and group structure in the comprehensive score.
- [x] Show average omission and pressure multiplier in the probability detail UI with explanatory copy.
- [x] Extend route smoke and release evidence for number probability pressure analysis.
- [x] Run frontend smoke/build verification, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

### Week 5: Number Probability Drilldown

- [x] Add score parts to each number probability item so the UI can explain the exact contribution of history frequency, recent activity, omission pressure, and structure factors.
- [x] Expose the normalized probability equation: number score divided by fleet total score times the red or blue probability pool.
- [x] Make red and blue number cells selectable inside the probability panel, with blue drilldown focused on planet rhythm instead of hexagram semantics.
- [x] Extend route smoke and release evidence for number probability drilldown.
- [x] Run frontend smoke/build verification, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

### Week 6: Deep Pattern Analysis Page

- [x] Add `/lottery/deep-analysis` as a dedicated deep pattern analysis page based on the available report direction and existing lottery statistics.
- [x] Combine history frequency, recent drift, omission pressure, odd/even, big/small, zone coverage, hot/cold crossover, and candidate lines into one analysis workflow.
- [x] Keep blue fleet analysis planet-rhythm-only and avoid hexagram semantics in blue number explanations.
- [x] Add a prediction-page action entry without changing the overall navigation or footer style.
- [x] Extend route smoke and release evidence for deep pattern analysis.
- [x] Run frontend smoke/build verification, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

### Week 7: Report-Style Deep Pattern Analysis

- [x] Upgrade the deep pattern page to match the screenshot report structure: data scale, hot/cold numbers, sum ranges, odd/even, big/small, zone distribution, consecutive numbers, repeated numbers, high-frequency pairs, and core advice.
- [x] Use live lottery statistics for all report-style sections, while treating unavailable calendar-year fields as recent-window analysis instead of inventing dates.
- [x] Keep blue fleet explanations focused on planet rhythm, frequency, and omission pressure.
- [x] Extend route smoke and release evidence for report-style deep analysis.
- [x] Run frontend smoke/build verification, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

### Week 8: Manual Period Replay

- [x] Add strict single-period replay: selecting target period N uses only periods before N to generate predictions, then compares against period N.
- [x] Allow early-period replay such as period 2 based on period 1, without applying the batch replay minimum window.
- [x] Keep batch replay summary while adding a manual target-period selector and candidate-level scoring details.
- [x] Mount the replay panel on the prediction page and extend route smoke/release evidence.
- [x] Run frontend smoke/build verification, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

## Iteration 22: Daily Closure And Trust QA

Goal: make the lottery workbench a practical daily closure console, then verify status consistency, mobile layout, and dark-mode quality across high-use lottery pages.

### Wave 22A: Current-Issue Closure Path

- [x] Add a default-visible `本期闭环` workbench widget that orders the current issue workflow from sync through report/archive.
- [x] Reuse existing workbench summary, `dailyState`, release checks, and drill-through routes instead of adding a backend contract.
- [x] Keep each closure step actionable with Chinese labels, status tags, counts, details, and direct page handoff.
- [x] Add responsive styling so the closure path is compact on desktop and becomes a single-column action list on mobile.
- [x] Run frontend build, route smoke, update docs, review diff, commit, and push Wave 22A. Verification: `one-web npm run build`; `one-web npm run lottery:smoke`; `git diff --check`.

### Wave 22B: Trust And Status Consistency QA

- [x] Audit workbench, overview, tickets, ticket packs, recommendations, governance, simulator, mobile command, and exports for English status leakage. Found high-use leakage in ticket source tags, ticket-pack preview source tags, export result type, maintenance mode/cache tags, and audit event labels.
- [x] Normalize remaining high-use status labels through shared helpers where practical. Added shared labels for ticket statuses, audit event types, and source/export codes, then reused `lotteryStatusLabel` and `lotteryCodeLabel` in ticket, ticket-pack, governance/export-adjacent views.
- [x] Compare visible counts across overview statistics, latest draw, pending tickets, prize-check summary, and ledger summary. Wave 22B kept existing count sources unchanged: workbench and the new closure path continue reading `latestDraw`, `pendingTicketCount`, `latestPrizeCheckSummary`, and `ledgerSummary` from the same workbench summary contract.
- [x] Add checklist evidence for any inconsistencies found and fixed. This Wave 22B checklist entry records the visible leakage and source-of-truth review.
- [x] Run frontend build and route smoke verification. Verification: `one-web npm run build`; `one-web npm run lottery:smoke`; `git diff --check`.

### Wave 22C: Mobile And Dark-Mode Release Sweep

- [x] Review workbench, overview, tickets, ticket packs, recommendations, governance, simulator, research, and exports at mobile width and in dark mode. Wave 22C focused on shared high-use CSS for export/maintenance tables, ticket-pack actions, recommendation/mobile action rows, governance hero actions, and report sections.
- [x] Fix text overflow, cramped actions, card heights, and dark-mode contrast issues. Added theme-aware Ant table coloring for export/governance/ticket-pack/simulator pages and safer horizontal action rails at mobile width.
- [x] Prefer mobile card/list layouts over wide tables where the page is used in daily operation. Existing ticket mobile cards remain in place; export/maintenance tables now stay contained with horizontal scroll instead of breaking the card.
- [x] Run frontend build, route smoke verification, update docs, commit, and push. Verification: `one-web npm run build`; `one-web npm run lottery:smoke`; `git diff --check`. Browser QA was limited by the protected login route and local API proxy 500 responses, so screenshot verification only reached the dark login shell.

## Iteration 23: Protected Frontend QA And Release Evidence

Goal: reduce the protected-route QA gap by making static smoke catch release-critical frontend regressions even when local login state or backend proxy availability blocks browser screenshots.

### Wave 23A: Protected Frontend QA Smoke

- [x] Add fixture-driven source checks to the lottery route smoke script.
- [x] Guard the Wave 22 workbench `本期闭环` widget with route smoke source checks.
- [x] Guard shared mobile and dark-mode CSS safeguards with route smoke source checks.
- [x] Guard high-use Chinese status/source label helpers with route smoke source checks.
- [x] Keep the smoke independent from live auth, backend availability, and lottery provider network access.
- [x] Run frontend build, route smoke verification, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm run build`; `git diff --check`.

### Wave 23B: Browser QA Readiness Notes

- [x] Document local prerequisites for protected route screenshots: valid `aurorae_auth`, backend service, and lottery proxy endpoints.
- [x] Record the known blocker signature for backend proxy `ECONNREFUSED` on `/lottery/records/draws?page=0&size=500`.
- [x] Add a concise browser-QA fallback note to the lottery README and quality gate docs.
- [x] Run documentation diff check, update checklist, commit, and push. Verification: `git diff --check`.

## Iteration 24: Release Evidence Packaging

Goal: make lottery release evidence easy to read, commit, and hand off by turning the smoke summary JSON into a concise Markdown report.

### Wave 24A: Markdown Release Evidence

- [x] Add a script that reads `reports/lottery-route-smoke-summary.json`.
- [x] Include target, generated time, status, route count, check count, and failure count.
- [x] Include source guard coverage from the smoke fixture.
- [x] Include checked protected routes with component/API/empty/error state counts.
- [x] Include protected browser QA prerequisites and the known backend/proxy blocker signature.
- [x] Add an npm script that refreshes smoke output and writes the evidence report.
- [x] Run release-evidence/build verification, update docs, commit, and push. Verification: `one-web npm run lottery:release-evidence`; `one-web npm run build`; `git diff --check`.

### Wave 24B: Evidence Surface Handoff

- [x] Link the evidence report from the lottery README and quality gates.
- [x] Add guidance for when to regenerate the report.
- [x] Record any manual screenshot paths or blockers next to the generated report when browser QA is available.
- [x] Run documentation diff check, update checklist, commit, and push. Verification: `git diff --check`.

## Iteration 25: One-Command Frontend Release Check

Goal: make frontend lottery release validation harder to run incompletely by combining evidence generation and production build verification into one command.

### Wave 25A: Release Check Script

- [x] Add an npm script that runs `lottery:release-evidence` and then `build`.
- [x] Update lottery docs to use the one-command release check as the default frontend release gate.
- [x] Keep `lottery:smoke` and `lottery:release-evidence` available for narrower checks.
- [x] Run release-check verification, update docs, commit, and push. Verification: `one-web npm run lottery:release-check`; `git diff --check`.

### Wave 25B: Freshness Guard

- [x] Add a check mode that compares the generated Markdown evidence with the current smoke summary and fixture.
- [x] Fail when the committed Markdown evidence is stale.
- [x] Keep the check deterministic enough for local and CI use.
- [x] Run freshness-guard verification, update docs, commit, and push. Verification: `one-web npm run lottery:release-check`; `one-web npm run lottery:release-evidence:check`; `git diff --check`.

## Iteration 26: Release History And Evidence Archive

Goal: keep frontend lottery release evidence as durable snapshots instead of only the latest mutable report.

### Wave 26A: Evidence Snapshot Archive

- [x] Add archive mode to the release evidence script.
- [x] Add `npm run lottery:release-archive`.
- [x] Write snapshots under `one-web/reports/lottery-release-history/`.
- [x] Maintain a small history index with the latest snapshot, target, generated time, status, check count, and route count.
- [x] Keep the archive command failing when the latest evidence report is stale.
- [x] Run release-archive verification, update docs, commit, and push. Verification: `one-web npm run lottery:release-archive`; `git diff --check`.

### Wave 26B: Release History Consumption

- [x] Link the archive index from lottery documentation.
- [x] Decide whether `/lottery/exports` should surface local release-history metadata or keep it as docs-only. Decision: keep release history docs-only until a backend/export contract is explicitly added for archived local evidence.
- [x] Record browser-QA blocker notes next to archived snapshots when screenshots are unavailable.
- [x] Run documentation diff check, update checklist, commit, and push. Verification: `one-web node scripts/lottery-release-evidence.mjs --archive`; `git diff --check`.

## Iteration 27: Workbench Issue Focus 2.0

Goal: make `/lottery/workbench` answer the current draw-cycle question faster: what issue is active, what needs action next, and which specialist page should handle it.

### Wave 27A: Next-Step Issue Focus

- [x] Show pending tickets, pending prize checks, stale evidence, release blockers, mobile command, and recommendation review as direct handoffs.
- [x] Keep current issue, next issue, prediction target, ticket issue, prize check, and ledger result in the existing issue-focus card grid.
- [x] Reuse existing action queue, daily state, release checks, reminders, and operations health data.
- [x] Add responsive CSS for desktop and mobile.
- [x] Extend route smoke source guards for the new issue-focus panel.
- [x] Run route smoke verification, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `git diff --check`.

### Wave 27B: Workbench Handoff Polish

- [x] Review handoffs to `/lottery/mobile`, `/lottery/governance`, `/lottery/ticket-packs`, `/lottery/recommendations`, and `/lottery/exports`.
- [x] Add source checks or route smoke fixture evidence for any new handoff labels.
- [x] Decide whether the next-step strip should participate in widget settings as a separate widget or stay inside `期号焦点`. Decision: keep it inside `期号焦点` so widget settings stay stable.
- [x] Run route smoke verification, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm exec eslint -- src/components/LotteryWorkbenchPage.tsx`; `git diff --check`.

## Iteration 28: Strategy Outcome Attribution 2.0

Goal: make `/lottery/outcomes` explain the closed loop from strategy evidence to recommendation, ticket/action, and actual issue outcome.

### Wave 28A: Attribution Handoff Map

- [x] Add attribution handoffs for portfolio, ticket pack, simulator, saved decision, and recommendation follow-up.
- [x] Add source/rule/recommendation trend rows with evidence quality labels.
- [x] Keep Wave 28A derived from the existing outcome attribution DTO.
- [x] Localize exposed status/code labels in outcome attribution rows.
- [x] Add dark-mode and mobile responsive CSS for the new attribution surfaces.
- [x] Extend route smoke source guards for the new labels and helpers.
- [x] Run route smoke verification, update docs, commit, and push. Verification: `one-web npm run lottery:smoke`; `one-web npm exec eslint -- src/components/LotteryOutcomeAttributionPage.tsx`; `git diff --check`.

### Wave 28B: Aggregated Attribution Rollups

- [x] Add backend rollups by issue, portfolio, rule, source, recommendation lifecycle, simulator risk, and ticket-pack execution state. Added `GET /lottery/outcomes/rollup`.
- [x] Add bounded frontend rollup filters for latest issue, recent 10 issues, month-to-date, and all tracked outcomes. `/lottery/outcomes` now loads rollup summaries with latest, recent10, month-to-date, and all window buttons.
- [x] Add tests for rollup aggregation and empty-state semantics. Covered service aggregation and controller delegation for the rollup endpoint.

### Wave 28C: Review And Export Connections

- [x] Connect attribution quality summaries into governance and month-end review. Governance now includes a `归因质量` domain, and month-end review shows `归因闭环` plus attribution quality rows.
- [x] Add attribution closure preset metadata to exports. Added the `归因质量包` preset and export evidence card.
- [x] Record stale or missing attribution links in release evidence warnings. Export release readiness now includes `V28归因质量`, and route smoke checks the governance/month-end/export rollup handoffs.

## Iteration 29: Recommendation Lifecycle Analytics

Goal: make `/lottery/recommendations` show lifecycle health, action follow-through, and conservative stale-evidence cleanup.

### Wave 29A: Lifecycle Analytics Panel

- [x] Add active, watch, paused, and retired lifecycle counts. `/lottery/recommendations` now shows a lifecycle analytics panel derived from the current recommendation list.
- [x] Add result-after-action summaries for promoted, retired, applied, or archived recommendations. Added action-review rows that hand off to the recommendation target or outcomes.
- [x] Add stale recommendation cleanup flows with conservative copy. Added a confirmed archive action for currently visible open recommendations with evidence older than 24 hours.
- [x] Keep the first slice frontend-derived from the existing recommendation API. Reused `lotteryRecommendationApi.recommendations` and `updateStatus` without expanding the backend contract.
- [x] Extend route smoke coverage for lifecycle analytics. Smoke fixture now checks lifecycle analytics labels, cleanup code paths, and action-review empty state.

### Wave 29B: Transition History

- [x] Add backend transition rollups grouped by lifecycle status, recommendation state, target type, and day. Added `GET /lottery/recommendations/rollup` with recommendation state, lifecycle status, target type, and audit-backed transition rows.
- [x] Expose transition counts in `/lottery/recommendations` without overloading the list endpoint. The recommendation page now loads the `recent30` rollup and shows recent status transitions in the lifecycle panel.
- [x] Add service and controller tests for bounded rollup windows. Added focused service and web tests for lifecycle counts and `/rollup` routing.
- [x] Extend route smoke coverage for rollup wiring. Smoke fixture now checks the rollup API method, frontend contract types, and transition empty state.

### Wave 29C: Outcome Follow-Through

- [x] Connect promoted and retired recommendation rows to attribution outcomes and export evidence. Added the V29 `推荐跟进包`, export evidence card, and release-readiness row.
- [x] Add governance/month-end review rows for stale recommendation cleanup and applied recommendation follow-through. Governance now includes `推荐跟进`, and month-end review includes a recommendation lifecycle follow-through card.
- [x] Review mobile and dark-mode behavior after backend rollups land. Reused the existing governance/month-end/export responsive grids and added smoke guards for the new labels.
- [x] Extend route smoke coverage for connected evidence. Smoke fixture now checks governance, month-end, and export recommendation follow-through wiring.

## Iteration 30: Research Archive And Month-End Intelligence

Goal: make the lottery module easier to use as a long-running research archive, with month-end review as the compact historical evidence entry point.

### Wave 30A: Searchable Research Archive Index

- [x] Add searchable archive views across issues, months, strategies, outcomes, and release evidence. `/lottery/month-end` now has a `研究归档索引` that combines issue ledgers, month summary, attribution rows, recommendation transitions, strategy notes, and export evidence.
- [x] Keep the first slice frontend-derived from existing APIs. Reused month-end page data instead of adding a new backend archive contract.
- [x] Add route smoke coverage for archive labels and search state. Smoke fixture now checks archive index labels, `archiveItems`, `archiveQuery`, and the empty state.

### Wave 30B: Month-End Narrative Summary

- [x] Add a narrative section backed by ledger, tickets, attribution, recommendations, notes, reminders, and exports. `/lottery/month-end` now shows `月末叙事摘要` with result, action closure, evidence quality, and next-month focus rows.
- [x] Keep copy evidence-oriented and avoid prediction-confidence language. The summary reports evidence, warnings, pending work, and exports without promising future outcomes.
- [x] Add route smoke checks for narrative source labels. Smoke fixture now checks `narrativeItems` and the four narrative headings.

### Wave 30C: Long-Term Retrospective Exports

- [x] Add export presets for long-term research retrospectives. Added `长期研究包` and `年度复盘包`.
- [x] Connect archive and narrative views to export evidence. Month-end review now links to `/lottery/exports?preset=long-term-research`, and export evidence packs include `长期研究证据`.
- [x] Review mobile/dark-mode behavior for archive-heavy states. Reused existing evidence-pack and report-preset responsive grids, with smoke guards for the new export labels.

## Iteration 31: Anomaly Watch And Evidence Drift

Goal: make governance review catch operational drift earlier using existing health, attribution, recommendation, ticket-pack, simulator, and release evidence.

### Wave 31A: Governance Anomaly Watch

- [x] Add a governance anomaly watch surface. `/lottery/governance` now shows `异常观察` with rows for operations health, simulator risk, ticket-pack exposure, attribution drift, stale recommendations, and release-readiness blockers.
- [x] Keep the first slice frontend-derived from existing APIs. Reused the governance page's existing operations, attribution, recommendation, ticket-pack, audit, and workbench calls without adding a backend contract.
- [x] Route each anomaly to its specialist resolution page. Rows navigate to workbench, simulator, ticket packs, outcomes, recommendations, or exports based on the source.
- [x] Add route smoke coverage for anomaly labels and empty state. Smoke fixture now checks `anomalyItems`, `异常观察`, and `暂无异常观察`.

### Wave 31B: Drift Trend Evidence

- [x] Add compact trend context for repeated anomaly types across recent audit and rollup data. Governance anomaly rows now include trend text, and the page shows `漂移趋势` for audit repeats, recommendation transitions, attribution quality, and operations refresh.
- [x] Prefer existing audit/export/recommendation/attribution sources before adding new persistence. Trend rows are derived from loaded audit events, recommendation rollup, attribution rollup, and operations health.
- [x] Keep trend copy descriptive, not predictive. Trend labels report counts, recency, and warning totals without outcome promises.

### Wave 31C: Review Handoffs

- [x] Connect recurring anomaly categories to workbench and month-end review handoffs. Workbench now exposes `异常复盘` when health, release, or evidence warnings exist, and month-end review includes `异常复核闭环`.
- [x] Add export evidence labels for anomaly review when a durable report preset is justified. Export maintenance now offers `异常复盘包` and `异常观察证据`.
- [x] Review mobile and dark-mode behavior after anomaly surfaces expand. Reused existing workbench, month-end list, and evidence-pack responsive/dark-mode styles with smoke guards for the new labels.

## Iteration 32: Provider Reliability Trends

Goal: make provider freshness, sync outcomes, probe diagnostics, and recovery signals easier to review without relying on live provider access during frontend QA.

### Wave 32A: Sync Page Reliability Trend

- [x] Add a provider reliability trend section to `/lottery/sync`. The sync page now shows `Provider 可靠性趋势`.
- [x] Derive reliability rows from existing sync summary, paged sync logs, and paged provider probe logs. Rows cover sync stability, recovery interval, probe success rate, failure category, and network-block signals.
- [x] Add route smoke coverage for sync reliability labels. Smoke now includes `/lottery/sync` and checks the new reliability trend strings.

### Wave 32B: Governance Reliability Handoff

- [x] Add provider reliability trend rows to governance anomaly review. Governance now shows `Provider可靠性复核` in anomaly watch and `同步可靠性` in drift trends.
- [x] Keep failure-category copy descriptive and route users back to `/lottery/sync`. Governance maps provider failure categories to Chinese diagnostic labels and links the row to sync operations.
- [x] Avoid adding new backend contracts unless existing summaries cannot express recovery state. The handoff reuses `workbench.latestSyncSummary`.

### Wave 32C: Reliability Evidence Export

- [x] Add provider reliability evidence labels to export maintenance. Export maintenance now offers `Provider可靠性包` and `Provider可靠性证据`.
- [x] Connect sync/probe log report presets to governance and release-readiness checks. Added `V32Provider可靠性` release evidence that points to the sync/probe log preset.
- [x] Keep smoke independent from live provider networking. Route smoke checks the new export labels without live provider access.

## Iteration 33: Review Automation Runbook

Goal: make daily, draw-cycle, month-end, and release review steps explicit and repeatable without starting hidden background work.

### Wave 33A: Workbench Review Runbook Cards

- [x] Add explicit review runbook cards to `/lottery/workbench`. The runbook widget now shows `日常复核`, `开奖周期`, `月末复盘`, and `发布归档`.
- [x] Keep each card evidence-backed and route to the page where the user can complete the review. Cards show closure, pending work, reminders, sync, ticket, export, release, and provider evidence.
- [x] Preserve the existing scheduled-sync runbook as a status note. `定时同步 Runbook` remains visible under the review cards.
- [x] Add smoke coverage for runbook labels and disabled/manual states. Smoke now guards the review runbook item names and implementation key.

### Wave 33B: Manual Acknowledgement Trail

- [x] Add lightweight acknowledgement states for runbook steps where existing reminder or health acknowledgement APIs can be reused. Runbook cards now expose explicit confirmation buttons for reminder and health contributors.
- [x] Keep acknowledgement explicit and user-triggered. Confirmation buttons stop card navigation and call only the selected reminder or health acknowledgement API.
- [x] Avoid starting prediction, sync, or export work in the background. The runbook acknowledgement flow does not call sync, prediction, ticket, prize-check, or export actions.

### Wave 33C: Runbook Evidence Export

- [x] Add runbook evidence labels to export maintenance. Export maintenance now offers `复核Runbook包` and `复核Runbook证据`.
- [x] Connect review runbook steps to release readiness and month-end review. Added `V33复核Runbook` release evidence that points to the runbook evidence preset.
- [x] Keep static smoke independent from live backend or provider availability. Smoke guards the runbook export labels without live backend or provider calls.

## Iteration 34: Research Archive Search 2.0

Goal: make month-end review a faster long-term research entry point by improving the archive index before adding any new backend contract.

### Wave 34A: Month-End Archive Filters

- [x] Add range and status filters to the `研究归档索引` card.
- [x] Keep the first slice frontend-derived from loaded month-end evidence.
- [x] Preserve keyword search across scope, status, title, and detail text.
- [x] Extend route smoke checks so archive filters stay visible in release evidence.

### Wave 34B: Archive Deep Links

- [x] Add stronger handoffs from archive rows to issue ledger, recommendation, outcome, strategy-note, and export views.
- [x] Keep query parameters aligned with each specialist page's existing filters.
- [x] Add smoke checks for the linked destinations.

### Wave 34C: Archive Evidence Export

- [x] Add export evidence labels for archive searches that need to be reviewed outside the page.
- [x] Record the active range/status/search context in export-ready metadata where existing export presets allow it.
- [x] Keep the export path explicit and user-triggered.

## Iteration 35: Archive Review Queue

Goal: turn month-end archive search results into explicit next actions without starting hidden background jobs or adding a backend queue contract.

### Wave 35A: Month-End Archive Review Queue

- [x] Derive a compact review queue from the current archive search and filters.
- [x] Prioritize failed, warning, manual, pending, and snoozed archive records before pass states.
- [x] Route each queue row back to the specialist page that owns the evidence.
- [x] Keep the queue frontend-derived from existing month-end data.

### Wave 35B: Workbench Handoff

- [x] Surface archive-review pressure on the workbench when month-end evidence contains pending review items.
- [x] Keep handoffs explicit and user-triggered.
- [x] Add smoke checks for the workbench entry.

### Wave 35C: Governance Connection

- [x] Connect recurring archive-review pressure into governance anomaly context.
- [x] Reuse existing governance, month-end, and export evidence paths before adding any persistence.
- [x] Add export evidence labels only if the review queue needs durable report packaging. Decision: reuse the existing V34 archive search export preset; no new preset needed.

## Iteration 36: Archive Review Notes

Goal: make archive review conclusions easy to preserve as research evidence while keeping all write actions explicit and user-triggered.

### Wave 36A: Month-End Review Note Handoff

- [x] Add a `记录复核` handoff from the month-end archive review queue.
- [x] Carry the active archive scope, status, query, queue count, and export evidence path into the research notebook.
- [x] Reuse the existing strategy-note evidence query parameters instead of adding a new backend contract.

### Wave 36B: Workbench Note Handoff

- [x] Add a workbench shortcut from archive-review pressure to the same notebook evidence flow.
- [x] Keep the primary workbench action pointed at the review queue.
- [x] Add smoke checks for the note handoff.

### Wave 36C: Governance Note Handoff

- [x] Add governance context for preserving archive-review decisions.
- [x] Reuse the V34 archive search evidence export and strategy notebook before adding new persistence.
- [x] Decide whether a dedicated review-note export label is justified. Decision: no new export label; V34 archive search evidence remains the package.

## Iteration 37: Archive Review Notebook Visibility

Goal: make archive review evidence obvious after users enter the research notebook from month-end, workbench, or governance handoffs.

### Wave 37A: Pending Archive Evidence Panel

- [x] Promote `ARCHIVE_REVIEW` pending evidence from a one-line alert into a compact context panel.
- [x] Show the originating surface and evidence key/title before the user creates or attaches a note.
- [x] Keep note creation and evidence attachment explicit and user-triggered.

### Wave 37B: Archive Evidence Filtering

- [x] Add a quick way to focus notes that already contain archive-review evidence.
- [x] Preserve the existing status filter and create flow.
- [x] Add smoke checks for the filter affordance.

### Wave 37C: Review Note Surfacing

- [x] Surface recent archive-review notes back on month-end review or governance when useful.
- [x] Prefer frontend-derived summaries from existing strategy notes before adding backend contracts.
- [x] Decide whether archived review notes need export evidence. Decision: keep notes surfaced through notebook filtering and existing archive evidence packages.

## Iteration 38: Archive Review Note Quality

Goal: make archive-review notes easier to assess for completeness, status, and evidence coverage.

### Wave 38A: Notebook Quality Summary

- [x] Add a compact summary for archive-review note count, active notes, validated notes, and attached archive evidence.
- [x] Keep the summary frontend-derived from currently loaded strategy notes.
- [x] Add smoke coverage for the summary labels.

### Wave 38B: Month-End Note Quality

- [x] Surface the same archive-review note quality signal on month-end review.
- [x] Keep month-end summaries linked to the notebook archive-review filter.
- [x] Avoid adding backend aggregation unless local data is insufficient.

### Wave 38C: Governance Note Quality

- [x] Add archive-review note quality to governance drift or anomaly context.
- [x] Reuse the notebook and month-end evidence paths.
- [x] Decide whether quality gaps need a release-readiness guard. Decision: keep as governance drift signal; no release-readiness guard yet.

## Iteration 39: Archive Review Evidence Closure

Goal: turn archive-review note quality into visible release and review evidence without making it a blocking gate before the signal has enough history.

### Wave 39A: Release Evidence Visibility

- [x] Add a non-blocking release-readiness evidence item for archive-review note quality.
- [x] Link the item to the strategy notebook archive-review filter.
- [x] Keep the release status passing while the signal remains informational.

### Wave 39B: Workbench Quality Follow-Up

- [x] Surface archive-review note quality as a daily follow-up when notes are still active or missing evidence.
- [x] Reuse the existing workbench archive-review handoff.
- [x] Keep the copy action-oriented and compact.

### Wave 39C: Review Closure Summary

- [x] Add a compact closure summary that connects notebook, month-end, governance, and release evidence paths.
- [x] Decide whether repeated quality gaps should become a future release-readiness guard. Decision: keep observing as a non-blocking signal; revisit after repeated quality gaps appear in review history.

## Iteration 40: Five-Iteration Planning Review

Goal: make the 35-39 archive-review work visible as a planning checkpoint, then promote the next practical review improvements without changing backend contracts first.

### Wave 40A: Month-End Planning Checkpoint

- [x] Add a month-end planning checkpoint that explains the 35-39 review window.
- [x] Link the checkpoint to long-term exports, archive-review notes, governance trends, and the workbench.
- [x] Keep the checkpoint informational and user-triggered.

### Wave 40B: Next-Phase Candidate Surfacing

- [x] Surface the next recommended review themes from the long-term plan.
- [x] Keep candidate themes tied to existing pages before adding new routes.
- [x] Add smoke coverage for candidate labels.

### Wave 40C: Release Evidence Handoff

- [x] Add a release-evidence handoff for the five-iteration planning review.
- [x] Decide whether planning checkpoints need archived report snapshots or can remain month-end evidence. Decision: keep as month-end evidence for now; add archived snapshots only if planning checkpoints become release artifacts.

## Iteration 41: Evidence Quality Trend Focus

Goal: turn the next-phase evidence-quality candidate into a focused review path that reuses existing attribution rollups before adding backend contracts.

### Wave 41A: Attribution Quality Focus

- [x] Link the month-end evidence-quality candidate to a focused attribution view.
- [x] Summarize stable, watch, under-tested, and negative evidence-quality rows from the current rollup.
- [x] Keep the first slice frontend-derived from existing outcome attribution rollups.

### Wave 41B: Workbench Evidence Quality Handoff

- [x] Surface the same focused attribution path from workbench when evidence quality needs review.
- [x] Keep the action compact and tied to existing workbench warning signals.
- [x] Add smoke coverage for the handoff label.

### Wave 41C: Governance Evidence Quality Release Link

- [x] Connect the focused evidence-quality path to governance or release evidence when useful.
- [x] Decide whether a dedicated quality-trend export label is needed. Decision: no dedicated export label yet; reuse attribution and long-term research evidence.

## Iteration 42: Provider Reliability Focus

Goal: turn the next-phase Provider reliability candidate into a focused review path that reuses existing sync summaries, sync logs, and probe logs.

### Wave 42A: Sync Reliability Focus

- [x] Link the month-end Provider reliability candidate to a focused sync operations view.
- [x] Summarize sync stability, recovery interval, probe success, failure category, and network-block signals.
- [x] Keep the first slice frontend-derived from existing sync and probe evidence.

### Wave 42B: Workbench Provider Reliability Handoff

- [x] Surface the focused Provider reliability path from workbench when sync or health evidence needs review.
- [x] Keep the action compact and tied to existing operations health signals.
- [x] Add smoke coverage for the handoff label.

### Wave 42C: Governance Provider Reliability Release Link

- [x] Connect the focused Provider reliability path to governance or release evidence when useful.
- [x] Decide whether the existing Provider reliability package is enough or needs a more specific review label. Decision: existing Provider reliability package is enough; keep V32 release evidence and point it at the focused sync view.

## Iteration 43: Release Evidence Archive Focus

Goal: turn the next-phase release-evidence archive candidate into a focused handoff that keeps local release history docs-only while making the runbook visible in the app.

### Wave 43A: Export Archive Focus

- [x] Link the month-end release-evidence archive candidate to a focused export maintenance view.
- [x] Show the release evidence report, history index, and archive command without adding backend contracts.
- [x] Keep release history docs-only until archived evidence needs an API-backed surface.

### Wave 43B: Workbench Release Archive Handoff

- [x] Surface the focused release archive path from workbench release review.
- [x] Keep the action tied to existing release check signals.
- [x] Add smoke coverage for the handoff label.

### Wave 43C: Governance Release Archive Link

- [x] Connect the focused release archive path to governance release evidence.
- [x] Decide whether release archive history should remain docs-only or become an export page data source. Decision: keep release history docs-only until a backend/export contract is explicitly needed.

## Iteration 44: Recommendation Retirement Review

Goal: turn stale recommendation cleanup into a focused review path that reuses existing recommendation lifecycle, attribution, governance, and export evidence.

### Wave 44A: Recommendation Retirement Focus

- [x] Add a focused recommendation view for stale evidence, retirement candidates, watch/pause candidates, and applied records.
- [x] Keep the first slice frontend-derived from existing recommendation rollups and visible recommendation rows.
- [x] Preserve explicit user-triggered cleanup; do not archive recommendations in the background.

### Wave 44B: Workbench And Month-End Handoff

- [x] Surface the focused retirement path from month-end planning candidates.
- [x] Route workbench recommendation review into the same focused path.
- [x] Keep stale cleanup and evidence export actions explicit.

### Wave 44C: Governance And Release Evidence

- [x] Connect governance recommendation warnings and transition rows to the focused retirement path.
- [x] Decide whether a dedicated export label is needed. Decision: existing recommendation follow-through package is enough; keep V29 release evidence and add V44 release visibility pointing at the focused recommendation view.

## Iteration 45: Archive Review Pressure Focus

Goal: turn archive-review pressure into a focused handoff that reuses month-end archive queues, strategy notes, governance pressure, and export evidence without adding a backend contract.

### Wave 45A: Month-End Archive Review Candidate

- [x] Add archive-review pressure to the month-end next-phase candidates.
- [x] Route the candidate to the existing ARCHIVE_REVIEW strategy-note handoff.
- [x] Keep the first slice frontend-derived from the current archive queue and note summary.

### Wave 45B: Workbench Archive Review Priority

- [x] Make archive-review pressure easier to spot in workbench next actions.
- [x] Keep the action tied to existing archive pressure and note-quality signals.
- [x] Add smoke coverage for the workbench handoff label.

### Wave 45C: Release Evidence Archive Review Link

- [x] Connect archive-review pressure to release evidence when useful.
- [x] Decide whether the existing archive-search evidence package is enough or needs a focused release row. Decision: existing archive-search evidence package is enough; add V45 release visibility pointing at `v34-archive-search`.

## Documentation And Delivery

- [x] Update `docs/lottery/modules/technical-design.md` after key architecture changes. Updated with ticket, ledger, provider, preference, data quality, probe-log, sync-summary, and ticket-automation contracts.
- [x] Update `docs/lottery/menu-and-version-plan.md` when menu scope changes. Updated route and API boundary plan for ticket, ledger, sync, settings, and quality pages.
- [x] Keep `docs/lottery/iterations/checklist.md` current after each milestone. Checklist reflects Iterations 01-06 completion.
- [x] Run backend tests for changed services/controllers. Ran focused Maven tests for changed backend services/controllers after each backend milestone.
- [x] Run frontend lint/build after changed pages or API types. Ran `npm run build` after frontend route/API/page changes.
- [x] Review `git status --short` and diff before committing. Reviewed status/diff before each pushed milestone.

## Iteration 46: Sync Operations And Release Baseline Closure

Goal: close the current sync-operations, backend-safety, database-pagination, navigation-semantics, documentation, and release-evidence work before promoting another lottery feature surface.

### Wave 46A: Sync Operations UI Closure

- [x] Finish the `/lottery/sync` record-card layout, status filter, loading/empty/error states, delete confirmation, pagination, and responsive presentation.
- [x] Keep UI page numbers one-based and backend page requests zero-based, including valid-page recovery after deleting the last row on a page.
- [x] Decide and document whether retry and scheduled-trigger actions remain backend-only or return as visible operations; keep manual sync explicit. Decision: keep retry and scheduled triggers backend-compatible but expose only manual sync in this UI.
- [x] Preserve provider reliability and data-quality handoffs from the sync operations context.

### Wave 46B: Backend Safety And Database Pagination

- [x] Reject deletion of `RUNNING` sync logs in the backend service, preserve not-found handling, and prove completed-log deletion does not affect draw records. API results are `409`, `404`, and successful log-only deletion respectively.
- [x] Move sync-log status/time filtering, deterministic newest-first ordering, paging, and total counting from in-memory `findAll()` processing to MongoDB repository queries.
- [x] Move provider-probe-log provider/status/time filtering, deterministic newest-first ordering, paging, and total counting from in-memory `findAll()` processing to MongoDB repository queries.
- [x] Add focused repository/service/controller tests for deletion rules, filters, page bounds, zero-based request semantics, ordering, and total counts. Final focused result: 38 tests passed.

### Wave 46C: Navigation Semantics Closure

- [x] Make `/lottery` the default lottery entry and keep it as the unified overview.
- [x] Keep `/lottery/workbench` as the operation center while reaching workbench, mobile, and settings from overview or related operational entry points instead of footer-level top items.
- [x] Preserve direct routes and align module entry paths, canonical-path helpers, active-group resolution, visible labels, and smoke fixtures with the same navigation contract. Workbench, mobile, and settings resolve to the overview footer group.

### Wave 46D: Documentation And Release Baseline

- [x] Align `iteration-46-plan.md`, the lottery README, long-term plan, menu/version plan, technical design, and this checklist with the implemented contracts.
- [x] Run focused backend tests for changed sync-log/provider repositories, services, and controllers. Repository 3, service 16, and controller 19 tests passed.
- [x] Run `npm run i18n:audit`, `npm run lottery:smoke`, file-scoped ESLint, `npm run build`, and `npm run lottery:release-check` from `one-web`. Final smoke result: 808 checks across 18 routes; production build passed.
- [x] Browser-check `/lottery` and `/lottery/sync` in Chinese and English, desktop and 390px narrow layouts, and light and dark themes. Verified real local data, status filtering, delete confirmation followed by cancellation, and preserved-route footer ownership without deleting data.
- [x] Review `git status --short`, generated evidence, staged scope, and `git diff --check`; keep unrelated local changes outside the Iteration 46 delivery scope unless explicitly included.
