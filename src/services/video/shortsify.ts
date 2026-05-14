import path from "node:path";
import { promises as fs } from "node:fs";
import { runProc } from "./binaries";
import type { TranscribedSegment } from "./transcribe";

export interface ShortsifyOptions {
  videoPath: string;
  start: number;
  end: number;
  outputDir: string;
  outputName?: string;
  segments?: TranscribedSegment[]; // for burning subtitles
  hookText?: string;
  aspectRatio?: "9:16" | "16:9" | "1:1";
}

export interface ShortsifyResult {
  outputPath: string;
  durationSec: number;
  width: number;
  height: number;
}

export async function shortsifyClip(
  opts: ShortsifyOptions
): Promise<ShortsifyResult> {
  const { videoPath, start, end, outputDir, segments, hookText } = opts;
  const aspect = opts.aspectRatio ?? "9:16";
  const name = opts.outputName ?? `clip-${Date.now()}.mp4`;
  const outputPath = path.join(outputDir, name);
  const subtitlePath = path.join(outputDir, "subs.srt");

  const duration = end - start;
  if (duration <= 0) throw new Error("end must be greater than start");

  // Detect whether this ffmpeg build supports drawtext/subtitles overlays.
  // Homebrew's default macOS ffmpeg ships WITHOUT libass and libfreetype, so
  // attempting either filter aborts the encode. We probe the filter list once
  // and persist the SRT as a sidecar regardless.
  let drawSubs = "";
  let drawHook = "";
  const overlayCaps = await ffmpegOverlayCaps();
  if (segments && segments.length > 0) {
    await fs.writeFile(subtitlePath, buildSRT(segments, start));
    if (overlayCaps.subtitles) {
      drawSubs = `,subtitles=subs.srt`;
    }
  }
  if (hookText && overlayCaps.drawtext) {
    const hookPath = path.join(outputDir, "hook.txt");
    await fs.writeFile(hookPath, hookText.slice(0, 80));
    drawHook = `,drawtext=textfile='hook.txt':fontcolor=white:fontsize=56:borderw=4:bordercolor=black:x=(w-text_w)/2:y=140`;
  }

  let scaleFilter = "";
  let outW = 0;
  let outH = 0;
  if (aspect === "9:16") {
    outW = 1080;
    outH = 1920;
    scaleFilter = `crop=ih*9/16:ih,scale=${outW}:${outH}:flags=lanczos`;
  } else if (aspect === "1:1") {
    outW = 1080;
    outH = 1080;
    scaleFilter = `crop=ih:ih,scale=${outW}:${outH}:flags=lanczos`;
  } else {
    outW = 1920;
    outH = 1080;
    scaleFilter = `scale=${outW}:${outH}:flags=lanczos`;
  }

  const filter = `${scaleFilter}${drawHook}${drawSubs}`;
  const outputName = path.basename(outputPath);

  const args = [
    "-y",
    "-ss", String(start),
    "-to", String(end),
    "-i", videoPath,
    "-vf", filter,
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    outputName,
  ];

  const { code, stderr } = await runProc("ffmpeg", args, { timeoutMs: 240_000, cwd: outputDir });
  if (code !== 0) throw new Error(`ffmpeg failed (${code}): ${stderr.slice(-400)}`);

  return { outputPath, durationSec: duration, width: outW, height: outH };
}

function buildSRT(segments: TranscribedSegment[], clipStart: number): string {
  let i = 1;
  const lines: string[] = [];
  for (const s of segments) {
    const a = s.start - clipStart;
    const b = s.end - clipStart;
    if (b < 0 || s.start < clipStart) continue;
    lines.push(String(i++));
    lines.push(`${fmtSRT(Math.max(0, a))} --> ${fmtSRT(Math.max(0, b))}`);
    lines.push(s.text.trim());
    lines.push("");
  }
  return lines.join("\n");
}

let _capsCache: { drawtext: boolean; subtitles: boolean } | null = null;
async function ffmpegOverlayCaps(): Promise<{ drawtext: boolean; subtitles: boolean }> {
  if (_capsCache) return _capsCache;
  try {
    const { stdout } = await runProc("ffmpeg", ["-hide_banner", "-filters"], { timeoutMs: 5000 });
    _capsCache = {
      drawtext: /\bdrawtext\b/.test(stdout),
      subtitles: /\bsubtitles\b/.test(stdout),
    };
  } catch {
    _capsCache = { drawtext: false, subtitles: false };
  }
  return _capsCache;
}

function fmtSRT(t: number): string {
  const ms = Math.floor((t % 1) * 1000);
  const totalSec = Math.floor(t);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)},${String(ms).padStart(3, "0")}`;
}
function pad(n: number): string {
  return String(n).padStart(2, "0");
}
