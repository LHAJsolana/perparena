import type { ParticipantAnalytics } from "@/features/analytics/types";
import {
  SCORING_VERSION,
  SCORE_WEIGHTS,
  validateScoreWeights,
} from "@/features/scoring/config";
import type {
  IntegrityAdjustment,
  ParticipantScore,
  ScoreComponent,
  ScoreContextParticipant,
} from "@/features/scoring/types";

const NEUTRAL_INTEGRITY_ADJUSTMENT: IntegrityAdjustment = {
  multiplier: 1,
  reason: "Neutral placeholder until Phase 7 integrity engine.",
};

export function scoreCompetitionParticipants(
  participants: readonly ScoreContextParticipant[],
): ParticipantScore[] {
  const validation = validateScoreWeights();

  if (!validation.valid) {
    throw new Error(
      `Score weights must total 100; received ${validation.total}.`,
    );
  }

  const roiValues = participants.map(
    (participant) => participant.analytics.roi ?? 0,
  );
  const netPnlEfficiencyValues = participants.map((participant) =>
    participant.analytics.startingEquity === 0
      ? 0
      : participant.analytics.netPnl / participant.analytics.startingEquity,
  );

  return participants.map((participant) =>
    scoreParticipant(participant, roiValues, netPnlEfficiencyValues),
  );
}

export function rankParticipantScores(scores: readonly ParticipantScore[]) {
  return [...scores].sort((left, right) => {
    const finalDifference = right.finalTotal - left.finalTotal;

    if (finalDifference !== 0) {
      return finalDifference;
    }

    const drawdownDifference =
      left.rawMetricInputs.maximumDrawdown -
      right.rawMetricInputs.maximumDrawdown;

    if (drawdownDifference !== 0) {
      return drawdownDifference;
    }

    const consistencyDifference =
      right.components.consistency.score - left.components.consistency.score;

    if (consistencyDifference !== 0) {
      return consistencyDifference;
    }

    const pnlDifference =
      right.rawMetricInputs.netPnl - left.rawMetricInputs.netPnl;

    if (pnlDifference !== 0) {
      return pnlDifference;
    }

    const leftQualified =
      left.firstQualifiedAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightQualified =
      right.firstQualifiedAt?.getTime() ?? Number.MAX_SAFE_INTEGER;

    if (leftQualified !== rightQualified) {
      return leftQualified - rightQualified;
    }

    return left.participantId.localeCompare(right.participantId);
  });
}

function scoreParticipant(
  participant: ScoreContextParticipant,
  roiValues: readonly number[],
  netPnlEfficiencyValues: readonly number[],
): ParticipantScore {
  const integrityAdjustment =
    participant.integrityAdjustment ?? NEUTRAL_INTEGRITY_ADJUSTMENT;
  const components = {
    performance: performanceComponent(
      participant.analytics,
      roiValues,
      netPnlEfficiencyValues,
    ),
    riskManagement: riskManagementComponent(participant.analytics),
    consistency: consistencyComponent(participant.analytics),
    qualifiedActivity: qualifiedActivityComponent(participant.analytics),
    marketDiversity: marketDiversityComponent(participant.analytics),
  };
  const penalties = {
    severeRisk:
      participant.analytics.maximumDrawdown >= 0.8 ||
      participant.analytics.liquidationRate >= 0.25
        ? 5
        : 0,
  };
  const rawTotal = clamp(
    Object.values(components).reduce(
      (total, component) => total + component.score,
      0,
    ) - Object.values(penalties).reduce((total, penalty) => total + penalty, 0),
    0,
    100,
  );
  const finalTotal = clamp(rawTotal * integrityAdjustment.multiplier, 0, 100);

  return assertFiniteScore({
    participantId: participant.participantId,
    archetype: participant.archetype,
    scoringVersion: SCORING_VERSION,
    rawMetricInputs: participant.analytics,
    components,
    penalties,
    rawTotal,
    integrityAdjustment,
    finalTotal,
    firstQualifiedAt: participant.firstQualifiedAt,
    explanations: Object.values(components).map(
      (component) => component.explanation,
    ),
  });
}

function performanceComponent(
  analytics: ParticipantAnalytics,
  roiValues: readonly number[],
  netPnlEfficiencyValues: readonly number[],
): ScoreComponent {
  const roi = analytics.roi ?? 0;
  const roiScore = percentileRank(roi, roiValues);
  const netPnlEfficiency =
    analytics.startingEquity === 0
      ? 0
      : analytics.netPnl / analytics.startingEquity;
  const netPnlScore = percentileRank(netPnlEfficiency, netPnlEfficiencyValues);
  const profitFactorScore =
    analytics.profitFactor.kind === "finite"
      ? clamp(analytics.profitFactor.value / 3, 0, 1)
      : analytics.profitFactor.kind === "no_losing_trades" &&
          analytics.qualifiedTradeCount >= 5
        ? 1
        : 0;
  const luckyTradePenalty =
    analytics.qualifiedTradeCount < 3 || analytics.bestTradeDependence > 0.65
      ? 0.75
      : 1;
  const normalized =
    (roiScore * 0.45 + netPnlScore * 0.25 + profitFactorScore * 0.3) *
    luckyTradePenalty;

  return component(
    "performance",
    SCORE_WEIGHTS.performance,
    normalized,
    { roi, netPnlEfficiency, profitFactor: profitFactorNumeric(analytics) },
    "Performance rewards ROI, equity-relative net P&L, and profit factor; raw account size is not directly scored.",
  );
}

