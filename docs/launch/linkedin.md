# LinkedIn Launch Draft

Do not publish automatically. Review deployment status and links before posting.

I built PerpArena, an independent simulated trading competition and analytics prototype.

Demo: https://perparena.vercel.app

The product problem I wanted to explore: many competition leaderboards can over-reward raw account size, excessive leverage, artificial activity, or one lucky trade. PerpArena asks what a more risk-aware simulated leaderboard might look like.

The project uses deterministic synthetic participants and trades. It does not execute real trades, custody funds, provide financial advice, or distribute rewards.

Engineering decisions:

- Next.js App Router with Server Components for database-backed views.
- TypeScript strict mode across the application.
- Prisma and PostgreSQL for normalized competition data.
- Zod validation at API, route, and admin boundaries.
- Pure analytics functions separated from UI rendering.
- A transparent 0-100 scoring model with component explanations.
- Explainable integrity heuristics described as review signals, not fraud detection.
- Vitest and Playwright coverage for core engines, APIs, shell behavior, and security hardening.

The most interesting part was balancing scoring incentives. A raw P&L leaderboard is easy to build, but it can over-reward whales or high-leverage outliers. PerpArena combines performance, risk management, consistency, qualified activity, and market diversity so the result is more inspectable.

The Integrity Engine was another useful design exercise. It surfaces behavior requiring review, such as possible volume farming, one-trade score domination, excessive leverage, or repeated near-identical trade sizes, while avoiding overconfident language.

Lessons learned:

- Financial calculations belong in deterministic domain functions, not UI components.
- Synthetic data still needs clear disclaimers and safe terminology.
- Admin demos need production guardrails even when they are only portfolio features.
- Documentation is part of the product when the goal is an engineering portfolio.

PerpArena is not production financial infrastructure. It is a full-stack case study in simulation, risk analytics, scoring design, and truthful product communication.
