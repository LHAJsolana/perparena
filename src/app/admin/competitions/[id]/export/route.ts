import { exportCompetitionResultsService } from "@/features/admin/server/service";
import { apiError, apiUnhandledError, apiOk } from "@/lib/api/responses";

type ExportRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: ExportRouteProps) {
  try {
    const { id } = await params;
    const payload = await exportCompetitionResultsService(id);

    if (!payload) {
      return apiError("NOT_FOUND", "Competition was not found.", 404);
    }

    return apiOk(payload, {
      headers: {
        "content-disposition": `attachment; filename="perparena-${id}-synthetic-results.json"`,
      },
    });
  } catch {
    return apiUnhandledError();
  }
}
