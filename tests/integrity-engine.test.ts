import type {
  IntegrityFlagSignal,
  IntegrityParticipantInput,
} from "@/features/integrity/types";
import { describe, expect, it } from "vitest";
import type {
  ParticipantAnalytics,
  RawAnalyticsTrade,
} from "@/features/analytics/types";
import { calculateParticipantAnalytics } from "@/features/analytics/calculations";
import {
  assessParticipantIntegrity,
  calculateIntegrityMultiplier,
  dismissFlag,
  INTEGRITY_ENGINE_VERSION,
  reopenFlag,
  resolveFlag,
} from "@/features/integrity/engine";

const startsAt = new Date("2026-01-05T00:00:00.000Z");
const endsAt = new Date("2026-01-12T00:00:00.000Z");

function trade(
  index: number,
  overrides: Partial<RawAnalyticsTrade> = {},
): RawAnalyticsTrade {
  const openedAt = new Date(startsAt.getTime() + index * 20 * 60 * 1000);
  const markets = ["SOL_PERP", "BTC_PERP", "ETH_PERP"] as const;

  return {
    id: `trade-${index}`,
    marketSymbol: markets[index % markets.length],
    side: index % 2 === 0 ? "LONG" : "SHORT",
    openedAt,
    closedAt: new Date(openedAt.getTime() + 10 * 60 * 1000),
    size: 1 + index * 0.01,
    leverage: 3,
    simulatedVolume: 100,
    simulatedPnl: index % 3 === 0 ? -5 : 8,
    fees: 1,
    exitReason: index % 3 === 0 ? "STOP" : "TARGET",
    ...overrides,
  };
}

function input(
  trades: RawAnalyticsTrade[],
  overrides: Partial<ParticipantAnalytics> = {},
): IntegrityParticipantInput {
  return {
    participantId: "participant",
    startsAt,
    endsAt,
    trades,
    analytics: {
      ...calculateParticipantAnalytics({
        trades,
        startingEquity: 1000,
        startsAt,
        endsAt,
      }),
      ...overrides,
    },
  };
}

function many(
  count: number,
  factory?: (index: number) => Partial<RawAnalyticsTrade>,
) {
  return Array.from({ length: count }, (_, index) =>
    trade(index, factory?.(index)),
  );
}

