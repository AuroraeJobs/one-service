# Lottery Long-Term Plan

Last updated: 2026-07-07

## North Star

Build the lottery module into a personal research and operations system: trustworthy data, repeatable analysis, restrained decision support, auditable execution, and clear release evidence. The product should help the user review historical facts and personal outcomes, not encourage guaranteed-result thinking.

## Planning Principles

- Keep all lottery data access behind project-owned backend APIs.
- Treat prediction as research evidence, not a promise.
- Prefer closed-loop learning: every recommendation should eventually connect to an actual draw, ticket outcome, ledger result, or explicit retirement decision.
- Make daily operation fast on desktop and mobile, with the workbench as the default command center.
- Keep QA evidence reproducible: automated release checks first, browser screenshots when login and backend are available.
- Add backend contracts only when the frontend cannot safely compose from existing bounded APIs.

## 0-3 Months: Operable Research Cockpit

Goal: make the current platform easier to run every draw cycle and safer to release.

Product outcomes:

- The workbench clearly answers what needs attention for the current issue.
- The mobile surface supports the daily review loop without dense desktop tables.
- Release evidence is one command plus optional browser screenshots.
- Status labels, source labels, and governance states remain Chinese and consistent.

Implementation themes:

- Finish release evidence hardening after Iteration 25.
- Add stale-evidence checks for recommendation, governance, simulator, ticket-pack, and mobile surfaces.
- Improve workbench issue focus around next draw, current draw, pending tickets, and unresolved release checks.
- Add richer mobile review actions for stale recommendations, pending approvals, and settlement gaps.
- Keep dark-mode/mobile QA in the release evidence checklist.

Success signals:

- A daily review can be completed from `/lottery/workbench` or `/lottery/mobile` without opening unrelated pages.
- `npm run lottery:release-check` is the default frontend verification path for UI-only lottery releases.
- Browser QA blockers are recorded as auth/backend availability issues instead of ambiguous UI failures.

## 3-6 Months: Closed-Loop Strategy Learning

Goal: make strategy quality observable over time and reduce manual interpretation across pages.

Product outcomes:

- Every saved decision, recommendation, ticket pack, and simulator proposal has a visible outcome trail.
- Strategy notes, backtests, recommendations, and ledger results can be compared from one research context.
- Weak, stale, volatile, or under-tested evidence is obvious before the user acts on it.

Implementation themes:

- Add outcome attribution rollups by rule, portfolio, recommendation, simulator setting, and ticket-pack source.
- Add recommendation lifecycle analytics: promote, watch, pause, retire, and result-after-action.
- Add evidence quality trend summaries for rules and portfolios.
- Add report presets for issue review, month-end review, and strategy retirement review.
- Improve exports so closed-loop evidence can be archived outside the app.

Success signals:

- A strategy can be reviewed from idea -> evidence -> recommendation -> ticket/action -> actual outcome -> retirement or promotion.
- The module can explain why a recommendation is active, stale, paused, or retired.
- Month-end review requires less manual cross-checking between tickets, ledger, outcomes, and exports.

## 6-12 Months: Durable Personal Intelligence Layer

Goal: make the lottery module resilient, explainable, and useful as a long-running personal research archive.

Product outcomes:

- Historical decisions and outcomes remain searchable and comparable over many months.
- Data quality, provider reliability, and release readiness have durable trend evidence.
- The system can summarize what changed since the last review without relying on memory.

Implementation themes:

- Add long-horizon data retention and archive policies for logs, exports, backtests, recommendations, and audit events.
- Add release history snapshots for frontend smoke/build evidence and backend verification summaries.
- Add queryable research archive views: by issue, month, rule, portfolio, source, and evidence state.
- Add anomaly detection for provider freshness, draw gaps, unusual ledger deltas, and stale recommendation clusters.
- Consider scheduled local jobs only after manual runbooks are stable and observable.

Success signals:

- A six-month retrospective can be generated from durable data rather than manual notes.
- Provider/sync failures are diagnosable by category, trend, and recent recovery action.
- The user can compare strategy behavior across seasons without re-running heavy analysis manually.

## Candidate Iterations

Completed in the previous planning block: Iterations 26-30 covered release history, workbench issue focus, attribution rollups, recommendation lifecycle analytics, and research archive/month-end intelligence.

### Iteration 31: Anomaly Watch And Evidence Drift

- Add a governance anomaly watch that joins operations health, simulator risk, ticket-pack exposure, attribution drift, stale recommendations, and release blockers.
- Add compact trend context for repeated anomaly categories.
- Connect recurring anomalies to workbench and month-end review handoffs.

### Iteration 32: Provider Reliability Trends

- Summarize provider freshness, probe outcomes, sync skips, failures, and recovery intervals over time.
- Add failure-category trend rows to sync and governance surfaces.
- Keep provider diagnosis descriptive and bounded to stored operational evidence.

### Iteration 33: Review Automation Runbook

- Turn daily, draw-cycle, month-end, and release-review steps into explicit runbook cards.
- Track manual acknowledgement and generated evidence without starting hidden prediction work.
- Add smoke coverage for runbook labels and disabled/blocked states.

### Iteration 34: Research Archive Search 2.0

- Add stronger filters by issue, month, rule, portfolio, source, lifecycle state, and evidence quality.
- Connect archive results to recommendation, outcome, ticket-pack, and export views.
- Keep large historical views paged and archive-first rather than recomputing heavy analysis in the browser.

### Iteration 35: Long-Horizon Quality Retrospective

- Generate six-month and yearly quality retrospectives from durable ledger, attribution, recommendation, release, and provider evidence.
- Highlight what changed since the previous review.
- Add export presets only after the on-screen retrospective has stable evidence groups.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Prediction copy becomes too confident | Keep research/evidence language in quality gates and smoke coverage. |
| Browser QA remains blocked by local auth/backend state | Keep static release checks mandatory and record blocker signatures explicitly. |
| Evidence reports become stale | Keep freshness guard in release workflow and consider CI wiring later. |
| Frontend pages duplicate business logic | Prefer backend DTOs and shared frontend label/helpers; add backend contracts for real gaps only. |
| Daily pages become too dense | Keep workbench and mobile surfaces task-oriented, with specialist pages for deep review. |
| Long-running analysis becomes expensive | Use persisted reports, bounded pages, and explicit run actions rather than hidden background work. |

## Review Cadence

- Review this long-term plan after every five completed iterations.
- Promote only the next one or two candidate iterations into `docs/lottery/iterations/checklist.md`.
- Keep completed tactical plans as historical evidence, but let this file carry the long-horizon direction.
