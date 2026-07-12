# Lottery Technical Design

Last updated: 2026-07-12

## Module Shape

The lottery module currently spans three backend concerns and several frontend views:

- Historical draw records: `record/*`
- Prediction and training: `lottery/training/*`
- Astronaut naming and voyage statistics: `lottery/astronauts/*`
- Frontend lottery cockpit: overview, prediction, records, statistics, analysis, pixel, Taiji, space, hexagram, and seasonal pages.

Future iterations should gradually move new lottery-domain APIs under `lottery/*` while preserving existing `record/*` compatibility until frontend callers are migrated.

## Current Duplication Audit

The first baseline audit found these duplicated or parallel implementations:

- `one-web/src/utils/lotteryStats.ts` parses 14-digit compact records, derives red/blue numbers, red sum, odd/even, big/small, consecutive pairs, planet, hexagram, frequency, omissions, predictions, replay scores, and prize labels.
- `LotteryTrainingService` parses compact records from `RecordFile`, builds its own `Draw` objects, recalculates red sum, odd/even, big/small, frequency, omissions, prediction scores, and prize labels.
- `LotteryBallUtil` owns backend planet and hexagram mappings, while the frontend owns matching `planetByOddCount` and `HEXAGRAMS` data.
- `LotteryAstronautService` has a local `splitBalls` parser for comma-separated or compact records and reads derived planet/hexagram/sum fields from color-ball records.

Near-term rule: do not rewrite all of this at once. New APIs should establish normalized contracts first, then migrate heavy parsing/statistics into shared backend services or clearly documented frontend helpers.

## Desired Backend Layers

```text
Controller
  -> Service interface
    -> Domain service
      -> Repository for durable data
      -> Provider interface for external draw data
      -> Redis for cache, locks, status, and derived snapshots
```

Provider-specific fetch and parse logic should not leak into controllers, frontend code, or shared DTOs.

The first provider boundary is `LotteryDrawProvider`, with `CwlLotteryDrawProvider` wrapping the existing China Welfare Lottery fetch path. `RecordUpdater` depends on the provider interface rather than `RecordCalendar` or `RecordClient` directly.

## Data Ownership

MongoDB should own durable domain data:

- Draw records.
- Sync logs. Current implementation starts with `LotteryRecordSyncLog` in `lottery_record_sync_logs` for manual record sync operations.
- Prediction rules and prediction snapshots.
- Training reports when they need history.
- Personal tickets.
- Prize checking results.
- Lottery preferences.
- Astronaut names.

Redis should own volatile or derived state:

- Training status.
- Latest prediction cache.
- Last report cache before durable history exists.
- Statistics summaries.
- Sync locks. Manual record sync currently uses `lottery:records:sync:lock` with a bounded TTL.
- Provider health/probe results.
- Voyage count summaries.

## Canonical Draw Contract

New APIs should converge on a normalized draw contract:

```text
id
issue
drawDate
redNumbers
blueNumber
redSum
oddCount
evenCount
span
source
sourceUpdatedAt
createdAt
updatedAt
```

Rules:

- Red numbers are six two-digit strings sorted ascending.
- Blue number is one two-digit string.
- Issue identity is unique.
- Derived fields can be recalculated, but API responses should be stable.
- `LotteryDraw` is the first canonical DTO for this contract, with `LotteryDrawUtil` converting legacy `Record` objects or 14-digit compact records into normalized draws.
- `/lottery/records/draws/latest`, `/lottery/records/draws/first`, and `/lottery/records/draws` expose this DTO while legacy `/lottery/records/*` responses remain compatible with existing `Record` callers.

## Prediction Contract

Prediction snapshots should be auditable:

```text
id
targetIssue
basedOnIssue
ruleId
ruleName
ruleVersion
redNumbers
blueNumber
candidates
score
reason
actualRecord
createdAt
updatedAt
```

`LotteryPredictionSnapshot` is the first durable prediction history model. Training still writes the latest prediction to Redis for compatibility, and now also saves a Mongo snapshot in `lottery_prediction_snapshots`. New prediction operations live under `/lottery/predictions`: history, detail, actual-result attachment, and async training start. `POST /lottery/predictions/{id}/actual` normalizes the actual draw, scores the primary prediction and each candidate, and updates the snapshot. The legacy `/lottery/training/*` endpoints remain compatible while frontend pages migrate.

Training reports should include:

- Replay window.
- Candidate rules.
- Best rule.
- Timeline.
- Metrics.
- Generation/version.
- Failure message when applicable.

`LotteryTrainingReportRecord` stores completed training reports in Mongo at `lottery_training_reports`. The existing Redis `lottery:training:last` cache remains a fast compatibility path, while durable records preserve replay count, generation, best result, learned rule, latest prediction, candidates, timeline, and actual-result context for future history and comparison pages.

`LotteryPredictionRuleRecord` stores learned prediction rule versions in Mongo at `lottery_prediction_rules`. Rule records capture rule id/name, generation, replay count, rank score, config, summary, learned flag, `LotteryRuleEvidence`, and `LotteryReplaySummary`. `GET /lottery/predictions/rules` returns recent rule versions with evidence tags, and `GET /lottery/predictions/rules/compare` identifies the best ranked rule among that window for comparison UI. Rule comparison also attaches a matched `LotteryBacktestSummary` when a latest backtest report has a `strategyName` matching the rule name or rule id.

`GET /lottery/predictions/replay-metrics` reads the latest durable training report timeline and aggregates score, red-hit average, blue-hit rate, best score, prize distribution, red-hit distribution, candidate hit distribution, rule version, and recent-window drift against the previous same-sized baseline window. The prediction and rule evidence APIs use `LotteryRuleEvidence` tags: `STABLE`, `VOLATILE`, `STALE`, or `UNDER_TESTED`.

Training operations expose both legacy `/lottery/training/status|cancel|retry` and prediction namespace `/lottery/predictions/training/status|cancel|retry` endpoints. Cancellation is cooperative: the API marks the active training run as cancelled, and candidate replay or rolling timeline loops stop at the next cancellation check. Retry reuses the last requested replay count and scale.

The frontend prediction history page at `/lottery/predictions/history` reads `GET /lottery/predictions` and presents recent durable snapshots with rule metadata, generated numbers, result state, candidate counts, evidence tags, and replay summary text.

The frontend prediction detail page at `/lottery/predictions/:id` reads `GET /lottery/predictions/{id}` and displays the saved primary prediction, candidate predictions, rule metadata, scores, actual draw, hit results, evidence reasons, and primary/candidate hit distributions.

## MiniGPT Lottery Corpus Export Contract

Iteration 47A extends `POST /ai/minigpt/corpus/lottery/export` without breaking the existing raw/features callers. The endpoint accepts `format=raw|features|strategy`; every format is serialized as one complete sample per line after normalized draws are sorted by issue ascending.

The formal split is deterministic and chronological:

```text
validationCount = max(1, ceil(totalCount * 0.20))
trainCount = totalCount - validationCount
train = earlier complete rows
validation = later complete rows
```

Exports with fewer than two valid rows are rejected. No row may appear in both files, no row may be split by character/token position, and the endpoint must not fall back to a random split.

Each export owns a versioned directory:

```text
data/lottery-corpora/<format>/<corpusVersion>/all.txt
data/lottery-corpora/<format>/<corpusVersion>/train.txt
data/lottery-corpora/<format>/<corpusVersion>/validation.txt
data/lottery-corpora/<format>/<corpusVersion>/manifest.json
```

`MiniGptLotteryCorpusExport` is extended with the following provenance groups:

```text
format, schemaVersion, templateVersion, corpusVersion
splitMode, validationRatio, sortOrder
drawCount, trainDrawCount, validationDrawCount
firstIssue, latestIssue
trainFirstIssue, trainLatestIssue
validationFirstIssue, validationLatestIssue
contentSha256, trainSha256, validationSha256
dataPath, filePath, legacyDataPath
fullDataPath, fullFilePath
trainDataPath, trainFilePath
validationDataPath, validationFilePath
manifestDataPath, manifestFilePath
preview, generatedAt
```

Compatibility rules:

- The service continues writing the full corpus to `data/lottery-<format>.txt`.
- Existing `dataPath` and `filePath` retain their old meaning and point to that compatibility full-corpus file.
- `legacyDataPath` makes the compatibility location explicit; `fullDataPath`/`fullFilePath` point to the versioned `all.txt`.
- New training UI uses `trainDataPath` and displays the paired validation and manifest evidence. Old callers can continue reading `dataPath` without understanding version directories.
- `generatedAt` records the first successful creation time of the version artifact and remains stable when the same version is exported again. Reproducibility is established by the schema/template versions, source/split ranges, and SHA-256 values.

The `strategy` serializer emits complete `target/strategy/red/blue/reason` rows from versioned deterministic templates. It must use normalized legal numbers and documented reason labels, and it must not read validation outcomes to construct training rows. This corpus supports format, constraint, and explanation learning; it is not a prediction-success claim.

## MiniGPT Training And Generation Provenance Contract

Iteration 47B connects a versioned corpus to the training and generation records without changing the Iteration 47A export identity. A formal lottery training request supplies the versioned `train.txt`, paired `validation.txt`, and `manifest.json`; the backend resolves all three inside the MiniGPT playground and recalculates their SHA-256 values before starting Python.

Training preflight is synchronous and runs before the in-process training lock is acquired. For the character tokenizer:

```text
sampleTokens = Unicode code points in a nonblank complete row + its line terminator token
requiredBlockSize = max(sampleTokens)
recommendedBlockSize = ceil(requiredBlockSize / 16) * 16
effectiveBlockSize = resume checkpoint config.block_size
                     or explicit request blockSize
                     or preset blockSize
```

