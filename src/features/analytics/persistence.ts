import { Prisma, type PrismaClient } from "@prisma/client";
import { calculateParticipantAnalytics } from "@/features/analytics/calculations";
import { SIMULATION_COMPETITION } from "@/features/simulation/constants";

export type AnalyticsRecalculationSummary = {
  competitionSlug: string;
  participantsProcessed: number;
  dailyPerformanceRows: number;
  netPnlRange: { min: number; max: number };
  roiRange: { min: number | null; max: number | null };
  maximumDrawdownRange: { min: number; max: number };
  suspiciousOutputs: string[];
};

export async function recalculateCompetitionAnalytics(
  prisma: PrismaClient,
  slug: string = SIMULATION_COMPETITION.slug,
): Promise<AnalyticsRecalculationSummary> {
  const competition = await prisma.competition.findUnique({
    where: { slug },
    include: {
      participants: {
        include: {
          trades: {
            include: { market: true },
          },
        },
      },
    },
  });

  if (!competition) {
    throw new Error(`Competition ${slug} was not found.`);
  }

  const summaries: {
    netPnl: number;
    roi: number | null;
    maximumDrawdown: number;
  }[] = [];
  let dailyPerformanceRows = 0;

  await prisma.$transaction(
    async (tx) => {
      for (const participant of competition.participants) {
        const analytics = calculateParticipantAnalytics({
          startingEquity: participant.startingEquity.toNumber(),
          startsAt: competition.startsAt,
          endsAt: competition.endsAt,
          trades: participant.trades.map((trade) => ({
            id: trade.id,
            marketSymbol: trade.market.symbol,
            side: trade.side,
            openedAt: trade.openedAt,
            closedAt: trade.closedAt,
            size: trade.size.toNumber(),
            leverage: trade.leverage.toNumber(),
            simulatedVolume: trade.simulatedVolume.toNumber(),
            simulatedPnl: trade.simulatedPnl?.toNumber() ?? null,
            fees: trade.fees.toNumber(),
            exitReason: trade.exitReason,
          })),
        });

        await tx.participant.update({
          where: { id: participant.id },
          data: {
            currentEquity: decimal(analytics.currentEquity),
            maximumDrawdown: decimal(analytics.maximumDrawdown),
            qualifiedTradeCount: analytics.qualifiedTradeCount,
            simulatedVolume: decimal(
              Object.values(analytics.dailyPerformance).reduce(
                (total, day) => total + day.simulatedVolume,
                0,
              ),
            ),
          },
        });

        await tx.dailyPerformance.deleteMany({
          where: { participantId: participant.id },
        });

        if (analytics.dailyPerformance.length > 0) {
          await tx.dailyPerformance.createMany({
            data: analytics.dailyPerformance.map((day) => ({
              id: `analytics_${participant.id}_${day.day.toISOString().slice(0, 10)}`,
              participantId: participant.id,
              day: day.day,
              startingEquity: decimal(day.startingEquity),
              endingEquity: decimal(day.endingEquity),
              simulatedPnl: decimal(day.simulatedPnl),
              simulatedVolume: decimal(day.simulatedVolume),
              maximumDrawdown: decimal(day.maximumDrawdown),
              qualifiedTrades: day.qualifiedTrades,
            })),
          });
        }

        dailyPerformanceRows += analytics.dailyPerformance.length;
        summaries.push({
          netPnl: analytics.netPnl,
          roi: analytics.roi,
          maximumDrawdown: analytics.maximumDrawdown,
        });
      }
    },
    { timeout: 30000 },
  );

  const roiValues = summaries
    .map((summary) => summary.roi)
    .filter((value): value is number => value !== null);

  return {
    competitionSlug: slug,
    participantsProcessed: competition.participants.length,
    dailyPerformanceRows,
    netPnlRange: range(summaries.map((summary) => summary.netPnl)),
    roiRange: nullableRange(roiValues),
    maximumDrawdownRange: range(
      summaries.map((summary) => summary.maximumDrawdown),
    ),
    suspiciousOutputs: summaries.some((summary) =>
      [summary.netPnl, summary.roi ?? 0, summary.maximumDrawdown].some(
        (value) => !Number.isFinite(value),
      ),
    )
      ? ["Non-finite analytics output detected"]
      : [],
  };
}

function decimal(value: number) {
  return new Prisma.Decimal(value);
}

function range(values: readonly number[]) {
  return {
    min: values.length ? Math.min(...values) : 0,
    max: values.length ? Math.max(...values) : 0,
  };
}

function nullableRange(values: readonly number[]) {
  return {
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
  };
}
