import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { SimulationDisclaimer } from "@/components/ui/simulation-disclaimer";

const scoreComponents = [
  ["Performance", "35", "ROI, equity-relative net P&L, and profit factor."],
  [
    "Risk management",
    "25",
    "Maximum drawdown, leverage, liquidations, and concentration.",
  ],
  [
    "Consistency",
    "20",
    "Profitable active days, daily-return volatility, and best-trade dependence.",
  ],
  [
    "Qualified activity",
    "10",
    "Active days and qualified trades with diminishing returns.",
  ],
  [
    "Market diversity",
    "10",
    "Meaningful participation across supported synthetic markets.",
  ],
] as const;

export default function MethodologyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Methodology"
        title="Competition score methodology"
        description="PerpArena ranks synthetic participants with a deterministic 0-100 model designed to balance performance, risk management, consistency, qualified activity, and market diversity."
      />

      <Panel>
        <SimulationDisclaimer />
      </Panel>

      <Panel>
        <h2 className="text-lg font-semibold text-foreground">
          Score component caps
        </h2>
        <div className="mt-4 overflow-hidden rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Competition score component maximums and inputs
            </caption>
            <thead className="bg-surface-raised text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-mono">Score component</th>
                <th className="px-4 py-3 font-mono">Cap</th>
                <th className="px-4 py-3 font-mono">Inputs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {scoreComponents.map(([name, cap, inputs]) => (
                <tr key={name}>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {name}
                  </td>
                  <td className="px-4 py-3 font-mono text-accent">{cap}</td>
                  <td className="px-4 py-3 text-muted">{inputs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel>
        <h2 className="text-lg font-semibold text-foreground">
          Calculation posture
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Analytics are calculated before scoring and are kept separate from UI
          rendering. Core calculations avoid NaN and Infinity, handle empty
          inputs, and preserve precision until presentation formatting.
        </p>
        <p className="mt-3 text-sm leading-6 text-muted">
          The scoring model is transparent and bounded, but it is not a claim of
          guaranteed fairness. Thresholds should be calibrated before any
          real-world use.
        </p>
      </Panel>
    </div>
  );
}
