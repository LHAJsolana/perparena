import { AchievementType, QuestType, type MarketSymbol } from "@prisma/client";
import { normalizeTrades } from "@/features/analytics/normalization";
import { isQualifiedTrade } from "@/features/analytics/qualification";
import type {
  DailyAnalytics,
  NormalizedTrade,
} from "@/features/analytics/types";
import {
  ENGAGEMENT_VERSION,
  type AchievementDefinition,
  type EngagementEvaluation,
  type EngagementEvaluationInput,
  type EngagementQuestDefinition,
  type QuestEvaluation,
  type StreakEvaluation,
} from "@/features/engagement/types";

export const engagementQuestDefinitions: EngagementQuestDefinition[] = [
  {
    badge: "Qualified",
    cadence: "daily-repeatable",
    description:
      "Complete at least one qualified synthetic trade on a UTC day.",
    engagementPoints: 10,
    eligibilityRules: [
      "Closed trade",
      "Qualified trade",
      "UTC competition day",
    ],
    name: "Complete one qualified trade",
    slug: "daily-qualified-trade",
    target: 1,
    type: QuestType.PARTICIPATION,
    version: ENGAGEMENT_VERSION,
  },
  {
    badge: "Markets",
    cadence: "daily-repeatable",
    description: "Trade at least two supported markets on a UTC day.",
    engagementPoints: 10,
    eligibilityRules: [
      "Closed trade",
      "Supported market",
      "Two distinct markets",
    ],
    name: "Trade two supported markets",
    slug: "daily-two-markets",
    target: 1,
    type: QuestType.PARTICIPATION,
    version: ENGAGEMENT_VERSION,
  },
  {
    badge: "Drawdown",
    cadence: "daily-repeatable",
    description: "Finish an active UTC day below 10% daily maximum drawdown.",
    engagementPoints: 10,
    eligibilityRules: ["Active day", "Maximum drawdown below 10%"],
    name: "Stay below 10% daily drawdown",
    slug: "daily-drawdown-under-10",
    target: 1,
    type: QuestType.RISK_MANAGEMENT,
    version: ENGAGEMENT_VERSION,
  },
  {
    badge: "Leverage",
    cadence: "daily-repeatable",
    description: "Maintain average leverage below 5x on an active UTC day.",
    engagementPoints: 10,
    eligibilityRules: [
      "Active day",
      "Closed trades",
      "Average leverage below 5x",
    ],
    name: "Maintain average leverage below 5x",
    slug: "daily-average-leverage-under-5",
    target: 1,
    type: QuestType.RISK_MANAGEMENT,
    version: ENGAGEMENT_VERSION,
  },
  {
    badge: "No liquidation",
    cadence: "daily-repeatable",
    description: "Finish an active UTC day without a liquidation event.",
    engagementPoints: 10,
    eligibilityRules: ["Active day", "No liquidation exit reason"],
    name: "Finish an active day without liquidation",
    slug: "daily-no-liquidation",
    target: 1,
    type: QuestType.RISK_MANAGEMENT,
    version: ENGAGEMENT_VERSION,
  },
  {
    badge: "Four days",
    cadence: "competition-wide",
    description: "Trade on four separate UTC competition days.",
    engagementPoints: 25,
    eligibilityRules: ["Closed trades", "Four distinct active UTC days"],
    name: "Trade on four separate days",
    slug: "competition-four-active-days",
    target: 4,
    type: QuestType.CONSISTENCY,
    version: ENGAGEMENT_VERSION,
  },
  {
    badge: "Ten qualified",
    cadence: "competition-wide",
    description:
      "Complete ten qualified synthetic trades during the competition.",
    engagementPoints: 25,
    eligibilityRules: ["Closed trades", "Qualified trade rules"],
    name: "Complete ten qualified trades",
    slug: "competition-ten-qualified-trades",
    target: 10,
    type: QuestType.PARTICIPATION,
    version: ENGAGEMENT_VERSION,
  },
  {
    badge: "Clean finish",
    cadence: "competition-wide",
    description: "Finish the competition with no liquidation exits.",
    engagementPoints: 25,
    eligibilityRules: ["At least one active day", "Zero liquidations"],
    name: "Finish with no liquidation",
    slug: "competition-no-liquidation",
    target: 1,
    type: QuestType.RISK_MANAGEMENT,
    version: ENGAGEMENT_VERSION,
  },
  {
    badge: "Risk adjusted",
    cadence: "competition-wide",
    description: "Maintain positive simulated net P&L with drawdown below 25%.",
    engagementPoints: 25,
    eligibilityRules: [
      "Positive simulated net P&L",
      "Maximum drawdown below 25%",
    ],
    name: "Maintain positive risk-adjusted performance",
    slug: "competition-positive-risk-adjusted",
    target: 1,
    type: QuestType.CONSISTENCY,
    version: ENGAGEMENT_VERSION,
  },
  {
    badge: "All markets",
    cadence: "competition-wide",
    description: "Complete activity across all supported synthetic markets.",
    engagementPoints: 25,
    eligibilityRules: [
      "Closed trades",
      "Meaningful activity in every supported market",
    ],
    name: "Complete activity across all supported markets",
    slug: "competition-all-markets",
    target: 3,
    type: QuestType.PARTICIPATION,
    version: ENGAGEMENT_VERSION,
  },
];

