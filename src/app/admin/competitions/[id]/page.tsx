import { notFound } from "next/navigation";
import { CompetitionStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import {
  changeCompetitionStatusAction,
  recalculateEngagementFormAction,
  recalculateIntegrityFormAction,
  recalculateScoresFormAction,
} from "@/features/admin/actions";
import {
  AdminActionForm,
  AdminField,
  AdminNotice,
} from "@/features/admin/components";
import { getAdminMutationMode } from "@/features/admin/protection";
import { getAdminCompetitionService } from "@/features/admin/server/service";
import { formatDateRange } from "@/features/competitions/dashboard/format";

export const dynamic = "force-dynamic";

type AdminCompetitionDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCompetitionDetailPage({
  params,
}: AdminCompetitionDetailProps) {
  const { id } = await params;
  const result = await getAdminCompetitionService(id);

  if (result.status === "unavailable") {
    return (
      <ErrorMessage title="Competition unavailable" message={result.message} />
    );
  }

  if (!result.data) {
    notFound();
  }

  const competition = result.data;
  const statusAction = changeCompetitionStatusAction.bind(null, competition.id);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin competition"
        title={competition.name}
        description="Review configuration, run guarded recalculations, change status, and export synthetic results."
      />
      <AdminNotice mode={getAdminMutationMode()} />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Status" value={competition.status} tone="info" />
        <MetricCard
          label="Participants"
          value={String(competition.participants)}
        />
        <MetricCard label="Markets" value={competition.markets.join(" / ")} />
        <MetricCard
          label="Scoring version"
          value={competition.scoringVersion}
        />
      </div>

      <Panel>
        <SectionHeading
          title="Configuration"
          description={`${formatDateRange(competition.startsAt, competition.endsAt)}. Timezone policy is UTC for all admin validation.`}
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <AdminActionForm
            action={statusAction}
            confirmMessage="Change this competition status in the configured development database?"
            submitLabel="Update status"
          >
            <AdminField label="Competition status">
              <Select name="status" defaultValue={competition.status}>
                {Object.values(CompetitionStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </AdminField>
          </AdminActionForm>
          <div className="space-y-3">
            <Button
              href={`/admin/competitions/${competition.id}/export`}
              variant="secondary"
            >
              Export synthetic results JSON
            </Button>
            <Button
              href={`/competitions/${competition.slug}`}
              variant="secondary"
            >
              Public dashboard
            </Button>
          </div>
        </div>
      </Panel>

      <Panel>
        <SectionHeading
          title="Recalculation actions"
          description="These actions require confirmation and development mutation mode. They do not mutate historical leaderboard snapshots silently."
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <AdminActionForm
            action={recalculateScoresFormAction}
            confirmMessage="Recalculate scores for this synthetic competition?"
            submitLabel="Recalculate scores"
          >
            <input
              name="competitionSlug"
              type="hidden"
              value={competition.slug}
            />
          </AdminActionForm>
          <AdminActionForm
            action={recalculateIntegrityFormAction}
            confirmMessage="Recalculate integrity heuristics for this synthetic competition?"
            submitLabel="Recalculate integrity"
          >
            <input
              name="competitionSlug"
              type="hidden"
              value={competition.slug}
            />
          </AdminActionForm>
          <AdminActionForm
            action={recalculateEngagementFormAction}
            confirmMessage="Recalculate engagement records for this synthetic competition?"
            submitLabel="Recalculate engagement"
          >
            <input
              name="competitionSlug"
              type="hidden"
              value={competition.slug}
            />
          </AdminActionForm>
        </div>
      </Panel>
    </div>
  );
}
