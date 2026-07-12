# Lottery Quality Gates

Last updated: 2026-07-12

Use these gates when finishing a lottery milestone.

## Backend

- Changed services have focused unit tests.
- Changed controllers have controller tests or a documented manual verification path.
- Sync operations are idempotent for duplicate issue data.
- Provider failures return controlled status/messages instead of leaking low-level exceptions.
- Long-running training has visible status and does not start duplicate jobs.
- List endpoints that can grow support pagination or have a documented limit.
- Daily workflow actions return step-level status and do not hide long-running prediction training behind aggregate endpoints.
- Strategy experiments and backtests persist enough input, parameters, and result evidence to be revisited later.
- Formal MiniGPT decisions resolve persisted generation ids server-side and preserve typed `LotteryResearchProvenance`; client note text is not a provenance source of truth.
- Candidate-pool backtests persist seed/algorithm and paired baseline rows, require equal issue coverage and cost for `sameWindow`/`sameBudget`, report model/baseline financial and hit deltas, and label static-pool historical replay as non-walk-forward evidence.
- Decision review accepts only `PROMOTE`, `WATCH`, `PAUSE`, or `RETIRE`, requires a backtest owned by the same decision set, and takes priority over automatic recommendation classification without resetting recommendation lifecycle status.
- Once a decision has `reviewBacktestId`, outcome, month-end, and export review metrics resolve a report only when both its id equals `reviewBacktestId` and its `decisionSetId` equals the reviewed decision id. A newer replay or an unrelated MiniGPT backtest must not replace the reviewed deltas, warnings, or comparability flags.
- Ticket-pack preview is read-only. A separate explicit create action may save only `DRAFT`; approval and save-as-tickets remain separate manual operations.
- Export and maintenance endpoints have dry-run, preview, or bounded-output behavior where appropriate.
- Existing `decision-sets`, `backtests`, and `decision-outcomes` CSV exports collectively preserve lineage, typed research provenance, review binding, and warnings. Backtest rows specifically preserve model/random financial metrics, `averageRedHitsDelta`, `blueHitRateDelta`, `totalPrizeDelta`, `sameWindow`/`sameBudget`, and evaluation mode; a MiniGPT release preset must not create a parallel source of truth.
- CSV serialization must quote fields containing comma, quote, LF, or CR and neutralize spreadsheet formulas in free text by prefixing an apostrophe for `=`, `@`, or nonnumeric `+`/`-` prefixes (including leading-whitespace variants). Legitimate numeric values such as negative cost, net result, or ROI must remain numeric rather than being formula-escaped.
- MiniGPT observation CSV evidence uses the fixed `LATEST_100_DECISIONS_INCLUDE_ARCHIVED` snapshot, `MINIGPT_TEMPORAL_BOUNDARY_V1`, and `DECISION_SET` as the count unit. Detail filters and row limits may select flattened candidate rows but must not redefine snapshot state counts or denominators; repeated rows carry `REPEATED_SNAPSHOT_METADATA_DO_NOT_SUM`, and export `rowCount` remains a candidate-row count rather than an observation denominator.
- `decision-outcomes` reviewed evidence is exact-binding-only: trusted deltas require the requested report id, owning `decisionSetId`, stable provenance, comparable window/budget/ticket counts, complete metadata/deltas, and static historical replay. The fixed snapshot extension may write the existing export audit event, but it must add no new business-data mutation, export type, public aggregate API, collection, or latest-report fallback.

## Frontend

