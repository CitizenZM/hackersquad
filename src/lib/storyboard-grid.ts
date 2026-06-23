// Fixed 3-second storyboard grid.
//
// A storyboard renders ONE keyframe per 3 seconds of the video, so a 30s ad
// becomes 10 frames at 0–3s, 3–6s, … 27–30s. These helpers compute that grid,
// map the script's free-form scenes onto each window, and repair whatever the
// LLM returns so the grid is always exact and gap-free.

export const FRAME_SECONDS = 3;
export const MAX_FRAMES = 10; // 30s ceiling at 3s/frame

export interface GridWindow {
  frameNumber: number; // 1-based
  startSec: number;
  endSec: number;
  duration: string; // "0s-3s"
}

/**
 * Build the 3-second window grid for a given total duration.
 * Capped at MAX_FRAMES. The final window may be shorter than 3s.
 */
export function computeWindows(totalDurationSec: number): GridWindow[] {
  const total = Math.max(FRAME_SECONDS, Math.round(totalDurationSec) || 30);
  const count = Math.min(MAX_FRAMES, Math.ceil(total / FRAME_SECONDS));
  const windows: GridWindow[] = [];
  for (let i = 0; i < count; i++) {
    const startSec = i * FRAME_SECONDS;
    const endSec = Math.min(total, startSec + FRAME_SECONDS);
    windows.push({
      frameNumber: i + 1,
      startSec,
      endSec,
      duration: `${startSec}s-${endSec}s`,
    });
  }
  return windows;
}

export interface SceneLike {
  startSec?: number;
  endSec?: number;
  segmentLabel?: string;
  shotType?: string;
  focalLength?: string;
  cameraMovement?: string;
  aperture?: string;
  location?: string;
  lighting?: string;
  actorAction?: string;
  productAction?: string;
  voiceover?: string;
  textOverlay?: string;
  transition?: string;
}

/**
 * Find the script scene that best overlaps a window — the scene covering the
 * window's midpoint, falling back to the nearest by start time.
 */
export function sceneForWindow(
  scenes: SceneLike[],
  win: GridWindow
): SceneLike | null {
  if (!scenes.length) return null;
  const mid = (win.startSec + win.endSec) / 2;
  const overlapping = scenes.find(
    (s) =>
      typeof s.startSec === "number" &&
      typeof s.endSec === "number" &&
      mid >= s.startSec &&
      mid < s.endSec
  );
  if (overlapping) return overlapping;
  // Nearest by start time.
  let best: SceneLike | null = null;
  let bestDist = Infinity;
  for (const s of scenes) {
    const start = typeof s.startSec === "number" ? s.startSec : 0;
    const dist = Math.abs(start - win.startSec);
    if (dist < bestDist) {
      bestDist = dist;
      best = s;
    }
  }
  return best;
}

/**
 * Render the cinematography of a scene as a compact, prompt-ready digest used
 * to ground each frame's image prompt in the script's actual plan.
 */
export function sceneDigest(scene: SceneLike | null): string {
  if (!scene) return "(no matching script scene — infer from narrative)";
  const parts: string[] = [];
  if (scene.shotType) parts.push(`Shot: ${scene.shotType}`);
  if (scene.focalLength) parts.push(`Lens: ${scene.focalLength}`);
  if (scene.aperture) parts.push(`Aperture: ${scene.aperture}`);
  if (scene.cameraMovement) parts.push(`Move: ${scene.cameraMovement}`);
  if (scene.location) parts.push(`Location: ${scene.location}`);
  if (scene.lighting) parts.push(`Lighting: ${scene.lighting}`);
  if (scene.actorAction) parts.push(`Actor: ${scene.actorAction}`);
  if (scene.productAction) parts.push(`Product: ${scene.productAction}`);
  if (scene.voiceover) parts.push(`VO: "${scene.voiceover}"`);
  if (scene.textOverlay) parts.push(`Text: "${scene.textOverlay}"`);
  return parts.length ? parts.join(" · ") : "(scene has no detail)";
}

export interface RawFrame {
  frameNumber?: number;
  duration?: string;
  scene?: string;
  visualDirection?: string;
  voiceover?: string;
  textOverlay?: string;
  cameraNotes?: string;
  imagePrompt?: string;
  startSec?: number;
  endSec?: number;
  [k: string]: unknown;
}

export interface GridFrame {
  frameNumber: number;
  startSec: number;
  endSec: number;
  duration: string;
  scene: string;
  visualDirection: string;
  voiceover: string;
  textOverlay: string;
  cameraNotes: string;
  imagePrompt: string;
}

/**
 * Stamp LLM output onto the exact grid: re-number frames, force exact
 * start/end/duration per window, and guarantee a frame exists for every
 * window (padding from the matching scene if the model returned too few).
 * Extra frames beyond the grid are dropped.
 */
export function repairFrames(
  raw: RawFrame[],
  windows: GridWindow[],
  scenes: SceneLike[]
): GridFrame[] {
  // Index raw frames by their declared frameNumber so a skipped or reordered
  // frame can't shift every later window's content by one (positional
  // alignment would). Fall back to positional order for frames that declared
  // no usable frameNumber.
  const byNumber = new Map<number, RawFrame>();
  const unnumbered: RawFrame[] = [];
  for (const f of raw) {
    const n = typeof f.frameNumber === "number" ? f.frameNumber : NaN;
    if (Number.isFinite(n) && !byNumber.has(n)) byNumber.set(n, f);
    else unnumbered.push(f);
  }

  return windows.map((win, i) => {
    const src = byNumber.get(win.frameNumber) ?? unnumbered[i] ?? {};
    const scene = sceneForWindow(scenes, win);
    const fallbackScene =
      scene?.actorAction ||
      scene?.productAction ||
      scene?.segmentLabel ||
      `Beat ${win.frameNumber}`;
    return {
      frameNumber: win.frameNumber,
      startSec: win.startSec,
      endSec: win.endSec,
      duration: win.duration,
      scene: String(src.scene ?? fallbackScene),
      visualDirection: String(src.visualDirection ?? ""),
      voiceover: String(src.voiceover ?? scene?.voiceover ?? ""),
      textOverlay: String(src.textOverlay ?? scene?.textOverlay ?? ""),
      cameraNotes: String(src.cameraNotes ?? scene?.cameraMovement ?? ""),
      imagePrompt: String(src.imagePrompt ?? ""),
    };
  });
}
