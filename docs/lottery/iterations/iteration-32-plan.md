# Iteration 32: Provider Reliability Trends

Goal: make provider freshness, sync outcomes, probe diagnostics, and recovery signals easier to review without relying on live provider access during frontend QA.

## Wave 32A: Sync Page Reliability Trend

- Add a `Provider 可靠性趋势` section to `/lottery/sync`.
- Derive reliability rows from existing sync summary, paged sync logs, and paged provider probe logs.
- Cover sync stability, recent recovery interval, probe success rate, failure category, and network-block signals.
- Add route smoke coverage for `/lottery/sync` and the reliability labels.

## Wave 32B: Governance Reliability Handoff

- Add provider reliability trend rows to governance anomaly review.
- Keep failure-category copy descriptive and route users back to `/lottery/sync`.
- Avoid adding new backend contracts unless existing summaries cannot express recovery state.

## Wave 32C: Reliability Evidence Export

- Add provider reliability evidence labels to export maintenance.
- Connect sync/probe log report presets to governance and release-readiness checks.
- Keep smoke independent from live provider networking.
