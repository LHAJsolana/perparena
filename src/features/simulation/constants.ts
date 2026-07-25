export const SIMULATION_SEED = "perparena-season-01";

export const SIMULATION_COMPETITION = {
  id: "competition_solana_perps_league_season_01",
  name: "Solana Perps League — Season 01",
  slug: "solana-perps-league-season-01",
  startsAt: new Date("2026-01-05T00:00:00.000Z"),
  endsAt: new Date("2026-01-12T00:00:00.000Z"),
} as const;

export const SIMULATION_MARKETS = ["SOL_PERP", "BTC_PERP", "ETH_PERP"] as const;

export const PUBLIC_MARKET_LABELS: Record<
  (typeof SIMULATION_MARKETS)[number],
  string
> = {
  SOL_PERP: "SOL-PERP",
  BTC_PERP: "BTC-PERP",
  ETH_PERP: "ETH-PERP",
};
