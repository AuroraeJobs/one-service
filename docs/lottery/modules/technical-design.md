# Lottery Technical Design

Last updated: 2026-07-03

## Module Shape

The lottery module currently spans three backend concerns and several frontend views:

- Historical draw records: `record/*`
- Prediction and training: `lottery/training/*`
- Astronaut naming and voyage statistics: `lottery/astronauts/*`
- Frontend lottery cockpit: overview, prediction, records, statistics, analysis, pixel, Taiji, space, hexagram, and seasonal pages.

Future iterations should gradually move new lottery-domain APIs under `lottery/*` while preserving existing `record/*` compatibility until frontend callers are migrated.

## Current Duplication Audit

The first baseline audit found these duplicated or parallel implementations:

- `one-web/src/utils/lotteryStats.ts` parses 14-digit compact records, derives red/blue numbers, red sum, odd/even, big/small, consecutive pairs, planet, hexagram, frequency, omissions, predictions, replay scores, and prize labels.
- `LotteryTrainingService` parses compact records from `RecordFile`, builds its own `Draw` objects, recalculates red sum, odd/even, big/small, frequency, omissions, prediction scores, and prize labels.
- `LotteryBallUtil` owns backend planet and hexagram mappings, while the frontend owns matching `planetByOddCount` and `HEXAGRAMS` data.
- `LotteryAstronautService` has a local `splitBalls` parser for comma-separated or compact records and reads derived planet/hexagram/sum fields from color-ball records.

Near-term rule: do not rewrite all of this at once. New APIs should establish normalized contracts first, then migrate heavy parsing/statistics into shared backend services or clearly documented frontend helpers.

## Desired Backend Layers

```text
Controller
  -> Service interface
    -> Domain service
      -> Repository for durable data
      -> Provider interface for external draw data
      -> Redis for cache, locks, status, and derived snapshots
```

Provider-specific fetch and parse logic should not leak into controllers, frontend code, or shared DTOs.

The first provider boundary is `LotteryDrawProvider`, with `CwlLotteryDrawProvider` wrapping the existing China Welfare Lottery fetch path. `RecordUpdater` depends on the provider interface rather than `RecordCalendar` or `RecordClient` directly.

## Data Ownership

MongoDB should own durable domain data:

- Draw records.
- Sync logs. Current implementation starts with `LotteryRecordSyncLog` in `lottery_record_sync_logs` for manual record sync operations.
- Prediction rules and prediction snapshots.
- Training reports when they need history.
- Personal tickets.
- Prize checking results.
- Lottery preferences.
- Astronaut names.

Redis should own volatile or derived state:

- Training status.
- Latest prediction cache.
- Last report cache before durable history exists.
- Statistics summaries.
- Sync locks. Manual record sync currently uses `lottery:records:sync:lock` with a bounded TTL.
- Provider health/probe results.
- Voyage count summaries.

## Canonical Draw Contract

New APIs should converge on a normalized draw contract:

```text
id
issue
drawDate
redNumbers
blueNumber
redSum
oddCount
evenCount
span
source
sourceUpdatedAt
createdAt
updatedAt
```

Rules:

- Red numbers are six two-digit strings sorted ascending.
- Blue number is one two-digit string.
- Issue identity is unique.
- Derived fields can be recalculated, but API responses should be stable.
- `LotteryDraw` is the first canonical DTO for this contract, with `LotteryDrawUtil` converting legacy `Record` objects or 14-digit compact records into normalized draws.
- `/lottery/records/draws/latest`, `/lottery/records/draws/first`, and `/lottery/records/draws` expose this DTO while legacy `/lottery/records/*` responses remain compatible with existing `Record` callers.

## Prediction Contract

Prediction snapshots should be auditable:

```text
id
targetIssue
basedOnIssue
ruleId
ruleName
ruleVersion
redNumbers
blueNumber
candidates
score
reason
actualRecord
createdAt
updatedAt
```

`LotteryPredictionSnapshot` is the first durable prediction history model. Training still writes the latest prediction to Redis for compatibility, and now also saves a Mongo snapshot in `lottery_prediction_snapshots`. New prediction operations live under `/lottery/predictions`: history, detail, actual-result attachment, and async training start. `POST /lottery/predictions/{id}/actual` normalizes the actual draw, scores the primary prediction and each candidate, and updates the snapshot. The legacy `/lottery/training/*` endpoints remain compatible while frontend pages migrate.

