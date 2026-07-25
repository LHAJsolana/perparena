import { ZodError } from "zod";
import {
  recalculationRequestSchema,
  runDemoRecalculationService,
} from "@/features/recalculation/server/service";
import { noStoreHeaders } from "@/lib/api/cache";
import { apiError, apiOk, apiUnhandledError } from "@/lib/api/responses";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = recalculationRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "BAD_REQUEST",
        "Invalid recalculation request.",
        400,
        parsed.error.flatten().fieldErrors,
      );
    }

    const summary = await runDemoRecalculationService(parsed.data);

    return apiOk(summary, { headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(
        "BAD_REQUEST",
        "Invalid recalculation request.",
        400,
        error.flatten().fieldErrors,
      );
    }

    if (error instanceof Error && error.message.includes("disabled")) {
      return apiError("FORBIDDEN", "Admin mutations are disabled.", 403);
    }

    return apiUnhandledError();
  }
}
