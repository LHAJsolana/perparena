import type { MarketSymbol } from "@prisma/client";
import type {
  NormalizedTrade,
  QualifiedTradeRule,
} from "@/features/analytics/types";

export const DEFAULT_QUALIFIED_TRADE_RULE: QualifiedTradeRule = {
  minimumDurationMs: 5 * 60 * 1000,
  minimumNotional: 25,
  validMarkets: ["SOL_PERP", "BTC_PERP", "ETH_PERP"],
};

export function isQualifiedTrade(
  trade: NormalizedTrade,
  rule: QualifiedTradeRule = DEFAULT_QUALIFIED_TRADE_RULE,
) {
  return (
    !trade.malformed &&
    !trade.duplicateIdentity &&
    trade.validMarket &&
    rule.validMarkets.includes(trade.marketSymbol as MarketSymbol) &&
    trade.durationMs >= rule.minimumDurationMs &&
    trade.size > 0 &&
    trade.simulatedVolume >= rule.minimumNotional
  );
}
