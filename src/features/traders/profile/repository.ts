import {
  Division,
  IntegritySeverity,
  IntegrityStatus,
  MarketSymbol,
  Prisma,
  TradeExitReason,
  TradeSide,
} from "@prisma/client";
import { calculateParticipantAnalytics } from "@/features/analytics/calculations";
import type {
  ParticipantAnalytics,
  ProfitFactor,
} from "@/features/analytics/types";
import { prisma } from "@/lib/db/prisma";
import { derivePublicIntegrityStatus } from "@/features/competitions/dashboard/query";
import type { PublicIntegrityStatus } from "@/features/competitions/dashboard/query";
import { SCORING_VERSION } from "@/features/scoring/config";
import type { ScoreComponent } from "@/features/scoring/types";
import { buildTraderChartData, type TraderChartData } from "./chart-data";
import type { TraderProfileQuery } from "./query";

const TRADE_PAGE_SIZE = 15;

export type TraderProfileResult =
  | { status: "ready"; data: TraderProfile }
  | { status: "not_found" }
  | { status: "unavailable"; message: string };

export type TraderProfile = {
  id: string;
  wallet: string;
  rank: number | null;
  division: Division;
  competition: {
    name: string;
    slug: string;
    startsAt: Date;
    endsAt: Date;
  };
  score: {
    finalTotal: number;
    rawTotal: number;
    integrityAdjustment: number;
    components: TraderScoreComponent[];
    explanations: string[];
    scoringVersion: string;
  };
  integrity: {
    status: PublicIntegrityStatus;
    flags: {
      type: string;
      severity: string;
      reason: string;
      observedValue: string;
      threshold: string;
      affectsScoring: boolean;
    }[];
  };
  analytics: ParticipantAnalytics;
  charts: TraderChartData;
  recentTrades: {
    rows: TradeHistoryRow[];
    page: number;
    totalPages: number;
    totalRows: number;
  };
  quests: {
    description: string;
    engagementPoints: number;
    progress: number;
    status: string;
    target: number;
    title: string;
    version: string;
  }[];
  streaks: {
    bestCount: number;
    currentCount: number;
    lastCountedAt: Date | null;
    type: string;
  }[];
  achievements: { title: string; awardedAt: Date }[];
};

export type TraderScoreComponent = {
  key: string;
  label: string;
  score: number;
  max: number;
  normalized: Record<string, number>;
  inputs: Record<string, number | null>;
  explanation: string;
};

export type TradeHistoryRow = {
  id: string;
  market: MarketSymbol;
  side: TradeSide;
  openedAt: Date;
  closedAt: Date | null;
  durationMs: number | null;
  size: number;
  leverage: number;
  grossPnl: number | null;
  fees: number;
  netPnl: number | null;
  exitReason: TradeExitReason | null;
  isQualified: boolean;
};

