import type { ParticipantArchetype } from "@prisma/client";
import type { ParticipantAnalytics } from "@/features/analytics/types";

export type IntegrityAdjustment = {
  multiplier: number;
  reason: string;
};

export type ScoreContextParticipant = {
  participantId: string;
  archetype?: ParticipantArchetype | null;
  analytics: ParticipantAnalytics;
  firstQualifiedAt: Date | null;
  integrityAdjustment?: IntegrityAdjustment;
};

export type ScoreComponent = {
  key:
    | "performance"
    | "riskManagement"
    | "consistency"
    | "qualifiedActivity"
    | "marketDiversity";
  score: number;
  max: number;
  normalized: Record<string, number>;
  inputs: Record<string, number | null>;
  explanation: string;
};

export type ParticipantScore = {
  participantId: string;
  archetype?: ParticipantArchetype | null;
  scoringVersion: string;
  rawMetricInputs: ParticipantAnalytics;
  components: {
    performance: ScoreComponent;
    riskManagement: ScoreComponent;
    consistency: ScoreComponent;
    qualifiedActivity: ScoreComponent;
    marketDiversity: ScoreComponent;
  };
  penalties: Record<string, number>;
  rawTotal: number;
  integrityAdjustment: IntegrityAdjustment;
  finalTotal: number;
  explanations: string[];
  firstQualifiedAt: Date | null;
};
