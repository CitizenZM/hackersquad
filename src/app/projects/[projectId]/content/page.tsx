import { prisma } from "@/lib/db";
import Link from "next/link";
import { NARRATIVE_TYPE_LABELS, CONTENT_TYPE_LABELS } from "@/lib/constants";
import { ScoreBar, StatusBadge } from "@/components/dashboard/status-badge";
import { ChevronRight, Eye, ThumbsUp, MessageSquare, ExternalLink } from "lucide-react";

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

export default async function ContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ sort?: string; order?: string }>;
}) {
  const { projectId } = await params;
  const sp = await searchParams;
  const sortBy = sp.sort || "overallScore";
  const order = sp.order || "desc";

  const orderByMap: Record<string, Record<string, string>> = {
    overallScore: { overallScore: order },
    viewCount: { viewCount: order },
    publishedAt: { publishedAt: order },
    engagementRate: { engagementRate: order },
  };

  const assets = await prisma.contentAsset.findMany({
    where: { projectId },
    orderBy: orderByMap[sortBy] || { overallScore: "desc" },
    include: { competitor: { select: { name: true } } },
  });

  function sortLink(col: string) {
    const newOrder = sortBy === col && order === "desc" ? "asc" : "desc";
    return `?sort=${col}&order=${newOrder}`;
  }

  function sortArrow(col: string) {
    if (sortBy !== col) return "";
    return order === "desc" ? " ↓" : " ↑";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Content Intelligence</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {assets.length} asset{assets.length !== 1 ? "s" : ""} analyzed · Sorted by {sortBy}{sortArrow(sortBy)}
          </p>
        </div>
        <div className="flex gap-1 text-xs">
          {[
            { col: "overallScore", label: "Score" },
            { col: "viewCount", label: "Views" },
            { col: "publishedAt", label: "Date" },
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
              {s.label}{sortArrow(s.col)}
            </Link>
          ))}
        </div>
      </div>

      {assets.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">No content analyzed yet. Run research first.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="text-left font-medium px-4 py-2.5 w-10">#</th>
                    <th className="text-left font-medium px-3 py-2.5">Content</th>
                    <th className="text-left font-medium px-3 py-2.5">Type</th>
                    <th className="text-left font-medium px-3 py-2.5">
                      <Link href={sortLink("overallScore")} className="hover:text-foreground">
                        Score{sortArrow("overallScore")}
                      </Link>
                    </th>
                    <th className="text-right font-medium px-3 py-2.5">
                      <Link href={sortLink("viewCount")} className="hover:text-foreground">
                        Views{sortArrow("viewCount")}
                      </Link>
                    </th>
                    <th className="text-right font-medium px-3 py-2.5">Engagement</th>
                    <th className="text-right font-medium px-3 py-2.5">
                      <Link href={sortLink("publishedAt")} className="hover:text-foreground">
                        Published{sortArrow("publishedAt")}
                      </Link>
                    </th>
                    <th className="text-left font-medium px-3 py-2.5">Source</th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {assets.map((asset, index) => (
                    <tr key={asset.id} className="group hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground num">{index + 1}</td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/projects/${projectId}/insights/${asset.id}`}
                          className="flex gap-3 items-center"
                        >
                          {asset.thumbnailUrl ? (
                            <div className="w-16 h-10 rounded overflow-hidden bg-muted shrink-0">
                              <img src={asset.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-16 h-10 rounded bg-muted shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate max-w-xs">{asset.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{asset.platform || ""}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {asset.narrativeType ? NARRATIVE_TYPE_LABELS[asset.narrativeType] : "—"}
                      </td>
                      <td className="px-3 py-3"><ScoreBar score={asset.overallScore} /></td>
                      <td className="px-3 py-3 text-right num text-muted-foreground">{formatNumber(asset.viewCount)}</td>
                      <td className="px-3 py-3 text-right num text-muted-foreground">
                        {asset.engagementRate ? `${asset.engagementRate.toFixed(2)}%` : "—"}
                      </td>
                      <td className="px-3 py-3 text-right text-xs text-muted-foreground">
                        {formatDate(asset.publishedAt)}
                      </td>
                      <td className="px-3 py-3">
                        {asset.isBrandOwned ? (
                          <StatusBadge level="ai">Brand</StatusBadge>
                        ) : asset.competitor ? (
                          <span className="text-xs text-muted-foreground">{asset.competitor.name}</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          {asset.url && (
                            <a
                              href={asset.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                              title="Watch on platform"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <Link
                            href={`/projects/${projectId}/insights/${asset.id}`}
                            className="text-muted-foreground group-hover:text-foreground"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {assets.map((asset, index) => (
              <Link
                key={asset.id}
                href={`/projects/${projectId}/insights/${asset.id}`}
                className="block rounded-lg border border-border bg-card p-3 hover:border-foreground/30 transition-colors"
              >
                <div className="flex gap-3">
                  <span className="text-xs text-muted-foreground num mt-0.5 w-4 shrink-0">
                    {index + 1}
                  </span>
                  {asset.thumbnailUrl ? (
                    <div className="w-20 h-12 rounded overflow-hidden bg-muted shrink-0">
                      <img src={asset.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-12 rounded bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{asset.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <ScoreBar score={asset.overallScore} />
                    </div>
                    <div className="flex gap-3 text-[11px] text-muted-foreground mt-1.5">
                      <span className="flex items-center gap-1 num">
                        <Eye className="h-3 w-3" />{formatNumber(asset.viewCount)}
                      </span>
                      <span className="flex items-center gap-1 num">
                        <ThumbsUp className="h-3 w-3" />{formatNumber(asset.likeCount)}
                      </span>
                      <span>{formatDate(asset.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
