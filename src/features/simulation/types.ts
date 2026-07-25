import type {
  Division,
  IntegrityFlagType,
  IntegritySeverity,
  IntegrityStatus,
  MarketSymbol,
  ParticipantArchetype,
  TradeExitReason,
  TradeSide,
} from "@prisma/client";

export type SimulatedCompetition = {
  id: string;
  name: string;
  slug: string;
  startsAt: Date;
  endsAt: Date;
};

export type SimulatedMarket = {
  id: string;
  symbol: MarketSymbol;
  displayName: string;
};

export type SimulatedParticipant = {
  id: string;
  wallet: string;
  displayName: string;
  division: Division;
  archetype: ParticipantArchetype;
  startingEquity: number;
  currentEquity: number;
  maximumDrawdown: number;
  qualifiedTradeCount: number;
  simulatedVolume: number;
};

export type SimulatedTrade = {
  id: string;
  participantId: string;
  competitionMarketId: string;
  side: TradeSide;
  openedAt: Date;
  closedAt: Date;
  entryPrice: number;
  exitPrice: number;
  size: number;
  leverage: number;
  simulatedVolume: number;
  simulatedPnl: number;
  fees: number;
  isQualified: boolean;
  exitReason: TradeExitReason;
};

export type SimulatedDailyPerformance = {
  id: string;
  participantId: string;
  day: Date;
  startingEquity: number;
  endingEquity: number;
  simulatedPnl: number;
  simulatedVolume: number;
  maximumDrawdown: number;
  qualifiedTrades: number;
};

export type SimulatedIntegrityFlag = {
  id: string;
  participantId: string;
  type: IntegrityFlagType;
  severity: IntegritySeverity;
  status: IntegrityStatus;
  reason: string;
  evidence: Record<string, string | number | boolean>;
};

export type SimulationDataset = {
  seed: string;
  competition: SimulatedCompetition;
  markets: SimulatedMarket[];
  participants: SimulatedParticipant[];
  trades: SimulatedTrade[];
  dailyPerformances: SimulatedDailyPerformance[];
  integrityFlags: SimulatedIntegrityFlag[];
};

export type SimulationSummary = {
  competitionCreated: string;
  participantCount: number;
  tradeCount: number;
  marketDistribution: Record<string, number>;
  archetypeDistribution: Record<string, number>;
  liquidationCount: number;
  dateRange: {
    startsAt: string;
    endsAt: string;
  };
};
