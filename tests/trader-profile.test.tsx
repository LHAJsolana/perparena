import React, { act } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Division, MarketSymbol, TradeSide } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import TraderPage from "@/app/traders/[wallet]/page";
import { calculateParticipantAnalytics } from "@/features/analytics/calculations";
import type { RawAnalyticsTrade } from "@/features/analytics/types";
import { buildTraderChartData } from "@/features/traders/profile/chart-data";
import { TraderProfileView } from "@/features/traders/profile/components";
import type { TraderProfile } from "@/features/traders/profile/repository";

const repositoryMock = vi.hoisted(() => ({
  getTraderProfile: vi.fn(),
}));

vi.mock("@/features/traders/profile/repository", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/traders/profile/repository")
  >("@/features/traders/profile/repository");

  return {
    ...actual,
    getTraderProfile: repositoryMock.getTraderProfile,
  };
});

vi.mock("@/features/traders/profile/charts", () => ({
  TraderCharts: () => <div aria-label="Charts mock">Charts rendered</div>,
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const startsAt = new Date("2026-01-05T00:00:00.000Z");
const endsAt = new Date("2026-01-12T00:00:00.000Z");
const wallet = "PArenaSyntheticWallet1111111111111111111111111111";

function trade(overrides: Partial<RawAnalyticsTrade> = {}): RawAnalyticsTrade {
  const openedAt = overrides.openedAt ?? new Date("2026-01-05T01:00:00.000Z");
  const closedAt = overrides.closedAt ?? new Date("2026-01-05T02:00:00.000Z");

  return {
    closedAt,
    exitReason: "TARGET",
    fees: 2,
    id: "trade-1",
    leverage: 3,
    marketSymbol: MarketSymbol.SOL_PERP,
    openedAt,
    side: TradeSide.LONG,
    simulatedPnl: 102,
    simulatedVolume: 500,
    size: 5,
    ...overrides,
  };
}

function profile(overrides: Partial<TraderProfile> = {}): TraderProfile {
  const trades = [
    trade({ id: "winner", simulatedPnl: 102 }),
    trade({
      closedAt: new Date("2026-01-06T03:00:00.000Z"),
      exitReason: "STOP",
      id: "loser",
      simulatedPnl: -50,
    }),
  ];
  const analytics = calculateParticipantAnalytics({
    endsAt,
    startingEquity: 1000,
    startsAt,
    trades,
  });

  return {
    achievements: [],
    analytics,
    charts: buildTraderChartData(analytics),
    competition: {
      endsAt,
      name: "Solana Perps League - Season 01",
      slug: "solana-perps-league-season-01",
      startsAt,
    },
    division: Division.OPEN,
    id: "participant-1",
    integrity: {
      flags: [],
      status: "VERIFIED",
    },
    quests: [],
    rank: 3,
    recentTrades: {
      page: 1,
      rows: [
        {
          closedAt: trades[0]!.closedAt,
          durationMs: 60 * 60 * 1000,
          exitReason: "TARGET",
          fees: 2,
          grossPnl: 102,
          id: "winner",
          isQualified: true,
          leverage: 3,
          market: MarketSymbol.SOL_PERP,
          netPnl: 100,
          openedAt: trades[0]!.openedAt,
          side: TradeSide.LONG,
          size: 5,
        },
      ],
      totalPages: 2,
      totalRows: 16,
    },
    score: {
      components: [
        {
          explanation:
            "Performance is derived from normalized analytics inputs.",
          inputs: { netPnl: 50, roi: 0.05 },
          key: "performance",
          label: "Performance",
          max: 35,
          normalized: { roi: 0.5 },
          score: 20,
        },
      ],
      explanations: ["Risk-adjusted scoring explanation"],
      finalTotal: 70,
      integrityAdjustment: 0,
      rawTotal: 70,
      scoringVersion: "perparena-score-v1",
    },
    streaks: [],
    wallet,
    ...overrides,
  };
}

describe("trader profile route", () => {
  it("renders an existing synthetic wallet profile", async () => {
    repositoryMock.getTraderProfile.mockResolvedValue({
      data: profile(),
      status: "ready",
    });

    render(
      await TraderPage({
        params: Promise.resolve({ wallet }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByText("Final score")).toBeVisible();
    expect(screen.getByText("Score breakdown")).toBeVisible();
    expect(screen.getByText("Recent synthetic trades")).toBeVisible();
  });

  it("returns not-found behavior for an unknown wallet", async () => {
    repositoryMock.getTraderProfile.mockResolvedValue({ status: "not_found" });

    await expect(
      TraderPage({
        params: Promise.resolve({ wallet: "unknown" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("trader profile rendering", () => {
  it("handles a no-trade participant with empty states", () => {
    const analytics = calculateParticipantAnalytics({
      endsAt,
      startingEquity: 1000,
      startsAt,
      trades: [],
    });

    render(
      <TraderProfileView
        profile={profile({
          analytics,
          charts: buildTraderChartData(analytics),
          recentTrades: { page: 1, rows: [], totalPages: 1, totalRows: 0 },
        })}
      />,
    );

    expect(screen.getByText("No synthetic trades")).toBeVisible();
    expect(screen.getByText("No active integrity signals")).toBeVisible();
  });

  it("renders all-loss analytics without hiding negative values", () => {
    const analytics = calculateParticipantAnalytics({
      endsAt,
      startingEquity: 1000,
      startsAt,
      trades: [
        trade({ id: "loss-1", exitReason: "STOP", simulatedPnl: -80 }),
        trade({
          closedAt: new Date("2026-01-06T02:00:00.000Z"),
          id: "loss-2",
          simulatedPnl: -40,
        }),
      ],
    });

    render(
      <TraderProfileView
        profile={profile({
          analytics,
          charts: buildTraderChartData(analytics),
        })}
      />,
    );

    expect(screen.getByText("0.00")).toBeVisible();
    expect(screen.getAllByText(/-\$/).length).toBeGreaterThan(0);
  });

  it("renders flagged and verified integrity states safely", () => {
    const flagged = profile({
      integrity: {
        flags: [
          {
            affectsScoring: true,
            observedValue: "0.42",
            reason:
              "Simulation-based integrity signal observed behavior requiring review.",
            severity: "HIGH",
            threshold: "0.25",
            type: "EXCESSIVE_LIQUIDATION_RATE",
          },
        ],
        status: "SCORE_LIMITED",
      },
    });

    render(<TraderProfileView profile={flagged} />);

    expect(screen.getAllByText("SCORE LIMITED").length).toBeGreaterThan(0);
    expect(screen.getByText(/not conclusive fraud detection/i)).toBeVisible();
    expect(screen.getByText("scoreAffected")).toBeVisible();
  });

  it("shows score explanations and trade pagination", () => {
    render(<TraderProfileView profile={profile()} />);

    expect(screen.getByText("Risk-adjusted scoring explanation")).toBeVisible();
    expect(screen.getByText("Next trades")).toHaveAttribute(
      "href",
      "?tradesPage=2",
    );
  });

  it("copies the wallet from the profile header", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<TraderProfileView profile={profile()} />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Copy wallet address" }),
      );
    });
    act(() => vi.runOnlyPendingTimers());
    vi.useRealTimers();

    expect(writeText).toHaveBeenCalledWith(wallet);
  });

  it("uses wrapping containers for long profile values", () => {
    render(<TraderProfileView profile={profile()} />);

    const table = screen.getByRole("table");
    expect(within(table).getByText("Gross P&L")).toBeVisible();
    expect(within(table).getByText("Net P&L")).toBeVisible();
    expect(screen.getByTitle(wallet)).toHaveClass("truncate");
  });
});

describe("trader chart data", () => {
  it("transforms analytics into resilient chart series", () => {
    const analytics = calculateParticipantAnalytics({
      endsAt,
      startingEquity: 1000,
      startsAt,
      trades: [
        trade(),
        trade({ id: "eth", marketSymbol: MarketSymbol.ETH_PERP }),
      ],
    });
    const charts = buildTraderChartData(analytics);

    expect(charts.equityCurve).toHaveLength(2);
    expect(charts.dailyPnl[0]).toEqual(
      expect.objectContaining({ label: "2026-01-05" }),
    );
    expect(
      charts.marketAllocation.reduce(
        (total, point) => total + point.allocation,
        0,
      ),
    ).toBeCloseTo(1);
  });
});
