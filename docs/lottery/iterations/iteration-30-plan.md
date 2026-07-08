# Iteration 30: Research Archive And Month-End Intelligence

Goal: make the lottery module easier to use as a long-running research archive, with month-end review acting as the compact entry point for historical evidence.

## Wave 30A: Searchable Research Archive Index

- Add a searchable archive index across issues, month summaries, attribution rows, recommendation transitions, strategy notes, and release evidence.
- Keep the first slice frontend-derived from existing month-end APIs instead of creating a new archive backend contract.
- Add smoke guards for archive labels, search state, and empty state.

## Wave 30B: Month-End Narrative Summary

- Add a narrative section backed by ledger, tickets, attribution, recommendations, notes, reminders, and exports.
- Keep copy evidence-oriented and avoid prediction-confidence language.
- Add route smoke checks for narrative source labels.

## Wave 30C: Long-Term Retrospective Exports

- Add export presets for long-term research retrospectives.
- Connect archive and narrative views to export evidence.
- Review mobile/dark-mode behavior for archive-heavy states.
