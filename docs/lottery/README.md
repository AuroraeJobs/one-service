# Lottery Documentation Index

Last updated: 2026-07-04

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
- [Quality gates](iterations/quality-gates.md): verification rules for backend, frontend, and data behavior.
- [Frontend one-month plan](iterations/frontend-one-month-version-plan.md): next month frontend-led experience and power-tool plan.

## Module Docs

- [Technical design overview](modules/technical-design.md)

## Current Baseline

Live capabilities already present in the codebase:

- Historical record access and update through `record/*` APIs.
- Lottery records namespace through `lottery/records/*`, currently reusing the existing record service for compatibility.
- Lottery overview with recent draws, yearly counts, frequency cards, and AI panel.
- Prediction page backed by `lottery/training/*` APIs.
- Rule training, latest prediction, and latest actual record stored through Redis-backed service state.
- Durable prediction history, prediction detail, personal tickets, latest prize checking, and ticket linkbacks.
- Ledger pages for cost, prize, net result, ROI, issue-level outcomes, monthly outcomes, and source/rule performance.
- Operations pages for sync summary, provider probe history, settings, and data quality repair.
- Astronaut naming, voyage records, and voyage counts through `lottery/astronauts/*`.
- Statistics and analysis routes including frequency, group, distribution, pixel views, Taiji, space, and hexagram pages.

## Next Iteration

Iteration 26 should start from `docs/lottery/iterations/iteration-26-plan.md` and `docs/lottery/iterations/checklist.md`. The planned release-history flow is:

```text
run release archive -> review latest report and history index -> attach browser screenshots when login/backend are available
```

For protected browser QA, use [Quality gates](iterations/quality-gates.md). A valid `aurorae_auth` login session and running backend are required before screenshots are meaningful; `ECONNREFUSED` on `/lottery/records/draws?page=0&size=500` is a backend/proxy blocker, not a page-layout failure.

The latest generated frontend release evidence is written to `one-web/reports/lottery-release-evidence.md`. Run `npm run lottery:release-check` from `one-web` before frontend lottery release handoff; use `npm run lottery:release-evidence` only when you need to refresh the report without a production build, and `npm run lottery:release-evidence:check` when you only need to verify freshness. Run `npm run lottery:release-archive` when the passed evidence should be kept as a historical snapshot.

## Long Iteration

Iteration 10 is the longer platform roadmap after the workbench foundation. It should be delivered in waves:

```text
daily state backbone -> strategy experiments -> backtest evidence -> alerts/calendar -> budget governance -> export/audit/maintenance
```

Iteration 10 completed the platform foundation, and later frontend/usability waves are tracked in `docs/lottery/iterations/checklist.md`. Iteration 26 focuses on release history and evidence archive snapshots.

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
