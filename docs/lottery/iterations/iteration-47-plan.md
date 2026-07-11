# Iteration 47: MiniGPT Lottery Research Loop V1

Theme: 可复现彩票语料、模型候选与研究闭环

## Version Goal

Build a reproducible MiniGPT lottery research chain on top of the existing corpus export, candidate validation, decision-set, and random-baseline backtest capabilities. The iteration starts by making corpus inputs and the train/validation boundary durable and auditable before extending generation or outcome-review behavior.

Status: Wave 47A completed on 2026-07-11. Wave 47B is the next delivery target; Waves 47C-47D remain follow-up work.

## Starting Point

- `POST /ai/minigpt/corpus/lottery/export` already exports raw-draw and structural-feature text to the legacy `data/lottery-<format>.txt` paths.
- The MiniGPT page can export those two formats, inspect corpus/tokenizer information, run generation comparisons, validate lottery candidates, and save usable candidates as decision-set drafts.
- Decision-set backtests can already attach a same-window random baseline and hand evidence into research notes and exports.
- The missing foundation is a strategy-sample corpus, immutable version metadata, a deterministic full-row time split, and a UI/API handoff that makes the exact training and validation inputs visible.

## Scope Principles

- Treat corpus bytes, split boundaries, source ranges, hashes, and template versions as research provenance.
- Use complete serialized samples as the split unit; never split a sample line across train and validation files.
- Keep every training issue earlier than every validation issue and reject insufficient data instead of silently falling back to a random split.
- Preserve the legacy full-corpus files and response fields while exposing versioned full, train, validation, and manifest artifacts to new clients.
- Keep MiniGPT output framed as research material. Training loss or historical-window performance is not evidence of future winning probability.
- Keep checklist items unchecked until implementation and matching verification evidence are present.

## Wave 47A: Reproducible Corpus And Time-Split Baseline

Goal: make every lottery corpus export a reproducible, inspectable research input.

- Add `strategy` beside `raw` and `features`, using complete rows with `target`, `strategy`, normalized red/blue numbers, and deterministic reason tags.
- Sort normalized draws by issue ascending, then split complete rows into the earlier 80% training set and later 20% validation set.
- Reject exports that cannot produce at least one training row and one validation row.
- Persist each export under `data/lottery-corpora/<format>/<corpusVersion>/` with `all.txt`, `train.txt`, `validation.txt`, and `manifest.json`.
- Record schema/template versions, corpus version, split mode and ratio, ordering, source and split counts/ranges, artifact paths, content hashes, and generation time in the export DTO and manifest.
- Keep `data/lottery-<format>.txt` and the existing `dataPath`/`filePath` response fields as full-corpus compatibility paths. Expose `fullDataPath`/`fullFilePath` for the versioned `all.txt`, plus explicit train, validation, and manifest paths.
- Update the MiniGPT page to export all three formats, display provenance and split details, and fill the training form from `trainDataPath` rather than the unsplit compatibility file.
- Add focused backend and frontend coverage for format validation, deterministic output, non-overlapping chronological splits, manifest/hash accuracy, compatibility paths, and visible split metadata.

Acceptance:

- The same normalized draw snapshot, format, schema/template versions, and split configuration produce identical corpus bytes, boundaries, and SHA-256 hashes.
- Every emitted row remains intact in exactly one split, the latest training issue is earlier than the first validation issue, and neither split is empty.
- `strategy` rows are parseable, use legal normalized numbers, and contain only documented strategy and reason labels.
- Old callers can continue using `dataPath`/`filePath`; new training actions use the versioned training artifact and can identify the paired validation artifact and manifest.
- Focused tests cover raw/features/strategy serialization, small-data rejection, split rounding and boundaries, repeatability, paths, hashes, and DTO/manifest fields.

## Wave 47B: Training And Generation Provenance

Goal: connect a versioned corpus to reproducible training and candidate-generation runs.

- Require a training context long enough to contain at least one complete structured sample and surface a clear validation error when it is not.
- Record corpus version, train/validation hashes, run id, checkpoint, prompt, temperature, top-k, and model parameters with generated output.
- Turn parse and repair results into explicit evidence: parseable rate, legal-number rate, repair reasons, and post-repair legal-number rate.
- Produce differentiated candidate batches with controlled red-ball overlap, blue-ball coverage, and documented strategy composition.

This wave is the next delivery target now that Wave 47A is complete.

## Wave 47C: Random-Baseline And Outcome Chain

Goal: carry a provenance-backed candidate pool through the existing manual research workflow.

- Run time-window backtests against a same-budget, same-window random baseline.
- Preserve corpus/run/generation provenance when candidates become a decision set, ticket-pack draft, or research-note attachment.
- Connect saved decisions and tickets to actual draw results, prize/ledger outcomes, and explicit promote/watch/pause/retire review actions.
- Report candidate diversity, red-hit distribution, blue-hit rate, prize distribution, cost, prize estimate, ROI, random-baseline delta, and overfit warnings.

This wave remains follow-up work until the corpus and generation evidence are stable.

## Wave 47D: Month-End Review And Release Evidence

Goal: make the first research loop reviewable and safe to hand off.

- Include MiniGPT corpus/run/candidate/backtest provenance in month-end research review and export evidence.
- Keep all conclusions framed as historical-window research and show the random baseline beside model-derived results.
- Update the lottery README, long-term plan, selection/training strategy, technical design, quality gates, and authoritative checklist.
- Run focused backend tests plus frontend i18n audit, lottery smoke/release check, file-scoped ESLint, production build, and browser QA for changed surfaces.
- Review generated evidence, staged scope, `git status --short`, and `git diff --check` before delivery.

This wave remains follow-up work until Waves 47A-47C have verifiable evidence.

## Out Of Scope

- Claims that a model can guarantee a prize or improve future winning probability.
- Automatic ticket purchase, unattended betting, or model output bypassing compliance and budget checks.
- Random train/validation splitting for the formal Iteration 47 research baseline.
- Replacing existing decision-set, ticket, backtest, ledger, or month-end domains when a provenance link is sufficient.

## Completion Evidence

- Backend corpus/export coverage passed: `MiniGptLearningServiceTest` 10/10, `LotteryBacktestServiceTest` 3/3, and `MiniGptLearningControllerTest` 4/4. Coverage includes deterministic serialization and hashes, complete-row time boundaries, compatibility and manifest paths, first-publication concurrency, atomic temporary-file cleanup, 422 validation responses, and 500 filesystem-failure responses.
- Frontend gates passed from the staged-only snapshot: file-scoped ESLint, `npm run i18n:audit` (1028 localized calls checked), `npm run lottery:smoke` (831 checks across 18 routes), and `npm run lottery:release-check`, including the production TypeScript/Vite build.
- Real local browser QA passed on `/ai/minigpt`: Chinese/dark desktop and English/light 390x844 layouts exported strategy corpus version `5b3ff42350a30648...`, displayed 2000 total draws, 1600 training draws (`2013037`-`2023131`), 400 validation draws (`2023132`-`2026078`), hashes and manifest, and filled the versioned train/validation paths into the paired form fields.
- Generated corpus artifacts remain outside Git; UI preferences and temporary viewport were restored after QA. Training execution and full run/checkpoint provenance remain Wave 47B work.
