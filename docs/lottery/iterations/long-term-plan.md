# Lottery Long-Term Plan

Last updated: 2026-07-11

## North Star

Build the lottery module into a personal research and operations system: trustworthy data, repeatable analysis, restrained decision support, auditable execution, and clear release evidence. The product should help the user review historical facts and personal outcomes, not encourage guaranteed-result thinking.

## Planning Principles

- Keep all lottery data access behind project-owned backend APIs.
- Treat prediction as research evidence, not a promise.
- Prefer closed-loop learning: every recommendation should eventually connect to an actual draw, ticket outcome, ledger result, or explicit retirement decision.
- Make `/lottery` the stable default overview and keep `/lottery/workbench` as the focused operation center on desktop and mobile.
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

- Close the in-flight sync operations and refresh release evidence in Iteration 46 before adding another product surface.
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

Completed through Iteration 46: the platform foundation, daily and month-end workflows, outcome attribution, recommendation lifecycle, mobile operations, archive/search evidence, provider reliability, release visibility, focused retirement/archive-review handoffs, and the sync-operations/release-baseline closure are represented in the product and historical iteration plans.

Only the next candidate is promoted. Later ideas remain in the long-horizon themes above until the next planning review.

### Completed Iteration 46: Sync Operations And Release Baseline Closure

- Completed the sync-record card UI, paging, delete confirmation, responsive states, explicit i18n, and operational entry points.
- Enforced `RUNNING` log deletion protection and moved sync/probe filters, counts, and deterministic pagination from full-collection memory slicing to MongoDB queries.
- Settled `/lottery` as the default overview and `/lottery/workbench` as the operation center while keeping workbench, mobile, and settings discoverable without footer-level top items.
- Refreshed backend, i18n, smoke, lint, build, browser, and release evidence; final smoke passed 808 checks across 18 routes.

### Iteration 47: MiniGPT Lottery Research Loop V1

Formal delivery plan: [Iteration 47 plan](iteration-47-plan.md). Waves 47A and 47B are complete; Wave 47C random-baseline and outcome-chain work is next, while Wave 47D remains follow-up work.

- Add a strategy-sample corpus alongside raw draw and structural-feature corpora, with versioned export metadata and a reproducible time-based train/validation split.
- Use a training context long enough to contain a full structured lottery sample and record run, checkpoint, prompt, temperature, top-k, parsing, and repair provenance.
- Close the manual research chain from corpus export and training through candidate generation, compliance repair, differentiated candidate pools, random-baseline backtests, decision sets, tickets, actual results, and month-end review.
- Gate progress on reproducible parse rate, legal-number rate, candidate diversity, time-window backtests, and comparison with a random baseline rather than training loss alone.

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

- 2026-07-11 delivery review: work is complete through Iteration 46, and Iteration 47 Waves 47A-47B have closed the reproducible corpus/time-split plus training/generation provenance baseline. Continue with Wave 47C random-baseline and outcome-chain work before promoting month-end handoff.
- Review this long-term plan after every five completed iterations.
- Promote only the next one or two candidate iterations into `docs/lottery/iterations/checklist.md`.
- Keep completed tactical plans as historical evidence, but let this file carry the long-horizon direction.
