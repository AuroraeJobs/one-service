# Iteration 29: Recommendation Lifecycle Analytics

Goal: make `/lottery/recommendations` show whether recommendation actions are moving through a healthy lifecycle, and give operators a conservative cleanup path for stale evidence.

## Wave 29A: Lifecycle Analytics Panel

- Add active, watch, paused, and retired lifecycle counts on the recommendation page.
- Add result-after-action rows for promoted, retired, applied, or archived recommendations.
- Add a stale-evidence cleanup action that only archives currently visible, open recommendations whose evidence is older than 24 hours.
- Keep the feature frontend-derived from the existing recommendation list contract.
- Extend route smoke source guards and fixture data for lifecycle analytics, cleanup, and action review.

## Wave 29B: Transition History

- Add backend transition rollups grouped by lifecycle status, recommendation state, target type, and day.
- Expose transition counts in `/lottery/recommendations` without overloading the recommendation list endpoint.
- Add service and controller tests for empty state and bounded rollup windows.

## Wave 29C: Outcome Follow-Through

- Connect promoted and retired recommendation rows to attribution outcomes and export evidence.
- Add governance/month-end review rows for stale recommendation cleanup and applied recommendation follow-through.
- Review mobile and dark-mode behavior after the backend rollups land.
