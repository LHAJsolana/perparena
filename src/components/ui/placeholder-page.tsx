import { DisclaimerBanner } from "@/components/ui/disclaimer-banner";
import { DivisionBadge } from "@/components/ui/division-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { IntegrityBadge } from "@/components/ui/integrity-badge";
import { MetadataRow } from "@/components/ui/metadata-row";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableWrapper } from "@/components/ui/table-wrapper";

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  route: string;
};

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  route,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <DisclaimerBanner />

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard
          label="Simulated P&L"
          value="Pending"
          detail="No synthetic competition records yet."
          tone="info"
        />
        <MetricCard
          label="Competition score"
          value="Not scored"
          detail="Score component logic arrives later."
        />
        <MetricCard
          label="Integrity heuristic"
          value="Dormant"
          detail="No participant records to review."
          tone="warning"
        />
      </div>

      <Panel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="info">Designed placeholder</StatusBadge>
              <DivisionBadge division="Provisional" />
              <IntegrityBadge level="unreviewed" />
            </div>
            <p className="max-w-3xl text-sm leading-6 text-muted">
              This screen reserves the layout pattern for dense competition
              operations while keeping Phase 2 limited to shell and
              design-system work.
            </p>
          </div>
          <dl className="w-full min-w-0 lg:max-w-md">
            <MetadataRow label="Route" value={route} />
            <MetadataRow
              label="Data source"
              value="No database connection in Phase 2"
            />
            <MetadataRow
              label="Market data"
              value="No live or real market feed"
            />
          </dl>
        </div>
      </Panel>

      <TableWrapper label={`${title} placeholder table`}>
        <thead className="border-b border-border bg-background-elevated">
          <tr>
            {["Surface", "State", "Phase boundary"].map((heading) => (
              <th
                key={heading}
                className="px-4 py-3 font-mono text-xs uppercase text-subtle"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border/70">
            <td className="px-4 py-3 text-foreground">Analytics surface</td>
            <td className="px-4 py-3 font-mono text-info">Reserved</td>
            <td className="px-4 py-3 text-muted">Future approved phase</td>
          </tr>
          <tr>
            <td className="px-4 py-3 text-foreground">Synthetic records</td>
            <td className="px-4 py-3 font-mono text-warning">Unavailable</td>
            <td className="px-4 py-3 text-muted">No fake data introduced</td>
          </tr>
        </tbody>
      </TableWrapper>

      <EmptyState
        title="No synthetic data available"
        description="No simulated P&L, simulated volume, current equity, maximum drawdown, or competition score data has been introduced yet."
      />
    </div>
  );
}
