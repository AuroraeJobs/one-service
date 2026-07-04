# Lottery Module Roadmap

Last updated: 2026-07-04

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
historical records -> stable sync -> statistics cockpit -> prediction replay -> personal tickets -> prize and ROI tracking -> provider and rule operations -> daily workflow workbench -> intelligence platform
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

### Iteration 07: Operational Hardening And Data Quality Repair

Goal: turn the operations pages from passive inspection into actionable repair and observability workflows.

Deliverables:

- Persist provider probe history and expose recent probe logs.
- Add record sync summary aggregation from MongoDB sync logs.
- Add dry-run and confirm flows for missing issue repair.
- Keep malformed and duplicate record repair conservative: report first, rewrite only when a trusted refetch can prove the replacement. The first backend repair slice only writes provider-backed missing issues.
- Add provider/sync summary cards to lottery operations pages.
- Wire lottery preferences into prediction defaults and ticket-save behavior.
- Surface data quality warnings on operational entry points.

Suggested endpoints:

```text
GET  /lottery/providers/probe-logs
GET  /lottery/records/sync-summary
POST /lottery/data-quality/repair/missing-issues
POST /lottery/data-quality/repair/malformed-records
```

### Iteration 08: Prediction Automation And Ticket Closure

Goal: connect predictions, personal tickets, prize checking, and outcome views into a repeatable usage loop.

Deliverables:

- Add duplicate-safe batch ticket saving for prediction candidates.
- Add latest-draw prize checking with an operation summary.
- Add frontend actions to save primary and candidate predictions as tickets.
- Add a ticket page action to check pending tickets against the latest draw.
- Show prediction result status and ticket linkage across prediction history, prediction detail, and ticket pages.
- Attach latest actual results to matching prediction snapshots where the backend can prove the period match.

Suggested endpoints:

```text
POST /lottery/tickets/batch
POST /lottery/tickets/check-prizes/latest
GET  /lottery/tickets?predictionSnapshotId=
POST /lottery/predictions/attach-latest-actual
```

### Iteration 09: Daily Workflow And Scalable Lists

Goal: turn the completed lottery capabilities into a daily-use workflow and make growing history lists safe to use over time.

Deliverables:

- Add a daily workbench route that summarizes latest draw, record sync state, data quality, latest prediction, pending tickets, latest prize-check result, and ledger outcome.
- Add a backend workbench summary DTO so the frontend does not stitch operational state from many unrelated pages.
- Add a backend daily workflow action that can run safe daily steps in order: sync records, attach latest actual results to matching predictions, check latest pending tickets, and return a step-by-step operation summary.
- Keep prediction generation as an explicit user action when it may be long-running; the workbench should link to training and surface current training status rather than hiding long jobs behind a silent aggregate call.
- Add pagination envelopes to growing list endpoints, starting with prediction history, tickets, sync logs, and provider probe logs.
- Expand prediction and ticket filters for daily review: result state, target issue, rule id/name, created-time range, ticket status, prize state, and source.
- Add frontend list controls that preserve filters in query parameters where useful, especially workbench drill-through links.
- Connect workbench cards to records, prediction detail/history, tickets, ledger, sync, and data-quality pages.
- Update quality gates so new list endpoints either support pagination or have an explicit bounded limit.

Suggested endpoints:

```text
GET  /lottery/workbench/summary
POST /lottery/workbench/daily-run
GET  /lottery/predictions?page=&pageSize=&resultState=&targetPeriod=&ruleId=
GET  /lottery/tickets?page=&pageSize=&issue=&status=&source=&prizeGrade=&predictionSnapshotId=
GET  /lottery/records/sync-logs?page=&pageSize=&status=
GET  /lottery/providers/probe-logs?page=&pageSize=&provider=
```

### Iteration 10: Lottery Intelligence Platform

Goal: evolve the lottery module from a daily workbench into a longer-running research platform with strategy experiments, replay labs, alerting, exportable evidence, and governance around risk and data quality.

This is a long iteration and should be delivered in waves. Each wave can be implemented and pushed independently while preserving the overall direction.

#### Wave 10A: Daily State Backbone

- Add stable query-backed drill-through links between workbench, prediction history, ticket pages, ledger, sync, and quality pages.
- Add a compact daily state model so the module can resume the daily flow after refresh.
- Add `GET /lottery/workbench/daily-state` and keep state composition behind backend services.
- Show daily-state badges on the workbench so the user can see whether sync, prediction review, ticket confirmation, prize check, or quality repair is pending for the current issue.
- Preserve all existing routes and keep `/lottery/workbench` as the daily entry point.

#### Wave 10B: Strategy Experiment Lab

- Add durable strategy experiment records that capture strategy name, parameters, replay window, input source, generated candidates, score distribution, and outcome summary.
- Allow comparing multiple strategies without replacing the current default prediction rule.
- Add experiment tags and notes so useful trials can be revisited.
- Keep all strategy execution behind backend services; frontend should only submit project-owned experiment requests.

#### Wave 10C: Backtest And Replay Evidence

