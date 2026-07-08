# Lottery Iteration 28 Plan: Strategy Outcome Attribution 2.0

Last updated: 2026-07-07

## Goal

Make `/lottery/outcomes` a closed-loop attribution hub that explains how portfolios, simulator proposals, ticket packs, saved decisions, and recommendation trails connect to real issue outcomes.

## Wave 28A: Attribution Handoff Map

- Add a compact attribution handoff map for portfolio, ticket pack, simulator, saved-decision, and recommendation follow-up paths.
- Derive evidence quality labels from the existing outcome attribution DTO instead of adding a new backend contract.
- Add a source/rule/recommendation trend surface for the selected issue.
- Localize exposed state codes in the outcome page.
- Keep dark-mode and mobile layout covered by shared lottery CSS.
- Extend route smoke source checks for the new handoff and trend labels.

## Wave 28B: Aggregated Attribution Rollups

- Add backend rollups by issue, portfolio, rule, source, recommendation lifecycle, simulator risk, and ticket-pack execution state. Shipped as `GET /lottery/outcomes/rollup`.
- Add result windows for latest issue, recent 10 issues, month-to-date, and all tracked outcomes. Backend accepts `latest`, `recent10`, `month-to-date`, and `all`.
- Keep rollups bounded and paged where historical rows can grow.
- Add frontend consumption after the shared API client can be edited without mixing unrelated local changes.

## Wave 28C: Review And Export Connections

- Connect attribution quality summaries into governance and month-end review surfaces.
- Add export preset metadata for attribution closure packages.
- Record stale or missing attribution links as release evidence warnings.

## Verification

- `one-web npm run lottery:smoke`
- `one-web npm exec eslint -- src/components/LotteryOutcomeAttributionPage.tsx`
- `git diff --check`
