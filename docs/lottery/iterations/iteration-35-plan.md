# Iteration 35: Archive Review Queue

Goal: turn month-end archive search results into explicit next actions without starting hidden background jobs or adding a backend queue contract.

## Wave 35A: Month-End Archive Review Queue

- Derive a compact review queue from the current archive search and filters.
- Prioritize failed, warning, manual, pending, and snoozed archive records before pass states.
- Route each queue row back to the specialist page that owns the evidence.
- Keep the queue frontend-derived from existing month-end data.

## Wave 35B: Workbench Handoff

- Surface archive-review pressure on the workbench when month-end evidence contains pending review items.
- Keep handoffs explicit and user-triggered.
- Add smoke checks for the workbench entry.

## Wave 35C: Governance Connection

- Connect recurring archive-review pressure into governance anomaly context.
- Reuse existing governance, month-end, and export evidence paths before adding any persistence.
- Add export evidence labels only if the review queue needs durable report packaging.
