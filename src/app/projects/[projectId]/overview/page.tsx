import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NARRATIVE_TYPE_LABELS, DATA_SOURCE_LABELS } from "@/lib/constants";
import { OverviewCharts } from "@/components/dashboard/overview-charts";
import {
  Activity,
  Target,
  TrendingUp,
  Users,
  Film,
  Lightbulb,
  BarChart3,
} from "lucide-react";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const [project, contentAssets, patterns, sellingPoints, insights, competitors] =
    await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        include: { brand: true },
      }),
      prisma.contentAsset.findMany({
        where: { projectId },
        orderBy: { overallScore: "desc" },
      }),
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
        take: 10,
      }),
      prisma.competitor.findMany({ where: { projectId } }),
    ]);

  if (!project) return <div>Project not found</div>;

  const brand = project.brand;
  const topSignals = (project.topSignals as string[]) || [];

  // Prepare chart data
  const narrativeData = patterns.map((p) => ({
    name: NARRATIVE_TYPE_LABELS[p.type] || p.type,
    value: p.frequency,
    performance: p.avgPerformance || 0,
  }));

  const scoreDistribution = [
    { range: "0-20", count: contentAssets.filter((a) => (a.overallScore || 0) <= 20).length },
    { range: "21-40", count: contentAssets.filter((a) => (a.overallScore || 0) > 20 && (a.overallScore || 0) <= 40).length },
    { range: "41-60", count: contentAssets.filter((a) => (a.overallScore || 0) > 40 && (a.overallScore || 0) <= 60).length },
    { range: "61-80", count: contentAssets.filter((a) => (a.overallScore || 0) > 60 && (a.overallScore || 0) <= 80).length },
    { range: "81-100", count: contentAssets.filter((a) => (a.overallScore || 0) > 80).length },
  ];

  return (
    <div className="space-y-6">
      {/* Score cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Brand Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {project.brandHealthScore ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              AI Predicted Score
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Opportunity</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {project.opportunityScore ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Content Gap Score
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Content Analyzed</CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{contentAssets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total assets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Competitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{competitors.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Signals */}
      {topSignals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Market Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topSignals.map((signal, i) => (
                <Badge key={i} variant="secondary" className="text-sm py-1 px-3">
                  {signal}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Brand Summary */}
      {brand && brand.brandPromise && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Brand Intelligence</CardTitle>
              <Badge variant="outline" className="text-xs">
                {DATA_SOURCE_LABELS[brand.dataSource]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">Brand Promise</p>
                  <p className="text-sm mt-1">{brand.brandPromise}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">Value Proposition</p>
                  <p className="text-sm mt-1">{brand.valueProposition}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">Target Audience</p>
                  <p className="text-sm mt-1">{brand.targetAudience}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">Tone of Voice</p>
                  <p className="text-sm mt-1">{brand.toneOfVoice}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">Pricing Theme</p>
                  <p className="text-sm mt-1">{brand.pricingTheme}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">Key CTAs</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {((brand.ctaLanguage as string[]) || []).slice(0, 6).map((cta, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{cta}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <OverviewCharts
          narrativeData={narrativeData}
          scoreDistribution={scoreDistribution}
        />
      </div>

      {/* Key Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.slice(0, 5).map((insight) => (
                <div key={insight.id} className="flex gap-3 p-3 rounded-lg border">
                  <Badge variant="secondary" className="text-xs shrink-0 h-fit">
                    {insight.category}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {insight.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Selling Points */}
      {sellingPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Selling Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sellingPoints.slice(0, 8).map((sp) => (
                <div key={sp.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm">{sp.point}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{sp.category}</Badge>
                  <div className="w-24">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${sp.strength || 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {sp.strength}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
