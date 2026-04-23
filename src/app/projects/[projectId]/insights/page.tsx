import { prisma } from "@/lib/db";
import { NARRATIVE_TYPE_LABELS } from "@/lib/constants";
import { ScoreBar, StatusBadge, StatusLevel } from "@/components/dashboard/status-badge";
import { ActionButton } from "@/components/dashboard/action-buttons";
import {
  Film,
  Zap,
  Heart,
  MousePointerClick,
  Megaphone,
  TrendingDown,
  Lightbulb,
  AlertCircle,
  Clock,
  Target,
} from "lucide-react";

type DeepAnalysisData = {
  videoStructure?: {
    openingPatterns?: { pattern: string; frequency: number; effectiveness: string; example: string }[];
    hookDurationRange?: string;
    productRevealTiming?: string;
    averageLength?: string;
    structuralInsights?: string[];
  };
  vibeAnalysis?: {
    dominantTones?: { tone: string; frequency: number; avgScore: number; example: string }[];
    emotionalTriggers?: { trigger: string; usage: string; examples: string[] }[];
    visualStyleNotes?: string;
    pacingProfile?: string;
    vibeInsights?: string[];
  };
  ctaAnalysis?: {
    commonCTAs?: { cta: string; frequency: number; type: string; effectiveness: string }[];
    placement?: string;
    urgencyLevel?: string;
    conversionDrivers?: string[];
    ctaInsights?: string[];
  };
  sellingPointDeep?: {
    topPerformers?: { point: string; whyItWorks: string; bestPlatforms: string[]; exampleContent: string }[];
    underutilized?: { point: string; opportunity: string }[];
    messagingInsights?: string[];
  };
  competitiveGaps?: { gap: string; recommendation: string; priority: string }[];
  recommendations?: { title: string; description: string; impact: string; effort: string; category: string }[];
};

function severityLevel(val: string): StatusLevel {
  if (val === "high") return "healthy";
  if (val === "medium") return "attention";
  if (val === "low") return "neutral";
  return "neutral";
}

function priorityLevel(val: string): StatusLevel {
  if (val === "high") return "urgent";
  if (val === "medium") return "attention";
  if (val === "low") return "neutral";
  return "neutral";
}

