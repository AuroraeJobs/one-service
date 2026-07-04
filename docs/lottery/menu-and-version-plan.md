# Lottery Menu And Version Plan

Last updated: 2026-07-04

## Target Menu Tree

The current lottery navigation already has a strong exploratory surface. The target plan keeps those pages but organizes future operational work around stable daily workflows.

```text
彩票
- 工作台
- 概览
- 开奖
  - 开奖记录
  - 数据同步
  - 数据质量
- 统计
  - 频率
  - 分组
  - 分布
  - 年度
  - 宇航员
- 预测
  - 最新预测
  - 候选号码
  - 训练回放
  - 规则管理
  - 策略实验
  - 回测报告
  - 研究对比
- 我的
  - 投注记录
  - 中奖核验
  - 投入产出
- 运维
  - 数据同步
  - 数据质量
  - Provider
  - 提醒
  - 导出审计
  - 设置
- 分析
  - 幻境
  - 宇宙
  - 像素
  - 行列
  - 太极
  - 卦象
  - 节气
- 数据源
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
- Add export and audit surfaces for tickets, predictions, experiments, backtests, ledger rows, sync logs, and probe logs at `/lottery/exports`.
- Add non-destructive maintenance preview and cleanup dry-run operations behind the export/audit surface.
- Keep all external-provider behavior behind backend services and preserve project-owned `lottery/*` frontend calls.

### V9: Frontend Experience And Power Tools

Goal: make the completed platform capabilities feel like a richer user-facing product.

- Upgrade `/lottery/workbench` with quick actions, recent-work shortcuts, saved view state, and richer daily widgets. The shipped 11A slice adds the quick-action rail, recent prediction/ticket/experiment/backtest/export shortcuts, and browser-local saved filter state for key growing lists.
- Add `/lottery/research` for side-by-side experiment, backtest, rule, and ledger evidence comparison.
- Add ticket workflow power tools: bulk paste/import, duplicate preview, batch actions, issue timeline, and mobile-friendly cards.
- Improve `/lottery/exports` with browser CSV download, report builder, audit filters, maintenance grouping, and print-friendly report views.
- Preserve dense operational layouts and URL-backed filters so drill-through from workbench remains predictable.

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
```

Do not add browser-side calls to external lottery websites or data providers.
