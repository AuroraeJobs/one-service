# Lottery Documentation Index

Last updated: 2026-07-12

This folder is the durable planning home for the lottery module. It follows the same working style as `docs/stock`: keep roadmap, iteration checklist, module design, and menu/version planning together so future work can continue from a clear task board.

## Resume Entry

When continuing in a new Codex thread, say:

```text
Continue the lottery module from docs/lottery/README.md.
Start with the next unchecked task in docs/lottery/iterations/checklist.md.
Keep lottery records, predictions, statistics, personal tickets, and provider/sync concerns behind internal project APIs.
```

First commands to run:

```bash
git status --short
rg -n "Lottery|lottery|RecordController|LotteryTraining|LotteryAstronaut|recordApi|lotteryTrainingApi|lotteryAstronautApi" .
java -version
mvn -version
```

## Iteration Docs

- [Menu and version plan](menu-and-version-plan.md): target lottery menus and release slices.
- [Roadmap](iterations/roadmap.md): module direction and phased plan.
- [Long-term plan](iterations/long-term-plan.md): 0-12 month direction, candidate future iterations, risks, and review cadence.
- [Checklist](iterations/checklist.md): durable task board.
- [Iteration 46 plan](iterations/iteration-46-plan.md): sync operations and release baseline closure.
- [Iteration 47 plan](iterations/iteration-47-plan.md): completed MiniGPT lottery research loop from reproducible corpus through deterministic random-baseline, outcome review, month-end evidence, release/export handoff, and final verified delivery.
- [Iteration 48 plan](iterations/iteration-48-plan.md): the sole promoted candidate, adding MiniGPT temporal-boundary classification and post-corpus observation evidence in four waves; Waves 48A-48C are complete and Wave 48D release/handoff is next.
- [Quality gates](iterations/quality-gates.md): verification rules for backend, frontend, and data behavior.
- [Frontend one-month plan](iterations/frontend-one-month-version-plan.md): next month frontend-led experience and power-tool plan.

## Module Docs

- [Technical design overview](modules/technical-design.md)
- [Selection strategy and model training direction](modules/selection-training-strategy.md): use lottery draw records as MiniGPT/model training material for compliant candidate generation, strategy filtering, and backtest planning.

## Current Baseline

Live capabilities already present in the codebase:

- Iterations 1-47 are complete; Iteration 48 is the sole promoted next candidate, with its read-only Wave 48A classifier, Wave 48B bounded observed-only aggregation, and Wave 48C month-end/CSV evidence propagation now complete.
- Historical record access and update through `record/*` APIs.
- Lottery records namespace through `lottery/records/*`, currently reusing the existing record service for compatibility.
- `/lottery` is the unified default overview with recent draws, yearly counts, frequency cards, AI context, and entry points into specialist workflows.
- `/lottery/workbench` remains the operation center for current-issue closure and daily actions; `/lottery/mobile` and `/lottery/settings` remain preserved specialist routes.
- Prediction page backed by `lottery/training/*` APIs.
- Rule training, latest prediction, and latest actual record stored through Redis-backed service state.
- Durable prediction history, prediction detail, personal tickets, latest prize checking, and ticket linkbacks.
- Ledger pages for cost, prize, net result, ROI, issue-level outcomes, monthly outcomes, and source/rule performance.
- Operations pages for sync summary, provider probe history, settings, and data quality repair.
- Astronaut naming, voyage records, and voyage counts through `lottery/astronauts/*`.
- Statistics and analysis routes including frequency, group, distribution, pixel views, Taiji, space, and hexagram pages.
- MiniGPT month-end review retains the most recent reviewed MiniGPT outcome, exact `reviewBacktestId` plus `decisionSetId` report ownership, same-decision ticket-pack association, and ledger handoff. Wave 48C adds a separate latest-100 include-archived five-state snapshot that reuses the decision-page aggregate, exposes total/truncation scope, admits only `POST_CORPUS_OBSERVED` to observed metrics, and never changes the month-end score or lifecycle state.
- The MiniGPT decision page now composes a read-only Wave 48B snapshot from the latest 100 include-archived outcomes, exposes decision-page `total`/`hasNext` when that scope is truncated, keeps all five temporal states separate, and admits only `POST_CORPUS_OBSERVED` to its observed denominator. Stable corpus/run/hash/range provenance groups keep their individual decision rows; incomplete lineage is isolated.
- Wave 48B keeps decision, distinct-issue, scored-candidate, and fully settled financial denominators separate. Random-baseline deltas appear only on the owning decision after exact `reviewBacktestId`, decision owner, provenance, same-window/same-budget, equal-ticket-count, complete-metadata/delta, and static-replay checks; reports are never averaged together.
- The existing `decision-outcomes` CSV now carries an internal Java mirror of the decision-level boundary plus a fixed latest-100 include-archived snapshot. Snapshot counts/denominators repeat on candidate rows with `REPEATED_SNAPSHOT_METADATA_DO_NOT_SUM`; filters and row limits do not redefine the snapshot, exact reviewed ownership/comparability gates trusted deltas, and the shared CSV injection protection remains active. The preset and export type remain the existing `v47-minigpt-research`/`decision-outcomes` paths.
- The last fully closed Wave 48B route smoke passed 1134 checks across 18 routes with zero failures; Wave 48D will refresh smoke/release evidence for the completed Wave 48C behavior.

