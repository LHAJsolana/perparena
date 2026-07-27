import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { SimulationDisclaimer } from "@/components/ui/simulation-disclaimer";

const signals = [
  "Repetitive instant round trips",
  "Extremely high trade frequency",
  "Excessive leverage",
  "One-trade score domination",
  "Tiny-account ROI distortion",
  "Extreme market concentration",
  "Final-hour activity",
  "Possible volume farming",
] as const;

export default function IntegrityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Integrity"
        title="Explainable integrity heuristics"
        description="PerpArena surfaces simulation-based integrity signals as behavior requiring review. The system does not claim to conclusively detect fraud."
      />

      <Panel>
        <SimulationDisclaimer />
      </Panel>

      <Panel>
        <h2 className="text-lg font-semibold text-foreground">
          Public-safe signal language
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Integrity results are described as heuristics, signals, and review
          queues. Flags can affect score only through a capped adjustment policy
          and should be interpreted with false-positive risk in mind.
        </p>
      </Panel>

      <Panel>
        <h2 className="text-lg font-semibold text-foreground">
          Example integrity signals
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {signals.map((signal) => (
            <li
              key={signal}
              className="rounded-md border border-border bg-surface-raised px-4 py-3 text-sm text-muted"
            >
              {signal}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel>
        <h2 className="text-lg font-semibold text-foreground">
          Review posture
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Status values such as verified, warning, under review, and
          score-limited are derived from documented signals. A participant is
          never publicly labeled as fraudulent by PerpArena.
        </p>
      </Panel>
    </div>
  );
}
