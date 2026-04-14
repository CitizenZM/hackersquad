"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface ScoreRadarProps {
  data: { metric: string; value: number }[];
}

export function ScoreRadar({ data }: ScoreRadarProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="#e4e4e7" />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fontSize: 11, fill: "#71717a", fontWeight: 500 }}
        />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          dataKey="value"
          stroke="#18181b"
          fill="#18181b"
          fillOpacity={0.15}
          strokeWidth={1.5}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
