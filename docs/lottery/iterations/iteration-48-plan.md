# Iteration 48: MiniGPT Temporal Boundary And Out-Of-Sample Observation V1

Theme: MiniGPT 时间边界与样本外观察 V1

## Version Goal

Make the temporal position of each MiniGPT decision explicit before interpreting any result. Wave 48A adds a frontend-only, read-only boundary classification over the existing decision outcomes, decision sets, backtests, and typed research provenance. Wave 48B composes a bounded observed-only aggregate over those same contracts. Wave 48C carries the same fixed boundary and denominators into month-end review and the existing CSV evidence chain without turning historical observations into prediction claims.

Status: complete on 2026-07-12. Waves 48A-48D, release evidence, rendered browser QA, staged-scope audit, implementation commit, and push are closed. No next candidate is currently promoted.

## Starting Point

- Iteration 47 is complete through reproducible time-split corpora, training/generation provenance, deterministic same-window/same-budget random baselines, decision/ticket/result review, month-end evidence, release verification, commit, and push.
- `LotteryResearchProvenance` already carries `trainFirstIssue`, `trainLatestIssue`, `validationFirstIssue`, and `validationLatestIssue` through generations, decision sets, backtests, and outcomes.
- Existing project-owned APIs already expose decision outcomes, decision sets, paged backtests, and exact backtest detail lookup.
- Wave 48A closes the first missing interpretation layer by visibly classifying whether a target issue belongs to the training window, validation window, a not-yet-observed post-corpus period, an observed post-corpus period, or an unknown boundary.

## Scope Principles

- Classify an issue by immutable corpus boundaries and attached outcome state, never by whether the result looks favorable.
- Keep Waves 48A-48B frontend-only and read-only. Reuse existing outcomes, decision-set, and exact backtest-detail contracts; add no API, DTO, collection, route, export type, or write action.
- Keep Wave 48C inside the existing month-end route and `decision-outcomes` CSV implementation. Its Java classifier is an export-internal deterministic mirror, not a public aggregate API or a second MiniGPT export domain.
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

- The page reads at most the latest 100 decision outcomes with `includeArchived=true` and reads the first 100 decision-set rows with `includeArchived=true`. Outcome rows are the aggregation source; decision-page `total` and `hasNext` are completeness metadata that expose when older decisions are outside the bounded snapshot.
- The five states remain separate counters. Only rows classified as `POST_CORPUS_OBSERVED` enter the observed decision denominator; training, validation, pending, and unknown rows remain outside it. Non-MiniGPT rows are also excluded and reported separately.
- Stable grouping requires `corpusVersion`, `runId`, train/validation/checkpoint hashes, train/validation issue ranges, and decision ownership. The panel retains every decision row inside its lineage group. An observed row with incomplete stable provenance is isolated in its own group and its baseline remains `UNKNOWN`.
- Denominators stay explicit and independent: observed decisions, distinct observed issues, scored candidates, and decisions with fully settled financial evidence. Financial totals and ROI include only decisions with converted tickets, all converted tickets checked, and finite cost/prize values.
- Hit and prize distributions, winning candidates, blue-hit count/rate, issue range, and settled financial totals come only from observed rows. The UI warns when the bounded snapshot is truncated, fewer than three distinct issues are observed, one issue has multiple decisions, stable provenance is missing, or financial coverage is incomplete.
- For each stable observed decision with `reviewBacktestId`, the page performs `GET /lottery/backtests/{id}` and accepts the random baseline only when report id, decision owner, stable provenance, `sameWindow === true`, `sameBudget === true`, equal model/baseline ticket counts, required metadata/deltas, and `STATIC_POOL_HISTORICAL_REPLAY` all match. Missing or failed evidence stays `UNKNOWN` or `FAIL` with a reason.
- Comparable deltas are displayed on the owning decision row. They are never averaged across reports or promoted into an aggregate performance claim. A favorable value cannot upgrade `POST_CORPUS_OBSERVED`, imply generalization, or trigger any action.
- The implementation uses only the existing outcome, decision-set page, and exact backtest-detail reads. It adds no backend aggregate, DTO field, route, collection, export type, or mutation.

