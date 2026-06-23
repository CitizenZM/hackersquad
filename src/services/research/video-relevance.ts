import { z } from "zod";
import { analyzeWithClaude } from "@/services/ai/claude-client";
import type { VideoResult } from "./video-search";
import type { SearchKeywords } from "./keyword-extractor";

// ─── Context ──────────────────────────────────────────────────────────────────

export interface RelevanceContext {
  brandName: string;
  productName?: string;
  keywords: SearchKeywords;
}

export interface ScoredVideo extends VideoResult {
  relevanceScore: number; // 0..1 deterministic
  qualityScore: number; // 0..1 from views/engagement/recency
  verified: boolean; // passed LLM relevance check
  verifyConfidence: number; // 0..1
  verifyReason?: string;
  combinedScore: number; // final ranking score
}

// ─── Deterministic relevance ────────────────────────────────────────────────

const EXCLUDE_HARD = ["reaction", "tutorial how to download", "free download mod"];

/**
 * Deterministic 0..1 relevance from title/description/channel against the brand
 * context. Returns -1 to signal a HARD reject (excluded term / wrong language).
 */
export function scoreRelevance(video: VideoResult, ctx: RelevanceContext): number {
  const brand = ctx.brandName.toLowerCase();
  const title = (video.title || "").toLowerCase();
  const desc = (video.description || "").toLowerCase();
  const channel = (video.channelTitle || "").toLowerCase();
  const text = `${title} ${desc}`;
  const bc = ctx.keywords.brandContext;

  // Hard rejects: explicit "not related to" terms from brand disambiguation.
  for (const term of bc?.notRelatedTo ?? []) {
    if (term && text.includes(term.toLowerCase())) return -1;
  }
  for (const term of EXCLUDE_HARD) {
    if (text.includes(term)) return -1;
  }

  let score = 0;
  // Brand presence
  if (title.includes(brand)) score += 0.4;
  else if (desc.includes(brand)) score += 0.2;
  if (channel.includes(brand)) score += 0.25; // likely official channel

  // Product name presence
  if (ctx.productName) {
    const p = ctx.productName.toLowerCase();
    if (title.includes(p)) score += 0.2;
    else if (desc.includes(p)) score += 0.1;
  }

  // Disambiguation / category keyword hits (caps contribution)
  const disambig = bc?.disambiguationKeywords ?? [];
  const cats = ctx.keywords.categoryKeywords ?? [];
  const prods = ctx.keywords.productKeywords ?? [];
  const kwHits = [...disambig, ...cats, ...prods].filter(
    (kw) => kw && text.includes(kw.toLowerCase())
  ).length;
  score += Math.min(0.3, kwHits * 0.1);

  // Ad/commercial intent signal
  if (/\b(ad|advert|commercial|campaign|spot|tvc)\b/.test(text)) score += 0.1;

  return Math.max(0, Math.min(1, score));
}

// ─── Quality (views / engagement / recency) ──────────────────────────────────

/**
 * 0..1 quality from view count, engagement rate, and recency. Sources without
 * metrics (Vimeo/IG via search) get a neutral baseline so they aren't unfairly
 * zeroed — relevance carries them instead.
 */
export function scoreQuality(video: VideoResult): number {
  const views = video.viewCount || 0;
  const hasMetrics = views > 0;
  if (!hasMetrics) return 0.35; // neutral baseline for metric-less sources

  // Log-scaled view score: 1k→~0.3, 100k→~0.6, 10M→~1.0
  const viewScore = Math.min(1, Math.log10(views + 1) / 7);

  // Engagement rate = (likes + comments) / views, capped.
  const eng = (video.likeCount + video.commentCount) / Math.max(views, 1);
  const engScore = Math.min(1, eng / 0.1); // 10% engagement → full marks

  // Recency: newer is slightly better.
  let recencyScore = 0.5;
  const ts = Date.parse(video.publishedAt);
  if (!Number.isNaN(ts)) {
    const ageDays = (Date.now() - ts) / 86_400_000;
    recencyScore = ageDays <= 0 ? 0.5 : Math.max(0, Math.min(1, 1 - ageDays / 1095)); // ~3yr falloff
  }

  return 0.6 * viewScore + 0.3 * engScore + 0.1 * recencyScore;
}

// ─── LLM verification ────────────────────────────────────────────────────────

const verifySchema = z.object({
  verdicts: z.array(
    z.object({
      index: z.coerce.number(),
      relevant: z.boolean(),
      confidence: z.coerce.number().min(0).max(1),
      reason: z.string().optional().default(""),
    })
  ),
});

export type VerifyResult = {
  relevant: boolean;
  confidence: number;
  reason: string;
};

export type Verifier = (
  videos: VideoResult[],
  ctx: RelevanceContext
) => Promise<VerifyResult[]>;

/**
 * Batched LLM relevance check — "is each video actually about this brand's
 * product/marketing?" Returns one verdict per input video (index-aligned).
 * On failure, conservatively marks all as unverified (caller decides).
 */
