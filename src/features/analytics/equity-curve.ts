import type {
  EquityCurvePoint,
  NormalizedTrade,
} from "@/features/analytics/types";
import { sortTradesDeterministically } from "@/features/analytics/normalization";

export function buildEquityCurve(
  trades: readonly NormalizedTrade[],
  startingEquity: number,
): EquityCurvePoint[] {
  let equity = safeNumber(startingEquity);

  return sortTradesDeterministically(trades)
    .filter((trade) => !trade.malformed)
    .map((trade) => {
      equity += trade.netPnl;

      return {
        tradeId: trade.id,
        timestamp: trade.closedAt,
        equity,
        netPnl: trade.netPnl,
      };
    });
}

export function calculateMaximumDrawdown(
  equityCurve: readonly EquityCurvePoint[],
  startingEquity: number,
) {
  let peak = safeNumber(startingEquity);
  let maximumDrawdown = 0;

  for (const point of equityCurve) {
    peak = Math.max(peak, point.equity);

    if (peak === 0) {
      maximumDrawdown = Math.max(maximumDrawdown, point.equity < 0 ? 1 : 0);
      continue;
    }

    maximumDrawdown = Math.max(
      maximumDrawdown,
      (peak - point.equity) / Math.abs(peak),
    );
  }

  return finiteOrZero(maximumDrawdown);
}

function safeNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function finiteOrZero(value: number) {
  return Number.isFinite(value) ? value : 0;
}
