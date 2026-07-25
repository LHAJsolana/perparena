import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exportCompetitionResultsService: vi.fn(),
  getLeaderboardService: vi.fn(),
  getReadinessReport: vi.fn(),
  getTraderSummaryService: vi.fn(),
  runDemoRecalculationService: vi.fn(),
}));

vi.mock("@/features/competitions/server/service", () => ({
  getLeaderboardService: mocks.getLeaderboardService,
}));

vi.mock("@/features/traders/server/service", () => ({
  getTraderSummaryService: mocks.getTraderSummaryService,
}));

vi.mock("@/features/health/readiness", () => ({
  getReadinessReport: mocks.getReadinessReport,
}));

vi.mock("@/features/recalculation/server/service", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/recalculation/server/service")
  >("@/features/recalculation/server/service");

  return {
    recalculationRequestSchema: actual.recalculationRequestSchema,
    runDemoRecalculationService: mocks.runDemoRecalculationService,
  };
});

vi.mock("@/features/admin/server/service", () => ({
  exportCompetitionResultsService: mocks.exportCompetitionResultsService,
}));

import { GET as adminExportGet } from "@/app/admin/competitions/[id]/export/route";
import { POST as adminRecalculatePost } from "@/app/api/admin/recalculate/route";
import { GET as leaderboardGet } from "@/app/api/competitions/[slug]/leaderboard/route";
import { GET as healthGet } from "@/app/api/health/route";
import { GET as readinessGet } from "@/app/api/readiness/route";
import { GET as traderSummaryGet } from "@/app/api/traders/[wallet]/summary/route";

describe("API route boundaries", () => {
  it("returns process health without checking dependencies", async () => {
    const response = healthGet();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("available");
  });

  it("reports readiness as unavailable when dependencies are not ready", async () => {
    mocks.getReadinessReport.mockResolvedValueOnce({
      checkedAt: "2026-07-25T00:00:00.000Z",
      configuration: {
        databaseUrlConfigured: true,
        databaseUrlValid: true,
      },
      database: {
        reason: "PostgreSQL connectivity check failed",
        state: "unavailable",
      },
      ok: false,
      seedCompetition: {
        present: false,
        slug: "solana-perps-league-season-01",
      },
    });

    const response = await readinessGet();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(true);
    expect(JSON.stringify(body)).not.toContain("postgresql://");
  });

  it("returns a validated leaderboard response", async () => {
    mocks.getLeaderboardService.mockResolvedValueOnce({
      data: {
        competition: {
          endsAt: new Date("2026-01-08T00:00:00.000Z"),
          markets: ["SOL_PERP"],
          name: "Solana Perps League - Season 01",
          scoringVersion: "scoring-v1",
          slug: "solana-perps-league-season-01",
          startsAt: new Date("2026-01-01T00:00:00.000Z"),
          status: "ACTIVE",
        },
        leaderboard: {
          page: 1,
          pageSize: 10,
          rows: [],
          totalPages: 1,
          totalRows: 0,
        },
      },
      status: "ready",
    });

    const response = await leaderboardGet(
      new Request(
        "http://localhost/api/competitions/solana-perps-league-season-01/leaderboard?sort=score&pageSize=10",
      ),
      { params: Promise.resolve({ slug: "solana-perps-league-season-01" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.leaderboard.pageSize).toBe(10);
  });

  it("normalizes invalid leaderboard query values before calling the service", async () => {
    mocks.getLeaderboardService.mockResolvedValueOnce({
      data: {
        competition: {},
        leaderboard: {
          page: 1,
          pageSize: 10,
          rows: [],
          totalPages: 1,
          totalRows: 0,
        },
      },
      status: "ready",
    });

    await leaderboardGet(
      new Request(
        "http://localhost/api/competitions/demo/leaderboard?sort=unsafe&pageSize=999",
      ),
      { params: Promise.resolve({ slug: "demo" }) },
    );

    expect(mocks.getLeaderboardService).toHaveBeenLastCalledWith(
      "demo",
      expect.objectContaining({ pageSize: 10, sort: "score" }),
    );
  });

  it("returns not found for an unknown competition", async () => {
    mocks.getLeaderboardService.mockResolvedValueOnce({
      data: null,
      status: "ready",
    });

    const response = await leaderboardGet(
      new Request("http://localhost/api/competitions/missing/leaderboard"),
      { params: Promise.resolve({ slug: "missing" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns unavailable when the leaderboard service cannot reach data", async () => {
    mocks.getLeaderboardService.mockResolvedValueOnce({
      message: "The PostgreSQL database is unavailable.",
      status: "unavailable",
    });

    const response = await leaderboardGet(
      new Request("http://localhost/api/competitions/demo/leaderboard"),
      { params: Promise.resolve({ slug: "demo" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("UNAVAILABLE");
  });

  it("returns not found for an unknown trader summary", async () => {
    mocks.getTraderSummaryService.mockResolvedValueOnce({
      status: "not_found",
    });

    const response = await traderSummaryGet(
      new Request("http://localhost/api/traders/unknown-wallet/summary"),
      { params: Promise.resolve({ wallet: "unknown-wallet" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.message).toContain("not found");
  });

  it("redacts unexpected service errors", async () => {
    mocks.getTraderSummaryService.mockRejectedValueOnce(
      new Error("postgresql://user:secret@localhost/db stack"),
    );

    const response = await traderSummaryGet(
      new Request(
        "http://localhost/api/traders/PArenaSyntheticWallet01/summary",
      ),
      { params: Promise.resolve({ wallet: "PArenaSyntheticWallet01" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("secret");
    expect(body.error.message).toBe("Unexpected server error.");
  });

  it("rejects invalid admin recalculation bodies", async () => {
    const response = await adminRecalculatePost(
      new Request("http://localhost/api/admin/recalculate", {
        body: JSON.stringify({ competitionSlug: "", kind: "unknown" }),
        method: "POST",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("BAD_REQUEST");
  });

  it("keeps demo recalculation gated when mutations are disabled", async () => {
    mocks.runDemoRecalculationService.mockRejectedValueOnce(
      new Error("Mutating server actions are disabled."),
    );

    const response = await adminRecalculatePost(
      new Request("http://localhost/api/admin/recalculate", {
        body: JSON.stringify({
          competitionSlug: "solana-perps-league-season-01",
          kind: "scores",
        }),
        method: "POST",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns synthetic export payloads through the standard success envelope", async () => {
    mocks.exportCompetitionResultsService.mockResolvedValueOnce({
      competition: { slug: "demo" },
      disclaimer: "Synthetic data disclaimer.",
      rankings: [],
    });

    const response = await adminExportGet(
      new Request("http://localhost/admin/competitions/demo/export"),
      { params: Promise.resolve({ id: "demo" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.disclaimer).toContain("Synthetic");
  });
});
