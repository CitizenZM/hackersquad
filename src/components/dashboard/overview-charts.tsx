"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const CHART_COLORS = [
  "#18181b",
  "#3f3f46",
  "#71717a",
  "#a1a1aa",
  "#d4d4d8",
  "#6366f1",
  "#16a34a",
  "#d97706",
  "#dc2626",
  "#2563eb",
];

interface OverviewChartsProps {
  narrativeData: { name: string; value: number; performance: number }[];
  scoreDistribution: { range: string; count: number }[];
}

export function OverviewCharts({
  narrativeData,
  scoreDistribution,
}: OverviewChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold tracking-tight">Narrative Types</p>
          <p className="text-xs text-muted-foreground">Frequency</p>
        </div>
        {narrativeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={narrativeData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={50}
                dataKey="value"
                paddingAngle={2}
                stroke="#fff"
                strokeWidth={1}
              >
                {narrativeData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e4e4e7",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
            No data yet
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold tracking-tight">Score Distribution</p>
          <p className="text-xs text-muted-foreground">Content count by score range</p>
        </div>
        {scoreDistribution.some((d) => d.count > 0) ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={scoreDistribution} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 11, fill: "#71717a" }}
                stroke="#e4e4e7"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#71717a" }}
                stroke="#e4e4e7"
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e4e4e7",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
                cursor={{ fill: "#f4f4f5" }}
              />
              <Bar dataKey="count" fill="#18181b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
            No data yet
          </div>
        )}
      </div>
    </div>
  );
}
