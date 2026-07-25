import { expect, test } from "@playwright/test";

test("health endpoint reports process availability", async ({ request }) => {
  const response = await request.get("/api/health");
  const body = await response.json();

  expect(response.ok()).toBe(true);
  expect(body.ok).toBe(true);
  expect(body.data.status).toBe("available");
});

test("readiness endpoint does not expose connection strings", async ({
  request,
}) => {
  const response = await request.get("/api/readiness");
  const bodyText = await response.text();

  expect([200, 503]).toContain(response.status());
  expect(bodyText).not.toContain("postgresql://");
  expect(bodyText).not.toContain("DATABASE_URL=");
});
