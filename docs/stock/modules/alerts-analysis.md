# Module: Alerts And Analysis

Last updated: 2026-07-03

## Purpose

Provide daily monitoring and portfolio insight using normalized quotes, holdings, and MongoDB history.

## Alert Storage

MongoDB collections:

```text
stock_alert_rules
stock_alert_history
```

Redis keys:

```text
stock:alert:triggered:{userId}:{ruleId}
stock:alert:last-evaluated:{userId}
```

## Alert Rules

Supported rule types:

```text
PRICE
PERCENT_CHANGE
VOLUME_ABNORMAL
```

Supported directions:

```text
ABOVE
BELOW
UP
DOWN
```

Evaluation:

- `PRICE` evaluates `StockQuote.price`.
- `PERCENT_CHANGE` evaluates `StockQuote.changePercent`.
- `VOLUME_ABNORMAL` evaluates `StockQuote.volume`.
- `ABOVE` and `UP` trigger when actual value is greater than or equal to `targetValue`.
- `BELOW` and `DOWN` trigger when actual value is less than or equal to `targetValue`.

## Alert Evaluation Flow

```text
1. Load enabled alert rules from MongoDB.
2. Use Redis throttle state to avoid repeated notifications.
3. Fetch latest quotes through internal stock service.
4. Evaluate rules against normalized DTOs.
5. Write alert history to MongoDB.
6. Update Redis throttle and last-evaluated state.
```

## Alert API Surface

```text
GET /stock/alerts/rules
POST /stock/alerts/rules
PUT /stock/alerts/rules/{id}
DELETE /stock/alerts/rules/{id}
GET /stock/alerts/history
POST /stock/alerts/evaluate
```

## Analysis Summary

Endpoint:

```text
GET /stock/analysis/summary
```

Rules:

- Concentration source: `IStockPortfolioService.summary().holdings`.
- Concentration percent: holding `marketValue / totalMarketValue * 100`.
- Top gainers and losers use normalized holding `changePercent`.
- Volatility uses recent MongoDB K-line rows and average absolute `changePercent` over the latest 60 daily rows.
- Drawdown uses recent MongoDB K-line closes and max peak-to-close drawdown over the latest 60 daily rows.
- Analysis reads internal normalized DTOs and MongoDB history only.

## Dependency Rule

Alerts and analysis must not depend on concrete quote providers. They consume normalized quote, portfolio, and K-line data only.
