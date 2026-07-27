import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { SimulationDisclaimer } from "@/components/ui/simulation-disclaimer";
import { appConfig } from "@/lib/config/app-config";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="About"
        title="Independent simulated competition prototype"
        description="PerpArena explores how risk management, consistency, and competition score design can shape simulated trading leaderboards."
      />
      <Panel>
        <SimulationDisclaimer />
      </Panel>
      <Panel>
        <h2 className="text-lg font-semibold text-foreground">
          Limitations and methodology
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          {appConfig.limitationsNotice}
        </p>
        <p className="mt-3 text-sm leading-6 text-muted">
          {appConfig.methodologyNotice}
        </p>
      </Panel>
    </div>
  );
}
