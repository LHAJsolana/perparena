import { Button } from "@/components/ui/button";
import { DisclaimerBanner } from "@/components/ui/disclaimer-banner";
import { DivisionBadge } from "@/components/ui/division-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { MetricCard } from "@/components/ui/metric-card";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableWrapper } from "@/components/ui/table-wrapper";
import { WalletDisplay } from "@/components/ui/wallet-display";
import {
  formatCurrency,
  formatDateRange,
  formatNumber,
  formatPercent,
  marketLabel,
} from "@/features/competitions/dashboard/format";
import { IntegrityStatusBadge } from "@/features/competitions/dashboard/components";
import { TraderCharts } from "./charts";
import { profitFactorLabel, type TraderProfile } from "./repository";

export function TraderProfileView({ profile }: { profile: TraderProfile }) {
  return (
    <div className="space-y-8">
      <Panel>
        <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="info">Simulation</StatusBadge>
              <DivisionBadge division={profile.division} />
              <IntegrityStatusBadge status={profile.integrity.status} />
            </div>
            <WalletDisplay wallet={profile.wallet} />
            <p className="text-sm leading-6 text-muted">
              Rank {profile.rank ?? "n/a"} in{" "}
              <span className="text-foreground">
                {profile.competition.name}
              </span>{" "}
              (
              {formatDateRange(
                profile.competition.startsAt,
                profile.competition.endsAt,
              )}
              ).
            </p>
          </div>
          <div className="grid min-w-64 gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <MetricMini
              label="Final score"
              value={profile.score.finalTotal.toFixed(2)}
            />
            <MetricMini
              label="Raw score"
              value={profile.score.rawTotal.toFixed(2)}
            />
            <MetricMini
              label="Integrity adjustment"
              value={formatNumber(profile.score.integrityAdjustment)}
            />
          </div>
        </div>
      </Panel>

      <SummaryMetrics profile={profile} />

      <section className="space-y-4">
        <SectionHeading
          title="Score breakdown"
          description={`Scoring version ${profile.score.scoringVersion}. Component caps are applied before the final competition score.`}
        />
        <ScoreBreakdown profile={profile} />
      </section>

      <section className="space-y-4">
        <SectionHeading
          title="Charts"
          description="Synthetic performance views use full value ranges and visible zero baselines where applicable."
        />
        <TraderCharts data={profile.charts} />
      </section>

      <TradeHistory profile={profile} />
      <IntegritySection profile={profile} />
      <EngagementSection profile={profile} />
      <DisclaimerBanner />
    </div>
  );
}

export function TraderUnavailableState({ message }: { message: string }) {
  return <ErrorMessage title="Trader profile unavailable" message={message} />;
}

export function SummaryMetrics({ profile }: { profile: TraderProfile }) {
  const analytics = profile.analytics;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Starting equity"
        value={formatCurrency(analytics.startingEquity)}
      />
      <MetricCard
        label="Current equity"
        value={formatCurrency(analytics.currentEquity)}
      />
      <MetricCard
        label="Simulated net P&L"
        value={formatCurrency(analytics.netPnl)}
        tone={analytics.netPnl >= 0 ? "positive" : "negative"}
      />
      <MetricCard label="ROI" value={formatPercent(analytics.roi)} />
      <MetricCard
        label="Maximum drawdown"
        value={formatPercent(analytics.maximumDrawdown)}
        tone="warning"
      />
      <MetricCard label="Win rate" value={formatPercent(analytics.winRate)} />
      <MetricCard
        label="Profit factor"
        value={profitFactorLabel(analytics.profitFactor)}
      />
      <MetricCard
        label="Average leverage"
        value={nullableNumber(analytics.averageLeverage)}
      />
      <MetricCard
        label="Maximum leverage"
        value={nullableNumber(analytics.maximumLeverage)}
      />
      <MetricCard
        label="Liquidations"
        value={String(analytics.liquidationCount)}
      />
      <MetricCard
        label="Active days"
        value={String(analytics.activeTradingDays)}
      />
      <MetricCard
        label="Qualified trades"
        value={String(analytics.qualifiedTradeCount)}
        tone="info"
      />
    </div>
  );
}

