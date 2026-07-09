# Iteration 44: Recommendation Retirement Review

Goal: turn stale recommendation cleanup into a focused review path that reuses existing recommendation lifecycle, attribution, governance, and export evidence.

## Wave 44A: Recommendation Retirement Focus

- Add a focused recommendation view for stale evidence, retirement candidates, watch/pause candidates, and applied records.
- Keep the first slice frontend-derived from existing recommendation rollups and visible recommendation rows.
- Preserve explicit user-triggered cleanup; do not archive recommendations in the background.

Status: completed with `/lottery/recommendations?focus=retirement-review&preset=STALE_EVIDENCE` and a compact strategy retirement review panel.

## Wave 44B: Workbench And Month-End Handoff

- Surface the focused retirement path from month-end planning candidates.
- Route workbench recommendation review into the same focused path.
- Keep stale cleanup and evidence export actions explicit.

Status: completed by adding the month-end `策略退休复盘` candidate and routing workbench recommendation review to the focused recommendation page.

## Wave 44C: Governance And Release Evidence

- Connect governance recommendation warnings and transition rows to the focused retirement path.
- Decide whether a dedicated export label is needed.

Status: completed by routing governance recommendation follow-up to the focused page; no dedicated export label is needed because the existing recommendation follow-through package remains sufficient.
