"use client";

import { Card, CardContent } from "@/components/ui/card";
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
} from "recharts";

const COLORS = [
  "#a78bfa", "#f472b6", "#60a5fa", "#34d399", "#fbbf24",
  "#fb923c", "#c084fc", "#22d3ee", "#f87171", "#4ade80",
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Card className="rounded-3xl border-2 border-pink-200 bg-white fun-shadow-sm">
        <CardContent className="pt-4">
          <p className="text-sm font-black text-pink-700 mb-2">📊 Story Types</p>
          {narrativeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={narrativeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={30}
                  dataKey="value"
                  strokeWidth={3}
                  stroke="#fff"
                >
                  {narrativeData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm text-purple-300 font-bold">
              Run research first! 🔍
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-2 border-blue-200 bg-white fun-shadow-sm">
        <CardContent className="pt-4">
          <p className="text-sm font-black text-blue-700 mb-2">📈 Score Spread</p>
          {scoreDistribution.some((d) => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoreDistribution}>
                <XAxis dataKey="range" tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {scoreDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm text-blue-300 font-bold">
              No scores yet! 📊
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
