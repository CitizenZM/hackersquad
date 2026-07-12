import type { YouTubeVideo } from "@/services/research/youtube-service";

export interface VideoEvidence {
  transcript?: string;
  transcriptSource?: "groq" | "openai" | "none";
  thumbnailUrl?: string;
}

type ScoringVideo = YouTubeVideo & { _platform?: string };

function firstSeconds(transcript: string, approxWordsFor15s = 40): string {
  // Whisper output has no reliable per-word timestamps here, so approximate
  // "first ~15 seconds" as the first ~40 words (avg conversational pace).
  const words = transcript.trim().split(/\s+/);
  return words.slice(0, approxWordsFor15s).join(" ");
}

export function buildContentScoringPrompt(
  brandName: string,
  videos: ScoringVideo[],
  evidence?: Map<string, VideoEvidence>
) {
  const system = `You are a content performance analyst specializing in social media and video marketing.
Score each content asset on multiple dimensions (0-100 scale) using TIERED EVIDENCE.

Each video is annotated with an evidence tier:
- "transcript": Full or partial spoken transcript is available. Score hookStrength from the FIRST ~15 SECONDS of transcript text specifically (labeled "OPENING (~15s)" below) — judge the actual words spoken, not the title. Score pacing and storytellingArc from the FULL transcript's structure, pacing of ideas, and narrative progression.
- "thumbnail": Only a thumbnail image reference is available (no transcript). You cannot hear the hook or judge spoken pacing/arc — score these dimensions conservatively based on title/description/thumbnail context only, and explicitly note in "analysis" that scoring is limited by lack of transcript evidence.
- "metadata": No transcript and no thumbnail — only title/description/views are available. You MUST set confidence to "low" and score hookStrength, pacing, storytellingArc, and emotionalAppeal in a CONSERVATIVE MID-RANGE (40-60) rather than guessing high or low based on title alone, since there is no real evidence of the actual content quality.

Respond with ONLY a JSON object matching this structure:
{
  "scores": [
    {
      "videoId": "string",
      "overallScore": number,
      "hookStrength": number,
      "productVisibility": number,
      "storytellingArc": number,
      "ctaQuality": number,
      "emotionalAppeal": number,
      "pacing": number,
      "hookText": "string - the actual opening hook (quote/paraphrase from transcript if available, else best inference from title/description)",
      "narrativeType": "PROBLEM_SOLUTION|TESTIMONIAL|DEMONSTRATION|LIFESTYLE|EDUCATIONAL|COMPARISON|STORY_ARC|UGC_STYLE|TREND_RIDING|BEFORE_AFTER",
      "keyMessages": ["array of key messages"],
      "analysis": "string - brief explanation of why this content works or doesn't, and what evidence it's based on",
      "contentCategory": "AD|REVIEW|UGC|OTHER",
      "evidenceLevel": "transcript|thumbnail|metadata",
      "confidence": "high|medium|low"
    }
  ]
}

Field requirements (no silent defaults — you must output these explicitly for every video):
- evidenceLevel: MUST exactly match the evidence tier given for that video below.
- confidence: "high" when evidenceLevel is "transcript", "medium" when "thumbnail", "low" when "metadata" (metadata-only scores MUST be "low").

Score criteria:
- hookStrength: How compelling is the actual opening (transcript) or likely opening (title/thumbnail)? Does it create curiosity or urgency?
- productVisibility: How prominently is the product/brand featured?
- storytellingArc: Does the content have a clear narrative structure? (Judge from full transcript when available.)
- ctaQuality: Is there a clear call-to-action?
- emotionalAppeal: Does it trigger an emotional response?
- pacing: Is the content well-structured for the platform? (Judge from full transcript when available.)
- overallScore: Weighted average considering engagement metrics too

contentCategory classification:
- AD: Official brand ad, commercial, sponsored content, brand campaign, product launch video
- REVIEW: Third-party review, unboxing, hands-on, comparison by a reviewer
- UGC: User-generated content, organic mentions, fan-made content
- OTHER: Tutorials, news coverage, educational content`;

  const user = `Score these content assets related to "${brandName}":

${videos
  .map((v, i) => {
    const ev = evidence?.get(v.videoId);
    const hasTranscript = !!ev?.transcript;
    const hasThumbnail = !hasTranscript && !!ev?.thumbnailUrl;

    const evidenceBlock = hasTranscript
      ? `Evidence tier: transcript
OPENING (~15s): ${firstSeconds(ev!.transcript!)}
FULL TRANSCRIPT: ${ev!.transcript!.slice(0, 4000)}`
      : hasThumbnail
        ? `Evidence tier: thumbnail
Thumbnail available (reference only, described contextually — no transcript). Score hook/pacing/arc conservatively and note the limitation in "analysis".`
        : `Evidence tier: metadata
No transcript or thumbnail available. You MUST set confidence: "low" and keep hookStrength/pacing/storytellingArc/emotionalAppeal in the 40-60 conservative mid-range.`;

    return `
[${i + 1}] Video ID: ${v.videoId}
Title: ${v.title}
Channel: ${v.channelTitle}
Platform: ${v._platform || "youtube"}
Description: ${v.description.slice(0, 400)}
Views: ${v.viewCount.toLocaleString()}
Likes: ${v.likeCount.toLocaleString()}
Comments: ${v.commentCount.toLocaleString()}
Published: ${v.publishedAt}
${evidenceBlock}
`;
  })
  .join("\n")}`;

  return { system, user };
}
