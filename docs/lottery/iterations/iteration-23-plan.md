# Iteration 23 Plan: Protected Frontend QA And Release Evidence

## Version Goal

Reduce the gap between static frontend verification and real protected-route QA. The lottery module should keep useful release evidence even when local login state or backend proxy availability blocks browser screenshots.

## Scope Principles

- Keep route smoke fast, local, and provider-network independent.
- Do not bypass production authentication behavior in application code.
- Add source-level checks only for release-critical UI guarantees that browser QA has repeatedly exposed or cannot reliably reach.
- Keep browser screenshots as preferred evidence when login and backend are available, but make static smoke catch protected-page regressions earlier.

## Wave 23A: Protected Frontend QA Smoke

Goal: make the existing `npm run lottery:smoke` guard the Wave 22 closure, status-label, mobile, and dark-mode guarantees.

- Add fixture-driven source checks to the lottery route smoke script.
- Add source checks for the workbench `本期闭环` widget.
- Add source checks for mobile/dark-mode table and action-rail safeguards.
- Add source checks for shared Chinese status/source/audit labels.
- Keep the smoke independent from live auth and backend provider access.

Acceptance:

- `npm run lottery:smoke` reports the additional source checks.
- A removed closure widget or removed mobile/dark CSS safeguard fails smoke before manual QA.
- `npm run build` and `git diff --check` pass.

## Wave 23B: Browser QA Readiness Notes

Goal: make manual browser QA blockers explicit and repeatable.

- Document the local prerequisites for protected route screenshots: valid `aurorae_auth`, backend service, and lottery proxy endpoints.
- Record the known blocker signature for backend proxy `ECONNREFUSED` on `/lottery/records/draws`.
- Add a concise browser-QA fallback note to the lottery README or quality gate docs.

Acceptance:

- A future thread can tell whether missing screenshots are caused by auth, backend, or browser tooling.
- The delivery rule still treats static smoke/build as baseline verification when live browser QA is blocked.

## Delivery Rule

Each wave should update `docs/lottery/iterations/checklist.md`, run verification, review diff, commit, and push.
