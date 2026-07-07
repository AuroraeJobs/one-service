# Iteration 27 Plan: Workbench Issue Focus 2.0

## Version Goal

Make `/lottery/workbench` answer the current draw-cycle question faster: what issue is active, what needs action next, and which specialist page should handle it.

## Scope Principles

- Reuse existing workbench summary, daily state, operations health, reminders, release checks, and recent work data.
- Keep the workbench as the command center, not a replacement for specialist pages.
- Do not add backend contracts until a real data gap appears.
- Keep mobile and dark-mode layout readable.

## Wave 27A: Next-Step Issue Focus

Goal: add a default-visible next-step strip above the existing issue-focus cards.

- Show pending tickets, pending prize checks, stale evidence, release blockers, mobile command, and recommendation review as direct handoffs.
- Keep current issue, next issue, prediction target, ticket issue, prize check, and ledger result in the existing issue-focus card grid.
- Reuse existing action queue, daily state, release checks, reminders, and operations health data.
- Add responsive CSS for desktop and mobile.
- Extend route smoke source guards for the new issue-focus panel.

Acceptance:

- `/lottery/workbench` has a visible next-step issue focus strip.
- No new backend contract is required.
- `npm run lottery:smoke` and `git diff --check` pass.

## Wave 27B: Workbench Handoff Polish

Goal: make the next-step strip better at sending users to the right daily surface.

- Review handoffs to `/lottery/mobile`, `/lottery/governance`, `/lottery/ticket-packs`, `/lottery/recommendations`, and `/lottery/exports`.
- Add source checks or route smoke fixture evidence for any new handoff labels.
- Decide whether the next-step strip should participate in widget settings as a separate widget or stay inside `期号焦点`.

Acceptance:

- The issue-focus handoff model is documented and guarded by smoke checks.
- Mobile layout stays single-column and touch-friendly.

Status: shipped as a polish slice. The next-step strip stays inside the existing `期号焦点` widget instead of becoming another layout item, because it is an interpretation of the same current-issue context. Handoff paths are centralized in `workbenchIssueHandoffPaths` and guarded by route smoke source checks.

## Delivery Rule

Each wave should update `docs/lottery/iterations/checklist.md`, run verification, review diff, commit, and push.