export default async function InsightsListPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const [patterns, sellingPoints, insights, deepAnalysis] = await Promise.all([
    prisma.narrativePattern.findMany({ where: { projectId }, orderBy: { avgPerformance: "desc" } }),
    prisma.sellingPoint.findMany({ where: { projectId }, orderBy: { strength: "desc" } }),
    prisma.insight.findMany({ where: { projectId }, orderBy: { importance: "desc" } }),
    prisma.deepAnalysis.findUnique({ where: { projectId } }),
  ]);

  const deep = deepAnalysis as unknown as (DeepAnalysisData & { id: string; projectId: string }) | null;
  const hasDeep = !!(deep?.videoStructure || deep?.vibeAnalysis || deep?.ctaAnalysis);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Deep Content Insights</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Video structure, emotional vibe, CTA strategy, and strategic recommendations
          </p>
        </div>
        <ActionButton
          endpoint={`/api/projects/${projectId}/research`}
          label="Re-analyze"
          loadingLabel="Analyzing..."
          icon="brain"
        />
      </div>

      {/* Video Structure Analysis */}
      {deep?.videoStructure && (
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold tracking-tight">Video Structure Analysis</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-md border border-border p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Hook Duration</p>
              </div>
              <p className="text-sm font-semibold">{deep.videoStructure.hookDurationRange || "—"}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="h-3 w-3 text-muted-foreground" />
                <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Product Reveal</p>
              </div>
              <p className="text-sm font-semibold">{deep.videoStructure.productRevealTiming || "—"}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Film className="h-3 w-3 text-muted-foreground" />
                <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Average Length</p>
              </div>
              <p className="text-sm font-semibold">{deep.videoStructure.averageLength || "—"}</p>
            </div>
          </div>

          {deep.videoStructure.openingPatterns && deep.videoStructure.openingPatterns.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-2">Opening Patterns</p>
              <div className="space-y-2">
                {deep.videoStructure.openingPatterns.map((op, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-md border border-border p-3">
                    <StatusBadge level={severityLevel(op.effectiveness)} className="shrink-0">
                      {op.effectiveness}
                    </StatusBadge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{op.pattern}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 italic">&ldquo;{op.example}&rdquo;</p>
                    </div>
                    <span className="text-xs num text-muted-foreground shrink-0">{op.frequency}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {deep.videoStructure.structuralInsights && deep.videoStructure.structuralInsights.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-2">Key Findings</p>
              <ul className="space-y-1.5">
                {deep.videoStructure.structuralInsights.map((ins, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-foreground shrink-0" />
                    <span>{ins}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Vibe & Emotion Analysis */}
      {deep?.vibeAnalysis && (
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold tracking-tight">Vibe & Emotion</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {deep.vibeAnalysis.dominantTones && deep.vibeAnalysis.dominantTones.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-2">Dominant Tones</p>
                <div className="space-y-2">
                  {deep.vibeAnalysis.dominantTones.map((t, i) => (
                    <div key={i} className="rounded-md border border-border p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium capitalize">{t.tone}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs num text-muted-foreground">{t.frequency}×</span>
                          <StatusBadge level="neutral">avg {t.avgScore}</StatusBadge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground italic">&ldquo;{t.example}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {deep.vibeAnalysis.emotionalTriggers && deep.vibeAnalysis.emotionalTriggers.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-2">Emotional Triggers</p>
                <div className="space-y-2">
                  {deep.vibeAnalysis.emotionalTriggers.map((et, i) => (
                    <div key={i} className="rounded-md border border-border p-3">
                      <p className="text-sm font-medium capitalize">{et.trigger}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{et.usage}</p>
                      {et.examples && et.examples.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {et.examples.slice(0, 2).map((ex, j) => (
                            <span key={j} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {ex.slice(0, 40)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-1">Visual Style</p>
              <p className="text-sm">{deep.vibeAnalysis.visualStyleNotes || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-1">Pacing Profile</p>
              <p className="text-sm">{deep.vibeAnalysis.pacingProfile || "—"}</p>
            </div>
          </div>

          {deep.vibeAnalysis.vibeInsights && deep.vibeAnalysis.vibeInsights.length > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-2">Key Findings</p>
              <ul className="space-y-1.5">
                {deep.vibeAnalysis.vibeInsights.map((ins, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-foreground shrink-0" />
                    <span>{ins}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* CTA Analysis */}
      {deep?.ctaAnalysis && (
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold tracking-tight">CTA Strategy</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-md border border-border p-3">
              <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-1">Placement</p>
              <p className="text-sm font-semibold">{deep.ctaAnalysis.placement || "—"}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-1">Urgency Level</p>
              <StatusBadge level={severityLevel(deep.ctaAnalysis.urgencyLevel || "")}>
                {deep.ctaAnalysis.urgencyLevel || "—"}
              </StatusBadge>
            </div>
          </div>

          {deep.ctaAnalysis.commonCTAs && deep.ctaAnalysis.commonCTAs.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-2">Common CTAs</p>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="text-left font-medium px-3 py-2">CTA</th>
                      <th className="text-left font-medium px-3 py-2">Type</th>
                      <th className="text-left font-medium px-3 py-2">Effectiveness</th>
                      <th className="text-right font-medium px-3 py-2">Uses</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {deep.ctaAnalysis.commonCTAs.map((c, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-sm font-medium">&ldquo;{c.cta}&rdquo;</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground capitalize">{c.type}</td>
                        <td className="px-3 py-2">
                          <StatusBadge level={severityLevel(c.effectiveness)}>{c.effectiveness}</StatusBadge>
                        </td>
                        <td className="px-3 py-2 text-right num text-xs text-muted-foreground">{c.frequency}×</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {deep.ctaAnalysis.conversionDrivers && deep.ctaAnalysis.conversionDrivers.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-2">Conversion Drivers</p>
              <div className="flex flex-wrap gap-1.5">
                {deep.ctaAnalysis.conversionDrivers.map((d, i) => (
                  <StatusBadge key={i} level="neutral">{d}</StatusBadge>
                ))}
              </div>
            </div>
          )}

          {deep.ctaAnalysis.ctaInsights && deep.ctaAnalysis.ctaInsights.length > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-2">Key Findings</p>
              <ul className="space-y-1.5">
                {deep.ctaAnalysis.ctaInsights.map((ins, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-foreground shrink-0" />
                    <span>{ins}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Selling Point Deep Dive */}
      {deep?.sellingPointDeep && (deep.sellingPointDeep.topPerformers?.length || deep.sellingPointDeep.underutilized?.length) && (
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold tracking-tight">Selling Point Deep Dive</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {deep.sellingPointDeep.topPerformers && deep.sellingPointDeep.topPerformers.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wider font-medium text-[var(--status-healthy-fg)] mb-2 flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Top Performers
                </p>
                <div className="space-y-2">
                  {deep.sellingPointDeep.topPerformers.map((tp, i) => (
                    <div key={i} className="rounded-md border border-[var(--status-healthy)] bg-[var(--status-healthy-bg)]/30 p-3">
                      <p className="text-sm font-medium text-[var(--status-healthy-fg)]">{tp.point}</p>
                      <p className="text-xs text-muted-foreground mt-1">{tp.whyItWorks}</p>
                      {tp.bestPlatforms && tp.bestPlatforms.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="text-[10px] text-muted-foreground">Best on:</span>
                          {tp.bestPlatforms.map((p, j) => (
                            <span key={j} className="text-[10px] font-medium">{p}</span>
                          ))}
                        </div>
                      )}
                      {tp.exampleContent && (
                        <p className="text-[10px] text-muted-foreground italic mt-1.5">Ex: &ldquo;{tp.exampleContent.slice(0, 60)}&rdquo;</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {deep.sellingPointDeep.underutilized && deep.sellingPointDeep.underutilized.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wider font-medium text-[var(--status-attention-fg)] mb-2 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" /> Underutilized Opportunities
                </p>
                <div className="space-y-2">
                  {deep.sellingPointDeep.underutilized.map((u, i) => (
                    <div key={i} className="rounded-md border border-[var(--status-attention)] bg-[var(--status-attention-bg)]/30 p-3">
                      <p className="text-sm font-medium text-[var(--status-attention-fg)]">{u.point}</p>
                      <p className="text-xs text-muted-foreground mt-1">{u.opportunity}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {deep.sellingPointDeep.messagingInsights && deep.sellingPointDeep.messagingInsights.length > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-2">Messaging Insights</p>
              <ul className="space-y-1.5">
                {deep.sellingPointDeep.messagingInsights.map((ins, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-foreground shrink-0" />
                    <span>{ins}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Competitive Gaps */}
      {deep?.competitiveGaps && deep.competitiveGaps.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold tracking-tight">Competitive Gaps</h3>
          </div>
          <div className="space-y-2">
            {deep.competitiveGaps.map((g, i) => (
              <div key={i} className="flex gap-3 items-start rounded-md border border-border p-3">
                <StatusBadge level={priorityLevel(g.priority)} className="shrink-0">{g.priority}</StatusBadge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{g.gap}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium text-foreground">Recommendation:</span> {g.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Strategic Recommendations */}
      {deep?.recommendations && deep.recommendations.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold tracking-tight">Strategic Recommendations</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {deep.recommendations.map((r, i) => (
              <div key={i} className="rounded-md border border-border p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold flex-1">{r.title}</p>
                  <StatusBadge level="neutral" className="shrink-0">{r.category}</StatusBadge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{r.description}</p>
                <div className="flex gap-3 text-[10px] uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Impact:</span>
                    <StatusBadge level={severityLevel(r.impact)}>{r.impact}</StatusBadge>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Effort:</span>
                    <StatusBadge level={r.effort === "low" ? "healthy" : r.effort === "medium" ? "attention" : "urgent"}>{r.effort}</StatusBadge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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

      {/* Selling Points Matrix */}
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

      {/* Other Insights */}
      {insights.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold tracking-tight">Other Insights ({insights.length})</h3>
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

      {patterns.length === 0 && sellingPoints.length === 0 && insights.length === 0 && !hasDeep && (
        <div className="rounded-lg border border-border bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No insights yet. Run research to generate analysis.
          </p>
        </div>
      )}
    </div>
  );
}
