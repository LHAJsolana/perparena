import { expect, test } from "@playwright/test";
import { fetchSeededLeaderboard } from "./seeded";

test("trader profile route renders an honest database state", async ({
  page,
  request,
}) => {
  test.setTimeout(90_000);

  const leaderboardBody = await fetchSeededLeaderboard(request);
  const wallet = leaderboardBody.data.leaderboard.rows[0].wallet;

  await page.goto(`/traders/${wallet}`);

  await expect(page.getByText("Score breakdown")).toBeVisible();
  await expect(page.getByText("Charts")).toBeVisible();
  await expect(page.getByText("Recent synthetic trades")).toBeVisible();
  await expect(page.getByText("Integrity heuristic")).toBeVisible();
  await expect(page.getByText("Quest progress")).toBeVisible();
  await expect(page.getByText("Achievements")).toBeVisible();
});
