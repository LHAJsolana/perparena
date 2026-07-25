import type { ParticipantAnalytics } from "@/features/analytics/types";
import { marketLabel } from "@/features/competitions/dashboard/format";

export type TraderChartData = {
  equityCurve: { label: string; equity: number; simulatedNetPnl: number }[];
  dailyPnl: { label: string; simulatedPnl: number }[];
  drawdown: { label: string; drawdown: number }[];
  marketAllocation: { market: string; allocation: number }[];
};

export function buildTraderChartData(
  analytics: ParticipantAnalytics,
): TraderChartData {
  return {
    equityCurve: analytics.equityCurve.map((point) => ({
      label: point.timestamp.toISOString().slice(0, 10),
      equity: finite(point.equity),
      simulatedNetPnl: finite(point.netPnl),
    })),
    dailyPnl: analytics.dailyPerformance.map((day) => ({
      label: day.day.toISOString().slice(0, 10),
      simulatedPnl: finite(day.simulatedPnl),
    })),
    drawdown: analytics.dailyPerformance.map((day) => ({
      label: day.day.toISOString().slice(0, 10),
      drawdown: finite(day.maximumDrawdown),
    })),
    marketAllocation: Object.entries(analytics.marketAllocation).map(
      ([market, allocation]) => ({
        allocation: finite(allocation),
        market: marketLabel(market as never),
      }),
    ),
  };
}

function finite(value: number) {
  return Number.isFinite(value) ? value : 0;
}
