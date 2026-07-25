import React from "react";
import { render, screen, within } from "@testing-library/react";
import { CompetitionStatus, Division, MarketSymbol } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";
import CompetitionsPage from "@/app/competitions/page";
import CompetitionPage from "@/app/competitions/[slug]/page";
import { Leaderboard } from "@/features/competitions/dashboard/components";
import {
  parseLeaderboardQuery,
  type LeaderboardQuery,
} from "@/features/competitions/dashboard/query";
import type {
  CompetitionDashboard,
  DashboardDataResult,
} from "@/features/competitions/dashboard/repository";

const repositoryMock = vi.hoisted(() => ({
  getHomepageDashboardData: vi.fn(),
  listCompetitionSummaries: vi.fn(),
  getCompetitionDashboardData: vi.fn(),
}));

vi.mock("@/features/competitions/dashboard/repository", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/competitions/dashboard/repository")
  >("@/features/competitions/dashboard/repository");

  return {
    ...actual,
    getHomepageDashboardData: repositoryMock.getHomepageDashboardData,
    listCompetitionSummaries: repositoryMock.listCompetitionSummaries,
    getCompetitionDashboardData: repositoryMock.getCompetitionDashboardData,
  };
});

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const query: LeaderboardQuery = {
  direction: "desc",
  page: 1,
  pageSize: 10,
  search: "",
  sort: "score",
};

const dashboard = {
  id: "competition-1",
  slug: "solana-perps-league-season-01",
  name: "Solana Perps League - Season 01",
  status: CompetitionStatus.ACTIVE,
  startsAt: new Date("2026-01-05T00:00:00.000Z"),
  endsAt: new Date("2026-01-12T00:00:00.000Z"),
  markets: [
    MarketSymbol.SOL_PERP,
    MarketSymbol.BTC_PERP,
    MarketSymbol.ETH_PERP,
  ],
  participantCount: 2,
  simulatedVolume: 125000,
  qualifiedTradeCount: 42,
  scoringVersion: "perparena-score-v1",
  topThree: [
    {
      id: "participant-1",
      rank: 1,
      wallet: "PArenaSyntheticWallet1111111111111111111111111111",
      score: 88.25,
      simulatedNetPnl: 420,
      roi: 0.42,
      maximumDrawdown: 0.08,
      winRate: 0.62,
      activeDays: 7,
      liquidations: 0,
      division: Division.OPEN,
      integrityStatus: "VERIFIED",
      markets: [MarketSymbol.SOL_PERP, MarketSymbol.BTC_PERP],
    },
  ],
  leaderboard: {
    rows: [
      {
        id: "participant-1",
        rank: 1,
        wallet: "PArenaSyntheticWallet1111111111111111111111111111",
        score: 88.25,
        simulatedNetPnl: 420,
        roi: 0.42,
        maximumDrawdown: 0.08,
        winRate: 0.62,
        activeDays: 7,
        liquidations: 0,
        division: Division.OPEN,
        integrityStatus: "VERIFIED",
        markets: [MarketSymbol.SOL_PERP, MarketSymbol.BTC_PERP],
      },
    ],
    totalRows: 1,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  },
  divisions: [
    { division: Division.OPEN, participants: 1 },
    { division: Division.PROVISIONAL, participants: 1 },
    { division: Division.RISK_LAB, participants: 0 },
  ],
  questPreview: [
    {
      completedCount: 1,
      description: "Stay below 10% daily drawdown.",
      engagementPoints: 10,
      status: "ACTIVE",
      target: 1,
      title: "Risk control",
      type: "RISK_MANAGEMENT",
      version: "perparena-engagement-v1",
    },
  ],
} satisfies CompetitionDashboard;

function ready<T>(data: T): DashboardDataResult<T> {
  return { data, status: "ready" };
}

describe("competition dashboard routes", () => {
  it("renders homepage data from the server repository", async () => {
    repositoryMock.getHomepageDashboardData.mockResolvedValue(ready(dashboard));

    render(await HomePage());

    expect(screen.getByText("Solana Perps League - Season 01")).toBeVisible();
    expect(screen.getByText("Top-three preview")).toBeVisible();
    expect(screen.getAllByText(/does not execute trades/i)[0]).toBeVisible();
  });

  it("renders the competition index from database summaries", async () => {
    repositoryMock.listCompetitionSummaries.mockResolvedValue(
      ready([dashboard]),
    );

    render(await CompetitionsPage());

    expect(screen.getByText("Synthetic competition index")).toBeVisible();
    expect(screen.getByText("Open competition detail")).toHaveAttribute(
      "href",
      "/competitions/solana-perps-league-season-01",
    );
  });

  it("renders a valid competition route with filters and trader links", async () => {
    repositoryMock.getCompetitionDashboardData.mockResolvedValue(
      ready(dashboard),
    );

    render(
      await CompetitionPage({
        params: Promise.resolve({ slug: dashboard.slug }),
        searchParams: Promise.resolve({ search: "wallet", page: "1" }),
      }),
    );

    expect(screen.getByText("Leaderboard controls")).toBeVisible();
    expect(screen.getByLabelText("Leaderboard pagination")).toBeVisible();
    expect(
      screen.getAllByRole("link", {
        name: /Open trader profile for PArenaSyntheticWallet1111111111111111111111111111/i,
      })[0],
    ).toHaveAttribute(
      "href",
      "/traders/PArenaSyntheticWallet1111111111111111111111111111",
    );
  });

  it("uses not-found behavior for unknown competitions", async () => {
    repositoryMock.getCompetitionDashboardData.mockResolvedValue(ready(null));

    await expect(
      CompetitionPage({
        params: Promise.resolve({ slug: "unknown" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("leaderboard query and rendering behavior", () => {
  it("normalizes invalid query parameters", () => {
    expect(
      parseLeaderboardQuery({
        direction: "sideways",
        division: "BAD",
        page: "-50",
        pageSize: "200",
        sort: "unknown",
      }),
    ).toEqual(query);
  });

  it("renders empty leaderboard results with a reset hint", () => {
    render(
      <Leaderboard
        dashboard={{
          ...dashboard,
          leaderboard: {
            page: 1,
            pageSize: 10,
            rows: [],
            totalPages: 1,
            totalRows: 0,
          },
        }}
        query={query}
      />,
    );

    expect(screen.getByText("No leaderboard rows match")).toBeVisible();
  });

  it("renders desktop columns and mobile rank context", () => {
    render(<Leaderboard dashboard={dashboard} query={query} />);

    expect(
      within(screen.getByRole("table")).getByText("Simulated net P&L"),
    ).toBeVisible();
    expect(screen.getAllByText("Rank 1").length).toBeGreaterThan(0);
  });
});
