import {
  CompetitionStatus,
  Division,
  IntegritySeverity,
  IntegrityStatus,
  MarketSymbol,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { SCORING_VERSION } from "@/features/scoring/config";
import {
  derivePublicIntegrityStatus,
  type LeaderboardQuery,
  type PublicIntegrityStatus,
} from "@/features/competitions/dashboard/query";

type CompetitionRecord = NonNullable<
  Awaited<ReturnType<typeof fetchCompetitionRecord>>
>;

export type DashboardDataResult<T> =
  { status: "ready"; data: T } | { status: "unavailable"; message: string };

export type CompetitionSummary = {
  id: string;
  slug: string;
  name: string;
  status: CompetitionStatus;
  startsAt: Date;
  endsAt: Date;
  markets: MarketSymbol[];
  participantCount: number;
  simulatedVolume: number;
  qualifiedTradeCount: number;
  scoringVersion: string;
};

export type LeaderboardRow = {
  id: string;
  rank: number;
  wallet: string;
  score: number;
  simulatedNetPnl: number;
  roi: number | null;
  maximumDrawdown: number;
  winRate: number | null;
  activeDays: number;
  liquidations: number;
  division: Division;
  integrityStatus: PublicIntegrityStatus;
  markets: MarketSymbol[];
};

export type CompetitionDashboard = CompetitionSummary & {
  leaderboard: {
    rows: LeaderboardRow[];
    totalRows: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  topThree: LeaderboardRow[];
  divisions: { division: Division; participants: number }[];
  questPreview: {
    completedCount: number;
    description: string;
    engagementPoints: number;
    status: string;
    target: number;
    title: string;
    type: string;
    version: string;
  }[];
};

export async function getHomepageDashboardData(): Promise<
  DashboardDataResult<CompetitionDashboard>
> {
  try {
    const competition = await fetchPrimaryCompetition();

    if (!competition) {
      return {
        status: "unavailable",
        message: "No synthetic competition has been seeded yet.",
      };
    }

    return {
      status: "ready",
      data: buildCompetitionDashboard(competition, {
        direction: "desc",
        page: 1,
        pageSize: 10,
        search: "",
        sort: "score",
      }),
    };
  } catch {
    return databaseUnavailable();
  }
}

export async function listCompetitionSummaries(): Promise<
  DashboardDataResult<CompetitionSummary[]>
> {
  try {
    const competitions = await prisma.competition.findMany({
      include: {
        configuration: true,
        markets: true,
        participants: {
          select: {
            qualifiedTradeCount: true,
            simulatedVolume: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { startsAt: "desc" }, { id: "asc" }],
    });

    return {
      status: "ready",
      data: competitions.map((competition) => ({
        id: competition.id,
        slug: competition.slug,
        name: competition.name,
        status: competition.status,
        startsAt: competition.startsAt,
        endsAt: competition.endsAt,
        markets: competition.markets
          .filter((market) => market.enabled)
          .map((market) => market.symbol)
          .sort(),
        participantCount: competition.participants.length,
        simulatedVolume: sumDecimals(
          competition.participants.map(
            (participant) => participant.simulatedVolume,
          ),
        ),
        qualifiedTradeCount: competition.participants.reduce(
          (total, participant) => total + participant.qualifiedTradeCount,
          0,
        ),
        scoringVersion:
          competition.configuration?.scoringVersion ?? SCORING_VERSION,
      })),
    };
  } catch {
    return databaseUnavailable();
  }
}

export async function getCompetitionDashboardData(
  slug: string,
  query: LeaderboardQuery,
): Promise<DashboardDataResult<CompetitionDashboard | null>> {
  try {
    const competition = await fetchCompetitionRecord(slug);

    if (!competition) {
      return { status: "ready", data: null };
    }

    return {
      status: "ready",
      data: buildCompetitionDashboard(competition, query),
    };
  } catch {
    return databaseUnavailable();
  }
}

function fetchPrimaryCompetition() {
  return prisma.competition.findFirst({
    include: competitionInclude,
    orderBy: [{ status: "asc" }, { startsAt: "desc" }, { id: "asc" }],
    where: {
      status: { in: ["ACTIVE", "SCHEDULED", "FINALIZING", "COMPLETED"] },
    },
  });
}

function fetchCompetitionRecord(slug: string) {
  return prisma.competition.findUnique({
    include: competitionInclude,
    where: { slug },
  });
}

const competitionInclude = {
  configuration: true,
  markets: true,
  participants: {
    include: {
      dailyPerformances: true,
      integrityFlags: {
        select: {
          evidence: true,
          severity: true,
          status: true,
        },
      },
      scoreBreakdowns: {
        orderBy: { calculatedAt: "desc" },
        take: 1,
      },
      trades: {
        include: { market: true },
      },
    },
  },
  quests: {
    include: {
      progress: true,
    },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.CompetitionInclude;

function buildCompetitionDashboard(
  competition: CompetitionRecord,
  query: LeaderboardQuery,
): CompetitionDashboard {
  const allRows = rankRows(
    competition.participants.map((participant) => {
      const latestScore = participant.scoreBreakdowns[0];
      const startingEquity = participant.startingEquity.toNumber();
      const currentEquity = participant.currentEquity.toNumber();
      const simulatedNetPnl = currentEquity - startingEquity;
      const closedTrades = participant.trades.filter((trade) => trade.closedAt);
      const wins = closedTrades.filter(
        (trade) => (trade.simulatedPnl?.toNumber() ?? 0) > 0,
      ).length;
      const liquidations = closedTrades.filter(
        (trade) => trade.exitReason === "LIQUIDATION",
      ).length;
      const markets = Array.from(
        new Set(participant.trades.map((trade) => trade.market.symbol)),
      ).sort();

      return {
        id: participant.id,
        rank: 0,
        wallet: participant.wallet,
        score: latestScore?.competitionScore.toNumber() ?? 0,
        simulatedNetPnl,
        roi: startingEquity === 0 ? null : simulatedNetPnl / startingEquity,
        maximumDrawdown: participant.maximumDrawdown.toNumber(),
        winRate: closedTrades.length === 0 ? null : wins / closedTrades.length,
        activeDays: participant.dailyPerformances.length,
        liquidations,
        division: participant.division,
        integrityStatus: derivePublicIntegrityStatus(
          participant.integrityFlags.map((flag) => ({
            evidence: flag.evidence,
            severity: flag.severity as IntegritySeverity,
            status: flag.status as IntegrityStatus,
          })),
        ),
        markets,
      };
    }),
  );

  const filteredRows = sortRows(
    allRows.filter((row) => matchesQuery(row, query)),
    query,
  ).map((row, index) => ({ ...row, rank: index + 1 }));
  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / query.pageSize),
  );
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * query.pageSize;

  return {
    id: competition.id,
    slug: competition.slug,
    name: competition.name,
    status: competition.status,
    startsAt: competition.startsAt,
    endsAt: competition.endsAt,
    markets: competition.markets
      .filter((market) => market.enabled)
      .map((market) => market.symbol)
      .sort(),
    participantCount: competition.participants.length,
    simulatedVolume: sumDecimals(
      competition.participants.map(
        (participant) => participant.simulatedVolume,
      ),
    ),
    qualifiedTradeCount: competition.participants.reduce(
      (total, participant) => total + participant.qualifiedTradeCount,
      0,
    ),
    scoringVersion:
      competition.configuration?.scoringVersion ?? SCORING_VERSION,
    leaderboard: {
      rows: filteredRows.slice(start, start + query.pageSize),
      totalRows: filteredRows.length,
      page,
      pageSize: query.pageSize,
      totalPages,
    },
    topThree: allRows.slice(0, 3),
    divisions: Object.values(Division).map((division) => ({
      division,
      participants: competition.participants.filter(
        (participant) => participant.division === division,
      ).length,
    })),
    questPreview: competition.quests.slice(0, 5).map((quest) => {
      const requirements = objectRecord(quest.requirements);

      return {
        completedCount: quest.progress.filter(
          (progress) => progress.status === "COMPLETED",
        ).length,
        description: quest.description,
        engagementPoints: numberFrom(requirements.engagementPoints),
        status: quest.status,
        target: numberFrom(requirements.target),
        title: quest.title,
        type: quest.type,
        version: String(requirements.version ?? "unversioned"),
      };
    }),
  };
}

function matchesQuery(row: LeaderboardRow, query: LeaderboardQuery) {
  const walletMatches =
    query.search.length === 0 ||
    row.wallet.toLowerCase().includes(query.search.toLowerCase());

  return (
    walletMatches &&
    (!query.division || row.division === query.division) &&
    (!query.market || row.markets.includes(query.market)) &&
    (!query.integrity || row.integrityStatus === query.integrity)
  );
}

function sortRows(rows: readonly LeaderboardRow[], query: LeaderboardQuery) {
  const direction = query.direction === "asc" ? 1 : -1;

  return [...rows].sort((left, right) => {
    const primary =
      metricForSort(left, query.sort) - metricForSort(right, query.sort);

    if (primary !== 0) {
      return primary * direction;
    }

    return stableLeaderboardCompare(left, right);
  });
}

function rankRows(rows: readonly LeaderboardRow[]) {
  return [...rows]
    .sort(stableLeaderboardCompare)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function stableLeaderboardCompare(left: LeaderboardRow, right: LeaderboardRow) {
  return (
    right.score - left.score ||
    left.maximumDrawdown - right.maximumDrawdown ||
    right.simulatedNetPnl - left.simulatedNetPnl ||
    left.wallet.localeCompare(right.wallet) ||
    left.id.localeCompare(right.id)
  );
}

function metricForSort(row: LeaderboardRow, sort: LeaderboardQuery["sort"]) {
  switch (sort) {
    case "activeDays":
      return row.activeDays;
    case "liquidations":
      return row.liquidations;
    case "maximumDrawdown":
      return row.maximumDrawdown;
    case "netPnl":
      return row.simulatedNetPnl;
    case "roi":
      return row.roi ?? Number.NEGATIVE_INFINITY;
    case "winRate":
      return row.winRate ?? Number.NEGATIVE_INFINITY;
    case "score":
      return row.score;
  }
}

function sumDecimals(values: readonly Prisma.Decimal[]) {
  return values.reduce((total, value) => total + value.toNumber(), 0);
}

function databaseUnavailable(): DashboardDataResult<never> {
  return {
    status: "unavailable",
    message:
      "The PostgreSQL database is unavailable. Start the approved development database and run the seed, analytics, scoring, and integrity recalculation scripts.",
  };
}

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function numberFrom(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
