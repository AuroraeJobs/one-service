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
```

## Current Implementations

- `SinaStockMarketProvider`: owns Sina HTTP access, GBK decoding, response parsing, and provider-specific unavailable quote mapping.
- `StockMarketProviderRouter`: chooses active provider and fallback providers.
- `StockMarketService`: owns cache, last-success fallback snapshots, quote ordering, and normalized public behavior.

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
```

## Frontend Routes

```text
/investments/providers
/investments/settings
```

Current UX:

- Provider page reads `GET /stock/providers/health` and shows active, fallback, registered, missing, status, and checked time.
- Settings page documents current backend configuration boundaries and planned user preferences.
- Provider switching remains backend configuration-driven.
- Settings remain read-only until a persisted preferences model and API are designed.

## Verification

- `StockMarketServiceTest.normalizeSymbolAddsMarketPrefixForAShares`
- `StockMarketServiceTest.quotesParsesSinaResponseIntoNormalizedQuote`
- `StockMarketServiceTest.quotesWritesFetchedAtQuoteToRedisCache`
- `StockMarketServiceTest.quotesReturnsLastSuccessCacheWhenProviderFails`
- `StockMarketControllerTest` for repeated `symbols` query params.
