# Lottery Menu And Version Plan

Last updated: 2026-07-04

## Target Menu Tree

The current lottery navigation already has a strong exploratory surface. The target plan keeps those pages but organizes future operational work around stable daily workflows.

```text
彩票
- 概览
- 工作台
- 移动
- 预测
  - 当前
  - 决策
  - 策略实验
  - 回测报告
  - 研究对比
  - 组合
  - 沙盘
  - 笔记
  - 历史
- 执行
  - 票包
  - 票据
  - 提醒
  - 月末
  - 账本
- 复盘
  - 归因
  - 推荐
  - 治理
  - 导出
- 数据
  - 开奖
  - 同步
  - 质检
  - 频率
  - 分组
  - 分布
  - 宇航员
- 图谱
  - 幻境
  - 星球
  - 能量
  - 累计
  - 集齐
  - 位置
  - 可视化
  - 象数
  - 节气/专题
- 设置
```

## Existing Routes To Preserve

```text
/lottery
/lottery/workbench
/lottery/overview
/lottery/prediction
/lottery/predictions/history
/lottery/predictions/:id
/lottery/experiments
/lottery/experiments/:id
/lottery/backtests
/lottery/backtests/:id
/lottery/research
/lottery/tickets
/lottery/ledger
/lottery/alerts
/lottery/exports
/lottery/sync
/lottery/settings
/lottery/data-quality
/lottery/astronauts
/lottery/astronauts/:camp/:number
/lottery/records
/lottery/statistics
/lottery/analysis
/lottery/pixel-universe
/lottery/pixel-card
/lottery/pixel-stats
/lottery/taiji
/lottery/space
/lottery/hexagram
/lottery/parasite
/lottery/dingfengbo
/lottery/autumn-beginning
/lottery/winter-beginning
```

## Version Slices

### V1: Records And Sync Shell

Goal: make historical draw data operational.

- Add lottery records namespace APIs while preserving existing `record/*` behavior.
- Add sync logs and scheduled/manual sync controls.
- Add data quality checks.
- Add records page filters and sync status.

### V2: Statistics Cockpit

Goal: make statistics consistent across overview and detailed tabs.

- Add backend summary APIs for repeated statistics.
- Add Redis-backed derived statistics cache.
- Connect overview cards to detailed tabs.
- Normalize empty/loading/error/stale states.

### V3: Prediction Research Workflow

Goal: make predictions auditable instead of ephemeral.

- Persist prediction snapshots and training reports.
- Add prediction history page at `/lottery/predictions/history` for recent saved snapshots.
- Add prediction history and detail pages.
- Add rule comparison and replay metrics.
- Attach actual draw result to predictions.

### V4: Personal Tickets

Goal: turn prediction output and manual picks into tracked records.

- Add personal ticket CRUD.
- Save prediction candidates as tickets.
- Add prize checking against actual draws.
- Show ticket status and result per issue.

### V5: Ledger And Outcome Analysis

Goal: make personal outcomes visible without encouraging reckless behavior.

- Add total cost, total prize, net, ROI, and hit-rate summaries.
- Add issue and monthly ledger.
- Compare manual, prediction, random, and rule-based sources.
- Link overview, prediction, and ticket pages into the ledger.

### V6: Provider And Settings Operations

Goal: make the module maintainable.

- Add provider health/config/probe pages.
- Add user preferences and training defaults.
- Add sync retry, scheduled trigger actions, sync summary cards, and provider probe-log inspection.
- Add data quality checks and repair workflows where safe.

### V7: Daily Workflow And Scalable Lists

Goal: make the lottery module usable as a daily cockpit rather than a set of separate pages.

- Add `/lottery/workbench` as the primary daily entry point.
- Point the top-level lottery navigation entry to `/lottery/workbench` while preserving `/lottery` and `/lottery/overview`.
- Summarize latest draw, sync health, data quality, latest prediction, pending tickets, latest prize checking, and ledger outcome.
- Add a safe daily-run action that orchestrates bounded maintenance steps and reports step status.
- Add pagination and query-backed filters to growing prediction, ticket, sync-log, and provider-probe-log lists.
- Preserve existing routes and deep links while adding workbench drill-through links.

### V8: Intelligence Platform

Goal: support a longer research loop with experiments, backtests, reminders, governance, export, and auditability.

