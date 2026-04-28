import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { analyzeWithClaude } from "@/services/ai/claude-client";

export const maxDuration = 60;

const veoShotSchema = z.object({
  project_meta: z.object({
    project_name: z.string(),
    brand: z.string(),
    product_name: z.string(),
    campaign_goal: z.string(),
    platform: z.string(),
    video_format: z.object({
      aspect_ratio: z.string(),
      resolution: z.string(),
      fps: z.number(),
      total_duration_seconds: z.number(),
      clip_duration_seconds: z.number(),
    }),
  }),
  character_system: z.object({
    main_character: z.object({
      role: z.string(),
      age: z.string(),
      gender: z.string(),
      appearance: z.string(),
      wardrobe: z.string(),
      personality: z.string(),
      emotional_state_start: z.string(),
      emotional_state_end: z.string(),
      speech_style: z.string(),
    }),
  }),
  environment_system: z.object({
    location: z.string(),
    time_of_day: z.string(),
    weather: z.string(),
    lighting: z.object({
      source: z.string(),
      direction: z.string(),
      quality: z.string(),
      mood: z.string(),
    }),
    props: z.array(z.string()),
  }),
  creative_strategy: z.object({
    creative_type: z.string(),
    tone: z.string(),
    hook_style: z.string(),
    story_arc: z.object({
      hook: z.string(),
      problem: z.string(),
      discovery: z.string(),
      product_use: z.string(),
      benefit_reveal: z.string(),
      cta: z.string(),
    }),
  }),
  shot_list: z.array(z.object({
    shot_id: z.string(),
    duration_seconds: z.number(),
    purpose: z.string(),
    scene_description: z.string(),
    character_action: z.string(),
    product_action: z.string(),
    camera_angle: z.string(),
    camera_movement: z.string(),
    shot_type: z.string(),
    lighting: z.string(),
    motion_effect: z.string(),
    dialogue_or_vo: z.string(),
    text_overlay: z.string(),
    cta: z.string(),
    negative_prompt: z.string(),
    veo_prompt: z.string(),
  })),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json();
  const { scriptId } = body;

  if (!scriptId) {
    return NextResponse.json({ error: "scriptId required" }, { status: 400 });
  }

  try {
    const [project, script, storyboard, audience, deepAnalysis] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId }, include: { brand: true } }),
      prisma.script.findUnique({ where: { id: scriptId } }),
      prisma.storyboard.findFirst({ where: { projectId, scriptId } }),
      prisma.audienceProfile.findUnique({ where: { projectId } }),
      prisma.deepAnalysis.findUnique({ where: { projectId } }),
    ]);

    if (!project || !script) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const brand = project.brand;
    const hooks = script.hookVariants as string[];
    const ctas = script.ctaVariants as string[];
    const segments = (audience?.segments as { name: string; ageRange: string; description: string }[]) || [];
    const vibeData = deepAnalysis?.vibeAnalysis as { dominantTones?: { tone: string }[]; pacingProfile?: string; visualStyleNotes?: string } | null;
    const ctaData = deepAnalysis?.ctaAnalysis as { commonCTAs?: { cta: string }[]; placement?: string } | null;

    const system = `You are a VEO3 video prompt engineer. Generate a complete VEO3-ready campaign JSON with shot-by-shot prompts.

Each shot MUST include a complete "veo_prompt" field — a single paragraph prompt ready to paste directly into VEO3/Veo 3.1 API. The veo_prompt must describe the visual scene, character, action, camera, lighting, and motion in one flowing paragraph WITHOUT any headers or labels. Do NOT include text/typography instructions in veo_prompt.

Generate 3 shots (8 seconds each = 24s total). Each shot serves a clear narrative purpose: hook → product reveal → benefit/CTA.

Output valid JSON matching the schema. Include all fields.`;

    const user = `Generate VEO3 campaign prompts for:

BRAND: ${project.brandName}
Product: ${brand?.valueProposition || project.brandName}
Brand promise: ${brand?.brandPromise || "N/A"}
Tone: ${brand?.toneOfVoice || "professional"}
Category: ${project.category || "N/A"}
Campaign goal: ${project.campaignGoal || "conversion"}
Platform: TikTok / Instagram Reels / YouTube Shorts

AUDIENCE:
${segments.map(s => `- ${s.name} (${s.ageRange}): ${s.description}`).join("\n") || "General US consumers"}

VIBE (from content analysis):
- Tones: ${vibeData?.dominantTones?.map(t => t.tone).join(", ") || "professional, dynamic"}
- Pacing: ${vibeData?.pacingProfile || "fast-paced"}
- Visual: ${vibeData?.visualStyleNotes || "clean, modern"}
- CTA style: ${ctaData?.commonCTAs?.map(c => c.cta).join(", ") || "Shop now"}

SCRIPT:
Title: ${script.title}
Format: ${script.format} · ${script.duration}
Emotion: ${script.targetEmotion}

Hook options:
${hooks.map((h, i) => `${i + 1}. ${h}`).join("\n")}

Body:
${script.body}

CTA options:
${ctas.map((c, i) => `${i + 1}. ${c}`).join("\n")}

${storyboard ? `STORYBOARD REFERENCE:
${(storyboard.frames as { frameNumber: number; scene: string; voiceover: string; cameraNotes: string }[]).map(f => `Frame ${f.frameNumber}: ${f.scene} | Camera: ${f.cameraNotes} | VO: ${f.voiceover}`).join("\n")}` : ""}

Generate 3 VEO3 shots (8s each). Each shot must have a complete veo_prompt paragraph. Format: vertical 9:16, 1080p, 24fps.`;

    const result = await analyzeWithClaude({
      systemPrompt: system,
      userPrompt: user,
      responseSchema: veoShotSchema,
      maxTokens: 4096,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("VEO prompt generation failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate VEO prompts" },
      { status: 500 }
    );
  }
}
