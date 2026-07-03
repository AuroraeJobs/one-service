# Stock Documentation Index

Last updated: 2026-07-03

This folder is the durable memory for the stock module. It is organized in two directions:

- `iterations/`: what was planned and delivered by iteration.
- `modules/`: feature-module design, data ownership, and key logic.

## Resume Entry

When continuing in a new Codex thread, say:

```text
Continue the stock module from docs/stock/README.md.
Start with the next unchecked task in docs/stock/iterations/checklist.md.
Keep stock data sources switchable, and keep storage as MongoDB plus Redis.
```

First commands to run:

```bash
git status --short
rg -n "StockMarket|StockQuote|stockApi|实时行情" .
java -version
mvn -version
```

## Iteration Docs

- [Menu and version plan](menu-and-version-plan.md): target stock menus and version plan by menu.
- [Roadmap](iterations/roadmap.md): one-month plan and product direction.
- [Checklist](iterations/checklist.md): completed and remaining task board.
- [Baseline real-time quote](iterations/00-baseline-real-time-quote.md)
- [Week 1 watchlist and quote stability](iterations/01-watchlist-quote-stability.md)
- [Week 2 historical data and charts](iterations/02-historical-data-charts.md)
- [Week 3 positions, trades, and returns](iterations/03-positions-trades-returns.md)
- [Week 4 alerts, analysis, and provider abstraction](iterations/04-alerts-analysis-provider.md)
- [Iteration 05 trade recalculation and K-line provider](iterations/05-trade-recalculation-and-kline-provider.md)
- [Iteration 06 dashboard and detail linkage](iterations/06-dashboard-detail-linkage.md)
- [Iteration 07 preferences and provider operations](iterations/07-preferences-and-provider-ops.md)
- [Iteration 08 operational editing](iterations/08-operational-editing.md)
- [Iteration 09 sync recovery](iterations/09-sync-recovery.md)
- [Iteration 10 provider operations](iterations/10-provider-operations.md)
- [Iteration 11 sync operations summary](iterations/11-sync-operations-summary.md)
- [Iteration 12 sync log filters](iterations/12-sync-log-filters.md)
- [Iteration 13 sync log windowing](iterations/13-sync-log-windowing.md)
- [Quality gates](iterations/quality-gates.md)

## Module Docs

- [Technical design overview](modules/technical-design.md)
- [Market data and provider switching](modules/market-data-provider.md)
- [Watchlist](modules/watchlist.md)
- [Historical K-line and charts](modules/historical-kline.md)
- [Portfolio, positions, and trades](modules/portfolio.md)
- [Alerts and analysis](modules/alerts-analysis.md)
- [Storage, JSON, and time rules](modules/storage-json-time.md)

## Non-Negotiable Rules

- Frontend calls only internal `/stock/*` APIs.
- Upper layers depend on project DTOs and service/provider interfaces, not concrete providers.
- Provider-specific request, parsing, charset, and response logic stays behind provider implementations.
- MongoDB stores persisted stock domain data and historical data.
- Redis stores quote cache, fallback snapshots, provider health, sync locks, throttling, and short-lived state.
- API/cache time fields use millisecond timestamps instead of `LocalDateTime`.

## Delivery Rule

After each completed milestone:

```text
Update the relevant iteration doc.
Update the relevant module doc when key logic changes.
Update docs/stock/iterations/checklist.md.
Run the appropriate verification.
Review git status and diff.
Commit and push.
```
