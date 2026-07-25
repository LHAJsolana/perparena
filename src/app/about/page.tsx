import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { SimulationDisclaimer } from "@/components/ui/simulation-disclaimer";

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
    </div>
  );
}
