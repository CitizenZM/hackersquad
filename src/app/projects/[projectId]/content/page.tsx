import { prisma } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  NARRATIVE_TYPE_LABELS,
  DATA_SOURCE_LABELS,
  CONTENT_TYPE_LABELS,
} from "@/lib/constants";
import { ExternalLink, Eye, ThumbsUp, MessageSquare } from "lucide-react";

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

  function scoreColor(score: number | null) {
    if (!score) return "bg-gray-200";
    if (score >= 70) return "bg-green-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Content Intelligence</h2>
          <p className="text-sm text-muted-foreground">
            {assets.length} content assets analyzed and scored
          </p>
        </div>
      </div>

      {assets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No content analyzed yet. Run research to discover content.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <Link
              key={asset.id}
              href={`/projects/${projectId}/insights/${asset.id}`}
            >
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="pt-4 space-y-3">
                  {/* Thumbnail */}
                  {asset.thumbnailUrl ? (
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <img
                        src={asset.thumbnailUrl}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        {CONTENT_TYPE_LABELS[asset.type]}
                      </span>
                    </div>
                  )}

                  {/* Title and badges */}
                  <div>
                    <h3 className="text-sm font-medium line-clamp-2">
                      {asset.title}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {CONTENT_TYPE_LABELS[asset.type]}
                      </Badge>
                      {asset.narrativeType && (
                        <Badge variant="secondary" className="text-xs">
                          {NARRATIVE_TYPE_LABELS[asset.narrativeType]}
                        </Badge>
                      )}
                      {asset.competitor && (
                        <Badge variant="secondary" className="text-xs">
                          {asset.competitor.name}
                        </Badge>
                      )}
                      {asset.isBrandOwned && (
                        <Badge className="text-xs bg-blue-100 text-blue-700">Brand</Badge>
                      )}
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">AI Score</span>
                      <span className="font-medium">
                        {asset.overallScore ?? "—"}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${scoreColor(asset.overallScore)}`}
                        style={{ width: `${asset.overallScore || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex gap-4 text-xs text-muted-foreground">
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

                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-[10px]">
                      {DATA_SOURCE_LABELS[asset.dataSource]}
                    </Badge>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
