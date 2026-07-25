import type { MarketSymbol, TradeExitReason, TradeSide } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { calculateParticipantAnalytics } from "@/features/analytics/calculations";
import { buildEquityCurve } from "@/features/analytics/equity-curve";
import { normalizeTrades } from "@/features/analytics/normalization";
import { isQualifiedTrade } from "@/features/analytics/qualification";
import type { RawAnalyticsTrade } from "@/features/analytics/types";

const startsAt = new Date("2026-01-05T00:00:00.000Z");
const endsAt = new Date("2026-01-12T00:00:00.000Z");

function trade(overrides: Partial<RawAnalyticsTrade> = {}): RawAnalyticsTrade {
  return {
    id: "trade-1",
    marketSymbol: "SOL_PERP",
    side: "LONG",
    openedAt: new Date("2026-01-05T00:00:00.000Z"),
    closedAt: new Date("2026-01-05T00:10:00.000Z"),
    size: 1,
    leverage: 2,
    simulatedVolume: 100,
    simulatedPnl: 10,
    fees: 1,
    exitReason: "TARGET",
    ...overrides,
  };
}

function analytics(trades: RawAnalyticsTrade[], startingEquity = 1000) {
  return calculateParticipantAnalytics({
    trades,
    startingEquity,
    startsAt,
    endsAt,
  });
}

