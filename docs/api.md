# PerpArena API and Data Architecture

PerpArena primarily uses Next.js Server Components and server actions. Route
handlers are added only where a public read-only response, operational check, or
guarded demo operation has a clear purpose.

All API responses use JSON and avoid exposing stack traces, connection strings,
or internal Prisma errors.

## Data Flow Audit

- Direct Prisma usage is kept in repository and persistence modules under
  `src/features/**/repository.ts`, `src/features/**/persistence.ts`, and
  `src/lib/db/*`.
- Server Components read data through explicit services under
  `src/features/*/server/service.ts`.
- Server actions validate form input, check demo mutation mode, call services,
  and revalidate affected paths.
- Route handlers validate parameters, search parameters, and request bodies with
  Zod before calling services.
- Client-side fetching is not used for core competition, leaderboard, trader, or
  admin data reads.
- Known heavier reads remain in the dashboard and trader repositories, where the
  seeded portfolio dataset is loaded server-side and filtered deterministically.
  Future production scale should move more filtering, ranking, and pagination
  into SQL/window queries.

## Services

- Competition retrieval:
  `src/features/competitions/server/service.ts`
- Leaderboard querying:
  `getLeaderboardService(slug, query)`
- Trader profile and summary retrieval:
  `src/features/traders/server/service.ts`
- Analytics, score, integrity, and quest/engagement recalculation:
  `src/features/recalculation/server/service.ts`
- Admin configuration and integrity review:
  `src/features/admin/server/service.ts`
- Export generation:
  `exportCompetitionResultsService(id)`

## Response Shape

Success:

```json
{ "ok": true, "data": {} }
```

Error:

```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request."
  }
}
```

Supported error codes are `BAD_REQUEST`, `FORBIDDEN`, `NOT_FOUND`,
`UNAVAILABLE`, and `INTERNAL`.

## Public Endpoints

### `GET /api/health`

Reports process availability only. It does not check PostgreSQL.

### `GET /api/readiness`

Checks whether `DATABASE_URL` is configured and valid, PostgreSQL is reachable,
and the seeded competition `solana-perps-league-season-01` exists. Returns `503`
when any dependency is unavailable.

### `GET /api/competitions/:slug/leaderboard`

Returns the validated, paginated leaderboard for a competition.

Query parameters:

- `search`: wallet search, max 80 characters
- `division`: supported `Division` enum
- `market`: supported `MarketSymbol` enum
- `integrity`: `VERIFIED`, `WARNING`, `UNDER_REVIEW`, or `SCORE_LIMITED`
- `sort`: `score`, `netPnl`, `roi`, `maximumDrawdown`, `winRate`,
  `activeDays`, or `liquidations`
- `direction`: `asc` or `desc`
- `page`: integer from 1 to 999
- `pageSize`: integer from 5 to 50

Invalid query values are safely normalized by the shared leaderboard parser.

### `GET /api/traders/:wallet/summary`

Returns a compact synthetic participant summary. The wallet parameter must be 8
to 120 characters.

## Admin and Demo Endpoints

### `GET /admin/competitions/:id/export`

Returns a JSON export containing competition metadata, rankings, component
scores, integrity status, scoring version, and the simulation disclaimer.

### `POST /api/admin/recalculate`

Guarded demo endpoint for recalculation.

Request body:

```json
{
  "competitionSlug": "solana-perps-league-season-01",
  "kind": "scores"
}
```

`kind` may be `analytics`, `scores`, `integrity`, or `engagement`.

Mutations are disabled by default and are unavailable in production. Development
mutation mode requires `PERPARENA_ADMIN_MUTATIONS=enabled`.

## Caching

Public read endpoints return short shared-cache headers:
`s-maxage=30, stale-while-revalidate=120`.

Health, readiness, export, and mutation endpoints use `no-store` or remain
dynamic because their results should not be cached across administrative checks
or writes.

## Rate Limiting

Distributed rate limiting is not implemented in Phase 12 because no supported
shared store is configured. The API does enforce pagination limits and guarded
admin mutation mode, but it does not claim request throttling.

## Security Notes

- No endpoint returns `DATABASE_URL`, stack traces, Prisma internals, or secrets.
- Health is intentionally shallow; readiness is dependency-aware.
- Admin mutation endpoints are demonstration-only and environment-gated.
- Synthetic exports include the global simulation disclaimer.
