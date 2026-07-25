import type { MarketSymbol } from "@prisma/client";
import type {
  NormalizedTrade,
  ParticipantAnalytics,
  ProfitFactor,
  RawAnalyticsTrade,
} from "@/features/analytics/types";
import { aggregateDailyPerformance } from "@/features/analytics/daily";
import {
  buildEquityCurve,
  calculateMaximumDrawdown,
} from "@/features/analytics/equity-curve";
import {
  normalizeTrades,
  sortTradesDeterministically,
} from "@/features/analytics/normalization";
import { isQualifiedTrade } from "@/features/analytics/qualification";

export function calculateParticipantAnalytics(input: {
  trades: readonly RawAnalyticsTrade[];
  startingEquity: number;
  startsAt: Date;
  endsAt: Date;
}): ParticipantAnalytics {
  const normalized = sortTradesDeterministically(normalizeTrades(input.trades));
  const validTrades = normalized.filter((trade) => !trade.malformed);
  const grossPnl = sum(validTrades.map((trade) => trade.grossPnl));
  const totalFees = sum(validTrades.map((trade) => trade.fees));
  const netPnl = grossPnl - totalFees;
  const currentEquity = input.startingEquity + netPnl;
  const winningTrades = validTrades.filter((trade) => trade.netPnl > 0);
  const losingTrades = validTrades.filter((trade) => trade.netPnl < 0);
  const breakevenTrades = validTrades.filter((trade) => trade.netPnl === 0);
  const equityCurve = buildEquityCurve(validTrades, input.startingEquity);
  const dailyPerformance = aggregateDailyPerformance(
    validTrades,
    input.startingEquity,
    input.startsAt,
    input.endsAt,
  );
  const dailyReturns = Object.fromEntries(
    dailyPerformance.map((day) => [dayKey(day.day), day.return]),
  );

  return assertFiniteAnalytics({
    grossPnl,
    totalFees,
    netPnl,
    startingEquity: input.startingEquity,
    currentEquity,
    roi: input.startingEquity === 0 ? null : netPnl / input.startingEquity,
    winRate: ratio(winningTrades.length, validTrades.length),
    lossRate: ratio(losingTrades.length, validTrades.length),
    breakevenRate: ratio(breakevenTrades.length, validTrades.length),
    profitFactor: calculateProfitFactor(
      winningTrades,
      losingTrades,
      validTrades.length,
    ),
    averageWinningTrade: averageOrNull(
      winningTrades.map((trade) => trade.netPnl),
    ),
    averageLosingTrade: averageOrNull(
      losingTrades.map((trade) => trade.netPnl),
    ),
    bestTrade: validTrades.length
      ? Math.max(...validTrades.map((trade) => trade.netPnl))
      : null,
    worstTrade: validTrades.length
      ? Math.min(...validTrades.map((trade) => trade.netPnl))
      : null,
    maximumDrawdown: calculateMaximumDrawdown(
      equityCurve,
      input.startingEquity,
    ),
    averageLeverage: averageOrNull(validTrades.map((trade) => trade.leverage)),
    maximumLeverage: validTrades.length
      ? Math.max(...validTrades.map((trade) => trade.leverage))
      : null,
    liquidationCount: validTrades.filter(
      (trade) => trade.exitReason === "LIQUIDATION",
    ).length,
    liquidationRate: ratio(
      validTrades.filter((trade) => trade.exitReason === "LIQUIDATION").length,
      validTrades.length,
    ),
    activeTradingDays: dailyPerformance.filter((day) => day.tradeCount > 0)
      .length,
    qualifiedTradeCount: validTrades.filter((trade) => isQualifiedTrade(trade))
      .length,
    averageTradeDurationMs: averageOrNull(
      validTrades.map((trade) => trade.durationMs),
    ),
    dailyPnl: Object.fromEntries(
      dailyPerformance.map((day) => [dayKey(day.day), day.simulatedPnl]),
    ),
    dailyReturns,
    returnVolatility: standardDeviation(
      Object.values(dailyReturns).filter(
        (value): value is number => value !== null,
      ),
    ),
    profitableActiveDayPercentage:
      profitableActiveDayPercentage(dailyPerformance),
    marketAllocation: marketAllocation(validTrades),
    positionConcentration: concentration(
      validTrades.map((trade) => trade.simulatedVolume),
    ),
    bestTradeDependence:
      netPnl > 0 && validTrades.length
        ? Math.max(0, Math.max(...validTrades.map((trade) => trade.netPnl))) /
          netPnl
        : 0,
    tradeFrequency: tradeFrequency(validTrades, dailyPerformance.length),
    equityCurve,
    dailyPerformance,
  });
}

