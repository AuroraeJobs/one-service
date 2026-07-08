# Iteration 33: Review Automation Runbook

Goal: make daily, draw-cycle, month-end, and release review steps explicit and repeatable without starting hidden background work.

## Wave 33A: Workbench Review Runbook Cards

- Add explicit review runbook cards to `/lottery/workbench`.
- Cover daily review, draw-cycle review, month-end review, and release archive review.
- Keep each card evidence-backed and route to the page where the user can complete the review.
- Preserve the existing scheduled-sync runbook as a status note.
- Add smoke coverage for runbook labels and disabled/manual states.

## Wave 33B: Manual Acknowledgement Trail

- Add lightweight acknowledgement states for runbook steps where existing reminder or health acknowledgement APIs can be reused. Runbook cards now expose explicit reminder and health confirmation buttons.
- Keep acknowledgement explicit and user-triggered. Confirmation buttons stop card navigation and call only acknowledgement APIs.
- Avoid starting prediction, sync, or export work in the background. No runbook acknowledgement starts sync, prediction, ticket, prize-check, or export actions.

## Wave 33C: Runbook Evidence Export

- Add runbook evidence labels to export maintenance. Added `复核Runbook包` and `复核Runbook证据`.
- Connect review runbook steps to release readiness and month-end review. Added `V33复核Runbook` release evidence pointing to the runbook evidence preset.
- Keep static smoke independent from live backend or provider availability. Smoke checks the labels and preset wiring only.
