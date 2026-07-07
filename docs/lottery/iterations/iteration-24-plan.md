# Iteration 24 Plan: Release Evidence Packaging

## Version Goal

Make lottery release evidence easy to read, commit, and hand off. Automated route smoke already produces JSON; this iteration turns that output into a concise Markdown package that records static coverage and the remaining protected-browser QA requirements.

## Scope Principles

- Keep the evidence package local and reproducible.
- Generate evidence from existing smoke output instead of duplicating route definitions.
- Keep browser screenshots as preferred visual evidence when login and backend are available.
- Do not weaken production authentication or add browser-side provider calls for QA convenience.

## Wave 24A: Markdown Release Evidence

Goal: produce a human-readable release evidence report from the route smoke summary.

- Add a script that reads `reports/lottery-route-smoke-summary.json`.
- Include target, generated time, status, route count, check count, and failure count.
- Include source guard coverage from the smoke fixture.
- Include checked protected routes with component/API/empty/error state counts.
- Include protected browser QA prerequisites and the known backend/proxy blocker signature.
- Add an npm script that refreshes smoke output and then writes the evidence report.

Acceptance:

- `npm run lottery:release-evidence` writes `reports/lottery-release-evidence.md`.
- The report distinguishes static smoke evidence from browser screenshot readiness.
- `npm run build` and `git diff --check` pass.

## Wave 24B: Evidence Surface Handoff

Goal: make the generated report discoverable from lottery documentation and future release work.

- Link the evidence report from the lottery README and quality gates.
- Add guidance for when to regenerate the report.
- Record any manual screenshot paths or blockers next to the generated report when browser QA is available.

Acceptance:

- A future thread can find the latest generated evidence without opening script internals.
- Documentation keeps the production-authentication rule intact.

## Delivery Rule

Each wave should update `docs/lottery/iterations/checklist.md`, run verification, review diff, commit, and push.
