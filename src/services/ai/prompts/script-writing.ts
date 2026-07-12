import { getPlatformPlaybook, getHookFormulas } from "./platform-playbooks";

export interface ScriptInput {
  brandName: string;
  productName?: string;
  productDescription?: string;
  angle: {
    title: string;
    description: string;
    targetEmotion: string;
    narrativeType: string;
    predictedScore?: number;
  };
  sellingPoints: string[];
  campaignGoal?: string;
  platform?: string;
  totalDurationSec?: number;
  selectedEnvironment?: string;
  selectedActorRole?: string;
  selectedActorDesc?: string;
  videoTimeline?: Array<{segment: string; startSec: number; endSec: number; label: string; description: string}>;
  hookFormulas?: Array<{type: string; formula: string; openingLine: string; visualDescription: string}>;
  cameraAngles?: Array<{shot: string; movement: string; whenToUse: string}>;
  environmentNotes?: string;
  audienceSummary?: string;
  briefing?: string;
  /** Campaign platform id from CAMPAIGN_PLATFORMS (tiktok|instagram|youtube|tvc|amazon). Drives playbook + hook-formula injection. */
  platformId?: string;
  /** Optional "what's working in this niche" research summary derived from DeepAnalysis.platformInsights. */
  nicheResearch?: string;
}

