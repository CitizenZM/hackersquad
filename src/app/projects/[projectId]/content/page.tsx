import { prisma } from "@/lib/db";
import Link from "next/link";
import { NARRATIVE_TYPE_LABELS, CONTENT_TYPE_LABELS } from "@/lib/constants";
import { ScoreBar, StatusBadge } from "@/components/dashboard/status-badge";
import { ChevronRight, Eye, ThumbsUp, MessageSquare } from "lucide-react";

export default async function ContentPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const assets = await prisma.contentAsset.findMany({
    where: { projectId },
    orderBy: { overallScore: "desc" },
    include: { competitor: { select: { name: true } } },
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Content Intelligence</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {assets.length} content asset{assets.length !== 1 ? "s" : ""} analyzed and scored
        </p>
      </div>

      {assets.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No content analyzed yet. Run research first.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop: Data Table */}
          <div className="hidden md:block rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="text-left font-medium px-4 py-2.5 w-12">#</th>
                    <th className="text-left font-medium px-3 py-2.5">Content</th>
                    <th className="text-left font-medium px-3 py-2.5">Narrative</th>
                    <th className="text-left font-medium px-3 py-2.5">Score</th>
                    <th className="text-right font-medium px-3 py-2.5">Views</th>
                    <th className="text-right font-medium px-3 py-2.5">Engagement</th>
                    <th className="text-left font-medium px-3 py-2.5">Source</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {assets.map((asset, index) => (
                    <tr
                      key={asset.id}
                      className="group hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-muted-foreground num">
                        {index + 1}
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/projects/${projectId}/insights/${asset.id}`}
                          className="flex gap-3 items-center"
                        >
                          {asset.thumbnailUrl ? (
                            <div className="w-16 h-10 rounded overflow-hidden bg-muted shrink-0">
                              <img
                                src={asset.thumbnailUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-10 rounded bg-muted shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate max-w-xs">
                              {asset.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {asset.platform || CONTENT_TYPE_LABELS[asset.type]}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {asset.narrativeType
                          ? NARRATIVE_TYPE_LABELS[asset.narrativeType]
                          : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <ScoreBar score={asset.overallScore} />
                      </td>
                      <td className="px-3 py-3 text-right num text-muted-foreground">
                        {asset.viewCount?.toLocaleString() || "—"}
                      </td>
                      <td className="px-3 py-3 text-right num text-muted-foreground">
                        {asset.engagementRate ? `${asset.engagementRate.toFixed(2)}%` : "—"}
                      </td>
                      <td className="px-3 py-3">
                        {asset.isBrandOwned ? (
                          <StatusBadge level="ai">Brand</StatusBadge>
                        ) : asset.competitor ? (
                          <span className="text-xs text-muted-foreground">
                            {asset.competitor.name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/projects/${projectId}/insights/${asset.id}`}
                          className="text-muted-foreground group-hover:text-foreground"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: Cards */}
          <div className="md:hidden space-y-2">
            {assets.map((asset, index) => (
              <Link
                key={asset.id}
                href={`/projects/${projectId}/insights/${asset.id}`}
                className="block rounded-lg border border-border bg-card p-4 hover:border-foreground/30 transition-colors"
              >
                <div className="flex gap-3">
                  <span className="text-xs text-muted-foreground num mt-0.5">
                    {index + 1}
                  </span>
                  {asset.thumbnailUrl ? (
                    <div className="w-20 h-12 rounded overflow-hidden bg-muted shrink-0">
                      <img
                        src={asset.thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-12 rounded bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{asset.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <ScoreBar score={asset.overallScore} />
                    </div>
                    <div className="flex gap-3 text-[11px] text-muted-foreground mt-1.5">
                      {asset.viewCount != null && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {asset.viewCount.toLocaleString()}
                        </span>
                      )}
                      {asset.likeCount != null && (
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {asset.likeCount.toLocaleString()}
                        </span>
                      )}
                      {asset.commentCount != null && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {asset.commentCount.toLocaleString()}
                        </span>
                      )}
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
