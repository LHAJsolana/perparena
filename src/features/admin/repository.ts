import {
  Prisma,
  type CompetitionStatus,
  type IntegrityStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { derivePublicIntegrityStatus } from "@/features/competitions/dashboard/query";
import { formatDateRange } from "@/features/competitions/dashboard/format";
import { globalDisclaimer } from "@/lib/config/app-config";

export type AdminDataResult<T> =
  { status: "ready"; data: T } | { status: "unavailable"; message: string };

export type AdminCompetitionListItem = {
  id: string;
  slug: string;
  name: string;
  status: CompetitionStatus;
  startsAt: Date;
  endsAt: Date;
  markets: string[];
  participants: number;
  scoringVersion: string;
};

export async function listAdminCompetitions(): Promise<
  AdminDataResult<AdminCompetitionListItem[]>
> {
  try {
    const competitions = await prisma.competition.findMany({
      include: {
        configuration: true,
        markets: true,
        participants: { select: { id: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    });

    return {
      data: competitions.map((competition) => ({
        endsAt: competition.endsAt,
        id: competition.id,
        markets: competition.markets.map((market) => market.symbol),
        name: competition.name,
        participants: competition.participants.length,
        scoringVersion:
          competition.configuration?.scoringVersion ?? "unconfigured",
        slug: competition.slug,
        startsAt: competition.startsAt,
        status: competition.status,
      })),
      status: "ready",
    };
  } catch {
    return unavailable();
  }
}

export async function getAdminCompetition(
  id: string,
): Promise<AdminDataResult<AdminCompetitionListItem | null>> {
  try {
    const competition = await prisma.competition.findUnique({
      include: {
        configuration: true,
        markets: true,
        participants: { select: { id: true } },
      },
      where: { id },
    });

    return {
      data: competition
        ? {
            endsAt: competition.endsAt,
            id: competition.id,
            markets: competition.markets.map((market) => market.symbol),
            name: competition.name,
            participants: competition.participants.length,
            scoringVersion:
              competition.configuration?.scoringVersion ?? "unconfigured",
            slug: competition.slug,
            startsAt: competition.startsAt,
            status: competition.status,
          }
        : null,
      status: "ready",
    };
  } catch {
    return unavailable();
  }
}

export async function listIntegrityQueue(): Promise<
  AdminDataResult<
    {
      flagId: string;
      participantId: string;
      wallet: string;
      type: string;
      severity: string;
      status: IntegrityStatus;
      reason: string;
      evidence: Record<string, unknown>;
      publicStatus: string;
    }[]
  >
> {
  try {
    const flags = await prisma.integrityFlag.findMany({
      include: {
        participant: {
          include: {
            integrityFlags: {
              select: { evidence: true, severity: true, status: true },
            },
          },
        },
      },
      orderBy: [{ status: "asc" }, { severity: "desc" }, { createdAt: "desc" }],
      take: 100,
    });

    return {
      data: flags.map((flag) => ({
        evidence: objectRecord(flag.evidence),
        flagId: flag.id,
        participantId: flag.participantId,
        publicStatus: derivePublicIntegrityStatus(
          flag.participant.integrityFlags,
        ),
        reason: flag.reason,
        severity: flag.severity,
        status: flag.status,
        type: flag.type,
        wallet: flag.participant.wallet,
      })),
      status: "ready",
    };
  } catch {
    return unavailable();
  }
}

export async function exportCompetitionResults(id: string) {
  const competition = await prisma.competition.findUnique({
    include: {
      configuration: true,
      markets: true,
      participants: {
        include: {
          integrityFlags: {
            select: { evidence: true, severity: true, status: true },
          },
          scoreBreakdowns: {
            orderBy: { calculatedAt: "desc" },
            take: 1,
          },
        },
      },
    },
    where: { id },
  });

  if (!competition) {
    return null;
  }

  const rankings = competition.participants
    .map((participant) => {
      const score = participant.scoreBreakdowns[0];
      const details = objectRecord(score?.componentDetails);

      return {
        componentScores: objectRecord(details.componentScores),
        division: participant.division,
        finalScore: score?.competitionScore.toNumber() ?? 0,
        integrityStatus: derivePublicIntegrityStatus(
          participant.integrityFlags,
        ),
        rawScore:
          (score?.competitionScore.toNumber() ?? 0) +
          (score?.integrityPenalty.toNumber() ?? 0),
        scoringVersion:
          score?.scoringVersion ??
          competition.configuration?.scoringVersion ??
          "unconfigured",
        simulatedNetPnl:
          participant.currentEquity.toNumber() -
          participant.startingEquity.toNumber(),
        wallet: participant.wallet,
      };
    })
    .sort(
      (left, right) =>
        right.finalScore - left.finalScore ||
        right.simulatedNetPnl - left.simulatedNetPnl ||
        left.wallet.localeCompare(right.wallet),
    )
    .map((row, index) => ({ rank: index + 1, ...row }));

  return {
    competition: {
      dateRange: formatDateRange(competition.startsAt, competition.endsAt),
      markets: competition.markets.map((market) => market.symbol),
      name: competition.name,
      slug: competition.slug,
      status: competition.status,
    },
    disclaimer: globalDisclaimer,
    exportedAt: new Date().toISOString(),
    rankings,
    scoringVersion: competition.configuration?.scoringVersion ?? "unconfigured",
  };
}

function unavailable(): AdminDataResult<never> {
  return {
    message:
      "The PostgreSQL database is unavailable. Admin demo data requires the approved development database.",
    status: "unavailable",
  };
}

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function adminDecimal(value: number) {
  return new Prisma.Decimal(value);
}
