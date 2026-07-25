# PerpArena Data Model

PerpArena uses PostgreSQL through Prisma. There is no fallback to files, memory, SQLite, or mock persistence. If `DATABASE_URL` is absent or unreachable, database-dependent operations must report that PostgreSQL is unavailable.

## Value Classification

Raw database values are directly captured from synthetic competition records. Examples: `Trade.entryPrice`, `Trade.exitPrice`, `Trade.size`, `Trade.leverage`, `Trade.openedAt`, `Trade.closedAt`, `Competition.startsAt`, and participant identifiers.

Derived values are calculated from raw records and stored when later phases need repeatable analytics. Examples: `Participant.currentEquity`, `Participant.maximumDrawdown`, `Participant.qualifiedTradeCount`, `Participant.simulatedVolume`, and `DailyPerformance` fields.

Snapshots are point-in-time leaderboard records. `LeaderboardSnapshot` and `LeaderboardSnapshotEntry` preserve historical rank, competition score, simulated P&L, simulated volume, current equity, maximum drawdown, and division at capture time.

Cached calculations are stored score outputs. `ScoreBreakdown` keeps the total competition score and score component values for a scoring version. The scoring implementation is intentionally not part of Phase 3.

Flexible JSON fields are limited to configuration or evidence payloads whose structure can evolve without weakening core relational constraints: score component caps, score details, quest requirements, achievement criteria, achievement metadata, and integrity evidence.

## Core Constraints

Competition slugs are globally unique.

Participants are unique by `(competitionId, wallet)`, allowing the same wallet to appear in different competitions.

Competition markets are unique by `(competitionId, symbol)`.

Leaderboard entries are unique by `(snapshotId, rank)` and `(snapshotId, participantId)`.

Quest progress is unique by `(questId, participantId)`.

Participant achievements are unique by `(participantId, achievementId)`.

## Deletion Rules

Most child records cascade from their parent competition or participant so development data can be removed consistently. Trades restrict deletion of their competition market to preserve referential integrity for historical trade records unless the whole competition is deleted.

## Decimal Handling

Monetary and scoring values use PostgreSQL `Decimal` columns. They are not stored as strings. Rounding should occur at presentation boundaries, not in persistence.

## Phase Boundary

This phase defines schema, constraints, data-access boundaries, and connectivity checks only. It does not generate synthetic participants, create trades, calculate scores, or seed competition fixtures.
