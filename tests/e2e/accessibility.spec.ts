import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { fetchSeededLeaderboard } from "./seeded";

const staticRoutes = [
  "/",
  "/methodology",
  "/integrity",
  "/about",
  "/admin",
] as const;

test.describe("accessibility automation", () => {
  for (const route of staticRoutes) {
    test(`${route} has no automatically detectable axe violations`, async ({
      page,
    }) => {
      test.setTimeout(90_000);

      await page.goto(route);
      await expect(page.locator("main")).toBeVisible({ timeout: 30_000 });

      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("seeded competition and trader pages have no axe violations", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);

    const leaderboardBody = await fetchSeededLeaderboard(request);
    const wallet = leaderboardBody.data.leaderboard.rows[0].wallet;

    for (const route of [
      "/competitions/solana-perps-league-season-01",
      `/traders/${wallet}`,
    ]) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText("Preparing PerpArena")).toBeHidden({
        timeout: 30_000,
      });

      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    }
  });

  test("mobile navigation has no axe violations while open", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(
      page.getByRole("navigation", { name: "Mobile navigation" }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
