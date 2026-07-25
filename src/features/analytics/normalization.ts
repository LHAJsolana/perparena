import type { MarketSymbol } from "@prisma/client";
import type {
  NormalizedTrade,
  RawAnalyticsTrade,
} from "@/features/analytics/types";

const VALID_MARKETS: readonly MarketSymbol[] = [
  "SOL_PERP",
  "BTC_PERP",
  "ETH_PERP",
];

export function normalizeTrades(
  rawTrades: readonly RawAnalyticsTrade[],
): NormalizedTrade[] {
  const seenIds = new Set<string>();

  return rawTrades.map((trade) => {
    const duplicateIdentity = seenIds.has(trade.id);
    seenIds.add(trade.id);

    const validNumbers = [
      trade.size,
      trade.leverage,
      trade.simulatedVolume,
      trade.simulatedPnl ?? 0,
      trade.fees,
    ].every(Number.isFinite);
    const closedAt = trade.closedAt ?? trade.openedAt;
    const hasClosedAt = trade.closedAt instanceof Date;
    const durationMs = hasClosedAt
      ? closedAt.getTime() - trade.openedAt.getTime()
      : 0;
    const validMarket = VALID_MARKETS.includes(trade.marketSymbol);
    const malformed =
      !validNumbers ||
      !hasClosedAt ||
      durationMs <= 0 ||
      trade.size <= 0 ||
      trade.leverage <= 0 ||
      trade.fees < 0 ||
      !validMarket;
    const grossPnl = trade.simulatedPnl ?? 0;
    const fees = Math.max(0, trade.fees);

    return {
      id: trade.id,
      marketSymbol: trade.marketSymbol,
      side: trade.side,
      openedAt: trade.openedAt,
      closedAt,
      durationMs,
      size: trade.size,
      leverage: trade.leverage,
      simulatedVolume: trade.simulatedVolume,
      grossPnl,
      fees,
      netPnl: grossPnl - fees,
      exitReason: trade.exitReason,
      duplicateIdentity,
      validMarket,
      malformed,
    };
  });
}

export function sortTradesDeterministically(
  trades: readonly NormalizedTrade[],
) {
  return [...trades].sort((left, right) => {
    const timeDifference = left.closedAt.getTime() - right.closedAt.getTime();

    if (timeDifference !== 0) {
      return timeDifference;
    }

    return left.id.localeCompare(right.id);
  });
}
