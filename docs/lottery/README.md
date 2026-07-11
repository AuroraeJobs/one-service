# Lottery Documentation Index

Last updated: 2026-07-11

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
- [Iteration 47 plan](iterations/iteration-47-plan.md): MiniGPT lottery research loop from reproducible corpus through deterministic random-baseline, outcome review, month-end evidence, and release/export handoff; the final release/browser delivery step remains open.
- [Quality gates](iterations/quality-gates.md): verification rules for backend, frontend, and data behavior.
- [Frontend one-month plan](iterations/frontend-one-month-version-plan.md): next month frontend-led experience and power-tool plan.

## Module Docs

- [Technical design overview](modules/technical-design.md)
- [Selection strategy and model training direction](modules/selection-training-strategy.md): use lottery draw records as MiniGPT/model training material for compliant candidate generation, strategy filtering, and backtest planning.

## Current Baseline

Live capabilities already present in the codebase:

- Iterations 1-47 are complete; Iteration 47 carries the MiniGPT research chain through month-end review, release/export evidence, production release checks, and rendered browser verification.
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
- MiniGPT month-end review composes the most recent reviewed MiniGPT outcome, a backtest matching both `reviewBacktestId` and `decisionSetId`, only ticket packs owned through the same `decisionSetId`/`sourceId`, and ledger evidence without adding a second reporting contract. Unknown comparison state is never presented as PASS; existing decision-set, backtest, and outcome CSV exports carry the same research provenance and model/random deltas.
- The current route smoke passes 1065 checks across 18 routes with zero failures.

## Current Delivery

Iteration 47 is complete; its final implementation and evidence are recorded in `docs/lottery/iterations/iteration-47-plan.md` and the checked Iteration 47 section in `docs/lottery/iterations/checklist.md`.

The latest completed slice is [Iteration 47: MiniGPT Lottery Research Loop V1](iterations/iteration-47-plan.md). Its implementation covers strategy samples, versioned manifests, deterministic time-based train/validation splits, full-sample context validation, fixed evaluation, traceable candidate batches, typed downstream provenance, deterministic same-window/same-budget random baselines, explicit historical-replay warnings, draft-only ticket-pack handoff, actual-result/ledger attribution, manual lifecycle review, month-end review, and existing CSV release/export evidence:

```text
versioned corpus -> time-based train/validation split -> candidate generation and repair -> random-baseline backtest -> decision/ticket/result review -> month-end and release evidence
```

Final Iteration 47 verification passed backend service 96/96, backend web 43/43, i18n 1039, lottery smoke 1065/1065 across 18 routes, fresh release evidence, and the production TypeScript/Vite build. Rendered QA verified the reviewed chain against a newer unreviewed distractor and 25 later reports, followed the exact backtest deep link, checked the English V47 release preset, and passed a 390x844 no-overflow check with no console warnings. The staged scope contains only the 17 Iteration 47D implementation, test, evidence, localization, and documentation files. Continue to gate conclusions on legal-number parse rate, candidate diversity, typed provenance, comparable historical windows, and random-baseline deltas rather than training loss alone.

No next iteration is promoted yet. Select the next candidate at the next planning review.

For protected browser QA, use [Quality gates](iterations/quality-gates.md). Start the frontend with `npm run dev:qa` for frontend-only visual checks without a login session; this explicit Vite QA mode bypasses only the loopback-hosted local route guard and is disabled in production builds. A running backend is still required for data-backed interactions. `ECONNREFUSED` on `/lottery/records/draws?page=0&size=500` is a backend/proxy blocker, not a page-layout failure.

The latest generated frontend release evidence is written to `one-web/reports/lottery-release-evidence.md`. Historical snapshots are indexed in `one-web/reports/lottery-release-history/README.md`. Run `npm run lottery:release-check` from `one-web` before frontend lottery release handoff; use `npm run lottery:release-evidence` only when you need to refresh the report without a production build, and `npm run lottery:release-evidence:check` when you only need to verify freshness. Run `npm run lottery:release-archive` when the passed evidence should be kept as a historical snapshot.

## Long Iteration

Iteration 10 is the longer platform roadmap after the workbench foundation. It should be delivered in waves:

```text
daily state backbone -> strategy experiments -> backtest evidence -> alerts/calendar -> budget governance -> export/audit/maintenance
```

Iteration 10 completed the platform foundation, and later frontend/usability waves are tracked in `docs/lottery/iterations/checklist.md`. Iterations 1-46 are complete; Iteration 47 has reached its month-end and release-evidence implementation boundary, with the final verified delivery handoff still open.

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