describe("explainable integrity engine", () => {
  it("derives VERIFIED for a clean disciplined trader", () => {
    const assessment = assessParticipantIntegrity(input(many(8)));

    expect(assessment.status).toBe("VERIFIED");
    expect(assessment.flags).toHaveLength(0);
    expect(assessment.multiplier).toBe(1);
  });

  it("does not flag a legitimate active trader solely for activity or profit", () => {
    const assessment = assessParticipantIntegrity(
      input(
        many(35, () => ({ simulatedPnl: 12, leverage: 4 })),
        {
          tradeFrequency: {
            tradesPerActiveDay: 35,
            tradesPerCompetitionDay: 5,
            averageGapMs: 1,
            maxTradesInDay: 35,
          },
        },
      ),
    );

    expect(assessment.flags.map((flag) => flag.type)).not.toContain(
      "HIGH_TRADE_FREQUENCY",
    );
    expect(assessment.flags.map((flag) => flag.type)).not.toContain(
      "POSSIBLE_VOLUME_FARMING",
    );
  });

  it("flags possible volume farming", () => {
    const assessment = assessParticipantIntegrity(
      input(
        many(80, () => ({ size: 1, simulatedVolume: 50 })),
        {
          tradeFrequency: {
            tradesPerActiveDay: 80,
            tradesPerCompetitionDay: 80,
            averageGapMs: 1,
            maxTradesInDay: 80,
          },
          positionConcentration: 0.7,
        },
      ),
    );

    expect(assessment.flags.map((flag) => flag.type)).toContain(
      "POSSIBLE_VOLUME_FARMING",
    );
    expect(assessment.status).toBe("SCORE_LIMITED");
  });

  it("flags extreme leverage gambler behavior", () => {
    const assessment = assessParticipantIntegrity(
      input(
        many(10, () => ({ leverage: 40 })),
        {
          averageLeverage: 25,
          maximumLeverage: 40,
        },
      ),
    );

    expect(assessment.flags.map((flag) => flag.type)).toEqual(
      expect.arrayContaining([
        "EXCESSIVE_AVERAGE_LEVERAGE",
        "EXCESSIVE_MAX_LEVERAGE",
      ]),
    );
  });

  it("flags one-trade wonder and tiny account distortion", () => {
    const assessment = assessParticipantIntegrity(
      input([trade(0, { simulatedPnl: 1000 })], {
        startingEquity: 500,
        roi: 2,
        bestTradeDependence: 1,
        qualifiedTradeCount: 1,
      }),
    );

    expect(assessment.flags.map((flag) => flag.type)).toEqual(
      expect.arrayContaining([
        "ONE_TRADE_SCORE_DOMINATION",
        "TINY_ACCOUNT_ROI_DISTORTION",
      ]),
    );
  });

  it("flags final-hour sprinter and abrupt final shift", () => {
    const assessment = assessParticipantIntegrity(
      input(
        many(10, (index) => ({
          openedAt: new Date(endsAt.getTime() - (50 - index) * 60 * 1000),
          closedAt: new Date(endsAt.getTime() - (45 - index) * 60 * 1000),
        })),
      ),
    );

    expect(assessment.flags.map((flag) => flag.type)).toEqual(
      expect.arrayContaining([
        "FINAL_HOUR_ACTIVITY",
        "ABRUPT_FINAL_BEHAVIOR_SHIFT",
      ]),
    );
  });

  it("flags repetitive-size trader", () => {
    const assessment = assessParticipantIntegrity(
      input(many(20, () => ({ size: 2 }))),
    );

    expect(assessment.flags.map((flag) => flag.type)).toContain(
      "REPEATED_NEAR_IDENTICAL_SIZES",
    );
  });

  it("flags frequently liquidated trader", () => {
    const assessment = assessParticipantIntegrity(
      input(
        many(20, () => ({ exitReason: "LIQUIDATION", simulatedPnl: -80 })),
        {
          liquidationRate: 0.5,
        },
      ),
    );

    expect(assessment.flags.map((flag) => flag.type)).toContain(
      "EXCESSIVE_LIQUIDATION_RATE",
    );
    expect(assessment.multiplier).toBeLessThan(1);
  });

  it("handles multiple weak flags without score limitation", () => {
    const assessment = assessParticipantIntegrity(
      input(
        many(13, () => ({ closedAt: new Date(startsAt.getTime() + 30_000) })),
        {
          averageTradeDurationMs: 30_000,
        },
      ),
    );

    expect(assessment.status).toBe("WARNING");
    expect(assessment.multiplier).toBe(1);
  });

  it("caps one severe flag and multiple score-adjusting flags", () => {
    const assessment = assessParticipantIntegrity(
      input(
        many(80, () => ({ size: 1, leverage: 40, exitReason: "LIQUIDATION" })),
        {
          averageLeverage: 40,
          maximumLeverage: 40,
          liquidationRate: 0.6,
          positionConcentration: 0.8,
          tradeFrequency: {
            tradesPerActiveDay: 80,
            tradesPerCompetitionDay: 80,
            averageGapMs: 1,
            maxTradesInDay: 80,
          },
        },
      ),
    );

    expect(assessment.multiplier).toBeGreaterThanOrEqual(0.82);
    expect(assessment.cappedPenalty).toBeLessThanOrEqual(0.18);
  });

  it("supports resolving, dismissing, and reopening flags", () => {
    const flag = assessParticipantIntegrity(
      input(many(20, () => ({ size: 2 }))),
    ).flags[0] as IntegrityFlagSignal;

    expect(resolveFlag(flag).reviewStatus).toBe("CONFIRMED");
    expect(dismissFlag(flag).affectsScoring).toBe(false);
    expect(reopenFlag(dismissFlag(flag)).reviewStatus).toBe("OPEN");
  });

  it("is deterministic and includes versioned explanations", () => {
    const assessment = assessParticipantIntegrity(
      input(many(20, () => ({ size: 2 }))),
    );

    expect(assessment).toEqual(
      assessParticipantIntegrity(input(many(20, () => ({ size: 2 })))),
    );
    expect(assessment.flags[0]?.engineVersion).toBe(INTEGRITY_ENGINE_VERSION);
    expect(assessment.flags[0]?.explanation).toContain("requiring review");
  });

  it("does not create duplicate flag identities on idempotent recalculation", () => {
    const first = assessParticipantIntegrity(
      input(many(80, () => ({ size: 1 }))),
    );
    const second = assessParticipantIntegrity(
      input(many(80, () => ({ size: 1 }))),
    );

    expect(first.flags.map((flag) => flag.id)).toEqual(
      second.flags.map((flag) => flag.id),
    );
    expect(new Set(first.flags.map((flag) => flag.id)).size).toBe(
      first.flags.length,
    );
  });

  it("handles no-trade participants", () => {
    const assessment = assessParticipantIntegrity(input([]));

    expect(assessment.status).toBe("VERIFIED");
    expect(calculateIntegrityMultiplier(assessment.flags).multiplier).toBe(1);
  });
});