Training reports should include:

- Replay window.
- Candidate rules.
- Best rule.
- Timeline.
- Metrics.
- Generation/version.
- Failure message when applicable.

`LotteryTrainingReportRecord` stores completed training reports in Mongo at `lottery_training_reports`. The existing Redis `lottery:training:last` cache remains a fast compatibility path, while durable records preserve replay count, generation, best result, learned rule, latest prediction, candidates, timeline, and actual-result context for future history and comparison pages.

`LotteryPredictionRuleRecord` stores learned prediction rule versions in Mongo at `lottery_prediction_rules`. Rule records capture rule id/name, generation, replay count, rank score, config, summary, and learned flag. `GET /lottery/predictions/rules` returns recent rule versions, and `GET /lottery/predictions/rules/compare` identifies the best ranked rule among that window for comparison UI.

`GET /lottery/predictions/replay-metrics` reads the latest durable training report timeline and aggregates score, red-hit average, blue-hit rate, best score, and prize distribution for a requested historical window.

Training operations expose both legacy `/lottery/training/status|cancel|retry` and prediction namespace `/lottery/predictions/training/status|cancel|retry` endpoints. Cancellation is cooperative: the API marks the active training run as cancelled, and candidate replay or rolling timeline loops stop at the next cancellation check. Retry reuses the last requested replay count and scale.

The frontend prediction history page at `/lottery/predictions/history` reads `GET /lottery/predictions` and presents recent durable snapshots with rule metadata, generated numbers, result state, and candidate counts.

The frontend prediction detail page at `/lottery/predictions/:id` reads `GET /lottery/predictions/{id}` and displays the saved primary prediction, candidate predictions, rule metadata, scores, actual draw, and hit results.

## Statistics Contract

`LotteryStatisticsSummary` is the first public statistics DTO for the lottery cockpit. `GET /lottery/statistics/summary` returns record count, first/latest draw metadata, red/blue frequency, and structural distributions for red sum, odd count, big count, and span. `POST /lottery/statistics/summary/refresh` forces a recalculation and rewrites the Redis cache. `GET /lottery/statistics/frequency` and `GET /lottery/statistics/distribution` expose the same data in smaller endpoint-specific shapes for pages that do not need the full summary.

The implementation reads normalized `LotteryDraw` pages from `IRecordService` and stores the summary in Redis at `lottery:statistics:summary`. `LotteryRecordSyncService` invalidates the summary cache after a sync saves new records, so the next statistics request rebuilds from normalized draw data.

The frontend overview page consumes `LotteryStatisticsSummary` for red/blue frequency charts and summary count display. Local `lotteryStats.ts` remains in use for recent draw interaction, prediction helpers, omissions, and other analysis pages until those contracts are migrated incrementally.

The overview page treats backend statistics as the preferred source and local parsing as a fallback. It shows explicit status alerts when statistics are loading, recalculating, unavailable, stale against the current local draw count, or when no records are available and a sync is needed.

## Personal Ticket Contract

Personal tickets should support both manually entered picks and prediction-derived picks:

```text
id
userId
issue
redNumbers
blueNumber
quantity
costAmount
source
predictionId
status
prizeGrade
prizeAmount
note
createdAt
updatedAt
```

`LotteryTicket` is the durable personal ticket model for `lottery_tickets`. It stores issue/period, red and blue numbers, quantity, cost, source, status, optional prediction snapshot linkage, and the latest `LotteryPrizeResult`.

`LotteryPrizeCalculator` is the shared prize-grade utility. It normalizes ticket and actual numbers with `LotteryDrawUtil`, counts red and blue hits, and maps 双色球 prize rules to `FIRST` through `SIXTH` or `NONE`.

`LotteryTicketService` is the first ticket service boundary. It uses default user scoping, normalizes red and blue numbers, defaults quantity/cost/source/status, and exposes list/create/update/delete through `/lottery/tickets`.

`POST /lottery/tickets/check-prizes` accepts an actual draw, finds tickets for that draw period, calculates prize results, and writes the checked status back to each ticket. `GET /lottery/tickets/summary` aggregates counts, cost, prize amount, status distribution, and prize distribution.

