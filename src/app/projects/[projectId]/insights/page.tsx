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
  MapPin,
  Users,
  Eye,
  CheckCircle2,
  XCircle,
  Camera,
  Layers,
  Sparkles,
  Globe,
} from "lucide-react";

type EnvironmentAnalysisItem = {
  environment: string;
  frequency: number;
  description: string;
  lightingNotes?: string;
  bestFor?: string;
  examples?: string[];
};

type CameraAngle = {
  shot: string;
  movement?: string;
  frequency: number;
  whenToUse?: string;
  adEffect?: string;
  apertureSuggestion?: string;
  examples?: string[];
};

type HookFormula = {
  type: string;
  formula: string;
  openingLine?: string;
  visualDescription?: string;
  why?: string;
  platformFit?: string[];
  scoreImpact?: string;
  examples?: string[];
};

type PlatformInsight = {
  platform: string;
  contentStyle?: string;
  topFormats?: string[];
  avgEngagement?: string;
  bestPractices?: string[];
  avoidPatterns?: string[];
};

type SellingPointVisual = {
  point: string;
  visualTreatment?: string;
  screenTime?: string;
  placement?: string;
  cameraRecommendation?: string;
  examples?: string[];
};

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
  environmentAnalysis?: EnvironmentAnalysisItem[];
  cameraAngles?: CameraAngle[];
  hookFormulas?: HookFormula[];
  platformInsights?: PlatformInsight[];
  sellingPointVisuals?: SellingPointVisual[];
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

function scoreImpactClass(impact: string | undefined) {
  if (impact === "high") return "bg-green-100 text-green-700 border border-green-200";
  if (impact === "medium") return "bg-amber-100 text-amber-700 border border-amber-200";
  return "bg-gray-100 text-gray-600 border border-gray-200";
}

function FrequencyBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-foreground/60" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] num text-muted-foreground w-5 text-right">{value}×</span>
    </div>
  );
}