- API types in `one-web/src/services/api.ts` match backend DTOs.
- Pages handle empty, loading, error, and stale states.
- Dense chart/table pages fit mobile and desktop layouts.
- Prediction copy stays research-oriented and avoids guaranteed outcome wording.
- Personal ticket and ledger pages show cost and outcome clearly.
- Saved decision outcomes separate candidate hit evidence from converted-ticket financial results.
- Workbench drill-through links preserve useful filters in query parameters.
- Experiment, backtest, alert, export, and audit pages keep research language restrained and evidence-oriented.
- MiniGPT closed-loop controls enforce `saved decision -> comparable backtest -> preview -> explicit DRAFT`; no UI action in this chain automatically approves a pack or creates tickets.
- Backtest comparisons show `sameWindow`, `sameBudget`, baseline seed/evaluation mode, model and random metrics/deltas, and warnings. PASS requires `sameWindow === true && sameBudget === true`; false is FAIL and missing/null is UNKNOWN, which must never receive PASS or passing-color treatment. Static-pool historical replay must not be labelled walk-forward.
- MiniGPT temporal evidence uses exactly `TRAIN_WINDOW`, `VALIDATION_WINDOW`, `POST_CORPUS_PENDING`, `POST_CORPUS_OBSERVED`, and `UNKNOWN`. Only observed post-corpus rows enter the observation denominator; favorable outcomes or baseline deltas cannot change the state, and `UNKNOWN` is never PASS.
- A frontend-composed observation aggregate must declare its bound. The Wave 48B panel reads at most 100 include-archived outcomes, uses decision-page `total`/`hasNext` to disclose truncation, keeps non-MiniGPT and all five temporal counts explicit, and must not present the bounded snapshot as full history.
- Wave 48B keeps observed-decision, distinct-issue, scored-candidate, and fully settled financial denominators separate. Financial totals require converted tickets, complete prize checking, and finite cost/prize values; fewer than three distinct observed issues, duplicate decision issues, unstable lineage, partial financial coverage, and truncated scope require visible warnings.
- Post-corpus baseline deltas remain per decision and require exact `reviewBacktestId`, matching `decisionSetId`, identical stable corpus/run/hash/range provenance, `sameWindow === true`, `sameBudget === true`, equal model/baseline ticket counts, complete baseline metadata/deltas, and `STATIC_POOL_HISTORICAL_REPLAY`. Failed/unknown checks show their reason, never borrow another report, and are never averaged into an aggregate delta.
- Lifecycle UI shows the current manual review action and keeps promote/watch/pause/retire separate from recommendation lifecycle states such as applied, snoozed, and archived.
- MiniGPT month-end evidence must start from the most recent reviewed provenance-backed decision outcome and show a backtest matching both `reviewBacktestId` and `decisionSetId` beside model/random values. Ticket-pack evidence may match only when `pack.decisionSetId` or `pack.sourceId` equals that selected decision id. If either owned artifact is unavailable, show missing evidence instead of falling back by provenance, batch, recency, or another MiniGPT chain.
- The Wave 48C month-end observation panel is an independent latest-100 include-archived read that reuses `aggregateMiniGptPostCorpusOutcomes`; it must not replace the legacy 12-row month-end review read or feed the month-end score, review action, recommendation lifecycle, approval, or ticket creation. Exact-detail failures remain explicit and never borrow another report.
- The `v47-minigpt-research` export preset and `MiniGPT研究链复核证据` pack expose reproducible generation, same-window/same-budget baseline, draft, and manual-review handoffs with historical-only/no-future-guarantee copy. They must not approve a pack or create tickets.
- English QA must preserve the exact safety copy `Historical-window research evidence only; do not extrapolate future performance.`, `The reviewed backtest is unavailable. Results from another research chain are not substituted.`, and `No automatic approval or ticket creation` alongside the corresponding Chinese text.
- Run `npm run lottery:smoke` in `one-web` after changing `/lottery/workbench`, `/lottery/predictions/decision`, `/lottery/tickets`, `/lottery/research`, `/lottery/month-end`, or `/lottery/exports`; this fixture smoke does not require live provider access.
- Run `npm run lottery:release-check` in `one-web` when frontend lottery release evidence needs to be committed or handed off. It refreshes route smoke, writes the human-readable report to `one-web/reports/lottery-release-evidence.md`, and verifies the production build.
- Use `npm run lottery:release-evidence` only when the report needs to be refreshed without a production build.
- Use `npm run lottery:release-evidence:check` to verify the committed Markdown report still matches the current smoke summary and fixture without rewriting files.
- Browser QA can use `npm run dev:qa` for frontend-only visual checks without a local login session. Data-backed interactions still require the backend service. Proxy-related provider failures, including HTTP 403 when a proxy is enabled, should be recorded as provider/sync evidence rather than treated as route-render failures.

