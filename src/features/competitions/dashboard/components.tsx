import { Division, MarketSymbol } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DivisionBadge } from "@/components/ui/division-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { Input } from "@/components/ui/input";
import { MetricCard } from "@/components/ui/metric-card";
import { Panel } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableWrapper } from "@/components/ui/table-wrapper";
import { truncateWallet, WalletDisplay } from "@/components/ui/wallet-display";
import {
  formatCompactCurrency,
  formatCurrency,
  formatDateRange,
  formatNumber,
  formatPercent,
  marketLabel,
} from "@/features/competitions/dashboard/format";
import {
  leaderboardSortOptions,
  publicIntegrityStatuses,
  queryToSearchParams,
  type LeaderboardQuery,
  type PublicIntegrityStatus,
} from "@/features/competitions/dashboard/query";
import type {
  CompetitionDashboard,
  CompetitionSummary,
  LeaderboardRow,
} from "@/features/competitions/dashboard/repository";

export function DatabaseUnavailableState({ message }: { message: string }) {
  return (
    <ErrorMessage
      title="Synthetic competition data is unavailable"
      message={message}
    />
  );
}

export function CompetitionMetrics({
  competition,
}: {
  competition: CompetitionSummary;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Synthetic participant"
        value={formatNumber(competition.participantCount)}
        detail="Seeded simulation accounts"
      />
      <MetricCard
        label="Simulated volume"
        value={formatCompactCurrency(competition.simulatedVolume)}
        detail="Closed synthetic trade notional"
        tone="info"
      />
      <MetricCard
        label="Qualified trade"
        value={formatNumber(competition.qualifiedTradeCount)}
        detail="Passed Phase 5 qualification rules"
        tone="positive"
      />
      <MetricCard
        label="Scoring version"
        value={competition.scoringVersion}
        detail="Deterministic competition score model"
      />
    </div>
  );
}

export function CompetitionStatusLine({
  competition,
}: {
  competition: CompetitionSummary;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
      <CompetitionStatusBadge status={competition.status} />
      <span>{formatDateRange(competition.startsAt, competition.endsAt)}</span>
      <span className="font-mono text-subtle">
        {competition.markets.map(marketLabel).join(" / ")}
      </span>
    </div>
  );
}

export function CompetitionStatusBadge({
  status,
}: {
  status: CompetitionSummary["status"];
}) {
  const tone =
    status === "ACTIVE"
      ? "positive"
      : status === "COMPLETED"
        ? "neutral"
        : status === "SCHEDULED"
          ? "info"
          : status === "FINALIZING"
            ? "warning"
            : "neutral";

  const label =
    status === "ACTIVE"
      ? "Active simulated competition"
      : status.toLowerCase().replace("_", " ");

  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}

export function TopThreePreview({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No ranked participants yet"
        description="Run analytics and scoring recalculation after seeding synthetic trades."
      />
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {rows.map((row) => (
        <Panel key={row.id}>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-sm text-subtle">
              Rank {row.rank}
            </span>
            <IntegrityStatusBadge status={row.integrityStatus} />
          </div>
          <div className="mt-4">
            <WalletDisplay wallet={row.wallet} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <MetricPair label="Score" value={row.score.toFixed(2)} />
            <MetricPair
              label="Simulated net P&L"
              value={formatCurrency(row.simulatedNetPnl)}
            />
            <MetricPair label="ROI" value={formatPercent(row.roi)} />
            <MetricPair
              label="Max drawdown"
              value={formatPercent(row.maximumDrawdown)}
            />
          </div>
        </Panel>
      ))}
    </div>
  );
}

export function CompetitionFilterForm({ query }: { query: LeaderboardQuery }) {
  return (
    <form className="grid gap-3 lg:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))_auto]">
      <label className="grid gap-1 text-xs font-medium uppercase text-subtle">
        Wallet search
        <Input
          defaultValue={query.search}
          name="search"
          placeholder="Wallet or synthetic identifier"
        />
      </label>
      <label className="grid gap-1 text-xs font-medium uppercase text-subtle">
        Division
        <Select defaultValue={query.division ?? ""} name="division">
          <option value="">All</option>
          {Object.values(Division).map((division) => (
            <option key={division} value={division}>
              {division}
            </option>
          ))}
        </Select>
      </label>
      <label className="grid gap-1 text-xs font-medium uppercase text-subtle">
        Market
        <Select defaultValue={query.market ?? ""} name="market">
          <option value="">All</option>
          {Object.values(MarketSymbol).map((market) => (
            <option key={market} value={market}>
              {marketLabel(market)}
            </option>
          ))}
        </Select>
      </label>
      <label className="grid gap-1 text-xs font-medium uppercase text-subtle">
        Integrity
        <Select defaultValue={query.integrity ?? ""} name="integrity">
          <option value="">All</option>
          {publicIntegrityStatuses.map((status) => (
            <option key={status} value={status}>
              {status.replace("_", " ")}
            </option>
          ))}
        </Select>
      </label>
      <label className="grid gap-1 text-xs font-medium uppercase text-subtle">
        Sort
        <Select defaultValue={query.sort} name="sort">
          {leaderboardSortOptions.map((sort) => (
            <option key={sort} value={sort}>
              {sort}
            </option>
          ))}
        </Select>
      </label>
      <label className="grid gap-1 text-xs font-medium uppercase text-subtle">
        Direction
        <Select defaultValue={query.direction} name="direction">
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </Select>
      </label>
      <div className="flex items-end gap-2">
        <Button type="submit">Apply</Button>
        <Button href="?" variant="secondary">
          Reset
        </Button>
      </div>
    </form>
  );
}

