import { QuestStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { calculateParticipantAnalytics } from "@/features/analytics/calculations";
import type { RawAnalyticsTrade } from "@/features/analytics/types";
import {
  achievementDefinitions,
  engagementQuestDefinitions,
  evaluateEngagement,
} from "@/features/engagement/engine";
import { recalculateCompetitionEngagement } from "@/features/engagement/persistence";
import { ENGAGEMENT_VERSION } from "@/features/engagement/types";

const startsAt = new Date("2026-01-05T00:00:00.000Z");
const endsAt = new Date("2026-01-12T00:00:00.000Z");
const supportedMarkets = ["SOL_PERP", "BTC_PERP", "ETH_PERP"] as const;

function trade(
  id: string,
  day: number,
  overrides: Partial<RawAnalyticsTrade> = {},
): RawAnalyticsTrade {
  const openedAt = new Date(
    startsAt.getTime() + day * 86_400_000 + 60 * 60_000,
  );
  const closedAt = new Date(openedAt.getTime() + 45 * 60_000);

  return {
    closedAt,
    exitReason: "TARGET",
    fees: 1,
    id,
    leverage: 3,
    marketSymbol: "SOL_PERP",
    openedAt,
    side: "LONG",
    simulatedPnl: 25,
    simulatedVolume: 1000,
    size: 10,
    ...overrides,
  };
}

function evaluate(trades: RawAnalyticsTrade[]) {
  const analytics = calculateParticipantAnalytics({
    endsAt,
    startingEquity: 1000,
    startsAt,
    trades,
  });

  return evaluateEngagement({
    analytics,
    competitionEndsAt: endsAt,
    competitionStartsAt: startsAt,
    supportedMarkets,
    trades,
  });
}

describe("engagement engine", () => {
  it("defines versioned quests without real rewards", () => {
    expect(engagementQuestDefinitions).toHaveLength(10);
    expect(
      engagementQuestDefinitions.every(
        (quest) =>
          quest.version === ENGAGEMENT_VERSION &&
          quest.engagementPoints !== undefined,
      ),
    ).toBe(true);
  });

  it("completes qualified-trade and leverage quests", () => {
    const result = evaluate([trade("a", 0)]);

    expect(
      result.quests.find((quest) => quest.slug === "daily-qualified-trade")
        ?.completed,
    ).toBe(true);
    expect(
      result.quests.find(
        (quest) => quest.slug === "daily-average-leverage-under-5",
      )?.completed,
    ).toBe(true);
  });

  it("tracks partial competition progress", () => {
    const result = evaluate([trade("a", 0), trade("b", 1)]);
    const quest = result.quests.find(
      (item) => item.slug === "competition-four-active-days",
    );

    expect(quest?.completed).toBe(false);
    expect(quest?.progress).toBe(2);
    expect(quest?.target).toBe(4);
  });

  it("handles no trades with empty progress and no achievements", () => {
    const result = evaluate([]);

    expect(result.quests.every((quest) => quest.progress === 0)).toBe(true);
    expect(
      result.achievements.every((achievement) => !achievement.earned),
    ).toBe(true);
  });

  it("uses UTC day boundaries and ignores duplicate events for streak days", () => {
    const result = evaluate([
      trade("a", 0, {
        closedAt: new Date("2026-01-05T23:59:00.000Z"),
        openedAt: new Date("2026-01-05T23:10:00.000Z"),
      }),
      trade("b", 1, {
        closedAt: new Date("2026-01-06T00:01:00.000Z"),
        openedAt: new Date("2026-01-06T00:00:00.000Z"),
      }),
      trade("duplicate-day", 1),
    ]);

    const streak = result.streaks.find(
      (item) => item.slug === "active-day-streak",
    );

    expect(streak?.bestCount).toBe(2);
  });

  it("breaks current streaks when a day is missed", () => {
    const result = evaluate([trade("a", 0), trade("c", 2)]);
    const streak = result.streaks.find(
      (item) => item.slug === "active-day-streak",
    );

    expect(streak?.bestCount).toBe(1);
    expect(streak?.currentCount).toBe(0);
  });

  it("continues streaks through consecutive disciplined days", () => {
    const result = evaluate([
      trade("a", 0),
      trade("b", 1),
      trade("c", 2),
      trade("d", 3),
      trade("e", 4),
      trade("f", 5),
      trade("g", 6),
    ]);

    expect(
      result.streaks.find((item) => item.slug === "active-day-streak")
        ?.currentCount,
    ).toBe(7);
  });

  it("covers no-liquidation, leverage, and multi-market mechanics", () => {
    const result = evaluate([
      trade("sol", 0, { marketSymbol: "SOL_PERP" }),
      trade("btc", 0, { marketSymbol: "BTC_PERP" }),
      trade("eth", 1, { marketSymbol: "ETH_PERP" }),
    ]);

    expect(
      result.quests.find((item) => item.slug === "competition-no-liquidation")
        ?.completed,
    ).toBe(true);
    expect(
      result.quests.find((item) => item.slug === "daily-two-markets")
        ?.completed,
    ).toBe(true);
    expect(
      result.achievements.find((item) => item.slug === "multi-market-trader")
        ?.earned,
    ).toBe(true);
  });

  it("keeps achievements unique by slug", () => {
    const slugs = achievementDefinitions.map((achievement) => achievement.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("engagement persistence", () => {
  it("uses upserts for idempotent persistence", async () => {
    const upsert = vi.fn().mockResolvedValue({});
    const createMany = vi.fn().mockResolvedValue({});
    const findUnique = vi.fn().mockResolvedValue({
      endsAt,
      id: "competition",
      markets: supportedMarkets.map((symbol) => ({ enabled: true, symbol })),
      participants: [
        {
          id: "participant",
          startingEquity: { toNumber: () => 1000 },
          trades: [
            {
              closedAt: new Date("2026-01-05T02:00:00.000Z"),
              exitReason: "TARGET",
              fees: { toNumber: () => 1 },
              id: "trade",
              leverage: { toNumber: () => 3 },
              market: { symbol: "SOL_PERP" },
              openedAt: new Date("2026-01-05T01:00:00.000Z"),
              side: "LONG",
              simulatedPnl: { toNumber: () => 25 },
              simulatedVolume: { toNumber: () => 1000 },
              size: { toNumber: () => 10 },
            },
          ],
        },
      ],
      slug: "solana-perps-league-season-01",
      startsAt,
    });
    const tx = {
      achievement: { upsert },
      participantAchievement: { upsert },
      quest: { upsert },
      questProgress: { upsert },
      streak: { upsert },
    };
    const prisma = {
      $transaction: async (callback: (client: typeof tx) => Promise<void>) =>
        callback(tx),
      achievement: { createMany },
      competition: { findUnique },
    };

    const summary = await recalculateCompetitionEngagement(prisma as never);

    expect(summary.participantsProcessed).toBe(1);
    expect(summary.questProgressRows).toBe(10);
    expect(upsert).toHaveBeenCalled();
    expect(
      upsert.mock.calls.some(
        ([argument]) => argument?.create?.status === QuestStatus.COMPLETED,
      ),
    ).toBe(true);
  });
});
