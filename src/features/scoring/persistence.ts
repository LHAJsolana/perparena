import { Prisma, type PrismaClient } from "@prisma/client";
import { calculateParticipantAnalytics } from "@/features/analytics/calculations";
import { SIMULATION_COMPETITION } from "@/features/simulation/constants";
import { SCORING_VERSION } from "@/features/scoring/config";
import {
  rankParticipantScores,
  scoreCompetitionParticipants,
} from "@/features/scoring/model";
import type { ParticipantScore } from "@/features/scoring/types";

export type ScoreRecalculationSummary = {
  competitionSlug: string;
  participantsProcessed: number;
  minimumScore: number;
  maximumScore: number;
  medianScore: number;
  componentDistributions: Record<
    string,
    { min: number; max: number; median: number }
  >;
  topTenSyntheticArchetypes: string[];
  dominatedBySingleArchetype: boolean;
};

export async function recalculateCompetitionScores(
  prisma: PrismaClient,
  slug: string = SIMULATION_COMPETITION.slug,
): Promise<ScoreRecalculationSummary> {
  const competition = await prisma.competition.findUnique({
    where: { slug },
    include: {
      participants: {
        include: {
          trades: { include: { market: true } },
        },
      },
    },
  });

  if (!competition) {
    throw new Error(`Competition ${slug} was not found.`);
  }

  const scoreInputs = competition.participants.map((participant) => {
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

    return {
      participantId: participant.id,
      archetype: participant.archetype,
      analytics,
      firstQualifiedAt:
        participant.trades
          .filter((trade) => trade.isQualified)
          .sort(
            (left, right) =>
              left.closedAt!.getTime() - right.closedAt!.getTime(),
          )[0]?.closedAt ?? null,
    };
  });
  const scores = scoreCompetitionParticipants(scoreInputs);

  await prisma.$transaction(async (tx) => {
    await tx.scoreBreakdown.deleteMany({
      where: {
        participantId: {
          in: competition.participants.map((participant) => participant.id),
        },
        scoringVersion: SCORING_VERSION,
      },
    });

    await tx.scoreBreakdown.createMany({
      data: scores.map((score) => ({
        id: `score_${SCORING_VERSION}_${score.participantId}`,
        participantId: score.participantId,
        scoringVersion: SCORING_VERSION,
        competitionScore: decimal(score.finalTotal),
        pnlComponent: decimal(score.components.performance.score),
        riskComponent: decimal(score.components.riskManagement.score),
        consistencyComponent: decimal(score.components.consistency.score),
        volumeComponent: decimal(score.components.qualifiedActivity.score),
        integrityPenalty: decimal(score.rawTotal - score.finalTotal),
        componentDetails: scoreToJson(score),
      })),
    });
  });

  return summarizeScores(scores);
}

export function summarizeScores(
  scores: readonly ParticipantScore[],
): ScoreRecalculationSummary {
  const ranked = rankParticipantScores(scores);
  const topTen = ranked.slice(0, 10);
  const archetypeCounts = topTen.reduce<Record<string, number>>(
    (counts, score) => {
      const archetype = score.archetype ?? "UNKNOWN";
      counts[archetype] = (counts[archetype] ?? 0) + 1;
      return counts;
    },
    {},
  );

  return {
    competitionSlug: SIMULATION_COMPETITION.slug,
    participantsProcessed: scores.length,
    minimumScore: min(scores.map((score) => score.finalTotal)),
    maximumScore: max(scores.map((score) => score.finalTotal)),
    medianScore: median(scores.map((score) => score.finalTotal)),
    componentDistributions: {
      performance: distribution(
        scores.map((score) => score.components.performance.score),
      ),
      riskManagement: distribution(
        scores.map((score) => score.components.riskManagement.score),
      ),
      consistency: distribution(
        scores.map((score) => score.components.consistency.score),
      ),
      qualifiedActivity: distribution(
        scores.map((score) => score.components.qualifiedActivity.score),
      ),
      marketDiversity: distribution(
        scores.map((score) => score.components.marketDiversity.score),
      ),
    },
    topTenSyntheticArchetypes: topTen.map(
      (score) => score.archetype ?? "UNKNOWN",
    ),
    dominatedBySingleArchetype:
      Math.max(0, ...Object.values(archetypeCounts)) >= 6,
  };
}

function scoreToJson(score: ParticipantScore): Prisma.InputJsonObject {
  return {
    rawMetricInputs: {
      netPnl: score.rawMetricInputs.netPnl,
      roi: score.rawMetricInputs.roi,
      maximumDrawdown: score.rawMetricInputs.maximumDrawdown,
      profitFactor: score.rawMetricInputs.profitFactor,
      qualifiedTradeCount: score.rawMetricInputs.qualifiedTradeCount,
      marketAllocation: score.rawMetricInputs.marketAllocation,
    },
    normalizedValues: Object.fromEntries(
      Object.entries(score.components).map(([key, component]) => [
        key,
        component.normalized,
      ]),
    ),
    componentScores: Object.fromEntries(
      Object.entries(score.components).map(([key, component]) => [
        key,
        component.score,
      ]),
    ),
    componentCaps: Object.fromEntries(
      Object.entries(score.components).map(([key, component]) => [
        key,
        component.max,
      ]),
    ),
    penalties: score.penalties,
    rawTotal: score.rawTotal,
    integrityAdjustment: score.integrityAdjustment,
    finalTotal: score.finalTotal,
    explanations: score.explanations,
  };
}

function decimal(value: number) {
  return new Prisma.Decimal(value);
}

function distribution(values: readonly number[]) {
  return { min: min(values), max: max(values), median: median(values) };
}

function min(values: readonly number[]) {
  return values.length ? Math.min(...values) : 0;
}

function max(values: readonly number[]) {
  return values.length ? Math.max(...values) : 0;
}

function median(values: readonly number[]) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
    : (sorted[middle] ?? 0);
}
