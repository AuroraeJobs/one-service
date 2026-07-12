# Lottery Long-Term Plan

Last updated: 2026-07-12

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

Completed through Iteration 48: the platform foundation, daily and month-end workflows, outcome attribution, recommendation lifecycle, mobile operations, archive/search evidence, provider reliability, release visibility, sync-operations closure, the verified MiniGPT research loop, and its temporal-boundary/observed-only evidence are represented in the product and historical iteration plans.

No next candidate is currently promoted. Later ideas remain in the long-horizon themes above until the next planning review selects one.

### Completed Iteration 46: Sync Operations And Release Baseline Closure

- Completed the sync-record card UI, paging, delete confirmation, responsive states, explicit i18n, and operational entry points.
- Enforced `RUNNING` log deletion protection and moved sync/probe filters, counts, and deterministic pagination from full-collection memory slicing to MongoDB queries.
- Settled `/lottery` as the default overview and `/lottery/workbench` as the operation center while keeping workbench, mobile, and settings discoverable without footer-level top items.
- Refreshed backend, i18n, smoke, lint, build, browser, and release evidence; final smoke passed 808 checks across 18 routes.

### Completed Iteration 47: MiniGPT Lottery Research Loop V1

Formal delivery plan: [Iteration 47 plan](iteration-47-plan.md). Waves 47A-47D, production release verification, rendered browser handoff, staged-scope audit, commit, and push are complete.

- Completed the strategy-sample corpus, versioned export metadata, and reproducible time-based train/validation split beside raw and structural-feature corpora.
- Completed full-sample context validation and durable run, checkpoint, prompt, sampling, parsing, repair, and candidate-batch provenance.
- Closed the manual chain through typed-provenance decision sets, deterministic same-window/same-budget random-baseline backtests, explicit draft ticket packs, tickets, actual results, ledgers, notes, and lifecycle review. Historical static-pool replay remains explicitly distinct from walk-forward evaluation.
- Carried the verified chain into month-end review by selecting the most recent reviewed MiniGPT outcome, requiring the reviewed report to match both `reviewBacktestId` and `decisionSetId`, and accepting ticket packs only through the same decision `decisionSetId`/`sourceId`; later replay reports and unrelated packs cannot replace the frozen evidence.
- Extended the existing decision-set, backtest, and decision-outcome CSV exports with provenance, added `averageRedHitsDelta`, `blueHitRateDelta`, `totalPrizeDelta`, and the other model/random metrics to backtest rows, and added the `v47-minigpt-research` preset instead of a parallel report domain. UNKNOWN comparison state remains non-PASS, and release copy stays historical-only without triggering ticket-pack approval or ticket creation.

### Completed Iteration 48: MiniGPT Temporal Boundary And Out-Of-Sample Observation V1

Formal delivery plan: [Iteration 48 plan](iteration-48-plan.md). Waves 48A-48D, production release verification, rendered browser handoff, staged-scope audit, implementation commit, and push are complete.

