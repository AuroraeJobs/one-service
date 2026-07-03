# Lottery Quality Gates

Last updated: 2026-07-03

Use these gates when finishing a lottery milestone.

## Backend

- Changed services have focused unit tests.
- Changed controllers have controller tests or a documented manual verification path.
- Sync operations are idempotent for duplicate issue data.
- Provider failures return controlled status/messages instead of leaking low-level exceptions.
- Long-running training has visible status and does not start duplicate jobs.
- List endpoints that can grow support pagination or have a documented limit.

## Frontend

- API types in `one-web/src/services/api.ts` match backend DTOs.
- Pages handle empty, loading, error, and stale states.
- Dense chart/table pages fit mobile and desktop layouts.
- Prediction copy stays research-oriented and avoids guaranteed outcome wording.
- Personal ticket and ledger pages show cost and outcome clearly.

## Data

- Red numbers are normalized to six sorted two-digit strings.
- Blue number is normalized to one two-digit string.
- Issue number uniqueness is enforced or guarded by service logic.
- Derived statistics can be recalculated after record sync.
- Redis cache keys are invalidated or refreshed after source data changes.

## Documentation

- Update `docs/lottery/iterations/checklist.md`.
- Update `docs/lottery/modules/technical-design.md` for architecture or contract changes.
- Update `docs/lottery/menu-and-version-plan.md` when routes or menu scope changes.
- Record verification commands and known unrelated failures in the final handoff.