- Add paged backtest reports with per-issue replay rows, hit statistics, prize-grade distribution, stability score, and bankroll simulation.
- Support replay windows such as latest 30, 100, 300, and custom issue ranges.
- Connect backtest output to rule comparison and ledger source/rule performance.
- Add export-friendly report snapshots for future PDF/CSV work.

#### Wave 10D: Alerts, Calendar, And Daily Reminders

- Add draw calendar awareness: next draw date, expected sync window, and unresolved pending steps.
- Add in-app reminders for pending sync, pending prediction, pending ticket confirmation, and pending prize check.
- Keep notifications local to the app until an explicit external notification provider is selected.
- Track alert acknowledgement so repeated warnings are useful rather than noisy.

#### Wave 10E: Portfolio-Style Governance

- Add budget and exposure settings for the lottery module: weekly/monthly budget, max tickets per issue, and reminder thresholds.
- Add warnings when planned or recorded tickets exceed configured limits.
- Extend ledger views with rolling cost, rolling prize, net result, ROI, and drawdown-style summaries.
- Keep copy restrained and outcome-focused; never frame predictions as guaranteed wins.

#### Wave 10F: Export, Audit, And Maintenance

- Add export endpoints for tickets, ledger rows, prediction snapshots, experiment reports, and sync/probe logs.
- Add audit metadata for generated predictions, saved tickets, and daily-run steps.
- Add maintenance views for stale caches, old logs, and oversized history collections.
- Add quality gates for export integrity and audit-field preservation.

Suggested endpoint groups:

```text
lottery/experiments/*
lottery/backtests/*
lottery/alerts/*
lottery/calendar/*
lottery/budget/*
lottery/exports/*
lottery/audit/*
```

### Iteration 11: Frontend Experience And Power Tools

Goal: turn the completed backend/platform foundation into a richer user-facing lottery product. This iteration is frontend-led and should make daily operation, research comparison, ticket management, report building, and export/audit review feel complete.

Deliverables:

- Upgrade `/lottery/workbench` into the practical daily command center with quick actions, recent-work shortcuts, saved view state, and richer widgets.
- Add a research comparison route for experiments, backtests, rules, and ledger evidence.
- Add ticket workflow power tools: bulk paste/import, duplicate preview, batch actions, issue timeline, and mobile-friendly cards.
- Improve export, audit, and maintenance pages with browser downloads, report preview, filtering, and print-friendly layouts.
- Polish dense frontend states across workbench, research, tickets, ledger, export, alerts, and maintenance.

Frontend-first rules:

- Reuse existing `lottery/*` APIs first.
- Add backend only for narrow read-only gaps or bounded summaries.
- Keep filters URL-backed where they drive drill-through workflows.
- Keep research language evidence-oriented and restrained.

Planned route additions or upgrades:

```text
/lottery/workbench
/lottery/research
/lottery/tickets
/lottery/ledger
/lottery/exports
/lottery/alerts
```

### Iteration 12: Reliability And Intelligent Operations

Goal: make lottery sync, provider access, data repair, prediction replay, and daily operations easier to diagnose and safer to run. CWL remains the primary draw provider; a local proxied `403` should be treated first as proxy/network reachability evidence, not as a provider replacement trigger.

Deliverables:

- Add provider diagnostics for direct/proxy/no-proxy context, HTTP status, response type, latency, and safe response snippets.
- Surface provider business failure, invalid response, blank response, HTTP failure, and suspected proxy/network block as distinct sync outcomes.
- Add server-side lottery provider networking configuration where supported by the runtime.
- Add data-quality repair dry-run and confirm-only repair flows for gaps, duplicates, invalid numbers, stale caches, and bounded issue ranges.
- Automatically attach new actual draws to eligible prediction snapshots and expose replay/rule evidence quality.
- Add daily operation summary for sync, quality, prediction attachment, ticket prize checks, alerts, and release checks.

Planned endpoint or surface upgrades:

```text
/lottery/providers/probe-logs
/lottery/records/sync-logs
/lottery/quality
/lottery/workbench
/lottery/exports
/lottery/audit
```

### Iteration 18: Adaptive Review And Mobile Execution

Goal: close the loop after guided strategy execution. The module should not only execute portfolios, simulations, and ticket packs; it should attribute outcomes back to evidence, calibrate next recommendations, and expose a compact mobile command flow for daily review.

Deliverables:

- Add issue-level outcome attribution across portfolios, simulations, decisions, ticket packs, tickets, and actual draw results.
- Add calibrated recommendation lifecycle for promoting, watching, pausing, or retiring rules, portfolios, and simulator settings.
- Add a compact `/lottery/mobile` command surface for next-draw actions, pending approvals, stale evidence, settlement gaps, and release blockers.
- Add closed-loop report presets and release evidence for attribution, recommendation lifecycle, mobile command flow, and V15 governance.
- Keep the same provider isolation: outcome/recommendation/mobile surfaces consume project-owned `lottery/*` APIs and do not call external lottery providers from the browser.

Planned route additions or upgrades:

```text
/lottery/outcomes
/lottery/recommendations
/lottery/mobile
/lottery/governance
/lottery/exports
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
lottery_provider_probe_logs
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
