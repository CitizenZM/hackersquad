import { prisma } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  NARRATIVE_TYPE_LABELS,
  CONTENT_TYPE_LABELS,
} from "@/lib/constants";
import { Eye, ThumbsUp, MessageSquare } from "lucide-react";

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
    if (score >= 70) return "gradient-cool";
    if (score >= 40) return "bg-amber-400";
    return "bg-red-400";
  }

  function scoreMedal(score: number | null) {
    if (!score) return "⬜";
    if (score >= 80) return "🥇";
    if (score >= 60) return "🥈";
    if (score >= 40) return "🥉";
    return "💪";
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-lg font-black text-purple-900">🎬 Content Scored</h2>
        <p className="text-xs text-purple-400 font-bold">
          {assets.length} pieces of content ranked by AI
        </p>
      </div>

      {assets.length === 0 ? (
        <Card className="rounded-3xl border-2 border-purple-200 bg-white">
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-purple-400 font-bold">
              No content yet. Run research first!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {assets.map((asset, index) => (
            <Link
              key={asset.id}
              href={`/projects/${projectId}/insights/${asset.id}`}
            >
              <Card className="rounded-3xl border-2 border-purple-200 bg-white fun-shadow-sm hover:border-purple-400 transition-all active:scale-[0.98] h-full">
                <CardContent className="pt-4 pb-3 space-y-2.5">
                  {/* Rank + Thumbnail */}
                  <div className="flex gap-3">
                    <div className="text-center shrink-0">
                      <div className="text-2xl">{scoreMedal(asset.overallScore)}</div>
                      <span className="text-[10px] font-black text-purple-400">#{index + 1}</span>
                    </div>
                    {asset.thumbnailUrl ? (
                      <div className="aspect-video rounded-2xl overflow-hidden bg-purple-50 flex-1">
                        <img
                          src={asset.thumbnailUrl}
                          alt={asset.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center flex-1">
                        <span className="text-xs font-bold text-purple-300">
                          {CONTENT_TYPE_LABELS[asset.type]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-purple-900 line-clamp-2">
                    {asset.title}
                  </h3>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1">
                    {asset.narrativeType && (
                      <Badge className="rounded-full text-[10px] font-bold bg-pink-50 text-pink-600 border border-pink-200">
                        {NARRATIVE_TYPE_LABELS[asset.narrativeType]}
                      </Badge>
                    )}
                    {asset.competitor && (
                      <Badge className="rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                        {asset.competitor.name}
                      </Badge>
                    )}
                  </div>

                  {/* Score bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-purple-400">AI Score</span>
                      <span className="text-purple-700">{asset.overallScore ?? "—"}</span>
                    </div>
                    <div className="h-3 rounded-full bg-purple-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${scoreColor(asset.overallScore)}`}
                        style={{ width: `${asset.overallScore || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex gap-3 text-[10px] font-bold text-purple-400">
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
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