## Protected Browser QA

Use this gate when a lottery milestone needs screenshots or manual browser inspection for protected routes.

- For a real authenticated flow, confirm the browser has a valid local login session before opening `/lottery/*`. The frontend guard reads local storage key `aurorae_auth`; if it is missing or stale, protected lottery routes redirect to `/login` and the screenshot only proves the login shell.
- For frontend-only layout and interaction QA, start `one-web` with `npm run dev:qa`. The explicit `qa` Vite mode supplies a local QA identity without writing `aurorae_auth`, skips `/auth/me`, and requires the Vite development server on a loopback hostname, so production builds and non-local hosts cannot enable it. Do not use this mode as evidence for backend authorization or session behavior.
- Confirm the local backend service is running before judging route rendering. The Vite proxy must be able to reach project-owned lottery APIs such as `/lottery/records/draws`, `/lottery/workbench/summary`, and `/lottery/providers/health`.
- Treat `ECONNREFUSED` on `/lottery/records/draws?page=0&size=500` as a backend/proxy availability blocker, not a frontend dark-mode or layout failure.
- If login or backend availability blocks screenshots, still run `npm run lottery:release-check` in `one-web`, record the blocker signature, and continue only after noting that browser evidence is incomplete.
- When browser QA is available, record screenshot paths or the remaining blocker next to `one-web/reports/lottery-release-evidence.md` in the final handoff.
- For the Iteration 48 release, verify the decision, month-end, and existing export-preset handoff in Chinese and English, light and dark themes, and practical 1280px and 390px viewports. Confirm the five states and `UNKNOWN` non-PASS semantics, observed-only denominators, exact-chain evidence, no document/panel horizontal overflow, one real navigation or preset interaction, and no relevant application console error.
- Tag isolated QA records, delete every isolated decision/snapshot/backtest/ticket fixture after validation, and confirm zero tagged rows remain. Browser reads must not trigger a new business-data mutation; an explicitly generated CSV may still create its pre-existing export audit record.
- Do not add frontend bypasses for production authentication behavior just to make screenshots easier.

## Data

- Red numbers are normalized to six sorted two-digit strings.
- Blue number is normalized to one two-digit string.
- Issue number uniqueness is enforced or guarded by service logic.
- Derived statistics can be recalculated after record sync.
- Redis cache keys are invalidated or refreshed after source data changes.
- Audit metadata is preserved for generated predictions, saved tickets, daily-run steps, experiments, backtests, and exports once those flows exist.
- Generation, decision, backtest, ticket-pack, ticket, note, outcome, ledger, and recommendation evidence keep typed provenance and lineage ids without relying on free-text reconstruction.
- A random baseline has one paired row per evaluated model row; its ticket count, issue coverage, and total cost must remain directly comparable before downstream preview is allowed.
- Reviewed evidence is stable by identity and ownership: `reviewBacktestId` plus `decisionSetId` freeze the report used for outcome and month-end interpretation even when later backtests exist, while ticket packs must resolve through that same decision id.
- Post-corpus aggregation groups only on a complete corpus version, run id, train/validation/checkpoint hashes, and train/validation ranges while retaining the owning decision rows. Incomplete extended provenance is isolated as its own group and its baseline comparison remains UNKNOWN rather than being inferred from partial lineage.
- MiniGPT observation snapshot counts and denominators remain decision-level data even when `decision-outcomes` flattens candidates. Consumers must deduplicate by the declared snapshot or read one repeated metadata set; they must never sum the repeated cells or treat CSV `rowCount` as the decision, issue, candidate-score, financial, or baseline denominator.

## Documentation

- Follow `docs/engineering/commit-and-versioning.md` for commit messages and release version changes.
- Update `docs/lottery/iterations/checklist.md`.
- Update `docs/lottery/modules/technical-design.md` for architecture or contract changes.
- Update `docs/lottery/menu-and-version-plan.md` when routes or menu scope changes.
- Record verification commands and known unrelated failures in the final handoff.
