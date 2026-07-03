# Module: Watchlist

Last updated: 2026-07-03

## Purpose

Persist user-selected symbols and drive the investment page from saved data instead of hard-coded defaults.

## Storage

MongoDB collection:

```text
stock_watchlist
```

Current model:

```text
StockWatchlist
- id
- userId
- symbol
- market
- code
- name
- sortOrder
- createdAt
- updatedAt
```

## Flow

```text
1. User adds symbol.
2. Backend normalizes symbol.
3. Backend fetches quote or metadata to fill name if available.
4. Backend writes watchlist item to MongoDB.
5. Duplicate normalized symbol is rejected or treated as idempotent success.
6. Frontend reloads watchlist.
7. Frontend requests quotes for watchlist symbols.
```

## Ordering

```text
sortOrder asc, createdAt asc
```

## User Ownership

Current implementation uses `userId = default`. Final design should bind watchlists to the authenticated user once auth context is ready.

## API Surface

```text
GET /stock/watchlist
POST /stock/watchlist
DELETE /stock/watchlist/{symbol}
PUT /stock/watchlist/order
```

## Frontend Behavior

```text
1. Load /stock/watchlist.
2. Fetch /stock/quotes for saved symbols.
3. Add input symbols to watchlist through /stock/watchlist.
4. Keep quick lookup separate from persisted watchlist.
5. Delete saved symbols through /stock/watchlist/{symbol}.
```

## Dependency Rule

Watchlist code depends on normalized project DTOs and stock service interfaces only. It must not know Sina request formats or parsing rules.
