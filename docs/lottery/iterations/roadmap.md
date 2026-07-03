# Lottery Module Roadmap

Last updated: 2026-07-03

## Purpose

Evolve the lottery feature from a collection of record, statistics, prediction, and visualization pages into a durable personal lottery research module. The module should support historical draw data, provider-backed sync, statistical exploration, prediction replay, personal ticket tracking, prize checking, and investment-style outcome analysis while keeping data access behind internal APIs.

## Current Baseline

The project already has several lottery surfaces:

- Record APIs: `one-record/one-record-web/src/main/java/com/one/record/web/RecordController.java`
- Training APIs: `one-record/one-record-web/src/main/java/com/one/record/web/LotteryTrainingController.java`
- Astronaut APIs: `one-record/one-record-web/src/main/java/com/one/record/web/LotteryAstronautController.java`
- Training service: `one-record/one-record-service/src/main/java/com/one/record/service/impl/LotteryTrainingService.java`
- Frontend API client: `one-web/src/services/api.ts`
- Frontend routes: `one-web/src/routes/lifeRoutes.tsx`
- Lottery navigation: `one-web/src/constants/lifeDataModules.tsx`
- Frontend overview and prediction pages: `one-web/src/components/LotteryOverviewPage.tsx`, `one-web/src/components/LotteryPredictionPage.tsx`

Current endpoint groups:

```text
record/*
lottery/training/*
lottery/astronauts/*
lottery/records/*
```

## Product Direction

The intended product path is:

```text
historical records -> stable sync -> statistics cockpit -> prediction replay -> personal tickets -> prize and ROI tracking -> provider and rule operations
```

The module should become a daily-use lottery research cockpit inside the life data area, similar to how the stock module became an investment cockpit.

## Architecture Principles

- Controllers expose project-owned APIs only.
- Frontend pages call only project-owned APIs.
- Domain services should depend on provider/service interfaces, not concrete provider or file implementations.
- Historical records should have one canonical normalized representation for backend storage and frontend DTOs.
- Provider-specific details stay behind provider implementations.
- Prediction algorithms should produce explainable result snapshots: inputs, rule version, based-on period, target period, candidates, score, and actual result when available.
- Storage remains MongoDB plus Redis unless this roadmap is explicitly updated.

## Iteration Plan

### Iteration 00: Baseline Documentation And Boundaries

Goal: make the current lottery surface explicit and create a durable continuation path.

Deliverables:

- Add `docs/lottery` plan and task board.
- Document current APIs, pages, storage assumptions, and non-negotiable rules.
- Identify duplicated parsing/statistics logic and future consolidation points.
- Define target menu tree and version slices.

### Iteration 01: Historical Records And Sync Foundation

Goal: make lottery records stable, queryable, and provider-independent.

Deliverables:

- Add normalized lottery draw model if existing persisted `Record` shape is not enough for new use cases.
- Add repository/service layer for draw query, latest draw, first draw, and range query.
- Add sync log model for draw update jobs.
- Add provider interface for external draw data.
- Move external fetch/parsing behavior behind provider implementation.
- Add manual sync endpoint and scheduled sync job.
- Add Redis lock to prevent duplicate sync jobs.
- Keep current `record/*` endpoints compatible while planning migration to `lottery/records/*`.

Suggested endpoints:

```text
GET  /lottery/records/latest
GET  /lottery/records/first
GET  /lottery/records
POST /lottery/records/sync
GET  /lottery/records/sync-logs
```

### Iteration 02: Statistics Cockpit

Goal: make existing visual statistics consistent, reusable, and backend-aware.

Deliverables:

- Define backend summary DTOs for frequency, red/blue distribution, odd/even, sum, span, group, zodiac/season, hexagram, and yearly counts.
- Move expensive or repeated statistics into backend APIs where useful.
- Cache derived statistics in Redis with clear invalidation after record sync.
- Keep frontend charts and utility functions aligned with backend results.
- Add overview drill-through from summary cards to detailed statistics tabs.
- Add loading, empty, stale-cache, and sync-needed states.

