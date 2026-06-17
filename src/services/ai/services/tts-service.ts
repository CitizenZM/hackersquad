import OpenAI from "openai";
import { saveAudio } from "@/services/upload/file-storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

export type TTSVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

interface NarrationOptions {
  voice?: TTSVoice;
  speed?: number;
  storyGoal?: string;
}

const GOAL_VOICE_MAP: Record<string, { voice: TTSVoice; speed: number }> = {
  BEDTIME: { voice: "nova", speed: 0.9 },
  ENTERTAIN: { voice: "fable", speed: 1.0 },
  EDUCATE: { voice: "nova", speed: 0.95 },
  MORAL_LESSON: { voice: "nova", speed: 0.95 },
  VOCABULARY: { voice: "nova", speed: 0.9 },
};

export async function generateNarration(
  text: string,
  voiceOrOptions?: TTSVoice | NarrationOptions,
  episodeId?: string
): Promise<string> {
  if (process.env.MOCK_AI === "true") {
    return `/uploads/audio/mock-${episodeId || "test"}.mp3`;
  }

  let voice: TTSVoice = "nova";
  let speed = 1.0;

  if (typeof voiceOrOptions === "string") {
    voice = voiceOrOptions;
  } else if (voiceOrOptions) {
    const goalDefaults = voiceOrOptions.storyGoal
      ? GOAL_VOICE_MAP[voiceOrOptions.storyGoal]
      : undefined;
    voice = voiceOrOptions.voice || goalDefaults?.voice || "nova";
    speed = voiceOrOptions.speed || goalDefaults?.speed || 1.0;
  }

  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice,
    input: text,
    speed,
    response_format: "mp3",
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  const filename = `narration-${episodeId || Date.now()}.mp3`;
  return saveAudio(buffer, filename);
}