function riskManagementComponent(
  analytics: ParticipantAnalytics,
): ScoreComponent {
  const drawdownScore = 1 - clamp(analytics.maximumDrawdown / 0.6, 0, 1);
  const leverageScore =
    1 - clamp(((analytics.averageLeverage ?? 0) - 1) / 24, 0, 1);
  const liquidationScore = 1 - clamp(analytics.liquidationRate / 0.15, 0, 1);
  const concentrationScore =
    1 - clamp((analytics.positionConcentration - 0.05) / 0.7, 0, 1);
  const normalized =
    drawdownScore * 0.4 +
    leverageScore * 0.2 +
    liquidationScore * 0.25 +
    concentrationScore * 0.15;

  return component(
    "riskManagement",
    SCORE_WEIGHTS.riskManagement,
    normalized,
    {
      maximumDrawdown: analytics.maximumDrawdown,
      averageLeverage: analytics.averageLeverage,
      liquidationRate: analytics.liquidationRate,
      positionConcentration: analytics.positionConcentration,
    },
    "Risk management penalizes deep drawdown, excessive leverage, liquidations, and concentrated sizing.",
  );
}

function consistencyComponent(analytics: ParticipantAnalytics): ScoreComponent {
  const profitableDayScore = analytics.profitableActiveDayPercentage;
  const volatilityScore =
    analytics.returnVolatility === null
      ? 0
      : 1 - clamp(analytics.returnVolatility / 0.18, 0, 1);
  const bestTradeScore = 1 - clamp(analytics.bestTradeDependence / 0.75, 0, 1);
  const activeDayScore = clamp(analytics.activeTradingDays / 5, 0, 1);
  const normalized =
    profitableDayScore * 0.35 +
    volatilityScore * 0.25 +
    bestTradeScore * 0.25 +
    activeDayScore * 0.15;

  return component(
    "consistency",
    SCORE_WEIGHTS.consistency,
    normalized,
    {
      profitableActiveDayPercentage: analytics.profitableActiveDayPercentage,
      returnVolatility: analytics.returnVolatility,
      bestTradeDependence: analytics.bestTradeDependence,
      activeTradingDays: analytics.activeTradingDays,
    },
    "Consistency favors repeated profitable active days, lower volatility, and less dependence on one trade.",
  );
}

function qualifiedActivityComponent(
  analytics: ParticipantAnalytics,
): ScoreComponent {
  const activeDayScore = clamp(analytics.activeTradingDays / 5, 0, 1);
  const qualifiedTradeScore = diminishing(analytics.qualifiedTradeCount, 20);
  const frequencyPenalty =
    analytics.tradeFrequency.tradesPerActiveDay > 45
      ? 0.75
      : analytics.tradeFrequency.tradesPerActiveDay > 30
        ? 0.9
        : 1;
  const normalized =
    (activeDayScore * 0.45 + qualifiedTradeScore * 0.55) * frequencyPenalty;

  return component(
    "qualifiedActivity",
    SCORE_WEIGHTS.qualifiedActivity,
    normalized,
    {
      activeTradingDays: analytics.activeTradingDays,
      qualifiedTradeCount: analytics.qualifiedTradeCount,
      tradesPerActiveDay: analytics.tradeFrequency.tradesPerActiveDay,
    },
    "Qualified activity uses diminishing returns and caps frequency so unlimited trading is not enough to win.",
  );
}

function marketDiversityComponent(
  analytics: ParticipantAnalytics,
): ScoreComponent {
  const meaningfulMarkets = Object.values(analytics.marketAllocation).filter(
    (allocation) => allocation >= 0.1,
  ).length;
  const marketCountScore = clamp(meaningfulMarkets / 3, 0, 1);
  const distributionScore =
    1 - clamp((analytics.positionConcentration - 1 / 3) / (1 - 1 / 3), 0, 1);
  const normalized = marketCountScore * 0.65 + distributionScore * 0.35;

  return component(
    "marketDiversity",
    SCORE_WEIGHTS.marketDiversity,
    normalized,
    {
      meaningfulMarkets,
      positionConcentration: analytics.positionConcentration,
    },
    "Market diversity rewards meaningful activity across markets without requiring exactly equal allocation.",
  );
}

function component(
  key: ScoreComponent["key"],
  max: number,
  normalized: number,
  inputs: ScoreComponent["inputs"],
  explanation: string,
): ScoreComponent {
  const safeNormalized = clamp(finite(normalized), 0, 1);

  return {
    key,
    max,
    normalized: { value: safeNormalized },
    inputs,
    score: safeNormalized * max,
    explanation,
  };
}

function percentileRank(value: number, values: readonly number[]) {
  if (values.length <= 1) {
    return value > 0 ? 1 : 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const lowerOrEqual = sorted.filter((item) => item <= value).length;

  return clamp((lowerOrEqual - 1) / (sorted.length - 1), 0, 1);
}

function diminishing(value: number, target: number) {
  if (value <= 0) {
    return 0;
  }

  return clamp(Math.log1p(value) / Math.log1p(target), 0, 1);
}

function profitFactorNumeric(analytics: ParticipantAnalytics) {
  return analytics.profitFactor.kind === "finite"
    ? analytics.profitFactor.value
    : null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function finite(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function assertFiniteScore<T extends ParticipantScore>(score: T): T {
  const values = [
    score.rawTotal,
    score.finalTotal,
    ...Object.values(score.components).map((component) => component.score),
  ];

  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error("Scoring generated NaN or Infinity");
  }

  return score;
}
