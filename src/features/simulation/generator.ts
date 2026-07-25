import type {
  Division,
  IntegrityFlagType,
  IntegritySeverity,
  IntegrityStatus,
  ParticipantArchetype,
  TradeExitReason,
  TradeSide,
} from "@prisma/client";
import {
  PUBLIC_MARKET_LABELS,
  SIMULATION_COMPETITION,
  SIMULATION_MARKETS,
  SIMULATION_SEED,
} from "@/features/simulation/constants";
import { SeededRandom } from "@/features/simulation/random";
import type {
  SimulatedDailyPerformance,
  SimulatedIntegrityFlag,
  SimulatedMarket,
  SimulatedParticipant,
  SimulatedTrade,
  SimulationDataset,
  SimulationSummary,
} from "@/features/simulation/types";

type ArchetypeConfig = {
  archetype: ParticipantArchetype;
  count: number;
  trades: [number, number];
  equity: [number, number];
  leverage: [number, number];
  winRate: number;
  liquidationRate: number;
  division: Division;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const TRADE_TARGET = 1728;

const archetypeConfigs: ArchetypeConfig[] = [
  {
    archetype: "DISCIPLINED_LOW_RISK",
    count: 10,
    trades: [14, 22],
    equity: [9000, 26000],
    leverage: [1.2, 3],
    winRate: 0.58,
    liquidationRate: 0.005,
    division: "OPEN",
  },
  {
    archetype: "CONSISTENT_MEDIUM_RISK",
    count: 12,
    trades: [22, 34],
    equity: [7000, 22000],
    leverage: [2, 6],
    winRate: 0.54,
    liquidationRate: 0.015,
    division: "OPEN",
  },
  {
    archetype: "HIGH_LEVERAGE_GAMBLER",
    count: 9,
    trades: [26, 44],
    equity: [2500, 12000],
    leverage: [10, 35],
    winRate: 0.43,
    liquidationRate: 0.105,
    division: "RISK_LAB",
  },
  {
    archetype: "WHALE",
    count: 5,
    trades: [18, 28],
    equity: [85000, 220000],
    leverage: [1.5, 5],
    winRate: 0.51,
    liquidationRate: 0.01,
    division: "OPEN",
  },
  {
    archetype: "SMALL_ACCOUNT_HIGH_ROI",
    count: 8,
    trades: [18, 32],
    equity: [500, 1800],
    leverage: [3, 10],
    winRate: 0.55,
    liquidationRate: 0.025,
    division: "PROVISIONAL",
  },
  {
    archetype: "VOLUME_FARMER",
    count: 8,
    trades: [58, 82],
    equity: [4000, 18000],
    leverage: [1.2, 4],
    winRate: 0.49,
    liquidationRate: 0.01,
    division: "RISK_LAB",
  },
  {
    archetype: "ONE_TRADE_WONDER",
    count: 6,
    trades: [1, 1],
    equity: [1200, 15000],
    leverage: [4, 18],
    winRate: 0.67,
    liquidationRate: 0.03,
    division: "PROVISIONAL",
  },
  {
    archetype: "DIVERSIFIED_TRADER",
    count: 10,
    trades: [24, 38],
    equity: [5000, 24000],
    leverage: [2, 8],
    winRate: 0.52,
    liquidationRate: 0.018,
    division: "OPEN",
  },
  {
    archetype: "INACTIVE_TRADER",
    count: 6,
    trades: [0, 0],
    equity: [1000, 12000],
    leverage: [1, 1],
    winRate: 0.5,
    liquidationRate: 0,
    division: "PROVISIONAL",
  },
  {
    archetype: "LATE_COMPETITION_SPRINTER",
    count: 7,
    trades: [24, 40],
    equity: [1800, 10000],
    leverage: [4, 14],
    winRate: 0.5,
    liquidationRate: 0.035,
    division: "RISK_LAB",
  },
  {
    archetype: "REPETITIVE_SIZE_TRADER",
    count: 7,
    trades: [32, 52],
    equity: [2500, 16000],
    leverage: [2, 7],
    winRate: 0.48,
    liquidationRate: 0.02,
    division: "RISK_LAB",
  },
  {
    archetype: "FREQUENTLY_LIQUIDATED",
    count: 8,
    trades: [18, 34],
    equity: [900, 7000],
    leverage: [16, 45],
    winRate: 0.35,
    liquidationRate: 0.24,
    division: "RISK_LAB",
  },
];

export function generateSimulation(seed = SIMULATION_SEED): SimulationDataset {
  const random = new SeededRandom(seed);
  const markets = buildMarkets();
  const participants = buildParticipants(random);
  const trades = buildTrades(random, participants, markets);
  const dailyPerformances = buildDailyPerformances(participants, trades);
  const integrityFlags = buildIntegrityFlags(participants, trades);
  const participantById = new Map(
    participants.map((participant) => [participant.id, participant]),
  );

  for (const performance of dailyPerformances) {
    const participant = participantById.get(performance.participantId);

    if (!participant) {
      continue;
    }

    participant.maximumDrawdown = Math.max(
      participant.maximumDrawdown,
      performance.maximumDrawdown,
    );
  }

  for (const participant of participants) {
    const participantTrades = trades.filter(
      (trade) => trade.participantId === participant.id,
    );
    participant.qualifiedTradeCount = participantTrades.filter(
      (trade) => trade.isQualified,
    ).length;
    participant.simulatedVolume = round(
      participantTrades.reduce(
        (total, trade) => total + trade.simulatedVolume,
        0,
      ),
      8,
    );
    participant.currentEquity = round(
      Math.max(
        0,
        participant.startingEquity +
          participantTrades.reduce(
            (total, trade) => total + trade.simulatedPnl - trade.fees,
            0,
          ),
      ),
      8,
    );
  }

  return {
    seed,
    competition: { ...SIMULATION_COMPETITION },
    markets,
    participants,
    trades,
    dailyPerformances,
    integrityFlags,
  };
}

export function summarizeSimulation(
  dataset: SimulationDataset,
): SimulationSummary {
  return {
    competitionCreated: dataset.competition.slug,
    participantCount: dataset.participants.length,
    tradeCount: dataset.trades.length,
    marketDistribution: countBy(
      dataset.trades.map((trade) => {
        const market = dataset.markets.find(
          (item) => item.id === trade.competitionMarketId,
        );
        return market?.symbol ?? "UNKNOWN";
      }),
    ),
    archetypeDistribution: countBy(
      dataset.participants.map((participant) => participant.archetype),
    ),
    liquidationCount: dataset.trades.filter(
      (trade) => trade.exitReason === "LIQUIDATION",
    ).length,
    dateRange: {
      startsAt: dataset.competition.startsAt.toISOString(),
      endsAt: dataset.competition.endsAt.toISOString(),
    },
  };
}

function buildMarkets(): SimulatedMarket[] {
  return SIMULATION_MARKETS.map((symbol) => ({
    id: `market_${symbol.toLowerCase()}`,
    symbol,
    displayName: PUBLIC_MARKET_LABELS[symbol],
  }));
}

function buildParticipants(random: SeededRandom): SimulatedParticipant[] {
  const participants: SimulatedParticipant[] = [];
  let participantIndex = 0;

  for (const config of archetypeConfigs) {
    for (let index = 0; index < config.count; index += 1) {
      const startingEquity = round(
        random.float(config.equity[0], config.equity[1]),
        8,
      );

      participants.push({
        id: `participant_${participantIndex.toString().padStart(3, "0")}`,
        wallet: `PArenaSynthetic${participantIndex.toString().padStart(4, "0")}${stableHex(
          participantIndex,
        )}`,
        displayName: `Synthetic Participant ${participantIndex + 1}`,
        division: config.division,
        archetype: config.archetype,
        startingEquity,
        currentEquity: startingEquity,
        maximumDrawdown: 0,
        qualifiedTradeCount: 0,
        simulatedVolume: 0,
      });
      participantIndex += 1;
    }
  }

  return participants;
}

function buildTrades(
  random: SeededRandom,
  participants: SimulatedParticipant[],
  markets: SimulatedMarket[],
) {
  const trades: SimulatedTrade[] = [];
  const participantTargets = new Map<string, number>();
  const configByArchetype = new Map(
    archetypeConfigs.map((config) => [config.archetype, config]),
  );

  for (const participant of participants) {
    const config = configByArchetype.get(participant.archetype);
    const target = config
      ? random.integer(config.trades[0], config.trades[1])
      : 0;
    participantTargets.set(participant.id, target);
  }

  rebalanceTradeTargets(participantTargets, participants);

  for (const participant of participants) {
    const config = configByArchetype.get(participant.archetype);
    const target = participantTargets.get(participant.id) ?? 0;

    if (!config || target === 0) {
      continue;
    }

    for (let tradeIndex = 0; tradeIndex < target; tradeIndex += 1) {
      trades.push(
        buildTrade(
          random,
          participant,
          config,
          markets,
          trades.length,
          tradeIndex,
          target,
        ),
      );
    }
  }

  return trades.sort(
    (left, right) => left.openedAt.getTime() - right.openedAt.getTime(),
  );
}

function rebalanceTradeTargets(
  targets: Map<string, number>,
  participants: SimulatedParticipant[],
) {
  let current = Array.from(targets.values()).reduce(
    (total, value) => total + value,
    0,
  );
  let cursor = 0;

  while (current < TRADE_TARGET) {
    const participant = participants[cursor % participants.length];

    if (
      participant.archetype !== "INACTIVE_TRADER" &&
      participant.archetype !== "ONE_TRADE_WONDER"
    ) {
      targets.set(participant.id, (targets.get(participant.id) ?? 0) + 1);
      current += 1;
    }

    cursor += 1;
  }
}

function buildTrade(
  random: SeededRandom,
  participant: SimulatedParticipant,
  config: ArchetypeConfig,
  markets: SimulatedMarket[],
  globalIndex: number,
  participantTradeIndex: number,
  participantTradeTarget: number,
): SimulatedTrade {
  const market = selectMarket(
    random,
    participant.archetype,
    markets,
    participantTradeIndex,
  );
  const side: TradeSide = random.next() > 0.5 ? "LONG" : "SHORT";
  const openedAt = buildOpenedAt(
    random,
    participant.archetype,
    participantTradeIndex,
    participantTradeTarget,
  );
  const requestedDurationMinutes = buildDurationMinutes(
    random,
    participant.archetype,
  );
  const maxDurationMinutes = Math.max(
    1,
    Math.floor(
      (SIMULATION_COMPETITION.endsAt.getTime() - openedAt.getTime()) /
        MINUTE_MS,
    ),
  );
  const durationMinutes = Math.min(
    requestedDurationMinutes,
    maxDurationMinutes,
  );
  const closedAt = new Date(openedAt.getTime() + durationMinutes * MINUTE_MS);
  const entryPrice = marketPrice(random, market.symbol);
  const leverage = round(
    random.float(config.leverage[0], config.leverage[1]),
    4,
  );
  const isLiquidation = random.next() < config.liquidationRate;
  const isWinner = !isLiquidation && random.next() < config.winRate;
  const notionalFraction =
    participant.archetype === "WHALE" ? 0.18 : random.float(0.08, 0.42);
  const notional = participant.startingEquity * notionalFraction * leverage;
  const size = round(notional / entryPrice, 8);
  const fees = round(Math.max(0, notional * random.float(0.00018, 0.00075)), 8);
  const pnlRate = isLiquidation
    ? -random.float(0.42, 0.96)
    : isWinner
      ? random.float(0.006, 0.085)
      : -random.float(0.004, 0.07);
  const simulatedPnl = round(notional * pnlRate, 8);
  const priceMove = Math.abs(simulatedPnl / Math.max(notional, 1)) / leverage;
  const direction = side === "LONG" ? 1 : -1;
  const signedMove = (simulatedPnl >= 0 ? direction : -direction) * priceMove;
  const exitPrice = round(Math.max(0.01, entryPrice * (1 + signedMove)), 10);

  return {
    id: `trade_${globalIndex.toString().padStart(6, "0")}`,
    participantId: participant.id,
    competitionMarketId: market.id,
    side,
    openedAt,
    closedAt,
    entryPrice: round(entryPrice, 10),
    exitPrice,
    size,
    leverage,
    simulatedVolume: round(notional, 8),
    simulatedPnl,
    fees,
    isQualified: durationMinutes >= 5 && notional >= 25,
    exitReason: buildExitReason(random, isLiquidation, isWinner),
  };
}

function selectMarket(
  random: SeededRandom,
  archetype: ParticipantArchetype,
  markets: SimulatedMarket[],
  participantTradeIndex: number,
) {
  if (archetype === "DIVERSIFIED_TRADER") {
    return markets[participantTradeIndex % markets.length];
  }

  if (archetype === "REPETITIVE_SIZE_TRADER") {
    return markets[0];
  }

  return random.pick(markets);
}

function buildOpenedAt(
  random: SeededRandom,
  archetype: ParticipantArchetype,
  participantTradeIndex: number,
  participantTradeTarget: number,
) {
  const start = SIMULATION_COMPETITION.startsAt.getTime();
  const end = SIMULATION_COMPETITION.endsAt.getTime();
  const windowStart =
    archetype === "LATE_COMPETITION_SPRINTER" ? start + DAY_MS * 5 : start;
  const span = end - windowStart - 90 * MINUTE_MS;
  const offset =
    archetype === "VOLUME_FARMER" || archetype === "REPETITIVE_SIZE_TRADER"
      ? (span / Math.max(1, participantTradeTarget)) * participantTradeIndex +
        random.integer(0, 35) * MINUTE_MS
      : random.float(0, span);

  return new Date(Math.floor(windowStart + offset));
}

function buildDurationMinutes(
  random: SeededRandom,
  archetype: ParticipantArchetype,
) {
  if (archetype === "VOLUME_FARMER") {
    return random.integer(3, 35);
  }

  if (archetype === "DISCIPLINED_LOW_RISK") {
    return random.integer(45, 480);
  }

  if (archetype === "ONE_TRADE_WONDER") {
    return random.integer(180, 1440);
  }

  return random.integer(5, 720);
}

function marketPrice(random: SeededRandom, symbol: string) {
  const base =
    symbol === "SOL_PERP" ? 148 : symbol === "BTC_PERP" ? 93400 : 5100;

  return base * random.float(0.92, 1.08);
}

function buildExitReason(
  random: SeededRandom,
  isLiquidation: boolean,
  isWinner: boolean,
): TradeExitReason {
  if (isLiquidation) {
    return "LIQUIDATION";
  }

  if (isWinner) {
    return random.next() > 0.35 ? "TARGET" : "MANUAL";
  }

  return random.next() > 0.5 ? "STOP" : "MANUAL";
}

function buildDailyPerformances(
  participants: SimulatedParticipant[],
  trades: SimulatedTrade[],
): SimulatedDailyPerformance[] {
  const performances: SimulatedDailyPerformance[] = [];

  for (const participant of participants) {
    let equity = participant.startingEquity;
    let peakEquity = participant.startingEquity;

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const day = new Date(
        SIMULATION_COMPETITION.startsAt.getTime() + dayIndex * DAY_MS,
      );
      const nextDay = new Date(day.getTime() + DAY_MS);
      const dailyTrades = trades.filter(
        (trade) =>
          trade.participantId === participant.id &&
          trade.closedAt >= day &&
          trade.closedAt < nextDay,
      );
      const startingEquity = equity;
      const simulatedPnl = dailyTrades.reduce(
        (total, trade) => total + trade.simulatedPnl - trade.fees,
        0,
      );
      const simulatedVolume = dailyTrades.reduce(
        (total, trade) => total + trade.simulatedVolume,
        0,
      );
      equity = Math.max(0, equity + simulatedPnl);
      peakEquity = Math.max(peakEquity, equity);
      const drawdown =
        peakEquity === 0 ? 0 : (peakEquity - equity) / peakEquity;

      performances.push({
        id: `daily_${participant.id}_${dayIndex}`,
        participantId: participant.id,
        day,
        startingEquity: round(startingEquity, 8),
        endingEquity: round(equity, 8),
        simulatedPnl: round(simulatedPnl, 8),
        simulatedVolume: round(simulatedVolume, 8),
        maximumDrawdown: round(drawdown, 8),
        qualifiedTrades: dailyTrades.filter((trade) => trade.isQualified)
          .length,
      });
    }
  }

  return performances;
}