- Add strategy experiment pages at `/lottery/experiments` and `/lottery/experiments/:id`.
- Add backtest report pages at `/lottery/backtests` and `/lottery/backtests/:id`.
- Add calendar/reminder pages for daily lottery workflow state at `/lottery/alerts`.
- Add budget/exposure governance on tickets and ledger.
- Add export and audit surfaces for tickets, predictions, experiments, backtests, rule evidence, replay evidence, ledger rows, sync logs, and probe logs at `/lottery/exports`.
- Add non-destructive maintenance preview and cleanup dry-run operations behind the export/audit surface.
- Keep all external-provider behavior behind backend services and preserve project-owned `lottery/*` frontend calls.

### V9: Frontend Experience And Power Tools

Goal: make the completed platform capabilities feel like a richer user-facing product.

- Upgrade `/lottery/workbench` with quick actions, recent-work shortcuts, saved view state, and richer daily widgets. The shipped 11A slice adds the quick-action rail, recent prediction/ticket/experiment/backtest/export shortcuts, and browser-local saved filter state for key growing lists; 12D adds scheduled-sync runbook state, daily operation summary, retention/export checks, and release checklist visibility.
- Add `/lottery/research` for side-by-side experiment, backtest, rule, replay, and ledger evidence comparison. The shipped 11B slice exposes the route, navigation item, URL-backed selection, charts, and deep links from experiment, backtest, prediction, and ledger surfaces; 12C adds visible rule evidence quality and replay drift summaries.
- Add ticket workflow power tools: bulk paste/import, duplicate preview, batch actions, issue timeline, and mobile-friendly cards.
- Improve `/lottery/exports` with browser CSV download, report builder, audit filters, maintenance grouping, and print-friendly report views.
- Preserve dense operational layouts and URL-backed filters so drill-through from workbench remains predictable.

### V10: Guided Daily Decision Experience

Goal: turn the lottery module into a guided daily workflow where users can move from data health, to prediction review, to ticket tracking, to result review without hunting through separate pages.

- Upgrade `/lottery/workbench` with configurable daily widgets, issue focus, action queue state, and quick drill-throughs that remember the user's last working context. The shipped 13A slice adds browser-local widget visibility/order, the issue-focus strip, the action queue, and recent prediction/ticket/research/export/maintenance shortcuts.
- Add a prediction decision board that compares saved candidates, rule evidence, replay drift, actual-result status, and ticket conversion state on one screen. The shipped 13B slice adds `/lottery/predictions/decision`, URL-backed filters, candidate overlap comparison, evidence warnings, and selected-row ticket creation.
- Add ticket import and budget UX helpers for paste preview, duplicate grouping, batch edits, exposure warnings, and issue-level settlement review. The shipped 13C slice expands batch edits, adds archive, budget exposure cards, settlement review, and mobile import/settlement cards.
- Improve research/report pages with guided comparison presets, print/export-ready summary views, and clearer empty/error states for incomplete evidence. The shipped 13D slice adds research presets, print-ready report summaries, and frontend release readiness checks on `/lottery/exports`.
- Keep the experience operational and dense: no marketing-style landing pages, no browser-side provider calls, and no gambling-promotion copy.

### V11: Productionized Decision Operations

Goal: make the guided decision workflow durable, auditable, and testable after the frontend experience is in place.

- Persist shared workbench preferences and saved decision sets through backend `lottery/*` APIs while keeping browser-local fallback behavior. The shipped 14A slice stores workbench widget order/visibility in `/lottery/preferences`, adds `/lottery/decision-sets`, and lets the decision board save, load, update, and archive selected candidates with audit events.
- Move ticket import preview, duplicate grouping, bulk updates, archive, and budget pre-checks behind backend services with audit events. The shipped 14B slice adds `/lottery/tickets/import/preview`, `/lottery/tickets/budget/precheck`, sparse bulk update/archive/delete APIs, audit events, and frontend warnings on the ticket page and decision board.
- Add automated route smoke and release evidence for workbench, decision board, ticket, research, and export/release pages with mocked or fixture data. The shipped 14C slice adds `npm run lottery:smoke`, fixture-backed checks for protected routes/navigation/API call points/empty and error states, a generated smoke report, and a release-readiness item on `/lottery/exports`.
- Add decision outcome feedback after actual-result attachment, including candidate hit distribution, ticket conversion results, stale-evidence alerts, and report/export sections. The shipped 14D slice adds `/lottery/decision-sets/outcomes`, rule/source performance deltas, evidence alerts, frontend outcome cards on workbench/decision/research/ticket settlement pages, and CSV exports for saved decision sets, decision outcomes, import previews, budget prechecks, and settlement reviews.
- Preserve the project-owned API boundary and keep all external provider work behind backend services.

