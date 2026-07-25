import { IntegrityStatus } from "@prisma/client";
import { ErrorMessage } from "@/components/ui/error-message";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { WalletDisplay } from "@/components/ui/wallet-display";
import { reviewIntegrityFlagAction } from "@/features/admin/actions";
import {
  AdminActionForm,
  AdminField,
  AdminNotice,
} from "@/features/admin/components";
import { getAdminMutationMode } from "@/features/admin/protection";
import { listIntegrityQueueService } from "@/features/admin/server/service";

export const dynamic = "force-dynamic";

export default async function AdminIntegrityPage() {
  const result = await listIntegrityQueueService();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin integrity"
        title="Integrity-review queue"
        description="Review simulation-based flags, inspect public-safe evidence, and update review status in guarded mutation mode."
      />
      <AdminNotice mode={getAdminMutationMode()} />

      {result.status === "unavailable" ? (
        <ErrorMessage
          title="Integrity queue unavailable"
          message={result.message}
        />
      ) : result.data.length === 0 ? (
        <EmptyState
          title="No integrity flags"
          description="Run integrity recalculation after seeding synthetic competition data."
        />
      ) : (
        <div className="grid gap-4">
          {result.data.map((flag) => (
            <Panel key={flag.flagId}>
              <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone="warning">{flag.severity}</StatusBadge>
                    <StatusBadge tone="info">{flag.status}</StatusBadge>
                    <StatusBadge tone="neutral">
                      {flag.publicStatus}
                    </StatusBadge>
                  </div>
                  <div className="mt-3">
                    <WalletDisplay wallet={flag.wallet} />
                  </div>
                  <SectionHeading title={flag.type} description={flag.reason} />
                  <dl className="mt-3 grid gap-2 sm:grid-cols-3">
                    {Object.entries(flag.evidence)
                      .filter(([key]) =>
                        [
                          "observedValue",
                          "threshold",
                          "impact",
                          "affectsScoring",
                        ].includes(key),
                      )
                      .map(([key, value]) => (
                        <div className="min-w-0" key={key}>
                          <dt className="font-mono text-[11px] uppercase text-subtle">
                            {key}
                          </dt>
                          <dd className="break-words font-mono text-sm text-foreground">
                            {String(value)}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </div>
                <AdminActionForm
                  action={reviewIntegrityFlagAction}
                  confirmMessage="Update this integrity flag review status?"
                  submitLabel="Save review"
                >
                  <input name="flagId" type="hidden" value={flag.flagId} />
                  <AdminField label="Review status">
                    <Select name="status" defaultValue={flag.status}>
                      <option value={IntegrityStatus.REVIEWING}>
                        Mark reviewed
                      </option>
                      <option value={IntegrityStatus.DISMISSED}>Dismiss</option>
                      <option value={IntegrityStatus.CONFIRMED}>
                        Confirm score limitation
                      </option>
                    </Select>
                  </AdminField>
                  <AdminField
                    label="Review note"
                    hint="Do not include secrets or accusations."
                  >
                    <Input
                      name="note"
                      placeholder="Non-sensitive review note"
                    />
                  </AdminField>
                </AdminActionForm>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
