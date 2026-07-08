# Iteration 31: Anomaly Watch And Evidence Drift

Goal: make governance review catch operational drift earlier by turning existing health, attribution, recommendation, ticket-pack, simulator, and release evidence into one lightweight anomaly watch surface.

## Wave 31A: Governance Anomaly Watch

- Add an anomaly watch card to `/lottery/governance`.
- Derive anomaly rows from existing frontend-loaded data rather than creating a new backend contract.
- Cover operations health, simulator risk, ticket-pack exposure, attribution drift, stale recommendations, and release-readiness blockers.
- Keep copy evidence-oriented and route each row to the specialist page that can resolve it.
- Add route smoke checks for anomaly labels and empty state.

## Wave 31B: Drift Trend Evidence

- Add compact trend context for repeated anomaly types across recent audit and rollup data. Added trend text to anomaly rows and a `漂移趋势` card for audit repeats, recommendation transitions, attribution quality, and operations refresh.
- Prefer existing audit/export/recommendation/attribution sources before adding new persistence. Reused governance page data already loaded for audits, recommendation rollups, attribution rollups, and operations health.
- Keep trend copy descriptive, not predictive. Trend copy reports counts, recency, and warning totals only.

## Wave 31C: Review Handoffs

- Connect recurring anomaly categories to workbench and month-end review handoffs.
- Add export evidence labels for anomaly review when a durable report preset is justified.
- Review mobile and dark-mode behavior after anomaly surfaces expand.
