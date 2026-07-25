import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableWrapper } from "@/components/ui/table-wrapper";
import { AdminNotice } from "@/features/admin/components";
import { getAdminMutationMode } from "@/features/admin/protection";
import { listAdminCompetitionsService } from "@/features/admin/server/service";
import { formatDateRange } from "@/features/competitions/dashboard/format";

export const dynamic = "force-dynamic";

export default async function AdminCompetitionsPage() {
  const result = await listAdminCompetitionsService();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin competitions"
        title="Competition configuration"
        description="Review seeded competitions and create draft configurations in development mutation mode."
      />
      <AdminNotice mode={getAdminMutationMode()} />
      <Button href="/admin/competitions/new">Create draft competition</Button>

      {result.status === "unavailable" ? (
        <ErrorMessage
          title="Competitions unavailable"
          message={result.message}
        />
      ) : result.data.length === 0 ? (
        <EmptyState
          title="No competitions"
          description="Seed or create a draft competition before reviewing admin configuration."
        />
      ) : (
        <Panel>
          <TableWrapper label="Admin competition list">
            <thead className="border-b border-border bg-background-elevated">
              <tr>
                {[
                  "Name",
                  "Status",
                  "Dates",
                  "Markets",
                  "Participants",
                  "Version",
                  "Detail",
                ].map((heading) => (
                  <th
                    className="px-3 py-3 font-mono text-xs uppercase text-subtle"
                    key={heading}
                    scope="col"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.data.map((competition) => (
                <tr className="border-b border-border/70" key={competition.id}>
                  <td className="px-3 py-3 text-foreground">
                    {competition.name}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge tone="info">{competition.status}</StatusBadge>
                  </td>
                  <td className="px-3 py-3 font-mono text-sm text-muted">
                    {formatDateRange(competition.startsAt, competition.endsAt)}
                  </td>
                  <td className="px-3 py-3 font-mono text-sm text-muted">
                    {competition.markets.join(" / ")}
                  </td>
                  <td className="px-3 py-3 font-mono text-sm text-muted">
                    {competition.participants}
                  </td>
                  <td className="px-3 py-3 font-mono text-sm text-muted">
                    {competition.scoringVersion}
                  </td>
                  <td className="px-3 py-3">
                    <Button
                      href={`/admin/competitions/${competition.id}`}
                      variant="secondary"
                    >
                      Open
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </Panel>
      )}
    </div>
  );
}
