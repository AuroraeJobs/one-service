# Iteration 05: Trade Recalculation And K-Line Provider

Last updated: 2026-07-03

## Goal

Turn the stock module from manually maintained portfolio data into a more trustworthy investment ledger, and connect historical K-line sync to a switchable provider source.

This iteration has two tracks:

- Portfolio ledger: trades should drive positions and cost basis.
- Historical market data: K-line sync should fetch data through provider abstractions instead of staying as manual import/upsert only.

## Why This Iteration

The first month built the full skeleton: quotes, watchlist, charts, portfolio summary, alerts, analysis, provider routing, MongoDB, Redis, and quality gates. The most valuable next improvement is making the persisted data self-maintaining.

Original gaps:

- Positions can be manually maintained, but trades do not yet recalculate holdings.
- Historical sync had storage, logs, locks, and scheduler, but the scheduled job recorded `SKIPPED` because no historical provider was wired.
- Analysis quality depends on having real K-line history.

## Scope

### Track A: Trade-Driven Position Recalculation

Deliverables:

- Add a backend recalculation entry point for positions by account and symbol.
- Recalculate position quantity, available quantity, cost amount, and cost price from trades.
- Apply buy trades to increase quantity and cost basis.
- Apply sell trades to reduce remaining quantity and cost basis.
- Track realized PnL for sell trades or expose it in a dedicated summary field if model changes are needed.
- Apply fee and tax into cost/PnL calculations.
- Apply dividend as cash income, separate from price PnL.
- Apply bonus share and split events to quantity and cost price without changing total cost basis incorrectly.
- Trigger recalculation after trade create/update/delete.
- Add manual endpoint to recalculate one symbol or all symbols for recovery/debugging.
- Update portfolio tests to cover buy, sell, fee, dividend, bonus share, split, and delete/recalculate flows.

Suggested API:

```text
POST /stock/positions/recalculate
POST /stock/positions/{symbol}/recalculate
```

Suggested service methods:

```text
recalculatePosition(userId, accountId, symbol)
recalculatePositions(userId, accountId)
recalculateAfterTradeChange(trade)
```

### Track B: Historical K-Line Provider Sync

Deliverables:

- Extract or extend a K-line provider interface that returns normalized `StockKLine` rows.
- Route historical sync through provider selection instead of direct provider-specific code.
- Add one concrete historical provider for A-share daily K-line data.
- Keep provider-specific field mapping and date parsing inside the provider implementation.
- Make manual sync call the provider when request rows are not provided.
- Make scheduled sync fetch configured symbols instead of writing only `SKIPPED`.
- Keep Redis sync locks and MongoDB sync logs.
- Add provider failure behavior: sync log records `FAILED`, frontend/API can inspect failure message.
- Add tests for K-line provider parsing and sync upsert behavior.

Suggested provider contract:

```java
public interface StockKLineProvider {
    String name();

    List<StockKLine> dailyKLines(String symbol, String startDate, String endDate);
}
```

Provider selection should follow the existing quote provider principle:

```text
active provider from config -> fallback providers -> normalized DTOs only
```

## Out Of Scope

- Broker account import.
- Real order placement.
- Multi-currency portfolio accounting.
- Tax-lot selection beyond a simple moving-average or weighted-average cost method.
- Notification channels outside in-app alert history.

## Data And Calculation Rules

- Keep MongoDB as the source of durable trades and positions.
- Keep Redis for sync locks and short-lived operational state only.
- Keep all stock module time fields as millisecond timestamps unless the field is a date identifier such as `tradeDate`.
- Keep frontend display-only for portfolio math; calculations belong in backend services.
- Keep provider-specific K-line parsing behind provider implementations.

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

Bonus share policy:

```text
quantity increases
costAmount remains unchanged
costPrice = costAmount / quantity
```

Split policy:

```text
quantity is multiplied by split ratio
costAmount remains unchanged
costPrice is adjusted by the inverse ratio
```

Dividend policy:

```text
cash income is recorded separately from market price PnL
```

## Acceptance Criteria

