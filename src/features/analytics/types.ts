import type { MarketSymbol, TradeExitReason, TradeSide } from "@prisma/client";

export type RawAnalyticsTrade = {
  id: string;
  marketSymbol: MarketSymbol;
  side: TradeSide;
  openedAt: Date;
  closedAt: Date | null;
  size: number;
  leverage: number;
  simulatedVolume: number;
  simulatedPnl: number | null;
  fees: number;
  exitReason: TradeExitReason | null;
};

export type NormalizedTrade = {
  id: string;
  marketSymbol: MarketSymbol;
  side: TradeSide;
  openedAt: Date;
  closedAt: Date;
  durationMs: number;
  size: number;
  leverage: number;
  simulatedVolume: number;
  grossPnl: number;
  fees: number;
  netPnl: number;
  exitReason: TradeExitReason | null;
  duplicateIdentity: boolean;
  validMarket: boolean;
  malformed: boolean;
};

export type QualifiedTradeRule = {
  minimumDurationMs: number;
  minimumNotional: number;
  validMarkets: readonly MarketSymbol[];
};

export type ProfitFactor =
  | { kind: "no_trades"; value: null }
  | { kind: "no_winning_trades"; value: 0 }
  | { kind: "no_losing_trades"; value: null }
  | { kind: "finite"; value: number };

export type EquityCurvePoint = {
  tradeId: string;
  timestamp: Date;
  equity: number;
  netPnl: number;
};

export type DailyAnalytics = {
  day: Date;
  startingEquity: number;
  endingEquity: number;
  simulatedPnl: number;
  simulatedVolume: number;
  maximumDrawdown: number;
  qualifiedTrades: number;
  return: number | null;
  tradeCount: number;
};

export type TradeFrequencyMetrics = {
  tradesPerActiveDay: number;
  tradesPerCompetitionDay: number;
  averageGapMs: number | null;
  maxTradesInDay: number;
};

export type ParticipantAnalytics = {
  grossPnl: number;
  totalFees: number;
  netPnl: number;
  startingEquity: number;
  currentEquity: number;
  roi: number | null;
  winRate: number;
  lossRate: number;
  breakevenRate: number;
  profitFactor: ProfitFactor;
  averageWinningTrade: number | null;
  averageLosingTrade: number | null;
  bestTrade: number | null;
  worstTrade: number | null;
  maximumDrawdown: number;
  averageLeverage: number | null;
  maximumLeverage: number | null;
  liquidationCount: number;
  liquidationRate: number;
  activeTradingDays: number;
  qualifiedTradeCount: number;
  averageTradeDurationMs: number | null;
  dailyPnl: Record<string, number>;
  dailyReturns: Record<string, number | null>;
  returnVolatility: number | null;
  profitableActiveDayPercentage: number;
  marketAllocation: Record<string, number>;
  positionConcentration: number;
  bestTradeDependence: number;
  tradeFrequency: TradeFrequencyMetrics;
  equityCurve: EquityCurvePoint[];
  dailyPerformance: DailyAnalytics[];
};
