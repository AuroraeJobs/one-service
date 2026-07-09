# Iteration 43: Release Evidence Archive Focus

Goal: turn the next-phase release-evidence archive candidate into a focused handoff that keeps local release history docs-only while making the runbook visible in the app.

## Wave 43A: Export Archive Focus

- Link the month-end release-evidence archive candidate to a focused export maintenance view.
- Show the release evidence report, history index, and archive command without adding backend contracts.
- Keep release history docs-only until archived evidence needs an API-backed surface.

Status: completed with `/lottery/exports?focus=release-archive` and a focused release archive runbook on the export maintenance page.

## Wave 43B: Workbench Release Archive Handoff

- Surface the focused release archive path from workbench release review.
- Keep the action tied to existing release check signals.
- Add smoke coverage for the handoff label.

## Wave 43C: Governance Release Archive Link

- Connect the focused release archive path to governance release evidence.
- Decide whether release archive history should remain docs-only or become an export page data source.