- Creating a buy trade creates or updates the corresponding position.
- Creating a sell trade reduces position quantity and cost basis.
- Updating or deleting a trade recalculates the affected position.
- Portfolio summary reflects recalculated positions without frontend-side math.
- Recalculation is idempotent: running it repeatedly returns the same position result.
- K-line manual sync can fetch provider data and upsert MongoDB rows.
- Scheduled K-line sync no longer records only `SKIPPED` when enabled and provider data is available.
- Sync logs clearly show `SUCCESS` or `FAILED` with counts and messages.
- Quote and K-line data sources remain switchable through provider interfaces.
- No controller or frontend code depends on concrete provider classes.
- Backend tests cover the core calculation and provider parsing paths.
- Changed frontend files pass lint if frontend changes are made.
- Full frontend build remains green.

## Progress

### 2026-07-03

Completed the first portfolio recalculation slice:

- Added service entry points to recalculate positions by account and symbol.
- Added manual APIs:

```text
POST /stock/positions/recalculate
POST /stock/positions/{symbol}/recalculate
```

- Trade create, update, and delete now trigger recalculation for the affected position.
- Recalculation currently derives quantity, available quantity, cost amount, and weighted-average cost price from trades.
- Unit coverage was added for weighted-average buy/sell recalculation and delete-triggered recalculation.
- Holding and portfolio summaries expose realized PnL and dividend income.
- Fee, tax, dividend, bonus share, split, delete, and idempotency paths are covered by `StockPortfolioServiceTest`.

Verified:

```bash
JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home PATH=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home/bin:/Users/aurorae/Program/Git/Apache/Maven/maven3.6.3/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin mvn -q -pl one-record/one-record-service -am test -Dtest=StockPortfolioServiceTest -DfailIfNoTests=false -Dsurefire.failIfNoSpecifiedTests=false
JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home PATH=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home/bin:/Users/aurorae/Program/Git/Apache/Maven/maven3.6.3/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin mvn -q -pl one-record/one-record-web -am compile -DskipTests
npm exec eslint -- src/services/api.ts src/components/LifeInvestmentPage.tsx
npm run build
```

Track A status:

- Complete for the current DTO model.

Remaining in Track B:

- Complete for the first provider-backed sync slice.
- `StockKLineProvider` and `StockKLineProviderRouter` route historical daily K-line fetches.
- `SinaStockKLineProvider` fetches and parses normalized A-share daily K-line rows.
- Manual sync fetches provider data when the request body is empty.
- Scheduled sync fetches configured symbols and writes `SUCCESS`/`FAILED` logs instead of always recording `SKIPPED`.
- Redis sync locks and MongoDB sync logs remain in the sync path.

Verified:

```bash
JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home PATH=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home/bin:/Users/aurorae/Program/Git/Apache/Maven/maven3.6.3/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin mvn -q -pl one-record/one-record-service -am test -Dtest=StockKLineServiceTest -DfailIfNoTests=false -Dsurefire.failIfNoSpecifiedTests=false
JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home PATH=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home/bin:/Users/aurorae/Program/Git/Apache/Maven/maven3.6.3/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin mvn -q -pl one-record/one-record-web -am compile -DskipTests
```

## Suggested Implementation Order

1. Add portfolio recalculation tests for buy/sell weighted-average cost.
2. Implement position recalculation service logic.
3. Trigger recalculation from trade create/update/delete.
4. Add manual recalculation endpoints.
5. Add tests for dividends, fees, bonus shares, splits, and idempotency.
6. Add K-line provider interface and router.
7. Add one concrete daily K-line provider.
8. Wire manual and scheduled K-line sync to provider router.
9. Update frontend/API only if new controls or status messages are needed.
10. Update module docs, checklist, run verification, commit, and push.

## Related Docs

- [Portfolio, positions, and trades](../modules/portfolio.md)
- [Historical K-line and charts](../modules/historical-kline.md)
- [Market data and provider switching](../modules/market-data-provider.md)
- [Storage, JSON, and time rules](../modules/storage-json-time.md)
