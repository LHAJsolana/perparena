import {
  getTraderProfile,
  type TraderProfile,
  type TraderProfileResult,
} from "@/features/traders/profile/repository";
import type { TraderProfileQuery } from "@/features/traders/profile/query";

export function getTraderProfileService(
  wallet: string,
  query: TraderProfileQuery,
): Promise<TraderProfileResult> {
  return getTraderProfile(wallet, query);
}

export async function getTraderSummaryService(
  wallet: string,
): Promise<TraderProfileResult | { status: "ready"; data: TraderSummary }> {
  const result = await getTraderProfileService(wallet, { tradesPage: 1 });

  if (result.status !== "ready") {
    return result;
  }

  return {
    data: toTraderSummary(result.data),
    status: "ready",
  };
}

export type TraderSummary = {
  wallet: string;
  rank: number | null;
  division: TraderProfile["division"];
  competition: TraderProfile["competition"];
  score: TraderProfile["score"];
  integrity: TraderProfile["integrity"];
  metrics: {
    activeDays: number;
    currentEquity: number;
    liquidationCount: number;
    maximumDrawdown: number;
    netPnl: number;
    qualifiedTradeCount: number;
    roi: number | null;
    startingEquity: number;
    winRate: number | null;
  };
};

function toTraderSummary(profile: TraderProfile): TraderSummary {
  return {
    competition: profile.competition,
    division: profile.division,
    integrity: profile.integrity,
    metrics: {
      activeDays: profile.analytics.activeTradingDays,
      currentEquity: profile.analytics.currentEquity,
      liquidationCount: profile.analytics.liquidationCount,
      maximumDrawdown: profile.analytics.maximumDrawdown,
      netPnl: profile.analytics.netPnl,
      qualifiedTradeCount: profile.analytics.qualifiedTradeCount,
      roi: profile.analytics.roi,
      startingEquity: profile.analytics.startingEquity,
      winRate: profile.analytics.winRate,
    },
    rank: profile.rank,
    score: profile.score,
    wallet: profile.wallet,
  };
}
