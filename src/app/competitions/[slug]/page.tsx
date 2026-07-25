import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DisclaimerBanner } from "@/components/ui/disclaimer-banner";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  CompetitionFilterForm,
  CompetitionMetrics,
  CompetitionStatusLine,
  DatabaseUnavailableState,
  Leaderboard,
} from "@/features/competitions/dashboard/components";
import {
  formatDateRange,
  marketLabel,
} from "@/features/competitions/dashboard/format";
import { parseLeaderboardQuery } from "@/features/competitions/dashboard/query";
import { getCompetitionService } from "@/features/competitions/server/service";

export const dynamic = "force-dynamic";

type CompetitionPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CompetitionPage({
  params,
  searchParams,
}: CompetitionPageProps) {
  const { slug } = await params;
  const query = parseLeaderboardQuery(await searchParams);
  const result = await getCompetitionService(slug, query);

  if (result.status === "unavailable") {
    return <DatabaseUnavailableState message={result.message} />;
  }

  if (!result.data) {
    notFound();
  }

  const dashboard = result.data;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Competition detail"
        title={dashboard.name}
        description="Public dashboard for seeded synthetic participants, simulated performance, risk-adjusted competition score, and integrity heuristic status."
      />
      <CompetitionStatusLine competition={dashboard} />
      <CompetitionMetrics competition={dashboard} />

      <Panel>
        <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
          <SectionHeading
            title="Leaderboard controls"
            description="Filters are validated server-side and persisted in the URL."
          />
          <Button href="/competitions" variant="secondary">
            All competitions
          </Button>
        </div>
        <div className="mt-5">
          <CompetitionFilterForm query={query} />
        </div>
      </Panel>

      <section className="space-y-4">
        <SectionHeading
          title="Leaderboard"
          description={`${dashboard.leaderboard.totalRows} matching synthetic participants. Stable ranking uses score, lower maximum drawdown, higher simulated net P&L, wallet, and participant ID.`}
        />
        <Leaderboard dashboard={dashboard} query={query} />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel>
          <SectionHeading
            title="Score methodology"
            description="Competition score combines performance, risk management, consistency, qualified activity, and market diversity. Raw account size is not enough to dominate ranking."
          />
        </Panel>
        <Panel>
          <SectionHeading
            title="Quest preview"
            description={
              dashboard.questPreview.length
                ? dashboard.questPreview
                    .map(
                      (quest) =>
                        `${quest.title}: ${quest.completedCount} completed (${quest.version})`,
                    )
                    .join(" / ")
                : "Run engagement recalculation to create transparent quest records."
            }
          />
        </Panel>
        <Panel>
          <SectionHeading
            title="Integrity explanation"
            description="Integrity status reflects simulation-based signals and behavior requiring review. It is not a public accusation or conclusive fraud detection."
          />
        </Panel>
      </div>

      <Panel>
        <SectionHeading
          title="Competition metadata"
          description={`${formatDateRange(dashboard.startsAt, dashboard.endsAt)} / ${dashboard.markets.map(marketLabel).join(", ")}`}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {dashboard.divisions.map((division) => (
            <span
              className="rounded-sm border border-border bg-background-elevated px-3 py-2 font-mono text-xs text-muted"
              key={division.division}
            >
              {division.division}: {division.participants}
            </span>
          ))}
        </div>
      </Panel>

      <DisclaimerBanner />
    </div>
  );
}