export function ScoreBreakdown({ profile }: { profile: TraderProfile }) {
  if (profile.score.components.every((component) => component.max === 0)) {
    return (
      <EmptyState
        title="No score breakdown yet"
        description="Run the scoring recalculation script after seeding analytics."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {profile.score.components.map((component) => (
        <Panel key={component.key}>
          <div className="grid gap-4 lg:grid-cols-[14rem_1fr]">
            <div>
              <p className="font-mono text-xs uppercase text-subtle">
                {component.label}
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
                {component.score.toFixed(2)} / {component.max}
              </p>
            </div>
            <div className="min-w-0 space-y-3">
              <p className="text-sm leading-6 text-muted">
                {component.explanation}
              </p>
              <KeyValueGrid
                items={{
                  cap: component.max,
                  ...component.inputs,
                  ...prefixKeys(component.normalized, "normalized"),
                }}
              />
            </div>
          </div>
        </Panel>
      ))}
      <Panel>
        <KeyValueGrid
          items={{
            finalTotal: profile.score.finalTotal,
            integrityAdjustment: profile.score.integrityAdjustment,
            rawTotal: profile.score.rawTotal,
          }}
        />
        {profile.score.explanations.length ? (
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {profile.score.explanations.map((explanation) => (
              <li key={explanation}>{explanation}</li>
            ))}
          </ul>
        ) : null}
      </Panel>
    </div>
  );
}

export function TradeHistory({ profile }: { profile: TraderProfile }) {
  return (
    <section className="space-y-4">
      <SectionHeading
        title="Recent synthetic trades"
        description={`${profile.recentTrades.totalRows} total records. Showing page ${profile.recentTrades.page} of ${profile.recentTrades.totalPages}.`}
      />
      {profile.recentTrades.rows.length === 0 ? (
        <EmptyState
          title="No synthetic trades"
          description="This participant has no closed or open trade records in the seeded competition."
        />
      ) : (
        <TableWrapper label="Recent synthetic trade history">
          <caption className="sr-only">
            Recent synthetic trade history with market, side, timestamps,
            duration, size, leverage, simulated P&L, fees, exit reason, and
            qualification status.
          </caption>
          <thead className="border-b border-border bg-background-elevated">
            <tr>
              {[
                "Market",
                "Side",
                "Entry time",
                "Exit time",
                "Duration",
                "Size",
                "Leverage",
                "Gross P&L",
                "Fees",
                "Net P&L",
                "Exit reason",
                "Qualified",
              ].map((heading) => (
                <th
                  className="px-3 py-3 font-mono text-xs uppercase text-subtle"
                  key={heading}
                  scope="col"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profile.recentTrades.rows.map((trade) => (
              <tr className="border-b border-border/70" key={trade.id}>
                <Cell>{marketLabel(trade.market)}</Cell>
                <Cell>{trade.side}</Cell>
                <Cell>{formatDateTime(trade.openedAt)}</Cell>
                <Cell>
                  {trade.closedAt ? formatDateTime(trade.closedAt) : "Open"}
                </Cell>
                <Cell>{formatDuration(trade.durationMs)}</Cell>
                <Cell>{formatNumber(trade.size)}</Cell>
                <Cell>{trade.leverage.toFixed(2)}x</Cell>
                <Cell>
                  {trade.grossPnl === null
                    ? "n/a"
                    : formatCurrency(trade.grossPnl)}
                </Cell>
                <Cell>{formatCurrency(trade.fees)}</Cell>
                <Cell>
                  {trade.netPnl === null ? "n/a" : formatCurrency(trade.netPnl)}
                </Cell>
                <Cell>{trade.exitReason ?? "n/a"}</Cell>
                <Cell>{trade.isQualified ? "Qualified" : "Not qualified"}</Cell>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          className={
            profile.recentTrades.page === 1
              ? "pointer-events-none opacity-50"
              : ""
          }
          href={`?tradesPage=${Math.max(1, profile.recentTrades.page - 1)}`}
          variant="secondary"
        >
          Previous trades
        </Button>
        <Button
          className={
            profile.recentTrades.page === profile.recentTrades.totalPages
              ? "pointer-events-none opacity-50"
              : ""
          }
          href={`?tradesPage=${Math.min(profile.recentTrades.totalPages, profile.recentTrades.page + 1)}`}
          variant="secondary"
        >
          Next trades
        </Button>
      </div>
    </section>
  );
}

export function IntegritySection({ profile }: { profile: TraderProfile }) {
  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeading
          title="Integrity heuristic"
          description="Public-safe simulation-based signals describe behavior requiring review, not conclusive fraud detection."
        />
        <IntegrityStatusBadge status={profile.integrity.status} />
      </div>
      {profile.integrity.flags.length === 0 ? (
        <EmptyState
          title="No active integrity signals"
          description="No open simulation-based integrity flags are attached to this participant."
        />
      ) : (
        <div className="mt-4 grid gap-3">
          {profile.integrity.flags.map((flag) => (
            <div
              className="rounded-sm border border-border bg-background-elevated p-3"
              key={`${flag.type}-${flag.observedValue}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={flag.affectsScoring ? "warning" : "info"}>
                  {flag.severity}
                </StatusBadge>
                <span className="break-all font-mono text-xs uppercase text-subtle">
                  {flag.type}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{flag.reason}</p>
              <KeyValueGrid
                items={{
                  observedBehavior: flag.observedValue,
                  scoreAffected: flag.affectsScoring ? "yes" : "no",
                  threshold: flag.threshold,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function EngagementSection({ profile }: { profile: TraderProfile }) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Panel>
        <SectionHeading
          title="Quest progress"
          description="Engagement quests reward disciplined simulated participation and never alter the core 100-point competition score."
        />
        {profile.quests.length === 0 ? (
          <EmptyState
            title="No quest progress"
            description="Run engagement recalculation to attach quest progress records."
          />
        ) : (
          <div className="mt-4 grid gap-3">
            {profile.quests.map((quest) => (
              <div
                className="rounded-sm border border-border bg-background-elevated p-3"
                key={quest.title}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-xs uppercase text-foreground">
                    {quest.title}
                  </p>
                  <StatusBadge
                    tone={quest.status === "COMPLETED" ? "positive" : "info"}
                  >
                    {quest.status}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {quest.description}
                </p>
                <KeyValueGrid
                  items={{
                    engagementPoints: quest.engagementPoints,
                    progress: `${formatNumber(quest.progress)} / ${formatNumber(quest.target)}`,
                    version: quest.version,
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Panel>
        <SectionHeading
          title="Streaks"
          description="UTC days count once; missing days break current streaks, and duplicate events do not add extra days."
        />
        {profile.streaks.length === 0 ? (
          <EmptyState
            title="No streak records"
            description="Run engagement recalculation to calculate active-day, no-liquidation, and disciplined-leverage streaks."
          />
        ) : (
          <div className="mt-4 grid gap-3">
            {profile.streaks.map((streak) => (
              <div
                className="rounded-sm border border-border bg-background-elevated p-3"
                key={streak.type}
              >
                <p className="font-mono text-xs uppercase text-foreground">
                  {streak.type.replace("_", " ")}
                </p>
                <KeyValueGrid
                  items={{
                    best: streak.bestCount,
                    current: streak.currentCount,
                    lastCountedAt: streak.lastCountedAt
                      ? formatDateTime(streak.lastCountedAt)
                      : "n/a",
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Panel>
        <SectionHeading
          title="Achievements"
          description="Badges are non-financial recognition for disciplined simulated behavior."
        />
        {profile.achievements.length === 0 ? (
          <EmptyState
            title="No achievements"
            description="No achievement records are attached to this participant yet."
          />
        ) : (
          <KeyValueGrid
            items={Object.fromEntries(
              profile.achievements.map((achievement) => [
                achievement.title,
                formatDateTime(achievement.awardedAt),
              ]),
            )}
          />
        )}
      </Panel>
    </div>
  );
}

function KeyValueGrid({
  items,
}: {
  items: Record<string, number | string | null>;
}) {
  return (
    <dl className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {Object.entries(items).map(([key, value]) => (
        <div className="min-w-0" key={key}>
          <dt className="truncate font-mono text-[11px] uppercase text-subtle">
            {key}
          </dt>
          <dd className="mt-1 break-words font-mono text-sm text-foreground">
            {typeof value === "number" ? formatNumber(value) : (value ?? "n/a")}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function MetricMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-sm border border-border bg-background-elevated p-3">
      <p className="truncate font-mono text-[11px] uppercase text-subtle">
        {label}
      </p>
      <p className="mt-1 truncate font-mono text-xl font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <td className="max-w-48 break-words px-3 py-3 font-mono text-sm text-muted">
      {children}
    </td>
  );
}

function prefixKeys(values: Record<string, number>, prefix: string) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [`${prefix}.${key}`, value]),
  );
}

function nullableNumber(value: number | null) {
  return value === null ? "n/a" : formatNumber(value);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

function formatDuration(durationMs: number | null) {
  if (durationMs === null) {
    return "n/a";
  }

  const minutes = Math.max(0, Math.round(durationMs / 60000));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return hours > 0 ? `${hours}h ${remainder}m` : `${remainder}m`;
}
