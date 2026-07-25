# Synthetic Simulation

PerpArena Phase 4 creates deterministic synthetic competition data only. The generator does not fetch live market data, does not execute trades, does not custody funds, and does not represent real participant behavior.

## Generator Architecture

The pure generator lives in `src/features/simulation/generator.ts`. It creates one seven-day competition:

- Name: Solana Perps League — Season 01
- Slug: `solana-perps-league-season-01`
- Markets: `SOL-PERP`, `BTC-PERP`, `ETH-PERP`
- Duration: `2026-01-05T00:00:00.000Z` through `2026-01-12T00:00:00.000Z`

The generator emits stable competition, market, participant, trade, daily performance, and integrity flag records. Persistence is isolated in `src/features/simulation/persistence.ts` so Prisma calls do not leak into UI components.

## Seed Behavior

The fixed seed is `perparena-season-01`. Randomness uses a documented linear congruential generator wrapped by `SeededRandom`; the implementation never calls `Math.random`.

Generation order is stable:

1. Markets
2. Participants by archetype
3. Trades by participant
4. Daily performance records
5. Integrity flags
6. Aggregate summary

IDs, wallets, and timestamps are reproducible. Running the generator twice with the same seed should produce equivalent aggregate and record-level data.

## Archetypes

Phase 4 includes these explicit development archetypes:

- Disciplined low-risk trader
- Consistent medium-risk trader
- High-leverage gambler
- Whale
- Small-account high-ROI trader
- Volume farmer
- One-trade wonder
- Diversified trader
- Inactive trader
- Late competition sprinter
- Repetitive-size trader
- Frequently liquidated trader

The archetype is stored for development and testing. It must not be presented as a public accusation or conclusive integrity label.

## Intentional Anomalies

Integrity flags are intentionally generated for selected synthetic patterns such as high simulated volume concentration, one-trade outliers, repetitive trade sizing, and frequent liquidation behavior. These are integrity heuristics, not fraud conclusions.

## Reset Procedure

`npm run db:seed` deletes and recreates only the competition with slug `solana-perps-league-season-01` inside a transaction. It refuses to run when `NODE_ENV=production`.

`npm run simulation:reset` deletes only that same competition slug inside a transaction. It also refuses to run when `NODE_ENV=production`.

Neither command touches unrelated competitions.

## Limitations

The simulation is intentionally synthetic and deterministic. It does not model real order books, real funding rates, live market data, real latency, deposits, withdrawals, custody, or rewards.

Phase 4 does not implement the scoring engine. Score-related persisted data remains reserved for later approved phases.
