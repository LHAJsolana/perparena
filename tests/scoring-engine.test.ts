import { describe, expect, it } from "vitest";
import type { ParticipantAnalytics } from "@/features/analytics/types";
import { calculateParticipantAnalytics } from "@/features/analytics/calculations";
import { generateSimulation } from "@/features/simulation/generator";
import {
  SCORE_TOTAL,
  SCORE_WEIGHTS,
  validateScoreWeights,
} from "@/features/scoring/config";
import {
  rankParticipantScores,
  scoreCompetitionParticipants,
} from "@/features/scoring/model";
import type { ScoreContextParticipant } from "@/features/scoring/types";

function metric(
  overrides: Partial<ParticipantAnalytics> = {},
): ParticipantAnalytics {
  return {
    grossPnl: 100,
    totalFees: 5,
    netPnl: 95,
    startingEquity: 1000,
    currentEquity: 1095,
    roi: 0.095,
    winRate: 0.55,
    lossRate: 0.4,
    breakevenRate: 0.05,
    profitFactor: { kind: "finite", value: 1.8 },
    averageWinningTrade: 20,
    averageLosingTrade: -12,
    bestTrade: 40,
    worstTrade: -20,
    maximumDrawdown: 0.08,
    averageLeverage: 3,
    maximumLeverage: 6,
    liquidationCount: 0,
    liquidationRate: 0,
    activeTradingDays: 5,
    qualifiedTradeCount: 18,
    averageTradeDurationMs: 30 * 60 * 1000,
    dailyPnl: {},
    dailyReturns: {},
    returnVolatility: 0.04,
    profitableActiveDayPercentage: 0.7,
    marketAllocation: { SOL_PERP: 0.4, BTC_PERP: 0.35, ETH_PERP: 0.25 },
    positionConcentration: 0.34,
    bestTradeDependence: 0.42,
    tradeFrequency: {
      tradesPerActiveDay: 4,
      tradesPerCompetitionDay: 18 / 7,
      averageGapMs: 1000,
      maxTradesInDay: 5,
    },
    equityCurve: [],
    dailyPerformance: [],
    ...overrides,
  };
}

function participant(
  id: string,
  analytics: ParticipantAnalytics,
): ScoreContextParticipant {
  return {
    participantId: id,
    analytics,
    firstQualifiedAt: new Date("2026-01-05T00:10:00.000Z"),
  };
}

function scoreOne(analytics: ParticipantAnalytics) {
  return scoreCompetitionParticipants([participant("p1", analytics)])[0]!;
}

function generatedInputs(): ScoreContextParticipant[] {
  const dataset = generateSimulation();
  const marketById = new Map(
    dataset.markets.map((market) => [market.id, market.symbol]),
  );

  return dataset.participants.map((simParticipant) => {
    const trades = dataset.trades.filter(
      (trade) => trade.participantId === simParticipant.id,
    );

    return {
      participantId: simParticipant.id,
      archetype: simParticipant.archetype,
      analytics: calculateParticipantAnalytics({
        startingEquity: simParticipant.startingEquity,
        startsAt: dataset.competition.startsAt,
        endsAt: dataset.competition.endsAt,
        trades: trades.map((trade) => ({
          id: trade.id,
          marketSymbol: marketById.get(trade.competitionMarketId)!,
          side: trade.side,
          openedAt: trade.openedAt,
          closedAt: trade.closedAt,
          size: trade.size,
          leverage: trade.leverage,
          simulatedVolume: trade.simulatedVolume,
          simulatedPnl: trade.simulatedPnl,
          fees: trade.fees,
          exitReason: trade.exitReason,
        })),
      }),
      firstQualifiedAt:
        trades
          .filter((trade) => trade.isQualified)
          .sort(
            (left, right) => left.closedAt.getTime() - right.closedAt.getTime(),
          )[0]?.closedAt ?? null,
    };
  });
}

