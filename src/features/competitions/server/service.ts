import type { LeaderboardQuery } from "@/features/competitions/dashboard/query";
import {
  getCompetitionDashboardData,
  getHomepageDashboardData,
  listCompetitionSummaries,
  type CompetitionDashboard,
  type CompetitionSummary,
  type DashboardDataResult,
} from "@/features/competitions/dashboard/repository";

export function getHomepageCompetitionService(): Promise<
  DashboardDataResult<CompetitionDashboard>
> {
  return getHomepageDashboardData();
}

export function listCompetitionsService(): Promise<
  DashboardDataResult<CompetitionSummary[]>
> {
  return listCompetitionSummaries();
}

export function getCompetitionService(
  slug: string,
  query: LeaderboardQuery,
): Promise<DashboardDataResult<CompetitionDashboard | null>> {
  return getCompetitionDashboardData(slug, query);
}

export async function getLeaderboardService(
  slug: string,
  query: LeaderboardQuery,
) {
  const result = await getCompetitionService(slug, query);

  if (result.status !== "ready" || !result.data) {
    return result;
  }

  return {
    data: {
      competition: {
        endsAt: result.data.endsAt,
        markets: result.data.markets,
        name: result.data.name,
        scoringVersion: result.data.scoringVersion,
        slug: result.data.slug,
        startsAt: result.data.startsAt,
        status: result.data.status,
      },
      leaderboard: result.data.leaderboard,
    },
    status: "ready" as const,
  };
}
