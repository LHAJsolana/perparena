import type { IntegrityFlagType, IntegritySeverity } from "@prisma/client";
import {
  normalizeTrades,
  sortTradesDeterministically,
} from "@/features/analytics/normalization";
import type { NormalizedTrade } from "@/features/analytics/types";
import type {
  DerivedIntegrityStatus,
  IntegrityAssessment,
  IntegrityFlagSignal,
  IntegrityImpact,
  IntegrityParticipantInput,
} from "@/features/integrity/types";

export const INTEGRITY_ENGINE_VERSION = "perparena-integrity-v1";
export const MIN_INTEGRITY_MULTIPLIER = 0.82;
export const MAX_INTEGRITY_PENALTY = 0.18;

const DETECTION_TIMESTAMP = new Date("2026-01-12T00:00:00.000Z");

type Rule = {
  type: IntegrityFlagType;
  severity: IntegritySeverity;
  threshold: number;
  impact: IntegrityImpact;
  affectsScoring: boolean;
  measure: (
    input: IntegrityParticipantInput,
    trades: readonly NormalizedTrade[],
  ) => number;
  explain: (observed: number, threshold: number) => string;
  safeguard?: (input: IntegrityParticipantInput, observed: number) => boolean;
};

const rules: Rule[] = [
  rule(
    "REPETITIVE_INSTANT_ROUND_TRIPS",
    "MEDIUM",
    12,
    "warning",
    false,
    (_, trades) => trades.filter((trade) => trade.durationMs <= 90_000).length,
  ),
  rule(
    "HIGH_TRADE_FREQUENCY",
    "MEDIUM",
    45,
    "warning",
    false,
    (input) => input.analytics.tradeFrequency.tradesPerActiveDay,
  ),
  rule(
    "EXCESSIVE_AVERAGE_LEVERAGE",
    "HIGH",
    18,
    "score_adjusting",
    true,
    (input) => input.analytics.averageLeverage ?? 0,
  ),
  rule(
    "EXCESSIVE_MAX_LEVERAGE",
    "MEDIUM",
    35,
    "warning",
    false,
    (input) => input.analytics.maximumLeverage ?? 0,
  ),
  rule(
    "ONE_TRADE_SCORE_DOMINATION",
    "MEDIUM",
    0.75,
    "warning",
    false,
    (input) => input.analytics.bestTradeDependence,
  ),
  rule(
    "TINY_ACCOUNT_ROI_DISTORTION",
    "MEDIUM",
    1.5,
    "warning",
    false,
    (input) =>
      input.analytics.startingEquity < 750 ? (input.analytics.roi ?? 0) : 0,
  ),
  rule(
    "EXTREME_MARKET_CONCENTRATION",
    "LOW",
    0.92,
    "informational",
    false,
    (input) => Math.max(0, ...Object.values(input.analytics.marketAllocation)),
  ),
  rule(
    "FINAL_HOUR_ACTIVITY",
    "MEDIUM",
    0.45,
    "warning",
    false,
    (input, trades) => finalWindowRatio(input, trades, 60 * 60 * 1000),
  ),
  rule(
    "REPEATED_NEAR_IDENTICAL_SIZES",
    "HIGH",
    0.7,
    "score_adjusting",
    true,
    (_, trades) => repeatedSizeRatio(trades),
  ),
  rule(
    "EXCESSIVE_LIQUIDATION_RATE",
    "HIGH",
    0.18,
    "score_adjusting",
    true,
    (input) => input.analytics.liquidationRate,
  ),
  rule(
    "POSSIBLE_VOLUME_FARMING",
    "HIGH",
    35,
    "score_adjusting",
    true,
    (input) =>
      input.analytics.tradeFrequency.tradesPerActiveDay > 35 &&
      input.analytics.positionConcentration > 0.45
        ? input.analytics.tradeFrequency.tradesPerActiveDay
        : 0,
  ),
  rule(
    "VERY_LOW_AVERAGE_DURATION",
    "LOW",
    5 * 60 * 1000,
    "informational",
    false,
    (input) =>
      input.analytics.averageTradeDurationMs === null
        ? Number.MAX_SAFE_INTEGER
        : -input.analytics.averageTradeDurationMs,
  ),
  rule(
    "ECONOMICALLY_NEGLIGIBLE_TRADES",
    "LOW",
    0.35,
    "informational",
    false,
    (_, trades) =>
      trades.length === 0
        ? 0
        : trades.filter((trade) => trade.simulatedVolume < 25).length /
          trades.length,
  ),
  rule(
    "ABRUPT_FINAL_BEHAVIOR_SHIFT",
    "MEDIUM",
    0.55,
    "warning",
    false,
    (input, trades) => finalWindowRatio(input, trades, 24 * 60 * 60 * 1000),
  ),
];

export function assessParticipantIntegrity(
  input: IntegrityParticipantInput,
): IntegrityAssessment {
  const normalized = sortTradesDeterministically(
    normalizeTrades(input.trades),
  ).filter((trade) => !trade.malformed);
  const flags = generateIntegrityFlags(input, normalized);
  const { multiplier, rawPenalty, cappedPenalty } =
    calculateIntegrityMultiplier(flags);
  const status = deriveIntegrityStatus(flags, multiplier);

  return {
    participantId: input.participantId,
    archetype: input.archetype,
    status,
    flags,
    multiplier,
    rawPenalty,
    cappedPenalty,
    explanation: explanationForStatus(status, flags, multiplier),
  };
}

