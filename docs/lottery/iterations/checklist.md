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
- [ ] Add durable training report model.
- [ ] Add prediction rule model or persist rule versions explicitly.
- [x] Add prediction history endpoint. Added `GET /lottery/predictions`.
- [x] Add prediction detail endpoint. Added `GET /lottery/predictions/{id}`.
- [x] Add training start endpoint under `/lottery/predictions/train` or document continued `/lottery/training/start` use. Added `POST /lottery/predictions/train` delegating to the existing async training service.
- [ ] Add actual-result attachment endpoint.
- [ ] Add replay metrics by historical window.
- [ ] Add rule comparison endpoint.
- [ ] Add cancel/retry/status behavior for training.
- [ ] Add prediction history page.
- [ ] Add prediction detail page with candidates, score, rule, and actual result.
- [ ] Add tests for prediction scoring, actual attachment, and report persistence.

## Iteration 04: Personal Tickets And Prize Checking

- [ ] Add `LotteryTicket` model.
- [ ] Add `LotteryPrizeResult` model.
- [ ] Add ticket repository and service.
- [ ] Add `GET /lottery/tickets`.
- [ ] Add `POST /lottery/tickets`.
- [ ] Add `PUT /lottery/tickets/{id}`.
- [ ] Add `DELETE /lottery/tickets/{id}`.
- [ ] Add `POST /lottery/tickets/check-prizes`.
- [ ] Add `GET /lottery/tickets/summary`.
- [ ] Add prize grade calculation utility.
- [ ] Add ticket list page.
- [ ] Add ticket create/edit modal.
- [ ] Add action to save prediction candidates as tickets.
- [ ] Add filters by issue, status, source, and prize grade.
- [ ] Add tests for prize grade calculation.

## Iteration 05: Outcome Analysis And Ledger

- [ ] Add ledger summary DTO.
- [ ] Add issue-level ledger endpoint.
- [ ] Add monthly ledger endpoint.
- [ ] Add rule/source performance endpoint.
- [ ] Add total cost, total prize, net result, ROI, and hit-rate cards.
- [ ] Add issue ledger table.
- [ ] Add monthly trend chart.
- [ ] Add source/rule performance chart.
- [ ] Link overview and prediction pages to ticket and ledger pages.
- [ ] Add tests for summary math and filtering.

## Iteration 06: Provider, Settings, And Operations

- [ ] Add lottery provider health DTO.
- [ ] Add provider config snapshot DTO.
- [ ] Add provider probe result DTO.
- [ ] Add `GET /lottery/providers/health`.
- [ ] Add `GET /lottery/providers/config`.
- [ ] Add `GET /lottery/providers/probe`.
- [ ] Add `LotteryPreference` model.
- [ ] Add `GET /lottery/preferences`.
- [ ] Add `PUT /lottery/preferences`.
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
