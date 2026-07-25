import { expect, test } from "@playwright/test";

test("admin control center shows read-only demonstration state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin");

  await expect(
    page.getByText("Demonstration administration environment."),
  ).toBeVisible();
  await expect(page.getByText("Read-only demo mode")).toBeVisible();
  await expect(page.getByRole("link", { name: "Competitions" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Integrity queue" }),
  ).toBeVisible();
});
