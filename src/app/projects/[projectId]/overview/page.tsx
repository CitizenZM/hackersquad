import Link from "next/link";
import { prisma } from "@/lib/db";
import { NARRATIVE_TYPE_LABELS, DATA_SOURCE_LABELS } from "@/lib/constants";
import { OverviewCharts } from "@/components/dashboard/overview-charts";
import { HeroMetric } from "@/components/dashboard/hero-metric";
import { StatusBadge, ScoreBar } from "@/components/dashboard/status-badge";
import { ActionButton } from "@/components/dashboard/action-buttons";
import {
  Activity,
  Target,
  Film,
  Users,
  TrendingUp,
  ArrowRight,
  Lightbulb,
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

  const narrativeData = patterns.map((p) => ({
    name: NARRATIVE_TYPE_LABELS[p.type] || p.type,
    value: p.frequency,
    performance: p.avgPerformance || 0,
  }));

  const scoreDistribution = [
    { range: "0–20", count: contentAssets.filter((a) => (a.overallScore || 0) <= 20).length },
    { range: "21–40", count: contentAssets.filter((a) => (a.overallScore || 0) > 20 && (a.overallScore || 0) <= 40).length },
    { range: "41–60", count: contentAssets.filter((a) => (a.overallScore || 0) > 40 && (a.overallScore || 0) <= 60).length },
    { range: "61–80", count: contentAssets.filter((a) => (a.overallScore || 0) > 60 && (a.overallScore || 0) <= 80).length },
    { range: "81–100", count: contentAssets.filter((a) => (a.overallScore || 0) > 80).length },
  ];

  const topContent = contentAssets.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex justify-end">
        <ActionButton
          endpoint={`/api/projects/${projectId}/research`}
          label="Re-run research"
          loadingLabel="Researching..."
          icon="refresh"
        />
      </div>

      {/* Hero metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <HeroMetric
          label="Brand Health"
          value={project.brandHealthScore ?? null}
          suffix="/ 100"
          icon={<Activity className="h-4 w-4" />}
          hint="AI predicted"
        />
        <HeroMetric
          label="Opportunity"
          value={project.opportunityScore ?? null}
          suffix="/ 100"
          icon={<Target className="h-4 w-4" />}
          hint="Content gap"
        />
        <HeroMetric
          label="Content Analyzed"
          value={contentAssets.length}
          icon={<Film className="h-4 w-4" />}
          hint={`${contentAssets.filter(a => a.isBrandOwned).length} brand-owned`}
        />
        <HeroMetric
          label="Competitors"
          value={competitors.length}
          icon={<Users className="h-4 w-4" />}
          hint="Tracked"
        />
      </div>

      {/* Brand Intel + Top Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {brand?.brandPromise && (
          <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold tracking-tight">Brand Intelligence</p>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {DATA_SOURCE_LABELS[brand.dataSource]}
              </span>
            </div>
            <dl className="divide-y divide-border">
              {[
                { label: "Brand promise", value: brand.brandPromise },
                { label: "Value proposition", value: brand.valueProposition },
                { label: "Target audience", value: brand.targetAudience },
                { label: "Tone of voice", value: brand.toneOfVoice },
                { label: "Pricing theme", value: brand.pricingTheme },
              ].filter(i => i.value).map((item) => (
                <div key={item.label} className="grid grid-cols-3 gap-4 py-3">
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {item.label}
                  </dt>
                  <dd className="col-span-2 text-sm text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {topSignals.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold tracking-tight">Top Signals</p>
            </div>
            <ul className="space-y-2.5">
              {topSignals.slice(0, 8).map((signal, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-foreground shrink-0" />
                  <span className="text-foreground">{signal}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Charts */}
      <OverviewCharts
        narrativeData={narrativeData}
        scoreDistribution={scoreDistribution}
      />

      {/* Top Content Table */}
      {topContent.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <p className="text-sm font-semibold tracking-tight">Top Content</p>
            <Link
              href={`/projects/${projectId}/content`}
              className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="text-left font-medium px-5 py-2.5">Title</th>
                  <th className="text-left font-medium px-3 py-2.5 hidden md:table-cell">Narrative</th>
                  <th className="text-left font-medium px-3 py-2.5">Score</th>
                  <th className="text-right font-medium px-5 py-2.5 hidden sm:table-cell">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topContent.map((asset) => (
                  <tr key={asset.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        href={`/projects/${projectId}/insights/${asset.id}`}
                        className="block"
                      >
                        <p className="font-medium text-foreground truncate max-w-md">{asset.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {asset.platform || asset.type}
                        </p>
                      </Link>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      {asset.narrativeType && (
                        <span className="text-xs text-muted-foreground">
                          {NARRATIVE_TYPE_LABELS[asset.narrativeType]}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <ScoreBar score={asset.overallScore} />
                    </td>
                    <td className="px-5 py-3 text-right num text-muted-foreground hidden sm:table-cell">
                      {asset.viewCount?.toLocaleString() || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold tracking-tight">Key Insights</p>
          </div>
          <div className="space-y-3">
            {insights.slice(0, 5).map((insight) => (
              <div key={insight.id} className="flex gap-3 items-start">
                <StatusBadge level="neutral" className="mt-0.5 shrink-0">
                  {insight.category}
                </StatusBadge>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {insight.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selling Points */}
      {sellingPoints.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm font-semibold tracking-tight mb-4">Selling Points</p>
          <div className="space-y-2.5">
            {sellingPoints.slice(0, 8).map((sp) => (
              <div key={sp.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{sp.point}</p>
                </div>
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider w-20 text-right hidden sm:inline">
                  {sp.category}
                </span>
                <ScoreBar score={sp.strength} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
