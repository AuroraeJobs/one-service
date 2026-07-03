# Module: Storage, JSON, And Time Rules

Last updated: 2026-07-03

## Storage Rule

Storage is fixed as MongoDB plus Redis.

MongoDB stores durable state:

- Stock metadata.
- Watchlists.
- Historical K-lines.
- Accounts.
- Positions.
- Trades.
- Alert rules.
- Alert history.
- Sync logs.

Redis stores volatile state:

- Latest quote cache.
- Last successful quote fallback snapshot.
- Provider health.
- Sync locks.
- Refresh throttling.
- Alert last-evaluated state.
- Short-lived calculation cache.

Do not add another persistent storage engine for the stock module unless the roadmap is explicitly updated.

## Redis Key Plan

```text
stock:quote:{symbol}
stock:quote:last-success:{symbol}
stock:provider:health:{provider}
stock:sync:lock:{jobName}
stock:sync:last-run:{jobName}
stock:alerts:last-evaluated:{ruleId}
stock:portfolio:summary:{userId}
```

Current quote cache configuration:

```yaml
stock:
  market:
    cache-enabled: true
    quote-cache-ttl-seconds: 10
    fallback-cache-ttl-seconds: 604800
```

## JSON Rule

- Use `com.one.common.util.JsonUtil` for service-layer JSON serialization, deserialization, JSON tree parsing, and JSON file writing.
- Do not inject or instantiate `ObjectMapper` in business services for ad hoc JSON conversion.
- Keep cache JSON conversion centralized so Java time/module configuration does not leak across services.

## Time Rule

- Use millisecond timestamps for stock module API/cache time fields.
- Do not expose `LocalDateTime` in stock quote, watchlist, provider health, sync, alert, or analysis DTOs.
- Frontend may format timestamps for display using the user's runtime locale.
- Backend API contracts should stay timezone-neutral.

Examples:

```text
fetchedAt: 1783065600000
createdAt: 1783065600000
updatedAt: 1783065600000
triggeredAt: 1783065600000
```

## Migration Note

Existing persisted `LocalDateTime` fields should be migrated to millisecond timestamps when touched. API clients should expect numeric timestamp fields for stock module time values.