describe("competition scoring engine", () => {
  it("validates weights total 100", () => {
    expect(validateScoreWeights()).toEqual({ valid: true, total: 100 });
    expect(
      validateScoreWeights({
        ...SCORE_WEIGHTS,
        performance: 34,
      } as unknown as typeof SCORE_WEIGHTS),
    ).toEqual({ valid: false, total: 99 });
  });

  it("keeps component and total scores within bounds", () => {
    const score = scoreOne(metric());

    expect(score.rawTotal).toBeGreaterThanOrEqual(0);
    expect(score.finalTotal).toBeLessThanOrEqual(SCORE_TOTAL);

    for (const component of Object.values(score.components)) {
      expect(component.score).toBeGreaterThanOrEqual(0);
      expect(component.score).toBeLessThanOrEqual(component.max);
    }
  });

  it("does not emit NaN or Infinity", () => {
    const score = scoreOne(
      metric({
        roi: null,
        profitFactor: { kind: "no_losing_trades", value: null },
        returnVolatility: null,
      }),
    );

    expect(JSON.stringify(score)).not.toContain("Infinity");
    expect(JSON.stringify(score)).not.toContain("NaN");
  });

  it("gives a disciplined small trader room to beat a raw-P&L whale", () => {
    const small = participant(
      "small",
      metric({
        startingEquity: 1000,
        netPnl: 220,
        roi: 0.22,
        maximumDrawdown: 0.04,
        averageLeverage: 2,
        positionConcentration: 0.34,
      }),
    );
    const whale = participant(
      "whale",
      metric({
        startingEquity: 100000,
        netPnl: 5000,
        roi: 0.05,
        maximumDrawdown: 0.18,
        averageLeverage: 6,
        positionConcentration: 0.8,
      }),
    );
    const [smallScore, whaleScore] = scoreCompetitionParticipants([
      small,
      whale,
    ]);

    expect(smallScore!.finalTotal).toBeGreaterThan(whaleScore!.finalTotal);
  });

  it("does not let one lucky trade dominate", () => {
    const lucky = scoreOne(
      metric({
        netPnl: 500,
        roi: 0.5,
        qualifiedTradeCount: 1,
        activeTradingDays: 1,
        bestTradeDependence: 1,
      }),
    );
    const steady = scoreOne(metric({ netPnl: 120, roi: 0.12 }));

    expect(lucky.components.consistency.score).toBeLessThan(
      steady.components.consistency.score,
    );
    expect(lucky.components.qualifiedActivity.score).toBeLessThan(
      steady.components.qualifiedActivity.score,
    );
  });

  it("penalizes high-leverage profitable traders through risk", () => {
    const highLeverage = scoreOne(
      metric({
        roi: 0.4,
        averageLeverage: 30,
        maximumDrawdown: 0.45,
        liquidationRate: 0.12,
      }),
    );

    expect(highLeverage.components.riskManagement.score).toBeLessThan(10);
  });

  it("caps volume-farmer style activity with frequency penalties", () => {
    const farmer = scoreOne(
      metric({
        qualifiedTradeCount: 120,
        tradeFrequency: {
          tradesPerActiveDay: 60,
          tradesPerCompetitionDay: 60,
          averageGapMs: 1000,
          maxTradesInDay: 70,
        },
      }),
    );

    expect(farmer.components.qualifiedActivity.score).toBeLessThan(
      SCORE_WEIGHTS.qualifiedActivity,
    );
  });

  it("scores inactive and no-trade participants low", () => {
    const inactive = scoreOne(
      metric({
        grossPnl: 0,
        netPnl: 0,
        roi: 0,
        profitFactor: { kind: "no_trades", value: null },
        activeTradingDays: 0,
        qualifiedTradeCount: 0,
        averageLeverage: null,
        maximumLeverage: null,
        marketAllocation: { SOL_PERP: 0, BTC_PERP: 0, ETH_PERP: 0 },
        positionConcentration: 0,
        profitableActiveDayPercentage: 0,
        returnVolatility: null,
      }),
    );

    expect(inactive.finalTotal).toBeLessThan(35);
  });

  it("penalizes liquidated all-loss participants", () => {
    const liquidated = scoreOne(
      metric({
        netPnl: -900,
        roi: -0.9,
        profitFactor: { kind: "no_winning_trades", value: 0 },
        maximumDrawdown: 0.9,
        averageLeverage: 35,
        liquidationCount: 4,
        liquidationRate: 0.4,
        profitableActiveDayPercentage: 0,
      }),
    );

    expect(liquidated.finalTotal).toBeLessThan(30);
  });

  it("rewards meaningful diversified activity", () => {
    const diversified = scoreOne(
      metric({
        marketAllocation: { SOL_PERP: 0.4, BTC_PERP: 0.3, ETH_PERP: 0.3 },
      }),
    );
    const singleMarket = scoreOne(
      metric({ marketAllocation: { SOL_PERP: 1, BTC_PERP: 0, ETH_PERP: 0 } }),
    );

    expect(diversified.components.marketDiversity.score).toBeGreaterThan(
      singleMarket.components.marketDiversity.score,
    );
  });

  it("sorts ties by documented tie breakers", () => {
    const a = scoreOne(metric({ maximumDrawdown: 0.1, netPnl: 100 }));
    const b = scoreOne(metric({ maximumDrawdown: 0.2, netPnl: 200 }));
    const tiedA = { ...a, participantId: "a", finalTotal: 50, rawTotal: 50 };
    const tiedB = { ...b, participantId: "b", finalTotal: 50, rawTotal: 50 };

    expect(rankParticipantScores([tiedB, tiedA])[0]?.participantId).toBe("a");
  });

  it("is deterministic and keeps scoring version visible", () => {
    const inputs = generatedInputs();

    expect(scoreCompetitionParticipants(inputs)).toEqual(
      scoreCompetitionParticipants(inputs),
    );
    expect(scoreCompetitionParticipants(inputs)[0]?.scoringVersion).toBe(
      "perparena-score-v1",
    );
  });

  it("scores generated archetypes without single-archetype domination", () => {
    const scores = rankParticipantScores(
      scoreCompetitionParticipants(generatedInputs()),
    );
    const topTenCounts = scores
      .slice(0, 10)
      .reduce<Record<string, number>>((counts, score) => {
        const key = score.archetype ?? "UNKNOWN";
        counts[key] = (counts[key] ?? 0) + 1;
        return counts;
      }, {});

    expect(Math.max(...Object.values(topTenCounts))).toBeLessThan(6);
  });
});
