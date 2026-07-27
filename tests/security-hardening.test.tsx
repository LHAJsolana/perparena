import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import nextConfig from "../next.config";
import ErrorPage from "@/app/error";
import {
  assertAdminMutationAllowed,
  isAdminApiRequestAuthorized,
} from "@/features/admin/protection";
import { integrityReviewSchema } from "@/features/admin/validation";
import { assertSimulationResetAllowed } from "@/features/simulation/reset-safety";
import {
  assertSimulationSeedAllowed,
  shouldResetExistingSeedData,
} from "@/features/simulation/seed-safety";
import { getDatabaseUrlStatus } from "@/lib/env";
import { apiUnhandledError } from "@/lib/api/responses";
import { exportCompetitionResults } from "@/features/admin/repository";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    competition: {
      findUnique: vi.fn(),
    },
  },
}));

describe("security headers", () => {
  it("sets baseline browser hardening headers", async () => {
    const headers = await nextConfig.headers?.();
    const values = new Map(
      headers?.[0]?.headers.map((header) => [header.key, header.value]),
    );

    expect(values.get("Content-Security-Policy")).toContain(
      "frame-ancestors 'none'",
    );
    expect(values.get("X-Content-Type-Options")).toBe("nosniff");
    expect(values.get("X-Frame-Options")).toBe("DENY");
    expect(values.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(values.get("Permissions-Policy")).toContain("camera=()");
  });
});

describe("public error safety", () => {
  it("does not render raw exception messages in the error boundary", () => {
    render(
      <ErrorPage
        error={
          new Error("postgresql://user:secret@localhost/db stack") as Error
        }
        reset={() => undefined}
      />,
    );

    expect(screen.getByText(/No sensitive diagnostic details/i)).toBeVisible();
    expect(screen.queryByText(/secret/)).not.toBeInTheDocument();
  });

  it("redacts unexpected API errors", async () => {
    const response = apiUnhandledError();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("stack");
    expect(body.error.message).toBe("Unexpected server error.");
  });
});

describe("admin and reset safety", () => {
  it("blocks production admin mutations even when enabled", () => {
    expect(() =>
      assertAdminMutationAllowed({
        NODE_ENV: "production",
        PERPARENA_ADMIN_MUTATIONS: "enabled",
      }),
    ).toThrow(/disabled/i);
  });

  it("supports optional admin API token checks", () => {
    expect(
      isAdminApiRequestAuthorized(new Headers(), {
        PERPARENA_ADMIN_TOKEN: undefined,
      }),
    ).toBe(true);
    expect(
      isAdminApiRequestAuthorized(new Headers(), {
        PERPARENA_ADMIN_TOKEN: "expected",
      }),
    ).toBe(false);
    expect(
      isAdminApiRequestAuthorized(
        new Headers({ "x-perparena-admin-token": "expected" }),
        { PERPARENA_ADMIN_TOKEN: "expected" },
      ),
    ).toBe(true);
  });

  it("refuses simulation resets in production", () => {
    expect(() =>
      assertSimulationResetAllowed({ NODE_ENV: "production" }),
    ).toThrow(/refuses to run/i);
  });

  it("requires explicit production seed approval and disables production reset seeding", () => {
    expect(() =>
      assertSimulationSeedAllowed({ NODE_ENV: "production" }),
    ).toThrow(/PERPARENA_ALLOW_PRODUCTION_SEED/);
    expect(() =>
      assertSimulationSeedAllowed({
        NODE_ENV: "production",
        PERPARENA_ALLOW_PRODUCTION_SEED: "enabled",
      }),
    ).not.toThrow();
    expect(shouldResetExistingSeedData({ NODE_ENV: "production" })).toBe(false);
  });

  it("sanitizes integrity review notes", () => {
    const parsed = integrityReviewSchema.parse({
      flagId: "flag-1",
      note: "Reviewed\u0000 note\u001f",
      status: "DISMISSED",
    });

    expect(parsed.note).toBe("Reviewed note");
  });
});

describe("database and export safety", () => {
  it("requires DATABASE_URL for production readiness", () => {
    expect(getDatabaseUrlStatus({ NODE_ENV: "production" })).toEqual({
      configured: false,
      required: true,
      valid: false,
    });
  });

  it("keeps synthetic exports free of internal IDs and database URLs", async () => {
    vi.mocked(prisma.competition.findUnique).mockResolvedValueOnce({
      configuration: { scoringVersion: "score-v1" },
      endsAt: new Date("2026-01-02T00:00:00.000Z"),
      markets: [{ symbol: "SOL_PERP" }],
      name: "Synthetic Competition",
      participants: [],
      slug: "synthetic-competition",
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
      status: "COMPLETED",
    } as never);

    const exported = await exportCompetitionResults("internal-id");
    const serialized = JSON.stringify(exported);

    expect(serialized).toContain("does not execute trades");
    expect(serialized).not.toContain("internal-id");
    expect(serialized).not.toContain("postgresql://");
  });
});