Acceptance:

- The bounded scope visibly shows loaded/total rows and a truncation warning when `hasNext` or the reported total exceeds the loaded outcome count.
- Only observed post-corpus decisions contribute to the observation metrics; each other temporal state remains a separate count outside the denominator.
- Stable lineage grouping, isolated incomplete lineage, distinct-issue/sample warnings, financial coverage, and exact per-decision baseline ownership are visible in Chinese and English.
- Baseline comparison is `COMPARABLE` only for a complete exact report; ownership, lineage, window, budget, ticket-count, metadata, delta, or evaluation-mode gaps remain `FAIL`/`UNKNOWN` and never borrow another report.
- The panel remains read-only and adds no endpoint or mutation.

## Wave 48C: Month-End And CSV Evidence

Goal: carry the temporal boundary and observed-only denominator into existing review and archive paths.

- The existing MiniGPT month-end section now adds an independent latest-100 `includeArchived=true` outcome snapshot plus the matching 100-row decision page for total/truncation metadata. It keeps the legacy 12-row month-end summary separate, reuses the Wave 48B aggregator, and requests each stable observed decision's exact reviewed-backtest detail without allowing a failed optional read to replace evidence from another chain.
- Month-end shows all five state counts, non-MiniGPT exclusions, loaded/total scope, observed decisions, distinct issues, scored candidates, fully settled financial coverage, exact comparable-baseline coverage, and the same truncation, small-sample, duplicate-issue, lineage, financial, ownership, comparability, and `UNKNOWN` warnings. The panel is read-only and does not feed the month-end score or lifecycle actions.
- The existing `decision-outcomes` CSV now owns an export-internal Java mirror of `MINIGPT_TEMPORAL_BOUNDARY_V1`. Its boundary uses decision-level provenance, target issue, exact decision ownership, and decision-level scored outcome evidence; candidate provenance and candidate `resultState` do not redefine the decision boundary.
- CSV observation metadata always describes the fixed `LATEST_100_DECISIONS_INCLUDE_ARCHIVED` snapshot. Detail filters and the export row limit still control flattened candidate rows only; they do not change the snapshot. Five state counts, observed-decision, distinct-issue, scored-candidate, and settled-financial denominators repeat on every candidate row with `REPEATED_SNAPSHOT_METADATA_DO_NOT_SUM`, so repeated candidate rows must never be summed as independent decisions.
- `decision-sets`, `backtests`, and `decision-outcomes` remain the same existing evidence package and export types. Wave 48C adds the temporal mirror only where candidate-row ambiguity exists, in `decision-outcomes`; it adds no route, DTO, collection, synthetic summary row, or parallel MiniGPT export domain.
- Reviewed evidence requires the exact `reviewBacktestId` and owning `decisionSetId`. Comparable fields additionally require stable matching provenance, `sameWindow === true`, `sameBudget === true`, equal ticket counts, complete baseline metadata and all five deltas, and `STATIC_POOL_HISTORICAL_REPLAY`. Unbound, unavailable, wrong-owner, or otherwise incomplete evidence remains `UNKNOWN`; trusted comparable deltas stay blank rather than borrowing a latest report.
- All added columns continue through the shared CSV serializer and its formula-injection protection. Every repeated row carries historical-only, no-walk-forward, do-not-sum, and no-automatic-approval/ticket-creation safety semantics.

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
- A new Wave 48A/48B API, DTO, MongoDB collection, route, menu item, export type, or mutation; or a Wave 48C public aggregate API, collection, synthetic CSV summary row, parallel export domain, or business-data write.

## Completion Evidence

