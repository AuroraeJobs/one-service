# Iteration 25 Plan: One-Command Frontend Release Check

## Version Goal

Make frontend lottery release validation harder to run incompletely. The release evidence report and production build should be available through one command before a milestone is committed or handed off.

## Scope Principles

- Reuse the existing smoke, evidence, and build commands.
- Keep browser screenshots separate because they still require login and backend availability.
- Do not add new runtime behavior or backend contracts for this validation-only slice.
- Keep generated release evidence committed only after the release check has passed.

## Wave 25A: Release Check Script

Goal: add one command that refreshes release evidence and verifies the frontend production build.

- Add an npm script that runs `lottery:release-evidence` and then `build`.
- Update lottery docs to use the one-command release check as the default frontend release gate.
- Keep `lottery:smoke` and `lottery:release-evidence` available for narrower checks.

Acceptance:

- `npm run lottery:release-check` passes in `one-web`.
- The generated evidence report remains available at `one-web/reports/lottery-release-evidence.md`.
- `git diff --check` passes.

## Wave 25B: Freshness Guard

Goal: make stale generated evidence harder to commit.

- Add a check mode that compares the generated Markdown evidence with the current smoke summary and fixture.
- Fail when the committed Markdown evidence is stale.
- Keep the check deterministic enough for local and CI use.

Acceptance:

- A stale `lottery-release-evidence.md` fails the guard.
- A freshly generated report passes without rewriting files.

## Delivery Rule

Each wave should update `docs/lottery/iterations/checklist.md`, run verification, review diff, commit, and push.
