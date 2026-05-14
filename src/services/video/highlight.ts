import { z } from "zod";
import { analyzeWithClaude } from "@/services/ai/claude-client";
import type { TranscribedSegment } from "./transcribe";

export interface Highlight {
  start: number;
  end: number;
  reason: string;
  hookText: string;
  score: number;
}

const highlightSchema = z.object({
  highlights: z
    .array(
      z.object({
        start: z.number(),
        end: z.number(),
        reason: z.string(),
        hookText: z.string(),
        score: z.number(),
      })
    )
    .min(1),
});

// Select top moments from a transcript using a cheap LLM call (gpt-4o-mini).
// Saves tokens vs feeding the full pipeline LLM. Returns 1-3 highlights.
// Falls back to a transcript-based heuristic if the LLM returns nothing.
export async function selectHighlights(
  segments: TranscribedSegment[],
  opts: { targetDurationSec?: number; brandContext?: string; maxHighlights?: number; totalDurationSec?: number } = {}
): Promise<Highlight[]> {
  const targetSec = opts.targetDurationSec ?? 30;
  const maxHighlights = opts.maxHighlights ?? 1;
  const brandContext = opts.brandContext ?? "";

  // Fallback: if transcript is empty/sparse, just slice the opening N seconds.
  if (segments.length === 0) {
    const totalDur = opts.totalDurationSec ?? targetSec;
    return [
      {
        start: 0,
        end: Math.min(targetSec, totalDur),
        reason: "Fallback: no speech detected, used opening window",
        hookText: "Watch this",
        score: 40,
      },
    ];
  }

  // Cap input to first 8000 chars of transcript to control token cost
  const lines = segments
    .map((s) => `[${s.start.toFixed(1)}-${s.end.toFixed(1)}] ${s.text.trim()}`)
    .join("\n")
    .slice(0, 8000);

  const sys = `You select the best ${targetSec}-second highlight clip from a transcript. Pick segments with the strongest hook, story payoff, or actionable insight. Return JSON only.

Each highlight:
- start, end: seconds (numbers)
- reason: 1 short sentence why this clip will perform
- hookText: 5-12 word hook to overlay on the clip
- score: 0-100 quality estimate

Rules:
- Total span (end - start) should be close to ${targetSec}s (within ±20%)
- Prefer segments where the speaker says something complete (no mid-sentence cuts)
- If multiple segments are equally strong, pick the EARLIEST one
${brandContext ? `- Bias selection toward content that resonates with: ${brandContext}` : ""}

Return up to ${maxHighlights} highlights, sorted by score desc.`;

  const usr = `Transcript:
${lines}

Pick the top ${maxHighlights} highlight(s).`;

  const lastEnd = segments[segments.length - 1]?.end ?? 0;
  let result: { highlights: Highlight[] };
  try {
    result = await analyzeWithClaude({
      systemPrompt: sys,
      userPrompt: usr,
      responseSchema: highlightSchema,
      maxTokens: 800,
    });
  } catch {
    // LLM bailed (too sparse, schema fail, etc.) — fall back to opening window.
    return [
      {
        start: 0,
        end: Math.min(targetSec, lastEnd || targetSec),
        reason: "Fallback: LLM returned no usable highlights",
        hookText: "Watch this",
        score: 40,
      },
    ];
  }

  const cleaned = result.highlights
    .map((h) => ({
      start: Math.max(0, h.start),
      end: Math.min(lastEnd, h.end),
      reason: h.reason,
      hookText: h.hookText,
      score: h.score,
    }))
    .filter((h) => h.end > h.start)
    .slice(0, maxHighlights);

  if (cleaned.length === 0) {
    return [
      {
        start: 0,
        end: Math.min(targetSec, lastEnd || targetSec),
        reason: "Fallback: cleaned highlights empty",
        hookText: "Watch this",
        score: 40,
      },
    ];
  }
  return cleaned;
}
