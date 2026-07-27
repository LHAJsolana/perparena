import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { SimulationDisclaimer } from "@/components/ui/simulation-disclaimer";
import { AdminNotice } from "@/features/admin/components";
import { getAdminMutationMode } from "@/features/admin/protection";
import {
  listAdminCompetitionsService,
  listIntegrityQueueService,
} from "@/features/admin/server/service";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [competitions, integrity] = await Promise.all([
    listAdminCompetitionsService(),
    listIntegrityQueueService(),
  ]);
  const mode = getAdminMutationMode();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Demonstration control center"
        description="Safe portfolio admin surface for competition configuration, synthetic exports, and integrity heuristic review."
      />
      <AdminNotice mode={mode} />
      <Panel>
        <SimulationDisclaimer />
      </Panel>

      {competitions.status === "unavailable" ? (
        <ErrorMessage
          title="Admin data unavailable"
          message={competitions.message}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard
            label="Competitions"
            value={String(competitions.data.length)}
          />
          <MetricCard
            label="Review flags"
            value={
              integrity.status === "ready"
                ? String(integrity.data.length)
                : "n/a"
            }
            tone="warning"
          />
          <MetricCard
            label="Mutation mode"
            value={mode.enabled ? "Enabled" : "Read-only"}
          />
        </div>
      )}

      <Panel>
        <SectionHeading
          title="Admin workflows"
          description="Configure drafts, inspect seeded competitions, review integrity signals, and export synthetic results."
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button href="/admin/competitions">Competitions</Button>
          <Button href="/admin/competitions/new" variant="secondary">
            New draft
          </Button>
          <Button href="/admin/integrity" variant="secondary">
            Integrity queue
          </Button>
        </div>
      </Panel>
    </div>
  );
}
