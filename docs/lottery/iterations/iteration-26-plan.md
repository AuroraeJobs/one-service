# Iteration 26 Plan: Release History And Evidence Archive

## Version Goal

Keep frontend lottery release evidence as durable snapshots instead of only the latest mutable report. Each archived snapshot should be generated from the same smoke/build evidence flow and should preserve browser-QA blocker guidance.

## Scope Principles

- Reuse the existing release evidence renderer.
- Archive only after the current evidence is fresh.
- Keep the latest report as the normal handoff surface.
- Keep historical snapshots local, text-based, and commit-friendly.

## Wave 26A: Evidence Snapshot Archive

Goal: add one command that runs the frontend release check and stores a timestamped Markdown evidence snapshot.

- Add archive mode to the release evidence script.
- Add `npm run lottery:release-archive`.
- Write snapshots under `one-web/reports/lottery-release-history/`.
- Maintain a small `README.md` index with the latest snapshot, target, generated time, status, check count, and route count.
- Keep the archive command failing when the latest evidence report is stale.

Acceptance:

- `npm run lottery:release-archive` passes.
- A timestamped snapshot is written under `one-web/reports/lottery-release-history/`.
- The history index points to the latest snapshot.
- `git diff --check` passes.

## Wave 26B: Release History Consumption

Goal: make release history easier to inspect from docs or app export surfaces.

- Link the archive index from lottery documentation.
- Decide whether `/lottery/exports` should surface local release-history metadata or keep it as docs-only.
- Record browser-QA blocker notes next to archived snapshots when screenshots are unavailable.

Acceptance:

- A future thread can find both the latest report and historical snapshots from documentation.
- Browser-QA blocker notes remain adjacent to release evidence.
- Release history stays docs-only until a backend/export contract is explicitly added for archived local evidence.

## Delivery Rule

Each wave should update `docs/lottery/iterations/checklist.md`, run verification, review diff, commit, and push.
