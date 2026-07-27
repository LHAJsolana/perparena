import type { APIRequestContext } from "@playwright/test";

export async function fetchSeededLeaderboard(request: APIRequestContext) {
  let lastStatus = 0;
  let lastBody = "";

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const response = await request.get(
      "/api/competitions/solana-perps-league-season-01/leaderboard?page=1&pageSize=10",
    );
    lastStatus = response.status();
    lastBody = await response.text();

    if (response.ok()) {
      return JSON.parse(lastBody);
    }

    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  throw new Error(
    `Seeded leaderboard was unavailable after retries; last status ${lastStatus}, body ${redact(lastBody)}`,
  );
}

function redact(value: string) {
  return value
    .replace(/postgres(?:ql)?:\/\/[^\s"]+/gi, "[redacted-postgres-url]")
    .replace(/DATABASE_URL=[^\s"]+/g, "DATABASE_URL=[redacted]");
}
