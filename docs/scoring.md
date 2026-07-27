# Competition Scoring

Phase 6 introduces `perparena-score-v1`, a deterministic 0-100 competition score. It is transparent and separate from analytics. Analytics describe behavior; scoring converts those analytics into bounded competition points.

## Components

Total maximum: 100 points.

- Performance: 35
- Risk management: 25
- Consistency: 20
- Qualified activity: 10
- Market diversity: 10

All components have explicit minimum `0` and explicit maximum equal to their weight. The implementation clamps normalized values to `[0, 1]` and rejects `NaN`/`Infinity`.

## Performance - 35

Performance combines:

- ROI percentile across the scoring context: 45%
- Net P&L divided by starting equity percentile: 25%
- Profit factor normalized to a cap of 3: 30%

Raw P&L does not directly dominate the score. Whales with larger absolute P&L are evaluated by equity-relative efficiency, while small-account participants can compete through ROI and profit factor. One lucky trade is dampened when qualified trade count is below 3 or best-trade dependence exceeds 65%.

## Risk Management - 25

Risk management combines:

- Maximum drawdown capped at 60%: 40%
- Average leverage capped over 1x to 25x: 20%
- Liquidation rate capped at 15%: 25%
- Position concentration: 15%

This prevents high-leverage or liquidation-heavy participants from ranking highly on ROI alone.

## Consistency - 20

Consistency combines:

- Profitable active-day percentage: 35%
- Daily-return volatility capped at 18%: 25%
- Best-trade dependence capped at 75%: 25%
- Active-day coverage capped at 5 days: 15%

The goal is to reward repeatable behavior rather than one isolated trade.

## Qualified Activity - 10

Qualified activity combines:

- Active days capped at 5 days: 45%
- Qualified trades with logarithmic diminishing returns toward 20 trades: 55%

Frequency penalties apply above 30 and 45 trades per active day. This avoids rewarding unlimited repetitive activity.

## Market Diversity - 10

Market diversity combines:

- Count of markets with at least 10% allocation: 65%
- Distribution quality based on concentration: 35%

This rewards meaningful multi-market activity without forcing equal allocation or rewarding dust trades.

## Integrity Adjustment

The scoring model supports an integrity multiplier supplied by the integrity
engine. Clean or informational signals keep the multiplier neutral. Multiple
review-worthy or score-adjusting signals can reduce the final score through the
documented cap in `docs/integrity.md`.

Raw score and adjusted final score are kept separate so the integrity effect can
be inspected without hiding the underlying component results.

## Severe-Risk Penalty

A transparent Phase 6 scoring penalty subtracts 5 points before integrity adjustment when maximum drawdown is at least 80% or liquidation rate is at least 25%. This is a scoring rule, not an integrity accusation, and prevents severe liquidation profiles from retaining high activity/diversity totals.

## Persistence

Score outputs are stored in `ScoreBreakdown` with `scoringVersion = perparena-score-v1`.

The row stores component scores in dedicated fields and detailed inputs, normalized values, caps, raw total, integrity adjustment, final total, and explanations in `componentDetails`.

Recalculation deletes and recreates only ScoreBreakdown rows for the same participants and scoring version inside a transaction.

## Tie Breakers

Leaderboard sorting is deterministic:

1. Higher final score
2. Lower maximum drawdown
3. Higher consistency score
4. Higher net P&L
5. Earlier qualification time
6. Stable participant ID

## Example

A disciplined small participant with 18% ROI, low drawdown, five active days, and diversified qualified trades can outscore a whale with larger raw P&L but lower ROI and higher concentration.

A one-trade participant with a large win receives performance credit, but loses consistency and activity points and is dampened by best-trade dependence.

## Limitations

The model is deterministic but not final calibration. Thresholds are documented first-version values and should be reviewed after seeded-data distributions and user testing.

Future phases can calibrate weights, add Phase 7 integrity adjustments, and introduce richer downside-risk measures without changing Phase 6 analytics boundaries.
