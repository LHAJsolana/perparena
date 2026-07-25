import { getReadinessReport } from "@/features/health/readiness";
import { noStoreHeaders } from "@/lib/api/cache";
import { apiOk, apiUnhandledError } from "@/lib/api/responses";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const report = await getReadinessReport();

    return apiOk(report, {
      headers: noStoreHeaders,
      status: report.ok ? 200 : 503,
    });
  } catch {
    return apiUnhandledError();
  }
}