export function generateIntegrityFlags(
  input: IntegrityParticipantInput,
  normalizedTrades = sortTradesDeterministically(
    normalizeTrades(input.trades),
  ).filter((trade) => !trade.malformed),
): IntegrityFlagSignal[] {
  return rules.flatMap((item) => {
    const observed = item.measure(input, normalizedTrades);
    const comparisonValue =
      item.type === "VERY_LOW_AVERAGE_DURATION" ? -observed : observed;
    const triggered =
      item.type === "VERY_LOW_AVERAGE_DURATION"
        ? observed !== Number.MAX_SAFE_INTEGER &&
          comparisonValue < item.threshold
        : observed >= item.threshold;

    if (!triggered || item.safeguard?.(input, comparisonValue)) {
      return [];
    }

    return [
      {
        id: stableFlagId(input.participantId, item.type),
        type: item.type,
        severity: item.severity,
        participantId: input.participantId,
        observedValue: comparisonValue,
        threshold: item.threshold,
        explanation: item.explain(comparisonValue, item.threshold),
        evidence: {
          observedValue: comparisonValue,
          threshold: item.threshold,
          engineVersion: INTEGRITY_ENGINE_VERSION,
          synthetic: true,
        },
        detectedAt: DETECTION_TIMESTAMP,
        engineVersion: INTEGRITY_ENGINE_VERSION,
        affectsScoring: item.affectsScoring,
        impact: item.impact,
        reviewStatus: "OPEN",
      },
    ];
  });
}

export function deriveIntegrityStatus(
  flags: readonly IntegrityFlagSignal[],
  multiplier = calculateIntegrityMultiplier(flags).multiplier,
): DerivedIntegrityStatus {
  if (flags.length === 0) {
    return "VERIFIED";
  }

  if (multiplier < 1) {
    return "SCORE_LIMITED";
  }

  if (
    flags.some(
      (flag) => flag.severity === "HIGH" || flag.severity === "CRITICAL",
    )
  ) {
    return "UNDER_REVIEW";
  }

  return "WARNING";
}

export function calculateIntegrityMultiplier(
  flags: readonly IntegrityFlagSignal[],
) {
  const rawPenalty = flags.reduce((total, flag) => {
    if (!flag.affectsScoring || flag.reviewStatus === "DISMISSED") {
      return total;
    }

    const severityPenalty =
      flag.severity === "CRITICAL"
        ? 0.12
        : flag.severity === "HIGH"
          ? 0.07
          : flag.severity === "MEDIUM"
            ? 0.035
            : 0.015;

    return total + severityPenalty;
  }, 0);
  const cappedPenalty = Math.min(MAX_INTEGRITY_PENALTY, rawPenalty);

  return {
    rawPenalty,
    cappedPenalty,
    multiplier: Math.max(MIN_INTEGRITY_MULTIPLIER, 1 - cappedPenalty),
  };
}

export function resolveFlag(flag: IntegrityFlagSignal): IntegrityFlagSignal {
  return { ...flag, reviewStatus: "CONFIRMED" };
}

export function dismissFlag(flag: IntegrityFlagSignal): IntegrityFlagSignal {
  return {
    ...flag,
    reviewStatus: "DISMISSED",
    affectsScoring: false,
    impact: "informational",
  };
}

export function reopenFlag(flag: IntegrityFlagSignal): IntegrityFlagSignal {
  return { ...flag, reviewStatus: "OPEN" };
}

function rule(
  type: IntegrityFlagType,
  severity: IntegritySeverity,
  threshold: number,
  impact: IntegrityImpact,
  affectsScoring: boolean,
  measure: Rule["measure"],
): Rule {
  return {
    type,
    severity,
    threshold,
    impact,
    affectsScoring,
    measure,
    explain: (observed, limit) =>
      `Simulation-based integrity signal ${type} observed ${formatNumber(
        observed,
      )} against threshold ${formatNumber(limit)}. This indicates behavior requiring review, not conclusive fraud detection.`,
  };
}

function finalWindowRatio(
  input: IntegrityParticipantInput,
  trades: readonly NormalizedTrade[],
  windowMs: number,
) {
  if (trades.length === 0) {
    return 0;
  }

  const windowStart = input.endsAt.getTime() - windowMs;
  return (
    trades.filter((trade) => trade.closedAt.getTime() >= windowStart).length /
    trades.length
  );
}

function repeatedSizeRatio(trades: readonly NormalizedTrade[]) {
  if (trades.length < 5) {
    return 0;
  }

  const buckets = trades.reduce<Record<string, number>>((counts, trade) => {
    const key = Math.round(trade.size * 100) / 100;
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});

  return Math.max(0, ...Object.values(buckets)) / trades.length;
}

function stableFlagId(participantId: string, type: IntegrityFlagType) {
  return `integrity_${participantId}_${type}`;
}

function explanationForStatus(
  status: DerivedIntegrityStatus,
  flags: readonly IntegrityFlagSignal[],
  multiplier: number,
) {
  if (status === "VERIFIED") {
    return "No simulation-based integrity signals crossed documented thresholds.";
  }

  return `${flags.length} integrity heuristic signal(s) require review. Integrity multiplier is ${formatNumber(multiplier)}.`;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(4);
}
