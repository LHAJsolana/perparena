import type {
  IntegrityFlagType,
  IntegritySeverity,
  IntegrityStatus,
  ParticipantArchetype,
} from "@prisma/client";
import type {
  ParticipantAnalytics,
  RawAnalyticsTrade,
} from "@/features/analytics/types";

export type DerivedIntegrityStatus =
  "VERIFIED" | "WARNING" | "UNDER_REVIEW" | "SCORE_LIMITED";

export type IntegrityImpact = "informational" | "warning" | "score_adjusting";

export type IntegrityParticipantInput = {
  participantId: string;
  archetype?: ParticipantArchetype | null;
  analytics: ParticipantAnalytics;
  trades: readonly RawAnalyticsTrade[];
  startsAt: Date;
  endsAt: Date;
};

export type IntegrityFlagSignal = {
  id: string;
  type: IntegrityFlagType;
  severity: IntegritySeverity;
  participantId: string;
  observedValue: number;
  threshold: number;
  explanation: string;
  evidence: Record<string, string | number | boolean>;
  detectedAt: Date;
  engineVersion: string;
  affectsScoring: boolean;
  impact: IntegrityImpact;
  reviewStatus: IntegrityStatus;
};

export type IntegrityAssessment = {
  participantId: string;
  archetype?: ParticipantArchetype | null;
  status: DerivedIntegrityStatus;
  flags: IntegrityFlagSignal[];
  multiplier: number;
  rawPenalty: number;
  cappedPenalty: number;
  explanation: string;
};
