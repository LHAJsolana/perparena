import { expect, test } from "@playwright/test";
import { fetchSeededLeaderboard } from "./seeded";

test("homepage and desktop navigation expose primary routes", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /Risk-adjusted simulated trading competition analytics/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/does not execute trades/i).first(),
  ).toBeVisible();

  await page.getByRole("link", { exact: true, name: "Competitions" }).click();
  await expect(page).toHaveURL(/\/competitions$/);
  await expect(
    page.getByRole("heading", { name: "Synthetic competition index" }),
  ).toBeVisible();

  await page.getByRole("link", { exact: true, name: "Methodology" }).click();
  await expect(page).toHaveURL(/\/methodology$/);
  await expect(
    page.getByRole("heading", {
      name: "Competition score methodology",
    }),
  ).toBeVisible();

  await page.getByRole("link", { exact: true, name: "Integrity" }).click();
  await expect(page).toHaveURL(/\/integrity$/);
  await expect(
    page.getByRole("heading", { name: "Explainable integrity heuristics" }),
  ).toBeVisible();

  await page.getByRole("link", { exact: true, name: "About" }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(
    page.getByText(/independent simulated trading/i).first(),
  ).toBeVisible();
});

test("mobile navigation is keyboard and touch reachable", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  await page.getByRole("button", { name: "Menu" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Admin" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByText("Demonstration administration environment."),
  ).toBeVisible();
});

test("seeded database-backed competition supports filters and trader navigation", async ({
  page,
  request,
}) => {
  test.setTimeout(90_000);

  const leaderboardBody = await fetchSeededLeaderboard(request);
  expect(leaderboardBody.data.leaderboard.totalRows).toBeGreaterThanOrEqual(80);

  const firstWallet = leaderboardBody.data.leaderboard.rows[0].wallet;
  const walletSearch = firstWallet.slice(-8);

  await page.goto("/competitions/solana-perps-league-season-01");
  await expect(
    page.getByRole("heading", { name: /Solana Perps League/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: `Open trader profile for ${firstWallet}` }),
  ).toBeVisible();

  await page.getByLabel("Wallet search").fill(walletSearch);
  await page.getByLabel("Division").selectOption("OPEN");
  await page.getByLabel("Market").selectOption("SOL_PERP");
  await page.getByLabel("Integrity").selectOption("VERIFIED");
  await page.getByLabel("Sort").selectOption("maximumDrawdown");
  await page.getByLabel("Direction").selectOption("asc");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page).toHaveURL(/search=/);
  await expect(
    page.getByRole("link", { name: `Open trader profile for ${firstWallet}` }),
  ).toBeVisible();

  await page
    .getByRole("link", { name: `Open trader profile for ${firstWallet}` })
    .click();
  await expect(page).toHaveURL(new RegExp(`/traders/${firstWallet}$`));
  await expect(page.getByText("Score breakdown")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("Charts")).toBeVisible();
  await expect(page.getByText("Integrity heuristic")).toBeVisible();
  await expect(page.getByText("Quest progress")).toBeVisible();
});

test("broken routes render the designed not-found state", async ({ page }) => {
  await page.goto("/definitely-not-a-real-route");

  await expect(page.getByText("Page not found")).toBeVisible();
  await expect(page.getByRole("link", { name: "Return home" })).toBeVisible();
});
