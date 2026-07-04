# One-Month Reliability Plan: Lottery Provider And Operations

## Version Window

Cycle length: 1 month.

Version goal: make lottery sync, data repair, prediction replay, and daily operation more reliable and diagnosable. CWL remains the primary draw provider. A `403` from a proxied local environment should be treated first as a proxy/network reachability problem, not as proof that the provider source is unusable.

## Scope

Included:

- Provider request diagnostics for direct/proxy/no-proxy context, HTTP status, response type, latency, and safe response snippets.
- Sync log and UI wording that separates provider business failure, invalid response, blank response, and suspected proxy/network block.
- Server-side configuration for lottery provider networking behavior where the runtime supports it.
- Data quality detection and repair dry-run flows for gaps, duplicates, out-of-order issues, and stale derived data.
- Prediction replay and rule evidence improvements after new actual draws arrive.
- Daily automation and release hardening for scheduled sync, repair review, exportable evidence, and operational checks.
- Documentation, focused backend tests, frontend build when UI changes, and independent commit/push after each weekly milestone.

Deferred unless the month finishes early:

- Replacing CWL as the primary provider.
- Browser-side third-party lottery provider calls.
- Destructive repair or cleanup without a dry-run and explicit confirmation.
- External notification providers.
- Large prediction algorithm rewrites.

## Week 1: Provider Diagnostics And Sync Resilience

Status: shipped in Wave 12A.

Goal: make provider failures actionable, especially the known local proxy `403` case.

Deliverables:

- Preserve CWL as the primary provider and document proxy-related failure modes.
- Build on the explicit provider error handling that prevents null content from reaching JSON parsing.
- Add provider probe diagnostics that capture request mode, HTTP status, response content type, latency, and a safe response snippet.
- Add server-side configuration for provider direct/proxy/no-proxy behavior where supported.
- Surface suspected proxy/network block in sync logs and frontend sync status.
- Keep fallback provider work secondary until the primary direct-connect diagnostics are clear.

Delivered:

- Added `RecordClientOptions`, `RecordClientDiagnostic`, and `RecordClientException` so provider failures carry request mode, HTTP status, content type, safe response snippet, and failure category.
- Added server-side config through `LOTTERY_PROVIDER_NETWORK_MODE`, `LOTTERY_PROVIDER_PROXY_HOST`, `LOTTERY_PROVIDER_PROXY_PORT`, `LOTTERY_PROVIDER_TIMEOUT_SECONDS`, and `LOTTERY_PROVIDER_DIAGNOSTIC_SNIPPET_LENGTH`.
- Added lightweight CWL probe diagnostics while keeping CWL as the active provider.
- Added sync/probe log diagnostic fields and surfaced them on `/lottery/sync`.
- Classified HTTP 403/407 as `PROXY_OR_NETWORK_BLOCK`.

Acceptance:

- A proxied `403` is reported as a suspected proxy/network block with enough context to act on.
- Blank, empty, invalid JSON, HTTP failure, and business failure responses have distinct messages.
- Sync summary no longer collapses these cases into `argument "content" is null`.
- Focused provider/sync tests pass.

## Week 2: Data Quality Repair Automation

Status: planned.

Goal: make bad or incomplete record data visible and repairable without manual file edits.

Deliverables:

- Add a data-quality issue model or bounded summary for missing issues, duplicate issues, invalid numbers, out-of-order line numbers, and stale statistics.
- Add repair dry-run output that explains proposed inserts, skips, renumbering, and cache refreshes.
- Add confirm-only repair endpoints for safe bounded issue ranges.
- Add frontend repair review states on the quality or sync page.
- Add audit events for dry-run and confirmed repair actions.

Acceptance:

- Operators can see whether records are complete for a chosen issue range.
- Dry-run output is available before any persisted repair.
- Confirmed repairs are auditable and bounded by issue range.
- Tests cover gap detection, duplicate handling, dry-run output, and cache refresh behavior.

## Week 3: Prediction Evidence And Rule Intelligence

Status: planned.

Goal: turn new actual draws into stronger prediction evidence without implying guaranteed outcomes.

Deliverables:

- Automatically attach latest actual results to eligible prediction snapshots after sync.
- Add a replay summary that highlights candidates, hit distribution, rule version, and drift from recent windows.
- Add rule evidence tags for stable, volatile, stale, and under-tested rules.
- Improve frontend comparison states so evidence quality is visible before a rule is trusted.
- Add exports or report sections for replay and rule evidence.

Acceptance:

- New actual draws can update matching prediction snapshots without manual hunting.
- Rule evidence makes weak or stale data visible.
- Research and prediction pages keep language evidence-oriented.
- Tests cover actual-result attachment, replay summary, and rule evidence labels.

## Week 4: Daily Automation And Release Hardening

Status: planned.

Goal: make the lottery module easier to run daily and safer to release.

Deliverables:

- Add or tighten scheduled sync runbook state, including last run, next run, duration, and failure category.
- Add daily operation summary that combines sync, quality, prediction attachment, ticket prize check, and pending alerts.
- Add retention and export checks for sync logs, provider probe logs, repair audit events, and replay evidence.
- Add release checklist coverage for backend tests, frontend build, documentation, and commit/push.
- Polish frontend empty/error/loading states touched by this month.

Acceptance:

- The workbench or sync page can explain what happened in the latest daily run.
- Operational history is exportable or reviewable from existing report/audit surfaces.
- Month-end release has focused backend tests and frontend build evidence.
- `origin/master` contains each shipped weekly milestone.

## Weekly Delivery Rules

- Each week is a shippable milestone.
- Commit and push each weekly milestone independently.
- Keep existing lottery routes compatible.
- Keep CWL as the primary provider unless a later explicit decision changes that.
- Update `docs/lottery/iterations/checklist.md`, `docs/lottery/modules/technical-design.md`, and `docs/lottery/menu-and-version-plan.md` when contracts or routes change.
- Use focused Maven tests for changed backend services/controllers.
- Run `npm run build` for frontend route, API type, or page changes.
- Run `git diff --check` before every commit.

## Month-End Release Criteria

- Provider diagnostics make proxy/direct-connect failures understandable.
- Sync summary no longer hides upstream causes behind low-level null/JSON errors.
- Data quality repair supports dry-run before confirmed changes.
- Prediction replay evidence updates when actual draws arrive.
- Daily operation state is visible from the lottery UI.
- No browser-side calls are made to third-party lottery providers.
- Documentation reflects implemented behavior rather than aspirational behavior.
- Local worktree is clean and `origin/master` contains the final pushed commit.

## Risk Controls

- Do not replace CWL only because a local proxy causes `403`.
- Keep provider networking configuration server-side.
- Do not log full upstream payloads when a short safe snippet is enough.
- Keep repair actions dry-run or confirm-only.
- Keep prediction and research copy restrained: evidence, not winning promises.
