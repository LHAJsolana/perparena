type MetricCardProps = {
  label: string;
  value: string;
  detail?: string;
  tone?: "neutral" | "positive" | "negative" | "warning" | "info";
};

const toneClasses: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  neutral: "text-foreground",
  positive: "text-positive",
  negative: "text-negative",
  warning: "text-warning",
  info: "text-info",
};

export function MetricCard({
  label,
  value,
  detail,
  tone = "neutral",
}: MetricCardProps) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-surface p-4">
      <p className="truncate font-mono text-[11px] uppercase text-subtle">
        {label}
      </p>
      <p
        className={`mt-2 truncate font-mono text-xl font-semibold ${toneClasses[tone]}`}
      >
        {value}
      </p>
      {detail ? (
        <p className="mt-2 text-xs leading-5 text-muted">{detail}</p>
      ) : null}
    </div>
  );
}