- Wave 48A now adds a frontend-only, read-only determination to the existing MiniGPT decision-provenance panel on `/lottery/predictions/decision`, using exact decision outcomes, decision sets, and MiniGPT provenance. It adds no API, collection, route, export type, or write action.
- The fixed classifier states are `TRAIN_WINDOW`, `VALIDATION_WINDOW`, `POST_CORPUS_PENDING`, `POST_CORPUS_OBSERVED`, and `UNKNOWN`.
- Only `POST_CORPUS_OBSERVED` may be described as an out-of-sample observation. It is not a performance PASS, proof of generalization, or future guarantee; `UNKNOWN` is never PASS.
- Wave 48B now composes the latest 100 include-archived outcomes in the existing decision page, uses decision-page `total`/`hasNext` to disclose bounded-snapshot truncation, keeps all five states separate, and admits only `POST_CORPUS_OBSERVED` to the observed denominator.
- Stable corpus/run/hash/range provenance forms lineage groups while every owning decision remains visible; incomplete provenance is isolated. Decision count, distinct issues, scored candidates, and fully settled financial coverage stay separate, and small-sample/coverage warnings remain explicit.
- Random-baseline deltas resolve per decision from exact `reviewBacktestId` detail only after decision ownership, stable provenance, same window/budget, equal ticket counts, complete metadata/deltas, and static historical-replay mode pass. No reports are averaged together, no favorable value changes the temporal state, and no backend contract or write path was added.
- Wave 48C now adds an independent latest-100 include-archived observation snapshot to the existing month-end MiniGPT section while preserving the legacy month-end summary, score, and lifecycle semantics. The page reuses the Wave 48B aggregate, exposes loaded/total truncation metadata, and keeps five-state, observed-decision, distinct-issue, scored-candidate, settled-financial, and exact-baseline coverage separate with the same warnings and non-predictive language.
- The existing `decision-outcomes` CSV now uses an export-internal Java mirror of the fixed five-state classifier and `LATEST_100_DECISIONS_INCLUDE_ARCHIVED` snapshot. Decision-level boundary fields and snapshot denominators repeat on candidate rows with `REPEATED_SNAPSHOT_METADATA_DO_NOT_SUM`; detail filters and row limits cannot redefine the snapshot, and repeated candidate rows never multiply decision counts.
- CSV reviewed evidence remains exact-owned and becomes comparable only after stable-provenance, same-window/budget, equal-ticket-count, complete-metadata/delta, and static-replay checks. Unbound or wrong-owner evidence remains `UNKNOWN` with trusted deltas blank, shared formula-injection protection remains in force, and no new export type, route, collection, or business-data write path was added.
- Wave 48D closes the release with Maven 12/12, ESLint, i18n 1090, smoke/release 1326/1326 across 18 routes, production build, Chinese/English light/dark 1280px/390px browser checks, real CSV `1/1/1/4/1` plus 100/103 truncation evidence, tagged-fixture cleanup, scoped commit/push evidence, and no parallel route or export domain. No next candidate is currently promoted.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Prediction copy becomes too confident | Keep research/evidence language in quality gates and smoke coverage. |
| Browser QA remains blocked by local auth/backend state | Keep static release checks mandatory and record blocker signatures explicitly. |
| Evidence reports become stale | Keep freshness guard in release workflow and consider CI wiring later. |
| Frontend pages duplicate business logic | Prefer backend DTOs and shared frontend label/helpers; add backend contracts for real gaps only. |
| Daily pages become too dense | Keep workbench and mobile surfaces task-oriented, with specialist pages for deep review. |
| Long-running analysis becomes expensive | Use persisted reports, bounded pages, and explicit run actions rather than hidden background work. |
| A later replay or unrelated pack replaces reviewed evidence | Require both report id and `decisionSetId`, associate packs only by the same decision `decisionSetId`/`sourceId`, and never treat missing comparison flags as PASS. |
| Validation-window or unknown rows are presented as out-of-sample evidence | Use the fixed five-state Iteration 48 classifier, reserve out-of-sample wording for settled `POST_CORPUS_OBSERVED` rows, and keep `UNKNOWN` non-PASS. |
| A bounded observation panel is read as full history | Cap the read at 100 include-archived outcomes, display loaded/total scope, and warn when decision-page `hasNext` or `total` shows that earlier records are outside the denominator. |
| Baseline deltas from different reports are blended into a stronger claim | Keep exact reviewed-report checks and deltas on each owning decision row; never average reports or use a favorable delta to upgrade the temporal state. |
| Repeated CSV candidate rows are summed as independent observation snapshots | Keep the snapshot fixed at the latest 100 include-archived decisions, mark its count unit as `DECISION_SET`, repeat `REPEATED_SNAPSHOT_METADATA_DO_NOT_SUM`, and keep export `rowCount` separate from every observation denominator. |

## Review Cadence

- 2026-07-11 delivery review: work is complete through Iteration 47, including Wave 47D month-end and release/export evidence. Final verification passed backend service 96/96, backend web 43/43, i18n 1039, lottery smoke 1065/1065 across 18 routes, fresh release evidence, the production build, exact-chain desktop QA, and English 390x844 responsive QA.
- 2026-07-12 planning and Wave 48A review: Iteration 47's final handoff was confirmed complete, Iteration 48 was then selected as the sole next candidate, and its read-only five-state temporal classifier was verified through focused cases, i18n/smoke/release checks, and Chinese/English desktop/mobile light/dark browser QA. That review handed off to Wave 48B; the following entry records its completion.
- 2026-07-12 Wave 48B implementation review: observed-only bounded composition, separate denominators, stable-lineage isolation, and exact per-decision baseline comparison are complete without a backend contract change. Final gates pass file-scoped ESLint, i18n 1088, smoke/release 1134/1134 across 18 routes, and the production build. Isolated five-state plus 100/103 truncation fixtures passed Chinese/English desktop and English 390px light/dark QA with no horizontal overflow, no new post-readiness console errors, GET-only reads, and full fixture/runtime cleanup. That review handed off to Wave 48C, whose completion is recorded in the next entry.
- 2026-07-12 Wave 48C implementation review: the independent bounded-100 month-end summary and existing `decision-outcomes` CSV propagation are implemented without a new export domain or write action. The Java mirror keeps decision counts independent of flattened candidates, fixes snapshot semantics, and preserves exact reviewed ownership/comparability plus CSV injection protection. Focused `LotteryExportServiceTest` coverage passed 12/12, file-scoped ESLint passed, and the i18n audit passed 1090 calls.
- 2026-07-12 Wave 48D final release review: dedicated release guards, smoke/release 1326/1326 across 18 routes, production build, Chinese/English light/dark desktop/mobile rendering, exact real CSV snapshot checks, fixture cleanup, staged-scope audit, and implementation commit `b0c3e3ee` push evidence close Iteration 48. The existing export audit write remains unchanged; no new business-data mutation or public contract was added. No next candidate is currently promoted.
- Review this long-term plan after every five completed iterations.
- Promote only the next one or two candidate iterations into `docs/lottery/iterations/checklist.md`.
- Keep completed tactical plans as historical evidence, but let this file carry the long-horizon direction.