A formal run is rejected with HTTP 422 when the manifest paths or hashes do not match, the effective context is shorter than `requiredBlockSize`, the training stream is too short for a batch, or the fixed validation file is too short or contains characters outside the training tokenizer. Legacy unversioned text remains available for learning experiments, but its run is marked `LEGACY_UNVERIFIED` and must not be presented as formal lottery evidence.

When a fixed validation file is present, Python uses the entire training file for updates and the fixed file for periodic `eval_loss` and the final validation loss. Only legacy requests without `evalData` may use the historical train-tail character split. The saved run exposes `validationSource` so consumers can distinguish the two modes.

`mini_gpt_runs` remains the durable training source and gains corpus/manifest hashes, actual context and model configuration, seed, validation source, checkpoint path, and checkpoint SHA-256. Every generated sample is additionally persisted to `mini_gpt_generations` with:

```text
generationId, batchId, runId, runName
corpusVersion, trainSha256, validationSha256
checkpoint, checkpointSha256, modelConfig
prompt, maxNewTokens, temperature, topK, seed
generatedText, lotteryCandidate, strategyLabel
poolSelected, poolDecision, elapsedMillis, generatedAt
```

`POST /ai/minigpt/generate` remains the single-sample compatibility endpoint and `POST /ai/minigpt/generate/compare` remains parameter comparison. `POST /ai/minigpt/generation/batch` is the evidence-producing batch endpoint. A batch assigns deterministic per-item seeds, records strategy composition, parses and repairs every item, then greedily selects legal candidates while enforcing the requested red-ball overlap and preferring additional blue-ball coverage.

Batch rates always use `generatedCount` as the denominator. `legalCount` means legal before repair; `postRepairLegalCount` uses the shared `valid || postRepairValid` predicate. The response also records repair issue counts, maximum/average pairwise red overlap, distinct blue count/coverage, strategy composition, and every accepted or rejected item's reason. Requested diversity is a target; the response reports only what the generated candidates actually achieve.

## MiniGPT Random-Baseline And Outcome Chain Contract

Iteration 47C introduces `LotteryResearchProvenance` as the typed downstream contract. It snapshots generation/batch/run ids, corpus and train/validation hashes, checkpoint hash, sampling controls, model config, corpus issue ranges, batch policy, and capture time. `POST /lottery/decision-sets/minigpt` accepts generation ids but resolves the durable `mini_gpt_generations` records server-side before creating the decision set. The decision and backtest keep the batch snapshot; each selected candidate keeps its generation-specific snapshot.

The same provenance and lineage ids continue through `LotteryTicketPack`, `LotteryTicketPackItem`, `LotteryTicket`, `LotteryStrategyNoteEvidence`, decision outcomes, outcome attribution, and ledger performance. Ledger performance supports `DECISION_SET`, `MINIGPT_RUN`, and `MINIGPT_BATCH` dimensions. A BACKTEST note attachment resolves its source report by id and replaces client-supplied provenance with the server-owned report snapshot.

Candidate-pool backtests use a deterministic paired baseline:

```text
baselineSeed default: 42
baselineAlgorithm: FNV1A64_JAVA_RANDOM_V1
one random replay row per model replay row
sameWindow: paired issue coverage is identical
sameBudget: paired total cost is identical
```

`LotteryBacktestReport` persists model and baseline rows, ticket counts, costs, prizes, net results, ROI, red/blue hit metrics, hit/prize distributions, candidate diversity, overlap/blue coverage, all deltas, comparability flags, and warning codes. Decision-set replay uses `STATIC_POOL_HISTORICAL_REPLAY`: one saved pool is scored across the selected history and is not regenerated at each historical cutoff. It therefore must not be described as walk-forward validation. Warning codes expose static replay, unknown or overlapping corpus windows, small samples, low diversity, no random advantage, and baseline window/budget mismatch.

Explicit decision review is exposed through:

```text
PATCH /lottery/decision-sets/{id}/review
reviewAction: PROMOTE | WATCH | PAUSE | RETIRE
backtestId: required and owned by the same decision set
```

Manual review wins over automatic recommendation classification. Without manual review, automatic `PROMOTE` requires a winning candidate, positive net result, positive `backtestRoiPercentDelta`, and no backtest warning; warnings or a negative delta lead to `PAUSE`, while inconclusive evidence stays `WATCH`. Recommendation refresh updates evidence and recommendation state without resetting the existing lifecycle status such as `OPEN`, `APPLIED`, `SNOOZED`, or `ARCHIVED`.

Ticket-pack handoff remains deliberately two-step:

```text
POST /lottery/ticket-packs/preview  -> validation/budget preview, no draft write
POST /lottery/ticket-packs          -> explicit DRAFT only
PATCH approve / POST save-tickets   -> separate manual operations
```

The MiniGPT page requires a saved decision, a comparable backtest with `sameWindow=true` and `sameBudget=true`, and a successful preview before enabling explicit draft creation. Neither preview nor draft creation approves the pack or creates tickets.

## MiniGPT Month-End And Release Evidence Contract

Iteration 47D does not add a month-end DTO, route, collection, or model-performance calculation. `/lottery/month-end` composes the existing project-owned contracts in parallel: `GET /lottery/decision-sets/outcomes?includeArchived=true`, the bounded first page of `GET /lottery/backtests`, `GET /lottery/ticket-packs?includeArchived=true`, and the existing ledger/outcome/audit summaries. Optional backtest-list and ticket-pack failures keep the broader month-end review available; the page still attempts the exact reviewed-backtest detail lookup, and any evidence that remains unavailable is shown explicitly.

The page selects the most recent reviewed decision with typed MiniGPT provenance. Its `reviewBacktestId` is authoritative:

```text
list report.id == reviewBacktestId
  && report.decisionSetId == decision.decisionSetId -> use report
reviewBacktestId is outside bounded list             -> GET /lottery/backtests/{reviewBacktestId}
detail id and decisionSetId both match                -> append and use report
either id is wrong or exact report is unavailable     -> show missing evidence
unrelated/newer MiniGPT report                        -> never substitute
```

The backend outcome contract follows the same rule. For a reviewed decision, `LotteryDecisionSetService` resolves `reviewBacktestId`, verifies that the report belongs to that decision set, and uses its deltas and warnings without fallback. Only an unreviewed decision may use the newest report for the same decision set. A later replay therefore cannot rewrite the evidence behind an already recorded `PROMOTE`, `WATCH`, `PAUSE`, or `RETIRE` action.

Ticket-pack association is decision-owned rather than provenance-inferred:

```text
pack.decisionSetId == selectedDecision.decisionSetId
  || pack.sourceId == selectedDecision.decisionSetId -> associated pack
otherwise                                            -> unrelated; do not use
```

The MiniGPT month-end card presents model and random-baseline cost, prize, net result, and ROI; `sameWindow` and `sameBudget`; evaluation mode and warnings; corpus/run/batch/generation lineage; review action/note/time; draft/approval state; and project-owned decision, backtest, ticket-pack, outcome, ledger, and export handoffs. Comparison state is tri-valued: both flags explicitly `true` are PASS, either explicitly `false` is FAIL, and absent/null evidence is UNKNOWN. UNKNOWN must not receive PASS text or color. Absence remains explicit, and no cross-chain decision, report, or ticket-pack fallback is allowed.

Release evidence extends the existing CSV types rather than introducing a fourth MiniGPT export domain:

- `decision-sets` includes candidate keys/generation ids, review action/backtest/time, and shared `LotteryResearchProvenance` columns.
- `backtests` includes decision binding, baseline seed/algorithm, comparability flags, model/baseline ticket counts and financial values, ROI/deltas including `averageRedHitsDelta`, `blueHitRateDelta`, and `totalPrizeDelta`, diversity/overlap/blue coverage, evaluation mode, warnings, and shared provenance.
- `decision-outcomes` includes review binding/state, backtest deltas/warnings, candidate generation id, and candidate-level provenance with item-level fallback.

The shared CSV serializer treats CR as a quoting boundary alongside comma, quote, and LF. Before quoting, it protects spreadsheet consumers by prefixing an apostrophe when free text begins, after leading whitespace, with `=`, `@`, or a nonnumeric `+`/`-` formula prefix (and for leading tab/CR control prefixes); `BigDecimal`-parseable values such as `-40`, `-50`, or negative ROI remain unmodified numeric cells. This applies to provenance prompt text as well as ordinary export fields.

The shared provenance columns retain source type, generation/batch/run identity, corpus/train/validation/checkpoint hashes, prompt/sampling/seed/strategy, model configuration, train/validation issue ranges, batch policy/composition, and capture time. The report preset `v47-minigpt-research`, evidence pack `MiniGPT研究链复核证据`, and release rows `V47可复现生成链`, `V47同窗同预算基线`, and `V47草稿与人工复核链` point back to the owning pages.

All 47D output is static historical-window research evidence. It must not be described as walk-forward validation or a future-performance guarantee. English rendering keeps the exact strings `Historical-window research evidence only; do not extrapolate future performance.`, `The reviewed backtest is unavailable. Results from another research chain are not substituted.`, and `No automatic approval or ticket creation` so safety semantics do not weaken after language switching. Month-end and export actions do not approve ticket packs and do not create tickets; approval and save-as-tickets remain separate manual commands.

## MiniGPT Temporal Boundary And Out-Of-Sample Observation Contract

Iteration 48 is complete after the verified Iteration 47 handoff. Waves 48A-48B are frontend-only, read-only compositions over existing project-owned contracts:

