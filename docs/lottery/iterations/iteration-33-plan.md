# Iteration 33: Review Automation Runbook

Goal: make daily, draw-cycle, month-end, and release review steps explicit and repeatable without starting hidden background work.

## Wave 33A: Workbench Review Runbook Cards

- Add explicit review runbook cards to `/lottery/workbench`.
- Cover daily review, draw-cycle review, month-end review, and release archive review.
- Keep each card evidence-backed and route to the page where the user can complete the review.
- Preserve the existing scheduled-sync runbook as a status note.
- Add smoke coverage for runbook labels and disabled/manual states.

## Wave 33B: Manual Acknowledgement Trail

- Add lightweight acknowledgement states for runbook steps where existing reminder or health acknowledgement APIs can be reused.
- Keep acknowledgement explicit and user-triggered.
- Avoid starting prediction, sync, or export work in the background.

## Wave 33C: Runbook Evidence Export

- Add runbook evidence labels to export maintenance.
- Connect review runbook steps to release readiness and month-end review.
- Keep static smoke independent from live backend or provider availability.
