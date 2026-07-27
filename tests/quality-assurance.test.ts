import { Division, MarketSymbol } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { calculateParticipantAnalytics } from "@/features/analytics/calculations";
import type { RawAnalyticsTrade } from "@/features/analytics/types";
import {
  formatCurrency,
  formatDateRange,
  formatPercent,
  marketLabel,
} from "@/features/competitions/dashboard/format";
import {
  parseLeaderboardQuery,
  publicIntegrityStatuses,
} from "@/features/competitions/dashboard/query";
import { draftCompetitionSchema } from "@/features/admin/validation";
import { generateSimulation } from "@/features/simulation/generator";
import {
  rankParticipantScores,
  scoreCompetitionParticipants,
} from "@/features/scoring/model";
import type { ScoreContextParticipant } from "@/features/scoring/types";

const startsAt = new Date("2026-01-05T00:00:00.000Z");
const endsAt = new Date("2026-01-12T00:00:00.000Z");

function toScoreParticipants(): ScoreContextParticipant[] {
  const dataset = generateSimulation();
  const marketById = new Map(
    dataset.markets.map((market) => [market.id, market.symbol]),
  );

  return dataset.participants.map((participant) => {
    const trades = dataset.trades.filter(
      (trade) => trade.participantId === participant.id,
    );
    const analyticsTrades: RawAnalyticsTrade[] = trades.map((trade) => ({
      closedAt: trade.closedAt,
      exitReason: trade.exitReason,
      fees: trade.fees,
      id: trade.id,
      leverage: trade.leverage,
      marketSymbol: marketById.get(trade.competitionMarketId)!,
      openedAt: trade.openedAt,
      side: trade.side,
      simulatedPnl: trade.simulatedPnl,
      simulatedVolume: trade.simulatedVolume,
      size: trade.size,
    }));
    const firstQualifiedAt =
      trades
        .filter((trade) => trade.isQualified)
        .sort(
          (left, right) => left.closedAt.getTime() - right.closedAt.getTime(),
        )[0]?.closedAt ?? null;

    return {
      analytics: calculateParticipantAnalytics({
        endsAt: dataset.competition.endsAt,
        startingEquity: participant.startingEquity,
        startsAt: dataset.competition.startsAt,
        trades: analyticsTrades,
      }),
      firstQualifiedAt,
      participantId: participant.id,
    };
  });
}

describe("Phase 13 formatting and schema QA", () => {
  it("formats presentation values without changing calculation semantics", () => {
    expect(formatCurrency(-42.5)).toBe("-$42.50");
    expect(formatPercent(null)).toBe("n/a");
    expect(formatPercent(0.125)).toBe("12.5%");
    expect(marketLabel(MarketSymbol.SOL_PERP)).toBe("SOL-PERP");
    expect(formatDateRange(startsAt, endsAt)).toBe(
      "Jan 5, 2026 - Jan 12, 2026 UTC",
    );
  });

  it("normalizes public leaderboard queries to bounded values", () => {
    const parsed = parseLeaderboardQuery({
      direction: "sideways",
      integrity: "NOT_A_STATUS",
      market: "DOGE_PERP",
      page: "0",
      pageSize: "5000",
      search: "x".repeat(200),
      sort: "rawVolume",
    });

    expect(parsed).toEqual({
      direction: "desc",
      page: 1,
      pageSize: 10,
      search: "",
      sort: "score",
    });
  });

  it("keeps public integrity filters aligned with documented statuses", () => {
    expect(publicIntegrityStatuses).toEqual([
      "VERIFIED",
      "WARNING",
      "UNDER_REVIEW",
      "SCORE_LIMITED",
    ]);
  });

  it("rejects admin draft configuration with invalid slug and date order", () => {
    const result = draftCompetitionSchema.safeParse({
      description: "Synthetic draft",
      divisions: [Division.OPEN],
      endsAt: "2026-01-01T00:00:00.000Z",
      markets: [MarketSymbol.SOL_PERP],
      name: "Draft Competition",
      questTitles: [],
      scoringVersion: "score-v2",
      slug: "Bad Slug",
      startsAt: "2026-01-02T00:00:00.000Z",
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
});

describe("Phase 13 generated data QA", () => {
  it("does not generate impossible trade timestamps or invalid numeric values", () => {
    const dataset = generateSimulation();
    const marketIds = new Set(dataset.markets.map((market) => market.id));
    const participantIds = new Set(
      dataset.participants.map((participant) => participant.id),
    );

    for (const trade of dataset.trades) {
      expect(participantIds.has(trade.participantId)).toBe(true);
      expect(marketIds.has(trade.competitionMarketId)).toBe(true);
      expect(trade.closedAt.getTime()).toBeGreaterThan(
        trade.openedAt.getTime(),
      );
      expect(trade.fees).toBeGreaterThanOrEqual(0);
      expect(trade.leverage).toBeGreaterThan(0);
      expect(trade.size).toBeGreaterThan(0);
      expect(Number.isFinite(trade.simulatedPnl)).toBe(true);
      expect(Number.isFinite(trade.simulatedVolume)).toBe(true);
    }
  });

  it("keeps generated participant divisions valid and required fields populated", () => {
    const dataset = generateSimulation();
    const divisions = new Set(Object.values(Division));

    for (const participant of dataset.participants) {
      expect(participant.wallet).toMatch(/^PArenaSynthetic[a-f0-9]+$/);
      expect(divisions.has(participant.division)).toBe(true);
      expect(participant.startingEquity).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(participant.startingEquity)).toBe(true);
    }
  });

  it("keeps generated scores within 0-100 and ranks deterministic", () => {
    const scores = scoreCompetitionParticipants(toScoreParticipants());
    const ranked = rankParticipantScores(scores);

    expect(ranked).toHaveLength(scores.length);
    expect(new Set(ranked.map((score) => score.participantId)).size).toBe(
      ranked.length,
    );

    for (const score of ranked) {
      expect(score.finalTotal).toBeGreaterThanOrEqual(0);
      expect(score.finalTotal).toBeLessThanOrEqual(100);
      expect(JSON.stringify(score)).not.toContain("NaN");
      expect(JSON.stringify(score)).not.toContain("Infinity");
    }

    expect(
      rankParticipantScores(scores).map((score) => score.participantId),
    ).toEqual(ranked.map((score) => score.participantId));
  });
});