function buildIntegrityFlags(
  participants: SimulatedParticipant[],
  trades: SimulatedTrade[],
): SimulatedIntegrityFlag[] {
  const flags: SimulatedIntegrityFlag[] = [];
  const anomalyMap: Partial<
    Record<
      ParticipantArchetype,
      {
        type: IntegrityFlagType;
        severity: IntegritySeverity;
        reason: string;
      }
    >
  > = {
    VOLUME_FARMER: {
      type: "VOLUME_ANOMALY",
      severity: "MEDIUM",
      reason:
        "Synthetic volume concentration intentionally generated for testing.",
    },
    ONE_TRADE_WONDER: {
      type: "DATA_QUALITY",
      severity: "LOW",
      reason:
        "Single-trade performance outlier intentionally generated for testing.",
    },
    REPETITIVE_SIZE_TRADER: {
      type: "WASH_TRADING_HEURISTIC",
      severity: "HIGH",
      reason:
        "Repeated size pattern intentionally generated for integrity heuristic testing.",
    },
    FREQUENTLY_LIQUIDATED: {
      type: "DRAWDOWN_ANOMALY",
      severity: "HIGH",
      reason:
        "Repeated liquidation pattern intentionally generated for testing.",
    },
  };

  for (const participant of participants) {
    const anomaly = anomalyMap[participant.archetype];

    if (!anomaly) {
      continue;
    }

    const participantTrades = trades.filter(
      (trade) => trade.participantId === participant.id,
    );
    const liquidationCount = participantTrades.filter(
      (trade) => trade.exitReason === "LIQUIDATION",
    ).length;
    const status: IntegrityStatus = "OPEN";

    flags.push({
      id: `flag_${participant.id}`,
      participantId: participant.id,
      type: anomaly.type,
      severity: anomaly.severity,
      status,
      reason: anomaly.reason,
      evidence: {
        archetype: participant.archetype,
        tradeCount: participantTrades.length,
        liquidationCount,
        synthetic: true,
      },
    });
  }

  return flags;
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function stableHex(index: number) {
  return (0x9e3779b1 * (index + 1)).toString(16).padStart(12, "0").slice(-12);
}

function round(value: number, decimals: number) {
  if (!Number.isFinite(value)) {
    throw new Error("Simulation generated an invalid numeric value");
  }

  const scale = 10 ** decimals;
  return Math.round(value * scale) / scale;
}
