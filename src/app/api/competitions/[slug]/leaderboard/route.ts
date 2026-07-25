import { z } from "zod";
import { parseLeaderboardQuery } from "@/features/competitions/dashboard/query";
import { getLeaderboardService } from "@/features/competitions/server/service";
import { publicReadCacheHeaders } from "@/lib/api/cache";
import { apiError, apiOk, apiUnhandledError } from "@/lib/api/responses";
import { searchParamsToRecord } from "@/lib/api/search-params";

type LeaderboardRouteProps = {
  params: Promise<{ slug: string }>;
};

const paramsSchema = z.object({
  slug: z.string().trim().min(1).max(120),
});

export async function GET(request: Request, { params }: LeaderboardRouteProps) {
  try {
    const parsedParams = paramsSchema.safeParse(await params);

    if (!parsedParams.success) {
      return apiError("BAD_REQUEST", "Invalid competition slug.", 400);
    }

    const url = new URL(request.url);
    const query = parseLeaderboardQuery(searchParamsToRecord(url.searchParams));
    const result = await getLeaderboardService(parsedParams.data.slug, query);

    if (result.status === "unavailable") {
      return apiError("UNAVAILABLE", result.message, 503);
    }

    if (!result.data) {
      return apiError("NOT_FOUND", "Competition was not found.", 404);
    }

    return apiOk(result.data, { headers: publicReadCacheHeaders });
  } catch {
    return apiUnhandledError();
  }
}
