import { Division, IntegrityStatus, MarketSymbol } from "@prisma/client";
import { z } from "zod";

export const leaderboardSortOptions = [
  "score",
  "netPnl",
  "roi",
  "maximumDrawdown",
  "winRate",
  "activeDays",
  "liquidations",
] as const;

export type LeaderboardSort = (typeof leaderboardSortOptions)[number];

export const publicIntegrityStatuses = [
  "VERIFIED",
  "WARNING",
  "UNDER_REVIEW",
  "SCORE_LIMITED",
] as const;

export type PublicIntegrityStatus = (typeof publicIntegrityStatuses)[number];

export const leaderboardQuerySchema = z.object({
  search: z.string().trim().max(80).catch(""),
  division: z.nativeEnum(Division).optional().catch(undefined),
  market: z.nativeEnum(MarketSymbol).optional().catch(undefined),
  integrity: z.enum(publicIntegrityStatuses).optional().catch(undefined),
  sort: z.enum(leaderboardSortOptions).catch("score"),
  direction: z.enum(["asc", "desc"]).catch("desc"),
  page: z.coerce.number().int().min(1).max(999).catch(1),
  pageSize: z.coerce.number().int().min(5).max(50).catch(10),
});

export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;

export function parseLeaderboardQuery(
  searchParams: Record<string, string | string[] | undefined>,
): LeaderboardQuery {
  return leaderboardQuerySchema.parse({
    search: first(searchParams.search),
    division: first(searchParams.division),
    market: first(searchParams.market),
    integrity: first(searchParams.integrity),
    sort: first(searchParams.sort),
    direction: first(searchParams.direction),
    page: first(searchParams.page),
    pageSize: first(searchParams.pageSize),
  });
}

export function queryToSearchParams(
  query: Partial<LeaderboardQuery>,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "" && value !== null) {
      params.set(key, String(value));
    }
  }

  return params;
}

export function derivePublicIntegrityStatus(
  flags: readonly {
    status: IntegrityStatus;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    evidence: unknown;
  }[],
): PublicIntegrityStatus {
  const activeFlags = flags.filter((flag) => flag.status !== "DISMISSED");

  if (activeFlags.length === 0) {
    return "VERIFIED";
  }

  const hasScoreImpact = activeFlags.some((flag) => {
    if (!flag.evidence || typeof flag.evidence !== "object") {
      return false;
    }

    return "affectsScoring" in flag.evidence && flag.evidence.affectsScoring;
  });

  if (hasScoreImpact) {
    return "SCORE_LIMITED";
  }

  if (
    activeFlags.some(
      (flag) => flag.severity === "HIGH" || flag.severity === "CRITICAL",
    )
  ) {
    return "UNDER_REVIEW";
  }

  return "WARNING";
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
