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
- [Iteration 47 plan](iterations/iteration-47-plan.md): MiniGPT lottery research loop; Wave 47A reproducible corpus and time-split baseline is complete, with Wave 47B next.
- [Quality gates](iterations/quality-gates.md): verification rules for backend, frontend, and data behavior.
- [Frontend one-month plan](iterations/frontend-one-month-version-plan.md): next month frontend-led experience and power-tool plan.

## Module Docs

- [Technical design overview](modules/technical-design.md)
- [Selection strategy and model training direction](modules/selection-training-strategy.md): use lottery draw records as MiniGPT/model training material for compliant candidate generation, strategy filtering, and backtest planning.

## Current Baseline

Live capabilities already present in the codebase:

- Iterations 1-46 are complete; the latest completed slice closes sync-operations UX, backend deletion safety, MongoDB-backed log pagination, default-overview navigation semantics, and current release evidence.
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
- The current route smoke and release evidence pass 808 checks across 18 routes with zero failures.

## Next Iteration

Iteration 46 is complete; its final implementation and evidence are recorded in `docs/lottery/iterations/iteration-46-plan.md` and the checked Iteration 46 section in `docs/lottery/iterations/checklist.md`.

The next promoted slice is [Iteration 47: MiniGPT Lottery Research Loop V1](iterations/iteration-47-plan.md). Wave 47A is complete: strategy samples, versioned manifests, deterministic time-based train/validation splits, compatibility paths, atomic artifact publication, and visible provenance now form the stable input boundary. Wave 47B is next and will add training/generation provenance without reopening that boundary:

```text
versioned corpus -> time-based train/validation split -> candidate generation and repair -> random-baseline backtest -> decision/ticket/result review
```

Gate progress on legal-number parse rate, candidate diversity, reproducible provenance, time-window backtests, and comparison with a random baseline rather than training loss alone.

For protected browser QA, use [Quality gates](iterations/quality-gates.md). Start the frontend with `npm run dev:qa` for frontend-only visual checks without a login session; this explicit Vite QA mode bypasses only the loopback-hosted local route guard and is disabled in production builds. A running backend is still required for data-backed interactions. `ECONNREFUSED` on `/lottery/records/draws?page=0&size=500` is a backend/proxy blocker, not a page-layout failure.

The latest generated frontend release evidence is written to `one-web/reports/lottery-release-evidence.md`. Historical snapshots are indexed in `one-web/reports/lottery-release-history/README.md`. Run `npm run lottery:release-check` from `one-web` before frontend lottery release handoff; use `npm run lottery:release-evidence` only when you need to refresh the report without a production build, and `npm run lottery:release-evidence:check` when you only need to verify freshness. Run `npm run lottery:release-archive` when the passed evidence should be kept as a historical snapshot.

## Long Iteration

Iteration 10 is the longer platform roadmap after the workbench foundation. It should be delivered in waves:

```text
daily state backbone -> strategy experiments -> backtest evidence -> alerts/calendar -> budget governance -> export/audit/maintenance
```

Iteration 10 completed the platform foundation, and later frontend/usability waves are tracked in `docs/lottery/iterations/checklist.md`. Iterations 1-46 are complete; Iteration 47 is the next promoted MiniGPT lottery research-loop slice.

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
