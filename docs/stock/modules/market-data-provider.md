# Module: Market Data And Provider Switching

Last updated: 2026-07-03

## Purpose

Provide normalized quote data to upper layers while keeping third-party providers replaceable.

## Architecture Rule

Stock data sources must be switchable. Controllers, frontend pages, watchlist logic, position logic, alert logic, and analysis logic must not depend on Sina or any other concrete provider.

## Current Layering

```text
Frontend
-> /stock/* HTTP APIs
-> Controller
-> Domain Service
-> StockMarketProviderRouter
-> StockMarketProvider implementations
```

## Provider Contract

```java
public interface StockMarketProvider {
    String name();

    List<StockQuote> quotes(List<String> symbols);
}

public interface StockKLineProvider {
    String name();

    List<StockKLine> dailyKLines(String symbol, String startDate, String endDate);
}
```

## Current Implementations

- `SinaStockMarketProvider`: owns Sina HTTP access, GBK decoding, response parsing, and provider-specific unavailable quote mapping.
- `StockMarketProviderRouter`: chooses active provider and fallback providers.
- `StockMarketService`: owns cache, last-success fallback snapshots, quote ordering, and normalized public behavior.
- `SinaStockKLineProvider`: owns Sina daily K-line HTTP access and JSON parsing.
- `StockKLineProviderRouter`: chooses active and fallback K-line providers.
- `StockKLineService`: owns MongoDB upsert, Redis sync locks, sync logs, and scheduled/manual sync behavior.

## Configuration

```yaml
stock:
  market:
    provider: sina
    fallback-providers:
      - tencent
      - eastmoney
```

## Symbol Normalization

Initial A-share rules:

```text
600519   -> sh600519
900901   -> sh900901
000001   -> sz000001
300750   -> sz300750
sh600519 -> sh600519
sz000001 -> sz000001
```

Rules:

- Normalize at the service/provider boundary.
- Store normalized `symbol`, `market`, and `code`.
- Preserve `sourceSymbol` for observability.
- Do not let frontend infer market rules.

## Quote Fetch Logic

```text
1. Receive symbols from frontend.
2. Normalize symbols.
3. Check Redis latest quote cache.
4. For cache misses, call provider router.
5. Provider router calls active provider.
6. Active provider returns normalized StockQuote.
7. Save latest quote to Redis.
8. Save successful quote to last-success Redis snapshot.
9. Return quotes in requested order.
```

## Provider Failure Logic

```text
1. Provider request fails or returns unavailable data.
2. Read stock:quote:last-success:{symbol}.
3. If fallback exists, return it with stale=true and staleReason.
4. If fallback does not exist, return unavailable quote with message.
```

## API Surface

```text
GET /stock/quote?symbol=600519
GET /stock/quotes?symbols=sh000001&symbols=sz399001
GET /stock/providers/health
GET /stock/providers/config
GET /stock/providers/probe?category=quote&symbol=600519
GET /stock/providers/probe/all?symbol=600519
GET /stock/providers/probe/latest?category=quote
```

## Frontend Routes

```text
/investments/providers
/investments/settings
```

Current UX:

- Provider page reads `GET /stock/providers/health` and shows active, fallback, registered, missing, status, and checked time.
- Provider page can call `GET /stock/providers/probe` to verify the configured quote or K-line provider route with a sample symbol.
- Provider page can call `GET /stock/providers/probe/all` to verify quote and K-line provider routes in one action.
- Provider page reads `GET /stock/providers/probe/latest` to restore the latest Redis-backed probe result after reload or category changes.
- Settings page reads `GET /stock/providers/config` for a read-only backend runtime configuration snapshot.
- Settings page documents current backend configuration boundaries and planned user preferences.
- Provider switching remains backend configuration-driven.

## Provider Config Snapshot

`GET /stock/providers/config` returns `StockProviderConfig` with provider, fallback provider order, Redis TTLs, configured symbols, scheduled sync switches, cron expressions, and a millisecond `checkedAt` timestamp.

Rules:

- The endpoint is read-only.
- It reflects backend runtime configuration; it does not persist user preferences.
- Frontend settings uses this snapshot instead of hard-coded config values.
- Provider switching still happens through backend configuration and provider routers.

## Provider Probe Logic

```text
1. Frontend submits category and optional sample symbol.
2. Backend normalizes category to quote or kline.
3. Backend picks the requested symbol or the first configured default symbol.
4. Quote probes call StockMarketProviderRouter directly.
5. K-line probes call StockKLineProviderRouter directly.
6. Backend returns StockProviderProbeResult with success, availability, sample count, durationMs, checkedAt, and message.
7. Backend stores the latest result in Redis key `stock:provider:probe:last:{category}`.
```

Rules:

- Probe result timestamps are millisecond values.
- Probe failures return a normalized result with `success=false`.
- Controllers and frontend pages do not branch on concrete providers.
- Probe calls are operational checks and do not write MongoDB.
- Latest probe snapshots are short-lived Redis state controlled by `stock.market.provider-probe-ttl-seconds`.
- All-provider probe runs quote and K-line probes through the same service method, so each category still updates its own Redis latest key.

## Verification

- `StockMarketServiceTest.normalizeSymbolAddsMarketPrefixForAShares`
- `StockMarketServiceTest.quotesParsesSinaResponseIntoNormalizedQuote`
- `StockMarketServiceTest.quotesWritesFetchedAtQuoteToRedisCache`
- `StockMarketServiceTest.quotesReturnsLastSuccessCacheWhenProviderFails`
- `StockMarketServiceTest.providerProbeChecksQuoteProviderThroughRouter`
- `StockMarketServiceTest.providerProbeChecksKLineProviderThroughRouter`
- `StockMarketServiceTest.providerProbeReturnsFailureResultWhenProviderFails`
- `StockMarketServiceTest.providerProbeWritesLatestResultToRedis`
- `StockMarketServiceTest.latestProviderProbeReadsResultFromRedis`
- `StockMarketServiceTest.providerProbeAllChecksQuoteAndKLineProviders`
- `StockMarketServiceTest.providerConfigReturnsBackendRuntimeSnapshot`
- `StockMarketControllerTest` for repeated `symbols` query params.
