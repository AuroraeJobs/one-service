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
- Sync locks.
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

Training reports should include:

- Replay window.
- Candidate rules.
- Best rule.
- Timeline.
- Metrics.
- Generation/version.
- Failure message when applicable.

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

## API Design Rules

- Keep existing APIs compatible while adding new `lottery/*` APIs.
- New record work should prefer `/lottery/records/*`; existing `/record/*` endpoints are legacy-compatible wrappers until callers are migrated.
- Record sync returns a persisted operation log so frontend pages can show status, saved count, issue range, and failure message.
- Return normalized project DTOs only.
- Use explicit filters rather than overloading vague request bodies.
- Support pagination for list/history endpoints that can grow.
- Add status/message fields for sync, provider, and training operations.
- Use millisecond timestamps for API/cache time fields.

## Frontend Rules

- Keep existing visual analysis pages, but route shared data through common APIs and utilities.
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
