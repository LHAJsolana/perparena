"use server";

import { revalidatePath } from "next/cache";
import {
  changeCompetitionStatusService,
  createDraftCompetitionService,
  exportCompetitionResultsService,
  getCompetitionDatesForStatusService,
  reviewIntegrityFlagService,
} from "@/features/admin/server/service";
import { runDemoRecalculationService } from "@/features/recalculation/server/service";
import { assertAdminMutationAllowed } from "@/features/admin/protection";
import {
  draftCompetitionSchema,
  integrityReviewSchema,
  scoringWeightsSchema,
  statusChangeSchema,
} from "@/features/admin/validation";

export type AdminActionState = {
  message: string;
  ok: boolean;
};

export async function createDraftCompetitionAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    assertAdminMutationAllowed();
    const parsed = draftCompetitionSchema.parse({
      description: stringValue(formData, "description"),
      divisions: formData.getAll("divisions"),
      endsAt: stringValue(formData, "endsAt"),
      markets: formData.getAll("markets"),
      name: stringValue(formData, "name"),
      questTitles: formData.getAll("questTitles").filter(Boolean),
      scoringVersion: stringValue(formData, "scoringVersion"),
      slug: stringValue(formData, "slug"),
      startsAt: stringValue(formData, "startsAt"),
      weights: {
        consistency: stringValue(formData, "consistency"),
        marketDiversity: stringValue(formData, "marketDiversity"),
        performance: stringValue(formData, "performance"),
        qualifiedActivity: stringValue(formData, "qualifiedActivity"),
        riskManagement: stringValue(formData, "riskManagement"),
        scoringVersion: stringValue(formData, "scoringVersion"),
      },
    });

    await createDraftCompetitionService(parsed);

    revalidatePath("/admin");
    revalidatePath("/admin/competitions");
    return { message: "Draft competition created.", ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function changeCompetitionStatusAction(
  competitionId: string,
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    assertAdminMutationAllowed();
    const competition =
      await getCompetitionDatesForStatusService(competitionId);

    if (!competition) {
      throw new Error("Competition was not found.");
    }

    const parsed = statusChangeSchema.parse({
      endsAt: competition.endsAt,
      startsAt: competition.startsAt,
      status: stringValue(formData, "status"),
    });

    await changeCompetitionStatusService(competitionId, parsed);
    revalidatePath(`/admin/competitions/${competitionId}`);
    return { message: "Competition status updated.", ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function recalculateScoresAction(
  competitionSlug: string,
): Promise<AdminActionState> {
  try {
    assertAdminMutationAllowed();
    await runDemoRecalculationService({
      competitionSlug,
      kind: "scores",
    });
    revalidatePath("/admin");
    return { message: "Scores recalculated.", ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function recalculateScoresFormAction(
  _state: AdminActionState,
  formData: FormData,
) {
  return recalculateScoresAction(stringValue(formData, "competitionSlug"));
}

export async function recalculateIntegrityAction(
  competitionSlug: string,
): Promise<AdminActionState> {
  try {
    assertAdminMutationAllowed();
    await runDemoRecalculationService({
      competitionSlug,
      kind: "integrity",
    });
    revalidatePath("/admin/integrity");
    return { message: "Integrity heuristics recalculated.", ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function recalculateIntegrityFormAction(
  _state: AdminActionState,
  formData: FormData,
) {
  return recalculateIntegrityAction(stringValue(formData, "competitionSlug"));
}

export async function recalculateEngagementAction(
  competitionSlug: string,
): Promise<AdminActionState> {
  try {
    assertAdminMutationAllowed();
    await runDemoRecalculationService({
      competitionSlug,
      kind: "engagement",
    });
    revalidatePath("/admin");
    return { message: "Engagement records recalculated.", ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function recalculateEngagementFormAction(
  _state: AdminActionState,
  formData: FormData,
) {
  return recalculateEngagementAction(stringValue(formData, "competitionSlug"));
}

export async function reviewIntegrityFlagAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    assertAdminMutationAllowed();
    const parsed = integrityReviewSchema.parse({
      flagId: stringValue(formData, "flagId"),
      note: stringValue(formData, "note"),
      status: stringValue(formData, "status"),
    });
    await reviewIntegrityFlagService(parsed);
    revalidatePath("/admin/integrity");
    return { message: "Integrity flag review updated.", ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function validateScoringWeightsAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    scoringWeightsSchema.parse({
      consistency: stringValue(formData, "consistency"),
      marketDiversity: stringValue(formData, "marketDiversity"),
      performance: stringValue(formData, "performance"),
      qualifiedActivity: stringValue(formData, "qualifiedActivity"),
      riskManagement: stringValue(formData, "riskManagement"),
      scoringVersion: stringValue(formData, "scoringVersion"),
    });

    return {
      message:
        "Configuration is valid. Changing weights must create a new scoring version.",
      ok: true,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function exportCompetitionResultsAction(id: string) {
  const payload = await exportCompetitionResultsService(id);

  if (!payload) {
    throw new Error("Competition was not found.");
  }

  return JSON.stringify(payload, null, 2);
}

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function actionError(error: unknown): AdminActionState {
  if (error instanceof Error) {
    return { message: error.message, ok: false };
  }

  return { message: "Admin action failed.", ok: false };
}
