# Iteration 38: Archive Review Note Quality

Goal: make archive-review notes easier to assess for completeness, status, and evidence coverage.

## Wave 38A: Notebook Quality Summary

- Add a compact summary for archive-review note count, active notes, validated notes, and attached archive evidence.
- Keep the summary frontend-derived from currently loaded strategy notes.
- Add smoke coverage for the summary labels.

## Wave 38B: Month-End Note Quality

- Surface the same archive-review note quality signal on month-end review.
- Keep month-end summaries linked to the notebook archive-review filter.
- Avoid adding backend aggregation unless local data is insufficient.

Status: completed with a frontend-derived archive-review note quality strip on month-end review.

## Wave 38C: Governance Note Quality

- Add archive-review note quality to governance drift or anomaly context.
- Reuse the notebook and month-end evidence paths.
- Decide whether quality gaps need a release-readiness guard.
