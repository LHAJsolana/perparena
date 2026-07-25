import { Button } from "@/components/ui/button";
import { DisclaimerBanner } from "@/components/ui/disclaimer-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  CompetitionMetrics,
  CompetitionStatusLine,
  DatabaseUnavailableState,
  TopThreePreview,
} from "@/features/competitions/dashboard/components";
import {
  formatCompactCurrency,
  formatDateRange,
  marketLabel,
} from "@/features/competitions/dashboard/format";
import { getHomepageCompetitionService } from "@/features/competitions/server/service";
import { appConfig } from "@/lib/config/app-config";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const result = await getHomepageCompetitionService();

  return (
    <div className="space-y-10">
      <section className="grid gap-8 py-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
        <PageHeader
          eyebrow="Synthetic competition dashboard"
          title="Risk-adjusted simulated trading competition analytics"
          description="PerpArena rewards competition score, consistency, and risk management across synthetic trades. It is not an exchange and never executes real trades."
        />
        <Panel>
          <p className="font-mono text-xs uppercase text-subtle">
            Product thesis
          </p>
          <p className="mt-3 text-lg font-semibold leading-7 text-foreground">
            Trading competitions should reward skill, consistency, and risk
            management, not only account size, excessive leverage, artificial
            volume, or one lucky trade.
          </p>
        </Panel>
      </section>

      {result.status === "unavailable" ? (
        <DatabaseUnavailableState message={result.message} />
      ) : (
        <>
          <Panel>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <SectionHeading
                  title={result.data.name}
                  description="Primary seeded synthetic competition."
                />
                <CompetitionStatusLine competition={result.data} />
              </div>
              <Button href={`/competitions/${result.data.slug}`}>
                View leaderboard
              </Button>
            </div>
            <div className="mt-5">
              <CompetitionMetrics competition={result.data} />
            </div>
          </Panel>

          <section className="space-y-4">
            <SectionHeading
              title="Top-three preview"
              description="Ranked by deterministic competition score with stable tie breakers."
            />
            <TopThreePreview rows={result.data.topThree} />
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel>
              <SectionHeading
                title="Scoring preview"
                description="Performance, risk management, consistency, qualified activity, and market diversity contribute to the 100-point competition score."
              />
            </Panel>
            <Panel>
              <SectionHeading
                title="Integrity preview"
                description="Integrity heuristics surface simulation-based signals and behavior requiring review without claiming conclusive fraud detection."
              />
            </Panel>
            <Panel>
              <SectionHeading
                title="Divisions"
                description={result.data.divisions
                  .map(
                    (division) =>
                      `${division.division}: ${division.participants}`,
                  )
                  .join(" / ")}
              />
            </Panel>
          </div>

          <Panel>
            <SectionHeading
              title="How it works"
              description={`${appConfig.productName} reads seeded PostgreSQL records, recalculates analytics and scores through deterministic engines, and presents synthetic rankings with reviewable integrity signals.`}
            />
            <dl className="mt-4 grid gap-3 text-sm text-muted md:grid-cols-3">
              <div>
                <dt className="font-mono text-xs uppercase text-subtle">
                  Date range
                </dt>
                <dd>
                  {formatDateRange(result.data.startsAt, result.data.endsAt)}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase text-subtle">
                  Markets
                </dt>
                <dd>{result.data.markets.map(marketLabel).join(", ")}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase text-subtle">
                  Simulated volume
                </dt>
                <dd>{formatCompactCurrency(result.data.simulatedVolume)}</dd>
              </div>
            </dl>
          </Panel>
        </>
      )}

      <section className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <EmptyState
          title="Explore the active simulation"
          description="Review the public competition dashboard, filters, leaderboard, score methodology summary, and integrity heuristic notes."
        />
        <Button href="/competitions">Open competitions</Button>
      </section>

      <DisclaimerBanner />
    </div>
  );
}