```text
GET /lottery/decision-sets/outcomes?includeArchived=true&limit=100
GET /lottery/decision-sets?includeArchived=true&page=1&pageSize=100
GET /lottery/backtests/{reviewBacktestId}  # exact owned report only
```

They add no API, DTO, MongoDB collection, route, menu item, export type, or mutation. Wave 48C adds a separate read-only aggregate inside the existing month-end page and an export-internal Java mirror inside the existing `decision-outcomes` type; it adds no public aggregate contract, parallel export domain, collection, or new business-data write. `LotteryResearchProvenance` already supplies `trainFirstIssue`, `trainLatestIssue`, `validationFirstIssue`, and `validationLatestIssue`; decision/outcome records supply `targetIssue` and settled/pending result evidence. Backtests are evidence only when they belong to the same decision. For a reviewed decision, both `report.id == reviewBacktestId` and `report.decisionSetId == decisionSetId` must hold. A newer report, a report from another decision, or matching-looking generation provenance cannot fill a gap.

The classifier has exactly five states:

```text
TRAIN_WINDOW
VALIDATION_WINDOW
POST_CORPUS_PENDING
POST_CORPUS_OBSERVED
UNKNOWN
```

Classification is independent of prize, ROI, random-baseline delta, and manual review action:

```text
missing/malformed issue or boundaries
  or invalid boundary ordering
  or ownership mismatch                         -> UNKNOWN

trainFirstIssue <= targetIssue <= trainLatestIssue
                                                    -> TRAIN_WINDOW

validationFirstIssue <= targetIssue <= validationLatestIssue
                                                    -> VALIDATION_WINDOW

targetIssue > validationLatestIssue
  and no settled target outcome                     -> POST_CORPUS_PENDING

targetIssue > validationLatestIssue
  and existing outcome evidence is settled/scored   -> POST_CORPUS_OBSERVED

all other positions, including a range gap           -> UNKNOWN
```

Range membership is inclusive. A settled/scored outcome means existing target-scoped outcome evidence marks a candidate as `WON` or `MISSED`, or otherwise exposes an attached actual-result score; a merely created decision, pending candidate, or unscored ticket does not qualify. The target must be strictly later than `validationLatestIssue` to enter either post-corpus state. Because Iteration 47's frozen validation range ends at the corpus boundary, `validationLatestIssue` remains the authoritative post-corpus cutoff for this V1 classifier.

Only `POST_CORPUS_OBSERVED` may render the phrase out-of-sample observation. This state means that an actual result later than the frozen corpus has been observed; it uses a non-success research color and is not a performance PASS, proof of generalization, evidence of future advantage, or permission to act. `TRAIN_WINDOW` and `VALIDATION_WINDOW` remain corpus-contained evidence, `POST_CORPUS_PENDING` has no observed denominator, and `UNKNOWN` must never receive PASS text, PASS color, favorable sorting, or fallback classification.

The Wave 48A MiniGPT decision-provenance panel on `/lottery/predictions/decision` shows state, target issue, train/validation ranges, corpus/run identity, decision id, reviewed backtest id when present, and pending/unknown reason. It has no write controls and cannot change recommendation lifecycle, decision review, ticket-pack state, approval state, or tickets.

Wave 48B adds a separate read-only observation card on the same route. Its bounded scope is fixed at the latest 100 decision outcomes with archived rows included. The matching 100-row decision-set page does not supply aggregate facts; its `total` and `hasNext` expose whether earlier decisions are outside the current denominator. The UI shows loaded/total scope and a truncation warning instead of implying full-history coverage. Outcome rows without MiniGPT batch/generation/source provenance remain outside the five-state panel and are counted separately.

The aggregator first applies the Wave 48A classifier to every in-scope MiniGPT outcome. It keeps five independent state counts and admits only `POST_CORPUS_OBSERVED` to observed metrics. Training, validation, pending, and unknown rows never enter that denominator. Observed rows remain eligible even when their extended lineage signature is incomplete; they are isolated rather than merged with a stable group.

Stable grouping is keyed by all of the following provenance fields:

```text
corpusVersion
runId
trainSha256
validationSha256
checkpointSha256
trainFirstIssue / trainLatestIssue
validationFirstIssue / validationLatestIssue
```

A stable group also requires owning `decisionSetId`. Each group retains its individual decision rows, decision ids, batch ids, distinct issue count, and issue range. An incomplete signature becomes a per-decision `UNSTABLE` group, raises a lineage warning, and forces its random-baseline comparison to `UNKNOWN`; it is never joined by similar title, batch, recency, or partial provenance.

Wave 48B deliberately separates these denominators:

```text
observed decision count     = POST_CORPUS_OBSERVED decision rows
distinct observed issues   = unique targetIssue values among those rows
scored candidate count     = sum of scored candidates among those rows
settled financial coverage = observed decisions with convertedTicketCount > 0,
                              checkedConvertedTicketCount == convertedTicketCount,
                              and finite totalCost/totalPrize
```

Red-hit/prize distributions, winning candidates, blue-hit count/rate, and overall issue range use observed rows only. Cost, prize, net result, and ROI use only the fully settled financial subset. The panel warns when fewer than three distinct issues are observed, multiple decisions share an issue, financial coverage is partial, stable lineage is absent, or the bounded snapshot is truncated.

Random-baseline evidence is resolved and rendered per observed decision, never averaged across reports. The client requests only that decision's exact `reviewBacktestId` detail and classifies it as `COMPARABLE` only when all of these conditions hold:

```text
report.id == reviewBacktestId
report.decisionSetId == outcome.decisionSetId
report stable provenance signature == outcome stable provenance signature
report.sameWindow == true
report.sameBudget == true
report.ticketCount == report.baselineTicketCount
evaluationMode == STATIC_POOL_HISTORICAL_REPLAY
baseline algorithm, seed, positive window size, ticket counts, and all five deltas are present
```

An explicit window, budget, or ticket-count mismatch is `FAIL`; missing binding, unavailable report, unknown comparability, ownership/provenance mismatch, incomplete metadata/deltas, or unsupported evaluation mode is `UNKNOWN`. Only a comparable row shows `averageRedHitsDelta`, `blueHitRateDelta`, `totalPrizeDelta`, `netResultDelta`, and `roiPercentDelta`, alongside report warnings and identity. A positive delta remains historical per-decision evidence: it does not upgrade the purple `POST_CORPUS_OBSERVED` boundary, establish generalization, or trigger a mutation.

Wave 48C carries the same state, boundary source, denominator, and pending/unknown counts into the existing month-end and CSV evidence paths without introducing a parallel export domain. The existing month-end score and recent-review composition retain their original bounded read. A separate MiniGPT observation read uses the latest 100 outcomes with `includeArchived=true`, the matching 100-row decision page only for `total`/`hasNext` completeness metadata, and exact backtest detail for each stable observed decision's `reviewBacktestId`. Optional observation, scope, or exact-detail failures remain explicit and cannot substitute a newer or similar report. The month-end observation panel reuses `aggregateMiniGptPostCorpusOutcomes`, is read-only, and does not feed the month-end score, review action, recommendation lifecycle, ticket-pack state, approval, or ticket creation.

The month-end panel presents all five counts plus non-MiniGPT exclusions, loaded/total scope, observed decisions, distinct observed issues, scored candidates, fully settled financial coverage, and exact comparable-baseline coverage. Truncation, fewer than three distinct observed issues, duplicate issues, unstable lineage, partial financial coverage, incomplete baseline coverage, and `UNKNOWN` each remain visible. Random-baseline deltas remain on their owning decisions in the decision board and are not averaged in the month-end summary. A favorable value cannot upgrade the purple temporal state or establish generalization.

The existing `decision-outcomes` CSV now contains an export-internal Java mirror of the V1 classifier. It does not add a public aggregate DTO or API. The mirror uses decision-level `LotteryResearchProvenance`, `targetIssue`, `decisionSetId`, and decision-level `scoredCandidateCount`; candidate-level provenance and candidate `resultState` remain ordinary detail columns and do not redefine the decision boundary. The fixed observation snapshot is always:

```text
boundaryClassifierVersion = MINIGPT_TEMPORAL_BOUNDARY_V1
boundarySource            = DECISION_PROVENANCE_PLUS_EXACT_DECISION_OUTCOME
observationSnapshotScope  = LATEST_100_DECISIONS_INCLUDE_ARCHIVED
observationSnapshotLimit  = 100
boundaryCountUnit         = DECISION_SET
```

The export request's `targetIssue`, `ruleName`, and `limit` continue to select or cap flattened candidate detail rows. They do not change the fixed observation snapshot. Snapshot loaded/total/truncated metadata, MiniGPT/non-MiniGPT counts, all five decision-state counts, observed-decision denominator, distinct-issue denominator, scored-candidate denominator, and settled-financial decision denominator repeat on every candidate row. `snapshotAggregationSemantics=REPEATED_SNAPSHOT_METADATA_DO_NOT_SUM` is therefore mandatory: a decision with multiple candidate rows contributes once to the snapshot, and spreadsheet consumers must not sum repeated snapshot cells. `rowCount` remains the number of emitted candidate rows, not a decision count or observation denominator.

`decision-sets`, `backtests`, and `decision-outcomes` remain the existing V47 evidence chain and `v47-minigpt-research` preset. Wave 48C extends `decision-outcomes` where flattened candidate rows need an unambiguous decision boundary; it does not create a synthetic summary row, fourth MiniGPT CSV type, route, collection, or write operation.

