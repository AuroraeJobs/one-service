# Iteration 04: Alerts, Analysis, And Provider Abstraction

Last updated: 2026-07-03

## Goal

Make the module useful for daily monitoring and complete provider abstraction.

## Delivered

- Added `StockAlertRule` and `StockAlertHistory`.
- Added MongoDB repositories for alert rules and alert history.
- Added alert rule CRUD and history query APIs.
- Added price, percent-change, and volume-abnormal alert evaluation.
- Added scheduled alert evaluation job.
- Used Redis for alert throttling and last-evaluated state.
- Added analysis summary endpoint.
- Added concentration, volatility, drawdown, top gainers, and top losers.
- Extracted `StockMarketProvider`.
- Added `StockMarketProviderRouter`.
- Moved Sina request/parsing behind `SinaStockMarketProvider`.
- Made active provider configurable with `stock.market.provider`.
- Added fallback provider order with `stock.market.fallback-providers`.
- Added provider health endpoint.
- Confirmed frontend and upper-layer stock modules depend on normalized internal contracts.

## API Surface

```text
GET /stock/alerts/rules
POST /stock/alerts/rules
PUT /stock/alerts/rules/{id}
DELETE /stock/alerts/rules/{id}
GET /stock/alerts/history
POST /stock/alerts/evaluate
GET /stock/analysis/summary
GET /stock/providers/health
```

## Storage

- MongoDB: `stock_alert_rules`, `stock_alert_history`.
- Redis: `stock:alert:triggered:{userId}:{ruleId}`, `stock:alert:last-evaluated:{userId}`.

## Related Module Docs

- [Alerts and analysis](../modules/alerts-analysis.md)
- [Market data and provider switching](../modules/market-data-provider.md)
- [Storage, JSON, and time rules](../modules/storage-json-time.md)
