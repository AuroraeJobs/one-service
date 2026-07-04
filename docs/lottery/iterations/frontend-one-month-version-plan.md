# One-Month Frontend Plan: Lottery Experience And Power Tools

## Version Window

Cycle length: 1 month.

Version goal: make the lottery module feel like a finished daily product from the user's side. This month is frontend-led: improve navigation, comparison, ticket workflows, reports, exports, and responsive polish while reusing existing backend APIs wherever possible.

## Scope

Included:

- Frontend route and navigation upgrades for daily use.
- Workbench personalization, quick actions, saved filters, and recent-work shortcuts.
- Research comparison surfaces for experiments, backtests, rules, and ledger evidence.
- Ticket workflow power tools: bulk paste, duplicate preview, batch actions, mobile cards, and issue timeline.
- Report/export/audit UI using existing export and audit APIs.
- Responsive, empty/loading/error, and accessibility polish for dense lottery pages.
- Documentation, frontend build, focused backend tests only when a small backend contract is added, and commit/push after each weekly milestone.

Backend stance:

- Prefer existing `lottery/*` APIs and frontend composition first.
- Add backend code only for narrow read-only gaps such as missing summary fields, bounded pagination, or export download metadata.
- Do not introduce external provider calls from the browser.
- Do not change prediction algorithms unless a frontend workflow exposes a clear bug in existing behavior.

Deferred unless the month finishes early:

- Native mobile app surfaces.
- External notification providers.
- PDF rendering on the backend.
- Large backend schema migrations.
- Rewriting legacy visual-analysis pages from scratch.

## Week 1: Frontend Shell And Personalized Cockpit

Goal: make `/lottery/workbench` the clear daily command center and reduce jumping between pages.

Deliverables:

- Audit all lottery routes, page titles, nav labels, and primary actions.
- Add a compact lottery quick-action rail or panel for sync, prediction, ticket save, prize check, ledger review, alerts, and export.
- Add workbench widget sections for daily state, recent prediction, pending tickets, alerts, budget warning, latest backtest, and latest ledger outcome.
- Add saved frontend view state for common filters and page sizes where the backend already supports query parameters.
- Add recent-work shortcuts for prediction snapshots, tickets, experiments, backtests, and exports.
- Keep route state URL-backed so workbench drill-through links remain shareable.

Acceptance:

- A daily user can start from `/lottery/workbench` and reach the main next action in one click.
- Existing pages remain reachable from lottery navigation.
- Refreshing or sharing a filtered URL preserves the selected view.
- `npm run build` passes.

## Week 2: Research Comparison Studio

Goal: make strategy experiments, backtests, rules, and ledger evidence easier to compare without reading multiple detail pages.

Deliverables:

- Add a frontend research comparison route, proposed `/lottery/research`.
- Build side-by-side comparison cards for selected experiments, backtests, rule comparison rows, and source/rule ledger performance.
- Add selectable compare sets from existing experiment/backtest/rule pages.
- Add compact charts for stability score, average red hits, blue hit rate, net result, ROI, and prize distribution.
- Add deep links from experiment detail, backtest detail, rule comparison, and ledger performance into the comparison route.
- Keep copy evidence-oriented and avoid outcome promises.

Acceptance:

- At least two backtests or rules can be compared side by side.
- Rule comparison and ledger performance can show matched backtest summaries when available.
- Empty states explain what to run or select next without instructional clutter.
- `npm run build` passes.

## Week 3: Ticket Workflow Power Tools

Goal: make ticket entry, review, and closing faster for real daily usage.

Deliverables:

- Add bulk ticket paste/import UI that accepts common red/blue formats and previews parsed rows before saving.
- Add duplicate preview before batch save, showing existing matches and in-request duplicates.
- Add batch actions for source, status, note, and delete where safe.
- Add an issue timeline view that groups tickets, predictions, prize checks, and ledger result by issue.
- Add mobile-friendly card layout for ticket rows and prize-check results.
- Add stronger ticket page shortcuts from prediction detail, workbench, and ledger issue rows.

Acceptance:

- Users can paste multiple tickets, inspect normalization, and save valid rows in one flow.
- Duplicate rows are visible before save.
- Ticket page remains usable on mobile width without table text overlap.
- `npm run build` passes.

## Week 4: Reports, Export, Audit, And Frontend Polish

Goal: turn the existing export/audit/maintenance foundation into usable frontend workflows.

Deliverables:

- Add a report builder surface that can compose tickets, ledger, prediction, experiment, backtest, sync-log, and probe-log sections.
- Add browser CSV download for existing `GET /lottery/exports/{type}` responses.
- Add audit explorer filters for type, target, date range, and row count where available.
- Improve maintenance preview with cache/log/history status grouping and dry-run result history if available.
- Add print-friendly report view for selected report sections.
- Polish dense states across workbench, research, ticket, ledger, export, and alert pages: loading, empty, error, overflow, and responsive behavior.

Acceptance:

- Users can generate and download CSV from the export page.
- Users can build a frontend report preview without leaving the app.
- Audit and maintenance surfaces are useful on desktop and readable on mobile.
- `npm run build` passes.

## Weekly Delivery Rules

- Each week is a shippable frontend milestone.
- Commit and push each weekly milestone independently.
- Keep existing APIs and routes compatible.
- Update `docs/lottery/iterations/checklist.md`, `docs/lottery/modules/technical-design.md`, and `docs/lottery/menu-and-version-plan.md` when contracts or routes change.
- Run `npm run build` for every frontend milestone.
- Run focused Maven tests only when a backend contract changes.
- Run `git diff --check` before every commit.

## Month-End Release Criteria

- The workbench is the practical daily entry point, not just a summary page.
- Research comparison can compare experiments, backtests, rules, and ledger evidence from existing data.
- Ticket workflows support bulk review and mobile-friendly daily operation.
- Export/audit/maintenance pages support real frontend actions rather than only raw API inspection.
- All new frontend routes are reachable from lottery navigation.
- No browser-side calls are made to third-party lottery providers.
- Documentation reflects implemented frontend behavior rather than aspirational behavior.
- Local worktree is clean and `origin/master` contains the final pushed commit.

## Risk Controls

- Keep frontend text restrained: research evidence and personal records, not winning promises.
- Prefer incremental page improvements over a one-off redesign that strands existing routes.
- Use existing design system components and dense operational layouts.
- Add backend only when a frontend feature cannot be responsibly composed from current APIs.
- Avoid expensive client-only aggregation over unbounded lists; use paged APIs or bounded summaries.