Reviewed export evidence is resolved by exact id in the existing backtest repository. `reviewBacktestOwnershipState` is `EXACT_OWNED` only when both `report.id == reviewBacktestId` and `report.decisionSetId == decisionSetId`; unbound, unavailable, id-mismatched, and wrong-owner evidence cannot populate trusted reviewed deltas. `reviewedBaselineComparabilityState` is `COMPARABLE` only when stable provenance also matches, window and budget flags are true, model and baseline ticket counts are equal, baseline algorithm/seed/window metadata and all five deltas are complete, and the mode is `STATIC_POOL_HISTORICAL_REPLAY`. Explicit window, budget, or ticket-count mismatches are `FAIL`; all other gaps are `UNKNOWN`. Only comparable evidence populates `comparableBacktestNetResultDelta` and `comparableBacktestRoiPercentDelta`; there is no latest-report fallback.

All new values still flow through the shared CSV serializer described above, including formula-injection protection and CR/LF/quote handling. Each row repeats an English safety notice that fixes the interpretation to historical-window research, admits only `POST_CORPUS_OBSERVED` to the observed denominator, forbids summing repeated snapshot metadata, and states that no automatic approval or ticket creation occurs.

Wave 48D closes this contract with focused Maven 12/12, file-scoped ESLint, i18n 1090, dedicated smoke/release guards passing 1326/1326 across 18 routes, production TypeScript/Vite build, and rendered Chinese/English light/dark 1280px/390px QA. Isolated data verifies state counts `1/1/1/4/1`, observed denominator 4, fixed 100/103 truncation, independent financial/baseline coverage, exact-owner/FAIL/UNKNOWN cases, active reuse of `v47-minigpt-research`, and no horizontal overflow. A real CSV verifies the same fixed snapshot, do-not-sum marker, hashes, and trusted-delta rules; it retains the existing export audit event but creates no new business-data mutation. All tagged fixtures and temporary runtimes are removed, implementation commit `b0c3e3ee` is pushed, and no next iteration candidate is currently promoted.

## Statistics Contract

`LotteryStatisticsSummary` is the first public statistics DTO for the lottery cockpit. `GET /lottery/statistics/summary` returns record count, first/latest draw metadata, red/blue frequency, and structural distributions for red sum, odd count, big count, and span. `POST /lottery/statistics/summary/refresh` forces a recalculation and rewrites the Redis cache. `GET /lottery/statistics/frequency` and `GET /lottery/statistics/distribution` expose the same data in smaller endpoint-specific shapes for pages that do not need the full summary.

The implementation reads normalized `LotteryDraw` pages from `IRecordService` and stores the summary in Redis at `lottery:statistics:summary`. `LotteryRecordSyncService` invalidates the summary cache after a sync saves new records, so the next statistics request rebuilds from normalized draw data.

The frontend overview page consumes `LotteryStatisticsSummary` for red/blue frequency charts and summary count display. Local `lotteryStats.ts` remains in use for recent draw interaction, prediction helpers, omissions, and other analysis pages until those contracts are migrated incrementally.

The overview page treats backend statistics as the preferred source and local parsing as a fallback. It shows explicit status alerts when statistics are loading, recalculating, unavailable, stale against the current local draw count, or when no records are available and a sync is needed.

## Personal Ticket Contract

Personal tickets should support both manually entered picks and prediction-derived picks:

```text
id
userId
issue
redNumbers
blueNumber
quantity
costAmount
source
predictionId
status
prizeGrade
prizeAmount
note
createdAt
updatedAt
```

`LotteryTicket` is the durable personal ticket model for `lottery_tickets`. It stores issue/period, red and blue numbers, quantity, cost, source, status, optional prediction snapshot linkage, and the latest `LotteryPrizeResult`.

`LotteryPrizeCalculator` is the shared prize-grade utility. It normalizes ticket and actual numbers with `LotteryDrawUtil`, counts red and blue hits, and maps 双色球 prize rules to `FIRST` through `SIXTH` or `NONE`.

`LotteryTicketService` is the first ticket service boundary. It uses default user scoping, normalizes red and blue numbers, defaults quantity/cost/source/status, and exposes list/create/update/delete through `/lottery/tickets`.

`POST /lottery/tickets/check-prizes` accepts an actual draw, finds tickets for that draw period, calculates prize results, and writes the checked status back to each ticket. `GET /lottery/tickets/summary` aggregates counts, cost, prize amount, status distribution, and prize distribution.

`LotteryTicketBatchSaveRequest` and `LotteryTicketBatchSaveResult` support duplicate-safe batch ticket creation. `POST /lottery/tickets/batch` normalizes each requested ticket, skips duplicates by default user, issue, normalized red numbers, and blue number, returns a `LotteryTicketBudgetPrecheckResult`, and records a `LotteryAuditEvent` for confirmed batch saves. `LotteryTicketPrizeCheckSummary` powers `POST /lottery/tickets/check-prizes/latest`, which reads the latest draw record, checks pending tickets for that issue, and returns checked count, winning count, and total prize amount.

The frontend ticket list page at `/lottery/tickets` reads ticket list and summary APIs together, shows issue filtering, status/prize tags, generated numbers, cost, and prize outcome.

The ticket page also provides workflow power tools for operational use. Iteration 14B moves paste/import preview into `POST /lottery/tickets/import/preview`, which accepts raw pasted content plus default issue/source/status values and returns normalized rows, invalid reasons, existing duplicate matches, in-request duplicate grouping, proposed save payloads, and budget precheck warnings. The ticket page can still show an immediate local preview while waiting, but save uses the backend-confirmed preview rows.

Batch row actions now use sparse backend operations instead of many full-row updates: `PATCH /lottery/tickets/bulk` updates issue, quantity, cost, status, source, and note; `PATCH /lottery/tickets/bulk/archive` marks selected tickets `VOID`; `POST /lottery/tickets/bulk/delete` deletes selected tickets. Single and bulk delete, import preview, batch save, bulk update, and archive all record `LotteryAuditEvent` rows.

`POST /lottery/tickets/budget/precheck` accepts proposed ticket payloads and projects weekly, monthly, and per-issue exposure from saved preferences before tickets are saved. `/lottery/tickets` surfaces import precheck warnings, while `/lottery/predictions/decision` calls the same endpoint before converting selected candidates into draft prediction tickets.

The ticket issue timeline combines all-ticket list data with `/lottery/ledger/issues` to show per-issue ticket count, prediction-linked tickets, checked/pending prize-check state, winning count, net result, and ROI. The same page now renders a mobile card layout for ticket rows and a compact latest-prize-check result card, while ledger issue rows link back to `/lottery/tickets?issue=...`.

Prediction detail can batch-save the primary prediction and all candidate predictions through `POST /lottery/tickets/batch`; the ticket page can run `POST /lottery/tickets/check-prizes/latest` and display the returned summary before refreshing ticket rows and totals. Prediction history exposes result-status filtering and a latest-draw attachment action; prediction detail shows linked ticket count and can open the ticket page filtered by `predictionSnapshotId`, while linked ticket rows can jump back to the originating prediction snapshot.

The export and maintenance frontend at `/lottery/exports` uses the existing `GET /lottery/exports/{type}`, `GET /lottery/audit/events`, and maintenance APIs to provide a report builder, client-side CSV download, audit filtering, maintenance grouping, and a print-friendly report preview. The browser download path uses the returned `LotteryExportResult.content` and `fileName`; it does not introduce browser-side provider calls or alternate export endpoints.

Ticket queries accept `predictionSnapshotId` to support prediction-detail linkbacks. `POST /lottery/predictions/attach-latest-actual` reads the latest draw record, finds prediction snapshots whose `targetPeriod` matches that draw, attaches the normalized actual record, and recalculates primary and candidate results. `LotteryRecordSyncService` now runs the same latest-actual attachment after a successful record sync so eligible prediction snapshots are updated automatically when new draw data arrives.

The ticket page create/edit modal posts to the ticket CRUD APIs and accepts red numbers as space- or comma-separated input before converting them to the backend list format.

Ticket list filtering supports `issue`, `status`, `source`, `prizeGrade`, and `predictionSnapshotId` on `GET /lottery/tickets`, with the frontend exposing matching controls on the ticket page.

Prediction detail can save the primary prediction or candidate predictions as draft tickets with `source=PREDICTION` and `predictionSnapshotId` linked to the originating snapshot.

Suggested statuses:

```text
DRAFT
BOUGHT
WAITING_DRAW
CHECKED
WON
LOST
VOID
```

## Ledger Contract

`LotteryLedgerSummary` is the first outcome ledger DTO. `GET /lottery/ledger/summary` reads personal tickets and aggregates ticket count, checked/pending count, winning count, total cost, total prize, net result, and ROI percent. Prize amounts are converted from stored cent values to display-scale decimal amounts.

`LotteryIssueLedger` is the issue-level ledger DTO. `GET /lottery/ledger/issues` groups personal tickets by issue and returns per-issue ticket count, checked/pending count, winning count, total cost, total prize, net result, and ROI percent.

`LotteryMonthlyLedger` is the monthly outcome trend DTO. `GET /lottery/ledger/months` groups personal tickets by creation month in `yyyy-MM` format and returns monthly ticket count, checked/pending count, winning count, total cost, total prize, net result, and ROI percent.

`LotteryPerformanceLedger` powers source and rule performance views. `GET /lottery/ledger/performance?dimension=source|rule` groups personal tickets by source by default; with `dimension=rule`, prediction tickets resolve `predictionSnapshotId` to snapshot `ruleId` and `ruleName` when available. Each row returns cost, prize, net result, ROI percent, hit-rate percent, and an optional matched `LotteryBacktestSummary` for source/rule keys that have a same-name backtest.

