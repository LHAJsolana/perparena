# PerpArena Deployment Guide

PerpArena should be deployed as a truthful public portfolio application backed
by PostgreSQL. It must not be presented as a real exchange, broker, custodian,
or live trading venue.

## Target Platform

The approved production platform is Vercel with the repository root as the
application root.

No `vercel.json` is required at this stage. Vercel's Next.js defaults match the
application because PerpArena uses the standard `npm install` and
`npm run build` flow.

Verified production deployment:

- project: `perparena`
- public URL: `https://perparena.vercel.app`
- deployment ID: `dpl_F8N4iw8WaK9Nogrg6EBB6wBj6vy7`
- deployment commit: `90bc8e1`
- deployed: 2026-07-27

## PostgreSQL Provider

The production PostgreSQL provider is Supabase. The verified local production
connection uses the Supavisor Session pooler on port 5432.

PerpArena uses Prisma with:

```prisma
provider = "postgresql"
url      = env("DATABASE_URL")
```

There is no SQLite, file, memory, or mock persistence fallback.

Do not place database credentials in any `NEXT_PUBLIC_*` variable.

## Supabase Connection Mode

Use the verified Supavisor Session pooler URL for `DATABASE_URL`. PerpArena uses
Prisma Client, server-side rendering, API routes, and controlled recalculation
transactions. Session mode preserves Prisma's expected connection behavior and
does not require a separate `DIRECT_URL` with the current schema.

The Supavisor Transaction pooler is not the chosen default because this
application uses Prisma transactions and has no demonstrated need to change from
the verified Session configuration. Add `DIRECT_URL` only if a future production
configuration demonstrates a separate migration connection is required.

## Environment Variables

Required:

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`

Optional:

- `PERPARENA_ADMIN_MUTATIONS`
- `PERPARENA_ADMIN_TOKEN`
- `PERPARENA_ALLOW_PRODUCTION_SEED`

Production defaults:

- Leave `PERPARENA_ADMIN_MUTATIONS` unset or empty.
- Set `PERPARENA_ADMIN_TOKEN` only if a development/demo recalculation endpoint
  must be additionally gated.
- Set `PERPARENA_ALLOW_PRODUCTION_SEED=enabled` only for the one approved seed
  operation, then remove it.

Current production configuration sets only the required variables. `DATABASE_URL`
is encrypted in Vercel and not exposed to the client. `NEXT_PUBLIC_APP_URL` is
`https://perparena.vercel.app`.

## Migration Strategy

Use deploy migrations manually or through an explicit operator command, not as
an automatic Vercel build side effect:

```bash
npm run db:generate
npm run db:migrate:deploy
```

Do not run `npm run db:migrate` against production.

The Vercel build must generate Prisma Client, but it must not run migrations,
seed, reset, or recalculation scripts automatically. `postinstall` runs
`prisma generate` so Vercel can build reliably without mutating the database.

## Seed Strategy

Production seeding is explicit and non-overwriting.

Use it only when the target production database is intentionally empty:

```bash
PERPARENA_ALLOW_PRODUCTION_SEED=enabled npm run db:seed
```

After seeding, run deterministic recalculation:

```bash
npm run analytics:recalculate
npm run score:recalculate
npm run integrity:recalculate
npm run engagement:recalculate
```

Do not run `npm run simulation:reset` against production. The reset script
refuses `NODE_ENV=production`.

## Verification

Verify expected data after migration and seed:

- competition slug: `solana-perps-league-season-01`
- markets: 3
- participants: at least 80
- closed trades: at least 1,500
- integrity flags: present
- score breakdowns: present after score recalculation
- quest progress and achievements: present after engagement recalculation

Verify constraints and indexes through Prisma schema and migration SQL before
deploying.

## Production Smoke Test

The 2026-07-27 production smoke test passed for:

- public URL uses HTTPS
- `/` loads
- `/competitions` loads
- `/competitions/solana-perps-league-season-01` loads database-backed
  leaderboard data
- leaderboard search works
- division filter works
- sorting works
- pagination works
- trader profile opens from leaderboard
- charts render on trader profile
- `/methodology` loads
- `/integrity` loads
- `/about` displays the simulation disclaimer
- `/admin` clearly shows demonstration administration mode
- admin mutation remains restricted
- `/api/readiness` reports truthfully
- `/definitely-not-a-real-route` shows the designed 404
- metadata and Open Graph image routes load
- no browser console critical errors
- no public response exposes secrets or database URLs

Unknown competition and unknown trader routes render the designed unavailable
state without exposing stack traces or connection details.

## Known Production Limitations

- This is a portfolio prototype, not a production financial system.
- No full authentication system is implemented.
- No distributed rate limiting is configured.
- No production monitoring provider is configured.
- Dependency advisories should be reviewed before public launch.
- Remaining high-severity advisories are transitive development/toolchain
  advisories requiring breaking ecosystem upgrades; no critical advisories
  remain.
- HSTS is left to the hosting platform.

## Repository Topics

Recommended GitHub topics:

- `solana`
- `defi`
- `perpetual-futures`
- `trading-competition`
- `nextjs`
- `typescript`
- `prisma`
- `postgresql`
- `risk-analytics`
- `portfolio-project`

These topics describe the portfolio project domain. They do not claim
affiliation with Solana organizations or any trading protocol.
