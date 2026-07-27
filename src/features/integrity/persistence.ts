import type { IntegrityStatus, PrismaClient } from "@prisma/client";
import { calculateParticipantAnalytics } from "@/features/analytics/calculations";
import { assessParticipantIntegrity } from "@/features/integrity/engine";
import type { IntegrityAssessment } from "@/features/integrity/types";
import { SIMULATION_COMPETITION } from "@/features/simulation/constants";

export type IntegrityAnalysisSummary = {
  competitionSlug: string;
  participantsProcessed: number;
  countsByFlagType: Record<string, number>;
  countsBySeverity: Record<string, number>;
  countsByStatus: Record<string, number>;
  countsByArchetype: Record<string, number>;
  countsByScoreImpact: Record<string, number>;
};

export async function recalculateCompetitionIntegrity(
  prisma: PrismaClient,
  slug: string = SIMULATION_COMPETITION.slug,
): Promise<IntegrityAnalysisSummary> {
  const competition = await prisma.competition.findUnique({
    where: { slug },
    include: {
      participants: {
        include: { trades: { include: { market: true } } },
      },
    },
  });

  if (!competition) {
    throw new Error(`Competition ${slug} was not found.`);
  }

  const assessments = competition.participants.map((participant) => {
    const trades = participant.trades.map((trade) => ({
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
    }));

    return assessParticipantIntegrity({
      participantId: participant.id,
      archetype: participant.archetype,
      startsAt: competition.startsAt,
      endsAt: competition.endsAt,
      trades,
      analytics: calculateParticipantAnalytics({
        startingEquity: participant.startingEquity.toNumber(),
        startsAt: competition.startsAt,
        endsAt: competition.endsAt,
        trades,
      }),
    });
  });

  await prisma.$transaction(
    async (tx) => {
      await tx.integrityFlag.deleteMany({
        where: {
          participantId: {
            in: competition.participants.map((item) => item.id),
          },
        },
      });

      for (const assessment of assessments) {
        if (assessment.flags.length === 0) {
          continue;
        }

        await tx.integrityFlag.createMany({
          data: assessment.flags.map((flag) => ({
            id: flag.id,
            participantId: flag.participantId,
            type: flag.type,
            severity: flag.severity,
            status: flag.reviewStatus,
            reason: flag.explanation,
            evidence: {
              ...flag.evidence,
              observedValue: flag.observedValue,
              threshold: flag.threshold,
              detectedAt: flag.detectedAt.toISOString(),
              affectsScoring: flag.affectsScoring,
              impact: flag.impact,
            },
          })),
        });
      }
    },
    { timeout: 30000 },
  );

  return summarizeIntegrityAssessments(assessments, slug);
}

export async function updateIntegrityFlagStatus(
  prisma: PrismaClient,
  flagId: string,
  status: IntegrityStatus,
) {
  return prisma.integrityFlag.update({
    where: { id: flagId },
    data: { status, reviewedAt: new Date() },
  });
}

export function summarizeIntegrityAssessments(
  assessments: readonly IntegrityAssessment[],
  competitionSlug: string = SIMULATION_COMPETITION.slug,
): IntegrityAnalysisSummary {
  return {
    competitionSlug,
    participantsProcessed: assessments.length,
    countsByFlagType: count(
      assessments.flatMap((item) => item.flags.map((flag) => flag.type)),
    ),
    countsBySeverity: count(
      assessments.flatMap((item) => item.flags.map((flag) => flag.severity)),
    ),
    countsByStatus: count(assessments.map((item) => item.status)),
    countsByArchetype: count(
      assessments.map((item) => item.archetype ?? "UNKNOWN"),
    ),
    countsByScoreImpact: count(
      assessments.flatMap((item) =>
        item.flags.map((flag) =>
          flag.affectsScoring ? "score_adjusting" : flag.impact,
        ),
      ),
    ),
  };
}

function count(values: readonly string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}
