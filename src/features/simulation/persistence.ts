import { Prisma, type PrismaClient } from "@prisma/client";
import { SIMULATION_COMPETITION } from "@/features/simulation/constants";
import {
  generateSimulation,
  summarizeSimulation,
} from "@/features/simulation/generator";
import type { SimulationSummary } from "@/features/simulation/types";

export async function seedSimulation(
  prisma: PrismaClient,
  options: { resetExisting?: boolean } = {},
): Promise<SimulationSummary> {
  const dataset = generateSimulation();
  const resetExisting = options.resetExisting ?? true;

  return prisma.$transaction(
    async (tx) => {
      if (resetExisting) {
        await tx.competition.deleteMany({
          where: { slug: SIMULATION_COMPETITION.slug },
        });
      } else {
        const existing = await tx.competition.findUnique({
          select: { id: true },
          where: { slug: SIMULATION_COMPETITION.slug },
        });

        if (existing) {
          throw new Error(
            "Seed competition already exists; production seed refuses to overwrite data.",
          );
        }
      }

      await tx.competition.create({
        data: {
          id: dataset.competition.id,
          slug: dataset.competition.slug,
          name: dataset.competition.name,
          description:
            "Synthetic seven-day simulated perpetual futures competition fixture.",
          status: "COMPLETED",
          startsAt: dataset.competition.startsAt,
          endsAt: dataset.competition.endsAt,
        },
      });

      await tx.competitionConfiguration.create({
        data: {
          id: "configuration_solana_perps_league_season_01",
          competitionId: dataset.competition.id,
          startingEquity: "10000",
          maxLeverage: "50",
          minimumQualifiedTrades: 5,
          minimumSimulatedVolume: "5000",
          scoringVersion: "phase-4-fixture-no-scoring",
          riskWeight: "0.300000",
          consistencyWeight: "0.250000",
          pnlWeight: "0.250000",
          volumeWeight: "0.100000",
          integrityPenaltyWeight: "0.100000",
          scoreComponentCaps: {
            note: "Caps documented for future scoring phases; no score engine in Phase 4.",
          },
        },
      });

      await tx.competitionMarket.createMany({
        data: dataset.markets.map((market) => ({
          id: market.id,
          competitionId: dataset.competition.id,
          symbol: market.symbol,
          displayName: market.displayName,
        })),
      });

      await tx.participant.createMany({
        data: dataset.participants.map((participant) => ({
          id: participant.id,
          competitionId: dataset.competition.id,
          wallet: participant.wallet,
          displayName: participant.displayName,
          division: participant.division,
          archetype: participant.archetype,
          startingEquity: decimal(participant.startingEquity),
          currentEquity: decimal(participant.currentEquity),
          maximumDrawdown: decimal(participant.maximumDrawdown),
          qualifiedTradeCount: participant.qualifiedTradeCount,
          simulatedVolume: decimal(participant.simulatedVolume),
        })),
      });

      await tx.trade.createMany({
        data: dataset.trades.map((trade) => ({
          id: trade.id,
          participantId: trade.participantId,
          competitionMarketId: trade.competitionMarketId,
          side: trade.side,
          openedAt: trade.openedAt,
          closedAt: trade.closedAt,
          entryPrice: decimal(trade.entryPrice),
          exitPrice: decimal(trade.exitPrice),
          size: decimal(trade.size),
          leverage: decimal(trade.leverage),
          simulatedVolume: decimal(trade.simulatedVolume),
          simulatedPnl: decimal(trade.simulatedPnl),
          fees: decimal(trade.fees),
          isQualified: trade.isQualified,
          exitReason: trade.exitReason,
        })),
      });

      await tx.dailyPerformance.createMany({
        data: dataset.dailyPerformances.map((performance) => ({
          id: performance.id,
          participantId: performance.participantId,
          day: performance.day,
          startingEquity: decimal(performance.startingEquity),
          endingEquity: decimal(performance.endingEquity),
          simulatedPnl: decimal(performance.simulatedPnl),
          simulatedVolume: decimal(performance.simulatedVolume),
          maximumDrawdown: decimal(performance.maximumDrawdown),
          qualifiedTrades: performance.qualifiedTrades,
        })),
      });

      await tx.integrityFlag.createMany({
        data: dataset.integrityFlags.map((flag) => ({
          id: flag.id,
          participantId: flag.participantId,
          type: flag.type,
          severity: flag.severity,
          status: flag.status,
          reason: flag.reason,
          evidence: flag.evidence,
        })),
      });

      return summarizeSimulation(dataset);
    },
    {
      timeout: 30000,
    },
  );
}

function decimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value);
}