- Wave 48A's pure classifier passed 13 focused runtime cases covering inclusive train/validation boundaries, pending and observed post-corpus states, missing exact-outcome ownership, before-window/gap evidence, malformed boundaries, invalid ordering, issue-width mismatch, and non-success observed-state styling.
- Wave 48A frontend verification passed file-scoped ESLint, i18n audit with 1046 localized calls, lottery smoke with 1091/1091 checks across 18 routes, fresh release evidence, TypeScript, and the production Vite build. The build retains only the existing large-chunk advisory.
- Rendered QA used five isolated decision fixtures and one scored snapshot to verify every state, exact `decisionSetId` outcome ownership, purple non-success observed styling, Chinese/English copy, 1280px and 390px layouts, light/dark theme contrast, no horizontal overflow, and no console warnings. All six fixtures, temporary servers, tabs, and viewport overrides were removed afterward.
- Wave 48B implements the bounded 100-row, include-archived observed-only composition; separate decision/issue/candidate/settled-financial denominators; stable lineage grouping with isolation; and exact per-decision reviewed-baseline comparison without a backend contract change.
- Final Wave 48B automation passed file-scoped ESLint, i18n audit with 1088 localized calls, lottery smoke/release evidence with 1134/1134 checks across 18 routes, TypeScript, and the production Vite build. The build retains only the existing large-chunk advisory.
- Isolated rendered QA used eight MiniGPT decision fixtures to verify five-state counts `1/1/1/4/1`, observed denominator 4, two distinct issues, four scored candidates, fully settled financial coverage 1/4, and baseline coverage `COMPARABLE 1 / FAIL 1 / UNKNOWN 2`, including wrong-owner and incomplete-lineage controls. Ninety-five older non-MiniGPT controls then verified the visible 100/103 truncation boundary without changing the observed denominator.
- Chinese/English 1280px checks plus English 390px light/dark checks showed the same semantics, no residual Chinese in the English panel, no document or panel horizontal overflow, and no new console errors after backend readiness. Spring access logs showed only GET reads for bounded outcomes, decision-page completeness, and exact reviewed backtest details. All 103 decision controls, eight snapshots, three backtests, one ticket, temporary servers, tabs, and viewport overrides were removed.
- Wave 48C adds the independent bounded-100 include-archived month-end aggregate without changing the legacy month-end score or lifecycle state. It also extends the existing `decision-outcomes` CSV with decision-level boundary source/state/reason, fixed snapshot scope/counts/denominators, exact reviewed ownership/comparability, explicit repeated-metadata semantics, and historical-only/no-auto-action safety copy. No new export type, route, DTO, collection, or write action was added.
- Focused Wave 48C `LotteryExportServiceTest` coverage passed 12/12, including five-state decision counts that are not multiplied by multiple candidate rows, fixed snapshot metadata independent of detail row limits, 100/103 truncation, exact-owned comparable evidence, wrong-owner/unbound `UNKNOWN`, blank trusted deltas, and the shared safety notice. File-scoped ESLint passed and the i18n audit passed 1090 localized calls.
- Wave 48D final automation passes focused Maven 12/12, file-scoped ESLint, the 1090-call i18n audit, smoke/release evidence 1326/1326 across 18 routes, evidence freshness, TypeScript, and the production build. Dedicated guards cover the five states, observed-only denominators, exact-chain handoff, `UNKNOWN` non-PASS semantics, CSV assertions, localization, quality gates, and no parallel route/navigation surface.
- Rendered Chinese/English, light/dark, 1280px/390px QA confirms `1/1/1/4/1`, observed denominator 4, 100/103 truncation, independent financial/baseline coverage, active `v47-minigpt-research` preset, and no document/panel horizontal overflow. A real CSV confirms the same fixed snapshot and exact-owner fields; its GET retains the pre-existing export audit write and adds no business-data mutation. All tagged fixtures, temporary runtimes, browser tabs, and viewport overrides are removed. The 16-file implementation commit `b0c3e3ee` is pushed, the final release-only scope excludes local MiniGPT runtime data, and no next candidate is currently promoted.
