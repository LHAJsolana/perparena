# Integrity Heuristics

PerpArena uses simulation-based integrity heuristics to identify behavior requiring review. These signals do not conclusively detect fraud and must not be presented as definitive misconduct.

Approved public language:

- Integrity heuristic
- Integrity signal
- Behavior requiring review
- Simulation-based flag

Avoid public claims that a participant is fraudulent.

## Statuses

Derived participant statuses are:

- `VERIFIED`: no documented thresholds were crossed
- `WARNING`: one or more informational or warning signals crossed thresholds
- `UNDER_REVIEW`: high-severity non-score-adjusting behavior requires review
- `SCORE_LIMITED`: score-adjusting signals reduce the integrity multiplier

## Heuristics

Version: `perparena-integrity-v1`

Each flag includes type, severity, participant, observed value, threshold, explanation, evidence metadata, detection timestamp, engine version, score-impact indicator, and review status.

| Signal                              |                                                       Threshold | Default impact  |
| ----------------------------------- | --------------------------------------------------------------: | --------------- |
| Repetitive instant round trips      |                                12 trades at or below 90 seconds | Warning         |
| Extremely high trade frequency      |                                        45 trades per active day | Warning         |
| Excessive average leverage          |                                                             18x | Score-adjusting |
| Excessive maximum leverage          |                                                             35x | Warning         |
| One-trade score domination          |                                       75% best-trade dependence | Warning         |
| Tiny-account ROI distortion         |                      150% ROI when starting equity is below 750 | Warning         |
| Extreme market concentration        |                                    92% allocation to one market | Informational   |
| Suspicious final-hour activity      |                                     45% of trades in final hour | Warning         |
| Repeated near-identical trade sizes |                                  70% in one rounded size bucket | Score-adjusting |
| Excessive liquidation rate          |                                                             18% | Score-adjusting |
| Possible volume farming             | More than 35 trades per active day plus concentration above 45% | Score-adjusting |
| Very low average trade duration     |                                              Below five minutes | Informational   |
| Many economically negligible trades |                       35% of trades below 25 simulated notional | Informational   |
| Abrupt final behavior shift         |                                      55% of trades in final day | Warning         |

## Scoring Interaction

Signals are grouped as informational, warning, or score-adjusting. A single weak signal does not automatically create a severe penalty.

Score-adjusting flags use severity-based penalties, capped at an 18% maximum reduction. The minimum multiplier is `0.82`.

Informational and warning flags do not reduce score by default.

## Review Workflow

Service methods support:

- Generate flags
- Recalculate participant status
- Resolve a flag
- Dismiss a flag
- Reopen a flag
- Recalculate scoring impact

The admin UI arrives later. Until then, these methods exist for service-layer validation and future admin integration.

## False-Positive Protection

The engine is intentionally conservative. It accounts for legitimate scalping, repeated position sizes, small accounts, short-duration trades, high activity, and final-day participation by requiring documented thresholds and separating informational flags from score-adjusting flags.

Profitability alone is never a flag.

## Limitations

These are synthetic-data heuristics. They are not fraud detection, audit results, or claims about real trading behavior.