const PLATFORM_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; icon: React.ReactNode; label: string }
> = {
  YouTube: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    label: "YouTube",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-red-600" aria-hidden>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  TikTok: {
    color: "text-gray-900",
    bg: "bg-gray-50",
    border: "border-gray-200",
    label: "TikTok",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-gray-900" aria-hidden>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.25 8.25 0 0 0 4.83 1.55V6.79a4.85 4.85 0 0 1-1.07-.1z" />
      </svg>
    ),
  },
  Instagram: {
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    label: "Instagram",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-purple-600" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
  Facebook: {
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    label: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-blue-600" aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
};

function getPlatformConfig(platform: string) {
  // Try exact match first, then partial match
  if (PLATFORM_CONFIG[platform]) return PLATFORM_CONFIG[platform];
  const key = Object.keys(PLATFORM_CONFIG).find((k) =>
    platform.toLowerCase().includes(k.toLowerCase())
  );
  return key ? PLATFORM_CONFIG[key] : null;
}

export default async function InsightsListPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const [patterns, sellingPoints, insights, deepAnalysis, brand] = await Promise.all([
    prisma.narrativePattern.findMany({ where: { projectId }, orderBy: { avgPerformance: "desc" } }),
    prisma.sellingPoint.findMany({ where: { projectId }, orderBy: { strength: "desc" } }),
    prisma.insight.findMany({ where: { projectId }, orderBy: { importance: "desc" } }),
    prisma.deepAnalysis.findUnique({ where: { projectId } }),
    prisma.brand.findUnique({ where: { projectId } }),
  ]);

  const deep = deepAnalysis as unknown as (DeepAnalysisData & { id: string; projectId: string }) | null;
  const hasDeep = !!(deep?.videoStructure || deep?.vibeAnalysis || deep?.ctaAnalysis);

  type UseEnvironment = { name: string; description: string; typicalUser: string; imagePrompt: string };
  type ActorSetting = { role: string; ageRange: string; scenario: string; visualDescription: string; painPoint: string; productInteraction: string };
  type DisplayGuideline = { rule: string; example: string; antiExample: string };

  const useEnvironments = (brand?.useEnvironments as UseEnvironment[] | null) || [];
  const actorSettings = (brand?.actorSettings as ActorSetting[] | null) || [];
  const displayGuidelines = (brand?.displayGuidelines as DisplayGuideline[] | null) || [];

  // Extended analysis fields
  const environmentAnalysis = (deep?.environmentAnalysis as EnvironmentAnalysisItem[] | null) || [];
  const cameraAngles = (deep?.cameraAngles as CameraAngle[] | null) || [];
  const hookFormulas = (deep?.hookFormulas as HookFormula[] | null) || [];
  const platformInsights = (deep?.platformInsights as PlatformInsight[] | null) || [];
  const sellingPointVisuals = (deep?.sellingPointVisuals as SellingPointVisual[] | null) || [];
  const hasExtendedAnalysis =
    hookFormulas.length > 0 || cameraAngles.length > 0 || environmentAnalysis.length > 0;

  const aiModel =
    process.env.AI_MODEL ||
    (process.env.OPENROUTER_API_KEY ? "openrouter/free" : "gpt-4o-mini");

  const maxCameraFreq = cameraAngles.length > 0
    ? Math.max(...cameraAngles.map((c) => c.frequency))
    : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Deep Content Insights</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Video structure, emotional vibe, CTA strategy, and strategic recommendations
          </p>
        </div>
        <ActionButton
          endpoint={`/api/projects/${projectId}/insights/reanalyze`}
          label="Re-analyze"
          loadingLabel="Analyzing..."
          icon="brain"
        />
      </div>

      {/* A. Model indicator */}
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 shrink-0" />
        <span>
          Analysis by: <span className="font-mono text-foreground">{aiModel}</span>
        </span>
        <span className="text-border">·</span>
        <span>Results are AI-generated and may require validation.</span>
      </div>

      {/* B. Hook Formulas */}
      {hookFormulas.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold tracking-tight">Hook Formulas</h3>
            <span className="text-xs text-muted-foreground">{hookFormulas.length} patterns identified</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {hookFormulas.map((hf, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-4 space-y-3 hover:border-amber-200 transition-colors"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold leading-tight">{hf.type}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${scoreImpactClass(hf.scoreImpact)}`}>
                    {hf.scoreImpact || "medium"} impact
                  </span>
                </div>

                {/* Formula as numbered steps */}
                {hf.formula && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Formula</p>
                    <ol className="space-y-1">
                      {hf.formula.split(/\d+\.\s+/).filter(Boolean).map((step, j) => (
                        <li key={j} className="flex gap-2 text-xs">
                          <span className="shrink-0 w-4 h-4 rounded-full bg-foreground/10 text-foreground text-[10px] font-semibold flex items-center justify-center">
                            {j + 1}
                          </span>
                          <span className="text-foreground/80">{step.trim()}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Opening line */}
                {hf.openingLine && (
                  <blockquote className="border-l-2 border-amber-300 pl-3 text-xs italic text-muted-foreground">
                    &ldquo;{hf.openingLine}&rdquo;
                  </blockquote>
                )}

                {/* Platform fit + Why */}
                <div className="flex flex-wrap gap-1">
                  {(hf.platformFit || []).map((p, j) => {
                    const cfg = getPlatformConfig(p);
                    return (
                      <span
                        key={j}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg ? `${cfg.bg} ${cfg.color}` : "bg-muted text-muted-foreground"}`}
                      >
                        {p}
                      </span>
                    );
                  })}
                </div>

                {hf.why && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{hf.why}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* C. Camera Angles */}
      {cameraAngles.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-semibold tracking-tight">Camera Angles & Shots</h3>
            <span className="text-xs text-muted-foreground">{cameraAngles.length} shot types analyzed</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cameraAngles.map((ca, i) => {
              const whenBadgeColor =
                ca.whenToUse === "hook"
                  ? "bg-amber-100 text-amber-700"
                  : ca.whenToUse === "CTA"
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700";

              return (
                <div key={i} className="rounded-xl border border-border bg-card p-3 space-y-2.5">
                  {/* Shot name + movement */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{ca.shot}</p>
                      {ca.movement && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{ca.movement}</p>
                      )}
                    </div>
                    {ca.whenToUse && (
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${whenBadgeColor}`}>
                        {ca.whenToUse}
                      </span>
                    )}
                  </div>

                  {/* Ad effect */}
                  {ca.adEffect && (
                    <p className="text-xs text-foreground/70 leading-relaxed">{ca.adEffect}</p>
                  )}

                  {/* Aperture suggestion */}
                  {ca.apertureSuggestion && (
                    <div className="rounded bg-muted/50 px-2 py-1">
                      <p className="text-[10px] text-muted-foreground font-mono">{ca.apertureSuggestion}</p>
                    </div>
                  )}

                  {/* Frequency bar */}
                  <FrequencyBar value={ca.frequency} max={maxCameraFreq} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* D. Environment Analysis */}
      {environmentAnalysis.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-teal-500" />
            <h3 className="text-sm font-semibold tracking-tight">Environment Analysis</h3>
            <span className="text-xs text-muted-foreground">{environmentAnalysis.length} environments</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {environmentAnalysis.map((env, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="bg-teal-50 border-b border-teal-100 px-4 py-2.5 flex items-center justify-between">
                  <p className="text-xs font-semibold text-teal-900">{env.environment}</p>
                  <span className="text-[10px] text-teal-600 num">{env.frequency}×</span>
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-xs text-foreground/80 leading-relaxed">{env.description}</p>

                  {/* Lighting callout */}
                  {env.lightingNotes && (
                    <div className="rounded-md bg-amber-50 border border-amber-100 px-3 py-2">
                      <p className="text-[10px] font-semibold text-amber-700 mb-0.5">Lighting</p>
                      <p className="text-[10px] text-amber-800 leading-relaxed">{env.lightingNotes}</p>
                    </div>
                  )}

                  {/* Best for */}
                  {env.bestFor && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Best for</p>
                      <p className="text-[10px] text-foreground/70">{env.bestFor}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* E. Selling Point Visuals */}
      {sellingPointVisuals.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-green-500" />
            <h3 className="text-sm font-semibold tracking-tight">Selling Point Visual Treatments</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {sellingPointVisuals.map((spv, i) => (
              <div
                key={i}
                className="rounded-xl border-2 border-green-200 bg-card p-4 space-y-2.5"
              >
                <p className="text-sm font-bold text-green-800">{spv.point}</p>

                {spv.visualTreatment && (
                  <p className="text-xs text-foreground/80 leading-relaxed">{spv.visualTreatment}</p>
                )}

                {spv.cameraRecommendation && (
                  <p className="text-xs text-muted-foreground italic">{spv.cameraRecommendation}</p>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {spv.screenTime && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-muted px-2 py-0.5 rounded-full">
                      <Clock className="h-2.5 w-2.5" />
                      {spv.screenTime}
                    </span>
                  )}
                  {spv.placement && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-muted px-2 py-0.5 rounded-full">
                      <Target className="h-2.5 w-2.5" />
                      {spv.placement}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* F. Platform Insights */}
      {platformInsights.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-semibold tracking-tight">Platform Insights</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {platformInsights.map((pi, i) => {
              const cfg = getPlatformConfig(pi.platform);
              return (
                <div key={i} className={`rounded-xl border overflow-hidden ${cfg ? cfg.border : "border-border"}`}>
                  {/* Platform header */}
                  <div className={`px-4 py-3 flex items-center gap-2 ${cfg ? cfg.bg : "bg-muted"}`}>
                    {cfg && cfg.icon}
                    <p className={`text-sm font-bold ${cfg ? cfg.color : "text-foreground"}`}>
                      {pi.platform}
                    </p>
                    {pi.avgEngagement && (
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        avg {pi.avgEngagement} engagement
                      </span>
                    )}
                  </div>

                  <div className="bg-card p-4 space-y-3">
                    {/* Content style */}
                    {pi.contentStyle && (
                      <p className="text-xs text-foreground/80 leading-relaxed">{pi.contentStyle}</p>
                    )}

                    {/* Best practices checklist */}
                    {pi.bestPractices && pi.bestPractices.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-1.5">
                          Best Practices
                        </p>
                        <ul className="space-y-1">
                          {pi.bestPractices.map((bp, j) => (
                            <li key={j} className="flex items-start gap-1.5 text-xs">
                              <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                              <span>{bp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Avoid patterns */}
                    {pi.avoidPatterns && pi.avoidPatterns.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-1.5">
                          Avoid
                        </p>
                        <ul className="space-y-1">
                          {pi.avoidPatterns.map((ap, j) => (
                            <li key={j} className="flex items-start gap-1.5 text-xs text-red-700">
                              <XCircle className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />
                              <span>{ap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── EXISTING SECTIONS BELOW ── */}

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

      {/* Use Environments */}
      {useEnvironments.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-semibold">Use Environments</h3>
            <span className="text-xs text-muted-foreground">Where users interact with this product</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {useEnvironments.map((env, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                  <p className="text-xs font-semibold text-blue-900">{env.name}</p>
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-xs text-foreground/80 leading-relaxed">{env.description}</p>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground">{env.typicalUser}</p>
                  </div>
                  {env.imagePrompt && (
                    <div className="rounded-lg bg-muted/50 border border-border p-2 mt-2">
                      <p className="text-[10px] font-semibold text-muted-foreground mb-1">Scene Prompt for Video</p>
                      <p className="text-[10px] text-foreground/60 font-mono leading-relaxed line-clamp-3">{env.imagePrompt}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Actor Settings */}
      {actorSettings.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-500" />
            <h3 className="text-sm font-semibold">Actor Role Settings</h3>
            <span className="text-xs text-muted-foreground">Who appears in content and how they behave</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {actorSettings.map((actor, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="bg-purple-50 border-b border-purple-100 px-4 py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-purple-600" />
                    <p className="text-xs font-semibold text-purple-900">{actor.role}</p>
                  </div>
                  <span className="text-[10px] text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">{actor.ageRange}</span>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-xs text-foreground/80">{actor.scenario}</p>
                  <div className="space-y-1.5">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Appearance</p>
                      <p className="text-[10px] text-foreground/70">{actor.visualDescription}</p>
                    </div>
                    <div className="rounded-lg bg-red-50 border border-red-100 p-2">
                      <p className="text-[10px] font-semibold text-red-700 mb-0.5">Pain Point</p>
                      <p className="text-[10px] text-red-800">{actor.painPoint}</p>
                    </div>
                    <div className="rounded-lg bg-blue-50 border border-blue-100 p-2">
                      <p className="text-[10px] font-semibold text-blue-700 mb-0.5">Product Interaction</p>
                      <p className="text-[10px] text-blue-800">{actor.productInteraction}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Product Display Guidelines */}
      {displayGuidelines.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold">Product Display Guidelines</h3>
            <span className="text-xs text-muted-foreground">How to correctly show this product in video</span>
          </div>
          <div className="space-y-2">
            {displayGuidelines.map((guide, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  {guide.rule}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                    <p className="text-[10px] font-semibold text-emerald-700 mb-1.5 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Correct Approach
                    </p>
                    <p className="text-xs text-emerald-800 leading-relaxed">{guide.example}</p>
                  </div>
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                    <p className="text-[10px] font-semibold text-red-700 mb-1.5 flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> Must Avoid
                    </p>
                    <p className="text-xs text-red-800 leading-relaxed">{guide.antiExample}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {patterns.length === 0 &&
        sellingPoints.length === 0 &&
        insights.length === 0 &&
        !hasDeep &&
        !hasExtendedAnalysis &&
        useEnvironments.length === 0 && (
          <div className="rounded-lg border border-border bg-card py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No insights yet. Run research to generate analysis.
            </p>
          </div>
        )}
    </div>
  );
}
