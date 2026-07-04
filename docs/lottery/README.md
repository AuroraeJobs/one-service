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
- [Checklist](iterations/checklist.md): durable task board.
- [Quality gates](iterations/quality-gates.md): verification rules for backend, frontend, and data behavior.

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

Iteration 09 should start from `docs/lottery/iterations/checklist.md` and implement the daily workflow workbench plus scalable list governance. The planned flow is:

```text
sync records -> inspect latest draw -> generate or attach prediction -> save tickets -> check prizes -> review ledger outcome
```

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