export const llmVerifier: Verifier = async (videos, ctx) => {
  if (videos.length === 0) return [];
  const bc = ctx.keywords.brandContext;
  const list = videos
    .map(
      (v, i) =>
        `${i}. [${v.platform}] "${v.title}" — channel: ${v.channelTitle} — ${(v.description || "").slice(0, 160)}`
    )
    .join("\n");

  const system = `You verify whether each candidate video is genuinely relevant marketing/ad/brand content for a specific brand. Reject videos that merely mention the word but are about something else (homonyms, unrelated topics, fan edits, news, tutorials).`;

  const user = `Brand: "${ctx.brandName}"${ctx.productName ? ` — product: ${ctx.productName}` : ""}
Business: ${bc?.businessType ?? "?"} / ${bc?.industry ?? "?"}
This brand IS about: ${(bc?.disambiguationKeywords ?? []).join(", ") || "(n/a)"}
This brand is NOT: ${(bc?.notRelatedTo ?? []).join(", ") || "(n/a)"}

For EACH candidate, decide if it is relevant brand/ad/product content for THIS brand.
Return JSON: {"verdicts":[{"index":0,"relevant":true,"confidence":0.0-1.0,"reason":"short"}]}
Be strict: if it's likely a homonym or off-topic, relevant=false.

Candidates:
${list}`;

  try {
    const res = await analyzeWithClaude({
      systemPrompt: system,
      userPrompt: user,
      responseSchema: verifySchema,
      maxTokens: Math.min(4000, 600 + videos.length * 120),
    });
    const byIndex = new Map(res.verdicts.map((v) => [v.index, v]));
    return videos.map((_, i) => {
      const v = byIndex.get(i);
      return {
        relevant: v?.relevant ?? false,
        confidence: v?.confidence ?? 0,
        reason: v?.reason ?? "no verdict",
      };
    });
  } catch {
    // Conservative: couldn't verify → mark unverified, let deterministic gate decide.
    return videos.map(() => ({ relevant: false, confidence: 0, reason: "verify failed" }));
  }
};

// ─── Selection ────────────────────────────────────────────────────────────────

export interface SelectOptions {
  targetCount?: number;
  minViews?: number;
  minEngagementRate?: number;
  minRelevance?: number; // deterministic prefilter
  minConfidence?: number; // LLM confidence to count as verified
  verifier?: Verifier;
}

const DEFAULTS = {
  targetCount: 6,
  minViews: 1000,
  minEngagementRate: 0.01,
  minRelevance: 0.3,
  minConfidence: 0.6,
};

/**
 * Score, verify, and filter candidates down to the best relevant + high-quality
 * videos. A video passes only if it clears BOTH the relevance bar (deterministic
 * prefilter + LLM verification) AND the quality bar (views or engagement, with a
 * relevance exception for metric-less sources).
 */
export async function selectRelevantVideos(
  candidates: VideoResult[],
  ctx: RelevanceContext,
  opts: SelectOptions = {}
): Promise<ScoredVideo[]> {
  const o = { ...DEFAULTS, ...opts };
  const verify = opts.verifier ?? llmVerifier;

  // 1) Deterministic prefilter — drop hard rejects and clearly-irrelevant.
  const prefiltered = candidates
    .map((v) => ({ v, rel: scoreRelevance(v, ctx) }))
    .filter((x) => x.rel >= 0 && x.rel >= o.minRelevance);

  if (prefiltered.length === 0) return [];

  // 2) LLM verification on the prefiltered set (batched).
  const verdicts = await verify(
    prefiltered.map((x) => x.v),
    ctx
  );

  // 3) Combine + apply quality gate.
  const scored: ScoredVideo[] = prefiltered.map((x, i) => {
    const verdict = verdicts[i] ?? { relevant: false, confidence: 0, reason: "" };
    const quality = scoreQuality(x.v);
    const verified = verdict.relevant && verdict.confidence >= o.minConfidence;
    const combinedScore = 0.55 * x.rel + 0.45 * quality;
    return {
      ...x.v,
      relevanceScore: x.rel,
      qualityScore: quality,
      verified,
      verifyConfidence: verdict.confidence,
      verifyReason: verdict.reason,
      combinedScore,
    };
  });

  const engRate = (v: ScoredVideo) =>
    v.viewCount > 0 ? (v.likeCount + v.commentCount) / v.viewCount : 0;

  const passing = scored.filter((v) => {
    if (!v.verified) return false;
    const hasMetrics = v.viewCount > 0;
    const qualityOk = hasMetrics
      ? v.viewCount >= o.minViews || engRate(v) >= o.minEngagementRate
      : v.relevanceScore >= 0.6; // metric-less: require strong relevance
    return qualityOk;
  });

  passing.sort((a, b) => b.combinedScore - a.combinedScore);
  return passing.slice(0, o.targetCount);
}
