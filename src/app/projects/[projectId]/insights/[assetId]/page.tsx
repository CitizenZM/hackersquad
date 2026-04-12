import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NARRATIVE_TYPE_LABELS, DATA_SOURCE_LABELS } from "@/lib/constants";
import { ScoreRadar } from "@/components/dashboard/score-radar";
import { ExternalLink, Eye, ThumbsUp, MessageSquare } from "lucide-react";
import Link from "next/link";

export default async function AssetInsightPage({
  params,
}: {
  params: Promise<{ projectId: string; assetId: string }>;
}) {
  const { projectId, assetId } = await params;

  const asset = await prisma.contentAsset.findUnique({
    where: { id: assetId },
    include: {
      competitor: { select: { name: true } },
      insights: { orderBy: { importance: "desc" } },
    },
  });

  if (!asset || asset.projectId !== projectId) notFound();

  const radarData = [
    { metric: "Hook", value: asset.hookStrength || 0 },
    { metric: "Product", value: asset.productVisibility || 0 },
    { metric: "Story", value: asset.storytellingArc || 0 },
    { metric: "CTA", value: asset.ctaQuality || 0 },
    { metric: "Emotion", value: asset.emotionalAppeal || 0 },
    { metric: "Pacing", value: asset.pacing || 0 },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        href={`/projects/${projectId}/content`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back to Content
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {asset.thumbnailUrl && (
          <div className="w-full sm:w-64 shrink-0">
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              <img
                src={asset.thumbnailUrl}
                alt={asset.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
        <div className="space-y-2">
          <h2 className="text-xl font-bold">{asset.title}</h2>
          <div className="flex flex-wrap gap-2">
            {asset.narrativeType && (
              <Badge variant="secondary">
                {NARRATIVE_TYPE_LABELS[asset.narrativeType]}
              </Badge>
            )}
            <Badge variant="outline">{DATA_SOURCE_LABELS[asset.dataSource]}</Badge>
            {asset.competitor && (
              <Badge variant="outline">{asset.competitor.name}</Badge>
            )}
            {asset.platform && <Badge variant="outline">{asset.platform}</Badge>}
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            {asset.viewCount != null && (
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" /> {asset.viewCount.toLocaleString()} views
              </span>
            )}
            {asset.likeCount != null && (
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" /> {asset.likeCount.toLocaleString()} likes
              </span>
            )}
            {asset.commentCount != null && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" /> {asset.commentCount.toLocaleString()} comments
              </span>
            )}
          </div>
          {asset.url && (
            <a
              href={asset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View Original <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Score Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreRadar data={radarData} />
            <div className="text-center mt-2">
              <span className="text-3xl font-bold">{asset.overallScore}</span>
              <span className="text-sm text-muted-foreground ml-1">/ 100</span>
            </div>
          </CardContent>
        </Card>

        {/* Hook Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Hook Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {asset.hookText && (
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  Opening Hook
                </p>
                <p className="text-sm mt-1 italic">&ldquo;{asset.hookText}&rdquo;</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">
                Hook Strength
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${asset.hookStrength || 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{asset.hookStrength}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">
                Key Messages
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {((asset.keyMessages as string[]) || []).map((msg, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {msg}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {asset.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Description / Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {asset.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Related Insights */}
      {asset.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Related Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {asset.insights.map((insight) => (
              <div key={insight.id} className="flex gap-3 p-2 rounded border">
                <Badge variant="secondary" className="text-xs shrink-0 h-fit">
                  {insight.category}
                </Badge>
                <div>
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
