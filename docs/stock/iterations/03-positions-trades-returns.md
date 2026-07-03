# Iteration 03: Positions, Trades, And Returns

Last updated: 2026-07-03

## Goal

Connect market prices to personal investment records and dashboard returns.

## Delivered

- Added `StockAccount`, `StockPosition`, and `StockTrade`.
- Added MongoDB repositories for accounts, positions, and trades.
- Added account, position, and trade CRUD endpoints.
- Supported `BUY`, `SELL`, `DIVIDEND`, `FEE`, `BONUS_SHARE`, and `SPLIT` trade records.
- Added portfolio summary endpoint.
- Calculated current market value, floating PnL, floating PnL percent, and today PnL.
- Added investment dashboard summary cards.
- Added holdings table sorted by market value/PnL calculations from backend.
- Added portfolio tests for account defaults, trade normalization, unsupported trade type rejection, and summary calculations.

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
GET /stock/trades
POST /stock/trades
PUT /stock/trades/{id}
DELETE /stock/trades/{id}
GET /stock/portfolio/summary
```

## Storage

- MongoDB: `stock_accounts`, `stock_positions`, `stock_trades`.

## Related Module Docs

- [Portfolio, positions, and trades](../modules/portfolio.md)
- [Market data and provider switching](../modules/market-data-provider.md)
