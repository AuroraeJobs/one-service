# Lottery Release History

This directory stores committed snapshots generated from `npm run lottery:release-archive`.

| Field | Value |
| --- | --- |
| Latest snapshot | [2026-07-07T12-10-55-085Z-passed.md](2026-07-07T12-10-55-085Z-passed.md) |
| Latest target | Iteration 23 Week 1 protected frontend QA smoke |
| Latest generated at | 2026-07-07T12:10:55.085Z |
| Latest status | PASSED |
| Latest checks | 377 |
| Latest routes | 17 |

## Usage

```bash
npm run lottery:release-archive
```

Run this after a release-check pass when the evidence should be kept as a durable handoff snapshot.

## Browser QA Notes

- Latest snapshot includes the protected-browser QA prerequisites and known backend/proxy blocker signature.
- Keep release history docs-only for now; local Markdown snapshots are not surfaced through `/lottery/exports`.
- When screenshots are unavailable, record the remaining blocker in the final handoff next to this archive path.