## Current Delivery

Iteration 47 is complete; its final implementation and evidence are recorded in `docs/lottery/iterations/iteration-47-plan.md` and the checked Iteration 47 section in `docs/lottery/iterations/checklist.md`.

The last fully closed iteration is [Iteration 47: MiniGPT Lottery Research Loop V1](iterations/iteration-47-plan.md). Its implementation covers strategy samples, versioned manifests, deterministic time-based train/validation splits, full-sample context validation, fixed evaluation, traceable candidate batches, typed downstream provenance, deterministic same-window/same-budget random baselines, explicit historical-replay warnings, draft-only ticket-pack handoff, actual-result/ledger attribution, manual lifecycle review, month-end review, and existing CSV release/export evidence:

```text
versioned corpus -> time-based train/validation split -> candidate generation and repair -> random-baseline backtest -> decision/ticket/result review -> month-end and release evidence
```

Final Iteration 47 verification passed backend service 96/96, backend web 43/43, i18n 1039, lottery smoke 1065/1065 across 18 routes, fresh release evidence, and the production TypeScript/Vite build. Rendered QA verified the reviewed chain against a newer unreviewed distractor and 25 later reports, followed the exact backtest deep link, checked the English V47 release preset, and passed a 390x844 no-overflow check with no console warnings. The staged scope contains only the 17 Iteration 47D implementation, test, evidence, localization, and documentation files. Continue to gate conclusions on legal-number parse rate, candidate diversity, typed provenance, comparable historical windows, and random-baseline deltas rather than training loss alone.

The sole promoted next candidate is [Iteration 48: MiniGPT Temporal Boundary And Out-Of-Sample Observation V1](iterations/iteration-48-plan.md). Verified Wave 48A reuses existing decision outcomes, decision sets, and typed provenance in the MiniGPT decision-provenance panel on `/lottery/predictions/decision`; it adds no API, collection, route, export type, or write action. Its fixed states are `TRAIN_WINDOW`, `VALIDATION_WINDOW`, `POST_CORPUS_PENDING`, `POST_CORPUS_OBSERVED`, and `UNKNOWN`. Only `POST_CORPUS_OBSERVED` may be called an out-of-sample observation, but it uses a non-success research color and is not a performance PASS or future guarantee; `UNKNOWN` is never PASS. Final Wave 48A verification passed 13 focused classifier cases, i18n audit 1046, lottery smoke 1091/1091 across 18 routes, the production release check, and rendered Chinese/English desktop plus 390px light/dark QA without horizontal overflow or console warnings.

