import { prisma } from "@/lib/db";
import Link from "next/link";
import { NARRATIVE_TYPE_LABELS, CONTENT_TYPE_LABELS, CONTENT_CATEGORY_LABELS } from "@/lib/constants";
import { ScoreBar, StatusBadge } from "@/components/dashboard/status-badge";
import { LoadMoreButton } from "@/components/dashboard/action-buttons";
import { Eye, ThumbsUp, ExternalLink, ChevronRight } from "lucide-react";

function formatDate(date: Date | string | null) {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatNumber(n: number | null) {
  if (n == null) return "—";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

type SourceGroup = {
  key: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  borderColor: string;
  activeBg: string;
  activeFg: string;
  badgeBg: string;
  badgeFg: string;
  types: string[];
};

const SOURCE_GROUPS: SourceGroup[] = [
  {
    key: "YOUTUBE",
    label: "YouTube",
    shortLabel: "YouTube",
    icon: (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    borderColor: "border-red-500",
    activeBg: "bg-red-600",
    activeFg: "text-white",
    badgeBg: "bg-red-100",
    badgeFg: "text-red-700",
    types: ["YOUTUBE_VIDEO", "YOUTUBE_SHORT"],
  },
  {
    key: "TIKTOK",
    label: "TikTok",
    shortLabel: "TikTok",
    icon: (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.25 8.25 0 0 0 4.83 1.55V6.79a4.85 4.85 0 0 1-1.07-.1z" />
      </svg>
    ),
    borderColor: "border-gray-900",
    activeBg: "bg-gray-900",
    activeFg: "text-white",
    badgeBg: "bg-gray-100",
    badgeFg: "text-gray-900",
    types: ["TIKTOK_VIDEO"],
  },
  {
    key: "INSTAGRAM",
    label: "Instagram",
    shortLabel: "IG/Meta",
    icon: (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
    borderColor: "border-purple-500",
    activeBg: "bg-gradient-to-r from-purple-600 to-pink-500",
    activeFg: "text-white",
    badgeBg: "bg-purple-100",
    badgeFg: "text-purple-700",
    types: ["SOCIAL_POST"],
  },
  {
    key: "WEB",
    label: "Web",
    shortLabel: "Web",
    icon: (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-2" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    borderColor: "border-gray-400",
    activeBg: "bg-gray-600",
    activeFg: "text-white",
    badgeBg: "bg-gray-100",
    badgeFg: "text-gray-700",
    types: ["WEBSITE_PAGE", "WEB_MENTION", "REVIEW"],
  },
];

function getPlatformGroup(type: string): SourceGroup | null {
  return SOURCE_GROUPS.find((g) => g.types.includes(type)) ?? null;
}

function PlatformBadge({ type }: { type: string }) {
  const group = getPlatformGroup(type);
  if (!group) return <span className="text-[10px] text-muted-foreground">{CONTENT_TYPE_LABELS[type] || type}</span>;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${group.badgeBg} ${group.badgeFg}`}>
      {group.icon}
      {CONTENT_TYPE_LABELS[type] || type}
    </span>
  );
}

export default async function ContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ sort?: string; order?: string; platform?: string; category?: string }>;
}) {
  const { projectId } = await params;
  const sp = await searchParams;
  const sortBy = sp.sort || "overallScore";
  const order = sp.order || "desc";
  const platformFilter = sp.platform || "";
  const categoryFilter = sp.category || "";

  const orderByMap: Record<string, Record<string, string>> = {
    overallScore: { overallScore: order },
    viewCount: { viewCount: order },
    publishedAt: { publishedAt: order },
    engagementRate: { engagementRate: order },
  };

  const whereClause: Record<string, unknown> = { projectId };
  if (platformFilter) whereClause.type = platformFilter;
  if (categoryFilter) whereClause.contentCategory = categoryFilter;

  const assets = await prisma.contentAsset.findMany({
    where: whereClause,
    orderBy: orderByMap[sortBy] || { overallScore: "desc" },
    include: { competitor: { select: { name: true } } },
  });

  const allAssets = await prisma.contentAsset.findMany({
    where: { projectId },
    select: { type: true, contentCategory: true },
  });

  const platformCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  allAssets.forEach((a) => {
    platformCounts[a.type] = (platformCounts[a.type] || 0) + 1;
    if (a.contentCategory) categoryCounts[a.contentCategory] = (categoryCounts[a.contentCategory] || 0) + 1;
  });

  // Build source group counts
  const sourceCounts: Record<string, number> = {};
  Object.entries(platformCounts).forEach(([type, count]) => {
    const group = getPlatformGroup(type);
    if (group) {
      sourceCounts[group.key] = (sourceCounts[group.key] || 0) + count;
    }
  });

  function buildFilterUrl(overrides: Record<string, string>) {
    const base: Record<string, string> = { sort: sortBy, order };
    if (platformFilter) base.platform = platformFilter;
    if (categoryFilter) base.category = categoryFilter;
    const merged = { ...base, ...overrides };
    const search = new URLSearchParams(merged).toString();
    return `?${search}`;
  }

  function sortLink(col: string) {
    const newOrder = sortBy === col && order === "desc" ? "asc" : "desc";
    return buildFilterUrl({ sort: col, order: newOrder });
  }

  function sortArrow(col: string) {
    if (sortBy !== col) return "";
    return order === "desc" ? " ↓" : " ↑";
  }

  // Determine active source group from current platform filter
  const activeSourceGroup = platformFilter
    ? (SOURCE_GROUPS.find((g) => g.types.includes(platformFilter))?.key ?? null)
    : null;

  const hasMultiplePlatforms = Object.keys(platformCounts).length > 1;

  return (
    <div className="space-y-5">
      {/* Header + Sort bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Content Intelligence</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {assets.length} asset{assets.length !== 1 ? "s" : ""} · Sorted by {sortBy}
            {sortArrow(sortBy)}
          </p>
        </div>

        {/* Sort chips */}
        <div className="flex gap-1 text-xs flex-wrap">
          {[
            { col: "overallScore", label: "Score" },
            { col: "viewCount", label: "Views" },
            { col: "publishedAt", label: "Date" },
            { col: "engagementRate", label: "Engagement" },
          ].map((s) => (
            <Link
              key={s.col}
              href={sortLink(s.col)}
              className={`px-2.5 py-1 rounded-md border transition-colors ${
                sortBy === s.col
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {s.label}
              {sortArrow(s.col)}
            </Link>
          ))}
        </div>
      </div>

      {/* Source filter row */}
      {hasMultiplePlatforms && (
        <div className="flex gap-2 flex-wrap items-center">
          {/* All sources chip */}
          <Link
            href={buildFilterUrl({ platform: "", category: categoryFilter })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
              !platformFilter
                ? "bg-foreground text-background border-foreground shadow-sm"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-2" aria-hidden>
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            All Sources
            <span className="opacity-60">({allAssets.length})</span>
          </Link>

          {SOURCE_GROUPS.filter((g) => sourceCounts[g.key] > 0).map((group) => {
            const isActive = activeSourceGroup === group.key;
            // When clicking an active source group chip, clear the filter
            const targetTypes = group.types;
            // Pick the first type in the group that exists in data for the URL
            const firstMatchingType = targetTypes.find((t) => platformCounts[t]) ?? targetTypes[0];

            return (
              <Link
                key={group.key}
                href={
                  isActive
                    ? buildFilterUrl({ platform: "", category: categoryFilter })
                    : buildFilterUrl({ platform: firstMatchingType, category: categoryFilter })
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                  isActive
                    ? `${group.activeBg} ${group.activeFg} ${group.borderColor} shadow-sm`
                    : `${group.borderColor} border-opacity-50 text-muted-foreground hover:text-foreground hover:border-opacity-100`
                }`}
              >
                {group.icon}
                {group.label}
                <span className={isActive ? "opacity-70" : "opacity-50"}>({sourceCounts[group.key]})</span>
              </Link>
            );
          })}

          {/* Category chips */}
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <Link
              key={cat}
              href={buildFilterUrl({ category: categoryFilter === cat ? "" : cat })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                categoryFilter === cat
                  ? "bg-[var(--status-ai-bg)] text-[var(--status-ai-fg)] border-[var(--status-ai)] shadow-sm"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {CONTENT_CATEGORY_LABELS[cat] || cat}
              <span className="opacity-50">({count})</span>
            </Link>
          ))}
        </div>
      )}

      {/* If sub-types exist within the source group, show a secondary filter */}
      {activeSourceGroup && (() => {
        const group = SOURCE_GROUPS.find((g) => g.key === activeSourceGroup);
        if (!group) return null;
        const matchingTypes = group.types.filter((t) => platformCounts[t]);
        if (matchingTypes.length <= 1) return null;
        return (
          <div className="flex gap-1.5 flex-wrap ml-1">
            {matchingTypes.map((type) => (
              <Link
                key={type}
                href={buildFilterUrl({ platform: platformFilter === type ? (matchingTypes[0] !== type ? matchingTypes[0] : matchingTypes[1]) : type })}
                className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
                  platformFilter === type
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {CONTENT_TYPE_LABELS[type] || type} ({platformCounts[type]})
              </Link>
            ))}
          </div>
        );
      })()}

      {/* Empty state */}
      {assets.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-20 text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-muted-foreground stroke-2" aria-hidden>
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <p className="text-sm font-medium text-muted-foreground">No content found</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {platformFilter || categoryFilter ? "Try removing a filter, or run" : "Run"} research first to analyze content.
          </p>
          {(platformFilter || categoryFilter) && (
            <Link
              href={buildFilterUrl({ platform: "", category: "" })}
              className="mt-3 inline-block text-xs text-foreground underline underline-offset-2"
            >
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Card grid — desktop 3 columns, tablet 2, mobile 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => {
              const group = getPlatformGroup(asset.type);
              const score = asset.overallScore ?? null;
              const scoreColor =
                score === null
                  ? "text-muted-foreground"
                  : score >= 80
                  ? "text-green-600"
                  : score >= 60
                  ? "text-amber-600"
                  : "text-red-500";

              return (
                <Link
                  key={asset.id}
                  href={`/projects/${projectId}/insights/${asset.id}`}
                  className="group rounded-xl border border-border bg-card overflow-hidden hover:border-foreground/30 hover:shadow-md transition-all"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    {asset.thumbnailUrl ? (
                      <img
                        src={asset.thumbnailUrl}
                        alt={asset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="h-10 w-10 fill-none stroke-muted-foreground/30 stroke-2" aria-hidden>
                          <polygon points="23 7 16 12 23 17 23 7" />
                          <rect x="1" y="5" width="15" height="14" rx="2" />
                        </svg>
                      </div>
                    )}
                    {/* Platform badge overlay */}
                    <div className="absolute top-2 left-2">
                      <PlatformBadge type={asset.type} />
                    </div>
                    {/* Score overlay */}
                    {score !== null && (
                      <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded px-1.5 py-0.5">
                        <span className={`text-xs font-bold num ${scoreColor}`}>{score}</span>
                      </div>
                    )}
                    {/* External link */}
                    {asset.url && (
                      <a
                        href={asset.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-2 right-2 p-1 rounded bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Open on platform"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {/* Group color accent stripe */}
                    {group && (
                      <div className={`absolute inset-x-0 bottom-0 h-0.5 ${group.activeBg}`} />
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-3 space-y-2">
                    {/* Title */}
                    <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-foreground transition-colors">
                      {asset.title}
                    </p>

                    {/* Hook text preview */}
                    {asset.hookText && (
                      <p className="text-[11px] text-muted-foreground italic line-clamp-2 border-l-2 border-border pl-2">
                        &ldquo;{asset.hookText}&rdquo;
                      </p>
                    )}

                    {/* Score bar */}
                    <div className="pt-0.5">
                      <ScoreBar score={asset.overallScore} />
                    </div>

                    {/* Engagement row */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 num">
                          <Eye className="h-3 w-3" />
                          {formatNumber(asset.viewCount)}
                        </span>
                        <span className="flex items-center gap-1 num">
                          <ThumbsUp className="h-3 w-3" />
                          {formatNumber(asset.likeCount)}
                        </span>
                        {asset.engagementRate && (
                          <span className="num">{asset.engagementRate.toFixed(2)}%</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {asset.contentCategory && (
                          <StatusBadge level={asset.contentCategory === "AD" ? "healthy" : "neutral"}>
                            {CONTENT_CATEGORY_LABELS[asset.contentCategory] || asset.contentCategory}
                          </StatusBadge>
                        )}
                        {asset.isBrandOwned ? (
                          <StatusBadge level="ai">Brand</StatusBadge>
                        ) : asset.competitor ? (
                          <span className="text-[10px] text-muted-foreground">{asset.competitor.name}</span>
                        ) : null}
                      </div>
                    </div>

                    {/* Narrative type + date footer */}
                    <div className="flex items-center justify-between pt-1 border-t border-border text-[10px] text-muted-foreground">
                      <span>{asset.narrativeType ? NARRATIVE_TYPE_LABELS[asset.narrativeType] : "—"}</span>
                      <div className="flex items-center gap-1">
                        <span>{formatDate(asset.publishedAt)}</span>
                        <ChevronRight className="h-3 w-3 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Load More */}
          <LoadMoreButton projectId={projectId} currentCount={assets.length} />
        </>
      )}
    </div>
  );
}
