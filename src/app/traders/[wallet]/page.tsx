import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import {
  TraderProfileView,
  TraderUnavailableState,
} from "@/features/traders/profile/components";
import { parseTraderProfileQuery } from "@/features/traders/profile/query";
import { getTraderProfileService } from "@/features/traders/server/service";

export const dynamic = "force-dynamic";

type TraderPageProps = {
  params: Promise<{
    wallet: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TraderPage({
  params,
  searchParams,
}: TraderPageProps) {
  const { wallet } = await params;
  const query = parseTraderProfileQuery(await searchParams);
  const result = await getTraderProfileService(wallet, query);

  if (result.status === "unavailable") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Trader profile"
          title="Synthetic participant profile"
          description="Participant analytics require the approved PostgreSQL simulation database."
        />
        <TraderUnavailableState message={result.message} />
      </div>
    );
  }

  if (result.status === "not_found") {
    notFound();
  }

  return <TraderProfileView profile={result.data} />;
}
