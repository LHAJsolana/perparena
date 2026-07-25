import { SimulationDisclaimer } from "@/components/ui/simulation-disclaimer";

export function DisclaimerBanner() {
  return (
    <aside className="rounded-md border border-warning/35 bg-warning/10 p-4">
      <p className="mb-1 font-mono text-xs font-semibold uppercase text-warning">
        Simulated-only notice
      </p>
      <SimulationDisclaimer />
    </aside>
  );
}
