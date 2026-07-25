import { z } from "zod";
import { getTraderSummaryService } from "@/features/traders/server/service";
import { publicReadCacheHeaders } from "@/lib/api/cache";
import { apiError, apiOk, apiUnhandledError } from "@/lib/api/responses";

type TraderSummaryRouteProps = {
  params: Promise<{ wallet: string }>;
};

const paramsSchema = z.object({
  wallet: z.string().trim().min(8).max(120),
});

export async function GET(
  _request: Request,
  { params }: TraderSummaryRouteProps,
) {
  try {
    const parsedParams = paramsSchema.safeParse(await params);

    if (!parsedParams.success) {
      return apiError("BAD_REQUEST", "Invalid synthetic wallet.", 400);
    }

    const result = await getTraderSummaryService(parsedParams.data.wallet);

    if (result.status === "unavailable") {
      return apiError("UNAVAILABLE", result.message, 503);
    }

    if (result.status === "not_found") {
      return apiError("NOT_FOUND", "Synthetic participant was not found.", 404);
    }

    return apiOk(result.data, { headers: publicReadCacheHeaders });
  } catch {
    return apiUnhandledError();
  }
}
