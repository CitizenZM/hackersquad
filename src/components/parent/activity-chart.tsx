"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface ActivityChartProps {
  data: Array<{ day: string; episodes: number }>;
}

export function ActivityChart({ data }: ActivityChartProps) {
  if (data.every((d) => d.episodes === 0)) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No activity this week yet
      </p>
    );
  }

  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis hide allowDecimals={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Bar
            dataKey="episodes"
            fill="oklch(0.55 0.18 250)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