### V12: Frontend Outcome Operations

Goal: make decision outcomes easier to operate from the frontend after the durable saved-decision loop is available.

- Upgrade `/lottery/predictions/decision` into the primary outcome operations cockpit with URL-backed filters for hit state, ticket conversion state, and evidence alert state. The shipped 15A slice adds filtered saved-outcome metrics, a selectable outcome list, and a direct handoff into CSV export.
- Add workbench follow-up queues for unchecked converted tickets, stale or volatile evidence, and high-warning saved decisions. The shipped 15B slice derives decision follow-ups from saved outcomes, adds direct decision/ticket/export actions on workbench outcome cards, and clarifies saved-outcome empty states.
- Add research and ticket drilldowns for rule/source deltas, ROI bands, warning states, and settlement-linked candidates. The shipped 15C slice adds research presets for decision delta, ROI priority, and warning review; ticket settlement candidate drilldowns; and export report presets for outcome operations and month-end review.
- Extend route smoke, release readiness, and responsive QA for the new frontend outcome operations. The shipped 15D slice records V12 route smoke, release readiness, and month-end frontend evidence.
- Keep frontend copy focused on review, audit, and personal record keeping; no gambling-promotion copy.

### V13: Monthly Intelligence Automation

Goal: turn the outcome-operation cockpit into a repeatable monthly intelligence workflow with explainable health, traceable hypotheses, daily reminders, and one-pass month-end review.

- Add lottery operations health scoring across provider freshness, record gaps, ticket settlement coverage, decision outcome completeness, stale evidence, and export evidence. The shipped Week 1 slice adds `/lottery/operations/health`, `/lottery/operations/health/acknowledge`, workbench health widgets, and health audit events.
- Add a strategy notebook and hypothesis lab so rules, assumptions, linked predictions, backtests, tickets, and saved decision outcomes can be reviewed together. The shipped Week 2 slice adds `lottery_strategy_notes`, `/lottery/strategy-notes`, `/lottery/research/notebook`, and evidence handoff from research/decision pages.
- Add action reminders for upcoming draw windows, unsynced records, unconverted saved decisions, unchecked tickets, stale evidence, and missing month-end exports. The shipped Week 3 slice adds `/lottery/reminders/summary`, acknowledge/snooze audit endpoints, a workbench Reminder Center widget, and settings for draw-window threshold, default snooze duration, and month-end export checklist enablement.
- Add month-end review and release governance for ledger results, tickets, outcomes, research notes, health score, and export evidence. The shipped Week 4 slice adds `/lottery/month-end`, the `月末治理包` report preset, route smoke coverage for month-end review, release readiness evidence for health/notebook/reminders/month-end, and responsive dashboard polish.
- Preserve the same project-owned API boundary: browser code stays on `record/*` and `lottery/*`, and provider/network work stays behind backend services.

### V14: Guided Strategy Execution

Goal: make lottery execution feel closer to the stock module's portfolio/analysis workflow: strategies should be organized into portfolios, simulated before action, converted into auditable ticket packs, and governed from dense frontend operation pages.

- Add strategy portfolios that group prediction rules, experiments, backtests, saved decisions, and notebook evidence. The shipped Week 1 slice adds `lottery_strategy_portfolios`, `/lottery/strategy-portfolios`, allocation weights, health/ROI/coverage/warning summaries, score columns, and evidence drilldowns.
- Add a simulation sandbox for what-if ticket packs, budget limits, rule weights, replay windows, and target issues. The shipped Week 2 slice adds `POST /lottery/simulations/run`, `/lottery/simulator`, candidate previews, budget/risk warnings, replay distribution bars, portfolio evidence context, and handoff into decision/ticket/notebook/export flows.
- Add guided ticket-pack execution so saved decisions, simulator output, and portfolio allocation can become reviewed ticket drafts before saving. The shipped Week 3 slice adds `lottery_ticket_packs`, `/lottery/ticket-packs`, ticket-pack preview, approval, budget precheck, save-as-tickets, workbench entry, ticket handoff, and audit trail.
- Add governance dashboards and settings for strategy portfolio health, simulation risk, ticket-pack exposure, evidence freshness, and stale approvals. The shipped Week 4 slice adds `/lottery/governance`, threshold preferences, V14 route smoke/release readiness coverage, and responsive governance polish.
- Preserve provider isolation and project-owned API boundaries: browser code stays on `record/*` and `lottery/*`, simulations do not call external providers directly, and all execution actions write audit evidence.

