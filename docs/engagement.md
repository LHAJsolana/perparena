# Engagement Mechanics

PerpArena engagement mechanics are transparent, deterministic recognition systems for synthetic competition behavior. They do not award real currency, imply a real prize, or silently alter the 100-point competition score.

Version: `perparena-engagement-v1`

## Purpose

Quests, streaks, and achievements reward disciplined simulated participation:

- Qualified activity over raw volume
- Risk control over excessive leverage
- Consistency across UTC days
- Market breadth without forcing meaningless tiny trades
- No-liquidation behavior

## Quests

Every quest stores its requirements in the `Quest.requirements` JSON field:

- `version`
- `cadence`
- `eligibilityRules`
- `target`
- optional `badge`
- non-financial `engagementPoints`
- a note that engagement points are separate from competition score

Daily or repeatable examples:

- Complete one qualified trade
- Trade two supported markets
- Stay below 10% daily drawdown
- Maintain average leverage below 5x
- Finish an active day without liquidation

Competition-wide examples:

- Trade on four separate days
- Complete ten qualified trades
- Finish with no liquidation
- Maintain positive risk-adjusted performance
- Complete activity across all supported markets

## Streaks

Streaks use UTC competition days.

- A day is `00:00:00.000Z` through the next UTC midnight.
- Duplicate events on the same day count once.
- Missing days break the current streak.
- Historical best streak is preserved as the best deterministic run during recalculation.
- Current streak is non-zero only when the final competition day in the evaluated range qualifies.

Implemented streaks:

- Active-day streak
- No-liquidation streak
- Disciplined-leverage streak

The existing `Streak.type` enum is reused:

- Active-day streak: `PARTICIPATION`
- No-liquidation streak: `RISK_CONTROL`
- Disciplined-leverage streak: `CONSISTENCY`

## Achievements

Achievements are non-financial badges:

- First Qualified Trade
- Multi-Market Trader
- Drawdown Defender
- No-Liquidation Finisher
- Consistency Specialist
- Seven-Day Participant
- Risk-Aware Trader

No achievement rewards excessive leverage, liquidation, or unlimited simulated volume.

## Persistence

`engagement:recalculate`:

- Upserts quest definitions
- Upserts achievement definitions
- Upserts participant quest progress
- Upserts streak records
- Upserts earned participant achievements

The operation is idempotent and uses deterministic record IDs. It is scoped to the seeded competition and requires PostgreSQL through `DATABASE_URL`.

## Scoring Relationship

Engagement points are separate from the core 100-point competition score. Phase 10 does not modify the scoring engine and does not apply hidden score changes.

## Limitations

This is a first-version engagement model. Future calibration may add richer badge metadata, separate streak enums, recurring daily quest instances, and admin review tooling.