Completed Wave 48B stays on that page and adds no backend endpoint, DTO, collection, navigation, export type, or mutation. It composes the latest bounded 100-row include-archived outcome snapshot; uses decision-page `total`/`hasNext` only to disclose completeness; groups stable corpus/run/hash/range lineage while preserving each decision; isolates incomplete provenance; separates observed decisions, distinct issues, scored candidates, and fully settled financial coverage; and resolves random-baseline evidence through exact reviewed backtest detail only. Comparable deltas remain per decision and cannot change the temporal state. Final verification passed file-scoped ESLint, i18n 1088, smoke/release 1134/1134 across 18 routes, TypeScript, and the production build. Isolated rendered QA covered all five states, comparable/failed/owner-mismatched/unstable baseline evidence, a 100/103 truncation control, Chinese/English desktop plus English 390px light/dark layouts, zero horizontal overflow, no new console errors after backend readiness, and GET-only outcome/page/exact-detail traffic; all fixtures and temporary runtimes were removed.

Completed Wave 48C carries that fixed meaning into `/lottery/month-end` and the existing CSV evidence chain. Month-end uses an independent bounded-100 include-archived snapshot, preserves separate decision/issue/candidate/settled-financial/baseline coverage, shows truncation and safety warnings, and stays outside the score and lifecycle state. `decision-outcomes` uses an export-internal Java classifier mirror, decision-level rather than candidate-level boundary ownership, fixed snapshot metadata that must not be summed across flattened candidate rows, and exact-owned reviewed-baseline gates with no latest-report fallback. No new export domain, route, DTO, collection, or business-data write was added. Focused `LotteryExportServiceTest` coverage passed 12/12, file-scoped ESLint passed, and i18n audit passed 1090 calls. Wave 48D smoke/release, production build, rendered browser QA, staged-scope audit, commit, and push is next.

For protected browser QA, use [Quality gates](iterations/quality-gates.md). Start the frontend with `npm run dev:qa` for frontend-only visual checks without a login session; this explicit Vite QA mode bypasses only the loopback-hosted local route guard and is disabled in production builds. A running backend is still required for data-backed interactions. `ECONNREFUSED` on `/lottery/records/draws?page=0&size=500` is a backend/proxy blocker, not a page-layout failure.

The latest generated frontend release evidence is written to `one-web/reports/lottery-release-evidence.md`. Historical snapshots are indexed in `one-web/reports/lottery-release-history/README.md`. Run `npm run lottery:release-check` from `one-web` before frontend lottery release handoff; use `npm run lottery:release-evidence` only when you need to refresh the report without a production build, and `npm run lottery:release-evidence:check` when you only need to verify freshness. Run `npm run lottery:release-archive` when the passed evidence should be kept as a historical snapshot.

## Long Iteration

Iteration 10 is the longer platform roadmap after the workbench foundation. It should be delivered in waves:

```text
daily state backbone -> strategy experiments -> backtest evidence -> alerts/calendar -> budget governance -> export/audit/maintenance
```

Iteration 10 completed the platform foundation, and later frontend/usability waves are tracked in `docs/lottery/iterations/checklist.md`. Iterations 1-47 and the Iteration 47 verified delivery handoff are complete; Iteration 48 is the only promoted candidate, with Waves 48A-48C complete and Wave 48D release/handoff next.

## Non-Negotiable Rules

- Frontend calls project-owned APIs only; do not call third-party lottery data providers directly from the browser.
- Provider-specific scraping, request format, charset, parsing, and retry behavior must stay behind backend provider/service implementations.
- MongoDB is the durable store for lottery domain data that must survive restarts.
- Redis is for derived statistics, training status, latest prediction snapshots, locks, and short-lived operational state.
- Prediction and analysis features must be framed as research/statistical assistance, not guaranteed winning advice.
- Shared lottery record parsing rules should live in reusable backend utilities or frontend utilities, not duplicated across pages.
- API/cache time fields should use millisecond timestamps when adding new contracts.

## Delivery Rule

After each completed milestone:

```text
Update the relevant iteration doc.
Update the relevant module doc when key logic changes.
Update docs/lottery/iterations/checklist.md.
Run the appropriate verification.
Review git status and diff.
Commit and push.
```
