import { CompetitionStatus, QuestStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  adminDecimal,
  exportCompetitionResults,
  getAdminCompetition,
  listAdminCompetitions,
  listIntegrityQueue,
} from "@/features/admin/repository";
import type {
  DraftCompetitionInput,
  IntegrityReviewInput,
  StatusChangeInput,
} from "@/features/admin/validation";

export function listAdminCompetitionsService() {
  return listAdminCompetitions();
}

export function getAdminCompetitionService(id: string) {
  return getAdminCompetition(id);
}

export function listIntegrityQueueService() {
  return listIntegrityQueue();
}

export function exportCompetitionResultsService(id: string) {
  return exportCompetitionResults(id);
}

export async function createDraftCompetitionService(
  input: DraftCompetitionInput,
) {
  await prisma.$transaction(async (tx) => {
    const competition = await tx.competition.create({
      data: {
        description: input.description,
        endsAt: input.endsAt,
        name: input.name,
        slug: input.slug,
        startsAt: input.startsAt,
        status: CompetitionStatus.DRAFT,
      },
    });

    await tx.competitionConfiguration.create({
      data: {
        competitionId: competition.id,
        consistencyWeight: adminDecimal(input.weights.consistency / 100),
        integrityPenaltyWeight: adminDecimal(0),
        maxLeverage: adminDecimal(50),
        minimumQualifiedTrades: 0,
        minimumSimulatedVolume: adminDecimal(0),
        pnlWeight: adminDecimal(input.weights.performance / 100),
        riskWeight: adminDecimal(input.weights.riskManagement / 100),
        scoreComponentCaps: {
          marketDiversity: input.weights.marketDiversity,
          note: "Draft configuration. Historical snapshots are not mutated.",
          performance: input.weights.performance,
          qualifiedActivity: input.weights.qualifiedActivity,
        },
        scoringVersion: input.weights.scoringVersion,
        startingEquity: adminDecimal(10000),
        volumeWeight: adminDecimal(input.weights.qualifiedActivity / 100),
      },
    });

    await tx.competitionMarket.createMany({
      data: input.markets.map((market) => ({
        competitionId: competition.id,
        displayName: market.replace("_", "-"),
        symbol: market,
      })),
    });

    if (input.questTitles.length > 0) {
      await tx.quest.createMany({
        data: input.questTitles.map((title, index) => ({
          competitionId: competition.id,
          description: "Draft non-financial engagement quest.",
          endsAt: input.endsAt,
          requirements: {
            scoreRelationship:
              "Quest progress does not alter the 100-point competition score.",
            version: "admin-draft-v1",
          },
          slug: `draft-quest-${index + 1}`,
          startsAt: input.startsAt,
          status: QuestStatus.ACTIVE,
          title,
          type: "PARTICIPATION",
        })),
      });
    }
  });
}

export async function changeCompetitionStatusService(
  competitionId: string,
  input: StatusChangeInput,
) {
  const competition = await prisma.competition.findUnique({
    select: { id: true },
    where: { id: competitionId },
  });

  if (!competition) {
    throw new Error("Competition was not found.");
  }

  await prisma.competition.update({
    data: { status: input.status },
    where: { id: competitionId },
  });
}

export async function getCompetitionDatesForStatusService(
  competitionId: string,
) {
  return prisma.competition.findUnique({
    select: { endsAt: true, startsAt: true },
    where: { id: competitionId },
  });
}

export async function reviewIntegrityFlagService(input: IntegrityReviewInput) {
  const existing = await prisma.integrityFlag.findUnique({
    select: { evidence: true },
    where: { id: input.flagId },
  });

  if (!existing) {
    throw new Error("Integrity flag was not found.");
  }

  await prisma.integrityFlag.update({
    data: {
      evidence: {
        ...objectRecord(existing.evidence),
        reviewNote: input.note ?? "",
      },
      reviewedAt: new Date(),
      status: input.status,
    },
    where: { id: input.flagId },
  });
}

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
