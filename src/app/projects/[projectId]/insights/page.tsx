import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NARRATIVE_TYPE_LABELS } from "@/lib/constants";

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
      <h2 className="text-lg font-semibold">Storytelling & Pattern Analysis</h2>

      {/* Narrative Patterns */}
      {patterns.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Narrative Patterns
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {patterns.map((p) => (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      {NARRATIVE_TYPE_LABELS[p.type] || p.name}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {p.frequency}x used
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-xs"
                      >
                        Avg: {p.avgPerformance?.toFixed(0)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                  {(p.bestPractices as string[])?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium mb-1">Best Practices:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {(p.bestPractices as string[]).map((bp, i) => (
                          <li key={i}>- {bp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Selling Points Matrix */}
      {sellingPoints.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Selling Point Matrix
          </h3>
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {sellingPoints.map((sp) => (
                  <div key={sp.id} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{sp.point}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {sp.category}
                    </Badge>
                    <div className="w-20 shrink-0">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${sp.strength || 0}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right shrink-0">
                      Str: {sp.strength}
                    </span>
                    <span className="text-xs text-muted-foreground w-16 text-right shrink-0">
                      Uniq: {sp.uniqueness}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* All Insights */}
      {insights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            All Insights ({insights.length})
          </h3>
          <div className="space-y-2">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="py-3">
                  <div className="flex gap-3">
                    <Badge variant="secondary" className="text-xs shrink-0 h-fit">
                      {insight.category}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{insight.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {insight.description}
                      </p>
                      {insight.recommendation && (
                        <p className="text-xs text-primary mt-1">
                          Recommendation: {insight.recommendation}
                        </p>
                      )}
                    </div>
                    {insight.importance && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {insight.importance}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {patterns.length === 0 && sellingPoints.length === 0 && insights.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No insights yet. Run research to generate analysis.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