export async function getTraderProfile(
  wallet: string,
  query: TraderProfileQuery,
): Promise<TraderProfileResult> {
  try {
    const participant = await prisma.participant.findFirst({
      include: {
        achievements: {
          include: { achievement: true },
          orderBy: { awardedAt: "desc" },
        },
        competition: true,
        dailyPerformances: true,
        integrityFlags: {
          orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
        },
        questProgress: {
          include: { quest: true },
          orderBy: { updatedAt: "desc" },
          take: 4,
        },
        scoreBreakdowns: {
          orderBy: { calculatedAt: "desc" },
          take: 1,
        },
        trades: {
          include: { market: true },
          orderBy: [{ closedAt: "desc" }, { openedAt: "desc" }, { id: "asc" }],
        },
        streaks: {
          orderBy: [{ type: "asc" }],
        },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      where: { wallet },
    });

    if (!participant) {
      return { status: "not_found" };
    }

    const competitionParticipants = await prisma.participant.findMany({
      include: {
        scoreBreakdowns: {
          orderBy: { calculatedAt: "desc" },
          take: 1,
        },
      },
      where: { competitionId: participant.competitionId },
    });

    const rankedIds = competitionParticipants
      .map((entry) => ({
        id: entry.id,
        maximumDrawdown: entry.maximumDrawdown.toNumber(),
        simulatedNetPnl:
          entry.currentEquity.toNumber() - entry.startingEquity.toNumber(),
        score: entry.scoreBreakdowns[0]?.competitionScore.toNumber() ?? 0,
        wallet: entry.wallet,
      }))
      .sort(
        (left, right) =>
          right.score - left.score ||
          left.maximumDrawdown - right.maximumDrawdown ||
          right.simulatedNetPnl - left.simulatedNetPnl ||
          left.wallet.localeCompare(right.wallet) ||
          left.id.localeCompare(right.id),
      )
      .map((entry) => entry.id);

    const rankIndex = rankedIds.indexOf(participant.id);
    const analytics = calculateParticipantAnalytics({
      endsAt: participant.competition.endsAt,
      startingEquity: participant.startingEquity.toNumber(),
      startsAt: participant.competition.startsAt,
      trades: participant.trades.map((trade) => ({
        exitReason: trade.exitReason,
        fees: trade.fees.toNumber(),
        id: trade.id,
        leverage: trade.leverage.toNumber(),
        marketSymbol: trade.market.symbol,
        openedAt: trade.openedAt,
        closedAt: trade.closedAt,
        side: trade.side,
        simulatedPnl: trade.simulatedPnl?.toNumber() ?? null,
        simulatedVolume: trade.simulatedVolume.toNumber(),
        size: trade.size.toNumber(),
      })),
    });
    const latestScore = participant.scoreBreakdowns[0];
    const scoreDetails = parseScoreDetails(latestScore?.componentDetails);
    const integrityStatus = derivePublicIntegrityStatus(
      participant.integrityFlags.map((flag) => ({
        evidence: flag.evidence,
        severity: flag.severity as IntegritySeverity,
        status: flag.status as IntegrityStatus,
      })),
    );
    const totalTradePages = Math.max(
      1,
      Math.ceil(participant.trades.length / TRADE_PAGE_SIZE),
    );
    const tradesPage = Math.min(query.tradesPage, totalTradePages);
    const start = (tradesPage - 1) * TRADE_PAGE_SIZE;

    return {
      status: "ready",
      data: {
        id: participant.id,
        wallet: participant.wallet,
        rank: rankIndex === -1 ? null : rankIndex + 1,
        division: participant.division,
        competition: {
          endsAt: participant.competition.endsAt,
          name: participant.competition.name,
          slug: participant.competition.slug,
          startsAt: participant.competition.startsAt,
        },
        score: {
          components: scoreDetails.components,
          explanations: scoreDetails.explanations,
          finalTotal: latestScore?.competitionScore.toNumber() ?? 0,
          integrityAdjustment: latestScore?.integrityPenalty.toNumber() ?? 0,
          rawTotal:
            (latestScore?.competitionScore.toNumber() ?? 0) +
            (latestScore?.integrityPenalty.toNumber() ?? 0),
          scoringVersion: latestScore?.scoringVersion ?? SCORING_VERSION,
        },
        integrity: {
          flags: participant.integrityFlags
            .filter((flag) => flag.status !== "DISMISSED")
            .map((flag) => {
              const evidence = evidenceObject(flag.evidence);

              return {
                affectsScoring: evidence.affectsScoring === true,
                observedValue: String(evidence.observedValue ?? "Recorded"),
                reason: flag.reason,
                severity: flag.severity,
                threshold: String(evidence.threshold ?? "Documented rule"),
                type: flag.type,
              };
            }),
          status: integrityStatus,
        },
        analytics,
        charts: buildTraderChartData(analytics),
        recentTrades: {
          page: tradesPage,
          rows: participant.trades
            .slice(start, start + TRADE_PAGE_SIZE)
            .map((trade) => {
              const grossPnl = trade.simulatedPnl?.toNumber() ?? null;
              const fees = trade.fees.toNumber();

              return {
                closedAt: trade.closedAt,
                durationMs: trade.closedAt
                  ? trade.closedAt.getTime() - trade.openedAt.getTime()
                  : null,
                exitReason: trade.exitReason,
                fees,
                grossPnl,
                id: trade.id,
                isQualified: trade.isQualified,
                leverage: trade.leverage.toNumber(),
                market: trade.market.symbol,
                netPnl: grossPnl === null ? null : grossPnl - fees,
                openedAt: trade.openedAt,
                side: trade.side,
                size: trade.size.toNumber(),
              };
            }),
          totalPages: totalTradePages,
          totalRows: participant.trades.length,
        },
        quests: participant.questProgress.map((progress) => {
          const requirements = evidenceObject(progress.quest.requirements);

          return {
            description: progress.quest.description,
            engagementPoints: numberFrom(requirements.engagementPoints),
            progress: progress.progressValue.toNumber(),
            status: progress.status,
            target: numberFrom(requirements.target),
            title: progress.quest.title,
            version: String(requirements.version ?? "unversioned"),
          };
        }),
        streaks: participant.streaks.map((streak) => ({
          bestCount: streak.bestCount,
          currentCount: streak.currentCount,
          lastCountedAt: streak.lastCountedAt,
          type: streak.type,
        })),
        achievements: participant.achievements.map((entry) => ({
          awardedAt: entry.awardedAt,
          title: entry.achievement.title,
        })),
      },
    };
  } catch {
    return {
      status: "unavailable",
      message:
        "The PostgreSQL database is unavailable. Start the approved development database and seed synthetic participants before opening trader profiles.",
    };
  }
}

function parseScoreDetails(value: Prisma.JsonValue | null | undefined): {
  components: TraderScoreComponent[];
  explanations: string[];
} {
  const details = objectRecord(value);
  const componentScores = objectRecord(details.componentScores);
  const componentCaps = objectRecord(details.componentCaps);
  const normalizedValues = objectRecord(details.normalizedValues);
  const rawInputs = objectRecord(details.rawMetricInputs);
  const explanations = Array.isArray(details.explanations)
    ? details.explanations.filter(
        (item): item is string => typeof item === "string",
      )
    : [];

  return {
    explanations,
    components: componentKeys.map(({ key, label }) => ({
      explanation: explanationFor(label),
      inputs: pickInputs(rawInputs, key),
      key,
      label,
      max: numberFrom(componentCaps[key]),
      normalized: numericRecord(normalizedValues[key]),
      score: numberFrom(componentScores[key]),
    })),
  };
}

const componentKeys = [
  { key: "performance", label: "Performance" },
  { key: "riskManagement", label: "Risk management" },
  { key: "consistency", label: "Consistency" },
  { key: "qualifiedActivity", label: "Qualified activity" },
  { key: "marketDiversity", label: "Market diversity" },
] as const;

function pickInputs(
  rawInputs: Record<string, unknown>,
  key: ScoreComponent["key"],
) {
  const inputKeys: Record<ScoreComponent["key"], string[]> = {
    consistency: [
      "profitableActiveDayPercentage",
      "returnVolatility",
      "bestTradeDependence",
      "activeTradingDays",
    ],
    marketDiversity: ["marketAllocation", "positionConcentration"],
    performance: ["netPnl", "roi", "profitFactor", "qualifiedTradeCount"],
    qualifiedActivity: ["activeTradingDays", "qualifiedTradeCount"],
    riskManagement: [
      "maximumDrawdown",
      "averageLeverage",
      "liquidationRate",
      "positionConcentration",
    ],
  };

  return Object.fromEntries(
    inputKeys[key].map((inputKey) => [
      inputKey,
      typeof rawInputs[inputKey] === "number" ? rawInputs[inputKey] : null,
    ]),
  );
}

function explanationFor(label: string) {
  return `${label} is a transparent score component derived from normalized analytics inputs and capped before contributing to the total competition score.`;
}

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function numericRecord(value: unknown): Record<string, number> {
  return Object.fromEntries(
    Object.entries(objectRecord(value)).map(([key, entry]) => [
      key,
      numberFrom(entry),
    ]),
  );
}

function numberFrom(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function evidenceObject(value: Prisma.JsonValue | null | undefined) {
  return objectRecord(value);
}

export function profitFactorLabel(profitFactor: ProfitFactor) {
  switch (profitFactor.kind) {
    case "finite":
      return profitFactor.value.toFixed(2);
    case "no_losing_trades":
      return "No losing trades";
    case "no_trades":
      return "No trades";
    case "no_winning_trades":
      return "0.00";
  }
}
