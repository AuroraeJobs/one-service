# Lottery Menu And Version Plan

Last updated: 2026-07-03

## Target Menu Tree

The current lottery navigation already has a strong exploratory surface. The target plan keeps those pages but organizes future operational work around stable daily workflows.

```text
彩票
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
- 我的
  - 投注记录
  - 中奖核验
  - 投入产出
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
/lottery/overview
/lottery/prediction
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
- Add sync retry and scheduled trigger actions.
- Add data quality repair workflows where safe.

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
```

Do not add browser-side calls to external lottery websites or data providers.
