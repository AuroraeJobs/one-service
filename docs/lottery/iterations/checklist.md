# Lottery Module Checklist

Last updated: 2026-07-03

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
- [ ] Add sync operations page with logs, retry, and scheduled trigger.
- [ ] Add settings page for preferences and training defaults.
- [ ] Add data quality check endpoint.
- [ ] Add data quality UI for missing issues, duplicates, malformed numbers, and future dates.

## Documentation And Delivery

- [ ] Update `docs/lottery/modules/technical-design.md` after key architecture changes.
- [ ] Update `docs/lottery/menu-and-version-plan.md` when menu scope changes.
- [ ] Keep `docs/lottery/iterations/checklist.md` current after each milestone.
- [ ] Run backend tests for changed services/controllers.
- [ ] Run frontend lint/build after changed pages or API types.
- [ ] Review `git status --short` and diff before committing.