## Provider Operations Contract

`LotteryProviderHealth` is the first provider operations DTO. `GET /lottery/providers/health` reports registered lottery draw providers, whether each provider is active, and the status check timestamp. The first implementation exposes registered local provider state only; active remote probing is tracked separately by the provider probe endpoint.

`LotteryProviderConfig` is a read-only provider configuration snapshot. `GET /lottery/providers/config` returns the active draw provider, registered draw providers, scheduled sync enabled state, provider network mode, proxy host/port, timeout, diagnostic snippet length, and generation timestamp. The default lottery provider network mode is `system`; operators can set `LOTTERY_PROVIDER_NETWORK_MODE=direct` to bypass local/system proxy behavior or `LOTTERY_PROVIDER_NETWORK_MODE=proxy` with `LOTTERY_PROVIDER_PROXY_HOST` and `LOTTERY_PROVIDER_PROXY_PORT` when an explicit proxy is required.

`LotteryProviderProbeResult` records an active provider probe. `GET /lottery/providers/probe?provider=cwl` calls the selected draw provider's lightweight probe path and returns availability, record count, duration, message, checked timestamp, request mode, HTTP status, response content type, safe response snippet, failure category, and whether a proxy/network block is suspected. Missing providers and provider exceptions are returned as structured probe results rather than unhandled errors.

`LotteryProviderProbeLog` stores durable provider probe history in `lottery_provider_probe_logs`. `GET /lottery/providers/probe-logs?provider=cwl&limit=20` preserves the legacy bounded-list response. Supplying `page` switches to the shared zero-based `LotteryPageResponse` contract and accepts `pageSize`, exact normalized `provider`, `success`, `checkedStartAt`, and `checkedEndAt`. The repository performs the count and page query in MongoDB, ordering by `checkedAt` descending and then `_id` descending; compound indexes cover the supported provider/status/time filter combinations, so the service does not load and slice the full collection in memory.

`LotteryPreference` stores default-user lottery preferences in `lottery_preferences`. `GET /lottery/preferences` returns saved preferences or a default fallback, and `PUT /lottery/preferences` normalizes training scale, replay count, auto-save behavior, default ticket source, budget limits, and workbench layout fields before saving. Workbench layout is represented by `workbenchWidgetOrder` and `hiddenWorkbenchWidgets`.

`LotteryDataQualityReport` summarizes record quality checks. `GET /lottery/data-quality` scans current records for missing issue numbers within each year, duplicate issues, malformed/invalid red-blue numbers, out-of-order `line` values, draw dates later than today, and stale derived statistics where the cached statistics summary no longer matches record count or latest issue. Response lists are capped to sample-sized issue lists for UI display.

`LotteryDataQualityRepairRequest` and `LotteryDataQualityRepairResult` power conservative repair flows. `POST /lottery/data-quality/repair/missing-issues/dry-run` computes missing issue repairability from the configured draw provider without writing data and returns planned inserts, skipped issues, renumbering scope, and cache-refresh steps. `POST /lottery/data-quality/repair/missing-issues/confirm` requires `confirm=true`, supports `issueStart`/`issueEnd` plus capped `limit`, writes only provider-backed missing issues, reorders saved records by issue, reassigns line numbers, invalidates the statistics cache, and records a `LotteryAuditEvent`. Malformed, duplicate, and future-date records stay report-only until a trusted refetch can prove exact replacement data.

`LotteryRecordSyncSummary` aggregates recent record sync logs. `GET /lottery/records/sync-summary?limit=50` returns status counts, success and failure rates, total saved count, latest status/message/issue range, latest failure category, latest provider, request mode, HTTP status, proxy/network suspicion, latest and average duration, and last success/failure/skipped timestamps. The summary is derived from MongoDB sync logs and does not read Redis lock state directly.

`GET /lottery/records/sync-logs` keeps the legacy bounded-list response when `page` is absent. Supplying `page` switches to the shared zero-based `LotteryPageResponse` contract and accepts `pageSize`, `status`, `startedStartAt`, and `startedEndAt`. MongoDB performs the count, filtering, and page query through indexed repository fragments; paging sorts by `startedAt` descending and then `_id` descending so equal timestamps remain deterministic. The sync operations UI keeps its pagination one-based and converts it at the API boundary; after deletion or an out-of-range URL, it uses the returned `total` and `pageSize` to recover to the last valid visible page.

`DELETE /lottery/records/sync-logs/{id}` removes one selected completed `LotteryRecordSyncLog` document. It is an explicit sync-operations history action: it does not delete or roll back any persisted lottery draw records, change the Redis sync lock, or call the external draw provider. The sync operations page confirms the action before deletion and reloads the paged history and sync summary after it succeeds. An unknown log ID returns `404`; a `RUNNING` log is protected by the backend service and returns `409 Conflict`, regardless of frontend state. Retry and scheduled-trigger endpoints remain available for backend compatibility, while Iteration 46 exposes manual sync as the only user-facing trigger.

The draw provider client must not pass empty upstream responses into JSON parsing. HTTP failures, blank bodies, invalid JSON, and provider business failures are converted into readable sync failure messages such as `彩票开奖接口请求失败，HTTP 403` or `彩票开奖接口未返回内容`, so operations pages do not show low-level parser errors like `argument "content" is null`. HTTP 403/407 responses are categorized as `PROXY_OR_NETWORK_BLOCK`; `/lottery/sync`, sync logs, probe logs, and CSV exports surface this category together with request mode and HTTP status.

## Workbench Contract

Iteration 09 introduces a daily workflow workbench under `/lottery/workbench`. The workbench is a composition layer over existing domain services, not a new source of lottery truth.

`LotteryWorkbenchSummary` should include:

```text
dailyState
latestDraw
latestSyncSummary
dataQualitySummary
latestPrediction
trainingStatus
pendingTicketCount
latestPrizeCheckSummary
ledgerSummary
generatedAt
```

`GET /lottery/workbench/summary` composes the latest records, sync summary, data quality, prediction status, ticket status, ledger snapshot, scheduled-sync runbook, daily operation summary, maintenance preview, and release checks into one response for the daily page. It does not fetch external provider data directly and does not duplicate prize or prediction scoring logic.

Iteration 11 keeps the backend workbench contract unchanged and enriches the frontend composition. `/lottery/workbench` now loads the summary, calendar state, budget status, recent predictions, recent tickets, recent experiments, recent backtests, and recent export audit events in parallel through project-owned APIs. The page renders a compact quick-action rail for sync, prediction, ticket entry, latest prize checking, ledger review, alerts, and export. Recent-work shortcuts link to specialist pages with URL-backed filters where available, so the workbench remains a command center rather than a replacement for prediction history, ticket, experiment, backtest, and export pages.

The first frontend personalization layer is intentionally browser-local. Prediction history, ticket list, and sync operations persist only their existing query parameters and page sizes in `localStorage`, then restore that state when the page is opened without explicit query parameters. Shared or bookmarked URLs remain authoritative, and clearing filters clears the saved state for that page. The workbench uses these saved paths as fallbacks when no daily-state drill-through path is more specific.

Iteration 13A adds browser-local workbench layout preferences under `one:lottery:workbench:widgets:v1`. The stored value controls visibility and order for the status grid, issue-focus strip, action queue, calendar, runbook, quick actions, prediction/training panels, daily-run/release panels, and recent-work panel.

Iteration 14A promotes those same widget keys into backend-backed preferences. `/lottery/workbench` now reads `GET /lottery/preferences`, applies `workbenchWidgetOrder` and `hiddenWorkbenchWidgets` when present, writes changes through `PUT /lottery/preferences`, and still writes the local `one:lottery:workbench:widgets:v1` payload as a browser fallback if the preference API is unavailable.

The 13A issue-focus strip keeps latest draw, next issue, prediction target, ticket issue, prize-check issue, and ledger outcome visible as one drill-through row. The action queue is derived from existing workbench state: daily-state items, scheduled sync warnings, operation pending actions, budget warnings, prediction actual-result attachment gaps, and non-passing release checks. No browser-side provider calls or new lottery-domain endpoints are introduced.

Iteration 22A adds a frontend-only current-issue closure widget to `/lottery/workbench`. It composes existing workbench summary fields, `LotteryDailyState` items, release checks, and recent export evidence into an ordered path: sync, prediction review, ticket handling, prize check, ledger review, and report/archive. Each step owns a project route handoff and status label, while the daily-run button remains the bounded backend orchestrator. This widget is not a new source of truth and does not add browser-side provider calls.

Iteration 13B adds `/lottery/predictions/decision` as a frontend decision board. It composes `GET /lottery/predictions`, `GET /lottery/predictions/rules/compare`, `GET /lottery/predictions/replay-metrics`, and prediction-linked ticket rows to compare primary predictions and candidate sets. URL parameters `targetIssue`, `ruleName`, `evidence`, and `resultState` preserve the board state. Selected candidates are saved through the existing `POST /lottery/tickets/batch` contract as draft `PREDICTION` tickets; the page does not introduce a browser-side lottery provider call.

Iteration 14A adds durable decision sets through `LotteryDecisionSet` and nested `LotteryDecisionCandidateSelection` documents in `lottery_decision_sets`. `GET /lottery/decision-sets` lists active saved sets with the shared page envelope, `POST /lottery/decision-sets` creates a set, `PUT /lottery/decision-sets/{id}` updates selected candidates, filters, notes, target issue, and conversion state, and `PATCH /lottery/decision-sets/{id}/archive` marks a set archived instead of deleting it. The decision board can save, reload, and archive these sets, shows unsaved-change state, and records `LotteryAuditEvent` rows for create, update, and archive actions.