export function Leaderboard({
  dashboard,
  query,
}: {
  dashboard: CompetitionDashboard;
  query: LeaderboardQuery;
}) {
  if (dashboard.leaderboard.totalRows === 0) {
    return (
      <EmptyState
        title="No leaderboard rows match"
        description="Reset filters or choose a broader division, market, or integrity status."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden md:block">
        <TableWrapper label={`${dashboard.name} leaderboard`}>
          <caption className="sr-only">
            Public synthetic leaderboard with competition score, simulated net
            P&L, risk, activity, division, and integrity heuristic status.
          </caption>
          <thead className="border-b border-border bg-background-elevated">
            <tr>
              {[
                "Rank",
                "Wallet",
                "Score",
                "Simulated net P&L",
                "ROI",
                "Maximum drawdown",
                "Win rate",
                "Active days",
                "Liquidations",
                "Division",
                "Integrity status",
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
            {dashboard.leaderboard.rows.map((row) => (
              <tr className="border-b border-border/70" key={row.id}>
                <td className="px-3 py-3 font-mono text-sm text-foreground">
                  <span className="sr-only">Rank </span>
                  {row.rank}
                </td>
                <td className="max-w-48 px-3 py-3">
                  <WalletProfileLink wallet={row.wallet} />
                </td>
                <td className="px-3 py-3 font-mono text-foreground">
                  {row.score.toFixed(2)}
                </td>
                <td className="px-3 py-3 font-mono text-foreground">
                  {formatCurrency(row.simulatedNetPnl)}
                </td>
                <td className="px-3 py-3 font-mono text-muted">
                  {formatPercent(row.roi)}
                </td>
                <td className="px-3 py-3 font-mono text-muted">
                  {formatPercent(row.maximumDrawdown)}
                </td>
                <td className="px-3 py-3 font-mono text-muted">
                  {formatPercent(row.winRate)}
                </td>
                <td className="px-3 py-3 font-mono text-muted">
                  {row.activeDays}
                </td>
                <td className="px-3 py-3 font-mono text-muted">
                  {row.liquidations}
                </td>
                <td className="px-3 py-3">
                  <DivisionBadge division={row.division} />
                </td>
                <td className="px-3 py-3">
                  <IntegrityStatusBadge status={row.integrityStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </div>

      <div className="grid gap-3 md:hidden">
        {dashboard.leaderboard.rows.map((row) => (
          <Panel key={row.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase text-subtle">
                  Rank {row.rank}
                </p>
                <WalletProfileLink wallet={row.wallet} />
              </div>
              <IntegrityStatusBadge status={row.integrityStatus} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MetricPair label="Score" value={row.score.toFixed(2)} />
              <MetricPair
                label="Simulated net P&L"
                value={formatCurrency(row.simulatedNetPnl)}
              />
              <MetricPair label="ROI" value={formatPercent(row.roi)} />
              <MetricPair
                label="Max DD"
                value={formatPercent(row.maximumDrawdown)}
              />
              <MetricPair label="Win rate" value={formatPercent(row.winRate)} />
              <MetricPair label="Active days" value={String(row.activeDays)} />
            </div>
          </Panel>
        ))}
      </div>

      <Pagination dashboard={dashboard} query={query} />
    </div>
  );
}

export function Pagination({
  dashboard,
  query,
}: {
  dashboard: CompetitionDashboard;
  query: LeaderboardQuery;
}) {
  const previous = Math.max(1, dashboard.leaderboard.page - 1);
  const next = Math.min(
    dashboard.leaderboard.totalPages,
    dashboard.leaderboard.page + 1,
  );
  const previousParams = queryToSearchParams({ ...query, page: previous });
  const nextParams = queryToSearchParams({ ...query, page: next });

  return (
    <nav
      aria-label="Leaderboard pagination"
      className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted"
    >
      <span className="font-mono">
        Page {dashboard.leaderboard.page} of {dashboard.leaderboard.totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          href={`?${previousParams.toString()}`}
          variant="secondary"
          className={
            dashboard.leaderboard.page === 1
              ? "pointer-events-none opacity-50"
              : ""
          }
        >
          Previous
        </Button>
        <Button
          href={`?${nextParams.toString()}`}
          variant="secondary"
          className={
            dashboard.leaderboard.page === dashboard.leaderboard.totalPages
              ? "pointer-events-none opacity-50"
              : ""
          }
        >
          Next
        </Button>
      </div>
    </nav>
  );
}

export function IntegrityStatusBadge({
  status,
}: {
  status: PublicIntegrityStatus;
}) {
  const tone =
    status === "VERIFIED"
      ? "positive"
      : status === "SCORE_LIMITED"
        ? "negative"
        : status === "UNDER_REVIEW"
          ? "warning"
          : "info";

  return <StatusBadge tone={tone}>{status.replace("_", " ")}</StatusBadge>;
}

function MetricPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-mono text-[11px] uppercase text-subtle">
        {label}
      </p>
      <p className="mt-1 truncate font-mono text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

function WalletProfileLink({ wallet }: { wallet: string }) {
  return (
    <Link
      aria-label={`Open trader profile for ${wallet}`}
      className="inline-flex max-w-full truncate rounded-sm border border-border bg-background-elevated px-2 py-1 font-mono text-sm text-foreground hover:border-accent hover:text-accent"
      href={`/traders/${wallet}`}
      title={wallet}
    >
      {truncateWallet(wallet)}
    </Link>
  );
}
