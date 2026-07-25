import { StatusBadge } from "@/components/ui/status-badge";

type DivisionBadgeProps = {
  division:
    "OPEN" | "PROVISIONAL" | "RISK_LAB" | "Open" | "Provisional" | "Risk Lab";
};

export function DivisionBadge({ division }: DivisionBadgeProps) {
  const display =
    division === "OPEN"
      ? "Open"
      : division === "PROVISIONAL"
        ? "Provisional"
        : division === "RISK_LAB"
          ? "Risk Lab"
          : division;
  const tone =
    display === "Open"
      ? "positive"
      : display === "Risk Lab"
        ? "info"
        : "warning";

  return <StatusBadge tone={tone}>{display}</StatusBadge>;
}
