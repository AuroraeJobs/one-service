# Module: Portfolio, Positions, And Trades

Last updated: 2026-07-03

## Purpose

Connect market data to personal holdings and investment return calculations.

## Storage

MongoDB collections:

```text
stock_accounts
stock_positions
stock_trades
```

Portfolio state is durable and belongs in MongoDB. Real-time quote data remains behind `IStockMarketService`.

## Current Models

```text
stock_accounts
- userId
- name
- broker
- accountNo
- currency
- cashBalance
- status
- createdAt
- updatedAt

stock_positions
- userId
- accountId
- symbol
- market
- code
- name
- quantity
- availableQuantity
- costPrice
- costAmount
- openedAt
- createdAt
- updatedAt

stock_trades
- userId
- accountId
- symbol
- market
- code
- name
- tradeType
- quantity
- price
- amount
- fee
- tax
- tradedAt
- remark
- createdAt
- updatedAt
```

## Trade Types

```text
BUY
SELL
DIVIDEND
FEE
BONUS_SHARE
SPLIT
```

## Portfolio Summary

Endpoint:

```text
GET /stock/portfolio/summary
```

Rules:

- Source of persisted state: MongoDB `stock_positions`.
- Source of market data: `IStockMarketService.quotes`.
- Current market value: `quantity * latestPrice`.
- Floating PnL: `marketValue - costAmount`.
- Floating PnL percent: `floatingPnl / costAmount * 100`; zero when `costAmount` is zero.
- Today PnL: `quantity * quote.changeAmount`.
- Holding rows sort by `marketValue` descending, then `symbol` ascending.
- If quote data is unavailable, market-derived values default to zero and `quoteAvailable` marks the state.

## Next Iteration: Position Recalculation

Current implementation stores manually maintained positions and trade records. Iteration 05 should derive positions from trades:

- Include fees in cost.
- Reduce remaining quantity and cost basis on sell trades.
- Track dividends separately from price PnL.
- Keep calculation logic in backend services.

Initial cost basis policy:

```text
weighted average cost
```

Sell policy:

```text
sellCostBasis = currentAverageCost * soldQuantity
realizedPnl = sellAmount - sellCostBasis - fee - tax
remainingCostAmount = previousCostAmount - sellCostBasis
```

## API Surface

```text
GET /stock/accounts
POST /stock/accounts
PUT /stock/accounts/{id}
DELETE /stock/accounts/{id}
GET /stock/positions
POST /stock/positions
PUT /stock/positions/{id}
DELETE /stock/positions/{id}
POST /stock/positions/recalculate
POST /stock/positions/{symbol}/recalculate
GET /stock/trades
POST /stock/trades
PUT /stock/trades/{id}
DELETE /stock/trades/{id}
GET /stock/portfolio/summary
```

## Frontend Routes

```text
/investments/positions
/investments/trades
```

Current UX:

- Positions page lists backend position rows, supports account filtering, and can trigger manual recalculation.
- Trades page lists trade records, supports account/symbol filtering, and can create/delete trade records.
- Trade creation supports `BUY`, `SELL`, `DIVIDEND`, `FEE`, `BONUS_SHARE`, and `SPLIT`.
- Edit trade remains a follow-up UX task.

## Current Recalculation Behavior

Implemented in Iteration 05:

- Recalculate one position by account and symbol.
- Recalculate all positions for an account or all known trade keys.
- Trigger recalculation after trade create, update, and delete.
- Derive quantity, available quantity, cost amount, and weighted-average cost price from ordered trades.
- Preserve backend ownership of portfolio math; frontend remains display-only.

Still open:

- Expose realized PnL from sell trades.
- Persist or summarize dividend cash income separately.
- Add full test coverage for fee, tax, dividend, bonus share, split, and idempotent recalculation.
