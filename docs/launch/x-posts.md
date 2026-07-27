# X Launch Drafts

Do not publish automatically. All posts must be reviewed against the current repository and public demo state before posting.

## Concise Launch Post

Built PerpArena: an independent simulated trading competition prototype.

It uses synthetic participants/trades, risk-adjusted scoring, analytics, integrity heuristics, and a Next.js + Prisma + PostgreSQL architecture.

No real trades. No custody. No rewards. Just a portfolio build exploring better leaderboard design.

Demo: https://perparena.vercel.app

## Detailed Launch Post

I built PerpArena, an independent simulated trading competition and analytics prototype.

The idea: trading competitions should not reward only account size, excessive leverage, artificial volume, or one lucky trade.

PerpArena uses deterministic synthetic data, then calculates analytics like simulated P&L, ROI, maximum drawdown, profit factor, leverage, daily returns, market allocation, and qualified trade count.

Those metrics feed a transparent 0-100 competition score:

- Performance: 35
- Risk management: 25
- Consistency: 20
- Qualified activity: 10
- Market diversity: 10

It also includes explainable integrity heuristics, trader profile pages, charts, quests, achievements, API boundaries, tests, and a safe demo admin area.

Important: this is not a real exchange. It does not execute trades, custody funds, give financial advice, or distribute rewards. The competition and data are synthetic.

Demo: https://perparena.vercel.app

## Five-Post Technical Thread

### 1/5

I built PerpArena as a portfolio project: a simulated, risk-adjusted trading competition platform.

The core product question:

How do you rank synthetic traders by skill, consistency, and risk management instead of just raw P&L, leverage, or one lucky trade?

No real trades. All data is synthetic.

### 2/5

The data model uses Prisma + PostgreSQL with normalized competition records:

- competitions
- markets
- participants
- trades
- daily performance
- score breakdowns
- leaderboard snapshots
- quests
- achievements
- integrity flags

No SQLite fallback. Database failures are reported honestly.

### 3/5

The analytics engine is separate from scoring.

It calculates simulated net P&L, ROI, win/loss/breakeven rates, profit factor, maximum drawdown, leverage, active days, qualified trades, market allocation, position concentration, best-trade dependence, and daily returns.

The UI does not own financial math.

### 4/5

The scoring model is a deterministic 0-100 system:

- 35 performance
- 25 risk management
- 20 consistency
- 10 qualified activity
- 10 market diversity

Raw account size and unlimited volume are intentionally not enough to dominate.

It is transparent, not guaranteed perfect.

### 5/5

I also added an Integrity Engine.

It produces simulation-based integrity signals such as excessive leverage, one-trade score domination, repeated near-identical sizes, possible volume farming, and final-hour activity.

It never claims fraud detection. It says: behavior requiring review.

## Follow-Up: Scoring Engine

One part of PerpArena I enjoyed building was the scoring engine.

It converts analytics into a bounded 0-100 score while separating:

- raw metric inputs
- normalized values
- component scores
- caps
- explanations
- integrity adjustment

The goal is not to claim perfect fairness. It is to make the scoring method inspectable, testable, and harder to dominate with account size or a single lucky synthetic trade.

Everything is simulated.

## Follow-Up: Integrity Engine

PerpArena's Integrity Engine is deliberately described as a heuristic system.

It surfaces simulation-based signals like:

- excessive leverage
- many negligible trades
- repeated near-identical sizes
- one-trade score domination
- suspicious final-hour activity

It does not call anyone fraudulent.

The language matters: signal, heuristic, behavior requiring review.