export const achievementDefinitions: AchievementDefinition[] = [
  {
    criteria: ["At least one qualified trade"],
    description: "Completed the first qualified synthetic trade.",
    slug: "first-qualified-trade",
    title: "First Qualified Trade",
    type: AchievementType.PARTICIPATION,
    version: ENGAGEMENT_VERSION,
  },
  {
    criteria: ["Activity in at least two supported markets"],
    description: "Built activity across multiple supported markets.",
    slug: "multi-market-trader",
    title: "Multi-Market Trader",
    type: AchievementType.PARTICIPATION,
    version: ENGAGEMENT_VERSION,
  },
  {
    criteria: ["Maximum drawdown below 10%", "At least one active day"],
    description: "Kept maximum drawdown below 10%.",
    slug: "drawdown-defender",
    title: "Drawdown Defender",
    type: AchievementType.RISK_CONTROL,
    version: ENGAGEMENT_VERSION,
  },
  {
    criteria: ["Zero liquidations", "At least one active day"],
    description: "Finished without a liquidation event.",
    slug: "no-liquidation-finisher",
    title: "No-Liquidation Finisher",
    type: AchievementType.RISK_CONTROL,
    version: ENGAGEMENT_VERSION,
  },
  {
    criteria: [
      "At least 60% profitable active days",
      "At least four active days",
    ],
    description: "Showed consistency across active trading days.",
    slug: "consistency-specialist",
    title: "Consistency Specialist",
    type: AchievementType.CONSISTENCY,
    version: ENGAGEMENT_VERSION,
  },
  {
    criteria: ["Active on all seven competition days"],
    description: "Participated on every UTC day of the simulated season.",
    slug: "seven-day-participant",
    title: "Seven-Day Participant",
    type: AchievementType.PARTICIPATION,
    version: ENGAGEMENT_VERSION,
  },
  {
    criteria: ["Average leverage below 5x", "Positive simulated net P&L"],
    description:
      "Combined positive simulated performance with disciplined leverage.",
    slug: "risk-aware-trader",
    title: "Risk-Aware Trader",
    type: AchievementType.RISK_CONTROL,
    version: ENGAGEMENT_VERSION,
  },
];

export function evaluateEngagement(
  input: EngagementEvaluationInput,
): EngagementEvaluation {
  const trades = normalizeTrades(input.trades).filter(
    (trade) => !trade.malformed,
  );
  const daily = input.analytics.dailyPerformance;
  const activeDays = daily.filter((day) => day.tradeCount > 0);
  const marketsTraded = meaningfulMarkets(trades, input.supportedMarkets);

  return {
    achievements: evaluateAchievements(input, marketsTraded),
    quests: evaluateQuests(input, trades, activeDays, marketsTraded),
    streaks: evaluateStreaks(input, trades),
    version: ENGAGEMENT_VERSION,
  };
}

function evaluateQuests(
  input: EngagementEvaluationInput,
  trades: readonly NormalizedTrade[],
  activeDays: readonly DailyAnalytics[],
  marketsTraded: readonly MarketSymbol[],
): QuestEvaluation[] {
  const dailyLeverageDays = activeDays.filter((day) => {
    const dayTrades = tradesForDay(trades, day.day);
    return average(dayTrades.map((trade) => trade.leverage)) < 5;
  }).length;
  const noLiquidationDays = activeDays.filter((day) =>
    tradesForDay(trades, day.day).every(
      (trade) => trade.exitReason !== "LIQUIDATION",
    ),
  ).length;
  const twoMarketDays = activeDays.filter(
    (day) =>
      new Set(tradesForDay(trades, day.day).map((trade) => trade.marketSymbol))
        .size >= 2,
  ).length;

  const progressBySlug = {
    "competition-all-markets": marketsTraded.length,
    "competition-four-active-days": input.analytics.activeTradingDays,
    "competition-no-liquidation":
      input.analytics.activeTradingDays > 0 &&
      input.analytics.liquidationCount === 0
        ? 1
        : 0,
    "competition-positive-risk-adjusted":
      input.analytics.netPnl > 0 && input.analytics.maximumDrawdown < 0.25
        ? 1
        : 0,
    "competition-ten-qualified-trades": input.analytics.qualifiedTradeCount,
    "daily-average-leverage-under-5": dailyLeverageDays,
    "daily-drawdown-under-10": activeDays.filter(
      (day) => day.maximumDrawdown < 0.1,
    ).length,
    "daily-no-liquidation": noLiquidationDays,
    "daily-qualified-trade": activeDays.filter((day) => day.qualifiedTrades > 0)
      .length,
    "daily-two-markets": twoMarketDays,
  } satisfies Record<string, number>;

  return engagementQuestDefinitions.map((definition) => {
    const progress = Math.min(
      progressBySlug[definition.slug],
      definition.target,
    );
    const completed = progress >= definition.target;

    return {
      completed,
      completedAt: completed ? input.competitionEndsAt : null,
      explanation: completed
        ? `${definition.name} completed with ${progress} of ${definition.target}.`
        : `${definition.name} has ${progress} of ${definition.target}.`,
      progress,
      slug: definition.slug,
      target: definition.target,
    };
  });
}

