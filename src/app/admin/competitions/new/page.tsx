import { Division, MarketSymbol } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import {
  AdminActionForm,
  AdminCheckbox,
  AdminCheckboxGroup,
  AdminField,
  AdminNotice,
} from "@/features/admin/components";
import { createDraftCompetitionAction } from "@/features/admin/actions";
import { getAdminMutationMode } from "@/features/admin/protection";

export default function NewAdminCompetitionPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin draft"
        title="Create draft competition"
        description="Draft creation is disabled unless development mutation mode is explicitly enabled."
      />
      <AdminNotice mode={getAdminMutationMode()} />
      <Panel>
        <AdminActionForm
          action={createDraftCompetitionAction}
          confirmMessage="Create a draft synthetic competition in the configured development database?"
          submitLabel="Create draft"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <AdminField label="Name" hint="Public synthetic competition name.">
              <Input name="name" required defaultValue="Draft Perps Arena" />
            </AdminField>
            <AdminField
              label="Slug"
              error="Use lowercase letters, numbers, and dashes."
            >
              <Input name="slug" required defaultValue="draft-perps-arena" />
            </AdminField>
            <AdminField label="Start date" hint="UTC date policy.">
              <Input name="startsAt" required type="datetime-local" />
            </AdminField>
            <AdminField label="End date" error="End must be after start.">
              <Input name="endsAt" required type="datetime-local" />
            </AdminField>
            <AdminField
              label="Scoring version"
              hint="Changing weights requires a new version."
            >
              <Input
                name="scoringVersion"
                required
                defaultValue="admin-draft-v1"
              />
            </AdminField>
            <AdminField label="Description">
              <Input
                name="description"
                defaultValue="Synthetic draft competition."
              />
            </AdminField>
          </div>

          <AdminCheckboxGroup legend="Supported markets">
            {Object.values(MarketSymbol).map((market) => (
              <AdminCheckbox
                defaultChecked
                key={market}
                label={market}
                name="markets"
                value={market}
              />
            ))}
          </AdminCheckboxGroup>

          <AdminCheckboxGroup legend="Divisions">
            {Object.values(Division).map((division) => (
              <AdminCheckbox
                defaultChecked
                key={division}
                label={division}
                name="divisions"
                value={division}
              />
            ))}
          </AdminCheckboxGroup>

          <div className="grid gap-4 md:grid-cols-5">
            <AdminField label="Performance">
              <Input
                name="performance"
                required
                type="number"
                defaultValue="35"
              />
            </AdminField>
            <AdminField label="Risk management">
              <Input
                name="riskManagement"
                required
                type="number"
                defaultValue="25"
              />
            </AdminField>
            <AdminField label="Consistency">
              <Input
                name="consistency"
                required
                type="number"
                defaultValue="20"
              />
            </AdminField>
            <AdminField label="Qualified activity">
              <Input
                name="qualifiedActivity"
                required
                type="number"
                defaultValue="10"
              />
            </AdminField>
            <AdminField label="Market diversity">
              <Input
                name="marketDiversity"
                required
                type="number"
                defaultValue="10"
              />
            </AdminField>
          </div>

          <AdminField
            label="Quest configuration"
            hint="Optional draft non-financial quest title."
          >
            <Input
              name="questTitles"
              defaultValue="Complete one qualified trade"
            />
          </AdminField>
        </AdminActionForm>
      </Panel>
    </div>
  );
}
