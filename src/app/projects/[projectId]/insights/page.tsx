import { prisma } from "@/lib/db";
import { NARRATIVE_TYPE_LABELS } from "@/lib/constants";
import { ScoreBar, StatusBadge } from "@/components/dashboard/status-badge";
import { ActionButton } from "@/components/dashboard/action-buttons";

export default async function InsightsListPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const [patterns, sellingPoints, insights] = await Promise.all([
    prisma.narrativePattern.findMany({
      where: { projectId },
      orderBy: { avgPerformance: "desc" },
    }),
    prisma.sellingPoint.findMany({
      where: { projectId },
      orderBy: { strength: "desc" },
    }),
    prisma.insight.findMany({
      where: { projectId },
      orderBy: { importance: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Insights & Patterns</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Storytelling patterns, selling points, and strategic findings
          </p>
        </div>
        <ActionButton
          endpoint={`/api/projects/${projectId}/research`}
          label="Re-analyze"
          loadingLabel="Analyzing..."
          icon="brain"
        />
      </div>

      {/* Narrative Patterns */}
      {patterns.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight">Narrative Patterns</h3>
            <span className="text-xs text-muted-foreground">{patterns.length} identified</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {patterns.map((p) => (
              <div key={p.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{NARRATIVE_TYPE_LABELS[p.type] || p.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-semibold num tracking-tight">{p.avgPerformance?.toFixed(0) ?? "—"}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg score</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Used {p.frequency}x</span>
                </div>
                {(p.bestPractices as string[])?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Best practices</p>
                    <ul className="space-y-1">
                      {((p.bestPractices as string[]) || []).slice(0, 3).map((bp, i) => (
                        <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                          <span className="text-foreground">·</span>
                          {bp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Selling Points */}
      {sellingPoints.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold tracking-tight">Selling Point Matrix</h3>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="text-left font-medium px-4 py-2.5">Point</th>
                  <th className="text-left font-medium px-3 py-2.5">Category</th>
                  <th className="text-left font-medium px-3 py-2.5">Strength</th>
                  <th className="text-left font-medium px-3 py-2.5">Uniqueness</th>
                  <th className="text-left font-medium px-3 py-2.5">Frequency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sellingPoints.map((sp) => (
                  <tr key={sp.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 text-sm">{sp.point}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground capitalize">{sp.category.replace("_", " ")}</td>
                    <td className="px-3 py-3"><ScoreBar score={sp.strength} /></td>
                    <td className="px-3 py-3"><ScoreBar score={sp.uniqueness} /></td>
                    <td className="px-3 py-3 text-xs num text-muted-foreground">{sp.frequency}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold tracking-tight">All Insights ({insights.length})</h3>
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {insights.map((insight) => (
              <div key={insight.id} className="p-4 flex gap-3 items-start">
                <StatusBadge level="neutral" className="shrink-0">
                  {insight.category}
                </StatusBadge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                  {insight.recommendation && (
                    <p className="text-xs text-foreground mt-1.5">
                      <span className="font-medium">Recommendation:</span> {insight.recommendation}
                    </p>
                  )}
                </div>
                {insight.importance && (
                  <span className="text-xs num text-muted-foreground shrink-0">
                    {insight.importance}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {patterns.length === 0 && sellingPoints.length === 0 && insights.length === 0 && (
        <div className="rounded-lg border border-border bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No insights yet. Run research to generate analysis.
          </p>
        </div>
      )}
    </div>
  );
}
