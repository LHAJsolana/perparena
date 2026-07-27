import { Prisma, type PrismaClient, QuestStatus } from "@prisma/client";
import { calculateParticipantAnalytics } from "@/features/analytics/calculations";
import {
  achievementDefinitions,
  engagementQuestDefinitions,
  evaluateEngagement,
} from "@/features/engagement/engine";
import { ENGAGEMENT_VERSION } from "@/features/engagement/types";
import { SIMULATION_COMPETITION } from "@/features/simulation/constants";

export type EngagementRecalculationSummary = {
  competitionSlug: string;
  participantsProcessed: number;
  questsUpserted: number;
  questProgressRows: number;
  completedQuestRows: number;
  streakRows: number;
  achievementsUpserted: number;
  participantAchievements: number;
};

export async function recalculateCompetitionEngagement(
  prisma: PrismaClient,
  slug: string = SIMULATION_COMPETITION.slug,
): Promise<EngagementRecalculationSummary> {
  const competition = await prisma.competition.findUnique({
    include: {
      markets: true,
      participants: {
        include: {
          trades: { include: { market: true } },
        },
      },
    },
    where: { slug },
  });

  if (!competition) {
    throw new Error(`Competition ${slug} was not found.`);
  }

  let questProgressRows = 0;
  let completedQuestRows = 0;
  let streakRows = 0;
  let participantAchievements = 0;

  await prisma.$transaction(
    async (tx) => {
      for (const definition of engagementQuestDefinitions) {
        await tx.quest.upsert({
          create: {
            competitionId: competition.id,
            description: definition.description,
            endsAt: competition.endsAt,
            id: questId(competition.id, definition.slug),
            requirements: questRequirements(definition),
            slug: definition.slug,
            startsAt: competition.startsAt,
            status: QuestStatus.ACTIVE,
            title: definition.name,
            type: definition.type,
          },
          update: {
            description: definition.description,
            endsAt: competition.endsAt,
            requirements: questRequirements(definition),
            startsAt: competition.startsAt,
            status: QuestStatus.ACTIVE,
            title: definition.name,
            type: definition.type,
          },
          where: {
            competitionId_slug: {
              competitionId: competition.id,
              slug: definition.slug,
            },
          },
        });
      }

      for (const definition of achievementDefinitions) {
        await tx.achievement.upsert({
          create: {
            criteria: {
              criteria: definition.criteria,
              version: definition.version,
            },
            description: definition.description,
            id: achievementId(definition.slug),
            slug: definition.slug,
            title: definition.title,
            type: definition.type,
          },
          update: {
            criteria: {
              criteria: definition.criteria,
              version: definition.version,
            },
            description: definition.description,
            title: definition.title,
            type: definition.type,
          },
          where: { slug: definition.slug },
        });
      }
    },
    { timeout: 30000 },
  );

  for (const participant of competition.participants) {
    const trades = participant.trades.map((trade) => ({
      closedAt: trade.closedAt,
      exitReason: trade.exitReason,
      fees: trade.fees.toNumber(),
      id: trade.id,
      leverage: trade.leverage.toNumber(),
      marketSymbol: trade.market.symbol,
      openedAt: trade.openedAt,
      side: trade.side,
      simulatedPnl: trade.simulatedPnl?.toNumber() ?? null,
      simulatedVolume: trade.simulatedVolume.toNumber(),
      size: trade.size.toNumber(),
    }));
    const analytics = calculateParticipantAnalytics({
      endsAt: competition.endsAt,
      startingEquity: participant.startingEquity.toNumber(),
      startsAt: competition.startsAt,
      trades,
    });
    const evaluation = evaluateEngagement({
      analytics,
      competitionEndsAt: competition.endsAt,
      competitionStartsAt: competition.startsAt,
      supportedMarkets: competition.markets
        .filter((market) => market.enabled)
        .map((market) => market.symbol),
      trades,
    });

    await prisma.$transaction(
      async (tx) => {
        for (const quest of evaluation.quests) {
          const definition = engagementQuestDefinitions.find(
            (item) => item.slug === quest.slug,
          )!;

          await tx.questProgress.upsert({
            create: {
              completedAt: quest.completedAt,
              id: questProgressId(participant.id, quest.slug),
              participantId: participant.id,
              progressValue: decimal(quest.progress),
              questId: questId(competition.id, quest.slug),
              status: quest.completed
                ? QuestStatus.COMPLETED
                : QuestStatus.ACTIVE,
            },
            update: {
              completedAt: quest.completedAt,
              progressValue: decimal(quest.progress),
              status: quest.completed
                ? QuestStatus.COMPLETED
                : QuestStatus.ACTIVE,
            },
            where: {
              questId_participantId: {
                participantId: participant.id,
                questId: questId(competition.id, definition.slug),
              },
            },
          });
        }

        for (const streak of evaluation.streaks) {
          await tx.streak.upsert({
            create: {
              bestCount: streak.bestCount,
              currentCount: streak.currentCount,
              id: streakId(participant.id, streak.slug),
              lastCountedAt: streak.lastCountedAt,
              participantId: participant.id,
              type: streak.type,
            },
            update: {
              bestCount: streak.bestCount,
              currentCount: streak.currentCount,
              lastCountedAt: streak.lastCountedAt,
              type: streak.type,
            },
            where: {
              participantId_type: {
                participantId: participant.id,
                type: streak.type,
              },
            },
          });
        }

        for (const achievement of evaluation.achievements) {
          if (!achievement.earned || !achievement.awardedAt) {
            continue;
          }

          await tx.participantAchievement.upsert({
            create: {
              achievementId: achievementId(achievement.slug),
              awardedAt: achievement.awardedAt,
              id: participantAchievementId(participant.id, achievement.slug),
              metadata: {
                explanation: achievement.explanation,
                version: ENGAGEMENT_VERSION,
              },
              participantId: participant.id,
            },
            update: {
              awardedAt: achievement.awardedAt,
              metadata: {
                explanation: achievement.explanation,
                version: ENGAGEMENT_VERSION,
              },
            },
            where: {
              participantId_achievementId: {
                achievementId: achievementId(achievement.slug),
                participantId: participant.id,
              },
            },
          });
        }
      },
      { timeout: 30000 },
    );

    questProgressRows += evaluation.quests.length;
    completedQuestRows += evaluation.quests.filter(
      (quest) => quest.completed,
    ).length;
    streakRows += evaluation.streaks.length;
    participantAchievements += evaluation.achievements.filter(
      (achievement) => achievement.earned && achievement.awardedAt,
    ).length;
  }

  return {
    achievementsUpserted: achievementDefinitions.length,
    completedQuestRows,
    competitionSlug: slug,
    participantAchievements,
    participantsProcessed: competition.participants.length,
    questProgressRows,
    questsUpserted: engagementQuestDefinitions.length,
    streakRows,
  };
}

function questRequirements(
  definition: (typeof engagementQuestDefinitions)[number],
): Prisma.InputJsonObject {
  return {
    badge: definition.badge ?? null,
    cadence: definition.cadence,
    eligibilityRules: definition.eligibilityRules,
    engagementPoints: definition.engagementPoints ?? 0,
    scoreRelationship:
      "Engagement points are separate from the 100-point competition score.",
    target: definition.target,
    version: definition.version,
  };
}

function questId(competitionId: string, slug: string) {
  return `quest_${competitionId}_${slug}`;
}

function questProgressId(participantId: string, slug: string) {
  return `quest_progress_${participantId}_${slug}`;
}

function streakId(participantId: string, slug: string) {
  return `streak_${participantId}_${slug}`;
}

function achievementId(slug: string) {
  return `achievement_${slug}`;
}

function participantAchievementId(participantId: string, slug: string) {
  return `participant_achievement_${participantId}_${slug}`;
}

function decimal(value: number) {
  return new Prisma.Decimal(value);
}
