import { expect, test } from "@playwright/test";

test("trader profile route renders an honest database state", async ({
  page,
}) => {
  await page.goto("/traders/PArenaSyntheticWallet1111111111111111111111111111");

  await expect(page.getByText("Synthetic participant profile")).toBeVisible();
  await expect(page.getByText(/PostgreSQL simulation database/i)).toBeVisible();
});