Suggested endpoints:

```text
GET  /lottery/statistics/summary
GET  /lottery/statistics/frequency
GET  /lottery/statistics/distribution
POST /lottery/statistics/recalculate
```

### Iteration 03: Prediction Replay And Rule Operations

Goal: turn prediction from a single action into an auditable research workflow.

Deliverables:

- Persist training reports and prediction snapshots durably.
- Add prediction history list and detail.
- Add rule version metadata and rule comparison.
- Add replay metrics by historical window: red hits, blue hits, prize grade, score, stability.
- Attach actual draw result to prediction after the target period is known.
- Add retry/cancel/status behavior for long-running training.
- Separate latest prediction from historical prediction archive.

Suggested endpoints:

```text
GET    /lottery/predictions
GET    /lottery/predictions/latest
GET    /lottery/predictions/{id}
POST   /lottery/predictions/train
POST   /lottery/predictions/{id}/actual
GET    /lottery/predictions/rules
PUT    /lottery/predictions/rules/{id}
```

### Iteration 04: Personal Tickets And Prize Checking

Goal: connect research output to personal lottery actions.

Deliverables:

- Add personal ticket model with issue, red numbers, blue number, quantity, cost, source, status, and note.
- Add ticket CRUD pages.
- Support importing prediction candidates into tickets.
- Add prize grade calculation against actual draw.
- Add winning record snapshot after draw result arrives.
- Add ticket filters by issue, status, source, and prize grade.
- Keep gambling-related UX restrained and record-focused.

Suggested endpoints:

```text
GET    /lottery/tickets
POST   /lottery/tickets
PUT    /lottery/tickets/{id}
DELETE /lottery/tickets/{id}
POST   /lottery/tickets/check-prizes
GET    /lottery/tickets/summary
```

### Iteration 05: Outcome Analysis And Ledger

Goal: analyze personal input/output with the same rigor as stock portfolio summaries.

Deliverables:

- Add cost, prize, net result, hit-rate, and ROI summary cards.
- Add issue-level and month-level ledger views.
- Add source comparison: manual, prediction, random, saved rule.
- Add candidate performance comparison over time.
- Add charts for cost, prize, net result, and hit distribution.
- Link from overview, prediction detail, and ticket list into ledger views.

Suggested endpoints:

```text
GET /lottery/ledger/summary
GET /lottery/ledger/issues
GET /lottery/ledger/monthly
GET /lottery/ledger/rule-performance
```

### Iteration 06: Provider, Settings, And Operations

Goal: make sync and rule behavior inspectable and configurable.

Deliverables:

- Add provider health, config snapshot, and probe APIs.
- Add lottery user preferences: default ticket cost, default prediction scale, chart defaults, cache behavior, and notification options.
- Add sync operations page with latest logs, failures, retry, and scheduled trigger.
- Add rule/training settings page.
- Add data quality checks for missing issue numbers, duplicated records, malformed numbers, and future dates.

Suggested endpoints:

```text
GET  /lottery/providers/health
GET  /lottery/providers/config
GET  /lottery/providers/probe
GET  /lottery/preferences
PUT  /lottery/preferences
POST /lottery/data-quality/check
```

## Storage Direction

MongoDB durable data:

```text
lottery_draws
lottery_sync_logs
lottery_prediction_rules
lottery_predictions
lottery_training_reports
lottery_tickets
lottery_prize_results
lottery_preferences
lottery_astronauts
```

Redis short-lived or derived state:

```text
lottery:records:sync:lock
lottery:statistics:summary
lottery:training:status
lottery:training:last
lottery:prediction:latest
lottery:provider:health:{provider}
lottery:providers:probe:{category}
lottery:astronauts:voyage-counts
```