function expectNoInvalidNumbers(value: unknown) {
  if (typeof value === "number") {
    expect(Number.isFinite(value)).toBe(true);
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  for (const nested of Object.values(value)) {
    expectNoInvalidNumbers(nested);
  }
}

describe("trading analytics engine", () => {
  it("handles an empty trade list", () => {
    const result = analytics([]);

    expect(result.grossPnl).toBe(0);
    expect(result.currentEquity).toBe(1000);
    expect(result.roi).toBe(0);
    expect(result.profitFactor.kind).toBe("no_trades");
    expect(result.bestTrade).toBeNull();
    expect(result.averageTradeDurationMs).toBeNull();
  });

  it("calculates one winning trade", () => {
    const result = analytics([trade()]);

    expect(result.grossPnl).toBe(10);
    expect(result.totalFees).toBe(1);
    expect(result.netPnl).toBe(9);
    expect(result.currentEquity).toBe(1009);
    expect(result.roi).toBe(0.009);
    expect(result.winRate).toBe(1);
    expect(result.averageWinningTrade).toBe(9);
  });

  it("calculates one losing trade", () => {
    const result = analytics([
      trade({ simulatedPnl: -20, fees: 2, exitReason: "STOP" }),
    ]);

    expect(result.netPnl).toBe(-22);
    expect(result.lossRate).toBe(1);
    expect(result.averageLosingTrade).toBe(-22);
    expect(result.worstTrade).toBe(-22);
  });

  it("handles all wins and all losses profit factor states", () => {
    expect(
      analytics([trade({ id: "a" }), trade({ id: "b", simulatedPnl: 5 })])
        .profitFactor.kind,
    ).toBe("no_losing_trades");
    expect(
      analytics([
        trade({ id: "a", simulatedPnl: -5 }),
        trade({ id: "b", simulatedPnl: -7 }),
      ]).profitFactor,
    ).toEqual({ kind: "no_winning_trades", value: 0 });
  });

  it("calculates mixed trade metrics with zero and large fees", () => {
    const result = analytics([
      trade({ id: "a", simulatedPnl: 100, fees: 0 }),
      trade({ id: "b", simulatedPnl: -20, fees: 30 }),
      trade({ id: "c", simulatedPnl: 0, fees: 0 }),
    ]);

    expect(result.netPnl).toBe(50);
    expect(result.winRate).toBe(1 / 3);
    expect(result.lossRate).toBe(1 / 3);
    expect(result.breakevenRate).toBe(1 / 3);
    expect(result.profitFactor.kind).toBe("finite");
    expect(result.profitFactor.value).toBe(2);
  });

  it("counts liquidations and liquidation rate", () => {
    const result = analytics([
      trade({ id: "a", exitReason: "LIQUIDATION", simulatedPnl: -90 }),
      trade({ id: "b", exitReason: "TARGET", simulatedPnl: 40 }),
    ]);

    expect(result.liquidationCount).toBe(1);
    expect(result.liquidationRate).toBe(0.5);
  });

  it("sorts duplicate timestamps deterministically by id", () => {
    const normalized = normalizeTrades([
      trade({ id: "b", simulatedPnl: 10 }),
      trade({ id: "a", simulatedPnl: 20 }),
    ]);

    expect(
      buildEquityCurve(normalized, 100).map((point) => point.tradeId),
    ).toEqual(["a", "b"]);
  });

  it("excludes invalid duration from metrics and qualification", () => {
    const normalized = normalizeTrades([
      trade({ id: "bad", closedAt: new Date("2026-01-04T23:59:00.000Z") }),
    ]);
    const result = analytics([
      trade({ id: "bad", closedAt: new Date("2026-01-04T23:59:00.000Z") }),
    ]);

    expect(normalized[0]?.malformed).toBe(true);
    expect(isQualifiedTrade(normalized[0]!)).toBe(false);
    expect(result.netPnl).toBe(0);
  });

  it("handles zero starting equity without ROI division by zero", () => {
    const result = analytics([trade()], 0);

    expect(result.roi).toBeNull();
    expect(result.currentEquity).toBe(9);
  });

  it("calculates maximum drawdown for all losses and all wins", () => {
    expect(
      analytics([
        trade({ id: "a", simulatedPnl: -100, fees: 0 }),
        trade({ id: "b", simulatedPnl: -100, fees: 0 }),
      ]).maximumDrawdown,
    ).toBe(0.2);
    expect(
      analytics([
        trade({ id: "a", simulatedPnl: 100, fees: 0 }),
        trade({ id: "b", simulatedPnl: 50, fees: 0 }),
      ]).maximumDrawdown,
    ).toBe(0);
  });

  it("aggregates daily P&L and daily returns", () => {
    const result = analytics([
      trade({ id: "a", simulatedPnl: 100, fees: 0 }),
      trade({
        id: "b",
        openedAt: new Date("2026-01-06T00:00:00.000Z"),
        closedAt: new Date("2026-01-06T00:10:00.000Z"),
        simulatedPnl: -55,
        fees: 0,
      }),
    ]);

    expect(result.dailyPnl["2026-01-05"]).toBe(100);
    expect(result.dailyPnl["2026-01-06"]).toBe(-55);
    expect(result.dailyReturns["2026-01-05"]).toBe(0.1);
    expect(result.dailyReturns["2026-01-06"]).toBe(-0.05);
  });

  it("computes market allocation sum and concentration metrics", () => {
    const result = analytics([
      trade({ id: "a", marketSymbol: "SOL_PERP", simulatedVolume: 100 }),
      trade({ id: "b", marketSymbol: "BTC_PERP", simulatedVolume: 300 }),
    ]);
    const allocationSum = Object.values(result.marketAllocation).reduce(
      (total, value) => total + value,
      0,
    );

    expect(allocationSum).toBeCloseTo(1);
    expect(result.positionConcentration).toBeCloseTo(0.625);
  });

  it("calculates best-trade dependence", () => {
    const result = analytics([
      trade({ id: "a", simulatedPnl: 100, fees: 0 }),
      trade({ id: "b", simulatedPnl: -40, fees: 0 }),
    ]);

    expect(result.bestTradeDependence).toBeCloseTo(100 / 60);
  });

  it("detects qualified trades and duplicate identities", () => {
    const normalized = normalizeTrades([
      trade({ id: "same" }),
      trade({
        id: "same",
        openedAt: new Date("2026-01-05T01:00:00.000Z"),
        closedAt: new Date("2026-01-05T01:10:00.000Z"),
      }),
    ]);

    expect(isQualifiedTrade(normalized[0]!)).toBe(true);
    expect(normalized[1]?.duplicateIdentity).toBe(true);
    expect(isQualifiedTrade(normalized[1]!)).toBe(false);
  });

  it("calculates trade-frequency metrics", () => {
    const result = analytics([
      trade({ id: "a", closedAt: new Date("2026-01-05T00:10:00.000Z") }),
      trade({
        id: "b",
        openedAt: new Date("2026-01-05T01:00:00.000Z"),
        closedAt: new Date("2026-01-05T01:10:00.000Z"),
      }),
      trade({
        id: "c",
        openedAt: new Date("2026-01-06T01:00:00.000Z"),
        closedAt: new Date("2026-01-06T01:10:00.000Z"),
      }),
    ]);

    expect(result.tradeFrequency.tradesPerActiveDay).toBe(1.5);
    expect(result.tradeFrequency.maxTradesInDay).toBe(2);
    expect(result.activeTradingDays).toBe(2);
  });

  it("does not leak NaN or Infinity for edge cases", () => {
    const result = analytics(
      [
        trade({
          id: "a",
          simulatedPnl: -5000,
          fees: 100,
          exitReason: "LIQUIDATION",
        }),
        trade({ id: "b", simulatedPnl: 0, fees: 0 }),
      ],
      0,
    );

    expectNoInvalidNumbers(result);
  });

  it("normalizes invalid market values as malformed", () => {
    const normalized = normalizeTrades([
      trade({ marketSymbol: "DOGE_PERP" as MarketSymbol }),
    ]);

    expect(normalized[0]?.validMarket).toBe(false);
    expect(normalized[0]?.malformed).toBe(true);
  });

  it("accepts explicit side and exit reason enum-like values", () => {
    const result = analytics([
      trade({
        side: "SHORT" as TradeSide,
        exitReason: "MANUAL" as TradeExitReason,
      }),
    ]);

    expect(result.qualifiedTradeCount).toBe(1);
  });
});
