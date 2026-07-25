import type {
  DailyAnalytics,
  NormalizedTrade,
} from "@/features/analytics/types";
import { calculateMaximumDrawdown } from "@/features/analytics/equity-curve";
import { isQualifiedTrade } from "@/features/analytics/qualification";

const DAY_MS = 24 * 60 * 60 * 1000;

export function aggregateDailyPerformance(
  trades: readonly NormalizedTrade[],
  startingEquity: number,
  startsAt: Date,
  endsAt: Date,
): DailyAnalytics[] {
  const days = Math.ceil((endsAt.getTime() - startsAt.getTime()) / DAY_MS);
  let equity = startingEquity;
  let peak = startingEquity;
  const output: DailyAnalytics[] = [];

  for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
    const day = new Date(startsAt.getTime() + dayIndex * DAY_MS);
    const nextDay = new Date(day.getTime() + DAY_MS);
    const dayTrades = trades.filter(
      (trade) =>
        !trade.malformed && trade.closedAt >= day && trade.closedAt < nextDay,
    );
    const dayStart = equity;
    const simulatedPnl = sum(dayTrades.map((trade) => trade.netPnl));
    const simulatedVolume = sum(
      dayTrades.map((trade) => trade.simulatedVolume),
    );
    equity += simulatedPnl;
    peak = Math.max(peak, equity);

    output.push({
      day,
      startingEquity: dayStart,
      endingEquity: equity,
      simulatedPnl,
      simulatedVolume,
      maximumDrawdown: calculateMaximumDrawdown(
        [
          {
            tradeId: `daily-${dayIndex}`,
            timestamp: nextDay,
            equity,
            netPnl: simulatedPnl,
          },
        ],
        peak,
      ),
      qualifiedTrades: dayTrades.filter((trade) => isQualifiedTrade(trade))
        .length,
      return: dayStart === 0 ? null : simulatedPnl / dayStart,
      tradeCount: dayTrades.length,
    });
  }

  return output;
}

function sum(values: readonly number[]) {
  return values.reduce((total, value) => total + value, 0);
}
