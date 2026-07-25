import { apiOk } from "@/lib/api/responses";
import { noStoreHeaders } from "@/lib/api/cache";

export const dynamic = "force-dynamic";

export function GET() {
  return apiOk(
    {
      checkedAt: new Date().toISOString(),
      service: "perparena",
      status: "available",
    },
    { headers: noStoreHeaders },
  );
}
