import { describe, expect, it, vi } from "vitest";
import {
  assertAdminMutationAllowed,
  getAdminMutationMode,
} from "@/features/admin/protection";
import {
  draftCompetitionSchema,
  integrityReviewSchema,
  scoringWeightsSchema,
  statusChangeSchema,
} from "@/features/admin/validation";
import { exportCompetitionResults } from "@/features/admin/repository";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    competition: {
      findUnique: vi.fn(),
    },
    integrityFlag: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("admin protection", () => {
  it("defaults to read-only demo mode", () => {
    const mode = getAdminMutationMode({
      NODE_ENV: "development",
      PERPARENA_ADMIN_MUTATIONS: "",
    });

    expect(mode.enabled).toBe(false);
    expect(mode.label).toBe("Read-only demo mode");
  });

  it("blocks production mutations even when the flag is set", () => {
    expect(() =>
      assertAdminMutationAllowed({
        NODE_ENV: "production",
        PERPARENA_ADMIN_MUTATIONS: "enabled",
      }),
    ).toThrow(/disabled/i);
  });

  it("allows explicit development mutation mode", () => {
    expect(() =>
      assertAdminMutationAllowed({
        NODE_ENV: "development",
        PERPARENA_ADMIN_MUTATIONS: "enabled",
      }),
    ).not.toThrow();
  });
});

describe("admin validation", () => {
  it("rejects invalid scoring weights", () => {
    const result = scoringWeightsSchema.safeParse({
      consistency: 20,
      marketDiversity: 10,
      performance: 35,
      qualifiedActivity: 10,
      riskManagement: 30,
      scoringVersion: "score-v2",
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid draft creation input", () => {
    const result = draftCompetitionSchema.safeParse({
      description: "Synthetic draft.",
      divisions: ["OPEN"],
      endsAt: "2026-01-02T00:00:00.000Z",
      markets: ["SOL_PERP", "BTC_PERP"],
      name: "Draft Competition",
      questTitles: ["Complete one qualified trade"],
      scoringVersion: "score-v2",
      slug: "draft-competition",
      startsAt: "2026-01-01T00:00:00.000Z",
      weights: {
        consistency: 20,
        marketDiversity: 10,
        performance: 35,
        qualifiedActivity: 10,
        riskManagement: 25,
        scoringVersion: "score-v2",
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid dates", () => {
    const result = statusChangeSchema.safeParse({
      endsAt: "2026-01-01T00:00:00.000Z",
      startsAt: "2026-01-02T00:00:00.000Z",
      status: "ACTIVE",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty market selection", () => {
    const result = draftCompetitionSchema.safeParse({
      divisions: ["OPEN"],
      endsAt: "2026-01-02T00:00:00.000Z",
      markets: [],
      name: "Draft Competition",
      questTitles: [],
      scoringVersion: "score-v2",
      slug: "draft-competition",
      startsAt: "2026-01-01T00:00:00.000Z",
      weights: {
        consistency: 20,
        marketDiversity: 10,
        performance: 35,
        qualifiedActivity: 10,
        riskManagement: 25,
        scoringVersion: "score-v2",
      },
    });

    expect(result.success).toBe(false);
  });

  it("validates integrity review actions", () => {
    expect(
      integrityReviewSchema.safeParse({
        flagId: "flag-1",
        note: "Reviewed synthetic behavior only.",
        status: "DISMISSED",
      }).success,
    ).toBe(true);
  });
});

describe("admin action protection", () => {
  it("returns disabled mutation behavior for recalculation confirmation", async () => {
    const { recalculateScoresFormAction } =
      await import("@/features/admin/actions");
    const formData = new FormData();
    formData.set("competitionSlug", "solana-perps-league-season-01");

    const result = await recalculateScoresFormAction(
      { message: "", ok: false },
      formData,
    );

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/disabled/i);
  });
});

describe("admin export", () => {
  it("exports synthetic results without internal database metadata", async () => {
    vi.mocked(prisma.competition.findUnique).mockResolvedValueOnce({
      configuration: { scoringVersion: "score-v1" },
      endsAt: new Date("2026-01-02T00:00:00.000Z"),
      markets: [{ symbol: "SOL_PERP" }],
      name: "Synthetic Competition",
      participants: [
        {
          currentEquity: { toNumber: () => 1100 },
          division: "OPEN",
          integrityFlags: [],
          scoreBreakdowns: [
            {
              componentDetails: {
                componentScores: { performance: 20 },
              },
              competitionScore: { toNumber: () => 80 },
              integrityPenalty: { toNumber: () => 0 },
              scoringVersion: "score-v1",
            },
          ],
          startingEquity: { toNumber: () => 1000 },
          wallet: "PArenaSyntheticWallet1111111111111111111111111111",
        },
      ],
      slug: "synthetic-competition",
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
      status: "COMPLETED",
    } as never);

    const exported = await exportCompetitionResults("competition-id");

    expect(exported?.disclaimer).toMatch(/does not execute trades/i);
    expect(exported?.rankings[0]).toEqual(
      expect.objectContaining({
        finalScore: 80,
        rank: 1,
        wallet: "PArenaSyntheticWallet1111111111111111111111111111",
      }),
    );
    expect(JSON.stringify(exported)).not.toContain("competition-id");
  });
});
