export type BadgeTone =
  "neutral" | "positive" | "negative" | "warning" | "info";

type StatusBadgeProps = {
  children: string;
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-border bg-surface-raised text-muted",
  positive: "border-positive/40 bg-positive/10 text-positive",
  negative: "border-negative/40 bg-negative/10 text-negative",
  warning: "border-warning/40 bg-warning/10 text-warning",
  info: "border-info/40 bg-info/10 text-info",
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex min-h-7 max-w-full items-center truncate rounded-sm border px-2.5 font-mono text-xs font-medium uppercase ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
