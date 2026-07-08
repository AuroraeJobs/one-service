# Iteration 34: Research Archive Search 2.0

Goal: make month-end review a faster long-term research entry point by improving the archive index before adding any new backend contract.

## Wave 34A: Month-End Archive Filters

- Add range and status filters to the `研究归档索引` card.
- Keep the first slice frontend-derived from loaded month-end evidence.
- Preserve keyword search across scope, status, title, and detail text.
- Extend route smoke checks so archive filters stay visible in release evidence.

## Wave 34B: Archive Deep Links

- Add stronger handoffs from archive rows to issue ledger, recommendation, outcome, ticket-pack, and export views.
- Keep query parameters aligned with each specialist page's existing filters.
- Add smoke checks for the linked destinations.

## Wave 34C: Archive Evidence Export

- Add export evidence labels for archive searches that need to be reviewed outside the page.
- Record the active range/status/search context in export-ready metadata where existing export presets allow it.
- Keep the export path explicit and user-triggered.