function evaluateStreaks(
  input: EngagementEvaluationInput,
  trades: readonly NormalizedTrade[],
): StreakEvaluation[] {
  const days = competitionDays(
    input.competitionStartsAt,
    input.competitionEndsAt,
  );
  const active = days.map((day) => ({
    day,
    qualifies: input.analytics.dailyPerformance.some(
      (entry) => dayKey(entry.day) === dayKey(day) && entry.tradeCount > 0,
    ),
  }));
  const noLiquidation = days.map((day) => {
    const dayTrades = tradesForDay(trades, day);
    return {
      day,
      qualifies:
        dayTrades.length > 0 &&
        dayTrades.every((trade) => trade.exitReason !== "LIQUIDATION"),
    };
  });
  const disciplinedLeverage = days.map((day) => {
    const dayTrades = tradesForDay(trades, day);
    return {
      day,
      qualifies:
        dayTrades.length > 0 &&
        average(dayTrades.map((trade) => trade.leverage)) < 5,
    };
  });

  return [
    streak("active-day-streak", AchievementType.PARTICIPATION, active),
    streak(
      "no-liquidation-streak",
      AchievementType.RISK_CONTROL,
      noLiquidation,
    ),
    streak(
      "disciplined-leverage-streak",
      AchievementType.CONSISTENCY,
      disciplinedLeverage,
    ),
  ];
}

function evaluateAchievements(
  input: EngagementEvaluationInput,
  marketsTraded: readonly MarketSymbol[],
) {
  const earned: Record<string, boolean> = {
    "consistency-specialist":
      input.analytics.activeTradingDays >= 4 &&
      input.analytics.profitableActiveDayPercentage >= 0.6,
    "drawdown-defender":
      input.analytics.activeTradingDays > 0 &&
      input.analytics.maximumDrawdown < 0.1,
    "first-qualified-trade": input.analytics.qualifiedTradeCount > 0,
    "multi-market-trader": marketsTraded.length >= 2,
    "no-liquidation-finisher":
      input.analytics.activeTradingDays > 0 &&
      input.analytics.liquidationCount === 0,
    "risk-aware-trader":
      input.analytics.netPnl > 0 &&
      input.analytics.averageLeverage !== null &&
      input.analytics.averageLeverage < 5,
    "seven-day-participant": input.analytics.activeTradingDays >= 7,
  };

  return achievementDefinitions.map((definition) => ({
    ...definition,
    awardedAt: earned[definition.slug] ? input.competitionEndsAt : null,
    earned: earned[definition.slug] ?? false,
    explanation: earned[definition.slug]
      ? `${definition.title} earned through disciplined simulated participation.`
      : `${definition.title} not yet earned.`,
  }));
}

function streak(
  slug: StreakEvaluation["slug"],
  type: AchievementType,
  days: readonly { day: Date; qualifies: boolean }[],
): StreakEvaluation {
  let current = 0;
  let best = 0;
  let running = 0;
  let lastCountedAt: Date | null = null;

  for (const day of days) {
    if (day.qualifies) {
      running += 1;
      best = Math.max(best, running);
      lastCountedAt = day.day;
    } else {
      running = 0;
    }
  }

  current = days.at(-1)?.qualifies ? running : 0;

  return {
    bestCount: best,
    currentCount: current,
    explanation:
      "UTC days are counted once; missing days break the current streak and duplicate events do not add extra days.",
    lastCountedAt,
    slug,
    type,
  };
}

function meaningfulMarkets(
  trades: readonly NormalizedTrade[],
  supportedMarkets: readonly MarketSymbol[],
) {
  return supportedMarkets.filter((market) =>
    trades.some(
      (trade) =>
        trade.marketSymbol === market &&
        isQualifiedTrade(trade) &&
        trade.simulatedVolume > 0,
    ),
  );
}

function tradesForDay(trades: readonly NormalizedTrade[], day: Date) {
  const key = dayKey(day);
  return trades.filter((trade) => dayKey(trade.closedAt) === key);
}

function competitionDays(startsAt: Date, endsAt: Date) {
  const days: Date[] = [];
  const dayMs = 24 * 60 * 60 * 1000;
  const count = Math.ceil((endsAt.getTime() - startsAt.getTime()) / dayMs);

  for (let index = 0; index < count; index += 1) {
    days.push(new Date(startsAt.getTime() + index * dayMs));
  }

  return days;
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function average(values: readonly number[]) {
  return values.length === 0
    ? Number.POSITIVE_INFINITY
    : values.reduce((total, value) => total + value, 0) / values.length;
}