export function calculateProfitFactor(
  winningTrades: readonly NormalizedTrade[],
  losingTrades: readonly NormalizedTrade[],
  tradeCount: number,
): ProfitFactor {
  if (tradeCount === 0) {
    return { kind: "no_trades", value: null };
  }

  const grossWins = sum(winningTrades.map((trade) => trade.netPnl));
  const grossLosses = Math.abs(sum(losingTrades.map((trade) => trade.netPnl)));

  if (grossWins === 0) {
    return { kind: "no_winning_trades", value: 0 };
  }

  if (grossLosses === 0) {
    return { kind: "no_losing_trades", value: null };
  }

  return { kind: "finite", value: grossWins / grossLosses };
}

function marketAllocation(trades: readonly NormalizedTrade[]) {
  const totalVolume = sum(trades.map((trade) => trade.simulatedVolume));
  const allocations: Record<MarketSymbol, number> = {
    BTC_PERP: 0,
    ETH_PERP: 0,
    SOL_PERP: 0,
  };

  for (const trade of trades) {
    allocations[trade.marketSymbol] +=
      totalVolume === 0 ? 0 : trade.simulatedVolume / totalVolume;
  }

  return allocations;
}

function tradeFrequency(
  trades: readonly NormalizedTrade[],
  competitionDays: number,
) {
  const activeDays = new Set(trades.map((trade) => dayKey(trade.closedAt)))
    .size;
  const sorted = sortTradesDeterministically(trades);
  const gaps = sorted.slice(1).map((trade, index) => {
    const previous = sorted[index];
    return previous
      ? trade.closedAt.getTime() - previous.closedAt.getTime()
      : 0;
  });
  const countsByDay = sorted.reduce<Record<string, number>>((counts, trade) => {
    const key = dayKey(trade.closedAt);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});

  return {
    tradesPerActiveDay: activeDays === 0 ? 0 : trades.length / activeDays,
    tradesPerCompetitionDay:
      competitionDays === 0 ? 0 : trades.length / competitionDays,
    averageGapMs: averageOrNull(gaps),
    maxTradesInDay: Math.max(0, ...Object.values(countsByDay)),
  };
}

function profitableActiveDayPercentage(
  days: readonly { tradeCount: number; simulatedPnl: number }[],
) {
  const activeDays = days.filter((day) => day.tradeCount > 0);

  return ratio(
    activeDays.filter((day) => day.simulatedPnl > 0).length,
    activeDays.length,
  );
}

function concentration(values: readonly number[]) {
  const total = sum(values);

  if (total === 0) {
    return 0;
  }

  return values.reduce((score, value) => score + (value / total) ** 2, 0);
}

function standardDeviation(values: readonly number[]) {
  if (values.length === 0) {
    return null;
  }

  const average = sum(values) / values.length;
  const variance =
    sum(values.map((value) => (value - average) ** 2)) / values.length;

  return Math.sqrt(variance);
}

function averageOrNull(values: readonly number[]) {
  return values.length === 0 ? null : sum(values) / values.length;
}

function ratio(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : numerator / denominator;
}

function sum(values: readonly number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function assertFiniteAnalytics<T extends ParticipantAnalytics>(
  analytics: T,
): T {
  const values = [
    analytics.grossPnl,
    analytics.totalFees,
    analytics.netPnl,
    analytics.startingEquity,
    analytics.currentEquity,
    analytics.winRate,
    analytics.lossRate,
    analytics.breakevenRate,
    analytics.maximumDrawdown,
    analytics.liquidationRate,
    analytics.activeTradingDays,
    analytics.qualifiedTradeCount,
    analytics.profitableActiveDayPercentage,
    analytics.positionConcentration,
    analytics.bestTradeDependence,
  ];

  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error("Analytics generated NaN or Infinity");
  }

  return analytics;
}
