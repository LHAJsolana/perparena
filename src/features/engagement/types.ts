import type { AchievementType, MarketSymbol, QuestType } from "@prisma/client";
import type {
  ParticipantAnalytics,
  RawAnalyticsTrade,
} from "@/features/analytics/types";

export const ENGAGEMENT_VERSION = "perparena-engagement-v1";

export type EngagementQuestSlug =
  | "daily-qualified-trade"
  | "daily-two-markets"
  | "daily-drawdown-under-10"
  | "daily-average-leverage-under-5"
  | "daily-no-liquidation"
  | "competition-four-active-days"
  | "competition-ten-qualified-trades"
  | "competition-no-liquidation"
  | "competition-positive-risk-adjusted"
  | "competition-all-markets";

export type EngagementQuestDefinition = {
  slug: EngagementQuestSlug;
  name: string;
  description: string;
  type: QuestType;
  cadence: "daily-repeatable" | "competition-wide";
  target: number;
  eligibilityRules: string[];
  badge?: string;
  engagementPoints?: number;
  version: string;
};

export type QuestEvaluation = {
  slug: EngagementQuestSlug;
  progress: number;
  target: number;
  completed: boolean;
  completedAt: Date | null;
  explanation: string;
};

export type StreakSlug =
  "active-day-streak" | "no-liquidation-streak" | "disciplined-leverage-streak";

export type StreakEvaluation = {
  slug: StreakSlug;
  type: AchievementType;
  currentCount: number;
  bestCount: number;
  lastCountedAt: Date | null;
  explanation: string;
};

export type AchievementSlug =
  | "first-qualified-trade"
  | "multi-market-trader"
  | "drawdown-defender"
  | "no-liquidation-finisher"
  | "consistency-specialist"
  | "seven-day-participant"
  | "risk-aware-trader";

export type AchievementDefinition = {
  slug: AchievementSlug;
  title: string;
  description: string;
  type: AchievementType;
  criteria: string[];
  version: string;
};

export type AchievementEvaluation = AchievementDefinition & {
  earned: boolean;
  awardedAt: Date | null;
  explanation: string;
};

export type EngagementEvaluationInput = {
  analytics: ParticipantAnalytics;
  competitionEndsAt: Date;
  competitionStartsAt: Date;
  supportedMarkets: readonly MarketSymbol[];
  trades: readonly RawAnalyticsTrade[];
};

export type EngagementEvaluation = {
  version: string;
  quests: QuestEvaluation[];
  streaks: StreakEvaluation[];
  achievements: AchievementEvaluation[];
};
