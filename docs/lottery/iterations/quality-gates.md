# Lottery Quality Gates

Last updated: 2026-07-04

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
- Export and maintenance endpoints have dry-run, preview, or bounded-output behavior where appropriate.

## Frontend

- API types in `one-web/src/services/api.ts` match backend DTOs.
- Pages handle empty, loading, error, and stale states.
- Dense chart/table pages fit mobile and desktop layouts.
- Prediction copy stays research-oriented and avoids guaranteed outcome wording.
- Personal ticket and ledger pages show cost and outcome clearly.
- Saved decision outcomes separate candidate hit evidence from converted-ticket financial results.
- Workbench drill-through links preserve useful filters in query parameters.
- Experiment, backtest, alert, export, and audit pages keep research language restrained and evidence-oriented.
- Run `npm run lottery:smoke` in `one-web` after changing `/lottery/workbench`, `/lottery/predictions/decision`, `/lottery/tickets`, `/lottery/research`, or `/lottery/exports`; this fixture smoke does not require live provider access.
- Browser QA for those routes still requires a valid local login session and backend service. Proxy-related provider failures, including HTTP 403 when a proxy is enabled, should be recorded as provider/sync evidence rather than treated as route-render failures.

## Data

- Red numbers are normalized to six sorted two-digit strings.
- Blue number is normalized to one two-digit string.
- Issue number uniqueness is enforced or guarded by service logic.
- Derived statistics can be recalculated after record sync.
- Redis cache keys are invalidated or refreshed after source data changes.
- Audit metadata is preserved for generated predictions, saved tickets, daily-run steps, experiments, backtests, and exports once those flows exist.

## Documentation

- Follow `docs/engineering/commit-and-versioning.md` for commit messages and release version changes.
- Update `docs/lottery/iterations/checklist.md`.
- Update `docs/lottery/modules/technical-design.md` for architecture or contract changes.
- Update `docs/lottery/menu-and-version-plan.md` when routes or menu scope changes.
- Record verification commands and known unrelated failures in the final handoff.