Iteration 13C extends the ticket page as the decision follow-through surface. The paste/import assistant initially used the frontend preview parser and existing batch save API, while showing duplicate/invalid rows in mobile cards. Batch actions could update issue, quantity, cost, status, source, and note, and archive selected rows by setting `status=VOID` through the existing ticket update endpoint. Budget exposure cards are derived from loaded ticket rows and `/lottery/budget/status`; the settlement review combines ticket rows, `/lottery/ledger/issues`, latest prize-check output, and prediction source distribution for the active issue.

Iteration 14B productionizes those flows behind backend services. Ticket import preview, duplicate grouping, budget precheck, bulk patch, archive, and delete now all use project-owned `lottery/tickets/*` APIs and write audit events. The decision board also uses the ticket budget precheck before saving selected candidates as tickets, so direct prediction-to-ticket conversion receives the same warnings as pasted imports.

Iteration 13D adds report and release-readiness surfaces without changing backend contracts. `/lottery/research` now includes prediction evidence items, guided presets for latest prediction, strongest rule, volatile rule, and ticket outcomes, plus a print-ready report summary. `/lottery/exports` includes frontend release readiness checks for the new decision, ticket, research, and reused API-contract flows. Decision-board and ticket-settlement panels are marked as print-ready report areas.

Iteration 14C adds a lightweight frontend route smoke gate for the guided workflow. `npm run lottery:smoke` reads `one-web/scripts/fixtures/lottery-route-smoke.json`, validates protected route registration, lottery navigation, component API call points, fixture-backed empty/error text, and controlled console-error handling for `/lottery/workbench`, `/lottery/predictions/decision`, `/lottery/tickets`, `/lottery/research`, and `/lottery/exports`. It writes `one-web/reports/lottery-route-smoke-summary.json` as local release evidence and does not require live provider access. Authenticated browser QA still requires a local login session and backend service; proxy-related provider failures such as HTTP 403 are handled as sync/provider health evidence rather than route-smoke failures.

Iteration 14D adds a computed outcome contract for saved decisions. `GET /lottery/decision-sets/outcomes?limit=...&includeArchived=false` aggregates saved decision sets, attached prediction actual records, converted prediction tickets, and ledger performance into `LotteryDecisionOutcomeSummary`. Candidate outcome rows separate hit evidence from financial results: red/blue hits and prize labels come from attached actual results when available, while cost/prize/net/ROI come only from matched converted tickets. Each decision outcome item also includes rule/source deltas against existing ledger performance, candidate hit and prize distributions, stale/volatile/under-tested warning counts, and evidence alert messages.

Frontend outcome surfaces are intentionally report-like. `/lottery/workbench` shows decision outcomes as recent work, `/lottery/predictions/decision` shows the active or latest saved decision outcome with candidate cards, `/lottery/research` treats outcomes as a `decision` evidence kind for comparison and print summaries, and `/lottery/tickets` folds same-issue decision context into the settlement review. These surfaces remain evidence-oriented and do not imply future results.

Iteration 16 Week 1 adds lottery operations health as a cross-cutting summary, not a new source of truth. `GET /lottery/operations/health` composes existing provider freshness, record sync summary, data-quality report, ticket summary, saved decision outcomes, and export audit evidence into weighted contributors with `score`, `status`, `message`, `path`, and `pendingCount`. `/lottery/workbench` renders this as an operations-health widget and uses contributor paths to drill back into specialist routes. Health generation writes `LOTTERY_HEALTH_GENERATE`, data-quality refresh during health generation writes `DATA_QUALITY_REFRESH`, and `POST /lottery/operations/health/acknowledge` writes `LOTTERY_HEALTH_ACKNOWLEDGE` before returning a fresh health summary.

Iteration 16 Week 2 adds strategy notes as the durable hypothesis layer for research evidence. `LotteryStrategyNote` records the rule hypothesis, expected behavior, rule name, target issue, status, tags, and attached `LotteryStrategyNoteEvidence` rows in `lottery_strategy_notes`. `GET/POST/PUT/PATCH /lottery/strategy-notes` and `POST /lottery/strategy-notes/{id}/evidence` provide list, create, update, archive, and evidence-attachment operations. Evidence rows intentionally store only evidence keys, type labels, source ids, titles, and project-owned paths; they do not copy full prediction/backtest/outcome payloads. `/lottery/research/notebook` is the frontend workspace, while `/lottery/research` and `/lottery/predictions/decision` hand off selected evidence through URL parameters. Create, update, archive, and attach operations write `LotteryAuditEvent` rows with `strategy-note` target type.

Wave 11B adds `/lottery/research` as a frontend-only comparison studio. It composes existing experiment, backtest, prediction rule comparison, and ledger performance APIs into a normalized evidence model without adding backend contracts. The route stores selected comparison items in the `items` query parameter, supports deep links from experiment/backtest detail pages and the ledger performance panel, and shows compact ECharts views for stability/score, average red hits, blue hit rate, net result, ROI, hit rate, and prize distribution. Copy should remain evidence-oriented: historical replay and personal ledger evidence, not outcome promises.

Iteration 10 adds `LotteryDailyState` and `GET /lottery/workbench/daily-state`. The daily state is a compact resumability contract for the current issue. It contains latest issue, next issue, latest prediction id, sync/prediction/ticket/prize-check/quality state items, pending action keys, and `generatedAt`. Each state item includes status, message, optional pending count, updated time, and a project-owned drill-through path.

Daily state is derived from existing services:

```text
latest draw -> latestIssue and nextIssue
sync summary -> sync state
latest prediction -> prediction state
ticket page query -> next-issue ticket and latest-issue prize-check state
data-quality report -> quality state
```

It should not fetch external providers directly and should not replace specialized pages. The workbench uses daily state badges and links to route users into filtered prediction history, tickets, sync, ledger, and data-quality pages.

`POST /lottery/workbench/daily-run` returns a list of step results:

```text
step
status
message
startedAt
finishedAt
savedCount
checkedCount
updatedCount
error
```

The daily run is intentionally bounded. Safe steps are record sync, latest actual attachment for matching prediction snapshots, latest pending-ticket prize checking, and statistics summary refresh. Each step returns its own status, timestamps, counts, and error message if it fails. Prediction training remains explicit because it can be long-running; the workbench surfaces current training status instead of silently starting training.

Wave 12D extends the workbench with release-hardening state:

```text
scheduledSyncRunbook -> enabled, cron, last run/status/duration/failure category, next run, health status
operationSummary -> completed/warning/pending daily operation counts, pending actions, quality issues, prize-check tickets, prediction attachment count
maintenanceSummary -> cache and collection retention preview
releaseCheckSummary -> retention/export checks plus manual backend-test, frontend-build, documentation, and commit/push checklist items
```

The scheduled-sync runbook is derived from `RecordProperties`, sync logs with `jobName=scheduled-record-sync`, and the configured cron expression. Release checks are deliberately conservative: retention/export checks can pass automatically, while test/build/docs/push items remain `MANUAL` and should be confirmed in the delivery notes for each completed iteration.

## Pagination Contract

Growing list APIs should support a shared pagination envelope:

```text
items
page
pageSize
total
hasNext
```

Iteration 09 should migrate high-growth lottery lists first: prediction history, ticket list, record sync logs, and provider probe logs. Existing limit-based APIs should remain compatible during the migration so current pages do not break while new query-parameter-backed controls are added. Prediction history, ticket list, sync logs, and provider probe logs use compatibility mappings: requests without `page` return the legacy array response, while requests with `page` return the shared pagination envelope.

Initial list filter targets:

- Predictions: result state, target period, rule id, rule name, created-time range.
- Tickets: issue, status, source, prize grade, prediction snapshot id, created-time range.
- Sync logs: status, started-time range.
- Provider probe logs: provider, availability, checked-time range.

## Intelligence Platform Contract

Iteration 10 is a longer platform iteration that should be delivered in independent waves after the workbench foundation is usable.

Strategy experiments are durable research records, not replacements for the active prediction rule. A `LotteryStrategyExperiment` should capture:

```text
id
strategyName
parameters
replayWindow
inputSource
candidates
scoreDistribution
outcomeSummary
tags
notes
createdAt
updatedAt
```

Wave 10B implements `LotteryStrategyExperiment` in MongoDB with:

```text
strategyName
scale
replayWindow
inputSource
bestRule
outcomeSummary
scoreDistribution
generatedCandidates
latestPrediction
tags
notes
createdAt
updatedAt
```

Initial experiment runs reuse the existing training service so the experiment record can capture the same candidate and score evidence users already trust. If a future wave needs no-side-effect experiments, the training algorithm should be split into a pure replay component before adding a second execution path.

Experiment endpoints:

```text
POST  /lottery/experiments/run
GET   /lottery/experiments
GET   /lottery/experiments/{id}
PATCH /lottery/experiments/{id}
```

`GET /lottery/experiments` uses the shared pagination envelope and supports `strategyName`, `tag`, `createdStartAt`, and `createdEndAt` filters.

Backtests should preserve enough evidence to audit a strategy later. A `LotteryBacktestReport` should capture:

```text
id
experimentId
strategyName
presetWindow
requestedWindow
issueStart
issueEnd
replayCount
rows
averageRedHits
blueHitRate
bestScore
prizeDistribution
stabilityScore
totalCost
totalPrize
netResult
bankrollSimulation
createdAt
```

