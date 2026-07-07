# Iteration 22 Plan: Daily Closure And Trust QA

## Version Goal

Make the lottery workbench behave like a daily closure console. A user should be able to start from `/lottery/workbench`, understand the current issue state, complete the main workflow, and leave an auditable trail through tickets, ledger, and exports.

## Scope Principles

- Keep `/lottery/workbench` as the daily entry point.
- Prefer existing `lottery/*` APIs and frontend composition before adding backend contracts.
- Preserve the single-row lottery navigation rollback rule.
- Keep copy evidence-oriented and avoid outcome promises.
- Treat mobile layout, dark mode, and Chinese status labels as release quality requirements.

## Wave 22A: Current-Issue Closure Path

Goal: make the main daily path visible and actionable in one place.

- Add a `本期闭环` widget to `/lottery/workbench`.
- Show the ordered path: sync, prediction review, ticket/ticket-pack handling, prize check, ledger review, and report/export archive.
- Reuse `dailyState`, workbench summary, release checks, and existing drill-through routes.
- Keep the daily-run action available from the closure widget.
- Preserve configurable workbench layout behavior.

Acceptance:

- The closure path is visible by default on a clean workbench layout.
- Each step shows a Chinese business label, status tag, detail, and direct handoff.
- Desktop layout is compact; mobile layout becomes a single-column action list.
- `npm run build` passes.

## Wave 22B: Trust And Status Consistency QA

Goal: make high-use pages tell the same story.

Status: shipped. Wave 22B normalized visible high-use status/source/event labels on ticket, ticket-pack, export/maintenance, and audit-adjacent views while keeping workbench count sources unchanged.

- Audit workbench, overview, tickets, ticket packs, recommendations, governance, simulator, mobile command, and exports for English status leakage.
- Normalize status labels through shared frontend helpers when practical.
- Compare visible counts across overview statistics, latest draw, pending tickets, prize-check summary, and ledger summary.
- Add checklist evidence for inconsistencies found and fixed.

Acceptance:

- No obvious English status codes remain in high-use lottery surfaces.
- Workbench and specialist pages agree on current issue, pending tickets, and latest prize-check state.
- `npm run build` and route smoke verification pass.

## Wave 22C: Mobile And Dark-Mode Release Sweep

Goal: make daily operation readable on narrow screens and in dark mode.

Status: shipped. Wave 22C tightened shared mobile/dark-mode behavior for export and maintenance tables, ticket-pack action rows, recommendation/mobile action rails, governance handoff actions, and report sections without changing backend contracts.

- Review workbench, overview, tickets, ticket packs, recommendations, governance, simulator, research, and exports.
- Fix text overflow, cramped actions, card heights, and dark-mode contrast issues.
- Prefer card/list layouts over wide tables on mobile.

Acceptance:

- High-use pages remain readable at mobile width.
- Buttons and tags do not overlap text.
- Dark mode does not depend on fixed white or black backgrounds for core content.

## Delivery Rule

Each wave should update this plan, `docs/lottery/iterations/checklist.md`, and any affected module/menu docs, then run verification, review diff, commit, and push.
