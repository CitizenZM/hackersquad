import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NARRATIVE_TYPE_LABELS, DATA_SOURCE_LABELS } from "@/lib/constants";
import { OverviewCharts } from "@/components/dashboard/overview-charts";

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
    <div className="space-y-5">
      {/* Score Cards - Fun Tiles */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="rounded-3xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 fun-shadow-sm overflow-hidden">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-3xl mb-1">💪</div>
            <div className="text-3xl font-black text-purple-700">
              {project.brandHealthScore ?? "—"}
            </div>
            <p className="text-xs font-bold text-purple-400">Brand Health</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 fun-shadow-sm overflow-hidden">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-3xl mb-1">🎯</div>
            <div className="text-3xl font-black text-amber-700">
              {project.opportunityScore ?? "—"}
            </div>
            <p className="text-xs font-bold text-amber-400">Opportunity</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 fun-shadow-sm overflow-hidden">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-3xl mb-1">🎬</div>
            <div className="text-3xl font-black text-blue-700">
              {contentAssets.length}
            </div>
            <p className="text-xs font-bold text-blue-400">Content</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100 fun-shadow-sm overflow-hidden">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-3xl mb-1">⚔️</div>
            <div className="text-3xl font-black text-pink-700">
              {competitors.length}
            </div>
            <p className="text-xs font-bold text-pink-400">Competitors</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Signals */}
      {topSignals.length > 0 && (
        <Card className="rounded-3xl border-2 border-emerald-200 bg-white fun-shadow-sm">
          <CardContent className="pt-4">
            <p className="text-sm font-black text-emerald-700 mb-3">🔥 Top Signals</p>
            <div className="flex flex-wrap gap-2">
              {topSignals.map((signal, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="rounded-full px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 border-2 border-emerald-200"
                >
                  {signal}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Brand Intel */}
      {brand && brand.brandPromise && (
        <Card className="rounded-3xl border-2 border-purple-200 bg-white fun-shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-black text-purple-700">🧠 Brand Intel</p>
              <Badge variant="outline" className="rounded-full text-[10px] font-bold">
                {DATA_SOURCE_LABELS[brand.dataSource]}
              </Badge>
            </div>
            <div className="space-y-3">
              {[
                { label: "Promise", value: brand.brandPromise, emoji: "🎯" },
                { label: "Value", value: brand.valueProposition, emoji: "💎" },
                { label: "Audience", value: brand.targetAudience, emoji: "👥" },
                { label: "Tone", value: brand.toneOfVoice, emoji: "🗣️" },
                { label: "Pricing", value: brand.pricingTheme, emoji: "💰" },
              ].filter(item => item.value).map((item) => (
                <div key={item.label} className="bg-purple-50 rounded-2xl p-3">
                  <p className="text-[10px] font-bold text-purple-400 uppercase">
                    {item.emoji} {item.label}
                  </p>
                  <p className="text-sm font-semibold text-purple-900 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <OverviewCharts
        narrativeData={narrativeData}
        scoreDistribution={scoreDistribution}
      />

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="rounded-3xl border-2 border-amber-200 bg-white fun-shadow-sm">
          <CardContent className="pt-4">
            <p className="text-sm font-black text-amber-700 mb-3">💡 Key Insights</p>
            <div className="space-y-2">
              {insights.slice(0, 5).map((insight) => (
                <div key={insight.id} className="bg-amber-50 rounded-2xl p-3">
                  <div className="flex items-start gap-2">
                    <Badge className="rounded-full text-[10px] font-bold bg-amber-200 text-amber-700 shrink-0">
                      {insight.category}
                    </Badge>
                    <div>
                      <p className="text-sm font-bold text-amber-900">{insight.title}</p>
                      <p className="text-xs text-amber-600 mt-0.5">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selling Points */}
      {sellingPoints.length > 0 && (
        <Card className="rounded-3xl border-2 border-blue-200 bg-white fun-shadow-sm">
          <CardContent className="pt-4">
            <p className="text-sm font-black text-blue-700 mb-3">⭐ Selling Points</p>
            <div className="space-y-2">
              {sellingPoints.slice(0, 6).map((sp) => (
                <div key={sp.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-bold">{sp.point}</p>
                  </div>
                  <div className="w-20 shrink-0">
                    <div className="h-3 rounded-full bg-blue-100 overflow-hidden">
                      <div
                        className="h-full rounded-full gradient-cool"
                        style={{ width: `${sp.strength || 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-black text-blue-600 w-8 text-right">
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
