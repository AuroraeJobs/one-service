# Iteration 32: Provider Reliability Trends

Goal: make provider freshness, sync outcomes, probe diagnostics, and recovery signals easier to review without relying on live provider access during frontend QA.

## Wave 32A: Sync Page Reliability Trend

- Add a `Provider 可靠性趋势` section to `/lottery/sync`.
- Derive reliability rows from existing sync summary, paged sync logs, and paged provider probe logs.
- Cover sync stability, recent recovery interval, probe success rate, failure category, and network-block signals.
- Add route smoke coverage for `/lottery/sync` and the reliability labels.

## Wave 32B: Governance Reliability Handoff

- Add provider reliability trend rows to governance anomaly review. Added `Provider可靠性复核` and `同步可靠性` to governance.
- Keep failure-category copy descriptive and route users back to `/lottery/sync`. Governance uses Chinese failure-category labels and links the reliability rows to sync operations.
- Avoid adding new backend contracts unless existing summaries cannot express recovery state. Reused `workbench.latestSyncSummary`.

## Wave 32C: Reliability Evidence Export

- Add provider reliability evidence labels to export maintenance. Added `Provider可靠性包` and `Provider可靠性证据`.
- Connect sync/probe log report presets to governance and release-readiness checks. Added `V32Provider可靠性` release evidence using sync/probe logs.
- Keep smoke independent from live provider networking. Smoke guards the labels and preset wiring without live provider access.
