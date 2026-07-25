import { Button } from "@/components/ui/button";
import { DisclaimerBanner } from "@/components/ui/disclaimer-banner";
import { DivisionBadge } from "@/components/ui/division-badge";
import { ErrorMessage } from "@/components/ui/error-message";
import { Input } from "@/components/ui/input";
import { IntegrityBadge } from "@/components/ui/integrity-badge";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { WalletDisplay } from "@/components/ui/wallet-display";

export default function DesignSystemPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Internal"
        title="Design-system demonstration"
        description="An unlisted render target for Phase 2 shell components."
      />
      <DisclaimerBanner />
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Positive" value="+12.40%" tone="positive" />
        <MetricCard label="Negative" value="-4.25%" tone="negative" />
        <MetricCard label="Neutral" value="Pending" />
      </div>
      <Panel>
        <div className="flex flex-wrap gap-2">
          <StatusBadge>Neutral</StatusBadge>
          <StatusBadge tone="positive">Positive</StatusBadge>
          <StatusBadge tone="negative">Negative</StatusBadge>
          <StatusBadge tone="warning">Warning</StatusBadge>
          <StatusBadge tone="info">Info</StatusBadge>
          <DivisionBadge division="Open" />
          <IntegrityBadge level="monitoring" />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Input
            aria-label="Synthetic wallet filter"
            placeholder="Wallet or identifier"
          />
          <Select aria-label="Division filter" defaultValue="open">
            <option value="open">Open</option>
            <option value="risk-lab">Risk Lab</option>
          </Select>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Tooltip label="Tooltip foundation for short technical help">
            <Button variant="secondary">Info</Button>
          </Tooltip>
        </div>
        <div className="mt-5">
          <WalletDisplay wallet="PArenaSyntheticWallet1111111111111111111111111111" />
        </div>
      </Panel>
      <Tabs
        label="Design-system tabs"
        items={[
          {
            id: "empty",
            label: "Empty",
            content: <Skeleton className="h-20 w-full" />,
          },
          {
            id: "error",
            label: "Error",
            content: (
              <ErrorMessage
                title="Example error state"
                message="This is a styled state only, not a live system error."
              />
            ),
          },
        ]}
      />
    </div>
  );
}
