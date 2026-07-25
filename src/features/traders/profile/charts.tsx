"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import type { TraderChartData } from "./chart-data";

const palette = ["#2dd4bf", "#60a5fa", "#fbbf24"];

export function TraderCharts({ data }: { data: TraderChartData }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartPanel
        title="Equity curve"
        description="Current equity after each closed synthetic trade."
        empty={data.equityCurve.length === 0}
      >
        <ResponsiveContainer height={280} width="100%">
          <AreaChart
            accessibilityLayer
            data={data.equityCurve}
            margin={{ bottom: 8, left: 0, right: 16, top: 12 }}
          >
            <CartesianGrid stroke="#2d3d52" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="#9cabbe" />
            <YAxis domain={["auto", "auto"]} stroke="#9cabbe" />
            <Tooltip formatter={currencyTooltip} />
            <Area
              dataKey="equity"
              fill="#2dd4bf"
              fillOpacity={0.12}
              name="Current equity"
              stroke="#2dd4bf"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel
        title="Daily P&L"
        description="Simulated net P&L grouped by UTC competition day."
        empty={data.dailyPnl.length === 0}
      >
        <ResponsiveContainer height={280} width="100%">
          <BarChart
            accessibilityLayer
            data={data.dailyPnl}
            margin={{ bottom: 8, left: 0, right: 16, top: 12 }}
          >
            <CartesianGrid stroke="#2d3d52" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="#9cabbe" />
            <YAxis domain={["auto", "auto"]} stroke="#9cabbe" />
            <ReferenceLine stroke="#9cabbe" y={0} />
            <Tooltip formatter={currencyTooltip} />
            <Bar dataKey="simulatedPnl" name="Simulated P&L">
              {data.dailyPnl.map((point) => (
                <Cell
                  fill={point.simulatedPnl >= 0 ? "#34d399" : "#fb7185"}
                  key={point.label}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel
        title="Drawdown"
        description="Daily maximum drawdown with a visible zero baseline."
        empty={data.drawdown.length === 0}
      >
        <ResponsiveContainer height={280} width="100%">
          <LineChart
            accessibilityLayer
            data={data.drawdown}
            margin={{ bottom: 8, left: 0, right: 16, top: 12 }}
          >
            <CartesianGrid stroke="#2d3d52" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="#9cabbe" />
            <YAxis
              domain={[0, "auto"]}
              stroke="#9cabbe"
              tickFormatter={percentTick}
            />
            <ReferenceLine stroke="#9cabbe" y={0} />
            <Tooltip formatter={percentTooltip} />
            <Line
              dataKey="drawdown"
              dot={false}
              name="Maximum drawdown"
              stroke="#fbbf24"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel
        title="Market allocation"
        description="Share of simulated volume across supported markets."
        empty={data.marketAllocation.every((point) => point.allocation === 0)}
      >
        <ResponsiveContainer height={280} width="100%">
          <PieChart accessibilityLayer>
            <Pie
              data={data.marketAllocation}
              dataKey="allocation"
              innerRadius={62}
              nameKey="market"
              outerRadius={96}
            >
              {data.marketAllocation.map((point, index) => (
                <Cell
                  fill={palette[index % palette.length]}
                  key={point.market}
                />
              ))}
            </Pie>
            <Tooltip formatter={percentTooltip} />
          </PieChart>
        </ResponsiveContainer>
      </ChartPanel>
    </div>
  );
}

function ChartPanel({
  children,
  description,
  empty,
  title,
}: {
  children: React.ReactNode;
  description: string;
  empty: boolean;
  title: string;
}) {
  return (
    <Panel>
      <SectionHeading title={title} description={description} />
      <div aria-label={title} className="mt-4 min-h-[280px]" role="img">
        {empty ? (
          <EmptyState
            title={`No ${title.toLowerCase()} data`}
            description="This participant has no closed synthetic trades for this chart yet."
          />
        ) : (
          children
        )}
      </div>
    </Panel>
  );
}

function currencyTooltip(value: unknown) {
  return tooltipValue(
    typeof value === "number" ? `$${value.toFixed(2)}` : String(value),
  );
}

function percentTooltip(value: unknown) {
  return tooltipValue(
    typeof value === "number" ? `${(value * 100).toFixed(2)}%` : String(value),
  );
}

function percentTick(value: unknown) {
  return typeof value === "number" ? `${(value * 100).toFixed(0)}%` : "";
}

function tooltipValue(value: string): [ReactNode, string] {
  return [value, "Value"];
}
