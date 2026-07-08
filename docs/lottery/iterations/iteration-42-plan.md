# Iteration 42: Provider Reliability Focus

Goal: turn the next-phase Provider reliability candidate into a focused review path that reuses existing sync summaries, sync logs, and probe logs.

## Wave 42A: Sync Reliability Focus

- Link the month-end Provider reliability candidate to a focused sync operations view.
- Summarize sync stability, recovery interval, probe success, failure category, and network-block signals.
- Keep the first slice frontend-derived from existing sync and probe evidence.

Status: completed with `/lottery/sync?focus=provider-reliability` and a focused Provider reliability summary on the sync operations page.

## Wave 42B: Workbench Provider Reliability Handoff

- Surface the focused Provider reliability path from workbench when sync or health evidence needs review.
- Keep the action compact and tied to existing operations health signals.
- Add smoke coverage for the handoff label.

Status: completed with a workbench `Provider可靠性` next-step handoff to `/lottery/sync?focus=provider-reliability` when sync status or operations health needs review.

## Wave 42C: Governance Provider Reliability Release Link

- Connect the focused Provider reliability path to governance or release evidence when useful.
- Decide whether the existing Provider reliability package is enough or needs a more specific review label.