export function buildScriptWritingPrompt(input: ScriptInput) {
  const durationSec = input.totalDurationSec || 30;
  const platform = input.platform || "video";
  const platformId = input.platformId || input.platform;

  const platformPlaybook = getPlatformPlaybook(platformId);
  const platformHookFormulas = getHookFormulas(platformId);
  const hookFormulaNamesBlock = `\nPLATFORM HOOK FORMULAS (each hookVariant must reference one of these NAMES):\n${platformHookFormulas
    .map((h) => `- ${h.name}: ${h.pattern} (When to use: ${h.whenToUse})`)
    .join("\n")}`;

  const system = `You are a senior creative director and script writer for ${platform} ads.
Write a DETAILED, production-ready video ad script that a director can shoot directly from.

${platformPlaybook}
${hookFormulaNamesBlock}

SCRIPT REQUIREMENTS:
- Every scene must specify: exact shot type + focal length + camera movement + duration
- Every character action must be described at millimeter precision (not "she smiles" → "left corner of mouth rises 0.5cm, exhale through nose, eyes soften")
- Every environment must be specified: room type + lighting source + color temperature + key props
- Hook must match one of the provided hook formulas exactly (if provided) AND must apply the platform playbook's opening-frame requirements above
- Apply the platform playbook's constraints throughout (safe zones, sound-on/sound-off design, CTA rules, pacing) — do not default to generic ad conventions that violate this platform's norms
- Total script must sum to EXACTLY ${durationSec} seconds
- Scene durations must add up to exactly ${durationSec} seconds — no rounding

OUTPUT JSON (no markdown, no extra keys):
{
  "title": "string",
  "angle": "string",
  "format": "short_form|long_form|ugc|testimonial|tvc",
  "duration": "string e.g. '30s'",
  "platform": "string",
  "totalDurationSec": number,
  "hookVariants": ["3 distinct hooks — each formatted as '[hook-formula-name] opening visual + first spoken word', using one of the platform hook formula names above per variant"],
  "body": "FULL SCRIPT with [SCENE X: Xs-Xs] markers, camera directions, VO text, actor actions",
  "ctaVariants": ["3 distinct CTAs with visual direction — must respect the platform playbook's CTA rules (e.g. no external CTAs on Amazon PDP)"],
  "narrativeType": "PROBLEM_SOLUTION|TESTIMONIAL|DEMONSTRATION|LIFESTYLE|EDUCATIONAL|COMPARISON|STORY_ARC|UGC_STYLE|TREND_RIDING|BEFORE_AFTER",
  "targetEmotion": "string",
  "predictedScore": number,
  "platformTechniques": ["list each specific playbook technique actually applied in this script, e.g. 'native text overlay in frame 1', 'loop-ability last-frame match', 'sound-off caption fallback'"],
  "scenes": [
    {
      "sceneNumber": 1,
      "startSec": 0,
      "endSec": 5,
      "segmentLabel": "Hook",
      "shotType": "Extreme close-up",
      "focalLength": "100mm macro",
      "cameraMovement": "Static, then slow push-in over 3 seconds",
      "aperture": "f/1.8",
      "location": "Modern living room — honed marble floor, golden retriever fur visible",
      "lighting": "5200K natural window light from camera-left, 3:1 ratio",
      "actorAction": "Woman (32yo, South Asian, linen tee) bends to vacuum — does NOT look at camera",
      "productAction": "Product brush head engages carpet, dust visible being drawn in",
      "voiceover": "Exact VO text here",
      "textOverlay": "None",
      "transition": "Cut on motion to Scene 2"
    }
  ]
}`;

  const hookFormulasBlock = input.hookFormulas?.length
    ? `\nHOOK FORMULAS TO USE (pick ONE for the primary hook):\n${input.hookFormulas.map((h, i) =>
        `${i + 1}. [${h.type}] Formula: ${h.formula}\n   Opening line: "${h.openingLine}"\n   Visual: ${h.visualDescription}`
      ).join("\n")}`
    : "";

  const cameraAnglesBlock = input.cameraAngles?.length
    ? `\nAPPROVED CAMERA ANGLES:\n${input.cameraAngles.map((c, i) =>
        `${i + 1}. ${c.shot} | Movement: ${c.movement} | Use when: ${c.whenToUse}`
      ).join("\n")}`
    : "";

  const timelineBlock = input.videoTimeline?.length
    ? `\nVIDEO TIMELINE STRUCTURE (follow this segment plan exactly):\n${input.videoTimeline.map(t =>
        `[${t.startSec}s–${t.endSec}s] ${t.segment} — ${t.label}: ${t.description}`
      ).join("\n")}`
    : "";

  const environmentBlock = input.selectedEnvironment
    ? `\nSELECTED ENVIRONMENT: ${input.selectedEnvironment}${input.environmentNotes ? `\nEnvironment notes: ${input.environmentNotes}` : ""}`
    : "";

  const actorBlock = input.selectedActorRole
    ? `\nSELECTED ACTOR ROLE: ${input.selectedActorRole}${input.selectedActorDesc ? `\nActor visual description: ${input.selectedActorDesc}` : ""}`
    : "";

  const nicheResearchBlock = input.nicheResearch
    ? `\nWHAT'S WORKING IN THIS NICHE (from prior content research — use to inform choices, don't copy verbatim):\n${input.nicheResearch.slice(0, 1500)}`
    : "";

  const user = `Write a production-ready ${durationSec}-second ${platform} ad script for "${input.brandName}":

PRODUCT: ${input.productName || input.brandName}
${input.productDescription ? `PRODUCT DESCRIPTION: ${input.productDescription}` : ""}

CREATIVE ANGLE: ${input.angle.title}
Angle Description: ${input.angle.description}
Target Emotion: ${input.angle.targetEmotion}
Narrative Type: ${input.angle.narrativeType}
${input.angle.predictedScore ? `Predicted Score: ${input.angle.predictedScore}` : ""}
Campaign Goal: ${input.campaignGoal || "Conversion"}
${input.audienceSummary ? `\n${input.audienceSummary}` : ""}

KEY SELLING POINTS (weave all in, prioritize top 3):
${input.sellingPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}
${environmentBlock}
${actorBlock}
${hookFormulasBlock}
${cameraAnglesBlock}
${timelineBlock}
${nicheResearchBlock}

${input.briefing ? `PROJECT BRIEF:\n${input.briefing.slice(0, 1000)}` : ""}

DELIVERABLE:
- scenes[] must contain every second: scenes[n].endSec - scenes[n].startSec summing to exactly ${durationSec}
- 3 hook variants (each with unique visual direction + opening word, each tagged with the platform hook formula name used)
- Full body script with [SCENE X: Xs-Xs] markers
- 3 CTA variants with visual direction, respecting this platform's CTA rules
- platformTechniques[] listing the concrete playbook techniques actually applied
- Every scene must have: shotType, focalLength, cameraMovement, aperture, location, lighting, actorAction, productAction, voiceover, textOverlay, transition`;

  return { system, user };
}
