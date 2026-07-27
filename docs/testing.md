# PerpArena Testing Strategy

PerpArena testing favors deterministic behavior, meaningful edge cases, and
honest reporting over superficial coverage totals.

## Test Layers

### Unit Tests

Unit tests cover pure and mostly pure behavior:

- financial analytics
- equity curves
- maximum drawdown
- ROI
- profit factor edge cases
- daily returns
- qualified trade detection
- score components and total score bounds
- tie breakers
- integrity heuristic generation and status derivation
- integrity score adjustment caps
- quest, streak, and achievement evaluation
- seed determinism
- Zod schemas
- formatting and UTC date utilities

Primary command:

```bash
npm run test
```

Targeted examples:

```bash
npx vitest run tests/analytics-engine.test.ts
npx vitest run tests/scoring-engine.test.ts
npx vitest run tests/integrity-engine.test.ts
npx vitest run tests/engagement-engine.test.ts
npx vitest run tests/quality-assurance.test.ts
```

### Integration Tests

Integration-style tests use deterministic fixtures and mocked Prisma boundaries
where a real database is not available. They cover:

- persistence idempotency patterns
- exports
- admin validation
- API route validation
- readiness response truthfulness
- generated data quality
- score ranges and deterministic ranking

Database-backed integration checks require a local PostgreSQL database with
`DATABASE_URL` configured. Without PostgreSQL, commands that need persistence
must fail honestly rather than falling back to memory, files, SQLite, or mock
persistence.

Recommended database-backed QA sequence:

```bash
npm run db:validate
npm run db:generate
npm run db:migrate
npm run db:seed
npm run analytics:recalculate
npm run score:recalculate
npm run integrity:recalculate
npm run engagement:recalculate
npm run score:analyze
npm run integrity:analyze
```

## E2E Setup

Playwright runs against the Next.js development server configured in
`playwright.config.ts`.

```bash
npm run test:e2e
```

Current E2E coverage includes:

- homepage smoke
- desktop navigation
- mobile navigation
- keyboard menu access
- competition discovery route
- methodology page
- integrity page
- about page and disclaimer
- admin demo read-only state
- API health and readiness smoke checks
- seeded leaderboard search, division filtering, market filtering, integrity
  filtering, sorting, pagination, and trader navigation when PostgreSQL is
  configured
- trader profile metrics, charts, score breakdown, integrity explanation,
  quests, achievements, and trade history when PostgreSQL is configured
- broken-route handling

## Accessibility QA

Automated Axe checks run through Playwright for the main public routes, seeded
competition/trader routes, and mobile navigation.

Automated and manual checks should inspect:

- heading hierarchy
- form labels
- table captions and rank context
- keyboard focus visibility
- mobile navigation keyboard access
- non-color-only status communication
- tooltip naming
- form validation errors
- reduced-motion support
- screen-reader-only context for dense data rows

## Responsive QA

Representative widths:

- 320px small mobile
- 390px large mobile
- 768px tablet
- 1366px laptop
- 1920px wide desktop

Inspect overflow around:

- synthetic wallet identifiers
- leaderboard rows
- trader metric cards
- charts
- admin forms
- long score and integrity explanations

## Data QA

Generated and seeded data should be checked for:

- impossible timestamps
- NaN or Infinity
- negative fees
- non-positive leverage
- invalid markets
- invalid divisions
- score totals outside 0-100
- missing or duplicate participant ranking identities
- invalid integrity status
- broken score component totals
- misleading P&L formatting

## Performance QA

Current risks to monitor:

- server-side in-memory leaderboard ranking on larger datasets
- trader profile loading all trades before slicing recent rows
- chart bundle size on trader pages
- repeated database reads between summary and detail views

No distributed rate limiting or production observability is configured in the
portfolio prototype.

## Complete Verification

Phase-level verification should run:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

When PostgreSQL is configured, also run the database-backed QA sequence above.

## Known Gaps

- Browser tests that require seeded leaderboard data are limited when PostgreSQL
  is unavailable.
- Integration tests use mocks for several Prisma persistence boundaries in this
  environment.
- No automated contrast tooling is installed.
- No coverage threshold is enforced because the priority is meaningful
  behavioral coverage.

## Production Smoke

The 2026-07-27 production smoke test verified `https://perparena.vercel.app`
against Supabase-backed data:

- `/`
- `/competitions`
- `/competitions/solana-perps-league-season-01`
- one valid trader route
- `/methodology`
- `/integrity`
- `/about`
- `/admin`
- `/api/readiness`
- unknown route, unknown competition, and unknown trader behavior
- leaderboard search, filters, sorting, pagination, reset, and mobile rendering
- trader profile metrics, charts, score breakdown, integrity explanation,
  quests, achievements, and trade history
- security headers and absence of database connection strings in public
  responses

## Documentation Checks

The repository does not currently include a dedicated Markdown link-checking
tool. Documentation structure is covered by unit tests in
`tests/documentation-quality.test.ts`.
