import { promises as fs } from "node:fs";
import path from "node:path";
import { runProc } from "./binaries";

export interface TranscribedSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptResult {
  text: string;
  segments: TranscribedSegment[];
  language?: string;
  source: "groq" | "openai" | "none";
}

// Prefer Groq's whisper-large-v3 (free tier, fast). Fall back to OpenAI Whisper.
// If neither key is set, return a graceful no-transcript result.
export async function transcribeAudio(videoPath: string): Promise<TranscriptResult> {
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // Convert to mono 16kHz wav for cheaper transcription
  const wavPath = videoPath.replace(/\.[^.]+$/, ".wav");
  try {
    await runProc(
      "ffmpeg",
      ["-y", "-i", videoPath, "-ac", "1", "-ar", "16000", "-vn", wavPath],
      { timeoutMs: 60_000 }
    );
  } catch {
    return { text: "", segments: [], source: "none" };
  }

  const buf = await fs.readFile(wavPath);

  if (groqKey) {
    try {
      return await transcribeGroq(buf, path.basename(wavPath), groqKey);
    } catch (err) {
      console.error("Groq transcribe failed:", err);
    }
  }
  if (openaiKey) {
    try {
      return await transcribeOpenAI(buf, path.basename(wavPath), openaiKey);
    } catch (err) {
      console.error("OpenAI transcribe failed:", err);
    }
  }
  return { text: "", segments: [], source: "none" };
}

async function transcribeGroq(
  buffer: Buffer,
  filename: string,
  key: string
): Promise<TranscriptResult> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: "audio/wav" }), filename);
  form.append("model", "whisper-large-v3");
  form.append("response_format", "verbose_json");
  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data: { text: string; language?: string; segments?: { start: number; end: number; text: string }[] } =
    await res.json();
  return {
    text: data.text || "",
    segments: data.segments || [],
    language: data.language,
    source: "groq",
  };
}

async function transcribeOpenAI(
  buffer: Buffer,
  filename: string,
  key: string
): Promise<TranscriptResult> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: "audio/wav" }), filename);
  form.append("model", "whisper-1");
  form.append("response_format", "verbose_json");
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data: { text: string; language?: string; segments?: { start: number; end: number; text: string }[] } =
    await res.json();
  return {
    text: data.text || "",
    segments: data.segments || [],
    language: data.language,
    source: "openai",
  };
}
