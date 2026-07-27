# PerpArena Portfolio Case Study

## Context

PerpArena is an independent simulated trading competition and analytics prototype. It is a portfolio project and is not affiliated with Adrena, Jupiter, Drift, Jupiter Perps, any exchange, or any trading protocol.

It does not execute real trades, custody funds, accept deposits, provide financial advice, or distribute rewards. All participants, trades, volumes, rankings, and results are synthetic unless explicitly stated otherwise.

## Problem

Trading competition leaderboards can be dominated by account size, excessive leverage, artificial volume, or a single lucky trade. That makes it difficult to understand whether a participant demonstrated repeatable skill, consistency, and risk management.

## Design Principles

- Keep synthetic data clearly labeled.
- Separate analytics from scoring.
- Keep financial calculations deterministic.
- Avoid rewarding raw volume without quality.
- Make integrity signals explainable without making fraud claims.
- Keep admin controls safe for a public portfolio.
- Document limitations as part of the product.

## Architecture

PerpArena uses Next.js App Router, TypeScript, Prisma, PostgreSQL, Zod, Vitest, Playwright, Tailwind CSS, and Recharts. The application is organized by feature, with separate modules for competitions, traders, analytics, scoring, integrity, engagement, admin, simulation, and API boundaries.

Server Components render database-backed pages. Client Components handle interaction, charts, wallet copy behavior, tabs, mobile navigation, and admin form state.

## Simulation Model

The simulation generator creates deterministic synthetic competition data from a fixed seed. It models a seven-day competition named Solana Perps League - Season 01 with SOL-PERP, BTC-PERP, and ETH-PERP markets.

Synthetic participant archetypes include disciplined low-risk traders, medium-risk traders, high-leverage gamblers, whales, small-account high-ROI traders, volume farmers, one-trade wonders, diversified traders, inactive traders, late sprinters, repetitive-size traders, and frequently liquidated traders.

The archetype is for development and testing. It is not exposed as a public accusation.

## Analytics

The analytics engine converts closed synthetic trades into participant metrics:

- gross P&L
- fees
- net P&L
- ROI
- win/loss/breakeven rates
- profit factor
- maximum drawdown
- leverage
- liquidation rate
- active days
- qualified trades
- daily P&L and returns
- market allocation
- position concentration
- best-trade dependence
- trade-frequency metrics

The UI presents analytics, but it does not own the financial calculations.

## Scoring

The scoring model is a deterministic 0-100 system:

- Performance: 35
- Risk management: 25
- Consistency: 20
- Qualified activity: 10
- Market diversity: 10

It stores raw inputs, normalized values, component scores, component caps, explanations, raw totals, integrity adjustments, and final totals.

The score is inspectable, but it is not guaranteed to be perfectly fair. It would need calibration before any real-world use.

## Integrity

The Integrity Engine produces simulation-based integrity signals. It looks for patterns such as excessive leverage, one-trade score domination, possible volume farming, extremely short duration, repeated near-identical sizing, final-hour activity, and excessive liquidation rate.

Public language avoids conclusive fraud claims. The system uses terms such as "Integrity heuristic", "Integrity signal", "Behavior requiring review", and "Simulation-based flag".

## UX

The product shell uses a dark technical interface inspired by trading terminals, esports competition surfaces, and risk analytics tools. The main public flows are:

- homepage
- competitions index
- competition leaderboard
- trader analytics profile
- methodology page
- integrity page
- about page
- safe admin demo

The UI prioritizes dense but readable data, clear disclaimers, keyboard navigation, and mobile-friendly layouts.

## Testing

The repository includes Vitest and Playwright coverage for:

- analytics edge cases
- scoring behavior
- integrity heuristics
- engagement mechanics
- API boundaries
- admin gating
- schema and documentation quality
- route smoke tests
- mobile navigation
- security hardening

Database-backed E2E coverage now runs against seeded PostgreSQL data when
`DATABASE_URL` is configured, including leaderboard filters, trader navigation,
charts, score explanations, integrity explanations, quests, and achievements.

## Challenges

- Designing scoring rules that do not over-reward whales or one-trade outliers.
- Keeping integrity language transparent without implying conclusive fraud detection.
- Making synthetic data realistic enough for a portfolio demo without implying live-market data.
- Separating calculations from UI presentation.
- Keeping production deployment honest while protecting database credentials and
  avoiding automatic production mutations during Vercel builds.

## Tradeoffs

- The scoring model is transparent and deterministic, but not fully calibrated.
- Integrity flags are explainable, but heuristic and simulation-based.
- The admin area is safe as a demo, but not a full production operations system.
- Vercel preview deployments are not granted database access by default, so the
  public production deployment is the verified hosted demo.

## Results

The repository now contains a full-stack simulated trading competition prototype
with documented methodology, separated engines, normalized database schema,
tested API boundaries, security hardening, production screenshots, and a
verified public demo.

Public demo: `https://perparena.vercel.app`

No public usage metrics are claimed.

## Limitations

- Not a real exchange or trading protocol.
- No live market data.
- No real participants.
- No custody, deposits, or rewards.
- No financial advice.
- No full production authentication.
- No distributed rate limiting.
- Remaining transitive dependency advisories require breaking ecosystem upgrades.

## Roadmap

- Add stronger production authentication if admin functionality expands.
- Add observability.
- Continue scoring calibration with larger synthetic scenarios.

## Links

- Repository: `https://github.com/LHAJsolana/perparena`
- README: `../../README.md`
- Architecture: `../architecture.md`
- Scoring: `../scoring.md`
- Integrity: `../integrity.md`
- Testing: `../testing.md`
- Deployment: `../deployment.md`