Wave 10C implements the first durable backtest loop with a baseline previous-draw replay strategy. A run stores the generated replay rows, prize hit distribution, cost/prize/net summary, and bankroll points so the report detail can be audited later without re-running the job. `presetWindow` keeps the user-facing period choice, while `requestedWindow` records the numeric window used for custom runs and future exports. The latest backtest summary for a matching `strategyName` is attached to rule comparison and ledger source/rule performance rows so research evidence can be reviewed beside live ticket outcomes.

Backtest endpoints:

```text
POST /lottery/backtests/run
GET  /lottery/backtests
GET  /lottery/backtests/{id}
```

`GET /lottery/backtests` uses the shared pagination envelope and supports `strategyName`, `presetWindow`, and `experimentId` filters.

Alerts and calendar state are app-local workflow helpers. They track next draw date, expected sync window, pending daily steps, acknowledgement state, and generated timestamps. External notifications should not be introduced until a provider is explicitly selected and documented.

Wave 10D implements `LotteryCalendarState` and `LotteryReminderAcknowledgement`. Calendar state is derived from backend daily-state services and the latest draw, not browser-only date math. Reminders are generated for pending sync, prediction, ticket confirmation, and prize-check work. Acknowledgement is keyed by reminder key plus fingerprint, so an acknowledged reminder stays hidden until its underlying status, path, or pending count changes.

Calendar and reminder endpoints:

```text
GET  /lottery/calendar
POST /lottery/alerts/{key}/ack
```

The frontend uses `/lottery/alerts` as the in-app reminder page and shows the next draw window on the workbench.

V13 Week 3 adds the daily action reminder center on top of the calendar reminder base. `LotteryReminderService` generates `LotteryReminderSummary` from the current calendar, workbench daily state, sync summary, data quality report, ticket summary, decision-outcome summary, and recent export audit events. The summary includes active, due, snoozed, and acknowledged counts, plus grouped reminder items with direct route handoff paths. Confirm and snooze actions are stored as `LotteryAuditEvent` rows under `lottery-reminder`, so the generated reminders remain source-of-truth driven while user actions stay auditable.

Action reminder endpoints:

```text
GET  /lottery/reminders/summary
POST /lottery/reminders/{key}/ack
POST /lottery/reminders/{key}/snooze
```

Lottery preferences now include `reminderDrawWindowHours`, `reminderDefaultSnoozeMinutes`, and `monthEndExportChecklistEnabled`; the settings page owns these controls and the workbench uses them to decide when upcoming draw and month-end export reminders become actionable.

V13 Week 4 adds the month-end review surface at `/lottery/month-end`. It is a frontend composition over existing project-owned APIs: workbench summary, operations health, ledger summary/issues, ticket summary, saved decision outcomes, strategy notes, reminder summary, and export audit events. The page computes a lightweight month-end score from health, ticket closure, decision warnings, export evidence, and active reminders, then links each metric back to the owning specialist page. It does not introduce a second reporting backend or duplicate ledger math.

The export builder now exposes a `月末治理包` preset that combines ledger, tickets, decision sets, decision outcomes, settlement reviews, budget prechecks, ticket import previews, rule evidence, replay evidence, sync logs, and provider probe logs. Route smoke coverage includes the month-end page and verifies the reused API contract members; release readiness on `/lottery/exports` now lists month-end dashboard, reminder center, and strategy notebook coverage.

V14 Week 1 adds strategy portfolios as the next execution layer. `LotteryStrategyPortfolio` stores named portfolios with allocation weight, tags, and weighted evidence links for rules, experiments, backtests, saved decisions, and strategy notes. `LotteryStrategyPortfolioService` keeps the portfolio document as references only, then derives `LotteryStrategyPortfolioSummary` from the owning source records and decision outcome summaries: health score, health status, ROI, warning count, replay count, evidence coverage, and per-type counts are generated on read.

Strategy portfolio endpoints:

```text
GET   /lottery/strategy-portfolios
GET   /lottery/strategy-portfolios/{id}
POST  /lottery/strategy-portfolios
PUT   /lottery/strategy-portfolios/{id}
PATCH /lottery/strategy-portfolios/{id}/archive
```

The frontend board at `/lottery/strategy-portfolios` is intentionally dense and operation-oriented: portfolio cards expose health, ROI, coverage, warning columns, allocation weights, evidence counts, and evidence-row handoffs back to research, experiments, backtests, decision outcomes, and notebook pages.

V14 Week 2 adds a simulation sandbox for what-if ticket execution. `LotterySimulationRequest` accepts a target issue, budget limit, replay window, rule weights, portfolio IDs, and hypothetical candidate tickets. `LotterySimulationService` normalizes those tickets as `SIMULATION`/`DRAFT`, runs the existing ticket budget precheck, reads latest prediction replay distributions, loads strategy portfolio summaries as evidence context, and returns projected cost, risk level, warnings, candidate detail, hit/prize distributions, and portfolio summaries without saving tickets.

Simulation endpoint:

```text
POST /lottery/simulations/run
```

The frontend sandbox at `/lottery/simulator` keeps the workflow operational: sliders tune rule weights, text input previews candidate tickets, result panels show budget exposure and replay distribution bars, and handoff buttons route into the decision board, ticket import preview, strategy notebook, and export builder.

V14 Week 3 adds guided ticket-pack execution. `LotteryTicketPack` is the review boundary between decision/simulation evidence and durable `LotteryTicket` rows. It stores source type/source ID, target issue, draft items, approval state, budget precheck, warnings, saved ticket IDs, and audit metadata. Decision-set packs can be generated from saved decision candidates; simulator and portfolio packs can submit candidate items directly.

Ticket-pack endpoints:

```text
GET   /lottery/ticket-packs
POST  /lottery/ticket-packs/preview
POST  /lottery/ticket-packs
PATCH /lottery/ticket-packs/{id}/approve
POST  /lottery/ticket-packs/{id}/save-tickets
PATCH /lottery/ticket-packs/{id}/archive
```

`LotteryTicketPackService` reuses the existing ticket budget precheck for preview and approval, then reuses ticket batch-save for the final save-as-tickets action. Every preview, create, approve, save, and archive action writes a `LotteryAuditEvent` under `lottery-ticket-pack`. The frontend execution board at `/lottery/ticket-packs` shows pending approvals, conflict/warning rows, budget status, candidate balls, and handoff into `/lottery/tickets`; the workbench quick-action rail links directly to the ticket-pack queue.

V14 Week 4 adds the governance surface at `/lottery/governance`. It is a frontend composition over project-owned APIs rather than a separate reporting backend: strategy portfolio summaries, simulation audit events, ticket packs, reminders, operations health, workbench release checks, and export audit evidence are loaded together and scored against configurable thresholds.

Governance thresholds are stored on `LotteryPreference`:

```text
governancePortfolioScoreThreshold
governanceSimulatorHighRiskLimit
governanceTicketPackBudgetExposurePercent
governanceEvidenceFreshnessDays
governanceStaleApprovalHours
```

The settings page owns these controls. The governance board uses them to mark domains as `PASS`, `WARNING`, `FAILED`, or `MANUAL`, then routes users back to the owning surface: strategy portfolios, simulator, ticket packs, reminders/month-end, research, exports, or settings. Route smoke now covers `/lottery/governance`, and export release-readiness rows explicitly include V14 strategy portfolios, simulator, ticket packs, and governance evidence.

V15 Week 1 adds outcome attribution as the first closed-loop learning layer. `LotteryOutcomeAttribution` is a read model generated from durable tickets, ticket packs, decision outcomes, strategy portfolio summaries, and lottery audit events. It returns issue-level cost/prize/net/ROI, calibration state, prize distribution, portfolio contributions, decision contributions, ticket-pack execution summaries, simulation drift rows, and a cross-surface attribution timeline.

Outcome attribution endpoints:

```text
GET /lottery/outcomes
GET /lottery/outcomes/rollup?window=recent10&limit=50
GET /lottery/outcomes/{issue}
```

`GET /lottery/outcomes/rollup` aggregates the same issue-level read models into bounded windows: `latest`, `recent10`, `month-to-date`, or `all` with a server-side limit cap. The response includes issue count, ticket/checked/winning counts, cost/prize/net/ROI totals, calibration distribution, and dimension rows for issue, portfolio, rule, ticket-pack source, ticket-pack execution state, simulator risk, and recommendation lifecycle. Each row carries sample count, warning count, optional net/ROI evidence, state, evidence-quality label, and the owning UI path.

The backend service writes `LOTTERY_OUTCOME_ATTRIBUTION` audit events when attribution is generated. The frontend route `/lottery/outcomes` shows recent issues, contribution cards, drift rows, prize distribution, and timeline handoffs into tickets, ticket packs, simulator, strategy portfolios, and decision board. Ticket settlement, month-end review, governance, and strategy portfolio pages link back to this route so post-draw review can start from the user's current workflow.

V15 Week 2 turns attribution output into a recommendation lifecycle. `LotteryRecommendation` stores rule, portfolio, issue, and simulator targets with `PROMOTE`, `WATCH`, `PAUSE`, or `RETIRE` recommendation states, `OPEN`, `APPLIED`, `SNOOZED`, or `ARCHIVED` lifecycle status, confidence score, evidence age, expected action, reasons, linked evidence, handoff path, archive state, and audit metadata. The refresh service reads recent outcome attribution rows, upserts target-scoped recommendation records, and writes `LOTTERY_RECOMMENDATION_REFRESH` audit events. Status changes write `LOTTERY_RECOMMENDATION_STATUS` audit events and archive records when the lifecycle status becomes `ARCHIVED`.

Recommendation endpoints:

```text
GET /lottery/recommendations
GET /lottery/recommendations/{id}
POST /lottery/recommendations/refresh
PATCH /lottery/recommendations/{id}/status
```

