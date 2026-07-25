export const globalDisclaimer =
  "PerpArena is an independent simulated trading competition and analytics prototype. It does not execute trades, custody funds, provide financial advice, or distribute real rewards. All participants, trades, volumes, rankings, and results are synthetic unless explicitly stated otherwise.";

export const appConfig = {
  productName: "PerpArena",
  productDescription:
    "An independent simulated, risk-adjusted trading competition and analytics prototype.",
  publicUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supportedMarkets: ["BTC-PERP", "ETH-PERP", "SOL-PERP"] as const,
  globalDisclaimer,
  repositoryUrl: "https://github.com/example/perparena",
  socialUrl: "https://example.com/perparena",
} as const;

export const appNavigation = [
  { href: "/competitions", label: "Competitions" },
  { href: "/methodology", label: "Methodology" },
  { href: "/integrity", label: "Integrity" },
  { href: "/admin", label: "Admin" },
  { href: "/about", label: "About" },
] as const;
