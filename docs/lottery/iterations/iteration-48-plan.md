# Iteration 48: MiniGPT Temporal Boundary And Out-Of-Sample Observation V1

Theme: MiniGPT 时间边界与样本外观察 V1

## Version Goal

Make the temporal position of each MiniGPT decision explicit before interpreting any result. The first wave adds a frontend-only, read-only boundary classification over the existing decision outcomes, decision sets, backtests, and typed research provenance. Later waves can aggregate genuinely post-corpus observations and carry them into month-end and CSV evidence without turning historical observations into prediction claims.

Status: promoted as the only next candidate on 2026-07-12. Wave 48A is implemented and verified; Waves 48B-48D remain planned.

## Starting Point

- Iteration 47 is complete through reproducible time-split corpora, training/generation provenance, deterministic same-window/same-budget random baselines, decision/ticket/result review, month-end evidence, release verification, commit, and push.
- `LotteryResearchProvenance` already carries `trainFirstIssue`, `trainLatestIssue`, `validationFirstIssue`, and `validationLatestIssue` through generations, decision sets, backtests, and outcomes.
- Existing project-owned APIs already expose decision outcomes, decision sets, paged backtests, and exact backtest detail lookup.
- Wave 48A closes the first missing interpretation layer by visibly classifying whether a target issue belongs to the training window, validation window, a not-yet-observed post-corpus period, an observed post-corpus period, or an unknown boundary.

## Scope Principles

- Classify an issue by immutable corpus boundaries and attached outcome state, never by whether the result looks favorable.
- Keep the first slice frontend-only and read-only. Reuse existing outcomes, decision-set, and backtest contracts; add no API, collection, route, export type, or write action in Wave 48A.
- Resolve evidence only inside the same decision chain. A newer or unrelated backtest must never supply missing boundaries or replace a reviewed report.
- Only `POST_CORPUS_OBSERVED` may be called an out-of-sample observation. It is an observation category, not a performance PASS, proof of generalization, or future-performance signal.
- `UNKNOWN` is an explicit safety state and must never receive PASS text, color, sorting priority, or fallback semantics.
- Preserve manual review and execution boundaries. Classification must not promote, pause, retire, approve, create, or save anything.
- Keep checklist items unchecked until implementation and matching static/rendered verification are complete.

## Wave 48A: Read-Only Temporal Boundary Classification

Goal: make the exact temporal relationship between a MiniGPT decision target and its corpus visible in the existing MiniGPT decision-provenance panel on `/lottery/predictions/decision`.

- Reuse the existing decision-outcome, decision-set, and backtest reads in the MiniGPT decision-provenance panel on `/lottery/predictions/decision`; do not add a new page or navigation item.
- Resolve target issue, decision ownership, review binding, corpus/run identity, and train/validation boundaries from the same provenance-backed chain.
- Apply one fixed five-state vocabulary:

| State | Meaning | Safety interpretation |
| --- | --- | --- |
| `TRAIN_WINDOW` | The target issue is inside the recorded training range. | Training-window evidence; never out-of-sample. |
| `VALIDATION_WINDOW` | The target issue is inside the recorded validation range. | Held-out validation-window evidence; still part of the frozen corpus and not a post-corpus observation. |
| `POST_CORPUS_PENDING` | The target issue is later than the recorded validation/corpus boundary, but no actual outcome has been observed yet. | Awaiting observation; no performance conclusion. |
| `POST_CORPUS_OBSERVED` | The target issue is later than the recorded validation/corpus boundary and an actual result is attached. | The only state that may be labelled out-of-sample observation; still not a PASS or future guarantee. |
| `UNKNOWN` | Required issue, boundary, ordering, or ownership evidence is missing or inconsistent. | Unknown boundary; never PASS and never silently coerced into another state. |

- Treat range membership as inclusive. A target outside the declared training and validation ranges, but not strictly later than the validation/corpus end, remains `UNKNOWN` rather than being guessed into a window.
- Treat a post-corpus result as observed only when existing outcome evidence marks the target/candidate result as settled (`WON` or `MISSED`) or otherwise exposes an attached scored actual result. Pending or unscored evidence remains `POST_CORPUS_PENDING`.
- If an exact reviewed backtest is needed, require both `report.id == reviewBacktestId` and `report.decisionSetId == decisionSetId`. Do not borrow the latest report, another decision's provenance, or a same-looking generation batch.
- Display the state beside target issue, training range, validation range, corpus/run identity, decision id, reviewed backtest id when present, and the reason for `UNKNOWN` or pending state.
- Use restrained bilingual copy and neutral/read-only styling. `POST_CORPUS_OBSERVED` must use a non-success research color, no state receives an execution CTA, and the observed state must explicitly say that one or more observations do not establish stable performance.

