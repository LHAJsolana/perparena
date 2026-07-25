import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DisclaimerBanner } from "@/components/ui/disclaimer-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  CompetitionMetrics,
  CompetitionStatusBadge,
  DatabaseUnavailableState,
} from "@/features/competitions/dashboard/components";
import {
  formatDateRange,
  marketLabel,
} from "@/features/competitions/dashboard/format";
import { listCompetitionsService } from "@/features/competitions/server/service";

export const dynamic = "force-dynamic";

export default async function CompetitionsPage() {
  const result = await listCompetitionsService();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Competitions"
        title="Synthetic competition index"
        description="Seeded simulated competitions are listed from PostgreSQL with status, market coverage, participant counts, and scoring metadata."
      />

      {result.status === "unavailable" ? (
        <DatabaseUnavailableState message={result.message} />
      ) : result.data.length === 0 ? (
        <EmptyState
          title="No competitions found"
          description="Seed the approved development database before opening public competition dashboards."
        />
      ) : (
        <div className="grid gap-4">
          {result.data.map((competition) => (
            <Panel key={competition.id}>
              <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CompetitionStatusBadge status={competition.status} />
                    <span className="font-mono text-xs uppercase text-subtle">
                      {competition.scoringVersion}
                    </span>
                  </div>
                  <SectionHeading
                    title={competition.name}
                    description={formatDateRange(
                      competition.startsAt,
                      competition.endsAt,
                    )}
                  />
                  <p className="font-mono text-sm text-muted">
                    {competition.markets.map(marketLabel).join(" / ")}
                  </p>
                </div>
                <div className="flex items-start">
                  <Button href={`/competitions/${competition.slug}`}>
                    Details
                  </Button>
                </div>
              </div>
              <div className="mt-5">
                <CompetitionMetrics competition={competition} />
              </div>
              <Link
                className="mt-4 inline-flex font-mono text-xs uppercase text-accent hover:text-accent-strong"
                href={`/competitions/${competition.slug}`}
              >
                Open competition detail
              </Link>
            </Panel>
          ))}
        </div>
      )}

      <DisclaimerBanner />
    </div>
  );
}
