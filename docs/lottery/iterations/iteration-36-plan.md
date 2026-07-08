# Iteration 36: Archive Review Notes

Goal: make archive review conclusions easy to preserve as research evidence while keeping all write actions explicit and user-triggered.

## Wave 36A: Month-End Review Note Handoff

- Add a `记录复核` handoff from the month-end archive review queue.
- Carry the active archive scope, status, query, queue count, and export evidence path into the research notebook.
- Reuse the existing strategy-note evidence query parameters instead of adding a new backend contract.

## Wave 36B: Workbench Note Handoff

- Add a workbench shortcut from archive-review pressure to the same notebook evidence flow.
- Keep the primary workbench action pointed at the review queue.
- Add smoke checks for the note handoff.

Status: completed with a secondary workbench `记录复核` handoff that opens the research notebook with `ARCHIVE_REVIEW` evidence context.

## Wave 36C: Governance Note Handoff

- Add governance context for preserving archive-review decisions.
- Reuse the V34 archive search evidence export and strategy notebook before adding new persistence.
- Decide whether a dedicated review-note export label is justified.

Status: completed with a governance `记录复核` handoff that opens the research notebook with `ARCHIVE_REVIEW` evidence context and reuses the V34 archive search evidence package.