The frontend ticket list page at `/lottery/tickets` reads ticket list and summary APIs together, shows issue filtering, status/prize tags, generated numbers, cost, and prize outcome.

The ticket page create/edit modal posts to the ticket CRUD APIs and accepts red numbers as space- or comma-separated input before converting them to the backend list format.

Ticket list filtering supports `issue`, `status`, `source`, and `prizeGrade` on `GET /lottery/tickets`, with the frontend exposing matching controls on the ticket page.

Prediction detail can save the primary prediction or candidate predictions as draft tickets with `source=PREDICTION` and `predictionSnapshotId` linked to the originating snapshot.

Suggested statuses:

```text
DRAFT
BOUGHT
WAITING_DRAW
CHECKED
WON
LOST
VOID
```

## Ledger Contract

`LotteryLedgerSummary` is the first outcome ledger DTO. `GET /lottery/ledger/summary` reads personal tickets and aggregates ticket count, checked/pending count, winning count, total cost, total prize, net result, and ROI percent. Prize amounts are converted from stored cent values to display-scale decimal amounts.

`LotteryIssueLedger` is the issue-level ledger DTO. `GET /lottery/ledger/issues` groups personal tickets by issue and returns per-issue ticket count, checked/pending count, winning count, total cost, total prize, net result, and ROI percent.

`LotteryMonthlyLedger` is the monthly outcome trend DTO. `GET /lottery/ledger/months` groups personal tickets by creation month in `yyyy-MM` format and returns monthly ticket count, checked/pending count, winning count, total cost, total prize, net result, and ROI percent.

`LotteryPerformanceLedger` powers source and rule performance views. `GET /lottery/ledger/performance?dimension=source|rule` groups personal tickets by source by default; with `dimension=rule`, prediction tickets resolve `predictionSnapshotId` to snapshot `ruleId` and `ruleName` when available. Each row returns cost, prize, net result, ROI percent, and hit-rate percent.

## API Design Rules

- Keep existing APIs compatible while adding new `lottery/*` APIs.
- New record work should prefer `/lottery/records/*`; existing `/record/*` endpoints are legacy-compatible wrappers until callers are migrated.
- Record sync returns a persisted operation log so frontend pages can show status, saved count, issue range, and failure message.
- Record sync status values include `RUNNING`, `SUCCESS`, `FAILED`, and `SKIPPED`; `SKIPPED` means another sync already holds the Redis lock.
- Scheduled record sync is implemented by `LotteryRecordScheduledSync`, disabled by default through `hello.record.scheduled-sync-enabled`, and shares the same sync service, lock, and logs as manual sync.
- `RecordUpdater` filters provider results before persistence: records at or before the current last issue are skipped, duplicate issue codes in the same fetch are ignored, and new records receive sequential line numbers from the last persisted record.
- Return normalized project DTOs only.
- Use explicit filters rather than overloading vague request bodies.
- Support pagination for list/history endpoints that can grow.
- Add status/message fields for sync, provider, and training operations.
- Use millisecond timestamps for API/cache time fields.

## Frontend Rules

- Keep existing visual analysis pages, but route shared data through common APIs and utilities.
- `RecordContext` is the first migrated shared frontend data layer: it reads paged `/lottery/records/draws`, sorts draws by period/issue ascending for legacy time-series semantics, exposes normalized `lotteryDraws`, and keeps `allRecords` as 14-digit compact strings until analysis pages are migrated.
- Do not duplicate lottery number parsing across pages when a shared helper exists.
- Keep prediction UX research-oriented and avoid guaranteed-win language.
- Ticket and ledger pages should be quiet, record-focused, and explicit about cost and outcome.

## Verification Strategy

Backend:

- Unit-test number normalization and prize grade calculation.
- Unit-test sync idempotency and duplicate issue handling.
- Unit-test prediction scoring and actual-result attachment.
- Controller-test repeated filters and pagination for list endpoints.

Frontend:

- Build after route/API type changes.
- Verify empty, loading, error, and stale-cache states.
- Verify mobile layout for dense tables and chart pages.

Data:

- Check missing issue numbers.
- Check duplicate issue numbers.
- Check invalid red/blue number ranges.
- Check future draw dates.
- Check mismatched derived fields after sync.
