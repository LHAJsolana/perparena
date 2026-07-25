# Trading Analytics

Phase 5 implements deterministic analytics for closed synthetic trades. Analytics are separate from scoring: these metrics describe participant behavior and outcomes, but they do not produce a competition score.

## Qualified Trade Definition

Version 1 of a qualified trade requires:

- Closed trade with `closedAt` after `openedAt`
- Valid market: `SOL_PERP`, `BTC_PERP`, or `ETH_PERP`
- Non-zero positive size
- Positive leverage
- Non-negative fees
- Non-duplicate trade identity in the input set
- Minimum duration of five minutes
- Minimum simulated notional/volume of 25

The five-minute duration filters out zero-duration and near-instant malformed records while still allowing short-term simulated trading. The notional threshold of 25 filters dust-sized records that can distort frequency and win-rate metrics without materially representing competition activity.

## Core Formulas

Gross P&L is the sum of trade `simulatedPnl`.

Total fees are the sum of non-negative trade fees.

Net P&L is `grossPnl - totalFees`.

Current equity is `startingEquity + netPnl`. The analytics engine allows negative resulting equity so large synthetic losses remain visible instead of being silently clipped.

ROI is `netPnl / startingEquity`. When starting equity is zero, ROI is `null`.

Win, loss, and breakeven rates are counts divided by valid closed trade count. Empty trade sets return `0`.

Profit factor is gross winning net P&L divided by absolute gross losing net P&L. It uses a typed representation:

- `no_trades`
- `no_winning_trades`
- `no_losing_trades`
- `finite`

The engine never emits `Infinity`.

Maximum drawdown is calculated from a chronological equity curve ordered by close time and then trade ID for duplicate timestamps. Drawdown is `(peakEquity - currentEquity) / abs(peakEquity)`. Starting equity of zero is handled without division by zero.

Daily P&L groups chronological net results by UTC day. Daily return is `dailyNetPnl / dayStartingEquity`, or `null` if day starting equity is zero.

Return volatility is the population standard deviation of non-null daily returns.

Market allocation is each market's simulated volume divided by total simulated volume.

Position concentration is a Herfindahl-style concentration score over trade simulated volumes.

Best-trade dependence is best positive net trade divided by total positive net P&L. It is `0` when net P&L is not positive.

## Edge Cases

Empty trade lists return zero counts, zero P&L, no best/worst trade, no average duration, and a `no_trades` profit factor.

All-win datasets return `no_losing_trades` profit factor rather than infinity.

All-loss datasets return profit factor `0`.

Duplicate timestamps are sorted deterministically by trade ID.

Malformed trades are normalized and excluded from metric calculations.

No metric should emit `NaN` or `Infinity`.

## Persistence

`npm run analytics:recalculate` recalculates participant-level cached fields and replaces `DailyPerformance` rows for the seeded synthetic competition. It is deterministic and idempotent for the same trade inputs.

The command requires PostgreSQL. It does not fall back to files, memory, SQLite, or mock persistence.
