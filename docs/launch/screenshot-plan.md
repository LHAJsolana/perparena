# Screenshot Plan

Capture screenshots only from a verified seeded local environment or verified public deployment.

## Hero

- Route: `/`
- Viewport: 1440 x 1000
- Data state: seeded PostgreSQL data preferred; honest unavailable state acceptable only if documenting local setup
- Purpose: introduce product thesis and simulation disclaimer
- Suggested caption: "PerpArena homepage with simulated competition thesis and disclaimer."

## Leaderboard

- Route: `/competitions/solana-perps-league-season-01`
- Viewport: 1440 x 1000
- Data state: seeded competition with analytics, scores, integrity, and engagement recalculated
- Purpose: show public ranking and risk-adjusted metrics
- Suggested caption: "Synthetic leaderboard ranked by transparent competition score."

## Trader Analytics

- Route: `/traders/[synthetic-wallet]`
- Viewport: 1440 x 1100
- Data state: seeded participant with closed synthetic trades
- Purpose: show profile metrics, charts, and trade history
- Suggested caption: "Synthetic trader profile with performance, risk, and market allocation."

## Score Breakdown

- Route: `/traders/[synthetic-wallet]`
- Viewport: 1440 x 1100
- Data state: participant with persisted score breakdown
- Purpose: show component-level scoring transparency
- Suggested caption: "Competition score components with inputs, caps, and explanations."

## Integrity Status

- Route: `/traders/[flagged-synthetic-wallet]`
- Viewport: 1440 x 1100
- Data state: participant with at least one active integrity heuristic flag
- Purpose: show public-safe integrity language
- Suggested caption: "Integrity heuristic section showing behavior requiring review."

## Admin Configuration

- Route: `/admin`
- Viewport: 1440 x 1000
- Data state: any; read-only demo mode preferred
- Purpose: show safe demonstration admin posture
- Suggested caption: "Demonstration admin center with production-safe mutation posture."

## Mobile Experience

- Route: `/competitions/solana-perps-league-season-01`
- Viewport: 390 x 844
- Data state: seeded leaderboard
- Purpose: show mobile navigation and compact leaderboard layout
- Suggested caption: "Mobile competition dashboard with readable synthetic leaderboard cards."

## Architecture Diagram

- Route/source: `README.md` or `docs/architecture.md`
- Viewport: rendered Markdown at 1440 x 1000
- Data state: not applicable
- Purpose: show system architecture
- Suggested caption: "PerpArena feature-oriented architecture and domain-engine boundaries."