The frontend route `/lottery/recommendations` presents promote/watch/pause/retire lanes with confidence, evidence age, expected action, reasons, refresh controls, and one-click lifecycle actions. Strategy portfolios, research notebook, governance, simulator, and prediction decision pages link into the recommendation board so lifecycle review can start from the work surface where stale evidence or strategy drift is discovered.

V15 Week 3 adds a mobile command surface without introducing another backend aggregate. `/lottery/mobile` reuses existing workbench, operations health, reminder, ticket-pack, outcome attribution, and recommendation lifecycle APIs to build compact cards for today, next draw, pending approvals, stale evidence, settlement gaps, and release blockers. This keeps mobile behavior aligned with desktop source-of-truth services while avoiding a second summary contract until payload size or latency requires it.

Mobile command data sources:

```text
GET /lottery/workbench/summary
GET /lottery/operations/health
GET /lottery/reminders/summary
GET /lottery/ticket-packs
GET /lottery/outcomes
GET /lottery/recommendations
```

Mobile batch actions call the existing reminder, ticket-pack, and recommendation lifecycle endpoints. The page exposes action, ticket-pack, outcome, and recommendation segments with large touch targets for confirm, snooze, approve, save-as-ticket, apply, defer, and handoff navigation. Workbench, alerts, governance, ticket packs, and month-end review link into `/lottery/mobile` while preserving their full desktop routes.

V15 Week 4 closes the adaptive review loop through export-side evidence instead of adding unsupported CSV contracts. `/lottery/exports` now provides four V15 report presets: `归因闭环包`, `推荐生命周期包`, `移动指挥包`, and `V15治理证据包`. Each preset reuses existing supported export sections such as ledger issues, tickets, decision sets, decision outcomes, settlement reviews, budget prechecks, rule evidence, replay evidence, sync logs, and probe logs.

The export page also owns V15 evidence-pack cards for attribution, recommendation lifecycle, mobile command, and governance evidence. Audit filters include outcome attribution and recommendation refresh/status event types, while release-readiness rows explicitly cover `/lottery/outcomes`, `/lottery/recommendations`, `/lottery/mobile`, and the V15 governance evidence pack. The route smoke fixture targets the Week 4 release evidence slice and keeps `/lottery/outcomes`, `/lottery/recommendations`, `/lottery/mobile`, `/lottery/governance`, and `/lottery/exports` in the same static verification gate.

Portfolio-style governance extends preferences and ledger behavior with budget and exposure thresholds. The backend flags budget and max-ticket issues without blocking ordinary CRUD unless a future explicit enforcement mode is added.

Wave 10E extends `LotteryPreference` with `weeklyBudget`, `monthlyBudget`, `maxTicketsPerIssue`, and `budgetReminderPercent`. `GET /lottery/budget/status` reads preferences and recorded tickets to return weekly/monthly usage, max issue exposure, and restrained warning rows for the workbench and ticket page. `LotteryLedgerSummary` also includes rolling 30-day cost/prize/net/ROI plus max/current drawdown values for exposure review.

Budget endpoint:

```text
GET /lottery/budget/status
```

Exports and audit trails should be reproducible. Export endpoints should record export type, filters, generated row count, generatedAt, and requester scope. Audit metadata should be attached to generated predictions, saved tickets, daily-run steps, strategy experiments, backtests, and exports.

Wave 10F implements the first export, audit, and maintenance foundation. `LotteryExportResult` returns a CSV-shaped payload with `exportId`, `exportType`, `format`, `filters`, `rowCount`, `requesterScope`, `generatedAt`, `fileName`, and `content`. `LotteryAuditEvent` stores export audit rows in `lottery_audit_events` with event type, target type/id, requester scope, filters, row count, message, and generated time. `LotteryAuditMetadata` is attached to touched tickets, prediction snapshots, strategy experiments, backtest reports, and daily-run step results so later reports can explain when and why a durable record was generated or updated.

Export endpoints:

```text
GET /lottery/exports/{type}
GET /lottery/audit/events
```

Supported export types:

```text
tickets
ledger-issues
predictions
experiments
backtests
rule-evidence
replay-evidence
decision-sets
decision-outcomes
ticket-import-previews
budget-prechecks
settlement-reviews
sync-logs
probe-logs
```

The first export service applies explicit filters such as `issue`, `status`, `source`, `targetPeriod`, `targetIssue`, `ruleId`, `strategyName`, `presetWindow`, `ruleName`, `window`, `provider`, and `limit` depending on export type. Prediction exports include evidence and actual-hit columns. `rule-evidence` exports rule comparison evidence rows, `replay-evidence` exports the latest replay drift summary, and the 14D decision exports flatten saved decision sets, candidate outcomes, ticket-import audit events, budget-precheck audit events, and settlement rows. The export response and audit event both record the normalized filters and generated row count. `limit` is capped server-side for bounded API payloads. `GET /lottery/audit/events` uses the shared pagination envelope with `items`, `page`, `pageSize`, `total`, and `hasNext`.

`LotteryMaintenanceSummary` reports non-destructive maintenance previews for caches, old logs, repair/export audit rows, replay evidence, and high-growth history collections. It includes `dryRun`, collection rows with total count, stale count, retention days, oversized count, cleanup support, cache rows with presence and TTL status, message, and generated time. Wave 12D covers `lottery_record_sync_logs`, `lottery_provider_probe_logs`, `lottery_audit_events`, `lottery_prediction_rules`, `lottery_training_reports`, `lottery_prediction_snapshots`, `lottery_strategy_experiments`, and `lottery_backtest_reports`.

Maintenance endpoints:

```text
GET  /lottery/maintenance/summary
POST /lottery/maintenance/cleanup/dry-run
```

The cleanup endpoint is a dry-run only. It currently reports lottery cache presence/TTL, old sync/probe logs, and oversized prediction, experiment, and backtest histories without deleting data. Destructive cleanup should require a separate confirm-only policy before it is added.

Suggested platform endpoint groups:

```text
lottery/experiments/*
lottery/backtests/*
lottery/alerts/*
lottery/calendar/*
lottery/budget/*
lottery/exports/*
lottery/audit/*
lottery/maintenance/*
```

## API Design Rules

- Keep existing APIs compatible while adding new `lottery/*` APIs.
- New record work should prefer `/lottery/records/*`; existing `/record/*` endpoints are legacy-compatible wrappers until callers are migrated.
- Record sync returns a persisted operation log so frontend pages can show status, saved count, issue range, and failure message.
- Record sync summary is calculated from the same persisted logs, with `limit` capped server-side.
- Record sync status values include `RUNNING`, `SUCCESS`, `FAILED`, and `SKIPPED`; `SKIPPED` means another sync already holds the Redis lock.
- Scheduled record sync is implemented by `LotteryRecordScheduledSync`, disabled by default through `hello.record.scheduled-sync-enabled`, and shares the same sync service, lock, and logs as manual sync.
- `RecordUpdater` filters provider results before persistence: records at or before the current last issue are skipped, duplicate issue codes in the same fetch are ignored, and new records receive sequential line numbers from the last persisted record.
- Return normalized project DTOs only.
- Use explicit filters rather than overloading vague request bodies.
- Support pagination for list/history endpoints that can grow.
- New paged APIs should use `items`, `page`, `pageSize`, `total`, and `hasNext` consistently.
- Add status/message fields for sync, provider, and training operations.
- Long-running strategy experiments and backtests should return durable operation records or report IDs rather than only transient status text.
- Export and maintenance endpoints should support dry-run or preview behavior when data loss or large output is possible.
- Use millisecond timestamps for API/cache time fields.

## Frontend Rules

- Keep existing visual analysis pages, but route shared data through common APIs and utilities.
- `RecordContext` is the first migrated shared frontend data layer: it reads paged `/lottery/records/draws`, sorts draws by period/issue ascending for legacy time-series semantics, exposes normalized `lotteryDraws`, and keeps `allRecords` as 14-digit compact strings until analysis pages are migrated.
- Do not duplicate lottery number parsing across pages when a shared helper exists.
- Keep prediction UX research-oriented and avoid guaranteed-win language.
- Ticket and ledger pages should be quiet, record-focused, and explicit about cost and outcome.
- The sync operations page should read backend summaries and provider probe logs rather than recalculating operational health only in the browser.
- The data quality page should use a two-step repair flow: generate a backend dry-run plan first, then enable confirm only for provider-backed missing issues.
- Prediction pages should read `LotteryPreference` for default training scale, replay count, automatic prediction ticket saving, and default ticket source. Operational entry points should surface data-quality warnings from the backend report instead of hiding them behind a separate page.
- The workbench page should be the daily entry point and use drill-through links into records, predictions, tickets, ledger, sync, and data quality rather than replacing those specialized pages.
- Experiment, backtest, alert, export, and audit pages should stay research- and evidence-oriented; they should not add promotional language or imply guaranteed outcomes.

## Verification Strategy

Backend:

- Unit-test number normalization and prize grade calculation.
- Unit-test sync idempotency and duplicate issue handling.
- Unit-test prediction scoring and actual-result attachment.
- Controller-test repeated filters and pagination for list endpoints.

Frontend:

- Build after route/API type changes.
- Run `npm run lottery:smoke` after changing the lottery workbench, decision, ticket, research, or export/release pages; the report is written to `one-web/reports/lottery-route-smoke-summary.json`.
- Verify empty, loading, error, and stale-cache states.
- Verify mobile layout for dense tables and chart pages.

Data:

- Check missing issue numbers.
- Check duplicate issue numbers.
- Check invalid red/blue number ranges.
- Check future draw dates.
- Check mismatched derived fields after sync.
