import { StatusBadge } from "@/components/ui/status-badge";

type IntegrityBadgeProps = {
  level: "unreviewed" | "monitoring" | "clear";
};

const labelByLevel: Record<IntegrityBadgeProps["level"], string> = {
  unreviewed: "Unreviewed",
  monitoring: "Monitoring",
  clear: "Clear",
};

export function IntegrityBadge({ level }: IntegrityBadgeProps) {
  const tone =
    level === "clear"
      ? "positive"
      : level === "monitoring"
        ? "warning"
        : "neutral";

  return <StatusBadge tone={tone}>{labelByLevel[level]}</StatusBadge>;
}
