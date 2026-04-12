import OpenAI from "openai";
import { saveAudio } from "@/services/upload/file-storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

export type TTSVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

export async function generateNarration(
  text: string,
  voice: TTSVoice = "nova",
  episodeId?: string
): Promise<string> {
  if (process.env.MOCK_AI === "true") {
    return `/uploads/audio/mock-${episodeId || "test"}.mp3`;
  }

  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice,
    input: text,
    response_format: "mp3",
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  const filename = `narration-${episodeId || Date.now()}.mp3`;
  return saveAudio(buffer, filename);
}