Acceptance:

- All five states are deterministic for the same existing API snapshot and have focused frontend coverage, including missing/malformed boundaries, issue-width mismatches, range gaps, pending outcomes, observed outcomes, and exact-decision outcome matching.
- Only a settled target strictly after `validationLatestIssue` can render `POST_CORPUS_OBSERVED` and the out-of-sample-observation label.
- `TRAIN_WINDOW`, `VALIDATION_WINDOW`, `POST_CORPUS_PENDING`, and `UNKNOWN` never use out-of-sample wording; `UNKNOWN` never looks or reads like PASS.
- Network inspection shows no new endpoint and no mutation caused by the boundary panel.
- Chinese/English desktop and 390px responsive QA show the same state meaning without horizontal overflow or console errors attributable to the change.

## Wave 48B: Post-Corpus Outcome Aggregation

Goal: summarize genuine post-corpus observations without mixing them with training, validation, pending, or unknown rows.

- Aggregate only rows classified as `POST_CORPUS_OBSERVED`; report `POST_CORPUS_PENDING` and `UNKNOWN` counts separately from the observed denominator.
- Group observations by stable corpus/run/decision provenance and preserve exact decision/backtest ownership.
- Show observation count, issue range, red-hit distribution, blue-hit rate, prize distribution, cost, prize, net result, ROI, and comparable random-baseline deltas only where the existing evidence supports them.
- Keep small-sample and comparability warnings visible. No favorable delta may upgrade the temporal state or imply generalization.
- Prefer the existing bounded outcome/backtest contracts; add a narrow backend aggregation only if frontend composition cannot remain complete, deterministic, and bounded.

## Wave 48C: Month-End And CSV Evidence

Goal: carry the temporal boundary and observed-only denominator into existing review and archive paths.

- Add the five-state counts and observed-only aggregate to the existing month-end MiniGPT research section.
- Extend the existing decision-set, backtest, or decision-outcome CSV contracts only where needed; do not create a parallel MiniGPT export domain.
- Export the boundary source fields, classifier state, observation denominator, pending/unknown counts, and safety warning so spreadsheet review cannot confuse validation-window rows with post-corpus observations.
- Keep exact reviewed-backtest binding, CSV formula-injection protection, historical-research language, and no-auto-action semantics from Iteration 47.

## Wave 48D: Release And Handoff

Goal: verify the temporal-boundary semantics and close the release without widening product claims.

- Align the README, long-term plan, checklist, menu/version plan, technical design, selection/training strategy, and quality gates with the implemented behavior.
- Add smoke/release evidence for all five states, exact-chain ownership, observed-only aggregation, month-end/CSV propagation, `UNKNOWN` non-PASS rendering, and no mutation/new-route regressions.
- Run focused frontend/backend tests as applicable, i18n audit, lottery smoke/release check, file-scoped ESLint, TypeScript/production build, and rendered Chinese/English desktop/mobile QA.
- Review generated evidence, `git status --short`, staged scope, and `git diff --check` before commit and push.

## Out Of Scope

- Calling validation-window data out-of-sample.
- Treating `POST_CORPUS_OBSERVED` as proof that a model beats random selection or predicts future draws.
- Automatic recommendation transitions, ticket-pack approval, ticket creation, purchase, or unattended betting.
- Re-training, walk-forward evaluation, corpus mutation, or retroactively moving an issue between frozen corpus windows.
- A new Wave 48A API, MongoDB collection, route, menu item, or export type.

## Completion Evidence

- Wave 48A's pure classifier passed 13 focused runtime cases covering inclusive train/validation boundaries, pending and observed post-corpus states, missing exact-outcome ownership, before-window/gap evidence, malformed boundaries, invalid ordering, issue-width mismatch, and non-success observed-state styling.
- Frontend verification passed file-scoped ESLint, i18n audit with 1046 localized calls, lottery smoke with 1091/1091 checks across 18 routes, fresh release evidence, TypeScript, and the production Vite build. The build retains only the existing large-chunk advisory.
- Rendered QA used five isolated decision fixtures and one scored snapshot to verify every state, exact `decisionSetId` outcome ownership, purple non-success observed styling, Chinese/English copy, 1280px and 390px layouts, light/dark theme contrast, no horizontal overflow, and no console warnings. All six fixtures, temporary servers, tabs, and viewport overrides were removed afterward.
- Waves 48B-48D remain open. Add their implementation, verification, staged-scope, commit, and push evidence only after each wave is genuinely complete.