### V15: Adaptive Review And Mobile Execution

Goal: make the V14 execution loop self-improving and easier to operate on mobile: outcomes should be attributed back to the evidence that produced them, recommendations should move through a lifecycle, and daily actions should be reviewable from compact command surfaces.

- Add outcome attribution across strategy portfolios, simulations, saved decisions, ticket packs, saved tickets, and actual draw results. The shipped Week 1 slice adds `LotteryOutcomeAttribution`, `/lottery/outcomes`, issue timelines, contribution tables, simulation drift rows, ticket-pack execution summaries, and settlement/governance handoffs.
- Add calibrated recommendation lifecycle for promoting, watching, pausing, or retiring rules, portfolios, and simulator settings. The shipped Week 2 slice adds `LotteryRecommendation`, lifecycle APIs, `/lottery/recommendations`, confidence/evidence views, refresh/status actions, and strategy/research/governance/simulator/decision handoffs.
- Add a mobile command flow that compresses today, next draw, pending approvals, stale evidence, settlement gaps, and release blockers into touch-friendly cards. The shipped Week 3 slice adds `/lottery/mobile`, action/pack/outcome/recommendation segments, batch review actions, and entry points from workbench, alerts, governance, ticket packs, and month-end review.
- Add closed-loop reports and release evidence for attribution, recommendations, mobile command flow, and V15 governance. The shipped Week 4 slice adds V15 report presets, evidence-pack cards, audit filters, route smoke coverage, release-readiness rows, and responsive export polish.
- Preserve project-owned API boundaries: frontend routes continue to call `lottery/*` and reuse existing workbench/governance/ticket-pack/report APIs before adding narrow backend summaries.

### V16: Frontend Usability

Goal: make the lottery module easier to use every day. This version should improve navigation clarity, reduce repeated input, make states and actions easier to scan, and polish responsive behavior before adding more domain depth.

- Improve navigation and information architecture after the grouped menu consolidation. The shipped Week 1 slice adds a persistent current-group child navigation strip above the footer, keeps grouped pages directly reachable on desktop and mobile, and documents the reduced workflow menu.
- Improve form and operation ergonomics for ticket, ticket-pack, recommendation, and mobile-command surfaces. Planned Week 2 focuses on safer primary actions, better defaults, recent values, and readable action summaries.
- Improve list, filter, and state readability across tickets, attribution, recommendations, audit events, and review queues. Planned Week 3 focuses on filter presets, state labels, and pending/recently-handled views where supported by existing data.
- Improve visual consistency and release quality across the lottery module. Planned Week 4 focuses on spacing, wrapping, mobile density, smoke coverage, and release evidence for usability changes.
- Prefer frontend-only improvements for this version unless an existing API shape blocks a meaningful usability fix.

## API Boundary

Frontend should only call:

```text
record/*
lottery/*
```

Long term, new lottery domain work should prefer:

```text
lottery/records/*
lottery/statistics/*
lottery/predictions/*
lottery/decision-sets/*
lottery/tickets/*
lottery/ledger/*
lottery/providers/*
lottery/preferences
lottery/data-quality
lottery/workbench
lottery/experiments/*
lottery/backtests/*
lottery/research/*
lottery/alerts/*
lottery/calendar/*
lottery/budget/*
lottery/exports/*
lottery/audit/*
lottery/operations/*
lottery/strategy-notes/*
```

Do not add browser-side calls to external lottery websites or data providers.

Ticket workflow enhancements, including paste import preview, duplicate checks, batch row actions, and issue drill-throughs, must stay on the project-owned `lottery/tickets/*` and `lottery/ledger/*` APIs.

Report builder, CSV download, audit explorer, and maintenance preview enhancements must stay on the existing `lottery/exports/*`, `lottery/audit/*`, and maintenance API surfaces.
