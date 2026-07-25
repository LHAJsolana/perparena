import { z } from "zod";
import { recalculateCompetitionAnalytics } from "@/features/analytics/persistence";
import { recalculateCompetitionEngagement } from "@/features/engagement/persistence";
import { recalculateCompetitionIntegrity } from "@/features/integrity/persistence";
import { recalculateCompetitionScores } from "@/features/scoring/persistence";
import { assertAdminMutationAllowed } from "@/features/admin/protection";
import { prisma } from "@/lib/db/prisma";

export const recalculationRequestSchema = z.object({
  competitionSlug: z.string().trim().min(1).max(120),
  kind: z.enum(["analytics", "scores", "integrity", "engagement"]),
});

export type RecalculationRequest = z.infer<typeof recalculationRequestSchema>;

export async function runDemoRecalculationService(
  request: RecalculationRequest,
) {
  assertAdminMutationAllowed();

  switch (request.kind) {
    case "analytics":
      return recalculateCompetitionAnalytics(prisma, request.competitionSlug);
    case "scores":
      return recalculateCompetitionScores(prisma, request.competitionSlug);
    case "integrity":
      return recalculateCompetitionIntegrity(prisma, request.competitionSlug);
    case "engagement":
      return recalculateCompetitionEngagement(prisma, request.competitionSlug);
  }
}
